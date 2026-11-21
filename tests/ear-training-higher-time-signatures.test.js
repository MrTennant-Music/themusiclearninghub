const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
global.window={MLH:{useClickOutside(){}}};window.PracticeMelodyGenerator=require('../practice-melody-generator.js');require('../aural-accompaniment.js');require('../melodic-dictation-generator.js');const core=require('../ear-training-exercises.js');require('../ear-training-piano-concepts.js');require('../time-signatures-listening.js');require('../tempo-changes-listening.js');require('../aural-tonalities.js');const time=window.MLH.TimeSignaturesListening;
test('Higher inherits clear eight-bar simple and compound phrasing, with matched comparison pairs',()=>{
  const metres=new Set();
  for(let run=0;run<90;run++) {
    const simple=time.buildN4MetreListeningMelody('simple','H'),compound=time.buildN4MetreListeningMelody('compound','H');
    assert.equal(simple.metreComparisonId,compound.metreComparisonId);assert.equal(simple.key.id,compound.key.id);assert.deepEqual(simple.playbackTempo,compound.playbackTempo);
    assert.equal(simple.timeSignature.pulseCount,compound.timeSignature.pulseCount);
    for(const q of [simple,compound]) {
      metres.add(q.timeSignature.id);assert.equal(q.bars.length,8);assert.equal(q.clearOpeningBars,2);
      for(const bar of q.bars) {
        assert.ok(Math.abs(bar.notes.reduce((sum,n)=>sum+n.beats,0)-q.timeSignature.beats)<1e-8);
        assert.ok(bar.notes.every(n=>!n.rest&&n.midi>=57&&n.midi<=84));
        assert.ok(bar.accompaniment.every(e=>e.beat>=0&&e.beats>0&&e.beat+e.beats<=q.timeSignature.beats+1e-8));
      }
      assert.equal(q.bars[7].chordSymbol,'I');
    }
  }
  assert.deepEqual(metres,new Set(['2/4','3/4','4/4','6/8','9/8','12/8']));
});

test('Higher irregular and changing metres align every note and accompaniment pulse to cumulative bar starts',()=>{
  const groups=new Set(),routes=new Set(),keys=new Set();
  for(const answerId of ['metre-irregular','metre-change'])for(let run=0;run<400;run++) {
    const q=core.buildQuestion({level:'H',topic:'irregularMetre',answerId,options:['metre-irregular','metre-change'],mode:'choice'});keys.add(q.key.id);assert.equal(q.bars.length,8);
    let cursor=0;
    for(const bar of q.bars) {
      assert.equal(bar.startBeat,cursor);cursor+=bar.beats;
      assert.ok(Math.abs(bar.notes.reduce((sum,n)=>sum+n.beats,0)-bar.beats)<1e-8);
      assert.equal(bar.accompaniment.length,bar.timeSignature.pulseCount);assert.equal(bar.pulseOffsets.length,bar.timeSignature.pulseCount);
      assert.ok(bar.accompaniment.every((e,i)=>e.beat===i*bar.timeSignature.pulseQuarterBeats&&e.beat+e.beats<=bar.beats&&e.pitches.every(p=>p>=45)));
      assert.ok(bar.notes.every(n=>n.midi>=57&&n.midi<=84&&n.beat+n.beats<=bar.beats));
      const global=q.notes.filter(n=>n.barIndex===bar.barIndex);assert.deepEqual(global.map(n=>n.beat),bar.notes.map(n=>bar.startBeat+n.beat));
    }
    assert.equal(q.totalBeats,cursor);assert.deepEqual(q.bars.slice(-2).map(b=>b.chordSymbol),['V','I']);
    if(answerId==='metre-irregular') {
      groups.add(q.irregularGrouping);assert.ok(q.bars.every(b=>['5/4','7/4','5/8','7/8'].includes(b.timeSignature.id)));
      assert.equal(q.timeSignatureChanges.length,0);
      assert.ok(q.bars.every(b=>b.metrePulseAccents[Number(q.irregularGrouping[0])]>b.metrePulseAccents[1]));
    } else {
      routes.add(q.timeSignatureChanges.map(c=>c.signature).join(':'));
      const change=q.timeSignatureChanges[1].barIndex;assert.ok([2,4].includes(change));assert.notEqual(q.bars[change-1].beats,q.bars[change].beats);
    }
  }
  assert.equal(groups.size,5);assert.equal(routes.size,4);assert.equal(keys.size,8);
});

