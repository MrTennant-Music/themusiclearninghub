'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('digital-question-papers/exam-ui.js','utf8');
function harness(type='radio',selected=true){
 const inputEvents={},labelEvents={},jobs=[];let saved=selected?'A':'',cleared=0,locked=false;
 const label={addEventListener:(n,fn)=>labelEvents[n]=fn};
 const input={type,checked:selected,disabled:false,closest:selector=>selector==='label'?label:locked?{}:null,addEventListener:(n,fn)=>inputEvents[n]=fn};
 const context={setTimeout:(fn,delay)=>{assert.equal(delay,0);jobs.push(fn);}};vm.createContext(context);
 vm.runInContext(source.slice(source.indexOf('  function bindTickRemoval('),source.indexOf('  function capitaliseInitialText('))+';this.bind=bindTickRemoval;',context);
 context.bind(input,()=>{input.checked=false;saved='';cleared++;},()=>saved==='A');
 return{input,inputEvents,labelEvents,jobs,save:v=>saved=v,lock:()=>locked=true,get saved(){return saved;},get cleared(){return cleared;},click(){const e={preventDefault(){this.prevented=true;}};inputEvents.click(e);return e;}};
}
test('one tap clears the visible tick in the next task after native radio cancellation finishes',()=>{
 const h=harness();const event=h.click();assert.equal(event.prevented,true);assert.equal(h.jobs.length,1);
 h.input.checked=true;h.jobs.shift()();assert.equal(h.input.checked,false);assert.equal(h.saved,'');assert.equal(h.cleared,1);
});
test('a new selection retains normal native activation and can then be cleared with one tap',()=>{
 const h=harness('radio',false);h.input.checked=true;assert.equal(h.click().prevented,undefined);assert.equal(h.jobs.length,0);
 h.save('A');assert.equal(h.click().prevented,true);h.jobs.shift()();assert.equal(h.saved,'');
});
test('disabled and checked Practice answers remain locked',()=>{
 for(const lock of ['disabled','practice']){const h=harness();if(lock==='disabled')h.input.disabled=true;else h.lock();assert.equal(h.click().prevented,undefined);assert.equal(h.jobs.length,0);}
});
test('checkbox and comparison ticks keep native single-click toggling without double-tap handlers',()=>{
 const h=harness('checkbox');assert.equal(h.inputEvents.click,undefined);assert.equal(h.labelEvents.touchend,undefined);assert.equal(h.labelEvents.dblclick,undefined);
 assert.equal(typeof h.labelEvents.contextmenu,'function');
 h.labelEvents.keydown({shiftKey:true,key:'Delete',preventDefault(){}});assert.equal(h.input.checked,false);
 assert.equal((source.match(/bindTickRemoval\(input,/g)||[]).length,4,'the helper plus radio, checkbox and comparison bindings');
 assert.match(source,/Tap or click a ticked box once to remove the tick/);
});
