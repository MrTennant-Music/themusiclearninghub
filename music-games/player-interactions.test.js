const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const babel = require('@babel/standalone');
const C = require('./core.js');
const timer = require('./timer.js');
const context = {document:{createElement:()=>({getContext:()=>null}),body:{dataset:{}},fullscreenElement:null,addEventListener(){},removeEventListener(){}},React, performance, Math, window:{IGCore:C,IGTimer:timer,IGDiagramModel:require('./diagram-core.js')}};
for (const file of ['music-games/media.jsx','music-games/diagram.jsx','music-games/learning.jsx','music-games/arcade.jsx','music-games/session.jsx']) {
  let source = fs.readFileSync(file,'utf8');
  if (file === 'music-games/session.jsx') source = source.replace('  window.IGGameSession = GameSession;', '  window.TestGameSession=GameSession;window.IGGameSession=GameSession;');
  vm.runInNewContext(babel.transform(source,{presets:['react']}).code, context);
}



function launchHarness(reduced=false,{active=false,sound=true,activity:activityOverride,storage,soundPreferenceResolved=false}={}) {
  const slots=[],timers=new Map(),cleanups=[],sounds=[],clips=[];let cursor=0,started=0,restarted=0,now=0;
  const hooks={...React,
    useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}];},
    useRef(initial){const i=cursor++;return slots[i]||(slots[i]={current:initial});},
    useEffect(effect){const i=cursor++;if(!(i in slots)){slots[i]=true;const cleanup=effect();if(cleanup)cleanups.push(cleanup);}}
  };
  const sandbox={document:{createElement:()=>({getContext:()=>null}),body:{dataset:{}},fullscreenElement:null,addEventListener(){},removeEventListener(){}},React:hooks,performance:{now:()=>now},window:{MLH:{fadeOutAudio:async(audio,{reset}={})=>{audio.pause();if(reset)audio.currentTime=0;}},IGCore:{...C,readSoundPreference:fallback=>C.readSoundPreference(fallback,storage),saveSoundPreference:sound=>C.saveSoundPreference(sound,storage)},IGTimer:timer,IGLearning:context.window.IGLearning,IGArcade:context.window.IGArcade,matchMedia:()=>({matches:reduced}),IGSounds:{play(ctx,kind){sounds.push(kind);}},Audio:class{constructor(src){this.src=src;this.plays=0;this.pauses=0;clips.push(this);}play(){this.plays++;return Promise.resolve();}pause(){this.pauses++;}},AudioContext:class{resume(){return Promise.resolve();}close(){return Promise.resolve();}}},
    setInterval(){return 2;},clearInterval(){},
    setTimeout(fn,ms){timers.set(1,{fn,ms});return 1;},clearTimeout(id){timers.delete(id);}};
  const source=fs.readFileSync('music-games/session.jsx','utf8').replace('  window.IGGameSession = GameSession;', '  window.TestGameSession=GameSession;window.IGGameSession=GameSession;');
  vm.runInNewContext(babel.transform(source,{presets:['react']}).code,sandbox);
  const activity=activityOverride||C.normalize(C.SEEDS[0]);
  
  function render(){cursor=0;return sandbox.window.TestGameSession({activity,mode:activity.template,options:{...activity.options,sound},active,soundPreferenceResolved,externalControls:true,onStart(){started++;},onRestart(){restarted++;}});}
  function find(node){if(!node||typeof node!=='object')return; if(node.props?.['aria-label']==='Play activity')return node;for(const child of React.Children.toArray(node.props?.children)){const found=find(child);if(found)return found;}}
  function findBy(node,predicate){if(!node||typeof node!=='object')return;if(node.type?.name==='PlayerHeader')return findBy(node.type(node.props),predicate);if(predicate(node))return node;for(const child of React.Children.toArray(node.props?.children)){const found=findBy(child,predicate);if(found)return found;}}
  function complete(){const game=findBy(render(),node=>typeof node.props?.onComplete==='function');game.props.onComplete({correct:1,total:1,answers:[{prompt:'Question',answer:'Answer',expected:'Answer',correct:true}]});return render();}
  return {advanceTime(ms){now+=ms;},render,play:()=>find(render()),complete,findBy:(predicate)=>findBy(render(),predicate),timers,sounds,clips,get started(){return started;},get restarted(){return restarted;},dispose(){cleanups.forEach(fn=>fn());}};
}
test('Play animates once while the game remains paused, then starts after the fade',()=>{
  const h=launchHarness();const button=h.play();button.props.onClick();button.props.onClick();
  assert.equal(h.started,0);assert.equal(h.timers.size,1);assert.equal(h.timers.get(1).ms,420);
  assert.equal(h.play().props.disabled,true);assert.ok(h.render().props.className.includes('is-launching'));
  h.timers.get(1).fn();assert.equal(h.started,1);h.dispose();
});
test('leaving during the Play animation cancels the pending start',()=>{
  const h=launchHarness();h.play().props.onClick();h.dispose();assert.equal(h.timers.size,0);assert.equal(h.started,0);
});
test('Play keeps its launch animation when the device requests reduced motion',()=>{
  const h=launchHarness(true);h.play().props.onClick();assert.equal(h.started,0);assert.equal(h.timers.size,1);assert.equal([...h.timers.values()][0].ms,420);h.dispose();
});

