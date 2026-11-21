const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const C=require('./millionaire-core'),Base=require('./millionaire-question-bank'),Imported=require('./millionaire-concept-questions');
const Importer=require('../scripts/build-millionaire-concepts.cjs'),source=Importer.readSource();
const eligible=source.questions.filter(q=>q.modality==='text'&&['multiple-choice','multi-select','short-answer'].includes(q.format));
const byId=new Map(source.questions.map(q=>[q.id,q]));
test('every eligible non-audio choice question is imported at its own qualification',()=>{
 const textQuestions=Imported.questions.filter(q=>!C.isListeningQuestion(q));
 assert.equal(Imported.summary.sourceQuestions,1184);assert.equal(Imported.summary.nonAudioQuestions,649);assert.equal(Imported.summary.concepts,291);
 assert.equal(Imported.summary.nameTheConcept,241);
 assert.deepEqual(new Set(textQuestions.map(q=>q.sourceQuestionId)),new Set(eligible.map(q=>q.id)));
 assert.deepEqual(C.validateQuestionBank(Imported.questions),[]);
 for(const q of textQuestions){const original=byId.get(q.sourceQuestionId);
  assert.equal(q.level,original.levelCode);assert.equal(q.category,'concepts');assert.equal(q.type,'text');assert.equal(q.audioSrc,'');
  assert.equal(q.sourceContentSha256,original.contentSha256);assert.deepEqual(q.sourceReview,original.review);
  assert.equal(q.explanation,original.feedback);assert.equal(q.sourcePrompt,original.prompt);
  assert.equal(q.answers.length,4);
  if(original.format==='short-answer'){
   assert.equal(q.question,original.prompt);assert.equal(q.answers.find(a=>a.id===q.correctAnswer).text,original.answer.canonical);
   const dictionary=require('../music-dictionary/music-concepts-data'),byId=new Map(dictionary.concepts.map(c=>[c.id,c])),{overlaps}=require('../scripts/quiz-distractor-overlap.cjs');
   const ids=Object.values(q.answerConceptIds);assert.equal(ids.length,4);assert.equal(new Set(ids).size,4);
   for(const id of ids)assert(dictionary.levels.indexOf(byId.get(id).level)<=C.SUPPORTED_LEVELS.indexOf(q.level));
   for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)assert(!overlaps(ids[i],ids[j]),q.sourceQuestionId+' has overlapping choices');
  }else{
   assert.equal(q.answers.filter(a=>original.answer.correctOptionIds.includes(a.id)).length,1);
   assert(original.answer.correctOptionIds.includes(q.correctAnswer));
   for(const a of q.answers)assert.equal(a.text,original.options.find(o=>o.id===a.id).text);
  }
  assert(!/tick two|choose two/i.test(q.question));
  if(original.format==='multiple-choice')assert.deepEqual(q.answers,original.options.map(({id,text})=>({id,text})));
 }
 assert.deepEqual(Object.fromEntries(Object.entries(Imported.summary.byLevel).map(([l,s])=>[l,[s.nonAudioQuestions,new Set(textQuestions.filter(q=>q.level===l).map(q=>q.conceptId)).size]])),{N3:[140,61],N4:[143,60],N5:[146,66],H:[118,48],AH:[102,37]});
});
test('all five levels import every audio multiple-choice question with original choices and recording metadata',()=>{
 const sourceAudio=source.questions.filter(q=>q.modality==='audio'&&q.format==='multiple-choice'),audio=Imported.questions.filter(C.isListeningQuestion);
 assert.equal(Imported.summary.audioQuestions,535);
 assert.deepEqual(new Set(audio.map(q=>q.sourceQuestionId)),new Set(sourceAudio.map(q=>q.id)));
 assert.equal(audio.length,535*2);
 for(const q of audio){const original=byId.get(q.sourceQuestionId);
  assert.equal(q.category,'listening');assert.equal(q.type,'audio');assert.equal(q.level,original.levelCode);
  assert.equal(q.audioSrc,original.media.src);assert.equal(q.audio.src,original.media.src);assert.equal(q.audio.duration,original.media.duration);
  assert.deepEqual(q.sourceMedia,original.media);assert.deepEqual(q.sourceReview,original.review);assert.equal(q.sourceContentSha256,original.contentSha256);
  assert.deepEqual(q.answers,original.options.map(({id,text})=>({id,text})));
  assert.equal(q.correctAnswer,original.answer.correctOptionIds[0]);assert.equal(q.explanation,original.feedback);
  assert.notEqual(q.difficulty,'easy');assert.equal(C.questionAllowedAtStage(q,7),false);
 }
 assert.deepEqual(Object.fromEntries(Object.entries(Imported.summary.byLevel).map(([l,s])=>[l,[s.audioQuestions,s.concepts]])),{N3:[123,65],N4:[140,73],N5:[134,68],H:[82,48],AH:[56,37]});
 assert(Object.values(Imported.summary.byLevel).every(s=>s.unavailableConcepts.length===0));
});
test('build is reproducible and excludes intentionally empty and retired concepts',()=>{
 assert.deepEqual(Importer.makeQuestions(),Imported);
 for(const id of Imported.summary.excludedConceptIds)assert(!Imported.questions.some(q=>q.conceptId===id));
});
function rng(seed){return()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);}
test('all levels can play concepts alone, literacy alone, or a mixture without repeated concepts or questions',()=>{
 const bank=[...Base,...Imported.questions];
 for(const level of C.SUPPORTED_LEVELS)for(const categories of [['concepts'],['literacy'],['literacy','concepts']])for(let seed=1;seed<=10;seed++){
  const game=C.composeGame(bank,[],rng(seed),{level,categories});
  assert.equal(game.length,15);assert(game.every(q=>q.level===level&&categories.includes(q.category)));
  assert.equal(new Set(game.map(C.questionFingerprint)).size,15);
  const concepts=game.filter(q=>q.category==='concepts');assert.equal(new Set(concepts.map(q=>q.conceptId)).size,concepts.length);
  for(let i=0;i<15;i++)assert.equal(game[i].difficulty,C.difficultyForStage(i+1));
  if(categories.length===2){
   assert.equal(game.filter(q=>q.category==='literacy').length,4);
   assert.equal(game.filter(q=>q.category==='concepts').length,11);
   for(let start=0;start<15;start+=5)assert([1,2].includes(game.slice(start,start+5).filter(q=>q.category==='literacy').length));
  }
  const replacement=C.switchQuestion(bank.filter(q=>categories.includes(q.category)),game,7,level,rng(seed+100));
  assert(replacement);assert.equal(replacement.category,game[6].category);assert.equal(replacement.level,level);
 }
});
test('weighted schedules vary their positions while retaining the exact 4/11 split',()=>{
 const positions=new Set(),extraBlocks=new Set();
 for(let seed=1;seed<=100;seed++){
  const schedule=C.buildCategorySchedule(rng(seed*104729),['concepts','literacy']);
  assert.equal(schedule.filter(c=>c==='literacy').length,4);
  positions.add(schedule.join(','));
  for(let start=0;start<15;start+=5)if(schedule.slice(start,start+5).filter(c=>c==='literacy').length===2)extraBlocks.add(start/5);
 }
 assert(positions.size>1);assert.equal(extraBlocks.size,3);
});
test('exhaustion and the Switch lifeline cannot substitute a different category',()=>{
 const bank=[...Base,...Imported.questions],firstEasy=Imported.questions.find(q=>q.level==='N3'&&q.difficulty==='easy');
 const depleted=bank.filter(q=>q.category!=='concepts'||q.difficulty!=='easy'||q.id===firstEasy.id).map(q=>q.id===firstEasy.id?{...q,gameLimit:undefined}:q);
 assert.throws(()=>C.composeGame(depleted,[],rng(7),{level:'N3',categories:['literacy','concepts']}),/exhausted/);
 const game=C.composeGame(bank,[],rng(9),{level:'N3',categories:['literacy','concepts']});
 const current=game[6],used=new Set(game.map(q=>q.id));
 const noReplacement=bank.filter(q=>q.category!==current.category||used.has(q.id));
 assert.equal(C.switchQuestion(noReplacement,game,7,'N3',rng(1)),null);
});
test('browser combines both banks and registers all pools before the game loads',()=>{
 const context=vm.createContext({});vm.runInContext('window=globalThis;',context);
 for(const name of ['millionaire-question-bank.js','millionaire-concept-questions.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,name),'utf8'),context);
 assert.equal(context.MILLIONAIRE_QUESTION_BANK.length,Base.length+Imported.questions.length);
 assert.equal(C.validateQuestionPools(context.MILLIONAIRE_QUESTION_POOLS).length,0);
 const html=fs.readFileSync(path.join(__dirname,'whowantstobeamillionaire.html'),'utf8');
 assert(html.indexOf('/millionaire-question-bank.js')<html.indexOf('/millionaire-concept-questions.js'));
 assert(html.indexOf('/millionaire-concept-questions.js')<html.indexOf('/millionaire.compiled.js'));
});
test('menu controls select the actual categories without enabling unimported audio',()=>{
 const Babel=require('@babel/standalone'),script=fs.readFileSync(path.join(__dirname,'millionaire.js'),'utf8'),ast=Babel.packages.parser.parse(script,{plugins:['jsx']});let selection;
 Babel.packages.traverse.default(ast,{VariableDeclarator(entry){if(entry.node.id.name==='selectedQuestionCategories')selection=script.slice(entry.node.init.start,entry.node.init.end);}});
 const select=vm.runInNewContext('('+selection+')',{QUESTION_BANK:[],CORE:C});
 assert.deepEqual(Array.from(select({})),['literacy','concepts']);
 assert.deepEqual(Array.from(select({musicConceptsEnabled:false})),['literacy']);
 assert.deepEqual(Array.from(select({musicLiteracyEnabled:false})),['concepts']);
 assert.deepEqual(Array.from(select({musicLiteracyEnabled:false,conceptNonAudioEnabled:false,conceptAudioEnabled:true})),[]);
 const futureAudio=[{level:'N3',category:'listening',type:'audio',audioSrc:'test-fixture.mp3'}];
 assert.deepEqual(Array.from(select({level:'N3'},futureAudio)),['literacy','concepts','listening']);
 assert.deepEqual(Array.from(select({level:'N3',conceptAudioEnabled:false},futureAudio)),['literacy','concepts']);
 assert.deepEqual(Array.from(select({level:'N3',musicConceptsEnabled:false},futureAudio)),['literacy']);
 assert.deepEqual(Array.from(select({level:'AH'},futureAudio)),['literacy','concepts']);
 assert(script.includes('if (!categories.length) throw new Error('));
});

test('standard cumulative games prioritise their level while retaining every prize-stage difficulty',()=>{
 const bank=[...Base,...Imported.questions];
 for(const level of C.SUPPORTED_LEVELS){
  const rank=C.SUPPORTED_LEVELS.indexOf(level);
  const sampledEarlier=new Set();
  for(let seed=1;seed<=12;seed++){
   const game=C.composeGame(bank,[],rng(seed),{level,categories:['concepts','literacy'],includeEarlier:true});
   assert.ok(game.filter(q=>q.level===level).length>=10);
   for(const [index,q] of game.entries()){
    const sourceRank=C.SUPPORTED_LEVELS.indexOf(q.level);
    assert.ok(sourceRank<=rank);
    assert.equal(q.difficulty,C.difficultyForStage(index+1));
    if(sourceRank<rank)sampledEarlier.add(q.level);
   }
   const index=game.findIndex(q=>q.level!==level);
   if(index>=0){
    const replacement=C.switchQuestion(bank,game,index+1,level,rng(seed+100),{includeEarlier:true});
    assert.ok(replacement);
    assert.equal(replacement.difficulty,game[index].difficulty);
    assert.ok(C.SUPPORTED_LEVELS.indexOf(replacement.level)<=rank);
   }
  }
  assert.deepEqual([...sampledEarlier].sort(),C.SUPPORTED_LEVELS.slice(0,rank).sort());
 }
});
