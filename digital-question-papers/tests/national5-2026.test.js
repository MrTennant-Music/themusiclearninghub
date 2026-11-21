const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const marking = require("../exam-marking.js");
const notation = require("../exam-notation.js");
const paper = require("../papers/national5-2026.js");
const registry = require("../paper-registry.js");
const stylesSource = fs.readFileSync(path.resolve(__dirname, "..", "styles.css"), "utf8");

const allParts = paper.questions.flatMap(question => question.subquestions);
const parts = new Map(allParts.map(part => [part.id, part]));
const mark = (id, value) => marking.markSubquestion(parts.get(id), value).marks;

assert.equal(registry[paper.id].year, 2026);
assert.equal(paper.estimatedMinutes, 45);
assert.equal(paper.questions.length, 8);
assert.deepEqual(paper.questions.map(question => question.marks), [7, 4, 6, 7, 4, 3, 4, 5]);
assert.equal(paper.questions.reduce((sum, question) => sum + question.marks, 0), 40);
assert.equal(allParts.reduce((sum, part) => sum + part.marks, 0), 40);
assert.equal(new Set(parts.keys()).size, allParts.length);
assert.equal(fs.existsSync(path.resolve(__dirname, "..", paper.sourcePath)), true);
assert.equal(fs.existsSync(path.resolve(__dirname, "..", paper.markingInstructionsPath)), true);
assert.equal(allParts.filter(part => !part.finalAnswerField).every(part => Boolean(part.definition)), true);
assert.deepEqual(paper.questions.map(question => question.audio.clips[0].file.match(/Track (\d+)/)[1]), ["02", "03", "04", "05", "06", "07", "08", "09"]);

const expectedMarkers = [
  [5.96, 52, 95.76, 158.45, 199.7, 304.59],
  [95.66, 184.88, 273.96],
  [7.24, 114.5, 168.97, 224.12],
  [6.69, 47.52, 131.22, 184.35, 221.15],
  [83.77, 131.31, 178.72],
  [54.77, 132.37],
  [5.74, 80.99],
  [41.3, 127.44, 214.71],
];
const officialAudioDurations = [392.77, 362.94, 372.12, 313.11, 233.85, 208.5, 148.62, 421.88];
assert.deepEqual(paper.questions.map(question => question.audio.clips[0].markers.map(marker => marker.time)), expectedMarkers);
assert.equal(expectedMarkers.flat().length, 28);
paper.questions.forEach((question, questionIndex) => {
  const clip = question.audio.clips[0];
  assert.equal(fs.existsSync(path.resolve(__dirname, "..", clip.file)), true, question.id);
  assert.deepEqual(clip.markers.map(marker => marker.time), [...clip.markers.map(marker => marker.time)].sort((a, b) => a - b));
  assert.equal(clip.markers.every(marker => marker.time >= 0 && marker.time < officialAudioDurations[questionIndex]), true);
});

allParts.forEach(part => {
  if (part.type === "radio") {
    assert.equal(part.options.some(option => option.value === part.answer), true, part.id);
    assert.equal(mark(part.id, part.answer), part.marks, part.id);
  }
  if (part.type === "checkbox") {
    assert.equal(mark(part.id, part.answers), part.marks, part.id);
    assert.equal(mark(part.id, [part.answers[0]]), 1, part.id);
  }
  (part.acceptedAnswers || []).forEach(answer => assert.equal(mark(part.id, answer), part.marks, `${part.id}: ${answer}`));
});

assert.equal(mark("q1b", "Bothy"), 1);
assert.equal(mark("q1d", "baritone"), 1);
assert.equal(mark("q2a", "drum kit"), 0);
assert.equal(mark("q2b", "chromatic scale"), 1);
assert.equal(mark("q2b", "scale"), 0);
assert.equal(mark("q2d", "four"), 1);
assert.equal(mark("q3a", "3/4"), 1);
assert.equal(mark("q3a", "4/4"), 0);
assert.equal(mark("q3b", "mezzo forte"), 1);
assert.equal(mark("q3c", "major second"), 1);
assert.equal(mark("q3d", "three"), 1);
assert.equal(mark("q3e", "B4,C5,B4"), 1);
assert.equal(mark("q3e", "B4,B4,C5"), 0);
assert.equal(mark("q3f", "ends on V"), 1);
assert.equal(mark("q4b", "pentatonic scale"), 1);
assert.equal(mark("q4d", "contrapuntal"), 1);
assert.equal(mark("q6a", "Alberti"), 1);
assert.equal(mark("q6c", "moderato"), 1);
assert.equal(mark("q7a2", "fast quavers"), 1);
assert.equal(mark("q7a2", "andante quavers"), 0);
assert.equal(mark("q7b2", "solo violin with orchestra"), 1);
assert.equal(mark("q7b2", "solo with orchestra"), 0);

