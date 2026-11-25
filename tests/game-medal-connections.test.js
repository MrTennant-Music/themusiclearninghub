'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Babel=require('@babel/standalone');
const read=path=>fs.readFileSync(path,'utf8');
function store(initial={}){
 const values=new Map(Object.entries(initial).map(([key,value])=>[key,JSON.stringify(value)]));
 let writes=0;
 const window={location:{href:'https://hub.test/index.html'},localStorage:{getItem:key=>values.get(key)||null,setItem:(key,value)=>{writes++;values.set(key,value);}},addEventListener(){},dispatchEvent(){}};
 const context={window,URL,CustomEvent:class{}};
 vm.runInNewContext(read('shared/hub-page-names.js'),context);
 vm.runInNewContext(read('shared/hub-achievements.js'),context);
 return {api:window.MLH.achievements,values,get writes(){return writes;}};
}
function functions(source,name){
 const ast=Babel.packages.parser.parse(source,{plugins:['jsx']});let result;
 Babel.packages.traverse.default(ast,{FunctionDeclaration(path){if(path.node.id.name===name)result=source.slice(path.node.start,path.node.end);}});
 assert.ok(result,name);return result;
}
test('completion medals persist their actual tier, with no invented streak and no downgrade',()=>{
 const {api}=store();api.award('conceptrecall.html','H','gold');
 assert.equal(api.get('conceptrecall.html','H').tier,'gold');assert.equal(api.get('conceptrecall.html','H').bestStreak,0);
 api.award('conceptrecall.html','H','bronze');assert.equal(api.get('conceptrecall.html','H').tier,'gold');
 api.award('conceptrecall.html','bogus','diamond');api.award('conceptrecall.html','N3','unknown');
 assert.deepEqual({...api.totals()},{bronze:0,silver:0,gold:1,diamond:0});
});
test('saved game awards migrate once, preserving aliases and rejecting ambiguous question positions',()=>{
 const input={'mlh-concept-recall-v1':{version:1,records:{H:{bestMedal:'gold'}}},'mlh-millionaire-performance-v1':{N5:{bestAmount:1000},N3:{bestWinMs:45000},AH:{highestQuestion:15}}};
 const h=store(input),{api}=h;
 assert.equal(api.get('conceptrecall.html','H').tier,'gold');assert.equal(api.get('whowantstobeamillionaire.html','N5').tier,'silver');
 assert.equal(api.get('whowantstobeamillionaire.html','N3').tier,'diamond');assert.equal(api.get('whowantstobeamillionaire.html','AH'),null);
 assert.deepEqual({...api.totals()},{bronze:0,silver:1,gold:1,diamond:1});
 const restored=store(Object.fromEntries([...h.values].map(([key,value])=>[key,JSON.parse(value)])));
 assert.equal(restored.writes,0);assert.deepEqual({...restored.api.totals()},{bronze:0,silver:1,gold:1,diamond:1});
});
test('Concept Recall only exports an existing eligible result medal',()=>{
 const page=read('conceptrecall.html'),source=[...page.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('function finishGame('));
 const fn=functions(source,'finishGame');
 for(const [standardGame,medalEligible,medal,expected]of [[true,true,'gold',1],[false,false,null,0],[false,true,'gold',0],[true,false,'gold',0],[true,true,null,0]]){
  const calls=[],noop=()=>{};
  const context={CORE:{elapsedMilliseconds:()=>45000,createResult:()=>({level:'H',standardGame,medalEligible,medal})},finishLockRef:{current:false},answeredRef:{current:new Set()},timerRef:{current:{durationMs:600000}},activeLevel:'H',activeQuestions:[],standardGame,medalEligible,commitTimer:noop,setResult:noop,setGameState:noop,setResultsOpen:noop,setAnswerInput:noop,setPersistence:noop,playCompletionChime:noop,window:{location:{pathname:'/conceptrecall.html'},MLH:{achievements:{award:(...args)=>calls.push(args)}},setTimeout:noop}};
  vm.runInNewContext(fn+';finishGame()',context);assert.equal(calls.length,expected);
 }
});
test('Millionaire exports medals at its existing milestones and only for eligible whole-level games',async()=>{
 const fn=functions(read('whowantstobemillionaire/millionaire.js'),'handleCorrectAnswer');
 for(const medalEligible of [true,false])for(const [stage,tier]of [[3,'bronze'],[5,'silver'],[10,'gold'],[15,'diamond']]){
  const calls=[],noop=()=>{};
  const context={currentIndex:stage-1,correctCount:stage-1,medalEligible,settings:{level:'AH'},gameOperation:{current:1},QUESTION_REWARDS:{[stage]:{tier}},CORE:{PRIZE_LADDER:Array(15).fill(100),formatPrize:String},setCorrectRevealSkippable:noop,setCorrectCount:noop,setAnnouncement:noop,setOutcome:noop,setFinalPrize:noop,setHighestReached:noop,setMilestone:noop,setScreen:noop,goToQuestion:noop,audioDirector:{current:{playOutcome:async()=>{}}},window:{location:{pathname:'/whowantstobemillionaire/whowantstobeamillionaire.html'},MLH:{achievements:{award:(...args)=>calls.push(args)}}}};
  await vm.runInNewContext(fn+';handleCorrectAnswer({})',context);assert.equal(calls.length,medalEligible?1:0);
  if(medalEligible)assert.equal(calls[0][2],tier);
 }
});

