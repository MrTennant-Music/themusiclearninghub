const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../shared/music-games-collections'),C=require('../music-games/core');
const ordered=rows=>rows.slice();
const conceptsById=new Map(G.data.concepts.map(concept=>[concept.id,concept]));
for(const level of G.data.codes)for(const below of [false,true])test(`${level} word puzzles share the same pools (below=${below})`,()=>{
 const crossword=G.randomWordPuzzle(level,'crossword',ordered,below);
 const search=G.randomWordPuzzle(level,'wordsearch',ordered,below);
 assert.deepEqual(search.sourceConceptIds,crossword.sourceConceptIds);
 const ranks=search.sourceConceptIds.map(id=>G.data.levels.indexOf(conceptsById.get(id).level));
 const levelRank=G.data.codes.indexOf(level);
 assert(ranks.every(rank=>below ? rank<=levelRank : rank===levelRank));
 if(below&&levelRank>0)assert(ranks.some(rank=>rank<levelRank));
 assert.equal(search.items.length,12);
 assert.equal(search.template,'wordsearch');
 assert.equal(search.editorMode,'with-clues');
 assert(search.tags.includes('random-wordsearch'));
 for(let category=0;category<5;category++){
  const a=G.categoryWordPuzzle(level,category,'wordsearch',ordered,below);
  const b=G.categoryWordPuzzle(level,category,'crossword',ordered,below);
  assert.deepEqual(a.sourceConceptIds,b.sourceConceptIds);
  assert.equal(a.editorMode,'with-clues');
  assert(C.compatibility('wordsearch',a).ok);
  assert(a.tags.includes('wordsearch-category:'+category));
  const [restored]=C.normalizeImport(C.exportActivity(a));
  assert.deepEqual(restored.items,a.items);
  assert.equal(restored.editorMode,'with-clues');
 }
});
test('Word Search custom collections require five to fifteen words',()=>{
 const ids=G.eligible('N3','wordsearch').slice(0,16).map(c=>c.id);
 for(const size of [1,4,16])assert.throws(()=>G.make({name:'Limits',level:'N3',template:'wordsearch',ids:ids.slice(0,size)}),/between 5 and 15/);
 for(const size of [5,15])assert.equal(G.make({name:'Limits',level:'N3',template:'wordsearch',ids:ids.slice(0,size)}).items.length,size);
});
