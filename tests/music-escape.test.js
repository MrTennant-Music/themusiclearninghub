'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const C = require('../music-escape/core.js');
const D = require('../music-escape/content.js');
const root = path.resolve(__dirname, '..');
const values = room => ({archive:room.knowledge.correctOptionIds[0],mechanism:true,recording:room.listening.correctOptionIds[0],exit:room.code});
const newState = (seed = 1, options = {}) => {const s=C.create(seed,options); C.enter(s); return s;};
for(const level of C.levels) test(`${level}: all lengths and balances, 100 seeds, complete escape and restore`, () => {
 for(const length of Object.keys(C.routes)) for(const balance of ['Balanced','Listening','Knowledge','Practical']) for(let seed=0;seed<100;seed++) {
  const options={level,length,balance},rooms=C.generate(seed,options,D); let s=newState(seed,options);
  assert.deepEqual(rooms,C.generate(seed,options,D));
  assert.equal(rooms[0].index,0); assert.equal(rooms.at(-1).index,8);
  assert.equal(new Set(rooms.map(room=>room.literacy.kind)).size,rooms.length);
  assert(rooms.every(room=>!['tempo','cadences'].includes(room.literacy.kind)));
  assert(C.literacyReviewOrder(seed,level,rooms[0].literacy.kind).every(kind=>!['tempo','cadences'].includes(kind)));
  assert(!C.literacyReviewOrder(seed,level,rooms[0].literacy.kind).includes('rhythmPlay'));
  for(const room of rooms){
   assert.notEqual(room.literacy.kind,'rhythmPlay');
   assert.match(room.code,/^[1-9]{3,4}$/);
   assert(room.concepts.every(c=>c.level===level));assert.equal(room.audioConcept.level,level);
   assert.equal(room.durations.reduce((a,b)=>a+b,0),4);
   assert.equal(new Set(room.concepts.map(c=>c.id)).size,3);
   const v=values(room);
   if(room.position===0)assert.equal(C.solve(s,room,'exit','invalid'),false);
   for(const key of ['archive','mechanism','recording','exit']){
    assert.equal(C.solve(s,room,key,v[key]),true,`${level}/${length}/${balance}/${seed}/${room.index}/${key}`);
    const score=s.score,attempts=s.attempts;
    assert.equal(C.solve(s,room,key,v[key]),false);assert.equal(s.score,score);assert.equal(s.attempts,attempts);
    s=C.restore(JSON.stringify(s),D); assert(s,'save must restore after each solution');
   }
   assert.equal(C.advance(s,rooms.length),true);
  }
  assert(s.finished); assert.equal(s.fragments.length,rooms.length);assert.equal(s.score,undefined);
  const score=s.score; assert.equal(C.advance(s,rooms.length),false);assert.equal(s.score,score);assert.equal(C.medal(s),'diamond');
  assert(C.restore(JSON.stringify(s),D));
 }
});
test('wrong answers leave mechanisms locked and count one attempt',()=>{
 const s=newState(),room=C.generate(s.seed,s.options,D)[0];
 for(const value of [null,[],['missing'],room.concepts.map(c=>c.id).reverse()]) assert.equal(C.solve(s,room,'archive',value),false);
 assert.equal(s.attempts,3);assert.equal(s.score,undefined);assert.deepEqual(s.inventory,[]);assert.equal(C.ready(s,room,'mechanism'),true);
 assert.equal(C.advance(s,3),false);
});
test('discovery and inventory are idempotent; room restart is coherent',()=>{
 const s=newState(),rooms=C.generate(s.seed,s.options,D),room=rooms[0];C.discover(s,room);C.discover(s,room);assert.equal(s.journal.length,1);
 const v=values(room);C.solve(s,room,'archive',v.archive);assert.deepEqual(s.inventory,['Cylinder 1']);
 C.solve(s,room,'mechanism',v.mechanism);assert.deepEqual(s.inventory,['Recording 1']);C.solve(s,room,'recording',v.recording);assert.deepEqual(s.inventory,[]);
 C.solve(s,room,'exit',v.exit);C.advance(s,rooms.length);const entry=JSON.parse(JSON.stringify(s));
 C.solve(s,rooms[1],'archive',values(rooms[1]).archive);s.elapsed=50;s.drafts.example=['a'];C.restart(s);
 assert.equal(s.room,1);assert.equal(s.elapsed,50);assert.equal(s.score,entry.score);assert.deepEqual(s.solved,entry.solved);assert.deepEqual(s.inventory,entry.inventory);assert.deepEqual(s.fragments,[0]);assert.deepEqual(s.drafts,{});
});
test('save validation rejects broken versions, values and unreachable progress',()=>{
 const base=newState();
 assert.equal(C.restore('{broken',D),null);
 for(const mutate of [s=>s.version=0,s=>s.seed=-1,s=>s.room=99,s=>s.options.level='BAD',s=>s.attempts=-1,s=>s.elapsed=null,s=>s.solved=['0:exit'],s=>s.room=1,s=>s.finished=true,s=>s.solved=['0:unknown'],s=>s.roomEntry=null]){
  const s=JSON.parse(JSON.stringify(base));mutate(s);assert.equal(C.restore(JSON.stringify(s),D),null);
 }
});
test('malformed nested save data is rejected before it reaches UI or restart',()=>{
 for(const mutate of [s=>s.journal=[null],s=>s.inventory=[{}],s=>s.roomEntry={},s=>s.solved=['99:archive'],s=>s.solved=['0:archive','0:archive'],s=>s.correct=5]){
  const s=newState();mutate(s);assert.equal(C.restore(JSON.stringify(s),D),null,JSON.stringify(s));
 }
});
test('bank question wording, choices and answers match Concept Quizzes; recordings are local and intact',()=>{
 const context={window:{}};require('node:vm').runInNewContext(fs.readFileSync(path.join(root,'music-dictionary/quiz-bank.js'),'utf8'),context);
 const bank=JSON.parse(JSON.stringify(context.window.MUSIC_DICTIONARY_QUIZ_BANK));
 for(const level of C.levels){assert(D.audio.filter(q=>q.level===level).length>=6);assert(D.knowledge.filter(q=>q.level===level).length>=6);}
 for(const entry of [...D.knowledge,...D.audio]){
  const q=bank.questions.find(q=>q.id===entry.questionId);assert(q);assert.equal(entry.prompt,q.prompt);assert.equal(entry.level,q.levelCode);
  assert.deepEqual(entry.options,q.options.map(({id,text})=>({id,text})));assert.deepEqual(entry.correctOptionIds,q.answer.correctOptionIds);
  if(entry.src){const file=path.join(root,decodeURIComponent(entry.src));assert(fs.existsSync(file));assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),entry.sha256);assert(entry.start>=0&&entry.end>entry.start);}
 }
});
test('standard rooms use distinct cumulative questions with current-level priority',()=>{
 for(const [rank,level] of C.levels.entries()){
  const rooms=C.generate(314159,{level},D);
  assert.equal(new Set(rooms.map(r=>r.literacySeed)).size,6);
  for(const kind of ['knowledge','listening']){
   const questions=rooms.map(r=>r[kind]);
   assert.equal(new Set(questions.map(q=>q.questionId)).size,6);
   assert.ok(questions.every(q=>C.levels.indexOf(q.level)<=rank));
   assert.equal(questions.filter(q=>q.level===level).length,rank?4:6);
  }
  for(const r of rooms){assert(!C.answer(r,'mechanism',false));assert(C.answer(r,'mechanism',true));}
  const legacy=C.generate(314159,{level},D,undefined,2);
  assert.ok(legacy.every(r=>r.knowledge.level===level&&r.listening.level===level));
 }
});
test('build publication includes game folder and the homepage links the activity',()=>{
 const build=fs.readFileSync(path.join(root,'scripts/build-site.js'),'utf8');assert.match(build,/"music-escape"/);
 assert.match(fs.readFileSync(path.join(root,'index.html'),'utf8'),/musicescape\.html/);
});
test('chord notation preserves diatonic spelling, including flats and B sharp',()=>{
 const letters='CDEFGAB',natural=[0,2,4,5,7,9,11];let sawFlat=false,sawBSharp=false;
 for(const level of C.levels)for(let seed=0;seed<100;seed++)for(const r of C.generate(seed,{level,length:'Extended'},D)){
  r.spellings.forEach((label,i)=>{const step=letters.indexOf(label[0]),oct=Number(label.at(-1)),alter=label.includes('♯')?1:label.includes('♭')?-1:0;assert.equal(12*(oct+1)+natural[step]+alter,r.sequence[i]);if(i)assert.equal((step-letters.indexOf(r.spellings[i-1][0])+7)%7,level==='N3'?1:2);sawFlat ||=label.includes('♭');sawBSharp ||=label==='B♯4';});
 }
 assert(sawFlat);assert(sawBSharp);
});
test('partly filled archive selectors restore even when entered out of order',()=>{
 const s=newState();s.drafts['0:archive']=['',C.generate(1,s.options,D)[0].concepts[1].id,''];assert(C.restore(JSON.stringify(s),D));
});

