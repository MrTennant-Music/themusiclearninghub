const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const catalogue=JSON.parse(fs.readFileSync(path.join(root,'audio-concept-library-data.json'),'utf8'));
test('Concept Audio Library uses the music-play glyph inside the shared app-icon frame',()=>{
 const icon=fs.readFileSync(path.join(root,'app-icons/audio-concept-library-icon.svg'),'utf8');
 assert.match(icon,/viewBox="0 0 128 128"/);
 assert.match(icon,/stroke="#e5e7eb"/);
 assert.match(icon,/fill="#020617"/);
 assert.match(icon,/translate\(28 28\) scale\(1\.125\)/);
 const page=fs.readFileSync(path.join(root,'audioconceptlibrary.html'),'utf8');
 const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(page,/audio-concept-library-icon\.svg\?v=20261102-music-play/);
 assert.match(home,/audio-concept-library-icon\.svg\?v=20261102-music-play/);
});
test('Concept Audio Library concept heading matches the Playnote journey heading size',()=>{
 const styles=fs.readFileSync(path.join(root,'styles/audio-concept-library.css'),'utf8');
 assert.match(styles,/#library-concept-title \{[^}]*font-size:22px;/);
});
function harness(url='https://example.org/audioconceptlibrary.html',failure=false,storage=new Map()) {
  const elements=new Map(); const headers=[];
  function element(id) {
    if(!elements.has(id)) elements.set(id,{value:'',innerHTML:'',options:[],handlers:{},addEventListener(type,fn){this.handlers[type]=fn;},setAttribute(){},add(option){this.options.push(option);},querySelectorAll(){return [];},insertAdjacentHTML(_,html){this.innerHTML+=html;},focus(){}});
    return elements.get(id);
  }
  const location={href:url,search:new URL(url).search};
  const context=vm.createContext({URL,URLSearchParams,console,Option:function(text,value){this.textContent=text;this.value=value;},document:{getElementById:element},React:{createElement:(type,props)=>({type,props})},ReactDOM:{createRoot:()=>({render(node){if(node.props?.title==='Concept Audio Library')headers.push(node.props);}})},fetch:()=>failure ? Promise.reject(Error('offline')) : Promise.resolve({ok:true,json:async()=>structuredClone(catalogue)})});
  context.window={localStorage:{getItem:key=>storage.get(key) || null,setItem:(key,value)=>storage.set(key,value)},location,MLH:{AppHeader:{}},history:{replaceState(_,__,url){location.href=String(url);location.search=new URL(url).search;}},scrollTo(){},scrollY:0};
  vm.runInContext(fs.readFileSync(path.join(root,'music-dictionary/music-concepts-data.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(path.join(root,'audio-concept-library-artwork.js'),'utf8'),context);
  let source=fs.readFileSync(path.join(root,'audio-concept-library.js'),'utf8');
  source=source.replace(
    /  fetch\('audio-concept-library-data\.json[^']*'/,
    match=>`  window.audit={excerptInfo,fileUrl,downloadUrl,render,select(path){selectedPath=path;render();}};\n${match}`,
  );
  vm.runInContext(source,context);
  return {context,element,headers,ready:()=>new Promise(resolve=>setImmediate(resolve))};
}
test('consecutively numbered examples retain unnamed display labels',async()=>{
 const h=harness();await h.ready();const api=h.context.window.audit;
 const c={path:'numbered-example-fixture',concept:'Appoggiatura',files:['Example (1) - Appoggiatura.m4a','Example (2) - Appoggiatura.m4a']};
 assert.equal(api.excerptInfo(c.files[0],c).heading,'Unnamed 1');
 assert.equal(api.excerptInfo(c.files[1],c).heading,'Unnamed 2');
});
test('all catalogue entries have complete metadata and exact round-trip OneDrive paths',async()=>{
 const h=harness();await h.ready();const api=h.context.window.audit;
 const names=new Set(h.context.window.MUSIC_CONCEPTS.concepts.map(c=>c.name));
 const paths=new Set();
 for(const c of catalogue.concepts){
  assert(!paths.has(c.path));paths.add(c.path);assert.equal(c.files.length,new Set(c.files).size);
  for(const f of c.files){
   const m=c.fileMeta[f];assert(m.duration>0 && Number.isFinite(m.duration),f);assert(m.size>0,f);assert(m.concepts.length,f);
   for(const name of m.concepts)assert(names.has(name),name);
   const expected='/personal/gw19tennantrobert1_glow_sch_uk/Documents/Other/Audio Concept Library/'+c.path+'/'+f;
   const preview=new URL(api.fileUrl(c,f)); const download=new URL(api.downloadUrl(c,f));
   assert.equal(preview.searchParams.get('id'),expected);assert.equal(download.searchParams.get('SourceUrl'),expected);
   assert.equal(preview.hostname,'glowscotland-my.sharepoint.com');assert.equal(download.protocol,'https:');
   const info=api.excerptInfo(f,c);assert(info.heading.trim(),f);assert(!/Unnamed 0\b/.test(info.heading),f);assert(!/\bmvt\./i.test(info.heading),f);
  }
 }
});
test('Advanced Higher chord concepts retain five piano teaching examples each',()=>{
 const expected=[
  'Chord II and Its First Inversion (Major Keys Only)',
  'Chords I, IV, V and VI in Major and Minor Keys',
 ];
 for(const concept of expected){
  const entry=catalogue.concepts.find(item=>item.level==='Advanced Higher' && item.concept===concept);
  assert(entry,concept);
  assert.equal(entry.files.length,5,concept);
  assert(entry.files.every(file=>file.includes('Piano Demonstration')),concept);
 }
});
test('piano demonstrations use the unattributed artist dash',async()=>{
 const entry=catalogue.concepts.find(item=>item.level==='Advanced Higher' && item.concept==='Chord II and Its First Inversion (Major Keys Only)');
 const h=harness('https://example.org/audioconceptlibrary.html?level=AH&concept='+encodeURIComponent(entry.path));await h.ready();
 const html=h.element('library-results').innerHTML;
 assert.equal((html.match(/<td>–<\/td>/g)||[]).length,5);
 assert(!html.includes('data-library-artist="Piano demonstration"'));
});
test('unattributed piano demonstration metadata is not searchable',async()=>{
 const h=harness('https://example.org/audioconceptlibrary.html?level=ALL');await h.ready();
 h.element('library-search').value='piano demonstration';h.context.window.audit.render();
 assert(h.element('library-results').innerHTML.includes('No matching concepts or recordings'));
 assert(!h.element('library-results').innerHTML.includes('class="mc-levelled-link"'));
});
test('all concept views render every entry with matching title and download links',async()=>{
 const h=harness();await h.ready();
 for(const c of catalogue.concepts){
  h.element('library-level').value=c.category==='Multiple Concepts' ? c.level : '';
  h.context.window.audit.select(c.category==='Multiple Concepts' ? 'multiple-concepts' : c.path);
  const html=h.element('library-results').innerHTML;
  assert.equal((html.match(/class="library-excerpt-link"/g)||[]).length,c.files.length,c.path);
  assert.equal((html.match(/class="library-download"/g)||[]).length,c.files.length,c.path);
  assert(!html.includes('<audio'));assert(!html.includes('undefined'));
 }
});
test('search stays within the selected concept, retains empty state and updates QR destination',async()=>{
 const c=catalogue.concepts.find(c=>c.concept==='Ascending');
 const h=harness('https://example.org/audioconceptlibrary.html?level=ALL&concept='+encodeURIComponent(c.path));await h.ready();
 h.element('library-search').value='zzzz-no-such-excerpt';h.context.window.audit.render();
 assert(h.element('library-results').innerHTML.includes('No matching excerpts in this concept'));
 assert.equal(new URL(h.context.window.location.href).searchParams.get('concept'),c.path);
 h.context.window.audit.select(null);
 assert(!new URL(h.headers.at(-1).profileShareUrl).searchParams.has('concept'));
});
test('conflicting deep-link levels do not discard the selected concept',async()=>{
 const c=catalogue.concepts.find(c=>c.level==='Higher' && c.category!=='Multiple Concepts');
 const h=harness('https://example.org/audioconceptlibrary.html?level=N3&concept='+encodeURIComponent(c.path));await h.ready();
 assert.equal(h.element('library-level').value,'Higher');assert(h.element('library-concept-title').textContent.length>0);
 assert.equal(new URL(h.context.window.location.href).searchParams.get('concept'),c.path);
});
test('catalogue load failure gives a visible error and disables searching',async()=>{
 const h=harness(undefined,true);await h.ready();
 assert(h.element('library-results').innerHTML.includes('role="alert"'));assert.equal(h.element('library-search').disabled,true);assert.equal(h.element('library-search').placeholder,'Library unavailable');
});
test('production root allowlist includes catalogue without publishing arbitrary JSON',()=>{
 const source=fs.readFileSync(path.join(root,'scripts/build-site.js'),'utf8');
 const fn=source.match(/function isPublishedRootFile\(filename\) \{[\s\S]*?\n\}/)[0];
 const context=vm.createContext({path,NON_PUBLIC_ROOT_FILES:new Set(),PUBLIC_ROOT_EXTENSIONS:new Set(['.html','.js'])});vm.runInContext(fn,context);
 assert(context.isPublishedRootFile('audio-concept-library-data.json'));assert(!context.isPublishedRootFile('private.json'));
});

test('legacy Multiple Concepts URL selects its level instead of an empty catalogue',async()=>{
 const c=catalogue.concepts.find(c=>c.category==='Multiple Concepts');
 const h=harness('https://example.org/audioconceptlibrary.html?concept='+encodeURIComponent(c.path));await h.ready();
 assert.equal(new URL(h.context.window.location.href).searchParams.get('concept'),'multiple-concepts');
 assert.equal(h.element('library-level').value,c.level);
 assert.equal((h.element('library-results').innerHTML.match(/class="library-download"/g)||[]).length,c.files.length);
});

test('every excerpt has compact local artwork, unnamed clips retain quavers, and musicals use posters',async()=>{
 const h=harness();await h.ready();
 const entries=JSON.parse(fs.readFileSync(path.join(root,'music-dictionary/library-portraits/manifest.json'),'utf8')).artists;
 for(const [artist,entry] of Object.entries(entries)) {
  if(entry.kind==='placeholder')continue;
  const file=path.resolve(root,entry.src);
  assert(file.startsWith(path.join(root,'music-dictionary','library-portraits')+path.sep));
  assert(fs.existsSync(file),artist);assert(fs.statSync(file).size<15000,artist);
  assert(entry.width<=128 && entry.height<=128,artist);assert(entry.sourceUrl,artist);
 }
 for(const c of catalogue.concepts){
  h.element('library-level').value=c.category==='Multiple Concepts' ? c.level : '';
  h.context.window.audit.select(c.category==='Multiple Concepts' ? 'multiple-concepts' : c.path);
  const html=h.element('library-results').innerHTML;
  assert.equal((html.match(/data-library-artwork/g)||[]).length,c.files.length,c.path);
 }
 h.element('library-level').value='';
 const jazz=catalogue.concepts.find(c=>c.concept==='Jazz');h.context.window.audit.select(jazz.path);
 assert(h.element('library-results').innerHTML.includes('assessment-cover-quavers.svg'));
 assert.equal(entries.Wicked.kind,'poster');assert.equal(entries['Johann Sebastian Bach'].kind,'portrait');
 assert.equal(entries['Théo Charlier'].kind,'portrait');
 assert.equal(entries['Théo Charlier'].sourceUrl,'https://open.spotify.com/artist/1u1MlRm5MVNt3cLaLD4iEi');
});

test('artist navigation directly lists all matching excerpts across levels and returns to the previous view',async()=>{
 const c=catalogue.concepts.find(c=>c.concept==='Ostinato - Riff' && c.level==='National 3');
 assert(c);
 const h=harness('https://example.org/audioconceptlibrary.html?level=N3&concept='+encodeURIComponent(c.path));await h.ready();
 const click=(selector,dataset)=>h.element('library-results').handlers.click({target:{closest:s=>s===selector ? {dataset} : null},preventDefault(){}});
 click('[data-library-artist]',{libraryArtist:'Linkin Park'});
 assert.equal(h.element('library-concept-title').textContent,'Linkin Park');
 assert.equal(h.element('library-level').value,'');
 assert.equal(new URL(h.context.window.location.href).searchParams.get('level'),'ALL');
 const api=h.context.window.audit;
 const expected=catalogue.concepts.filter(c=>c.files.some(f=>api.excerptInfo(f,c).artist.toLowerCase()==='linkin park'));
 let html=h.element('library-results').innerHTML;
 assert.equal((html.match(/class="library-excerpt-link"/g)||[]).length,expected.reduce((n,c)=>n+c.files.filter(f=>api.excerptInfo(f,c).artist.toLowerCase()==='linkin park').length,0));
 assert(!html.includes('data-concept-path='));
 assert(html.includes("What I&#39;ve Done"));assert(!html.includes('Seven Nation Army'));
 assert(html.includes('Sort by Level'));
 h.element('library-search').value='zzzz-no-such-song';api.render();
 assert(h.element('library-results').innerHTML.includes('No matching excerpts for this artist'));
 h.element('library-back').handlers.click();
 assert.equal(h.element('library-concept-title').textContent,'Ostinato / riff');
 assert.equal(new URL(h.context.window.location.href).searchParams.get('artist'),null);
 const refresh=harness('https://example.org/audioconceptlibrary.html?artist=Linkin+Park&level=N3');await refresh.ready();
 assert.equal(refresh.element('library-level').value,'');
 assert.equal(refresh.element('library-concept-title').textContent,'Linkin Park');
});

test('Multiple Concepts search supports + and commas, preserves concept punctuation and restores searches',async()=>{
 const groups=catalogue.concepts.filter(c=>c.category==='Multiple Concepts');
 const example=groups.flatMap(c=>Object.values(c.fileMeta)).find(m=>m.concepts.length>=3);
 const names=example.concepts.slice(0,2);
 const h=harness('https://example.org/audioconceptlibrary.html?level=ALL&concept=multiple-concepts');await h.ready();
 h.element('library-search').value=names.join(' + ');h.context.window.audit.render();
 const expected=groups.reduce((sum,c)=>sum+c.files.filter(f=>names.every(n=>c.fileMeta[f].concepts.includes(n))).length,0);
 assert(expected>0);
 assert.equal((h.element('library-results').innerHTML.match(/class="library-download"/g)||[]).length,expected);
 const url=new URL(h.context.window.location.href);assert.equal(url.searchParams.get('search'),names.join(' + '));
 h.element('library-search').value=names.join(', ');h.context.window.audit.render();
 assert.equal((h.element('library-results').innerHTML.match(/class="library-download"/g)||[]).length,expected);
 assert.equal(h.element('library-search').placeholder,`${expected} excerpt${expected===1 ? '' : 's'}`);
 for(const name of ['2, 3 or 4 beats in the bar','Simple time (2/4, 3/4 and 4/4)']) {
   h.element('library-search').value=name+', Major tonality';h.context.window.audit.render();
   const total=groups.reduce((sum,c)=>sum+c.files.filter(f=>c.fileMeta[f].concepts.includes(name) && c.fileMeta[f].concepts.includes('Major tonality')).length,0);
   assert(total>0,name);
   assert.equal((h.element('library-results').innerHTML.match(/class="library-download"/g)||[]).length,total,name);
 }
 const restored=harness(url.href);await restored.ready();
 assert.equal(restored.element('library-search').value,names.join(' + '));
 assert.equal((restored.element('library-results').innerHTML.match(/class="library-download"/g)||[]).length,expected);
 h.element('library-search').value=names[0]+' + impossible-concept';h.context.window.audit.render();
 assert(h.element('library-results').innerHTML.includes('No excerpts feature all these concepts'));
 h.element('library-search').value='';h.context.window.audit.render();
 assert.equal((h.element('library-results').innerHTML.match(/class="library-download"/g)||[]).length,groups.reduce((n,c)=>n+c.files.length,0));
 const legacy=harness('https://example.org/audioconceptlibrary.html?concept=multiple-concepts&'+names.map(n=>'includes='+encodeURIComponent(n)).join('&'));await legacy.ready();
 assert.equal(legacy.element('library-search').value,names.join(' + '));
});

test('Multiple Concepts contains only genuinely multi-concept excerpts and reassigned tracks retain their credits',async()=>{
 for(const c of catalogue.concepts.filter(c=>c.category==='Multiple Concepts')) {
  for(const file of c.files) assert(new Set(c.fileMeta[file].concepts).size>=2,file);
 }
 const c=catalogue.concepts.find(c=>c.concept==='Reverb');
 const file=c.files.find(f=>c.fileMeta[f]?.title==='A Different Corner');assert(file);
 const h=harness();await h.ready();
 assert.deepEqual(JSON.parse(JSON.stringify(h.context.window.audit.excerptInfo(file,c))),{heading:'A Different Corner',artist:'George Michael',subtitle:'Reverb'});
 h.context.window.audit.select(c.path);
 assert(h.element('library-results').innerHTML.includes('A Different Corner'));
});

test('favourite stars persist per excerpt while the favourites view stays on the main catalogue',async()=>{
 const styles=fs.readFileSync(path.join(root,'styles/audio-concept-library.css'),'utf8');
 assert.match(styles,/\.library-favourites-button\[hidden\]\{display:none\}/);
 const storage=new Map();
 const anthem=catalogue.concepts.find(c=>c.concept==='Anthem');assert(anthem);
 const file=anthem.files[0],key=anthem.path+'/'+file;
 const other=catalogue.concepts.find(c=>c.level==='National 3' && c.concept==='Blues');
 const otherKey=other.path+'/'+other.files[0];
 const h=harness('https://example.org/audioconceptlibrary.html?level=AH&concept='+encodeURIComponent(anthem.path),false,storage);await h.ready();
 const click=key=>h.element('library-results').handlers.click({target:{closest:selector=>selector==='[data-favourite-key]' ? {dataset:{favouriteKey:key}} : null}});
 click(key);click(otherKey);
 assert.deepEqual(JSON.parse(storage.get('mlh-concept-audio-favourites')),[key,otherKey]);
 assert(h.element('library-results').innerHTML.includes('aria-pressed="true"'));
 assert.equal(h.element('library-favourites-button').hidden,true);
 h.element('library-back').handlers.click();
 assert.equal(h.element('library-favourites-button').hidden,false);
 h.element('library-favourites-button').handlers.click();
 assert.equal(h.element('library-concept-title').textContent,'Favourites');
 assert.equal(h.element('library-level').value,'');
 assert.equal((h.element('library-results').innerHTML.match(/class="library-download"/g)||[]).length,2);
 assert.equal(new URL(h.context.window.location.href).searchParams.get('show'),'favourites');
 const refresh=harness(h.context.window.location.href,false,storage);await refresh.ready();
 assert.equal((refresh.element('library-results').innerHTML.match(/class="library-download"/g)||[]).length,2);
 h.element('library-level').value='Advanced Higher';h.context.window.audit.render();
 assert.equal((h.element('library-results').innerHTML.match(/class="library-download"/g)||[]).length,1);
 click(key);
 assert(h.element('library-results').innerHTML.includes('No favourites here yet'));
 assert.deepEqual(JSON.parse(storage.get('mlh-concept-audio-favourites')),[otherKey]);
 h.element('library-favourites-button').handlers.click();
 assert.equal(new URL(h.context.window.location.href).searchParams.get('concept'),null);
 assert.equal(new URL(h.context.window.location.href).searchParams.get('show'),null);
 const detailLink=harness('https://example.org/audioconceptlibrary.html?level=AH&concept='+encodeURIComponent(anthem.path)+'&show=favourites',false,storage);await detailLink.ready();
 assert.equal(detailLink.element('library-favourites-button').hidden,true);
 assert.equal(new URL(detailLink.context.window.location.href).searchParams.get('show'),null);
 assert.equal((detailLink.element('library-results').innerHTML.match(/class="library-download"/g)||[]).length,anthem.files.length);
 const invalid=harness(undefined,false,new Map([['mlh-concept-audio-favourites','not JSON']]));await invalid.ready();
 assert(!invalid.element('library-results').innerHTML.includes('Library unavailable'));
});

test('QR links restore ordinary searches and excerpt sorting on a second device',async()=>{
 const h=harness('https://example.org/audioconceptlibrary.html?level=H');await h.ready();
 h.element('library-search').value='piano';h.context.window.audit.render();
 const link=h.headers.at(-1).profileShareUrl;
 assert.equal(new URL(link).searchParams.get('search'),'piano');
 const recipient=harness(link);await recipient.ready();
 assert.equal(recipient.element('library-search').value,'piano');
 assert.equal(recipient.element('library-results').innerHTML,h.element('library-results').innerHTML);
 const concept=catalogue.concepts.find(c=>c.level==='Higher' && c.files.length>1);
 const sorted=harness('https://example.org/audioconceptlibrary.html?level=H&concept='+encodeURIComponent(concept.path)+'&sort=duration&direction=-1');await sorted.ready();
 assert(sorted.element('library-results').innerHTML.includes('aria-sort="descending"'));
 const shared=new URL(sorted.headers.at(-1).profileShareUrl);
 assert.equal(shared.searchParams.get('sort'),'duration');assert.equal(shared.searchParams.get('direction'),'-1');
});

test('QR favourites carry the sender selection instead of using recipient favourites',async()=>{
 const c=catalogue.concepts.find(c=>c.files.length);
 const key=c.path+'/'+c.files[0];
 const sender=harness('https://example.org/audioconceptlibrary.html?show=favourites',false,new Map([['mlh-concept-audio-favourites',JSON.stringify([key])]]));await sender.ready();
 const link=sender.headers.at(-1).profileShareUrl;
 assert.deepEqual(JSON.parse(new URL(link).searchParams.get('favourites')),[key]);
 const recipient=harness(link,false,new Map());await recipient.ready();
 assert.equal(recipient.element('library-results').innerHTML,sender.element('library-results').innerHTML);
});
