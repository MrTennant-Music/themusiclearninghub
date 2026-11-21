/* Original National 5 content, using the Hub's supplied Bravura outlines and
   notation geometry. Scope: index.html conceptData, National 3 through National 5.
   Excludes named diatonic intervals (Higher) and ties (Advanced Higher). */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),C=require('../music-games/core.js');
const folder=path.join(ROOT,'music-games/assets/music-literacy/n5');
const context={window:{}};
for(const file of ['shared/shared-notation-config.js','bravura-worksheet-outlines.js'])vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),'utf8'),context);
const O=context.window.BRAVURA_WORKSHEET_OUTLINES,config=context.window.SHARED_NOTATION_CONFIG;
const options={shuffle:true,timer:0,sound:true,theme:'blue'};
const terms=[
 ['Dotted crotchet','A note lasting one and a half beats.',['Crotchet','Minim','Dotted minim']],
 ['Dotted quaver','A note lasting three quarters of a beat.',['Quaver','Semiquaver','Crotchet']],
 ['Pianissimo','The Italian dynamic term meaning very quiet.',['Piano','Fortissimo','Mezzo piano']],
 ['Fortissimo','The Italian dynamic term meaning very loud.',['Forte','Pianissimo','Mezzo forte']],
 ['Sforzando','A sudden strong accent, shown by sfz.',['Crescendo','Diminuendo','Pianissimo']],
 ['Scotch snap','A short accented note followed by a longer note, often a semiquaver then a dotted quaver.',['Sequence','Repetition','Paired quavers']],
 ['Sequence','A musical pattern repeated at a higher or lower pitch.',['Repetition','Unison','Chord']],
 ['C major','The major key with no sharps or flats in its key signature.',['G major','F major','A minor']],
 ['G major','The major key with one sharp, F sharp, in its key signature.',['F major','C major','A minor']],
 ['F major','The major key with one flat, B flat, in its key signature.',['G major','C major','A minor']],
 ['A minor','The minor key with no sharps or flats in its key signature.',['C major','G major','F major']],
 ['Sharp','An accidental that raises a note by a semitone.',['Flat','Natural','Treble clef']],
 ['Flat','An accidental that lowers a note by a semitone.',['Sharp','Natural','Treble clef']],
 ['Natural','An accidental that cancels a sharp or flat.',['Sharp','Flat','Time signature']],
 ['Tone','A distance of two semitones between pitches.',['Semitone','Leap','Repetition']],
 ['Semitone','The smallest distance between neighbouring keys on a piano.',['Tone','Leap','Repetition']],
 ['Leap','Movement between notes that are more than a step apart.',['Step','Repetition','Unison']],
 ['Chord','Two or more different notes sounding together.',['Sequence','Repetition','Semitone']],
 ['First time bar','The ending played on the first playing of a repeated section, then skipped on the repeat.',['Second time bar','Double bar line','Time signature']],
 ['Second time bar','The ending played after a section has been repeated, skipping the first ending.',['First time bar','Double bar line','Time signature']]
];
const aliases={'Dotted crotchet':['dotted quarter note'],'Dotted quaver':['dotted eighth note'],'Pianissimo':['pp'],'Fortissimo':['ff'],'Sforzando':['sfz'],'C major':['Cmajor'],'G major':['Gmajor'],'F major':['Fmajor'],'A minor':['Aminor'],'Scotch snap':['Scots snap'],'First time bar':['1st time bar','first time bars'],'Second time bar':['2nd time bar','second time bars']};
function save(key,template,items,extra={}){
 if(!C.isHubLibraryTemplate(template)||['labelled-diagram','rank-order'].includes(template))return;
 const id=key.startsWith('reading-')?`hub-n5-${key}`:`hub-n5-music-literacy-${key}-1`;
 const activity=C.makeActivity({id,title:'Music Literacy',level:'N5',template,description:'Practise National 5 music literacy: dotted rhythms, Scotch snaps, dynamics, accidentals, keys, chords, leaps and repeat endings.',tags:['Music Literacy','National 5'],options,items:items.map((v,i)=>({id:`${id}-${i+1}`,...v})),...extra});
 const errors=C.validateActivity(activity);if(errors.length)throw Error(id+': '+JSON.stringify(errors));
 fs.writeFileSync(path.join(ROOT,'music-games/activities',id+'.json'),JSON.stringify(activity,null,2)+'\n');return activity;
}
function cloze(marked,distractors){let clozeText='',clozeGaps=[],last=0;for(const m of marked.matchAll(/\[\[(.*?)\]\]/g)){clozeText+=marked.slice(last,m.index);const start=clozeText.length;clozeText+=m[1];clozeGaps.push({start,end:clozeText.length,text:m[1]});last=m.index+m[0].length;}clozeText+=marked.slice(last);return {clozeText,clozeGaps,answer:clozeGaps[0].text,distractors};}
const ink='#142a3d';
function line(x1,y1,x2,y2,w=2){return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ink}" stroke-width="${w}"/>`;}
function glyph(key,x,y,size){const g=O.symbols[key],s=size/O.unitsPerEm;return `<path d="${g.path}" fill="${ink}" transform="translate(${x-g.advance*s/2} ${y}) scale(${s} ${-s})"/>`;}
function svg(body,width=800,height=800){return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;}
async function image(body,name,file){const sharp=require('sharp');fs.writeFileSync(path.join(folder,file+'.svg'),body);return {type:'image',src:'data:image/png;base64,'+(await sharp(Buffer.from(body)).resize(1600).png().toBuffer()).toString('base64'),name};}
const values={semibreve:4,'dotted-minim':3,minim:2,'dotted-crotchet':1.5,crotchet:1,'dotted-quaver':.75,quaver:.5,semiquaver:.25};
const combinations=[
 ['semibreve','dotted-crotchet','quaver','crotchet'],
 ['dotted-minim','dotted-crotchet','quaver','crotchet'],
 ['minim','dotted-crotchet','dotted-quaver','semiquaver'],
 ['minim','dotted-crotchet','quaver','semiquaver'],
 ['dotted-crotchet','dotted-crotchet','quaver','quaver'],
 ['minim','dotted-quaver','dotted-quaver','semiquaver'],
 ['dotted-crotchet','crotchet','dotted-quaver','semiquaver'],
 ['crotchet','dotted-quaver','semiquaver','quaver']
];
const scores=[
 {number:1,time:4,dynamic:'pianissimo',meaning:['','Very quiet'],notes:[['G4','dotted-crotchet',390],['A4','quaver',500],['B4','minim',640]],end:'double'},
 {number:2,time:2,dynamic:'fortissimo',meaning:['','Very loud'],notes:[['G4','dotted-quaver',400,'a'],['A4','semiquaver',500,'a'],['B4','crotchet',650]],end:'double'},
 {number:3,time:3,key:'G major',dynamic:'sforzato',meaning:['','Sudden strong accent'],notes:[['F5','minim',450],['D5','crotchet',630]],end:'repeat'},
 {number:4,time:4,key:'F major',notes:[['A4','dotted-minim',450],['B4','crotchet',630]],end:'double'},
 {number:5,time:3,scotchSnap:[0,1],notes:[['G4','semiquaver',400,'a'],['A4','dotted-quaver',500,'a'],['B4','minim',650]],end:'double'}
];
function auditScore(spec){const total=spec.notes.reduce((sum,n)=>sum+values[n[1]],0);if(total!==spec.time)throw Error('N5 bar total '+spec.number);for(const [pitch,rhythm] of spec.notes)if(!['E4','F4','G4','A4','B4','C5','D5','E5','F5'].includes(pitch)||!values[rhythm])throw Error('Invalid N5 notation inventory');}
async function label(spec){
 auditScore(spec);const gap=config.stave.lineGap*3,top=320,bottom=top+gap*4,pitches=['E4','F4','G4','A4','B4','C5','D5','E5','F5'],targets=[],pairs=[];
 let body=Array.from({length:5},(_,i)=>line(100,top+i*gap,740,top+i*gap,gap*.055)).join('');
 body+=glyph('gClef',155,bottom-gap,gap*config.symbols.gClef.fontSizeScale)+glyph('timeSig'+spec.time,267,top+gap,gap*3.5)+glyph('timeSig4',267,top+gap*3,gap*3.5);
 const add=(answer,x,y)=>targets.push({answer,prompt:'Label '+(targets.length+1),x:x/8,y:y/8});
 add('Time signature',267,404);
 if(spec.number===1)add('Treble clef',155,446);
 const notes=spec.notes.map(([pitch,rhythm,x,beam])=>({pitch,rhythm,x,beam,y:bottom-pitches.indexOf(pitch)*gap/2}));
 const groups={};for(const n of notes)if(n.beam)(groups[n.beam]??=[]).push(n);
 for(const group of Object.values(groups)){const down=group.reduce((sum,n)=>sum+pitches.indexOf(n.pitch),0)/group.length>=4;const beamY=(down?Math.max(...group.map(n=>n.y)):Math.min(...group.map(n=>n.y)))+(down?1:-1)*gap*3.1;for(const n of group){n.down=down;n.beamY=beamY;}}
 for(const n of notes){
  const key=['minim','dotted-minim'].includes(n.rhythm)?'noteheadHalf':'noteheadBlack',size=gap*config.symbols[key].fontSizeScale,down=n.down??pitches.indexOf(n.pitch)>=4,stemX=n.x+(down?-1:1)*(O.symbols[key].advance*size/O.unitsPerEm/2-gap*.06),endY=n.beamY??n.y+(down?1:-1)*gap*3.1;
  n.stemX=stemX;
  if(!n.beam&&n.rhythm==='quaver'){
   const symbol=O.symbols[down?'eighthNoteStemDown':'eighthNoteStemUp'],scale=size/O.unitsPerEm;
   body+=`<path d="${symbol.path}" fill="${ink}" transform="translate(${n.x-O.symbols.noteheadBlack.advance*scale/2} ${n.y}) scale(${scale} ${-scale})"/>`;
  }else body+=glyph(key,n.x,n.y,size)+line(stemX,n.y,stemX,endY,gap*config.drawing.stemThicknessScale);
  if(n.rhythm.startsWith('dotted-'))body+=glyph('augmentationDot',n.x+gap*1.1,n.y+(pitches.indexOf(n.pitch)%2===0?-gap/2:0),gap*config.symbols.augmentationDotSpace.fontSizeScale);

  // Offset note-name target with a leader so the target cannot hide the head.
  const targetY=n.y+(down?-1:1)*gap*.95;body+=line(n.x,n.y+(down?-1:1)*gap*.3,n.x,targetY);
  const pitchName=n.pitch.slice(0,-1)+(spec.key==='G major'&&n.pitch.startsWith('F')?' sharp':spec.key==='F major'&&n.pitch.startsWith('B')?' flat':'');
  if(!targets.some(t=>t.answer===pitchName))add(pitchName,n.x,targetY);
  const answer=n.rhythm.charAt(0).toUpperCase()+n.rhythm.slice(1).replaceAll('-',' ');add(answer,stemX,(n.y+endY)/2);pairs.push([pitchName,answer]);
 }
 for(const group of Object.values(groups)){const first=group[0],last=group.at(-1),thickness=gap*config.drawing.beamThicknessScale;
  body+=line(first.stemX,first.beamY,last.stemX,last.beamY,thickness);
  for(const n of group)if(n.rhythm==='semiquaver'){
   const direction=n===first?1:-1;const y=n.beamY+(n.down?-1:1)*gap*.75;
   body+=line(n.stemX,y,n.stemX+direction*gap*.7,y,thickness);
  }

 }
 function repeat(key,x){const g=O.symbols[key],s=(bottom-top)/1000;return `<path d="${g.path}" fill="${ink}" transform="translate(${x} ${bottom}) scale(${s} ${-s})"/>`;}
 if(spec.end==='repeat'){body+=repeat('repeatRight',740-O.symbols.repeatRight.advance*(bottom-top)/1000);add(spec.startRepeat?'End repeat':'Repeat sign',735,404);}
 else{body+=line(728,top,728,bottom,2.3)+line(740,top,740,bottom,6.3);add('Double bar line',740,404);}
 if(spec.startRepeat){body+=repeat('repeatLeft',312);add('Start repeat',320,404);}
 if(spec.tempo){body+=`<text x="350" y="220" fill="${ink}" font-family="Georgia,serif" font-size="34" font-weight="600">${spec.tempo}</text>`+line(510,208,560,208);add(spec.meaning[0],560,208);}
 if(spec.dynamic){body+=glyph(spec.dynamic,450,640,gap*3.4)+line(500,625,550,625);add(spec.meaning[1],550,625);}
 if(spec.key){
  const sharp=spec.key==='G major',keyX=215,keyY=sharp?top:bottom-gap*2;
  body+=glyph(sharp?'sharp':'flat',keyX,keyY,gap*3.2)+line(keyX,keyY-gap*.7,keyX,top-gap*1.4);
  add('Key signature',keyX,top-gap*1.4);
 }
 if(spec.scotchSnap){const [a,b]=spec.scotchSnap.map(i=>notes[i]),y=244,bracketLeft=a.stemX,bracketRight=b.stemX;
  body+=glyph('accentAbove',a.x,a.beamY-28,gap*2);
  body+=`<path d="M${bracketLeft} ${y+12}V${y}H${bracketRight}V${y+12}" fill="none" stroke="${ink}" stroke-width="2"/>`;
  add('Scotch snap',(bracketLeft+bracketRight)/2,y);
 }
 const id=`hub-n5-reading-music-label-${spec.number}`;
 const a=save(`reading-music-label-${spec.number}`,'labelled-diagram',targets,{title:spec.number===1?'Reading Music':`Reading Music ${spec.number}`,description:'Identify notes, rhythms and musical signs in an N5 score.',instructions:'Place each label at its target. Pointers show note names; stems and beams show rhythms. Select Submit when ready.',diagram:await image(svg(body),`N5 Reading Music ${spec.number}`,`reading-music-${spec.number}`),options:{...options,shuffle:false}});
 for(const [pitch,rhythm]of pairs){const p=a.items.find(n=>n.answer===pitch),r=a.items.find(n=>n.answer===rhythm);if(p&&r){p.acceptedTargetIds=[...(p.acceptedTargetIds||[]),r.id];r.acceptedTargetIds=[...(r.acceptedTargetIds||[]),p.id];}}
 fs.writeFileSync(path.join(ROOT,'music-games/activities',id+'.json'),JSON.stringify(a,null,2)+'\n');
}
const puzzleOmissions=["Sequence", "Tone", "Semitone", "Leap", "Chord"];
async function main(){
 fs.mkdirSync(folder,{recursive:true});
 for(const [key,template]of [['crossword','crossword'],['wordsearch','wordsearch'],['true-or-false','true-or-false']])save(key,template,(['crossword','wordsearch'].includes(template)?terms.filter(([answer])=>!puzzleOmissions.includes(answer)).slice(0,C.LIMITS[template+'Items']):terms).map(([answer,prompt,distractors])=>({answer,prompt,distractors:['quiz','true-or-false'].includes(template)?distractors:[],...(template==='type-the-answer'?{correctAnswers:[answer,...(aliases[answer]||[])]}:{})})));
 save('blank','complete-the-sentence',[
  cloze('A [[dotted crotchet]] lasts one and a half beats.',['crotchet','minim','dotted minim']),
  cloze('A dotted quaver lasts [[three quarters]] of a beat.',['half','one quarter','one and a half']),
  cloze('The marking pp means very [[quiet]].',['loud','fast','slow']),
  cloze('[[Fortissimo]], meaning very loud, is written [[ff]].',['Pianissimo','pp']),
  cloze('A sudden strong accent is called [[sforzando]].',['crescendo','diminuendo','pianissimo']),
  cloze('A short accented note followed by a longer note is a [[Scotch snap]].',['sequence','repetition','chord']),
  cloze('A pattern repeated at a higher or lower pitch is a [[sequence]].',['repetition','chord','unison']),
  cloze('The major key with one sharp is [[G major]].',['C major','A minor','F major']),
  cloze('The major key with one flat is [[F major]].',['C major','G major','A minor']),
  cloze('A [[natural]] cancels a sharp or flat.',['sharp','flat','repeat sign']),
  cloze('A dotted crotchet followed by a quaver lasts [[two]] beats.',['one','three','four']),
  cloze('A [[tone]] is equal to [[two]] semitones.',['semitone','three']),
  cloze('The major key with no sharps or flats is [[C major]].',['G major','A minor','F major']),
  cloze('The minor key with no sharps or flats is [[A minor]].',['C major','G major','F major']),
  cloze('C, E and G sound together to form a [[C major]] chord.',['G major','A minor','F major']),
  cloze('An [[A minor]] chord contains A, C and E.',['C major','G major','F major']),
  cloze('A [[sharp]] raises a note; a [[flat]] lowers it.',['natural','repeat sign']),
  cloze('In a repeat, skip the first-time bar on the second playing and use the [[second-time bar]].',['first-time bar','time signature','key signature'])
 ],{instructions:'Place the missing words into the blanks, then select Submit.'});
 const groups={'Note values':['Minim','Dotted crotchet','Dotted quaver','Semiquaver'],'Dynamic markings':['Pianissimo','Mezzo piano','Fortissimo','Sforzando'],'Keys':['C major','G major','F major','A minor'],'Pitch distances and movement':['Step','Leap','Tone','Semitone']};
 save('connections','matching-pairs',Object.entries(groups).flatMap(([group,names])=>names.map(answer=>({answer,prompt:answer,group}))),{instructions:'Select four related cards, then select Submit. Find all four groups.'});
 const rank=[];
 for(const [i,row]of combinations.entries()){
  const shapes=row.map((r,n)=>`<g transform="translate(${n*120} 0)">${fs.readFileSync(path.join(ROOT,'music-games/assets/rhythm-order',r+'.svg'),'utf8').replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'')}</g>`).join('');
  const name=row.map(r=>r.replaceAll('-',' ')).join(' + ');rank.push({prompt:'',answer:name,media:await image(svg(shapes,480,90),name,`combination-${i+1}`)});
 }
 save('order','rank-order',rank,{title:'Rhythm Lengths',instructions:'Add the beats in each row. Arrange the combinations from longest total length to shortest, then select Submit.',tags:['Music Literacy','National 5','Rhythm combinations']});
 const sort=[];async function add(name,group,body,file){const media=file?{type:'image',src:'data:image/png;base64,'+fs.readFileSync(file).toString('base64'),name}:await image(svg(body,120,90),name,'sort-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-'));sort.push({prompt:'',answer:name,group,media});}
 for(const [name,key]of [['Pianissimo','pianissimo'],['Mezzo piano','mezzoPiano'],['Mezzo forte','mezzoForte'],['Fortissimo','fortissimo'],['Sforzando','sforzato']])await add(name,'Dynamics',glyph(key,60,60,85));
 for(const [name,points]of [['Crescendo','M105 29L15 45L105 61'],['Diminuendo','M15 29L105 45L15 61']])await add(name,'Dynamics',`<path d="${points}" fill="none" stroke="${ink}" stroke-width="3"/>`);
 for(const name of Object.keys(values))await add(name.replaceAll('-',' '),'Rhythms',null,path.join(ROOT,'music-games/assets/rhythm-order',name+'.png'));
 for(const n of [2,3,4])await add(n+'/4','Time signatures',glyph('timeSig'+n,60,29,60)+glyph('timeSig4',60,61,60));
 await add('Stave','Notation',[25,35,45,55,65].map(y=>line(15,y,105,y)).join(''));
 await add('Bar line','Notation',line(60,12,60,78,3));await add('Double bar line','Notation',line(53,12,53,78,2)+line(64,12,64,78,6));await add('Treble clef','Notation',glyph('gClef',60,53,43));
 for(const [name,key]of [['Start repeat','repeatLeft'],['End repeat','repeatRight']])await add(name,'Notation',glyph(key,60,78,66));
 for(const name of ['Sharp','Flat','Natural'])await add(name,'Accidentals',glyph(name.toLowerCase(),60,55,55));
 for(const [name,sign]of [['C major',null],['G major','sharp'],['F major','flat']]){
  const stave=[25,35,45,55,65].map(y=>line(10,y,110,y,1)).join('');
  await add(name,'Major key signatures',stave+glyph('gClef',30,55,30)+(sign?glyph(sign,75,sign==='sharp'?25:45,32):''));
 }
 save('sort','group-sort',sort,{instructions:'Drag each card into its group, or select a card then a group. Select Submit when ready.'});
 fs.writeFileSync(path.join(folder,'scores.json'),JSON.stringify(scores,null,2)+'\n');// Literacy Label activities are retired.
 console.log('Created 15 N5 Music Literacy activities across all eleven game types.');
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={terms,scores,combinations,values,auditScore};
