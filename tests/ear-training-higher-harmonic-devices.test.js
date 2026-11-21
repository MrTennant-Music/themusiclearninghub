const test=require('node:test'),assert=require('node:assert/strict');
global.window={MLH:{}};window.PracticeMelodyGenerator=require('../practice-melody-generator.js');require('../aural-accompaniment.js');const core=require('../ear-training-exercises.js');require('../ear-training-piano-concepts.js');
const pc=n=>((n%12)+12)%12;
test('Higher pedal, inverted pedal and vamp reuse the eight-bar N5 rules',()=>{
  const metres=new Set(),octaves=new Set();
  for(const [topic,answerId] of [['accompanimentDevices','device-pedal'],['accompanimentDevices','device-inverted-pedal'],['accompanimentDevices','device-no-pedal'],['vamp','vamp-yes'],['vamp','vamp-no']])for(let run=0;run<100;run++) {
    const q=core.buildQuestion({level:'H',topic,answerId,options:[answerId],mode:'choice'});
    assert.equal(q.bars.length,8);assert.equal(q.harmonicExcerptBars,8);metres.add(q.timeSignature.id);
    assert.equal(q.bars.at(-1).chordSymbol,'I');
    for(const bar of q.bars) {
      assert.ok(Math.abs(bar.notes.reduce((sum,n)=>sum+n.beats,0)-q.timeSignature.beats)<1e-8);
      for(const e of bar.accompaniment)assert.ok(e.beats>0&&e.beat>=0&&e.beat+e.beats<=q.timeSignature.beats+1e-8&&e.pitches.every(n=>Number.isFinite(n)&&n>=45));
    }
    if(['device-pedal','device-inverted-pedal'].includes(answerId)) {
      const role=answerId==='device-pedal'?'pedal':'inverted-pedal',events=q.bars.flatMap(b=>b.accompaniment.filter(e=>e.role===role));
      assert.equal(events.length,8*q.timeSignature.beats/q.pedalNoteBeats);
      assert.ok([.5,1].includes(q.pedalNoteBeats));
      assert.ok(events.every(e=>Math.abs(.018*e.volume-.078*.82*.8)<1e-8));
      if(role==='inverted-pedal') {
        octaves.add(q.pedalOctaveAlternation);
        const top=Math.max(...q.notes.filter(n=>!n.rest).map(n=>n.midi));
        assert.ok(events.every(e=>e.pitches[0]>top));
        assert.ok(events.every((e,i)=>e.pitches[0]===q.pedalPitch+(q.pedalOctaveAlternation&&i%2?12:0)));
      } else assert.ok(events.every(e=>e.pitches[0]===q.pedalPitch));
    }
    if(answerId==='vamp-yes')assert.equal(q.vampRate,2);
  }
  assert.equal(metres.size,4);assert.deepEqual(octaves,new Set([false,true]));
});
test('Higher modulation and relative-key questions use prepared destination harmony and tonic endings',()=>{
  const relative={Am:'C',Dm:'F',Em:'G',C:'Am',F:'Dm',G:'Em'};
  for(const [topic,answerId] of [['modulation','modulation-yes'],['modulation','modulation-no'],['relativeKey','relative-major'],['relativeKey','relative-minor'],['relativeKey','relative-same']])for(let run=0;run<120;run++) {
    const q=core.buildQuestion({level:'H',topic,answerId,options:[answerId],mode:'choice'});
    assert.equal(q.bars.length,8);assert.equal(q.harmonicDevice,'changeOfKey');
    const {from,to}=q.keyChange,changes=!['modulation-no','relative-same'].includes(answerId);
    assert.equal(from!==to,changes);
    if(topic==='relativeKey'&&changes) {
      assert.equal(relative[from],to);
      assert.equal(from.endsWith('m'),answerId==='relative-major');
      assert.equal(q.keyChange.relationship,answerId);
    }
    if(changes)assert.deepEqual(q.bars[3].accompanimentHarmony[1].pitches,core.keys[to].chords.V7);
    assert.ok(q.bars.slice(4).every(b=>b.keyId===to));
    assert.equal(q.bars[7].chordSymbol,'I');assert.equal(pc(q.bars[7].notes[0].midi),pc(core.keys[to].tonic));
    assert.ok(q.bars.slice(4,7).every(b=>b.accompaniment.length>1),'destination chords continue pulsing');
  }
});

