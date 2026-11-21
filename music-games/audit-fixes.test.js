const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const React=require('react');
const Babel=require('@babel/standalone');
const {renderToStaticMarkup}=require('react-dom/server');
const C=require('./core.js');
const sharing=require('./sharing.js');
const context={React,document:{createElement:()=>({getContext:()=>null}),body:{dataset:{}},fullscreenElement:null,addEventListener(){},removeEventListener(){}},window:{IGCore:C},performance,setTimeout,clearTimeout};
for(const file of ['music-games/media.jsx','music-games/learning.jsx','music-games/session.jsx'])vm.runInNewContext(Babel.transform(fs.readFileSync(file,'utf8'),{presets:['react']}).code,context);
const sample=overrides=>C.makeActivity({title:'Music',level:'N5',template:'quiz',items:[{id:'quiet',prompt:'Quiet',answer:'Piano',correctAnswers:['Piano','Soft']},{id:'loud',prompt:'Loud',answer:'Forte',distractors:['Piano']}],...overrides});

test('every built-in has a selectable qualification and is visible at its level',()=>{
 for(const activity of C.SEEDS){assert.ok(C.qualificationLevels.includes(activity.level),activity.id);assert.equal(C.visibleAtLevel(activity,activity.level),true);}
});
test('general and legacy imported activities remain reachable without an All Levels option',()=>{
 for(const level of C.qualificationLevels){assert.equal(C.visibleAtLevel({level:''},level),true);assert.equal(C.visibleAtLevel({level:'S1'},level),true);assert.equal(C.visibleAtLevel({level:'N3'},level),level==='N3');}
});

test('format conversion removes Word-only state and stale instructions',async()=>{
 const word=sample({template:'wordsearch',editorMode:'with-clues',instructions:'Find the words'});
 for(const mode of ['quiz','match-up','true-or-false','crossword']){
  const converted=C.convertTemplate(word,mode);
  assert.equal(converted.editorMode,undefined);assert.equal(converted.instructions,'');assert.deepEqual(C.validateActivity(converted),[]);
  const url=await sharing.createUrl('https://example.test/conceptsort.html',converted);
  const opened=await sharing.readHash(new URL(url).hash);assert.equal(opened.template,mode);
 }
});

test('session audio defaults on and honours explicit shared mute',()=>{
 const muted=sample({options:{sound:false}});
 assert.equal(C.sessionOptions(muted).sound,true);assert.equal(C.sessionOptions(muted,true).sound,false);assert.equal(C.sessionOptions(sample({options:{sound:true}}),true).sound,true);
});
test('empty drafts are ignored but written content and media are recoverable',()=>{
 assert.equal(C.hasDraftContent(null),false);assert.equal(C.hasDraftContent(C.makeActivity({title:'',items:[{prompt:'',answer:''}]})),false);
 assert.equal(C.hasDraftContent(sample()),true);assert.equal(C.hasDraftContent({title:'',items:[{media:{type:'audio',src:'https://example.test/note.mp3'}}]}),true);
});
test('review includes every question and distinguishes wrong and unanswered responses',()=>{
 const activity=sample();const entries=C.reviewEntries(activity,'quiz',{answers:[{itemId:'quiet',prompt:'Quiet',expected:'Piano',answer:'Forte',correct:false}]});
 assert.equal(entries.length,2);assert.equal(entries[0].correct,false);assert.equal(entries[1].correct,null);assert.equal(entries[1].expected,'Forte');
 const html=renderToStaticMarkup(React.createElement(context.window.IGAttemptReview,{entries,onExit(){}}));assert.match(html,/ig-review-box-incorrect/);assert.match(html,/ig-review-feedback-icon ig-feedback-icon ig-feedback-cross/);assert.doesNotMatch(html,/ig-feedback-tick/);assert.match(html,/<div class="ig-review-box-expected"><dt>Correct Answer<\/dt><dd>Piano<\/dd><\/div>/);assert.match(html,/Next question/);assert.match(html,/Correct Answer/);
});
test('review maps shuffled answer records by item identity',()=>{
 const activity=sample();const entries=C.reviewEntries(activity,'quiz',{answers:[{itemId:'loud',prompt:'Loud',expected:'Forte',answer:'Forte',correct:true}]});
 assert.equal(entries[0].itemId,'loud');assert.equal(entries[0].correct,true);assert.equal(entries[0].answer,'Forte');assert.equal(entries[1].itemId,'quiet');assert.equal(entries[1].correct,null);
});
test('Blank review includes every gap and unanswered page after timeout',()=>{
 const activity=sample({template:'complete-the-sentence',items:[{id:'a',prompt:'___ and ___',answer:'Loud',clozeText:'Loud and quiet',clozeGaps:[{start:0,end:4,text:'Loud'},{start:9,end:14,text:'quiet'}]},{id:'b',prompt:'___',answer:'Slow',clozeText:'Slow',clozeGaps:[{start:0,end:4,text:'Slow'}]}]});
 const entries=C.reviewEntries(activity,'complete-the-sentence',{answers:[{itemId:'a',prompt:'Loud and quiet (blank 1)',expected:'Loud',answer:'Loud',correct:true},{itemId:'a',prompt:'Loud and quiet (blank 2)',expected:'quiet',answer:'Slow',correct:false}]});
 assert.equal(entries.length,2);assert.equal(entries[0].prompt,'___ and ___');
 assert.deepEqual(entries[0].parts.map(e=>e.correct),[true,false]);assert.equal(entries[1].parts[0].correct,null);assert.equal(entries[1].parts[0].expected,'Slow');
 const html=renderToStaticMarkup(React.createElement(context.window.IGAttemptReview,{entries,onExit(){}}));
 assert.equal((html.match(/<dl/g)||[]).length,2);assert.doesNotMatch(html,/\(blank [12]\)/);assert.match(html,/1 \/ 2/);
});
test('Quiz answer audio is a sibling of its selection button',()=>{
 const activity=sample({template:'quiz',items:[{id:'sound',prompt:'Which instrument?',answer:'Piano',correctAnswers:['Piano'],answerOptions:['Piano','Flute'],answerOptionMedia:[{type:'audio',src:'https://example.test/piano.mp3'},null]}]});
 const html=renderToStaticMarkup(React.createElement(context.window.IGLearning.quiz,{activity,options:{shuffle:false}}));
 assert.match(html,/<audio/);assert.match(html,/controls=""/);assert.match(html,/ig-quiz-answer-with-media/);assert.doesNotMatch(html,/<button\b[^>]*>(?:(?!<\/button>)[\s\S])*<audio/);
});

