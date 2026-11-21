/* Listening collections are curated from Dictionary concepts and cumulative through the selected qualification. */
(function(root,factory){const api=typeof module==='object'&&module.exports?factory(require('./music-concepts-data.js'),require('./music-concepts-revision-groups.js')):factory(root.MUSIC_CONCEPTS,root.MusicConceptRevisionGroups);if(typeof module==='object'&&module.exports)module.exports=api;else root.MusicDictionaryQuizCollections=api;})(typeof globalThis!=='undefined'?globalThis:this,function(D,R){
'use strict';
const codes=['N3','N4','N5','H','AH'],byId=new Map(D.concepts.map(c=>[c.id,c]));
function includesLevel(level,conceptLevel){return codes.includes(conceptLevel)&&(level==='ALL'||codes.indexOf(conceptLevel)<=codes.indexOf(level));}
function scopeIds(ids,level){return [...new Set(ids||[])].filter(id=>{const c=byId.get(id);return c&&includesLevel(level,codes[D.levels.indexOf(c.level)]);});}
function conceptsThrough(level){return scopeIds(D.concepts.map(concept=>concept.id),level);}
const source=R.groupsForLevel('AH'),sourceIds=id=>source.find(g=>g.id===id)?.conceptIds||[];
const ids=numbers=>numbers.split(' ').filter(Boolean).map(n=>'MC-'+n.padStart(4,'0'));
const tempo=ids('22 23 26 30 32 94 95 97 101 178 179 180');
const ornaments=sourceIds('ornaments');
const articulation=ids('53 60 21');
const techniques=[...sourceIds('playing-techniques'),...ids('45 58 62 64 163 170')].filter(id=>!articulation.includes(id));
const harmony=[...sourceIds('chords'),...sourceIds('cadences'),...sourceIds('bass-lines'),...ids('11 13 80 83 93 159 166 241 280 281')].filter(id=>!ids('181 191 186').includes(id));
const chords=[...sourceIds('chords'),...ids('11 13 80 159')];
const cadences=sourceIds('cadences');
const tonalities=sourceIds('tonalities');
const key=[...tonalities,...ids('81 158 168 239 240 241')];
const voices=[...sourceIds('voice-types'),...sourceIds('word-setting'),...ids('4 34 35 36 38 39 40 41 48 67 73 75 91 114 144 147 150 162 192 217 218 220 221 222 250 256 257 262 263 264 265 269 270 294 300')];
const orchestra=sourceIds('orchestra').filter(id=>id!=='MC-0132');
const ensembles=[...sourceIds('ensemble-types'),...ids('48 214 258 260')];
const nonInstruments=new Set([...techniques,...articulation,...voices,...ids('122 208')]);
const instruments=[...D.concepts.filter(c=>c.categories.includes('Timbre')&&!nonInstruments.has(c.id)).map(c=>c.id),...ensembles];
const melodicExclusions=new Set([...harmony,...key,...techniques,...ornaments,...voices]);
const scales=sourceIds('scales');
const pitch=[...D.concepts.filter(c=>c.categories.includes('Melody/harmony')&&!melodicExclusions.has(c.id)&&c.id!=='MC-0014').map(c=>c.id),...ids('291 293')].filter(id=>!scales.includes(id));
const rhythm=D.concepts.filter(c=>c.categories.includes('Rhythm/tempo')&&!tempo.includes(c.id)&&!ids('17 25 27 31 33 100 104').includes(c.id)).map(c=>c.id);
const texture=[...sourceIds('textures'),...ids('35 41')];
const structure=D.concepts.filter(c=>c.categories.includes('Texture/structure/form')&&!harmony.includes(c.id)&&!texture.includes(c.id)&&!ids('34 36 39 40').includes(c.id)).map(c=>c.id);
// Focused topics replace the two broad mixed collections.
const bassLines=ids('181 186 191 248 252');
const sonata=ids('223 251 254 255 288');
const development=ids('17 37 38 107 108 291 292 293');
const specialisedStructure=new Set([...bassLines,...sonata,...development,...sourceIds('fugue'),...ids('249')]);
const forms=structure.filter(id=>!specialisedStructure.has(id));
const voiceTypes=sourceIds('voice-types');
const vocalTexture=ids('34 35 36 38 39 40 41 48 67 114 162 192');
const vocalTechniques=ids('75 91 167 172 257 300');
const sacredVocal=ids('150 218 220 221 262 265 270');
const specialisedVocal=new Set([...voiceTypes,...vocalTexture,...vocalTechniques,...sacredVocal]);
const songs=voices.filter(id=>!specialisedVocal.has(id));
const broad=[
 {id:'orchestra',label:'Orchestra',conceptIds:orchestra},
 // Individual orchestral instruments studied by National 5; exclude non-orchestral ensembles and instruments.
 {id:'orchestra-brass',label:'Brass',conceptIds:ids('140 139 202 212')},
 {id:'orchestra-woodwind',label:'Woodwind',conceptIds:ids('124 206 205 120 195')},
 {id:'orchestra-strings',label:'Strings',conceptIds:ids('141 213 119 123 127')},
 {id:'orchestra-percussion',label:'Percussion',conceptIds:ids('116 121 125 133 135 137 138 143')},
 {id:'instruments-ensembles',label:'Instruments and Ensembles',conceptIds:instruments},
 {id:'articulation',label:'Articulation',conceptIds:articulation},
 {id:'playing-techniques',label:'Playing Techniques',conceptIds:techniques},
 {id:'ornaments',label:'Ornaments',conceptIds:ornaments},
 {id:'chords',label:'Chords',conceptIds:chords},
 {id:'harmony',label:'Harmony',conceptIds:[...harmony,...key].filter(id=>!tonalities.includes(id)&&!chords.includes(id)&&!cadences.includes(id))},
 {id:'cadences',label:'Cadences',conceptIds:cadences},
 {id:'tonality',label:'Tonality',conceptIds:tonalities},
 {id:'pitch-melody-scales',label:'Pitch and Melody',conceptIds:pitch},
 {id:'scales',label:'Scales',conceptIds:scales},
 {id:'rhythm-metre',label:'Rhythm and Metre',conceptIds:rhythm},
 {id:'tempo',label:'Tempo',conceptIds:tempo},
 {id:'texture',label:'Texture',conceptIds:texture},
 {id:'texture-structure',label:'Structure and Form',conceptIds:forms},
 {id:'bass-lines',label:'Bass Lines and Patterns',conceptIds:bassLines},
 {id:'sonata-form',label:'Sonata and Sonata Form',conceptIds:sonata},
 {id:'musical-development',label:'Musical Patterns and Development',conceptIds:development},
 {id:'voices-vocal-music',label:'Vocal Forces and Texture',conceptIds:vocalTexture},
 {id:'voice-types',label:'Voice Types',conceptIds:voiceTypes},
 {id:'vocal-techniques',label:'Word Setting',conceptIds:ids('167 172')},
 {id:'sacred-vocal',label:'Sacred Vocal Music',conceptIds:sacredVocal},
 {id:'songs-stage',label:'Songs and Stage Music',conceptIds:songs}
];
const contexts=new Set(['baroque','classical','romantic','modern-20th-century','renaissance-music','scottish-music','world-music','jazz-popular-music','fugue','concerto-grosso']);
// Period collections begin when their identifying concepts are introduced.
const introduced={'orchestra-brass':'N5','orchestra-woodwind':'N5','orchestra-strings':'N5','orchestra-percussion':'N5','sacred-vocal':'H','songs-stage':'N4','bass-lines':'N5','sonata-form':'H','musical-development':'N4','texture-structure':'N4','world-music':'N4',baroque:'N4',classical:'N4',romantic:'N4','modern-20th-century':'N5','renaissance-music':'AH','concerto-grosso':'H',fugue:'AH'};
const curriculumColumns=['styles','melody-harmony','rhythm-tempo','texture-structure-form','timbre'];
const stylesIds={N3:'n3',N4:'n4',N5:'national-5',H:'higher',AH:'advanced-higher'};
function groupsForLevel(level){
 if(![...codes,'ALL'].includes(level))return [];
 const groups=[...broad,...source.filter(g=>contexts.has(g.id)).map(g=>g.id==='romantic'?{...g,conceptIds:g.conceptIds.filter(id=>id!=='MC-0261')}:g).map(g=>g.id==='world-music'?{...g,conceptIds:g.conceptIds.filter(id=>!['MC-0014','MC-0017','MC-0089'].includes(id))}:g).map(g=>g.id==='scottish-music'?{...g,conceptIds:g.conceptIds.filter(id=>!['MC-0016','MC-0040'].includes(id))}:g).map(g=>g.id==='baroque'?{...g,conceptIds:[...g.conceptIds,...ids('276 284')]}:g)].filter(g=>level==='ALL'||!introduced[g.id]||codes.indexOf(level)>=codes.indexOf(introduced[g.id])).filter(g=>!(level==='H'&&g.id==='renaissance-music')).map(g=>({...g,level,conceptIds:scopeIds(g.conceptIds,level).filter(id=>id!=='MC-0083'||g.id==='scottish-music')})).filter(g=>g.conceptIds.length);
 for(const [rank,code] of codes.entries()){
  if(level!=='ALL'&&level!==code)continue;
  const qualificationLabel=D.levels[rank];
  D.categories.forEach((label,column)=>{
   const conceptIds=[...new Set(D.tables[qualificationLabel][column])];
   if(!conceptIds.length)return;
   if(column===0)conceptIds.sort();
   const category=curriculumColumns[column];
   groups.push({
    id:column===0?stylesIds[code]+'-styles':code.toLowerCase()+'-'+category,
    label:qualificationLabel+' – '+label,
    level,curriculumLevel:code,curriculumColumn:column,conceptIds,
    glyph:'./app-icons/charades-collection-'+category+'.svg'
   });
  });
 }
 if(level==='ALL')D.categories.forEach((label,column)=>{
  const category=curriculumColumns[column];
  groups.push({
   id:category+'-all-levels',label,level,fullWidth:true,curriculumColumn:column,
   conceptIds:[...new Set(D.levels.flatMap(qualification=>D.tables[qualification][column]))],
   glyph:'./app-icons/charades-collection-'+category+'.svg'
  });
 });
 for(const [rank,code] of codes.entries()){if(level!=='ALL'&&level!==code)continue;groups.push({id:'level-'+code.toLowerCase(),label:D.levels[rank]+' — All Concepts',qualification:code,level,conceptIds:D.concepts.filter(c=>c.level===D.levels[rank]).map(c=>c.id)});}
 // Count the full curriculum selection, including concepts without generated questions.
 for(const [rank,code] of codes.entries()){if(rank===0||(level!=='ALL'&&level!==code))continue;const from=code==='AH'?'H':'N3',conceptIds=D.concepts.filter(c=>{const i=D.levels.indexOf(c.level);return i>=codes.indexOf(from)&&i<=rank;}).map(c=>c.id);groups.push({id:'levels-'+from.toLowerCase()+'-'+code.toLowerCase(),label:D.levels[codes.indexOf(from)]+' to '+D.levels[rank]+' – All Concepts',qualification:code,cumulative:true,level,conceptIds});}
 if(level==='AH'||level==='ALL')groups.push({id:'levels-n3-ah',label:'National 3 to Advanced Higher – All Concepts',qualification:'AH',cumulative:true,level,conceptIds:D.concepts.map(c=>c.id)});
 if(level==='ALL')groups.push({id:'all-concepts',label:'All Concepts',qualification:'ALL',level:'ALL',conceptIds:D.concepts.map(c=>c.id)});
 const groupRank=g=>g.cumulative?codes.length+codes.indexOf(g.qualification):g.qualification?(g.qualification==='ALL'?-1:codes.indexOf(g.qualification)):codes.length*2;
 return groups.sort((a,b)=>{const aRank=groupRank(a),bRank=groupRank(b);if(aRank!==bRank)return aRank-bRank;return a.label.localeCompare(b.label,'en-GB');});
}
const listedGroupsForLevel=level=>groupsForLevel(level).filter(group=>!group.qualification&&(level!=='ALL'||!group.curriculumLevel));
return {scopeIds,includesLevel,conceptsThrough,groupsForLevel,listedGroupsForLevel};
});
