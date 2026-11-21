const test=require('node:test'),assert=require('node:assert/strict');
const audio=require('../music-dictionary/music-concepts-audio.json');
const videos=require('../music-dictionary/music-concepts-videos.js');
const report=require('../maintenance/audio-evidence/dictionary-media-variety-2026-11-01/changes.json');
const normal=text=>text.normalize('NFKD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^a-z0-9]/g,'');

test('the variety review records the current replacements and checked YouTube alternatives',()=>{
 for(const change of report.audioChanges){
  const clip=audio.concepts[change.conceptId].find(c=>c.id===change.clipId);assert.ok(clip,change.title);
  for(const field of ['sourceUrl','title','artist','startSeconds','endSeconds'])assert.equal(clip[field],change[field],change.conceptId+' '+field);
  assert.notEqual(clip.sourceUrl,change.previousSourceUrl);assert.ok(clip.endSeconds>clip.startSeconds);
  if(change.sourceDurationSeconds!==null)assert.ok(clip.endSeconds<=change.sourceDurationSeconds+.001,change.title);
 }
 for(const change of report.videoChanges){
  const video=videos.concepts[change.conceptId];assert.deepEqual(video,change.replacement);
  assert.notEqual(video.videoId||video.src,change.previousVideo.videoId||change.previousVideo.src);
  if(video.videoId)assert.ok(report.verifiedYouTubeLinks[video.sourceUrl],video.title);
 }
});

test('Symphony offers three different symphonies and keeps its audio at a minute',()=>{
 const clips=audio.concepts['MC-0154'];
 assert.deepEqual(clips.map(c=>c.artist),['Pyotr Ilyich Tchaikovsky','Antonín Dvořák']);
 assert.ok(clips[0].title.includes('No. 4'));assert.ok(clips[1].title.includes('No. 9'));
 assert.ok(videos.concepts['MC-0154'].performer.includes('Beethoven'));
 assert.ok(videos.concepts['MC-0154'].title.includes('No. 5'));
 assert.ok(clips.every(c=>c.endSeconds-c.startSeconds>=60));
});

test('confirmed repeated works cannot return across the selected audio and featured video',()=>{
 // Work names identify musical repeats even when the recording or performer changes.
 const works=[
  /thrillisgone/,/takefive/,/backinblack/,/rockaroundtheclock/,/scotlandthebrave/,
  /einekleinenachtmusik/,/ohhappyday/,/musicfor18musicians/,
  /lamentforthechildren/,/preludealapresmididunfaune/,/chameleon/,
  /erlkonig/,/etudeauxcheminsdefer/,/foruntousachildisborn/,/comfortyemypeople/,
  /ifyeloveme/,/flowmytears/,/nowisthemonthofmaying/,/ohauptvollblutundwunden/,
  /lingus/,/frerejacques/,/ahvousdiraije/,/aharddaysnight/,/praisemysoulthekingofheaven/,
  /voiles/,/theshepherdontherock/,/sorocaba/,/turkishmarch/,
 ];
 for(const cid of new Set([...report.audioChanges,...report.videoChanges].map(c=>c.conceptId))){
  const entries=[...audio.concepts[cid],...[videos.concepts[cid]].flat()];
  const names=entries.map(e=>normal(e.title));
  for(const pattern of works){const regex=pattern instanceof RegExp?pattern:new RegExp(pattern);assert.ok(names.filter(n=>regex.test(n)).length<=1,cid+' repeats '+regex);}
 }
 for(const cid of ['MC-0018','MC-0141','MC-0175','MC-0181','MC-0194','MC-0225','MC-0237','MC-0280','MC-0284','MC-0286','MC-0287','MC-0289','MC-0290','MC-0295']){
  const titles=audio.concepts[cid].map(c=>normal(c.title));assert.equal(new Set(titles).size,titles.length,cid);
 }
});

test('specialised replacements retain different, explicitly identified musical examples',()=>{
 assert.equal(audio.concepts['MC-0181'][1].title, 'Study in C Major, Op. 35 No. 13');
 assert.equal(audio.concepts['MC-0181'][1].credit, 'Paul Boyle, classical guitar');
 assert.equal(audio.concepts['MC-0181'][1].sourceUrl, 'https://soundcloud.com/paul-boyle-3/17-estudio-no-13-op-35-sor');
 assert.ok(audio.concepts['MC-0237'][1].title.includes('Bright Seraphim'));
 assert.ok(audio.concepts['MC-0289'][1].title.includes('BWV 847'));
 assert.ok(audio.concepts['MC-0295'][1].title.includes('BWV 851'));
 assert.deepEqual(audio.concepts['MC-0072'].map(c=>c.title),['Fionnghuala',"Faca sibh Màiri nigh’n Alasdair / Sutors of Selkirk / Bodachan A’ Mhìrein"]);
});

test('mouth music and the replaced Bothy ballad retain the researched unaccompanied sources',()=>{
 const mouth=audio.concepts['MC-0072'],bothy=audio.concepts['MC-0145'];
 assert.match(mouth[0].sourceUrl,/fionnghuala-anuna-arr-michael-mcglynn-live-acapella$/);
 assert.equal(mouth[1].sourceUrl,'https://soundcloud.com/elenapirasmusic/puirt-a-beul-faca-sibh-m-iri');
 assert.equal(mouth[1].credit,'Elena Piras');
 assert.equal(bothy[1].sourceUrl,'https://soundcloud.com/fifesing/sleepytoun-in-the-morning');
 assert.equal(bothy[1].credit,'Jim Taylor');
 assert.equal(bothy[0].sourceUrl,'https://soundcloud.com/normankennedy-music/drumdelgie');
 for(const clip of [...mouth,bothy[1]])assert.ok(clip.endSeconds-clip.startSeconds>=60);
});
