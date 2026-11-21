/* Existing literacy terms and unchanged, previously drawn notation assets. No score is transcribed here. */
const fs=require('node:fs');
const terms=require('../shared/music-games-literacy');
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
const key=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
const categories={
 Accidentals:'Sharp|Flat|Natural',
 Dynamics:'Forte|Piano|Crescendo|Diminuendo|Mezzo forte|Mezzo piano|Fortissimo|Pianissimo|Sforzando',
 Rhythms:'Crotchet|Minim|Dotted minim|Semibreve|Quaver|Semiquaver|Paired quavers|Grouped semiquavers|Dotted crotchet|Dotted quaver|Scotch snap|Triplet|Syncopation',
 Rests:'Quaver rest|Crotchet rest|Dotted crotchet rest|Minim rest|Semibreve rest|Whole bar rest',
 Tempo:'Adagio|Allegro|Andante',
 Notation:'Treble clef|Bass clef|Stave|Barline|Double barline|Ledger line|Tie',
 'Pitch and melody':'Step|Leap|Repetition|Sequence|Tone|Semitone|Enharmonic equivalent',
 'Time signatures':'Time signature|Compound time|Time changes',
 'Key signatures':'C major|G major|F major|A minor|D major|B flat major|E minor|D minor',
 Chords:'Chord|Root position|First inversion|Second inversion|Augmented triad|Diminished seventh|Dominant seventh|Added sixth',
 Intervals:'Second|Third|Fourth|Fifth|Sixth|Seventh|Octave|Tritone|Augmented fourth|Diminished fifth',
 'Scale degrees':'Tonic|Subdominant|Dominant',
 'Repeat directions':'Repeat sign|First time bar|Second time bar|Da capo|Dal segno|Fine',
 'Articulation and phrasing':'Phrase mark|Accent|Slur|Staccato'
};
function build(){
 const groupFor=new Map(Object.entries(categories).flatMap(([g,list])=>list.split('|').map(word=>[key(word),g]))),rows=[],symbols=new Set();
 function symbol({id,conceptId,name,group,level,file,family='topics'}){
  if(!fs.existsSync(file))return;
  const identity=level+':'+family+':'+conceptId;if(symbols.has(identity))return;symbols.add(identity);
  rows.push({id,conceptId,level,group,family,text:'',media:{type:'image',src:'./'+file,name},source:file});
 }
 for(const term of terms){
  const group=groupFor.get(key(term.word));if(!group)throw Error('Unclassified literacy term: '+term.word);
  rows.push({id:term.id+':word',conceptId:term.id,level:term.level,group,family:'topics',text:term.word,source:'shared/music-games-literacy.js'});
  rows.push({id:term.id+':definition',conceptId:term.id,level:term.level,group,family:'topics',text:term.definition,source:'shared/music-games-literacy.js'});
  const aliases={Barline:'bar-line','Double barline':'double-bar-line','Whole bar rest':'whole-bar-rest'};
  const name=aliases[term.word]||slug(term.word);
  let candidates=[];
  if(group==='Rhythms')candidates.push('music-games/assets/rhythm-order/'+name+'.svg');
  if(term.word==='Bass clef')candidates.push('ui-icons/bassclef.svg');
  for(const folder of ['sort','n4','n5','h','ah']){
   // Higher's C/G/F-major images are chords, not key signatures.
   if(group==='Key signatures'&&folder==='h')continue;
   candidates.push('music-games/assets/music-literacy/'+folder+'/'+(folder==='sort'?'':'sort-')+name+'.svg');
  }
  if(group==='Tempo')candidates.push('music-dictionary/concept-photos/'+slug(term.word)+'-diagram.png');
  const file=candidates.find(f=>fs.existsSync(f));
  if(file)symbol({id:term.id+':symbol',conceptId:term.id,name:term.word,group,level:term.level,file});
 }
 const extra=[['N3','sort','2/4','Time signatures'],['N3','sort','3/4','Time signatures'],['N3','sort','4/4','Time signatures'],['N4','n4','Start repeat','Repeat directions'],['N4','n4','End repeat','Repeat directions'],['H','h','6/8','Time signatures'],['H','h','9/8','Time signatures'],['H','h','12/8','Time signatures'],['AH','ah','5/4','Time signatures']];
 for(const [level,folder,name,group]of extra){const stem=slug(name),file='music-games/assets/music-literacy/'+folder+'/'+(folder==='sort'?'':'sort-')+stem+'.svg';symbol({id:'literacy-symbol-'+level+'-'+stem,conceptId:'literacy-symbol-'+level+'-'+stem,name,group,level,file});}
 const triads=require('./build-music-games-advanced-higher-literacy.cjs').triads;
 for(const [group,chords]of Object.entries(triads))for(const [name,pitches]of chords){
  const stem=slug(name+' '+group),file='music-games/assets/music-literacy/ah/sort-'+stem+'.svg';
  symbol({id:'literacy-inversion-'+stem,conceptId:'literacy-inversion-'+stem,name:'Treble-clef chord: '+pitches.join(', '),group,level:'AH',file,family:'inversions'});
 }
 return rows;
}
module.exports={build,categories};
