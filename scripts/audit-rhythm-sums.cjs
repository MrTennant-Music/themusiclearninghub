'use strict';const fs=require('node:fs'),a=require('../tests/helpers/rhythm-sums-harness.cjs')(),worksheet=require('../tests/helpers/worksheet-generator-harness.cjs'),count=Number(process.argv[2]||1200),out=process.argv[3]||'maintenance/generated/rhythm-sums-audit',report={samplesPerConfiguration:count,results:{},failures:[]};const inc=(o,k)=>o[k]=(o[k]||0)+1;
for(const level of Object.keys(a.LEVELS))for(const mode of ['default','all-operations'])for(const kind of ['practice','worksheet']){
 const settings={...a.settingsForLevel(level),...(mode==='all-operations'?{enabledOperators:['+','−','×','÷']}:{})},w=kind==='worksheet'?worksheet({version:1,activityId:'rhythmsums',sourceUrl:'http://localhost:8765/rhythmsums.html',settings:{level,...settings}}):null;
 const r=report.results[`${kind}/${level}/${mode}`]={operators:{},answersByOperator:{},items:{},restNotes:{},consecutiveDuplicates:0};let last='';
 for(let i=0;i<count;i++){
  const q=w?w.makeQuestion(i):a.makeQuestion(settings);inc(r.operators,q.operator);r.answersByOperator[q.operator]??={};inc(r.answersByOperator[q.operator],q.answer);for(const item of [q.left,q.right]){inc(r.items,item.id);inc(r.restNotes,item.displayType||item.kind);}
  const expected=a.calculate(q.left.beats,q.operator,q.right.beats);if(Math.abs(expected-q.answer)>1e-8||!a.isQuarterBeat(q.answer))report.failures.push({kind,level,mode,i,operator:q.operator,left:q.left.beats,right:q.right.beats,expected,answer:q.answer});
  const fp=JSON.stringify([q.left.id,q.left.rhythm,q.operator,q.right.id,q.right.rhythm]);if(fp===last)r.consecutiveDuplicates++;last=fp;
 }
}
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({samplesPerConfiguration:count,failures:report.failures.length,firstFailures:report.failures.slice(0,5),results:report.results},null,2));if(report.failures.length)process.exitCode=1;
