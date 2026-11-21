'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),registry=require('../paper-registry');
const root=path.resolve(__dirname,'../..'),source=require('./fixtures/source/source-choice-order.json');
test('all 187 ordinary choice groups retain their independently verified source order and content',()=>{
 let groups=0,choices=0;assert.equal(source.papers.length,Object.keys(registry).length);
 for(const record of source.papers){
  const paper=require(path.join(root,'digital-question-papers',registry[record.id].dataFile.split('?')[0])),parts=paper.questions.flatMap(q=>q.subquestions).filter(p=>['radio','checkbox'].includes(p.type));
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,record.source))).digest('hex'),record.sourceSha256,record.id+' official source unchanged');assert.equal(record.groups.length,parts.length);
  for(const g of record.groups){const p=parts.find(p=>p.id===g.part);assert.ok(p);assert.deepEqual(p.options,g.options,record.id+' '+g.part+' source choice content/order');assert.equal(g.status,'verified-source-order');
   if(g.method==='unchanged-calibrated-notation-inventory'){const fixture=require(path.join(__dirname,'..',g.sourceFixture));assert.ok(fixture.sources.some(s=>s.sha256===record.sourceSha256),'transferred notation review uses the exact same official PDF');assert.ok(fs.existsSync(path.join(__dirname,'..',g.sourceTest)));assert.deepEqual(p.options.map(o=>o.notationScore.optionIndex),p.options.map((_,i)=>i));}
   groups++;choices+=p.options.length;
  }
 }
 assert.equal(groups,187);assert.equal(choices,705);
});
