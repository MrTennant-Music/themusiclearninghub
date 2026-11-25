const test=require('node:test'),assert=require('node:assert/strict'),K=require('../keyboard-notes'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),worksheet=require('./helpers/worksheet-generator-harness.cjs'),{run}=require('../scripts/audit-keyboard-note-identification.cjs');
test('every level and custom mode balances question types, clefs and answers without immediate repeats',()=>{const report=run(250);assert.deepEqual(report.failures,[]);});
test('saved settings cannot remove every clef, note group or question type or change the level range',()=>{for(const level of Object.keys(K.defaults)){const safe=K.normaliseOptions({octaves:99,naturals:false,treble:false,bass:false,sharps:false,flats:false,enharmonics:true},level);assert.equal(safe.octaves,K.defaults[level].octaves);assert(safe.naturals);assert(!safe.enharmonics);assert(K.candidates(safe,K.normaliseTypes({name:false,find:false},level),level).length);}});
test('find-key worksheet preserves its full keyboard range and exact answer octave',()=>{for(const level of Object.keys(K.defaults)){const w=worksheet({version:1,activityId:'keyboard-notes',sourceUrl:'http://localhost:8765/keyboardnoteidentification.html',settings:{level,options:K.defaults[level],questionTypes:{find:true}}});let upper=false;for(let i=0;i<80;i++){const q=w.makeQuestion(i),key=q.keyboardKey,completed=renderToStaticMarkup(React.createElement(w.Staff,{question:q,completed:true})),blank=renderToStaticMarkup(React.createElement(w.Staff,{question:q,completed:false}));const width=level==='N3'?336:['H','AH'].includes(level)?720:672;assert(completed.includes(`viewBox="-1 -1 ${width+2} 252"`));assert(completed.includes(`<circle cx="${key.x+(key.black?15:24)}"`));assert(!blank.includes('r="11"')); if(key.baseOctave!=null)assert(completed.includes('>C4</text>'));upper ||=key.pitch>=12;}if(level!=='N3')assert(upper);}});
const fs=require('node:fs'),vm=require('node:vm'),Babel=require('@babel/standalone');
function functions(source){const result={};function visit(node){if(!node||typeof node!=='object')return;if(node.type==='FunctionDeclaration')result[node.id.name]=source.slice(node.start,node.end);for(const [key,value]of Object.entries(node))if(key!=='loc'){if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);}}visit(Babel.transform(source,{presets:['react'],ast:true,code:false}).ast);return result;}
const appFunctions=functions(fs.readFileSync('keyboardnoteidentification.html','utf8').match(/<script type="text\/x-mlh-jsx-source" data-runtime="keyboardnoteidentification-1\.js">([\s\S]*?)<\/script>/)[1]);
test('rapid answer submissions score once and cannot answer a hidden transition',()=>{let attempts=0,correct=0;const c={answerLock:{current:false},feedback:null,questionVisible:true,question:{type:'find',pitch:2},K,streak:0,setSelected(){},setAttempted(fn){attempts=fn(attempts);},setCorrect(fn){correct=fn(correct);},setStreak(){},setBest(){},setFeedback(){},window:{MLH:{}},medalEligible:false,MEDAL_THRESHOLDS:[],timers:{current:[]},setTimeout:()=>1};vm.createContext(c);vm.runInContext(appFunctions.submit,c);c.submit({pitch:2});c.submit({pitch:2});assert.equal(attempts,1);assert.equal(correct,1);c.answerLock.current=false;c.questionVisible=false;c.submit({pitch:2});assert.equal(attempts,1);});
const captureFunctions=functions(fs.readFileSync('worksheet-generic.jsx','utf8'));
test('PDF capture preserves the full keyboard image and restores the preview even after failure',async()=>{for(const fail of [false,true]){let replaced=false,restored=false,removed=false;const clone={setAttribute(){},removeAttribute(){}},svg={cloneNode:()=>clone,classList:{contains:name=>name==='keyboard-worksheet-score'},viewBox:{baseVal:{width:722,height:252}},style:{cssText:'width:100%;height:auto'},getAttribute:()=> 'keyboard-worksheet-score',replaceWith(){replaced=true;}},page={querySelectorAll:selector=>selector==='img'?[]:[svg],classList:{add(){},remove(){removed=true;}}};const c={document:{fonts:{}},getComputedStyle:()=>({width:"722px",height:"252px"}),window:{jspdf:{jsPDF:class{addImage(){} addPage(){}}}},Image:class{constructor(){this.style={};}decode(){return Promise.resolve();}replaceWith(original){assert.equal(original,svg);restored=true;}},XMLSerializer:class{serializeToString(){return '<svg width="722" height="252"></svg>';}},encodeURIComponent,Promise,setTimeout,html2canvas:async()=>{assert(replaced);if(fail)throw new Error('capture failed');return {toDataURL:()=>''};}};vm.createContext(c);vm.runInContext(captureFunctions.buildCapturedWorksheetPdf,c);if(fail)await assert.rejects(c.buildCapturedWorksheetPdf([page]),/capture failed/);else await c.buildCapturedWorksheetPdf([page]);assert(restored);assert(removed);}});

test('PDF capture rasterises the worksheet header icon and restores the original', async () => {
 const png = 'data:image/png;base64,test';
 let visibleIcon;
 const icon = {
  classList:{contains:name=>name==='worksheet-header-icon'},
  complete:true, naturalWidth:128, naturalHeight:128, currentSrc:'icon.svg',
  cloneNode:()=>({decode:async()=>{}, replaceWith:original=>{visibleIcon=original;}}),
  replaceWith:image=>{visibleIcon=image;},
 };
 visibleIcon=icon;
 const page={querySelectorAll:selector=>selector==='img'?[icon]:[],classList:{add(){},remove(){}}};
 const context=vm.createContext({
  setTimeout:()=>{},
  document:{fonts:{},createElement:()=>({
   getContext:()=>({drawImage:(source,...bounds)=>{
    assert.equal(source,icon);
    assert.deepEqual(bounds,[0,0,256,256]);
   }}),
   toDataURL:()=>png,
  })},
  window:{jspdf:{jsPDF:class{addImage(){}}}},
  html2canvas:async()=>{
   assert.equal(visibleIcon.src,png);
   return {toDataURL:()=>''};
  },
 });
 vm.runInContext(captureFunctions.buildCapturedWorksheetPdf,context);
 await context.buildCapturedWorksheetPdf([page]);
 assert.equal(visibleIcon,icon);
});