test('Higher menu avoids duplicate beat counts and retains the established two-or-four acceptance',()=>{
  let source=fs.readFileSync('generated-runtimes/auralrecognition-1.js','utf8');source=source.slice(0,source.lastIndexOf('const root=document.getElementById'))+';this.api={assessmentConceptIdsForLevel,isCorrectChoice};';
  const context=vm.createContext({window,React:{createElement(){return{}},Fragment:{}},URLSearchParams,location:{search:'',href:'http://localhost/auralrecognition.html'}});vm.runInContext(source,context);
  const ids=Array.from(context.api.assessmentConceptIdsForLevel('H','beatsPerBar'));
  assert.ok(!ids.includes('metre-3')&&!ids.includes('metre-4'));assert.ok(ids.includes('metre-irregular')&&ids.includes('metre-change'));assert.ok(ids.includes('simple')&&ids.includes('compound'));
  assert.equal(context.api.isCorrectChoice('beats-4',{type:'beatsPerBar',answerId:'beats-2'}),true);
  assert.equal(context.api.isCorrectChoice('beats-2',{type:'beatsPerBar',answerId:'beats-4'}),true);
});

test('Higher time-change playback and correction clicks use each bar’s actual start and length',()=>{
  const {parser,generator}=require('@babel/standalone').packages,html=fs.readFileSync('auralrecognition.html','utf8'),jsx=html.match(/<script type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/)[1];
  const tree=parser.parse(jsx,{plugins:['jsx']}),nodes=[];function walk(n){if(!n||typeof n!=='object')return;if(n.type)nodes.push(n);for(const v of Object.values(n)){if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}walk(tree);
  const play=nodes.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='play');
  const loop=play.body.body.find(n=>n.type==='ExpressionStatement'&&n.expression?.callee?.property?.name==='forEach'&&n.expression.callee.object?.object?.name==='question');
  assert.ok(loop);
  for(const answerId of ['metre-change','metre-irregular'])for(let run=0;run<40;run++) {
    const question=core.buildQuestion({level:'H',topic:'irregularMetre',answerId,options:[answerId],mode:'choice'}),clicks=[],harmony=[],tones=[];
    const scope={question,isTimeListening:true,tonalityReplay:false,harmonyReplay:false,metronome:false,countBeats:true,start:.12,beat:.75,ctx:{},master:{},harmonyGain:{},playClick:(ctx,gain,start,accent)=>clicks.push({start,accent}),playAccompaniment:(ctx,gain,bar,offset)=>harmony.push(offset),melodyPlaybackBeats:(bar,i)=>bar.notes[i].beats,playMelodyNote:(ctx,gain,midi,start,duration)=>tones.push({start,duration}),midiToFrequency:n=>n,effectiveMidiForNote:(q,b,n)=>n.midi};
    vm.runInNewContext(generator.default(loop).code,scope);
    assert.deepEqual(harmony,question.bars.map(b=>b.startBeat*.75));
    assert.equal(clicks.length,question.bars.reduce((sum,b)=>sum+b.pulseOffsets.length,0));
    question.bars.forEach(bar=>assert.ok(clicks.some(c=>c.accent&&Math.abs(c.start-(.12+bar.startBeat*.75))<1e-8)));
    assert.ok(tones.every(t=>t.start+t.duration<=.12+question.totalBeats*.75+1e-8));
  }
});

test('Higher 5/4 grouping is carried by melody and sustained harmonic groups, and time changes recall the motif',()=>{
  const positions=new Set(),groups=new Set();
  for(let run=0;run<240;run++) {
    const irregular=core.buildQuestion({level:'H',topic:'irregularMetre',answerId:'metre-irregular',options:[],mode:'choice'}),boundary=Number(irregular.irregularGrouping[0]);groups.add(irregular.irregularGrouping);
    for(const bar of irregular.bars) {
      const unit=bar.timeSignature.pulseQuarterBeats,parts=irregular.irregularGrouping.split('+').map(Number),starts=parts.map((_,i)=>parts.slice(0,i).reduce((a,b)=>a+b,0));
      assert.deepEqual(bar.accompaniment.filter(e=>e.groupAttack).map(e=>e.beat),starts.map(at=>at*unit));
      starts.forEach((at,i)=>assert.ok(Math.abs(bar.accompaniment[at].beats-parts[i]*unit*.88)<1e-8));
      assert.deepEqual(bar.pulseAccents,Array.from({length:bar.timeSignature.pulseCount},(_,i)=>starts.includes(i)));
      assert.ok(bar.metrePulseAccents[0]/bar.metrePulseAccents[1]<1.5);
    }
    const change=core.buildQuestion({level:'H',topic:'irregularMetre',answerId:'metre-change',options:[],mode:'choice'}),at=change.timeSignatureChanges[1].barIndex;positions.add(at);
    const opening=change.bars[0],recall=change.bars[at],common=Math.min(opening.notes.length,recall.notes.length);
    assert.deepEqual(opening.notes.slice(0,common).map(n=>n.midi),recall.notes.slice(0,common).map(n=>n.midi));
    assert.ok(change.bars.every(bar=>bar.notes.every(n=>!n.rest)));
    assert.ok(change.bars.slice(0,7).every(bar=>bar.notes.every(n=>n.beats===1)),'comparable crotchet density with no pause or tempo cue');
  }
  assert.deepEqual(positions,new Set([2,4]));assert.deepEqual(groups,new Set(['3+2','2+3','2+2+3','2+3+2','3+2+2']));
});

