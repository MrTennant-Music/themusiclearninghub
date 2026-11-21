/* Facts: editable source cards and self-contained four-heading rounds. */
(function(root,factory){const api=typeof module==='object'&&module.exports?factory(require('../music-games/core'),require('./music-games-sort-data')):factory(root.IGCore,root.MLHSortData);if(typeof module==='object'&&module.exports)module.exports=api;else root.MLHFacts=api;})(typeof globalThis==='undefined'?this:globalThis,function(C,D){
 'use strict';
 const storageKey='mlh-musical-facts-v1',levels=C.qualificationLevels;
 const original=D.musicalFacts.concepts,names=new Map(original.map(c=>[c.id,c]));
 const baseValues=levelAlternatives(validate(Object.fromEntries(original.map(c=>[c.id,c.deleted?{deleted:true,facts:c.facts}:c.facts]))));
 const defaults=Object.fromEntries(Object.entries(baseValues).filter(([,value])=>value.deleted));
 function catalogue(){return original.map(c=>({...c,facts:c.facts.map(f=>({...f,also:f.also.filter(id=>names.get(id)?.level===c.level)}))}));}
 function read(){try{const stored=JSON.parse(localStorage.getItem(storageKey)||'{}');return levelAlternatives(validate({...defaults,...stored}));}catch{return validate(defaults);}}
 function validate(value){
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Choose a valid Facts bank.');
  const result={};
  for(const [id,entry]of Object.entries(value)){
   const deleted=entry?.deleted===true,facts=deleted?entry.facts:entry;
   if(!names.has(id)||!Array.isArray(facts)||!facts.length)throw Error('Every concept needs at least one fact.');
   const seen=new Set();
   result[id]=facts.map((fact,index)=>{
    if(!fact||typeof fact.text!=='string')throw Error('Write a fact for '+names.get(id).name+' (fact '+(index+1)+').');
    const text=fact.text.trim();if(!text||text.length>1000)throw Error('Write a fact of between 1 and 1,000 characters for '+names.get(id).name+' (fact '+(index+1)+').');
    const key=C.canonical(text);if(seen.has(key))throw Error('Remove repeated facts within the same concept.');seen.add(key);
    if(fact.also!==undefined&&!Array.isArray(fact.also))throw Error('Choose accepted concepts from the list for '+names.get(id).name+'.');
    const also=[...new Set(fact.also||[])];if(also.some(id=>!names.has(id)))throw Error('Choose an existing concept for each alternative answer.');
    return {id:id+'-fact-'+(index+1),text,also};
   });
   if(deleted)result[id]={deleted:true,facts:result[id]};
  }
  return result;
 }
 function levelAlternatives(value){return Object.fromEntries(Object.entries(value).map(([id,entry])=>{const clean=facts=>facts.map(f=>({...f,also:f.also.filter(other=>names.get(other).level===names.get(id).level)}));return [id,entry.deleted?{deleted:true,facts:clean(entry.facts)}:clean(entry)];}));}
 function save(value){const valid=levelAlternatives(validate({...defaults,...value}));for(const level of levels)create({level,overrides:valid,shuffle:rows=>rows});const compact=Object.fromEntries(Object.entries(valid).filter(([id,entry])=>JSON.stringify(entry)!==JSON.stringify(baseValues[id])));localStorage.setItem(storageKey,JSON.stringify(compact));return valid;}
 function saveChanges(changes,baseline={}){
  const latest=read(),valid=validate(changes),previous=levelAlternatives(validate(baseline));
  for(const id of Object.keys(valid))if(JSON.stringify(latest[id]||baseValues[id])!==JSON.stringify(previous[id]||baseValues[id]))throw Error('Facts for '+names.get(id).name+' changed in another tab. Your draft is kept. Download a backup, then use Reload Saved Facts.');
  return save({...latest,...valid});
 }
 const similarSets=[['MC-0010','MC-0035'],['MC-0046','MC-0193'],['MC-0081','MC-0168'],['MC-0184','MC-0188'],['MC-0098','MC-0176'],['MC-0101','MC-0179'],['MC-0040','MC-0192'],['MC-0129','MC-0200'],['MC-0038','MC-0107'],['MC-0088','MC-0083'],['MC-0186','MC-0252'],['MC-0082','MC-0157','MC-0279']];
 function contrast(a,b){return C.canonical(a.name)!==C.canonical(b.name)&&!similarSets.some(set=>set.includes(a.id)&&set.includes(b.id));}
 function bank(overrides=read()){const valid=levelAlternatives(validate({...defaults,...overrides}));return original.filter(c=>!valid[c.id]?.deleted&&(valid[c.id]||c.facts).length>=1).map(c=>({...c,facts:valid[c.id]||c.facts}));}
 function pool(level,overrides){if(!levels.includes(level))throw Error('Choose a valid qualification.');return bank(overrides).filter(c=>c.level===level);}
 function create({level='N3',shuffle=C.shuffle,overrides,conceptIds}={}){
  const eligible=pool(level,overrides),chosen=[],used=new Set();
  if(conceptIds){if(conceptIds.length!==4||new Set(conceptIds).size!==4)throw Error('Facts needs four different concepts.');for(const id of conceptIds){const c=eligible.find(c=>c.id===id);if(!c)throw Error('Choose concepts from the selected level.');chosen.push(c);}}
  else for(const c of shuffle(eligible)){const key=C.canonical(c.name);if(used.has(key)||chosen.some(other=>!contrast(c,other)))continue;used.add(key);chosen.push(c);if(chosen.length===4)break;}
  if(chosen.length!==4)throw Error('This level needs four contrasting Facts headings.');
  const matches=new Map();for(const c of eligible)for(const fact of c.facts){const key=C.canonical(fact.text);if(!matches.has(key))matches.set(key,new Set());matches.get(key).add(c.id);}
  return fromRecipe({version:'facts-1',type:'facts',level,family:'musical-facts',includeBelow:false,groups:chosen.map(c=>c.name),cards:[],factGroups:chosen.map(c=>({conceptId:c.id,facts:c.facts.map(f=>({...f,also:[...new Set([...(f.also||[]),...matches.get(C.canonical(f.text))])].filter(id=>id!==c.id)}))}))});
 }
 function fromRecipe(recipe){
  if(recipe.version!=='facts-1'||!levels.includes(recipe.level)||!Array.isArray(recipe.factGroups)||recipe.factGroups.length!==4)throw Error('Invalid Facts round.');
  const chosen=recipe.factGroups.map(row=>{const concept=names.get(row.conceptId);if(!concept||(recipe.includeBelow===false?concept.level!==recipe.level:levels.indexOf(concept.level)>levels.indexOf(recipe.level)))throw Error('Concept is outside this Facts level.');return {...concept,facts:validate({[concept.id]:row.facts})[concept.id]};});
  if(new Set(chosen.map(c=>c.id)).size!==4||new Set(chosen.map(c=>C.canonical(c.name))).size!==4)throw Error('Facts needs four different headings.');
  const groups=chosen.map(c=>c.name),items=[];
  for(const c of chosen)for(const fact of c.facts){const accepted=new Set([c.id,...fact.also]);for(const other of chosen)if(other.facts.some(f=>C.canonical(f.text)===C.canonical(fact.text)))accepted.add(other.id);items.push({id:fact.id,sourceConceptId:c.id,prompt:fact.text,answer:fact.text,group:c.name,acceptedGroups:chosen.filter(other=>accepted.has(other.id)).map(other=>other.name)});}
  if(!items.length)throw Error('Every selected concept needs at least one fact.');
  const normalized={version:'facts-1',type:'facts',level:recipe.level,family:'musical-facts',includeBelow:recipe.includeBelow!==false,groups,cards:[],factGroups:chosen.map(c=>({conceptId:c.id,facts:c.facts}))};
  const activity=C.makeActivity({id:C.uid(),title:'Facts',level:recipe.level,template:'group-sort',collectionId:'generated-sort-facts',sortRecipe:normalized,tags:['generated-sort','musical-facts'],sourceConceptIds:chosen.map(c=>c.id),instructions:'Sort every fact under a matching musical concept. Some facts fit more than one group.',items});
  const check=C.compatibility('group-sort',activity);if(!check.ok)throw Error(check.reason);return activity;
 }
 function backup(value=read()){
  const merged={...defaults,...value},rows=original.map(c=>({...c,facts:merged[c.id]?.deleted?merged[c.id].facts:merged[c.id]||c.facts}));
  return {format:'mlh-musical-facts',version:1,concepts:rows.filter(c=>!merged[c.id]?.deleted),deletedConcepts:rows.filter(c=>merged[c.id]?.deleted)};
 }
 function importBackup(data){
  if(data?.format!=='mlh-musical-facts'||data.version!==1||!Array.isArray(data.concepts)||!Array.isArray(data.deletedConcepts))throw Error('Choose a Facts backup.');
  const rows=[...data.concepts,...data.deletedConcepts],ids=rows.map(c=>c.id);
  if(ids.length!==original.length||new Set(ids).size!==original.length||ids.some(id=>!names.has(id)))throw Error('The backup must include every active and deleted concept.');
  const value=levelAlternatives(validate(Object.fromEntries([...data.concepts.map(c=>[c.id,c.facts]),...data.deletedConcepts.map(c=>[c.id,{deleted:true,facts:c.facts}])])));
  for(const level of levels)create({level,overrides:value,shuffle:rows=>rows});return value;
 }
 function download(value){const data=backup(value),blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='musical-facts.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

 return {storageKey,read,validate,save,saveChanges,contrast,catalogue,bank,pool,create,fromRecipe,backup,importBackup,download};
});
