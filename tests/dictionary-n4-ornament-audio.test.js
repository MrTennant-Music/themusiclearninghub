'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../music-dictionary/quiz-core.js'),bank=require('../music-dictionary/quiz-data/audio-question-bank.json'),selection=require('../music-dictionary/quiz-data/audio-library-selection.json');
test('all National 4 Ornament audio examples use existing trill recordings',()=>{
 const qs=bank.questions.filter(q=>q.conceptId==='MC-0087'),trills=selection.entries.filter(e=>e.conceptId==='MC-0174');assert.equal(qs.length,3);
 for(const q of qs){assert(trills.some(e=>e.sha256===q.media.sha256));assert.equal(q.levelCode,'N4');assert(q.options?q.options.some(o=>q.answer.correctOptionIds.includes(o.id)&&o.text==='Ornament'):q.answer.canonical==='Ornament');}
});
test('trill replacements preserve saved wording and finalisation from earlier audio sources',async()=>{
 for(const id of ['AQ-N4-MC0087-01','AQ-N4-MC0087-02']){
  const current=bank.questions.find(q=>q.id===id),migration=bank.reviewMigrations.findLast(m=>m.id===id&&m.userRequestedAudioReplacement),old=C.copy(current);Object.assign(old,C.copy(migration.previous));old.contentSha256=await C.fingerprint(old);
  const stored=C.copy(old);stored.prompt='My reviewed listening question.';stored.review={...stored.review,finalisedAt:'2026-11-14T10:00:00.000Z'};stored.contentSha256=await C.fingerprint(stored);
  const result=await C.applyReviews(bank,[{id,baseContentSha256:migration.from,question:stored}]),q=result.get(id).question;
  assert.equal(q.prompt,stored.prompt);assert.deepEqual(q.answer,stored.answer);assert.equal(q.review.finalisedAt,stored.review.finalisedAt);assert.deepEqual(q.media,current.media);
 }
});
