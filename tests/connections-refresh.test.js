const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('shared/connections-refresh.js','utf8');
function harness(type,state){const events={},frames=[],scrolls=[];const html={style:{minHeight:''},scrollHeight:1400};const history={state,scrollRestoration:'auto',replaceState(next){this.state=next;}};const window={scrollY:420,scrollTo(x,y){scrolls.push(y);},addEventListener(type,fn){events[type]=fn;},requestAnimationFrame(fn){frames.push(fn);}};const document={documentElement:html,querySelector:()=>({offsetHeight:850}),addEventListener(type,fn){events[type]=fn;}};vm.runInNewContext(source,{window,document,history,performance:{getEntriesByType:()=>[{type}]}});return{window,history,html,events,frames,scrolls};}
test('browser reload reserves document height and restores scroll once the board is fitted',()=>{
 const h=harness('reload',{playnoteView:'activity',connectionsViewport:{y:420,height:1400,cardHeight:850}});
 assert.equal(h.history.scrollRestoration,'manual');assert.equal(h.html.style.minHeight,'1400px');assert.deepEqual(h.scrolls,[420]);assert.equal(h.window.MLHConnectionsRefresh.placeholderHeight,850);
 h.events.DOMContentLoaded();h.window.MLHConnectionsRefresh.ready();h.window.MLHConnectionsRefresh.ready();assert.equal(h.frames.length,1);
 h.frames.shift()();h.frames.shift()();assert.equal(h.html.style.minHeight,'');assert.equal(h.history.scrollRestoration,'auto');assert.equal(h.scrolls.at(-1),420);
 h.window.MLHConnectionsRefresh.ready();assert.equal(h.frames.length,0);
});
test('saving the viewport preserves unrelated history and ordinary navigation does not restore it',()=>{
 const h=harness('navigate',{playnoteView:'activity',connectionsViewport:{y:420,height:1400,cardHeight:850}});
 assert.equal(h.html.style.minHeight,'');assert.equal(h.scrolls.length,0);
 h.events.pagehide();assert.equal(h.history.state.playnoteView,'activity');assert.equal(h.history.state.connectionsViewport.y,420);assert.equal(h.history.state.connectionsViewport.cardHeight,850);
});
test('missing or invalid saved positions leave normal browser scrolling alone',()=>{
 for(const state of [null,{}, {connectionsViewport:{y:-1,height:1400}},{connectionsViewport:{y:50,height:NaN}}]){
  const h=harness('reload',state);assert.equal(h.scrolls.length,0);assert.equal(h.history.scrollRestoration,'auto');
 }
});
