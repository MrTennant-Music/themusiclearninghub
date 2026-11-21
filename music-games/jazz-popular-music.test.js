const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('./core'),D=require('../music-dictionary/music-concepts-data');
const {levels,filterIds,entriesForLevel,makeActivities}=require('../scripts/build-music-games-jazz-popular-music.cjs');
const activities=makeActivities();
test('Jazz and Popular Music covers the complete Dictionary group cumulatively through N5',()=>{
 assert.equal(activities.length,33);
 for(const [rank,[code,label]]of levels.entries()){
  const entries=entriesForLevel(code),games=activities.filter(a=>a.level===code);assert.equal(entries.length,[14,28,34][rank]);assert.equal(games.length,[9,12,12][rank]);
  assert.deepEqual(entries.flatMap(e=>e.ids).sort(),D.concepts.filter(c=>filterIds.includes(c.id)&&D.levels.indexOf(c.level)<=rank).map(c=>c.id).sort());
  assert.deepEqual([...new Set(games.map(a=>a.template))].sort(),['quiz','match-up','true-or-false','crossword','wordsearch','group-sort','matching-pairs'].sort());
  for(const template of ['quiz','match-up','true-or-false'])assert.deepEqual(games.filter(a=>a.template===template).flatMap(a=>a.items.map(i=>i.answer)).sort(),entries.map(e=>e.answer).sort());
  for(const game of games){assert.deepEqual(C.validateActivity(game),[],game.id);assert.equal(C.compatibility(game.template,game).ok,true);assert.equal(game.options.timer,0);assert.equal(game.options.shuffle,true);assert.ok(game.tags.includes(label));}
 }
 assert.throws(()=>entriesForLevel('H'));
});

test('overlapping styles and rhythmic devices never compete as false alternatives',()=>{
 const excluded=[['Jazz','Swing'],['Jazz','Ragtime'],['Rock',"Rock 'n' roll"],['Pop','Rock'],['Off the beat','Syncopation'],['Ostinato / riff','Vamp'],['Verse and chorus','Strophic']];
 for(const game of activities.filter(a=>['quiz','true-or-false'].includes(a.template)))for(const row of game.items){const choices=C.choices(row,game.items);assert.equal(choices.length,4);assert.equal(choices.filter(v=>C.isCorrectAnswer(row,v)).length,1);for(const pair of excluded.filter(pair=>pair.includes(row.answer)))assert.ok(!choices.includes(pair.find(v=>v!==row.answer)),game.id+': '+row.answer);}
});

test('word puzzles place every supported concept and larger matching banks are split',()=>{
 const React=require('react'),Babel=require('@babel/standalone'),context={window:{IGCore:C},React,setTimeout,clearTimeout};vm.runInNewContext(Babel.transform(fs.readFileSync('music-games/learning.jsx','utf8'),{presets:['react']}).code,context);
 for(const [code]of levels)for(const template of ['crossword','wordsearch']){const games=activities.filter(a=>a.level===code&&a.template===template);assert.deepEqual(games.flatMap(a=>a.items.map(i=>i.answer)).sort(),entriesForLevel(code).map(e=>e.word).sort());for(const game of games){assert.ok(game.items.length<=(code==='N5'?15:12));const puzzle=context.window.IGLearningPuzzles[template==='crossword'?'makeCrossword':'makeWordsearch'](game.items);assert.equal(puzzle.placed.length,game.items.length,game.id);assert.deepEqual(Array.from(puzzle.placed,p=>p.item.answer).sort(),game.items.map(i=>i.answer).sort());}}
 for(const game of activities.filter(a=>a.template==='match-up'))assert.ok(game.items.length<=24);
});
test('Sort and Connections use four distinct groups with concise unique cards',()=>{
 for(const game of activities.filter(a=>['group-sort','matching-pairs'].includes(a.template))){assert.equal(game.items.length,16);assert.equal(new Set(game.items.map(i=>i.prompt)).size,16);assert.ok(game.items.every(i=>i.prompt.length<=32));const groups=[...new Set(game.items.map(i=>i.group))];assert.equal(groups.length,4);for(const name of groups)assert.equal(game.items.filter(i=>i.group===name).length,4);}
});
test('all sources, browser registrations, catalogue entries and previews agree',()=>{
 const index=JSON.parse(fs.readFileSync('music-games/activities/index.json','utf8'));
 for(const activity of activities){assert.deepEqual(JSON.parse(fs.readFileSync(`music-games/activities/${activity.id}.json`,'utf8')),activity);let registered;vm.runInNewContext(fs.readFileSync(`music-games/activities/${activity.id}.js`,'utf8'),{window:{IGRuntime:{registerActivity:a=>registered=JSON.stringify(a)}}});assert.equal(registered,JSON.stringify(activity));const entry=index.find(a=>a.id===activity.id);assert.ok(entry);assert.equal(entry.thumbnail,undefined);}
});
