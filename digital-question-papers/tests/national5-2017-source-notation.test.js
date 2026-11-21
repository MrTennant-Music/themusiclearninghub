 'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const notation = require('../exam-notation.js');
const source = require('./fixtures/national5-2017-q3-source-audit.json');
test('N5 2017 Q3 preserves the independently read pickup, eight bars, correction and final barline', () => {
  const actual = notation.getInventory('n5-2017-q3');
  for (const key of ['key','clef','timeSignature','editableBar','rhythmCorrectionBar','finalBarline']) assert.equal(actual[key],source[key],key);
  for (const key of ['editableNoteIndices','rhythmCorrectionIndices']) assert.deepEqual(actual[key],source[key],key);
  assert.deepEqual(actual.pickup.map(n=>[n.pitch,n.rhythm]),source.pickup);
  assert.equal(actual.bars.length,source.bars.length);
  actual.bars.forEach((bar,i)=>{
    const expected=source.bars[i];
    assert.deepEqual(bar.notes.map(n=>[n.pitch,n.rhythm]),expected.notes,`bar ${i+1}: pitches and rhythms`);
    assert.deepEqual(bar.beamGroups,expected.beamGroups,`bar ${i+1}: beams`);
    assert.deepEqual(bar.notes.flatMap((n,i)=>n.tieToNext?[i]:[]),expected.tiesFrom,`bar ${i+1}: ties`);
    assert.equal(bar.notes.reduce((sum,n)=>sum+n.beats,0),expected.beats,`bar ${i+1}: printed duration`);
  });
  for (const [barNumber, indices] of Object.entries(source.sourceDownStems)) {
    for (const index of indices) assert.equal(actual.bars[Number(barNumber)-1].notes[index].stemDown,true,`bar ${barNumber}, note ${index+1}: printed downward stem`);
  }
  for(const file of source.sources) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../..',file.path))).digest('hex'),file.sha256);
});
