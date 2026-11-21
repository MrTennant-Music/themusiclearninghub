const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),Babel=require('@babel/standalone');
const source=fs.readFileSync(path.join(__dirname,'millionaire.js'),'utf8'),ast=Babel.packages.parser.parse(source,{plugins:['jsx']});
let timerEffect,keyboardHandler,audioClass;
Babel.packages.traverse.default(ast,{
 CallExpression(entry){const n=entry.node;if(n.callee.name==='useEffect'&&n.arguments[0]&&source.slice(n.arguments[0].start,n.arguments[0].end).includes('const canRunTimer ='))timerEffect=source.slice(n.arguments[0].start,n.arguments[0].end);},
 FunctionDeclaration(entry){const n=entry.node;if(n.id?.name==='onKeyDown'&&source.slice(n.start,n.end).includes('selectAnswer(answerMap[key])'))keyboardHandler=source.slice(n.start,n.end);},
 ClassDeclaration(entry){if(entry.node.id.name==='AudioDirector')audioClass=source.slice(entry.node.start,entry.node.end);}
});
test('audio answer timer waits for a completed clip, pauses on replay, and retains the remaining time',()=>{
 let now=0,tick=null,cleanup,expired=0,shown=30;
 const context={Date:{now:()=>now},TIMER_DURATION_SECONDS:30,answerTimer:{current:{questionId:null,remaining:30}},timerExpired:{current:false},settings:{timer:true},screen:'game',currentIndex:7,question:{id:'audio-1',audioSrc:'fixture.mp3'},openingZooming:false,locked:false,transitioning:false,revealed:null,audioPlaying:false,audioFinished:false,
  hasQuestionAudio:q=>Boolean(q.audioSrc),setTimeRemaining:value=>shown=value,handleTimerExpired:()=>expired++,window:{setInterval:callback=>{tick=callback;return 1;},clearInterval:()=>tick=null}};
 const run=vm.runInNewContext('('+timerEffect+')',context);
 function apply(){cleanup?.();cleanup=run();}
 function advance(ms){now+=ms;tick?.();}
 apply();advance(60000);assert.equal(expired,0);assert.equal(shown,30);assert.equal(tick,null);
 context.audioPlaying=true;apply();advance(45000);assert.equal(expired,0);assert.equal(tick,null);
 context.audioPlaying=false;apply();advance(60000);assert.equal(expired,0,'Stopping before the end must not start the timer');
 context.audioFinished=true;apply();advance(10000);assert.equal(shown,20);
 context.audioPlaying=true;apply();advance(45000);assert.equal(expired,0);assert.equal(shown,20);
 context.audioPlaying=false;apply();advance(19900);assert(shown>0);advance(100);assert.equal(expired,1);advance(1000);assert.equal(expired,1);
 context.question={id:'text-2',audioSrc:''};context.audioFinished=false;apply();assert.equal(shown,30);advance(1000);assert.equal(shown,29,'Non-audio questions still start immediately');
 cleanup?.();
});
test('Enter and Space on a focused control keep their native action; game shortcuts still work elsewhere',()=>{
 const calls={lock:0,play:0,stop:0,answer:0};
 const context={dialog:null,helpOpen:false,screen:'game',question:{audioSrc:'fixture.mp3'},audioPlaying:false,hasQuestionAudio:()=>true,selectAnswer:()=>calls.answer++,lockAnswer:()=>calls.lock++,playQuestionAudio:()=>calls.play++,stopQuestionAudio:()=>calls.stop++,lifelineRef:{current:null}};
 vm.runInNewContext(keyboardHandler+';this.key=onKeyDown;',context);
 function key(value,control=false,prevented=false){let preventedHere=false;context.key({key:value,code:value===' '?'Space':value,defaultPrevented:prevented,target:{tagName:control?'BUTTON':'BODY',closest:()=>control?{}:null},preventDefault:()=>preventedHere=true});return preventedHere;}
 assert.equal(key('Enter',true),false);assert.equal(key(' ',true),false);assert.equal(calls.lock,0);assert.equal(calls.play,0);
 assert.equal(key('Enter'),true);assert.equal(calls.lock,1);
 key(' ');assert.equal(calls.play,1);context.audioPlaying=true;key(' ');assert.equal(calls.stop,1);
 key('a',false,true);assert.equal(calls.answer,0);key('a');assert.equal(calls.answer,1);
});
test('recording completion is distinct from an error, rejected playback or a stopped excerpt',async()=>{
 const context={};vm.runInNewContext(audioClass+';this.Director=AudioDirector;',context);
 const director=new context.Director(),results=[];let current,blocked=false;
 director.stopExcerpt=function(){this.excerptAudio=null;this.excerptPlaying=false;};
 director.makeAudio=()=>{const events={};current={events,addEventListener:(name,callback)=>events[name]=callback,play:()=>blocked?Promise.reject(Error('Blocked')):Promise.resolve()};return current;};
 director.fadeOutMusicForExcerpt=(seconds,callback)=>callback();director.fadeInMusicAfterExcerpt=()=>{};
 director.playFileExcerpt('fixture.mp3',done=>results.push(done));current.events.ended();assert.deepEqual(results,[true]);
 director.playFileExcerpt('fixture.mp3',done=>results.push(done));current.events.error();current.events.ended();assert.deepEqual(results,[true,false]);
 director.playFileExcerpt('fixture.mp3',done=>results.push(done));director.stopExcerpt();current.events.ended();assert.deepEqual(results,[true,false]);
 blocked=true;director.playFileExcerpt('fixture.mp3',done=>results.push(done));await Promise.resolve();assert.deepEqual(results,[true,false,false]);
});
