'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const Babel=require('@babel/standalone');
const React=require('react');
const page=fs.readFileSync('practicequestions.html','utf8');
const source=page.match(/<script type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/)[1];
const exported=['weightedAdvancedHigherChordCandidate','makeTranspositionTarget','plantTranspositionFallbackBar','ADVANCED_HIGHER_TRANSPOSITION_VARIANTS','transpositionNoteFitsClefForQuestion','makeAccidentalQuestionTarget','rhythmTotalPatternCandidates','plantAdjacentRhythmTotalTarget','makeFinalBarNotes','finalPatternForSignature','KEYS','TIME_SIGNATURES','noteByLetter','applyPlaybackRhythmPattern','refitQuestionChordsToMelody','setBarHarmony','transpositionNoteAnswerCorrect','practicePartRequiresAudio','accidentalDisplayValuesForBar','makeQuestion','defaultPracticeQuestionTypesForLevel','timeSignatureForBar','practiceQuestionTypesForLevel','practiceQuestionCountForLevel','practiceWorksheetCompletedState','PracticeScoreTimerPanel','hasQuestionTypeConflict','makeNote','effectiveMidiForNote','rhythmValueAcceptedAnswers','acceptedAnswers','cleanAnswer','Score','effectivePlaybackMidiForNote','effectivePlaybackMidiForStackTone','normalisePracticeQuestionTypes','canBuildPracticeQuestionSelection','makeAdvancedHigherChordVoicing','advancedHigherChordSymbolsForKey','advancedHigherChordInversionOptions','advancedHigherChordTypeSpellingsForQuestion','makeAdvancedHigherChordTypeStack','transpositionMeaningFitsPlaybackRange','circleSelectionCorrectForQuestion','getQuaverGroups','missingNoteIndicesForQuestion','missingNoteRangeForLevel','practiceEntryNoteForStep','practiceWorksheetQuestionTypes','makePracticeWorksheetQuestion'];
let randomState=1;
const math=Object.create(Math);
math.random=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;};
const window={PracticeMelodyGenerator:require('../practice-melody-generator.js')};
for(const name of ['bravura-symbols.js','shared/shared-notation-config.js'])vm.runInNewContext(fs.readFileSync(name,'utf8'),{window});
const context=vm.createContext({window,React,console,performance,Math:math,Date:class extends Date { static now(){return 1794355200000;} },setTimeout,clearTimeout});
vm.runInContext(Babel.transform(source.replace('ReactDOM.createRoot(document.getElementById("root")).render(<App />);','globalThis.audit={'+exported.join(',')+'};'),{presets:['react'],compact:true}).code,context);
const a=context.audit;
const plain=value=>JSON.parse(JSON.stringify(value));

test('every final bar fills its metre and sustains split closing notes with ties',()=>{
 const beats={minim:2,dottedMinim:3,semibreve:4,dottedCrotchet:1.5};
 for(const signature of a.TIME_SIGNATURES){
  const notes=a.makeFinalBarNotes(a.noteByLetter('C',4),15,a.KEYS[0],'I',signature);
  assert.equal(notes.reduce((sum,n)=>sum+beats[n.rhythm],0),signature.top*4/signature.bottom,signature.id);
  if(notes.length>1){assert.equal(notes[0].tieToNext,true);assert.equal(notes[1].tiedFromPrevious,true);assert.equal(notes[0].midi,notes[1].midi);}
 }
});

test('reharmonising preserves rhythm-correction playback durations and onsets',()=>{
 const q={key:a.KEYS[0],bars:[{barIndex:4,chordSymbol:'I',notes:[{letter:'C',octave:4,step:-2,midi:60,rhythm:'crotchet',beats:1,beat:0,noteIndex:0},{letter:'E',octave:4,step:0,midi:64,rhythm:'crotchet',beats:1,beat:1,noteIndex:1}]}]};
 a.applyPlaybackRhythmPattern(q.bars[0],['dottedCrotchet','quaver']);
 const expected=plain(q.bars[0].notes.map(n=>[n.beat,n.beats]));
 a.refitQuestionChordsToMelody(q);
 assert.deepEqual(plain(q.bars[0].notes.map(n=>[n.beat,n.beats])),expected);
 const bar=q.bars[0];q.bars=[];q.bars[4]=bar;a.setBarHarmony(q,4,'V');
 assert.deepEqual(plain(q.bars[4].notes.map(n=>[n.beat,n.beats])),expected);
});

test('transposition marking rejects a correct letter in the wrong octave in either clef',()=>{
 const expected={letter:'C',octave:4,step:-2,rhythm:'crotchet',writtenAccidental:null};
 for(const clef of ['bass','treble']){
  assert.equal(a.transpositionNoteAnswerCorrect({...expected},expected,clef),true);
  assert.equal(a.transpositionNoteAnswerCorrect({...expected,octave:3,step:-9},expected,clef),false);
  assert.equal(a.transpositionNoteAnswerCorrect({...expected,rhythm:'minim'},expected,clef),false);
  assert.equal(a.transpositionNoteAnswerCorrect({...expected,writtenAccidental:1},expected,clef),false);
 }
});

test('printed accidental cancellations agree with the independently intended pitches',()=>{
 const n=(letter,accidental,extra={})=>({letter,octave:4,writtenAccidental:accidental,...extra});
 assert.deepEqual(plain(a.accidentalDisplayValuesForBar([n('A',1),n('A',null)])),[1,0]);
 assert.deepEqual(plain(a.accidentalDisplayValuesForBar([n('A',1),n('A',1,{displayAccidental:null})])),[1,null]);
 assert.deepEqual(plain(a.accidentalDisplayValuesForBar([n('F',0),n('F',null)],{F:1})),[0,1]);
 assert.deepEqual(plain(a.accidentalDisplayValuesForBar([n('C',0,{displayAccidental:1}),n('C',null)],{C:1})),[null,null]);
 assert.deepEqual(plain(a.accidentalDisplayValuesForBar([n('G',null,{hiddenAccidental:1}),n('G',1)])),[null,null]);
});

