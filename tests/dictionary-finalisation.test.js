'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../music-dictionary/quiz-core.js');
const bank=require('../music-dictionary/quiz-data/question-bank.json');
test('teacher finalisation survives saving, exporting and applying a browser review',async()=>{
 const base=bank.questions[0],edited=C.copy(base);edited.review={...edited.review,finalisedAt:'2026-11-12T12:00:00.000Z'};
 const saved=await C.saveQuestion(base,edited),records=JSON.parse(JSON.stringify([{id:base.id,baseContentSha256:base.contentSha256,question:saved}]));
 const applied=await C.applyReviews(bank,records);assert.equal(applied.get(base.id).question.review.finalisedAt,edited.review.finalisedAt);
 const unlocked=C.copy(saved);delete unlocked.review.finalisedAt;const next=await C.saveQuestion(saved,unlocked);assert.equal(next.review.finalisedAt,undefined);
});
test('automatic wording migration cannot rewrite a finalised browser question',async()=>{
 const base=C.copy(bank.questions[0]),locked=C.copy(base);locked.review={...locked.review,finalisedAt:'2026-11-12T12:00:00.000Z'};
 base.prompt+=' Updated source wording.';base.contentSha256=await C.fingerprint(base);
 const migrated={...bank,questions:[base],reviewMigrations:[{id:base.id,from:locked.contentSha256,to:base.contentSha256,previous:{prompt:locked.prompt}}]};
 await assert.rejects(C.applyReviews(migrated,[{id:locked.id,baseContentSha256:locked.contentSha256,question:locked}]),/Finalised question/);
});
test('AI wording helpers skip finalised questions even without an edit timestamp',()=>{
 const text=C.copy(bank.questions[0]);text.review={finalisedAt:'2026-11-12T12:00:00.000Z'};
 assert.deepEqual(require('../scripts/revise-dictionary-quiz-wording.cjs').revise(text,new Set()),text);
 const audio=C.copy(require('../music-dictionary/quiz-data/audio-question-bank.json').questions[0]);audio.review={finalisedAt:'2026-11-12T12:00:00.000Z'};
 assert.deepEqual(require('../scripts/quiz-listening-focus.cjs').refineListeningQuestion(audio,{entries:[]}),audio);
});
test('project imports reject automatic changes to locked questions',async()=>{
 const text=C.copy(bank),audio=require('../music-dictionary/quiz-data/audio-question-bank.json'),base=text.questions[0];base.review={...base.review,finalisedAt:'2026-11-12T12:00:00.000Z'};
 const edited=C.copy(base);edited.feedback+=' Changed automatically.';edited.contentSha256=await C.fingerprint(edited);
 const review={schemaVersion:'1.0-concept-quiz-reviews',bankId:text.bankId,records:[{id:base.id,baseContentSha256:base.contentSha256,question:edited}]};
 await assert.rejects(require('../scripts/import-dictionary-quiz-reviews.cjs').prepareReviewImport(text,audio,review),/Finalised question is locked/);
});
