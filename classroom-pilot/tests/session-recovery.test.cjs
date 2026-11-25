const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../host.html'),'utf8');
test('bare classroom URLs return to the Hub and room links open the classroom',()=>{
 const source=html.slice(html.indexOf('const entryParams='),html.indexOf('\n</script><script src="./generated-runtimes/keyboardnoteidentificationclassroom-1.js'));
 const {transform}=require('@babel/standalone');
 const entry=transform(source,{presets:['react']}).code;
 function open(address){
  const url=new URL(address);
  const location={href:address,search:url.search,hostname:url.hostname,replace:href=>{result=href;}};
  let result;
  vm.runInNewContext(entry,{URL,URLSearchParams,location,document:{getElementById:()=>null},Classroom:()=>null,React:{createElement:()=>null},ReactDOM:{createRoot:()=>({render:()=>{result='classroom';}})}});
  return result;
 }
 const host='https://example.test/hub/host.html';
 assert.equal(open(host),'https://example.test/hub/index.html');
 assert.equal(open(host+'?mode=join'),'https://example.test/hub/index.html');
 assert.equal(open(host+'?mode=join&pin=123456'),'classroom');
 assert.equal(open(host+'?mode=host&setup=example'),'classroom');
 assert.equal(open('http://127.0.0.1:8765/host.html?mode=join&offlinePreview=1&preview=test'),'classroom');
 assert.equal(open('file:///tmp/hub/host.html'),'file:///tmp/hub/index.html');
});
test('hosted audio quiz answers can be drafted before Submit opens',()=>{
 const React=require('react');
 const {renderToStaticMarkup}=require('react-dom/server');
 const {transform}=require('@babel/standalone');
 const source=html.slice(html.indexOf('function HostedConceptQuestion('),html.indexOf('function PracticeFrame('));
 const window={
  MusicDictionaryQuizCore:require('../../music-dictionary/quiz-core.js'),
  MLH:{classroomConceptQuiz:require('../../shared/classroom-concept-quiz.js')},
  MLHLiteracyNotation:{},
 };
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../music-dictionary/quiz-answer-controls.js'),'utf8'),{React,window});
 window.MusicDictionaryQuizAnswer=({locked,response})=>React.createElement('input',{type:'checkbox',disabled:locked,checked:response.length>0,readOnly:true});
 const Component=vm.runInNewContext(transform(source,{presets:['react']}).code+';HostedConceptQuestion;',{
  React,useEffect:React.useEffect,useState:React.useState,useRef:React.useRef,window,
  sessionStorage:{getItem:()=>JSON.stringify(['a','b'])},
 });
 const quiz={id:'excerpt',format:'audio-select-2',prompt:'Tick two options.',
  options:[{id:'a',text:'A'},{id:'b',text:'B'}],answer:{correctOptionIds:['a','b']}};
 const render=(phase,canAnswer,host=false)=>renderToStaticMarkup(React.createElement(Component,{
  quiz,game:{pin:'123456',index:0,phase,host},canAnswer,
 }));
 assert.match(render('listening',false),/<input type="checkbox"[^>]*checked=""/);
 assert.match(render('listening',false),/<button[^>]+disabled=""[^>]*>Submit/);
 assert.doesNotMatch(render('question',true),/<button[^>]+disabled=""[^>]*>Submit/);
 assert.match(render('listening',false,true),/<input[^>]+disabled=""/);
 const reviewed=render('review',false);
 assert.match(reviewed,/No answer submitted\./);
 assert.doesNotMatch(reviewed,/checked=""/);
});
test('Host tabs match the activity title and favicon across the activity registry',()=>{
 const root=path.join(__dirname,'../..');
 const activities=require('../../shared/classroom-activities.js');
 const registry=fs.readFileSync(path.join(root,'shared/classroom-activities.js'),'utf8');
 for(const [,route] of registry.matchAll(/^  '(\/[^']+\.html)':\[/gm)){
  const page=fs.readFileSync(path.join(root,route),'utf8');
  const title=page.match(/<title>([^<]+)<\/title>/)[1];
  const icon=page.match(/<link rel="icon"[^>]*href="([^"]+)"/i)[1];
  const identity=activities.header(route+'?level=H');
  assert.equal(identity.tabTitle,title,route);
  assert.equal(identity.tabIcon,new URL(icon,'https://hub.test/').pathname,route);
 }
 assert.match(html,/document.title=hasActivity\?activityHeader.tabTitle:/);
 assert.match(html,/const icon=hasActivity\?activityHeader.tabIcon:/);
});
test('host session survives refresh, stays scoped to its room and keeps token out of the URL',()=>{
 const storage=new Map(),location={href:'https://example.test/host.html?mode=host&setup=test'};
 Object.defineProperty(location,'search',{get:()=>new URL(location.href).search});
 const context={URL,URLSearchParams,location,history:{replaceState:(_a,_b,url)=>{location.href=String(url);}},sessionStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)}};
 vm.runInNewContext(html.slice(html.indexOf('function loadHostSession(){'),html.indexOf('function offlineRoomKey('))+';this.load=loadHostSession;this.save=saveHostSession;',context);
 const identity={pin:'123456',token:'a'.repeat(64)};context.save(identity);
 assert.equal(new URL(location.href).searchParams.get('room'),'123456');assert.ok(!location.href.includes(identity.token));assert.equal(context.load().token,identity.token);
 location.href='https://example.test/host.html?mode=host';assert.equal(context.load(),null);
 location.href+='&room=654321';assert.equal(context.load(),null);
 location.href='https://example.test/host.html?mode=host&room=123456';storage.set('mlh:classroom:host:123456','{"pin":"123456","token":"bad"}');assert.equal(context.load(),null);
});
function stateContext(){
 const state={};const context={state,URL,history:{replaceState:()=>{}},location:{href:'https://example.test/host.html'},sessionStorage:{removeItem:()=>{}},hosting:false,offlinePreview:false,offlineGame:{current:null},mounted:{current:true},session:{current:{pin:'123456'}},latestGame:{current:null},finishPending:{current:false},retryAttemptsPending:{current:[]},clockOffset:{current:0},failures:{current:0},Date};
 Object.assign(context,{sharedActivities:require('../../shared/classroom-activities.js'),sessionExitRef:{current:null},lastPupilActivity:{current:null},previousPupilActivity:null,previewId:null,pageParams:new URLSearchParams(),pupilActivityKey:id=>`pupil-activity:${id}`});
 const stored=new Map();
 context.sessionStorage.setItem=(key,value)=>stored.set(key,value);
 context.stored=stored;
 for(const key of ['Game','Selected','RestoringHost','Error','Connected','Now','RoomActivity','RoomWorksheetAvailable','SessionExit','ServiceUnavailable'])context['set'+key]=value=>{state[key]=value;};
 const raceWinnerSource=html.slice(html.indexOf('function isWinnerRace('),html.indexOf('function RaceWinner('));
 const updateSource=html.slice(html.indexOf(' function forgetSession(){'),html.indexOf(' async function act('));
 vm.runInNewContext(raceWinnerSource+updateSource+';this.update=update;this.readFailure=readFailure;',context);
 return context;
}
test('Host plays the diamond sound once when a race winner is announced',()=>{
 for(const gameType of ['race','activity-race','rhythm-time-trial']){
  const context=stateContext();
  const sounds=[];
  context.window={MLH:{playFeedbackSound:(...args)=>sounds.push(args)}};
  const playing={host:true,gameType,phase:'playing',serverTime:Date.now()};
  const finished={...playing,phase:'finished',winner:'Tempo Fox',players:[{bestTimeMs:500}]};
  context.update(finished);
  context.update(playing);
  context.update(finished);
  context.update(finished);
  context.update(playing);
  context.update({...finished,winner:null,players:[]});
  context.update({...playing,host:false});
  context.update({...finished,host:false});
  assert.deepEqual(sounds,[[true,true,'platinum']]);
 }
});