test('audio badges distinguish listening tasks from printed dynamic questions',()=>{
 for(const type of ['dynamicName','hairpinName'])assert.equal(a.practicePartRequiresAudio({level:'N3',dynamicQuestionType:type},{sourceId:'dynamic',type:'text'}),false);
 assert.equal(a.practicePartRequiresAudio({level:'N3'},{sourceId:'dynamic',type:'dynamic'}),true);
 assert.equal(a.practicePartRequiresAudio({level:'N5'},{sourceId:'chord',type:'text'}),false);
 assert.equal(a.practicePartRequiresAudio({level:'H'},{sourceId:'chord',type:'higherChord'}),true);
 assert.equal(a.practicePartRequiresAudio({level:'AH'},{sourceId:'missing',type:'notes'}),true);
 for(const type of ['text','articulationPlacement'])assert.equal(a.practicePartRequiresAudio({level:'H'},{sourceId:'articulation',type}),false);
});

for(const [li,level]of ['N3','N4','N5','H','AH'].entries())test(`${level}: 100 seeded papers retain complete structure, bar timing and unique questions`,{timeout:30000},()=>{
 context.auditLevel=level;context.auditSettings=a.defaultPracticeQuestionTypesForLevel(level);
 for(let seed=1;seed<=100;seed++){
  randomState=li*100000+seed;
  const q=vm.runInContext('audit.makeQuestion(auditLevel,0,auditSettings)',context,{timeout:1500});
  assert.equal(q.bars.length,['H','AH'].includes(level)?16:8,`${level}/${seed}`);
  assert.equal(q.subquestions.length,a.practiceQuestionCountForLevel(level));
  assert.equal(new Set(q.subquestions.map(p=>p.id)).size,q.subquestions.length);
  if(q.transpositionTarget?.type==='meaning')assert.equal(a.transpositionMeaningFitsPlaybackRange(q,q.transpositionTarget),true);
  if(q.enharmonicTarget){
   const t=q.enharmonicTarget,actual=q.bars[t.barIndex].notes[t.noteIndex];
   assert.notEqual(t.barIndex,q.bars.length-1,'the sustained closing cadence must not be an enharmonic edit target');
   for(const field of ['letter','octave','writtenAccidental'])assert.equal(actual[field],t.sourceNote[field],`${level}/${seed}: enharmonic source ${field} survives later transformations`);
  }
  for(const part of q.subquestions.filter(p=>['notes','intervalInsert'].includes(p.type))){
   const bi=part.type==='notes'?q.targetBar:q.intervalInsertTarget.barIndex;
   const indices=part.type==='notes'?a.missingNoteIndicesForQuestion(q):[q.intervalInsertTarget.answerIndex];
   assert.ok(indices.length>0,`${level}/${seed}: pitch entry has a sounding target`);
   for(const index of indices){
    const expected=q.bars[bi].notes[index],entered=a.practiceEntryNoteForStep(q,expected.step,bi,index);
    assert.ok(entered&&!expected.rest,`${level}/${seed}: rests remain printed`);
    assert.equal(entered.step,expected.step,`${level}/${seed}: target pitch is reachable`);
    assert.equal(a.effectiveMidiForNote(q,q.bars[bi],entered),a.effectiveMidiForNote(q,q.bars[bi],expected),`${level}/${seed}: entered pitch sounds as expected`);
   }
  }
  if(q.preferredIntervalType&&q.intervalTarget){
   const t=q.intervalTarget,b=q.bars[t.barIndex],first=b.notes[t.firstIndex],second=b.notes[t.secondIndex];
   const number={second:2,third:3,fourth:4,fifth:5,sixth:6,seventh:7,octave:8}[q.preferredIntervalType];
   if(number)assert.equal(Math.abs(first.step-second.step)+1,number,`${level}/${seed}: requested interval remains on the score`);
   else assert.equal(Math.abs(a.effectiveMidiForNote(q,b,first)-a.effectiveMidiForNote(q,b,second)),6,`${level}/${seed}: tritone remains six semitones`);
  }
  for(const [bi,bar]of q.bars.entries()){
   const sig=a.timeSignatureForBar(q,bi);let beat=0;
   for(const n of bar.notes){assert.ok(Math.abs(n.beat-beat)<1e-7,`${level}/${seed}/bar ${bi+1}: playback onset`);beat+=n.beats;}
   assert.ok(Math.abs(beat-sig.top*4/sig.bottom)<1e-7,`${level}/${seed}/bar ${bi+1}: full duration`);
  }
 }
});


test('Higher excludes the three tasks that require the same development bars',()=>{
 assert.equal(a.hasQuestionTypeConflict(['chord','time','accidentals'],'H'),true);
 for(const ids of [['chord','time'],['chord','accidentals'],['time','accidentals']])assert.equal(a.hasQuestionTypeConflict(ids,'H'),false);
 assert.equal(a.hasQuestionTypeConflict(['ahChord','time','accidentals'],'AH'),false);
});

test('reharmonised absolute pitches agree with the displayed raised leading note',()=>{
 const key=a.KEYS.find(k=>k.id==='Dm');
 const note=a.makeNote({letter:'C',octave:4,step:-2,midi:60,absoluteAccidental:0},'crotchet',7,0,0,key,'V');
 assert.equal(note.writtenAccidental,1);
 assert.equal(a.effectiveMidiForNote({key},{chordSymbol:'V'},note),61);
});

test('the displayed half-beat answer is an accepted answer, including units',()=>{
 const answer=a.rhythmValueAcceptedAnswers('quaver');
 for(const value of [answer.answer,'0.5 beat','0.5 beats','half a beat','1/2 beat'])assert.ok(answer.accepts.includes(a.cleanAnswer(value)),value);
});

test('incomplete generated papers retry without exposing missing or duplicate questions',()=>{
 context.retryCandidateCalls=0;
 vm.runInContext('globalThis.savedPaperAttempt=makePracticePaperQuestionAttempt; makePracticePaperQuestionAttempt=(...args)=>({subquestions:args[6].sourceIds.slice(0,++retryCandidateCalls===1?5:6).map(sourceId=>({sourceId}))});',context);
 try{
  const q=vm.runInContext("makePracticePaperQuestion('N3')",context);
  assert.equal(q.subquestions.length,6);assert.equal(context.retryCandidateCalls,2);
  context.retryCandidateCalls=0;
  vm.runInContext('makePracticePaperQuestionAttempt=()=>{retryCandidateCalls++;return{subquestions:Array(6).fill({sourceId:"same"})}}',context);
  assert.throws(()=>vm.runInContext("makePracticePaperQuestion('N3')",context),/complete N3 practice paper/);
  assert.equal(context.retryCandidateCalls,40);
 }finally{vm.runInContext('makePracticePaperQuestionAttempt=savedPaperAttempt',context);}
});

