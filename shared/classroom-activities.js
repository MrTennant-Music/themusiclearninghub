(function(root){
 'use strict';
 const exercises=Object.freeze({
  '/noteidentification.html':['Note Identification','notenaming-icon','Identify note names in the treble and bass clef.'],
  '/keyboardnoteidentification.html':['Keyboard Note Identification','keyboard-icon','Identify notes on the keyboard and match written notes to keys.'],
  '/accidentals.html':['Accidentals','accidentals-icon','Identify and use accidentals and enharmonic equivalents.'],
  '/chords.html':['Chords','chords-icon','Identify, create and apply chords in music.'],
  '/intervals.html':['Intervals','intervals-icon','Identify and create intervals.'],
  '/keysignatures.html':['Key Signatures','key-signatures-icon','Identify key signatures and scale degrees.'],
  '/melodicdictation.html':['Melodic Dictation','insert-missing-notes-icon','Identify and complete melodic patterns.'],
  '/transposing.html':['Transposing','transposing-icon','Transpose between the treble and bass clefs.'],
  '/barlines.html':['Barlines','barlines-icon','Insert barlines at the correct place in the music.'],
  '/readingrhythms.html':['Reading Rhythms','readingrhythm-icon','Perform rhythms in time with the music by reading notation.'],
  '/rests.html':['Rests','rests-icon','Identify and apply rests.'],
  '/rhythmidentification.html':['Rhythm Identification','rhythm-groups-icon','Identify and group matching rhythms.'],
  '/rhythmsums.html':['Rhythm Sums','rhythm-sums-icon','Calculate rhythm values.'],
  '/rhythmicdictation.html':['Rhythmic Dictation','correct-the-rhythm-icon','Identify, insert and correct rhythms.'],
  '/timesignatures.html':['Time Signatures','time-signatures-icon','Identify time signatures.'],
  '/articulationmarkings.html':['Articulation Markings','articulation-markings-icon','Identify and apply staccatos, slurs, accents and phrase markings.'],
  '/dynamics.html':['Dynamics','dynamics-icon','Interpret and apply dynamics in the music.'],
  '/followthescore.html':['Follow the Score','stopmusic-icon','Listen and follow the score to find where the music stops.'],
  '/repeatsigns.html':['Repeat Signs','repeat-signs-icon','Identify repeat signs and navigation marks.'],
  '/practicequestions.html':['Practice Questions','practice-app-icon','Complete exam-style questions combining multiple music literacy concepts.'],
  '/scaledegrees.html':['Key Signatures','key-signatures-icon','Identify key signatures and scale degrees.','Scale Degrees','scale-degrees-icon'],
  '/enharmonicequivalents.html':['Accidentals','accidentals-icon','Identify and use accidentals and enharmonic equivalents.','Enharmonic Equivalents','enharmonic-icon'],
 });
 const activities=Object.freeze({
  ...exercises,
  '/wordsearch.html':['Word Search','wordsearch-icon','Find musical terms hidden in the letter grid.'],
  '/crosswords.html':['Crosswords','crosswords-grid-icon','Solve musical clues to complete the crossword.'],
  '/connections.html':['Connections','connections-grid-icon','Find four groups of four related musical ideas.'],
  '/conceptsort.html':['Concept Sort','concept-sort-icon','Sort musical concepts into their correct groups.'],
  '/conceptrecall.html':['Concept Recall','concept-recall-icon','Name as many musical concepts as you can under each category.'],
  '/conceptquiz.html':['Concept Quizzes','concept-quiz-icon','Quick questions to strengthen your musical knowledge.'],
  '/dominoes.html':['Dominoes','dominoes-icon','Match musical definitions to build a domino chain.'],
  '/musicescape.html':['Escape Room','music-escape','Solve the clues to find your way out.'],
  '/whowantstobemillionaire/whowantstobeamillionaire.html':['Who Wants to Be a Millionaire?','millionaire-icon','Test your musical knowledge and climb the prize ladder to £1 million.'],
 });
 const base='https://classroom.invalid';
 function activityUrl(value){
  if(typeof value!=='string'||!value.startsWith('/')||value.length>3000)return null;
  try{
   const url=new URL(value,base);
   if(url.origin!==base||!Object.hasOwn(activities,url.pathname))return null;
   url.searchParams.delete('classroomSeed');
   url.searchParams.delete('classroomCorrectTarget');
   url.searchParams.delete('classroomRace');
   url.searchParams.delete('classroomRetryRace');
   url.searchParams.delete('classroomStreak');
   url.searchParams.delete('classroomProgress');
   url.searchParams.delete('classroomTimeTrial');
   url.searchParams.delete('classroomPractice');
   return url;
  }catch{return null;}
 }
 function settings(value){
  const url=activityUrl(value);
  return url?{gameType:url.pathname==='/dominoes.html'?'dominoes':'shared',activity:url.pathname+url.search+url.hash}:null;
 }
 function hostingDisabled(value){return ['/connections.html','/practicequestions.html'].includes(activityUrl(value)?.pathname);}
 const listeningLiteracyPaths=new Set(['/melodicdictation.html','/rhythmicdictation.html','/followthescore.html','/repeatsigns.html']);
 function literacyHostMode(value){
  const url=activityUrl(value);
  if(!url||!isExercise(url.pathname))return null;
  const state=profile(url);
  const level=url.searchParams.get('level')||state.activeLevel||state.level;
  if(url.pathname==='/rhythmicdictation.html'&&writtenDictationType(level||'N5',state.enabledQuestionTypes))return 'race';
  if(listeningLiteracyPaths.has(url.pathname))return 'quiz';
  if(url.pathname==='/chords.html'){
   if((!level||level==='N5')&&state.n5Customise?.chordProgression&&state.n5Customise.identifyChord===false)return 'quiz';
   if(level==='AH'&&state.ahCustomise?.identifyChords&&
    !state.ahCustomise.insertPosition&&!state.ahCustomise.createBassLine)return 'quiz';
  }
  const audioType=url.pathname==='/dynamics.html'?'audio':url.pathname==='/articulationmarkings.html'?'aural-articulation':null;
  if(audioType&&url.searchParams.get('mode')!=='order'&&state.orderMode!==true&&
    state.enabledTypes?.length===1&&state.enabledTypes[0]===audioType)return 'quiz';
  return 'race';
 }
 function writtenDictationType(level,types){
  const type=level==='N5'?'scotch':level==='H'?'identifyTriplet':null;
  if(!type)return null;
  if(!Array.isArray(types)||!types.length||types.includes(type)||(level==='H'&&types.includes('triplets')))return type;
  return null;
 }
 function activityProfile(value){
  const url=activityUrl(value);
  if(!url)return null;
  const state=profile(url);
  return {pathname:url.pathname,level:url.searchParams.get('level')||state.activeLevel||state.level,state};
 }
 function allowsLiteracyQuiz(value,hasWrittenQuiz=false){
  return Boolean(literacyHostMode(value)&&(listeningSettings(value)||hasWrittenQuiz));
 }
 function validStreakSetup(target,minutes){
  return Number.isInteger(target)&&target>=1&&target<=100&&Number.isInteger(minutes)&&minutes>=0&&minutes<=10;
 }
 function validStreakProgress(attempted,streak,highestStreak){
  return Number.isInteger(attempted)&&attempted>=0&&attempted<=999999&&Number.isInteger(streak)&&streak>=0&&
   Number.isInteger(highestStreak)&&highestStreak>=streak&&highestStreak<=Math.min(attempted,100);
 }
 function profile(url){
  try{
   const raw=url.searchParams.get('settings');
   if(!raw)return {};
   const bytes=Uint8Array.from(atob(raw.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
   const data=JSON.parse(new TextDecoder().decode(bytes));
   return data.version===2&&data.activity===url.pathname.split('/').at(-1)?data.state||{}:{};
  }catch{return {};}
 }
 const worksheetActivities=new Set([
  '/noteidentification.html','/keyboardnoteidentification.html','/accidentals.html','/intervals.html',
  '/keysignatures.html','/transposing.html','/barlines.html','/rests.html','/timesignatures.html',
  '/articulationmarkings.html','/practicequestions.html','/scaledegrees.html',
  '/enharmonicequivalents.html','/crosswords.html','/wordsearch.html','/conceptrecall.html','/dominoes.html',
 ]);
 function worksheetAvailable(value){
  if(value==='written-notes')return true;
  const url=activityUrl(value);
  if(!url)return false;
  if(worksheetActivities.has(url.pathname))return true;
  if(url.pathname==='/chords.html'||url.pathname==='/melodicdictation.html'){
   const state=profile(url);
   const level=url.searchParams.get('level')||state.activeLevel||'N5';
   if(url.pathname==='/melodicdictation.html')return level==='N3'||level==='N4';
   const {identifyChords=true,insertPosition=true,createBassLine=true}=state.ahCustomise??{};
   return level==='N5'||(level==='AH'&&(insertPosition||createBassLine||!identifyChords));
  }
  if(url.pathname==='/rhythmsums.html'||url.pathname==='/dynamics.html'){
   return url.searchParams.get('mode')!=='order'&&profile(url).orderMode!==true;
  }
  return false;
 }
 function collectionSettings(value){
  const url=activityUrl(value);
  if(!url||!['/conceptsort.html','/connections.html','/crosswords.html','/wordsearch.html'].includes(url.pathname)||
    !url.hash.startsWith('#playnote='))return null;
  url.searchParams.set('classroomListening','1');
  return {format:'collection',activity:url.pathname+url.search+url.hash};
 }
 const nativePracticePaths=new Set(['/followthescore.html','/rhythmicdictation.html','/repeatsigns.html']);
 function hostsNativePractice(value,hasAudioCollection=false){
  const url=activityUrl(value);
  return Boolean(url&&(nativePracticePaths.has(url.pathname)||
   (url.pathname==='/chords.html'&&(url.searchParams.get('level')||profile(url).activeLevel||profile(url).level)==='H')||
   (url.pathname==='/conceptsort.html'&&url.searchParams.get('type')==='styles')||
   (url.pathname==='/dominoes.html'&&['Styles','Instruments'].includes(url.searchParams.get('dominoAudio')))||
   (hasAudioCollection&&collectionSettings(value))));
 }
 function raceRequiresQuiz(value){
  const url=activityUrl(value);
  return Boolean(url&&(hostsNativePractice(value)||literacyHostMode(value)==='quiz'||
   (url.searchParams.get('classroomListening')==='1'&&collectionSettings(value))));
 }
 const raceListeningMessage='This activity requires audio and cannot be hosted as a Race.';
 function listeningSettings(value){
  const url=activityUrl(value);
  if(!url)return null;
  const state=profile(url);
  const path=url.pathname;
  const selectedLevel=url.searchParams.get('level')||state.activeLevel||state.level;
  const level=['N3','N4','N5','H','AH'].includes(selectedLevel)?selectedLevel:
   ({'/accidentals.html':'N5','/chords.html':'N5','/melodicdictation.html':'N5','/articulationmarkings.html':'H','/repeatsigns.html':'N4'}[path]||'N3');
  let format;
  if(path==='/dynamics.html'&&url.searchParams.get('mode')!=='order'&&state.orderMode!==true&&
    (!Array.isArray(state.enabledTypes)||state.enabledTypes.includes('audio')))format='dynamics';
  if(path==='/articulationmarkings.html'&&(!Array.isArray(state.enabledTypes)||state.enabledTypes.includes('aural-articulation')))format='articulation';
  format||=({
   '/melodicdictation.html':'melody','/rhythmicdictation.html':'rhythm',
   '/followthescore.html':'follow','/chords.html':'chords','/repeatsigns.html':'repeats',
   '/practicequestions.html':'practice','/musicescape.html':'recordings',
  })[path];
  if(!format&&url.searchParams.get('classroomListening')==='1'&&collectionSettings(value))format='collection';
  return format?{format,level,state,activity:url.pathname+url.search+url.hash}:null;
 }
 function header(activity){
  const [title,icon,subtitle,tabTitle=title,tabIcon=icon]=activity==='written-notes'
   ? ['Note Identification','notenaming-icon','Identify note names in the treble and bass clef.']
   : activities[activityUrl(activity)?.pathname]||['Keyboard Note Identification','keyboard-icon','Identify notes on the keyboard and match written notes to keys.'];
  return {title,icon:'/app-icons/'+icon+'.svg',subtitle,tabTitle,tabIcon:'/app-icons/'+tabIcon+'.svg'};
 }
 function isRhythmTimeTrialActivity(value){return activityUrl(value)?.pathname==='/rhythmidentification.html';}
 function isRetryRaceActivity(value){return ['/dominoes.html','/conceptsort.html'].includes(activityUrl(value)?.pathname);}
 function isRetryRace(search=root.location?.search){
  return isRace(search)&&new URLSearchParams(search).get('classroomRetryRace')==='1';
 }
 function validRetryRaceAttempt(attempt){
  if (!attempt) return false;
  const {id,correct,total,elapsedMs}=attempt;
  return [id,correct,total,elapsedMs].every(Number.isSafeInteger)&&id>0&&total>=1&&total<=1000&&
   correct>=0&&correct<=total&&elapsedMs>=1&&elapsedMs<=600000;
 }
 function submitRetryRaceAttempt(correct,total,elapsedMs){
  const storage=progressStorage();
  const id=Math.max(Date.now(),(storage?.read('retryAttemptId',0)||0)+1);
  const attempt={id,correct,total,elapsedMs:Math.max(1,Math.round(elapsedMs))};
  if(validRetryRaceAttempt(attempt)&&root.parent!==root){
   storage?.write('retryAttemptId',id);
   root.parent.postMessage({type:'mlh:classroom-race-attempt',attempt},root.location.origin);
  }
 }
 function retryRaceScore(player){
  const latest=player.retryAttempt;
  if(!latest) return null;
  return player.retryPerfectMs==null?latest:{...latest,correct:latest.total,elapsedMs:player.retryPerfectMs};
 }
 function compareRetryRacePlayers(a,b){
  const first=retryRaceScore(a),second=retryRaceScore(b);
  if(!first||!second)return Number(Boolean(second))-Number(Boolean(first));
  return second.correct*first.total-first.correct*second.total||first.elapsedMs-second.elapsedMs;
 }
 function validTimeTrialMinutes(value){return Number.isInteger(value)&&value>=1&&value<=10;}
 function playUrl(value,seed,targetCorrect,activityRace=false,startedAt,timeTrial=false,nativePractice=false,nativeStreak=false,retryRace=false){
  const url=activityUrl(value);
  if(!url||!Number.isInteger(seed)||seed<0||seed>0xffffffff)return null;
  url.searchParams.delete('classroomFormat');
  url.searchParams.delete('classroomListening');
  url.searchParams.set('classroomSeed',seed);
  if(activityRace)url.searchParams.set('classroomRace','1');
  if(activityRace&&retryRace&&isRetryRaceActivity(value))url.searchParams.set('classroomRetryRace','1');
  if(nativeStreak)url.searchParams.set('classroomStreak','1');
  if(nativePractice)url.searchParams.set('classroomPractice','1');
  if(timeTrial&&isRhythmTimeTrialActivity(value))url.searchParams.set('classroomTimeTrial','1');
  if((activityRace||nativePractice)&&Number.isSafeInteger(startedAt)&&startedAt>0)url.searchParams.set('classroomProgress',startedAt+'-'+seed);
  if(Number.isInteger(targetCorrect)&&targetCorrect>0)url.searchParams.set('classroomCorrectTarget',targetCorrect);
  return url.pathname+url.search+url.hash;
 }
 function usesOriginalFormat(activity){
  return activityUrl(activity)?.searchParams.get('classroomFormat')==='original';
 }
 function seed(search){
  const raw=new URLSearchParams(search).get('classroomSeed');
  if(raw===null||!/^\d{1,10}$/.test(raw))return null;
  const value=Number(raw);
  return value<=0xffffffff?value:null;
 }
 function isRace(search=root.location?.search){
  return seed(search)!==null&&new URLSearchParams(search).has('classroomRace');
 }
 function isStreakRace(search=root.location?.search){
  return isRace(search)&&new URLSearchParams(search).get('classroomStreak')==='1';
 }
 function raceQuestionTypes(enabled,writtenTypes){
  if(!isRace())return enabled;
  const selected=enabled.filter(type=>writtenTypes.includes(type));
  return selected.length?selected:writtenTypes;
 }
 function random(seed){
  return ()=>{
   seed=(seed+0x6d2b79f5)|0;
   let value=Math.imul(seed^(seed>>>15),1|seed);
   value^=value+Math.imul(value^(value>>>7),61|value);
   return ((value^(value>>>14))>>>0)/4294967296;
  };
 }
 function shuffle(items,random=Math.random){
  const deck=[...items];
  for(let i=deck.length-1;i>0;i--){
   const j=Math.floor(random()*(i+1));
   [deck[i],deck[j]]=[deck[j],deck[i]];
  }
  return deck;
 }
 function quizQuestionCounts(available=50,minimum=5){
  const limit=Math.min(50,available);
  if(limit<5)return limit>=minimum?[limit]:[];
  const choices=Array.from({length:Math.floor(limit/5)},(_,i)=>(i+1)*5);
  if(limit>=5&&limit%5)choices.push(limit);
  return choices;
 }
 function progressStorage(search=root.location?.search,pathname=root.location?.pathname){
  const params=new URLSearchParams(search);
  const round=params.get('classroomProgress');
  if(!pathname||seed(search)===null||(!params.has('classroomRace')&&!params.has('classroomPractice'))||!/^\d{1,16}-\d{1,10}$/.test(round||''))return null;
  const prefix='mlh:classroom:progress:'+round+':'+pathname+':';
  return {
   read(key,fallback){try{return JSON.parse(root.sessionStorage.getItem(prefix+key))??fallback;}catch{return fallback;}},
   write(key,value){try{root.sessionStorage.setItem(prefix+key,JSON.stringify(value));}catch{}},
  };
 }
 function isExercise(path){return Object.hasOwn(exercises,path)&&!hostingDisabled(path);}
 function exerciseRandom(search){
  const value=seed(search);
  if(value===null)return Math.random;
  const storage=progressStorage(search);
  if(!storage)return random(value);
  let draws=storage.read('exercise-random-draws',0);
  if(!Number.isSafeInteger(draws)||draws<0)draws=0;
  const next=random(value+Math.imul(draws,0x6d2b79f5));
  let pending=false;
  function save(){storage.write('exercise-random-draws',draws);pending=false;}
  root.addEventListener('pagehide',save);
  return ()=>{
   draws++;
   if(!pending){pending=true;root.queueMicrotask(save);}
   return next();
  };
 }
 function roundQuestionsFor(path){return isExercise(path)&&path!=="/rhythmidentification.html"?10:null;}
 function isMillionaireActivity(value){return activityUrl(value)?.pathname==='/whowantstobemillionaire/whowantstobeamillionaire.html';}
 function isEscapeRoomActivity(value){return activityUrl(value)?.pathname==='/musicescape.html';}
 function raceTargetFor(path){return isEscapeRoomActivity(path)?6:isMillionaireActivity(path)?15:path==="/practicequestions.html"?null:path==="/conceptquiz.html"?10:roundQuestionsFor(path);}
 const api={settings,hostingDisabled,literacyHostMode,allowsLiteracyQuiz,writtenDictationType,activityProfile,validStreakSetup,validStreakProgress,isStreakRace,listeningSettings,collectionSettings,hostsNativePractice,raceRequiresQuiz,raceListeningMessage,header,worksheetAvailable,playUrl,usesOriginalFormat,seed,isRace,raceQuestionTypes,random,shuffle,quizQuestionCounts,progressStorage,isExercise,exerciseRandom,roundQuestionsFor,raceTargetFor,isMillionaireActivity,isEscapeRoomActivity,isRhythmTimeTrialActivity,validTimeTrialMinutes,isRetryRaceActivity,isRetryRace,validRetryRaceAttempt,submitRetryRaceAttempt,retryRaceScore,compareRetryRacePlayers};
 if(typeof module==='object'&&module.exports)module.exports=api;
 else {
  root.MLH.classroomActivities=api;
  if(Object.hasOwn(activities,root.location.pathname)&&seed(root.location.search)!==null)root.MLH.classroomExercise=true;
 }
})(globalThis);
