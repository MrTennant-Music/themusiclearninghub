const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function library(fetch){const window={};vm.runInNewContext(fs.readFileSync('music-games/runtime/image-bank.js','utf8'),{window,React,URLSearchParams,fetch,DOMParser:class{parseFromString(text){return {body:{textContent:text}};}}});return window;}
function Modal({title,children}){return React.createElement('section',null,React.createElement('h2',null,title),children);}
test('Editor audio library retains its existing Add Audio title and Upload control',()=>{const w=library();const html=renderToStaticMarkup(React.createElement(w.IGMediaBank,{Modal,type:'audio',query:'Symphony'}));assert.match(html,/<h2>Add Audio<\/h2>/);assert.match(html,/>Upload<\/button>/);});
function dictionaryAudio(hostname,clips=[]){const window={MusicConceptAudioTiming:require('../music-dictionary/music-concepts-audio-timing.js'),MUSIC_CONCEPT_AUDIO:{concepts:{'MC-0001':clips}}};vm.runInNewContext(fs.readFileSync('music-dictionary/music-concepts-audio-editor.js','utf8'),{window,React,location:{hostname,port:'8765'}});return renderToStaticMarkup(React.createElement(window.MusicConceptAudio,{concept:{id:'MC-0001',name:'Blues'}}));}
test('Dictionary shows curated audio in a row after Listen for and exposes temporary controls only locally',()=>{const clip={id:'one',name:'Chosen performance',src:'./music-dictionary/concept-audio/chosen.mp3',sourceUrl:'https://commons.wikimedia.org/wiki/File:Chosen.mp3',license:'CC0',credit:'Performer'};const local=dictionaryAudio('127.0.0.1',[clip]);assert.match(local,/mc-audio-row/);assert.match(local,/>Add audio<\/button>/);assert.match(local,/>Remove audio<\/button>/);assert.match(local,/chosen.mp3/);const pupil=dictionaryAudio('school.example',[clip]);assert.match(pupil,/Chosen performance/);assert.doesNotMatch(pupil,/Add audio|Remove audio/);assert.equal(dictionaryAudio('school.example'),'');const page=fs.readFileSync('music-dictionary/music-concepts.js','utf8');assert.ok(page.indexOf("className:'mc-features'")<page.indexOf('h(window.MusicConceptAudio'));assert.doesNotMatch(page,/More examples|IGMediaBank/);});
test('Saved browser manifest matches the authoritative audio choices',()=>{assert.deepEqual(require('../music-dictionary/music-concepts-audio.js'),JSON.parse(fs.readFileSync('music-dictionary/music-concepts-audio.json','utf8')));});
test('Shared search requests Wikimedia audio and retains playable MP3 and licence details',async()=>{let requested;const w=library(async url=>{requested=new URL(url);return {ok:true,json:async()=>({query:{pages:[{index:1,pageid:1,title:'File:Symphony.ogg',videoinfo:[{mediatype:'AUDIO',url:'https://upload.wikimedia.org/example.ogg',descriptionurl:'https://commons.wikimedia.org/wiki/File:Symphony.ogg',mime:'audio/ogg',derivatives:[{type:'audio/mpeg',src:'https://upload.wikimedia.org/example.mp3'}],extmetadata:{LicenseShortName:{value:'CC0'}}}]}]}})}});const result=await w.IGMediaSearch('Symphony',0,undefined,'audio');assert.equal(requested.hostname,'commons.wikimedia.org');assert.equal(requested.searchParams.get('gsrsearch'),'Symphony filetype:audio');assert.equal(result.images[0].media.src,'https://upload.wikimedia.org/example.mp3');assert.equal(result.images[0].media.license,'CC0');});
test('Saved audio contains no removed uploads or missing local audio files',()=>{
 const path=require('node:path');
 const data=require('../music-dictionary/music-concepts-audio.js');
 const removed=new Set(['34486e59b492aae01f01','a989036f323a997e4069','f37ac6c3092cba93eeb0']);
 for(const clips of Object.values(data.concepts))for(const clip of clips){
  assert.ok(!removed.has(clip.id),'Unwanted uploads must stay removed');
  if(clip.src?.startsWith('./'))assert.ok(fs.existsSync(path.resolve(__dirname,'..',clip.src)),clip.name+' needs its local file');
 }
 assert.ok(!Object.values(data.concepts).flat().some(c=>c.id==='504e6f81bff8a8dd3636'),'The rejected Russian rock-and-roll recording stays replaced');
});

