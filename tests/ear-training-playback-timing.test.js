const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {parser,generator}=require('@babel/standalone').packages;
const html=fs.readFileSync(path.join(__dirname,'../auralrecognition.html'),'utf8');
const source=[...html.matchAll(/<script\b[^>]*type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/g)].map(match=>match[1]).join('\n');
const ast=parser.parse(source,{sourceType:'script',plugins:['jsx']}),nodes=[];
function walk(node){if(!node||typeof node!=='object')return;if(node.type)nodes.push(node);for(const value of Object.values(node)){if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')walk(value);}}
walk(ast);
const code=node=>generator.default(node).code;

test('N4 harmonic and rhythmic devices use the heard pulse for BPM in every metre',()=>{
  const declaration=nodes.find(node=>node.type==='VariableDeclarator'&&node.id.name==='playbackPulseBeats');
  for(const topic of ['accompanimentDevices','vamp','changeOfKey','anacrusis']) for(const compound of [false,true]) for(const bpm of [60,80,100]) {
    const pulse=compound?1.5:1;
    const scope={isTimeListening:false,isHarmonicStudy:topic!=='anacrusis',questionTopic:topic,question:{level:'N4',timeSignature:{pulseQuarterBeats:pulse}},passage:null};
    const playbackPulse=vm.runInNewContext(code(declaration.init),scope);
    const quarterSeconds=60/bpm/playbackPulse;
    assert.ok(Math.abs(quarterSeconds*pulse-60/bpm)<1e-10,'successive main beats match the selected BPM');
  }
  assert.equal(vm.runInNewContext(code(declaration.init),{isTimeListening:false,isHarmonicStudy:false,questionTopic:'scales',question:{level:'N4'},passage:null}),1,'isolated scales retain crotchet pacing');
  assert.equal(vm.runInNewContext(code(declaration.init),{isTimeListening:false,isHarmonicStudy:false,questionTopic:'anacrusis',question:{level:'N5',timeSignature:{pulseQuarterBeats:1.5}},passage:null}),1,'later-level playback remains unchanged');
});

test('isolated scale metronomes continue through the held tonic without duplicate clicks',()=>{
  const fn=nodes.find(node=>node.type==='FunctionDeclaration'&&node.id.name==='playAudioOnlyNotes');
  for(const count of [11,15,25]) for(const enabled of [false,true]) {
    const notes=Array.from({length:count},(_,index)=>({midi:60+index%12,beat:index,beats:index===count-1?4:1}));
    const question={notes,totalBeats:count+3},clicks=[],tones=[];
    const play=vm.runInNewContext('('+code(fn)+')',{
      metronome:enabled,questionTopic:'scales',question,
      playClick:(ctx,gain,start)=>clicks.push(start),oscillator:(ctx,gain,frequency,start,duration)=>tones.push({start,duration}),midiToFrequency:midi=>midi,melodyMidi:midi=>midi,
      timers:{current:[]},setTimeout:()=>1,stopAudio(){},newQuestion(){},window:{MLH:{naturalPlaybackTailMs:()=>650}}
    });
    play({currentTime:0},{},.12,.6,question);
    assert.equal(tones.length,count);
    assert.equal(clicks.length,enabled?question.totalBeats:0);
    if(enabled) {
      assert.equal(new Set(clicks).size,clicks.length);
      clicks.forEach((time,index)=>assert.ok(Math.abs(time-(.12+index*.6))<1e-8));
      assert.equal(clicks.filter(time=>time>=tones.at(-1).start-1e-8).length,4,'the final tonic has four metronome beats');
    }
  }
});

test('two-part motion metronomes follow the main pulse in compound time',()=>{
  const fn=nodes.find(node=>node.type==='FunctionDeclaration'&&node.id.name==='playPolytonality');
  for(const [beats,pulse] of [[2,1],[3,1.5]]) {
    const clicks=[],question={barCount:8,timeSignature:{beats},tempoPulseBeats:pulse,layers:[]};
    const play=vm.runInNewContext('('+code(fn)+')',{
      question,metronome:true,playClick:(ctx,gain,start)=>clicks.push(start),timers:{current:[]},setTimeout:()=>1,stopAudio(){},window:{MLH:{naturalPlaybackTailMs:()=>650}}
    });
    play({currentTime:0},{},.12,60/80/pulse);
    assert.equal(clicks.length,8*beats/pulse);
    for(let index=1;index<clicks.length;index++) assert.ok(Math.abs(clicks[index]-clicks[index-1]-.75)<1e-8);
  }
});

test('isolated motion playback uses both isolated voices rather than the context excerpt',()=>{
  const fn=nodes.find(node=>node.type==='FunctionDeclaration'&&node.id.name==='playPolytonality');
  const voice=midi=>({volume:.8,pan:0,bars:[{barIndex:0,notes:[{midi,beats:4,beat:0}]},{barIndex:1,notes:[{midi:midi+12,beats:4,beat:0}]}]});
  const isolated={barCount:2,timeSignature:{beats:4},tempoPulseBeats:1,layers:[voice(60),voice(72)]};
  const pitches=[],scheduled=[];
  const play=vm.runInNewContext('('+code(fn)+')',{
    question:{barCount:8},metronome:false,playAccompaniment(){},melodyPlaybackBeats:(bar,index)=>bar.notes[index].beats,
    effectiveMidiForNote:(content,bar,note)=>note.midi,midiToFrequency:n=>n,playMelodyNote:(ctx,gain,midi)=>pitches.push(midi),
    timers:{current:[]},setTimeout:(fn,ms)=>{scheduled.push(ms);return 1;},stopAudio(){},window:{MLH:{naturalPlaybackTailMs:()=>650}}
  });
  const ctx={currentTime:0,createGain:()=>({connect(){},gain:{setValueAtTime(){}}})};
  play(ctx,{},.12,.5,isolated);
  assert.deepEqual(pitches,[60,72,72,84]);
  assert.equal(scheduled[0],4770);
});
