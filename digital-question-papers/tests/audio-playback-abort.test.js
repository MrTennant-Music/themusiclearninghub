'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../exam-audio.js'),'utf8');
const start=source.indexOf('    async function playCurrent('),end=source.indexOf('    async function loadSeekableAudioCopy(',start);
function fixture(error,paused=true){const errors=[],audio={paused,play:async()=>{throw error;}};const context={root:{},audio,destroyed:false,playbackErrorReported:false,pauseOtherPlayers:()=>{},reportPlaybackError:e=>errors.push(e)};vm.runInNewContext(source.slice(start,end)+';this.play=playCurrent;',context);return{context,errors};}
test('an intentional pause of a pending play request does not show an audio failure',async()=>{const f=fixture({name:'AbortError'});assert.equal(await f.context.play(),false);assert.deepEqual(f.errors,[]);});
test('an aborted request from a discarded player does not report failure on the next question',async()=>{const f=fixture({name:'AbortError'},false);f.context.audio.play=async()=>{f.context.audio={paused:true};throw{name:'AbortError'};};assert.equal(await f.context.play(),false);assert.deepEqual(f.errors,[]);});
test('actual playback failures remain reported',async()=>{for(const error of [{name:'NotAllowedError'},{name:'NotSupportedError'},{name:'AbortError'}]){const f=fixture(error,false);assert.equal(await f.context.play(),false);assert.deepEqual(f.errors,[error]);}});
