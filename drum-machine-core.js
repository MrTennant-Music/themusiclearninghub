(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.MLH = root.MLH || {};
    root.MLH.DrumMachine = api;
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const tracks = [{
    id: 'kick',
    name: 'Bass Drum',
    midi: 36,
    key: '1'
  }, {
    id: 'snare',
    name: 'Snare',
    midi: 38,
    key: '2'
  }, {
    id: 'hat',
    name: 'Hi-Hat',
    midi: 42,
    key: '4'
  }, {
    id: 'openHat',
    name: 'Open Hi-Hat',
    midi: 46,
    key: '5'
  }, {
    id: 'pedalHat',
    name: 'Pedal Hi-Hat',
    midi: 44,
    key: '6'
  }, {
    id: 'ride',
    name: 'Ride',
    midi: 51,
    key: '7'
  }, {
    id: 'crash',
    name: 'Crash',
    midi: 49,
    key: '9'
  }, {
    id: 'tomHigh',
    name: 'High Tom',
    midi: 50,
    key: 'q'
  }, {
    id: 'tomMid',
    name: 'Mid Tom',
    midi: 47,
    key: 'w'
  }, {
    id: 'tomLow',
    name: 'Floor Tom',
    midi: 45,
    key: 'e'
  }];
  const kits = {
    acoustic: 'Acoustic',
    electronic: 'Electronic'
  };
  const presets = {
    rock: 'Rock',
    pop: 'Pop',
    funk: 'Funk',
    house: 'House',
    waltz: 'Waltz',
    sixEight:'6/8',
    hiphop: 'Hip-hop'
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const fail = message => {
    throw new Error(message);
  };
  function metre(value) {
    const beats = Number(value);
    if (!Number.isFinite(beats) || beats < 1 || beats > 12 || !Number.isInteger(beats * 2)) fail('Invalid drum-machine metre.');
    return beats;
  }
  function stepCount(bars, subdivision, beatsPerBar) {
    const count = bars * subdivision * metre(beatsPerBar);
    if (!Number.isInteger(count) || count < 1 || count > 768) fail('This subdivision does not fit the selected metre.');
    return count;
  }
  function blankPattern(name, bars, subdivision, beatsPerBar) {
    const count = stepCount(bars, subdivision, beatsPerBar);
    return {
      name,
      bars,
      tracks: tracks.map(track => ({
        id: track.id,
        volume: 100,
        pan: 0,
        mute: false,
        solo: false,
        steps: Array(count).fill(0)
      }))
    };
  }
  function create(beatsPerBar = 4) {
    return {
      version: 1,
      kit: 'acoustic',
      subdivision: 4,
      patterns: [blankPattern('Pattern 1', 1, 4, beatsPerBar)],
      sequence: [{
        pattern: 0,
        repeats: 1
      }],
      swing: 0,
      pitch: 0,
      humanize: 0
    };
  }
  function validateDrums(value, beatsPerBar = 4) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Invalid drum-machine project.');
    const out = clone(value);
    if(out.studioMain!==undefined&&(!out.studioMain||tracks.some(t=>!Array.isArray(out.studioMain[t.id])||out.studioMain[t.id].length>96||out.studioMain[t.id].some(v=>!Number.isInteger(v)||v<0||v>127))))fail('Invalid main drum pattern.');
    if(out.studioCustomBars!==undefined&&(!Array.isArray(out.studioCustomBars)||out.studioCustomBars.length>8||out.studioCustomBars.some(v=>typeof v!=='boolean')))fail('Invalid custom drum bars.');
    if (out.version !== 1) fail('Unsupported drum-machine project version.');
    if (!Object.hasOwn(kits, out.kit)) fail('Choose a supported drum kit.');
    if (![1, 2, 3, 4, 6, 8, 12].includes(out.subdivision)) fail('Choose a supported drum subdivision.');
    for (const key of ['swing', 'humanize']) {
      out[key] = out[key] ?? 0;
      if (!Number.isFinite(out[key]) || out[key] < 0 || out[key] > 100) fail('Invalid drum ' + key + '.');
    }
    out.pitch = out.pitch ?? 0;
    if (!Number.isFinite(out.pitch) || out.pitch < -24 || out.pitch > 24) fail('Drum pitch must be between −24 and 24 semitones.');
    if (!Array.isArray(out.patterns) || out.patterns.length < 1 || out.patterns.length > 32) fail('Use between 1 and 32 drum patterns.');
    out.patterns = out.patterns.map((pattern, pi) => {
      if (!pattern || typeof pattern !== 'object' || !Number.isInteger(pattern.bars) || pattern.bars < 1 || pattern.bars > 8) fail('Each drum pattern needs between 1 and 8 bars.');
      const count = stepCount(pattern.bars, out.subdivision, beatsPerBar);
      // Retire Rim and Ride bell from older sessions without discarding other tracks.
      if (Array.isArray(pattern.tracks)) pattern.tracks = pattern.tracks.filter(track => !['rim','bell'].includes(track?.id));
      if (!Array.isArray(pattern.tracks) || pattern.tracks.length !== tracks.length) fail('A drum pattern needs all ten instrument tracks.');
      const seen = new Set();
      pattern.tracks = pattern.tracks.map(track => {
        if (!track || !tracks.some(t => t.id === track.id) || seen.has(track.id)) fail('Invalid or duplicate drum track.');
        seen.add(track.id);
        if (!Number.isFinite(track.volume) || track.volume < 0 || track.volume > 100) fail('Drum track volume must be between 0 and 100.');
        if (!Number.isFinite(track.pan) || track.pan < -1 || track.pan > 1) fail('Drum pan must be between −1 and 1.');
        if (typeof track.mute !== 'boolean' || typeof track.solo !== 'boolean') fail('Invalid drum mute or solo setting.');
        if (!Array.isArray(track.steps) || track.steps.length !== count || track.steps.some(v => !Number.isInteger(v) || v < 0 || v > 127)) fail('Invalid drum steps or hit velocity.');
        return track;
      });
      pattern.name = String(pattern.name || 'Pattern ' + (pi + 1)).slice(0, 60);
      return pattern;
    });
    if (!Array.isArray(out.sequence) || out.sequence.length < 1 || out.sequence.length > 64) fail('Use between 1 and 64 drum-sequence entries.');
    out.sequence = out.sequence.map(entry => {
      if (!entry || !Number.isInteger(entry.pattern) || entry.pattern < 0 || entry.pattern >= out.patterns.length || !Number.isInteger(entry.repeats) || entry.repeats < 1 || entry.repeats > 32) fail('Invalid drum-sequence entry.');
      return {
        pattern: entry.pattern,
        repeats: entry.repeats
      };
    });
    return out;
  }
  function linkedStudioDrums(drums,beatsPerBar=4,bars=drums.patterns?.[0]?.bars===8?8:4){
    if(![4,8].includes(bars))fail('Choose 4 or 8 drum bars.');
    const original=validateDrums(drums,beatsPerBar),source=original.patterns[0];
    const width=Math.round(beatsPerBar*original.subdivision);
    const linked=Array.from({length:bars},(_,bar)=>bar===0||(
      Array.isArray(original.linkedBars)?original.linkedBars[bar]!==false:
      bar>=source.bars||source.tracks.every(track=>track.steps.slice(bar*width,(bar+1)*width).every((hit,i)=>hit===track.steps[i]))
    ));
    if(original.patternMode==='same'||original.patternMode==='different'){
      for(let bar=1;bar<bars;bar++)linked[bar]=original.patternMode==='same';
    }
    const next=resizePattern(original,0,bars,4,beatsPerBar);
    next.patterns=next.patterns.slice(0,1);next.sequence=[{pattern:0,repeats:1}];next.linkedBars=linked;
    const steps=Math.round(beatsPerBar*4);
    for(const track of next.patterns[0].tracks)for(let bar=1;bar<bars;bar++)if(linked[bar])track.steps.splice(bar*steps,steps,...track.steps.slice(0,steps));
    return next;
  }
  function setPatternMode(drums,mode,beatsPerBar=4){
    if(!['same','different'].includes(mode))fail('Choose the same or different drum patterns.');
    const next=linkedStudioDrums(drums,beatsPerBar);
    next.patternMode=mode;
    return linkedStudioDrums(next,beatsPerBar);
  }
  function editLinkedStep(drums,trackId,index,velocity,beatsPerBar=4){
    const next=linkedStudioDrums(drums,beatsPerBar),steps=Math.round(beatsPerBar*4),bar=Math.floor(index/steps);
    if(!Number.isInteger(index)||bar<0||bar>=next.patterns[0].bars||!Number.isInteger(velocity)||velocity<0||velocity>127)fail('Invalid linked drum step.');
    const track=next.patterns[0].tracks.find(t=>t.id===trackId);if(!track)fail('Invalid drum track.');
    if(bar>0)next.linkedBars[bar]=false;
    track.steps[index]=velocity;
    return linkedStudioDrums(next,beatsPerBar);
  }
  function clearLinkedDrums(drums,beatsPerBar=4){
    const next=linkedStudioDrums(drums,beatsPerBar);
    next.patterns[0].tracks.forEach(track=>track.steps.fill(0));next.linkedBars=Array(next.patterns[0].bars).fill(true);next.patternMode='same';
    return next;
  }
  function randomiseLinkedBar(drums,bar,signature='4/4',random=Math.random,chooseGroove=null){
    const [top,bottom]=signature.split('/').map(Number),beats=top*4/bottom;
    const next=linkedStudioDrums(drums,beats),steps=beats*4;
    if(!Number.isInteger(bar)||bar<0||bar>=next.patterns[0].bars)fail('Choose an existing drum bar.');
    const single=resizePattern(next,0,1,4,beats);
    const generated=randomisePattern(single,0,signature,random,chooseGroove);
    next.patterns[0].name=generated.patterns[0].name;
    if(bar>0)next.linkedBars[bar]=false;
    for(const track of next.patterns[0].tracks)track.steps.splice(bar*steps,steps,...generated.patterns[0].tracks.find(t=>t.id===track.id).steps);
    return linkedStudioDrums(next,beats);
  }
  function patternBeats(pattern, beatsPerBar = 4) {
    return pattern.bars * metre(beatsPerBar);
  }
  // Keep a separate main pattern so bar 1 can also have an independent edit.
  function studioDrums(value,beats=4,bars=value.patterns[0].bars){
    const source=validateDrums(value,beats),width=Math.round(beats*source.subdivision);
    const next=resizePattern(source,0,bars,source.subdivision,beats);
    delete next.patternMode;
    next.patterns=next.patterns.slice(0,1);next.sequence=[{pattern:0,repeats:1}];
    next.studioMain=Object.fromEntries(tracks.map(t=>[t.id,Array.from({length:width},(_,i)=>(source.studioMain?source.studioMain[t.id][i]:source.patterns[0].tracks.find(r=>r.id===t.id).steps[i])??0)]));
    next.studioCustomBars=Array.from({length:bars},(_,i)=>source.studioCustomBars?source.studioCustomBars[i]===true:source.linkedBars?.[i]===false);
    next.linkedBars=next.studioCustomBars.map(custom=>!custom);
    for(const row of next.patterns[0].tracks)for(let i=0;i<bars;i++)if(!next.studioCustomBars[i])row.steps.splice(i*width,width,...next.studioMain[row.id]);
    return next;
  }
  function applyStudioPattern(value,scope,beats,edit){
    const d=studioDrums(value,beats),width=Math.round(beats*d.subdivision);
    if(scope!=='all'&&(!Number.isInteger(scope)||scope<0||scope>=d.patterns[0].bars))fail('Choose an existing drum bar.');
    const single=resizePattern(d,0,1,d.subdivision,beats);
    delete single.studioMain;delete single.studioCustomBars;
    for(const row of single.patterns[0].tracks)row.steps=scope==='all'?d.studioMain[row.id].slice():d.patterns[0].tracks.find(r=>r.id===row.id).steps.slice(scope*width,(scope+1)*width);
    const result=edit(single);
    if(scope==='all'){
      d.studioMain=Object.fromEntries(result.patterns[0].tracks.map(row=>[row.id,row.steps.slice()]));
      d.studioCustomBars.fill(false);
    }else{
      d.studioCustomBars[scope]=true;
      for(const row of d.patterns[0].tracks)row.steps.splice(scope*width,width,...result.patterns[0].tracks.find(r=>r.id===row.id).steps);
    }
    d.patterns[0].name=result.patterns[0].name;
    return studioDrums(d,beats);
  }
  function editStudioStep(value,scope,id,index,velocity,beats=4){
    return applyStudioPattern(value,scope,beats,single=>{
      const row=single.patterns[0].tracks.find(t=>t.id===id);
      if(!row||!Number.isInteger(index)||index<0||index>=row.steps.length||!Number.isInteger(velocity)||velocity<0||velocity>127)fail('Invalid drum step.');
      row.steps[index]=velocity;return single;
    });
  }
  function randomiseStudioPattern(value,scope,signature,random=Math.random,choose=null){
    const [top,bottom]=signature.split('/').map(Number);
    return applyStudioPattern(value,scope,top*4/bottom,single=>randomisePattern(single,0,signature,random,choose));
  }
  function clearStudioPattern(value,scope,beats=4){return applyStudioPattern(value,scope,beats,single=>{single.patterns[0].tracks.forEach(row=>row.steps.fill(0));return single;});}
  function restoreStudioBar(value,bar,beats=4){
    const d=studioDrums(value,beats);
    if(!Number.isInteger(bar)||bar<0||bar>=d.patterns[0].bars)fail('Choose an existing drum bar.');
    d.studioCustomBars[bar]=false;return studioDrums(d,beats);
  }
  function sequenceBeats(drums, beatsPerBar = 4) {
    const d = validateDrums(drums, beatsPerBar);
    return d.sequence.reduce((sum, entry) => sum + patternBeats(d.patterns[entry.pattern], beatsPerBar) * entry.repeats, 0);
  }
  function resizePattern(drums, index, bars, subdivision, beatsPerBar = 4, previousBeatsPerBar = beatsPerBar) {
    const d = validateDrums(drums, previousBeatsPerBar);
    if (!Number.isInteger(index) || !d.patterns[index]) fail('Choose an existing drum pattern.');
    if (!Number.isInteger(bars) || bars < 1 || bars > 8 || ![1, 2, 3, 4, 6, 8, 12].includes(subdivision)) fail('Invalid drum pattern length or subdivision.');
    const previousSubdivision = d.subdivision;
    d.subdivision = subdivision;
    d.patterns.forEach((pattern, pi) => {
      if (pi === index) pattern.bars = bars;
      const count = stepCount(pattern.bars, subdivision, beatsPerBar);
      pattern.tracks.forEach(track => {
        const next = Array(count).fill(0);
        track.steps.forEach((velocity, step) => {
          const oldWidth=metre(previousBeatsPerBar)*previousSubdivision,newWidth=metre(beatsPerBar)*subdivision;
          const bar=Math.floor(step/oldWidth),offset=Math.round((step%oldWidth)/previousSubdivision*subdivision),target=bar*newWidth+offset;
          if(offset<newWidth&&target<count)next[target]=Math.max(next[target],velocity);
        });
        track.steps = next;
      });
    });
    if(d.studioMain){
      const width=Math.round(metre(beatsPerBar)*subdivision);
      for(const id of Object.keys(d.studioMain)){
        const next=Array(width).fill(0);
        d.studioMain[id].forEach((v,i)=>{const at=Math.round(i/previousSubdivision*subdivision);if(at<width)next[at]=Math.max(next[at],v);});
        d.studioMain[id]=next;
      }
    }
    return validateDrums(d, beatsPerBar);
  }
  function migrate(legacyPattern, beatsPerBar = 4) {
    const d = create(beatsPerBar);
    if (!Array.isArray(legacyPattern)) return d;
    const length = Math.max(0, ...legacyPattern.slice(0, 3).map(row => Array.isArray(row) ? row.length : 0));
    const bars = Math.max(1, Math.min(8, Math.ceil(length * .5 / metre(beatsPerBar))));
    d.patterns[0] = blankPattern('Imported pattern', bars, 4, beatsPerBar);
    ['kick', 'snare', 'hat'].forEach((id, row) => {
      const track = d.patterns[0].tracks.find(t => t.id === id);
      (legacyPattern[row] || []).forEach((on, step) => {
        if (step * 2 < track.steps.length && on) track.steps[step * 2] = 100;
      });
    });
    return d;
  }
  // Hit positions are quarter-note beats, including compound metre's dotted pulses.
  const randomGrooves = {
    '2/4':[
      {name:'2/4 straight rock',hits:{kick:[0],snare:[1],hat:[0,.5,1,1.5]}},
      {name:'2/4 pop',hits:{kick:[0,.5],snare:[1],hat:[0,.5,1,1.5]}},
      {name:'2/4 march',hits:{kick:[0,1],snare:[.5,1.5],ride:[0,1]}},
      {name:'2/4 dance',hits:{kick:[0,1],snare:[1],openHat:[.5,1.5]}},
      {name:'2/4 funk',hits:{kick:[0,.75,1.5],snare:[1],hat:[0,.25,.5,.75,1,1.25,1.5,1.75]}},
      {name:'2/4 sparse',hits:{kick:[0],snare:[1],hat:[0,1]}},
      {name:'2/4 tom pattern',hits:{kick:[0],snare:[1],tomLow:[0,1.5],tomMid:[.5],tomHigh:[1.25],pedalHat:[0,1]}},
      {name:'2/4 lifted ending',hits:{kick:[0,1.5],snare:[1],hat:[0,.5,1],openHat:[1.5]}}
    ],
    '4/4': [
      {name:'Pop',hits:{kick:[0,2,2.5],snare:[1,3],hat:[0,.5,1,1.5,2,2.5,3],openHat:[3.5],crash:[0]}},
      {name:'Rock',hits:{kick:[0,.5,2,2.5],snare:[1,3],ride:[0,.5,1,1.5,2,2.5,3,3.5],crash:[0]}},
      {name:'Funk',hits:{kick:[0,.75,1.5,2.5],snare:[1,3],hat:[0,.25,.5,.75,1,1.25,1.5,1.75,2,2.25,2.5,2.75,3,3.25],openHat:[3.5]}},
      {name:'Disco',hits:{kick:[0,1,2,3],snare:[1,3],hat:[0,1,2,3],openHat:[.5,1.5,2.5,3.5],crash:[0]}},
      {name:'House',hits:{kick:[0,1,2,3],snare:[1,3],hat:[0,.25,1,1.25,2,2.25,3,3.25],openHat:[.5,1.5,2.5,3.5]}},
      {name:'Hip-hop',hits:{kick:[0,.75,2,2.75],snare:[1,3],hat:[0,.5,1,1.5,2,2.5,3,3.5],openHat:[3.75]}},
      {name:'Reggae',hits:{kick:[2],snare:[2],hat:[0,.5,1,1.5,2,2.5,3],openHat:[3.5],pedalHat:[1,3]}},
      {name:'Bossa nova',hits:{kick:[0,1.5,2,3.5],snare:[0,1.5,3],ride:[0,.5,1,1.5,2,2.5,3,3.5],pedalHat:[1,3]}},
      {name:'Jazz',hits:{kick:[0,2],snare:[1,3],ride:[0,1,1.5,2,3,3.5],pedalHat:[1,3]}},
      {name:'Latin rock',hits:{kick:[0,1.5,2.5],snare:[1,3],ride:[0,.5,1,2,2.5,3],tomHigh:[1.75],tomLow:[3.5]}},
      {name:'Tom groove',hits:{kick:[0,2],snare:[1,3],tomLow:[0,1.5,2.5],tomMid:[.5,2],tomHigh:[1.75,3.5],pedalHat:[0,1,2,3],crash:[0]}},
      {name:'Ballad',hits:{kick:[0,2.5],snare:[1,3],ride:[0,1,2,3],pedalHat:[.5,1.5,2.5,3.5],crash:[0]}}
    ],
    '3/4': [
      {name:'Waltz',hits:{kick:[0],snare:[1,2],hat:[0,.5,1,1.5,2,2.5],crash:[0]}},
      {name:'Jazz waltz',hits:{kick:[0],snare:[1,2],ride:[0,1,1.5,2,2.5],pedalHat:[1,2]}},
      {name:'Folk waltz',hits:{kick:[0],snare:[1,2],hat:[0,.5,1,1.5,2],openHat:[2.5],tomLow:[2]}},
      {name:'Rock waltz',hits:{kick:[0,.5],snare:[1,2],ride:[0,.5,1,1.5,2,2.5],tomMid:[2.25],tomLow:[2.5],crash:[0]}}
    ],
    '6/8': [
      {name:'6/8 ballad',hits:{kick:[0],snare:[1.5],hat:[0,.5,1,1.5,2,2.5],crash:[0]}},
      {name:'6/8 blues',hits:{kick:[0,2.5],snare:[1.5],ride:[0,.5,1,1.5,2,2.5],pedalHat:[0,1.5]}},
      {name:'6/8 rock',hits:{kick:[0,1,2.5],snare:[1.5],ride:[0,.5,1,1.5,2,2.5],tomHigh:[2],tomLow:[2.5],crash:[0]}},
      {name:'6/8 tom groove',hits:{kick:[0],snare:[1.5],tomLow:[0,1.5],tomMid:[.5,2],tomHigh:[1,2.5],pedalHat:[0,1.5],crash:[0]}}
    ]
  };
  // Additional kit-only grooves; see docs/composition-drum-grooves.md.
  const additionalGrooves = {
    "4/4": [
      {"name":"Straight rock","hits":{"kick":[0.0,2.0],"snare":[1.0,3.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5]}},
      {"name":"Pushed rock","hits":{"kick":[0.0,1.5,2.0,3.5],"snare":[1.0,3.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0]}},
      {"name":"Driving rock","hits":{"kick":[0.0,0.5,2.0,2.5,3.5],"snare":[1.0,3.0],"ride":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5]}},
      {"name":"Sparse rock","hits":{"kick":[0.0,2.0],"snare":[1.0,3.0],"hat":[0.0,1.0,2.0,3.0]}},
      {"name":"Sixteenth rock","hits":{"kick":[0.0,1.75,2.0,2.5],"snare":[1.0,3.0],"hat":[0.0,0.25,0.5,0.75,1.0,1.25,1.5,1.75,2.0,2.25,2.5,2.75,3.0,3.25,3.5]}},
      {"name":"Arena rock","hits":{"kick":[0.0,0.75,2.0,2.75],"snare":[1.0,3.0],"ride":[0.0,1.0,2.0,3.0],"crash":[0.0],"tomLow":[3.5]}},
      {"name":"Half-time rock","hits":{"kick":[0.0,0.75,2.0,2.5],"snare":[2.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5]}},
      {"name":"Half-time sixteenths","hits":{"kick":[0.0,1.5,2.75,3.5],"snare":[2.0],"hat":[0.0,0.25,0.5,0.75,1.0,1.25,1.5,1.75,2.0,2.25,2.5,2.75,3.0,3.25,3.5,3.75]}},
      {"name":"Punk drive","hits":{"kick":[0.0,0.5,1.5,2.0,2.5,3.5],"snare":[1.0,3.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5],"crash":[0.0]}},
      {"name":"Punk backbeat","hits":{"kick":[0.0,1.0,2.0,3.0],"snare":[0.5,1.5,2.5,3.5],"ride":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5]}},
      {"name":"Skate punk","hits":{"kick":[0.0,0.75,1.5,2.0,2.75,3.5],"snare":[1.0,3.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0],"openHat":[3.5]}},
      {"name":"Surf rock","hits":{"kick":[0.0,1.5,2.0,2.5],"snare":[1.0,3.0],"ride":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5],"tomLow":[3.75]}},
      {"name":"Hard rock","hits":{"kick":[0.0,0.5,1.75,2.0,2.5,3.75],"snare":[1.0,3.0],"ride":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5]}},
      {"name":"Metal eighths","hits":{"kick":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5],"snare":[1.0,3.0],"ride":[0.0,1.0,2.0,3.0],"crash":[0.0]}},
      {"name":"Metal double kick","hits":{"kick":[0.0,0.25,0.5,0.75,1.5,1.75,2.0,2.25,2.5,2.75,3.5,3.75],"snare":[1.0,3.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5]}},
      {"name":"Floor-tom rock","hits":{"kick":[0.0,2.0,2.5],"snare":[1.0,3.0],"tomLow":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5],"pedalHat":[0.0,1.0,2.0,3.0]}},
      {"name":"Tribal rock","hits":{"kick":[0.0,1.75,2.0],"snare":[1.0,3.0],"tomLow":[0.0,1.5,2.0,3.5],"tomMid":[0.5,2.5],"tomHigh":[0.75,2.75],"pedalHat":[0.0,1.0,2.0,3.0]}},
      {"name":"Indie offbeats","hits":{"kick":[0.0,1.5,2.5],"snare":[1.0,3.0],"hat":[0.5,1.5,2.5,3.5],"openHat":[3.75]}},
      {"name":"Pop eighths","hits":{"kick":[0.0,1.5,2.0],"snare":[1.0,3.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5]}},
      {"name":"Pop anticipation","hits":{"kick":[0.0,1.75,2.0,3.75],"snare":[1.0,3.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0],"openHat":[3.5]}},
      {"name":"Pop sixteenths","hits":{"kick":[0.0,1.5,2.5],"snare":[1.0,3.0],"hat":[0.0,0.25,0.5,0.75,1.0,1.25,1.5,1.75,2.0,2.25,2.5,2.75,3.0,3.25,3.5,3.75]}},
      {"name":"Pop half-time","hits":{"kick":[0.0,1.25,2.5,3.5],"snare":[2.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0],"openHat":[3.5]}},
      {"name":"Pop ballad","hits":{"kick":[0.0,2.5],"snare":[1.0,3.0],"hat":[0.0,1.0,2.0,3.0],"pedalHat":[0.5,1.5,2.5,3.5]}},
      {"name":"Power ballad","hits":{"kick":[0.0,0.75,2.0,2.5],"snare":[1.0,3.0],"ride":[0.0,1.0,2.0,3.0],"crash":[0.0],"tomLow":[3.5]}},
      {"name":"Country train","hits":{"kick":[0.0,2.0],"snare":[0.5,1.0,1.5,2.5,3.0,3.5],"hat":[0.0,1.0,2.0,3.0]}},
      {"name":"Country two-step","hits":{"kick":[0.0,2.0],"snare":[1.0,3.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5],"pedalHat":[1.0,3.0]}},
      {"name":"Country rock","hits":{"kick":[0.0,0.5,1.5,2.0,3.5],"snare":[1.0,3.0],"ride":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5]}},
      {"name":"Motown quarters","hits":{"kick":[0.0,1.5,2.0,3.5],"snare":[0.0,1.0,2.0,3.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5]}},
      {"name":"Motown backbeat","hits":{"kick":[0.0,0.75,2.0,2.5],"snare":[1.0,3.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5],"pedalHat":[1.0,3.0]}},
      {"name":"Northern soul","hits":{"kick":[0.0,1.0,2.0,3.0],"snare":[1.0,3.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5],"tomHigh":[3.75]}},
      {"name":"Soul pocket","hits":{"kick":[0.0,1.5,2.0,2.75],"snare":[1.0,3.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5]}},
      {"name":"Soul syncopation","hits":{"kick":[0.0,0.75,1.75,2.5],"snare":[1.0,3.0],"ride":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5],"pedalHat":[1.0,3.0]}},
      {"name":"R&B half-time","hits":{"kick":[0.0,1.5,2.5,3.25],"snare":[2.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5]}},
      {"name":"R&B broken hats","hits":{"kick":[0.0,1.75,2.5,3.5],"snare":[1.0,3.0],"hat":[0.0,0.5,0.75,1.5,2.0,2.5,2.75,3.5]}},
      {"name":"Funk pocket","hits":{"kick":[0.0,0.75,1.5,2.5,3.5],"snare":[1.0,3.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5]}},
      {"name":"Funk syncopation","hits":{"kick":[0.0,0.75,1.75,2.0,2.5,3.75],"snare":[1.0,3.0],"hat":[0.0,0.25,0.5,1.0,1.5,1.75,2.0,2.25,2.5,3.0,3.5]}},
      {"name":"Funk offbeat hats","hits":{"kick":[0.0,1.5,2.25,3.5],"snare":[1.0,3.0],"hat":[0.0,1.0,2.0,3.0],"openHat":[0.5,1.5,2.5,3.5]}},
      {"name":"Funk displaced kick","hits":{"kick":[0.5,1.5,2.0,2.75],"snare":[1.0,3.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5]}},
      {"name":"Linear funk","hits":{"kick":[0.0,1.5,2.5],"snare":[1.0,3.0],"hat":[0.25,0.5,0.75,1.25,1.75,2.0,2.25,2.75,3.25,3.5,3.75]}},
      {"name":"Linear tom funk","hits":{"kick":[0.0,1.75,2.5],"snare":[1.0,3.0],"hat":[0.25,0.5,1.25,1.5,2.25,3.25],"tomHigh":[0.75,2.75],"tomMid":[3.5],"tomLow":[3.75]}},
      {"name":"Disco driving hats","hits":{"kick":[0.0,1.0,2.0,3.0],"snare":[1.0,3.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5],"openHat":[3.75]}},
      {"name":"Disco sixteenths","hits":{"kick":[0.0,1.0,2.0,3.0],"snare":[1.0,3.0],"hat":[0.0,0.25,0.5,0.75,1.0,1.25,1.5,1.75,2.0,2.25,2.5,2.75,3.0,3.25,3.5],"openHat":[3.75]}},
      {"name":"Disco ride","hits":{"kick":[0.0,1.0,2.0,3.0],"snare":[1.0,3.0],"ride":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5],"openHat":[1.5,3.5]}},
      {"name":"House offbeat hats","hits":{"kick":[0.0,1.0,2.0,3.0],"snare":[1.0,3.0],"openHat":[0.5,1.5,2.5,3.5],"pedalHat":[0.0,2.0]}},
      {"name":"Deep house","hits":{"kick":[0.0,1.0,2.0,3.0],"snare":[1.0,3.0],"hat":[0.0,0.75,1.75,2.0,2.75,3.75],"openHat":[0.5,1.5,2.5,3.5]}},
      {"name":"Tech house","hits":{"kick":[0.0,1.0,2.0,3.0],"snare":[1.0,3.0],"hat":[0.0,0.5,0.75,1.5,2.0,2.5,2.75,3.5],"tomLow":[1.75,3.75]}},
      {"name":"Techno pulse","hits":{"kick":[0.0,1.0,2.0,3.0],"snare":[1.0,3.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5],"ride":[0.5,1.5,2.5,3.5]}},
      {"name":"Minimal dance","hits":{"kick":[0.0,1.0,2.0,3.0],"snare":[3.0],"hat":[0.5,1.5,2.5,3.5]}},
      {"name":"Dance toms","hits":{"kick":[0.0,1.0,2.0,3.0],"snare":[1.0,3.0],"hat":[0.5,1.5,2.5,3.5],"tomLow":[0.75,2.75],"tomMid":[1.75],"tomHigh":[3.75]}},
      {"name":"Electro broken beat","hits":{"kick":[0.0,1.5,2.5,3.75],"snare":[1.0,3.0],"hat":[0.0,0.5,0.75,1.5,2.0,2.5,2.75,3.5]}},
      {"name":"Boom bap","hits":{"kick":[0.0,1.75,2.5],"snare":[1.0,3.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5]}},
      {"name":"Hip-hop sparse","hits":{"kick":[0.0,1.5,2.75],"snare":[1.0,3.0],"hat":[0.0,1.0,2.0,3.0]}},
      {"name":"Hip-hop double kick","hits":{"kick":[0.0,0.25,1.75,2.0,2.75],"snare":[1.0,3.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5]}},
      {"name":"Trap half-time","hits":{"kick":[0.0,1.75,2.5,3.75],"snare":[2.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.25,3.5,3.75]}},
      {"name":"Drum and bass","hits":{"kick":[0.0,2.5],"snare":[1.0,3.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5],"openHat":[1.75,3.75]}},
      {"name":"Jungle broken beat","hits":{"kick":[0.0,1.75,2.5],"snare":[1.0,2.75,3.0,3.5],"ride":[0.0,0.5,1.5,2.0,2.5,3.5]}},
      {"name":"Two-step garage","hits":{"kick":[0.0,1.75,2.5],"snare":[1.0,3.0],"hat":[0.5,0.75,1.5,2.5,2.75,3.5],"openHat":[3.75]}},
      {"name":"Reggae one-drop sparse","hits":{"kick":[2.0],"snare":[2.0],"hat":[0.5,1.5,2.5,3.5],"pedalHat":[1.0,3.0]}},
      {"name":"Reggae steppers","hits":{"kick":[0.0,1.0,2.0,3.0],"snare":[2.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5]}},
      {"name":"Reggae rockers","hits":{"kick":[0.0,1.5,2.0,3.5],"snare":[2.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0],"openHat":[3.5]}},
      {"name":"Ska drive","hits":{"kick":[0.0,1.0,2.0,3.0],"snare":[1.0,3.0],"hat":[0.5,1.5,2.5,3.5],"ride":[0.0,2.0]}},
      {"name":"Bossa kit adaptation","hits":{"kick":[0.0,1.5,2.0,3.5],"snare":[0.0,1.5,3.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5],"pedalHat":[1.0,3.0]}},
      {"name":"Samba kit adaptation","hits":{"kick":[0.0,0.75,1.0,1.75,2.0,2.75,3.0,3.75],"snare":[0.5,1.5,2.5,3.5],"ride":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5]}},
      {"name":"Soca kit adaptation","hits":{"kick":[0.0,1.0,2.0,3.0],"snare":[0.5,1.5,2.5,3.5],"hat":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5],"tomLow":[0.75,2.75]}},
      {"name":"Calypso kit adaptation","hits":{"kick":[0.0,1.5,2.0,3.5],"snare":[1.0,2.5,3.0],"ride":[0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5]}},
      {"name":"Afrobeat kit adaptation","hits":{"kick":[0.0,1.5,2.25,3.5],"snare":[1.0,2.75],"hat":[0.0,0.5,0.75,1.5,2.0,2.5,2.75,3.5],"pedalHat":[1.0,3.0]}}
    ],
    "3/4": [
      {"name":"Waltz quarters","hits":{"kick":[0.0],"snare":[1.0,2.0],"hat":[0.0,1.0,2.0]}},
      {"name":"Waltz offbeats","hits":{"kick":[0.0],"snare":[1.0,2.0],"hat":[0.5,1.5,2.5]}},
      {"name":"Waltz pedal pulse","hits":{"kick":[0.0],"snare":[1.0,2.0],"ride":[0.0,1.0,2.0],"pedalHat":[0.5,1.5,2.5]}},
      {"name":"Waltz light eighths","hits":{"kick":[0.0,1.5],"snare":[1.0,2.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5]}},
      {"name":"Waltz lifted ending","hits":{"kick":[0.0],"snare":[1.0,2.0],"hat":[0.0,0.5,1.0,1.5,2.0],"openHat":[2.5]}},
      {"name":"Country waltz","hits":{"kick":[0.0,1.5],"snare":[1.0,2.0],"ride":[0.0,0.5,1.0,1.5,2.0,2.5],"pedalHat":[1.0,2.0]}},
      {"name":"Slow three","hits":{"kick":[0.0,1.75],"snare":[2.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5]}},
      {"name":"Pop three","hits":{"kick":[0.0,1.5,2.5],"snare":[1.0,2.0],"hat":[0.0,0.5,1.0,1.5,2.0,2.5]}},
      {"name":"Pop three sixteenths","hits":{"kick":[0.0,1.75],"snare":[1.0,2.0],"hat":[0.0,0.25,0.5,0.75,1.0,1.25,1.5,1.75,2.0,2.25,2.5,2.75]}},
      {"name":"Rock three quarters","hits":{"kick":[0.0,0.5,1.5],"snare":[1.0,2.0],"ride":[0.0,1.0,2.0],"crash":[0.0]}},
      {"name":"Rock three offbeats","hits":{"kick":[0.0,1.5,2.5],"snare":[1.0,2.0],"hat":[0.5,1.5,2.5],"openHat":[2.75]}},
      {"name":"Heavy three","hits":{"kick":[0.0,0.5,1.5,2.5],"snare":[1.0,2.0],"ride":[0.0,0.5,1.0,1.5,2.0,2.5],"tomLow":[2.75]}},
      {"name":"Funk three","hits":{"kick":[0.0,0.75,1.5,2.25],"snare":[1.0,2.0],"hat":[0.0,0.25,0.5,1.0,1.5,1.75,2.0,2.5]}},
      {"name":"Linear three","hits":{"kick":[0.0,1.5],"snare":[1.0,2.0],"hat":[0.25,0.5,0.75,1.25,1.75,2.25,2.5,2.75]}},
      {"name":"Dance three","hits":{"kick":[0.0,1.0,2.0],"snare":[1.0,2.0],"hat":[0.0,1.0,2.0],"openHat":[0.5,1.5,2.5]}},
      {"name":"Disco three","hits":{"kick":[0.0,1.0,2.0],"snare":[1.0,2.0],"hat":[0.0,0.25,0.5,0.75,1.0,1.25,1.5,1.75,2.0,2.25,2.5,2.75]}},
      {"name":"Tom three","hits":{"kick":[0.0],"snare":[1.0,2.0],"tomLow":[0.0,1.5],"tomMid":[0.5,2.0],"tomHigh":[1.0,2.5],"pedalHat":[0.0,1.0,2.0]}},
      {"name":"Floor-tom three","hits":{"kick":[0.0,1.5],"snare":[1.0,2.0],"tomLow":[0.0,0.5,1.0,1.5,2.0,2.5],"pedalHat":[0.0,1.0,2.0]}},
      {"name":"Ballad three","hits":{"kick":[0.0,1.5],"snare":[2.0],"ride":[0.0,1.0,2.0],"pedalHat":[0.5,1.5,2.5]}},
      {"name":"March three","hits":{"kick":[0.0,2.0],"snare":[0.5,1.0,1.5,2.5],"hat":[0.0,1.0,2.0]}}
    ],
    "6/8": [
      {"name":"Six-eight gentle","hits":{"kick":[0.0],"snare":[1.5],"hat":[0.0,0.5,1.0,1.5,2.0,2.5]}},
      {"name":"Six-eight quarters","hits":{"kick":[0.0],"snare":[1.5],"ride":[0.0,1.5],"pedalHat":[0.5,1.0,2.0,2.5]}},
      {"name":"Six-eight lifted","hits":{"kick":[0.0,2.5],"snare":[1.5],"hat":[0.0,0.5,1.0,1.5,2.0],"openHat":[2.5]}},
      {"name":"Six-eight pushed kick","hits":{"kick":[0.0,1.25,2.5],"snare":[1.5],"hat":[0.0,0.5,1.0,1.5,2.0,2.5]}},
      {"name":"Six-eight double kick","hits":{"kick":[0.0,0.5,1.5,2.5],"snare":[1.5],"ride":[0.0,0.5,1.0,1.5,2.0,2.5]}},
      {"name":"Six-eight pop","hits":{"kick":[0.0,1.0,2.5],"snare":[1.5],"hat":[0.0,0.5,1.0,1.5,2.0,2.5],"crash":[0.0]}},
      {"name":"Six-eight soul","hits":{"kick":[0.0,0.75,2.5],"snare":[1.5],"ride":[0.0,0.5,1.0,1.5,2.0,2.5],"pedalHat":[0.0,1.5]}},
      {"name":"Six-eight gospel","hits":{"kick":[0.0,0.5,1.25,2.0,2.5],"snare":[1.5],"hat":[0.0,0.5,1.0,1.5,2.0,2.5],"crash":[0.0]}},
      {"name":"Six-eight blues pulse","hits":{"kick":[0.0,1.0,1.5,2.5],"snare":[1.5],"ride":[0.0,0.5,1.0,1.5,2.0,2.5],"pedalHat":[0.5,2.0]}},
      {"name":"Six-eight blues sparse","hits":{"kick":[0.0,2.5],"snare":[1.5],"ride":[0.0,1.0,1.5,2.5],"pedalHat":[0.0,1.5]}},
      {"name":"Six-eight heavy rock","hits":{"kick":[0.0,0.5,1.0,2.0,2.5],"snare":[1.5],"ride":[0.0,0.5,1.0,1.5,2.0,2.5],"crash":[0.0]}},
      {"name":"Six-eight driving rock","hits":{"kick":[0.0,1.25,1.5,2.75],"snare":[1.5],"hat":[0.0,0.5,1.0,1.5,2.0,2.5],"openHat":[2.75]}},
      {"name":"Six-eight sixteenths","hits":{"kick":[0.0,1.0,2.5],"snare":[1.5],"hat":[0.0,0.25,0.5,0.75,1.0,1.25,1.5,1.75,2.0,2.25,2.5,2.75]}},
      {"name":"Six-eight linear","hits":{"kick":[0.0,1.0,2.5],"snare":[1.5],"hat":[0.25,0.5,0.75,1.25,1.75,2.0,2.25,2.75]}},
      {"name":"Six-eight funk","hits":{"kick":[0.0,0.75,1.25,2.0,2.75],"snare":[1.5],"hat":[0.0,0.5,1.0,1.5,2.0,2.5]}},
      {"name":"Six-eight dance","hits":{"kick":[0.0,1.5],"snare":[1.5],"hat":[0.0,1.0,1.5,2.5],"openHat":[0.5,2.0]}},
      {"name":"Six-eight tom pulse","hits":{"kick":[0.0,1.5],"snare":[1.5],"tomLow":[0.0,1.5],"tomMid":[0.5,2.0],"tomHigh":[1.0,2.5],"pedalHat":[0.0,1.5]}},
      {"name":"Six-eight floor-tom","hits":{"kick":[0.0,2.5],"snare":[1.5],"tomLow":[0.0,0.5,1.0,1.5,2.0,2.5],"pedalHat":[0.0,1.5]}},
      {"name":"Six-eight marching","hits":{"kick":[0.0,1.5],"snare":[0.5,1.0,2.0,2.5],"hat":[0.0,1.5]}},
      {"name":"Six-eight cinematic","hits":{"kick":[0.0,1.25,1.5],"snare":[1.5],"tomLow":[0.0,1.0,1.5,2.5],"tomMid":[0.5,2.0],"tomHigh":[1.25,2.75],"crash":[0.0]}}
    ]
  };
  for (const signature of Object.keys(additionalGrooves)) randomGrooves[signature].push(...additionalGrooves[signature]);
  // Longer patterns alternate related bars rather than copying one bar throughout.
  for (const [signature, pairs] of Object.entries({
    '4/4':[['Straight rock','Pushed rock'],['Pop eighths','Pop anticipation'],['Funk pocket','Funk syncopation'],['Linear funk','Linear tom funk'],['Soul pocket','Soul syncopation'],['Hip-hop sparse','Hip-hop double kick'],['House offbeat hats','Deep house'],['Reggae one-drop sparse','Reggae rockers']],
    '3/4':[['Waltz quarters','Waltz lifted ending'],['Rock three quarters','Heavy three'],['Pop three','Pop three sixteenths']],
    '6/8':[['Six-eight gentle','Six-eight pushed kick'],['Six-eight soul','Six-eight gospel'],['Six-eight tom pulse','Six-eight cinematic']]
  })) for (const [first, second] of pairs) {
    const groove = randomGrooves[signature].find(g=>g.name===first);
    groove.bars = [groove.hits, randomGrooves[signature].find(g=>g.name===second).hits];
  }
  function createGrooveShuffler(random = Math.random) {
    const bags = new Map();
    return (choices, currentName) => {
      const key = choices.map(g=>g.name).join('|');
      let bag = bags.get(key);
      if (!bag || !bag.length) {
        bag = choices.slice();
        for (let i=bag.length-1;i>0;i--) {const j=Math.min(i,Math.floor(random()*(i+1)));[bag[i],bag[j]]=[bag[j],bag[i]];}
        bags.set(key,bag);
      }
      if (bag.length>1 && bag[bag.length-1].name===currentName) [bag[0],bag[bag.length-1]]=[bag[bag.length-1],bag[0]];
      return bag.pop();
    };
  }
  function groovesForSignature(signature){return randomGrooves[signature]||[];}
  function randomisePattern(drums, index, signature = '4/4', random = Math.random, chooseGroove = null) {
    const choices=groovesForSignature(signature);
    if(!choices.length)fail('Choose 2/4, 3/4, 4/4 or 6/8 to randomise drums.');
    const [top,bottom] = signature.split('/').map(Number), beats = top * 4 / bottom;
    const d = validateDrums(drums, beats), p = d.patterns[index];
    if (!p) fail('Choose an existing drum pattern.');
    const groove=chooseGroove ? chooseGroove(choices,p.name) : choices[Math.min(choices.length-1,Math.floor(random()*choices.length))];
    if(!choices.includes(groove))fail('Choose a drum groove matching the selected time signature.');
    p.name=groove.name;
    p.tracks.forEach(track=>track.steps.fill(0));
    const baseVelocity={kick:110,snare:104,hat:65,openHat:72,pedalHat:55,ride:73,crash:87,tomHigh:88,tomMid:94,tomLow:100};
    const varied=base=>Math.max(1,Math.min(127,Math.round(base+random()*14-7)));
    const put=(id,bar,offset,velocity)=>{
      const track=p.tracks.find(track=>track.id===id),stepsPerBar=beats*d.subdivision;
      const step=Math.min((bar+1)*stepsPerBar-1,Math.round((bar*beats+offset)*d.subdivision));
      if(step>=0&&step<track.steps.length)track.steps[step]=Math.max(track.steps[step],velocity);
    };
    for(let bar=0;bar<p.bars;bar++){
      for(const [id,positions] of Object.entries(groove.bars ? groove.bars[bar % groove.bars.length] : groove.hits))for(const offset of positions){
        // Save crashes for phrase openings, rather than repeating them every bar.
        if(id==='crash'&&bar>0&&bar%4!==0)continue;
        // Cymbal accents express the metre, including the two compound beats
        // of 6/8; sharing its bar length with 3/4 does not share its pulse.
        const pulse=signature==='6/8'?1.5:1;
        const accent=['hat','ride','pedalHat'].includes(id)?
          offset===0?9:offset%pulse===0?5:-6:0;
        put(id,bar,offset,varied(baseVelocity[id]+accent));
      }
      // Add occasional quiet snare details without appending a fill to the loop.
      if(random()<.35)put('snare',bar,beats-(signature==='6/8'?.5:.75),varied(38));
    }
    // A hi-hat cannot be simultaneously open and closed on the same step.
    const open=p.tracks.find(t=>t.id==='openHat'),closed=p.tracks.find(t=>t.id==='hat');
    open.steps.forEach((hit,i)=>{if(hit)closed.steps[i]=0;});
    return validateDrums(d, beats);
  }
  function presetsForSignature(signature){return Object.fromEntries(Object.entries(presets).filter(([name])=>name==='waltz'?signature==='3/4':name==='sixEight'?signature==='6/8':['2/4','4/4'].includes(signature)));}
  function preset(name, beatsPerBar = 4) {
    if (!Object.hasOwn(presets, name)) fail('Choose a drum preset.');
    const d = create(beatsPerBar),
      p = d.patterns[0],
      steps = p.tracks[0].steps.length;
    p.name = presets[name];
    d.kit = ['house', 'hiphop'].includes(name) ? 'electronic' : 'acoustic';
    const put = (id, step, velocity = 100) => {
      if (step >= 0 && step < steps) p.tracks.find(t => t.id === id).steps[step] = velocity;
    };
    for (let step = 0; step < steps; step++) {
      const beat = step / 4;
      if (step % 2 === 0) put('hat', step, step % 4 === 0 ? 82 : 58);
      if(name==='sixEight'){if(step%12===0)put('kick',step,110);if(step%12===6)put('snare',step,90);}
      else if (name === 'house') {
        if (step % 4 === 0) put('kick', step, 110);
        if (step % 4 === 2) put('openHat', step, 75);
        if (step % 8 === 4) put('snare', step, 100);
      } else if (name === 'waltz') {
        if (step % 12 === 0) put('kick', step, 105);
        if (step % 12 === 4 || step % 12 === 8) put('snare', step, 85);
      } else {
        if (step === 0 || step === 8 || name === 'funk' && step === 11 || name === 'hiphop' && step === 7 || name === 'pop' && step === 10) put('kick', step, 110);
        if (step % 8 === 4) put('snare', step, 105);
        if (name === 'funk' && step % 4 === 3) put('snare', step, 35);
      }
    }
    if (name === 'hiphop') d.swing = 55;
    return d;
  }
  function events(drums, totalBeats, beatsPerBar = 4) {
    const d = validateDrums(drums, beatsPerBar);
    if (!Number.isFinite(totalBeats) || totalBeats < 0 || totalBeats > 16384) fail('Invalid drum arrangement length.');
    const result = [];
    let position = 0,
      sequenceIndex = 0;
    while (position < totalBeats - 1e-9) {
      const entry = d.sequence[sequenceIndex % d.sequence.length],
        pattern = d.patterns[entry.pattern],
        duration = patternBeats(pattern, beatsPerBar);
      for (let repeat = 0; repeat < entry.repeats && position < totalBeats; repeat++, position += duration) {
        const anySolo = pattern.tracks.some(t => t.solo);
        for (const row of pattern.tracks) {
          if (row.mute || anySolo && !row.solo || row.volume === 0) continue;
          const instrument = tracks.find(t => t.id === row.id);
          row.steps.forEach((velocity, step) => {
            if (!velocity) return;
            const noise = Math.sin((position * 19 + step * 7 + instrument.midi) * 71.1),
              swing = step % 2 ? d.swing / 100 / (3 * d.subdivision) : 0;
            const beat = Math.max(position, position + step / d.subdivision + swing + noise * d.humanize / 100 * .018);
            if (beat >= totalBeats) return;
            result.push({
              beat,
              duration: Math.min(['openHat', 'ride', 'crash'].includes(row.id) ? .4 : .14, totalBeats - beat),
              midi: instrument.midi,
              track: 'drums',
              trackId: row.id,
              velocity: Math.min(1, Math.max(0, velocity / 127 * row.volume / 100 * (1 + noise * d.humanize / 100 * .12))),
              pan: row.pan,
              pitch: d.pitch,
              kit: d.kit,
              patternIndex: entry.pattern,
              stepIndex: step
            });
            if (result.length > 250000) fail('This drum arrangement has too many hits.');
          });
        }
      }
      sequenceIndex++;
    }
    return result.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
  }
  return {
    tracks,
    kits,
    presets,
    presetsForSignature,
    randomisePattern,
    groovesForSignature,
    createGrooveShuffler,
    create,
    validateDrums,
    linkedStudioDrums,
    setPatternMode,
    editLinkedStep,
    clearLinkedDrums,
    randomiseLinkedBar,
    studioDrums,
    editStudioStep,
    randomiseStudioPattern,
    clearStudioPattern,
    restoreStudioBar,
    patternBeats,
    sequenceBeats,
    resizePattern,
    migrate,
    preset,
    events
  };
});
