const test=require('node:test'),assert=require('node:assert/strict'),{run}=require('../scripts/audit-chords.cjs'),harness=require('./helpers/chords-harness.cjs'),S=require('../shared/chords-selection');
test('chords and worksheets generate valid notation, unique choices and the requested inversion weights',()=>assert.deepEqual(run(300).failures,[]));
test('AH special chords retain their written and sounding intervals without double sharps',()=>{const h=harness();for(const spelling of h.AH_CHORD_SPELLINGS){const stack=h.makeAHChordStack(spelling);assert.ok(stack.every(tone=>(tone.writtenAccidental??0)<=1),`Double sharp in ${spelling.root} ${spelling.type}`);const root=stack[0].midi,type=h.AH_CHORD_TYPES.find(type=>type.id===spelling.type);assert.deepEqual(Array.from(stack,tone=>tone.midi-root),Array.from(type.intervals));const indices=stack.map(tone=>tone.octave*7+'CDEFGAB'.indexOf(tone.letter)),expected=type.id==='add6'?[0,2,4,5]:type.id==='aug'?[0,2,4]:[0,2,4,6];assert.deepEqual(Array.from(indices,index=>index-indices[0]),expected);}});
test('invalid saved question types recover a usable set of defaults',()=>{assert.deepEqual(S.normalise({identifyChords:false,insertPosition:false,createBassLine:false},{identifyChords:true,insertPosition:true,createBassLine:true}),{identifyChords:true,insertPosition:true,createBassLine:true});});
const { accompaniment } = require("../practice-melody-generator.js");
const fs=require('node:fs'),vm=require('node:vm'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),functions=harness.functions;
test('adjacent tones in a chord share one stem in either direction',()=>{
 const {Note}=harness();
 const stack=[0,1,5].map(step=>({step,writtenAccidental:null}));
 const note={id:'dominant-seventh',rhythm:'crotchet',step:0,stack};
 for(const down of [false,true]){
  const markup=renderToStaticMarkup(React.createElement(Note,{note,x:400,top:100,stackLayout:'lineSpace',stackStemDown:down}));
  assert.equal((markup.match(/class="chord-stem"/g)||[]).length,1);
  assert.equal((markup.match(/\uE0A4/g)||[]).length,stack.length);
  assert.doesNotMatch(markup,/[\uE1D5\uE1D6]/);
  assert.match(markup,down?/x1="395" x2="395" y1="115" y2="172"/:/x1="405" x2="405" y1="140" y2="83"/);
  assert.match(markup,down?/<text[^>]+ x="390" y="140"/:/<text[^>]+ x="410" y="135"/);
 }
});
test('repeated chord choices score once and preserve the first marked answer',()=>{let attempted=0,selected=null;const c={answerLock:{current:false},feedback:null,questionVisible:true,streak:0,clearFeedbackTimers(){},playFeedbackSound(){},setAttempted:fn=>attempted=fn(attempted),setCorrect(){},setStreak(){},setBest(){},setFeedback(){},medalSoundForStreak:()=>null,medalEligible:false,feedbackTimersRef:{current:[]},setTimeout:()=>1,setFeedbackFading(){},newQuestion(){},question:{chord:{id:'C'}},setAnswers:value=>selected=value};vm.createContext(c);vm.runInContext(functions.score+';'+functions.selectN5Choice,c);c.selectN5Choice('C');c.selectN5Choice('G');assert.equal(attempted,1);assert.equal(selected.n5Choice,'C');});
test('quick touch bass-note drops commit the actual release pitch before a rerender',()=>{let answers={};const h=harness({...React,useRef:()=>({current:null}),useEffect(){}}),q=h.makeQuestion('AH',{identifyChords:false,insertPosition:false,createBassLine:true});const tree=h.AHBassLineScore({question:q,answers:{},setAnswers:fn=>answers=fn(answers),feedback:null});let target;function visit(node){if(!node||typeof node!=='object')return;if(node.props?.['aria-label']==='Enter bass note 2')target=node;const children=node.props?.children;if(Array.isArray(children))children.flat(Infinity).forEach(visit);else visit(children);}visit(tree);assert(target);const currentTarget={ownerSVGElement:{getBoundingClientRect:()=>({left:0,top:0,width:920,height:430})},setPointerCapture(){},releasePointerCapture(){}},event=innerY=>({currentTarget,clientX:500,clientY:202+(innerY-202)*1.13,pointerType:'touch',pointerId:1,preventDefault(){}});target.props.onPointerDown(event(284));target.props.onPointerUp(event(274));assert.equal(answers['ah-bass-1'].step,6);assert.equal(answers['ah-bass-1'].letter,'F');assert.equal(answers.ahBassPreview,undefined);});
test('double flats render and accidentals do not carry into another octave', () => {
  const h = harness();
  const stack = h.makeAHChordStack(h.AH_CHORD_SPELLINGS.find(item => item.root === 'C' && item.type === 'dim7'));
  const html = renderToStaticMarkup(React.createElement(h.Note, {
    note: { id: 'test', rhythm: 'semibreve', beats: 4, stack, step: stack[0].step },
    x: 400,
    top: 100,
  }));
  assert.match(html, /\uE264/);
  const bar = { notes: [
    { letter: 'G', octave: 4, midi: 67, writtenAccidental: 1 },
    { letter: 'G', octave: 5, midi: 79, writtenAccidental: null },
  ] };
  assert.equal(h.effectivePitchForMelodyNote({ key: { id: 'C', keyAccidentals: {} } }, bar, 1), 79);
});
function audioHarness(prepare=async()=>true, makeQuestion=h=>h.makeQuestion('AH',{identifyChords:true,insertPosition:false,createBassLine:false})){const h=harness(),question=makeQuestion(h),scheduled=[],hits=[];const c={classroomRace:false,escapeActivity:null,question,accompaniment,n5SequenceBarAudio:h.n5SequenceBarAudio,questionVisible:true,answerLock:{current:false},feedback:null,playing:false,audioRef:{current:null},activeLevel:question.type==='higher'?'H':question.type==='n5'?'N5':'AH',BAR_COUNT:8,pitchForChordLetter:h.pitchForChordLetter,effectivePitchForMelodyNote:h.effectivePitchForMelodyNote,tempo:'medium',TEMPOS:h.TEMPOS,metronomeOn:false,highlightTimersRef:{current:[]},stopTimerRef:{current:null},setPlaying(){},setPromptMessage(){},setActiveNoteId(){},setActiveBarIndex(){},stopAudio(){c.audioRef.current=null;},clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),midiToFrequency:h.midiToFrequency,playOscillator:(ctx,value)=>hits.push(value),setTimeout:(fn,ms)=>{scheduled.push(ms);return scheduled.length;},window:{AudioContext:class{constructor(){this.currentTime=10;this.destination={};}close(){}},MLH:{prepareAudioPlayback:prepare,naturalPlaybackTailMs:()=>0}},globalThis:{MLH:{}}};vm.createContext(c);vm.runInContext(functions.playQuestionAudio,c);return {c,hits,scheduled};}
test('failed audio preparation leaves no scheduled notes',async()=>{for(const prepare of [async()=>false,async()=>{throw new Error('not ready');}]){const h=audioHarness(prepare);await h.c.playQuestionAudio();assert.equal(h.hits.length,0);assert.equal(h.c.audioRef.current,null);}});
test('skipping while the piano prepares cannot start stale playback',async()=>{let ready;const h=audioHarness(()=>new Promise(resolve=>ready=resolve)),playing=h.c.playQuestionAudio();h.c.audioRef.current=null;ready(true);await playing;assert.equal(h.hits.length,0);});
test('special chord audio uses the generated pitches and preserves its playback lead-in',async()=>{const h=audioHarness();await h.c.playQuestionAudio();for(const tone of h.c.question.bars[0].notes[0].stack)assert(h.hits.some(hit=>Math.abs(hit.frequency-h.c.midiToFrequency(tone.midi))<.001));const duration=60/76*4;assert(Math.abs(h.scheduled.at(-1)-(duration+.08)*1000)<.001);});
test('returning from a worksheet restores its source settings once',()=>{let value=JSON.stringify({version:1,activityId:'chords',settings:{level:'AH',ahCustomise:{identifyChords:false,insertPosition:false,createBassLine:true},showScaleDegrees:true}});const c={LEVELS:{AH:{}},window:{sessionStorage:{getItem:()=>value,removeItem:()=>value=null}}};vm.createContext(c);vm.runInContext(functions.consumeChordsWorksheetReturn,c);const restored=c.consumeChordsWorksheetReturn();assert.equal(restored.ahCustomise.createBassLine,true);assert.equal(restored.ahCustomise.insertPosition,false);assert.equal(restored.showScaleDegrees,true);assert.equal(c.consumeChordsWorksheetReturn(),null);});

