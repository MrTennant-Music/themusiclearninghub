const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {parser,generator}=require('@babel/standalone').packages;
global.window={MLH:{useClickOutside(){}}};window.PracticeMelodyGenerator=require('../practice-melody-generator.js');require('../aural-accompaniment.js');require('../melodic-dictation-generator.js');const core=require('../ear-training-exercises.js');require('../ear-training-piano-concepts.js');require('../time-signatures-listening.js');require('../tempo-changes-listening.js');require('../aural-tonalities.js');
let source=fs.readFileSync('generated-runtimes/auralrecognition-1.js','utf8');source=source.slice(0,source.lastIndexOf('const root=document.getElementById'))+';this.api={buildChordQuestion,buildOrnamentQuestion,prepareQuestion,higherHarmonicReplayExample,higherTimeReplayExample};';
const context=vm.createContext({window,React:{createElement(){return{}},Fragment:{}},URLSearchParams,location:{search:'',href:'http://localhost/auralrecognition.html'}});vm.runInContext(source,context);const api=context.api,pc=n=>((n%12)+12)%12;
const build=(topic,id)=>core.buildQuestion({level:'AH',topic,answerId:id,options:[id],mode:'choice'});
function valid(q){let cursor=0;for(const b of q.bars){const beats=b.beats||b.timeSignature?.beats||q.timeSignature.beats;assert.ok(Math.abs(b.notes.reduce((s,n)=>s+n.beats,0)-beats)<1e-8);for(const n of b.notes)if(!n.rest)assert.ok(n.midi>=57&&n.midi<=84);for(const e of b.accompaniment)assert.ok(e.beat>=0&&e.beats>0&&e.beat+e.beats<=beats+1e-8&&e.pitches.every(p=>p>=45));if(Number.isFinite(b.startBeat))assert.equal(b.startBeat,cursor);cursor+=beats;}assert.ok(Math.abs(q.totalBeats-cursor)<1e-8);}
test('all AH melodic-device answers have eight-bar context without changing the literal motif',()=>{
 for(const id of ['pattern-ostinato','pattern-sequence'])for(let run=0;run<120;run++){
  const q=build('repetitionSequence',id);valid(q);assert.equal(q.bars.length,8);assert.equal(q.patternGenerationFallback,false);
  q.bars.slice(0,7).forEach((b,index)=>assert.deepEqual(b.notes.map(n=>n.rest?null:n.relativeStep),q.patternMotif.map(n=>n===null?null:n+q.patternOffsets[index])));
  assert.deepEqual(q.bars.slice(-2).map(b=>b.chordSymbol),['V','I']);
 }
 for(const id of ['transform-inversion','transform-retrograde'])assert.equal(build('melodicTransformation',id).bars.length,8);
});
test('AH modulation correction covers preparation and destination; suspension examples vary while remaining prepared and resolved',()=>{
 const types=new Set(),positions=new Set(),progressions=new Set();
 for(let run=0;run<120;run++){
  const q=build('modulation','modulation-yes'),preview=api.higherHarmonicReplayExample(q);assert.ok(preview.bars.some(b=>b.keyId===q.keyChange.from));assert.ok(preview.bars.some(b=>b.keyId===q.keyChange.to));assert.ok(preview.bars.some(b=>b.accompanimentHarmony.length===2));assert.ok(preview.bars.some(b=>b.notes.length));
  for(const yes of [true,false]){
   const s=build('suspension',yes?'suspension-yes':'suspension-no');valid(s);const p=s.suspensionPlacements[0];types.add(p.type);positions.add(p.barIndex);progressions.add(s.bars.map(b=>b.chordSymbol).join());
   for(const p of s.suspensionPlacements){const prep=s.bars[p.preparationBar].notes.at(-1),target=s.bars[p.barIndex];assert.equal(prep.midi,p.suspensionMidi);assert.ok(s.key.chords[s.bars[p.preparationBar].chordSymbol].some(m=>pc(m)===pc(prep.midi)));assert.ok(target.accompanimentHarmony.at(-1).pitches.some(m=>pc(m)===pc(p.resolutionMidi)));
    if(p.type==='7-6'){assert.ok(target.accompaniment.filter(e=>e.role==='cadence-chord').every(e=>e.pitches.every(n=>n>p.bassMidi)));assert.ok([8,9].includes(pc(p.resolutionMidi-p.bassMidi)));}
    if(yes){assert.equal(target.notes[0].tiedFromPrevious,true);assert.equal(target.notes[1].midi,p.resolutionMidi);assert.equal(prep.playbackBeats,prep.beats+p.resolutionBeat);assert.ok(p.suspensionMidi>p.resolutionMidi);}else assert.equal(target.notes[0].midi,p.resolutionMidi);
   }
   const replay=api.higherHarmonicReplayExample(s);assert.equal(replay.bars[0].notes.at(-1).midi,p.suspensionMidi);assert.equal(replay.bars[1].notes[0].midi,yes?p.suspensionMidi:p.resolutionMidi);
  }
 }
 assert.deepEqual(types,new Set(['4-3','7-6','9-8']));assert.ok(positions.size>=3);assert.ok(progressions.size>=4);
});
test('AH pedal and vamp register planning avoids octave-plus jumps and preserves the high inverted pedal',()=>{
 for(const id of ['device-pedal','device-inverted-pedal','device-no-pedal','vamp-yes','vamp-no'])for(let run=0;run<120;run++){
  const q=build(id.startsWith('vamp')?'vamp':'accompanimentDevices',id);valid(q);const notes=q.bars.flatMap(b=>b.notes.filter(n=>!n.rest));notes.slice(1).forEach((n,i)=>assert.ok(Math.abs(n.midi-notes[i].midi)<=12));
  if(id==='device-inverted-pedal'){const highest=Math.max(...notes.map(n=>n.midi));q.bars.forEach(b=>b.accompaniment.filter(e=>e.role==='inverted-pedal').forEach(e=>assert.ok(e.pitches.every(p=>p>highest))));}
 }
});
test('AH time changes include compound and irregular routes with independent bar grouping and a constant crotchet clock',()=>{
 const routes=new Set();let compound=0,irregular=0;
 for(let run=0;run<336;run++){
  const q=build('irregularMetre','metre-change');valid(q);routes.add(q.timeSignatureChanges.map(c=>c.signature).join(':'));assert.equal(q.tempoPulseBeats,1);
  for(const b of q.bars){assert.equal(b.pulseOffsets.length,b.timeSignature.pulseCount);if(b.timeSignature.type==='compound')compound++;if(b.timeSignature.type==='irregular'){irregular++;assert.equal(b.metreGrouping.split('+').map(Number).reduce((a,b)=>a+b),b.timeSignature.pulseCount);}assert.ok(b.pulseAccents.every(a=>typeof a==='boolean'));}
  const replay=api.higherTimeReplayExample(q);assert.equal(replay.bars.length,3);assert.ok(new Set(replay.bars.map(b=>b.timeSignature.id)).size===2);assert.equal(replay.totalBeats,replay.bars.reduce((s,b)=>s+b.beats,0));
 }
 assert.equal(routes.size,14);assert.ok(compound>0&&irregular>0);
});
test('AH chord and ornament lead-ins vary while targets and final cadences remain clear',()=>{
 const chords=new Set(),ornaments=new Set();for(let run=0;run<120;run++){
  const q=api.prepareQuestion(api.buildChordQuestion('AH',['aug'],'aug')),p=q.passage;valid(p);chords.add(p.bars.map(b=>b.chordSymbol).join());for(const i of p.targetBars){const [target,resolution]=p.bars[i].accompanimentHarmony;assert.deepEqual(Array.from(target.pitches,n=>n-target.pitches[0]),[0,4,8]);assert.equal(pc(resolution.pitches[0]-target.pitches[0]),5);}
  const o=api.prepareQuestion(api.buildOrnamentQuestion('AH',['ornament-turn'],'ornament-turn')).passage;valid(o);ornaments.add(o.bars.map(b=>b.chordSymbol).join());assert.ok(o.ornamentCount>=2);assert.deepEqual(Array.from(o.bars.slice(-2),b=>b.chordSymbol),['V','I']);
 }
 assert.equal(chords.size,4);assert.ok(ornaments.size>=4);
});
test('AH isolated chord playback schedules four metronome clicks and one completion callback',()=>{
 const jsx=fs.readFileSync('auralrecognition.html','utf8').match(/<script type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/)[1],tree=parser.parse(jsx,{plugins:['jsx']}),nodes=[];function walk(n){if(!n||typeof n!=='object')return;if(n.type)nodes.push(n);for(const v of Object.values(n)){if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}walk(tree);const fn=nodes.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='playChord');
 for(const enabled of [true,false]){const clicks=[],timers=[];let advances=0;const play=vm.runInNewContext('('+generator.default(fn).code+')',{question:{level:'AH',notes:[{stack:[{midi:60},{midi:64},{midi:68}]}]},feedback:{correct:false},metronome:enabled,oscillator(){},midiToFrequency:n=>n,playClick:(ctx,gain,start,accent)=>clicks.push([start,accent]),timers:{current:[]},setTimeout:(fn,ms)=>{timers.push(fn);return 1;},newQuestion(){advances++},stopAudio(){},window:{MLH:{naturalPlaybackTailMs:()=>650}}});play({currentTime:0},{},.12,.6);assert.equal(clicks.length,enabled?4:0);assert.equal(timers.length,1);if(enabled)assert.deepEqual(clicks.map(c=>c[1]),[true,false,false,false]);timers[0]();assert.equal(advances,1);}
});
test('AH modal and polytonal variety keeps every layer in its mode, native metre and register',()=>{
 const modes=new Set(),pairs=new Set();for(let run=0;run<176;run++){
  const q=window.MLH.AuralTonalities.buildMelody('modal','AH');valid(q);modes.add(q.tonalityMode);const heard=new Set(q.notes.map(n=>pc(n.midi-q.tonicMidi)));assert.ok([q.tonalityMode==='dorian'?3:4,9,10].every(n=>heard.has(n)));assert.ok(q.notes.every(n=>q.key.scale.includes(pc(n.midi-q.tonicMidi))));assert.ok(q.bars.every(b=>b.accompaniment.every(e=>e.pitches.every(p=>q.key.scale.includes(pc(p-q.tonicMidi))))));
  const p=window.MLH.AuralTonalities.buildMelody('polytonality','AH');pairs.add(p.polytonalKeys.join(':'));p.layers.forEach(layer=>{valid(layer);assert.equal(layer.timeSignature.id,p.timeSignature.id);assert.ok(layer.notes.every(n=>[0,2,4,5,7,9,11].includes(pc(n.midi-layer.tonicMidi))));});
 }
 assert.deepEqual(modes,new Set(['dorian','mixolydian']));assert.equal(pairs.size,11);
});