test('every Styles concept has two audio excerpts and researched SoundCloud additions retain their bounds',()=>{
 const D=require('../music-dictionary/music-concepts-data'),manifest=require('../music-dictionary/music-concepts-audio.json'),browser=require('../music-dictionary/music-concepts-audio.js');
 assert.deepEqual(browser,manifest);
 for(const concept of D.concepts.filter(c=>c.categories.includes('Styles')))assert.ok((manifest.concepts[concept.id]||[]).length>=2,concept.name);
 const research=require('../maintenance/audio-evidence/styles-soundcloud-2026-10-31/additions.json');
 const corrections=require('../maintenance/audio-evidence/dictionary-excerpt-corrections-2026-11-01/corrections.json').corrections;
 const minuteSelections=require('../maintenance/audio-evidence/dictionary-style-minutes-2026-11-01/selections.json');
 assert.equal(research.additions.length,56);
 for(const row of research.additions){if(minuteSelections.excerpts.some(c=>c.conceptId===row.conceptId)||corrections.some(c=>c.replacesClipId===row.clipId||c.clipId===row.clipId))continue;const clip=manifest.concepts[row.conceptId].find(c=>c.id===row.clipId);assert.ok(clip,row.name);assert.equal(clip.provider,'soundcloud');assert.equal(clip.sourceUrl,row.sourceUrl);assert.equal(clip.startSeconds,row.startSeconds);assert.equal(clip.endSeconds,row.endSeconds);assert.ok(clip.endSeconds>clip.startSeconds&&clip.endSeconds<=row.sourceDurationSeconds);if(row.sourcePolicy==='SNIP'){assert.equal(clip.startSeconds,0);assert.ok(clip.endSeconds<=30);}}
});

test('flagged style recordings are replaced with distinct works and vocal passages remain within available audio',()=>{
 const data=require('../music-dictionary/music-concepts-audio.json');
 const rows=require('../maintenance/audio-evidence/dictionary-excerpt-corrections-2026-11-01/corrections.json').corrections;
 const minutes=require('../maintenance/audio-evidence/dictionary-style-minutes-2026-11-01/selections.json');
 for(const row of rows){if(minutes.replacements.some(c=>c.replacesClipId===row.clipId))continue;const clip=data.concepts[row.conceptId].find(c=>c.id===row.clipId);assert.ok(clip,row.title);assert.equal(clip.sourceUrl,row.sourceUrl);assert.equal(clip.startSeconds,row.startSeconds);assert.ok(clip.endSeconds<=row.sourceDurationSeconds&&clip.endSeconds>clip.startSeconds);}
 assert.deepEqual(data.concepts['MC-0079'].map(c=>c.title),['In the Mood','Take the “A” Train']);
 assert.equal(data.concepts['MC-0069'][1].title,'Shosholoza');
 assert.equal(data.concepts['MC-0073'][1].artist,'Gioachino Rossini');
 assert.equal(data.concepts['MC-0075'][0].startSeconds,15.5);
 assert.equal(data.concepts['MC-0075'][1].startSeconds,1.1);
 assert.equal(data.concepts['MC-0070'][0].artist,'George Frideric Handel');
});

test('every Styles example lasts at least one minute inside a checked full source',()=>{
 const D=require('../music-dictionary/music-concepts-data.js'),A=require('../music-dictionary/music-concepts-audio.json');
 const review=require('../maintenance/audio-evidence/dictionary-style-minutes-2026-11-01/selections.json');
 const styles=D.concepts.filter(c=>c.categories.includes('Styles'));
 assert.equal(review.conceptCount,styles.length);assert.equal(review.exampleCount,styles.reduce((n,c)=>n+A.concepts[c.id].length,0));
 for(const concept of styles)for(const clip of A.concepts[concept.id]){
  const evidence=review.excerpts.find(r=>r.conceptId===concept.id&&r.clipId===clip.id);assert.ok(evidence,concept.name+' / '+clip.title);
  assert.ok(clip.endSeconds-clip.startSeconds>=60-1e-6,concept.name+' / '+clip.title+' must last a minute');
  assert.equal(clip.sourceUrl,evidence.sourceUrl);assert.equal(clip.startSeconds,evidence.startSeconds);assert.equal(clip.endSeconds,evidence.endSeconds);
  assert.notEqual(evidence.policy,'SNIP');assert.ok(clip.endSeconds<=evidence.sourceDurationSeconds+0.001);
 }
});

test('Scots ballad uses the checked sung Loch Lomond cover, including its verse and chorus',()=>{
 const clip=require('../music-dictionary/music-concepts-audio.json').concepts['MC-0078'][0];
 const evidence=require('../maintenance/audio-evidence/dictionary-loch-lomond-vocal-2026-11-01.json');
 assert.equal(clip.sourceUrl,'https://soundcloud.com/deanchalmersmusic/loch-lomond-runrig-dean');
 assert.equal(clip.credit,'Dean Chalmers');assert.equal(clip.title,'Loch Lomond');
 assert.ok(clip.startSeconds<=evidence.vocalEntrySeconds);
 assert.ok(clip.endSeconds>evidence.chorusEntrySeconds);
 assert.ok(clip.endSeconds-clip.startSeconds>=60);
 assert.ok(clip.endSeconds<=evidence.sourceDurationSeconds);
});

test('major and minor tonality each have two full opening excerpts in the intended keys',()=>{
 const manifest=require('../music-dictionary/music-concepts-audio.json');
 const research=require('../maintenance/audio-evidence/tonality-soundcloud-2026-10-31/additions.json');
 for(const [id,keys]of [['MC-0084',['G major','E major']],['MC-0085',['G minor','C minor']]]){
  const rows=research.additions.filter(row=>row.conceptId===id);assert.deepEqual(rows.map(row=>row.key),keys);
  for(const row of rows){const clip=manifest.concepts[id].find(c=>c.id===row.clipId);assert.ok(clip);assert.equal(clip.sourceUrl,row.sourceUrl);assert.equal(clip.startSeconds,0);assert.equal(clip.endSeconds,45);assert.notEqual(row.sourcePolicy,'SNIP');assert.ok(row.sourceDurationSeconds>45);}
 }
});

