/* Local review state is saved by server.py; decoding only draws the waveform. */
'use strict';
const $ = id => document.getElementById(id);
const labels = { not_required:'No review needed',pending:'To review',keep:'Keep',trim:'Needs trimming / trimmed',wrong:'Wrong concept',poor:'Poor audio',unsure:'Unsure',reject:'Reject' };
const levels = ['National 3','National 4','National 5','Higher','Advanced Higher'];
let savingDraft=null;
let clips=[],libraryFolders=[],filtered=[],active=null,token='',usage='undecided',pageSize=100,busy=false,loadSerial=0;
let duration=0,peaks=null,selection=[0,0],view=[0,0],drag=null,previewing=false,context=null,dirty=false;
const audio=$('audio'),canvas=$('wave'),ctx=canvas.getContext('2d');
const fmt=n => {const ticks=Math.max(0,Math.round((Number(n)||0)*10)),sec=Math.floor(ticks/10);return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0')+(sec<10?'.'+ticks%10:'');};
const message=(s,error=false)=>{$('message').textContent=error?s:'';$('message').hidden=!error;$('message').classList.toggle('error',error);};
const option=(value,text)=>{const o=document.createElement('option');o.value=value;o.textContent=text;return o;};
function options(id,values,all){const e=$(id),v=e.value;e.replaceChildren(option('',all),...values.map(v=>option(v,v)));e.value=values.includes(v)?v:'';}
function names(){return [...new Set(clips.flatMap(c=>[c.concept,...c.concepts]))].sort((a,b)=>a.localeCompare(b));}
function stats(){
 const threshold=Number($('conceptThreshold').value);
 const pending=clips.filter(c=>c.status==='pending').length;
 $('totalSize').textContent=(clips.reduce((sum,clip)=>sum+clip.bytes,0)/1000000).toLocaleString(undefined,{maximumFractionDigits:2});
 $('total').textContent=clips.length.toLocaleString();$('remaining').textContent=pending.toLocaleString();
 const queue=clips.filter(c=>c.status!=='not_required').length; $('progress').max=queue||1;$('progress').value=queue-pending;$('progressText').textContent=`${Math.round(100*(clips.length-pending)/(clips.length||1))}%`; $('progress').max=clips.length||1;$('progress').value=clips.length-pending;
 $('levelConceptCounts').replaceChildren(...levels.map(level=>{
  const rows=clips.filter(c=>c.level===level&&c.concept!=='Multiple Concepts');
  const counts=new Map(libraryFolders.filter(f=>f.split('/').length===3&&f.split('/')[0]===level).map(f=>[f,0]));
  for(const row of rows){const folder=row.path.split('/').slice(0,-1).join('/');counts.set(folder,(counts.get(folder)||0)+1);}
  const card=document.createElement('div'),name=document.createElement('h3'),list=document.createElement('ul');
  name.textContent=level;list.className='concept-example-counts';
  const sort=$('conceptSort').value;
  const sorted=[...counts].sort((a,b)=>{
   const byName=a[0].split('/').pop().localeCompare(b[0].split('/').pop());
   if(sort==='count-asc')return a[1]-b[1]||byName;
   if(sort==='count-desc')return b[1]-a[1]||byName;
   return sort==='name-desc'?-byName:byName;
  });
  for(const [folder,count] of sorted){
   if($('underFiveOnly').checked&&count>=threshold)continue;
   const item=document.createElement('li'),concept=document.createElement('span'),value=document.createElement('b');
   concept.textContent=folder.split('/').pop();concept.title=folder;value.textContent=`${count} ${count===1?'example':'examples'}`;
   item.classList.toggle('under-five',count<threshold);item.append(concept,value);list.append(item);
  }
  if(!list.children.length){const empty=document.createElement('li');empty.textContent=$('underFiveOnly').checked?`No folders below ${threshold} examples.`:'No concept folders.';list.append(empty);}
  card.append(name,list);return card;
 }));
}
function refilter(){
 const q=$('search').value.toLocaleLowerCase();
 filtered=clips.filter(c=>($('reviewScope').value==='all'||c.review)&&(!q||(c.name+' '+c.concept).toLocaleLowerCase().includes(q)));
 filtered.sort((a,b)=>a.path.localeCompare(b.path));
 renderList();renderFiles();stats();localStorage.setItem('audioReviewFilters',JSON.stringify(Object.fromEntries(['search','reviewScope'].map(k=>[k,$(k).type==='checkbox'?$(k).checked:$(k).value]))));
}
function renderList(){
 const list=$('list');list.replaceChildren();$('listCount').textContent=`${filtered.length.toLocaleString()} matching files`;
 for(const c of filtered.slice(0,pageSize)){
  const b=document.createElement('button');b.className='clip-row'+(active?.id===c.id?' active':'');b.setAttribute('role','listitem');b.dataset.id=c.id;
  const t=document.createElement('div');t.textContent=c.name.replace(/\.m4a$/i,'');const s=document.createElement('span');s.textContent=`${c.level} · ${c.concept} · ${(c.bytes/1024).toFixed(0)} KB`;
  const status=document.createElement('b');status.textContent=labels[c.status];b.append(t,s,status);b.onclick=()=>open(c.id);list.append(b);
 }
 $('more').hidden=pageSize>=filtered.length;
}
async function request(route,body){
 const res=await fetch(route,{method:'POST',headers:{'Content-Type':'application/json','X-Review-Token':token},body:JSON.stringify(body)});
 const data=await res.json();if(!res.ok)throw Error(data.error||'Could not save.');return data;
}
function patch(row){const i=clips.findIndex(c=>c.id===row.id);if(i>=0){row={...clips[i],...row};clips[i]=row;}else clips.push(row);if(active?.id===row.id)active=row;}
async function saveDraft(){}

async function withBusy(task){
 if(busy)return;busy=true;document.querySelectorAll('#detail button,#detail input,#detail select,#detail textarea,#refresh').forEach(e=>e.disabled=true);
 try{return await task();}catch(e){message(e.message,true);return false;}
 finally{busy=false;document.querySelectorAll('#detail button,#detail input,#detail select,#detail textarea,#refresh').forEach(e=>e.disabled=false);$('saveTrim').disabled=!duration;}
}
async function open(id){
 if(busy)return;
 try{await saveDraft();}catch(e){message(e.message,true);return;}
 const row=clips.find(c=>c.id===id);if(!row)return;
 audio.pause();previewing=false;active=row;dirty=false;usage=row.use;localStorage.setItem('audioReviewActive',id);
 $('detail').hidden=false;$('empty').hidden=true;$('title').textContent=row.name;$('location').textContent=row.heading===row.concept?`${row.level} / ${row.concept}`:`${row.level} / ${row.heading} / ${row.concept}`;
 renderList();loadAudio();
}
async function loadAudio(){
 const serial=++loadSerial;duration=0;peaks=null;selection=[0,0];view=[0,0];$('start').value=0;$('end').value=0;$('saveTrim').disabled=true;$('waveStatus').textContent='Loading waveform…';draw();
 const url=`/audio?id=${active.id}&original=${0}&v=${active.revision}`;
 audio.src=url;audio.load();$('play').textContent='Play';
 try{
  const res=await fetch(url);if(!res.ok)throw Error('Audio could not be loaded.');const bytes=await res.arrayBuffer();
  context ||= new AudioContext();const buffer=await context.decodeAudioData(bytes);
  if(serial!==loadSerial)return;
  duration=buffer.duration;const samples=buffer.getChannelData(0),bins=Math.min(12000,samples.length),step=Math.max(1,Math.floor(samples.length/bins));peaks=new Float32Array(bins);
  for(let i=0;i<bins;i++){let peak=0;for(let j=i*step;j<Math.min((i+1)*step,samples.length);j++)peak=Math.max(peak,Math.abs(samples[j]));peaks[i]=peak;}
  selection=[0,duration];$('zoom').value='1';$('pan').value='0';updateView();syncSelection();$('saveTrim').disabled=false;$('waveStatus').textContent='Drag a region or adjust the end handles';message('Ready. Decisions and notes are saved on this Mac.');
 }catch(e){if(serial===loadSerial){$('waveStatus').textContent='Waveform unavailable';message(e.message+' You can still use playback if supported.',true);}}
}
function updateView(){const span=duration/Number($('zoom').value);view=[Number($('pan').value)*Math.max(0,duration-span),0];view[1]=view[0]+span;draw();}
function syncSelection(writeInputs=true){
 selection[0]=Math.max(0,Math.min(selection[0],duration));selection[1]=Math.max(selection[0],Math.min(selection[1],duration));
 if(writeInputs){$('start').value=selection[0].toFixed(2);$('end').value=selection[1].toFixed(2);}$('selectionLength').textContent=(selection[1]-selection[0]).toFixed(2)+'s selected';$('time').textContent=fmt(audio.currentTime)+' / '+fmt(duration);draw();
}
function draw(){
 const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#fafafa';ctx.fillRect(0,0,w,h);
 if(!duration||!peaks)return;
 const x=t=>(t-view[0])/(view[1]-view[0])*w;
 ctx.fillStyle='#e2ebff';ctx.fillRect(x(selection[0]),0,x(selection[1])-x(selection[0]),h);
 ctx.strokeStyle='#557eaf';ctx.lineWidth=1;ctx.beginPath();const max=Math.max(.03,...peaks);
 for(let i=0;i<w;i++){const time=view[0]+i/w*(view[1]-view[0]),bin=Math.min(peaks.length-1,Math.floor(time/duration*peaks.length)),amp=peaks[bin]/max*(h*.37);ctx.moveTo(i,h/2-amp);ctx.lineTo(i,h/2+amp);}ctx.stroke();
 for(const [i,t] of selection.entries())if(t>=view[0]&&t<=view[1]){const p=Math.max(3,Math.min(w-3,x(t)));ctx.fillStyle='#295bd7';ctx.fillRect(p-3,0,6,h);ctx.fillRect(p+(i?-21:0),0,21,30);ctx.fillStyle='white';ctx.font='15px sans-serif';ctx.fillText(i?'O':'I',p+(i?-16:5),21);}
 const play=x(audio.currentTime||0);ctx.fillStyle='#d24943';ctx.fillRect(play-1,0,2,h);
 ctx.font='17px sans-serif';ctx.fillStyle='#607187';ctx.fillText(fmt(view[0]),10,h-10);ctx.fillText(fmt(view[1]),w-90,h-10);
}
function pointerTime(e){const r=canvas.getBoundingClientRect();return Math.max(0,Math.min(duration,view[0]+(e.clientX-r.left)/r.width*(view[1]-view[0])));}
canvas.addEventListener('pointerdown',e=>{
 if(!duration||busy)return;canvas.setPointerCapture(e.pointerId);const t=pointerTime(e),tolerance=(view[1]-view[0])*14/canvas.getBoundingClientRect().width;
 drag={kind:Math.abs(t-selection[0])<tolerance?'start':Math.abs(t-selection[1])<tolerance?'end':'new',anchor:t,moved:false};audio.currentTime=t;
});
canvas.addEventListener('pointermove',e=>{
 if(!drag)return;const t=pointerTime(e);drag.moved=true;
 if(drag.kind==='start')selection[0]=Math.min(t,selection[1]-.1);else if(drag.kind==='end')selection[1]=Math.max(t,selection[0]+.1);else selection=[Math.min(t,drag.anchor),Math.max(t,drag.anchor)];syncSelection();
});
canvas.addEventListener('pointerup',()=>{drag=null;draw();});canvas.addEventListener('pointercancel',()=>drag=null);
function playPause(){if(!active)return;if(audio.paused){preview();}else audio.pause();}
function preview(){if(selection[1]-selection[0]<.1)return;audio.pause();audio.currentTime=selection[0];previewing=true;audio.play().catch(e=>message(e.message,true));}
audio.addEventListener('timeupdate',()=>{if(previewing&&audio.currentTime>=selection[1]){audio.pause();previewing=false;} $('time').textContent=fmt(audio.currentTime)+' / '+fmt(duration||audio.duration);draw();});
let frame=0;function animatePlayback(){if(previewing&&audio.currentTime>=selection[1]){audio.pause();previewing=false;return;}draw();if(!audio.paused)frame=requestAnimationFrame(animatePlayback);}
audio.addEventListener('play',()=>{$('play').textContent='Pause';cancelAnimationFrame(frame);frame=requestAnimationFrame(animatePlayback);});audio.addEventListener('pause',()=>{$('play').textContent='Play';cancelAnimationFrame(frame);});
audio.addEventListener('error',()=>{if(active)message('Playback could not start. Try another file or refresh the library.',true);});
async function navigate(delta){if(!active)return;const i=filtered.findIndex(c=>c.id===active.id),next=filtered[Math.max(0,Math.min(filtered.length-1,i+delta))];if(next)await open(next.id);}
$('play').onclick=playPause;$('previous').onclick=()=>navigate(-1);$('next').onclick=()=>navigate(1);
$('setStart').onclick=()=>{selection[0]=Math.min(audio.currentTime,selection[1]-.1);syncSelection();};$('setEnd').onclick=()=>{selection[1]=Math.max(audio.currentTime,selection[0]+.1);syncSelection();};
$('start').oninput=()=>{selection[0]=Math.min(Number($('start').value),selection[1]-.1);syncSelection(false);};$('end').oninput=()=>{selection[1]=Math.max(Number($('end').value),selection[0]+.1);syncSelection(false);};$('start').onchange=$('end').onchange=()=>syncSelection();
$('resetSelection').onclick=()=>{selection=[0,duration];syncSelection();};$('zoom').onchange=()=>{const span=duration/Number($('zoom').value);$('pan').value=Math.max(0,Math.min(1,((selection[0]+selection[1])/2-span/2)/(duration-span||1)));updateView();};$('pan').oninput=updateView;
$('saveTrim').onclick=async()=>{
 if(!active||!duration)return;
 const id=active.id,index=filtered.findIndex(c=>c.id===id),nextId=filtered[index+1]?.id||filtered[index-1]?.id;
 const ok=await withBusy(async()=>{
  let row=active;
  if(selection[0]>.01||selection[1]<duration-.03){
   row=await request('/api/trim',{id,revision:row.revision,start:selection[0],end:selection[1],original:false,use:row.use});patch(row);
  }
  row=await request('/api/review',{id,revision:row.revision,status:'keep',use:row.use,notes:row.notes,concepts:row.concepts});patch(row);
  await refresh();return true;
 });
 if(ok){
  const next=clips.find(c=>c.id===nextId&&filtered.some(f=>f.id===c.id))||filtered[0]||clips.find(c=>c.id===id);
  if(next)await open(next.id);else{$('detail').hidden=true;$('empty').hidden=false;}
 }
};
function filterChanged(){pageSize=100;refilter();if(!filtered.length){audio.pause();$('detail').hidden=true;$('empty').hidden=false;}else if(!filtered.some(c=>c.id===active?.id)){open(filtered[0].id);}else{$('detail').hidden=false;$('empty').hidden=true;}}
for(const id of ['reviewScope'])$(id).onchange=filterChanged;$('search').oninput=filterChanged;$('more').onclick=()=>{pageSize+=100;renderList();};
async function refresh(){const res=await fetch('/api/catalog');if(!res.ok)throw Error('Start the local review server to open your library.');const data=await res.json();clips=data.clips;libraryFolders=data.folders||[];token=data.token;
 refilter();
}

document.addEventListener('keydown',e=>{
 if(e.target.matches('input,textarea,select')||e.ctrlKey||e.metaKey||e.altKey||busy)return;
 const k=e.key.toLowerCase();if(k===' '&&!e.target.matches('button')){e.preventDefault();playPause();}else if(k==='p')preview();else if(k==='i')$('setStart').click();else if(k==='o')$('setEnd').click();else if(k==='n')navigate(1);else if(k==='b')navigate(-1);else if(e.key==='ArrowRight'){e.preventDefault();audio.currentTime=Math.min(duration,audio.currentTime+2);}else if(e.key==='ArrowLeft'){e.preventDefault();audio.currentTime=Math.max(0,audio.currentTime-2);}
});
// Notes are committed on navigation and periodically; no changes to audio occur here.
setInterval(()=>{if(dirty&&!busy)saveDraft().catch(e=>message(e.message,true));},4000);
let fileSort='name',fileDirection=1,filePage=0;
const useLabels={undecided:'Undecided',concept:'Concept',exam:'Exam',both:'Both'};
const fileColumns={name:'Filename',bytes:'Size',duplicateCount:'Copies',level:'Level',heading:'Heading',concept:'Concept',status:'Decision',use:'Use',updated:'Last reviewed'};
function duplicateDetails(clip){
 const details=document.createElement('details'),summary=document.createElement('summary');details.className='duplicate-details';
 summary.textContent=`${clip.duplicateCount} copies · ${clip.duplicateCopies} duplicate${clip.duplicateCopies===1?'':'s'}`;
 const list=document.createElement('ul');
 for(const id of clip.duplicateIds||[]){const peer=clips.find(c=>c.id===id);if(!peer)continue;const li=document.createElement('li'),b=document.createElement('button');b.className='duplicate-link';b.textContent=peer.path;b.onclick=async()=>{await open(id);await showView('review');};li.append(b);list.append(li);}
 const caption=document.createElement('p');caption.textContent='Identical file contents. Counts include this file; duplicates are the other copies. No files are removed.';
 details.append(summary,caption,list);return details;
}
function matchesFileScope(clip){
 const scope=$('fileScope').value;
 if(scope==='all')return true;
 if(scope==='duplicates')return clip.duplicateCount>1;
 const clean=clip.name.replace(/^\d+\.\s+/,'').replace(/^REVIEW\s+/i,'');
 const multiple=clip.concepts.length>1||/^Multiple Concepts - /i.test(clean);
 return scope==='multiple'?multiple:!multiple;
}
function fileMatches(){
 const q=$('fileSearch').value.toLowerCase();
 return clips.filter(c=>matchesFileScope(c)&&(!q||(c.name+' '+c.concept+' '+c.notes+' '+c.concepts.join(' ')).toLowerCase().includes(q)));
}
function renderFiles(){
 if(!document.getElementById('fileRows'))return;
 const rows=fileMatches();
 rows.sort((a,b)=>{let result;if(fileSort==='bytes'||fileSort==='updated'||fileSort==='duplicateCount')result=a[fileSort]-b[fileSort];else if(fileSort==='level')result=levels.indexOf(a.level)-levels.indexOf(b.level);else result=String(fileSort==='status'?labels[a.status]:fileSort==='use'?useLabels[a.use]:a[fileSort]).localeCompare(String(fileSort==='status'?labels[b.status]:fileSort==='use'?useLabels[b.use]:b[fileSort]),undefined,{numeric:true,sensitivity:'base'});return fileDirection*result||a.path.localeCompare(b.path);});
 const size=Number($('filePageSize').value),pages=Math.max(1,Math.ceil(rows.length/size));filePage=Math.min(filePage,pages-1);
 const duplicateFiles=rows.filter(c=>c.duplicateCount>1).length,duplicateGroups=new Set(rows.filter(c=>c.duplicateCount>1).map(c=>c.duplicateGroup)).size;
 $('fileSummary').textContent=`${rows.length.toLocaleString()} of ${clips.length.toLocaleString()} files · ${duplicateFiles.toLocaleString()} in ${duplicateGroups.toLocaleString()} duplicate groups`;
 const tbody=$('fileRows');tbody.replaceChildren();
 for(const c of rows.slice(filePage*size,(filePage+1)*size)){
  const tr=document.createElement('tr');
  for(const key of Object.keys(fileColumns)){
   const td=document.createElement('td');
   if(key==='name'){const b=document.createElement('button');b.className='file-name';b.textContent=c.name;b.title=c.path;b.onclick=async()=>{await open(c.id);await showView('review');};td.append(b);}
   else if(key==='duplicateCount'){td.className='duplicate-cell';if(c.duplicateCount>1){td.append(duplicateDetails(c));tr.classList.add('has-duplicates');}else td.textContent=c.duplicateChecked?'Unique':'Not checked';}
   else if(key==='concept'&&c.concepts.length>1){const details=document.createElement('details'),summary=document.createElement('summary'),text=document.createElement('p');summary.textContent=c.concept==='Multiple Concepts'?c.concepts.length+' concepts':c.concept+' +'+(c.concepts.length-1);text.textContent=c.concepts.join(', ');details.append(summary,text);td.append(details);}
   else td.textContent=key==='bytes'?(c.bytes<1000000?(c.bytes/1000).toFixed(1)+' KB':(c.bytes/1000000).toFixed(2)+' MB'):key==='status'?labels[c.status]:key==='use'?useLabels[c.use]:key==='updated'?(c.updated?new Date(c.updated*1000).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—'):c[key];
   tr.append(td);
  }tbody.append(tr);
 }
 if(!rows.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=9;td.className='file-empty';td.textContent='No files match these filters.';tr.append(td);tbody.append(tr);}
 $('filePage').textContent=`Page ${filePage+1} of ${pages}`;$('filePrev').disabled=filePage===0;$('fileNext').disabled=filePage>=pages-1;
 for(const [key,label] of Object.entries(fileColumns)){const th=document.querySelector('th[data-column="'+key+'"]');th.setAttribute('aria-sort',key===fileSort?(fileDirection===1?'ascending':'descending'):'none');th.querySelector('button').textContent=label+(key===fileSort?(fileDirection===1?' ↑':' ↓'):'');}
}
async function showView(view){
 if(busy)return;try{await saveDraft();}catch(e){message(e.message,true);return;}
 const files=view==='files',concepts=view==='concepts';$('filesPanel').hidden=!files;$('reviewPanel').hidden=files||concepts;$('conceptsPanel').hidden=!concepts;
 for(const [id,yes] of [['filesView',files],['reviewView',!files&&!concepts],['conceptsView',concepts]]){$(id).classList.toggle('selected',yes);$(id).setAttribute('aria-pressed',String(yes));}
 if(files||concepts)audio.pause();if(files)renderFiles();localStorage.setItem('audioReviewView',view);
}
$('reviewView').onclick=()=>showView('review');$('filesView').onclick=()=>showView('files');$('conceptsView').onclick=()=>showView('concepts');
for(const id of ['fileSearch'])$(id).oninput=()=>{filePage=0;renderFiles();};
for(const id of ['fileScope','filePageSize'])$(id).onchange=()=>{filePage=0;renderFiles();};
for(const b of document.querySelectorAll('th button[data-column]'))b.onclick=()=>{const key=b.dataset.column;fileDirection=key===fileSort?-fileDirection:1;fileSort=key;filePage=0;renderFiles();};
$('filePrev').onclick=()=>{filePage--;renderFiles();};$('fileNext').onclick=()=>{filePage++;renderFiles();};
(async()=>{try{await refresh();const saved=JSON.parse(localStorage.getItem('audioReviewFilters')||'{}');for(const id of ['search','reviewScope'])if(id in saved){if($(id).type==='checkbox')$(id).checked=!!saved[id];else $(id).value=saved[id];}refilter();
 await showView(localStorage.getItem('audioReviewView')||'review');
 const savedId=localStorage.getItem('audioReviewActive');await open(filtered.find(c=>c.id===savedId)?.id||filtered[0]?.id);
 if(!filtered.length){$('detail').hidden=true;$('empty').hidden=false;message('No files match these filters.');}
 }catch(e){message(e.message,true);}})();
let lastDeleted=null;
$('deleteFile').onclick=async()=>{const nextId=await withBusy(async()=>{
 if(!active)return;await saveDraft();const id=active.id,index=filtered.findIndex(c=>c.id===id),next=filtered[index+1]?.id||filtered[index-1]?.id;
 await request('/api/delete',{id,revision:active.revision});audio.pause();lastDeleted=id;active=null;dirty=false;await refresh();
 $('undoDelete').hidden=false;return next;
 });if(nextId&&clips.some(c=>c.id===nextId))await open(nextId);else if(filtered.length)await open(filtered[0].id);else{$('detail').hidden=true;$('empty').hidden=false;}
};
$('undoDelete').onclick=async()=>{const id=await withBusy(async()=>{if(!lastDeleted)return;const row=await request('/api/restore',{id:lastDeleted});lastDeleted=null;$('undoDelete').hidden=true;await refresh();return row.id;});if(id)await open(id);};

$('underFiveOnly').onchange=stats;
$('conceptThreshold').onchange=stats;

$('conceptSort').onchange=stats;
