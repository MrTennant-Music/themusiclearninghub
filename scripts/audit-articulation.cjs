'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),React=require('react'),server=require('react-dom/server');
const runtime=fs.readFileSync(process.env.ARTICULATION_AUDIT_RUNTIME||'generated-runtimes/articulationmarkings-1.js','utf8'),a=require('../tests/helpers/articulation-harness.cjs')(runtime),count=Number(process.argv[2]||4000),out=path.resolve(process.argv[3]||'maintenance/generated/articulation-audit');
const inc=(o,k)=>o[k]=(o[k]||0)+1;
const report={samples:count,runtimeHash:crypto.createHash('sha256').update(runtime).digest('hex'),types:{},answers:{},choicePositions:{},metres:{},targetBars:{},duplicateQuestions:0,failures:[]};const seen=new Set();
for(let i=0;i<count;i++){
 const q=a.makeQuestion();inc(report.types,q.type);inc(report.metres,q.timeSignature.id);report.answers[q.type]??={};inc(report.answers[q.type],q.marking.id);inc(report.targetBars,q.target.barIndex??q.target.startBar);
 const ids=q.bars.flatMap(b=>b.notes.map(n=>n.id));if(!q.target.noteIds.length||!q.target.noteIds.every(id=>ids.includes(id)))report.failures.push({i,target:true});
 for(const bar of q.bars)if(bar.notes.reduce((s,n)=>s+a.RH[n.rhythm].beats,0)!==q.timeSignature.beats)report.failures.push({i,bar:bar.barIndex,rhythm:true});
 if(q.type==='identify-choice'){
  const html=server.renderToStaticMarkup(React.createElement(a.MultipleChoice,{question:q,feedback:{correct:true},selected:q.marking.id,onSelect(){}}));
  const buttons=[...html.matchAll(/<button\b([^>]*)>/g)],index=buttons.findIndex(m=>m[1].includes('bg-green-600'));inc(report.choicePositions,index+1);
 }
 const fingerprint=JSON.stringify([q.type,q.marking.id,q.choiceMode,q.timeSignature.id,q.bars.map(b=>b.notes.map(n=>[n.pitch.step,n.rhythm])),q.target.noteIds]);if(seen.has(fingerprint))report.duplicateQuestions++;seen.add(fingerprint);
}
report.customSettings={};for(const marking of a.MARKINGS){const observed={};for(let i=0;i<200;i++){const q=a.makeQuestion(['aural-articulation'],[marking.id]);inc(observed,q.marking.id);if(q.marking.id!==marking.id)report.failures.push({customMarking:marking.id,actual:q.marking.id});}report.customSettings[marking.id]=observed;}
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.failures.length)process.exitCode=1;
