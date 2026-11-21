const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {parser,generator}=require('@babel/standalone').packages;
global.window={MLH:{useClickOutside(){}}};window.PracticeMelodyGenerator=require('../practice-melody-generator.js');require('../aural-accompaniment.js');require('../melodic-dictation-generator.js');const core=require('../ear-training-exercises.js');require('../ear-training-piano-concepts.js');require('../time-signatures-listening.js');require('../tempo-changes-listening.js');require('../aural-tonalities.js');
test('Higher rhythmic transformations preserve every pitch, rhythm proportion and rest in complete native bars',()=>{
  const keys=new Set(),metres=new Set(),rhythms=new Set();let rests=0;
  for(const answerId of ['rhythm-augmentation','rhythm-diminution'])for(let run=0;run<800;run++) {
    const q=core.buildQuestion({level:'H',topic:'rhythmicChange',answerId,options:[answerId],mode:'choice'});
    keys.add(q.key.id);metres.add(q.timeSignature.id);rhythms.add(JSON.stringify(q.rhythmBaseDurations));assert.equal(q.bars.length,8);
    const [first,second]=q.rhythmStatements;assert.ok(first.length>=4&&first.length<=6);
    first.forEach((note,i)=>{assert.equal(second[i].midi,note.midi);assert.equal(second[i].rest,note.rest);assert.equal(second[i].beats,note.beats*q.rhythmFactor);if(note.rest)rests++;});
    for(const bar of q.bars) {
      assert.ok(Math.abs(bar.notes.reduce((sum,n)=>sum+n.beats,0)-q.timeSignature.beats)<1e-8);
      assert.ok(bar.notes.every(n=>n.rest||(n.midi>=57&&n.midi<=84)));
      assert.ok(bar.notes.every(n=>n.beat+n.beats<=q.timeSignature.beats+1e-8));
      for(const e of bar.accompaniment)assert.ok(e.beat>=0&&e.beats>0&&e.beat+e.beats<=q.timeSignature.beats+1e-8&&e.pitches.every(n=>n>=45));
      if(bar.barIndex>=2&&bar.barIndex<6)for(const e of bar.accompaniment)assert.ok(Math.abs(e.beat/q.timeSignature.pulseQuarterBeats-Math.round(e.beat/q.timeSignature.pulseQuarterBeats))<1e-8);
    }
    assert.deepEqual(q.bars.slice(-2).map(b=>b.chordSymbol),['V','I']);
    assert.equal(q.rhythmReplayPassage.notes.filter(n=>n.statement===0).length,first.filter(n=>!n.rest).length);
  }
  assert.equal(keys.size,8);assert.equal(metres.size,4);assert.ok(rhythms.size>=9);assert.ok(rests>100);
});

test('Higher correction replay has one metronome pulse per beat and one completion action',()=>{
  const html=fs.readFileSync('auralrecognition.html','utf8'),jsx=html.match(/<script type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/)[1];
  const tree=parser.parse(jsx,{plugins:['jsx']}),nodes=[];function walk(n){if(!n||typeof n!=='object')return;if(n.type)nodes.push(n);for(const v of Object.values(n)){if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}walk(tree);
  const play=nodes.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='play'),branch=play.body.body.find(n=>n.type==='IfStatement'&&n.test.name==='passage'),audio=nodes.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='playAudioOnlyNotes'),pickupHelper=nodes.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='higherPickupReplayExample');
  for(const topic of ['rhythmicChange','anacrusis'])for(const metronome of [false,true])for(let run=0;run<24;run++) {
    const question=core.buildQuestion({level:'H',topic,answerId:topic==='anacrusis'?(run%2?'anacrusis-yes':'anacrusis-no'):(run%2?'rhythm-augmentation':'rhythm-diminution'),options:[],mode:'choice'});
    const pickup=topic==='anacrusis';
    const helper=vm.runInNewContext('('+generator.default(pickupHelper).code+')');
    const passage=pickup?helper(question):question.rhythmReplayPassage;
    const schedules=[],clicks=[],tones=[];let advances=0;
    const scope={question,passage,fullPassage:true,rhythmReplay:!pickup,timeReplay:false,pickupReplay:pickup,intervalReplay:false,chordReplay:false,bassReplay:false,cadenceReplay:false,melodyReplay:false,questionTopic:topic,metronome,start:.12,beat:.75/(question.tempoPulseBeats||question.timeSignature.pulseQuarterBeats),ctx:{currentTime:0},master:{},harmonyGain:{},playAccompaniment(){},playClick:(ctx,gain,start,accent)=>clicks.push({start,accent}),oscillator:(ctx,gain,midi,start)=>tones.push({midi,start}),midiToFrequency:n=>n,melodyMidi:n=>n,timers:{current:[]},setTimeout:(fn,ms)=>{schedules.push({fn,ms});return 1;},stopAudio(){},newQuestion(){advances++;},window:{MLH:{naturalPlaybackTailMs:()=>650}}};
    const context=vm.createContext(scope);vm.runInContext(generator.default(audio).code,context);vm.runInContext('(function(){'+generator.default(branch).code+'})()',context);
    assert.equal(schedules.length,1);assert.equal(new Set(clicks.map(c=>c.start)).size,clicks.length,'no doubled metronome clicks');
    assert.ok(clicks.length>0);assert.ok(tones.every(t=>t.start<.12+passage.totalBeats*scope.beat));
    if(pickup&&question.hasPickup) {
      assert.equal(passage.totalBeats,question.pickupBeats+2*question.timeSignature.beats);
      assert.ok(clicks.some(c=>c.accent&&Math.abs(c.start-(.12+question.pickupBeats*scope.beat))<1e-8),'first full-bar downbeat follows pickup');
    }
    schedules[0].fn();assert.equal(advances,1);
  }
});

test('Higher optional anacrusis receives one third of normal questions when enabled',()=>{
  let source=fs.readFileSync('generated-runtimes/auralrecognition-1.js','utf8');source=source.slice(0,source.lastIndexOf('const root=document.getElementById'))+';this.api={buildQuestion,defaultConceptIdsForLevel};';
  const context=vm.createContext({window,React:{createElement(){return{}},Fragment:{}},URLSearchParams,location:{search:'',href:'http://localhost/auralrecognition.html'}});vm.runInContext(source,context);
  const ids=[...context.api.defaultConceptIdsForLevel('H'),'anacrusis-yes','anacrusis-no'],counts={};
  for(let i=0;i<300;i++){const q=context.api.buildQuestion('H',ids,'rhythmicChange');const family=q.type==='anacrusis'?'anacrusis':q.answerId;counts[family]=(counts[family]||0)+1;}
  assert.equal(counts.anacrusis,100);assert.equal(counts['rhythm-augmentation'],100);assert.equal(counts['rhythm-diminution'],100);
});
