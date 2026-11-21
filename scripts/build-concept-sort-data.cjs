/* Reuse Dictionary and approved Concept Quiz text without inventing musical facts. */
const fs=require('node:fs'),crypto=require('node:crypto');
function build(){
 const S=require('./music-games-dictionary-content.cjs'),quiz=require('../music-dictionary/quiz-data/question-bank.json'),overlap=require('./quiz-distractor-overlap.cjs');
 const clean=s=>String(s||'').trim(),key=s=>clean(s).toLowerCase().replace(/[^a-z0-9]/g,'');
 const concepts=S.D.concepts.map(c=>{
  const facts=[],seen=new Set();
  function add(text,id,source){text=clean(text);if(!text||text.length>450||seen.has(key(text)))return;seen.add(key(text));facts.push({id,text,source});}
  add(S.definition(c),'simple','music-dictionary/music-concepts-simple.js');
  add(c.definition,'definition','music-dictionary/music-concepts-data.js');
  (c.features||[]).forEach((text,i)=>add(text,'feature-'+i,'music-dictionary/music-concepts-data.js'));
  for(const q of quiz.questions.filter(q=>q.conceptId===c.id&&q.modality==='text')){
   if(q.format==='short-answer'&&/^Name the concept:\s*/i.test(q.prompt))add(q.prompt.replace(/^Name the concept:\s*/i,''),q.id, 'music-dictionary/quiz-data/question-bank.json');
   if(['multiple-choice','multi-select'].includes(q.format))for(const option of q.options||[])if(q.answer?.correctOptionIds?.includes(option.id))add(option.text,q.id+'-'+option.id,'music-dictionary/quiz-data/question-bank.json');
  }
  return {id:c.id,name:c.name,level:S.codes[S.D.levels.indexOf(c.level)],categories:c.categories.map(g=>g==='Styles'?'Style':g),facts,conflicts:S.D.concepts.filter(other=>other.id!==c.id&&(S.overlaps(c,other)||overlap.overlaps(c.id,other.id))).map(other=>other.id)};
 });
 // Literacy wording is reused verbatim, including its distinct dynamic sense of Piano.
 const literacyTerms=require('../shared/music-games-literacy');
 for(const term of literacyTerms)concepts.push({id:term.id,name:term.word==='Piano'?'Piano (dynamic)':term.word,level:term.level,categories:[],facts:[{id:'definition',text:term.definition,source:'shared/music-games-literacy.js'}],conflicts:[]});
 for(const c of concepts)for(const other of concepts)if(c.id!==other.id&&key(c.name)===key(other.name)&&!c.conflicts.includes(other.id))c.conflicts.push(other.id);
 const data={concepts,literacy:require('./concept-sort-literacy.cjs').build()};data.version=crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0,16);
 // Adding an optional photo collection does not invalidate existing element-sort QR recipes.
 data.instruments=require('../music-games/assets/instrument-families/manifest.json');
 data.instrumentPhotos=[...data.instruments];
 data.musicalPeriods=require('./concept-sort-musical-periods.cjs').build();
 data.musicalFacts=require('../music-games/data/musical-facts.json');
 const temporary='shared/music-games-sort-data.js.'+process.pid+'.building';
 fs.writeFileSync(temporary,'/* Generated from Dictionary and Concept Quizzes by scripts/build-concept-sort-data.cjs. */\n(function(r,d){if(typeof module===\'object\'&&module.exports)module.exports=d;else r.MLHSortData=d;})(typeof globalThis===\'undefined\'?this:globalThis,'+JSON.stringify(data)+');\n');
 fs.renameSync(temporary,'shared/music-games-sort-data.js');
 return data;
}
if(require.main===module){const d=build();console.log('Prepared '+d.concepts.length+' sort concepts.');}module.exports={build};
