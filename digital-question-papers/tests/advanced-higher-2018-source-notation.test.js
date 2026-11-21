'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const notation=require('../exam-notation.js'),source=require('./fixtures/advanced-higher-2018-source-audit.json');
const pairs=notes=>notes.map(n=>[n.rest?'r':n.pitch,n.rhythm]);
test('AH 2018 matches the complete source inventory with the user-confirmed F-naturals',()=>{
 const q2=notation.getInventory('ah-2018-q2');assert.deepEqual(q2.bars.map(b=>pairs(b.notes)),source.q2a.bars);
 for (const i of [0,2]) { assert.equal(q2.third.bars[i].notes[1].courtesyAccidental,'natural'); assert.equal(q2.third.bars[i].notes[3].pitch,'F4'); }
 assert.deepEqual(q2.bassPhrase.map(b=>pairs(b.notes)),source.q2bassPhrase);assert.deepEqual(q2.bassLine.melody.map(b=>pairs(b.notes)),source.q2b.melody);assert.deepEqual(q2.bassLine.chordPitches,source.q2b.chords);assert.deepEqual(q2.bassLine.given,source.q2b.given);
 assert.deepEqual(q2.second.bars.map(b=>pairs(b.notes)),source.q2c.bars);assert.equal(q2.second.finalBarline,source.q2c.finalBarline);
 q2.third.bars.forEach((bar,i)=>{const expected=source.q2d.bars[i].map(n=>[...n]);for(const d of source.q2d.teacherOverrides)if(d.bar===i+10)for(const j of d.indices)expected[j][0]=d.teacher;assert.deepEqual(pairs(bar.notes),expected);});
 for(const[b,ties]of Object.entries(source.q2a.ties))assert.deepEqual(q2.bars[b-1].ties,ties);
 for(const[b,notes]of Object.entries(source.q2a.grace))for(const[i,pitches]of Object.entries(notes))assert.deepEqual(q2.bars[b-1].notes[i].grace,pitches);
 for(const[b,notes]of Object.entries(source.q2a.courtesyAccidentals))for(const[i,a]of Object.entries(notes))assert.equal(q2.bars[b-1].notes[i].courtesyAccidental,a);
 const q4=notation.getInventory('ah-2018-q4');assert.deepEqual(q4.bars.map(b=>pairs(b.notes)),source.q4.bars);assert.deepEqual(pairs(q4.pickup.notes),source.q4.pickup);assert.equal(q4.finalBarline,source.q4.finalBarline);
 for(const[b,indices]of Object.entries(source.q4.fermatas))for(const i of indices)assert.equal(q4.bars[b-1].notes[i].fermata,true);
 const q5=notation.getInventory('ah-2018-q5b');assert.deepEqual(q5.options.map(bars=>bars.map(b=>pairs(b.notes))),source.q5b.options);assert.equal(q5.finalBarline,source.q5b.finalBarline);
 for(const option of q5.options)option.forEach((bar,i)=>assert.deepEqual(bar.beamGroups.map(b=>[b.start,b.end]),source.q5b.beamGroups[i]));
 for(const f of source.sources)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../..',f.path))).digest('hex'),f.sha256);
});

test('AH 2018 accepts every keyboard-enterable octave of its official B A G bass answer, with strict pitch order',()=>{
 const paper=require('../papers/advanced-higher-2018.js'),marking=require('../exam-marking.js'),part=paper.questions.find(q=>q.id==='q2').subquestions.find(p=>p.id==='q2b');
 for(let b=2;b<=5;b++)for(let a=2;a<=5;a++)for(let g=2;g<=5;g++)assert.equal(marking.markSubquestion(part,`B${b},A${a},G${g}`).marks,1);
 for(const wrong of ['Bb3,A3,G3','B3,A#3,G3','B3,G3,A3','B3,A3','B3,A3,G3,C3','C3,A3,G3'])assert.equal(marking.markSubquestion(part,wrong).marks,0,wrong);
});
