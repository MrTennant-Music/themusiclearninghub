'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../music-dictionary/quiz-core');
const text=require('../music-dictionary/quiz-data/question-bank.json'),audio=require('../music-dictionary/quiz-data/audio-question-bank.json');
const id='MC-0081',record={kind:'concept-review',id:'concept:'+id,conceptId:id,finalisedAt:'2026-11-13T12:00:00.000Z',excludeFromGeneration:true,updatedAt:'2026-11-13T12:00:00.000Z'};
test('empty concept finalisation persists without a synthetic question',async()=>{
 const bank={questions:[],coverage:[{conceptId:id}]};
 const records=await C.applyReviews(bank,JSON.parse(JSON.stringify([record])));
 assert(C.conceptIsFinalised(bank,records,id,[]));
 const saved={...bank,conceptReviews:[records.get(record.id)]};
 assert(C.conceptIsFinalised(saved,new Map(),id,[]));assert.equal(C.canGenerateForConcept(saved,id),false);assert.equal(C.canGenerateForConcept(saved,'MC-0082'),true);
 const unlocked={...record,finalisedAt:null,excludeFromGeneration:false};
 const refreshed=await C.applyReviews(saved,[unlocked]);assert.equal(C.conceptIsFinalised(saved,refreshed,id,[]),false);
 assert(C.canGenerateForConcept({...bank,conceptReviews:[unlocked]},id));
});
test('project import retains concept-level decisions separately from question edits',async()=>{
 const review={schemaVersion:'1.0-concept-quiz-reviews',bankId:text.bankId,records:[record]};
 const result=await require('../scripts/import-dictionary-quiz-reviews.cjs').prepareReviewImport(text,audio,review,{allowFinalisedEdits:true});
 assert.deepEqual(result.text.conceptReviews.find(r=>r.conceptId===id),record);
 assert.deepEqual(result.text.questions,text.questions);assert.deepEqual(result.audio.questions,audio.questions);
});
test('invalid concept decisions are rejected rather than silently losing the lock',async()=>{
 await assert.rejects(C.applyReviews(text,[{...record,conceptId:'missing'}]),/Unknown/);
 await assert.rejects(C.applyReviews(text,[{...record,finalisedAt:null}]),/Invalid/);
});
test('editor finalises an empty concept with one durable concept record',async()=>{
 const source=fs.readFileSync('music-dictionary/quiz-review.js','utf8'),start=source.indexOf(' async function finaliseConcept('),end=source.indexOf('\n async function removeQuestion',start);
 let saved;const ctx={C,busy:false,ready:true,concept:{id},leave:async()=>true,setBusy:()=>{},recordsRef:{current:new Map()},effective:[],form:null,formRef:{current:null},baseById:new Map(),persist:async next=>{saved=next;},dirtyRef:{current:false},setDirty:()=>{},setMessage:()=>{}};
 vm.runInNewContext(source.slice(start,end)+';this.toggle=finaliseConcept;',ctx);await ctx.toggle(true);
 assert.equal(saved.size,1);assert.equal(saved.get(record.id).excludeFromGeneration,true);assert(saved.get(record.id).finalisedAt);
 ctx.recordsRef.current=saved;await ctx.toggle(false);assert.equal(saved.get(record.id).excludeFromGeneration,false);
 assert(source.includes('checked:isFinalised(concept.id),disabled:busy||!ready,'));
});
test('catalogue generation honours the empty concept exclusion before constructing questions',()=>{
 const source=fs.readFileSync('scripts/build-quiz-audio-bank.cjs','utf8');
 assert(source.indexOf('!C.canGenerateForConcept(text,concept.id)')<source.indexOf('for(const [i,e] of entries.entries())'));
});
test('an imported empty concept stays excluded and rejects later generated content',async()=>{
 const questions=[...text.questions,...audio.questions].filter(q=>q.conceptId===id);
 const review={schemaVersion:'1.0-concept-quiz-reviews',bankId:text.bankId,records:[...questions.map(q=>({id:q.id,baseContentSha256:q.contentSha256,deleted:true,deletedAt:record.updatedAt})),record]};
 const {text:saved,audio:savedAudio}=await require('../scripts/import-dictionary-quiz-reviews.cjs').prepareReviewImport(text,audio,review,{allowFinalisedEdits:true});
 assert(![...saved.questions,...savedAudio.questions].some(q=>q.conceptId===id));
 await require('../scripts/build-dictionary-quizzes.cjs').validateBank(saved);
 saved.questions.push(C.copy(questions.find(q=>q.modality==='text')));
 await assert.rejects(require('../scripts/build-dictionary-quizzes.cjs').validateBank(saved),/Finalised empty concept/);
});
