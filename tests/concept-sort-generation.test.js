const test=require('node:test'),assert=require('node:assert/strict');
const Sort=require('../shared/music-games-sort'),C=require('../music-games/core'),sharing=require('../music-games/sharing');
function rng(seed){return()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);}
for(const level of C.qualificationLevels)for(const type of ['elements'])test(`${level} ${type}: source-backed random boards respect all limits`,()=>{
 const random=rng(42),shuffle=list=>{const next=list.slice();for(let i=next.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[next[i],next[j]]=[next[j],next[i]];}return next;};
 const seen=new Set();
 for(let i=0;i<50;i++){
  const a=Sort.create({level,type,cardCount:i%2?12:40,random,shuffle});
  assert(a.items.length<=40&&a.items.length>=2);
  const groups=new Set(a.items.map(row=>row.group));assert(groups.size>=2&&groups.size<=6);
  if(type==='elements')assert.deepEqual([...groups].sort(),Sort.elements.slice().sort());
  assert.equal(C.compatibility('group-sort',a).ok,true);
  for(const item of a.items){const source=Sort.data.concepts.find(c=>c.id===item.sourceConceptId);assert(source);assert(C.qualificationLevels.indexOf(source.level)<=C.qualificationLevels.indexOf(level));assert.equal(item.prompt,source.name);assert(item.acceptedGroups.includes(item.group));}
  assert(C.gradeSort(a.items,Object.fromEntries(a.items.map((item,i)=>[i,item.group]))).every(m=>m.correct));
  seen.add(JSON.stringify(a.sortRecipe.cards));
 }
 assert(seen.size>40,'Each spin must sample a varied board');
});
test('all documented element placements are accepted, and invalid placements are rejected',()=>{
 const a=Sort.create({level:'AH',type:'elements',cardCount:40});
 for(const [i,item]of a.items.entries())for(const group of item.acceptedGroups)assert.equal(C.gradeSort(a.items,{[i]:group})[i].correct,true);
 const item={id:'ambiguous',prompt:'Existing shared concept',answer:'Existing shared concept',group:'Style',acceptedGroups:['Style','Texture/structure/form']};
 assert.equal(C.gradeSort([item],{0:'Texture/structure/form'})[0].correct,true);
 assert.equal(C.gradeSort([item],{0:'Timbre'})[0].correct,false);
 assert.deepEqual(C.normalize({...a,items:[item]}).items[0].acceptedGroups,item.acceptedGroups);
});
test('40-card sorts, six groups and compact QR recipes survive complete round trips',async()=>{
 for(const level of C.qualificationLevels)for(const type of ['elements']){
  const a=Sort.create({level,type,cardCount:40,includeBelow:true});
  const link=await sharing.createUrl('https://hub.test/conceptsort.html',a);assert(link.length<=2800);
  const opened=await sharing.readHash(new URL(link).hash);assert.deepEqual(opened.items,a.items);assert.deepEqual(opened.sortRecipe,a.sortRecipe);
 }
 const a=Sort.create({type:'elements',level:'N3'});assert.throws(()=>Sort.fromRecipe({...a.sortRecipe,version:'old'}),/older source/);
 assert.throws(()=>Sort.fromRecipe({...a.sortRecipe,cards:Array(41).fill(a.sortRecipe.cards[0])}),/Invalid sort/);
});

test('the source pool includes every current Dictionary concept',()=>{
 assert.deepEqual(Sort.data.concepts.filter(c=>c.id.startsWith('MC-')).map(c=>c.id).sort(),require('../music-dictionary/music-concepts-data').concepts.map(c=>c.id).sort());
});

test('Musical Elements stays the default, with Instrument Families available at National 5',()=>{
 for(const level of C.qualificationLevels){assert.deepEqual(Sort.availableTypes(level),['elements','styles',...(Sort.factsEnabled?['facts']:[]),...(level==='N5'?['instruments','periods']:['H','AH'].includes(level)?['periods']:[])]);for(let i=0;i<30;i++){const a=Sort.create({level,type:i%2?'all':'elements'});assert.equal(a.sortRecipe.type,'elements');assert.deepEqual(a.sortRecipe.groups,Sort.elements);}}
 for(const type of ['definitions','literacy'])assert.throws(()=>Sort.create({type}),/valid sort/);
});


