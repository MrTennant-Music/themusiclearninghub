/* Music Dictionary question editing, validation and marking. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MusicDictionaryQuizCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const multiConceptCounts=Object.freeze({'audio-select-2':2,'audio-select-3':3,'audio-select-4':4});
const musicalFeaturesCounts=Object.freeze({N5:5,H:6,AH:6});
const formats=['multiple-choice','short-answer','complete-statement','multi-select','order','musical-features',...Object.keys(multiConceptCounts)];
const isMultiSelect=format=>format==='multi-select'||Object.hasOwn(multiConceptCounts,format);
const copy=value=>JSON.parse(JSON.stringify(value));
function stable(value){if(Array.isArray(value))return '['+value.map(stable).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';return JSON.stringify(value);}
// Only the quiz's established emphasis is allowed; question data remains plain text.
function promptText(text){return String(text).replace(/\bthe style or (?:the )?type of music\b/gi,'the style');}
function promptHtml(text){return promptText(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/Name the concept:/gi,'<strong>$&</strong>').replace(/^(List )((?:a minimum of )?[56] musical features)\b/i,'$1<strong>$2</strong>').replace(/\bTick\s+(one|two|three|four)\b/gi,(match,count)=>match.slice(0,4)+' <strong>'+count.toLowerCase()+'</strong>').replace(/\b(highest to lowest|lowest to highest|oldest to newest|newest to oldest|fastest to slowest|slowest to fastest|longest to shortest|shortest to longest|opposite order|retrograde|top to bottom)\b/gi,'<strong>$1</strong>');}
function orderLabels(q){
 const prompt=String(q.prompt||'').toLowerCase();
 for(const [phrase,top,bottom]of [['highest to lowest','Highest','Lowest'],['lowest to highest','Lowest','Highest'],['oldest to newest','Oldest','Newest'],['newest to oldest','Newest','Oldest'],['fastest to slowest','Fastest','Slowest'],['slowest to fastest','Slowest','Fastest'],['longest to shortest','Longest','Shortest'],['shortest to longest','Shortest','Longest']])if(prompt.includes(phrase))return [top,bottom];
 return q.generator?.type==='retrograde'?['Last note from original motif','First note from original motif']:['First','Last'];
}
function content(q){return Object.fromEntries(Object.entries(q).filter(([k])=>!['review','editorialCheck','contentSha256'].includes(k)));}
async function fingerprint(q){const text=stable(content(q));if(typeof module==='object'&&module.exports)return require('node:crypto').createHash('sha256').update(text).digest('hex');const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(bytes)].map(n=>n.toString(16).padStart(2,'0')).join('');}
function normaliseAnswer(value,matching={}){let s=String(value);if(matching.trim!==false)s=s.trim();if(matching.collapseWhitespace!==false)s=s.replace(/\s+/g,' ');if(matching.ignoreTerminalSentencePunctuation)s=s.replace(/[.!?]+$/,'').trim();if(!matching.caseSensitive)s=s.toLocaleLowerCase('en-GB');return s;}
function musicalFeatureEntries(response){
 return typeof response==='string'?response.split(/[\r\n;]+/).map(value=>value.trim()).filter(Boolean):[];
}
function musicalFeatureKey(value){
 return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
}
// These Dictionary pairs describe the same audible feature.
const musicalFeatureEquivalents={
 'MC-0193':'MC-0046', // Arco / bowing
 'MC-0168':'MC-0081', // Modulation / change of key
 'MC-0200':'MC-0129', // Con sordino / muted
 'MC-0188':'MC-0184' // Polyphonic / contrapuntal
};
const musicalFeatureIdentity=id=>musicalFeatureEquivalents[id]||id;
function markMusicalFeatures(q,response){
 const {count:available,features}=q.answer,entries=musicalFeatureEntries(response),matched=new Map();
 for(const entry of entries){
  const key=musicalFeatureKey(entry);
  if(!key)continue;
  const canonical=features.find(feature=>musicalFeatureKey(feature.name)===key);
  const variants=canonical?[canonical]:features.filter(feature=>feature.variants.some(variant=>musicalFeatureKey(variant)===key));
  const credits=new Set(variants.map(({id})=>musicalFeatureIdentity(id)));
  if(credits.size!==1)continue;
  const credit=credits.values().next().value;
  if(!matched.has(credit))matched.set(credit,variants[0].id);
 }
 return {earned:Math.min(matched.size,available),available,matchedFeatureIds:[...matched.values()]};
}
function isCorrect(q,response){if(q.format==='musical-features'){const mark=markMusicalFeatures(q,response);return mark.earned===mark.available;}if(q.format==='order')return Array.isArray(response)&&response.length===q.answer.correctOptionIds.length&&response.every((id,i)=>id===q.answer.correctOptionIds[i]);if(q.options){const input=Array.isArray(response)?response:[response];const expected=q.answer.correctOptionIds;return new Set(input).size===input.length&&input.length===expected.length&&input.every(x=>expected.includes(x));}const norm=v=>normaliseAnswer(v,q.answer.matching);return q.answer.acceptedVariants.some(v=>norm(v)===norm(response));}
function markQuestion(q,response){
 if(q.format==='musical-features'){
  const {earned,available}=markMusicalFeatures(q,response);
  return {earned,available};
 }
 const available=isMultiSelect(q.format)?q.answer.correctOptionIds.length:1;
 if(!isMultiSelect(q.format))return {earned:isCorrect(q,response)?1:0,available};
 const selected=Array.isArray(response)?response:response?[response]:[];
 if(selected.length>available||new Set(selected).size!==selected.length||selected.some(id=>!q.options.some(o=>o.id===id)))return {earned:0,available};
 return {earned:selected.filter(id=>q.answer.correctOptionIds.includes(id)).length,available};
}
function continuesPracticeStreak(question,{earned,available}){
 if(question.format==='musical-features'||Object.hasOwn(multiConceptCounts,question.format))return earned*2>=available;
 return earned===available;
}
function validOrderMedia(media){try{return (typeof module==='object'&&module.exports?require('./quiz-audio-order.js'):globalThis.MusicDictionaryQuizAudioOrder).validateMedia(media);}catch{return false;}}
function validateQuestion(q){const errors=[];const text=v=>typeof v==='string'&&v.trim();if(!q||typeof q!=='object')return ['Question must be an object.'];for(const k of ['id','conceptId','levelCode','objectiveId','objective','factGroupId','prompt','feedback'])if(!text(q[k])&&(k!=='feedback'||q.format!=='musical-features'))errors.push(k+' is required.');if(!formats.includes(q.format))errors.push('Unknown question format.');if(!['text','audio'].includes(q.modality))errors.push('Unknown question modality.');if(q.modality==='audio'&&q.format==='order'){if(!Array.isArray(q.options)||q.options.some(o=>!validOrderMedia(o.media))||(q.referenceMedia&&!validOrderMedia(q.referenceMedia)))errors.push('Audio ordering requires a valid library recording or piano sequence for every item.');}else if(q.modality==='audio'){if(!q.media||q.media.kind!=='audio'||typeof q.media.src!=='string'||!q.media.src.startsWith('./audio/concept-library/')||q.media.src.includes('..'))errors.push('Audio questions require a Hub-hosted library recording.');if(!['multiple-choice','short-answer','musical-features'].includes(q.format)&&!multiConceptCounts[q.format])errors.push('Unsupported audio question format.');}if(multiConceptCounts[q.format]&&q.modality!=='audio')errors.push('Multi-concept listening requires audio.');if(q.minimumLevelCode&&!['N3','N4','N5','H','AH'].includes(q.minimumLevelCode))errors.push('Unknown minimum qualification.');if(!Array.isArray(q.evidence)||!q.evidence.length)errors.push('Evidence is required.');if(q.options){if(!['multiple-choice','order'].includes(q.format)&&!isMultiSelect(q.format))errors.push('Typed formats cannot have options.');if(!Array.isArray(q.options)||q.options.length<2)errors.push('At least two options are required.');else{if(q.options.some(o=>!text(o.id)||!text(o.text)))errors.push('Options must have IDs and wording.');if(q.format==='order'&&q.options.length<4)errors.push('Order questions need at least four concepts.');if(q.format==='multiple-choice'&&q.options.length!==4)errors.push('Tick-one questions need exactly four options.');if(q.format==='multi-select'&&q.options.length!==6)errors.push('Tick-two questions need exactly six options.');if(multiConceptCounts[q.format]&&q.options.length!==2*multiConceptCounts[q.format]+2)errors.push('Incorrect option count for multi-concept listening.');if(new Set(q.options.map(o=>o.id)).size!==q.options.length)errors.push('Option IDs must be unique.');if(new Set(q.options.map(o=>o.text.trim().toLowerCase())).size!==q.options.length)errors.push('Option wording must be distinct.');const keys=q.answer?.correctOptionIds;if(!Array.isArray(keys)||!keys.length||new Set(keys).size!==keys.length||keys.some(id=>!q.options.some(o=>o.id===id)))errors.push('Choose valid distinct correct options.');else if(q.format==='order'&&keys.length!==q.options.length)errors.push('Order answers must contain every item exactly once.');else if(q.format==='multiple-choice'&&keys.length!==1)errors.push('Choose exactly one correct option.');else if(isMultiSelect(q.format)){const count=multiConceptCounts[q.format]||2;if(keys.length!==count)errors.push('Incorrect answer count for selection question.');const number=q.prompt.match(/(?:select|tick)\s+(TWO|THREE|FOUR|2|3|4)\b/i);const required=number?({TWO:2,THREE:3,FOUR:4}[number[1].toUpperCase()]||Number(number[1])):null;if(required&&keys.length!==required)errors.push('The number of correct options must match the prompt.');}}}else if(q.format==='musical-features'){
 const {count,features}=q.answer||{};
 if(q.modality!=='audio'||count!==musicalFeaturesCounts[q.levelCode]||!Number.isInteger(count)||!Array.isArray(features)||features.length<count||
    features.some(feature=>!feature||!text(feature.id)||!text(feature.name)||!Array.isArray(feature.variants)||feature.variants.length<2||feature.variants.some(variant=>!text(variant)))||
    new Set(features.map(feature=>feature.id)).size!==features.length)errors.push('Musical Features requires audio and a list of accepted concepts and spellings.');
 }else{if(!['short-answer','complete-statement'].includes(q.format))errors.push('Choice formats require options.');if(!text(q.answer?.canonical)||!Array.isArray(q.answer?.acceptedVariants)||!q.answer.acceptedVariants.length||q.answer.acceptedVariants.some(v=>!text(v)))errors.push('A canonical answer and accepted variants are required.');else if(!q.answer.acceptedVariants.some(v=>normaliseAnswer(v,q.answer.matching)===normaliseAnswer(q.answer.canonical,q.answer.matching)))errors.push('Include the canonical answer in accepted variants.');if(q.answer?.matching?.fuzzyMatching)errors.push('Fuzzy musical-term matching is not allowed.');}return errors;}
function questionInScope(q,ids){if(q.format==='musical-features')return q.answer.features.every(feature=>ids.has(feature.id));if(multiConceptCounts[q.format])return q.options.every(option=>ids.has(option.conceptId));return ids.has(q.conceptId)||(q.format==='order'&&(q.relatedConceptIds||[]).some(id=>ids.has(id)));}
function eligibleForQuiz(q,config){if(Array.isArray(config.formats)&&!config.formats.includes(q.format))return false;if((q.minimumLevelCode||q.format==='order')&&config.level!=='ALL'&&['N3','N4','N5','H','AH'].indexOf(config.assessmentLevel||config.level)<['N3','N4','N5','H','AH'].indexOf(q.minimumLevelCode||q.levelCode))return false;if(q.modality==='audio'){if(config.audioQuestions===false)return false;if(!q.options&&q.format!=='musical-features'){const level=config.assessmentLevel||config.level;if(level==='H'&&q.levelCode!=='H')return false;if(level==='AH'&&!['H','AH'].includes(q.levelCode))return false;}}else if(config.nonAudioQuestions===false)return false;return true;}
// Shuffle ties, then exhaust distinct answers before repeating any answer.
// Target/fact counts spread questions across concepts and avoid paraphrases.
function selectQuizQuestions(questions,count,random=Math.random){
 const normal=value=>normaliseAnswer(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
 const parents=new Map(),find=value=>{if(!parents.has(value))parents.set(value,value);const parent=parents.get(value);if(parent!==value)parents.set(value,find(parent));return parents.get(value);};
 for(const q of questions)if(!q.options&&q.format!=='musical-features')for(const variant of q.answer.acceptedVariants||[])parents.set(find(normal(variant)),find(normal(q.answer.canonical)));
 const answerKey=q=>q.format==='musical-features'?q.answer.features.map(feature=>feature.id).sort().join('|'):(q.options?q.options.filter(o=>q.answer.correctOptionIds.includes(o.id)).map(o=>o.text):[q.answer.canonical]).map(value=>find(normal(value))).sort().join('|');
 const remaining=questions.map(q=>({q,key:answerKey(q),tie:random()})).sort((a,b)=>a.tie-b.tie),selected=[],answers=new Map(),concepts=new Map(),facts=new Map();
 const limit=Math.min(30,Math.max(1,Number(count)||10));
 while(remaining.length&&selected.length<limit){
  let best=0;const rank=item=>[answers.get(item.key)||0,concepts.get(item.q.conceptId)||0,facts.get(item.q.factGroupId)||0];
  for(let i=1;i<remaining.length;i++){const a=rank(remaining[i]),b=rank(remaining[best]);for(let j=0;j<a.length;j++){if(a[j]===b[j])continue;if(a[j]<b[j])best=i;break;}}
  const [{q,key}]=remaining.splice(best,1);selected.push(q);answers.set(key,(answers.get(key)||0)+1);concepts.set(q.conceptId,(concepts.get(q.conceptId)||0)+1);facts.set(q.factGroupId,(facts.get(q.factGroupId)||0)+1);
 }
 return selected;
}
function editNotes(q){return {editorialNotes:q.review?.editorialNotes||'',...(q.review?.updatedAt?{updatedAt:q.review.updatedAt}:{}),...(q.review?.finalisedAt?{finalisedAt:q.review.finalisedAt}:{})};}
async function saveQuestion(previous,edited){const q=copy(edited);if(!q.options&&Array.isArray(q.answer?.acceptedVariants)){q.answer.acceptedVariants=q.answer.acceptedVariants.map(v=>String(v).trim()).filter(Boolean);q.answer.canonical=q.answer.acceptedVariants[0]||'';}const errors=validateQuestion(q);if(errors.length)throw new Error(errors.join(' '));q.contentSha256=await fingerprint(q);q.review={...editNotes(q),updatedAt:new Date().toISOString()};return q;}
function conceptReview(bank,records,conceptId){return records?.get('concept:'+conceptId)||(bank.conceptReviews||[]).find(r=>r.conceptId===conceptId);}
function conceptIsFinalised(bank,records,conceptId,questions=bank.questions){const review=conceptReview(bank,records,conceptId);if(review)return !!review.finalisedAt;const qs=questions.filter(q=>q.conceptId===conceptId);return qs.length>0&&qs.every(q=>!!q.review?.finalisedAt);}
function canGenerateForConcept(bank,conceptId){return !conceptReview(bank,null,conceptId)?.excludeFromGeneration;}
async function applyReviews(bank,records){
 if(!Array.isArray(records))throw new Error('Review records must be a list.');
 const bases=new Map(bank.questions.map(q=>[q.id,q])),result=new Map();
 for(const original of records){
  if(original.kind==='concept-review'){
   if((bank.retiredConceptIds||[]).includes(original.conceptId))continue;
   if(original.id!=='concept:'+original.conceptId||!(bank.coverage||[]).some(c=>c.conceptId===original.conceptId)||result.has(original.id))throw new Error('Unknown or duplicate concept review: '+original.id);
   if(typeof original.excludeFromGeneration!=='boolean'||(original.finalisedAt!=null&&!Number.isFinite(Date.parse(original.finalisedAt)))||original.excludeFromGeneration&&!original.finalisedAt)throw new Error('Invalid concept finalisation: '+original.conceptId);
   result.set(original.id,copy(original));continue;
  }
  const base=bases.get(original.id);if(result.has(original.id))throw new Error('Unknown or duplicate question: '+original.id);
  if(!base){if((bank.retiredQuestionIds||[]).includes(original.id)){result.set(original.id,{id:original.id,deleted:true,deletedAt:original.deletedAt||'2026-11-13T00:00:00.000Z'});continue;}throw new Error('Unknown or duplicate question: '+original.id);}
  const item=copy(original);
  if(item.deleted===true){if(item.baseContentSha256!==base.contentSha256&&!(bank.reviewMigrations||[]).some(m=>m.id===item.id&&m.from===item.baseContentSha256&&m.to===base.contentSha256))throw new Error('The source question has changed: '+item.id);result.set(item.id,{id:item.id,baseContentSha256:base.contentSha256,deleted:true,deletedAt:item.deletedAt});continue;}
  if(item.baseContentSha256!==base.contentSha256&&(bank.reviewMigrations||[]).some(m=>m.id===item.id&&m.from===item.baseContentSha256&&m.to===base.contentSha256)&&item.question?.contentSha256===base.contentSha256&&item.question.contentSha256===await fingerprint(item.question))item.baseContentSha256=base.contentSha256;
  if(item.baseContentSha256!==base.contentSha256){
   const revision=(bank.reviewMigrations||[]).find(m=>m.id===item.id&&m.from===item.baseContentSha256&&m.to===base.contentSha256);
   if(!revision)throw new Error('The source question has changed: '+item.id+'. Keep this review file and reconcile it before importing.');
   if(item.question?.review?.finalisedAt&&!revision.userRequestedAudioReplacement&&!revision.sourceMetadataOnly&&!revision.teacherAuthorizedCorrection)throw new Error('Finalised question has changed in the source: '+item.id+'. Keep the locked review unchanged and reconcile it explicitly.');
   if(!item.question||item.question.contentSha256!==await fingerprint(item.question))throw new Error('Question checksum does not match: '+item.id);
   if(!revision.userRequestedAudioReplacement&&!revision.sourceMetadataOnly){
   // Reconcile only an explicitly recorded wording revision. Keep the teacher's own edits.
   for(const field of ['prompt','feedback'])if(item.question[field]===revision.previous[field])item.question[field]=base[field];
   if(revision.previous.answer&&stable(item.question.answer)===stable(revision.previous.answer))item.question.answer=copy(base.answer);
   for(const option of item.question.options||[]){const prior=revision.previous.options?.find(o=>o.id===option.id),current=base.options?.find(o=>o.id===option.id);if(prior&&current&&option.text===prior.text)option.text=current.text;}
   }
   // Apply only exact text corrections explicitly authorised after the teacher's final review.
   const corrections=revision.teacherCorrections;
   if(corrections){
    for(const field of ['prompt','feedback','answer'])if(corrections[field]&&stable(item.question[field])===stable(corrections[field].from))item.question[field]=copy(corrections[field].to);
    for(const change of corrections.options||[]){const option=item.question.options?.find(o=>o.id===change.id);if(option&&option.text===change.from){option.text=change.to;if(change.toConceptId&&option.conceptId===change.fromConceptId)option.conceptId=change.toConceptId;}}
   }
   // Explicit recording replacements keep saved wording while moving the source metadata together.
   for(const field of ['media','factGroupId','evidence'])if(Object.prototype.hasOwnProperty.call(revision.previous,field)||revision.previousFieldHashes?.[field]){
    const matchesPrevious=revision.previousFieldHashes?.[field] ? await fingerprint({value:item.question[field]})===revision.previousFieldHashes[field] : stable(item.question[field])===stable(revision.previous[field]);
    if(matchesPrevious)item.question[field]=copy(base[field]);
    else if(stable(item.question[field])!==stable(base[field]))throw new Error('Question source metadata changed: '+item.id);
   }
   if(revision.acceptedVariantAdditions&&item.question.answer?.acceptedVariants&&
      (!revision.acceptedVariantPrompt||item.question.prompt===revision.acceptedVariantPrompt)){
    for(const value of revision.acceptedVariantAdditions)if(!item.question.answer.acceptedVariants.includes(value))item.question.answer.acceptedVariants.push(value);
   }
   if(revision.reorderOptions&&base.options&&item.question.options?.length===base.options.length){
    const order=new Map(base.options.map((option,index)=>[option.id,index]));
    item.question.options.sort((a,b)=>order.get(a.id)-order.get(b.id));
   }
   item.baseContentSha256=base.contentSha256;item.question.contentSha256=await fingerprint(item.question);
  }
  const q=item.question;
  if(!q||q.id!==base.id||q.conceptId!==base.conceptId||q.levelCode!==base.levelCode||q.objectiveId!==base.objectiveId||q.factGroupId!==base.factGroupId||stable(q.evidence)!==stable(base.evidence))throw new Error('Question identity or evidence changed: '+item.id);
  const errors=validateQuestion(q);if(errors.length)throw new Error(item.id+': '+errors.join(' '));
  if(q.contentSha256!==await fingerprint(q))throw new Error('Question checksum does not match: '+item.id);
  // An explicitly confirmed correction can restore the original source text,
  // so its source checksum may stay the same. Match the reviewed content too.
  const sameVersionCorrection=(bank.reviewMigrations||[]).find(m=>m.id===q.id&&m.from===base.contentSha256&&m.to===base.contentSha256&&m.teacherAuthorizedCorrection&&m.previousReviewedContentSha256===q.contentSha256);
  if(sameVersionCorrection){
   const changes=sameVersionCorrection.teacherCorrections||{};
   for(const field of ['prompt','feedback','answer'])if(changes[field]&&stable(q[field])===stable(changes[field].from))q[field]=copy(changes[field].to);
   for(const change of changes.options||[]){const option=q.options?.find(o=>o.id===change.id);if(option&&option.text===change.from)option.text=change.to;}
   q.contentSha256=await fingerprint(q);
  }
  // Earlier cached editors could save the new label with its retired option ID.
  // Reconcile that metadata only when the visible choice already matches the source.
  let repairedOptionIds=false;
  for(const option of q.options||[])if((bank.retiredConceptIds||[]).includes(option.conceptId)){
   const current=base.options?.find(o=>o.id===option.id);
   if(current&&option.text===current.text){option.conceptId=current.conceptId;repairedOptionIds=true;}
  }
  if(repairedOptionIds){q.relatedConceptIds=(q.options||[]).filter(o=>o.conceptId!==q.conceptId).map(o=>o.conceptId);q.contentSha256=await fingerprint(q);}
  item.question.review=editNotes(q);result.set(item.id,item);
 }
 return result;
}

return {formats,multiConceptCounts,musicalFeaturesCounts,musicalFeatureEntries,musicalFeatureIdentity,markMusicalFeatures,isMultiSelect,copy,stable,promptText,promptHtml,orderLabels,content,fingerprint,normaliseAnswer,isCorrect,markQuestion,continuesPracticeStreak,validateQuestion,questionInScope,eligibleForQuiz,selectQuizQuestions,saveQuestion,applyReviews,conceptReview,conceptIsFinalised,canGenerateForConcept};
});
