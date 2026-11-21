const test=require('node:test'),assert=require('node:assert/strict');
const {ensure,sources}=require('../shared/music-games-startup');
const doc={baseURI:'https://hub.test/',querySelectorAll:()=>sources.map(([,file])=>({src:'https://hub.test/'+file+'?v=reviewed'}))};
test('complete cached sources require no recovery requests',async()=>{
 const target=Object.fromEntries(sources.map(([name])=>[name,{}]));assert.deepEqual(await ensure(target,doc,()=>assert.fail('Should not reload complete data')),[]);
});
test('missing sources are recovered in dependency order before the app starts',async()=>{
 const target={},loaded=[];await ensure(target,doc,async(url,name)=>{assert.equal(new URL(url).searchParams.get('retry'),'1');if(name==='MLHFacts')assert(target.IGCore&&target.MLHSortData);if(name==='MLHSort')assert(target.MLHFacts);target[name]={};loaded.push(name);});assert.deepEqual(loaded,sources.map(([name])=>name));
});
test('missing or unregistered sources produce a clear recoverable error',async()=>{
 await assert.rejects(()=>ensure({},doc,async()=>{}),/did not finish loading/);await assert.rejects(()=>ensure({},{baseURI:doc.baseURI,querySelectorAll:()=>[]}),/source is missing/);
});
test('Concept Sort runs source recovery before its compiled app starts',()=>{
 const html=require('node:fs').readFileSync('conceptsort.html','utf8');assert(html.includes('shared/music-games-startup.js'));assert(html.indexOf('shared/music-games-startup.js')<html.indexOf('music-games/runtime/app.js'));
});
test('recovering a missing dependency also rebuilds existing closures that captured it',async()=>{
 const target=Object.fromEntries(sources.map(([name])=>[name,{stale:true}]));delete target.IGCore;
 const loaded=await ensure(target,doc,async(url,name)=>{target[name]={fresh:true};});assert(loaded.includes('IGSharing'));assert(target.IGSharing.fresh);assert(target.MLHSort.fresh);
});
