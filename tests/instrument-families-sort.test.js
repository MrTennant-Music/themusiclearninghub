const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),sharp=require('sharp');
const Sort=require('../shared/music-games-sort'),C=require('../music-games/core'),sharing=require('../music-games/sharing');
const manifest=require('../music-games/assets/instrument-families/manifest.json');
const source=require('../scripts/build-music-games-orchestra.cjs').entries().filter(e=>e.kind==='instrument');
test('National 5 Instrument Families contains every available orchestral instrument in four correct groups',()=>{
 for(let spin=0;spin<30;spin++){
  const a=Sort.create({level:'N5',type:'instruments',cardCount:12});assert.equal(a.items.length,23);assert.equal(C.compatibility('group-sort',a).ok,true);
  assert.deepEqual(a.sortRecipe.groups,['Strings','Woodwind','Brass','Percussion']);
  assert.deepEqual(a.items.map(i=>i.sourceConceptId).sort(),source.map(e=>e.conceptId).sort());
  for(const item of a.items){const expected=source.find(e=>e.conceptId===item.sourceConceptId);assert.equal(item.prompt,expected.answer);assert.equal(item.group,expected.family);assert.deepEqual(item.acceptedGroups,[expected.family]);assert(item.media.src.endsWith('.png'));}
  const placement=Object.fromEntries(a.items.map((item,i)=>[i,item.group]));assert(C.gradeSort(a.items,placement).every(mark=>mark.correct));
  for(const [i,item]of a.items.entries()){const wrong=a.sortRecipe.groups.find(group=>group!==item.group);assert.equal(C.gradeSort(a.items,{[i]:wrong})[i].correct,false);}
 }
 for(const level of ['N3','N4','H','AH'])assert.throws(()=>Sort.create({level,type:'instruments'}),/National 5/);
});
test('all photograph files are small transparent PNGs, with attribution retained',async()=>{
 let total=0;
 for(const entry of manifest){const file=entry.file.replace('./',''),metadata=await sharp(file).metadata(),{data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(metadata.format,'png');assert.equal(metadata.hasAlpha,true);assert(metadata.width<=240&&metadata.height<=200);assert.equal(data[3],0);assert.equal(data[(info.width-1)*4+3],0);assert(data.some((value,i)=>i%4===3&&value===255));assert(fs.statSync(file).size<10000);assert(entry.sourceUrl&&entry.license);total+=fs.statSync(file).size;
 }
 assert(total<110000,'all 23 photos stay below 110 KB');
});
test('horizontal woodwind photos have no floating fragments above the instrument',async()=>{
 for(const name of ['Flute','Clarinet','Oboe']){
  const entry=manifest.find(row=>row.name===name),{data,info}=await sharp(entry.file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let y=0;y<30;y++)for(let x=0;x<info.width;x++)assert.equal(data[(y*info.width+x)*4+3],0,`${name}: stray fragment at ${x},${y}`);
 }
});
test('instrument-family recipes preserve photos, names and correct groups in compact shared links',async()=>{
 const a=Sort.create({level:'N5',type:'instruments'}),link=await sharing.createUrl('https://hub.test/conceptsort.html',a);assert(link.length<=2800);const loaded=await sharing.readHash(new URL(link).hash);assert.deepEqual(loaded.items,a.items);assert.deepEqual(loaded.sortRecipe,a.sortRecipe);
 const bad=structuredClone(a.sortRecipe);bad.cards[0].group=a.sortRecipe.groups.find(g=>g!==bad.cards[0].group);assert.throws(()=>Sort.fromRecipe(bad),/invalid answer group/);
 assert.throws(()=>Sort.fromRecipe({...a.sortRecipe,cards:a.sortRecipe.cards.slice(1)}),/all available/);
});
