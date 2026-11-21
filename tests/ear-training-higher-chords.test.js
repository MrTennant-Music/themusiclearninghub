const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {parser,generator}=require('@babel/standalone').packages;
global.window={MLH:{useClickOutside(){}}};
window.PracticeMelodyGenerator=require('../practice-melody-generator.js');
require('../aural-accompaniment.js');require('../melodic-dictation-generator.js');
const core=require('../ear-training-exercises.js');
require('../ear-training-piano-concepts.js');require('../time-signatures-listening.js');require('../tempo-changes-listening.js');require('../aural-tonalities.js');
let source=fs.readFileSync(require('node:path').join(__dirname,'../generated-runtimes/auralrecognition-1.js'),'utf8');
source=source.slice(0,source.lastIndexOf('const root=document.getElementById'))+';this.api={buildHigherChordPassage,buildChordQuestion};';
const context=vm.createContext({window,React:{createElement(){return{}},Fragment:{}},URLSearchParams,location:{search:'',href:'http://localhost/auralrecognition.html'}});
vm.runInContext(source,context);
const api=context.api;
test('Higher chords use eight native bars, two balanced target chords and their actual replay',()=>{
  const keys=new Set(),metres=new Set(),paths=new Set();
  for(const id of ['dom7','dim7','add6','aug','dim'])for(let run=0;run<150;run++) {
    const q=api.buildChordQuestion('H',[id],id),p=q.passage;
    assert.equal(p.bars.length,8);assert.equal(p.totalBeats,8*p.timeSignature.beats);assert.equal(p.chordCount,2);
    assert.deepEqual(Array.from(p.targetBars),[2,6]);
    keys.add(p.key.id);metres.add(p.timeSignature.id);paths.add(p.notes.map(n=>n.midi).join(','));
    for(const bar of p.bars) {
      assert.ok(Math.abs(bar.notes.reduce((sum,n)=>sum+n.beats,0)-p.timeSignature.beats)<1e-8);
      for(const event of bar.accompaniment) {
        assert.ok(event.pitches.every(n=>Number.isFinite(n)&&n>=45&&n<=76));
        assert.ok(event.beat+event.beats<=p.timeSignature.beats);
        assert.ok(Math.abs(event.volume*Math.sqrt(event.pitches.length)-2)<1e-8);
      }
      for(const note of bar.notes) {
        assert.ok(Number.isFinite(note.midi)&&note.midi>=57&&note.midi<=84);
        const segment=Array.from(bar.accompanimentHarmony).reverse().find(e=>e.beat<=note.beat);
        assert.ok(segment.pitches.some(n=>(note.midi-n)%12===0));
      }
    }
    for(const index of [2,6]) {
      const segments=p.bars[index].accompanimentHarmony,target=segments[0].pitches;
      assert.equal(segments.length,2);assert.equal(target.length,q.chordType.intervals.length);
      target.forEach((n,i)=>assert.equal(n-target[0],q.chordType.intervals[i]));
      const rootDistance=((segments[1].pitches[0]-target[0])%12+12)%12;
      assert.equal(rootDistance,id==='add6'?0:['dim','dim7'].includes(id)?1:5);
    }
    assert.equal(p.bars[7].notes.at(-1).midi%12,p.key.tonic%12);
    assert.equal(JSON.stringify(p.chordReplayPassage.bars[0].accompaniment),JSON.stringify(p.bars[2].accompaniment));
    assert.equal(p.chordReplayPassage.notes.length,0);
  }
  assert.ok(keys.size>=8);assert.equal(metres.size,4);assert.ok(paths.size>500);
});

test('Higher incorrect replay schedules the actual chord and resolution before the passage once',()=>{
  const html=fs.readFileSync('auralrecognition.html','utf8'),jsx=html.match(/<script type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/)[1];
  const tree=parser.parse(jsx,{plugins:['jsx']}),nodes=[];
  function walk(n){if(!n||typeof n!=='object')return;if(n.type)nodes.push(n);for(const v of Object.values(n)){if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}walk(tree);
  const play=nodes.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='play'),branch=play.body.body.find(n=>n.type==='IfStatement'&&n.test.name==='passage');
  const audio=nodes.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='playAudioOnlyNotes');
  for(const replay of [false,true]) {
    const question=api.buildChordQuestion('H',['dom7'],'dom7'),passage=question.passage,scheduled=[],harmonies=[],tones=[];let advances=0;
    const scope={question,passage,rhythmReplay:false,timeReplay:false,pickupReplay:false,intervalReplay:false,chordReplay:replay,cadenceReplay:false,bassReplay:false,melodyReplay:false,fullPassage:true,questionTopic:'chord',metronome:false,start:.12,beat:.75,ctx:{currentTime:0},master:{},harmonyGain:{},
      playAccompaniment:(ctx,gain,bar,offset,beat,start)=>harmonies.push({bar,start}),oscillator:(ctx,gain,midi,start)=>tones.push(start),midiToFrequency:n=>n,melodyMidi:n=>n,
      timers:{current:[]},setTimeout:(fn,ms)=>{scheduled.push({fn,ms});return 1;},newQuestion(){advances++;},stopAudio(){},window:{MLH:{naturalPlaybackTailMs:()=>650}}};
    const context=vm.createContext(scope);vm.runInContext(generator.default(audio).code,context);vm.runInContext('(function(){'+generator.default(branch).code+'})()',context);
    const delay=replay?passage.chordReplayPassage.totalBeats*.75+.3:0;
    assert.equal(scheduled.length,1);assert.equal(harmonies.length,replay?9:8);
    assert.ok(tones.every(start=>start>=.12+delay-1e-8));
    assert.ok(Math.abs(scheduled[0].ms-((.12+delay+passage.totalBeats*.75)*1000+650))<1e-7);
    if(replay)assert.equal(harmonies[0].bar,passage.chordReplayPassage.bars[0]);
    scheduled[0].fn();assert.equal(advances,replay?1:0);
  }
});
