const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../shared/music-games-collections'),C=require('../music-games/core');
test('all five levels use the quiz curriculum grid without above-level or excluded concepts',()=>{
 for(const level of G.data.codes)for(const template of ['wordsearch','crossword','matching-pairs']){
  const rows=G.columns(level,template).flat(),ids=rows.map(c=>c.id);
  assert.equal(new Set(ids).size,ids.length);
  assert.ok(rows.length>0);
  assert.ok(rows.every(c=>G.data.levels.indexOf(c.level)<=G.data.codes.indexOf(level)));
  assert.ok(rows.every(c=>template==='matching-pairs'||c.word));
 }
});
test('word puzzles retain exactly the selected concept IDs, reviewed definitions and answers',()=>{
 for(const level of G.data.codes)for(const template of ['wordsearch','crossword']){
  const used=new Set(),rows=G.eligible(level,template).filter(c=>{const word=c.word.replace(/[^a-z]/gi,'').toLowerCase();if(used.has(word))return false;used.add(word);return true;}).slice(0,15);
  const a=G.make({name:'My selected concepts',level,template,ids:rows.map(c=>c.id)});
  assert.equal(a.items.length,15);assert.ok(C.compatibility(template,a).ok);
  assert.deepEqual(a.sourceConceptIds,rows.map(c=>c.id));
  for(const [i,item] of a.items.entries()){assert.equal(item.prompt,rows[i].definition);assert.equal(item.answer,rows[i].word);assert.equal(item.sourceConceptId,rows[i].id);}
 }
});
test('Connections retains four named groups of four selected concepts',()=>{
 const rows=G.eligible('N3','matching-pairs').slice(0,16),ids=rows.map(c=>c.id),assignments=Object.fromEntries(ids.map((id,i)=>[id,Math.floor(i/4)])),groups=['Styles','Melody','Rhythm','Instruments'];
 const a=G.make({name:'My Connections',level:'N3',template:'matching-pairs',ids,assignments,groups});
 assert.ok(C.compatibility('matching-pairs',a).ok);assert.deepEqual(a.sourceConceptIds,ids);
 for(let i=0;i<16;i++){assert.equal(a.items[i].prompt,rows[i].name);assert.equal(a.items[i].group,groups[Math.floor(i/4)]);}
 assert.throws(()=>G.make({name:'Invalid',level:'N3',template:'matching-pairs',ids:ids.slice(1),assignments,groups}),/four concepts/);
 assert.throws(()=>G.make({name:'Invalid',level:'N3',template:'matching-pairs',ids,assignments,groups:['Same','Same','C','D']}),/different names/);
});
test('invalid, empty, duplicate, oversized and above-level selections cannot be saved',()=>{
 const rows=G.eligible('N3','wordsearch'),base={name:'My collection',level:'N3',template:'wordsearch'};
 assert.throws(()=>G.make({...base,ids:[]}),/at least one/);
 assert.throws(()=>G.make({...base,name:' ',ids:[rows[0].id]}),/name/);
 assert.throws(()=>G.make({...base,ids:['unknown']}),/appropriate/);
 assert.throws(()=>G.make({...base,ids:[rows[0].id,rows[0].id]}),/different concepts/);
 assert.throws(()=>G.make({...base,ids:[G.eligible('AH','wordsearch').find(c=>c.level==='Advanced Higher').id]}),/appropriate/);
 assert.throws(()=>G.make({...base,ids:rows.slice(0,16).map(c=>c.id)}),/15/);
});
test('all-level creators include every eligible level and save mixed-level collections',()=>{
 for(const template of ['wordsearch','crossword','matching-pairs']){
  const rows=G.columns('ALL',template).flat();
  assert.equal(new Set(rows.map(c=>c.id)).size,rows.length);
  assert.deepEqual(new Set(rows.map(c=>c.level)),new Set(G.data.levels));
  assert.deepEqual(new Set(rows.map(c=>c.id)),new Set(G.eligible('AH',template).map(c=>c.id)));
  const selected=[rows.find(c=>c.level===G.data.levels.at(-1)),...rows.filter(c=>c.level===G.data.levels[0]).slice(0,template==='matching-pairs'?15:4)];
  const ids=selected.map(c=>c.id),groups=['A','B','C','D'],assignments=Object.fromEntries(ids.map((id,i)=>[id,Math.floor(i/4)]));
  const activity=G.make({name:'Mixed levels',level:'N3',scope:'ALL',template,ids,groups,assignments});
  assert.deepEqual(activity.sourceConceptIds,ids);
  assert.equal(activity.level,'N3');
 }
});
test('clean-start library archives existing collections while new collections remain visible',()=>{
 for(const template of ['wordsearch','crossword','matching-pairs']){
  assert.equal(G.visibleInLibrary({template,_builtin:true}),false);
  assert.equal(G.visibleInLibrary({template,_stored:true,collectionEdition:1}),false);
  const ids=G.eligible('N3',template).slice(0,template==='matching-pairs'?16:5).map(c=>c.id);
  const activity=G.make({name:'Fresh collection',level:'N3',template,ids,groups:['A','B','C','D'],assignments:Object.fromEntries(ids.map((id,i)=>[id,Math.floor(i/4)]))});
  assert.equal(G.visibleInLibrary(activity),true);
  assert.equal(G.visibleInLibrary(C.normalize(activity)),true);
  assert.equal(G.visibleInLibrary(C.normalizeImport(C.exportActivity(activity))[0]),true);
 }
});
