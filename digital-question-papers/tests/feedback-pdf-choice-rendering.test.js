'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ui=fs.readFileSync(require.resolve('../exam-ui.js'),'utf8');
function run(choiceClass,disabledSystemColor=false){
 let replacement,removed=false,stroke;
 const label={querySelectorAll:()=>[{remove(){removed=true;}}]},cell={classList:{contains:v=>v===choiceClass}};
 const input={style:{},className:'',checked:true,dataset:{comparisonColumn:'c'},closest:selector=>selector==='label'?label:cell,replaceWith:n=>{replacement=n;}};
 const computed={0:'opacity',1:'color',2:'border-bottom-color',length:3,width:'80px',height:'54px',get color(){return disabledSystemColor&&input.style.color!=='inherit'?'oklab(0.34 0 0)':'rgb(0, 0, 0)';},getPropertyValue(name){return name==='--green'?'#15803d':name==='--red'?'#b91c1c':name==='opacity'?'0':this.color;}};
 const path={getAttribute:()=> '#000000',setAttribute:(name,value)=>{if(name==='stroke')stroke=value;}};
 const tick={style:{},setAttribute(){},querySelectorAll:()=>[path]};
 const doc={querySelectorAll:()=>[input],defaultView:{getComputedStyle:()=>computed},createElement:()=>({style:{setProperty(name,value){this[name]=value;}},setAttribute(){},append(){}}),importNode:()=>tick};
 const context={DOMParser:class{parseFromString(){return{documentElement:tick};}}};
 vm.runInNewContext('let feedbackTickSvgSource="svg";'+ui.slice(ui.indexOf('  function freezeFeedbackChoices('),ui.indexOf('  function outlineFeedbackBravuraGlyphs('))+';this.freeze=freezeFeedbackChoices;',context);
 context.freeze(doc);return{replacement,removed,stroke};
}
test('PDF comparison ticks stay visible, replace the cloned mask, and preserve earned/incorrect/rough-work colours',()=>{
 for(const [state,color]of [['is-user-correct','#15803d'],['is-user-incorrect','#b91c1c'],['','rgb(0, 0, 0)']]){const r=run(state);assert.equal(r.replacement.style.opacity,'1');assert.equal(r.removed,true);assert.equal(r.stroke,color);}
});
test('disabled WebKit comparison inputs use paper colours instead of unsupported system oklab colours',()=>{
 const r=run('',true);
 assert.equal(r.replacement.style.color,'rgb(0, 0, 0)');
 assert.equal(r.replacement.style['border-bottom-color'],'rgb(0, 0, 0)');
 assert.equal(r.stroke,'rgb(0, 0, 0)');
});
test('PDF feature underlining is applied to the actual painted strong text',()=>{
 const text={style:{}},doc={querySelectorAll:selector=>selector.includes('u > strong')?[text]:[]};
 const context={root:{},freezeFeedbackChoices(){},freezeFeedbackTextareas(){}};
 vm.runInNewContext(ui.slice(ui.indexOf('  function outlineFeedbackBravuraGlyphs('),ui.indexOf('  function measureFeedbackPdfBreakpoints('))+';this.outline=outlineFeedbackBravuraGlyphs;',context);
 context.outline(doc);assert.equal(text.style.textDecorationLine,'underline');
});
test('the two source instrument-order diagrams retain vector arrowheads and their distinct fills',()=>{
 const context={};
 vm.runInNewContext(ui.slice(ui.indexOf('  function flowArrowMarkup('),ui.indexOf('  function optionMarkup('))+';this.arrow=flowArrowMarkup;',context);
 for(const [year,width,height,inset,hollow]of [[2024,62,28,26,true],[2026,54,32,27,false]]){
  const paper=require('../papers/advanced-higher-'+year),part=paper.questions.flatMap(q=>q.subquestions).find(p=>p.id==='q5d');
  assert.deepEqual(part.flowArrow,{width,height,shaftInset:inset,hollow});
  const markup=context.arrow(part.flowArrow);
  assert.equal((markup.match(/<polygon /g)||[]).length,hollow?2:1);
  assert.ok(markup.includes(`points="0,${inset} 72,${inset} 72,0 100,50 72,100 72,${100-inset} 0,${100-inset}"`));
  assert.ok(markup.includes('preserveAspectRatio="none"'));
  assert.equal((markup.match(/<svg /g)||[]).length,1,'the inset uses the same SVG viewport so capture cannot displace its lower edge');
  assert.equal((markup.match(/is-inner/g)||[]).length,hollow?1:0);
 }
});
