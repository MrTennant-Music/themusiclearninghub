const test=require('node:test');const assert=require('node:assert/strict');
global.window={MLH:{}};window.PracticeMelodyGenerator=require('../practice-melody-generator.js');require('../aural-accompaniment.js');const core=require('../ear-training-exercises.js');
const pc=midi=>((midi%12)+12)%12;
const bass=bar=>bar.accompaniment.filter(e=>e.role==='bass-pattern');
test('N5 bass studies fill their native phrase lengths and expose the complete pattern in isolation',()=>{
  const paths=new Set();
  for(const keyId of core.keysForLevel('N5'))for(const signature of core.variedSignaturesForLevel('N5'))for(const id of ['bass-walking','bass-ground','bass-alberti'])for(let run=0;run<12;run++) {
    const q=core.withGenerationContext({level:'N5',topic:'bassPatterns'},variation=>{variation.keyName=keyId;variation.signature=signature;return core.makeN5BassPassage(id);});
    assert.equal(q.bars.length,8);assert.equal(q.totalBeats,q.bars.length*q.timeSignature.beats);assert.equal(q.tempoPulseBeats,q.tempoPulseBeats);
    for(const bar of q.bars) {
      assert.ok(Math.abs(bar.notes.reduce((sum,n)=>sum+n.beats,0)-q.timeSignature.beats)<1e-8);
      assert.ok(bar.notes.every(n=>n.rest||(n.midi>=57&&n.midi<=84)));
      assert.ok(bar.accompaniment.every(e=>e.beat>=0&&e.beats>0&&e.beat+e.beats<=q.timeSignature.beats+1e-8&&e.pitches.every(n=>n>=45)));
      assert.ok(bar.notes.filter(n=>!n.rest).every(n=>n.midi>Math.max(...bass(bar).flatMap(e=>e.pitches))));
      for(const e of id==='bass-walking'?[]:bass(bar))assert.ok(q.key.scale.includes((pc(e.pitches[0])-pc(q.key.tonic)+12)%12),'bass uses the actual major or harmonic minor collection');
    }
    if(id==='bass-walking') {assert.equal(q.bars[6].accompanimentHarmony.at(-1).chordSymbol,'V7');assert.ok(['I6','i6'].includes(q.bars[7].chordSymbol));}else if(id==='bass-alberti') {assert.equal(q.bars[6].chordSymbol,'V');assert.equal(q.bars[7].chordSymbol,'I');}
    if(id!=='bass-ground'){assert.equal(bass(q.bars[7]).length,id==='bass-walking'?4:1);assert.equal(pc(bass(q.bars[7])[0].pitches[0]),pc(q.key.tonic));}
    assert.equal(q.isolatedPassage.bars.length,2);assert.equal(q.isolatedPassage.notes.length,0);
    assert.ok(q.isolatedPassage.bars.every(b=>b.accompaniment.every(e=>e.role==='bass-pattern')));
    if(id==='bass-ground') {
      for(let i=2;i<8;i++)assert.deepEqual(bass(q.bars[i]).map(e=>[e.beat,e.beats,...e.pitches]),bass(q.bars[i%2]).map(e=>[e.beat,e.beats,...e.pitches]));
      const harmonies=q.bars.slice(0,6).map(b=>b.accompanimentHarmony.map(s=>s.chordSymbol).join(','));
      assert.ok(harmonies[0]!==harmonies[2]||harmonies[2]!==harmonies[4],'same ground has changing upper harmony');
      assert.deepEqual(q.bars.at(-1).accompanimentHarmony.slice(-2).map(s=>s.chordSymbol),['V','I']);
      assert.equal(pc(bass(q.bars.at(-1)).at(-1).pitches[0]),pc(q.key.tonic));
      assert.equal(q.bars.at(-1).notes.at(-1).midi-q.bars.at(-1).notes.at(-2).midi,1,'upper melody supplies the final leading-note resolution without changing the ground');
      for(const bar of q.bars)bass(bar).forEach((event,index)=>assert.ok(bar.accompanimentHarmony[index].pitches.map(pc).includes(pc(event.pitches[0]))));
    }
    if(id==='bass-alberti') {
      assert.ok(q.bars.every(bar=>bar.accompaniment.every(event=>event.pitches.every(midi=>midi>=50))), 'Alberti accompaniment never falls below D3');
      assert.ok(q.isolatedPassage.bars.every(bar=>bar.accompaniment.every(event=>event.pitches.every(midi=>midi>=50))));
      q.bars.slice(0,7).forEach((bar,index)=>{
        const chord=q.key.chords[bar.chordSymbol],order=[0,2,1,2];
        bass(bar).forEach((event,i)=>assert.equal(pc(event.pitches[0]),pc(chord[order[(index*bass(bar).length+i)%4]])));
        assert.equal(bar.accompaniment.filter(e=>e.role==='bass-pattern').length,q.timeSignature.beats/.5);
      });
    }
    if(id==='bass-walking') {
      const notes=q.bars.slice(0,7).flatMap(b=>bass(b));let steps=0,moves=0;
      for(let i=1;i<notes.length;i++) {
        const distance=Math.abs(notes[i].pitches[0]-notes[i-1].pitches[0]);
        if(distance>0)moves++;if(distance>0&&distance<=2)steps++;
      }
      assert.ok(steps/moves>=.5,`walking line is mainly stepwise ${keyId} ${signature.id}: ${steps}/${moves} ${notes.map(e=>e.pitches[0])}`);
      assert.ok(q.bars.slice(0,7).every(bar=>bass(bar).every(e=>e.beats===q.tempoPulseBeats*.9)));
    }
    paths.add(JSON.stringify(q.bars.map(b=>b.notes.map(n=>[n.midi,n.beats]))));
  }
  assert.ok(paths.size>300);
});

