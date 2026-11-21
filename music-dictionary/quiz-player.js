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

const optionLayout=q=>({'multi-select':' is-tick-two','audio-select-2':' is-tick-two','audio-select-3':' is-tick-three','audio-select-4':' is-tick-four'}[q.format]||'');
const answered=value=>Array.isArray(value)?value.length>0:typeof value==='string'&&value.trim().length>0;
function canSubmit(q,response){
 if(!answered(response))return false;
 if(q.format==='musical-features')return C.musicalFeatureEntries(response).length>0;
 return !C.isMultiSelect(q.format)||response.length>=q.answer.correctOptionIds.length;
}
function questionPrompt(text){return h('span',{dangerouslySetInnerHTML:{__html:C.promptHtml(text)}});}

function correctAnswer(q){if(q.format==='musical-features')return q.answer.features.map(feature=>feature.name).join('; ');if(q.format==='order')return q.answer.correctOptionIds.map(id=>(q.options.find(o=>o.id===id)?.answerLabel||q.options.find(o=>o.id===id)?.text)).join(' → ');return q.options?q.options.filter(o=>q.answer.correctOptionIds.includes(o.id)).map(o=>o.text).join('; '):q.answer.canonical;}
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
function OrderAnswer({question:q,response,locked,onAnswer}){
 const rows=Array.isArray(response)&&response.length===q.options.length?response:q.options.map(o=>o.id);
 const useRef=React.useRef;
  const elements=useRef(new Map()),previous=useRef(null),moving=useRef(null),frame=useRef(null);
  const labels=C.orderLabels(q);
  React.useLayoutEffect(()=>{
    if(frame.current){const first=elements.current.get(rows[0])?.getBoundingClientRect(),last=elements.current.get(rows[rows.length-1])?.getBoundingClientRect();if(first)frame.current.style.setProperty('--cq-order-first-height',first.height+'px');if(last)frame.current.style.setProperty('--cq-order-last-height',last.height+'px');}
    const before=previous.current;previous.current=null;if(!before)return;
    if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
    for(const [id,element] of elements.current){
      const delta=before.get(id)-element.getBoundingClientRect().top;
      if(!Number.isFinite(delta)||Math.abs(delta)<1||!element.animate)continue;
      element.style.zIndex=id===moving.current?'2':'1';
      const animation=element.animate([{transform:`translateY(${delta}px)`},{transform:'translateY(0)'}],{duration:320,easing:'cubic-bezier(.22,1,.36,1)'});
      animation.onfinish=animation.oncancel=()=>{element.style.zIndex='';};
    }
  },[rows,q.id]);
  function step(id,delta){
    if(locked)return;
    const index=rows.indexOf(id);if(!rows[index+delta])return;
    previous.current=new Map([...elements.current].map(([key,element])=>[key,element.getBoundingClientRect().top]));
    for(const element of elements.current.values())for(const animation of element.getAnimations?.()||[])animation.cancel();
    moving.current=id;
    const next=rows.slice();[next[index],next[index+delta]]=[next[index+delta],next[index]];onAnswer(next);
  }
 return h('div',{className:'cq-order-answer',ref:frame},h('div',{className:'cq-order-endpoints','aria-hidden':true},h('span',{className:'cq-order-endpoint is-first'},labels[0]),h('span',{className:'cq-order-endpoint is-last'},labels[1])),h('ol',{className:'cq-order-list','aria-label':'Answer order'},rows.map((id,index)=>h('li',{key:id,'data-quiz-order-item':id,className:'cq-order-item'+(locked?' is-user-'+(q.answer.correctOptionIds[index]===id?'correct':'incorrect'):''),ref:element=>{if(element)elements.current.set(id,element);else elements.current.delete(id);}},h('span',{className:'cq-order-position','aria-hidden':true},index+1),h('div',{className:'cq-order-text'},h('span',null,locked?(q.options.find(o=>o.id===id)?.answerLabel||q.options.find(o=>o.id===id)?.text):q.options.find(o=>o.id===id)?.text),q.modality==='audio'&&h(window.MusicDictionaryQuizOrderAudio,{media:q.options.find(o=>o.id===id).media,label:q.options.find(o=>o.id===id).text})),h('div',{className:'cq-order-arrows'},h('button',{type:'button','aria-label':'Move '+q.options.find(o=>o.id===id)?.text+' up',disabled:locked||index===0,onClick:()=>step(id,-1)},'↑'),h('button',{type:'button','aria-label':'Move '+q.options.find(o=>o.id===id)?.text+' down',disabled:locked||index===rows.length-1,onClick:()=>step(id,1)},'↓'))))));
}

