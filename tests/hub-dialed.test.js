const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const Core=require('../hub-dialed-core.js');

test('pitch ranges are logarithmic and scores are bounded, exact and fall with error',()=>{
  for(const mode of Object.keys(Core.MODES)){
    const {min,max}=Core.MODES[mode];
    assert.equal(Core.frequency(0,mode),min);
    assert.equal(Core.frequency(1,mode),max);
    assert(Math.abs(Core.frequency(.5,mode)-Math.sqrt(min*max))<1e-8);
    assert.equal(Core.score(.5,.5,mode),10);
    let previous=10;
    for(let step=1;step<=100;step++){
      const points=Core.score(.5,.5+step/200,mode);
      assert(points<=previous&&points>=0&&points<=10);previous=points;
    }
  }
  assert.equal(Core.score(NaN,.5),0);
  assert.equal(Core.score(.5,Infinity),0);
});

test('five rounds score once each, reveal results and reset without leaking previous answers',()=>{
  let state=Core.reducer(Core.initialState(),{type:'START',targets:[.2,.3,.4,.5,.6]});
  assert.equal(state.mode,'default');
  assert.deepEqual(Core.MODES.default,{min:60,max:1400,listenMs:4000});
  for(let round=1;round<=5;round++){
    assert.equal(state.phase,'countdown');assert.equal(state.round,round);
    assert.strictEqual(Core.reducer(state,{type:'SUBMIT',pick:.5}),state);
    state=Core.reducer(state,{type:'LISTEN'});
    state=Core.reducer(state,{type:'TUNE'});
    state=Core.reducer(state,{type:'SUBMIT',pick:state.targets[round-1]});
    assert.equal(state.phase,'feedback');assert.equal(state.total,round*10);
    assert.strictEqual(Core.reducer(state,{type:'SUBMIT',pick:0}),state);
    state=Core.reducer(state,{type:'NEXT'});
  }
  assert.equal(state.phase,'results');assert.equal(state.total,50);assert.equal(state.picks.length,5);
  state=Core.reducer(state,{type:'RESET'});
  assert.deepEqual(state,Core.initialState());
});

test('invalid target sets and out of sequence transitions cannot corrupt a run',()=>{
  const initial=Core.initialState();
  assert.strictEqual(Core.reducer(initial,{type:'START',targets:[NaN,0,0,0,0]}),initial);
  assert.strictEqual(Core.reducer(initial,{type:'START',targets:[.5]}),initial);
  assert.strictEqual(Core.reducer(initial,{type:'NEXT'}),initial);
  assert.strictEqual(Core.reducer(initial,{type:'TUNE'}),initial);
  const targets=Core.generateTargets(()=>.25);
  assert.equal(targets.length,5);assert(targets.every(value=>Math.abs(value-.3)<1e-10));
});

test('resuming an interrupted round preserves its target and earned score',()=>{
  let state=Core.reducer(Core.initialState(),{type:'START',targets:[.2,.3,.4,.5,.6]});
  state=Core.reducer(Core.reducer(state,{type:'LISTEN'}),{type:'TUNE'});
  state=Core.reducer(Core.reducer(state,{type:'SUBMIT',pick:.2}),{type:'NEXT'});
  state=Core.reducer(Core.reducer(state,{type:'LISTEN'}),{type:'TUNE'});
  const resumed=Core.reducer(state,{type:'REPEAT'});
  assert.equal(resumed.phase,'countdown');assert.equal(resumed.round,2);assert.equal(resumed.total,10);
  assert.deepEqual(resumed.targets,state.targets);assert.deepEqual(resumed.picks,state.picks);
});

function mockAudio(state='running'){
  const contexts=[];
  class Context{
    constructor(){this.state=state;this.currentTime=0;this.destination={};this.oscillators=[];this.closed=0;contexts.push(this);}
    resume(){this.state='running';return Promise.resolve();}
    close(){this.closed++;this.state='closed';return Promise.resolve();}
    createGain(){return {gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(){},cancelScheduledValues(){}},connect(){},disconnect(){}};}
    createOscillator(){const osc={frequency:{setValueAtTime(){},setTargetAtTime(){}},connect(){},disconnect(){},start(){},stop(){osc.stopped=true;}};this.oscillators.push(osc);return osc;}
  }
  const context=vm.createContext({AudioContext:Context});
  vm.runInContext(fs.readFileSync(require.resolve('../hub-dialed-core.js'),'utf8'),context);
  return {contexts,Audio:context.HubDialedCore.ToneAudio};
}
test('audio resumes from user interaction and stops every oscillator on disposal',async()=>{
  const {contexts,Audio}=mockAudio('suspended');const audio=new Audio();
  await audio.unlock();audio.start(440);audio.setFrequency(660);
  audio.start(220);assert(contexts[0].oscillators.slice(0,3).every(o=>o.stopped));
  audio.dispose();assert(contexts[0].oscillators.every(o=>o.stopped));assert.equal(contexts[0].closed,1);
  await assert.rejects(audio.unlock(),/closed/);
});