test('National 5 chord playback schedules the generated notes with their written octaves', async () => {
  const {c, hits} = audioHarness(async () => true, app => app.makeN5Question());
  await c.playQuestionAudio();
  for (const note of c.question.bars[0].notes) {
    assert(hits.some(hit => Math.abs(hit.frequency - c.midiToFrequency(note.midi)) < .001));
  }
});

function peakAccompanimentVolume(tones) {
  return Math.max(...tones.map(({ time }) => tones
    .filter(tone => tone.time <= time && time < tone.time + tone.duration)
    .reduce((sum, tone) => sum + tone.volume, 0)));
}

test('National 5 chord sequences use the correct harmony and match levels across all accompaniment styles', () => {
  const app = harness();
  const selectedStyles = new Set();
  for (let index = 0; index < accompaniment.styleIds.length; index += 1) {
    const question = app.makeQuestion('N5', undefined, { chordProgression: true, identifyChord: false });
    selectedStyles.add(question.accompanimentStyle);
    const progression = Array.from(question.bars, bar => bar.chordSymbol);
    assert.deepEqual(progression, Array.from(question.options[question.answerIndex].symbols));
    assert.equal(progression[0], 'I');
    assert.deepEqual([...progression].sort(), ['I', 'IV', 'V', 'VI']);
    const meter = accompaniment.classifyMeter(question.timeSignature);
    for (const bar of question.bars) {
      const tones = app.n5SequenceBarAudio(question, bar, meter, question.accompanimentStyle);
      const backing = Array.from(tones.slice(bar.notes.length));
      assert.ok(tones.slice(0, bar.notes.length).every(tone => tone.volume === .08));
      assert.ok(Math.abs(peakAccompanimentVolume(backing) - .08) < 1e-9);
      assert.ok(tones.every(tone => tone.velocity === 96));
      const pattern = accompaniment.getPatternVariant(question.accompanimentStyle, meter);
      assert.deepEqual([...new Set(backing.map(tone => tone.time))], [...new Set(pattern.map(event => event.time))]);
      const chordPitchClasses = Array.from(bar.chord.notes, (letter, index) =>
        app.pitchForChordLetter(question.key, bar.chord, letter, 3 + index) % 12);
      for (const tone of backing) {
        const midi = Math.round(69 + 12 * Math.log2(tone.frequency / 440));
        assert.ok(chordPitchClasses.includes(midi % 12));
      }
    }
  }
  assert.deepEqual([...selectedStyles].sort(), [...accompaniment.styleIds].sort());
});

