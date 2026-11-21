'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const source=require('./fixtures/source-tick-instructions.json');
const strings=v=>typeof v==='string'?[v]:Array.isArray(v)?v.flatMap(strings):v&&typeof v==='object'?Object.values(v).flatMap(strings):[];
test('all 129 source-confirmed tick instructions retain the printed tick glyph in the correct question',()=>{
 assert.equal(source.instructions.length,129);assert.equal(new Set(source.instructions.map(f=>f.id)).size,16);
 for(const f of source.instructions){const paper=require('../papers/'+f.id),q=paper.questions.find(q=>q.id===f.question);assert.ok(strings(q).includes(f.text),f.id+' '+f.question+' '+f.field);assert.match(f.text,/[Tt]ick \(✓\)/);assert.equal(f.text.replace(/\s/g,''),f.officialText.replace(/\s/g,''));}
});
test('six further source-render-confirmed punctuation details remain verbatim',()=>{
 for(const f of require('./fixtures/source-punctuation-corrections.json').corrections){const paper=require('../papers/'+f.id);assert.ok(strings(paper.questions).includes(f.text),f.id+' '+f.text);}
});

test('all eleven source-checked category tables retain their exact selection instruction and tick heading',()=>{
 assert.equal(source.categoryTables.length,11);
 for(const f of source.categoryTables){const q=require('../papers/'+f.id).questions.find(q=>q.id==='q5');for(const part of q.subquestions)assert.equal(part.instruction,f.instruction,f.id+' '+part.id);assert.equal(q.subquestions[0].tickHeading||'Tick',f.heading,f.id);}
});

test('analysis bullet case, punctuation and regular emphasis match each independently viewed source',()=>{
 for(const f of require('./fixtures/source-analysis-bullets.json').papers){const q=require('../papers/'+f.id).questions.find(q=>q.id==='q8');assert.deepEqual(q.intro.slice(2,6),f.bullets,f.id);assert.equal(q.introBulletEmphasis,false,f.id);}
 assert.equal(require('../papers/national5-2014').questions.find(q=>q.id==='q8').introBulletEmphasis,undefined,'2014 keeps its source bold bullets');
});
test('all source category labels and stacked time-signature choices remain exact',()=>{
 for(const f of require('./fixtures/source-category-tables.json').papers){const q=require('../papers/'+f.id).questions.find(q=>q.id==='q5');assert.deepEqual(q.subquestions.map(s=>s.label),f.labels,f.id);const options=q.subquestions.flatMap(s=>s.options);for(const value of f.fractions)assert.deepEqual(options.find(o=>o.value===value).stackedFraction,value.split('/'),f.id+' '+value);}
});

test('source rough-work labels retain their case independently of marking-bank headings',()=>{
 for(const f of require('./fixtures/source-analysis-bullets.json').papers.filter(p=>p.roughWorkLabels)){const part=require('../papers/'+f.id).questions[7].subquestions[0];assert.deepEqual(Object.fromEntries(part.headings.map(h=>[h.id,h.roughWorkLabel])),f.roughWorkLabels,f.id);}
 for(const [year,last] of [[2022,'style.'],[2023,'harmony.'],[2024,'structure/form.']])assert.equal(require('../papers/national5-'+year).questions[4].intro[5],last);
});

test('Higher 2015 and 2016 preserve the source capital H in Melody/Harmony',()=>{
 for(const year of [2015,2016]){const p=require('../papers/higher-'+year),q=p.questions[5];assert.equal(q.intro[3],'Melody/Harmony');assert.equal(q.subquestions[0].headings.find(h=>h.id==='melody').roughWorkLabel,'Melody/Harmony');assert.ok(p.questions.find(q=>q.subquestions.some(s=>s.type==='comparison-grid')).subquestions[0].groups.some(g=>g.label==='Melody/Harmony'));}
});

test('all thirty papers retain the independently read case of every visible final-answer heading',()=>{
 const source=require('./fixtures/source-final-answer-headings.json');assert.equal(source.papers.length,30);
 for(const f of source.papers){const parts=require('../papers/'+f.id).questions.flatMap(q=>q.subquestions.filter(s=>s.finalAnswerField&&!s.hideFinalHeading));assert.deepEqual(parts.map(s=>({part:s.id,text:s.finalAnswerHeading||'Final answer'})),f.headings.map(({part,text})=>({part,text})),f.id);}
});

test('all thirty papers retain the independently read case of every visible rough-work heading',()=>{
 const source=require('./fixtures/source-rough-work-headings.json');assert.equal(source.papers.length,30);
 for(const f of source.papers){const parts=require('../papers/'+f.id).questions.flatMap(q=>q.subquestions.filter(s=>s.roughWork&&s.finalAnswerField&&!s.hideRoughWork));assert.deepEqual(parts.map(s=>({part:s.id,text:s.roughWorkHeading||'Rough work'})),f.headings.map(({part,text})=>({part,text})),f.id);}
});

test('all digital questions replace misleading references to printed pages with real score or answer locations',()=>{
 const registry=require('../paper-registry');
 for(const e of Object.values(registry)){const paper=require('../'+e.dataFile.split('?')[0]);for(const text of strings(paper.questions))assert.doesNotMatch(text,/\b(?:pages?|overleaf|turn over)\b/i,e.id+' '+text);}
 const changes=require('./fixtures/digital-page-reference-adaptations.json').changes;assert.equal(changes.length,29);assert.equal(new Set(changes.map(c=>c.paper)).size,15);
 for(const change of changes)assert.ok(strings(require('../papers/'+change.paper).questions).some(text=>text.includes(change.digital)),change.paper+' '+change.digital);
});
