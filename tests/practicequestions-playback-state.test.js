'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const page=fs.readFileSync('practicequestions.html','utf8');
const playback=page.slice(page.indexOf('      async function playQuestionAudio('),page.indexOf('      useEffect(() => () => { clearFeedbackTimers(); stopAudio(); }, []);'));
const stop=page.slice(page.indexOf('      function stopAudio('),page.indexOf('      function newQuestion('));
function harness(){
 const scheduled=[],highlights=[],timers=new Map(),contexts=[];let id=0;
 class AudioContext{constructor(){this.currentTime=10;this.destination={};contexts.push(this);}createGain(){return{gain:{setValueAtTime(){}},connect(){}};}close(){this.closed=true;return Promise.resolve();}}
 const bar={barIndex:0,notes:[{id:'one',midi:60,beat:0,beats:1},{id:'two',midi:64,beat:1,beats:1},{rest:true,beat:2,beats:1},{id:'four',midi:67,beat:3,beats:1}]};
 const c={escapeEmbed:false,Math,AudioContext,window:{AudioContext,MLH:{prepareAudioPlayback:async()=>true,naturalPlaybackTailMs:()=>650},setTimeout:(fn,ms)=>{timers.set(++id,{fn,ms});return id;},clearTimeout:n=>timers.delete(n)},audioRef:{current:null},timersRef:{current:[]},isPlaying:false,playsRemaining:4,feedback:null,limitPlays:true,practiceReviewMode:false,hasScrollablePracticeScore:false,question:{},playbackBars:[bar],playbackTimeline:[{start:0,end:2}],totalDuration:2,beatSeconds:.5,metronomeOn:false,followPlayback:true,MELODY_SAMPLE_VELOCITY_V8:96,MELODY_SAMPLE_VELOCITY_V12:127,STACCATO_RELEASE_SECONDS:.05,ARTICULATION_ACCENT_GAIN_SCALE:1.5,
 clamp:(v,min,max)=>Math.max(min,Math.min(max,v)),setPrompt:v=>c.prompt=v,setIsPlaying:v=>c.playing=v,setActiveNoteId:v=>highlights.push(v),setPlaysRemaining:f=>c.playsRemaining=f(c.playsRemaining),scrollPracticeScore:()=>{},preloadPianoSamples:async()=>true,pianoLayersForPlayback:()=>[],timeSignatureForBar:()=>({beats:4}),dynamicGainForBar:()=>1,dynamicVelocityForBar:()=>96,dynamicGainForPoint:()=>1,playAccompaniment:()=>{},shouldSkipMelodyPlaybackNote:(b,n)=>Boolean(n.rest),articulationMarkingForPlayback:()=>null,effectivePlaybackMidiForNote:(q,b,n)=>n.midi,playMelodyNote:(ctx,gain,midi,start,duration)=>scheduled.push({ctx,midi,start,duration}),clearTimers:()=>{for(const n of c.timersRef.current)timers.delete(n);c.timersRef.current=[];}};
 vm.createContext(c);vm.runInContext(stop+playback,c);
 return{c,scheduled,timers,contexts,highlights};
}
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};}
test('real playback schedules the presented pitches, rests, rhythm and highlight callbacks',async()=>{
 const h=harness();await h.c.handlePlayClick();assert.equal(h.c.playsRemaining,3);
 assert.deepEqual(h.scheduled.map(n=>n.midi),[60,64,67]);
 for(const [i,start]of [10.12,10.62,11.62].entries())assert.ok(Math.abs(h.scheduled[i].start-start)<1e-8);
 assert.ok(h.scheduled.every(n=>Math.abs(n.duration-.48)<1e-8));
 assert.equal(h.timers.size,7);h.c.stopAudio();assert.equal(h.timers.size,0);assert.equal(h.c.audioRef.current,null);assert.equal(h.contexts[0].closed,true);assert.equal(h.highlights.at(-1),null);
});
test('a second click during loading cancels the first request without spending a play',async()=>{
 const h=harness(),d=deferred();h.c.window.MLH.prepareAudioPlayback=()=>d.promise;
 const first=h.c.handlePlayClick();await h.c.handlePlayClick();d.resolve(true);await first;
 assert.equal(h.c.playsRemaining,4);assert.equal(h.scheduled.length,0);assert.equal(h.c.audioRef.current,null);
});
test('unsupported, rejected, and refused activation leave the play allowance intact',async()=>{
 for(const kind of ['unsupported','rejected','refused','constructor']){
  const h=harness();if(kind==='unsupported')delete h.c.window.AudioContext;
  if(kind==='rejected')h.c.window.MLH.prepareAudioPlayback=async()=>{throw Error('blocked');};
  if(kind==='refused')h.c.window.MLH.prepareAudioPlayback=async()=>false;
  if(kind==='constructor')h.c.window.AudioContext=class{constructor(){throw Error('audio unavailable');}};
  await h.c.handlePlayClick();assert.equal(h.c.playsRemaining,4,kind);assert.equal(h.scheduled.length,0,kind);assert.equal(h.c.audioRef.current,null,kind);assert.match(h.c.prompt,/Audio/i);
 }
});
test('an obsolete activation cannot close or charge playback from the replacement question',async()=>{
 const h=harness(),d=deferred();h.c.window.MLH.prepareAudioPlayback=()=>d.promise;
 const old=h.c.handlePlayClick();h.c.stopAudio();const replacement={};h.c.audioRef.current=replacement;d.resolve(true);await old;
 assert.equal(h.c.audioRef.current,replacement);assert.equal(h.c.playsRemaining,4);assert.equal(h.scheduled.length,0);
});
test('replay limits block new playback, while marked-paper review remains unrestricted',async()=>{
 const h=harness();h.c.playsRemaining=0;await h.c.handlePlayClick();assert.equal(h.contexts.length,0);assert.match(h.c.prompt,/No plays remaining/);
 h.c.practiceReviewMode=true;await h.c.handlePlayClick();assert.equal(h.contexts.length,1);assert.equal(h.c.playsRemaining,0);
});
test('a failed sample preload retains the existing synthesised fallback',async()=>{
 const h=harness();h.c.preloadPianoSamples=async()=>false;await h.c.handlePlayClick();assert.equal(h.scheduled.length,3);assert.equal(h.c.playsRemaining,3);
});


