'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const core=require('../music-escape/core');
function sharedPanel(MLH){
 const source=fs.readFileSync('shared/hub-shell.js','utf8'),context={React,MLH,useClickAway(){}};vm.createContext(context);
 vm.runInContext(source.slice(source.indexOf('  function ScoreStreakPanel('),source.indexOf('  MLH.AppHeader ='))+'globalThis.Panel=ScoreStreakPanel;',context);return context.Panel;
}
test('opening stats show total rooms and unfilled lives before changing to live progress',()=>{
 const source=fs.readFileSync('music-escape/app.js','utf8');
 const MLH={shell:{scoreTileClass:'score-tile'},achievements:{medals:{bronze:{icon:'bronze.svg'},silver:{icon:'silver.svg'},gold:{icon:'gold.svg'},diamond:{icon:'diamond.svg'}}}};MLH.ScoreStreakPanel=sharedPanel(MLH);
 const context={React,MLH,C:core,classroomSeed:null,sharedCollection:null,roomPreviewIndex:null,awaitingPlay:true,active:false,medalCelebrationUntil:0,medalCelebrationKey:0,state:{room:0,mistakes:0,finished:false,fragments:[]},MAX_LIVES:3,adventure:Array(6),MLHGamePractice:{livesDisplay(value){return {value,label:'Lives',fillPercent:100,fillColor:'#green'};}}};
 vm.createContext(context);vm.runInContext(source.slice(source.indexOf('function HeaderStats(){'),source.indexOf('function header(){')),context);
 let html=renderToStaticMarkup(React.createElement(context.HeaderStats));
 assert(html.includes('>Rooms</div>'));assert(html.includes('>6</div>'));assert(html.includes('>3</strong>'));assert(!html.includes('background:#green'));assert(!html.includes('Highest:'));assert(!html.includes('>Score<'));
 context.awaitingPlay=false;context.active=true;
 html=renderToStaticMarkup(React.createElement(context.HeaderStats));assert(html.includes('>Room</div>'));assert(html.includes('>1/6</div>'));assert(html.includes('background:#green'));
});
test('shared medal component supports a single Room card and its established celebration',()=>{
 const MLH={shell:{scoreTileClass:'score-tile'},achievements:{medals:{bronze:{backgroundColor:'bronze-fill',color:'bronze-text'}}}},Panel=sharedPanel(MLH);
 const props={assets:{bronze:'bronze.svg',silver:'silver.svg',gold:'gold.svg',diamond:'diamond.svg'},streak:3,bestStreak:3,correct:3,attempted:3,accuracy:100,resetScore(){},medalEligible:true,medalThresholdValues:[3,4,5,6],streakDisplay:{label:'Room',value:'3/6',subtitle:''}};
 const single=renderToStaticMarkup(React.createElement(Panel,{...props,showScore:false,confettiKey:1}));
 assert.equal((single.match(/role="button"/g)||[]).length,1);assert(single.includes('confettiDrop'));assert(single.includes('bronze-fill'));assert(!single.includes('Highest:'));
 const normal=renderToStaticMarkup(React.createElement(Panel,props));assert.equal((normal.match(/role="button"/g)||[]).length,2);assert(normal.includes('Score'));
});
