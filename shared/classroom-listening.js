(function(root){
 const server=typeof module==='object'&&module.exports;
 const activities=server?require('./classroom-activities.js'):root.MLH.classroomActivities;
 const bank=server?require('../whowantstobemillionaire/millionaire-question-bank.js'):root.MILLIONAIRE_QUESTION_BANK;
 const dictation=server?require('./melodic-dictation-questions.js'):root.MLH.MelodicDictationQuestions;
 const national5=(server?require('../practice-melody-generator.js'):root.PracticeMelodyGenerator)?.national5;
 const allAnswers=Array.from({length:6},(_,pitch)=>({id:'listening-choice:'+pitch,pitch}));
 const writtenChoiceIds=allAnswers.map(({pitch})=>({id:'literacy-choice:'+pitch,pitch}));
 const levels=['N3','N4','N5','H','AH'];
 const naturalPitches={C:0,D:2,E:4,F:5,G:7,A:9,B:11};

 function midi(pitch){
  const [,letter,accidental,octave]=pitch.match(/^([A-G])([#b]?)(\d)$/);
  return (Number(octave)+1)*12+naturalPitches[letter]+(accidental==='#'?1:accidental==='b'?-1:0);
 }
 function note(midi,start,duration,volume=.1){return {midi,start,duration,volume};}
 function sequence(notes,duration){return {kind:'notes',notes,duration};}
 function melodyClip(bars,beat=.45){
  const pitches=bars.flatMap(bar=>bar.map(midi));
  return sequence(pitches.map((pitch,i)=>note(pitch,i*beat,beat*.8)),pitches.length*beat);
 }
 function question(prompt,answer,choices,audio,notation=null,systems=null){
  return {prompt,answer,choices,audio,notation,systems};
 }

 // Use the reviewed melodic relationship questions, with aural prompts and no displayed answer.
 function melodies(options){
  if(options.level==='N3'){
   const choices=['Ascends','Descends','Stays the same'];
   const pitches=['C4','D4','E4','F4','G4','A4','B4','C5'];
   return pitches.slice(0,-2).flatMap((pitch,i)=>[
    [pitch,pitches[i+1],pitches[i+2]],
    [pitches[i+2],pitches[i+1],pitch],
    [pitch,pitch,pitch],
   ].map((notes,j)=>question('What happens to the pitch of this melody?',choices[j],choices,melodyClip([notes]))));
  }
  return bank.filter(q=>q.notation?.kind==='twoBarMelody'&&levels.indexOf(q.level)<=levels.indexOf(options.level))
   .map(q=>question('Listen to both bars. What is the relationship between them?',
    q.answers.find(answer=>answer.id===q.correctAnswer).text,q.answers.map(answer=>answer.text),melodyClip(q.notation.bars)));
 }
 const figures=[
  {label:'Two crotchets',notes:[1,1]},
  {label:'One minim',notes:[2]},
  {label:'Two quavers, then a crotchet',notes:[.5,.5,1]},
  {label:'A crotchet, then two quavers',notes:[1,.5,.5]},
  {label:'Four quavers',notes:[.5,.5,.5,.5]},
  {label:'A dotted crotchet, then a quaver',notes:[1.5,.5]},
  {label:'A quaver, then a dotted crotchet',notes:[.5,1.5]},
  {label:'Four semiquavers, then a crotchet',notes:[.25,.25,.25,.25,1]},
 ];
 function rhythms(options){
  const patterns=figures.slice(0,options.level==='N3'?5:options.level==='N4'?6:8);
  const choices=patterns.map(pattern=>pattern.label);
  return [.5,.63].flatMap(beat=>patterns.map(pattern=>{
   const notes=[];
   let time=0;
   // A complete measure is played before the response window opens.
   for(const length of pattern.notes){notes.push(note(67,time,length*beat*.8));time+=length*beat;}
   return question('Which rhythm did you hear?',pattern.label,
    [pattern.label,...choices.filter(label=>label!==pattern.label).slice(0,4)],sequence(notes,time));
  }));
 }

 function fourBarScores(options,repeats=false){
  const pitches=['C4','D4','E4','F4','G4','A4','B4','C5'];
  const barShapes=[[0,1,2,1],[2,0,3,2],[1,3,3,0],[3,2,1,0]];
  // Simple original excerpts. Both the notation and audio use these same pitches.
  const endingOrders=[
   {order:[0,1,0,1,2,3],label:'Bars 1–2'},
   {order:[0,1,2,1,2,3],label:'Bars 2–3'},
   {order:[0,1,2,3,2,3],label:'Bars 3–4'},
   {order:[0,1,2,3,0,1,2,3],label:'Bars 1–4'},
  ];
  return [0,1,2,3].flatMap(offset=>{
   const bars=barShapes.map(shape=>shape.map(step=>pitches[step+offset]));
   const systems=[0,2].map(start=>({kind:'twoBarMelody',bars:bars.slice(start,start+2),label:'Bars '+(start+1)+'–'+(start+2)}));
   if(repeats){
    const choices=endingOrders.map(row=>row.label);
    return endingOrders.map(row=>question('Which bars were repeated?',row.label,choices,
     melodyClip(row.order.map(index=>bars[index]),.32),null,systems));
   }
   const choices=['Bar 1','Bar 2','Bar 3','Bar 4'];
   return choices.map((answer,i)=>question('Follow the score. In which bar does the music stop?',answer,choices,
    melodyClip(bars.slice(0,i+1),.43),null,systems));
  });
 }

 function chords({level,state}){
  if(level==='N5'&&state?.n5Customise?.chordProgression&&state.n5Customise.identifyChord===false){
   const progressions=[1,2,3].flatMap(viPosition=>[false,true].map(reverse=>national5.makeProgression({barCount:4,viPosition,reverse})));
   const labels=progressions.map(progression=>progression.map(symbol=>symbol==='VI'?'vi':symbol).join(' – '));
   const steps={I:[0,4,7],IV:[5,9,12],V:[7,11,14],VI:[9,12,16]};
   return [['C major',48],['F major',53],['G major',55]].flatMap(([key,tonic])=>progressions.map((progression,index)=>{
    const notes=progression.flatMap((symbol,bar)=>steps[symbol].map(step=>note(tonic+step,bar*.9,.8,.07)));
    return question(`Which chord sequence do you hear in ${key}?`,labels[index],
     [labels[index],labels[(index+1)%labels.length],labels[(index+3)%labels.length]],sequence(notes,3.6));
   }));
  }
  const advanced=level==='AH';
  const {identifyChords=true,insertPosition=true,createBassLine=true}=state?.ahCustomise??{};
  const written=advanced?bank.filter(item=>item.level==='AH'&&(
   insertPosition&&item.concept==='chord-and-position'||createBassLine&&item.concept==='bass-note-from-chord'
  )).map(item=>question(item.question,item.answers.find(answer=>answer.id===item.correctAnswer)?.text,
   item.answers.map(answer=>answer.text),null,item.notation)):[];
  if(advanced&&!identifyChords)return written;
  const qualities=advanced
   ?[['Diminished 7th',[0,3,6,9]],['Dominant 7th',[0,4,7,10]],['Added 6th',[0,4,7,9]],['Augmented triad',[0,4,8]]]
   :[['Major',[0,4,7]],['Minor',[0,3,7]]];
  if(level==='H')qualities.push(['Diminished',[0,3,6]]);
  const listening=[48,50,52,53,55,57,59,60].flatMap(root=>{
   return qualities.map(([quality,steps])=>{
    const pitches=steps.map(step=>root+step);
    const arpeggio=pitches.map((pitch,i)=>note(pitch,i*.32,.28));
    const block=pitches.map(pitch=>note(pitch,1.2,.9,.075));
    return question('Which chord quality did you hear?',quality,qualities.map(([label])=>label),
     sequence([...arpeggio,...block],2.15));
   });
  });
  return [...listening,...written];
 }

 function expression(options){
  const articulation=options.format==='articulation';
  const figures=articulation?[
   {id:'staccato',label:'Staccato',length:.29,volumes:[.1,.1,.1,.1]},
   {id:'slur',label:'Legato',length:1.01,volumes:[.1,.1,.1,.1]},
   {id:'accent',label:'Accent on the third note',length:.86,volumes:[.045,.045,.22,.045]},
  ]:[
   {id:'crescendo',label:'Gradually louder',length:.9,volumes:[.02,.044,.09,.19]},
   {id:'diminuendo',label:'Gradually quieter',length:.9,volumes:[.19,.09,.044,.02]},
   {id:'steady',label:'Stays at the same volume',length:.9,volumes:[.1,.1,.1,.1]},
  ];
  const selected=articulation?options.state.enabledMarkings:options.state.enabledDynamics;
  const applicable=figures.filter(figure=>!Array.isArray(selected)||selected.includes(figure.id)||figure.id==='steady');
  const targets=(applicable.length>1?applicable:figures);
  return [[60,62,64,65],[69,67,65,64],[64,65,67,69],[67,65,64,62],[65,69,67,64]].flatMap(motif=>
   targets.map(({label,length,volumes})=>question(
    articulation?'How are the notes played?':'How does the volume change?',
    label,figures.map(figure=>figure.label),
    sequence(motif.map((pitch,i)=>note(pitch,i*.51,.51*length,volumes[i])),2.06))));
 }

 function safeRecording(src){
  if(typeof src!=='string'||!src.startsWith('./audio/concept-library/'))return false;
  try{return !decodeURIComponent(src).split('/').slice(1).some(part=>part==='..'||part==='.')&&/\.(m4a|mp3|wav|ogg)$/i.test(src);}
  catch{return false;}
 }
 function dictionaryQuestions(options,material){
  const recordings=material?.recordings||[];
  return recordings.filter(q=>levels.indexOf(q.levelCode)<=levels.indexOf(options.level)&&q.modality==='audio'&&
    q.format==='multiple-choice'&&q.options?.length>=2&&q.options.length<=6&&safeRecording(q.media?.src)&&q.answer?.correctOptionIds?.length===1)
   .flatMap(q=>{
    const answer=q.options.find(choice=>choice.id===q.answer.correctOptionIds[0])?.text;
    return answer?[question(q.prompt,answer,q.options.map(choice=>choice.text),{kind:'file',src:q.media.src})]:[];
   });
 }
 function collectionQuestions(options,material){
  const collection=material?.collection;
  const recipe=collection?.sortRecipe;
  const isStyles=recipe?.type==='styles';
  let items=collection?.activities?.[0]?.items||[];
  if(isStyles){
   try{items=material.sort.fromRecipe(recipe).items;}catch{return [];}
  }
  if(!Array.isArray(items))return [];
  const choiceLabel=item=>item.group||(item.answerMedia?.type==='audio'?item.prompt:item.answer);
  const labels=[...new Set(items.map(choiceLabel).filter(Boolean))];
  return items.flatMap(item=>{
   const audio=item.media?.type==='audio'?item.media:item.answerMedia;
   const answer=choiceLabel(item);
   if(audio?.type!=='audio'||!answer||labels.length<2)return [];
   if(!safeRecording(audio.src)){
    try{if(!material.core?.safeMedia(audio))return [];}catch{return [];}
   }
   return [question(isStyles?'Which musical style do you hear?':'Which category or concept matches the excerpt?',answer,
    [answer,...labels.filter(label=>label!==answer).slice(0,5)],{kind:'file',src:audio.src})];
  });
 }

 function population(options,material,random){
  switch(options.format){
   case 'rhythm':return rhythms(options);
   case 'follow':return fourBarScores(options);
   case 'repeats':return fourBarScores(options,true);
   case 'chords':return chords(options);
   case 'dynamics':
   case 'articulation':return expression(options);
   case 'practice':return [...melodies(options),...rhythms(options),...fourBarScores(options)];
   case 'recordings':return dictionaryQuestions(options,material);
   case 'collection':return collectionQuestions(options,material);
   default:return [];
  }
 }
 function distinct(items){
  const seen=new Set();
  return items.filter(item=>{
   const id=JSON.stringify([item.prompt,item.audio,item.systems]);
   if(seen.has(id))return false;
   seen.add(id);
   return true;
  });
 }
 function available(options,material){
  if(options.format==='melody')return 50;
  return distinct(population(options,material)).length;
 }
 function dictationQuestions(options,count,random){
  const {makeQuestion,barsSignature}=dictation.create(random);
  const deck=[],seen=new Set();
  for(let attempt=0;deck.length<count&&attempt<count*4;attempt++){
   const melody=makeQuestion(options.level);
   const signature=JSON.stringify([melody.key.id,melody.timeSignature.id,melody.targetBar,barsSignature(melody.bars)]);
   if(seen.has(signature))continue;
   seen.add(signature);
   const response=melody.questionType==='identifyMelody'?[melody.answerIndex]:melody.bars[melody.targetBar].notes.map(note=>note.step);
   deck.push({type:'melodic-dictation',response,score:{listening:true,audio:{kind:'native-melody'},melody}});
  }
  return deck;
 }
 function questions(options,count,material,random=Math.random){
  if(options.format==='melody')return dictationQuestions(options,count,random);
  return activities.shuffle(distinct(population(options,material,random)),random).slice(0,count).map(item=>{
   const choices=activities.shuffle(item.choices,random);
   return {type:'choice',pitch:choices.indexOf(item.answer),score:{
    ...item.score,prompt:item.prompt,notation:item.notation,systems:item.systems,
    choices:choices.map(text=>({text})),...(item.audio?{listening:true,audio:item.audio}:{}),
   }};
  });
 }
 function answers(question){return (question?.score?.choices||[]).map(({text},index)=>({...(question.score.listening?allAnswers:writtenChoiceIds)[index],label:text}));}
 function publicQuestion(question,{host=false,reveal=false}={}){
  if(!question?.score?.listening)return question;
  const {audio,...publicScore}=question.score;
  const score=host?{...publicScore,audio}:publicScore;
  if(question.type!=='melodic-dictation')return {...question,pitch:reveal?question.pitch:undefined,score};
  const {response,...publicFields}=question;
  if(host||reveal)return {...publicFields,score};
  const {answerIndex,options,bars,...melody}=score.melody;
  if(melody.questionType==='identifyMelody'){
   melody.bars=[];
   melody.options=options.map(({bars},index)=>({id:`option-${index}`,bars:bars.map(bar=>({
    ...bar,notes:bar.notes.map((note,n)=>({...note,id:`option-${index}-${bar.barIndex}-${n}`})),
   }))}));
  }else{
   melody.bars=bars.map(bar=>bar.barIndex===melody.targetBar?{
    ...bar,notes:bar.notes.map(({id,rhythm,beats,beat,rest,tieToNext,tiedFromPrevious})=>({id,rhythm,beats,beat,rest,tieToNext,tiedFromPrevious})),
   }:bar);
  }
  return {...publicFields,score:{...score,melody}};
 }
 function collectionHasAudio(payload){
  return payload?.sortRecipe?.type==='styles'||(Array.isArray(payload?.activities)&&payload.activities.some(activity=>
   Array.isArray(activity?.items)&&activity.items.some(item=>item?.media?.type==='audio'||item?.answerMedia?.type==='audio')));
 }
 function needsMaterial(options){return ['recordings','collection'].includes(options?.format);}
 const api={questions,answers,available,allAnswers,collectionHasAudio,needsMaterial,publicQuestion};
 if(server)module.exports=api;
 else root.MLH.classroomListening=api;
})(globalThis);
