const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const paper = require("../papers/advanced-higher-2026.js");
const notation = require("../exam-notation.js");
const marking = require("../exam-marking.js");
const registry = require("../paper-registry.js");
const { answerComplete, createAttempt } = require("../exam-engine.js");

const parts = new Map(paper.questions.flatMap(question => question.subquestions).map(part => [part.id, part]));
const mark = (id, value) => marking.markSubquestion(parts.get(id), value).marks;
for (const answer of ['VIa, IIa, Ib', '6a, 2a, 1b', 'Bm, Em, D Maj 1st Inv']) {
  assert.equal(mark('q2c', answer), 1, 'The printed root-position and first-inversion alternatives should be accepted.');
}
for (const reason of ['a large orchestra and prominent percussion', 'a symphony orchestra with xylophone']) {
  assert.equal(mark('q6bii', { final: `Excerpt 2 is modern because it uses ${reason}.` }), 1);
}
for (const reason of ['a large orchestra', 'percussion', 'a large orchestra with drumkit']) {
  assert.equal(mark('q6bii', { final: `Excerpt 2 is modern because it uses ${reason}.` }), 0, 'The source combines the orchestra and accepted percussion evidence.');
}

assert.equal(registry[paper.id].levelCode, "AH");
assert.equal(paper.estimatedMinutes, 75);
assert.deepEqual(paper.questions.map(question => question.marks), [6, 6, 7, 4, 7, 10]);
assert.equal([...parts.values()].reduce((sum, part) => sum + part.marks, 0), 40);
assert.equal(fs.existsSync(path.resolve(__dirname, "..", paper.sourcePath)), true);
assert.equal(fs.existsSync(path.resolve(__dirname, "..", paper.markingInstructionsPath)), true);

const answers = {
  q1a: "Ballett\nCountertenor\nPolyphonic\nSuspension", q1b: "Motet", q1c: "Coloratura",
  q2ai: "D major", q2aii: "end-bar-8", q2aiii: "E4,D4,C#4", q2aiv: "19:2-20:0", q2b: "Dim7", q2c: "Bm, Em, D/F#",
  q3a: "Piano trio", q3b: "Dominant 7th", q3c: "Contemporary jazz", q3d1: "Augmented triad", q3d2: "Syllabic", q3d3: "Tremolando", q3d4: "Octave",
  q4a: "5/4", q4b: "sharp@0", q4c: "Tritone", q4d: "G4,A4,G4,F#4",
  q5a: "Appoggiatura\nModulation\nSonata\nSubject", q5b: "4", q5c: "Harmonic minor", q5d: "3",
  q6a1: { final: "Accents\nAnacrusis\nFugue\nStretto" },
  q6a2: { final: "Syncopation\nSequence\nOstinato\nUnison" },
  q6bi: { final: "Both excerpts use accents. Both use countermelody. Both have English text. Both use imitation. Excerpt 1 uses SATB chorus whereas Excerpt 2 uses a female chorus. Excerpt 1 has a solo tenor whereas Excerpt 2 has a solo soprano." },
  q6bii: { final: "Excerpt 1 is Baroque because it uses harpsichord and fugue. Excerpt 2 is 20th century because it uses dissonance and syncopation." },
};
for (const [id, value] of Object.entries(answers)) assert.equal(mark(id, value), parts.get(id).marks, id);
assert.equal(marking.markPaper(paper, answers).score, 40);