test('incorrect bass replay plays the isolated pattern before the passage and advances once',()=>{
  const fs=require('node:fs'),vm=require('node:vm'),{parser,generator}=require('@babel/standalone').packages;
  const html=fs.readFileSync(require('node:path').join(__dirname,'../auralrecognition.html'),'utf8');
  const jsx=[...html.matchAll(/<script\b[^>]*type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
  const tree=parser.parse(jsx,{sourceType:'script',plugins:['jsx']}),nodes=[];
  function walk(n){if(!n||typeof n!=='object')return;if(n.type)nodes.push(n);for(const v of Object.values(n)){if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}walk(tree);
  const play=nodes.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='play');
  const branch=play.body.body.find(n=>n.type==='IfStatement'&&n.test.type==='Identifier'&&n.test.name==='passage');
  const audio=nodes.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='playAudioOnlyNotes');
  for(const id of ['bass-walking','bass-ground','bass-alberti'])for(const signature of core.variedSignaturesForLevel('N5'))for(const fullPassage of [false,true])for(const replay of [false,true]) {
    const q=core.withGenerationContext({level:'N5',topic:'bassPatterns'},variation=>{variation.signature=signature;return core.makeN5BassPassage(id);});
    const passage=fullPassage?q:q.isolatedPassage,schedules=[],harmony=[],tones=[];let advances=0;
    const scope={question:q,passage,fullPassage,rhythmReplay:false,timeReplay:false,pickupReplay:false,intervalReplay:false,chordReplay:false,bassReplay:replay,cadenceReplay:false,melodyReplay:false,questionTopic:'bassPatterns',metronome:false,
      start:.12,beat:60/80/q.tempoPulseBeats,ctx:{currentTime:0,createGain:()=>({connect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){}}})},master:{},harmonyGain:{},
      playAccompaniment:(ctx,gain,bar,offset,beat,start)=>harmony.push({bar,offset,start}),oscillator:(ctx,gain,midi,start)=>tones.push({midi,start}),midiToFrequency:n=>n,melodyMidi:n=>n,
      timers:{current:[]},setTimeout:(fn,ms)=>{schedules.push({fn,ms});return 1;},newQuestion(){advances++;},stopAudio(){},window:{MLH:{naturalPlaybackTailMs:()=>650}}};
    const context=vm.createContext(scope);vm.runInContext(generator.default(audio).code,context);vm.runInContext('(function(){'+generator.default(branch).code+'})()',context);
    assert.equal(schedules.length,1);
    const lead=replay&&fullPassage?q.isolatedPassage.totalBeats*scope.beat+.3:0;
    assert.ok(Math.abs(schedules[0].ms-((.12+lead+passage.totalBeats*scope.beat)*1000+650))<1e-7);
    assert.equal(tones.length,fullPassage?q.notes.length:0);
    if(replay&&fullPassage) {
      assert.ok(harmony.slice(0,2).every(item=>item.bar.accompaniment.every(e=>e.role==='bass-pattern')));
      assert.ok(tones.every(t=>t.start>=.12+lead-1e-8));
    }
    schedules[0].fn();assert.equal(advances,replay?1:0);
  }
});

