/* Original National 4 content, using the Hub's supplied Bravura outlines and
   notation geometry. Beat values below assume a beat. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),C=require('../music-games/core.js');
const folder=path.join(ROOT,'music-games/assets/music-literacy/n4');
const context={window:{}};
for(const file of ['shared/shared-notation-config.js','bravura-worksheet-outlines.js'])vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),'utf8'),context);
const O=context.window.BRAVURA_WORKSHEET_OUTLINES,config=context.window.SHARED_NOTATION_CONFIG;
const options={shuffle:true,timer:0,sound:true,theme:'blue'};
const terms=[
 ['Quaver','A note worth half a beat.',['Semiquaver','Crotchet','Minim']],
 ['Semiquaver','A note worth a quarter of a beat.',['Quaver','Minim','Semibreve']],
 ['Mezzo piano','The Italian term meaning moderately quiet.',['Mezzo forte','Piano','Forte']],
 ['Mezzo forte','The Italian term meaning moderately loud.',['Mezzo piano','Forte','Piano']],
 ['Andante','The Italian tempo term meaning at a walking pace.',['Adagio','Allegro','Crescendo']],
 ['Repeat sign','A sign telling the performer to play a section again.',['Double bar line','Treble clef','Time signature']],
 ['Treble clef','The clef whose four spaces, from bottom to top, spell FACE.',['Time signature','Repeat sign','Double bar line']],
 ['Time signature','The numbers at the start showing the beats in each bar and the note value of each beat.',['Treble clef','Double bar line','Repeat sign']],
 ['Double bar line','The pair of lines marking the end of a piece of music.',['Repeat sign','Time signature','Treble clef']],
 ['Crescendo','The Italian term meaning gradually becoming louder.',['Diminuendo','Mezzo forte','Allegro']],
 ['Diminuendo','The Italian term meaning gradually becoming quieter.',['Crescendo','Mezzo piano','Adagio']],
 ['Sequence','A musical pattern repeated at a higher or lower pitch.',['Repetition','Unison','Chord']]
];
const aliases={'Mezzo piano':['mezzo-piano','mezzopiano'],'Mezzo forte':['mezzo-forte','mezzoforte'],'Repeat sign':['repeat'],'Double bar line':['double barline'],'Treble clef':['treble']};
function save(key,template,items,extra={}){
 if(!C.isHubLibraryTemplate(template)||['labelled-diagram','rank-order'].includes(template))return;
 const id=key.startsWith('reading-')?`hub-n4-${key}`:`hub-n4-music-literacy-${key}-1`;
 const activity=C.makeActivity({id,title:'Music Literacy',level:'N4',template,description:'Practise National 4 music literacy: note values, dynamics, tempo and notation.',tags:['Music Literacy','National 4'],options,items:items.map((v,i)=>({id:`${id}-${i+1}`,...v})),...extra});
 const errors=C.validateActivity(activity);if(errors.length)throw Error(id+': '+JSON.stringify(errors));
 fs.writeFileSync(path.join(ROOT,'music-games/activities',id+'.json'),JSON.stringify(activity,null,2)+'\n');return activity;
}
function cloze(marked,distractors){let clozeText='',clozeGaps=[],last=0;for(const m of marked.matchAll(/\[\[(.*?)\]\]/g)){clozeText+=marked.slice(last,m.index);const start=clozeText.length;clozeText+=m[1];clozeGaps.push({start,end:clozeText.length,text:m[1]});last=m.index+m[0].length;}clozeText+=marked.slice(last);return {clozeText,clozeGaps,answer:clozeGaps[0].text,distractors};}
const ink='#142a3d';
function line(x1,y1,x2,y2,w=2){return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ink}" stroke-width="${w}"/>`;}
function glyph(key,x,y,size){const g=O.symbols[key],s=size/O.unitsPerEm;return `<path d="${g.path}" fill="${ink}" transform="translate(${x-g.advance*s/2} ${y}) scale(${s} ${-s})"/>`;}
function svg(body,width=800,height=800){return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;}
async function image(body,name,file){const sharp=require('sharp');fs.writeFileSync(path.join(folder,file+'.svg'),body);return {type:'image',src:'data:image/png;base64,'+(await sharp(Buffer.from(body)).resize(1600).png().toBuffer()).toString('base64'),name};}
const values={semibreve:4,'dotted-minim':3,minim:2,crotchet:1,quaver:.5,semiquaver:.25};
const combinations=[['semibreve','quaver','semiquaver','semiquaver'],['dotted-minim','quaver','semiquaver','semiquaver'],['minim','crotchet','quaver','semiquaver'],['minim','quaver','quaver','quaver'],['minim','quaver','quaver','semiquaver'],['minim','quaver','semiquaver','semiquaver'],['crotchet','crotchet','quaver','semiquaver'],['crotchet','quaver','quaver','quaver']];
const scores=[
 {number:1,time:2,tempo:'Andante',dynamic:'mezzoPiano',meaning:['At a walking pace','Moderately quiet'],notes:[['G4','minim',500]],end:'double'},
 {number:2,time:3,tempo:'Adagio',dynamic:'mezzoForte',meaning:['Slow','Moderately loud'],notes:[['A4','crotchet',430],['C5','minim',620]],end:'double'},
 {number:3,time:2,notes:[['E4','quaver',400,'a'],['G4','quaver',480,'a'],['B4','crotchet',630]],end:'repeat'},
 {number:4,time:2,notes:[['G4','semiquaver',370,'a'],['A4','semiquaver',430,'a'],['B4','semiquaver',490,'a'],['A4','semiquaver',550,'a'],['C5','crotchet',660]],end:'repeat'},
 {number:5,time:3,startRepeat:true,notes:[['D5','minim',440],['E5','quaver',570,'a'],['D5','quaver',650,'a']],end:'repeat'}
];
function auditScore(spec){const total=spec.notes.reduce((sum,n)=>sum+values[n[1]],0);if(total!==spec.time)throw Error('N4 bar total '+spec.number);for(const [pitch,rhythm] of spec.notes)if(!['E4','F4','G4','A4','B4','C5','D5','E5','F5'].includes(pitch)||!values[rhythm])throw Error('Invalid N4 notation inventory');}
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
  const key=n.rhythm==='minim'?'noteheadHalf':'noteheadBlack',size=gap*config.symbols[key].fontSizeScale,down=n.down??pitches.indexOf(n.pitch)>=4,stemX=n.x+(down?-1:1)*(O.symbols[key].advance*size/O.unitsPerEm/2-gap*.06),endY=n.beamY??n.y+(down?1:-1)*gap*3.1;
  n.stemX=stemX;body+=glyph(key,n.x,n.y,size)+line(stemX,n.y,stemX,endY,gap*config.drawing.stemThicknessScale);
  // Offset note-name target with a leader so the target cannot hide the head.
  const targetY=n.y+(down?-1:1)*gap*.95;body+=line(n.x,n.y+(down?-1:1)*gap*.3,n.x,targetY);
  if(!targets.some(t=>t.answer===n.pitch.slice(0,-1)))add(n.pitch.slice(0,-1),n.x,targetY);
  if(!n.beam){const answer=n.rhythm==='minim'?'Minim':'Crotchet';add(answer,stemX,(n.y+endY)/2);pairs.push([n.pitch.slice(0,-1),answer]);}
 }
 for(const group of Object.values(groups)){const first=group[0],last=group.at(-1),thickness=gap*config.drawing.beamThicknessScale;
  body+=line(first.stemX,first.beamY,last.stemX,last.beamY,thickness);
  if(first.rhythm==='semiquaver')body+=line(first.stemX,first.beamY+(first.down?-1:1)*gap*.75,last.stemX,last.beamY+(first.down?-1:1)*gap*.75,thickness);
  add(first.rhythm==='semiquaver'?'Semiquavers':'Quavers',(first.stemX+last.stemX)/2,first.beamY);
 }
 function repeat(key,x){const g=O.symbols[key],s=(bottom-top)/1000;return `<path d="${g.path}" fill="${ink}" transform="translate(${x} ${bottom}) scale(${s} ${-s})"/>`;}
 if(spec.end==='repeat'){body+=repeat('repeatRight',740-O.symbols.repeatRight.advance*(bottom-top)/1000);add(spec.startRepeat?'End repeat':'Repeat sign',735,404);}
 else{body+=line(728,top,728,bottom,2.3)+line(740,top,740,bottom,6.3);add('Double bar line',740,404);}
 if(spec.startRepeat){body+=repeat('repeatLeft',312);add('Start repeat',320,404);}
 if(spec.tempo){body+=`<text x="350" y="220" fill="${ink}" font-family="Georgia,serif" font-size="34" font-weight="600">${spec.tempo}</text>`+line(510,208,560,208);add(spec.meaning[0],560,208);}
 if(spec.dynamic){body+=glyph(spec.dynamic,450,640,gap*3.4)+line(500,625,550,625);add(spec.meaning[1],550,625);}
 const id=`hub-n4-reading-music-label-${spec.number}`;
 const a=save(`reading-music-label-${spec.number}`,'labelled-diagram',targets,{title:spec.number===1?'Reading Music':`Reading Music ${spec.number}`,description:'Identify notes, rhythms and musical signs in an N4 score.',instructions:'Place each label at its target. Pointers show note names; stems and beams show rhythms. Select Submit when ready.',diagram:await image(svg(body),`N4 Reading Music ${spec.number}`,`reading-music-${spec.number}`),options:{...options,shuffle:false}});
 for(const [pitch,rhythm]of pairs){const p=a.items.find(n=>n.answer===pitch),r=a.items.find(n=>n.answer===rhythm);if(p&&r){p.acceptedTargetIds=[...(p.acceptedTargetIds||[]),r.id];r.acceptedTargetIds=[...(r.acceptedTargetIds||[]),p.id];}}
 fs.writeFileSync(path.join(ROOT,'music-games/activities',id+'.json'),JSON.stringify(a,null,2)+'\n');
}
const puzzleOmissions=[];
async function main(){
 fs.mkdirSync(folder,{recursive:true});
 for(const [key,template]of [['crossword','crossword'],['wordsearch','wordsearch'],['true-or-false','true-or-false']])save(key,template,(['crossword','wordsearch'].includes(template)?terms.filter(([answer])=>!puzzleOmissions.includes(answer)).slice(0,C.LIMITS[template+'Items']):terms).map(([answer,prompt,distractors])=>({answer,prompt,distractors:['quiz','true-or-false'].includes(template)?distractors:[],...(template==='type-the-answer'?{correctAnswers:[answer,...(aliases[answer]||[])]}:{})})));
 save('blank','complete-the-sentence',[
  cloze('A quaver lasts [[half]] a beat.',['quarter','one','two']),
  cloze('Four [[semiquavers]] last as long as one [[crotchet]].',['minims','semibreve']),
  cloze('[[Andante]] means at a walking pace.',['Adagio','Allegro','Forte']),
  cloze('The marking mp means [[moderately quiet]].',['moderately loud','quiet','loud']),
  cloze('[[Mezzo forte]], meaning moderately loud, is written [[mf]].',['Mezzo piano','mp']),
  cloze('A [[repeat sign]] tells you to play a section again.',['treble clef','double bar line','time signature']),
  cloze('The [[time signature]] shows how beats are grouped in each bar.',['treble clef','repeat sign','double bar line']),
  cloze('A [[crescendo]] gets louder; a [[diminuendo]] gets quieter.',['quaver','crotchet']),
  cloze('Two [[quavers]] last as long as one [[crotchet]].',['semiquavers','semibreve']),
  cloze('In 3/4 time, a full bar can contain [[six]] quavers.',['three','four','eight']),
  cloze('[[Eight]] semiquavers last as long as one [[minim]].',['Six','crotchet']),
  cloze('A musical pattern repeated at a higher or lower pitch is a [[sequence]].',['repetition','chord','unison'])
 ],{instructions:'Place the missing words into the blanks, then select Submit.'});
 const groups={'Note values':['Minim','Crotchet','Quaver','Semiquaver'],'Dynamic markings':['Piano','Mezzo piano','Mezzo forte','Forte'],'Treble clef space notes':['F','A','C','E'],'Bar markings':['Bar line','Double bar line','Start repeat','End repeat']};
 save('connections','matching-pairs',Object.entries(groups).flatMap(([group,names])=>names.map(answer=>({answer,prompt:answer,group}))),{instructions:'Select four related cards, then select Submit. Find all four groups.'});
 const rank=[];
 for(const [i,row]of combinations.entries()){
  const shapes=row.map((r,n)=>`<g transform="translate(${n*120} 0)">${fs.readFileSync(path.join(ROOT,'music-games/assets/rhythm-order',r+'.svg'),'utf8').replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'')}</g>`).join('');
  const name=row.map(r=>r.replaceAll('-',' ')).join(' + ');rank.push({prompt:'',answer:name,media:await image(svg(shapes,480,90),name,`combination-${i+1}`)});
 }
 save('order','rank-order',rank,{title:'Rhythm Lengths',instructions:'Add the beats in each row. Arrange the combinations from longest total length to shortest, then select Submit.',tags:['Music Literacy','National 4','Rhythm combinations']});
 const sort=[];async function add(name,group,body,file){const media=file?{type:'image',src:'data:image/png;base64,'+fs.readFileSync(file).toString('base64'),name}:await image(svg(body,120,90),name,'sort-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-'));sort.push({prompt:'',answer:name,group,media});}
 for(const [name,key]of [['Piano','piano'],['Mezzo piano','mezzoPiano'],['Mezzo forte','mezzoForte'],['Forte','forte']])await add(name,'Dynamics',glyph(key,60,60,85));
 for(const [name,points]of [['Crescendo','M105 29L15 45L105 61'],['Diminuendo','M15 29L105 45L15 61']])await add(name,'Dynamics',`<path d="${points}" fill="none" stroke="${ink}" stroke-width="3"/>`);
 for(const name of Object.keys(values))await add(name.replaceAll('-',' '),'Rhythms',null,path.join(ROOT,'music-games/assets/rhythm-order',name+'.png'));
 for(const n of [2,3,4])await add(n+'/4','Time signatures',glyph('timeSig'+n,60,29,60)+glyph('timeSig4',60,61,60));
 await add('Stave','Notation',[25,35,45,55,65].map(y=>line(15,y,105,y)).join(''));
 await add('Bar line','Notation',line(60,12,60,78,3));await add('Double bar line','Notation',line(53,12,53,78,2)+line(64,12,64,78,6));await add('Treble clef','Notation',glyph('gClef',60,53,43));
 for(const [name,key]of [['Start repeat','repeatLeft'],['End repeat','repeatRight']])await add(name,'Notation',glyph(key,60,78,66));
 for(const name of ['Adagio','Andante','Allegro'])await add(name,'Tempo',null,path.join(ROOT,'music-dictionary/concept-photos',name.toLowerCase()+'-diagram.png'));
 save('sort','group-sort',sort,{instructions:'Drag each card into its group, or select a card then a group. Select Submit when ready.'});
 fs.writeFileSync(path.join(folder,'scores.json'),JSON.stringify(scores,null,2)+'\n');// Literacy Label activities are retired.
 console.log('Created 15 N4 Music Literacy activities across all eleven game types.');
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={terms,scores,combinations,values,auditScore};