assert.equal(mark("q1a", "Ballett\nCountertenor\nPolyphonic\nHemiola"), 3);
assert.equal(mark("q1b", "Madrigal"), 0);
assert.equal(mark("q2ai", "D"), 1);
assert.equal(mark("q2aii", "start-bar-1,end-bar-8"), 1);
assert.equal(mark("q2aii", "start-bar-1"), 0);
assert.equal(mark("q2aiii", "E4,D4,C#4"), 1);
assert.equal(mark("q2aiii", "B3,A3,F#3"), 0);
assert.equal(mark("q2aiv", "19:2-20:0"), 1);
assert.equal(mark("q2b", "Diminished"), 0);
assert.equal(mark("q2c", "VI, II, Ib"), 1);
assert.equal(mark("q2c", "Bm, Em, D"), 0);
assert.equal(mark("q3a", "Chamber group"), 1);
assert.equal(mark("q3a", "Chamber music"), 0);
assert.equal(mark("q3b", "Dom 7th"), 1);
assert.equal(mark("q3d3", "Arco"), 1);
assert.equal(mark("q4a", "5 / 4"), 1);
assert.equal(mark("q4b", "sharp@0"), 1);
assert.equal(mark("q4b", "natural@0"), 0);
assert.equal(mark("q4c", "Aug 4th"), 1);
assert.equal(mark("q4c", "Diminished 5th"), 0);
assert.equal(mark("q4d", "G4,A4,G4,F#4"), 1);
assert.equal(mark("q4d", "G4,A4,F#4,G4"), 0);
assert.equal(mark("q5b", "3"), 0);
assert.equal(mark("q5c", "Melodic minor"), 0);
assert.equal(mark("q5d", "3"), 1);
assert.equal(mark("q6a1", { final: "2 beats in a bar\n4 beats in a bar\nChoir\nOrchestra" }), 0);
assert.equal(mark("q6a2", { final: "Drumkit\nAntiphonal\nSATB chorus\nHorn" }), 0);
assert.equal(mark("q6bi", { final: "Excerpt 1 only uses fugal writing." }), 1);
assert.equal(mark("q6bii", { final: "Excerpt 1 is Baroque. Excerpt 2 is 20th century." }), 1);

const q6a1 = parts.get("q6a1"), q6a2 = parts.get("q6a2"), q6bi = parts.get("q6bi"), q6bii = parts.get("q6bii");
assert.equal(parts.get("q1a").afterAnswerLinesBeforePrompt, 1);
assert.equal(parts.get("q5a").afterAnswerLinesBeforePrompt, 1);
assert.match(parts.get("q2b").prompt, /Write your answer in the box provided\.$/);
assert.equal(parts.get("q2c").prompt, "Identify the boxed chords used in bars 34–36. You should indicate the chord name or number and, where appropriate, 1st or 2nd inversion.");
assert.match(parts.get("q3c").prompt, /tick \(✓\) one box/);
assert.match(parts.get("q5b").prompt, /tick \(✓\) one box/);
assert.match(parts.get("q5d").prompt, /tick \(✓\) one box/);
assert.match(parts.get("q4c").prompt, /Write your answer on the line below\.$/);
const q6 = paper.questions.find(question => question.id === "q6");
assert.deepEqual(q6.introPartLabels, { 1: "(a)" });
assert.deepEqual(q6.introBulletRange, [2, 3]);
assert.deepEqual(q6.introCompactRanges, [[7, 8], [9, 10]]);
assert.deepEqual(q6.introBoldPhrases, ["two prominent", "melody/harmony/rhythm", "texture/structure/form/timbre", "twice", "15 seconds", "4 minutes", "four", "30 seconds"]);
assert.deepEqual(q6a1.roughWorkColumns, ["Excerpt 1", "Excerpt 2"]);
assert.equal(q6a1.sourceHeadingPosition, "final");
assert.equal(q6a2.hideRoughWork, true);
assert.equal(q6a2.hideFinalHeading, true);
assert.equal(q6bi.roughWorkLines, 18);
assert.equal(q6bi.sourceHeadingPosition, "final");
assert.deepEqual(q6bi.finalAnswerIntro, [
  "Comment on six similarities/differences you hear in the excerpts.",
  "Your final answer should be a written description of what you have heard and not simply a list of similarities/differences.",
]);
assert.ok(q6bi.leadIntro.intro.includes("Rough work will not be marked."));
assert.ok(q6bi.leadIntro.intro.includes("Write your final answers in the final answer section."));
assert.deepEqual(q6bi.leadIntro.introCompactRanges, [[8, 9], [10, 11]]);
assert.equal(q6bii.hideRoughWork, true);
assert.equal(q6bii.sourceHeadingPosition, "final");
assert.equal(q6bii.endOfPaper, false);

assert.equal(answerComplete(parts.get("q2aiii"), "B3,A3"), false);
assert.equal(answerComplete(parts.get("q2aiii"), answers.q2aiii), true);
assert.equal(answerComplete(parts.get("q4d"), answers.q4d), true);
assert.equal(createAttempt(paper, "exam", true).timer.remainingSeconds, 4500);

