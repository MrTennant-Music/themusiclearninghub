/* Recover a missing cached source before the app accesses its dependants. */
(function(root){
 const sources=[['IGCore','music-games/core.js'],['MLHGameConcepts','shared/music-games-concepts.js'],['MLHGameLiteracy','shared/music-games-literacy.js'],['MLHLiteracyConnections','shared/music-games-literacy-connections.js'],['MLHConceptLevelPriority','shared/concept-level-priority.js'],['MLHGameCollections','shared/music-games-collections.js'],['MLHSortData','shared/music-games-sort-data.js'],['MLHFacts','shared/music-games-facts.js'],['MLHSort','shared/music-games-sort.js'],['MLHConnectionsBank','shared/music-games-connections-bank.js'],['MLHConnections','shared/music-games-connections.js'],['MLHGamePractice','shared/music-games-practice.js'],['MLHGameMedals','shared/music-games-medals.js'],['IGSharing','music-games/sharing.js'],['IGNavigation','music-games/navigation.js']];
 async function ensure(target,doc,load){
  const recovered=[];let reloadDependants=false;
  for(const [name,file]of sources){
   if(target[name]&&!reloadDependants)continue;
   reloadDependants=true;
   const original=Array.from(doc.querySelectorAll('script[src]')).find(script=>new URL(script.src,doc.baseURI).pathname.endsWith('/'+file));
   if(!original)throw Error('A game source is missing. Refresh this page.');
   const url=new URL(original.src,doc.baseURI);url.searchParams.set('retry','1');
   if(load)await load(url.href,name);else await new Promise((resolve,reject)=>{const script=doc.createElement('script');script.src=url.href;script.onload=resolve;script.onerror=()=>reject(Error('A game source could not load. Refresh this page.'));doc.head.appendChild(script);});
   if(!target[name])throw Error('A game source did not finish loading. Refresh this page.');
   recovered.push(name);
  }
  return recovered;
 }
 if(typeof module==='object'&&module.exports)module.exports={sources,ensure};else root.IGStartupReady=ensure(root,document);
})(typeof globalThis==='undefined'?this:globalThis);