test('game actions pair high lift and low release sounds without duplicate drops',()=>{
  const h=launchHarness(false,{active:true});const handlers=h.findBy(node=>typeof node.props?.onPointerDownCapture==='function').props;
  assert.equal(handlers.onInputCapture,undefined,'Typing into answer fields has no sound handler');
  const item={disabled:false};const drag={button:0,target:{closest:selector=>selector==='[draggable="true"]'?item:null}};
  handlers.onPointerDownCapture(drag);
  handlers.onDragStartCapture(drag);
  handlers.onPointerUpCapture();
  assert.deepEqual(h.sounds,['lift']);
  handlers.onDropCapture();
  handlers.onDragEndCapture();
  assert.deepEqual(h.sounds,['lift','drop']);
  handlers.onPointerDownCapture(drag);
  handlers.onPointerUpCapture();
  assert.deepEqual(h.sounds.slice(-2),['lift','drop']);
  handlers.onPointerDownCapture(drag);
  handlers.onDragStartCapture(drag);
  handlers.onDragEndCapture();
  assert.deepEqual(h.sounds.slice(-2),['lift','drop']);
  handlers.onDropCapture();
  handlers.onClickCapture({target:{closest:()=>({disabled:true,getAttribute:()=>null})}});
  assert.equal(h.sounds.length,6);h.dispose();
});
test('muted and unstarted games produce no interaction sounds',()=>{
  for(const config of [{active:true,sound:false},{active:false}]){
    const h=launchHarness(false,config);const handlers=h.findBy(node=>typeof node.props?.onPointerDownCapture==='function').props;
    handlers.onClickCapture({target:{closest:()=>({disabled:false,getAttribute:()=>null})}});
    handlers.onPointerDownCapture({button:0,target:{closest:selector=>selector==='[draggable="true"]'?{disabled:false}:null}});
    handlers.onDropCapture();
    assert.deepEqual(h.sounds,[]);h.dispose();
  }
});

test('supplied start and end clips play once and stop when leaving',()=>{
  const start=launchHarness();start.play().props.onClick();start.play().props.onClick();
  assert.equal(start.clips.length,1);assert.equal(start.clips[0].src,'./music-games/audio/gameplay.mp3');
  assert.equal(start.clips[0].plays,1);start.dispose();assert.equal(start.clips[0].pauses,1);
  function game(node){if(!node||typeof node!=='object')return;if(node.props?.onComplete)return node;for(const child of React.Children.toArray(node.props?.children)){const found=game(child);if(found)return found;}}
  const end=launchHarness(false,{active:true});const finish=game(end.render()).props.onComplete;
  finish({correct:1,total:1,answers:[]});finish({correct:1,total:1,answers:[]});
  assert.equal(end.clips.length,1);assert.equal(end.clips[0].src,'./music-games/audio/gameend.mp3');
  assert.equal(end.clips[0].plays,1);end.dispose();assert.equal(end.clips[0].pauses,1);
  const muted=launchHarness(false,{sound:false});muted.play().props.onClick();assert.equal(muted.clips.length,0);muted.dispose();
});
test('Review keeps the finished game board in place and Results reopens the same popover',()=>{
  const h=launchHarness(false,{active:true,activity:C.makeActivity({title:'Review matching game',template:'matching-pairs',items:[{prompt:'Loud',answer:'Forte',group:'Dynamics'},{prompt:'Quiet',answer:'Piano',group:'Dynamics'}]})});
  let tree=h.complete();
  let review=h.findBy(node=>node.type==='button'&&React.Children.toArray(node.props.children).some(child=>child==='Review'));
  assert.ok(review,'The Results popover offers Review');
  review.props.onClick();
  h.timers.get(1)?.fn();
  tree=h.render();
  assert.equal(h.findBy(node=>(node.props?.className||'').includes('ig-submitted-review')),undefined,'Review does not navigate to a separate answer-list screen');
  let results=h.findBy(node=>node.type==='button'&&React.Children.toArray(node.props.children).some(child=>child==='Results'));
  assert.ok(results,'The reviewed game has a Results button');
  assert.ok(results.props.className.includes('ig-check-action'),'Results reuses the Submit position and action styling');
  results.props.onClick();
  tree=h.render();
  assert.ok(h.findBy(node=>node.props?.role==='dialog'),'Results reopens over the finished game');
  h.dispose();
});

