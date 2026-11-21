const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(){
 const sources=[],requests=[],decoded=[];
 const ctx={decodeAudioData:async bytes=>{decoded.push(bytes);return {id:decoded.length};},
 createBufferSource(){const s={playbackRate:{value:1},connect(){},start(t){this.started=t;},stop(t){this.stopped=t;}};sources.push(s);return s;},
 createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}};
 const window={MLH:{}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../composition-bass-sampler.js'),'utf8'),{window,fetch:async url=>{requests.push(url);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(4)};}});
 return {sampler:window.MLH.BassSampler,ctx,sources,requests,decoded};
}
test('bass preserves SFZ pitch zones, two layers, four takes and cached decoding',async()=>{
 const {sampler,ctx,sources,requests,decoded}=setup();
 await sampler.prepare(ctx);await sampler.prepare(ctx);
 assert.equal(requests.length,40);assert.equal(decoded.length,40);
 for(const [midi,root] of [[20,20],[26,20],[27,27],[32,32],[36,32],[37,37],[40,37],[41,41],[48,41]])assert.equal(sampler.regionFor(midi).root,root);
 for(let i=0;i<5;i++)sampler.play(ctx,{}, {midi:36,velocity:.8,duration:2},1,.5);
 assert.equal(sources[0].buffer,sources[4].buffer);assert.notEqual(sources[0].buffer,sources[1].buffer);
 assert.equal(sources[0].playbackRate.value,2**(4/12));assert.equal(sources[0].started,1);assert.equal(sources[0].stopped,2.12);
 sampler.play(ctx,{}, {midi:36,velocity:.3,duration:1},0,1);
 assert.notEqual(sources[5].buffer,sources[1].buffer);
});
test('all compressed bass assets are present and decoding is reused across audio contexts',async()=>{
 const files=fs.readdirSync('audio/composition-bass').filter(n=>n.endsWith('.m4a'));
 assert.equal(files.length,40);assert.ok(files.every(n=>fs.statSync('audio/composition-bass/'+n).size>1000));
 assert.ok(files.reduce((sum,n)=>sum+fs.statSync('audio/composition-bass/'+n).size,0)<12_000_000);
 const {sampler,ctx,decoded}=setup();await sampler.prepare(ctx);await sampler.prepare({...ctx});assert.equal(decoded.length,40);
});
