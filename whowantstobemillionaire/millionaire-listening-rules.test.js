const test=require('node:test'),assert=require('node:assert/strict');
const C=require('./millionaire-core'),Base=require('./millionaire-question-bank'),Imported=require('./millionaire-concept-questions');
function rng(seed){return()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);}
// Test-only audio fixtures verify future scheduling without importing recordings.
const fixtures=C.SUPPORTED_LEVELS.flatMap(level=>['medium','hard'].flatMap(difficulty=>Array.from({length:20},(_,i)=>({
 id:`listening-fixture-${level}-${difficulty}-${i}`,level,category:'listening',concept:'Audio fixture',conceptId:`fixture-${level}-${difficulty}-${i}`,question:`Listening fixture ${level} ${difficulty} ${i}`,
 answers:[{id:'a',text:'First'},{id:'b',text:'Second'},{id:'c',text:'Third'},{id:'d',text:'Fourth'}],correctAnswer:'a',explanation:'Test fixture.',tip:'Test fixture.',
 difficulty,difficultyMin:C.DIFFICULTY_RANGES[difficulty].min,difficultyMax:C.DIFFICULTY_RANGES[difficulty].max,type:'audio',audio:{src:`fixture-${i}.mp3`},audioSrc:`fixture-${i}.mp3`,notationData:null,
}))));
test('listening begins at Question 8 and always finishes enabled concepts games',()=>{
 const bank=[...Base,...Imported.questions,...fixtures];assert.deepEqual(C.validateQuestionBank(bank),[]);
 for(const level of C.SUPPORTED_LEVELS)for(const categories of [['concepts','listening'],['literacy','concepts','listening']])for(let seed=1;seed<=15;seed++){
  const game=C.composeGame(bank,[],rng(seed*104729),{level,categories});
  assert.equal(game.length,15);assert(!game.slice(0,7).some(C.isListeningQuestion));assert(C.isListeningQuestion(game[14]));
  assert(game.every(q=>q.level===level));
  if(categories.includes('literacy')){
   assert.equal(game.filter(q=>q.category==='literacy').length,4);
   assert.equal(game.filter(q=>q.category==='concepts'||q.category==='listening').length,11);
  }else assert(!game.some(q=>q.category==='literacy'));
  for(const stage of [7,15]){
   const replacement=C.switchQuestion(bank,game,stage,level,rng(seed));assert(replacement);
   assert.equal(replacement.category,game[stage-1].category);
   assert.equal(C.isListeningQuestion(replacement),stage===15);
  }
 }
});
test('switching off audio or concepts leaves every question non-audio',()=>{
 const bank=[...Base,...Imported.questions,...fixtures];
 for(const categories of [['literacy'],['concepts'],['literacy','concepts']]){
  const game=C.composeGame(bank,[],rng(7),{level:'N3',categories});
  assert(!game.some(C.isListeningQuestion));
 }
});
test('real imported recordings follow the late-question and final-listening rules at every level',()=>{
 const bank=[...Base,...Imported.questions];
 for(const level of C.SUPPORTED_LEVELS)for(const categories of [['concepts','listening'],['literacy','concepts','listening']])for(let seed=1;seed<=10;seed++){
  const game=C.composeGame(bank,[],rng(seed*104729),{level,categories});
  assert(!game.slice(0,7).some(C.isListeningQuestion));assert.equal(game[14].category,'listening');
  assert(game.every(q=>q.level===level));assert.equal(new Set(game.map(C.questionFingerprint)).size,15);
  const concepts=game.filter(q=>q.category!=='literacy');assert.equal(new Set(concepts.map(q=>q.conceptId)).size,concepts.length);
  if(categories.includes('literacy'))assert.equal(game.filter(q=>q.category==='literacy').length,4);
  const replacement=C.switchQuestion(bank,game,15,level,rng(seed+1000));assert(replacement);assert.equal(replacement.category,'listening');
  assert(replacement.audioSrc.startsWith('./audio/concept-library/'));
 }
});
test('recorded and generated audio cannot enter an early stage even under another category',()=>{
 for(const media of [{audioSrc:'fixture.mp3'},{audio:{src:'fixture.mp3'}},{audio:{generator:{notes:[60]}}},{type:'audio'},{type:'text-audio'}]){
  const q={category:'concepts',...media};
  for(let stage=1;stage<=7;stage++)assert.equal(C.questionAllowedAtStage(q,stage),false);
  for(let stage=8;stage<=15;stage++)assert.equal(C.questionAllowedAtStage(q,stage),true);
 }
 assert.throws(()=>C.buildCategorySchedule(rng(1),['listening']),/Enable Non-Audio Questions/);
});
