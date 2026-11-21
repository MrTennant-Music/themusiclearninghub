'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const notation = require('../exam-notation.js');
const marking = require('../exam-marking.js');
const paper = require('../papers/higher-2015.js');
const source = require('./fixtures/higher-2015-q4-source-audit.json');

const written = notes => notes.map(n => [n.pitch?.replace(/[#♯b♭]/g, '') || 'rest', n.rhythm]);
const ties = notes => notes.flatMap((n, i) => n.tieToNext ? [i] : []);
const rhythmBeats = { semiquaver:.25, quaver:.5, crotchet:1, dottedCrotchet:1.5, minim:2, dottedMinim:3, quaverRest:.5, crotchetRest:1, minimRest:2 };
const span = notes => notes.reduce((n, item) => n + rhythmBeats[item.rhythm], 0);
test('Higher 2015 preserves the independently read 23-bar score, slurs, beams and editable answers', () => {
  const actual = notation.getInventory('higher-2015-q4');
  for (const key of ['key', 'clef', 'timeSignature', 'finalBarline']) assert.equal(actual[key], source[key]);
  assert.equal(actual.bars.length, source.bars.length);
  actual.bars.forEach((bar, i) => {
    const expected = source.bars[i];
    assert.deepEqual(written(bar.notes), expected.notes, `bar ${i + 1}: printed noteheads and rhythms`);
    assert.deepEqual(bar.beamGroups || [], expected.beamGroups, `bar ${i + 1}: beams`);
    assert.deepEqual(ties(bar.notes), expected.tiesFrom, `bar ${i + 1}: ties`);
    assert.deepEqual((bar.slurs || []).map(({start,end}) => ({start,end})), expected.slurs, `bar ${i + 1}: slur endpoints`);
    assert.deepEqual(bar.notes.flatMap((n,j) => n.accidental ? [[j,n.accidental]] : []), expected.accidentals);
    assert.equal(span(bar.notes), 4, `bar ${i + 1}: four beats`);
  });
  assert.equal(actual.bars[8].notes[0].tiedFromPrevious, true, 'bar 8/9 tie crosses the system break');
  for (const [bar, indices] of Object.entries(source.sourceDownStems)) for (const i of indices) assert.equal(actual.bars[bar - 1].notes[i].stemDown, true);
  for (const key of ['line5', 'finalLine']) {
    const expected = source[key], notes = actual[key];
    assert.deepEqual(written(notes), expected.notes, key);
    assert.deepEqual(actual[`${key}BeamGroups`], expected.beamGroups, `${key}: beams`);
    assert.deepEqual(actual[`${key}Slurs`], expected.slurs, `${key}: slurs`);
    assert.deepEqual(ties(notes), expected.tiesFrom, `${key}: ties`);
    let start = 0;
    for (const end of expected.barlineAfterIndices) { assert.equal(span(notes.slice(start, end + 1)), 4, `${key}: complete bar ending at ${end}`); start = end + 1; }
    for (const i of expected.sourceDownStems) assert.equal(notes[i].stemDown, true);
  }
  assert.deepEqual(actual.bars[13].missingIndices, source.editable.missingIndices);
  assert.deepEqual(actual.accidentalNoteIndices, source.editable.accidentalIndices);
  const parts = new Map(paper.questions.flatMap(q=>q.subquestions).map(p=>[p.id,p]));
  for (const [id, answer] of [['q4a',source.editable.transposition.join(',')],['q4d',source.editable.missingPitches.join(',')],['q4c','flat@0'],['q4c','flat@2']]) assert.equal(marking.markSubquestion(parts.get(id),answer).marks,1);
  for (const file of source.sources) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../..',file.path))).digest('hex'),file.sha256);
});
