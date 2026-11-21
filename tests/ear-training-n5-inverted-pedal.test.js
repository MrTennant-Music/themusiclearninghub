const test=require('node:test');
const assert=require('node:assert/strict');
global.window={MLH:{}};
window.PracticeMelodyGenerator=require('../practice-melody-generator.js');
require('../aural-accompaniment.js');
const core=require('../ear-training-exercises.js');require('../ear-training-piano-concepts.js');
test('N5 inverted pedal follows the N4 repeated pedal rhythm above the melody',()=>{
  const modes=new Map(),metres=new Set(),values=new Set();
  for(let run=0;run<400;run++) {
    const q=core.buildQuestion({level:'N5',topic:'accompanimentDevices',answerId:'device-inverted-pedal',options:['device-pedal','device-inverted-pedal'],mode:'choice'});
    modes.set(q.pedalOctaveAlternation,(modes.get(q.pedalOctaveAlternation)||0)+1);
    metres.add(q.timeSignature.id);values.add(q.pedalNoteBeats);
    const top=Math.max(...q.notes.filter(n=>!n.rest).map(n=>n.soundingMidi??n.midi));
    const events=q.bars.flatMap(bar=>bar.accompaniment.filter(e=>e.role==='inverted-pedal'));
    assert.equal(events.length,8*q.timeSignature.beats/q.pedalNoteBeats);
    events.forEach((e,index)=>{
      assert.equal(e.pitches.length,1);assert.ok(e.pitches[0]>top);assert.ok(e.pitches[0]<=108);
      assert.equal(e.pitches[0],q.pedalPitch+(q.pedalOctaveAlternation&&index%2?12:0));
      assert.equal(e.beats,.88*q.pedalNoteBeats);
      assert.ok(Math.abs(e.volume*.018-.078*.82*.8)<1e-10);
    });
    q.bars.forEach(bar=>assert.deepEqual(bar.accompaniment.filter(e=>e.role==='inverted-pedal').map(e=>e.beat),Array.from({length:q.timeSignature.beats/q.pedalNoteBeats},(_,i)=>i*q.pedalNoteBeats)));
    assert.ok(new Set(q.bars.map(bar=>bar.chordSymbol)).size>1);
    assert.equal(q.harmonicExcerptBars,8);assert.equal(q.harmonicCadence,'perfect');
  }
  assert.equal(modes.get(true),100);assert.equal(modes.get(false),300);
  assert.equal(metres.size,4);assert.deepEqual([...values].sort(),[.5,1]);
});
test('N4 bass pedals keep their single repeated pitch',()=>{
  for(let run=0;run<80;run++) {
    const q=core.buildQuestion({level:'N4',topic:'accompanimentDevices',answerId:'device-pedal',options:['device-pedal','device-no-pedal'],mode:'choice'});
    assert.ok(q.bars.flatMap(b=>b.accompaniment.filter(e=>e.role==='pedal')).every(e=>e.pitches[0]===q.pedalPitch));
    assert.equal(q.pedalOctaveAlternation,undefined);
  }
});
