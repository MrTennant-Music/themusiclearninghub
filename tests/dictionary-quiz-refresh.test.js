'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require.resolve('../music-dictionary/quiz-refresh.js'),'utf8');
function page({storage=new Map(),type='navigate',search='?level=AH&quiz=example'}={}){
 const attributes=new Map(),events={},root={inert:false,restored:false,hasAttribute:key=>attributes.has(key),setAttribute:(key,value)=>attributes.set(key,value),replaceChildren(){this.restored=true;},querySelector:selector=>selector==='.cq-practice'?{}:null,cloneNode:()=>({innerHTML:'<main>Existing quiz shell</main>',querySelector:()=>null,querySelectorAll:()=>[]})};
 const document={getElementById:()=>root,querySelector:()=>null,head:{appendChild(){}},createElement:type=>type==='template'?{content:{querySelectorAll:()=>[]}}:{}};
 vm.runInNewContext(source,{document,window:{addEventListener:(name,fn)=>events[name]=fn},location:{pathname:'/conceptquiz.html',search},sessionStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},performance:{getEntriesByType:()=>[{type}]},URLSearchParams,Date});
 return {root,events,storage};
}
test('refresh restores the exact active quiz shell before the app mounts',()=>{
 const original=page();original.events.pagehide();
 const refreshed=page({storage:original.storage,type:'reload'});
 assert.equal(refreshed.root.restored,true);assert.equal(refreshed.root.inert,true);assert.equal(refreshed.root.hasAttribute('aria-busy'),true);
});
test('ordinary navigation and a different quiz never display a stale shell',()=>{
 const original=page();original.events.pagehide();
 assert.equal(page({storage:original.storage}).root.restored,false);
 assert.equal(page({storage:original.storage,type:'reload',search:'?level=N3&quiz=other'}).root.restored,false);
 assert.equal(page({storage:original.storage,type:'reload',search:'?level=AH'}).root.restored,false);
});
test('a refresh during the preview does not replace its saved shell',()=>{
 const original=page();original.events.pagehide();const previous=[...original.storage.values()][0];
 const preview=page({storage:original.storage,type:'reload'});preview.events.pagehide();
 assert.equal([...original.storage.values()][0],previous);
});
