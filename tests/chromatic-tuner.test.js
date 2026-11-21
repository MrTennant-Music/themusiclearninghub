const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=require('../chromatic-tuner-core.js');
function signal(frequency,rate=48000,kind='sine'){
 let seed=42;
 return Float32Array.from({length:8192},(_,i)=>{const phase=2*Math.PI*frequency*i/rate;if(kind==='noise'){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296-.5;}return .25*Math.sin(phase)+(kind==='harmonics'?.17*Math.sin(phase*2)+.09*Math.sin(phase*3):0);});
}
test('detects chromatic notes across instrument and voice registers at common sample rates',()=>{
 for(const rate of [44100,48000])for(let midi=28;midi<=95;midi++){
  const frequency=440*2**((midi-69)/12),found=core.detectPitch(signal(frequency,rate),rate);
  assert.ok(found,`${rate}: MIDI ${midi}`);assert.ok(Math.abs(1200*Math.log2(found.frequency/frequency))<5,`${rate}: MIDI ${midi}: ${found.frequency}`);
 }
});
test('harmonics retain their fundamental and cents distinguish sharp from flat',()=>{
 for(const frequency of [55,82.4069,110,196,261.6256,440,880]){
  const detected=core.detectPitch(signal(frequency,48000,'harmonics'),48000);
  assert.ok(detected);assert.ok(Math.abs(1200*Math.log2(detected.frequency/frequency))<5);
 }
 for(const cents of [-35,-12,0,17,42]){
  const frequency=440*2**(cents/1200),note=core.noteForFrequency(core.detectPitch(signal(frequency),48000).frequency);
  assert.equal(note.name,'A');assert.equal(note.octave,4);assert.ok(Math.abs(note.cents-cents)<2);
 }
});
test('rejects silence, DC, very quiet signals, noise and invalid buffers',()=>{
 for(const data of [new Float32Array(8192),new Float32Array(8192).fill(.3),signal(440).map(x=>x*.001),signal(440,48000,'noise'),new Float32Array(16)])assert.equal(core.detectPitch(data,48000),null);
 assert.equal(core.detectPitch(null,48000),null);assert.equal(core.detectPitch(signal(440),NaN),null);
});
test('calibration, enharmonic names and octave boundaries are correct',()=>{
 assert.equal(core.noteForFrequency(442,442).cents,0);
 assert.equal(core.noteForFrequency(440*2**(1/12)).name,'A♯');
 assert.equal(core.noteForFrequency(440*2**(1/12),440,true).name,'B♭');
 assert.equal(core.noteForFrequency(261.625565).octave,4);
 assert.equal(core.noteForFrequency(0),null);assert.equal(core.noteForFrequency(NaN),null);
});
function harness(getUserMedia,sampleInput=()=>signal(440),instrument=null){
 const states=[],refs=[],cleanups=[],contexts=[],frames=[];let component;
 const React={useState(value){if(states.length===3&&instrument)value=instrument;const slot={value};states.push(slot);return[value,next=>slot.value=typeof next==='function'?next(slot.value):next];},useRef(value){if(instrument&&refs.length===0)value=instrument;if(instrument&&refs.length===3)value=core.createGuidedTuning(core.INSTRUMENTS[instrument].strings);const ref={current:value};refs.push(ref);return ref;},useEffect(fn){cleanups.push(fn());},createElement(type,props,...children){return {type,props:props||{},children};}};
 class AudioContext{constructor(){this.state='running';this.sampleRate=48000;this.currentTime=0;this.destination={};this.voices=[];contexts.push(this);}createOscillator(){const voice={type:'sine',frequency:{setValueAtTime(value){voice.hz=value;}},connect(){},disconnect(){},start(at){voice.startAt=at;},stop(at){voice.endAt=at;}};this.voices.push(voice);return voice;}createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}async resume(){}async close(){this.state='closed';}createAnalyser(){return {fftSize:8192,getFloatTimeDomainData(buffer){buffer.set(sampleInput());}};}createMediaStreamSource(){return {connect(){},disconnect(){}};}}
 const context={React,ReactDOM:{createRoot:()=>({render:element=>component=element.type})},navigator:{mediaDevices:{getUserMedia}},document:{hidden:false,getElementById(){},addEventListener(){},removeEventListener(){}},requestAnimationFrame:fn=>{frames.push(fn);return frames.length;},cancelAnimationFrame(){},setTimeout,clearTimeout,performance,Float32Array,window:{ChromaticTuner:core,isSecureContext:true,AudioContext,MLH:{shell:{},useClickOutside(){},useProfileState:(key,initial)=>React.useState(initial)},addEventListener(){},removeEventListener(){}}};
 const babel=require('@babel/standalone');vm.runInNewContext(babel.transform(fs.readFileSync('chromatic-tuner.js','utf8'),{presets:['react']}).code,context);
 const tree=component();let start,selectString;
 function find(node){if(!node||typeof node!=='object')return;if(node.props?.className==='tuner-start')start=node.props.onClick;if(node.type?.name==='InstrumentHead')selectString=node.props.onSelect;node.children?.flat(Infinity).forEach(find);}
 find(tree);return {start,selectString,states,contexts,refs,cleanups,frames};
}
test('microphone rejection shows clear feedback and releases its audio context',async()=>{
 const h=harness(async()=>{throw Object.assign(Error('denied'),{name:'NotAllowedError'});});await h.start();
 assert.equal(h.states[0].value,'ready');assert.match(h.states[2].value,/denied/);assert.equal(h.contexts[0].state,'closed');
});
test('leaving while microphone permission is pending stops the late stream',async()=>{
 let resolve,stopped=0;const track={stop(){stopped++;}},h=harness(()=>new Promise(r=>resolve=r));
 const pending=h.start();for(let i=0;i<5&&!resolve;i++)await Promise.resolve();h.cleanups[0]();resolve({getTracks:()=>[track]});await pending;
 assert.equal(stopped,1);assert.equal(h.contexts[0].state,'closed');
});
test('page and homepage share identity and the tuner is directly available under Tools',()=>{
 const page=fs.readFileSync('chromatictuner.html','utf8'),app=fs.readFileSync('chromatic-tuner.js','utf8'),index=fs.readFileSync('index.html','utf8');
 assert.match(page,/<title>Chromatic Tuner<\/title>/);assert.match(page,/href="\.\/app-icons\/chromatic-tuner-icon.svg\?v=[a-f0-9]+"/);
 assert.match(app,/title="Chromatic Tuner" subtitle="Tune your instrument with live pitch feedback\."/);
 assert.doesNotMatch(page,/https:\/\/(?:unpkg\.com|cdn\.tailwindcss\.com)/);assert.doesNotMatch(page,/text\/babel/);
 assert.match(page,/chromatic-tuner\.runtime\.js/);assert.match(app,/>Reset</);assert.match(app,/busy\?'Cancel':'Stop'/);
 assert.doesNotMatch(app,/Customise|A4 calibration|Flat note names|referenceValue|notationValue/);
 const other=index.slice(index.indexOf('{ category: "Tools", apps: ['));
 assert.match(other,/href: "chromatictuner.html", title: "Chromatic Tuner", desc: "Tune your instrument with live pitch feedback\."[^\n]+direct: true/);
 assert.doesNotMatch(app,/MediaRecorder|fetch\(/);
});

test('microphone samples reach the live readout and disconnection releases tracks',async()=>{
 let stopped=0;const track={stop(){stopped++;}},stream={getTracks:()=>[track],getAudioTracks:()=>[track]};
 const h=harness(async()=>stream);await h.start();assert.equal(h.states[0].value,'listening');
 h.frames[0](100);assert.ok(Math.abs(h.states[1].value-440)<1);
 track.onended();assert.equal(h.states[0].value,'ready');assert.equal(h.states[1].value,null);assert.equal(stopped,1);assert.equal(h.contexts[0].state,'closed');
});

test('REA-controlled reference observations match the reconstructed dial contract',()=>{
 const observations=JSON.parse(fs.readFileSync('tests/fixtures/chromatic-tuner-reference.json','utf8'));let previous=0;
 assert.equal(observations.length,18);
 for(const expected of observations){
  const actual=core.referenceDialState(expected.frequency,previous);previous=actual.degrees;
  assert.equal(actual.midi,expected.midi);assert.equal(actual.name.replace('♯','#'),expected.name);
  assert.equal(actual.octave,expected.octave);assert.equal(actual.cents,expected.cents);
  assert.equal(`rotate(-${actual.degrees}deg)`,expected.transform);
  assert.equal(`transform ${actual.duration}ms ease`,expected.transition);
  assert.equal(actual.frequency.toFixed(1),expected.readout);
 }
});
test('wheel alignment follows chromatic pitch without extra turns at octave boundaries',()=>{
 let previous=-1035;
 for(const midi of [69,70,71,72,73,84,83,60,59,58,46,45]){
  for(const cents of [-25,0,25]){
   const frequency=440*2**((midi-69)/12)*2**(cents/1200);
   const target=core.referenceDialState(frequency),motion=core.wheelMotion(frequency,previous);
   assert.ok(Math.abs(motion.rotation-previous)<=180);
   const alignment=((motion.rotation+target.degrees)%360+360)%360;
   assert.ok(alignment<1e-8||360-alignment<1e-8);
   assert.equal(motion.duration,(Math.trunc(Math.abs(motion.rotation-previous))+25)*15);
   previous=motion.rotation;
  }
 }
 assert.equal(core.wheelMotion(440,-1035,true).duration,0);
});

test('standard instrument strings use the right registers, including high-G ukulele',()=>{
 const expected={guitar:[40,45,50,55,59,64],bass:[28,33,38,43],ukulele:[67,60,64,69],violin:[55,62,69,76]};
 for(const [id,midis] of Object.entries(expected)){
  assert.deepEqual(core.INSTRUMENTS[id].strings,midis);
  for(const [i,midi] of midis.entries()){
   const pitch=core.stringPitch(midi);assert.equal(core.noteForFrequency(pitch.frequency).midi,midi);
   assert.equal(core.matchString(pitch.frequency,midis),i);
   const found=core.detectPitch(signal(pitch.frequency),48000);
   assert.equal(core.matchString(found.frequency,midis),i);
   assert.equal(core.matchString(pitch.frequency*2**(15/1200),midis),-1);
  }
 }
 assert.equal(core.matchString(core.frequencyForMidi(52),expected.bass),-1);
 assert.equal(core.matchString(core.frequencyForMidi(55),expected.ukulele),-1);
 assert.equal(core.matchString(null,expected.guitar),-1);
});
test('string success requires a stable pitch and chimes once until meaningfully out of tune',()=>{
 const tracker=core.createStringTracker(),strings=core.INSTRUMENTS.guitar.strings,e=core.frequencyForMidi(40);
 assert.deepEqual(tracker.observe(e,strings,0),{index:-1,celebrate:false});
 assert.equal(tracker.observe(e,strings,399).celebrate,false);
 assert.deepEqual(tracker.observe(e,strings,400),{index:0,celebrate:true});
 assert.deepEqual(tracker.observe(e,strings,900),{index:0,celebrate:false});
 tracker.observe(null,strings,950);tracker.observe(e,strings,1000);
 assert.equal(tracker.observe(e,strings,1500).celebrate,false);
 tracker.observe(null,strings,1600);tracker.observe(null,strings,2400);
 tracker.observe(e,strings,2450);assert.equal(tracker.observe(e,strings,2900).celebrate,true);
 const a=core.frequencyForMidi(45);tracker.observe(a,strings,3000);
 assert.deepEqual(tracker.observe(a,strings,3400),{index:1,celebrate:true});
 tracker.reset();assert.equal(tracker.observe(e,strings,4000).celebrate,false);
});
test('successful string tuning stops microphone tracks, retains success, and finishes its chime',async()=>{
 let stopped=0;const track={stop(){stopped++;}},h=harness(async()=>({getTracks:()=>[track],getAudioTracks:()=>[track]}));
 h.refs[0].current='violin';h.refs[3].current=core.createGuidedTuning(core.INSTRUMENTS.violin.strings);h.refs[3].current.select(2);await h.start();
 h.frames[0](100);assert.equal(h.states[5].value,-1);
 h.frames[0](550);assert.equal(h.states[5].value,2);
 assert.equal(h.states[8].value,'A string in tune');
 assert.deepEqual(h.contexts[0].voices.map(voice=>voice.hz),[880,1318.51]);
 h.frames[0](600);h.frames[0](1550);assert.equal(h.contexts[0].voices.length,2);
 assert.equal(stopped,1);assert.equal(track.onended,null);assert.equal(h.states[0].value,'ready');
 assert.equal(h.states[6].value,3);assert.deepEqual(Array.from(h.states[7].value),[2]);
 assert.equal(h.states[8].value,'A string in tune');
 await new Promise(resolve=>setTimeout(resolve,700));assert.equal(h.contexts[0].state,'closed');
});

test('chromatic tuning never shows a success message or plays a confirmation chime',async()=>{
 const track={stop(){}},h=harness(async()=>({getTracks:()=>[track],getAudioTracks:()=>[track]}));
 await h.start();h.frames[0](100);assert.equal(h.states[8].value,'');
 h.frames[0](550);assert.equal(h.states[8].value,'');
 assert.equal(h.contexts[0].voices.length,0);
 h.frames[0](1550);assert.equal(h.contexts[0].voices.length,0);
 h.frames[0](2700);assert.equal(h.states[8].value,'');
 track.onended();
});

test('guided success tolerates small pitch fluctuations but rejects an incorrect pitch',()=>{
 const guided=core.createGuidedTuning(core.INSTRUMENTS.guitar.strings),e=core.frequencyForMidi(40);
 guided.select(0);guided.observe(e*2**(4/1200),0);
 assert.equal(guided.observe(e*2**(-4/1200),399).celebrate,false);
 assert.equal(guided.observe(e*2**(4/1200),400).celebrate,true);
 guided.select(0);guided.observe(e*2**(12/1200),1000);
 assert.equal(guided.observe(e*2**(12/1200),1500).celebrate,false);
 guided.observe(e*2,2000);assert.equal(guided.observe(e*2,2500).celebrate,false);
});

test('guided tuning retains the selected string until the user selects another, and resets',()=>{
 const strings=core.INSTRUMENTS.guitar.strings,guided=core.createGuidedTuning(strings);let now=0;
 const hold=midi=>{guided.observe(core.frequencyForMidi(midi),now);now+=450;return guided.observe(core.frequencyForMidi(midi),now);};
 assert.equal(hold(40).celebrate,false);assert.equal(guided.snapshot().selected,-1);
 guided.select(0);assert.equal(hold(64).celebrate,false); // Same letter, wrong E string.
 for(let i=0;i<strings.length;i++){
  guided.select(i);
  const result=hold(strings[i]);assert.equal(result.celebrate,true);assert.equal(result.matched,i);
  assert.equal(result.selected,i);assert.equal(result.completed.length,i+1);now+=1000;
 }
 assert.equal(hold(40).celebrate,false);assert.equal(guided.snapshot().completed.length,6);
 assert.deepEqual(guided.reset(),{selected:-1,completed:[]});
 guided.select(4);assert.equal(hold(59).selected,4);assert.equal(hold(64).celebrate,false);
 guided.select(5);assert.equal(hold(64).selected,5);
 guided.select(4);assert.deepEqual(guided.snapshot().completed,[5]);
});
test('guided tuning advances to the next unfinished string and ends with no selection',()=>{
 const strings=core.INSTRUMENTS.violin.strings,guided=core.createGuidedTuning(strings);let now=0;
 for(let expected=0;expected<strings.length;expected++){
  if(expected===0)guided.select(0);
  guided.observe(core.frequencyForMidi(strings[expected]),now);now+=450;
  assert.equal(guided.observe(core.frequencyForMidi(strings[expected]),now).celebrate,true);
  const next=guided.advance();assert.equal(next.selected,expected===strings.length-1?-1:expected+1);now+=100;
 }
 assert.deepEqual(guided.snapshot().completed,[0,1,2,3]);
});
test('pausing or reference playback clears settling time without losing completed strings',()=>{
 const guided=core.createGuidedTuning(core.INSTRUMENTS.violin.strings);guided.select(0);
 guided.observe(core.frequencyForMidi(55),0);guided.resetDetection();
 assert.equal(guided.observe(core.frequencyForMidi(55),10000).celebrate,false);
 assert.equal(guided.observe(core.frequencyForMidi(55),10450).celebrate,true);
 guided.resetDetection();assert.deepEqual(guided.snapshot(),{selected:0,completed:[0]});
});

test('piano E4 explains the octave mismatch for low guitar E, then E2 confirms',async()=>{
 let midi=64;
 const track={stop(){}},h=harness(async()=>({getTracks:()=>[track],getAudioTracks:()=>[track]}),()=>midi===null?new Float32Array(8192):signal(core.frequencyForMidi(midi),48000,'harmonics'));
 h.refs[0].current='guitar';h.refs[3].current=core.createGuidedTuning(core.INSTRUMENTS.guitar.strings);h.refs[3].current.select(0);
 await h.start();h.frames[0](100);h.frames[0](550);
 assert.equal(h.states[9].value,'Too high');
 assert.equal(h.states[8].value,'');assert.equal(h.contexts[0].voices.length,0);
 midi=null;h.frames[0](700);assert.equal(h.states[9].value,'');
 midi=40;h.frames[0](1000);assert.equal(h.states[9].value,'');h.frames[0](1400);
 assert.equal(h.states[9].value,'');assert.equal(h.states[8].value,'E string in tune');
 assert.deepEqual(Array.from(h.states[7].value),[0]);assert.equal(h.states[6].value,1);
 assert.equal(h.contexts[0].voices.length,2);assert.equal(track.onended,null);assert.equal(h.states[0].value,'ready');
});

test('selected-string guidance covers every detected pitch outside its tuning range',()=>{
 const midi=core.INSTRUMENTS.guitar.strings[0],target=core.frequencyForMidi(midi);
 for(const cents of [-2400,-1200,-101,-50,-11,11,50,101,1200,2400]){
  assert.equal(core.stringPitchHint(target*2**(cents/1200),midi),cents>0?'Too high':'Too low');
 }
 for(const cents of [-9,0,9])assert.equal(core.stringPitchHint(target*2**(cents/1200),midi),'');
 for(const frequency of [null,0,NaN])assert.equal(core.stringPitchHint(frequency,midi),'');
 assert.equal(core.stringPitchHint(target,undefined),'');
});

test('chromatic readout retains the last detected pitch through silence until stopped',async()=>{
 let audible=true;const track={stop(){}},h=harness(async()=>({getTracks:()=>[track],getAudioTracks:()=>[track]}),()=>audible?signal(440):new Float32Array(8192));
 await h.start();h.frames[0](100);const lastPitch=h.states[1].value;
 assert.ok(Math.abs(lastPitch-440)<1);
 audible=false;h.frames[0](900);h.frames[0](3000);
 assert.equal(h.states[1].value,lastPitch);assert.equal(h.states[8].value,'');
 track.onended();assert.equal(h.states[1].value,null);
});

test('instrument scale fixes the selected letter and moves left or right against its exact pitch',()=>{
 const target=core.frequencyForMidi(40);
 for(const cents of [-1200,-50,-25,0,25,50,1200]){
  const dial=core.instrumentDialState(target*2**(cents/1200),40);
  assert.equal(dial.name,'E');assert.ok(Math.abs(dial.cents-cents)<1e-8);
  assert.ok(Math.abs(dial.position-(450+Math.max(-50,Math.min(50,cents))*7.2))<1e-8);
  assert.equal(dial.inTune,cents===0);
 }
 assert.equal(core.instrumentDialState(null,45).name,'A');
 assert.equal(core.instrumentDialState(null,45).position,450);
 assert.equal(core.instrumentDialState(440,null).name,'');
});

test('instrument indicator is red outside range, orange nearby, and green in tune',()=>{
 const target=core.frequencyForMidi(45);
 for(const cents of [-1200,-26,-20,-11,-9,0,9,11,20,26,1200]){
  const dial=core.instrumentDialState(target*2**(cents/1200),45);
  assert.equal(dial.colour,Math.abs(cents)<=10?'#16a34a':Math.abs(cents)<=25?'#ea580c':'#dc2626');
 }
 assert.equal(core.instrumentDialState(null,45).colour,'#111');
});

test('selecting a string starts instrument listening without a Start button',async()=>{
 let requested=0,stopped=0;const track={stop(){stopped++;}};
 const h=harness(async()=>{requested++;return {getTracks:()=>[track],getAudioTracks:()=>[track]};},()=>signal(core.frequencyForMidi(40)),'guitar');
 assert.equal(h.start,undefined);assert.equal(requested,0);
 await h.selectString(0);
 assert.equal(requested,1);assert.equal(h.states[0].value,'listening');assert.equal(h.states[6].value,0);
 h.frames[0](performance.now()+250);h.frames[0](performance.now()+650);
 assert.equal(stopped,1);assert.equal(h.states[0].value,'ready');assert.deepEqual(Array.from(h.states[7].value),[0]);
 await h.selectString(1);
 assert.equal(requested,2);assert.equal(h.states[0].value,'listening');assert.equal(h.states[6].value,1);
 track.onended();
});

test('successful tuning advances and centres the next target',async()=>{
 const target=core.frequencyForMidi(40),track={stop(){}};
 const h=harness(async()=>({getTracks:()=>[track],getAudioTracks:()=>[track]}),()=>signal(target*2**(4/1200)),'guitar');
 await h.selectString(0);h.frames[0](performance.now()+250);h.frames[0](performance.now()+650);
 assert.equal(h.states[0].value,'ready');assert.equal(h.states[1].value,null);assert.equal(h.states[6].value,1);
 assert.equal(core.instrumentDialState(h.states[1].value,45).position,450);
 assert.deepEqual(Array.from(h.states[7].value),[0]);
});

test('shared instrument state initialises the guided controller before interaction',()=>{
 const h=harness(async()=>({getTracks:()=>[],getAudioTracks:()=>[]}),()=>signal(core.frequencyForMidi(40)),'guitar');
 assert.equal(h.refs[0].current,'guitar');assert.ok(h.refs[3].current);
 assert.deepEqual(h.refs[3].current.snapshot(),{selected:-1,completed:[]});
});

test('the deployed tuner runtime is rebuilt from the current JSX source',()=>{
 const Babel=require('../vendor/babel/babel.min.js');
 const expected=`${Babel.transform(fs.readFileSync('chromatic-tuner.js','utf8'),{comments:false,compact:false,presets:['react'],sourceMaps:false}).code}\n`;
 assert.equal(fs.readFileSync('chromatic-tuner.runtime.js','utf8'),expected);
});
