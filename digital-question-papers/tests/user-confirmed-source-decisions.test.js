'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const notation=require('../exam-notation'),marking=require('../exam-marking');
test('the five source decisions confirmed on 6 November 2026 supersede the older teacher records',()=>{
 const part=(paper,id)=>require('../papers/'+paper).questions.flatMap(q=>q.subquestions).find(p=>p.id===id);
 for(const [paper,id,correct,wrong]of [
  ['national5-2015','q3f','A4,A4,Bb4,C5','A4,G4,A4,Bb4'],
  ['higher-2023','q4c','A4,G4,F4','A4,F4,G4'],
 ]){
  const definition=part(paper,id);assert.equal(marking.markSubquestion(definition,correct).marks,definition.marks);
  assert.equal(marking.markSubquestion(definition,wrong).marks,0);
 }
 assert.equal(notation.getInventory('higher-2022-q4').bars[7].notes.at(-1).pitch,'D5');
 const higher=notation.getInventory('higher-2023-q4');
 assert.deepEqual(higher.bars[12].slurs,[{start:1,end:2,above:true}]);
 assert.deepEqual(higher.bars[6].notes.slice(1,4).map(n=>n.pitch),['A4','G4','F4']);
 for(const i of [0,2]){
  const bar=notation.getInventory('ah-2018-q2').third.bars[i];
  assert.deepEqual(bar.notes.map(n=>n.pitch),['D4','F4','G4','F4']);
  assert.equal(bar.notes[1].courtesyAccidental,'natural');assert.ok(!bar.notes[3].courtesyAccidental);
  assert.equal(bar.notes.reduce((sum,n)=>sum+n.beats,0),5);
 }
});
