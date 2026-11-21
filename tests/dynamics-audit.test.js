'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),React=require('react'),server=require('react-dom/server');
const load=require('./helpers/dynamics-harness.cjs');
test('choice answers are unique, enabled and balanced across button positions',()=>{
 const a=load();
 for(const settings of Object.values(a.LEVELS)){
  const counts=[0,0,0,0];for(let i=0;i<8000;i++){
   const answer=settings.dynamics[i%settings.dynamics.length],choices=a.makeChoices(answer,settings.dynamics);
   assert.equal(choices.length,4);assert.equal(new Set(choices.map(c=>c.id)).size,4);assert.ok(choices.every(c=>settings.dynamics.includes(c.id)));counts[choices.findIndex(c=>c.id===answer)]++;
  }
  for(const count of counts)assert.ok(count>1800&&count<2200,JSON.stringify(counts));
 }
});
test('all enabled audio answers receive comparable frequency, including Sforzando',()=>{
 const a=load(),bars=a.makeQuestion(['apply-score'],a.LEVELS.N5.dynamics).bars,counts={};
 for(let i=0;i<10000;i++){const q=a.makeAudioQuestion(a.LEVELS.N5.dynamics,bars);counts[q.answerId]=(counts[q.answerId]||0)+1;}
 assert.deepEqual(Object.keys(counts).sort(),['crescendo','diminuendo','f','p','sfz']);
 for(const count of Object.values(counts))assert.ok(count>1800&&count<2200,JSON.stringify(counts));
});
test('generated bars fill every metre and correct/wrong placements are marked consistently',()=>{
 const a=load(),metres=new Set();
 for(const settings of Object.values(a.LEVELS))for(const type of a.QUESTION_TYPES)for(let i=0;i<80;i++){
  const q=a.makeQuestion([type],settings.dynamics);assert.equal(q.type,type);assert.ok(settings.dynamics.includes(q.answerId));metres.add(q.timeSignature.id);
  const expected=Number(q.timeSignature.top)*4/Number(q.timeSignature.bottom);assert.equal(q.timeSignature.beats,expected);
  for(const bar of q.bars)assert.equal(bar.notes.reduce((s,n)=>s+a.rhythm(n.rhythm).beats,0),expected);
  if(q.required.length){assert.equal(a.placementsMatch(q,q.required),true);assert.equal(a.wrongPlacements(q,q.required).length,0);assert.equal(a.missingRequired(q,[]).length,q.required.length);
   const wrong=q.required.map(p=>({...p,symbolId:p.symbolId==='p'?'f':'p'}));assert.equal(a.placementsMatch(q,wrong),false);assert.equal(a.wrongPlacements(q,wrong).length,wrong.length);
  }
 }
 assert.deepEqual([...metres].sort(),['2/4','3/4','4/4','6/8']);
});
test('Sforzando boosts exactly its melody note and hairpins move in the correct direction',()=>{
 const a=load(),bars=a.makeQuestion(['apply-score'],a.LEVELS.N5.dynamics).bars;
 for(const id of ['sfz','crescendo','diminuendo']){
  const scenario=a.makeAudioQuestion([id],bars),q={...scenario,bars};const gains=bars.flatMap(bar=>bar.notes.map((n,i)=>({bar:bar.barIndex,note:i,gain:a.dynamicsGainForNote(q,bar.barIndex,i,bar.notes.length)})));
  assert.ok(gains.every(p=>Number.isFinite(p.gain)&&p.gain>0));
  if(id==='sfz'){
   const accented=gains.filter(p=>p.gain===a.dyn('sfz').gain);assert.equal(accented.length,1);assert.equal(accented[0].bar,scenario.audioPlan.accentBar);assert.equal(accented[0].note,scenario.audioPlan.accentNoteIndex);
   assert.ok(accented[0].gain>=3.5*a.dyn(scenario.audioPlan.baseDynamic).gain);
  }else{for(let i=1;i<gains.length;i++)assert.ok(id==='crescendo'?gains[i].gain>=gains[i-1].gain:gains[i].gain<=gains[i-1].gain);}
 }
});
test('dynamic buttons are named and keyboard placement matches pointer placement geometry',()=>{
 const a=load(),q=a.makeQuestion(['apply-score'],a.LEVELS.N5.dynamics);
 const buttons=server.renderToStaticMarkup(React.createElement(a.DynamicAnswers,{filteredDynamics:a.DYNAMICS,selectedSymbolId:'p',setSelectedSymbolId(){},feedback:null}));
 for(const d of a.DYNAMICS)assert.ok(buttons.includes(`aria-label="${d.name}"`));assert.match(buttons,/aria-pressed="true"/);
 for(const d of a.DYNAMICS)for(let bar=0;bar<8;bar++){
  const placement=a.dynamicsPlacementForBar(q,d.id,bar),geo=a.placementPos(placement,a.buildLayouts(q));
  assert.ok(Number.isFinite(geo.x)&&Number.isFinite(geo.y));
  if(d.id==='sfz')assert.equal(placement.noteX,a.buildLayouts(q)[bar].pos[0]);
 }
 assert.equal(a.extendDynamicsPlacement({symbolId:'crescendo',barIndex:2},3).endBarIndex,3);
 assert.equal(a.extendDynamicsPlacement({symbolId:'crescendo',barIndex:3},4).endBarIndex,3);
 const score=server.renderToStaticMarkup(React.createElement(a.Score,{question:q,selectedSymbolId:'p',placements:[],wrong:[],missing:[]}));assert.match(score,/tabindex="0"/);assert.doesNotMatch(score,/NaN|Infinity/);
});
test('shipped Dynamics runtime matches its source',()=>{
 const page=fs.readFileSync('dynamics.html','utf8'),source=page.match(/<script type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/)[1],Babel=require('@babel/standalone');
 assert.equal(fs.readFileSync('generated-runtimes/dynamics-1.js','utf8'),Babel.transform(source,{presets:['react'],sourceMaps:false,comments:false,compact:true}).code+'\n');
});

