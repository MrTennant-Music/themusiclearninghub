'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const data=require('../music-dictionary/music-concepts-data.js'),{selection,levelTitle,currentLevels,build}=require('../music-dictionary/music-concepts-booklet.js');
test('all listed concept records remain available across the individual level booklets',()=>{
 const entries=selection(data,['N3','N4','N5','H','AH']);
 assert.equal(entries.length,295);assert.equal(new Set(entries.map(e=>e.concept.id)).size,295);
 assert.ok(!entries.some(e=>e.concept.id==='MC-0092'));
});
test('booklet selections contain only the requested introduction levels',()=>{
 for(const [key,index] of ['N3','N4','N5','H','AH'].map((key,index)=>[key,index])){
  const entries=selection(data,[key]);assert.ok(entries.length>0);
  assert.ok(entries.every(entry=>entry.level===data.levels[index]&&entry.concept.level===entry.level));
 }
 const mixed=selection(data,['N3','H']);assert.ok(mixed.every(e=>['National 3','Higher'].includes(e.level)));
 assert.deepEqual(selection(data,[]),[]);
});
test('cover titles follow selected levels in qualification order',()=>{
 assert.equal(levelTitle(data,['AH']),'Advanced Higher');
 assert.equal(levelTitle(data,['H','N5']),'National 5 & Higher');
 assert.equal(levelTitle(data,['N3','N4','N5','H','AH']),'All Levels');
});

test('booklet uses the source level even if old settings contain several levels',()=>{
 assert.deepEqual(currentLevels({level:'AH',levels:['N3','N4','N5','H','AH']}),['AH']);
 assert.deepEqual(currentLevels({level:'N3'}),['N3']);
});
test('PDF builder refuses multiple qualification levels',async()=>{
 await assert.rejects(build({data,levels:['N3','N5']}),/one qualification level/);
});
