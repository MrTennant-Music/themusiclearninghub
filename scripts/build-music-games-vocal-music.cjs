/* Focused Vocal Music collections: voice types, vocal performance, song forms
   and works. The Dictionary has Voice Types rather than a single Vocal Music
   filter, so the curriculum selection below is explicit and level-checked.
   Content is cumulative. Equivalent labels merge only in their vocal sense. */
const C=require('../music-games/core'),D=require('../music-dictionary/music-concepts-data');
const columns=require('./build-music-games-columns.cjs'),columnFacts=require('./music-games-column-groups.cjs');
const styles=[...require('./build-music-games-n3-styles.cjs').makeActivities(),...require('./build-music-games-styles.cjs').makeActivities()];
const styleFacts=require('./music-games-styles-data.cjs').facts;
const levels=columns.levels;
const introduced={
 N3:['MC-0004','MC-0016','MC-0034','MC-0035','MC-0038','MC-0039','MC-0040','MC-0041','MC-0048','MC-0053','MC-0060','MC-0067'],
 N4:['MC-0072','MC-0073','MC-0075','MC-0078','MC-0091','MC-0109','MC-0112','MC-0113','MC-0114','MC-0115','MC-0134','MC-0136'],
 N5:['MC-0144','MC-0145','MC-0147','MC-0149','MC-0150','MC-0155','MC-0162','MC-0167','MC-0172','MC-0190','MC-0192','MC-0194','MC-0204'],
 H:['MC-0217','MC-0218','MC-0220','MC-0221','MC-0222','MC-0224','MC-0237','MC-0250','MC-0256','MC-0257'],
 AH:['MC-0262','MC-0263','MC-0264','MC-0265','MC-0269','MC-0270','MC-0287','MC-0294','MC-0298','MC-0300']
};
const overrides={
 'MC-0004':{prompt:'A Broadway or West End musical-theatre work combines songs, spoken dialogue, acting and usually dance. Name this type of stage show.'},
 'MC-0016':{wordPrompt:'Give the three-word term beginning question for an opening phrase followed by a replying phrase.',prompt:'Name the general musical device in which an opening vocal phrase is followed by a responding phrase.'},
 'MC-0034':{prompt:'A singer or vocal group performs with instrumental support. Give the performance description meaning with accompaniment.'},
 'MC-0035':{prompt:'In part-singing, different pitches are combined simultaneously. Name this general musical element.'},
 'MC-0038':{prompt:'Singers enter at different times with the same short tune and can continue cycling through it. Name this type of vocal piece.'},
 'MC-0039':{prompt:'One featured singer takes the main part, with or without accompaniment. Name this performance role.'},
 'MC-0040':{prompt:'A singer or group sings without instrumental accompaniment. Give the English performance description.',correctAnswers:['Unaccompanied','Without accompaniment','A cappella'],wordPrompt:'Give the single English word for singing without accompaniment.'},
 'MC-0041':{prompt:'Two or more singers perform the same melody at the same pitch together. Name this way of singing.'},
 'MC-0048':{prompt:'Name the organised ensemble of singers, rather than a particular vocal range or way of combining their parts.'},
 'MC-0053':{prompt:'Give the Italian articulation term for smoothly connected singing, with no obvious gaps between successive notes.'},
 'MC-0060':{prompt:'Give the Italian articulation term for short, detached sung notes with clear gaps between them.'},
 'MC-0067':{prompt:'Name the general human sound source used for singing, rather than a particular register or ensemble.'},
 'MC-0073':{prompt:'In the Western classical stage tradition, a sung drama uses solo arias, recitative and choruses with orchestral accompaniment. Name this type of work.'},
 'MC-0072':{wordPrompt:'Give the two-word English name for rhythmic Gaelic dance singing, also called puirt-a-beul.'},
 'MC-0091':{wordPrompt:'Give the two-word term for improvised jazz singing using nonsense syllables.'},
 'MC-0078':{prompt:'Give the general Scots-language narrative folk-song category, rather than the specific North-East farm-worker song tradition.'},
 'MC-0112':{prompt:'A song alternates changing-word verses with a separate recurring chorus. Name this form.'},
 'MC-0144':{prompt:'Give the general term for a solo song within an opera or oratorio, rather than a specific ABA type of that song.'},
 'MC-0145':{prompt:'Name the North-East Scottish farm-worker song tradition, commonly sung in Scots and associated with life in farm bothies.'},
 'MC-0147':{answer:'Choir / Chorus',prompt:'Name the body of singers in a large vocal work. In opera or oratorio its name can also refer to music written for that body.',correctAnswers:['Choir','Chorus','Choir / Chorus','Chorus / Choir','Choral group'],word:'Chorus',wordPrompt:'Give the term used in opera or oratorio for a body of singers and for music written for them.'},
 'MC-0167':{prompt:'Name the text-setting term for singing more than one note on a single syllable.'},
 'MC-0172':{prompt:'Name the text-setting term for singing exactly one note for each syllable.'},
 'MC-0190':{prompt:'Each verse is set to the same music throughout, without a separate contrasting chorus section. Name this song form.'},
 'MC-0192':{answer:'A cappella / Unaccompanied',prompt:'Singers perform without instrumental accompaniment. Give the Italian term or its English equivalent.',correctAnswers:['A cappella','Unaccompanied','A cappella / Unaccompanied','Unaccompanied / A cappella','Without instrumental accompaniment'],word:'A cappella',wordPrompt:'Give the Italian term for singing without instrumental accompaniment.'},
 'MC-0222':{prompt:'Give the Italian-derived operatic term for speech-like solo singing used to advance dialogue or narrative, often alternating with arias.',correctAnswers:['Recitative','Recitativo']},
 'MC-0237':{prompt:'An important decorative instrumental line is played alongside a solo vocal melody. Name this accompanying line.'},
 'MC-0250':{prompt:'Name the specific Baroque aria form with an A section, contrasting B section and a written instruction to return to the beginning.',correctAnswers:['Da capo aria','Da-capo aria']},
 'MC-0256':{prompt:'A song uses new music for successive verses instead of reusing a complete verse setting. Name this form.'},
 'MC-0263':{wordPrompt:'Give the four-letter historical spelling for an English Renaissance lute song, also called an air.'},
 'MC-0269':{prompt:'Give the general Renaissance secular part-song category, rather than the particular light fa-la-la type.'}
};
function entriesForLevel(code){const rank=levels.findIndex(([id])=>id===code);if(rank<0)throw Error('Unknown vocal level '+code);const ids=levels.slice(0,rank+1).flatMap(([id])=>introduced[id]);
 return ids.filter(id=>!(rank>=2&&['MC-0048','MC-0040'].includes(id))).map(id=>{
  const c=D.concepts.find(c=>c.id===id);if(!c)throw Error('Missing vocal concept '+id);const [levelCode]=levels.find(([,label])=>label===c.level);let entry;
  if(c.categories.includes('Styles')){const sourceIndex=D.concepts.filter(v=>v.level===c.level&&v.categories.includes('Styles')).findIndex(v=>v.id===id);const row=template=>styles.find(a=>a.level===levelCode&&a.template===template).items[sourceIndex];entry={conceptId:id,ids:[id],answer:c.name,prompt:row('quiz').prompt,correctAnswers:require('./build-music-games-styles.cjs').aliases(c),word:row('crossword').answer};}
  else entry={...columns.entriesFor(levelCode,c.categories[0]).find(e=>e.conceptId===id)};
  if(!entry.prompt)throw Error('Missing audited vocal clue '+id);
  return {...entry,...(overrides[id]||{}),...(id==='MC-0147'?{ids:['MC-0048','MC-0147']}:id==='MC-0192'?{ids:['MC-0040','MC-0192']}:{})};
 });
}
const extraVoiceAliases={
 'MC-0134':['Soprano voice'], 'MC-0113':['Alto voice','Contralto'], 'MC-0136':['Tenor voice'],
 'MC-0115':['Bass voice'], 'MC-0194':['Baritone voice'],
 'MC-0204':['Mezzo soprano','Mezzosoprano','Mezzo-soprano voice'],
 'MC-0298':['Counter tenor','Counter-tenor','Countertenor voice','Male alto']
};
for(const [id,aliases]of Object.entries(extraVoiceAliases))overrides[id]={...(overrides[id]||{}),correctAnswers:[...new Set([...columns.aliases(D.concepts.find(c=>c.id===id)),...aliases])].slice(0,8)};
const voiceTypes=['MC-0113','MC-0115','MC-0134','MC-0136','MC-0194','MC-0204','MC-0298'];
const related=[...columns.related,['MC-0004','MC-0073'],['MC-0078','MC-0145'],['MC-0144','MC-0250'],['MC-0264','MC-0269'],['MC-0016','MC-0287'],['MC-0112','MC-0190'],['MC-0222','MC-0300'],['MC-0167','MC-0257'],...voiceTypes.map(id=>['MC-0067',id])];
function alternatives(entry,entries){const category=id=>D.concepts.find(c=>c.id===id).categories;
 const pool=entries.filter(other=>other!==entry&&!related.some(pair=>pair.includes(entry.conceptId)&&pair.includes(other.conceptId))&&!entry.correctAnswers.some(v=>C.canonical(v)===C.canonical(other.answer)));
 pool.sort((a,b)=>Number(category(b.conceptId).some(c=>category(entry.conceptId).includes(c)))-Number(category(a.conceptId).some(c=>category(entry.conceptId).includes(c))));return pool.slice(0,3).map(e=>e.answer);
}
const facts={
 'MC-0039':['One featured singer takes a solo','One singer carries the main part','A vocal part for one performer','One featured voice, not a choir'],
 'MC-0048':['An organised body of singers','A vocal ensemble of many singers','A group rather than a voice type','An ensemble made up of voices'],
 'MC-0041':['Same tune at the same pitch','Singers share one pitch line','One tune together at one pitch','Several voices on the same notes'],
 'MC-0038':['Same tune with staggered entries','A cyclic tune in delayed voices','Frere Jacques in delayed entries','One tune with staggered starts'],
 'MC-0134':['Highest standard female voice','High female part in SATB','The S voice in SATB','Female part above alto'],
 'MC-0113':['Lowest standard female voice','Low female part in SATB','The A voice in SATB','Female choral part below soprano'],
 'MC-0136':['High male part in SATB','The T voice in SATB','Male part above bass in SATB','High standard non-falsetto male'],
 'MC-0115':['Lowest standard adult male voice','Low male part in SATB','The B voice in SATB','Male part below tenor in SATB'],
 'MC-0194':['Medium male voice range','Male range between tenor-bass','Below tenor and above bass','Middle standard male voice'],
 'MC-0204':['Medium female voice range','Female range: soprano to alto','Below soprano and above alto','Middle standard female voice'],
 'MC-0167':columnFacts.N5['melody-harmony']['MC-0167'], 'MC-0172':columnFacts.N5['melody-harmony']['MC-0172'],
 'MC-0217':styleFacts.Lied,'MC-0218':styleFacts.Mass,'MC-0220':styleFacts.Oratorio,'MC-0224':styleFacts['Soul music'],
 'MC-0262':styleFacts.Anthem,'MC-0265':styleFacts.Chorale,'MC-0264':styleFacts.Ballett,'MC-0270':styleFacts.Motet,
 'MC-0287':columnFacts.AH['texture-structure-form']['MC-0287'],'MC-0294':columnFacts.AH['texture-structure-form']['MC-0294'],
 'MC-0298':columnFacts.AH.timbre['MC-0298'],'MC-0300':columnFacts.AH.timbre['MC-0300']
};
const sets={N3:[['MC-0039','MC-0048','MC-0041','MC-0038']],N4:[['MC-0134','MC-0113','MC-0136','MC-0115']],N5:[['MC-0194','MC-0204','MC-0167','MC-0172']],H:[['MC-0217','MC-0218','MC-0220','MC-0224']],AH:[['MC-0262','MC-0265','MC-0264','MC-0270'],['MC-0287','MC-0294','MC-0298','MC-0300']]};
function makeActivities(){const all=[];
 for(const [code,label]of levels){const entries=entriesForLevel(code),base=`hub-${code.toLowerCase()}-vocal-music`;
  function add(key,template,rows,extra={}){const id=`${base}-${key}`,activity=C.makeActivity({id,title:'Vocal Music',level:code,template,folder:'Music Dictionary',tags:['Vocal Music',label],description:`Revise voice types, vocal performance, ensembles and vocal works introduced up to ${label}.`,options:{shuffle:true,timer:0,sound:true,theme:'blue'},revision:1,updatedAt:'2026-10-31T23:00:00.000Z',items:rows.map((row,i)=>({id:`${id}-${i+1}`,...row})),...extra});const errors=C.validateActivity(activity);if(errors.length)throw Error(id+': '+errors.join('; '));all.push(activity);}
  for(const [key,template]of [['wordsearch','wordsearch'],['crossword','crossword']]){const wordGame=['wordsearch','crossword'].includes(template),chunks=columns.partitions(entries,wordGame?(['N3','N4'].includes(code)?12:15):template==='match-up'?24:200);chunks.forEach((chunk,index)=>add(`${key}-${index+1}`,template,chunk.map(entry=>({prompt:wordGame?(entry.wordPrompt||entry.prompt):entry.prompt,answer:wordGame?entry.word:entry.answer,...(template==='type-the-answer'?{correctAnswers:entry.correctAnswers}:{}),...(['quiz','true-or-false'].includes(template)?{distractors:alternatives(entry,entries),answerOptions:[entry.answer,...alternatives(entry,entries)]}:{})})),{title:'Vocal Music'+(chunks.length>1?' '+(index+1):''),...(template==='wordsearch'?{editorMode:'with-clues'}:{})}));}
  sets[code].forEach((set,index)=>{const rows=set.flatMap(id=>{const entry=entries.find(e=>e.conceptId===id);if(!entry||facts[id]?.length!==4||facts[id].some(f=>f.length>32))throw Error('Invalid vocal group '+id+': '+facts[id]?.filter(f=>f.length>32).join(' / '));return facts[id].map(fact=>({prompt:fact,answer:fact,group:entry.answer}));});for(const [key,template]of [['sort','group-sort'],['connections','matching-pairs']])add(`${key}-${index+1}`,template,rows,{title:'Vocal Music'+(sets[code].length>1?' '+(index+1):''),instructions:template==='group-sort'?'Place each description under its named concept.':'Find four descriptions of each concept. Find all four groups.'});});
 }
 return all;
}
function build(){const all=makeActivities();require('./music-games-write-activities.cjs').writeActivities(all);console.log(`Created ${all.length} Vocal Music activities across all five levels.`);return all;}
if(require.main===module)build();module.exports={levels,introduced,entriesForLevel,related,facts,sets,makeActivities,build};