test('Higher omits Modulation and starts inherited harmonic devices disabled while retaining opt-in choices',()=>{
  const fs=require('node:fs'),vm=require('node:vm');
  let source=fs.readFileSync('generated-runtimes/auralrecognition-1.js','utf8');
  source=source.slice(0,source.lastIndexOf('const root=document.getElementById'))+';this.api={conceptIdsForLevel,defaultConceptIdsForLevel,savedEnabledForLevel,assessmentConceptIdsForLevel};';
  require('../melodic-dictation-generator.js');require('../time-signatures-listening.js');require('../tempo-changes-listening.js');require('../aural-tonalities.js');
  const context=vm.createContext({window,React:{createElement(){return{}},Fragment:{}},URLSearchParams,location:{search:'',href:'http://localhost/auralrecognition.html'}});vm.runInContext(source,context);
  const api=context.api,available=Array.from(api.conceptIdsForLevel('H')),defaults=Array.from(api.defaultConceptIdsForLevel('H'));
  for(const id of ['modulation-yes','modulation-no'])assert.ok(!available.includes(id));
  const off=['device-pedal','device-inverted-pedal','device-no-pedal','vamp-yes','vamp-no'];
  off.forEach(id=>{assert.ok(available.includes(id));assert.ok(!defaults.includes(id));});
  assert.ok(['tierce-yes','relative-major','relative-minor'].every(id=>defaults.includes(id)));
  const migrated=Array.from(api.savedEnabledForLevel({enabledByLevel:{H:[...available,'modulation-yes','modulation-no']}},'H'));
  off.forEach(id=>assert.ok(!migrated.includes(id)));
  const optedIn=Array.from(api.savedEnabledForLevel({higherHarmonicDefaultsVersion:1,higherRhythmDefaultsVersion:1,enabledByLevel:{H:available}},'H'));
  off.forEach(id=>assert.ok(optedIn.includes(id)));
  for(const level of ['N4','N5'])assert.deepEqual(Array.from(api.defaultConceptIdsForLevel(level)),Array.from(api.conceptIdsForLevel(level)));
});

test('Higher Tierce establishes minor for seven bars and changes only the final tonic third',()=>{
  const keys=new Set(),metres=new Set();
  for(const answerId of ['tierce-yes','tierce-no'])for(let run=0;run<160;run++) {
    const q=core.buildQuestion({level:'H',topic:'tiercePicardie',answerId,options:['tierce-yes','tierce-no'],mode:'choice'});
    keys.add(q.key.id);metres.add(q.timeSignature.id);assert.equal(q.bars.length,8);
    const third=(q.key.tonic+(answerId==='tierce-yes'?4:3))%12;
    for(const bar of q.bars) {
      assert.ok(Math.abs(bar.notes.reduce((sum,n)=>sum+n.beats,0)-q.timeSignature.beats)<1e-8);
      if(bar.barIndex<7) {
        assert.ok(bar.notes.every(n=>pc(n.midi-q.key.tonic)!==4));
        assert.ok(bar.accompaniment.every(e=>e.pitches.every(n=>pc(n-q.key.tonic)!==4)));
      }
      assert.ok(bar.notes.every(n=>n.midi>=57&&n.midi<=84));
    }
    const final=q.bars[7];assert.equal(final.notes.length,1);assert.equal(final.notes[0].beats,q.timeSignature.beats);
    assert.ok(final.accompaniment.filter(e=>e.role==="cadence-chord").at(-1).pitches.some(n=>pc(n)===third));
    assert.equal(pc(final.notes.at(-1).midi),pc(q.key.tonic));
    assert.equal(final.accompaniment[0].volume,q.bars[6].accompaniment[0].volume);
    assert.ok(!q.pedalPitch&&!q.vampRate&&!q.keyChange);
  }
  assert.equal(keys.size,3);assert.equal(metres.size,4);
});

