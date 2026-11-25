/* Answer controls shared by individual practice and classroom quizzes. */
(function(){
'use strict';
const h=React.createElement,C=window.MusicDictionaryQuizCore;
const answered=value=>Array.isArray(value)?value.length>0:typeof value==='string'&&value.trim().length>0;
const optionLayout=q=>({'multi-select':' is-tick-two','audio-select-2':' is-tick-two','audio-select-3':' is-tick-three','audio-select-4':' is-tick-four'}[q.format]||'');
function OrderAnswer({question:q,response,locked,onAnswer,showFeedback,playAudio}){
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
 return h('div',{className:'cq-order-answer',ref:frame},h('div',{className:'cq-order-endpoints','aria-hidden':true},h('span',{className:'cq-order-endpoint is-first'},labels[0]),h('span',{className:'cq-order-endpoint is-last'},labels[1])),h('ol',{className:'cq-order-list','aria-label':'Answer order'},rows.map((id,index)=>h('li',{key:id,'data-quiz-order-item':id,className:'cq-order-item'+(showFeedback?' is-user-'+(q.answer.correctOptionIds[index]===id?'correct':'incorrect'):''),ref:element=>{if(element)elements.current.set(id,element);else elements.current.delete(id);}},h('span',{className:'cq-order-position','aria-hidden':true},index+1),h('div',{className:'cq-order-text'},h('span',null,showFeedback?(q.options.find(o=>o.id===id)?.answerLabel||q.options.find(o=>o.id===id)?.text):q.options.find(o=>o.id===id)?.text),playAudio&&q.modality==='audio'&&h(window.MusicDictionaryQuizOrderAudio,{media:q.options.find(o=>o.id===id).media,label:q.options.find(o=>o.id===id).text})),h('div',{className:'cq-order-arrows'},h('button',{type:'button','aria-label':'Move '+q.options.find(o=>o.id===id)?.text+' up',disabled:locked||index===0,onClick:()=>step(id,-1)},'↑'),h('button',{type:'button','aria-label':'Move '+q.options.find(o=>o.id===id)?.text+' down',disabled:locked||index===rows.length-1,onClick:()=>step(id,1)},'↓'))))));
}

window.MusicDictionaryQuizAnswer=function({question:q,response='',locked=false,showFeedback=locked,revealCorrect=false,playAudio=true,onAnswer,touches={current:{}}}){
 if(q.format==='order')return h(OrderAnswer,{question:q,response,locked,onAnswer,showFeedback,playAudio});
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
  const correct=q.answer.correctOptionIds.includes(o.id);
  const feedbackClass=correct&&(revealCorrect||showFeedback&&selected)?' is-user-correct':
   showFeedback&&selected?' is-user-incorrect':'';
  return h('label',{key:o.id,className:'answer-option'+(selected?' is-selected':'')+feedbackClass},h('input',{type:C.isMultiSelect(q.format)?'checkbox':'radio',name:'quiz-answer-'+q.id,value:o.id,checked:selected,disabled:locked||(C.isMultiSelect(q.format)&&!selected&&Array.isArray(response)&&response.length>=q.answer.correctOptionIds.length),'aria-keyshortcuts':locked?undefined:'Shift+Delete Shift+Backspace',...remove(clear,o.id),onClick:()=>{if(!locked&&selected&&!C.isMultiSelect(q.format))onAnswer('');},onChange:e=>{if(!locked)onAnswer(C.isMultiSelect(q.format)?(e.target.checked?[...(Array.isArray(response)?response:[]),o.id]:(Array.isArray(response)?response:[]).filter(id=>id!==o.id)):o.id);}}),h('span',{className:'answer-option-copy'},o.text,revealCorrect&&correct&&h('span',{className:'sr-only'},', correct answer')));
 })));
 const correct=C.isCorrect(q,response);
 return h('input',{type:'text',className:'text-answer short-answer-line'+(answered(response)?' has-user-answer':'')+(showFeedback?' is-user-'+(correct?'correct':'incorrect'):''),'aria-label':'Your answer',value:response,disabled:locked,'aria-keyshortcuts':locked?undefined:'Shift+Delete Shift+Backspace',...remove(()=>onAnswer('')),onChange:e=>{if(locked)return;let value=e.target.value;if(q.format!=='complete-statement')value=value.replace(/^(\s*)(\p{Ll})/u,(_,space,letter)=>space+letter.toUpperCase());onAnswer(value);},onKeyDown:e=>{if(!locked&&e.key==='Enter')e.currentTarget.closest('.cq-practice')?.querySelector('.cq-practice-submit:not(:disabled)')?.click();else if(!locked&&e.shiftKey&&['Delete','Backspace'].includes(e.key)){e.preventDefault();onAnswer('');}}});
};

