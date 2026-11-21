const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {scope,build}=require('../scripts/build-music-games-concept-list.cjs');
test('collection scope uses only assessed source IDs, never distractors',()=>{
 const a={level:'AH',title:'Test',collectionId:'test',items:[{sourceConceptId:'MC-0001',answer:'Blues',prompt:'A clue mentioning jazz',distractors:['Jazz']}]};
 const rows=scope(a).sections.flatMap(s=>s.rows);
 assert.deepEqual(rows.map(r=>r.name),['Blues']);assert.equal(rows[0].level,'N3');assert.equal(rows[0].category,0);
});
test('Advanced Higher blank scope names curriculum topics without worked answers',()=>{
 const a=JSON.parse(fs.readFileSync('music-games/activities/hub-ah-music-literacy-blank-1.json'));
 const result=scope(a),names=result.sections.flatMap(s=>s.rows.map(r=>r.name));
 for(const name of ['First inversion','Second inversion','Enharmonic equivalents','Ties','Syncopated rhythms','Time signature: 5/4','8va and 8vb'])assert.ok(names.includes(name),name);
 for(const name of ['higher','same','B','E','Scales and key signatures — C major'])assert.ok(!names.includes(name),name);
 assert.equal(result.sections[0].kind,'literacy');
});
test('all published games have curriculum scope and valid categories',()=>{
 const all=build(),index=JSON.parse(fs.readFileSync('music-games/activities/index.json'));
 for(const a of index.filter(a=>!a.catalogueHidden)){
  const sections=all[a.id].sections;assert.ok(sections.length,a.id);
  for(const s of sections)for(const row of s.rows){assert.ok(['N3','N4','N5','H','AH'].includes(row.level),a.id);assert.ok(row.category>=0&&row.category<(s.kind==='literacy'?4:5),a.id);}
 }
});
test('level-test lists include every primary concept and any directly tested Blank concepts',()=>{
 const D=require('../music-dictionary/music-concepts-data'),excluded=require('../scripts/music-games-excluded-concepts.cjs').ids;
 const levels=['N3','N4','N5','H','AH'];
 for(const [i,level] of levels.entries())for(const format of ['blank','quiz','true-or-false']){
  const a=JSON.parse(fs.readFileSync(`music-games/activities/hub-${level.toLowerCase()}-level-test-${format}.json`));
  const result=scope(a),rows=result.sections.flatMap(s=>s.rows),expected=D.concepts.filter(c=>c.level===D.levels[i]&&!excluded.has(c.id));
  for(const c of expected)assert.ok(rows.some(r=>r.name===c.name),`${level} ${format} missing ${c.name}`);
  if(format!=='blank')assert.ok(rows.every(r=>r.level===level),`${level} ${format} has a foreign level`);
  assert.deepEqual(a.sourceConceptIds.slice().sort(),expected.map(c=>c.id).sort(),`${level} ${format} primary curriculum scope`);
  assert.ok(a.items.every(item=>item.sourceConceptId),`${level} ${format} source IDs`);
 }
});
test('legacy Blank answer fragments cannot become unrelated concepts',()=>{
 const a=JSON.parse(fs.readFileSync('music-games/activities/hub-n3-level-test-blank.json'));
 delete a.sourceConceptIds;for(const item of a.items)delete item.sourceConceptId;
 const rows=scope(a).sections.flatMap(s=>s.rows);
 assert.ok(rows.every(row=>row.level==='N3'));assert.ok(!rows.some(row=>row.name==='Ayre or air'));assert.ok(rows.some(row=>row.name==='Blowing'));
});

test('list resolution respects listening, literacy and contextual homonyms',()=>{
 const read=id=>JSON.parse(fs.readFileSync(`music-games/activities/${id}.json`));
 const rows=id=>scope(read(id)).sections.flatMap(s=>s.rows);
 const h=rows('hub-h-melody-harmony-connections-1');
 assert.ok(h.some(r=>r.name==='Diminished 7th'&&r.level==='H'));
 assert.ok(!h.some(r=>r.level==='AH'));
 const guitar=rows('hub-s1-parts-of-the-guitar');assert.ok(!guitar.some(r=>r.name==='Bridge'));assert.ok(guitar.some(r=>r.name.endsWith('— Bridge')));
 const n3=rows('hub-n3-level-test-blank');assert.ok(!n3.some(r=>r.name==='Ayre or air'||r.name==='Pedal'));
 const styles=rows('hub-n3-styles-blank-1');assert.ok(styles.every(r=>r.level==='N3'));assert.ok(!styles.some(r=>r.name==='Chorus'));
 const families=rows('hub-n3-timbre-connections-1');assert.ok(!families.some(r=>r.level!=='N3'));
});
test('every published game has current scope and no visible game requires above-level targets',()=>{
 const report=require('../scripts/audit-music-games-concept-lists.cjs').run();
 assert.deepEqual(report.failures,[]);assert.equal(report.visibleGames,1342);
 assert.deepEqual(report.aboveLevelGames,[]);assert.deepEqual(report.literacyScopeCautions,[]);
 for(const a of report.aboveLevelGames)for(const row of a.aboveLevel)assert.ok(row.evidence.length,`${a.id} ${row.name}`);
});

test('repaired questions and their registered browser bundles retain level-safe answers',()=>{
 const levels=['n3','n4','n5'];
 const fs=require('node:fs'),vm=require('node:vm'),{demandedConcepts}=require('../scripts/build-music-games-concept-list.cjs');
 for(const [rank,level] of levels.entries()){
  const id=`hub-${level}-level-test-blank`,a=JSON.parse(fs.readFileSync(`music-games/activities/${id}.json`));
  assert.ok(demandedConcepts(a).every(d=>['N3','N4','N5','H','AH'].indexOf(d.level)<=rank),id);
  let registered;vm.runInNewContext(fs.readFileSync(`music-games/activities/${id}.js`,'utf8'),{window:{IGRuntime:{registerActivity(value){registered=JSON.stringify(value);}}}});assert.equal(registered,JSON.stringify(a));
 }
 for(const id of ['hub-n3-music-literacy-blank-1','hub-n3-music-literacy-connections-1']){
  const a=JSON.parse(fs.readFileSync(`music-games/activities/${id}.json`));assert.ok(a.items.some(item=>/repetition/i.test(item.clozeText||item.answer)));assert.ok(!a.items.some(item=>/\bleap\b/i.test(item.clozeText||item.answer)));
 }
 const mixed=JSON.parse(fs.readFileSync('music-games/activities/hub-dictionary-n5-mixed-definitions-complete-the-sentence-1.json'));assert.ok(mixed.items.some(i=>i.clozeText.includes('pentatonic')));assert.ok(!mixed.items.some(i=>/tonic.*dominant/.test(i.clozeText)));
});
