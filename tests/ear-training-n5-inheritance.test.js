const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
global.window={MLH:{useClickOutside(){}}};
window.PracticeMelodyGenerator=require('../practice-melody-generator.js');
require('../aural-accompaniment.js');require('../melodic-dictation-generator.js');
const core=require('../ear-training-exercises.js');
require('../ear-training-piano-concepts.js');require('../time-signatures-listening.js');require('../tempo-changes-listening.js');require('../aural-tonalities.js');
let source=fs.readFileSync(require('node:path').join(__dirname,'../generated-runtimes/auralrecognition-1.js'),'utf8');
source=source.slice(0,source.lastIndexOf('const root=document.getElementById'))+';this.api={CONCEPTS,buildQuestion,buildScaleQuestion,buildTonalityQuestion,buildTempoChangesQuestion,prepareQuestion,availableConceptIdsForLevel};';
const context=vm.createContext({window,React:{createElement(){return{}},Fragment:{}},URLSearchParams,location:{search:'',href:'http://localhost/auralrecognition.html'}});
vm.runInContext(source,context);
const api=context.api,ids=api.availableConceptIdsForLevel('N5'),pc=midi=>((midi%12)+12)%12;
function build(id) {
  const family=api.CONCEPTS[id].family,options=Array.from(ids).filter(other=>api.CONCEPTS[other].family===family);
  const q=family==='scales'?api.buildScaleQuestion('N5',options,id):family==='tonality'?api.buildTonalityQuestion('N5',options,id):family==='tempoChanges'?api.buildTempoChangesQuestion('N5',options,id):core.buildQuestion({level:'N5',topic:family,answerId:id,options,mode:'choice'});
  return api.prepareQuestion(q);
}
const concepts=['major','minor','atonal','scale-major','scale-minor','scale-pentatonic','scale-chromatic','scale-whole-tone','direction-ascending','direction-descending','movement-step','movement-leap','motion-contrary','motion-no-contrary','device-pedal','device-no-pedal','device-inverted-pedal','vamp-yes','vamp-no','modulation-yes','modulation-no','tempo-adagio','tempo-andante','tempo-allegro','accelerando','rallentando','rubato'];

test('N5 inherits eight-bar writing while retaining every additional concept',()=>{
  for(const id of concepts) for(let run=0;run<100;run++) {
    const q=build(id),p=q.passage||q;
    if(id==='rallentando') assert.ok(['rallentando','ritardando'].includes(q.answerId));
    else assert.equal(q.answerId,id);
    assert.equal(p.bars.length,8,`${id} uses eight bars`);
    assert.equal(p.totalBeats,8*p.timeSignature.beats);
    assert.ok(['2/4','3/4','4/4','6/8'].includes(p.timeSignature.id));
    for(const layer of p.layers||[p]) for(const bar of layer.bars) {
      assert.ok(Math.abs(bar.notes.reduce((sum,n)=>sum+n.beats,0)-p.timeSignature.beats)<1e-8);
      assert.ok(bar.notes.every(n=>n.rest||(n.soundingMidi??n.midi)>=57&&(n.soundingMidi??n.midi)<=84));
      for(const event of bar.accompaniment||[]) {
        assert.ok(event.beat>=0&&event.beats>0&&event.beat+event.beats<=p.timeSignature.beats+1e-8);
        assert.ok(event.pitches.every(pitch=>Number.isFinite(pitch)&&pitch>=45));
      }
      assert.deepEqual(layer.melodyPlan.bars[bar.barIndex].notes,bar.notes,`${id} playback matches its note inventory`);
    }
    if(id.startsWith('scale-')) {
      const scales={'scale-major':[0,2,4,5,7,9,11],'scale-minor':[0,2,3,5,7,8,11],'scale-pentatonic':[0,2,4,7,9],'scale-chromatic':Array.from({length:12},(_,i)=>i),'scale-whole-tone':[0,2,4,6,8,10]};
      assert.deepEqual(new Set(Array.from(p.notes,n=>pc(n.midi-q.tonicMidi))),new Set(scales[id]));
      assert.equal(q.isolatedDirection,'both');
      assert.equal(q.notes.at(-1).beats,4);
      assert.equal(p.bars.at(-1).notes[0].midi,q.tonicMidi);
      assert.equal(p.bars.at(-1).notes.length,1);
      for(const [opening,recall] of [[0,4],[1,5]]) assert.deepEqual(p.bars[opening].notes.map(n=>[n.midi,n.beats]),p.bars[recall].notes.map(n=>[n.midi,n.beats]));
    }
    if(id==='device-inverted-pedal') {
      const events=p.bars.flatMap(bar=>bar.accompaniment.filter(event=>event.role==='inverted-pedal'));
      assert.ok(events.length>8);
      assert.equal(new Set(events.flatMap(event=>event.pitches)).size,p.pedalOctaveAlternation?2:1);
      events.forEach((event,index)=>assert.equal(event.pitches[0],p.pedalPitch+(p.pedalOctaveAlternation&&index%2?12:0)));
      assert.ok(events[0].pitches[0]>Math.max(...p.notes.filter(n=>!n.rest).map(n=>n.soundingMidi??n.midi)));
      assert.ok([1,.5].includes(p.pedalNoteBeats));
    }
    if(id.startsWith('motion-')) {
      assert.equal(p.motionDiatonic,true);
      const voices=p.layers.map(layer=>layer.bars.flatMap(bar=>bar.notes.filter(n=>!n.rest)));
      assert.ok([0,2,4].includes(((voices[1].at(-1).relativeStep%7)+7)%7),'the second voice also ends within the tonic harmony');
      for(let index=1;index<voices[0].length;index++) {
        const a=voices[0][index].midi-voices[0][index-1].midi,b=voices[1][index].midi-voices[1][index-1].midi;
        assert.equal(Math.sign(a)*Math.sign(b),a===0?0:id==='motion-contrary'?-1:1,'motion is audible between every pair of notes');
      }
    }
    if(id.startsWith('modulation-')) {
      assert.equal(p.keyChange.prepared,id==='modulation-yes');
      assert.equal(p.keyChange.pivotBarIndex,3);
      assert.equal(p.bars.at(-1).chordSymbol,'I');
    }
    if(['tempo-adagio','tempo-andante','tempo-allegro'].includes(id)) assert.equal(q.playbackTempo.bpm,{'tempo-adagio':60,'tempo-andante':80,'tempo-allegro':100}[id]);
    if(id==='rubato') assert.ok(q.rubatoProfile.length>2);
    if(id==='atonal') assert.equal(new Set(q.bars.flatMap(bar=>bar.notes.filter(n=>!n.rest).map(n=>pc(n.midi)))).size,12);
  }
});

test('N5 chromatic and whole-tone excerpts produce fresh rhythms and contours',()=>{
  for(const id of ['scale-chromatic','scale-whole-tone']) {
    const melodies=new Set();
    for(let run=0;run<150;run++) {const q=build(id);melodies.add(JSON.stringify(q.passage.notes.map(n=>[n.midi-q.tonicMidi,n.beats])));}
    assert.ok(melodies.size>120,`${id} should vary beyond its key and metre`);
  }
});
