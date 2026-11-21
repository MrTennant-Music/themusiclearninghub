'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const boundaries=require('../source-line-breaks'),registry=require('../paper-registry');
const source=require('./fixtures/source/fine-source-typography.json');
const complete=require('./fixtures/source/source-line-complete-paragraphs.json');
const fullWidth=require('./fixtures/source/complete-source-lines.json');
const finalCandidates={rows:[...require('./fixtures/source/source-line-break-candidates-complete.json').rows,...require('./fixtures/source/source-line-final-answer-paragraphs.json').rows]};
const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g,'');
test('all reviewed paragraph breaks agree with complete official source wording and printed line coordinates',()=>{
 let paragraphs=0,breaks=0;
 for(const[id,questions]of Object.entries(boundaries)){
  const paper=require(path.resolve(__dirname,'..',registry[id].dataFile.split('?')[0]));
  const original=source.papers.find(p=>p.id===id);
  for(const[qid,records]of Object.entries(questions)){
   const q=paper.questions.find(q=>q.id===qid);assert.ok(q);
   const strings=[];function walk(n){if(typeof n==='string')strings.push(norm(n));else if(n&&typeof n==='object'){if(Array.isArray(n)&&n.every(v=>typeof v==='string'))strings.push(norm(n.join(' ')));Object.values(n).forEach(walk);}}walk(q);
   const rows=original.allFragments.filter(f=>f.question===qid&&f.page<=original.sourcePages-2);let text='';const edges=[];
   for(const f of rows){edges.push({at:text.length,f});text+=f.normal;}
   for(const[key,expected]of Object.entries(records)){
    assert.ok(strings.includes(key),id+'/'+qid+': complete original paragraph, without altered wording');
    let at=-1,matches=0;
    const full=complete.rows.find(r=>r.paper===id&&r.question===qid&&norm(r.lines.join(' '))===key);
    if(full){let total=0;assert.ok(full.actuallyViewed);assert.deepEqual(full.lines.slice(0,-1).map(line=>total+=norm(line).length),expected);matches++;}
    const wide=finalCandidates.rows.find(r=>r.paper===id&&r.question===qid&&r.normal===key);
    if(wide){
     const independent=fullWidth.papers.find(p=>p.id===id);
     for(const row of wide.sourceRows)assert.ok(independent.rows.some(r=>r.question===qid&&r.page===row.page&&r.text===row.text&&JSON.stringify(r.box)===JSON.stringify(row.box)),id+'/'+qid+': original full-width PDF row');
     const variants=[key,key.replace('laidoutbelow','laidoutonthefollowingpage'),key.replace('laidoutbelow','laidoutonthenextpage'),key.replace('tablebelow','tableontheoppositepage')];
     const printed=wide.sourceRows.map(r=>norm(r.text)).join('');
     const variant=variants.find(v=>printed.includes(v));assert.ok(variant,id+'/'+qid+': complete source counterpart');
     const start=printed.indexOf(variant);let total=0;
     const sourceBreaks=wide.sourceRows.slice(0,-1).map(r=>(total+=norm(r.text).length)-start).filter(n=>n>0&&n<variant.length);
     assert.deepEqual(sourceBreaks.map(n=>variant.slice(n)),expected.map(n=>key.slice(n)),id+'/'+qid+': unchanged printed continuation after each break');matches++;
    }
    while((at=text.indexOf(key,at+1))>=0){
     const actual=edges.flatMap(({at:start,f},i)=>start>at&&start<at+key.length&&i>0&&(f.page!==edges[i-1].f.page||Math.abs(f.box[1]-edges[i-1].f.box[1])>3)?[start-at]:[]);
     assert.deepEqual(actual,expected,id+'/'+qid+': every matching official paragraph agrees');matches++;
    }
    assert.ok(matches);assert.ok(expected.length&&expected.every((n,i)=>n>0&&n<key.length&&(!i||n>expected[i-1])));paragraphs++;breaks+=expected.length;
   }
  }
 }
 assert.equal(Object.keys(boundaries).length,30);assert.equal(paragraphs,400);assert.equal(breaks,493);
});
test('printed replay and warning sentences retain their exact independently read source line endings',()=>{
 const examples=[
  ['advanced-higher-2016','q1',['The music will be played twice with a pause of 10 seconds between','playings and a pause of 40 seconds before part (b).']],
  ['higher-2016','q2',['A guide to the music is shown below. You are required to complete this guide by','inserting music concepts.']],
  ['national5-2022','q3',['The music will be played three more times with a pause of 30 seconds between playings.','After the final playing you will have 2 minutes in which to complete your answers.','A warning tone will sound 30 seconds before the next question starts.']],
 ];
 for(const[id,q,lines]of examples){let count=0;const expected=lines.slice(0,-1).map(l=>count+=norm(l).length);assert.deepEqual(boundaries[id][q][norm(lines.join(' '))],expected);}
});
