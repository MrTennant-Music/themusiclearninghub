"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const notation = require("../exam-notation.js");
const source = require("./fixtures/national5-2014-q3-source-audit.json");

test("N5 2014 Q3 matches the independently read 300 dpi source inventory in every bar", () => {
  const actual = notation.getInventory("n5-2014-q3");
  assert.equal(actual.key, source.key);
  assert.equal(actual.clef, source.clef);
  assert.equal(actual.timeSignature, source.timeSignature);
  assert.equal(actual.bars.length, source.bars.length);
  actual.bars.forEach((bar, index) => {
    const notes = bar.notes.map(note => [note.pitch?.replace(/♯/g, "#") || "rest", note.rhythm]);
    assert.deepEqual(notes, source.bars[index].notes, `bar ${index + 1}: every pitch and rhythm`);
    assert.deepEqual(bar.beamGroups, source.bars[index].beamGroups, `bar ${index + 1}: beams`);
    assert.deepEqual(bar.notes.flatMap((note, i) => note.tieToNext ? [i] : []), source.bars[index].tiesFrom, `bar ${index + 1}: ties`);
    assert.equal(bar.notes.reduce((sum, note) => sum + note.beats, 0), 4, `bar ${index + 1}: four crotchet beats`);
  });
  assert.equal(actual.bars[6].notes[1].tieBelow,true,"bar 7 tie remains below despite the mixed stem directions");
  assert.equal(actual.editableBar, 3);
  assert.deepEqual(actual.editableNoteIndices, [0, 1, 2]);
  assert.equal(actual.finalBarline, "single");
  assert.equal(actual.acceptedRepeatPosition, "end-bar-8");
  for (const [barNumber, indices] of Object.entries(source.sourceDownStems)) {
    for (const index of indices) assert.equal(actual.bars[Number(barNumber)-1].notes[index].stemDown,true,`bar ${barNumber}, note ${index+1}: printed downward stem`);
  }
  for (const file of source.sources) {
    const hash = crypto.createHash("sha256").update(fs.readFileSync(path.resolve(__dirname, "../..", file.path))).digest("hex");
    assert.equal(hash, file.sha256, "Changed official source requires a fresh inventory audit");
  }
});
