const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),sharp=require('sharp');
const {appIcons,run}=require('../scripts/audit-app-icon-borders.cjs');
test('all app identities use the shared white tile, border and outer margin',async()=>{
 const home=fs.readFileSync('index.html','utf8');
 const catalogue=home.match(/const appData = \[[\s\S]*?\n\];/)?.[0];
 assert.ok(catalogue,'Homepage app catalogue is missing');
 const titles=vm.runInNewContext(catalogue+'\nappData.flatMap(section=>section.apps.map(app=>app.title))');
 assert.ok(titles.length,'Homepage app catalogue is empty');
 const icons=appIcons();
 const report=await run();
 const checked=new Set(report.checked.map(({file})=>file));
 for(const title of titles){
  assert.ok(Object.hasOwn(icons,title),`${title} has no homepage icon`);
  assert.ok(checked.has(icons[title].split('?')[0]),`${title} was skipped by the border audit`);
 }
 assert.deepEqual(report.failures,[]);
});
test('Connections renders a centred four-by-four grid with rounded outer corners',async()=>{
 const size=128;
 const pixels=await sharp('app-icons/connections-grid-icon.svg').resize(size,size).ensureAlpha().raw().toBuffer();
 const isBlack=(x,y)=>{
  const i=(y*size+x)*4;
  return pixels[i]<80&&pixels[i+1]<80&&pixels[i+2]<80&&pixels[i+3]>230;
 };
 const cellRanges=[[26,40],[46,60],[67,81],[87,101]];
 const expected=Array.from({length:size},(_,i)=>cellRanges.some(([first,last])=>i>=first&&i<=last));
 for(const [first,last] of cellRanges){
  const centre=Math.floor((first+last)/2);
  assert.deepEqual(Array.from({length:size},(_,x)=>isBlack(x,centre)),expected,`Grid row at y=${centre}`);
  assert.deepEqual(Array.from({length:size},(_,y)=>isBlack(centre,y)),expected,`Grid column at x=${centre}`);
 }
 for(const x of [26,101]){
  for(const y of [26,101])assert.equal(isBlack(x,y),false,`Outer corner at (${x}, ${y})`);
 }
});
test('new app icons use the shared SVG frame in both homepage and app headers',()=>{
 const apps=require('../shared/music-games-apps').apps,home=fs.readFileSync('index.html','utf8');
 for(const id of ['crosswords','connections','wordsearch','conceptsort']){const file=apps[id].icon.replace('./','');assert.ok(file.endsWith('.svg'));assert.ok(home.includes(file));const icon=fs.readFileSync(file,'utf8');assert.match(icon,/data-app-icon-frame="shared"/);assert.match(icon,/stroke="#e5e7eb" stroke-width="1.5"/);}
});
