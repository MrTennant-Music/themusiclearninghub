const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../chord-generator-core'),D=require('../drum-machine-core'),R=require('../composition-arrangement'),T=require('../composition-templates');
const window={MLH:{ChordGenerator:C,DrumMachine:D}};vm.runInNewContext(fs.readFileSync(require.resolve('../chord-generator-audio'),'utf8'),{window});const A=window.MLH.ChordAudio;
const project=()=>C.asStudio(T.create('ode-to-joy',()=>.5));
test('sections duplicate independently, reorder, rename and delete without changing musical content',()=>{
 const original=project();let data=R.create(original);data=R.duplicate(data,data.active);
 assert.deepEqual(data.items.map(s=>s.name),['A','B']);assert.notEqual(data.items[0].project,data.items[1].project);
 data.items[1].project.key=7;data.items[1].project.melody[0].midi=80;assert.equal(data.items[0].project.key,original.key);assert.equal(data.items[0].project.melody[0].midi,original.melody[0].midi);
 data=R.move(data,data.active,-1);assert.deepEqual(data.items.map(s=>s.name),['B','A']);data=R.remove(data,data.active);assert.equal(data.items[0].name,'A');assert.equal(data.active,data.items[0].id);assert.throws(()=>R.remove(data,data.active),/at least one/);
 data=R.insert(data,original);assert.deepEqual(data.items.map(s=>s.name),['A','B']);assert.equal(R.letter(26),'AA');
});
test('all-section playback retains each section pitches, drums, instrument, tempo and boundary timing',()=>{
 const first=project(),second=C.asStudio({...project(),timeSignature:'3/4',drums:null,tempo:90,key:7,melodyInstrument:'flute',accompanimentInstrument:'organ'});
 const data=R.insert(R.create(first),second),compiled=R.compile(data,A),offset=C.totalBeats(first);
 assert.equal(compiled.total,offset+C.totalBeats(second));assert.equal(compiled.map[1].beat,offset);assert.equal(compiled.map[1].timeSignature,'3/4');
 assert.equal(C.secondsAtBeat(compiled.project,offset),C.secondsAtBeat(first,offset));
 assert.ok(Math.abs(C.secondsAtBeat(compiled.project,compiled.total)-C.secondsAtBeat(first,offset)-C.secondsAtBeat(second,C.totalBeats(second)))<1e-8);
 const expected=A.events(second).filter(e=>e.track!=='click');const actual=compiled.events.filter(e=>e.beat>=offset);
 assert.equal(JSON.stringify(actual.map(e=>[e.midi,e.beat-offset,e.duration,e.track])),JSON.stringify(expected.map(e=>[e.midi,e.beat,e.duration,e.track])));assert.ok(actual.filter(e=>e.track==='melody').every(e=>e.instrument==='flute'));
 const bytes=Array.from(C.songMidi(compiled.project,compiled.events));
 const contains=sequence=>bytes.some((_,i)=>sequence.every((value,j)=>bytes[i+j]===value));assert.ok(contains([0xff,0x58,4,3,2]));assert.ok(contains([0xc2,73]));assert.ok(contains([0xc0,19]));
 const restored=C.importSongMidi(Uint8Array.from(bytes));assert.deepEqual(R.validate(restored.studioArrangement),R.validate(data));
});
test('malformed saved sections are rejected and nested arrangement metadata is removed',()=>{
 assert.throws(()=>R.validate({items:[]}),/between/);const p={...project(),studioArrangement:{items:[]}};const data=R.create(p);assert.equal(data.items[0].project.studioArrangement,undefined);
 assert.throws(()=>R.validate({items:[{id:'same',project:p},{id:'same',project:p}]}),/unique/);
});
test('Play All schedules supplied section events on one clock with each instrument and stops cleanly',async()=>{
 const prepared=[],sounded=[],timers=[];
 class Context{constructor(){this.currentTime=0;this.destination={};}async resume(){}async close(){}createGain(){return {gain:{value:0},connect(){}};}}
 const browser={MLH:{ChordGenerator:C,MelodySampler:{prepare:async(ctx,instrument)=>prepared.push(instrument),play:(ctx,dest,event,start,seconds,instrument)=>sounded.push({event,start,seconds,instrument})},prepareAudioPlayback:async()=>{}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../chord-generator-audio'),'utf8'),{window:browser,AudioContext:Context,setInterval:fn=>{timers.push(fn);return timers.length;},clearInterval(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){}});
 let data=R.create(project());data=R.insert(data,C.asStudio({...project(),tempo:90,drums:null}));const compiled=R.compile(data,A),boundary=compiled.map[1].beat;
 const events=[{beat:0,duration:1,midi:60,track:'melody',velocity:1,instrument:'flute'},{beat:boundary,duration:1,midi:64,track:'chords',velocity:1,instrument:'organ'}];
 const player=new browser.MLH.ChordAudio.Player();await player.play({...compiled.project,loop:false},()=>{},null,{events});
 assert.ok(prepared.includes('flute'));assert.ok(prepared.includes('organ'));assert.equal(sounded.length,1);assert.equal(sounded[0].instrument,'flute');
 player.context.currentTime=player.startedAt+C.secondsAtBeat(compiled.project,boundary)-.1;timers[0]();
 assert.equal(sounded.length,2);assert.equal(sounded[1].instrument,'organ');assert.equal(sounded[1].start,player.startedAt+C.secondsAtBeat(compiled.project,boundary));
 player.stop();assert.equal(player.playing,false);
});
test('score playback starts at the selected beat, clips held notes and follows tempo changes on the original clock',async()=>{
 const sounded=[],positions=[],timers=[];class Context{constructor(){this.currentTime=10;this.destination={};}async resume(){}async close(){}createGain(){return {gain:{value:0},connect(){}};}}
 const browser={MLH:{ChordGenerator:C,MelodySampler:{prepare:async()=>{},play:(ctx,dest,event,start,seconds)=>sounded.push({event,start,seconds})},prepareAudioPlayback:async()=>{}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../chord-generator-audio'),'utf8'),{window:browser,AudioContext:Context,setInterval:fn=>{timers.push(fn);return 1;},clearInterval(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){}});
 const p=C.validate({...project(),tempo:120,loop:false,melodyInstrument:'flute',accompanimentInstrument:'flute'});p.sections[0].chords[1].tempo=60;
 const events=[{beat:0,duration:6,midi:60,track:'melody',velocity:1,instrument:'flute'},{beat:2,duration:1,midi:62,track:'melody',velocity:1,instrument:'flute'},{beat:4,duration:1,midi:64,track:'melody',velocity:1,instrument:'flute'},{beat:8,duration:1,midi:67,track:'melody',velocity:1,instrument:'flute'}];
 const player=new browser.MLH.ChordAudio.Player();await player.play(p,b=>positions.push(b),null,{events,startBeat:4});
 assert.deepEqual(sounded.map(n=>n.event.midi),[60,64]);assert.equal(sounded[0].event.duration,2);assert.ok(Math.abs(sounded[0].start-10.08)<1e-8);assert.ok(Math.abs(sounded[1].start-10.08)<1e-8);assert.equal(positions[0],4);
 player.context.currentTime=player.startedAt+C.secondsAtBeat(p,8)-.1;timers[0]();assert.equal(sounded.at(-1).event.midi,67);assert.ok(Math.abs(sounded.at(-1).start-(player.startedAt+C.secondsAtBeat(p,8)))<1e-8);player.stop();
});

test('standard imported melody and piano sustain across section boundaries without retriggering',()=>{
 const p=C.validate({...project(),sections:[{chords:Array.from({length:16},()=>({symbol:'-',beats:4}))}]});
 const notes=[{track:'melody',midi:79,beat:0,duration:1,velocity:.8},{track:'melody',midi:76,beat:31,duration:2,velocity:.8},...[48,52,55].map(midi=>({track:'chords',midi,beat:0,duration:4,velocity:.7})),{track:'chords',midi:48,beat:31,duration:2,velocity:.7},{track:'drums',midi:36,beat:63,duration:.1,velocity:.8}];
 const imported=C.importSongMidi(C.midiEvents(p,notes)),compiled=R.compile(imported.studioArrangement,A);
 for(const [track,midi] of [['melody',76],['chords',48]]){
  const held=compiled.events.filter(e=>e.track===track&&e.midi===midi&&e.beat>=31);
  assert.equal(held.length,1);assert.equal(held[0].beat,31);assert.equal(held[0].duration,2);
  if(track==='chords')assert.equal(held[0].notatedDuration,2);
 }
});

test('cancelling playback while the audio context starts does not begin sample loading',async()=>{
 let release,prepared=0;
 class Context{resume(){return new Promise(resolve=>{release=resolve;});}async close(){}}
 const browser={MLH:{ChordGenerator:C,BassSampler:{prepare:async()=>{prepared++;}}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../chord-generator-audio'),'utf8'),{window:browser,AudioContext:Context,clearInterval(){},cancelAnimationFrame(){}});
 const player=new browser.MLH.ChordAudio.Player(),pending=player.play(project(),()=>{});
 player.stop();release();await pending;
 assert.equal(prepared,0);assert.equal(player.playing,false);assert.equal(player.context,null);
});
