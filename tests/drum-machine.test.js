const test=require('node:test'),assert=require('node:assert/strict'),D=require('../drum-machine-core');
test('drum machine exposes ten playable standard instruments and blank editable pattern',()=>{const d=D.create();assert.equal(D.tracks.length,10);assert.equal(new Set(D.tracks.map(t=>t.midi)).size,10);assert.equal(d.patterns[0].tracks[0].steps.length,16);assert.deepEqual(D.events(d,4),[]);});
test('all presets create valid sequences in simple and compound metres',()=>{for(const metre of [2,3,3.5,4,4.5,6])for(const name of Object.keys(D.presets)){const d=D.preset(name,metre);assert.deepEqual(D.validateDrums(d,metre),d);const e=D.events(d,metre*2,metre);assert.ok(e.some(e=>e.trackId==='kick'));assert.ok(e.every(e=>e.beat>=0&&e.beat<metre*2&&e.velocity>0&&e.velocity<=1));}});
test('per-hit velocity, per-track volume/pan, mute and solo change real playback events',()=>{const d=D.create(),[kick,snare]=d.patterns[0].tracks;kick.steps[0]=127;kick.volume=50;kick.pan=-.5;snare.steps[0]=80;assert.equal(D.events(d,4)[0].velocity,.5);assert.equal(D.events(d,4)[0].pan,-.5);snare.solo=true;assert.deepEqual(D.events(d,4).map(e=>e.trackId),['snare']);snare.mute=true;assert.equal(D.events(d,4).length,0);});
test('named patterns and sequence repeats play in order and loop the complete sequence',()=>{const d=D.create(),p=structuredClone(d.patterns[0]);d.patterns[0].tracks[0].steps[0]=100;p.name='Fill';p.tracks[1].steps[0]=100;d.patterns.push(p);d.sequence=[{pattern:0,repeats:2},{pattern:1,repeats:1}];const e=D.events(d,20);assert.deepEqual(e.map(e=>[e.beat,e.trackId]),[[0,'kick'],[4,'kick'],[8,'snare'],[12,'kick'],[16,'kick']]);assert.equal(D.sequenceBeats(d),12);});
test('resolution and bar resizing preserve beat positions without mutating input',()=>{const d=D.create();d.patterns[0].tracks[0].steps[4]=110;const next=D.resizePattern(d,0,2,8);assert.equal(next.patterns[0].tracks[0].steps.length,64);assert.equal(next.patterns[0].tracks[0].steps[8],110);assert.equal(d.patterns[0].tracks[0].steps.length,16);const changed=D.resizePattern(d,0,1,4,3,4);assert.equal(changed.patterns[0].tracks[0].steps.length,12);assert.equal(changed.patterns[0].tracks[0].steps[4],110);});
test('legacy three-track half-beat patterns migrate without changing hit times',()=>{const legacy=Array.from({length:3},()=>Array(16).fill(false));legacy[0][0]=true;legacy[1][3]=true;legacy[2][15]=true;const d=D.migrate(legacy);assert.equal(d.patterns[0].bars,2);assert.deepEqual(D.events(d,8).map(e=>[e.beat,e.midi]),[[0,36],[1.5,38],[7.5,42]]);});
test('swing and deterministic humanisation never place hits outside arrangement bounds',()=>{const d=D.preset('rock');d.swing=100;d.humanize=100;d.patterns[0].tracks[0].steps[1]=100;const e=D.events(d,2);assert.ok(e.every(n=>n.beat>=0&&n.beat<2&&n.duration>0));assert.deepEqual(e,D.events(d,2));assert.ok(e.find(n=>n.trackId==='kick'&&n.stepIndex===1).beat>.25);});
test('malformed imported patterns, sequence indices, hit velocities and mixer values are rejected',()=>{for(const mutate of [d=>d.patterns[0].tracks[0].steps[0]=128,d=>d.patterns[0].tracks[0].pan=3,d=>d.sequence[0].pattern=99,d=>d.patterns[0].tracks.pop(),d=>d.subdivision=99,d=>d.kit='unknown']){const d=D.create();mutate(d);assert.throws(()=>D.validateDrums(d));}});

test('drum starting beats are offered only in matching time signatures',()=>{
 assert.ok(D.presetsForSignature('3/4').waltz);assert.ok(!D.presetsForSignature('4/4').waltz);assert.ok(!D.presetsForSignature('6/8').waltz);
 assert.deepEqual(Object.keys(D.presetsForSignature('6/8')),['sixEight']);
 assert.ok(D.presetsForSignature('4/4').rock);assert.ok(!D.presetsForSignature('3/4').rock);
});

