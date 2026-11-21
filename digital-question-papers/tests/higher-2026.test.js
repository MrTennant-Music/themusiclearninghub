const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const marking = require("../exam-marking.js");
const { answerComplete, createAttempt } = require("../exam-engine.js");
const notation = require("../exam-notation.js");
const paper = require("../papers/higher-2026.js");
const registry = require("../paper-registry.js");

const allParts = paper.questions.flatMap(question => question.subquestions);
const parts = new Map(allParts.map(part => [part.id, part]));
const mark = (id, value) => marking.markSubquestion(parts.get(id), value).marks;

assert.equal(registry[paper.id].year, 2026);
assert.equal(paper.estimatedMinutes, 60);
assert.equal(createAttempt(paper, "exam", true).timer.remainingSeconds, 3600);
assert.equal(paper.questions.length, 8);
assert.deepEqual(paper.questions.map(question => question.marks), [5, 5, 4, 6, 4, 6, 5, 5]);
assert.equal(paper.questions.reduce((sum, question) => sum + question.marks, 0), 40);
assert.equal(allParts.reduce((sum, part) => sum + part.marks, 0), 40);
assert.equal(new Set(parts.keys()).size, allParts.length);
assert.equal(fs.existsSync(path.resolve(__dirname, "..", paper.sourcePath)), true);
assert.equal(fs.existsSync(path.resolve(__dirname, "..", paper.markingInstructionsPath)), true);
assert.equal(allParts.filter(part => !part.finalAnswerField).every(part => Boolean(part.definition)), true);
assert.deepEqual(paper.questions.map(question => question.audio.clips[0].file.match(/Track (\d+)/)[1]), ["02", "03", "04", "05", "06", "07", "08", "09"]);

const expectedMarkers = [
  [43.44, 121.32, 229.98, 285.4, 295.45, 328.41],
  [74.10, 188.19, 302.67],
  [22.74, 47.17, 76.27, 146.34, 174.24, 206.57],
  [12.53, 220.54, 310.08, 399.08],
  [44.52, 108.04, 172.71],
  [53.33, 140.94, 228.19],
  [120.75, 184.87, 267.32, 327.29, 407.08, 466.33, 536.26],
  [102.73, 227.53, 352.07],
];
const officialAudioDurations = [366.68, 425.94, 259.2, 578.27, 265.63, 485.55, 667.57, 489.66];
assert.deepEqual(paper.questions.map(question => question.audio.clips[0].markers.map(marker => marker.time)), expectedMarkers);
assert.equal(expectedMarkers.flat().length, 35);
paper.questions.forEach((question, questionIndex) => {
  const clip = question.audio.clips[0];
  assert.equal(fs.existsSync(path.resolve(__dirname, "..", clip.file)), true, question.id);
  assert.deepEqual(clip.markers.map(marker => marker.time), [...clip.markers.map(marker => marker.time)].sort((a, b) => a - b));
  assert.equal(clip.markers.every(marker => marker.time >= 0 && marker.time < officialAudioDurations[questionIndex]), true);
});