test('Advanced Higher development selections retain space for complete two-bar questions',()=>{
 assert.equal(a.hasQuestionTypeConflict(['ahBassLine','barlines','time'],'AH'),true);
 for(const pair of [['ahBassLine','barlines'],['ahBassLine','time'],['barlines','time']])assert.equal(a.hasQuestionTypeConflict(pair,'AH'),false);
 assert.equal(a.hasQuestionTypeConflict(['ahChord','ahBassLine','accidentals','time'],'AH'),true);
 assert.equal(a.hasQuestionTypeConflict(['ahChord','ahBassLine','accidentals'],'AH'),false);
});

test('National 4 sequence tasks have at least two notes without nested retry exhaustion',()=>{
 const types=['dynamic','interval','missing','noteIdentification','repeatSigns','time'];
 context.auditSequenceTypes=Object.fromEntries(['barlines','cadence','chord','ahChord','ahBassLine','dynamic','interval','key','missing','noteIdentification','repeatSigns','rests','rhythmIdentification','rhythmicDictation','scaleDegrees','accidentals','enharmonics','triplets','articulation','transposition','tempoQuestion','time'].map(id=>[id,types.includes(id)]));
 vm.runInContext('globalThis.savedSequenceAttempt=makeEightBarRepetitionQuestionAttempt;globalThis.sequenceAttempts=0;makeEightBarRepetitionQuestionAttempt=(...args)=>{sequenceAttempts++;return savedSequenceAttempt(...args)}',context);
 try{
  for(const seed of [10030028,10030098])for(const metre of ['2/4','3/4','4/4']){
   randomState=seed;context.auditMetre=metre;context.sequenceAttempts=0;
   const q=vm.runInContext("makePracticePaperQuestion('N4',0,auditSequenceTypes,'N4',auditMetre)",context);
   assert.equal(q.timeSignature.id,metre);
   assert.ok(q.missingNoteIndices.length>=2);
   const source=q.bars[q.targetBar-1].notes,target=q.bars[q.targetBar].notes;
   assert.ok(source.length>=2);assert.equal(source.length,target.length);
   const offset=target[0].step-source[0].step;assert.equal(Math.abs(offset),1);
   source.forEach((n,i)=>{assert.equal(target[i].step-n.step,offset);assert.equal(target[i].rhythm,n.rhythm);});
   // Do not exhaust even one inner 160-attempt budget, let alone 161².
   assert.ok(context.sequenceAttempts<160,`seed ${seed}/${metre}: ${context.sequenceAttempts} attempts`);
  }
 }finally{vm.runInContext('makeEightBarRepetitionQuestionAttempt=savedSequenceAttempt',context);}
});

test('real marking handles correct, single-error mixed, and blank submissions across all levels',{timeout:30000},()=>{
 const start=source.indexOf('      function textAnswerCorrect('),end=source.indexOf('      function confirmPracticeQuestion()',start);
 vm.runInContext(source.slice(start,end),context);
 let callbacks=[];
 window.setTimeout=fn=>{callbacks.push(fn);return callbacks.length;};
 context.stopAudio=context.setIncompleteSubmitConfirmOpen=context.setFeedbackFading=context.setPrompt=context.setActivePracticePart=context.setConfettiKey=()=>{};
 context.markingTimersRef={current:[]};
 context.setScore=x=>{context.score=typeof x==='function'?x(context.score):x;};
 context.setFeedback=x=>{context.feedback=typeof x==='function'?x(context.feedback):x;};
 vm.runInContext('playSound=()=>{}',context);
 function mark(q,answers,notes){context.question=q;context.practiceAnswers=answers;context.userNotes=notes;context.feedback=null;context.markingQuestionRef={current:null};context.questionChangeInProgressRef={current:false};context.score={correct:0,attempted:0};callbacks=[];vm.runInContext('submitPracticeQuestion({requireComplete:false})',context);for(let i=0;i<callbacks.length;i++)callbacks[i]();return context.feedback;}
 for(const [li,level]of ['N3','N4','N5','H','AH'].entries())for(let i=1;i<=20;i++){
  randomState=li*100000+i;
  const q=a.makeQuestion(level,0,a.defaultPracticeQuestionTypesForLevel(level));
  const completed=a.practiceWorksheetCompletedState(q);
  const result=mark(completed.question,completed.practiceAnswers,completed.userNotes);
  assert.equal(result.totalCorrect,q.subquestions.length,`${level}/${i}: ${JSON.stringify(result.results)}`);
  for(const part of q.subquestions){
   const wrong=plain(completed),answer=wrong.practiceAnswers[part.id];
   if(['text','choice','timeChoice'].includes(part.type))wrong.practiceAnswers[part.id]='Wrong';
   else if(part.type==='notes'||part.type==='intervalInsert'){
    const bi=part.type==='notes'?q.targetBar:q.intervalInsertTarget.barIndex;
    const ni=part.type==='notes'?q.missingNoteIndices[0]:q.intervalInsertTarget.answerIndex;
    wrong.userNotes[`${bi}:${ni}`].step+=1;
   }else if(part.type==='dynamic'){
    const id=q.dynamic.id==='p'?'f':'p';wrong.question.placedDynamic.id=id;wrong.practiceAnswers[part.id]=id;
   }else if(part.type==='repeat')answer.placements[0].barIndex=(answer.placements[0].barIndex+1)%q.bars.length;
   else if(part.type==='barlines')answer.placements[0].barIndex+=1;
   else if(part.type==='rhythm'||part.type==='rhythmFix')for(const key of Object.keys(answer.placements))answer.placements[key]=answer.placements[key]==='quaver'?'crotchet':'quaver';
   else if(part.type==='scotchSnap')answer.selected.barIndex=q.bars.length+1;
   else if(part.type==='accidentalPlacement')answer.placements[0].symbolId=answer.placements[0].symbolId==='sharp'?'flat':'sharp';
   else if(part.type==='articulationPlacement')answer.selectedMarkingId=answer.selectedMarkingId==='accent'?'slur':'accent';
   else if(part.type==='tripletPlacement')answer.placements[0].tripletKind=answer.placements[0].tripletKind==='quaverTriplet'?'crotchetTriplet':'quaverTriplet';
   else if(part.type==='transposition'){
    const key=Object.keys(answer.notes).find(key=>answer.notes[key]&&!answer.notes[key].rest);answer.notes[key].octave+=1;answer.notes[key].step+=7;
   }else if(part.type==='enharmonic')answer.note.writtenAccidental=answer.note.writtenAccidental===1?-1:1;
   else if(part.type==='ahChord')answer.chordAnswers[Object.keys(answer.chordAnswers)[0]].chord='H';
   else if(part.type==='ahBassLine'){
    const note=answer.bassNotes[Object.keys(answer.bassNotes)[0]];note.letter=note.letter==='C'?'D':'C';
   }else if(part.type==='higherChord')answer.answers[Object.keys(answer.answers)[0]]='H';
   else throw new Error(`Missing incorrect-answer case for ${part.type}`);
   const mixed=mark(wrong.question,wrong.practiceAnswers,wrong.userNotes);
   assert.equal(mixed.results[part.id].correct,false,`${level}/${i}: reject wrong ${part.type}`);
   assert.equal(mixed.totalCorrect,q.subquestions.length-1,`${level}/${i}: preserve other correct answers`);
  }
  assert.equal(mark({...q,placedDynamic:null},{},{}).totalCorrect,0,`${level}/${i}: blank`);
 }
});