test('Higher harmonic replay extracts the actual ending, transition or exposed accompaniment',()=>{
  const fs=require('node:fs'),vm=require('node:vm');
  let source=fs.readFileSync('generated-runtimes/auralrecognition-1.js','utf8');source=source.slice(0,source.lastIndexOf('const root=document.getElementById'))+';this.replay=higherHarmonicReplayExample;';
  const context=vm.createContext({window,React:{createElement(){return{}},Fragment:{}},URLSearchParams,location:{search:'',href:'http://localhost/auralrecognition.html'}});vm.runInContext(source,context);
  for(const [topic,answerId,indices,melody] of [['tiercePicardie','tierce-yes',[6,7],true],['relativeKey','relative-minor',[2,3,4,5],true],['accompanimentDevices','device-inverted-pedal',[1,2],false],['vamp','vamp-yes',[1,2],false]]) {
    const q=core.buildQuestion({level:'H',topic,answerId,options:[answerId],mode:'choice'}),preview=context.replay(q);
    assert.equal(preview.bars.length,indices.length);assert.equal(preview.totalBeats,indices.length*q.timeSignature.beats);
    preview.bars.forEach((bar,i)=>assert.equal(JSON.stringify(bar.accompaniment),JSON.stringify(q.bars[indices[i]].accompaniment)));
    assert.equal(preview.notes.length>0,melody);
    if(melody)assert.deepEqual(Array.from(preview.notes,n=>n.midi),indices.flatMap(i=>q.bars[i].notes.filter(n=>!n.rest).map(n=>n.midi)));
  }
});

test('Higher optional pedal and vamp choices never change medal eligibility or score scope',()=>{
  const fs=require('node:fs'),vm=require('node:vm');
  let source=fs.readFileSync('generated-runtimes/auralrecognition-1.js','utf8');source=source.slice(0,source.lastIndexOf('const root=document.getElementById'))+';this.scoring={defaultConceptIdsForLevel,taskMatchesLevel,scoreAnswerOptionsFor};';
  const context=vm.createContext({window,React:{createElement(){return{}},Fragment:{}},URLSearchParams,location:{search:'',href:'http://localhost/auralrecognition.html'}});vm.runInContext(source,context);
  const api=context.scoring,defaults=Array.from(api.defaultConceptIdsForLevel('H')),baseline=Array.from(api.scoreAnswerOptionsFor('H',defaults,'accompanimentDevices'));
  for(let mask=0;mask<8;mask++) {
    const enabled=[...defaults,...(mask&1?['device-pedal','device-no-pedal']:[]),...(mask&2?['device-inverted-pedal','device-no-pedal']:[]),...(mask&4?['vamp-yes','vamp-no']:[])];
    assert.equal(api.taskMatchesLevel('H',enabled,'accompanimentDevices'),true);
    assert.deepEqual(Array.from(api.scoreAnswerOptionsFor('H',enabled,'accompanimentDevices')),baseline);
    assert.equal(api.taskMatchesLevel('H',enabled.filter(id=>id!=='relative-minor'),'accompanimentDevices'),false,'other customisation still affects medals');
  }
});

test('Higher phrase refinements settle the opening, vary preparation and sustain the final third',()=>{
  const routes=new Set(),shapes=new Set();
  for(let run=0;run<180;run++) {
    const relative=core.buildQuestion({level:'H',topic:'relativeKey',answerId:run%2?'relative-minor':'relative-same',options:['relative-major','relative-minor','relative-same'],mode:'choice'});
    assert.equal(pc(relative.bars[0].notes.at(-1).midi),pc(core.keys[relative.keyChange.from].tonic));
    assert.equal(relative.keyChange.openingTonicArrival,true);assert.equal(relative.keyChange.recentShapeChecked,true);
    routes.add(relative.keyChange.pivotChord);
    const p=core.buildQuestion({level:'H',topic:'tiercePicardie',answerId:run%2?'tierce-yes':'tierce-no',options:['tierce-yes','tierce-no'],mode:'choice'});
    const final=p.bars.at(-1);
    assert.equal(final.notes.length,1);assert.ok([1,3].includes(p.bars[6].notes.length));assert.equal(p.tierceVariant.cadenceGenerator,true);
    assert.ok(final.notes.at(-1).beats>=p.timeSignature.beats*.375);
    shapes.add(JSON.stringify(final.notes.map(n=>[n.midi-p.key.tonic,n.beats/p.timeSignature.beats])));
  }
  assert.ok(routes.size>=2);assert.ok(shapes.size>=1);
});

