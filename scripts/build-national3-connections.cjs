/* Publish one reviewed group bank instead of individual Connections games. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const groupBanks={N3:require('../shared/national3-connections-groups.json'),N4:require('../shared/national4-connections-groups.json'),N5:require('../shared/national5-connections-groups.json'),H:require('../shared/higher-connections-groups.json'),AH:require('../shared/advanced-higher-connections-groups.json')},groups=groupBanks.N3,S=require('./music-games-dictionary-content.cjs');
const answerCategories=require('../shared/connections-answer-categories.json');
const levelOnlyGroups=require('../shared/connections-level-only-groups.json');
const {reviews:answerReviews}=require('./connections-answer-review.cjs');
const wholeBoardPatterns=require('./connections-whole-board-review.cjs');
for(const {names}of answerReviews.values())for(const name of names)if(!S.concepts.some(concept=>concept.name===name))throw Error('Unknown reviewed alternative: '+name);
for(const {slots}of wholeBoardPatterns)for(const names of slots)for(const name of names)if(!S.concepts.some(concept=>concept.name===name))throw Error('Unknown whole-board concept: '+name);
const root=path.resolve(__dirname,'..'),dir=path.join(root,'music-games/activities');
// Use the same answer equivalence for cross-level groups as for individual tiles.
const answerParents=new Map(S.concepts.map(concept=>[concept.id,concept.id]));
function answerRoot(id){const parent=answerParents.get(id);if(parent!==id)answerParents.set(id,answerRoot(parent));return answerParents.get(id);}
for(let i=0;i<S.concepts.length;i++)for(let j=i+1;j<S.concepts.length;j++)if(S.overlaps(S.concepts[i],S.concepts[j])){
 const a=answerRoot(S.concepts[i].id),b=answerRoot(S.concepts[j].id);if(a!==b)answerParents.set(b,a);
}
function wholeBoardQuartets(rank){
 const quartets=new Map(),allowed=S.concepts.filter(c=>S.D.levels.indexOf(c.level)<=rank);
 function add(label,ids){const keys=[...new Set(ids.map(answerRoot))].sort();if(keys.length===4)quartets.set(keys.join('|'),{label,answerKeys:keys});}
 // Reviewed substitutions must be protected even when the source quartet is
 // absent: its four plausible answers may come from two, three or four groups.
 for(const groups of Object.values(groupBanks))for(const group of groups){
  if(group.conceptIds.some(id=>!allowed.some(c=>c.id===id)))continue;
  const review=answerReviews.get(group.label);if(!review)throw Error('Missing answer review: '+group.label);
  const category=Object.values(answerCategories).find(entry=>entry.labels.includes(group.label));
  const alternatives=allowed.filter(c=>review.names.includes(c.name)||category?.conceptIds.includes(c.id));
  for(let index=0;index<4;index++)for(const alternative of alternatives)add(group.label,group.conceptIds.map((id,i)=>i===index?alternative.id:id));
 }
 for(const pattern of wholeBoardPatterns){
  const slots=pattern.slots.map(names=>allowed.filter(c=>names.includes(c.name)).map(c=>c.id));
  function expand(ids,index){if(index===4){add(pattern.label,ids);return;}for(const id of slots[index])expand([...ids,id],index+1);}
  expand([],0);
 }
 return [...quartets.values()];
}

function bank(level='N3', levelOnly=false){
 const groups=levelOnly?levelOnlyGroups[level]:groupBanks[level];
 if(!groups||groups.length>40||(!levelOnly&&groups.length%4))throw Error('Connections banks need valid groups, up to forty.');
 const rank=S.codes.indexOf(level),qualification=S.D.levels[rank];
 const ids=new Set(),quartets=new Set();
 return {level,wholeBoardQuartets:wholeBoardQuartets(rank),groups:groups.map(group=>{
  if(ids.has(group.id)||new Set(group.conceptIds).size!==4)throw Error('Invalid Connections group: '+group.id);
  ids.add(group.id);
  const signature=group.conceptIds.slice().sort().join('|');if(quartets.has(signature))throw Error('Repeated quartet: '+group.id);quartets.add(signature);
  const concepts=group.conceptIds.map(id=>S.byId.get(id));
  if(concepts.some(c=>!c||S.D.levels.indexOf(c.level)>rank))throw Error('Concept above '+level+' in '+group.id);
  if(levelOnly&&concepts.some(c=>c.level!==qualification))throw Error('Concept outside '+level+' in '+group.id);
  if(!concepts.some(c=>c.level===qualification))throw Error('Group needs a '+level+' concept: '+group.id);
  if(concepts.some((concept,i)=>concepts.slice(i+1).some(other=>S.overlaps(concept,other))))throw Error('Equivalent concepts in '+group.id);
  const conflicts=groups.filter(other=>other.id!==group.id&&(other.family===group.family||concepts.some(c=>other.conceptIds.some(id=>S.overlaps(c,S.byId.get(id)))))).map(other=>other.id);
  const category=Object.values(answerCategories).find(entry=>entry.labels.includes(group.label));
  if(category&&group.conceptIds.some(id=>!category.conceptIds.includes(id)))throw Error('Incorrect category membership: '+group.id);
  const answerKeys=group.conceptIds.map(answerRoot);if(new Set(answerKeys).size!==4)throw Error('Equivalent answer keys: '+group.id);
  const review=answerReviews.get(group.label)??(levelOnly?{names:[]}:null);if(!review)throw Error('Missing plausible-answer review: '+group.id+' / '+group.label);
  const plausibleAnswerKeys=[...new Set([...answerKeys,...S.concepts.filter(concept=>S.D.levels.indexOf(concept.level)<=rank&&review.names.includes(concept.name)).map(concept=>answerRoot(concept.id))])];
  return {...group,answerKeys,plausibleAnswerKeys,...(category?{categoryAnswerKeys:[...new Set(category.conceptIds.map(answerRoot))]}:{}),conflicts};
 })};
}
function build(){
 const data={banks:Object.fromEntries(Object.keys(groupBanks).map(level=>{const entry=bank(level);entry.version=crypto.createHash('sha256').update(JSON.stringify(entry)).digest('hex').slice(0,12);return [level,entry];}))};
 data.levelOnlyBanks=Object.fromEntries(Object.keys(levelOnlyGroups).map(level=>[level,bank(level,true)]));
 const bankPath=path.join(root,'shared/music-games-connections-bank.js');
 let previous={};try{delete require.cache[require.resolve(bankPath)];previous=require(bankPath).banks||{};}catch{}
 const planner=require('../shared/music-games-connections').forBanks(data);
 for(const level of Object.keys(groupBanks))if(!planner.combinations(level,true).length)throw Error('No level-only Connections board at '+level);
 for(const [level,entry]of Object.entries(data.banks)){const available=new Set(planner.combinations(level).map(candidate=>candidate.id)),seed=previous[level]?.cycleSeed;entry.cycleSeed=previous[level]?.version===entry.version&&Array.isArray(seed)&&seed.length===entry.groups.length/4&&seed.every(id=>available.has(id))?seed:planner.plan(level,rows=>rows);}
 fs.writeFileSync(path.join(root,'shared/music-games-connections-bank.js'),'/* Generated from the reviewed Connections level banks. */\n(function(r,d){if(typeof module==="object"&&module.exports)module.exports=d;else r.MLHConnectionsBank=d;})(typeof globalThis!=="undefined"?globalThis:this,'+JSON.stringify(data)+');\n');
 const current=JSON.parse(fs.readFileSync(path.join(dir,'index.json'),'utf8'));
 const index=current.filter(a=>!a.tags?.includes('national3-connections'));
 for(const activity of current.filter(a=>a.tags?.includes('national3-connections'))){
  if(!/^hub-n3-connections-[a-f0-9]{12}$/.test(activity.id))continue;
  for(const extension of ['json','js'])fs.rmSync(path.join(dir,activity.id+'.'+extension),{force:true});
 }
 fs.writeFileSync(path.join(dir,'index.json'),JSON.stringify(index,null,2)+'\n');
 const runtime=path.join(root,'music-games/runtime/index.js');
 fs.writeFileSync(runtime,fs.readFileSync(runtime,'utf8').replace(/^window\.IGActivityIndex=.*;\n/,'window.IGActivityIndex='+JSON.stringify(index)+';\n'));
 return Object.values(data.banks).reduce((sum,entry)=>sum+entry.groups.length,0);
}
if(require.main===module)console.log(`Published ${build()} reviewed Connections groups for on-demand generation.`);
module.exports={groups,groupBanks,bank,build};