test('actual score renderer retains valid SVG and named pitch controls across all five levels',()=>{
 const server=require('react-dom/server');
 const seen=new Set();
 for(const [li,level]of ['N3','N4','N5','H','AH'].entries())for(let i=1;i<=20;i++){
  randomState=li*100000+i;
  const q=a.makeQuestion(level,0,a.defaultPracticeQuestionTypesForLevel(level));
  const answers={};
  for(const part of q.subquestions){
   if(part.type==='transposition')answers[part.id]={selectedRhythm:'crotchet'};
   if(part.type==='enharmonic')answers[part.id]={selectedAccidental:0};
  }
  const markup=server.renderToStaticMarkup(React.createElement(a.Score,{question:q,userNotes:{},setUserNotes:()=>{},practiceAnswers:answers,setPracticeAnswers:()=>{},setHoverNote:()=>{},feedback:null}));
  assert.ok(markup.includes('<svg'));assert.doesNotMatch(markup,/(?:NaN|Infinity)/);
  const worksheetMarkup=server.renderToStaticMarkup(React.createElement(a.Score,{question:q,userNotes:{},setUserNotes:()=>{},practiceAnswers:answers,setPracticeAnswers:()=>{},setHoverNote:()=>{},feedback:null,readOnly:true}));
  assert.doesNotMatch(worksheetMarkup,/tabindex="0"/,'static worksheets have no inert keyboard tab stops');
  assert.deepEqual(worksheetMarkup.match(/<text[^>]*>[\s\S]*?<\/text>/g),markup.match(/<text[^>]*>[\s\S]*?<\/text>/g),'read-only rendering preserves printed notation and labels');
  for(const input of worksheetMarkup.match(/<input\b[^>]*>/g)??[])assert.match(input,/readonly=""/,'worksheet answer boxes cannot be edited');
  for(const [type,label]of [['notes','Missing notes'],['intervalInsert','Missing notes'],['transposition','Transpose note'],['enharmonic','Enharmonic note'],['ahBassLine','Bass note']]){
   if(!q.subquestions.some(part=>part.type===type))continue;
   if(type==='transposition'&&q.transpositionTarget?.type!=='notes')continue;
   assert.ok(markup.includes(`aria-label="${label}`),`${level}/${i}: ${type} control`);seen.add(type);
  }
 }
 assert.deepEqual([...seen].sort(),['ahBassLine','enharmonic','intervalInsert','notes','transposition']);
});


test('8va and 8vb targets preserve their octave within the established sounding register',()=>{
 const bar={barIndex:4},key=a.KEYS.find(k=>k.id==='C');
 for(const [symbol,note,expected]of [['8va',{letter:'E',octave:4,midi:64},76],['8vb',{letter:'A',octave:4,midi:69},57]]){
  const q={key,transpositionTarget:{type:'meaning',barIndex:4,symbol}};
  assert.equal(a.effectivePlaybackMidiForNote(q,bar,note,0),expected);
  assert.equal(a.effectivePlaybackMidiForStackTone(q,bar,note),expected);
  assert.equal(a.effectivePlaybackMidiForNote(q,{barIndex:3},note,0),note.midi,'neighbouring bars keep their ordinary octave');
 }
 for(const [symbol,note]of [['8va',{letter:'E',octave:5,midi:76}],['8vb',{letter:'G',octave:4,midi:67}]])assert.equal(a.transpositionMeaningFitsPlaybackRange({key,bars:[{notes:[note]}]},{type:'meaning',barIndex:0,symbol}),false,'captured unplayable octave target must not be generated');
 const q={key,accidentalTarget:{barIndex:4,noteIndex:0,value:1}};
 assert.equal(a.effectivePlaybackMidiForNote(q,bar,{letter:'F',octave:4,midi:65,absoluteAccidental:0},0),66,'the listening accidental also replaces an explicit absolute pitch');
});