test('walking bass follows major and minor jazz turnarounds with chord-root landings',()=>{
  let chromaticApproaches=0;
  const intervals=pitches=>pitches.map(n=>(pc(n)-pc(pitches[0])+12)%12);
  for(const keyId of core.keysForLevel('N5'))for(const signature of core.variedSignaturesForLevel('N5'))for(let run=0;run<20;run++) {
    const q=core.withGenerationContext({level:'N5',topic:'bassPatterns'},variation=>{variation.keyName=keyId;variation.signature=signature;return core.makeN5BassPassage('bass-walking');});
    assert.equal(q.bassJazzHarmony,true);
    const minor=keyId.endsWith('m'),ii=minor?'iiHalfDim7':'ii7';
    assert.deepEqual(intervals(q.key.chords[ii]),minor?[0,3,6,10]:[0,3,7,10]);
    assert.deepEqual(intervals(q.key.chords.V7),[0,4,7,10]);
    assert.equal(q.bars[2].chordSymbol,ii);assert.equal(q.bars[3].chordSymbol,'V7');
    assert.equal(q.bars[4].chordSymbol,minor?'i6':'Imaj7');
    assert.equal(q.bars[7].chordSymbol,minor?'i6':'I6');
    if(!minor)assert.deepEqual(intervals(q.key.chords.VI7),[0,4,7,10],'secondary dominant prepares ii');
    assert.equal(q.bars[6].accompanimentHarmony.length,2);
    assert.equal(q.bars[6].accompanimentHarmony[0].chordSymbol,ii);
    assert.equal(q.bars[6].accompanimentHarmony[1].chordSymbol,'V7');
    for(const bar of q.bars) {
      for(const segment of bar.accompanimentHarmony) {
        const onset=bass(bar).find(e=>e.beat===segment.beat);
        assert.ok(onset);assert.equal(pc(onset.pitches[0]),pc(segment.pitches[0]));
        assert.equal(segment.beat%q.tempoPulseBeats,0,'harmony changes align with the main pulse');
      }
      assert.ok(bar.accompaniment.filter(e=>e.role==='bass-pattern-harmony').every(e=>e.pitches.length===4),'jazz colour reaches actual playback');
    }
    const line=q.bars.flatMap(bar=>bass(bar));
    line.forEach((event,i)=>{if(event.chromaticApproach) {chromaticApproaches++;assert.equal(Math.abs(line[i+1].pitches[0]-event.pitches[0]),1);}});
  }
  assert.ok(chromaticApproaches>0,'some examples include chromatic approaches into the next chord');
});

test('shared Alberti patterns preserve their low-high-middle-high shape above D3',()=>{
  for(const keyId of core.keysForLevel('N5'))for(const signature of core.variedSignaturesForLevel('N5'))for(const finalBar of [false,true]) {
    const events=window.MLH.AuralAccompaniment.eventsForBar({signature,notes:[{midi:60,beat:0,beats:signature.beats}],segments:[{beat:0,beats:signature.beats,pitches:core.keys[keyId].chords.I}],style:'alberti_bass',finalBar});
    assert.ok(events.length);assert.ok(events.every(e=>e.pitches.every(midi=>midi>=50)));
  }
});

