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
const pc=midi=>((midi%12)+12)%12;

test('N4 major and minor establish their third, recall their motif and cadence in native eight-bar phrases',()=>{
  let source=fs.readFileSync(require('node:path').join(__dirname,'../generated-runtimes/auralrecognition-1.js'),'utf8');
  source=source.slice(0,source.lastIndexOf('const root=document.getElementById'))+';this.api={buildTonalityQuestion,buildQuestion,prepareQuestion,conceptIdsForLevel};';
  const context=vm.createContext({window,React:{createElement(){return{}},Fragment:{}},URLSearchParams,location:{search:'',href:'http://localhost/auralrecognition.html'}});
  vm.runInContext(source,context);
  const api=context.api,profiles=[];
  for(const answerId of ['major','minor']) {
    const keys=new Set(),distribution={};
    for(let run=0;run<240;run++) {
      const raw=api.buildTonalityQuestion('N4',api.conceptIdsForLevel('N4'),answerId);
      const q=api.prepareQuestion(raw),beats=q.timeSignature.beats;
      assert.equal(q.bars.length,8);assert.equal(q.totalBeats,8*beats);
      assert.equal(q.tonalityNativeMetre,true);
      assert.equal(q.timeSignature.id,raw.timeSignature.id);
      assert.equal(q.tempoPulseBeats,q.timeSignature.pulseQuarterBeats);
      assert.equal(q.key.id.endsWith('m'),answerId==='minor');keys.add(q.key.id);
      const profile=[q.timeSignature.id,q.playbackTempo.bpm,q.accompanimentPattern].join('/');distribution[profile]=(distribution[profile]||0)+1;
      const third=pc(q.tonicMidi+(answerId==='minor'?3:4));
      assert.equal(q.bars[0].notes[0].midi,q.tonicMidi);
      assert.ok(q.bars[0].notes.some(n=>pc(n.midi)===third));
      assert.ok(q.bars[0].accompaniment[0].pitches.some(pitch=>pc(pitch)===third));
      for(const [opening,recall] of [[0,4],[1,5]]) assert.deepEqual(q.bars[opening].notes.map(n=>[n.midi,n.beats]),q.bars[recall].notes.map(n=>[n.midi,n.beats]));
      assert.equal(q.bars[6].chordSymbol,'V');assert.equal(q.bars[7].chordSymbol,'I');
      assert.equal(q.bars[6].notes.at(-1).midi,q.tonicMidi-1);
      assert.equal(q.bars[7].notes.length,1);assert.equal(q.bars[7].notes[0].midi,q.tonicMidi);assert.equal(q.bars[7].notes[0].beats,beats);
      for(const bar of q.bars) {
        assert.equal(bar.notes.reduce((sum,n)=>sum+n.beats,0),beats);
        assert.ok(bar.notes.every(n=>n.midi>=57&&n.midi<=84));
        assert.deepEqual(q.melodyPlan.bars[bar.barIndex].notes,bar.notes);
        if(answerId==='minor') for(let index=1;index<bar.notes.length;index++) {
          const a=bar.notes[index-1],b=bar.notes[index];
          assert.ok(!(Math.abs(a.scaleDegree-b.scaleDegree)===1&&Math.abs(a.midi-b.midi)===3),'no melodic augmented seconds');
        }
        for(const event of bar.accompaniment) {
          assert.ok(event.beat>=0&&event.beats>0&&event.beat+event.beats<=beats+1e-8);
          assert.ok(event.pitches.every(pitch=>pitch>=45));
          const sounding=bar.notes.filter(n=>n.beat<event.beat+event.beats-1e-8&&n.beat+n.beats>event.beat+1e-8);
          assert.ok(sounding.every(n=>event.pitches.every(pitch=>![1,6,11].includes(pc(n.midi-pitch)))));
        }
      }
    }
    assert.equal(keys.size,answerId==='major'?5:3);
    assert.equal(Object.keys(distribution).length,24,'every metre, tempo and accompaniment combination appears');
    profiles.push(distribution);
  }
  assert.deepEqual(profiles[0],profiles[1],'tempo, metre and texture do not reveal major versus minor');
  const answers={major:0,minor:0};
  for(let run=0;run<100;run++) answers[api.buildQuestion('N4',api.conceptIdsForLevel('N4'),'tonality').answerId]++;
  assert.deepEqual(answers,{major:50,minor:50});
  for(const level of ['N5','H','AH']) for(const answerId of ['major','minor']) assert.equal(window.MLH.AuralTonalities.buildMelody(answerId,level).bars.length,8);
});
