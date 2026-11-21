const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function declaration(name, next) {
  return vm.runInNewContext(html.slice(html.indexOf(`const ${name} =`), html.indexOf(next, html.indexOf(`const ${name} =`))) + `;${name}`);
}
test('homepage routes paper level choices to the dedicated paper chooser', () => {
  const groups=declaration('appData','const appCategories');
  const app=groups.flatMap(g=>g.apps).find(app=>app.title==='Digital Question Papers');
  assert.equal(app.href,'digital-question-papers/digitalquestionpapers.html');
  assert.match(html,/window.location.href = `\$\{card.dataset.href\}\?level=\$\{encodeURIComponent\(levelChoice.dataset.level\)\}`/);
  assert.doesNotMatch(html,/year-picker|year-choice|digitalPaperYears|toggleDigitalPaperLevel/);
});
test('all activity destinations and icons exist locally', () => {
  const groups = declaration('appData', 'const appCategories');
  const icons = declaration('appIcons', 'const appData');
  for (const app of groups.flatMap(g => g.apps)) {
    assert(fs.existsSync(path.join(root, app.href.split('?')[0])), app.href);
    assert(icons[app.title], app.title);
    assert(fs.existsSync(path.join(root, icons[app.title].split('?')[0])), icons[app.title]);
  }
});
test('closing search clears its query instead of hiding an active search filter', () => {
  const input = {value:'zzzz-no-match'};
  const panel = {hidden:false};
  let filtered = 0;
  const noop = () => {};
  const context = vm.createContext({document:{getElementById:() => input},searchPanel:panel,headerSearch:{classList:{remove:noop},closest:()=>({classList:{remove:noop}})},searchToggle:{setAttribute:noop},applyCardFilters:() => { filtered++; }});
  const code = html.slice(html.indexOf('function closeSearch()'), html.indexOf('function toggleSearch()'));
  vm.runInContext(code+';closeSearch()',context);
  assert.equal(input.value,'');
  assert.equal(filtered,1);
  assert.equal(panel.hidden,true);
});
test('the homepage always shows medals and ignores retired visibility settings', () => {
  assert.doesNotMatch(html, /showMedalsToggle|mlh-home-show-medals|\.get\("medals"\)/);
});
test('section filters give every app one section and keep papers in Listening', () => {
  const source=html.slice(html.indexOf('function homeSectionsForApp('),html.indexOf('const requestedHomeSection'));
  const classify=vm.runInNewContext(source+';homeSectionsForApp');
  const groups=declaration('appData','const appCategories');
  const counts={listening:0,literacy:0,games:0,tools:0};
  for(const group of groups) for(const app of group.apps){
    const sections=Array.from(classify(app,group.category));
    assert.equal(sections.length,1,app.title);
    sections.forEach(section=>{assert(section in counts);counts[section]++;});
    if(app.title==='Digital Question Papers')assert.deepEqual(sections,['listening']);
    if(group.category==='Games')assert.deepEqual(sections,['games']);
    if(['Tools','Performing','Composing'].includes(group.category))assert.deepEqual(sections,['tools']);
    if(['Pitch','Rhythm','Music Symbols','Practice'].includes(group.category))assert(sections.includes('literacy'),app.title);
  }
  assert.deepEqual(counts,{listening:6,literacy:21,games:10,tools:8});
});

test('all Music Literacy concept links use an existing activity and the row qualification', () => {
  const {rows}=require('../shared/music-literacy-curriculum');
  const apps=declaration('appData','const appCategories').flatMap(group=>group.apps);
  const keys={'National 3':'N3','National 4':'N4','National 5':'N5','Higher':'H','Advanced Higher':'AH'};
  let count=0;
  for(const [level,columns] of rows) for(const column of columns) {
    for(const [,href,label] of column.matchAll(/href="([^"]+)"[^>]*>(.*?)<\/a>/g)) {
      const url=new URL(href,'https://hub.invalid/');
      const app=apps.find(app=>'/'+app.href===url.pathname);
      assert(app,`${label}: ${href}`);
      assert(fs.existsSync(path.join(root,url.pathname.slice(1))),href);
      assert.equal(url.searchParams.get('level'),keys[level],label);
      assert(!app.disabled.includes(keys[level]),`${label}: unavailable level`);
      if(['Ties','Syncopated rhythms'].includes(label)) assert.equal(url.pathname,'/rhythmicdictation.html',label);
      count++;
    }
  }
  assert.equal(count,73);
});