test('sixteenth-note recording can retain triplet hits on a common drum grid',()=>{
 const d=D.resizePattern(D.create(),0,1,3,4);d.patterns[0].tracks[0].steps[1]=90;
 const expanded=D.resizePattern(d,0,1,12,4);
 assert.equal(expanded.patterns[0].tracks[0].steps[4],90);
 expanded.patterns[0].tracks[0].steps[3]=100;
 const hits=D.events(expanded,4).filter(e=>e.midi===36);
 assert.deepEqual(hits.map(e=>e.beat),[.25,1/3]);
});

test('randomising drums fills each metre while preserving kit, pattern length, mix and other patterns',()=>{
 for(const signature of ['3/4','4/4','6/8']){
  const beats=signature==='4/4'?4:3,d=D.create(beats);d.kit='electronic';
  d.patterns.push(structuredClone(d.patterns[0]));d.patterns[1].tracks[0].steps[1]=100;
  const before=JSON.stringify(d),next=D.randomisePattern(d,0,signature,()=>.3);
  assert.equal(JSON.stringify(d),before);assert.equal(next.kit,d.kit);
  assert.deepEqual(next.patterns[1],d.patterns[1]);
  assert.equal(next.patterns[0].tracks[0].steps.length,d.patterns[0].tracks[0].steps.length);
  const hits=D.events(next,beats,beats);assert.ok(hits.length>3);assert.ok(hits.every(e=>e.beat>=0&&e.beat<beats));
  assert.ok(next.patterns[0].tracks.find(t=>t.id==='kick').steps[0]>0);
  assert.ok(next.patterns[0].tracks.find(t=>t.id==='snare').steps[signature==='6/8'?6:4]>0);
 }
});

test('randomiser offers distinct metre-specific grooves covering the full kit',()=>{
 const used=new Set();
 for(const signature of ['4/4','3/4','6/8']){
  const beats=signature==='4/4'?4:3,choices=D.groovesForSignature(signature),names=new Set();
  assert.ok(choices.length>=(signature==='4/4'?12:4));
  for(let i=0;i<choices.length;i++){
   let first=true;const random=()=>{if(first){first=false;return(i+.1)/choices.length;}return .9;};
   const result=D.randomisePattern(D.create(beats),0,signature,random),pattern=result.patterns[0];
   names.add(pattern.name);
   for(const track of pattern.tracks)if(track.steps.some(Boolean))used.add(track.id);
   const open=pattern.tracks.find(t=>t.id==='openHat'),closed=pattern.tracks.find(t=>t.id==='hat');
   assert.ok(open.steps.every((hit,j)=>!hit||!closed.steps[j]));
   assert.ok(D.events(result,beats,beats).every(e=>e.beat>=0&&e.beat<beats));
  }
  assert.equal(names.size,choices.length);
 }
 assert.deepEqual([...used].sort(),D.tracks.map(t=>t.id).sort());
});
test('random drum fills fit coarse, fine and triplet grids in every supported metre',()=>{
 for(const signature of ['3/4','4/4','6/8'])for(const subdivision of [2,3,4,6,8]){
  const beats=signature==='4/4'?4:3,d=D.resizePattern(D.create(beats),0,4,subdivision,beats);
  let seed=17;const random=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
  const result=D.randomisePattern(d,0,signature,random);
  assert.equal(result.subdivision,subdivision);assert.equal(result.patterns[0].bars,4);
  assert.ok(D.events(result,4*beats,beats).every(e=>e.beat<4*beats&&e.velocity>0&&e.velocity<=1));
 }
});

 test('legacy ride-bell rows are removed without losing the other saved drum hits',()=>{const original=D.create();original.patterns[0].tracks[0].steps[0]=110;original.patterns[0].tracks.splice(7,0,{id:'bell',volume:100,pan:0,mute:false,solo:false,steps:Array(16).fill(90)});const restored=D.validateDrums(original);assert.equal(restored.patterns[0].tracks.length,10);assert.ok(!restored.patterns[0].tracks.some(t=>t.id==='bell'));assert.equal(restored.patterns[0].tracks[0].steps[0],110);assert.equal(original.patterns[0].tracks.length,11);assert.ok(!D.events(restored,4).some(e=>e.midi===53));});

test('legacy rim and ride-bell tracks are both retired while keeping the rest of a session',()=>{const original=D.create();original.patterns[0].tracks[1].steps[4]=100;for(const id of ['rim','bell'])original.patterns[0].tracks.push({id,volume:100,pan:0,mute:false,solo:false,steps:Array(16).fill(80)});const restored=D.validateDrums(original);assert.equal(restored.patterns[0].tracks.length,10);assert.equal(restored.patterns[0].tracks[1].steps[4],100);assert.ok(D.events(restored,4).every(event=>![37,53].includes(event.midi)));assert.equal(original.patterns[0].tracks.length,12);});