test('normal Higher harmonic play balances question families independently of their answer counts',()=>{
  const fs=require('node:fs'),vm=require('node:vm');let source=fs.readFileSync('generated-runtimes/auralrecognition-1.js','utf8');
  source=source.slice(0,source.lastIndexOf('const root=document.getElementById'))+';this.api={buildQuestion,defaultConceptIdsForLevel};';
  const context=vm.createContext({window,React:{createElement(){return{}},Fragment:{}},URLSearchParams,location:{search:'',href:'http://localhost/auralrecognition.html'}});vm.runInContext(source,context);
  const counts={};const ids=context.api.defaultConceptIdsForLevel('H');
  for(let run=0;run<400;run++) {
    const q=context.api.buildQuestion('H',ids,'accompanimentDevices');counts[q.type]=(counts[q.type]||0)+1;
    assert.ok(!['modulation','vamp'].includes(q.type));
  }
  assert.deepEqual(counts,{relativeKey:200,tiercePicardie:200});
});

test('Tierce uses the cadence writer and both answers finish with plain held chords',()=>{
  for(const signature of core.variedSignaturesForLevel('H'))for(const answerId of ['tierce-yes','tierce-no'])for(let run=0;run<30;run++) {
    const q=core.withGenerationContext({level:'H',topic:'tiercePicardie'},v=>{v.signature=signature;return core.buildQuestion({level:'H',topic:'tiercePicardie',answerId,options:['tierce-yes','tierce-no'],mode:'choice'});});
    assert.equal(q.accompanimentPattern,'cadence-chords');assert.equal(q.tierceVariant.cadenceGenerator,true);
    for(const bar of q.bars.slice(-2)) {
      assert.ok([1,3].includes(bar.notes.length));assert.equal(bar.notes[0].beat,0);
      if(bar.barIndex===7&&q.tierceVariant.finalSuspension!=='none') {assert.equal(bar.accompaniment.length,4);} else bar.notes.forEach((note,i)=>{const events=bar.accompaniment.slice(i*2,i*2+2);assert.deepEqual(events.map(e=>e.role),['cadence-chord','cadence-bass']);assert.ok(events.every(e=>e.beat===note.beat&&Math.abs(e.beats-note.beats*.96)<1e-8));});
    }
    const final=q.bars[7],root=final.accompanimentHarmony.at(-1).pitches[0];
    assert.deepEqual(final.accompanimentHarmony.at(-1).pitches,[root,root+(answerId==='tierce-yes'?4:3),root+7]);
    assert.equal(pc(final.notes[0].midi),pc(root));
  }
});

test('Tierce mixes held and repeated dominant chords with one long final tonic in each metre',()=>{
  const patterns={'2/4':[1,.5,.5],'3/4':[1,1,1],'4/4':[2,1,1],'6/8':[1.5,.5,1]};
  for(const signature of core.variedSignaturesForLevel('H'))for(const answerId of ['tierce-yes','tierce-no']) {
    const heard=new Set();
    for(let run=0;run<120;run++) {
      const q=core.buildQuestion({level:'H',topic:'tiercePicardie',answerId,options:[answerId],mode:'choice'});
      if(q.timeSignature.id!==signature.id)continue;
      const approach=q.bars[6],final=q.bars[7];heard.add(q.tierceVariant.approachStyle);
      const expected=q.tierceVariant.approachStyle==='held'?[q.timeSignature.beats]:patterns[q.timeSignature.id];
      assert.deepEqual(approach.notes.map(n=>n.beats),expected);
      const chords=approach.accompaniment.filter(e=>e.role==='cadence-chord');assert.equal(chords.length,expected.length);
      assert.ok(chords.every(e=>JSON.stringify(e.pitches)===JSON.stringify(chords[0].pitches)),'repeat the dominant chord without melodic decoration');
      assert.equal(final.notes.length,1);assert.equal(final.notes[0].beats,q.timeSignature.beats);
      assert.equal(final.accompaniment.filter(e=>e.role==='cadence-chord').length,q.tierceVariant.finalSuspension==='none'?1:2);
    }
    assert.deepEqual(heard,new Set(['held','repeated']));
  }
});

