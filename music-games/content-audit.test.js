/* Semantic regressions from the 31 October content audit.
   Sources checked: Open University performance directions (rall./rit.),
   Open Music Theory chord symbols, MEI mordent documentation and
   Philharmonia Baroque's period overview. These tests protect the authored
   game content; search keywords in the Dictionary are not grading synonyms. */
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('./core');
const modules=['../scripts/build-music-games-n3-styles.cjs','../scripts/build-music-games-styles.cjs','../scripts/build-music-games-playing-techniques.cjs','../scripts/build-music-games-columns.cjs'];
const all=modules.flatMap(p=>require(p).makeActivities());
function item(id,answer){const game=all.find(a=>a.id===id);assert.ok(game,id);const row=game.items.find(i=>i.answer===answer);assert.ok(row,id+': '+answer);return row;}


test('interval and ornament clues preserve exact musical meaning',()=>{
 const octave=all.find(a=>a.id==='hub-n3-texture-structure-form-connections-1').items.filter(i=>i.group==='Unison / octave');assert.ok(octave.some(i=>/eight scale degrees/.test(i.prompt)));assert.ok(octave.every(i=>!/eight steps/.test(i.prompt)));
 assert.match(item('hub-h-melody-harmony-quiz-1','Added 6th').prompt,/major sixth/);
 assert.doesNotMatch(item('hub-h-melody-harmony-quiz-1','Plagal cadence').prompt,/softer/);
 assert.match(item('hub-ah-melody-harmony-quiz-1','Turn').prompt,/upper neighbour, main note, lower neighbour and main note/);
 assert.match(item('hub-ah-melody-harmony-quiz-1','Appoggiatura').prompt,/resolving.*step/);
 assert.match(item('hub-h-melody-harmony-quiz-1','Melodic minor scale').prompt,/classical/);
});
test('close instrument and ensemble definitions identify the intended instrument',()=>{
 assert.match(item('hub-n4-timbre-match-1','Clarinet').prompt,/cylindrical.*black wood or plastic/);
 assert.match(item('hub-n5-timbre-match-1','Tabla').prompt,/North Indian.*dayan and bayan/);
 assert.match(item('hub-h-timbre-match-1','String quartet').prompt,/two violins.*viola.*cello/);
 assert.match(item('hub-ah-timbre-match-1','Sprechgesang').prompt,/German.*speech-song/);
});
test('excluded chord topics are absent from word puzzle answers',()=>{
 for(const game of all.filter(a=>['crossword','wordsearch'].includes(a.template)))for(const row of game.items)assert.equal(require('../scripts/music-games-excluded-concepts.cjs').excludedName(row.answer),false);
});
test('the same-level answers used as false alternatives are never accepted aliases',()=>{
 for(const game of all.filter(a=>a.template==='quiz'||a.template==='true-or-false'))for(const row of game.items){const choices=C.choices(row,game.items);assert.equal(choices.filter(value=>C.isCorrectAnswer(row,value)).length,1,game.id+': '+row.answer);}
 for(const game of all.filter(a=>a.template==='type-the-answer'))for(const row of game.items)for(const other of game.items.filter(i=>i!==row))assert.equal(C.isCorrectAnswer(row,other.answer),false,game.id+': '+row.answer+' / '+other.answer);
});
test('sacred-story clues distinguish Oratorio from liturgical Mass in every relevant format',()=>{
 const games=all.filter(a=>a.level==='H'&&a.tags.includes('Styles'));
 for(const game of games){if(['quiz','match-up','true-or-false','crossword','wordsearch'].includes(game.template))assert.match(game.items.find(i=>i.answer==='Oratorio').prompt,/story/);
  if(game.template==='complete-the-sentence')assert.match(game.items.find(i=>i.answer.toLowerCase()==='oratorio').clozeText,/story/);
  if(['group-sort','matching-pairs'].includes(game.template))for(const row of game.items.filter(i=>i.group==='Oratorio'))assert.match(row.prompt,/story|biblical|drama/i);
 }
});
test('chronology cards expose which historical sense is being ordered',()=>{
 for(const game of all.filter(a=>a.template==='rank-order'&&a.tags.includes('Styles')))for(const row of game.items){assert.match(row.prompt,/ — /);assert.notEqual(row.prompt,row.answer);}
 const lied=item('hub-h-styles-order-1','Lied');assert.match(lied.prompt,/Romantic/);
});
test('connection cards stay concise after semantic corrections and are not duplicated across groups',()=>{
 for(const game of all.filter(a=>a.template==='matching-pairs')){assert.equal(new Set(game.items.map(i=>i.prompt)).size,16,game.id);assert.ok(game.items.every(i=>i.prompt.length<=32),game.id);}
});

test('repeating bass clues distinguish fixed pitch sequences from chord patterns and walking lines',()=>{
 const game=all.find(a=>a.id==='hub-n5-texture-structure-form-quiz-1');
 const basses=['Alberti bass','Ground bass','Walking bass'];
 for(const name of basses){const row=game.items.find(i=>i.answer===name);for(const other of basses.filter(b=>b!==name))assert.ok(!row.distractors.includes(other));}
 assert.match(game.items.find(i=>i.answer==='Ground bass').prompt,/unchanged.*fixed pitches and rhythm/i);
 assert.match(game.items.find(i=>i.answer==='Walking bass').prompt,/jazz.*each beat/);
});


test('harmonic-minor cards do not rely on the raised seventh shared with melodic minor',()=>{
 const game=all.find(a=>a.id==='hub-h-melody-harmony-connections-1');
 const facts=game.items.filter(i=>i.group==='Harmonic minor scale').map(i=>i.prompt);
 assert.ok(facts.some(f=>/natural 6th, raised 7th/.test(f)));
 assert.ok(facts.some(f=>/both up and down/.test(f)));
 assert.ok(facts.some(f=>/Same minor pitches up and down/.test(f)));
 assert.ok(facts.some(f=>/augmented 2nd/.test(f)));
 assert.ok(!facts.some(f=>f==='Minor scale with raised seventh'||f==='Minor scale: raised leading note'));
});
test('Mass cards identify the Ordinary without claiming every text is Latin',()=>{
 const games=all.filter(a=>a.tags.includes('Styles')&&['matching-pairs','group-sort'].includes(a.template));
 const mass=games.flatMap(a=>a.items).filter(i=>i.group==='Mass');assert.ok(mass.length);
 assert.ok(mass.some(i=>i.prompt==='Mass Ordinary liturgical text'));
 assert.ok(!mass.some(i=>/Fixed Latin liturgical sections/i.test(i.prompt)));
});
test('all accepted aliases are distinct from every other answer family in the same game',()=>{
 for(const game of all.filter(a=>a.template==='type-the-answer'))for(const row of game.items)for(const other of game.items.filter(i=>i!==row))for(const value of other.correctAnswers||[other.answer])assert.equal(C.isCorrectAnswer(row,value),false,game.id+': '+row.answer+' / '+value);
});
