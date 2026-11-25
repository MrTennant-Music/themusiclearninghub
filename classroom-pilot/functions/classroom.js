'use strict';
const crypto=require('node:crypto');
const {inflateSync}=require('node:zlib');
const K=require('../../keyboard-notes.js');
const shared=require('../../shared/classroom-activities.js');
const written=require('../../shared/classroom-written-notes.js');
const accidentals=require('../../shared/classroom-accidentals.js');
const literacy=require('../../shared/classroom-literacy.js');
const listening=require('../../shared/classroom-listening.js');
const conceptQuiz=require('../../shared/classroom-concept-quiz.js');
const dominoes=require('../../music-games/dominoes.js');
const recallCore=require('../../concept-recall-core.js');
const recallData=require('../../concept-recall-data.js');
const validAnswers=[
 ...written.allAnswers,
 ...accidentals.allAnswers,
 ...literacy.allAnswers,
 ...listening.allAnswers,
 ...K.classroomAnswers(K.defaults.H,true),
 ...K.answers({naturals:true,sharps:true,flats:true,enharmonics:true}),
];
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const reply=(statusCode,value)=>({statusCode,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(value)});
async function roomRequest(action,pin,token,data){
 const response=await fetch(process.env.SUPABASE_URL+'/rest/v1/rpc/keyboard_pilot',{method:'POST',
  headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'},
  body:JSON.stringify({p_action:action,p_pin:pin,p_token:hash(token),p_data:data}),signal:AbortSignal.timeout(8000)});
 return {response,result:await response.json()};
}
function sharedCollection(activity){
 const url=new URL(activity,'https://classroom.invalid');
 if(!['/conceptsort.html','/connections.html','/crosswords.html','/wordsearch.html'].includes(url.pathname))return null;
 const encoded=url.hash.match(/^#playnote=([\w-]+)$/)?.[1];
 return encoded?JSON.parse(inflateSync(Buffer.from(encoded,'base64url'),{maxOutputLength:4*1024*1024}).toString('utf8')):null;
}
exports.handler=async event=>{
 if(event.httpMethod!=='POST')return reply(405,{error:'Use POST.'});
 if(process.env.CLASSROOM_ENABLED!=='true')return reply(503,{error:'Classroom pilot is switched off. Individual practice is still available.'});
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return reply(503,{error:'Classroom pilot has not been configured.'});
 if(event.body?.length>4096)return reply(413,{error:'Request too large.'});
 try{
  const input=JSON.parse(event.body||'{}'),action=input.action;
  if(!['check','create','join','read','start','audio-ended','skip-excerpt','answer','reveal','next','end','remove','finish','grid-finish','nicknames','rename'].includes(action))return reply(400,{error:'Unknown action.'});
  let pin=String(input.pin||''),token=String(input.token||''),data={};
  if(action!=='check'&&action!=='create'&&!/^\d{6}$/.test(pin))return reply(400,{error:'Enter a six-digit game PIN.'});
  if(action==='create'&&shared.hostingDisabled(input.activity))return reply(400,{error:'This activity is available in Individual Practice.'});
  const nativeActivity=action==='create'&&shared.settings(input.activity);
  if(action==='create'&&Object.hasOwn(input,'retryRaceMinutes')&&
    (input.gameType!=='activity-race'||!shared.isRetryRaceActivity(input.activity)||!shared.validTimeTrialMinutes(input.retryRaceMinutes)))
   return reply(400,{error:'Choose a time limit of 1–10 minutes for the activity Race.'});
  const nativeStreak=action==='create'&&input.nativeStreak===true;
  const literacyQuiz=action==='create'&&input.literacyQuiz===true;
  if(nativeStreak&&(input.gameType!=='race'||shared.literacyHostMode(input.activity)!=='race'||
    !shared.validStreakSetup(input.targetStreak,input.raceMinutes)))return reply(400,{error:'Choose valid streak Race settings for this activity.'});
  const noteQuiz=action==='create'&&input.gameType==='quiz'&&written.hostSettings(input.activity);
  if(literacyQuiz&&(input.gameType!=='quiz'||!shared.allowsLiteracyQuiz(input.activity,Boolean(noteQuiz||literacy.settings(input.activity)))))return reply(400,{error:'Quiz is unavailable for these activity settings.'});
  const scoreRace=input.gameType==='race'&&Object.hasOwn(input,'targetStreak');
  const accidentalSetup=nativeActivity&&(scoreRace||input.gameType==='quiz')&&accidentals.hostSettings(input.activity);
  const legacyRaceAdapter=nativeActivity&&scoreRace&&(accidentalSetup||[accidentals,literacy].find(adapter=>adapter.settings(input.activity)));
  const nativeRace=nativeActivity&&(nativeStreak||input.gameType==='activity-race'||input.gameType==='race'&&!legacyRaceAdapter);
  const conceptOptions=nativeActivity&&conceptQuiz.settings(nativeActivity.activity);
  if(conceptOptions&&input.gameType&&input.gameType!=='quiz')return reply(400,{error:'Concept Quizzes use Quiz mode.'});
  let listeningOptions=nativeActivity&&!nativeRace&&!(accidentalSetup&&scoreRace)&&shared.listeningSettings(nativeActivity.activity);
  let collection=null,nativePractice=false;
  if(nativeActivity){
   try{collection=sharedCollection(nativeActivity.activity);}catch{return reply(400,{error:'This shared activity could not be opened. Host it again from the activity page.'});}
   const audioCollection=listening.collectionHasAudio(collection);
   if((nativeRace||scoreRace)&&(!nativeStreak&&shared.raceRequiresQuiz(nativeActivity.activity)||audioCollection))return reply(400,{error:shared.raceListeningMessage});
   nativePractice=!literacyQuiz&&!nativeStreak&&shared.hostsNativePractice(nativeActivity.activity,audioCollection);
   if(nativePractice)listeningOptions=null;
   else if(!nativeRace&&!listeningOptions&&audioCollection)listeningOptions=shared.collectionSettings(nativeActivity.activity);
  }
  if(listeningOptions&&input.gameType&&input.gameType!=='quiz')return reply(400,{error:'Listening activities use Quiz mode. Open Host again to start a Quiz.'});
  const choiceActivity=action==='create'&&!nativeRace&&!listeningOptions?
   (accidentalSetup?accidentals:[accidentals,literacy].find(adapter=>adapter.settings(input.activity))):null;
  const material=conceptOptions?await conceptQuiz.loadMaterial():
   listeningOptions?.format==='recordings'?{recordings:require('../../music-dictionary/quiz-data/audio-question-bank.json').questions}
   :listeningOptions?.format==='collection'?{collection,core:require('../../music-games/core.js'),sort:collection?.sortRecipe?.type==='styles'?require('../../shared/music-games-sort.js'):null}:null;
  if(nativeStreak){
   pin=String(crypto.randomInt(100000,1000000));token=crypto.randomBytes(32).toString('hex');
   data={...nativeActivity,gameType:'activity-race',nativeStreak:true,targetStreak:input.targetStreak,raceMinutes:input.raceMinutes,
    phase:'lobby',seed:crypto.randomBytes(4).readUInt32BE(),useRandomNames:true};
  }else if(nativePractice){
   if(input.gameType&&input.gameType!=='shared'&&input.gameType!=='quiz')return reply(400,{error:'Host this activity in Individual Practice mode.'});
   pin=String(crypto.randomInt(100000,1000000));token=crypto.randomBytes(32).toString('hex');
   data={...nativeActivity,gameType:'shared',nativePractice:true,phase:'lobby',seed:crypto.randomBytes(4).readUInt32BE(),useRandomNames:true};
  }else if(action==='create'&&(input.gameType==='rhythm-time-trial'||input.gameType!=='quiz'&&shared.isRhythmTimeTrialActivity(nativeActivity?.activity))){
   if(!shared.isRhythmTimeTrialActivity(nativeActivity?.activity)||input.gameType!=='rhythm-time-trial')return reply(400,{error:'Rhythm Identification uses Time Trial mode.'});
   if(!shared.validTimeTrialMinutes(input.raceMinutes))return reply(400,{error:'Choose a time limit of 1–10 minutes.'});
   pin=String(crypto.randomInt(100000,1000000));token=crypto.randomBytes(32).toString('hex');
   data={...nativeActivity,gameType:'rhythm-time-trial',raceMinutes:input.raceMinutes,phase:'lobby',seed:crypto.randomBytes(4).readUInt32BE(),useRandomNames:true};
  }else if(nativeRace){
   const activityUrl=new URL(nativeActivity.activity,'https://classroom.invalid');
   const path=activityUrl.pathname;
   let retryTotal=path==='/conceptsort.html'&&!collection?.sortRecipe?collection?.activities?.[0]?.items?.length:null;
   if(path==='/dominoes.html'){
    try{retryTotal=dominoes.hostedSet(nativeActivity.activity).length;}catch(error){return reply(400,{error:error.message});}
   }
   pin=String(crypto.randomInt(100000,1000000));token=crypto.randomBytes(32).toString('hex');
   data={...nativeActivity,gameType:'activity-race',targetCorrect:shared.raceTargetFor(path),phase:'lobby',seed:crypto.randomBytes(4).readUInt32BE(),useRandomNames:true};
   if(shared.isRetryRaceActivity(path)&&input.retryRaceMinutes!=null){
    data.retryRaceMinutes=input.retryRaceMinutes;
    if(retryTotal>0)data.retryRaceTotal=retryTotal;
   }
   if(shared.isMillionaireActivity(path)&&input.randomiseQuestions===true)data.randomiseQuestions=true;
   if(path==='/conceptrecall.html'&&input.gameType==='activity-race'){
    const minutes=input.recallMinutes??0;
    if(!Number.isInteger(minutes)||minutes<0||minutes>10)return reply(400,{error:'Choose Unlimited or a time limit of 1–10 minutes.'});
    data.recallMinutes=minutes;
    data.targetCorrect=recallCore.classroomSetup(recallData.QUESTIONS,activityUrl.search).total;
   }
  }else if(nativeActivity?.gameType==='dominoes'){
   if(input.gameType!=='dominoes')return reply(400,{error:'Choose the Dominoes classroom activity.'});
   let concepts;
   try{concepts=dominoes.hostedSet(nativeActivity.activity);}catch(error){return reply(400,{error:error.message});}
   pin=String(crypto.randomInt(100000,1000000));token=crypto.randomBytes(32).toString('hex');
   data={...nativeActivity,activity:nativeActivity.activity.split('?')[0],phase:'lobby',useRandomNames:true,
    concepts:concepts.map(({id,name,definition})=>({id,name,definition}))};
  }else if(action==='create'){
   const writtenActivity=input.activity==='written-notes'||noteQuiz?.kind==='written-notes';
   if(input.activity&&!writtenActivity&&!noteQuiz&&!choiceActivity&&!listeningOptions&&!conceptOptions)return reply(400,{error:nativeActivity?'Choose Race for this activity.':'Choose an activity that supports classroom play.'});
   const scoped=conceptOptions||listeningOptions;
   const settings=accidentalSetup||(scoped?{level:scoped.level,activity:scoped.activity,options:{}}:
    choiceActivity?.settings(input.activity)||noteQuiz||(writtenActivity?written.settings(input):K.classroomSettings({level:input.level,options:input.options||K.defaults[input.level],showC:input.showC,questionTypes:input.questionTypes})));
   if(!settings)return reply(400,{error:'Return to individual practice and choose valid game settings.'});
   const {level,options=settings.settings,showC}=settings;
   const gameType=input.gameType??'quiz',targetStreak=Number(input.targetStreak??30),raceMinutes=Number(input.raceMinutes??0);
   if(!['quiz','race'].includes(gameType))return reply(400,{error:'Choose Quiz or Race.'});
   if(gameType==='race'&&(!Number.isInteger(targetStreak)||targetStreak<1||targetStreak>100))return reply(400,{error:'Choose a streak target from 1 to 100.'});
   if(gameType==='race'&&(!Number.isInteger(raceMinutes)||raceMinutes<0||raceMinutes>10))return reply(400,{error:'Choose Unlimited or 1–10 minutes.'});
   const types=K.normaliseTypes(settings.questionTypes,level);
   const keyboardPool=!choiceActivity&&!writtenActivity&&!scoped?K.classroomQuestionPool(options,types,level):null;
   const accidentalQuiz=accidentalSetup&&gameType==='quiz'?accidentals.quizQuestions(accidentalSetup,50):null;
   const available=accidentalQuiz?accidentalQuiz.length:conceptOptions?conceptQuiz.available(conceptOptions,material):listeningOptions?listening.available(listeningOptions,material):choiceActivity?choiceActivity.available(options):writtenActivity?written.available(options):keyboardPool.length;
   const counts=shared.quizQuestionCounts(available,scoped&&listeningOptions?.format!=='chords'?1:5);
   const count=gameType==='race'?Math.min(50,available):Number(input.count??Math.min(20,counts.at(-1)));
   if(gameType==='quiz'&&!counts.length)return reply(400,{error:'This activity has no eligible questions for a Quiz.'});
   if(gameType==='quiz'&&!counts.includes(count))return reply(400,{error:`Choose an available question count: ${counts.join(', ')}.`});
   const questionTime=Number(input.questionTime??20);
   if(![5,10,15,20,30,45,60,90,120].includes(questionTime))return reply(400,{error:'Choose an available time per question.'});
   const questions=accidentalQuiz?accidentalQuiz.slice(0,count):conceptOptions?conceptQuiz.questions(conceptOptions,count,material):listeningOptions?listening.questions(listeningOptions,count,material):choiceActivity?choiceActivity.questions(options,count):writtenActivity?written.questions(options,count):shared.shuffle(keyboardPool).slice(0,count);
   if(questions.length!==count)return reply(400,{error:'There are not enough unique questions for that round.'});
   const allowedAnswers=conceptOptions?[]:listeningOptions?(listeningOptions.format==='chords'?[...listening.allAnswers,...literacy.allAnswers]:listening.allAnswers):choiceActivity?choiceActivity.allAnswers:writtenActivity?written.answers(options):[...(types.name?K.classroomAnswers(options,false):[]),...(types.find?K.classroomAnswers(options,true):[])];
   pin=String(crypto.randomInt(100000,1000000));token=crypto.randomBytes(32).toString('hex');
   const answerIds=new Set(allowedAnswers.map(a=>a.id));
   if(accidentalQuiz)for(const question of questions)for(const id of accidentals.allowedPlacementIds(question))answerIds.add(id);
   data={gameType,targetStreak,raceMinutes,phase:'lobby',level,options,showC,activity:settings.activity,questionTime,useRandomNames:true,scoringVersion:2,sharedSequence:gameType==='race',questions,allowedAnswers:[...answerIds],index:0};
  }else if(action!=='check'){
   if(!/^[a-f0-9]{64}$/.test(token))return reply(400,{error:'Please rejoin this game.'});
   if(action==='audio-ended'||action==='skip-excerpt'){
    if(!Number.isInteger(input.index)||input.index<0||input.index>=50)return reply(400,{error:'This question is no longer active.'});
    data={index:input.index};
   }
   if(action==='read'&&Object.hasOwn(input,'excerptPlayback')){
    const playback=input.excerptPlayback;
    if(playback===null)data={excerptPlayback:null};
    else if(Number.isInteger(playback?.index)&&playback.index>=0&&playback.index<50&&
      ['listening','question','review'].includes(playback.phase)){
     data={excerptPlayback:{index:playback.index,phase:playback.phase}};
    }
   }
   if(action==='join'){const name=String(input.name||'').trim();if(name.length>24)return reply(400,{error:'Use a nickname of 1–24 characters.'});data={name};}
   if(action==='nicknames'){
    if(typeof input.allowNicknames!=='boolean')return reply(400,{error:'Choose whether to allow nicknames.'});
    data={allowNicknames:input.allowNicknames};
   }
   if(action==='rename'){
    const name=typeof input.name==='string'?input.name:'';
    if(!name||name.length>20||/[\s\u0000-\u001f\u007f]/.test(name))return reply(400,{error:'Use a nickname of 1–20 characters with no spaces.'});
    data={name};
   }
   if(action==='remove'){
    if(!/^[a-f0-9]{64}$/.test(String(input.playerId||'')))return reply(400,{error:'Choose a participant to remove.'});
    data={playerId:input.playerId};
   }
   if(action==='finish'){
    if(Object.hasOwn(input,'retryAttempt')){
     if(!shared.validRetryRaceAttempt(input.retryAttempt))return reply(400,{error:'Invalid race attempt.'});
     const {id,correct,total,elapsedMs}=input.retryAttempt;
     data.retryAttempt={id,correct,total,elapsedMs};
    }
    if(Object.hasOwn(input,'attempted')){
     if(!shared.validStreakProgress(input.attempted,input.streak,input.highestStreak))return reply(400,{error:'Invalid streak progress.'});
     Object.assign(data,{attempted:input.attempted,streak:input.streak,highestStreak:input.highestStreak});
    }
    if(typeof input.solved==='boolean')data.solved=input.solved;
    if(Number.isInteger(input.correct)&&input.correct>=0&&input.correct<=1000)data.correct=input.correct;
    if(Object.hasOwn(input,'millionaireAttempt')){
     if(!Number.isInteger(input.millionaireAttempt)||input.millionaireAttempt<1||input.millionaireAttempt>999999999||
        data.correct===undefined||data.correct>15)
      return reply(400,{error:'Invalid Millionaire progress.'});
     data.millionaireAttempt=input.millionaireAttempt;
    }
    if(Object.hasOwn(input,'wordCount')){
     if(!Number.isInteger(input.wordCount)||input.wordCount<1||input.wordCount>15||data.correct===undefined||data.correct>input.wordCount)
      return reply(400,{error:'Invalid word puzzle progress.'});
     data.wordCount=input.wordCount;
    }
   }
   if(action==='grid-finish'){
    if(!Number.isInteger(input.elapsedMs)||input.elapsedMs<1||input.elapsedMs>600000)return reply(400,{error:'Invalid grid time.'});
    data={elapsedMs:input.elapsedMs};
   }
   if(action==='answer'&&Object.hasOwn(input,'placement')){
    if(!Number.isInteger(input.index)||!accidentals.parsePlacement(input.placement))return reply(400,{error:'Place an accidental on the score.'});
    const current=await roomRequest('read',pin,token,{});
    if(!current.response.ok)return reply(400,{error:current.result.message||'Could not read the current question.'});
    const {question,host,phase,index}=current.result;
    if(host||phase!=='question')return reply(400,{error:'Answers are closed.'});
    if(question?.type!=='accidental-placement'||index!==input.index)return reply(400,{error:'Question has changed.'});
    const placement=accidentals.placementAnswer(question,input.placement);
    if(!placement)return reply(400,{error:'Place an accidental on the score.'});
    data={index,answer:placement.id,pitch:placement.pitch};
   }else if(action==='answer'&&Object.hasOwn(input,'response')){
    if(!Number.isInteger(input.index)||!conceptQuiz.validResponse(input.response))return reply(400,{error:'Enter an answer for this question.'});
    const current=await roomRequest('read',pin,token,{});
    if(!current.response.ok)return reply(400,{error:current.result.message||'Could not read the current question.'});
    const {question,host,phase,index}=current.result;
    if(host||phase!=='question')return reply(400,{error:'Answers are closed.'});
    if(question?.type!=='concept-quiz'||index!==input.index)return reply(400,{error:'Question has changed.'});
    const quiz=question.score.quiz;
    if(!conceptQuiz.canSubmit(quiz,input.response))return reply(400,{error:'Complete the answer for this question.'});
    data={index,questionId:quiz.id,response:input.response,fraction:conceptQuiz.fraction(quiz,input.response)};
   }else if(action==='answer'&&Object.hasOwn(input,'notes')){
    if(!Array.isArray(input.notes)||input.notes.length<1||input.notes.length>24||
       !input.notes.every(step=>Number.isInteger(step)&&step>=-40&&step<=40)||
       !Number.isInteger(input.index))return reply(400,{error:'Enter the notes for this exercise.'});
    data={notes:input.notes,index:input.index};
   }else if(action==='answer'){
    // Validate the submitted note; grading happens inside the atomic database transaction.
    const answer=validAnswers.find(a=>a.id===input.answer);
    if(!answer||!Number.isInteger(input.index))return reply(400,{error:'Choose a valid note.'});
    data={answer:answer.id,pitch:answer.pitch,index:input.index};
   }
  }
  if(nativeActivity&&typeof input.worksheetAvailable==='boolean')data.worksheetAvailable=input.worksheetAvailable;
  const hasAudio=action==='create'&&data.questions?.some(question=>question.score?.audio);
  const rpcAction=conceptOptions?'create-concept-quiz':hasAudio?(listeningOptions?.format==='melody'?'create-melodic-quiz':'create-listening'):action;
  const {response,result}=await roomRequest(rpcAction,pin,token,data);
  if(!response.ok&&data.gameType==='dominoes'&&result.message==='Invalid game type.')return reply(503,{error:'This classroom server needs the Dominoes update.'});
  if(!response.ok&&data.gameType==='activity-race'&&result.message==='Invalid game type.')return reply(503,{error:'This classroom server needs the activity Race update.'});
  if(!response.ok&&data.gameType==='rhythm-time-trial'&&result.message==='Invalid game type.')return reply(503,{error:'This classroom server needs the Rhythm Identification Time Trial update.'});
  if(!response.ok&&['create-listening','create-melodic-quiz'].includes(rpcAction)&&result.message==='Game not found or expired.')return reply(503,{error:'This classroom server needs the latest listening Quiz update.'});
  if(!response.ok&&rpcAction==='create-concept-quiz'&&result.message==='Game not found or expired.')return reply(503,{error:'This classroom server needs the Concept Quizzes update.'});
  if(!response.ok)return reply(400,{error:result.code==='23505'?'Please try creating the game again.':result.code==='P0001'?result.message:'Classroom service unavailable. Use individual practice.'});
  if(result.question?.type==='accidental-placement'){
   if(result.phase==='review'){
    const correctId=accidentals.placementId(result.question.score.required[0]);
    const correct=result.breakdown?.find(row=>row.answer===correctId)?.count??0;
    const answered=result.players?.filter(player=>player.answered).length??0;
    result.breakdown=[{answer:'correct',count:correct},{answer:'incorrect',count:answered-correct}];
   }
   result.question=accidentals.publicQuestion(result.question,{host:result.host,reveal:result.phase==='review'});
  }else if(result.question?.type==='concept-quiz')result.question=conceptQuiz.publicQuestion(result.question,{host:result.host,reveal:result.phase==='review'});
  else if(result.question?.score?.listening)result.question=listening.publicQuestion(result.question,{host:result.host,reveal:result.phase==='review'});
  else if(result.question?.type==='choice'&&result.phase!=='review')delete result.question.pitch;
  if(result.host===false&&token&&result.gameType==='activity-race'&&result.randomiseQuestions===true&&
     Number.isInteger(result.seed)&&shared.isMillionaireActivity(result.activity)){
   result.seed=Number.parseInt(hash(`${result.seed}:${token}`).slice(0,8),16);
  }
  return reply(200,action==='create'?{...result,token}:result);
 }catch{return reply(503,{error:'Cannot connect to the classroom service. Use individual practice or retry.'});}
};