test('restored question selections recover safely and retain only level-supported boolean settings',()=>{
 const allFalse=Object.fromEntries(['barlines','cadence','chord','ahChord','ahBassLine','dynamic','interval','key','missing','noteIdentification','repeatSigns','rests','rhythmIdentification','rhythmicDictation','scaleDegrees','accidentals','enharmonics','triplets','articulation','transposition','tempoQuestion','time'].map(id=>[id,false]));
 for(const level of ['N3','N4','N5','H','AH'])for(const saved of [null,[],false,'invalid',allFalse,{...allFalse,time:true}, {ahChord:true,ahBassLine:true,triplets:'false'}]){
  const restored=a.normalisePracticeQuestionTypes(saved,level);assert.equal(a.canBuildPracticeQuestionSelection(restored,level),true);
  const visible=new Set(a.practiceQuestionTypesForLevel(level).map(t=>t.id));
  for(const [id,value]of Object.entries(restored)){assert.equal(typeof value,'boolean');if(value)assert.ok(visible.has(id)||id==='ahChordTypes');}
 }
 const custom=a.defaultPracticeQuestionTypesForLevel('AH');custom.ahChordTypes=false;
 assert.deepEqual(plain(a.normalisePracticeQuestionTypes(custom,'AH')),plain(custom),'valid preferences and the chord-type opt-out survive normalisation');
});


test('independent harmony inventory verifies every key, permitted chord and inversion',()=>{
 const natural={C:0,D:2,E:4,F:5,G:7,A:9,B:11},tonics={C:0,F:5,G:7,Am:9,D:2,Bb:10,Em:4,Dm:2};
 const major={I:[0,4,7],II:[2,5,9],IV:[5,9,0],V:[7,11,2],VI:[9,0,4],V7:[7,11,2,5]};
 const minor={...major,I:[0,3,7],IV:[5,8,0],VI:[8,0,3]};
 const shapes={dom7:[0,4,7,10],dim7:[0,3,6,9],aug:[0,4,8],add6:[0,4,7,9]};
 const pc=n=>((n%12)+12)%12;
 const pitch=(n,key)=>12*(n.octave+1)+natural[n.letter]+(n.displayAccidental??n.writtenAccidental??key.signatureAccidentals?.[n.letter]??0);
 for(const key of a.KEYS){
  const q={key,practiceLevel:'AH'},table=key.id.endsWith('m')?minor:major;
  for(const symbol of a.advancedHigherChordSymbolsForKey(key))for(const inversion of a.advancedHigherChordInversionOptions(symbol)){
   const voicing=a.makeAdvancedHigherChordVoicing(q,symbol,inversion,'inventory');
   const expected=table[symbol].map(x=>pc(tonics[key.id]+x));
   const actual=[...new Set([...voicing.trebleNote.stack,...voicing.bassNote.stack].map(n=>pc(pitch(n,key))))].sort((x,y)=>x-y);
   assert.deepEqual(actual,[...expected].sort((x,y)=>x-y),`${key.id}/${symbol}/${inversion}`);
   assert.equal(pc(pitch(voicing.bassNote,key)),expected[inversion]);
  }
  for(const type of Object.keys(shapes)){
   const spellings=a.advancedHigherChordTypeSpellingsForQuestion(q,type);
   if(key.id.endsWith('m')&&['add6','aug'].includes(type)){assert.equal(spellings.length,0);continue;}
   assert.ok(spellings.length,`${key.id}/${type} supported spelling`);
   for(const spelling of spellings){
    const notes=a.makeAdvancedHigherChordTypeStack(q,spelling);
    const pcs=[...new Set(notes.map(n=>pc(pitch(n,key))))],shape=shapes[type];
    assert.ok(pcs.some(root=>shape.length===pcs.length&&shape.every(d=>pcs.includes(pc(root+d)))),`${key.id}/${type}: independently spelled pitch classes ${pcs}`);
   }
  }
 }
});


test('circling is marked from the actual notes and accepts another valid paired-quaver example',()=>{
 const q={bars:[{notes:[{rhythm:'quaver'},{rhythm:'quaver'},{rhythm:'crotchet'}]},{notes:[{rhythm:'quaver'},{rhythm:'quaver'},{rhythm:'minim'}]}]};
 const single={variant:'circleNoteValue',targetRhythm:'crotchet'};
 assert.equal(a.circleSelectionCorrectForQuestion(q,{sourceId:'noteIdentification'},{barIndex:1,startIndex:2,targetRhythm:'crotchet'},single),false,'cached rhythm cannot turn a minim into a crotchet');
 assert.equal(a.circleSelectionCorrectForQuestion(q,{sourceId:'noteIdentification'},{barIndex:0,startIndex:2,targetRhythm:'minim'},single),true,'the selected printed crotchet is authoritative');
 const pair={variant:'pairedQuaversCircle',barIndex:0,startIndex:0};
 assert.equal(a.circleSelectionCorrectForQuestion(q,{sourceId:'rhythmIdentification'},{barIndex:1,startIndex:0},pair),true);
 assert.equal(a.circleSelectionCorrectForQuestion(q,{sourceId:'rhythmIdentification'},{barIndex:1,startIndex:1},pair),false);
 assert.equal(a.circleSelectionCorrectForQuestion(q,{sourceId:'noteIdentification'},{barIndex:999,startIndex:0,targetRhythm:'crotchet'},single),false);
});


test('actual score renders armed keyboard targets for rhythm, accidentals, circling and triplets',()=>{
 const server=require('react-dom/server');
 const configs=[['barlines','repeatSigns','rhythmIdentification','rhythmicDictation','scaleDegrees','accidentals'],['cadence','repeatSigns','rests','triplets','articulation','transposition']];
 const prefixes={rhythmFix:'Apply rhythm',accidentalPlacement:'Apply accidental',scotchSnap:'Circle selection',tripletPlacement:'Apply triplet'};
 const seen=new Set();
 for(const ids of configs){
  randomState=99;const settings=Object.fromEntries(Object.keys(a.defaultPracticeQuestionTypesForLevel('H')).map(id=>[id,ids.includes(id)]));
  const q=a.makeQuestion('H',0,settings);
  for(const [index,part]of q.subquestions.entries()){
   if(!prefixes[part.type])continue;
   const answers={[part.id]:{selectedRhythm:'crotchet',selectedSymbolId:'sharp',selectedTripletKind:'quaverTriplet',circleSelected:true}};
   const markup=server.renderToStaticMarkup(React.createElement(a.Score,{question:q,userNotes:{},setUserNotes:()=>{},practiceAnswers:answers,setPracticeAnswers:()=>{},setHoverNote:()=>{},feedback:null,activeIndex:index}));
   assert.ok(markup.includes(`aria-label="${prefixes[part.type]}`),`${part.type} exposes a keyboard target`);
   assert.doesNotMatch(markup,/(?:NaN|Infinity)/);seen.add(part.type);
  }
 }
 assert.deepEqual([...seen].sort(),Object.keys(prefixes).sort());
});


