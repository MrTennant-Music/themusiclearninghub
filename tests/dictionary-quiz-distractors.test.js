const test=require('node:test'),assert=require('node:assert/strict');
const {overlaps,recordingConcepts,allowedDistractor,audioOverlapErrors}=require('../scripts/quiz-distractor-overlap.cjs');
const audio=require('../music-dictionary/quiz-data/audio-question-bank.json');
const selection=require('../music-dictionary/quiz-data/audio-library-selection.json');
test('periods, subgenres, families and equivalent terms cannot compete as audio answers',()=>{
 for(const [a,b] of [
  ['MC-0274','MC-0269'],['MC-0274','MC-0273'],['MC-0274','MC-0268'],
  ['MC-0002','MC-0266'],['MC-0008','MC-0146'],['MC-0063','MC-0141'],
  ['MC-0047','MC-0140'],['MC-0046','MC-0193'],['MC-0184','MC-0188'],
  ['MC-0081','MC-0168'],['MC-0040','MC-0192'],['MC-0264','MC-0269']
 ]){assert(overlaps(a,b));assert(overlaps(b,a));assert(!allowedDistractor(a,b));}
 assert(allowedDistractor('MC-0274','MC-0267'));
 assert(allowedDistractor('MC-0263','MC-0270'),'unrelated sibling forms remain distinct');
});
test('recording titles and all tags for the same audio exclude additional valid answers',()=>{
 const entry={conceptId:'MC-0274',sha256:'same',recording:'A galliard for viols',taggedConcepts:['Renaissance']};
 const known=recordingConcepts(entry,[{...entry,conceptId:'MC-0297',taggedConcepts:['Consort']}]);
 assert(known.has('MC-0268'));assert(known.has('MC-0297'));
 assert(!allowedDistractor('MC-0274','MC-0297',known));
});
test('every generated audio distractor passes the compatibility sweep',()=>{
 assert.equal(audio.questions.length+(audio.retiredQuestions||[]).length,887);
 for(const q of audio.questions)assert.deepEqual(audioOverlapErrors(q,selection.entries),[],q.id);
});
test('validation catches a reintroduced Renaissance distractor beside a Renaissance form',()=>{
 const q=structuredClone(audio.questions.find(q=>q.conceptId==='MC-0269'&&q.options));
 const wrong=q.options.find(o=>!q.answer.correctOptionIds.includes(o.id));wrong.conceptId='MC-0274';wrong.text='Renaissance';
 assert(audioOverlapErrors(q,selection.entries).some(e=>e.includes('Renaissance')));
});
