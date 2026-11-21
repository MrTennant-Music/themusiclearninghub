const test=require('node:test'),assert=require('node:assert/strict');
const F=require('../shared/music-games-facts'),S=require('../shared/music-games-sort'),C=require('../music-games/core'),D=require('../music-dictionary/music-concepts-data'),sharing=require('../music-games/sharing');
test('the fact bank keeps all 57 Dictionary styles and 238 recoverable retired records',()=>{
 const bank=F.bank({});assert.deepEqual(bank.map(c=>c.id).sort(),D.concepts.filter(c=>c.categories.includes('Styles')).map(c=>c.id).sort());assert.equal(bank.length,57);assert.equal(F.catalogue().filter(c=>c.deleted).length,238);assert.deepEqual(F.catalogue().map(c=>c.id).sort(),D.concepts.map(c=>c.id).sort());
 assert.equal(bank.reduce((n,c)=>n+c.facts.length,0),228);
 for(const c of bank){assert(c.source);assert(c.facts.length>=4);for(const fact of c.facts){assert(fact.text.length>5);assert(fact.text.length<=60);assert(fact.text.split(/\s+/).length<=12);assert(!/^S\.$/.test(fact.text));}}
});
test('every level generates exactly four distinct headings and all cards for those concepts',()=>{
 for(const level of C.qualificationLevels)for(let n=0;n<70;n++){
  const a=S.create({level,type:'facts'}),bank=F.pool(level,{});
  assert.equal(a.sortRecipe.groups.length,4);assert.equal(new Set(a.sortRecipe.groups.map(C.canonical)).size,4);assert.equal(a.sourceConceptIds.length,4);assert.equal(a.sortRecipe.includeBelow,false);assert(bank.every(c=>c.level===level));for(const row of a.sortRecipe.factGroups)for(const fact of row.facts)for(const id of fact.also)assert.equal(F.catalogue().find(c=>c.id===id).level,level);
  assert.equal(a.items.length,a.sourceConceptIds.reduce((count,id)=>count+bank.find(c=>c.id===id).facts.length,0));
  for(const id of a.sourceConceptIds){const c=bank.find(c=>c.id===id);assert(c);assert.deepEqual(a.items.filter(item=>item.sourceConceptId===id).map(item=>item.prompt),c.facts.map(f=>f.text));}
  assert(C.gradeSort(a.items,Object.fromEntries(a.items.map((item,i)=>[i,item.group]))).every(mark=>mark.correct));assert(C.compatibility('group-sort',a).ok);
 }
});
test('local edits, additional facts, deletions and explicit alternatives control future rounds',()=>{
 const base=F.bank({}),find=name=>base.find(c=>c.name===name).id,ids=['Lied','Oratorio','Sonata','Plainchant'].map(find);
 const overrides={[ids[0]]:[{text:'A custom solo voice fact',also:[ids[1]]},{text:'Additional saved fact',also:[]},{text:'Third useful fact',also:[]},{text:'Fourth useful fact',also:[]}]};
 const a=F.create({level:'H',overrides,conceptIds:ids});
 const rows=a.items.filter(i=>i.sourceConceptId===ids[0]);assert.equal(rows.length,4);assert.equal(rows[0].prompt,'A custom solo voice fact');assert.deepEqual(rows[0].acceptedGroups,['Lied','Oratorio']);
 const i=a.items.indexOf(rows[0]);assert(C.gradeSort(a.items,{[i]:'Oratorio'})[i].correct);assert(!C.gradeSort(a.items,{[i]:'Plainchant'})[i].correct);
 assert.throws(()=>F.validate({[ids[0]]:[]}),/at least one/);assert.throws(()=>F.validate({[ids[0]]:[{text:''}]}),/Write a fact/);assert.throws(()=>F.validate({[ids[0]]:[{text:'Same'},{text:'same'}]}),/repeated/);
 const previous=global.localStorage,store=new Map();global.localStorage={getItem:key=>store.get(key),setItem:(key,value)=>store.set(key,value)};
 try{F.save(overrides);assert.equal(F.read()[ids[0]].length,4);assert.equal(F.bank().find(c=>c.id===ids[0]).facts[1].text,'Additional saved fact');}finally{if(previous===undefined)delete global.localStorage;else global.localStorage=previous;}
});
test('identical facts accept all matching selected concepts',()=>{
 const bank=F.bank({}),ids=['Blues','Jazz','Pop','Rock'].map(name=>bank.find(c=>c.name===name).id);
 const a=F.create({level:'N3',overrides:{},conceptIds:ids});const index=a.items.findIndex(item=>item.prompt==='Improvised solos');assert(index>=0);assert.deepEqual(a.items[index].acceptedGroups,['Blues','Jazz']);
});
test('shared Musical Facts snapshots survive different local edits and later source changes',async()=>{
 const bank=F.bank({}),ids=['Lied','Oratorio','Sonata','Plainchant'].map(name=>bank.find(c=>c.name===name).id),a=F.create({level:'H',conceptIds:ids,overrides:{[ids[0]]:[{text:'Teacher-edited fact for sharing',also:[ids[1]]},...bank.find(c=>c.id===ids[0]).facts.slice(1)]}});
 const link=await sharing.createUrl('https://hub.test/conceptsort.html',a);assert(link.length<=2800);const restored=await sharing.readHash(new URL(link).hash);assert.deepEqual(restored.items,a.items);assert.deepEqual(restored.sortRecipe,a.sortRecipe);
 for(const level of C.qualificationLevels){const b=S.create({level,type:'facts'}),url=await sharing.createUrl('https://hub.test/conceptsort.html',b);assert.deepEqual((await sharing.readHash(new URL(url).hash)).items,b.items);}
});
test('all facts are included without imposing the ordinary 40-card or 200-item limits',()=>{
 const bank=F.pool('N3',{}).slice(0,4),overrides=Object.fromEntries(bank.map(c=>[c.id,Array.from({length:56},(_,i)=>({text:c.name+' fact '+i,also:[]}))]));
 const a=F.create({level:'N3',overrides,conceptIds:bank.map(c=>c.id)});assert.equal(a.items.length,224);assert.equal(C.compatibility('group-sort',a).ok,true);assert.equal(C.normalize(a).items.length,224);assert.equal(S.fromRecipe(a.sortRecipe).items.length,224);
});

