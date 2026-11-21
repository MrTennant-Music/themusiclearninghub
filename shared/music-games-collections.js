/* User collections use the same curriculum and reviewed definitions as quizzes. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('../music-games/core'),require('./music-games-concepts'),require('./music-games-literacy'),require('./concept-level-priority'));else root.MLHGameCollections=factory(root.IGCore,root.MLHGameConcepts,root.MLHGameLiteracy,root.MLHConceptLevelPriority);})(typeof globalThis!=='undefined'?globalThis:this,function(C,D,L,prioritise){
 'use strict';
 const collectionEdition=2;
 const sortGroupLimit=10;
 const visibleInLibrary=activity=>activity.collectionEdition===collectionEdition;
 const byId=new Map(D.concepts.map(c=>[c.id,c]));
 const literacyById=new Map(L.map(c=>[c.id,c]));
 const isWordPuzzle=template=>template==='crossword'||template==='wordsearch';
 function eligible(level,template){const rank=level==='ALL'?D.codes.length-1:D.codes.indexOf(level);return D.concepts.filter(c=>D.levels.indexOf(c.level)<=rank&&(['matching-pairs','group-sort'].includes(template)||c.word));}
 function columns(level,template){const allowed=new Set(eligible(level,template).map(c=>c.id)),seen=new Set();return D.categories.map((_,i)=>D.levels.slice(0,level==='ALL'?D.levels.length:D.codes.indexOf(level)+1).flatMap(l=>D.tables[l][i]).filter(id=>{if(!allowed.has(id)||seen.has(id))return false;seen.add(id);return true;}).map(id=>byId.get(id)));}
 function make({id,name,level,template,ids,assignments={},groups=[],scope=level,customCards=[]}){
  if(!['crossword','wordsearch','matching-pairs','group-sort'].includes(template))throw Error('Choose a supported game.');
  if(!name.trim())throw Error('Give your collection a name.');
  const allowed=new Set(eligible(scope,template).map(c=>c.id));
  if(isWordPuzzle(template)||template==='group-sort')for(const concept of literacyConcepts(scope,true))allowed.add(concept.id);
  if(new Set(ids).size!==ids.length||ids.some(id=>!allowed.has(id)))throw Error('Choose different concepts appropriate to this level.');
  if(template!=='group-sort'&&customCards.length)throw Error('Custom cards are available for Concept Sort.');
  const custom=customCards.filter(card=>String(card.text||'').trim()).map(card=>({...card,text:String(card.text).trim()}));
  const count=ids.length+custom.length;
  if(!count)throw Error(template==='group-sort'?'Select at least one concept or add your own card.':'Select at least one concept.');
  if(isWordPuzzle(template)&&(ids.length<5||ids.length>15))throw Error('Choose between 5 and 15 concepts for your '+(template==='crossword'?'crossword':'word search')+'.');
  if(template==='matching-pairs'){
   if(groups.length!==4||groups.some(g=>!g.trim())||new Set(groups.map(C.canonical)).size!==4)throw Error('Give the four groups different names.');
   if(ids.length!==16||groups.some((_,i)=>ids.filter(id=>assignments[id]===i).length!==4))throw Error('Choose four concepts for each of the four groups.');
  }
  if(template==='group-sort'){
   if(count<2||count>C.LIMITS.sortItems)throw Error('Choose between 2 and '+C.LIMITS.sortItems+' cards for your sort.');
   if(custom.some(card=>card.text.length>160))throw Error('Keep each custom card to 160 characters.');
   if(groups.length<2||groups.length>6||groups.some(g=>!g.trim())||new Set(groups.map(C.canonical)).size!==groups.length)throw Error('Give between 2 and 6 groups different names.');
   if(ids.some(id=>!Number.isInteger(assignments[id])||!groups[assignments[id]])||custom.some(card=>!Number.isInteger(card.group)||!groups[card.group])||groups.some((_,i)=>!ids.some(id=>assignments[id]===i)&&!custom.some(card=>card.group===i)))throw Error('Assign concepts to every group.');
   if(groups.some((_,i)=>ids.filter(id=>assignments[id]===i).length+custom.filter(card=>card.group===i).length>sortGroupLimit))throw Error('Each group can contain up to '+sortGroupLimit+' cards.');
  }
  const collectionId=id||C.uid();
  const items=ids.map(id=>{
   const concept=byId.get(id)||literacyById.get(id);
   const grouped=template==='matching-pairs'||template==='group-sort';
   return {id:collectionId+'-'+id,sourceConceptId:id,prompt:grouped?concept.name:concept.definition,answer:grouped?concept.name:concept.word,group:grouped?groups[assignments[id]].trim():''};
  }).concat(custom.map((card,i)=>({id:collectionId+'-custom-'+i,prompt:card.text,answer:card.text,group:groups[card.group].trim()})));
  // The editor reconstructs group order from the first card in each group.
  const orderedItems=template==='group-sort'?groups.flatMap(group=>items.filter(item=>item.group===group.trim())):items;
  const activity=C.makeActivity({id:collectionId,collectionId,collectionEdition,level,template,title:name.trim(),folder:'My Collections',tags:['user-collection'],sourceConceptIds:ids,editorMode:template==='wordsearch'?'with-clues':undefined,items:orderedItems});
  if(template==='group-sort'){
   const matching=new Map();
   for(const item of activity.items){const key=C.canonical(item.prompt);if(!matching.has(key))matching.set(key,[]);matching.get(key).push(item);}
   for(const copies of matching.values())if(copies.length>1){const acceptedGroups=[...new Set(copies.map(item=>item.group))];for(const item of copies)item.acceptedGroups=[...acceptedGroups];}
  }
  const check=C.compatibility(template,activity);if(!check.ok)throw Error(check.reason);
  return activity;
 }
 function randomWordPuzzle(level,template,shuffle=C.shuffle,includeBelow=true){
  if(!['crossword','wordsearch'].includes(template))throw Error('Choose a word puzzle.');
  const pool=levelConcepts(level,includeBelow);
  const seen=new Set();
  const ids=prioritise(shuffle(pool),c=>c.level===D.levels[D.codes.indexOf(level)]).filter(c=>{const word=c.word.replace(/[^a-z]/gi,'').toLowerCase();if(seen.has(word))return false;seen.add(word);return true;}).slice(0,12).map(c=>c.id);
  if(ids.length!==12)throw Error('This level needs at least 12 different crossword words.');
  return {...make({name:'Random 12 words',level,template,ids}),tags:['random-'+template]};
 }
 function sharedConcepts(collection, includeLiteracy=false){
  return collection.concepts.map(id=>byId.get(id)||(includeLiteracy?literacyById.get(id):null)).filter(Boolean);
 }
 function uniqueConcepts(concepts, keyFor){
  const seen=new Set();
  return concepts.filter(concept=>{
   const key=keyFor(concept);
   if(!key||seen.has(key))return false;
   seen.add(key);return true;
  });
 }
 function sharedWordConcepts(concepts){
  return uniqueConcepts(concepts,concept=>{
   const word=concept.word?.toLowerCase().replace(/[^a-z]/g,'');
   return word?.length<=24?word:'';
  });
 }
 function sharedAvailability(collection, app){
  const words=isWordPuzzle(app);
  const concepts=sharedConcepts(collection,words||app==='charades');
  if(words&&sharedWordConcepts(concepts).length<5)return 'Needs at least five suitable words';
  if(app==='sort'&&uniqueConcepts(concepts,concept=>C.canonical(concept.name)).length<2)return 'Needs at least two distinct, supported concepts';
  if(['charades','recall','escape','quizzes'].includes(app)&&!concepts.length)return 'Needs at least one supported concept';
  return '';
 }
 function sharedConceptActivity(collection, level, template, shuffle=C.shuffle){
  const wordsOnly=isWordPuzzle(template);
  const chosen=shuffle(sharedConcepts(collection,wordsOnly));
  if(wordsOnly){
   const words=sharedWordConcepts(chosen).slice(0,C.LIMITS[template+'Items']);
   return make({id:collection.id,name:collection.name,level,template,scope:'ALL',ids:words.map(concept=>concept.id)});
  }
  if(template!=='group-sort')throw Error('Choose a supported game.');
  const distinct=uniqueConcepts(chosen,concept=>C.canonical(concept.name));
  if(distinct.length<2)throw Error('Choose at least two distinct, supported concepts for Concept Sort.');
  const headings=distinct.slice(0,C.LIMITS.sortItems).map(concept=>{
   const categories=D.categories.filter((_,index)=>D.tables[concept.level][index].includes(concept.id));
   return {concept,categories:categories.length?categories:['Other']};
  });
  const groups=new Set(headings.map(row=>row.categories[0]));
  const useHeadings=groups.size>=2&&groups.size<=6;
  const items=useHeadings
   ? headings.map(({concept,categories})=>({id:concept.id,prompt:concept.name,answer:concept.name,group:categories[0],acceptedGroups:categories.filter(category=>groups.has(category)),sourceConceptId:concept.id}))
   : distinct.slice(0,C.LIMITS.sortGroups).map(concept=>({id:concept.id,prompt:concept.definition,answer:concept.name,group:concept.name,sourceConceptId:concept.id}));
  if(!useHeadings)for(const item of items){
   const matching=items.filter(other=>C.canonical(other.prompt)===C.canonical(item.prompt));
   if(matching.length>1)item.acceptedGroups=matching.map(other=>other.group);
  }
  return C.makeActivity({id:collection.id,collectionId:collection.id,level,template,title:collection.name,
   instructions:useHeadings?'Place each concept under its musical heading.':'Match each definition to the concept it describes.',
   sourceConceptIds:items.map(item=>item.sourceConceptId),items,tags:['user-collection']});
 }
 function categoryWordPuzzle(level,category,template,shuffle=C.shuffle,includeBelow=false){
  if(!['crossword','wordsearch'].includes(template))throw Error('Choose a word puzzle.');
  if(category===5)return literacyWordPuzzle(level,template,shuffle,includeBelow);
  if(!Number.isInteger(category)||category<0||category>=D.categories.length)throw Error('Choose a crossword category.');
  const seen=new Set();
  const ids=shuffle(categoryConcepts(level,category,includeBelow)).filter(c=>{const word=c.word.replace(/[^a-z]/gi,'').toLowerCase();if(seen.has(word))return false;seen.add(word);return true;}).slice(0,12).map(c=>c.id);
  const title=D.categories[category].split('/').join(' / ');
  // Built-in curriculum columns can be smaller than the custom-collection minimum.
  const id=C.uid(),activity=ids.length>=5?make({name:title,level,template,ids}):C.makeActivity({id,title,level,template,editorMode:template==='wordsearch'?'with-clues':undefined,sourceConceptIds:ids,items:ids.map(conceptId=>{const c=byId.get(conceptId);return {id:id+'-'+conceptId,sourceConceptId:conceptId,prompt:c.definition,answer:c.word};})});
  return {...activity,tags:['category-'+template,template+'-category:'+category]};
 }
 function categoryConcepts(level,category,includeBelow=false){
  if(category===5)return literacyConcepts(level,includeBelow);
  if(level==='ALL')return columns('ALL','crossword')[category];
  const rank=D.codes.indexOf(level);
  const levels=includeBelow?D.levels.slice(0,rank+1):level==='AH'&&[2,4].includes(category)?D.levels.slice(rank-1,rank+1):[D.levels[rank]];
  return columns(level,'crossword')[category].filter(c=>levels.includes(c.level));
 }
 function levelConcepts(level,includeBelow=false){const rank=D.codes.indexOf(level);return D.concepts.filter(c=>c.word&&(level==='ALL'||c.level===D.levels[rank]||includeBelow&&D.levels.indexOf(c.level)>=0&&D.levels.indexOf(c.level)<rank));}
 function literacyConcepts(level,includeBelow=false){return L.filter(c=>level==='ALL'||c.level===level||includeBelow&&D.codes.indexOf(c.level)<D.codes.indexOf(level));}
 function literacyCollectionName(level,exact){const label=D.levels[D.codes.indexOf(level)];return exact&&label?label+' – Music Literacy':'Music Literacy';}
 function literacyWordPuzzle(level,template,shuffle=C.shuffle,includeBelow=false){
  const rows=shuffle(literacyConcepts(level,includeBelow)).slice(0,12),id=C.uid();
  return C.makeActivity({id,title:literacyCollectionName(level,!includeBelow),description:'Rhythm and rest values use a crotchet beat.',level,template,editorMode:template==='wordsearch'?'with-clues':undefined,tags:['category-'+template,template+'-category:5'],sourceConceptIds:rows.map(c=>c.id),items:rows.map(c=>({id:id+'-'+c.id,sourceConceptId:c.id,prompt:c.definition,answer:c.word}))});
 }
 const randomCrossword=(level,shuffle,includeBelow)=>randomWordPuzzle(level,'crossword',shuffle,includeBelow);
 const categoryCrossword=(level,category,shuffle,includeBelow)=>categoryWordPuzzle(level,category,'crossword',shuffle,includeBelow);
 return {randomWordPuzzle,categoryWordPuzzle,levelConcepts,literacyConcepts,literacyCollectionName,data:D,collectionEdition,sortGroupLimit,visibleInLibrary,eligible,columns,make,sharedAvailability,sharedConceptActivity,randomCrossword,categoryCrossword,categoryConcepts};
});
