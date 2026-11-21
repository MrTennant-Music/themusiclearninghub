'use strict';const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const runtime=fs.readFileSync(process.env.TRIPLETS_AUDIT_RUNTIME||'generated-runtimes/triplets-1.js','utf8'),a=require('../tests/helpers/triplets-harness.cjs')(runtime),count=Number(process.argv[2]||6000),out=path.resolve(process.argv[3]||'maintenance/generated/triplets-audit');
const report={samples:count,runtimeHash:crypto.createHash('sha256').update(runtime).digest('hex'),types:{},metres:{},keys:{},targetBars:{},targetBeats:{},duplicateQuestions:0,failures:[]},seen=new Set();const inc=(o,k)=>o[k]=(o[k]||0)+1;
for(let i=0;i<count;i++){
 const q=a.createQuestion();inc(report.types,q.tripletType.id);inc(report.metres,q.timeSignature.id);inc(report.keys,q.key.id);inc(report.targetBars,q.targetBarIndex+1);
 const layouts=a.buildLayouts(q),group=a.findNoteGroup(layouts,q.targetNoteIds);if(a.tripletTypeFromGroup(group)?.id!==q.tripletType.id)report.failures.push({i,answer:true});
 for(const [barIndex,bar]of q.bars.entries()){
  let beat=0;for(const note of bar.notes){if(note.targetGroupId===q.targetGroupId&&!bar.notes.slice(0,bar.notes.indexOf(note)).some(n=>n.targetGroupId===q.targetGroupId))inc(report.targetBeats,`${q.timeSignature.id}/${q.tripletType.id}/${beat}`);beat+=a.rhythmInfo(note.rhythm).beats;}
  if(Math.abs(beat-q.timeSignature.beats)>1e-8)report.failures.push({i,barIndex,beat});
 }
 const fingerprint=JSON.stringify([q.key.id,q.timeSignature.id,q.tripletType.id,q.bars.map(b=>b.notes.map(n=>[n.step,n.rhythm,n.writtenAccidental]))]);if(seen.has(fingerprint)){report.duplicateQuestions++;report.failures.push({i,duplicate:true});}seen.add(fingerprint);
}
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.failures.length)process.exitCode=1;
