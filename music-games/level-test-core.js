/* Pure attempt state: one submission per question, absolute deadlines, and
   distinct denominators for fixed-question tests and timed challenges. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'));else root.IGLevelTestCore=factory(root.IGCore);})(typeof globalThis!=='undefined'?globalThis:this,function(C){
 'use strict';
 const modes=['quiz','true-or-false','complete-the-sentence'];
 // Punctuation and accents are not the concept being assessed. Keep word order
 // and full terms significant so an incomplete or different concept still fails.
 const answerKey=value=>C.canonical(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/[’'‘]/g,'').replace(/[-‐‑–—]/g,' ').replace(/[.,!?;:()]/g,' ').replace(/\s+/g,' ').trim();
 const accepts=(item,value)=>(item.correctAnswers?.length?item.correctAnswers:[item.answer]).some(answer=>answerKey(answer)===answerKey(value));
 function settings(config,size){const c=config||{},timed=c.limit==='time',amount=Number(c.amount),minutes=Number(c.minutes);if(!Number.isInteger(size)||size<1)throw Error('This quiz has no questions.');if(!timed&&(!Number.isInteger(amount)||amount<1||amount>size))throw Error('Choose between 1 and '+size+' questions.');if(timed&&(!Number.isFinite(minutes)||minutes<.5||minutes>60))throw Error('Choose a time from 0.5 to 60 minutes.');return {limit:timed?'time':'questions',amount:timed?size:amount,minutes:timed?minutes:0,feedback:c.feedback==='end'?'end':'each',shuffle:c.shuffle!==false};}
 function prepare(activity,config,now=0,random=Math.random){if(!modes.includes(activity.template))throw Error('This format cannot run a level quiz.');const options=settings(config,activity.items.length),items=(options.shuffle?C.shuffle(activity.items,random):activity.items.slice()).slice(0,options.amount);
  const queue=items.map(item=>{const incorrect=(item.distractors||[]).filter(v=>!C.isCorrectAnswer(item,v)),trueStatement=random()<.5,statement=activity.template==='true-or-false'?(trueStatement||!incorrect.length?item.answer:incorrect[Math.floor(random()*incorrect.length)]):null;const expected=statement===null?item.answer:C.isCorrectAnswer(item,statement)?'True':'False';const gaps=activity.template==='complete-the-sentence'?item.clozeGaps||[]:null;const correctValues=gaps?.map(gap=>gap.text);const choices=statement!==null?['True','False']:C.shuffle([...new Map([...(correctValues||[item.answer]),...incorrect].map(v=>[C.canonical(v),v])).values()].slice(0,gaps?10:4),random);return {item,mode:activity.template,statement,expected:gaps?correctValues.join(' · '):expected,choices,...(gaps?{correctValues}:{})};});
  return {options,queue,index:0,responses:[],submitted:false,finished:false,start:now,deadline:options.limit==='time'?now+options.minutes*60000:null};
 }
 function expired(state,now){return state.deadline!==null&&now>=state.deadline;}
 function finish(state,now,timedOut=false){if(state.finished)return state;const records=state.responses.slice(),total=state.options.limit==='time'?records.length:state.queue.length;if(state.options.limit==='questions')for(let i=records.length;i<state.queue.length;i++)records.push({id:state.queue[i].item.id,prompt:state.queue[i].item.prompt,concept:state.queue[i].item.answer,statement:state.queue[i].statement,expected:state.queue[i].expected,answer:'',correct:false,unanswered:true});return {...state,finished:true,timedOut:timedOut||expired(state,now),elapsed:Math.max(0,Math.min(now,state.deadline===null?now:state.deadline)-state.start),result:{correct:state.responses.filter(r=>r.correct).length,total,answered:state.responses.length,available:state.queue.length,records}};}
 function submit(state,value,now){
  if(state.finished||state.submitted)return state;if(expired(state,now))return finish(state,now,true);
  const q=state.queue[state.index],blank=q.mode==='complete-the-sentence';
  if(blank?(!Array.isArray(value)||value.length!==q.correctValues.length||value.some(v=>!String(v||'').trim())||new Set(value).size!==value.length||value.some(v=>!q.choices.includes(v))):!String(value||'').trim())return state;
  const marks=blank?C.gradeCloze(q.item.clozeGaps,value):null;
  const parts=blank?q.correctValues.map((expected,i)=>({expected:marks[i]?value[i]:expected,answer:value[i],correct:marks[i]})):null;
  const correct=blank?parts.every(part=>part.correct):q.mode==='type-the-answer'?accepts(q.item,value):C.canonical(value)===C.canonical(q.expected);
  return {...state,submitted:true,responses:[...state.responses,{id:q.item.id,prompt:q.item.prompt,concept:blank?q.item.clozeText.split(' — ')[0]:q.item.answer,statement:q.statement,expected:q.expected,answer:blank?value.join(' · '):String(value),correct,unanswered:false,...(parts?{parts}:{})}]};
 }

 function next(state,now){if(state.finished)return state;if(expired(state,now))return finish(state,now,true);if(!state.submitted)return state;if(state.index===state.queue.length-1)return finish(state,now);return {...state,index:state.index+1,submitted:false};}
 return Object.freeze({modes,settings,prepare,expired,finish,submit,next});
});
