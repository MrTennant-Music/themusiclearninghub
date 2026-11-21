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
let source=fs.readFileSync(require('node:path').join(__dirname,'../generated-runtimes/auralrecognition-1.js'),'utf8');
source=source.slice(0,source.lastIndexOf('const root=document.getElementById'))+';this.api={buildOrnamentQuestion,ornamentNeighbour,ornamentPlaybackNotes,ornamentReplayExample,prepareQuestion};';
const context=vm.createContext({window,React:{createElement(){return{}},Fragment:{}},URLSearchParams,location:{search:'',href:'http://localhost/auralrecognition.html'}});
vm.runInContext(source,context);
const api=context.api;
test('ornament neighbours respect every major and harmonic minor key',()=>{
  for(const key of Object.values(core.keys)) for(let midi=60;midi<=81;midi++) {
    const scale=key.scale;
    if(!scale.includes(((midi-key.tonic)%12+12)%12))continue;
    for(const direction of [-1,1]) {
      const neighbour=api.ornamentNeighbour(midi,direction,key,key.tonic);
      assert.equal(Math.sign(neighbour-midi),direction);
      assert.ok(scale.includes(((neighbour-key.tonic)%12+12)%12));
    }
  }
});
test('N5 ornaments retain native bars, varied keys, clear placements and final tonic',()=>{
  const keys=new Set(),metres=new Set(),paths=new Set();
  for(const id of ['ornament-grace-note','ornament-trill']) for(let run=0;run<500;run++) {
    const q=api.buildOrnamentQuestion('N5',[id],id),p=q.passage;
    keys.add(p.key.id);metres.add(p.timeSignature.id);paths.add(p.notes.map(n=>n.midi).join(','));
    assert.equal(p.bars.length,8);assert.ok([2,3].includes(p.ornamentCount));
    assert.equal(p.bars.filter(b=>b.notes.some(n=>n.ornament)).length,p.ornamentCount);
    assert.ok(!p.bars.at(-1).notes.some(n=>n.ornament));
    for(const bar of p.bars) {
      assert.ok(Math.abs(bar.notes.reduce((s,n)=>s+n.beats,0)-p.timeSignature.beats)<1e-8);
      for(const n of bar.notes) {assert.ok(n.soundingMidi>=57&&n.soundingMidi<=84);assert.ok(n.beats>0);}
      assert.ok(bar.accompaniment.every(e=>e.beats>0&&e.beat+e.beats<=p.timeSignature.beats+1e-8));
      if(bar.notes.some(n=>n.ornament)) assert.ok(bar.accompaniment.every(e=>e.volume===.35));
    }
    for(const bpm of [60,80,100]) {
      const beat=60/bpm/p.tempoPulseBeats,events=api.ornamentPlaybackNotes(p,beat);
      for(let i=0;i<events.length;i++) {
        const n=events[i];assert.ok(n.beats>0);
        if(n.gateRelease) assert.ok(n.beats*beat<=.1300001);
        if(i<events.length-1)assert.ok(n.beat+n.beats<=events[i+1].beat+1e-8);
      }
      assert.ok(Math.abs(events.at(-1).beat+events.at(-1).beats-p.totalBeats)<1e-8);
    }
  }
  assert.equal(keys.size,8);assert.equal(metres.size,4);assert.ok(paths.size>500);
});
test('incorrect ornament replay foregrounds melody and advances after playback',()=>{
  const page=fs.readFileSync(require('node:path').join(__dirname,'../auralrecognition.html'),'utf8');
  assert.ok(page.includes('(isScaleStudy || questionTopic === "ornaments") && feedback?.correct === false'));
  assert.ok(page.includes('harmonyReplay ? 1.4 : (melodyReplay || intervalReplay) ? .35 : 1'));
  assert.ok(page.includes('playAudioOnlyNotes(ctx, master, passageStart, beat, passage, melodyReplay || cadenceReplay || bassReplay || chordReplay || intervalReplay || rhythmReplay || pickupReplay || timeReplay)'));
});
test('ornament performance scheduling keeps the bar clock and advances only on replay',()=>{
  const html=fs.readFileSync(require('node:path').join(__dirname,'../auralrecognition.html'),'utf8');
  const jsx=[...html.matchAll(/<script\b[^>]*type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
  const tree=parser.parse(jsx,{sourceType:'script',plugins:['jsx']}),nodes=[];
  function walk(n){if(!n||typeof n!=='object')return;if(n.type)nodes.push(n);for(const v of Object.values(n)){if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}
  walk(tree);
  const fn=nodes.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='playAudioOnlyNotes');
  for(const id of ['ornament-grace-note','ornament-trill'])for(const context of [false,true])for(const replay of [false,true])for(const bpm of [60,80,100]) {
    const q=api.buildOrnamentQuestion('N5',[id],id),content=context?q.passage:q;
    const tones=[],timers=[];let advances=0,stops=0;
    const play=vm.runInNewContext('('+generator.default(fn).code+')',{
      question:q,questionTopic:'ornaments',metronome:false,ornamentPlaybackNotes:api.ornamentPlaybackNotes,
      oscillator:(ctx,gain,midi,start,duration)=>tones.push({midi,start,duration}),midiToFrequency:n=>n,melodyMidi:n=>n,
      timers:{current:[]},setTimeout:(fn,ms)=>{timers.push({fn,ms});return 1;},newQuestion(){advances++;},stopAudio(){stops++;},window:{MLH:{naturalPlaybackTailMs:()=>650}}
    });
    const ctx={currentTime:0,createGain:()=>({connect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){}}})};
    const beat=60/bpm/(content.tempoPulseBeats||1);
    play(ctx,{},.12,beat,content,replay);
    assert.equal(tones.length,api.ornamentPlaybackNotes(content,beat).length);
    assert.ok(tones.every(t=>Number.isFinite(t.start)&&t.duration>0));
    assert.ok(Math.abs(timers[0].ms-((.12+content.totalBeats*beat)*1000+650))<1e-7);
    timers[0].fn();assert.equal(advances,replay?1:0);assert.equal(stops,replay?0:1);
  }
});
test('higher-level appoggiaturas retain their long leaning note',()=>{
  const q=api.buildOrnamentQuestion('AH',['ornament-appoggiatura'],'ornament-appoggiatura');
  const played=api.ornamentPlaybackNotes(q.passage,1);
  for(const note of played.filter(n=>n.ornament==='ornament-appoggiatura'&&n.gateRelease))assert.ok(note.beats>=.5);
});

