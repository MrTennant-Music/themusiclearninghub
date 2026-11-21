const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../shared/music-games-medals');
const defaultActivity=template=>({tags:['random-'+template]});
test('word games award inclusive per-word thresholds using actual puzzle size',()=>{
 for(const template of ['wordsearch','crossword'])for(const total of [1,13,15]){
  const base={template,activity:defaultActivity(template),total,correct:total};
  const cutoffs=[[20,'diamond','gold'],[25,'gold','silver'],[30,'silver','bronze'],[40,'bronze',null]];
  for(const [seconds,tier,next] of cutoffs){
   assert.equal(M.tierFor({...base,elapsedMs:total*seconds*1000}),tier);
   assert.equal(M.tierFor({...base,elapsedMs:total*seconds*1000+1}),next);
  }
 }
});
test('incomplete games, unsupported games, timeouts and invalid times never earn medals',()=>{
 const base={template:'wordsearch',activity:defaultActivity('wordsearch'),total:15,correct:15,elapsedMs:1000};
 for(const override of [{template:'quiz'},{correct:14},{timedOut:true},{total:0,correct:0},{elapsedMs:-1},{elapsedMs:NaN},{elapsedMs:Infinity}])assert.equal(M.tierFor({...base,...override}),null);
});
test('medals persist per puzzle, retain highest tier and do not downgrade',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 const result={template:'crossword',activity:defaultActivity('crossword'),total:15,correct:15,elapsedMs:15*25000};
 assert.equal(M.record(storage,'crossword:a',result),'gold');
 M.record(storage,'crossword:a',{...result,elapsedMs:15*40000});
 assert.equal(M.get(storage,'crossword:a').medal,'gold');assert.equal(M.get(storage,'crossword:a').bestMs,result.elapsedMs);
 assert.equal(M.get(storage,'wordsearch:a'),null);
 M.record(storage,'crossword:a',{...result,elapsedMs:15*15000});assert.equal(M.get(storage,'crossword:a').medal,'diamond');
 const before=values.get(M.storageKey);M.record(storage,'connections:a',{...result,template:'matching-pairs'});assert.equal(values.get(M.storageKey),before);
});

test('Connections never awards medals based on completion time',()=>{
 assert.equal(M.eligible('matching-pairs'),false);
 for(const elapsedMs of [0,10000,20000,35000])assert.equal(M.tierFor({template:'matching-pairs',total:4,correct:4,elapsedMs}),null);
});

test('sort medals scale per concept and use inclusive boundaries for all collection sizes',()=>{
 assert.equal(M.eligible('group-sort',defaultActivity('group-sort')),true);
 for(const total of [5,12,15,16,38]){
  const base={template:'group-sort',activity:defaultActivity('group-sort'),total,correct:total};
  for(const [seconds,tier,next] of [[20/12,'diamond','gold'],[30/12,'gold','silver'],[40/12,'silver','bronze'],[60/12,'bronze',null]]){
   assert.equal(M.tierFor({...base,elapsedMs:total*seconds*1000}),tier);
   assert.equal(M.tierFor({...base,elapsedMs:total*seconds*1000+1}),next);
  }
  assert.equal(M.tierFor({...base,correct:total-1,elapsedMs:1000}),null);
  assert.equal(M.tierFor({...base,timedOut:true,elapsedMs:1000}),null);
 }
 assert.deepEqual(Object.values(M.limitsFor('group-sort')),[20/12,30/12,40/12,60/12]);
});
test('sort records preserve the best medal and time independently from word games',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 const result={template:'group-sort',activity:defaultActivity('group-sort'),total:12,correct:12,elapsedMs:30000};
 assert.equal(M.record(storage,'group-sort:a',result),'gold');
 M.record(storage,'group-sort:a',{...result,elapsedMs:60000});
 assert.equal(M.get(storage,'group-sort:a').medal,'gold');
 assert.equal(M.get(storage,'group-sort:a').bestMs,30000);
 assert.equal(M.get(storage,'wordsearch:a'),null);
});

test('31 seconds earns Silver for a standard 12-concept sort',()=>{
 assert.equal(M.tierFor({template:'group-sort',activity:defaultActivity('group-sort'),total:12,correct:12,elapsedMs:31000}),'silver');
});

