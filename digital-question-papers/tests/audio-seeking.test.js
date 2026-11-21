'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../exam-audio.js'),'utf8');
const start=source.indexOf('    async function seekTo('),end=source.indexOf('    function render()',start);
function fixture(){
 let copied=false,time=0,copies=0;const timers=[],progress={},elapsed={};
 const audio={duration:30,paused:true,get currentTime(){return time;},set currentTime(value){time=copied?value:0;}};
 const context={audio,destroyed:false,seekVersion:0,root:{setTimeout(fn){timers.push(fn);}},container:{querySelector:selector=>selector==='[data-progress]'?progress:elapsed},loadSeekableAudioCopy:async()=>{copies++;copied=true;return true;},playCurrent:async()=>true,formatTime:value=>String(value)};
 vm.runInNewContext(source.slice(start,end)+';this.seek=seekTo;',context);
 return{context,audio,timers,progress,elapsed,copies:()=>copies};
}
test('seeking falls back to a local audio copy when the original source cannot seek',async()=>{
 const f=fixture(),pending=f.context.seek(15);f.timers.shift()();await pending;
 assert.equal(f.audio.currentTime,15);assert.equal(f.progress.value,'500');assert.equal(f.elapsed.textContent,'15');assert.equal(f.copies(),1);
});
test('rapid scrubbing keeps the latest target and ignores discarded players',async()=>{
 const f=fixture(),first=f.context.seek(10),second=f.context.seek(20);f.timers.splice(0).forEach(fn=>fn());await Promise.all([first,second]);
 assert.equal(f.audio.currentTime,20);assert.equal(f.copies(),1);
 const gone=fixture(),pending=gone.context.seek(15);gone.context.destroyed=true;gone.timers.shift()();await pending;assert.equal(gone.copies(),0);
});
