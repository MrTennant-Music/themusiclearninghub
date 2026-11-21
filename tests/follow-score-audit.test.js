'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),React=require('react'),server=require('react-dom/server');
const load=require('./helpers/follow-score-harness.cjs');
const source=fs.readFileSync('followthescore.html','utf8');
const audioSource=source.slice(source.indexOf('      async function playQuestionAudio('),source.indexOf('      function handlePlayClick()',source.indexOf('      async function playQuestionAudio(')));
async function scheduledAudio(stopAfterSeconds){
 const events=[],timeouts=[],master={gain:{value:1.25,setValueAtTime:(v,t)=>events.push(['gain',v,t]),linearRampToValueAtTime:(v,t)=>events.push(['ramp',v,t])},connect(){}};
 const bars=[{barIndex:0,notes:[{beat:0,beats:1,midi:60},{beat:1,beats:1,midi:62}]},{barIndex:1,notes:[{beat:0,beats:2,midi:64}]}];
 class AudioContext{constructor(){this.currentTime=10;this.destination={};}createGain(){return master;}}
 const c=vm.createContext({window:{AudioContext,MLH:{prepareAudioPlayback:async()=>true,metronomePulseOffsets:()=>[0,1],naturalPlaybackTailMs:()=>650},setTimeout:(fn,ms)=>{timeouts.push({fn,ms});return timeouts.length;}},console,Math,Number,Promise,
  isPlaying:false,audioRef:{current:null},audioMasterRef:{current:null},stopAudio(){},setPrompt(){},setIsPlaying(){},clamp:(v,min,max)=>Math.max(min,Math.min(max,v)),totalDuration:4,
  preloadPianoSamples:async()=>{},pianoLayersForPlayback:()=>[],question:{},playbackBars:bars,playbackTimeline:[{start:0},{start:2}],beatSeconds:1,
  timeSignatureForBar:()=>({beats:2}),dynamicGainForBar:()=>1,dynamicVelocityForBar:()=>80,dynamicGainForPoint:()=>1,metronomeOn:true,
  playMetronome:(...args)=>events.push(['tick',args[2]]),playAccompaniment:(...args)=>events.push(['accompaniment',args[3].barIndex]),shouldSkipMelodyPlaybackNote:()=>false,
  articulationMarkingForPlayback:()=>null,effectivePlaybackMidiForNote:(q,b,n)=>n.midi,playMelodyNote:(...args)=>events.push(['note',args[3],args[4]]),MELODY_SAMPLE_VELOCITY_V8:80,
  followPlayback:true,FOLLOW_SCORE_APP:true,followFeedback:null,setActiveNoteId(){},setFollowPlayedOnce(){},timersRef:{current:[]},stopAfterSeconds});
 vm.runInContext(audioSource,c);await vm.runInContext('playQuestionAudio(0,false,stopAfterSeconds)',c);
 return {events,timeouts};
}
test('audio clock stops every layer before the next note, including the scheduling lead-in',async()=>{
 const {events,timeouts}=await scheduledAudio(.96);
 const ramp=events.find(e=>e[0]==='ramp');assert.equal(ramp[1],0);assert.ok(Math.abs(ramp[2]-11.08)<1e-9);
 assert.equal(events.filter(e=>e[0]==='note').length,1);assert.equal(events.filter(e=>e[0]==='tick').length,1);assert.equal(events.filter(e=>e[0]==='accompaniment').length,1);
 const stop=timeouts.at(-1);assert.ok(Math.abs(stop.ms-1100)<1e-8);
});
test('omitting a stop time plays the complete score instead of converting null into zero',async()=>{
 const {events,timeouts}=await scheduledAudio(null);
 assert.equal(events.filter(e=>e[0]==='note').length,3);assert.equal(events.filter(e=>e[0]==='ramp').length,0);assert.ok(Math.abs(timeouts.at(-1).ms-4770)<1e-8);
});
test('Follow targets agree with repeat playback, correct duration and clickable notation at every level',()=>{
 const a=load();
 for(const level of ['N3','N4','N5','H','AH']){
  for(let i=0;i<12;i++){
   const q=a.makeFollowScoreQuestion(level),target=q.target;
   assert.equal(q.exactNote,['N5','H','AH'].includes(level));
   assert.deepEqual(Array.from(a.repeatPlaybackBars(q),b=>b.barIndex),Array.from(q.repeat.order));
   assert.equal(a.followScoreNoteSounds(q.bars[target.barIndex],target,target.noteIndex),true);
   const bs=60/q.tempoBpm,barStart=q.repeat.order.slice(0,target.occurrenceIndex).reduce((s,j)=>s+a.timeSignatureForBar(q,j).beats*bs,0);
   const next=q.bars[target.barIndex].notes[target.noteIndex+1];
   const tied=(target.tieToNext||target.audioTieToNext)&&next&&!next.rest?next.beats:0;
   assert.ok(Math.abs(a.followScoreStopAfterSeconds(q)-(barStart+(target.beat+(target.beats+tied)*.96)*bs))<1e-7);
   if(i===0){const html=server.renderToStaticMarkup(React.createElement(a.Score,{question:q,userNotes:{},setUserNotes(){},practiceAnswers:{},setPracticeAnswers(){},setHoverNote(){}}));assert.doesNotMatch(html,/NaN|Infinity/);assert.ok(html.includes(q.exactNote?`Select note ${target.noteIndex+1} in bar ${target.barIndex+1}`:`Select bar ${target.barIndex+1}`));}
  }
 }
});
test('shipped Follow runtime matches its source',()=>{
 const Babel=require('@babel/standalone'),jsx=source.match(/<script type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/)[1];
 assert.equal(fs.readFileSync('generated-runtimes/followthescore-1.js','utf8'),Babel.transform(jsx,{presets:['react'],sourceMaps:false,comments:false,compact:true}).code+'\n');
});

