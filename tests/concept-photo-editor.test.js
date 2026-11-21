const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {createPhotoServer,commonsTitle}=require('../scripts/concept-photo-editor.cjs');
test('A saved selection survives reload while other concept photos remain unchanged',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'concept-photo-editor-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const original={subjects:{shared:{src:'./old.jpg',caption:'Existing photo'}},concepts:{'MC-0001':'shared','MC-0002':'shared','MC-0003':null}};
 await fs.mkdir(path.join(root,'music-dictionary'),{recursive:true});
 await fs.writeFile(path.join(root,'music-dictionary/music-concepts-photos.json'),JSON.stringify(original));
 const server=createPhotoServer({projectRoot:root,resolvePhoto:async()=>({pageId:123,photo:{src:'https://upload.wikimedia.org/wikipedia/commons/example.jpg',sourceUrl:'https://commons.wikimedia.org/wiki/File:Chosen.jpg',caption:'Chosen',credit:'Author',license:'CC BY-SA 4.0'}})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));const url='http://127.0.0.1:'+server.address().port;
 const response=await fetch(url+'/photos/MC-0001',{method:'POST',headers:{Origin:'http://127.0.0.1:8765','Content-Type':'application/json'},body:JSON.stringify({sourceUrl:'https://commons.wikimedia.org/wiki/File:Chosen.jpg'})});assert.equal(response.status,200);
 const current=await fetch(url+'/photos').then(r=>r.json());assert.equal(current.concepts['MC-0001'],'custom-mc-0001');assert.equal(current.concepts['MC-0002'],'shared');assert.equal(current.concepts['MC-0003'],null);assert.deepEqual(current.subjects.shared,original.subjects.shared);
 assert.equal(current.subjects['custom-mc-0001'].src,'https://upload.wikimedia.org/wikipedia/commons/example.jpg');assert.match(await fs.readFile(path.join(root,'music-dictionary/music-concepts-photos.js'),'utf8'),/custom-mc-0001/);
 const removal=await fetch(url+'/photos/MC-0001',{method:'POST',headers:{Origin:'http://127.0.0.1:8765','Content-Type':'application/json'},body:JSON.stringify({remove:true})});assert.equal(removal.status,200);assert.equal((await removal.json()).photo,null);
 const removed=await fetch(url+'/photos').then(r=>r.json());assert.equal(removed.concepts['MC-0001'],null);assert.equal(removed.concepts['MC-0002'],'shared');assert.deepEqual(removed.subjects.shared,original.subjects.shared);assert.equal(removed.subjects['custom-mc-0001'].src,'https://upload.wikimedia.org/wikipedia/commons/example.jpg');
 const rejected=await fetch(url+'/photos/MC-0002',{method:'POST',headers:{Origin:'https://example.com','Content-Type':'application/json'},body:'{}'});assert.equal(rejected.status,403);
});
test('The photo URL resolver accepts only Commons file pages',()=>{assert.equal(commonsTitle('https://commons.wikimedia.org/wiki/File:Photo_name.jpg'),'File:Photo name.jpg');for(const url of ['http://localhost/file','https://example.com/photo','https://commons.wikimedia.org/wiki/Main_Page'])assert.throws(()=>commonsTitle(url));});
