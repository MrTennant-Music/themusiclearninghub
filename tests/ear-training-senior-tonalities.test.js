const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {parser,generator}=require('@babel/standalone').packages;
global.window={MLH:{useClickOutside(){}}};window.PracticeMelodyGenerator=require('../practice-melody-generator.js');require('../aural-accompaniment.js');require('../melodic-dictation-generator.js');const core=require('../ear-training-exercises.js');require('../ear-training-piano-concepts.js');require('../time-signatures-listening.js');require('../tempo-changes-listening.js');require('../aural-tonalities.js');const api=window.MLH.AuralTonalities,pc=n=>((n%12)+12)%12;
test('Higher and AH tonalities share native eight-bar form and keep complete, aligned note data',()=>{
  for(const level of ['H','AH'])for(const id of level==='H'?['major','minor','atonal','modal']:['major','minor','atonal','modal','polytonality']) {
    const metres=new Set();
    for(let run=0;run<120;run++) {
      const q=api.buildMelody(id,level);metres.add(q.timeSignature.id);assert.equal(q.bars.length,8);assert.equal(q.tonalityExcerptBars,8);
      for(const layer of q.layers||[q]) {
        assert.equal(layer.timeSignature.id,q.timeSignature.id);assert.equal(layer.totalBeats,q.totalBeats);
        for(const bar of layer.bars) {
          assert.ok(Math.abs(bar.notes.reduce((sum,n)=>sum+n.beats,0)-q.timeSignature.beats)<1e-8);
          assert.ok(bar.notes.every(n=>n.rest||n.midi>=57&&n.midi<=84));
          assert.ok(bar.accompaniment.every(e=>e.beat>=0&&e.beats>0&&e.beat+e.beats<=q.timeSignature.beats+1e-8&&e.pitches.every(n=>n>=45)));
          assert.equal(JSON.stringify(layer.melodyPlan.bars[bar.barIndex].notes.map(n=>n.midi)),JSON.stringify(bar.notes.map(n=>n.midi)));
        }
      }
    }
    assert.equal(metres.size,4,`${level}/${id} uses every native metre`);
  }
});
test('senior Dorian is modal throughout, exposes characteristic notes and avoids major/minor dominant harmony',()=>{
  const keys=new Set();
  for(const level of ['H'])for(let run=0;run<160;run++) {
    const q=api.buildMelody('modal',level),heard=new Set(q.notes.map(n=>pc(n.midi-q.tonicMidi)));keys.add(q.key.id);
    assert.ok([3,9,10].every(n=>heard.has(n)));assert.ok(!heard.has(8)&&!heard.has(11));
    assert.deepEqual(q.bars.slice(-2).map(b=>b.chordSymbol),['v','i']);
    for(const bar of q.bars) {
      const harmony=new Set(bar.accompanimentHarmony[0].pitches.map(pc));
      assert.ok(bar.notes.every(n=>harmony.has(pc(n.midi))));
      assert.ok(bar.accompaniment.every(e=>e.pitches.every(n=>[0,2,3,5,7,9,10].includes(pc(n-q.tonicMidi)))));
    }
    assert.equal(q.bars.at(-1).notes[0].midi,q.tonicMidi);
    assert.deepEqual(q.bars[0].notes.map(n=>[n.midi,n.beats]),q.bars[4].notes.map(n=>[n.midi,n.beats]));
  }
  assert.equal(keys.size,8);
});
test('AH polytonality retains two independently tonal keys with shared metre and distinct positioning',()=>{
  const pairs=new Set();
  for(let run=0;run<120;run++) {
    const q=api.buildMelody('polytonality','AH');assert.equal(q.layers.length,2);pairs.add(q.polytonalKeys.join(':'));
    assert.notEqual(q.layers[0].key.id,q.layers[1].key.id);assert.ok(q.layers[0].pan<0&&q.layers[1].pan>0);
    for(const layer of q.layers)assert.ok(layer.notes.every(n=>[0,2,4,5,7,9,11].includes(pc(n.midi-layer.tonicMidi))));
  }
  assert.equal(pairs.size,11);
});

test('AH polytonal correction previews each tonal layer then replays both with one completion timer',()=>{
  const html=fs.readFileSync('auralrecognition.html','utf8'),jsx=html.match(/<script type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/)[1];
  const tree=parser.parse(jsx,{plugins:['jsx']}),nodes=[];function walk(n){if(!n||typeof n!=='object')return;if(n.type)nodes.push(n);for(const v of Object.values(n)){if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}walk(tree);
  const play=nodes.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='play'),branch=play.body.body.find(n=>n.type==='IfStatement'&&n.test.object?.name==='question'&&n.test.property?.name==='layers'),poly=nodes.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='playPolytonality');
  for(const replay of [false,true])for(let run=0;run<24;run++) {
    const question={...api.buildMelody('polytonality','AH'),answerId:'polytonality'},timers=[],tones=[];let advances=0;
    const scope={question,tonalityReplay:replay,start:.12,beat:.75/question.tempoPulseBeats,ctx:{currentTime:0,createGain:()=>({connect(){},gain:{setValueAtTime(){}}})},master:{},metronome:false,playAccompaniment(){},melodyPlaybackBeats:(bar,i)=>bar.notes[i].beats,playMelodyNote:(ctx,gain,midi,start,duration)=>tones.push({start,duration}),effectiveMidiForNote:(q,b,n)=>n.midi,midiToFrequency:n=>n,timers:{current:[]},setTimeout:(fn,ms)=>{timers.push({fn,ms});return 1;},newQuestion(){advances++;},stopAudio(){},window:{MLH:{naturalPlaybackTailMs:()=>650}}};
    const context=vm.createContext(scope);vm.runInContext(generator.default(poly).code,context);vm.runInContext('(function(){'+generator.default(branch).code+'})()',context);
    assert.equal(timers.length,1);const lead=replay?4*question.timeSignature.beats*scope.beat+.6:0;
    assert.ok(Math.abs(timers[0].ms-((.12+lead+question.totalBeats*scope.beat)*1000+650))<1e-7);
    timers[0].fn();assert.equal(advances,replay?1:0);
  }
});