test('answer feedback plays supplied correct and wrong clips once per new answer',()=>{
  function game(node){if(!node||typeof node!=='object')return;if(node.props?.onProgress)return node;for(const child of React.Children.toArray(node.props?.children)){const found=game(child);if(found)return found;}}
  const h=launchHarness(false,{active:true,activity:C.makeActivity({template:'quiz',items:[{prompt:'Question',answer:'Answer'}]})}),report=game(h.render()).props.onProgress;
  const right={correct:1,total:2,answers:[{correct:true}]};
  report(right);report(right);
  assert.equal(h.clips.length,1);assert.equal(h.clips[0].src,'./music-games/audio/gamecorrect.mp3');assert.equal(h.clips[0].playbackRate,1.5);
  report({correct:1,total:2,answers:[{correct:true},{correct:false}]});
  assert.equal(h.clips.length,2);assert.equal(h.clips[1].src,'./music-games/audio/gamewrong.mp3?v=20261016-upload');
  assert.equal(h.clips[0].pauses,0,'Answer feedback may overlap without interrupting earlier clips');
  h.dispose();assert.equal(h.clips[1].pauses,1);
  for(const config of [{active:true,sound:false},{active:false}]){
    const silent=launchHarness(false,config);game(silent.render()).props.onProgress(right);
    assert.equal(silent.clips.length,0);silent.dispose();
  }
});

test('shared time control pauses and resumes the game and restarts the current activity',()=>{
 const h=launchHarness(false,{active:true});
 const trigger=h.findBy(node=>String(node.props?.className||'').split(' ').includes('ig-clock-trigger'));
 assert.ok(trigger);assert.equal(trigger.props['aria-haspopup'],'menu');trigger.props.onClick({detail:0});
 let action=h.findBy(node=>node.props?.role==='menuitem'&&node.props.children?.includes('Pause'));assert.ok(action);action.props.onClick();
 assert.ok(h.render().props.className.includes('is-paused'));
 h.findBy(node=>String(node.props?.className||'').split(' ').includes('ig-clock-trigger')).props.onClick({detail:0});
 action=h.findBy(node=>node.props?.role==='menuitem'&&node.props.children?.includes('Resume'));assert.ok(action);action.props.onClick();
 assert.ok(!h.render().props.className.includes('is-paused'));
 h.findBy(node=>String(node.props?.className||'').split(' ').includes('ig-clock-trigger')).props.onClick({detail:0});
 action=h.findBy(node=>node.props?.role==='menuitem'&&node.props.children?.includes('Restart'));action.props.onClick();
 assert.equal(h.restarted,1);h.dispose();
});


test('Match results review retains page navigation while answers stay read-only',()=>{
  const activity=C.makeActivity({title:'Many matches',template:'match-up',items:Array.from({length:24},(_,i)=>({id:'item'+i,prompt:'Clue '+i,answer:'Answer '+i}))});
  const h=launchHarness(true,{active:true,activity});h.complete();h.findBy(node=>node.props?.className==='ig-review-action').props.onClick();assert.equal(h.timers.size,0,'Reduced motion opens review immediately');
  const next=h.findBy(node=>node.props?.['aria-label']==='Next page');assert.ok(next);assert.equal(next.props.disabled,false);next.props.onClick({detail:0});
  assert.equal(h.findBy(node=>typeof node.props?.onComplete==='function').props.page,1);
  assert.equal(h.findBy(node=>node.props?.['aria-label']==='Previous page').props.disabled,false);
  assert.equal(h.findBy(node=>typeof node.props?.onComplete==='function').props.options.active,false);
  assert.ok(h.findBy(node=>node.props?.inert===''));
  h.dispose();
});


