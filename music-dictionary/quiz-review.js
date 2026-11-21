/* Editable Music Dictionary question bank. */
(function(){
'use strict';
const literacy=new URLSearchParams(location.search).get('bank')==='literacy'?window.MLHMusicLiteracyQuiz:null;
const h=React.createElement,C=window.MusicDictionaryQuizCore,B=literacy?.bank||window.MUSIC_DICTIONARY_QUIZ_BANK;
const D=literacy?{levels:window.MUSIC_CONCEPTS.levels,concepts:B.concepts}:window.MUSIC_CONCEPTS;
if(!B||!D||!C){document.getElementById('root').textContent='Dictionary quiz questions could not load. Refresh the page to try again.';return;}
const levelCodes=['N3','N4','N5','H','AH'],dict=new Map(D.concepts.map(c=>[c.id,c])),baseById=new Map(B.questions.map(q=>[q.id,q]));
const storageKey=literacy?.storageKey||'mlh-concept-quiz-reviews-v1';
const formatLabel=f=>({'multiple-choice':'Multiple Choice','short-answer':'Short Answer','complete-statement':'Complete the statement','multi-select':'Selection','order':'Order'}[f]);
function GrowingTextarea({value,onChange,...props}){
 const ref=React.useRef(null);
 const fit=()=>{const el=ref.current;if(!el)return;el.style.height='auto';el.style.height=(el.scrollHeight+el.offsetHeight-el.clientHeight)+'px';};
 React.useLayoutEffect(fit,[value]);
 React.useEffect(()=>{const el=ref.current;if(!window.ResizeObserver)return;let width=el.getBoundingClientRect().width;const observer=new ResizeObserver(()=>{const next=el.getBoundingClientRect().width;if(next!==width){width=next;fit();}});observer.observe(el);return()=>observer.disconnect();},[]);
 return h('textarea',{...props,ref,value,className:'cq-textarea cq-autogrow',onChange});
}
function RichPrompt({value,onChange}){
 const ref=React.useRef(null),last=React.useRef(null);
 React.useLayoutEffect(()=>{
  if(last.current!==value){ref.current.innerHTML=C.promptHtml(value);last.current=value;}
 },[value]);
 return h('div',{id:'cq-prompt',ref,className:'cq-textarea cq-rich-prompt',role:'textbox','aria-label':'Question','aria-multiline':true,tabIndex:0,contentEditable:true,suppressContentEditableWarning:true,
  onInput:e=>{const text=e.currentTarget.innerText.replace(/\r\n/g,'\n');last.current=text;onChange(text);},
  onBlur:e=>{e.currentTarget.innerHTML=C.promptHtml(value);},
  onPaste:e=>{e.preventDefault();const text=e.clipboardData.getData('text/plain');const selection=window.getSelection();if(!selection.rangeCount)return;const range=selection.getRangeAt(0);if(!e.currentTarget.contains(range.commonAncestorContainer))return;range.deleteContents();const node=document.createTextNode(text);range.insertNode(node);range.setStartAfter(node);range.collapse(true);selection.removeAllRanges();selection.addRange(range);const next=e.currentTarget.innerText.replace(/\r\n/g,'\n');last.current=next;onChange(next);}
 });
}
function App({onExit}){
 const requested=new URLSearchParams(location.search).get('level');
 const viewKey=literacy?'mlh-literacy-quiz-review-view-v1':'mlh-concept-quiz-review-view-v1';
 const [restoredView]=React.useState(()=>{try{const value=JSON.parse(sessionStorage.getItem(viewKey)||'null');return value&&value.routeLevel===(levelCodes.includes(requested)?requested:'ALL')?value:null;}catch{return null;}});
 const [level,setLevel]=React.useState(restoredView?.level||(levelCodes.includes(requested)?requested:'ALL')),[scope,setScope]=React.useState('only'),[format,setFormat]=React.useState('ALL'),[search,setSearch]=React.useState(''),[modality,setModality]=React.useState('ALL');
 const [records,setRecords]=React.useState(new Map()),[ready,setReady]=React.useState(false),[selected,setSelected]=React.useState(restoredView?.conceptId||null),[questionId,setQuestionId]=React.useState(restoredView?.questionId||null),[form,setForm]=React.useState(null),[dirty,setDirty]=React.useState(false),[message,setMessage]=React.useState(''),[pendingImport,setPendingImport]=React.useState(null),[busy,setBusy]=React.useState(false);
 const formRef=React.useRef(null),recordsRef=React.useRef(records),dirtyRef=React.useRef(false),editVersion=React.useRef(0),saving=React.useRef(null);
 recordsRef.current=records;
 const upload=React.useRef(null),storageFailed=React.useRef(false),recoveryFile=React.useRef(null);
 React.useEffect(()=>{let active=true;(async()=>{try{const raw=localStorage.getItem(storageKey);if(raw){recoveryFile.current=raw;const stored=JSON.parse(raw);if(stored.schemaVersion!=='1.0-concept-quiz-reviews')throw new Error('Unrecognised stored review format.');const saved=await C.applyReviews(B,stored.records);if(active)setRecords(saved);} }catch(e){storageFailed.current=true;if(active)setMessage('Saved reviews could not be loaded. Export a recovery copy before replacing them. '+e.message);}finally{if(active)setReady(true);}})();return()=>{active=false;};},[]);
 React.useEffect(()=>{const f=e=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',f);return()=>window.removeEventListener('beforeunload',f);},[dirty]);
 const effective=B.questions.filter(q=>!records.get(q.id)?.deleted).map(q=>records.get(q.id)?.question||q),effectiveById=new Map(effective.map(q=>[q.id,q]));
 const levelQuestions=effective.filter(q=>level==='ALL'||q.levelCode===level),audioCount=levelQuestions.filter(q=>q.modality==='audio').length;
 const needle=search.trim().toLowerCase();
 const questionMatches=q=>(modality==='ALL'||q.modality===modality)&&(format==='ALL'||q.format===format)&&(!needle||[dict.get(q.conceptId)?.name,q.prompt,q.id,q.objective].some(s=>String(s).toLowerCase().includes(needle)));
 const conceptInRange=conceptId=>{const c=dict.get(conceptId);const rank=D.levels.indexOf(c.level);return level==='ALL'||(scope==='through'?rank<=levelCodes.indexOf(level):rank===levelCodes.indexOf(level));};
 const visible=B.coverage.filter(row=>{const c=dict.get(row.conceptId);const rank=D.levels.indexOf(c.level);if(level!=='ALL'&&(scope==='through'?rank>levelCodes.indexOf(level):rank!==levelCodes.indexOf(level))&&!effective.some(q=>q.conceptId===c.id&&q.format==='order'&&q.levelCode===level))return false;const qs=effective.filter(q=>q.conceptId===c.id);if(!qs.length)return format==='ALL'&&(!needle||c.name.toLowerCase().includes(needle));return qs.some(questionMatches);});
 const selectedRow=visible.find(row=>row.conceptId===selected)||visible[0]||null;
 const concept=selectedRow?dict.get(selectedRow.conceptId):null;
 const questions=concept?effective.filter(q=>q.conceptId===concept.id&&questionMatches(q)):[];
 const question=questions.find(q=>q.id===questionId)||questions[0]||null;
 const isFinalised=id=>C.conceptIsFinalised(B,records,id,effective);
 React.useEffect(()=>{if(!ready||!concept)return;try{sessionStorage.setItem(viewKey,JSON.stringify({routeLevel:levelCodes.includes(requested)?requested:'ALL',level,conceptId:concept.id,questionId:question?.id||null}));}catch{}},[ready,level,concept?.id,question?.id]);
 React.useEffect(()=>{if(!ready)return;formRef.current=question?C.copy(question):null;setForm(formRef.current);setQuestionId(question?.id||null);dirtyRef.current=false;setDirty(false);},[question?.id,ready]);
 React.useEffect(()=>{if(!dirty||!ready)return;const timer=setTimeout(()=>save(),500);return()=>clearTimeout(timer);},[form,dirty,ready]);
 async function leave(){return !dirtyRef.current||await save();}
 async function navigate(fn){if(!await leave())return;fn();}
 function chooseConcept(id){navigate(()=>{setSelected(id);setQuestionId(null);});}
 function patch(fn){const q=C.copy(formRef.current);fn(q);formRef.current=q;editVersion.current++;dirtyRef.current=true;setForm(q);setDirty(true);}
 function envelope(next){return {schemaVersion:'1.0-concept-quiz-reviews',bankId:B.bankId,exportedAt:new Date().toISOString(),records:[...next.values()]};}
 async function persist(next){
  if(storageFailed.current)throw new Error('Saved reviews need recovery first. Export the recovery copy, then reload or import a reconciled review.');
  const raw=localStorage.getItem(storageKey),stored=raw?JSON.parse(raw):null;
  const merged=stored?await C.applyReviews(B,stored.records):new Map();
  // Only replace this tab's changed records, preserving edits saved in another tab.
  for(const [id,item] of next)if(!records.has(id)||C.stable(records.get(id))!==C.stable(item))merged.set(id,item);
  try{localStorage.setItem(storageKey,JSON.stringify(envelope(merged)));}catch(e){throw new Error('This browser could not save the review. Export your current review before closing; your edit is still on screen.');}
  recordsRef.current=merged;setRecords(merged);
 }

 async function save(){
  if(saving.current){const ok=await saving.current;return ok&&dirtyRef.current?save():ok;}
  if(!formRef.current||!dirtyRef.current)return true;
  const snapshot=C.copy(formRef.current),version=editVersion.current;
  setBusy(true);
  saving.current=(async()=>{try{
   const old=recordsRef.current.get(snapshot.id)?.question||baseById.get(snapshot.id);
   snapshot.review={...snapshot.review};
   if(old.review?.finalisedAt)snapshot.review.finalisedAt=old.review.finalisedAt;else delete snapshot.review.finalisedAt;
   const saved=await C.saveQuestion(old,snapshot),next=new Map(recordsRef.current);
   next.set(snapshot.id,{id:snapshot.id,baseContentSha256:baseById.get(snapshot.id).contentSha256,question:saved});
   await persist(next);
   if(editVersion.current===version){dirtyRef.current=false;setDirty(false);setMessage('');}
   return true;
  }catch(e){setMessage('Your changes could not be saved. '+e.message);return false;}})();
  const result=await saving.current;saving.current=null;setBusy(false);return result;
 }
 async function finaliseConcept(checked){
  if(busy||!ready||!concept)return;
  if(!await leave())return;
  setBusy(true);
  try{
   const next=new Map(recordsRef.current),stamp=new Date().toISOString();
   next.set('concept:'+concept.id,{kind:'concept-review',id:'concept:'+concept.id,conceptId:concept.id,finalisedAt:checked?stamp:null,excludeFromGeneration:checked&&!effective.some(q=>q.conceptId===concept.id),updatedAt:stamp});
   for(const question of effective.filter(q=>q.conceptId===concept.id)){
    const edited=C.copy(form?.id===question.id?form:question);
    edited.review={...edited.review};
    if(checked)edited.review.finalisedAt=stamp;else delete edited.review.finalisedAt;
    const saved=await C.saveQuestion(question,edited);
    next.set(question.id,{id:question.id,baseContentSha256:baseById.get(question.id).contentSha256,question:saved});
   }
   await persist(next);if(formRef.current){const saved=next.get(formRef.current.id)?.question;if(saved){formRef.current=C.copy(saved);setForm(formRef.current);}}dirtyRef.current=false;setDirty(false);setMessage('');
  }catch(e){setMessage(e.message);}finally{setBusy(false);}
 }
 async function removeQuestion(){
  if(!form||busy||!ready||!await leave()||!window.confirm('Delete this question? It will be removed from the question bank and quizzes.'))return;
  try{const next=new Map(records);next.set(form.id,{id:form.id,baseContentSha256:baseById.get(form.id).contentSha256,deleted:true,deletedAt:new Date().toISOString()});await persist(next);setDirty(false);setMessage('');}catch(e){setMessage(e.message);}
 }
 function download(value,name){const blob=new Blob([typeof value==='string'?value:JSON.stringify(value,null,2)+'\n'],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
 // Maintenance-only backup route; the ordinary editor has no Export control.
 async function exportReviews(){if(!await leave())return;try{const raw=localStorage.getItem(storageKey),latest=raw?await C.applyReviews(B,JSON.parse(raw).records):records;download(envelope(latest),'dictionary-quiz-reviews.json');}catch(e){setMessage(e.message);}}
 async function inspectImport(file){if(!file)return;if(dirty){setMessage('Save or discard your question edits before importing.');return;}try{if(file.size>15000000)throw new Error('The review file is too large.');const data=JSON.parse(await file.text());if(data.schemaVersion!=='1.0-concept-quiz-reviews'||data.bankId!==B.bankId)throw new Error('Choose a Dictionary quiz review export from this bank.');const incoming=await C.applyReviews(B,data.records);let conflicts=0;for(const [id,item] of incoming){if(records.has(id)&&C.stable(records.get(id))!==C.stable(item))conflicts++;}setPendingImport({incoming,conflicts});setMessage('');}catch(e){setMessage('Import stopped: '+e.message);}finally{if(upload.current)upload.current.value='';}}
 async function confirmImport(){try{const next=new Map(records);for(const [id,item] of pendingImport.incoming)next.set(id,item);if(storageFailed.current){localStorage.setItem(storageKey,JSON.stringify(envelope(next)));storageFailed.current=false;setRecords(next);}else await persist(next);if(formRef.current){const updated=next.get(formRef.current.id)?.question;if(updated){formRef.current=C.copy(updated);setForm(formRef.current);}}dirtyRef.current=false;setPendingImport(null);setDirty(false);setMessage('');}catch(e){setMessage('Import stopped: '+e.message);}}
 const field=(id,label,element)=>h('div',{className:'cq-form-row',key:id},h('label',{className:'cq-label',htmlFor:id},label),element);
 const filter=(id,label,value,options,fn)=>h('div',{className:'cq-field'},h('label',{htmlFor:id},label),h('select',{id,value,onChange:e=>{const value=e.target.value;navigate(()=>fn(value));}},options.map(([v,l])=>h('option',{value:v,key:v},l))));
 const body=h('main',{className:'cq-main'},
 storageFailed.current&&h('div',{className:'cq-alert'},'The existing saved review has been preserved. ',h('button',{className:'cq-button',onClick:()=>download(recoveryFile.current,'dictionary-quiz-review-recovery.json')},'Export recovery copy')),
 h('div',{className:'cq-toolbar cq-review-toolbar'},filter('cq-level','Level',level,[['ALL','All levels'],...levelCodes.map((code,i)=>[code,D.levels[i]])],setLevel),
  literacy&&h('button',{className:'cq-button primary',disabled:!ready||busy||!levelQuestions.length,onClick:()=>navigate(()=>{location.href='./conceptquiz.html?'+new URLSearchParams({level,literacyQuiz:'1'});})},'Play Music Literacy')),
 h('section',{className:'cq-stats cq-review-stats','aria-label':(level==='ALL'?'All levels':D.levels[levelCodes.indexOf(level)])+' question totals'},[['Total Questions',levelQuestions.length],['Audio Questions',audioCount],['Non-Audio Questions',levelQuestions.length-audioCount]].map(([label,count])=>h('div',{className:'cq-stat',key:label},h('strong',null,ready?count:'–'),h('span',null,label)))),
 new URLSearchParams(location.search).get('exportEdits')==='1'&&h('button',{className:'cq-button',disabled:!ready||busy,onClick:exportReviews},'Download review backup'),
 message&&h('p',{className:'cq-live',role:'alert','aria-live':'assertive'},message),
 pendingImport&&h('section',{className:'cq-import','aria-label':'Confirm review import'},h('p',null,`Import ${pendingImport.incoming.size} reviews? ${pendingImport.conflicts?pendingImport.conflicts+' existing browser reviews will be replaced.':'Other saved reviews will be kept.'}`),h('div',{className:'cq-actions'},h('button',{className:'cq-button primary',onClick:confirmImport},'Import reviews'),h('button',{className:'cq-button',onClick:()=>setPendingImport(null)},'Cancel'))),
 h('div',{className:'cq-workspace'},h('aside',{className:'cq-sidebar','aria-label':'Concepts to review'},h('div',{className:'cq-concepts'},[...visible].sort((a,b)=>{return Number(isFinalised(a.conceptId))-Number(isFinalised(b.conceptId));}).map(row=>{const c=dict.get(row.conceptId);const qs=effective.filter(q=>q.conceptId===c.id);return h('button',{className:'cq-concept'+(isFinalised(c.id)?' is-finalised':''),key:c.id,'aria-pressed':concept?.id===c.id,onClick:()=>chooseConcept(c.id)},h('strong',null,c.name),h('small',null,levelCodes[D.levels.indexOf(c.level)]+' · '+(qs.length?(qs.length===1?'1 question':qs.length+' questions'):'0 questions')));}))),
 h('section',{className:'cq-panel','aria-label':'Question editor'},!concept?h('p',{className:'cq-empty'},'No concepts are available at this level.'):h(React.Fragment,null,h('div',{className:'cq-panel-head'},h('div',{className:'cq-panel-head-row'},h('div',{className:'cq-panel-head-info'},h('h2',null,concept.name),h('p',{className:'cq-muted'},concept.level+' · '+concept.categories.join(', '))),h('label',{className:'cq-finalise'},h('input',{type:'checkbox',checked:isFinalised(concept.id),disabled:busy||!ready,'aria-label':'Read and finalised '+concept.name,onChange:e=>finaliseConcept(e.target.checked)}),'Read and finalised')),questions.length>0&&h('div',{className:'cq-question-tabs',role:'group','aria-label':'Question candidates'},questions.map((q,i)=>h('button',{className:'cq-question-tab',key:q.id,'aria-pressed':question?.id===q.id,onClick:()=>navigate(()=>setQuestionId(q.id))},h('span',{className:'cq-tab-title'},'Question '+(i+1),q.modality==='audio'&&h('img',{className:'cq-tab-audio',src:'./ui-icons/audio-svgrepo-com.svg?v=20260722-smaller15',alt:'Audio Question'})),h('span',{className:'cq-tab-format'},formatLabel(q.format)))))),
 !question?h('div',{className:'cq-empty'},h('h3',{className:'cq-heading-small'},'Coverage decision'),h('p',null,C.conceptReview(B,records,concept.id)?.excludeFromGeneration?'No questions. This concept is finalised, so no new questions will be generated.':!effective.some(q=>q.conceptId===concept.id)?'No questions for this concept.':selectedRow.reason||'No separate text question is recommended.'),selectedRow.sharedQuestionIds?.length>0&&h('p',null,'Shared questions: ',selectedRow.sharedQuestionIds.map(id=>{const linked=effectiveById.get(id);return linked?h('button',{className:'cq-button',key:id,onClick:()=>navigate(()=>{setLevel(linked.levelCode);setScope('only');setFormat('ALL');setSearch('');setSelected(linked.conceptId);setQuestionId(id);})},'Review shared question · '+linked.levelCode):id;}))):
 form&&form.id===question.id&&h('div',{className:'cq-panel-body'},
 form.modality==='audio'&&form.format!=='order'&&h(window.MusicDictionaryQuizAudio,{key:form.id,question:form,review:true}),
 literacy&&h(window.MusicDictionaryQuizPicture,{question:form}),
 field('cq-prompt','Question',h(RichPrompt,{key:form.id,value:form.prompt,onChange:value=>patch(q=>{q.prompt=value;})})),
 form.referenceMedia&&h(window.MusicDictionaryQuizOrderAudio,{media:form.referenceMedia,label:'Original Motif'}),
 form.format==='order'?h('fieldset',null,h('legend',{className:'cq-label'},'Correct order'),form.answer.correctOptionIds.map((id,index)=>h('div',{className:'cq-option',key:id},h('label',null,index+1),form.modality==='audio'&&h(window.MusicDictionaryQuizOrderAudio,{media:form.options.find(o=>o.id===id).media,label:'Example '+(index+1)}),h('input',{className:'cq-input','aria-label':'Order item '+(index+1),value:(form.options.find(o=>o.id===id)?.answerLabel||form.options.find(o=>o.id===id)?.text||''),onChange:e=>patch(q=>{const option=q.options.find(o=>o.id===id);if(q.modality==='audio')option.answerLabel=e.target.value;else option.text=e.target.value;})}),h('button',{className:'cq-button',disabled:index===0,'aria-label':'Move correct item '+(index+1)+' up',onClick:()=>patch(q=>{const a=q.answer.correctOptionIds;[a[index],a[index-1]]=[a[index-1],a[index]];})},'↑'),h('button',{className:'cq-button',disabled:index===form.options.length-1,'aria-label':'Move correct item '+(index+1)+' down',onClick:()=>patch(q=>{const a=q.answer.correctOptionIds;[a[index],a[index+1]]=[a[index+1],a[index]];})},'↓')))):
 form.options?h('fieldset',null,h('legend',{className:'cq-label'},form.format==='multi-select'?'Options — tick every correct answer':'Options — tick the correct answer'),form.options.map((o,i)=>h('div',{className:'cq-option',key:o.id},h('label',{htmlFor:'cq-option-'+o.id},String.fromCharCode(65+i)),h('input',{id:'cq-option-'+o.id,className:'cq-input','aria-label':'Option '+String.fromCharCode(65+i),value:o.text,onChange:e=>patch(q=>{q.options[i].text=e.target.value;})}),h('label',{className:'cq-check'},h('input',{type:'checkbox',checked:form.answer.correctOptionIds.includes(o.id),'aria-label':'Option '+String.fromCharCode(65+i)+' is correct',onChange:e=>patch(q=>{if(q.format==='multiple-choice')q.answer.correctOptionIds=e.target.checked?[o.id]:[];else q.answer.correctOptionIds=e.target.checked?[...q.answer.correctOptionIds,o.id]:q.answer.correctOptionIds.filter(id=>id!==o.id);})}),'Correct')))):
 h(React.Fragment,null,field('cq-variants','Accepted Answers',h(GrowingTextarea,{id:'cq-variants',value:form.answer.acceptedVariants.join('\n'),onChange:e=>patch(q=>{q.answer.acceptedVariants=e.target.value.split('\n');})}))),
 field('cq-feedback','Feedback',h('textarea',{id:'cq-feedback',className:'cq-textarea',value:form.feedback,onChange:e=>patch(q=>{q.feedback=e.target.value;})})),
 h('div',{className:'cq-review-actions'},h('div',{className:'cq-actions'},h('button',{className:'cq-button cq-delete-question',disabled:busy||!ready,onClick:removeQuestion},'Delete')))))))
 );
 return h('div',{className:window.MLH.shell.pageShellClass},h(window.MLH.AppHeader,{icon:'./app-icons/concept-quiz-icon.svg',title:literacy?'Music Literacy Questions':'Concept Quizzes',subtitle:literacy?'Review and edit the Music Literacy questions.':'Quick questions to strengthen your musical knowledge.',profileUsesSharedSettings:false,profileShowLabel:false,profileShareDisabled:true},h('button',{className:'cq-button',onClick:async()=>{if(await leave())onExit();}},'Back')),h('div',{className:window.MLH.shell.pageContentClass},body));
}
if(!B||!D||!C){document.getElementById('root').textContent='Dictionary quiz questions could not load. Refresh the page to try again.';return;}
window.MusicDictionaryQuizReview=App;
})();
