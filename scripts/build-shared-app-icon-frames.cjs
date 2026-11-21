/* Preserve the approved glyphs and give raster and older vector assets the
   same native SVG frame as the Hub's established 128-unit app icons. */
const fs=require('node:fs'),path=require('node:path'),frame=require('../app-icons/shared-frame.json');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'app-icons');
function tile(content,{clip=false}={}){
 const rect=`<rect data-app-icon-frame="shared" x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}" rx="${frame.radius}" fill="${frame.fill}" stroke="${frame.stroke}" stroke-width="${frame.strokeWidth}"/>`;
 const defs=clip?'<defs><clipPath id="glyph-safe-area"><rect x="8" y="8" width="112" height="112" rx="26"/></clipPath></defs>':'';
 return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${frame.viewBox}">${defs}${rect}${clip?'<g clip-path="url(#glyph-safe-area)">':''}${content}${clip?'</g>':''}</svg>\n`;
}
function build(){
 // Equal square cells refine the user's interlocking crossword reference.
 const cells=[[2,0],[2,1],[3,1],[0,2],[1,2],[2,2],[3,2],[4,2],[1,3],[2,3],[3,3],[2,4]];
 const crossword=cells.map(([x,y])=>`<rect x="${24+x*16}" y="${24+y*16}" width="16" height="16" fill="${(x===3&&y===1)||(x===1&&y===3)?'#000':'#fff'}"/>`).join('');
 fs.writeFileSync(path.join(dir,'crosswords-grid-icon.svg'),tile(`<g stroke="#000" stroke-width="2.4" stroke-linejoin="round">${crossword}</g>`));
 const letters='KRTAMXVQZBLNDPHS';
 const wordsearch=[...letters].map((letter,i)=>i===3?'':`<text x="${32+i%4*20}" y="${42+Math.floor(i/4)*20}">${letter}</text>`).join('');
 fs.writeFileSync(path.join(dir,'wordsearch-icon.svg'),tile(`<g fill="#000" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700" text-anchor="middle">${wordsearch}</g><path d="M102 46l10 10" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round"/><circle cx="92" cy="36" r="14" fill="#fff" stroke="#000" stroke-width="3"/><text x="92" y="44" fill="#000" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="700" text-anchor="middle">${letters[3]}</text>`));
 // Keep the 4x4 grid crisp, rounding only the four outside cell corners
 // along a curve inset from the shared squircle frame.
 const connections=Array.from({length:16},(_,i)=>`<rect x="${25.5+(i%4)*20.5}" y="${25.5+Math.floor(i/4)*20.5}" width="15.5" height="15.5"/>`).join('');
 fs.writeFileSync(path.join(dir,'connections-grid-icon.svg'),tile(`<defs><clipPath id="connections-grid-corners"><rect x="25.5" y="25.5" width="77" height="77" rx="8.5"/></clipPath></defs><g fill="#000" clip-path="url(#connections-grid-corners)">${connections}</g>`));
 for(const name of ['pitched-icon','music-escape']){
  const raster=fs.readFileSync(path.join(dir,`${name}.png`)).toString('base64');
  fs.writeFileSync(path.join(dir,`${name}.svg`),tile(`<image x="8" y="8" width="112" height="112" href="data:image/png;base64,${raster}"/>`));
 }
 for(const name of ['composition-studio-icon.svg','bass-patterns-icon.svg']){
  const file=path.join(dir,name),source=fs.readFileSync(file,'utf8');
  if(source.includes('data-app-icon-frame="shared"'))continue;
  const content=source.replace(/^.*?<svg\b[^>]*>/s,'').replace(/<\/svg>\s*$/,'').replace(/<rect\b[^>]*\/>/,'');
  fs.writeFileSync(file,tile(`<g transform="scale(2)">${content}</g>`));
 }
 const practice=path.join(dir,'practice-app-icon.svg'),source=fs.readFileSync(practice,'utf8');
 if(!source.includes('data-app-icon-frame="shared"'))fs.writeFileSync(practice,tile(source.replace(/^.*?<svg\b[^>]*>/s,'').replace(/<\/svg>\s*$/,''),{clip:true}));
}
if(require.main===module)build();module.exports={build};
