const test=require('node:test'),assert=require('node:assert/strict');
const Sort=require('../shared/music-games-sort'),C=require('../music-games/core'),sharing=require('../music-games/sharing');
const source=require('../scripts/concept-sort-musical-periods.cjs'),D=require('../music-dictionary/music-concepts-data');
test('period pools are cumulative and only useful levels are offered',()=>{
 assert.deepEqual(Object.keys(Sort.data.musicalPeriods),['N5','H','AH']);
 for(const [level,count,size]of [['N5',11,11],['H',31,18],['AH',57,18]]){
  const bank=Sort.data.musicalPeriods[level];assert.equal(bank.cards.length,count);assert.equal(bank.roundSize,size);
  for(const row of bank.cards)assert(D.levels.indexOf(D.concepts.find(c=>c.id===row.id).level)<=C.qualificationLevels.indexOf(level));
  if(level==='AH')assert.deepEqual(bank.groups,source.periods);
  if(level==='H')assert.deepEqual(bank.groups,['Pre-Baroque','Baroque','Classical','Romantic','20th century']);
 }
 assert(!Sort.data.musicalPeriods.N5.groups.includes('Medieval'));
 for(const level of ['N3','N4'])assert.throws(()=>Sort.create({level,type:'periods'}),/National 5, Higher and Advanced Higher/);
});
test('each sampled round has unique concepts and every relevant historical period represented',()=>{
 for(const level of ['N5','H','AH'])for(let run=0;run<80;run++){
  const a=Sort.create({level,type:'periods'}),bank=Sort.data.musicalPeriods[level];
  assert.equal(a.items.length,bank.roundSize);assert.equal(new Set(a.items.map(i=>i.sourceConceptId)).size,bank.roundSize);
  assert.deepEqual(a.sortRecipe.groups,bank.groups);assert(a.sortRecipe.includeBelow);assert.equal(C.compatibility('group-sort',a).ok,true);
  for(const group of bank.groups)assert(a.items.some(i=>i.group===group));
  for(const [i,item]of a.items.entries())for(const group of bank.groups)assert.equal(C.gradeSort(a.items,{[i]:group})[i].correct,item.acceptedGroups.includes(group));
 }
 for(const level of ['H','AH']){const seen=new Set();for(let run=0;run<100;run++)for(const item of Sort.create({level,type:'periods'}).items)seen.add(item.sourceConceptId);assert.equal(seen.size,Sort.data.musicalPeriods[level].cards.length);}
});
test('specific period anchors and genuine boundary associations are protected',()=>{
 const rows=new Map(source.rows.map(row=>[D.concepts.find(c=>c.id===row.id).name,row.groups]));
 assert.deepEqual(rows.get('Plainchant'),['Medieval']);assert.deepEqual(rows.get('Alberti bass'),['Classical']);
 assert.deepEqual(rows.get('Basso continuo'),['Baroque']);assert.deepEqual(rows.get('Rubato'),['Romantic']);
 assert.deepEqual(rows.get('Serial'),['20th century']);assert.deepEqual(rows.get('Recorder'),['Renaissance','Baroque']);
 assert(rows.get('Impressionist').includes('Romantic')&&rows.get('Impressionist').includes('20th century'));
 for(const generic of ['Chord','Major tonality','Piano','Ascending','Staccato'])assert(!rows.has(generic));
});
test('shared period links preserve the exact selected round and reject invalid replacements',async()=>{
 for(const level of ['N5','H','AH']){
  const a=Sort.create({level,type:'periods'}),url=await sharing.createUrl('https://hub.test/conceptsort.html',a);assert(url.length<=2800);const restored=await sharing.readHash(new URL(url).hash);assert.deepEqual(restored.items,a.items);assert.deepEqual(restored.sortRecipe,a.sortRecipe);
  assert.throws(()=>Sort.fromRecipe({...a.sortRecipe,cards:a.sortRecipe.cards.slice(1)}),/complete round/);
  const bad=structuredClone(a.sortRecipe),index=a.items.findIndex(item=>a.sortRecipe.groups.some(g=>!item.acceptedGroups.includes(g)));bad.cards[index].group=a.sortRecipe.groups.find(g=>!a.items[index].acceptedGroups.includes(g));assert.throws(()=>Sort.fromRecipe(bad),/invalid answer group/);
 }
});


