const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../music-dictionary/quiz-core.js');
const typed=(id,concept,answer,variants=[answer])=>({id,conceptId:concept,factGroupId:id,answer:{canonical:answer,acceptedVariants:variants}});
test('all distinct correct answers are used before any answer repeats, across formats and aliases',()=>{
 const qs=[typed('a','a','Ayre',['Ayre','Air']),typed('b','a','Air'),
  {id:'c',conceptId:'a',factGroupId:'c',options:[{id:'d',text:'Ayre'}],answer:{correctOptionIds:['d']}},
  typed('d','b','Motet'),typed('e','c','Pavan'),typed('f','d','Jazz')];
 const run=C.selectQuizQuestions(qs,4,()=>0);
 assert.deepEqual(run.map(q=>q.id),['a','d','e','f']);
 assert.equal(C.selectQuizQuestions(qs,6,()=>0).length,6);
});
test('new concepts come before further questions on an already used concept',()=>{
 const qs=[typed('a','one','First'),typed('b','one','Second'),typed('c','two','Third')];
 assert.deepEqual(C.selectQuizQuestions(qs,2,()=>0).map(q=>q.id),['a','c']);
});
test('when repetition is unavoidable it fills the requested length without reusing a question',()=>{
 const qs=[typed('a','one','Motet'),typed('b','one','Motet'),typed('c','two','Pavan')];
 const run=C.selectQuizQuestions(qs,10,()=>0);
 assert.deepEqual(run.map(q=>q.id),['a','c','b']);assert.equal(new Set(run).size,3);
});
test('answer identity uses wording rather than option letters or option order',()=>{
 const choice=(id,text,letter)=>({id,conceptId:id,factGroupId:id,options:[{id:letter,text}],answer:{correctOptionIds:[letter]}});
 const run=C.selectQuizQuestions([choice('a','Jazz','a'),choice('b','JAZZ.','d'),choice('c','Rock','a')],2,()=>0);
 assert.deepEqual(run.map(q=>q.id),['a','c']);
});
test('real mixed and audio-only level pools provide ten different concept answers',()=>{
 const vm=require('node:vm'),fs=require('node:fs'),box={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../music-dictionary/quiz-bank.js'),'utf8'),box);
 const bank=box.window.MUSIC_DICTIONARY_QUIZ_BANK;
 for(const level of ['N3','N4','N5','H','AH'])for(const audioOnly of [false,true]){
  const pool=bank.questions.filter(q=>q.levelCode===level&&(!audioOnly||q.modality==='audio'));
  const run=C.selectQuizQuestions(pool,10,()=>0);
  assert.equal(run.length,10);assert.equal(new Set(run.map(q=>q.conceptId)).size,10,level);
 }
});
