(function (root) {
  'use strict';

  const C = () => root.MLH.ChordGenerator;
  const styles = {
    block: 'Default - held chords',
    pop: 'Pop - chords on each beat',
    rock: 'Rock - chords every two beats',
    ballad: 'Ballad - broken chords',
    arpeggio: 'Arpeggio - broken chords',
    waltz: 'Waltz - bass–chord–chord',
    broken_chords: 'Broken Chords - flowing chord tones',
    alberti_bass: 'Alberti Bass - root–fifth–third–fifth',
    rock_octaves: 'Rock Octaves - repeated root and fifth octaves',
    power_chords: 'Power Chords - root and fifth',
    stride_piano: 'Stride Piano - alternating bass and chords',
    vamp: 'Vamp - alternating bass notes and chords',
    walking_bass: 'Walking Bass - root–third–fifth bass line',
    reggae: 'Reggae - short offbeat chords',
    bossa: 'Bossa Nova - syncopated chords',
    dance: 'Dance - fast repeated chords'
  };
  function events(project) {
    project=C().validate(project);
    if(Array.isArray(project.importedParts))return project.importedParts.flatMap(part=>part.muted?[]:part.notes.map(note=>({...note,track:'imported',partId:part.id,partName:part.name,channel:part.channel,percussion:part.percussion||part.channel===9,program:note.program??part.program,velocity:note.velocity/127}))).sort((a,b)=>a.beat-b.beat);
    const chords = C().timeline(project),
      out = [],
      volumes = project.volumes || {},
      gain = k => (volumes[k] ?? 70) / 100;
    const push = (beat, duration, midi, track, velocity = 1) => out.push({
      beat,
      duration,
      midi,
      track,
      velocity: velocity * gain(track)
    });
    for (const c of chords) {
      if (c.symbol === '-' || !c.notes.length || ['silence', 'break'].includes(project.sections[c.sectionIndex].chords[c.chordIndex].type)) continue;
      c.type = project.sections[c.sectionIndex].chords[c.chordIndex].type;
      const variation = Number(project.sections[c.sectionIndex].variation) || 0;
      const style = project.style || 'pop',
        dur = c.duration;
      if (['broken_chords','alberti_bass','rock_octaves','power_chords','stride_piano','walking_bass','vamp'].includes(style)) {
        // Adapt Practice Questions' full accompaniment token patterns to this
        // chord and metre, sharing the resulting events with MIDI export.
        const chord=C().parse(c.symbol),root=48+chord.root;
        const third=root+(chord.intervals.find(n=>n>0&&n<7)??chord.intervals[1]??0);
        const fifth=root+(chord.intervals.find(n=>n===6||n===7||n===8)??chord.intervals[2]??0);
        const voicedPitch=midi=>{
          const matches=c.notes.filter(n=>(n-midi)%12===0);
          return (matches.length?matches:c.notes).reduce((best,n)=>Math.abs(n-midi)<Math.abs(best-midi)?n:best);
        };
        const bass=c.bass,compound=project.timeSignature==='6/8';
        const emit=(b,length,notes,track='chords',velocity=.8)=>{
          if((track==='chords'&&c.type==='bass')||(track==='bass'&&(c.type==='chords'||Array.isArray(project.bass))))return;
          const offset=b%1===.5?(project.swing||0)/300:0;
          const duration=Math.min(length,dur-b-offset);
          if(duration>0)for(const midi of [...new Set(notes.map(n=>track==='chords'?voicedPitch(n):n))])push(c.beat+b+offset,duration,midi,track,velocity);
        };
        if(['broken_chords','alberti_bass','rock_octaves'].includes(style)){
          const tokens=style==='broken_chords'?(compound?[root,fifth,root+12]:[root,fifth,root+12,fifth]):style==='alberti_bass'?(compound?[root,fifth,third]:[root,fifth,third,fifth]):[bass,bass,bass+7,bass+7];
          for(let b=0,i=0;b<dur;b+=.5,i++){
            const pitch=tokens[i%tokens.length];
            emit(b,.425,style==='rock_octaves'?[pitch,pitch+12]:[pitch]);
          }
          for(let b=0;b<dur;b+=compound?1.5:2)emit(b,.85,[bass],'bass');
        }else if(style==='power_chords'){
          for(let b=0;b<dur;b+=1)emit(b,.85,[bass+(b<dur/2?0:7)],'bass');
          for(let b=0;b<dur;b+=2)emit(b,.85,[root,root+7,root+12]);
        }else if(style==='stride_piano'||style==='vamp'){
          const pulse=(compound?1.5:1)/(style==='vamp'?2:1);
          for(let b=0,i=0;b<dur;b+=pulse,i++){
            if(i%2)emit(b,pulse*.85,[third,fifth,root+12]);
            else{const low=bass+(i%4===2?7:0);emit(b,pulse*.85,[low],'bass');if(style==='stride_piano')emit(b,pulse*.85,[low+12]);}
          }
        }else{
          const tones=[bass,bass+third-root,bass+fifth-root,bass+fifth-root];
          for(let b=0,i=0;b<dur;b+=compound?.5:1,i++)emit(b,compound?.425:.85,[tones[i%tones.length]],'bass');
          for(const b of compound?[.5,2]:[1,2.5])if(b<dur)emit(b,.425,[third,fifth,root+12],'chords',.65);
        }
        continue;
      }
      let pitches = c.notes.slice();
      const step = ['arpeggio', 'ballad', 'swing', 'bossa', 'reggae', 'dance'].includes(style) ? .5 : 1;
      for (let b = 0; b < dur - .001; b += step) {
        if (style === 'block' && b > 0) continue;
        if (style === 'rock' && b % 2 === 1) continue;
        if (style === 'bossa' && ![0, 1.5, 2.5].includes(b % 4)) continue;
        if (style === 'reggae' && b % 1 === 0) continue;
        const swing = (project.swing || (style === 'swing' ? 60 : 0)) / 100;
        const offset = b % 1 === .5 ? swing / 3 : 0;
        let onset = b + offset,
          length = Math.min(style === 'block' ? dur : step * .85, dur - onset);
        if (length <= 0) continue;
        if (style === 'reggae') length = .25;
        const arpeggio = ['arpeggio', 'ballad'].includes(style);
        const voicing = style === 'waltz' && (c.beat+b) % 3 === 0 ? [pitches[0]] : arpeggio ? [pitches[(Math.round(b / step) + variation) % pitches.length]] : pitches;
        if (style === 'waltz' && (c.beat+b) % 3 === 0) length = .9;
        if (onset >= dur) continue;
        if (c.type !== 'bass') voicing.forEach((n, i) => push(c.beat + onset + (project.instrument === 'guitar' ? i * .025 : 0), Math.max(.05, length), n, 'chords', .8));
      }
      if (!Array.isArray(project.bass) && c.type !== 'chords') for (let b = 0; b < dur; b += ['block', 'ballad'].includes(style) ? dur : 1) {
        const bass = project.pedal ? 36 + Number(project.key) : c.bass;
        push(c.beat + b, Math.min(style === 'block' ? dur : .85, dur - b), bass + (variation === 2 && b % 2 ? 7 : 0), 'bass', .8);
      }
    }
    const total = C().totalBeats(project),
      bar = Number((project.timeSignature || '4/4').split('/')[0]) * 4 / Number((project.timeSignature || '4/4').split('/')[1]);
    if(project.metronome)for(let b=Math.ceil(-(project.upbeatBeats||0));b<0;b++)push(b,.08,77,'click',.25);
    for (let b = 0; b < total; b += .5) {
      if (project.metronome && Number.isInteger(b)) push(b, .08, b % bar === 0 ? 84 : 77, 'click', .25);
      const current = chords.find(c => b >= c.beat && b < c.beat + c.duration);
      if (current && project.sections[current.sectionIndex].chords[current.chordIndex].type === 'break') continue;
      if (project.drums) continue;
      if (project.drumPattern) {
        for (const [row, midi] of [[0, 36], [1, 38], [2, 42]]) if (project.drumPattern[row]?.[Math.round(b * 2) % 16]) push(b, .12, midi, 'drums', midi === 42 ? .25 : .7);
        continue;
      }
      if ((project.style || 'pop') === 'block') continue;
      const swing = b % 1 === .5 ? (project.swing || (project.style === 'swing' ? 60 : 0)) / 300 : 0;
      push(b + swing, .08, 42, 'drums', .22);
      if (Number.isInteger(b)) {
        if (project.style === 'dance' || (project.style==='waltz'?b%bar===0:b % bar === 0 || b % bar === 2)) push(b, .18, 36, 'drums', .85);
        if (project.style==='waltz'?(b%bar===1||b%bar===2):(b % bar === 1 || b % bar === 3)) push(b, .14, 38, 'drums', .5);
      }
    }
    if(project.drums){for(const e of root.MLH.DrumMachine.events(project.drums,total,bar)){const current=chords.find(c=>e.beat>=c.beat&&e.beat<c.beat+c.duration);if(current&&project.sections[current.sectionIndex].chords[current.chordIndex].type==='break')continue;out.push({...e,velocity:e.velocity*gain('drums')});}}
    for (const track of ['bass','melody']) {
      const span = project[track+'Bars'] ? project[track+'Bars']*bar : total;
      for(let start=0;start<total;start+=span) for(const n of project[track]||[]) {
        if(n.beat>=span||start+n.beat>=total||n.beat<0&&start>0)continue;
        push(start+n.beat,Math.min(n.duration,span-n.beat,total-start-n.beat),n.midi,track,(n.velocity||90)/127);if(n.sourceNoteId)Object.assign(out[out.length-1],{sourceNoteId:n.sourceNoteId,tieFrom:n.tieFrom,tieTo:n.tieTo});if(track==='melody')out[out.length-1].layerId=n.layerId||'main';
      }
    }
    if(!Array.isArray(project.bass)&&project.bassBars){
      const span=project.bassBars*bar,pattern=out.filter(n=>n.track==='bass'&&n.beat<span);
      for(let i=out.length-1;i>=0;i--)if(out[i].track==='bass')out.splice(i,1);
      for(let start=0;start<total;start+=span)for(const n of pattern)if(start+n.beat<total)out.push({...n,beat:start+n.beat,duration:Math.min(n.duration,span-n.beat,total-start-n.beat)});
    }
    let result=out.map(event=>project.bassAsPiano&&event.track==='bass'?{...event,track:'chords',pianoHand:'left'}:event);
    if(Array.isArray(project.accompaniment)){
      result=result.filter(e=>e.track!=='chords'&&e.track!=='bass');
      for(const n of project.accompaniment)if(n.beat<total){
        const duration=Math.min(n.duration,total-n.beat);
        result.push({...(n.sourceNoteId?{sourceNoteId:n.sourceNoteId,tieFrom:n.tieFrom,tieTo:n.tieTo}:{}),beat:n.beat,duration:project.accompanimentSustain?Math.max(duration,Math.min(total,...project.accompaniment.filter(other=>other.midi===n.midi&&other.beat>n.beat).map(other=>other.beat))-n.beat):duration*n.gate,notatedDuration:duration,midi:n.midi,track:'chords',pianoHand:n.midi<60?'left':'right',velocity:n.velocity/127*gain('chords')});
      }
    }
    const lanes=C().melodyLanes(project);result=result.map(event=>{if(event.track!=='melody')return event;const lane=lanes.find(l=>l.id===(event.layerId||'main'))||lanes[0];return {...event,layerId:lane.id,partName:lane.name,instrument:lane.instrument,channel:lane.channel};});
    return result.sort((a, b) => a.beat - b.beat);
  }
  function accompanimentNotes(project){
    const p=C().validate(project);
    if(Array.isArray(p.accompaniment))return p.accompaniment.map(n=>({...n}));
    const gain=(p.volumes.chords||100)/100;
    const source=events(p.volumes.chords?p:{...p,volumes:{chords:100,bass:100,melody:100,drums:100}});
    return source.filter(e=>e.track==='chords'||e.track==='bass').map(e=>{
      let duration=e.duration;
      if(p.style==='reggae'&&e.pianoHand!=='left')duration=.5;
      else if(p.style!=='block')duration=Math.max(.25,Math.round(e.duration/.85*4)/4);
      return {beat:e.beat,duration,midi:e.midi,velocity:Math.max(1,Math.min(127,Math.round(e.velocity/gain*127))),gate:Math.min(1,e.duration/duration)};
    });
  }
  function tone(ctx, dest, event, start, seconds, instrument = 'piano', samples = true) {
    if (event.velocity <= 0) return;
    if(event.track==='imported'){root.MLH.GeneralMidiSampler.play(ctx,dest,event,start,seconds);return;}
    if (event.track === 'click' && root.MLH.playMetronomeClick) {
      root.MLH.playMetronomeClick(ctx, dest, start, event.midi === 84);
      return;
    }
    if(event.track==='bass' && root.MLH.BassSampler) { root.MLH.BassSampler.play(ctx,dest,event,start,seconds); return; }
    if(event.track==='drums'&&root.MLH.DrumAudio){root.MLH.DrumAudio.hit(ctx,dest,event,start);return;}
    if(['melody','chords'].includes(event.track)&&instrument!=='piano'){
      if(!root.MLH.MelodySampler)throw Error('Melody sample library is unavailable. Reload the page.');
      root.MLH.MelodySampler.play(ctx,dest,event,start,seconds,instrument);return;
    }
    const duration = Math.max(.035, event.duration * seconds),
      freq = 440 * Math.pow(2, (event.midi - 69) / 12),
      v = event.velocity;
    if (['chords','melody'].includes(event.track) && instrument === 'piano' && ctx.chordSamples?.has(event.midi)) {
      const {
          buffer,
          layer
        } = ctx.chordSamples.get(event.midi),
        source = ctx.createBufferSource(),
        g = ctx.createGain();
      source.buffer = buffer;
      source.playbackRate.value = layer.rate || 1;
      const peak = Math.min(.55, .045 * v * 4 * (layer.gain || 1));
      g.gain.setValueAtTime(.0001, start);
      g.gain.exponentialRampToValueAtTime(Math.max(.0002, peak), start + .012);
      g.gain.setValueAtTime(Math.max(.0002, peak * .94), start + Math.max(.04, duration));
      g.gain.exponentialRampToValueAtTime(.0001, start + duration + .16);
      source.connect(g);
      g.connect(dest);
      source.start(start);
      source.stop(start + duration + .22);
      return;
    }
    if (['chords','melody'].includes(event.track) && instrument === 'piano' && samples) {
      root.MLH.playPianoFrequency(ctx, dest, freq, start, duration, .045 * v);
      return;
    }
    const gain = ctx.createGain();
    gain.connect(dest);
    if (event.track === 'drums' && event.midi !== 36) {
      const size = Math.ceil(ctx.sampleRate * .2),
        buffer = ctx.createBuffer(1, size, ctx.sampleRate),
        data = buffer.getChannelData(0);
      let seed = 19;
      for (let i = 0; i < size; i++) {
        seed = seed * 16807 % 2147483647;
        data[i] = seed / 2147483647 * 2 - 1;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = event.midi === 42 ? 7000 : 1400;
      source.connect(filter);
      filter.connect(gain);
      gain.gain.setValueAtTime(.22 * v, start);
      gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
      source.start(start);
      source.stop(start + duration + .01);
      return;
    }
    const osc = ctx.createOscillator();
    osc.type = event.track === 'bass' ? 'triangle' : ['organ', 'flute', 'marimba'].includes(instrument) ? 'sine' : ['synth', 'strings', 'brass', 'pad'].includes(instrument) ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(event.track === 'drums' ? 140 : freq, start);
    if (event.track === 'drums') osc.frequency.exponentialRampToValueAtTime(42, start + .12);
    if (['strings', 'brass', 'pad', 'electricpiano'].includes(instrument)) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = instrument === 'brass' ? 1800 : instrument === 'pad' ? 700 : 2600;
      osc.connect(filter);
      filter.connect(gain);
    } else osc.connect(gain);
    const peak = (event.track === 'bass' ? .18 : .085) * v;
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + .008);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002, peak * .3), start + Math.max(.02, duration * .6));
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration + .1);
    osc.start(start);
    osc.stop(start + duration + .12);
    if (instrument === 'piano' && event.track === 'chords') {
      const partial = ctx.createOscillator();
      partial.type = 'sine';
      partial.frequency.value = freq * 2;
      const pg = ctx.createGain();
      pg.gain.value = .25;
      partial.connect(pg);
      pg.connect(gain);
      partial.start(start);
      partial.stop(start + duration + .12);
    }
  }
  function effects(ctx, project) {
    const input = ctx.createGain();
    input.gain.value = .75;
    input.connect((globalThis.MLH?.audioOutput?.(ctx) || ctx.destination));
    if (project.reverb) {
      const convolver = ctx.createConvolver(),
        length = ctx.sampleRate * 1.8,
        impulse = ctx.createBuffer(2, length, ctx.sampleRate);
      let seed = 27;
      for (let c = 0; c < 2; c++) {
        const a = impulse.getChannelData(c);
        for (let i = 0; i < length; i++) {
          seed = seed * 16807 % 2147483647;
          a[i] = (seed / 2147483647 * 2 - 1) * Math.pow(1 - i / length, 3);
        }
      }
      convolver.buffer = impulse;
      const wet = ctx.createGain();
      wet.gain.value = project.reverb / 250;
      input.connect(convolver);
      convolver.connect(wet);
      wet.connect((globalThis.MLH?.audioOutput?.(ctx) || ctx.destination));
    }
    if (project.echo) {
      const delay = ctx.createDelay(2),
        feedback = ctx.createGain(),
        wet = ctx.createGain();
      delay.delayTime.value = 60 / project.tempo * .75;
      feedback.gain.value = .27;
      wet.gain.value = .22;
      input.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wet);
      wet.connect((globalThis.MLH?.audioOutput?.(ctx) || ctx.destination));
    }
    return input;
  }
  class Player {
    constructor() {
      this.token = 0;
      this.playing = false;
    }
    stop() {
      this.output?.clear?.();
      if (this.output) for (let c = 0; c < 16; c++) {
        this.output.send([0xb0 | c, 123, 0]);
        this.output.send([0xb0 | c, 120, 0]);
      }
      this.token++;
      this.playing = false;
      clearInterval(this.timer);
      cancelAnimationFrame(this.frame);
      if (this.context) {
        const ctx = this.context;
        this.context = null;
        (globalThis.MLH?.closeAudioContext?.(ctx) || ctx.close()).catch(() => {});
      }
    }
    async play(project, onPosition, onEnd, options = {}) {
      project = {...project,countIn:!!options.recording,metronome:!!options.recording};
      this.stop();
      const token = this.token;
      const ctx = new AudioContext();
      this.context = ctx;
      await ctx.resume();
      if(token!==this.token)return;
      if (!project.importedParts && !project.bassAsPiano && root.MLH.BassSampler) await root.MLH.BassSampler.prepare(ctx);
      if(!project.importedParts&&project.melodyInstrument&&project.melodyInstrument!=='piano')await root.MLH.MelodySampler.prepare(ctx,project.melodyInstrument);
      if(!project.importedParts&&project.accompanimentInstrument&&project.accompanimentInstrument!=='piano')await root.MLH.MelodySampler.prepare(ctx,project.accompanimentInstrument);
      if (!project.importedParts && root.MLH.DrumAudio?.prepare) await root.MLH.DrumAudio.prepare(ctx);
      for(const instrument of new Set((options.events||events(project)).filter(e=>['chords','melody'].includes(e.track)).map(e=>e.instrument).filter(i=>i&&i!=='piano')))await root.MLH.MelodySampler.prepare(ctx,instrument);
      let list = options.events||events(project);
      if(list.some(e=>e.track==='imported'))await root.MLH.GeneralMidiSampler.prepare(ctx,list.filter(e=>e.track==='imported'));
      if(token!==this.token)return;
      const seconds = 60 / project.tempo,
        total = C().totalBeats(project),
        bar = Number(project.timeSignature.split('/')[0]) * 4 / Number(project.timeSignature.split('/')[1]);
      const master = effects(ctx, project),
        at = b => C().secondsAtBeat(project, b),
        minimum=-(project.upbeatBeats||0),minimumSeconds=at(minimum),songSeconds = at(total)-minimumSeconds;
      if (root.MLH.prepareAudioPlayback && (project.instrument === 'piano' || project.countIn || project.metronome)) await root.MLH.prepareAudioPlayback(ctx, {
        piano: project.instrument === 'piano' ? [...new Set(list.filter(e => ['chords','melody'].includes(e.track)).map(e => e.midi))].map(n => 440 * Math.pow(2, (n - 69) / 12)) : [],
        metronome: project.countIn || project.metronome
      });
      if (token !== this.token) return;
      const playFrom=Math.max(minimum,Math.min(total-.00001,options.startBeat==null?minimum:Number(options.startBeat)||0));
      const count = project.countIn ? bar+(project.upbeatBeats?bar-project.upbeatBeats:0) : 0,
        start = ctx.currentTime + .08 + count * seconds-at(playFrom);
      for (let b = 0; b < count; b++) tone(ctx, master, {
        midi: b % bar === 0 ? 84 : 77,
        duration: .08,
        track: 'click',
        velocity: .4
      }, start+at(playFrom) + (b - count) * seconds, seconds, 'sine', false);
      this.startedAt = start;this.playbackAt=start+at(playFrom);this.minimumSeconds=minimumSeconds;
      this.seconds = seconds;
      this.total = total;
      this.project = project;
      this.songSeconds = songSeconds;
      this.playing = true;
      let cursor = list.findIndex(e=>e.beat>=playFrom),
        loop = 0;
      if(cursor<0)cursor=list.length;
      if(playFrom>minimum)for(const event of list.filter(e=>e.beat<playFrom&&e.beat+e.duration>playFrom&&!e.percussion&&e.track!=='drums')){const pickup={...event,beat:playFrom,duration:event.beat+event.duration-playFrom};tone(ctx,master,pickup,start+at(playFrom),(at(pickup.beat+pickup.duration)-at(pickup.beat))/pickup.duration,pickup.instrument||(pickup.track==='melody'?project.melodyInstrument:project.accompanimentInstrument)||project.instrument);}
      const refresh=()=>{if(token!==this.token||!this.playing)return;list=events(project);const elapsed=ctx.currentTime-start;loop=Math.max(0,Math.floor((elapsed-minimumSeconds)/songSeconds));const safeBeat=C().beatAtSeconds(project,Math.max(minimumSeconds,elapsed-loop*songSeconds)+.16);cursor=list.findIndex(e=>e.beat>=safeBeat);if(cursor<0)cursor=list.length;};
      let instrumentRequest=0;
      this.setMelodyInstrument=async (instrument,layerId='main')=>{const request=++instrumentRequest;await root.MLH.MelodySampler.prepare(ctx,instrument);if(token===this.token&&request===instrumentRequest){if(layerId==='main')project.melodyInstrument=instrument;else project.counterMelodies=project.counterMelodies.map(p=>p.id===layerId?{...p,instrument}:p);refresh();}};
      this.refreshDrums=drums=>{project.drums=drums;refresh();};
      this.refreshNotes=(track,notes)=>{if(!['bass','melody'].includes(track))return;project[track]=notes==null?null:notes.map(note=>({...note}));refresh();};
      const schedule = () => {
        if (token !== this.token) return;
        while (cursor < list.length && start + at(list[cursor].beat) + loop * songSeconds < ctx.currentTime + .15) {
          const e = list[cursor++],
            when = start + at(e.beat) + loop * songSeconds,
            noteSeconds = (at(e.beat + e.duration) - at(e.beat)) / e.duration;
          if(when+e.duration*noteSeconds<ctx.currentTime)continue;
          if (this.output && e.track !== 'click' && e.velocity > 0) {
            const channel = e.channel??{
                chords: 0,
                bass: 1,
                melody: 2,
                drums: 9
              }[e.track]??e.channel,
              stamp = performance.now() + Math.max(0, when - ctx.currentTime) * 1000;
            if(e.track==='imported')this.output.send([0xc0|channel,e.program],stamp);
            this.output.send([0x90 | channel, e.midi, Math.max(1, Math.round(e.velocity * 127))], stamp);
            this.output.send([0x80 | channel, e.midi, 0], stamp + e.duration * noteSeconds * 1000);
          }
          tone(ctx, master, e, when, noteSeconds, e.instrument||(e.track==='melody'?(project.melodyInstrument||'piano'):e.track==='chords'?(project.accompanimentInstrument||project.instrument):project.instrument));
        }
        if (cursor === list.length && project.loop && ctx.currentTime >= start + minimumSeconds+(loop + 1) * songSeconds - .15) {
          cursor = Math.max(0,list.findIndex(e=>e.beat>=minimum));
          loop++;
        }
        if (!project.loop && ctx.currentTime >= start + minimumSeconds+songSeconds + .2) {
          this.stop();
          onEnd?.();
        }
      };
      const visual = () => {
        if (token !== this.token) return;
        const elapsed = ctx.currentTime - start,
          beat = !options.recording&&elapsed<at(playFrom)?playFrom:elapsed<minimumSeconds?C().beatAtSeconds(project,elapsed):C().beatAtSeconds(project,minimumSeconds+(elapsed-minimumSeconds)%songSeconds);
        onPosition?.(beat);
        this.frame = requestAnimationFrame(visual);
      };
      schedule();
      this.timer = setInterval(schedule, 25);
      visual();
    }
    get beat() {
      if (!this.playing || !this.context) return 0;
      const elapsed=this.context.currentTime-this.startedAt,minimum=this.minimumSeconds||0;return C().beatAtSeconds(this.project,elapsed<minimum?elapsed:minimum+(elapsed-minimum)%this.songSeconds);
    }
  }
  let heldPreviewContext;
  const heldPreviewSounds = new Map();
  function previewEngine() {
    if (!heldPreviewContext || heldPreviewContext.state === 'closed') {
      heldPreviewContext = new AudioContext({latencyHint:'interactive'});
      heldPreviewSounds.clear();
    }
    return heldPreviewContext;
  }
  function prepareHeldPreview(notes,instrument='piano') {
    const ctx=previewEngine();
    const resumed=ctx.state==='running'?Promise.resolve():ctx.resume();
    const keys=instrument==='piano'?notes.map(midi=>`piano:${midi}`):[instrument];
    const missing=keys.filter(key=>!heldPreviewSounds.has(key));
    if(missing.length){
      const state={ready:false,promise:null};
      state.promise=Promise.resolve(resumed).then(()=>instrument==='piano'?root.MLH.prepareAudioPlayback(ctx,{piano:missing.map(key=>440*Math.pow(2,(Number(key.split(':')[1])-69)/12))}):root.MLH.MelodySampler.prepare(ctx,instrument)).then(()=>{state.ready=true;}).catch(error=>{for(const key of missing)if(heldPreviewSounds.get(key)===state)heldPreviewSounds.delete(key);throw error;});
      missing.forEach(key=>heldPreviewSounds.set(key,state));
    }
    return Promise.all([resumed,...new Set(keys.map(key=>heldPreviewSounds.get(key).promise))]);
  }
  function previewHeld(notes,instrument='piano'){
    const ctx=previewEngine(),gain=ctx.createGain();gain.connect((globalThis.MLH?.audioOutput?.(ctx) || ctx.destination));
    let released=false,started=false;
    const fade=at=>{gain.gain.setTargetAtTime(.0001,at,.02);setTimeout(()=>gain.disconnect?.(),Math.max(0,(at-ctx.currentTime)*1000)+150);};
    const release=()=>{if(released)return;released=true;if(started&&ctx.state!=='closed')fade(ctx.currentTime);};
    const start=()=>{if(ctx.state==='closed')return;const at=ctx.currentTime+.005;notes.forEach(midi=>tone(ctx,gain,{midi,duration:32,track:'melody',velocity:120/127},at,1,instrument));started=true;if(released)fade(at+.04);};
    const keys=instrument==='piano'?notes.map(midi=>`piano:${midi}`):[instrument];
    let ready;
    if(ctx.state==='running'&&keys.every(key=>heldPreviewSounds.get(key)?.ready)){
      try{start();ready=Promise.resolve();}catch(error){ready=Promise.reject(error);}
    }else ready=prepareHeldPreview(notes,instrument).then(start);
    ready=ready.catch(error=>{gain.disconnect?.();throw error;});
    return {release,ready};
  }
  async function preview(notes, instrument = 'piano', track = 'chords') {
    const ctx = new AudioContext();
    await ctx.resume();
    if (track === 'bass' && root.MLH.BassSampler) await root.MLH.BassSampler.prepare(ctx);
    if(['melody','chords'].includes(track)&&instrument!=='piano')await root.MLH.MelodySampler.prepare(ctx,instrument);
    if (instrument === 'piano' && track!=='bass') await root.MLH.prepareAudioPlayback(ctx, {
      piano: notes.map(n => 440 * Math.pow(2, (n - 69) / 12))
    });
    notes.forEach(n => tone(ctx, ctx.destination, {
      midi: n,
      duration: .7,
      track,
      velocity: track==='melody'?120/127:.7
    }, ctx.currentTime + .01, 1, instrument));
    setTimeout(() => (globalThis.MLH?.closeAudioContext?.(ctx) || ctx.close()).catch(() => {}), 1300);
  }
  async function wav(project, options = {}) {
    const seconds = 60 / project.tempo,
      at = b => C().secondsAtBeat(project, b),
      pickupSeconds=-at(-(project.upbeatBeats||0)),total = at(C().totalBeats(project))+pickupSeconds + 2;
    if (total > 600) throw Error('Please shorten the arrangement to ten minutes or less for audio export.');
    const ctx = new OfflineAudioContext(2, Math.ceil(total * 44100), 44100),
      master = effects(ctx, project);
    const list = options.events||events(project);
    if(list.some(e=>e.track==='imported'))await root.MLH.GeneralMidiSampler.prepare(ctx,list.filter(e=>e.track==='imported'));
    if (!project.importedParts && root.MLH.DrumAudio?.prepare) await root.MLH.DrumAudio.prepare(ctx);
    if (!project.importedParts && !project.bassAsPiano && root.MLH.BassSampler) await root.MLH.BassSampler.prepare(ctx);
    if(!project.importedParts&&project.melodyInstrument&&project.melodyInstrument!=='piano')await root.MLH.MelodySampler.prepare(ctx,project.melodyInstrument);
      if(!project.importedParts&&project.accompanimentInstrument&&project.accompanimentInstrument!=='piano')await root.MLH.MelodySampler.prepare(ctx,project.accompanimentInstrument);
    const instrumentFor=e=>e.instrument||(e.track==='melody'?(project.melodyInstrument||'piano'):e.track==='chords'?(project.accompanimentInstrument||project.instrument||'piano'):project.instrument);
    for(const instrument of new Set(list.filter(e=>['chords','melody'].includes(e.track)).map(instrumentFor).filter(i=>i!=='piano')))await root.MLH.MelodySampler.prepare(ctx,instrument);
    if (list.some(e=>['chords','melody'].includes(e.track)&&instrumentFor(e)==='piano')) {
      ctx.chordSamples = new Map();
      const map = root.MLH_PIANO_SAMPLE_MAP;
      const buffers = new Map();
      await Promise.all([...new Set(list.filter(e => ['chords','melody'].includes(e.track)).map(e => e.midi))].map(async midi => {
        const layers = map?.notes?.[String(midi)] || [],
          layer = layers.find(l => 96 >= l.loVel && 96 <= l.hiVel) || layers.at(-1);
        if (!layer) return;
        try {
          if (!buffers.has(layer.sample)) buffers.set(layer.sample, fetch('./audio/piano/' + encodeURIComponent(layer.sample)).then(r => {
            if (!r.ok) throw Error('Sample unavailable');
            return r.arrayBuffer();
          }).then(b => ctx.decodeAudioData(b)));
          ctx.chordSamples.set(midi, {
            layer,
            buffer: await buffers.get(layer.sample)
          });
        } catch (e) {}
      }));
    }
    list.forEach(e => tone(ctx, master, e, pickupSeconds+at(e.beat), (at(e.beat + e.duration) - at(e.beat)) / e.duration, instrumentFor(e), false));
    const buffer = await ctx.startRendering();
    const bytes = new ArrayBuffer(44 + buffer.length * 4),
      view = new DataView(bytes),
      str = (p, s) => [...s].forEach((c, i) => view.setUint8(p + i, c.charCodeAt(0)));
    str(0, 'RIFF');
    view.setUint32(4, bytes.byteLength - 8, true);
    str(8, 'WAVE');
    str(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 2, true);
    view.setUint32(24, 44100, true);
    view.setUint32(28, 176400, true);
    view.setUint16(32, 4, true);
    view.setUint16(34, 16, true);
    str(36, 'data');
    view.setUint32(40, buffer.length * 4, true);
    for (let i = 0; i < buffer.length; i++) for (let ch = 0; ch < 2; ch++) view.setInt16(44 + (i * 2 + ch) * 2, Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i])) * 32767, true);
    return new Blob([bytes], {
      type: 'audio/wav'
    });
  }
  root.MLH.ChordAudio = {
    styles,
    events,
    accompanimentNotes,
    Player,
    preview,
    previewHeld,
    prepareHeldPreview,
    wav
  };
})(window);