test('server restores own Quiz selection and clears it on the next question',()=>{
 const context=stateContext();context.update({host:false,index:0,phase:'question',submitted:true,myAnswer:'F',serverTime:Date.now()});assert.equal(context.state.Selected,'F');
 context.update({host:false,index:0,phase:'review',submitted:true,myAnswer:'F',serverTime:Date.now()});assert.equal(context.state.Selected,'F');
 context.update({host:false,index:1,phase:'countdown',submitted:false,myAnswer:null,serverTime:Date.now()});assert.equal(context.state.Selected,null);
});
test('polling recovers after more than three failures and retries immediately on online',async()=>{
 const context=stateContext(),timers=new Map(),events=new Map();let id=0,attempts=0,cleanup;
 Object.assign(context,{useEffect:fn=>{cleanup=fn();},inFlight:{current:false},actionPending:{current:false},pendingRead:{current:null},window:{addEventListener:(key,fn)=>events.set(key,fn),removeEventListener:key=>events.delete(key)},setTimeout:(fn,delay)=>{timers.set(++id,{fn,delay});return id;},clearTimeout:key=>timers.delete(key),setInterval:()=>1,clearInterval:()=>{},Math,request:async()=>{if(++attempts<=4)throw Error('temporary outage');return {host:false,phase:'question',serverTime:Date.now()};}});
 const start=html.indexOf(' useEffect(()=>{let timeout;'),end=html.indexOf('\n },[]);',start)+8;vm.runInNewContext(html.slice(start,end),context);
 async function cycle(){const [key,timer]=timers.entries().next().value;timers.delete(key);await timer.fn();}
 for(let i=0;i<5;i++)await cycle();assert.equal(attempts,5);assert.equal(context.state.Connected,true);assert.equal(context.failures.current,0);
 const pending=events.get('online')();await pending;await new Promise(resolve=>setImmediate(resolve));assert.equal(attempts,6);
 cleanup();assert.equal(timers.size,0);assert.equal(events.size,0);
});
test('a restored offline host polls through the next question countdown without a server session',async()=>{
 const context=stateContext();
 const startedAt=3000;
 let now=startedAt-100,timer;
 Object.assign(context,{
  hosting:true,session:{current:null},offlineGame:{current:{}},Date:{now:()=>now},
  useEffect:fn=>fn(),inFlight:{current:false},actionPending:{current:false},pendingRead:{current:null},
  window:{addEventListener:()=>{}},setInterval:()=>1,
  setTimeout:(fn,delay)=>{timer={fn,delay};},
  request:async()=>({host:true,index:5,phase:now<startedAt?'countdown':'question',startedAt,serverTime:now}),
 });
 const start=html.indexOf(' useEffect(()=>{let timeout;'),end=html.indexOf('\n },[]);',start)+8;
 vm.runInNewContext(html.slice(start,end),context);
 assert.equal(timer.delay,0);
 await timer.fn();
 assert.equal(context.state.Game.phase,'countdown');
 assert.equal(timer.delay,100);
 now=startedAt;
 await timer.fn();
 assert.equal(context.state.Game.phase,'question');
 assert.equal(context.state.Game.index,5);
});
test('expired host room clears saved control and allows a new game',()=>{
 const context=stateContext();context.hosting=true;let removed;context.sessionStorage.removeItem=key=>{removed=key;};context.readFailure(Object.assign(Error('Game not found or expired.'),{terminal:true}));assert.equal(removed,'mlh:classroom:host:123456');assert.equal(context.session.current,null);assert.equal(context.state.RestoringHost,false);
});
test('shared completion is retried after a lost connection and cleared on confirmation',async()=>{
 const context=stateContext();
 const actions=[];
 Object.assign(context,{
  offlineGame:{current:null},
  AbortSignal,
  fetch:async (_url,options)=>{
   const {action}=JSON.parse(options.body);
   actions.push(action);
   if(actions.length===1)throw Error('temporary outage');
   return {ok:true,json:async()=>({phase:'playing',myFinished:true,serverTime:Date.now()})};
  },
 });
 vm.runInNewContext(html.slice(html.indexOf(' async function request('),html.indexOf(' function forgetSession(){'))+';this.request=request;',context);
 context.finishPending.current=true;
 await assert.rejects(context.request('read'),/temporary outage/);
 assert.equal(context.finishPending.current,true);
 context.update(await context.request('read'));
 assert.equal(context.finishPending.current,false);
 await context.request('read');
 assert.deepEqual(actions,['finish','finish','read']);
});
test('pupils who were playing see the end-of-game message when the host closes the room',()=>{
 const context=stateContext();
 context.update({activity:'/wordsearch.html',phase:'playing',serverTime:Date.now()});
 context.readFailure(Object.assign(Error('Game not found or expired.'),{terminal:true}));
 assert.equal(context.state.Error,'');
 assert.equal(context.state.SessionExit,'ended');
 assert.equal(context.state.Game,null);
 assert.equal(context.state.RoomActivity,'/wordsearch.html');
 assert.deepEqual(JSON.parse(context.stored.get('pupil-activity:123456')),{activity:'/wordsearch.html',ended:true});
 context.update({activity:'/crosswords.html',phase:'playing',serverTime:Date.now()});
 assert.equal(context.state.RoomActivity,'/wordsearch.html');
 assert.equal(context.state.Game,null);
});