test('expanded drum bank contains 126 distinct kit-only grooves in the correct metres',()=>{
 const ids=new Set(D.tracks.map(t=>t.id));let count=0;
 for(const [signature,expected] of [['4/4',78],['3/4',24],['6/8',24]]){
  const grooves=D.groovesForSignature(signature),beats=signature==='4/4'?4:3,shapes=new Set();
  assert.equal(grooves.length,expected);count+=grooves.length;
  for(const groove of grooves){
   const shape=JSON.stringify(Object.entries(groove.hits).sort().map(([id,hits])=>[id,hits.slice().sort((a,b)=>a-b)]));assert.ok(!shapes.has(shape),groove.name);shapes.add(shape);
   for(const bar of groove.bars||[groove.hits])for(const [id,hits] of Object.entries(bar)){
    assert.ok(ids.has(id),id);assert.ok(hits.every(n=>Number.isFinite(n)&&n>=0&&n<beats),groove.name);
   }
  }
 }
 assert.equal(count,126);
});
test('drum shuffle bags play each groove before repeating and keep independent metre pools',()=>{
 let seed=7;const choose=D.createGrooveShuffler(()=>{seed=seed*16807%2147483647;return seed/2147483647;});
 for(const signature of ['4/4','3/4','6/8']){
  const choices=D.groovesForSignature(signature);let previous='';
  for(let cycle=0;cycle<2;cycle++){
   const names=new Set();for(let i=0;i<choices.length;i++){const next=choose(choices,previous);assert.notEqual(next.name,previous);names.add(next.name);previous=next.name;}
   assert.equal(names.size,choices.length);
  }
 }
});
test('longer drum patterns alternate related groove bars',()=>{
 const source=D.resizePattern(D.create(),0,2,4,4);
 const result=D.randomisePattern(source,0,'4/4',()=>.9,choices=>choices.find(g=>g.name==='Straight rock'));
 const kick=result.patterns[0].tracks.find(t=>t.id==='kick').steps;
 assert.deepEqual(kick.slice(0,16).flatMap((v,i)=>v?[i]:[]),[0,8]);
 assert.deepEqual(kick.slice(16).flatMap((v,i)=>v?[i]:[]),[0,6,8,14]);
});


test('randomising a groove does not append a descending tom fill',()=>{
 for(const chance of [0,.1,.3,.44,.8]){
  const result=D.randomisePattern(D.create(),0,'4/4',()=>chance,choices=>choices.find(g=>g.name==='Straight rock'));
  for(const id of ['tomHigh','tomMid','tomLow'])assert.ok(result.patterns[0].tracks.find(t=>t.id===id).steps.every(v=>v===0));
 }
});


