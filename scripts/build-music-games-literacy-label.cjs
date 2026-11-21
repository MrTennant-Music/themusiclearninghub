/* Original teaching score. Inventory: E4 crotchet (1) + G4 minim (2),
   treble clef, no key signature, 3/4, single closing bar line. Total: 3 beats.
   E4 is the bottom line; G4 is the second line from the bottom.
   Bravura outlines, staff proportions and stem length follow Practice Questions. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
const score=require('../music-games/assets/music-literacy/n3-reading-music.score.json');
const shared={window:{}};
for(const file of ['shared/shared-notation-config.js','bravura-worksheet-outlines.js'])vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),'utf8'),shared);
const config=shared.window.SHARED_NOTATION_CONFIG,outlines=shared.window.BRAVURA_WORKSHEET_OUTLINES;
const gap=config.stave.lineGap*score.stave.scale,bottom=score.stave.top+gap*4,ink='#142a3d';
function glyph(key,x,y,settingsKey=key){
 const symbol=outlines.symbols[key],settings=config.symbols[settingsKey];
 const size=gap*settings.fontSizeScale,scale=size/outlines.unitsPerEm;
 return `<path data-symbol="${key}" d="${symbol.path}" fill="${ink}" transform="translate(${x-symbol.advance*scale/2} ${y}) scale(${scale} ${-scale})"/>`;
}
function build(){
 const staff=Array.from({length:5},(_,i)=>`<line x1="${score.stave.left}" x2="${score.stave.right}" y1="${score.stave.top+i*gap}" y2="${score.stave.top+i*gap}"/>`).join('');
 const notes=score.bars[0].notes.map(n=>{
  const y=bottom-n.diatonicStepsAboveE4*gap/2,key=n.rhythm==='minim'?'noteheadHalf':'noteheadBlack';
  const scale=gap*config.symbols[key].fontSizeScale/outlines.unitsPerEm;
  const stemWidth=gap*config.drawing.stemThicknessScale;
  const stemX=n.x+outlines.symbols[key].advance*scale/2-stemWidth/2;
  return {...n,y,stemX,stemY:y-gap*3.1,stemMidY:y-gap*1.8,key,stemWidth};
 });
 const symbols=glyph('gClef',score.clefX,bottom-gap)+glyph('timeSig3',score.timeSignatureX,score.stave.top+gap,'timeSig34')+glyph('timeSig4',score.timeSignatureX,score.stave.top+gap*3,'timeSig34')+notes.map(n=>glyph(n.key,n.x,n.y)+`<line data-stem="${n.pitch}" x1="${n.stemX}" x2="${n.stemX}" y1="${n.y-.5}" y2="${n.stemY}" stroke="${ink}" stroke-width="${n.stemWidth}"/>`).join('');
 const notePointers=notes.map(n=>`<line x1="${n.x}" x2="${n.x}" y1="${n.y+gap*.4}" y2="${n.y+gap*1.5}" stroke="${ink}" stroke-width="1.5"/>`).join('');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-labelledby="title desc"><title id="title">Reading Music</title><desc id="desc">One bar in treble clef and 3/4 time: E crotchet followed by G minim.</desc><g stroke="${ink}" stroke-width="${gap*.055}">${staff}<line x1="${score.stave.right}" x2="${score.stave.right}" y1="${score.stave.top}" y2="${bottom}" stroke-width="${gap*.09}"/></g>${symbols}${notePointers}</svg>\n`;
 const targets=[
  ['Treble clef',score.clefX,bottom-gap],
  ['Time signature',score.timeSignatureX,score.stave.top+gap*2],['Bar line',score.stave.right,score.stave.top+gap*2],
  ['E',notes[0].x,notes[0].y+gap*1.5],['G',notes[1].x,notes[1].y+gap*1.5],
  ['Crotchet',notes[0].stemX,notes[0].stemMidY],['Minim',notes[1].stemX,notes[1].stemMidY]
 ];
 return {svg,targets};
}
// Source inventories remain available; these literacy Label activities are retired.
async function write(){return [];}
if(require.main===module)write().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={score,build};
