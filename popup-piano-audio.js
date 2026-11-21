(function(root){
  class PianoAudio {
    constructor(){this.context=null;this.master=null;this.buffers=new Map();this.voices=new Map();this.sustain=false;}
    unlock(){
      const Audio=root.AudioContext||root.webkitAudioContext;
      if(!Audio)throw Error('Piano audio is unavailable in this browser.');
      if(!this.context){this.context=new Audio();this.master=this.context.createGain();this.master.gain.value=.2275;this.master.connect((globalThis.MLH?.audioOutput?.(this.context) || this.context.destination));}
      return this.context.resume();
    }
    layer(midi){const layers=root.MLH_PIANO_SAMPLE_MAP?.notes?.[String(midi)]||[];return layers.find(l=>96>=l.loVel&&96<=l.hiVel)||layers.at(-1);}
    async load(midi){
      const layer=this.layer(midi);if(!layer)return null;
      if(!this.buffers.has(layer.sample)){
        const request=fetch(`./audio/piano/${encodeURIComponent(layer.sample)}`).then(r=>{if(!r.ok)throw Error('Sample unavailable');return r.arrayBuffer();}).then(b=>this.context.decodeAudioData(b)).catch(()=>{this.buffers.delete(layer.sample);return null;});
        this.buffers.set(layer.sample,request);
      }
      return this.buffers.get(layer.sample);
    }
    async press(id,midi){
      this.release(id,true);
      const voice={released:false,nodes:[],gain:null};this.voices.set(id,voice);
      try{
        await this.unlock();
        const buffer=await this.load(midi);
        if(this.voices.get(id)!==voice)return;
        const ctx=this.context,now=ctx.currentTime,gain=ctx.createGain();voice.gain=gain;
        gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.7,now+.008);gain.connect(this.master);
        if(buffer){const source=ctx.createBufferSource();source.buffer=buffer;source.playbackRate.value=this.layer(midi).rate||1;source.connect(gain);source.start();voice.nodes=[source];}
        else {
          // A local-file page may not be allowed to fetch samples. Keep it playable.
          const frequency=440*2**((midi-69)/12);
          [1,2,3].forEach((ratio,i)=>{const osc=ctx.createOscillator(),partial=ctx.createGain();osc.type=i?'sine':'triangle';osc.frequency.value=frequency*ratio;partial.gain.value=[.7,.15,.05][i];osc.connect(partial);partial.connect(gain);osc.start();voice.nodes.push(osc);});
          gain.gain.exponentialRampToValueAtTime(.15,now+.7);gain.gain.exponentialRampToValueAtTime(.0001,now+18);
        }
        if(voice.released&&!this.sustain)this.release(id,true);
        else voice.timeout=setTimeout(()=>this.release(id,true),30000);
      }catch(error){if(this.voices.get(id)===voice)this.release(id,true);throw error;}
    }
    release(id,force=false){
      const voice=this.voices.get(id);if(!voice)return;
      voice.released=true;if(this.sustain&&!force)return;
      if(!voice.gain){if(force)this.voices.delete(id);return;}
      this.voices.delete(id);clearTimeout(voice.timeout);
      const now=this.context.currentTime;voice.gain.gain.cancelScheduledValues(now);voice.gain.gain.setTargetAtTime(.0001,now,.04);voice.nodes.forEach(node=>{try{node.stop(now+.3);}catch{}});setTimeout(()=>voice.gain.disconnect(),350);
    }
    setSustain(value){this.sustain=value;if(!value)for(const [id,voice] of this.voices)if(voice.released)this.release(id,true);}
    stop(){for(const id of this.voices.keys())this.release(id,true);}
    destroy(){this.stop();if(this.context)(globalThis.MLH?.closeAudioContext?.(this.context) || this.context.close()).catch(()=>{});}
  }
  root.PopupPianoAudio=PianoAudio;
})(window);