const inventory = notation.getInventory("n5-2026-q3");
assert.equal(inventory.timeSignature, "3/4");
assert.equal(inventory.pickup.notes[0].pitch, "D4");
assert.equal(inventory.pickup.notes[0].rhythm, "crotchet");
assert.equal(inventory.pickup.notes.reduce((sum, note) => sum + note.beats, 0), 1);
assert.deepEqual(inventory.pickupLyrics, ["Ten"]);
assert.equal(inventory.bars.length, 16);
assert.deepEqual(inventory.bars.map(bar => bar.notes.map(note => `${note.rest ? "rest" : note.pitch}:${note.rhythm}`).join(" ")), [
  "E4:crotchet G4:crotchet E4:crotchet",
  "D4:minim D4:crotchet",
  "C#4:crotchet D4:minim",
  "rest:crotchetRest E4:crotchet F#4:crotchet",
  "G4:crotchet A4:crotchet G4:crotchet",
  "E4:crotchet C#4:dottedCrotchet D4:quaver",
  "D4:dottedMinim",
  "rest:crotchetRest rest:crotchetRest D4:crotchet",
  "B4:crotchet C5:crotchet B4:crotchet",
  "A4:crotchet G4:crotchet A4:crotchet",
  "B4:crotchet C5:crotchet B4:crotchet",
  "A4:crotchet G4:dottedCrotchet A4:quaver",
  "B4:crotchet C5:crotchet B4:crotchet",
  "A4:crotchet G4:crotchet B4:crotchet",
  "A4:dottedMinim",
  "A4:minim",
]);
inventory.bars.slice(0, 15).forEach((bar, index) => assert.equal(bar.notes.reduce((sum, note) => sum + note.beats, 0), 3, `bar ${index + 1}`));
assert.equal(inventory.bars[15].notes.reduce((sum, note) => sum + note.beats, 0), 2);
assert.deepEqual(inventory.missingIndices, [0, 1, 2]);
assert.equal(inventory.bars[2].notes[0].accidentalXOffset, -10);
assert.equal(inventory.bars[5].notes[1].accidentalXOffset, -10);
assert.equal(inventory.systemSpacing, 138);
assert.equal(inventory.viewBoxHeight, 620);
assert.equal(inventory.bars[14].notes[0].tieToNextBar, true);
assert.equal(inventory.finalBarline, "final");
assert.equal([inventory.pickup, ...inventory.bars].flatMap(bar => bar.notes).every(note => note.rest || Number.isFinite(note.step)), true);
assert.deepEqual(inventory.lyrics, [
  ["min-", "utes", "a -"], ["go,", "I"], ["saw", "you."], [null, "I", "looked"],
  ["up", "when", "you"], ["came", "through", "the"], ["door."], [null, null, "My"],
  ["head", "star -", "ted"], ["reel-", "ing,", "you"], ["gave", "me", "the"], ["feel -", "ing", "the"],
  ["room", "had", "no"], ["ceil -", "ing", "or"], ["floor."], [null],
]);
assert.deepEqual([inventory.pickupLyrics, ...inventory.lyrics].flat().filter(Boolean), [
  "Ten", "min-", "utes", "a -", "go,", "I", "saw", "you.", "I", "looked",
  "up", "when", "you", "came", "through", "the", "door.", "My",
  "head", "star -", "ted", "reel-", "ing,", "you", "gave", "me", "the", "feel -", "ing", "the",
  "room", "had", "no", "ceil -", "ing", "or", "floor.",
]);
assert.equal(inventory.lyricOffsets[14][0], -16);
assert.equal(inventory.lyricTextAnchors[14][0], "start");
assert.equal(parts.get("q3a").defaultValue, undefined, "The time-signature answer must be blank before the pupil chooses it.");
assert.match(stylesSource, /\.national5-2026-q3-score \.q3-score-lyrics \{ font-family: "Trebuchet MS Local", "Trebuchet MS", Arial, sans-serif; \}/);

