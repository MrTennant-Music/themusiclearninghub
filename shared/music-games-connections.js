/* Assemble a playable Connections board from reviewed, compatible quartets. */
(function(root,factory){
 if(typeof module==='object'&&module.exports){const G=require('./music-games-collections');module.exports={...factory(G,require('./music-games-connections-bank')),forBanks:banks=>factory(G,banks)};}
 else root.MLHConnections=factory(root.MLHGameCollections,root.MLHConnectionsBank);
})(typeof globalThis!=='undefined'?globalThis:this,function(G,data){
 const levels=Object.keys(data.banks);
 const conceptLevels=new Map(G.data.concepts.map(concept=>[concept.id,G.data.codes[G.data.levels.indexOf(concept.level)]]));
 const currentCount=(candidate,level)=>candidate.groups.reduce((count,group)=>
  count+group.conceptIds.filter(id=>conceptLevels.get(id)===level).length,0);
 const candidateCache=new Map(),relaxedCandidateCache=new Map(),basePlans=new Map();
 function combinations(level,levelOnly=false){
  const key=levelOnly?'exact:'+level:level;
  if(candidateCache.has(key))return candidateCache.get(key);
  const exact=levelOnly&&data.levelOnlyBanks?.[level];
  if(levelOnly&&!exact){
   const candidates=combinations(level).filter(candidate=>currentCount(candidate,level)===16);
   candidateCache.set(key,candidates);
   return candidates;
  }
  const bank=exact||data.banks[level];if(!bank)return [];
  let candidates=[];const groups=bank.groups;
  for(let a=0;a<groups.length;a++)for(let b=a+1;b<groups.length;b++)for(let c=b+1;c<groups.length;c++)for(let d=c+1;d<groups.length;d++){
   const chosen=[groups[a],groups[b],groups[c],groups[d]];
   if(chosen.some((group,i)=>chosen.slice(i+1).some(other=>group.family===other.family||group.label.toLowerCase()===other.label.toLowerCase()||group.conflicts.includes(other.id))))continue;
   candidates.push({id:'generated-'+level.toLowerCase()+'-connections-'+(exact?'exact-':'')+[a,b,c,d].map(i=>i.toString(36)).join('-'),groups:chosen});
  }
  // A recognised quartet from any level must be one of this board's answers.
  // Match equivalent answers too (for example the two curriculum Subject ids).
  const answerKeys=group=>group.answerKeys||group.conceptIds;
  const quartetKey=group=>answerKeys(group).slice().sort().join('|');
  const vocabulary=new Set(groups.flatMap(answerKeys));
  const recognised=[...new Map([...Object.values(data.banks).flatMap(entry=>entry.groups),...(exact?exact.groups:[]),...(bank.wholeBoardQuartets||[])].filter(group=>answerKeys(group).every(id=>vocabulary.has(id))).map(group=>[quartetKey(group),answerKeys(group)])).entries()];
  // Check each competing quartet only when its least-common concept is visible.
  // This preserves the complete check without scanning thousands of rules for
  // every possible board on each browser launch.
  const occurrences=new Map(),byAnchor=new Map();
  for(const group of groups)for(const id of answerKeys(group))occurrences.set(id,(occurrences.get(id)||0)+1);
  for(const [key,keys]of recognised){
   const anchor=keys.reduce((least,id)=>occurrences.get(id)<occurrences.get(least)?id:least);
   if(!byAnchor.has(anchor))byAnchor.set(anchor,[]);byAnchor.get(anchor).push([key,keys]);
  }
  candidates=candidates.filter(candidate=>{
   const ids=new Set(candidate.groups.flatMap(answerKeys)),assigned=new Set(candidate.groups.map(quartetKey));
   for(const id of ids)for(const [key,keys]of byAnchor.get(id)||[])if(!assigned.has(key)&&keys.every(id=>ids.has(id)))return false;
   return true;
  });
  if(!levelOnly)relaxedCandidateCache.set(level,candidates);
  candidates=candidates.filter(candidate=>{
   const ids=new Set(candidate.groups.flatMap(answerKeys));
   return !candidate.groups.some(group=>
    (group.categoryAnswerKeys&&group.categoryAnswerKeys.filter(id=>ids.has(id)).length!==4)||
    (group.plausibleAnswerKeys&&group.plausibleAnswerKeys.filter(id=>ids.has(id)).length!==4));
  });
  // Reject a board if these same 16 concepts support another authored
  // four-group solution, so cross-topic themes do not create ambiguous games.
  const signatures=new Map();
  const boardKey=candidate=>candidate.groups.flatMap(group=>group.conceptIds).sort().join('|');
  for(const candidate of candidates){const key=boardKey(candidate);signatures.set(key,(signatures.get(key)||0)+1);}
  candidates=candidates.filter(candidate=>signatures.get(boardKey(candidate))===1);
  candidateCache.set(key,candidates);return candidates;
 }
 function make(candidate,level){
  const chosen=candidate.groups,ids=chosen.flatMap(group=>group.conceptIds);
  const activity=G.make({id:candidate.id,name:'Connections',level,template:'matching-pairs',ids,groups:chosen.map(group=>group.label),assignments:Object.fromEntries(ids.map((id,i)=>[id,Math.floor(i/4)]))});
  return {...activity,tags:['generated-connections',...chosen.map(group=>group.id)]};
 }
 function create(level,previousId,shuffle,levelOnly=false){
  const available=combinations(level,levelOnly),alternatives=available.filter(candidate=>candidate.id!==previousId);
  const candidate=shuffle(alternatives.length?alternatives:available).sort((a,b)=>currentCount(b,level)-currentCount(a,level))[0];
  if(!candidate)throw Error('There are no compatible Connections groups at this level.');
  return make(candidate,level);
 }
 function plan(level,shuffle,previousId){
  const bank=data.banks[level];if(!bank)throw Error('No Connections group bank for '+level);
  let basePlan=basePlans.get(level);
  const available=combinations(level),indices=new Map(bank.groups.map((group,i)=>[group.id,i]));
  const masked=available.map(candidate=>({candidate,lo:candidate.groups.reduce((mask,g)=>{const i=indices.get(g.id);return i<20?mask|(1<<i):mask;},0),hi:candidate.groups.reduce((mask,g)=>{const i=indices.get(g.id);return i>=20?mask|(1<<(i-20)):mask;},0)}));
  const byMask=new Map(masked.map(row=>[row.lo+':'+row.hi,row]));
  if(!basePlan&&Array.isArray(bank.cycleSeed)){
   const seeded=bank.cycleSeed.map(id=>masked.find(row=>row.candidate.id===id));
   if(seeded.length===bank.groups.length/4&&seeded.every(Boolean)&&new Set(seeded.flatMap(row=>row.candidate.groups.map(group=>group.id))).size===bank.groups.length){basePlan=seeded;basePlans.set(level,basePlan);}
  }

  if(!basePlan){
   function coverRows(rows,lo,hi){
    // Tight theme exclusions can leave ten mutually incompatible groups.
    // Each then needs its own board; prune rows that would waste one of those
    // ten slots before exact-cover search rather than backtracking for minutes.
    const remaining=bank.groups.map((group,i)=>({group,i})).filter(({i})=>i<20?lo&(1<<i):hi&(1<<(i-20))),slots=remaining.length/4;
    const pairs=new Set();for(const row of rows){const ids=row.candidate.groups.map(group=>indices.get(group.id));for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++)pairs.add(Math.min(ids[a],ids[b])+':'+Math.max(ids[a],ids[b]));}
    let clique=[];
    function findClique(tail,chosen){
     if(tail.length+chosen.length<=clique.length)return;
     if(!tail.length){clique=chosen;return;}
     for(let a=0;a<tail.length;a++){
      if(chosen.length+tail.length-a<=clique.length)return;
      const item=tail[a];findClique(tail.slice(a+1).filter(other=>!pairs.has(Math.min(item.i,other.i)+':'+Math.max(item.i,other.i))),[...chosen,item]);
     }
    }
    findClique(remaining,[]);
    if(clique.length>slots)return null;
    if(clique.length===slots){const required=new Set(clique.map(item=>item.group.id));rows=rows.filter(row=>row.candidate.groups.some(group=>required.has(group.id)));}
    const byGroup=bank.groups.map(group=>rows.filter(row=>row.candidate.groups.some(g=>g.id===group.id))),failed=new Set();
    function cover(lo,hi){
     if(!(lo||hi))return [];
     const key=lo+':'+hi;if(failed.has(key))return null;
     let options;
     for(let i=0;i<bank.groups.length;i++){
      if(!(i<20?lo&(1<<i):hi&(1<<(i-20))))continue;
      const possible=byGroup[i].filter(row=>(row.lo&lo)===row.lo&&(row.hi&hi)===row.hi);
      if(!options||possible.length<options.length)options=possible;
     }
     for(const row of options){const rest=cover(lo^row.lo,hi^row.hi);if(rest)return [row,...rest];}
     failed.add(key);return null;
    }
    return cover(lo,hi);
   }
   const relaxed=(relaxedCandidateCache.get(level)||available).map(candidate=>({candidate,lo:candidate.groups.reduce((mask,g)=>{const i=indices.get(g.id);return i<20?mask|(1<<i):mask;},0),hi:candidate.groups.reduce((mask,g)=>{const i=indices.get(g.id);return i>=20?mask|(1<<(i-20)):mask;},0)}));
   const initial=coverRows(relaxed,(1<<Math.min(20,bank.groups.length))-1,(1<<Math.max(0,bank.groups.length-20))-1);
   if(!initial)throw Error('The reviewed groups cannot form a complete Connections cycle.');
   const valid=initial.filter(row=>byMask.has(row.lo+':'+row.hi)),invalid=initial.filter(row=>!byMask.has(row.lo+':'+row.hi));
   if(!invalid.length)basePlan=valid.map(row=>byMask.get(row.lo+':'+row.hi));
   // Repair the smallest affected part of a broad-category cycle. Searching
   // small pools avoids the long exact-cover backtracking caused by these guards.
   function repair(extra,start,count){
    if(count){for(let i=start;i<=valid.length-count;i++){const found=repair([...extra,valid[i]],i+1,count-1);if(found)return found;}return null;}
    const pool=[...invalid,...extra],lo=pool.reduce((bits,row)=>bits|row.lo,0),hi=pool.reduce((bits,row)=>bits|row.hi,0);
    const replacement=coverRows(masked.filter(row=>(row.lo&lo)===row.lo&&(row.hi&hi)===row.hi),lo,hi);
    return replacement?[...valid.filter(row=>!extra.includes(row)).map(row=>byMask.get(row.lo+':'+row.hi)),...replacement]:null;
   }
   for(let size=0;!basePlan&&size<=valid.length;size++)basePlan=repair([],0,size);
   if(!basePlan)throw Error('The reviewed groups cannot form a complete Connections cycle without ambiguous categories.');
   basePlans.set(level,basePlan);
  }
  // Mix pairs of games while preserving a complete, disjoint group cycle.
  // This avoids an expensive random exact-cover search on each launch.
  const mixed=basePlan.slice();
  for(let round=0;round<80;round++){
   const [a,b]=shuffle(mixed.map((_,i)=>i)),lo=mixed[a].lo|mixed[b].lo,hi=mixed[a].hi|mixed[b].hi;
   const alternatives=masked.filter(row=>(row.lo&lo)===row.lo&&(row.hi&hi)===row.hi&&byMask.has((lo^row.lo)+':'+(hi^row.hi)));
   const row=shuffle(alternatives)[0];mixed[a]=row;mixed[b]=byMask.get((lo^row.lo)+':'+(hi^row.hi));
  }
  const games=shuffle(mixed.map(row=>row.candidate)).sort((a,b)=>currentCount(b,level)-currentCount(a,level)).map(candidate=>candidate.id);
  if(games.length>1&&games[0]===previousId)[games[0],games[1]]=[games[1],games[0]];
  return games;
 }
 function draw(level,previous,shuffle,previousId){
  const bank=data.banks[level];if(!bank)throw Error('No Connections group bank for '+level);
  const available=combinations(level),byId=new Map(available.map(candidate=>[candidate.id,candidate]));
  const savedGames=Array.isArray(previous?.games)?previous.games:[];
  const groupsUsed=savedGames.flatMap(id=>(byId.get(id)?.groups||[]).map(group=>group.id));
  const valid=previous?.version===bank.version&&Number.isInteger(previous.index)&&previous.index>=0&&previous.index<savedGames.length&&savedGames.length===bank.groups.length/4&&groupsUsed.length===bank.groups.length&&new Set(groupsUsed).size===bank.groups.length;
  const games=valid?previous.games:plan(level,shuffle,previousId);
  return {version:bank.version,games,index:valid?previous.index+1:1};
 }
 function fromCycle(level,cycle){const candidate=combinations(level).find(candidate=>candidate.id===cycle.games[cycle.index-1]);if(!candidate)throw Error('Invalid Connections cycle.');return make(candidate,level);}
 return {levels,combinations,make,create,plan,draw,fromCycle};

});
