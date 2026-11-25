'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Hub = require('../shared/hub-collections');
const Games = require('../shared/music-games-collections');
const Medals = require('../shared/music-games-medals');
const Escape = require('../music-escape/core');
const EscapeContent = require('../music-escape/content');
const Millionaire = require('../whowantstobemillionaire/millionaire-core');
const questionBank = require('../whowantstobemillionaire/millionaire-concept-questions').questions;
function storage() {
 const values = new Map();
 return {getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value)};
}
const styleIds = ['MC-0001','MC-0002','MC-0003','MC-0069','MC-0070','MC-0074','MC-0076','MC-0150','MC-0151','MC-0221'];

test('each activity resolves the same saved collection and its subsequent edits', () => {
 const db = storage();
 const row = Hub.save({name:' Listening ', concepts:[...styleIds, 'MC-0001','bogus']}, db);
 assert.equal(row.name, 'Listening');
 assert.deepEqual(row.concepts, styleIds);
 for (const app of Object.keys(Hub.applications)) {
  const url = new URL(Hub.launch(app, row, 'H'), 'https://hub.test');
  assert(fs.existsSync('.'+url.pathname), url.pathname);
  assert.deepEqual(Hub.selected(url.search,db), row);
 }
 Hub.save({...row,name:'A new name'}, db);
 assert.equal(Hub.selected('?myCollection='+row.id,db).name, 'A new name');
 Hub.remove(row.id, db);
 assert.equal(Hub.selected('?myCollection='+row.id,db), null);
});

test('built-in collections launch in every activity without adding saved copies', () => {
 const db = storage();
 const row = {id:'jazz-popular-music',name:'Jazz and Popular Music',concepts:styleIds,builtIn:true};
 for (const app of Object.keys(Hub.applications)) {
  const url = new URL(Hub.launch(app,row,'H'),'https://hub.test');
  assert.equal(url.searchParams.get('level'),'H');
  if (app === 'quizzes') assert.equal(url.searchParams.get('group'),row.id);
  else assert.deepEqual(Hub.selected(url.search,db),{id:row.id,name:row.name,concepts:styleIds});
 }
 assert.deepEqual(Hub.list(db),[]);
});

test('unplayable legacy word puzzle links return to the catalogue', () => {
 const source=fs.readFileSync(require.resolve('../shared/hub-collections'),'utf8');
 for(const concepts of [['MC-9999'],styleIds.slice(0,3),styleIds]){
  const row={id:'legacy-style',name:'Legacy styles',concepts};
  const url=new URL(Hub.launch('crossword',{...row,builtIn:true},'H'),'https://hub.test');
  const redirects=[];
  const window={
   location:{href:url.href,search:url.search,replace:href=>redirects.push(href)},
   localStorage:storage(),
   MLHGameConcepts:Games.data,
   MLHGameCollections:Games,
  };
  vm.runInNewContext(source,{window,document:{baseURI:'https://hub.test/'},URL,URLSearchParams});
  assert.deepEqual(redirects,concepts.length>=5?[]:['https://hub.test/mycollections.html?app=crossword&level=H&collectionUnavailable=1']);
 }
});

test('activity menus include compatible Hub and saved collections with their launch levels', () => {
 const catalogue=require('../music-dictionary/quiz-collections');
 const dictionary=require('../music-dictionary/music-concepts-data');
 const personal=[{id:'styles',name:'Style review',concepts:styleIds},{id:'short',name:'Short',concepts:styleIds.slice(0,2)}];
 const compatible=row=>!Games.sharedAvailability(row,'crossword');
 const rows=Hub.menuRows('crossword','N3',catalogue,dictionary,compatible,personal);
 assert(rows.hub.length>0);
 assert(!rows.hub.some(row=>row.qualification));
 assert(!rows.hub.some(row=>row.id==='articulation'));
 assert(rows.hub.every(row=>row.builtIn&&row.launchLevel==='N3'));
 assert.deepEqual(rows.personal.map(row=>[row.id,row.launchLevel]),[['styles','H']]);
 assert.equal(new URL(Hub.launch('crossword',rows.personal[0],'H'),'https://hub.test').searchParams.get('myCollection'),'styles');
});