test('Higher da capo placement chooses a free line ending rather than colliding with a cadence',()=>{
 const ids=['cadence','interval','repeatSigns','rhythmicDictation','accidentals','time'];
 const settings=Object.fromEntries(Object.keys(a.defaultPracticeQuestionTypesForLevel('H')).map(id=>[id,ids.includes(id)]));
 for(let i=1;i<=25;i++){
  randomState=3007000+i;const q=a.makeQuestion('H',0,settings);
  assert.equal(q.repeatTarget.symbolId,'dc');assert.ok([7,15].includes(q.repeatTarget.barIndex));
  assert.notEqual(q.repeatTarget.barIndex,q.cadenceTarget.startBarIndex);assert.notEqual(q.repeatTarget.barIndex,q.cadenceTarget.endBarIndex);
 }
});


test('compound quaver beams respect each dotted-crotchet beat and 5/4 keeps its 3+2 grouping',()=>{
 const cases={'6/8':[[0,2],[3,5]],'9/8':[[0,2],[3,5],[6,8]],'12/8':[[0,2],[3,5],[6,8],[9,11]],'5/4':[[0,5],[6,9]]};
 for(const [id,expected]of Object.entries(cases)){
  const signature=a.TIME_SIGNATURES.find(s=>s.id===id),count=signature.top*8/signature.bottom;
  const notes=Array.from({length:count},(_,index)=>({rhythm:'quaver',beat:index*.5,beats:.5}));
  assert.deepEqual(plain(a.getQuaverGroups(notes,signature).map(g=>[g.start,g.end])),expected,id);
 }
});


test('Higher key questions cannot be paired with the chord guide that gives their answer',()=>{
 assert.equal(a.hasQuestionTypeConflict(['chord','key'],'H'),true);
 assert.equal(a.hasQuestionTypeConflict(['chord','key'],'N5'),false);
 assert.equal(a.hasQuestionTypeConflict(['ahChord','key'],'AH'),false);
 assert.equal(a.hasQuestionTypeConflict(['ahBassLine','key'],'AH'),true);
 const ids=['barlines','cadence','chord','interval','key','missing'];
 const saved=Object.fromEntries(Object.keys(a.defaultPracticeQuestionTypesForLevel('H')).map(id=>[id,ids.includes(id)]));
 assert.equal(a.canBuildPracticeQuestionSelection(saved,'H'),false);
 assert.equal(a.canBuildPracticeQuestionSelection(a.normalisePracticeQuestionTypes(saved,'H'),'H'),true);
});


test('pitch entry preserves visible rests and reaches every required qualification pitch',()=>{
 for(const level of ['N3','N4','N5','H','AH']){
  const range=a.missingNoteRangeForLevel(level);
  const q={level:level==='AH'?'H':level,practiceLevel:level,key:a.KEYS[0],targetBar:0,missingNoteIndices:[0,1,2],bars:[{notes:[{...range.min,rhythm:'crotchet',beats:1},{rest:true,rhythm:'crotchet',beats:1},{...range.max,rhythm:'minim',beats:2}]}]};
  assert.deepEqual(plain(a.missingNoteIndicesForQuestion(q)),[0,2]);
  assert.equal(a.practiceEntryNoteForStep(q,4,0,1),null);
  for(const index of [0,2]){
   const expected=q.bars[0].notes[index],actual=a.practiceEntryNoteForStep(q,expected.step,0,index);
   assert.equal(actual.step,expected.step,level);
   assert.equal(actual.midi,expected.midi,level);
   assert.equal(actual.beats,expected.beats);
  }
 }
});


test('worksheets recover sparse pools without permitting written answers to reveal one another',()=>{
 for(const level of ['N3','N4','N5','H','AH']){
  const inputs=[{}, {missing:true},a.defaultPracticeQuestionTypesForLevel(level)];
  if(level==='AH')inputs.push(Object.fromEntries(['ahChord','ahBassLine','key','interval','enharmonics','transposition','rests','scaleDegrees','cadence'].map(id=>[id,true])));
  for(const input of inputs){
   const types=a.practiceWorksheetQuestionTypes(input,level);
   assert.equal(a.canBuildPracticeQuestionSelection(types,level),true,level);
   randomState=137;
   const q=a.makePracticeWorksheetQuestion(level,types),ids=q.subquestions.map(p=>p.sourceId??p.id);
   assert.equal(q.subquestions.length,level==='AH'?8:6);
   assert.equal(q.bars.length,['H','AH'].includes(level)?16:8);
   for(const id of ['missing','rhythmicDictation','tempoQuestion','cadence','repeatSigns','chord','accidentals','ahChordTypes'])assert.equal(ids.includes(id),false,level+':'+id);
   assert.equal(a.hasQuestionTypeConflict(ids.filter(id=>!['N3','N4'].includes(level)||id!=='barlines'),level),false,level);
  }
 }
});

test('a two-note total-value box excludes the preceding quaver in a dense beamed group',()=>{
 const q=JSON.parse(fs.readFileSync('tests/fixtures/practice-total-value-box.json','utf8'));
 assert.deepEqual(q.rhythmIdentificationTarget.noteIndices,[1,2]);
 const svg=require('react-dom/server').renderToStaticMarkup(React.createElement(a.Score,{question:q,userNotes:{},setUserNotes:()=>{},practiceAnswers:{},setPracticeAnswers:()=>{},setHoverNote:()=>{},feedback:null,readOnly:true}));
 const attrs=svg.match(/<g data-score-question-source="rhythmIdentification"><rect([^>]+)>/)[1];
 const attr=(tag,key)=>Number(tag.match(new RegExp('(?:^| )'+key+'="([^"]+)"'))?.[1]);
 const box=Object.fromEntries(['x','y','width','height'].map(key=>[key,attr(attrs,key)]));
 const notes=[...svg.matchAll(/<text([^>]*)>([\s\S]*?)<\/text>/g)].filter(m=>/^[\uE0A2-\uE0A4\uE1D2-\uE1DA]$/.test(m[2])).map(m=>({x:attr(m[1],'x'),y:attr(m[1],'y')}));
 assert.equal(notes.filter(n=>n.x>=box.x&&n.x<=box.x+box.width&&n.y>=box.y&&n.y<=box.y+box.height).length,2);
 assert.ok(box.width>0);assert.doesNotMatch(svg,/NaN|Infinity/);
});

