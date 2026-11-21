/* N3 visual Sort: reuse the existing Bravura rhythm images and vector glyphs. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),shared={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(ROOT,'bravura-worksheet-outlines.js'),'utf8'),shared);
const outlines=shared.window.BRAVURA_WORKSHEET_OUTLINES,ink='#142536';
function glyph(name,x,y,size){const g=outlines.symbols[name],s=size/outlines.unitsPerEm;return `<path d="${g.path}" fill="${ink}" transform="translate(${x-g.advance*s/2} ${y}) scale(${s} ${-s})"/>`;}
function card(body){return `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="180" viewBox="0 0 120 90">${body}</svg>`;}
function line(x1,y1,x2,y2,w=2){return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ink}" stroke-width="${w}"/>`;}
async function write(){
 const sharp=require('sharp'),C=require('../music-games/core.js'),id='hub-n3-music-literacy-sort-1',items=[];
 const folder=path.join(ROOT,'music-games/assets/music-literacy/sort');fs.mkdirSync(folder,{recursive:true});
 async function add(name,group,svg,file){
  let image;
  if(file)image=fs.readFileSync(path.join(ROOT,'music-games/assets/rhythm-order',file+'.png'));
  else{fs.writeFileSync(path.join(folder,name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.svg'),svg);image=await sharp(Buffer.from(svg)).resize(480,360).png().toBuffer();}
  items.push({id:`${id}-${items.length+1}`,prompt:'',answer:name,group,media:{type:'image',src:'data:image/png;base64,'+image.toString('base64'),name}});
 }
 await add('Piano','Dynamics',card(glyph('piano',60,62,110)));
 await add('Forte','Dynamics',card(glyph('forte',63,64,110)));
 await add('Crescendo','Dynamics',card(`<path d="M105 29L15 45L105 61" fill="none" stroke="${ink}" stroke-width="3"/>`));
 await add('Diminuendo','Dynamics',card(`<path d="M15 29L105 45L15 61" fill="none" stroke="${ink}" stroke-width="3"/>`));
 for(const [name,file]of [['Semibreve','semibreve'],['Dotted minim','dotted-minim'],['Minim','minim'],['Crotchet','crotchet']])await add(name,'Rhythms',null,file);
 for(const beats of [2,3,4])await add(beats+'/4','Time signatures',card(glyph('timeSig'+beats,60,29,60)+glyph('timeSig4',60,61,60)));
 await add('Stave','Notation',card([25,35,45,55,65].map(y=>line(15,y,105,y)).join('')));
 await add('Bar line','Notation',card(line(60,12,60,78,3)));
 await add('Double bar line','Notation',card(line(53,12,53,78,2)+line(64,12,64,78,6)));
 await add('Treble clef','Notation',card(glyph('gClef',60,53,43)));
 for(const name of ['Adagio','Allegro']){
  const image=fs.readFileSync(path.join(ROOT,'music-dictionary/concept-photos',name.toLowerCase()+'-diagram.png'));
  items.push({id:`${id}-${items.length+1}`,prompt:'',answer:name,group:'Tempo',media:{type:'image',src:'data:image/png;base64,'+image.toString('base64'),name}});
 }
 const activity=C.makeActivity({id,title:'Music Literacy',level:'N3',template:'group-sort',description:'Sort seventeen notation cards into Dynamics, Rhythms, Time signatures, Notation and Tempo.',tags:['Music Literacy','National 3'],items,options:{shuffle:true,timer:0,sound:true,theme:'blue'}});
 const errors=C.validateActivity(activity);if(errors.length)throw Error(JSON.stringify(errors));
 fs.writeFileSync(path.join(ROOT,'music-games/activities',id+'.json'),JSON.stringify(activity,null,2)+'\n');
}
if(require.main===module)write().catch(e=>{console.error(e);process.exitCode=1;});