const q2 = notation.getInventory("ah-2026-q2");
assert.deepEqual(q2.a.bassClef.labelLines, ["(iii) Re-write at", "same pitch"], 'Question 2(a)(iii) retains both printed caption lines');
assert.deepEqual(q2.a.bassClef.labelLineOffsets, [0, 28], 'The second printed caption line aligns after the part label, clear of bar number 10');
const q4 = notation.getInventory("ah-2026-q4");
const q5b = notation.getInventory("ah-2026-q5b");
for(const [key,inventory] of Object.entries({q2,q4,q5b}))assert.deepEqual(inventory,require(`./fixtures/ah2026-${key}-inventory.json`));
assert.equal(q5b.answer, 4);
const q5bSignature = item => item.notes.map(note => `${note.rest ? "rest" : note.pitch}:${note.rhythm}`);
const q5bCommon = [
  ["C4:dottedQuaver", "C4:semiquaver"],
  null,
  ["G4:crotchet", "F4:crotchet", "rest:quaverRest", "rest:semiquaverRest", "F5:semiquaver", "G5:dottedQuaver", "A5:semiquaver"],
  ["C6:quaver", "Bb5:quaver", "A5:quaver", "G5:quaver", "G5:quaver", "F5:quaver", "F5:quaver", "E5:quaver"],
  null,
];
const q5bHornA = ["D4:crotchet", "C4:crotchet", "rest:quaverRest", "C4:quaver", "D4:quaver", "E4:quaver"];
const q5bHornB = ["D4:crotchet", "C4:crotchet", "rest:quaverRest", "D4:quaver", "E4:quaver", "G4:quaver"];
q5b.options.forEach((option, index) => {
  assert.deepEqual(q5bSignature(option[0]), q5bCommon[0], `Question 5(b) option ${index + 1} upbeat`);
  assert.deepEqual(q5bSignature(option[1]), [q5bHornA, q5bHornB, q5bHornB, q5bHornA][index], `Question 5(b) option ${index + 1} horn bar`);
  assert.deepEqual(q5bSignature(option[2]), q5bCommon[2], `Question 5(b) option ${index + 1} changeover`);
  assert.deepEqual(q5bSignature(option[3]), q5bCommon[3], `Question 5(b) option ${index + 1} piano run`);
  assert.deepEqual(q5bSignature(option[4]), [`${["D5", "F5", "D5", "F5"][index]}:crotchet`, "rest:crotchetRest"], `Question 5(b) option ${index + 1} ending`);
});

const total = item => item.notes.reduce((sum, note) => sum + Number(note.beats || 0), 0);
q2.a.bars.forEach((item, index) => assert.ok(Math.abs(total(item) - 3) < 1e-8, `Question 2(a) bar ${index + 1}`));
q2.b.bars.forEach((item, index) => assert.ok(Math.abs(total(item) - (item.partial?1:3)) < 1e-8, `Question 2(b) bar ${index + 25}`));
q2.c.bars.forEach((item, index) => {
  assert.ok(item.upper.notes.every(note => note.beats === 3), `Question 2(c) upper chord ${index + 34}`);
  assert.ok(item.lower.notes.every(note => note.beats === 3), `Question 2(c) lower chord ${index + 34}`);
});
q4.bars.forEach((item, index) => assert.ok(Math.abs(total(item) - (item.partial?3:5)) < 1e-8, `Question 4 bar ${index + 1}`));
q5b.options.forEach((option, optionIndex) => assert.deepEqual(option.map(total), [1,4,4,4,2], `Question 5(b) option ${optionIndex + 1} upbeat, complete bars and ending`));

const expectedMarkers = [
  [7.57,225.93,277.73], [7.51,401.39,517.21], [10.01,70.26,129.22,184.46], [6.69], [7.63,245.99,363.89,435.73], [9.6,63.91,203.18,346.86,485.43,868.64,934.11,1073.94,1216.41,1356.7],
];
const durations = [324.96, 673.75, 461.77, 334.56, 620.93, 2100.236984];
assert.equal(expectedMarkers.flat().length, 25);
paper.questions.forEach((question, index) => {
  const audio = question.audio.clips[0], values = audio.markers.map(marker => marker.time);
  assert.equal(fs.existsSync(path.resolve(__dirname, "..", audio.file)), true);
  assert.deepEqual(values, expectedMarkers[index]);
  assert.deepEqual(values, [...values].sort((a,b) => a-b));
  assert.ok(values.every(value => value >= 0 && value < durations[index]));
});

