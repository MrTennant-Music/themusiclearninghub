'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('music-dictionary/quiz-player.js','utf8');
function harness(){
 const hooks=[],effects=[],instances=[],dependencies=[];let index=0;
 const React={useState(initial){const i=index++;if(!(i in hooks))hooks[i]=initial;return[hooks[i],value=>hooks[i]=value];},useRef(initial){const i=index++;return hooks[i]||(hooks[i]={current:initial});},useEffect(fn,deps){effects.push(fn);dependencies.push(deps);}};
 const h=(tag,props,...children)=>{if(props?.ref&&!props.ref.current)props.ref.current={};return{tag,props:props||{},children};};
 const window={ExamAudio:{createPlayer(host,config){const instance={host,config,destroyed:false,retries:0,destroy(){this.destroyed=true;},retry(){this.retries++;return Promise.resolve(true);}};instances.push(instance);return instance;}}};
 vm.runInNewContext(source.slice(source.indexOf('window.MusicDictionaryQuizAudio='),source.indexOf('window.MusicDictionaryQuizPlayer=')),{window,React,h});
 return{hooks,effects,instances,dependencies,render(question,review=false){index=0;return window.MusicDictionaryQuizAudio({question,review});}};
}
test('quiz audio uses the shared player without autoplay, exposes retry and destroys playback on unmount',()=>{
 const f=harness(),question={media:{src:'./audio/concept-library/example.m4a',recording:'Recording credit'}};
 const tree=f.render(question,true),cleanup=f.effects[0](),instance=f.instances[0];
 assert.equal(tree.children[0].props['aria-label'],'Audio example');
 assert.equal(instance.config.clips[0].file,question.media.src);
 assert.equal(instance.config.autoplay,undefined);
 assert.equal(tree.children[2].children[0],'Recording credit');
 instance.config.onPlaybackError();assert.equal(f.hooks[0],true);
 const failed=f.render(question),alert=failed.children[1];assert.equal(alert.props.role,'alert');
 alert.children[1].props.onClick();assert.equal(instance.retries,1);assert.equal(f.hooks[0],false);
 cleanup();assert.equal(instance.destroyed,true);
});
test('both quiz entry points load the shared audio engine before the quiz component',()=>{
 for(const file of ['conceptquiz.html','music-dictionary/musicdictionary.html']){
  const html=fs.readFileSync(file,'utf8');
  assert(html.indexOf('digital-question-papers/exam-audio.js')>0);
  assert(html.indexOf('digital-question-papers/exam-audio.js')<html.indexOf('music-dictionary/quiz-player.js'));
 }
});

test('practice statistics reuse the shared score and streak panel with collection medal scope',()=>{
 const h=(tag,props,...children)=>({tag,props:props||{},children}),window={MLH:{ScoreStreakPanel:'shared-score-panel'}},P=require('../music-dictionary/quiz-practice-core.js');
 vm.runInNewContext(source.slice(source.indexOf('window.MusicDictionaryQuizStats='),source.indexOf('function practiceQuestion(')),{window,h,P,medalAssets:{}});
 const tree=window.MusicDictionaryQuizStats({summary:{correct:9,attempted:12,streak:4,best:10,level:'AH',activity:'conceptquiz-ah-chords.html',medalEligible:true}});
 assert.equal(tree.tag,'shared-score-panel');assert.equal(tree.props.accuracy,75);assert.equal(tree.props.achievementActivity,'conceptquiz-ah-chords.html');assert.equal(tree.props.medalEligible,true);
 const custom=window.MusicDictionaryQuizStats({summary:{medalEligible:false}});assert.equal(custom.props.medalEligible,false);
});

test('a new question using the same recording resets the player lifecycle',()=>{
 const f=harness(),media={src:'./audio/concept-library/example.m4a'};
 f.render({id:'first',media});f.render({id:'second',media});
 assert.notEqual(f.dependencies[0][0],f.dependencies[1][0]);assert.equal(f.dependencies[0][1],f.dependencies[1][1]);
});
