const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),Core=require('../music-dictionary/quiz-core.js');
const bank=JSON.parse(fs.readFileSync(path.join(root,'music-dictionary/quiz-data/question-bank.json'))),audit=JSON.parse(fs.readFileSync(path.join(root,'music-dictionary/quiz-data/workbook-choice-audit.json')));
const choice=(concept,format)=>bank.questions.find(q=>q.conceptId===concept&&q.format===format);
const correct=q=>q.options.filter(o=>q.answer.correctOptionIds.includes(o.id)).map(o=>o.text).join(' ');
test('typed questions match the preserved baseline with explicitly requested wording and answer-variant updates',()=>{
 const typed=bank.questions.filter(q=>q.format==='short-answer');assert.equal(typed.length+(bank.retiredQuestions||[]).filter(q=>q.format==='short-answer').length,297);
 assert.equal(crypto.createHash('sha256').update(Core.stable(typed)).digest('hex'),audit.typedBaselineSha256);
});
test('every choice question has an explicit workbook decision and source coverage is honest',()=>{
 const rows=new Map(audit.questions.map(r=>[r.questionId,r]));assert.equal(rows.size,bank.questions.filter(q=>q.options).length);
 for(const q of bank.questions.filter(q=>q.options)){
  const row=rows.get(q.id);assert(row,q.id);assert.equal(row.questionContentSha256,q.contentSha256,q.id);
  assert(row.decision);assert(['written-teaching','named-or-listening','related-foundation','partial-coverage','not-covered'].includes(row.coverage));
  if(row.coverage==='not-covered')assert.equal(row.classroomSources.length,0);else assert(row.classroomSources.length>0,q.id);
 }
 assert.deepEqual([...new Set(audit.questions.filter(r=>r.coverage==='not-covered').map(r=>r.conceptId))],['MC-0278'].filter(id=>bank.questions.some(q=>q.conceptId===id&&q.options)));
 assert.deepEqual([...new Set(audit.questions.filter(r=>r.coverage==='partial-coverage').map(r=>r.conceptId))],['MC-0279'].filter(id=>bank.questions.some(q=>q.conceptId===id&&q.options)));
});
test('authenticated workbook text archive matches source records and every quoted teaching passage',()=>{
 const bytes=fs.readFileSync(path.join(root,audit.sourceTextArchive.path));
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),audit.sourceTextArchive.sha256);
 const archive=JSON.parse(bytes),sources=new Map(archive.sources.map(s=>[s.path,s]));
 assert.equal(sources.size,13);
 for(const source of audit.sources){
  const saved=sources.get(source.path);assert(saved,source.path);
  assert.equal(saved.sha256,source.sha256);assert.equal(saved.paragraphs.length,source.paragraphs);
  assert.match(source.previousSha256,/^[a-f0-9]{64}$/);assert(saved.sourceLocation.endsWith('.docx'));
 }
 for(const row of audit.questions){
  const q=bank.questions.find(q=>q.id===row.questionId);
  assert.equal(row.checkedPrompt,q.prompt,q.id);assert.equal(row.checkedFeedback,q.feedback,q.id);
  assert.deepEqual(row.checkedCorrectOptions,q.options.filter(o=>q.answer.correctOptionIds.includes(o.id)).map(o=>o.text),q.id);
  assert.deepEqual(row.checkedDistractors,q.options.filter(o=>!q.answer.correctOptionIds.includes(o.id)).map(o=>o.text),q.id);
  for(const evidence of row.classroomSources){
   const paragraphs=sources.get(evidence.path).paragraphs;
   assert(evidence.paragraphIndices.every(i=>Number.isInteger(i)&&i>=0&&i<paragraphs.length),q.id);
   assert.equal(evidence.supportingText,evidence.paragraphIndices.map(i=>paragraphs[i]).join('\n'),q.id);
   assert(q.evidence.some(e=>Core.stable(e)===Core.stable(evidence)),q.id);
  }
 }
});
test('course-specific listening distinctions replace unsupported choice-question extensions',()=>{
 const expo=choice('MC-0251','multi-select');assert.match(expo.prompt,/sonata/i);assert(!/fugue/i.test(correct(expo)));
 assert.match(correct(choice('MC-0264','multiple-choice')),/fa-la-la/i);
 assert.match(correct(choice('MC-0269','multiple-choice')),/unaccompanied.*imitation/i);
 assert(!/word painting/i.test(correct(choice('MC-0269','multi-select'))));
 assert.match(correct(choice('MC-0151','multiple-choice')),/sitar.*tabla/i);
 assert.match(choice('MC-0286','multiple-choice').prompt,/subject.*new voice/i);
 assert(!/fifth|fourth/i.test(correct(choice('MC-0286','multi-select'))));
 assert.match(correct(choice('MC-0273','multi-select')),/two or four/i);
 assert(!/downwards/i.test(correct(choice('MC-0281','multi-select'))));
});

test('distractors stay within the question qualification or earlier, including cumulative quizzes',()=>{
 const {distractorScopeErrors}=require('../scripts/quiz-distractor-scope.cjs');
 for(const q of bank.questions)assert.deepEqual(distractorScopeErrors(q),[],q.id);
 const example=Core.copy(choice('MC-0001','multiple-choice')),wrong=example.options.find(o=>!example.answer.correctOptionIds.includes(o.id));
 wrong.text='Countertenor';assert(distractorScopeErrors(example).length>0);
 wrong.text='Recorder';assert(distractorScopeErrors(example).length>0);
 example.levelCode='N4';assert.deepEqual(distractorScopeErrors(example),[]);
 wrong.text='Plainchant';assert(distractorScopeErrors(example).length>0);
 example.levelCode='H';assert.deepEqual(distractorScopeErrors(example),[]);
});
