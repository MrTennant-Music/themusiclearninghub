const test=require('node:test'),assert=require('node:assert/strict');
const generator=require('../shared/music-games-connections'),banks=require('../shared/music-games-connections-bank').banks,G=require('../shared/music-games-collections'),C=require('../music-games/core'),S=require('../scripts/music-games-dictionary-content.cjs'),sharing=require('../music-games/sharing');
const bank=banks.N5,choices=generator.combinations('N5');
test('N5 has forty distinct quartets covering every eligible N5 concept with earlier-level support',()=>{
 assert.equal(bank.groups.length,40);const signatures=new Set(),used=new Set();let previousLevel=false;
 for(const group of bank.groups){
  assert.equal(group.conceptIds.length,4);assert.equal(new Set(group.conceptIds).size,4);
  const signature=group.conceptIds.slice().sort().join('|');assert.ok(!signatures.has(signature));signatures.add(signature);
  const concepts=group.conceptIds.map(id=>S.byId.get(id));
  assert.ok(concepts.some(c=>c.level==='National 5'),group.id);
  assert.ok(concepts.every(c=>['National 3','National 4','National 5'].includes(c.level)));
  previousLevel||=concepts.some(c=>c.level==='National 3');
  assert.ok(!concepts.some((c,i)=>concepts.slice(i+1).some(other=>S.overlaps(c,other))));
  group.conceptIds.forEach(id=>used.add(id));
 }
 assert.equal(previousLevel,true);
 for(const concept of S.concepts.filter(c=>c.level==='National 5'))assert.ok(used.has(concept.id),concept.name);
});
test('every N5 board has four compatible groups and no extra authored quartet',()=>{
 assert.ok(choices.length>1000);const covered=new Set(),signatures=new Set();
 for(const choice of choices){
  const ids=choice.groups.flatMap(g=>g.conceptIds),concepts=ids.map(id=>S.byId.get(id));
  assert.equal(new Set(ids).size,16);assert.equal(new Set(choice.groups.map(g=>g.family)).size,4);
  assert.ok(!concepts.some((c,i)=>concepts.slice(i+1).some(other=>S.overlaps(c,other))));
  assert.ok(!bank.groups.some(group=>!choice.groups.includes(group)&&group.conceptIds.every(id=>ids.includes(id))));
  const signature=ids.slice().sort().join('|');assert.ok(!signatures.has(signature));signatures.add(signature);
  choice.groups.forEach(g=>covered.add(g.id));
 }
 assert.equal(covered.size,40);
});
test('N5 cycles use every group once and remain isolated from N3',()=>{
 for(let round=0;round<5;round++){
  let state=null,last=null;const seen=new Set();
  for(let i=0;i<10;i++){
   state=generator.draw('N5',JSON.parse(JSON.stringify(state)),C.shuffle,last);
   const activity=generator.fromCycle('N5',state);last=activity.id;
   assert.equal(activity.level,'N5');assert.ok(last.startsWith('generated-n5-connections-'));
   assert.equal(C.compatibility('matching-pairs',activity).ok,true);
   for(const id of activity.tags.slice(1)){assert.ok(!seen.has(id));seen.add(id);}
  }
  assert.equal(seen.size,40);
  const restarted=generator.draw('N5',state,C.shuffle,last);assert.equal(restarted.index,1);assert.notEqual(generator.fromCycle('N5',restarted).id,last);
  const n3=generator.draw('N3',null,C.shuffle);const n5=generator.draw('N5',n3,C.shuffle);
  assert.equal(n5.index,1);assert.equal(n5.version,banks.N5.version);assert.notEqual(n5.version,n3.version);
  assert.equal(generator.fromCycle('N3',n3).level,'N3');
 }
});
test('N5 generated content and qualification survive a QR-link round trip',async()=>{
 const original=generator.make(choices[Math.floor(choices.length/2)],'N5');
 const url=await sharing.createUrl('https://hub.test/connections.html?level=N5',original);
 assert.ok(url.length<=2800);
 const restored=await sharing.readHash(new URL(url).hash);
 assert.equal(restored.level,'N5');assert.deepEqual(restored.items,original.items);assert.deepEqual(restored.tags,original.tags);
});
