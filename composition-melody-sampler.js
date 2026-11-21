(function(root){
  'use strict';
  const instruments=['electricpiano','guitar','organ','strings','flute','marimba','brass','synth','pad'];
  const sustained=new Set(['organ','strings','flute','brass','synth','pad']);
  const roots=Array.from({length:21},(_,i)=>36+i*3);
  const downloads=new Map(),decoded=new Map(),contexts=new WeakMap();
  function nearest(midi){return roots.reduce((best,n)=>Math.abs(n-midi)<Math.abs(best-midi)?n:best);}
  async function prepare(ctx,instrument){
    if(instrument==='piano')return;
    if(!instruments.includes(instrument))throw Error('Unknown melody instrument.');
    if(!contexts.has(ctx))contexts.set(ctx,new Map());
    const states=contexts.get(ctx);
    if(states.has(instrument))return states.get(instrument).ready;
    const state={buffers:new Map()};states.set(instrument,state);
    state.ready=(async()=>{
      for(let i=0;i<roots.length;i+=4)await Promise.all(roots.slice(i,i+4).map(async midi=>{
        const file=instrument+'/'+midi+'.m4a';
        if(!downloads.has(file))downloads.set(file,(async()=>{
          for(let attempt=0;attempt<2;attempt++)try{
            const response=await fetch('./audio/composition-melody/'+file);
            if(!response.ok)throw Error('HTTP '+response.status);
            return await response.arrayBuffer();
          }catch(error){if(attempt===1)throw Error('Could not load the '+instrument+' samples. Try again.',{cause:error});}
        })().catch(error=>{downloads.delete(file);throw error;}));
        if(!decoded.has(file))decoded.set(file,downloads.get(file).then(bytes=>ctx.decodeAudioData(bytes.slice(0))).then(buffer=>{
          if(sustained.has(instrument)&&buffer.duration>1.5){
            const count=Math.round(buffer.sampleRate*.01),end=Math.round(buffer.sampleRate*1.5),begin=Math.round(buffer.sampleRate*.5);
            for(let channel=0;channel<buffer.numberOfChannels;channel++){
              const data=buffer.getChannelData(channel);
              for(let i=0;i<count;i++){const mix=i/(count-1);data[end-count+i]=data[end-count+i]*(1-mix)+data[begin+i]*mix;}
            }
          }
          return buffer;
        }).catch(error=>{decoded.delete(file);throw error;}));
        const buffer=await decoded.get(file);
        state.buffers.set(midi,buffer);
      }));
    })().catch(error=>{states.delete(instrument);throw error;});
    return state.ready;
  }
  function play(ctx,destination,event,start,seconds,instrument){
    const midi=nearest(event.midi),buffer=contexts.get(ctx)?.get(instrument)?.buffers.get(midi);
    if(!buffer)throw Error('The '+instrument+' samples are not ready.');
    const source=ctx.createBufferSource(),gain=ctx.createGain();
    const duration=Math.max(.035,event.duration*seconds),release=.14;
    source.buffer=buffer;source.playbackRate.value=2**((event.midi-midi)/12);
    // Recorded attacks lead into a steady portion for held wind/string/electronic tones.
    if(sustained.has(instrument)&&buffer.duration>1.5){source.loop=true;source.loopStart=.51;source.loopEnd=1.5;}
    const peak=Math.max(.0002,Math.min(1,event.velocity)*.7);
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(peak,start+.006);
    gain.gain.setValueAtTime(peak,start+duration);
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration+release);
    source.connect(gain);gain.connect(destination);source.start(start);source.stop(start+duration+release+.02);
  }
  root.MLH=root.MLH||{};
  async function preload(instrument){
    if(instrument==='piano')return;
    const ctx=new AudioContext();
    try{await prepare(ctx,instrument);}finally{await ctx.close();}
  }
  root.MLH.MelodySampler={prepare,preload,play,nearest,instruments};
})(window);
