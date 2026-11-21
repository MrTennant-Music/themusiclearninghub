const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const C=require('./core.js');
const root='music-games/activities/';
const index=JSON.parse(fs.readFileSync(root+'index.json','utf8'));
const styles=[...require('../scripts/build-music-games-n3-styles.cjs').makeActivities(),...require('../scripts/build-music-games-styles.cjs').makeActivities()],styleIds=new Set(styles.map(a=>a.id));

const techniqueIds=new Set(require('../scripts/build-music-games-playing-techniques.cjs').makeActivities().map(a=>a.id));

const columnIds=new Set(require('../scripts/build-music-games-columns.cjs').makeActivities().map(a=>a.id));

const scottishIds=new Set(require('../scripts/build-music-games-scottish-music.cjs').makeActivities().map(a=>a.id));

const vocalIds=new Set(require('../scripts/build-music-games-vocal-music.cjs').makeActivities().map(a=>a.id));

const jazzIds=new Set(require('../scripts/build-music-games-jazz-popular-music.cjs').makeActivities().map(a=>a.id));

const orchestraIds=new Set(require('../scripts/build-music-games-orchestra.cjs').makeActivities().map(a=>a.id));

const periodIds=new Set(require('../scripts/build-music-games-periods.cjs').makeActivities().map(a=>a.id));

const worldIds=new Set(require('../scripts/build-music-games-world-music.cjs').makeActivities().map(a=>a.id));

const levelTestIds=new Set(require('../scripts/build-music-games-level-tests.cjs').makeActivities().map(a=>a.id));


test('deleted built-in activities have no remaining source files, browser bundles or previews',()=>{
 const ids=new Set(index.map(a=>a.id));
 for(const file of fs.readdirSync(root)){
  if(file==='index.json'||!/[.](json|js)$/.test(file))continue;
  assert.ok(ids.has(file.replace(/[.](json|js)$/, '')),file);
 }
 assert.equal(fs.existsSync(root+'thumbnails'),false);
});
test('all ten game types remain available for authoring',()=>{
 assert.equal(C.TEMPLATES.length,10);
 for(const id of ['quiz','true-or-false','complete-the-sentence','crossword','match-up','group-sort','rank-order','wordsearch'])assert.ok(C.TEMPLATES.some(t=>t.id===id),id);
});
