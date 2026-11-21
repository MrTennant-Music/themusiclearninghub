const test=require('node:test'),assert=require('node:assert/strict');
const {create}=require('./navigation.js');
function setup(hash=''){
 const entries=[{url:'/index.html',state:null},{url:'/conceptsort.html'+hash,state:null}];let index=1;const views=[];
 const history={get state(){return entries[index].state;},replaceState(state,_,url){entries[index]={state,url};},pushState(state,_,url){entries.splice(++index);entries[index]={state,url};},back(){index--;nav.pop({state:entries[index].state});}};
 const nav=create(history,{pathname:'/conceptsort.html',search:'',hash},view=>views.push(view));
 return{nav,history,entries,views,get index(){return index;},forward(){index++;nav.pop({state:entries[index].state});}};
}
test('browser Back returns from a game to the activity library, then index',()=>{
 const h=setup();h.nav.navigate('activity');assert.equal(h.index,2);
 h.history.back();assert.equal(h.views.at(-1),'library');assert.equal(h.entries[h.index].url,'/conceptsort.html');
 h.forward();assert.equal(h.views.at(-1),'activity');
 h.history.back();h.history.back();assert.equal(h.entries[h.index].url,'/index.html');
});
test('each screen creates a normal browser history step',()=>{
 const h=setup();h.nav.navigate('templates');h.nav.navigate('editor');h.nav.navigate('activity');
 assert.equal(h.entries.length,5);
 h.history.back();assert.equal(h.views.at(-1),'editor');
 h.history.back();assert.equal(h.views.at(-1),'templates');
 h.history.back();assert.equal(h.views.at(-1),'library');
 h.forward();assert.equal(h.views.at(-1),'templates');
});
test('returning to the library preserves the previous activity for Back',()=>{
 const h=setup('#playnote=shared');h.nav.navigate('activity');h.nav.navigate('library');
 assert.equal(h.index,3);assert.equal(h.entries[h.index].url,'/conceptsort.html');
 h.history.back();assert.equal(h.views.at(-1),'activity');
 h.history.back();assert.equal(h.views.at(-1),'library');
});
test('repeated requests for the same screen do not add history entries',()=>{
 const h=setup();h.nav.navigate('activity');h.nav.navigate('activity');
 assert.equal(h.entries.length,3);
 h.nav.navigate('library');h.nav.navigate('library');assert.equal(h.entries.length,4);
});

test('refreshing a detail entry and repeated browser Back/Forward preserve the library',()=>{
 const h=setup();h.nav.navigate('activity');
 const restored=create(h.history,{pathname:'/conceptsort.html',search:'',hash:'#playnote=game'},()=>{},{initialView:'activity'});
 restored.navigate('activity');assert.equal(h.entries.length,3);
 for(let i=0;i<10;i++){h.history.back();assert.equal(h.index,1);assert.equal(h.views.at(-1),'library');h.forward();assert.equal(h.index,2);assert.equal(h.views.at(-1),'activity');}
});
test('late share-link completion cannot rewrite the library history entry',()=>{
 const h=setup();h.nav.navigate('activity');
 assert.equal(h.nav.replaceActivityUrl('/conceptsort.html#playnote=active'),true);
 h.history.back();
 assert.equal(h.nav.replaceActivityUrl('/conceptsort.html#playnote=late'),false);
 assert.equal(h.history.state.playnoteView,'library');assert.equal(h.entries[h.index].url,'/conceptsort.html');
 h.forward();h.nav.navigate('library');
 assert.equal(h.nav.replaceActivityUrl('/conceptsort.html#playnote=late'),false);
});


test('legacy callers can still replace their single library history entry',()=>{
 const h=setup();
 h.nav.replaceLibraryUrl('/conceptsort.html?level=N3');
 h.nav.replaceLibraryUrl('/conceptsort.html?level=N3&game=matching-pairs');
 assert.equal(h.entries.length,2);
 h.nav.navigate('activity');
 assert.equal(h.entries.length,3);
 h.history.back();
 assert.equal(h.entries[h.index].url,'/conceptsort.html?level=N3&game=matching-pairs');
 assert.equal(h.views.at(-1),'library');
 h.history.back();assert.equal(h.entries[h.index].url,'/index.html');
});
test('legacy single-entry libraries retain their previous Back behavior',()=>{
 for(const url of ['/conceptsort.html?level=N3','/conceptsort.html?level=N3&game=quiz']){
  const h=setup();h.nav.replaceLibraryUrl(url);h.history.back();
  assert.equal(h.entries[h.index].url,'/index.html');
 }
});














test('standalone collection games replace internal screens so browser Back leaves the game',()=>{
 for(const page of ['connections','wordsearch','crosswords']){
  const entries=[{url:'/index.html',state:null},{url:`/${page}.html?level=N3`,state:null}];let index=1;const views=[];
  const history={get state(){return entries[index].state;},replaceState(state,_,url){entries[index]={state,url};},pushState(state,_,url){entries.splice(++index);entries[index]={state,url};}};
  const location={pathname:`/${page}.html`,search:'?level=N3',hash:''};
  const nav=create(history,location,view=>views.push(view),{replaceScreens:true});
  nav.navigate('collection');
  assert.equal(history.state.playnoteView,'collection');
  assert.equal(entries.length,2);
  const refreshed=create(history,location,()=>{},{initialView:'collection',replaceScreens:true});
  assert.equal(history.state.playnoteView,'collection');
  refreshed.navigate('library');refreshed.navigate('collection');
  assert.equal(entries.length,2);
  assert.equal(entries[index-1].url,'/index.html');
 }
});

test('opening a shared generated round keeps its QR snapshot in the URL through refresh',()=>{
 for(const hash of ['#playnote=exact-facts-round','#activity=legacy-round']){
  const h=setup();const nav=create(h.history,{pathname:'/conceptsort.html',search:'',hash},()=>{},{initialView:'activity',replaceScreens:true});assert.equal(h.entries[h.index].url,'/conceptsort.html'+hash);nav.navigate('library');assert.equal(h.entries[h.index].url,'/conceptsort.html');
 }
});