test('sort medals are claimed once per collection and level, including regenerated All boards',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 const all={id:'random-one',level:'N3',template:'group-sort',tags:['random-group-sort']};
 const result={template:'group-sort',total:12,correct:12,elapsedMs:40000};
 assert.equal(M.recordCollection(storage,all,result),'silver');
 assert.equal(M.recordCollection(storage,{...all,id:'random-two',items:[{answer:'Different selection'}]},result),null);
 assert.equal(M.recordCollection(storage,all,{...result,elapsedMs:60000}),null);
 assert.equal(M.recordCollection(storage,all,{...result,elapsedMs:30000}),'gold');
 assert.equal(M.recordCollection(storage,all,{...result,elapsedMs:30000}),null);
 assert.equal(M.recordCollection(storage,all,{...result,elapsedMs:20000}),'diamond');
 const refreshed={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 assert.equal(M.recordCollection(refreshed,{...all,id:'random-three'},{...result,elapsedMs:19000}),null);
 assert.equal(M.get(refreshed,M.collectionKey(all)).bestMs,19000);
 assert.equal(M.recordCollection(refreshed,{...all,level:'N4'},result),'silver');
 assert.equal(M.recordCollection(refreshed,{...all,tags:[],collectionId:'styles'},result),null);
 assert.equal(M.recordCollection(refreshed,{...all,id:'shared-qr-copy',tags:[],collectionId:'styles'},result),null);
});
test('legacy sort awards migrate without awarding them again, and shared legacy content has a stable key',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 const activity={id:'original',level:'H',title:'Headings',...defaultActivity('group-sort')};
 const result={template:'group-sort',activity:defaultActivity('group-sort'),total:12,correct:12,elapsedMs:30000};
 M.record(storage,'group-sort:original',result);
 assert.equal(M.recordCollection(storage,activity,result),null);
 const legacy={level:'H',title:'Orchestra',items:[{prompt:'Flute',answer:'Flute',group:'Woodwind'},{prompt:'Violin',answer:'Violin',group:'Strings'}]};
 assert.equal(M.collectionKey({...legacy,id:'original'}),M.collectionKey({...legacy,id:'shared-copy',items:legacy.items.slice().reverse()}));
});

test('personal collections cannot earn timed medals, including older and shared copies',async()=>{
 const C=require('../music-games/core'),Share=require('../music-games/sharing');
 for(const template of ['crossword','wordsearch','group-sort'])for(const fields of [{tags:['user-collection']},{folder:'My Collections'},{collectionEdition:2}]){
 const activity=C.makeActivity({title:'Personal collection',level:'N3',template,...fields,items:[{prompt:'Test',answer:'Test',group:'Group'},{prompt:'Other',answer:'Other',group:'Other group'}]});
 const result={activity,template,total:12,correct:12,elapsedMs:1000};
 assert.equal(M.eligible(template,activity),false);assert.equal(M.tierFor(result),null);
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};assert.equal(M.record(storage,'custom',result),null);assert.equal(M.recordCollection(storage,activity,result),null);assert.equal(values.size,0);
 const link=await Share.createUrl('https://hub.test/conceptsort.html',activity);const copy=await Share.readHash(new URL(link).hash);assert.equal(M.eligible(template,copy),false);
 }
 for(const template of ['crossword','wordsearch'])assert.equal(M.eligible(template,{folder:'My Collections',collectionEdition:2,tags:['random-'+template]}),true);
});

test('themed and literacy word puzzles and alternate sort recipes cannot earn medals',()=>{
 for(const template of ['crossword','wordsearch'])for(const category of [0,5]){
  const activity={tags:['category-'+template,template+'-category:'+category]};
  assert.equal(M.tierFor({template,activity,total:12,correct:12,elapsedMs:1000}),null);
 }
 for(const type of ['elements','styles','instruments','periods','facts']){
  const activity={tags:['generated-sort'],sortRecipe:{type}};
  const result={template:'group-sort',activity,total:12,correct:12,elapsedMs:1000};
  assert.equal(M.tierFor(result),type==='elements'?'diamond':null);
 }
 assert.equal(M.eligible('crossword'),false);
});