test('room medals are earned on unlock, before advancing, regardless of time',()=>{
 const s=newState(),rooms=C.generate(s.seed,s.options,D);
 const expected=[null,null,'bronze','silver','gold','diamond'];
 s.elapsed=5*60*60;
 for(const [index,room] of rooms.entries()){
  assert.equal(C.medal(s),expected[index-1]??null,'entering a room must not award its medal');
  assert.equal(C.solve(s,room,'exit','000'),false);
  assert.equal(C.medal(s),expected[index-1]??null,'an incorrect code must not award a medal');
  s.mistakes=0;
  assert(C.solve(s,room,'exit',room.code));
  assert.equal(C.medal(s),expected[index]);
  assert.equal(s.finished,false);
  assert.equal(C.solve(s,room,'exit',room.code),false);
  assert(C.advance(s,rooms.length));
  assert.equal(C.medal(s),expected[index]);
 }
 assert(s.finished);
});
test('legacy point totals are discarded without losing saved progress',()=>{
 const s=newState();s.score=300;s.roomEntry.score=100;const restored=C.restore(JSON.stringify(s),D);assert(restored);assert.equal(restored.score,undefined);assert.equal(restored.roomEntry.score,undefined);
});

test('every object order allows solving and restoring, including door first',()=>{
 const permutations=items=>items.length?items.flatMap((item,i)=>permutations(items.filter((_,j)=>j!==i)).map(rest=>[item,...rest])):[[]];
 for(const level of C.levels)for(const order of permutations(['archive','mechanism','recording','exit'])){
  let s=C.create(123,{level,length:'Standard'});C.enter(s);const room=C.generate(s.seed,s.options,D)[0],v=values(room);
  for(const key of order){assert.equal(C.ready(s,room,key),true);assert.equal(C.solve(s,room,key,v[key]),true);s=C.restore(JSON.stringify(s),D);assert(s,level+': '+order.join(','));}
  assert.deepEqual(s.inventory,[]);assert.deepEqual(s.fragments,[0]);assert.equal(C.advance(s,6),true);
 }
});

