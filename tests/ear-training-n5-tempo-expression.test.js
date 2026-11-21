const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {parser,generator}=require('@babel/standalone').packages;
global.window={MLH:{useClickOutside(){}}};
window.PracticeMelodyGenerator=require('../practice-melody-generator.js');
require('../aural-accompaniment.js');require('../melodic-dictation-generator.js');
const core=require('../ear-training-exercises.js');
require('../ear-training-piano-concepts.js');require('../time-signatures-listening.js');require('../tempo-changes-listening.js');require('../aural-tonalities.js');
const tempoApi=window.MLH.TempoChangesListening;
let source=fs.readFileSync(require('node:path').join(__dirname,'../generated-runtimes/auralrecognition-1.js'),'utf8');
source=source.slice(0,source.lastIndexOf('const root=document.getElementById'))+';this.api={buildTempoChangesQuestion,prepareQuestion,conceptIdsForLevel};';
const context=vm.createContext({window,React:{createElement(){return{}},Fragment:{}},URLSearchParams,location:{search:'',href:'http://localhost/auralrecognition.html'}});
vm.runInContext(source,context);
const api=context.api;
const rubato=()=>api.prepareQuestion(api.buildTempoChangesQuestion('N5',api.conceptIdsForLevel('N5'),'rubato'));

test('N5 melody density and accompaniment support vary independently of steady tempo',()=>{
  const ids=['tempo-adagio','tempo-andante','tempo-allegro'];
  for(const id of ids) {
    const combinations=new Set();
    for(let run=0;run<240;run++) {
      const q=core.buildQuestion({level:'N5',topic:'steadyTempo',answerId:id,options:ids,mode:'choice'}),pulse=q.tempoPulseBeats;
      combinations.add(q.tempoRhythmDensity+'/'+q.tempoAccompanimentSupport);
      assert.equal(q.playbackTempo.bpm,{'tempo-adagio':60,'tempo-andante':80,'tempo-allegro':100}[id]);
      assert.equal(q.bars.length,8);
      for(const bar of q.bars) {
        assert.equal(bar.notes.reduce((sum,n)=>sum+n.beats,0),q.timeSignature.beats);
        assert.ok(bar.notes.every(n=>n.midi>=57&&n.midi<=84));
        if(bar.barIndex<2) assert.ok(bar.notes.every(n=>n.beats===pulse));
        else if(bar.barIndex<7) {
          if(q.tempoRhythmDensity==='simple') assert.ok(bar.notes.every(n=>n.beats===pulse));
          assert.ok(bar.notes.every(n=>n.beats>=.5),'tempo melodies contain no semiquaver runs');
          const limit=q.timeSignature.pulseCount+(q.tempoRhythmDensity==='mixed'&&[2,5].includes(bar.barIndex)?(q.timeSignature.type==='compound'?2:1):0);
          assert.equal(bar.notes.length,limit,'only one beat in bars three and six may subdivide');
        }
        if(q.tempoAccompanimentSupport==='light-middle'&&bar.barIndex>=2&&bar.barIndex<=5) {
          assert.equal(bar.accompaniment.length,1);assert.equal(bar.accompaniment[0].beat,0);assert.equal(bar.accompaniment[0].volume,.55);
        } else assert.equal(bar.accompaniment.length,q.timeSignature.beats/pulse);
        assert.ok(bar.accompaniment.every(e=>e.beat>=0&&e.beats>0&&e.beat+e.beats<=q.timeSignature.beats+1e-8));
      }
      assert.ok(['V','V7'].includes(q.bars[6].chordSymbol));assert.equal(q.bars[7].chordSymbol,'I');
      assert.equal(q.bars[7].notes.length,1);
    }
    assert.equal(combinations.size,4,'each speed includes simple and lightly varied melodies with both support patterns');
  }
});

