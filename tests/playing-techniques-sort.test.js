const test=require('node:test'),assert=require('node:assert/strict');
const Sort=require('../shared/music-games-sort');
test('Playing Techniques is removed at every level and old recipes cannot restore it',()=>{
 for(const level of ['N3','N4','N5','H','AH']){
  assert(!Sort.availableTypes(level).includes('techniques'));
  assert.throws(()=>Sort.create({level,type:'techniques'}),/valid sort/);
  assert.throws(()=>Sort.fromRecipe({version:Sort.data.version,level,type:'techniques',groups:[],cards:[]}),/no longer available/);
 }
 assert(!Sort.collections.some(collection=>collection.type==='techniques'));
 assert.equal(Sort.data.playingTechniques,undefined);
 assert(Sort.data.instrumentPhotos.every(photo=>!photo.file.includes('playing-techniques')));
});
