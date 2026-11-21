const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {parser,generator}=require('@babel/standalone').packages;
global.window={MLH:{useClickOutside(){}}};window.PracticeMelodyGenerator=require('../practice-melody-generator.js');require('../aural-accompaniment.js');require('../melodic-dictation-generator.js');const core=require('../ear-training-exercises.js');require('../ear-training-piano-concepts.js');require('../time-signatures-listening.js');require('../tempo-changes-listening.js');require('../aural-tonalities.js');
function pageApi(){let source=fs.readFileSync('generated-runtimes/auralrecognition-1.js','utf8');source=source.slice(0,source.lastIndexOf('const root=document.getElementById'))+';this.api={buildChordQuestion,prepareQuestion,buildQuestion,defaultConceptIdsForLevel,assessmentConceptIdsForLevel,taskMatchesLevel,scoreAnswerOptionsFor,melodyPlaybackBeats,higherHarmonicReplayExample};';const context=vm.createContext({window,React:{createElement(){return{}},Fragment:{}},URLSearchParams,location:{search:'',href:'http://localhost/auralrecognition.html'}});vm.runInContext(source,context);return context.api;}
const pc=n=>((n%12)+12)%12;
test('AH chord types share eight-bar Higher phrasing with exact augmented triads and resolutions',()=>{
  const api=pageApi(),metres=new Set(),keys=new Set();
  for(const id of ['add6','dom7','dim7','aug','dim'])for(let run=0;run<120;run++) {
    const raw=api.buildChordQuestion('AH',[id],id),signature=raw.passage.timeSignature.id,q=api.prepareQuestion(raw),p=q.passage;metres.add(signature);keys.add(p.key.id);
    assert.equal(p.timeSignature.id,signature);assert.equal(p.bars.length,8);assert.equal(p.chordCount,2);assert.equal(p.level,'AH');
    for(const index of p.targetBars) {
      const [target,resolution]=p.bars[index].accompanimentHarmony;
      assert.deepEqual(Array.from(target.pitches,n=>n-target.pitches[0]),Array.from(q.chordType.intervals));
      if(id==='aug'){assert.deepEqual(Array.from(target.pitches,n=>n-target.pitches[0]),[0,4,8]);assert.equal(pc(resolution.pitches[0]-target.pitches[0]),5);}
    }
  }
  assert.equal(keys.size,8);assert.equal(metres.size,4);
});
test('AH harmonic devices share native eight-bar writers and suspension is prepared, held and resolved',()=>{
  const api=pageApi();
  const cases=[['accompanimentDevices','device-pedal'],['accompanimentDevices','device-inverted-pedal'],['vamp','vamp-yes'],['modulation','modulation-yes'],['relativeKey','relative-minor'],['tiercePicardie','tierce-yes'],['suspension','suspension-yes'],['suspension','suspension-no']];
  for(const [topic,answerId] of cases)for(let run=0;run<100;run++) {
    const q=core.buildQuestion({level:'AH',topic,answerId,options:[answerId],mode:'choice'});assert.equal(q.bars.length,8);
    q.bars.forEach(bar=>{assert.ok(Math.abs(bar.notes.reduce((sum,n)=>sum+n.beats,0)-q.timeSignature.beats)<1e-8);assert.ok(bar.notes.every(n=>n.rest||n.midi>=57&&n.midi<=84));assert.ok(bar.accompaniment.every(e=>e.beat>=0&&e.beats>0&&e.beat+e.beats<=q.timeSignature.beats+1e-8&&e.pitches.every(n=>n>=45)));});
    if(topic==='suspension')for(const placement of q.suspensionPlacements) {
      const prep=q.bars[placement.preparationBar],target=q.bars[placement.barIndex],last=prep.notes.at(-1);
      assert.equal(last.midi,placement.suspensionMidi);
      if(answerId==='suspension-yes') {
        assert.equal(target.notes[0].midi,last.midi);assert.equal(target.notes[0].tiedFromPrevious,true);assert.equal(api.melodyPlaybackBeats(target,0),0);
        assert.equal(last.playbackBeats,last.beats+placement.resolutionBeat);
        assert.equal(target.notes[1].midi,placement.resolutionMidi);assert.equal(target.notes[1].beat,placement.resolutionBeat);
        assert.equal(target.accompanimentHarmony.length,2);
      }else {assert.equal(target.notes.length,1);assert.equal(target.notes[0].tiedFromPrevious,undefined);assert.equal(target.notes[0].midi,placement.resolutionMidi);}
    }
  }
});
test('AH time signatures inherit Higher irregular grouping, variable changes and native simple/compound phrasing',()=>{
  const api=pageApi(),pool=new Set(),positions=new Set();
  for(const answerId of ['metre-irregular','metre-change'])for(let run=0;run<120;run++) {
    const q=core.buildQuestion({level:'AH',topic:'irregularMetre',answerId,options:[answerId],mode:'choice'});assert.equal(q.bars.length,8);
    assert.equal(q.totalBeats,q.bars.reduce((sum,b)=>sum+b.beats,0));
    if(answerId==='metre-irregular')pool.add(q.timeSignature.id);else positions.add(q.timeSignatureChanges[1].barIndex);
  }
  assert.equal(pool.size,4);assert.deepEqual(positions,new Set([2,4]));
  const controls=Array.from(api.assessmentConceptIdsForLevel('AH','beatsPerBar'));
  assert.ok(['simple','compound','metre-irregular','metre-change'].every(id=>controls.includes(id)));assert.ok(!controls.includes('metre-3')&&!controls.includes('metre-4')&&!controls.includes('beats-5'));
  const signatures=new Set();
  for(let run=0;run<32;run++){const q=api.prepareQuestion(api.buildQuestion('AH',['metre-irregular'],'beatsPerBar'));assert.equal(q.answerId,'metre-irregular');signatures.add(q.timeSignature.id);}
  assert.ok(signatures.has('5/4'));
  for(const id of ['simple','compound'])for(let run=0;run<24;run++) {
    const q=api.prepareQuestion(api.buildQuestion('AH',[id],'beatsPerBar'));assert.equal(q.bars.length,8);
  }
});
test('AH inherited optional harmonic devices remain neutral for medals and score scope',()=>{
  const api=pageApi(),ids=Array.from(api.defaultConceptIdsForLevel('AH')),on=[...ids,'device-pedal','device-inverted-pedal','device-no-pedal','vamp-yes','vamp-no'];
  assert.ok(!ids.includes('device-pedal')&&!ids.includes('vamp-yes'));assert.ok(ids.includes('suspension-yes'));
  assert.equal(api.taskMatchesLevel('AH',ids,'accompanimentDevices'),true);assert.equal(api.taskMatchesLevel('AH',on,'accompanimentDevices'),true);
  assert.deepEqual(Array.from(api.scoreAnswerOptionsFor('AH',ids,'accompanimentDevices')),Array.from(api.scoreAnswerOptionsFor('AH',on,'accompanimentDevices')));
});
