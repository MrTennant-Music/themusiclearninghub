'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const notation=require('../exam-notation.js'),source=require('./fixtures/higher-2022-q4-source-audit.json');
test('Higher 2022 records every printed bar including the user-confirmed official D5 quaver',()=>{
 const actual=notation.getInventory('higher-2022-q4');
 for(const key of ['key','clef','timeSignature','finalBarline'])assert.equal(actual[key],source[key]);
 assert.equal(actual.bars.length,13);
 actual.bars.forEach((bar,i)=>{
  const expected=source.bars[i].notes.map(pair=>[...pair]);
  for(const d of source.teacherDiscrepancies)if(d.bar===i+1)expected[d.note][0]=d.teacherRuntime;
  assert.deepEqual(bar.notes.map(n=>[n.pitch?.replace(/[#♯b♭]/g,'')||'rest',n.rhythm]),expected,`bar ${i+1}: printed notes except the documented teacher override`);
  assert.deepEqual(bar.beamGroups||[],source.bars[i].beamGroups,`bar ${i+1}: beams`);
  assert.deepEqual(bar.notes.flatMap((n,j)=>n.tieToNext?[j]:[]),source.bars[i].tiesFrom,`bar ${i+1}: ties`);
  assert.equal(bar.notes.reduce((sum,n)=>sum+n.beats,0),6,`bar ${i+1}: 12 quavers`);
 });
 for(const [bar,indices]of Object.entries(source.sourceDownStems))for(const i of indices)assert.equal(actual.bars[bar-1].notes[i].stemDown,true);
 assert.deepEqual(actual.bars[3].missingIndices,[0]);assert.deepEqual(actual.bars[10].missingIndices,[0,1,2]);assert.deepEqual(actual.transpose.map(n=>n.pitch),source.editable.transposition);
 assert.deepEqual(actual.bars[11].transposeIndices,[3,4,5]);assert.deepEqual(actual.bars[12].transposeIndices,[0]);assert.equal(actual.tonicIndex,2);
 for(const file of source.sources)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../..',file.path))).digest('hex'),file.sha256);
});