test('Dynamics worksheets vary each concept across metres and written task types',()=>{
 const loadWorksheet=require('./helpers/worksheet-generator-harness.cjs');
 for(const [level,settings]of Object.entries(load().LEVELS)){
  const a=loadWorksheet({version:1,activityId:'dynamics',sourceUrl:'http://localhost:8765/dynamics.html',settings:{level,enabledDynamics:settings.dynamics,enabledTypes:['multiple-choice','definition','apply-score']}});
  const variants={};
  for(let paper=0;paper<100;paper++){
   const counts={},modes={apply:0,identify:0},metres={};
   for(let i=0;i<20;i++){
    const q=a.makeQuestion(i),key=q.dynamicId;counts[key]=(counts[key]||0)+1;modes[q.apply?'apply':'identify']++;metres[q.timeSignature.id]=(metres[q.timeSignature.id]||0)+1;
    variants[key]??=new Set();variants[key].add(`${q.timeSignature.id}/${q.apply}`);
    assert.ok(settings.dynamics.includes(key));assert.equal(q.timeSignature.beats,Number(q.timeSignature.top)*4/Number(q.timeSignature.bottom));
    const beats=q.dynamicsBar.notes.reduce((s,n)=>s+({semibreve:4,dottedMinim:3,minim:2,dottedCrotchet:1.5,crotchet:1,quaver:.5}[n.rhythm]),0);assert.equal(beats,q.timeSignature.beats);
    if(paper===0){const svg=server.renderToStaticMarkup(React.createElement(a.Staff,{question:q,completed:true}));assert.doesNotMatch(svg,/NaN|Infinity/);}
   }
   assert.equal(modes.apply,10);assert.equal(modes.identify,10);for(const count of Object.values(metres))assert.equal(count,5);
   assert.equal(Object.keys(counts).length,settings.dynamics.length);assert.ok(Math.max(...Object.values(counts))-Math.min(...Object.values(counts))<=2);
  }
  for(const [id,seen]of Object.entries(variants))assert.equal(seen.size,8,`${level}/${id} must support each metre with either task type`);
 }
});

test('actual playback uses the Sforzando gain and keeps accompaniment at its base level',async()=>{
 const vm=require('node:vm'),a=load(),q=a.makeQuestion(['audio'],['sfz']);q.audioPlan.baseDynamic='mp';
 const source=fs.readFileSync('dynamics.html','utf8'),start=source.indexOf('  async function playExcerpt()'),end=source.indexOf('  return <div className={window.MLH.shell.pageShellClass}>',start),volumes=[],accompaniment=[];
 class AudioContext{constructor(){this.currentTime=10;this.destination={};}createGain(){return {gain:{value:0},connect(){}};}}
 const c=vm.createContext({window:{AudioContext,MLH:{prepareAudioPlayback:async()=>true,playPianoFrequency:(...args)=>volumes.push(args[5]),naturalPlaybackTailMs:()=>650}},Math,playing:false,audioRef:{current:null},masterRef:{current:null},highlightTimersRef:{current:[]},endTimerRef:{current:null},stopAudio(){},setPlaying(){},setPromptMessage(){},setActiveNoteId(){},question:q,KEY_C:{chords:{I:['C','E','G']}},freqForStep:()=>440,frequencyForLetter:()=>440,chordLetterFrequency:()=>440,metronomeEnabled:false,tempo:'andante',dynamicsGainForNote:a.dynamicsGainForNote,dyn:a.dyn,rhythm:a.rhythm,playAccompaniment:(...args)=>accompaniment.push(args[6]),setTimeout:()=>1});
 vm.runInContext(source.slice(start,end),c);await vm.runInContext('playExcerpt()',c);
 assert.equal(volumes.filter(v=>v===a.dyn('sfz').gain).length,1);assert.ok(volumes.every(v=>v===a.dyn('sfz').gain||v===a.dyn('mp').gain));assert.ok(accompaniment.every(v=>v===a.dyn('mp').gain));
});