test('equivalent headings do not compete in random rounds, while all active concepts remain selectable',()=>{
 const pool=F.pool('AH',{});
 for(const first of pool){const shuffle=items=>[...items].sort((a,b)=>a.id===first.id?-1:b.id===first.id?1:0);const a=F.create({level:'AH',overrides:{},shuffle});assert(a.sourceConceptIds.includes(first.id));const chosen=a.sourceConceptIds.map(id=>pool.find(c=>c.id===id));for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)assert(F.contrast(chosen[i],chosen[j]));}
});
test('older mixed-level shared snapshots preserve their exact accepted placements',async()=>{
 const bank=F.catalogue(),headings=['Lied','Aria','Plainchant','Concerto grosso'],chosen=headings.map(name=>bank.find(c=>c.name===name));
 const recipe={version:'facts-1',type:'facts',level:'H',includeBelow:true,factGroups:chosen.map((c,i)=>({conceptId:c.id,facts:[{text:i?'Historical fact '+i:'Historical solo-voice fact',also:i?[]:[chosen[1].id]}]}))};
 const a=F.fromRecipe(recipe),i=a.items.findIndex(item=>item.prompt==='Historical solo-voice fact');assert(C.gradeSort(a.items,{[i]:'Aria'})[i].correct);assert.equal(a.sortRecipe.includeBelow,true);
 const url=await sharing.createUrl('https://hub.test/conceptsort.html',a);assert.deepEqual((await sharing.readHash(new URL(url).hash)).items,a.items);
 assert.throws(()=>F.fromRecipe({...recipe,includeBelow:false}),/outside this Facts level/);
});
test('saving changes merges other tabs and refuses to overwrite competing edits to the same concept',()=>{
 const previous=global.localStorage,store=new Map();global.localStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)};
 try{
  const first='MC-0001',second='MC-0002',baseline=F.read();
  F.saveChanges({[second]:[{text:'Other tab jazz fact',also:[]},...F.bank({}).find(c=>c.id===second).facts.slice(1)]},baseline);
  const merged=F.saveChanges({[first]:[{text:'My blues edit',also:[]},...F.bank({}).find(c=>c.id===first).facts.slice(1)]},baseline);assert.equal(merged[second][0].text,'Other tab jazz fact');assert.equal(merged[first][0].text,'My blues edit');
  assert.throws(()=>F.saveChanges({[first]:[{text:'Stale blues edit',also:[]}]},baseline),/changed in another tab/);assert.equal(F.read()[first][0].text,'My blues edit');
 }finally{if(previous===undefined)delete global.localStorage;else global.localStorage=previous;}
});
test('deleted concepts persist across levels, restore edited facts, and leave shared snapshots intact',()=>{
 const previous=global.localStorage,store=new Map();global.localStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)};
 try{
  const id='MC-0001',facts=[{text:'My edited blues fact',also:[]},...F.bank({}).find(c=>c.id==='MC-0001').facts.slice(1)],snapshot=F.create({level:'N3',overrides:{},conceptIds:F.pool('N3',{}).slice(0,4).map(c=>c.id)});
  F.save({[id]:facts});const baseline=F.read();F.saveChanges({[id]:{deleted:true,facts:baseline[id]}},baseline);
  assert(F.read()[id].deleted);assert.equal(F.read()[id].facts[0].text,facts[0].text);
  for(const level of C.qualificationLevels){assert(!F.pool(level).some(c=>c.id===id));assert.equal(F.pool(level).length,F.pool(level,{}).length-(level==='N3'?1:0));const round=F.create({level,shuffle:rows=>rows});assert(!round.sourceConceptIds.includes(id));}
  assert.deepEqual(F.fromRecipe(snapshot.sortRecipe).items,snapshot.items);
  assert.throws(()=>F.saveChanges({[id]:facts},baseline),/changed in another tab/);
  F.saveChanges({[id]:F.read()[id].facts},F.read());assert.equal(F.bank().find(c=>c.id===id).facts[0].text,facts[0].text);
  const removeAll=Object.fromEntries(F.bank({}).map(c=>[c.id,{deleted:true,facts:c.facts}]));assert.throws(()=>F.save(removeAll),/four contrasting/);assert(F.bank().length===57);
 }finally{if(previous===undefined)delete global.localStorage;else global.localStorage=previous;}
});

