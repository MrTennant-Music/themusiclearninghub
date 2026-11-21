/* Timed completion medals scale with the number of words or concepts; Connections uses streak awards. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLHGameMedals=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const limits=Object.freeze({diamond:20,gold:25,silver:30,bronze:40});
 const wordsearchLimits=Object.freeze({diamond:20,gold:25,silver:30,bronze:40});
 const sortLimits=Object.freeze({diamond:20/12,gold:30/12,silver:40/12,bronze:60/12});
 const limitsFor=template=>template==='group-sort'?sortLimits:template==='wordsearch'?wordsearchLimits:limits;
 const tiers=['bronze','silver','gold','diamond'];
 const storageKey='mlh:word-game-medals:v1';
 function isUserCollection(activity){
  if(!activity)return false;
  if(activity.tags?.includes('user-collection'))return true;
  const generated=activity.tags?.some(tag=>/^(random-|category-|generated-)/.test(tag));
  return !generated&&Boolean(activity._stored||activity.folder==='My Collections'||activity.collectionEdition);
 }
 function eligible(template,activity){
  if(!activity||isUserCollection(activity))return false;
  if(template==='group-sort'){
   return Boolean(activity.tags?.includes('random-group-sort')||
    (activity.tags?.includes('generated-sort')&&activity.sortRecipe?.type==='elements'));
  }
  if(template==='crossword'||template==='wordsearch'){
   return Boolean(activity.tags?.includes('random-'+template));
  }
  return false;
 }
 function tierFor({template,total,correct,elapsedMs,timedOut=false,activity}){
  if(!eligible(template,activity)||!Number.isInteger(total)||total<=0||correct!==total||timedOut||!Number.isFinite(elapsedMs)||elapsedMs<0)return null;
  const thresholds=limitsFor(template);
  return Object.keys(thresholds).find(tier=>elapsedMs<=total*thresholds[tier]*1000)||null;
 }
 function get(storage,id){try{return JSON.parse(storage.getItem(storageKey)||'{}')[id]||null;}catch{return null;}}
 // Generated All boards and QR copies retain one collection identity per level.
 function collectionKey(activity){
  if(activity.tags?.includes('random-group-sort'))return `group-sort:${activity.level}:all`;
  let collection=activity.collectionId;
  if(!collection){
   const rows=(activity.items||[]).map(item=>JSON.stringify([item.sourceConceptId||'',item.prompt||'',item.answer||'',item.group||''])).sort();
   const content=JSON.stringify([activity.title,rows.length?rows:activity.id]);
   let hash=2166136261;for(let i=0;i<content.length;i++)hash=Math.imul(hash^content.charCodeAt(i),16777619);
   collection='content-'+(hash>>>0).toString(16);
  }
  return `group-sort:${activity.level}:collection:${collection}`;
 }
 function recordCollection(storage,activity,result){
  if(result.template!=='group-sort'||!eligible(result.template,activity))return null;
  const key=collectionKey(activity);
  // Preserve awards from earlier versions when the original puzzle ID is known.
  try{
   const records=JSON.parse(storage.getItem(storageKey)||'{}'),legacy=records[`group-sort:${activity.id}`];
   if(legacy&&!records[key]){records[key]=legacy;storage.setItem(storageKey,JSON.stringify(records));}
  }catch{}
  return record(storage,key,{...result,activity});
 }
 function record(storage,id,result){
  const medal=tierFor(result);if(!medal)return null;
  try{
   const records=JSON.parse(storage.getItem(storageKey)||'{}'),previous=records[id];
   records[id]={medal:tiers.indexOf(previous?.medal)>tiers.indexOf(medal)?previous.medal:medal,bestMs:Math.min(previous?.bestMs??Infinity,result.elapsedMs)};
   storage.setItem(storageKey,JSON.stringify(records));
   if(result.template==='group-sort'&&tiers.indexOf(previous?.medal)>=tiers.indexOf(medal))return null;
  }catch{}
  return medal;
 }
 return {limits,wordsearchLimits,sortLimits,limitsFor,storageKey,isUserCollection,eligible,tierFor,get,record,collectionKey,recordCollection};
});
