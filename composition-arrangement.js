/* Independent Studio canvases and their ordered playback arrangement. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./chord-generator-core'));
 else root.MLH.CompositionArrangement=factory(root.MLH.ChordGenerator);
})(typeof window!=='undefined'?window:globalThis,function(C){
 const clean=p=>{const copy={...p};delete copy.studioArrangement;delete copy.studioSectionMap;return C.asStudio(copy);};
 function letter(index){let name='';do{name=String.fromCharCode(65+index%26)+name;index=Math.floor(index/26)-1;}while(index>=0);return name;}
 function validate(value){
  if(!value||!Array.isArray(value.items)||!value.items.length||value.items.length>32)throw Error('Choose between 1 and 32 sections.');
  const ids=new Set();
  const items=value.items.map((item,i)=>{const id=String(item.id||`section-${i+1}`);if(ids.has(id))throw Error('Section identifiers must be unique.');ids.add(id);return {id,name:String(item.name||letter(i)).trim().slice(0,40)||letter(i),project:clean(item.project)};});
  return {version:1,items,active:value.active==='all'&&items.length>1?'all':ids.has(value.active)?value.active:items[0].id};
 }
 function create(project){return validate({items:[{id:'section-1',name:'A',project}],active:'section-1'});}
 function nextName(items){let i=0;while(items.some(item=>item.name===letter(i)))i++;return letter(i);}
 function insert(value,project,after){const data=validate(value);if(data.items.length>=32)throw Error('A composition can have up to 32 sections.');let n=1;while(data.items.some(s=>s.id===`section-${n}`))n++;const item={id:`section-${n}`,name:nextName(data.items),project:clean(project)};const index=after?data.items.findIndex(s=>s.id===after)+1:data.items.length;data.items.splice(index,0,item);data.active=item.id;return data;}
 function duplicate(value,id){const data=validate(value),item=data.items.find(s=>s.id===id);if(!item)throw Error('Section not found.');return insert(data,item.project,id);}
 function move(value,id,delta){const data=validate(value),from=data.items.findIndex(s=>s.id===id),to=from+delta;if(from>=0&&to>=0&&to<data.items.length){const item=data.items.splice(from,1)[0];data.items.splice(to,0,item);}return data;}
 function remove(value,id){const data=validate(value);if(data.items.length===1)throw Error('Keep at least one section.');const index=data.items.findIndex(s=>s.id===id);if(index<0)return data;data.items.splice(index,1);if(data.active===id)data.active=data.items[Math.min(index,data.items.length-1)].id;if(data.items.length===1)data.active=data.items[0].id;return data;}
 function compile(value,audio){
  const data=validate(value),first=data.items[0].project,events=[],sections=[],map=[];let offset=0;
  for(const item of data.items){const p=item.project,length=C.totalBeats(p),pickup=p.upbeatBeats||0;map.push({id:item.id,name:item.name,pickupStart:offset,beat:offset+pickup,length,timeSignature:p.timeSignature,key:p.key,mode:p.mode});
   const chords=p.sections[0].chords.map((c,i)=>({...c,...(i===0&&c.tempo==null?{tempo:p.tempo}:{})}));sections.push({name:item.name,repeats:1,variation:0,chords:pickup?[{symbol:'-',beats:pickup},...chords]:chords});
   for(const event of audio.events(p)){if(event.track==='click')continue;events.push({...event,beat:offset+pickup+event.beat,duration:Math.min(event.duration,length-event.beat),instrument:event.instrument||(event.track==='melody'?p.melodyInstrument:event.track==='chords'?p.accompanimentInstrument:p.instrument)});}
   offset+=pickup+length;
  }
  const project=C.validate({...first,upbeatBeats:0,sections,melody:[],bass:null,accompaniment:null,drums:null,loop:true,studioSectionMap:map,studioArrangement:data});
  const joined=[],continuations=new Map();
  for(const event of events.sort((a,b)=>a.beat-b.beat)){const id=event.sourceNoteId?JSON.stringify([event.track,event.partId||event.layerId||'',event.instrument||'',event.midi,event.sourceNoteId]):null,previous=id?continuations.get(id):null;if(previous&&event.tieFrom&&previous.tieTo&&Math.abs(previous.beat+previous.duration-event.beat)<.00001){previous.duration+=event.duration;if(previous.notatedDuration!==undefined)previous.notatedDuration+=event.notatedDuration??event.duration;previous.tieTo=event.tieTo;}else{joined.push(event);if(id)continuations.set(id,event);}}
  return {project,events:joined,map,total:offset};
 }
 return {validate,create,letter,nextName,insert,duplicate,move,remove,compile};
});
