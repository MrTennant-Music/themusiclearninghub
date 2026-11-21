// Structured listening exercises that extend Ear Training while sharing its
// generated melody, accompaniment, playback and scoring architecture.
(function attachEarTrainingExercises(root) {
  "use strict";

  const MLH = root.MLH || (root.MLH = {});
  const choose = items => items[Math.floor(Math.random() * items.length)];
  const shuffle = items => [...items].sort(() => Math.random() - 0.5);
  const LEVEL_RANK = { N3: 0, N4: 1, N5: 2, H: 3, AH: 4 };
  const SIGNATURES = {
    "2/4": { id: "2/4", top: 2, bottom: 4, beats: 2, type: "simple", pulseCount:2, pulseQuarterBeats:1 },
    "3/4": { id: "3/4", top: 3, bottom: 4, beats: 3, type: "simple", pulseCount:3, pulseQuarterBeats:1 },
    "4/4": { id: "4/4", top: 4, bottom: 4, beats: 4, type: "simple", pulseCount:4, pulseQuarterBeats:1 },
    "6/8": { id: "6/8", top: 6, bottom: 8, beats: 3, type: "compound", pulseCount:2, pulseQuarterBeats:1.5 },
    "9/8": { id:"9/8",top:9,bottom:8,beats:4.5,type:"compound",pulseCount:3,pulseQuarterBeats:1.5 },
    "12/8": { id:"12/8",top:12,bottom:8,beats:6,type:"compound",pulseCount:4,pulseQuarterBeats:1.5 },
    "5/4": { id: "5/4", top: 5, bottom: 4, beats: 5, type: "irregular", pulseCount:5, pulseQuarterBeats:1 },
    "7/4": { id:"7/4",top:7,bottom:4,beats:7,type:"irregular",pulseCount:7,pulseQuarterBeats:1 },
    "5/8": { id:"5/8",top:5,bottom:8,beats:2.5,type:"irregular",pulseCount:5,pulseQuarterBeats:.5 },
    "7/8": { id:"7/8",top:7,bottom:8,beats:3.5,type:"irregular",pulseCount:7,pulseQuarterBeats:.5 },
  };
  const KEYS = {
    C: { id: "C", name: "C major", tonic: 60, scale: [0, 2, 4, 5, 7, 9, 11], chords: { I:[48,52,55], IV:[53,57,60], V:[55,59,62], V7:[55,59,62,65], VI:[57,60,64] } },
    F: { id: "F", name: "F major", tonic: 65, scale: [0, 2, 4, 5, 7, 9, 11], chords: { I:[53,57,60], IV:[58,62,65], V:[60,64,67], V7:[60,64,67,70], VI:[62,65,69] } },
    G: { id: "G", name: "G major", tonic: 55, scale: [0, 2, 4, 5, 7, 9, 11], chords: { I:[43,47,50], IV:[48,52,55], V:[50,54,57], V7:[50,54,57,60], VI:[52,55,59] } },
    D: { id: "D", name: "D major", tonic: 62, scale: [0, 2, 4, 5, 7, 9, 11], chords: { I:[50,54,57], IV:[55,59,62], V:[57,61,64], V7:[57,61,64,67], VI:[59,62,66] } },
    Bb: { id: "Bb", name: "B flat major", tonic: 58, scale: [0, 2, 4, 5, 7, 9, 11], chords: { I:[46,50,53], IV:[51,55,58], V:[53,57,60], V7:[53,57,60,63], VI:[55,58,62] } },
    Am: { id: "Am", name: "A minor", tonic: 57, scale: [0, 2, 3, 5, 7, 8, 11], chords: { I:[45,48,52], IV:[50,53,57], V:[52,56,59], V7:[52,56,59,62], VI:[53,57,60] } },
    Dm: { id: "Dm", name: "D minor", tonic: 62, scale: [0, 2, 3, 5, 7, 8, 11], chords: { I:[50,53,57], IV:[55,58,62], V:[57,61,64], V7:[57,61,64,67], VI:[58,62,65] } },
    Em: { id: "Em", name: "E minor", tonic: 64, scale: [0, 2, 3, 5, 7, 8, 11], chords: { I:[52,55,59], IV:[57,60,64], V:[59,63,66], V7:[59,63,66,69], VI:[60,64,67] } },
    // Relative-minor destinations only; the opening-key pool remains unchanged.
    Bm: { id:"Bm",name:"B minor",tonic:59,scale:[0,2,3,5,7,8,11],chords:{I:[47,50,54],IV:[52,55,59],V:[54,58,61],V7:[54,58,61,64],VI:[55,59,62]} },
    Gm: { id:"Gm",name:"G minor",tonic:55,scale:[0,2,3,5,7,8,11],chords:{I:[43,46,50],IV:[48,51,55],V:[50,54,57],V7:[50,54,57,60],VI:[51,55,58]} },
  };
  const PROGRESSION = ["I", "IV", "V", "I", "VI", "IV", "V", "I"];
  const ALL_KEYS = ["C","G","D","Bb","Am","Em","Dm","F"];
  const LEVEL_KEYS = Object.fromEntries(Object.keys(LEVEL_RANK).map(level=>[level,[...ALL_KEYS]]));
  const VARIED_TEMPOS = [
    { id:"adagio", label:"Adagio", bpm:60 },
    { id:"andante", label:"Andante", bpm:80 },
    { id:"allegro", label:"Allegro", bpm:100 },
  ];
  const LEVEL_SIGNATURES = {
    N3:["2/4","3/4","4/4","6/8"],
    N4:["2/4","3/4","4/4","6/8"],
    N5:["2/4","3/4","4/4","6/8"],
    H:["2/4","3/4","4/4","6/8"],
    AH:["2/4","3/4","4/4","6/8"],
  };
  const FIXED_METRE_TOPICS = new Set(["irregularMetre"]);
  let generationContext = null, keySerial = Math.floor(Math.random()*ALL_KEYS.length), tempoSerial = 0, signatureSerial = 0, melodySerial = 0;

  function generateFreshPlan(signature = SIGNATURES["4/4"], purpose = "question") {
    return root.PracticeMelodyGenerator?.generateAdvancedHigherPlan?.({
      seed:`ear-training-${purpose}-${Date.now()}-${melodySerial++}-${Math.random()}`,
      cadenceId:"perfect",
      timeSignatureId:signature.id === "5/4" ? "4/4" : signature.id,
      allowRests:true,
    }) || null;
  }

  function nextVariation(level, topic) {
    const keys = LEVEL_KEYS[level] || LEVEL_KEYS.N3;
    const keyName = keys[keySerial++ % keys.length];
    const playbackTempo = VARIED_TEMPOS[tempoSerial++ % VARIED_TEMPOS.length];
    const signatureIds = LEVEL_SIGNATURES[level] || LEVEL_SIGNATURES.N3;
    const signature = SIGNATURES[signatureIds[signatureSerial++ % signatureIds.length]];
    return { level, topic, keyName, playbackTempo:{...playbackTempo}, signature:{...signature}, style:MLH.AuralAccompaniment.chooseStyle(signature) };
  }

  function retimePassage(passage, signature, preferredStyle = null) {
    if (!passage?.bars?.length || !passage.timeSignature?.beats || !signature?.beats) return passage;
    const requestedStyle = preferredStyle || passage.accompanimentPattern;
    const customPulseStyle = ["pulse-chords","alternating-bass-chords","cadence-chords"].includes(requestedStyle);
    const accompanimentPattern = customPulseStyle || MLH.AuralAccompaniment.isStyleCompatible(requestedStyle,signature)
      ? requestedStyle : MLH.AuralAccompaniment.chooseStyle(signature);
    const scale = signature.beats / passage.timeSignature.beats;
    if (passage.timeSignature.id === signature.id && accompanimentPattern === passage.accompanimentPattern) return passage;
    const scaleEvent = event => ({
      ...event,
      beat:Number.isFinite(event.beat) ? event.beat*scale : event.beat,
      beats:Number.isFinite(event.beats) ? event.beats*scale : event.beats,
      ...(event.pitches ? { pitches:[...event.pitches] } : {}),
    });
    const bars = passage.bars.map((bar,barIndex)=>{
      const sourceNotes=bar.notes || [];
      const sourceEnd=sourceNotes.reduce((end,note)=>Math.max(end,note.beat+note.beats),0);
      const notes = sourceNotes.map(scaleEvent);
      if (notes.length && Math.abs(sourceEnd-passage.timeSignature.beats)<1e-8) {
        const finalIndex=notes.reduce((latest,note,index)=>note.beat>=notes[latest].beat?index:latest,0);
        notes[finalIndex]={...notes[finalIndex],beats:signature.beats-notes[finalIndex].beat};
      }
      const accompanimentHarmony = (bar.accompanimentHarmony || []).map(scaleEvent);
      const accompaniment = bar.generatedAccompaniment === true
        ? MLH.AuralAccompaniment.eventsForBar({
            signature,
            notes,
            segments:accompanimentHarmony,
            style:accompanimentPattern,
            finalBar:barIndex===passage.bars.length-1,
          })
        : (bar.accompaniment || []).map(scaleEvent);
      return { ...bar, notes, accompanimentHarmony, accompaniment };
    });
    const retimed = {
      ...passage,
      timeSignature:{...signature},
      accompanimentPattern,
      bars,
      totalBeats:bars.length*signature.beats,
      notes:bars.flatMap(bar=>bar.notes.map(note=>({...note,beat:bar.barIndex*signature.beats+note.beat}))),
    };
    if (passage.layers) retimed.layers = passage.layers.map(layer=>retimePassage(layer,signature,accompanimentPattern));
    if (passage.passage) retimed.passage = retimePassage(passage.passage,signature,accompanimentPattern);
    return synchroniseMelodyPlan(retimed);
  }

  function synchroniseMelodyPlan(passage) {
    if(!passage?.bars) return passage;
    const source=passage.melodyPlan || {};
    const hardFailures=[];
    for(const bar of passage.bars) for(const note of bar.notes || []) {
      if(!Number.isFinite(note.beat)||!Number.isFinite(note.beats)||note.beat<0||note.beats<=0||note.beat+note.beats>(bar.beats||passage.timeSignature.beats)+1e-8) hardFailures.push(`bar-${bar.barIndex+1}-note-timing`);
      if(!note.rest&&!Number.isFinite(note.soundingMidi??note.midi)) hardFailures.push(`bar-${bar.barIndex+1}-pitch`);
    }
    return {...passage,melodyPlan:{...source,
      sourceValidation:source.sourceValidation || source.validation,
      validation:{accepted:hardFailures.length===0,scope:"playback-structure",hardFailures},
      timeSignatureId:passage.timeSignature.id,
      bars:passage.bars.map(bar=>({barIndex:bar.barIndex,chordSymbol:bar.chordSymbol,beats:bar.beats||passage.timeSignature.beats,notes:bar.notes.map(note=>({...note}))})),
    },...(passage.layers?{layers:passage.layers.map(synchroniseMelodyPlan)}:{})};
  }

  function enforceAccompanimentFloor(passage) {
    const minimumMidi=MLH.AuralAccompaniment.minimumMidi ?? 45;
    const raise=pitch=>{ while(pitch<minimumMidi)pitch+=12; return pitch; };
    const bars=(passage.bars || []).map(bar=>({
      ...bar,
      accompaniment:(bar.accompaniment || []).map(event=>({...event,pitches:event.pitches.map(raise)})),
    }));
    return {
      ...passage,bars,
      ...(passage.layers ? {layers:passage.layers.map(enforceAccompanimentFloor)} : {}),
      ...(passage.passage ? {passage:enforceAccompanimentFloor(passage.passage)} : {}),
    };
  }

  const MELODY_MIN_MIDI=57; // A3
  const MELODY_MAX_MIDI=84; // C6
  function melodyMidiInRange(pitch) {
    let adjusted=pitch;
    while(adjusted<MELODY_MIN_MIDI) adjusted+=12;
    while(adjusted>MELODY_MAX_MIDI) adjusted-=12;
    return adjusted;
  }

  function enforceMelodyRange(passage) {
    const fitNote=(note,octaveShift=0)=>{
      if(note.rest) return note;
      const fitted={...note};
      if(Number.isFinite(fitted.midi)) fitted.midi=melodyMidiInRange(fitted.midi+octaveShift);
      if(Number.isFinite(fitted.soundingMidi)) fitted.soundingMidi=melodyMidiInRange(fitted.soundingMidi+octaveShift);
      if(Array.isArray(fitted.stack)) fitted.stack=fitted.stack.map(note=>fitNote(note,octaveShift));
      return fitted;
    };
    const fitPhrase=(notes,preferC5Start=false)=>{
      const pitches=notes.filter(note=>!note.rest).map(note=>note.soundingMidi ?? note.midi).filter(Number.isFinite);
      const candidates=Array.from({length:15},(_,index)=>(index-7)*12).filter(shift=>preferC5Start
        ? !pitches.length||(pitches[0]+shift>=72&&pitches[0]+shift<=MELODY_MAX_MIDI)
        : pitches.every(pitch=>pitch+shift>=MELODY_MIN_MIDI&&pitch+shift<=MELODY_MAX_MIDI));
      const octaveShift=candidates.sort((first,second)=>Math.abs(first)-Math.abs(second))[0] ?? 0;
      return notes.map(note=>fitNote(note,octaveShift));
    };
    const bars=(passage.bars || []).map((bar,barIndex)=>({...bar,notes:fitPhrase(bar.notes || [],passage.patternDirection==="descending"&&barIndex===0)}));
    return {
      ...passage,bars,
      ...(passage.notes ? {notes:fitPhrase(passage.notes)} : {}),
      ...(passage.layers ? {layers:passage.layers.map(enforceMelodyRange)} : {}),
      ...(passage.passage ? {passage:enforceMelodyRange(passage.passage)} : {}),
    };
  }

  function smoothMelodicRegister(passage) {
    // Choose octaves for the complete phrase, preserving every pitch class and
    // locking interval targets so their direction and distance cannot change.
    const sounding=passage.bars.flatMap(bar=>bar.notes.filter(note=>!note.rest));
    let paths=[{cost:0,pitches:[]}];
    for(const note of sounding) {
      const original=note.soundingMidi??note.midi;
      const candidates=(note.intervalTarget||note.intervalResolution)?[original]:Array.from({length:28},(_,i)=>57+i).filter(midi=>((midi-original)%12+12)%12===0);
      paths=candidates.map(midi=>paths.map(path=>{
        const previous=path.pitches.at(-1),distance=previous===undefined?0:Math.abs(midi-previous);
        const cost=path.cost+distance+Math.max(0,distance-7)*5+Math.abs(midi-original)*.08+(previous===undefined?Math.abs(midi-72)*.1:0);
        return {cost,pitches:[...path.pitches,midi]};
      }).sort((a,b)=>a.cost-b.cost)[0]);
    }
    const pitches=paths.sort((a,b)=>a.cost-b.cost)[0]?.pitches||[];let index=0;
    const bars=passage.bars.map(bar=>({...bar,notes:bar.notes.map(note=>{
      if(note.rest)return {...note};const midi=pitches[index++],octaves=(midi-(note.soundingMidi??note.midi))/12;
      return {...note,midi,soundingMidi:midi,...(Number.isFinite(note.relativeStep)?{relativeStep:note.relativeStep+7*octaves}:{})};
    })}));
    return synchroniseMelodyPlan({...passage,bars,melodyRegisterPlanned:true,notes:bars.flatMap(bar=>bar.notes.map(note=>({...note,beat:(bar.startBeat??bar.barIndex*passage.timeSignature.beats)+note.beat})))});
  }

  function withGenerationContext(args, builder) {
    const previous = generationContext;
    const variation = nextVariation(args.level,args.topic);
    generationContext = variation;
    try {
      let passage = builder(variation);
      if (!FIXED_METRE_TOPICS.has(args.topic)) passage = retimePassage(passage,variation.signature);
      if(args.level==="AH"&&["intervalRecognition","vamp"].includes(args.topic))passage=smoothMelodicRegister(passage);
      passage = enforceMelodyRange(passage);
      passage = enforceAccompanimentFloor(passage);
      passage = synchroniseMelodyPlan(passage);
      if (!passage.playbackTempo) passage.playbackTempo = variation.playbackTempo;
      passage.generatedKey = passage.key?.id || variation.keyName;
      passage.generationVariation = { key:passage.generatedKey, tempo:passage.playbackTempo.bpm, accompaniment:passage.accompanimentPattern || variation.style, timeSignature:passage.timeSignature.id };
      return passage;
    } finally { generationContext = previous; }
  }

  const topics = {
    melodyDirection: { label: "Melodic Direction", icon: "./app-icons/scale-degrees-icon.svg", introduced: "N3", preserveLevel: true, supportsIsolated: true },
    stepLeap: { label: "Melodic Movements", icon: "./app-icons/intervals-icon.svg", introduced: "N3", preserveLevel: true, supportsIsolated: true },
    repetitionSequence: { label: "Melodic Devices", icon: "./app-icons/repeat-signs-icon.svg", introduced: "N3", preserveLevel: true, supportsIsolated: true },
    chordDiscord: { label: "Harmony", icon: "./app-icons/chords-icon.svg", introduced: "N3", preserveLevel: true, supportsIsolated: true },
    chordChanges: { label: "Chords", icon: "./app-icons/chords-icon.svg", introduced: "N3", preserveLevel: true },
    anacrusis: { label: "Anacrusis", icon: "./app-icons/time-signatures-icon.svg", introduced: "N4", preserveLevel: true },
    changeOfKey: { label: "Harmonic Devices", icon: "./app-icons/key-signatures-icon.svg", introduced: "N4", preserveLevel: true },
    modulation: { label: "Harmonic Devices", icon: "./app-icons/key-signatures-icon.svg", introduced: "N5", preserveLevel: true },
    bassPatterns: { label: "Bass Patterns", icon: "./app-icons/bass-patterns-icon.svg?v=shared-border-20261114", introduced: "N5", preserveLevel: true, supportsIsolated: true },
    tiercePicardie: { label: "Harmonic Devices", icon: "./app-icons/insert-missing-notes-icon.svg", introduced: "H", preserveLevel: true },
    relativeKey: { label: "Harmonic Devices", icon: "./app-icons/key-signatures-icon.svg", introduced: "H", preserveLevel: true },
    rhythmicChange: { label: "Rhythmic Devices", icon: "./app-icons/rhythm-groups-icon.svg", introduced: "H", preserveLevel: true, supportsIsolated: true },
    irregularMetre: { label: "Time Signatures", icon: "./app-icons/time-signatures-icon.svg", introduced: "H", preserveLevel: true },
  };

  const concept = (label, family, aliases) => ({ label, short: label, family, aliases });
  const concepts = {
    "direction-ascending": concept("Ascending", "melodyDirection", ["ascending", "ascend", "rising", "goes up"]),
    "direction-descending": concept("Descending", "melodyDirection", ["descending", "descend", "falling", "goes down"]),
    "movement-step": concept("Step", "stepLeap", ["step", "stepwise", "stepwise movement", "moves by step"]),
    "movement-leap": concept("Leap", "stepLeap", ["leap", "leaping", "moves by leap", "leaps"]),
    "pattern-ostinato": concept("Repetition", "repetitionSequence", ["ostinato", "riff", "ostinato/riff", "ostinato or riff", "repetition", "repeat", "repeated"]),
    "pattern-sequence": concept("Sequence", "repetitionSequence", ["sequence", "sequential", "sequencing"]),
    "harmony-chord": concept("Chord", "chordDiscord", ["chord", "concord", "consonant", "consonance"]),
    "harmony-discord": concept("Discord", "chordDiscord", ["discord", "dissonant", "dissonance"]),
    "changes-1": concept("1 chord", "chordChanges", ["1", "one", "one chord", "1 chord", "one change", "1 change"]),
    "changes-2": concept("2 chords", "chordChanges", ["2", "two", "two chords", "2 chords", "two changes", "2 changes"]),
    "changes-3": concept("3 chords", "chordChanges", ["3", "three", "three chords", "3 chords", "three changes", "3 changes"]),
    "changes-4": concept("4 chords", "chordChanges", ["4", "four", "four chords", "4 chords", "four changes", "4 changes"]),
    "anacrusis-yes": concept("Anacrusis", "anacrusis", ["anacrusis", "yes", "pickup", "upbeat"]),
    "anacrusis-no": concept("No anacrusis", "anacrusis", ["no anacrusis", "no", "without an anacrusis", "no pickup"]),
    "change-key-yes": concept("Change of key", "changeOfKey", ["change of key", "yes", "changes key", "new key"]),
    "change-key-no": concept("No change of key", "changeOfKey", ["no change of key", "no", "stays in the same key", "same key"]),
    "modulation-yes": concept("Modulation", "modulation", ["modulation", "yes", "changes key", "change of key"]),
    "modulation-no": concept("No modulation", "modulation", ["no modulation", "no", "stays in the same key", "same key"]),
    "bass-walking": concept("Walking bass", "bassPatterns", ["walking bass", "walking", "walk bass"]),
    "bass-ground": concept("Ground bass", "bassPatterns", ["ground bass", "ground", "repeating bass"]),
    "bass-alberti": concept("Alberti bass", "bassPatterns", ["alberti bass", "alberti", "broken chord bass"]),
    "tierce-yes": concept("Tierce de Picardie", "tiercePicardie", ["tierce de picardie", "tierce picardie", "yes", "major ending"]),
    "tierce-no": concept("No Tierce de Picardie", "tiercePicardie", ["no tierce de picardie", "no", "minor ending"]),
    "relative-major": concept("Relative major", "relativeKey", ["relative major", "major", "moves to relative major"]),
    "relative-minor": concept("Relative minor", "relativeKey", ["relative minor", "minor", "moves to relative minor"]),
    "relative-same": concept("No modulation", "relativeKey", ["stays the same", "same", "same key", "no change", "no modulation"]),
    "rhythm-augmentation": concept("Augmentation", "rhythmicChange", ["augmentation", "augmented", "longer note values", "twice as long"]),
    "rhythm-diminution": concept("Diminution", "rhythmicChange", ["diminution", "diminished", "shorter note values", "half as long"]),
    "metre-irregular": concept("Irregular time signature", "irregularMetre", ["irregular", "irregular time", "irregular time signature"]),
    "metre-change": concept("Time changes", "irregularMetre", ["time change", "time changes", "metre change", "meter change", "changing time signature"]),
    "metre-3": concept("3 beats in the bar", "irregularMetre", ["3", "three", "3 beats", "3 beats in the bar", "three beats in the bar", "3 beats per bar", "three beats per bar"]),
    "metre-4": concept("4 beats in the bar", "irregularMetre", ["4", "four", "4 beats", "4 beats in the bar", "four beats in the bar", "4 beats per bar", "four beats per bar"]),
  };

  const idsByFamily = Object.fromEntries(Object.keys(topics).map(family => [family,
    Object.keys(concepts).filter(id => concepts[id].family === family)]));

  function conceptIdsForLevel(level) {
    const ids = Object.entries(topics)
      .filter(([, topic]) => LEVEL_RANK[level] >= LEVEL_RANK[topic.introduced])
      .flatMap(([family]) => idsByFamily[family]);
    // National 4 introduces this as "Change of key". From National 5 onward
    // the same listening skill is assessed under the curriculum term
    // "Modulation", so do not present both names as separate concepts.
    if (LEVEL_RANK[level] > LEVEL_RANK.N4) {
      return ids.filter(id => concepts[id].family !== "changeOfKey" && !(level === "H" && concepts[id].family === "modulation"));
    }
    return ids;
  }

  function degreeMidi(key, degree) {
    const octave = Math.floor(degree / 7);
    const index = ((degree % 7) + 7) % 7;
    return key.tonic + octave * 12 + key.scale[index];
  }

  function notesFrom(degrees, durations, key, prefix) {
    let beat = 0;
    return degrees.map((degree, index) => {
      const rest = degree === null;
      const midi = rest ? 0 : degreeMidi(key, degree);
      const note = { id: `${prefix}-${index}`, midi, soundingMidi: midi, relativeStep:degree, beat, beats: durations[index], volume: 0.82, ...(rest ? { rest:true } : {}) };
      beat += durations[index];
      return note;
    });
  }

  function accompanimentFor({ signature, notes, segments, style, finalBar }) {
    return MLH.AuralAccompaniment.eventsForBar({ signature, notes, segments, style, finalBar });
  }

  function makePassage({ barCount = 16, signature = SIGNATURES["4/4"], keyNames, progression = null,
    degreeBars, durationBars, style, segmentBars, silentAccompaniment = false, fullPassage = true }) {
    if (fullPassage) barCount = Math.max(16,barCount);
    keyNames = keyNames || [generationContext?.keyName || "C"];
    style = style || generationContext?.style || MLH.AuralAccompaniment.chooseStyle(signature);
    const practicePlan = generateFreshPlan(signature,generationContext?.topic || "question");
    const bars = Array.from({ length: barCount }, (_, barIndex) => {
      const key = KEYS[keyNames[Math.min(barIndex, keyNames.length - 1)]] || KEYS.C;
      const plannedBar = practicePlan?.bars?.[barIndex];
      const chordSymbol = progression?.[barIndex % progression.length] || plannedBar?.chordSymbol || PROGRESSION[barIndex % PROGRESSION.length];
      const customDegrees = degreeBars?.[barIndex % degreeBars.length];
      const rawDegrees = customDegrees
        || plannedBar?.notes?.map(note=>note.rest?null:note.relativeStep)
        || [0,1,2,1];
      const durations = durationBars?.[barIndex % durationBars.length]
        || (customDegrees ? Array(rawDegrees.length).fill(signature.beats/rawDegrees.length) : null)
        || plannedBar?.notes?.map(note=>note.beats)
        || Array(rawDegrees.length).fill(signature.beats/rawDegrees.length);
      // Keep the fresh Practice Questions contour and rhythm, but place each
      // bar's opening and metrically strong notes on its selected chord. This
      // also prevents a supplied progression from becoming detached from the
      // generated melody.
      const chordClasses = degreeClassesForChord(key,chordSymbol);
      let noteBeat = 0;
      let heardOpening = false;
      const degrees = !customDegrees
        ? rawDegrees.map((degree,index)=>{
            const beat=noteBeat;
            noteBeat+=durations[index];
            if(degree===null) return null;
            const firstSounding = !heardOpening;
            heardOpening = true;
            const strongBeat = beat===0 || (signature.type==="compound" ? Math.abs(beat-1.5)<1e-8 : Number.isInteger(beat));
            return firstSounding || strongBeat ? nearestDegreeInClasses(degree,chordClasses) : degree;
          })
        : rawDegrees;
      const notes = notesFrom(degrees, durations, key, `ear-${barIndex}`);
      const segments = segmentBars?.[barIndex % segmentBars.length] || [{ beat: 0, beats: signature.beats, pitches: key.chords[chordSymbol] || key.chords.I }];
      return {
        barIndex, chordSymbol, notes, accompanimentHarmony: segments, generatedAccompaniment:!silentAccompaniment,
        accompaniment: silentAccompaniment ? [] : accompanimentFor({ signature, notes, segments, style, finalBar: barIndex === barCount - 1 }),
      };
    });
    return {
      id: `${Date.now()}-${Math.random()}`, key: KEYS[keyNames[0]] || KEYS.C, timeSignature: signature,
      bars, barCount, totalBeats: barCount * signature.beats, accompanimentPattern: style,
      generationLevel: "AH", melodyGenerationStyle: "advancedHigherListeningAdaptation", melodyPlan:practicePlan,
      notes: bars.flatMap(bar => bar.notes.map(note => ({ ...note, beat:bar.barIndex * signature.beats + note.beat }))),
    };
  }

  function isolatePassage(passage, { barIndexes, melody = true, accompaniment = false }) {
    const selected = barIndexes.map(index => passage.bars[index]).filter(Boolean);
    const bars = selected.map((bar, barIndex) => ({
      ...bar,
      barIndex,
      notes: melody ? bar.notes.map(note => ({ ...note })) : [],
      accompaniment: accompaniment ? bar.accompaniment.map(event => ({ ...event, pitches:[...event.pitches] })) : [],
      accompanimentHarmony: accompaniment ? bar.accompanimentHarmony.map(segment => ({ ...segment, pitches:[...segment.pitches] })) : [],
    }));
    return synchroniseMelodyPlan({
      ...passage,
      id: `${passage.id}-isolated`,
      bars,
      barCount: bars.length,
      totalBeats: bars.length * passage.timeSignature.beats,
      notes: bars.flatMap(bar => bar.notes.map(note => ({ ...note, beat:bar.barIndex * passage.timeSignature.beats + note.beat }))),
      isolated: true,
    });
  }

  function createBalancedAnswerChooser() {
    const bags = new Map();
    const recent = new Map();
    return (options, key = "default") => {
      const optionKey = [...options].sort().join("|");
      const bagKey = `${key}:${optionKey}`;
      let bag = bags.get(bagKey) || [];
      if (!bag.length) {
        // Two independently shuffled rounds keep the answers balanced without
        // creating a predictable strict alternation or a run longer than two.
        bag = [...options].sort(()=>Math.random()-.5).concat([...options].sort(()=>Math.random()-.5));
      }
      const previous=recent.get(bagKey) || [];
      if(previous.length>=2&&previous.at(-1)===previous.at(-2)&&bag[0]===previous.at(-1)) {
        const alternative=bag.findIndex(answer=>answer!==previous.at(-1));
        if(alternative>0) [bag[0],bag[alternative]]=[bag[alternative],bag[0]];
      }
      const answer = bag.shift();
      bags.set(bagKey,bag);
      recent.set(bagKey,[...previous.slice(-1),answer]);
      return answer;
    };
  }

  function finish(base, { level, topic, answerId, options, mode }) {
    const plans = {
      melodyDirection: { barIndexes:[0,1] },
      stepLeap: { barIndexes:[0,1] },
      repetitionSequence: { barIndexes:[0,1,2,3] },
      chordDiscord: { barIndexes:[0], melody:false, accompaniment:true },
      bassPatterns: { barIndexes:[0,1], melody:false, accompaniment:true },
      rhythmicChange: { barIndexes:[0,1,2,3] },
    };
    const isolatedPlan=topic==="repetitionSequence" ? {barIndexes:base.bars.map((_,index)=>index)} : plans[topic];
    const isolatedPassage = base.isolatedPassage || (isolatedPlan ? isolatePassage(base, isolatedPlan) : null);
    return { ...base, type: topic, level, answerId, answer: concepts[answerId], options, mode, ...(isolatedPassage ? { isolatedPassage } : {}) };
  }

  function melodicMovementProfile(level,kind) {
    const rank=LEVEL_RANK[level] ?? 0;
    if(kind==="step") return {targetRatio:rank<=1?.85:.72,maximumInterval:rank<=1?2:3};
    if(kind==="leap") return {targetRatio:rank<=1?.62:.55,maximumInterval:3};
    return {targetRatio:rank<=1?.78:.68,maximumInterval:2};
  }

  function melodicMovementContour(kind,count,start,level) {
    const profile=melodicMovementProfile(level,kind);
    const degrees=[start];
    while(degrees.length<count) {
      const previous=degrees.at(-1);
      let interval;
      if(kind==="ascending") interval=choose([1,1,1,2,-1]);
      else if(kind==="descending") interval=choose([-1,-1,-1,-2,1]);
      else if(kind==="step") {
        const recentDirection=degrees.length>2 ? Math.sign(previous-degrees.at(-2)) : 0;
        const direction=choose(recentDirection ? [recentDirection,-recentDirection,-recentDirection] : [-1,1]);
        interval=direction*(Math.random()<profile.targetRatio ? 1 : choose([2,profile.maximumInterval]));
      } else {
        const recentDirection=degrees.length>2 ? Math.sign(previous-degrees.at(-2)) : 0;
        const direction=choose(recentDirection ? [recentDirection,-recentDirection,-recentDirection] : [-1,1]);
        interval=direction*(Math.random()<profile.targetRatio ? choose([2,2,3]) : 1);
      }
      const trial=previous+interval;
      const span=Math.max(...degrees,trial)-Math.min(...degrees,trial);
      degrees.push(span<=8 ? trial : previous-interval);
    }
    return degrees;
  }

  function validMelodicMovement(kind,degrees,level) {
    const intervals=degrees.slice(1).map((degree,index)=>degree-degrees[index]);
    const profile=melodicMovementProfile(level,kind);
    if(new Set(degrees).size<Math.min(3,degrees.length)) return false;
    if(kind==="ascending"||kind==="descending") {
      const direction=kind==="ascending"?1:-1;
      return intervals.every(interval=>Math.abs(interval)>=1&&Math.abs(interval)<=2)
        && intervals.filter(interval=>interval*direction>0).length/intervals.length>=profile.targetRatio
        && (degrees.at(-1)-degrees[0])*direction>=2;
    }
    if(!intervals.every(interval=>Math.abs(interval)>=1&&Math.abs(interval)<=profile.maximumInterval)) return false;
    const targetCount=intervals.filter(interval=>kind==="step"?Math.abs(interval)===1:Math.abs(interval)>=2).length;
    return targetCount/intervals.length>=profile.targetRatio;
  }

  function directionalFinalStarts(kind,key,signature) {
    if(!["ascending","descending"].includes(kind)) return [];
    const direction=kind==="ascending" ? 1 : -1;
    const starts=new Set();
    for(const template of patternRhythmTemplates(signature)) {
      const count=template.durations.length-(template.leadingRest?1:0);
      const combinations=2**Math.max(0,count-1);
      for(let start=-12;start<=16;start++) for(let mask=0;mask<combinations;mask++) {
        const degrees=[start];
        for(let index=0;index<count-1;index++) degrees.push(degrees.at(-1)+direction*(1+((mask>>index)&1)));
        if(((degrees.at(-1)%7)+7)%7!==0) continue;
        if(!degreeClassesForChord(key,"I").includes(((start%7)+7)%7)) continue;
        const pitches=degrees.map(degree=>degreeMidi(key,degree));
        if(pitches.every(midi=>midi>=MELODY_MIN_MIDI&&midi<=MELODY_MAX_MIDI)) starts.add(pitches[0]);
      }
    }
    return [...starts];
  }

  function buildMelodicMovement(answerId) {
    const signature=generationContext?.signature || SIGNATURES["4/4"];
    const key=KEYS[generationContext?.keyName || "C"];
    const kind=answerId==="direction-ascending" ? "ascending"
      : answerId==="direction-descending" ? "descending"
      : answerId==="movement-leap" ? "leap" : "step";
    const level=generationContext?.level || "N3";
    const profile=melodicMovementProfile(level,kind);
    const barCount=["N3","N5"].includes(level)?8:16;
    const progression=[];
    const finalStarts=directionalFinalStarts(kind,key,signature);
    const degreeBars=[],durationBars=[],rhythmTemplates=[],generationAttempts=[];
    const availableTemplates=patternRhythmTemplates(signature);
    const phraseRhythms=Array.from({length:barCount/4},(_,phraseIndex)=>{
      const first=balancedPatternValue(`movement-phrase-a-${kind}-${signature.id}`,availableTemplates);
      const alternatives=availableTemplates.filter(template=>template.id!==first.id);
      const contrast=balancedPatternValue(`movement-phrase-b-${kind}-${signature.id}-${first.id}`,alternatives.length?alternatives:availableTemplates);
      return [first,first,contrast,first].map(template=>({...template,phraseIndex}));
    });
    let previousMidi=null,gestureStartMidi=null,fallbacks=0;
    for(let barIndex=0;barIndex<barCount;barIndex++) {
      const templates=availableTemplates;
      const requestedTemplate=phraseRhythms[Math.floor(barIndex/4)][barIndex%4];
      const templateCandidates=[requestedTemplate,...shuffle(templates.filter(template=>template.id!==requestedTemplate.id))];
      const harmonicOptions=barIndex%8===6 ? ["V"] : barIndex%8===7 ? ["I"] : ["I","IV","VI"];
      let acceptedDegrees=null,acceptedDurations=null,acceptedTemplate=null,acceptedSymbol=null,attempts=0;
      candidateSearch: for(const template of templateCandidates) {
        const soundingCount=template.durations.length-(template.leadingRest?1:0);
        for(let attempt=0;attempt<2048;attempt++) {
          attempts++;
          const start=choose(Array.from({length:29},(_,index)=>index-12));
          const sounding=melodicMovementContour(kind,soundingCount,start,level);
          if(!validMelodicMovement(kind,sounding,level)) continue;
          const matchingSymbols=harmonicOptions.filter(symbol=>degreeClassesForChord(key,symbol).includes(((sounding[0]%7)+7)%7));
          if(!matchingSymbols.length) continue;
          if(barIndex===barCount-1&&((sounding.at(-1)%7)+7)%7!==0) continue;
          const pitches=sounding.map(degree=>degreeMidi(key,degree));
          if(!pitches.every(midi=>midi>=MELODY_MIN_MIDI&&midi<=MELODY_MAX_MIDI)) continue;
          if(barIndex===barCount-2&&["ascending","descending"].includes(kind)) {
            const direction=kind==="ascending"?1:-1;
            const tonicCandidates=Array.from({length:6},(_,index)=>key.tonic+(index-2)*12)
              .filter(midi=>midi>=MELODY_MIN_MIDI&&midi<=MELODY_MAX_MIDI);
            if(!tonicCandidates.some(tonic=>(tonic-pitches[0])*direction>0&&Math.abs(tonic-pitches.at(-1))<=12)) continue;
          }
          if(previousMidi!==null&&Math.abs(pitches[0]-previousMidi)>12) continue;
          if(gestureStartMidi!==null&&barIndex%2!==0&&["ascending","descending"].includes(kind)) {
            const direction=kind==="ascending"?1:-1;
            if((pitches.at(-1)-gestureStartMidi)*direction<=0) continue;
          }
          if(barIndex===barCount-2&&finalStarts.length&&Math.min(...finalStarts.map(midi=>Math.abs(midi-pitches.at(-1))))>12) continue;
          acceptedDegrees=template.leadingRest ? [null,...sounding] : sounding;
          acceptedDurations=[...template.durations];
          acceptedTemplate=template;
          acceptedSymbol=choose(matchingSymbols);
          break candidateSearch;
        }
      }
      if(!acceptedDegrees) {
        fallbacks++;
        const fallbackTemplate=templateCandidates[0];
        const soundingCount=fallbackTemplate.durations.length-(fallbackTemplate.leadingRest?1:0);
        const tonicNearPrevious=Array.from({length:7},(_,index)=>(index-3)*7)
          .sort((first,second)=>Math.abs(degreeMidi(key,first)-(previousMidi??69))-Math.abs(degreeMidi(key,second)-(previousMidi??69)))[0];
        let sounding;
        if(kind==="ascending") sounding=Array.from({length:soundingCount},(_,index)=>tonicNearPrevious-soundingCount+1+index);
        else if(kind==="descending") sounding=Array.from({length:soundingCount},(_,index)=>tonicNearPrevious+soundingCount-1-index);
        else if(kind==="leap") sounding=Array.from({length:soundingCount},(_,index)=>tonicNearPrevious+(index%2?2:0));
        else sounding=Array.from({length:soundingCount},(_,index)=>tonicNearPrevious+(index%2?1:0));
        if(barIndex===barCount-1) sounding[sounding.length-1]=tonicNearPrevious;
        acceptedDegrees=fallbackTemplate.leadingRest ? [null,...sounding] : sounding;
        acceptedDurations=[...fallbackTemplate.durations];
        acceptedTemplate={...fallbackTemplate,id:"fallback"};
        acceptedSymbol=harmonicOptions.find(symbol=>degreeClassesForChord(key,symbol).includes(((sounding[0]%7)+7)%7)) || harmonicOptions[0];
      }
      progression.push(acceptedSymbol);
      degreeBars.push(acceptedDegrees);
      durationBars.push(acceptedDurations);
      rhythmTemplates.push({requested:requestedTemplate.id,accepted:acceptedTemplate.id});
      generationAttempts.push(attempts);
      if(barIndex%2===0) gestureStartMidi=degreeMidi(key,acceptedDegrees.filter(degree=>degree!==null)[0]);
      previousMidi=degreeMidi(key,acceptedDegrees.filter(degree=>degree!==null).at(-1));
    }
    const segmentBars=progression.map(symbol=>[{beat:0,beats:signature.beats,pitches:key.chords[symbol]||key.chords.I,volume:.68}]);
    const passage=makePassage({barCount,signature,progression,degreeBars,durationBars,style:"block_chords",segmentBars,fullPassage:barCount>=16});
    passage.movementKind=kind;
    passage.movementSource="shared-harmony-aware-planner";
    passage.movementHarmonyFitted=true;
    passage.movementRegisterPlanned=true;
    passage.movementEndsOnTonic=true;
    passage.movementCadence="perfect";
    passage.movementPhraseLength=4;
    passage.movementPhraseCount=barCount/4;
    passage.movementExcerptBars=barCount;
    passage.movementRhythmStructure="AABA";
    passage.movementTargetRatio=profile.targetRatio;
    passage.movementCrossBarDirection=true;
    passage.movementDirectionalGestureBars=2;
    passage.movementAccompanimentClarity="quiet-block-chords";
    passage.movementRhythmTemplates=rhythmTemplates;
    passage.movementGenerationAttempts=generationAttempts;
    passage.movementGenerationFallbacks=fallbacks;
    passage.melodyPlan={validation:{accepted:fallbacks===0},bars:passage.bars.map(bar=>({chordSymbol:bar.chordSymbol,notes:bar.notes.map(note=>({...note}))}))};
    return passage;
  }

  function buildDirection(answerId) { return buildMelodicMovement(answerId); }

  function buildStepLeap(answerId) { return buildMelodicMovement(answerId); }

  const patternVariationBags=new Map();
  const patternMelodySignatures=new Set();
  function balancedPatternValue(key,values) {
    let bag=patternVariationBags.get(key) || [];
    if(!bag.length) bag=shuffle(values);
    const value=bag.shift();
    patternVariationBags.set(key,bag);
    return value;
  }

  function patternRhythmTemplates(signature) {
    const templates={
      "2/4":[
        {id:"quaver-pair-crotchet",durations:[.5,.5,1]},
        {id:"crotchet-quaver-pair",durations:[1,.5,.5]},
        {id:"four-quavers",durations:[.5,.5,.5,.5]},
        {id:"dotted-crotchet",durations:[1.5,.25,.25]},
        {id:"upbeat-entry",durations:[.5,.5,.5,.5],leadingRest:true},
      ],
      "3/4":[
        {id:"crotchet-quavers-crotchet",durations:[1,.5,.5,1]},
        {id:"quavers-two-crotchets",durations:[.5,.5,1,1]},
        {id:"dotted-crotchet",durations:[1.5,.5,.5,.5]},
        {id:"flowing-quavers",durations:[.5,.5,.5,.5,1]},
        {id:"upbeat-entry",durations:[.5,.5,1,1],leadingRest:true},
      ],
      "4/4":[
        {id:"crotchet-quavers-crotchets",durations:[1,.5,.5,1,1]},
        {id:"quaver-pairs",durations:[.5,.5,1,.5,.5,1]},
        {id:"dotted-crotchet",durations:[1.5,.5,.5,.5,1]},
        {id:"syncopated-flow",durations:[.5,1,.5,1,1]},
        {id:"upbeat-entry",durations:[.5,.5,1,1,1],leadingRest:true},
      ],
      "6/8":[
        {id:"compound-pulses",durations:[1.5,.5,.5,.5]},
        {id:"quavers-and-pulse",durations:[.5,.5,.5,1.5]},
        {id:"compound-flow",durations:[1,.5,1,.5]},
        {id:"six-quavers",durations:[.5,.5,.5,.5,.5,.5]},
        {id:"upbeat-entry",durations:[.5,1,.5,1],leadingRest:true},
      ],
    };
    return templates[signature.id] || templates["4/4"];
  }

  function motifForTemplate(template,baseDegree) {
    const soundingCount=template.durations.length-(template.leadingRest?1:0);
    let contour=null;
    for(let attempt=0;attempt<64&&!contour;attempt++) {
      const candidate=[0];
      while(candidate.length<soundingCount) {
        const previous=candidate.at(-1);
        const step=choose([-3,-2,-1,-1,0,1,1,2,3]);
        const next=previous+step;
        const trial=[...candidate,next];
        const span=Math.max(...trial)-Math.min(...trial);
        const repeatedRun=trial.length>=3&&trial.at(-1)===trial.at(-2)&&trial.at(-2)===trial.at(-3);
        if(span<=6&&!repeatedRun) candidate.push(next);
      }
      if(new Set(candidate).size>=Math.min(3,soundingCount)) contour=candidate;
    }
    contour ||= Array.from({length:soundingCount},(_,index)=>[0,2,1,3,2,0][index%6]);
    const sounding=contour.map(degree=>baseDegree+degree);
    return template.leadingRest ? [null,...sounding] : sounding;
  }

  function chordPitchClasses(key,symbol) {
    return new Set((key.chords[symbol] || key.chords.I).map(midi=>((midi%12)+12)%12));
  }

  function degreeClassesForChord(key,symbol) {
    const chord=chordPitchClasses(key,symbol);
    return Array.from({length:7},(_,degree)=>degree).filter(degree=>chord.has(((degreeMidi(key,degree)%12)+12)%12));
  }

  function nearestDegreeInClasses(reference,classes) {
    return classes.flatMap(degreeClass=>Array.from({length:7},(_,index)=>degreeClass+(index-3)*7))
      .sort((first,second)=>Math.abs(first-reference)-Math.abs(second-reference))[0];
  }

  function compatiblePatternHarmonies(key,offsets) {
    const options=[];
    for(let degree=0;degree<7;degree++) {
      const progression=[];
      let valid=true;
      for(let barIndex=0;barIndex<offsets.length;barIndex++) {
        const symbols=barIndex===offsets.length-1?["V"]:["I","IV","V","VI"];
        const shiftedClass=((degree+offsets[barIndex])%7+7)%7;
        const candidates=symbols.filter(symbol=>degreeClassesForChord(key,symbol).includes(shiftedClass));
        if(!candidates.length) { valid=false; break; }
        const different=candidates.filter(symbol=>symbol!==progression.at(-1));
        progression.push((different.length?different:candidates)[(barIndex+degree)%Math.max(1,(different.length?different:candidates).length)]);
      }
      if(valid) options.push({progression:[...progression,"I"],strongClasses:[degree]});
    }
    return options;
  }

  function alignMotifWithHarmony(motif,durations,signature,strongClasses,cadentialClasses,finalOffset,repeatHalves=false) {
    const strongBeats=strongBeatOffsets(signature);
    let beat=0;
    const noteStarts=durations.map(duration=>{ const start=beat; beat+=duration; return start; });
    beat=0;
    const aligned=motif.map((degree,index)=>{
      const strong=degree!==null&&strongBeats.some(strongBeat=>Math.abs(beat-strongBeat)<0.001);
      const adjusted=strong ? nearestDegreeInClasses(degree,strongClasses) : degree;
      beat+=durations[index];
      return adjusted;
    });
    if(repeatHalves) {
      const half=aligned.length/2;
      for(let index=0;index<half;index++) {
        if(aligned[index]===null) continue;
        const mustSupportStrongBeat=[index,index+half].some(noteIndex=>strongBeats.some(strongBeat=>Math.abs(noteStarts[noteIndex]-strongBeat)<0.001));
        const degree=mustSupportStrongBeat ? nearestDegreeInClasses(motif[index],strongClasses) : aligned[index];
        aligned[index]=degree;
        aligned[index+half]=degree;
      }
    }
    const finalIndex=aligned.reduce((last,degree,index)=>degree===null?last:index,-1);
    if(finalIndex>=0) {
      let sourceClasses=cadentialClasses.map(degree=>((degree-finalOffset)%7+7)%7);
      const mirrorIndex=repeatHalves ? finalIndex-aligned.length/2 : -1;
      const mirrorMustSupportStrongBeat=mirrorIndex>=0&&strongBeats.some(strongBeat=>Math.abs(noteStarts[mirrorIndex]-strongBeat)<0.001);
      if(mirrorMustSupportStrongBeat) sourceClasses=sourceClasses.filter(degreeClass=>strongClasses.includes(degreeClass));
      aligned[finalIndex]=nearestDegreeInClasses(aligned[finalIndex],sourceClasses.length?sourceClasses:strongClasses);
      if(mirrorIndex>=0) aligned[mirrorIndex]=aligned[finalIndex];
    }
    return aligned;
  }

  function strongBeatOffsets(signature) {
    return signature.id==="6/8" ? [0,1.5] : Array.from({length:Math.round(signature.beats)},(_,index)=>index);
  }

  function harmonyScore(key,symbol,degrees,durations,signature) {
    const chord=chordPitchClasses(key,symbol);
    const strongBeats=strongBeatOffsets(signature);
    let beat=0,score=0,strongMatches=0,strongNonChord=0,strongNotes=0;
    degrees.forEach((degree,index)=>{
      const duration=durations[index];
      if(degree!==null) {
        const strong=strongBeats.some(strongBeat=>Math.abs(beat-strongBeat)<0.001);
        const match=chord.has(((degreeMidi(key,degree)%12)+12)%12);
        score+=(match ? 3 : strong ? -2 : 0)+(strong&&match ? 2 : 0);
        if(strong) {
          strongNotes++;
          if(match) strongMatches++;
          else strongNonChord++;
        }
      }
      beat+=duration;
    });
    return {score,strongMatches,strongNonChord,strongNotes};
  }

  function fittedPatternRegister(key,motif,offsets,direction) {
    const featureDegrees=offsets.flatMap(offset=>motif.filter(degree=>degree!==null).map(degree=>degree+offset));
    const openingDegree=motif.find(degree=>degree!==null);
    const shifts=Array.from({length:13},(_,index)=>(index-6)*7).filter(shift=>{
      const pitches=featureDegrees.map(degree=>degreeMidi(key,degree+shift));
      if(!pitches.every(midi=>midi>=MELODY_MIN_MIDI&&midi<=MELODY_MAX_MIDI)) return false;
      const openingMidi=degreeMidi(key,openingDegree+shift);
      if(direction==="descending") return openingMidi>=72&&openingMidi<=84;
      if(direction==="ascending") return openingMidi>=57&&openingMidi<=69;
      return true;
    });
    return shifts.sort((first,second)=>Math.abs(first)-Math.abs(second))[0];
  }

  function selectPatternHarmony(key,featureBars,durations,signature) {
    const progression=[];
    for(let barIndex=0;barIndex<featureBars.length;barIndex++) {
      const available=barIndex===featureBars.length-1?["V"]:["I","IV","V","VI"];
      const candidates=available.filter(symbol=>symbol!==progression.at(-1));
      const ranked=candidates.map(symbol=>({symbol,...harmonyScore(key,symbol,featureBars[barIndex],durations,signature)}))
        .sort((first,second)=>first.strongNonChord-second.strongNonChord||second.strongMatches-first.strongMatches||second.score-first.score);
      progression.push(ranked[0].symbol);
    }
    return [...progression,"I"];
  }

  function buildRepetitionSequence(answerId,{level}={}) {
    const signature=generationContext?.signature || SIGNATURES["4/4"];
    const key=KEYS[generationContext?.keyName || "C"];
    const direction=answerId==="pattern-sequence"
      ? balancedPatternValue("sequence-direction",["ascending","descending"])
      : "repeated";
    const fastSequence=answerId==="pattern-sequence"&&balancedPatternValue("sequence-rhythm-style",[false,true]);
    const barCount=["N3","AH"].includes(level)?8:4;
    const featureBarCount=barCount-1;
    const step=answerId==="pattern-sequence" ? ["N3","AH"].includes(level)?1:balancedPatternValue("sequence-step",[1,2]) : 0;
    const directionSign=direction==="descending"?-1:1;
    const offsets=answerId === "pattern-sequence"
      ? Array.from({length:featureBarCount},(_,barIndex)=>barIndex*step*directionSign)
      : Array(featureBarCount).fill(0);
    let motif,durations,featureBars,template,registerShift,progression,generationAttempts=0,accepted=false,melodySignature=null;
    const availableTemplates=patternRhythmTemplates(signature).filter(candidate=>{
      if(signature.id==="6/8"&&fastSequence&&candidate.id==="upbeat-entry") return false;
      if(signature.id==="3/4"&&answerId==="pattern-sequence"&&(candidate.id==="upbeat-entry"||(!fastSequence&&["crotchet-quavers-crotchet","quavers-two-crotchets"].includes(candidate.id)))) return false;
      return true;
    });
    const balancedTemplate=balancedPatternValue(`pattern-rhythm-${signature.id}-${direction}-${fastSequence?"fast":"standard"}`,availableTemplates);
    const templateCandidates=[balancedTemplate,...shuffle(availableTemplates.filter(candidate=>candidate.id!==balancedTemplate.id))];
    const harmonyOptions=compatiblePatternHarmonies(key,offsets);
    const harmonyPlan=choose(harmonyOptions);
    progression=harmonyPlan?.progression;
    candidateSearch: for(const candidateTemplate of templateCandidates) {
      for(let attempt=0;attempt<64&&!accepted&&harmonyPlan;attempt++) {
        generationAttempts++;
        template=candidateTemplate;
        durations=[...template.durations];
        motif=motifForTemplate(template,choose([0,1,2,3,4,5,6]));
        if(fastSequence) {
          motif=[...motif,...motif];
          durations=[...durations.map(beats=>beats/2),...durations.map(beats=>beats/2)];
        }
        motif=alignMotifWithHarmony(motif,durations,signature,harmonyPlan.strongClasses,degreeClassesForChord(key,"V"),offsets.at(-1),fastSequence);
        if(new Set(motif.filter(degree=>degree!==null)).size<3) continue;
        registerShift=fittedPatternRegister(key,motif,offsets,direction);
        if(registerShift===undefined) continue;
        motif=motif.map(degree=>degree===null?null:degree+registerShift);
        featureBars=offsets.map(offset=>motif.map(degree=>degree===null?null:degree+offset));
        const harmonyChecks=featureBars.map((bar,index)=>harmonyScore(key,progression[index],bar,durations,signature));
        accepted=harmonyChecks.every(check=>check.strongMatches>0&&check.strongNonChord===0);
        if(accepted) {
          const candidateSignature=JSON.stringify({answerId,key:key.id,signature:signature.id,featureBars,durations});
          if(patternMelodySignatures.has(candidateSignature)) accepted=false;
          else melodySignature=candidateSignature;
        }
        if(accepted) break candidateSearch;
      }
    }
    if(!accepted) {
      template={id:"fallback",durations:signature.id==="2/4"?[.5,.5,.5,.5]:signature.id==="4/4"?[1,1,1,1]:[.5,.5,1,1]};
      durations=[...template.durations];
      const total=durations.reduce((sum,value)=>sum+value,0);
      durations[durations.length-1]+=signature.beats-total;
      motif=[0,2,1,4].slice(0,durations.length);
      registerShift=fittedPatternRegister(key,motif,offsets,direction) ?? 0;
      motif=motif.map(degree=>degree+registerShift);
      featureBars=offsets.map(offset=>motif.map(degree=>degree+offset));
      progression=selectPatternHarmony(key,featureBars,durations,signature);
    }
    const resolutionSource=featureBars.at(-1).filter(degree=>degree!==null).at(-1) ?? 0;
    const finalTonicDegree=Math.round(resolutionSource/7)*7 || 0;
    const degreeBars=[...featureBars,[finalTonicDegree]];
    const passage=makePassage({
      barCount,fullPassage:false,signature,degreeBars,
      durationBars:[...Array.from({length:featureBarCount},()=>[...durations]),[signature.beats]],
      progression,
    });
    if(melodySignature) patternMelodySignatures.add(melodySignature);
    const tiedIndices=passage.bars[0].notes.flatMap((note,index,notes)=>index<notes.length-1&&!note.rest&&!notes[index+1].rest&&note.relativeStep===notes[index+1].relativeStep&&Math.random()<0.35?[index]:[]);
    passage.bars.slice(0,featureBarCount).forEach(bar=>bar.notes.forEach((note,index,notes)=>{
      if(tiedIndices.includes(index)) {
        note.tieToNext=true;
        notes[index+1].tiedFromPrevious=true;
      }
    }));
    passage.patternMotif=[...motif];
    passage.patternOffsets=offsets;
    passage.patternDirection=direction;
    passage.patternSourceTimeSignature=signature.id;
    passage.patternEndsOnTonic=true;
    passage.patternFeatureBars=featureBarCount;
    passage.patternResolutionBars=1;
    passage.patternExcerptBars=barCount;
    passage.patternRegister=direction==="descending" ? "starts-in-C5-territory" : direction==="ascending" ? "starts-low-for-ascent" : "natural";
    passage.patternHarmony=passage.bars.map(bar=>bar.chordSymbol);
    passage.patternHarmonyFitted=true;
    passage.patternCadence="perfect";
    passage.patternRhythmStyle=fastSequence ? "diminished" : "standard";
    passage.patternRhythmTemplate=template.id;
    passage.patternRequestedRhythmTemplate=balancedTemplate.id;
    passage.patternEntry=template.leadingRest ? "upbeat" : "on-beat";
    passage.patternTiedNoteIndices=tiedIndices;
    passage.patternRegisterPlanned=true;
    passage.patternRejectionChecks=true;
    passage.patternGenerationAttempts=generationAttempts;
    passage.patternGenerationFallback=template.id==="fallback";
    return passage;
  }

  const recentTransformationMotifs=[];
  function makeMelodicTransformationPassage(answerId) {
    const signature=generationContext?.signature || SIGNATURES["4/4"];
    const key=KEYS[generationContext?.keyName || "C"];
    const retrograde=answerId==="transform-retrograde";
    const templates=patternRhythmTemplates(signature);
    const requested=balancedPatternValue(`transformation-rhythm-${signature.id}-${answerId}`,templates);
    let motif,durations,transformed,transformedDurations,template,shift;
    const transform=degrees=>retrograde?[...degrees].reverse():degrees.map(degree=>degree===null?null:2*degrees.find(value=>value!==null)-degree);
    const harmonyFor=(degrees,rhythm)=>["I","IV","VI"].filter(symbol=>{
      const score=harmonyScore(key,symbol,degrees,rhythm,signature);
      return score.strongNonChord===0&&score.strongMatches>0;
    });
    let sourceHarmonies,targetHarmonies;
    for(let attempt=0;attempt<192;attempt++) {
      template=attempt<128?requested:choose(templates);
      durations=[...template.durations];
      motif=motifForTemplate(template,0);
      // Fit the original motif once. Never move individual transformed bars:
      // that would change the inversion axis or corrupt the retrograde.
      motif=alignMotifWithHarmony(motif,durations,signature,degreeClassesForChord(key,"I"),degreeClassesForChord(key,"I"),0,false);
      transformed=transform(motif);
      transformedDurations=retrograde?[...durations].reverse():[...durations];
      if(new Set(motif.filter(degree=>degree!==null)).size<3)continue;
      if(JSON.stringify([motif,durations])===JSON.stringify([transformed,transformedDurations]))continue;
      if(recentTransformationMotifs.includes(JSON.stringify([answerId,signature.id,motif,durations])))continue;
      sourceHarmonies=harmonyFor(motif,durations);targetHarmonies=harmonyFor(transformed,transformedDurations);
      if(!sourceHarmonies.includes("I")||!targetHarmonies.length)continue;
      shift=fittedPatternRegister(key,[...motif,...transformed],[0],"natural");
      if(shift!==undefined)break;
    }
    if(shift===undefined) {
      template={id:"triadic-fallback"};motif=[0,2,4,2];durations=Array(4).fill(signature.beats/4);
      transformed=transform(motif);transformedDurations=retrograde?[...durations].reverse():[...durations];
      shift=fittedPatternRegister(key,[...motif,...transformed],[0],"natural");
      sourceHarmonies=["I","VI"];targetHarmonies=retrograde?["I","VI"]:["IV"];
    }
    recentTransformationMotifs.push(JSON.stringify([answerId,signature.id,motif,durations]));
    if(recentTransformationMotifs.length>64)recentTransformationMotifs.shift();
    motif=motif.map(degree=>degree===null?null:degree+shift);
    transformed=transformed.map(degree=>degree===null?null:degree+shift);
    const statements=["original","original","transformed","transformed","original","transformed"];
    const degreeBars=statements.map(kind=>[...(kind==="original"?motif:transformed)]);
    const durationBars=statements.map(kind=>[...(kind==="original"?durations:transformedDurations)]);
    const progression=statements.map((kind,index)=>index===0?"I":choose(kind==="original"?sourceHarmonies:targetHarmonies));
    const last=transformed.filter(degree=>degree!==null).at(-1);
    const leading=nearestDegreeInClasses(last,[6]);
    degreeBars.push([leading],[leading+1]);durationBars.push([signature.beats],[signature.beats]);progression.push("V","I");
    const passage=makePassage({barCount:8,fullPassage:false,signature,degreeBars,durationBars,progression,style:"block_chords"});
    const result={...passage,transformationStudy:true,transformationKind:retrograde?"retrograde":"inversion",transformationAxis:motif.find(degree=>degree!==null),transformationMotif:[...motif],transformationDurations:[...durations],transformationResult:[...transformed],transformationResultDurations:[...transformedDurations],transformationStatements:statements,transformationRhythmTemplate:template.id,transformationCadence:"perfect",transformationExcerptBars:8};
    return {...result,isolatedPassage:isolatePassage(result,{barIndexes:[0,1,2,3],melody:true,accompaniment:false})};
  }

  function buildChordDiscord(answerId) {
    const discord = answerId === "harmony-discord";
    const shapes=discord?[[0,1,7],[0,4,6],[0,2,6],[0,1,4]]:[[0,4,7],[0,3,7]];
    const voicings=Array.from({length:12},(_,root)=>shapes.flatMap((shape,shapeIndex)=>{
      const pitches=shape.map(interval=>60+(root+interval)%12).sort((a,b)=>a-b);
      const variants=[pitches];
      if(pitches.includes(60)) variants.push(pitches.map(pitch=>pitch===60?72:pitch).sort((a,b)=>a-b));
      return variants.map(tones=>({root,shapeIndex,pitches:tones}));
    })).flat();
    const voicing=balancedPatternValue(`single-sonority-${answerId}`,voicings);
    const pitches=voicing.pitches;
    const segments = [{ beat:0, beats:4, pitches, volume:1.2 }];
    const passage = makePassage({
      barCount:1, fullPassage:false, degreeBars:[[null]], durationBars:[[4]],
      segmentBars:[segments], silentAccompaniment:true, style:"block_chords",
    });
    passage.bars[0].accompaniment=[{beat:0,beats:3.8,pitches:[...pitches],volume:1.2}];
    passage.chordRange="C4-C5";
    passage.sonority={rootPitchClass:voicing.root,intervals:[...shapes[voicing.shapeIndex]],pitches:[...pitches],quality:discord?"discord":voicing.shapeIndex===0?"major":"minor"};
    return passage;
  }

  function buildChordChanges(answerId, { level } = {}) {
    const key = KEYS[generationContext?.keyName || "C"];
    const signature=generationContext?.signature || SIGNATURES["4/4"];
    const changeCount = Number(answerId.split("-")[1]);
    const barCount = 4;
    const onsetBarsByCount = { 1:[0], 2:[0,2], 3:[0,2,3], 4:[0,1,2,3] };
    const onsetBars = onsetBarsByCount[changeCount];
    const progressionOptions={
      1:[["I"]],
      2:[["V","I"]],
      3:[["VI","V","I"],["IV","V","I"]],
      4:[["VI","IV","V","I"],["IV","VI","V","I"]],
    };
    const symbols=balancedPatternValue(`chord-change-progression-${changeCount}`,progressionOptions[changeCount]);
    const barSymbols = Array.from({length:barCount},(_,barIndex)=>{
      let regionIndex=0;
      onsetBars.forEach((onset,index)=>{ if(onset<=barIndex) regionIndex=index; });
      return symbols[regionIndex];
    });
    const middleVoicing = chord => chord.slice(0,3).map(pitch=>{
      let voiced=pitch;
      while(voiced<60) voiced+=12;
      while(voiced>72) voiced-=12;
      return voiced;
    }).sort((first,second)=>first-second);
    const degreeBars=[],durationBars=[],rhythmTemplates=[],generationAttempts=[];
    let previousMidi=null;
    for(let barIndex=0;barIndex<barCount;barIndex++) {
      const templates=patternRhythmTemplates(signature);
      const requestedTemplate=balancedPatternValue(`chord-change-rhythm-${signature.id}`,templates);
      const templateCandidates=[requestedTemplate,...shuffle(templates.filter(template=>template.id!==requestedTemplate.id))];
      const chordClasses=degreeClassesForChord(key,barSymbols[barIndex]);
      const accompanimentCeiling=Math.max(...middleVoicing(key.chords[barSymbols[barIndex]]));
      let acceptedDegrees=null,acceptedDurations=null,acceptedTemplate=null,attempts=0;
      candidateSearch: for(const template of templateCandidates) for(let attempt=0;attempt<64;attempt++) {
        attempts++;
        const durations=[...template.durations];
        const degrees=motifForTemplate(template,choose([0,1,2,3,4,5,6]));
        const strongBeats=strongBeatOffsets(signature);
        let beat=0,firstSounding=true;
        const aligned=degrees.map((degree,index)=>{
          const startsStrong=degree!==null&&strongBeats.some(strongBeat=>Math.abs(beat-strongBeat)<0.001);
          const adjusted=degree!==null&&(startsStrong||firstSounding) ? nearestDegreeInClasses(degree,chordClasses) : degree;
          if(degree!==null) firstSounding=false;
          beat+=durations[index];
          return adjusted;
        });
        if(barIndex===barCount-1) {
          const finalIndex=aligned.reduce((last,degree,index)=>degree===null?last:index,-1);
          aligned[finalIndex]=nearestDegreeInClasses(aligned[finalIndex],[0]);
        }
        if(new Set(aligned.filter(degree=>degree!==null)).size<3) continue;
        const shifts=Array.from({length:13},(_,index)=>(index-6)*7).filter(shift=>{
          const pitches=aligned.filter(degree=>degree!==null).map(degree=>degreeMidi(key,degree+shift));
          if(!pitches.every(midi=>midi>=MELODY_MIN_MIDI&&midi<=MELODY_MAX_MIDI)) return false;
          if(!pitches.every(midi=>midi>accompanimentCeiling)) return false;
          if(previousMidi!==null&&Math.abs(pitches[0]-previousMidi)>7) return false;
          return pitches.slice(1).every((midi,index)=>Math.abs(midi-pitches[index])<=7);
        });
        if(!shifts.length) continue;
        const openingDegree=aligned.find(degree=>degree!==null);
        const registerShift=shifts.sort((first,second)=>{
          const firstOpening=degreeMidi(key,openingDegree+first);
          const secondOpening=degreeMidi(key,openingDegree+second);
          const firstScore=previousMidi===null?Math.abs(firstOpening-69):Math.abs(firstOpening-previousMidi);
          const secondScore=previousMidi===null?Math.abs(secondOpening-69):Math.abs(secondOpening-previousMidi);
          return firstScore-secondScore;
        })[0];
        acceptedDegrees=aligned.map(degree=>degree===null?null:degree+registerShift);
        acceptedDurations=durations;
        acceptedTemplate=template;
        break candidateSearch;
      }
      if(!acceptedDegrees) {
        const fallbackDurations=signature.id==="2/4"?[.5,.5,.5,.5]:signature.id==="4/4"?[1,1,1,1]:[.5,.5,1,1];
        const chordDegree=chordClasses[0];
        acceptedDegrees=[chordDegree,chordDegree+1,chordDegree+2,barIndex===barCount-1?0:chordDegree].slice(0,fallbackDurations.length);
        acceptedDurations=fallbackDurations;
        acceptedTemplate={id:"fallback"};
      }
      degreeBars.push(acceptedDegrees);
      durationBars.push(acceptedDurations);
      rhythmTemplates.push({requested:requestedTemplate.id,accepted:acceptedTemplate.id});
      generationAttempts.push(attempts);
      previousMidi=degreeMidi(key,acceptedDegrees.filter(degree=>degree!==null).at(-1));
    }
    const segmentBars = barSymbols.map(symbol=>[{beat:0,beats:signature.beats,pitches:middleVoicing(key.chords[symbol]),volume:1.15}]);
    const passage = makePassage({
      barCount, fullPassage:false, signature, progression:barSymbols, degreeBars, durationBars,
      segmentBars, silentAccompaniment:true, style:"block_chords",
    });
    passage.bars=passage.bars.map((bar,barIndex)=>({
      ...bar,
      accompaniment:onsetBars.includes(barIndex) ? [{
        beat:0,
        beats:((onsetBars[onsetBars.indexOf(barIndex)+1]??barCount)-barIndex)*signature.beats,
        pitches:[...bar.accompanimentHarmony[0].pitches],
        volume:1.15,
      }] : [],
    }));
    passage.bars.forEach(bar=>bar.notes.forEach((note,index,notes)=>{
      if(index<notes.length-1&&!note.rest&&!notes[index+1].rest&&note.relativeStep===notes[index+1].relativeStep&&Math.random()<0.25) {
        note.tieToNext=true;
        notes[index+1].tiedFromPrevious=true;
      }
    }));
    passage.notes=passage.bars.flatMap(bar=>bar.notes.map(note=>({...note,beat:bar.barIndex*signature.beats+note.beat})));
    passage.melodyPlan={validation:{accepted:true},bars:passage.bars.map(bar=>({chordSymbol:bar.chordSymbol,notes:bar.notes.map(note=>({...note}))}))};
    passage.chordChangeCount=changeCount;
    passage.chordOnsetBars=onsetBars.map(barIndex=>barIndex+1);
    passage.accompanimentRange="C4-C5";
    passage.melodySource="shared-harmony-aware-planner";
    passage.melodyHarmonyFitted=true;
    passage.melodyRegisterPlanned=true;
    passage.melodyRhythmTemplates=rhythmTemplates;
    passage.melodyGenerationAttempts=generationAttempts;
    passage.melodyEndsOnTonic=true;
    passage.melodyCadence=changeCount>1?"perfect":"tonic-prolongation";
    return passage;
  }

  function makeN4AnacrusisPassage(hasPickup) {
      const signature=generationContext?.signature || SIGNATURES["4/4"];
      const phrase=enforceMelodyRange(makePassage({barCount:4,fullPassage:false,signature,progression:["I","IV","V","I"],style:"pulse-chords",silentAccompaniment:true}));
      phrase.bars=phrase.bars.map(bar=>({...bar,notes:bar.notes.map(note=>{
        if(note.rest) return note;
        let degree=note.relativeStep;
        while(degree<-1) degree+=7;
        while(degree>7) degree-=7;
        return {...note,relativeStep:degree};
      })}));
      const degrees=phrase.bars.flatMap(bar=>bar.notes.filter(note=>!note.rest).map(note=>note.relativeStep));
      const tonic=[-12,0,12,24].map(shift=>phrase.key.tonic+shift).filter(candidate=>candidate-1>=MELODY_MIN_MIDI&&candidate+4<=MELODY_MAX_MIDI&&degrees.every(degree=>{
        const midi=degreeMidi({...phrase.key,tonic:candidate},degree);return midi>=MELODY_MIN_MIDI&&midi<=MELODY_MAX_MIDI;
      })).sort((a,b)=>Math.abs(a-phrase.key.tonic)-Math.abs(b-phrase.key.tonic))[0];
      if(tonic===undefined) throw new Error("Unable to fit the anacrusis phrase in the melody register.");
      const pulse=signature.pulseQuarterBeats;
      const raise=pitch=>{while(pitch<45)pitch+=12;return pitch;};
      phrase.bars=phrase.bars.map((bar,index)=>{
        const chord=phrase.key.chords[bar.chordSymbol];
        return {...bar,keyId:phrase.key.id,
          notes:index===3?notesFrom([0],[signature.beats],{...phrase.key,tonic},"anacrusis-close"):bar.notes.map(note=>note.rest?{...note}:{...note,midi:degreeMidi({...phrase.key,tonic},note.relativeStep),soundingMidi:degreeMidi({...phrase.key,tonic},note.relativeStep)}),
          accompanimentHarmony:[{beat:0,beats:signature.beats,pitches:[...chord],chordSymbol:bar.chordSymbol}],
          accompaniment:index===3
            ? [{beat:0,beats:signature.beats,pitches:chord.map(raise),volume:.85,role:"harmony"}]
            : Array.from({length:signature.pulseCount},(_,index)=>({beat:index*pulse,beats:pulse*.88,pitches:chord.map(raise),volume:index===0?.85:.65,role:"harmony"})),
          generatedAccompaniment:false,
        };
      });
      const options=signature.type==="compound"
        ? [{degrees:[-1],durations:[.5]},{degrees:[1,-1],durations:[.5,.5]},{degrees:[1,0,-1],durations:[.5,.5,.5]},{degrees:[1,-1],durations:[1,.5]},{degrees:[-1],durations:[1.5]},{degrees:[2,1,0,-1],durations:[.5,.5,.5,.5]}]
        : [{degrees:[-1],durations:[.5]},{degrees:[-1],durations:[1]},{degrees:[1,-1],durations:[.5,.5]},
          ...(signature.beats>2?[{degrees:[1,-1],durations:[1,1]},{degrees:[2,1,-1],durations:[1,.5,.5]},{degrees:[1,2,-1],durations:[.5,.5,1]},{degrees:[2,1,0,-1],durations:[.5,.5,.5,.5]}]:[])];
      const pickup=hasPickup?balancedPatternValue(`n4-pickup-${signature.id}`,options):null;
      const pickupBeats=pickup?pickup.durations.reduce((sum,beats)=>sum+beats,0):0;
      const pickupPulses=[];
      for(let distance=signature.pulseQuarterBeats;distance<=pickupBeats;distance+=signature.pulseQuarterBeats) pickupPulses.unshift(pickupBeats-distance);
      const pickupKey={...phrase.key,tonic:phrase.bars[0].notes[0].soundingMidi};
      const bars=phrase.bars.map((bar,index)=>({...bar,barIndex:index+(hasPickup?1:0),phraseBarIndex:index,startBeat:pickupBeats+index*signature.beats,
        notes:bar.notes.map((note,noteIndex)=>({...note,volume:index===0&&noteIndex===0?.9:note.volume})),
        accompaniment:bar.accompaniment.map(event=>({...event,volume:index===0&&event.beat===0?event.volume*1.12:event.volume})),
      }));
      if(pickup) bars.unshift({barIndex:0,isPickup:true,beats:pickupBeats,startBeat:0,chordSymbol:"V",keyId:phrase.key.id,
        notes:notesFrom(pickup.degrees,pickup.durations,pickupKey,"n4-upbeat").map(note=>({...note,volume:.72})),
        accompaniment:[],accompanimentHarmony:[],generatedAccompaniment:false,
        // A shorter subdivision starts between clicks, never on an invented beat.
        pulseOffsets:pickupPulses,pulseAccents:pickupPulses.map(()=>false),
      });
      return {...phrase,bars,barCount:bars.length,totalBeats:4*signature.beats+pickupBeats,
        notes:bars.flatMap(bar=>bar.notes.map(note=>({...note,beat:bar.startBeat+note.beat}))),
        phraseBarCount:4,pickupBeats,hasPickup,pickupSourceTimeSignature:signature.id,
      };
  }

  function buildAnacrusis(answerId,{level}={}) {
    if(["N4","H"].includes(level)) return makeN4AnacrusisPassage(answerId==="anacrusis-yes");
    const hasPickup = answerId === "anacrusis-yes";
    const passage = makePassage({});
    if (hasPickup) {
      const firstBar=passage.bars[0];
      const sourceNote=firstBar.notes.find(note=>!note.rest) || firstBar.notes[0];
      const dominant=[...passage.key.chords.V];
      const sourceMidi=sourceNote.soundingMidi ?? sourceNote.midi;
      const pickupMidi=dominant.flatMap(midi=>[midi,midi+12,midi+24,midi+36])
        .filter(midi=>midi>=MELODY_MIN_MIDI&&midi<=MELODY_MAX_MIDI)
        .sort((first,second)=>Math.abs(first-sourceMidi)-Math.abs(second-sourceMidi))[0];
      firstBar.notes=[{...sourceNote,id:"ear-pickup",midi:pickupMidi,soundingMidi:pickupMidi,beat:3,beats:1,rest:false}];
      firstBar.accompanimentHarmony=[{beat:3,beats:1,pitches:[...passage.key.chords.V]}];
      firstBar.generatedAccompaniment=false;
      firstBar.accompaniment=[{beat:3,beats:.88,pitches:[...passage.key.chords.V],volume:.9}];
      passage.notes = passage.bars.flatMap(bar=>bar.notes.map(note=>({...note,beat:bar.barIndex*passage.timeSignature.beats+note.beat})));
    }
    return passage;
  }

  function buildModulation(answerId, { level } = {}) {
    if(["N4","N5","H","AH"].includes(level)) return makeN4HarmonicPassage("changeOfKey",["change-key-yes","modulation-yes"].includes(answerId));
    const modulates = ["change-key-yes", "modulation-yes"].includes(answerId);
    const available = new Set(LEVEL_KEYS[level] || LEVEL_KEYS.N5);
    const start = generationContext?.keyName || [...available][0] || "C";
    const destinations = { C:"G", G:"C", F:"C", Am:"C", D:"G", Bb:"F", Em:"G", Dm:"F" };
    const preferredDestination = destinations[start];
    const destination = KEYS[preferredDestination] ? preferredDestination : [...available].find(keyName=>keyName!==start) || start;
    const keyNames = [...Array(8).fill(start), ...Array(8).fill(modulates ? destination : start)];
    return makePassage({ keyNames, progression:["I","IV","V","I","VI","IV","V","I","I","IV","V","I","VI","IV","V","I"] });
  }

  function makeJazzWalkingPassage() {
    // This stylistic example requires a four-beat walking pulse and beat-4 approaches.
    if(generationContext)generationContext.signature={...SIGNATURES["4/4"]};
    const signature={...SIGNATURES["4/4"]},keyId=generationContext?.keyName||"C",original=KEYS[keyId],minor=keyId.endsWith("m");
    let tonic=original.tonic;while(tonic<60)tonic+=12;while(tonic>71)tonic-=12;
    const chord=(root,intervals)=>intervals.map(interval=>original.tonic+root+interval-12);
    const jazz=minor?{
      i6:chord(0,[0,3,7,9]),VImaj7:chord(8,[0,4,7,11]),iiHalfDim7:chord(2,[0,3,6,10]),V7:chord(7,[0,4,7,10]),iv7:chord(5,[0,3,7,10]),
    }:{Imaj7:chord(0,[0,4,7,11]),VI7:chord(9,[0,4,7,10]),ii7:chord(2,[0,3,7,10]),V7:chord(7,[0,4,7,10]),vi7:chord(9,[0,3,7,10]),I6:chord(0,[0,4,7,9])};
    const key={...original,chords:{...original.chords,...jazz}};
    const ii=minor?"iiHalfDim7":"ii7",final=minor?"i6":"I6";
    const progression=minor?["i6","VImaj7",ii,"V7","i6","iv7",ii,final]:["Imaj7","VI7",ii,"V7","Imaj7","vi7",ii,final];
    const pulse=signature.pulseQuarterBeats,split=Math.ceil(signature.pulseCount/2)*pulse;
    const segmentBars=progression.map((symbol,index)=>index===6?[{beat:0,beats:split,chordSymbol:ii,pitches:jazz[ii]},{beat:split,beats:signature.beats-split,chordSymbol:"V7",pitches:jazz.V7}]:[{beat:0,beats:signature.beats,chordSymbol:symbol,pitches:jazz[symbol]}]);
    const pc=pitch=>((pitch%12)+12)%12;
    const events=segmentBars.flatMap((segments,barIndex)=>Array.from({length:4},(_,i)=>{
      const beat=i,segment=[...segments].reverse().find(s=>s.beat<=beat);
      return {barIndex,beat,beats:1,segment,root:pc(segment.pitches[0]),forced:segments.some(s=>s.beat===beat)||(barIndex===7&&i===3),approach:barIndex<7&&i===3};
    }));
    const keyClasses=new Set(key.scale.map(interval=>pc(original.tonic+interval)));
    let paths=[{pitch:null,cost:0,notes:[]}];
    for(let index=0;index<events.length;index++) {
      const event=events[index],nextEvent=events[index+1],classes=new Set(event.segment.pitches.map(pc));
      const approach=event.approach;
      const candidates=Array.from({length:12},(_,i)=>i+45).filter(pitch=>event.forced?pc(pitch)===event.root:approach?[1,11].includes((pc(pitch)-nextEvent.root+12)%12):keyClasses.has(pc(pitch))||classes.has(pc(pitch)));
      const next=[];
      for(const pitch of candidates) {
        const ranked=paths.flatMap(previous=>{
          const distance=previous.pitch===null?0:Math.abs(pitch-previous.pitch);
          if(previous.pitch!==null&&(distance>7||distance===0&&!event.forced||(events[index-1]?.approach&&distance!==1)))return [];
          const stepCost=distance<=2?0:12+(distance>5?.5:0);
          const chordCost=classes.has(pc(pitch))?0:1;
          return [{pitch,cost:previous.cost+stepCost+chordCost+distance*.1+Math.random()*.6,notes:[...previous.notes,pitch]}];
        }).sort((a,b)=>a.cost-b.cost);
        if(ranked.length)next.push(ranked[0]);
      }
      paths=next;
    }
    if(!paths.length)throw new Error("Unable to connect jazz walking bass roots.");
    paths.sort((a,b)=>a.cost-b.cost);const line=paths[0].notes;
    const scaffold=makeN4ScalePassage({answerId:minor?"scale-minor":"scale-major",keyId,tonicMidi:tonic,signature});
    const voicingIntervals=minor?{i6:[3,7,9,14],VImaj7:[4,7,11,14],iiHalfDim7:[3,6,10,17],V7:[4,10,13,19],iv7:[3,7,10,14]}:{Imaj7:[4,7,11,14],VI7:[4,10,14,21],ii7:[3,7,10,14],V7:[4,10,14,21],vi7:[3,7,10,14],I6:[4,7,9,14]};
    const bluesIntervals=[0,3,5,6,7,10];
    const bluesClasses=new Set(bluesIntervals.map(interval=>pc(tonic+interval)));
    let previousVoicing=null,previousLead=tonic+12;
    const heads=[
      [{rest:true,beats:.5},{beats:1},{rest:true,beats:.5},{beats:.5},{beats:.5},{rest:true,beats:1}],
      [{rest:true,beats:.5},{beats:1.5},{rest:true,beats:.5},{beats:.5},{beats:.5},{rest:true,beats:.5}],
      [{beats:.5},{rest:true,beats:.5},{beats:1},{rest:true,beats:.5},{beats:1},{rest:true,beats:.5}],
    ];
    const phraseRhythms=[choose(heads),choose(heads),choose(heads),[{rest:true,beats:1},{beats:1},{beats:1},{rest:true,beats:1}]];
    const contours=Array.from({length:4},()=>choose([[0,3,2,5],[0,-2,1,-3],[0,2,4,1]]));
    const swing=beat=>Math.floor(beat)+(beat%1<=.5?(beat%1)*4/3:2/3+((beat%1)-.5)*2/3);
    const bars=scaffold.bars.map((bar,index)=>{
      const segments=segmentBars[index];
      const bass=events.flatMap((event,i)=>event.barIndex===index?[{beat:event.beat,beats:.9,pitches:[line[i]],volume:(.078*.82)/.018,role:"bass-pattern",chromaticApproach:event.approach}]:[]);
      const voiced=segments.map(segment=>{
        const classes=voicingIntervals[segment.chordSymbol].map(interval=>pc(segment.pitches[0]+interval));
        const pools=classes.map(cls=>Array.from({length:15},(_,i)=>i+58).filter(pitch=>pc(pitch)===cls));
        let candidates=[[]];for(const pool of pools)candidates=candidates.flatMap(path=>pool.map(pitch=>[...path,pitch]));
        candidates=candidates.map(pitches=>pitches.sort((a,b)=>a-b)).filter(pitches=>new Set(pitches).size===4&&pitches[3]-pitches[0]<=12);
        candidates.sort((a,b)=>a.reduce((sum,pitch,i)=>sum+Math.abs(pitch-(previousVoicing?.[i]??[58,62,65,69][i])),0)-b.reduce((sum,pitch,i)=>sum+Math.abs(pitch-(previousVoicing?.[i]??[58,62,65,69][i])),0));
        const pitches=candidates[0];previousVoicing=pitches;
        return {...segment,voicingPitches:pitches,voicing:"rootless"};
      });
      const template=index===7?[{beats:2},{rest:true,beats:2}]:phraseRhythms[index%4];
      let straightBeat=0,noteIndex=0,soundingIndex=0,anchor=null;
      const notes=template.map((event,eventIndex)=>{
        const beat=swing(straightBeat),end=swing(straightBeat+event.beats);straightBeat+=event.beats;
        if(event.rest)return {id:`jazz-rest-${index}-${noteIndex++}`,barIndex:index,beat,beats:end-beat,rest:true,midi:0,soundingMidi:0,volume:.82};
        const segment=[...voiced].reverse().find(s=>s.beat<=beat);
        const floor=Math.max(72,Math.max(...segment.voicingPitches)+1,Math.max(...bass.flatMap(e=>e.pitches))+3);
        const chordClasses=new Set(segment.pitches.map(pc));
        const guides=new Set([segment.pitches[1],segment.pitches[3]].map(pc));
        const offbeat=beat%1>1e-8;
        const classes=offbeat?new Set(bluesClasses):new Set([...bluesClasses].filter(cls=>chordClasses.has(cls)).concat([...guides]));
        const hasFollowingNote=template.slice(eventIndex+1).some(event=>!event.rest);
        let candidates=Array.from({length:13},(_,i)=>i+72).filter(pitch=>pitch>=floor&&classes.has(pc(pitch))&&(pc(pitch)!==pc(tonic+6)||hasFollowingNote));
        if(index===7)candidates=candidates.filter(pitch=>pc(pitch)===pc(tonic));
        const openingTarget=index===0?tonic+12:previousLead;
        if(anchor===null)anchor=[...candidates].sort((a,b)=>Math.abs(a-openingTarget)-Math.abs(b-openingTarget))[0];
        const reference=anchor+contours[index%4][soundingIndex%4];
        if(soundingIndex>0&&candidates.length>1)candidates=candidates.filter(pitch=>pitch!==previousLead);
        if(pc(previousLead)===pc(tonic+6)) {
          const resolutions=candidates.filter(pitch=>[pc(tonic+5),pc(tonic+7)].includes(pc(pitch))&&Math.abs(pitch-previousLead)<=2);
          if(resolutions.length)candidates=resolutions;
        }
        const cost=pitch=>Math.abs(pitch-reference)+(bluesClasses.has(pc(pitch))?0:2);
        const midi=candidates.sort((a,b)=>cost(a)-cost(b))[0];previousLead=midi;soundingIndex++;
        return {id:`jazz-head-${index}-${noteIndex++}`,barIndex:index,beat,beats:end-beat,midi,soundingMidi:midi,scaleDegree:null,relativeStep:null,volume:.82,gate:.9};
      });
      const harmony=voiced.flatMap(segment=>{
        const end=segment.beat+segment.beats;
        const onsets=[segment.beat+2/3,segment.beat+2+2/3].filter(at=>at<end-1e-8);
        return onsets.map((beat,i)=>({beat,beats:Math.min(.24,end-beat),staccato:true,offbeat:true,pitches:segment.voicingPitches,volume:.8/Math.sqrt(4),role:"bass-pattern-harmony",voicing:"rootless",chordSymbol:segment.chordSymbol}));
      });
      return {...bar,chordSymbol:progression[index],notes,accompaniment:[...bass,...harmony].sort((a,b)=>a.beat-b.beat),accompanimentHarmony:voiced,generatedAccompaniment:false};
    });
    let jazzTripletCount=0,jazzAcciaccaturaCount=0;
    const decoration=balancedPatternValue("jazz-head-decoration",["none","none","triplet","acciaccatura"]);
    if(decoration==="triplet") {
      const choices=bars.slice(0,7).flatMap((bar,barIndex)=>bar.notes.flatMap((note,noteIndex)=>!note.rest&&Math.abs(note.beats-1)<1e-8&&Math.abs(note.beat%1)<1e-8?[{barIndex,noteIndex,note}]:[]));
      const chosen=choose(choices);
      if(chosen) {
        const bar=bars[chosen.barIndex],main=chosen.note;
        const floor=Math.max(72,...bar.accompaniment.filter(e=>e.role==="bass-pattern-harmony").flatMap(e=>e.pitches.map(p=>p+1)));
        const neighbours=Array.from({length:13},(_,i)=>i+72).filter(pitch=>pitch>=floor&&pitch!==main.midi&&bluesClasses.has(pc(pitch))).sort((a,b)=>Math.abs(a-main.midi)-Math.abs(b-main.midi));
        const neighbour=choose(neighbours.slice(0,2));
        if(neighbour!==undefined) {
          const pitches=[main.midi,neighbour,main.midi];
          bar.notes=bar.notes.flatMap((note,i)=>i===chosen.noteIndex?pitches.map((midi,j)=>({...note,id:`${note.id}-triplet-${j}`,beat:note.beat+j/3,beats:1/3,midi,soundingMidi:midi,jazzTriplet:true,jazzTripletGroup:note.id})): [note]);
          jazzTripletCount=1;
        }
      }
    }
    if(decoration==="acciaccatura") {
      const choices=bars.slice(0,7).flatMap((bar,barIndex)=>bar.notes.flatMap((note,noteIndex)=>!note.rest&&!note.jazzTriplet&&note.beats>=2/3-1e-8?[{barIndex,noteIndex,note}]:[]));
      const chosen=choose(choices);
      if(chosen) {
        const bar=bars[chosen.barIndex],main=chosen.note;
        const floor=Math.max(72,...bar.accompaniment.filter(e=>e.role==="bass-pattern-harmony").flatMap(e=>e.pitches.map(p=>p+1)));
        const neighbours=[main.midi-1,main.midi+1].filter(midi=>midi>=floor&&midi<=84);
        const grace=choose(neighbours);
        if(grace!==undefined) {
          const graceBeats=.06;
          bar.notes=bar.notes.flatMap((note,i)=>i===chosen.noteIndex?[
            {...note,id:`${note.id}-grace`,beats:graceBeats,midi:grace,soundingMidi:grace,jazzAcciaccatura:true,graceMainMidi:note.midi},
            {...note,beat:note.beat+graceBeats,beats:note.beats-graceBeats,jazzGraceResolution:true},
          ]:[note]);
          jazzAcciaccaturaCount=1;
        }
      }
    }
    const passage=synchroniseMelodyPlan({...scaffold,key,bars,notes:bars.flatMap(bar=>bar.notes.filter(note=>!note.rest).map(note=>({...note,beat:bar.barIndex*signature.beats+note.beat}))),bassPatternStudy:true,bassPatternId:"bass-walking",bassExcerptBars:8,bassPatternStep:pulse,bassJazzHarmony:true,bassJazzSwing:true,bassJazzSwingRatio:[2,1],jazzTripletCount,jazzAcciaccaturaCount,jazzLeadBluesIntervals:bluesIntervals,jazzLeadBluesTonic:pc(tonic),bassJazzVoicing:"rootless",bassBeatFourApproaches:true,bassJazzProgression:segmentBars.map(segments=>segments.map(s=>s.chordSymbol)),tempoPulseBeats:pulse,accompanimentPattern:"walking_bass"});
    const isolated=isolatePassage(passage,{barIndexes:[0,1],melody:false,accompaniment:true});
    isolated.bars=isolated.bars.map(bar=>({...bar,accompaniment:bar.accompaniment.filter(e=>e.role==="bass-pattern"),accompanimentHarmony:[]}));
    return {...passage,isolatedPassage:synchroniseMelodyPlan(isolated)};
  }

  function makeGroundBassPassage() {
    const signature=generationContext?.signature||SIGNATURES["4/4"],keyId=generationContext?.keyName||"C",key=KEYS[keyId];
    let tonic=key.tonic;while(tonic<60)tonic+=12;while(tonic>71)tonic-=12;
    let bassTonic=key.tonic;while(bassTonic<45)bassTonic+=12;while(bassTonic>=57)bassTonic-=12;
    const bassMidi=degree=>degreeMidi({...key,tonic:bassTonic},degree);
    const pulse=signature.pulseQuarterBeats,count=signature.pulseCount;
    // Every cycle already ends dominant–tonic. The final repetition needs
    // no altered notes, rhythm, extra bass attack or separate cadence bars.
    const cycle=choose(count===2?[[0,2,4,0],[0,3,4,0]]:count===3?[[0,2,4,3,4,0],[0,4,2,1,4,0]]:[[0,2,4,2,3,1,4,0],[0,4,2,0,5,1,4,0]]);
    const figures=[cycle.slice(0,count),cycle.slice(count)];
    const scaffold=makeN4ScalePassage({answerId:keyId.endsWith("m")?"scale-minor":"scale-major",keyId,tonicMidi:tonic,signature});
    const rhythmStyle=balancedPatternValue("ground-rhythm-style",["even","dotted","rest"]);
    const bars=scaffold.bars.map((bar,index)=>{
      const figure=figures[index%2];
      const bass=figure.map((degree,i)=>{
        let beat=i*pulse,duration=pulse;
        if(index%2===0&&rhythmStyle==="dotted"&&i<2) {
          beat=i===0?0:1.5*pulse;duration=i===0?1.5*pulse:.5*pulse;
        } else if(index%2===0&&rhythmStyle==="rest"&&i===0) {
          beat=.5*pulse;duration=.5*pulse;
        }
        return {beat,beats:duration*.9,pitches:[bassMidi(degree)],volume:(.078*.82)/.018,role:"bass-pattern",scaleDegree:degree};
      });
      const segments=figure.map((degree,i)=>{
        const position=(index%2)*count+i;
        const available=["I","IV","V","VI"].filter(symbol=>degreeClassesForChord(key,symbol).includes(degree));
        const symbol=position===cycle.length-1?"I":position===cycle.length-2?"V":index===0&&i===0?"I":available[(Math.floor(index/2)+i)%available.length];
        const beat=index%2===0&&rhythmStyle==="dotted"&&i===1?1.5*pulse:i*pulse;
        const beats=index%2===0&&rhythmStyle==="dotted"&&i<2?(i===0?1.5:.5)*pulse:pulse;
        return {beat,beats,pitches:[...key.chords[symbol]],chordSymbol:symbol};
      });
      const ceiling=Math.max(...bass.flatMap(e=>e.pitches))+3;
      const notes=bar.notes.flatMap(note=>segments.flatMap(segment=>{
        const beat=Math.max(note.beat,segment.beat),end=Math.min(note.beat+note.beats,segment.beat+segment.beats);
        if(end<=beat)return [];
        const candidates=Array.from({length:28},(_,i)=>i+57).filter(midi=>midi>=ceiling&&segment.pitches.some(pitch=>((midi-pitch)%12+12)%12===0));
        let midi=candidates.sort((a,b)=>Math.abs(a-note.midi)-Math.abs(b-note.midi))[0];
        if(index===7&&segment.beat>=signature.beats-2*pulse) {
          let arrival=tonic;while(arrival-1<=ceiling-3)arrival+=12;
          midi=segment.chordSymbol==="V"?arrival-1:arrival;
        }
        const degree=Array.from({length:29},(_,i)=>i-14).find(degree=>degreeMidi({...key,tonic},degree)===midi);
        return [{...note,barIndex:index,beat,beats:end-beat,midi,soundingMidi:midi,relativeStep:degree,scaleDegree:degree,volume:.82}];
      }));
      const harmony=segments.map(segment=>({beat:segment.beat,beats:segment.beats*.9,pitches:segment.pitches.map(pitch=>{while(pitch<57)pitch+=12;return pitch;}),volume:.25/Math.sqrt(3),role:"bass-pattern-harmony"}));
      return {...bar,barIndex:index,chordSymbol:segments[0].chordSymbol,notes,accompaniment:[...bass,...harmony].sort((a,b)=>a.beat-b.beat),accompanimentHarmony:segments,generatedAccompaniment:false};
    });
    const passage=synchroniseMelodyPlan({...scaffold,key,bars,barCount:8,totalBeats:8*signature.beats,notes:bars.flatMap(bar=>bar.notes.map(note=>({...note,beat:bar.barIndex*signature.beats+note.beat}))),bassPatternStudy:true,bassPatternId:"bass-ground",bassExcerptBars:8,bassPatternStep:pulse,bassGroundFigures:figures,bassGroundRepeatBars:Array.from({length:8},(_,i)=>i),bassGroundCycleClosesOnTonic:true,bassGroundRhythmStyle:rhythmStyle,tempoPulseBeats:pulse,accompanimentPattern:"ground_bass"});
    const isolated=isolatePassage(passage,{barIndexes:[0,1],melody:false,accompaniment:true});
    isolated.bars=isolated.bars.map(bar=>({...bar,accompaniment:bar.accompaniment.filter(e=>e.role==="bass-pattern"),accompanimentHarmony:[]}));
    return {...passage,isolatedPassage:synchroniseMelodyPlan(isolated)};
  }

  function makeAlbertiBassPassage() {
    const signature=generationContext?.signature||SIGNATURES["4/4"],keyId=generationContext?.keyName||"C",key=KEYS[keyId];
    let tonic=key.tonic;while(tonic<60)tonic+=12;while(tonic>71)tonic-=12;
    const scaffold=makeN4ScalePassage({answerId:keyId.endsWith("m")?"scale-minor":"scale-major",keyId,tonicMidi:tonic,signature});
    const progression=["I","IV","V","I","VI","IV","V","I"],count=Math.round(signature.beats/.5);
    const choices=progression.map((symbol,index)=>{
      const chord=key.chords[symbol];let root=chord[0];while(root<50)root+=12;while(root>=62)root-=12;
      return [root,root+12].filter(root=>root<=67).map(root=>{
        const cell=[root,root+((chord[2]-chord[0]+12)%12),root+((chord[1]-chord[0]+12)%12),root+((chord[2]-chord[0]+12)%12)];
        const pitches=index===7?[root]:Array.from({length:count},(_,i)=>cell[(index*count+i)%4]);
        return {root,pitches};
      });
    });
    let paths=[{last:60,cost:0,choices:[]}];
    for(const options of choices) {
      paths=options.map(option=>paths.map(previous=>({last:option.pitches.at(-1),cost:previous.cost+Math.abs(option.pitches[0]-previous.last)+Math.max(0,option.root-60)*.05,choices:[...previous.choices,option]})).sort((a,b)=>a.cost-b.cost)[0]);
    }
    paths.sort((a,b)=>a.cost-b.cost);const registers=paths[0].choices;
    const bars=scaffold.bars.map((bar,index)=>{
      const symbol=progression[index],chord=key.chords[symbol];
      const bass=registers[index].pitches.map((pitch,i)=>({beat:i*.5,beats:index===7?signature.beats*.96:.45,pitches:[pitch],volume:(.078*.82)/.018,role:"bass-pattern"}));
      const ceiling=Math.max(...bass.flatMap(e=>e.pitches))+3;
      const notes=bar.notes.map(note=>{
        const candidates=Array.from({length:28},(_,i)=>i+57).filter(midi=>midi>=ceiling&&chord.some(pitch=>((midi-pitch)%12+12)%12===0));
        const midi=candidates.sort((a,b)=>Math.abs(a-note.midi)-Math.abs(b-note.midi))[0];
        const degree=Array.from({length:29},(_,i)=>i-14).find(degree=>degreeMidi({...key,tonic},degree)===midi);
        return {...note,midi,soundingMidi:midi,relativeStep:degree,scaleDegree:degree,volume:.82};
      });
      const harmony={beat:0,beats:signature.beats*.9,pitches:chord.map(pitch=>{while(pitch<57)pitch+=12;return pitch;}),volume:.25/Math.sqrt(3),role:"bass-pattern-harmony"};
      return {...bar,chordSymbol:symbol,notes,accompaniment:[...bass,harmony].sort((a,b)=>a.beat-b.beat),accompanimentHarmony:[{beat:0,beats:signature.beats,pitches:chord}],generatedAccompaniment:false};
    });
    const passage=synchroniseMelodyPlan({...scaffold,key,bars,notes:bars.flatMap(bar=>bar.notes.map(note=>({...note,beat:bar.barIndex*signature.beats+note.beat}))),bassPatternStudy:true,bassPatternId:"bass-alberti",bassExcerptBars:8,bassPatternStep:.5,bassAlbertiRoots:registers.map(r=>r.root),bassAlbertiRegisterPlanned:true,tempoPulseBeats:signature.pulseQuarterBeats,accompanimentPattern:"alberti_bass"});
    const isolated=isolatePassage(passage,{barIndexes:[0,1],melody:false,accompaniment:true});
    isolated.bars=isolated.bars.map(bar=>({...bar,accompaniment:bar.accompaniment.filter(e=>e.role==="bass-pattern"),accompanimentHarmony:[]}));
    return {...passage,isolatedPassage:synchroniseMelodyPlan(isolated)};
  }

  function makeN5BassPassage(answerId) {
    const passage=answerId==="bass-walking"?makeJazzWalkingPassage():answerId==="bass-ground"?makeGroundBassPassage():makeAlbertiBassPassage();
    // Keep the requested equal gain, but prevent natural piano release tails
    // from accumulating over the faster repeated bass patterns.
    const articulate=content=>({...content,bassReleaseControlled:true,bars:content.bars.map(bar=>({...bar,accompaniment:bar.accompaniment.map(event=>event.role==="bass-pattern"?{...event,gateRelease:true}:event)}))});
    return {...articulate(passage),isolatedPassage:articulate(passage.isolatedPassage)};
  }

  function buildBassPattern(answerId,{level}={}) {
    if(level==="N5")return makeN5BassPassage(answerId);
    const style = answerId === "bass-walking" ? "walking_bass" : answerId === "bass-alberti" ? "alberti_bass" : "ground_bass";
    if (style !== "ground_bass") return makePassage({ style });
    const key = KEYS[generationContext?.keyName || "C"];
    const root = key.chords.I[0] - 12;
    const figure = [root,root+7,root+4,root+7];
    const segmentBars = Array.from({length:4},()=>[{beat:0,beats:4,pitches:key.chords.I}]);
    const passage = makePassage({ segmentBars, progression:["I"], silentAccompaniment:true, style });
    passage.bars = passage.bars.map((bar,barIndex)=>({
      ...bar,
      accompaniment: [
        ...figure.map((midi,beat)=>({beat,beats:.88,pitches:[midi],volume:1.5})),
        {beat:0,beats:3.8,pitches:key.chords.I,volume:.65},
      ],
    }));
    return { ...passage, notes:passage.bars.flatMap(bar=>bar.notes) };
  }

  let tierceSerial = 0;
  const tierceMelodySignatures = new Set();
  function buildTierce(answerId, { level } = {}) {
    const serial = tierceSerial++;
    const keyNames = level === "AH" ? ["Am","Dm","Em"] : ["Am"];
    const finalShapes = [
      { id:"cadential-resolution", offsets:[2,"third",0], durations:[1,1,2] },
      { id:"rising-cadence", offsets:[0,2,"third",7,0], durations:[.5,.5,1,1,1] },
      { id:"stepwise-turn", offsets:[2,"third",2,0], durations:[1,1,1,1] },
      { id:"held-resolution", offsets:["third",0], durations:[1,3] },
      { id:"ascending-arpeggio", offsets:[0,"third",7,0], durations:[1,1,1,1] },
      { id:"upper-neighbour", offsets:["third",5,"third",2,0], durations:[.5,.5,.5,.5,2] },
    ];
    if(["H","AH"].includes(level)) return makeHigherTiercePassage(answerId,finalShapes[serial%finalShapes.length],serial);
    const styles = ["block_chords","broken_chords","piano_ballad","contemporary_pop","stride_piano","alberti_bass"];
    const keyName = keyNames[serial % keyNames.length];
    const key = KEYS[keyName];
    const finalShape = finalShapes[serial % finalShapes.length];
    const openingBarCount = 3 + serial%3;
    let melodySeed,melodyPlan,sourceBars,melodySignature,uniquenessAttempt=0;
    do {
      melodySeed = `tierce-${level}-${serial}-${answerId}-${uniquenessAttempt}`;
      melodyPlan = root.PracticeMelodyGenerator?.generateAdvancedHigherPlan({
        seed:melodySeed, cadenceId:"perfect", timeSignatureId:"4/4", allowRests:true,
      });
      sourceBars = melodyPlan
        ? melodyPlan.bars.slice(-(openingBarCount+1),-1)
        : Array.from({length:openingBarCount},(_,barIndex)=>({
            chordSymbol:barIndex===openingBarCount-1?"V":["I","IV","VI"][barIndex%3],
            notes:[0,1,2,3].map((relativeStep,noteIndex)=>({relativeStep:(relativeStep+serial+uniquenessAttempt+barIndex*2)%7,beats:1,rest:false,noteIndex})),
          }));
      melodySignature = JSON.stringify(sourceBars.map(bar=>bar.notes.map(note=>[note.rest?null:note.relativeStep,note.beats])));
      uniquenessAttempt++;
    } while(tierceMelodySignatures.has(melodySignature)&&uniquenessAttempt<64);
    tierceMelodySignatures.add(melodySignature);
    const openingBars = [...Array.from({length:14},(_,index)=>sourceBars[index%sourceBars.length]),sourceBars.at(-1)];
    const progression = [...openingBars.map(bar=>bar.chordSymbol||"I"),"I"];
    const degreeBars = [
      ...openingBars.map(bar=>bar.notes.map(note=>note.rest?null:note.relativeStep)),
      finalShape.offsets.map((_,index)=>index%5),
    ];
    const durationBars = [...openingBars.map(bar=>bar.notes.map(note=>note.beats)),finalShape.durations];
    const finalRoot = key.chords.I[0];
    const finalThird = finalRoot + (answerId === "tierce-yes" ? 4 : 3);
    const finalChord = [finalRoot,finalThird,finalRoot+7];
    const segmentBars = progression.map((symbol,barIndex)=>[{
      beat:0, beats:4,
      pitches:barIndex===progression.length-1 ? finalChord : key.chords[symbol],
      volume:barIndex===progression.length-1 ? 1.4 : 1,
    }]);
    const passage = makePassage({ barCount:progression.length, keyNames:[keyName], progression, degreeBars, durationBars, segmentBars, style:styles[serial%styles.length] });
    const finalBar = passage.bars.at(-1);
    finalBar.notes = finalBar.notes.map((note,index)=>{
      const offset = finalShape.offsets[index] === "third" ? finalThird-finalRoot : finalShape.offsets[index];
      const midi = key.tonic + offset;
      return { ...note, midi, soundingMidi:midi, tierceThird:index===finalShape.offsets.indexOf("third") };
    });
    passage.bars.slice(-2).forEach((bar,index)=>{
      const chord = bar.accompanimentHarmony[0].pitches;
      bar.generatedAccompaniment = false;
      bar.accompaniment = [{
        beat:0,
        beats:3.8,
        pitches:[...chord],
        volume:index===1 ? 1.4 : 1.2,
      }];
    });
    passage.bars.forEach(bar=>{
      bar.notes = bar.notes.map(note=>note.rest ? note : {
        ...note,
        midi:note.midi+12,
        soundingMidi:note.soundingMidi+12,
      });
      bar.accompanimentHarmony = bar.accompanimentHarmony.map(segment=>({
        ...segment,
        pitches:segment.pitches.map(midi=>midi+12),
      }));
      bar.accompaniment = bar.accompaniment.map(event=>({
        ...event,
        pitches:event.pitches.map(midi=>midi+12),
      }));
    });
    passage.notes = passage.bars.flatMap(bar=>bar.notes.map(note=>({...note,beat:bar.barIndex*4+note.beat})));
    passage.tierceVariant = {
      serial,keyName,melodySeed,melodyPlanAccepted:melodyPlan?.validation?.accepted===true,
      melodyPlanAttempt:melodyPlan?.attempt??null,uniquenessAttempt,progression:[...progression],
      style:styles[serial%styles.length],finalShape:finalShape.id,endingAccompaniment:"dominant-tonic-block-chords",melodyRegisterShift:12,accompanimentRegisterShift:12,
    };
    return passage;
  }

  const recentHigherHarmonicShapes=[];
  function makeHigherTiercePassage(answerId,shape,serial) {
    const keyId=balancedPatternValue("higher-tierce-key",["Am","Em","Dm"]);
    const approachStyle=balancedPatternValue("higher-tierce-cadence-rhythm",["held","repeated"]);
    const signature=generationContext?.signature||SIGNATURES["4/4"];
    const approachRhythm=approachStyle==="held"?[signature.beats]:signature.id==="3/4"?[1,1,1]:signature.id==="6/8"?[1.5,.5,1]:[signature.beats/2,signature.beats/4,signature.beats/4];
    const {cadenceStudy,isolatedPassage,...passage}=makeCadencePassage("perfect",{keyId,tierce:answerId==="tierce-yes",plainEnding:true,approachRhythm});
    const suspension=balancedPatternValue("higher-tierce-final-suspension",["none","none","none","none","none","none","second","fourth"]);
    if(suspension!=="none") {
      const final=passage.bars[7],tonicClass=((passage.key.tonic%12)+12)%12,third=answerId==="tierce-yes"?4:3;
      const delay=signature.pulseQuarterBeats;
      const suspended=pitches=>pitches.map(pitch=>((pitch-tonicClass)%12+12)%12===third?pitch+(suspension==="second"?2:5)-third:pitch);
      final.accompaniment=final.accompaniment.flatMap(event=>[
        {...event,beat:0,beats:delay*.96,pitches:event.role==="cadence-chord"?suspended(event.pitches):event.pitches,gateRelease:true},
        {...event,beat:delay,beats:(signature.beats-delay)*.96,gateRelease:true},
      ]).sort((a,b)=>a.beat-b.beat);
      const resolved=final.accompanimentHarmony[0];
      final.accompanimentHarmony=[{...resolved,beat:0,beats:delay,pitches:suspended(resolved.pitches)},{...resolved,beat:delay,beats:signature.beats-delay}];
      passage.bars[7]=final;
    }
    return {...passage,harmonicExcerptBars:8,harmonicDevice:"tiercePicardie",harmonicDevicePresent:answerId==="tierce-yes",
      tierceVariant:{finalSuspension:suspension,suspensionResolutionBeat:suspension==="none"?null:signature.pulseQuarterBeats,serial,keyName:keyId,melodyPlanAccepted:true,progression:passage.progression,approachStyle,approachRhythm,finalShape:"held-tonic",endingAccompaniment:"dominant-tonic-block-chords",melodyRegisterShift:0,accompanimentRegisterShift:0,cadenceGenerator:true}};
  }

  function buildRelativeKey(answerId, { level } = {}) {
    if(["H","AH"].includes(level)) {
      const pair=balancedPatternValue("higher-relative-key-pair",["C:Am","F:Dm","G:Em"]).split(":");
      const start=answerId==="relative-major"?pair[1]:answerId==="relative-minor"?pair[0]:choose(pair);
      const destination=answerId==="relative-major"?pair[0]:answerId==="relative-minor"?pair[1]:start;
      return makeN4KeyChangePassage(start!==destination,{start,destination});
    }
    const available = new Set(LEVEL_KEYS[level] || LEVEL_KEYS.H);
    const pairs = [["C","Am"],["F","Dm"],["G","Em"]].filter(pair=>pair.every(keyName=>available.has(keyName)));
    const selected = pairs[keySerial % Math.max(1,pairs.length)] || ["C","Am"];
    const [majorKey,minorKey] = selected;
    const start = answerId === "relative-major" ? minorKey : majorKey;
    const end = answerId === "relative-major" ? majorKey : answerId === "relative-minor" ? minorKey : start;
    return makePassage({ keyNames:[...Array(8).fill(start),...Array(8).fill(end)],
      progression:["I","IV","V","I","VI","IV","V","I","I","IV","V","I","VI","IV","V","I"] });
  }

  function buildRhythmicChange(answerId,{level}={}) {
    if(level==="H") return makeHigherRhythmicPassage(answerId);
    const start=choose([0,1,2,3]);
    const direction=choose([1,-1]);
    const shape=choose([[0,2,3,4],[0,1,3,2],[0,2,1,4],[0,3,2,4]]);
    const degrees = shape.map(degree=>start+degree*direction);
    const slow = [1,1,2,4], fast = [.5,.5,1,2];
    const augmentation = answerId === "rhythm-augmentation";
    const slowDegreeBars = [degrees.slice(0,3), degrees.slice(3)];
    const slowDurationBars = [slow.slice(0,3), slow.slice(3)];
    const degreeBars = augmentation ? [degrees,[null],...slowDegreeBars] : [...slowDegreeBars,degrees,[null]];
    const durationBars = augmentation ? [fast,[4],...slowDurationBars] : [...slowDurationBars,fast,[4]];
    return makePassage({ degreeBars, durationBars, progression:["I","I","I","I"] });
  }

  function makeHigherRhythmicPassage(answerId) {
    const source=makeCadencePassage("perfect"),signature=source.timeSignature,key=source.key,B=signature.beats;
    let tonic=key.tonic;while(tonic<60)tonic+=12;
    const patterns=B===3?[[.5,.5,.5,1.5],[.25,.25,.5,.5,1.5],[.25,.25,.5,.5,.75,.75]]:
      [[B/8,B/8,B/4,B/2],[B/8,B/8,B/8,B/8,B/2],[B/8,B/8,B/8,B/8,B/4,B/4]];
    const rhythm=balancedPatternValue(`higher-rhythm-motif-${signature.id}`,patterns);
    const contour=choose([[0,1,2,4,3,2],[0,2,1,3,2,0],[2,1,0,2,4,2],[0,0,2,1,3,2],[4,2,3,1,2,0]]).slice(0,rhythm.length);
    const restIndex=rhythm.length>=5&&Math.random()<.3?1:-1;
    const augmentation=answerId==="rhythm-augmentation",factors=augmentation?[1,2]:[2,1];
    const firstStart=2*B,firstLength=B*factors[0],secondStart=firstStart+firstLength+B;
    const statements=factors.map((factor,index)=>{
      let beat=index?secondStart:firstStart;
      return contour.map((degree,i)=>{const midi=degreeMidi({...key,tonic},degree),event={id:`rhythm-${index}-${i}`,beat,beats:rhythm[i]*factor,midi,soundingMidi:midi,rest:i===restIndex,volume:.82,statement:index};beat+=event.beats;return event;});
    });
    const motifEvents=statements.flat(),bars=source.bars.map((bar,index)=>{
      if(index<2||index>=6)return bar;
      const origin=index*B;
      const notes=motifEvents.filter(n=>n.beat>=origin-1e-8&&n.beat<origin+B-1e-8).map(n=>({...n,barIndex:index,beat:n.beat-origin}));
      if(!notes.length)notes.push({id:`rhythm-breath-${index}`,barIndex:index,beat:0,beats:B,midi:0,soundingMidi:0,rest:true,volume:.82});
      const segments=notes.map(note=>{
        const symbol=note.rest?"I":["I","IV","V","VI","II"].find(symbol=>key.chords[symbol].some(p=>((p-note.midi)%12+12)%12===0))||"I";
        return {beat:note.beat,beats:note.beats,chordSymbol:symbol,pitches:[...key.chords[symbol]]};
      });
      const accompaniment=[];
      for(let beat=0;beat<B-1e-8;beat+=signature.pulseQuarterBeats) {
        const segment=segments.find(s=>beat>=s.beat-1e-8&&beat<s.beat+s.beats-1e-8)||segments[0];
        const end=Math.min(beat+signature.pulseQuarterBeats,segment.beat+segment.beats);
        const overlaps=notes.filter(n=>!n.rest&&n.beat<end&&n.beat+n.beats>beat);
        const pitches=segment.pitches.map(p=>{while(p<45)p+=12;while(p>64)p-=12;return p;}).filter(p=>overlaps.every(n=>![1,6,11].includes(((n.midi-p)%12+12)%12)));
        if(pitches.length)accompaniment.push({beat,beats:(end-beat)*.88,pitches,volume:.65/Math.sqrt(pitches.length),gateRelease:true,role:"rhythm-pulse"});
      }
      return {...bar,notes,chordSymbol:segments[0].chordSymbol,accompaniment,accompanimentHarmony:segments,generatedAccompaniment:false};
    });
    const result=synchroniseMelodyPlan({...source,bars,cadenceStudy:false,isolatedPassage:undefined,rhythmStudy:true,rhythmFactor:augmentation?2:.5,rhythmStatements:statements,rhythmMotif:contour,rhythmBaseDurations:rhythm,
      notes:bars.flatMap(bar=>bar.notes.filter(n=>!n.rest).map(n=>({...n,beat:bar.barIndex*B+n.beat})))});
    const replayGap=B,replayFirst=statements[0].map(n=>({...n,beat:n.beat-firstStart})),replaySecond=statements[1].map(n=>({...n,beat:n.beat-secondStart+firstLength+replayGap}));
    const totalBeats=3*B+replayGap;
    result.rhythmReplayPassage={...result,bars:[],notes:[...replayFirst,...replaySecond].filter(n=>!n.rest),totalBeats,rhythmReplayPassage:undefined};
    return result;
  }

  function buildIrregular(answerId,{level}={}) {
    if(["H","AH"].includes(level))return makeHigherTimeListeningPassage(answerId);
    const degreesFor = beats => Array.from({length:4},(_,bar)=>{
      const start=choose([0,1,2,3,4]);
      const direction=choose([1,-1]);
      return Array.from({length:beats},(_,beat)=>start+(beat+bar%2)*direction);
    });
    if (answerId === "metre-3" || answerId === "metre-4" || answerId === "metre-irregular") {
      const beats = answerId === "metre-3" ? 3 : answerId === "metre-4" ? 4 : 5;
      const signature = SIGNATURES[`${beats}/4`];
      return makePassage({ signature, degreeBars:degreesFor(beats), durationBars:Array.from({length:4},()=>Array(beats).fill(1)), fullPassage:false, barCount:4 });
    }
    const passage = makePassage({ signature:SIGNATURES["4/4"], degreeBars:degreesFor(4), durationBars:Array.from({length:4},()=>Array(4).fill(1)), silentAccompaniment:true, fullPassage:false, barCount:4 });
    const beatCounts = [3,3,4,4];
    let startBeat = 0;
    passage.bars = passage.bars.map((bar,index)=>{
      const beats = beatCounts[index];
      const notes = bar.notes.slice(0,beats).map((note,noteIndex)=>({...note,beat:noteIndex,beats:1}));
      const chord = passage.key.chords[bar.chordSymbol] || passage.key.chords.I;
      const next = {
        ...bar, beats, startBeat, notes, generatedAccompaniment:false,
        accompanimentHarmony:[{beat:0,beats,pitches:[...chord],volume:1}],
        accompaniment:[{beat:0,beats:beats-.15,pitches:[...chord],volume:.9}],
      };
      startBeat += beats;
      return next;
    });
    passage.totalBeats = startBeat;
    passage.timeSignatureChanges = [{barIndex:0,signature:"3/4"},{barIndex:2,signature:"4/4"}];
    passage.notes = passage.bars.flatMap(bar=>bar.notes.map(note=>({...note,beat:bar.startBeat+note.beat})));
    return passage;
  }

  function makeHigherTimeListeningPassage(answerId) {
    const changes=answerId==="metre-change";
    const changeBar=changes?balancedPatternValue("higher-time-change-position",[2,4]):null;
    const motif=balancedPatternValue("higher-time-recall-motif",["0,1,2,1","0,2,1,0","0,1,0,2"]).split(",").map(Number);
    const routes=["3/4:4/4","4/4:3/4","2/4:3/4","3/4:2/4"];
    if(generationContext?.level==="AH")routes.push("6/8:9/8","9/8:6/8","9/8:12/8","12/8:9/8","4/4:5/4","5/4:4/4","6/8:7/8","7/8:6/8","5/8:7/8","7/8:5/8");
    const route=changes?balancedPatternValue(`${generationContext?.level}-time-change-route`,routes).split(":"):[answerId==="metre-3"?"3/4":answerId==="metre-4"?"4/4":balancedPatternValue("higher-irregular-signature",["5/4","7/4","5/8","7/8"])];
    const irregular=SIGNATURES[route[0]].type==="irregular",units=SIGNATURES[route[0]].pulseCount;
    const grouping=irregular?balancedPatternValue(`higher-grouping-${units}`,units===7?["2+2+3","2+3+2","3+2+2"]:["3+2","2+3"]):null;
    const groups=grouping?grouping.split("+").map(Number):[];
    const groupStarts=groups.map((_,i)=>groups.slice(0,i).reduce((a,b)=>a+b,0));
    const source=makeCadencePassage("perfect"),key=source.key;
    const progression=changes&&changeBar===2?["I","V","I","IV","V","I","V","I"]:changes?["I","IV","V","I","I","IV","V","I"]:source.progression;
    let tonic=key.tonic;while(tonic<60)tonic+=12;
    let startBeat=0,previous=tonic;
    const bars=source.bars.map((bar,index)=>{
      const signature=SIGNATURES[route[changes&&index>=changeBar?1:0]],beats=signature.beats,unit=signature.pulseQuarterBeats,count=signature.pulseCount,symbol=progression[index],chord=key.chords[symbol];
      const irregular=signature.type==="irregular";
      const barGrouping=irregular?(signature.id===route[0]?grouping:balancedPatternValue(`AH-change-grouping-${signature.id}`,count===7?["2+2+3","2+3+2","3+2+2"]:["3+2","2+3"])):null;
      const groups=barGrouping?barGrouping.split("+").map(Number):[];
      const groupStarts=groups.map((_,i)=>groups.slice(0,i).reduce((a,b)=>a+b,0));
      const pulseAccents=Array.from({length:count},(_,pulse)=>pulse===0?1:irregular&&groupStarts.includes(pulse)?.85:beats===4&&pulse===2?.82:.72);
      const candidates=Array.from({length:28},(_,i)=>i+57).filter(midi=>chord.some(p=>((midi-p)%12+12)%12===0));
      const notes=[];
      for(let pulse=0;pulse<count;pulse++) {
        if(index===7&&pulse>0)continue;
        const reference=bar.notes[pulse%bar.notes.length].midi;
        const ranked=candidates.map(midi=>({midi,cost:Math.abs(midi-reference)*.4+Math.abs(midi-previous)+(midi===previous?2:0)+Math.random()*2})).sort((a,b)=>a.cost-b.cost);
        let midi=index===7?tonic:ranked[0].midi;
        if(index!==7&&(irregular||changes&&(index===0||index===changeBar))) {
          const cell=irregular?groups.flatMap((length,i)=>Array.from({length},(_,j)=>i===0?j:2-j)):motif;
          let anchor=chord[cell[pulse%cell.length]];while(anchor<tonic)anchor+=12;while(anchor>84)anchor-=12;
          midi=anchor;
        }
        notes.push({id:`higher-time-${index}-${pulse}`,barIndex:index,beat:pulse*unit,beats:index===7?beats:unit,midi,soundingMidi:midi,volume:pulseAccents[pulse]*.82});
        previous=notes.at(-1).midi;
      }
      const voicing=chord.map(p=>{while(p<53)p+=12;while(p>72)p-=12;return p;});
      const accompaniment=Array.from({length:count},(_,pulse)=>{
        const groupAttack=pulse===0||irregular&&groupStarts.includes(pulse);
        let bass=chord[pulse===0?0:2];while(bass<45)bass+=12;while(bass>56)bass-=12;
        const pitches=groupAttack?[...new Set([bass,...voicing])]:[voicing.at(-1)];
        const duration=irregular&&groupAttack?groups[groupStarts.indexOf(pulse)]*unit:unit;
        return {beat:pulse*unit,beats:duration*.88,pitches,volume:pulseAccents[pulse]/Math.sqrt(pitches.length),role:"metre-pulse",groupAttack,bassPitch:groupAttack?bass:null,gateRelease:true};
      });
      const result={...bar,barIndex:index,startBeat,beats,timeSignature:{...signature},metreGrouping:barGrouping,pulseOffsets:Array.from({length:count},(_,i)=>i*unit),pulseAccents:pulseAccents.map((_,i)=>i===0||irregular&&groupStarts.includes(i)),metrePulseAccents:pulseAccents,chordSymbol:symbol,notes,accompaniment,accompanimentHarmony:[{beat:0,beats,pitches:[...chord]}],generatedAccompaniment:false};
      startBeat+=beats;return result;
    });
    return synchroniseMelodyPlan({...source,cadenceStudy:false,isolatedPassage:undefined,bars,timeSignature:{...bars[0].timeSignature},barCount:8,totalBeats:startBeat,tempoPulseBeats:1,listeningExcerptBars:8,clearOpeningBars:2,
      higherIrregularListening:true,irregularGrouping:grouping,metreGroupingReinforced:true,motifRecall:changes?{sourceBar:0,recallBar:changeBar,contour:motif}:null,timeSignatureChanges:changes?[{barIndex:0,signature:route[0]},{barIndex:changeBar,signature:route[1]}]:[],
      notes:bars.flatMap(bar=>bar.notes.map(note=>({...note,beat:bar.startBeat+note.beat}))),listeningCadence:"perfect"});
  }

  const builders = {
    melodyDirection: buildDirection,
    stepLeap: buildStepLeap,
    repetitionSequence: buildRepetitionSequence,
    chordDiscord: buildChordDiscord,
    chordChanges: buildChordChanges,
    anacrusis: buildAnacrusis,
    changeOfKey: buildModulation,
    modulation: buildModulation,
    bassPatterns: buildBassPattern,
    tiercePicardie: buildTierce,
    relativeKey: buildRelativeKey,
    rhythmicChange: buildRhythmicChange,
    irregularMetre: buildIrregular,
  };

  function makeN4HarmonicPassage(device,enabled) {
    if(device==="changeOfKey") return makeN4KeyChangePassage(enabled);
    const signature=generationContext?.signature || SIGNATURES["4/4"];
    const start=generationContext?.keyName || "C";
    const keyNames=Array(8).fill(start);
    const progression=["I","IV","V","I","V","I","V","I"];
    const passage=makePassage({barCount:8,fullPassage:false,signature,keyNames,progression,style:"block_chords",silentAccompaniment:true});
    const pedalNoteBeats=["pedal","invertedPedal"].includes(device)&&enabled?balancedPatternValue("pedal-note-value",[1,.5]):null;
    const raise=pitch=>{while(pitch<45)pitch+=12;return pitch;};
    let pedal=raise(KEYS[start].chords.I[0]-12);
    if(device==="invertedPedal") { const highest=Math.max(...passage.bars.flatMap(bar=>bar.notes.filter(note=>!note.rest).map(note=>note.soundingMidi??note.midi)));while(pedal<=highest)pedal+=12; }
    const rhythmChoices=patternRhythmTemplates(signature).filter(template=>!template.leadingRest&&template.durations.every(duration=>duration>=.5));
    const rhythms=Array.from({length:4},()=>choose(rhythmChoices).durations);
    const motif=passage.bars.slice(0,4).map(bar=>bar.notes.filter(note=>!note.rest).map(note=>note.relativeStep));
    passage.bars=passage.bars.map((bar,index)=>{
      const key=KEYS[keyNames[index]],chord=key.chords[bar.chordSymbol];
      const classes=degreeClassesForChord(key,bar.chordSymbol);
      const durations=index===7?[signature.beats]:rhythms[index%4];
      let beat=0;
      const degrees=durations.map((duration,noteIndex)=>{
        const source=motif[index%4][noteIndex%motif[index%4].length]??0;
        const strong=strongBeatOffsets(signature).some(at=>Math.abs(at-beat)<1e-8);
        beat+=duration;
        return index===7?0:strong||noteIndex===0?nearestDegreeInClasses(source,classes):source;
      });
      const notes=notesFrom(degrees,durations,key,`harmonic-${index}`);
      const accompaniment=[];
      if(device==="vamp") {
        const spacing=enabled&&signature.type==="compound"?.375:.5;
        const subdivisions=signature.type==="compound"?3:2;
        const onsets=Array.from({length:Math.round(signature.beats/spacing)},(_,i)=>i*spacing);
        onsets.forEach((at,eventIndex)=>{
          const bass=eventIndex%2===0;
          const bassPitch=chord[eventIndex%4===2?2:0]-12;
          // The comparison follows the metre's own quaver groups, rather than
          // repeating a three-note figure over the double-time vamp grid.
          const group=Math.floor(eventIndex/subdivisions),withinGroup=eventIndex%subdivisions;
          const tone=signature.type==="compound"?withinGroup:withinGroup===0?(group%2===0?0:2):1;
          const metricAccent=enabled?1:withinGroup===0?(group===0?1:.85):.7;
          accompaniment.push({beat:at,beats:(onsets[eventIndex+1]??signature.beats)-at-.08,pitches:enabled?(bass?[raise(bassPitch)]:chord.map(raise)):[raise(chord[tone])],volume:(.078*.82*.8)/.018*metricAccent,metricAccent,role:enabled?(bass?"bass":"chord"):"broken-chord"});
        });
      } else {
        accompaniment.push({beat:0,beats:signature.beats*.96,pitches:chord.map(raise),volume:.65,role:"harmony"});
        if(["pedal","invertedPedal"].includes(device)&&enabled) {
          // Accompaniment uses .018 gain; use 80% of the melody's .078 × .82.
          for(let at=0;at<signature.beats;at+=pedalNoteBeats) accompaniment.push({beat:at,beats:pedalNoteBeats*.88,pitches:[pedal],volume:(.078*.82*.8)/.018,role:device==="invertedPedal"?"inverted-pedal":"pedal"});
        } else accompaniment.push({beat:0,beats:signature.beats*.96,pitches:[raise(chord[0]-12)],volume:1.1,role:"bass"});
      }
      return {...bar,keyId:key.id,notes,accompaniment,generatedAccompaniment:false,accompanimentHarmony:[{beat:0,beats:signature.beats,pitches:[...chord]}]};
    });
    if(generationContext?.level==="AH"&&device!=="vamp") {passage.bars=smoothMelodicRegister(passage).bars;passage.melodyRegisterPlanned=true;}
    let pedalOctaveAlternation=false;
    if(device==="invertedPedal") {
      passage.bars=enforceMelodyRange(passage).bars;
      const highest=Math.max(...passage.bars.flatMap(bar=>bar.notes.filter(note=>!note.rest).map(note=>note.soundingMidi??note.midi)));
      while(pedal<=highest) pedal+=12;
      pedalOctaveAlternation=enabled&&["N5","H","AH"].includes(generationContext?.level)&&balancedPatternValue("n5-inverted-pedal-octaves",[false,false,false,true]);
      passage.bars=passage.bars.map(bar=>({...bar,accompaniment:bar.accompaniment.map(event=>{
        if(event.role!=="inverted-pedal")return event;
        const pulseIndex=Math.round((bar.barIndex*signature.beats+event.beat)/pedalNoteBeats);
        return {...event,pitches:[pedal+(pedalOctaveAlternation&&pulseIndex%2?12:0)]};
      })}));
    }
    const result={...passage,notes:passage.bars.flatMap(bar=>bar.notes.map(note=>({...note,beat:bar.barIndex*signature.beats+note.beat}))),
      harmonicDevice:device,harmonicDevicePresent:enabled,harmonicExcerptBars:8,harmonicPhraseLength:4,harmonicCadence:"perfect",
      ...(device==="vamp"?{vampRate:2}:{}),
      ...(["pedal","invertedPedal"].includes(device)&&enabled?{pedalPitch:pedal,pedalNoteBeats,...(device==="invertedPedal"?{pedalOctaveAlternation,pedalPitches:pedalOctaveAlternation?[pedal,pedal+12]:[pedal]}:{})}:{}),
    };
    return device==="vamp"?fitVampHarmony(result):result;
  }

  function makeN4KeyChangePassage(changes, options = {}) {
    const signature=generationContext?.signature || SIGNATURES["4/4"];
    const start=options.start || generationContext?.keyName || "C";
    const relativeKeys={C:"Am",G:"Em",D:"Bm",F:"Dm",Bb:"Gm",Am:"C",Em:"G",Dm:"F"};
    const existingDestinations={C:"G",G:"D",D:"G",F:"C",Bb:"F",Am:"C",Em:"G",Dm:"F"};
    const destinations=[...new Set([existingDestinations[start],relativeKeys[start]])];
    const destination=changes?(options.destination || balancedPatternValue(`key-change-destination-${start}`,destinations)):start;
    const from=KEYS[start],to=KEYS[destination];
    const chordClasses=pitches=>pitches.map(pitch=>((pitch%12)+12)%12).sort((a,b)=>a-b).join(",");
    const destinationTriads=new Set(Object.values(to.chords).filter(chord=>chord.length===3).map(chordClasses));
    const higher=["H","AH"].includes(generationContext?.level);
    const pivotChoices=["I","IV","VI"].filter(symbol=>destinationTriads.has(chordClasses(from.chords[symbol])));
    const pivotSymbol=higher?balancedPatternValue(`higher-pivot-${start}-${destination}`,pivotChoices.length?pivotChoices:["I"]):(pivotChoices[0]||"I");
    const pivotChord=from.chords[pivotSymbol];
    const progression=["I","IV","V","I","I","IV","V","I"];
    const keyNames=Array.from({length:8},(_,index)=>index>=4?destination:start);
    const passage=makePassage({barCount:8,fullPassage:false,signature,keyNames,progression,style:"block_chords",silentAccompaniment:true});
    const raise=pitch=>{while(pitch<45)pitch+=12;return pitch;};
    const rhythmPool=patternRhythmTemplates(signature).filter(template=>!template.leadingRest&&template.durations.length>=3&&template.durations.every(beats=>beats>=.5));
    const rhythms=Array.from({length:3},()=>[...choose(rhythmPool).durations]);
    let previousDegree=0;
    const motifs=passage.bars.slice(0,3).map((bar,index)=>{
      const classes=degreeClassesForChord(from,bar.chordSymbol);
      const candidates=Array.from({length:index===2?9:8},(_,degree)=>degree-(index===2?1:0));
      const apex=choose(index===0?[3,4]:index===1?[4,5]:[2,4]);
      let beam=[{degrees:[],score:0}],beat=0;
      for(let noteIndex=0;noteIndex<rhythms[index].length;noteIndex++) {
        const duration=rhythms[index][noteIndex],lastNote=noteIndex===rhythms[index].length-1;
        const strong=strongBeatOffsets(signature).some(at=>Math.abs(at-beat)<1e-8);
        const progress=noteIndex/(rhythms[index].length-1);
        const target=index===2?previousDegree+(-1-previousDegree)*progress:progress<.65?apex*progress/.65:apex+((index===0?2:3)-apex)*(progress-.65)/.35;
        const next=[];
        for(const state of beam) for(const degree of candidates) {
          const prior=state.degrees.at(-1)??previousDegree;
          const chordTone=classes.includes((degree+7)%7);
          if(index===2&&lastNote&&degree!==-1) continue;
          if(index===0&&noteIndex===0&&degree!==0) continue;
          if(higher&&index===0&&lastNote&&degree!==0) continue;
          if((strong||noteIndex===0||lastNote)&&!chordTone) continue;
          if(![from,to].every(key=>Math.abs(degreeMidi(key,degree)-degreeMidi(key,prior))<=(noteIndex===0?7:5))) continue;
          const priorPassing=state.degrees.length&&!classes.includes((prior+7)%7);
          if(priorPassing&&(!chordTone||Math.abs(degree-prior)!==1||![from,to].every(key=>Math.abs(degreeMidi(key,degree)-degreeMidi(key,prior))<=2))) continue;
          if(!chordTone&&(duration>.5||noteIndex===0||Math.abs(degree-prior)!==1||priorPassing||![from,to].every(key=>Math.abs(degreeMidi(key,degree)-degreeMidi(key,prior))<=2))) continue;
          if(state.degrees.length>=2&&degree===prior&&prior===state.degrees.at(-2)) continue;
          const distance=Math.abs(degree-prior);
          next.push({degrees:[...state.degrees,degree],score:state.score+(distance===1?3:distance===2?1:distance===0?-3:-distance)-Math.abs(degree-target)*.6+Math.random()*2});
        }
        beam=next.sort((a,b)=>b.score-a.score).slice(0,48);
        beat+=duration;
      }
      const varied=beam.filter(state=>new Set(state.degrees).size>=3);
      const chosen=choose((varied.length?varied:beam).slice(0,8));
      if(!chosen) throw new Error("Unable to write a connected key-change motif.");
      previousDegree=chosen.degrees.at(-1);
      return chosen.degrees;
    });
    if(higher) {
      const identity=JSON.stringify({motifs,rhythms,pivotSymbol,changes});
      if(recentHigherHarmonicShapes.includes(identity)&&(options.varietyAttempt||0)<16) return makeN4KeyChangePassage(changes,{...options,varietyAttempt:(options.varietyAttempt||0)+1});
      recentHigherHarmonicShapes.push(identity);if(recentHigherHarmonicShapes.length>24)recentHigherHarmonicShapes.shift();
    }
    const harmonyEvents=(pitches,beat,beats)=>{
      const pulse=signature.pulseQuarterBeats,end=beat+beats,onsets=[beat];
      // Keep the pulse aligned to the bar even when harmony changes off-beat.
      for(let at=0;at<end-1e-8;at+=pulse) if(at>beat+1e-8) onsets.push(at);
      return onsets.flatMap((at,index)=>{
        const duration=((onsets[index+1]??end)-at)*.88;
        return [
          {beat:at,beats:duration,pitches:pitches.map(raise),volume:.65,role:"harmony"},
          {beat:at,beats:duration,pitches:[raise(pitches[0]-12)],volume:1.1,role:"bass"},
        ];
      });
    };
    let arrivalTonic=to.tonic;
    while(arrivalTonic-1<MELODY_MIN_MIDI) arrivalTonic+=12;
    const half=signature.beats/2;
    const registerKey=key=>({...key,tonic:key.tonic-1<MELODY_MIN_MIDI?key.tonic+12:key.tonic});
    const pivotCandidates=Array.from({length:28},(_,index)=>index+MELODY_MIN_MIDI).filter(midi=>pivotChord.some(pitch=>(pitch%12+12)%12===midi%12));
    const dominantCandidates=Array.from({length:28},(_,index)=>index+MELODY_MIN_MIDI).filter(midi=>to.chords.V7.some(pitch=>(pitch%12+12)%12===midi%12));
    const previousMidi=degreeMidi(registerKey(from),motifs[2].at(-1));
    const leading=arrivalTonic-1;
    const bridges=[];
    for(const first of pivotCandidates) for(const second of pivotCandidates) for(const third of dominantCandidates) {
      const path=[previousMidi,first,second,third,leading];
      const leaps=path.slice(1).map((midi,index)=>Math.abs(midi-path[index]));
      if(leaps.some(leap=>leap>7)) continue;
      bridges.push({pitches:[first,second,third,leading],score:leaps.reduce((sum,leap)=>sum+leap+(leap===0?2:0),0)+Math.random()});
    }
    const bridge=bridges.sort((a,b)=>a.score-b.score)[0];
    if(!bridge) throw new Error("Unable to connect the pivot and applied dominant.");
    passage.bars=passage.bars.map((bar,index)=>{
      const key=index>=4?to:from;
      const chord=key.chords[bar.chordSymbol];
      if(index===3) {
        const part=[half-.5,.5],durations=[...part,...part];
        let beat=0;
        const notes=bridge.pitches.map((midi,noteIndex)=>{
          const harmonicKey=noteIndex<2?from:to;
          const relativeStep=Array.from({length:36},(_,index)=>index-14).find(degree=>degreeMidi(harmonicKey,degree)===midi);
          const note={id:`key-change-bridge-${noteIndex}`,beat,beats:durations[noteIndex],midi,soundingMidi:midi,relativeStep,volume:.82,harmonicKeyId:harmonicKey.id};
          beat+=note.beats;return note;
        });
        return {...bar,chordSymbol:pivotSymbol,keyId:start,notes,generatedAccompaniment:false,
          accompanimentHarmony:[{beat:0,beats:half,pitches:[...pivotChord],keyId:start,chordSymbol:pivotSymbol},{beat:half,beats:half,pitches:[...to.chords.V7],keyId:destination,chordSymbol:"V7"}],
          accompaniment:[...harmonyEvents(pivotChord,0,half),...harmonyEvents(to.chords.V7,half,half)],
        };
      }
      const phraseIndex=index%4;
      const degrees=index===7?[0]:motifs[phraseIndex];
      const durations=index===7?[signature.beats]:rhythms[phraseIndex];
      let melodyTonic=key.tonic;
      while(melodyTonic-1<MELODY_MIN_MIDI) melodyTonic+=12;
      return {...bar,keyId:key.id,notes:notesFrom(degrees,durations,{...key,tonic:melodyTonic},`key-change-${index}`),generatedAccompaniment:false,
        accompanimentHarmony:[{beat:0,beats:signature.beats,pitches:[...chord],keyId:key.id,chordSymbol:bar.chordSymbol}],
        accompaniment:harmonyEvents(chord,0,signature.beats),
      };
    });
    const degree=from.scale.findIndex(interval=>((from.tonic+interval)%12+12)%12===((to.tonic%12)+12)%12);
    const roman=["I","II","III","IV","V","VI","VII"][degree];
    return {...passage,notes:passage.bars.flatMap(bar=>bar.notes.map(note=>({...note,beat:bar.barIndex*signature.beats+note.beat}))),
      harmonicDevice:"changeOfKey",harmonicDevicePresent:changes,harmonicExcerptBars:8,harmonicPhraseLength:4,harmonicCadence:"perfect",accompanimentPattern:"pulse-chords",
      keyChange:{from:start,to:destination,relationship:changes&&destination===relativeKeys[start]?(start.endsWith("m")?"relative-major":"relative-minor"):changes?"related-key":"same-key",barIndex:4,pivotBarIndex:3,pivotChord:pivotSymbol,prepared:changes,preparationBeat:half,openingTonicArrival:higher,route:pivotSymbol+"–V7–I",recentShapeChecked:higher,preparationChord:changes?`V7/${roman}`:"V7",motifRecallBars:[4,5],leadingMidi:arrivalTonic-1},
    };
  }

  function makeCadencePassage(answerId, options = {}) {
    const keyId=options.keyId||generationContext?.keyName||"C",original=KEYS[keyId];
    const signature=options.signature||generationContext?.signature||SIGNATURES["4/4"];
    const minor=keyId.endsWith("m");
    const key={...original,chords:{...original.chords,II:[1,3,5].map(degree=>degreeMidi(original,degree)-12)}};
    let tonic=key.tonic;while(tonic<60)tonic+=12;while(tonic>71)tonic-=12;
    const scaffold=makeN4ScalePassage({answerId:minor?"scale-minor":"scale-major",keyId,tonicMidi:tonic,signature});
    const penultimate=answerId==="plagal"?"IV":answerId==="imperfect"?balancedPatternValue(`${generationContext?.level||"N5"}-imperfect-start`,["I","IV","I","IV","II","VI"]):"V";
    const finalSymbol=answerId==="interrupted"?"VI":answerId==="imperfect"?"V":"I";
    const finalDegree=answerId==="imperfect"?4:0;
    const leadIns=[
      ["I","IV","V","I","VI","IV"],
      ["I","VI","IV","V","I","II"],
      ["I","IV","I","VI","II","IV"],
      ["I","II","V","I","VI","IV"],
      ["I","VI","II","V","I","IV"],
      ["I","IV","VI","II","V","I"],
    ];
    const leadInIndex=balancedPatternValue(`${generationContext?.level||"N5"}-cadence-lead-in`,leadIns.map((_,i)=>i));
    const leadIn=options.leadIn||leadIns[leadInIndex];
    const progression=[...leadIn,penultimate,finalSymbol];
    const degreeMidiHere=degree=>degreeMidi({...key,tonic},degree);
    let previousVoicing=null,previousMelody=tonic;
    const bars=scaffold.bars.map((bar,index)=>{
      const symbol=progression[index];
      const chord=index===7&&options.tierce?[key.chords.I[0],key.chords.I[0]+4,key.chords.I[0]+7]:key.chords[symbol];
      let notes=bar.notes.map(note=>({...note}));
      if(index<6&&(symbol!==bar.chordSymbol||Math.abs(notes[0].midi-previousMelody)>7)) {
        // Recompose the melody for the actual harmony rather than changing
        // the chords underneath the old tune. Retain its rhythm and contour.
        const pool=Array.from({length:15},(_,i)=>i-3).filter(degree=>{
          const midi=degreeMidiHere(degree);
          return midi>=57&&midi<=84&&chord.some(p=>((midi-p)%12+12)%12===0);
        });
        const previous=previousMelody;
        let paths=[{notes:[],last:previous,cost:0}];
        notes.forEach((note,noteIndex)=>{
          const next=[];
          for(const state of paths)for(const degree of pool) {
            const midi=degreeMidiHere(degree),distance=Math.abs(midi-state.last);
            if(distance>9)continue;
            const sourceDirection=noteIndex?Math.sign(note.midi-notes[noteIndex-1].midi):0;
            const repeated=state.notes.at(-1)?.midi===midi;
            if(repeated&&state.notes.at(-2)?.midi===midi)continue;
            const cost=state.cost+Math.abs(midi-note.midi)*.7+distance*.35+(repeated?2:0)+(sourceDirection&&Math.sign(midi-state.last)!==sourceDirection?2:0)+Math.random();
            next.push({notes:[...state.notes,{...note,midi,soundingMidi:midi,scaleDegree:degree,relativeStep:degree}],last:midi,cost});
          }
          paths=next.sort((a,b)=>a.cost-b.cost).slice(0,32);
        });
        if(!paths.length)throw new Error("Unable to fit cadence lead-in melody.");
        notes=paths[0].notes;
      }
      if(index===6&&options.plainEnding) {
        let beat=0;
        notes=(options.approachRhythm||[signature.beats]).map((beats,i)=>{
          const note={...bar.notes[0],id:`cadence-approach-${i}`,beat,beats,midi:degreeMidiHere(4),soundingMidi:degreeMidiHere(4),scaleDegree:4,relativeStep:4,volume:.6};beat+=beats;return note;
        });
      }
      if(index===6&&["imperfect","plagal"].includes(answerId)) {
        const classes=degreeClassesForChord(key,symbol);
        const pool=Array.from({length:10},(_,i)=>i-2).filter(degree=>classes.includes(((degree%7)+7)%7)&&degreeMidiHere(degree)>=57&&degreeMidiHere(degree)<=84);
        let previous=scaffold.bars[5].notes.at(-1).scaleDegree;
        notes=notes.map((note,noteIndex)=>{
          const last=noteIndex===notes.length-1;
          const ranked=pool.filter(degree=>!last||answerId!=="plagal"||degree===3).map(degree=>({degree,cost:Math.abs(degree-previous)+(last?Math.abs(degree-finalDegree)*2:Math.random()*3)+(degree===previous?1:0)})).sort((a,b)=>a.cost-b.cost);
          const degree=ranked[0].degree;previous=degree;
          return {...note,midi:degreeMidiHere(degree),soundingMidi:degreeMidiHere(degree),scaleDegree:degree,relativeStep:degree};
        });
      }
      if(index===7) {
        const degree=finalDegree;
        notes=[{id:"cadence-final",barIndex:index,beat:0,beats:signature.beats,midi:degreeMidiHere(degree),soundingMidi:degreeMidiHere(degree),scaleDegree:degree,relativeStep:degree,volume:.6}];
      }
      // Close-position inversions keep the upper chord voices connected,
      // while a separate root bass makes the harmonic motion explicit.
      const pitches=chord.map(pitch=>{while(pitch<53)pitch+=12;while(pitch>=65)pitch-=12;return pitch;}).sort((a,b)=>a-b);
      const voicings=[];
      for(let inversion=0;inversion<3;inversion++) {
        const rotated=pitches.map((pitch,i)=>pitch+(i<inversion?12:0)).sort((a,b)=>a-b);
        for(const shift of [-12,0,12]) {
          const candidate=rotated.map(pitch=>pitch+shift);
          if(candidate[0]>=53&&candidate.at(-1)<=72)voicings.push(candidate);
        }
      }
      voicings.sort((a,b)=>a.reduce((sum,pitch,i)=>sum+Math.abs(pitch-(previousVoicing?.[i]??[55,60,64][i])),0)-b.reduce((sum,pitch,i)=>sum+Math.abs(pitch-(previousVoicing?.[i]??[55,60,64][i])),0));
      const voicing=voicings[0];previousVoicing=voicing;
      let bass=chord[0];while(bass<45)bass+=12;while(bass>=57)bass-=12;
      const onsets=index===6&&options.approachRhythm?notes.map(note=>note.beat):index>=6?[0]:Array.from({length:signature.pulseCount},(_,i)=>i*signature.pulseQuarterBeats);
      const accompaniment=onsets.flatMap((beat,eventIndex)=>{
        const beats=(index>=6?(onsets[eventIndex+1]??signature.beats)-beat:signature.pulseQuarterBeats)*.96;
        return [{beat,beats,pitches:voicing,volume:(index>=6?1.3:.65)/Math.sqrt(3),role:"cadence-chord"},{beat,beats,pitches:[bass],volume:index>=6?1.1:.65,role:"cadence-bass"}];
      });
      previousMelody=notes.at(-1).midi;
      return {...bar,chordSymbol:symbol,notes,accompaniment,accompanimentHarmony:[{beat:0,beats:signature.beats,pitches:[...chord]}],generatedAccompaniment:false};
    });
    const passage=synchroniseMelodyPlan({...scaffold,type:"cadence",key,bars,notes:bars.flatMap(bar=>bar.notes.map(note=>({...note,beat:bar.barIndex*signature.beats+note.beat}))),progression,cadenceStudy:true,cadenceExcerptBars:8,cadencePhraseLength:4,cadenceProgression:[penultimate,finalSymbol],cadenceLeadIn:[...leadIn],cadenceLeadInIndex:leadInIndex,tempoPulseBeats:signature.pulseQuarterBeats,accompanimentPattern:"cadence-chords"});
    return {...passage,isolatedPassage:isolatePassage(passage,{barIndexes:[6,7],melody:false,accompaniment:true})};
  }

  function makeSeniorSuspensionPassage(enabled) {
    const advanced=generationContext?.level==="AH";
    const kind=advanced?balancedPatternValue("AH-suspension-kind",["4-3","7-6","9-8"]):"4-3";
    const first=advanced?balancedPatternValue(`AH-suspension-position-${kind}`,kind==="9-8"?[3,4]:[2,4]):2;
    const leadIn=["I","IV","V","I","I","IV"];
    leadIn[first-1]=kind==="9-8"?"V":"IV";leadIn[first]=kind==="4-3"?"V":"I";
    const source=makeCadencePassage("perfect",{leadIn,plainEnding:true});
    let tonic=source.key.tonic;while(tonic<60)tonic+=12;
    const delay=source.timeSignature.pulseQuarterBeats,placements=[];
    const bars=source.bars.map(bar=>({...bar,notes:bar.notes.map(n=>({...n})),accompaniment:bar.accompaniment.map(e=>({...e,pitches:[...e.pitches]}))}));
    for(const index of [first,6]) {
      const type=index===6?"4-3":kind,suspensionMidi=tonic+(type==="7-6"?5:type==="9-8"?2:0);
      const resolutionMidi=type==="7-6"?tonic+source.key.scale[2]:type==="9-8"?tonic:tonic-1;
      const prep=bars[index-1],bar=bars[index],last=prep.notes.at(-1);
      prep.notes[prep.notes.length-1]={...last,midi:suspensionMidi,soundingMidi:suspensionMidi,playbackBeats:enabled?last.beats+delay:last.beats,gate:enabled?.995:.96,tieToNextBar:enabled};
      bar.notes=enabled?[
        {id:`suspension-${index}`,barIndex:index,beat:0,beats:delay,midi:suspensionMidi,soundingMidi:suspensionMidi,tiedFromPrevious:true,volume:.82},
        {id:`suspension-resolution-${index}`,barIndex:index,beat:delay,beats:source.timeSignature.beats-delay,midi:resolutionMidi,soundingMidi:resolutionMidi,volume:.82},
      ]:[{id:`no-suspension-${index}`,barIndex:index,beat:0,beats:source.timeSignature.beats,midi:resolutionMidi,soundingMidi:resolutionMidi,volume:.82}];
      const chord=[...source.key.chords[bar.chordSymbol]],pc=midi=>((midi%12)+12)%12;
      const suspend=pitches=>pitches.map(p=>pc(p)===pc(resolutionMidi)?p+suspensionMidi-resolutionMidi:p);
      let chordEvent=bar.accompaniment.find(e=>e.role==="cadence-chord")||bar.accompaniment[0];
      const bassEvent=bar.accompaniment.find(e=>e.role==="cadence-bass")||{volume:1.1,role:"cadence-bass"};
      let bass=type==="7-6"?source.key.chords.V[0]:chord[0];while(bass<45)bass+=12;
      if(type==="7-6")chordEvent={...chordEvent,pitches:chordEvent.pitches.map(p=>{while(p<=bass)p+=12;return p;})};
      bar.accompaniment=enabled?[
        {...chordEvent,beat:0,beats:delay*.96,pitches:suspend(chordEvent.pitches),gateRelease:true},
        {...chordEvent,beat:delay,beats:(source.timeSignature.beats-delay)*.96,gateRelease:true},
        {...bassEvent,beat:0,beats:source.timeSignature.beats*.96,pitches:[bass]},
      ]:[{...chordEvent,beat:0,beats:source.timeSignature.beats*.96},{...bassEvent,beat:0,beats:source.timeSignature.beats*.96,pitches:[bass]}];
      bar.accompanimentHarmony=enabled?[{beat:0,beats:delay,pitches:suspend(chord)},{beat:delay,beats:source.timeSignature.beats-delay,pitches:chord}]:[{beat:0,beats:source.timeSignature.beats,pitches:chord}];
      placements.push({type,preparationBar:index-1,barIndex:index,suspensionMidi,resolutionMidi,resolutionBeat:enabled?delay:0,bassMidi:bass});
    }
    return synchroniseMelodyPlan({...source,bars,cadenceStudy:false,isolatedPassage:undefined,suspensionStudy:true,suspensionPresent:enabled,suspensionPlacements:placements,harmonicExcerptBars:8,harmonicDevice:"suspension",notes:bars.flatMap(bar=>bar.notes.map(note=>({...note,beat:bar.barIndex*source.timeSignature.beats+note.beat})))});
  }

  function fitVampHarmony(passage) {
    const bars=passage.bars.map(bar=>{
      const key=KEYS[bar.keyId] || passage.key;
      const classes=degreeClassesForChord(key,bar.chordSymbol);
      const pc=pitch=>((pitch%12)+12)%12;
      const chordClasses=new Set((key.chords[bar.chordSymbol] || key.chords.I).map(pc));
      const notes=bar.notes.map((note,index)=>{
        if(note.rest||chordClasses.has(pc(note.soundingMidi??note.midi))) return {...note};
        const next=bar.notes[index+1];
        const overlaps=bar.accompaniment.filter(event=>note.beat<event.beat+event.beats-1e-8&&note.beat+note.beats>event.beat+1e-8);
        const passing=note.beats<=.25&&next&&!next.rest&&Math.abs(next.relativeStep-note.relativeStep)===1&&chordClasses.has(pc(next.soundingMidi??next.midi));
        const safe=overlaps.every(event=>event.pitches.length===1&&event.pitches.every(pitch=>![1,6,11].includes(pc((note.soundingMidi??note.midi)-pitch))));
        if(passing&&safe) return {...note,passingTone:true};
        const relativeStep=nearestDegreeInClasses(note.relativeStep,classes);
        const midi=degreeMidi(key,relativeStep);
        return {...note,relativeStep,midi,soundingMidi:midi};
      });
      // Normalize chord energy, keeping bass notes at the requested 80% level.
      const accompaniment=bar.accompaniment.map(event=>({...event,volume:event.volume/Math.sqrt(event.pitches.length)}));
      return {...bar,notes,accompaniment};
    });
    return {...passage,bars,notes:bars.flatMap(bar=>bar.notes.map(note=>({...note,beat:bar.barIndex*passage.timeSignature.beats+note.beat}))),vampHarmonyFitted:true,vampVolumeBasis:"combined-energy"};
  }

  function makeN4ScalePassage({answerId,keyId,tonicMidi,signature}) {
    const pentatonic=answerId==="scale-pentatonic";
    const minor=["scale-minor","scale-harmonic-minor"].includes(answerId);
    const scale=pentatonic?[0,2,4,7,9]:minor?[0,2,3,5,7,8,11]:[0,2,4,5,7,9,11];
    const count=scale.length;
    const midi=degree=>tonicMidi+Math.floor(degree/count)*12+scale[((degree%count)+count)%count];
    const chordDegrees=pentatonic?{I:[0,2,3],VI:[4,5,7],V:[3,6]}:{I:[0,2,4],IV:[3,5,7],V:[4,6,8]};
    const progression=["I",pentatonic?"VI":"IV","V","I","I",pentatonic?"VI":"IV","V","I"];
    const pool=patternRhythmTemplates(signature).filter(template=>!template.leadingRest&&template.durations.length>=3&&template.durations.every(beats=>beats>=.5));
    const bars=[];
    let previous=0;
    for(let index=0;index<8;index++) {
      const symbol=progression[index],classes=chordDegrees[symbol].map(degree=>degree%count);
      let degrees,durations;
      if(index===4||index===5) {
        const source=bars[index-4];degrees=source.notes.map(note=>note.scaleDegree);durations=source.notes.map(note=>note.beats);
      } else if(index===7) { degrees=[0];durations=[signature.beats]; }
      else {
        durations=[...choose(pool).durations];
        const start=index===1?(pentatonic?2:3):index===2||index===6?(pentatonic?3:4):0;
        const end=index===1?(pentatonic?4:5):index===2||index===6?(pentatonic?1:-1):2;
        let beam=[{degrees:[],score:0}],beat=0;
        for(let noteIndex=0;noteIndex<durations.length;noteIndex++) {
          const final=noteIndex===durations.length-1,strong=strongBeatOffsets(signature).some(at=>Math.abs(at-beat)<1e-8);
          const next=[];
          for(const state of beam) for(let degree=pentatonic?0:-1;degree<=count;degree++) {
            const prior=state.degrees.at(-1)??previous;
            const chordTone=classes.includes(((degree%count)+count)%count);
            if(noteIndex===0&&degree!==start||final&&degree!==end) continue;
            if((strong||noteIndex===0||final)&&!chordTone) continue;
            if((index===2||index===6)&&noteIndex===durations.length-2&&degree!==1) continue;
            if(Math.abs(midi(degree)-midi(prior))>(noteIndex===0?7:5)) continue;
            const priorPassing=state.degrees.length&&!classes.includes(((prior%count)+count)%count);
            const stepLimit=pentatonic?3:2;
            if(priorPassing&&(!chordTone||Math.abs(degree-prior)!==1||Math.abs(midi(degree)-midi(prior))>stepLimit)) continue;
            if(!chordTone&&(durations[noteIndex]>.5||!state.degrees.length||priorPassing||Math.abs(degree-prior)!==1||Math.abs(midi(degree)-midi(prior))>stepLimit)) continue;
            if(state.degrees.length>=2&&degree===prior&&prior===state.degrees.at(-2)) continue;
            const distance=Math.abs(degree-prior),target=start+(end-start)*noteIndex/(durations.length-1);
            next.push({degrees:[...state.degrees,degree],score:state.score+(distance===1?3:distance===0?-2:-distance)-Math.abs(degree-target)*.4+Math.random()*2});
          }
          beam=next.sort((a,b)=>b.score-a.score).slice(0,48);beat+=durations[noteIndex];
        }
        const selected=choose(beam.slice(0,8));
        if(!selected) throw new Error("Unable to generate a clear scale phrase.");
        degrees=selected.degrees;
      }
      let beat=0;
      const notes=degrees.map((degree,noteIndex)=>{
        const note={id:`n4-scale-${index}-${noteIndex}`,barIndex:index,beat,beats:durations[noteIndex],midi:midi(degree),soundingMidi:midi(degree),scaleDegree:degree,volume:.82};
        beat+=note.beats;return note;
      });
      previous=degrees.at(-1);
      let root=midi(chordDegrees[symbol][0]);while(root>=60)root-=12;while(root<48)root+=12;
      const pitches=chordDegrees[symbol].map(degree=>{let pitch=midi(degree);while(pitch>=root+12)pitch-=12;while(pitch<root)pitch+=12;return pitch;});
      const accompaniment=[];
      for(let at=0;at<signature.beats;at+=signature.pulseQuarterBeats) {
        if(index===7&&at>0) continue;
        const sounding=notes.find(note=>note.beat<=at+1e-8&&note.beat+note.beats>at+1e-8);
        const compatible=pitches.filter(pitch=>![1,6,11].includes(((sounding.midi-pitch)%12+12)%12));
        if(!compatible.length) continue;
        accompaniment.push({beat:at,beats:index===7?signature.beats*.96:Math.min(signature.pulseQuarterBeats,sounding.beat+sounding.beats-at)*.82,
          pitches:compatible,volume:(.078*.82*.35)/(.018*Math.sqrt(compatible.length)),role:"scale-harmony"});
      }
      bars.push({barIndex:index,chordSymbol:symbol,notes,accompaniment,generatedAccompaniment:false,accompanimentHarmony:[{beat:0,beats:signature.beats,pitches}]});
    }
    return synchroniseMelodyPlan({id:`scale-${Date.now()}-${Math.random()}`,type:"scales",key:KEYS[keyId],timeSignature:{...signature},bars,barCount:8,totalBeats:8*signature.beats,
      notes:bars.flatMap(bar=>bar.notes.map(note=>({...note,beat:bar.barIndex*signature.beats+note.beat}))),
      scaleId:answerId,scalePitchClasses:scale.map(interval=>(tonicMidi+interval)%12),scaleMotifRecallBars:[4,5],scalePhraseLength:4,scaleNativeMetre:true,
      tempoPulseBeats:signature.pulseQuarterBeats,accompanimentPattern:"pulse-chords",generationVariation:{timeSignature:signature.id},
    });
  }

  function makeN5ScalePassage(args) {
    if(!["scale-chromatic","scale-whole-tone"].includes(args.answerId)) return makeN4ScalePassage(args);
    const {answerId,keyId,tonicMidi,signature}=args;
    const scale=answerId==="scale-chromatic"?Array.from({length:12},(_,i)=>i):[0,2,4,6,8,10],count=scale.length;
    const midi=degree=>tonicMidi+Math.floor(degree/count)*12+scale[degree%count];
    const bars=[],origin=choose([0,count]);
    const reflect=step=>{const value=step%(2*count);return value<=count?value:2*count-value;};
    const pulsePatterns=signature.type==="compound"?[[.5,.5,.5],[.5,.25,.25,.5],[.25,.25,.5,.5]]:[[.5,.5],[.25,.25,.5],[.5,.25,.25],[.25,.25,.25,.25]];
    let walkPosition=0;
    for(let index=0;index<8;index++) {
      let degrees,durations;
      if(index===3||index===7) {degrees=[0];durations=[signature.beats];}
      else if(index===4||index===5) {degrees=bars[index-4].notes.map(note=>note.scaleDegree);durations=bars[index-4].notes.map(note=>note.beats);}
      else {
        durations=Array.from({length:signature.pulseCount},()=>choose(pulsePatterns)).flat();
        degrees=durations.map((_,i)=>index===6?reflect(durations.length-i):reflect(origin+walkPosition+i));
        if(index<3) walkPosition+=degrees.length;
      }
      let beat=0;
      const notes=degrees.map((degree,i)=>{const note={id:`symmetric-${index}-${i}`,barIndex:index,beat,beats:durations[i],midi:midi(degree),soundingMidi:midi(degree),scaleDegree:degree,volume:.82};beat+=note.beats;return note;});
      const accompaniment=[];
      for(let at=0;at<signature.beats;at+=signature.pulseQuarterBeats) {
        if((index===3||index===7)&&at>0) continue;
        const sounding=notes.find(note=>note.beat<=at+1e-8&&note.beat+note.beats>at+1e-8);
        const candidates=answerId==="scale-chromatic"?[sounding.midi-12]:[tonicMidi-12,tonicMidi-8,tonicMidi-4];
        const pitches=candidates.filter(pitch=>![1,6,11].includes(((sounding.midi-pitch)%12+12)%12));
        if(pitches.length) accompaniment.push({beat:at,beats:(degrees.length===1?signature.beats:Math.min(sounding.beat+sounding.beats-at,signature.pulseQuarterBeats))*.82,pitches,volume:(.078*.82*.35)/(.018*Math.sqrt(pitches.length))});
      }
      bars.push({barIndex:index,chordSymbol:null,notes,accompaniment,accompanimentHarmony:[],generatedAccompaniment:false});
    }
    return synchroniseMelodyPlan({id:`symmetric-${Date.now()}-${Math.random()}`,type:"scales",key:KEYS[keyId],timeSignature:{...signature},bars,barCount:8,totalBeats:8*signature.beats,
      notes:bars.flatMap(bar=>bar.notes.map(note=>({...note,beat:bar.barIndex*signature.beats+note.beat}))),
      scaleId:answerId,scalePitchClasses:scale.map(interval=>(tonicMidi+interval)%12),scaleMotifRecallBars:[4,5],scaleNativeMetre:true,tempoPulseBeats:signature.pulseQuarterBeats,
      accompanimentPattern:"pulse-chords",generationVariation:{timeSignature:signature.id},
    });
  }

  function makeHigherScalePassage(args) {
    if(args.answerId!=="scale-melodic-minor") return makeN5ScalePassage(args);
    const {keyId,tonicMidi,signature}=args;
    const source=makeN4ScalePassage({...args,answerId:"scale-harmonic-minor"});
    const ascending=[0,2,3,5,7,9,11,12],descending=[12,10,8,7,5,3,2,0];
    const rhythmChoices=signature.id==="6/8"?[[.5,.5,.5,.25,.25,.5,.25,.25],[.25,.25,.5,.5,.5,.25,.25,.5]]:
      signature.beats===2?[[.25,.25,.25,.25,.25,.25,.25,.25]]:
      signature.beats===3?[[.25,.25,.5,.5,.5,.25,.25,.5],[.5,.25,.25,.5,.25,.25,.5,.5]]:
      [[.5,.5,.5,.5,.5,.5,.5,.5],[.25,.25,.5,.5,.5,.5,.5,1]];
    const bars=source.bars.map((bar,index)=>{
      const direction=[1,5].includes(index)?"ascending":[2,6].includes(index)?"descending":null;
      let notes=bar.notes.map(note=>{
        const candidates=[0,2,3,5,7].map(i=>tonicMidi+i);
        const midi=candidates.sort((a,b)=>Math.abs(a-note.midi)-Math.abs(b-note.midi))[0];
        return {...note,midi,soundingMidi:midi};
      });
      if(direction) {
        let beat=0;const durations=choose(rhythmChoices),intervals=direction==="ascending"?ascending:descending;
        notes=intervals.map((interval,i)=>{const midi=tonicMidi+interval,note={id:`melodic-minor-${index}-${i}`,barIndex:index,beat,beats:durations[i],midi,soundingMidi:midi,volume:.82,scaleDirection:direction};beat+=durations[i];return note;});
      }
      if(index===3||index===7) notes=[{id:`melodic-minor-close-${index}`,barIndex:index,beat:0,beats:signature.beats,midi:tonicMidi,soundingMidi:tonicMidi,volume:.82}];
      // Quiet support follows each sounding note; never hold a raised sixth
      // or seventh underneath the natural descending form.
      const symbol=direction==="ascending"?"IV":direction==="descending"?"V":bar.chordSymbol;
      const chord=KEYS[keyId].chords[symbol].map(p=>{while(p<48)p+=12;while(p>=60)p-=12;return p;});
      const accompaniment=notes.flatMap(note=>{
        const pitches=chord.filter(p=>![1,6,11].includes(((note.midi-p)%12+12)%12));
        return pitches.length?[{beat:note.beat,beats:note.beats*.82,pitches,volume:(.078*.82*.35)/(.018*Math.sqrt(pitches.length)),role:"scale-harmony",gateRelease:true}]:[];
      });
      return {...bar,notes,chordSymbol:symbol,scaleDirection:direction,accompaniment,accompanimentHarmony:[],generatedAccompaniment:false};
    });
    return synchroniseMelodyPlan({...source,bars,scaleId:args.answerId,scaleAscendingIntervals:ascending,scaleDescendingIntervals:descending,
      scalePitchClasses:[...new Set([...ascending,...descending].map(i=>(tonicMidi+i)%12))],scaleMotifRecallBars:[4],
      notes:bars.flatMap(bar=>bar.notes.map(note=>({...note,beat:bar.barIndex*signature.beats+note.beat})))});
  }

  function makeTempoListeningPassage() {
    const signature=generationContext?.signature || SIGNATURES["4/4"];
    const passage=makePassage({barCount:8,fullPassage:false,signature});
    const pulseBeats=signature.type==="compound"?1.5:1;
    const pulseCount=Math.round(signature.beats/pulseBeats);
    const style=choose(["pulse-chords","alternating-bass-chords"]);
    const n5=generationContext?.level==="N5";
    const density=n5?choose(["simple","simple","simple","mixed"]):"mixed";
    const support=n5&&generationContext?.topic==="steadyTempo"&&Math.random()<.5?"light-middle":"full";
    passage.bars=passage.bars.map((bar,index)=>{
      const chord=passage.key.chords[bar.chordSymbol];
      const chordClasses=degreeClassesForChord(passage.key,bar.chordSymbol);
      const source=bar.notes.filter(note=>!note.rest);
      const splitPulse=n5&&density==="mixed"&&[2,5].includes(index)?Math.floor(Math.random()*pulseCount):-1;
      const durations=index===7?[signature.beats]:Array.from({length:pulseCount},(_,pulse)=>{
        if(index<2||density==="simple") return [pulseBeats];
        if(n5) return pulse===splitPulse?(signature.type==="compound"?[.5,.5,.5]:[.5,.5]):[pulseBeats];
        return Math.random()<.65?[pulseBeats]:[pulseBeats/2,pulseBeats/2];
      }).flat();
      const degrees=durations.map((_,noteIndex)=>index===7?0:nearestDegreeInClasses(source[noteIndex%source.length]?.relativeStep??0,chordClasses));
      const notes=notesFrom(degrees,durations,passage.key,`tempo-${index}`);
      const raise=pitch=>{while(pitch<45)pitch+=12;return pitch;};
      let accompaniment=Array.from({length:pulseCount},(_,pulse)=>({
        beat:pulse*pulseBeats,beats:pulseBeats*.85,
        pitches:(style==="alternating-bass-chords"&&pulse%2===0?[chord[0]-12]:chord).map(raise),
        volume:pulse===0?1.1:.75,
      }));
      if(support==="light-middle"&&index>=2&&index<=5) accompaniment=accompaniment.slice(0,1).map(event=>({...event,volume:event.volume*.5}));
      return {...bar,notes,accompaniment,generatedAccompaniment:false};
    });
    return {...passage,notes:passage.bars.flatMap(bar=>bar.notes.map(note=>({...note,beat:bar.barIndex*signature.beats+note.beat}))),accompanimentPattern:style,tempoPulseBeats:pulseBeats,tempoExcerptBars:8,tempoPhraseLength:4,tempoCadence:"perfect",tempoClearOpeningBars:2,tempoRhythmDensity:density,tempoAccompanimentSupport:support};
  }

  function buildQuestion({ level, topic, answerId, options, mode }) {
    const builder = builders[topic];
    if (!builder || !concepts[answerId]) throw new Error(`Unsupported Ear Training exercise: ${topic}/${answerId}`);
    return finish(withGenerationContext({level,topic},variation=>builder(answerId,{level,topic,variation})), { level, topic, answerId, options, mode });
  }

  const api = { topics, concepts, conceptIdsForLevel, buildQuestion, isolatePassage, createBalancedAnswerChooser, withGenerationContext, makePassage, retimePassage, melodyRange:{minMidi:MELODY_MIN_MIDI,maxMidi:MELODY_MAX_MIDI}, keys:KEYS, keysForLevel:level=>[...(LEVEL_KEYS[level]||[])], variedTempos:VARIED_TEMPOS.map(tempo=>({...tempo})), variedSignaturesForLevel:level=>(LEVEL_SIGNATURES[level]||[]).map(id=>({...SIGNATURES[id]})), signatures:SIGNATURES, idsByFamily, LEVEL_RANK };
  MLH.EarTrainingExercises = api;
  api.makeTempoListeningPassage=makeTempoListeningPassage;
  api.makeN3TempoPassage=makeTempoListeningPassage;
  api.makeN4HarmonicPassage=makeN4HarmonicPassage;
  api.makeN4AnacrusisPassage=makeN4AnacrusisPassage;
  api.makeN4ScalePassage=makeN4ScalePassage;
  api.makeN5BassPassage=makeN5BassPassage;
  api.makeCadencePassage=makeCadencePassage;
  api.makeN5CadencePassage=makeCadencePassage;
  api.makeSeniorSuspensionPassage=makeSeniorSuspensionPassage;
  api.makeN5ScalePassage=makeN5ScalePassage;
  api.makeHigherScalePassage=makeHigherScalePassage;
  api.makeMelodicMovementPassage=buildMelodicMovement;
  api.smoothMelodicRegister=smoothMelodicRegister;
  api.makeMelodicTransformationPassage=makeMelodicTransformationPassage;
  api.fitVampHarmony=fitVampHarmony;
  api.synchroniseMelodyPlan=synchroniseMelodyPlan;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
