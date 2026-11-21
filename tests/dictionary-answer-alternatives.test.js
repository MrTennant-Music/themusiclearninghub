const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),C=require('../music-dictionary/quiz-core.js'),bank=require('../music-dictionary/quiz-data/question-bank.json'),review=require('../music-dictionary/quiz-data/typed-answer-alternatives.json');
const typed=id=>bank.questions.find(q=>q.conceptId===id&&q.format==='short-answer');
test('all 297 typed answers retain reviewed alternatives and the current plain-language definitions',()=>{
 const retired=(bank.retiredQuestions||[]).filter(q=>q.format==='short-answer').length;
 assert.equal(review.questions.length+retired,297);assert.equal(new Set(review.questions.map(q=>q.questionId)).size,review.questions.length);
 const definitions=bank.questions.filter(q=>!q.options).map(q=>({id:q.id,prompt:q.prompt,canonical:q.answer.canonical,feedback:q.feedback}));
 assert.equal(crypto.createHash('sha256').update(C.stable(definitions)).digest('hex'),review.definitionBaselineSha256);
 for(const row of review.questions){const q=typed(row.conceptId);assert.equal(q.id,row.questionId);assert.equal(q.contentSha256,row.questionContentSha256);assert.equal(q.answer.matching.fuzzyMatching,false);for(const answer of row.addedVariants)assert(C.isCorrect(q,answer),q.id+': '+answer);}
});
test('common word forms, spelling mistakes and spacing variants receive credit',()=>{
 for(const [id,answers] of [
 ['MC-0034',['accompaniment','accompanying','accompany','acompanied','accompaniement','  ACCOMPANIMENT.  ']],
 ['MC-0040',['unaccompanied','without accompaniment','unacompanied']],
 ['MC-0042',['accordian']],['MC-0060',['stacatto','staccatto']],['MC-0107',['cannon']],
 ['MC-0167',['melisma']],['MC-0187',['homophony']],['MC-0188',['polyphony']],
 ['MC-0192',['a capella','acapella','acappella']],['MC-0204',['mezzo soprano']],
 ['MC-0226',['acciacatura']],['MC-0237',['obligato']],['MC-0274',['renaisance']],
 ['MC-0276',['appogiatura']],['MC-0298',['counter tenor']]])for(const answer of answers)assert(C.isCorrect(typed(id),answer),id+': '+answer);
});
test('spelling tolerance never merges distinct or opposite musical concepts',()=>{
 for(const [id,wrong] of [
 ['MC-0034','unaccompanied'],['MC-0040','accompanied'],['MC-0084','minor'],['MC-0085','major'],
 ['MC-0053','staccato'],['MC-0060','legato'],['MC-0165','perfect cadence'],['MC-0169','imperfect cadence'],
 ['MC-0187','polyphonic'],['MC-0188','homophonic'],['MC-0223','sonata form'],['MC-0254','sonata'],
 ['MC-0264','ballet'],['MC-0265','chorus'],['MC-0296','answer'],['MC-0286','subject'],
 ['MC-0277','diminished triad'],['MC-0229','diminished seventh'],['MC-0231','melodic minor'],['MC-0234','harmonic minor'],
 ['MC-0291','retrograde'],['MC-0293','inversion'],['MC-0276','acciaccatura'],['MC-0226','appoggiatura']]){const q=typed(id);if(!q){assert(bank.retiredQuestions.some(r=>r.conceptId===id&&r.format==='short-answer'),id+': missing without an explicit teacher deletion');continue;}assert(!C.isCorrect(q,wrong),id+' wrongly accepts '+wrong);}
});
