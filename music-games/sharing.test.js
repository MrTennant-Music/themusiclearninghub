const test=require('node:test'),assert=require('node:assert/strict');
const C=require('./core.js'),sharing=require('./sharing.js');
test('QR links open each starter activity with the selected game and complete options',async()=>{
 for(const seed of C.SEEDS){
  const options={...seed.options,timer:120,shuffle:false,difficulty:'hard',sound:false,theme:'high-readability'};
  const mode=C.TEMPLATES.find(t=>t.id!==seed.template&&C.compatibility(t.id,seed).ok)?.id||seed.template;
  const url=await sharing.createUrl('https://example.test/conceptsort.html?classroom=123456#old',{...C.convertTemplate(seed,mode),options});
  assert(url.length<=2800);assert.equal(new URL(url).search,'');
  const opened=await sharing.readHash(new URL(url).hash);
  assert.equal(opened.title,seed.title);assert.equal(opened.template,mode);
  assert.deepEqual(opened.options,C.normalize({...seed,options}).options);
  assert.deepEqual(opened.items,seed.items);assert.deepEqual(opened.diagram,seed.diagram);
 }
});
test('custom content and Unicode travel in the link without browser storage',async()=>{
 const original=C.makeActivity({title:'Écouter 🎵',items:[{prompt:'Très doux – 静か',answer:'Pianissimo',distractors:['Forte'],media:{type:'image',src:'https://example.test/notes.png'}}]});
 const url=await sharing.createUrl('https://example.test/conceptsort.html',original);
 const opened=await sharing.readHash(new URL(url).hash);
 assert.equal(opened.title,original.title);assert.deepEqual(opened.items,original.items);
 assert.equal(opened.id,C.sharedActivityId(original));
});
test('library links clear old activity parameters, and damaged activity links fail',async()=>{
 assert.equal(await sharing.createUrl('https://example.test/conceptsort.html?old=1#playnote=old',null),'https://example.test/conceptsort.html');
 await assert.rejects(sharing.readHash('#playnote=%invalid'),/invalid/);
 await assert.rejects(sharing.readHash('#playnote=YWJj'));
 await assert.rejects(sharing.readHash('#other=YWJj'),/not a music game/);
});
test('editing built-in question content never replaces it with the original seed',async()=>{
 const seed=C.SEEDS.find(value=>JSON.stringify(value).length<5000&&value.items.length);
 assert(seed);
 const changed=C.normalize({...seed,items:seed.items.map((item,index)=>index?item:{...item,answer:item.answer+' edited'})});
 const url=await sharing.createUrl('https://example.test/conceptsort.html',changed);
 const opened=await sharing.readHash(new URL(url).hash);
 assert.deepEqual(opened.items,changed.items);
});
test('a changed built-in revision is reported instead of silently sharing different content',async()=>{
 const zlib=require('node:zlib');
 const seed=C.SEEDS[0];
 const url=new URL(await sharing.createUrl('https://example.test/conceptsort.html',seed));
 const payload=JSON.parse(zlib.inflateSync(Buffer.from(url.hash.slice(10),'base64url')).toString());
 assert.equal(payload.seedActivity,seed.id);
 payload.seedRevision=999999;
 const hash='#playnote='+zlib.deflateSync(JSON.stringify(payload)).toString('base64url');
 await assert.rejects(sharing.readHash(hash),/has changed/);
});

test('recent word games share exact concepts, collection tags and sound at every level',async()=>{
 const G=require('../shared/music-games-collections');
 for(const level of C.qualificationLevels)for(const template of ['crossword','wordsearch','group-sort']){
  const rows=G.eligible(level,'group-sort').slice(0,5);
  const activity=template==='group-sort'?G.make({name:'Shared Sort',level,template,ids:rows.map(c=>c.id),groups:['A','B'],assignments:Object.fromEntries(rows.map((c,i)=>[c.id,i%2]))}):G.categoryWordPuzzle(level,5,template,C.shuffle,true);
  activity.options.sound=false;
  const path=template==='crossword'?'crosswords':template==='wordsearch'?'wordsearch':'conceptsort';
  const link=new URL(await sharing.createUrl(`https://example.test/${path}.html?level=N3#old`,activity));
  const opened=await sharing.readHash(link.hash);
  assert.equal(link.pathname,`/${path}.html`);
  assert.equal(opened.level,level);
  assert.equal(opened.template,template);
  assert.deepEqual(opened.items,activity.items);
  assert.deepEqual(opened.tags,activity.tags);
  assert.equal(C.sessionOptions(opened,true).sound,false);
 }
});

test('Connections carries its collection through QR opening and the next board',async()=>{
 const literacy=require('../shared/music-games-literacy-connections');
 for(const level of C.qualificationLevels){
  const activity=literacy.create(level);
  const link=new URL(await sharing.createUrl('https://example.test/connections.html?collection=concepts',activity));
  assert.equal(link.searchParams.get('collection'),'literacy');
  const opened=await sharing.readHash(link.hash);
  assert.deepEqual(opened.items,activity.items);
  assert.equal(opened.level,level);
  assert.ok(opened.tags.includes('literacy-connections'));
 }
});