test('switching away during audio unlock cannot revive sound',async()=>{
  let finish;
  class Context{constructor(){this.state='suspended';}resume(){return new Promise(resolve=>{finish=()=>{this.state='running';resolve();};});}close(){this.state='closed';return Promise.resolve();}}
  const context=vm.createContext({AudioContext:Context});vm.runInContext(fs.readFileSync(require.resolve('../hub-dialed-core.js'),'utf8'),context);
  const audio=new context.HubDialedCore.ToneAudio(),unlock=audio.unlock();audio.dispose();finish();
  await assert.rejects(unlock,/closed/);
  assert.throws(()=>audio.start(440));
});

test('Pitched renders the native game with the shared footer and no external-game disclaimer',()=>{
  const source=fs.readFileSync(require.resolve('../pitched.jsx'),'utf8');
  assert(source.includes('<window.MLH.HubDialed'));
  assert(!/iframe|playdaily|Songless|Layered|pitched-modes/.test(source));
  assert(source.includes('title="Pitched"'));
  assert(fs.readFileSync(require.resolve('../pitched.html'),'utf8').includes('footer.js'));
  assert(!source.includes('pitched-source'));
  assert(!fs.readFileSync(require.resolve('../pitched.html'),'utf8').includes('dialedgg.io'));
});

test('Pitched medals use the completed score thresholds out of fifty',()=>{
 for(const [score,tier] of [[0,null],[30,null],[30.01,'bronze'],[34.99,'bronze'],[35,'silver'],[39.99,'silver'],[40,'gold'],[48.99,'gold'],[49,'diamond'],[50,'diamond'],[NaN,null],[51,null]])assert.equal(Core.medalForScore(score),tier,String(score));
});

test('Pitched awards persist as a single activity without inventing a qualification',()=>{
 const storage=new Map([['mlh:achievements:v1',JSON.stringify({version:1,records:{'bandle.html|ALL':{tier:'silver',bestStreak:0}}})]]);
 const window={MLH:{},location:{href:'https://hub.local/pitched.html'},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},addEventListener(){},dispatchEvent(){}};
 const context={window,URL,CustomEvent:class{}};
 vm.runInNewContext(fs.readFileSync('shared/hub-page-names.js','utf8'),context);
 vm.runInNewContext(fs.readFileSync('shared/hub-achievements.js','utf8'),context);
 assert.equal(window.MLH.achievements.get('pitched.html','ALL').tier,'silver');
 window.MLH.achievements.award('pitched.html','ALL','gold');window.MLH.achievements.award('pitched.html','ALL','bronze');assert.equal(window.MLH.achievements.get('pitched.html','ALL').tier,'gold');
 vm.runInNewContext(fs.readFileSync('shared/hub-achievements.js','utf8'),context);assert.equal(window.MLH.achievements.get('pitched.html','ALL').tier,'gold');assert.equal(window.MLH.achievements.totals().gold,1);assert.equal(window.MLH.achievements.get('random.html','ALL'),null);
});

test('only rounds four and five follow the original target with one-second distractors with a second of silence before and after',()=>{
 for(const target of [.1,.5,.9])for(let round=1;round<=5;round++)for(const rng of [()=>0,()=>1,()=>.5]){
  const sequence=Core.listeningSequence(target,round,'default',rng),extra=round===4?1:round===5?2:0;
  assert.equal(sequence.tones.length,1+extra);assert.equal(sequence.tones[0].pitch,target);assert.equal(sequence.tones[0].durationMs,4000);
  for(let i=1;i<sequence.tones.length;i++){
   const tone=sequence.tones[i],previous=sequence.tones[i-1];assert(tone.pitch>=0&&tone.pitch<=1);assert(Math.abs(tone.pitch-target)>=.12);assert.equal(tone.startMs,4000+1000+(i-1)*1000);assert.equal(tone.durationMs,1000);
   for(let j=1;j<i;j++)assert(Math.abs(tone.pitch-sequence.tones[j].pitch)>=.1);
  }
  assert.equal(sequence.durationMs,extra?sequence.tones.at(-1).startMs+2000:4000);
 }
});

