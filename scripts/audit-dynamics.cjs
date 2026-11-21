'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const runtime=fs.readFileSync(process.env.DYNAMICS_AUDIT_RUNTIME||'generated-runtimes/dynamics-1.js','utf8'),a=require('../tests/helpers/dynamics-harness.cjs')(runtime);
const count=Number(process.argv[2]||2000),out=path.resolve(process.argv[3]||'maintenance/generated/dynamics-audit');
const report={samplesPerLevel:count,runtimeHash:crypto.createHash('sha256').update(runtime).digest('hex'),levels:{},failures:[]};const inc=(o,k)=>o[k]=(o[k]||0)+1;
for(const [level,settings]of Object.entries(a.LEVELS)){
 const row=report.levels[level]={types:{},answers:{},audioAnswers:{},choicePositions:{},placementBars:{},metres:{},duplicateQuestions:0};const seen=new Set();
 for(let i=0;i<count;i++){
  const q=a.makeQuestion(a.QUESTION_TYPES,settings.dynamics);inc(row.types,q.type);inc(row.metres,q.timeSignature.id);row.answers[q.type]??={};inc(row.answers[q.type],q.answerId);
  if(q.type==='audio')inc(row.audioAnswers,q.answerId);
  if(q.type==='multiple-choice'){const correct=q.choices.findIndex(c=>c.id===q.answerId);inc(row.choicePositions,correct+1);if(correct<0||new Set(q.choices.map(c=>c.id)).size!==q.choices.length)report.failures.push({level,i,choices:true});}
  for(const req of q.required)inc(row.placementBars,req.barIndex+1);
  if(!settings.dynamics.includes(q.answerId))report.failures.push({level,i,disabledAnswer:q.answerId});
  if(q.required.length&&(!a.placementsMatch(q,q.required)||a.wrongPlacements(q,q.required).length||a.missingRequired(q,q.required).length))report.failures.push({level,i,marking:true});
  const expected=q.timeSignature.id==='6/8'?3:q.timeSignature.beats;
  for(const bar of q.bars)if(bar.notes.reduce((s,n)=>s+a.rhythm(n.rhythm).beats,0)!==expected)report.failures.push({level,i,bar:bar.barIndex,rhythm:true});
  const fingerprint=JSON.stringify([q.type,q.answerId,q.prompt,q.timeSignature.id,q.bars.map(b=>b.notes.map(n=>[n.step,n.rhythm])),q.required]);if(seen.has(fingerprint))row.duplicateQuestions++;seen.add(fingerprint);
 }
}
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.failures.length)process.exitCode=1;
