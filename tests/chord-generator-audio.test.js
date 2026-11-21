const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const C=require('../chord-generator-core.js'),window={MLH:{ChordGenerator:C,DrumMachine:require('../drum-machine-core')}};
vm.runInNewContext(fs.readFileSync(require.resolve('../chord-generator-audio.js'),'utf8'),{window,clearInterval(){},cancelAnimationFrame(){}});
const A=window.MLH.ChordAudio;
const project=(extra={})=>({version:1,tempo:100,key:0,mode:'major',timeSignature:'4/4',octave:4,style:'pop',instrument:'piano',volumes:{chords:80,bass:65,drums:45,melody:75},sections:[{name:'Verse',repeats:1,chords:[{symbol:'C',beats:4,inversion:0},{symbol:'G/B',beats:4,inversion:0}]}],melody:[],...extra});
test('audio arrangement applies octave only once and slash bass is audible',()=>{const p=project({octave:3}),a=A.events(p);assert.deepEqual(Array.from(a.filter(e=>e.track==='chords'&&e.beat===0),e=>e.midi),[48,52,55]);assert.equal(a.find(e=>e.track==='bass'&&e.beat===4).midi,47);});
test('every style emits finite bounded musical events and reggae includes bass',()=>{for(const style of Object.keys(A.styles)){const p=project({style}),a=A.events(p);assert.ok(a.some(e=>e.track==='bass'),style);assert.ok(a.some(e=>e.track==='chords'),style);for(const e of a){assert.ok(e.beat>=0&&e.beat<8,style);assert.ok(e.duration>0&&Number.isFinite(e.duration));assert.ok(e.midi>=0&&e.midi<=127);}}assert.notEqual(JSON.stringify(A.events(project({style:'pop'}))),JSON.stringify(A.events(project({style:'rock'}))));});
test('per-chord track controls remove the intended voices',()=>{for(const type of ['bass','chords','silence','break']){const p=project();p.sections[0].chords[0].type=type;const a=A.events(p).filter(e=>e.beat<4);if(type!=='chords')assert.equal(a.some(e=>e.track==='chords'),false);if(type!=='bass')assert.equal(a.some(e=>e.track==='bass'),false);assert.equal(a.some(e=>e.track==='drums'),type!=='break');}});
test('custom drum pattern repeats and mixer mute is retained in arrangement export',()=>{const pattern=Array.from({length:3},()=>Array(16).fill(false));pattern[0][0]=true;const p=project({drumPattern:pattern}),a=A.events(p);assert.equal(a.filter(e=>e.track==='drums').length,1);assert.equal(a.find(e=>e.track==='drums').midi,36);p.volumes.chords=0;assert.ok(A.events(p).filter(e=>e.track==='chords').every(e=>e.velocity===0));});
test('arrangement export retains melody and tempo-altered note positions',()=>{const p=project({melody:[{beat:2,duration:.5,midi:72,velocity:110}]});p.sections[0].chords[1].tempo=60;const a=A.events(p);assert.equal(a.find(e=>e.track==='melody').beat,2);assert.equal(C.secondsAtBeat(p,8),6.4);const midi=C.midiEvents(p,a),notes=C.importMidi(midi);assert.ok(notes.some(n=>n.midi===72&&n.beat===2));});

test('stopping MIDI playback clears queued notes before sending all-notes-off',()=>{const calls=[],player=new A.Player();player.output={clear:()=>calls.push('clear'),send:data=>calls.push(data)};player.stop();assert.equal(calls[0],'clear');assert.equal(calls.length,33);assert.equal(player.playing,false);});

test('piano melody uses the piano sample renderer rather than an oscillator',()=>{
 const calls=[],localWindow={MLH:{playPianoFrequency:(...args)=>calls.push(args)}};
 const source=fs.readFileSync(require.resolve('../chord-generator-audio.js'),'utf8').replace('root.MLH.ChordAudio = {','root.MLH.ChordAudio = { tone,');
 vm.runInNewContext(source,{window:localWindow});
 const ctx={createOscillator(){throw Error('Melody unexpectedly used an oscillator');}};
 localWindow.MLH.ChordAudio.tone(ctx,{}, {track:'melody',midi:69,duration:1,velocity:.7},0,1,'piano');
 assert.equal(calls.length,1);assert.equal(calls[0][2],440);
});

