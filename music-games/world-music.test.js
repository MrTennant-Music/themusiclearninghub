const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('./core'),D=require('../music-dictionary/music-concepts-data'),R=require('../music-dictionary/music-concepts-revision-groups');
const {filterIds,entries,makeActivities}=require('../scripts/build-music-games-world-music.cjs');
const activities=makeActivities(),data=entries();
test('National 5 World Music covers all 17 Dictionary concepts in eight formats',()=>{
 assert.equal(data.length,17);assert.equal(activities.length,9);assert.deepEqual(filterIds.slice().sort(),R.groupsForLevel('N5').find(g=>g.id==='world-music').conceptIds.slice().sort());assert.deepEqual(data.map(e=>e.conceptId).sort(),filterIds.slice().sort());
 assert.ok(data.every(e=>D.levels.indexOf(D.concepts.find(c=>c.id===e.conceptId).level)<=2));assert.ok(data.some(e=>D.concepts.find(c=>c.id===e.conceptId).level==='National 3'));
 assert.deepEqual([...new Set(activities.map(a=>a.template))].sort(),['quiz','match-up','true-or-false','crossword','wordsearch','group-sort','matching-pairs'].sort());
 for(const template of ['quiz','match-up','true-or-false'])assert.deepEqual(activities.filter(a=>a.template===template).flatMap(a=>a.items.map(i=>i.answer)).sort(),data.map(e=>e.answer).sort());
 for(const game of activities){assert.equal(game.level,'N5');assert.deepEqual(C.validateActivity(game),[],game.id);assert.equal(C.compatibility(game.template,game).ok,true);assert.equal(game.options.shuffle,true);assert.equal(game.options.timer,0);}
});

test('regional clues are qualified and distinguish ensembles and instruments accurately',()=>{
 const game=activities.find(a=>a.template==='quiz'),row=name=>game.items.find(i=>i.answer===name);
 assert.match(row('African music').prompt,/diverse traditions.*African continent/);assert.match(row('Indian').prompt,/North Indian traditions.*common listening examples/);assert.match(row('Latin American').prompt,/broad regional.*Common listening examples/);
 assert.match(row('Steel band').prompt,/tuned steel pans.*Trinidad and Tobago/);assert.match(row('Bongo drums').prompt,/joined pair.*Afro-Cuban/);assert.match(row('Tabla').prompt,/North Indian.*dayan and bayan/);assert.match(row('Sitar').prompt,/North Indian.*sympathetic strings/);
 assert.match(row('Cross rhythms').prompt,/groupings.*simultaneously/);assert.match(row('Syncopation').prompt,/shifts emphasis/);
});
test('choice games offer one correct answer and avoid treating related rhythm concepts as false equivalents',()=>{
 for(const game of activities.filter(a=>['quiz','true-or-false'].includes(a.template)))for(const row of game.items){const choices=C.choices(row,game.items);assert.equal(choices.length,4);assert.equal(choices.filter(v=>C.isCorrectAnswer(row,v)).length,1);if(row.answer==='Cross rhythms')assert.ok(!row.distractors.includes('Syncopation'));if(row.answer==='Syncopation')assert.ok(!row.distractors.includes('Cross rhythms'));}
});
test('all word-puzzle answers are placed across short complete sets',()=>{
 const React=require('react'),Babel=require('@babel/standalone'),context={window:{IGCore:C},React,setTimeout,clearTimeout};vm.runInNewContext(Babel.transform(fs.readFileSync('music-games/learning.jsx','utf8'),{presets:['react']}).code,context);
 for(const template of ['crossword','wordsearch']){const games=activities.filter(a=>a.template===template);assert.equal(games.length,2);assert.deepEqual(games.flatMap(a=>a.items.map(i=>i.answer)).sort(),data.map(e=>e.word).sort());for(const game of games){assert.ok(game.items.length<=15);const puzzle=context.window.IGLearningPuzzles[template==='crossword'?'makeCrossword':'makeWordsearch'](game.items);assert.equal(puzzle.placed.length,game.items.length,game.id);assert.deepEqual(Array.from(puzzle.placed,p=>p.item.answer).sort(),game.items.map(i=>i.answer).sort());}}
});
test('Sort and Connections group instrument descriptions without assigning an exclusive culture to each instrument',()=>{
 for(const game of activities.filter(a=>['group-sort','matching-pairs'].includes(a.template))){assert.equal(game.items.length,16);assert.equal(new Set(game.items.map(i=>i.prompt)).size,16);assert.ok(game.items.every(i=>i.prompt.length<=32));assert.deepEqual([...new Set(game.items.map(i=>i.group))].sort(),['Guiro','Pan pipes','Sitar','Tabla']);for(const name of ['Guiro','Pan pipes','Sitar','Tabla'])assert.equal(game.items.filter(i=>i.group===name).length,4);}
});
test('source files, browser registrations, catalogue and previews agree',()=>{
 const index=JSON.parse(fs.readFileSync('music-games/activities/index.json','utf8'));
 for(const activity of activities){assert.deepEqual(JSON.parse(fs.readFileSync(`music-games/activities/${activity.id}.json`,'utf8')),activity);let registered;vm.runInNewContext(fs.readFileSync(`music-games/activities/${activity.id}.js`,'utf8'),{window:{IGRuntime:{registerActivity:a=>registered=JSON.stringify(a)}}});assert.equal(registered,JSON.stringify(activity));const entry=index.find(a=>a.id===activity.id);assert.ok(entry);assert.equal(entry.thumbnail,undefined);}
});
