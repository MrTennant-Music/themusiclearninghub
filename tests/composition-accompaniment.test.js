const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),Babel=require('@babel/standalone');
const C=require('../chord-generator-core'),D=require('../drum-machine-core'),T=require('../composition-templates'),M=require('../composition-score');
const window={MLH:{ChordGenerator:C,DrumMachine:D}},context=vm.createContext({window,React});
vm.runInContext(fs.readFileSync(require.resolve('../chord-generator-audio'),'utf8'),context);const A=window.MLH.ChordAudio;
vm.runInContext(Babel.transform(fs.readFileSync(require.resolve('../composition-options.jsx'),'utf8'),{presets:['react']}).code,context);
vm.runInContext(Babel.transform(fs.readFileSync(require.resolve('../composition-accompaniment.jsx'),'utf8'),{presets:['react']}).code,context);
const plain=()=>C.asStudio(T.create('ode-to-joy',()=>.5));
test('opening accompaniment editing captures existing pitches, timings and gate lengths without mutating the session',()=>{
 for(const signature of ['2/4','3/4','4/4','6/8'])for(const style of Object.keys(A.styles).filter(s=>C.patternAllowed(s,signature))){
  const p=C.asStudio({...plain(),timeSignature:signature,style,drums:null}),before=JSON.stringify(p),notes=A.accompanimentNotes(p),q=C.asStudio({...p,accompaniment:notes});
  assert.equal(JSON.stringify(p),before);
  const original=A.events(p).filter(e=>e.track==='chords'),edited=A.events(q).filter(e=>e.track==='chords');
  assert.equal(edited.length,original.length,style);
  original.forEach((e,i)=>{assert.equal(edited[i].beat,e.beat);assert.equal(edited[i].midi,e.midi);assert.ok(Math.abs(edited[i].duration-e.duration)<1e-8);assert.ok(Math.abs(edited[i].velocity-e.velocity)<.006);});
 }
});
test('custom accompaniment replaces generated piano notes in playback, score and saved MIDI, while other tracks stay intact',()=>{
 const original=plain(),notes=[{midi:40,beat:0,duration:1.5,velocity:100,gate:.85},{midi:73,beat:1.5,duration:.5,velocity:110,gate:1}];
 const p=C.asStudio({...original,accompaniment:notes}),events=A.events(p),piano=events.filter(e=>e.track==='chords');
 assert.deepEqual(structuredClone(piano.map(e=>[e.beat,e.midi,e.notatedDuration])),[[0,40,1.5],[1.5,73,.5]]);
 assert.deepEqual(events.filter(e=>e.track!=='chords'),A.events(original).filter(e=>e.track!=='chords'));
 const score=M.build(p,events),pitched=score.staff.filter(s=>s.id.startsWith('piano')).flatMap(s=>s.voices.flat(2)).filter(n=>!n.rest&&!n.tieFrom);
 assert.deepEqual(pitched.flatMap(n=>n.pitches.map(p=>p.midi)).sort((a,b)=>a-b),[40,73]);
 const restored=C.importSongMidi(C.songMidi(p,events));assert.deepEqual(restored.accompaniment,p.accompaniment);assert.equal(A.events(restored).filter(e=>e.track==='chords').length,2);
 const empty={...p,accompaniment:[]};assert.ok(!A.events(empty).some(e=>e.track==='chords'||e.track==='bass'));
});
test('accompaniment data is validated and the overlay renders editable pitches, bars and apply/cancel controls',()=>{
 const p=plain();assert.throws(()=>C.validate({...p,accompaniment:[{midi:200,beat:0,duration:1}]}),/accompaniment note/);
 const html=renderToStaticMarkup(React.createElement(context.window.MLH.AccompanimentEditor,{project:p,onApply(){},onCancel(){}}));
 for(const label of ['Play accompaniment','Accompaniment piano roll','Accompaniment quantise','Bar 1','Bar 4','Apply','Cancel'])assert.ok(html.includes(label),label);
 assert.ok(html.includes('melody-note-block'));assert.ok(html.includes('aria-pressed="true"'));
});

test('accompaniment toolbar offers the melody options without Record or explanatory prompts',()=>{
 const html=renderToStaticMarkup(React.createElement(context.window.MLH.AccompanimentEditor,{project:plain(),onApply(){},onCancel(){}}));
 for(const label of ['Accompaniment instrument','Accompaniment octave down','Accompaniment octave up','Accompaniment quantise','Accompaniment sustain'])assert.ok(html.includes(label),label);
 for(const text of ['Accompaniment scale filter','Accompaniment octave range','Record','Click to add or select','Position and length are measured','Select a note to edit'])assert.ok(!html.includes(text),text);
 assert.ok(html.includes('Minim (1/2)'));assert.equal((html.match(/data-accompaniment-pitch=/g)||[]).length,48);assert.ok(html.includes('data-accompaniment-pitch="36"'));assert.ok(html.includes('data-accompaniment-pitch="83"'));assert.ok(!html.includes('Octave •'));
});
test('accompaniment instrument and sustain settings affect saved MIDI and playback without changing notation lengths',()=>{
 const p=C.asStudio({...plain(),accompanimentInstrument:'flute',accompanimentSustain:true,accompaniment:[{midi:60,beat:0,duration:.5,velocity:100},{midi:60,beat:2,duration:.5,velocity:100}]});
 const notes=A.events(p).filter(e=>e.track==='chords');assert.equal(notes[0].duration,2);assert.equal(notes[0].notatedDuration,.5);
 assert.equal(notes[1].duration,C.totalBeats(p)-2);
 const bytes=Array.from(C.songMidi(p,A.events(p)));assert.ok(bytes.some((b,i)=>b===0xc0&&bytes[i+1]===73));
 const restored=C.importSongMidi(Uint8Array.from(bytes));assert.equal(restored.accompanimentInstrument,'flute');assert.equal(restored.accompanimentSustain,true);
});

test('accompaniment roll includes every bar and uses a four-bar width with scrolling for eight bars',()=>{
 for(const bars of [4,8])for(const timeSignature of ['2/4','3/4','4/4','6/8']){
  const p=C.asStudio({...plain(),progressionBars:bars,timeSignature,drums:null,accompanimentQuantise:16});
  const html=renderToStaticMarkup(React.createElement(context.window.MLH.AccompanimentEditor,{project:p,onApply(){},onCancel(){}}));
  assert.equal((html.match(/data-accompaniment-pitch=/g)||[]).length,48);
  assert.equal((html.match(/class="accompaniment-bar-heading"/g)||[]).length,bars);
  assert.equal((html.match(/aria-label="[^"<>]+, bar \d+, beat /g)||[]).length,48*Math.round(C.totalBeats(p)*4));
  assert.ok(!html.includes('Next accompaniment bar'));
  assert.ok(!html.includes('minmax(48px'));
  assert.ok(html.includes(bars===8?'width:calc(200% - 44px)':'width:100%'));
 }
});

test('existing pitches outside the usual accompaniment range remain visible',()=>{
 const p=C.asStudio({...plain(),accompaniment:[{midi:21,beat:0,duration:1},{midi:108,beat:1,duration:1}]});
 const html=renderToStaticMarkup(React.createElement(context.window.MLH.AccompanimentEditor,{project:p,onApply(){},onCancel(){}}));
 assert.equal((html.match(/data-accompaniment-pitch=/g)||[]).length,50);
 assert.ok(html.includes('data-accompaniment-pitch="21"'));assert.ok(html.includes('data-accompaniment-pitch="108"'));
});
