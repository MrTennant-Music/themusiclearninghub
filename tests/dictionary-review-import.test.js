'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Core=require('../music-dictionary/quiz-core.js'),text=require('../music-dictionary/quiz-data/question-bank.json'),audio=require('../music-dictionary/quiz-data/audio-question-bank.json');
const {prepareReviewImport}=require('../scripts/import-dictionary-quiz-reviews.cjs');
const envelope=records=>({schemaVersion:'1.0-concept-quiz-reviews',bankId:text.bankId,records});
test('editing accepted answers replaces the hidden main answer and reconciles old saved records',async()=>{
 const base=Core.copy(audio.questions.find(q=>q.id==='AQ-N3-MC0011-02'));
 delete base.review.finalisedAt;
 base.answer={canonical:'Chord change',acceptedVariants:['Chord change'],matching:{trim:true,collapseWhitespace:true}};
 base.contentSha256=await Core.fingerprint(base);
 const edited=Core.copy(base);edited.answer.acceptedVariants=['4','four','4 changes','4 chord changes',''];
 const saved=await Core.saveQuestion(base,edited);
 assert.equal(saved.answer.canonical,'4');assert(Core.isCorrect(saved,'four'));assert(!Core.isCorrect(saved,'Chord change'));
 const migration={id:base.id,from:base.contentSha256,to:saved.contentSha256,previous:{prompt:base.prompt,feedback:base.feedback,options:base.options,answer:base.answer}};
 const result=(await Core.applyReviews({questions:[saved],reviewMigrations:[migration]},[{id:base.id,baseContentSha256:base.contentSha256,question:base}])).get(base.id).question;
 assert.deepEqual(result.answer,saved.answer);
 const independent=Core.copy(base);independent.answer={...independent.answer,canonical:'5',acceptedVariants:['5','five']};independent.contentSha256=await Core.fingerprint(independent);
 const kept=(await Core.applyReviews({questions:[saved],reviewMigrations:[migration]},[{id:base.id,baseContentSha256:base.contentSha256,question:independent}])).get(base.id).question;
 assert.equal(kept.answer.canonical,'5');
});
test('one review export publishes both text and audio edits without changing other questions',async()=>{
 const a=text.questions[0],b=audio.questions[0],editA=await Core.saveQuestion(a,{...a,feedback:a.feedback+' Teacher edit.'}),editB=await Core.saveQuestion(b,{...b,prompt:'Listen to this excerpt and tick one box.'});
 const r=await prepareReviewImport(text,audio,envelope([{id:a.id,baseContentSha256:a.contentSha256,question:editA},{id:b.id,baseContentSha256:b.contentSha256,question:editB}]),{allowFinalisedEdits:true});
 assert.equal(r.text.questions[0].feedback,editA.feedback);assert.equal(r.audio.questions[0].prompt,editB.prompt);assert.deepEqual(r.text.questions[1],text.questions[1]);
 const again=await Core.applyReviews({...r.text,questions:[...r.text.questions,...r.audio.questions]},[{id:a.id,baseContentSha256:a.contentSha256,question:editA}]);assert.equal(again.get(a.id).baseContentSha256,r.text.questions[0].contentSha256);
});
test('deletions remove questions from both banks and coverage and survive subsequent imports',async()=>{
 const a=text.questions[0],b=audio.questions[0],records=[a,b].map(q=>({id:q.id,baseContentSha256:q.contentSha256,deleted:true,deletedAt:'2026-11-12T12:00:00Z'}));
 const r=await prepareReviewImport(text,audio,envelope(records),{allowFinalisedEdits:true});
 assert(!r.text.questions.some(q=>q.id===a.id));assert(!r.audio.questions.some(q=>q.id===b.id));assert(r.text.retiredQuestionIds.includes(a.id));assert(r.audio.retiredQuestionIds.includes(b.id));
 assert(!r.text.coverage.some(row=>row.questionIds.includes(a.id)));assert(r.text.coverage.find(row=>row.conceptId===a.conceptId).retiredQuestionIds.includes(a.id));
 await require('../scripts/build-dictionary-quizzes.cjs').validateBank(r.text);
 const again=await prepareReviewImport(r.text,r.audio,envelope(records),{allowFinalisedEdits:true});assert.equal(again.text.questions.length,r.text.questions.length);assert.equal(again.audio.questions.length,r.audio.questions.length);
 await assert.rejects(()=>Core.applyReviews(text,[{...records[0],baseContentSha256:'stale'}]),/source question has changed/);
});
test('saved teacher wording exceptions are exact and do not disable level checks',()=>{
 const {questionVocabularyErrors}=require('../scripts/quiz-question-vocabulary.cjs'),q=Core.copy(text.questions.find(q=>q.id==='CQ-N3-MC0002-01'));
 assert.deepEqual(questionVocabularyErrors(q),[]);q.prompt+=' Syncopation.';assert(questionVocabularyErrors(q).some(e=>e.includes('syncopation')));
});

