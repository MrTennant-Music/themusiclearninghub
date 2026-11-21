/* Literacy quartets use the shared word bank and the homepage literacy levels.
   Earlier-level knowledge is retained where it makes a complete, distinct set. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('../music-games/core'),require('./music-games-literacy'));else root.MLHLiteracyConnections=factory(root.IGCore,root.MLHGameLiteracy);})(typeof globalThis!=='undefined'?globalThis:this,function(C,words){
 'use strict';
 const levels=['N3','N4','N5','H','AH'];
 const rhythms=['Note values',['Crotchet','Minim','Dotted minim','Semibreve']];
 const spaces=['Treble clef space notes',['F','A','C','E']];
 const keys=['Keys with no more than one sharp or flat',['C major','G major','F major','A minor']];
 const repeats=['Bar and repeat markings',['Double barline','Repeat sign','First time bar','Second time bar']];
 const groups={
  N3:[rhythms,['Dynamic markings',['Forte','Piano','Crescendo','Diminuendo']],spaces,['Stave framework',['Stave','Treble clef','Barline','Double barline']]],
  N4:[['Note values',['Crotchet','Minim','Quaver','Semiquaver']],['Dynamic markings',['Forte','Piano','Mezzo forte','Mezzo piano']],spaces,['Clef, ledger, repeat and metre signs',['Treble clef','Ledger line','Repeat sign','Time signature']]],
  N5:[keys,['Note values',['Crotchet','Quaver','Dotted crotchet','Dotted quaver']],['Dynamic markings',['Fortissimo','Pianissimo','Mezzo forte','Mezzo piano']],repeats],
  H:[keys,['Intervals',['Second','Third','Sixth','Seventh']],['Rests',['Quaver rest','Crotchet rest','Minim rest','Semibreve rest']],['Articulation and phrasing',['Accent','Slur','Staccato','Phrase mark']]],
  AH:[['Keys with one or two sharps or flats',['D major','B flat major','E minor','D minor']],['Chord types',['Augmented triad','Diminished seventh','Dominant seventh','Added sixth']],['Intervals',['Fourth','Fifth','Augmented fourth','Diminished fifth']],['Repeat instructions',['Repeat sign','Da capo','Dal segno','Fine']]]
 };
 const byWord=new Map(words.map(word=>[word.word,word]));
 const pitchNames=new Set(['F','A','C','E']);
 function create(level){
  if(!groups[level])throw Error('No Music Literacy Connections board for this level.');
  const id='generated-'+level.toLowerCase()+'-connections-literacy';
  const activity=C.makeActivity({id,title:'Music Literacy',level,template:'matching-pairs',tags:['generated-connections','literacy-connections'],items:groups[level].flatMap(([group,names],g)=>names.map((name,i)=>{
   const word=byWord.get(name);
   if(!pitchNames.has(name)&&(!word||levels.indexOf(word.level)>levels.indexOf(level)))throw Error('Literacy term above level: '+name);
   return {id:id+'-'+g+'-'+i,sourceConceptId:word?.id,prompt:name,answer:name,group};
  }))});
  const errors=C.validateActivity(activity),check=C.compatibility('matching-pairs',activity);
  if(errors.length||!check.ok)throw Error(errors.join('; ')||check.reason);
  return activity;
 }
 function mix(activity,shuffle=C.shuffle,reviewedQuartets=[]) {
  const literacy=create(activity.level),conceptGroups=[...new Set(activity.items.map(item=>item.group))];
  const key=value=>C.canonical(value),quartet=items=>items.map(item=>key(item.answer)).sort().join('|');
  const recognised=[...groups[activity.level].map(([,names])=>names.map(key)),...reviewedQuartets.map(names=>names.map(key))];
  for(const heading of shuffle([...new Set(literacy.items.map(item=>item.group))]))for(const removed of shuffle(conceptGroups)){
   const items=[...activity.items.filter(item=>item.group!==removed),...literacy.items.filter(item=>item.group===heading)];
   const headings=[...new Set(items.map(item=>item.group))],answers=new Set(items.map(item=>key(item.answer)));
   if(headings.length!==4||answers.size!==16)continue;
   const assigned=new Set(headings.map(group=>quartet(items.filter(item=>item.group===group))));
   if(recognised.some(names=>names.length===4&&names.every(name=>answers.has(name))&&!assigned.has(names.slice().sort().join('|'))))continue;
   return C.makeActivity({...activity,id:activity.id+'-mixed-'+groups[activity.level].findIndex(([group])=>group===heading)+'-'+conceptGroups.indexOf(removed),title:'Connections',tags:[...activity.tags.filter(tag=>tag!=='literacy-connections'),'mixed-connections'],items});
  }
  throw Error('There are no compatible mixed Connections groups for this board.');
 }
 return {groups,create,mix};
});

/* Mixed curriculum boards replace the former literacy-only menu. */