test('total-value patterns cover longer and dotted notes with correct complete-bar totals',()=>{
 const beats={quaver:.5,crotchet:1,dottedCrotchet:1.5,minim:2,dottedMinim:3,semibreve:4};
 for(const id of ['2/4','3/4','4/4','6/8','9/8','12/8']){
  const sig=a.TIME_SIGNATURES.find(s=>s.id===id),candidates=a.rhythmTotalPatternCandidates(sig);
  const totals=new Set(candidates.map(c=>c.totalBeats));
  assert.ok(totals.size>=3,id);
  if(id!=='2/4')assert.ok([...totals].some(n=>n>2),id);
  for(const c of candidates){assert.equal(c.pattern.reduce((sum,r)=>sum+beats[r],0),sig.top*4/sig.bottom);assert.equal(c.totalBeats,beats[c.pattern[c.noteIndex]]+beats[c.pattern[c.noteIndex+1]]);}
 }
});
test('adjacent total-value selection balances available answers rather than the number of note pairs',()=>{
 const q={key:a.KEYS[0],timeSignature:a.TIME_SIGNATURES.find(s=>s.id==='4/4'),bars:[{barIndex:0,chordSymbol:'I',notes:[a.noteByLetter('C',4)]}]};
 const counts={};randomState=8621;
 for(let i=0;i<600;i++){const target=a.plantAdjacentRhythmTotalTarget(q,[0]);counts[target.totalBeats]=(counts[target.totalBeats]||0)+1;}
 assert.ok(Object.keys(counts).length>=6);
 for(const n of Object.values(counts))assert.ok(n>40&&n<150,JSON.stringify(counts));
});
test('Higher preserves its weighted harmony choice through rejected generation attempts',()=>{
 vm.runInContext('globalThis.originalAttempt=makePracticePaperQuestionAttempt;globalThis.harmonyRetries=[];makePracticePaperQuestionAttempt=(level,attempt,settings,timeLevel,metre,harmony,plan)=>{harmonyRetries.push(harmony);if(harmonyRetries.length<4)throw {type:PRACTICE_QUESTION_RETRY,lockedTimeSignatureId:metre};return {subquestions:plan.sourceIds.map(sourceId=>({sourceId}))};}',context);
 try{
  randomState=9132;vm.runInContext("makePracticePaperQuestion('H',0,defaultPracticeQuestionTypesForLevel('H'))",context);
  assert.equal(context.harmonyRetries.length,4);assert.equal(new Set(context.harmonyRetries).size,1);assert.ok(['chord','key'].includes(context.harmonyRetries[0]));
 }finally{vm.runInContext('makePracticePaperQuestionAttempt=originalAttempt',context);}
});
test('matching a missing pitch retains the target accidental rather than imposing the melodic-minor default',()=>{
 const q={level:'H',practiceLevel:'H',key:a.KEYS.find(k=>k.id==='Dm'),bars:[{notes:[{...a.noteByLetter('F',4),writtenAccidental:1,rhythm:'crotchet',beats:1}]}]};
 const n=q.bars[0].notes[0],entered=a.practiceEntryNoteForStep(q,n.step,0,0);
 assert.equal(entered.writtenAccidental,1);assert.equal(a.effectiveMidiForNote(q,q.bars[0],entered),a.effectiveMidiForNote(q,q.bars[0],n));
});

test('Higher harmony selection retains approximately 80:20 frequency over ten thousand complete draws',()=>{
 vm.runInContext('globalThis.savedFrequencyAttempt=makePracticePaperQuestionAttempt;globalThis.harmonyCounts={chord:0,key:0};makePracticePaperQuestionAttempt=(level,attempt,settings,timeLevel,metre,harmony,plan)=>{harmonyCounts[harmony]++;return {subquestions:plan.sourceIds.map(sourceId=>({sourceId}))};}',context);
 try{
  randomState=41872;vm.runInContext("for(let i=0;i<10000;i++)makePracticePaperQuestion('H',0,defaultPracticeQuestionTypesForLevel('H'));",context);
  assert.equal(context.harmonyCounts.chord+context.harmonyCounts.key,10000);
  assert.ok(context.harmonyCounts.key>=1850&&context.harmonyCounts.key<=2150,JSON.stringify(context.harmonyCounts));
 }finally{vm.runInContext('makePracticePaperQuestionAttempt=savedFrequencyAttempt',context);}
});

test('all question choices, metre and requested interval survive retries at every level',()=>{
 vm.runInContext('globalThis.savedPlanAttempt=makePracticePaperQuestionAttempt;globalThis.plans=[];makePracticePaperQuestionAttempt=(level,attempt,settings,timeLevel,metre,harmony,plan)=>{plans.push(JSON.stringify({metre,plan}));if(plans.length<4)throw {type:PRACTICE_QUESTION_RETRY,lockedTimeSignatureId:metre};return {subquestions:plan.sourceIds.map(sourceId=>({sourceId}))};}',context);
 try{
  for(const level of ['N3','N4','N5','H','AH']){
   context.plans=[];context.planLevel=level;
   vm.runInContext("makeQuestion(planLevel,0,defaultPracticeQuestionTypesForLevel(planLevel))",context);
   assert.equal(context.plans.length,4,level);assert.equal(new Set(context.plans).size,1,level);
  }
 }finally{vm.runInContext('makePracticePaperQuestionAttempt=savedPlanAttempt',context);}
});
test('Advanced Higher entry reaches the B5 and C6 pitches beyond the legacy melody pool',()=>{
 for(const [step,letter,midi]of [[11,'B',83],[12,'C',84]]){
  const q={level:'H',practiceLevel:'AH',key:a.KEYS[0],bars:[{notes:[{step,letter,octave:step===11?5:6,midi,rhythm:'crotchet',beats:1}]}]};
  const entered=a.practiceEntryNoteForStep(q,step,0,0);assert.ok(entered);assert.equal(entered.step,step);assert.equal(entered.midi,midi);
 }
 assert.equal(a.missingNoteRangeForLevel('AH').max.step,12);
});