test('Higher merges early periods and always includes Modal and Mass',()=>{
 for(let run=0;run<50;run++){
  const a=Sort.create({level:'H',type:'periods'});
  assert(!a.sortRecipe.groups.includes('Medieval'));assert(!a.sortRecipe.groups.includes('Renaissance'));
  for(const name of ['Mode or modal','Mass']){
   const index=a.items.findIndex(i=>i.prompt===name);assert(index>=0);
   assert.equal(C.gradeSort(a.items,{[index]:'Pre-Baroque'})[index].correct,true);
  }
 }
 const a=Sort.create({level:'H',type:'periods'}),legacy=structuredClone(a.sortRecipe);
 legacy.groups=['Medieval','Renaissance','Baroque','Classical','Romantic','20th century'];
 legacy.cards=legacy.cards.map(c=>({...c,group:c.group==='Pre-Baroque'?'Renaissance':c.group}));
 const restored=Sort.fromRecipe(legacy);assert(restored.sortRecipe.groups.includes('Pre-Baroque'));assert(!restored.sortRecipe.groups.includes('Renaissance'));
 assert.deepEqual(Sort.create({level:'AH',type:'periods'}).sortRecipe.groups,source.periods);
});

test('National 5 has four periods and places Recorder in Baroque, including older shared rounds',()=>{
 const bank=Sort.data.musicalPeriods.N5;
 assert.deepEqual(bank.groups,['Baroque','Classical','Romantic','20th century']);
 assert(bank.cards.every(card=>!card.groups.includes('Renaissance')));
 const a=Sort.create({level:'N5',type:'periods'});
 const index=a.items.findIndex(item=>item.prompt==='Recorder');assert(index>=0);
 assert.equal(C.gradeSort(a.items,{[index]:'Baroque'})[index].correct,true);
 const legacy=structuredClone(a.sortRecipe);
 legacy.groups.unshift('Renaissance');
 legacy.cards=legacy.cards.map(card=>({...card,group:card.key==='MC-0131'?'Renaissance':card.group}));
 const restored=Sort.fromRecipe(legacy);assert.deepEqual(restored.sortRecipe.groups,bank.groups);
 assert.equal(restored.items.find(item=>item.prompt==='Recorder').group,'Baroque');
});

test('recommended additions inherit into later levels and accept their historical alternatives',()=>{
 const additions={N5:['Symphony'],H:['Oratorio','Obbligato','Sonata','String quartet'],AH:['Answer','Countersubject','Stretto','Hemiola','Countertenor','Piano trio','Retrograde']};
 const levels=['N5','H','AH'];
 for(const [introduced,names]of Object.entries(additions))for(const name of names){
  const concept=D.concepts.find(c=>c.name===name);assert(concept);
  for(const level of levels.slice(levels.indexOf(introduced)))assert(Sort.data.musicalPeriods[level].cards.some(c=>c.id===concept.id));
 }
 const ah=Sort.data.musicalPeriods.AH;
 const groups=name=>ah.cards.find(c=>c.id===D.concepts.find(c=>c.name===name).id).groups;
 assert.deepEqual(groups('Hemiola'),['Renaissance','Baroque']);
 assert.deepEqual(groups('Countertenor'),['Renaissance','Baroque']);
 assert.deepEqual(groups('Retrograde'),['20th century']);
 for(const name of ['Answer','Countersubject','Stretto'])assert.deepEqual(groups(name),['Baroque','Classical','Romantic','20th century']);
});
