/* Ongoing collection practice reuses the shared Hub scoring, medals and feedback. */
(function(){
'use strict';
const h=React.createElement,C=MusicDictionaryQuizCore,B=MUSIC_DICTIONARY_QUIZ_BANK;
// Prepare saved question edits before mounting, so refresh never paints a temporary quiz layout.
let preparedQuestions=B.questions,preparationError='';
try{
 const raw=localStorage.getItem('mlh-concept-quiz-reviews-v1');
 window.MusicDictionaryQuizReady=raw?C.applyReviews(B,JSON.parse(raw).records).then(edits=>{preparedQuestions=B.questions.filter(q=>!edits.get(q.id)?.deleted).map(q=>edits.get(q.id)?.question||q);}).catch(error=>{preparationError='This collection could not load. '+error.message;}):null;
}catch(error){preparationError='This collection could not load. '+error.message;}
const literacy=window.MLHMusicLiteracyQuiz;
let literacyQuestions=literacy?.bank.questions,literacyPreparationError='';
if(literacy){
 const literacyReady=literacy.ready.then(async()=>{
  const raw=localStorage.getItem(literacy.storageKey);
  if(!raw)return;
  const edits=await C.applyReviews(literacy.bank,JSON.parse(raw).records);
  literacyQuestions=literacyQuestions.filter(q=>!edits.get(q.id)?.deleted).map(q=>edits.get(q.id)?.question||q);
 }).catch(error=>{literacyPreparationError='Music Literacy questions could not load. '+error.message;});
 window.MusicDictionaryQuizReady=Promise.all([window.MusicDictionaryQuizReady,literacyReady]);
}

window.MusicDictionaryQuizPicture=function({question}){
 const illustration=literacy?.pictureFor(question);
 if(!illustration)return null;
 const picture=typeof illustration.picture==='string'?{symbols:illustration.picture}:illustration.picture;
 return h('div',{className:'cq-notation-picture',role:'img','aria-label':illustration.description},
  h(window.MLHLiteracyNotation.LiteracyPicture,{picture:{...picture,alt:undefined},fitInk:true}));
};

const answered=value=>Array.isArray(value)?value.length>0:typeof value==='string'&&value.trim().length>0;
function canSubmit(q,response){
 if(!answered(response))return false;
 if(q.format==='musical-features')return C.musicalFeatureEntries(response).length>0;
 return !C.isMultiSelect(q.format)||response.length>=q.answer.correctOptionIds.length;
}
window.MusicDictionaryQuizAudio=function({question,review=false,active=true}){
 const [failed,setFailed]=React.useState(false),host=React.useRef(null),player=React.useRef(null);
 React.useEffect(()=>{
  setFailed(false);
  const instance=window.ExamAudio.createPlayer(host.current,{clips:[{file:question.media.src,label:'Audio example'}],onPlaybackError:()=>setFailed(true)});
  player.current=instance;
  return()=>{instance.destroy();if(player.current===instance)player.current=null;};
 },[question.id,question.media.src,active]);
 return h('div',{className:'cq-audio-question'},
  h('div',{ref:host,className:'cq-audio-player',role:'group','aria-label':'Audio example'}),
  failed&&h('div',{className:'cq-audio-error',role:'alert'},h('p',null,'This audio example could not load. Please try again.'),h('button',{type:'button',className:'cq-button',onClick:()=>{setFailed(false);void player.current?.retry();}},'Retry audio')),
  review&&h('p',{className:'cq-muted'},question.media.recording));
};
const P=window.MusicDictionaryQuizPractice;
const worksheetCounts=Array.from({length:41},(_,index)=>10+index);
const medalAssets={bronze:'./ui-icons/bronze.svg',silver:'./ui-icons/silver.svg',gold:'./ui-icons/gold.svg',diamond:'./ui-icons/diamond.svg'};
window.MusicDictionaryQuizStats=function({summary}){
 const s=summary||{};
 return h(window.MLH.ScoreStreakPanel,{assets:medalAssets,correct:s.correct||0,attempted:s.attempted||0,accuracy:s.attempted?Math.round(100*s.correct/s.attempted):0,streak:s.streak||0,bestStreak:s.best||0,resetScore:s.resetScore||(()=>{}),confettiKey:s.confetti||0,medalEligible:!!s.medalEligible,achievementLevel:s.level,achievementActivity:s.activity,medalThresholdValues:P.thresholds});
};
function practiceQuestion(q,index,{response='',locked=false,onAnswer=()=>{},touches,measure=false}){
 const audio=q.modality==='audio'&&q.format!=='order'&&(measure?h('div',{className:'cq-audio-question'},h('div',{style:{height:'66px'}})):h(window.MusicDictionaryQuizAudio,{question:q}));
 const reference=q.referenceMedia&&h('div',{className:'cq-order-reference'},h('strong',null,'Original Motif'),h(window.MusicDictionaryQuizOrderAudio,{media:q.referenceMedia,label:'Original Motif'}));
 return h('section',{key:measure?q.id:undefined,className:'cq-paper-question'+(locked?' is-practice-checked':'')+(measure?' cq-practice-measure':' cq-practice-current'),'aria-hidden':measure?true:undefined,inert:measure?'':undefined},
  h('header',{className:'question-header'},h('h3',null,measure?'Question '+(index+1):'Question')),
  h('div',{className:'subquestion'},
   h(window.MusicDictionaryQuizQuestionCard,{question:q,response,locked,onAnswer,touches,picture:h(window.MusicDictionaryQuizPicture,{question:q}),audio,reference}),
   h('div',{className:'cq-inline-feedback-slot'},
    h(window.MusicDictionaryQuizQuestionFeedback,{question:q,response,pending:true}),
    locked&&h(window.MusicDictionaryQuizQuestionFeedback,{question:q,response}))));
}
window.MusicDictionaryQuizPlayer=function({config,onExit,onSummary,embedded=false,exiting=false}){
 const groups=React.useMemo(()=>MusicDictionaryQuizCollections.groupsForLevel(config.level),[]);
 const identity=React.useMemo(()=>P.collectionIdentity(config,groups),[]);
 const medalEligible=identity.medalEligible&&window.MusicDictionaryQuizzes.allQuestionTypesEnabled(config);
 const Q=MusicDictionaryQuizCollections;
 const configuredIds=new Set(Q.scopeIds(config.concepts,config.level));
 const wholeLevel=!config.savedCollectionId&&groups.some(group=>group.id===config.collectionId&&!group.cumulative&&
  group.qualification===config.level&&group.conceptIds.length===configuredIds.size&&group.conceptIds.every(id=>configuredIds.has(id)));
 const standardLevel=wholeLevel&&(identity.medalEligible||config.cumulativeLevelQuiz===true);
 const cumulative=standardLevel&&(config.level==='ALL'||config.selectedLevelOnly!==true);
 const priorityLevel=cumulative?config.level:undefined;
 const scoreOptions={level:config.level,scope:identity.scope,settings:null};
 const questionRandom=React.useMemo(()=>window.MLH.classroomActivities?.exerciseRandom(window.location.search) ?? Math.random,[]);
 const initialQuestions=React.useMemo(()=>{
  if(config.literacyQuiz){
   const pool=literacyPreparationError?[]:literacyQuestions.filter(q=>config.level==='ALL'||q.levelCode===config.level);
   return {pool,cycle:pool.length?P.startCycle(pool.map(q=>q.id),questionRandom,pool):null,
    notice:literacyPreparationError||(!pool.length?'There are no Music Literacy questions at this level.':'')};
  }
  if(preparationError)return {pool:[],cycle:null,notice:preparationError};
  const ids=cumulative?new Set(Q.conceptsThrough(config.level)):configuredIds;
  const multiConceptConfig={...config,defaultLevelQuiz:cumulative};
  const multiConcept=window.MusicDictionaryMultiConceptQuiz?.questionsForCollection(multiConceptConfig,ids)||[];
  const scopedLiteracy=standardLevel&&!literacyPreparationError
   ?(literacyQuestions||[]).filter(q=>cumulative?Q.includesLevel(config.level,q.levelCode):q.levelCode===config.level):[];
  const scoped=[...preparedQuestions.filter(q=>C.questionInScope(q,ids)),...multiConcept,...scopedLiteracy].filter(q=>!C.validateQuestion(q).length);
  const pool=scoped.filter(q=>C.eligibleForQuiz(q,config));
  if(pool.length)return {pool,cycle:P.startCycle(pool.map(q=>q.id),questionRandom,pool,priorityLevel),notice:''};
  const unrestricted={...multiConceptConfig,formats:null,audioQuestions:true,nonAudioQuestions:true};
  const available=scoped.some(q=>C.eligibleForQuiz(q,unrestricted))||
   window.MusicDictionaryMultiConceptQuiz?.questionsForCollection(unrestricted,ids).some(q=>!C.validateQuestion(q).length);
  return {pool,cycle:null,notice:available?'No questions match the selected question types. Change them in Customise.':'There are no quiz questions for these concepts at this level.'};
 },[]);
 const pool=initialQuestions.pool,notice=initialQuestions.notice;

 const [correct,setCorrect]=window.MLH.usePersistentScoreState(0,'correct',scoreOptions),[attempted,setAttempted]=window.MLH.usePersistentScoreState(0,'attempted',scoreOptions),[best,setBest]=window.MLH.usePersistentScoreState(0,'bestStreak',scoreOptions);
 const [streak,setStreak]=React.useState(0),[confetti,setConfetti]=React.useState(0),[cycle,setCycle]=React.useState(initialQuestions.cycle),[response,setResponse]=React.useState(''),[feedback,setFeedback]=React.useState(null),[feedbackFading,setFeedbackFading]=React.useState(false),[phase,setPhase]=React.useState('idle');
 const [worksheetCount,setWorksheetCount]=React.useState(10),[printQuestions,setPrintQuestions]=React.useState(null);
 const host=React.useRef(null),worksheetDialog=React.useRef(null),timers=React.useRef([]),touches=React.useRef({}),lockedRef=React.useRef(false),changing=React.useRef(false);
 const clearTimers=()=>{timers.current.forEach(clearTimeout);timers.current=[];};
 const stopAudio=()=>{window.dispatchEvent?.(new Event('mlh-stop-order-audio'));host.current?.querySelectorAll('audio').forEach(audio=>{void window.MLH.fadeOutAudio(audio,{reset:true});});};
 React.useEffect(()=>()=>{clearTimers();stopAudio();},[]);

 const questionsById=React.useMemo(()=>new Map(pool.map(question=>[question.id,question])),[pool]);
 const worksheetPool=React.useMemo(()=>pool.filter(question=>question.modality!=='audio'),[pool]);
 const hasAudio=worksheetPool.length!==pool.length;
 const prepareChoice=React.useMemo(()=>P.createChoicePreparer(),[cycle?.cycle]);
 const questionId=cycle?.order[cycle.at];
 const q=React.useMemo(()=>{
  const question=questionsById.get(questionId);
  if(!question)return null;
  const realised=cycle.cycle>0&&question.distractorCandidates?window.MusicDictionaryMultiConceptQuiz.realise(question):question;
  return prepareChoice(realised);
 },[questionsById,questionId,prepareChoice]);
 React.useLayoutEffect(()=>{
  if(!cycle)return;
  function prepareWorksheet(){
   const ordered=cycle.order.map(id=>questionsById.get(id));
   ReactDOM.flushSync(()=>setPrintQuestions(previous=>previous||P.prepareWorksheetQuestions(ordered,worksheetCount)));
  }
  function clearWorksheet(){setPrintQuestions(null);}
  window.addEventListener('beforeprint',prepareWorksheet);
  window.addEventListener('afterprint',clearWorksheet);
  return()=>{
   window.removeEventListener('beforeprint',prepareWorksheet);
   window.removeEventListener('afterprint',clearWorksheet);
  };
 },[cycle?.order,questionsById,worksheetCount]);
 function openWorksheet(){worksheetDialog.current?.showModal();}
 function printWorksheet(event){
  event.preventDefault();
  worksheetDialog.current?.close();
  window.print();
 }
 function nextQuestion(){if(!cycle||changing.current)return;changing.current=true;clearTimers();stopAudio();const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;setPhase('leaving');timers.current.push(setTimeout(()=>{setCycle(P.advanceCycle(cycle,questionRandom,pool,priorityLevel));setResponse('');setFeedback(null);setFeedbackFading(false);lockedRef.current=false;touches.current={};setPhase('entering');timers.current.push(setTimeout(()=>{setPhase('idle');changing.current=false;},reduced?0:140));},reduced?0:100));}
 function submitAnswer(){
  if(!q||lockedRef.current||changing.current||!canSubmit(q,response))return;
  lockedRef.current=true;
  stopAudio();
  const mark=C.markQuestion(q,response),ok=mark.earned===mark.available,partial=mark.earned>0&&!ok;
  const next=P.markPractice({correct,attempted,streak,best},ok,C.continuesPracticeStreak(q,mark));
  const medal=P.earnedMedal(next.streak,medalEligible);
  setCorrect(next.correct);setAttempted(next.attempted);setStreak(next.streak);setBest(next.best);
  setFeedback({correct:ok,partial});setFeedbackFading(false);
  try{window.MLH.playFeedbackSound(ok||partial,!!medal,medal==='diamond'?'platinum':medal)?.catch?.(()=>{});}catch{}
  if(medal)setConfetti(v=>v+1);
 }
 function resetScore(){setCorrect(0);setAttempted(0);setStreak(0);setBest(0);setConfetti(0);nextQuestion();}
 React.useLayoutEffect(()=>{onSummary?.({key:JSON.stringify(config),correct,attempted,streak,best,confetti,level:config.level,activity:identity.activity,medalEligible,questionCount:pool.length,hasAudio,openWorksheet,resetScore});},[correct,attempted,streak,best,confetti,pool]);

 const toolbarHost=document.getElementById('cq-question-navigation-host');
 const skip=q&&h(window.MLH.SkipButton,{disabled:phase!=='idle',resetStreak:()=>{if(!feedback)setStreak(0);},onClick:nextQuestion,icon:h('img',{src:'./ui-icons/next.svg',alt:'','aria-hidden':true,className:'h-[27.8px] w-[27.8px] object-contain'})});
 const advance=e=>{if(feedback&&!changing.current&&!e.target.closest('button,input,textarea,label,[data-menu-trigger],[data-menu-panel]'))nextQuestion();};
 return h('div',{ref:host,className:'cq-paper cq-quiz-inline cq-practice'+(exiting?' is-leaving':''),onPointerDown:advance,'aria-label':(config.name||'Quiz')+' practice'},toolbarHost&&ReactDOM.createPortal(h(React.Fragment,null,h('div',{className:'cq-toolbar-feedback','aria-live':'polite'},feedback&&h(window.MLH.FeedbackBadge,{feedback,fading:feedbackFading,animationPrefix:'note'})),skip),toolbarHost),!hasAudio&&worksheetPool.length>0&&h('dialog',{ref:worksheetDialog,className:'cq-worksheet-dialog','aria-labelledby':'cq-worksheet-title'},
  h('form',{onSubmit:printWorksheet},
   h('h2',{id:'cq-worksheet-title'},'Worksheet Generator'),
   h('label',null,'Questions',h('select',{value:worksheetCount,onChange:event=>setWorksheetCount(Number(event.target.value))},
    worksheetCounts.map(count=>h('option',{key:count,value:count},count)))),
   worksheetCount>worksheetPool.length&&h('p',{role:'status'},'This collection has '+worksheetPool.length+' eligible '+(worksheetPool.length===1?'question.':'questions.')),
   h('div',{className:'cq-worksheet-actions'},
    h('button',{type:'button',className:'cq-button',onClick:()=>worksheetDialog.current?.close()},'Cancel'),
    h('button',{type:'submit',className:'cq-button primary'},'Print Worksheet')))),
 h('header',{className:'cq-print-header'},h('h1',null,config.name||'Quiz'),h('div',{className:'cq-print-pupil-fields'},h('span',null,'Name: ______________________________'),h('span',null,'Class: ____________'),h('span',null,'Date: ____________'))),!q?h('p',{role:'status'},notice||'Loading quiz…'):h(React.Fragment,null,h('div',{className:'subquestions cq-question-stage cq-practice-stage cq-question-'+phase,'aria-busy':phase==='leaving'},h('div',{className:'cq-practice-measurements'},printQuestions?.map((question,index)=>practiceQuestion(question,index,{measure:true}))),practiceQuestion(q,cycle.at,{response,locked:!!feedback,onAnswer:value=>{if(!lockedRef.current&&!changing.current)setResponse(value);},touches})),h('div',{className:'cq-paper-actions cq-practice-actions'},h('button',{type:'button',className:'cq-button primary cq-practice-submit',onClick:feedback?nextQuestion:submitAnswer,disabled:phase!=='idle'||(!feedback&&(!canSubmit(q,response)))},feedback?'Next':'Submit'))));
};

})();
