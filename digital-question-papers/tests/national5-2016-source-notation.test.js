'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const notation = require('../exam-notation.js');
const source = require('./fixtures/national5-2016-q3-source-audit.json');

test('N5 2016 Q3 preserves every independently read pitch, rhythm, beam, tie and editable note', () => {
  const actual = notation.getInventory('n5-2016-q3');
  assert.equal(actual.key, source.key);
  assert.equal(actual.clef, source.clef);
  assert.equal(actual.timeSignature, source.timeSignature);
  assert.equal(actual.bars.length, source.bars.length);
  actual.bars.forEach((bar, index) => {
    // The source inventory records written staff positions. In this one-flat
    // key both B4 and Bb4 encode the same printed B, with no local accidental.
    assert.deepEqual(bar.notes.map(n => [n.pitch?.replace(/^Bb4$/, 'B4') || 'rest', n.rhythm]), source.bars[index].notes, `bar ${index + 1}: written pitches and rhythms`);
    assert.deepEqual(bar.beamGroups, source.bars[index].beamGroups, `bar ${index + 1}: beams`);
    assert.deepEqual(bar.notes.flatMap((n, i) => n.tieToNext ? [i] : []), source.bars[index].tiesFrom, `bar ${index + 1}: ties`);
    assert.equal(Boolean(bar.notes.some(n => n.tieToNextBar)), source.bars[index].tieToNextBar, `bar ${index + 1}: cross-bar tie`);
    assert.equal(bar.notes.reduce((sum, n) => sum + n.beats, 0), 3, `bar ${index + 1}: three beats`);
  });
  for (const [barNumber, direction] of Object.entries(source.sourceBeamDirections)) {
    const bar = actual.bars[Number(barNumber) - 1];
    for (const group of bar.beamGroups) assert.ok(bar.notes.slice(group.start, group.end + 1).every(note => note.stemDown === (direction === 'down')), `bar ${barNumber}: source beam direction`);
  }
  assert.equal(actual.editableBar, source.editableBar);
  assert.deepEqual(actual.editableNoteIndices, source.editableNoteIndices);
  assert.equal(actual.finalBarline, source.finalBarline);
  for (const file of source.sources) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname, '../..', file.path))).digest('hex'), file.sha256);
});
