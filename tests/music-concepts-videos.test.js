const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dictionary=require('../music-dictionary/music-concepts-data.js');
const videos=require('../music-dictionary/music-concepts-videos.js');
const additions=require('../maintenance/audio-evidence/dictionary-video-expansion-2026-10-31/additions.json');
const variety=require('../maintenance/audio-evidence/dictionary-media-variety-2026-11-01/changes.json');

test('every Dictionary concept has a valid local or YouTube example',()=>{
 assert.deepEqual(Object.keys(videos.concepts).sort(),dictionary.concepts.map(c=>c.id).sort());
 for(const concept of dictionary.concepts){
  for(const video of [videos.concepts[concept.id]].flat()){
   if(video.src){
    assert.match(video.src,/^music-dictionary\/videos\/[a-z0-9-]+\.mp4$/);
    assert.equal(video.sourceUrl,video.src);
    assert.ok(fs.statSync(path.join(__dirname,'..',video.src)).size>0);
    assert.ok(fs.existsSync(path.join(__dirname,'..',video.poster)));
   }else{
   assert.match(video.videoId,/^[A-Za-z0-9_-]{11}$/,concept.name);
   const source=new URL(video.sourceUrl);
   assert.equal(source.origin+source.pathname,'https://www.youtube.com/watch');
   assert.equal(source.searchParams.get('v'),video.videoId);
   assert.ok([...source.searchParams.keys()].every(key=>key==='v'||key==='t'));
   if(source.searchParams.has('t'))assert.equal(source.searchParams.get('t'),video.startSeconds+'s');
   }
   for(const field of ['title','performer','listeningFocus'])assert.ok(video[field].trim(),concept.name+': '+field);
   if(video.startSeconds!==undefined)assert.ok(Number.isFinite(video.startSeconds)&&video.startSeconds>=0);
   if(video.endSeconds!==undefined)assert.ok(video.endSeconds>(video.startSeconds||0));
  }
 }
});

test('new explanations are under two minutes and selections have working embed or external-link handling',()=>{
 assert.equal(additions.added,150);
 assert.equal(new Set(additions.entries.map(e=>e.conceptId)).size,150);
 for(const entry of additions.entries){
  if(entry.conceptId==='MC-0296'){assert.deepEqual(videos.concepts['MC-0296'],videos.concepts['MC-0255']);continue;}
  if(variety.videoChanges.some(change=>change.conceptId===entry.conceptId))continue;
  const selected=[videos.concepts[entry.conceptId]].flat().find(video=>entry.src?video.src===entry.src:video.videoId===entry.videoId);
  assert.ok(selected,entry.concept);
  if(entry.externalOnly){assert.equal(entry.embedStatus,'UNPLAYABLE',entry.concept);assert.equal(selected.externalOnly,true);}
  else assert.equal(entry.embedStatus,'OK',entry.concept);
  assert.ok(entry.durationSeconds>0,entry.concept);
  if(entry.type==='explanation')assert.ok(entry.durationSeconds<120,entry.concept);
 }
});

test('concerto grosso concepts share the captioned local performance',()=>{
 for(const id of ['MC-0249','MC-0258','MC-0260','MC-0253'])assert.equal(videos.concepts[id].src,'music-dictionary/videos/concerto-grosso-performance.mp4');
});
