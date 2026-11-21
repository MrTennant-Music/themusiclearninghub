'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('medal unlock keeps the normal overlay and triggers the shared stat celebration once',()=>{
 const source=fs.readFileSync('music-escape/app.js','utf8');
 for(const muted of [false,true])for(const finalRoom of [false,true])for(const preview of [false,true]){
  const tier=finalRoom?'diamond':'bronze',roomIndex=finalRoom?5:2;
  const effectSounds=[],shown=[],awarded=[],sounds=[],draws=[],state={room:roomIndex,options:{level:'N3'},fragments:Array(roomIndex).fill(0),unlocked:false};
  const context={state,sharedCollection:null,roomPreviewIndex:preview?roomIndex:null,modalKey:'exit',medalCelebrationKey:0,medalCelebrationUntil:0,medalSoundTimer:null,MAX_LIVES:3,prefs:{muted,effects:30},document:{hidden:false},adventure:Array(6),doorEffects:['a','b','c'],C:{advance(s){s.finished=true;},medal:s=>s.fragments.length===roomIndex+1?tier:null,solve(s){s.fragments.push(2);s.unlocked=true;return true;}},solved:()=>state.unlocked,room:()=>({digits:[1,2,3]}),draft:()=>['1','2','3'],canUnlock:()=>true,close(){},stopSound(){},draw(){draws.push(context.medalCelebrationKey);},show(...args){shown.push(args);},playEffect(name){effectSounds.push(name);},clearTimeout(){},setTimeout(fn){fn();return 1;},MLH:{achievements:{medals:{[tier]:{icon:tier+'.svg',label:tier}},award(...args){awarded.push(args);}},playFeedbackSound(...args){sounds.push(args);}}};
  vm.createContext(context);vm.runInContext(source.slice(source.indexOf('function check(){'),source.indexOf('function advanceRoom(){')),context);context.check();context.check();
  if(finalRoom){assert.equal(state.finished,true);assert.equal(shown.length,0);assert.equal(sounds.length,1);assert.deepEqual(sounds[0],[true,true,'platinum']);assert.equal(effectSounds.length,0);assert.equal(awarded.length,preview?0:1);assert.deepEqual(draws,[1]);continue;}assert.deepEqual(effectSounds,['c']);assert.equal(shown.length,1);assert.equal(shown[0][0],finalRoom?'You did it!':'Unlocked');assert(shown[0][2].includes('>Leave</button>'));assert.equal(awarded.length,preview?0:1);assert.deepEqual(draws,[1]);assert(context.medalCelebrationUntil>Date.now());assert.equal(sounds.length,1);{assert.deepEqual(sounds[0].slice(0,3),[true,true,finalRoom?'platinum':'bronze']);assert.equal(sounds[0].length,3);}
 }
});
