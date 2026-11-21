const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {parser,generator}=require('@babel/standalone').packages;
global.window={MLH:{useClickOutside(){}}};window.PracticeMelodyGenerator=require('../practice-melody-generator.js');require('../aural-accompaniment.js');require('../melodic-dictation-generator.js');const core=require('../ear-training-exercises.js');require('../ear-training-piano-concepts.js');require('../time-signatures-listening.js');require('../tempo-changes-listening.js');require('../aural-tonalities.js');
const pc=n=>((n%12)+12)%12;
test('H and AH intervals use two exact targets in native eight-bar phrases and faithful two-note isolation',()=>{
  const distances={'interval-semitone':1,'interval-tone':2,'interval-octave':12,'interval-tritone':6},keys=new Set(),metres=new Set(),paths=new Set();
  for(const level of ['H','AH'])for(const answerId of Object.keys(distances).filter(id=>level==='AH'||id!=='interval-tritone'))for(const direction of ['ascending','descending','mixed'])for(let run=0;run<100;run++) {
    const q=core.buildQuestion({level,topic:'intervalRecognition',answerId,intervalDirection:direction,options:[answerId],mode:'choice'});
    assert.equal(q.bars.length,8);assert.equal(q.intervalPlacements.length,2);assert.equal(q.totalBeats,8*q.timeSignature.beats);
    keys.add(q.key.id);metres.add(q.timeSignature.id);paths.add(q.notes.map(n=>n.midi).join(','));
    const dirs=new Set();
    for(const p of q.intervalPlacements) {
      assert.equal(Math.abs(p.pitches[1]-p.pitches[0]),distances[answerId]);dirs.add(p.direction);
      const bar=q.bars[p.barIndex];assert.equal(bar.notes.length,2);assert.equal(bar.notes[0].beats,bar.notes[1].beats);
      if(answerId==='interval-octave')assert.ok(Math.abs(q.bars[p.barIndex+1].notes[0].midi-p.pitches[1])<=2);
      if(answerId==='interval-tritone') {
        assert.ok(bar.accompanimentHarmony.every(s=>s.chordSymbol==='V7'));
        assert.equal(q.bars[p.barIndex+1].chordSymbol,'I');
        assert.ok(Math.abs(q.bars[p.barIndex+1].notes[0].midi-p.pitches[1])<=2);
      } else assert.ok(p.pitches.every(n=>q.key.scale.includes(pc(n-q.key.tonic))));
    }
    assert.deepEqual(dirs,new Set(direction==='mixed'?['ascending','descending']:[direction]));
    for(const bar of q.bars) {
      assert.ok(Math.abs(bar.notes.reduce((sum,n)=>sum+n.beats,0)-q.timeSignature.beats)<1e-8);
      assert.ok(bar.notes.every(n=>n.midi>=57&&n.midi<=84&&n.beats>0));
      for(const e of bar.accompaniment)assert.ok(e.beat>=0&&e.beats>0&&e.beat+e.beats<=q.timeSignature.beats+1e-8&&e.pitches.every(n=>n>=45));
    }
    const isolated=q.isolatedPassage;assert.equal(isolated.notes.length,2);assert.equal(isolated.totalBeats,2);
    assert.deepEqual(isolated.notes.map(n=>n.midi),q.intervalPlacements[0].pitches);
    assert.ok(isolated.notes.every(n=>n.beats===1&&n.volume===.82));assert.ok(isolated.bars.every(b=>b.accompaniment.length===0));
  }
  assert.equal(keys.size,8);assert.equal(metres.size,4);assert.ok(paths.size>1200);
});

test('incorrect interval replay schedules the actual isolated pair before context and advances once',()=>{
  const html=fs.readFileSync('auralrecognition.html','utf8'),jsx=html.match(/<script type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/)[1];
  const tree=parser.parse(jsx,{plugins:['jsx']}),nodes=[];function walk(n){if(!n||typeof n!=='object')return;if(n.type)nodes.push(n);for(const v of Object.values(n)){if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}walk(tree);
  const play=nodes.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='play'),branch=play.body.body.find(n=>n.type==='IfStatement'&&n.test.name==='passage'),audio=nodes.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='playAudioOnlyNotes');
  for(const fullPassage of [true,false])for(const replay of [true,false]) {
    const question=core.buildQuestion({level:'AH',topic:'intervalRecognition',answerId:'interval-tritone',options:['interval-tritone','interval-octave'],mode:'choice'}),passage=fullPassage?question:question.isolatedPassage;
    const schedules=[],tones=[];let advances=0;
    const scope={question,passage,fullPassage,rhythmReplay:false,timeReplay:false,pickupReplay:false,intervalReplay:replay,chordReplay:false,bassReplay:false,cadenceReplay:false,melodyReplay:false,questionTopic:'intervalRecognition',metronome:false,start:.12,beat:.75/(passage.tempoPulseBeats||1),ctx:{currentTime:0,createGain:()=>({connect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){}}})},master:{},harmonyGain:{},playAccompaniment(){},oscillator:(ctx,gain,midi,start)=>tones.push({midi,start}),midiToFrequency:n=>n,melodyMidi:n=>n,timers:{current:[]},setTimeout:(fn,ms)=>{schedules.push({fn,ms});return 1;},stopAudio(){},newQuestion(){advances++;},window:{MLH:{naturalPlaybackTailMs:()=>650}}};
    const context=vm.createContext(scope);vm.runInContext(generator.default(audio).code,context);vm.runInContext('(function(){'+generator.default(branch).code+'})()',context);
    assert.equal(schedules.length,1);const delay=fullPassage&&replay?1.8:0;
    assert.ok(Math.abs(schedules[0].ms-((.12+delay+passage.totalBeats*scope.beat)*1000+650))<1e-7);
    if(fullPassage&&replay)assert.deepEqual(tones.slice(0,2).map(n=>n.midi),question.isolatedPassage.notes.map(n=>n.midi));
    schedules[0].fn();assert.equal(advances,replay?1:0);
  }
});
