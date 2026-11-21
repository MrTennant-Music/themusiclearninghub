/* General MIDI timbres for imported parts. Soundfont data is parsed, never executed.
   FluidR3 GM (CC BY 3.0), hosted by gleitz/midi-js-soundfonts and
   surikov/webaudiofontdata. Attribution is displayed in the imported-parts viewer. */
(function(root){
 const banks=new Map(),decoded=new Map(),contexts=new WeakMap();
 const key=e=>e.percussion?'drum-'+e.midi:'gm-'+e.program;
 const midi=name=>{const m=/^([A-G])([b#]?)(-?\d+)$/.exec(name);return m?(Number(m[3])+1)*12+{C:0,D:2,E:4,F:5,G:7,A:9,B:11}[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0):null;};
 async function bank(event){
  const id=key(event);if(!banks.has(id))banks.set(id,(async()=>{
   if(event.percussion){
    const response=await fetch(`https://surikov.github.io/webaudiofontdata/sound/128${event.midi}_0_FluidR3_GM_sf2_file.js`);if(!response.ok)throw Error(`Could not load MIDI percussion note ${event.midi}.`);
    const text=await response.text(),file=/\bfile\s*:\s*'([A-Za-z0-9+/=]+)'/.exec(text)?.[1];if(!file)throw Error('Invalid percussion soundfont.');return [{midi:event.midi,data:file}];
   }
   const slug=root.MLH.ChordGenerator.gmNames[event.program];
   const response=await fetch(`https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/${slug}-mp3.js`);if(!response.ok)throw Error(`Could not load ${root.MLH.ChordGenerator.gmName(event.program)}.`);
   const match=/MIDI\.Soundfont\.[\w]+\s*=\s*(\{[\s\S]*\})\s*;?\s*$/.exec(await response.text());if(!match)throw Error('Invalid instrument soundfont.');
   return Object.entries(JSON.parse(match[1].replace(/,\s*}/g,'}'))).map(([name,value])=>({midi:midi(name),data:typeof value==='string'?value.split(',')[1]:null})).filter(n=>n.midi!==null&&n.data);
  })().catch(error=>{banks.delete(id);throw error;}));return banks.get(id);
 }
 async function prepare(ctx,events){
  if(!contexts.has(ctx))contexts.set(ctx,new Map());const state=contexts.get(ctx),needed=new Map();
  events.forEach(e=>{const id=key(e);if(!needed.has(id))needed.set(id,[]);needed.get(id).push(e);});
  const groups=[...needed.values()];
  for(let i=0;i<groups.length;i+=4)await Promise.all(groups.slice(i,i+4).map(async list=>{
   const samples=await bank(list[0]),id=key(list[0]);if(!samples.length)throw Error('This MIDI instrument has no samples.');
   const notes=[...new Set(list.map(e=>e.midi))];for(let j=0;j<notes.length;j+=6)await Promise.all(notes.slice(j,j+6).map(async note=>{
    const sample=samples.reduce((best,n)=>Math.abs(n.midi-note)<Math.abs(best.midi-note)?n:best),cache=id+':'+sample.midi;
    if(!decoded.has(cache))decoded.set(cache,(async()=>{const raw=atob(sample.data),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));return ctx.decodeAudioData(bytes.buffer);})().catch(error=>{decoded.delete(cache);throw error;}));
    state.set(id+':'+note,{buffer:await decoded.get(cache),midi:sample.midi});
   }));
  }));
 }
 function play(ctx,dest,event,start,seconds){
  const sample=contexts.get(ctx)?.get(key(event)+':'+event.midi);if(!sample)throw Error('The imported MIDI instrument is not ready.');
  const source=ctx.createBufferSource(),gain=ctx.createGain(),duration=event.percussion?sample.buffer.duration:Math.max(.035,event.duration*seconds),peak=Math.max(.0001,event.velocity*.28);
  source.buffer=sample.buffer;source.playbackRate.value=2**((event.midi-sample.midi)/12);
  if(!event.percussion&&event.program>=16&&event.program<104&&!(event.program>=24&&event.program<40)&&sample.buffer.duration>1.5){source.loop=true;source.loopStart=.4;source.loopEnd=Math.min(1.2,sample.buffer.duration-.15);}
  gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(peak,start+.006);gain.gain.setValueAtTime(peak,start+duration);gain.gain.exponentialRampToValueAtTime(.0001,start+duration+.12);
  source.connect(gain);gain.connect(dest);source.start(start);source.stop(start+duration+.14);
 }
 root.MLH.GeneralMidiSampler={prepare,play};
})(window);