test('Preview prepares piano samples and sounds every note of the chord',async()=>{
 const played=[],prepared=[],w={MLH:{playPianoFrequency:(...args)=>played.push(args),prepareAudioPlayback:async(ctx,request)=>prepared.push(request)}};
 class Context{constructor(){this.destination={};this.currentTime=0;}async resume(){} async close(){}}
 vm.runInNewContext(fs.readFileSync(require.resolve('../chord-generator-audio.js'),'utf8'),{window:w,AudioContext:Context,setTimeout(){}});
 await w.MLH.ChordAudio.preview([60,64,67]);
 assert.equal(played.length,3);assert.equal(prepared[0].piano.length,3);
 assert.ok(Math.abs(played[0][2]-261.625565)<.001);
});

test('editable bass replaces automatic accompaniment and survives MIDI round trip',()=>{
 const p=project(),automatic=A.events(p).filter(e=>e.track==='bass');assert.ok(automatic.length);
 p.bass=[{beat:.5,duration:1,midi:40,velocity:100}];
 const edited=A.events(p).filter(e=>e.track==='bass');assert.equal(edited.length,1);assert.equal(edited[0].midi,40);assert.equal(edited[0].beat,.5);
 const restored=C.importSongMidi(C.songMidi(p,A.events(p)));assert.deepEqual(restored.bass,p.bass);
 p.bass=[];assert.equal(A.events(p).filter(e=>e.track==='bass').length,0);
 p.bass=null;assert.deepEqual(A.events(p).filter(e=>e.track==='bass'),automatic);
 p.bass=[{beat:0,duration:1,midi:999}];assert.throws(()=>C.validate(p),/Invalid bass note/);
});

test('chord changes regenerate bass in the selected accompaniment style and warn only for manual bass',()=>{
 for(const style of ['block','pop','arpeggio','reggae','waltz']){
  const source=C.validate(project({style,timeSignature:style==='waltz'?'3/4':'4/4'}));
  const candidate=structuredClone(source);candidate.sections[0].chords[0].symbol='Dm';
  const automatic=C.planHarmonyChange(source,candidate);
  assert.equal(automatic.requiresBassConfirmation,false);assert.equal(automatic.project.bass,null);
  const before=A.events(source).filter(e=>e.track==='bass');
  const after=A.events(automatic.project).filter(e=>e.track==='bass');
  assert.equal(automatic.project.style,style);
  assert.deepEqual(Array.from(after,e=>[e.beat,e.duration]),Array.from(before,e=>[e.beat,e.duration]));
  assert.ok(after.filter(e=>e.beat<4).every(e=>e.midi===38));
  const manual={...source,bass:[{beat:0,duration:1,midi:48,velocity:90}]};
  const plan=C.planHarmonyChange(manual,{...candidate,bass:manual.bass});
  assert.equal(plan.requiresBassConfirmation,true);assert.equal(plan.project.bass,null);
  assert.equal(manual.bass[0].midi,48);assert.equal(manual.sections[0].chords[0].symbol,'C');
  assert.deepEqual(A.events(plan.project).filter(e=>e.track==='bass'),after);
 }
});
test('unchanged harmony and cosmetic edits preserve manual bass without a warning',()=>{
 const source=C.validate(project({bass:[]}));const candidate=structuredClone(source);
 candidate.sections[0].chords[0].label='Verse';candidate.sections[0].chords[0].inversion=1;
 const plan=C.planHarmonyChange(source,candidate);
 assert.equal(plan.changed,false);assert.equal(plan.requiresBassConfirmation,false);assert.deepEqual(plan.project.bass,[]);
 for(const change of [p=>p.sections[0].chords.reverse(),p=>p.sections[0].chords[0].symbol='-',p=>p.sections[0].chords[0].beats=3,p=>p.sections[0].chords[0].symbol='C/E']){
  const next=structuredClone(source);change(next);assert.equal(C.planHarmonyChange(source,next).requiresBassConfirmation,true);
 }
});