test('listening playback waits for all distractors and cancels every pending tone on reset',()=>{
 const plan=Core.listeningSequence(.5,5,'default',()=>0);
 for(const reset of [false,true]){
  const queue=[],played=[];let completed=false,stops=0;
  const stop=Core.playListeningSequence({start:hz=>played.push(hz),stop:()=>stops++},plan,{onComplete:()=>completed=true,schedule:(fn,ms)=>{const item={fn,ms,cancelled:false};queue.push(item);return item;},cancel:item=>item.cancelled=true});
  assert.deepEqual(played,[Core.frequency(.5)]);assert.equal(completed,false);
  if(reset)stop();
  for(const item of queue.sort((a,b)=>a.ms-b.ms))if(!item.cancelled)item.fn();
  assert.equal(played.length,reset?1:3);assert.equal(completed,!reset);assert(stops>0);
 }
});

test('listening playback reports an audio failure and does not schedule more tones',()=>{
 let error,scheduled=0;
 Core.playListeningSequence({start(){throw Error('Audio unavailable');},stop(){}},Core.listeningSequence(.4,4),{onError:e=>error=e,schedule:()=>scheduled++});
 assert.equal(error.message,'Audio unavailable');assert.equal(scheduled,0);
});

test('Pitched uses the shared stats panel and shared medal sounds only on the final results screen',()=>{
 const source=fs.readFileSync('pitched.jsx','utf8');assert(source.includes('<window.MLH.ScoreStreakPanel'));assert(!source.includes('details.pitched-score-card'));
 for(const [total,points,tier,sound]of [[30,.5,null,null],[30.01,1,'bronze','bronze'],[35,5,'silver','silver'],[40,5,'gold','gold'],[49,9,'diamond','platinum'],[41,1,'gold','gold']]){
  for(const phase of ['feedback','results']){
  const state={...Core.initialState(),phase,round:5,total,targets:[.2,.3,.4,.5,.6],picks:[.2,.3,.4,.5,.6],roundScores:[0,0,0,0,points]},effects=[],sounds=[],awards=[],confetti=[];
  let stateIndex=0;
  const React={createElement:(type,props,...children)=>({type,props,children}),useReducer:()=>[state,()=>{}],useState:initial=>{const index=stateIndex++;return [typeof initial==='function'?initial():initial,v=>{if(index===0)confetti.push(v(0));}];},useRef:value=>({current:value}),useEffect:fn=>effects.push(fn)};
  const window={HubDialedCore:{...Core,ToneAudio:class{stop(){}reveal(){}dispose(){}}},MLH:{achievements:{award:(...args)=>awards.push(args)},playFeedbackSound:(...args)=>{sounds.push(args);return Promise.resolve();}}};
  vm.runInNewContext(fs.readFileSync('hub-dialed.js','utf8'),{window,React,localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){}});
  window.MLH.HubDialed({});effects.find(fn=>fn.toString().includes('const previous='))();
  const celebrates=phase==='results'&&tier;assert.deepEqual(sounds,celebrates?[[true,true,sound]]:[]);assert.equal(confetti.length,celebrates?1:0);assert.equal(awards.length,celebrates?1:0);if(celebrates)assert.deepEqual(awards[0],['pitched.html','ALL',tier]);
  }
 }
});

test('shared stats display overrides preserve standard labels and popup styling by default',()=>{
 const source=fs.readFileSync('shared/hub-shell.js','utf8'),start=source.indexOf('  function ScoreStreakPanel('),end=source.indexOf('\n  MLH.AppHeader',start);
 function render(props,popover=null){let i=0;const React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity)}),useState:initial=>[i++===0?popover:initial,()=>{}],useRef:initial=>({current:initial}),useEffect(){},useLayoutEffect(){}};const context={React,MLH:{shell:{scoreTileClass:'tile',scoreTileActiveClass:'active'}},useClickAway(){}};vm.runInNewContext(source.slice(start,end)+';this.Panel=ScoreStreakPanel;',context);return context.Panel({assets:{bronze:'b',silver:'s',gold:'g',diamond:'d'},correct:12,attempted:13,accuracy:92,streak:12,bestStreak:12,resetScore(){},...props});}
 const flatten=n=>!n||typeof n!=='object'?[n]:[n,...n.children.flatMap(flatten)],text=n=>flatten(n).filter(v=>typeof v==='string').join(' ');
 const standard=render({});assert(text(standard).includes('Accuracy: 92%'));assert(text(standard).includes('Highest: 12'));assert(text(standard).includes('Streak'));
 const pitched=render({scoreDisplay:{label:'Round',value:'4/5',subtitle:' ',fillPercent:0},streakDisplay:{label:'Score',value:'35/50',subtitle:'Best score: 49'},streak:35,medalThresholdValues:[30.01,35,40,49],medalThresholdLabels:[30,35,40,49]},'streak');
 assert(text(pitched).includes('Round'));assert(text(pitched).includes('35/50'));assert(text(pitched).includes('Best score: 49'));assert(!text(pitched).includes('30.01'));assert(flatten(pitched).some(n=>n?.props?.style?.animation?.includes('medalPopupIn')));
 const awaitingMedal=render({streak:49.61,medalColourStreak:40,medalThresholdValues:[30.01,35,40,49]});
 assert.equal(awaitingMedal.children.filter(n=>n?.type==='section').at(-1).props.style.backgroundColor,'rgba(250, 204, 21, .25)');
});

