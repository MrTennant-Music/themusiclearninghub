(function (root, factory) {
  const library = typeof module === 'object' && module.exports ? require('./composition-progressions.js') : root.MLH.CompositionProgressions;
  const api = factory(library);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.MLH = root.MLH || {};
    root.MLH.ChordGenerator = api;
  }
})(typeof window !== 'undefined' ? window : null, function (progressionLibrary) {
  'use strict';

  const mod = n => (n % 12 + 12) % 12;
  const natural = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11
  };
  const sharpNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const flatNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const qualities = {
    '': [0, 4, 7],
    m: [0, 3, 7],
    dim: [0, 3, 6],
    aug: [0, 4, 8],
    sus2: [0, 2, 7],
    sus4: [0, 5, 7],
    '5': [0, 7],
    '6': [0, 4, 7, 9],
    m6: [0, 3, 7, 9],
    '7': [0, 4, 7, 10],
    maj7: [0, 4, 7, 11],
    m7: [0, 3, 7, 10],
    mMaj7: [0, 3, 7, 11],
    dim7: [0, 3, 6, 9],
    m7b5: [0, 3, 6, 10],
    '9': [0, 4, 7, 10, 14],
    m9: [0, 3, 7, 10, 14],
    maj9: [0, 4, 7, 11, 14],
    '11': [0, 4, 7, 10, 14, 17],
    m11: [0, 3, 7, 10, 14, 17],
    maj11: [0, 4, 7, 11, 14, 17],
    '13': [0, 4, 7, 10, 14, 17, 21],
    m13: [0, 3, 7, 10, 14, 17, 21],
    maj13: [0, 4, 7, 11, 14, 17, 21],
    add9: [0, 4, 7, 14],
    madd9: [0, 3, 7, 14],
    add11: [0, 4, 7, 17],
    '7sus4': [0, 5, 7, 10],
    '7sus2': [0, 2, 7, 10],
    '9sus4': [0, 5, 7, 10, 14],
    '6/9': [0, 4, 7, 9, 14],
    m69: [0, 3, 7, 9, 14],
    '7b5': [0, 4, 6, 10],
    '7#5': [0, 4, 8, 10],
    augmaj7: [0, 4, 8, 11],
    '7b9': [0, 4, 7, 10, 13],
    '7#9': [0, 4, 7, 10, 15],
    'maj7#11': [0, 4, 7, 11, 18]
  };
  const modes = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    locrian: [0, 1, 3, 5, 6, 8, 10],
    harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
    melodicMinor: [0, 2, 3, 5, 7, 9, 11]
  };
  const presets = {
    pop: [0, 4, 5, 3],
    ballad: [0, 5, 3, 4],
    classic: [0, 5, 3, 4],
    minor: [0, 5, 2, 6],
    jazz: [1, 4, 0, 5],
    descending: [5, 4, 3, 4],
    blues: [0, 0, 0, 0, 3, 3, 0, 0, 4, 3, 0, 4]
  };
  function noteName(pc, flats = false) {
    return (flats ? flatNames : sharpNames)[mod(pc)];
  }
  function keyName(key, mode = 'major') {
    const major = ['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
    const minor = ['C','C#','D','Eb','E','F','F#','G','G#','A','Bb','B'];
    return (mode === 'minor' || /Minor$/.test(mode) ? minor : major)[pitchClass(key)];
  }
  function pitchNames(key, mode = 'major') {
    const root=pitchClass(key), scale=modes[mode];
    if(!scale) throw new Error('Choose a valid scale.');
    const letters=['C','D','E','F','G','A','B'],tonic=keyName(key,mode);
    const start=letters.indexOf(tonic[0]);
    const useSharps=tonic.includes('#') || ['D','E','G','A','B'].includes(tonic) && mode!=='minor' || ['E','B'].includes(tonic)&&mode==='minor';
    const names=(useSharps?sharpNames:flatNames).slice();
    scale.forEach((offset,i)=>{
      const letter=letters[(start+i)%7],difference=(root+offset-natural[letter]+18)%12-6;
      names[mod(root+offset)]=letter+(difference>0?'#'.repeat(difference):'b'.repeat(-difference));
    });
    return names;
  }
  function spellChord(symbol, key, mode = 'major') {
    const chord=parse(symbol);if(chord.rest)return '-';
    const names=pitchNames(key,mode);
    return names[chord.root]+chord.quality+(/\/[A-G]/.test(chord.symbol)?'/'+names[chord.bass]:'');
  }
  function notation(text) {return String(text).replace(/#/g,'♯').replace(/b/g,'♭');}
  function chordToneNames(symbol) {
    const chord=parse(symbol);if(chord.rest)return [];
    const letters=['C','D','E','F','G','A','B'],start=letters.indexOf(chord.symbol[0]);
    const steps={0:0,2:1,3:2,4:2,5:3,6:4,7:4,8:4,9:5,10:6,11:6,13:8,14:8,15:8,16:10,17:10,18:10,20:12,21:12,22:12};
    return chord.intervals.map(interval=>{
      const step=interval===9&&chord.quality==='dim7'?6:steps[interval];
      const letter=letters[(start+step)%7],difference=(chord.root+interval-natural[letter]+18)%12-6;
      return letter+(difference>0?'#'.repeat(difference):'b'.repeat(-difference));
    });
  }
  function pitchClass(value) {
    if (Number.isInteger(value)) return mod(value);
    const match = /^([A-Ga-g])([#b♯♭]{0,3})$/.exec(String(value));
    if (!match) throw new Error('Choose a valid root note.');
    return mod(natural[match[1].toUpperCase()] + Array.from(match[2]).reduce((sum, c) => sum + (/[\#♯]/.test(c) ? 1 : -1), 0));
  }
  function parse(value) {
    const text = String(value).trim().replace(/♯/g, '#').replace(/♭/g, 'b').replace(/\s+/g, '');
    if (text === '-' || /^N\.?C\.?$/i.test(text)) return {
      symbol: '-',
      root: null,
      quality: '',
      intervals: [],
      bass: null,
      rest: true
    };
    const match = /^([A-Ga-g])([#b]{0,2})(.*?)(?:\/([A-Ga-g])([#b]{0,2}))?$/.exec(text);
    if (!match) throw new Error('Enter a chord such as C, Am7 or G/B.');
    let quality = match[3];
    const aliases = {
      major: '',
      maj: '',
      minor: 'm',
      min: 'm',
      '-': 'm',
      M: '',
      M7: 'maj7',
      M9: 'maj9',
      M11: 'maj11',
      M13: 'maj13',
      'Δ': 'maj7',
      'Δ7': 'maj7',
      '°': 'dim',
      '°7': 'dim7',
      'o': 'dim',
      'o7': 'dim7',
      'ø': 'm7b5',
      'ø7': 'm7b5',
      '+': 'aug',
      '+7': '7#5',
      sus: 'sus4',
      '69': '6/9',
      min7: 'm7',
      min9: 'm9',
      min11: 'm11',
      min13: 'm13'
    };
    if (Object.prototype.hasOwnProperty.call(aliases, quality)) quality = aliases[quality];
    let intervals = qualities[quality];
    if (!intervals) {
      quality = quality.replace(/[(),]/g, '');
      const altered = /^(maj13|maj11|maj9|maj7|mMaj7|m13|m11|m9|m7|13|11|9|7)((?:[b#](?:13|11|9|5))+)$/.exec(quality);
      if (!altered) throw new Error('That chord type is not recognised.');
      intervals = qualities[altered[1]].slice();
      const degrees = {
        5: 7,
        9: 14,
        11: 17,
        13: 21
      };
      const seen = new Set();
      for (const [, accidental, degree] of altered[2].matchAll(/([b#])(13|11|9|5)/g)) {
        if (seen.has(degree)) throw new Error('Use one alteration for each chord degree.');
        seen.add(degree);
        const base = degrees[degree];
        intervals = intervals.filter(value => value !== base);
        intervals.push(base + (accidental === '#' ? 1 : -1));
      }
      intervals.sort((a, b) => a - b);
    }
    const spelling = match[1].toUpperCase() + match[2];
    const root = pitchClass(spelling);
    const bassSpelling = match[4] ? match[4].toUpperCase() + match[5] : null;
    return {
      symbol: spelling + quality + (bassSpelling ? '/' + bassSpelling : ''),
      root,
      quality,
      intervals: intervals.slice(),
      bass: bassSpelling ? pitchClass(bassSpelling) : root,
      rest: false
    };
  }
  function notes(chord, inversion = 0, octave = 4) {
    const parsed = typeof chord === 'string' ? parse(chord) : chord;
    if (parsed.rest) return [];
    if (!Number.isInteger(inversion) || !Number.isInteger(octave)) throw new Error('Invalid chord voicing.');
    const values = parsed.intervals.map(interval => (octave + 1) * 12 + parsed.root + interval);
    if (Math.abs(inversion) > 24) throw new Error('Inversion is out of range.');
    for (let n = 0; n < inversion; n++) {
      const first = values.shift();
      values.push(first + 12);
      values.sort((a, b) => a - b);
    }
    for (let n = 0; n > inversion; n--) {
      const last = values.pop();
      values.unshift(last - 12);
      values.sort((a, b) => a - b);
    }
    return values;
  }
  function transpose(symbol, semitones) {
    const chord = parse(symbol);
    if (chord.rest) return '-';
    if (!Number.isInteger(semitones)) throw new Error('Transpose by a whole number of semitones.');
    const useFlats = /b/.test(chord.symbol.split('/')[0].slice(0, 2)) || semitones < 0;
    const hasSlash = /\/[A-G]/.test(chord.symbol);
    return noteName(chord.root + semitones, useFlats) + chord.quality + (hasSlash ? '/' + noteName(chord.bass + semitones, useFlats) : '');
  }
  function diatonic(key, mode = 'major') {
    const root = pitchClass(key),
      scale = modes[mode];
    if (!scale) throw new Error('Choose a valid scale.');
    const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    const rootSpelling = typeof key === 'string' ? key : keyName(key, mode);
    const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      rootLetter = letters.indexOf(rootSpelling[0].toUpperCase());
    return scale.map((offset, index) => {
      const third = mod(scale[(index + 2) % 7] - offset),
        fifth = mod(scale[(index + 4) % 7] - offset);
      const quality = third === 3 ? fifth === 6 ? 'dim' : 'm' : fifth === 8 ? 'aug' : '';
      const letter = letters[(rootLetter + index) % 7],
        difference = (root + offset - natural[letter] + 18) % 12 - 6;
      const spelling = Math.abs(difference) <= 2 ? letter + (difference > 0 ? '#'.repeat(difference) : 'b'.repeat(-difference)) : noteName(root + offset);
      const symbol = spelling + quality;
      return {
        ...parse(symbol),
        degree: index + 1,
        roman: (quality === 'm' || quality === 'dim' ? romans[index].toLowerCase() : romans[index]) + (quality === 'dim' ? '°' : quality === 'aug' ? '+' : '')
      };
    });
  }
  function progressionChoices(key, mode = 'major', count = 4) {
    const chords = diatonic(key, mode), scale = modes[mode];
    const sourceMode = mode === 'minor' ? 'minor' : 'major';
    const entries = progressionLibrary.entries.filter(entry => entry.mode === sourceMode && entry.bars === count);
    const seen = new Set();
    return entries.map(entry => {
      const symbols = entry.chords.map(([degree, quality]) => {
        const chord = chords[degree];
        // Keep the source harmony in major/minor. Legacy modal sessions adapt incompatible extensions.
        if (!qualities[quality].every(interval => scale.includes(mod(scale[degree] + interval)))) {
          quality = qualities[quality].length === 4 ? diatonicSeventh(scale, degree, chord.quality) : chord.quality;
        }
        return chord.symbol.slice(0, chord.symbol.length - chord.quality.length) + quality;
      });
      return {id:entry.id, symbols};
    }).filter(choice => {
      const signature = choice.symbols.join('|');
      if (seen.has(signature)) return false;
      seen.add(signature); return true;
    });
  }
  function diatonicSeventh(scale, degree, triad) {
    const seventh = mod(scale[(degree + 6) % 7] - scale[degree]);
    return triad === 'dim' ? seventh === 9 ? 'dim7' : 'm7b5' : triad === 'm' ? seventh === 11 ? 'mMaj7' : 'm7' : triad === 'aug' ? seventh === 11 ? 'augmaj7' : '7#5' : seventh === 11 ? 'maj7' : '7';
  }
  function harmonicDominant(symbol,key,mode){
    if(mode!=='minor')return symbol;
    const chord=parse(symbol);
    if(chord.rest||chord.root!==mod(pitchClass(key)+7)||!['m','m7'].includes(chord.quality))return symbol;
    return chord.symbol.replace(/^([A-G][#b]*)m(7)?(?=\/|$)/,(_,root,seventh)=>root+(seventh?'7':''));
  }
  function studioDiatonic(key,mode='major'){
    return diatonic(key,mode).map(chord=>mode==='minor'&&chord.degree===5?{...chord,...parse(harmonicDominant(chord.symbol,key,mode)),roman:'V'}:chord);
  }
  function randomProgressionChoices(key, mode = 'major', count = 4) {
    let choices = progressionChoices(key, mode, count).map(choice=>({...choice,symbols:choice.symbols.map(symbol=>harmonicDominant(symbol,key,mode))}));
    if(count===4){
      const tonic=diatonic(key,mode)[0].symbol,seen=new Set();
      // Restore the complete pool, rotating loops to a tonic-root chord when
      // available. Otherwise establish the tonic before the remaining harmony.
      return choices.map(choice=>{
        const symbols=choice.symbols.slice();
        const firstTonic=symbols.findIndex(symbol=>parse(symbol).root===pitchClass(key));
        if(firstTonic>0)symbols.push(...symbols.splice(0,firstTonic));
        else if(firstTonic<0)symbols[0]=tonic;
        return {...choice,symbols};
      }).filter(choice=>{
        const signature=choice.symbols.join('|');
        if(seen.has(signature))return false;
        seen.add(signature);return true;
      });
    }
    if (count !== 8) return choices;
    const chords = diatonic(key, mode);
    const tonic = chords[0].symbol;
    // Minor-key cadences use the raised leading note in a major dominant.
    const dominantRoot = chords[4].symbol.slice(0, chords[4].symbol.length - chords[4].quality.length);
    const dominant = mode === 'minor' || mode === 'major' ? dominantRoot : chords[4].symbol;
    const seen = new Set();
    return choices.map((choice, index) => {
      const symbols = choice.symbols.slice();
      // Two four-bar phrases: an open question, or a weaker tonic arrival,
      // followed by a dominant-to-tonic answer at bars seven and eight.
      symbols[0] = tonic;
      if (index % 3 === 0) {
        symbols[2] = dominant;
        symbols[3] = tonic;
      } else {
        symbols[2] = chords[index % 2 ? 3 : 1].symbol;
        symbols[3] = dominant;
      }
      symbols[6] = dominant;
      symbols[7] = tonic;
      return {...choice, symbols};
    }).filter(choice => {
      const signature = choice.symbols.join('|');
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
  }
  function createProgressionShuffler(random = Math.random) {
    const bags = new Map();
    return function next(key, mode = 'major', count = 4, current = []) {
      if(![4,8].includes(count))throw new Error('Choose a 4 or 8 bar progression.');
      const context = `${pitchClass(key)}:${mode}:${count}`;
      let state = bags.get(context);
      if (!state) { state = {remaining:[], last:''}; bags.set(context,state); }
      if (!state.remaining.length) {
        state.remaining = randomProgressionChoices(key,mode,count);
        if (!state.remaining.length) throw new Error('Choose a 4 or 8 bar progression.');
        for (let i=state.remaining.length-1;i>0;i--) {
          const j=Math.min(i,Math.max(0,Math.floor(random()*(i+1))));
          [state.remaining[i],state.remaining[j]]=[state.remaining[j],state.remaining[i]];
        }
      }
      const currentSignature = current.join('|');
      let index = state.remaining.findIndex(choice => {
        const signature=choice.symbols.join('|');
        return signature !== state.last && signature !== currentSignature;
      });
      // If the only remaining entry is already on screen, exhaust it without repeating it.
      if (index<0 && state.remaining.length===1) {state.remaining=[];return next(key,mode,count,current);}
      if(index<0) index=0;
      const choice=state.remaining.splice(index,1)[0];
      state.last=choice.symbols.join('|');
      return choice.symbols.slice();
    };
  }
  function generate(key, mode = 'major', count = 4, preset = 'random', random = Math.random) {
    if (!Number.isInteger(count) || count < 1 || count > 128) throw new Error('Choose between 1 and 128 chords.');
    if (preset === 'random' && [4,8,16].includes(count)) {
      const choices=progressionChoices(key,mode,count);
      return choices[Math.min(choices.length-1,Math.max(0,Math.floor(random()*choices.length)))].symbols.slice();
    }
    const choices = Object.keys(presets).filter(name=>name!=='blues');
    const chosen = preset === 'random' ? choices[Math.floor(random() * choices.length) % choices.length] : preset;
    if (preset === 'minor') mode = 'minor';
    const chords = diatonic(key, mode);
    const degrees = presets[chosen];
    if (!degrees) throw new Error('Choose a valid progression.');
    return Array.from({
      length: count
    }, (_, i) => {
      let chord = chords[degrees[i % degrees.length]];
      if (chosen === 'blues') return noteName(chord.root, [1, 3, 5, 8, 10].includes(pitchClass(key))) + '7';
      if (chosen === 'jazz') {
        const degree = degrees[i % degrees.length],
          seventh = mod(modes[mode][(degree + 6) % 7] - modes[mode][degree]);
        const quality = chord.quality === 'dim' ? seventh === 9 ? 'dim7' : 'm7b5' : chord.quality === 'm' ? seventh === 11 ? 'mMaj7' : 'm7' : chord.quality === 'aug' ? seventh === 11 ? 'augmaj7' : '7#5' : seventh === 11 ? 'maj7' : '7';
        return chord.symbol.slice(0, chord.symbol.length - chord.quality.length) + quality;
      }
      return chord.symbol;
    });
  }
  const patternMetres={vamp:null,broken_chords:null,alberti_bass:null,rock_octaves:null,power_chords:null,stride_piano:null,walking_bass:null,block:null,arpeggio:null,ballad:['2/4','3/4','4/4','6/8'],waltz:['3/4'],pop:['2/4','4/4'],rock:['2/4','4/4'],swing:['4/4'],reggae:['4/4'],bossa:['4/4'],dance:['2/4','4/4']};
  function patternAllowed(pattern,signature){return Object.hasOwn(patternMetres,pattern)&&(patternMetres[pattern]===null||patternMetres[pattern].includes(signature));}
  function validate(project) {
    if (!project || typeof project !== 'object' || Array.isArray(project)) throw new Error('This is not a chord project.');
    if (project.version !== undefined && project.version !== 1) throw new Error('Unsupported chord project version.');
    const out = JSON.parse(JSON.stringify(project));
    out.version = 1;
    out.title = typeof out.title === 'string' ? out.title.slice(0, 120) : 'Title';
    out.composer = typeof out.composer === 'string' ? out.composer.slice(0,120) : '';
    out.melodyDisplayOctaves=out.melodyDisplayOctaves===2?2:1;
    out.scoreInstrumentNames=Object.fromEntries(['melody','piano-upper','drums'].filter(key=>typeof out.scoreInstrumentNames?.[key]==='string').map(key=>[key,out.scoreInstrumentNames[key].slice(0,40)]));
    out.bassAsPiano = out.bassAsPiano === true;
    out.scoreDisplay=Object.fromEntries(['tempo','chords','melody','piano','drums','title','composer'].map(key=>[key,out.scoreDisplay?.[key]!==false]));
    out.tempo = out.tempo === undefined ? 100 : Number(out.tempo);
    if (!Number.isFinite(out.tempo) || out.tempo < 30 || out.tempo > 300) throw new Error('Tempo must be between 30 and 300 BPM.');
    out.key = pitchClass(out.key === undefined ? 0 : out.key);
    out.mode = out.mode || 'major';
    if (!Object.hasOwn(modes,out.mode)) throw new Error('Invalid scale.');
    if(!['piano','electricpiano','guitar','organ','strings','flute','marimba','brass','synth','pad'].includes(out.accompanimentInstrument))out.accompanimentInstrument=out.instrument||'piano';
    out.accompanimentSustain=out.accompanimentSustain===true;
    out.accompanimentOctave=Number.isInteger(out.accompanimentOctave)?Math.max(2,Math.min(6,out.accompanimentOctave)):3;
    out.accompanimentDisplayOctaves=out.accompanimentDisplayOctaves===2?2:1;
    out.accompanimentFilter=['scale','chromatic','pentatonic','blues'].includes(out.accompanimentFilter)?out.accompanimentFilter:'scale';
    out.melodyInstrument=out.melodyInstrument||'piano';
    if(!['piano','electricpiano','guitar','organ','strings','flute','marimba','brass','synth','pad'].includes(out.melodyInstrument))out.melodyInstrument='piano';
    out.quantise = out.quantise === undefined ? 8 : Number(out.quantise);
    if (![2, 4, 8, 16].includes(out.quantise)) throw new Error('Choose minim, crotchet, quaver or semiquaver as the shortest rhythm.');
    out.accompanimentQuantise=[2,4,8,16].includes(out.accompanimentQuantise)?out.accompanimentQuantise:out.quantise;
    for(const track of ['bass','melody'])if(out[track+'Bars']!==undefined){
      const bars=Number(out[track+'Bars']);
      if(!Number.isInteger(bars)||bars<1||bars>8)throw new Error('Choose a pattern length from 1 to 8 bars.');
      out[track+'Bars']=Math.min(bars,out.progressionBars||8);
    }
    out.timeSignature = out.timeSignature || '4/4';
    if (!['2/4', '3/4', '4/4', '5/4', '6/8', '7/8', '9/8', '12/8'].includes(out.timeSignature)) throw new Error('Invalid time signature.');
    if(out.drums){const drums=typeof window!=='undefined'?window.MLH?.DrumMachine:typeof require==='function'?require('./drum-machine-core.js'):null;if(drums)out.drums=drums.validateDrums(out.drums,Number(out.timeSignature.split('/')[0])*4/Number(out.timeSignature.split('/')[1]));}
    out.style=out.style||'pop';
    if(!patternAllowed(out.style,out.timeSignature))out.style='block';
    out.octave = out.octave === undefined ? 4 : Number(out.octave);
    if (!Number.isInteger(out.octave) || out.octave < 2 || out.octave > 6) throw new Error('Octave must be between 2 and 6.');
    out.swing = Number(out.swing) || 0;
    if (out.swing < 0 || out.swing > 100) throw new Error('Invalid swing amount.');
    out.volumes = {
      chords: 80,
      bass: 65,
      drums: 55,
      melody: 100,
      ...out.volumes
    };
    for (const name of ['chords', 'bass', 'drums', 'melody']) {
      const value = Number(out.volumes[name]);
      if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error('Volume must be between 0 and 100.');
      out.volumes[name] = value;
    }
    if (!Array.isArray(out.sections) || out.sections.length < 1 || out.sections.length > 32) throw new Error('A project needs between 1 and 32 sections.');
    out.sections = out.sections.map((section, si) => {
      if (!section || typeof section !== 'object') throw new Error('Invalid section.');
      const repeats = section.repeats === undefined ? 1 : Number(section.repeats);
      if (!Number.isInteger(repeats) || repeats < 1 || repeats > 16) throw new Error('Section repeats must be between 1 and 16.');
      if (!Array.isArray(section.chords) || section.chords.length < 1 || section.chords.length > 128) throw new Error('Each section needs between 1 and 128 chords.');
      return {
        ...section,
        name: String(section.name || 'Section ' + (si + 1)).slice(0, 80),
        repeats,
        variation: Math.max(0, Math.min(2, Number(section.variation) || 0)),
        chords: section.chords.map(item => {
          if (!item || typeof item !== 'object') throw new Error('Invalid chord entry.');
          if(item.suggestionScale!==undefined&&!Object.hasOwn(modes,item.suggestionScale))throw new Error('Invalid chord suggestion scale.');
          if(item.suggestionKey!==undefined&&(!Number.isInteger(item.suggestionKey)||item.suggestionKey<0||item.suggestionKey>11))throw new Error('Invalid chord suggestion key.');
          let secondChord;
          if(item.secondChord!==undefined&&item.secondChord!==null){
            const second=item.secondChord;
            if(typeof second!=='object'||Array.isArray(second)||second.secondChord)throw Error('Invalid second chord.');
            const parsedSecond=parse(second.symbol),inversion=Number(second.inversion||0),octave=Number(second.octave??item.octave??out.octave);
            if(!Number.isInteger(inversion)||Math.abs(inversion)>Math.max(0,parsedSecond.intervals.length-1))throw Error('Invalid second chord inversion.');
            if(!Number.isInteger(octave)||octave<2||octave>6)throw Error('Invalid second chord octave.');
            secondChord={symbol:parsedSecond.symbol,inversion,octave};
          }
          const chord = parse(item.symbol),
            beats = Number(item.beats),
            inversion = Number(item.inversion || 0);
          if (!Number.isFinite(beats) || beats < 0.25 || beats > 32 || !Number.isInteger(beats * 4)) throw new Error('Chord duration must be ¼ to 32 beats, in quarter-beat steps.');
          if (!Number.isInteger(inversion) || Math.abs(inversion) > Math.max(0, chord.intervals.length - 1)) throw new Error('Invalid inversion.');
          const tempo = item.tempo === undefined || item.tempo === null || item.tempo === '' ? null : Number(item.tempo);
          if (tempo !== null && (!Number.isFinite(tempo) || tempo < 30 || tempo > 300)) throw new Error('Chord tempo must be between 30 and 300 BPM.');
          const octave = item.octave === undefined ? out.octave : Number(item.octave);
          if (!Number.isInteger(octave) || octave < 2 || octave > 6) throw new Error('Chord octave must be between 2 and 6.');
          const transpose = item.transpose === undefined ? 0 : Number(item.transpose);
          if (!Number.isInteger(transpose) || transpose < -12 || transpose > 12) throw new Error('Chord transposition must be between -12 and 12 semitones.');
          return {
            ...item,
            symbol: chord.symbol,
            ...(secondChord?{secondChord}:{secondChord:undefined}),
            beats,
            inversion,
            octave,
            tempo,
            transpose,
            label: typeof item.label === 'string' ? item.label.slice(0, 80) : ''
          };
        })
      };
    });
    if(out.importedParts!==undefined){
      if(!Array.isArray(out.importedParts)||out.importedParts.length>128)throw Error('Invalid imported MIDI parts.');
      const ids=new Set();
      out.importedParts=out.importedParts.map((part,index)=>{
        const id=String(part.id||'part-'+index);if(ids.has(id))throw Error('Duplicate imported MIDI part.');ids.add(id);
        if(!Number.isInteger(part.channel)||part.channel<0||part.channel>15||!Number.isInteger(part.program)||part.program<0||part.program>127||!Array.isArray(part.notes)||part.notes.length>16384)throw Error('Invalid imported MIDI part.');
        return {...part,id,name:String(part.name||gmName(part.program)).slice(0,120),muted:part.muted===true,notes:part.notes.map(note=>{
          if(!Number.isInteger(note.midi)||note.midi<0||note.midi>127||!Number.isFinite(note.beat)||note.beat<0||!Number.isFinite(note.duration)||note.duration<=0||note.duration>65536)throw Error('Invalid imported MIDI note.');
          return {...note,program:Number.isInteger(note.program)&&note.program>=0&&note.program<=127?note.program:part.program,velocity:Math.max(1,Math.min(127,Number(note.velocity)||90))};
        })};
      });
    }
    if(out.upbeatBeats!==undefined){const bar=Number(out.timeSignature.split('/')[0])*4/Number(out.timeSignature.split('/')[1]);if(!Number.isFinite(out.upbeatBeats)||out.upbeatBeats<0||out.upbeatBeats>=bar||out.upbeatBeats*2%1)throw Error('Choose an upbeat shorter than one bar.');}
    if(out.counterMelodies!==undefined){if(!Array.isArray(out.counterMelodies)||out.counterMelodies.length>3)throw Error('Use up to three counter-melodies.');const ids=new Set();out.counterMelodies=out.counterMelodies.map((part,i)=>{if(!part||!/^counter-[1-9][0-9]*$/.test(part.id)||ids.has(part.id))throw Error('Invalid counter-melody.');ids.add(part.id);return {id:part.id,name:String(!part.name||/^Counter-Melody [1-3]$/.test(part.name)?'Countermelody'+(i?' '+(i+1):''):part.name).slice(0,60),instrument:['piano','electricpiano','guitar','organ','strings','flute','marimba','brass','synth','pad'].includes(part.instrument)?part.instrument:'piano'};});}
    for(const track of ['melody','bass','accompaniment']) {
      if(track!=='melody'&&out[track]==null)continue;
    out[track] = out[track] || [];
    if (!Array.isArray(out[track]) || out[track].length > 4096) throw new Error('Invalid ' + track + '.');
    out[track] = out[track].map(note => {
      if (!note || !Number.isInteger(note.midi) || note.midi < 21 || note.midi > 108 || !Number.isFinite(note.beat) || note.beat < (track==='melody'?-(out.upbeatBeats||0):0) || note.beat > 65536 || !Number.isFinite(note.duration) || note.duration <= 0 || note.duration > 32) throw new Error('Invalid ' + track + ' note.');
      if(track==='melody'&&note.layerId&&note.layerId!=='main'&&!out.counterMelodies?.some(l=>l.id===note.layerId))throw Error('This note has no matching melody part.');
      return {
        ...note,
        ...(track==='accompaniment'?{gate:Number.isFinite(note.gate)?Math.max(.01,Math.min(1,note.gate)):.85}:{}),
        velocity: Math.min(127, Math.max(1, Number(note.velocity) || 90))
      };
    });
    }
    const length = out.sections.reduce((sum, section) => sum + section.repeats * section.chords.reduce((n, c) => n + c.beats, 0), 0);
    if (length > 16384) throw new Error('This progression is too long.');
    return out;
  }
  const voiceLeadingCache = new Map();
  function voiceLead(previous, target) {
    if (!previous.length || !target.length) return target.slice();
    const key = previous.join(',') + ':' + target.map(n => ((n % 12) + 12) % 12).join(',');
    if (voiceLeadingCache.has(key)) return voiceLeadingCache.get(key).slice();
    const distinct = target.length <= previous.length;
    let best = null, bestScore = [Infinity, Infinity, Infinity];
    // Assign each chord tone to a preceding voice, choosing its nearest octave.
    // Extra voices may share a predecessor; disappearing voices may be omitted.
    function search(index, used, pitches, movement, largest) {
      if (movement > bestScore[0]) return;
      if (index === target.length) {
        if (!distinct && used !== (1 << previous.length) - 1) return;
        const sorted = pitches.slice().sort((a, b) => a - b);
        const score = [movement, largest, sorted[sorted.length - 1] - sorted[0]];
        const better = score.some((value, i) => value < bestScore[i] && score.slice(0, i).every((v, j) => v === bestScore[j]));
        if (better) { best = sorted; bestScore = score; }
        return;
      }
      const pc = ((target[index] % 12) + 12) % 12;
      previous.forEach((before, voice) => {
        if (distinct && (used & (1 << voice))) return;
        const lower = pc + Math.floor((before - pc) / 12) * 12;
        const candidates = [lower, lower + 12].filter(n => n >= 0 && n <= 127);
        const distance = Math.min(...candidates.map(n => Math.abs(n - before)));
        candidates.filter(n => Math.abs(n - before) === distance).forEach(n => {
          search(index + 1, used | (1 << voice), [...pitches, n], movement + distance, Math.max(largest, distance));
        });
      });
    }
    search(0, 0, [], 0, 0);
    const result = best || target.slice();
    if (voiceLeadingCache.size >= 512) voiceLeadingCache.clear();
    voiceLeadingCache.set(key, result);
    return result.slice();
  }
  function timeline(project) {
    const p = validate(project),
      events = [];
    let beat = 0,
      previousVoicing = [],
      tempo = p.tempo;
    p.sections.forEach((section, sectionIndex) => {
      for (let repeatIndex = 0; repeatIndex < section.repeats; repeatIndex++) section.chords.forEach((barItem, chordIndex) => {
        const parts=barItem.secondChord?[{...barItem,beats:barItem.beats/2},{...barItem,...barItem.secondChord,beats:barItem.beats/2}]:[barItem];
        parts.forEach(item=>{
        const chord = parse(item.symbol);
        if (item.tempo !== null) tempo = item.tempo;
        let pitches = notes(chord, item.inversion, item.octave).map(n => n + item.transpose);
        const soundsChord = !chord.rest && !['silence', 'break', 'bass'].includes(item.type);
        if (soundsChord) {
          if (!previousVoicing.length && p.voicing === 'open') pitches = pitches.map((n, i) => i % 2 ? n + 12 : n).sort((a, b) => a - b);
          pitches = voiceLead(previousVoicing, pitches);
          previousVoicing = pitches;
        }
        events.push({
          beat,
          duration: item.beats,
          symbol: item.transpose ? transpose(chord.symbol, item.transpose) : chord.symbol,
          originalSymbol: chord.symbol,
          notes: pitches,
          bass: chord.rest ? null : 36 + (p.pedal ? p.key : chord.bass) + item.transpose,
          sectionIndex,
          chordIndex,
          repeatIndex,
          variation: section.variation || 0,
          tempo,
          transpose: item.transpose,
          label: item.label
        });
        beat += item.beats;
        });
      });
    });
    return events;
  }
  function totalBeats(project) {
    return timeline(project).reduce((sum, event) => sum + event.duration, 0);
  }
  function secondsAtBeat(project, beat) {
    if (!Number.isFinite(beat)) throw new Error('Invalid beat position.');
    const list = timeline(project);
    if (beat < 0) return beat * 60 / list[0].tempo;
    let seconds = 0;
    for (const event of list) {
      if (beat <= event.beat + event.duration) return seconds + Math.max(0, beat - event.beat) * 60 / event.tempo;
      seconds += event.duration * 60 / event.tempo;
    }
    const last = list[list.length - 1];
    return seconds + (beat - last.beat - last.duration) * 60 / last.tempo;
  }
  function beatAtSeconds(project, seconds) {
    if (!Number.isFinite(seconds)) throw new Error('Invalid time position.');
    const list = timeline(project);
    if (seconds < 0) return seconds * list[0].tempo / 60;
    let elapsed = 0;
    for (const event of list) {
      const duration = event.duration * 60 / event.tempo;
      if (seconds <= elapsed + duration) return event.beat + (seconds - elapsed) * event.tempo / 60;
      elapsed += duration;
    }
    const last = list[list.length - 1];
    return last.beat + last.duration + (seconds - elapsed) * last.tempo / 60;
  }
  function importedMidi(project,arrangement,includeProject){
    const p=validate(project),division=p.importedMidiDivision||480,parts=new Map(),list=arrangement||p.importedParts.flatMap(part=>part.notes.map(n=>({...n,partId:part.id,partName:part.name,channel:part.channel,program:n.program??part.program,percussion:part.percussion,velocity:n.velocity/127,track:'imported'})));
    const encode=s=>Array.from(new TextEncoder().encode(s)),varlen=n=>{const bytes=[n&127];while((n>>>=7)>0)bytes.unshift((n&127)|128);return bytes;},meta=(type,text)=>{const bytes=encode(text);return [255,type,...varlen(bytes.length),...bytes];};
    const int=(n,count)=>Array.from({length:count},(_,i)=>Math.floor(n/2**((count-i-1)*8))&255);
    const makeTrack=events=>{events.sort((a,b)=>a.tick-b.tick||a.order-b.order);const bytes=[];let tick=0;events.forEach(e=>{bytes.push(...varlen(Math.max(0,e.tick-tick)));for(const byte of e.data)bytes.push(byte);tick=e.tick;});bytes.push(0,255,47,0);return [...encode('MTrk'),...int(bytes.length,4),...bytes];};
    const conductor=[];let previous=null;timeline(p).forEach(e=>{if(e.tempo===previous)return;previous=e.tempo;const tempo=Math.round(60000000/e.tempo);conductor.push({tick:Math.round(e.beat*division),order:0,data:[255,81,3,...int(tempo,3)]});});
    for(const mark of p.studioSectionMap||[{beat:0,timeSignature:p.timeSignature}]){const [top,bottom]=mark.timeSignature.split('/').map(Number);conductor.push({tick:Math.round(mark.beat*division),order:0,data:[255,88,4,top,Math.log2(bottom),24,8]});}
    if(includeProject){const bytes=encode('MLH-CS1\n'+JSON.stringify(p));conductor.push({tick:0,order:0,data:[255,127,...varlen(bytes.length),...bytes]});}
    const original=p.studioArrangement?.items?.flatMap(i=>i.project.importedParts||[])||p.importedParts||[];
    original.forEach(part=>{if(!parts.has(part.id))parts.set(part.id,{...part,events:[{tick:0,order:0,data:meta(3,part.name)},{tick:0,order:0,data:[192|part.channel,part.program]}],lastProgram:part.program});});
    for(const n of list){if(n.track!=='imported')continue;const part=parts.get(n.partId);if(!part)continue;const tick=Math.round(n.beat*division),program=n.program??part.program;if(part.lastProgram!==program){part.events.push({tick,order:0,data:[192|part.channel,program]});part.lastProgram=program;}
      if(n.velocity>0){part.events.push({tick,order:2,data:[144|part.channel,n.midi,Math.max(1,Math.round(n.velocity*127))]},{tick:Math.round((n.beat+n.duration)*division),order:1,data:[128|part.channel,n.midi,0]});}
    }
    const tracks=[makeTrack(conductor),...[...parts.values()].map(part=>makeTrack(part.events))],header=[...encode('MThd'),0,0,0,6,0,1,...int(tracks.length,2),...int(division,2)];
    return new Uint8Array([...header,...tracks.flat()]);
  }
  function midi(project, arrangement, includeProject = false) {
    if(Array.isArray(project.importedParts))return importedMidi(project,arrangement,includeProject);
    const p = validate(project),
      events = [],
      division = 480;
    const add = (tick, data, order = 1) => events.push({
      tick: Math.round(tick),
      data,
      order
    });
    const [numerator, denominator] = p.timeSignature.split('/').map(Number);
    let lastTempo = null;
    timeline(p).forEach(event => {
      if (event.tempo === lastTempo) return;
      lastTempo = event.tempo;
      const tempo = Math.round(60000000 / event.tempo);
      add((event.beat+(p.upbeatBeats||0)) * division, [0xff, 0x51, 3, tempo >> 16 & 255, tempo >> 8 & 255, tempo & 255], 0);
    });
    if(p.upbeatBeats){const tempo=Math.round(60000000/timeline(p)[0].tempo);add(0,[0xff,0x51,3,tempo>>16&255,tempo>>8&255,tempo&255],0);}
    add(0, [0xff, 0x58, 4, numerator, Math.log2(denominator), 24, 8], 0);
    const programs = {
      piano: 0, electricpiano: 4, flute: 73, marimba: 12, brass: 61, pad: 88,
      guitar: 24,
      organ: 19,
      strings: 48,
      synth: 80
    };
    add(0, [0xc0, programs[p.accompanimentInstrument||p.instrument] || 0], 0);
    if(!p.bassAsPiano)add(0, [0xc1, 32], 0);
    for(const lane of melodyLanes(p))add(0,[0xc0|lane.channel,programs[lane.instrument]||0],0);
    function note(channel, pitch, start, duration, velocity) {
      if (pitch < 0 || pitch > 127) return;
      add((start+(p.upbeatBeats||0)) * division, [0x90 | channel, pitch, Math.round(velocity)], 2);
      add((start + duration+(p.upbeatBeats||0)) * division, [0x80 | channel, pitch, 0], 1);
    }
    if(Array.isArray(p.studioSectionMap))for(const section of p.studioSectionMap){
      const [n,d]=String(section.timeSignature).split('/').map(Number);
      if(Number.isFinite(section.beat)&&[2,3,4,6].includes(n)&&[4,8].includes(d))add(section.beat*division,[0xff,0x58,4,n,Math.log2(d),24,8],0);
    }
    if(arrangement){const current={};for(const event of [...arrangement].sort((a,b)=>a.beat-b.beat))if(['chords','melody'].includes(event.track)&&event.instrument){const channel=event.channel??(event.track==='chords'?0:2);if(current[channel]!==event.instrument){add((event.beat+(p.upbeatBeats||0))*division,[0xc0|channel,programs[event.instrument]||0],0);current[channel]=event.instrument;}}}
    if (arrangement) {
      if (!Array.isArray(arrangement) || arrangement.length > 200000) throw new Error('Invalid MIDI arrangement.');
      const channels = {
        chords: 0,
        bass: 1,
        melody: 2,
        drums: 9
      };
      arrangement.forEach(event => {
        if (event.track === 'click') return;
        if (!Object.prototype.hasOwnProperty.call(channels, event.track) || !Number.isInteger(event.midi) || event.midi < 0 || event.midi > 127 || !Number.isFinite(event.beat) || event.beat < -(p.upbeatBeats||0) || !Number.isFinite(event.duration) || event.duration <= 0 || !Number.isFinite(event.velocity) || event.velocity < 0 || event.velocity > 1) throw new Error('Invalid MIDI arrangement note.');
        if (event.velocity > 0) note(event.channel??channels[event.track], event.midi, event.beat, event.duration, Math.max(1, Math.round(event.velocity * 127)));
      });
    } else {
      timeline(p).forEach(event => {
        event.notes.forEach(pitch => note(0, pitch, event.beat, event.duration, 82));
        if (!Array.isArray(p.bass) && event.bass !== null) note(1, event.bass, event.beat, event.duration, 90);
      });
      (p.bass||[]).forEach(item=>note(1,item.midi,item.beat,item.duration,item.velocity));
      p.melody.forEach(item => note(melodyLanes(p).find(l=>l.id===(item.layerId||'main'))?.channel||2, item.midi, item.beat, item.duration, item.velocity));
    }
    if(includeProject){
      const payload=new TextEncoder().encode('MLH-CS1\n'+JSON.stringify(p));
      add(0,[0xff,0x7f,...variable(payload.length),...payload],0);
    }
    events.sort((a, b) => a.tick - b.tick || a.order - b.order);
    function variable(n) {
      const bytes = [n & 127];
      while ((n >>>= 7) > 0) bytes.unshift(n & 127 | 128);
      return bytes;
    }
    const track = [];
    let tick = 0;
    events.forEach(event => {
      track.push(...variable(event.tick - tick));
      for(const byte of event.data)track.push(byte);
      tick = event.tick;
    });
    track.push(...variable(Math.max(0, Math.round(totalBeats(p) * division) - tick)), 0xff, 0x2f, 0);
    const length = track.length;
    return new Uint8Array([77, 84, 104, 100, 0, 0, 0, 6, 0, 0, 0, 1, division >> 8, division & 255, 77, 84, 114, 107, length >>> 24 & 255, length >>> 16 & 255, length >>> 8 & 255, length & 255, ...track]);
  }
  function midiEvents(project, events) {
    return midi(project, events);
  }
  const gmNames=["acoustic_grand_piano", "bright_acoustic_piano", "electric_grand_piano", "honkytonk_piano", "electric_piano_1", "electric_piano_2", "harpsichord", "clavinet", "celesta", "glockenspiel", "music_box", "vibraphone", "marimba", "xylophone", "tubular_bells", "dulcimer", "drawbar_organ", "percussive_organ", "rock_organ", "church_organ", "reed_organ", "accordion", "harmonica", "tango_accordion", "acoustic_guitar_nylon", "acoustic_guitar_steel", "electric_guitar_jazz", "electric_guitar_clean", "electric_guitar_muted", "overdriven_guitar", "distortion_guitar", "guitar_harmonics", "acoustic_bass", "electric_bass_finger", "electric_bass_pick", "fretless_bass", "slap_bass_1", "slap_bass_2", "synth_bass_1", "synth_bass_2", "violin", "viola", "cello", "contrabass", "tremolo_strings", "pizzicato_strings", "orchestral_harp", "timpani", "string_ensemble_1", "string_ensemble_2", "synth_strings_1", "synth_strings_2", "choir_aahs", "voice_oohs", "synth_choir", "orchestra_hit", "trumpet", "trombone", "tuba", "muted_trumpet", "french_horn", "brass_section", "synth_brass_1", "synth_brass_2", "soprano_sax", "alto_sax", "tenor_sax", "baritone_sax", "oboe", "english_horn", "bassoon", "clarinet", "piccolo", "flute", "recorder", "pan_flute", "blown_bottle", "shakuhachi", "whistle", "ocarina", "lead_1_square", "lead_2_sawtooth", "lead_3_calliope", "lead_4_chiff", "lead_5_charang", "lead_6_voice", "lead_7_fifths", "lead_8_bass__lead", "pad_1_new_age", "pad_2_warm", "pad_3_polysynth", "pad_4_choir", "pad_5_bowed", "pad_6_metallic", "pad_7_halo", "pad_8_sweep", "fx_1_rain", "fx_2_soundtrack", "fx_3_crystal", "fx_4_atmosphere", "fx_5_brightness", "fx_6_goblins", "fx_7_echoes", "fx_8_scifi", "sitar", "banjo", "shamisen", "koto", "kalimba", "bagpipe", "fiddle", "shanai", "tinkle_bell", "agogo", "steel_drums", "woodblock", "taiko_drum", "melodic_tom", "synth_drum", "reverse_cymbal", "guitar_fret_noise", "breath_noise", "seashore", "bird_tweet", "telephone_ring", "helicopter", "applause", "gunshot"];
  const gmName=program=>(gmNames[program]||'Unknown Instrument').split('_').map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(' ');
  function importMidi(input, detailed = false) {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    if (bytes.length > 8 * 1024 * 1024) throw new Error('MIDI files must be smaller than 8 MB.');
    let pos = 0;
    function need(n, end = bytes.length) {
      if (pos + n > end) throw new Error('The MIDI file is incomplete.');
    }
    function read(n) {
      need(n);
      let value = 0;
      for (let i = 0; i < n; i++) value = value * 256 + bytes[pos++];
      return value;
    }
    function name() {
      need(4);
      return String.fromCharCode(...bytes.subarray(pos, pos += 4));
    }
    function variable(end) {
      let value = 0;
      for (let i = 0; i < 4; i++) {
        need(1, end);
        const b = bytes[pos++];
        value = value * 128 + (b & 127);
        if (!(b & 128)) return value;
      }
      throw new Error('Invalid MIDI variable-length value.');
    }
    if (name() !== 'MThd') throw new Error('Choose a standard MIDI file.');
    const header = read(4);
    if (header < 6) throw new Error('Invalid MIDI header.');
    need(header);
    const format = read(2),
      tracks = read(2),
      division = read(2);
    pos += header - 6;
    if (format > 1 || !tracks || format === 0 && tracks !== 1) throw new Error('Only MIDI format 0 and 1 files are supported.');
    if (!division || division & 0x8000) throw new Error('SMPTE MIDI timing is not supported.');
    const result = [], drumNotes=[],trackNames={},instrumentNames={},programChanges=[];
    let savedProject=null, tempo=100, timeSignature='4/4', key=0, mode='major', tempoFound=false;
    function finish(note, tick) {
      if (tick > note.tick) {
        (note.channel===9?drumNotes:result).push({
          beat: note.tick / division,
          duration: (tick - note.tick) / division,
          midi: note.midi,
          velocity: note.velocity,
          ...(detailed?{track:note.track,channel:note.channel,program:note.program,sourceNoteId:note.track+':'+note.channel+':'+note.tick+':'+note.midi+':'+(result.length+drumNotes.length)}:{})
        });
        if (result.length + drumNotes.length > 16384) throw new Error('This MIDI file contains too many notes (maximum 16384).');
      }
    }
    for (let track = 0; track < tracks; track++) {
      if (name() !== 'MTrk') throw new Error('Invalid MIDI track.');
      const length = read(4),
        end = pos + length;
      need(length);
      let tick = 0,
        running = 0;
      const active = new Map(),programs=new Map();
      while (pos < end) {
        tick += variable(end);
        need(1, end);
        let status = bytes[pos];
        if (status & 128) {
          pos++;
          if (status < 0xf0) running = status;else running = 0;
        } else {
          status = running;
          if (!running) throw new Error('Invalid MIDI running status.');
        }
        if (status === 0xff) {
          need(1, end);
          const type = bytes[pos++],
            n = variable(end);
          need(n, end);
          if(detailed){
            if(type===3)trackNames[track]=new TextDecoder().decode(bytes.subarray(pos,pos+n)).replace(/\0/g,'').trim();
            if(type===4)instrumentNames[track]=new TextDecoder().decode(bytes.subarray(pos,pos+n)).replace(/\0/g,'').trim();
            if(type===0x7f && n>=8){
              const text=new TextDecoder().decode(bytes.subarray(pos,pos+n));
              if(text.startsWith('MLH-CS1\n'))savedProject=validate(JSON.parse(text.slice(8)));
            }
            if(type===0x51 && n===3 && !tempoFound){const micros=bytes[pos]*65536+bytes[pos+1]*256+bytes[pos+2];if(micros>0){tempo=Math.max(30,Math.min(300,Math.round(60000000/micros)));tempoFound=true;}}
            if(type===0x58 && n>=2)timeSignature=bytes[pos]+'/'+(2**bytes[pos+1]);
            if(type===0x59 && n===2){const fifths=bytes[pos]>127?bytes[pos]-256:bytes[pos];mode=bytes[pos+1]===1?'minor':'major';key=mod(fifths*7+(mode==='minor'?9:0));}
          }
          pos += n;
          if (type === 0x2f) {
            if (n !== 0) throw new Error('Invalid MIDI track ending.');
            pos = end;
            break;
          }
          continue;
        }
        if (status === 0xf0 || status === 0xf7) {
          const n = variable(end);
          need(n, end);
          pos += n;
          continue;
        }
        if (status >= 0xf0) throw new Error('Unsupported MIDI system event.');
        const kind = status & 0xf0,
          channel = status & 15,
          length = kind === 0xc0 || kind === 0xd0 ? 1 : 2;
        need(length, end);
        const a = bytes[pos++],
          b = length === 2 ? bytes[pos++] : 0;
        if (a > 127 || b > 127) throw new Error('Invalid MIDI data byte.');
        if(kind===0xc0){programs.set(channel,a);programChanges.push({channel,program:a,tick,track});continue;}
        if ((!detailed && channel === 9) || ![0x80, 0x90].includes(kind)) continue;
        const noteKey = channel + ':' + a;
        if (kind === 0x90 && b > 0) {
          const queue = active.get(noteKey) || [];
          queue.push({
            tick,
            channel,track,program:programs.get(channel)||0,
            midi: a,
            velocity: b
          });
          active.set(noteKey, queue);
        } else {
          const queue = active.get(noteKey);
          if (queue?.length) {
            finish(queue.shift(), tick);
            if (!queue.length) active.delete(noteKey);
          }
        }
      }
      active.forEach(queue => queue.forEach(note => finish(note, tick)));
    }
    if(detailed){programChanges.sort((a,b)=>a.tick-b.tick||a.track-b.track);for(const note of [...result,...drumNotes]){const program=programChanges.findLast(e=>e.channel===note.channel&&e.tick<=Math.round(note.beat*division));if(program)note.program=program.program;}}
    if(detailed)return {project:savedProject,notes:result.sort((a,b)=>a.beat-b.beat||a.midi-b.midi),drumNotes,tempo,timeSignature,key,mode,trackNames,instrumentNames,division};
    if (!result.length) throw new Error('No pitched notes were found in this MIDI file.');
    return result.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
  }
  function musicXML(project) {
    const p = validate(project),
      list = timeline(p),
      [top, bottom] = p.timeSignature.split('/').map(Number),
      barBeats = top * 4 / bottom;
    const end = Math.max(totalBeats(p), ...p.melody.map(n => n.beat + n.duration));
    const count = Math.ceil(end / barBeats),
      xml = s => String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;'
      })[c]);
    function pitch(midi) {
      const name = noteName(midi),
        alter = name.includes('#') ? '<alter>1</alter>' : '';
      return '<pitch><step>' + name[0] + '</step>' + alter + '<octave>' + (Math.floor(midi / 12) - 1) + '</octave></pitch>';
    }
    const chords = list.map((e, i) => ({
      beat: e.beat,
      duration: e.duration,
      pitches: e.notes,
      label: e.label || e.symbol,
      tempo: i === 0 || e.tempo !== list[i - 1].tempo ? e.tempo : null
    }));
    const bass = list.map(e => ({
      beat: e.beat,
      duration: e.duration,
      pitches: e.bass === null ? [] : [e.bass]
    }));
    // A separate voice per melody event preserves overlapping recorded notes.
    const melody = p.melody.map(n => ({
      beat: n.beat,
      duration: n.duration,
      pitches: [n.midi]
    }));
    const parts = [{
      id: 'P1',
      name: 'Chords',
      events: chords,
      clef: 'G',
      line: 2
    }, {
      id: 'P2',
      name: 'Bass',
      events: bass,
      clef: 'F',
      line: 4
    }];
    if (melody.length) parts.push({
      id: 'P3',
      name: 'Melody',
      events: melody,
      clef: 'G',
      line: 2,
      overlap: true
    });
    function noteXML(event, start, stop, voice) {
      const duration = Math.round((stop - start) * 480),
        tieStart = stop < event.beat + event.duration - 1e-8,
        tieStop = start > event.beat + 1e-8;
      const ties = (tieStop ? '<tie type="stop"/>' : '') + (tieStart ? '<tie type="start"/>' : '');
      const notation = tieStop || tieStart ? '<notations>' + (tieStop ? '<tied type="stop"/>' : '') + (tieStart ? '<tied type="start"/>' : '') + '</notations>' : '';
      if (!event.pitches.length) return '<note><rest/><duration>' + duration + '</duration><voice>' + voice + '</voice></note>';
      return event.pitches.map((midi, i) => '<note>' + (i ? '<chord/>' : '') + pitch(midi) + '<duration>' + duration + '</duration>' + ties + '<voice>' + voice + '</voice>' + notation + '</note>').join('');
    }
    const body = parts.map(part => '<part id="' + part.id + '">' + Array.from({
      length: count
    }, (_, index) => {
      const start = index * barBeats,
        stop = start + barBeats,
        events = part.events.filter(e => e.beat < stop && e.beat + e.duration > start);
      let content = index === 0 ? '<attributes><divisions>480</divisions><time><beats>' + top + '</beats><beat-type>' + bottom + '</beat-type></time><clef><sign>' + part.clef + '</sign><line>' + part.line + '</line></clef></attributes>' : '';
      if (part.overlap) {
        if (!events.length) content += '<note><rest measure="yes"/><duration>' + Math.round(barBeats * 480) + '</duration></note>';
        events.forEach((event, voice) => {
          if (voice) content += '<backup><duration>' + Math.round(barBeats * 480) + '</duration></backup>';
          const a = Math.max(start, event.beat),
            b = Math.min(stop, event.beat + event.duration);
          if (a > start) content += '<forward><duration>' + Math.round((a - start) * 480) + '</duration></forward>';
          content += noteXML(event, a, b, voice + 1);
          if (b < stop) content += '<forward><duration>' + Math.round((stop - b) * 480) + '</duration></forward>';
        });
      } else {
        let cursor = start;
        events.forEach(event => {
          const a = Math.max(start, event.beat),
            b = Math.min(stop, event.beat + event.duration);
          if (a > cursor) content += '<note><rest/><duration>' + Math.round((a - cursor) * 480) + '</duration></note>';
          if (event.label && a === event.beat) content += '<direction placement="above"><direction-type><words>' + xml(event.label) + '</words></direction-type></direction>';
          if (event.tempo && a === event.beat) content += '<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>' + event.tempo + '</per-minute></metronome></direction-type><sound tempo="' + event.tempo + '"/></direction>';
          content += noteXML(event, a, b, 1);
          cursor = b;
        });
        if (cursor < stop) content += '<note><rest/><duration>' + Math.round((stop - cursor) * 480) + '</duration></note>';
      }
      if (index === count - 1) content += '<barline location="right"><bar-style>light-heavy</bar-style></barline>';
      return '<measure number="' + (index + 1) + '">' + content + '</measure>';
    }).join('') + '</part>').join('');
    return '<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><work><work-title>' + xml(p.title) + '</work-title></work><part-list>' + parts.map(part => '<score-part id="' + part.id + '"><part-name>' + part.name + '</part-name></score-part>').join('') + '</part-list>' + body + '</score-partwise>';
  }
  function importSongMidi(input) {
    const data=importMidi(input,true);
    if(data.project){if(data.project.studioArrangement)return data.project;return asProgression(data.project);}
    if(!data.notes.length&&!data.drumNotes.length)throw new Error('No notes were found in this MIDI file.');
    const [top,bottom]=data.timeSignature.split('/').map(Number),barBeats=top*4/bottom;
    const end=Math.max(...[...data.notes,...data.drumNotes].map(n=>n.beat+n.duration)),barCount=Math.ceil((end-.001)/barBeats);
    if(barCount>256)throw new Error('Choose a MIDI file of 256 bars or fewer (up to 32 sections).');
    const D=typeof window!=='undefined'?window.MLH?.DrumMachine:require('./drum-machine-core.js');
    // Keep instrumental parts separate when the file supplies tracks/channels.
    const groups=new Map();for(const note of data.notes){const id=note.track+':'+note.channel;if(!groups.has(id))groups.set(id,[]);groups.get(id).push(note);}
    const parts=[...groups.values()].map(notes=>{const starts=new Map();for(const n of notes){const at=Math.round(n.beat*8)/8;starts.set(at,(starts.get(at)||0)+1);}return {notes,program:notes[0].program,average:notes.reduce((sum,n)=>sum+n.midi,0)/notes.length,polyphonic:[...starts.values()].some(n=>n>=3)};});
    const melodyPart=parts.filter(p=>!p.polyphonic&&!(p.program>=32&&p.program<=39)).sort((a,b)=>b.average-a.average)[0]||parts.sort((a,b)=>b.average-a.average)[0];
    const accompanimentParts=parts.filter(p=>p!==melodyPart),accompanimentPart=accompanimentParts.filter(p=>p.polyphonic).sort((a,b)=>b.notes.length-a.notes.length)[0]||accompanimentParts[0];
    const instrument=program=>program<8?'piano':program<16?'marimba':program<24?'organ':program<32?'guitar':program<48?'strings':program<56?'strings':program<64?'brass':program>=72&&program<80?'flute':program>=88&&program<96?'pad':'synth';
    const melody=melodyPart?.notes||[],accompaniment=accompanimentParts.flatMap(p=>p.notes);
    const items=[];
    for(let startBar=0;startBar<barCount;startBar+=8){
      const remaining=barCount-startBar,bars=remaining>4?8:4,start=startBar*barBeats,span=bars*barBeats;
      const slice=notes=>notes.filter(n=>n.beat<start+span&&n.beat+n.duration>start).map(n=>({midi:n.midi,velocity:n.velocity,program:n.program,sourceNoteId:n.sourceNoteId,tieFrom:n.beat<start,tieTo:n.beat+n.duration>start+span,beat:Math.max(0,n.beat-start),duration:Math.min(n.beat+n.duration,start+span)-Math.max(n.beat,start),gate:1}));
      const p=asProgression({version:1,title:'',tempo:data.tempo,key:data.key,mode:data.mode,timeSignature:data.timeSignature,instrument:'piano',accompanimentInstrument:instrument(accompanimentPart?.program||0),melodyInstrument:instrument(melodyPart?.program||0),style:'block',importedMidiDivision:data.division,melody:slice(melody).filter(n=>n.midi>=21&&n.midi<=108),...(accompaniment.length?{accompaniment:slice(accompaniment).filter(n=>n.midi>=21&&n.midi<=108)}:{}),sections:[{chords:[{symbol:'-',beats:barBeats}]}]},bars);
      if(D){
        let drums=D.resizePattern(D.create(barBeats),0,bars,4,barBeats);drums.patterns[0].tracks.forEach(t=>t.steps.fill(0));
        data.drumNotes.forEach(note=>{const local=note.beat-start,midi=({35:36,37:38,39:38,40:38,41:45,43:45,48:47,53:51,57:49,59:51})[note.midi]??note.midi,track=drums.patterns[0].tracks.find(track=>D.tracks.find(t=>t.id===track.id).midi===midi),step=Math.round(local*4);if(track&&local>=0&&step<track.steps.length)track.steps[step]=Math.max(track.steps[step],note.velocity);});
        p.drums=drums;
      }
      let number=items.length,name='';do{name=String.fromCharCode(65+number%26)+name;number=Math.floor(number/26)-1;}while(number>=0);
      items.push({id:'section-'+(items.length+1),name,project:validate(p)});
    }
    if(items.length===1)return items[0].project;
    return {...items[0].project,studioArrangement:{version:1,items,active:'all'}};
  }
  function songMidi(project,arrangement){return midi(project,arrangement,true);}
  function generateMelody(project, octave = 4, random = Math.random) {
    const p = validate(project), base = (octave + 1) * 12;
    if (!Number.isInteger(octave) || octave < 2 || octave > 6) throw new Error('Invalid melody octave.');
    const step = 4 / p.quantise;
    return timeline(p).flatMap(chord => {
      const tones = chord.notes.length ? chord.notes.map(note=>note%12) : modes[p.mode].map(interval=>(p.key+interval)%12);
      return Array.from({length:Math.ceil(chord.duration)},(_,index)=>({
        beat:chord.beat+index,
        duration:Math.min(chord.duration-index,Math.max(step,quantiseBeat(.8,p.quantise))),
        midi:base+tones[Math.min(tones.length-1,Math.floor(random()*tones.length))],
        velocity:90
      }));
    });
  }
  function writingPitchClasses(project, filter = 'scale') {
    if (filter === 'chromatic') return Array.from({length:12},(_,i)=>i);
    const key=pitchClass(project.key),scale=modes[project.mode];
    if (!scale) throw new Error('Choose a valid scale.');
    const keyNotes=new Set(scale.map(interval=>mod(key+interval)));
    const selected=filter==='pentatonic'?[0,2,4,7,9]:filter==='blues'?[0,3,5,6,7,10]:scale;
    const available=new Set(selected.map(interval=>mod(key+interval)));
    for(const section of project.sections)for(const bar of section.chords)for(const item of [bar,...(bar.secondChord?[bar.secondChord]:[])]){
      const chord=parse(item.symbol);if(chord.rest)continue;
      const transpose=item.transpose||0;
      const tones=[...chord.intervals.map(interval=>mod(chord.root+interval+transpose)),mod(chord.bass+transpose)];
      if(tones.some(pc=>!keyNotes.has(pc)))tones.forEach(pc=>available.add(pc));
    }
    if(filter==='scale'&&project.mode==='minor'){
      available.delete(mod(key+10));
      available.add(mod(key+11));
    }
    return [...available].sort((a,b)=>a-b);
  }
  function pianoRollPitches(notes,octave,allowed=()=>true,octaves=1){
    const played=new Set(notes.map(note=>note.midi)),base=12*(octave+1);
    const low=Math.min(base,...played),high=Math.max(base+12*octaves,...played);
    return Array.from({length:high-low+1},(_,i)=>high-i).filter(midi=>allowed(midi)||played.has(midi));
  }
  function generateBass(project, octave = 2, random = Math.random) {
    const p = validate(project);
    if (!Number.isInteger(octave) || octave < 1 || octave > 4) throw Error('Choose bass octave 1 to 4.');
    const bar = Number(p.timeSignature.split('/')[0])*4/Number(p.timeSignature.split('/')[1]);
    const rhythms = p.timeSignature === '6/8' ? [
      [0,1.5],[0,.5,1.5,2.5],[0,1,1.5,2.5],[0,.5,1,1.5,2,2.5],
      [0,1,1.5,2],[0,.5,1.5,2,2.5],[0,1.5,2,2.5],[0,1,2,2.5]
    ] : p.timeSignature === '3/4' ? [
      [0,1,2],[0,1.5,2],[0,.5,1,2],[0,1,2,2.5],
      [0,.5,1,1.5,2,2.5],[0,1.5],[0,.75,1.5,2.5],[0,1,1.5,2.5]
    ] : [
      [0,1,2,3],[0,.5,1,1.5,2,2.5,3,3.5],[0,1.5,2,3.5],[0,.75,1.5,2.5,3.5],
      [0,.5,2,2.5,3.5],[0,1,2.5,3],[0,1.5,2.5],[0,.5,1.5,2,3,3.5],
      [0,2],[0,1,1.5,2.5,3.5],[0,.75,2,2.75],[0,.5,1,2,2.5,3],
      [0,1.75,2,3.75],[0,.5,1.5,2.5,3],[0,1,2,2.75,3.5],[0,.25,1.5,2,3.5]
    ];
    const motifs = [[0,0,2,3],[0,2,0,3],[0,1,2,1],[0,2,3,2],[0,0,1,2],[0,1,2,4],[0,3,2,1],[0,2,1,0]];
    const pick = list => list[Math.min(list.length-1,Math.floor(random()*list.length))];
    const rhythm=pick(rhythms),motif=pick(motifs),step=4/p.quantise,result=[];
    for (const event of timeline(p)) {
      const item=p.sections[event.sectionIndex].chords[event.chordIndex],chord=parse(item.symbol);
      if (chord.rest || ['silence','break','chords'].includes(item.type)) continue;
      const pc = n => ((n+(item.transpose||0))%12+12)%12;
      const root=(octave+1)*12+pc(chord.root),bass=(octave+1)*12+pc(chord.bass);
      const tones=[bass,root+(chord.intervals.find(n=>n===3||n===4)||0),root+(chord.intervals.find(n=>[6,7,8].includes(n))||0),bass+12,root+(chord.intervals.find(n=>n===10||n===11)||0)];
      const starts=new Set();
      for(let b=0;b<event.duration;b+=bar)for(const offset of rhythm){
        const at=Math.round((event.beat+b+offset)/step)*step;
        if(at>=event.beat && at<event.beat+event.duration-1e-8)starts.add(at);
      }
      const positions=[...starts].sort((a,b)=>a-b);
      positions.forEach((beat,index)=>{
        const end=positions[index+1]??event.beat+event.duration;
        result.push({beat,duration:Math.max(.025,(end-beat)*.85),midi:tones[index===0?0:motif[index%motif.length]],velocity:index===0?90:82});
      });
    }
    return result;
  }
  function quantiseBeat(beat, division = 8,minimum=0) {
    if (![2, 4, 8, 16].includes(division) || !Number.isFinite(beat)) throw new Error('Invalid quantise grid.');
    const steps = division / 4;
    return Math.max(minimum, Math.round(beat * steps) / steps);
  }
  function heldNoteSpan(start,end,total,division=8,minimum=0){
    const step=4/division;
    const beat=Math.min(Math.floor((total-step)/step)*step,quantiseBeat(minimum+((start-minimum)%(total-minimum)+(total-minimum))%(total-minimum),division,minimum));
    const duration=Math.min(total-beat,Math.max(step,quantiseBeat(Math.max(0,end-start),division)));
    return {beat,duration};
  }
  function resizeNote(notes,index,duration,total,division=8){
    const note=notes[index];if(!note)return notes;
    const next=notes.filter((n,i)=>i!==index&&n.midi===note.midi&&n.beat>note.beat).reduce((end,n)=>Math.min(end,n.beat),total);
    const step=4/division,limit=Math.min(next-note.beat,total-note.beat);
    if(limit<step)return notes;
    const length=Math.max(step,Math.min(quantiseBeat(duration,division),Math.floor(limit/step)*step));
    return notes.map((n,i)=>i===index?{...n,duration:length}:n);
  }
  function shiftMelodyOctave(project,delta){
    const octave=(project.melodyOctave??4)+delta;
    if(![-1,1].includes(delta)||octave<2||octave>6||project.melody.some(n=>n.midi+delta*12<21||n.midi+delta*12>108))return project;
    return {...project,melodyOctave:octave,melody:project.melody.map(note=>({...note,midi:note.midi+delta*12}))};
  }
  function moveNote(notes,index,beat,midi,total,division=8,minimum=0){
    const note=notes[index];
    if(!note||!Number.isFinite(beat)||!Number.isInteger(midi)||midi<21||midi>108)return notes;
    const step=4/division;
    const start=Math.min(Math.max(minimum,Math.floor((total-note.duration)/step)*step),quantiseBeat(beat,division,minimum));
    if(notes.some((other,i)=>i!==index&&other.midi===midi&&start<other.beat+other.duration&&start+note.duration>other.beat))return notes;
    return notes.map((n,i)=>i===index?{...n,beat:start,midi}:n);
  }
  function placeNote(notes,beat,midi,total,division=8,velocity=120,minimum=0){
    const step=4/division,start=Math.min(Math.floor((total-step)/step)*step,quantiseBeat(beat,division,minimum));
    if(notes.some(note=>note.midi===midi&&start<note.beat+note.duration&&start+step>note.beat))return notes;
    return [...notes,{beat:start,duration:step,midi,velocity}];
  }
  function melodyLanes(project){const colors=['#2563eb','#d97706','#16a34a','#9333ea'];return [{id:'main',name:'Melody',instrument:project.melodyInstrument||'piano'},...(project.counterMelodies||[])].map((lane,i)=>({...lane,channel:[2,3,4,5][i],color:project.counterMelodies?.length?colors[i]:'#111'}));}
  function rollCellSegments(notes,midi,start,duration=.5){
    return notes.filter(note=>note.midi===midi&&note.beat<start+duration-.0001&&note.beat+note.duration>start+.0001).map(note=>({
      note,left:Math.max(0,(note.beat-start)*100/duration),width:(Math.min(start+duration,note.beat+note.duration)-Math.max(start,note.beat))*100/duration,
      continuation:note.beat<start-.0001,ends:note.beat+note.duration<=start+duration+.0001
    }));
  }
  function asProgression(value,bars){
    const p=validate(value),original=p.sections.flatMap(section=>Array.from({length:section.repeats},()=>section.chords).flat());
    const requested=bars??p.progressionBars??(original.length<=4?4:8);
    const length=bars===undefined&&requested===16?8:requested;
    if(![4,8].includes(length))throw new Error('Choose a 4 or 8 bar progression.');
    const beats=Number(p.timeSignature.split('/')[0])*4/Number(p.timeSignature.split('/')[1]);
    const chords=Array.from({length},(_,index)=>({...JSON.parse(JSON.stringify(original[index%original.length])),beats}));
    let drums=p.drums;
    const drumCore=typeof window!=='undefined'?window.MLH?.DrumMachine:typeof require==='function'?require('./drum-machine-core.js'):null;
    if(drums&&drumCore)drums.patterns.forEach((pattern,index)=>{if(pattern.bars>length)drums=drumCore.resizePattern(drums,index,length,drums.subdivision,beats);});
    return validate({...p,...(drums?{drums}:{}),progressionBars:length,sections:[{name:'Progression',repeats:1,variation:0,chords}]});
  }
  function asStudio(value){
    const bars=value.progressionBars===8?8:4;
    const p=asProgression(value,bars);
    const bar=Number(p.timeSignature.split('/')[0])*4/Number(p.timeSignature.split('/')[1]);
    p.sections[0].chords=p.sections[0].chords.map(chord=>({...chord,symbol:harmonicDominant(chord.symbol,p.key,p.mode),...(chord.secondChord?{secondChord:{...chord.secondChord,symbol:harmonicDominant(chord.secondChord.symbol,p.key,p.mode)}}:{})}));
    p.melodyOctave=Number.isInteger(p.melodyOctave)?Math.max(2,Math.min(6,p.melodyOctave)):4;
    p.bass=null;p.bassAsPiano=true;p.volumes.bass=58.5;p.volumes.melody=100;p.volumes.chords=72;p.volumes.drums=40.5;p.melodyBars=bars;
    if(p.style==='ballad')p.style='arpeggio';
    if(p.style==='swing')p.style='pop';
    delete p.bassBars;
    const sourceSpan=value.melodyBars===1?bar:bar*bars;
    const phrase=p.melody.filter(n=>n.beat<sourceSpan);
    p.melody=[];
    for(let start=0;start<bar*bars;start+=sourceSpan)for(const note of phrase)p.melody.push({...note,velocity:Math.max(120,note.velocity||120),beat:start+note.beat,duration:Math.min(note.duration,sourceSpan-note.beat,bar*bars-start-note.beat)});
    const D=typeof window!=='undefined'?window.MLH?.DrumMachine:typeof require==='function'?require('./drum-machine-core.js'):null;
    if(D){
      const initial=p.drums||(p.drumPattern?D.migrate(p.drumPattern,bar):D.preset(p.timeSignature==='3/4'?'waltz':p.timeSignature==='6/8'?'sixEight':'rock',bar));
      p.drums=D.studioDrums(initial,bar,bars);
      p.drumPattern=null;
    }
    return p;
  }
  function planHarmonyChange(current, candidate) {
    const next = validate(candidate);
    const signature = project => JSON.stringify([
      project.timeSignature, project.pedal ? project.key : null,
      project.sections.map(section => [section.repeats, section.variation,
        section.chords.map(chord => {
          const parsed = parse(chord.symbol);
          return [parsed.root, parsed.quality, parsed.bass, chord.beats, chord.transpose || 0, chord.type || 'play', chord.secondChord?.symbol || null];
        })])
    ]);
    const changed = signature(validate(current)) !== signature(next);
    if (changed) next.bass = null;
    return {project:next, changed, requiresBassConfirmation:changed && Array.isArray(current.bass)};
  }
  return {
    voiceLead,
    keyName,    pitchNames,
    spellChord,
    chordToneNames,
    notation,
    planHarmonyChange,
    progressionChoices,
    randomProgressionChoices,
    createProgressionShuffler,
    writingPitchClasses,
    pianoRollPitches,
    quantiseBeat,
    placeNote,
    rollCellSegments,
    melodyLanes,
    heldNoteSpan,
    resizeNote,
    moveNote,
    shiftMelodyOctave,
    generateMelody,
    generateBass,
    asProgression,
    asStudio,
    patternAllowed,
    qualities,
    modes,
    presets,
    noteName,
    pitchClass,
    parse,
    notes,
    transpose,
    diatonic,
    studioDiatonic,
    generate,
    validate,
    timeline,
    totalBeats,
    secondsAtBeat,
    beatAtSeconds,
    midi,
    midiEvents,
    songMidi,
    importSongMidi,
    gmNames,gmName,
    importMidi,
    musicXML
  };
});