test('new Musical Elements boards include all earlier levels by default',()=>{
 for(const level of C.qualificationLevels){
  const a=Sort.create({level,type:'elements',shuffle:list=>list.slice()});
  assert.equal(a.sortRecipe.includeBelow,true);
  if(level!=='N3')assert(a.items.some(item=>Sort.data.concepts.find(c=>c.id===item.sourceConceptId).level==='N3'));
 }
 // Existing exact-level shared recipes still restore their original scope.
 const old=Sort.create({level:'N5',type:'elements',includeBelow:false});
 assert.equal(Sort.fromRecipe(old.sortRecipe).sortRecipe.includeBelow,false);
 assert(old.items.every(item=>Sort.data.concepts.find(c=>c.id===item.sourceConceptId).level==='N5'));
});

for (const level of C.qualificationLevels) test(`Styles rounds at ${level} include styles from this and earlier levels`, () => {
 const exists = require('node:fs').existsSync;
 const random = rng(23);
 const groupOrders = new Set();
 const levelIndex = C.qualificationLevels.indexOf(level), sampledLevels = new Set();
 for (let round = 0; round < 100; round++) {
  const activity = Sort.create({ level, type: 'styles', shuffle: list => C.shuffle(list, random) });
  const { groups } = activity.sortRecipe;
  assert.equal(activity.sortRecipe.includeBelow, true);
  assert.equal(new Set(groups).size, 4);
  assert.equal(activity.items.length, 12);
  assert.equal(new Set(activity.items.map(item => item.media.src)).size, 12);
  for (const group of groups) assert.equal(activity.items.filter(item => item.group === group).length, 3);
  groupOrders.add(groups.join('|'));
  const placements = {};
  for (const [index, item] of activity.items.entries()) {
   const source = Sort.data.concepts.find(concept => concept.id === item.sourceConceptId);
   const sourceIndex = C.qualificationLevels.indexOf(source.level);
   assert(sourceIndex >= 0 && sourceIndex <= levelIndex);
   sampledLevels.add(source.level);
   assert.equal(item.prompt, '');
   assert.equal(item.media.type, 'audio');
   const path = decodeURIComponent(item.media.src);
   assert(exists(path), path);
   assert(path.startsWith('./audio/concept-library/0' + (sourceIndex + 1) + '. '));
   assert.equal(source.name, item.group);
   assert(groups.includes(item.group));
   placements[index] = item.group;
  }
  assert(C.gradeSort(activity.items, placements).every(mark => mark.correct));
  const wrong = groups.find(group => group !== placements[0]);
  assert.equal(C.gradeSort(activity.items, { ...placements, 0: wrong })[0].correct, false);
 }
 assert(groupOrders.size > 15);
 assert.deepEqual([...sampledLevels].sort(), C.qualificationLevels.slice(0, levelIndex + 1).sort());
});

test('a Styles QR link restores the same audio and rejects an unavailable excerpt', async () => {
 const activity = Sort.create({ level: 'AH', type: 'styles', shuffle: list => [...list].reverse() });
 const url = await sharing.createUrl('https://hub.test/conceptsort.html', activity);
 const restored = await sharing.readHash(new URL(url).hash);
 assert.deepEqual(restored.items, activity.items);
 assert.deepEqual(restored.sortRecipe, activity.sortRecipe);
 const bad = structuredClone(activity.sortRecipe);
 bad.cards[0].key = 'not-a-recording';
 assert.throws(() => Sort.fromRecipe(bad), /recording is unavailable/);
 const repeat = structuredClone(activity.sortRecipe);
 repeat.cards[1] = repeat.cards[0];
 assert.throws(() => Sort.fromRecipe(repeat), /three different excerpts/);
 assert.throws(() => Sort.fromRecipe({...activity.sortRecipe, level:'N3'}), /outside the levels allowed/);
 assert.throws(() => Sort.fromRecipe({...activity.sortRecipe, includeBelow:false}), /outside the levels allowed/);
 const legacy = { ...activity.sortRecipe, level:'N3', family:'styles',
  cards: activity.sortRecipe.groups.slice(0,3).map(group=>activity.sortRecipe.cards.find(card=>card.group===group)),
 };
 assert.equal(Sort.fromRecipe(legacy).items.length,3);
 assert.equal(Sort.fromRecipe({...activity.sortRecipe, level:'N3', family:'styles'}).items.length,12);
});
