const test=require('node:test');const assert=require('node:assert/strict');
global.window={MLH:{}};window.PracticeMelodyGenerator=require('../practice-melody-generator.js');require('../aural-accompaniment.js');const core=require('../ear-training-exercises.js');
const relative={C:'Am',G:'Em',D:'Bm',F:'Dm',Bb:'Gm',Am:'C',Em:'G',Dm:'F'};
const pc=n=>((n%12)+12)%12;
test('N4 and N5 key changes include relative major/minor with prepared cadences in every metre',()=>{
  for(const level of ['N4','N5'])for(const start of core.keysForLevel(level))for(const signature of core.variedSignaturesForLevel(level)) {
    const heard=new Set();
    for(let run=0;run<8;run++) {
      const q=core.withGenerationContext({level,topic:level==='N4'?'changeOfKey':'modulation'},variation=>{
        variation.keyName=start;variation.signature=signature;
        return core.makeN4HarmonicPassage('changeOfKey',true);
      });
      heard.add(q.keyChange.to);
      const destination=core.keys[q.keyChange.to];
      assert.equal(q.keyChange.from,start);assert.equal(q.bars.length,8);
      assert.ok(q.bars.slice(4).every(bar=>bar.keyId===destination.id));
      assert.equal(q.bars[7].chordSymbol,'I');
      assert.equal(pc(q.bars[7].notes[0].midi),pc(destination.tonic));
      const bridge=q.bars[3];
      assert.deepEqual(bridge.accompanimentHarmony[1].pitches,destination.chords.V7);
      assert.equal(pc(bridge.notes.at(-1).midi),pc(destination.tonic-1));
      assert.equal(pc(q.bars[4].notes[0].midi),pc(destination.tonic));
      for(const [a,b] of [[0,4],[1,5]]) {
        assert.deepEqual(q.bars[a].notes.map(n=>n.beats),q.bars[b].notes.map(n=>n.beats));
        assert.deepEqual(q.bars[a].notes.map(n=>n.relativeStep),q.bars[b].notes.map(n=>n.relativeStep));
      }
      for(const bar of q.bars) {
        assert.ok(Math.abs(bar.notes.reduce((sum,n)=>sum+n.beats,0)-signature.beats)<1e-8);
        assert.ok(bar.notes.every(n=>n.midi>=57&&n.midi<=84));
        assert.ok(bar.accompaniment.every(e=>e.pitches.every(n=>n>=45)&&e.beat+e.beats<=signature.beats+1e-8));
      }
      if(q.keyChange.to===relative[start])assert.equal(q.keyChange.relationship,start.endsWith('m')?'relative-major':'relative-minor');
    }
    assert.ok(heard.has(relative[start]),`${start} reaches its relative key in ${signature.id}`);
  }
});
test('relative destinations do not expand the opening key pool or alter no-change questions',()=>{
  assert.equal(core.keysForLevel('N5').length,8);assert.ok(!core.keysForLevel('N5').includes('Bm'));assert.ok(!core.keysForLevel('N5').includes('Gm'));
  for(let i=0;i<32;i++) {
    const q=core.buildQuestion({level:'N5',topic:'modulation',answerId:'modulation-no',options:['modulation-yes','modulation-no'],mode:'choice'});
    assert.equal(q.keyChange.from,q.keyChange.to);assert.equal(q.keyChange.relationship,'same-key');
  }
});