test('recording swaps reconcile older browser reviews without discarding teacher wording',async()=>{
 const C=require('../music-dictionary/quiz-core.js'),bank=require('../music-dictionary/quiz-data/audio-question-bank.json');
 const base=bank.questions.find(q=>q.id==='AQ-N4-MC0078-03');
 const migration=bank.reviewMigrations.find(m=>m.id===base.id&&m.previous.media);
 assert(migration);
 const previous=C.copy(base);for(const field of ['media','factGroupId','evidence'])previous[field]=C.copy(migration.previous[field]);
 previous.prompt=migration.previous.prompt;previous.feedback=migration.previous.feedback;previous.options=C.copy(migration.previous.options);
 previous.contentSha256=await C.fingerprint(previous);assert.equal(previous.contentSha256,migration.from);
 const edited=C.copy(previous);edited.prompt='Listen to this excerpt. Name the style.';edited.contentSha256=await C.fingerprint(edited);
 const record={id:base.id,baseContentSha256:migration.from,question:edited};
 const result=(await C.applyReviews(bank,[record])).get(base.id).question;
 assert.equal(result.prompt,edited.prompt);assert.deepEqual(result.media,base.media);assert.deepEqual(result.evidence,base.evidence);assert.equal(result.factGroupId,base.factGroupId);
 const bad=C.copy(record);bad.question.evidence[0].supportingText='Unverified evidence';bad.question.contentSha256=await C.fingerprint(bad.question);
 await assert.rejects(C.applyReviews(bank,[bad]),/source metadata/);
});
test('requested stepwise recording replacement preserves saved text and finalisation',async()=>{
 const base=audio.questions.find(q=>q.id==='AQ-N3-MC0019-02'),migration=audio.reviewMigrations.find(m=>m.id===base.id&&m.userRequestedAudioReplacement&&m.previous.media.recording.includes('ABBA'));
 assert(migration);assert.match(base.media.recording,/Joy To The World/);
 const previous=Core.copy(base);for(const field of ['media','factGroupId','evidence'])previous[field]=Core.copy(migration.previous[field]);
 previous.prompt='My stepwise listening question.';previous.review={...previous.review,finalisedAt:'2026-11-13T12:00:00.000Z'};previous.contentSha256=await Core.fingerprint(previous);
 const result=(await Core.applyReviews(audio,[{id:base.id,baseContentSha256:migration.from,question:previous}])).get(base.id).question;
 assert.equal(result.prompt,previous.prompt);assert.deepEqual(result.answer,previous.answer);assert.deepEqual(result.feedback,previous.feedback);assert.equal(result.review.finalisedAt,previous.review.finalisedAt);assert.deepEqual(result.media,base.media);
});

test('confirmed corrections still migrate when they restore the original source checksum',async()=>{
 const C=require('../music-dictionary/quiz-core'),q=C.copy(require('../music-dictionary/quiz-data/question-bank.json').questions.find(q=>q.id==='CQ-AH-MC0283-F02')),edited=C.copy(q);
 edited.options.find(o=>o.id==='a').text='D-sharp and G';edited.contentSha256=await C.fingerprint(edited);
 const migration={id:q.id,from:q.contentSha256,to:q.contentSha256,teacherAuthorizedCorrection:true,previousReviewedContentSha256:edited.contentSha256,teacherCorrections:{options:[{id:'a',from:'D-sharp and G',to:'C and F-sharp'}]}};
 const restored=(await C.applyReviews({questions:[q],reviewMigrations:[migration]},[{id:q.id,baseContentSha256:q.contentSha256,question:edited}])).get(q.id).question;
 assert.equal(restored.options.find(o=>o.id==='a').text,'C and F-sharp');assert.deepEqual(restored.answer,q.answer);assert.deepEqual(restored.review,q.review);assert.equal(restored.contentSha256,await C.fingerprint(restored));
 const later=C.copy(edited);later.prompt+=' Teacher revision.';later.contentSha256=await C.fingerprint(later);
 const kept=(await C.applyReviews({questions:[q],reviewMigrations:[migration]},[{id:q.id,baseContentSha256:q.contentSha256,question:later}])).get(q.id).question;assert.equal(kept.options.find(o=>o.id==='a').text,'D-sharp and G');
});