test('review navigation reaches unanswered entries and returns without changing scores',()=>{
 const entries=C.reviewEntries(sample(),'quiz',{answers:[]});let slots=[],cursor=0,exited=0;
 const R={...React,useRef:()=>({current:null}),useLayoutEffect(){},useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],value=>slots[i]=typeof value==='function'?value(slots[i]):value];}};
 const local={React:R,document:{createElement:()=>({getContext:()=>null}),body:{dataset:{}},fullscreenElement:null,addEventListener(){},removeEventListener(){}},window:{IGCore:C}};vm.runInNewContext(Babel.transform(fs.readFileSync('music-games/session.jsx','utf8'),{presets:['react']}).code,local);
 const render=()=>{cursor=0;return local.window.IGAttemptReview({entries,onExit:()=>exited++});};
 const nodes=node=>!node||typeof node!=='object'?[]:[node,...React.Children.toArray(node.props?.children).flatMap(nodes)];
 let tree=render();nodes(tree).find(n=>n.props?.['aria-label']==='Next question').props.onClick();tree=render();assert.equal(nodes(tree).find(n=>n.type==='h2').props.children.props.children,'Loud');assert.equal(nodes(tree).find(n=>n.props?.['aria-label']==='Next question').props.disabled,true);
 nodes(tree).find(n=>n.props?.className==='ig-learning-primary ig-review-results').props.onClick();assert.equal(exited,1);assert.ok(entries.every(e=>e.correct===null));
});


test('player toolbar provides activity details without customisation or editing controls',()=>{
 const sandbox={React,window:{IGCore:C,IGTemplateSilhouette:'span',MLH:{LevelButton:({activeLabel})=>React.createElement('button',null,activeLabel)}},document:{body:{dataset:{igPage:'player'}}},location:{search:'',hash:''}};const source=fs.readFileSync('music-games/app.jsx','utf8').replace(/  ReactDOM\.createRoot[^\n]+/,'  window.TestToolbar=GameToolbar;');vm.runInNewContext(Babel.transform(source,{presets:['react']}).code,sandbox);const html=renderToStaticMarkup(React.createElement(sandbox.window.TestToolbar,{activity:sample(),mode:'type-the-answer'}));assert.doesNotMatch(html,/Customise|Edit|Delete/);assert.match(html,/aria-label="Back to collections"/);assert.match(html,/>Back</);assert.doesNotMatch(html,/National 5/);assert.doesNotMatch(html,/>Topic</);assert.equal(html.split(sample().title).length-1,1);assert.doesNotMatch(html,/ig-toolbar-activity-title|ig-activity-type-badge|ig-activity-level-symbol/);
});