assert.equal(mark("q1a", "Lied\nMordent\nRubato"), 3);
assert.equal(mark("q1a", "Lied\nMordent\nRubato\nRecitative"), 2);
assert.equal(mark("q1b", "Oratorio"), 1);
assert.equal(mark("q1c", "Mode"), 1);
assert.equal(mark("q2a", "Horn"), 1);
assert.equal(mark("q2b", "Augmentation"), 1);
assert.equal(mark("q2c", "Clarinet"), 1);
assert.equal(mark("q2d", "Pizz"), 1);
assert.equal(mark("q2e", "Harmonics"), 1);
assert.equal(mark("q3a", "Melodic minor scale"), 1);
assert.equal(mark("q3b", "7/4"), 1);
assert.equal(mark("q3c", "Harmonic"), 1);
assert.equal(mark("q3d", "Musique concrete"), 1);
assert.equal(mark("q4a", "B3,A3,A3,G3"), 1);
assert.equal(mark("q4a", "B3,A3,G3,G3"), 0);
assert.equal(mark("q4b", "6"), 1);
assert.equal(mark("q4b", "Perfect 5th"), 0);
assert.equal(mark("q4c", "D G"), 1);
assert.equal(mark("q4c", "V I"), 1);
assert.equal(mark("q4c", "D C"), 0);
assert.equal(mark("q4d", "G4,B4,G4,E4"), 1);
assert.equal(mark("q4d", "G4,A4,G4,E4"), 0);
assert.equal(mark("q4e", "quaverRest"), 1);
assert.equal(mark("q4e", "crotchetRest"), 0);
assert.equal(mark("q4f", "3/4"), 1);
assert.equal(mark("q4f", "4/4"), 0);
assert.equal(paper.questions.find(question => question.id === "q5").layout, "higher-2026-concepts");
assert.equal(mark("q5a", "Arpeggio\nBasso continuo\nConcertino\nSequence"), 4);
assert.equal(mark("q5a", "Arpeggio\nBasso continuo\nConcertino\nSequence\nTriplets"), 3);

const q6Correct = "Arpeggios\nCountermelody\nAnacrusis\nTriplets\nClassical\nHomophonic";
assert.equal(mark("q6a", { final: q6Correct }), 6);
assert.equal(mark("q6a", { final: "Arpeggios\nCountermelody\nPedal" }), 2);
assert.equal(mark("q6a", { final: "Anacrusis\nTriplets\nModerato" }), 2);
assert.equal(parts.get("q6a").endOfPaper, false, "Question 6 must not show an end-of-paper marker before Questions 7 and 8.");
const q7Correct = ["Romantic", "Sonata", "Minor tonality", "Anacrusis", "Compound time"];
assert.equal(mark("q7a", { c: q7Correct }), 5);
assert.equal(mark("q7a", { c: [...q7Correct, "Imitation"] }), 4);
assert.equal(mark("q7a", { a: q7Correct, b: q7Correct, c: [] }), 0);

const q8 = parts.get("q8a");
const q8Correct = { 3: "perfect", 5: "tenor", 7: "satb", 9: "modulation", 13: "interrupted" };
assert.equal(q8.lyricLines.length, 15);
assert.deepEqual(q8.lyricLines, [
  "God help my people,",
  "They look to you still.",
  "God help the outcasts, or nobody will.",
  "I ask for wealth.",
  "I ask for fame.",
  "I ask for glory to shine on my name.",
  "I ask for love I can possess.",
  "I ask for God and his angels to bless me.",
  "I ask for nothing, I can get by.",
  "But I know so many less lucky than I.",
  "Please help my people,",
  "The poor and down trod.",
  "I thought we all were the children of God.",
  "God help the outcasts,",
  "Children of God.",
], "Higher 2026 should retain the exact user-supplied lyric rows and order.");
assert.equal(mark("q8a", q8Correct), 5);
assert.equal(mark("q8a", { 3: "perfect", 5: "tenor", 8: "satb, modulation", 13: "interrupted" }), 5);
assert.equal(mark("q8a", { ...q8Correct, 1: "crescendo" }), 4);
assert.equal(answerComplete(q8, q8Correct), true);