test('bass patterns and melody use equal gain',()=>{
  for(const id of ['bass-walking','bass-ground','bass-alberti'])for(let run=0;run<80;run++) {
    const q=core.buildQuestion({level:'N5',topic:'bassPatterns',answerId:id,options:['bass-walking','bass-ground','bass-alberti'],mode:'choice'});
    assert.ok(q.notes.every(note=>note.volume===.82));
    for(const bar of q.bars) {
      for(const event of bass(bar)) {
        const melodyGain=.078*.82,bassGain=.018*event.volume;
        assert.ok(Math.abs(bassGain/melodyGain-1)<1e-8);
        const upper=bar.accompaniment.filter(e=>e.role==='bass-pattern-harmony'&&e.beat<=event.beat&&e.beat+e.beats>event.beat);
        const combined=Math.sqrt(bassGain*bassGain+upper.reduce((sum,e)=>sum+e.pitches.length*(.018*e.volume)**2,0));
        assert.ok(combined<=melodyGain*1.03,'quiet chord support adds at most three percent to the equal-gain bass part');
      }
    }
  }
});

test('jazz study has a swung spacious head, rootless right-hand chords and straight quarter bass',()=>{
  const offsets=pitches=>pitches.map(pitch=>(pc(pitch)-pc(pitches[0])+12)%12);
  let swungPairs=0;
  for(const keyId of core.keysForLevel('N5'))for(let run=0;run<50;run++) {
    const q=core.withGenerationContext({level:'N5',topic:'bassPatterns'},variation=>{variation.keyName=keyId;return core.makeN5BassPassage('bass-walking');});
    assert.equal(q.timeSignature.id,'4/4');assert.equal(q.tempoPulseBeats,1);
    assert.equal(q.bassJazzSwing,true);assert.deepEqual(q.bassJazzSwingRatio,[2,1]);
    for(const [index,bar] of q.bars.entries()) {
      const line=bass(bar);
      assert.deepEqual(line.map(e=>e.beat),[0,1,2,3]);
      assert.ok(line.every(e=>e.beats===.9));
      assert.equal(pc(line[0].pitches[0]),pc(bar.accompanimentHarmony[0].pitches[0]));
      if(index<7) {
        assert.equal(Math.abs(line[3].pitches[0]-bass(q.bars[index+1])[0].pitches[0]),1);
        assert.equal(line[3].chromaticApproach,true);
      }
      assert.ok(bar.notes.some(n=>n.rest),'each bar gives the melodic head breathing room');
      assert.ok(bar.notes.filter(n=>!n.rest).length<=6);
      if(index<7)assert.ok(new Set(bar.notes.filter(n=>!n.rest).map(n=>n.midi)).size>=2,'head has a contour rather than repeated single-note attacks');
      if(![3,7].includes(index))assert.ok(bar.notes.some(n=>!n.rest&&n.beat%1>0&&Math.floor(n.beat+n.beats-1e-8)>Math.floor(n.beat)),'offbeat lead note sustains across the next beat');
      for(const note of bar.notes)if(Math.abs(note.beats-1/3)<1e-8)swungPairs++;
      const comp=bar.accompaniment.filter(e=>e.role==='bass-pattern-harmony');
      assert.ok(comp.length>=1&&comp.length<=2);
      for(const event of comp) {
        const segment=[...bar.accompanimentHarmony].reverse().find(s=>s.beat<=event.beat);
        assert.equal(event.voicing,'rootless');assert.equal(event.pitches.length,4);
        assert.ok(Math.abs(event.beat%1-2/3)<1e-8);assert.equal(event.staccato,true);assert.ok(event.beats<=.24);
        assert.ok(event.pitches.every(pitch=>pc(pitch)!==pc(segment.pitches[0])),'bass supplies the omitted root');
        assert.ok(Math.min(...event.pitches)>Math.max(...line.flatMap(e=>e.pitches)),'right hand sits above bass');
        assert.ok(bar.notes.filter(n=>!n.rest).every(note=>note.midi>Math.max(...event.pitches)),'lead sits above the chord voicing');
      }
      assert.ok(Math.abs(bar.notes.reduce((sum,n)=>sum+n.beats,0)-4)<1e-8);
    }
    assert.ok(q.notes.every(n=>!n.rest&&Number.isFinite(n.midi)),'rests do not become played piano notes');
    if(keyId==='F') {
      assert.deepEqual(q.key.chords.ii7.map(pc),[7,10,2,5]);
      assert.deepEqual(q.key.chords.V7.map(pc),[0,4,7,10]);
      assert.deepEqual(q.key.chords.Imaj7.map(pc),[5,9,0,4]);
    }
  }
  assert.ok(swungPairs>0);
});

