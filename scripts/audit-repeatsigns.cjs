'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const a=require('../tests/helpers/repeatsigns-harness.cjs')();
const count=Number(process.argv[2]||1000),out=path.resolve('maintenance/generated/repeatsigns-audit');
if(!Number.isInteger(count)||count<1)throw Error('Invalid sample count');
const report={samplesPerLevel:count,runtimeHash:crypto.createHash('sha256').update(fs.readFileSync('generated-runtimes/repeatsigns-1.js')).digest('hex'),levels:{},failures:[]};
const inc=(o,k)=>o[k]=(o[k]||0)+1;
for(const level of Object.keys(a.LEVELS)){
 const r=report.levels[level]={types:{},answers:{},keys:{},metres:{},duplicatePapers:0};const seen=new Set();
 for(let i=0;i<count;i++){
  const q=a.makeQuestion(level);inc(r.types,q.type);inc(r.keys,q.key.id);inc(r.metres,q.timeSignature.id);
  for(const p of q.required)inc(r.answers,`${q.type}/${p.symbolId}/bar ${p.barIndex+1}${p.optional?' (optional)':''}`);
  if(!a.placementsMatch(q,q.required)||a.wrongPlacements(q,q.required).length||a.missingRequired(q,q.required).length)report.failures.push({level,i,marking:true});
  if(q.bars.some(b=>b.notes.reduce((s,n)=>s+a.rhythm(n.rhythm).beats,0)!==q.timeSignature.beats))report.failures.push({level,i,rhythm:true});
  const fingerprint=JSON.stringify([q.type,q.key.id,q.timeSignature.id,q.bars.map(b=>b.notes.map(n=>[n.step,n.rhythm,n.accidental,n.freq])),q.required]);
  if(seen.has(fingerprint)){r.duplicatePapers++;report.failures.push({level,i,duplicate:true});}seen.add(fingerprint);
  for(const bar of q.bars){const memory={};for(const note of bar.notes){
   const pitch=note.letter+note.octave;
   if(note.writtenAccidental!==null)memory[pitch]=note.writtenAccidental;
   const natural=12*(note.octave+1)+{C:0,D:2,E:4,F:5,G:7,A:9,B:11}[note.letter];
   if(natural+(memory[pitch]??q.key.keyAccidentals[note.letter]??0)!==note.midi)report.failures.push({level,i,bar:bar.barIndex,pitch,accidental:true});
  }}
 }
}
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.failures.length)process.exitCode=1;