const inventory = notation.getInventory("higher-2026-q4");
assert.equal(inventory.bars.length, 20);
assert.equal(inventory.timeSignature, "4/4 changing to 3/4");
assert.equal(inventory.transposeBar, 2);
assert.deepEqual(inventory.transposeIndices, [1, 2, 3, 4]);
assert.deepEqual(inventory.transpose.map(item => [item.pitch, item.rhythm]), [["B3", "crotchet"], ["A3", "quaver"], ["A3", "quaver"], ["G3", "crotchet"]]);
assert.deepEqual(inventory.intervalBars, [6, 7]);
assert.deepEqual(inventory.intervalIndices, [[5], [0]]);
assert.deepEqual(inventory.chordBars, [10, 11]);
assert.equal(inventory.missingNoteBar, 13);
assert.deepEqual(inventory.missingIndices, [0, 1, 2, 3]);
assert.equal(inventory.missingRestBar, 16);
assert.equal(inventory.missingRestIndex, 1);
assert.equal(inventory.timeSignatureBar, 20);
assert.equal(inventory.finalBarline, "single");
assert.deepEqual(inventory.scoreLayout.systems, [100, 340, 555, 775, 995, 1225, 1450]);
assert.deepEqual(inventory.scoreLayout.groups, [[0, 1], [2, 3, 4], [5, 6, 7], [8, 9, 10], [11, 12], [13, 14, 15, 16], [17, 18, 19]]);
assert.equal(inventory.scoreLayout.timeSignatureNoteInset, 35);
assert.deepEqual(inventory.scoreLayout.boxes.a, { x: 575, y: 25, width: 235, height: 245, label: "(a) Transpose" });
assert.deepEqual(inventory.scoreLayout.boxes.b, { x: 361, y: 467, width: 110, height: 170, label: "(b) Interval" });
assert.deepEqual(inventory.scoreLayout.boxes.c, { x: 430, y: 685, width: 420, height: 205, label: "(c) Chords" });
assert.deepEqual(inventory.scoreLayout.boxes.f, { x: 722, y: 1355, width: 157, height: 180, label: "(f) Time signature" });
assert.deepEqual(inventory.scoreLayout.intervalInput, { x: 369, y: 500, width: 94, height: 35 });
assert.deepEqual(inventory.scoreLayout.bassStaff, { left: 520, right: 810, top: 220 });
assert.deepEqual(inventory.scoreLayout.givenChord, { x: 148, y: 693, width: 42, rowHeight: 38 });
assert.deepEqual(inventory.scoreLayout.chordInputs, [{ x: 470, y: 722, width: 48, height: 46 }, { x: 606, y: 722, width: 48, height: 46 }]);
assert.deepEqual(inventory.scoreLayout.boxes.d, { x: 520, y: 910, width: 180, height: 180, label: "(d) Notes" });
assert.equal(inventory.scoreLayout.timeSignatureX, 770);
assert.deepEqual(inventory.lyricOffsets, {
  13: [0, 0, 0, -4, -7, 4, 16, 0, -4, 4],
  17: [0, 0, 0, 0, -3, 4],
  18: [0, 0, 0, 0, 0, 0, -3, 4, 0, -3, 3],
});
inventory.bars.slice(0, 19).forEach((bar, index) => assert.equal(bar.notes.reduce((sum, item) => sum + item.beats, 0), 4, `Bar ${index + 1} should total four crotchet beats.`));
assert.equal(inventory.bars[19].notes.reduce((sum, item) => sum + item.beats, 0), 3, "Bar 20 should total three crotchet beats after the 3/4 change.");