test('bar 1 edits follow into linked bars while independently edited bars stay detached until Clear',()=>{
 for(const beats of [3,4]){
  const width=beats*4,original=D.create(beats);
  let drums=D.editLinkedStep(original,'kick',0,110,beats);
  assert.equal(original.patterns[0].bars,1);
  const steps=()=>drums.patterns[0].tracks.find(t=>t.id==='kick').steps;
  for(let bar=0;bar<4;bar++)assert.equal(steps()[bar*width],110);
  drums=D.editLinkedStep(drums,'snare',width+2,100,beats);
  assert.deepEqual(drums.linkedBars,[true,false,true,true]);
  drums=D.editLinkedStep(drums,'kick',0,0,beats);
  assert.equal(steps()[width],110);assert.equal(steps()[0],0);assert.equal(steps()[width*2],0);assert.equal(steps()[width*3],0);
  drums=D.editLinkedStep(drums,'kick',width*3+1,90,beats);
  drums=D.editLinkedStep(drums,'kick',1,120,beats);
  assert.equal(steps()[width*3+1],90);assert.equal(steps()[width*2+1],120);
  drums=D.validateDrums(JSON.parse(JSON.stringify(drums)),beats);
  assert.deepEqual(drums.linkedBars,[true,false,true,false]);
  drums=D.clearLinkedDrums(drums,beats);
  assert.deepEqual(drums.linkedBars,[true,true,true,true]);assert.ok(steps().every(n=>n===0));
  drums=D.editLinkedStep(drums,'kick',0,100,beats);
  for(let bar=0;bar<4;bar++)assert.equal(steps()[bar*width],100);
 }
});
test('legacy independent drum bars open as custom bars in Composition Studio',()=>{
 let drums=D.editLinkedStep(D.create(),'kick',0,100);
 drums=D.editLinkedStep(drums,'kick',16,0);
 drums=D.editLinkedStep(drums,'snare',20,110);
 assert.deepEqual(D.events(drums,16).map(e=>[e.beat,e.trackId]),[[0,'kick'],[5,'snare'],[8,'kick'],[12,'kick']]);
 const C=require('../chord-generator-core'),p=C.asStudio({version:1,key:0,mode:'major',tempo:120,timeSignature:'4/4',drums,sections:[{chords:[{symbol:'C',beats:4}]}]});
 assert.deepEqual(p.drums.studioCustomBars,[false,true,false,false]);assert.deepEqual(D.events(p.drums,16).map(e=>[e.beat,e.trackId]),[[0,'kick'],[5,'snare'],[8,'kick'],[12,'kick']]);
});
test('randomising a linked bar updates followers without replacing detached bars',()=>{
 let drums=D.editLinkedStep(D.create(),'snare',17,120);
 drums=D.randomiseLinkedBar(drums,0,'4/4',()=>.9,choices=>choices.find(g=>g.name==='Straight rock'));
 const snare=drums.patterns[0].tracks.find(t=>t.id==='snare').steps;
 assert.equal(snare[17],120);assert.equal(snare[20],0);assert.ok(snare[4]>0);assert.equal(snare[36],snare[4]);
 drums=D.randomiseLinkedBar(drums,2,'4/4',()=>.9,choices=>choices.find(g=>g.name==='Straight rock'));
 assert.deepEqual(drums.linkedBars,[true,false,false,true]);
});


test('eight-bar linked drums can edit bar eight and reconnect on Clear',()=>{
 let drums=D.linkedStudioDrums(D.create(),4,8);
 drums=D.editLinkedStep(drums,'kick',0,100);
 let track=drums.patterns[0].tracks.find(t=>t.id==='kick');assert.equal(track.steps[112],100);
 drums=D.editLinkedStep(drums,'kick',112,110);
 drums=D.editLinkedStep(drums,'kick',0,80);
 track=drums.patterns[0].tracks.find(t=>t.id==='kick');assert.equal(track.steps[112],110);assert.equal(track.steps[96],80);
 drums=D.randomiseLinkedBar(drums,7,'4/4',()=>.9,choices=>choices.find(g=>g.name==='Straight rock'));
 assert.equal(drums.patterns[0].bars,8);assert.equal(drums.linkedBars[7],false);
 drums=D.clearLinkedDrums(drums);assert.equal(drums.linkedBars.length,8);assert.ok(drums.linkedBars.every(Boolean));
});


test('same/different pattern mode links all bars or makes them fully independent',()=>{
 for(const bars of [4,8]){
  let drums=D.setPatternMode(D.linkedStudioDrums(D.create(),4,bars),'same');
  drums=D.editLinkedStep(drums,'kick',0,100);
  assert.ok(drums.patterns[0].tracks.find(t=>t.id==='kick').steps.filter((_,i)=>i%16===0).every(v=>v===100));
  drums=D.setPatternMode(drums,'different');
  assert.deepEqual(drums.linkedBars,[true,...Array(bars-1).fill(false)]);
  drums=D.editLinkedStep(drums,'kick',0,70);
  assert.equal(drums.patterns[0].tracks.find(t=>t.id==='kick').steps[16],100);
  drums=D.editLinkedStep(drums,'kick',(bars-1)*16,110);
  drums=D.validateDrums(JSON.parse(JSON.stringify(drums)));assert.equal(drums.patternMode,'different');
  drums=D.setPatternMode(drums,'same');
  assert.ok(drums.linkedBars.every(Boolean));assert.equal(drums.patterns[0].tracks.find(t=>t.id==='kick').steps[(bars-1)*16],70);
  drums=D.clearLinkedDrums(drums);assert.equal(drums.patternMode,'same');
 }
});

