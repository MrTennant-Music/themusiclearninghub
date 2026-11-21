'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),marking=require('../exam-marking');
const source=fs.readFileSync(require.resolve('../exam-notation'),'utf8');
function helpers(){const c={};vm.runInNewContext(source.slice(source.indexOf('  const q3NoteReviewAnswers'),source.indexOf('  function ah2016PitchInKey('))+';this.register=q3RegisterNoteReview;this.correct=q3ReviewNoteCorrect;',c);return c;}
test('mixed note feedback follows each accepted position without changing all-or-nothing marks',()=>{
 const h=helpers(),paper=require('../papers/advanced-higher-2024'),part=paper.questions.flatMap(q=>q.subquestions).find(p=>p.id==='q4bii'),review={q4bii:'incorrect'};h.register(review,{subquestions:[part]});
 assert.equal(marking.markSubquestion(part,'C3,Bb2,Bb2').marks,0);assert.equal(h.correct(review,part.id,0,'C3','Eb3'),false);assert.equal(h.correct(review,part.id,1,'Bb2','Bb2'),true);assert.equal(h.correct(review,part.id,2,'B♭2','Bb2'),true);
 const bass=require('../papers/advanced-higher-2018').questions.flatMap(q=>q.subquestions).find(p=>p.id==='q2b'),bassReview={q2b:'incorrect'};h.register(bassReview,{subquestions:[bass]});assert.equal(marking.markSubquestion(bass,'B5,A2,F3').marks,0);assert.equal(h.correct(bassReview,bass.id,0,'B5','B3'),true);assert.equal(h.correct(bassReview,bass.id,1,'A2','A3'),true);assert.equal(h.correct(bassReview,bass.id,2,'F3','G3'),false);assert.equal(h.correct(bassReview,bass.id,2,'_','G3'),false);
});
test('AH 2024 draws the entered tie only when both linked notes exist and colours their status',()=>{
 const start=source.indexOf('      const lowerEntered = String(answers.q4bii'),code=source.slice(start,source.indexOf('      return svg;',start));
 for(const [value,expected]of [['Eb3,_,_',['q3-answer-correction']],['_,Bb2,Bb2',['q3-answer-correct']],['Eb3,C3,Bb2',['q3-answer-incorrect','q3-answer-correction']]]){
  const ties=[],svg={},c={svg,review:{q4bii:'incorrect'},answers:{q4bii:value},data:{b:{octaveLower:{rhythms:['quaver','quaver','crotchet'],answer:['Eb3','Bb2','Bb2'],tie:[1,2]}}},bassTop:1295,octaveSlots:[{x:150},{x:180},{x:210}],answerClass:()=>'',ah2016Notes:ns=>ns,svgElement:()=>({}),higher2015DrawNotes:(_p,_n,xs)=>xs.map(x=>({x,y:1300,down:false})),q3ReviewNoteCorrect:(_r,_id,_i,v,expected)=>v===expected,q3DrawTie:(_p,_a,_b,o)=>{ties.push(o.className);if(o.className!=='q3-answer-correction')assert.equal(o.followPitch,true);}};vm.runInNewContext(code,c);assert.deepEqual(ties,expected,value);
 }
});
