'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ui=fs.readFileSync(require.resolve('../exam-ui.js'),'utf8');
const context={escapeHtml:v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;'),correctAnswerLabel:()=>'',acceptedAnswerDisplay:()=>''};
vm.runInNewContext(ui.slice(ui.indexOf('  function structuredAnswerGuidanceMarkup('),ui.indexOf('  function highlightedFinalAnswerMarkup('))+ui.slice(ui.indexOf('  function feedbackRegionLabel('),ui.indexOf('  function applyReviewMark('))+';this.guidance=structuredAnswerGuidanceMarkup;this.feedback=inlineFeedbackMarkup;',context);
test('every AH comparison exposes its complete existing similarities and differences in feedback',()=>{
 for(const year of [2016,2017,2018,2019,2022,2023,2024,2025,2026]){const part=require('../papers/advanced-higher-'+year).questions.flatMap(q=>q.subquestions).find(s=>s.markingProfile==='advanced-comparison');const awarded=part.similarities[0].label;const html=context.guidance(part,{matchedConcepts:{analysis:[awarded]}});assert.ok(html.includes('<h4>Similarities</h4>'));assert.ok(html.includes('<h4>Differences</h4>'));for(const c of [...part.similarities,...part.differences])assert.ok(html.includes(context.escapeHtml(c.label)),year+' '+c.label);assert.ok(html.includes('class="is-awarded-concept">'+context.escapeHtml(awarded)));assert.ok(html.includes(part.answerDisplay));}
});
test('AH partial comparison credit never inherits the unrelated three-heading rule',()=>{
 const part=require('../papers/advanced-higher-2017').questions[5].subquestions.find(s=>s.markingProfile==='advanced-comparison');const html=context.feedback(part,{status:'partial',marks:2,maxMarks:4,validConceptCounts:{analysis:3},matchedConcepts:{analysis:[]}});assert.ok(html.includes('Partially correct'));assert.ok(!html.includes('at least 3 headings'));assert.ok(html.includes('six')||html.includes('Six'));
});
const marking=require('../exam-marking');
test('AH conclusion feedback distinguishes identification from justification for both excerpts',()=>{
 for(const year of [2016,2017,2018,2019,2022,2023,2024,2025,2026]){
  const p=require('../papers/advanced-higher-'+year).questions.flatMap(q=>q.subquestions).find(s=>s.markingProfile==='advanced-conclusion');
  const result=marking.markSubquestion(p,{final:`Excerpt 1 is ${p.styles[0].answers[0]}. Excerpt 2 is ${p.styles[1].answers[0]}.`});
  assert.equal(result.marks,1);
  const html=context.feedback(p,{...result,maxMarks:2});
  assert.equal((html.match(/Correct period identified, but no accepted justification/g)||[]).length,2);
  assert.ok(html.includes(p.answerDisplay));
  for(const style of p.styles)for(const reason of style.reasonConcepts)assert.ok(html.includes(context.escapeHtml(reason.label)),`${year}: ${reason.label}`);
 }
});
test('AH conclusion feedback requires evidence here even when earlier answers contain it',()=>{
 const p=require('../papers/advanced-higher-2026').questions[5].subquestions.find(s=>s.markingProfile==='advanced-conclusion');
 const result=marking.markSubquestion(p,{final:'Excerpt 1 is Baroque. Excerpt 2 is Modern because it is syncopated.'},{q6a1:{final:'Harpsichord'}});
 assert.equal(result.marks,1);
 const html=context.feedback(p,{...result,maxMarks:2});
 assert.ok(html.includes('Correct period, supported by Syncopation.'));
 assert.ok(html.includes('State the supporting musical evidence in this part.'));
 assert.ok(!html.includes('Supporting evidence was also found'));
 const complete=marking.markSubquestion(p,{final:'Excerpt 1 is Baroque because of the harpsichord. Excerpt 2 is Modern because it is syncopated.'});
 assert.equal(complete.marks,2);
 assert.ok(!context.feedback(p,{...complete,maxMarks:2}).includes('no accepted justification'));
});
