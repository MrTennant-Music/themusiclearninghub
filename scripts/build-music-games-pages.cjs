/* Small standalone pages share the audited game engines and activity catalogue. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{apps}=require('../shared/music-games-apps.js');
// Replace complete generated assets at once so an open app cannot cache a partial file.
function writeAtomic(file,data){const temporary=file+'.building';fs.writeFileSync(temporary,data);fs.renameSync(temporary,file);}
const root=path.resolve(__dirname,'..'),hash=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex').slice(0,12);
const script=file=>`<script src="./${file}?v=${hash(file)}"></script>`,style=file=>`<link rel="stylesheet" href="./${file}?v=${hash(file)}" />`;
function build(){
 require('./build-shared-app-icon-frames.cjs').build();
 require('./build-concept-sort-data.cjs').build();
 require('./build-national3-connections.cjs').build();
 require('./build-dictionary-label-games.cjs').build();
 const S=require('./music-games-dictionary-content.cjs');
 writeAtomic(path.join(root,'shared/music-games-concepts.js'),'/* Generated curriculum data for the collection creator. */\n(function(r,d){if(typeof module==="object"&&module.exports)module.exports=d;else r.MLHGameConcepts=d;})(typeof globalThis!=="undefined"?globalThis:this,'+JSON.stringify({codes:S.codes,levels:S.D.levels,categories:S.D.categories,tables:S.D.tables,concepts:S.concepts.map(c=>({id:c.id,name:c.name,level:c.level,definition:S.definition(c),word:S.word(c)}))})+');\n');
 const scripts=['vendor/react/react.production.min.js','vendor/react/react-dom.production.min.js','shared/hub-input.js','shared/hub-shell.js','shared/classroom-activities.js','shared/hub-menu.js','shared/hub-progress.js','shared/music-games-apps.js','music-dictionary/label-games-data.js','music-games/runtime/index.js','music-games/loader.js','music-games/core.js','shared/music-games-concepts.js','shared/music-games-literacy.js','shared/music-games-literacy-connections.js','shared/concept-level-priority.js','shared/music-games-collections.js','shared/music-games-sort-data.js','shared/music-games-facts.js','shared/music-games-sort.js','shared/music-games-connections-bank.js','shared/music-games-connections.js','shared/music-games-practice.js','shared/music-games-medals.js','shared/hub-achievements.js','shared/hub-audio.js','shared/hub-medal-stat.js','music-games/sharing.js','music-games/navigation.js','music-games/catalogue.js'];
 const styles=['styles/hub-ui.css','music-games/base.css','music-games/wordwall.css','music-games/library.css','styles/hub-touch.css','styles/music-games.css'];
 const deferredStyles=['learning','arcade','content','preview-theme','diagram','player'].map(name=>'music-games/'+name+'.css');
 const styleFiles=Object.fromEntries(deferredStyles.map(file=>[file,'./'+file+'?v='+hash(file)]));
 const runtimeIndex=path.join(root,'music-games/runtime/index.js');
 const runtimeSource=fs.readFileSync(runtimeIndex,'utf8').replace(/^window\.IGRuntimeStyles=.*;\n?/m,'');
 writeAtomic(runtimeIndex,runtimeSource+'window.IGRuntimeStyles='+JSON.stringify(styleFiles)+';\n');
 for(const app of Object.values(apps)){
 const html=`<!doctype html>\n<html lang="en"><head><base href="./" />\n<meta charset="UTF-8" /><meta name="viewport" content="width=1280" />\n<title>${app.title}</title><meta name="description" content="${app.subtitle}" />\n<link rel="icon" href="${app.icon}" />\n${script('shared/hub-layout-viewport.js')}\n${style('styles/desktop-layout.css')}\n${style('vendor/tailwind/site.css')}\n${script('desktop-layout.js')}\n${app.id==='connections'?script('shared/connections-refresh.js'):''}\n${script('shared/hub-page-names.js')}\n${styles.map(file=>style(file).replace('<link ',file==='styles/music-games.css'?'<link data-music-games-theme ': '<link ')).join('\n')}\n${scripts.map(script).join('\n')}\n${app.id==='conceptsort'?script('shared/music-literacy-curriculum.js')+'\n':''}${['crosswords','wordsearch'].includes(app.id)?[style('styles/hub-collections.css'),script('shared/hub-collections.js')].join('\n'):''}\n<script defer src="./shared/hub-menu-fades.js?v=${hash('shared/hub-menu-fades.js')}"></script>\n${script('shared/hub-touch.js')}\n</head><body data-game-app="${app.id}"><div id="root"></div>\n${app.id==='conceptsort'?script('shared/music-games-startup.js'):''}\n${['crosswords','wordsearch'].includes(app.id)?script('shared/word-puzzle-worksheet.js'):''}\n${['art','silhouettes','app'].map(name=>script('music-games/runtime/'+name+'.js')).join('\n')}\n${script('footer.js')}\n<noscript>Enable JavaScript to use ${app.title}.</noscript></body></html>\n`;
 writeAtomic(path.join(root,app.href.replace('./','')),html);
 }
 writeAtomic(path.join(root,'conceptgames.html'),`<!doctype html>
<html lang="en"><head><base href="./" /><meta charset="UTF-8" /><meta name="viewport" content="width=1280" /><title>Concept Sort</title>
${script('shared/hub-layout-viewport.js')}
${style('styles/desktop-layout.css')}
${script('desktop-layout.js')}
${style('styles/hub-touch.css')}
${script('shared/hub-touch.js')}
${script('music-games/runtime/index.js')}
${script('music-dictionary/label-games-data.js')}
</head><body>${script('shared/concept-games-retired.js')}<p><a href="./conceptsort.html">Open Concept Sort</a></p></body></html>
`);

}
if(require.main===module)build();module.exports={build};
