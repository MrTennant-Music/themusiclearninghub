'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const text=require('../music-dictionary/quiz-data/question-bank.json'),audio=require('../music-dictionary/quiz-data/audio-question-bank.json');
test('March questions teach the Scottish dance context and the workbook four-beat example',()=>{
 const questions=[...text.questions,...audio.questions].filter(q=>q.conceptId==='MC-0027');assert.equal(questions.length,6);
 for(const q of questions.filter(q=>!q.review?.updatedAt)){assert.match(q.prompt,/Scottish/);assert.match(q.feedback,/Scottish dance music/);assert(!/soldiers|military|procession/i.test(q.prompt+' '+q.feedback));}
 const choice=questions.find(q=>q.id==='CQ-N3-MC0027-Q02');assert.match(choice.options.find(o=>choice.answer.correctOptionIds.includes(o.id)).text,/four-beat/);
});
test('March audio uses Scottish recordings instead of generic orchestral marches',()=>{
 const questions=audio.questions.filter(q=>q.conceptId==='MC-0027');assert.equal(questions.length,3);
 assert.match(questions[0].media.recording,/Steve Kendall/);assert.match(questions[1].media.recording,/Scotland The Brave/);assert.match(questions[2].media.recording,/4-4 Marches/);
 assert.equal(new Set(questions.map(q=>q.media.sha256)).size,3);
});
