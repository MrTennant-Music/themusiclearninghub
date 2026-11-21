'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),registry=require('../paper-registry'),marking=require('../exam-marking'),{fixtures}=require('../scripts/populated-answer-fixtures.cjs');
test('populated layout fixtures include a full-credit rendered answer for all 848 parts',()=>{
 let parts=0;for(const entry of Object.values(registry)){
  const paper=require('../'+entry.dataFile.split('?')[0]),answers=fixtures(paper,'accepted');
  for(const q of paper.questions)for(const part of q.subquestions){
   assert.ok(marking.isAnswered(part,answers[part.id]),`${paper.id}/${part.id}: populated`);
   assert.equal(marking.markSubquestion(part,answers[part.id]).marks,part.marks,`${paper.id}/${part.id}: full-credit layout fixture`);
   if(part.notationTool&&part.notationTool!=='accidental')assert.equal(answers[part.id],String(part.answer??part.acceptedAnswers[0]),'use the tool storage format rather than a written-answer synonym');
   parts++;
  }
  assert.equal(marking.markPaper(paper,answers).score,40,paper.id);
 }
 assert.equal(parts,848);
});
test('mixed layout fixtures retain blank, incorrect and credited parts in every paper',()=>{
 for(const entry of Object.values(registry)){
  const paper=require('../'+entry.dataFile.split('?')[0]),answers=fixtures(paper,'mixed');
  const statuses=new Set(marking.markPaper(paper,answers).questionBreakdown.flatMap(q=>q.parts.map(p=>p.status)));
  for(const status of ['correct','incorrect','unanswered'])assert.ok(statuses.has(status),`${paper.id}: ${status}`);
 }
});
