'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../music-dictionary/quiz-core'),text=require('../music-dictionary/quiz-data/question-bank.json'),audio=require('../music-dictionary/quiz-data/audio-question-bank.json'),all=[...text.questions,...audio.questions],get=id=>all.find(q=>q.id===id);
test('reviewed N3 corrections remove typographical errors and ambiguous instructions',()=>{
 assert.equal(get('AQ-N3-MC0042-01').options.find(o=>o.id==='d').text,'Bagpipes');assert.equal(get('AQ-N3-MC0054-03').options.find(o=>o.id==='b').text,'Scottish dance band');
 assert.match(get('CQ-N3-MC0054-Q03').prompt,/four main orchestral families/);assert(!get('CQ-N3-MC0062-Q03').options.some(o=>o.text==='Piano'));assert(!get('CQ-N3-MC0058-Q03').options.some(o=>o.text==='Piano'));
 const acoustic=get('CQ-N3-MC0043-Q03');assert.deepEqual(acoustic.answer.correctOptionIds,['a','f']);assert.match(acoustic.options.find(o=>o.id==='a').text,/plucked or strummed/);assert(!/steel|6 strings/i.test(acoustic.feedback));
 for(const id of ['AQ-N3-MC0022-02','AQ-N3-MC0023-02'])assert.match(get(id).prompt,/Italian term/);
 assert(!get('CQ-N3-MC0041-Q02').options.some(o=>/polyphony/i.test(o.text)));assert(!/dissonance/.test(get('AQ-N3-MC0013-02').prompt));
});
test('authorised corrections reach finalised browser records while preserving later teacher changes',async()=>{
 const current=get('CQ-N3-MC0049-Q03'),migration=text.reviewMigrations.find(m=>m.id===current.id&&m.teacherCorrections?.options?.some(o=>o.to==='It is made of different types of drums and cymbals'));
 assert(migration?.teacherAuthorizedCorrection);const old=C.copy(current);old.options.find(o=>o.id==='d').text=migration.teacherCorrections.options.find(o=>o.id==='d').from;old.contentSha256=await C.fingerprint(old);
 const record={id:old.id,baseContentSha256:migration.from,question:old};const result=await C.applyReviews(text,[record]),corrected=result.get(old.id).question;assert.equal(corrected.options.find(o=>o.id==='d').text,current.options.find(o=>o.id==='d').text);assert.equal(corrected.review.finalisedAt,old.review.finalisedAt);
 const later=C.copy(record);later.question.options.find(o=>o.id==='d').text='My later teacher wording';later.question.contentSha256=await C.fingerprint(later.question);const kept=(await C.applyReviews(text,[later])).get(old.id).question;assert.equal(kept.options.find(o=>o.id==='d').text,'My later teacher wording');
});
