'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const P=require('../music-dictionary/quiz-practice-core.js'),C=require('../music-dictionary/quiz-core.js'),collections=require('../music-dictionary/quiz-collections.js');
test('each fresh quiz shuffles its first cycle and visits every eligible question once',()=>{
 const ids=Array.from({length:117},(_,i)=>'q'+i),original=[...ids];
 let calls=0,state=P.startCycle(ids,()=>{calls++;return .3;});
 assert.equal(calls,ids.length-1);assert.notDeepEqual(state.order,ids);assert.deepEqual(ids,original);
 const seen=[],initialOrder=[...state.order];
 for(let i=0;i<ids.length;i++){seen.push(state.order[state.at]);state=P.advanceCycle(state,()=>.7);}
 assert.deepEqual(seen,initialOrder);assert.deepEqual(new Set(seen),new Set(ids));assert.equal(state.cycle,1);
 assert.notEqual(state.order[0],seen.at(-1));
 assert.notDeepEqual(P.startCycle(ids,()=>.1).order,P.startCycle(ids,()=>.9).order);
 assert.equal(P.startCycle(['a','a','b'],()=>.5).order.length,2);
});
test('later cycles exhaust the entire pool too, and skipping cannot repeat unseen questions',()=>{let state=P.startCycle(['a','b','c','d'],()=>.4);for(let cycle=0;cycle<10;cycle++){const seen=[];for(let i=0;i<4;i++){seen.push(state.order[state.at]);state=P.advanceCycle(state,()=>.7);}assert.equal(new Set(seen).size,4);}assert.equal(state.cycle,10);});
test('a one-question collection safely repeats after its first complete cycle',()=>{assert.deepEqual(P.advanceCycle(P.startCycle(['a'])),{order:['a'],at:0,cycle:1});});
test('only direct whole-level quiz launches are medal eligible',()=>{
 for(const level of ['N3','N4','N5','H','AH','ALL']){
  const groups=collections.groupsForLevel(level);
  const id=level==='ALL'?'all-concepts':'level-'+level.toLowerCase();
  const whole=groups.find(group=>group.id===id);
  const themed=groups.find(group=>group.id!==id);
  const config={level,concepts:whole.conceptIds,collectionId:id,defaultLevelQuiz:true};
  assert.deepEqual(P.collectionIdentity(config,groups),{
   medalEligible:true,scope:id,activity:'conceptquiz-'+level.toLowerCase()+'-'+id+'.html'
  });
  for(const changes of [
   {defaultLevelQuiz:undefined},
   {defaultLevelQuiz:false},
   {savedCollectionId:'saved-1'},
   {collectionId:themed.id,concepts:themed.conceptIds},
   {concepts:whole.conceptIds.slice(1)}
  ]){
   const selected=P.collectionIdentity({...config,...changes},groups);
   assert.equal(selected.medalEligible,false);
   assert.equal(selected.activity,null);
   assert.notEqual(selected.scope,id);
  }
 }
});
test('medal thresholds and scoring match Accidentals and partial answers break a streak',()=>{let state={correct:0,attempted:0,streak:0,best:0};for(let n=1;n<=30;n++){state=P.markPractice(state,true);assert.equal(P.earnedMedal(n),({10:'bronze',15:'silver',20:'gold',30:'diamond'})[n]||null);assert.equal(P.earnedMedal(n,false),null);}assert.deepEqual(P.markPractice(state,false),{correct:30,attempted:31,streak:0,best:30});const q={format:'multi-select',options:[{id:'a'},{id:'b'}],answer:{correctOptionIds:['a','b']}};assert.equal(C.isCorrect(q,['a']),false);});

test('earned collection medals persist independently without affecting other collections',()=>{const fs=require('node:fs'),vm=require('node:vm'),storage=new Map();function load(){const context={window:{location:{href:'https://hub.local/conceptquiz.html'},localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},addEventListener(){},dispatchEvent(){}},URL,CustomEvent:class{}};vm.runInNewContext(fs.readFileSync('shared/hub-achievements.js','utf8'),context);return context.window.MLH.achievements;}let api=load();api.record('conceptquiz-ah-chords.html','AH',10);api.record('conceptquiz-ah-cadences.html','AH',20);api.record('conceptquiz-all-all-concepts.html','ALL',15);api=load();assert.equal(api.get('conceptquiz-ah-chords.html','AH').tier,'bronze');assert.equal(api.get('conceptquiz-ah-cadences.html','AH').tier,'gold');assert.equal(api.get('conceptquiz-all-all-concepts.html','ALL').tier,'silver');assert.equal(api.get('conceptquiz-ah-tonality.html','AH'),null);api.record('accidentals.html','ALL',30);assert.equal(api.get('accidentals.html','ALL'),null);});

