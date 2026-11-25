const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
test('deferred shared dependencies are versioned from their actual content',async()=>{
 const context={window:{}};
 vm.runInNewContext(fs.readFileSync('music-games/runtime/index.js','utf8'),context);
 const files=context.window.IGRuntimeFiles;
 for(const name of ['diagram-core','sounds','timer','level-test-core']){
  const file='music-games/'+name+'.js';
  const hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,12);
  assert.equal(files[name],'./'+file+'?v='+hash);
 }
 const requested=[];
 context.document={createElement:()=>({remove(){}}),head:{appendChild(element){requested.push(element.src||element.href);assert.ok(fs.existsSync((element.src||element.href).split('?')[0]),'Missing deferred resource: '+(element.src||element.href));queueMicrotask(()=>element.onload());}}};
 vm.runInNewContext(fs.readFileSync('music-games/loader.js','utf8'),context);
 await context.window.IGRuntime.load('player','labelled-diagram');
 assert.ok(requested.includes(files['level-test-core']));assert.ok(requested.indexOf(files['level-test-core'])<requested.indexOf(files.session));
 assert.ok(requested.includes(files['diagram-core']));assert.ok(requested.includes(files.diagram));
 assert.ok(requested.indexOf(files['diagram-core'])<requested.indexOf(files.diagram));
 await assert.rejects(context.window.IGRuntime.load('editor','labelled-diagram'),/Unknown game screen/);
 assert.equal(requested.filter(url=>url===files['diagram-core']).length,1);
});

test('deferred player styles change their URLs whenever their contents change',()=>{
 const context={window:{}};vm.runInNewContext(fs.readFileSync('music-games/runtime/index.js','utf8'),context);
 for(const name of ['learning','arcade','content','preview-theme','diagram','player']){const file='music-games/'+name+'.css',hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,12);assert.equal(context.window.IGRuntimeStyles[file],'./'+file+'?v='+hash);}
});

test('bundled games display the Concept Dictionary name and keep their existing IDs',async()=>{
 const legacy={id:'hub-dictionary-example',title:'Example',description:'From the Music Dictionary.',folder:'Music Dictionary'};
 const window={IGActivityIndex:[{...legacy}],IGCore:{normalize:value=>value}};
 vm.runInNewContext(fs.readFileSync('music-games/loader.js','utf8'),{window});
 window.IGRuntime.registerActivity({...legacy});
 for(const activity of [window.IGActivityIndex[0],await window.IGRuntime.activity(legacy.id)]){
  assert.equal(activity.id,legacy.id);
  assert.equal(activity.description,'From the Concept Dictionary.');
  assert.equal(activity.folder,'Concept Dictionary');
 }
});
