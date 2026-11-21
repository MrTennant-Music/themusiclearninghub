/* Dictionary question source -> validated shared quiz and editor data. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const Core=require(path.join(ROOT,'music-dictionary/quiz-core.js'));
const {distractorScopeErrors}=require('./quiz-distractor-scope.cjs');
const {questionVocabularyErrors}=require('./quiz-question-vocabulary.cjs');
const {audioOverlapErrors}=require('./quiz-distractor-overlap.cjs');
const BANK_PATH=path.join(ROOT,'music-dictionary/quiz-data/question-bank.json');
async function validateBank(bank){
 const dictionary=require(path.join(ROOT,'music-dictionary/music-concepts-data.js'));
 if(bank.schemaVersion!=='1.0'||bank.bankId!=='mlh-concept-quiz-1')throw new Error('Unknown Dictionary quiz bank format.');
 const byId=new Map(dictionary.concepts.map(c=>[c.id,c]));
 const ids=new Set(),groups=new Map();
 for(const q of bank.questions){
  if(!Core.canGenerateForConcept(bank,q.conceptId))throw new Error('Finalised empty concept cannot receive generated questions: '+q.conceptId);
  const errors=[...Core.validateQuestion(q),...distractorScopeErrors(q),...questionVocabularyErrors(q)];if(errors.length)throw new Error(q.id+': '+errors.join(' '));
  if(ids.has(q.id))throw new Error('Duplicate question '+q.id);ids.add(q.id);
  if(groups.has(q.factGroupId)&&q.variantOfQuestionId!==groups.get(q.factGroupId))throw new Error('Unlabelled duplicate underlying fact '+q.factGroupId);if(!groups.has(q.factGroupId))groups.set(q.factGroupId,q.id);if(q.variantOfQuestionId&&!bank.questions.some(other=>other.id===q.variantOfQuestionId&&other.factGroupId===q.factGroupId))throw new Error('Invalid same-fact alternative '+q.id);
  const concept=byId.get(q.conceptId);if(!concept)throw new Error('Unknown concept '+q.conceptId);
  if(['N3','N4','N5','H','AH'][dictionary.levels.indexOf(concept.level)]!==q.levelCode&&!(q.format==='order'&&['N3','N4','N5','H','AH'].indexOf(q.levelCode)>=dictionary.levels.indexOf(concept.level)))throw new Error('Wrong level '+q.id);
  if(q.contentSha256!==await Core.fingerprint(q))throw new Error('Content checksum mismatch '+q.id);
  const evidence=q.evidence.find(e=>e.kind==='repository');
  if(!evidence)throw new Error('Missing Dictionary evidence '+q.id);
  const sourcePath=path.resolve(ROOT,evidence.path);if(sourcePath!==path.join(ROOT,'music-dictionary/music-concepts-data.js'))throw new Error('Unexpected Dictionary source '+q.id);
  const hash=require('node:crypto').createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex');
  if(hash!==evidence.sourceSha256)throw new Error('Dictionary changed; reconcile evidence for '+q.id);
  const match=evidence.locator?.match(/^\/concepts\/(\d+)\/definition$/);
  if(!match||dictionary.concepts[Number(match[1])]?.id!==q.conceptId||concept.definition!==evidence.supportingText)throw new Error('Evidence does not match target concept '+q.id);
 }
 const coverageIds=new Set();
 for(const row of bank.coverage){if(!byId.has(row.conceptId)||coverageIds.has(row.conceptId))throw new Error('Invalid coverage '+row.conceptId);coverageIds.add(row.conceptId);if(!Array.isArray(row.questionIds)||row.questionIds.length+(row.retiredQuestionIds||[]).length<3&&Core.canGenerateForConcept(bank,row.conceptId))throw new Error('At least three questions required for '+row.conceptId);const prompts=row.questionIds.map(id=>bank.questions.find(q=>q.id===id)?.prompt?.trim().toLowerCase());if(new Set(prompts).size!==prompts.length)throw new Error('Repeated question wording for '+row.conceptId);if(!row.reason)throw new Error('Coverage reason required '+row.conceptId);for(const id of row.questionIds||[])if(!bank.questions.some(q=>q.id===id&&q.conceptId===row.conceptId))throw new Error('Wrong coverage target '+id);for(const id of row.sharedQuestionIds||[])if(!ids.has(id))throw new Error('Missing shared question '+id);}
 if(coverageIds.size!==byId.size)throw new Error('Every current Dictionary concept must have a coverage record.');
 for(const q of bank.questions)if(!bank.coverage.find(c=>c.conceptId===q.conceptId)?.questionIds.includes(q.id))throw new Error('Question missing from coverage '+q.id);
 return {concepts:coverageIds.size,questions:ids.size};
}
async function build(){
 const bank=JSON.parse(fs.readFileSync(BANK_PATH,'utf8'));
 const counts=await validateBank(bank);
 const audioPath=path.join(ROOT,'music-dictionary/quiz-data/audio-question-bank.json');
 if(fs.existsSync(audioPath)){const audio=JSON.parse(fs.readFileSync(audioPath)),selection=JSON.parse(fs.readFileSync(path.join(ROOT,'music-dictionary/quiz-data/audio-library-selection.json')));for(const q of audio.questions){if(!Core.canGenerateForConcept(bank,q.conceptId))throw new Error('Finalised empty concept cannot receive audio questions: '+q.conceptId);const errors=[...Core.validateQuestion(q),...audioOverlapErrors(q,selection.entries),...questionVocabularyErrors(q)];if(errors.length||q.contentSha256!==await Core.fingerprint(q))throw new Error('Invalid audio question '+q.id+': '+errors.join(' '));if(bank.questions.some(other=>other.id===q.id))throw new Error('Duplicate audio ID '+q.id);const mediaPath=path.resolve(ROOT,decodeURIComponent(q.media.src));if(!mediaPath.startsWith(path.join(ROOT,'audio/concept-library')+path.sep)||!fs.existsSync(mediaPath))throw new Error('Missing Hub audio '+q.id);bank.questions.push(q);bank.coverage.find(row=>row.conceptId===q.conceptId).questionIds.push(q.id);}bank.retiredQuestionIds=[...(bank.retiredQuestionIds||[]),...(audio.retiredQuestionIds||[])];bank.reviewMigrations=[...(bank.reviewMigrations||[]),...(audio.reviewMigrations||[])];bank.audioShortfalls=audio.shortfalls;bank.summary={...bank.summary,audioQuestions:audio.questions.length,totalQuestions:bank.questions.length};}
 const orderPath=path.join(ROOT,'music-dictionary/quiz-data/audio-order-question-bank.json');
 if(fs.existsSync(orderPath)){const order=JSON.parse(fs.readFileSync(orderPath));for(const q of order.questions){const errors=Core.validateQuestion(q);if(errors.length||q.contentSha256!==await Core.fingerprint(q))throw new Error('Invalid audio order question '+q.id+': '+errors.join(' '));if(bank.questions.some(other=>other.id===q.id))throw new Error('Duplicate audio order ID '+q.id);for(const option of q.options){if(option.media.kind!=='audio')continue;const file=path.resolve(ROOT,decodeURIComponent(option.media.src));if(!file.startsWith(path.join(ROOT,'audio/concept-library')+path.sep)||!fs.existsSync(file))throw new Error('Missing ordering recording '+q.id);if(require('node:crypto').createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==option.media.sha256)throw new Error('Ordering recording checksum mismatch '+q.id);}bank.questions.push(q);bank.coverage.find(row=>row.conceptId===q.conceptId).questionIds.push(q.id);}bank.summary={...bank.summary,audioOrderQuestions:order.questions.length,audioQuestions:(bank.summary.audioQuestions||0)+order.questions.length,totalQuestions:bank.questions.length};}
 const destination=path.join(ROOT,'music-dictionary/quiz-bank.js'),temporary=destination+'.'+process.pid+'.tmp';
 fs.writeFileSync(temporary,'/* Generated by scripts/build-dictionary-quizzes.cjs. Editorial workspace only. */\nwindow.MUSIC_DICTIONARY_QUIZ_BANK='+JSON.stringify(bank).replace(/</g,'\\u003c')+';\n');
 fs.renameSync(temporary,destination);
 counts.questions=bank.questions.length;console.log(`Dictionary quizzes: ${counts.concepts} concepts, ${counts.questions} questions (${bank.summary?.audioQuestions||0} audio).`);
 return counts;
}
async function importReview(filename){return require('./import-dictionary-quiz-reviews.cjs').importReview(filename);}
module.exports={build,validateBank,importReview};
if(require.main===module){const args=process.argv.slice(2);(args[0]==='--import-review'&&args.length===2?importReview(args[1]):args.length?Promise.reject(new Error('Usage: node scripts/build-dictionary-quizzes.cjs [--import-review review.json]')):build()).catch(e=>{console.error(e.message);process.exitCode=1;});}