const expectedBars = [
  "R:crotchetRest,D5:quaver,B4:quaver,D5:quaver,B4:quaver,D5:quaver,D5:quaver",
  "D5:quaver,B4:crotchet,A4:quaver,A4:quaver,G4:crotchet,E4:quaver",
  "G4:quaver,E4:quaver,G4:quaver,E4:quaver,G4:quaver,G4:crotchet,A4:quaver",
  "A4:crotchet,R:crotchetRest,R:minimRest",
  "R:crotchetRest,D5:quaver,B4:quaver,D5:quaver,B4:quaver,D5:quaver,B4:quaver",
  "D5:quaver,B4:crotchet,A4:quaver,A4:quaver,G4:crotchet,G4:quaver",
  "E5:quaver,D5:quaver,E5:quaver,D5:quaver,E5:quaver,E5:crotchet,D5:quaver",
  "D5:crotchet,R:crotchetRest,R:minimRest",
  "R:dottedQuaverRest,G4:semiquaver,E5:dottedQuaver,D5:semiquaver,E5:quaver,D5:quaver,E5:quaver,D5:quaver",
  "D5:crotchet,R:crotchetRest,R:minimRest",
  "R:crotchetRest,D5:quaver,D5:quaver,D5:quaver,C5:crotchet,B4:quaver",
  "B4:crotchet,R:crotchetRest,B4:quaver,A4:semiquaver,A4:semiquaver,A4:dottedQuaver,G4:semiquaver",
  "G4:quaver,B4:quaver,G4:quaver,E4:quaver,A4:quaver,B4:quaver,A4:semiquaver,G4:quaver,G4:semiquaver",
  "A4:quaver,B4:quaver,A4:dottedQuaver,G4:semiquaver,A4:semiquaver,B4:semiquaver,A4:quaver,A4:semiquaver,G4:semiquaver,D5:quaver",
  "D5:semibreve",
  "D5:minim,R:quaverRest,E5:quaver,B4:quaver,D5:quaver",
  "D5:crotchet,R:crotchetRest,B4:quaver,B4:crotchet,A4:quaver",
  "A4:crotchet,R:crotchetRest,B4:quaver,D5:quaver,B4:quaver,A4:quaver",
  "A4:semiquaver,G4:semiquaver,E4:quaver,R:dottedQuaverRest,E4:semiquaver,B4:semiquaver,B4:semiquaver,B4:quaver,B4:semiquaver,E4:semiquaver,G4:quaver",
  "G4:quaver,R:quaverRest,R:crotchetRest,R:crotchetRest",
];
const barSignature = bar => bar.notes.map(item => `${item.rest ? "R" : item.pitch}:${item.rhythm}`).join(",");
assert.deepEqual(inventory.bars.map(barSignature), expectedBars);
assert.equal(inventory.lyrics[11][0], "___", "Bar 12 must retain the printed continuation underline beneath its opening tied note.");
assert.deepEqual(inventory.bars[12].notes.slice(6).map(item => item.rhythm), ["semiquaver", "quaver", "semiquaver"], "Bar 13's final beam group must match the source semiquaver-quaver-semiquaver rhythm.");
assert.deepEqual(inventory.bars[18].notes.map(item => item.rhythm), ["semiquaver", "semiquaver", "quaver", "dottedQuaverRest", "semiquaver", "semiquaver", "semiquaver", "quaver", "semiquaver", "semiquaver", "quaver"], "Bar 19 must retain its three user-confirmed beat groups around the dotted-quaver rest.");
assert.equal(inventory.lyrics[18][4], "the", "Bar 19's 'the way it's gonna be' phrase must begin on its fourth sounding note, immediately after the rest.");
assert.equal(inventory.bars[1].notes[0].accidental, "sharp");
assert.deepEqual(inventory.bars[1].beamGroups, [], "Bar 2's tied quavers must retain separate flags.");
assert.deepEqual(inventory.bars[5].beamGroups, [], "Bar 6's tied quavers must retain separate flags.");
assert.equal(inventory.bars[8].notes.at(-1).pitch, inventory.bars[9].notes[0].pitch, "The D5 tie from bar 9 into bar 10 must join matching pitches.");
assert.equal(inventory.bars[10].notes.at(-1).pitch, inventory.bars[11].notes[0].pitch, "The B4 tie from bar 11 into bar 12 must join matching pitches.");
assert.equal(inventory.bars[1].notes[2].tieToNext, true);
assert.equal(inventory.bars[1].notes[3].tiedFromPrevious, true);
assert.deepEqual(inventory.bars.flatMap((bar, barIndex) => bar.notes.flatMap((item, noteIndex) => item.tieToNext ? [[barIndex + 1, noteIndex, noteIndex + 1]] : [])), [
  [2, 2, 3],
  [6, 2, 3],
  [12, 4, 5],
  [14, 6, 7],
  [19, 7, 8],
], "Every internal printed tie should be protected by the score inventory.");
assert.deepEqual(inventory.bars.flatMap((bar, barIndex) => bar.notes.at(-1)?.tieToNextBar ? [barIndex + 1] : []), [3, 7, 9, 11, 14, 15, 16, 17, 18, 19], "Every cross-bar printed tie should be protected by the score inventory.");
assert.equal("slurToNextBar" in inventory.bars[17], false, "Bar 19 must not retain the removed phrase slur from bar 18.");
assert.equal(inventory.bars[18].notes[7].tieToNext, true);
assert.equal(inventory.bars[18].notes[8].tiedFromPrevious, true);
assert.equal(inventory.bars[18].notes.at(-1).tieToNextBar, true);
assert.equal(inventory.bars[19].notes[0].tiedFromPreviousBar, true);
[[14, 15], [15, 16], [16, 17], [17, 18], [18, 19], [19, 20]].forEach(([from, to]) => {
  assert.equal(inventory.bars[from - 1].notes.at(-1).pitch, inventory.bars[to - 1].notes[0].pitch, `The tie from bar ${from} into bar ${to} must join matching pitches.`);
});