class SvgNode {
  constructor(name) { this.name=name; this.attributes={}; this.children=[]; this.style={}; this.dataset={}; this.events={}; this.textContent=""; this.classList={ contains:()=>false, toggle:()=>{} }; }
  setAttribute(name,value){ this.attributes[name]=String(value); }
  getAttribute(name){ return this.attributes[name] || ""; }
  append(...nodes){ this.children.push(...nodes); }
  insertBefore(node,reference){ this.children.splice(this.children.indexOf(reference),0,node); return node; }
  addEventListener(name,callback){ (this.events[name] ||= []).push(callback); }
  closest(){ return null; }
  querySelectorAll(){ return []; }
  querySelector(){ return this.children[0] || null; }
  contains(){ return false; }
  remove(){}
  get lastChild(){ return this.children.at(-1); }
}
const descendants = node => [node, ...node.children.flatMap(descendants)];
const oldDocument = global.document, oldSymbols = global.BRAVURA_SYMBOLS;
global.document = { createElementNS:(_,name)=>new SvgNode(name), createElement:name=>new SvgNode(name), activeElement:null, querySelectorAll:()=>[] };
global.BRAVURA_SYMBOLS = new Proxy({}, { get:(_,key)=>String(key) });
for (const [scoreKey, optionIndex] of [["q2",0],["q2a",0],["q2b",0],["q2c",0],["q4",0],["q5b",3]]) for (const interactive of [false,true]) {
  const wrap = new SvgNode("div");
  notation.renderSharedScore({ innerHTML:"", querySelector:()=>wrap }, { score:{ sharedNotation:`ah-2026-${scoreKey}`, optionIndex } }, answers, interactive?()=>{}:null, Object.fromEntries([...parts.keys()].map(id=>[id,"incorrect"])));
  const nodes = descendants(wrap);
  assert.ok(nodes.some(node => node.name === "svg"));
  assert.ok(!nodes.some(node => Object.values(node.attributes).some(value => /NaN|undefined|Infinity/.test(value))), `${scoreKey} finite render`);
  if (interactive && ["q2","q4"].includes(scoreKey)) assert.ok(nodes.some(node => ["q3-repeat-hit-area","q3-note-hit-area","q3-accidental-hit-area"].includes(node.attributes.class) || Object.hasOwn(node.attributes,"data-ah-tie-target")), `${scoreKey} interactive target`);
  if (interactive && scoreKey === "q2") {
    const placedRepeatTarget = nodes.find(node => node.dataset.repeatPlaced === "true");
    assert.equal(placedRepeatTarget?.attributes.tabindex, "-1");
    assert.equal(placedRepeatTarget?.attributes["aria-disabled"], "true");
  }
}
// The score is constructed before attachment. Tie placement must resolve its
// containing card when used, rather than capturing null during construction.
{
  const wrap=new SvgNode("div"), changes=[];
  notation.renderSharedScore({innerHTML:"",querySelector:()=>wrap},{score:{sharedNotation:"ah-2026-q2a"}},{},(id,value)=>changes.push([id,value]));
  const nodes=descendants(wrap), svg=nodes.find(n=>n.name==="svg"), card=new SvgNode("article");
  card.dataset.ahTieTool="armed";
  svg.closest=()=>card;
  const target=nodes.find(n=>Object.hasOwn(n.attributes,"data-ah-tie-target"));
  target.events.keydown.forEach(fn=>fn({key:"Enter",preventDefault(){}}));
  assert.deepEqual(changes.at(-1),["q2aiv","19:2-20:0"]);
  assert.equal(card.dataset.ahTieTool,"");
}
// Natural staff positions inherit the printed key when entered by keyboard.
for(const [score,id,keys,expected] of [
  ["q2a","q2aiii",["ArrowUp","Enter"],"C#4,_,_"],
  ["q4","q4d",["ArrowDown","ArrowDown","ArrowDown","Enter"],"F#4,_,_,_"],
]){
  const wrap=new SvgNode("div"), changes=[];
  notation.renderSharedScore({innerHTML:"",querySelector:()=>wrap},{score:{sharedNotation:`ah-2026-${score}`}},{},(part,value)=>changes.push([part,value]));
  const target=descendants(wrap).find(n=>n.attributes.class==="q3-note-hit-area");
  for(const key of keys)target.events.keydown.forEach(fn=>fn({key,preventDefault(){}}));
  assert.deepEqual(changes.at(-1),[id,expected]);
}
global.document = oldDocument;
global.BRAVURA_SYMBOLS = oldSymbols;
assert.match(fs.readFileSync(path.join(__dirname, "../digitalquestionpapers.html"), "utf8"), /advanced-higher-2026-notation\.js/);
console.log("Advanced Higher 2026 source, marking, audio and notation tests passed.");
