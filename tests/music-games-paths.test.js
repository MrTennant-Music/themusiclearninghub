const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {apps}=require('../shared/music-games-apps');
const fileFor=url=>url.split(/[?#]/)[0].replace(/^\.\//,'');
test('the complete game catalogue and generated dependencies resolve under the current shared folder',()=>{
 assert.equal(fs.existsSync('playnote'),false);
 assert.equal(fs.existsSync('fonts/playnote'),false);
 assert.equal(fs.existsSync('music-games/activities/thumbnails'),false);
 const scope={window:{}};vm.runInNewContext(fs.readFileSync('music-games/runtime/index.js','utf8'),scope);
 for(const [name,url]of Object.entries(scope.window.IGRuntimeFiles))assert.ok(fs.existsSync(fileFor(url)),name+': '+url);
 for(const activity of scope.window.IGActivityIndex){
  assert.ok(fs.existsSync(fileFor(activity.file)),activity.id);
  assert.equal(activity.thumbnail,undefined,activity.id+' has no thumbnail');
 }
 for(const clip of ['gameplay','gameend','gamecorrect','gamewrong'])assert.ok(fs.existsSync('music-games/audio/'+clip+'.mp3'),clip);
});
test('all current game, Dictionary and Millionaire page resources use existing paths',()=>{
 const pages=[...Object.values(apps).map(a=>a.href.slice(2)),'music-dictionary/musicdictionary.html','music-dictionary/musicdictionaryconcept.html','whowantstobemillionaire/whowantstobeamillionaire.html'];
 for(const page of pages){
  const html=fs.readFileSync(page,'utf8'),pageUrl=new URL(page,'https://hub.test/');
  const base=new URL(html.match(/<base\s+href="([^"]+)"/)?.[1]||'.',pageUrl);
  assert.doesNotMatch(html,/(?:src|href)="[^"\s]*\/playnote\//,page);
  for(const [,src]of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"#]+)"/g)){
   const url=new URL(src,base);if(url.origin!==pageUrl.origin)continue;
   assert.ok(fs.existsSync(decodeURIComponent(url.pathname.slice(1))),page+': '+src);
  }
 }
});
