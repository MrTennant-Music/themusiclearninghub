'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('../tests/helpers/time-signatures-harness.cjs')(),worksheet=require('../tests/helpers/worksheet-generator-harness.cjs');
const count=Number(process.argv[2]||1200),report={samplesPerLevel:count,practice:{},worksheet:{},failures:[]},inc=(o,k)=>o[k]=(o[k]||0)+1;
for(const level of Object.keys(a.LEVELS)){
 const enabled=a.levelEnabledMap(level),rests=a.LEVELS[level].rhythmIds.includes('rests');
 for(const kind of ['practice','worksheet']){
  const w=kind==='worksheet'?worksheet({version:1,activityId:'timesig',sourceUrl:'http://localhost:8765/timesignatures.html',settings:{level,enabledRhythms:enabled,restsEnabled:rests}}):null;
  const r=report[kind][level]={answers:{},keys:{},types:{},keyAnswerPairs:{},duplicates:0,recentDuplicates:0},seen=new Set(),recent=[];
  for(let i=0;i<count;i++){
   const q=w?w.makeQuestion(i):a.makeQuestion(level,enabled,rests),answer=w?q.timeSignature:q.timeSignature.id,key=q.key.id,change=!!q.givenTimeSignature;
   inc(r.answers,answer);inc(r.keys,key);inc(r.types,change?'time-change':'identify');inc(r.keyAnswerPairs,`${key}/${answer}`);
   const fingerprint=JSON.stringify([key,answer,q.givenTimeSignature,q.bars]);if(seen.has(fingerprint))r.duplicates++;seen.add(fingerprint);if(recent.includes(fingerprint)){r.recentDuplicates++;report.failures.push({kind,level,i,recentDuplicate:true});}recent.push(fingerprint);if(recent.length>20)recent.shift();
   q.bars.forEach((bar,j)=>{const notes=w?bar:bar.notes,signature=change&&j<(w?1:4)?q.givenTimeSignature:q.timeSignature,beats=w?Number(signature.split('/')[0])*4/Number(signature.split('/')[1]):signature.beatsPerBar;
    const actual=notes.reduce((s,n)=>s+a.rhythmInfo(n.rhythm).beats,0);if(Math.abs(actual-beats)>1e-8)report.failures.push({kind,level,i,j,beats,actual});
    const shown=new Set();for(const n of notes){const step=w?n.step:n.pitch.step,isG=w?((step%7+7)%7===2):n.pitch.letter==='G';if((w?key==='a-minor':key==='Am')&&isG&&!(w?n.isRest:a.rhythmInfo(n.rhythm).rest)){if(!shown.has(step)&&!(w?n.writtenAccidental:n.pitch.writtenAccidental))report.failures.push({kind,level,i,j,accidental:step});shown.add(step);}}
   });
  }
  // Whole-bank repeats are counted separately from incorrect generation.
  const values=Object.values(r.answers),expected=count/values.length;if(values.some(v=>Math.abs(v-expected)>expected*.15))report.failures.push({kind,level,frequency:r.answers});
 }
}
const out='maintenance/generated/time-signatures-audit';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.failures.length)process.exitCode=1;