test('the piano output retains the established A3–C6 register safeguard',()=>{
 const calls=[];const c={escapeEmbed:false,playPianoMidi:(...args)=>calls.push(args),fitMelodyPlaybackMidi:midi=>Math.max(57,Math.min(84,midi))};
 const start=page.indexOf('      function playMelodyNote('),end=page.indexOf('      function shouldSkipMelodyPlaybackNote(',start);
 vm.createContext(c);vm.runInContext(page.slice(start,end),c);
 c.playMelodyNote({}, {},76,1,.5);c.playMelodyNote({}, {},57,2,.5);assert.deepEqual(calls.map(args=>args[2]),[76,57]);
});

test('sample-map pitches, playback rates and all referenced Ogg containers are present',()=>{
 const window={};vm.runInNewContext(fs.readFileSync('audio/piano/salamander-browser-map.js','utf8'),{window});
 const map=window.MLH_PIANO_SAMPLE_MAP,seen=new Set(),natural={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
 for(const [midi,layers]of Object.entries(map.notes))for(const layer of layers){
  const match=layer.sample.match(/^([A-G])(s?)(-?\d+)v/);assert.ok(match,layer.sample);
  const root=12*(Number(match[3])+1)+natural[match[1]]+(match[2]?1:0);assert.equal(layer.root,root,layer.sample);
  assert.ok(Math.abs(layer.rate-2**((Number(midi)-root)/12))<1e-8,`${midi}: sample transposition rate`);
  if(seen.has(layer.sample))continue;seen.add(layer.sample);
  const path='audio/piano/'+layer.sample,fd=fs.openSync(path,'r'),header=Buffer.alloc(4);try{fs.readSync(fd,header,0,4,0);}finally{fs.closeSync(fd);}
  assert.equal(header.toString('ascii'),'OggS');assert.ok(fs.statSync(path).size>64);
 }
 assert.equal(seen.size,map.sampleCount);assert.equal(Object.keys(map.notes).length,88);
});

test('the actual piano voice uses the correct sample rate or falls back to the requested oscillator pitch',()=>{
 const calls=[],sources=[];const layer={sample:'C4v8.ogg',rate:2**(1/12),gain:1};
 const c={escapeEmbed:false,choosePianoLayer:()=>layer,pianoBufferCacheRef:{current:new Map()},clamp:(n,lo,hi)=>Math.max(lo,Math.min(hi,n)),oscillator:(...args)=>calls.push(args),midiToFrequency:midi=>440*2**((midi-69)/12)};
 vm.createContext(c);const start=page.indexOf('      function playPianoMidi('),end=page.indexOf('      function dynamicGainForBar(',start);vm.runInContext(page.slice(start,end),c);
 c.playPianoMidi({}, {},69,5,.5);assert.equal(calls[0][2],440);
 c.pianoBufferCacheRef.current.set(layer.sample,{duration:10});const rates=[],starts=[],stops=[];const context={createBufferSource(){const source={playbackRate:{setValueAtTime:v=>rates.push(v)},connect(){},start:t=>starts.push(t),stop:t=>stops.push(t)};sources.push(source);return source;},createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}};
 c.playPianoMidi(context,{},61,5,.5);assert.equal(rates[0],2**(1/12));assert.equal(starts[0],5);assert.ok(Math.abs(stops[0]-5.66)<1e-8);assert.equal(calls.length,1);assert.equal(sources.length,1);
});
