'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('Escape medal sound fades within its limit while other activities keep their duration',async()=>{
 const source=fs.readFileSync('shared/hub-audio.js','utf8');
 for(const limited of [true,false]){
  const gains=[],timers=[];
  const context={currentTime:0,destination:{},createGain(){const calls=[];const gain={calls,gain:{value:0,setValueAtTime(...args){calls.push(['set',...args]);},linearRampToValueAtTime(...args){calls.push(['linear',...args]);},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};gains.push(gain);return gain;},createOscillator(){return {frequency:{setValueAtTime(){}},connect(){},start(){},stop(){}};}};
  const scope={MLH:{},prepareFeedbackSound:async()=>context,window:{setTimeout(fn,ms){timers.push(ms);}}};vm.createContext(scope);
  vm.runInContext(source.slice(source.indexOf('  async function playFeedbackSound('),source.indexOf('  function getStreakMedal(')),scope);
  await scope.playFeedbackSound(true,true,'bronze',limited?{maxDurationMs:900}:undefined);
  assert.equal(timers[0],limited?900:3500);
  if(limited)assert(gains[0].calls.some(([kind,value,time])=>kind==='linear'&&value===0&&time<1));
  else assert(!gains[0].calls.some(([kind])=>kind==='linear'));
 }
});
