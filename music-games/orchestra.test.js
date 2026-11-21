const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('./core'),D=require('../music-dictionary/music-concepts-data');
const {filterIds,entries,makeActivities}=require('../scripts/build-music-games-orchestra.cjs');
const activities=makeActivities(),data=entries();
test('National 5 Orchestra covers all 28 Dictionary concepts in eight suitable formats',()=>{
 assert.equal(data.length,28);assert.equal(activities.length,10);assert.deepEqual(data.map(e=>e.conceptId).sort(),filterIds.slice().sort());assert.ok(data.every(e=>D.levels.indexOf(D.concepts.find(c=>c.id===e.conceptId).level)<=2));
 assert.deepEqual([...new Set(activities.map(a=>a.template))].sort(),['quiz','match-up','true-or-false','crossword','wordsearch','group-sort','matching-pairs'].sort());
 for(const template of ['quiz','match-up','true-or-false'])assert.deepEqual(activities.filter(a=>a.template===template).flatMap(a=>a.items.map(i=>i.answer)).sort(),data.map(e=>e.answer).sort());
 for(const game of activities){assert.equal(game.level,'N5');assert.deepEqual(C.validateActivity(game),[],game.id);assert.equal(C.compatibility(game.template,game).ok,true);assert.equal(game.options.timer,0);assert.equal(game.options.shuffle,true);}
});
test('all 23 instruments sort into the correct families, including easily misclassified members',()=>{
 const sort=activities.find(a=>a.template==='group-sort');assert.equal(sort.items.length,23);assert.deepEqual(sort.items.map(i=>i.answer).sort(),data.filter(e=>e.kind==='instrument').map(e=>e.answer).sort());
 const groups=Object.fromEntries(sort.items.map(i=>[i.answer,i.group]));assert.equal(groups.Saxophone,'Woodwind');assert.equal(groups.Harp,'Strings');assert.equal(groups['French horn'],'Brass');assert.equal(groups.Timpani,'Percussion');assert.equal(groups.Glockenspiel,'Percussion');
 assert.deepEqual(Object.fromEntries(['Brass','Percussion','Strings','Woodwind'].map(f=>[f,sort.items.filter(i=>i.group===f).length])),{Brass:4,Percussion:8,Strings:5,Woodwind:6});
 assert.ok(C.gradeSort(sort.items,Object.fromEntries(sort.items.map((i,n)=>[n,i.group]))).every(mark=>mark.correct));
});
test('Connections has four instruments per family with no ambiguous duplicated cards',()=>{
 const game=activities.find(a=>a.template==='matching-pairs');assert.equal(game.items.length,16);assert.equal(new Set(game.items.map(i=>i.prompt)).size,16);for(const family of ['Brass','Percussion','Strings','Woodwind'])assert.equal(game.items.filter(i=>i.group===family).length,4);assert.equal(game.items.find(i=>i.answer==='Harp').group,'Strings');assert.equal(game.items.find(i=>i.answer==='Saxophone').group,'Woodwind');
});

test('instrument questions distinguish flute, piccolo, horn and occasional orchestral additions',()=>{
 const quiz=activities.find(a=>a.template==='quiz'),row=name=>quiz.items.find(i=>i.answer===name);
 assert.match(row('Flute').prompt,/full-sized.*smaller relative is the piccolo/);assert.match(row('Piccolo').prompt,/octave above its written notes/);
 assert.match(row('French horn').prompt,/right hand inside the bell/);assert.match(row('Saxophone').prompt,/woodwind.*rather than as a regular core member/);
 assert.match(row('Harp').prompt,/plucked-string.*pedals/);assert.match(row('Glockenspiel').prompt,/metal bars/);assert.match(row('Xylophone').prompt,/wooden bars/);
 for(const game of activities.filter(a=>['quiz','true-or-false'].includes(a.template)))for(const [i,row]of game.items.entries()){const choices=C.choices(row,game.items);assert.equal(choices.length,4);assert.equal(choices.filter(v=>C.isCorrectAnswer(row,v)).length,1);if(data[i].kind==='instrument')assert.ok(row.distractors.every(answer=>data.find(e=>e.answer===answer).kind==='instrument'));if(data[i].kind==='family')assert.ok(row.distractors.every(answer=>data.find(e=>e.answer===answer).kind==='family'));}
});
test('word puzzles place every answer and matching banks stay within their limits',()=>{
 const React=require('react'),Babel=require('@babel/standalone'),context={window:{IGCore:C},React,setTimeout,clearTimeout};vm.runInNewContext(Babel.transform(fs.readFileSync('music-games/learning.jsx','utf8'),{presets:['react']}).code,context);
 for(const template of ['crossword','wordsearch']){const games=activities.filter(a=>a.template===template);assert.deepEqual(games.flatMap(a=>a.items.map(i=>i.answer)).sort(),data.map(e=>e.word).sort());for(const game of games){assert.ok(game.items.length<=15);const puzzle=context.window.IGLearningPuzzles[template==='crossword'?'makeCrossword':'makeWordsearch'](game.items);assert.equal(puzzle.placed.length,game.items.length,game.id);assert.deepEqual(Array.from(puzzle.placed,p=>p.item.answer).sort(),game.items.map(i=>i.answer).sort());}}
 for(const game of activities.filter(a=>a.template==='match-up'))assert.ok(game.items.length<=24);
});
test('Orchestra sources, browser bundles, catalogue and previews are consistent',()=>{
 const index=JSON.parse(fs.readFileSync('music-games/activities/index.json','utf8'));
 for(const activity of activities){assert.deepEqual(JSON.parse(fs.readFileSync(`music-games/activities/${activity.id}.json`,'utf8')),activity);let registered;vm.runInNewContext(fs.readFileSync(`music-games/activities/${activity.id}.js`,'utf8'),{window:{IGRuntime:{registerActivity:a=>registered=JSON.stringify(a)}}});assert.equal(registered,JSON.stringify(activity));const entry=index.find(a=>a.id===activity.id);assert.ok(entry);assert.equal(entry.thumbnail,undefined);}
});