test('bulk answer reveal freezes the displayed and final play time',()=>{
 const activity=C.makeActivity({template:'group-sort',items:[{prompt:'Violin',group:'Strings'}]});
 const h=launchHarness(true,{active:true,activity});
 const game=h.findBy(n=>typeof n.props?.onSubmitAnswers==='function');
 h.advanceTime(5000);game.props.onSubmitAnswers();
 const clock=h.findBy(n=>n.type?.name==='ActivityTimer');assert.equal(clock.props.active,false);
 h.advanceTime(20000);h.complete();
 const score=h.findBy(n=>n.props?.className==='ig-scoreline');
 function text(n){return typeof n==='object'&&n?React.Children.toArray(n.props?.children).map(text).join(''):String(n??'');}
 assert.ok(text(score).includes('0:05'),'Reveal animation time must not be included in Results');h.dispose();
});
test('page controls require a press that started on the same control',()=>{
 const activity=C.makeActivity({template:'match-up',items:Array.from({length:24},(_,i)=>({id:'p'+i,prompt:'Prompt '+i,answer:'Answer '+i}))});
 const h=launchHarness(true,{active:true,activity});
 let next=h.findBy(n=>n.props?.['aria-label']==='Next page');const node={disabled:false};
 const event={button:0,pointerId:7,currentTarget:node,preventDefault(){},stopPropagation(){}};
 next.props.onPointerUp(event);assert.equal(h.findBy(n=>typeof n.props?.onComplete==='function').props.page,0);
 next.props.onPointerDown(event);next.props.onPointerUp(event);next.props.onClick({detail:1});
 assert.equal(h.findBy(n=>typeof n.props?.onComplete==='function').props.page,1);h.dispose();
});

test('the standalone audio button saves mute and restores it in a fresh session',()=>{
 const saved=new Map(),storage={getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value)};
 const controls=h=>h.findBy(node=>node.type?.name==='ResourceControls');
 const first=launchHarness(false,{storage});assert.equal(controls(first).props.sound,true);controls(first).props.onAudio();assert.equal(controls(first).props.sound,false);first.dispose();
 const second=launchHarness(false,{storage});assert.equal(controls(second).props.sound,false);controls(second).props.onAudio();assert.equal(controls(second).props.sound,true);second.dispose();
 const third=launchHarness(false,{storage});assert.equal(controls(third).props.sound,true);third.dispose();
});

test('resolved QR sound settings override conflicting recipient storage in the player',()=>{
 const controls=h=>h.findBy(node=>node.type?.name==='ResourceControls');
 for(const sound of [true,false]){
  const h=launchHarness(false,{sound,soundPreferenceResolved:true,storage:{getItem:()=>String(!sound)}});
  assert.equal(controls(h).props.sound,sound);h.dispose();
 }
});

test('Sort review exposes marked cards to assistive technology while keeping play stopped',()=>{
 const activity=C.makeActivity({template:'group-sort',items:[{prompt:'Violin',group:'Strings'}]}),h=launchHarness(true,{active:true,activity});h.complete();h.findBy(n=>n.props?.className==='ig-review-action').props.onClick();
 const wrapper=h.findBy(n=>n.props?.hidden===false&&Object.prototype.hasOwnProperty.call(n.props,'inert'));assert.ok(wrapper);assert.equal(wrapper.props.inert,undefined);const game=h.findBy(n=>typeof n.props?.onComplete==='function');assert.equal(game.props.options.active,false);h.dispose();
});

for(const template of ['crossword','wordsearch'])test(template+' results omit replay and medal while retaining review',()=>{
 const activity=C.makeActivity({template,items:[{prompt:'A keyboard instrument',answer:'Piano'}]}),h=launchHarness(true,{active:true,activity});
 h.complete();assert.equal(h.findBy(n=>n.props?.className==='ig-play-again-action'),undefined);
 assert.equal(h.findBy(n=>n.props?.className==='ig-result-medal'),undefined);
 assert.ok(h.findBy(n=>n.props?.className==='ig-review-action'));h.dispose();
});

for(const template of ['crossword','wordsearch'])test(template+' review keeps the board accessible and scrollable while play is stopped',()=>{
 const activity=C.makeActivity({template,items:[{prompt:'Keyboard',answer:'Piano'}]}),h=launchHarness(true,{active:true,activity});h.complete();h.findBy(n=>n.props?.className==='ig-review-action').props.onClick();
 const wrapper=h.findBy(n=>n.props?.hidden===false&&Object.prototype.hasOwnProperty.call(n.props,'inert'));assert.equal(wrapper.props.inert,undefined);
 assert.equal(h.findBy(n=>typeof n.props?.onComplete==='function').props.options.active,false);h.dispose();
});