test('every room has its own four transparent photographic object assets',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'music-escape/room-objects/manifest.json'),'utf8'));
 assert.equal(manifest.length,36);assert.equal(new Set(manifest.map(asset=>asset.sha256)).size,36);
 for(let room=0;room<9;room++)for(const object of ['archive','mechanism','recording','exit']){
  const asset=manifest.find(item=>item.room===room&&item.object===object);assert(asset);
  const data=fs.readFileSync(path.join(root,asset.path));assert.equal(data.subarray(1,4).toString(),'PNG');assert.equal(data.readUInt32BE(16),512);assert.equal(data.readUInt32BE(20),512);assert.equal(data[25],6,'RGBA transparency');assert.equal(crypto.createHash('sha256').update(data).digest('hex'),asset.sha256);
 }
});

test('standard school route follows the agreed six-room order',()=>{
 assert.deepEqual(C.generate(123,{level:'N3',length:'Standard'},D).map(room=>room.name),['Practice Room','Recording Room','Music Classroom','Corridor','Staff Room','Assembly Hall']);
});

test('each room shuffles its visible clues with a stable layout for the attempt',()=>{
 const layouts=Array.from({length:6},()=>new Set());
 for(let seed=0;seed<20;seed++){
  const options={level:'AH'};
  const rooms=C.generate(seed,options,D);
  const replay=C.generate(seed,options,D);
  assert.ok(rooms[0].sceneOrder.join()!==rooms[1].sceneOrder.join()||rooms[1].sceneOrder.join()!==rooms[2].sceneOrder.join());
  for(const [position,room] of rooms.entries()){
   assert.deepEqual([...room.sceneOrder].sort(),[...C.clueObjects.slice(0,room.digits.length),'order'].sort());
   assert.deepEqual(room.sceneOrder,replay[position].sceneOrder);
   layouts[position].add(room.sceneOrder.join());
  }
 }
 assert.ok(layouts.every(layout=>layout.size>1));
});