test('random cymbal accents distinguish three simple beats from two compound beats',()=>{
 for(const [signature,name,pulseSteps,weakStep] of [
  ['3/4','Waltz',[0,4,8],6],['4/4','Pop',[0,4,8,12],2],['6/8','6/8 ballad',[0,6],4]
 ]){
  const beats=signature==='4/4'?4:3;
  const result=D.randomisePattern(D.create(beats),0,signature,()=>.5,choices=>choices.find(g=>g.name===name));
  const hats=result.patterns[0].tracks.find(t=>t.id==='hat').steps;
  for(const step of pulseSteps)assert.ok(hats[step]>hats[weakStep],`${signature}: pulse at step ${step}`);
 }
});
test('linked randomiser keeps separate groove pools when metre changes, including equal-length 3/4 and 6/8',()=>{
 const choose=D.createGrooveShuffler(()=>.41);
 let drums=D.linkedStudioDrums(D.create(4),4,8),previousBeats=4;
 for(const signature of ['4/4','3/4','6/8','3/4','4/4','6/8']){
  const beats=signature==='4/4'?4:3;
  drums=D.resizePattern(drums,0,8,4,beats,previousBeats);previousBeats=beats;
  const names=new Set(),choices=D.groovesForSignature(signature);
  for(let i=0;i<choices.length;i++){
   drums=D.randomiseLinkedBar(drums,0,signature,()=>.5,choose);
   assert.ok(choices.some(g=>g.name===drums.patterns[0].name));names.add(drums.patterns[0].name);
   for(const track of drums.patterns[0].tracks){
    assert.equal(track.steps.length,8*beats*4);
    for(let bar=1;bar<8;bar++)assert.deepEqual(track.steps.slice(bar*beats*4,(bar+1)*beats*4),track.steps.slice(0,beats*4));
   }
   assert.ok(D.events(drums,8*beats,beats).every(e=>e.beat>=0&&e.beat<8*beats));
  }
  assert.equal(names.size,choices.length);
 }
});
test('randomise rejects a groove from another metre',()=>{
 assert.throws(()=>D.randomisePattern(D.create(3),0,'6/8',()=>.5,()=>D.groovesForSignature('3/4')[0]),/matching the selected time signature/);
 assert.throws(()=>D.randomisePattern(D.create(),0,'5/4'),/Choose 2\/4, 3\/4, 4\/4 or 6\/8/);
});

test('scoped drum edits, randomise, clear and reset preserve a separate main pattern, including custom bar 1',()=>{
 for(const signature of ['4/4','3/4','6/8'])for(const bars of [4,8]){
  const beats=signature==='4/4'?4:3,width=beats*4;
  let d=D.studioDrums(D.create(beats),beats,bars);
  d=D.editStudioStep(d,'all','kick',0,100,beats);
  const original=JSON.stringify(d);
  let custom=D.editStudioStep(d,0,'snare',4,110,beats);
  custom=D.editStudioStep(custom,2,'hat',2,70,beats);
  assert.equal(JSON.stringify(d),original);
  assert.deepEqual(custom.studioCustomBars.slice(0,4),[true,false,true,false]);
  assert.equal(custom.studioMain.snare[4],0);
  assert.equal(custom.patterns[0].tracks.find(t=>t.id==='snare').steps[4],110);
  assert.equal(custom.patterns[0].tracks.find(t=>t.id==='snare').steps[width+4],0);
  const random=D.randomiseStudioPattern(custom,1,signature,()=>.8);
  assert.deepEqual(random.studioMain,custom.studioMain);
  assert.deepEqual(random.patterns[0].tracks.map(t=>t.steps.slice(0,width)),custom.patterns[0].tracks.map(t=>t.steps.slice(0,width)));
  const cleared=D.clearStudioPattern(random,1,beats);
  assert.ok(cleared.patterns[0].tracks.every(t=>t.steps.slice(width,2*width).every(v=>v===0)));
  assert.deepEqual(cleared.studioMain,custom.studioMain);
  const restored=D.restoreStudioBar(custom,0,beats);
  assert.equal(restored.studioCustomBars[0],false);
  for(const t of restored.patterns[0].tracks)assert.deepEqual(t.steps.slice(0,width),restored.studioMain[t.id]);
  const all=D.randomiseStudioPattern(custom,'all',signature,()=>.5);
  assert.ok(all.studioCustomBars.every(v=>!v));
  for(const t of all.patterns[0].tracks)for(let i=0;i<bars;i++)assert.deepEqual(t.steps.slice(i*width,(i+1)*width),all.studioMain[t.id]);
  const C=require('../chord-generator-core');
  const p=C.asStudio({version:1,key:0,mode:'major',tempo:120,timeSignature:signature,progressionBars:bars,drums:custom,sections:[{chords:[{symbol:'C',beats}]}]});
  const opened=C.asStudio(C.importSongMidi(C.songMidi(p)));
  assert.deepEqual(opened.drums,p.drums);
  const resized=D.studioDrums(D.resizePattern(custom,0,bars,4,4,beats),4,bars);
  assert.equal(resized.patterns[0].tracks.find(t=>t.id==='hat').steps[2*16+2],70);
 }
});
