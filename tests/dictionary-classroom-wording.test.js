'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../music-dictionary/quiz-core.js'),{revise}=require('../scripts/revise-dictionary-quiz-wording.cjs');
const text=require('../music-dictionary/quiz-data/question-bank.json'),audio=require('../music-dictionary/quiz-data/audio-question-bank.json'),selection=require('../music-dictionary/quiz-data/audio-library-selection.json'),audit=require('../music-dictionary/quiz-data/classroom-wording-audit.json');
test('classroom revisions exclude every protected teacher record',()=>{
 const protectedIds=new Set(audit.protectedQuestions);
 for(const change of audit.changes)assert(!protectedIds.has(change.id),change.id);
 const source=text.questions.find(q=>q.id==='CQ-N3-MC0018-01'),draft=C.copy(source);
 draft.prompt='Keep this exact teacher wording.';
 assert.deepEqual(revise(draft,new Set([draft.id]),selection),draft);
 draft.review={updatedAt:'2026-11-12T20:00:00Z'};
 assert.deepEqual(revise(draft,new Set(),selection),draft);
});
test('clearer wording preserves marking, identity and the recording',()=>{
 for(const change of audit.changes){
  const q=[...text.questions,...audio.questions].find(q=>q.id===change.id);
  if(!q)continue; // Historical audit can include explicitly retired questions.
  const next=revise(q,new Set(),selection);
  for(const field of ['id','conceptId','levelCode','format','answer','media','evidence'])assert.deepEqual(next[field],q[field],q.id+': '+field);
 }
});
test('related audio choices remain within level and exclude compatible recording concepts',()=>{
 const {audioOverlapErrors}=require('../scripts/quiz-distractor-overlap.cjs');
 const {questionVocabularyErrors}=require('../scripts/quiz-question-vocabulary.cjs');
 for(const q of audio.questions.filter(q=>q.editorialCheck?.classroomWording)){
  assert.deepEqual(audioOverlapErrors(q,selection.entries),[],q.id);
  assert.deepEqual(questionVocabularyErrors(q),[],q.id);
 }
 const group=audio.questions.filter(q=>q.conceptId==='MC-0070'&&q.options&&!audit.protectedQuestions.includes(q.id));
 for(const q of group)assert(q.options.some(o=>o.text==='Romantic'));
});
