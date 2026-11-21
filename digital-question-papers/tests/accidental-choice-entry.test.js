'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),marking=require('../exam-marking');
const source=fs.readFileSync(require.resolve('../exam-notation'),'utf8');
const cases=[[2019,'q4bi',1,'sharp'],[2022,'q2bii',3,'flat'],[2023,'q4c',0,'natural'],[2024,'q2cii',1,'sharp'],[2026,'q4b',0,'sharp']];
test('all fixed-target AH accidental questions offer the complete neutral palette and mark only their source answer',()=>{
 for(const [year,id,index,correct]of cases){const paper=require(`../papers/advanced-higher-${year}`),part=paper.questions.flatMap(q=>q.subquestions).find(p=>p.id===id);assert.deepEqual(part.options.map(o=>o.value),['natural','flat','sharp']);for(const value of ['natural','flat','sharp'])assert.equal(marking.markSubquestion(part,`${value}@${index}`).marks,value===correct?part.marks:0,`${year} ${id} ${value}`);}
});
function harness(value='',review={}){
 const nodes=[],changes=[],events={};let armed='';
 const make=(tag,attributes={})=>({tag,attributes:{...attributes},dataset:{},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,fn){events[k]=fn;},remove(){const index=nodes.indexOf(this);if(index>=0)nodes.splice(index,1);}});
 const svg={append(n){nodes.push(n);},insertBefore(n,target){const old=nodes.indexOf(n);if(old>=0)nodes.splice(old,1);nodes.splice(nodes.indexOf(target),0,n);}},context={q3AccidentalForPart(){return armed;},q3SetAccidentalToolArmed(v){armed=v;},q3CalibratedSymbol(svg,symbol,x,y,options){const node=make('glyph',{symbol,x,y,...options});svg.append(node);return node;},svgElement:make,bindRemovalGesture(target,remove){target.removeAnswer=remove;}};
 const start=source.indexOf('  function q3RenderFixedAccidental('),end=source.indexOf('  function q3BarLabelPlacement2016(',start);vm.runInNewContext(source.slice(start,end)+';this.render=q3RenderFixedAccidental;',context);
 context.render(svg,{part:value},(id,value)=>changes.push([id,value]),review,{id:'part',index:3,correct:'flat',x:200,y:100,top:90,label:'Place selected accidental'});
 return{nodes,changes,events,arm(v){armed=v;}};
}
test('every selected accidental commits and previews its own glyph without pre-marking correctness',()=>{
 for(const choice of ['natural','flat','sharp']){const h=harness();h.arm(choice);h.events.focus();const preview=h.nodes.find(n=>n.attributes.className==='q3-accidental-preview');assert.equal(preview.attributes.symbol,choice+'InScore');assert.equal(preview.attributes.opacity,.35);h.events.blur();assert.ok(!h.nodes.includes(preview));h.events.click({preventDefault(){}});assert.deepEqual(h.changes,[['part',choice+'@3']]);
 const entered=harness(choice+'@3').nodes.find(n=>n.tag==='glyph');assert.equal(entered.attributes.symbol,choice+'InScore');assert.equal(entered.attributes.className,'q3-entered-answer');}
});
test('marked accidental feedback retains wrong red input and shows a source correction only in an empty score slot',()=>{
 const wrong=harness('sharp@3',{part:'incorrect'}).nodes.filter(n=>n.tag==='glyph');assert.equal(wrong.length,1);assert.equal(wrong[0].attributes.symbol,'sharpInScore');assert.equal(wrong[0].attributes.className,'q3-answer-incorrect');
 const blank=harness('',{part:'incorrect'}).nodes.find(n=>n.tag==='glyph');assert.equal(blank.attributes.symbol,'flatInScore');assert.equal(blank.attributes.className,'q3-answer-correction');
 const correct=harness('flat@3',{part:'correct'}).nodes.find(n=>n.tag==='glyph');assert.equal(correct.attributes.className,'q3-answer-correct');
});