test('collection links preserve their scope, including legacy All Concepts links', () => {
 const db=storage(), origin='https://hub.test';
 const catalogue=require('../music-dictionary/quiz-collections');
 const dictionary=require('../music-dictionary/music-concepts-data');
 const rows=Hub.menuRows('charades','ALL',catalogue,dictionary,()=>true,[]);
 assert(!rows.hub.some(row=>row.qualification));
 const allGroup=catalogue.groupsForLevel('ALL').find(row=>row.id==='all-concepts');
 const all={id:allGroup.id,name:allGroup.label,concepts:allGroup.conceptIds,builtIn:true,level:'ALL'};
 const launch=new URL(Hub.launch('charades',all,'AH'),origin);
 assert.equal(launch.searchParams.get('level'),'AH');
 assert.equal(Hub.selected(launch.search,db).concepts.length,allGroup.conceptIds.length);
 assert.deepEqual(Hub.menuSelection('charades',launch.search,'AH',db),{scope:'ALL',id:'all-concepts',builtIn:true});
 const articulation=Hub.menuRows('charades','N3',catalogue,dictionary,()=>true,[]).hub.find(row=>row.id==='articulation');
 const builtIn=new URL(Hub.launch('charades',articulation,articulation.launchLevel),origin);
 assert.deepEqual(Hub.menuSelection('charades',builtIn.search,'N5',db),{scope:'N3',id:'articulation',builtIn:true});
 assert.equal(Object.hasOwn(Hub.applications,'recall'),false);
 assert.throws(()=>Hub.launch('recall',articulation,articulation.launchLevel),/Choose an activity/);
 assert.equal(Games.sharedAvailability(articulation,'recall'),'This activity does not support collections');
 const quiz=new URL(Hub.launch('quizzes',all,'AH'),origin);
 assert.equal(quiz.searchParams.get('level'),'ALL');
 assert.deepEqual(Hub.menuSelection('quizzes',quiz.search,'ALL',db),{scope:'ALL',id:'all-concepts',builtIn:true});
 const saved=Hub.save({id:'articulation',name:'My articulation',concepts:articulation.concepts},db);
 const personal=new URL(Hub.launch('charades',saved,'N3'),origin);
 assert.deepEqual(Hub.menuSelection('charades',personal.search,'N3',db),{scope:'N3',id:'articulation',builtIn:false});
});

test('word puzzle menus launch the level-specific Hub Music Literacy collection', () => {
 const catalogue=require('../music-dictionary/quiz-collections');
 const dictionary=require('../music-dictionary/music-concepts-data');
 for(const app of ['crossword','wordsearch']){
  const {hub}=Hub.menuRows(app,'AH',catalogue,dictionary,()=>true,[],Games);
  const row=hub.find(item=>item.id==='music-literacy-ah');
  const url=new URL(Hub.launch(app,row,row.launchLevel),'https://hub.test');
  assert.equal(row.name,'Advanced Higher – Music Literacy');
  assert.equal(url.search,'?level=AH&literacy=level');
  assert.deepEqual(Hub.menuSelection(app,url.search,'AH',storage()),{scope:'AH',id:row.id,builtIn:true});
 }
});

test('shared links carry a portable snapshot while launch links stay tied to the saved collection', () => {
 const owner = storage(), recipient = storage();
 const concepts = require('../music-dictionary/music-concepts-data').concepts.map(concept=>concept.id);
 const row = Hub.save({name:'Course review',concepts},owner);
 const launch = new URL(Hub.launch('charades',row,'AH'),'https://hub.test');
 const share = new URL(Hub.shareUrl(launch.href,owner));
 assert(share.href.length<1500);
 assert.equal(share.searchParams.has('myCollection'),false);
 assert.deepEqual(Hub.selected(share.search,recipient),row);
 assert.deepEqual(Hub.selected('?builtInCollection='+encodeURIComponent(JSON.stringify(row)),recipient),row);
 Hub.save({...row,name:'Updated review'},owner);
 assert.equal(Hub.selected(launch.search,owner).name,'Updated review');
 assert.equal(Hub.selected(share.search,recipient).name,'Course review');
});

test('saved collection detail links can be copied to a browser with an empty collection library', () => {
 const owner = storage(), recipient = storage();
 const row = Hub.save({name:'Strings & rhythm', concepts:[styleIds[0], Games.literacyConcepts('N5')[0].id]},owner);
 const detail = new URL(Hub.pageUrl('charades','N5',row),'https://hub.test');
 const copy = new URL(Hub.shareUrl(detail.href,owner));
 assert.equal(copy.pathname,'/mycollections.html');
 assert.equal(copy.searchParams.has('savedCollection'),false);
 assert.equal(copy.searchParams.get('app'),'charades');
 assert.equal(copy.searchParams.get('level'),'N5');
 assert.deepEqual(Hub.selected(copy.search,recipient),row);
 assert.deepEqual(Hub.list(recipient),[]);
 const launch = new URL(Hub.launch('charades',row,'N5',{includeSnapshot:true}),'https://hub.test');
 assert.deepEqual(Hub.selected(launch.search,recipient),row);
 Hub.save({...row, name:'Updated collection'},owner);
 assert.equal(Hub.selected(launch.search,owner).name,'Updated collection');
});

