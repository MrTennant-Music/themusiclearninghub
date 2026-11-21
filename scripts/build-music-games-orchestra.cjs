/* National 5 Orchestra: exact Dictionary filter, including earlier-level
   instruments. Family classification does not imply permanent orchestral use
   (notably saxophone). Distinguish members from their parent families. */
const C=require('../music-games/core'),D=require('../music-dictionary/music-concepts-data'),R=require('../music-dictionary/music-concepts-revision-groups');
const columns=require('./build-music-games-columns.cjs'),groups=R.groupsForLevel('N5');
const filterIds=groups.find(g=>g.id==='orchestra').conceptIds;
const families=groups.filter(g=>g.id.startsWith('orchestra-')).map(g=>({...g,familyId:g.conceptIds.find(id=>D.concepts.find(c=>c.id===id).level==='National 3')}));
const overrides={
 'MC-0054':{prompt:'Name the large ensemble that brings together the orchestral string, woodwind, brass and percussion families.',correctAnswers:['Orchestra','Symphony orchestra','Symphonic orchestra','Philharmonic orchestra']},
 'MC-0047':{correctAnswers:['Brass','Brass family','Brass section']},
 'MC-0056':{correctAnswers:['Percussion (tuned and untuned)','Percussion','Tuned and untuned percussion','Percussion family','Percussion section']},
 'MC-0063':{correctAnswers:['Strings','String family','String section','Strings family']},
 'MC-0068':{correctAnswers:['Woodwind','Woodwinds','Woodwind family','Woodwind section']},
 'MC-0119':{prompt:'A standard bowed orchestral string instrument, larger and lower than the viola but smaller and higher than the double bass, is held between the player’s knees.'},
 'MC-0123':{correctAnswers:['Double bass','Doublebass','Upright bass','String bass','Contrabass']},
 'MC-0124':{prompt:'Name the standard full-sized, side-blown orchestral woodwind in C, whose smaller relative is the piccolo.',correctAnswers:['Flute','Concert flute','C flute']},
 'MC-0127':{prompt:'A large orchestral plucked-string instrument has a triangular frame and pedals to alter its string pitches.',correctAnswers:['Harp','Concert harp','Pedal harp']},
 'MC-0132':{prompt:'A single-reed instrument has a conical metal body and belongs to woodwind. It appears in some orchestral works, rather than as a regular core member.',correctAnswers:['Saxophone','Sax']},
 'MC-0143':{prompt:'A tuned orchestral percussion instrument has wooden bars struck with beaters, producing a bright, dry tone.'},
 'MC-0202':{prompt:'A brass instrument has tightly coiled circular tubing and a backward-facing bell, normally played with the right hand inside the bell.',correctAnswers:['French horn','Horn']},
 'MC-0206':{prompt:'Name the small, high orchestral relative of the concert flute, sounding an octave above its written notes.',correctAnswers:['Piccolo','Piccolo flute']}
};
function entries(){return filterIds.map(id=>{
 const c=D.concepts.find(c=>c.id===id),[code]=columns.levels.find(([,label])=>label===c.level),entry=columns.entriesFor(code,c.categories[0]).find(e=>e.conceptId===id);
 if(!entry)throw Error('Missing Orchestra clue '+id);
 const family=families.find(g=>g.conceptIds.includes(id));
 return {...entry,...(overrides[id]||{}),kind:id==='MC-0054'?'ensemble':family.familyId===id?'family':'instrument',family:family?.label||null};
});}
function alternatives(entry,all){let pool=all.filter(other=>other!==entry&&other.kind===entry.kind);
 if(entry.kind==='instrument')pool.sort((a,b)=>Number(b.family===entry.family)-Number(a.family===entry.family));
 if(pool.length<3)pool.push(...all.filter(other=>other!==entry&&!pool.includes(other)&&other.kind==='family'));
 return pool.filter(other=>!entry.correctAnswers.some(v=>C.canonical(v)===C.canonical(other.answer))).slice(0,3).map(e=>e.answer);
}
const connectionIds={
 Brass:['MC-0139','MC-0140','MC-0202','MC-0212'],
 Percussion:['MC-0116','MC-0125','MC-0133','MC-0137'],
 Strings:['MC-0119','MC-0127','MC-0141','MC-0213'],
 Woodwind:['MC-0124','MC-0132','MC-0195','MC-0205']
};
function makeActivities(){const all=[],data=entries();
 function add(key,template,rows,extra={}){const id=`hub-n5-orchestra-${key}`,activity=C.makeActivity({id,title:'Orchestra',level:'N5',template,folder:'Music Dictionary',tags:['Orchestra','National 5'],description:'Revise orchestral families and instruments up to National 5, including occasional orchestral additions.',options:{shuffle:true,timer:0,sound:true,theme:'blue'},revision:1,updatedAt:'2026-10-31T00:00:00.000Z',items:rows.map((row,i)=>({id:`${id}-${i+1}`,...row})),...extra});const errors=C.validateActivity(activity);if(errors.length)throw Error(id+': '+errors.join('; '));all.push(activity);}
 for(const [key,template]of [['wordsearch','wordsearch'],['crossword','crossword']]){const wordGame=['wordsearch','crossword'].includes(template),chunks=columns.partitions(data,wordGame?15:template==='match-up'?24:200);chunks.forEach((chunk,index)=>add(`${key}-${index+1}`,template,chunk.map(entry=>({prompt:wordGame?(entry.wordPrompt||entry.prompt):entry.prompt,answer:wordGame?entry.word:entry.answer,...(template==='type-the-answer'?{correctAnswers:entry.correctAnswers}:{}),...(['quiz','true-or-false'].includes(template)?{distractors:alternatives(entry,data),answerOptions:[entry.answer,...alternatives(entry,data)]}:{})})),{title:'Orchestra'+(chunks.length>1?' '+(index+1):''),...(template==='wordsearch'?{editorMode:'with-clues'}:{})}));}
 // Use instrument names as cards: classify by how sound is produced, not by
 // body material or the permanence of an instrument's orchestral position.
 add('sort-1','group-sort',data.filter(e=>e.kind==='instrument').map(e=>({prompt:e.answer,answer:e.answer,group:e.family})),{instructions:'Place each instrument in its sound-producing family. Include occasional orchestral additions in their correct family.'});
 add('connections-1','matching-pairs',Object.entries(connectionIds).flatMap(([family,ids])=>ids.map(id=>{const entry=data.find(e=>e.conceptId===id);if(!entry||entry.family!==family)throw Error('Incorrect Orchestra family '+id);return {prompt:entry.answer,answer:entry.answer,group:family};})),{instructions:'Find the four instrument families: four strings, four woodwind, four brass and four percussion. Classify by how sound is produced.'});
 return all;
}
function build(){const all=makeActivities();require('./music-games-write-activities.cjs').writeActivities(all);console.log(`Created ${all.length} National 5 Orchestra activities.`);return all;}
if(require.main===module)build();module.exports={filterIds,families,entries,connectionIds,makeActivities,build};
