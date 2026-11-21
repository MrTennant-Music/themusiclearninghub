'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const runtime=fs.readFileSync(process.env.FOLLOW_SCORE_RUNTIME||'generated-runtimes/followthescore-1.js','utf8');
const a=require('../tests/helpers/follow-score-harness.cjs')(runtime),count=Number(process.argv[2]||1000),out=path.resolve(process.argv[3]||'maintenance/generated/follow-score-audit');
const inc=(o,k)=>o[k]=(o[k]||0)+1;
const report={samplesPerLevel:count,runtimeHash:crypto.createHash('sha256').update(runtime).digest('hex'),levels:{},failures:[]};
for(const level of ['N3','N4','N5','H','AH']){
 if(process.env.FOLLOW_AUDIT_LEVEL&&process.env.FOLLOW_AUDIT_LEVEL!==level)continue;
 const row=report.levels[level]={repeats:{},bars:{},noteIndices:{},keys:{},metres:{},duplicateQuestions:0,recentDuplicates:0};const seen=new Set(),recent=[];
 for(let i=0;i<count;i++){
  let q;try{q=a.makeFollowScoreQuestion(level);}catch(e){report.failures.push({level,i,error:e.message});console.error(level,i,e.message);continue;}
  if(i%100===0)console.error(level,i,'generated');
  inc(row.repeats,q.repeat.type);inc(row.bars,q.target.barIndex+1);inc(row.noteIndices,q.target.noteIndex+1);inc(row.keys,q.key.id);inc(row.metres,q.timeSignature.id);
  const order=a.repeatPlaybackBars(q).map(b=>b.barIndex);
  if(JSON.stringify(order)!==JSON.stringify(q.repeat.order))report.failures.push({level,i,route:true});
  if(!a.followScoreNoteSounds(q.bars[q.target.barIndex],q.target,q.target.noteIndex))report.failures.push({level,i,silentTarget:true});
  const stop=a.followScoreStopAfterSeconds(q),bs=60/q.tempoBpm;
  const start=q.repeat.order.slice(0,q.target.occurrenceIndex).reduce((sum,j)=>sum+a.timeSignatureForBar(q,j).beats*bs,0)+q.target.beat*bs;
  if(!Number.isFinite(stop)||stop<=start)report.failures.push({level,i,stop,start});
  for(const bar of q.bars){const beats=bar.notes.reduce((s,n)=>s+a.rhythmInfo(n.rhythm).beats,0);if(Math.abs(beats-a.timeSignatureForBar(q,bar).beats)>1e-6)report.failures.push({level,i,bar:bar.barIndex,beats});}
  const fingerprint=JSON.stringify([q.key.id,q.timeSignature.id,q.bars.map(b=>b.notes.map(n=>[n.letter,n.octave,n.rhythm,n.writtenAccidental])),q.repeat.order,q.target.barIndex,q.target.noteIndex]);
  if(seen.has(fingerprint))row.duplicateQuestions++;if(recent.includes(fingerprint)){row.recentDuplicates++;report.failures.push({level,i,recentDuplicate:true});}seen.add(fingerprint);recent.push(fingerprint);if(recent.length>20)recent.shift();
 }
 console.log(level,JSON.stringify(row));
}
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('Failures:',report.failures.length);if(report.failures.length)process.exitCode=1;
