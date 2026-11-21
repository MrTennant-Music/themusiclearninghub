'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const notation=require('../exam-notation.js'),source=require('./fixtures/higher-2024-q4-source-audit.json');
test('Higher 2024 protects the independent complete printed score inventory',()=>{
 const actual=notation.getInventory('higher-2024-q4');
 for(const key of ['key','clef','timeSignature','finalBarline'])assert.equal(actual[key],source[key]);
 assert.equal(actual.bars.length,24);
 actual.bars.forEach((bar,i)=>{
  assert.deepEqual(bar.notes.map(n=>[n.pitch?.replace(/[#♯b♭]/g,'')||'rest',n.rhythm]),source.bars[i].notes,`bar ${i+1}: printed notes`);
  assert.deepEqual(bar.beamGroups||[],source.bars[i].beamGroups,`bar ${i+1}: beams`);
  assert.deepEqual(bar.notes.flatMap((n,j)=>n.tieToNext?[j]:[]),source.bars[i].tiesFrom,`bar ${i+1}: ties`);
  assert.equal(bar.notes.reduce((sum,n)=>sum+n.beats,0),4,`bar ${i+1}: metre`);
 });
 for(const [bar,indices]of Object.entries(source.sourceDownStems))for(const i of indices)assert.equal(actual.bars[bar-1].notes[i].stemDown,true);
 for(const [bar,indices]of Object.entries(source.sourceBelowTies))for(const i of indices)assert.equal(actual.bars[bar-1].notes[i].tieBelow,true);
 for(const [from,to]of source.crossBarTies){assert.equal(actual.bars[from-1].notes.at(-1).tieToNextBar,true);assert.equal(actual.bars[to-1].notes[0].tiedFromPreviousBar,true);}
 assert.deepEqual(actual.transpose.map(n=>n.pitch),source.editable.transposition);
 assert.deepEqual(actual.transposeIndices,source.editable.transposeIndices);
 assert.deepEqual(actual.rhythmCorrectionIndices,source.editable.rhythmIndices);
 assert.deepEqual(actual.dominantIndices,source.editable.dominantIndices);
 for(const file of source.sources)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../..',file.path))).digest('hex'),file.sha256);
});
