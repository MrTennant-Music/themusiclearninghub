const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../shared/music-games-collections');
test('Include Levels Below adds every earlier qualification',()=>{
 for(const [rank,level] of G.data.codes.entries()){
  const allowed=new Set(G.data.levels.slice(0,rank+1));
  const pool=G.levelConcepts(level,true);
  assert(pool.every(c=>allowed.has(c.level)));
  assert.deepEqual(new Set(pool.map(c=>c.level)),allowed);
  for(let category=0;category<5;category++){
   const rows=G.categoryConcepts(level,category,true);
   assert(rows.every(c=>allowed.has(c.level)));
   const a=G.categoryCrossword(level,category,rows=>rows.slice(),true);
   assert(a.sourceConceptIds.every(id=>rows.some(c=>c.id===id)));
  }
 }
});
test('custom crosswords enforce the five to fifteen concept range',()=>{
 const ids=G.eligible('N3','crossword').slice(0,16).map(c=>c.id);
 for(const size of [1,4,16])assert.throws(()=>G.make({name:'Limits',level:'N3',template:'crossword',ids:ids.slice(0,size)}),/between 5 and 15/);
 for(const size of [5,15])assert.equal(G.make({name:'Limits',level:'N3',template:'crossword',ids:ids.slice(0,size)}).items.length,size);
});
for(const level of G.data.codes)for(let category=1;category<5;category++)test(`${level} category ${category} draws only from its permitted levels and column`,()=>{
 const levels=level==='AH'&&[2,4].includes(category)?['Higher','Advanced Higher']:[G.data.levels[G.data.codes.indexOf(level)]];
 const pool=G.columns(level,'crossword')[category].filter(c=>levels.includes(c.level)),allowed=new Set(pool.map(c=>c.id));
 for(const shuffle of [rows=>rows.slice(),rows=>rows.slice().reverse()]){
  const a=G.categoryCrossword(level,category,shuffle);
  assert.equal(a.items.length,Math.min(12,pool.length));
  assert(a.sourceConceptIds.every(id=>allowed.has(id)));
  assert.equal(new Set(a.items.map(i=>i.answer.replace(/[^a-z]/gi,'').toLowerCase())).size,a.items.length);
  assert(a.tags.includes('crossword-category:'+category));
 }
});
for(const level of G.data.codes)test(`random crossword uses 12 distinct words through ${level} and prioritises that level`,()=>{
 const forward=G.randomCrossword(level,rows=>rows.slice());
 const reverse=G.randomCrossword(level,rows=>rows.slice().reverse());
 for(const activity of [forward,reverse]){
  assert.equal(activity.items.length,12);
  assert.equal(new Set(activity.sourceConceptIds).size,12);
  assert.equal(new Set(activity.items.map(i=>i.answer.replace(/[^a-z]/gi,'').toLowerCase())).size,12);
  const rank=G.data.codes.indexOf(level);
  const ranks=activity.sourceConceptIds.map(id=>G.data.levels.indexOf(G.data.concepts.find(c=>c.id===id).level));
  assert.ok(ranks.every(index=>index<=rank));
  assert.equal(ranks.filter(index=>index===rank).length,rank===0?12:8);
 }
 assert.notDeepEqual(forward.sourceConceptIds,reverse.sourceConceptIds);
});