test('sort completion awards the correct app using submission time, excluding answer-reveal time',()=>{
 const finish=functions(read('music-games/session.jsx'),'finish');
 for(const [correct,elapsedMs,expected]of [[12,20000,'diamond'],[12,30000,'gold'],[12,40000,'silver'],[12,60000,'bronze'],[12,60001,null],[11,1000,null]]){
  const calls=[],values=new Map(),noop=()=>{};let result;
  const context={ended:{current:false},active:true,playGameCue:noop,submittedElapsed:{current:elapsedMs},performance:{now:()=>999999},start:{current:0},setElapsedMs:noop,options:{timer:0},mode:'group-sort',simpleGameControls:true,connectionScore:null,activity:{id:'sort-a',level:'N5',tags:['generated-sort'],sortRecipe:{type:'elements'}},muted:true,localStorage:{getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)},window:{MLHGameMedals:require('../shared/music-games-medals'),MLH:{achievements:{award:(...args)=>calls.push(args)}}},setResult:value=>result=value,setHeaderProgress:noop};
  vm.runInNewContext(finish+';finish({correct:'+correct+',total:12})',context);
  assert.equal(result.medal,expected);
  assert.deepEqual(calls,expected?[['conceptsort.html','N5',expected]]:[]);
  vm.runInNewContext('finish({correct:12,total:12})',context);
  assert.equal(calls.length,expected?1:0,'Repeated completion must not award again');
 }
});

test('fresh All sessions suppress repeat awards and sounds while permitting a higher medal',()=>{
 const finish=functions(read('music-games/session.jsx'),'finish'),calls=[],values=new Map();let celebrations=0;
 function complete(id,elapsedMs){
  const noop=()=>{};let result;
  const context={ended:{current:false},active:true,playGameCue:noop,submittedElapsed:{current:elapsedMs},performance:{now:()=>999999},start:{current:0},setElapsedMs:noop,options:{timer:0},mode:'group-sort',simpleGameControls:true,connectionScore:null,activity:{id,level:'N3',tags:['random-group-sort']},muted:false,medalSoundTimer:{current:null},localStorage:{getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)},window:{setTimeout(){celebrations++;return 1;},MLHGameMedals:require('../shared/music-games-medals'),MLH:{achievements:{award:(...args)=>calls.push(args)}}},setResult:value=>result=value,setHeaderProgress:noop};
  vm.runInNewContext(finish+';finish({correct:12,total:12})',context);return result;
 }
 assert.equal(complete('first-board',40000).medal,'silver');
 const repeated=complete('fresh-board',35000);
 assert.equal(repeated.medal,null);assert.equal(repeated.medalAlreadyEarned,true);
 assert.equal(calls.length,1);assert.equal(celebrations,1);
 assert.equal(complete('faster-board',30000).medal,'gold');
 assert.equal(calls.length,2);assert.equal(celebrations,2);
});
