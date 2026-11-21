'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const core=require('../music-escape/core.js'),content=require('../music-escape/content.js'),effects=require('../music-escape/object-effects.js');
const manifest=require('../music-escape/audio/pixabay/manifest.json');
test('objects share approved clue-type recordings and retain distinct remaining sounds',()=>{
 const displayed=new Map();
 for(const length of Object.keys(core.routes))for(const room of core.generate(1,{level:'N3',length},content))for(const key of room.sceneOrder)displayed.set(`${room.index}:${key}`,{index:room.index,key});
 // Help is a repeated visible object even though it is outside the shuffled clue list.
 for(let index=0;index<core.rooms.length;index++){displayed.set(`${index}:help`,{index,key:'help'});displayed.set(`${index}:exit`,{index,key:'exit'});}
 for(const {index,key} of displayed.values())assert(manifest.rooms[index][key],`Missing visible object ${index}:${key}`);
 const ids=new Set(),hashes=new Set(),sources=new Set();
 for(const [room,entries] of Object.entries(manifest.rooms))for(const key of Object.keys(entries)){
  const index=Number(room),sharedEffect=(key==='help'&&index!==0)||(['archive','recording','order'].includes(key)&&index!==0&&!(key==='recording'&&index===2))||(key==='ear-training'&&![2,5,8].includes(index))||(key==='mechanism'&&[1,5].includes(index));
  const effect=effects[key][index];assert(effect,`${index}:${key}`);if(!sharedEffect)assert(!ids.has(effect),effect);if(!sharedEffect)ids.add(effect);assert(!effect.startsWith('objects/'));
  const file=effect==='piano'?'music-escape/audio/piano-keys.m4a':`music-escape/audio/${effect}.mp3`;
  const data=fs.readFileSync(file),hash=crypto.createHash('sha256').update(data).digest('hex');
  assert(data.length>1000,file);if(!sharedEffect)assert(!hashes.has(hash),file);if(!sharedEffect)hashes.add(hash);
  const entry=manifest.rooms[index][key];assert.equal(entry.effect,effect);assert.equal(entry.sha256,hash);if(manifest.durationExceptions.includes(effect)){assert.equal(entry.fullLength,true);assert(entry.durationSeconds>2);}else assert(entry.durationSeconds<=1,entry.effect+' exceeds one second');assert(entry.sourcePage.startsWith('https://pixabay.com/sound-effects/'));assert.equal(entry.licence,'Pixabay Content License');
  if(!sharedEffect)assert(!sources.has(entry.sourceId),'Repeated source '+entry.sourceId);if(!sharedEffect)sources.add(entry.sourceId);
 }
 assert.equal(ids.size,24);assert(Object.values(effects.help).every(effect=>effect==='book'));assert.equal(effects.mechanism[0],'piano');assert.equal(effects.exit[0],'handle');
});
test('clue categories share their requested sounds across every room',()=>{
 for(const [key,reference] of Object.entries({archive:0,recording:0,order:0,'ear-training':2})){
  for(const [room,effect] of Object.entries(effects[key]))if(!(key==='recording'&&room==='2')&&!(key==='ear-training'&&['5','8'].includes(room)))assert.equal(effect,effects[key][reference],key);
 }
 assert.equal(effects.mechanism[1],effects.mechanism[0]);assert.equal(effects.mechanism[5],effects.mechanism[0]);assert.equal(effects['ear-training'][8],'pixabay/room-8-ear-training-38333');assert.equal(effects['ear-training'][5],'pixabay/room-5-ear-training-6743');assert.equal(effects.recording[2],'pixabay/room-2-recording-83962');assert.equal(effects.archive[3],'drawer');assert.equal(effects.order[3],'paper');
 assert.equal(effects.recording[3],effects.recording[0]);
 assert.equal(effects['ear-training'][2],'pixabay/room-8-ear-training-75805');
 assert.equal(manifest.rooms[3].mechanism.sourceId,'150130');
 const html=fs.readFileSync('musicescape.html','utf8');assert(html.indexOf('music-escape/object-effects.js')<html.indexOf('music-escape/app.js'));
});