test('National 5 chord-sequence playback uses the matched piano levels and preloads the written pitches', async () => {
  let preloaded;
  const { c, hits } = audioHarness(async (_ctx, { piano }) => {
    preloaded = piano;
    return true;
  }, app => ({ ...app.makeQuestion('N5', undefined, { chordProgression: true, identifyChord: false }), accompanimentStyle: 'waltz' }));
  await c.playQuestionAudio();

  const { question } = c;
  const meter = accompaniment.classifyMeter(question.timeSignature);
  const beatSeconds = 60 / c.TEMPOS.find(t => t.id === c.tempo).bpm;
  const finalBarStart = 10.08 + (question.bars.length * 2 - 1) * meter.beatsPerBar * beatSeconds;
  const melody = hits.slice(0, question.bars[0].notes.length);
  const expected = Array.from(question.bars[0].notes, (_note, index) =>
    c.midiToFrequency(c.effectivePitchForMelodyNote(question, question.bars[0], index)));
  assert.deepEqual(melody.map(hit => hit.frequency), expected);
  assert.ok(hits.every(hit => preloaded.some(tone => tone.frequency === hit.frequency && tone.velocity === hit.velocity)));
  assert.ok(melody.every(hit => hit.volume === .08));
  assert.equal(hits.find(hit => Math.abs(hit.start - finalBarStart) < .001)?.volume, .08);
});

test('Higher Chords preloads and plays its melody at written pitch', async () => {
  let preloaded;
  const {c, hits} = audioHarness(async (_ctx, {piano}) => {
    preloaded = piano;
    return true;
  }, app => app.makeQuestion('H'));
  await c.playQuestionAudio();
  const expected = Array.from(c.question.bars).flatMap(bar => Array.from(bar.notes, (_, index) =>
    c.midiToFrequency(c.effectivePitchForMelodyNote(c.question, bar, index))
  ));
  const melody = hits.filter(hit => hit.volume === .052
    && hit.duration !== (60 / c.TEMPOS.find(tempo => tempo.id === c.tempo).bpm) * .9);
  assert.deepEqual(melody.map(hit => hit.frequency), expected);
  assert.ok(expected.every(frequency => preloaded.includes(frequency)));
});

test('Higher Chords Race cannot start playback', async () => {
 const {c,hits,scheduled}=audioHarness(undefined,h=>h.makeQuestion('H'));
 c.classroomRace=true;
 await c.playQuestionAudio();
 assert.equal(c.audioRef.current,null);
 assert.deepEqual(hits,[]);
 assert.deepEqual(scheduled,[]);
});