test('an ended offline room can supply the activity before the pupil receives a game state',()=>{
 const context=stateContext();
 context.previewId='preview';
 context.update({closed:true,activity:'/whowantstobemillionaire/whowantstobeamillionaire.html?level=N3'});
 assert.equal(context.state.RoomActivity,'/whowantstobemillionaire/whowantstobeamillionaire.html?level=N3');
 assert.equal(context.state.SessionExit,'ended');
 assert.equal(context.state.Error,'');
});

test('removed pupils see a session exit and can rejoin on a new QR scan',()=>{
 for(const remove of [
  context=>context.update({closed:true,removed:true}),
  context=>context.readFailure(Object.assign(Error('Join this game first.'),{terminal:true})),
 ]){
  const context=stateContext();
  context.update({activity:'/wordsearch.html?level=N5',phase:'lobby',serverTime:Date.now()});
  remove(context);
  assert.equal(context.state.SessionExit,'removed');
  assert.equal(context.state.RoomActivity,'/wordsearch.html?level=N5');
  assert.equal(context.state.Error,'');
  assert.equal(context.session.current,null);
  assert.equal(JSON.parse(context.stored.get('pupil-activity:123456')).ended,false);
  context.update({waiting:true});
  assert.equal(context.state.SessionExit,'removed');
 }
});

test('an unavailable Host service is distinguished from an ordinary game error',async()=>{
 const context=stateContext();
 const source=html.slice(html.indexOf(' async function request('),html.indexOf(' function forgetSession(){'));
 Object.assign(context,{AbortSignal,fetch:async()=>({ok:false,status:503,json:async()=>({error:'Classroom pilot is switched off.'})})});
 vm.runInNewContext(source+';this.request=request;',context);
 await assert.rejects(context.request('create'),error=>{
  assert.equal(error.serviceUnavailable,true);
  context.readFailure(error);
  return true;
 });
 assert.equal(context.state.ServiceUnavailable,true);
 context.fetch=async()=>({ok:false,status:400,json:async()=>({error:'Game not found or expired.'})});
 await assert.rejects(context.request('join'),error=>error.terminal===true&&error.serviceUnavailable===false);
});

test('offline activity Race uses the original URL and the same lobby controls',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../../shared/classroom-test-game.js'),'utf8');
 let now=1000;
 const context={URL,Date:{now:()=>now},crypto:{getRandomValues:()=>[397]},MLH:{classroomActivities:require('../../shared/classroom-activities.js')}};
 vm.runInNewContext(source,context);
 const activity='/wordsearch.html?level=N5#playnote=test';
 const offline=context.MLHClassroomTestGame.create({activity,gameType:'race'},[
  {name:'Tempo Fox',symbol:'gClef'},{name:'Cadence Gecko',symbol:'fermataAbove'},
 ]);
 assert.equal(offline.request('read').phase,'lobby');
 offline.request('remove',{playerId:'test-1'});
 const started=offline.request('start');
 assert.equal(started.phase,'playing');
 assert.equal(started.gameType,'activity-race');
 assert.equal(started.activity,activity);
 assert.equal(started.seed,397);
 assert.equal(started.startedAt,1000);
 assert.equal(started.players.length,1);
 assert.equal(started.players[0].finished,false);
 now+=120000;
 assert.equal(offline.request('read').winner,'Tempo Fox');
 assert.equal(offline.request('read').phase,'finished');
 assert.equal(offline.request('end').closed,true);
});

test('offline pupil losses finish the attempt without giving that pupil the win',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../../shared/classroom-test-game.js'),'utf8');
 const context={URL,crypto:{getRandomValues:()=>[397]},MLH:{classroomActivities:require('../../shared/classroom-activities.js')}};
 vm.runInNewContext(source,context);
 const create=context.MLHClassroomTestGame.create;
 const roster=[{name:'Tempo Fox'}];
 assert.throws(()=>create({activity:'/connections.html?level=N3',gameType:'race'},roster,()=>true),/Individual Practice/);
 const offline=create({activity:'/crosswords.html',gameType:'race'},roster,()=>true);
 offline.request('start');
 const failed=offline.pupil('finish',{solved:false});
 assert.equal(failed.myFinished,true);
 assert.equal(failed.players[0].solved,false);
 assert.equal(failed.phase,'finished');
 assert.equal(failed.winner,undefined);
});

for(const activity of ['/wordsearch.html?level=N5','/crosswords.html#playnote=fixture']){
test(`offline Race keeps the board total and each incremental word count for ${activity}`,()=>{
 const source=fs.readFileSync(path.join(__dirname,'../../shared/classroom-test-game.js'),'utf8');
 const context={URL,crypto:{getRandomValues:()=>[397]},MLH:{classroomActivities:require('../../shared/classroom-activities.js')}};
 vm.runInNewContext(source,context);
 const {create}=context.MLHClassroomTestGame;
 const settings={activity,gameType:'activity-race'};
 const roster=[{name:'Tempo Fox'},{name:'Piano Otter'}];
 const room=create(settings,roster,()=>true);
 room.request('start');
 assert.equal(room.pupil('finish',{correct:0,wordCount:8}).targetCorrect,8);
 room.pupil('finish',{correct:3,wordCount:8});
 const recovered=create(settings,roster,()=>true,undefined,room.snapshot());
 const progress=recovered.pupil('finish',{correct:2,wordCount:8});
 assert.equal(progress.phase,'playing');
 assert.equal(progress.players[0].correctCount,3);
 assert.equal(progress.players[1].correctCount,0);
 assert.throws(()=>recovered.pupil('finish',{correct:4,wordCount:4}),/Invalid word puzzle progress/);
 const complete=recovered.pupil('finish',{correct:8,wordCount:8});
 assert.equal(complete.winner,'Tempo Fox');
 assert.equal(complete.phase,'finished');
});
}