test('target progress empties before the round-four and round-five distractor subtitles appear',()=>{
 for(const round of [3,4,5]){
  let cursor=0;const values=[],effects=[],timers=[];
  const state={...Core.initialState(),phase:'listen',round,targets:[.2,.3,.4,.5,.6]},React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity)}),useReducer:()=>[state,()=>{}],useState:initial=>{const i=cursor++;if(!(i in values))values[i]=typeof initial==='function'?initial():initial;return [values[i],v=>values[i]=typeof v==='function'?v(values[i]):v];},useRef:current=>({current}),useEffect:fn=>effects.push(fn)};
  const window={HubDialedCore:{...Core,ToneAudio:class{stop(){}},playListeningSequence:()=>()=>{}},MLH:{}};
  vm.runInNewContext(fs.readFileSync('hub-dialed.js','utf8'),{window,React,localStorage:{getItem:()=>null},setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length;},clearTimeout(){},setInterval(){},clearInterval(){}});
  const flat=n=>n&&typeof n==='object'?[n,...n.children.flatMap(flat)]:[n],render=()=>{cursor=0;return window.MLH.HubDialed({});};
  let tree=render();effects.find(fn=>fn.toString().includes('playListeningSequence'))();
  const progress=flat(tree).find(n=>n?.props?.className==='hd-listen-progress');assert.equal(progress.children[0].props.style.animationDuration,'4000ms');assert.equal(progress.props['aria-label'],'Listening to the Target Tone');
  assert(!flat(tree).includes('Don’t get distracted!'));assert.equal(timers.length,round>=4?1:0);
  if(round>=4){assert.equal(timers[0].ms,4000);timers[0].fn();tree=render();assert(flat(tree).includes('Don’t get distracted!'));assert(flat(tree).some(text=>Core.DISTRACTOR_SUBTITLES.includes(text)));assert(flat(tree).some(n=>n?.props?.['aria-label']==='Distractor tones'));const firstDistractor=Core.listeningSequence(state.targets[round-1],round).tones[1];assert.equal(firstDistractor.startMs,5000);const pulse=flat(tree).find(n=>n?.props?.className==='hd-distractor-fill');assert.equal(pulse.props.style.animationDelay,'1000ms');assert.equal(pulse.props.style.animationDuration,'1000ms');assert.equal(pulse.props.style.animationIterationCount,round===4?1:2);}
 }
});


test('distractor subtitles shuffle through the full pool before repeating, including across cycles',()=>{
 for(const rng of [()=>0,()=>.5,()=>1,Math.random]){
  const next=Core.createDistractorSubtitlePicker(rng);let previous;
  for(let cycle=0;cycle<4;cycle++){const batch=Array.from({length:Core.DISTRACTOR_SUBTITLES.length},()=>next());assert.equal(new Set(batch).size,Core.DISTRACTOR_SUBTITLES.length);assert.notEqual(batch[0],previous);assert(batch.every(s=>Core.DISTRACTOR_SUBTITLES.includes(s)));previous=batch.at(-1);}
 }
});

