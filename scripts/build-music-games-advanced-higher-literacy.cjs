/* Original Advanced Higher content, using the Hub's supplied Bravura outlines and
   notation geometry. Scope: index.html conceptData, National 3 through Advanced Higher.
   Includes the Advanced Higher row and inherited concepts. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),C=require('../music-games/core.js');
const folder=path.join(ROOT,'music-games/assets/music-literacy/ah');
const context={window:{}};
for(const file of ['shared/shared-notation-config.js','bravura-worksheet-outlines.js'])vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),'utf8'),context);
const O=context.window.BRAVURA_WORKSHEET_OUTLINES,config=context.window.SHARED_NOTATION_CONFIG;
const options={shuffle:true,timer:0,sound:true,theme:'blue'};
const terms=[
 ['D major','The major key whose key signature contains F sharp and C sharp.',['B flat major','E minor','D minor']],
 ['B flat major','The major key whose key signature contains B flat and E flat.',['D major','E minor','D minor']],
 ['E minor','The minor key with F sharp in its key signature.',['D minor','A minor','D major']],
 ['D minor','The minor key with B flat in its key signature.',['E minor','A minor','B flat major']],
 ['Enharmonic equivalent','A different note name for the same sounding pitch.',['First inversion','Second inversion','Ledger line']],
 ['First inversion','A triad with its third as the lowest note.',['Root position','Second inversion','Dominant seventh']],
 ['Second inversion','A triad with its fifth as the lowest note.',['Root position','First inversion','Added sixth']],
 ['Augmented triad','A three-note chord built from two major thirds.',['Diminished seventh','Dominant seventh','Added sixth']],
 ['Diminished seventh','A four-note chord built from three minor thirds.',['Augmented triad','Dominant seventh','Added sixth']],
 ['Dominant seventh','A major triad with an added minor seventh.',['Augmented triad','Diminished seventh','Added sixth']],
 ['Added sixth','A major triad with an added major sixth.',['Augmented triad','Diminished seventh','Dominant seventh']],
 ['Tritone','An interval spanning three whole tones.',['Perfect fifth','Major third','Semitone']],
 ['Augmented fourth','The interval from C up to F sharp, using four letter names.',['Diminished fifth','Perfect fourth','Perfect fifth']],
 ['Diminished fifth','The interval from C up to G flat, using five letter names.',['Augmented fourth','Perfect fourth','Perfect fifth']],
 ['Tie','A curved line joining notes of the same pitch so their lengths are added together.',['Slur','Phrase mark','Repeat sign']],
 ['Syncopation','Emphasis on normally weak beats or offbeats, often sustained across a stronger beat.',['Repetition','Sequence','Scotch snap']],
 ['Dal segno','The direction D.S., telling the performer to return to the sign.',['Da capo','Fine','Repeat sign']],
 ['Fine','The instruction marking where to stop after a directed return.',['Dal segno','Da capo','Repeat sign']],
 ['Ledger line','A short extra staff line used for notes above or below the stave.',['Bar line','Double bar line','Phrase mark']]
];
const aliases={'B flat major':['B-flat major','Bb major','B♭ major'],'D major':['Dmajor'],'D minor':['Dminor'],'E minor':['Eminor'],'First inversion':['1st inversion'],'Second inversion':['2nd inversion'],'Chord II':['II','chord 2'],'Augmented triad':['augmented chord'],'Diminished seventh':['diminished 7th'],'Dominant seventh':['dominant 7th'],'Added sixth':['added 6th'],'Augmented fourth':['augmented 4th'],'Diminished fifth':['diminished 5th'],'Dal segno':['DS','D.S.'],'Ledger line':['ledger lines']};
function save(key,template,items,extra={}){
 if(!C.isHubLibraryTemplate(template)||['labelled-diagram','rank-order'].includes(template))return;
 const id=key.startsWith('reading-')?`hub-ah-${key}`:`hub-ah-music-literacy-${key}-1`;
 const activity=C.makeActivity({id,title:'Music Literacy',level:'AH',template,description:'Practise Advanced Higher music literacy: keys, enharmonic equivalents, inversions, extended chords, chromatic intervals, ties and score directions.',tags:['Music Literacy','Advanced Higher'],options,items:items.map((v,i)=>({id:`${id}-${i+1}`,...v})),...extra});
 const errors=C.validateActivity(activity);if(errors.length)throw Error(id+': '+JSON.stringify(errors));
 fs.writeFileSync(path.join(ROOT,'music-games/activities',id+'.json'),JSON.stringify(activity,null,2)+'\n');return activity;
}
function cloze(marked,distractors){let clozeText='',clozeGaps=[],last=0;for(const m of marked.matchAll(/\[\[(.*?)\]\]/g)){clozeText+=marked.slice(last,m.index);const start=clozeText.length;clozeText+=m[1];clozeGaps.push({start,end:clozeText.length,text:m[1]});last=m.index+m[0].length;}clozeText+=marked.slice(last);return {clozeText,clozeGaps,answer:clozeGaps[0].text,distractors};}
const ink='#142a3d';
function line(x1,y1,x2,y2,w=2){return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ink}" stroke-width="${w}"/>`;}
function glyph(key,x,y,size){const g=O.symbols[key],s=size/O.unitsPerEm;return `<path d="${g.path}" fill="${ink}" transform="translate(${x-g.advance*s/2} ${y}) scale(${s} ${-s})"/>`;}
function svg(body,width=800,height=800){return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;}
async function image(body,name,file){const sharp=require('sharp');fs.writeFileSync(path.join(folder,file+'.svg'),body);return {type:'image',src:'data:image/png;base64,'+(await sharp(Buffer.from(body)).resize(1600).png().toBuffer()).toString('base64'),name};}
const values={semibreve:4,'dotted-minim':3,minim:2,'dotted-crotchet':1.5,crotchet:1,'dotted-quaver':.75,quaver:.5,semiquaver:.25,'crotchet-rest':1,'minim-rest':2,'quaver-rest':.5,'dotted-crotchet-rest':1.5};
const combinations=[
 ['semibreve','dotted-minim','quaver-rest','semiquaver'],
 ['semibreve','minim-rest','dotted-quaver','semiquaver'],
 ['dotted-minim','minim','crotchet-rest','semiquaver'],
 ['minim','dotted-crotchet','crotchet','semiquaver'],
 ['minim','crotchet-rest','dotted-quaver','quaver'],
 ['minim','quaver','quaver-rest','dotted-quaver'],
 ['dotted-crotchet','crotchet-rest','quaver','quaver-rest'],
 ['crotchet','crotchet-rest','dotted-quaver','semiquaver']
];
const scores=[
 {number:1,clef:'bass',time:[5,4],notes:[{pitch:'C2',rhythm:'minim',x:390},{pitch:'D3',rhythm:'minim',x:520},{pitch:'E4',rhythm:'crotchet',x:660}],end:'double'},
 {number:2,clef:'treble',time:[4,4],key:'D major',notes:[{pitch:'F4',rhythm:'dotted-minim',x:440},{pitch:'G4',rhythm:'crotchet',x:650}],end:'double'},
 {number:3,clef:'bass',time:[3,4],key:'B flat major',notes:[{pitch:'D3',rhythm:'minim',x:440},{pitch:'F3',rhythm:'crotchet',x:650}],end:'double'},
 {number:4,clef:'treble',time:[4,4],tie:[0,1],notes:[{pitch:'G4',rhythm:'dotted-crotchet',x:390,targetNotehead:true},{pitch:'G4',rhythm:'quaver',x:500},{pitch:'A4',rhythm:'minim',x:650}],end:'double'},
 {number:5,clef:'treble',time:[5,4],rhythmLabels:false,notes:[{pitch:'G4',rhythm:'quaver',x:345},{pitch:'A4',rhythm:'crotchet',x:410},{pitch:'B4',rhythm:'crotchet',x:475},{pitch:'C5',rhythm:'crotchet',x:540},{pitch:'D5',rhythm:'crotchet',x:605},{pitch:'E5',rhythm:'quaver',x:670}],end:'double'}
];
const triads={
  'Root position':[['C major',['C4','E4','G4']],['G major',['G4','B4','D5']],['F major',['F4','A4','C5']],['A minor',['A4','C5','E5']],['D major',['D4','F#4','A4']],['B flat major',['Bb4','D5','F5']],['E minor',['E4','G4','B4']],['D minor',['D4','F4','A4']]],
  'First inversion':[['C major',['E4','G4','C5']],['G major',['B4','D5','G5']],['F major',['A4','C5','F5']],['A minor',['C4','E4','A4']],['D major',['F#4','A4','D5']],['B flat major',['D4','F4','Bb4']],['E minor',['G4','B4','E5']],['D minor',['F4','A4','D5']]],
  'Second inversion':[['C major',['G4','C5','E5']],['G major',['D4','G4','B4']],['F major',['C4','F4','A4']],['A minor',['E4','A4','C5']],['D major',['A4','D5','F#5']],['B flat major',['F4','Bb4','D5']],['E minor',['B4','E5','G5']],['D minor',['A4','D5','F5']]]
 };
const pitchLetters=['C','D','E','F','G','A','B'];
function pitchStep(pitch,clef){const absolute=Number(pitch.slice(-1))*7+pitchLetters.indexOf(pitch[0]);return absolute-(clef==='bass'?2*7+4:4*7+2);}
function auditScore(spec){
 const total=spec.notes.reduce((sum,n)=>sum+values[n.rhythm]*(n.triplet?2/3:1),0);
 if(Math.abs(total-spec.time[0]*4/spec.time[1])>1e-8)throw Error('Higher bar total '+spec.number);
 for(const n of spec.notes){if(!values[n.rhythm])throw Error('Invalid Higher rhythm');if(!n.rest){const step=pitchStep(n.pitch,spec.clef);if(step< -4||step>12)throw Error('Outside Higher pitch range');}}
 for(const group of new Set(spec.notes.filter(n=>n.triplet).map(n=>n.beam)))if(spec.notes.filter(n=>n.triplet&&n.beam===group).length!==3)throw Error('Triplets require three notes');
}
const restSymbols={'crotchet-rest':'quarterRest','minim-rest':'halfRest','quaver-rest':'eighthRest','dotted-crotchet-rest':'quarterRest'};
function restBody(name,x=60,y=45,size=45){let body=glyph(restSymbols[name],x,y,size);if(name==='dotted-crotchet-rest')body+=glyph('augmentationDot',x+20,y,20);return body;}
async function label(spec){
 auditScore(spec);const gap=config.stave.lineGap*3,top=320,bottom=top+gap*4,targets=[],pairs=[];
 let body=Array.from({length:5},(_,i)=>line(100,top+i*gap,740,top+i*gap,gap*.055)).join('');
 const add=(answer,x,y)=>{if(!targets.some(t=>t.answer===answer))targets.push({answer,prompt:'Label '+(targets.length+1),x:x/8,y:y/8});};
 const bass=spec.clef==='bass',clefKey=bass?'fClef':'gClef';
 body+=glyph(clefKey,155,bass?top+gap:bottom-gap,gap*config.symbols[clefKey].fontSizeScale);
 const number=(n,x,y)=>String(n).split('').map((v,i)=>glyph('timeSig'+v,x+(i-(String(n).length-1)/2)*42,y,gap*3.5)).join('');
 const timeX=spec.key?315:267;body+=number(spec.time[0],timeX,top+gap)+number(spec.time[1],timeX,top+gap*3);add('Time signature',timeX,404);
 if(bass)add('Bass clef',155,top+gap);
 const notes=spec.notes.map(n=>({...n,step:n.rest?4:pitchStep(n.pitch,spec.clef),y:n.rest?top+gap*2:bottom-pitchStep(n.pitch,spec.clef)*gap/2}));
 const groups={};for(const n of notes)if(n.beam)(groups[n.beam]??=[]).push(n);
 for(const group of Object.values(groups)){const down=group.reduce((sum,n)=>sum+n.step,0)/group.length>=4;const beamY=(down?Math.max(...group.map(n=>n.y)):Math.min(...group.map(n=>n.y)))+(down?1:-1)*gap*3.1;for(const n of group){n.down=down;n.beamY=beamY;}}
 for(const n of notes){
  if(n.rest){body+=restBody(n.rhythm,n.x,n.y,gap*config.symbols[restSymbols[n.rhythm]].fontSizeScale);const targetY=n.y+gap*1.8;body+=line(n.x,n.y+gap*.7,n.x,targetY);add(n.rhythm==='crotchet-rest'?'Crotchet rest':'Quaver rest',n.x,targetY);continue;}
  const key=['minim','dotted-minim'].includes(n.rhythm)?'noteheadHalf':'noteheadBlack',size=gap*config.symbols[key].fontSizeScale,down=n.down??n.step>=4,stemX=n.x+(down?-1:1)*(O.symbols[key].advance*size/O.unitsPerEm/2-gap*.06),endY=n.beamY??n.y+(down?1:-1)*gap*3.1;
  n.stemX=stemX;
  if(n.step<0)for(let step=-2;step>=n.step;step-=2)body+=line(n.x-gap*.7,bottom-step*gap/2,n.x+gap*.7,bottom-step*gap/2,gap*.055);
  if(n.step>8)for(let step=10;step<=n.step;step+=2)body+=line(n.x-gap*.7,bottom-step*gap/2,n.x+gap*.7,bottom-step*gap/2,gap*.055);
  if(!n.beam&&n.rhythm==='quaver'){const symbol=O.symbols[down?'eighthNoteStemDown':'eighthNoteStemUp'],scale=size/O.unitsPerEm;body+=`<path d="${symbol.path}" fill="${ink}" transform="translate(${n.x-O.symbols.noteheadBlack.advance*scale/2} ${n.y}) scale(${scale} ${-scale})"/>`;}
  else body+=glyph(key,n.x,n.y,size)+line(stemX,n.y,stemX,endY,gap*config.drawing.stemThicknessScale);
  if(n.rhythm.startsWith('dotted-'))body+=glyph('augmentationDot',n.x+gap*1.1,n.y+(n.step%2===0?-gap/2:0),gap*config.symbols.augmentationDotSpace.fontSizeScale);
  // Pointer ends stay clear of noteheads and articulation marks.
  const targetX=n.articulation?n.x+65:n.x,targetY=n.targetNotehead||n.articulation?n.y:n.y+(down?-1:1)*gap*.95;
  if(!n.targetNotehead)body+=line(n.x+(n.articulation?gap*.45:0),n.y+(n.articulation?0:(down?-1:1)*gap*.3),targetX,targetY);
  const pitchName=n.pitch.slice(0,-1)+(['D major','G major','E minor'].includes(spec.key)&&['F',...(spec.key==='D major'?['C']:[])].includes(n.pitch[0])?' sharp':['B flat major','D minor','F major'].includes(spec.key)&&['B',...(spec.key==='B flat major'?['E']:[])].includes(n.pitch[0])?' flat':'');add(pitchName,targetX,targetY);
  if(!n.triplet&&spec.rhythmLabels!==false){const answer=n.rhythm.charAt(0).toUpperCase()+n.rhythm.slice(1).replaceAll('-',' ');add(answer,stemX,(n.y+endY)/2);if(notes.filter(note=>!note.rest&&note.rhythm===n.rhythm).length===1)pairs.push([pitchName,answer]);}
  if(n.articulation){const y=n.y-48,key=n.articulation==='accent'?'accentAbove':'staccatoAbove';body+=glyph(key,n.x,y,gap*1.6);add(n.articulation==='accent'?'Accent':'Staccato',n.x,y);}
 }
 for(const group of Object.values(groups)){const first=group[0],last=group.at(-1);body+=line(first.stemX,first.beamY,last.stemX,last.beamY,gap*config.drawing.beamThicknessScale);
  if(first.triplet){const x=(first.stemX+last.stemX)/2,y=first.beamY+(first.down?48:-26);body+=`<text x="${x}" y="${y}" font-family="Georgia,serif" font-size="35" font-style="italic" text-anchor="middle" fill="${ink}">3</text>`+line(x+20,y-10,x+65,y-10);add('Quaver triplet',x+65,y-10);}
 }
 if(spec.slur){const [a,b]=spec.slur.map(i=>notes[i]),y=245;body+=`<path d="M${a.x} ${y+35}Q${(a.x+b.x)/2} ${y-15} ${b.x} ${y+35}" fill="none" stroke="${ink}" stroke-width="3"/>`+line((a.x+b.x)/2,y+10,(a.x+b.x)/2,y-35);add('Slur',(a.x+b.x)/2,y-35);}
 if(spec.key){
  const accidental=spec.key==='D major'?'sharp':'flat',steps=spec.key==='D major'?[8,5]:[2,5];
  for(const [i,step]of steps.entries())body+=glyph(accidental,207+i*24,bottom-step*gap/2,gap*3.2);
  body+=line(220,top-32,220,top-65);add('Key signature',220,top-65);
 }
 if(spec.tie){const [a,b]=spec.tie.map(i=>notes[i]),y=Math.max(a.y,b.y)+gap*.55,x=(a.x+b.x)/2;
  body+=`<path d="M${a.x+8} ${y}Q${x} ${y+30} ${b.x-8} ${y}" fill="none" stroke="${ink}" stroke-width="3"/>`+line(x,y+15,x,y+70);add('Tie',x,y+70);
 }
 if(spec.syncopation){const [a,b]=spec.syncopation.map(i=>notes[i]),y=210;
  body+=`<path d="M${a.x} ${y+12}V${y}H${b.x}V${y+12}" fill="none" stroke="${ink}" stroke-width="2"/>`;add('Syncopation',(a.x+b.x)/2,y);
 }
 body+=line(728,top,728,bottom,2.3)+line(740,top,740,bottom,6.3);add('Double bar line',740,404);
 const id=`hub-ah-reading-music-label-${spec.number}`;
 const a=save(`reading-music-label-${spec.number}`,'labelled-diagram',targets,{title:spec.number===1?'Reading Music':`Reading Music ${spec.number}`,description:'Identify Advanced Higher notation in a short, complete bar of music.',instructions:'Place each label at its target. Pointers show the relevant note or marking. Select Submit when ready.',diagram:await image(svg(body),`Advanced Higher Reading Music ${spec.number}`,`reading-music-${spec.number}`),options:{...options,shuffle:false}});
 for(const [pitch,rhythm]of pairs){const p=a.items.find(n=>n.answer===pitch),r=a.items.find(n=>n.answer===rhythm);if(p&&r){p.acceptedTargetIds=[...(p.acceptedTargetIds||[]),r.id];r.acceptedTargetIds=[...(r.acceptedTargetIds||[]),p.id];}}
 fs.writeFileSync(path.join(ROOT,'music-games/activities',id+'.json'),JSON.stringify(a,null,2)+'\n');
}
const puzzleOmissions=["Chord II", "Added sixth", "Augmented fourth", "Diminished fifth", "Ledger line"];
async function main(){
 fs.mkdirSync(folder,{recursive:true});
 for(const [key,template]of [['crossword','crossword'],['wordsearch','wordsearch'],['true-or-false','true-or-false']])save(key,template,(['crossword','wordsearch'].includes(template)?terms.filter(([answer])=>!puzzleOmissions.includes(answer)).slice(0,C.LIMITS[template+'Items']):terms).map(([answer,prompt,distractors])=>({answer,prompt,distractors:['quiz','true-or-false'].includes(template)?distractors:[],...(template==='type-the-answer'?{correctAnswers:[answer,...(aliases[answer]||[])]}:{})})));
 save('blank','complete-the-sentence',[
  cloze('D major has [[two sharps]] in its key signature.',['one sharp','one flat','two flats']),
  cloze('B flat major has [[two flats]] in its key signature.',['one flat','one sharp','two sharps']),
  cloze('The minor key with one sharp is [[E minor]].',['D minor','A minor','D major']),
  cloze('The minor key with one flat is [[D minor]].',['E minor','A minor','B flat major']),
  cloze('C sharp has the same sounding pitch as [[D flat]].',['D','C flat','E flat']),
  cloze('G sharp has the same sounding pitch as [[A flat]].',['A','G flat','B flat']),
  cloze('In first inversion, the [[third]] of the chord is the lowest note.',['root','fifth','seventh']),
  cloze('In second inversion, the [[fifth]] of the chord is the lowest note.',['root','third','seventh']),
  cloze('The lowest note of C major in first inversion is [[E]].',['C','G','A']),
  cloze('A tritone spans [[three]] whole tones.',['two','four','six']),
  cloze('From C up to F sharp is an [[augmented fourth]].',['diminished fifth','perfect fourth','perfect fifth']),
  cloze('From C up to G flat is a [[diminished fifth]].',['augmented fourth','perfect fourth','perfect fifth']),
  cloze('A tie joins notes of the [[same]] pitch; add their [[lengths]] together.',['different','accidentals']),
  cloze('Emphasis on normally weak beats or offbeats is [[syncopation]].',['repetition','sequence','a Scotch snap']),
  cloze('A full bar in 5/4 lasts [[five]] beats.',['three','four','six']),
  cloze('D.S. means [[dal segno]]: return to the sign.',['da capo','fine','crescendo']),
  cloze('After a directed return, [[Fine]] marks where to stop.',['D.S.','D.C.','8va']),
  cloze('8va means an octave [[higher]]; 8vb means an octave [[lower]].',['louder','quieter']),
  cloze('An added sixth chord adds a [[sixth]] to a major triad.',['seventh','second','fourth']),
  cloze('The lowest note of E minor in second inversion is [[B]].',['E','G','D'])
 ],{instructions:'Place the missing words into the blanks, then select Submit.'});
 const groups={'Keys':['D major','B flat major','E minor','D minor'],'Extended and altered chords':['Augmented triad','Diminished 7th','Dominant 7th','Added 6th'],'Chromatic intervals':['Tritone','Augmented 4th','Diminished 5th','Semitone'],'Repeat directions':['Dal segno','Da capo','Fine','Repeat sign']};
 save('connections','matching-pairs',Object.entries(groups).flatMap(([group,names])=>names.map(answer=>({answer,prompt:answer,group}))),{instructions:'Select four related cards, then select Submit. Find all four groups.'});
 const rank=[];
 for(const [i,row]of combinations.entries()){
  const shapes=row.map((r,n)=>`<g transform="translate(${n*120} 0)">${r.endsWith('-rest')?restBody(r):fs.readFileSync(path.join(ROOT,'music-games/assets/rhythm-order',r+'.svg'),'utf8').replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'')}</g>`).join('');
  const tie=[2,3].includes(i)?`<path d="M60 76Q120 91 180 76" fill="none" stroke="${ink}" stroke-width="1.8"/>`:'';
  const name=row.map(r=>r.replaceAll('-',' ')).join(' + ')+([2,3].includes(i)?' (first two notes tied)':'');rank.push({prompt:'',answer:name,media:await image(svg(shapes+tie,480,90),name,`combination-${i+1}`)});
 }
 save('order','rank-order',rank,{title:'Rhythm Lengths',instructions:'Add the beats in each row. Arrange the combinations from longest total length to shortest, then select Submit.',tags:['Music Literacy','Advanced Higher','Rhythm combinations']});
 const sort=[];
 async function add(name,group,body){sort.push({prompt:'',answer:name,group,media:await image(svg(body,120,100),name,'sort-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-'))});}
 const miniStaff=()=>[30,40,50,60,70].map(y=>line(8,y,112,y,1)).join('')+glyph('gClef',25,60,30);
 function chord(notes){
  const steps=notes.map(n=>pitchStep(n.pitch,'treble')),down=steps.reduce((a,b)=>a+b,0)/steps.length>=4;
  let body=miniStaff(),previous=null;
  for(const [i,n]of notes.entries()){
   const step=steps[i],y=70-step*5,x=previous!==null&&step-previous===1?(down?68:88):78;previous=step;
   if(step<0)for(let st=-2;st>=step;st-=2)body+=line(x-9,70-st*5,x+9,70-st*5,1);
   if(step>8)for(let st=10;st<=step;st+=2)body+=line(x-9,70-st*5,x+9,70-st*5,1);
   body+=glyph('noteheadBlack',x,y,36);if(n.accidental)body+=glyph(n.accidental,55,y,29);
  }
  const ys=steps.map(step=>70-step*5);return body+line(down?73:83,down?Math.min(...ys):Math.max(...ys),down?73:83,down?Math.max(...ys)+25:Math.min(...ys)-25,1.3);
 }
 for(const [group,cards]of Object.entries(triads))for(const [name,pitches]of cards)await add(name+' — '+group,group,chord(pitches.map(pitch=>({pitch,accidental:pitch.includes('#')?'sharp':pitch.includes('b')?'flat':null}))));
 save('sort','group-sort',sort,{instructions:'Drag each card into its group, or select a card then a group. Select Submit when ready.'});
 fs.writeFileSync(path.join(folder,'scores.json'),JSON.stringify(scores,null,2)+'\n');// Literacy Label activities are retired.
 console.log('Created 15 Advanced Higher Music Literacy activities across all eleven game types.');
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={terms,scores,combinations,values,auditScore,pitchStep,triads};
