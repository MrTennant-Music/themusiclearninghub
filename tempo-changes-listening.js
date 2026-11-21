// N3/N4/N5 use a clear eight-bar pulse study. Later levels join two independently
// generated eight-bar phrases; the second half must never copy the first.
(function attachTempoChangesListening(MLH) {
  "use strict";

  const fasterAliases = [
    "faster", "fast", "speed up", "speeding up", "getting faster", "gets faster",
    "becoming faster", "gradually faster", "gradually getting faster", "quicker",
    "getting quicker", "increasing tempo", "tempo increases", "accelerating",
    "gradually speeding up", "gradually accelerating", "accelerando", "accel", "acc",
    "accellerando", "acelerando", "accelarando", "acellerando", "acceleradno",
    "acceleranno", "accelerendo", "accelarendo", "acceleranddo",
  ];
  const slowerAliases = [
    "slower", "slow", "slow down", "slowing down", "getting slower", "gets slower",
    "becoming slower", "gradually slower", "gradually getting slower", "decelerating",
    "decreasing tempo", "tempo decreases", "gradually slowing down", "rallentando", "rall", "ral",
    "ralentando", "rallentado", "rallantando", "ralantando", "rallentadno",
    "rallentanno", "rallentendo", "rallendando", "rallentanddo", "ritardando", "rit", "ritard", "ritarando",
    "ritardano", "ritardadno", "ritardanto", "rittardando", "ritartando",
    "riterdando", "retardando", "ritardanddo",
  ];
  const rubatoAliases = [
    "rubato", "tempo rubato", "rubato tempo", "rubbato", "rubatto", "rubbatto",
    "robato", "rubto", "rubata", "rubado", "rubarto", "rubattoo",
    "flexible tempo", "free tempo", "played freely", "fluctuating tempo", "tempo fluctuates",
    "speeding up and slowing down", "slowing down and speeding up", "gets faster and slower",
    "speeds up and slows down", "slows down and speeds up",
  ];
  const concepts = {
    faster: { label: "Faster", short: "Faster", glyph: "+", direction: "faster", aliases: fasterAliases },
    slower: { label: "Slower", short: "Slower", glyph: "−", direction: "slower", aliases: slowerAliases },
    accelerando: { label: "Accelerando", short: "Accelerando", glyph: "accel.", direction: "faster", aliases: fasterAliases },
    rallentando: { label: "Rallentando", short: "Rallentando", glyph: "rall.", direction: "slower", aliases: slowerAliases },
    ritardando: { label: "Ritardando", short: "Ritardando", glyph: "rit.", direction: "slower", aliases: slowerAliases },
    rubato: { label: "Rubato", short: "Rubato", glyph: "rubato", direction: "rubato", aliases: rubatoAliases, typedOnly: true },
    aTempo: { label: "A tempo", short: "A tempo", glyph: "a tempo", aliases: [] },
  };
  Object.values(concepts).forEach(concept => { concept.family = "tempoChanges"; });

  function questionConceptIdsForLevel(level) {
    if (level === "N3") return ["faster", "slower"];
    const ids = ["accelerando", "rallentando"];
    return level === "N5" ? [...ids, "rubato"] : ids;
  }

  function subtitleConceptIdsForLevel(level) {
    if (level === "N3") return ["faster", "slower"];
    const ids = ["accelerando", "rallentando"];
    return level === "N4" ? ids : [...ids, "ritardando"];
  }

  function buildMelody(level = "N5") {
    if(["N3","N4","N5"].includes(level)) return MLH.EarTrainingExercises.withGenerationContext({level,topic:"tempoChanges"},()=>MLH.EarTrainingExercises.makeTempoListeningPassage());
    const keyIds=MLH.EarTrainingExercises?.keysForLevel?.(level) || ["C","G","D","Bb","Am","Em","Dm","F"];
    const keys=MLH.MelodicDictation.KEYS.filter(key=>keyIds.includes(key.id));
    const first=MLH.MelodicDictation.makeEightBarRepetitionQuestion(level,0,keys[Math.floor(Math.random()*keys.length)]);
    let second;
    for(let attempt=0;attempt<32;attempt++) {
      const candidate=MLH.MelodicDictation.makeEightBarRepetitionQuestion(level,0,first.key);
      if(candidate.timeSignature.id===first.timeSignature.id) { second=candidate; break; }
    }
    if(!second) throw new Error("Unable to generate a matching fresh second tempo phrase.");
    const bars=[...first.bars,...second.bars].map((bar,barIndex)=>({
      ...bar,barIndex,
      notes:bar.notes.map((note,noteIndex)=>({...note,bar:barIndex,barIndex,noteIndex,id:`tempo-${barIndex}-${noteIndex}`})),
    }));
    return {...first,bars,barCount:bars.length,totalBeats:bars.length*first.timeSignature.beats,phraseSources:[first.id,second.id]};
  }

  function createRubatoProfile(melody) {
    if(melody?.bars?.length===8) {
      const shape=["forward-and-breathe","linger-at-climax","sigh-and-recover"][Math.floor(Math.random()*3)];
      const beatsPerBar=melody.timeSignature.beats,totalBeats=8*beatsPerBar;
      const points=new Map();
      const add=(beat,ratio,anchor)=>points.set(beat,{position:beat/totalBeats,ratio,anchor,shape});
      for(let first=0;first<8;first+=4) {
        const events=melody.bars.slice(first,first+4).flatMap(bar=>bar.notes.filter(note=>!note.rest).map(note=>({...note,at:bar.barIndex*beatsPerBar+note.beat})));
        const interior=events.filter(note=>note.at>=(first+1)*beatsPerBar&&note.at<(first+3)*beatsPerBar);
        const peak=[...interior].sort((a,b)=>(b.soundingMidi??b.midi)-(a.soundingMidi??a.midi)||b.beats-a.beats)[0];
        const closing=events.filter(note=>note.at>=(first+3)*beatsPerBar);
        const cadence=closing.filter(note=>note.beats>=(melody.tempoPulseBeats||1)).at(-1)||closing.at(-1);
        const before=events.filter(note=>note.at<peak.at).at(-1);
        const forward=1.1+Math.random()*.1,linger=.78+Math.random()*.08,breath=.72+Math.random()*.08;
        add(first*beatsPerBar,1,"phrase-start");
        if(shape==="forward-and-breathe") add(peak.at,forward,"climax");
        else if(shape==="linger-at-climax") {
          if(before.at>first*beatsPerBar) add(before.at,forward,"approach");
          add(peak.at,linger,"climax");
          if(peak.at+peak.beats<cadence.at) add(peak.at+peak.beats,forward,"release");
        } else {
          add(interior[0].at,linger,"phrase-breath");
          if(peak.at+peak.beats<cadence.at) add(peak.at+peak.beats,forward,"release");
          else if(peak.at>interior[0].at) add(peak.at,forward,"climax");
        }
        add(cadence.at,breath,"cadence");
        add((first+4)*beatsPerBar,1,"phrase-end");
      }
      return [...points.entries()].sort((a,b)=>a[0]-b[0]).map(([,point])=>point);
    }
    // Two four-bar phrases: lean forwards, linger at the cadence, then recover.
    // Capture the profile once per question so replay uses the same expression.
    const amount = 0.85 + Math.random() * 0.3;
    return [
      [0, 1], [0.0625, 0.9], [0.2, 1.18], [0.32, 1.04], [0.44, 0.72], [0.5, 1],
      [0.62, 1.18], [0.72, 0.84], [0.84, 1.22], [0.94, 0.7], [1, 1],
    ].map(([position, ratio]) => ({ position, ratio: 1 + (ratio - 1) * amount }));
  }

  function createRubatoClock({ startBpm, totalBeats, profile = createRubatoProfile() }) {
    const position = beat => Math.max(0, Math.min(totalBeats, beat));
    function bpmAtBeat(beat) {
      const fraction = position(beat) / totalBeats;
      const endIndex = profile.findIndex((point, index) => index > 0 && point.position >= fraction);
      const end = profile[endIndex < 0 ? profile.length - 1 : endIndex];
      const begin = profile[Math.max(0, (endIndex < 0 ? profile.length - 1 : endIndex) - 1)];
      const progress = (fraction - begin.position) / (end.position - begin.position);
      const eased = progress * progress * (3 - 2 * progress);
      return startBpm * (begin.ratio + (end.ratio - begin.ratio) * eased);
    }
    // Integrate the smooth BPM curve into the same beat-to-seconds clock used
    // by every sound and highlight. Small Simpson steps keep note timing stable.
    const steps = Math.ceil(totalBeats * 128);
    const step = totalBeats / steps;
    const times = [0];
    for (let index = 0; index < steps; index++) {
      const begin = index * step;
      const seconds = step / 6 * (
        60 / bpmAtBeat(begin) + 4 * 60 / bpmAtBeat(begin + step / 2) + 60 / bpmAtBeat(begin + step)
      );
      times.push(times[index] + seconds);
    }
    function timeAtBeat(beat) {
      const index = position(beat) / step;
      const lower = Math.min(steps - 1, Math.floor(index));
      return times[lower] + (times[lower + 1] - times[lower]) * (index - lower);
    }
    const durationAtBeat = (beat, beats) => timeAtBeat(beat + beats) - timeAtBeat(beat);
    return { startBpm, endBpm: bpmAtBeat(totalBeats), totalBeats, bpmAtBeat, timeAtBeat, durationAtBeat, duration: times[steps] };
  }

  // BPM changes continuously with musical beat position. Integrating 60/BPM
  // gives one clock for melody, accompaniment, clicks and playback highlighting.
  function createTempoClock({ startBpm, direction, totalBeats, profile, steadyEnds = false }) {
    if (!(startBpm > 0) || !(totalBeats > 0) || !["faster", "slower", "rubato"].includes(direction)) {
      throw new Error("A tempo-change clock needs a positive tempo, length and direction.");
    }
    if (direction === "rubato") return createRubatoClock({ startBpm, totalBeats, profile });
    const endBpm = startBpm * (direction === "faster" ? 1.8 : 0.5);
    const lead = steadyEnds ? totalBeats/4 : 0;
    const changeBeats = totalBeats-2*lead;
    const slope = (endBpm - startBpm) / changeBeats;
    const position = beat => Math.max(0, Math.min(totalBeats, beat));
    const bpmAtBeat = beat => startBpm + slope * Math.max(0,Math.min(changeBeats,position(beat)-lead));
    const timeAtBeat = beat => {
      const at=position(beat);
      const changing=Math.max(0,Math.min(changeBeats,at-lead));
      return Math.min(at,lead)*60/startBpm + 60/slope*Math.log1p(slope*changing/startBpm) + Math.max(0,at-lead-changeBeats)*60/endBpm;
    };
    const durationAtBeat = (beat, beats) => timeAtBeat(beat + beats) - timeAtBeat(beat);
    return { startBpm, endBpm, totalBeats, bpmAtBeat, timeAtBeat, durationAtBeat, duration: timeAtBeat(totalBeats) };
  }

  function normalizeAnswer(value) {
    return String(value || "").toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
  }

  function acceptsText(value, direction) {
    const aliases = { faster: fasterAliases, slower: slowerAliases, rubato: rubatoAliases }[direction] || [];
    const answer = normalizeAnswer(value);
    return aliases.some(alias => normalizeAnswer(alias) === answer);
  }

  MLH.TempoChangesListening = {
    concepts, questionConceptIdsForLevel, subtitleConceptIdsForLevel,
    buildMelody, createRubatoProfile, createTempoClock, acceptsText,
  };
})(window.MLH || (window.MLH = {}));
