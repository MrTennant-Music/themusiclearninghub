'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../exam-ui.js'),'utf8');
test('marking focus waits for dialog restoration and identifies the new result',()=>{
 const calls=[],frames=[],heading={isConnected:true,closest(){return null;},setAttribute(k,v){calls.push([k,v]);},focus(o){calls.push(['focus',o.preventScroll]);},scrollIntoView(o){calls.push(['scroll',o.block]);}};
 const context={root:{requestAnimationFrame(fn){frames.push(fn);}}};vm.runInNewContext(source.slice(source.indexOf('  function focusMarkingSummary('),source.indexOf('  function onEngineChange('))+';this.focusSummary=focusMarkingSummary;',context);
 context.focusSummary(heading,'Question 3 checked. 2 of 6 marks. Feedback follows each answer.');assert.equal(heading.tabIndex,-1);assert.equal(calls.some(c=>c[0]==='focus'),false,'closing dialog restores first');frames.shift()();assert.deepEqual(calls.slice(-2),[['focus',true],['scroll','center']]);
 heading.isConnected=false;context.focusSummary(heading,'Results.');frames.shift()();assert.equal(calls.filter(c=>c[0]==='focus').length,1,'a detached result is never focused');
});
test('feedback region names retain source part labels and include the question',()=>{
 const context={};vm.runInNewContext(source.slice(source.indexOf('  function feedbackRegionLabel('),source.indexOf('  function inlineFeedbackMarkup('))+';this.label=feedbackRegionLabel;',context);
 assert.equal(context.label({id:'q7a2',label:'(ii)'}),'Feedback for Question 7 (a) (ii)');
 assert.equal(context.label({id:'q6bii',label:'(ii)'}),'Feedback for Question 6 (b) (ii)');
 assert.equal(context.label({id:'q3a',label:'(a)'}),'Feedback for Question 3 (a)');
 assert.equal(context.label({id:'q2c',label:'3.'}),'Feedback for Question 2 3.');
 assert.equal(context.label({id:'q6a',label:''},[{id:'q6a'},{id:'q6b'}]),'Feedback for Question 6, answer 1');
 assert.equal(context.label({id:'q8a',label:''}),'Feedback for Question 8','an internal a suffix must not invent a printed part label');
});