test('one, two and three fact concepts can be saved, imported and used in new rounds',()=>{
 const previous=global.localStorage,store=new Map();global.localStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)};
 try{
  const source=F.bank({})[0],other=F.pool('N3',{}).filter(c=>c.id!==source.id).slice(0,3);
  for(const count of [1,2,3]){
   const short=source.facts.slice(0,count);F.save({[source.id]:short});assert.equal(F.read()[source.id].length,count);assert.equal(F.bank().find(c=>c.id===source.id).facts.length,count);
   const a=F.create({level:'N3',conceptIds:[source.id,...other.map(c=>c.id)]});assert.equal(a.items.filter(i=>i.sourceConceptId===source.id).length,count);
   const imported=F.importBackup(F.backup());assert.equal(imported[source.id].length,count);
  }
  const retired=F.catalogue().find(c=>c.name==='Arco');F.save({[retired.id]:retired.facts.slice(0,1)});assert.equal(F.read()[retired.id].length,1);assert(F.bank().some(c=>c.id===retired.id));
  assert.throws(()=>F.save({[source.id]:[]}),/at least one fact/);
 }finally{if(previous===undefined)delete global.localStorage;else global.localStorage=previous;}
});
test('teacher wording and deletions are kept while alternatives stay within their concept level',()=>{
 const bank=F.bank({}),catalogue=F.catalogue(),speech=catalogue.find(c=>c.name==='Sprechgesang');assert.equal(speech.facts.length,4);assert(speech.facts.some(f=>f.text==='Often performed in German'));
 for(const name of ['Question and answer','Scale','Semitone','Tone','Countertenor'])assert(!bank.some(c=>c.name===name));
 for(const owner of catalogue)for(const fact of owner.facts)for(const target of fact.also)assert.equal(catalogue.find(c=>c.id===target).level,owner.level);
});
test('backups preserve unfinished drafts and importing a complete reviewed bank restores all decisions',()=>{
 const concept=F.bank({})[0],draft={[concept.id]:[...concept.facts,{text:'',also:[]}]};
 const backup=F.backup(draft);assert.equal(backup.concepts.find(c=>c.id===concept.id).facts.at(-1).text,'');assert.throws(()=>F.importBackup(backup),/Write a fact/);
 const complete=F.backup({}),restored=F.importBackup(complete);assert.deepEqual(F.bank(restored),F.bank({}));assert.equal(Object.keys(restored).length,295);assert.equal(complete.deletedConcepts.length,238);
 assert.throws(()=>F.importBackup({...complete,concepts:complete.concepts.slice(1)}),/every active and deleted/);
});
test('saving an imported bank stores only differences and avoids filling browser storage with defaults',()=>{
 const previous=global.localStorage,store=new Map();global.localStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>{if(value.length>100)throw Error('Storage quota exceeded');store.set(key,value);}};
 try{const reviewed=F.importBackup(F.backup({}));F.save(reviewed);assert.equal(store.get(F.storageKey),'{}');assert.equal(F.bank().length,57);assert.equal(F.pool('AH').reduce((n,c)=>n+c.facts.length,0),56);}finally{if(previous===undefined)delete global.localStorage;else global.localStorage=previous;}
});
test('every audited style alternative is accepted and stays inside the Styles category',()=>{
 const bank=F.bank({}),byId=new Map(bank.map(c=>[c.id,c]));let links=0;
 for(const owner of bank)for(const fact of owner.facts)for(const target of fact.also){
  assert(byId.has(target),'Non-style alternative for '+owner.name+': '+target);assert.notEqual(target,owner.id);
  assert.equal(byId.get(target).level,owner.level);const filler=bank.filter(c=>c.level===owner.level&&c.id!==owner.id&&c.id!==target).slice(0,2),a=F.create({level:owner.level,overrides:{},conceptIds:[owner.id,target,...filler.map(c=>c.id)]}),i=a.items.findIndex(row=>row.sourceConceptId===owner.id&&row.prompt===fact.text);
  assert(i>=0);assert(C.gradeSort(a.items,{[i]:byId.get(target).name})[i].correct,owner.name+' / '+fact.text+' → '+byId.get(target).name);links++;
 }
 assert(links>200);
});
test('overlapping facts accept valid same-level alternatives without crediting unrelated styles',()=>{
 const bank=F.bank({}),id=name=>bank.find(c=>c.name===name).id;
 const cases=[
  ['N3',['Blues',"Rock 'n' roll",'Jazz','Pop'],'Often uses a 12-bar pattern',["Rock 'n' roll",'Jazz'],['Pop']],
  ['N4',['Opera','Concerto','Ragtime','Swing'],'Usually orchestral accompaniment',['Concerto'],['Ragtime','Swing']],
  ['H',['Lied','Sonata','Oratorio','Soul music'],'Piano accompaniment',['Sonata'],['Oratorio','Soul music']],
  ['AH',['Anthem','Motet','Chorale','Serial'],'Sacred choral work',['Motet','Chorale'],['Serial']],
  ['AH',['Galliard','Pavan','Ballett','Serial'],'Triple metre',['Ballett'],['Pavan','Serial']],
  ['N4',['Rapping','Opera','Ragtime','Reggae'],'Central to hip-hop',[],['Opera','Ragtime','Reggae']],
  ['N5',['Gaelic psalm','Waulking song','Pibroch','Classical'],'Sung without instruments',['Waulking song'],['Pibroch','Classical']]
 ];
 for(const [level,headings,text,accepted,rejected]of cases){const a=F.create({level,overrides:{},conceptIds:headings.map(id)}),i=a.items.findIndex(row=>row.prompt===text);assert(i>=0,text);for(const name of accepted)assert(C.gradeSort(a.items,{[i]:name})[i].correct,text+' → '+name);for(const name of rejected)assert(!C.gradeSort(a.items,{[i]:name})[i].correct,text+' must not accept '+name);}
});
test('level pools and imported browser alternatives enforce exact qualification boundaries',()=>{
 const counts={N3:8,N4:11,N5:12,H:12,AH:14};for(const [level,count]of Object.entries(counts)){assert.equal(F.pool(level,{}).length,count);}
 const id=name=>F.bank({}).find(c=>c.name===name).id,blues=id('Blues'),jazz=id('Jazz'),swing=id('Swing'),facts=[{text:'Reviewed shared fact',also:[jazz,swing]}];
 const previous=global.localStorage,store=new Map();global.localStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)};
 try{store.set(F.storageKey,JSON.stringify({[blues]:facts}));assert.deepEqual(F.read()[blues][0].also,[jazz]);F.save({[blues]:facts});assert.deepEqual(F.read()[blues][0].also,[jazz]);const backup=F.backup();backup.concepts.find(c=>c.id===blues).facts[0].also.push(swing);assert.deepEqual(F.importBackup(backup)[blues][0].also,[jazz]);}finally{if(previous===undefined)delete global.localStorage;else global.localStorage=previous;}
 assert.throws(()=>F.create({level:'H',conceptIds:['Lied','Sonata','Oratorio','Opera'].map(id),overrides:{}}),/selected level/);
});

test('Facts is temporarily hidden while its content stays available for restoration',()=>{assert.equal(S.factsEnabled,false);assert(!S.collections.some(c=>c.type==='facts'));for(const level of C.qualificationLevels)assert(!S.availableTypes(level).includes('facts'));assert.equal(F.bank({}).length,57);});
