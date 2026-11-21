'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const notation=require('../exam-notation.js'),source=require('./fixtures/advanced-higher-2019-source-audit.json');
const pairs=notes=>notes.map(n=>[n.rest?'r':(n.chord||[n.pitch]).join('+'),n.rhythm]);
test('AH 2019 preserves the freshly read melody choices, compound melody and both complete piano hands',()=>{
 const q1=notation.getInventory('ah-2019-q1d'),q2=notation.getInventory('ah-2019-q2'),q4=notation.getInventory('ah-2019-q4');
 assert.deepEqual(pairs(q1.pickup.notes),source.q1d.pickup);assert.deepEqual(q1.options.map(bs=>bs.map(b=>pairs(b.notes))),source.q1d.options);
 assert.deepEqual(pairs(q2.pickup.notes),source.q2.pickup);assert.deepEqual(q2.bars.map(b=>pairs(b.notes)),source.q2.bars);
 assert.deepEqual(q2.bars[0].missingRestIndices,source.q2.missingRestIndices);
 for(const [bar,groups]of Object.entries(source.q2.beamGroups))assert.deepEqual(q2.bars[bar-1].beamGroups.map(g=>[g.start,g.end]),groups);
 for(const [bar,ties]of Object.entries(source.q2.ties))assert.deepEqual(q2.bars[bar-1].ties,ties);
 for(const hand of ['upper','lower']){
  assert.deepEqual(q4.bars.map(b=>pairs(b[hand].notes)),source.q4[hand]);
  q4.bars.forEach((b,i)=>assert.equal(b[hand].notes.reduce((s,n)=>s+n.beats,0),4,`${hand} bar ${i+1}`));
  for(const [bar,indices]of Object.entries(source.q4[hand+'TiesToNext']))assert.deepEqual(q4.bars[bar-1]['ties'+hand[0].toUpperCase()+hand.slice(1)+'ToNext'],indices);
 }
 for(const [bar,indices]of Object.entries(source.q4.courtesyNaturals.upper))for(const i of indices)assert.equal(q4.bars[bar-1].upper.notes[i].courtesyAccidental,'natural');
 for(const [bar,groups]of Object.entries(source.q4.sourceDownBeams))for(const [from,to]of groups)assert.ok(q4.bars[bar-1].upper.notes.slice(from,to+1).every(n=>n.stemDown===true));
 for(const [bar,notes]of Object.entries(source.q4.courtesyNaturals.lowerChords))for(const [i,signs]of Object.entries(notes))assert.deepEqual(q4.bars[bar-1].lower.notes[i].chordAccidentals,signs);
 assert.deepEqual(q4.bars[11].upper.notes[1].grace,['G#5']);assert.deepEqual(q4.missing.indices,[0,1,2,3]);assert.deepEqual(q4.missing.answer,source.editable.q4ai);
 assert.equal(q4.bars[15].octaveNoteIndex,source.q4.octaveSign.noteIndex);
 for(const [key,actual]of Object.entries({q1d:q1,q2,q4}))assert.equal(actual.finalBarline,source[key].finalBarline);
 for(const f of source.sources)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../..',f.path))).digest('hex'),f.sha256);
});