test('feedback dial uses the matching scale for both pitches and keeps exact matches visible',()=>{
 assert.deepEqual(Core.dialPoint(.5),{x:160,y:65});
 assert(Core.dialPoint(0).x<160);assert(Core.dialPoint(1).x>160);
 for(const value of [0,.1,.5,.9,1]){
  const pick=Core.dialPoint(value),target=Core.dialPoint(value,99);
  assert(Math.abs(Math.hypot(pick.x-160,pick.y-148)-83)<1e-10);
  assert(Math.abs((pick.x-160)*(target.y-148)-(pick.y-148)*(target.x-160))<1e-10);
 }
 const source=fs.readFileSync('hub-dialed.js','utf8'),start=source.indexOf('function Dial('),end=source.indexOf('function HubDialed(',start);
 const React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity)})},context={React,C:Core,useRef:()=>({current:null}),hz:v=>`${v.toFixed(1)} Hz`};
 vm.runInNewContext(source.slice(start,end)+';this.Dial=Dial;',context);
 const flatten=n=>n&&typeof n==='object'?[n,...n.children.flatMap(flatten)]:[n];
 for(const [value,target]of [[.2,.8],[.5,.5]]){
  const tree=context.Dial({value,comparisonValue:target,interactive:false}),nodes=flatten(tree),needle=nodes.find(n=>n?.props?.className==='hd-dial-needle'),targetNeedle=nodes.find(n=>n?.props?.className==='hd-dial-target');
  assert.equal(tree.props.role,'img');assert(!nodes.some(n=>n?.type==='input'));
  assert.equal(needle.props.x2,Core.dialPoint(value).x);assert.equal(targetNeedle.props.x2,Core.dialPoint(target,99).x);
  assert(nodes.some(n=>n?.props?.className==='hd-dial-gap'));
 }
});


test('round feedback plays the supplied chime and stops it when leaving feedback',()=>{
 const state={...Core.initialState(),phase:'feedback',round:1,targets:[.4],picks:[.4],roundScores:[10],total:10},effects=[],clips=[];
 const React={createElement:()=>null,useReducer:()=>[state,()=>{}],useState:v=>[typeof v==='function'?v():v,()=>{}],useRef:v=>({current:v}),useEffect:fn=>effects.push(fn)};
 class Audio{constructor(src){this.src=src;this.played=false;this.paused=false;clips.push(this);}play(){this.played=true;return Promise.resolve();}pause(){this.paused=true;}}
 const window={HubDialedCore:{...Core,ToneAudio:class{stop(){}dispose(){}}},MLH:{}};
 vm.runInNewContext(fs.readFileSync('hub-dialed.js','utf8'),{window,React,Audio,localStorage:{getItem:()=>null},setTimeout,clearTimeout,setInterval,clearInterval});
 window.MLH.HubDialed({});const cleanup=effects.find(fn=>fn.toString().includes('playListeningSequence'))();
 assert.equal(clips.length,1);assert.equal(clips[0].src,'./audio/chime.mp3');assert.equal(clips[0].played,true);cleanup();assert.equal(clips[0].paused,true);
});


test('earned medals persist and repeated medals do not celebrate again',()=>{
 assert(fs.readFileSync('pitched.jsx','utf8').includes('Math.max(stats.score,stats.best)'));
 for(const [previous,total,celebrates] of [[40,35,false],[40,40,false],[40,48,false],[40,49,true],[49,50,false]]){
  const effects=[],sounds=[],bursts=[],state={...Core.initialState(),phase:'results',round:5,total,targets:[.5,.5,.5,.5,.5],picks:[.5,.5,.5,.5,.5],roundScores:[1,1,1,1,1]};let i=0;
  const React={createElement:()=>null,useReducer:()=>[state,()=>{}],useState:v=>{const index=i++;return [typeof v==='function'?v():v,next=>{if(index===0)bursts.push(next(0));}];},useRef:v=>({current:v}),useEffect:fn=>effects.push(fn)};
  const window={HubDialedCore:{...Core,ToneAudio:class{}},MLH:{achievements:{award(){}},playFeedbackSound:(...args)=>{sounds.push(args);return Promise.resolve();}}};
  vm.runInNewContext(fs.readFileSync('hub-dialed.js','utf8'),{window,React,localStorage:{getItem:()=>String(previous),setItem(){}},setTimeout,clearTimeout,setInterval,clearInterval});
  window.MLH.HubDialed({});effects.find(fn=>fn.toString().includes('const previous='))();assert.equal(sounds.length,celebrates?1:0);assert.equal(bursts.length,celebrates?1:0);
 }
});


test('audio failure remains visible after resetting to intro',()=>{
 const effects=[],errors=[],state=Core.initialState();let index=0;
 const React={createElement:()=>null,useReducer:()=>[state,()=>{}],useState:v=>{const i=index++;return [i===5?'Audio could not start.':typeof v==='function'?v():v,next=>{if(i===5)errors.push(next);}];},useRef:v=>({current:v}),useEffect:fn=>effects.push(fn)};
 const window={HubDialedCore:{...Core,ToneAudio:class{stop(){}}},MLH:{}};
 vm.runInNewContext(fs.readFileSync('hub-dialed.js','utf8'),{window,React,localStorage:{getItem:()=>null},setTimeout,clearTimeout,setInterval,clearInterval});
 window.MLH.HubDialed({});effects.find(fn=>fn.toString().includes('playListeningSequence'))();assert.deepEqual(errors,[]);
});

