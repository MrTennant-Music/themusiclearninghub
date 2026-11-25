const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const D=require('../music-dictionary/music-concepts-data'),collections=require('../music-dictionary/quiz-collections');
const context={window:{}};vm.runInNewContext(fs.readFileSync('music-dictionary/music-concepts-games.js','utf8'),context);const links=context.window.MUSIC_CONCEPT_GAMES;
test('every Dictionary concept has unique, reachable practice links',()=>{
 assert.equal(Object.keys(links).length,D.concepts.length);
 for(const concept of D.concepts){const rows=links[concept.id];assert.ok(rows?.length,concept.id);assert.equal(new Set(rows.map(row=>row.href||row.level+':'+row.search)).size,rows.length);
  for(const row of rows){if(row.href){assert.ok(row.icon);assert.ok(fs.existsSync(row.icon.split('?')[0]));const url=new URL(row.href,'http://hub.test/');assert.ok(fs.existsSync('.'+url.pathname),row.href);if(url.pathname==='/auralrecognition.html'){const exercise=url.searchParams.get('exercise'),html=fs.readFileSync('auralrecognition.html','utf8'),expanded=fs.readFileSync('ear-training-exercises.js','utf8')+fs.readFileSync('ear-training-piano-concepts.js','utf8');assert.ok(html.includes(exercise+': { label:')||expanded.includes(exercise+': { label:'),row.href);}}else assert.fail(concept.id+': every practice link must have an explicit destination');}
 }
});
test('Dictionary practice links exclude retired Ear Training exercises',()=>{
 const retired=new Set(['questionAnswer','articulation','rhythmicFeatures','imitationType','chordPresentation','countermelody']);
 for(const rows of Object.values(links))for(const row of rows){if(!row.href)continue;const url=new URL(row.href,'http://hub.test/');if(url.pathname==='/auralrecognition.html')assert.equal(retired.has(url.searchParams.get('exercise')),false,row.href);}
});
test('cadences, chords and intervals use the appropriate existing Hub activities',()=>{
 for(const id of ['MC-0165','MC-0169','MC-0232','MC-0238'])assert.ok(links[id].some(row=>row.href?.includes('exercise=cadence')));
 for(const id of ['MC-0010','MC-0011','MC-0082','MC-0157','MC-0278','MC-0279'])assert.ok(links[id].some(row=>row.href?.startsWith('./chords.html?')));
 assert.ok(links['MC-0233'].some(row=>row.href==='./intervals.html?level=H'));
 const excluded=require('../scripts/music-games-excluded-concepts.cjs').ids;for(const id of excluded)assert.ok(links[id].every(row=>row.href),'Excluded concepts must not acquire misleading Playnote collection links');
});
test('Renaissance retains its AH collection and practice links stay out of worksheets',()=>{
 assert.ok(links['MC-0274'].some(row=>row.href.startsWith('./conceptquiz.html?')&&JSON.parse(new URL(row.href,'http://hub.test/').searchParams.get('collection')).id==='renaissance-music'&&row.level==='AH'));
 const booklet=require('../music-dictionary/music-concepts-booklet');assert.ok(!fs.readFileSync('music-dictionary/music-concepts-booklet.js','utf8').includes('MUSIC_CONCEPT_GAMES'));
});

test('Step and Leap lead to N3 interval literacy, with targeted rhythm and cadence practice',()=>{
 for(const id of ['MC-0015','MC-0019'])assert.equal(links[id][0].href,'./intervals.html?level=N3');
 assert.ok(links['MC-0102'].some(row=>row.href==='./rhythmicdictation.html?level=N5'));
 assert.ok(links['MC-0247'].some(row=>row.href==='./rhythmicdictation.html?level=H&exercise=identifyTriplet'));
 assert.ok(links['MC-0169'].some(row=>row.href==='./cadences.html?level=N5'));
});


test('every concept links to its current Concept Quizzes collections with no Playnote destinations',()=>{
 let quizLinks=0;
 for(const concept of D.concepts){
  const level=['N3','N4','N5','H','AH'][D.levels.indexOf(concept.level)],expected=collections.groupsForLevel(level).filter(g=>!g.qualification&&!(g.curriculumColumn>0)&&g.conceptIds.includes(concept.id)),actual=[];
  for(const row of links[concept.id]){
   assert(row.href&&!row.href.includes('playnote'),concept.id);assert(!row.search);
   const url=new URL(row.href,'http://hub.test/');if(url.pathname!=='/conceptquiz.html')continue;
   quizLinks++;const selection=JSON.parse(url.searchParams.get('collection')),canonical=expected.find(g=>g.id===selection.id);assert(canonical,`${concept.id}: ${selection.id}`);actual.push(selection.id);
   assert.equal(url.searchParams.get('level'),level);assert.equal(selection.level,level);assert.equal(selection.tableLevel,level);assert.equal(selection.savedLevel,level);assert(selection.conceptIds.includes(concept.id));assert.deepEqual(selection.conceptIds,canonical.conceptIds);assert.equal(row.title,canonical.label);assert.equal(row.icon,'./app-icons/concept-quiz-icon.svg');
  }
  assert.deepEqual(actual.sort(),expected.map(g=>g.id).sort(),concept.id);
 }
 assert.equal(quizLinks,537);
});
