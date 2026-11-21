'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const notation=require('../exam-notation.js'),source=require('./fixtures/advanced-higher-2024-source-audit.json');
const voice=v=>({notes:v.notes.map(n=>[n.rest?'r':(n.chord||[n.pitch]).join('+'),n.rhythm]),beamGroups:v.beamGroups||[],ties:v.ties||[],triplets:v.triplets||[],lyrics:v.lyricSyllables||[],naturals:v.notes.flatMap((n,i)=>n.courtesyAccidental?[[i,n.courtesyAccidental]]:[])});
test('AH 2024 preserves every freshly read vocal bar, chord, triplet, source tie and percussion option',()=>{
 const q2=notation.getInventory('ah-2024-q2'),q4=notation.getInventory('ah-2024-q4'),q5=notation.getInventory('ah-2024-q5e');
 assert.deepEqual(voice(q2.a.pickup),source.q2a.pickup);assert.deepEqual(q2.a.bars.map(voice),source.q2a.bars);
 assert.deepEqual(q2.b.treble,source.q2b.treble);assert.deepEqual(q2.b.bass,source.q2b.bass);assert.deepEqual(q2.b.given,source.q2b.given);
 assert.deepEqual(voice(q2.c.pickup),source.q2c.pickup);assert.deepEqual(q2.c.bars.map(voice),source.q2c.bars);assert.equal(q2.c.bars[7].notes[2].gracePitch,'B4');
 assert.deepEqual(voice(q4.a.pickup),source.q4a.pickup);assert.deepEqual(q4.a.bars.map(voice),source.q4a.bars);assert.deepEqual(q4.b.bars.map(voice),source.q4b.bars);
 assert.deepEqual(q5.options.map(bs=>bs.map(voice)),source.q5e.options);assert.equal(q5.answer,3);for(const bs of q5.options)for(const b of bs)for(const n of b.notes)if(!n.rest)assert.equal(n.stemDown,false);
 for(const [bars,beats,lastBeats]of [[q2.a.bars,3,2],[q2.c.bars,3,2],[q4.a.bars,4,4],[q4.b.bars,4,4]])for(const [i,b]of bars.entries())assert.ok(Math.abs(b.notes.reduce((s,n)=>s+n.beats,0)-(i===bars.length-1?lastBeats:beats))<1e-8,`bar ${i+1} rhythm total`);
 assert.ok(q2.a.bars[2].notes.slice(4,6).every(n=>n.stemDown===true),'source final beam of bar 3 points down');
 assert.deepEqual(q4.b.missing.indices,[1,2,3]);assert.deepEqual(q4.b.missing.answer,source.editable.q4bi);assert.deepEqual(q4.b.octaveLower.answer,source.editable.q4bii);assert.deepEqual(q4.b.octaveLower.tie,[1,2]);
 assert.equal(q2.finalBarline,source.q2a.finalBarline);assert.equal(q4.finalBarline,source.q4b.finalBarline);
 for(const f of source.sources)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../..',f.path))).digest('hex'),f.sha256);
});
