const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),crypto=require('node:crypto');
function setup(fail=false){
 const requests=[],sources=[];let decodes=0;
 const ctx={decodeAudioData:async()=>{decodes++;return {duration:3,sampleRate:100,numberOfChannels:1,getChannelData:()=>new Float32Array(300)};},createBufferSource(){const source={playbackRate:{value:1},connect(){},start(t){this.startTime=t;},stop(t){this.stopTime=t;}};sources.push(source);return source;},createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}};
 const window={MLH:{}};
 vm.runInNewContext(fs.readFileSync('composition-melody-sampler.js','utf8'),{window,fetch:async url=>{requests.push(url);return {ok:!fail,status:404,arrayBuffer:async()=>new ArrayBuffer(8)};}});
 return {sampler:window.MLH.MelodySampler,ctx,requests,sources,decodes:()=>decodes};
}
test('every melody option uses its own sampled instrument with cached decoding and nearest-note tuning',async()=>{
 const {sampler,ctx,requests,sources,decodes}=setup();
 for(const instrument of sampler.instruments){
  await sampler.prepare(ctx,instrument);await sampler.prepare(ctx,instrument);
  sampler.play(ctx,{}, {midi:61,duration:2,velocity:.9},1,.5,instrument);
  const source=sources.at(-1);assert.ok(source.buffer);assert.equal(source.playbackRate.value,2**(1/12));assert.equal(source.stopTime,2.16);
  assert.equal(!!source.loop,['organ','strings','flute','brass','synth','pad'].includes(instrument));
 }
 assert.equal(requests.length,189);assert.equal(decodes(),189);
 await sampler.prepare({...ctx},'flute');assert.equal(decodes(),189);
 assert.ok(requests.every(url=>url.startsWith('./audio/composition-melody/')));
});
test('sample failures retry and remain explicit instead of falling back to an oscillator',async()=>{
 const {sampler,ctx,requests}=setup(true);
 await assert.rejects(sampler.prepare(ctx,'flute'),/Could not load the flute samples/);
 assert.ok(requests.length>=2);
 assert.throws(()=>sampler.play(ctx,{}, {midi:60,duration:1,velocity:1},0,1,'flute'),/not ready/);
});
test('all 189 compressed melody assets match the pinned manifest and fit in five MB',()=>{
 const manifest=JSON.parse(fs.readFileSync('audio/composition-melody/manifest.json','utf8'));let size=0,count=0;
 assert.equal(manifest.license,'CC-BY-3.0');assert.equal(Object.keys(manifest.instruments).length,9);
 for(const instrument of Object.values(manifest.instruments)){
  assert.equal(instrument.samples.length,21);
  for(const sample of instrument.samples){const bytes=fs.readFileSync('audio/composition-melody/'+sample.file);assert.equal(bytes.length,sample.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),sample.sha256);size+=bytes.length;count++;}
 }
 assert.equal(count,189);assert.ok(size<5_000_000);
});
