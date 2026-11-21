const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const {parser,generator}=require('@babel/standalone').packages;
global.window={MLH:{useClickOutside(){}}};window.PracticeMelodyGenerator=require('../practice-melody-generator.js');require('../aural-accompaniment.js');require('../melodic-dictation-generator.js');const core=require('../ear-training-exercises.js');require('../ear-training-piano-concepts.js');require('../time-signatures-listening.js');require('../tempo-changes-listening.js');require('../aural-tonalities.js');
let source=fs.readFileSync(require('node:path').join(__dirname,'../generated-runtimes/auralrecognition-1.js'),'utf8');source=source.slice(0,source.lastIndexOf('const root=document.getElementById'))+';this.api={buildQuestion,prepareQuestion,availableConceptIdsForLevel};';
const context=vm.createContext({window,React:{createElement(){return{}},Fragment:{}},URLSearchParams,location:{search:'',href:'http://localhost/auralrecognition.html'}});vm.runInContext(source,context);const api=context.api;
const pc=n=>((n%12)+12)%12;
test('N5 cadences have native eight-bar phrases and correct final harmonies in every key and metre',()=>{
  const starts=new Set(),paths=new Set();
  for(const keyId of core.keysForLevel('N5'))for(const signature of core.variedSignaturesForLevel('N5'))for(const answer of ['perfect','imperfect'])for(let run=0;run<20;run++) {
    const q=core.withGenerationContext({level:'N5',topic:'cadence'},variation=>{variation.keyName=keyId;variation.signature=signature;return core.makeN5CadencePassage(answer);});
    assert.equal(q.bars.length,8);assert.equal(q.totalBeats,8*signature.beats);assert.equal(q.tempoPulseBeats,signature.pulseQuarterBeats);
    assert.equal(q.bars[7].chordSymbol,answer==='perfect'?'I':'V');assert.equal(q.bars[7].notes.length,1);assert.equal(q.bars[7].notes[0].beats,signature.beats);
    assert.equal(pc(q.bars[7].notes[0].midi),pc(q.key.tonic+(answer==='perfect'?0:7)));
    if(answer==='perfect') {assert.equal(q.bars[6].chordSymbol,'V');assert.equal(q.bars[7].notes[0].midi-q.bars[6].notes.at(-1).midi,1);}
    else starts.add(q.bars[6].chordSymbol);
    for(const bar of q.bars) {
      assert.ok(Math.abs(bar.notes.reduce((sum,n)=>sum+n.beats,0)-signature.beats)<1e-8);
      assert.ok(bar.notes.every(n=>n.midi>=57&&n.midi<=84));
      assert.ok(bar.accompaniment.every(e=>e.beat>=0&&e.beats>0&&e.beat+e.beats<=signature.beats+1e-8&&e.pitches.every(n=>n>=45)));
      const chord=new Set(q.key.chords[bar.chordSymbol].map(pc));
      assert.ok(chord.has(pc(bar.notes[0].midi)));
      if(bar.barIndex>=6) {
        assert.equal(bar.accompaniment.length,2);
        assert.ok(bar.accompaniment.every(e=>e.beat===0&&e.beats===signature.beats*.96));
        assert.equal(pc(bar.accompaniment.find(e=>e.role==='cadence-bass').pitches[0]),pc(q.key.chords[bar.chordSymbol][0]));
      }
    }
    assert.equal(q.isolatedPassage.bars.length,2);assert.equal(q.isolatedPassage.notes.length,0);
    assert.ok(q.isolatedPassage.bars.every(bar=>bar.notes.length===0&&bar.accompaniment.length===2));
    paths.add(JSON.stringify(q.bars.map(bar=>bar.notes.map(n=>[n.midi,n.beats]))));
  }
  assert.deepEqual([...starts].sort(),['I','II','IV','VI']);assert.ok(paths.size>500);
});
test('N5 and Higher share the new cadence writer while AH retains its existing passage length',()=>{
  for(const level of ['N5','H','AH'])for(let run=0;run<40;run++) {
    const q=api.prepareQuestion(api.buildQuestion(level,['perfect','imperfect'],'cadence'));
    assert.equal(q.bars.length,level==='AH'?16:8);
    if(level!=='AH') {assert.equal(q.cadenceStudy,true);assert.equal(q.isolatedPassage.notes.length,0);assert.equal(q.isolatedPassage.timeSignature.id,q.timeSignature.id);}
  }
});
test('cadence replay schedules chord-only ending then the passage with one completion timer',()=>{
  const html=fs.readFileSync(require('node:path').join(__dirname,'../auralrecognition.html'),'utf8');
  const jsx=[...html.matchAll(/<script\b[^>]*type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
  const tree=parser.parse(jsx,{sourceType:'script',plugins:['jsx']}),nodes=[];
  function walk(n){if(!n||typeof n!=='object')return;if(n.type)nodes.push(n);for(const v of Object.values(n)){if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}walk(tree);
  const play=nodes.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='play');
  const branch=play.body.body.find(n=>n.type==='IfStatement'&&n.test.type==='Identifier'&&n.test.name==='passage');
  const audio=nodes.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='playAudioOnlyNotes');
  for(const level of ['N5','H'])for(const fullPassage of [false,true])for(const replay of [false,true])for(const bpm of [60,80,100]) {
    const question=api.prepareQuestion(api.buildQuestion(level,level==='H'?['perfect','imperfect','plagal','interrupted']:['perfect','imperfect'],'cadence'));
    const passage=fullPassage?question:question.isolatedPassage;
    const schedules=[],harmony=[],tones=[];let advances=0;
    const scope={passage,question,fullPassage,rhythmReplay:false,timeReplay:false,pickupReplay:false,intervalReplay:false,chordReplay:false,bassReplay:false,cadenceReplay:replay,questionTopic:'cadence',melodyReplay:false,start:.12,beat:60/bpm/passage.tempoPulseBeats,ctx:{currentTime:0},master:{},harmonyGain:{},metronome:false,
      playAccompaniment:(ctx,gain,bar,offset,beat,start)=>harmony.push({bar,start,offset}),oscillator:(ctx,gain,midi,start)=>tones.push({midi,start}),midiToFrequency:n=>n,melodyMidi:n=>n,
      timers:{current:[]},setTimeout:(fn,ms)=>{schedules.push({fn,ms});return 1;},newQuestion(){advances++;},stopAudio(){},window:{MLH:{naturalPlaybackTailMs:()=>650}}};
    const ctx=vm.createContext(scope);vm.runInContext(generator.default(audio).code,ctx);vm.runInContext('(function(){'+generator.default(branch).code+'})()',ctx);
    assert.equal(schedules.length,1);
    const lead=replay&&fullPassage?question.isolatedPassage.totalBeats*scope.beat+.3:0;
    assert.ok(Math.abs(schedules[0].ms-((.12+lead+passage.totalBeats*scope.beat)*1000+650))<1e-7);
    assert.equal(tones.length,fullPassage?passage.notes.length:0);
    if(fullPassage&&replay) {assert.equal(harmony.length,10);assert.ok(tones.every(t=>t.start>=.12+lead-1e-8));}
    schedules[0].fn();assert.equal(advances,replay?1:0);
  }
});

test('Higher plagal and interrupted cadences have the correct bass and melodic resolutions',()=>{
  const endings={perfect:['V','I'],imperfect:null,plagal:['IV','I'],interrupted:['V','VI']};
  const paths=new Set();
  for(const answer of Object.keys(endings))for(const keyId of core.keysForLevel('H').filter(key=>!['plagal','interrupted'].includes(answer)||!key.endsWith('m')))for(const signature of core.variedSignaturesForLevel('H'))for(let run=0;run<20;run++) {
    const q=core.withGenerationContext({level:'H',topic:'cadence'},variation=>{variation.keyName=keyId;variation.signature=signature;return core.makeCadencePassage(answer);});
    assert.equal(q.bars.length,8);assert.equal(q.totalBeats,8*signature.beats);
    if(endings[answer])assert.deepEqual(q.cadenceProgression,endings[answer]);
    for(const bar of q.bars) {
      assert.ok(Math.abs(bar.notes.reduce((sum,n)=>sum+n.beats,0)-signature.beats)<1e-8);
      assert.ok(bar.notes.every(n=>n.midi>=57&&n.midi<=84));
      const classes=new Set(q.key.chords[bar.chordSymbol].map(pc));
      assert.ok(classes.has(pc(bar.notes[0].midi)));
      assert.ok(bar.accompaniment.every(e=>e.beat+e.beats<=signature.beats+1e-8&&e.pitches.every(n=>n>=45)));
      if(bar.barIndex>=6) {
        assert.equal(bar.accompaniment.length,2);
        const bass=bar.accompaniment.find(e=>e.role==='cadence-bass');
        assert.equal(pc(bass.pitches[0]),pc(q.key.chords[bar.chordSymbol][0]));
        assert.ok(bar.accompaniment.every(e=>e.beat===0&&e.beats===signature.beats*.96));
      }
    }
    const before=q.bars[6].notes.at(-1),final=q.bars[7].notes[0];
    assert.equal(final.beats,signature.beats);
    assert.ok(q.key.chords[q.bars[7].chordSymbol].map(pc).includes(pc(final.midi)));
    if(answer==='interrupted') {
      assert.equal(final.midi-before.midi,1,'leading note resolves while the bass moves unexpectedly to VI');
      assert.equal(q.bars[7].chordSymbol,'VI');
    }
    if(answer==='plagal')assert.equal(final.midi-before.midi,-5,'subdominant melody resolves to tonic');
    assert.equal(q.isolatedPassage.notes.length,0);
    paths.add(JSON.stringify(q.bars.map(bar=>bar.notes.map(n=>[n.midi,n.beats]))));
  }
  assert.ok(paths.size>500);
});
test('Higher presents all four cadence types with the established key eligibility',()=>{
  const answers=new Set();
  for(let run=0;run<240;run++) {
    const q=api.prepareQuestion(api.buildQuestion('H',['perfect','imperfect','plagal','interrupted'],'cadence'));
    answers.add(q.answerId);
    assert.equal(q.cadenceStudy,true);
    if(['plagal','interrupted'].includes(q.answerId))assert.ok(!q.key.id.endsWith('m'));
  }
  assert.equal(answers.size,4);
});

test('N5 and Higher cadences rotate through six musical lead-ins while preserving the final cadence',()=>{
  const endings={perfect:['V','I'],plagal:['IV','I'],interrupted:['V','VI']};
  for(const level of ['N5','H'])for(const answer of level==='N5'?['perfect','imperfect']:['perfect','imperfect','plagal','interrupted']) {
    const variants=new Set();
    for(const signature of core.variedSignaturesForLevel(level))for(const keyId of core.keysForLevel(level))for(let run=0;run<6;run++) {
      const q=core.withGenerationContext({level,topic:'cadence'},v=>{v.keyName=keyId;v.signature=signature;return core.makeN5CadencePassage(answer);});
      variants.add(q.cadenceLeadIn.join(','));assert.equal(q.cadenceLeadIn.length,6);
      assert.deepEqual(q.bars.slice(0,6).map(b=>b.chordSymbol),q.cadenceLeadIn);
      assert.equal(q.bars[0].chordSymbol,'I');
      if(endings[answer])assert.deepEqual(q.bars.slice(-2).map(b=>b.chordSymbol),endings[answer]);
      for(const bar of q.bars.slice(0,6)) {
        const chord=q.key.chords[bar.chordSymbol];
        assert.ok(chord.some(n=>pc(n)===pc(bar.notes[0].midi)));
        assert.ok(Math.abs(bar.notes.reduce((sum,n)=>sum+n.beats,0)-signature.beats)<1e-8);
      }
    }
    assert.equal(variants.size,6,`${level} ${answer} uses all six lead-ins`);
  }
});

test('Higher Tierce shares varied cadence lead-ins and retains its plain final chord',()=>{
  for(const answerId of ['tierce-yes','tierce-no']) {
    const variants=new Set();
    for(let run=0;run<90;run++) {
      const q=core.buildQuestion({level:'H',topic:'tiercePicardie',answerId,options:['tierce-yes','tierce-no'],mode:'choice'});
      variants.add(q.cadenceLeadIn.join(','));assert.equal(q.bars[6].chordSymbol,'V');assert.equal(q.bars[7].chordSymbol,'I');
      assert.ok([1,3].includes(q.bars[6].notes.length));assert.equal(q.bars[7].notes.length,1);
      const chord=q.bars[7].accompanimentHarmony.at(-1).pitches;
      assert.equal(chord[1]-chord[0],answerId==='tierce-yes'?4:3);
    }
    assert.equal(variants.size,6);
  }
});
