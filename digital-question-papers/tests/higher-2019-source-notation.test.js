'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const notation=require('../exam-notation.js'),source=require('./fixtures/higher-2019-q3-source-audit.json');
test('Higher 2019 preserves all 25 independently read 6/8 bars and editable source notes',()=>{
 const actual=notation.getInventory('higher-2019-q3');
 for(const key of ['key','clef','timeSignature','finalBarline'])assert.equal(actual[key],source[key]);
 assert.equal(actual.bars.length,source.bars.length);
 actual.bars.forEach((bar,i)=>{
  const expected=source.bars[i];
  assert.deepEqual(bar.notes.map(n=>[n.pitch?.replace(/[#♯b♭]/g,'')||'rest',n.rhythm]),expected.notes,`bar ${i+1}: source noteheads/rhythms`);
  assert.deepEqual(bar.beamGroups||[],expected.beamGroups,`bar ${i+1}: beams`);
  assert.deepEqual(bar.notes.flatMap((n,j)=>n.tieToNext?[j]:[]),expected.tiesFrom,`bar ${i+1}: ties`);
  assert.equal(bar.fullBarRest?3:bar.notes.reduce((sum,n)=>sum+n.beats,0),3,`bar ${i+1}: full 6/8 bar`);
 });
 for(const [bar,indices]of Object.entries(source.sourceDownStems))for(const i of indices)assert.equal(actual.bars[bar-1].notes[i].stemDown,true);
 for(const [bar,indices]of Object.entries(source.sourceBelowTies))for(const i of indices)assert.equal(actual.bars[bar-1].notes[i].tieBelow,true);
 for(const [from,to]of source.crossBarTies){assert.equal(actual.bars[from-1].notes.at(-1).tieToNextBar,true);assert.equal(actual.bars[to-1].notes[0].tiedFromPreviousBar,true);}
 assert.deepEqual(actual.transpose.map(n=>n.pitch),source.editable.transposition);
 assert.deepEqual(actual.missingNoteBars,source.editable.missingBars);assert.deepEqual(actual.intervalBars,source.editable.intervalBars);assert.deepEqual(actual.chordBars,source.editable.chordBars);
 for(const bar of source.editable.missingBars)assert.deepEqual(actual.bars[bar-1].missingIndices,[0]);
 assert.deepEqual(actual.bars[23].transposeIndices,source.editable.transposeIndices);assert.equal(actual.bars[20].missingRestIndex,0);
 for(const file of source.sources)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../..',file.path))).digest('hex'),file.sha256);
});
