/* Period collections start with the AH Dictionary groups and remove concepts
   above each selected qualification. Fewer than five distinct answer families
   means no collection. Earlier concepts remain useful in higher-level games. */
const C=require('../music-games/core'),D=require('../music-dictionary/music-concepts-data'),R=require('../music-dictionary/music-concepts-revision-groups');
const columns=require('./build-music-games-columns.cjs'),vocal=require('./build-music-games-vocal-music.cjs'),orchestra=require('./build-music-games-orchestra.cjs');
const {facts,sets}=require('./music-games-period-content.cjs');
const styles=[...require('./build-music-games-n3-styles.cjs').makeActivities(),...require('./build-music-games-styles.cjs').makeActivities()];
const levels=columns.levels;
const periods=[['renaissance','Renaissance','renaissance-music'],['baroque','Baroque','baroque'],['classical','Classical','classical'],['romantic','Romantic','romantic'],['modern','20th Century / Modern','modern-20th-century']];
const reference=R.groupsForLevel('AH'),canonicalId=id=>id==='MC-0188'?'MC-0184':id;
const cache=new Map();
for(const [code]of levels)for(const [,category]of columns.columns)for(const entry of columns.entriesFor(code,category))for(const id of entry.ids)cache.set(id,entry);
for(const concept of D.concepts.filter(c=>c.categories.includes('Styles'))){const [code]=levels.find(([,label])=>label===concept.level),index=D.concepts.filter(c=>c.level===concept.level&&c.categories.includes('Styles')).findIndex(c=>c.id===concept.id),row=template=>styles.find(a=>a.level===code&&a.template===template).items[index];cache.set(concept.id,{conceptId:concept.id,ids:[concept.id],answer:concept.name,prompt:row('quiz').prompt,correctAnswers:require('./build-music-games-styles.cjs').aliases(concept),word:row('crossword').answer});}
// Specialist collections contain the more precise vocal and instrument clues.
for(const entry of [...vocal.entriesForLevel('AH'),...orchestra.entries()])cache.set(entry.conceptId,entry);
const overrides={
 'MC-0186':{prompt:'A multi-note bass melody repeats unchanged in pitch and rhythm while the upper parts develop. Name this repeating-bass device.'},
 'MC-0255':{prompt:'Name the main thematic idea of a movement, such as a first or second theme in sonata form.'},
 'MC-0296':{prompt:'Name the original main theme first introduced in a fugue, rather than its later transposed entry.'},
 'MC-0177':{prompt:'Give the general term for different rhythmic groupings sounding simultaneously, rather than one particular three-against-two ratio.'},
 'MC-0282':{prompt:'Name the ordered source collection of all twelve chromatic pitch classes used in twelve-tone composition, rather than the compositional method itself.'},
 'MC-0291':{prompt:'As a melodic or tone-row transformation, upward intervals become downward by the same size, and downward intervals become upward. Name the transformation.'},
 'MC-0192':{answer:'A cappella',word:'A cappella',wordPrompt:'Give the Italian term for singing without instrumental accompaniment.'}
};
function entriesFor(code,slug){const rank=levels.findIndex(([id])=>id===code),period=periods.find(([id])=>id===slug);if(rank<0||!period)throw Error('Unknown period or level');
 const ids=reference.find(g=>g.id===period[2]).conceptIds.filter(id=>D.levels.indexOf(D.concepts.find(c=>c.id===id).level)<=rank),families=new Map();
 for(const id of ids){const key=canonicalId(id);if(!families.has(key))families.set(key,[]);families.get(key).push(id);}
 return [...families].map(([key,ids])=>{const base=cache.get(key)||cache.get(ids[0]);if(!base)throw Error('Missing audited period clue '+key);return {...base,conceptId:key,ids,answer:key==='MC-0184'?(ids.includes('MC-0184')?'Polyphonic / Contrapuntal':'Polyphonic'):D.concepts.find(c=>c.id===ids[0]).name,...(key==='MC-0184'&&!ids.includes('MC-0184')?{correctAnswers:['Polyphonic','Contrapuntal','Polyphony','Counterpoint','Polyphonic / Contrapuntal']}:{}),...(overrides[key]||{})};});
}
const related=[...vocal.related,['MC-0214','MC-0225'],['MC-0214','MC-0299'],['MC-0214','MC-0223'],['MC-0002','MC-0079'],['MC-0216','MC-0266'],['MC-0275','MC-0156'],['MC-0275','MC-0282'],['MC-0087','MC-0174'],['MC-0087','MC-0226'],['MC-0087','MC-0236'],['MC-0186','MC-0252'],['MC-0186','MC-0248'],['MC-0088','MC-0186'],['MC-0071','MC-0106'],['MC-0249','MC-0258'],['MC-0249','MC-0260'],['MC-0177','MC-0242']];
for(const family of orchestra.families)for(const id of family.conceptIds.filter(id=>id!==family.familyId))related.push([family.familyId,id]);
function alternatives(entry,entries){const cats=id=>D.concepts.find(c=>c.id===id).categories;
 const pool=entries.filter(other=>other!==entry&&!related.some(pair=>pair.includes(entry.conceptId)&&pair.includes(other.conceptId))&&!entry.correctAnswers.some(v=>C.canonical(v)===C.canonical(other.answer)));
 pool.sort((a,b)=>Number(cats(b.conceptId).some(c=>cats(entry.conceptId).includes(c)))-Number(cats(a.conceptId).some(c=>cats(entry.conceptId).includes(c))));return pool.slice(0,3).map(e=>e.answer);
}
function eligibleCollections(){return periods.flatMap(([slug,title])=>levels.flatMap(([code,label])=>{const entries=entriesFor(code,slug);return entries.length>=5?[{slug,title,code,label,entries}]:[];}));}
function makeActivities(){const all=[];
 for(const {slug,title,code,label,entries}of eligibleCollections()){
  function add(key,template,rows,extra={}){const id=`hub-${code.toLowerCase()}-period-${slug}-${key}`,activity=C.makeActivity({id,title,level:code,template,folder:'Music Dictionary',tags:[title,label],description:`Revise concepts associated with ${title} up to ${label}. These features and forms may also occur in other periods.`,options:{shuffle:true,timer:0,sound:true,theme:'blue'},revision:1,updatedAt:'2026-10-31T00:00:00.000Z',items:rows.map((row,i)=>({id:`${id}-${i+1}`,...row})),...extra});const errors=C.validateActivity(activity);if(errors.length)throw Error(id+': '+errors.join('; '));all.push(activity);}
  for(const [key,template]of [['wordsearch','wordsearch'],['crossword','crossword']]){const wordGame=['wordsearch','crossword'].includes(template),chunks=columns.partitions(entries,wordGame?(['N3','N4'].includes(code)?12:15):template==='match-up'?24:200);chunks.forEach((chunk,index)=>add(`${key}-${index+1}`,template,chunk.map(entry=>({prompt:wordGame?(entry.wordPrompt||entry.prompt):entry.prompt,answer:wordGame?entry.word:entry.answer,...(template==='type-the-answer'?{correctAnswers:entry.correctAnswers}:{}),...(['quiz','true-or-false'].includes(template)?{distractors:alternatives(entry,entries),answerOptions:[entry.answer,...alternatives(entry,entries)]}:{})})),{title:title+(chunks.length>1?' '+(index+1):''),...(template==='wordsearch'?{editorMode:'with-clues'}:{})}));}
  const set=sets[slug]?.[code];if(set?.length!==4)throw Error('Missing period set '+code+' '+slug);
  const rows=set.flatMap(id=>{const entry=entries.find(e=>e.conceptId===id);if(!entry||facts[id]?.length!==4||facts[id].some(f=>f.length>32))throw Error('Invalid period group '+id+': '+facts[id]?.filter(f=>f.length>32).join(' / '));return facts[id].map(fact=>({prompt:fact,answer:fact,group:entry.answer}));});
  for(const [key,template]of [['sort','group-sort'],['connections','matching-pairs']])add(`${key}-1`,template,rows,{instructions:template==='group-sort'?'Place each description under its named concept.':'Find four descriptions of each concept. Find all four groups.'});
 }
 return all;
}
function build(){const all=makeActivities();require('./music-games-write-activities.cjs').writeActivities(all);console.log(`Created ${all.length} activities across ${eligibleCollections().length} period/level collections.`);return all;}
if(require.main===module)build();module.exports={levels,periods,canonicalId,entriesFor,eligibleCollections,related,makeActivities,build};