test('offline Millionaire tracks a retry through to fifteen correct answers',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../../shared/classroom-test-game.js'),'utf8');
 const context={URL,crypto:{getRandomValues:()=>[397]},MLH:{classroomActivities:require('../../shared/classroom-activities.js')}};
 vm.runInNewContext(source,context);
 const activity='/whowantstobemillionaire/whowantstobeamillionaire.html?level=N3';
 const room=context.MLHClassroomTestGame.create({activity,gameType:'activity-race'},[{name:'Tempo Fox'}],()=>true);
 assert.equal(room.request('start').targetCorrect,15);
 const partial=room.pupil('finish',{millionaireAttempt:1,correct:14});
 assert.equal(partial.players[0].correctCount,14);
 assert.equal(partial.phase,'playing');
 const retry=room.pupil('finish',{millionaireAttempt:2,correct:0});
 assert.equal(retry.players[0].correctCount,0);
 assert.equal(retry.myFinished,false);
 assert.equal(room.pupil('finish',{millionaireAttempt:1,correct:15}).phase,'playing');
 const win=room.pupil('finish',{millionaireAttempt:3,correct:15});
 assert.equal(win.winner,'Tempo Fox');
 assert.equal(win.phase,'finished');
});

test('offline Millionaire uses a separate pupil seed only when randomised',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../../shared/classroom-test-game.js'),'utf8');
 const context={URL,crypto:{getRandomValues:()=>[397]},MLH:{classroomActivities:require('../../shared/classroom-activities.js')}};
 vm.runInNewContext(source,context);
 const {create}=context.MLHClassroomTestGame;
 const activity='/whowantstobemillionaire/whowantstobeamillionaire.html?level=N3';
 const roster=[{name:'Tempo Fox'}];
 const shared=create({activity,gameType:'activity-race'},roster,()=>true);
 assert.equal(shared.pupil('read').seed,shared.request('read').seed);
 const settings={activity,gameType:'activity-race',randomiseQuestions:true};
 const randomised=create(settings,roster,()=>true);
 const pupil=randomised.pupil('read');
 assert.notEqual(pupil.seed,randomised.request('read').seed);
 assert.equal(pupil.activity,activity);
 const restored=create(settings,roster,()=>true,undefined,randomised.snapshot());
 assert.equal(restored.pupil('read').seed,pupil.seed);
});

test('offline literacy Race resets a streak and ignores scores from before the reset',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../../shared/classroom-test-game.js'),'utf8');
 const context={URL,crypto:{getRandomValues:()=>[397]},MLH:{classroomActivities:require('../../shared/classroom-activities.js')}};
 vm.runInNewContext(source,context);
 const game=context.MLHClassroomTestGame.create({activity:'/rhythmidentification.html?level=N5',gameType:'race',nativeStreak:true,targetStreak:3,raceMinutes:0},[
  {name:'Tempo Fox'},{name:'Piano Otter'},
 ],()=>true);
 game.request('start');
 game.pupil('finish',{attempted:1,streak:1,highestStreak:1});
 const reset=game.pupil('finish',{attempted:2,streak:0,highestStreak:1});
 assert.equal(reset.players[0].resetFrom,1);
 assert.equal(reset.players[0].streak,0);
 assert.equal(game.pupil('finish',{attempted:1,streak:1,highestStreak:1}).players[0].streak,0);
 const win=game.pupil('finish',{attempted:5,streak:3,highestStreak:3});
 assert.equal(win.phase,'finished');
 assert.equal(win.winner,'Tempo Fox');
});

test('offline Time Trial keeps accepting faster grids until the deadline',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../../shared/classroom-test-game.js'),'utf8');
 const classroomActivities=require('../../shared/classroom-activities.js');
 let now=1000;
 const context={URL,Date:{now:()=>now},crypto:{getRandomValues:()=>[397]},MLH:{classroomActivities}};
 vm.runInNewContext(source,context);
 const activity='/rhythmidentification.html?level=N3';
 const trial=context.MLHClassroomTestGame.create({activity,gameType:'rhythm-time-trial',raceMinutes:1},[
  {name:'Tempo Fox'},{name:'Cadence Gecko'},
 ],()=>true);
 const started=trial.request('start');
 assert.equal(started.deadline,61000);
 const url=classroomActivities.playUrl(activity,started.seed,null,true,started.startedAt,true);
 assert.match(url,/classroomTimeTrial=1/);
 now=17000;
 assert.equal(trial.pupil('finish',{solved:true}).players.find(p=>p.name==='Tempo Fox').bestTimeMs,null);
 assert.equal(trial.pupil('grid-finish',{elapsedMs:12000}).players[0].name,'Cadence Gecko');
 assert.equal(trial.pupil('grid-finish',{elapsedMs:8000}).players[0].name,'Tempo Fox');
 assert.equal(trial.pupil('grid-finish',{elapsedMs:9000}).players[0].bestTimeMs,8000);
 assert.equal(trial.request('read').phase,'playing');
 now=61000;
 assert.equal(trial.pupil('grid-finish',{elapsedMs:1000}).phase,'finished');
 assert.equal(trial.request('read').players[0].bestTimeMs,8000);
});

test('offline Concept Recall reports partial totals and rejects concepts after time expires',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../../shared/classroom-test-game.js'),'utf8');
 let now=1000;
 const context={URL,Date:{now:()=>now},crypto:{getRandomValues:()=>[397]},
  MLH:{classroomActivities:require('../../shared/classroom-activities.js')},
  CONCEPT_RECALL_CORE:require('../../concept-recall-core.js'),
  CONCEPT_RECALL_DATA:require('../../concept-recall-data.js')};
 vm.runInNewContext(source,context);
 const game=context.MLHClassroomTestGame.create({activity:'/conceptrecall.html?level=N5',gameType:'activity-race',recallMinutes:1},[
  {name:'Tempo Fox'},{name:'Cadence Gecko'}
 ],()=>true);
 const started=game.request('start');
 assert.equal(started.deadline,61000);
 assert.ok(started.targetCorrect>10);
 assert.equal(game.pupil('finish',{correct:9}).phase,'playing');
 assert.equal(game.request('read').players[0].correctCount,9);
 now=61000;
 const finished=game.pupil('finish',{correct:30});
 assert.equal(finished.phase,'finished');
 assert.equal(finished.finishReason,'time');
 assert.deepEqual(Array.from(finished.winners),['Tempo Fox']);
 assert.equal(finished.players[0].correctCount,9);
});

