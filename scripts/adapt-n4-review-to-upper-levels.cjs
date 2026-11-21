/* Carry the completed N4 teacher review into unedited N5–AH questions.
 * No generation, recording replacement or mutation of teacher-protected material. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const C=require('../music-dictionary/quiz-core.js'),D=require('../music-dictionary/music-concepts-data.js');
const policy=require('../music-dictionary/quiz-data/n4-upper-level-policy.json');
const previousPolicy=require('../music-dictionary/quiz-data/upper-level-editorial-policy.json');
const {allowedDistractor,recordingConcepts,audioOverlapErrors,overlaps}=require('./quiz-distractor-overlap.cjs');
const {questionVocabularyErrors}=require('./quiz-question-vocabulary.cjs'),{distractorScopeErrors}=require('./quiz-distractor-scope.cjs');
const DATA=path.resolve(__dirname,'../music-dictionary/quiz-data');
const read=name=>JSON.parse(fs.readFileSync(path.join(DATA,name+'.json')));
const byId=new Map(D.concepts.map(c=>[c.id,c])),levels=['N3','N4','N5','H','AH'];
const hash=value=>crypto.createHash('sha256').update(C.stable(value)).digest('hex');
function protection(backup,banks){
 const ids=new Set(backup.records.map(r=>r.id)),concepts=new Set();
 for(const r of [...banks.flatMap(b=>b.conceptReviews||[]),...backup.records])if(r.kind==='concept-review'&&r.finalisedAt)concepts.add(r.conceptId);
 return {ids,concepts};
}
function isProtected(q,guard){return !['N5','H','AH'].includes(q.levelCode)||guard.ids.has(q.id)||guard.concepts.has(q.conceptId)||Boolean(q.review?.updatedAt||q.review?.finalisedAt);}
function changeChoices(q,plan){
 const right=q.options.filter(o=>q.answer.correctOptionIds.includes(o.id)),wrong=q.options.filter(o=>!q.answer.correctOptionIds.includes(o.id));
 if(right.length!==plan.correct.length||wrong.length!==plan.incorrect.length)throw Error('Choice-plan size mismatch: '+q.id);
 for(const [slots,words] of [[right,plan.correct],[wrong,plan.incorrect]])slots.forEach((o,i)=>{o.text=words[i];delete o.conceptId;delete o.editorialRationale;});q.relatedConceptIds=[];
}
function reviseText(q){
 const next=C.copy(q),plan=policy.textChoices[q.conceptId];
 if(q.format==='multiple-choice'&&plan){next.prompt=plan.prompt;changeChoices(next,plan);if(plan.feedback)next.feedback=plan.feedback;}
 if(q.format==='short-answer'&&policy.definitions[q.conceptId]&&q.prompt.startsWith('Name the concept:')){next.prompt='Name the concept: '+policy.definitions[q.conceptId];next.feedback=byId.get(q.conceptId).name+': '+policy.definitions[q.conceptId];}
 for(const field of ['prompt','feedback']){
  next[field]=next[field].replace(/ in the course examples\b/g,'').replace(/style or (?:the )?type of music/g,'style');
  next[field]=next[field].replace(/describe aria\./g,'describe an aria.').replace(/describe chorus\./g,'describe a chorus.').replace(/describe Gaelic psalm\./g,'describe Gaelic psalm singing.').replace(/describe waulking song\./g,'describe a waulking song.');
 }
 return next;
}
function selectAlternatives(q,selection){
 const ownPool=policy.preferredPools[q.conceptId],curated=ownPool?policy.pools[ownPool]:null;
 const source=selection.entries.find(e=>e.conceptId===q.conceptId&&e.sha256===q.media.sha256);if(!source)return null;
 const known=recordingConcepts(source,selection.entries),ceiling=levels.indexOf(q.levelCode);
 const related=curated||previousPolicy.audioGroups.find(g=>g.name===previousPolicy.preferredAudioGroups[q.conceptId])?.conceptIds;
 if(!related)return null;
 const candidates=related.filter(id=>{
  const c=byId.get(id);return c&&id!==q.conceptId&&D.levels.indexOf(c.level)<=ceiling&&allowedDistractor(q.conceptId,id,known)&&!distractorScopeErrors({id:q.id,levelCode:q.levelCode,options:[{id:'x',text:c.name}],answer:{correctOptionIds:[]}}).length;
 }).sort((a,b)=>D.levels.indexOf(byId.get(b).level)-D.levels.indexOf(byId.get(a).level)||hash([q.id,a]).localeCompare(hash([q.id,b])));
 const selected=[];for(const id of candidates)if(!selected.some(x=>overlaps(x,id))){selected.push(id);if(selected.length===3)break;}
 // If a task has too few distinct taught alternatives, retain its checked existing
 // choices rather than adding an unrelated option to meet a numerical quota.
 if(selected.length<3)return null;
 return {ids:selected,pool:ownPool||previousPolicy.preferredAudioGroups[q.conceptId]};
}
function reviseAudio(q,selection){
 const next=C.copy(q);
 if(!q.options&&policy.audioFocus[q.conceptId])next.prompt=policy.audioFocus[q.conceptId];
 if(policy.audioFeedback[q.conceptId])next.feedback=policy.audioFeedback[q.conceptId];
 if(q.options){const alternatives=selectAlternatives(q,selection);if(alternatives){const wrong=next.options.filter(o=>!q.answer.correctOptionIds.includes(o.id));if(C.stable(wrong.map(o=>o.conceptId).sort())!==C.stable([...alternatives.ids].sort()))wrong.forEach((o,i)=>{const id=alternatives.ids[i];o.conceptId=id;o.text=byId.get(id).name;o.editorialRationale='N4 teacher-review adaptation: musically related alternatives take priority; own-level terms preferred only within that task, with earlier-level terms when needed. Known overlaps and equivalent distractors excluded.';});next.relatedConceptIds=wrong.map(o=>o.conceptId);
 const task={periods:'the style',jazzPop:'the style','jazz-pop':'the style',scales:'the scale',harmony:'the chord or harmonic feature',forms:'the musical form',sections:'the musical section or device',fugue:'the musical feature',phraseDevices:'the melodic device',chamber:'the type of ensemble or instrumental work',sacredVocal:'the type of vocal music',soloVocal:'the type of vocal music',vocalDelivery:'the vocal technique or word setting',strings:'the string instrument',stringsTechniques:'the playing technique',drumTechniques:'the rhythmic feature',italianTechniques:'the Italian playing instruction'}[alternatives.pool];
 if(task)next.prompt='Listen to this excerpt and tick one box to identify '+task+'.';
 }}
 // Tempo changes ask for a change, rather than the name of a fixed speed.
 if(['MC-0179','MC-0180'].includes(q.conceptId)&&q.options)next.prompt='Listen to this excerpt and tick one box to identify the change in tempo.';
 if(q.conceptId==='MC-0200'&&!q.options)next.prompt=policy.audioFocus[q.conceptId];
 if(q.conceptId==='MC-0237')next.feedback=policy.audioFeedback[q.conceptId];
 if(['MC-0258','MC-0260'].includes(q.conceptId))next.prompt=q.prompt;
 return next;
}
function shouldRetire(q){
 if(q.modality!=='text')return false;
 if(q.format==='multiple-choice'&&policy.retireInstrumentChoices.includes(q.conceptId))return 'Repetitive written identification: retain the concise definition and audio identification questions.';
 if(q.format==='multi-select'&&policy.retireRepeatedSelections.includes(q.conceptId))return 'Both correct statements repeat the same core fact; retain the definition and listening tasks.';
 return false;
}
async function prepare(backup,banks=[read('question-bank'),read('audio-question-bank')],selection=read('audio-library-selection')){
 if(backup.schemaVersion!=='1.0-concept-quiz-reviews'||!Array.isArray(backup.records))throw Error('A fresh browser review backup is required.');
 const guard=protection(backup,banks),all=banks.flatMap(b=>b.questions),records=[],changes=[],retired=[],protectedRows=all.filter(q=>isProtected(q,guard));
 for(const q of all){if(isProtected(q,guard))continue;
  const reason=shouldRetire(q);if(reason){records.push({id:q.id,baseContentSha256:q.contentSha256,deleted:true,deletedAt:policy.date+'T12:00:00.000Z'});retired.push({id:q.id,level:q.levelCode,reason,question:C.copy(q)});continue;}
  const next=q.modality==='audio'?reviseAudio(q,selection):reviseText(q);
  if(C.stable(C.content(next))===C.stable(C.content(q)))continue;
  const errors=[...C.validateQuestion(next),...questionVocabularyErrors(next),...distractorScopeErrors(next),...(q.modality==='audio'?audioOverlapErrors(next,selection.entries):[])];
  if(errors.length)throw Error(q.id+': '+errors.join('; '));
  // Nothing beyond wording and options is within this pass's scope.
  for(const field of ['answer','media','review','factGroupId','evidence'])if(C.stable(q[field])!==C.stable(next[field]))throw Error('Protected field changed: '+q.id+' '+field);
  next.contentSha256=await C.fingerprint(next);next.editorialCheck={...next.editorialCheck,n4TeacherStyleReview:policy.date};records.push({id:q.id,baseContentSha256:q.contentSha256,question:next});
  changes.push({id:q.id,level:q.levelCode,conceptId:q.conceptId,modality:q.modality,beforeSha256:q.contentSha256,afterSha256:next.contentSha256,fields:['prompt','feedback','options','relatedConceptIds'].filter(f=>C.stable(q[f])!==C.stable(next[f])).map(field=>({field,before:q[field],after:next[field]}))});
 }
 return {review:{schemaVersion:backup.schemaVersion,bankId:banks[0].bankId,records},audit:{version:1,date:policy.date,sourceReview:policy.sourceReview,principles:policy.principles,protectedQuestions:protectedRows.map(q=>({id:q.id,sha256:hash(q)})),protectedConcepts:[...guard.concepts],changes,retired,verificationLimits:['No recordings or excerpt boundaries changed.','Alternatives checked against curriculum scope, library tags and known overlaps; this pass does not claim a new audition of every excerpt.']}};
}
module.exports={prepare,protection,isProtected,reviseText,reviseAudio,selectAlternatives,shouldRetire};
if(require.main===module)(async()=>{const result=await prepare(JSON.parse(fs.readFileSync(process.argv[2])));for(const [name,data]of [['review',result.review],['audit',result.audit]])fs.writeFileSync('/private/tmp/n4-upper-'+name+'.json',JSON.stringify(data,null,2)+'\n');console.log('Prepared '+result.audit.changes.length+' revisions and '+result.audit.retired.length+' redundant-question retirements. Protected '+result.audit.protectedQuestions.length+' questions.');})().catch(e=>{console.error(e.message);process.exitCode=1;});
