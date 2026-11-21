const test=require('node:test');
const assert=require('node:assert/strict');
global.window={MLH:{}};
window.PracticeMelodyGenerator=require('../practice-melody-generator.js');
require('../aural-accompaniment.js');
const core=require('../ear-training-exercises.js');
require('../ear-training-piano-concepts.js');
const pc=midi=>((midi%12)+12)%12;

test('N5 two-part motion stays separated, consonant and smooth in every key and metre',()=>{
  for(const keyId of core.keysForLevel('N5')) for(const signature of core.variedSignaturesForLevel('N5')) for(const contrary of [true,false]) for(let run=0;run<10;run++) {
    const q=core.makeN5MotionPassage({keyId,signature,contrary}),voices=q.layers.map(layer=>layer.bars.flatMap(bar=>bar.notes));
    assert.equal(q.bars.length,8);assert.equal(q.totalBeats,8*signature.beats);
    assert.equal(q.tempoPulseBeats,signature.pulseQuarterBeats);
    assert.equal(q.motionVoicesSeparated,true);assert.equal(q.motionConsonant,true);
    assert.equal(voices[0].length,voices[1].length);
    for(let index=0;index<voices[0].length;index++) {
      const lower=voices[0][index],upper=voices[1][index],gap=upper.midi-lower.midi;
      assert.ok(lower.midi>=57&&upper.midi<=84);
      assert.ok(gap>=7&&gap<=24,'voices never cross or collapse into a unison');
      assert.ok([0,3,4,7,8,9].includes(gap%12),'every simultaneous interval is consonant');
      assert.equal(lower.beats,upper.beats);assert.equal(lower.beat,upper.beat);
      if(index) {
        const previousLower=voices[0][index-1],previousUpper=voices[1][index-1];
        const a=lower.midi-previousLower.midi,b=upper.midi-previousUpper.midi;
        assert.equal(Math.sign(a)*Math.sign(b),contrary?-1:1,'every movement demonstrates the requested relationship');
        assert.ok(Math.abs(a)<=7&&Math.abs(b)<=7);
        for(const [note,previous] of [[lower,previousLower],[upper,previousUpper]]) assert.ok(!(Math.abs(note.relativeStep-previous.relativeStep)===1&&Math.abs(note.midi-previous.midi)===3),'no augmented-second melodic steps');
      }
    }
    q.layers.forEach(layer=>layer.bars.forEach(bar=>{
      assert.equal(bar.notes.reduce((sum,n)=>sum+n.beats,0),signature.beats);
      assert.equal(bar.accompaniment.length,0);
      assert.deepEqual(layer.melodyPlan.bars[bar.barIndex].notes,bar.notes);
      const chord=new Set(q.key.chords[bar.chordSymbol].map(pc));
      for(const note of bar.notes) if(note.beat===0||(signature.id==='4/4'&&note.beat===2)) assert.ok(chord.has(pc(note.midi)),'strong beats support the harmonic phrase');
    }));
    assert.equal(q.bars[6].chordSymbol,'V');assert.equal(q.bars[7].chordSymbol,'I');
    assert.equal(q.bars[7].notes.length,1);
    assert.equal(pc(voices[1].at(-1).midi),pc(q.key.tonic));
  }
});

test('N5 contrary-motion paths vary within the same key and metre',()=>{
  for(const signature of core.variedSignaturesForLevel('N5')) {
    const melodies=new Set();
    for(let run=0;run<100;run++) {
      const q=core.makeN5MotionPassage({keyId:'C',signature,contrary:true});
      melodies.add(JSON.stringify(q.layers.map(layer=>layer.bars.map(bar=>bar.notes.map(n=>[n.midi,n.beats])))));
    }
    assert.ok(melodies.size>=20,`${signature.id} retains varied two-part paths`);
  }
});

test('N5 motion uses an exposed steady pulse and sustained directional gestures',()=>{
  for(const keyId of core.keysForLevel('N5'))for(const signature of core.variedSignaturesForLevel('N5'))for(let run=0;run<20;run++) {
    const q=core.makeN5MotionPassage({keyId,signature,contrary:true});
    const notes=q.layers[0].bars.flatMap(bar=>bar.notes);
    let direction=0,continued=0;
    for(let i=1;i<notes.length;i++) {
      const next=Math.sign(notes[i].midi-notes[i-1].midi);
      if(next===direction)continued++;
      direction=next;
    }
    assert.ok(continued>=3,'phrases contain multiple three-note or longer directional gestures');
    for(const layer of q.layers)for(const bar of layer.bars)if(![3,7].includes(bar.barIndex)) {
      assert.ok(bar.notes.every(note=>note.beats===signature.pulseQuarterBeats),'no distracting subdivisions');
    }
    assert.equal(q.layers[0].volume,q.layers[1].volume);
    assert.equal(Math.abs(q.layers[0].pan),.45);assert.equal(Math.abs(q.layers[1].pan),.45);
    assert.equal(q.layers[0].pan,-q.layers[1].pan);
  }
});

test('isolated motion uses tonic-to-tonic scales moving inwards or outwards',()=>{
  for(const keyId of core.keysForLevel('N5'))for(const contrary of [false,true])for(const direction of ['inwards','outwards']) {
    const q=core.makeIsolatedMotionScale({keyId,contrary,direction});
    const notes=q.layers.map(layer=>layer.notes);
    assert.equal(q.totalBeats,8);assert.equal(q.barCount,2);
    assert.equal(notes[0].length,8);assert.equal(notes[1].length,8);
    assert.ok(notes.every(voice=>voice.every(note=>note.beats===voice[0].beats)),"isolated scale notes have an even pulse from the opening tonic");
    const tonic=pc(q.key.tonic);
    for(const voice of notes) {
      assert.equal(pc(voice[0].midi),tonic);assert.equal(pc(voice.at(-1).midi),tonic);
      assert.ok(voice.every(n=>n.midi>=57&&n.midi<=84));
      assert.ok(voice.slice(1).every((n,i)=>Math.abs(n.relativeStep-voice[i].relativeStep)===1));
      assert.ok(q.layers.every(layer=>layer.bars.every(bar=>bar.accompaniment.length===0)));
    }
    for(let i=1;i<8;i++)assert.equal(Math.sign(notes[0][i].midi-notes[0][i-1].midi)*Math.sign(notes[1][i].midi-notes[1][i-1].midi),contrary?-1:1);
    if(contrary) {
      const firstGap=notes[1][0].midi-notes[0][0].midi,lastGap=notes[1][7].midi-notes[0][7].midi;
      assert.equal(firstGap,direction==='outwards'?0:24);
      assert.equal(lastGap,direction==='outwards'?24:0);
    }
  }
});
