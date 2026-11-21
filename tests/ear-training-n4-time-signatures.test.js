const test=require('node:test');
const assert=require('node:assert/strict');
global.window={MLH:{}};
window.PracticeMelodyGenerator=require('../practice-melody-generator.js');
require('../aural-accompaniment.js');
require('../time-signatures-listening.js');
const api=window.MLH.TimeSignaturesListening;

test('N4 time listening inherits the eight-bar form and clear opening in simple and compound time',()=>{
  for(const id of ['2/4','3/4','4/4','6/8']) for(const subdivisions of [false,true]) for(let run=0;run<50;run++) {
    const q=api.buildAdvancedHigherListeningMelody([id],{level:'N4',subdivisions});
    const signature=q.timeSignature,pulse=signature.pulseQuarterBeats;
    assert.equal(q.bars.length,8);
    assert.equal(q.totalBeats,8*signature.beats);
    assert.equal(q.clearOpeningBars,2);
    assert.equal(pulse,id==='6/8'?1.5:1);
    assert.ok(['V','V7'].includes(q.bars.at(-2).chordSymbol));
    assert.equal(q.bars.at(-1).chordSymbol,'I');
    for(const bar of q.bars) {
      assert.equal(bar.notes.reduce((sum,n)=>sum+n.beats,0),signature.beats);
      assert.ok(bar.notes.every(n=>n.rest||n.midi>=57&&n.midi<=84));
      const beats=bar.accompaniment.filter(event=>Math.abs(event.beat/pulse-Math.round(event.beat/pulse))<1e-8);
      assert.equal(beats.length,signature.pulseCount);
      assert.ok(beats.slice(1).every(event=>event.volume<beats[0].volume));
      if(id==='4/4') assert.ok(beats[2].volume>beats[1].volume&&beats[2].volume>beats[3].volume);
      if(bar.barIndex<2) assert.ok(bar.notes.every((n,index)=>!n.rest&&n.beat===index*pulse&&n.beats===pulse));
      assert.equal(bar.accompaniment.length,signature.pulseCount*(subdivisions?(id==='6/8'?3:2):1));
      for(const event of bar.accompaniment) {
        assert.ok(event.beat>=0&&event.beats>0&&event.beat+event.beats<=signature.beats+1e-8);
        assert.ok(event.pitches.every(pitch=>Number.isFinite(pitch)&&pitch>=45));
      }
      assert.deepEqual(q.melodyPlan.bars[bar.barIndex].notes,bar.notes);
      assert.ok(bar.notes.every(note=>!note.rest&&!note.tieToNext&&!note.tieFromPrevious),'N4 has no cross-beat ties, rests or syncopation');
      if(bar.barIndex<7) for(let pulseIndex=0;pulseIndex<signature.pulseCount;pulseIndex++) {
        const start=pulseIndex*pulse;
        const group=bar.notes.filter(note=>note.beat>=start-1e-8&&note.beat<start+pulse-1e-8);
        assert.ok(group.length===1||group.length===(id==='6/8'?3:2));
        assert.ok(group.every((note,index)=>Math.abs(note.beat-start-index*pulse/group.length)<1e-8&&Math.abs(note.beats-pulse/group.length)<1e-8));
      }
    }
  }
});

test('N4 metre comparisons share melody, harmony, key and beat speed across simple and compound time',()=>{
  const simpleMetres=new Set(),tempos=new Set(),keys=new Set();
  for(let run=0;run<100;run++) {
    const simple=api.buildN4MetreListeningMelody('simple');
    const compound=api.buildN4MetreListeningMelody('compound');
    assert.equal(simple.metreComparisonId,compound.metreComparisonId);
    assert.equal(simple.key.id,compound.key.id);
    assert.deepEqual(simple.playbackTempo,compound.playbackTempo);
    assert.equal(compound.timeSignature.id,'6/8');
    simpleMetres.add(simple.timeSignature.id);tempos.add(simple.playbackTempo.bpm);keys.add(simple.key.id);
    for(let index=0;index<8;index++) {
      const a=simple.bars[index],b=compound.bars[index];
      assert.equal(a.chordSymbol,b.chordSymbol);
      const anchors=q=>q.notes.filter(note=>Math.abs(note.beat/q.timeSignature.pulseQuarterBeats-Math.round(note.beat/q.timeSignature.pulseQuarterBeats))<1e-8).map(note=>note.midi);
      assert.deepEqual(anchors(a).slice(0,2),anchors(b).slice(0,2),'the familiar pulse melody remains recognisable');
      if(index>=2&&index<7) {
        assert.ok(a.notes.some(note=>note.beats===.5),'simple time divides into two');
        assert.ok(b.notes.some(note=>note.beats===.5),'compound time divides the longer pulse into three');
      }
    }
  }
  assert.deepEqual(simpleMetres,new Set(['2/4','3/4','4/4']));
  assert.deepEqual(tempos,new Set([60,80,100]));
  assert.equal(keys.size,8);
});
