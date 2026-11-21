/* Ongoing collection practice: exhaust the pool before starting another cycle. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('../shared/concept-level-priority'));else root.MusicDictionaryQuizPractice=factory(root.MLHConceptLevelPriority);})(globalThis,function(prioritise){
'use strict';
const thresholds=[10,15,20,30],tiers=['bronze','silver','gold','diamond'];
function shuffled(ids,random){
 const order=[...ids];
 for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 return order;
}
// Spread related prompts through a cycle without repeating or dropping questions.
function questionOrder(ids,questions,random,previousId,level){
 const byId=new Map(questions.map(q=>[q.id,q])),order=[],counts=new Map();
 const remaining=shuffled(new Set(ids),random).map(id=>{
  const q=byId.get(id);
  return {id,conceptId:q?.conceptId,factGroupId:q?.factGroupId,src:q?.media?.src};
 });
 let previous=byId.get(previousId);
 while(remaining.length){
  let best=0,bestPenalty=Infinity,bestCount=Infinity;
  for(let i=0;i<remaining.length;i++){
   const entry=remaining[i];
   let penalty=entry.id===previousId?8:0;
   if(previous){
    if(entry.conceptId===previous.conceptId)penalty+=4;
    if(entry.factGroupId&&entry.factGroupId===previous.factGroupId)penalty+=2;
    if(entry.src&&entry.src===previous.media?.src)penalty+=1;
   }
   const count=counts.get(entry.conceptId)||0;
   if(penalty<bestPenalty||(penalty===bestPenalty&&count<bestCount)){
    best=i;bestPenalty=penalty;bestCount=count;
    if(penalty===0&&count===0)break;
   }
  }
  const [entry]=remaining.splice(best,1);
  order.push(entry.id);
  previous=byId.get(entry.id);previousId=entry.id;
  counts.set(entry.conceptId,bestCount+1);
 }
 if(!level||level==='ALL')return order;
 return prioritise(order,id=>byId.get(id)?.levelCode===level);
}
// Shuffle only the displayed options; retain the teacher's stored text and IDs.
function createChoicePreparer(random=Math.random){
 const bags=new Map();
 const audioOrder=typeof module==='object'&&module.exports?require('./quiz-audio-order.js'):globalThis.MusicDictionaryQuizAudioOrder;
 function combinations(n,k,start=0,prefix=[],out=[]){if(!k){out.push(prefix);return out;}for(let i=start;i<=n-k;i++)combinations(n,k-1,i+1,[...prefix,i],out);return out;}
 return original=>{const q=original.generator?audioOrder.realise(original,random):original;if(!q.options)return q;if(q.format==='order'){const options=shuffled(q.options,random);if(options.every((o,i)=>o.id===q.answer.correctOptionIds[i]))options.push(options.shift());return {...q,options:q.modality==='audio'?options.map((o,i)=>({...o,text:'Example '+String.fromCharCode(65+i)})):options};}const ids=new Set(q.answer.correctOptionIds),correct=shuffled(q.options.filter(o=>ids.has(o.id)),random),wrong=shuffled(q.options.filter(o=>!ids.has(o.id)),random),key=q.options.length+'/'+correct.length;let bag=bags.get(key);if(!bag?.length){bag=shuffled(combinations(q.options.length,correct.length),random);bags.set(key,bag);}const positions=new Set(bag.pop());return {...q,options:q.options.map((_,i)=>positions.has(i)?correct.shift():wrong.shift())};};
}
const prepareChoices=(questions,random)=>questions.map(createChoicePreparer(random));
function prepareWorksheetQuestions(questions,count=10,random=Math.random){
 return prepareChoices(questions.filter(question=>question.modality!=='audio').slice(0,count),random);
}
function startCycle(ids,random=Math.random,questions=[],level){return {order:questions.length?questionOrder(ids,questions,random,undefined,level):shuffled(new Set(ids),random),at:0,cycle:0};}
function advanceCycle(state,random=Math.random,questions=[],level){
 if(state.at+1<state.order.length)return {...state,at:state.at+1};
 const order=questions.length?questionOrder(state.order,questions,random,state.order[state.at],level):shuffled(state.order,random);
 if(order.length>1&&order[0]===state.order[state.at])[order[0],order[1]]=[order[1],order[0]];
 return {order,at:0,cycle:state.cycle+1};
}
function collectionIdentity(config,collections){
 const {level,collectionId:id}=config;
 const validLevel=['N3','N4','N5','H','AH','ALL'].includes(level);
 const defaultId=validLevel&&(level==='ALL'?'all-concepts':'level-'+level.toLowerCase());
 const ids=[...new Set(config.concepts||[])].sort();
 const collection=collections.find(group=>group.id===defaultId);
 const expected=[...new Set(collection?.conceptIds||[])].sort();
 const medalEligible=config.defaultLevelQuiz===true&&!config.savedCollectionId&&id===defaultId&&
  expected.length>0&&ids.length===expected.length&&ids.every((value,i)=>value===expected[i]);
 return {medalEligible,scope:medalEligible?id:'custom:'+JSON.stringify([config.name||'',ids]),activity:medalEligible?'conceptquiz-'+level.toLowerCase()+'-'+id+'.html':null};
}
function earnedMedal(streak,eligible=true){const i=thresholds.indexOf(streak);return eligible&&i>=0?tiers[i]:null;}
function markPractice(state,correct,continuesStreak=correct){const streak=continuesStreak?state.streak+1:0;return {correct:state.correct+(correct?1:0),attempted:state.attempted+1,streak,best:Math.max(state.best,streak)};}
return {questionOrder,createChoicePreparer,prepareChoices,prepareWorksheetQuestions,thresholds,tiers,startCycle,advanceCycle,collectionIdentity,earnedMedal,markPractice};
});