test('related questions are spaced apart within a cycle and across its boundary',()=>{const qs=Array.from({length:18},(_,i)=>({id:'q'+i,conceptId:'concept'+(i%3),factGroupId:'fact'+(i%3)}));let state=P.startCycle(qs.map(q=>q.id),()=>.4,qs),previous;for(let n=0;n<qs.length*4;n++){const q=qs.find(q=>q.id===state.order[state.at]);if(previous)assert.notEqual(q.conceptId,previous.conceptId);previous=q;state=P.advanceCycle(state,()=>.7,qs);}});
test('runtime answer orders balance correct positions without changing stored questions or marking',()=>{const qs=Array.from({length:40},(_,i)=>({id:'q'+i,format:'multiple-choice',options:['a','b','c','d'].map(id=>({id,text:id+i})),answer:{correctOptionIds:['a']}})),before=JSON.stringify(qs);for(const random of [()=>.1,()=>.8]){const counts=[0,0,0,0],shown=P.prepareChoices(qs,random);for(const q of shown){counts[q.options.findIndex(o=>o.id==='a')]++;assert(C.isCorrect(q,'a'));assert(!C.isCorrect(q,'b'));}assert.deepEqual(counts,[10,10,10,10]);assert.equal(JSON.stringify(qs),before);}assert.notDeepEqual(P.prepareChoices(qs,()=>.1)[0].options,P.prepareChoices(qs,()=>.8)[0].options);});
test('tick-two shuffling covers every pair of answer positions before repeating',()=>{const qs=Array.from({length:30},(_,i)=>({id:'q'+i,format:'multi-select',options:['a','b','c','d','e','f'].map(id=>({id,text:id})),answer:{correctOptionIds:['a','f']}})),shown=P.prepareChoices(qs,()=>.37),pairs=shown.map(q=>q.options.flatMap((o,i)=>q.answer.correctOptionIds.includes(o.id)?[i]:[]).join('/'));assert.equal(new Set(pairs.slice(0,15)).size,15);assert.equal(new Set(pairs.slice(15)).size,15);for(const q of shown)assert(C.isCorrect(q,['a','f']));});

test('multi-concept and Musical Features partial marks can extend the streak without increasing the score',()=>{
 const state={correct:5,attempted:8,streak:9,best:9};
 const mark=(format,earned,available)=>P.markPractice(state,earned===available,C.continuesPracticeStreak({format},{earned,available}));
 for(const [format,minimum,available] of [
  ['audio-select-2',1,2],['audio-select-3',2,3],['audio-select-4',2,4],
  ['musical-features',3,5],['musical-features',3,6],['musical-features',4,8]
 ]){
  const partial=mark(format,minimum,available);
  assert.deepEqual(partial,{correct:5,attempted:9,streak:10,best:10});
  assert.equal(P.earnedMedal(partial.streak),'bronze');
  assert.deepEqual(mark(format,minimum-1,available),{correct:5,attempted:9,streak:0,best:9});
  assert.deepEqual(mark(format,0,available),{correct:5,attempted:9,streak:0,best:9});
  assert.deepEqual(mark(format,available,available),{correct:6,attempted:9,streak:10,best:10});
 }
 assert.deepEqual(mark('multi-select',1,2),{correct:5,attempted:9,streak:0,best:9});
});

test('worksheet generation takes the requested number of printable questions from the cycle',()=>{
 const questions=Array.from({length:72},(_,index)=>({id:'q'+index,modality:index%4===0?'audio':'text'}));
 const printable=questions.filter(question=>question.modality==='text');
 assert.deepEqual(P.prepareWorksheetQuestions(questions),printable.slice(0,10));
 assert.deepEqual(P.prepareWorksheetQuestions(questions,50),printable.slice(0,50));
 assert.deepEqual(P.prepareWorksheetQuestions(questions.slice(0,9),50),printable.slice(0,6));
 assert.equal(questions.length,72);
});
