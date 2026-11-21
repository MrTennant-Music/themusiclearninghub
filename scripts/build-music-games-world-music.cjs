/* National 5 World Music: the actual Dictionary grouping, including earlier
   levels. Regional headings describe diverse traditions, not a uniform style. */
const C=require('../music-games/core'),D=require('../music-dictionary/music-concepts-data'),R=require('../music-dictionary/music-concepts-revision-groups');
const columns=require('./build-music-games-columns.cjs');
const styles=[...require('./build-music-games-n3-styles.cjs').makeActivities(),...require('./build-music-games-styles.cjs').makeActivities()];
const filterIds=R.groupsForLevel('N5').find(g=>g.id==='world-music').conceptIds.filter(id=>D.levels.indexOf(D.concepts.find(c=>c.id===id).level)<=2);
const overrides={
 'MC-0198':{correctAnswers:['Castanets','Castanet']},
 'MC-0211':{correctAnswers:['Tabla','Tabla drums','Tablas']},
 'MC-0003':{prompt:'Give the broad regional course label for traditions from Latin America. Common listening examples use dance rhythms and instruments such as bongos, claves and guiro.'},
 'MC-0061':{correctAnswers:['Steel band','Steelband','Steel orchestra','Steel pan band'],prompt:'An ensemble of tuned steel pans is associated with Trinidad and Tobago and the wider Caribbean, with different sizes covering melody, harmony and bass.'},
 'MC-0069':{prompt:'Give the broad regional course label covering diverse traditions from the African continent. Course examples may use layered percussion, interlocking rhythms and call and response.'},
 'MC-0151':{prompt:'Give the broad regional course label for music from India. North Indian traditions using sitar, tabla, a drone and ornamented improvisation are common listening examples.'},
 'MC-0126':{prompt:'An untuned scraper has a ridged surface, traditionally a hollow gourd or wood. A stick drawn over the ridges produces a rasping rhythm.'},
 'MC-0130':{correctAnswers:['Pan pipes','Panpipes','Pan-pipes','Pan flute','Panflute']},
 'MC-0197':{prompt:'A joined pair of small, high-pitched hand drums of different sizes is common in Afro-Cuban and Latin American music.',correctAnswers:['Bongo drums','Bongos','Bongo']},
 'MC-0177':{prompt:'Two or more different rhythmic groupings are performed simultaneously. Name this layering device.'},
 'MC-0105':{prompt:'A rhythmic line shifts emphasis away from expected strong beats, for example by accenting weak beats or holding a note across a strong beat. Name the device.'}
};
function entries(){return filterIds.map(id=>{
 const c=D.concepts.find(c=>c.id===id),[code]=columns.levels.find(([,label])=>label===c.level);let entry;
 if(c.categories.includes('Styles')){const index=D.concepts.filter(v=>v.level===c.level&&v.categories.includes('Styles')).findIndex(v=>v.id===id),row=template=>styles.find(a=>a.level===code&&a.template===template).items[index];entry={conceptId:id,ids:[id],answer:c.name,prompt:row('quiz').prompt,correctAnswers:require('./build-music-games-styles.cjs').aliases(c),word:row('crossword').answer};}
 else entry={...columns.entriesFor(code,c.categories[0]).find(e=>e.conceptId===id)};
 if(!entry.prompt)throw Error('Missing audited World Music clue '+id);
 return {...entry,...(overrides[id]||{})};
});}
function alternatives(entry,all){const category=id=>D.concepts.find(c=>c.id===id).categories;
 const pool=all.filter(other=>other!==entry&&!(['MC-0105','MC-0177'].includes(entry.conceptId)&&['MC-0105','MC-0177'].includes(other.conceptId))&&!entry.correctAnswers.some(v=>C.canonical(v)===C.canonical(other.answer)));
 pool.sort((a,b)=>Number(category(b.conceptId).some(c=>category(entry.conceptId).includes(c)))-Number(category(a.conceptId).some(c=>category(entry.conceptId).includes(c))));return pool.slice(0,3).map(e=>e.answer);
}
const facts={
 'MC-0126':['Ridged gourd scraped by a stick','Scraping ridges makes a rasp','Untuned grooved scraper','Stick drawn along a ribbed gourd'],
 'MC-0130':['Bound tubes of varied lengths','Air blown across open pipe tops','Each pipe gives one pitch','A row of graduated wind tubes'],
 'MC-0210':require('./music-games-column-groups.cjs').N5.timbre['MC-0210'],
 'MC-0211':require('./music-games-column-groups.cjs').N5.timbre['MC-0211']
};
function makeActivities(){const all=[],data=entries();
 function add(key,template,rows,extra={}){const id=`hub-n5-world-music-${key}`,activity=C.makeActivity({id,title:'World Music',level:'N5',template,folder:'Music Dictionary',tags:['World Music','National 5'],description:'Revise World Music styles, instruments and musical features up to National 5. Regional labels cover diverse traditions.',options:{shuffle:true,timer:0,sound:true,theme:'blue'},revision:1,updatedAt:'2026-10-31T00:00:00.000Z',items:rows.map((row,i)=>({id:`${id}-${i+1}`,...row})),...extra});const errors=C.validateActivity(activity);if(errors.length)throw Error(id+': '+errors.join('; '));all.push(activity);}
 for(const [key,template]of [['wordsearch','wordsearch'],['crossword','crossword']]){const wordGame=['wordsearch','crossword'].includes(template),chunks=columns.partitions(data,wordGame?15:template==='match-up'?24:200);chunks.forEach((chunk,index)=>add(`${key}-${index+1}`,template,chunk.map(entry=>({prompt:wordGame?(entry.wordPrompt||entry.prompt):entry.prompt,answer:wordGame?entry.word:entry.answer,...(template==='type-the-answer'?{correctAnswers:entry.correctAnswers}:{}),...(['quiz','true-or-false'].includes(template)?{distractors:alternatives(entry,data),answerOptions:[entry.answer,...alternatives(entry,data)]}:{})})),{title:'World Music'+(chunks.length>1?' '+(index+1):''),...(template==='wordsearch'?{editorMode:'with-clues'}:{})}));}
 const rows=Object.entries(facts).flatMap(([id,clues])=>{const entry=data.find(e=>e.conceptId===id);if(!entry||clues.length!==4||clues.some(c=>c.length>32))throw Error('Invalid World Music group '+id);return clues.map(prompt=>({prompt,answer:prompt,group:entry.answer}));});
 for(const [key,template]of [['sort','group-sort'],['connections','matching-pairs']])add(`${key}-1`,template,rows,{instructions:template==='group-sort'?'Place each description under its named instrument.':'Find four descriptions of each instrument. Find all four groups.'});
 return all;
}
function build(){const all=makeActivities();require('./music-games-write-activities.cjs').writeActivities(all);console.log(`Created ${all.length} National 5 World Music activities.`);return all;}
if(require.main===module)build();module.exports={filterIds,entries,facts,makeActivities,build};
