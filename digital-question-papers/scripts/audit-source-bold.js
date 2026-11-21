"use strict";

// Reports source-PDF bold runs that are not covered by paper metadata or source-bold-map.js.

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "../..");
const papersRoot = path.join(root, "digital-question-papers");
const registry = require(path.join(papersRoot, "paper-registry.js"));
require(path.join(papersRoot, "source-bold-map.js"));
const sourceBoldMap = globalThis.InteractiveExamSourceBold || {};
const pdftohtml = "/Users/bobbytennant/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/poppler/bin/pdftohtml";

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
    .replace(/[–—]/g, "-")
    .replace(/\s+([,.;:!?])/g, "$1")
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
  "label",
  "groupStart",
]);

function walk(value, currentPath = "question", result = { strings: [], bold: [] }, parentKey = "") {
  if (typeof value === "string") {
    if (renderedStringKeys.has(parentKey)) {
      result.strings.push({ path: currentPath, value: normalise(value) });
    }
    return result;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${currentPath}[${index}]`, result, parentKey));
    return result;
  }
  if (!value || typeof value !== "object") return result;
  for (const [key, item] of Object.entries(value)) {
    if (/boldphrases$/i.test(key) && Array.isArray(item)) {
      item.forEach((phrase, index) => result.bold.push({ path: `${currentPath}.${key}[${index}]`, value: normalise(phrase) }));
    }
    walk(item, `${currentPath}.${key}`, result, key);
  }
  return result;
}

function sourceBold(pdfPath) {
  const run = spawnSync(pdftohtml, ["-xml", "-hidden", "-nodrm", "-stdout", pdfPath], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (run.status !== 0) throw new Error(run.stderr || `pdftohtml failed for ${pdfPath}`);
  let page = 0;
  let question = null;
  const rows = [];
  for (const line of run.stdout.split(/\r?\n/)) {
    const pageMatch = line.match(/<page number="(\d+)"/);
    if (pageMatch) page = Number(pageMatch[1]);
    const value = normalise(line);
    const questionMatch = value.match(/^question\s+(\d+)\b/);
    if (questionMatch) question = Number(questionMatch[1]);
    for (const match of line.matchAll(/<b>([\s\S]*?)<\/b>/g)) {
      const boldValue = normalise(match[1]);
      if (boldValue) rows.push({ page, question, value: boldValue });
    }
  }
  return rows;
}

const ignored = /^(?:marks?|question\s+\d+(?:\s*\([^)]*\))?(?:\s*\(continued\))?|\d+|\[?turn\s+over.*|\[?end of question paper\]?|final answer|rough work|categories|excerpt [12]|additional space for answers|total marks?\s*-\s*\d+|attempt all questions|music|ah|n5|h)$/i;
const report = [];

for (const entry of Object.values(registry)) {
  const dataFile = entry.dataFile.split("?")[0];
  const paper = require(path.join(papersRoot, dataFile));
  const pdfPath = path.resolve(papersRoot, paper.sourcePath);
  const boldRuns = sourceBold(pdfPath);
  const candidates = boldRuns.filter(run => !ignored.test(run.value) && run.value.length > 1 && run.question);
  const missing = [];
  for (const run of candidates) {
    const question = paper.questions?.[run.question - 1];
    if (!question) continue;
    const digital = walk(question);
    const occurrences = digital.strings.filter(item => item.value.includes(run.value));
    if (!occurrences.length) continue;
    const mapped = occurrences.some(item => (sourceBoldMap[entry.id]?.[`q${run.question}`]?.[item.value] || []).some(phrase => {
      const normalPhrase = normalise(phrase);
      return normalPhrase === run.value || normalPhrase.includes(run.value) || run.value.includes(normalPhrase);
    }));
    const covered = mapped || digital.bold.some(item => item.value === run.value || item.value.includes(run.value) || run.value.includes(item.value));
    if (!covered) missing.push({ ...run, paths: [...new Set(occurrences.map(item => item.path))].slice(0, 5) });
  }
  const uniqueMissing = [...new Map(missing.map(item => [`${item.question}|${item.value}`, item])).values()];
  report.push({ id: entry.id, sourceBoldCount: candidates.length, missing: uniqueMissing });
}

for (const paper of report) {
  process.stdout.write(`${paper.id}: ${paper.missing.length} candidates\n`);
  paper.missing.forEach(item => process.stdout.write(`  q${item.question} p${item.page} ${JSON.stringify(item.value)} -> ${item.paths.join(", ")}\n`));
}
if (process.env.AUDIT_RESULTS_FILE) fs.writeFileSync(path.resolve(process.env.AUDIT_RESULTS_FILE), JSON.stringify({ scope: "Source bold-run candidates lacking metadata coverage; actual computed browser styles require a separate check", papers: report }, null, 2) + "\n");