test('offline pupil can answer Quiz questions and advance their own Race',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../../shared/classroom-test-game.js'),'utf8');
 let now=1000;
 const context={Date:{now:()=>now},KeyboardNotes:{
  normaliseTypes:()=>[],create:()=>({next:()=>({correct:'C'})}),
  classroomAnswers:()=>[{id:'C'},{id:'D'}],
  classroomCorrect:(answer,question)=>answer.id===question.correct,
 }};
 vm.runInNewContext(source,context);
 const participants=[{name:'Tempo Fox',symbol:'gClef'}];
 const quiz=context.MLHClassroomTestGame.create({gameType:'quiz',count:2,questionTime:10},participants,()=>true);
 assert.equal(quiz.pupil('read').myName,'Tempo Fox');
 assert.equal(quiz.pupil('read').myScore,0);
 quiz.request('start');
 now+=400;
 assert.equal(quiz.request('read').phase,'question');
 const graded=quiz.pupil('answer',{index:0,answer:'C'});
 assert.equal(graded.host,false);
 assert.equal(graded.submitted,true);
 assert.equal(graded.myAnswer,'C');
 assert.equal(graded.phase,'review');
 assert.equal(graded.players[0].score,100);
 assert.equal(graded.myScore,100);
 assert.equal(graded.players[0].answer,undefined);
 quiz.request('next');
 assert.equal(quiz.pupil('read').myAnswer,null);
 assert.equal(quiz.pupil('read').myScore,100);
 const race=context.MLHClassroomTestGame.create({gameType:'race',targetStreak:2},participants,()=>true);
 race.request('start');
 assert.equal(race.pupil('answer',{index:0,answer:'C'}).index,1);
 assert.equal(race.pupil('answer',{index:1,answer:'D'}).lastCorrect,false);
 assert.equal(race.pupil('answer',{index:2,answer:'C'}).phase,'question');
 assert.equal(race.pupil('answer',{index:3,answer:'C'}).phase,'finished');
 assert.equal(race.request('read').winner,'Tempo Fox');
});

test('offline Accidentals Streak Race restores the pupil’s question and resets the streak after a mistake',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../../shared/classroom-test-game.js'),'utf8');
 const context={Date,URL,KeyboardNotes:require('../../keyboard-notes.js'),MLH:{
  classroomActivities:require('../../shared/classroom-activities.js'),
  classroomAccidentals:require('../../shared/classroom-accidentals.js'),
  classroomListening:require('../../shared/classroom-listening.js'),
 }};
 vm.runInNewContext(source,context);
 const setup={activity:'/accidentals.html?level=N5',gameType:'race',level:'N5',targetStreak:3};
 const players=[{name:'Tempo Fox'}];
 const game=context.MLHClassroomTestGame.create(setup,players,()=>true);
 game.request('start');
 const first=game.pupil('read').question;
 assert.equal(first.score.audio,undefined);
 const afterCorrect=game.pupil('answer',{index:0,answer:'accidental-choice:'+first.pitch});
 assert.equal(afterCorrect.players[0].streak,1);
 const restored=context.MLHClassroomTestGame.create(setup,players,()=>true,undefined,JSON.parse(JSON.stringify(game.snapshot())));
 assert.deepEqual(JSON.parse(JSON.stringify(restored.pupil('read').question)),JSON.parse(JSON.stringify(afterCorrect.question)));
 const wrong=(afterCorrect.question.pitch+1)%afterCorrect.question.score.choices.length;
 const afterWrong=restored.pupil('answer',{index:1,answer:'accidental-choice:'+wrong});
 assert.equal(afterWrong.lastCorrect,false);
 assert.equal(afterWrong.players[0].streak,0);
 assert.equal(afterWrong.players[0].highestStreak,1);
});

test('offline Accidentals Quiz uses the selected placement format and restores a submitted score answer',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../../shared/classroom-test-game.js'),'utf8');
 const adapter=require('../../shared/classroom-accidentals.js');
 const context={Date,URL,KeyboardNotes:require('../../keyboard-notes.js'),MLH:{
  classroomActivities:require('../../shared/classroom-activities.js'),
  classroomAccidentals:adapter,
  classroomListening:require('../../shared/classroom-listening.js'),
 }};
 vm.runInNewContext(source,context);
 const settings=Buffer.from(JSON.stringify({version:2,activity:'accidentals.html',state:{
  enabledQuestionTypes:['apply-score'],enabledAccidentals:['flat'],
 }})).toString('base64url');
 const setup={activity:'/accidentals.html?level=N5&settings='+settings,gameType:'quiz',count:5};
 const roster=[{name:'Tempo Fox'}];
 const {create}=context.MLHClassroomTestGame;
 const game=create(setup,roster,()=>true);
 const start=game.request('start');
 const correct=adapter.placementId(start.question.score.required[0]);
 assert.equal(start.phase,'question');
 assert.equal(game.pupil('read').question.score.required,undefined);
 assert.equal(game.pupil('answer',{index:0,placement:'accidental-placement:sharp:0:0'}).submitted,false);
 const reviewed=game.pupil('answer',{index:0,placement:correct});
 assert.equal(reviewed.correct,true);
 assert.equal(reviewed.phase,'review');
 assert.equal(reviewed.myAnswer,correct);
 const saved=JSON.parse(JSON.stringify(game.snapshot()));
 assert.ok(saved.quizRuntime.preparedQuestions.every(q=>q.score.questionType==='apply-score'&&!q.score.audio));
 assert.equal(create(setup,roster,()=>true,undefined,saved).pupil('read').myAnswer,correct);
});

test('offline Race rejects listening-only routes and audio collections',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../../shared/classroom-test-game.js'),'utf8');
 const context={URL,MLH:{
  classroomActivities:require('../../shared/classroom-activities.js'),
  classroomListening:require('../../shared/classroom-listening.js'),
 }};
 vm.runInNewContext(source,context);
 const create=(activity,material)=>context.MLHClassroomTestGame.create({activity,gameType:'activity-race'},[],()=>false,material);
 for(const activity of ['/melodicdictation.html','/chords.html?level=H','/conceptsort.html?classroomListening=1#playnote=fixture']){
  assert.throws(()=>create(activity),/requires audio/);
 }
 assert.throws(()=>create('/conceptsort.html#playnote=fixture',{collection:{activities:[{items:[{media:{type:'audio'}}]}]}}),/requires audio/);
});

