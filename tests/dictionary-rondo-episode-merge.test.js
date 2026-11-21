'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../music-dictionary/quiz-core'),D=require('../music-dictionary/music-concepts-data');
const text=require('../music-dictionary/quiz-data/question-bank.json'),audio=require('../music-dictionary/quiz-data/audio-question-bank.json');
const label='Rondo/ABACA — episode';
test('Episode is taught inside Rondo and cannot return as a standalone concept or quiz target',()=>{
 assert.equal(D.concepts.find(c=>c.id==='MC-0189').name,label);
 assert(!D.concepts.some(c=>c.id==='MC-0185'));assert(!Object.values(D.tables).flat(2).includes('MC-0185'));
 assert.equal(D.conceptRedirects['MC-0185'],'MC-0189');
 for(const bank of [text,audio]){assert(!bank.questions.some(q=>q.conceptId==='MC-0185'));assert(!bank.questions.some(q=>q.options?.some(o=>o.conceptId==='MC-0185')));assert.equal(bank.retiredQuestions.filter(q=>q.conceptId==='MC-0185').length,3);}
 const q=text.questions.find(q=>q.conceptId==='MC-0189'&&!q.options);assert(C.isCorrect(q,label));assert(C.isCorrect(q,'Rondo'));assert(!C.isCorrect(q,'Episode'));
});
test('standalone Episode audio is removed while the renamed Rondo library remains playable',()=>{
 const catalog=require('../audio-concept-library-data.json'),selection=require('../music-dictionary/quiz-data/audio-library-selection.json');
 assert(!catalog.concepts.some(c=>c.concept==='Episode'));assert(!selection.entries.some(e=>e.conceptId==='MC-0185'));
 const r=catalog.concepts.find(c=>c.concept===label);assert(r);assert.match(r.path,/Rondo - ABACA - Episode$/);assert.equal(r.files.length,6);
 assert(!fs.existsSync(path.join(__dirname,'../audio/concept-library/03. National 5/04. Texture, Structure and Form/Episode')));
 for(const q of audio.questions.filter(q=>q.conceptId==='MC-0189'))assert(fs.existsSync(path.resolve(__dirname,'..',decodeURIComponent(q.media.src))));
});
test('retired concept ticks are ignored without finalising the combined concept',async()=>{
 const records=[{id:'concept:MC-0185',kind:'concept-review',conceptId:'MC-0185',finalisedAt:'2026-11-14T12:00:00Z',excludeFromGeneration:true}];
 const result=await C.applyReviews(text,records);assert.equal(result.size,0);
});
test('explicit concept-option corrections preserve locked teacher wording and the correct answer',async()=>{
 const old=C.copy(audio.questions.find(q=>q.options?.some(o=>o.conceptId==='MC-0189')&&q.conceptId!=='MC-0189'));
 const current=C.copy(old),option=old.options.find(o=>o.conceptId==='MC-0189');option.conceptId='MC-0185';option.text='Episode';old.contentSha256=await C.fingerprint(old);
 const edit=C.copy(old);edit.prompt='Teacher’s own question wording. Tick one box.';edit.review={finalisedAt:'2026-11-14T12:00:00Z'};edit.contentSha256=await C.fingerprint(edit);
 const target=current.options.find(o=>o.id===option.id);
 const bank={questions:[current],reviewMigrations:[{id:old.id,from:old.contentSha256,to:current.contentSha256,sourceMetadataOnly:true,teacherAuthorizedCorrection:true,previous:{},teacherCorrections:{options:[{id:option.id,from:'Episode',to:target.text,fromConceptId:'MC-0185',toConceptId:target.conceptId}]}}]};
 const restored=(await C.applyReviews(bank,[{id:old.id,baseContentSha256:old.contentSha256,question:edit}])).get(old.id).question;
 assert.equal(restored.prompt,edit.prompt);assert.deepEqual(restored.answer,edit.answer);assert.deepEqual(restored.review,{editorialNotes:'',...edit.review});assert.deepEqual(restored.options,current.options);
});

test('cached editor records repair retired option IDs without changing the displayed choice or teacher wording',async()=>{
 const current=C.copy(audio.questions.find(q=>q.conceptId==='MC-0183'&&q.options?.some(o=>o.conceptId==='MC-0189'))),saved=C.copy(current);
 saved.options.find(o=>o.conceptId==='MC-0189').conceptId='MC-0185';saved.prompt='Teacher wording retained. Tick one box.';saved.contentSha256=await C.fingerprint(saved);
 const result=(await C.applyReviews({questions:[current],retiredConceptIds:['MC-0185']},[{id:current.id,baseContentSha256:current.contentSha256,question:saved}])).get(current.id).question;
 assert.equal(result.prompt,saved.prompt);assert.deepEqual(result.options,current.options);assert.deepEqual(result.answer,saved.answer);assert(!result.relatedConceptIds.includes('MC-0185'));assert.equal(result.contentSha256,await C.fingerprint(result));
});