test('an unavailable saved-best store cannot lower the best score already held in the game',()=>{
 const effects=[],saved=[],state={...Core.initialState(),phase:'results',round:5,total:20,targets:[.5,.5,.5,.5,.5],picks:[.5,.5,.5,.5,.5],roundScores:[4,4,4,4,4]};let index=0;
 const React={createElement:()=>null,useReducer:()=>[state,()=>{}],useState:v=>{const i=index++;return [i===9?40:typeof v==='function'?v():v,next=>{if(i===9)saved.push(next);}];},useRef:v=>({current:v}),useEffect:fn=>effects.push(fn)};
 const window={HubDialedCore:{...Core,ToneAudio:class{}},MLH:{}};
 vm.runInNewContext(fs.readFileSync('hub-dialed.js','utf8'),{window,React,localStorage:{getItem(){throw Error('Storage unavailable');},setItem(){throw Error('Storage unavailable');}},setTimeout,clearTimeout,setInterval,clearInterval});
 window.MLH.HubDialed({});effects.find(fn=>fn.toString().includes('const previous='))();assert.deepEqual(saved,[40]);
});


test('Endurance continues past round five, awards surviving rounds, and stops on the first failure',()=>{
 let state=Core.reducer(Core.initialState('endurance'),{type:'START',mode:'endurance',targets:[.5,.5,.5,.5,.5]});
 for(let round=1;round<=15;round++){
  assert.equal(state.round,round);state=Core.reducer(Core.reducer(state,{type:'LISTEN'}),{type:'TUNE'});
  state=Core.reducer(state,{type:'SUBMIT',pick:state.targets[round-1]});assert.equal(state.roundScores.at(-1),10);assert.equal(Core.completedRounds(state),round);
  state=Core.reducer(state,{type:'NEXT',target:.5});assert.equal(state.phase,'countdown');
 }
 state=Core.reducer(Core.reducer(state,{type:'LISTEN'}),{type:'TUNE'});state=Core.reducer(state,{type:'SUBMIT',pick:0});assert(state.roundScores.at(-1)<8);assert.equal(Core.completedRounds(state),15);
 state=Core.reducer(state,{type:'NEXT'});assert.equal(state.phase,'results');assert.equal(state.round,16);assert.equal(state.picks.length,16);
 let early=Core.reducer(Core.initialState('endurance'),{type:'START',mode:'endurance',targets:[.5,.5,.5,.5,.5]});early=Core.reducer(Core.reducer(early,{type:'LISTEN'}),{type:'TUNE'});early=Core.reducer(early,{type:'SUBMIT',pick:0});early=Core.reducer(early,{type:'NEXT'});assert.equal(early.phase,'results');assert.equal(Core.completedRounds(early),0);assert.equal(early.picks.length,1);
 const boundary={...Core.initialState('endurance'),phase:'feedback',round:1,roundScores:[8],targets:[.5,.5,.5,.5,.5]};assert.equal(Core.reducer(boundary,{type:'NEXT'}).phase,'countdown');
 for(const [round,tier]of [[0,null],[2,null],[3,'bronze'],[4,'bronze'],[5,'silver'],[6,'silver'],[7,'gold'],[9,'gold'],[10,'diamond'],[100,'diamond']])assert.equal(Core.enduranceMedal(round),tier);
});

test('Endurance distractors grow without exhausting the pitch pool and preserve one-second pauses',()=>{
 for(const round of [1,3,4,5,6,7,10,30,100])for(const random of [()=>0,()=>1,()=>.5]){
  const plan=Core.listeningSequence(.5,round,'endurance',random),count=Math.max(0,round-3);assert.equal(plan.tones.length,count+1);
  for(let i=1;i<plan.tones.length;i++){const tone=plan.tones[i];assert(Number.isFinite(tone.pitch));assert(Math.abs(tone.pitch-.5)>=.12);assert.equal(tone.startMs,5000+(i-1)*1000);assert.equal(tone.durationMs,1000);if(i>1)assert(Math.abs(tone.pitch-plan.tones[i-1].pitch)>=.1);}
  assert.equal(plan.durationMs,count?6000+count*1000:4000);
 }
});