test('offline native practice rooms retain the actual activity after the pupil finishes',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../../shared/classroom-test-game.js'),'utf8');
 const activities=require('../../shared/classroom-activities.js');
 const context={URL,Date,crypto:{getRandomValues:()=>[42]},MLH:{
  classroomActivities:activities,
  classroomListening:require('../../shared/classroom-listening.js'),
 }};
 vm.runInNewContext(source,context);
 const {create}=context.MLHClassroomTestGame;
 const roster=[{name:'Tempo Fox'}];
 const audioCollection={activities:[{items:[{media:{type:'audio'}}]}]};
 for(const activity of [
  '/chords.html?level=H&settings=profile','/rhythmicdictation.html?level=N5','/followthescore.html?level=H',
  '/repeatsigns.html?level=N5','/conceptsort.html#playnote=audioCollection',
 ]){
  const configuration={activity,gameType:'shared'};
  const room=create(configuration,roster,()=>true,{collection:audioCollection});
  const game=room.request('start');
  assert.equal(game.gameType,'shared');
  assert.equal(game.nativePractice,true);
  assert.equal(game.activity,activity);
  assert.equal(game.question,undefined);
  const pupilUrl=new URL(activities.playUrl(game.activity,game.seed,null,false,game.startedAt,false,true),'https://hub.test');
  assert.equal(pupilUrl.pathname,new URL(activity,'https://hub.test').pathname);
  assert.equal(pupilUrl.searchParams.get('classroomPractice'),'1');
  assert.equal(pupilUrl.searchParams.has('classroomRace'),false);
  assert.equal(pupilUrl.hash,new URL(activity,'https://hub.test').hash);
  const result=room.pupil('finish',{solved:true});
  assert.equal(result.myFinished,true);
  assert.equal(result.phase,'playing');
  const restored=create(configuration,roster,()=>true,undefined,JSON.parse(JSON.stringify(room.snapshot())));
  assert.equal(restored.pupil('read').nativePractice,true);
  assert.equal(restored.pupil('read').myFinished,true);
 }
});

test('offline Escape Room races count all six rooms and distinguish escape from game over',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../../shared/classroom-test-game.js'),'utf8');
 const context={URL,Date:{now:()=>1000},crypto:{getRandomValues:()=>[42]},MLH:{classroomActivities:require('../../shared/classroom-activities.js')}};
 vm.runInNewContext(source,context);
 const config={activity:'/musicescape.html?level=N3',gameType:'activity-race'};
 const roster=[{name:'Tempo Fox'}];
 const play=()=>{
  const race=context.MLHClassroomTestGame.create(config,roster,()=>true);
  assert.equal(race.request('start').targetCorrect,6);
  return race;
 };
 const race=play();
 for(let correct=1;correct<6;correct++){
  const result=race.pupil('finish',{correct});
  assert.equal(result.players[0].correctCount,correct);
  assert.equal(result.phase,'playing');
 }
 assert.equal(race.pupil('finish',{correct:6}).winner,'Tempo Fox');
 const failed=play().pupil('finish',{correct:2,solved:false});
 assert.equal(failed.players[0].correctCount,2);
 assert.equal(failed.myFinished,true);
 assert.equal(failed.phase,'finished');
 assert.equal(failed.winner,undefined);
});

test('offline pupil sees their own Dominoes card and can finish a shared activity',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../../shared/classroom-test-game.js'),'utf8');
 const context={Date,URL,crypto:{getRandomValues:()=>[42]},MLHDominoes:{
  hostedSet:()=>[{id:'concept'}],
  shuffle:rows=>rows,
  chain:()=>[{term:'Start',clue:'A repeated tune.'},{term:'Ostinato',clue:'End'}],
 }};
 vm.runInNewContext(source,context);
 const participants=[{name:'Tempo Fox',symbol:'gClef'},{name:'Jazz Penguin',symbol:'fermataAbove'}];
 const dominoes=context.MLHClassroomTestGame.create({gameType:'dominoes'},participants,()=>true);
 dominoes.request('start');
 assert.equal(dominoes.pupil('read').myCard.term,'Start');
 assert.equal(dominoes.pupil('read').testCards,undefined);
 dominoes.request('reveal');
 assert.equal(dominoes.pupil('read').phase,'finished');
 const shared=context.MLHClassroomTestGame.create({gameType:'shared'},participants,()=>true);
 shared.request('start');
 assert.equal(shared.pupil('read').myFinished,false);
 assert.equal(shared.pupil('finish').myFinished,true);
 assert.equal(shared.request('read').players[0].finished,true);
});

test('offline nicknames require the teacher to unlock editing and update both views',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../../shared/classroom-test-game.js'),'utf8');
 const context={Date,URL,crypto:{getRandomValues:()=>[42]}};
 vm.runInNewContext(source,context);
 const game=context.MLHClassroomTestGame.create({gameType:'shared'},[{name:'Tempo Fox'},{name:'JazzPenguin'}],()=>true);
 assert.equal(game.pupil('read').allowNicknames,false);
 assert.throws(()=>game.pupil('rename',{name:'Music Cat'}),/locked/);
 assert.throws(()=>game.pupil('nicknames',{allowNicknames:true}),/Only the teacher/);
 game.request('nicknames',{allowNicknames:true});
 assert.equal(game.pupil('read').allowNicknames,true);
 assert.throws(()=>game.pupil('rename',{name:'Jazz Penguin'}),/no spaces/);
 assert.throws(()=>game.pupil('rename',{name:'JazzPenguin'.repeat(2)}),/1–20/);
 assert.throws(()=>game.pupil('rename',{name:'jazzpenguin'}),/already taken/);
 assert.equal(game.pupil('rename',{name:'MusicCat'}).myName,'MusicCat');
 assert.equal(game.request('read').players[0].name,'MusicCat');
 assert.equal(game.pupil('rename',{name:'RhythmCat'}).myName,'RhythmCat');
 game.request('nicknames',{allowNicknames:false});
 assert.throws(()=>game.pupil('rename',{name:'RhythmCat'}),/locked/);
 assert.equal(game.pupil('read').myName,'Tempo Fox');
 assert.equal(game.request('read').players[0].name,'Tempo Fox');
 game.request('nicknames',{allowNicknames:true});
 assert.equal(game.pupil('read').myName,'Tempo Fox');
 game.request('start');
 assert.throws(()=>game.request('nicknames',{allowNicknames:true}),/before the game starts/);
});

