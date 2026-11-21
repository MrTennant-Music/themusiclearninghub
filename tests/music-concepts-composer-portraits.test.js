const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const portraits=require('../music-dictionary/music-concepts-composer-portraits.json');
const source=fs.readFileSync('music-dictionary/music-concepts-audio-editor.js','utf8');
const context={window:{MUSIC_CONCEPT_COMPOSER_PORTRAITS:portraits,MUSIC_CONCEPT_ARTIST_PORTRAITS:require('../music-dictionary/music-concepts-artist-portraits.json')}};
vm.runInNewContext(source.slice(source.indexOf('  function audioDetails('),source.indexOf('  function AudioControls('))+';this.details=audioDetails;',context);
test('composer portrait data agrees in the browser and source; local images exist and remote portraits have source credits',()=>{
 assert.deepEqual(require('../music-dictionary/music-concepts-composer-portraits.js'),portraits);
 for(const[name,item]of Object.entries(portraits.composers)){
  assert.ok(item.src,name);
  if(item.src.startsWith('./'))assert.ok(fs.statSync(path.resolve(item.src)).size>100,name+' local portrait exists');
  else assert.match(item.src,/^https:\/\/upload\.wikimedia\.org\//);
  if(item.status==='portrait'){assert.match(item.sourceUrl,/^https:\/\//);assert.ok(item.credit&&item.license);}
  else assert.equal(item.src,'./ui-icons/assessment-cover-quavers.svg');
 }
});
test('classical portraits override both saved album artwork and SoundCloud artwork, including failed-player views',()=>{
 for(const artist of ['Johann Sebastian Bach','Wolfgang Amadeus Mozart','Ludwig van Beethoven','Frédéric Chopin','George Frideric Handel','Gioachino Rossini','Jacques Offenbach']){
  const clip={title:'Classical work',artist,artworkUrl:'album-cover.jpg',sourceUrl:'https://soundcloud.com/track'};
  const details=context.details(clip,{artwork_url:'runtime-album.jpg'});
  assert.equal(details.artwork,portraits.composers[artist].src);assert.equal(details.portrait.status,'portrait');
  assert.equal(context.details(clip,null).artwork,details.artwork);
 }
});
test('a composer without a verified likeness uses the supplied quavers placeholder, never album art',()=>{
 const details=context.details({title:'Now Is the Month of Maying',artist:'Thomas Morley',artworkUrl:'album-cover.jpg'});
 assert.equal(details.artwork,'./ui-icons/assessment-cover-quavers.svg');assert.equal(details.portrait.status,'no-verified-portrait');
});
test('popular music uses an artist portrait instead of album artwork',()=>{
 const details=context.details({title:'Dancing Queen',artist:'ABBA',artworkUrl:'arrival.jpg'});
 assert.match(details.artwork,/artist-portraits\//);assert.equal(details.portrait.status,'portrait');
 const demo=context.details({title:'Scale',artist:'Unknown demonstrator',artworkUrl:'album.jpg'},{artwork_url:'remote-cover.jpg'});
 assert.equal(demo.artwork,'./ui-icons/assessment-cover-quavers.svg');
});

test('requested musical posters override portraits only for their own examples',()=>{
 const clips=require('../music-dictionary/music-concepts-audio.json').concepts['MC-0004'];
 for(const clip of clips){
  const details=context.details(clip);
  assert.equal(details.artwork,clip.poster.src);
  assert.equal(context.details(clip,null).artwork,clip.poster.src);
  assert.ok(fs.statSync(path.resolve(clip.poster.src)).size>100);
  assert.match(clip.poster.sourceUrl,/^https:\/\//);
 }
 assert.match(context.details({title:'Another song',artist:'Julie Andrews'}).artwork,/artist-portraits\//);
});

test('Scottish recordings use the Saltire when no portrait is available, retaining verified portraits',()=>{
 const audio=require('../music-dictionary/music-concepts-audio.json');
 for(const clip of audio.concepts['MC-0008'])assert.equal(context.details(clip).artwork,'./ui-icons/scotland-flag.svg');
 const runrig=audio.concepts['MC-0146'][1];
 assert.equal(runrig.artworkFallback,'scotland');
 assert.equal(context.details(runrig).artwork,context.window.MUSIC_CONCEPT_ARTIST_PORTRAITS.artists.Runrig.src);
 assert.equal(context.details({title:'Irish Jig',artist:'Traditional'}).artwork,'./ui-icons/assessment-cover-quavers.svg');
 assert.ok(fs.statSync('ui-icons/scotland-flag.svg').size>100);
});

test('artist portrait browser data agrees with the source and all selected local portraits exist',()=>{
 const artists=require('../music-dictionary/music-concepts-artist-portraits.json');
 assert.deepEqual(require('../music-dictionary/music-concepts-artist-portraits.js'),artists);
 for(const [name,item] of Object.entries(artists.artists)){
  assert.equal(item.status,'portrait',name);
  assert.ok(fs.statSync(path.resolve(item.src)).size>100,name);
  assert.match(item.sourceUrl,/^https:\/\//);
 }
});
