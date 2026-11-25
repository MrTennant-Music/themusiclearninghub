const {test}=require('node:test'),assert=require('node:assert/strict'),core=require('../reading-rhythms-core');
test('unselected and impossible metres never silently replace the selected ones',()=>{
 const enabled={crotchet:false,minim:false,'dotted-minim':false,semibreve:true};
 assert.equal(core.canGenerateWithEnabled('N3',enabled,{timeSignatureIds:['2/4']}),false);
 assert.throws(()=>core.generateRhythm('N3',Math.random,'',enabled,{timeSignatureIds:['2/4']}),RangeError);
});
test('invalid saved settings recover a playable selection and bounded tempo',()=>{
 for(const level of Object.keys(core.LEVELS))for(const tempo of ['bad',null,-5,999]){
 const s=core.normaliseSettings(level,{tempo,enabledRhythms:Object.fromEntries(core.LEVELS[level].rhythmIds.map(id=>[id,false])),enabledTimeSignatures:Object.fromEntries(core.LEVELS[level].timeSignatureIds.map(id=>[id,false]))});
 assert(core.canGenerateWithEnabled(level,s.enabledRhythms,{timeSignatureIds:Object.keys(s.enabledTimeSignatures).filter(id=>s.enabledTimeSignatures[id])}));assert(s.tempo>=60&&s.tempo<=120);
 }
});
test('extra taps reduce accuracy and cannot yield a perfect score',()=>{
 const expected=[0,1,2].map((time,i)=>({time,eventId:String(i)}));
 const r=core.matchPerformance(expected,[0,.45,1,1.45,2],90);assert.equal(r.accurate,3);assert.equal(r.counts.extra,2);assert.equal(r.percentage,60);
});
test('alignment preserves later exact taps when an early input is closer to the next note',()=>{
 const expected=[0,.125,.25].map((time,i)=>({time,eventId:String(i)}));
 const r=core.matchPerformance(expected,[.08,.125,.25],120);assert.equal(r.accurate,3);assert.equal(r.results[1].errorMs,0);assert.equal(r.results[2].errorMs,0);
});
test('fast valid semiquavers do not trigger the repeated-input guard',()=>{
 const expected=[0,.125,.25,.375,.5,.75,1].map(time=>({time}));assert(core.inputLimit(expected)>7);assert.equal(core.matchPerformance(expected,expected.map(e=>e.time),120).percentage,100);
});
test('default metre and phrase distributions retain their intended weights',()=>{
 let seed=8217;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
 for(const level of Object.keys(core.LEVELS)){
 const info=core.LEVELS[level],metres={},phrases={};let prev='';const n=3000;
 for(let i=0;i<n;i++){const q=core.generateRhythm(level,random,prev);const sig=core.rhythmSignature(q);assert.notEqual(sig,prev);prev=sig;metres[q.timeSignature.id]=(metres[q.timeSignature.id]||0)+1;phrases[q.phraseTemplate]=(phrases[q.phraseTemplate]||0)+1;}
 for(const id of info.timeSignatureIds)assert(Math.abs(metres[id]/n-1/info.timeSignatureIds.length)<.045,`${level}/${id}: ${metres[id]}`);
 for(const [template,weight] of core.PHRASE_PROFILES[level].templates)assert(Math.abs(phrases[template]/n-weight/100)<(level==='N3'?.08:.045),`${level}/${template}: ${phrases[template]}`);
 }
});
const fs=require('node:fs'),vm=require('node:vm'),Babel=require('@babel/standalone');
const source=fs.readFileSync('readingrhythms.html','utf8').match(/<script type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/)[1];
const functions={};Babel.packages.traverse.default(Babel.packages.parser.parse(source,{sourceType:'script',plugins:['jsx']}),{FunctionDeclaration(path){functions[path.node.id.name]=Babel.packages.generator.default(path.node).code;}});
function playbackHarness(name,prepare=async()=>true){
 const scheduled=[],states=[],hits=[],ctx={currentTime:10,destination:{},close(){}};
 const statesMap={READY:'ready',COUNTING:'count',PERFORMING:'perform',RESULTS:'results',REFERENCE:'ref'};
 const c={CORE:core,Math,Infinity,ACTIVITY_STATES:statesMap,streakRace:false,activeAttempt:false,activityState:statesMap.RESULTS,audioRef:{current:null},stateRef:{current:statesMap.RESULTS},performanceStartRef:{current:0},tapsRef:{current:[]},inputTimesRef:{current:[]},resultsCalculatedRef:{current:false},lastPointerTimeRef:{current:0},timersRef:{current:[]},tapAreaRef:{current:{focus(){}}},rhythm:core.generateRhythm('N3',()=>.5),tempo:90,finishAttempt(){},playPerformanceHit(...args){hits.push(args);},transition(s){states.push(s);c.stateRef.current=s;},cancelAudioAndTimers(){c.audioRef.current=null;},closeAudio(){c.audioRef.current=null;},setResult(){},setTapPulse(){},setLevelOpen(){},setCustomiseOpen(){},setStatus(){},setCountInNumber(){},setPlayBeatNumber(){},setActivePlaybackEventId(){},window:{AudioContext:function(){return ctx;},MLH:{prepareAudioPlayback:prepare,playMetronomeClick(){},naturalPlaybackTailMs:()=>0},setTimeout(fn,ms){scheduled.push({fn,ms});return scheduled.length;}}};
 vm.createContext(c);vm.runInContext(functions[name]+`;globalThis.run=${name}`,c);return {c,ctx,scheduled,states,hits};
}
test('audio preparation failures release the activity for retry',async()=>{
 for(const name of ['startAttempt','playReference'])for(const prepare of [async()=>false,async()=>{throw Error('unavailable')}]){const h=playbackHarness(name,prepare);await h.c.run();assert.equal(h.c.audioRef.current,null);assert.equal(h.states.at(-1),name==='startAttempt'?'ready':'results');assert.equal(h.scheduled.length,0);}
});
test('skipping during audio preparation cannot schedule stale playback',async()=>{
 let resolve;const h=playbackHarness('startAttempt',()=>new Promise(r=>resolve=r));const run=h.c.run();h.c.audioRef.current=null;resolve(true);await run;assert.equal(h.scheduled.length,0);
});
test('reference completion includes the audio lead-in and all note durations',async()=>{
 const h=playbackHarness('playReference');await h.c.run();const duration=h.c.rhythm.timeSignature.pulsesPerBar*2*60/h.c.tempo;
 assert(Math.abs(h.scheduled.at(-1).ms-(duration+.12)*1000)<1e-6);assert.equal(h.hits.length,h.c.rhythm.expectedOnsetsBeats.length);
});
test('touch flash coordinates follow the fitted desktop canvas',()=>{
 let captured;const c={performance:{now:()=>1000},lastPointerTimeRef:{current:0},tapAreaRef:{current:{offsetWidth:1000,offsetHeight:500,getBoundingClientRect:()=>({left:10,top:20,width:500,height:250})}},registerTap:(source,position)=>captured={source,position}};
 vm.createContext(c);vm.runInContext(functions.handlePointer+';globalThis.run=handlePointer',c);c.run({target:{closest:()=>false},pointerType:'touch',clientX:110,clientY:70,preventDefault(){}});assert.equal(captured.position.x,200);assert.equal(captured.position.y,100);
});
test('backgrounding reference playback preserves the marked result',()=>{
 const h=playbackHarness('playReference');h.c.document={hidden:true};h.c.stateRef.current='ref';vm.runInContext(functions.onVisibilityChange+';onVisibilityChange()',h.c);assert.equal(h.states.at(-1),'results');
});
test('Scotch snaps occur from National 5 onwards and stay correctly beamed',()=>{
 for(const level of ['N5','H','AH']){let seed=9871,found=false;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
 for(let i=0;i<1500;i++){const q=core.generateRhythm(level,random);for(const bar of q.bars)for(let j=0;j<bar.events.length-1;j++){const e=bar.events[j],next=bar.events[j+1];if(e.rhythm==='semiquaver'&&next.rhythm==='dotted-quaver'){assert.equal(e.groupId,next.groupId);assert(Math.abs(e.durationBeats+next.durationBeats-1)<1e-7);found=true;}}}
 assert(found,`${level} never generated its advertised Scotch snaps`);}
});
test('dense custom filters vary their exercises instead of repeating a deterministic fallback',()=>{
 const enabled=Object.fromEntries(core.LEVELS.N5.rhythmIds.map(id=>[id,['semiquaver','dotted-quaver'].includes(id)]));let previous='',seed=514;
 const random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
 for(let i=0;i<100;i++){const q=core.generateRhythm('N5',random,previous,enabled,{timeSignatureIds:['4/4']});assert.notEqual(core.rhythmSignature(q),previous);assert(!q.fallback);previous=core.rhythmSignature(q);}
});

test('Reading Rhythms Race schedules the visual pulse with audio unavailable', async () => {
 const h = playbackHarness('startAttempt', async () => { throw Error('Race must not prepare audio'); });
 h.c.streakRace = true;
 h.c.performance = { now: () => 10000 };
 h.c.window.AudioContext = undefined;
 h.c.window.MLH.playMetronomeClick = () => assert.fail('Race must not play metronome clicks');
 await h.c.run();
 assert.equal(h.states.at(-1), h.c.ACTIVITY_STATES.COUNTING);
 assert.ok(h.scheduled.length > 0);
 assert.ok(h.scheduled.every(({ms}) => Number.isFinite(ms) && ms >= 0));
 assert.ok(h.c.performanceStartRef.current > 10);
});
