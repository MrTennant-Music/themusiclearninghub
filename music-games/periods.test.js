const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('./core'),D=require('../music-dictionary/music-concepts-data'),R=require('../music-dictionary/music-concepts-revision-groups');
const {levels,periods,entriesFor,eligibleCollections,makeActivities}=require('../scripts/build-music-games-periods.cjs');
const activities=makeActivities(),eligible=eligibleCollections();
test('the five-concept cutoff leaves exactly 18 supported period-level combinations',()=>{
 assert.equal(eligible.length,18);assert.equal(activities.length,149);assert.ok(eligible.every(c=>c.entries.length>=5));
 assert.ok(!activities.some(a=>a.level==='N3'));
 assert.deepEqual(eligible.filter(c=>c.code==='N4').map(c=>c.slug).sort(),['baroque','classical','romantic']);
 for(const code of ['N5','H','AH'])assert.equal(eligible.filter(c=>c.code===code).length,5);
 const index=JSON.parse(fs.readFileSync('music-games/activities/index.json','utf8'));
 for(const [slug]of periods)for(const [code]of levels){const prefix=`hub-${code.toLowerCase()}-period-${slug}-`;assert.equal(index.some(a=>a.id.startsWith(prefix)),entriesFor(code,slug).length>=5,prefix);}
});
test('every period starts with the AH Dictionary group and drops all concepts above the selected level',()=>{
 const source=R.groupsForLevel('AH');
 for(const [slug,,id]of periods)for(const [rank,[code]]of levels.entries()){
  const expected=source.find(g=>g.id===id).conceptIds.filter(id=>D.levels.indexOf(D.concepts.find(c=>c.id===id).level)<=rank).sort();
  assert.deepEqual(entriesFor(code,slug).flatMap(e=>e.ids).sort(),expected,code+' '+slug);
 }
 for(const {slug,code,entries}of eligible){const prefix=`hub-${code.toLowerCase()}-period-${slug}-`,games=activities.filter(a=>a.id.startsWith(prefix));assert.deepEqual([...new Set(games.map(a=>a.template))].sort(),['quiz','match-up','true-or-false','crossword','wordsearch','group-sort','matching-pairs'].sort());
  for(const template of ['quiz','match-up','true-or-false'])assert.deepEqual(games.filter(a=>a.template===template).flatMap(a=>a.items.map(i=>i.answer)).sort(),entries.map(e=>e.answer).sort());
 }
});
test('equivalent polyphonic and contrapuntal entries merge without dropping either Dictionary concept',()=>{
 const rena=entriesFor('N5','renaissance');assert.equal(rena.length,5);assert.equal(rena.find(e=>e.conceptId==='MC-0184').answer,'Polyphonic');assert.deepEqual(rena.find(e=>e.conceptId==='MC-0184').ids,['MC-0188']);
 for(const code of ['N5','H','AH']){const rows=entriesFor(code,'baroque').filter(e=>e.conceptId==='MC-0184');assert.equal(rows.length,1);assert.deepEqual(rows[0].ids.slice().sort(),['MC-0184','MC-0188']);}
});
test('valid game data, unambiguous alternatives and shared-period descriptions survive generation',()=>{
 for(const game of activities){assert.deepEqual(C.validateActivity(game),[],game.id);assert.equal(C.compatibility(game.template,game).ok,true);assert.equal(game.options.shuffle,true);assert.equal(game.options.timer,0);assert.match(game.description,/may also occur in other periods/);
  if(['quiz','true-or-false'].includes(game.template))for(const row of game.items){const choices=C.choices(row,game.items);assert.equal(choices.length,4,game.id+': '+row.answer);assert.equal(choices.filter(v=>C.isCorrectAnswer(row,v)).length,1);}
  if(game.template==='type-the-answer')for(const row of game.items)for(const other of game.items.filter(i=>i!==row))for(const alias of other.correctAnswers)assert.equal(C.isCorrectAnswer(row,alias),false,game.id+': '+row.answer+' / '+alias);
 }
});
test('same-level parent terms are not used as false options for their own examples',()=>{
 const excluded=[['Madrigal','Ballett'],['Aria','Da capo aria'],['Chamber music','String quartet'],['Chamber music','Piano trio'],['Ornament','Trill'],['Ornament','Mordent'],['Ground bass','Passacaglia'],['Serial','Atonal'],['Serial','Tone row or note row'],['Cross rhythms','3 against 2']];
 for(const game of activities.filter(a=>['quiz','true-or-false'].includes(a.template)))for(const row of game.items)for(const pair of excluded.filter(p=>p.includes(row.answer)))assert.ok(!row.distractors.includes(pair.find(v=>v!==row.answer)),game.id+': '+row.answer);
});
test('all word answers are actually placed, and large matching banks are split',()=>{
 const React=require('react'),Babel=require('@babel/standalone'),context={window:{IGCore:C},React,setTimeout,clearTimeout};vm.runInNewContext(Babel.transform(fs.readFileSync('music-games/learning.jsx','utf8'),{presets:['react']}).code,context);
 for(const {slug,code,entries}of eligible)for(const template of ['crossword','wordsearch']){const games=activities.filter(a=>a.id.startsWith(`hub-${code.toLowerCase()}-period-${slug}-`)&&a.template===template);assert.deepEqual(games.flatMap(a=>a.items.map(i=>i.answer)).sort(),entries.map(e=>e.word).sort());for(const game of games){assert.ok(game.items.length<=(code==='N4'?12:15));const puzzle=context.window.IGLearningPuzzles[template==='crossword'?'makeCrossword':'makeWordsearch'](game.items);assert.equal(puzzle.placed.length,game.items.length,game.id);assert.deepEqual(Array.from(puzzle.placed,p=>p.item.answer).sort(),game.items.map(i=>i.answer).sort());}}
 for(const game of activities.filter(a=>a.template==='match-up'))assert.ok(game.items.length<=24);
});
test('all four-group games use available concepts and four concise unique facts per group',()=>{
 for(const game of activities.filter(a=>['group-sort','matching-pairs'].includes(a.template))){assert.equal(game.items.length,16);assert.equal(new Set(game.items.map(i=>i.prompt)).size,16);assert.ok(game.items.every(i=>i.prompt.length<=32));const groups=[...new Set(game.items.map(i=>i.group))];assert.equal(groups.length,4);const collection=eligible.find(c=>game.id.startsWith(`hub-${c.code.toLowerCase()}-period-${c.slug}-`));for(const group of groups){assert.ok(collection.entries.some(e=>e.answer===group));assert.equal(game.items.filter(i=>i.group===group).length,4);}}
});
test('all source files, browser registrations, chooser entries and previews agree',()=>{
 const index=JSON.parse(fs.readFileSync('music-games/activities/index.json','utf8'));
 for(const activity of activities){assert.deepEqual(JSON.parse(fs.readFileSync(`music-games/activities/${activity.id}.json`,'utf8')),activity);let registered;vm.runInNewContext(fs.readFileSync(`music-games/activities/${activity.id}.js`,'utf8'),{window:{IGRuntime:{registerActivity:a=>registered=JSON.stringify(a)}}});assert.equal(registered,JSON.stringify(activity));const entry=index.find(a=>a.id===activity.id);assert.ok(entry);assert.equal(entry.thumbnail,undefined);}
});
