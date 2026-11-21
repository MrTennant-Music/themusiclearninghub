'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('music-dictionary/quiz-review.js','utf8'),start=source.indexOf(' const filter='),end=source.indexOf('\n const body=',start);
const h=(type,props,...children)=>({type,props,children});
test('Level change survives the change event being released while the current edit saves',async()=>{
 let chosen='N3',resume;const pending=new Promise(resolve=>resume=resolve),context={h,navigate:async fn=>{await pending;fn();}};vm.runInNewContext(source.slice(start,end)+';this.filter=filter;',context);
 const control=context.filter('cq-level','Level','N3',[['N3','National 3'],['N4','National 4']],v=>chosen=v),event={target:{value:'N4'}};
 control.children[1].props.onChange(event);event.target=null;assert.equal(chosen,'N3');resume();await pending;await Promise.resolve();assert.equal(chosen,'N4');
});
test('Level stays unchanged when the pending edit cannot be saved',async()=>{
 let chosen='N3';const context={h,navigate:async()=>false};vm.runInNewContext(source.slice(start,end)+';this.filter=filter;',context);const control=context.filter('cq-level','Level','N3',[],v=>chosen=v);control.children[1].props.onChange({target:{value:'N4'}});await Promise.resolve();assert.equal(chosen,'N3');
});