test('prepared trill questions alternate two sounding pitches after every metre conversion',()=>{
  const metres=new Set();
  for(const level of ['N5','H','AH'])for(let run=0;run<160;run++) {
    const q=api.prepareQuestion(api.buildOrnamentQuestion(level,['ornament-grace-note','ornament-trill'],'ornament-trill'));
    const p=q.passage;metres.add(p.timeSignature.id);
    assert.equal(p.tempoPulseBeats,p.timeSignature.pulseQuarterBeats||1);
    for(const bar of p.bars) {
      const trill=bar.notes.filter(n=>n.ornament==='ornament-trill');
      if(!trill.length)continue;
      assert.equal(new Set(trill.map(n=>n.midi)).size,2);
      for(let i=0;i<trill.length;i++) {
        assert.equal(trill[i].midi,trill[i].soundingMidi);
        if(i)assert.notEqual(trill[i].midi,trill[i-1].midi);
      }
      assert.ok(bar.accompaniment.every(e=>e.volume===.35),'metre conversion retains quiet held support');
    }
    for(const bpm of [60,80,100]) {
      const events=api.ornamentPlaybackNotes(p,60/bpm/(p.tempoPulseBeats||1));
      for(let i=0;i<events.length;i++) {
        assert.equal(events[i].midi,events[i].soundingMidi);
        if(events[i].ornament==='ornament-trill'&&events[i].gateRelease)assert.notEqual(events[i].midi,events[i+1].midi);
      }
    }
  }
  assert.deepEqual([...metres].sort(),['2/4','3/4','4/4','6/8']);
});

