const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('./core'),D=require('../music-dictionary/music-concepts-data');
const {levels,columns,entriesFor,makeActivities,related}=require('../scripts/build-music-games-columns.cjs');
const activities=makeActivities(),index=JSON.parse(fs.readFileSync('music-games/activities/index.json','utf8'));
test('all 19 requested level-columns have eight suitable formats, with exact level-specific coverage',()=>{
 assert.equal(activities.length,149);assert.equal(new Set(activities.map(a=>a.level+':'+a.tags[0])).size,19);
 assert.ok(!activities.some(a=>a.level==='AH'&&a.tags[0]==='Rhythm/tempo'));
 assert.ok(!index.some(a=>/^hub-ah-rhythm-tempo-/.test(a.id)));
 for(const [code,label]of levels)for(const [,category]of columns){if(code==='AH'&&category==='Rhythm/tempo')continue;
  const entries=entriesFor(code,category),games=activities.filter(a=>a.level===code&&a.tags[0]===category);
  assert.deepEqual(entries.flatMap(e=>e.ids).sort(),D.concepts.filter(c=>c.level===label&&c.categories.includes(category)&&!require('../scripts/music-games-excluded-concepts.cjs').ids.has(c.id)).map(c=>c.id).sort());
  assert.deepEqual([...new Set(games.map(a=>a.template))].sort(),['quiz','match-up','true-or-false','wordsearch','crossword','group-sort','matching-pairs'].sort());
  for(const template of ['quiz','match-up','true-or-false'])assert.deepEqual(games.filter(a=>a.template===template).flatMap(a=>a.items.map(i=>i.answer)).sort(),entries.map(e=>e.answer).sort());
  for(const template of ['wordsearch','crossword'])assert.deepEqual(games.filter(a=>a.template===template).flatMap(a=>a.items.map(i=>i.answer)).sort(),entries.map(e=>e.word).sort());
  for(const game of games){assert.deepEqual(C.validateActivity(game),[],game.id);assert.equal(C.compatibility(game.template,game).ok,true,game.id);assert.equal(game.options.shuffle,true);assert.equal(game.options.timer,0);}
 }
});

test('choice games keep parent terms out of false options for their own examples',()=>{
 for(const game of activities.filter(a=>['quiz','true-or-false'].includes(a.template))){const entries=entriesFor(game.level,game.tags[0]);for(const [i,row]of game.items.entries()){
  const choices=C.choices(row,game.items);assert.ok(choices.length>=2&&choices.length<=4);assert.equal(choices.filter(value=>C.isCorrectAnswer(row,value)).length,1);assert.equal(new Set(choices.map(C.canonical)).size,choices.length);
  for(const pair of related.filter(pair=>pair.includes(entries[i].conceptId))){const other=entries.find(e=>pair.includes(e.conceptId)&&e!==entries[i]);if(other)assert.ok(!row.distractors.includes(other.answer),game.id);}
 }}
});
test('short word puzzles place every answer and match games stay within the card limit',()=>{
 const React=require('react'),Babel=require('@babel/standalone'),context={window:{IGCore:C},React,setTimeout,clearTimeout};
 vm.runInNewContext(Babel.transform(fs.readFileSync('music-games/learning.jsx','utf8'),{presets:['react']}).code,context);
 for(const game of activities){if(game.template==='match-up')assert.ok(game.items.length<=24);
  if(!['crossword','wordsearch'].includes(game.template))continue;
  assert.ok(game.items.length<=(['N3','N4'].includes(game.level)?12:15));
  const puzzle=context.window.IGLearningPuzzles[game.template==='crossword'?'makeCrossword':'makeWordsearch'](game.items);assert.equal(puzzle.placed.length,game.items.length,game.id);assert.deepEqual(Array.from(puzzle.placed,p=>p.item.answer).sort(),game.items.map(i=>i.answer).sort(),game.id);
 }
});
test('Sort and Connections use four unique groups and sixteen concise cards from the right column',()=>{
 for(const game of activities.filter(a=>['group-sort','matching-pairs'].includes(a.template))){assert.equal(game.items.length,16);assert.equal(new Set(game.items.map(i=>i.prompt)).size,16);assert.ok(game.items.every(i=>i.prompt.length<=32));const labels=[...new Set(game.items.map(i=>i.group))];assert.equal(labels.length,4);const allowed=entriesFor(game.level,game.tags[0]).map(e=>e.answer);for(const label of labels){assert.ok(allowed.includes(label));assert.equal(game.items.filter(i=>i.group===label).length,4);}}
});
test('all new sources, browser bundles, previews and chooser entries agree',()=>{
 const runtime={window:{}};vm.runInNewContext(fs.readFileSync('music-games/runtime/index.js','utf8'),runtime);
 for(const game of activities){assert.deepEqual(JSON.parse(fs.readFileSync(`music-games/activities/${game.id}.json`,'utf8')),game);let registered;vm.runInNewContext(fs.readFileSync(`music-games/activities/${game.id}.js`,'utf8'),{window:{IGRuntime:{registerActivity:a=>registered=JSON.stringify(a)}}});assert.equal(registered,JSON.stringify(game));const entry=index.find(a=>a.id===game.id);assert.ok(entry);assert.equal(entry.thumbnail,undefined);assert.ok(runtime.window.IGActivityIndex.some(a=>a.id===game.id));}
});
