'use strict';
// Reproducible audit of the shipped Practice Questions generator.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),React=require('react');
const seedOffset=Number(process.env.PRACTICE_AUDIT_SEED_OFFSET||0);
const count=Number(process.argv[2]||500),out=path.resolve(process.argv[3]||'maintenance/generated/practice-frequency');
if(!Number.isInteger(count)||count<1)throw Error('Sample count must be a positive integer');
fs.mkdirSync(out,{recursive:true});
const runtime=fs.readFileSync('generated-runtimes/practicequestions-1.js','utf8');
const launch='ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App,null));';
if(!runtime.includes(launch))throw Error('Cannot locate runtime entry point');
const window={PracticeMelodyGenerator:require('../practice-melody-generator.js')};
for(const f of ['bravura-symbols.js','shared/shared-notation-config.js'])vm.runInNewContext(fs.readFileSync(f,'utf8'),{window});
let state=1;const math=Object.create(Math);math.random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
const c=vm.createContext({window,React,Math:math,Date:class extends Date{static now(){return 1794441600000;}},console,performance,setTimeout,clearTimeout});
vm.runInContext(runtime.replace(launch,'globalThis.audit={makeQuestion,defaultPracticeQuestionTypesForLevel,practiceQuestionTypesForLevel,Score,rhythmInfo,practiceWorksheetCompletedState,selectedPracticeQuestionTypeIds,missingNoteIndicesForQuestion};'),c);
const a=c.audit,report={samplesPerLevel:count,seedOffset,runtimeHash:crypto.createHash('sha256').update(runtime).digest('hex'),levels:{},failures:[]};
const inc=(obj,key)=>obj[key]=(obj[key]||0)+1;
const exampleKeys=new Set();
for(const [li,level]of ['N3','N4','N5','H','AH'].entries()){
 if(process.env.PRACTICE_AUDIT_LEVEL&&level!==process.env.PRACTICE_AUDIT_LEVEL)continue;
 const r={papers:count,parts:0,questionTypes:{},variants:{},answers:{},answerAtoms:{},questionTemplates:{},selectionBaseline:{},timingsMs:[],keys:{},metres:{},duplicateTypes:0,duplicatePrompts:0,repeatedPapers:0,consecutiveRepeatedPapers:0,totalValueQuestions:0,totalValueAnswers:{},expectedEnabledTypes:a.practiceQuestionTypesForLevel(level).filter(t=>a.defaultPracticeQuestionTypesForLevel(level)[t.id]).map(t=>t.id)};
 const fingerprints=new Set();let previous=null;
 for(let i=1;i<=count;i++){
  state=Math.imul(li*1000000+i+seedOffset,0x9e3779b1)>>>0;c.level=level;
  const started=performance.now();let q;try{q=vm.runInContext('audit.makeQuestion(level,0,audit.defaultPracticeQuestionTypesForLevel(level))',c,{timeout:5000});}catch(e){report.failures.push({level,seed:i,error:e.message});continue;}
  r.timingsMs.push(performance.now()-started);const completed=a.practiceWorksheetCompletedState(q);
  inc(r.keys,q.key.id);inc(r.metres,q.timeSignature.id);
  const types=new Set(),prompts=new Set();
  for(const part of q.subquestions){
   r.parts++;const id=part.sourceId||part.id;
   if(types.has(id)){r.duplicateTypes++;report.failures.push({level,seed:i,duplicateType:id});}types.add(id);
   const prompt=part.prompt.trim().toLowerCase();if(prompts.has(prompt)){r.duplicatePrompts++;report.failures.push({level,seed:i,duplicatePrompt:prompt});}prompts.add(prompt);
   inc(r.questionTypes,id);
   inc(r.questionTemplates,id+':'+part.prompt.replace(/\b\d+\b/g,'#'));
   const target=id==='noteIdentification'?(q.noteValueCircleTarget??q.noteTarget):id==='interval'?(q.intervalInsertTarget??q.intervalTarget):id==='repeatSigns'?q.repeatTarget:id==='ahChord'||id==='ahBassLine'?q.advancedHigherChordTarget:q[id+'Target'];
   inc(r.variants,id+':'+(id==='dynamic'?q.dynamicQuestionType:target?.variant||target?.type||part.type)+(target?.questionStyle?':'+target.questionStyle:''));
   const answer=part.answer??(part.type==='notes'?q.bars[q.targetBar].notes.filter((n,index)=>(q.missingNoteIndices||[]).includes(index)).map(n=>n.letter+n.octave).join(' '):'[score placement]');
   r.answers[id]??={};inc(r.answers[id],String(answer));
   const atoms=[];
   const pitch=n=>n&&!n.rest?n.letter+(n.writtenAccidental===1?'#':n.writtenAccidental===-1?'b':n.writtenAccidental===0?' natural':'')+n.octave+' '+n.rhythm:'rest';
   const value=completed.practiceAnswers[part.id];
   if(part.type==='notes')for(const index of a.missingNoteIndicesForQuestion(q))atoms.push(pitch(q.bars[q.targetBar].notes[index]));
   else if(part.type==='intervalInsert')atoms.push(pitch(q.intervalInsertTarget.answerNote));
   else if(part.type==='transposition')for(const note of Object.values(value.notes))atoms.push(pitch(note));
   else if(part.type==='enharmonic')atoms.push(pitch(value.note));
   else if(part.type==='ahBassLine')for(const note of Object.values(value.bassNotes))atoms.push(pitch(note));
   else if(part.type==='ahChord')for(const chord of Object.values(value.chordAnswers))atoms.push(chord.chord+' / '+chord.inversion);
   else if(part.type==='higherChord')atoms.push(...Object.values(value.answers));
   else if(part.type==='rhythm'||part.type==='rhythmFix')atoms.push(...Object.values(value.placements));
   else if(part.type==='repeat')atoms.push(...value.placements.map(p=>p.symbolId??q.repeatTarget.symbolId));
   else if(part.type==='scotchSnap')atoms.push(id==='noteIdentification'?q.noteValueCircleTarget.targetRhythm:id==='scaleDegrees'?q.scaleDegreeTarget.degree:q.rhythmIdentificationTarget.variant);
   else if(part.type==='accidentalPlacement')atoms.push(q.accidentalTarget.direction??q.accidentalTarget.symbolId);
   else if(part.type==='articulationPlacement')atoms.push(q.articulationTarget.marking.id);
   else if(part.type==='tripletPlacement')atoms.push(q.tripletTarget.tripletKind);
   else if(part.type==='dynamic')atoms.push(q.dynamic.id);
   else atoms.push(part.answer??'[placement]');
   r.answerAtoms[id]??={};for(const atom of atoms)inc(r.answerAtoms[id],String(atom));
  }
  const fingerprint=crypto.createHash('sha256').update(JSON.stringify({key:q.key.id,time:q.timeSignature.id,bars:q.bars,parts:q.subquestions},(key,value)=>key==='id'?undefined:value)).digest('hex');
  if(fingerprints.has(fingerprint))r.repeatedPapers++;if(previous===fingerprint)r.consecutiveRepeatedPapers++;fingerprints.add(fingerprint);previous=fingerprint;
  const t=q.rhythmIdentificationTarget;
  if(t?.variant==='noteValueTotal'){
   r.totalValueQuestions++;
   const n1=q.bars[t.barIndex].notes[t.noteIndex],n2=q.bars[t.endBarIndex??t.barIndex].notes[t.endNoteIndex??t.noteIndices.at(-1)];
   const actual=a.rhythmInfo(n1.rhythm).beats+a.rhythmInfo(n2.rhythm).beats;inc(r.totalValueAnswers,String(actual));
   if(actual!==t.totalBeats||n1.rest||n2.rest||(!t.tied&&t.noteIndices.length!==2))report.failures.push({level,seed:i,totalValue:t,actual});
   const rendered=require('react-dom/server').renderToStaticMarkup(React.createElement(a.Score,{question:q,userNotes:{},setUserNotes:()=>{},practiceAnswers:{},setPracticeAnswers:()=>{},setHoverNote:()=>{},feedback:null,readOnly:true}));
   const boxTag=rendered.match(/<g data-score-question-source="rhythmIdentification"><rect([^>]+)>/);
   const attribute=(tag,name)=>Number(tag.match(new RegExp('(?:^| )'+name+'="([^"]+)"'))?.[1]);
   const box=boxTag?Object.fromEntries(['x','y','width','height'].map(k=>[k,attribute(boxTag[1],k)])):null;
   const noteheads=[...rendered.matchAll(/<text([^>]*)>([\s\S]*?)<\/text>/g)].filter(m=>/^[\uE0A2-\uE0A4\uE1D2-\uE1DA]$/.test(m[2])).map(m=>({x:attribute(m[1],'x'),y:attribute(m[1],'y')}));
   const inside=box?noteheads.filter(n=>n.x>=box.x&&n.x<=box.x+box.width&&n.y>=box.y&&n.y<=box.y+box.height):[];
   if(/NaN|Infinity/.test(rendered)||!box||box.width<=0||box.height<=0||inside.length!==2){
    report.failures.push({level,seed:i,box,noteheadsInBox:inside.length});
    fs.writeFileSync(path.join(out,'failure-'+level+'-'+i+'.json'),JSON.stringify(q,null,2));
    fs.writeFileSync(path.join(out,'failure-'+level+'-'+i+'.html'),'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=1280" /><link rel="stylesheet" href="/styles/desktop-layout.css"><link rel="stylesheet" href="/styles/hub-touch.css"><script src="/desktop-layout.js"></script><style>@font-face{font-family:Bravura;src:url("/fonts/Bravura.otf")}.music-symbol{font-family:Bravura}svg{width:1200px}</style>'+rendered);
   }
   const key=level+'-'+q.timeSignature.id.replace('/','-')+'-'+(t.tied?'tied':'adjacent');
   if(!exampleKeys.has(key)){
    exampleKeys.add(key);fs.writeFileSync(path.join(out,key+'.json'),JSON.stringify(q,null,2));
    const svg=rendered;
    if(/NaN|Infinity/.test(svg))report.failures.push({level,seed:i,invalidSvg:key});
    fs.writeFileSync(path.join(out,key+'.html'),'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=1280" /><link rel="stylesheet" href="/styles/desktop-layout.css"><link rel="stylesheet" href="/styles/hub-touch.css"><script src="/desktop-layout.js"></script><style>@font-face{font-family:Bravura;src:url("/fonts/Bravura.otf")}.music-symbol{font-family:Bravura,serif;font-weight:400;dominant-baseline:alphabetic}body{margin:30px;font-family:Arial}svg{width:1200px;height:auto}</style><h2>'+key+' — '+actual+' beats</h2>'+svg);
   }
  }
 }
 for(let j=1;j<=10000;j++){
  state=Math.imul(li*1000000+j+seedOffset+50000,0x9e3779b1)>>>0;
  const ids=a.selectedPracticeQuestionTypeIds(a.defaultPracticeQuestionTypesForLevel(level),level);
  for(const id of new Set(ids.map(id=>id.startsWith('transposition')?'transposition':id)))inc(r.selectionBaseline,id);
 }
 r.timingSummary={median:r.timingsMs.slice().sort((a,b)=>a-b)[Math.floor(r.timingsMs.length/2)],maximum:Math.max(...r.timingsMs)};delete r.timingsMs;
 report.levels[level]=r;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 console.log(level+': '+r.parts+' parts; '+r.totalValueQuestions+' total-value questions; '+r.duplicateTypes+' duplicate types; '+r.duplicatePrompts+' duplicate prompts; '+r.repeatedPapers+' repeated papers');
}
report.selectionDrift=[];
for(const [level,r]of Object.entries(report.levels)){
 r.unseenQuestionTypes=r.expectedEnabledTypes.filter(id=>!r.questionTypes[id]);
 for(const [id,n]of Object.entries(r.selectionBaseline)){
  const before=n/10000,after=(r.questionTypes[id]||0)/r.papers;
  const se=Math.sqrt(before*(1-before)*(1/r.papers+1/10000));
  if((Math.abs(after-before)>=.03||(before>=.02&&after<before/2))&&se>0&&Math.abs(after-before)/se>=3.5)report.selectionDrift.push({level,type:id,selectionPercent:100*before,returnedPercent:100*after,percentagePointDifference:100*(after-before)});
 }
}
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
const esc=value=>String(value).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
let tables='';
for(const [level,r]of Object.entries(report.levels)){
 tables+='<h2>'+level+' — '+r.papers+' papers</h2><table><tr><th>Question type</th><th>Count</th><th>% of papers</th><th>Selection baseline %</th><th>Answer elements (count)</th></tr>';
 for(const [id,n]of Object.entries(r.questionTypes).sort((a,b)=>b[1]-a[1]))tables+='<tr><td>'+esc(id)+'</td><td>'+n+'</td><td>'+(100*n/r.papers).toFixed(1)+'%</td><td>'+((r.selectionBaseline[id]||0)/100).toFixed(1)+'%</td><td>'+Object.entries(r.answerAtoms[id]).sort((a,b)=>b[1]-a[1]).map(([v,n])=>esc(v)+' ('+n+')').join('; ')+'</td></tr>';
 tables+='</table><details><summary>Question variants, keys and metres</summary><pre>'+esc(JSON.stringify({variants:r.variants,keys:r.keys,metres:r.metres,timing:r.timingSummary},null,2))+'</pre></details>';

}
fs.writeFileSync(path.join(out,'frequencies.html'),'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=1280" /><link rel="stylesheet" href="/styles/desktop-layout.css"><link rel="stylesheet" href="/styles/hub-touch.css"><script src="/desktop-layout.js"></script><style>body{font:16px Arial;margin:30px}table{border-collapse:collapse;width:1200px}td,th{text-align:left;border:1px solid #ddd;padding:10px}td:last-child{width:750px}</style><h1>Practice Questions frequency audit</h1><p>'+count+' seeded papers per level, default enabled settings. Counts describe returned papers after generation retries. The selection baseline uses 10,000 separate draws of the question selector before score-generation retries. Score-placement answers are expanded into the required written pitches, rhythms, chord names and symbols. Their counts are individual answer elements rather than whole question counts.</p>'+tables);
console.log('Failures: '+report.failures.length+'; report: '+path.join(out,'report.json'));
if(report.failures.length)process.exitCode=1;
