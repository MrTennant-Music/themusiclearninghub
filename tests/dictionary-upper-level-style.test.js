'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../music-dictionary/quiz-core'),D=require('../music-dictionary/music-concepts-data');
const A=require('../scripts/adapt-upper-quiz-questions.cjs');
const audit=require('../music-dictionary/quiz-data/upper-level-style-audit.json');
const policy=require('../music-dictionary/quiz-data/upper-level-editorial-policy.json');
const text=require('../music-dictionary/quiz-data/question-bank.json'),audio=require('../music-dictionary/quiz-data/audio-question-bank.json'),selection=require('../music-dictionary/quiz-data/audio-library-selection.json');
const all=[...text.questions,...audio.questions],byId=new Map(all.map(q=>[q.id,q]));
test('upper-level adaptation never includes N3 or teacher-protected questions',()=>{
 const protectedIds=new Set(audit.protectedIds);
 for(const row of [...audit.changes,...audit.retired])assert(!protectedIds.has(row.id),row.id);
 for(const row of audit.changes)assert.notEqual(row.level,'N3');
 for(const q of all.filter(q=>q.levelCode==='N3'||q.review?.updatedAt||q.review?.finalisedAt))assert(A.protectedQuestion(q,new Set()),q.id);
 const q=C.copy(audio.questions.find(q=>q.levelCode==='N5'));assert(A.protectedQuestion(q,new Set([q.id])));
});
test('retired descriptions are recoverable and their concepts retain questions',()=>{
 for(const row of audit.retired){
  assert(!byId.has(row.id),row.id);
  assert(text.retiredQuestionIds.includes(row.id));
  assert.equal(row.question.id,row.id);
  assert(all.some(q=>q.conceptId===row.question.conceptId&&q.modality==='audio')||audio.retiredQuestions.some(q=>q.conceptId===row.question.conceptId&&q.deletedAt),'Missing audio questions must be an explicit teacher deletion');
  assert(all.some(q=>q.conceptId===row.question.conceptId&&q.modality==='text')||text.retiredQuestions.some(q=>q.conceptId===row.question.conceptId&&q.deletedAt),'Missing active text questions must be an explicit teacher deletion');
 }
});
test('new alternatives stay within the taught level and exclude known recording overlap',()=>{
 const {questionVocabularyErrors}=require('../scripts/quiz-question-vocabulary.cjs');
 const {audioOverlapErrors}=require('../scripts/quiz-distractor-overlap.cjs');
 for(const row of audit.changes){const q=byId.get(row.id);if(!q||q.review?.updatedAt)continue;
  assert.deepEqual(questionVocabularyErrors(q),[],q.id);
  if(q.modality==='audio')assert.deepEqual(audioOverlapErrors(q,selection.entries),[],q.id);
  if(q.options){assert.equal(new Set(q.options.map(o=>o.text.toLowerCase())).size,q.options.length,q.id);assert.equal(q.answer.correctOptionIds.length,q.format==='multi-select'?2:1,q.id);}
 }
});
test('related earlier alternatives outrank unrelated same-level terms',()=>{
 const q={id:'test-voice',conceptId:'MC-0300',levelCode:'AH',media:{src:'audio/concept-library/test.wav'}};
 const s={entries:[{path:q.media.src,conceptId:q.conceptId,sha256:'test',recording:'',taggedConcepts:[]}]};
 const choices=A.audioCandidates(q,s).slice(0,3);
 assert(choices.includes('MC-0257')); // Coloratura: relevant Higher vocal technique.
 assert(choices.includes('MC-0222')); // Recitative: relevant Higher vocal delivery.
 assert(!choices.includes('MC-0270')); // Motet is AH but is a work, not a technique.
 const wind={...q,id:'test-wind',conceptId:'MC-0205',levelCode:'N5'};
 s.entries[0].conceptId=wind.conceptId;
 const winds=A.audioCandidates(wind,s);
 const own=winds.filter(id=>D.concepts.find(c=>c.id===id).level===D.levels[2]);
 assert(own.length>=2);assert(own.every(id=>winds.indexOf(id)<2));
});
test('specialist Higher concepts retain their own meanings',()=>{
 const correct=n=>policy.multiSelect['MC-'+String(n).padStart(4,'0')].correct.join(' ');
 assert.match(correct(248),/bass instrument.*chordal instrument/i);
 assert.match(correct(251),/introduces.*subjects/i);
 assert.match(correct(252),/bass pattern.*varied/i);
 assert.match(correct(254),/exposition.*recapitulation/i);
 assert.match(correct(255),/main musical theme/i);
 assert.match(correct(257),/voice.*arpeggios.*trills/i);
 assert.match(correct(259),/string.*touched lightly/i);
});
