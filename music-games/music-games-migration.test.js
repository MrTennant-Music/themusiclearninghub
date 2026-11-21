const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {apps,forTemplate,activityUrl}=require('../shared/music-games-apps');
const Core=require('./core');
test('retired games and their collections stay out of the catalogue and generators',()=>{
 const retired=['match-up','quiz','true-or-false','complete-the-sentence'];
 assert(!Core.TEMPLATES.some(t=>retired.includes(t.id)));
 assert(!apps.conceptsort.templates.some(t=>retired.includes(t)));
 const index=JSON.parse(fs.readFileSync('music-games/activities/index.json'));
 assert(!index.some(a=>retired.includes(a.template)));
 for(const file of fs.readdirSync('music-games/activities').filter(f=>f.endsWith('.json')&&f!=='index.json'))assert(!retired.includes(JSON.parse(fs.readFileSync('music-games/activities/'+file)).template),file);
 assert(!require('../scripts/build-music-games-collections.cjs').formats.some(t=>retired.includes(t)));
});
test('every retained format has exactly one public home',()=>{
 const formats=Object.values(apps).flatMap(a=>a.templates);assert.equal(formats.length,4);assert.equal(new Set(formats).size,4);
 assert.deepEqual(formats.slice().sort(),Core.TEMPLATES.filter(t=>!['labelled-diagram','rank-order'].includes(t.id)).map(t=>t.id).sort());
 assert.equal(apps.conceptsort.templates.length,1);
});
test('all catalogue games retain their IDs, content and a valid dedicated activity route',()=>{
 const index=JSON.parse(fs.readFileSync('music-games/activities/index.json'));
 assert(index.length>900);assert(!index.some(a=>a.template==='rank-order'));
 for(const row of index){const a=JSON.parse(fs.readFileSync(`music-games/activities/${row.id}.json`));const app=forTemplate(a.template),url=activityUrl('https://hub.test/',a);assert.equal(url.pathname,'/'+app.id+'.html');assert.equal(url.searchParams.get('activity'),a.id);assert.equal(url.searchParams.get('level'),a.level);assert.equal(url.searchParams.get('game'),a.template);assert.equal(url.searchParams.get('source'),'hub');}
});
test('new pages use the shared fixed canvas and individual names, icons and metadata',()=>{
 for(const a of Object.values(apps)){
  const html=fs.readFileSync(a.id+'.html','utf8');assert.ok(html.includes(`<title>${a.title}</title>`));assert.ok(html.includes(`content="${a.subtitle}"`));assert.ok(html.includes(`data-game-app="${a.id}"`));assert.match(html,/<meta name="viewport" content="width=1280"/);assert.match(html,/styles\/desktop-layout.css/);assert.match(html,/desktop-layout.js/);assert.match(html,/data-music-games-theme/);assert.ok(fs.existsSync(a.icon.replace('./','')));assert.doesNotMatch(html,/<title>Playnote<|playnote-create.css/);
 }
});
test('homepage exposes Concept Sort and quizzes no longer link to retired Concept Games',()=>{
 const home=fs.readFileSync('index.html','utf8'),quiz=fs.readFileSync('music-dictionary/music-concepts.js','utf8');
 for(const a of [apps.crosswords,apps.connections,apps.wordsearch,apps.conceptsort])assert.ok(home.includes(`href: "${a.id}.html", title: "${a.title}"`));
 assert.doesNotMatch(home,/href: "music-games\/conceptsort.html"|"Playnote":/);assert.doesNotMatch(quiz,/cq-playnote-leftovers|Concept Games|conceptgames.html/);
});