window.MusicDictionaryQuizAnswer=function({question:q,response='',locked=false,onAnswer,touches={current:{}}}){
 if(q.format==='order')return h(OrderAnswer,{question:q,response,locked,onAnswer});
 if(q.format==='musical-features'){
  const hintId=q.id+'-entry-hint';
  const areasId=q.id+'-areas';
  return h('div',null,
   h('p',{id:areasId,className:'cq-features-areas'},'Comment on: ',h('strong',null,q.areas.join(', '))),
   h('p',{id:hintId,className:'cq-features-hint'},'Enter one feature per line.'),
   h('textarea',{className:'text-answer cq-features-answer','aria-label':'Musical features','aria-describedby':areasId+' '+hintId,rows:q.answer.count,value:response,readOnly:locked,onChange:event=>onAnswer(event.target.value)}));
 }
 const remove=(clear,control='text')=>({onDoubleClick:e=>{if(!locked){e.preventDefault();clear();}},onContextMenu:e=>{if(!locked){e.preventDefault();clear();}},onTouchEnd:e=>{if(locked)return;const key=q.id+':'+control,last=touches.current[key]||0,now=Date.now();touches.current[key]=now;if(now-last<=350){e.preventDefault();touches.current[key]=0;clear();}},onKeyDown:e=>{if(!locked&&e.shiftKey&&['Delete','Backspace'].includes(e.key)){e.preventDefault();clear();}}});
 if(q.options)return h('fieldset',{className:'answer-fieldset'},h('legend',{className:'sr-only'},q.prompt),h('div',{className:'answer-options'+optionLayout(q)},q.options.map(o=>{
  const selected=Array.isArray(response)?response.includes(o.id):response===o.id,clear=()=>onAnswer(Array.isArray(response)?response.filter(id=>id!==o.id):'');
  return h('label',{key:o.id,className:'answer-option'+(selected?' is-selected':'')+(locked&&selected?(q.answer.correctOptionIds.includes(o.id)?' is-user-correct':' is-user-incorrect'):'')},h('input',{type:C.isMultiSelect(q.format)?'checkbox':'radio',name:'quiz-answer-'+q.id,value:o.id,checked:selected,disabled:locked||(C.isMultiSelect(q.format)&&!selected&&Array.isArray(response)&&response.length>=q.answer.correctOptionIds.length),'aria-keyshortcuts':locked?undefined:'Shift+Delete Shift+Backspace',...remove(clear,o.id),onClick:()=>{if(!locked&&selected&&!C.isMultiSelect(q.format))onAnswer('');},onChange:e=>{if(!locked)onAnswer(C.isMultiSelect(q.format)?(e.target.checked?[...(Array.isArray(response)?response:[]),o.id]:(Array.isArray(response)?response:[]).filter(id=>id!==o.id)):o.id);}}),h('span',{className:'answer-option-copy'},o.text));
 })));
 const correct=C.isCorrect(q,response);
 return h('input',{type:'text',className:'text-answer short-answer-line'+(answered(response)?' has-user-answer':'')+(locked?' is-user-'+(correct?'correct':'incorrect'):''),'aria-label':'Your answer',value:response,disabled:locked,'aria-keyshortcuts':locked?undefined:'Shift+Delete Shift+Backspace',...remove(()=>onAnswer('')),onChange:e=>{if(locked)return;let value=e.target.value;if(q.format!=='complete-statement')value=value.replace(/^(\s*)(\p{Ll})/u,(_,space,letter)=>space+letter.toUpperCase());onAnswer(value);},onKeyDown:e=>{if(!locked&&e.key==='Enter')e.currentTarget.closest('.cq-practice')?.querySelector('.cq-practice-submit:not(:disabled)')?.click();else if(!locked&&e.shiftKey&&['Delete','Backspace'].includes(e.key)){e.preventDefault();onAnswer('');}}});
};
function practiceQuestion(q,index,{response='',locked=false,onAnswer=()=>{},touches,measure=false}){
 const features=q.format==='musical-features';
 const mark=features?C.markMusicalFeatures(q,response):C.markQuestion(q,response);
 const correct=mark.earned===mark.available,partial=mark.earned>0&&!correct;
 const answer=h(window.MusicDictionaryQuizAnswer,{question:q,response,locked,onAnswer,touches});
 const statement=q.format==='complete-statement'?q.prompt.split(/_{2,}/):null,inline=statement?.length===2;
 const credited=new Set(mark.matchedFeatureIds);
 const accepted=features&&h('p',null,h('b',null,'Accepted features: '),q.answer.features.map((feature,index)=>
  h(React.Fragment,{key:feature.id},index>0?'; ':null,
   h('span',{className:credited.has(feature.id)?'cq-credited-feature':undefined},feature.name))));
 const feedbackPanel=pending=>h('aside',{className:'inline-answer-feedback'+(pending?' is-feedback-pending':'')+' is-'+(!pending&&correct?'correct':!pending&&partial?'partial':'incorrect'),'aria-hidden':pending?true:undefined,inert:pending?'':undefined},
  h('div',{className:'inline-feedback-heading'},h('strong',null,!pending&&correct?'Correct':!pending&&partial?'Partially correct':'Incorrect')),
  features?h(React.Fragment,null,h('p',null,credited.size+' '+(credited.size===1?'feature':'features')+' credited. Minimum required: '+mark.available+'.'),accepted)
   :h(React.Fragment,null,(pending||!correct)&&h('p',{className:'inline-correct-answer'},h('b',null,'Answer: '),correctAnswer(q)),h('p',{className:'inline-answer-definition'},q.feedback)));
 return h('section',{key:measure?q.id:undefined,className:'cq-paper-question'+(locked?' is-practice-checked':'')+(measure?' cq-practice-measure':' cq-practice-current'),'aria-hidden':measure?true:undefined,inert:measure?'':undefined},h('header',{className:'question-header'},h('h3',null,measure?'Question '+(index+1):'Question')),h('div',{className:'subquestion'},h('div',{className:'cq-practice-question-card'},q.modality==='audio'&&q.format!=='order'&&(measure?h('div',{className:'cq-audio-question'},h('div',{style:{height:'66px'}})):h(window.MusicDictionaryQuizAudio,{question:q})),q.referenceMedia&&h('div',{className:'cq-order-reference'},h('strong',null,'Original Motif'),h(window.MusicDictionaryQuizOrderAudio,{media:q.referenceMedia,label:'Original Motif'})),h('div',{className:'subquestion-heading'},h('p',{className:'subquestion-heading-question'},inline?h('span',{className:'sentence-answer'},statement[0],answer,statement[1]):questionPrompt(q.prompt))),h(window.MusicDictionaryQuizPicture,{question:q}),!inline&&answer),h('div',{className:'cq-inline-feedback-slot'},feedbackPanel(true),locked&&feedbackPanel(false))));
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
 const initialQuestions=React.useMemo(()=>{
  if(config.literacyQuiz){
   const pool=literacyPreparationError?[]:literacyQuestions.filter(q=>config.level==='ALL'||q.levelCode===config.level);
   return {pool,cycle:pool.length?P.startCycle(pool.map(q=>q.id),Math.random,pool):null,
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
  if(pool.length)return {pool,cycle:P.startCycle(pool.map(q=>q.id),Math.random,pool,priorityLevel),notice:''};
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
 function nextQuestion(){if(!cycle||changing.current)return;changing.current=true;clearTimers();stopAudio();const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;setPhase('leaving');timers.current.push(setTimeout(()=>{setCycle(old=>P.advanceCycle(old,Math.random,pool,priorityLevel));setResponse('');setFeedback(null);setFeedbackFading(false);lockedRef.current=false;touches.current={};setPhase('entering');timers.current.push(setTimeout(()=>{setPhase('idle');changing.current=false;},reduced?0:140));},reduced?0:100));}
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
