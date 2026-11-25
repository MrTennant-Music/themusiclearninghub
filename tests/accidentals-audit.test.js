const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),harness=require('./helpers/accidentals-harness.cjs'),{run}=require('../scripts/audit-accidentals.cjs'),S=require('../shared/accidentals-selection');
test('all accidentals configurations preserve balanced question groups, answers, pitches and bar totals',()=>assert.deepEqual(run(120).failures,[]));

test('Apply to Score uses notes whose pitch comes from the key signature alone', () => {
  const { makeQuestion, effectiveAccidental } = harness();
  const answerValues = { sharp: 1, flat: -1, natural: 0 };

  for (const enabledAccidentals of [['natural'], ['sharp', 'flat', 'natural']]) {
    for (let index = 0; index < 60; index += 1) {
      const question = makeQuestion({ enabledQuestionTypes: ['apply-score'], enabledAccidentals });
      const { barIndex, noteIndex, symbolId } = question.required[0];
      const note = question.bars[barIndex].notes[noteIndex];
      const current = effectiveAccidental(question, barIndex, noteIndex);

      assert.equal(note.writtenAccidental, null);
      assert.equal(current, question.key.keyAcc[note.letter] ?? 0);
      assert.equal(answerValues[symbolId] - current, question.prompt.includes('semitone higher') ? 1 : -1);
    }
  }
});

