const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const concepts=require('../music-dictionary/music-concepts-data.js'),photos=require('../music-dictionary/music-concepts-photos.json');
test('Photo assignments use local images with source credits or explicit empty slots',()=>{
 assert.ok(concepts.concepts.every(concept=>Object.hasOwn(photos.concepts,concept.id)), "Every current concept needs an explicit photo assignment");
 for(const concept of concepts.concepts){
  const key=photos.concepts[concept.id];
  if(key!==null)assert.ok(photos.subjects[key],concept.name+' needs an assigned photo');
 }
 for(const [name,photo] of Object.entries(photos.subjects)){
  assert.ok(photo.alt&&photo.caption&&photo.credit&&photo.license,name+' needs photo attribution');
  if(photo.locallyRendered){
   assert.equal(photo.credit,'The Music Learning Hub');
   assert.ok(photo.sourceTitle,'Locally rendered images need a source description');
  }else if(photo.generated){
   assert.equal(photo.credit,'AI-generated illustration');
  }else{
   assert.match(photo.sourceUrl,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
   assert.match(photo.imageUrl,/^https:\/\/(?:upload|thumb)\.wikimedia\.org\//);
  }
  assert.match(photo.src,/^\.\/music-dictionary\/concept-photos\/[\w.-]+\.(?:jpg|png|gif)$/i);
  const bytes=fs.readFileSync(path.resolve(__dirname,'..',photo.src));
  const signatures={jpg:'ffd8ff',png:'89504e470d0a1a0a',gif:'47494638'};
  assert.ok(bytes.toString('hex',0,8).startsWith(signatures[path.extname(photo.src).slice(1)]),name+' needs a valid image file');
 }
 assert.deepEqual(require('../music-dictionary/music-concepts-photos.js'),photos);
});

test('Removed Bernstein and piano-key placeholders stay absent',()=>{assert.doesNotMatch(JSON.stringify(photos),/Bernstein/i);assert.ok(!photos.subjects.keyboard);});
