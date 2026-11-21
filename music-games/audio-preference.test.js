const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('music-games/core.js','utf8');
function openPage(storage){const ctx={localStorage:storage,IGActivityIndex:[]};vm.runInNewContext(source,ctx);return ctx.IGCore;}
test('mute survives refresh and different games, while explicit QR settings take priority',()=>{
 const saved=new Map(),storage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)};
 let C=openPage(storage);assert.equal(C.readSoundPreference(),true);C.saveSoundPreference(false);
 C=openPage(storage);assert.equal(C.readSoundPreference(),false);
 for(const template of ['group-sort','quiz','crossword'])assert.equal(C.sessionOptions(C.makeActivity({template,options:{sound:true}})).sound,false);
 assert.equal(C.sessionOptions(C.makeActivity({options:{sound:true}}),true).sound,true);
 C.saveSoundPreference(true);C=openPage(storage);assert.equal(C.readSoundPreference(),true);assert.equal(C.sessionOptions(C.makeActivity({options:{sound:false}}),true).sound,false);
});
test('unavailable storage preserves existing sound defaults without breaking controls',()=>{
 const C=openPage({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}});
 assert.equal(C.readSoundPreference(),true);assert.equal(C.readSoundPreference(false),false);assert.doesNotThrow(()=>C.saveSoundPreference(false));
 assert.equal(C.sessionOptions(C.makeActivity({options:{sound:false}}),true).sound,false);
});
test('unrecognised stored values fall back to activity defaults',()=>{
 const C=openPage({getItem:()=> 'invalid'});assert.equal(C.readSoundPreference(false),false);assert.equal(C.readSoundPreference(true),true);
});
