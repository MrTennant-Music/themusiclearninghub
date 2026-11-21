(function (root) {
  const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const natural = [0, 2, 4, 5, 7, 9, 11];
  const subtitles = { N3: "One octave", N4: "Two octaves", N5: "Tones, semitones, accidentals — flats, sharps and naturals", H: "Treble and bass clef — up to one ledger line", AH: "Treble and bass clef — up to two ledger lines" };
  const defaults = {
    N3: { octaves: 1, naturals: true, sharps: false, flats: false, enharmonics: false },
    N4: { octaves: 2, naturals: true, sharps: false, flats: false, enharmonics: false },
    N5: { octaves: 2, naturals: true, sharps: true, flats: true, enharmonics: false },
    H: { octaves: 2, includeEndC: true, naturals: true, sharps: true, flats: true, enharmonics: false, treble: true, bass: true },
    AH: { octaves: 2, includeEndC: true, naturals: true, sharps: true, flats: true, enharmonics: false, treble: true, bass: true },
  };
  function answers(options) {
    return [1, 0, -1].flatMap(offset => letters.flatMap((letter, index) => {
      if (!(offset === 0 ? options.naturals : offset === 1 ? options.sharps : options.flats)) return [];
      if (!options.enharmonics && ((offset === 1 && ['E','B'].includes(letter)) || (offset === -1 && ['C','F'].includes(letter)))) return [];
      return [{ id: letter + (offset === 1 ? '#' : offset === -1 ? 'b' : ''), label: letter + (offset === 1 ? '♯' : offset === -1 ? '♭' : ''), pitch: (natural[index] + offset + 12) % 12, offset, index }];
    }));
  }
  const whiteKeys = Array.from({length: 22}, (_, index) => ({ pitch: Math.floor(index / 7) * 12 + natural[index % 7], x: index * 48, black: false }));
  const keys = [...whiteKeys, ...whiteKeys.flatMap((key, index) => index < 21 && [0,1,3,4,5].includes(index % 7) ? [{pitch: key.pitch + 1, x: key.x + 33, black: true}] : [])];
  function visibleKeys(options) { return keys.filter(key => key.pitch <= (options.octaves === 1 ? 11 : options.octaves === 3 ? 36 : options.includeEndC ? 24 : 23)); }
  function pool(options) {
    const pitches = new Set(answers(options).map(answer => answer.pitch));
    return visibleKeys(options).filter(key => pitches.has(key.pitch % 12));
  }
  function question(options, previousPitch = null, random = Math.random) {
    return makeQuestion(options,{name:true},previousPitch,random);
  }
  function correct(answer, key) { return answer.pitch === key.pitch % 12; }
  function writtenNotes(key, options) {
    return answers(options).filter(answer => correct(answer, key)).map(answer => {
      const naturalPitch = key.pitch - answer.offset;
      const octave = Math.floor(naturalPitch / 12);
      return { ...answer, clef: 'treble', step: octave * 7 + answer.index - 2, accidental: answer.offset === 1 ? 'sharp' : answer.offset === -1 ? 'flat' : null };
    });
  }
  function normaliseOptions(saved, level='N3') {
    const baseline=defaults[level]||defaults.N3, clean={...baseline};
    for(const key of Object.keys(baseline)) if(typeof baseline[key]==='boolean' && typeof saved?.[key]==='boolean') clean[key]=saved[key];
    if(level!=='N5'||(!clean.naturals&&!clean.sharps&&!clean.flats))clean.naturals=true;
    if(['N3','N4'].includes(level)) return {...baseline};
    if(level!=='N5'||!(clean.sharps||clean.flats)) clean.enharmonics=false;
    if(['H','AH'].includes(level)&&!clean.treble&&!clean.bass) clean.treble=clean.bass=true;
    clean.octaves=baseline.octaves;
    if(baseline.includeEndC)clean.includeEndC=true;
    return clean;
  }
  function normaliseTypes(saved,level='N3') {
    if(['H','AH'].includes(level))return {name:false,find:true};
    const clean={name:typeof saved?.name==='boolean'?saved.name:saved?.find!==true,find:saved?.find===true};
    if(!clean.name&&!clean.find)clean.name=true;
    return clean;
  }
  function advancedCandidates(options, level) {
    const candidates = [];
    for (const clef of ['treble','bass']) {
      if (!options[clef]) continue;
      const baseOctave = clef === 'treble' ? 3 : 2;
      for (const key of visibleKeys({...options, octaves:3})) {
        for (const answer of answers({...options, enharmonics:false}).filter(item => item.pitch === key.pitch % 12)) {
          const naturalPitch = key.pitch - answer.offset;
          const octave = baseOctave + Math.floor(naturalPitch / 12);
          const step = clef === 'treble' ? (octave - 4) * 7 + answer.index - 2 : (octave - 2) * 7 + answer.index - 4;
          const min = level === 'AH' ? -4 : -2;
          const max = level === 'AH' ? 12 : 10;
          if (step >= min && step <= max) {
            const shift = key.pitch > 24 ? 1 : 0;
            candidates.push({...key, pitch:key.pitch - shift * 12, x:key.x - shift * 336, baseOctave:baseOctave + shift, type:'find', note:{...answer, clef, step, octave, accidental:answer.offset === 1 ? 'sharp' : answer.offset === -1 ? 'flat' : null}});
          }
        }
      }
    }
    return candidates;
  }
  function candidates(options,types,level) {
    if(['H','AH'].includes(level))return advancedCandidates(options,level);
    return Object.keys(types).filter(type=>types[type]&&['name','find'].includes(type)).flatMap(type=>pool(options).flatMap(key=>writtenNotes(key,options).filter(note=>type!=='find'||(note.step>=-2&&note.step<=10)).map(note=>({...key,type,note}))));
  }
  const position=q=>q.baseOctave!=null?`${q.baseOctave}:${q.pitch}:${q.note.clef}`:q.pitch;
  function create(random=Math.random) {
    const setups=new Map();
    function least(items,counts,key) {
      const min=Math.min(...items.map(item=>counts.get(key(item))||0)),eligible=items.filter(item=>(counts.get(key(item))||0)===min);
      const value=random(),fraction=Number.isFinite(value)?Math.max(0,Math.min(1,value)):0;
      const result=eligible[Math.min(eligible.length-1,Math.floor(fraction*eligible.length))];counts.set(key(result),(counts.get(key(result))||0)+1);return result;
    }
    return {next(options,types,level=null,previous=null){
      const config=JSON.stringify([options,types,level]);
      if(!setups.has(config))setups.set(config,{pool:candidates(options,types,level),counts:new Map(),last:null});
      const state=setups.get(config),prior=previous??state.last,alternatives=state.pool.filter(q=>position(q)!==prior),available=alternatives.length?alternatives:state.pool;
      if(!available.length)throw new Error(!Object.values(types).some(Boolean)?'Select at least one question type.':'Select at least one clef and note group.');
      const counts=state.counts,type=least([...new Set(available.map(q=>q.type))],counts,v=>'type/'+v),typed=available.filter(q=>q.type===type);
      const clef=least([...new Set(typed.map(q=>q.note.clef))],counts,v=>type+'/clef/'+v),clefPool=typed.filter(q=>q.note.clef===clef);
      const answerKey=q=>type==='name'?q.pitch%12:q.note.id;
      const answer=least([...new Set(clefPool.map(answerKey))],counts,v=>type+'/'+clef+'/answer/'+v);
      const q=least(clefPool.filter(q=>answerKey(q)===answer),counts,v=>JSON.stringify(['variant',type,clef,v.baseOctave,v.pitch,v.note.id]));
      state.last=position(q);return {...q,note:{...q.note}};
    }};
  }
  const generators=new WeakMap();
  function makeQuestion(options, types, previousPitch = null, random = Math.random, level = null) {
    if(!generators.has(random))generators.set(random,create(random));
    return generators.get(random).next(options,types,level,previousPitch);
  }
  function advancedQuestion(options,level,previousPitch=null,random=Math.random){return makeQuestion(options,{find:true},previousPitch,random,level);}

  function classroomSettings(input) {
    if (!input || !defaults[input.level]) return null;
    const options = input.options;
    if (!options || options.octaves !== defaults[input.level].octaves) return null;
    if (!['naturals','sharps','flats','enharmonics'].every(key => typeof options[key] === 'boolean')) return null;
    if (input.level !== 'N5' && (!options.naturals || options.sharps || options.flats || options.enharmonics)) return null;
    const clean = Object.fromEntries(['octaves','naturals','sharps','flats','enharmonics'].map(key => [key,options[key]]));
    if (!answers(clean).length) return null;
    return { level: input.level, options: clean, showC: input.showC === true };
  }
  const api = { letters, defaults, subtitles, keys, visibleKeys, answers, pool, question, correct, writtenNotes, advancedQuestion, makeQuestion, create, candidates, normaliseOptions, normaliseTypes, classroomSettings };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KeyboardNotes = api;
})(typeof window !== 'undefined' ? window : globalThis);
