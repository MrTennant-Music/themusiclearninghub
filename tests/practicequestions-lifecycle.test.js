'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const page=fs.readFileSync('practicequestions.html','utf8');
const between=(start,end)=>page.slice(page.indexOf(start),page.indexOf(end,page.indexOf(start)));
function harness(){
 let id=0;const timers=new Map(),pendingFeedback=[];
 const c={reportActivityRace(){},escapeEmbed:false,window:{setTimeout:(fn,ms)=>{timers.set(++id,{fn,ms});return id;},clearTimeout:n=>timers.delete(n)},question:{id:'first',questionType:'practicePaper',targetBar:0,bars:[{notes:[]}],subquestions:Array.from({length:6},(_,i)=>({id:String(i),type:'text',accepts:['C']}))},practiceAnswers:Object.fromEntries(Array.from({length:6},(_,i)=>[String(i),'C'])),userNotes:{},feedback:null,score:{correct:0,attempted:0},activeLevel:'N3',enabledQuestionTypes:{barlines:true,dynamic:true,interval:true,missing:true,noteIdentification:true,rhythmIdentification:true,time:true},markingQuestionRef:{current:null},questionChangeInProgressRef:{current:false},markingTimersRef:{current:[]},nextTimer:{current:null},fadeTimer:{current:null},textAnswerCorrect:(value,accepts)=>accepts.includes(value),stopAudio:()=>{},setIncompleteSubmitConfirmOpen:()=>{},setFeedbackFading:()=>{},setPrompt:()=>{},setActivePracticePart:()=>{},setConfettiKey:()=>{},playSound:()=>{},setTimerResetKey:()=>{},setPlaysRemaining:()=>{},setUserNotes:v=>c.userNotes=v,setPracticeAnswers:v=>c.practiceAnswers=v,setHoverNote:()=>{},practiceQuestionCountForLevel:()=>6,canBuildPracticeQuestionSelection:()=>true,normalisePracticeQuestionTypes:value=>value,makeQuestion:()=>({...c.question,id:'second'}),setQuestion:q=>c.question=q,PRACTICE_PLAYS_PER_QUESTION:4,setEnabledQuestionTypes:fn=>c.enabledQuestionTypes=fn(c.enabledQuestionTypes),setFeedback:v=>pendingFeedback.push(v),setScore:v=>c.score=typeof v==='function'?v(c.score):v};
 vm.createContext(c);vm.runInContext(between('      function clearFeedbackTimers()','      function stopAudio(')+between('      function submitPracticeQuestion(','      function confirmPracticeQuestion()')+between('      function toggleQuestionType(','      function clearUserNotes()'),c);
 const flush=()=>{for(const v of pendingFeedback.splice(0))c.feedback=typeof v==='function'?v(c.feedback):v;};
 const run=()=>{const queued=[...timers.values()];timers.clear();for(const t of queued)t.fn();flush();};
 return{c,timers,flush,run};
}
test('duplicate submission before the React state commit schedules each mark once',()=>{
 const h=harness();h.c.submitPracticeQuestion({requireComplete:false});h.c.submitPracticeQuestion({requireComplete:false});assert.equal(h.timers.size,6);
 h.flush();h.run();assert.equal(h.c.score.correct,6);assert.equal(h.c.score.attempted,6);assert.equal(h.c.feedback.revealing,false);
});
test('timer expiry during question replacement cannot submit the obsolete question',()=>{
 const h=harness();h.c.questionChangeInProgressRef.current=true;h.c.submitPracticeQuestion({requireComplete:false});assert.equal(h.timers.size,0);assert.equal(h.c.markingQuestionRef.current,null);
});
test('changing a valid question selection cancels old marking callbacks and resets its submission lock',()=>{
 const h=harness();h.c.submitPracticeQuestion({requireComplete:false});h.flush();assert.equal(h.timers.size,6);
 h.c.toggleQuestionType('barlines');h.flush();assert.equal(h.timers.size,0);assert.equal(h.c.markingQuestionRef.current,null);assert.equal(h.c.question.id,'second');assert.equal(h.c.feedback,null);
 h.run();assert.equal(h.c.score.correct,0);assert.equal(h.c.score.attempted,0);
 h.c.submitPracticeQuestion({requireComplete:false});assert.equal(h.timers.size,6);
});
const timerEffects=between('      const practiceReviewMode =','      function clearTimers()');
function timerRender({enabled=true,paused=false,feedback=null,seconds=1,level='N3'}={}){
 const effects=[],intervals=new Map();let next=0;const c={reportActivityRace(){},escapeEmbed:false,question:{questionType:'practicePaper'},feedback,timerEnabled:enabled,timerPaused:paused,secondsRemaining:seconds,activeLevel:level,timerResetKey:0,submissions:0,practiceTimerSecondsForLevel:l=>l==='AH'?360:300,useEffect:(fn,deps)=>effects.push({fn,deps}),setTimerPaused:v=>c.timerPaused=v,setSecondsRemaining:v=>c.secondsRemaining=typeof v==='function'?v(c.secondsRemaining):v,submitPracticeQuestion:()=>c.submissions++,window:{setInterval:fn=>{intervals.set(++next,fn);return next;},clearInterval:id=>intervals.delete(id)}};
 vm.runInNewContext('(function(){'+timerEffects+'})()',c);return{c,effects,intervals};
}
test('timer pause, disable and feedback stop ticking; expiry submits without requiring complete answers',()=>{
 for(const options of [{paused:true},{enabled:false},{feedback:{correct:false}}]){const h=timerRender(options);assert.equal(h.effects[1].fn(),undefined);assert.equal(h.intervals.size,0);h.effects[2].fn();assert.equal(h.c.submissions,0);}
 const h=timerRender();const cleanup=h.effects[1].fn();for(const fn of h.intervals.values())fn();assert.equal(h.c.secondsRemaining,0);cleanup();assert.equal(h.intervals.size,0);
 const expired=timerRender({seconds:0});expired.effects[2].fn();assert.equal(expired.c.submissions,1);
 for(const level of ['N3','N4','N5','H','AH']){const reset=timerRender({seconds:0,paused:true,level});reset.effects[0].fn();assert.equal(reset.c.secondsRemaining,level==='AH'?360:300);assert.equal(reset.c.timerPaused,false);}
});