test('Record schedules a full-bar count-in and ongoing clicks; Play ignores retired saved switches',async()=>{
 const starts=[],positions=[],callbacks=[];
 const param=()=>({value:0,setValueAtTime(value){this.value=value;},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 class Context{
  constructor(){this.currentTime=0;this.destination={};}async resume(){}async close(){}
  createGain(){return {gain:param(),connect(){}};}
  createOscillator(){const frequency=param();return {frequency,connect(){},start(time){starts.push({time,frequency:frequency.value});},stop(){}};}
 }
 const prepared=[];
 const w={MLH:{ChordGenerator:C,MelodySampler:{prepare:async()=>{},play(){}},prepareAudioPlayback:async(ctx,request)=>prepared.push(request),playMetronomeClick:(ctx,dest,time,accented)=>starts.push({time,accented})}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../chord-generator-audio.js'),'utf8'),{window:w,AudioContext:Context,setInterval(fn){callbacks.push(fn);return callbacks.length;},clearInterval(){},requestAnimationFrame(){return 1;},cancelAnimationFrame(){}});
 const input=C.validate(project({instrument:'organ',tempo:120,style:'block',countIn:false,metronome:false,sections:[{name:'Progression',repeats:1,chords:[{symbol:'-',beats:4}]}]}));
 const player=new w.MLH.ChordAudio.Player();await player.play(input,b=>positions.push(b),null,{recording:true});
 assert.equal(prepared[0].metronome,true);assert.deepEqual(starts.map(e=>e.accented),[true,false,false,false]);
 assert.equal(starts.length,4);assert.equal(player.startedAt,2.08);assert.ok(positions[0]<0);
 assert.deepEqual(starts.map(e=>Math.round(e.time*1000)),[80,580,1080,1580]);
 player.context.currentTime=2.08;callbacks.at(-1)();assert.equal(starts.length,5);assert.equal(starts.at(-1).time,2.08);
 player.context.currentTime=2.58;callbacks.at(-1)();assert.equal(starts.length,6);
 assert.equal(input.countIn,false);assert.equal(input.metronome,false);player.stop();starts.length=0;
 for(const [timeSignature,upbeat,count] of [['4/4',2,6],['4/4',1,7],['4/4',.5,7.5],['3/4',1,5],['2/4',1,3],['6/8',1,5]]){
  await player.play({...input,timeSignature,upbeatBeats:upbeat},null,null,{recording:true});
  assert.equal(player.playbackAt,.08+count*.5,`${timeSignature}: recording starts after ${count} beats`);
  assert.equal(starts.length,Math.ceil(count));assert.deepEqual(starts.map(e=>Math.round(e.time*1000)),Array.from({length:Math.ceil(count)},(_,b)=>80+b*500));
  const bar=Number(timeSignature.split('/')[0])*4/Number(timeSignature.split('/')[1]);assert.deepEqual(starts.map(e=>e.accented),Array.from({length:Math.ceil(count)},(_,b)=>b%bar===0));
  player.stop();starts.length=0;
 }

 await player.play({...input,countIn:true,metronome:true});assert.equal(player.startedAt,.08);assert.equal(starts.length,0);player.stop();
});
test('all accompaniment styles use the shared nearest-note voicing without moving bass roots',()=>{
 for(const style of ['block','pop','rock','ballad','arpeggio','waltz','swing','reggae','bossa','dance','broken_chords','alberti_bass','rock_octaves','power_chords','stride_piano','walking_bass','vamp']){
  const p=project({style}),arrangement=A.events(p),next=C.timeline(p)[1];
  assert.deepEqual(Array.from(next.notes),[59,62,67]);
  assert.ok(arrangement.filter(e=>e.track==='chords'&&e.beat>=4).every(e=>next.notes.includes(e.midi)));
  assert.equal(arrangement.find(e=>e.track==='bass'&&e.beat===4).midi,47);
 }
});
test('bass keyboard preview prepares and uses the sampled bass renderer',async()=>{
 const calls=[],w={MLH:{BassSampler:{prepare:async()=>calls.push('prepare'),play:(ctx,dest,event)=>calls.push(event.midi)}}};
 class Context{constructor(){this.destination={};this.currentTime=0;}async resume(){}async close(){}}
 vm.runInNewContext(fs.readFileSync(require.resolve('../chord-generator-audio.js'),'utf8'),{window:w,AudioContext:Context,setTimeout(){}});
 await w.MLH.ChordAudio.preview([36,43],'piano','bass');assert.deepEqual(calls,['prepare',36,43]);
});

test('note patterns repeat at exact unsnapped times and clip to the pattern boundary',()=>{
 const p=project({bassBars:1,melodyBars:1,bass:[{beat:.137,duration:.5,midi:36,velocity:90}],melody:[{beat:3.8,duration:.5,midi:72,velocity:90},{beat:5,duration:.5,midi:74,velocity:90}]});
 const events=A.events(p),bass=events.filter(n=>n.track==='bass'),melody=events.filter(n=>n.track==='melody');
 assert.equal(bass.length,2);assert.ok(Math.abs(bass[0].beat-.137)<1e-9);assert.ok(Math.abs(bass[1].beat-4.137)<1e-9);
 assert.deepEqual(Array.from(melody,n=>n.beat),[3.8,7.8]);
 assert.ok(melody.every(n=>Math.abs(n.duration-.2)<1e-9));
 assert.equal(C.validate({...p,progressionBars:4,melodyBars:8}).melodyBars,4);
});


test('studio plays the automatic lower accompaniment on piano and includes it in MIDI',()=>{
 const p=C.asStudio(project({bass:[],volumes:{chords:72,bass:0,drums:40.5,melody:100}}));
 const events=A.events(p),bass=events.filter(e=>e.pianoHand==='left');
 assert.ok(!events.some(e=>e.track==='bass'));assert.ok(bass.every(e=>e.track==='chords'));
 assert.ok(bass.length>0);
 assert.ok(bass.every(e=>e.velocity>0));
 const notes=C.importMidi(C.songMidi(p,events));
 for(const event of bass)assert.ok(notes.some(n=>n.midi===event.midi&&Math.abs(n.beat-event.beat)<.01&&Math.abs(n.duration-event.duration)<.01));
});


test('Practice Questions accompaniment patterns retain their characteristic pitch orders and export bass',()=>{
 assert.ok(!Object.hasOwn(A.styles,'swing'));
 for(const timeSignature of ['4/4','3/4','6/8'])for(const style of ['broken_chords','alberti_bass','rock_octaves','power_chords','stride_piano','walking_bass','vamp']){
  const p=C.asStudio(project({style,timeSignature})),events=A.events(p);
  assert.equal(p.style,style);
  assert.ok(events.some(e=>e.pianoHand==='left'));
  assert.ok(events.some(e=>e.track==='chords'));
  assert.ok(events.every(e=>e.duration>0&&Number.isFinite(e.midi)));
  assert.ok(C.importMidi(C.songMidi(p,events)).some(n=>n.midi<48));
 }
 const notes=style=>A.events(C.asStudio(project({style}))).filter(e=>e.track==='chords'&&e.pianoHand!=='left'&&e.beat<2).map(e=>e.midi);
 assert.deepEqual(Array.from(notes('alberti_bass')),[60,67,64,67]);
 assert.deepEqual(Array.from(notes('broken_chords')),[60,67,60,67]);
 assert.equal(C.asStudio(project({style:'swing'})).style,'pop');
});


test('double-time Vamp alternates root and fifth bass notes with voice-led chords',()=>{
 const p=project({style:'vamp'}),events=A.events(p).filter(e=>e.beat<4);
 assert.deepEqual(Array.from(events.filter(e=>e.track==='bass'),e=>[e.beat,e.midi]),[[0,36],[1,43],[2,36],[3,43]]);
 assert.deepEqual([...new Set(events.filter(e=>e.track==='chords').map(e=>e.beat))],[.5,1.5,2.5,3.5]);
 assert.ok(C.importMidi(C.songMidi(p,events)).some(n=>n.midi===43&&n.beat===1));
});


test('all non-piano melody previews prepare and play their instrument samples',async()=>{
 const calls=[],window={MLH:{MelodySampler:{prepare:async(ctx,instrument)=>calls.push(['prepare',instrument]),play:(ctx,dest,event,start,seconds,instrument)=>calls.push(['play',instrument,event.midi])}}};
 class Context{constructor(){this.destination={};this.currentTime=0;}async resume(){}async close(){}createGain(){return {connect(){},gain:{setTargetAtTime(){}}};}createOscillator(){throw Error('A sample option must never use an oscillator.');}}
 vm.runInNewContext(fs.readFileSync(require.resolve('../chord-generator-audio.js'),'utf8'),{window,AudioContext:Context,setTimeout(){}});
 for(const instrument of ['electricpiano','guitar','organ','strings','flute','marimba','brass','synth','pad']){
  await window.MLH.ChordAudio.preview([60],instrument,'melody');
  const held=window.MLH.ChordAudio.previewHeld([64],instrument);await held.ready;held.release();
  assert.ok(calls.some(c=>c[0]==='prepare'&&c[1]===instrument));
  assert.ok(calls.some(c=>c[0]==='play'&&c[1]===instrument&&c[2]===64));
 }
});


test('second bar chord reaches accompaniment, bass and MIDI on beat three',()=>{
 const p=C.asStudio(project({style:'block'}));p.sections[0].chords[0].secondChord={symbol:'G',octave:4,inversion:0};
 const events=A.events(p),bass=events.filter(e=>e.pianoHand==='left'&&e.beat<4);
 assert.deepEqual(Array.from(bass,e=>[e.beat,e.midi]),[[0,36],[2,43]]);
 const notes=C.importMidi(C.songMidi(p,events));assert.ok(notes.some(n=>n.midi===43&&n.beat===2));
 assert.ok(events.filter(e=>e.track==='chords'&&e.pianoHand!=='left'&&e.beat===2).every(e=>C.timeline(p)[1].notes.includes(e.midi)));
});

test('live melody updates retain the playback clock and the latest instrument selection wins',async()=>{
 const callbacks=[],loads=new Map(),played=[];
 const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 class Context{constructor(){this.currentTime=0;this.destination={};}async resume(){}async close(){}createGain(){return {gain:param(),connect(){}};}}
 const w={MLH:{ChordGenerator:C,MelodySampler:{prepare:(ctx,instrument)=>new Promise(resolve=>loads.set(instrument,resolve)),play:(ctx,dest,event,start,seconds,instrument)=>played.push({midi:event.midi,instrument})}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../chord-generator-audio.js'),'utf8'),{window:w,AudioContext:Context,setInterval(fn){callbacks.push(fn);return 1;},clearInterval(){},requestAnimationFrame(){return 1;},cancelAnimationFrame(){}});
 const player=new w.MLH.ChordAudio.Player();
 await player.play(project({instrument:'organ',style:'block',loop:true,melody:[],sections:[{name:'Progression',repeats:1,chords:[{symbol:'-',beats:4}]}]}));
 const context=player.context,start=player.startedAt;
 const flute=player.setMelodyInstrument('flute'),marimba=player.setMelodyInstrument('marimba');
 loads.get('marimba')();await marimba;loads.get('flute')();await flute;
 assert.equal(player.project.melodyInstrument,'marimba');
 player.refreshNotes('melody',[{beat:1,duration:.5,midi:72,velocity:120}]);
 assert.equal(player.context,context);assert.equal(player.startedAt,start);assert.equal(player.playing,true);
 context.currentTime=start+60/player.project.tempo-.05;callbacks[0]();
 assert.deepEqual(played,[{midi:72,instrument:'marimba'}]);
 player.refreshNotes('melody',[]);assert.equal(player.playing,true);assert.equal(player.project.melody.length,0);
 player.stop();
});

test('WAV export renders supplied arrangement events with their own instruments and tempo changes',async()=>{
 const prepared=[],played=[],contexts=[];
 class Offline{constructor(channels,length,rate){contexts.push({channels,length,rate});this.destination={};}createGain(){return {gain:{value:0},connect(){}};}async startRendering(){return {length:2,getChannelData:()=>new Float32Array([.5,-.5])};}}
 const w={MLH:{ChordGenerator:C,MelodySampler:{prepare:async(ctx,name)=>prepared.push(name),play:(ctx,dest,event,start,seconds,instrument)=>played.push({event,start,seconds,instrument})}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../chord-generator-audio.js'),'utf8'),{window:w,OfflineAudioContext:Offline,Blob});
 const p=project({instrument:'organ',melodyInstrument:'organ'});p.sections[0].chords[1].tempo=60;
 const events=[{beat:0,duration:1,midi:60,track:'chords',instrument:'flute',velocity:.7},{beat:4,duration:1,midi:72,track:'melody',instrument:'strings',velocity:.8}];
 const blob=await w.MLH.ChordAudio.wav(p,{events});assert.equal(played.length,2);assert.deepEqual(played.map(e=>e.instrument),['flute','strings']);assert.equal(played[1].start,C.secondsAtBeat(p,4));assert.equal(played[1].seconds,1);assert.ok(prepared.includes('strings'));assert.ok(prepared.includes('flute'));
 assert.equal(contexts[0].rate,44100);assert.equal(contexts[0].length,Math.ceil((C.secondsAtBeat(p,8)+2)*44100));
 const bytes=new DataView(await blob.arrayBuffer());assert.equal(bytes.getUint16(22,true),2);assert.equal(bytes.getUint32(24,true),44100);assert.equal(bytes.getUint16(34,true),16);assert.equal(bytes.getUint32(40,true),8);assert.ok(bytes.getInt16(44,true)>0);assert.ok(bytes.getInt16(48,true)<0);
});


test('WAV export places the upbeat before bar one using the initial tempo',async()=>{
 const played=[],contexts=[];
 class Offline{constructor(channels,length,rate){contexts.push({length,rate});this.destination={};}createGain(){return {gain:{value:0},connect(){}};}async startRendering(){return {length:2,getChannelData:()=>new Float32Array(2)};}}
 const w={MLH:{ChordGenerator:C,MelodySampler:{prepare:async()=>{},play:(ctx,dest,event,start)=>played.push(start)}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../chord-generator-audio.js'),'utf8'),{window:w,OfflineAudioContext:Offline,Blob});
 const p=project({instrument:'organ',melodyInstrument:'flute',upbeatBeats:1});p.sections[0].chords[0].tempo=60;
 const events=[{beat:-1,duration:.5,midi:67,track:'melody',instrument:'flute',velocity:.8},{beat:0,duration:1,midi:72,track:'melody',instrument:'strings',velocity:.8}];
 await w.MLH.ChordAudio.wav(p,{events});
 assert.deepEqual(played,[0,1]);assert.equal(contexts[0].length,Math.ceil((C.secondsAtBeat(p,C.totalBeats(p))+1+2)*44100));
});

function heldPreviewHarness(prepare=async()=>{}){
 const engines=[],played=[],fades=[];
 class Context{constructor(options){this.options=options;this.state='running';this.currentTime=1;this.destination={};engines.push(this);}async resume(){}createGain(){return{gain:{setTargetAtTime:(...args)=>fades.push(args)},connect(){},disconnect(){}};}}
 const w={MLH:{prepareAudioPlayback:prepare,playPianoFrequency:(...args)=>played.push(args)}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../chord-generator-audio.js'),'utf8'),{window:w,AudioContext:Context,setTimeout(){}});
 return{audio:w.MLH.ChordAudio,engines,played,fades};
}
test('held keyboard previews reuse one interactive engine and play warmed notes synchronously',async()=>{
 const h=heldPreviewHarness();await h.audio.prepareHeldPreview([60,62,64]);
 const a=h.audio.previewHeld([60]),b=h.audio.previewHeld([62]),c=h.audio.previewHeld([64]);
 assert.equal(h.engines.length,1);assert.equal(h.engines[0].options.latencyHint,'interactive');
 assert.equal(h.played.length,3);assert.equal(h.fades.length,0);
 a.release();assert.equal(h.fades.length,1);b.release();c.release();await Promise.all([a.ready,b.ready,c.ready]);
});
test('a short keyboard tap still sounds and releases when its sample finishes loading',async()=>{
 let finish;const h=heldPreviewHarness(()=>new Promise(resolve=>{finish=resolve;}));
 const voice=h.audio.previewHeld([60]);voice.release();assert.equal(h.played.length,0);
 while(!finish)await Promise.resolve();finish();await voice.ready;
 assert.equal(h.played.length,1);assert.equal(h.fades.length,1);assert.ok(h.fades[0][1]>h.engines[0].currentTime);
});
test('failed keyboard preparation can retry on the same engine',async()=>{
 let calls=0;const h=heldPreviewHarness(async()=>{if(++calls===1)throw Error('network');});
 await assert.rejects(h.audio.previewHeld([60]).ready,/network/);
 await h.audio.previewHeld([60]).ready;assert.equal(calls,2);assert.equal(h.engines.length,1);assert.equal(h.played.length,1);
});