test('Tierce occasionally resolves a second or fourth to the final third without decorating the melody',()=>{
  for(const answerId of ['tierce-yes','tierce-no']) {
    const counts={none:0,second:0,fourth:0};
    for(let run=0;run<160;run++) {
      const q=core.buildQuestion({level:'H',topic:'tiercePicardie',answerId,options:[answerId],mode:'choice'}),kind=q.tierceVariant.finalSuspension,final=q.bars[7];
      counts[kind]++;assert.equal(final.notes.length,1);assert.equal(final.notes[0].beats,q.timeSignature.beats);
      if(kind==='none')continue;
      const chords=final.accompaniment.filter(e=>e.role==='cadence-chord'),bass=final.accompaniment.filter(e=>e.role==='cadence-bass');
      assert.equal(chords.length,2);assert.deepEqual(bass[0].pitches,bass[1].pitches);
      const altered=[];
      chords[0].pitches.forEach((pitch,i)=>{if(pitch!==chords[1].pitches[i])altered.push([pitch,chords[1].pitches[i]]);});
      assert.equal(altered.length,1);assert.equal(pc(altered[0][0]-q.key.tonic),kind==='second'?2:5);
      assert.equal(pc(altered[0][1]-q.key.tonic),answerId==='tierce-yes'?4:3);
      assert.equal(chords[1].beat,q.timeSignature.pulseQuarterBeats);
      assert.ok(chords.every(e=>e.gateRelease));
    }
    assert.ok(counts.none>=118&&counts.none<=122);assert.ok(counts.second>=18&&counts.second<=22);assert.ok(counts.fourth>=18&&counts.fourth<=22);
  }
});

test('Higher anacrusis defaults off without changing score scope or medal eligibility',()=>{
  const fs=require('node:fs'),vm=require('node:vm');let source=fs.readFileSync('generated-runtimes/auralrecognition-1.js','utf8');
  source=source.slice(0,source.lastIndexOf('const root=document.getElementById'))+';this.api={defaultConceptIdsForLevel,savedEnabledForLevel,conceptIdsForLevel,taskMatchesLevel,scoreAnswerOptionsFor};';
  const context=vm.createContext({window,React:{createElement(){return{}},Fragment:{}},URLSearchParams,location:{search:'',href:'http://localhost/auralrecognition.html'}});vm.runInContext(source,context);
  const api=context.api,defaults=Array.from(api.defaultConceptIdsForLevel('H')),on=[...defaults,'anacrusis-yes','anacrusis-no'];
  assert.ok(!defaults.includes('anacrusis-yes')&&!defaults.includes('anacrusis-no'));
  assert.equal(api.taskMatchesLevel('H',defaults,'rhythmicChange'),true);assert.equal(api.taskMatchesLevel('H',on,'rhythmicChange'),true);
  assert.deepEqual(Array.from(api.scoreAnswerOptionsFor('H',on,'rhythmicChange')),Array.from(api.scoreAnswerOptionsFor('H',defaults,'rhythmicChange')));
  const old={higherHarmonicDefaultsVersion:1,enabledByLevel:{H:on}};
  assert.ok(!api.savedEnabledForLevel(old,'H').includes('anacrusis-yes'));
  assert.ok(api.savedEnabledForLevel({...old,higherRhythmDefaultsVersion:1},'H').includes('anacrusis-yes'));
  assert.ok(api.defaultConceptIdsForLevel('N4').includes('anacrusis-yes'));
});
