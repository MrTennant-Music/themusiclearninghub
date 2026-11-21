 'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const notation = require('../exam-notation.js');
const source = require('./fixtures/national5-2018-q3-source-audit.json');
test('N5 2018 Q3 preserves the independently read sixteen bars, correction and final barline', () => {
  const actual = notation.getInventory('n5-2018-q3');
  for (const key of ['key','clef','timeSignature','editableBar','rhythmCorrectionBar','finalBarline']) assert.equal(actual[key],source[key],key);
  for (const key of ['editableNoteIndices','rhythmCorrectionIndices']) assert.deepEqual(actual[key],source[key],key);
  assert.equal(actual.bars.length,source.bars.length);
  actual.bars.forEach((bar,i)=>{
    const expected=source.bars[i];
    assert.deepEqual(bar.notes.map(n=>[n.pitch || 'rest',n.rhythm]),expected.notes,`bar ${i+1}: pitches and rhythms`);
    assert.deepEqual(bar.beamGroups,expected.beamGroups,`bar ${i+1}: beams`);
    assert.deepEqual(bar.notes.flatMap((n,i)=>n.tieToNext?[i]:[]),expected.tiesFrom,`bar ${i+1}: ties`);
    assert.equal(bar.notes.reduce((sum,n)=>sum+n.beats,0),expected.beats,`bar ${i+1}: printed duration`);
  });
  for (const [number, direction] of Object.entries(source.sourceBeamDirections)) {
    const bar=actual.bars[Number(number)-1];
    for (const group of bar.beamGroups) assert.ok(bar.notes.slice(group.start,group.end+1).every(n=>n.stemDown===(direction==='down')),`bar ${number}: source beam direction`);
  }
  for(const file of source.sources) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../..',file.path))).digest('hex'),file.sha256);
});
