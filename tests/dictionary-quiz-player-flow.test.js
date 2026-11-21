'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const C=require('../music-dictionary/quiz-core.js'),P=require('../music-dictionary/quiz-practice-core.js'),collections=require('../music-dictionary/quiz-collections.js');
const question=require('../music-dictionary/quiz-data/question-bank.json').questions.find(q=>q.conceptId==='MC-0004'&&q.format==='short-answer');
function harness({config={level:'N3',name:'Flow test',concepts:['MC-0004']},literacy}={}){
 const hooks=[],timers=[],events=new Map();let index=0,effects=[],summary;
 const React={Fragment:'fragment',createElement:(tag,props,...children)=>({tag,props:props||{},children}),
  useState(initial){const at=index++;if(!(at in hooks))hooks[at]=typeof initial==='function'?initial():initial;return [hooks[at],value=>{hooks[at]=typeof value==='function'?value(hooks[at]):value;}];},
  useRef(initial){const at=index++;return hooks[at]||(hooks[at]={current:initial});},
  useMemo(fn,deps){const at=index++,old=hooks[at];if(!old||deps.some((d,i)=>d!==old.deps[i]))hooks[at]={deps,value:fn()};return hooks[at].value;},
  useEffect(){},useLayoutEffect(fn){effects.push(fn);}};
 const MLH={SkipButton:'skip',FeedbackBadge:'pill',usePersistentScoreState:(initial)=>React.useState(initial),fadeOutAudio:()=>Promise.resolve(),playFeedbackSound:()=>Promise.resolve()};
 const window={MLH,MLHMusicLiteracyQuiz:literacy,MusicDictionaryQuizPractice:P,matchMedia:()=>({matches:false}),
  addEventListener:(name,listener)=>events.set(name,listener),removeEventListener:name=>events.delete(name)};
 vm.runInNewContext(fs.readFileSync('music-dictionary/quiz-player.js','utf8'),{window,React,ReactDOM:{createPortal:node=>node,flushSync:fn=>fn()},MusicDictionaryQuizCore:C,MusicDictionaryQuizCollections:collections,MUSIC_DICTIONARY_QUIZ_BANK:{questions:[question]},localStorage:{getItem:()=>null},document:{getElementById:()=>({})},setTimeout:(fn,ms)=>{timers.push({fn,ms,active:true});return timers.length-1;},clearTimeout:id=>{if(timers[id])timers[id].active=false;}});
 function render(){index=0;effects=[];const tree=window.MusicDictionaryQuizPlayer({config,onSummary:value=>summary=value});effects.forEach(fn=>fn());return tree;}
 function find(tree,predicate){if(!tree||typeof tree!=='object')return null;if(Array.isArray(tree)){for(const n of tree){const found=find(n,predicate);if(found)return found;}return null;}if(predicate(tree))return tree;return find(tree.children,predicate);}
 return {render,find,timers,ready:window.MusicDictionaryQuizReady,events,picture:window.MusicDictionaryQuizPicture,get summary(){return summary;},answer(tree,value){find(tree,n=>n.tag===window.MusicDictionaryQuizAnswer).props.onAnswer(value);},button(tree,label){return find(tree,n=>n.tag==='button'&&n.children.includes(label));},flush(){for(const timer of [...timers])if(timer.active){timer.active=false;timer.fn();}}};
}
test('correct and incorrect feedback both wait for an explicit Next action',()=>{
 for(const answer of [question.answer.canonical,'Wrong']){
  const f=harness();let tree=f.render();f.answer(tree,answer);tree=f.render();f.button(tree,'Submit').props.onClick();tree=f.render();
  assert.equal(f.timers.filter(t=>t.active).length,0,'feedback must not have an auto-advance timer');
  assert.equal(f.button(tree,'Next').props.disabled,false);assert.equal(f.summary.attempted,1);
  f.button(tree,'Next').props.onClick();f.flush();tree=f.render();assert(f.button(tree,'Submit'));assert.equal(f.button(tree,'Submit').props.disabled,true);
 }
});
test('using the header navigation after a marked correct answer retains its streak',()=>{
 const f=harness();let tree=f.render();f.answer(tree,question.answer.canonical);tree=f.render();f.button(tree,'Submit').props.onClick();tree=f.render();assert.equal(f.summary.streak,1);
 const skip=f.find(tree,n=>n.tag==='skip');skip.props.resetStreak();skip.props.onClick();f.flush();f.render();assert.equal(f.summary.streak,1);
});
test('whole-level quizzes mix illustrated Music Literacy into the non-audio multiple-choice pool',async()=>{
 const dictionary=require('../music-dictionary/music-literacy-dictionary');
 const literacy=require('../music-dictionary/literacy-quiz-bank')(dictionary,C);
 const collectionId='level-n3';
 const concepts=collections.groupsForLevel('N3').find(group=>group.id===collectionId).conceptIds;
 const config={level:'N3',collectionId,concepts,defaultLevelQuiz:true};
 const f=harness({config,literacy});
 await f.ready;
 f.render();
 const expected=literacy.bank.questions.filter(q=>q.levelCode==='N3').length;
 assert.equal(f.summary.questionCount,expected+1);
 f.events.get('beforeprint')();
 const worksheet=f.find(f.render(),n=>n.props.className==='cq-practice-measurements');
 assert.ok(f.find(worksheet,n=>n.tag===f.picture&&literacy.pictureFor(n.props.question)));
 for(const changes of [{formats:['short-answer']},{nonAudioQuestions:false},{concepts:['MC-0004']},{savedCollectionId:'saved-1'},{defaultLevelQuiz:false}]){
  const filtered=harness({config:{...config,...changes},literacy});
  await filtered.ready;
  filtered.render();
  assert.equal(filtered.summary.questionCount,changes.nonAudioQuestions===false?0:1);
 }
 const allId='all-concepts';
 const all=harness({config:{level:'ALL',collectionId:allId,defaultLevelQuiz:true,concepts:collections.groupsForLevel('ALL').find(group=>group.id===allId).conceptIds,formats:['multiple-choice']},literacy});
 await all.ready;
 all.render();
 assert.equal(all.summary.questionCount,literacy.bank.questions.length);
 const n5Id='level-n5';
 const n5Concepts=collections.groupsForLevel('N5').find(group=>group.id===n5Id).conceptIds;
 const n5=harness({config:{level:'N5',collectionId:n5Id,concepts:n5Concepts,defaultLevelQuiz:true},literacy});
 await n5.ready;
 const n5Tree=n5.render();
 const earlierPool=literacy.bank.questions.filter(q=>['N3','N4','N5'].includes(q.levelCode));
 assert.equal(n5.summary.questionCount,earlierPool.length+1);
 assert.equal(n5.find(n5Tree,n=>n.tag===n5.picture).props.question.levelCode,'N5');
 const exact=harness({config:{level:'N5',collectionId:n5Id,concepts:n5Concepts,defaultLevelQuiz:true,selectedLevelOnly:true},literacy});
 await exact.ready;
 exact.render();
 assert.equal(exact.summary.questionCount,earlierPool.filter(q=>q.levelCode==='N5').length);
});