test('every rendered Music Concepts link opens its dictionary entry at the row level', () => {
  const dictionary=require('../music-dictionary/music-concepts-data.js');
  const body={innerHTML:'',closest:selector=>selector==='table'?{setAttribute:()=>{}}:{scrollTop:0}};
  const head={innerHTML:''};
  const context=vm.createContext({window:{MUSIC_CONCEPTS:dictionary},URLSearchParams,document:{getElementById:id=>id==='conceptGridBody'?body:head}});
  const source=html.slice(html.indexOf('function renderConceptGrid('),html.indexOf('document.querySelectorAll("[data-concept-list]")'));
  vm.runInContext(source+';renderConceptGrid("concepts")',context);
  const keys=['N3','N4','N5','H','AH'];
  let count=0;
  for(const [,level,row] of body.innerHTML.matchAll(/<tr>\s*<th scope="row">([^<]+)<\/th>([\s\S]*?)<\/tr>/g)) {
    for(const [,href] of row.matchAll(/href="([^"]+)"/g)) {
      const url=new URL(href,'https://hub.invalid/');
      const concept=dictionary.concepts.find(c=>c.id===url.searchParams.get('concept'));
      assert(concept,href);
      assert.equal(concept.level,level,concept.name);
      assert.equal(url.searchParams.get('level'),keys[dictionary.levels.indexOf(level)],concept.name);
      assert.equal(url.pathname,'/music-dictionary/musicdictionaryconcept.html');
      assert(fs.existsSync(path.join(root,url.pathname.slice(1))));
      count++;
    }
  }
  assert.equal(count,dictionary.levels.reduce((total,level)=>total+dictionary.tables[level].flat().length,0));
});

test('standalone Cadences is removed and legacy links open Ear Training at the same level',()=>{
  const groups=declaration('appData','const appCategories');
  assert.ok(!groups.flatMap(g=>g.apps).some(app=>app.title==='Cadences'||app.href==='cadences.html'));
  const legacy=fs.readFileSync(path.join(root,'cadences.html'),'utf8');
  const redirect=legacy.match(/<script id="cadences-ear-training-redirect">([\s\S]*?)<\/script>/)[1];
  for(const level of ['N5','H','AH',null,'invalid']) {
    let destination;
    vm.runInNewContext(redirect,{URL,URLSearchParams,window:{location:{href:'http://localhost/cadences.html',search:level?'?level='+level:'',replace:url=>{destination=new URL(url);}}}});
    assert.equal(destination.pathname,'/auralrecognition.html');
    assert.equal(destination.searchParams.get('exercise'),'cadence');
    assert.equal(destination.searchParams.get('level'),['N5','H','AH'].includes(level)?level:'N5');
  }
});

test('standalone Tempo is removed and legacy links open Ear Training at the same level',()=>{
  const groups=declaration('appData','const appCategories');
  assert.ok(!groups.flatMap(g=>g.apps).some(app=>app.title==='Tempo'||app.href==='tempo.html'));
  const legacy=fs.readFileSync(path.join(root,'tempo.html'),'utf8');
  const redirect=legacy.match(/<script id="tempo-ear-training-redirect">([\s\S]*?)<\/script>/)[1];
  for(const level of ['N3','N4','N5',null,'invalid']) {
    let destination;
    vm.runInNewContext(redirect,{URL,URLSearchParams,window:{location:{href:'http://localhost/tempo.html',search:level?'?level='+level:'',replace:url=>{destination=new URL(url);}}}});
    assert.equal(destination.pathname,'/auralrecognition.html');
    assert.equal(destination.searchParams.get('exercise'),'steadyTempo');
    assert.equal(destination.searchParams.get('level'),['N3','N4','N5'].includes(level)?level:'N3');
  }
});

