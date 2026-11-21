'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('music-escape/app.js','utf8');
test('effects mute stops incidental sounds without interrupting pupil question playback',()=>{
 const calls=[],context={prefs:{muted:false},medalSoundTimer:1,savePrefs:()=>calls.push('save'),stopEffect:()=>calls.push('effect'),MLH:{stopFeedbackSound:()=>calls.push('medal')},clearTimeout:()=>calls.push('cancel'),syncWeather:()=>calls.push('weather'),stopSound(){throw Error('Question playback interrupted');},document:{querySelectorAll(){throw Error('Question audio muted');}}};vm.createContext(context);
 vm.runInContext(source.slice(source.indexOf('function toggleEffects(){'),source.indexOf('function playEffect(')),context);context.toggleEffects();assert.equal(context.prefs.muted,true);assert.deepEqual(calls,['save','effect','weather']);calls.length=0;context.toggleEffects();assert.equal(context.prefs.muted,false);assert.deepEqual(calls,['save','weather']);
});
test('question tones and iframe bridge remain audible with effects muted',()=>{
 let presses=0;const context={prefs:{muted:true,puzzle:75,effects:30},piano:{press(){presses++;return Promise.resolve();},release(){}},soundTimers:[],setTimeout:()=>1,status(){}};vm.createContext(context);
 vm.runInContext(source.slice(source.indexOf('function tone('),source.indexOf('function sequence(')),context);context.tone(60);assert.equal(presses,1);context.tone(60,350,'effects');assert.equal(presses,1);
 const bridge={};const text=source.slice(source.indexOf('window.EscapePracticeBridge={'),source.indexOf(' clue:token=>',source.indexOf('window.EscapePracticeBridge={')));const muted=text.match(/muted:(\(\)=>[^,]+),/)[1];vm.runInContext('globalThis.isQuestionMuted='+muted,context);assert.equal(context.isQuestionMuted(),false);
 assert(source.includes("const a=host.querySelector('audio');a.muted=false;"));
});
