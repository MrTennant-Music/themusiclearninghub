/* Original Higher content, using the Hub's supplied Bravura outlines and
   notation geometry. Scope: index.html conceptData, National 3 through Higher.
   Includes the Higher row and inherited concepts; ties remain Advanced Higher. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),C=require('../music-games/core.js');
const folder=path.join(ROOT,'music-games/assets/music-literacy/h');
const context={window:{}};
for(const file of ['shared/shared-notation-config.js','bravura-worksheet-outlines.js'])vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),'utf8'),context);
const O=context.window.BRAVURA_WORKSHEET_OUTLINES,config=context.window.SHARED_NOTATION_CONFIG;
const options={shuffle:true,timer:0,sound:true,theme:'blue'};
const terms=[
 ['Bass clef','The clef whose two dots surround the F line.',['Treble clef','Key signature','Time signature']],
 ['Tonic','The first note of a scale.',['Subdominant','Dominant','Octave']],
 ['Subdominant','The fourth note of a scale.',['Tonic','Dominant','Octave']],
 ['Dominant','The fifth note of a scale.',['Tonic','Subdominant','Octave']],
 ['Second','The interval from C up to D, counting both notes.',['Third','Fourth','Fifth']],
 ['Third','The interval from C up to E, counting both notes.',['Second','Fourth','Sixth']],
 ['Fourth','The interval from C up to F, counting both notes.',['Third','Fifth','Sixth']],
 ['Fifth','The interval from C up to G, counting both notes.',['Fourth','Sixth','Seventh']],
 ['Sixth','The interval from C up to A, counting both notes.',['Third','Fifth','Seventh']],
 ['Seventh','The interval from C up to B, counting both notes.',['Fifth','Sixth','Octave']],
 ['Octave','The interval from C up to the next C, counting both notes.',['Fifth','Sixth','Seventh']],
 ['Triplet','Three equal notes performed in the time normally taken by two notes of the same value.',['Scotch snap','Sequence','Dotted rhythm']],
 ['Slur','A curved line telling the performer to play different notes smoothly connected.',['Phrase mark','Accent','Staccato']],
 ['Staccato','Dots above or below notes telling the performer to play them short and detached.',['Slur','Accent','Phrase mark']],
 ['Accent','A mark telling the performer to give a note extra emphasis.',['Slur','Staccato','Phrase mark']],
 ['Phrase mark','A long curved line showing a musical phrase, like a musical sentence.',['Accent','Staccato','Repeat sign']],
 ['Da capo','The direction D.C., telling the performer to return to the beginning.',['First time bar','Second time bar','Repeat sign']],
 ['Compound time','Time in which each main beat divides into three equal parts.',['Simple time','Scotch snap','Dotted rhythm']],
 ['Chord IV','The chord F major in the key of C major.',['Chord I','Chord V','Chord VI']],
 ['Chord VI','The chord A minor in the key of C major.',['Chord I','Chord IV','Chord V']]
];
const aliases={'Bass clef':['bass'],'Second':['2nd'],'Third':['3rd'],'Fourth':['4th'],'Fifth':['5th'],'Sixth':['6th'],'Seventh':['7th'],'Octave':['8th','eighth'],'Triplet':['triplets'],'Phrase mark':['phrasing mark'],'Da capo':['DC','D.C.'],'Compound time':['compound'],'Chord IV':['IV','chord 4'],'Chord VI':['VI','chord 6']};
function save(key,template,items,extra={}){
 if(!C.isHubLibraryTemplate(template)||['labelled-diagram','rank-order'].includes(template))return;
 const id=key.startsWith('reading-')?`hub-h-${key}`:`hub-h-music-literacy-${key}-1`;
 const activity=C.makeActivity({id,title:'Music Literacy',level:'H',template,description:'Practise Higher music literacy: bass clef, chords, scale degrees, intervals, compound time, triplets, rests and articulation.',tags:['Music Literacy','Higher'],options,items:items.map((v,i)=>({id:`${id}-${i+1}`,...v})),...extra});
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
 ['semibreve','minim-rest','crotchet','quaver-rest'],
 ['dotted-minim','minim','crotchet-rest','quaver'],
 ['minim-rest','dotted-crotchet','crotchet','quaver'],
 ['minim','dotted-crotchet-rest','crotchet','semiquaver'],
 ['dotted-crotchet','minim-rest','quaver','quaver-rest'],
 ['minim','crotchet-rest','dotted-quaver','semiquaver'],
 ['dotted-crotchet-rest','crotchet','quaver','quaver-rest'],
 ['crotchet','crotchet-rest','quaver','semiquaver']
];
const scores=[
 {number:1,clef:'bass',time:[4,4],notes:[{pitch:'G2',rhythm:'dotted-minim',x:430},{pitch:'D3',rhythm:'crotchet',x:640,targetNotehead:true}],end:'double'},
 {number:2,clef:'treble',time:[9,8],key:'G major',notes:[{pitch:'G4',rhythm:'dotted-minim',x:430},{pitch:'B4',rhythm:'dotted-crotchet',x:640}],end:'double'},
 {number:3,clef:'treble',time:[3,4],notes:[{pitch:'E4',rhythm:'quaver',x:370,beam:'a',triplet:true},{pitch:'G4',rhythm:'quaver',x:445,beam:'a',triplet:true},{pitch:'A4',rhythm:'quaver',x:520,beam:'a',triplet:true},{pitch:'B4',rhythm:'minim',x:660}],end:'double'},
 {number:4,clef:'treble',time:[4,4],slur:[0,1],notes:[{pitch:'E4',rhythm:'crotchet',x:360},{pitch:'G4',rhythm:'crotchet',x:480},{pitch:'C5',rhythm:'minim',x:650,targetNotehead:true}],end:'double'},
 {number:5,clef:'treble',time:[4,4],notes:[{rest:true,rhythm:'crotchet-rest',x:355},{pitch:'G4',rhythm:'minim',x:490},{rest:true,rhythm:'quaver-rest',x:605},{pitch:'A4',rhythm:'quaver',x:660}],end:'double'}
];
const pitchLetters=['C','D','E','F','G','A','B'];
function pitchStep(pitch,clef){const absolute=Number(pitch.slice(-1))*7+pitchLetters.indexOf(pitch[0]);return absolute-(clef==='bass'?2*7+4:4*7+2);}
function auditScore(spec){
 const total=spec.notes.reduce((sum,n)=>sum+values[n.rhythm]*(n.triplet?2/3:1),0);
 if(Math.abs(total-spec.time[0]*4/spec.time[1])>1e-8)throw Error('Higher bar total '+spec.number);
 for(const n of spec.notes){if(!values[n.rhythm])throw Error('Invalid Higher rhythm');if(!n.rest){const step=pitchStep(n.pitch,spec.clef);if(step< -2||step>10)throw Error('Outside Higher pitch range');}}
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
 body+=number(spec.time[0],267,top+gap)+number(spec.time[1],267,top+gap*3);add('Time signature',267,404);
 if(bass)add('Bass clef',155,top+gap);
 const notes=spec.notes.map(n=>({...n,step:n.rest?4:pitchStep(n.pitch,spec.clef),y:n.rest?top+gap*2:bottom-pitchStep(n.pitch,spec.clef)*gap/2}));
 const groups={};for(const n of notes)if(n.beam)(groups[n.beam]??=[]).push(n);
 for(const group of Object.values(groups)){const down=group.reduce((sum,n)=>sum+n.step,0)/group.length>=4;const beamY=(down?Math.max(...group.map(n=>n.y)):Math.min(...group.map(n=>n.y)))+(down?1:-1)*gap*3.1;for(const n of group){n.down=down;n.beamY=beamY;}}
 for(const n of notes){
  if(n.rest){body+=restBody(n.rhythm,n.x,n.y,gap*config.symbols[restSymbols[n.rhythm]].fontSizeScale);const targetY=n.y+gap*1.8;body+=line(n.x,n.y+gap*.7,n.x,targetY);add(n.rhythm==='crotchet-rest'?'Crotchet rest':'Quaver rest',n.x,targetY);continue;}
  const key=['minim','dotted-minim'].includes(n.rhythm)?'noteheadHalf':'noteheadBlack',size=gap*config.symbols[key].fontSizeScale,down=n.down??n.step>=4,stemX=n.x+(down?-1:1)*(O.symbols[key].advance*size/O.unitsPerEm/2-gap*.06),endY=n.beamY??n.y+(down?1:-1)*gap*3.1;
  n.stemX=stemX;
  if(!n.beam&&n.rhythm==='quaver'){const symbol=O.symbols[down?'eighthNoteStemDown':'eighthNoteStemUp'],scale=size/O.unitsPerEm;body+=`<path d="${symbol.path}" fill="${ink}" transform="translate(${n.x-O.symbols.noteheadBlack.advance*scale/2} ${n.y}) scale(${scale} ${-scale})"/>`;}
  else body+=glyph(key,n.x,n.y,size)+line(stemX,n.y,stemX,endY,gap*config.drawing.stemThicknessScale);
  if(n.rhythm.startsWith('dotted-'))body+=glyph('augmentationDot',n.x+gap*1.1,n.y+(n.step%2===0?-gap/2:0),gap*config.symbols.augmentationDotSpace.fontSizeScale);
  // Pointer ends stay clear of noteheads and articulation marks.
  const targetX=n.articulation?n.x+65:n.x,targetY=n.targetNotehead||n.articulation?n.y:n.y+(down?-1:1)*gap*.95;
  if(!n.targetNotehead)body+=line(n.x+(n.articulation?gap*.45:0),n.y+(n.articulation?0:(down?-1:1)*gap*.3),targetX,targetY);
  const pitchName=n.pitch.slice(0,-1)+(spec.key==='G major'&&n.pitch[0]==='F'?' sharp':'');add(pitchName,targetX,targetY);
  if(!n.triplet){const answer=n.rhythm.charAt(0).toUpperCase()+n.rhythm.slice(1).replaceAll('-',' ');add(answer,stemX,(n.y+endY)/2);pairs.push([pitchName,answer]);}
  if(n.articulation){const y=n.y-48,key=n.articulation==='accent'?'accentAbove':'staccatoAbove';body+=glyph(key,n.x,y,gap*1.6);add(n.articulation==='accent'?'Accent':'Staccato',n.x,y);}
 }
 for(const group of Object.values(groups)){const first=group[0],last=group.at(-1);body+=line(first.stemX,first.beamY,last.stemX,last.beamY,gap*config.drawing.beamThicknessScale);
  if(first.triplet){const x=(first.stemX+last.stemX)/2,y=first.beamY+(first.down?48:-26);body+=`<text x="${x}" y="${y}" font-family="Georgia,serif" font-size="35" font-style="italic" text-anchor="middle" fill="${ink}">3</text>`+line(x+20,y-10,x+65,y-10);add('Quaver triplet',x+65,y-10);}
 }
 if(spec.slur){const [a,b]=spec.slur.map(i=>notes[i]),y=245;body+=`<path d="M${a.x} ${y+35}Q${(a.x+b.x)/2} ${y-15} ${b.x} ${y+35}" fill="none" stroke="${ink}" stroke-width="3"/>`+line((a.x+b.x)/2,y+10,(a.x+b.x)/2,y-35);add('Slur',(a.x+b.x)/2,y-35);}
 if(spec.key){body+=glyph('sharp',215,top,gap*3.2)+line(215,top-32,215,top-65);add('Key signature',215,top-65);}
 body+=line(728,top,728,bottom,2.3)+line(740,top,740,bottom,6.3);add('Double bar line',740,404);
 const id=`hub-h-reading-music-label-${spec.number}`;
 const a=save(`reading-music-label-${spec.number}`,'labelled-diagram',targets,{title:spec.number===1?'Reading Music':`Reading Music ${spec.number}`,description:'Identify Higher notation in a short, complete bar of music.',instructions:'Place each label at its target. Pointers show the relevant note or marking. Select Submit when ready.',diagram:await image(svg(body),`Higher Reading Music ${spec.number}`,`reading-music-${spec.number}`),options:{...options,shuffle:false}});
 for(const [pitch,rhythm]of pairs){const p=a.items.find(n=>n.answer===pitch),r=a.items.find(n=>n.answer===rhythm);if(p&&r){p.acceptedTargetIds=[...(p.acceptedTargetIds||[]),r.id];r.acceptedTargetIds=[...(r.acceptedTargetIds||[]),p.id];}}
 fs.writeFileSync(path.join(ROOT,'music-games/activities',id+'.json'),JSON.stringify(a,null,2)+'\n');
}
const puzzleOmissions=["Third", "Fourth", "Sixth", "Seventh", "Chord VI"];
async function main(){
 fs.mkdirSync(folder,{recursive:true});
 for(const [key,template]of [['crossword','crossword'],['wordsearch','wordsearch'],['true-or-false','true-or-false']])save(key,template,(['crossword','wordsearch'].includes(template)?terms.filter(([answer])=>!puzzleOmissions.includes(answer)).slice(0,C.LIMITS[template+'Items']):terms).map(([answer,prompt,distractors])=>({answer,prompt,distractors:['quiz','true-or-false'].includes(template)?distractors:[],...(template==='type-the-answer'?{correctAnswers:[answer,...(aliases[answer]||[])]}:{})})));
 save('blank','complete-the-sentence',[
  cloze('The two dots of the bass clef surround the [[F]] line.',['G','A','B']),
  cloze('The first note of a scale is the [[tonic]].',['subdominant','dominant','octave']),
  cloze('The fourth note is the [[subdominant]]; the fifth is the [[dominant]].',['tonic','octave']),
  cloze('In C major, the tonic is [[C]] and the dominant is [[G]].',['F','A']),
  cloze('Chord I in A minor is [[A minor]].',['C major','G major','F major']),
  cloze('Chord IV in C major is [[F major]].',['C major','G major','A minor']),
  cloze('Chord V in C major is [[G major]].',['C major','A minor','F major']),
  cloze('Chord VI in C major is [[A minor]].',['C major','G major','F major']),
  cloze('From C up to E is a [[third]].',['second','fourth','fifth']),
  cloze('From C up to the next C is an [[octave]].',['fifth','sixth','seventh']),
  cloze('Three triplet quavers last as long as [[two]] ordinary quavers.',['three','four','six']),
  cloze('A slur tells you to play notes [[smoothly connected]].',['short and detached','with extra emphasis','more loudly']),
  cloze('Dots above or below notes mean [[staccato]].',['slur','accent','phrase mark']),
  cloze('D.C. means [[da capo]]: return to the beginning.',['crescendo','diminuendo','staccato']),
  cloze('A dotted crotchet rest lasts [[one and a half]] beats.',['half','one','two']),
  cloze('A quaver rest lasts [[half]] a beat.',['one','two','four']),
  cloze('A minim rest lasts [[two]] beats.',['one','three','four']),
  cloze('Chord V in G major is [[D major]].',['G major','C major','F major']),
  cloze('Chord VI in F major is [[D minor]].',['F major','G major','A minor']),
  cloze('Chord V in A minor is [[E major]].',['A minor','C major','F major'])
 ],{instructions:'Place the missing words into the blanks, then select Submit.'});
 const groups={'Note values':['Dotted crotchet','Dotted minim','Quaver','Minim'],'Chords':['C major','G major','F major','A minor'],'Articulation and phrasing':['Accent','Slur','Staccato','Phrase mark'],'Rests':['Quaver rest','Crotchet rest','Minim rest','Semibreve rest']};
 save('connections','matching-pairs',Object.entries(groups).flatMap(([group,names])=>names.map(answer=>({answer,prompt:answer,group}))),{instructions:'Select four related cards, then select Submit. Find all four groups.'});
 const rank=[];
 for(const [i,row]of combinations.entries()){
  const shapes=row.map((r,n)=>`<g transform="translate(${n*120} 0)">${r.endsWith('-rest')?restBody(r):fs.readFileSync(path.join(ROOT,'music-games/assets/rhythm-order',r+'.svg'),'utf8').replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'')}</g>`).join('');
  const name=row.map(r=>r.replaceAll('-',' ')).join(' + ');rank.push({prompt:'',answer:name,media:await image(svg(shapes,480,90),name,`combination-${i+1}`)});
 }
 save('order','rank-order',rank,{title:'Rhythm Lengths',instructions:'Add the beats in each row. Arrange the combinations from longest total length to shortest, then select Submit.',tags:['Music Literacy','Higher','Rhythm combinations']});
 const sort=[];async function add(name,group,body,file){const media=file?{type:'image',src:'data:image/png;base64,'+fs.readFileSync(file).toString('base64'),name}:await image(svg(body,120,90),name,'sort-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-'));sort.push({prompt:'',answer:name,group,media});}
 for(const [name,key]of [['Pianissimo','pianissimo'],['Mezzo piano','mezzoPiano'],['Mezzo forte','mezzoForte'],['Fortissimo','fortissimo'],['Sforzando','sforzato']])await add(name,'Dynamics',glyph(key,60,60,85));
 for(const [name,points]of [['Crescendo','M105 29L15 45L105 61'],['Diminuendo','M15 29L105 45L15 61']])await add(name,'Dynamics',`<path d="${points}" fill="none" stroke="${ink}" stroke-width="3"/>`);
 for(const name of Object.keys(values).filter(name=>!name.endsWith('-rest')))await add(name.replaceAll('-',' '),'Rhythms',null,path.join(ROOT,'music-games/assets/rhythm-order',name+'.png'));
 for(const n of [6,9,12]){const numerator=String(n).split('').map((v,i)=>glyph('timeSig'+v,60+(i-(String(n).length-1)/2)*22,29,50)).join('');await add(n+'/8','Time signatures',numerator+glyph('timeSig8',60,61,50));}
 for(const name of ['quaver-rest','crotchet-rest','dotted-crotchet-rest','minim-rest'])await add(name.replaceAll('-',' '),'Rests',restBody(name));
 for(const [name,key]of [['Semibreve rest','wholeRest'],['Whole-bar rest','wholeRest']])await add(name,'Rests',line(30,35,90,35,1.5)+glyph(key,60,35,45));
 await add('Accent','Articulation and phrasing',glyph('accentAbove',60,50,70));
 await add('Staccato','Articulation and phrasing',glyph('staccatoAbove',60,45,70));
 await add('Slur','Articulation and phrasing','<path d="M32 58Q60 15 88 58" fill="none" stroke="#142a3d" stroke-width="3"/>');
 await add('Phrase mark','Articulation and phrasing','<path d="M10 58Q60 5 110 58" fill="none" stroke="#142a3d" stroke-width="3"/>');
 for(const [name,text]of [['Da capo','D.C.'],['First time bar','1.'],['Second time bar','2.']])await add(name,'Repeat directions',`<text x="60" y="58" text-anchor="middle" font-family="Georgia,serif" font-size="35" fill="${ink}">${text}</text>`+(name==='Da capo'?'':`<path d="M15 65V20H105" fill="none" stroke="${ink}" stroke-width="2"/>`));
 for(const name of ['Tonic','Subdominant','Dominant'])sort.push({prompt:name,answer:name,group:'Scale degrees'});
 for(const [name,steps]of [['C major',[0,2,4]],['G major',[4,6,8]],['F major',[3,5,7]],['A minor',[5,7,9]]]){
  let notation=[25,35,45,55,65].map(y=>line(10,y,110,y,1)).join('')+glyph('gClef',25,55,30);
  // Treble bottom E4: C4 is step -2. All chords are in root position.
  for(const step of steps){const y=65-(step-2)*5;notation+=glyph('noteheadBlack',78,y,36);if(step===0)notation+=line(68,75,88,75,1);}
  const down=steps[1]-2>=4,ys=steps.map(step=>65-(step-2)*5);notation+=line(down?73:83,down?Math.min(...ys):Math.max(...ys),down?73:83,down?Math.max(...ys)+28:Math.min(...ys)-28,1.3);
  await add(name,'Chords',notation);
 }
 save('sort','group-sort',sort,{instructions:'Drag each card into its group, or select a card then a group. Select Submit when ready.'});
 fs.writeFileSync(path.join(folder,'scores.json'),JSON.stringify(scores,null,2)+'\n');// Literacy Label activities are retired.
 console.log('Created 15 Higher Music Literacy activities across all eleven game types.');
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={terms,scores,combinations,values,auditScore,pitchStep};