test('Endurance saves completed rounds and celebrates only new round-based medal thresholds',()=>{
 for(const [previous,passed,points,expectedSound]of [[0,3,9,'bronze'],[3,4,9,null],[4,5,8,'silver'],[6,7,10,'gold'],[9,10,9,'platinum'],[10,11,9,null],[2,2,7.99,null]]){
  const scores=Array.from({length:passed},()=>9);if(points<8)scores.push(points);else scores[scores.length-1]=points;
  const state={...Core.initialState('endurance'),phase:'feedback',round:scores.length,total:scores.reduce((a,b)=>a+b,0),targets:scores.map(()=>.5),picks:scores.map(()=>.5),roundScores:scores},effects=[],sounds=[],storage=[];let index=0;
  const React={createElement:()=>null,useReducer:()=>[state,()=>{}],useState:v=>{const i=index++;return [i===9?previous:typeof v==='function'?v():v,()=>{}];},useRef:v=>({current:v}),useEffect:fn=>effects.push(fn)};
  const window={HubDialedCore:{...Core,ToneAudio:class{}},MLH:{achievements:{award(){}},playFeedbackSound:(...args)=>{sounds.push(args);return Promise.resolve();}}};
  vm.runInNewContext(fs.readFileSync('hub-dialed.js','utf8'),{window,React,localStorage:{getItem:()=>String(previous),setItem:(key,value)=>storage.push([key,value])},setTimeout,clearTimeout,setInterval,clearInterval});
  window.MLH.HubDialed({});effects.find(fn=>fn.toString().includes('const previous='))();assert.deepEqual(storage,[['mlh-dialed-best-endurance',String(Math.max(previous,passed))]]);assert.deepEqual(sounds,expectedSound?[[true,true,expectedSound]]:[]);
 }
});


test('Endurance feedback below eight is red while eight and above is green',()=>{
 for(const [mode,points,colour] of [['endurance',7.54,'red'],['endurance',7.99,'red'],['endurance',8,'green'],['endurance',9,'green'],['default',7.54,'green']]){
  const state={...Core.initialState(mode),phase:'feedback',round:1,total:points,targets:[.5],picks:[.5],roundScores:[points]};
  const React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity)}),useReducer:()=>[state,()=>{}],useState:v=>[typeof v==='function'?v():v,()=>{}],useRef:v=>({current:v}),useEffect(){}};
  const window={HubDialedCore:{...Core,ToneAudio:class{}},MLH:{}};
  vm.runInNewContext(fs.readFileSync('hub-dialed.js','utf8'),{window,React,localStorage:{getItem:()=>null}});
  const flat=n=>n&&typeof n==='object'?[n,...n.children.flatMap(flat)]:[n],tree=window.MLH.HubDialed({});
  assert(flat(tree).some(n=>n?.props?.className===`hd-stage hd-feedback hd-score-${colour}`));
 }
});

function appHarness(savedMode){
 const storage=new Map(savedMode==null?[]:[['mlh-pitched-game-type',savedMode]]),values=[],refs=[],effects=[];let cursor=0,refCursor=0,root;
 const React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity)}),useState:initial=>{const i=cursor++;if(!(i in values))values[i]=typeof initial==='function'?initial():initial;return [values[i],v=>values[i]=typeof v==='function'?v(values[i]):v];},useRef:initial=>{const i=refCursor++;return refs[i]||(refs[i]={current:initial});},useEffect:fn=>effects.push(fn)};
 const MLH={shell:{},useProfileState:(_key,initial)=>React.useState(initial),useClickOutside(){},ScoreStreakPanel:()=>null,AppHeader:()=>null,ToolbarButton:()=>null,MenuPanel:()=>null,LevelMenu:()=>null,HubDialed:()=>null};
 vm.runInNewContext(fs.readFileSync('pitched-app.js','utf8'),{React,ReactDOM:{createRoot:()=>({render:v=>root=v})},window:{MLH},document:{getElementById:()=>({}),fullscreenEnabled:true},location:{href:'http://localhost:8765/pitched.html'},URL,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}});
 const render=()=>{cursor=0;refCursor=0;effects.length=0;return root.type();},flat=n=>n&&typeof n==='object'?[n,...n.children.flatMap(flat)]:[n];
 return {MLH,storage,render,flat,effects};
}

