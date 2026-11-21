'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const content=require('../music-escape/content.js');
const duration=require('../scripts/lib/m4a-duration.cjs');
test('every M4A listening clip ends inside its actual local recording',()=>{
 for(const q of content.audio){
  if(!q.src.endsWith('.m4a'))continue;
  const seconds=duration(fs.readFileSync(decodeURIComponent(q.src)));
  assert(q.start>=0&&q.end>q.start&&q.end<=seconds+.001,q.questionId);
 }
 const corrected=content.audio.find(q=>q.questionId==='AQ-H-MC0245-01');
 assert(corrected.end>44&&corrected.end<46,'Bartók excerpt must use its actual 45-second recording');
});
test('the offline shell includes current Escape Room startup assets',()=>{
 const vm=require('node:vm'),source=fs.readFileSync('music-escape-sw.js','utf8');
 const shell=vm.runInNewContext(source.slice(0,source.indexOf("self.addEventListener"))+'SHELL');
 for(const file of shell)assert(fs.existsSync(file),file);
 assert(shell.includes('music-escape/object-effects.js'));
 assert(shell.includes('music-escape/school-exterior.png'));
});

test('cached recordings support open, suffix and unsatisfiable byte ranges', async () => {
 const vm=require('node:vm');
 const handlers={};
 const data=Uint8Array.from([10, 20, 30, 40]);
 const cache={match:()=>new Response(data, {headers:{'Content-Type':'audio/mp4'}})};
 vm.runInNewContext(fs.readFileSync('music-escape-sw.js','utf8'), {
  self:{location:{origin:'https://hub.test'},addEventListener:(name,handler)=>{handlers[name]=handler;}},
  caches:{open:async()=>cache}, Response, URL,
 });
 async function request(range) {
  let response;
  handlers.fetch({
   request:new Request('https://hub.test/audio/example.m4a', {headers:{range}}),
   respondWith:value=>{response=value;},
  });
  return response;
 }
 for(const range of ['bytes=2-', 'bytes=-2']){
  const response=await request(range);
  assert.equal(response.status,206);
  assert.equal(response.headers.get('Content-Range'),'bytes 2-3/4');
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],[30,40]);
 }
 for(const range of ['bytes=4-', 'bytes=3-1', 'bytes=-0']){
  const response=await request(range);
  assert.equal(response.status,416);
  assert.equal(response.headers.get('Content-Range'),'bytes */4');
 }
});
