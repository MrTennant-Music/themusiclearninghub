const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const C=require('../music-dictionary/quiz-core'),P=require('../music-dictionary/quiz-practice-core'),G=require('../music-dictionary/quiz-collections');
const q=require('../music-dictionary/quiz-data/question-bank.json').questions.find(q=>q.id==='CQ-N5-MC0063-ORDER01');
const permutations=xs=>xs.length?xs.flatMap((x,i)=>permutations(xs.filter((_,j)=>i!==j)).map(rest=>[x,...rest])):[[]];
test('Strings pilot is a valid N5 ordering question and only its exact full sequence earns the mark',async()=>{
 assert.deepEqual(C.validateQuestion(q),[]);assert.equal(q.conceptId,'MC-0063');assert.equal(q.levelCode,'N5');assert.equal(q.contentSha256,await C.fingerprint(q));
 const answer=['violin','viola','cello','double-bass'];assert.deepEqual(q.answer.correctOptionIds,answer);
 for(const order of permutations(answer)){const correct=order.every((id,i)=>id===answer[i]);assert.equal(C.isCorrect(q,order),correct);assert.deepEqual(C.markQuestion(q,order),{earned:correct?1:0,available:1});}
 for(const wrong of ['',answer.slice(1),[...answer,'violin'],['violin','viola','cello','cello'],['violin','viola','cello','unknown']])assert.equal(C.isCorrect(q,wrong),false);
 const invalid=C.copy(q);invalid.answer.correctOptionIds.pop();assert(C.validateQuestion(invalid).length);
 for(const level of ['N3','N4'])assert.equal(C.eligibleForQuiz(q,{level}),false);
 for(const level of ['N5','H','AH','ALL'])assert.equal(C.eligibleForQuiz(q,{level}),true);
 assert.equal(C.eligibleForQuiz(q,{level:'N5',nonAudioQuestions:false}),false);assert.equal(C.eligibleForQuiz(q,{level:'N5',formats:['multiple-choice']}),false);assert(C.eligibleForQuiz(q,{level:'N5',formats:['order']}));assert(C.questionInScope(q,new Set(G.groupsForLevel('N5').find(g=>g.id==='orchestra-strings').conceptIds)));
});
test('ordering choices shuffle without changing their meaning or starting already solved',()=>{
 const before=JSON.stringify(q),seen=new Set();let seed=349;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
 for(let i=0;i<1000;i++){const prepared=P.prepareChoices([q],random)[0],ids=prepared.options.map(o=>o.id);assert(!C.isCorrect(q,ids));assert.deepEqual(ids.slice().sort(),q.answer.correctOptionIds.slice().sort());seen.add(ids.join(','));assert.equal(prepared.answer,q.answer);}
 assert.equal(seen.size,23);assert.equal(JSON.stringify(q),before);
});
test('quiz ordering arrows swap adjacent cards with opposite animations and lock after marking',()=>{
 let cursor=0,response='',locked=false;const refs=[],effects=[],animations=[];
 const h=(tag,props,...children)=>({tag,props:props||{},children:children.flat(Infinity)});
 const React={createElement:h,useRef:v=>refs[cursor++]||(refs[cursor-1]={current:v}),useLayoutEffect:fn=>effects.push(fn)};
 const window={MusicDictionaryQuizPractice:P,matchMedia:()=>({matches:false})};vm.runInNewContext(fs.readFileSync('music-dictionary/quiz-player.js','utf8'),{window,React,MusicDictionaryQuizCore:C,MUSIC_DICTIONARY_QUIZ_BANK:{questions:[]},localStorage:{getItem:()=>null}});
 const prepared={...q,options:[...q.options].reverse()};const nodes=n=>n&&typeof n==='object'?[n,...(n.children||[]).flatMap(nodes)]:[];
 function render(){cursor=0;const wrapper=window.MusicDictionaryQuizAnswer({question:prepared,response,locked,onAnswer:v=>response=v});const tree=wrapper.tag(wrapper.props);const ids=Array.isArray(response)?response:prepared.options.map(o=>o.id);for(const n of nodes(tree).filter(n=>n.tag==='li')){const id=n.props['data-quiz-order-item'];n.props.ref({style:{},getBoundingClientRect:()=>({top:ids.indexOf(id)*72}),getAnimations:()=>[],animate:(frames,opts)=>{animations.push({frames,opts});return {};}});}effects.splice(0).forEach(fn=>fn());return tree;}
 const tree=render();assert(!nodes(tree).some(n=>n.props.onPointerDown||n.props.draggable));const up=nodes(tree).find(n=>n.props['aria-label']==='Move Double bass up');assert(up.props.disabled);up.props.onClick();assert.equal(response,'');nodes(tree).find(n=>n.props['aria-label']==='Move Double bass down').props.onClick();render();assert.deepEqual(Array.from(response),['cello','double-bass','viola','violin']);assert.deepEqual(animations.map(a=>a.frames[0].transform).sort(),['translateY(-72px)','translateY(72px)']);assert(animations.every(a=>a.opts.duration===320));locked=true;const before=JSON.stringify(response);for(const b of nodes(render()).filter(n=>n.tag==='button')){assert(b.props.disabled);b.props.onClick();}assert.equal(JSON.stringify(response),before);
});
test('the nine requested non-audio ordering sets contain every concept and enforce qualification and marking',async()=>{
 const bank=require('../music-dictionary/quiz-data/question-bank.json'),sets=[
  ['N5','MC-0178',['Adagio','Andante','Moderato','Allegro'],'tempo'],
  ['AH','MC-0298',['Countertenor','Tenor','Baritone','Bass'],'voice-types'],
  ['N4','MC-0134',['Soprano','Alto','Tenor','Bass'],'voice-types'],
  ['N5','MC-0063',['Violin','Viola','Cello','Double bass'],'orchestra-strings'],
  ['N5','MC-0204',['Soprano','Mezzo-soprano','Alto','Tenor','Baritone','Bass'],'voice-types'],
  ['N5','MC-0206',['Piccolo','Flute','Oboe','Clarinet','Bassoon'],'orchestra-woodwind'],
  ['N5','MC-0202',['Trumpet','French horn','Trombone','Tuba'],'orchestra-brass'],
  ['H','MC-0215',['Baroque','Classical','Romantic','Impressionist'],'level-h'],
  ['AH','MC-0274',['Renaissance','Baroque','Classical','Romantic','Impressionist'],'level-ah']
 ];
 assert.equal(bank.questions.filter(q=>q.format==='order').length,9);
 for(const [level,concept,names,collection]of sets){const q=bank.questions.find(q=>q.format==='order'&&q.levelCode===level&&q.conceptId===concept);assert(q,level+'/'+concept);assert.equal(q.modality,'text');assert(q.options.length>=4);assert.deepEqual(C.validateQuestion(q),[]);assert.equal(await C.fingerprint(q),q.contentSha256);const answer=q.answer.correctOptionIds;assert.deepEqual(answer.map(id=>q.options.find(o=>o.id===id).text),names);
  for(const ids of permutations(answer)){const correct=ids.every((id,i)=>id===answer[i]);assert.equal(C.isCorrect(q,ids),correct);assert.deepEqual(C.markQuestion(q,ids),{earned:correct?1:0,available:1});}
  for(const lower of ['N3','N4','N5','H','AH'].slice(0,['N3','N4','N5','H','AH'].indexOf(level)))assert.equal(C.eligibleForQuiz(q,{level:lower}),false);
  assert(C.eligibleForQuiz(q,{level,formats:['order'],nonAudioQuestions:true}));assert(!C.eligibleForQuiz(q,{level,formats:['order'],nonAudioQuestions:false}));
  const group=G.groupsForLevel(level).find(g=>g.id===collection);assert(C.questionInScope(q,new Set(group.conceptIds)));assert(!C.questionInScope(q,new Set(['MC-0001'])));
  const all=G.groupsForLevel(level).find(g=>g.id==='level-'+level.toLowerCase());assert(C.questionInScope(q,new Set(all.conceptIds)),'Missing from qualification-specific All Concepts: '+q.id);
  for(let n=0;n<100;n++){const [prepared]=P.prepareChoices([q]);assert(!C.isCorrect(prepared,prepared.options.map(o=>o.id)));assert.equal(prepared.options.length,names.length);}
 }
 const short=C.copy(q);short.options=short.options.slice(0,3);short.answer.correctOptionIds=short.options.map(o=>o.id);assert(C.validateQuestion(short).some(e=>/at least four/.test(e)));
 const large=C.copy(q);large.options=Array.from({length:16},(_,i)=>({id:'item-'+i,text:'Concept '+i}));large.answer.correctOptionIds=large.options.map(o=>o.id);assert.deepEqual(C.validateQuestion(large),[]);
});