test('arpeggio examples isolate short opening patterns rather than general extracts',()=>{
 const manifest=require('../music-dictionary/music-concepts-audio.json'),research=require('../maintenance/audio-evidence/arpeggio-soundcloud-2026-10-31/additions.json');
 assert.equal(research.additions.length,2);
 for(const row of research.additions){const clip=manifest.concepts['MC-0080'].find(c=>c.id===row.clipId);assert.ok(clip);assert.equal(clip.startSeconds,row.startSeconds);assert.equal(clip.endSeconds,row.endSeconds);assert.ok(clip.endSeconds-clip.startSeconds<=20);assert.notEqual(row.sourcePolicy,'SNIP');}
});

test('Dictionary display titles are clean and credit original song artists or classical composers',()=>{
 const clips=Object.values(require('../music-dictionary/music-concepts-audio.json').concepts).flat();
 for(const clip of clips){
  assert.ok(clip.title?.trim()&&clip.artist?.trim(),clip.name+' needs separate title and artist');
  assert.doesNotMatch(clip.title,/SoundCloud preview|piano\/vocal cover|\[RFM\]|Royalty Free Music|click to download/i);
  assert.ok(!clip.title.toLowerCase().endsWith(' by '+clip.artist.toLowerCase()),clip.title);
 }
 const named=name=>clips.find(c=>c.name===name);
 assert.equal(named('[piano/vocal cover] The Beatles - Let it Be').title,'Let It Be');
 assert.equal(named('[piano/vocal cover] The Beatles - Let it Be').artist,'The Beatles');
 assert.equal(named('[piano/vocal cover] The Beatles - Let it Be').credit,'Jen Zalewski');
 const dancingQueen=clips.find(c=>c.title==='Dancing Queen');
 assert.ok(dancingQueen);assert.equal(dancingQueen.artist,'ABBA');
 assert.equal(named('Piano Sonata No.16 in C-Major, K. 545: I. Allegro — Mozart').artist,'Wolfgang Amadeus Mozart');
 assert.equal(named('Bach: Air on the G String — Sergey Bryukhno').artist,'Johann Sebastian Bach');
 assert.equal(named('Chopin - Raindrop Prelude — Fiona Bechmann').artist,'Frédéric Chopin');
 assert.equal(named('The Manytones — Love on Top (Beyoncé cover: modulation)').artist,'Beyoncé');
 assert.equal(named('PopRocks — Livin’ on a Prayer (Bon Jovi cover: modulation)').artist,'Bon Jovi');
});

test('traditional vocal corrections use full sources and bypass requested introductions',()=>{
 const manifest=require('../music-dictionary/music-concepts-audio.json');
 const review=require('../maintenance/audio-evidence/dictionary-traditional-vocals-2026-11-01.json');
 assert.equal(review.changes.length,6);
 for(const row of review.changes){
  const clip=manifest.concepts[row.conceptId].find(c=>c.id===row.replacement.id);
  assert.deepEqual(clip,row.replacement);
  assert.equal(row.sourcePolicy,'public full stream');
  assert.equal(clip.endSeconds-clip.startSeconds,60);
  assert.ok(clip.endSeconds<=row.sourceDurationSeconds);
 }
 for(const cid of ['MC-0149','MC-0263']){
  assert.equal(manifest.concepts[cid][1].startSeconds,60);
  assert.equal(manifest.concepts[cid][1].endSeconds,120);
 }
 assert.match(manifest.concepts['MC-0221'][0].sourceUrl,/rebecca-gorzynska\/ave-maris-stella-gregorian-chant-roman-liturgy$/);
 assert.equal(manifest.concepts['MC-0147'][1].title,'Zadok the Priest');
 assert.equal(manifest.concepts['MC-0147'][1].startSeconds,120);
 assert.ok(manifest.concepts['MC-0155'].every(c=>c.artist==='Traditional'));
});

test('Tallis Fantasia uses the stronger full recording and a non-silent one-minute passage',()=>{
 const review=require('../maintenance/audio-evidence/dictionary-tallis-audibility-2026-11-01.json');
 const clip=require('../music-dictionary/music-concepts-audio.json').concepts['MC-0271'][1];
 assert.deepEqual(clip,review.replacement);
 assert.match(clip.sourceUrl,/user-auburnsymphonyo\//);
 assert.equal(clip.startSeconds,60);assert.equal(clip.endSeconds,120);
 assert.ok(clip.endSeconds<review.sourceDurationSeconds);
 assert.equal(review.replacementSelectedMinute.durationSeconds,60);
 assert.ok(review.replacementSelectedMinute.rmsDbfs>-35);
 assert.ok(review.replacementSelectedMinute.rmsDbfs-review.previousOpening.rmsDbfs>15);
});