test('rooms four to six add Ear Training to the shuffled clue order and require four digits',()=>{
 const permutations=new Set();
 const headphonePositions=new Set();
 for(let seed=0;seed<50;seed++){
  const rooms=C.generate(seed,{level:'N3'},D);
  const order=rooms[0].codeOrder;
  assert.deepEqual([...order].sort(),[0,1,2]);
  permutations.add(order.join(''));
  for (const [position,room] of rooms.entries()){
   if (position<3){
    assert.equal(room.earTraining,null);
    assert.deepEqual(room.codeOrder,order);
    assert.equal(room.code.length,3);
   } else {
    assert.equal(room.earTraining.slot,position-3);
    assert.equal(room.earTraining.seed,rooms[3].earTraining.seed);
    assert.equal(room.earTraining.digit,room.digits[3]);
    assert.deepEqual(room.codeOrder,rooms[3].codeOrder);
    assert.deepEqual(room.codeOrder.filter(index=>index!==3),order);
    assert.equal(room.code.length,4);
    assert(!C.answer(room,'exit',room.code.slice(0,3)));
    headphonePositions.add(room.codeOrder.indexOf(3));
   }
   assert.equal(room.code,room.codeOrder.map(i=>room.digits[i]).join(''));
   assert(C.answer(room,'exit',room.code));
   if(room.code!==room.digits.join(''))assert(!C.answer(room,'exit',room.digits.join('')));
  }
 }
 assert.equal(permutations.size,6);
 assert.deepEqual([...headphonePositions].sort(),[0,1,2,3]);
});

test('three mistakes accumulate across rooms and question types, survive restore and lock the adventure',()=>{
 let s=newState(28);const rooms=C.generate(s.seed,s.options,D);
 assert.equal(C.solve(s,rooms[0],'archive','wrong'),false);assert.equal(s.mistakes,1);
 assert(C.solve(s,rooms[0],'exit',rooms[0].code));assert(C.advance(s,rooms.length));
 assert.equal(C.solve(s,rooms[1],'mechanism',false),false);assert.equal(s.mistakes,2);
 s=C.restore(JSON.stringify(s),D);assert.equal(s.mistakes,2);
 C.restart(s);assert.equal(s.mistakes,2,'room restart must not erase the whole-game mistake count');
 assert.equal(C.solve(s,rooms[1],'recording','wrong'),false);assert.equal(s.mistakes,3);
 assert.equal(C.solve(s,rooms[1],'exit',rooms[1].code),false);assert.equal(C.advance(s,rooms.length),false);
 const fresh=newState(29);assert.equal(fresh.room,0);assert.equal(fresh.mistakes,0);assert.equal(fresh.elapsed,0);assert.deepEqual(fresh.solved,[]);
});
test('existing saves start the new rule at zero and invalid mistake counters are rejected',()=>{
 const s=newState();delete s.mistakes;assert.equal(C.restore(JSON.stringify(s),D).mistakes,0);
 for(const value of [-1,4,1.5,'2']){s.mistakes=value;assert.equal(C.restore(JSON.stringify(s),D),null);}
});

test('Selected Level Only keeps both Escape Room question types at the selected level',()=>{
 for(const level of C.levels){
  const options=C.settings({level,selectedLevelOnly:true});
  const rooms=C.generate(314159,options,D);
  assert.ok(rooms.every(room=>room.knowledge.level===level&&room.listening.level===level));
  assert.deepEqual(rooms.map(room=>room.literacy),C.generate(314159,{level},D).map(room=>room.literacy));
 }
});
