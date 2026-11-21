/* Assessment scope uses source concept IDs, never distractor choices or clue text. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),D=require('../music-dictionary/music-concepts-data.js');
const levels=['N3','N4','N5','H','AH'];
const key=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const byName=new Map();
for(const c of D.concepts)for(const name of [c.name,...c.aliases||[],...c.name.split(/\s*\/\s*/)])if(key(name)){const list=byName.get(key(name))||[];if(!list.includes(c))list.push(c);byName.set(key(name),list);}
function resolve(name,level){
 const expansions={'percussion':'Percussion (tuned and untuned)','perfect':'Perfect cadence','imperfect':'Imperfect cadence','plagal':'Plagal cadence','interrupted':'Interrupted cadence','soul':'Soul music','harmonic minor':'Harmonic minor scale','melodic minor':'Melodic minor scale','whole tone':'Whole-tone scale','pentatonic':'Pentatonic scale','cross':'Cross rhythms','dotted':'Dotted rhythms'};
 name=expansions[key(name)]||name;
 const matches=byName.get(key(name))||[],exact=matches.filter(c=>key(c.name)===key(name));
 const candidates=exact.length?exact:matches;
 return [...candidates].sort((a,b)=>{
 const rank=c=>{const n=D.levels.indexOf(c.level);return n<=levels.indexOf(level)?n:-100-n;};return rank(b)-rank(a);
 })[0];
}
// Literacy scope is distinct from listening concepts. These are topic names,
// not the missing words, note-name answers or worked solutions.
const literacy=[
 ['N3',0,'Treble clef',/treble clef/,'noteidentification'],
 ['H',0,'Bass clef',/bass clef/,'noteidentification'],
 ['N4',0,'Ledger lines',/ledger line/,'noteidentification'],
 ['N5',0,'Accidentals — sharps, flats and naturals',/accidental|sharp sign|flat sign|natural sign/,'accidentals'],
 ['N5',0,'Tones and semitones',/\bsemitones?\b|whole tone from|tone above|tone below/,'accidentals'],
 ['AH',0,'Enharmonic equivalents',/enharmonic|same sounding pitch/,'accidentals'],
 ['AH',0,'First inversion',/first inversion|1st inversion/,'chords'],
 ['AH',0,'Second inversion',/second inversion|2nd inversion/,'chords'],
 ['N5',0,'Root position',/root position/,'chords'],
 ['H',0,'Chords I, IV, V and VI',/\bchord (?:i|iv|v|vi|1|4|5|6)\b/,'chords'],
 ['AH',0,'Chord II',/\bchord (?:ii|2)\b/,'chords'],
 ['AH',0,'Augmented triad',/augmented (?:triad|chord)/,'chords'],
 ['AH',0,'Diminished seventh',/diminished (?:seventh|7th)/,'chords'],
 ['AH',0,'Dominant seventh',/dominant (?:seventh|7th)/,'chords'],
 ['AH',0,'Added sixth',/added (?:sixth|6th)/,'chords'],
 ['AH',0,'Tritone',/tritone/,'intervals'],
 ['AH',0,'Augmented fourth',/augmented (?:fourth|4th)/,'intervals'],
 ['AH',0,'Diminished fifth',/diminished (?:fifth|5th)/,'intervals'],
 ['H',0,'Diatonic intervals',/major (?:second|third|sixth|seventh)|minor (?:second|third|sixth|seventh)|perfect (?:fourth|fifth|octave)/,'intervals'],
 ['H',0,'Tonic, subdominant and dominant',/\b(?:tonic|subdominant|dominant) note/,'keysignatures'],
 ['AH',0,'8va and 8vb',/8va|8vb/,'transposing'],
 ['N3',1,'Semibreve',/\bsemibreves?\b/,'rhythmidentification'],
 ['N3',1,'Minim',/(?<!dotted )\bminims?\b/,'rhythmidentification'],
 ['N3',1,'Dotted minim',/dotted[ -]minim|dot to a minim/,'rhythmidentification'],
 ['N3',1,'Crotchet',/(?<!dotted )\bcrotchets?\b/,'rhythmidentification'],
 ['N4',1,'Quaver',/(?<!dotted )\bquavers?\b/,'rhythmidentification'],
 ['N4',1,'Semiquaver',/\bsemiquavers?\b/,'rhythmidentification'],
 ['N5',1,'Dotted crotchet',/dotted[ -]crotchet/,'rhythmicdictation'],
 ['N5',1,'Dotted quaver',/dotted[ -]quaver/,'rhythmicdictation'],
 ['H',1,'Rests',/\brests?\b/,'rests'],
 ['H',1,'Triplets',/triplet/,'triplets'],
 ['N5',1,'Scotch snap',/scotch snap/,'rhythmicdictation'],
 ['N3',1,'Barlines',/\bbar[ -]?lines?\b/,'barlines'],
 ['N3',1,'Double barlines',/double bar[ -]?line/,'barlines'],
 ['N4',1,'Repeat signs',/repeat sign|repeat bar/,'repeatsigns'],
 ['N5',1,'First and second time bars',/first (?:and second )?time bar|second time bar|1st and 2nd time/,'repeatsigns'],
 ['H',1,'Da capo',/da capo|d\.c\./,'repeatsigns'],
 ['AH',1,'Dal segno (D.S.)',/dal segno|d\.s\./,'repeatsigns'],
 ['AH',1,'Fine',/\bfine\b/,'repeatsigns'],
 ['AH',1,'Ties',/\bties?\b/,'rhythmicdictation'],
 ['AH',1,'Syncopated rhythms',/syncopat/,'rhythmicdictation'],
 ['H',1,'Compound time',/6\/8|9\/8|12\/8/,'timesignatures'],
 ['AH',1,'Time signature: 5/4',/5\/4/,'timesignatures'],
 ['AH',1,'Time changes',/time change/,'timesignatures'],
 ['H',1,'Articulation markings',/staccato|\bslur\b|phrase mark/,'articulationmarkings'],
 ['N3',3,'Forte',/(?<!mezzo )\bforte\b|marking f\b/,'dynamics'],
 ['N3',3,'Piano',/(?<!mezzo )\bpiano\b|marking p\b/,'dynamics'],
 ['N3',3,'Crescendo',/crescendo/,'dynamics'],
 ['N3',3,'Diminuendo',/diminuendo/,'dynamics'],
 ['N4',3,'Mezzo forte',/mezzo forte/,'dynamics'],
 ['N4',3,'Mezzo piano',/mezzo piano/,'dynamics'],
 ['N5',3,'Fortissimo',/fortissimo/,'dynamics'],
 ['N5',3,'Pianissimo',/pianissimo/,'dynamics'],
 ['N5',3,'Sforzando',/sforzando|sfz/,'dynamics'],
 ['N3',1,'Adagio',/adagio/,'readingrhythms'],
 ['N3',1,'Allegro',/allegro/,'readingrhythms'],
 ['N4',1,'Andante',/andante/,'readingrhythms'],
 ['N3',0,'Pitch direction',/ascending|descending/,'melodicdictation'],
 ['N5',0,'Key signatures',/key signature/,'keysignatures'],
 ['N3',0,'Stave lines and spaces',/stave|musical alphabet|space notes/,'noteidentification'],
 ['N3',0,'Steps',/\bstep(?:s|wise)?\b/,'melodicdictation'],
 ['N3',0,'Repetition',/repetition/,'melodicdictation'],
 ['N4',0,'Sequences',/sequence/,'melodicdictation'],
 ['N5',0,'Leaps',/\bleaps?\b/,'intervals'],
 ['N3',1,'Time signatures',/\b[234]\/4\b|simple time|time signature/,'timesignatures']
];
function demandedConcepts(activity){
 if(activity.template!=='complete-the-sentence')return [];
 const demands=[];
 for(const item of activity.items)for(const gap of item.clozeGaps||[{text:item.answer}]){
  const text=key(gap.text),sentence=item.clozeText||item.prompt;
  if(['air','same','three'].includes(text)||text==='pedals'&&/foot pedals/i.test(sentence))continue;
  let c=text==='chorus'&&/hook|verses|pop/i.test(sentence)?resolve('Verse and chorus',activity.level):resolve(gap.text,activity.level)||resolve(String(gap.text).replace(/s$/,''),activity.level);
  if(c)demands.push({conceptId:c.id,name:c.name,level:levels[D.levels.indexOf(c.level)],itemId:item.id,gap:gap.text,sentence});
 }
 return demands;
}
function scope(activity){
 const isLiteracy=/music literacy|reading music|rhythm lengths/i.test([activity.title,...activity.tags||[]].join(' '));
 if(activity.template==='labelled-diagram'&&!isLiteracy)return {sections:[{kind:'concepts',rows:[...new Set(activity.items.map(item=>item.answer))].map(name=>({level:activity.level,category:4,name:activity.title==='Piano Keys'?'Keyboard note names':`${activity.title} — ${name}`,curriculum:'extension'})).filter((row,i,all)=>all.findIndex(other=>other.name===row.name)===i)}]};
 const rows=[]; const seen=new Set();let kind='concepts';
 const add=row=>{row={kind,...row};const id=[row.kind,row.level,row.category,row.name].join('|');if(!seen.has(id)){seen.add(id);rows.push(row);}};
 if(!isLiteracy){
  const sourceIds=[...(activity.sourceConceptIds||[]),...activity.items.map(item=>item.sourceConceptId).filter(Boolean)];
  const ids=new Set([...sourceIds,...demandedConcepts(activity).map(d=>d.conceptId)]);
  if(/^hub-(n3|n4|n5|h|ah)-styles-blank-1$/.test(activity.id)){
   const names=activity.level==='N3'?['Blues','Jazz','Latin American','Musical','Pop','Rock',"Rock 'n' roll",'Scottish']:D.concepts.filter(c=>c.level===D.levels[levels.indexOf(activity.level)]&&c.categories.includes('Styles')).map(c=>c.name);
   for(const name of names){const c=resolve(name,activity.level);if(c)ids.add(c.id);}
  }
  const mixed={N3:['Chord','Ascending','Accompanied','Blues','Jazz','Accordion','Accent / accented','Acoustic guitar','Harmony / chord','2, 3 or 4 beats in the bar'],N4:['Accelerando','A tempo','Broken chord','Change of key','Canon','Alto','Soprano','Cadenza','Backing vocals','Baroque','African music'],N5:['Arco','A cappella','Aria','Bothy ballad','Atonal','Binary / AB','Alberti bass','Cross rhythms','Compound time (6/8, 9/8 and 12/8)','Pentatonic scale'],H:['Chamber music','Impressionist','Acciaccatura','Added 6th','3 against 2','Augmentation','Basso continuo','Concertino','Ripieno','Coloratura','Concerto grosso'],AH:['Anthem','Ayre or air','Appoggiatura','Augmented triad','Hemiola','Answer','Antiphonal','Consort','Countertenor']};
  if(/^hub-dictionary-.*-mixed-definitions-complete-the-sentence-1$/.test(activity.id))for(const name of mixed[activity.level]||[]){const c=resolve(name,activity.level);if(c)ids.add(c.id);}

  // Older Blank packs name the assessed concept before the em dash.
  // A missing word such as ‘air’ is an answer fragment, not an Ayre question.
  if(!sourceIds.length&&activity.specialMode==='level-test'&&activity.template==='complete-the-sentence'){for(const item of activity.items){const name=String(item.clozeText||item.prompt).split(' — ')[0];const c=resolve(name,activity.level);if(c&&levels[D.levels.indexOf(c.level)]===activity.level)ids.add(c.id);}}
  if(!sourceIds.length&&!(activity.specialMode==='level-test'&&activity.template==='complete-the-sentence'))for(const item of activity.items){
   const grouped=['matching-pairs','group-sort'].includes(activity.template);
   const label=grouped?item.group:item.answer;
   // Facts sorted into a named concept test the group, not concepts mentioned in the facts.
   // MMO sets instead sort literal musical terms into broad categories.
   const targets=grouped?[label]:activity.template==='complete-the-sentence'?(item.clozeGaps||[{text:item.answer}]).map(g=>g.text):[label];
   if(grouped&&(/hub-mmo-/.test(activity.id))&&!/^(DYNAMICS|NOTE LENGTHS|KEYS|ACCIDENTALS|NAMES OF NOTES)/.test(item.group))targets.push(item.answer);
   for(const target of targets){
    if(key(target)==='air'&&!/ayre|song|lute/i.test(item.prompt))continue;
    if(key(target)==='three'||key(target)==='same'||key(target)==='pedals'&&/foot pedals/i.test(item.clozeText||item.prompt))continue;
    if(key(target)==='bowing arco'){for(const id of ['MC-0046','MC-0193']){const c=D.concepts.find(c=>c.id===id);if(D.levels.indexOf(c.level)<=levels.indexOf(activity.level))ids.add(id);}continue;}
    if(key(target)==='muted con sordino'){for(const id of ['MC-0129','MC-0200']){const c=D.concepts.find(c=>c.id===id);if(D.levels.indexOf(c.level)<=levels.indexOf(activity.level))ids.add(id);}continue;}
    if(key(target)==='chorus'&&/hook|verses|pop/i.test(item.clozeText||item.prompt)){const c=resolve('Verse and chorus',activity.level);if(c)ids.add(c.id);continue;}
    const c=resolve(target,activity.level)||resolve(String(target).replace(/s$/,''),activity.level);if(c)ids.add(c.id);
   }
  }
  for(const level of D.levels)D.tables[level].forEach((column,category)=>column.forEach(id=>{if(ids.has(id)){const c=D.concepts.find(c=>c.id===id);add({level:levels[D.levels.indexOf(level)],category,name:c.name,href:`music-dictionary/musicdictionaryconcept.html?concept=${id}&level=${levels[D.levels.indexOf(c.level)]}`});}}));
 }
 if(isLiteracy||String(activity.id||'').startsWith('hub-mmo-')){
  kind='literacy';
  const text=activity.items.filter(item=>isLiteracy||/^(DYNAMICS|NOTE LENGTHS|KEYS|ACCIDENTALS|NAMES OF NOTES)/.test(item.group)).map(item=>[isLiteracy&&(activity.template==='complete-the-sentence'||/^(one|two|three|four|five|six|quiet|loud|slow|fast|face|the end of the music|gradually|[0-9])/i.test(item.answer))?(item.clozeText||item.prompt):'',(/^(sharp|flat|natural|#)$/i.test(item.answer)?'Accidental '+item.answer:item.answer),item.group,(/loud|quiet|dynam/i.test([item.clozeText||item.prompt,item.group].join(' '))?(item.clozeGaps||[]).map(g=>({f:'Forte',p:'Piano',ff:'Fortissimo',pp:'Pianissimo',mf:'Mezzo forte',mp:'Mezzo piano',sfz:'Sforzando'}[g.text]||'')).join(' '):''),isLiteracy?item.media?.name:'',isLiteracy?item.answerMedia?.name:''].filter(Boolean).join(' ')).join('\n').toLowerCase();
  if(activity.template==='labelled-diagram'&&activity.items.some(item=>/^[A-G](?: sharp| flat)?$/.test(item.answer)))add({level:activity.level,category:0,name:'Note names on the stave',href:`noteidentification.html?level=${activity.level}`});
  for(const [level,category,name,pattern,page] of literacy)if(pattern.test(text))add({level,category,name,href:`${page}.html?level=${activity.level}`});
  for(const name of ['C major','G major','F major','A minor','D major','B flat major','E minor','D minor']){
   if(activity.items.some(item=>{const sentence=[item.clozeText||item.prompt,item.answer].join(' ').toLowerCase();return new RegExp('\\b'+name.toLowerCase()+'\\b').test(sentence)&&/key|scale/.test(sentence+' '+item.group);}))add({level:['D major','B flat major','E minor','D minor'].includes(name)?'AH':'N5',category:0,name:`Scales and key signatures — ${name}`,href:`keysignatures.html?level=${activity.level}`});
  }
 }
 if(!rows.length&&activity.template==='labelled-diagram')add({level:levels.includes(activity.level)?activity.level:'N3',category:0,name:activity.title});
 return {sections:['concepts','literacy'].map(kind=>({kind,rows:rows.filter(row=>row.kind===kind)})).filter(section=>section.rows.length)};
}
function build(){const activities={};for(const file of fs.readdirSync(path.join(root,'music-games/activities')).filter(f=>f.endsWith('.json')&&f!=='index.json')){const a=JSON.parse(fs.readFileSync(path.join(root,'music-games/activities',file)));activities[a.id]=scope(a);}fs.writeFileSync(path.join(root,'music-games/concept-lists.json'),JSON.stringify({levels:D.levels,categories:D.categories,literacyCategories:['Melody / Harmony','Rhythm / Tempo','Texture / Structure / Form','Dynamics / Timbre'],activities})+'\n');return activities;}
if(require.main===module)build();module.exports={build,scope,resolve,literacy,levels,demandedConcepts};
