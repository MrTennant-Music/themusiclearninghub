/* Apply the N3 teacher review's editorial principles to unreviewed N4–AH
 * questions. Curated alternatives are data, not inferred musical facts.
 * Always pass a fresh browser backup; teacher content is never rewritten. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const C=require('../music-dictionary/quiz-core.js'),D=require('../music-dictionary/music-concepts-data.js');
const policy=require('../music-dictionary/quiz-data/upper-level-editorial-policy.json');
const {allowedDistractor,recordingConcepts,audioOverlapErrors}=require('./quiz-distractor-overlap.cjs');
const {distractorScopeErrors}=require('./quiz-distractor-scope.cjs');
const {questionVocabularyErrors}=require('./quiz-question-vocabulary.cjs');
const {focusedPrompt}=require('./quiz-listening-focus.cjs');
const DATA=path.resolve(__dirname,'../music-dictionary/quiz-data'),levels=['N3','N4','N5','H','AH'];
const concepts=new Map(D.concepts.map(c=>[c.id,c]));
const read=name=>JSON.parse(fs.readFileSync(path.join(DATA,name+'.json')));
const rank=(q,id)=>crypto.createHash('sha256').update(q.id+'|'+id).digest('hex');
function protectedQuestion(q,ids){return q.levelCode==='N3'||ids.has(q.id)||Boolean(q.review?.updatedAt||q.review?.finalisedAt);}
function replaceChoices(q,plan){
 const right=q.options.filter(o=>q.answer.correctOptionIds.includes(o.id)),wrong=q.options.filter(o=>!q.answer.correctOptionIds.includes(o.id));
 if(plan.correct.length!==right.length||plan.incorrect.length!==wrong.length)throw new Error('Wrong option count: '+q.id);
 for(const [slots,texts] of [[right,plan.correct],[wrong,plan.incorrect]])slots.forEach((o,i)=>{o.text=texts[i];delete o.conceptId;delete o.editorialRationale;});
 // These are descriptive statements, not claims that each option is a named concept.
 q.relatedConceptIds=[];
}
function reviseText(q){
 const next=C.copy(q),plan=policy.questionOverrides[q.id],multi=policy.multiSelect[q.conceptId];
 if(plan){next.prompt=plan.prompt;replaceChoices(next,plan);if(plan.feedback)next.feedback=plan.feedback;}
 if(q.format==='multi-select'&&multi){
  next.prompt=multi.prompt||'Tick two statements that describe '+concepts.get(q.conceptId).name.toLowerCase()+'.';
  replaceChoices(next,multi);next.feedback=multi.correct.map(s=>s.replace(/[.]$/,'')+'.').join(' ');
 }
 if(q.format==='short-answer'&&q.prompt.startsWith('Name the concept:')&&policy.definitions[q.conceptId]){
  next.prompt='Name the concept: '+policy.definitions[q.conceptId];
  next.feedback=concepts.get(q.conceptId).name+': '+policy.definitions[q.conceptId];
 }
 for(const field of ['prompt','feedback'])next[field]=next[field].replace(/\btunes\b/g,'melodies').replace(/\btune\b/g,'melody').replace(/ in the course examples\b/g,'').replace(/style or (?:the )?type of music/g,'style');
 return next;
}
function audioCandidates(q,selection){
 const pools=policy.audioGroups.filter(g=>g.conceptIds.includes(q.conceptId));
 const preferred=pools.find(g=>g.name===policy.preferredAudioGroups[q.conceptId]);
 const entry=selection.entries.find(e=>e.path===decodeURIComponent(q.media.src).replace(/^\.\//,''));
 if(!entry)return [];
 const known=recordingConcepts(entry,selection.entries),ceiling=levels.indexOf(q.levelCode);
 return [...new Set(pools.flatMap(g=>g.conceptIds))].filter(id=>{
  const c=concepts.get(id);return c&&id!==q.conceptId&&D.levels.indexOf(c.level)<=ceiling&&allowedDistractor(q.conceptId,id,known)&&!distractorScopeErrors({id:q.id,levelCode:q.levelCode,options:[{id:'x',text:c.name}],answer:{correctOptionIds:[]}}).length;
 }).sort((a,b)=>{
  // Both candidates already belong to a curated related pool. Prefer this
  // qualification, then the closest earlier qualification, and vary ties.
  return Number(preferred?.conceptIds.includes(b))-Number(preferred?.conceptIds.includes(a))||D.levels.indexOf(concepts.get(b).level)-D.levels.indexOf(concepts.get(a).level)||rank(q,a).localeCompare(rank(q,b));
 });
}
function reviseAudio(q,selection){
 const next=C.copy(q);next.prompt=focusedPrompt(q).replace(/style or (?:the )?type of music/g,'style');
 if(q.options){
  const candidates=audioCandidates(q,selection),wrong=next.options.filter(o=>!q.answer.correctOptionIds.includes(o.id));
  const selected=candidates.slice(0,wrong.length);
  // Retain existing validated fallbacks if fewer than three related concepts
  // exist; never invent an alternative just to fill a same-level quota.
  for(const o of wrong)if(selected.length<wrong.length&&!selected.includes(o.conceptId)&&!selected.includes(q.conceptId))selected.push(o.conceptId);
  wrong.forEach((o,i)=>{const id=selected[i],c=concepts.get(id);if(!c)return;
   if(o.conceptId===id&&o.text===c.name)return;
   o.conceptId=id;o.text=c.name;o.editorialRationale='Related alternatives preferred at the question’s own level; earlier-level concepts used when needed. Compatible recording tags and aliases excluded; listening confirmation remains required.';
  });
  next.relatedConceptIds=wrong.map(o=>o.conceptId);
  // A narrowly named feature must not make the answer obvious amongst a
  // mixed set of features. Keep the neutral exam-style instruction in that case.
  const groups=policy.audioGroups.filter(g=>g.conceptIds.includes(q.conceptId));
  const sameDimension=groups.some(g=>next.options.every(o=>g.conceptIds.includes(o.conceptId)));
  if(!sameDimension)next.prompt='Listen to this excerpt and tick one box to identify what you hear.';
 }
 if(['MC-0094','MC-0095','MC-0097','MC-0101','MC-0178','MC-0179'].includes(q.conceptId)&&!q.options)next.prompt='Listen to this excerpt and give the Italian term for the tempo.';
 if(q.conceptId==='MC-0300')next.prompt=q.options?'Listen to this excerpt and tick one box to identify what you hear.':'Listen to this excerpt and name the vocal technique.';
 if(q.conceptId==='MC-0300')next.feedback='Sprechgesang is between speech and singing. The voice follows speech-like pitch shapes.';
 next.feedback=next.feedback.replace(/\btunes\b/g,'melodies').replace(/\btune\b/g,'melody').replace(/style or (?:the )?type of music/g,'style');
 return next;
}
async function prepare(backup){
 const text=read('question-bank'),audio=read('audio-question-bank'),selection=read('audio-library-selection');
 if(backup.schemaVersion!=='1.0-concept-quiz-reviews'||!Array.isArray(backup.records))throw new Error('A current browser review backup is required.');
 const ids=new Set(backup.records.map(r=>r.id)),all=[...text.questions,...audio.questions],records=[],changes=[],retired=[];
 const protectedIds=all.filter(q=>protectedQuestion(q,ids)).map(q=>q.id);
 for(const q of all){
  if(protectedQuestion(q,ids))continue;
  if(q.modality==='text'&&q.format==='multi-select'&&policy.retireMultiSelectConcepts.includes(q.conceptId)){
   records.push({id:q.id,baseContentSha256:q.contentSha256,deleted:true,deletedAt:policy.date+'T12:00:00.000Z'});
   retired.push({id:q.id,level:q.levelCode,reason:'Redundant description or repeated same fact; definition and listening questions retained.',question:C.copy(q)});continue;
  }
  const next=q.modality==='audio'?reviseAudio(q,selection):reviseText(q);
  if(C.stable(C.content(next))===C.stable(C.content(q)))continue;
  next.contentSha256=await C.fingerprint(next);next.editorialCheck={...next.editorialCheck,n3TeacherStyleReview:policy.date};
  const errors=[...C.validateQuestion(next),...questionVocabularyErrors(next),...distractorScopeErrors(next),...(q.modality==='audio'?audioOverlapErrors(next,selection.entries):[])];
  if(errors.length)throw new Error(errors.join('\n'));
  records.push({id:q.id,baseContentSha256:q.contentSha256,question:next});
  changes.push({id:q.id,level:q.levelCode,conceptId:q.conceptId,modality:q.modality,fields:['prompt','feedback','options','relatedConceptIds'].filter(f=>C.stable(q[f])!==C.stable(next[f])).map(field=>({field,before:q[field],after:next[field]})),beforeSha256:q.contentSha256,afterSha256:next.contentSha256});
 }
 return {review:{schemaVersion:backup.schemaVersion,bankId:text.bankId,records},audit:{version:1,date:policy.date,principles:policy.principles,protectedIds,protectedFingerprints:all.filter(q=>protectedIds.includes(q.id)).map(q=>({id:q.id,sha256:q.contentSha256})),analysis:{n3Before:395,n3Final:325,promptsEdited:261,feedbackEdited:121,answerSetsEdited:148,typedOrMarkingAnswersEdited:29,recordingsOrTimingsEdited:17,note:'Comparison with the pre-language-review snapshot; later curriculum removals are included. These counts describe the teacher-review trajectory, not solely the last editing session.'},changes,retired,verificationLimits:['Recordings and excerpt boundaries have not been changed.','Recording tags and known overlaps were checked. This is a wording and distractor review, not a new audition of every recording.']}};
}
module.exports={prepare,protectedQuestion,reviseText,reviseAudio,audioCandidates};
if(require.main===module)(async()=>{const {review,audit}=await prepare(JSON.parse(fs.readFileSync(process.argv[2])));fs.writeFileSync('/private/tmp/upper-level-style-review.json',JSON.stringify(review,null,2)+'\n');fs.writeFileSync('/private/tmp/upper-level-style-audit.json',JSON.stringify(audit,null,2)+'\n');console.log(`Prepared ${audit.changes.length} revisions and ${audit.retired.length} redundant-question retirements; protected ${audit.protectedIds.length} questions.`);})().catch(e=>{console.error(e);process.exitCode=1;});