function questionPrompt(text){return h('span',{dangerouslySetInnerHTML:{__html:C.promptHtml(text)}});}

function correctAnswer(q){if(q.format==='musical-features')return q.answer.features.map(feature=>feature.name).join('; ');if(q.format==='order')return q.answer.correctOptionIds.map(id=>(q.options.find(o=>o.id===id)?.answerLabel||q.options.find(o=>o.id===id)?.text)).join(' → ');return q.options?q.options.filter(o=>q.answer.correctOptionIds.includes(o.id)).map(o=>o.text).join('; '):q.answer.canonical;}
window.MusicDictionaryQuizQuestionCard=function({question:q,response='',locked=false,showFeedback=locked,onAnswer,touches,picture,audio,reference,playAudio=true}){
 const answer=h(window.MusicDictionaryQuizAnswer,{question:q,response,locked,showFeedback,onAnswer,touches,playAudio});
 const statement=q.format==='complete-statement'?q.prompt.split(/_{2,}/):null;
 const inline=statement?.length===2;
 return h('div',{className:'cq-practice-question-card'},audio,reference,
  h('div',{className:'subquestion-heading'},h('p',{className:'subquestion-heading-question'},
   inline?h('span',{className:'sentence-answer'},statement[0],answer,statement[1]):questionPrompt(q.prompt))),
  picture,!inline&&answer);
};

window.MusicDictionaryQuizQuestionFeedback=function({question:q,response,pending=false,showSolution=false}){
 const features=q.format==='musical-features';
 const mark=features?C.markMusicalFeatures(q,response):C.markQuestion(q,response);
 const correct=mark.earned===mark.available,partial=mark.earned>0&&!correct;
 const credited=new Set(mark.matchedFeatureIds);
 const accepted=features&&h('p',null,h('b',null,'Accepted features: '),q.answer.features.map((feature,index)=>
  h(React.Fragment,{key:feature.id},index>0?'; ':null,
   h('span',{className:credited.has(feature.id)?'cq-credited-feature':undefined},feature.name))));
 const outcome=pending?'incorrect':showSolution?'solution':correct?'correct':partial?'partial':'incorrect';
 return h('aside',{className:'inline-answer-feedback'+(pending?' is-feedback-pending':'')+' is-'+outcome,'aria-hidden':pending?true:undefined,inert:pending?'':undefined},
  !showSolution&&h('div',{className:'inline-feedback-heading',role:pending?undefined:'status'},h('strong',null,!pending&&correct?'Correct':!pending&&partial?'Partially correct':'Incorrect')),
  features?h(React.Fragment,null,!showSolution&&h('p',null,credited.size+' '+(credited.size===1?'feature':'features')+' credited. Minimum required: '+mark.available+'.'),accepted)
   :h(React.Fragment,null,(pending||showSolution||!correct)&&h('p',{className:'inline-correct-answer'},h('b',null,'Answer: '),correctAnswer(q)),h('p',{className:'inline-answer-definition'},q.feedback)));
};
})();
