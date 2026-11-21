const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('./core'),D=require('../music-dictionary/music-concepts-data');
const {levels,filterIds,entriesForLevel,makeActivities}=require('../scripts/build-music-games-scottish-music.cjs');
const activities=makeActivities();
test('Scottish Music covers the complete Dictionary group cumulatively at N3, N4 and N5',()=>{
 assert.equal(activities.length,35);
 for(const [rank,[code,label]]of levels.entries()){
  const entries=entriesForLevel(code),games=activities.filter(a=>a.level===code);
  assert.equal(entries.length,[15,27,35][rank]);assert.equal(games.length,[9,12,14][rank]);
  const expected=D.concepts.filter(c=>filterIds.includes(c.id)&&D.levels.indexOf(c.level)<=rank).map(c=>c.id).sort();assert.deepEqual(entries.flatMap(e=>e.ids).sort(),expected);
  assert.deepEqual([...new Set(games.map(a=>a.template))].sort(),['quiz','match-up','true-or-false','crossword','wordsearch','group-sort','matching-pairs'].sort());
  for(const template of ['quiz','match-up','true-or-false'])assert.deepEqual(games.filter(a=>a.template===template).flatMap(a=>a.items.map(i=>i.answer)).sort(),entries.map(e=>e.answer).sort());
  for(const game of games){assert.deepEqual(C.validateActivity(game),[],game.id);assert.equal(C.compatibility(game.template,game).ok,true);assert.equal(game.options.timer,0);assert.equal(game.options.shuffle,true);}
  assert.ok(games.every(a=>a.tags.includes('Scottish Music')&&a.tags.includes(label)));
 }
 assert.throws(()=>entriesForLevel('H'));
});

test('broader national and song categories do not compete as false answers for their own examples',()=>{
 for(const game of activities.filter(a=>['quiz','true-or-false'].includes(a.template)))for(const row of game.items){const choices=C.choices(row,game.items);assert.equal(choices.length,4);assert.equal(choices.filter(v=>C.isCorrectAnswer(row,v)).length,1);if(['Mouth music','Scots ballad','Bothy ballad','Celtic rock','Gaelic psalm','Pibroch','Waulking song'].includes(row.answer))assert.ok(!choices.includes('Scottish'));if(row.answer==='Bothy ballad')assert.ok(!choices.includes('Scots ballad'));if(row.answer==='Scots ballad')assert.ok(!choices.includes('Bothy ballad'));if(row.answer==='Grace note')assert.ok(!choices.includes('Ornament'));}
});
test('dance, song and related Celtic instrument clues preserve their actual context',()=>{
 const game=activities.find(a=>a.id==='hub-n5-scottish-music-quiz-1'),row=name=>game.items.find(i=>i.answer===name);
 assert.match(row('Reel').prompt,/even running quavers/);assert.match(row('Strathspey').prompt,/Scotch snaps/);assert.match(row('Jig').prompt,/compound time/);
 assert.match(row('Bothy ballad').prompt,/North-East.*farm-worker/);assert.match(row('Scots ballad').prompt,/general Scots-language narrative/);
 assert.match(row('Bodhran').prompt,/Irish/);assert.doesNotMatch(row('Bodhran').prompt,/Scottish drum/i);assert.match(row('Clarsach').prompt,/Scottish/);
});
test('every crossword and word-search answer is placed, with short puzzles and matching full coverage',()=>{
 const React=require('react'),Babel=require('@babel/standalone'),context={window:{IGCore:C},React,setTimeout,clearTimeout};vm.runInNewContext(Babel.transform(fs.readFileSync('music-games/learning.jsx','utf8'),{presets:['react']}).code,context);
 for(const [code]of levels)for(const template of ['wordsearch','crossword']){const games=activities.filter(a=>a.level===code&&a.template===template);assert.deepEqual(games.flatMap(a=>a.items.map(i=>i.answer)).sort(),entriesForLevel(code).map(e=>e.word).sort());for(const game of games){assert.ok(game.items.length<=(code==='N5'?15:12));const puzzle=context.window.IGLearningPuzzles[template==='crossword'?'makeCrossword':'makeWordsearch'](game.items);assert.equal(puzzle.placed.length,game.items.length,game.id);assert.deepEqual(Array.from(puzzle.placed,p=>p.item.answer).sort(),game.items.map(i=>i.answer).sort());}}
 for(const game of activities.filter(a=>a.template==='match-up'))assert.ok(game.items.length<=24);
});
test('Sort and Connections have four distinct groups of four concise cards',()=>{
 for(const game of activities.filter(a=>['group-sort','matching-pairs'].includes(a.template))){assert.equal(game.items.length,16);assert.equal(new Set(game.items.map(i=>i.prompt)).size,16);assert.ok(game.items.every(i=>i.prompt.length<=32));const groups=[...new Set(game.items.map(i=>i.group))];assert.equal(groups.length,4);for(const name of groups)assert.equal(game.items.filter(i=>i.group===name).length,4);}
});
test('local sources, registered browser bundles, catalogue and preview files agree',()=>{
 const index=JSON.parse(fs.readFileSync('music-games/activities/index.json','utf8'));
 for(const activity of activities){assert.deepEqual(JSON.parse(fs.readFileSync(`music-games/activities/${activity.id}.json`,'utf8')),activity);let registered;vm.runInNewContext(fs.readFileSync(`music-games/activities/${activity.id}.js`,'utf8'),{window:{IGRuntime:{registerActivity:a=>registered=JSON.stringify(a)}}});assert.equal(registered,JSON.stringify(activity));const entry=index.find(a=>a.id===activity.id);assert.ok(entry);assert.equal(entry.thumbnail,undefined);}
});
