'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../music-dictionary/quiz-core.js');
const A=require('../scripts/adapt-n4-review-to-upper-levels.cjs'),text=require('../music-dictionary/quiz-data/question-bank.json'),audio=require('../music-dictionary/quiz-data/audio-question-bank.json'),selection=require('../music-dictionary/quiz-data/audio-library-selection.json');
const empty={schemaVersion:'1.0-concept-quiz-reviews',bankId:text.bankId,records:[]};
test('N4 adaptation protects every lower-level question and all edited or finalised upper questions',()=>{
 const q=audio.questions.find(q=>q.levelCode==='N5'),guard=A.protection(empty,[text,audio]);
 for(const levelCode of ['N3','N4'])assert(A.isProtected({...q,levelCode},guard));
 assert(A.isProtected({...q,review:{updatedAt:'2026-11-14T12:00:00Z'}},guard));
 assert(A.isProtected({...q,review:{finalisedAt:'2026-11-14T12:00:00Z'}},guard));
 assert(A.isProtected(q,A.protection({...empty,records:[{id:q.id}]},[text,audio])));
 const record={kind:'concept-review',id:'concept:'+q.conceptId,conceptId:q.conceptId,finalisedAt:'2026-11-14T12:00:00Z',excludeFromGeneration:true};
 // A concept tick protects current and later questions even when no question IDs were saved.
 const locked=A.protection({...empty,records:[record]},[{questions:[],conceptReviews:[]}]);assert(A.isProtected(q,locked));
 assert(A.isProtected(q,A.protection(empty,[{questions:[],conceptReviews:[record]}])));
});
test('preparing changes cannot mutate a protected question or create a retirement for its concept',async()=>{
 const q=C.copy(text.questions.find(q=>q.levelCode==='N5'&&q.options)),other=C.copy(q);other.id+='-protected';other.review={updatedAt:'2026-11-14T12:00:00Z'};
 const bank={bankId:text.bankId,questions:[other]},before=C.stable(bank);
 const result=await A.prepare(empty,[bank,{questions:[]}],selection);assert.deepEqual(result.review.records,[]);assert.equal(C.stable(bank),before);
 const conceptLock={...empty,records:[{id:'concept:'+q.conceptId,kind:'concept-review',conceptId:q.conceptId,finalisedAt:'2026-11-14T12:00:00Z'}]};
 assert.deepEqual((await A.prepare(conceptLock,[{bankId:text.bankId,questions:[q]},{questions:[]}],selection)).review.records,[]);
});
test('musical relevance permits earlier brass instruments rather than unrelated same-level terms',()=>{
 const q=audio.questions.find(q=>q.conceptId==='MC-0202'&&q.options),alternatives=A.selectAlternatives(q,selection);
 assert(alternatives);assert.deepEqual(new Set(alternatives.ids),new Set(['MC-0212','MC-0139','MC-0140']));
});
test('written revisions retain marking answers and audio revisions retain media and timings',()=>{
 for(const q of [...text.questions,...audio.questions].filter(q=>['N5','H','AH'].includes(q.levelCode))){
  const next=q.modality==='audio'?A.reviseAudio(q,selection):A.reviseText(q);
  for(const field of ['answer','media','review','evidence','factGroupId'])assert.equal(C.stable(next[field]),C.stable(q[field]),q.id+' '+field);
 }
});
test('published N4-led revisions match their audit and retired duplicates remain recoverable',()=>{
 const audit=require('../music-dictionary/quiz-data/n4-upper-level-audit.json'),all=new Map([...text.questions,...audio.questions].map(q=>[q.id,q]));
 for(const row of audit.changes){const q=all.get(row.id);if(!q||q.review?.updatedAt||q.review?.finalisedAt)continue;assert.equal(q.contentSha256,row.afterSha256,row.id);for(const field of row.fields)assert.equal(C.stable(q[field.field]),C.stable(field.after),row.id+' '+field.field);}
 for(const row of audit.retired){assert(!all.has(row.id));assert.equal(row.question.id,row.id);assert(text.retiredQuestionIds.includes(row.id));assert([...all.values()].some(q=>q.conceptId===row.question.conceptId&&q.modality==='audio'));}
});
