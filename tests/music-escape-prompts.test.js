'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('shared/escape-literacy-activity.js','utf8');
const context={};vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('  function simplifyPrompt('),source.indexOf('  function useContentHeight(')),context);
test('obvious literacy clues omit questions while tasks and units remain clear',()=>{
 for(const kind of ['interval','keyboardNote','keyboardSingle','noteNames','noteValue','dynamics','repeats','rest','time','rhythmSum','rhythmDictation']){
  const prompt={hidden:false,textContent:'Question'};context.simplifyPrompt({querySelector:()=>prompt},kind);assert.equal(prompt.hidden,true,kind);
 }
 for(const kind of ['triplets']){
  const prompt={hidden:false,textContent:'Question'};context.simplifyPrompt({querySelector:()=>prompt},kind);assert.equal(prompt.textContent,'Crotchet beats');assert.equal(prompt.hidden,false);
 }
 for(const kind of ['follow','melodicDictation','barlines','key','chord','accidentals','scaleDegrees','transpose','enharmonic','articulation','earTraining']){
  const prompt={hidden:false,textContent:'Task-specific instruction'};context.simplifyPrompt({querySelector:()=>prompt},kind);assert.equal(prompt.hidden,false,kind);assert.equal(prompt.textContent,'Task-specific instruction');
 }
 context.simplifyPrompt({querySelector:()=>null},'interval');
});
