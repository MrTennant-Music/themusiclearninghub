(function(root,factory){
 const server=typeof module==='object'&&module.exports;
 const core=server?require('../music-dictionary/quiz-core.js'):root.MusicDictionaryQuizCore;
 const practice=server?require('../music-dictionary/quiz-practice-core.js'):root.MusicDictionaryQuizPractice;
 const api=factory(core,practice);
 if(server){
  module.exports=api;
  api.loadMaterial=async()=>{
   const literacy=require('../music-dictionary/literacy-quiz-bank.js')(require('../music-dictionary/music-literacy-dictionary.js'),core);
   await literacy.ready;
   return {
    collections:require('../music-dictionary/quiz-collections.js'),
    multi:require('../music-dictionary/quiz-multi-concept.js'),
    literacy,
    questions:[
     ...require('../music-dictionary/quiz-data/question-bank.json').questions,
     ...require('../music-dictionary/quiz-data/audio-question-bank.json').questions,
     ...require('../music-dictionary/quiz-data/audio-order-question-bank.json').questions,
    ],
   };
  };
 }else root.MLH.classroomConceptQuiz=api;
})(globalThis,function(C,P){
 const levels=['N3','N4','N5','H','AH','ALL'];
 function settings(activity){
  if(typeof activity!=='string'||!activity.startsWith('/'))return null;
  const url=new URL(activity,'https://classroom.invalid');
  if(url.origin!=='https://classroom.invalid'||url.pathname!=='/conceptquiz.html')return null;
  const query=url.searchParams;
  const level=levels.includes(query.get('level'))?query.get('level'):'N5';
  const formats=query.has('formats')?query.get('formats').split(',').filter(format=>C.formats.includes(format)):null;
  return {format:'concept-quiz',activity:url.pathname+url.search,level,formats,group:query.get('group'),
   ids:query.get('ids'),selectedLevelOnly:query.get('selectedLevelOnly')==='1',cumulative:query.get('cumulative')==='1',
   literacyQuiz:query.get('literacyQuiz')==='1',audioQuestions:query.get('audio')!=='0',nonAudioQuestions:query.get('text')!=='0'};
 }
 function selectedIds(raw){
  const ids=[];
  for(const part of raw.split(',')){
   const match=/^(\d{1,4})(?:-(\d{1,4}))?$/.exec(part);
   if(!match)return [];
   const first=Number(match[1]),last=Number(match[2]||match[1]);
   if(first<1||last<first||ids.length+last-first>=1000)return [];
   for(let id=first;id<=last;id++)ids.push('MC-'+String(id).padStart(4,'0'));
  }
  return ids;
 }
 function pool(config,material){
  if(!material)return [];
  const {collections:Q,literacy,questions,multi}=material;
  if(config.literacyQuiz){
   return literacy.bank.questions.filter(q=>(config.level==='ALL'||q.levelCode===config.level)&&C.eligibleForQuiz(q,config));
  }
  const group=config.group&&Q.groupsForLevel(config.level).find(row=>row.id===config.group);
  const levelQuiz=config.cumulative||(!config.group&&!config.ids);
  const ids=levelQuiz&&!config.selectedLevelOnly?Q.conceptsThrough(config.level):
   group?group.conceptIds:config.ids?selectedIds(config.ids):
   config.group?[]:Q.groupsForLevel(config.level).find(row=>row.qualification===config.level)?.conceptIds||Q.conceptsThrough(config.level);
  const inScope=new Set(Q.scopeIds(ids,config.level));
  const settings={...config,defaultLevelQuiz:levelQuiz&&!config.selectedLevelOnly};
  const literacyQuestions=levelQuiz?literacy.bank.questions.filter(q=>config.selectedLevelOnly?q.levelCode===config.level:Q.includesLevel(config.level,q.levelCode)):[];
  return [...questions.filter(q=>C.questionInScope(q,inScope)),...multi.questionsForCollection(settings,inScope),...literacyQuestions]
   .filter(q=>C.eligibleForQuiz(q,settings)&&!C.validateQuestion(q).length);
 }
 function excerpt(media){
  if(media?.kind==='audio'&&media.src?.startsWith('./audio/concept-library/'))return {kind:'file',src:media.src};
  if(media?.kind==='piano')return {kind:'notes',notes:media.events,duration:media.duration};
  return null;
 }
 function audioFor(question){
  return question.modality==='audio'?excerpt(question.media):null;
 }
 function orderMedia(media){
  if(!media)return undefined;
  const {kind,src,events,duration}=media;
  return {kind,src,events,duration};
 }
 function questions(config,count,material,random=Math.random){
  const available=pool(config,material);
  const unique=new Map(available.map(q=>[q.id,q]));
  const order=P.startCycle([...unique.keys()],random,[...unique.values()],config.level).order.map(id=>unique.get(id));
  const audio=order.filter(q=>q.modality==='audio');
  const text=order.filter(q=>q.modality!=='audio');
  const deck=[];
  const usedFormats=new Set();
  let audioTurn=order[0]?.modality==='audio';
  while(deck.length<Math.min(count,order.length)){
   const preferred=audioTurn?audio:text;
   const remaining=preferred.length?preferred:audioTurn?text:audio;
   const nextFormat=remaining.findIndex(q=>!usedFormats.has(q.format));
   const [question]=remaining.splice(Math.max(0,nextFormat),1);
   deck.push(question);
   usedFormats.add(question.format);
   audioTurn=!audioTurn;
  }
  const prepare=P.createChoicePreparer(random);
  return deck.map(question=>{
   const q=prepare(question);
   const audio=audioFor(q);
   const quiz={id:q.id,prompt:q.prompt,format:q.format,modality:q.modality,areas:q.areas,
    options:q.options?.map(({id,text,answerLabel,media})=>({id,text,answerLabel,media:orderMedia(media)})),
    referenceMedia:orderMedia(q.referenceMedia),answer:q.answer,
    feedback:q.feedback,generator:q.generator&&{type:q.generator.type},illustration:material.literacy.pictureFor(q)};
   return {type:'concept-quiz',score:{quiz,...(audio&&{audio})}};
  });
 }
 function publicQuestion(question,{host,reveal}){
  const {quiz,audio}=question.score;
  const {answer,feedback,options,...display}=quiz;
  return {type:question.type,score:{quiz:{...display,options:reveal?options:options?.map(({id,text,media})=>({id,text,media})),
   answer:reveal?answer:{
    correctOptionIds:answer.correctOptionIds?.map(()=>null),acceptedVariants:[],count:answer.count,features:[],
   },feedback:reveal?feedback:undefined},...(host&&audio&&{audio})}};
 }
 function validResponse(value){
  return typeof value==='string'?Boolean(value.trim())&&value.length<=1200:
   Array.isArray(value)&&value.length>0&&new Set(value).size===value.length&&value.every(id=>typeof id==='string'&&id.length<=80);
 }
 function canSubmit(quiz,response){
  if(!validResponse(response))return false;
  if(!quiz.options)return typeof response==='string'&&(quiz.format!=='musical-features'||C.musicalFeatureEntries(response).length>0);
  const ids=Array.isArray(response)?response:[response];
  const count=quiz.format==='order'?quiz.options.length:C.isMultiSelect(quiz.format)?quiz.answer.correctOptionIds.length:1;
  return ids.length===count&&ids.every(id=>quiz.options.some(option=>option.id===id));
 }
 function fraction(quiz,response){
  const {earned,available}=C.markQuestion(quiz,response);
  return earned/available;
 }
 function correctResponse(quiz){
  return quiz.format==='musical-features'?quiz.answer.features.map(item=>item.name).join('\n'):
   quiz.format==='order'||C.isMultiSelect(quiz.format)?quiz.answer.correctOptionIds:
   quiz.options?quiz.answer.correctOptionIds[0]:quiz.answer.canonical;
 }
 return {settings,available:(config,material)=>pool(config,material).length,questions,publicQuestion,validResponse,canSubmit,fraction,correctResponse};
});
