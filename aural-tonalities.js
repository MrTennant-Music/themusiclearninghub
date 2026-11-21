// Ear Training tonalities share native-metre eight-bar phrasing at every level.
(function attachAuralTonalities(MLH) {
  "use strict";
  const choose = items => items[Math.floor(Math.random() * items.length)];
  const pitchClass = midi => ((midi % 12) + 12) % 12;
  const signature = { id: "4/4", top: 4, bottom: 4, beats: 4, type: "simple" };
  const major = [0, 2, 4, 5, 7, 9, 11];
  const minor = [0, 2, 3, 5, 7, 8, 11];
  const dorian = [0, 2, 3, 5, 7, 9, 10];
  const dorianChordSteps = {
    i: [0, 2, 4],
    IV: [3, 5, 7],
    v: [4, 6, 8],
    VII: [6, 8, 10],
  };
  const fitMelodyMidi = midi => {
    let fitted=midi;
    while(fitted<57) fitted+=12;
    while(fitted>84) fitted-=12;
    return fitted;
  };

  function makePlan() {
    return window.PracticeMelodyGenerator.generateAdvancedHigherPlan({
      seed: `${Date.now()}-${Math.random()}`, cadenceId: "perfect",
      timeSignatureId: signature.id, allowRests: true,
    });
  }

  function scaleMidi(step, tonicMidi, scale) {
    return tonicMidi + Math.floor(step / 7) * 12 + scale[((step % 7) + 7) % 7];
  }

  function diatonicLayer({ key, tonicMidi, scale, style, id = "tonality", pan = 0, volume = 1 }) {
    const plan = makePlan();
    const bars = plan.bars.map(plannedBar => {
      const notes = plannedBar.notes.map((note, noteIndex) => {
        const midi = note.rest ? 0 : fitMelodyMidi(scaleMidi(note.relativeStep, tonicMidi, scale));
        return { ...note, id: `${id}-${plannedBar.barIndex}-${noteIndex}`, midi, soundingMidi: midi };
      });
      // Mapping the same chord degrees into Dorian gives minor i/v and major
      // IV with its natural sixth, without importing a raised leading note.
      const degrees = window.PracticeMelodyGenerator.CHORD_DEGREES[plannedBar.chordSymbol];
      const rootStep = degrees[0] - 1;
      const pitches = degrees.map(degree => {
        let step = degree - 1;
        while (step < rootStep) step += 7;
        return scaleMidi(step, tonicMidi - 12, scale);
      });
      const accompanimentHarmony = [{ beat: 0, pitches }];
      return {
        ...plannedBar, notes, totalBars: plan.bars.length, accompanimentHarmony, generatedAccompaniment:true,
        accompaniment: MLH.AuralAccompaniment.eventsForBar({
          signature, notes, segments: accompanimentHarmony, style,
          finalBar: plannedBar.barIndex === plan.bars.length - 1,
        }),
      };
    });
    return {
      id, type: "tonality", key, tonicMidi, timeSignature: signature, bars,
      barCount: bars.length, totalBeats: bars.length * signature.beats,
      generationLevel: "AH", melodyGenerationStyle: "advancedHigher", melodyPlan: plan,
      accompanimentPattern: style, pan, volume,
    };
  }

  const n4TonalitySerial = {};
  let n5AtonalSerial=0;
  function n4TonalityPassage(tonality,level="N4",options={}) {
    const serialKey=`${level}-${tonality}`;
    const core=MLH.EarTrainingExercises, serial=n4TonalitySerial[serialKey]||0;
    n4TonalitySerial[serialKey]=serial+1;
    const keys=core.keysForLevel(level).filter(id=>id.endsWith("m")===(tonality==="minor"));
    const keyId=options.keyId||keys[serial%keys.length],key=core.keys[keyId];
    let tonicMidi=key.tonic;
    while(tonicMidi<60) tonicMidi+=12;
    while(tonicMidi>71) tonicMidi-=12;
    if(options.tonicMidi!==undefined)tonicMidi=options.tonicMidi;
    const nativeSignature=options.signature||core.variedSignaturesForLevel(level)[serial%4];
    // Reuse the tested diatonic phrase writer: tonic/third opening, motif
    // recall, stepwise leading-note resolution and a sustained final tonic.
    const source=core.makeN4ScalePassage({answerId:tonality==="minor"?"scale-minor":"scale-major",keyId,tonicMidi,signature:nativeSignature});
    const style=Math.floor(serial/4)%2?"broken_chords":"block_chords";
    const bars=source.bars.map(bar=>({...bar,accompaniment:bar.accompaniment.map((event,index)=>{
      const pitches=style==="broken_chords"&&index>0&&bar.barIndex!==7?[event.pitches[index%event.pitches.length]]:[...event.pitches];
      return {...event,pitches,volume:(.078*.82*.55)/(.018*Math.sqrt(pitches.length)),role:"tonality-harmony"};
    })}));
    const {scaleId,scalePitchClasses,scaleMotifRecallBars,scalePhraseLength,scaleNativeMetre,...phrase}=source;
    return {...phrase,type:"tonality",bars,tonicMidi,
      notes:bars.flatMap(bar=>bar.notes.map(note=>({...note,beat:bar.barIndex*nativeSignature.beats+note.beat}))),
      melodyPlan:{...source.melodyPlan,bars:source.melodyPlan.bars.map((bar,index)=>({...bar,notes:bars[index].notes.map(note=>({...note}))}))},
      playbackTempo:{...core.variedTempos[Math.floor(serial/4)%3]},
      accompanimentPattern:style,tonalityNativeMetre:true,tonalityExcerptBars:8,tonalityMotifRecallBars:[4,5],tonalityCadence:"perfect",tonalityOpeningThird:true,
      generationVariation:{timeSignature:nativeSignature.id,accompaniment:style},
    };
  }

  const seniorTonalitySerial={};
  function seniorModalPassage(level) {
    const core=MLH.EarTrainingExercises,serial=seniorTonalitySerial[level+"-modal"]||0;seniorTonalitySerial[level+"-modal"]=serial+1;
    const keyId=core.keysForLevel(level)[serial%8],original=core.keys[keyId],signature=core.variedSignaturesForLevel(level)[serial%4];
    let tonic=original.tonic;while(tonic<60)tonic+=12;
    const source=core.makeN4ScalePassage({answerId:"scale-minor",keyId,tonicMidi:tonic,signature});
    const mixolydian=level==="AH"&&Math.floor(serial/8)%2===1;
    const mode=mixolydian?"mixolydian":"dorian",scale=mixolydian?[0,2,4,5,7,9,10]:dorian;
    const chordSteps=mixolydian?{I:[0,2,4],IV:[3,5,7],VII:[6,8,10]}:dorianChordSteps;
    const progression=mixolydian?["I","IV","I","VII","I","IV","VII","I"]:["i","IV","i","VII","i","IV","v","i"],bars=[];
    for(let index=0;index<8;index++) {
      const symbol=progression[index],steps=chordSteps[symbol],chord=steps.map(step=>scaleMidi(step,tonic-12,scale));
      let previous=bars.at(-1)?.notes.at(-1).midi??tonic;
      let notes=source.bars[index].notes.map((note,i)=>{
        const candidates=Array.from({length:28},(_,i)=>i+57).filter(midi=>chord.some(p=>pitchClass(p)===pitchClass(midi)));
        const desired=scaleMidi(note.scaleDegree,tonic,scale);
        let midi=candidates.sort((a,b)=>Math.abs(a-desired)+Math.abs(a-previous)*.3-Math.abs(b-desired)-Math.abs(b-previous)*.3)[0];
        if(index===0&&i===0)midi=tonic;
        if(level==="AH"&&index===0&&i===1)midi=tonic+scale[2];
        if(index===1&&i===0)midi=tonic+9;
        if(index===3&&i===0)midi=tonic+10;
        if(index===7)midi=tonic;
        previous=midi;return {...note,midi,soundingMidi:midi,volume:.82};
      });
      if(index===4||index===5)notes=bars[index-4].notes.map((note,i)=>({...note,id:`modal-recall-${index}-${i}`,barIndex:index}));
      const accompaniment=[];
      for(let at=0;at<signature.beats;at+=signature.pulseQuarterBeats) {
        if(index===7&&at>0)continue;
        const pitches=chord.map(p=>{while(p<45)p+=12;while(p>64)p-=12;return p;});
        accompaniment.push({beat:at,beats:(index===7?signature.beats:signature.pulseQuarterBeats)*.9,pitches,volume:(.078*.82*.55)/(.018*Math.sqrt(pitches.length)),gateRelease:true,role:"tonality-harmony"});
      }
      bars.push({...source.bars[index],barIndex:index,chordSymbol:symbol,notes,accompaniment,accompanimentHarmony:[{beat:0,beats:signature.beats,pitches:chord}],generatedAccompaniment:false});
    }
    return {...source,type:"tonality",level,key:{...original,id:keyId+"-"+mode,scale,mode,chords:Object.fromEntries(Object.entries(chordSteps).map(([symbol,steps])=>[symbol,steps.map(step=>scaleMidi(step,tonic-12,scale))]))},tonicMidi:tonic,bars,notes:bars.flatMap(bar=>bar.notes.map(note=>({...note,beat:bar.barIndex*signature.beats+note.beat}))),
      melodyPlan:{...source.melodyPlan,bars:bars.map(b=>({...b,notes:b.notes.map(n=>({...n}))}))},melodyGenerationStyle:mode,tonalityMode:mode,tonalityNativeMetre:true,tonalityExcerptBars:8,tonalityCadence:mixolydian?"modal-VII-I":"modal-v-i",tonalityMotifRecallBars:[4,5],
      playbackTempo:{...core.variedTempos[Math.floor(serial/4)%3]},generationVariation:{timeSignature:signature.id,accompaniment:"pulse-chords"}};
  }
  function seniorPolytonalPassage(level) {
    const core=MLH.EarTrainingExercises,serial=seniorTonalitySerial.polytonality||0;seniorTonalitySerial.polytonality=serial+1;
    const pairs=[["C","G"],["F","C"],["G","C"],["C","D"],["D","C"],["Bb","C"],["C","Bb"],["G","F"],["F","G"],["D","Bb"],["Bb","D"]];
    const pair=pairs[serial%pairs.length],signature=core.variedSignaturesForLevel(level)[serial%4];
    const layers=pair.map((keyId,index)=>{
      let tonic=core.keys[keyId].tonic;while(tonic<60)tonic+=12;
      if(index===0&&tonic+24<=84)tonic+=12;
      const layer=n4TonalityPassage("major",level,{keyId,tonicMidi:tonic,signature});
      return {...layer,id:`poly-${serial}-${index}`,pan:index===0?-.35:.35,volume:.7};
    });
    return {...layers[0],layers,polytonalKeys:pair,tonalityExcerptBars:8,playbackTempo:{...core.variedTempos[Math.floor(serial/4)%3]},generationVariation:{timeSignature:signature.id,accompaniment:"two-tonal-layers"}};
  }

  function isTriad(pitches) {
    return pitches.some(root => {
      const intervals = new Set(pitches.map(pitch => pitchClass(pitch - root)));
      return intervals.has(7) && (intervals.has(3) || intervals.has(4));
    });
  }

  function dorianPassage(style) {
    const dictation = MLH.MelodicDictation;
    const plan = makePlan();
    const tonicMidi = 62;
    const chordSymbols=["i","IV","i","VII","i","IV","v","i"];
    const bars = plan.bars.map((plannedBar,barIndex) => {
      const chordSymbol=chordSymbols[barIndex%chordSymbols.length];
      const firstSoundingIndex=plannedBar.notes.findIndex(note=>!note.rest);
      const notes = plannedBar.notes.map((note,noteIndex) => {
        if(note.rest) return {...note,id:`dorian-${barIndex}-${noteIndex}`,midi:0,soundingMidi:0};
        let midi=fitMelodyMidi(scaleMidi(note.relativeStep,tonicMidi,dorian));
        // Make the minor third and natural sixth unmistakable without
        // replacing the newly generated contour or rhythm.
        if(barIndex===0&&noteIndex===firstSoundingIndex) midi=65;
        if(barIndex===1&&noteIndex===firstSoundingIndex) midi=71;
        return {...note,id:`dorian-${barIndex}-${noteIndex}`,midi,soundingMidi:midi};
      });
      const pitches = (dorianChordSteps[chordSymbol] || dorianChordSteps.i)
        .map(step => scaleMidi(step, tonicMidi - 12, dorian));
      const accompanimentHarmony = [{ beat:0, beats:signature.beats, pitches }];
      return {
        ...plannedBar,barIndex,chordSymbol,notes,
        accompanimentHarmony,
        generatedAccompaniment:true,
        accompaniment:MLH.AuralAccompaniment.eventsForBar({
          signature, notes, segments:accompanimentHarmony, style,
          finalBar:barIndex===plan.bars.length-1,
        }),
      };
    });
    return {
      id:Math.random().toString(36).slice(2),level:"H",key:dictation.DORIAN_MODE,timeSignature:signature,questionType:"dorianTonality",
      type:"tonality",
      tonicMidi,
      bars,
      barCount:bars.length,
      totalBeats:bars.length*signature.beats,
      generationLevel:"H",
      melodyGenerationStyle:"dorian",
      melodyPlan:plan,
      accompanimentPattern:style,
    };
  }

  function atonalPassage(style,options={}) {
    const signature=options.signature || {id:"4/4",top:4,bottom:4,beats:4,type:"simple"};
    const source=options.plan || (options.barCount?window.PracticeMelodyGenerator.generateAdvancedHigherPlan({seed:`${Date.now()}-${Math.random()}`,cadenceId:"perfect",timeSignatureId:signature.id,allowRests:false}):makePlan());
    const plan={...source,bars:options.barCount?source.bars.slice(0,options.barCount):source.bars};
    const dictation = MLH.MelodicDictation;
    const count = plan.bars.reduce((total, bar) => total + bar.notes.filter(note => !note.rest).length, 0);
    const forms = Array.from({ length: 12 }, (_, transpose) => [1, -1].flatMap(direction => {
      const row = dictation.ATONAL_PITCH_ROW.map(pitch => pitchClass(transpose + direction * pitch));
      return [row, [...row].reverse()];
    })).flat();
    const pitches = [...choose(forms)];
    while (pitches.length < count) {
      const used = Math.min(12, count - pitches.length);
      const row = choose(forms.filter(candidate => candidate[0] !== pitches.at(-1)
        && !isTriad([pitches.at(-2), pitches.at(-1), candidate[0]])
        && !isTriad([pitches.at(-1), candidate[0], candidate[1]])
        && (pitches.length + used < count || candidate[used - 1] !== pitches[0])));
      pitches.push(...row);
    }
    let pitchIndex = 0;
    const bars = plan.bars.map(plannedBar => {
      const notes = plannedBar.notes.map((note, noteIndex) => {
        let midi = 0;
        if (!note.rest) {
          const pc = pitches[pitchIndex++];
          // Retain the AH contour/register while removing its diatonic pitch
          // hierarchy. Every twelve sounding notes exhaust the pitch classes.
          const target = scaleMidi(note.relativeStep, options.tonicMidi || 60, major);
          const candidates = [48 + pc, 60 + pc, 72 + pc].filter(pitch => pitch >= 57 && pitch <= 84);
          midi = candidates.reduce((best, pitch) => Math.abs(pitch - target) < Math.abs(best - target) ? pitch : best);
        }
        return { ...note, id: `atonal-${plannedBar.barIndex}-${noteIndex}`, midi, soundingMidi: midi };
      });
      const sounding = notes.filter(note => !note.rest);
      const accompanimentHarmony = (options.barCount?Array.from({length:signature.pulseCount},(_,index)=>index*signature.pulseQuarterBeats):[0,2]).map(beat => {
        const note = sounding.find(note => note.beat >= beat) || sounding.at(-1);
        const anchor = 48 + pitchClass(note?.midi ?? pitches[pitchIndex - 1]);
        return { beat, beats: options.barCount?signature.pulseQuarterBeats:2, pitches: choose(dictation.ATONAL_CHORD_CELLS).map(interval => anchor + interval) };
      });
      return {
        ...plannedBar, chordSymbol: null, notes, accompanimentHarmony, generatedAccompaniment:true,
        accompaniment: MLH.AuralAccompaniment.eventsForBar({
          signature, notes, segments: accompanimentHarmony, style,
          finalBar: plannedBar.barIndex === plan.bars.length - 1,
        }),
      };
    });
    return {
      id: Math.random().toString(36).slice(2), type: "tonality", key: dictation.ATONAL_KEY,
      timeSignature: signature, bars, barCount: bars.length, totalBeats: bars.length * signature.beats,
      generationLevel: "AH", melodyGenerationStyle: "advancedHigher", melodyPlan: plan, accompanimentPattern: style,
    };
  }

  function buildMelody(tonality, level = "AH") {
    if(["N4","N5","H","AH"].includes(level)&&["major","minor"].includes(tonality)) return n4TonalityPassage(tonality,level);
    if(["N5","H","AH"].includes(level)&&tonality==="atonal") {
      const core=MLH.EarTrainingExercises,serial=n5AtonalSerial++,nativeSignature=core.variedSignaturesForLevel(level)[serial%4];
      const style=Math.floor(serial/4)%2?"broken_chords":"block_chords";
      const scaffold=core.makeN4ScalePassage({answerId:"scale-major",keyId:"F",tonicMidi:65,signature:nativeSignature});
      const plan={...scaffold.melodyPlan,bars:scaffold.bars.map(bar=>({...bar,notes:bar.notes.map(note=>({...note,relativeStep:note.scaleDegree}))}))};
      const result=atonalPassage(style,{signature:nativeSignature,barCount:8,plan,tonicMidi:65});
      return {...result,tonalityNativeMetre:true,tonalityExcerptBars:8,tempoPulseBeats:nativeSignature.pulseQuarterBeats,playbackTempo:{...core.variedTempos[Math.floor(serial/4)%3]},generationVariation:{timeSignature:nativeSignature.id,accompaniment:style},melodyPlan:{...result.melodyPlan,timeSignatureId:nativeSignature.id,bars:result.bars.map(bar=>({barIndex:bar.barIndex,chordSymbol:null,beats:nativeSignature.beats,notes:bar.notes.map(note=>({...note}))}))}};
    }
    if(["H","AH"].includes(level)&&tonality==="modal")return seniorModalPassage(level);
    if(level==="AH"&&tonality==="polytonality")return seniorPolytonalPassage(level);
    const dictation = MLH.MelodicDictation;
    const style = MLH.AuralAccompaniment.chooseStyle(signature);
    if (tonality === "atonal") return atonalPassage(style);
    if (tonality === "polytonality") {
      const pair = choose(dictation.POLYTONAL_KEY_PAIRS);
      const layers = pair.map((keyId, index) => {
        const key = dictation.POLYTONAL_KEYS[keyId];
        const tonicMidi = (index === 0 ? 60 : key.tonicPitchClass >= 6 ? 36 : 48) + key.tonicPitchClass;
        return diatonicLayer({ key, tonicMidi, scale: major, style,
          id: `poly-${index}`, pan: index === 0 ? -0.28 : 0.28, volume: 0.7 });
      });
      return { ...layers[0], layers, accompanimentPattern: style };
    }
    if (tonality === "modal") return dorianPassage(style);
    const earTraining = MLH.EarTrainingExercises;
    const levelKeyIds = earTraining?.keysForLevel?.(level) || ["C","G","F","Am","D","Bb","Em","Dm"];
    const candidates = levelKeyIds.map(id=>earTraining?.keys?.[id]).filter(key=>key && key.id.endsWith("m") === (tonality === "minor"));
    const fallback = dictation.KEYS.filter(key => (key.id === "Am") === (tonality === "minor"));
    const key = choose(candidates.length ? candidates : fallback);
    const tonicMidi = key.tonic ?? { C:60,F:65,G:67,Am:57 }[key.id];
    return diatonicLayer({ key, tonicMidi, scale: tonality === "minor" ? minor : major, style });
  }

  MLH.AuralTonalities = { buildMelody };
})(window.MLH || (window.MLH = {}));