class FakeSvgNode {
  constructor(name = "node") { this.name = name; this.attributes = {}; this.children = []; this.style = {}; this.dataset = {}; }
  querySelectorAll(selector) {
    const classes = selector.split(',').map(value => value.trim().slice(1));
    return this.children.flatMap(child => [
      ...(classes.some(value => String(child.attributes.class || '').split(/\s+/).includes(value)) ? [child] : []),
      ...child.querySelectorAll(selector),
    ]);
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  append(...nodes) { this.children.push(...nodes); }
  addEventListener() {}
  remove() {}
  closest() { return null; }
}
const previousDocument = global.document;
const previousSymbols = global.BRAVURA_SYMBOLS;
const previousConfig = global.SHARED_NOTATION_CONFIG;
global.document = { createElementNS: (_namespace, name) => new FakeSvgNode(name), createElement: name => new FakeSvgNode(name) };
global.BRAVURA_SYMBOLS = new Proxy({}, { get: () => "x" });
global.SHARED_NOTATION_CONFIG = { symbols: {}, drawing: {}, stave: { lineGap: 14 } };
const notationWrap = new FakeSvgNode("div");
const notationContainer = { innerHTML: "", querySelector: () => notationWrap };
const questionThree = paper.questions.find(question => question.id === "q3");
assert.doesNotThrow(() => notation.renderSharedScore(notationContainer, questionThree, {}, null, {}));
assert.equal(notationWrap.children[0]?.attributes?.viewBox, "0 0 920 620");
assert.match(notationWrap.children[0]?.attributes?.class, /national5-2026-q3-score/);
assert.doesNotMatch(JSON.stringify(notationWrap.children[0]), /NaN/);
const descendants = node => [node, ...node.children.flatMap(descendants)];
const hasClass = (node, className) => String(node.attributes.class || "").split(/\s+/).includes(className);
const blankScoreNodes = descendants(notationWrap.children[0]);
const lyricNodes = blankScoreNodes.filter(node => hasClass(node, "q3-score-lyrics"));
assert.equal(lyricNodes.length, 37, "The clean score should render every source lyric syllable.");
assert.deepEqual(lyricNodes.map(node => node.textContent), [inventory.pickupLyrics, ...inventory.lyrics].flat().filter(Boolean));
const finalLyric = lyricNodes.find(node => node.textContent === "floor.");
assert.equal(finalLyric.attributes["text-anchor"], "start");
const finalExtension = blankScoreNodes.find(node => hasClass(node, "q3-lyric-extension"));
assert.ok(finalExtension, "The source's final lyric extender must be a continuous line, not short underscores.");
const finalNote = blankScoreNodes.filter(node => hasClass(node, "q3-complete-note")).at(-1);
assert.ok(Math.abs(Number(finalExtension.attributes.x2) - Number(finalNote.attributes.x)) < 2, "The extender must reach beneath the tied bar-16 note.");
assert.ok(Number(finalExtension.attributes.x2) - Number(finalExtension.attributes.x1) > 50);
const notesLabel = blankScoreNodes.find(node => node.textContent === "(e) Notes");
const notesBox = blankScoreNodes.find(node => hasClass(node, "q3-marking-box") && node.attributes.x === String(Number(notesLabel.attributes.x) - 12));
assert.equal(notesBox.attributes.height, "116", "The bar-11 box rule should finish above the printed lyric line.");
assert.equal(blankScoreNodes.filter(node => hasClass(node, "q3-music-glyph") && node.attributes.x === "183").length, 0, "A clean attempt must not print 3/4 by default.");
const answeredWrap = new FakeSvgNode("div");
notation.renderSharedScore({ innerHTML: "", querySelector: () => answeredWrap }, questionThree, { q3a: "3/4" }, null, {});
assert.equal(descendants(answeredWrap.children[0]).filter(node => hasClass(node, "q3-music-glyph") && node.attributes.x === "183").length, 2, "The chosen time signature should retain the repeated 7 px rightward adjustment.");
global.document = previousDocument;
global.BRAVURA_SYMBOLS = previousSymbols;
global.SHARED_NOTATION_CONFIG = previousConfig;

const questionEight = parts.get("q8a");
assert.equal(mark("q8a", { final: "Chromatic, glissando, allegro, harp and crescendo" }), 5);
assert.equal(mark("q8a", { final: "Chromatic, glissando, perfect cadence, pedal and vamp" }), 2);
assert.equal(mark("q8a", { final: "violin" }), 0);
assert.equal(mark("q8a", { final: "violins" }), 1);
assert.equal(mark("q8a", { final: "drums" }), 0);
assert.equal(mark("q8a", { final: "drum kit" }), 1);
assert.equal(mark("q8a", { final: "Repetition" }), 1);

const fullAnswers = {};
paper.questions.forEach(question => question.subquestions.forEach(part => {
  if (part.id === "q8a") fullAnswers[part.id] = { final: "Chromatic, glissando, allegro, harp and crescendo" };
  else if (part.id === "q7a2") fullAnswers[part.id] = "fast quavers";
  else if (part.id === "q7b2") fullAnswers[part.id] = "solo violin with orchestra";
  else if (part.type === "checkbox") fullAnswers[part.id] = [...part.answers];
  else fullAnswers[part.id] = part.answer ?? part.acceptedAnswers?.[0];
}));
assert.equal(marking.markPaper(paper, {}).score, 0);
assert.equal(marking.markPaper(paper, fullAnswers).score, 40);

console.log("National 5 Music 2026 paper tests passed.");
