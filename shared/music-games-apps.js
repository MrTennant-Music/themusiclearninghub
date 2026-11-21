/* Public homes for the ten retained game formats. Storage and activity IDs stay stable. */
(function(root){
 const apps={
  crosswords:{id:'crosswords',title:'Crosswords',subtitle:'Solve musical clues to complete the crossword.',icon:'./app-icons/crosswords-grid-icon.svg',href:'./crosswords.html',templates:['crossword']},
  connections:{id:'connections',title:'Connections',subtitle:'Find four groups of four related musical ideas.',icon:'./app-icons/connections-grid-icon.svg',href:'./connections.html',templates:['matching-pairs']},
  wordsearch:{id:'wordsearch',title:'Word Search',subtitle:'Find musical terms hidden in the letter grid.',icon:'./app-icons/wordsearch-icon.svg',href:'./wordsearch.html',templates:['wordsearch']},
  conceptsort:{id:'conceptsort',title:'Concept Sort',subtitle:'Sort musical concepts into their correct groups.',icon:'./app-icons/concept-sort-icon.svg',href:'./conceptsort.html',templates:['group-sort']}
 };
 const forTemplate=template=>Object.values(apps).find(app=>app.templates.includes(template))||apps.conceptsort;
 function activityUrl(base,activity,{source='hub',level=activity.level,hash=''}={}){const url=new URL(forTemplate(activity.template).href,base);if(hash){url.hash=hash;return url;}url.searchParams.set('activity',activity.id);url.searchParams.set('level',level);url.searchParams.set('game',activity.template);url.searchParams.set('source',source);return url;}
 const api={apps,forTemplate,activityUrl};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.MLHMusicGames=api;
})(typeof window==='undefined'?globalThis:window);
