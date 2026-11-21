'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const registry=require('../paper-registry'),root=path.resolve(__dirname,'../..'),source=require('./fixtures/source/source-mark-allocations.json');
test('all 848 marked parts retain independently extracted official mark allocations',()=>{
 assert.equal(source.papers.length,Object.keys(registry).length);let count=0;
 for(const record of source.papers){
  const paper=require(path.join(root,'digital-question-papers',registry[record.id].dataFile.split('?')[0]));
  const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
  assert.equal(sha(record.source),record.sourceSha256,record.id+' official source hash');
  assert.equal(record.sourceTotal,40,record.id+' independently read total');assert.equal(record.rows.reduce((n,r)=>n+r.marks,0),40);
  assert.deepEqual(record.extractionFlags,[]);const parts=new Map(paper.questions.flatMap(q=>q.subquestions).map(p=>[p.id,p])),seen=[];
  for(const c of record.comparisons){assert.ok(c.partIds.length,record.id+' '+c.sourceId);assert.equal(c.partIds.reduce((n,id)=>n+parts.get(id).marks,0),c.sourceMarks,record.id+' '+c.sourceId+' official marks');seen.push(...c.partIds);}
  assert.equal(new Set(seen).size,seen.length,record.id+' parts map once');assert.deepEqual([...seen].sort(),[...parts.keys()].sort(),record.id+' complete source allocation coverage');count+=seen.length;
  for(const row of record.rows){assert.ok(row.markBox||row.method,record.id+' source word boxes or reviewed rubric');if(row.sourceSha256)assert.equal(sha(row.source),row.sourceSha256);}
 }
 assert.equal(count,848);
});
