const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
for(const [file,key,count] of [['composition-bass-sampler.js','BassSampler',40],['drum-machine-audio.js','DrumAudio',50]]){
 test(`${key} limits sample downloads and recovers from an interrupted request`,async()=>{
  const window={MLH:{}},attempts=new Map();let active=0,peak=0,first;
  const fetch=async url=>{
   first??=url;const attempt=(attempts.get(url)||0)+1;attempts.set(url,attempt);
   active++;peak=Math.max(peak,active);await new Promise(resolve=>setImmediate(resolve));active--;
   if(url===first&&attempt===1)throw new TypeError('Failed to fetch');
   return {ok:true,arrayBuffer:async()=>new ArrayBuffer(4)};
  };
  vm.runInNewContext(fs.readFileSync(file,'utf8'),{window,fetch});
  const ctx={decodeAudioData:async()=>({duration:1})};
  await window.MLH[key].prepare(ctx);await window.MLH[key].prepare(ctx);
  assert.equal(attempts.size,count);assert.equal(attempts.get(first),2);assert.ok(peak<=4,`Peak download count: ${peak}`);
 });
}