test('every closing bar fills its metre and ties split durations to the same pitch',()=>{
 const a=load();
 for(const signature of a.TIME_SIGNATURES){
  const notes=a.makeFinalBarNotes(a.noteByLetter('C',4),15,a.KEYS[0],'I',signature);
  assert.equal(notes.reduce((s,n)=>s+n.beats,0),signature.beats,signature.id);
  if(notes.length>1){assert.equal(notes[0].tieToNext,true);assert.equal(notes[1].tiedFromPrevious,true);assert.equal(notes[0].midi,notes[1].midi);}
 }
});
test('National 3 targets cover every bar and the final note without recent question repeats',()=>{
 const a=load(),counts=Array(8).fill(0),metres={},recent=[];let finalTargets=0;
 for(let i=0;i<600;i++){
  const q=a.makeFollowScoreQuestion('N3');counts[q.target.barIndex]++;metres[q.timeSignature.id]=(metres[q.timeSignature.id]||0)+1;
  const fingerprint=a.followScoreQuestionFingerprint(q);assert.equal(recent.includes(fingerprint),false);recent.push(fingerprint);if(recent.length>20)recent.shift();
  if(q.target.barIndex===7)finalTargets++;
 }
 for(const count of counts)assert.ok(count>40&&count<110,JSON.stringify(counts));
 for(const count of Object.values(metres))assert.ok(count>150&&count<250,JSON.stringify(metres));assert.ok(finalTargets>0);
});

test('Higher rhythm rewrites retain melody history from the current score only',()=>{
 const a=load();
 for(let i=0;i<100;i++){
  const q=a.makeFollowScoreQuestion('H');
  const history=a.buildNational5PhraseBar.allNotes??[];
  assert.ok(history.length<=q.bars.reduce((s,b)=>s+b.notes.length,0),'melody history must not accumulate across questions');
 }
});
