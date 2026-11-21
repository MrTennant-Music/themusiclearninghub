'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const notation=require('../exam-notation.js'),source=require('./fixtures/higher-2017-q4-source-audit.json');
test('Higher 2017 preserves all 23 source bars, middle-line stems, ties, slurs and editable indices',()=>{
 const actual=notation.getInventory('higher-2017-q4');
 for(const key of ['key','clef','timeSignature','finalBarline'])assert.equal(actual[key],source[key]);
 assert.equal(actual.bars.length,source.bars.length);
 actual.bars.forEach((bar,i)=>{
  const expected=source.bars[i];
  assert.deepEqual(bar.notes.map(n=>[n.pitch?.replace(/[#♯b♭]/g,'')||'rest',n.rhythm]),expected.notes,`bar ${i+1}: printed noteheads and rhythms`);
  assert.deepEqual(bar.beamGroups||[],expected.beamGroups,`bar ${i+1}: beams`);
  assert.deepEqual(bar.notes.flatMap((n,j)=>n.tieToNext?[j]:[]),expected.tiesFrom,`bar ${i+1}: internal ties`);
  assert.deepEqual((bar.slurs||[]).map(({start,end})=>({start,end})),expected.slurs,`bar ${i+1}: slurs`);
  assert.equal(bar.notes.reduce((sum,n)=>sum+n.beats,0),4,`bar ${i+1}: metre`);
 });
 for(const [bar,indices]of Object.entries(source.sourceDownStems))for(const i of indices)assert.equal(actual.bars[bar-1].notes[i].stemDown,true);
 assert.equal(actual.bars[17].slurs[0].below,true,'bar 18 A4–B4 slur is below, irrespective of stem directions');
 for(const [from,to]of source.crossBarTies){assert.equal(actual.bars[from-1].notes.at(-1).tieToNextBar,true);assert.equal(actual.bars[to-1].notes[0].tiedFromPreviousBar,true);}
 assert.deepEqual(actual.crossBarSlurs,source.crossBarSlurs);
 assert.deepEqual(actual.missingNoteIndices,source.editable.missingIndices);
 assert.deepEqual(actual.transposeNoteIndices,source.editable.transposeIndices);
 assert.deepEqual(actual.valueNoteIndices,source.editable.valueIndices);
 assert.deepEqual(actual.transpose.map(n=>n.pitch),source.editable.transposition);
 for(const file of source.sources)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../..',file.path))).digest('hex'),file.sha256);
});
