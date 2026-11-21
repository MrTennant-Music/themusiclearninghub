'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../music-dictionary/quiz-core'),bank=require('../music-dictionary/quiz-data/audio-question-bank.json');
test('recording replacements migrate saved source metadata using checksums while preserving teacher wording',async()=>{
 const current=C.copy(bank.questions.find(q=>q.conceptId==='MC-0052'&&q.format==='short-answer')),old=C.copy(current);old.media={...old.media,src:'./removed-recording.m4a',recording:'Removed recording'};old.contentSha256=await C.fingerprint(old);
 const stored=C.copy(old);stored.prompt='My saved listening question.';stored.contentSha256=await C.fingerprint(stored);
 const migration={id:current.id,from:old.contentSha256,to:current.contentSha256,userRequestedAudioReplacement:true,previous:{},previousFieldHashes:{media:await C.fingerprint({value:old.media})}};
 const result=await C.applyReviews({questions:[current],reviewMigrations:[migration]},[{id:old.id,baseContentSha256:old.contentSha256,question:stored}]);const saved=result.get(old.id).question;
 assert.equal(saved.prompt,stored.prompt);assert.deepEqual(saved.answer,stored.answer);assert.deepEqual(saved.media,current.media);
});