test('Host routes listening activities to Quiz and written literacy to streak Race',()=>{
 assert.match(html,/\(conceptQuizSetup\|\|listeningSetup\)\?<HostedQuizSetup/);
 assert.match(html,/onStart\(\{activity,gameType:'quiz',count,questionTime\},bank.material\)/);
 assert.match(html,/gameType:'activity-race'/);
 assert.match(html,/literacyMode==='race'\?<LiteracyRaceSetup/);
 assert.match(html,/const practiceSrc=[\s\S]*?sharedActivities\.playUrl\(game\.activity,/);
 assert.match(html,/<PracticeFrame\s[\s\S]*?\bsrc=\{practiceSrc\}/);
 const React=require('react');
 const {renderToStaticMarkup}=require('react-dom/server');
 const {transform}=require('@babel/standalone');
 const control=html.match(/<select [^>]+value=\{raceMinutes\}[\s\S]*?<\/select>/)[0];
 const render=new Function('React','raceMinutes','setRaceMinutes','return '+transform(control,{presets:['react']}).code);
 const options=renderToStaticMarkup(render(React,3,()=>{}));
 assert.match(options,/<option value="3" selected="">3 minutes<\/option>/);
 assert.equal((options.match(/<option /g)||[]).length,11);
});

test('hosted Concept Quizzes use the selected formats, including individual audio ordering and musical features',async()=>{
 const quiz=require('../../shared/classroom-concept-quiz.js');
 const material=await quiz.loadMaterial();
 for(const level of ['N3','N4','N5','H','AH','ALL']){
  const activity=`/conceptquiz.html?level=${level}`;
  const order=quiz.questions(quiz.settings(activity+'&formats=order&text=0'),1,material)[0];
  if(order){
   const shown=quiz.publicQuestion(order,{host:false,reveal:false});
   assert.ok(shown.score.quiz.options.every(option=>option.media?.kind&&!option.answerLabel),level);
   assert.ok(shown.score.quiz.answer.correctOptionIds.every(id=>id===null),level);
  }
  if(['N5','H','AH','ALL'].includes(level)){
   const [features]=quiz.questions(quiz.settings(activity+'&formats=musical-features'),1,material);
   assert.equal(features.score.quiz.format,'musical-features',level);
   assert.equal(quiz.fraction(features.score.quiz,quiz.correctResponse(features.score.quiz)),1,level);
  }
  const formats='multiple-choice,short-answer,order,musical-features';
  const deck=quiz.questions(quiz.settings(activity+'&formats='+formats),10,material,()=>0.5);
  const questions=deck.map(question=>question.score.quiz);
  assert.equal(new Set(questions.slice(0,2).map(question=>question.modality)).size,2,level);
  assert.ok(new Set(questions.map(question=>question.format)).size>1,level);
  assert.ok(questions.every(question=>formats.split(',').includes(question.format)),level);
  for(const [flag,modality] of [['audio','text'],['text','audio']]){
   const selected=quiz.settings(activity+`&${flag}=0&formats=short-answer`);
   const singleType=quiz.questions(selected,10,material,()=>0.5);
   assert.ok(singleType.length>0,level);
   assert.ok(singleType.every(({score})=>score.quiz.modality===modality&&score.quiz.format==='short-answer'),level);
  }
 }
});

test('offline Concept Quiz pupils see only current host playback and replay',async()=>{
 const conceptQuiz=require('../../shared/classroom-concept-quiz.js');
 let now=1000;
 const context={URL,Date:{now:()=>now},KeyboardNotes:require('../../keyboard-notes.js'),MLH:{
  classroomActivities:require('../../shared/classroom-activities.js'),classroomConceptQuiz:conceptQuiz
 }};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../shared/classroom-test-game.js'),'utf8'),context);
 const config={activity:'/conceptquiz.html?level=N3&text=0&formats=multiple-choice',gameType:'quiz',questionTime:20,count:2};
 const quiz=context.MLHClassroomTestGame.create(config,[{name:'Tempo Fox'}],()=>true,await conceptQuiz.loadMaterial());
 assert.equal(quiz.request('start').phase,'listening');
 const excerptPlayback={index:0,phase:'listening'};
 assert.equal(quiz.pupil('read',{excerptPlayback}).playingAudio,false);
 quiz.request('read',{excerptPlayback});
 assert.equal(quiz.pupil('read').playingAudio,true);
 now+=4001;
 assert.equal(quiz.pupil('read').playingAudio,false);
 quiz.request('read',{excerptPlayback});
 const live=quiz.request('audio-ended',{index:0});
 assert.equal(live.phase,'question');
 assert.equal(live.playingAudio,false);
 quiz.request('read',{excerptPlayback:{index:0,phase:'question'}});
 assert.equal(quiz.pupil('read').playingAudio,true);
 quiz.request('read',{excerptPlayback:null});
 const stopped=quiz.pupil('read');
 assert.equal(stopped.playingAudio,false);
 assert.equal(stopped.deadline,live.deadline);
 const correct=conceptQuiz.correctResponse(live.question.score.quiz);
 quiz.pupil('answer',{index:0,response:correct});
 assert.equal(quiz.request('read').players[0].gained,100);
 assert.equal(quiz.request('next').phase,'listening');
 assert.throws(()=>quiz.pupil('skip-excerpt',{index:1}),/Only the teacher/);
 const skipped=quiz.request('skip-excerpt',{index:1});
 assert.equal(skipped.phase,'review');
 assert.equal(skipped.players[0].score,100);
 assert.equal(skipped.players[0].gained,0);
 assert.equal(quiz.request('next').phase,'finished');
});

test('an offline Concept Quiz restores the same question, timer and submitted answer',async()=>{
 const source=fs.readFileSync(path.join(__dirname,'../../shared/classroom-test-game.js'),'utf8');
 const conceptQuiz=require('../../shared/classroom-concept-quiz.js');
 let now=1000;
 const context={URL,Date:{now:()=>now},KeyboardNotes:require('../../keyboard-notes.js'),MLH:{
  classroomActivities:require('../../shared/classroom-activities.js'),classroomConceptQuiz:conceptQuiz
 }};
 vm.runInNewContext(source,context);
 const config={activity:'/conceptquiz.html?level=N5&sharedQuiz=1&ids=1&audio=0&formats=short-answer',gameType:'quiz',questionTime:20,count:1};
 const participants=[{name:'Tempo Fox'}];
 const create=context.MLHClassroomTestGame.create;
 const quiz=create(config,participants,()=>true,await conceptQuiz.loadMaterial());
 const started=quiz.request('start');
 const restore=()=>create(config,participants,()=>true,undefined,JSON.parse(JSON.stringify(quiz.snapshot())));
 const resumed=restore().pupil('read');
 assert.equal(resumed.question.score.quiz.id,started.question.score.quiz.id);
 assert.equal(resumed.deadline,started.deadline);
 now+=1000;
 const reviewed=quiz.pupil('answer',{index:0,response:'Blues'});
 assert.equal(reviewed.phase,'review');
 assert.equal(restore().pupil('read').correct,true);
 assert.equal(restore().pupil('read').quizRuntime,undefined);
});

test('offline room snapshots restore live scores and timers across host reload',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../../shared/classroom-test-game.js'),'utf8');
 let now=1000;
 const classroomActivities=require('../../shared/classroom-activities.js');
 const context={URL,Date:{now:()=>now},crypto:{getRandomValues:()=>[397]},MLH:{classroomActivities}};
 vm.runInNewContext(source,context);
 const {create}=context.MLHClassroomTestGame;
 const participants=[{name:'Tempo Fox'},{name:'Cadence Gecko'}];
 for(const [setup,action,answer] of [
  [{activity:'/accidentals.html?level=N5',gameType:'activity-race'},'finish',{correct:2}],
  [{activity:'/rhythmidentification.html?level=N3',gameType:'rhythm-time-trial',raceMinutes:1},'grid-finish',{elapsedMs:5000}],
 ]){
  const game=create(setup,participants,()=>true);
  const started=game.request('start');
  now+=6000;
  game.pupil(action,answer);
  const restored=create(setup,participants,()=>true,undefined,JSON.parse(JSON.stringify(game.snapshot())));
  const view=restored.pupil('read');
  assert.equal(view.startedAt,started.startedAt);
  assert.equal(view.deadline,started.deadline);
  assert.equal(view.seed,started.seed);
  const me=view.players.find(player=>player.name===view.myName);
  if(answer.correct)assert.equal(me.correctCount,answer.correct);
  else assert.equal(me.bestTimeMs,answer.elapsedMs);
 }
});

