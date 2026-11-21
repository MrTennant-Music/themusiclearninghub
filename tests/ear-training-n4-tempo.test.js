const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
global.window={MLH:{useClickOutside(){}}};
window.PracticeMelodyGenerator=require('../practice-melody-generator.js');
require('../aural-accompaniment.js');
require('../melodic-dictation-generator.js');
const core=require('../ear-training-exercises.js');
require('../ear-training-piano-concepts.js');
require('../time-signatures-listening.js');
require('../tempo-changes-listening.js');
require('../aural-tonalities.js');
const clockApi=window.MLH.TempoChangesListening;
const tempos={'tempo-adagio':60,'tempo-andante':80,'tempo-allegro':100};

function checkPhrase(q) {
  assert.equal(q.bars.length,8);
  assert.equal(q.totalBeats,8*q.timeSignature.beats);
  assert.equal(q.tempoClearOpeningBars,2);
  assert.equal(q.tempoPhraseLength,4);
  assert.equal(q.tempoCadence,'perfect');
  const pulse=q.tempoPulseBeats;
  assert.equal(pulse,q.timeSignature.type==='compound'?1.5:1);
  for(const bar of q.bars) {
    assert.equal(bar.notes.reduce((sum,n)=>sum+n.beats,0),q.timeSignature.beats);
    assert.equal(bar.accompaniment.length,q.timeSignature.beats/pulse);
    assert.ok(bar.accompaniment.every((event,index)=>event.beat===index*pulse&&event.beats<=pulse&&event.pitches.every(pitch=>pitch>=45)));
    assert.ok(bar.notes.every(n=>(n.soundingMidi??n.midi)>=57&&(n.soundingMidi??n.midi)<=84));
    if(bar.barIndex<2) assert.ok(bar.notes.every(n=>!n.rest&&n.beats===pulse),'opening exposes the beat before subdivisions appear');
    else if(bar.barIndex<7) assert.ok(bar.notes.every(n=>n.beats>=pulse/2));
  }
  assert.ok(['V','V7'].includes(q.bars.at(-2).chordSymbol));
  assert.equal(q.bars.at(-1).chordSymbol,'I');
  assert.equal(q.bars.at(-1).notes.length,1);
  assert.equal(q.bars.at(-1).notes[0].beats,q.timeSignature.beats);
}

test('N4 steady tempo includes Andante and uses the clear N3 eight-bar pulse form',()=>{
  const keys=new Set(),metres=new Set(),styles=new Set();
  for(const [answerId,bpm] of Object.entries(tempos)) for(let run=0;run<160;run++) {
    const q=core.buildQuestion({level:'N4',topic:'steadyTempo',answerId,options:Object.keys(tempos),mode:'choice'});
    checkPhrase(q);
    assert.equal(q.playbackTempo.bpm,bpm);
    assert.equal(q.tempoExcerptBars,8);
    assert.equal(q.melodyPlan.validation.accepted,true);
    q.bars.forEach((bar,index)=>assert.deepEqual(q.melodyPlan.bars[index].notes,bar.notes));
    keys.add(q.key.id);metres.add(q.timeSignature.id);styles.add(q.accompanimentPattern);
  }
  assert.equal(keys.size,8);
  assert.deepEqual(metres,new Set(['2/4','3/4','4/4','6/8']));
  assert.deepEqual(styles,new Set(['pulse-chords','alternating-bass-chords']));
});

test('N4 accelerando and rallentando retain native pulse patterns and steady opening/closing sections',()=>{
  let source=fs.readFileSync(require('node:path').join(__dirname,'../generated-runtimes/auralrecognition-1.js'),'utf8');
  source=source.slice(0,source.lastIndexOf('const root=document.getElementById'))+';this.api={buildTempoChangesQuestion,prepareQuestion,conceptIdsForLevel};';
  const context=vm.createContext({window,React:{createElement(){return{}},Fragment:{}},URLSearchParams,location:{search:'',href:'http://localhost/auralrecognition.html'}});
  vm.runInContext(source,context);
  for(const answerId of ['accelerando','rallentando']) for(let run=0;run<160;run++) {
    const q=context.api.prepareQuestion(context.api.buildTempoChangesQuestion('N4',context.api.conceptIdsForLevel('N4'),answerId));
    checkPhrase(q);
    assert.equal(q.answerId,answerId);
    assert.equal(q.generationVariation.timeSignature,q.timeSignature.id);
    const clock=clockApi.createTempoClock({startBpm:80*q.tempoPulseBeats,direction:q.answer.direction,totalBeats:q.totalBeats,steadyEnds:true});
    const opening=2*q.timeSignature.beats,closing=6*q.timeSignature.beats;
    assert.equal(clock.bpmAtBeat(0),clock.bpmAtBeat(opening));
    assert.equal(clock.bpmAtBeat(closing),clock.bpmAtBeat(q.totalBeats));
    assert.equal(clock.bpmAtBeat(0)/q.tempoPulseBeats,80,'Andante uses the heard pulse in compound time');
    for(const bar of q.bars) for(const note of bar.notes) {
      const at=bar.barIndex*q.timeSignature.beats+note.beat;
      assert.ok(clock.durationAtBeat(at,note.beats)>0);
      assert.ok(clock.timeAtBeat(at)+clock.durationAtBeat(at,note.beats)<=clock.duration+1e-8);
    }
  }
});

test('N4 tempo weights steady questions 75 percent and honours single-family customisation',()=>{
  let source=fs.readFileSync(require('node:path').join(__dirname,'../generated-runtimes/auralrecognition-1.js'),'utf8');
  source=source.slice(0,source.lastIndexOf('const root=document.getElementById'))+';this.api={buildQuestion,conceptIdsForLevel,chooseQuestionFamily};';
  const context=vm.createContext({window,React:{createElement(){return{}},Fragment:{}},URLSearchParams,location:{search:'',href:'http://localhost/auralrecognition.html'}});
  vm.runInContext(source,context);
  const api=context.api,counts={};
  for(let run=0;run<400;run++) {
    const q=api.buildQuestion('N4',api.conceptIdsForLevel('N4'),'steadyTempo');
    counts[q.answerId]=(counts[q.answerId]||0)+1;
  }
  assert.deepEqual(counts,{'tempo-adagio':100,'tempo-andante':100,'tempo-allegro':100,accelerando:50,rallentando:50});
  for(const [ids,family] of [[Object.keys(tempos),'steadyTempo'],[['accelerando','rallentando'],'tempoChanges']]) for(let run=0;run<16;run++) {
    assert.equal(api.buildQuestion('N4',ids,'steadyTempo').type,family);
  }
  for(const level of ['N3','N5','H','AH']) {
    const totals={steadyTempo:0,tempoChanges:0};
    for(let run=0;run<40;run++) totals[api.chooseQuestionFamily(level,'steadyTempo',['steadyTempo','tempoChanges'])]++;
    assert.deepEqual(totals,level==='N5'?{steadyTempo:30,tempoChanges:10}:{steadyTempo:20,tempoChanges:20},'N5 inherits the weighting while later levels retain their existing balance');
  }
});
