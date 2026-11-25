'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const vm=require('node:vm');
const activities=require('../../shared/classroom-activities.js');
const literacy=require('../../shared/classroom-literacy.js');

test('Music Literacy activities have a classroom entry point except Practice Questions',()=>{
 const root=path.resolve(__dirname,'../..');
 const read=file=>fs.readFileSync(path.join(root,file),'utf8');
 const home=read('index.html');
 const start=home.indexOf('const appData = ');
 const end=home.indexOf('const appCategories',start);
 const groups=vm.runInNewContext(home.slice(start,end)+'\nappData');
 const literacy=groups.filter(group=>['Pitch','Rhythm','Music Symbols','Practice'].includes(group.category))
  .flatMap(group=>group.apps.map(app=>app.href));
 for(const file of [...literacy,'scaledegrees.html','enharmonicequivalents.html']){
  const page=read(file);
  if(file==='practicequestions.html'){
   assert.equal(activities.isExercise('/'+file),false);
   assert.equal(activities.hostingDisabled('/'+file),true);
   continue;
  }
  if(/classroomPilotConfig=/.test(page))continue;
  assert.ok(activities.isExercise('/'+file),file);
  assert.ok(['quiz','race'].includes(activities.literacyHostMode('/'+file)),file);
  assert.match(page,/shared\/classroom-activities\.js/,file);
  assert.match(page,/exerciseRandom/,file);
 }
});

test('a classroom exercise retains its settings and uses one independent question stream per pupil',()=>{
 const activity='/chords.html?level=H&settings=teacher-snapshot';
 const url=activities.playUrl(activity,123);
 const query=new URL(url,'https://example.invalid').search;
 assert.equal(new URLSearchParams(query).get('settings'),'teacher-snapshot');
 const one=activities.exerciseRandom(query);
 const two=activities.exerciseRandom(query);
 for(let question=0;question<10;question++)assert.equal(one(),two());
 assert.notEqual(activities.exerciseRandom(query)(),activities.exerciseRandom('?classroomSeed=124')());
 assert.equal(activities.roundQuestionsFor('/chords.html'),10);
 assert.equal(activities.roundQuestionsFor('/rhythmidentification.html'),null);
 assert.equal(activities.settings('/metronome.html'),null);
});

test('race question pools retain selected written formats and replace audio-only selections',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../../shared/classroom-activities.js'),'utf8');
 const location={pathname:'/dynamics.html',search:'?classroomSeed=123&classroomRace=1'};
 const context={location,URL,URLSearchParams,MLH:{}};
 vm.runInNewContext(source,context);
 const pool=context.MLH.classroomActivities.raceQuestionTypes;
 const written=['definition','apply-score'];
 assert.deepEqual(Array.from(pool(['audio','definition'],written)),['definition']);
 assert.deepEqual(pool(['audio'],written),written);
 location.search='?classroomSeed=123';
 assert.deepEqual(pool(['audio'],written),['audio']);
});

test('scored literacy rounds use a topic-specific deck at every supported level',()=>{
 const levelsByRoute={
  intervals:['N3','N5','H','AH'],keysignatures:['N5','H','AH'],scaledegrees:['H'],
  chords:['N5','H','AH'],rhythmsums:['N3','N4','N5','H'],
  timesignatures:['N3','N4','N5','H','AH'],rests:['H'],dynamics:['N3','N4','N5'],
  articulationmarkings:['H'],repeatsigns:['N4','N5','H','AH'],
  enharmonicequivalents:['AH'],melodicdictation:['N4','N5','H','AH'],transposing:['H','AH'],
 };
 for(const [route,levels] of Object.entries(levelsByRoute))for(const level of levels){
  const path='/'+route+'.html?level='+level;
  const settings=literacy.settings(path);
  assert.equal(settings.level,level,path);
  const deck=literacy.questions(settings.options,50,activities.random(58));
  assert.equal(deck.length,Math.min(50,literacy.available(settings.options)),path);
  assert.equal(new Set(deck.map(({score})=>JSON.stringify([score.prompt,score.notation]))).size,deck.length,path);
  assert.ok(deck.length>=5,path);
  for(const q of deck){
   const answers=literacy.answers(q);
   assert.ok(q.score.prompt&&answers[q.pitch],path);
   assert.equal(new Set(answers.map(answer=>answer.label)).size,answers.length,path);
   assert.equal(q.score.correctAnswer,undefined,path);
  }
 }
 for(const path of ['/wordsearch.html','/rhythmsums.html?mode=order','/dynamics.html?mode=order']){
  assert.equal(literacy.settings(path),null,path);
  assert.equal(activities.settings(path).gameType,'shared',path);
 }
 assert.ok(literacy.settings('/accidentals.html?level=AH'));
});

