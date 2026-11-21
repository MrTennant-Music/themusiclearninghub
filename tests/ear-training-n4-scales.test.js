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
const types=['scale-major','scale-minor','scale-pentatonic'];
const pc=midi=>((midi%12)+12)%12;

test('N4 scale excerpts expose their complete pitch collection in every native metre',()=>{
  for(const answerId of types) for(const signature of core.variedSignaturesForLevel('N4')) {
    const keys=core.keysForLevel('N4').filter(id=>answerId==='scale-minor'?id.endsWith('m'):!id.endsWith('m'));
    for(const keyId of keys) for(let run=0;run<12;run++) {
      let tonicMidi=core.keys[keyId].tonic;while(tonicMidi<60)tonicMidi+=12;
      const q=core.makeN4ScalePassage({answerId,keyId,tonicMidi,signature});
      assert.equal(q.bars.length,8);assert.equal(q.timeSignature.id,signature.id);
      assert.equal(q.totalBeats,8*signature.beats);
      assert.equal(q.scaleNativeMetre,true);
      const expected=new Set(q.scalePitchClasses);
      const heard=new Set(q.bars.flatMap(bar=>bar.notes.map(note=>pc(note.midi))));
      assert.deepEqual(heard,expected,'every scale degree is heard, without foreign notes');
      for(const [opening,recall] of [[0,4],[1,5]]) assert.deepEqual(q.bars[opening].notes.map(note=>[note.scaleDegree,note.beats]),q.bars[recall].notes.map(note=>[note.scaleDegree,note.beats]));
      assert.equal(q.bars[0].notes[0].midi,tonicMidi);
      assert.equal(q.bars.at(-1).notes.length,1);
      assert.equal(q.bars.at(-1).notes[0].midi,tonicMidi);
      assert.equal(q.bars.at(-1).notes[0].beats,signature.beats);
      const melody=q.bars.flatMap(bar=>bar.notes);
      assert.ok(melody.slice(1).every((note,index)=>Math.abs(note.midi-melody[index].midi)<=7),'phrases avoid abrupt leaps across barlines');
      for(const bar of q.bars) {
        assert.equal(bar.notes.reduce((sum,note)=>sum+note.beats,0),signature.beats);
        assert.ok(bar.notes.every(note=>note.midi>=57&&note.midi<=84));
        assert.deepEqual(q.melodyPlan.bars[bar.barIndex].notes,bar.notes);
        for(const segment of bar.accompanimentHarmony) assert.ok(segment.pitches.every(pitch=>expected.has(pc(pitch))),'pentatonic harmony also stays in the five-note collection');
        for(const event of bar.accompaniment) {
          assert.ok(event.beat>=0&&event.beats>0&&event.beat+event.beats<=signature.beats);
          assert.ok(event.pitches.every(pitch=>pitch>=45&&expected.has(pc(pitch))));
          const overlaps=bar.notes.filter(note=>note.beat<event.beat+event.beats-1e-8&&note.beat+note.beats>event.beat+1e-8);
          assert.ok(overlaps.every(note=>event.pitches.every(pitch=>![1,6,11].includes(pc(note.midi-pitch)))),'accompaniment never hangs over an exposed melody clash');
        }
      }
    }
  }
});

test('N4 isolated scales ascend and descend and context retains its native metre after preparation',()=>{
  let source=fs.readFileSync(require('node:path').join(__dirname,'../generated-runtimes/auralrecognition-1.js'),'utf8');
  source=source.slice(0,source.lastIndexOf('const root=document.getElementById'))+';this.scaleApi={buildScaleQuestion,prepareQuestion,SCALE_TYPES,conceptIdsForLevel};';
  const context=vm.createContext({window,React:{createElement(){return{}},Fragment:{}},URLSearchParams,location:{search:'',href:'http://localhost/auralrecognition.html'}});
  vm.runInContext(source,context);
  const api=context.scaleApi;
  for(const level of ['N4','N5','H','AH']) for(let run=0;run<24;run++) {
    const q=api.buildScaleQuestion(level,api.conceptIdsForLevel(level),'scale-pentatonic');
    assert.ok(!q.keyId.endsWith('m'),'pentatonic questions use major keys at every level');
    assert.deepEqual(Array.from(q.notes,note=>note.midi-q.tonicMidi),[0,2,4,7,9,12,9,7,4,2,0],'only major pentatonic ascends and descends');
    const allowed=new Set([0,2,4,7,9]);
    assert.ok(Array.from(q.passage.bars).every(bar=>Array.from(bar.notes).every(note=>allowed.has(pc(note.midi-q.tonicMidi)))),'context also stays major pentatonic');
  }
  for(const answerId of types) {
    const directions=new Set(),metres=new Set();
    for(let run=0;run<48;run++) {
      const raw=api.buildScaleQuestion('N4',api.conceptIdsForLevel('N4'),answerId);
      const signature=raw.passage.timeSignature.id;
      const q=api.prepareQuestion(raw);
      directions.add(q.isolatedDirection);metres.add(signature);
      assert.equal(q.passage.timeSignature.id,signature);
      assert.equal(q.passage.bars.length,8);
      const ascending=Array.from(api.SCALE_TYPES[answerId].ascending),descending=[...ascending].reverse();
      const expected=q.isolatedDirection==='ascending'?ascending:q.isolatedDirection==='descending'?descending:[...ascending,...descending.slice(1)];
      assert.deepEqual(Array.from(q.notes,note=>note.midi-q.tonicMidi),expected);
      assert.ok(Array.from(q.notes).every(note=>note.midi>=57&&note.midi<=84));
      assert.ok([0,12].includes(q.notes.at(-1).midi-q.tonicMidi));
      assert.equal(q.notes.at(-1).beats,4);
    }
    assert.deepEqual(directions,new Set(['both']));
    assert.deepEqual(metres,new Set(['2/4','3/4','4/4','6/8']));
  }
});
