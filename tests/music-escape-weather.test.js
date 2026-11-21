'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function harness(){
 const source=fs.readFileSync('music-escape/app.js','utf8');
 let finishFade;
 const context={state:{finished:false,mistakes:0},MAX_LIVES:3,prefs:{ambience:10,muted:false},document:{hidden:false,addEventListener(){}},MLH:{fadeOutAudio(audio){return new Promise(resolve=>{finishFade=()=>{audio.paused=true;resolve();};});}},Audio:class{constructor(src){this.src=src;this.paused=true;this.plays=0;}play(){this.paused=false;this.plays++;return Promise.resolve();}}};
 vm.createContext(context);
 vm.runInContext(source.slice(source.indexOf('// Weather has'),source.indexOf('// End of independent weather channel.'))+'\nglobalThis.weather=weatherAudio;',context);
 return {context,run:code=>vm.runInContext(code,context),finish:async()=>{finishFade();await Promise.resolve();}};
}
test('weather waits for Play, then loops quietly across puzzle changes',()=>{
 const {context:c,run}=harness();run('syncWeather()');assert.equal(c.weather.plays,0);
 run('enterWeather()');assert.equal(c.weather.loop,true);assert.ok(Math.abs(c.weather.volume-.15)<1e-9);assert.equal(c.weather.plays,1);
 run('syncWeather();syncWeather()');assert.equal(c.weather.plays,1);
});
test('weather fades on mute and safely resumes after a rapid unmute',async()=>{
 const {context:c,run,finish}=harness();run('enterWeather();prefs.muted=true;syncWeather()');assert.equal(c.weather.muted,true);run('prefs.muted=false;syncWeather()');assert.equal(c.weather.muted,false);
 assert.equal(c.weather.plays,1);await finish();assert.equal(c.weather.plays,2);assert.equal(c.weather.paused,false);
});
for(const [label,change] of [['hidden tab','document.hidden=true'],['finished game','state.finished=true'],['game over','state.mistakes=3'],['leaving','weatherEntered=false']])test('weather stops for '+label,async()=>{
 const {context:c,run,finish}=harness();run('enterWeather();'+change+';syncWeather()');await finish();assert.equal(c.weather.paused,true);
});

test('blocked playback can retry only after Play has enabled weather',async()=>{
 const {context:c,run}=harness();
 c.weather.play=function(){this.plays++;return Promise.reject({name:'NotAllowedError'});};
 run('retryWeather();syncWeather()');assert.equal(c.weather.plays,0);run('enterWeather()');await Promise.resolve();await Promise.resolve();
 c.weather.play=function(){this.plays++;this.paused=false;return Promise.resolve();};
 run('retryWeather()');assert.equal(c.weather.plays,2);assert.equal(c.weather.paused,false);
});
