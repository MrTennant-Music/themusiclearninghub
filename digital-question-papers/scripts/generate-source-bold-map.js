"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "../..");
const papersRoot = path.join(root, "digital-question-papers");
const registry = require(path.join(papersRoot, "paper-registry.js"));
const pdftohtml = process.env.PDFTOHTML || "/Users/bobbytennant/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/poppler/bin/pdftohtml";

function decode(value) {
  return String(value)
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

function normalise(value) {
  return decode(value)
    .replace(/^[•·]\s*/, "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("en-GB");
}

const renderedStringKeys = new Set([
  "intro",
  "openingInstructions",
  "outro",
  "prompt",
  "promptLines",
  "leadLines",
  "beforeAnswerLines",
  "afterAnswerLines",
  "instruction",
  "instructionLines",
  "scoreFollowingLines",
  "finalAnswerIntro",
  "groupStart",
]);

function collectDigital(value, currentPath = "question", result = [], parentKey = "") {
  if (typeof value === "string") {
    if (renderedStringKeys.has(parentKey)) result.push({ path: currentPath, text: value, normal: normalise(value) });
    return result;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectDigital(item, `${currentPath}[${index}]`, result, parentKey));
    return result;
  }
  if (!value || typeof value !== "object") return result;
  for (const [key, item] of Object.entries(value)) {
    if (key === "prompt" && Array.isArray(value.promptLines)) continue;
    collectDigital(item, `${currentPath}.${key}`, result, key);
  }
  return result;
}

function sourceLines(pdfPath) {
  const run = spawnSync(pdftohtml, ["-xml", "-hidden", "-nodrm", "-stdout", pdfPath], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (run.status !== 0) throw new Error(run.stderr || `pdftohtml failed for ${pdfPath}`);
  let page = 0;
  let question = null;
  const fragments = [];
  for (const xmlLine of run.stdout.split(/\r?\n/)) {
    const pageMatch = xmlLine.match(/<page number="(\d+)"/);
    if (pageMatch) page = Number(pageMatch[1]);
    const textMatch = xmlLine.match(/<text top="(\d+)" left="(\d+)" width="(\d+)"[^>]*>([\s\S]*?)<\/text>/);
    if (!textMatch) continue;
    const text = decode(textMatch[4]);
    if (!text) continue;
    const questionMatch = normalise(text).match(/^question\s+(\d+)\b/);
    if (questionMatch) question = Number(questionMatch[1]);
    fragments.push({
      page,
      question,
      top: Number(textMatch[1]),
      left: Number(textMatch[2]),
      width: Number(textMatch[3]),
      text,
      bold: /<b>/.test(textMatch[4]),
      boldTexts: [...textMatch[4].matchAll(/<b>([\s\S]*?)<\/b>/g)].map(match => decode(match[1])).filter(Boolean),
    });
  }

  const lines = [];
  for (const fragment of fragments) {
    let line = lines.find(item => item.page === fragment.page && item.question === fragment.question && Math.abs(item.top - fragment.top) <= 1);
    if (!line) {
      line = { page: fragment.page, question: fragment.question, top: fragment.top, fragments: [] };
      lines.push(line);
    }
    line.fragments.push(fragment);
  }
  lines.forEach(line => line.fragments.sort((a, b) => a.left - b.left));
  return lines.filter(line => line.fragments.some(fragment => fragment.bold));
}

const ignored = /^(?:marks?|question\s+\d+(?:\s*\([^)]*\))?(?:\s*\(continued\))?|\d+|\[?turn\s+over.*|\[?end of question paper\]?|\[?blank page\]?|do not write on this page|acknowledgement of copyright|qualifications scotland has made every effort.*|sqa has made every effort.*|question paper,? and seek permissions.*|permissions\..*|incorporate any missing.*|please contact .*|final answer|rough work|categories|excerpt [12]|additional space for answers|total marks?\s*-\s*\d+|attempt all questions|music|ah|n5|h)$/i;
const structural = /^(?:[a-g](?:#|b)?|i{1,3}|iv|v|vi|vii|v7|ivb|vb|[a-g]\s+1st inv\.|\d+\.)$/i;

function exactPhraseFor(text, phrase) {
  const lowerText = text.toLocaleLowerCase("en-GB");
  const lowerPhrase = phrase.toLocaleLowerCase("en-GB");
  const directIndex = lowerText.indexOf(lowerPhrase);
  if (directIndex >= 0) return text.slice(directIndex, directIndex + phrase.length);
  const normalPhrase = normalise(phrase);
  const words = normalPhrase.match(/[\p{L}\p{N}]+/gu) || [];
  if (!words.length) return null;
  const pattern = new RegExp(words.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[\\s‘’'“”\"–—-]*"), "iu");
  return text.match(pattern)?.[0] || null;
}

const map = {};
const unresolved = [];
let mappedOccurrences = 0;

for (const entry of Object.values(registry)) {
  const paper = require(path.join(papersRoot, entry.dataFile.split("?")[0]));
  const pdfPath = path.resolve(papersRoot, paper.sourcePath);
  const paperMap = {};
  const mapForQuestion = question => (paperMap[`q${question}`] ||= {});
  const pending = [];
  const questions = new Map((paper.questions || []).map(question => [Number(question.number), collectDigital(question)]));
  if (Array.isArray(paper.openingInstructions) && questions.has(1)) {
    questions.get(1).push(...collectDigital({ openingInstructions: paper.openingInstructions }, "paper"));
  }

  for (const line of sourceLines(pdfPath)) {
    if (!line.question || !questions.has(line.question)) continue;
    // pdftohtml may emit regular and bold runs inside one text element.
    // Only its actual <b> spans are bold, never the whole mixed sentence.
    const boldFragments = line.fragments.flatMap(fragment => fragment.boldTexts.map(text => ({ ...fragment, text })));
    const lineText = line.fragments.map(fragment => fragment.text).join(" ").replace(/\s+/g, " ").trim();
    const lineNormal = normalise(lineText).replace(/^\(?[a-zivx]+\)?\s+/, "");
    const strings = questions.get(line.question);
    for (const fragment of boldFragments) {
      const phraseNormal = normalise(fragment.text);
      if (!phraseNormal || phraseNormal.length < 2 || ignored.test(phraseNormal) || structural.test(phraseNormal)) continue;
      let matches = strings.filter(item => lineNormal.length >= 8 && (item.normal.includes(lineNormal) || lineNormal.includes(item.normal)));
      if (!matches.length) matches = strings.filter(item => item.normal.includes(phraseNormal));
      if (matches.length > 1) {
        const contextual = matches.filter(item => lineNormal.length >= 5 && item.normal.includes(lineNormal));
        if (contextual.length) matches = contextual;
      }
      matches = [...new Map(matches.map(item => [item.normal, item])).values()];
      if (matches.length > 1) {
        pending.push({ id: entry.id, question: line.question, page: line.page, phrase: fragment.text, phraseNormal, line: lineText, matches });
        continue;
      }
      if (!matches.length) {
        unresolved.push({ id: entry.id, question: line.question, page: line.page, phrase: fragment.text, line: lineText });
        continue;
      }
      for (const match of matches) {
        const exactPhrase = exactPhraseFor(match.text, fragment.text);
        if (!exactPhrase) continue;
        const key = normalise(match.text);
        const questionMap = mapForQuestion(line.question);
        questionMap[key] ||= [];
        if (!questionMap[key].includes(exactPhrase)) questionMap[key].push(exactPhrase);
        mappedOccurrences += 1;
      }
    }
  }
  let resolvedPending = true;
  while (resolvedPending) {
    resolvedPending = false;
    for (const item of pending) {
      if (item.resolved) continue;
      const remaining = item.matches.filter(match => {
        const phrases = mapForQuestion(item.question)[normalise(match.text)] || [];
        return !phrases.some(phrase => normalise(phrase) === item.phraseNormal);
      });
      if (remaining.length !== 1) continue;
      const match = remaining[0];
      const exactPhrase = exactPhraseFor(match.text, item.phrase);
      if (!exactPhrase) continue;
      const key = normalise(match.text);
      const questionMap = mapForQuestion(item.question);
      questionMap[key] ||= [];
      if (!questionMap[key].includes(exactPhrase)) questionMap[key].push(exactPhrase);
      mappedOccurrences += 1;
      item.resolved = true;
      resolvedPending = true;
    }
  }
  pending.filter(item => !item.resolved).forEach(item => unresolved.push({
    id: item.id,
    question: item.question,
    page: item.page,
    phrase: item.phrase,
    line: item.line,
    ambiguity: item.matches.map(match => match.path),
  }));
  for (const questionMap of Object.values(paperMap)) {
    for (const phrases of Object.values(questionMap)) phrases.sort((a, b) => b.length - a.length || a.localeCompare(b));
  }
  map[entry.id] = Object.fromEntries(Object.entries(paperMap).sort(([a], [b]) => a.localeCompare(b)));
}

function addManualOverride(paperId, questionId, text, phrases) {
  const paper = require(path.join(papersRoot, registry[paperId].dataFile.split("?")[0]));
  const question = paper.questions.find(item => item.id === questionId);
  const strings = [...collectDigital(question), ...question.subquestions.filter(part => typeof part.label === "string").map(part => ({ text: part.label, normal: normalise(part.label) }))];
  // Source paragraphs may now be split into several rendered lines. Never
  // recreate an obsolete combined paragraph just to attach an override.
  const comparable = value => normalise(value).replace(/\s*\(✓\)/g, "");
  const targets = strings.filter(item => comparable(item.normal) === comparable(text));
  if (!targets.length) {
    for (const item of strings.filter(item => item.normal.length > 10 && comparable(text).includes(comparable(item.normal)))) {
      const contained = phrases.filter(phrase => containsPhrase(item.normal, phrase));
      if (contained.length) addManualOverride(paperId, questionId, item.text, contained);
    }
    return;
  }
  map[paperId] ||= {};
  map[paperId][questionId] ||= {};
  const key = targets[0].normal;
  map[paperId][questionId][key] ||= [];
  for (const phrase of phrases) if (!map[paperId][questionId][key].includes(phrase)) map[paperId][questionId][key].push(phrase);
  map[paperId][questionId][key].sort((a, b) => b.length - a.length || a.localeCompare(b));
}

function containsPhrase(text, phrase) {
  const escaped = normalise(phrase).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`).test(normalise(text));
}

addManualOverride("advanced-higher-2016", "q2", "Tick one box to identify the correct version of the rhythm played by the brass instruments.", ["brass"]);
addManualOverride("advanced-higher-2022", "q2", "Identify the chords used in bars 1 and 2. You should indicate the chord name or number and, where appropriate, 1st or 2nd inversion or 7th. The first and last chords have been completed for you. The key is C major.", ["or", "and"]);
addManualOverride("advanced-higher-2023", "q1", "Now listen to a new excerpt and give the order in which the voices enter with the text, ‘And cast away’.", ["‘And cast away’"]);
addManualOverride("advanced-higher-2023", "q4", "In bar 12, above the word ‘her’, write a crotchet which is a 4th higher than the first note in the bar.", ["4th", "higher"]);
addManualOverride("advanced-higher-2024", "q5", "Listen to a new excerpt. Tick one box to indicate the order in which the different instruments enter.", ["one"]);
addManualOverride("advanced-higher-2024", "q5", "Listen to a new excerpt and tick one box to indicate the rhythm played on the wood block. The excerpt is short and begins with a 4-bar introduction.", ["one"]);
addManualOverride("advanced-higher-2026", "q2", "same pitch.", ["same pitch"]);
addManualOverride("advanced-higher-2026", "q5", "Listen to a continuation of this excerpt and tick one box to identify the correct version of the music.", ["one"]);
addManualOverride("advanced-higher-2026", "q5", "Listen to this excerpt and tick one box to indicate the order in which the solo instruments enter.", ["one"]);
addManualOverride("higher-2018", "q6", "The music will be played twice.", ["twice"]);
addManualOverride("higher-2018", "q6", "The excerpt will be played twice.", ["twice"]);
addManualOverride("national5-2024", "q1", "Listen to this excerpt and identify the instrument playing con sordino.", ["con sordino"]);

// Source category instructions use regular Tick, with bold “one” from 2017.
// Do not inherit the bold Tick column heading into the instruction sentence.
for (const paperId of Object.keys(map).filter(id => id.startsWith("national5-"))) {
  const sourcePaper = require(path.join(papersRoot, registry[paperId].dataFile.split("?")[0]));
  const question = sourcePaper.questions.find(item => item.id === "q5");
  for (const part of question?.subquestions || []) {
    if (/^tick\b/i.test(part.instruction || "")) {
      if (Number(paperId.slice(-4)) >= 2017) map[paperId].q5[normalise(part.instruction)] = ["one"];
      else delete map[paperId].q5[normalise(part.instruction)];
    }
  }
}

for (const paperId of ["higher-2019", "higher-2024", "higher-2025", "higher-2026"]) {
  for (const label of ["1.", "2.", "3.", "4.", "5."]) addManualOverride(paperId, "q2", label, [label]);
}
addManualOverride("advanced-higher-2018", "q3", "4.", ["4."]);

// Keep previously audited PDF ambiguities separate from generated output so a
// regeneration cannot erase paper-specific source corrections. Discard an
// override if its rendered wording has changed; the fidelity test also checks it.
const overrides = JSON.parse(fs.readFileSync(path.join(papersRoot, "source-bold-overrides.json"), "utf8"));
for (const [paperId, questions] of Object.entries(overrides)) {
  const paper = require(path.join(papersRoot, registry[paperId].dataFile.split("?")[0]));
  for (const [questionId, rows] of Object.entries(questions)) {
    const question = paper.questions.find(item => item.id === questionId);
    const strings = collectDigital(question).map(item => item.normal);
    for (const [text, phrases] of Object.entries(rows)) {
      if (strings.includes(text) && phrases.every(phrase => containsPhrase(text, phrase))) {
        map[paperId] ||= {};
        map[paperId][questionId] ||= {};
        map[paperId][questionId][text] = phrases;
      }
    }
  }
}

const output = `/* Generated from the official Qualifications Scotland question-paper PDFs.\n` +
  ` * Keys are normalised complete source-paper strings; values are the exact substrings that are bold in the PDF.\n` +
  ` * Regenerate with scripts/generate-source-bold-map.js and verify with tests/source-bold-fidelity.test.js.\n` +
  ` */\n(function (root) {\n  \"use strict\";\n  root.InteractiveExamSourceBold = ${JSON.stringify(map, null, 2)};\n})(typeof globalThis !== \"undefined\" ? globalThis : window);\n`;
const sourceStyles = JSON.parse(fs.readFileSync(path.join(papersRoot, "source-style-overrides.json"), "utf8"));
const styleOutput = `\n/* Source-reviewed exact occurrence styles, including regular text and italics. */\n` +
  `(typeof globalThis !== "undefined" ? globalThis : window).InteractiveExamSourceStyles = ${JSON.stringify(sourceStyles, null, 2)};\n`;
fs.writeFileSync(path.join(papersRoot, "source-bold-map.js"), output + styleOutput);
process.stdout.write(`Mapped ${mappedOccurrences} source-bold occurrences across ${Object.keys(map).length} papers.\n`);
process.stdout.write(`Unresolved ${unresolved.length} source-bold occurrences.\n`);
unresolved.slice(0, 250).forEach(item => process.stdout.write(`${item.id} q${item.question} p${item.page}: ${JSON.stringify(item.phrase)} in ${JSON.stringify(item.line)}\n`));
