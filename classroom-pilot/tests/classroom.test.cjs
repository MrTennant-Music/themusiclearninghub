const {test}=require('node:test'),assert=require('node:assert/strict');
const {deflateSync}=require('node:zlib');
const {handler}=require('../functions/classroom.js');
const vars=['CLASSROOM_ENABLED','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'];
function env(){Object.assign(process.env,{CLASSROOM_ENABLED:'true',SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-server-secret'});}
test('Connections and Practice Questions links cannot create a classroom room',async()=>{
 env();
 try{
  for(const activity of ['/connections.html?level=N3#playnote=fixture','/practicequestions.html?level=N3']){
   const response=await handler({httpMethod:'POST',body:JSON.stringify({action:'create',gameType:'activity-race',activity})});
   assert.equal(response.statusCode,400);
   assert.match(JSON.parse(response.body).error,/Individual Practice/);
  }
 }finally{vars.forEach(key=>delete process.env[key]);}
});
test('Music Literacy creates native streak Race rooms and listening Quiz rooms',async()=>{
 env();
 const original=global.fetch;
 let request;
 global.fetch=async (_url,{body})=>{
  request=JSON.parse(body);
  return {ok:true,json:async()=>({phase:'lobby'})};
 };
 const post=body=>handler({httpMethod:'POST',body:JSON.stringify(body)});
 try{
  for(const route of ['accidentals','articulationmarkings','barlines','chords','dynamics','intervals','keyboardnoteidentification','keysignatures','noteidentification','readingrhythms','rests','rhythmidentification','rhythmsums','timesignatures','transposing']){
   const activity='/'+route+'.html'+(route==='chords'?'?level=H':'');
   assert.equal((await post({action:'create',activity,gameType:'race',nativeStreak:true,targetStreak:5,raceMinutes:1})).statusCode,200,activity);
   assert.equal(request.p_data.gameType,'activity-race',activity);
   assert.equal(request.p_data.nativeStreak,true,activity);
   assert.equal(request.p_data.targetStreak,5,activity);
   assert.equal(request.p_data.questions,undefined,activity);
  }
  for(const route of ['melodicdictation','rhythmicdictation','followthescore','repeatsigns']){
   const activity='/'+route+'.html?level='+ (route==='rhythmicdictation'?'N4':'N5');
   assert.equal((await post({action:'create',activity,gameType:'race',nativeStreak:true,targetStreak:5,raceMinutes:0})).statusCode,400,activity);
   assert.equal((await post({action:'create',activity,gameType:'quiz',literacyQuiz:true,count:5})).statusCode,200,activity);
   assert.equal(request.p_data.gameType,'quiz',activity);
   assert.ok(request.p_data.questions.every(question=>question.score.audio),activity);
  }
  const chordSettings=Buffer.from(JSON.stringify({version:2,activity:'chords.html',state:{
   n5Customise:{chordProgression:true,identifyChord:false},
  }})).toString('base64url');
  assert.equal((await post({action:'create',activity:'/chords.html?level=N5&settings='+chordSettings,gameType:'quiz',literacyQuiz:true,count:5})).statusCode,200);
  assert.ok(request.p_data.questions.every(question=>question.score.prompt.includes('Which chord sequence')&&question.score.audio));
  const advancedChords=ahCustomise=>'/chords.html?level=AH&settings='+Buffer.from(JSON.stringify({
   version:2,activity:'chords.html',state:{ahCustomise},
  })).toString('base64url');
  const mixed=advancedChords({identifyChords:true,insertPosition:true,createBassLine:true});
  assert.equal((await post({action:'create',activity:mixed,gameType:'quiz',literacyQuiz:true,count:50})).statusCode,200);
  assert.equal(request.p_action,'create-listening');
  assert.ok(request.p_data.questions.some(question=>question.score.audio));
  assert.ok(request.p_data.questions.some(question=>question.score.notation));
  assert.ok(request.p_data.allowedAnswers.includes('literacy-choice:0'));
  assert.ok(request.p_data.allowedAnswers.includes('listening-choice:0'));
  assert.equal((await post({action:'create',activity:mixed,gameType:'race',nativeStreak:true,targetStreak:5,raceMinutes:0})).statusCode,200);
  assert.equal(request.p_data.nativeStreak,true);
  const written=advancedChords({identifyChords:false,insertPosition:false,createBassLine:true});
  assert.equal((await post({action:'create',activity:written,gameType:'quiz',literacyQuiz:true,count:5})).statusCode,200);
  assert.equal(request.p_action,'create');
  assert.ok(request.p_data.questions.every(question=>question.score.notation?.kind==='ahBassPrompt'&&!question.score.audio));
  const progress={action:'finish',pin:'123456',token:'a'.repeat(64),attempted:2,streak:0,highestStreak:1};
  assert.equal((await post(progress)).statusCode,200);
  assert.deepEqual(request.p_data,{attempted:2,streak:0,highestStreak:1});
  assert.equal((await post({...progress,highestStreak:3})).statusCode,400);
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});
test('Host worksheet availability follows the activity and preserves the individual header choice',async()=>{
 const shared=require('../../shared/classroom-activities.js');
 const chordsProfile=Buffer.from(JSON.stringify({version:2,activity:'chords.html',state:{
  ahCustomise:{identifyChords:true,insertPosition:false,createBassLine:false},
 }})).toString('base64url');
 for(const [activity,expected] of [
  ['/musicescape.html?level=N3',false],['/wordsearch.html?level=N5',true],
  ['/chords.html?level=H',false],['/chords.html?level=N5',true],
  ['/chords.html?level=AH&settings='+chordsProfile,false],
  ['/melodicdictation.html?level=N3',true],['/melodicdictation.html?level=N5',false],
  ['/rhythmsums.html?mode=order',false],['/dynamics.html',true],
 ])assert.equal(shared.worksheetAvailable(activity),expected,activity);
 env();
 const original=global.fetch;
 let room;
 global.fetch=async (_url,{body})=>{
  room=JSON.parse(body).p_data;
  return {ok:true,json:async()=>room};
 };
 try{
  for(const worksheetAvailable of [false,true]){
   const result=await handler({httpMethod:'POST',body:JSON.stringify({
    action:'create',activity:'/chords.html?level=N5',gameType:'activity-race',worksheetAvailable,
   })});
   assert.equal(result.statusCode,200);
   assert.equal(room.worksheetAvailable,worksheetAvailable);
  }
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});
test('Millionaire can give each pupil a stable question seed from the same activity settings',async()=>{
 env();
 const original=global.fetch;
 const activity='/whowantstobemillionaire/whowantstobeamillionaire.html?level=N3&settings=selected-pool';
 let room;
 global.fetch=async (_url,{body})=>{
  const request=JSON.parse(body);
  if(request.p_action==='create')room={...request.p_data,seed:123456};
  return {ok:true,json:async()=>({...room,host:request.p_action==='create'})};
 };
 const send=async data=>JSON.parse((await handler({httpMethod:'POST',body:JSON.stringify(data)})).body);
 const setup={action:'create',activity,gameType:'activity-race'};
 const pupil=(token,action='read')=>send({action,pin:'123456',token});
 try{
  assert.equal((await send(setup)).randomiseQuestions,undefined);
  assert.equal((await pupil('a'.repeat(64))).seed,(await pupil('b'.repeat(64))).seed);
  const host=await send({...setup,randomiseQuestions:true});
  assert.equal(host.randomiseQuestions,true);
  const first=await pupil('a'.repeat(64),'join');
  assert.equal(first.activity,activity);
  assert.equal(first.seed,(await pupil('a'.repeat(64))).seed);
  assert.notEqual(first.seed,(await pupil('b'.repeat(64))).seed);
  assert.notEqual(first.seed,host.seed);
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});
test('Concept Recall hosts the selected categories in a completion Race',async()=>{
 env();
 const original=global.fetch;
 let rpc;
 global.fetch=async (_url,options)=>{
  rpc=JSON.parse(options.body);
  return {ok:true,json:async()=>({phase:'lobby'})};
 };
 try{
  const activity='/conceptrecall.html?'+new URLSearchParams({level:'H',hints:'1',categories:JSON.stringify(['Ornaments'])});
  const result=await handler({httpMethod:'POST',body:JSON.stringify({action:'create',activity,gameType:'race'})});
  assert.equal(result.statusCode,200);
  assert.equal(rpc.p_data.activity,activity);
  assert.equal(rpc.p_data.gameType,'activity-race');
  assert.equal(rpc.p_data.targetCorrect,null);
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});
test('native Concept Recall uses the actual category total and validates the optional time limit',async()=>{
 env();
 const original=global.fetch;
 let rpc;
 global.fetch=async (_url,{body})=>{
  rpc=JSON.parse(body);
  return {ok:true,json:async()=>({phase:'lobby'})};
 };
 const activity='/conceptrecall.html?'+new URLSearchParams({level:'N5',categories:JSON.stringify(['Ornaments'])});
 const create=recallMinutes=>handler({httpMethod:'POST',body:JSON.stringify({action:'create',activity,gameType:'activity-race',recallMinutes})});
 try{
  assert.equal((await create(1)).statusCode,200);
  assert.equal(rpc.p_data.recallMinutes,1);
  const core=require('../../concept-recall-core.js'),{QUESTIONS}=require('../../concept-recall-data.js');
  assert.equal(rpc.p_data.targetCorrect,core.questionsForSetup(QUESTIONS,'N5',['Ornaments']).length);
  assert.ok(rpc.p_data.targetCorrect>0);
  assert.equal((await create(0)).statusCode,200);
  assert.equal(rpc.p_data.recallMinutes,0);
  assert.equal((await create(11)).statusCode,400);
  assert.equal((await create(1.5)).statusCode,400);
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});
test('practice-page races keep the teacher URL at every supported level',async()=>{
 env();
 const original=global.fetch;
 let request;
 global.fetch=async (_url,options)=>{
  request=JSON.parse(options.body);
  return {ok:true,json:async()=>({phase:'lobby'})};
 };
 const levels=['N3','N4','N5','H','AH'];
 const routes={
  keyboardnoteidentification:levels,noteidentification:levels,
  accidentals:['N5'],enharmonicequivalents:['AH'],chords:['N5','AH'],keysignatures:['N5','AH'],
  articulationmarkings:['N5','H','AH'],dynamics:levels,
  barlines:levels,intervals:['N3','N4','N5','H'],rests:levels,
  rhythmsums:levels,scaledegrees:['H'],timesignatures:levels,transposing:['H','AH'],
  dominoes:levels,
 };
 try{
  for(const [route,qualifications] of Object.entries(routes))for(const level of qualifications){
   const activity=`/${route}.html?level=${level}`;
   const result=await handler({httpMethod:'POST',body:JSON.stringify({action:'create',activity,gameType:'activity-race'})});
   assert.equal(result.statusCode,200,activity);
   assert.equal(request.p_action,'create',activity);
   assert.equal(request.p_data.gameType,'activity-race',activity);
   assert.equal(request.p_data.activity,activity);
   assert.equal(request.p_data.targetCorrect,route==='dominoes'?null:10,activity);
   assert.equal(request.p_data.questions,undefined,activity);
  }
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});
test('Concept Quizzes keep the collection and formats and mark the submitted answer against the shared question',async()=>{
 env();
 const original=global.fetch;
 let question,phase='question';
 const requests=[];
 global.fetch=async (_url,options)=>{
  const rpc=JSON.parse(options.body);requests.push(rpc);
  if(rpc.p_action==='create-concept-quiz')return {ok:true,json:async()=>({phase:'lobby'})};
  return {ok:true,json:async()=>({phase,host:false,index:0,question})};
 };
 const post=data=>handler({httpMethod:'POST',body:JSON.stringify({pin:'123456',token:'a'.repeat(64),...data})});
 try{
  const activity='/conceptquiz.html?level=N5&sharedQuiz=1&ids=1&audio=0&formats=short-answer';
  for(const gameType of ['race','activity-race']){
   const result=await post({action:'create',activity,gameType});
   assert.equal(result.statusCode,400);
   assert.equal(JSON.parse(result.body).error,'Concept Quizzes use Quiz mode.');
  }
  assert.equal((await post({action:'create',activity,gameType:'quiz',count:1})).statusCode,200);
  const {p_data:room}=requests.at(-1);
  assert.equal(room.activity,activity);
  assert.equal(room.gameType,'quiz');
  assert.equal(room.questionTime,20);
  [question]=room.questions;
  assert.equal(question.score.quiz.format,'short-answer');
  assert.equal(question.score.audio,undefined);
  assert.equal(question.score.quiz.answer.canonical,'Blues');
  const live=JSON.parse((await post({action:'read'})).body);
  assert.deepEqual(live.question.score.quiz.answer.acceptedVariants,[]);
  assert.equal(live.question.score.quiz.feedback,undefined);
  phase='listening';
  assert.equal((await post({action:'answer',response:'The blues',index:0})).statusCode,400);
  assert.equal(requests.at(-1).p_action,'read');
  phase='question';
  assert.equal((await post({action:'answer',response:'The blues',index:0})).statusCode,200);
  assert.deepEqual(requests.at(-1).p_data,{questionId:question.score.quiz.id,response:'The blues',fraction:1,index:0});
  assert.equal((await post({action:'answer',response:'Jazz',index:1})).statusCode,400);
  phase='review';
  const revealed=JSON.parse((await post({action:'read'})).body);
  assert.equal(revealed.question.score.quiz.answer.canonical,'Blues');
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});
test('pilot fails closed before any Supabase request',async()=>{
 delete process.env.CLASSROOM_ENABLED;
 assert.equal((await handler({httpMethod:'POST',body:'{"action":"check"}'})).statusCode,503);
});
test('room control still requires a session token',async()=>{
 env();assert.equal((await handler({httpMethod:'POST',body:'{"action":"start","pin":"123456"}'})).statusCode,400);
});
test('nickname actions send only validated values to the room service',async()=>{
 env();
 const original=global.fetch;
 const requests=[];
 global.fetch=async (_url,options)=>{
  requests.push(JSON.parse(options.body));
  return {ok:true,json:async()=>({phase:'lobby'})};
 };
 const send=(action,extra)=>handler({httpMethod:'POST',body:JSON.stringify({action,pin:'123456',token:'a'.repeat(64),...extra})});
 try{
  assert.equal((await send('nicknames',{allowNicknames:'true'})).statusCode,400);
  assert.equal((await send('rename',{name:'  '})).statusCode,400);
  assert.equal((await send('rename',{name:'X'.repeat(21)})).statusCode,400);
  assert.equal((await send('rename',{name:'Music Cat'})).statusCode,400);
  assert.equal((await send('nicknames',{allowNicknames:true})).statusCode,200);
  assert.equal((await send('rename',{name:'X'.repeat(20)})).statusCode,200);
  assert.deepEqual(requests.map(({p_action,p_data})=>[p_action,p_data]),[
   ['nicknames',{allowNicknames:true}],['rename',{name:'X'.repeat(20)}],
  ]);
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});
test('Accidentals creates a single notation deck for Quiz and Race and withholds the answer until reveal',async()=>{
 env();
 const original=global.fetch;
 let deck,request;
 const settings=Buffer.from(JSON.stringify({version:2,activity:'accidentals.html',state:{enabledAccidentals:['flat'],enabledQuestionTypes:['multiple-choice'],showNoteNames:true}})).toString('base64url');
 const activity='/accidentals.html?level=N5&settings='+settings;
 const send=async body=>handler({httpMethod:'POST',body:JSON.stringify(body)});
 global.fetch=async (_url,options)=>{
  request=JSON.parse(options.body);
  if(request.p_action==='create'){
   deck=request.p_data;
   return {ok:true,json:async()=>({phase:'lobby'})};
  }
  const phase=request.p_action==='read'?'question':'review';
  return {ok:true,json:async()=>({phase,question:{...deck.questions[0]}})};
 };
 try{
  for(const gameType of ['quiz','race']){
   assert.equal((await send({action:'create',gameType,activity,count:5,targetStreak:3})).statusCode,200);
   assert.equal(deck.gameType,gameType);
   assert.equal(deck.sharedSequence,gameType==='race');
   assert.equal(deck.questions.length,gameType==='race'?50:5);
   assert.deepEqual(deck.options,{enabledAccidentals:['flat'],showNoteNames:true});
   for(const {pitch,score} of deck.questions){
    assert.ok(score.choices[pitch]);
    assert.equal(score.answerId,undefined);
    assert.ok(score.bars.some(bar=>bar.notes.some(note=>note.highlight)));
   }
   const identity={pin:'123456',token:'a'.repeat(64)};
   const live=JSON.parse((await send({...identity,action:'read'})).body);
   assert.equal(live.question.pitch,undefined);
   const index=deck.questions[0].pitch;
   const reviewed=JSON.parse((await send({...identity,action:'answer',answer:'accidental-choice:'+index,index:0})).body);
   assert.equal(request.p_data.pitch,index);
   assert.equal(reviewed.question.pitch,index);
  }
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});
test('a full Accidentals profile mixes the selected Quiz formats and keeps Streak Race written',async()=>{
 env();
 const original=global.fetch;
 let payload;
 const settings=Buffer.from(JSON.stringify({version:2,activity:'accidentals.html',state:{
  enabledAccidentals:['sharp','flat','natural'],
  enabledQuestionTypes:['multiple-choice','apply-score','audio-two','audio-full'],
  showNoteNames:true,
 }})).toString('base64url');
 const activity='/accidentals.html?level=N5&settings='+settings;
 global.fetch=async (_url,options)=>{
  payload=JSON.parse(options.body);
  return {ok:true,json:async()=>({phase:'lobby'})};
 };
 const create=setup=>handler({httpMethod:'POST',body:JSON.stringify({action:'create',activity,...setup})});
 try{
  assert.equal((await create({gameType:'quiz',count:5,questionTime:15})).statusCode,200);
  assert.equal(payload.p_action,'create-listening');
  assert.equal(payload.p_data.questionTime,15);
  assert.equal(payload.p_data.options.showNoteNames,true);
  assert.equal(payload.p_data.questions.length,5);
  const questions=payload.p_data.questions;
  assert.deepEqual([...new Set(questions.map(q=>q.score.questionType))].sort(),
   ['apply-score','audio-full','audio-two','multiple-choice']);
  assert.ok(questions.every(q=>Boolean(q.score.audio)===q.score.questionType.startsWith('audio-')));
  assert.ok(questions.filter(q=>q.type==='accidental-placement').every(q=>
   payload.p_data.allowedAnswers.includes(require('../../shared/classroom-accidentals.js').placementId(q.score.required[0]))));
  assert.equal((await create({gameType:'race',targetStreak:5,raceMinutes:2})).statusCode,200);
  assert.equal(payload.p_action,'create');
  assert.equal(payload.p_data.gameType,'race');
  assert.equal(payload.p_data.targetStreak,5);
  assert.equal(payload.p_data.raceMinutes,2);
  assert.equal(payload.p_data.questions.length,50);
  assert.ok(payload.p_data.questions.every(question=>question.score.bars&&!question.score.audio));
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});
test('hosted accidental placements are private before review and graded at the submitted note',async()=>{
 env();
 const original=global.fetch;
 const a=require('../../shared/classroom-accidentals.js');
 const setup=a.hostSettings('/accidentals.html');
 const [question]=a.quizQuestions({...setup,enabledTypes:['apply-score']},1);
 const correctId=a.placementId(question.score.required[0]);
 const wrongId=a.allowedPlacementIds(question).find(id=>id!==correctId);
 let forwarded,review=false;
 global.fetch=async (_url,options)=>{
  const request=JSON.parse(options.body);
  if(request.p_action==='answer')forwarded=request.p_data;
  return {ok:true,json:async()=>({host:false,index:0,phase:review?'review':'question',question,
   ...(review?{players:[{answered:true},{answered:true}],breakdown:[{answer:correctId,count:1},{answer:wrongId,count:1}]}:{})})};
 };
 const post=(action,extra={})=>handler({httpMethod:'POST',body:JSON.stringify({action,pin:'123456',token:'a'.repeat(64),...extra})});
 try{
  const read=JSON.parse((await post('read')).body);
  assert.equal(read.question.pitch,undefined);
  assert.equal(read.question.score.required,undefined);
  assert.equal((await post('answer',{index:0,answer:correctId})).statusCode,400);
  assert.equal((await post('answer',{index:0,placement:'accidental-placement:sharp:9:9'})).statusCode,400);
  assert.equal(forwarded,undefined);
  for(const id of [wrongId,correctId]){
   assert.equal((await post('answer',{index:0,placement:id})).statusCode,200);
   assert.equal(forwarded.answer,id);
   assert.equal(forwarded.pitch===question.pitch,id===correctId);
  }
  review=true;
  const result=JSON.parse((await post('read')).body);
  assert.deepEqual(result.question.score.required,question.score.required);
  assert.deepEqual(result.breakdown,[{answer:'correct',count:1},{answer:'incorrect',count:1}]);
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});
test('host creates a game without a teacher key and never receives server credentials',async()=>{
 env();const original=global.fetch;let payload;
 global.fetch=async(url,options)=>{payload=JSON.parse(options.body);return {ok:true,json:async()=>({pin:payload.p_pin,phase:'lobby'})};};
 try{
  const response=await handler({httpMethod:'POST',body:JSON.stringify({action:'create',level:'N3',count:7})});
  assert.equal(response.statusCode,200);assert.equal(payload.p_data.questions.length,7);
  assert.equal(payload.p_data.questionTime,20);
  assert.equal(new Set(payload.p_data.questions.map(q=>q.pitch)).size,7);
  assert.ok(payload.p_data.questions.every(q=>!q.black&&q.pitch<=12));
  const result=JSON.parse(response.body);assert.match(result.token,/^[a-f0-9]{64}$/);assert.notEqual(result.token,payload.p_token);
  assert.ok(!response.body.includes('test-server-secret'));assert.ok(!response.body.includes('test-invite'));
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});
test('mixed activities can race with written questions and native audio practice uses the original activity',async()=>{
 env();
 const original=global.fetch;
 let request;
 global.fetch=async (_url,options)=>{
  request=JSON.parse(options.body);
  return {ok:true,json:async()=>({phase:'lobby'})};
 };
 const post=body=>handler({httpMethod:'POST',body:JSON.stringify(body)});
 const routes=['accidentals','articulationmarkings','chords','dynamics','followthescore','melodicdictation',
  'musicescape','repeatsigns','rhythmicdictation'];
 const raceRoutes=new Set(['accidentals','articulationmarkings','chords','dynamics','musicescape']);
 const nativePracticeRoutes=new Set(['followthescore','repeatsigns','rhythmicdictation']);
 try{
  for(const gameType of ['quiz','race']){
   const response=await post({action:'create',activity:'/metronome.html',gameType});
   assert.equal(response.statusCode,400);
   assert.match(response.body,/Choose an activity that supports classroom play/);
  }
  for(const name of routes){
   const activity='/'+name+'.html';
   for(const gameType of ['race','activity-race']){
    request=null;
    const race=await post({action:'create',activity,gameType});
    if(raceRoutes.has(name)){
     assert.equal(race.statusCode,200,name);
     assert.equal(request.p_data.gameType,'activity-race');
     assert.equal(request.p_data.activity,activity);
     assert.equal(request.p_data.questions,undefined);
     if(name==='musicescape')assert.equal(request.p_data.targetCorrect,6);
    }else{
     assert.equal(race.statusCode,400,name);
     assert.match(race.body,/requires audio/);
     assert.equal(request,null);
    }
   }
   const quiz=await post({action:'create',activity,gameType:'quiz',count:5});
   assert.equal(quiz.statusCode,200,name);
   if(nativePracticeRoutes.has(name)){
    assert.equal(request.p_action,'create');
    assert.equal(request.p_data.gameType,'shared');
    assert.equal(request.p_data.nativePractice,true);
    assert.equal(request.p_data.activity,activity);
    assert.equal(request.p_data.questions,undefined);
    continue;
   }
   assert.equal(request.p_action,name==='melodicdictation'?'create-melodic-quiz':'create-listening');
   assert.equal(request.p_data.questionTime,20);
   const {questions}=request.p_data;
   assert.equal(questions.length,5);
   if(name==='accidentals'){
    assert.ok(questions.some(q=>q.score.audio)&&questions.some(q=>!q.score.audio));
    continue;
   }
   assert.ok(questions.every(q=>q.score.listening&&q.score.audio));
   if(name==='melodicdictation'){
    assert.ok(questions.every(q=>q.type==='melodic-dictation'&&q.response.length&&q.score.melody.bars.length));
    assert.equal(new Set(questions.map(q=>JSON.stringify(q.score.melody.bars))).size,5);
   }else{
    assert.ok(questions.every(q=>q.score.choices[q.pitch]));
    assert.equal(new Set(questions.map(q=>JSON.stringify(q.score.audio))).size,5);
   }
  }
  const higher='/chords.html?level=H&settings=profile';
  assert.equal((await post({action:'create',activity:higher,gameType:'activity-race'})).statusCode,400);
  assert.equal((await post({action:'create',activity:higher,gameType:'race',targetStreak:5})).statusCode,400);
  assert.equal((await post({action:'create',activity:higher,gameType:'shared'})).statusCode,200);
  assert.equal(request.p_data.activity,higher);
  assert.equal(request.p_data.nativePractice,true);
  assert.equal(request.p_data.questions,undefined);
  const media={type:'audio',src:'./audio/concept-library/test.m4a'};
  const encoded=deflateSync(JSON.stringify({activities:[{items:[{answer:'Jazz',media},{answer:'Blues'}]}]})).toString('base64url');
  const activity='/conceptsort.html#playnote='+encoded;
  request=null;
  assert.equal((await post({action:'create',activity,gameType:'race'})).statusCode,400);
  assert.equal(request,null);
  assert.equal((await post({action:'create',activity,gameType:'shared'})).statusCode,200);
  assert.equal(request.p_data.gameType,'shared');
  assert.equal(request.p_data.nativePractice,true);
  assert.equal(request.p_data.activity,activity);
  assert.equal(request.p_data.questions,undefined);
  const styles='/conceptsort.html?level=H&type=styles';
  assert.equal((await post({action:'create',activity:styles,gameType:'activity-race'})).statusCode,400);
  assert.equal((await post({action:'create',activity:styles,gameType:'shared'})).statusCode,200);
  assert.equal(request.p_data.activity,styles);
  assert.equal(request.p_data.nativePractice,true);
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});
test('Melodic Dictation sends the same exercise to host and pupils with missing pitches hidden until reveal',async()=>{
 env();
 const original=global.fetch;
 const {create:random}=require('../../shared/melodic-dictation-questions.js');
 const listening=require('../../shared/classroom-listening.js');
 const seeded=require('../../shared/classroom-activities.js').random;
 const exercise=random(seeded(91)).makeQuestion('H');
 const question=listening.questions({format:'melody',level:'H'},1,null,seeded(91))[0];
 assert.deepEqual(question.score.melody,exercise);
 const {targetBar}=exercise;
 const notes=exercise.bars[targetBar].notes.map(note=>note.step);
 let host=false,phase='listening',rpc;
 global.fetch=async (_url,options)=>{
  rpc=JSON.parse(options.body);
  return {ok:true,json:async()=>({host,phase,question})};
 };
 const post=body=>handler({httpMethod:'POST',body:JSON.stringify({pin:'123456',token:'a'.repeat(64),...body})});
 try{
  const pupil=JSON.parse((await post({action:'read'})).body).question;
  assert.equal(pupil.response,undefined);
  assert.equal(pupil.score.audio,undefined);
  assert.deepEqual(pupil.score.melody.bars.filter(bar=>bar.barIndex!==targetBar),exercise.bars.filter(bar=>bar.barIndex!==targetBar));
  assert.ok(pupil.score.melody.bars[targetBar].notes.every(note=>!('step' in note)&&!('midi' in note)));
  assert.deepEqual(pupil.score.melody.bars[targetBar].notes.map(note=>note.rhythm),exercise.bars[targetBar].notes.map(note=>note.rhythm));
  host=true;
  assert.deepEqual(JSON.parse((await post({action:'read'})).body).question.score.melody,exercise);
  host=false;phase='review';
  assert.deepEqual(JSON.parse((await post({action:'read'})).body).question.score.melody,exercise);
  assert.equal((await post({action:'answer',index:0,notes:[null]})).statusCode,400);
  assert.equal((await post({action:'answer',index:0,notes})).statusCode,200);
  assert.deepEqual(rpc.p_data,{notes,index:0});
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});
test('database denies public access and prevents duplicate answers and caps games at 20 pupils',()=>{
 const sql=require('node:fs').readFileSync(require('node:path').join(__dirname,'../schema.sql'),'utf8');
 assert.match(sql,/enable row level security/);assert.match(sql,/from public,anon,authenticated/);
 assert.match(sql,/for update/);assert.match(sql,/Answer already submitted/);assert.match(sql,/jsonb_array_length\(r.players\)>=20/);
});

test('pupil action waits for an active poll and prevents a duplicate click',async()=>{
 const html=require('node:fs').readFileSync(require('node:path').join(__dirname,'../../host.html'),'utf8');
 const body=html.slice(html.indexOf(' async function act('),html.indexOf(' useEffect(()=>{let timeout;'));
 let release;const read=new Promise(resolve=>{release=resolve;});let calls=0,busy=false;
 const refs={session:{current:{pin:'123456',token:'test'}},inFlight:{current:true},actionPending:{current:false},pendingRead:{current:read}};
 const context={...refs,mounted:{current:true},setBusy:value=>{busy=value;},setError:()=>{},request:async()=>{calls++;return {phase:'question'};},update:()=>{},setSelected:()=>{}};
 require('node:vm').runInNewContext(body+';this.act=act;',context);
 const answer=context.act('answer',{answer:'E',index:0});
 assert.equal(busy,true);assert.equal(calls,0);
 await context.act('answer',{answer:'E',index:0});
 release();await answer;
 assert.equal(calls,1);assert.equal(busy,false);assert.equal(refs.actionPending.current,false);
});

test('teacher customisation controls room questions, answers and C labels',async()=>{
 env();const original=global.fetch;let payload;
 global.fetch=async(url,options)=>{payload=JSON.parse(options.body);return {ok:true,json:async()=>({phase:'lobby'})};};
 try{
  const options={octaves:2,naturals:false,sharps:false,flats:true,enharmonics:true};
  const response=await handler({httpMethod:'POST',body:JSON.stringify({action:'create',level:'N5',options,showC:true,count:5})});
  assert.equal(response.statusCode,200);assert.deepEqual(payload.p_data.options,options);assert.equal(payload.p_data.showC,true);
  assert.ok(payload.p_data.allowedAnswers.every(answer=>answer.endsWith('b')));
  const K=require('../../keyboard-notes.js');
  const allowed=new Set(K.answers(options).map(a=>a.pitch));
  assert.ok(payload.p_data.questions.every(q=>allowed.has(q.pitch%12)));
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});

test('empty or out-of-level classroom customisation is rejected before database access',async()=>{
 env();const original=global.fetch;let called=false;
 global.fetch=async()=>{called=true;throw Error('Unexpected database call');};
 try{
  for(const setup of [
   {level:'N5',options:{octaves:2,naturals:false,sharps:false,flats:false,enharmonics:true}},
   {level:'N3',options:{octaves:1,naturals:true,sharps:true,flats:false,enharmonics:false}},
   {level:'N5',options:{octaves:200,naturals:true,sharps:true,flats:true,enharmonics:false}},
  ])assert.equal((await handler({httpMethod:'POST',body:JSON.stringify({action:'create',...setup,count:5})})).statusCode,400);
  assert.equal(called,false);
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});

test('host can choose 5–50 questions and every supported timer',async()=>{
 env();const original=global.fetch;let payload;
 global.fetch=async(url,options)=>{payload=JSON.parse(options.body);return {ok:true,json:async()=>({phase:'lobby'})};};
 try{
  for(const count of [5,10,15,20,25,30,35,40,45,50]){
   const response=await handler({httpMethod:'POST',body:JSON.stringify({action:'create',level:'AH',count,questionTime:30})});
   assert.equal(response.statusCode,200);assert.equal(payload.p_data.questions.length,count);
   assert.equal(payload.p_data.questionTime,30);assert.equal(payload.p_data.scoringVersion,2);
  }
  for(const questionTime of [5,10,15,20,30,45,60,90,120]){
   assert.equal((await handler({httpMethod:'POST',body:JSON.stringify({action:'create',level:'N3',count:5,questionTime})})).statusCode,200);
   assert.equal(payload.p_data.questionTime,questionTime);
  }
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});

test('invalid counts and timers cannot reach the database',async()=>{
 env();const original=global.fetch;let called=false;
 global.fetch=async()=>{called=true;throw Error('Unexpected database call');};
 try{
  for(const values of [{count:51},{count:10},{count:6},{count:-5},{count:'abc'},{count:5.5},{questionTime:0},{questionTime:500},{questionTime:'bad'}]){
   assert.equal((await handler({httpMethod:'POST',body:JSON.stringify({action:'create',level:'N3',...values})})).statusCode,400);
  }
  assert.equal(called,false);
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});

test('race creates private question pool and validates teacher streak targets',async()=>{
 env();const original=global.fetch;let payload;
 global.fetch=async(url,options)=>{payload=JSON.parse(options.body);return {ok:true,json:async()=>({phase:'lobby'})};};
 try{
  const response=await handler({httpMethod:'POST',body:JSON.stringify({action:'create',level:'N3',gameType:'race',targetStreak:30})});
  assert.equal(response.statusCode,200);assert.equal(payload.p_data.gameType,'race');assert.equal(payload.p_data.targetStreak,30);assert.equal(payload.p_data.raceMinutes,0);assert.equal(payload.p_data.questions.length,7);
  for(let raceMinutes=1;raceMinutes<=10;raceMinutes++){assert.equal((await handler({httpMethod:'POST',body:JSON.stringify({action:'create',level:'N3',gameType:'race',raceMinutes})})).statusCode,200);assert.equal(payload.p_data.raceMinutes,raceMinutes);}
  for(const raceMinutes of [-1,11,1.5])assert.equal((await handler({httpMethod:'POST',body:JSON.stringify({action:'create',level:'N3',gameType:'race',raceMinutes})})).statusCode,400);
  for(const targetStreak of [0,101,2.5])assert.equal((await handler({httpMethod:'POST',body:JSON.stringify({action:'create',level:'N3',gameType:'race',targetStreak})})).statusCode,400);
  assert.equal((await handler({httpMethod:'POST',body:JSON.stringify({action:'create',level:'N3',gameType:'unknown'})})).statusCode,400);
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});

test('Higher and Advanced Higher host Find the Key in Quiz and Race',async()=>{
 env();const original=global.fetch;let payload;
 const K=require('../../keyboard-notes.js');
 global.fetch=async(url,options)=>{payload=JSON.parse(options.body);return {ok:true,json:async()=>({phase:'lobby'})};};
 const post=body=>handler({httpMethod:'POST',body:JSON.stringify(body)});
 try{
  for(const level of ['H','AH']){
   for(const gameType of ['quiz','race']){
    const options={...K.defaults[level],treble:false,sharps:false};
    const count=K.classroomQuestionPool(options,{find:true},level).length;
    const result=await post({action:'create',level,gameType,options,count});
    assert.equal(result.statusCode,200);
    assert.deepEqual(payload.p_data.options,options);
    assert.equal(payload.p_data.allowedAnswers.length,25);
    assert.ok(payload.p_data.questions.every(q=>q.type==='find'&&q.note.clef==='bass'&&q.note.accidental!=='sharp'&&payload.p_data.allowedAnswers.includes(K.classroomKeyId(q.pitch))));
    const range=level==='H'?[-2,10]:[-4,12];
    assert.ok(payload.p_data.questions.every(q=>q.note.step>=range[0]&&q.note.step<=range[1]));
   }
  }
  const request={action:'answer',pin:'123456',token:'a'.repeat(64),index:0};
  assert.equal((await post({...request,answer:'key:24'})).statusCode,200);
  assert.deepEqual(payload.p_data,{answer:'key:24',pitch:24,index:0});
  assert.equal((await post({...request,answer:'key:25'})).statusCode,400);
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});

test('activity Races capture the original setup and choose one server-side seed',async()=>{
 env();const original=global.fetch;let payload;
 global.fetch=async(url,options)=>{payload=JSON.parse(options.body);return {ok:true,json:async()=>({phase:'lobby'})};};
 const post=body=>handler({httpMethod:'POST',body:JSON.stringify(body)});
 try{
  const encoded=deflateSync(JSON.stringify({activities:[{items:[{answer:'Bass clef',media:null}]}]})).toString('base64url');
  const activity='/wordsearch.html?level=N5#playnote='+encoded;
  assert.equal((await post({action:'create',gameType:'race',activity})).statusCode,200);
  assert.equal(payload.p_data.gameType,'activity-race');
  assert.equal(payload.p_data.targetCorrect,null);
  assert.equal(payload.p_data.activity,activity);
  assert.ok(Number.isInteger(payload.p_data.seed));
  assert.equal(payload.p_data.questions,undefined);
  assert.equal((await post({action:'create',gameType:'quiz',activity})).statusCode,400);
  assert.equal((await post({action:'create',gameType:'shared',activity})).statusCode,400);
  assert.equal((await post({action:'create',gameType:'race',activity:'/barlines.html?level=N5'})).statusCode,200);
  assert.equal(payload.p_data.targetCorrect,10);
  for(const path of ['//other.example/wordsearch.html','/index.html','/assessment-recorder/assessmentrecorder.html']){
   assert.equal((await post({action:'create',gameType:'race',activity:path})).statusCode,400);
  }
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});

test('Rhythm Identification requires a timed room and accepts millisecond grid results',async()=>{
 env();const original=global.fetch;const requests=[];
 global.fetch=async(_url,options)=>{
  requests.push(JSON.parse(options.body));
  return {ok:true,json:async()=>({phase:'lobby'})};
 };
 const post=body=>handler({httpMethod:'POST',body:JSON.stringify(body)});
 const activity='/rhythmidentification.html?level=N3&settings=profile';
 const setup={action:'create',activity,gameType:'rhythm-time-trial',raceMinutes:2};
 const result={action:'grid-finish',pin:'123456',token:'a'.repeat(64),elapsedMs:12457};
 try{
  for(const raceMinutes of [undefined,0,1.5,11,'2'])assert.equal((await post({...setup,raceMinutes})).statusCode,400);
  assert.equal((await post({...setup,activity:'/barlines.html'})).statusCode,400);
  assert.equal((await post({...setup,gameType:'race'})).statusCode,400);
  assert.equal((await post(setup)).statusCode,200);
  assert.equal(requests[0].p_data.activity,activity);
  assert.equal(requests[0].p_data.gameType,'rhythm-time-trial');
  assert.equal(requests[0].p_data.raceMinutes,2);
  for(const elapsedMs of [undefined,-1,0,1.5,600001])assert.equal((await post({...result,elapsedMs})).statusCode,400);
  assert.equal((await post(result)).statusCode,200);
  assert.equal(requests.length,2);
  assert.deepEqual(requests[1].p_data,{elapsedMs:12457});
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});

test('Note Identification reuses the selected notation pool for both timed formats',async()=>{
 env();const original=global.fetch;let payload;
 global.fetch=async(url,options)=>{payload=JSON.parse(options.body);return {ok:true,json:async()=>({phase:'lobby'})};};
 try{
  for(const gameType of ['quiz','race']){
   const setup={action:'create',activity:'written-notes',level:'AH',gameType,settings:{bass:true,treble:false,ledger:true,accidentals:true}};
   const response=await handler({httpMethod:'POST',body:JSON.stringify(setup)});
   assert.equal(response.statusCode,200);
   const data=payload.p_data;
   assert.equal(data.activity,'written-notes');
   const {allAnswers}=require('../../shared/classroom-written-notes.js');
   assert.ok(data.questions.every(q=>q.type==='written'&&q.note.clef==='bass'&&data.allowedAnswers.includes(allAnswers[q.pitch].id)));
   assert.ok(data.allowedAnswers.includes('written:C#')&&data.allowedAnswers.includes('written:Db'));
  }
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});

test('Keyboard Note Identification hosts the selected Find the Key and mixed question types',async()=>{
 env();
 const original=global.fetch;
 let room;
 global.fetch=async (_url,options)=>{
  room=JSON.parse(options.body).p_data;
  return {ok:true,json:async()=>({phase:'lobby'})};
 };
 try{
  for(const name of [false,true]){
   const body={action:'create',level:'N3',gameType:name?'quiz':'race',count:10,questionTypes:{name,find:true}};
   assert.equal((await handler({httpMethod:'POST',body:JSON.stringify(body)})).statusCode,200);
   assert.deepEqual(new Set(room.questions.map(question=>question.type)),new Set(name?['find','name']:['find']));
   assert.equal(room.allowedAnswers.includes('C'),name);
   assert.ok(room.allowedAnswers.includes('key:0'));
  }
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});

test('all Hub Music Literacy levels can create every supported Host mode',async()=>{
 const fs=require('node:fs'),vm=require('node:vm');
 const homepage=fs.readFileSync(require('node:path').join(__dirname,'../../index.html'),'utf8');
 const catalog=vm.runInNewContext(homepage.slice(homepage.indexOf('const appData = '),homepage.indexOf('const appCategories'))+'\nappData');
 const apps=catalog.filter(group=>['Pitch','Rhythm','Music Symbols','Practice'].includes(group.category)).flatMap(group=>group.apps);
 const listeningOnly=new Set(['melodicdictation.html','followthescore.html','repeatsigns.html']);
 const modes=['quiz','race'];
 const original=global.fetch;
 let request;
 env();
 global.fetch=async (_url,{body})=>{
  request=JSON.parse(body);
  return {ok:true,json:async()=>({phase:'lobby'})};
 };
 try{
  for(const {href,disabled} of apps)for(const level of ['N3','N4','N5','H','AH']){
   if(disabled.includes(level))continue;
   const activity='/'+href+'?level='+level;
   for(const gameType of modes){
    request=null;
    const enabled=href!=='practicequestions.html'&&(gameType==='quiz'||!listeningOnly.has(href)&&
     (href!=='rhythmicdictation.html'||['N5','H'].includes(level)));
    const settings=gameType==='quiz'?{literacyQuiz:!activity.startsWith('/accidentals.html?level=N5'),count:5}:
     {nativeStreak:true,targetStreak:5,raceMinutes:0};
    const response=await handler({httpMethod:'POST',body:JSON.stringify({action:'create',activity,gameType,...settings})});
    assert.equal(response.statusCode,enabled?200:400,activity+' '+gameType+' '+response.body);
    if(!enabled){assert.equal(request,null,activity);continue;}
    if(gameType==='quiz'){
     assert.equal(request.p_data.gameType,'quiz',activity);
     assert.equal(request.p_data.questions.length,5,activity);
     assert.ok(request.p_data.questions.every(question=>Number.isInteger(question.pitch)||question.type==='melodic-dictation'),activity);
    }else{
     assert.equal(request.p_data.nativeStreak,true,activity);
     assert.equal(request.p_data.questions,undefined,activity);
    }
   }
  }
  for(const [file,level,state] of [
   ['chords.html','N5',{n5Customise:{chordProgression:true,identifyChord:false}}],
   ['chords.html','AH',{ahCustomise:{identifyChords:true,insertPosition:false,createBassLine:false}}],
   ['dynamics.html','N5',{enabledTypes:['audio']}],
   ['articulationmarkings.html','H',{enabledTypes:['aural-articulation']}],
   ['rhythmicdictation.html','H',{enabledQuestionTypes:['insert','correct']}],
  ]){
   const profile=Buffer.from(JSON.stringify({version:2,activity:file,state})).toString('base64url');
   const activity='/'+file+'?level='+level+'&settings='+profile;
   for(const settings of [{gameType:'activity-race'},{gameType:'race',nativeStreak:true,targetStreak:5,raceMinutes:0}]){
    request=null;
    const response=await handler({httpMethod:'POST',body:JSON.stringify({action:'create',activity,...settings})});
    assert.equal(response.statusCode,400,activity);
    assert.equal(request,null,activity);
   }
  }
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});

test('timed activity race settings and submissions reach the room service',async()=>{
 env();
 const original=global.fetch;
 let request;
 global.fetch=async (_url,{body})=>{
  request=JSON.parse(body);
  return {ok:true,json:async()=>({phase:'lobby'})};
 };
 const post=body=>handler({httpMethod:'POST',body:JSON.stringify(body)});
 try{
  for(const activity of ['/dominoes.html?level=N3','/conceptsort.html?level=N3']){
   const setup={action:'create',activity,gameType:'activity-race',retryRaceMinutes:3};
   assert.equal((await post(setup)).statusCode,200);
   assert.equal(request.p_data.retryRaceMinutes,3);
   assert.equal((await post({...setup,retryRaceMinutes:0})).statusCode,400);
  }
  for(const activity of ['/dominoes.html?level=N3&dominoAudio=Styles','/conceptsort.html?level=N3&type=styles']){
   const setup={action:'create',activity,gameType:'activity-race',retryRaceMinutes:3};
   assert.equal((await post(setup)).statusCode,400);
  }
  const retryAttempt={id:1,correct:0,total:12,elapsedMs:1200};
  const finish={action:'finish',pin:'123456',token:'a'.repeat(64),retryAttempt};
  assert.equal((await post(finish)).statusCode,200);
  assert.deepEqual(request.p_data,{retryAttempt});
  assert.equal((await post({...finish,retryAttempt:{...retryAttempt,correct:13}})).statusCode,400);
 }finally{global.fetch=original;vars.forEach(key=>delete process.env[key]);}
});