test('Higher Key Signatures hosts Scale Degrees, matching the activity opened by the Hub',()=>{
 const alias=literacy.settings('/keysignatures.html?level=H');
 const direct=literacy.settings('/scaledegrees.html?level=H');
 assert.deepEqual(alias.options,direct.options);
});

test('customised literacy tasks stay in the original activity with the teacher snapshot',()=>{
 const activity='/chords.html?level=AH&settings=teacher-snapshot&classroomFormat=original';
 assert.equal(literacy.settings(activity),null);
 assert.equal(activities.settings(activity).activity,activity);
 const pupil=new URL(activities.playUrl(activity,123,10,true),'https://example.invalid');
 assert.equal(pupil.searchParams.get('settings'),'teacher-snapshot');
 assert.equal(pupil.searchParams.get('classroomSeed'),'123');
 assert.equal(pupil.searchParams.has('classroomFormat'),false);
});

test('a classroom checkpoint and its question stream survive reload and stay scoped to one round',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../../shared/classroom-activities.js'),'utf8');
 const memory=new Map();
 function reopen(start){
  const url=new URL(activities.playUrl('/barlines.html?level=N4',123,10,true,start),'https://example.invalid');
  const context={URL,URLSearchParams,location:url,MLH:{},addEventListener(){},queueMicrotask:fn=>fn(),
   sessionStorage:{getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)}};
  vm.runInNewContext(source,context);
  return context.MLH.classroomActivities;
 }
 const first=reopen(1000);
 first.progressStorage().write('pupil-score',4);
 const random=first.exerciseRandom('?classroomSeed=123&classroomRace=1&classroomProgress=1000-123');
 assert.equal(random(),activities.random(123)());
 const expected=random();
 const another=reopen(1001);
 assert.equal(another.progressStorage().read('pupil-score',0),0);
 const resumed=reopen(1000);
 assert.equal(resumed.progressStorage().read('pupil-score',0),4);
 assert.notEqual(resumed.exerciseRandom('?classroomSeed=123&classroomRace=1&classroomProgress=1000-123')(),expected);
});

test('Accidentals uses its notation exercise when the teacher selects audio or score-placement questions',()=>{
 const accidentals=require('../../shared/classroom-accidentals.js');
 const launch=enabledQuestionTypes=>'/accidentals.html?level=N5&settings='+Buffer.from(JSON.stringify({
  version:2,activity:'accidentals.html',state:{enabledQuestionTypes,enabledAccidentals:['flat']},
 })).toString('base64url');
 assert.equal(accidentals.settings(launch(['audio-two','apply-score'])),null);
 assert.deepEqual(accidentals.settings(launch(['multiple-choice'])).options.enabledAccidentals,['flat']);
});

test('classroom Accidentals applies the same Bravura glyph style as individual practice',()=>{
 const root=path.resolve(__dirname,'../..');
 const read=file=>fs.readFileSync(path.join(root,file),'utf8');
 const glyphStyle=page=>read(page).match(/\.music-symbol\s*\{([^}]+)\}/)?.[1].trim();
 const practiceStyle=glyphStyle('accidentals.html');
 assert.match(practiceStyle,/font-family:\s*"Bravura"/);
 assert.equal(glyphStyle('host.html'),practiceStyle);
 assert.ok(fs.existsSync(path.join(root,'fonts/Bravura.otf')));
});
