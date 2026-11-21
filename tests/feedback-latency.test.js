'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('shared/hub-audio.js','utf8');
function harness(){
 const contexts=[],started=[],timers=[],events={},documentEvents={};
 const param={setValueAtTime(){},exponentialRampToValueAtTime(){}};
 class Context{
  constructor(options){this.options=options;this.state='suspended';this.currentTime=2;this.destination={};this.resumes=0;this.gains=[];contexts.push(this);}
  resume(){this.resumes++;this.state='running';return Promise.resolve();}
  close(){this.state='closed';return Promise.resolve();}
  createGain(){const node={gain:{...param},connect(){},disconnect(){this.disconnected=true;}};this.gains.push(node);return node;}
  createOscillator(){return{frequency:param,connect(){},start:t=>started.push(t),stop(){}};}
 }
 const context={window:{AudioContext:Context,setTimeout:fn=>timers.push(fn),addEventListener:(n,fn)=>events[n]=fn},document:{addEventListener:(n,fn)=>documentEvents[n]=fn}};
 vm.createContext(context);vm.runInContext(source.slice(source.indexOf('  let feedbackContext ='),source.indexOf('  function getStreakMedal')),context);
 return{...context,contexts,started,timers,events,documentEvents};
}
test('success, failure and medal sounds share one prepared engine and start without the former 80ms wait',async()=>{
 const h=harness();await h.prepareFeedbackSound();await h.playFeedbackSound(true);await h.playFeedbackSound(false);await h.playFeedbackSound(true,true,'gold');
 assert.equal(h.contexts.length,1);assert.equal(h.contexts[0].resumes,1);assert.equal(h.contexts[0].options.latencyHint,'interactive');
 assert.equal(h.started[0],2.005);assert.ok(h.started.length>3);
 h.timers.forEach(fn=>fn());assert.equal(h.contexts[0].state,'running','cleaning up a sound must not close the next sound’s engine');
 assert.equal(h.contexts[0].gains.filter(g=>g.disconnected).length,3);
});
test('a fresh engine is available after leaving and restoring the page',async()=>{
 const h=harness();await h.playFeedbackSound(true);h.events.pagehide();assert.equal(h.contexts[0].state,'closed');
 await h.playFeedbackSound(false);assert.equal(h.contexts.length,2);assert.equal(h.contexts[1].state,'running');
});
test('Confirm can prepare audio during the press without submitting or playing feedback',async()=>{
 const h=harness(),button={disabled:false,classList:{contains:()=>false},textContent:'Confirm'};
 h.documentEvents.pointerdown({target:{closest:()=>button}});await Promise.resolve();
 assert.equal(h.contexts.length,1);assert.equal(h.started.length,0);
 button.disabled=true;h.events.pagehide();h.documentEvents.pointerdown({target:{closest:()=>button}});assert.equal(h.contexts.length,1);
});
test('audio resume failures do not throw or prevent later feedback attempts',async()=>{
 const h=harness();await h.prepareFeedbackSound();const engine=h.contexts[0];engine.state='suspended';engine.resume=()=>Promise.reject(new Error('blocked'));
 await assert.doesNotReject(h.playFeedbackSound(true));engine.resume=()=>{engine.state='running';return Promise.resolve();};
 await h.playFeedbackSound(true);assert.ok(h.started.length>0);
});
test('shared feedback stays visible from the first frame while retaining animations',()=>{
 const shell=fs.readFileSync('shared/hub-shell.js','utf8'),css=fs.readFileSync('styles/hub-ui.css','utf8');
 assert.match(shell,/hubFeedbackIn \.18s/);assert.match(shell,/hubFeedbackWrong \.26s/);
 const rules=css.slice(css.indexOf('@keyframes hubFeedbackIn'));
 assert.doesNotMatch(rules,/opacity\s*:\s*0/);assert.match(rules,/opacity:1/);
});
