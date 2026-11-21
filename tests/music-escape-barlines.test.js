'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const load=require('./helpers/barlines-harness.cjs');
test('Escape barline clues provide all other barlines and keep four unfilled choices',()=>{
 const a=load();let question;
 a.window.MLH.EscapeLiteracyActivity={useContentHeight:()=>({current:null}),useQuestion:(activity,generate)=>(question=generate(activity)),codeOrder:labels=>labels,NumberedOptions:()=>null};
 for(const level of ['N3','N4','N5','H','AH'])for(let i=0;i<20;i++){
  const html=renderToStaticMarkup(React.createElement(a.EscapeClue,{activity:{level,clue:{digit:1}}}));
  assert.equal(question.markers.length,4);
  assert(question.markers.includes(question.correct));
  for(const marker of question.markers)assert(marker===question.correct||!question.correctBoundaryTypes[marker]);
  const positions=a.calculateLayout(question).boundaryPositions;
  for(const boundary of positions.filter(b=>!b.fixed&&b.id!==question.correct&&question.correctBoundaryTypes[b.id]))assert(html.includes(`data-provided-barline="${boundary.id}"`),level+' '+boundary.id);
  assert(!html.includes(`data-provided-barline="${question.correct}"`));
 }
});
