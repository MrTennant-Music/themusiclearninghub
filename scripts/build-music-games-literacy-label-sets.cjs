/* Approved original N3 scores. No source-paper transcription is involved.
   Treble pitch map: E4=bottom line, F4=space, G4=line, A4=space,
   B4=middle line, C5=space, D5=line, E5=space.
   Inventory and exact bar totals are checked before rendering. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),sets=require('../music-games/assets/music-literacy/n3-reading-music-sets.score.json');
const shared={window:{}};
for(const file of ['shared/shared-notation-config.js','bravura-worksheet-outlines.js'])vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),'utf8'),shared);
const config=shared.window.SHARED_NOTATION_CONFIG,outlines=shared.window.BRAVURA_WORKSHEET_OUTLINES;
const gap=config.stave.lineGap*3,top=320,bottom=top+gap*4,ink='#142a3d';
const pitchSteps={E4:0,F4:1,G4:2,A4:3,B4:4,C5:5,D5:6,E5:7};
const beats={crotchet:1,minim:2,dottedMinim:3,semibreve:4};
function audit(spec){
 for(const bar of spec.bars){
  if(bar.notes.reduce((n,v)=>n+beats[v.rhythm],0)!==spec.timeSignature[0])throw Error('Incorrect bar total in Reading Music '+spec.number);
  for(const note of bar.notes)if(!(note.pitch in pitchSteps)||pitchSteps[note.pitch]<0||pitchSteps[note.pitch]>8||beats[note.rhythm]!==note.beats)throw Error('Invalid note inventory');
 }
}
function line(x1,y1,x2,y2,width=1.5,extra=''){return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ink}" stroke-width="${width}" ${extra}/>`;}
function glyph(key,x,y,settingsKey=key){
 const symbol=outlines.symbols[key],settings=config.symbols[settingsKey],scale=gap*settings.fontSizeScale/outlines.unitsPerEm;
 return `<path data-symbol="${key}" d="${symbol.path}" fill="${ink}" transform="translate(${x-symbol.advance*scale/2} ${y}) scale(${scale} ${-scale})"/>`;
}
function bracket(x1,x2,y){return `<path d="M${x1} ${y+12}V${y}H${x2}V${y+12}" fill="none" stroke="${ink}" stroke-width="2"/>`;}
function build(spec){
 audit(spec);
 let parts=Array.from({length:5},(_,i)=>line(100,top+i*gap,740,top+i*gap,gap*.055));
 parts.push(glyph('gClef',155,bottom-gap),glyph('timeSig'+spec.timeSignature[0],267,top+gap,'timeSig34'),glyph('timeSig4',267,top+gap*3,'timeSig34'));
 const notes=[];
 for(const [barIndex,bar]of spec.bars.entries()){
  for(const n of bar.notes){
   const step=pitchSteps[n.pitch],y=bottom-step*gap/2,key=n.rhythm==='semibreve'?'wholeNote':['minim','dottedMinim'].includes(n.rhythm)?'noteheadHalf':'noteheadBlack';
   const scale=gap*config.symbols[key].fontSizeScale/outlines.unitsPerEm,stemWidth=gap*config.drawing.stemThicknessScale;
   const down=step>=4,stemX=n.x+(down?-1:1)*(outlines.symbols[key].advance*scale/2-stemWidth/2);
   parts.push(glyph(key,n.x,y));
   if(n.rhythm!=='semibreve')parts.push(line(stemX,y+(down?.5:-.5),stemX,y+(down?1:-1)*gap*3.1,stemWidth));
   if(n.rhythm==='dottedMinim')parts.push(glyph('augmentationDot',n.x+gap*1.1,y,'augmentationDotSpace'));
   notes.push({...n,y,stemX,barIndex});
  }
  if(bar.barline==='double')parts.push(line(bar.end-12,top,bar.end-12,bottom,gap*.055),line(bar.end,top,bar.end,bottom,gap*.15));
  else parts.push(line(bar.end,top,bar.end,bottom,gap*.09));
 }
 if(spec.tempo){parts.push(`<text x="350" y="230" font-family="Georgia,serif" font-size="34" font-weight="600">${spec.tempo}</text>`,line(495,215,550,215));}
 if(spec.dynamic){const x=spec.number===2?450:380;parts.push(glyph(spec.dynamic,x,620));parts.push(spec.number===2?line(475,605,530,610):line(365,625,330,640));}
 if(spec.number===2){parts.push(line(540,397,540,446),line(566,383,625,383));}
 if(spec.number===3){parts.push(line(420,442,420,488),line(590,484,590,530));}
 if(spec.number===4){parts.push(line(395,390,350,335));}
 if(spec.number===5){parts.push(...notes.map(n=>line(n.x,n.y-gap*.4,n.x,n.y-gap*1.5)));}
 if(spec.movement){
  const descending=spec.movement==='descending',y1=descending?120:215,y2=descending?170:165;
  parts.push(line(420,y1,590,y2,2,'marker-end="url(#movement-arrow)"'),bracket(400,610,spec.number===3?680:665));
 }
 if(spec.hairpins){
  parts.push(`<path data-hairpin="crescendo" d="M485 576L340 590L485 604" fill="none" stroke="${ink}" stroke-width="2.5"/>`,line(410,605,410,640));
  parts.push(`<path data-hairpin="diminuendo" d="M565 576L710 590L565 604" fill="none" stroke="${ink}" stroke-width="2.5"/>`,line(640,605,640,640));
 }
 if(spec.repetition)parts.push(bracket(375,665,200));
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><title>Reading Music ${spec.number}</title><defs><marker id="movement-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L8 4L0 8Z" fill="${ink}"/></marker></defs><g fill="${ink}">${parts.join('')}</g></svg>\n`;
 return {svg,notes,targets:spec.labels};
}
// Source inventories remain available; these literacy Label activities are retired.
async function write(){return [];}
if(require.main===module)write().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={sets,build,audit};
