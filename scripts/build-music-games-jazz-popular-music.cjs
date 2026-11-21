/* Cumulative Jazz and Popular Music, matching the actual Dictionary filter.
   Reuse audited definitions and aliases, with explicit contexts for terms that
   overlap once several qualification levels appear in the same collection. */
const C=require('../music-games/core'),D=require('../music-dictionary/music-concepts-data'),R=require('../music-dictionary/music-concepts-revision-groups');
const columns=require('./build-music-games-columns.cjs');
const styles=[...require('./build-music-games-n3-styles.cjs').makeActivities(),...require('./build-music-games-styles.cjs').makeActivities()];
const styleFacts=require('./music-games-styles-data.cjs').facts;
const levels=columns.levels.slice(0,3),filterIds=R.groupsForLevel('N5').find(g=>g.id==='jazz-popular-music').conceptIds;
const overrides={
 'MC-0002':{prompt:'Name the broad musical tradition with New Orleans roots and improvisation, encompassing later styles such as swing.'},
 'MC-0004':{prompt:'A Broadway or West End musical-theatre work combines songs, spoken dialogue, acting and usually dance. Name this type of stage show.'},
 'MC-0005':{prompt:'Give the broad course label for mainstream chart-oriented songs built around catchy choruses and memorable hooks.'},
 'MC-0006':{prompt:'Name the guitar-led style associated with amplified groups in the 1960s and later, often using heavy driving drums and distorted electric-guitar riffs.'},
 'MC-0025':{prompt:'Give the two-word drumming term for a short rhythmic decoration on the kit, often at the end of a phrase or section.',correctAnswers:['Drum fill','Drumfill','Fill']},
 'MC-0028':{prompt:'A note begins halfway between the regular main beats. Give the English phrase describing its placement, whether or not it is accented.'},
 'MC-0043':{prompt:'An unplugged guitar usually has six strings and a hollow body that naturally projects their sound. Name this type of guitar.'},
 'MC-0050':{prompt:'Name the usual six-string, guitar-register instrument whose pickups send the string sound to an amplifier.'},
 'MC-0079':{prompt:'Name the danceable big-band jazz style especially associated with the 1930s and 1940s, uneven quaver pairs, and brass-and-saxophone riffs.'},
 'MC-0091':{wordPrompt:'Give the two-word term for improvised jazz singing using nonsense syllables.'},
 'MC-0105':{prompt:'Name the general rhythmic device that shifts emphasis away from expected strong beats, including off-beat accents and notes held across a strong beat.'},
 'MC-0112':{prompt:'A song alternates changing-word verses with a separate recurring chorus. Name this form.'},
 'MC-0122':{prompt:'Name the general electronic effect that clips an amplified signal, making its tone rough or fuzzy.'},
 'MC-0190':{prompt:'Each verse uses the same music throughout, without a separate contrasting chorus section. Name this song form.'},
 'MC-0203':{prompt:'Name the pair of cymbals on a foot-operated stand, played open or closed with sticks or closed together using the pedal.'},
 'MC-0208':{prompt:'Closely spaced sound reflections merge into a decaying tail after the original sound, rather than separate discernible repeats. Name this effect.'}
};
function entriesForLevel(code){const rank=levels.findIndex(([id])=>id===code);if(rank<0)throw Error('Jazz and Popular Music supports N3, N4 and N5');
 return D.concepts.filter(c=>filterIds.includes(c.id)&&D.levels.indexOf(c.level)<=rank).map(c=>{
  const [levelCode]=levels.find(([,label])=>label===c.level);let entry;
  if(c.categories.includes('Styles')){const sourceIndex=D.concepts.filter(v=>v.level===c.level&&v.categories.includes('Styles')).findIndex(v=>v.id===c.id),row=template=>styles.find(a=>a.level===levelCode&&a.template===template).items[sourceIndex];entry={conceptId:c.id,ids:[c.id],answer:c.name,prompt:row('quiz').prompt,correctAnswers:require('./build-music-games-styles.cjs').aliases(c),word:row('crossword').answer};}
  else entry={...columns.entriesFor(levelCode,c.categories[0]).find(e=>e.conceptId===c.id)};
  if(!entry.prompt)throw Error('Missing audited Jazz/Popular clue '+c.id);
  return {...entry,...(overrides[c.id]||{})};
 });
}
const related=[...columns.related,['MC-0001','MC-0002'],['MC-0001','MC-0007'],['MC-0002','MC-0074'],['MC-0002','MC-0079'],['MC-0006','MC-0007'],['MC-0005','MC-0006'],['MC-0005','MC-0007'],['MC-0028','MC-0105'],['MC-0037','MC-0093'],['MC-0093','MC-0191'],['MC-0112','MC-0190'],['MC-0050','MC-0117'],['MC-0049','MC-0203']];
function alternatives(entry,entries){const category=id=>D.concepts.find(c=>c.id===id).categories;
 const pool=entries.filter(other=>other!==entry&&!related.some(pair=>pair.includes(entry.conceptId)&&pair.includes(other.conceptId))&&!entry.correctAnswers.some(v=>C.canonical(v)===C.canonical(other.answer)));
 pool.sort((a,b)=>Number(category(b.conceptId).some(c=>category(entry.conceptId).includes(c)))-Number(category(a.conceptId).some(c=>category(entry.conceptId).includes(c))));return pool.slice(0,3).map(e=>e.answer);
}
const facts={
 'MC-0043':['Hollow-body unplugged guitar','Guitar soundbox projects notes','Guitar sound without electronics','Natural body resonance in guitar'],
 'MC-0050':['Guitar pickups feed an amplifier','Amplified guitar with pickups','Guitar sends an electric signal','Guitar heard through amplifier'],
 'MC-0049':['Snare, bass drum and cymbals set','One player: drums and cymbals','Sticks, brushes and foot pedals','Drummer uses hands and feet'],
 'MC-0057':require('./build-music-games-scottish-music.cjs').facts['MC-0057'],
 'MC-0074':styleFacts.Ragtime,'MC-0075':styleFacts.Rapping,'MC-0079':styleFacts.Swing,
 'MC-0122':['Electronic clipping makes fuzz','Amplified tone becomes rough','Clipped guitar sounds gritty','Rough fuzzy amplified timbre'],
 'MC-0150':styleFacts.Gospel,
 'MC-0191':['Bass line moves on every beat','Steady stepwise jazz bass line','Bass joins chords on every beat','Jazz bass uses passing notes'],
 'MC-0170':['String bent to change its pitch','Guitar note rises continuously','String bends while note rings','Pitch shifts without new attack'],
 'MC-0208':['Reflections merge into a tail','Decaying sound after the source','Room reflections blend together','Reverberant tail after a note']
};
const sets={N3:[['MC-0043','MC-0050','MC-0049','MC-0057']],N4:[['MC-0074','MC-0075','MC-0079','MC-0122']],N5:[['MC-0150','MC-0191','MC-0170','MC-0208']]};
function makeActivities(){const all=[];
 for(const [code,label]of levels){const entries=entriesForLevel(code),base=`hub-${code.toLowerCase()}-jazz-popular-music`;
  function add(key,template,rows,extra={}){const id=`${base}-${key}`,activity=C.makeActivity({id,title:'Jazz and Popular Music',level:code,template,folder:'Music Dictionary',tags:['Jazz and Popular Music',label],description:`Revise Jazz and Popular Music concepts introduced up to ${label}, including styles, instruments, effects and musical devices.`,options:{shuffle:true,timer:0,sound:true,theme:'blue'},revision:1,updatedAt:'2026-10-31T00:00:00.000Z',items:rows.map((row,i)=>({id:`${id}-${i+1}`,...row})),...extra});const errors=C.validateActivity(activity);if(errors.length)throw Error(id+': '+errors.join('; '));all.push(activity);}
  for(const [key,template]of [['wordsearch','wordsearch'],['crossword','crossword']]){const wordGame=['wordsearch','crossword'].includes(template),chunks=columns.partitions(entries,wordGame?(code==='N5'?15:12):template==='match-up'?24:200);chunks.forEach((chunk,index)=>add(`${key}-${index+1}`,template,chunk.map(entry=>({prompt:wordGame?(entry.wordPrompt||entry.prompt):entry.prompt,answer:wordGame?entry.word:entry.answer,...(template==='type-the-answer'?{correctAnswers:entry.correctAnswers}:{}),...(['quiz','true-or-false'].includes(template)?{distractors:alternatives(entry,entries),answerOptions:[entry.answer,...alternatives(entry,entries)]}:{})})),{title:'Jazz and Popular Music'+(chunks.length>1?' '+(index+1):''),...(template==='wordsearch'?{editorMode:'with-clues'}:{})}));}
  sets[code].forEach((set,index)=>{const rows=set.flatMap(id=>{const entry=entries.find(e=>e.conceptId===id);if(!entry||facts[id]?.length!==4||facts[id].some(f=>f.length>32))throw Error('Invalid Jazz/Popular group '+id+': '+facts[id]?.filter(f=>f.length>32).join(' / '));return facts[id].map(fact=>({prompt:fact,answer:fact,group:entry.answer}));});for(const [key,template]of [['sort','group-sort'],['connections','matching-pairs']])add(`${key}-${index+1}`,template,rows,{instructions:template==='group-sort'?'Place each description under its named concept.':'Find four descriptions of each concept. Find all four groups.'});});
 }
 return all;
}
function build(){const all=makeActivities();require('./music-games-write-activities.cjs').writeActivities(all);console.log(`Created ${all.length} Jazz and Popular Music activities for N3, N4 and N5.`);return all;}
if(require.main===module)build();module.exports={levels,filterIds,entriesForLevel,related,facts,sets,makeActivities,build};
