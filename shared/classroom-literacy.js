(function(root,factory){
 const server=typeof module==='object'&&module.exports;
 const bank=server?require('../whowantstobemillionaire/millionaire-question-bank.js'):root.MILLIONAIRE_QUESTION_BANK;
 const activities=server?require('./classroom-activities.js'):root.MLH.classroomActivities;
 const barlines=server?require('./barlines-core.js'):root.BARLINES_CORE;
 const api=factory(bank,activities,barlines);
 if(server)module.exports=api;
 else root.MLH.classroomLiteracy=api;
})(globalThis,function(bank,activities,barlines){
 'use strict';
 const levels=['N3','N4','N5','H','AH'];
 const durationConcepts=/^(crotchet-beats|minim-beats|dotted-minim-beats|semibreve-beats|quaver-beats|semiquaver-beats|rhythm-addition-|rhythm-sum-|rhythm-completion$|two-rhythm-quaver-sum$|three-rhythm-(semiquaver-sum|completion)$|national-5-rhythm-|triplet-equivalence$|note-rest-sum$|higher-time-signature$)/;
 const routes={
  '/barlines.html':[['N3','N4','N5','H','AH'],null],
  '/readingrhythms.html':[['N3','N4','N5','H','AH'],durationConcepts],
  '/rhythmidentification.html':[['N3','N4','N5','H'],durationConcepts],
  '/intervals.html':[['N3','N5','H','AH'],/^(step|leap|tone-or-semitone|interval-identification|diatonic-interval-identification|tritone)$/],
  '/keysignatures.html':[['N5','H','AH'],/^(key-signature-identification|key-signature-accidental|tonic-subdominant-dominant|raised-seventh)$/],
  '/scaledegrees.html':[['H'],/^tonic-subdominant-dominant$/],
  '/chords.html':[['N5','H','AH'],/^(chord-identification|chord-and-position|bass-note-from-chord)$/],
  '/rhythmsums.html':[['N3','N4','N5','H'],/^(rhythm-addition-|rhythm-sum-|rhythm-completion$|two-rhythm-quaver-sum$|three-rhythm-(semiquaver-sum|completion)$|note-value-comparison$|national-5-rhythm-sum$|note-rest-sum$)/],
  '/timesignatures.html':[['N3','N4','N5','H','AH'],/^(time-signature|complete-|national-5-(time-signature|bar-completion)$|higher-time-signature$)/],
  '/rests.html':[['H'],/^(rest-name|rest-value|note-rest-sum|missing-rest)$/],
  '/dynamics.html':[['N3','N4','N5'],/^(crescendo-symbol|diminuendo-symbol|forte-symbol|piano-symbol|mezzo-|dynamic-|national-5-dynamics|sforzando)/],
  '/articulationmarkings.html':[['H'],/^articulation-/],
  '/repeatsigns.html':[['N4','N5','H','AH'],/^(repeat-sign-|repeat-ending-|da-capo-definition$|fine-definition$|segno$|ds-al-fine$)/],
  '/enharmonicequivalents.html':[['AH'],/^enharmonic-equivalent$/],
  '/melodicdictation.html':[['N4','N5','H','AH'],/^two-bar-(repetition|sequence|near-sequence)/],
  '/transposing.html':[['H','AH'],null],
 };
 const allAnswers=Array.from({length:6},(_,pitch)=>({id:'literacy-choice:'+pitch,pitch}));

 function settings(activity){
  const validated=activities.settings(activity);
  if(!validated||activities.usesOriginalFormat(activity))return null;
  const url=new URL(validated.activity,'https://classroom.invalid');
  const levelQuery=url.searchParams.get('level');
  let pathname=url.pathname;
  if(pathname==='/accidentals.html'&&(levelQuery==='AH'||url.searchParams.get('section')==='enharmonics'))pathname='/enharmonicequivalents.html';
  if(pathname==='/keysignatures.html'&&levelQuery==='H')pathname='/scaledegrees.html';
  const route=routes[pathname];
  if(!route||url.searchParams.get('mode')==='order')return null;
  const level=levelQuery||route[0][0];
  if(!route[0].includes(level))return null;
  const state=pathname==='/barlines.html'?activities.activityProfile(activity).state:null;
  return {activity:validated.activity,level,options:{pathname,level,...(state?{state}:{})}};
 }

 function choice(question,correctAnswer,labels,notation){
  return {question,notation,correctAnswer,answers:labels.map(text=>({id:text,text}))};
 }

 function chordNames(){
  const keys=[
   ['C major',['C major','F major','G major','A minor']],
   ['G major',['G major','C major','D major','E minor']],
   ['F major',['F major','B flat major','C major','D minor']],
   ['A minor',['A minor','D minor','E major','F major']],
  ];
  const numerals=['I','IV','V','VI'];
  return keys.flatMap(([key,names])=>names.map((name,index)=>
   choice(`In ${key}, which chord is chord ${numerals[index]}?`,name,names)));
 }

 function dynamics(){
  return [
   ['crescendo','gradually louder'],['diminuendo','gradually quieter'],['f','loud'],['p','quiet'],
  ].map(([dynamic,answer])=>choice(`Which direction tells you to play ${answer}?`,
    ({crescendo:'Crescendo',diminuendo:'Diminuendo',f:'Forte',p:'Piano'})[dynamic],
    ['Crescendo','Diminuendo','Forte','Piano']));
 }

 function repeatBars(){
  return [2,3,4,5,6,8].map(bars=>choice(
   `A section is ${bars} bars long and is marked to repeat once. How many bars do you play altogether?`,
   String(bars*2),[bars,bars*2,bars+1,bars*3].map(String)));
 }

 function transpositions(){
  const notes=['C','D','E','F','G','A','B'];
  return notes.flatMap(note=>['H','AH'].map(level=>{
   const from=level==='H'?4:3;
   const to=level==='H'?3:4;
   const clef=level==='H'?'treble':'bass';
   const target=level==='H'?'bass':'treble';
   return {level,...choice(`Which note should be written one octave ${level==='H'?'lower':'higher'} in the ${target} clef?`,
    note+to,[note+from,note+to,note+(from===4?5:2),notes[(notes.indexOf(note)+1)%notes.length]+to],
    {kind:'note',pitch:note+from,clef})};
  }));
 }

 function stepsAndLeaps(){
  const pitches=['E4','F4','G4','A4','B4','C5','D5','E5'];
  return pitches.slice(0,-2).flatMap((pitch,index)=>[1,2].map(distance=>choice(
   'Do the notes move by step or by leap?',distance===1?'Step':'Leap',['Step','Leap'],
   {kind:'melody',pitches:[pitch,pitches[index+distance]]})));
 }

 function barlinePool(level,state={}){
  const core=barlines.create(activities.random(1164));
  const {enabledRhythms,restsEnabled}=core.normaliseSettings(level,state.enabledRhythms,state.restsEnabled);
  const glyphs={crotchet:'quarterNote',minim:'halfNote','dotted-minim':'dottedHalfNote',semibreve:'wholeNote',
   quaver:'eighthNote',semiquaver:'sixteenthNote','dotted-crotchet':'dottedQuarterNote','dotted-quaver':'dottedEighthNote'};
  const questions=new Map();
  for(let attempt=0;attempt<240&&questions.size<50;attempt++){
   const score=core.buildQuestion(level,core.levelTimeTypes(level,enabledRhythms),enabledRhythms,restsEnabled);
   const notes=score.items.filter(note=>note.barIndex<2);
   if(notes.some(note=>!glyphs[note.rhythm]||note.tieToNext))continue;
   const boundary=notes.filter(note=>note.barIndex===0).length;
   const displayed=notes.slice(0,Math.max(boundary+1,Math.min(notes.length,10)));
   const positions=Array.from({length:displayed.length-1},(_,index)=>index+1)
    .sort((a,b)=>Math.abs(a-boundary)-Math.abs(b-boundary)).slice(0,4);
   if(positions.length<2)continue;
   const answer=index=>'After note '+index;
   const symbols=displayed.map(note=>glyphs[note.rhythm]);
   const metre=score.timeSignature.id;
   const id=JSON.stringify([metre,symbols]);
   questions.set(id,choice(`Where should the first barline go in ${metre}?`,answer(boundary),
    positions.map(answer),{kind:'glyphs',glyphs:symbols,label:'Rhythms before and after the missing barline.'}));
  }
  if(questions.size>=5)return [...questions.values()];
  const metres=core.LEVELS[level].timeSignatureIds;
  for(const [numerator,denominator] of metres.map(metre=>metre.split('/').map(Number))){
   const unit=denominator===4?'crotchet':'quaver';
   for(const bars of [1,2,3]){
    const total=numerator*bars;
    const id=`${numerator}/${denominator}/${bars}`;
    questions.set(id,choice(`How many ${unit}s fit between the start and barline ${bars} in ${numerator}/${denominator}?`,
     String(total),[total,total+1,total-1,total+2].map(String)));
   }
  }
  return [...questions.values()];
 }

 function pool({pathname,level,state}){
  if(pathname==='/barlines.html')return barlinePool(level,state);
  const [,concepts]=routes[pathname];
  const exact=['/intervals.html','/scaledegrees.html','/enharmonicequivalents.html','/rests.html','/articulationmarkings.html'].includes(pathname);
  const reviewed=concepts?bank.filter(q=>concepts.test(q.concept)&&q.answers.length>=2&&q.answers.length<=6&&!q.audioSrc
    &&(exact?q.level===level:levels.indexOf(q.level)<=levels.indexOf(level))):[];
  const extras=pathname==='/chords.html'&&level!=='AH'?chordNames()
   :pathname==='/dynamics.html'?dynamics()
   :pathname==='/repeatsigns.html'?repeatBars()
   :pathname==='/transposing.html'?transpositions().filter(q=>q.level===level)
   :pathname==='/intervals.html'&&level==='N3'?stepsAndLeaps()
   :[];
  const seen=new Set();
  return [...reviewed,...extras].filter(q=>{
   const identity=JSON.stringify([q.question.replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim().toLowerCase(),q.notation||null]);
   if(seen.has(identity))return false;
   seen.add(identity);
   return true;
  });
 }

 function questions(options,count,random=Math.random){
  const source=pool(options);
  if(!source.length)throw Error('No classroom questions are available at this level.');
  return activities.shuffle(source,random).slice(0,count).map(q=>{
   const choices=activities.shuffle(q.answers,random);
   const pitch=choices.findIndex(answer=>answer.id===q.correctAnswer);
   return {type:'choice',pitch,score:{
    prompt:q.question,concept:q.concept,
    notation:q.notation?{...q.notation,label:'Music notation for this question'}:null,
    choices:choices.map(({text})=>({text})),
   }};
  });
 }

 function answers(question){
  return question?.score?.choices.map(({text},index)=>({...allAnswers[index],label:text}))||[];
 }

 return {settings,questions,available:options=>pool(options).length,answers,allAnswers};
});