class FakeSvgNode {
  constructor(name = "node") { this.name = name; this.attributes = {}; this.children = []; this.style = {}; this.dataset = {}; this.textContent = ""; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] || ""; }
  append(...nodes) { this.children.push(...nodes); }
  addEventListener() {}
  remove() {}
  closest() { return null; }
  querySelectorAll() { return []; }
}
const previousDocument = global.document;
const previousSymbols = global.BRAVURA_SYMBOLS;
const previousConfig = global.SHARED_NOTATION_CONFIG;
global.document = { createElementNS: (_namespace, name) => new FakeSvgNode(name), createElement: name => new FakeSvgNode(name) };
global.BRAVURA_SYMBOLS = new Proxy({}, { get: (_target, key) => String(key) });
global.SHARED_NOTATION_CONFIG = { symbols: {}, drawing: {}, stave: { lineGap: 14 } };
const notationWrap = new FakeSvgNode("div");
const notationContainer = { innerHTML: "", querySelector: () => notationWrap };
const questionFour = paper.questions.find(question => question.id === "q4");
assert.doesNotThrow(() => notation.renderSharedScore(notationContainer, questionFour, {
  q4a: "B3,A3,A3,G3", q4b: "6th", q4c: "D G", q4d: "G4,B4,G4,E4", q4e: "quaverRest", q4f: "3/4",
}, null, { q4a: "correct", q4b: "correct", q4c: "correct", q4d: "correct", q4e: "correct", q4f: "correct" }));
const score = notationWrap.children[0];
assert.equal(score.attributes.viewBox, "0 0 920 1585");
const descendants = node => [node, ...(node.children || []).flatMap(descendants)];
descendants(score).forEach(node => Object.entries(node.attributes || {}).forEach(([name, value]) => {
  if (/^(x|x1|x2|y|y1|y2|cx|cy|width|height|rx|ry)$/.test(name)) assert.equal(Number.isFinite(Number(value)), true, `${node.name}.${name}`);
}));
global.document = previousDocument;
global.BRAVURA_SYMBOLS = previousSymbols;
global.SHARED_NOTATION_CONFIG = previousConfig;

const completeAnswers = {
  q1a: "Lied\nMordent\nRubato", q1b: "Oratorio", q1c: "Modal",
  q2a: "French horn", q2b: "Augmentation", q2c: "Clarinet", q2d: "Pizzicato", q2e: "Inverted pedal",
  q3a: "Melodic minor scale", q3b: "7/4", q3c: "Harmonics", q3d: "Musique concrète",
  q4a: "B3,A3,A3,G3", q4b: "6th", q4c: "D G", q4d: "G4,B4,G4,E4", q4e: "quaverRest", q4f: "3/4",
  q5a: "Arpeggio\nBasso continuo\nConcertino\nSequence", q6a: { final: q6Correct }, q7a: { c: q7Correct }, q8a: q8Correct,
};
assert.equal(marking.markPaper(paper, completeAnswers).score, 40);
assert.equal(marking.markPaper(paper, {}).score, 0);

console.log("Higher Music 2026 paper tests passed.");
