"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const papersRoot = path.resolve(__dirname, "..");
const registry = require(path.join(papersRoot, "paper-registry.js"));
require(path.join(papersRoot, "source-bold-map.js"));
const sourceBold = globalThis.InteractiveExamSourceBold;

function normalise(value) {
  return String(value ?? "")
    .replace(/^[•·]\s*/, "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("en-GB");
}

function collectStrings(value, result = []) {
  if (typeof value === "string") result.push(normalise(value));
  else if (Array.isArray(value)) value.forEach(item => collectStrings(item, result));
  else if (value && typeof value === "object") Object.values(value).forEach(item => collectStrings(item, result));
  return result;
}

test("every registered paper has a source-PDF bold snapshot that still matches its data", () => {
  assert.equal(Object.keys(sourceBold).length, Object.keys(registry).length);
  for (const entry of Object.values(registry)) {
    const paper = require(path.join(papersRoot, entry.dataFile.split("?")[0]));
    const paperMap = sourceBold[entry.id];
    assert.ok(paperMap, `${entry.id} is missing from source-bold-map.js`);
    assert.ok(Object.keys(paperMap).length > 0, `${entry.id} has no mapped source emphasis`);
    for (const [questionId, textMap] of Object.entries(paperMap)) {
      const question = paper.questions.find(item => item.id === questionId);
      assert.ok(question, `${entry.id} ${questionId} no longer exists`);
      const strings = new Set(collectStrings(question));
      if (questionId === "q1") collectStrings(paper.openingInstructions || []).forEach(value => strings.add(value));
      for (const [text, phrases] of Object.entries(textMap)) {
        assert.ok(strings.has(text), `${entry.id} ${questionId} source-emphasis text drifted: ${text}`);
        assert.ok(phrases.length > 0, `${entry.id} ${questionId} has an empty emphasis list for: ${text}`);
        for (const phrase of phrases) {
          assert.ok(text.includes(normalise(phrase)), `${entry.id} ${questionId} emphasis phrase is absent from its text: ${phrase}`);
        }
      }
    }
  }
});

test("manual PDF ambiguities remain resolved on the intended wording", () => {
  assert.ok(sourceBold["advanced-higher-2016"].q2["tick one box to identify the correct version of the rhythm played by the brass instruments."].includes("brass"));
  assert.ok(sourceBold["advanced-higher-2022"].q2["identify the chords used in bars 1 and 2. you should indicate the chord name or number and, where appropriate, 1st or 2nd inversion or 7th."].includes("and"));
  assert.ok(sourceBold["advanced-higher-2022"].q2["identify the chords used in bars 1 and 2. you should indicate the chord name or number and, where appropriate, 1st or 2nd inversion or 7th."].includes("or"));
  assert.ok(sourceBold["advanced-higher-2023"].q1["now listen to a new excerpt and give the order in which the voices enter with the text, 'and cast away'."].includes("‘And cast away’"));
  assert.ok(sourceBold["advanced-higher-2024"].q5["listen to a new excerpt and tick (✓) one box to indicate the rhythm played on the wood block."].includes("one"));
  assert.ok(sourceBold["advanced-higher-2026"].q2["same pitch."].includes("same pitch"));
  assert.ok(sourceBold["advanced-higher-2026"].q5["listen to this excerpt and tick (✓) one box to indicate the order in which the solo instruments enter."].includes("one"));
  assert.ok(sourceBold["national5-2024"].q1["listen to this excerpt and identify the instrument playing con sordino."].includes("con sordino"));
  assert.ok(sourceBold["national5-2026"].q5["tick (✓) one box from this selection"].includes("one"));
});

test("the source emphasis map loads before the shared paper renderer", () => {
  const html = fs.readFileSync(path.join(papersRoot, "digitalquestionpapers.html"), "utf8");
  const sourceMapIndex = html.indexOf('src="source-bold-map.js');
  const rendererIndex = html.indexOf('src="exam-ui.js');
  assert.ok(sourceMapIndex >= 0 && rendererIndex > sourceMapIndex);

  const renderer = fs.readFileSync(path.join(papersRoot, "exam-ui.js"), "utf8");
  assert.match(renderer, /InteractiveExamSourceBold/);
  assert.match(renderer, /paperTextMarkup\(subquestion\.instruction\)/);
  assert.match(renderer, /paperTextMarkup\(subquestion\.label\)/);
});

test("split-paragraph emphasis does not bold 'or' inside 'major'", () => {
  assert.ok(!sourceBold["advanced-higher-2022"].q2["the key is c major."]?.includes("or"));
});


test("mixed PDF text fragments preserve only their actual bold spans", () => {
  const generator = fs.readFileSync(path.join(papersRoot, 'scripts/generate-source-bold-map.js'), 'utf8');
  const start=generator.indexOf('function sourceLines('), end=generator.indexOf('const ignored =');
  const context={pdftohtml:'pdftohtml',decode:value=>String(value).replace(/<[^>]+>/g,''),normalise,spawnSync:()=>({status:0,stdout:'<page number="1">\n<text top="1" left="1" width="100">Question 5</text>\n<text top="20" left="1" width="300">You now have <b>one minute</b> to read the question.</text>'})};
  require('node:vm').runInNewContext(generator.slice(start,end)+';this.read=sourceLines;',context);
  const result=context.read('source.pdf');assert.equal(result[0].fragments[0].text,'You now have one minute to read the question.');assert.deepEqual(Array.from(result[0].fragments[0].boldTexts),['one minute']);
});

test("Higher 2016 underlines dominant 7th and keeps arpeggio bold without underlining", () => {
  const paper=require('../papers/higher-2016');
  const part=paper.questions[7].subquestions[0];
  assert.deepEqual(part.features[4],{before:'',word:'dominant 7th',after:' arpeggio',boldAfter:true});
  for(const answer of ['dominant 7th','arpeggio','dominant 7th arpeggio'])assert.equal(require('../exam-marking').markSubquestion(part,{5:answer}).marks,1);
});

test("all fifty Higher feature-list entries retain their independently viewed source underlining, emphasis and bullets", () => {
  const fixture=require('./fixtures/higher-source-feature-lists.json');assert.equal(fixture.papers.length,10);
  for(const f of fixture.papers){const part=require('../papers/'+f.id).questions.flatMap(q=>q.subquestions).find(s=>s.type==='lyric-placement');assert.deepEqual(part.features,f.features,f.id);assert.equal(part.featuresBullets!==false,f.bullets,f.id);}
  assert.equal(fixture.papers.reduce((n,p)=>n+p.features.length,0),50);
});
