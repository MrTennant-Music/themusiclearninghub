'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const notation=require('../exam-notation.js'),source=require('./fixtures/higher-2026-q4-source-audit.json');
test('Higher 2026 protects the independent complete printed score inventory',()=>{
 const actual=notation.getInventory('higher-2026-q4');
 for(const key of ['key','clef','timeSignature','finalBarline'])assert.equal(actual[key],source[key]);
 assert.equal(actual.bars.length,20);
 assert.deepEqual(actual.lyricExtensions,source.sourceLyricExtenders,"bar 2 printed extender under tied notes");
 actual.bars.forEach((bar,i)=>{
  assert.deepEqual(bar.notes.map(n=>[n.pitch?.replace(/[#♯b♭]/g,'')||'rest',n.rhythm]),source.bars[i].notes,`bar ${i+1}: printed notes`);
  assert.deepEqual(bar.beamGroups||[],source.bars[i].beamGroups,`bar ${i+1}: beams`);
  assert.deepEqual(bar.notes.flatMap((n,j)=>n.tieToNext?[j]:[]),source.bars[i].tiesFrom,`bar ${i+1}: ties`);
  assert.equal(bar.notes.reduce((sum,n)=>sum+n.beats,0),source.bars[i].beats,`bar ${i+1}: metre`);
 });
 for(const [bar,indices]of Object.entries(source.sourceDownStems))for(const i of indices)assert.equal(actual.bars[bar-1].notes[i].stemDown,true);
 for(const [from,to]of source.crossBarTies){assert.equal(actual.bars[from-1].notes.at(-1).tieToNextBar,true);assert.equal(actual.bars[to-1].notes[0].tiedFromPreviousBar,true);}
 assert.deepEqual(actual.transpose.map(n=>n.pitch),source.editable.transposition);
 assert.deepEqual(actual.transposeIndices,source.editable.transposeIndices);
 assert.deepEqual(actual.missingIndices,source.editable.missingIndices);
 for(const [bar,slurs]of Object.entries(source.slurs))assert.deepEqual(actual.bars[bar-1].slurs,slurs);
 for(const [bar,notes]of Object.entries(source.accidentals))for(const [i,accidental]of Object.entries(notes))assert.equal(actual.bars[bar-1].notes[i].accidental,accidental);
 assert.equal(actual.missingRestIndex,source.editable.restIndex);
 assert.equal(actual.bars[19].timeSignature,'3/4');
 for(const file of source.sources)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../..',file.path))).digest('hex'),file.sha256);
});