function failGeneration(h){
 h.c.console={error:()=>{}};
 h.c.makeQuestion=()=>{throw Error('generation failed');};
 h.c.makeInitialPracticeQuestion=h.c.makeQuestion;
 h.c.setPrompt=value=>h.c.prompt=value;
}
test('failed selection generation preserves the current answers, selection and pending marking',()=>{
 const h=harness(),question=h.c.question,selection=h.c.enabledQuestionTypes,answers=h.c.practiceAnswers;
 h.c.submitPracticeQuestion({requireComplete:false});h.flush();failGeneration(h);
 h.c.toggleQuestionType('barlines');
 assert.equal(h.c.question,question);assert.equal(h.c.enabledQuestionTypes,selection);assert.equal(h.c.practiceAnswers,answers);
 assert.equal(h.timers.size,6);assert.equal(h.c.markingQuestionRef.current,'first');assert.match(h.c.prompt,/could not be generated/);
 h.run();assert.equal(h.c.score.correct,6);assert.equal(h.c.feedback.revealing,false);
});
test('failed replacement or level change preserves the active paper, score and timer',()=>{
 const h=harness();
 vm.runInContext(between('      function newQuestion(','      function startFreshQuestionFromFeedback()')+between('      function applyLevel(','      function toggleQuestionType('),h.c);
 h.c.setMenu=()=>{};h.c.defaultPracticeQuestionTypesForLevel=()=>({});
 h.c.submitPracticeQuestion({requireComplete:false});h.flush();failGeneration(h);
 const question=h.c.question,answers=h.c.practiceAnswers;
 h.c.setScore=()=>assert.fail('must retain score');h.c.setTimerResetKey=()=>assert.fail('must retain timer');h.c.setActiveLevel=()=>assert.fail('must retain level');
 h.c.startFreshQuestion();h.c.applyLevel('H');
 assert.equal(h.c.question,question);assert.equal(h.c.practiceAnswers,answers);assert.equal(h.c.questionChangeInProgressRef.current,false);
 assert.equal(h.timers.size,6);assert.equal(h.c.markingQuestionRef.current,'first');assert.match(h.c.prompt,/could not be generated/);
});

test('failed Next generation restores visible feedback and lets its marking finish',()=>{
 const h=harness();
 vm.runInContext(between('      function newQuestion(','      function startFreshQuestion()')+between('      function advanceAfterFeedback()','      function applyLevel('),h.c);
 h.c.setFeedbackFading=value=>h.c.fading=value;
 h.c.submitPracticeQuestion({requireComplete:false});h.flush();failGeneration(h);
 h.c.advanceAfterFeedback();assert.equal(h.c.fading,true);assert.equal(h.timers.size,7);
 h.run();assert.equal(h.c.fading,false);assert.equal(h.c.feedback.revealing,false);assert.equal(h.c.score.correct,6);
});

test('Escape Room never marks answers or reveals the code from Practice Questions',()=>{
 const h=harness();
 h.c.escapeEmbed=true;
 h.c.escapeSend=()=>assert.fail('Escape Room choices must never reveal the code');
 h.c.practiceAnswers['0']='C';
 h.c.submitPracticeQuestion({requireComplete:false});
 h.flush();
 assert.equal(h.c.feedback,null);
 assert.equal(h.c.markingQuestionRef.current,null);
 assert.equal(h.timers.size,0);
});
test('Escape Room does not start the Practice Questions timer',()=>{
 const h=timerRender({seconds:0});h.c.escapeEmbed=true;assert.equal(h.effects[1].fn(),undefined);h.effects[2].fn();assert.equal(h.c.submissions,0);
});