test('saved Music Literacy terms can be played alone or alongside music concepts', () => {
 const db = storage();
 const literacy = Games.literacyConcepts('AH').slice(0,6);
 const ids = literacy.map(concept => concept.id);
 const source = fs.readFileSync(require.resolve('../shared/hub-collections'),'utf8');
 const catalogue = require('../music-dictionary/quiz-collections');
 const dictionary = require('../music-dictionary/music-concepts-data');
 for (const concepts of [ids, [ids[0], styleIds[0], ...ids.slice(1)]]) {
  const row = Hub.save({name:'Literacy review',concepts},db);
  assert.deepEqual(Hub.list(db).at(-1),row);
  assert.equal(Games.sharedAvailability(row,'charades'),'');
  assert.equal(Boolean(Games.sharedAvailability(row,'quizzes')),concepts === ids);
  for (const app of ['crossword','wordsearch']) {
   const compatible = item => !Games.sharedAvailability(item,app);
   const menuRow = Hub.menuRows(app,'N3',catalogue,dictionary,compatible,[row],Games).personal[0];
   assert.equal(menuRow.launchLevel,'AH');
   const launch = new URL(Hub.launch(app,menuRow,menuRow.launchLevel),'https://hub.test');
   const share = new URL(Hub.shareUrl(launch.href,db));
   const recipient = storage();
   assert.deepEqual(Hub.selected(share.search,recipient),row);
   const window = {
    location:{href:share.href,search:share.search,replace:href=>assert.fail('Unexpected redirect to '+href)},
    localStorage:recipient,
    MLHGameConcepts:Games.data,
    MLHGameCollections:Games,
   };
   vm.runInNewContext(source,{window,document:{baseURI:'https://hub.test/'},URL,URLSearchParams});
   const activity = Games.sharedConceptActivity(row,'AH',app,pool=>pool);
   assert.deepEqual(activity.sourceConceptIds,concepts);
   assert.equal(activity.items[0].prompt,literacy[0].definition);
   assert.equal(activity.items[0].answer,literacy[0].word);
   assert(!Medals.eligible(app,activity));
  }
 }
 const mixed = Hub.list(db).at(-1);
 const quizRows = Hub.list(db).map(row => ({...row,sharedId:row.id}));
 Hub.updateQuizRows(quizRows,quizRows.map(row => row.sharedId === mixed.id
  ? {...row,name:'Updated from the quiz editor',concepts:[styleIds[1]]} : row),db);
 assert.deepEqual(Hub.list(db).at(-1),{id:mixed.id,name:'Updated from the quiz editor',concepts:[styleIds[1],...ids]});
});

test('game availability and generation agree across the entire Hub catalogue', () => {
 const catalogue = require('../music-dictionary/quiz-collections');
 for(const level of [...Games.data.codes,'ALL'])for(const group of catalogue.groupsForLevel(level)){
  const row={id:group.id,name:group.label,concepts:group.conceptIds};
  for(const [app,template] of [['sort','group-sort'],['wordsearch','wordsearch'],['crossword','crossword']]){
   const build=()=>Games.sharedConceptActivity(row,level==='ALL'?'AH':level,template,items=>items);
   if(Games.sharedAvailability(row,app))assert.throws(build);
   else assert(build().sourceConceptIds.every(id=>row.concepts.includes(id)));
  }
  if(!Games.sharedAvailability(row,'escape')){
   const rooms=Escape.generate(47,{level},EscapeContent,row.concepts);
   assert(rooms.flatMap(room=>Object.values(room.collectionQuestions)).every(question=>row.concepts.includes(question.conceptId)));
  }
 }
 const excluded={concepts:['MC-0278','MC-0279']};
 for(const app of ['sort','wordsearch','charades','escape'])assert(Games.sharedAvailability(excluded,app));
 const twice={id:'subject',name:'Subject',concepts:['MC-0255','MC-0296']};
 assert(Games.sharedAvailability(twice,'sort'));
 assert.throws(()=>Games.sharedConceptActivity(twice,'AH','group-sort'),/two distinct/);
});

test('legacy collections import once and quiz edits keep identifiers stable', () => {
 const db = storage();
 db.setItem('mlh-dictionary-quiz-groups-v1', JSON.stringify([{name:'Class quiz',concepts:styleIds}]));
 const activity = {id:'sort-one',title:'Class sort',template:'group-sort',tags:['user-collection'],sourceConceptIds:styleIds};
 Hub.importQuizzes(db);
 Hub.importActivities([activity],db);
 const quiz = {...Hub.list(db)[0],sharedId:'quiz-0'};
 Hub.updateQuizRows([quiz],[{...quiz,name:'New quiz'}],db);
 Hub.importQuizzes(db);
 assert.equal(Hub.selected('?myCollection=quiz-0',db).name,'New quiz');
 assert.equal(Hub.selected('?myCollection=game-sort-one',db).name,'Class sort');
 Hub.remove('quiz-0',db);
 Hub.importQuizzes(db);
 assert.deepEqual(Hub.list(db).map(item=>item.id), ['game-sort-one']);
});

