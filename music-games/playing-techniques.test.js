const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('./core'),D=require('../music-dictionary/music-concepts-data'),R=require('../music-dictionary/music-concepts-revision-groups');
const {levels,entriesForLevel,makeActivities}=require('../scripts/build-music-games-playing-techniques.cjs');
const activities=makeActivities();
test('Playing Techniques covers the real cumulative Dictionary filter at every level',()=>{
 const ids=R.groupsForLevel('AH').find(g=>g.id==='playing-techniques').conceptIds;
 assert.equal(activities.length,40);
 levels.forEach(([code],rank)=>{const entries=entriesForLevel(code),games=activities.filter(a=>a.level===code);
  assert.equal(entries.length,[3,4,7,9,9][rank]);assert.equal(games.length,[6,6,8,10,10][rank]);
  assert.deepEqual(entries.flatMap(e=>e.ids).sort(),ids.filter(id=>D.levels.indexOf(D.concepts.find(c=>c.id===id).level)<=rank).sort());
  for(const game of games){assert.deepEqual(C.validateActivity(game),[],game.id);assert.equal(C.compatibility(game.template,game).ok,true,game.id);assert.equal(game.options.timer,0);assert.equal(game.options.shuffle,true);if(!['matching-pairs','group-sort'].includes(game.template))assert.equal(game.items.length,entries.length);}
  if(rank<2)for(const game of games)assert.doesNotMatch(JSON.stringify(game.items),/arco|sordino/i);
 });
});
test('equivalent terms are accepted together and never compete as wrong answers',()=>{
 for(const game of activities.filter(a=>a.template==='type-the-answer')){
  for(const row of game.items)for(const other of game.items.filter(i=>i!==row))assert.equal(C.isCorrectAnswer(row,other.answer),false);
  if(['N5','H','AH'].includes(game.level))for(const aliases of [['Arco','Bowing'],['Con sordino','Muted'],['Flutter-tonguing','Flutter tonguing']]){const row=game.items.find(i=>C.isCorrectAnswer(i,aliases[0]));assert.ok(row);assert.ok(C.isCorrectAnswer(row,aliases[1]));}
  const trem=game.items.find(i=>i.answer==='Tremolando');if(trem)assert.equal(C.isCorrectAnswer(trem,'Trill'),false);
 }
 for(const game of activities.filter(a=>['quiz','true-or-false'].includes(a.template)))for(const row of game.items){assert.equal(new Set(row.answerOptions.map(C.canonical)).size,row.answerOptions.length);assert.equal(row.answerOptions.filter(c=>C.isCorrectAnswer(row,c)).length,1);}
 for(const game of activities.filter(a=>a.template==='complete-the-sentence'))for(const row of game.items){for(const gap of row.clozeGaps)assert.equal(row.clozeText.slice(gap.start,gap.end),gap.text);assert.ok(!row.distractors.some(d=>C.canonical(d)===C.canonical(row.answer)));}
});
test('Connections and Sort have four distinct groups of four short descriptions',()=>{
 for(const game of activities.filter(a=>['matching-pairs','group-sort'].includes(a.template))){assert.equal(game.items.length,16);assert.equal(new Set(game.items.map(i=>i.prompt)).size,16);assert.ok(game.items.every(i=>i.prompt.length<=32));const groups=[...new Set(game.items.map(i=>i.group))];assert.equal(groups.length,4);for(const group of groups)assert.equal(game.items.filter(i=>i.group===group).length,4);assert.ok(!groups.includes('Legato'));}
});
test('all word-puzzle answers are placed and Italian terms have explicit clues',()=>{
 const React=require('react'),Babel=require('@babel/standalone'),context={window:{IGCore:C},React,setTimeout,clearTimeout};
 vm.runInNewContext(Babel.transform(fs.readFileSync('music-games/learning.jsx','utf8'),{presets:['react']}).code,context);
 for(const game of activities.filter(a=>['crossword','wordsearch'].includes(a.template))){assert.ok(game.items.length<=(['N3','N4'].includes(game.level)?12:15));const puzzle=context.window.IGLearningPuzzles[game.template==='crossword'?'makeCrossword':'makeWordsearch'](game.items);assert.equal(puzzle.placed.length,game.items.length,game.id);for(const row of game.items)if(['Arco','Con sordino'].includes(row.answer))assert.match(row.prompt,/Italian/);}
});
test('Playing Techniques source, browser bundles, index and previews agree',()=>{
 const index=JSON.parse(fs.readFileSync('music-games/activities/index.json','utf8'));
 for(const game of activities){assert.deepEqual(JSON.parse(fs.readFileSync(`music-games/activities/${game.id}.json`,'utf8')),game);let registered;vm.runInNewContext(fs.readFileSync(`music-games/activities/${game.id}.js`,'utf8'),{window:{IGRuntime:{registerActivity:value=>registered=JSON.stringify(value)}}});assert.equal(registered,JSON.stringify(game));const entry=index.find(i=>i.id===game.id);assert.ok(entry);assert.equal(entry.thumbnail,undefined);}
});