test('trills play at least semiquaver triplets, including after metre conversion',()=>{
  for(const level of ['N5','H','AH'])for(let run=0;run<40;run++) {
    const q=api.prepareQuestion(api.buildOrnamentQuestion(level,['ornament-trill'],'ornament-trill'));
    for(const content of [q,q.passage])for(const bpm of [60,80,100]) {
      const beatSeconds=60/bpm/(content.tempoPulseBeats||1);
      const events=api.ornamentPlaybackNotes(content,beatSeconds);
      for(const event of events.filter(n=>n.ornament==='ornament-trill'&&n.gateRelease)) {
        assert.ok(event.beats<=1/6+1e-8,'six or more attacks per crotchet');
        assert.ok(event.beats*beatSeconds<=.090001,'slow tempos retain a rapid trill');
      }
    }
  }
});
test('trill speed changes preserve resolution onset and total phrase duration',()=>{
  for(const level of ['N5','H','AH'])for(let run=0;run<60;run++) {
    const q=api.prepareQuestion(api.buildOrnamentQuestion(level,['ornament-trill'],'ornament-trill'));
    for(const content of [q,q.passage])for(const bpm of [60,80,100]) {
      const played=api.ornamentPlaybackNotes(content,60/bpm/(content.tempoPulseBeats||1));
      const originalResolutions=content.notes.filter(n=>n.ornament==='ornament-trill'&&!n.gateRelease);
      const resolutions=played.filter(n=>n.ornament==='ornament-trill'&&!n.gateRelease);
      assert.equal(JSON.stringify(resolutions.map(n=>[n.beat,n.beats,n.midi])),JSON.stringify(originalResolutions.map(n=>[n.beat,n.beats,n.midi])));
      assert.ok(played.length>=content.notes.length);
    }
  }
});
test('ornament placement preserves source melody and varies short and long trills',()=>{
  const lengths=new Set(),positions=new Set();
  for(let run=0;run<300;run++) {
    const p=api.buildOrnamentQuestion('N5',['ornament-trill'],'ornament-trill').passage;
    assert.ok([2,3].includes(p.ornamentCount));
    for(const placement of p.ornamentPlacements) {
      const source=p.ornamentSourceBars[placement.barIndex].notes;
      const anchor=source.find(n=>n.beat===placement.beat);
      assert.equal(anchor.midi,placement.main,'main note keeps its original melodic connections');
      lengths.add(placement.beats);positions.add(placement.beat);
      const decorated=p.bars[placement.barIndex].notes.filter(n=>n.ornament);
      assert.equal(decorated[0].midi,anchor.midi);
      assert.ok(Math.abs(decorated.at(-1).beat+decorated.at(-1).beats-(anchor.beat+anchor.beats))<1e-8);
      for(const n of source.filter(n=>n.beat!==anchor.beat)) {
        assert.ok(p.bars[placement.barIndex].notes.some(out=>!out.ornament&&out.beat===n.beat&&out.midi===n.midi&&out.beats===n.beats),'surrounding notes remain intact');
      }
    }
    assert.ok(p.ornamentSourceBars.slice(0,-1).some((bar,i)=>p.bars[i].notes.some(n=>!n.ornament)));
  }
  assert.ok(lengths.size>=3);assert.ok(positions.size>=2);
});
test('incorrect passage replay plays the actual ornament first with one completion timer',()=>{
  const html=fs.readFileSync(require('node:path').join(__dirname,'../auralrecognition.html'),'utf8');
  const jsx=[...html.matchAll(/<script\b[^>]*type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
  const tree=parser.parse(jsx,{sourceType:'script',plugins:['jsx']}),nodes=[];
  function walk(n){if(!n||typeof n!=='object')return;if(n.type)nodes.push(n);for(const v of Object.values(n)){if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}
  walk(tree);
  const play=nodes.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='play');
  const branch=play.body.body.find(n=>n.type==='IfStatement'&&n.test.type==='Identifier'&&n.test.name==='passage');
  const audio=nodes.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='playAudioOnlyNotes');
  for(const id of ['ornament-trill','ornament-grace-note'])for(const replay of [false,true])for(const bpm of [60,80,100]) {
    const question=api.prepareQuestion(api.buildOrnamentQuestion('N5',[id],id)),passage=question.passage;
    let advances=0;const scheduled=[],harmony=[],tones=[];
    const ctx={currentTime:0,createGain:()=>({connect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){}}})};
    const scope={passage,question,questionTopic:'ornaments',rhythmReplay:false,timeReplay:false,pickupReplay:false,intervalReplay:false,chordReplay:false,bassReplay:false,cadenceReplay:false,melodyReplay:replay,start:.12,beat:60/bpm/passage.tempoPulseBeats,ctx,master:{},harmonyGain:{},
      ornamentReplayExample:api.ornamentReplayExample,ornamentPlaybackNotes:api.ornamentPlaybackNotes,metronome:false,
      oscillator:(ctx,gain,midi,start,duration)=>tones.push({midi,start,duration}),midiToFrequency:n=>n,melodyMidi:n=>n,
      playAccompaniment:(ctx,gain,bar,offset,beat,start)=>harmony.push(start),timers:{current:[]},setTimeout:(fn,ms)=>{scheduled.push({fn,ms});return 1;},
      newQuestion(){advances++;},stopAudio(){},window:{MLH:{naturalPlaybackTailMs:()=>650}}};
    const context=vm.createContext(scope);
    vm.runInContext(generator.default(audio).code,context);
    vm.runInContext('(function(){'+generator.default(branch).code+'})()',context);
    const example=api.ornamentReplayExample(passage);
    const lead=replay?example.totalBeats*scope.beat+.3:0;
    assert.equal(scheduled.length,1,'isolated preview cannot stop the following passage');
    assert.ok(Math.abs(harmony[0]-(.12+lead))<1e-8);
    assert.ok(Math.abs(scheduled[0].ms-((.12+lead+passage.totalBeats*scope.beat)*1000+650))<1e-7);
    if(replay) {
      const preview=api.ornamentPlaybackNotes(example,scope.beat);
      assert.deepEqual(tones.slice(0,preview.length).map(t=>t.midi),Array.from(preview,n=>n.midi));
    }
    scheduled[0].fn();assert.equal(advances,replay?1:0);
  }
});
test('every supported ornament retains positive notes and complete bars',()=>{
  const levels={N5:['grace-note','trill'],H:['acciaccatura','trill','mordent'],AH:['acciaccatura','trill','mordent','turn','appoggiatura']};
  for(const [level,ids] of Object.entries(levels))for(const id of ids)for(let run=0;run<40;run++) {
    const p=api.prepareQuestion(api.buildOrnamentQuestion(level,['ornament-'+id],'ornament-'+id)).passage;
    assert.ok([2,3].includes(p.ornamentCount));
    for(const bar of p.bars) {
      assert.ok(bar.notes.every(n=>n.beats>0&&Number.isFinite(n.midi)));
      assert.ok(Math.abs(bar.notes.reduce((sum,n)=>sum+n.beats,0)-p.timeSignature.beats)<1e-8);
    }
  }
});