test('offbeat chord stabs cut off cleanly without shortening the walking bass',()=>{
  const fs=require('node:fs'),vm=require('node:vm'),{parser,generator}=require('@babel/standalone').packages;
  const html=fs.readFileSync(require('node:path').join(__dirname,'../auralrecognition.html'),'utf8');
  const jsx=[...html.matchAll(/<script\b[^>]*type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
  const tree=parser.parse(jsx,{sourceType:'script',plugins:['jsx']}),nodes=[];
  function walk(n){if(!n||typeof n!=='object')return;if(n.type)nodes.push(n);for(const v of Object.values(n)){if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}walk(tree);
  const fn=nodes.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='playAccompaniment');
  for(const bpm of [60,80,100]) {
    const tones=[],ramps=[],master={};
    const ctx={createGain:()=>({connect(){},gain:{setValueAtTime(){},linearRampToValueAtTime:(value,time)=>ramps.push({value,time})}})};
    const bar={accompaniment:[{beat:0,beats:.9,pitches:[48],volume:1},{beat:2/3,beats:.24,pitches:[58,62,65,69],volume:.4,staccato:true}]};
    const play=vm.runInNewContext('('+generator.default(fn).code+')',{question:{},midiToFrequency:n=>n,accompanimentMidi:n=>n,oscillator:(ctx,gain,midi,start,duration)=>tones.push({gain,midi,start,duration})});
    const beat=60/bpm;play(ctx,master,bar,0,beat,.12);
    assert.equal(tones[0].gain,master);assert.equal(tones[0].duration,.9*beat);
    assert.ok(tones.slice(1).every(t=>t.gain!==master));
    assert.equal(ramps.length,1);assert.equal(ramps[0].value,0);
    assert.ok(Math.abs(ramps[0].time-(.12+(2/3+.24)*beat))<1e-8);
  }
});

test('jazz lead uses tonic blues vocabulary with chord-tone targets through ii-V-I',()=>{
  const blueColours=new Set();let bluesCount=0,total=0;
  for(const keyId of core.keysForLevel('N5'))for(let run=0;run<60;run++) {
    const q=core.withGenerationContext({level:'N5',topic:'bassPatterns'},variation=>{variation.keyName=keyId;return core.makeN5BassPassage('bass-walking');});
    assert.deepEqual(q.jazzLeadBluesIntervals,[0,3,5,6,7,10]);
    const blues=new Set(q.jazzLeadBluesIntervals.map(interval=>(q.jazzLeadBluesTonic+interval)%12));
    for(const bar of q.bars)for(const note of bar.notes.filter(n=>!n.rest)) {
      total++;if(blues.has(pc(note.midi)))bluesCount++;
      blueColours.add((pc(note.midi)-q.jazzLeadBluesTonic+12)%12);
      const segment=[...bar.accompanimentHarmony].reverse().find(s=>s.beat<=note.beat);
      const guides=new Set([segment.pitches[1],segment.pitches[3]].map(pc));
      assert.ok(note.jazzAcciaccatura||blues.has(pc(note.midi))||guides.has(pc(note.midi)));
      if(!note.jazzAcciaccatura&&!note.jazzTriplet&&note.beat%1<1e-8)assert.ok(segment.pitches.map(pc).includes(pc(note.midi)),'on-beat targets fit the current harmony');
    }
    assert.equal(pc(q.notes.at(-1).midi),pc(q.key.tonic));
  }
  assert.ok(bluesCount/total>.65,'the lead is primarily blues-scale based');
  assert.ok([3,6,10].every(interval=>blueColours.has(interval)),'flat third, blue fifth and flat seventh all occur');
});

test('walking heads occasionally add true triplets and short resolving acciaccaturas',()=>{
  let triplets=0,graces=0;
  for(const keyId of core.keysForLevel('N5'))for(let run=0;run<60;run++) {
    const q=core.withGenerationContext({level:'N5',topic:'bassPatterns'},variation=>{variation.keyName=keyId;return core.makeN5BassPassage('bass-walking');});
    assert.ok([0,1].includes(q.jazzTripletCount));assert.ok([0,1].includes(q.jazzAcciaccaturaCount));
    assert.ok(q.jazzTripletCount+q.jazzAcciaccaturaCount<=1);
    triplets+=q.jazzTripletCount;graces+=q.jazzAcciaccaturaCount;
    for(const bar of q.bars) {
      const groups=new Map();
      for(const note of bar.notes) {
        if(note.jazzTriplet) {const group=groups.get(note.jazzTripletGroup)||[];group.push(note);groups.set(note.jazzTripletGroup,group);}
        if(note.jazzAcciaccatura) {
          const resolution=bar.notes[bar.notes.indexOf(note)+1];
          assert.equal(note.beats,.06);assert.equal(resolution.midi,note.graceMainMidi);
          assert.equal(Math.abs(note.midi-resolution.midi),1);
          assert.ok(Math.abs(resolution.beat-(note.beat+.06))<1e-8);
          assert.equal(resolution.jazzGraceResolution,true);
        }
      }
      for(const group of groups.values()) {
        assert.equal(group.length,3);assert.ok(group.every(note=>note.beats===1/3));
        assert.ok(Math.abs(group[1].beat-group[0].beat-1/3)<1e-8);
        assert.ok(Math.abs(group[2].beat-group[1].beat-1/3)<1e-8);
      }
      assert.ok(Math.abs(bar.notes.reduce((sum,n)=>sum+n.beats,0)-4)<1e-8);
    }
    assert.ok(q.bars[7].notes.every(n=>!n.jazzTriplet&&!n.jazzAcciaccatura),'ending stays uncluttered');
  }
  assert.ok(triplets>100&&triplets<380);assert.ok(graces>100&&graces<380);
});


test('ground rhythms vary while all four repeats and their harmonic timing stay exact',()=>{
  const styles=new Set();
  for(const signature of core.variedSignaturesForLevel('N5'))for(let run=0;run<30;run++) {
    const q=core.withGenerationContext({level:'N5',topic:'bassPatterns'},v=>{v.signature=signature;return core.makeN5BassPassage('bass-ground');});
    styles.add(q.bassGroundRhythmStyle);
    assert.equal(q.bars.length,8);
    for(let i=0;i<8;i++) {
      const events=bass(q.bars[i]);
      assert.deepEqual(events,bass(q.bars[i%2]));
      events.forEach((event,index)=>{
        const segment=q.bars[i].accompanimentHarmony[index];
        assert.ok(event.beat>=segment.beat&&event.beat+event.beats<=segment.beat+segment.beats+1e-8);
        assert.ok(event.gateRelease);
      });
    }
  }
  assert.deepEqual([...styles].sort(),['dotted','even','rest']);
});

test('Alberti register planning never increases boundary leaps compared with the lowest register',()=>{
  for(const keyId of core.keysForLevel('N5'))for(const signature of core.variedSignaturesForLevel('N5')) {
    const q=core.withGenerationContext({level:'N5',topic:'bassPatterns'},v=>{v.keyName=keyId;v.signature=signature;return core.makeN5BassPassage('bass-alberti');});
    let actual=0,baseline=0,lastActual=60,lastBaseline=60;
    q.bars.forEach(bar=>{
      const pitches=bass(bar).map(e=>e.pitches[0]);
      let root=q.key.chords[bar.chordSymbol][0];while(root<50)root+=12;while(root>=62)root-=12;
      // Derive the baseline by moving the whole cell down to its lowest legal root.
      const octaveShift=q.bassAlbertiRoots[bar.barIndex]-root;
      actual+=Math.abs(pitches[0]-lastActual);
      baseline+=Math.abs(pitches[0]-octaveShift-lastBaseline);
      lastActual=pitches.at(-1);lastBaseline=lastActual-octaveShift;
    });
    assert.ok(actual<=baseline);
    assert.ok(q.isolatedPassage.bars.every(bar=>bass(bar).every(e=>e.gateRelease)));
  }
});
