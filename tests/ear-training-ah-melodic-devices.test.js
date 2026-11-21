const test=require('node:test'),assert=require('node:assert/strict');
global.window={MLH:{}};
window.PracticeMelodyGenerator=require('../practice-melody-generator.js');
require('../aural-accompaniment.js');require('../melodic-dictation-generator.js');
const core=require('../ear-training-exercises.js');require('../ear-training-piano-concepts.js');
const ids=['transform-inversion','transform-retrograde'];
const degrees=bar=>bar.notes.map(note=>note.rest?null:note.relativeStep);
const rhythms=bar=>bar.notes.map(note=>note.beats);
test('AH inversion and retrograde preserve their exact motif through harmony, isolation and cadence',()=>{
  const keys=new Set(),metres=new Set(),shapes=new Set();
  for(const answerId of ids)for(let run=0;run<240;run++) {
    const q=core.buildQuestion({level:'AH',topic:'melodicTransformation',answerId,options:ids,mode:'choice'});
    keys.add(q.key.id);metres.add(q.timeSignature.id);shapes.add(JSON.stringify([answerId,q.transformationMotif,q.transformationDurations]));
    assert.equal(q.bars.length,8);assert.equal(q.totalBeats,8*q.timeSignature.beats);
    const motif=degrees(q.bars[0]),rhythm=rhythms(q.bars[0]),axis=motif.find(value=>value!==null);
    assert.ok(new Set(motif.filter(value=>value!==null)).size>=3);
    const expected=answerId==='transform-retrograde'?[...motif].reverse():motif.map(value=>value===null?null:2*axis-value);
    const expectedRhythm=answerId==='transform-retrograde'?[...rhythm].reverse():rhythm;
    assert.notDeepEqual([motif,rhythm],[expected,expectedRhythm]);
    q.transformationStatements.forEach((kind,index)=>{
      assert.deepEqual(degrees(q.bars[index]),kind==='original'?motif:expected);
      assert.deepEqual(rhythms(q.bars[index]),kind==='original'?rhythm:expectedRhythm);
      const chord=new Set(q.key.chords[q.bars[index].chordSymbol].map(midi=>midi%12));
      q.bars[index].notes.forEach(note=>{
        const strong=q.timeSignature.id==='6/8'?[0,1.5].includes(note.beat):Number.isInteger(note.beat);
        if(strong&&!note.rest)assert.ok(chord.has(note.midi%12),'strong notes fit harmony without changing the transformation');
      });
    });
    assert.deepEqual(q.bars.slice(-2).map(bar=>bar.chordSymbol),['V','I']);
    assert.equal(q.bars.at(-1).notes.length,1);
    assert.equal((q.bars.at(-1).notes[0].midi-q.key.tonic)%12,0);
    q.bars.forEach(bar=>{
      assert.ok(Math.abs(bar.notes.reduce((sum,n)=>sum+n.beats,0)-q.timeSignature.beats)<1e-8);
      bar.notes.filter(n=>!n.rest).forEach(n=>assert.ok(n.midi>=57&&n.midi<=84));
      bar.accompaniment.forEach(e=>{assert.ok(e.beat>=0&&e.beats>0&&e.beat+e.beats<=q.timeSignature.beats+1e-8);e.pitches.forEach(n=>assert.ok(n>=45));});
    });
    assert.equal(q.isolatedPassage.bars.length,4);
    q.isolatedPassage.bars.forEach((bar,index)=>{assert.deepEqual(degrees(bar),degrees(q.bars[index]));assert.deepEqual(rhythms(bar),rhythms(q.bars[index]));assert.equal(bar.accompaniment.length,0);});
  }
  assert.equal(keys.size,8);assert.equal(metres.size,4);assert.ok(shapes.size>100,'fresh contours and rhythms, independent of key');
});
