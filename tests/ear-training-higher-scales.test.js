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

test('Higher scale contexts inherit N5 phrasing and demonstrate both minor forms accurately',()=>{
  const directions={ascending:[0,2,3,5,7,9,11,12],descending:[12,10,8,7,5,3,2,0]};
  for(const signature of core.variedSignaturesForLevel('H'))for(const keyId of ['Am','Em','Dm'])for(const answerId of ['scale-melodic-minor','scale-harmonic-minor'])for(let run=0;run<30;run++) {
    let tonicMidi=core.keys[keyId].tonic;while(tonicMidi<60)tonicMidi+=12;
    const q=core.makeHigherScalePassage({answerId,keyId,tonicMidi,signature});
    assert.equal(q.bars.length,8);assert.equal(q.totalBeats,8*signature.beats);assert.equal(q.scaleId,answerId);
    for(const bar of q.bars) {
      assert.ok(Math.abs(bar.notes.reduce((sum,n)=>sum+n.beats,0)-signature.beats)<1e-8);
      assert.ok(bar.notes.every(n=>n.midi>=57&&n.midi<=84));
      for(const event of bar.accompaniment) {
        assert.ok(event.beat+event.beats<=signature.beats+1e-8);
        assert.ok(event.pitches.every(p=>p>=45));
        const overlaps=bar.notes.filter(n=>n.beat<event.beat+event.beats-1e-8&&n.beat+n.beats>event.beat+1e-8);
        assert.ok(overlaps.every(n=>event.pitches.every(p=>![1,6,11].includes(((n.midi-p)%12+12)%12))));
      }
      if(bar.scaleDirection) assert.deepEqual(bar.notes.map(n=>n.midi-tonicMidi),directions[bar.scaleDirection]);
    }
    if(answerId==='scale-harmonic-minor')assert.deepEqual(new Set(q.notes.map(n=>((n.midi-tonicMidi)%12+12)%12)),new Set([0,2,3,5,7,8,11]));
    else {
      assert.deepEqual(q.bars[0].notes.map(n=>[n.midi,n.beats]),q.bars[4].notes.map(n=>[n.midi,n.beats]));
      assert.equal(q.bars.filter(b=>b.scaleDirection==='ascending').length,2);
      assert.equal(q.bars.filter(b=>b.scaleDirection==='descending').length,2);
    }
    assert.equal(q.notes.at(-1).midi,tonicMidi);
  }
});

test('Higher isolated minor scales use the correct round-trip forms and native contexts',()=>{
  let source=fs.readFileSync('generated-runtimes/auralrecognition-1.js','utf8');
  source=source.slice(0,source.lastIndexOf('const root=document.getElementById'))+';this.api={buildScaleQuestion,prepareQuestion,conceptIdsForLevel};';
  const context=vm.createContext({window,React:{createElement(){return{}},Fragment:{}},URLSearchParams,location:{search:'',href:'http://localhost/auralrecognition.html'}});vm.runInContext(source,context);
  const api=context.api,metres=new Set();
  for(const answerId of ['scale-major','scale-pentatonic','scale-chromatic','scale-whole-tone','scale-melodic-minor','scale-harmonic-minor'])for(let run=0;run<32;run++) {
    const q=api.prepareQuestion(api.buildScaleQuestion('H',api.conceptIdsForLevel('H'),answerId));
    assert.equal(q.passage.bars.length,8);metres.add(q.passage.timeSignature.id);
    assert.ok(q.notes.every(n=>n.midi>=57&&n.midi<=84));
    if(answerId==='scale-melodic-minor')assert.deepEqual(Array.from(q.notes,n=>n.midi-q.tonicMidi),[0,2,3,5,7,9,11,12,10,8,7,5,3,2,0]);
    if(answerId==='scale-harmonic-minor')assert.deepEqual(Array.from(q.notes,n=>n.midi-q.tonicMidi),[0,2,3,5,7,8,11,12,11,8,7,5,3,2,0]);
    assert.equal(q.notes.at(-1).beats,4);
  }
  assert.equal(metres.size,4);
});
