(function (root) {
  'use strict';
  const regions = [
    {name:'Gs0', root:20, high:26}, {name:'Ds1', root:27, high:31},
    {name:'Gs1', root:32, high:36}, {name:'Cs2', root:37, high:40},
    {name:'F2', root:41, high:127}
  ];
  const downloads = new Map(), decoded = new Map(), contexts = new WeakMap();
  function regionFor(midi) { return regions.find(region => midi <= region.high); }
  function file(region, take, layer) { return `${region.name}_${take}_${layer}.m4a`; }
  async function downloadSample(name) {
    for(let attempt=0;attempt<2;attempt++){
      try {
        const response=await fetch('./audio/composition-bass/'+name);
        if(!response.ok)throw Error('Bass sample unavailable: '+name);
        return await response.arrayBuffer();
      } catch(error) {
        if(attempt===1)throw new Error('Could not load the bass sound '+name+'. Try Play again.',{cause:error});
      }
    }
  }
  async function prepare(ctx) {
    if (contexts.has(ctx)) return contexts.get(ctx).ready;
    const state = {buffers:new Map(), take:0};
    contexts.set(ctx, state);
    const names=regions.flatMap(region=>[1,2,3,4].flatMap(take=>[1,2].map(layer=>file(region,take,layer))));
    state.ready = (async()=>{
      // Keep local servers and browsers from receiving forty requests at once.
      for(let offset=0;offset<names.length;offset+=4){
        await Promise.all(names.slice(offset,offset+4).map(async name=>{
          if(!downloads.has(name))downloads.set(name,downloadSample(name).catch(error=>{downloads.delete(name);throw error;}));
          if(!decoded.has(name))decoded.set(name,downloads.get(name).then(bytes=>ctx.decodeAudioData(bytes.slice(0))).catch(error=>{decoded.delete(name);throw error;}));
          state.buffers.set(name,await decoded.get(name));
        }));
      }
    })().catch(error=>{contexts.delete(ctx);throw error;});
    return state.ready;
  }
  function play(ctx, destination, event, start, seconds) {
    const midi = event.midi - 12;
    const state = contexts.get(ctx), region = regionFor(midi);
    if (!state || !region) throw Error('Bass samples are not ready.');
    const velocity = Math.min(1, Math.max(0, event.velocity)) * .85;
    const layer = velocity * 127 < 64 ? 1 : 2;
    const buffer = state.buffers.get(file(region, state.take++ % 4 + 1, layer));
    if (!buffer) throw Error('Bass samples are not ready.');
    const source = ctx.createBufferSource(), gain = ctx.createGain();
    const duration = Math.max(.035,event.duration * seconds), peak = Math.max(.0002,velocity * .65);
    source.buffer = buffer;
    source.playbackRate.value = Math.pow(2,(midi-region.root)/12);
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(peak,start+.004);
    gain.gain.setValueAtTime(peak,start+duration);
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration+.1);
    source.connect(gain); gain.connect(destination);
    source.start(start); source.stop(start+duration+.12);
  }
  root.MLH = root.MLH || {};
  root.MLH.BassSampler = {prepare,play,regionFor};
})(window);
