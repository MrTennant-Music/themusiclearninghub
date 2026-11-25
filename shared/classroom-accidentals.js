(function(root){
 'use strict';
 const server=typeof module==='object'&&module.exports;
 const activities=server?require('./classroom-activities.js'):root.MLH.classroomActivities;
 const core=server?require('./accidentals-question-core.js'):root.MLH.AccidentalsQuestionCore;
 const selection=server?require('./accidentals-selection.js'):root.ACCIDENTALS_SELECTION;
 const generator=core.create();
 const allAnswers=Array.from({length:6},(_,pitch)=>({id:'accidental-choice:'+pitch,pitch}));

 function hostSettings(activity){
  const source=activities.settings(activity);
  if(!source)return null;
  const url=new URL(source.activity,'https://classroom.invalid');
  if(url.pathname!=='/accidentals.html'||url.searchParams.get('level')==='AH'||url.searchParams.get('section')==='enharmonics')return null;
  let profile={};
  try{
   const snapshot=url.searchParams.get('settings');
   if(snapshot){
    const data=JSON.parse(atob(snapshot.replaceAll('-','+').replaceAll('_','/')));
    if(data.version===2&&data.activity==='accidentals.html')profile=data.state||{};
   }
  }catch{}
  const {DEFAULT_ACCIDENTALS,DEFAULT_QUESTION_TYPES}=generator;
  const enabledTypes=selection.cleanList(profile.enabledQuestionTypes,DEFAULT_QUESTION_TYPES);
  const options={
   enabledAccidentals:selection.cleanList(profile.enabledAccidentals,DEFAULT_ACCIDENTALS),
   showNoteNames:profile.showNoteNames===true,
  };
  return {activity:source.activity,level:'N5',options,enabledTypes};
 }

 function settings(activity){
  const hosted=hostSettings(activity);
  if(!hosted||activities.usesOriginalFormat(activity))return null;
  const {enabledTypes,...settings}=hosted;
  if(!generator.DEFAULT_QUESTION_TYPES.every(type=>enabledTypes.includes(type))&&
     !(enabledTypes.length===1&&enabledTypes[0]==='multiple-choice'))return null;
  return settings;
 }

 function questions(options,count){
  const {makeMultipleChoice}=core.create();
  const seen=new Set(),deck=[];
  for(let attempt=0;deck.length<count&&attempt<count*4;attempt++){
   const {answerId,...score}=makeMultipleChoice(options.enabledAccidentals);
   const identity=JSON.stringify([score.prompt,score.key.id,score.timeSignature.id,score.bars]);
   if(seen.has(identity))continue;
   seen.add(identity);
   const pitch=score.choices.findIndex(choice=>choice.id===answerId);
   deck.push({type:'choice',pitch,score});
  }
  return deck;
 }

 // Placement scoring uses the existing atomic pitch comparison. Its values
 // are outside the six multiple-choice indices and only issued by the server
 // after checking a symbol and note position against the active question.
 const correctPlacementPitch=6;
 function placementId({symbolId,barIndex,noteIndex}){
  return `accidental-placement:${symbolId}:${barIndex}:${noteIndex}`;
 }
 function parsePlacement(id){
  const match=typeof id==='string'&&id.match(/^accidental-placement:(sharp|flat|natural):([0-9]):([0-9]{1,2})$/);
  if(!match)return null;
  const [,symbolId,bar,note]=match;
  return {symbolId,barIndex:Number(bar),noteIndex:Number(note),anchor:'before-note',localId:id};
 }
 function placementAnswer(question,id){
  if(question?.type!=='accidental-placement')return null;
  const placement=parsePlacement(id);
  const {symbols,bars,placementTarget,required}=question.score;
  if(!placement||placementId(placement)!==id||!symbols.includes(placement.symbolId)||
     placement.barIndex!==placementTarget.barIndex||!bars[placement.barIndex]?.notes[placement.noteIndex]||
     (placementTarget.noteIndex!==undefined&&placement.noteIndex!==placementTarget.noteIndex))return null;
  return {id,pitch:id===placementId(required[0])?correctPlacementPitch:correctPlacementPitch+1};
 }
 function allowedPlacementIds(question){
  if(question.type!=='accidental-placement')return [];
  const {symbols,bars,placementTarget:{barIndex,noteIndex}}=question.score;
  const indices=noteIndex===undefined?bars[barIndex].notes.map((_,index)=>index):[noteIndex];
  return indices.flatMap(index=>symbols.map(symbolId=>placementId({symbolId,barIndex,noteIndex:index})));
 }

 function quizQuestions(setup,count,random=Math.random){
  const quizCore=core.create(random);
  let types=quizCore.DEFAULT_QUESTION_TYPES.filter(type=>setup.enabledTypes.includes(type));
  const {enabledAccidentals}=setup.options;
  const deck=[],seen=new Set();
  while(deck.length<count&&types.length){
   for(const questionType of activities.shuffle(types,random)){
    if(deck.length===count)break;
    let original;
    for(let attempt=0;attempt<160;attempt++){
     const candidate=quizCore.makeQuestion({enabledQuestionTypes:[questionType],enabledAccidentals});
     const identity=JSON.stringify([candidate.questionType,candidate.prompt,candidate.key.id,candidate.timeSignature.id,candidate.bars]);
     if(seen.has(identity))continue;
     seen.add(identity);
     original=candidate;
     break;
    }
    if(!original){
     types=types.filter(type=>type!==questionType);
     continue;
    }
    const {answerId,required,choices,...score}=original;
    if(questionType.startsWith('audio-')){
     score.audio=quizCore.questionAudio(original);
     score.listening=true;
     score.bars=score.bars.map(bar=>({...bar,notes:bar.notes.map(({hiddenAccidental,...note})=>note)}));
    }
    if(questionType!=='multiple-choice'){
     const {barIndex,noteIndex}=required[0];
     const placementTarget=questionType==='audio-two'?{barIndex,noteIndex}:{barIndex};
     deck.push({type:'accidental-placement',pitch:correctPlacementPitch,score:{...score,required,placementTarget,symbols:enabledAccidentals}});
    }else{
     score.choices=choices;
     deck.push({type:'choice',pitch:score.choices.findIndex(choice=>choice.id===answerId),score});
    }
   }
  }
  return deck;
 }

 function publicQuestion(question,{host=false,reveal=false}={}){
  if(question?.type!=='accidental-placement')return question;
  const {required,audio,...score}=question.score;
  return {type:question.type,score:{...score,...(reveal?{required}:{}),...(audio&&host?{audio}:{})}};
 }

 function answers(question){
  return (question?.score?.choices??[]).map(({text},index)=>({...allAnswers[index],label:text}));
 }

 const api={settings,hostSettings,questions,quizQuestions,available:()=>50,answers,allAnswers,placementId,parsePlacement,placementAnswer,allowedPlacementIds,publicQuestion};
 if(server)module.exports=api;
 else root.MLH.classroomAccidentals=api;
})(globalThis);