test('level icons, colours and accessible labels follow the current achievements', () => {
  function element() {
    const attributes = {}, properties = new Map();
    const el = {attributes, dataset:{}, children:[], style:{setProperty:(k,v)=>properties.set(k,v),removeProperty:k=>properties.delete(k)}, properties,
      setAttribute:(k,v)=>attributes[k]=v,removeAttribute:k=>delete attributes[k],
      append(...children){for(const child of children){child.parent=el;el.children.push(child);}},
      replaceChildren(...children){el.children=[];el.append(...children);},
      querySelector:selector=>el.children.find(child=>selector==='.'+child.className),
      remove(){el.parent.children=el.parent.children.filter(child=>child!==el);}
    };
    Object.defineProperty(el,'title',{get:()=>attributes.title,set:v=>attributes.title=v});
    return el;
  }
  const earned=Object.freeze({tier:'gold',bestStreak:20});
  const medal=Object.freeze({label:'Gold',color:'#a16207',backgroundColor:'#fef9c3',icon:'ui-icons/gold.svg'});
  const tile=element();tile.dataset.level='N3';tile.closest=()=>({dataset:{href:'accidentals.html'}});
  const header=element();let current=earned;
  const context=vm.createContext({levels:[['N3','National 3']],
    window:{MLH:{achievements:{totals:()=>({gold:current?1:0}),medals:{gold:medal},get:()=>current}}},
    document:{getElementById:()=>header,createElement:element,querySelectorAll:()=>[tile]}});
  const code=html.slice(html.indexOf('function updateAchievementButtons()'),html.indexOf('window.addEventListener("mlh-achievements-change"'));
  vm.runInContext(code,context);
  vm.runInContext('updateAchievementButtons()',context);
  assert.equal(tile.dataset.medal,'gold');assert.equal(tile.properties.get('--medal-background'),medal.backgroundColor);
  assert.equal(tile.children[0].className,'level-medal');assert.match(tile.attributes['aria-label'],/Gold medal/);assert.equal(header.hidden,false);
  current=null;vm.runInContext('updateAchievementButtons()',context);
  assert.equal(tile.dataset.medal,undefined);assert.equal(tile.properties.size,0);assert.equal(tile.children.length,0);
  assert.equal(tile.attributes['aria-label'],'National 3');assert.equal(tile.title,undefined);assert.equal(header.hidden,false);
  current=earned;vm.runInContext('updateAchievementButtons()',context);
  assert.equal(tile.dataset.medal,'gold');assert.equal(tile.children.length,1);assert.equal(earned.bestStreak,20);
});

test('Games appears between Listening and More and has its own shareable section',()=>{
 const nav=html.slice(html.indexOf('<nav class="home-sections"'),html.indexOf('</nav>',html.indexOf('<nav class="home-sections"')));
 assert.deepEqual(Array.from(nav.matchAll(/data-home-section="([^"]+)"/g),m=>m[1]),['literacy','listening','games','tools']);
 assert(fs.existsSync(path.join(root,'images/home-sections/games.webp')));
 assert.match(html,/homeSections\.includes\(requestedHomeSection\)/);
});

test('returning from an activity restores the chosen homepage filter in that tab', () => {
  const source = html.slice(html.indexOf('const requestedHomeSection'), html.indexOf('const collectionAppPaths'));
  const saved = new Map();
  const sessionStorage = {getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value)};
  function load(query = '', storage = sessionStorage) {
    const window = {location: new URL('https://hub.test/' + query), sessionStorage: storage, history: {replaceState() {}}};
    const context = {window, URL, URLSearchParams, document: {getElementById: () => null}, closeSearch() {}, applyCardFilters() {}};
    return vm.runInNewContext(source + '\n({current: () => activeHomeSection, select: selectHomeSection})', context);
  }
  assert.equal(load().current(), 'literacy');
  for (const section of ['listening', 'games', 'tools', 'literacy']) {
    load().select(section);
    assert.equal(load().current(), section);
  }
  assert.equal(load('?section=listening').current(), 'listening');
  assert.equal(load('?section=unknown').current(), 'listening');
  const unavailable = {getItem() { throw Error('Unavailable'); }, setItem() { throw Error('Unavailable'); }};
  assert.equal(load('', unavailable).current(), 'literacy');
});
