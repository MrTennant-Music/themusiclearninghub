/* Scottish Music uses the actual Dictionary filter, cumulative through N5.
   Reuse audited clues and aliases; specialise contexts where cumulative terms
   overlap. Related Celtic instruments retain their correct national origins. */
const C=require('../music-games/core'),D=require('../music-dictionary/music-concepts-data'),R=require('../music-dictionary/music-concepts-revision-groups');
const columns=require('./build-music-games-columns.cjs');
const styles=[...require('./build-music-games-n3-styles.cjs').makeActivities(),...require('./build-music-games-styles.cjs').makeActivities()];
const styleFacts=require('./music-games-styles-data.cjs').facts;
const levels=columns.levels.slice(0,3),filterIds=R.groupsForLevel('N5').find(g=>g.id==='scottish-music').conceptIds;
const overrides={
 'MC-0027':{prompt:'A processional or military-style piece with a strong, regular walking pulse, usually organised in two or four beats per bar. Name this type of music.'},
 'MC-0008':{prompt:'Name the broad national musical tradition encompassing the folk songs, dances and instrumental music of Scotland.'},
 'MC-0031':{prompt:'A fast Scottish dance in simple duple or quadruple time, characterised by flowing, even running quavers. Name the dance.'},
 'MC-0078':{prompt:'Give the general Scots-language narrative folk-song category, rather than a particular farm-worker or cloth-working song tradition.'},
 'MC-0104':{prompt:'A Scottish dance usually in moderate simple quadruple time, characteristically using accented short-long Scotch snaps. Name the dance.'},
 'MC-0145':{prompt:'Name the North-East Scottish farm-worker song tradition, commonly sung in Scots and associated with life in farm bothies.'},
 'MC-0176':{answer:'Compound time',word:'Compound time',correctAnswers:['Compound time','Compound metre','Compound meter'],prompt:'Name the type of metre in which each main beat divides into three equal parts. In 6/8, 9/8 and 12/8 there are two, three and four main beats respectively.'},
 'MC-0199':{correctAnswers:['Clarsach','Clàrsach','Scottish harp','Celtic harp']}
};
function entriesForLevel(code){const rank=levels.findIndex(([id])=>id===code);if(rank<0)throw Error('Scottish Music supports N3, N4 and N5');
 const concepts=D.concepts.filter(c=>filterIds.includes(c.id)&&D.levels.indexOf(c.level)<=rank);
 return concepts.filter(c=>!(code==='N5'&&c.id==='MC-0098')).map(c=>{
  const [levelCode]=levels.find(([,label])=>label===c.level);let entry;
  if(c.categories.includes('Styles')){const row=template=>styles.find(a=>a.level===levelCode&&a.template===template).items.find(i=>i.answer===c.name||C.isCorrectAnswer(i,c.name));const type={correctAnswers:require('./build-music-games-styles.cjs').aliases(c)};entry={conceptId:c.id,ids:[c.id],answer:c.name,prompt:row('quiz').prompt,correctAnswers:type.correctAnswers,word:row('crossword').answer};}
  else{entry=columns.entriesFor(levelCode,c.categories[0]).find(e=>e.conceptId===c.id);if(!entry)throw Error('Missing audited clue '+c.id);entry={...entry};}
  const override=overrides[c.id]||{};return {...entry,...override,...(c.id==='MC-0176'?{ids:['MC-0098','MC-0176']}:{})};
 });
}
const related=[...columns.related,['MC-0078','MC-0145'],['MC-0087','MC-0164'],...['MC-0072','MC-0078','MC-0145','MC-0146','MC-0149','MC-0153','MC-0155'].map(id=>['MC-0008',id])];
function alternatives(entry,entries){const excluded=other=>other===entry||related.some(pair=>pair.includes(entry.conceptId)&&pair.includes(other.conceptId));
 const category=id=>D.concepts.find(c=>c.id===id).categories;
 const candidates=entries.filter(other=>!excluded(other));
 // Prefer other concepts of the same kind before filling a short option bank.
 candidates.sort((a,b)=>Number(category(b.conceptId).some(c=>category(entry.conceptId).includes(c)))-Number(category(a.conceptId).some(c=>category(entry.conceptId).includes(c))));
 return candidates.filter(other=>!entry.correctAnswers.some(value=>C.canonical(value)===C.canonical(other.answer))).slice(0,3).map(other=>other.answer);
}
const facts={
 'MC-0042':['Bellows drive free reeds','Buttons or keys plus bellows','Expanding bellows feed the reeds','Reed box with a bellows section'],
 'MC-0044':['Air bag feeds chanter and drones','Melody chanter with drone pipes','Arm pressure feeds the chanter','Highland pipes and steady drones'],
 'MC-0051':['Traditional name for the violin','Bowed violin in Scottish tunes','Folk violin held under the chin','Scots dance tunes on a violin'],
 'MC-0057':['Keys make hammers strike strings','Hammer-struck strings and keys','Piano keys trigger felt hammers','Keyboard with hammer-hit strings'],
 'MC-0072':styleFacts['Mouth music'], 'MC-0078':styleFacts['Scots ballad'],
 'MC-0100':['Scottish dance in compound time','Lively dance often in 6/8','Dance: two triple-divided beats','Compound Scots-Irish dance'],
 'MC-0104':['Moderate Scots dance with snaps','Scottish dance: dotted snap feel','Scots dance: short-long snaps','Scottish four-beat snap dance'],
 'MC-0145':styleFacts['Bothy ballad'], 'MC-0149':styleFacts['Gaelic psalm'], 'MC-0153':styleFacts['Pibroch'], 'MC-0155':styleFacts['Waulking song'],
 'MC-0146':styleFacts['Celtic rock'],
 'MC-0196':['Irish frame drum with skin head','Hand-held Irish frame drum','Irish drum with a short tipper','Irish skin-headed frame drum'],
 'MC-0199':['Scottish Gaelic small harp','Small Scottish plucked harp','Gaelic harp, plucked by fingers','Scots harp with a curved frame'],
 'MC-0164':['Tiny ornamental note before main','Short extra note before main','Small note decorates a main note','Brief note before a melody note']
};
const sets={N3:[['MC-0042','MC-0044','MC-0051','MC-0057']],N4:[['MC-0072','MC-0078','MC-0100','MC-0104']],N5:[['MC-0145','MC-0149','MC-0153','MC-0155'],['MC-0146','MC-0196','MC-0199','MC-0164']]};
function makeActivities(){const all=[];
 for(const [code,label]of levels){const entries=entriesForLevel(code),base=`hub-${code.toLowerCase()}-scottish-music`;
  function add(key,template,rows,extra={}){const id=`${base}-${key}`,activity=C.makeActivity({id,title:'Scottish Music',level:code,template,folder:'Music Dictionary',tags:['Scottish Music',label],description:`Revise Scottish Music concepts introduced up to ${label}, including instruments and features used in related Celtic music.`,options:{shuffle:true,timer:0,sound:true,theme:'blue'},revision:1,updatedAt:'2026-10-31T22:00:00.000Z',items:rows.map((row,i)=>({id:`${id}-${i+1}`,...row})),...extra});const errors=C.validateActivity(activity);if(errors.length)throw Error(id+': '+errors.join('; '));all.push(activity);}
  for(const [key,template]of [['wordsearch','wordsearch'],['crossword','crossword']]){
   const wordGame=['wordsearch','crossword'].includes(template),chunks=columns.partitions(entries,wordGame?(code==='N5'?15:12):template==='match-up'?24:200);
   chunks.forEach((chunk,index)=>add(`${key}-${index+1}`,template,chunk.map(entry=>({prompt:wordGame?(entry.wordPrompt||entry.prompt):entry.prompt,answer:wordGame?entry.word:entry.answer,...(template==='type-the-answer'?{correctAnswers:entry.correctAnswers}:{}),...(['quiz','true-or-false'].includes(template)?{distractors:alternatives(entry,entries),answerOptions:[entry.answer,...alternatives(entry,entries)]}:{})})),{title:'Scottish Music'+(chunks.length>1?' '+(index+1):''),...(template==='wordsearch'?{editorMode:'with-clues'}:{})}));
  }
  sets[code].forEach((set,index)=>{const rows=set.flatMap(id=>{const entry=entries.find(e=>e.conceptId===id);if(!entry||facts[id]?.length!==4||facts[id].some(f=>f.length>32))throw Error('Invalid Scottish group '+id+': '+facts[id]?.filter(f=>f.length>32).join(' / '));return facts[id].map(fact=>({prompt:fact,answer:fact,group:entry.answer}));});for(const [key,template]of [['sort','group-sort'],['connections','matching-pairs']])add(`${key}-${index+1}`,template,rows,{title:'Scottish Music'+(sets[code].length>1?' '+(index+1):''),instructions:template==='group-sort'?'Place each description under its named concept.':'Find four descriptions of each concept. Find all four groups.'});});
 }
 return all;
}
function build(){const all=makeActivities();require('./music-games-write-activities.cjs').writeActivities(all);console.log(`Created ${all.length} Scottish Music activities for N3, N4 and N5.`);return all;}
if(require.main===module)build();module.exports={levels,filterIds,entriesForLevel,sets,facts,alternatives,makeActivities,build};
