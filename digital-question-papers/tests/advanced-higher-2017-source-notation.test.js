'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const notation=require('../exam-notation.js'),source=require('./fixtures/advanced-higher-2017-source-audit.json');
const pairs=notes=>notes.map(n=>[n.rest?'r':n.pitch,n.rhythm]);
test('AH 2017 protects all three independently read melody alternatives and every printed literacy bar',()=>{
 const choices=notation.getInventory('ah-2017-q2b');assert.deepEqual(choices.options.map(bars=>bars.map(b=>pairs(b.notes))),source.q2b.options);
 for(const key of ['q4','q5']){
  const actual=notation.getInventory('ah-2017-'+key),expected=source[key];assert.equal(actual.finalBarline,expected.finalBarline);
  assert.deepEqual(actual.bars.map(b=>pairs(b.notes)),expected.bars);
  if(key==='q4'){
   for(const[b,ns]of Object.entries(expected.lowerVoice))assert.deepEqual(pairs(actual.bars[b-1].lowerVoice),ns);
   for(const[b,ns]of Object.entries(expected.bass))assert.deepEqual(pairs(actual.bars[b-1].bass),ns);
   assert.deepEqual(pairs(actual.leftHandReference.notes),expected.leftHandReference);
   for(const i of expected.leftHandReferenceCourtesyNaturals)assert.equal(actual.leftHandReference.notes[i].courtesyAccidental,'natural');
   assert.equal(actual.layout.scaleBox.bar,4);assert.equal(actual.layout.chordSourceBox.bar,18);assert.equal(actual.layout.chordSourceBox.note,0);
   assert.deepEqual(actual.bars[17].notes.slice(0,2).map(n=>n.chord),expected.chords['18']);
   assert.deepEqual(actual.missingIndices,[0,1,2,3,4]);assert.deepEqual(actual.missingAnswer,source.editable.q4e);
  }else{
   assert.deepEqual(actual.bassGuitarReference.map(b=>pairs(b.notes)),expected.bassReference);
   assert.deepEqual(actual.bassLine.melody.map(b=>pairs(b.notes)),expected.bassLineGuide);assert.deepEqual(pairs(actual.bassLine.given),expected.bassLineGiven);
   assert.deepEqual(actual.transpose.answer,source.editable.q5c);assert.deepEqual(actual.bassLine.missing.map(n=>n.pitch),source.editable.q5e);
   for(const[b,ties]of Object.entries(expected.ties))assert.deepEqual(actual.bars[b-1].ties,ties);
   for(const[b,ties]of Object.entries(expected.crossBarTies))assert.deepEqual(actual.bars[b-1].tiesToNext,ties);
  }
 }
 for(const f of source.sources)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../..',f.path))).digest('hex'),f.sha256);
});