test('N5 rubato uses varied profiles anchored to actual melodic notes and cadences',()=>{
  const shapes=new Set(),metres=new Set();
  for(let run=0;run<240;run++) {
    const q=rubato(),profile=q.rubatoProfile,beats=q.timeSignature.beats;
    shapes.add(profile[0].shape);metres.add(q.timeSignature.id);
    const events=q.bars.flatMap(bar=>bar.notes.filter(n=>!n.rest).map(n=>({...n,at:bar.barIndex*beats+n.beat})));
    const landmarks=events.flatMap(n=>[n.at,n.at+n.beats]);
    assert.equal(profile[0].position,0);assert.equal(profile.at(-1).position,1);
    assert.equal(profile[0].ratio,1);assert.equal(profile.at(-1).ratio,1);
    assert.ok(profile.some(p=>p.ratio>1)&&profile.some(p=>p.ratio<1));
    assert.equal(profile.filter(p=>p.anchor==='cadence').length,2);
    profile.forEach((point,index)=>{
      assert.ok(point.ratio>=.72&&point.ratio<=1.2);
      assert.ok(landmarks.some(at=>Math.abs(at-point.position*q.totalBeats)<1e-8),'expression follows actual note boundaries');
      if(index)assert.ok(point.position>profile[index-1].position);
      if(point.anchor==='cadence') assert.ok([3,7].includes(Math.floor((point.position*q.totalBeats+1e-8)/beats)));
    });
    const settings={startBpm:80*q.tempoPulseBeats,direction:'rubato',totalBeats:q.totalBeats,profile};
    const first=tempoApi.createTempoClock(settings),replay=tempoApi.createTempoClock(settings);
    for(let at=0;at<q.totalBeats;at+=.25) {
      assert.ok(first.timeAtBeat(at+.25)>first.timeAtBeat(at));
      assert.equal(first.timeAtBeat(at),replay.timeAtBeat(at),'replay preserves the generated expression');
    }
  }
  assert.equal(shapes.size,3);assert.equal(metres.size,4);
});

test('N5 rubato feedback replay gives one steady reference bar before the unchanged music',()=>{
  const ast=parser.parse(source,{plugins:['jsx']}),nodes=[];
  const walk=node=>{if(!node||typeof node!=='object')return;if(node.type)nodes.push(node);for(const item of Object.values(node)){if(Array.isArray(item))item.forEach(walk);else if(item&&typeof item==='object')walk(item);}};
  walk(ast);
  const declaration=nodes.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='playTempoChanges');
  for(let run=0;run<24;run++) for(const metronome of [false,true]) {
    const q=rubato(),clicks=[],notes=[],timers=[];let advances=0;
    const bpm=[60,80,100][run%3],start=.12,referenceDuration=q.timeSignature.pulseCount*60/bpm;
    const play=vm.runInNewContext('('+generator.default(declaration).code+')',{
      question:q,tempo:{bpm},TEMPO_CHANGES:tempoApi,metronome,
      playClick:(ctx,gain,at)=>clicks.push(at),oscillator(){},accompanimentMidi:n=>n,midiToFrequency:n=>n,
      melodyPlaybackBeats:(bar,index)=>bar.notes[index].beats,effectiveMidiForNote:(question,bar,n)=>n.soundingMidi??n.midi,
      playMelodyNote:(ctx,gain,midi,at,duration)=>notes.push({midi,at,duration}),
      timers:{current:[]},setTimeout:(fn,ms)=>{timers.push({fn,ms});return 1;},newQuestion:()=>advances++,stopAudio(){},window:{MLH:{naturalPlaybackTailMs:()=>650}}
    });
    play({currentTime:0},{},start,true);
    assert.equal(clicks.filter(at=>at<start+referenceDuration-1e-8).length,q.timeSignature.pulseCount);
    for(let index=0;index<q.timeSignature.pulseCount;index++)assert.ok(Math.abs(clicks[index]-(start+index*60/bpm))<1e-8);
    assert.ok(Math.abs(notes[0].at-start-referenceDuration)<1e-8);
    if(!metronome)assert.equal(clicks.length,q.timeSignature.pulseCount,'automatic replay clicks end before the rubato begins');
    const clock=tempoApi.createTempoClock({startBpm:bpm*q.tempoPulseBeats,direction:'rubato',totalBeats:q.totalBeats,profile:q.rubatoProfile});
    const expected=q.bars.flatMap(bar=>bar.notes.map(n=>({midi:n.soundingMidi??n.midi,at:start+referenceDuration+clock.timeAtBeat(bar.barIndex*q.timeSignature.beats+n.beat)})));
    assert.equal(notes.length,expected.length);
    expected.forEach((n,index)=>{assert.equal(notes[index].midi,n.midi);assert.ok(Math.abs(notes[index].at-n.at)<1e-8);});
    assert.ok(Math.abs(timers.at(-1).ms-((start+referenceDuration+clock.duration)*1000+650))<1e-7);
    timers.at(-1).fn();assert.equal(advances,1);
  }
});
