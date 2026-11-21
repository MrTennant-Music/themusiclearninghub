(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./core.js'):root.IGCore,()=>typeof module==='object'&&module.exports?require('../shared/music-games-sort'):root.MLHSort);
 if(typeof module==='object'&&module.exports)module.exports=api;else root.IGSharing=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(C,sortEngine){
 'use strict';
 function diagramKey(source){
  if(!source)return '';
  let hash=2166136261;
  for(let i=0;i<source.length;i++)hash=Math.imul(hash^source.charCodeAt(i),16777619);
  return source.length+':'+(hash>>>0);
 }
 async function createUrl(base,activity){
  const url=new URL(base);url.search='';url.hash='';
  if(!activity){const current=new URL(base);for(const name of ['level','game','q'])if(current.searchParams.has(name))url.searchParams.set(name,current.searchParams.get(name));return url.toString();}
  // The next generated Connections board must stay in the shared collection.
  if(activity.tags?.includes('generated-connections'))url.searchParams.set('collection',activity.tags.includes('literacy-connections')?'literacy':'concepts');
  const payload=JSON.parse(C.exportActivity(activity));
  if(activity.sortRecipe){const restored=sortEngine().fromRecipe(activity.sortRecipe);if(JSON.stringify(restored.items)===JSON.stringify(activity.items)){payload.sortRecipe=activity.sortRecipe;payload.activities[0].items=[];}}
  const seedEntry=C.SEEDS.find(seed=>seed.id===activity.id);
  const seedActivity=seedEntry?seedEntry._builtin?await globalThis.IGRuntime.activity(seedEntry.id):seedEntry:null;
  const exportedSeed=seedActivity?JSON.parse(C.exportActivity(seedActivity)).activities[0]:null;
  // Built-in content ships with the receiving Hub. Keep its complete selected
  // options in the link without embedding the same images and notation again.
  if(exportedSeed&&JSON.stringify(exportedSeed.items)===JSON.stringify(payload.activities[0].items)&&JSON.stringify(exportedSeed.diagram)===JSON.stringify(payload.activities[0].diagram)){
   payload.seedActivity=seedEntry.id;
   payload.seedRevision=exportedSeed.revision;
   payload.activities[0].items=[];
   payload.activities[0].diagram=null;
  }
  // Built-in diagrams already ship with the Hub; keep QR links small without
  // making exported activity files depend on an external image server.
  const key=diagramKey(activity.diagram?.src);
  const diagramSeed=key&&C.SEEDS.find(seed=>seed.diagram?.src===activity.diagram?.src||seed.diagramKey===key);
  if(diagramSeed&&!payload.seedActivity){payload.seedDiagram=diagramSeed.id;payload.activities[0].diagram=null;}
  const json=JSON.stringify(payload);
  const compressed=new Uint8Array(await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
  let binary='';for(const byte of compressed)binary+=String.fromCharCode(byte);
  url.hash='playnote='+btoa(binary).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
  if(url.toString().length>2800)throw Error('This activity is too large for a QR link. Download the activity and import it on the other device.');
  return url.toString();
 }
 async function readHash(hash){
  if(!hash.startsWith('#playnote='))throw Error('This is not a music game activity link.');
  const encoded=hash.slice(10);
  if(!/^[A-Za-z0-9_-]+$/.test(encoded)||encoded.length>2800)throw Error('This activity link is invalid or too large.');
  const binary=atob(encoded.replaceAll('-','+').replaceAll('_','/'));
  const bytes=Uint8Array.from(binary,char=>char.charCodeAt(0));
  const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate')).getReader();
  const chunks=[];let length=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>C.LIMITS.importBytes)throw Error('This activity link is too large.');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}
  const payload=JSON.parse(await new Blob(chunks).text());
  if(payload.sortRecipe){if(!Array.isArray(payload.activities)||payload.activities.length!==1)throw Error('Invalid sort link.');payload.activities[0].items=sortEngine().fromRecipe(payload.sortRecipe).items;}
  if(payload.seedActivity){
   const entry=C.SEEDS.find(seed=>seed.id===payload.seedActivity);
   const seed=entry?entry._builtin?await globalThis.IGRuntime.activity(entry.id):entry:null;
   if(!seed||!Array.isArray(payload.activities)||payload.activities.length!==1)throw Error('This built-in activity is not available.');
   const exported=JSON.parse(C.exportActivity(seed)).activities[0];
   if(exported.revision!==payload.seedRevision)throw Error('This built-in activity has changed. Create a new QR link from the current Hub.');
   payload.activities[0].items=exported.items;
   payload.activities[0].diagram=exported.diagram;
  }
  if(payload.seedDiagram){
   const seedId=payload.seedDiagram==='7bfb121c-f852-45f1-8c7b-22a088f79437'?'hub-s1-parts-of-the-bass-guitar':payload.seedDiagram;
   const entry=C.SEEDS.find(seed=>seed.id===seedId);
   const seed=entry?entry._builtin?await globalThis.IGRuntime.activity(seedId):entry:null;
   if(!seed||!Array.isArray(payload.activities)||payload.activities.length!==1)throw Error('This built-in diagram is not available.');
   // Older fretboard links store pins in the original horizontal orientation.
   // Their built-in image is now upright, so rotate the associated pins too.
   if(seed.id==='hub-s1-guitar-strings-and-frets' && (payload.activities[0].revision || 1)<2){
    for(const item of payload.activities[0].items || []){
     const x=Number(item.x),y=Number(item.y);
     if(Number.isFinite(x)&&Number.isFinite(y)){item.x=100-y;item.y=x;}
    }
    payload.activities[0].revision=2;
   }
   if(seed.id==='hub-s1-guitar-strings-and-frets' && (payload.activities[0].revision || 1)<3){
    for(const item of payload.activities[0].items || []){
     const x=Number(item.x),y=Number(item.y);
     if(Number.isFinite(x)&&Number.isFinite(y)){item.x=(x-50)*1.55+50;item.y=(y-50)*1.08+50;}
    }
    payload.activities[0].revision=3;
   }
   if(seed.id==='hub-s1-parts-of-the-bass-guitar' && (payload.activities[0].revision || 1)<2){
    for(const item of payload.activities[0].items || []){
     const updated=seed.items.find(candidate=>candidate.id===item.id);
     if(updated){item.x=updated.x;item.y=updated.y;}
    }
    payload.activities[0].revision=2;
   }
   if(seed.id==='hub-s1-parts-of-the-bass-guitar' && (payload.activities[0].revision || 1)<3){
    const controls=seed.items.find(item=>item.id==='hub-s1-parts-of-the-bass-guitar-part-8');
    if(controls && !payload.activities[0].items.some(item=>item.id===controls.id))payload.activities[0].items.push({...controls});
    payload.activities[0].revision=3;
   }
   if(seed.id==='hub-s1-parts-of-the-bass-guitar' && (payload.activities[0].revision || 1)<4){
    payload.activities[0].items=payload.activities[0].items.map(item=>{
     const updated=seed.items.find(candidate=>candidate.id===item.id);
     return updated?{...item,answer:updated.answer,x:updated.x,y:updated.y}:item;
    });
    payload.activities[0].revision=4;
   }
   payload.activities[0].diagram=seed.diagram;
  }
  const [activity]=C.normalizeImport(payload);
  activity.id=C.sharedActivityId(activity);
  return activity;
 }
 return Object.freeze({createUrl,readHash});
});
