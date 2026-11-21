const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const generator=require('../shared/music-games-connections'),bank=require('../shared/music-games-connections-bank').banks.N3,G=require('../shared/music-games-collections'),C=require('../music-games/core'),S=require('../scripts/music-games-dictionary-content.cjs');
const choices=generator.combinations('N3');
test('reviewed groups generate every compatible board without duplicate or equivalent concepts',()=>{
 assert.equal(bank.groups.length,40);assert.ok(choices.length>2918);
 const signatures=new Set(),covered=new Set();
 for(const choice of choices){
  assert.equal(choice.groups.length,4);assert.equal(new Set(choice.groups.map(g=>g.family)).size,4);
  const ids=choice.groups.flatMap(g=>g.conceptIds),concepts=ids.map(id=>S.byId.get(id));
  assert.equal(ids.length,16);assert.equal(new Set(ids).size,16);
  assert.ok(!concepts.some((concept,i)=>concepts.slice(i+1).some(other=>S.overlaps(concept,other))));
  assert.ok(!bank.groups.some(group=>!choice.groups.some(chosen=>chosen.id===group.id)&&group.conceptIds.every(id=>ids.includes(id))),'Board exposes an unassigned valid quartet');
  const signature=ids.slice().sort().join('|');assert.ok(!signatures.has(signature));signatures.add(signature);
  ids.forEach(id=>covered.add(id));
 }
 assert.deepEqual([...covered].sort(),G.eligible('N3','matching-pairs').map(c=>c.id).sort());
});
test('on-demand activities retain exact authored quartets and normal engine/sharing compatibility',()=>{
 for(const choice of choices.filter((_,i)=>i%97===0)){
  const activity=generator.make(choice,'N3');
  assert.equal(activity.title,'Connections');assert.equal(activity.level,'N3');assert.equal(activity.template,'matching-pairs');
  assert.equal(C.compatibility('matching-pairs',activity).ok,true);
  for(const group of choice.groups)assert.deepEqual(activity.items.filter(item=>item.group===group.label).map(item=>item.sourceConceptId),group.conceptIds);
  const [shared]=C.normalizeImport(C.exportActivity(activity));
  assert.deepEqual(shared.items.map(item=>item.prompt),activity.items.map(item=>item.prompt));
  assert.deepEqual(shared.items.map(item=>item.group),activity.items.map(item=>item.group));
 }
});
test('each random draw excludes the previous combination without storing any games',()=>{
 const first=generator.create('N3',null,rows=>rows),next=generator.create('N3',first.id,rows=>rows);
 assert.notEqual(next.id,first.id);
 assert.equal(generator.create('N3',next.id,rows=>rows.reverse()).id,choices.at(-1).id);
 assert.throws(()=>generator.create('UNKNOWN',null,rows=>rows),/no compatible/);
 assert.deepEqual(generator.levels,['N3','N4','N5','H','AH']);
 const index=JSON.parse(fs.readFileSync('music-games/activities/index.json','utf8'));
 assert.equal(index.filter(activity=>activity.tags?.includes('national3-connections')).length,0);
 assert.equal(fs.readdirSync('music-games/activities').filter(file=>/^hub-n3-connections-.*\.(json|js)$/.test(file)).length,0);
});

test('a full shuffled cycle uses all forty linked groups once before resetting',()=>{
 for(let run=0;run<30;run++){
  let state=null,last=null;const seen=new Set();
  for(let game=0;game<10;game++){
   state=generator.draw('N3',state,C.shuffle,last);
   const board=generator.fromCycle('N3',state);last=board.id;
   for(const id of board.tags.slice(1)){assert.ok(!seen.has(id));seen.add(id);}
   state=JSON.parse(JSON.stringify(state));
  }
  assert.equal(seen.size,40);
  const reset=generator.draw('N3',state,C.shuffle,last);
  assert.equal(reset.index,1);assert.notEqual(generator.fromCycle('N3',reset).id,last);
 }
});
test('cycle state repairs changed banks or malformed saved data',()=>{
 for(const state of [{games:'invalid'},null,{version:bank.version,games:[],index:0},{version:'old',games:['missing'],index:1}]){
  const next=generator.draw('N3',state,rows=>rows);
  assert.equal(next.games.length,10);assert.equal(next.index,1);
 }
});
test('linked group bank includes the user examples and cross-category themes',()=>{
 const signatures=new Set(bank.groups.map(group=>group.conceptIds.slice().sort().join('|')));
 for(const ids of [['MC-0008','MC-0031','MC-0033','MC-0042'],['MC-0057','MC-0055','MC-0042','MC-0051']])assert.ok(signatures.has(ids.slice().sort().join('|')));
 assert.ok(bank.groups.some(group=>group.label==='Guitars'));
 assert.ok(bank.groups.some(group=>group.label==='Choral music'));
});
test('generated QR links preserve the complete board without activity files or stored content',async()=>{
 const sharing=require('../music-games/sharing');
 const original=generator.make(choices[Math.floor(choices.length/2)],'N3');
 const link=await sharing.createUrl('https://hub.test/connections.html?practice=1',original);
 assert.ok(link.length<=2800);
 const restored=await sharing.readHash(new URL(link).hash);
 assert.deepEqual(restored.items,original.items);assert.deepEqual(restored.tags,original.tags);
 assert.equal(restored.level,'N3');assert.equal(restored.template,'matching-pairs');
});