test('grace notes and acciaccaturas approach from both directions in isolation and context',()=>{
  for(const [level,id] of [['N5','ornament-grace-note'],['H','ornament-acciaccatura'],['AH','ornament-acciaccatura']]) {
    const isolated=new Set(),contextual=new Set();
    for(let run=0;run<160;run++) {
      const q=api.prepareQuestion(api.buildOrnamentQuestion(level,[id],id));
      isolated.add(Math.sign(q.notes[0].midi-q.notes[1].midi));
      const events=api.ornamentPlaybackNotes(q.passage,.75);
      for(let index=0;index<events.length;index++)if(events[index].ornament===id&&events[index].gateRelease) {
        contextual.add(Math.sign(events[index].midi-events[index+1].midi));
        assert.ok(events[index].beats*.75<=.0650001);
        assert.ok(events[index].midi>=57&&events[index].midi<=84);
      }
    }
    assert.deepEqual([...isolated].sort(),[-1,1]);
    assert.deepEqual([...contextual].sort(),[-1,1]);
  }
});

test('Higher and AH ornaments inherit the eight-bar native-metre study with distinct ornament shapes',()=>{
  const levels={H:['ornament-acciaccatura','ornament-trill','ornament-mordent'],AH:['ornament-acciaccatura','ornament-trill','ornament-mordent','ornament-turn','ornament-appoggiatura']};
  const keys=new Set(),metres=new Set(),graceDirections=new Set();
  for(const [level,ids] of Object.entries(levels))for(const id of ids)for(let run=0;run<100;run++) {
    const q=api.prepareQuestion(api.buildOrnamentQuestion(level,ids,id)),p=q.passage;
    assert.equal(p.bars.length,8);assert.ok([2,3].includes(p.ornamentCount),`${level} ${id}: ${p.ornamentCount}`);
    keys.add(p.key.id);metres.add(p.timeSignature.id);
    assert.ok(p.bars[0].notes.every(n=>!n.ornament)&&p.bars[7].notes.every(n=>!n.ornament));
    for(const bar of p.bars) {
      assert.ok(Math.abs(bar.notes.reduce((s,n)=>s+n.beats,0)-p.timeSignature.beats)<1e-8);
      assert.ok(bar.notes.every(n=>n.beats>0&&n.midi>=57&&n.midi<=84));
      const decorated=Array.from(bar.notes).filter(n=>n.ornament);
      if(!decorated.length)continue;
      const main=decorated.at(-1).midi;
      if(id==='ornament-mordent') {assert.equal(decorated.length,3);assert.equal(decorated[0].midi,main);assert.ok(decorated[1].midi<main);}
      if(id==='ornament-turn') {assert.equal(decorated.length,4);assert.ok(decorated[0].midi>main);assert.equal(decorated[1].midi,main);assert.ok(decorated[2].midi<main);}
      if(id==='ornament-acciaccatura')graceDirections.add(Math.sign(decorated[0].midi-main));
      if(id==='ornament-appoggiatura') {
        assert.equal(decorated.length,2);assert.ok(decorated[0].midi>main);assert.ok(decorated[0].volume>decorated[1].volume);
        const anchor=p.ornamentSourceBars[bar.barIndex].notes.find(n=>Math.abs(n.beat-decorated[0].beat)<1e-8),pulse=p.tempoPulseBeats;
        const dotted=[1.5,3].some(v=>Math.abs(anchor.beats/pulse-v)<1e-8);
        assert.ok(Math.abs(decorated[0].beats/anchor.beats-(dotted?2/3:.5))<1e-8);
        assert.ok(Math.abs(anchor.beat/pulse-Math.round(anchor.beat/pulse))<1e-8);
      }
    }
    for(const content of [q,p])for(const bpm of [60,80,100]) {
      const beat=60/bpm/(content.tempoPulseBeats||1),events=api.ornamentPlaybackNotes(content,beat);
      assert.ok(events.every(n=>n.beats>0&&n.midi>=57&&n.midi<=84));
      events.slice(0,-1).forEach((n,i)=>assert.ok(n.beat+n.beats<=events[i+1].beat+1e-8));
      assert.ok(Math.abs(events.at(-1).beat+events.at(-1).beats-content.totalBeats)<1e-8);
      if(id==='ornament-mordent'||id==='ornament-turn')assert.ok(events.filter(n=>n.gateRelease).every(n=>n.beats*beat<=(id==='ornament-mordent'?.090001:.120001)));
    }
    const example=api.ornamentReplayExample(p);assert.ok(example&&example.notes.every(n=>n.ornament===id));
  }
  assert.equal(keys.size,8);assert.equal(metres.size,4);assert.deepEqual(graceDirections,new Set([-1,1]));
});
