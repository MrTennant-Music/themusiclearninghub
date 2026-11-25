/* Dictionary practice links use current quiz collection membership. */
const fs=require('node:fs'),path=require('node:path');
const D=require('../music-dictionary/music-concepts-data'),collections=require('../music-dictionary/quiz-collections');
const levels=['N3','N4','N5','H','AH'],result={};
function add(id,link){const links=result[id]||(result[id]=[]);if(!links.some(old=>old.href===link.href))links.push(link);}
for(const concept of D.concepts){
 const level=levels[D.levels.indexOf(concept.level)];
 for(const group of collections.groupsForLevel(level).filter(group=>!group.qualification&&!(group.curriculumColumn>0)&&group.conceptIds.includes(concept.id))){
  const selection={id:group.id,label:group.label,level,conceptIds:group.conceptIds,savedLevel:level,tableLevel:level};
  add(concept.id,{title:group.label,level,href:'./conceptquiz.html?'+new URLSearchParams({level,collection:JSON.stringify(selection)}),icon:'./app-icons/concept-quiz-icon.svg'});
 }
}
function tool(ids,title,page,level,exercise){for(const id of ids){const concept=D.concepts.find(c=>c.id===id);if(!concept)throw Error('Unknown concept '+id);const code=typeof level==='function'?level(levels[D.levels.indexOf(concept.level)]):level;const q=new URLSearchParams();if(code)q.set('level',code);if(exercise)q.set('exercise',exercise);const html=fs.readFileSync(path.join(__dirname,'..',page),'utf8');const icon=html.match(/<link[^>]+rel="icon"[^>]+href="([^"]+)"/i)?.[1];if(!icon)throw Error('Missing app icon: '+page);add(id,{title,...(code?{level:code}:{}),href:'./'+page+(q.size?'?'+q:''),icon:icon.startsWith('./')?icon:'./'+icon});}}
const chordIds=['MC-0010','MC-0011','MC-0080','MC-0082','MC-0157','MC-0227','MC-0228','MC-0229','MC-0230','MC-0277','MC-0278','MC-0279'];
const advancedChords=new Set(['MC-0227','MC-0228','MC-0229','MC-0230','MC-0277','MC-0278']);
tool(chordIds.filter(id=>!advancedChords.has(id)),'Chords','chords.html',code=>['N3','N4'].includes(code)?'N5':code);
tool([...advancedChords],'Chords','chords.html','AH');
// Link only to concepts actually practised in the current Ear Training activities.
// Where a concept is introduced earlier in the dictionary, use its first relevant exercise.
const earTrainingLinks = [
  [['MC-0010','MC-0011','MC-0013'],'Chords','N3','chordChanges'],
  [['MC-0017','MC-0018','MC-0037'],'Melodic Devices','N3','repetitionSequence'],
  [['MC-0009','MC-0012','MC-0015','MC-0019'],'Melodic Movements','N3','stepLeap'],
  [['MC-0160'],'Melodic Movements','N5','stepLeap'],
  [['MC-0022','MC-0023'],'Tempo','N3','steadyTempo'],
  [['MC-0095','MC-0097','MC-0101','MC-0179'],'Tempo','N4','steadyTempo'],
  [['MC-0180'],'Tempo','N5','steadyTempo'],
  [['MC-0098','MC-0103','MC-0176'],'Time Signatures','N4','beatsPerBar'],
  [['MC-0245','MC-0246'],'Time Signatures','H','beatsPerBar'],
  [['MC-0081','MC-0088','MC-0093'],'Harmonic Devices','N4','accompanimentDevices'],
  [['MC-0166','MC-0168'],'Harmonic Devices','N5','accompanimentDevices'],
  [['MC-0239','MC-0240','MC-0241'],'Harmonic Devices','H','accompanimentDevices'],
  [['MC-0281'],'Harmonic Devices','AH','accompanimentDevices'],
  [['MC-0096'],'Rhythmic Devices','N4','rhythmicChange'],
  [['MC-0243','MC-0244'],'Rhythmic Devices','H','rhythmicChange'],
  [['MC-0089','MC-0090'],'Scales','N4','scales'],
  [['MC-0158','MC-0175'],'Scales','N5','scales'],
  [['MC-0231','MC-0234'],'Scales','H','scales'],
  [['MC-0084','MC-0085'],'Tonalities','N4','tonality'],
  [['MC-0156'],'Tonalities','N5','tonality'],
  [['MC-0235'],'Tonalities','H','tonality'],
  [['MC-0280'],'Tonalities','AH','tonality'],
  [['MC-0181','MC-0186','MC-0191'],'Bass Patterns','N5','bassPatterns'],
  [['MC-0165','MC-0169'],'Cadences','N5','cadence'],
  [['MC-0232','MC-0238'],'Cadences','H','cadence'],
  [['MC-0227','MC-0228','MC-0229','MC-0230'],'Chords','H','chord'],
  [['MC-0277'],'Chords','AH','chord'],
  [['MC-0086','MC-0171','MC-0173'],'Intervals','H','intervalRecognition'],
  [['MC-0283'],'Intervals','AH','intervalRecognition'],
  [['MC-0087','MC-0164','MC-0174'],'Ornaments','N5','ornaments'],
  [['MC-0226','MC-0236'],'Ornaments','H','ornaments'],
  [['MC-0276','MC-0284'],'Ornaments','AH','ornaments'],
  [['MC-0291','MC-0293'],'Melodic Devices','AH','repetitionSequence'],
];
for(const [ids,title,level,exercise] of earTrainingLinks) tool(ids,title,'auralrecognition.html',level,exercise);
tool(['MC-0015','MC-0019'],'Intervals','intervals.html','N3');
tool(['MC-0086','MC-0171','MC-0173'],'Intervals','intervals.html','N5');
tool(['MC-0233'],'Intervals','intervals.html','H');
tool(['MC-0283'],'Intervals','intervals.html','AH');
tool(['MC-0020','MC-0103','MC-0176','MC-0245','MC-0246'],'Time Signatures','timesignatures.html',code=>code);
tool(['MC-0024'],'Barlines','barlines.html','N3');
tool(['MC-0239','MC-0240'],'Key Signatures','keysignatures.html','N5');
// Direct practice tools for notation and performance markings.
const named=(names)=>D.concepts.filter(c=>names.includes(c.name.toLowerCase())).map(c=>c.id);
tool(named(['crescendo','diminuendo','forte','fortissimo','piano','pianissimo','mezzo forte','mezzo piano']).filter(id=>id!=='MC-0057'),'Dynamics','dynamics.html');
tool(named(['adagio','andante','allegro','moderato']),'Tempo','tempo.html');
tool(['MC-0021','MC-0053','MC-0060'],'Articulation Markings','articulationmarkings.html','H');
tool(named(['ostinato / riff','pedal','inverted pedal','alberti bass','walking bass','ground bass','drum fill','syncopation']),'Composition Studio','chordgenerator.html');
// Literacy suggestions follow the actual qualification content of each tool.
tool(['MC-0015','MC-0019','MC-0017','MC-0018'],'Melodic Dictation','melodicdictation.html','N3');
tool(['MC-0096'],'Melodic Dictation','melodicdictation.html','N4');
tool(['MC-0099','MC-0102'],'Rhythmic Dictation','rhythmicdictation.html','N5');
tool(['MC-0105'],'Melodic Dictation','melodicdictation.html','AH');
tool(['MC-0247'],'Rhythmic Dictation','rhythmicdictation.html','H','identifyTriplet');
tool(['MC-0247'],'Rhythmic Dictation','rhythmicdictation.html','H');
tool(['MC-0165','MC-0169'],'Cadences','cadences.html','N5');
tool(['MC-0232','MC-0238'],'Cadences','cadences.html','H');
// Step and Leap open their direct N3 notation exercise first.
for(const id of ['MC-0015','MC-0019'])result[id].sort((a,b)=>Number(b.href==='./intervals.html?level=N3')-Number(a.href==='./intervals.html?level=N3'));
fs.writeFileSync(path.join(__dirname,'../music-dictionary/music-concepts-games.js'),'/* Generated by scripts/build-dictionary-activity-links.cjs. Dictionary-only practice links. */\n(function(root){const data='+JSON.stringify(result)+';if(typeof module!=="undefined"&&module.exports)module.exports=data;else root.MUSIC_CONCEPT_GAMES=data;})(typeof window!=="undefined"?window:globalThis);\n');
console.log(Object.keys(result).length+' concepts linked; '+Object.values(result).flat().length+' practice links.');
module.exports=result;
