'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const notation=require('../exam-notation.js'),source=require('./fixtures/advanced-higher-2022-source-audit.json');
const voice=v=>v?{notes:v.notes.map(n=>[n.rest?'r':(n.chord||[n.pitch]).join('+'),n.rhythm]),beamGroups:v.beamGroups||[],ties:v.ties||[],slurs:v.slurs||[],triplets:v.triplets||[],accidentals:v.notes.flatMap((n,i)=>n.courtesyAccidental?[[i,n.courtesyAccidental]]:[])}:null;
const grand=b=>({upper:voice(b.upper),lower:voice(b.lower),...(b.innerVoice?{innerVoice:voice(b.innerVoice)}:{}),...(b.bassUpper?{bassUpper:voice(b.bassUpper)}:{})});
test('AH 2022 preserves every freshly source-checked voice, chord, beam, tie, triplet and editable slot',()=>{
 const a=notation.getInventory('ah-2022-q2a'),b=notation.getInventory('ah-2022-q2b'),piano=notation.getInventory('ah-2022-q4a'),solo=notation.getInventory('ah-2022-q4b'),q5=notation.getInventory('ah-2022-q5');
 assert.deepEqual(grand(a.pickup),source.q2a.pickup);assert.deepEqual(a.aBars.map(grand),source.q2a.bars);assert.deepEqual(b.bBars.map(voice),source.q2b.bars);
 assert.deepEqual(grand(piano.a.pickup),source.q4a.pickup);assert.deepEqual(piano.a.bars.map(grand),source.q4a.bars);
 assert.deepEqual(solo.b.bars.map(b=>b.upper?grand(b):voice(b)),source.q4b.bars);assert.equal(solo.b.bars[10].tiesBelow,true);
 assert.deepEqual(q5.bars.map(voice),source.q5.bars);assert.equal(q5.bars[2].notes[2].tieToNextBar,true);assert.equal(q5.bars[3].notes[0].tiedFromPreviousBar,true);
 assert.deepEqual(a.bassClef.answer,source.editable.q2aii);assert.deepEqual(solo.b.bass.answer,source.editable.q4biii);assert.deepEqual(q5.missing.indices,[6,7,8]);assert.deepEqual(q5.missing.answer,source.editable.q5aii);
 for(const [bar,type]of [[7,'repeat'],[8,'single']])assert.equal(piano.a.bars[bar].finalBarline,type);
 for(const b of piano.a.bars)for(const v of [b.upper,b.lower,b.innerVoice].filter(Boolean))assert.ok(!v.tenuto,'teacher-requested tenuto omissions remain');
 for(const [bars,beats]of [[a.aBars,6],[piano.a.bars,6],[solo.b.bars,4],[q5.bars,3],[b.bBars,6]])for(const [i,b]of bars.entries())for(const v of b.upper?[b.upper,b.lower,b.innerVoice,b.bassUpper].filter(Boolean):[b])assert.ok(Math.abs(v.notes.reduce((s,n)=>s+n.beats,0)-beats)<1e-8,`bar ${i+1} rhythm total`);
 assert.equal(a.finalBarline,source.q2a.finalBarline);assert.equal(b.finalBarline,source.q2b.finalBarline);assert.equal(solo.finalBarline,source.q4b.finalBarline);assert.equal(q5.finalBarline,source.q5.finalBarline);
 for(const f of source.sources)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../..',f.path))).digest('hex'),f.sha256);
});
