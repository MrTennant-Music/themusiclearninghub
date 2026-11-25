'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),React=require('react'),server=require('react-dom/server');
const load=require('./helpers/articulation-harness.cjs');
const plain=x=>JSON.parse(JSON.stringify(x));
test('every custom marking selection is respected, including audio-only settings',()=>{
 const a=load(),ids=a.MARKINGS.map(m=>m.id);
 for(let mask=1;mask<16;mask++){
  const enabled=ids.filter((_,i)=>mask&(1<<i));
  for(const type of a.QUESTION_TYPES)for(let i=0;i<20;i++){
   const q=a.makeQuestion([type],enabled);assert.ok(enabled.includes(q.marking.id),`${type}/${enabled}: ${q.marking.id}`);
   if(type==='aural-articulation'&&!enabled.some(id=>id!=='phrase'))assert.notEqual(q.type,type);else assert.equal(q.type,type);
   for(const bar of q.bars)assert.equal(bar.notes.reduce((s,n)=>s+a.RH[n.rhythm].beats,0),q.timeSignature.beats);
   const all=q.bars.flatMap(b=>b.notes.map(n=>n.id));assert.ok(q.target.noteIds.length);assert.ok(q.target.noteIds.every(id=>all.includes(id)));
   if(q.type==='aural-articulation'&&q.marking.id==='accent'){assert.equal(q.target.noteIds.length,1);assert.equal(Number(q.target.noteIds[0].split('-')[0]),q.target.barIndex);}
  }
 }
});
test('multiple-choice positions vary for every marking and retain the correct performance label',()=>{
 const a=load(),positions={};
 for(let i=0;i<3000;i++){
  const q=a.makeQuestion(['identify-choice']);positions[q.marking.id]??=[0,0,0,0];positions[q.marking.id][q.answerOptions.indexOf(q.marking.id)]++;
  assert.equal(new Set(q.answerOptions).size,4);
  const html=server.renderToStaticMarkup(React.createElement(a.MultipleChoice,{question:q,onSelect(){}}));
  assert.ok(html.includes(q.choiceMode==='performance'?q.marking.performance:q.marking.id==='phrase'?'Phrase mark':q.marking.id==='slur'?'Slurs':q.marking.label));
 }
 for(const counts of Object.values(positions))for(const count of counts)assert.ok(count>120&&count<260,JSON.stringify(counts));
});
test('cross-system slurs and phrase selections draw one curve per staff instead of a diagonal',()=>{
 const a=load(),q=a.makeQuestion(['apply'],['phrase']),all=q.bars.flatMap(b=>b.notes.map(n=>n.id));
 for(const id of ['slur','phrase']){
  const markup=server.renderToStaticMarkup(React.createElement(a.Mark,{id,noteIds:all,ls:a.layouts(q)}));
  assert.equal((markup.match(/<path /g)||[]).length,2);assert.doesNotMatch(markup,/NaN|Infinity/);
 }
});
test('note targets and articulation tools have keyboard semantics and unique names',()=>{
 const a=load(),q=a.makeQuestion(['apply']);
 const html=server.renderToStaticMarkup(React.createElement(a.Score,{question:q,selectedNotes:[],selectedMarking:'accent',feedback:null,onNoteClick(){}}));
 const labels=[...html.matchAll(/aria-label="(Select note [^"]+)"/g)].map(m=>m[1]);assert.equal(labels.length,q.bars.flatMap(b=>b.notes).length);assert.equal(new Set(labels).size,labels.length);assert.match(html,/tabindex="0"/);
 const tools=server.renderToStaticMarkup(React.createElement(a.ApplyAnswers,{enabledMarkings:['accent'],selectedMarking:null}));assert.match(tools,/aria-label="Accent"/);assert.equal((tools.match(/<button /g)||[]).length,1);
});
test('applied notes and markings replace their blue preview with the feedback colour',()=>{
 const a=load(),question=a.makeQuestion(['apply'],['staccato']);
 const targets=question.target.noteIds;
 const wrongNote=question.bars.flatMap(bar=>bar.notes).find(note=>!targets.includes(note.id)).id;
 const render=(selectedNotes,feedback)=>server.renderToStaticMarkup(React.createElement(a.Score,{question,selectedNotes,selectedMarking:'staccato',feedback,onNoteClick(){}}));
 const count=(markup,colour)=>[...markup.matchAll(new RegExp(`<text [^>]*fill="${colour}"`,'g'))].length;
 assert.equal(count(render(targets,null),'#2563eb'),2*targets.length);
 const correct=render(targets,{correct:true});
 assert.equal(count(correct,'#2563eb'),0);
 assert.equal(count(correct,'#16a34a'),2*targets.length);
 const incorrect=render([wrongNote],{correct:false});
 assert.equal(count(incorrect,'#2563eb'),0);
 assert.equal(count(incorrect,'#dc2626'),2);
 assert.equal(count(incorrect,'#16a34a'),2*targets.length);
});
test('audio playback applies staccato/legato durations and accents exactly the selected note',async()=>{
 const a=load(),source=fs.readFileSync('articulationmarkings.html','utf8'),start=source.indexOf('  async function playAural()'),end=source.indexOf('  return <div className={window.MLH.shell.pageShellClass}>',start);
 for(const id of ['staccato','slur','accent']){
  const question=a.makeQuestion(['aural-articulation'],[id]),sounds=[];
  class AudioContext{constructor(){this.currentTime=10;this.destination={};}createGain(){return {gain:{value:0},connect(){}};}}
  const c=vm.createContext({question,playing:false,audioRef:{current:null},masterRef:{current:null},timerRef:{current:null},highlightTimersRef:{current:[]},stopAudio(){},setPlaying(){},setPromptMessage(){},setActiveNoteId(){},window:{AudioContext,MLH:{prepareAudioPlayback:async()=>true,playPianoFrequency:(...args)=>sounds.push({duration:args[4],volume:args[5]}),naturalPlaybackTailMs:()=>650}},setTimeout:()=>1,freq:()=>440,metronomeEnabled:false,followPlayback:false,tempo:'andante',RH:a.RH,Math});
  vm.runInContext(source.slice(start,end),c);await vm.runInContext('playAural()',c);
  const notes=question.bars.flatMap(b=>b.notes);assert.equal(sounds.length,notes.length);
  sounds.forEach((sound,i)=>assert.ok(Math.abs(sound.duration-a.RH[notes[i].rhythm].beats*60/88*(id==='staccato'?.42:.96))<1e-9));
  if(id==='accent'){assert.equal(sounds.filter(s=>s.volume===.13).length,1);assert.equal(sounds[notes.findIndex(n=>question.target.noteIds.includes(n.id))].volume,.13);}
 }
});
test('articulation worksheets balance modes and metres independently and avoid tie-like slurs',()=>{
 const a=require('./helpers/worksheet-generator-harness.cjs')({version:1,activityId:'articulation',sourceUrl:'http://localhost:8765/articulationmarkings.html',settings:{level:'H',enabledMarkings:['staccato','slur','phrase','accent'],enabledTypes:['identify-choice','identify-text','apply']}});
 const variants={},accentTargets=new Set();
 for(let paper=0;paper<200;paper++){
  const modes={apply:0,identify:0},metres={},markings={};
  for(let i=0;i<20;i++){
   const q=a.makeQuestion(i);modes[q.apply?'apply':'identify']++;metres[q.timeSignature.id]=(metres[q.timeSignature.id]||0)+1;markings[q.markingId]=(markings[q.markingId]||0)+1;
   variants[q.markingId]??=new Set();variants[q.markingId].add(`${q.timeSignature.id}/${q.apply}`);
   const notes=q.articulationBars.flatMap(b=>b.notes),target=notes.filter(n=>q.targetNoteIds.includes(n.id));assert.ok(target.length);
   if(q.markingId==='slur'){assert.ok(target.length>=2);assert.ok(new Set(target.map(n=>n.step)).size>1);}
   if(q.markingId==='accent'){assert.equal(target.length,1);accentTargets.add(q.targetNoteIds[0]);}
   for(const [barIndex,bar]of q.articulationBars.entries()){
    assert.equal(bar.notes.reduce((s,n)=>s+({minim:2,crotchet:1,quaver:.5}[n.rhythm]),0),q.timeSignature.beats);
    const width=(308-113)/q.articulationBars.length,start=113+barIndex*width+7,end=113+(barIndex+1)*width-8;
    const xs=a.articulationWorksheetNotePositions(bar.notes,start,end);
    for(let index=1;index<xs.length;index++)assert.ok(xs[index]-xs[index-1]>=14-1e-8,'adjacent printed noteheads must not overlap');
    assert.ok(xs.at(-1)<end);
   }
   if(paper===0)assert.doesNotMatch(server.renderToStaticMarkup(React.createElement(a.Staff,{question:q,completed:true})),/NaN|Infinity/);
  }
  assert.equal(modes.apply,10);assert.equal(modes.identify,10);for(const count of Object.values(metres))assert.equal(count,10);for(const count of Object.values(markings))assert.equal(count,5);
 }
 for(const v of Object.values(variants))assert.equal(v.size,4);assert.ok(accentTargets.size>=4);
});
test('shipped Articulation and worksheet runtimes match their sources',()=>{
 const Babel=require('@babel/standalone'),options={presets:['react'],sourceMaps:false,comments:false,compact:true},page=fs.readFileSync('articulationmarkings.html','utf8'),source=page.match(/<script type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/)[1];
 assert.equal(fs.readFileSync('generated-runtimes/articulationmarkings-1.js','utf8'),Babel.transform(source,options).code+'\n');assert.equal(fs.readFileSync('generated-runtimes/worksheetgenerator-2.js','utf8'),Babel.transform(fs.readFileSync('worksheet-generic.jsx','utf8'),options).code+'\n');
});

test('phrase ranges choose valid spans uniformly instead of doubling clipped end-of-line ranges',()=>{
 const a=load(),bars=a.makeQuestion(['apply'],['phrase']).bars,counts={};
 for(let i=0;i<5000;i++){
  const target=a.phraseTarget(bars),key=`${target.startBar}-${target.endBar}`;counts[key]=(counts[key]||0)+1;
  assert.equal(Math.floor(target.startBar/4),Math.floor(target.endBar/4));assert.ok(target.endBar>target.startBar);
 }
 assert.equal(Object.keys(counts).length,10);for(const count of Object.values(counts))assert.ok(count>400&&count<600,JSON.stringify(counts));
});
