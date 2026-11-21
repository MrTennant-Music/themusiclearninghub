const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(){
 const requests=[],sources=[],chokes=[];const window={MLH:{}};
 const ctx={currentTime:0,state:'running',destination:{},async resume(){},async decodeAudioData(){return {duration:2,id:requests.length};},
 createBufferSource(){const source={playbackRate:{value:1},connect(){},start(time){this.startTime=time;},stop(time){this.stopTime=time;}};sources.push(source);return source;},
 createGain(){return {gain:{value:0,setTargetAtTime(...args){chokes.push(args);}},connect(){}};},
 createStereoPanner(){return {pan:{value:0},connect(){}};}};
 vm.runInNewContext(fs.readFileSync('drum-machine-audio.js','utf8'),{window,AudioContext:function(){return ctx;},fetch:async url=>{requests.push(url);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(4)};}});
 return {audio:window.MLH.DrumAudio,ctx,requests,sources,chokes};
}
test('rock kit loads only the ten visible parts with five strength layers each',async()=>{
 const {audio,ctx,requests,sources}=setup();await audio.prepare(ctx);await audio.prepare(ctx);
 assert.equal(requests.length,50);
 const notes=[36,38,42,44,46,51,49,50,47,45];
 assert.deepEqual([...new Set(requests.map(url=>+url.split('/').at(-1).split('_')[0]))].sort((a,b)=>a-b),notes.sort((a,b)=>a-b));
 for(const midi of notes)audio.hit(ctx,{}, {midi,velocity:.6},1);
 assert.equal(sources.length,10);assert.ok(sources.every(s=>s.buffer&&s.startTime===1));
 const files=fs.readdirSync('audio/composition-drums').filter(n=>n.endsWith('.m4a'));
 assert.equal(files.length,50);assert.ok(files.reduce((sum,n)=>sum+fs.statSync('audio/composition-drums/'+n).size,0)<1_000_000);
});
test('rock samples retain dynamics, pitch, natural tails and open-hat choking',async()=>{
 const {audio,ctx,sources,chokes}=setup();await audio.prepare(ctx);
 audio.hit(ctx,{}, {midi:46,velocity:.9,pitch:12},2);
 audio.hit(ctx,{}, {midi:42,velocity:.2},3);
 assert.equal(sources[0].playbackRate.value,2);assert.equal(sources[0].stopTime,3.01);
 assert.deepEqual(chokes,[[.0001,3,.01]]);
 assert.notEqual(sources[0].buffer,sources[1].buffer);
 const before=sources.length;audio.hit(ctx,{}, {midi:36,velocity:0},4);assert.equal(sources.length,before);
});
test('pad previews prepare the same rock samples before sounding',async()=>{
 const {audio,requests,sources}=setup();await audio.preview({midi:38,velocity:.7});
 assert.equal(requests.length,50);assert.equal(sources.length,1);
});

test('warm pad previews overlap immediately without resuming a running context',async()=>{
 const {audio,ctx,sources}=setup();let resumes=0;ctx.resume=()=>{resumes++;return new Promise(()=>{});};
 await audio.preview({midi:38,velocity:.7});
 ctx.currentTime=.05;
 const second=audio.preview({midi:36,velocity:.7});
 const third=audio.preview({midi:38,velocity:.7});
 assert.equal(sources.length,3);
 assert.equal(resumes,0);
 assert.equal(sources[1].startTime,.055);
 assert.equal(sources[2].startTime,.055);
 assert.ok(sources[0].stopTime>sources[2].startTime);
 await Promise.all([second,third]);
});