test('N5 rejects overfull eight-bar selections before the weighted question draw',()=>{
 assert.equal(a.hasQuestionTypeConflict(['cadence','chord','missing','barlines','interval','key'],'N5'),true);
 assert.equal(a.hasQuestionTypeConflict(['cadence','chord','missing','tempoQuestion','interval','key'],'N5'),false);
});
test('an incomplete draft cannot replace a planned task with a different question',()=>{
 vm.runInContext('globalThis.savedReplacementAttempt=makePracticePaperQuestionAttempt;globalThis.replacementCalls=0;makePracticePaperQuestionAttempt=(level,attempt,settings,timeLevel,metre,harmony,plan)=>({subquestions:++replacementCalls===1?Array.from({length:6},(_,i)=>({sourceId:"unexpected-"+i})):plan.sourceIds.map(sourceId=>({sourceId}))});',context);
 try{
  vm.runInContext("makeQuestion('N5',0,defaultPracticeQuestionTypesForLevel('N5'))",context);assert.equal(context.replacementCalls,2);
 }finally{vm.runInContext('makePracticePaperQuestionAttempt=savedReplacementAttempt',context);}
});

test('D minor accidental questions can raise B flat to B natural without rejecting the selected task',()=>{
 const q={level:'H',practiceLevel:'AH',targetBar:4,key:a.KEYS.find(k=>k.id==='Dm'),timeSignature:a.TIME_SIGNATURES.find(s=>s.id==='4/4'),bars:Array.from({length:16},(_,barIndex)=>({barIndex,chordSymbol:'I',notes:Array.from({length:4},(_,noteIndex)=>({letter:'C',octave:4,step:-2,midi:60,rhythm:'crotchet',beats:1,beat:noteIndex,noteIndex,barIndex,writtenAccidental:null}))}))};
 const target=a.makeAccidentalQuestionTarget(q,[],[8]);
 assert.ok(target);assert.equal(target.symbolId,'natural');assert.equal(target.value,0);assert.equal(target.answer,'Natural');
 const bar=q.bars[target.barIndex],note=bar.notes[target.noteIndex];
 const played=a.effectivePlaybackMidiForNote({...q,accidentalTarget:target},bar,{...note,absoluteAccidental:-1},target.noteIndex);
 assert.equal(played,a.effectiveMidiForNote(q,bar,{...note,absoluteAccidental:0,writtenAccidental:0}));
});

test('AH transposition chooses a compatible printed bar and clef without rewriting the melody',()=>{
 const q={level:'H',practiceLevel:'AH',key:a.KEYS[0],timeSignature:a.TIME_SIGNATURES.find(s=>s.id==='3/4'),bars:Array.from({length:16},(_,barIndex)=>({barIndex,chordSymbol:'I',notes:barIndex===1?[{letter:'G',octave:4,step:2,midi:67},{letter:'A',octave:4,step:3,midi:69},{letter:'B',octave:4,step:4,midi:71}].map((n,i)=>({...n,rhythm:'crotchet',beats:1,beat:i})):[{rest:true,rhythm:'dottedMinim',beats:3,beat:0}]}))};
 const before=JSON.stringify(q.bars);
 for(let i=0;i<100;i++){
  const target=a.makeTranspositionTarget(q,[]);assert.ok(target);assert.equal(target.barIndex,1);
  if(target.type==='notes'){
   for(const n of target.sourceNotes)assert.equal(a.transpositionNoteFitsClefForQuestion(n,target.sourceClef,q),true);
   for(const n of target.answerNotes)assert.equal(a.transpositionNoteFitsClefForQuestion(n,target.answerClef,q),true);
  }else assert.equal(a.transpositionMeaningFitsPlaybackRange(q,target),true);
  assert.equal(JSON.stringify(q.bars),before);
 }
});
test('AH keeps the full planned task mix when accidentals, rests and scale-degree boxes compete for space',()=>{
 const ids=['ahChord','key','enharmonics','transposition','rests','scaleDegrees','missing','accidentals'];
 context.crowdedTypes=Object.fromEntries([...Object.keys(a.defaultPracticeQuestionTypesForLevel('AH')),'ahChordTypes'].map(id=>[id,ids.includes(id)]));
 vm.runInContext('globalThis.savedCrowdedKeyPicker=randomPracticeKeyWith;randomPracticeKeyWith=()=>KEYS.find(k=>k.id==="C")',context);
 try{
  randomState=6;const q=vm.runInContext("makePracticePaperQuestion('H',0,crowdedTypes,'AH','2/4')",context,{timeout:5000});
  assert.deepEqual(plain(q.subquestions.map(p=>p.sourceId)).sort(),ids.slice().sort());
  assert.ok(q.transpositionTarget);assert.ok(q.accidentalTarget);
  assert.ok(![q.accidentalTarget.barIndex,q.accidentalTarget.resolutionBarIndex].includes(q.rhythmFixTarget.barIndex));
 }finally{vm.runInContext('randomPracticeKeyWith=savedCrowdedKeyPicker',context);}
});


test('AH chord candidates use 20% root, 40% first and 40% second inversion weights',()=>{
 randomState=71425;
 const counts=[0,0,0];
 const candidates=[0,1,2].map(inversion=>({inversion}));
 for(let i=0;i<20000;i++)counts[a.weightedAdvancedHigherChordCandidate(candidates).inversion]++;
 for(const [inversion,expected] of [0.2,0.4,0.4].entries()){
  assert.ok(Math.abs(counts[inversion]/20000-expected)<0.015,`${inversion}: ${counts[inversion]}`);
 }
 const restricted=[{chordSymbol:'II',inversion:0},{chordSymbol:'II',inversion:1}];
 for(let i=0;i<100;i++)assert.notEqual(a.weightedAdvancedHigherChordCandidate(restricted).inversion,2);
});
