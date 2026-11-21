'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fixtures=require('./fixtures/higher-source-comparison-headings.json');
test('all ten Higher comparison tables retain independently read source heading and shading metadata',()=>{
 assert.equal(fixtures.length,10);
 for(const expected of fixtures){
  const paper=require('../papers/'+expected.id+'.js');
  const part=paper.questions.flatMap(q=>q.subquestions).find(s=>s.type==='comparison-grid');
  assert.equal(part.columns.find(c=>c.id==='c').sublabel,expected.columnC,expected.id+' Column C wording');
  assert.equal(part.comparisonRoughWorkShaded!==false,expected.roughWorkShaded,expected.id+' rough-work shading');
  assert.equal(Boolean(part.comparisonColumnHeaderBold),expected.columnABWeight===700,expected.id+' A/B source weight');
 }
});