test('Higher time correction replays the actual grouping or transition with correctly accented clicks once',()=>{
  const {parser,generator}=require('@babel/standalone').packages,html=fs.readFileSync('auralrecognition.html','utf8'),jsx=html.match(/<script type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/)[1];
  const tree=parser.parse(jsx,{plugins:['jsx']}),nodes=[];function walk(n){if(!n||typeof n!=='object')return;if(n.type)nodes.push(n);for(const v of Object.values(n)){if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}walk(tree);
  const play=nodes.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='play'),branch=play.body.body.find(n=>n.type==='IfStatement'&&n.test.name==='passage'),audio=nodes.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='playAudioOnlyNotes'),helper=nodes.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='higherTimeReplayExample');
  const extract=vm.runInNewContext('('+generator.default(helper).code+')');
  for(const answerId of ['metre-irregular','metre-change'])for(const metronome of [false,true])for(let run=0;run<40;run++) {
    const question=core.buildQuestion({level:'H',topic:'irregularMetre',answerId,options:[],mode:'choice'}),passage=extract(question),clicks=[],schedules=[],tones=[],harmony=[];let advances=0;
    const scope={question,passage,timeReplay:true,pickupReplay:false,rhythmReplay:false,intervalReplay:false,chordReplay:false,bassReplay:false,cadenceReplay:false,melodyReplay:false,fullPassage:true,questionTopic:'irregularMetre',metronome,start:.12,beat:.75,ctx:{currentTime:0},master:{},harmonyGain:{},playClick:(ctx,gain,start,accent)=>clicks.push({start,accent}),playAccompaniment:(ctx,gain,bar,offset)=>harmony.push(offset),oscillator:(ctx,gain,midi,start)=>tones.push(start),midiToFrequency:n=>n,melodyMidi:n=>n,timers:{current:[]},setTimeout:(fn,ms)=>{schedules.push({fn,ms});return 1;},stopAudio(){},newQuestion(){advances++;},window:{MLH:{naturalPlaybackTailMs:()=>650}}};
    const context=vm.createContext(scope);vm.runInContext(generator.default(audio).code,context);vm.runInContext('(function(){'+generator.default(branch).code+'})()',context);
    assert.equal(passage.bars.length,3);assert.equal(schedules.length,1);assert.equal(clicks.length,passage.bars.reduce((sum,b)=>sum+b.pulseOffsets.length,0));assert.equal(new Set(clicks.map(c=>c.start)).size,clicks.length);
    assert.equal(clicks.filter(c=>c.accent).length,answerId==='metre-irregular'?3*question.irregularGrouping.split('+').length:3);
    assert.ok(tones.every(t=>t>=.12&&t<.12+passage.totalBeats*.75));
    assert.deepEqual(harmony,Array.from(passage.bars,b=>b.startBeat*.75));
    schedules[0].fn();assert.equal(advances,1);
  }
});

test('normal Higher time questions give stable irregular metre and time changes equal exposure',()=>{
  let source=fs.readFileSync('generated-runtimes/auralrecognition-1.js','utf8');source=source.slice(0,source.lastIndexOf('const root=document.getElementById'))+';this.api={buildQuestion,defaultConceptIdsForLevel};';
  const context=vm.createContext({window,React:{createElement(){return{}},Fragment:{}},URLSearchParams,location:{search:'',href:'http://localhost/auralrecognition.html'}});vm.runInContext(source,context);
  const ids=context.api.defaultConceptIdsForLevel('H'),counts={};
  for(let run=0;run<360;run++){const q=context.api.buildQuestion('H',ids,'beatsPerBar');counts[q.answerId]=(counts[q.answerId]||0)+1;}
  assert.equal(counts['metre-irregular'],60);assert.equal(counts['metre-change'],60);
});

test('Higher irregular pool includes 5/4, 7/4, 5/8 and 7/8 with correct quaver timing',()=>{
  const counts={};
  for(let run=0;run<240;run++) {
    const q=core.buildQuestion({level:'H',topic:'irregularMetre',answerId:'metre-irregular',options:[],mode:'choice'}),signature=q.timeSignature;
    counts[signature.id]=(counts[signature.id]||0)+1;
    assert.equal(q.totalBeats,8*Number(signature.top)*4/Number(signature.bottom));assert.equal(q.tempoPulseBeats,1);
    const units=q.irregularGrouping.split('+').map(Number);assert.equal(units.reduce((a,b)=>a+b,0),signature.top);
    assert.ok(q.bars.slice(0,7).every(b=>b.notes.every(n=>n.beats===signature.pulseQuarterBeats)));
  }
  assert.deepEqual(Object.keys(counts).sort(),['5/4','5/8','7/4','7/8']);
  Object.values(counts).forEach(count=>assert.ok(count>=58&&count<=62));
});
