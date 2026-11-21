(function (root) {
  'use strict';

  // AVL Black Pearl acoustic samples for the ten visible drum-machine parts.
  const sampleNotes = [36,38,42,44,46,51,49,50,47,45];
  const sampleBuffers = new Map(), sampleContexts = new WeakMap();
  async function downloadSample(name,ctx) {
    for(let attempt=0;attempt<2;attempt++){
      try {
        const response=await fetch('./audio/composition-drums/'+name);
        if(!response.ok)throw Error('Drum sample unavailable: '+name);
        const bytes=await response.arrayBuffer();
        return await ctx.decodeAudioData(bytes);
      } catch(error) {
        if(attempt===1)throw new Error('Could not load the drum sound '+name+'. Try Play again.',{cause:error});
      }
    }
  }
  async function prepare(ctx) {
    if (sampleContexts.has(ctx)) return sampleContexts.get(ctx).ready;
    const state = {buffers:new Map()};
    sampleContexts.set(ctx,state);
    const names=sampleNotes.flatMap(midi=>[1,2,3,4,5].map(layer=>`${midi}_v${layer}.m4a`));
    state.ready=(async()=>{
      // Load a few files at a time instead of flooding the server with the kit.
      for(let offset=0;offset<names.length;offset+=4){
        await Promise.all(names.slice(offset,offset+4).map(async name=>{
          if(!sampleBuffers.has(name))sampleBuffers.set(name,downloadSample(name,ctx).catch(error=>{sampleBuffers.delete(name);throw error;}));
          state.buffers.set(name,await sampleBuffers.get(name));
        }));
      }
    })().catch(error=>{sampleContexts.delete(ctx);throw error;});
    return state.ready;
  }
  function sampledHit(ctx,dest,event,start) {
    if (!sampleNotes.includes(event.midi)) return false;
    const v = Math.max(0,Math.min(1,event.velocity)), layer = Math.min(5,Math.floor(v*5)+1);
    const buffer = sampleContexts.get(ctx)?.buffers.get(`${event.midi}_v${layer}.m4a`);
    if (!buffer) return false;
    const source = ctx.createBufferSource(), output = ctx.createGain(), pan = ctx.createStereoPanner();
    source.buffer = buffer;
    source.playbackRate.value = Math.pow(2,(event.pitch||0)/12);
    output.gain.value = v*.7;
    pan.pan.value = Math.max(-1,Math.min(1,event.pan||0));
    if ([42,44,46].includes(event.midi) && openHats.has(ctx)) openHats.get(ctx).gain.setTargetAtTime(.0001,start,.01);
    if (event.midi===46) openHats.set(ctx,output);
    source.connect(output);output.connect(pan);pan.connect(dest);
    source.start(start);source.stop(start+buffer.duration/source.playbackRate.value+.01);
    return true;
  }
  // Synthesis remains a fallback for unavailable samples and legacy non-kit notes.
  const noiseCache = new WeakMap(),
    openHats = new WeakMap();
  function noise(ctx) {
    if (noiseCache.has(ctx)) return noiseCache.get(ctx);
    const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate),
      d = b.getChannelData(0);
    let seed = 31;
    for (let i = 0; i < d.length; i++) {
      seed = seed * 16807 % 2147483647;
      d[i] = seed / 2147483647 * 2 - 1;
    }
    noiseCache.set(ctx, b);
    return b;
  }
  function hit(ctx, dest, event, start) {
    if (event.velocity <= 0) return;
    if (sampledHit(ctx,dest,event,start)) return;
    const electronic = event.kit === 'electronic',
      rate = Math.pow(2, (event.pitch || 0) / 12),
      v = Math.max(0, Math.min(1, event.velocity));
    if (!v) return;
    const output = ctx.createGain();
    output.gain.value = v * .7;
    if ([42, 44, 46].includes(event.midi) && openHats.has(ctx)) openHats.get(ctx).gain.setTargetAtTime(.0001, start, .01);
    if (event.midi === 46) openHats.set(ctx, output);
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.max(-1, Math.min(1, event.pan || 0));
    output.connect(pan);
    pan.connect(dest);
    const envelope = (duration, peak = 1) => {
      const g = ctx.createGain();
      g.gain.setValueAtTime(.0001, start);
      g.gain.linearRampToValueAtTime(peak, start + .002);
      g.gain.exponentialRampToValueAtTime(.0001, start + duration);
      g.connect(output);
      return g;
    };
    const tone = (freq, end, duration, peak = 1, type = 'sine') => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(freq * rate, start);
      if (end) o.frequency.exponentialRampToValueAtTime(end * rate, start + Math.min(.1, duration));
      o.connect(envelope(duration, peak));
      o.start(start);
      o.stop(start + duration + .01);
    };
    const hiss = (duration, cut, peak = 1, type = 'highpass') => {
      const source = ctx.createBufferSource(),
        f = ctx.createBiquadFilter();
      source.buffer = noise(ctx);
      source.playbackRate.value = rate;
      f.type = type;
      f.frequency.value = cut;
      f.Q.value = .7;
      source.connect(f);
      f.connect(envelope(duration, peak));
      source.start(start);
      source.stop(start + duration + .01);
    };
    switch (event.midi) {
      case 36:
        tone(electronic ? 160 : 135, 42, electronic ? .55 : .35, 1.1);
        hiss(.018, 2500, .16);
        break;
      case 38:
        hiss(electronic ? .24 : .18, 1700, .75, 'highpass');
        tone(185, 130, .1, .3, 'triangle');
        if (!electronic) tone(330, 290, .055, .12);
        break;
      case 37:
        tone(900, 650, .035, .55, 'triangle');
        tone(1650, 1200, .025, .24);
        break;
      case 42:
        hiss(.06, 7500, .42);
        break;
      case 44:
        hiss(.11, 6200, .3);
        break;
      case 46:
        hiss(.48, 6500, .35);
        tone(8100, null, .15, .025, 'square');
        break;
      case 49:
        hiss(1.5, 4200, .4);
        [3700, 5100, 6900].forEach(f => tone(f, null, .8, .025, 'square'));
        break;
      case 51:
        hiss(.65, 6000, .18);
        [2700, 4100, 6100].forEach(f => tone(f, null, .5, .045, 'triangle'));
        break;
      case 53:
        [2100, 3500, 4700].forEach((f, i) => tone(f, null, .65, .13 / (i + 1)));
        break;
      case 50:
      case 47:
      case 45:
        {
          const f = {
            50: 230,
            47: 175,
            45: 120
          }[event.midi];
          tone(f * 1.5, f, .3, .7);
          tone(f * 1.99, f * 1.9, .12, .15);
          hiss(.025, 1500, .15);
          break;
        }
      default:
        hiss(.08, 7000, .25);
    }
  }
  let previewContext;
  const readyPreviews = new WeakSet();
  async function preview(event) {
    if (!previewContext || previewContext.state === 'closed') previewContext = new AudioContext();
    const ctx = previewContext;
    if (ctx.state !== 'running') await ctx.resume();
    if (!readyPreviews.has(ctx)) {
      await prepare(ctx);
      readyPreviews.add(ctx);
    }
    // Each tap owns a source; earlier hits keep their natural tails.
    hit(ctx, ctx.destination, event, ctx.currentTime + .005);
  }
  root.MLH.DrumAudio = {
    prepare,
    hit,
    preview
  };
})(window);
