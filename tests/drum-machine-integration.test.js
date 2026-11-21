const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),Babel=require('@babel/standalone');
const D=require('../drum-machine-core'),C=require('../chord-generator-core');
const window={MLH:{DrumMachine:D,ChordGenerator:C}};const context=vm.createContext({window,React,structuredClone});
vm.runInContext(fs.readFileSync(require.resolve('../chord-generator-audio.js'),'utf8'),context);
vm.runInContext(Babel.transform(fs.readFileSync(require.resolve('../composition-options.jsx'),'utf8'),{presets:['react']}).code,context);
vm.runInContext(Babel.transform(fs.readFileSync(require.resolve('../drum-machine.jsx'),'utf8'),{presets:['react']}).code,context);
const project=()=>({version:1,title:'Drum integration',tempo:100,key:0,mode:'major',timeSignature:'4/4',style:'block',volumes:{chords:80,bass:65,drums:50,melody:75},sections:[{name:'Verse',repeats:1,chords:[{symbol:'C',beats:4,inversion:0}]}],melody:[],drums:D.preset('rock')});
test('drum machine renders ten complete instrument rows with live controls',()=>{const html=renderToStaticMarkup(React.createElement(window.MLH.DrumMachineView,{project:project(),onChange(){},playing:false,beat:-1,onPlay(){},onStop(){},onExport(){}}));for(const text of ['Drums','Drums settings'])assert.ok(html.includes(text),text);assert.ok(!html.includes('Arrange patterns'));assert.equal((html.match(/class="drum-step /g)||[]).length,160);assert.ok(!html.includes('Mute Kick'));assert.ok(!html.includes('Solo Kick'));assert.ok(!html.includes('Low tom settings'));});
test('validated saved projects preserve full drum state and reject malformed drum data',()=>{const p=project();const q=C.validate(JSON.parse(JSON.stringify(p)));assert.deepEqual(q.drums,p.drums);p.drums.patterns[0].tracks[0].steps[0]=999;assert.throws(()=>C.validate(p),/velocity/);});
test('whole-arrangement audio and MIDI contain the edited drum sequence and mixer levels',()=>{const p=project(),a=window.MLH.ChordAudio.events(p),drums=a.filter(e=>e.track==='drums');assert.equal(drums.length,D.events(p.drums,4).length);assert.equal(drums.find(e=>e.midi===36).velocity,110/127*.5);assert.ok(a.some(e=>e.track==='chords'));const bytes=C.midiEvents(p,a);assert.ok(Array.from(bytes).some((v,i)=>v===0x99&&bytes[i+1]===36));p.drums.patterns[0].tracks.find(t=>t.id==='kick').mute=true;assert.ok(!window.MLH.ChordAudio.events(p).some(e=>e.track==='drums'&&e.midi===36));});
test('drum sequence replaces automatic style drums and respects score breaks',()=>{const p=project();p.style='pop';p.drumPattern=Array.from({length:3},()=>Array(16).fill(true));const events=window.MLH.ChordAudio.events(p).filter(e=>e.track==='drums');assert.equal(events.length,D.events(p.drums,4).length);p.sections[0].chords[0].type='break';assert.equal(window.MLH.ChordAudio.events(p).filter(e=>e.track==='drums').length,0);});

test('drum scope defaults to All with one option per bar and no arrow navigation',()=>{for(const progressionBars of [4,8]){const html=renderToStaticMarkup(React.createElement(window.MLH.DrumMachineView,{project:{...project(),progressionBars},onChange(){},playing:false,beat:-1}));assert.ok(!html.includes('Steps per beat'));assert.ok(!html.includes('Different pattern for each bar'));assert.ok(!html.includes('aria-label="Pattern bars"'));assert.ok(html.includes('aria-label="Drum pattern bars"'));assert.ok(html.includes('value="all" selected="">All'));for(let bar=1;bar<=progressionBars;bar++)assert.ok(html.includes('>Bar '+bar+'</option>'));assert.ok(!html.includes('Pattern bar navigation'));assert.ok(!html.includes('Previous drum bar'));assert.ok(!html.includes('Next drum bar'));assert.equal((html.match(/class="drum-step /g)||[]).length,160);}});

test('playback follows the current drum bar and its custom hits in every metre and wraps on looping',()=>{
 for(const signature of ['4/4','3/4','6/8'])for(const bars of [4,8]){
  const beats=signature==='4/4'?4:3;
  let drums=D.studioDrums(D.create(beats),beats,bars);
  drums=D.editStudioStep(drums,bars-1,'snare',0,110,beats);
  const p={...project(),timeSignature:signature,progressionBars:bars,drums};
  const render=(beat,playing=true)=>renderToStaticMarkup(React.createElement(window.MLH.DrumMachineView,{project:p,onChange(){},playing,beat}));
  const end=render((bars-1)*beats+.01);
  assert.ok(end.includes('Custom Pattern'));assert.ok(!end.includes('studio-drum-playing-bar'));
  assert.ok(end.includes(`Snare, bar ${bars}, step 1, strength 110`));
  assert.ok(end.includes(`value="${bars-1}" selected=""`));
  assert.ok(!end.includes('Reset to Main Pattern'));
  assert.equal((end.match(/<button disabled="" class="drum-step /g)||[]).length,beats*4*10);
  assert.ok(/<button class="row" disabled=""[^>]*>[^]*?Randomise<\/button>/.test(end));
  assert.ok(/<button disabled="">Clear<\/button>/.test(end));
  assert.equal((end.match(/ playhead/g)||[]).length,10);
  const loop=render(bars*beats+.01);assert.ok(loop.includes('value="0" selected=""'));assert.ok(!loop.includes('strength 110'));
  assert.ok(!render(-1).includes('studio-drum-playing-bar'));
  const stopped=render(0,false);assert.ok(stopped.includes('value="all" selected=""'));assert.ok(!stopped.includes('studio-drum-playing-bar'));assert.ok(!stopped.includes('<button disabled="" class="drum-step '));
 }
});