test('a missing natural cancels a sharp or flat visible in the score', () => {
  const { makeQuestion } = harness();

  for (const questionType of ['apply-score', 'audio-two', 'audio-full']) {
    for (let index = 0; index < 60; index += 1) {
      const question = makeQuestion({
        enabledQuestionTypes: [questionType],
        enabledAccidentals: ['natural'],
      });
      const { barIndex, noteIndex, symbolId } = question.required[0];
      const { notes } = question.bars[barIndex];
      const target = notes[noteIndex];
      const previousSign = notes.slice(0, noteIndex).findLast(note =>
        note.letter === target.letter && note.octave === target.octave && note.writtenAccidental != null);
      const pitchBeforeAnswer = previousSign?.writtenAccidental ?? question.key.keyAcc[target.letter] ?? 0;

      assert.equal(symbolId, 'natural');
      assert.ok(pitchBeforeAnswer === 1 || pitchBeforeAnswer === -1,
        `${questionType}: ${target.letter}${target.octave} was already natural in ${question.key.name}`);
    }
  }
});
test('invalid saved options recover valid settings',()=>{assert.deepEqual(S.cleanList(['removed'],['sharp','flat','natural']),['sharp','flat','natural']);assert.deepEqual(S.cleanOptions({treble:false,bass:false}),{treble:true,bass:true,eSharpFflat:true,bSharpCflat:true});});
test('two-note audio uses the compact faded stave and places the answer on note two', () => {
  const { makeQuestion, Score, snapPlacement } = harness();
  const question = makeQuestion({ enabledQuestionTypes: ['audio-two'], enabledAccidentals: ['natural'] });
  const answer = snapPlacement({ x: 585, y: 140 }, 'natural', question);
  const markup = renderToStaticMarkup(React.createElement(Score, { question, placements: [{ ...answer, localId: 'answer' }] }));
  assert.deepEqual({ ...answer }, { symbolId: 'natural', barIndex: 0, noteIndex: 1, anchor: 'before-note' });
  assert.match(markup, /<linearGradient id="accidentals-fade-/);
  assert.equal((markup.match(/stroke="url\(#accidentals-fade-/g) ?? []).length, 5);
  assert.doesNotMatch(markup, /stroke-width="4"|[\uE082\uE084]/);
  assert.match(markup, /\uE261/);
});

test('the target note, accidental and prompt use the homepage blue without a glow', () => {
  const { makeQuestion, Score, HighlightedPrompt } = harness();
  const questions = Array.from({ length: 12 }, () => makeQuestion({ enabledQuestionTypes: ['multiple-choice'] }));
  const question = questions.find(item => item.choiceKind === 'qSharpFlat');
  assert.ok(question);
  const score = renderToStaticMarkup(React.createElement(Score, { question, placements: [] }));
  const selectedGlyphs = [...score.matchAll(/<text[^>]*fill="#2563eb"[^>]*>([^<]+)<\/text>/g)].map(match => match[1]);
  assert.equal(selectedGlyphs.length, 2);
  assert.ok(selectedGlyphs.some(glyph => /[\uE260\uE262]/.test(glyph)));
  assert.doesNotMatch(score, /feDropShadow/);
  assert.match(question.prompt, /<strong style="color: #2563eb;">note<\/strong>/);
  assert.match(renderToStaticMarkup(React.createElement(HighlightedPrompt, { prompt: question.prompt })), /<strong style="color:#2563eb">note<\/strong>/);
});
test('hosted Accidentals keeps the individual prompt markup and semitone arrow glyphs',()=>{
 const adapter=require('../shared/classroom-accidentals.js');
 const {random}=require('../shared/classroom-activities.js');
 const setup=adapter.hostSettings('/accidentals.html');
 const deck=adapter.quizQuestions({...setup,enabledTypes:['multiple-choice']},10,random(123));
 const question=deck.find(q=>q.score.choices.some(choice=>choice.id==='lower'));
 assert.ok(question);
 assert.equal(question.score.choices.find(choice=>choice.id==='lower').arrow,'↓');
 const {QuestionPanel}=harness();
 const html=renderToStaticMarkup(React.createElement(QuestionPanel,{question:question.score,onChoice(){}}));
 assert.match(html,/<strong><span>(?:sharp|flat)<\/span><\/strong>/);
 assert.match(html,/Lower by a semitone<\/span><span[^>]*class="[^"]* rotate-90"[^>]*mask:/);
});
test('rapid repeated submissions record one attempt',()=>{let attempted=0;const c={feedback:null,answerLock:{current:false},questionVisible:true,streak:0,medalEligible:false,setAttempted:fn=>attempted=fn(attempted),setCorrect(){},setStreak(){},setBestStreak(){},setFeedback(){},setFeedbackFading(){},playFeedbackSound(){}};vm.createContext(c);vm.runInContext(harness.functions().scoreAnswer,c);c.scoreAnswer(false);c.scoreAnswer(false);assert.equal(attempted,1);});
test('AH rapid pointer release uses its release position before React updates',()=>{let placed;const c={feedback:null,touchPreviewRef:{current:null},isTouchDevice:true,getPointerStep:event=>({pointer:{y:event.y},step:event.y}),updateTouchPreview:value=>c.touchPreviewRef.current=value,setHoverStep(){},placeStep:value=>placed=value,update:null};vm.createContext(c);const f=harness.functions('AH');vm.runInContext(f.handlePointerDown+';'+f.handlePointerUp,c);const currentTarget={setPointerCapture(){},releasePointerCapture(){}},event=y=>({y,currentTarget,pointerId:1,preventDefault(){}});c.handlePointerDown(event(3));c.handlePointerUp(event(7));assert.equal(placed,7);assert.equal(c.touchPreviewRef.current,null);});
test('B-sharp and C-flat answers cross the octave boundary with equal pitches',()=>{const h=harness('AH');for(const q of h.enharmonicCandidates(h.DEFAULT_OPTIONS)){assert.equal(h.pitchOf(q.source),h.pitchOf(q.target));if(q.source.letter==='B'&&q.source.accidental==='sharp')assert.equal(q.target.octave,q.source.octave+1);if(q.source.letter==='C'&&q.source.accidental==='flat')assert.equal(q.target.octave,q.source.octave-1);}});
test('AH score offers keyboard entry and renders both clefs without invalid coordinates',()=>{const h=harness('AH');for(const clef of ['treble','bass']){const q=h.makeQuestion({...h.DEFAULT_OPTIONS,treble:clef==='treble',bass:clef==='bass'}),html=renderToStaticMarkup(React.createElement(h.ScoreArea,{question:q,selectedAccidental:'natural',placed:null,hoverStep:null,touchPreview:null,feedback:null}));assert(html.includes('Enter enharmonic note'));assert(!html.includes('NaN'));}});
function audioHarness(prepare){
 const h=harness(),core=require('../shared/accidentals-question-core.js').create();
 const question=h.makeQuestion({enabledQuestionTypes:['audio-two'],enabledAccidentals:['natural']});
 const node={connect(){},gain:{setValueAtTime(){}}},compressor={connect(){}};
 for(const key of ['threshold','knee','ratio','attack','release'])compressor[key]={setValueAtTime(){}};
 const c={question,questionAudio:core.questionAudio,questionVisible:true,playing:false,audioContext:{current:null},
  setPlaying(){},stopAudio(){c.audioContext.current=null;},showWarning(){},midiFreq:core.midiFreq,
  window:{AudioContext:class{
   constructor(){this.currentTime=0;this.destination={};}
   createGain(){return node;}
   createDynamicsCompressor(){return compressor;}
  },MLH:{AccidentalsNotation:h,prepareAudioPlayback:prepare}}};
 vm.createContext(c);
 vm.runInContext(harness.functions().playQuestion,c);
 return c;
}
test('failed audio preparation closes playback without scheduling music',async()=>{for(const prepare of [async()=>false,async()=>{throw Error('not ready');}]){const c=audioHarness(prepare);await c.playQuestion();assert.equal(c.audioContext.current,null);}});
test('skipping during audio preparation prevents stale playback',async()=>{let ready;const c=audioHarness(()=>new Promise(resolve=>ready=resolve)),pending=c.playQuestion();c.stopAudio();ready(true);await pending;assert.equal(c.audioContext.current,null);});
test('worksheet return restores accidentals settings once without consuming another activity',()=>{let value=JSON.stringify({version:1,activityId:'enharmonics',settings:{level:'AH',options:{treble:false,bass:true},showNoteNames:true}});const storage={getItem:()=>value,removeItem:()=>value=null};assert.equal(S.consumeReturn('accidentals',storage),null);assert(value);const restored=S.consumeReturn('enharmonics',storage);assert.equal(restored.showNoteNames,true);assert.equal(restored.options.bass,true);assert.equal(S.consumeReturn('enharmonics',storage),null);});
