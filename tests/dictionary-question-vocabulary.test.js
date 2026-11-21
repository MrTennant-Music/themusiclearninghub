'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../music-dictionary/quiz-core.js'),{unfamiliarTerms,questionVocabularyErrors}=require('../scripts/quiz-question-vocabulary.cjs');
const text=require('../music-dictionary/quiz-data/question-bank.json'),audio=require('../music-dictionary/quiz-data/audio-question-bank.json');
test('vocabulary checks cover prompts, correct choices and feedback at every level',()=>{
 for(const q of [...text.questions,...audio.questions])assert.deepEqual(questionVocabularyErrors(q),[],q.id);
 const jazz=C.copy(text.questions.find(q=>q.id==='CQ-N3-MC0002-L01'));
 jazz.options.find(o=>jazz.answer.correctOptionIds.includes(o.id)).text='Syncopation';
 assert(questionVocabularyErrors(jazz).some(e=>e.includes('syncopation')));
 jazz.prompt='Listen for compound-time rhythms.';assert(questionVocabularyErrors(jazz).some(e=>e.includes('compound time')));
 jazz.feedback='Listen for drones.';assert(questionVocabularyErrors(jazz).some(e=>e.includes('drone')));
 assert(unfamiliarTerms('Rubato and chromatic harmony','N4').length===2);
 assert.deepEqual(unfamiliarTerms('Rubato and chromatic harmony','N5'),[]);
 assert.deepEqual(unfamiliarTerms("Rock 'n' roll and rock and roll. Players take turns.",'N3'),[]);
});
test('N3 listening features use N3 names rather than requiring a later concept',()=>{
 const jazz=text.questions.find(q=>q.id==='CQ-N3-MC0002-L01'),pipes=text.questions.find(q=>q.id==='CQ-N3-MC0044-Q02');
 assert.equal(jazz.options.find(o=>jazz.answer.correctOptionIds.includes(o.id)).text,'Off the beat');
 assert.equal(pipes.options.find(o=>pipes.answer.correctOptionIds.includes(o.id)).text,'Long held notes');
});
test('known wording revisions reconcile saved edits without overwriting teacher changes',async()=>{
 const base=text.questions.find(q=>q.id==='CQ-N3-MC0002-L01'),revision=text.reviewMigrations.find(m=>m.id===base.id);
 const old=C.copy(base);delete old.review.finalisedAt;old.prompt=revision.previous.prompt;old.feedback=revision.previous.feedback;old.options=C.copy(revision.previous.options);
 old.prompt='My saved jazz question. Tick ONE box.';old.contentSha256=await C.fingerprint(old);
 const record={id:base.id,baseContentSha256:revision.from,question:old},saved=(await C.applyReviews(text,[record])).get(base.id);
 assert.equal(saved.question.prompt,old.prompt);assert.equal(saved.question.feedback,old.feedback);
 assert.equal(saved.question.options.find(o=>o.id==='c').text,old.options.find(o=>o.id==='c').text);
 assert.equal(saved.baseContentSha256,base.contentSha256);assert.equal(saved.question.contentSha256,await C.fingerprint(saved.question));
 assert.equal(record.baseContentSha256,revision.from); // Do not mutate the browser's recovery copy.
 await assert.rejects(()=>C.applyReviews(text,[{...record,baseContentSha256:'unrecognised'}]),/source question has changed/);
 const tampered=C.copy(record);tampered.question.feedback='tampered';await assert.rejects(()=>C.applyReviews(text,[tampered]),/checksum/);
});
