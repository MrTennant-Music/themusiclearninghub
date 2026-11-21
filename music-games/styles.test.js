const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('./core'),dictionary=require('../music-dictionary/music-concepts-data');
const {levels,groups,puzzleName,makeActivities}=require('../scripts/build-music-games-styles.cjs');
const activities=makeActivities();
test('all four remaining levels have the ten National 3 Styles game formats and cover their Dictionary concepts',()=>{
 const formats=C.TEMPLATES.map(t=>t.id).filter(id=>id!=='labelled-diagram').sort();
 const index=JSON.parse(fs.readFileSync('music-games/activities/index.json','utf8'));
 for(const [code,label]of levels){const games=activities.filter(a=>a.level===code),concepts=dictionary.concepts.filter(c=>c.level===label&&c.categories.includes('Styles'));
  assert.deepEqual([...new Set(games.map(a=>a.template))].sort(),formats);
  for(const game of games){assert.deepEqual(C.validateActivity(game),[],game.id);assert.equal(game.options.timer,0);assert.equal(game.options.shuffle,true);assert.ok(index.some(a=>a.id===game.id&&a.level===code));assert.deepEqual(JSON.parse(fs.readFileSync(`music-games/activities/${game.id}.json`,'utf8')),game);}
  for(const template of ['quiz','match-up','true-or-false','wordsearch','crossword'])assert.deepEqual(games.find(a=>a.template===template).items.map(i=>i.answer),concepts.map(c=>['wordsearch','crossword'].includes(template)?puzzleName(c.name):c.name));
  assert.equal(games.find(a=>a.template==='complete-the-sentence').items.length,concepts.length);
 }
 assert.equal(activities.length,54);
});
test('Connections has four unique facts per style and all style concepts appear in Sort and Connections',()=>{
 for(const [code,label]of levels)for(const template of ['matching-pairs','group-sort']){
  const games=activities.filter(a=>a.level===code&&a.template===template),covered=new Set();assert.equal(games.length,groups[code].length);
  for(const a of games){assert.equal(a.items.length,16);assert.equal(new Set(a.items.map(i=>i.prompt)).size,16);assert.ok(a.items.every(i=>i.prompt.length<=32));const headings=[...new Set(a.items.map(i=>i.group))];assert.equal(headings.length,4);for(const group of headings){assert.equal(a.items.filter(i=>i.group===group).length,4);covered.add(group);}}
  assert.deepEqual([...covered].sort(),dictionary.concepts.filter(c=>c.level===label&&c.categories.includes('Styles')).map(c=>c.name).sort());
 }
});

test('all Styles crossword and word-search answers fit and are actually placed',()=>{
 const React=require('react'),Babel=require('@babel/standalone'),context={window:{IGCore:C},React,setTimeout,clearTimeout};
 vm.runInNewContext(Babel.transform(fs.readFileSync('music-games/learning.jsx','utf8'),{presets:['react']}).code,context);
 for(const a of activities.filter(a=>['crossword','wordsearch'].includes(a.template))){assert.ok(a.items.length<=(a.level==='N4'?12:15));const fn=a.template==='crossword'?'makeCrossword':'makeWordsearch',puzzle=context.window.IGLearningPuzzles[fn](a.items);assert.equal(puzzle.placed.length,a.items.length,a.id);assert.deepEqual(Array.from(puzzle.placed,p=>p.item.answer).sort(),a.items.map(i=>i.answer).sort(),a.id);}
});
test('new Styles bundles register the exact activity and have preview files',()=>{
 const index=JSON.parse(fs.readFileSync('music-games/activities/index.json','utf8'));
 for(const a of activities){let registered;vm.runInNewContext(fs.readFileSync(`music-games/activities/${a.id}.js`,'utf8'),{window:{IGRuntime:{registerActivity:value=>registered=JSON.stringify(value)}}});assert.equal(registered,JSON.stringify(a));const entry=index.find(row=>row.id===a.id);assert.equal(entry.thumbnail,undefined);}
});

test('Styles groups avoid broad historical periods competing with their own forms',()=>{
 for(const game of activities.filter(a=>['matching-pairs','group-sort'].includes(a.template))){
  const labels=new Set(game.items.map(i=>i.group));
  if(labels.has('Renaissance'))for(const form of ['Anthem','Ayre or air','Ballett','Galliard','Madrigal','Motet','Pavan'])assert.ok(!labels.has(form),game.id+': '+form);
  if(labels.has('Baroque'))for(const form of ['Concerto','Opera'])assert.ok(!labels.has(form),game.id+': '+form);
  if(labels.has('Romantic'))for(const form of ['Concerto','Opera'])assert.ok(!labels.has(form),game.id+': '+form);
  if(labels.has('Mass')&&labels.has('Oratorio'))assert.ok(game.items.filter(i=>i.group==='Oratorio').every(i=>/story|biblical|drama/i.test(i.prompt)));
 }
});
test('period, work and genre clues give precise contexts and avoid a valid parent answer as a false option',()=>{
 for(const template of ['quiz','true-or-false','match-up','crossword','wordsearch']){
  const games=activities.filter(a=>a.template===template),row=name=>games.flatMap(g=>g.items).find(i=>i.answer===puzzleName(name)||i.answer===name);
  assert.match(row('Sonata').prompt,/solo piano/);
  assert.match(row('String quartet').prompt,/two violins, viola and cello/);
  assert.match(row('Renaissance').prompt,/1400.*1600/);
  assert.match(row('Minimalist').prompt,/change gradually/);
  assert.match(row('Reggae').prompt,/Jamaican/);assert.doesNotMatch(row('Reggae').prompt,/beats 2 and 4/);
  if(['quiz','true-or-false'].includes(template)){
   const ballett=row('Ballett');assert.ok(!ballett.distractors.includes('Madrigal'));assert.ok(!ballett.answerOptions.includes('Madrigal'));
   for(const game of games)for(const item of game.items){const choices=C.choices(item,game.items);assert.equal(choices.length,4);assert.equal(choices.filter(c=>C.isCorrectAnswer(item,c)).length,1);}
  }
 }
});



