const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {apps}=require('../shared/music-games-apps');
const retired=['music-games/playnote.html','music-games/playnoteactivity.html','music-games/playnoteeditor.html','shared/music-games-legacy.js','shared/playnote-history.js','music-games/editor.jsx','music-games/editor-entry.jsx','music-games/runtime/editor.js','music-games/runtime/editor-entry.js','classroom-pilot/functions/playnote.js','classroom-pilot/music-games/service.cjs','scripts/playnote-classroom-server.cjs'];
test('retired Playnote app, authoring and classroom routes stay removed after building',()=>{
 assert.equal(fs.existsSync('playnote'),false);
 assert.equal(fs.existsSync('fonts/playnote'),false);
 for(const file of retired)assert.equal(fs.existsSync(file),false,file);
 for(const file of ['index.html','footer.js','shared/hub-page-names.js','scripts/build-music-games-pages.cjs','scripts/build-music-games.js','scripts/build-music-games-runtime.cjs','scripts/music-games-write-activities.cjs','music-games/app.jsx']){
  const source=fs.readFileSync(file,'utf8');
  assert.doesNotMatch(source,/playnote(?:activity|editor)?\.html|music-games-legacy\.js|playnote-history\.js|IGActivityEditor/,file);
 }
 const pkg=require('../package.json');assert.equal(pkg.scripts['build:playnote'],undefined);assert.ok(pkg.scripts['build:music-games']);
});
test('current standalone pages retain their complete shared engine without retired editor bundles',()=>{
 const context={window:{}};vm.runInNewContext(fs.readFileSync('music-games/runtime/index.js','utf8'),context);
 const files=context.window.IGRuntimeFiles;
 assert.equal(files.editor,undefined);assert.equal(files['editor-entry'],undefined);
 for(const name of ['app','session','learning','media','image-bank','diagram'])assert.ok(fs.existsSync(files[name].split('?')[0].replace(/^\.\//,'')),name);
 assert.ok(context.window.IGActivityIndex.length>900);
 for(const app of Object.values(apps)){
  const html=fs.readFileSync(app.href.replace('./',''),'utf8');assert.ok(html.includes(`data-game-app="${app.id}"`));
  for(const [,asset]of html.matchAll(/(?:src|href)="\.\/([^"?#]+)(?:[?#][^"]*)?"/g))assert.ok(fs.existsSync(asset),`${app.id}: ${asset}`);
 }
});
