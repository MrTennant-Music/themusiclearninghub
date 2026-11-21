const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const D=require('../music-dictionary/label-games-data'),concepts=require('../music-dictionary/music-concepts-data'),C=require('../music-games/core'),apps=require('../shared/music-games-apps').apps;
test('Dictionary Label practice preserves all six instrument activities including Piano Keys',()=>{
 assert.equal(D.games.length,6);
 assert(D.games.some(g=>g.id==='example-piano-keys'&&g.conceptIds.includes('MC-0057')));
 assert.deepEqual(D.games.filter(g=>g.conceptIds.includes('MC-0117')).map(g=>g.title).sort(),['Bass Guitar Strings and Frets','Parts of the Bass Guitar']);
 assert(D.games.some(g=>g.title==='Parts of the Drum Kit'&&g.conceptIds.includes('MC-0049')));
 const index=require('../music-games/activities/index.json');
 for(const game of D.games){
  assert(game.conceptIds.every(id=>concepts.concepts.some(c=>c.id===id)));
  const a=require('../music-games/activities/'+game.id+'.json');
  assert.equal(a.template,'labelled-diagram');assert(C.compatibility(a.template,a).ok);
  assert(a.diagram.src);assert(a.items.length>0);
  assert(a.items.every(i=>Number.isFinite(i.x)&&Number.isFinite(i.y)&&i.x>=0&&i.x<=100&&i.y>=0&&i.y<=100));
  assert(index.find(row=>row.id===game.id).catalogueHidden);
 }
 assert(!apps.conceptsort.templates.includes('labelled-diagram'));
});
test('notation Label collections are deleted and the Dictionary uses the shared renderer',()=>{
 const index=require('../music-games/activities/index.json');
 assert(!index.some(a=>a.template==='labelled-diagram'&&a.tags?.includes('Music Literacy')));
 for(const file of fs.readdirSync('music-games/activities').filter(f=>f.endsWith('.json')&&f!=='index.json')){const a=JSON.parse(fs.readFileSync('music-games/activities/'+file));assert(!(a.template==='labelled-diagram'&&a.tags?.includes('Music Literacy')),file);}
 for(const url of Object.values(D.files))assert(fs.existsSync(url.split('?')[0]));
 const code=fs.readFileSync('music-dictionary/label-games.js','utf8');assert.match(code,/window\.IGLabelledDiagram/);assert.match(code,/window\.IGRuntime\.activity/);
 const page=fs.readFileSync('music-dictionary/musicdictionaryconcept.html','utf8');assert.match(page,/label-games-data\.js/);assert.match(page,/label-games\.js/);
});
test('Dictionary Label opens automatically and changing activities loads the selected game',async()=>{
 const React=require('react'),vm=require('node:vm'),slots=[],effects=[],calls=[];let cursor=0;
 const games=D.games.filter(g=>g.conceptIds.includes('MC-0043'));
 const hooks={...React,useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useRef(initial){const i=cursor++;return slots[i]||(slots[i]={current:initial});},useEffect(effect){const i=cursor++;if(!(i in slots)){slots[i]=true;effects.push(effect);}}};
 const window={MusicDictionaryLabelData:D,MLH:{ToolbarButtonClass:'toolbar'},IGLabelledDiagram:()=>null,IGRuntime:{activity:async id=>{calls.push(id);return{id};}}};
 const document={querySelector:()=>true,createElement:()=>({}),head:{appendChild:el=>el.onload?.()}};
 vm.runInNewContext(fs.readFileSync('music-dictionary/label-games.js','utf8'),{React:hooks,window,document,location:{search:''},URLSearchParams});
 const render=()=>{cursor=0;return window.MusicDictionaryLabelGames({conceptId:'MC-0043'});};
 const find=(n,p)=>{if(!n||typeof n!=='object')return;if(p(n))return n;for(const c of React.Children.toArray(n.props?.children)){const f=find(c,p);if(f)return f;}};
 let tree=render();assert(find(tree,n=>n.props?.role==='status'));effects.forEach(f=>f());
 await new Promise(resolve=>setImmediate(resolve));tree=render();assert.deepEqual(calls,[games[0].id]);assert(find(tree,n=>n.type===window.IGLabelledDiagram));
 const choice=find(tree,n=>n.type==='button'&&n.props.children===games[1].title);choice.props.onClick();
 await new Promise(resolve=>setImmediate(resolve));tree=render();assert.deepEqual(calls,games.map(g=>g.id));
 assert.equal(find(tree,n=>n.type===window.IGLabelledDiagram).props.activity.id,games[1].id);
 assert.equal(find(tree,n=>n.type==='button'&&n.props.children==='Play'),undefined);
});
