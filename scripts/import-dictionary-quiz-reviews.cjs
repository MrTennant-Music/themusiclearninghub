/* Persist validated browser reviews to both authored banks and their audit records. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const Core=require('../music-dictionary/quiz-core.js');
const ROOT=path.resolve(__dirname,'..'),DATA=path.join(ROOT,'music-dictionary/quiz-data');
const digest=value=>crypto.createHash('sha256').update(Core.stable(value)).digest('hex');
async function prepareReviewImport(text,audio,review,{allowFinalisedEdits=false}={}){
 text=Core.copy(text);audio=Core.copy(audio);
 if(review.schemaVersion!=='1.0-concept-quiz-reviews'||review.bankId!==text.bankId)throw new Error('Wrong review export.');
 const combined={...text,questions:[...text.questions,...audio.questions],retiredQuestionIds:[...(text.retiredQuestionIds||[]),...(audio.retiredQuestionIds||[])],reviewMigrations:[...(text.reviewMigrations||[]),...(audio.reviewMigrations||[])]};
 const changes=await Core.applyReviews(combined,review.records),removed=[];
 if(!allowFinalisedEdits)for(const [id,item] of changes){
  const base=combined.questions.find(q=>q.id===id);
  if(base?.review?.finalisedAt&&(item.deleted||Core.stable(Core.content(item.question))!==Core.stable(Core.content(base))))throw new Error('Finalised question is locked: '+id+'. Explicit user authorisation is required to change it.');
 }

 for(const bank of [text,audio]){
  const previous=new Map(bank.questions.map(q=>[q.id,q]));
  for(const q of bank.questions){const edit=changes.get(q.id);if(edit?.deleted){removed.push(q);bank.retiredQuestionIds=[...new Set([...(bank.retiredQuestionIds||[]),q.id])];bank.retiredQuestions=[...(bank.retiredQuestions||[]),{id:q.id,conceptId:q.conceptId,levelCode:q.levelCode,format:q.format,deletedAt:edit.deletedAt}];}}
  bank.questions=bank.questions.filter(q=>!changes.get(q.id)?.deleted).map(q=>{
   const edited=changes.get(q.id)?.question;if(!edited)return q;
   // The editor changes question content, not the provenance of prepared audio.
   if(q.editorialCheck?.audioExcerpt)edited.editorialCheck={...edited.editorialCheck,audioExcerpt:Core.copy(q.editorialCheck.audioExcerpt)};
   return edited;
  });
  // Removing a base variant must not leave surviving questions pointing to a missing ID.
  const groups=new Map();for(const q of bank.questions){if(!groups.has(q.factGroupId))groups.set(q.factGroupId,[]);groups.get(q.factGroupId).push(q);}
  for(const group of groups.values())if(group.some(q=>q.variantOfQuestionId&&!bank.questions.some(base=>base.id===q.variantOfQuestionId))){delete group[0].variantOfQuestionId;for(const q of group.slice(1))q.variantOfQuestionId=group[0].id;}
  for(const q of bank.questions){q.contentSha256=await Core.fingerprint(q);const old=previous.get(q.id);if(old.contentSha256!==q.contentSha256){
   bank.reviewMigrations=bank.reviewMigrations||[];for(const m of bank.reviewMigrations)if(m.id===q.id&&m.to===old.contentSha256)m.to=q.contentSha256;
   bank.reviewMigrations.push({id:q.id,from:old.contentSha256,to:q.contentSha256,previous:{prompt:old.prompt,feedback:old.feedback,options:old.options,answer:old.answer}});
  }}
  bank.reviewMigrations=(bank.reviewMigrations||[]).filter(m=>bank.questions.some(q=>q.id===m.id));
 }
 const conceptReviews=new Map((text.conceptReviews||[]).map(r=>[r.conceptId,r]));
 for(const item of changes.values())if(item.kind==='concept-review')conceptReviews.set(item.conceptId,Core.copy(item));
 text.conceptReviews=[...conceptReviews.values()];
 const removedIds=new Set(removed.map(q=>q.id));
 for(const row of text.coverage){const ids=row.questionIds.filter(id=>removedIds.has(id));if(ids.length)row.retiredQuestionIds=[...new Set([...(row.retiredQuestionIds||[]),...ids])];row.questionIds=row.questionIds.filter(id=>!removedIds.has(id));row.sharedQuestionIds=(row.sharedQuestionIds||[]).filter(id=>!removedIds.has(id));}
 if(text.summary){text.summary.questions=text.questions.length;text.summary.distinctFactGroups=new Set(text.questions.map(q=>q.factGroupId)).size;for(const [level,row] of Object.entries(text.summary.byLevel||{}))row.questions=text.questions.filter(q=>q.levelCode===level).length;}
 return {text,audio,changes,removed};
}
async function importReview(filename,options={}){
 const read=name=>JSON.parse(fs.readFileSync(path.join(DATA,name+'.json'),'utf8'));
 const review=JSON.parse(fs.readFileSync(filename,'utf8'));
 const result=await prepareReviewImport(read('question-bank'),read('audio-question-bank'),review,options),{text,audio}=result;
 await require('./build-dictionary-quizzes.cjs').validateBank(text);
 const {questionVocabularyErrors}=require('./quiz-question-vocabulary.cjs'),{audioOverlapErrors}=require('./quiz-distractor-overlap.cjs'),selection=read('audio-library-selection');
 for(const q of audio.questions){const errors=[...Core.validateQuestion(q),...questionVocabularyErrors(q),...audioOverlapErrors(q,selection.entries)];if(errors.length)throw new Error(q.id+': '+errors.join(' '));const file=path.resolve(ROOT,decodeURIComponent(q.media.src));if(!file.startsWith(path.join(ROOT,'audio/concept-library')+path.sep)||!fs.existsSync(file))throw new Error('Missing Hub audio '+q.id);}
 const audit=read('workbook-choice-audit'),alternatives=read('typed-answer-alternatives'),active=new Map(text.questions.map(q=>[q.id,q]));
 const removedAudit=audit.questions.filter(row=>!active.has(row.questionId));if(removedAudit.length)audit.retiredQuestions=[...(audit.retiredQuestions||[]),...removedAudit];
 audit.questions=audit.questions.filter(row=>active.has(row.questionId));
 for(const row of audit.questions){const q=active.get(row.questionId);row.questionContentSha256=q.contentSha256;row.checkedPrompt=q.prompt;row.checkedFeedback=q.feedback;row.checkedCorrectOptions=q.options.filter(o=>q.answer.correctOptionIds.includes(o.id)).map(o=>o.text);row.checkedDistractors=q.options.filter(o=>!q.answer.correctOptionIds.includes(o.id)).map(o=>o.text);}
 audit.reviewedQuestions=audit.questions.length;audit.typedQuestionsPreserved=text.questions.filter(q=>!q.options).length;audit.typedBaselineSha256=digest(text.questions.filter(q=>!q.options));audit.lastTeacherImport={date:new Date().toISOString(),reviewRecords:review.records.length,removedQuestions:result.removed.map(q=>q.id)};
 alternatives.questions=alternatives.questions.filter(row=>active.has(row.questionId));for(const row of alternatives.questions){const q=active.get(row.questionId);row.questionContentSha256=q.contentSha256;row.addedVariants=row.addedVariants.filter(answer=>Core.isCorrect(q,answer));}
 alternatives.definitionBaselineSha256=digest(text.questions.filter(q=>!q.options).map(q=>({id:q.id,prompt:q.prompt,canonical:q.answer.canonical,feedback:q.feedback})));
 const files=new Map([['question-bank',text],['audio-question-bank',audio],['workbook-choice-audit',audit],['typed-answer-alternatives',alternatives]].map(([name,value])=>[path.join(DATA,name+'.json'),JSON.stringify(value,null,2)+'\n']));
 const originals=new Map([...files.keys(),path.join(ROOT,'music-dictionary/quiz-bank.js')].map(file=>[file,fs.readFileSync(file)])),staged=[];
 try{for(const [file,bytes] of files){const temp=file+'.import-'+process.pid+'.tmp';fs.writeFileSync(temp,bytes);staged.push([temp,file]);}for(const [temp,file] of staged)fs.renameSync(temp,file);await require('./build-dictionary-quizzes.cjs').build();}
 catch(error){for(const [file,bytes] of originals)fs.writeFileSync(file,bytes);throw error;}
 finally{for(const [temp] of staged)if(fs.existsSync(temp))fs.unlinkSync(temp);}
 console.log(`Saved ${review.records.length} reviews (${result.removed.length} removals) to the project.`);return result;
}
module.exports={prepareReviewImport,importReview};
if(require.main===module)importReview(process.argv[2],{allowFinalisedEdits:process.argv.includes('--allow-finalised-edits')}).catch(error=>{console.error(error.message);process.exitCode=1;});