test('Sort and Word Search rounds use only saved concepts and never earn medals', () => {
 const row = {id:'collection',name:'Styles',concepts:styleIds};
 for (const mode of ['group-sort','wordsearch']) {
  const activity = Games.sharedConceptActivity(row,'H',mode);
  assert(activity.items.every(item=>styleIds.includes(item.sourceConceptId)));
  assert(!Medals.eligible(mode,activity));
  if(mode==='group-sort')assert(activity.items.every(item=>item.prompt!==item.group));
 }
 assert.throws(()=>Games.sharedConceptActivity({...row,concepts:styleIds.slice(0,4)},'N3','wordsearch'),/between 5 and 15/);
});

test('Escape Room fills every clue object with questions from the saved collection', () => {
 const options = {level:'H'};
 const rooms = Escape.generate(47,options,EscapeContent,styleIds);
 assert.deepEqual(rooms, Escape.generate(47,options,EscapeContent,styleIds));
 const questions = rooms.flatMap(room => Object.values(room.collectionQuestions));
 assert.equal(questions.length,21);
 assert.equal(new Set(questions.map(question => question.questionId)).size,21);
 assert(questions.every(question => styleIds.includes(question.conceptId)));
 assert(questions.some(question => question.src));
 for (const room of rooms) {
  assert.equal(room.literacy,undefined);
  assert.equal(room.earTraining,undefined);
  assert.deepEqual(Object.keys(room.collectionQuestions),Escape.clueObjects.slice(0,room.digits.length));
  for (const [key, question] of Object.entries(room.collectionQuestions)) {
   assert(room.sceneOrder.includes(key));
   assert(Escape.answer(room,key,question.correctOptionIds[0]));
   assert(!Escape.answer(room,key,'missing'));
  }
  assert(Escape.answer(room,'exit',room.code));
 }
});

test('Escape Room fills a small collection with concept questions even without reviewed questions or audio', () => {
 const silent = EscapeContent.concepts.find(concept =>
  !EscapeContent.audio.some(question => question.conceptId === concept.id) &&
  !EscapeContent.knowledge.some(question => question.conceptId === concept.id));
 const rooms = Escape.generate(47,{level:'H'},EscapeContent,[silent.id]);
 const questions = rooms.flatMap(room => Object.values(room.collectionQuestions));
 assert.equal(questions.length,21);
 assert(questions.every(question => question.conceptId === silent.id &&
  question.prompt === silent.definition && question.options.length === 4 && !question.src));
});

test('Millionaire keeps the 15-stage ladder and draws distinct eligible questions from the collection', () => {
 const {questions, variants} = Millionaire.composeCollectionGame(questionBank,styleIds,()=>.57);
 assert.equal(questions.length,15);
 assert.equal(variants.length,15);
 assert(questions.every(question=>styleIds.includes(question.conceptId)));
 assert.equal(new Set(questions.map(Millionaire.questionFingerprint)).size,15);
 assert.equal(new Set(questions.map(question=>question.sourceQuestionId)).size,15);
 assert.throws(()=>Millionaire.composeCollectionGame(questionBank,['MC-0001']),/15 different questions/);
});

test('Millionaire collection games can fill every stage with audio questions', () => {
 const conceptId = 'MC-0001';
 const listening = [...new Map(questionBank.filter(Millionaire.isListeningQuestion)
  .map(question=>[Millionaire.questionFingerprint(question),{...question,conceptId}])).values()].slice(0,16);
 assert.equal(listening.length,16);
 const exactlyFifteen = listening.slice(0,15);
 assert(Millionaire.canComposeCollectionGame(exactlyFifteen,[conceptId]));
 assert(!Millionaire.canComposeCollectionGame([...listening.slice(0,14),{...listening[0],id:'duplicate'}],[conceptId]));
 const full = Millionaire.composeCollectionGame(exactlyFifteen,[conceptId],()=>.57);
 assert.equal(full.questions.length,15);
 assert(full.questions.every(Millionaire.isListeningQuestion));
 assert(full.variants.every(variants=>!variants.length));
 const withReplacement = Millionaire.composeCollectionGame(listening,[conceptId],()=>.57);
 const firstStageReplacement = withReplacement.variants[0][0];
 assert(Millionaire.isListeningQuestion(firstStageReplacement));
 assert(!withReplacement.questions.some(question=>
  Millionaire.questionFingerprint(question)===Millionaire.questionFingerprint(firstStageReplacement)));
});
