(function(root){
 'use strict';

 function requestFromHost(action,extra){
  const host=root.opener;
  function hostIsInClassroom(){
   try{return Boolean(host&&!host.closed&&new URLSearchParams(host.location.search).get('mode')==='host');}
   catch{return false;}
  }
  if(!hostIsInClassroom())return Promise.resolve({closed:true});
  return new Promise((resolve,reject)=>{
   const id=root.crypto.randomUUID();
   const origin=root.location.origin;
   function cleanup(){
    clearTimeout(timeout);
    root.removeEventListener('message',receive);
   }
   function receive(event){
    if(event.origin!==origin||event.source!==host||event.data?.type!=='mlh:offline-pupil-response'||event.data.id!==id)return;
    cleanup();
    if(event.data.error)reject(Error(event.data.error));
    else resolve(event.data.result);
   }
   const timeout=setTimeout(()=>{
    cleanup();
    if(hostIsInClassroom())reject(Error('The offline test host is unavailable.'));
    else resolve({closed:true});
   },2000);
   root.addEventListener('message',receive);
   host.postMessage({type:'mlh:offline-pupil-request',id,action,extra,preview:new URLSearchParams(root.location.search).get('preview')},origin);
  });
 }

 function create(settings,participants,previewOpen=()=>false,material,snapshot){
  const engine=createGame(settings,participants,previewOpen,material,snapshot);
  return {
   request:engine.request,
   snapshot:engine.snapshot,
   pupil(action,extra){
    const {testCards,...state}=engine.request(action,extra,true);
    const index=state.players.findIndex(player=>player.id==='test-0');
    if(index===-1)return {closed:true,removed:true};
    const pupil=state.players[index];
    const adapter=state.question?.type==='concept-quiz'?root.MLH.classroomConceptQuiz:
     state.question?.type==='accidental-placement'?root.MLH.classroomAccidentals:root.MLH?.classroomListening;
    const question=adapter?.publicQuestion(state.question,{reveal:state.phase==='review'})??state.question;
    const myScore=state.phase==='review'||state.phase==='finished'||!pupil.answered
     ?pupil.score:pupil.previousScore??0;
    return {...state,question,host:false,myName:pupil.name,mySymbol:pupil.symbol,myCard:testCards?.[index],
     ...(state.gameType==='quiz'?{myScore}:{}),
     myFinished:Boolean(pupil.finished),submitted:pupil.answered,myAnswer:pupil.answer,
     lastCorrect:pupil.lastCorrect,correct:state.phase==='review'?pupil.correct:undefined,players:state.players.map(({answer,correct,...player})=>player)};
   },
  };
 }

 function createGame(settings,participants,previewOpen,material,snapshot){
  const {activity,gameType:mode,options=settings.settings,showC,count,targetStreak}=settings;
  const activities=root.MLH?.classroomActivities;
  if(!snapshot&&activities?.hostingDisabled(activity))throw Error('This activity is available in Individual Practice.');
  if(mode==='rhythm-time-trial'&&(!activities.isRhythmTimeTrialActivity(activity)||!activities.validTimeTrialMinutes(settings.raceMinutes)))throw Error('Choose a time limit of 1–10 minutes for Rhythm Identification.');
  const scoreRace=mode==='race'&&Object.hasOwn(settings,'targetStreak');
  const adapters=[root.MLH?.classroomAccidentals,root.MLH?.classroomLiteracy];
  const accidentalSetup=(scoreRace||mode==='quiz')&&adapters[0]?.hostSettings?.(activity);
  const legacyRaceAdapter=scoreRace&&(accidentalSetup||adapters.find(adapter=>adapter?.settings(activity)));
  const nativeStreak=settings.nativeStreak===true;
  const literacyQuiz=settings.literacyQuiz===true;
  const noteQuiz=mode==='quiz'&&root.MLH?.classroomWrittenNotes?.hostSettings?.(activity);
  if(nativeStreak&&(mode!=='race'||activities.literacyHostMode(activity)!=='race'||!activities.validStreakSetup(targetStreak,settings.raceMinutes)))
   throw Error('Choose valid streak Race settings for this activity.');
  if(literacyQuiz&&(mode!=='quiz'||!activities.allowsLiteracyQuiz(activity,Boolean(noteQuiz||adapters[1]?.settings(activity)))))throw Error('Quiz is unavailable for these activity settings.');
  const activityRace=(mode==='activity-race'||mode==='race'&&(!legacyRaceAdapter||nativeStreak))&&Boolean(activities?.settings(activity));
  if(Object.hasOwn(settings,'retryRaceMinutes')&&
   (mode!=='activity-race'||!activities.isRetryRaceActivity(activity)||!activities.validTimeTrialMinutes(settings.retryRaceMinutes)))
   throw Error('Choose a time limit of 1–10 minutes for the activity Race.');
  const collectionAudio=root.MLH?.classroomListening?.collectionHasAudio(material?.collection);
  const collectionQuiz=collectionAudio||snapshot?.quizRuntime?.preparedQuestions?.[0]?.score?.listening;
  if((activityRace||scoreRace)&&!snapshot&&(!nativeStreak&&activities?.raceRequiresQuiz(activity)||collectionAudio))throw Error(activities.raceListeningMessage);
  const nativePractice=snapshot?snapshot.nativePractice===true:!literacyQuiz&&!nativeStreak&&activities?.hostsNativePractice(activity,collectionAudio);
  if(nativePractice&&mode!=='shared'&&mode!=='quiz')throw Error('Host this activity in Individual Practice mode.');
  const conceptOptions=!(activityRace&&snapshot?.gameType==='activity-race')&&root.MLH?.classroomConceptQuiz?.settings(activity);
  const listeningOptions=!nativePractice&&!activityRace&&!(accidentalSetup&&scoreRace)&&
   (activities?.listeningSettings?.(activity)||(collectionQuiz&&activities.collectionSettings(activity)));
  const choiceActivity=activityRace?null:listeningOptions?root.MLH.classroomListening:accidentalSetup?adapters[0]:adapters.find(adapter=>adapter?.settings(activity));
  if(activityRace&&new URL(activity,'https://classroom.invalid').pathname==='/dominoes.html')root.MLHDominoes.hostedSet(activity);
  if(conceptOptions&&mode!=='quiz')throw Error('Concept Quizzes use Quiz mode.');
  if(listeningOptions&&mode!=='quiz')throw Error('Listening activities use Quiz mode.');
  const gameType=nativePractice?'shared':activityRace?'activity-race':mode;
  const concepts=gameType==='dominoes'?root.MLHDominoes.hostedSet(activity):null;
  const capacity=concepts?concepts.length+1:20;
  const players=participants.slice(0,capacity).map(({name,symbol},index)=>({
   id:'test-'+index,name,symbol,score:0,streak:0,highestStreak:0,answered:false,attempt:0,
  }));
  const assignedNames=new Map(players.map(player=>[player.id,player.name]));
  const {quizRuntime,...savedGame}=snapshot??{};
  const game=savedGame.gameType===gameType&&savedGame.activity===activity?savedGame:
   {host:true,activity,gameType,options,showC,total:count,targetStreak,players,capacity,phase:'lobby',index:0,allowNicknames:false};
  if(nativePractice)game.nativePractice=true;
  if(nativeStreak){game.nativeStreak=true;game.raceMinutes=settings.raceMinutes;}
  if(typeof settings.worksheetAvailable==='boolean')game.worksheetAvailable=settings.worksheetAvailable;
  if(accidentalSetup)game.options=accidentalSetup.options;
  if(noteQuiz){game.options=noteQuiz.options;game.showC=noteQuiz.showC;}
  const accidentalQuiz=gameType==='quiz'?accidentalSetup:null;
  const engine=buildEngine(game,noteQuiz?{...settings,...noteQuiz}:settings,choiceActivity,activityRace,previewOpen,concepts,listeningOptions,material,conceptOptions,quizRuntime,accidentalQuiz);
  return {
   snapshot:()=>engine.snapshot?{...game,quizRuntime:engine.snapshot()}:game,
   request(action,extra={},pupil=false){
    if(action!=='nicknames'&&action!=='rename')return engine.request(action,extra,pupil);
    if(game.phase!=='lobby')throw Error('Nicknames can only be changed before the game starts.');
    if(action==='nicknames'){
     if(pupil)throw Error('Only the teacher can allow nicknames.');
     game.allowNicknames=extra.allowNicknames===true;
     if(!game.allowNicknames)for(const player of game.players){
      player.name=assignedNames.get(player.id)??player.name;
     }
    }else{
     const player=game.players.find(player=>player.id==='test-0');
     if(!pupil||!player||!game.allowNicknames)throw Error('Nicknames are currently locked.');
     const name=typeof extra.name==='string'?extra.name:'';
     if(!name||name.length>20||/[\s\u0000-\u001f\u007f]/.test(name))throw Error('Use a nickname of 1–20 characters with no spaces.');
     if(game.players.some(other=>other!==player&&(other.name.toLowerCase()===name.toLowerCase()||
       assignedNames.get(other.id)?.toLowerCase()===name.toLowerCase())))throw Error('That nickname is already taken.');
     player.name=name;
    }
    return engine.request('read',{},pupil);
   },
  };
 }

 function buildEngine(game,settings,choiceActivity,activityRace,previewOpen,concepts,listeningOptions,material,conceptOptions,quizRuntime,accidentalQuiz){
  const K=root.KeyboardNotes;
  const {activity,gameType,players,options,total:count,targetStreak}=game;
  const {level,questionTime=20,raceMinutes}=settings;
  const activities=root.MLH?.classroomActivities;
  const isPreview=player=>player.id==='test-0'&&previewOpen();
  if(gameType==='rhythm-time-trial'){
   game.seed??=root.crypto.getRandomValues(new Uint32Array(1))[0];
   return {
    request(action,extra={},pupil=false){
     const now=Date.now();
     if(action==='end'&&!pupil)return {closed:true};
     if(action==='remove'&&!pupil&&game.phase==='lobby')game.players=game.players.filter(player=>player.id!==extra.playerId);
     if(action==='start'&&!pupil&&game.phase==='lobby'&&game.players.length){
      game.startedAt=now;
      game.deadline=now+raceMinutes*60000;
      game.phase='playing';
     }
     if(game.phase==='playing'&&now>=game.deadline)game.phase='finished';
     const previewPlayer=game.players.find(isPreview);
     if(pupil&&previewPlayer&&action==='grid-finish'&&game.phase==='playing'){
      const {elapsedMs}=extra;
      if(!Number.isInteger(elapsedMs)||elapsedMs<1||elapsedMs>now-game.startedAt)throw Error('Invalid grid time.');
      previewPlayer.bestTimeMs=Math.min(previewPlayer.bestTimeMs??Infinity,elapsedMs);
     }
     const elapsed=game.startedAt===undefined?0:Math.min(now,game.deadline)-game.startedAt;
     const ranked=game.players.map((player,index)=>{
      if(isPreview(player))return {...player,bestTimeMs:player.bestTimeMs??null};
      const firstGrid=8000+index*1600;
      const bestTimeMs=elapsed<firstGrid?null:elapsed<firstGrid*2?firstGrid:firstGrid-1000;
      return {...player,bestTimeMs};
     }).sort((a,b)=>(a.bestTimeMs??Infinity)-(b.bestTimeMs??Infinity)||a.name.localeCompare(b.name));
     return {...game,serverTime:now,players:ranked};
    },
   };
  }
  if(gameType==='dominoes'){
   const dominoes=root.MLHDominoes;
   let lineup, dealt, startedAt, stoppedAt, bestElapsed;
   return {
    request(action,extra={}){
     if(action==='end')return {closed:true};
     if(action==='remove'&&game.phase==='lobby')game.players=game.players.filter(player=>player.id!==extra.playerId);
     const now=Date.now();
     if(action==='start'&&game.phase==='lobby'&&game.players.length>=2){
      lineup=concepts.slice(0,game.players.length-1);
     }else if(action==='next'&&game.phase==='finished'){
      const shuffled=dominoes.shuffle(lineup);
      lineup=shuffled.every((row,index)=>row.id===lineup[index].id)?[...shuffled.slice(1),shuffled[0]]:shuffled;
     }
     if(lineup&&((action==='start'&&game.phase==='lobby')||(action==='next'&&game.phase==='finished'))){
      dealt=dominoes.shuffle(dominoes.chain(lineup));
      startedAt=now;
      stoppedAt=null;
      game.phase='playing';
     }
     if(action==='reveal'&&game.phase==='playing'){
      stoppedAt=now;
      bestElapsed=Math.min(bestElapsed??Infinity,stoppedAt-startedAt);
      game.phase='finished';
     }
     return {...game,startedAt,stoppedAt,bestElapsed,serverTime:now,testCards:dealt};
    },
   };
  }
  if(gameType==='shared'||activityRace){
   game.seed??=root.crypto.getRandomValues(new Uint32Array(1))[0];
   const activityUrl=activityRace?new URL(activity,'https://classroom.invalid'):null;
   if(settings.gameType==='activity-race'&&activityUrl?.pathname==='/conceptrecall.html'){
    game.recallMinutes=settings.recallMinutes??0;
    if(!Number.isInteger(game.recallMinutes)||game.recallMinutes<0||game.recallMinutes>10)throw Error('Choose Unlimited or a time limit of 1–10 minutes.');
   }
   const recall=game.recallMinutes!=null;
   const wordPuzzle=['/wordsearch.html','/crosswords.html'].includes(activityUrl?.pathname);
   const millionaire=activityRace&&activities.isMillionaireActivity(activity);
   const escapeRoom=activityRace&&activities.isEscapeRoomActivity(activity);
   if(activityRace&&settings.retryRaceMinutes!=null){
    game.retryRaceMinutes=settings.retryRaceMinutes;
    game.retryRaceTotal??=activityUrl.pathname==='/dominoes.html'?root.MLHDominoes.hostedSet(activity).length:
     !material?.collection?.sortRecipe?material?.collection?.activities?.[0]?.items?.length:undefined;
   }
   const retryRace=game.retryRaceMinutes>0;
   if(millionaire&&settings.randomiseQuestions===true)game.randomiseQuestions=true;
   if(!game.nativeStreak)game.targetCorrect??=recall?root.CONCEPT_RECALL_CORE.classroomSetup(root.CONCEPT_RECALL_DATA.QUESTIONS,activityUrl.search).total:
    activityUrl?activities.raceTargetFor(activityUrl.pathname):null;
   return {
    request(action,extra={},pupil=false){
     if(action==='end')return {closed:true};
     if(action==='remove'&&game.phase==='lobby')game.players=game.players.filter(player=>player.id!==extra.playerId);
     const now=Date.now();
     if(action==='start'&&game.phase==='lobby'&&game.players.length){
      game.startedAt=now;
      game.phase='playing';
      const timeLimit=game.retryRaceMinutes??(game.nativeStreak?game.raceMinutes:game.recallMinutes);
      if(timeLimit>0)game.deadline=now+timeLimit*60000;
     }
     const timedOut=game.deadline!=null&&now>=game.deadline;
     const previewPlayer=game.players.find(isPreview);
     if(retryRace){
      if(action==='finish'&&pupil&&previewPlayer&&game.phase==='playing'&&!timedOut){
       const attempt=extra.retryAttempt;
       if(!activities.validRetryRaceAttempt(attempt)||attempt.elapsedMs>now-game.startedAt||
        attempt.total!==(game.retryRaceTotal??attempt.total))throw Error('Invalid race attempt.');
       if(attempt.id>(previewPlayer.retryAttempt?.id??0)){
        game.retryRaceTotal??=attempt.total;
        previewPlayer.retryAttempt=attempt;
        if(attempt.correct===attempt.total)previewPlayer.retryPerfectMs=Math.min(previewPlayer.retryPerfectMs??Infinity,attempt.elapsedMs);
       }
      }
      const elapsed=game.startedAt==null?0:Math.min(now,game.deadline)-game.startedAt;
      const total=game.retryRaceTotal??12;
      const competitors=game.players.map((player,index)=>{
       if(isPreview(player))return player;
       const firstTry=12000+index*2400;
       if(elapsed<firstTry)return player;
       const perfectAt=firstTry*2;
       const perfect=elapsed>=perfectAt&&index%3===1;
       const elapsedMs=perfect&&elapsed>=perfectAt+firstTry?firstTry-1500:firstTry;
       return {...player,retryAttempt:{correct:perfect?total:Math.max(0,total-1-index%Math.max(1,total)),total,elapsedMs},
        retryPerfectMs:perfect?elapsedMs:undefined};
      });
      if(timedOut&&game.phase==='playing'){
       const ranked=competitors.filter(player=>player.retryAttempt).sort(activities.compareRetryRacePlayers);
       game.winners=ranked.filter(player=>activities.compareRetryRacePlayers(player,ranked[0])===0).map(player=>player.name).sort();
       game.phase='finished';
       game.finishReason='time';
       game.finishedAt=game.deadline;
      }
      return {...game,serverTime:now,players:competitors};
     }
     if(pupil&&previewPlayer&&!previewPlayer.finished&&action==='finish'&&game.phase==='playing'&&!timedOut){
      if(Object.hasOwn(extra,'wordCount')){
       const {wordCount,correct}=extra;
       if(!wordPuzzle||!Number.isInteger(wordCount)||wordCount<1||wordCount>15||
        !Number.isInteger(correct)||correct<0||correct>wordCount||(game.targetCorrect??wordCount)!==wordCount)
        throw Error('Invalid word puzzle progress.');
       game.targetCorrect=wordCount;
      }
      if(game.nativeStreak){
       const {attempted,streak,highestStreak}=extra;
       if(activities.validStreakProgress(attempted,streak,highestStreak)){
        const previousAttempt=previewPlayer.attempt||0;
        if(attempted>previousAttempt||attempted===previousAttempt&&streak<previewPlayer.streak){
         if(streak<previewPlayer.streak)Object.assign(previewPlayer,{resetVersion:(previewPlayer.resetVersion||0)+1,resetFrom:previewPlayer.streak});
         Object.assign(previewPlayer,{attempt:attempted,streak,highestStreak:Math.max(previewPlayer.highestStreak,highestStreak),finished:highestStreak>=game.targetStreak});
        }
       }
      }else if(millionaire){
       if(Object.hasOwn(extra,'millionaireAttempt')){
        const {millionaireAttempt,correct}=extra;
        if(!Number.isInteger(millionaireAttempt)||millionaireAttempt<1||millionaireAttempt>999999999||
         !Number.isInteger(correct)||correct<0||correct>15)throw Error('Invalid Millionaire progress.');
        if(millionaireAttempt>=(previewPlayer.millionaireAttempt??0)){
         previewPlayer.correctCount=millionaireAttempt===previewPlayer.millionaireAttempt
          ? Math.max(previewPlayer.correctCount??0,correct):correct;
         previewPlayer.millionaireAttempt=millionaireAttempt;
         previewPlayer.finished=previewPlayer.correctCount===15;
        }
       }
      }else if(game.targetCorrect){
       const correct=Number.isInteger(extra.correct)?extra.correct:0;
       previewPlayer.correctCount=Math.max(previewPlayer.correctCount??0,Math.min(game.targetCorrect,correct));
       previewPlayer.finished=previewPlayer.correctCount===game.targetCorrect||(escapeRoom&&extra.solved===false);
      }else if(!activityRace||typeof extra.solved==='boolean'){
       previewPlayer.finished=true;
       previewPlayer.solved=extra.solved===true;
      }
     }
     const targetCorrect=game.targetCorrect;
     const elapsed=game.startedAt===undefined?0:(game.finishedAt??Math.min(now,game.deadline??now))-game.startedAt;
     const competitors=game.players.map((player,index)=>{
      if(game.nativeStreak){
       if(isPreview(player))return {...player,solved:player.finished===true};
       const interval=(activities.isRhythmTimeTrialActivity(activity)?45000:7800)+index*1550;
       const streak=Math.min(game.targetStreak,Math.floor(elapsed/interval));
       return {...player,streak,highestStreak:streak,finished:streak===game.targetStreak,solved:streak===game.targetStreak};
      }
      if(isPreview(player))return {...player,solved:targetCorrect?(player.correctCount??0)>=targetCorrect:player.solved===true};
      const progressInterval=escapeRoom?180000+index*15000:7800+index*1550;
      const correctCount=targetCorrect?Math.min(targetCorrect,Math.floor(elapsed/progressInterval)):0;
      const finished=targetCorrect?correctCount>=targetCorrect:elapsed>=(activityRace?120000+index*20000:(index+1)*15000);
      return {...player,correctCount,finished,solved:finished};
     });
     if(activityRace&&game.phase==='playing'){
      const winner=competitors.find(player=>player.solved);
      if(timedOut){
       const score=game.nativeStreak?'highestStreak':'correctCount';
       const highest=Math.max(0,...competitors.map(player=>player[score]||0));
       game.winners=competitors.filter(player=>highest>0&&player[score]===highest).map(player=>player.name).sort();
       game.phase='finished';
       game.finishReason='time';
       game.finishedAt=game.deadline;
      }else if(winner||competitors.every(player=>player.finished)){
       game.phase='finished';
       if(winner)game.winner=winner.name;
       game.finishedAt=now;
      }
     }
     const seed=pupil&&game.randomiseQuestions===true?(game.seed+1)>>>0:game.seed;
     return {...game,seed,targetCorrect,serverTime:now,players:competitors};
    },
   };
  }
  const racing=gameType==='race';
  const written=(activity==='written-notes'||settings.kind==='written-notes')&&root.MLH.classroomWrittenNotes;
  if(choiceActivity&&!listeningOptions)game.options=choiceActivity.settings(activity)?.options??game.options;
  const types=K.normaliseTypes(settings.questionTypes,level),generator=K.create();
  const deckSize=racing?50:count;
  const conceptQuiz=conceptOptions&&root.MLH.classroomConceptQuiz;
  const preparedQuestions=quizRuntime?.preparedQuestions??(accidentalQuiz?choiceActivity.quizQuestions(accidentalQuiz,deckSize):conceptQuiz?conceptQuiz.questions(conceptOptions,deckSize,material):listeningOptions?choiceActivity.questions(listeningOptions,deckSize,material)
   :choiceActivity?choiceActivity.questions(game.options,deckSize)
   :written?written.questions(options,deckSize)
   :K.classroomQuestionPool&&activities?.shuffle?activities.shuffle(K.classroomQuestionPool(options,types,level)).slice(0,deckSize):null);
  const total=preparedQuestions?.length??count;
  if((accidentalQuiz||conceptQuiz||listeningOptions)&&total!==count)throw Error('There are not enough questions for that round.');
  if(!racing)game.total=total;
  let question=quizRuntime&&game.phase!=='lobby'?preparedQuestions[game.index]:undefined;
  const choiceAnswers=question=>question.score?.listening&&question.type==='choice'
   ?root.MLH.classroomListening.answers(question):choiceActivity.answers(question);
  let answers=written?written.answers(options):choiceActivity&&question?choiceAnswers(question):[];
  const previewAttempt=players.find(player=>player.id==='test-0')?.attempt??0;
  let previewQuestion=racing&&question?preparedQuestions[previewAttempt%preparedQuestions.length]:undefined;
  let deadline=quizRuntime?.deadline??null,startedAt=quizRuntime?.startedAt;
  let breakdown=quizRuntime?.breakdown??[];
  let excerptPlayback;

  function beginQuestion(now,delay=0){
   question=preparedQuestions?preparedQuestions[game.index]:generator.next(options,types,level);
   if(racing)previewQuestion=question;
   if(conceptQuiz)answers=[];
   else if(choiceActivity)answers=choiceAnswers(question);
   else if(!written)answers=K.classroomAnswers(options,question.type==='find');
   if(question.score?.audio){
    startedAt=null;
    deadline=null;
    game.phase='listening';
   }else{
    startedAt=now+delay;
    deadline=racing?(raceMinutes?startedAt+raceMinutes*60000:null):startedAt+questionTime*1000;
    game.phase=delay?'countdown':'question';
   }
   const scorePlacement=question.type==='accidental-placement';
   breakdown=(conceptQuiz?['correct','partial','incorrect']:scorePlacement||question.type==='melodic-dictation'?['correct','incorrect']:answers.map(a=>a.id)).map(answer=>({answer,count:0}));
   players.forEach(player=>{player.previousScore=player.score;player.answered=false;player.answer=null;player.correct=null;if(conceptQuiz)player.gained=0;});
  }

  function recordQuizAnswer(player,choice,elapsed){
   const dictation=question.type==='melodic-dictation';
   const fraction=conceptQuiz?conceptQuiz.fraction(question.score.quiz,choice):
    Number(dictation?choice.every((step,i)=>step===question.response[i]):K.classroomCorrect(choice,question));
   const correct=fraction===1;
   const category=conceptQuiz||dictation||question.type==='accidental-placement'?(correct?'correct':fraction>0?'partial':'incorrect'):choice.id;
   breakdown.find(row=>row.answer===category).count++;
   player.answered=true;
   player.answer=conceptQuiz||dictation?JSON.stringify(choice):choice.id;
   player.correct=correct;
   player.streak=correct?player.streak+1:0;
   const points=Math.round(fraction*(elapsed<500?100:Math.max(50,Math.round(100*(1-elapsed/(2*questionTime*1000))))));
   player.score+=points;
   if(conceptQuiz)player.gained=points;
  }

  function simulateQuiz(now){
   const dictation=question.type==='melodic-dictation';
   const available=question.type==='accidental-placement'?choiceActivity.allowedPlacementIds(question).map(id=>choiceActivity.placementAnswer(question,id)):answers;
   const correct=available.find(answer=>K.classroomCorrect(answer,question));
   players.forEach((player,index)=>{
    const elapsed=(index+1)*750;
    if(isPreview(player)||player.answered||startedAt+elapsed>Math.min(now,deadline))return;
    const isCorrect=(game.index+index)%4!==3;
    const choice=conceptQuiz?(isCorrect?conceptQuiz.correctResponse(question.score.quiz):''):
     dictation?(isCorrect?question.response:question.response.map((step,i)=>i?step:step+1)):
     isCorrect?correct:available.find(answer=>!K.classroomCorrect(answer,question))??correct;
    recordQuizAnswer(player,choice,elapsed);
   });
   if(now>=deadline||players.every(player=>player.answered))game.phase='review';
  }

  function finishRace(winners,reason){
   game.phase='finished';
   game.winners=winners.map(player=>player.name);
   game.winner=game.winners.join(' and ');
   game.finishReason=reason;
  }

  function simulateRace(now){
   players.forEach((player,index)=>{
    if(isPreview(player))return;
    const steps=Math.floor((Math.min(now,deadline??now)-startedAt)/(1100+index*320));
    while(game.phase==='question'&&player.attempt<steps){
     player.attempt++;
     if(index>0&&player.attempt%(8+index)===0){
      player.resetVersion=player.attempt;
      player.resetFrom=player.streak;
      player.streak=0;
     }else{
      player.streak++;
      player.highestStreak=Math.max(player.highestStreak,player.streak);
      if(player.streak>=targetStreak)finishRace([player],'target');
     }
    }
   });
   if(game.phase==='question'&&deadline!==null&&now>=deadline){
    const best=Math.max(...players.map(player=>player.highestStreak));
    finishRace(players.filter(player=>player.highestStreak===best),'time');
   }
  }

  return {
   snapshot:conceptQuiz||(choiceActivity&&preparedQuestions?.length)?()=>({preparedQuestions,deadline,startedAt,breakdown}):undefined,
   request(action,extra={},pupil=false){
    const now=Date.now();
    if(action==='end')return {closed:true};
    if(action==='start'&&game.phase==='lobby'&&players.length)beginQuestion(now);
    if(action==='audio-ended'){
     if(pupil)throw Error('Only the teacher can control the game.');
     if(extra.index!==game.index||!question?.score?.audio)throw Error('This question is no longer active.');
     if(game.phase==='listening'){
      game.phase='question';
      startedAt=now;
      deadline=now+questionTime*1000;
     }
    }
    if(action==='skip-excerpt'){
     if(pupil)throw Error('Only the teacher can control the game.');
     if(!conceptQuiz||game.phase!=='listening'||extra.index!==game.index)throw Error('This question is no longer active.');
     game.phase='review';
    }
    if(action==='remove'&&game.phase==='lobby'){
     const index=players.findIndex(player=>player.id===extra.playerId);
     if(index!==-1)players.splice(index,1);
    }
    if(game.phase==='countdown'&&now>=startedAt)game.phase='question';
    const previewPlayer=players.find(isPreview);
    if(pupil&&previewPlayer&&action==='answer'&&game.phase==='question'&&(deadline==null||now<deadline)){
     if(racing&&extra.index===previewPlayer.attempt){
      const choices=choiceActivity?choiceActivity.answers(previewQuestion):written?answers:K.classroomAnswers(options,previewQuestion.type==='find');
      const choice=choices.find(answer=>answer.id===extra.answer);
      if(choice){
       previewPlayer.attempt++;
       previewPlayer.lastCorrect=K.classroomCorrect(choice,previewQuestion);
       if(previewPlayer.lastCorrect){
        previewPlayer.streak++;
        previewPlayer.highestStreak=Math.max(previewPlayer.highestStreak,previewPlayer.streak);
       }else{
        previewPlayer.resetVersion=previewPlayer.attempt;
        previewPlayer.resetFrom=previewPlayer.streak;
        previewPlayer.streak=0;
       }
       if(previewPlayer.streak>=targetStreak)finishRace([previewPlayer],'target');
       else previewQuestion=preparedQuestions?preparedQuestions[previewPlayer.attempt%preparedQuestions.length]:generator.next(options,types,level);
      }
     }else if(!racing&&extra.index===game.index&&!previewPlayer.answered){
      const choice=conceptQuiz?(conceptQuiz.canSubmit(question.score.quiz,extra.response)?extra.response:null):question.type==='melodic-dictation'
       ?Array.isArray(extra.notes)&&extra.notes.length===question.response.length&&extra.notes.every(Number.isInteger)?extra.notes:null
       :question.type==='accidental-placement'?choiceActivity.placementAnswer(question,extra.placement)
       :answers.find(answer=>answer.id===extra.answer);
      if(choice)recordQuizAnswer(previewPlayer,choice,now-startedAt);
     }
    }
    if(game.phase==='question'){
     if(racing)simulateRace(now);
     else simulateQuiz(now);
    }
    if(action==='reveal'&&game.phase==='question'&&!racing)game.phase='review';
    if(action==='next'&&game.phase==='review'){
     if(game.index+1===total)game.phase='finished';
     else{
      game.index++;
      beginQuestion(now,3000);
     }
    }
    const showResults=game.phase==='review'||game.phase==='finished';
    if(conceptQuiz&&!pupil&&action==='read'&&Object.hasOwn(extra,'excerptPlayback')){
     const playback=extra.excerptPlayback;
     excerptPlayback=question?.score?.audio&&playback?.index===game.index&&playback.phase===game.phase
      ?{...playback,until:now+4000}:null;
    }
    const ranking=[...players].sort((a,b)=>(showResults?b.score-a.score:0)||a.name.localeCompare(b.name));
    return {...game,serverTime:now,startedAt,deadline,
     playingAudio:Boolean(excerptPlayback?.index===game.index&&excerptPlayback.phase===game.phase&&excerptPlayback.until>now),
     index:pupil&&racing&&previewPlayer?previewPlayer.attempt:game.index,
     question:pupil&&racing?previewQuestion:question,players:ranking.map(player=>({...player})),
     breakdown:showResults?breakdown.map(row=>({...row})):[],
     unanswered:players.filter(player=>!player.answered).length};
   },
  };
 }

 root.MLHClassroomTestGame={create,requestFromHost};
})(globalThis);
