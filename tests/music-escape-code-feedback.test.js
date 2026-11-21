'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
test('reopened code restores marked digits while edited digits and other rooms stay neutral',()=>{
 const source=fs.readFileSync('music-escape/app.js','utf8');
 const state={room:0,lastRejectedCode:{room:0,code:'185'}};
 const makeDial=(value,index)=>({value,dataset:{dial:String(index)},attributes:{},setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];}});
 let dials=[];
 const context={state,room:()=>({code:'123'}),$:()=>({querySelectorAll:()=>dials})};vm.createContext(context);
 vm.runInContext(source.slice(source.indexOf('function restoreCodeFeedback(){'),source.indexOf('function canUnlock(')),context);
 for(let opening=0;opening<2;opening++){
  dials=[makeDial('1',0),makeDial('8',1),makeDial('5',2)];context.restoreCodeFeedback();
  assert.deepEqual(dials.map(d=>d.dataset.result),['correct','incorrect','incorrect']);
  assert.equal(dials[1].attributes['aria-invalid'],'true');
 }
 state.lastRejectedCode.cleared=[1];dials=[makeDial('1',0),makeDial('8',1),makeDial('5',2)];context.restoreCodeFeedback();
 assert.deepEqual(dials.map(d=>d.dataset.result),['correct',undefined,'incorrect']);
 state.room=1;dials=[makeDial('1',0),makeDial('8',1),makeDial('5',2)];context.restoreCodeFeedback();assert(dials.every(d=>!d.dataset.result));
});
