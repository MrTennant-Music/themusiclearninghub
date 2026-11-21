const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const G=require('../shared/music-games-collections'),C=require('../music-games/core');
const counts={N3:17,N4:10,N5:20,H:24,AH:19};
for(const [rank,level] of G.data.codes.entries())test(`${level} literacy has identical complete word and clue pools in both games`,()=>{
 const pool=G.literacyConcepts(level);
 assert.equal(pool.length,counts[level]);
 assert(pool.every(c=>c.level===level));
 const seen=new Set();
 // Rotate the bank so every entry is tested, including those outside the first 12.
 for(let offset=0;offset<pool.length;offset+=12){
  const shuffle=rows=>rows.slice(offset).concat(rows.slice(0,offset));
  const crossword=G.categoryWordPuzzle(level,5,'crossword',shuffle);
  const search=G.categoryWordPuzzle(level,5,'wordsearch',shuffle);
  const content=a=>a.items.map(({sourceConceptId,prompt,answer})=>({sourceConceptId,prompt,answer}));
  assert.deepEqual(content(crossword),content(search));
  assert.equal(search.editorMode,'with-clues');
  for(const a of [crossword,search]){
   assert.equal(a.title,G.data.levels[rank]+' – Music Literacy');
   assert.deepEqual(C.validateActivity(a),[]);
   assert.equal(C.compatibility(a.template,a).ok,true);
   assert(a.tags.includes(a.template+'-category:5'));
   for(const item of a.items)seen.add(item.sourceConceptId);
  }
 }
 assert.deepEqual(seen,new Set(pool.map(c=>c.id)));
 const inherited=G.categoryConcepts(level,5,true);
 assert.equal(inherited.length,Object.values(counts).slice(0,rank+1).reduce((a,b)=>a+b,0));
 assert(inherited.every(c=>G.data.codes.indexOf(c.level)<=rank));
 for(const template of ['crossword','wordsearch']){
  assert.equal(G.categoryWordPuzzle(level,5,template,undefined,true).title,'Music Literacy');
 }
});
test('literacy scope, unique words and the requested crotchet clue are preserved',()=>{
 const rows=G.literacyConcepts('ALL');
 assert.equal(rows.length,90);
 assert.equal(new Set(rows.map(c=>c.id)).size,rows.length);
 assert.equal(new Set(rows.map(c=>c.word.replace(/[^a-z]/gi,'').toLowerCase())).size,rows.length);
 assert.equal(rows.find(c=>c.word==='Crotchet').definition,'A one beat rhythm.');
 assert.equal(rows.find(c=>c.word==='Tie').level,'AH');
 assert.equal(rows.find(c=>c.word==='Ledger line').level,'N4');
});
test('word puzzles and Concept Collections load the same literacy bank',()=>{
 for(const file of ['crosswords.html','wordsearch.html','mycollections.html']){
  const html=fs.readFileSync(file,'utf8');
  assert(html.indexOf('shared/music-games-literacy.js')<html.indexOf('shared/music-games-collections.js'));
  assert(html.includes('shared/music-games-literacy.js'));
 }
 const context={};vm.runInNewContext(fs.readFileSync('shared/music-games-literacy.js','utf8'),context);
 assert.equal(context.MLHGameLiteracy.length,90);
});

test('curriculum labels select the matching playable literacy terms',()=>{
 const {termsForEntry}=require('../shared/music-literacy-curriculum');
 const concepts=G.literacyConcepts('ALL');
 const words=(level,label)=>termsForEntry(label,level,concepts).map(term=>term.name);
 assert.deepEqual(words('N3','Lines and spaces of the treble clef'),['Treble clef','Stave']);
 assert.deepEqual(words('N4','Treble clef stave'),words('N3','Lines and spaces of the treble clef'));
 assert.deepEqual(words('N3','< cresc. — crescendo'),['Crescendo']);
 assert.deepEqual(words('N4','Repeat signs'),['Repeat sign']);
 assert.deepEqual(words('N5','Dotted rhythms'),['Dotted crotchet','Dotted quaver']);
 assert.deepEqual(words('N5','1st and 2nd time bars'),['First time bar','Second time bar']);
 assert.equal(words('H','Rests — quaver, crotchet, dotted crotchet, minim, semibreve, whole bar').length,6);
 assert.deepEqual(words('AH','Time signature: 5/4'),['Time signature']);
});

test('every curriculum topic has a playable term in the editor',()=>{
 const {rows,termsForEntry}=require('../shared/music-literacy-curriculum');
 const concepts=G.literacyConcepts('ALL');
 for(const [index,[level,columns]] of rows.entries()){
  for(const column of columns.filter(content=>content.startsWith('<a '))){
   for(const entry of column.split('<br><br>')){
    const label=entry.replace(/<[^>]*>/g,'').replaceAll('&lt;','<').replaceAll('&gt;','>');
    assert(termsForEntry(label,G.data.codes[index],concepts).length,level+' '+label);
   }
  }
 }
});

test('Concept Sort saves literacy and dictionary concepts with their chosen groups', () => {
 const curriculum = require('../shared/music-literacy-curriculum');
 const literacy = curriculum.termsForEntry('Dotted rhythms', 'N5', G.literacyConcepts('ALL'));
 const music = G.data.concepts[0];
 const ids = [...literacy.map(term => term.id), music.id];
 const assignments = Object.fromEntries(ids.map(id => [id, id === music.id ? 1 : 0]));
 const sort = G.make({ name: 'Literacy sort', level: 'N3', scope: 'ALL', template: 'group-sort', ids, assignments, groups: ['Rhythms', 'Styles'] });
 assert.deepEqual(sort.sourceConceptIds, ids);
 assert.deepEqual(sort.items.map(item => [item.prompt, item.group]), [
  ['Dotted crotchet', 'Rhythms'], ['Dotted quaver', 'Rhythms'], [music.name, 'Styles'],
 ]);
 assert(sort.tags.includes('user-collection'));
 assert.equal(C.compatibility('group-sort', sort).ok, true);
});