test('acknowledged progress stops retrying while a newer update stays queued',async()=>{
 const context=stateContext();
 let reply;
 Object.assign(context,{
  offlineGame:{current:null},AbortSignal,
  fetch:()=>new Promise(resolve=>{reply=()=>resolve({ok:true,json:async()=>({phase:'playing'})});}),
 });
 vm.runInNewContext(html.slice(html.indexOf(' async function request('),html.indexOf(' function forgetSession(){'))+';this.request=request;',context);
 context.finishPending.current={correct:1};
 const first=context.request('read');
 context.finishPending.current={correct:2};
 reply();
 await first;
 assert.equal(context.finishPending.current.correct,2);
 const second=context.request('read');
 reply();
 await second;
 assert.equal(context.finishPending.current,false);
});

test('timed Dominoes and Concept Sort accept retries, rank accuracy then time, and close at the deadline',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../../shared/classroom-test-game.js'),'utf8');
 const classroomActivities=require('../../shared/classroom-activities.js');
 let now;
 const context={URL,Date:{now:()=>now},crypto:{getRandomValues:()=>[397]},MLH:{classroomActivities},
  MLHDominoes:{hostedSet:()=>Array(12)}};
 vm.runInNewContext(source,context);
 for(const activity of ['/dominoes.html?level=N3','/conceptsort.html?level=N3']){
  now=1000;
  const settings={activity,gameType:'activity-race',retryRaceMinutes:1};
  const players=[{name:'Tempo Fox'},{name:'Piano Otter'}];
  let game=context.MLHClassroomTestGame.create(settings,players,()=>true);
  assert.equal(game.request('start').deadline,61000);
  const submit=(id,correct,elapsedMs)=>game.pupil('finish',{retryAttempt:{id,correct,total:12,elapsedMs}});
  const score=result=>classroomActivities.retryRaceScore(result.players[0]);
  now=18000;
  assert.equal(score(submit(1,6,1000)).correct,6);
  assert.equal(score(submit(2,8,2000)).correct,8);
  assert.equal(score(submit(1,6,1000)).correct,8);
  assert.equal(score(submit(3,12,12000)).elapsedMs,12000);
  const next=submit(4,12,9000);
  assert.equal(next.phase,'playing');
  assert.equal(next.myFinished,false);
  assert.equal(score(next).elapsedMs,9000);
  assert.equal(score(submit(5,12,11000)).elapsedMs,9000);
  assert.equal(submit(6,10,8000).players[0].retryAttempt.correct,10);
  const restored=JSON.parse(JSON.stringify(game.snapshot()));
  game=context.MLHClassroomTestGame.create(settings,players,()=>true,undefined,restored);
  now=61000;
  const finished=submit(7,12,500);
  assert.equal(finished.phase,'finished');
  assert.equal(score(finished).elapsedMs,9000);
  assert.deepEqual(Array.from(finished.winners),['Tempo Fox']);
 }
 const compare=classroomActivities.compareRetryRacePlayers;
 const slowPerfect={retryAttempt:{correct:12,total:12,elapsedMs:1500},retryPerfectMs:1500};
 const fastPartial={retryAttempt:{correct:11,total:12,elapsedMs:500}};
 assert.ok(compare(slowPerfect,fastPartial)<0);
 assert.ok(compare(fastPartial,{})<0);
 assert.equal(compare(slowPerfect,{...slowPerfect}),0);
});

test('race attempt times show tenths and only include minutes when needed',()=>{
 const source=html.slice(html.indexOf('function formatRaceAttemptTime('),html.indexOf('function TimedRaceResults('));
 const format=vm.runInNewContext(source+';formatRaceAttemptTime;',{});
 assert.equal(format(17743),'17.7s');
 assert.equal(format(59990),'59.9s');
 assert.equal(format(60000),'1:00.0');
 assert.equal(format(63000),'1:03.0');
});
