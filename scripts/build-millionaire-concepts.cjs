/* Import current Concept Quizzes without editing their source or
   finalisation records. Selections retain one correct and three wrong source
   options. Written concept clues gain three non-equivalent, in-scope names. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),Core=require('../whowantstobemillionaire/millionaire-core');
const Dictionary=require('../music-dictionary/music-concepts-data');
const {overlaps}=require('./quiz-distractor-overlap.cjs');
const {distractorScopeErrors}=require('./quiz-distractor-scope.cjs');
const sourcePath=path.join(root,'music-dictionary/quiz-bank.js');
function readSource(){const context={window:{}};vm.runInNewContext(fs.readFileSync(sourcePath,'utf8'),context);return JSON.parse(JSON.stringify(context.window.MUSIC_DICTIONARY_QUIZ_BANK));}
const selectionStems={
 'Tick two features you could hear in a musical.':'Which feature could you hear in a musical?',
 'Tick two possible features of a march.':'Which feature is possible in a march?',
 'Tick two groups that are not among the four main orchestral families.':'Which group is not among the four main orchestral families?',
 'Tick two tuned percussion instruments.':'Which is a tuned percussion instrument?',
 'Tick two instruments whose strings can be plucked.':'Which instrument has strings that can be plucked?',
 'Tick two instruments normally played by striking or hitting them directly.':'Which instrument is normally played by striking or hitting it directly?',
 'Tick two groups that are featured in a brass band.':'Which group is featured in a brass band?',
 'Tick two examples of intervals.':'Which is an example of an interval?'
};
function promptFor(q){
 if(q.format==='short-answer')return q.prompt;
 if(q.format==='multiple-choice')return q.prompt.replace(/tick one box/gi,'choose one answer');
 if(selectionStems[q.prompt])return selectionStems[q.prompt];
 const describe=q.prompt.match(/^Tick two statements that describe (.+)\.$/);
 if(describe)return 'Which statement describes '+describe[1]+'?';
 const about=q.prompt.match(/^Tick two statements about (.+)\.$/);
 if(about)return 'Which statement about '+about[1]+' is correct?';
 throw Error('Review the selection instruction for '+q.id);
}
const normal=text=>String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function conceptChoices(q,concept,source,excluded){
 const rank=Dictionary.levels.indexOf(concept.level);
 const accepted=new Set([q.answer.canonical,...q.answer.acceptedVariants||[]].map(normal));
 const knownDistractors=new Set(source.questions.filter(other=>other.conceptId===concept.id&&other.options).flatMap(other=>other.options.filter(option=>!other.answer.correctOptionIds.includes(option.id)).map(option=>normal(option.text))));
 const names=c=>[c.name,...c.aliases||[]];
 const inPrompt=name=>normal(name).length>=4&&(' '+normal(q.prompt)+' ').includes(' '+normal(name)+' ');
 const candidates=Dictionary.concepts.filter(c=>!excluded.has(c.id)&&Dictionary.levels.indexOf(c.level)<=rank&&!overlaps(concept.id,c.id)&&!names(c).some(name=>accepted.has(normal(name))||inPrompt(name))&&!distractorScopeErrors({id:q.id,levelCode:q.levelCode,options:[{id:'wrong',text:c.name}],answer:{correctOptionIds:[]}}).length);
 const score=c=>(c.categories.some(category=>concept.categories.includes(category))?8:0)+(c.level===concept.level?2:0)+(names(c).some(name=>knownDistractors.has(normal(name)))?1:0);
 candidates.sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id));
 const seen=new Set(accepted),wrong=[];
 for(const c of candidates){const key=normal(c.name);if(seen.has(key)||wrong.some(other=>overlaps(other.id,c.id)))continue;seen.add(key);wrong.push(c);if(wrong.length===3)break;}
 if(wrong.length!==3)throw Error('Three distinct, level-appropriate distractors required for '+q.id);
 return {answers:[{id:'a',text:q.answer.canonical},...wrong.map((c,i)=>({id:['b','c','d'][i],text:c.name}))],answerConceptIds:{a:concept.id,...Object.fromEntries(wrong.map((c,i)=>[['b','c','d'][i],c.id]))}};
}
function makeQuestions(source=readSource()){
 const excluded=new Set([...(source.retiredConceptIds||[]),...(source.conceptReviews||[]).filter(r=>r.excludeFromGeneration).map(r=>r.conceptId)]);
 const concepts=new Map(Dictionary.concepts.map(c=>[c.id,c]));
 const audioHashes=new Map();
 const eligible=source.questions.filter(q=>!excluded.has(q.conceptId)&&(
  q.modality==='text'&&['multiple-choice','multi-select','short-answer'].includes(q.format)
  ||q.modality==='audio'&&q.format==='multiple-choice'));
 const questions=eligible.flatMap(q=>{
  const listening=q.modality==='audio';
  const concept=concepts.get(q.conceptId),correctIds=q.answer.correctOptionIds||[];
  const expected=q.format==='multi-select'?[6,2]:[4,1];
  if(!concept||!listening&&q.media)throw Error('Unsupported choice question '+q.id);
  if(listening){
   if(q.media?.kind!=='audio'||!q.media.src||!q.media.sha256||!Number.isFinite(q.media.duration)||q.media.duration<=0)throw Error('Invalid audio metadata: '+q.id);
   const file=path.resolve(root,decodeURIComponent(q.media.src));
   if(!file.startsWith(path.join(root,'audio/concept-library')+path.sep)||!fs.existsSync(file))throw Error('Missing concept recording: '+q.id);
   if(!audioHashes.has(file))audioHashes.set(file,crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'));
   if(audioHashes.get(file)!==q.media.sha256)throw Error('Recording differs from the reviewed source: '+q.id);
  }
  if(q.format==='short-answer'?!q.answer.canonical:q.options.length!==expected[0]||correctIds.length!==expected[1])throw Error('Unsupported answers for '+q.id);
  if(Core.SUPPORTED_LEVELS[Dictionary.levels.indexOf(concept.level)]!==q.levelCode)throw Error('Wrong concept level: '+q.id);
  const named=q.format==='short-answer'?conceptChoices(q,concept,source,excluded):null;
  const correct=named?named.answers[0]:q.options.find(o=>o.id===correctIds[0]);
  const wrong=named?named.answers.slice(1):q.options.filter(o=>!correctIds.includes(o.id)).slice(0,3);
  // Preserve authored ordering for retained choices. The player shuffles them.
  const retained=new Set([correct.id,...wrong.map(o=>o.id)]);
  const answers=named?named.answers:q.options.filter(o=>retained.has(o.id)).map(o=>({id:o.id,text:o.text}));
  const question=promptFor(q);
  return (listening?['medium','hard']:Core.DIFFICULTIES).map(difficulty=>{
   const range=Core.DIFFICULTY_RANGES[difficulty];
   return {id:'conceptquiz-'+q.id.toLowerCase()+'-'+difficulty,level:q.levelCode,category:listening?'listening':'concepts',concept:concept.name,conceptId:q.conceptId,question,prompt:question,answers,correctAnswer:correct.id,
    explanation:q.feedback,tip:listening?'Listen for the instruments, melody, rhythm and texture before choosing.':'Focus on the musical feature in the question and compare all four answers.',difficulty,difficultyMin:range.min,difficultyMax:range.max,type:listening?'audio':'text',audioSrc:listening?q.media.src:'',notationData:null,
    gameLimitGroup:'conceptquiz-'+q.conceptId,gameLimit:1,
    sourceQuestionId:q.id,sourceFormat:q.format,sourcePrompt:q.prompt,sourceOptionIds:named?[]:answers.map(a=>a.id),sourceCorrectOptionIds:correctIds.slice(),sourceContentSha256:q.contentSha256,sourceReview:q.review,
    ...(named?{sourceCanonicalAnswer:q.answer.canonical,answerConceptIds:named.answerConceptIds}:{}),
    ...(listening?{audio:{src:q.media.src,duration:q.media.duration},sourceMedia:q.media}:{}),
    difficultyAssignment:listening?'Listening questions are available only at Questions 8–15.':'The source quiz has no difficulty rating; this question is available in each prize block.'};
  });
 });
 const errors=Core.validateQuestionBank(questions);if(errors.length)throw Error(errors.join('\n'));
 const summary={source:'music-dictionary/quiz-bank.js',sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex'),sourceQuestions:eligible.length,nonAudioQuestions:eligible.filter(q=>q.modality==='text').length,audioQuestions:eligible.filter(q=>q.modality==='audio').length,multipleChoice:eligible.filter(q=>q.format==='multiple-choice').length,selections:eligible.filter(q=>q.format==='multi-select').length,nameTheConcept:eligible.filter(q=>q.format==='short-answer').length,concepts:new Set(eligible.map(q=>q.conceptId)).size,byLevel:{},excludedConceptIds:[...excluded]};
 for(const level of Core.SUPPORTED_LEVELS){const rows=eligible.filter(q=>q.levelCode===level);summary.byLevel[level]={questions:rows.length,nonAudioQuestions:rows.filter(q=>q.modality==='text').length,audioQuestions:rows.filter(q=>q.modality==='audio').length,concepts:new Set(rows.map(q=>q.conceptId)).size,unavailableConcepts:source.coverage.filter(c=>c.levelCode===level&&!excluded.has(c.conceptId)&&!rows.some(q=>q.conceptId===c.conceptId)).map(c=>({id:c.conceptId,name:c.conceptName}))};}
 return {summary,questions};
}
function build(){
 const data=makeQuestions();
 const wrapper='/* Generated by scripts/build-millionaire-concepts.cjs. */\n(function(root,data){if(typeof module==="object"&&module.exports){module.exports=data;return;}root.MILLIONAIRE_CONCEPT_QUESTIONS=data;root.MILLIONAIRE_QUESTION_BANK=(root.MILLIONAIRE_QUESTION_BANK||[]).concat(data.questions);for(const q of data.questions)root.MILLIONAIRE_QUESTION_POOLS[q.level][q.difficulty][q.category].push(q);})(typeof globalThis!=="undefined"?globalThis:this,';
 fs.writeFileSync(path.join(root,'whowantstobemillionaire/millionaire-concept-questions.js'),wrapper+JSON.stringify(data).replace(/</g,'\\u003c')+');\n');
 console.log(`Imported ${data.summary.nonAudioQuestions} non-audio and ${data.summary.audioQuestions} audio questions covering ${data.summary.concepts} concepts.`);
 return data;
}
if(require.main===module)build();module.exports={readSource,makeQuestions,build};