test('Game Type selection persists, restores valid settings and safely rejects invalid saved modes',()=>{
 for(const saved of [null,'default','endurance','unknown']){
  const h=appHarness(saved),tree=h.render(),game=h.flat(tree).find(n=>n?.type===h.MLH.HubDialed);assert.equal(game.props.gameMode,saved==='endurance'?'endurance':'default');
  h.effects.find(fn=>fn.toString().includes('mlh-pitched-game-type'))();assert.equal(h.storage.get('mlh-pitched-game-type'),game.props.gameMode);
  h.flat(tree).find(n=>n?.type===h.MLH.ToolbarButton).props.onClick();const open=h.render();h.flat(open).find(n=>n?.type===h.MLH.LevelMenu).props.onSelect('endurance');h.render();h.effects.find(fn=>fn.toString().includes('mlh-pitched-game-type'))();assert.equal(h.storage.get('mlh-pitched-game-type'),'endurance');
  const reloaded=appHarness(h.storage.get('mlh-pitched-game-type'));assert.equal(reloaded.flat(reloaded.render()).find(n=>n?.type===reloaded.MLH.HubDialed).props.gameMode,'endurance');
 }
});

test('mode-specific score cards use the correct order, precision and medal thresholds',()=>{
 for(const mode of ['default','endurance']){
  const h=appHarness(mode),tree=h.render();h.flat(tree).find(n=>n?.type===h.MLH.HubDialed).props.onStats({mode,phase:'results',round:7,completed:6,score:49.61,lastScore:7.54,best:mode==='endurance'?5:40,confetti:0});
  const panel=h.flat(h.render()).find(n=>n?.type===h.MLH.ScoreStreakPanel).props;
  assert.equal(panel.scoreDisplay.label,mode==='endurance'?'Score':'Round');assert.equal(panel.scoreDisplay.value,mode==='endurance'?'8':'7/5');
  assert.equal(panel.streakDisplay.label,mode==='endurance'?'Round':'Score');assert.equal(panel.streakDisplay.subtitle,mode==='endurance'?'Best: 5':'Best score: 40');assert.deepEqual(Array.from(panel.medalThresholdValues),mode==='endurance'?[3,5,7,10]:[30.01,35,40,49]);
  assert.equal(panel.streak,mode==='endurance'?6:49.61);
  assert.equal(panel.medalColourStreak,mode==='endurance'?6:49.61);
 }
});

test('Pitched resets the medal colour while keeping the saved best in both modes',()=>{
 for(const mode of ['default','endurance']){
  const h=appHarness(mode);
  const {onStats}=h.flat(h.render()).find(n=>n?.type===h.MLH.HubDialed).props;
  const tally=()=>h.flat(h.render()).find(n=>n?.type===h.MLH.ScoreStreakPanel).props;
  const best=mode==='endurance'?7:40;
  onStats({mode,phase:'results',round:mode==='endurance'?8:5,completed:7,score:40,best,confetti:1});
  assert.equal(tally().medalColourStreak,best);
  onStats({mode,phase:'intro',round:0,completed:0,score:0,best,confetti:0});
  assert.equal(tally().medalColourStreak,0);
  assert.equal(tally().bestStreak,best);
  onStats({mode,phase:'feedback',round:mode==='endurance'?1:5,completed:1,score:40,best,confetti:0});
  assert.equal(tally().medalColourStreak,mode==='endurance'?1:0);
 }
});


test('replaying a pitch silences the completion chime before starting the comparison tone',async()=>{
 const effects=[],events=[],state={...Core.initialState(),phase:'feedback',round:1,total:10,targets:[.5],picks:[.5],roundScores:[10]};
 const React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity)}),useReducer:()=>[state,()=>{}],useState:v=>[typeof v==='function'?v():v,()=>{}],useRef:v=>({current:v}),useEffect:fn=>effects.push(fn)};
 class Audio{play(){events.push('chime play');return Promise.resolve();}pause(){events.push('chime pause');}}
 const window={HubDialedCore:{...Core,ToneAudio:class{stop(){}unlock(){return Promise.resolve();}start(){events.push('tone start');}}},MLH:{}};
 vm.runInNewContext(fs.readFileSync('hub-dialed.js','utf8'),{window,React,Audio,document:{hidden:false},localStorage:{getItem:()=>null},setTimeout:()=>0,clearTimeout,setInterval,clearInterval});
 const tree=window.MLH.HubDialed({}),flat=n=>n&&typeof n==='object'?[n,...n.children.flatMap(flat)]:[n];
 effects.find(fn=>fn.toString().includes('playListeningSequence'))();await flat(tree).find(n=>n?.props?.['aria-label']==='Play Yours').props.onClick();
 assert.deepEqual(events,['chime play','chime pause','tone start']);
});
