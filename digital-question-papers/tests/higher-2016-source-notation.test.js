'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const notation=require('../exam-notation.js'),source=require('./fixtures/higher-2016-q4-source-audit.json');
const written=notes=>notes.map(n=>[n.pitch?.replace(/[#♯b♭]/g,'')||'rest',n.rhythm]);
test('Higher 2016 preserves every freshly transcribed bar, pickup, beam, tie and editable slot',()=>{
 const actual=notation.getInventory('higher-2016-q4');
 for(const k of ['key','clef','timeSignature','finalBarline'])assert.equal(actual[k],source[k]);
 assert.deepEqual(written(actual.pickup),source.pickup);
 assert.equal(actual.bars.length,16);
 actual.bars.forEach((bar,i)=>{
  const expected=source.bars[i];
  assert.deepEqual(written(bar.notes),expected.notes,`bar ${i+1}: notehead centres and rhythms`);
  assert.deepEqual(bar.beamGroups||[],expected.beamGroups,`bar ${i+1}: beams`);
  assert.deepEqual(bar.notes.flatMap((n,j)=>n.tieToNext?[j]:[]),expected.tiesFrom,`bar ${i+1}: ties`);
  assert.equal(bar.notes.reduce((sum,n)=>sum+n.beats,0),expected.beats,`bar ${i+1}: metrical total`);
 });
 assert.equal(actual.bars[15].notes.reduce((n,item)=>n+item.beats,0)+actual.pickup.length*.5,4,'final open bar complements pickup without an unprinted rest');
 for(const [bar,indices]of Object.entries(source.sourceDownStems))for(const i of indices)assert.equal(actual.bars[bar-1].notes[i].stemDown,true);
 for(const [bar,indices]of Object.entries(source.sourceBelowTies))for(const i of indices)assert.equal(actual.bars[bar-1].notes[i].tieBelow,true);
 assert.deepEqual(actual.missingNoteIndices,source.editable.missingIndices);
 assert.deepEqual(actual.rhythmCorrectionIndices,source.editable.rhythmIndices);
 assert.deepEqual(actual.bars[14].transposeIndices,source.editable.transposeIndices);
 assert.deepEqual(actual.transpose.map(n=>n.pitch),source.editable.transposition);
 assert.deepEqual(actual.bars[13].notes.slice(4).map(n=>n.pitch),source.editable.missingPitches);
 for(const file of source.sources)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../..',file.path))).digest('hex'),file.sha256);
});
