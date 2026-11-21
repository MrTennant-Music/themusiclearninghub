const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('./core'),D=require('../music-dictionary/music-concepts-data');
const {levels,introduced,entriesForLevel,makeActivities}=require('../scripts/build-music-games-vocal-music.cjs');
const activities=makeActivities();
test('Vocal Music has complete cumulative coverage of its explicit level-checked selection',()=>{
 assert.equal(activities.length,57);assert.equal(new Set(Object.values(introduced).flat()).size,57);
 for(const [rank,[code,label]]of levels.entries()){
  for(const id of introduced[code])assert.equal(D.concepts.find(c=>c.id===id).level,label,id);
  const entries=entriesForLevel(code),games=activities.filter(a=>a.level===code);
  assert.equal(entries.length,[12,24,35,45,55][rank]);assert.equal(games.length,[7,9,12,12,17][rank]);
  assert.deepEqual(entries.flatMap(e=>e.ids).sort(),levels.slice(0,rank+1).flatMap(([l])=>introduced[l]).sort());
  assert.deepEqual([...new Set(games.map(a=>a.template))].sort(),['quiz','match-up','true-or-false','crossword','wordsearch','group-sort','matching-pairs'].sort());
  for(const template of ['quiz','match-up','true-or-false'])assert.deepEqual(games.filter(a=>a.template===template).flatMap(a=>a.items.map(i=>i.answer)).sort(),entries.map(e=>e.answer).sort());
  for(const game of games){assert.deepEqual(C.validateActivity(game),[],game.id);assert.equal(C.compatibility(game.template,game).ok,true);assert.equal(game.options.timer,0);assert.equal(game.options.shuffle,true);}
 }
});

test('false options do not offer a valid parent category or equivalent alongside its example',()=>{
 const excluded=[['Aria','Da capo aria'],['Madrigal','Ballett'],['Scots ballad','Bothy ballad'],['Melismatic','Coloratura'],['Recitative','Sprechgesang'],['Musical','Opera']];
 for(const game of activities.filter(a=>['quiz','true-or-false'].includes(a.template)))for(const row of game.items){const choices=C.choices(row,game.items);assert.equal(choices.length,4);assert.equal(choices.filter(v=>C.isCorrectAnswer(row,v)).length,1);for(const pair of excluded.filter(pair=>pair.includes(row.answer)))assert.ok(!choices.includes(pair.find(v=>v!==row.answer)),game.id+': '+row.answer);}
});

test('every word-puzzle answer is placed and larger matching banks are split',()=>{
 const React=require('react'),Babel=require('@babel/standalone'),context={window:{IGCore:C},React,setTimeout,clearTimeout};vm.runInNewContext(Babel.transform(fs.readFileSync('music-games/learning.jsx','utf8'),{presets:['react']}).code,context);
 for(const [code]of levels)for(const template of ['crossword','wordsearch']){const games=activities.filter(a=>a.level===code&&a.template===template);assert.deepEqual(games.flatMap(a=>a.items.map(i=>i.answer)).sort(),entriesForLevel(code).map(e=>e.word).sort());for(const game of games){assert.ok(game.items.length<=(['N3','N4'].includes(code)?12:15));const puzzle=context.window.IGLearningPuzzles[template==='crossword'?'makeCrossword':'makeWordsearch'](game.items);assert.equal(puzzle.placed.length,game.items.length,game.id);assert.deepEqual(Array.from(puzzle.placed,p=>p.item.answer).sort(),game.items.map(i=>i.answer).sort());}}
 for(const game of activities.filter(a=>a.template==='match-up'))assert.ok(game.items.length<=24);
 const ayre=activities.filter(a=>a.level==='AH'&&a.template==='crossword').flatMap(a=>a.items).find(i=>i.answer==='Ayre');assert.match(ayre.prompt,/four-letter historical spelling/);
});
test('Sort and Connections use four clear groups of four short descriptions',()=>{
 for(const game of activities.filter(a=>['group-sort','matching-pairs'].includes(a.template))){assert.equal(game.items.length,16);assert.equal(new Set(game.items.map(i=>i.prompt)).size,16);assert.ok(game.items.every(i=>i.prompt.length<=32));const names=[...new Set(game.items.map(i=>i.group))];assert.equal(names.length,4);for(const name of names)assert.equal(game.items.filter(i=>i.group===name).length,4);}
});
test('sources, browser bundles, catalogue and previews contain the same audited activities',()=>{
 const index=JSON.parse(fs.readFileSync('music-games/activities/index.json','utf8'));
 for(const activity of activities){assert.deepEqual(JSON.parse(fs.readFileSync(`music-games/activities/${activity.id}.json`,'utf8')),activity);let registered;vm.runInNewContext(fs.readFileSync(`music-games/activities/${activity.id}.js`,'utf8'),{window:{IGRuntime:{registerActivity:a=>registered=JSON.stringify(a)}}});assert.equal(registered,JSON.stringify(activity));const entry=index.find(a=>a.id===activity.id);assert.ok(entry);assert.equal(entry.thumbnail,undefined);}
});
