(function attachPracticeMelodyGenerator(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PracticeMelodyGenerator = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function createPracticeMelodyGenerator() {
  "use strict";

  const RHYTHM_BEATS = {
    semibreve: 4,
    dottedMinim: 3,
    minim: 2,
    dottedCrotchet: 1.5,
    crotchet: 1,
    quaver: 0.5,
    dottedCrotchetRest: 1.5,
    crotchetRest: 1,
    quaverRest: 0.5,
  };

  const RHYTHM_POOLS = {
    "2/4": [
      ["quaver", "quaver", "crotchet"],
      ["crotchet", "quaver", "quaver"],
      ["crotchet", "crotchet"],
      ["quaverRest", "quaver", "crotchet"],
    ],
    "3/4": [
      ["quaver", "quaver", "crotchet", "crotchet"],
      ["crotchet", "quaver", "quaver", "crotchet"],
      ["dottedCrotchet", "quaver", "crotchet"],
      ["crotchet", "crotchet", "crotchet"],
      ["crotchetRest", "quaver", "quaver", "crotchet"],
    ],
    "4/4": [
      ["quaver", "quaver", "crotchet", "quaver", "quaver", "crotchet"],
      ["crotchet", "quaver", "quaver", "crotchet", "crotchet"],
      ["dottedCrotchet", "quaver", "crotchet", "crotchet"],
      ["minim", "quaver", "quaver", "crotchet"],
      ["crotchetRest", "quaver", "quaver", "crotchet", "crotchet"],
    ],
    "5/4": [
      ["quaver", "quaver", "crotchet", "crotchet", "quaver", "quaver", "crotchet"],
      ["crotchet", "quaver", "quaver", "crotchet", "crotchet", "crotchet"],
      ["dottedCrotchet", "quaver", "crotchet", "quaver", "quaver", "crotchet"],
      ["minim", "quaver", "quaver", "dottedCrotchet", "quaver"],
      ["crotchetRest", "quaver", "quaver", "crotchet", "crotchet", "crotchet"],
    ],
    "6/8": [
      ["quaver", "quaver", "quaver", "dottedCrotchet"],
      ["dottedCrotchet", "quaver", "quaver", "quaver"],
      ["crotchet", "quaver", "dottedCrotchet"],
      ["quaverRest", "quaver", "quaver", "dottedCrotchet"],
    ],
    "9/8": [
      ["quaver", "quaver", "quaver", "dottedCrotchet", "dottedCrotchet"],
      ["dottedCrotchet", "quaver", "quaver", "quaver", "dottedCrotchet"],
      ["crotchet", "quaver", "dottedCrotchet", "dottedCrotchet"],
      ["dottedCrotchet", "dottedCrotchet", "dottedCrotchet"],
    ],
    "12/8": [
      ["dottedMinim", "dottedMinim"],
      ["dottedCrotchet", "dottedCrotchet", "dottedCrotchet", "dottedCrotchet"],
      ["dottedMinim", "dottedCrotchet", "dottedCrotchet"],
      ["dottedCrotchet", "dottedCrotchet", "dottedMinim"],
    ],
  };

  const CADENCE_TEMPLATES = {
    perfect: [[2, 1], [7, 1], [5, 1], [4, 2, 1], [3, 2, 1]],
    imperfect: [[2, 5], [7, 5], [4, 5], [6, 5]],
    interrupted: [[7, 6], [2, 1], [5, 6]],
    plagal: [[4, 3, 2, 1], [6, 5, 1], [3, 2, 1]],
  };

  const CHORD_DEGREES = {
    I: [1, 3, 5],
    IV: [4, 6, 1],
    V: [5, 7, 2],
    V7: [5, 7, 2, 4],
    VI: [6, 1, 3],
  };

  const GLOBAL_DEFAULTS = {
    form: { sections: ["A", "A-prime", "B", "A-double-prime"], barsPerSection: 4 },
    rhythm: { allowRests: true, finalSimplification: true },
    motifs: { minLength: 2, maxLength: 4, allowSequence: true, maxSequences: 1 },
    pitchRange: { minRelativeStep: -3, maxRelativeStep: 7, maxTotalRange: 10 },
    intervalWeights: { step: 55, third: 30, larger: 15 },
    leapRules: { maxLeap: 5, recoveryThreshold: 3, requireOppositeStepRecovery: true },
    repetition: { maxConsecutive: 3 },
    climax: { preferredBars: [8, 9, 10, 11], requireSingleMainClimax: true },
    validation: {
      threshold: 85,
      maxAttempts: 80,
      penalties: { minor: 3, significant: 7, major: 12 },
    },
  };

  const LEVEL_DEFAULTS = {
    AH: {
      nonChordTones: {
        passing: true,
        upperNeighbour: true,
        lowerNeighbour: true,
        anticipation: true,
        suspension: true,
        appoggiatura: true,
      },
      accidentals: { diatonicByDefault: true, requireExplicitReason: true },
    },
  };

  const QUESTION_DEFAULTS = {
    missing: { repetition: { requireExactCopy: false }, questionOverrides: { preferredBars: [4, 5, 6, 7] } },
    rhythmicDictation: { questionOverrides: { targetBars: [8], mayReplaceRhythm: true } },
    accidentals: { questionOverrides: { targetBars: [8, 9, 10, 11], mayReplaceHarmony: true } },
    rests: { questionOverrides: { targetBars: [8, 9, 10, 11], mayReplaceRhythm: true } },
    rhythmIdentification: { questionOverrides: { targetBars: [8, 9, 10, 11], mayReplaceRhythm: true } },
    barlines: { rhythm: { allowRests: true }, questionOverrides: { targetBars: [8, 9, 10, 11] } },
    ahChord: { questionOverrides: { targetBars: [8], mayReplaceHarmony: true } },
    ahBassLine: { questionOverrides: { targetBars: [9], mayReplaceHarmony: true } },
  };

  function deepMerge(base, override) {
    const result = Array.isArray(base) ? [...base] : { ...(base || {}) };
    Object.entries(override || {}).forEach(([key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        result[key] = deepMerge(result[key] || {}, value);
      } else {
        result[key] = Array.isArray(value) ? [...value] : value;
      }
    });
    return result;
  }

  function resolveConfig({ level = "AH", questionTypes = [], overrides = {} } = {}) {
    let config = deepMerge(GLOBAL_DEFAULTS, LEVEL_DEFAULTS[level] || {});
    questionTypes.forEach((questionType) => {
      config = deepMerge(config, QUESTION_DEFAULTS[questionType] || {});
    });
    return deepMerge(config, overrides);
  }

  function hashSeed(seed) {
    const text = String(seed ?? "advanced-higher");
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function createSeededRandom(seed) {
    let state = hashSeed(seed) || 1;
    return function seededRandom() {
      state += 0x6D2B79F5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randomItem(items, random) {
    return items[Math.floor(random() * items.length)];
  }

  function weightedItem(items, random) {
    const total = items.reduce((sum, item) => sum + Math.max(0, item.weight || 0), 0);
    let roll = random() * total;
    for (const item of items) {
      roll -= Math.max(0, item.weight || 0);
      if (roll <= 0) return item.value;
    }
    return items.at(-1).value;
  }

  function degreeClass(relativeStep) {
    return ((relativeStep % 7) + 7) % 7 + 1;
  }

  function nearestStepForDegree(degree, previousStep, minStep, maxStep) {
    const targetClass = ((degree - 1) % 7 + 7) % 7;
    const candidates = [];
    for (let step = minStep; step <= maxStep; step += 1) {
      if (((step % 7) + 7) % 7 === targetClass) candidates.push(step);
    }
    return candidates.sort((first, second) => Math.abs(first - previousStep) - Math.abs(second - previousStep))[0];
  }

  function cadencePair(cadenceId, random) {
    if (cadenceId === "perfect") return [random() < 0.28 ? "V7" : "V", "I"];
    if (cadenceId === "imperfect") return [randomItem(["I", "IV", "VI"], random), "V"];
    if (cadenceId === "plagal") return ["IV", "I"];
    return ["V", "VI"];
  }

  function buildHarmonyPlan(cadenceId, random) {
    const bCadenceId = random() < 0.58 ? "imperfect" : "interrupted";
    const openingMiddle = randomItem(["I", "IV", "VI"], random);
    const openingSecond = randomItem(["IV", "VI"], random);
    const bEnding = cadencePair(bCadenceId, random);
    const finalEnding = cadencePair(cadenceId, random);
    return {
      bCadenceId,
      chords: [
        "I", openingSecond, openingMiddle, "V",
        "I", openingSecond, random() < 0.22 ? "V7" : "V", "I",
        randomItem(["VI", "IV"], random), randomItem(["IV", "V", "VI"], random), bEnding[0], bEnding[1],
        "I", openingSecond, finalEnding[0], finalEnding[1],
      ],
    };
  }

  function phraseForBar(barIndex) {
    return ["A", "A-prime", "B", "A-double-prime"][Math.floor(barIndex / 4)];
  }

  function expectedBeats(timeSignatureId) {
    return { "2/4": 2, "3/4": 3, "4/4": 4, "5/4": 5, "6/8": 3, "9/8": 4.5, "12/8": 6 }[timeSignatureId] || 4;
  }

  function patternBeats(pattern) {
    return pattern.reduce((sum, rhythm) => sum + (RHYTHM_BEATS[rhythm] || 0), 0);
  }

  function rhythmPool(timeSignatureId, allowRests) {
    const source = RHYTHM_POOLS[timeSignatureId] || RHYTHM_POOLS["4/4"];
    const filtered = allowRests ? source : source.filter((pattern) => !pattern.some((rhythm) => rhythm.endsWith("Rest")));
    return filtered.length ? filtered : source;
  }

  function finalPattern(timeSignatureId) {
    return {
      "2/4": ["minim"],
      "3/4": ["dottedMinim"],
      "4/4": ["semibreve"],
      "5/4": ["dottedMinim", "minim"],
      "6/8": ["dottedMinim"],
      "9/8": ["dottedMinim", "dottedCrotchet"],
      "12/8": ["dottedMinim", "dottedMinim"],
    }[timeSignatureId] || ["semibreve"];
  }

  function isStrongBeat(timeSignatureId, beat) {
    if (timeSignatureId === "5/4") return Math.abs(beat) < 0.001 || Math.abs(beat - 3) < 0.001;
    if (timeSignatureId.endsWith("/8")) return Math.abs((beat / 1.5) - Math.round(beat / 1.5)) < 0.001;
    return Math.abs(beat - Math.round(beat)) < 0.001;
  }

  function generateMotif(config, random) {
    const length = Math.floor(config.motifs.minLength + random() * (config.motifs.maxLength - config.motifs.minLength + 1));
    const motif = [0];
    while (motif.length < length) {
      const interval = weightedItem([
        { value: randomItem([-1, 1], random), weight: config.intervalWeights.step },
        { value: randomItem([-2, 2], random), weight: config.intervalWeights.third },
        { value: randomItem([-3, 3], random), weight: config.intervalWeights.larger },
      ], random);
      const next = Math.max(config.pitchRange.minRelativeStep, Math.min(config.pitchRange.maxRelativeStep, motif.at(-1) + interval));
      motif.push(next);
    }
    return motif;
  }

  function choosePitch({ previousStep, previousInterval, chordSymbol, strongBeat, contourTarget, motifTarget, config, random, repeatedRun }) {
    const chordDegrees = CHORD_DEGREES[chordSymbol] || CHORD_DEGREES.I;
    const candidates = [];
    for (let step = config.pitchRange.minRelativeStep; step <= config.pitchRange.maxRelativeStep; step += 1) {
      const interval = step - previousStep;
      const distance = Math.abs(interval);
      if (distance > config.leapRules.maxLeap) continue;
      if (strongBeat && !chordDegrees.includes(degreeClass(step))) continue;
      if (repeatedRun >= config.repetition.maxConsecutive && distance === 0) continue;
      if (Math.abs(previousInterval) > config.leapRules.recoveryThreshold && interval !== 0) {
        if (Math.sign(interval) === Math.sign(previousInterval) || distance > 1) continue;
      }
      let weight = 1;
      if (distance === 0) weight *= 0.35;
      else if (distance === 1) weight *= config.intervalWeights.step;
      else if (distance === 2) weight *= config.intervalWeights.third;
      else weight *= config.intervalWeights.larger / Math.max(1, distance - 2);
      if (chordDegrees.includes(degreeClass(step))) weight *= strongBeat ? 4 : 1.5;
      weight /= 1 + Math.abs(step - contourTarget) * 0.8;
      weight /= 1 + Math.abs(step - motifTarget) * 0.35;
      candidates.push({ value: step, weight });
    }
    return weightedItem(candidates.length ? candidates : [{ value: previousStep, weight: 1 }], random);
  }

  function cadenceTemplate(cadenceId, random) {
    return [...randomItem(CADENCE_TEMPLATES[cadenceId] || CADENCE_TEMPLATES.perfect, random)];
  }

  function generateBar({ barIndex, chordSymbol, pattern, previousStep, previousInterval, motif, contourTarget, cadenceDegrees = [], timeSignatureId, config, random, existingNotes }) {
    let beat = 0;
    let repeatedRun = 1;
    const notes = [];
    const soundingIndexes = pattern.map((rhythm, index) => rhythm.endsWith("Rest") ? null : index).filter((index) => index !== null);
    const cadenceStart = Math.max(0, soundingIndexes.length - cadenceDegrees.length);
    pattern.forEach((rhythm, noteIndex) => {
      if (rhythm.endsWith("Rest")) {
        notes.push({ rhythm, beat, beats: RHYTHM_BEATS[rhythm], rest: true, relativeStep: null });
        beat += RHYTHM_BEATS[rhythm];
        return;
      }
      const soundingPosition = soundingIndexes.indexOf(noteIndex);
      let relativeStep;
      let cadenceTone = false;
      if (cadenceDegrees.length && soundingPosition >= cadenceStart) {
        const degree = cadenceDegrees[soundingPosition - cadenceStart + Math.max(0, cadenceDegrees.length - soundingIndexes.length)];
        relativeStep = nearestStepForDegree(degree, previousStep, config.pitchRange.minRelativeStep, config.pitchRange.maxRelativeStep);
        cadenceTone = true;
      } else if (existingNotes?.[noteIndex] && !existingNotes[noteIndex].rest) {
        relativeStep = existingNotes[noteIndex].relativeStep;
      } else {
        relativeStep = choosePitch({
          previousStep,
          previousInterval,
          chordSymbol,
          strongBeat: isStrongBeat(timeSignatureId, beat),
          contourTarget,
          motifTarget: motif[(noteIndex + Math.floor(barIndex / 4)) % motif.length],
          config,
          random,
          repeatedRun,
        });
      }
      const interval = relativeStep - previousStep;
      repeatedRun = interval === 0 ? repeatedRun + 1 : 1;
      notes.push({ rhythm, beat, beats: RHYTHM_BEATS[rhythm], rest: false, relativeStep, cadenceTone });
      previousInterval = interval;
      previousStep = relativeStep;
      beat += RHYTHM_BEATS[rhythm];
    });
    return { barIndex, phrase: phraseForBar(barIndex), chordSymbol, pattern: [...pattern], notes, previousStep, previousInterval };
  }

  function comparableBarSignature(bar) {
    return bar.notes.map((note) => note.rest ? `R:${note.rhythm}` : `${note.relativeStep}:${note.rhythm}`).join("|");
  }

  function rhythmSignature(bar) {
    return bar.pattern.join("|");
  }

  function scorePlan(plan, config) {
    const penalties = [];
    const hardFailures = [];
    const sounding = plan.bars.flatMap((bar) => bar.notes.filter((note) => !note.rest).map((note) => ({ ...note, barIndex: bar.barIndex })));
    const expected = expectedBeats(plan.timeSignatureId);
    plan.bars.forEach((bar) => {
      if (Math.abs(patternBeats(bar.pattern) - expected) > 0.001) hardFailures.push(`bar-${bar.barIndex + 1}-duration`);
      const chordDegrees = CHORD_DEGREES[bar.chordSymbol] || CHORD_DEGREES.I;
      const unsupportedStrongNotes = bar.notes.filter((note) => (
        !note.rest
        && !note.cadenceTone
        && isStrongBeat(plan.timeSignatureId, note.beat)
        && !chordDegrees.includes(degreeClass(note.relativeStep))
      )).length;
      if (unsupportedStrongNotes) penalties.push({
        id: `bar-${bar.barIndex + 1}-strong-beat-non-chord-tone`,
        amount: config.validation.penalties.significant * unsupportedStrongNotes,
      });
    });
    if (plan.bars.length !== 16) hardFailures.push("incorrect-bar-count");
    if (sounding[0]?.relativeStep !== 0) hardFailures.push("opening-is-not-tonic");

    const finalExpectedDegree = { perfect: 1, plagal: 1, imperfect: 5, interrupted: 6 }[plan.cadenceId];
    if (degreeClass(sounding.at(-1)?.relativeStep) !== finalExpectedDegree) hardFailures.push("incorrect-final-degree");

    const steps = sounding.map((note) => note.relativeStep);
    const range = Math.max(...steps) - Math.min(...steps);
    if (range > config.pitchRange.maxTotalRange) hardFailures.push("range-exceeded");

    const intervals = sounding.slice(1).map((note, index) => note.relativeStep - sounding[index].relativeStep);
    const unrecovered = intervals.filter((interval, index) => (
      Math.abs(interval) > config.leapRules.recoveryThreshold
      && index < intervals.length - 1
      && (Math.sign(intervals[index + 1]) === Math.sign(interval) || Math.abs(intervals[index + 1]) > 1)
    )).length;
    if (unrecovered) penalties.push({ id: "unrecovered-leaps", amount: config.validation.penalties.major * unrecovered });

    const highest = Math.max(...steps);
    const highestBars = sounding.filter((note) => note.relativeStep === highest).map((note) => note.barIndex);
    if (!highestBars.some((barIndex) => config.climax.preferredBars.includes(barIndex))) {
      penalties.push({ id: "missing-b-climax", amount: config.validation.penalties.major });
    }
    if (highestBars.some((barIndex) => barIndex < 4)) penalties.push({ id: "climax-too-early", amount: config.validation.penalties.significant });

    const aPrimeRecall = comparableBarSignature(plan.bars[0]) === comparableBarSignature(plan.bars[4])
      && comparableBarSignature(plan.bars[1]) === comparableBarSignature(plan.bars[5]);
    if (!aPrimeRecall) penalties.push({ id: "weak-a-prime-recall", amount: config.validation.penalties.major });
    const recapRecall = comparableBarSignature(plan.bars[0]) === comparableBarSignature(plan.bars[12])
      && comparableBarSignature(plan.bars[1]) === comparableBarSignature(plan.bars[13]);
    if (!recapRecall) penalties.push({ id: "weak-recap-recall", amount: config.validation.penalties.major });

    const aRhythms = new Set(plan.bars.slice(0, 4).map(rhythmSignature));
    const bHasContrast = plan.bars.slice(8, 12).some((bar) => !aRhythms.has(rhythmSignature(bar)));
    if (!bHasContrast) penalties.push({ id: "insufficient-b-contrast", amount: config.validation.penalties.significant });

    const rhythmCounts = new Map();
    plan.bars.slice(0, 15).forEach((bar) => rhythmCounts.set(rhythmSignature(bar), (rhythmCounts.get(rhythmSignature(bar)) || 0) + 1));
    const mostRepeatedRhythm = Math.max(...rhythmCounts.values());
    if (mostRepeatedRhythm > 7) penalties.push({ id: "excessive-rhythm-repetition", amount: config.validation.penalties.minor });

    const score = Math.max(0, 100 - penalties.reduce((sum, penalty) => sum + penalty.amount, 0));
    return { score, penalties, hardFailures, accepted: !hardFailures.length && score >= config.validation.threshold };
  }

  function generateAttempt({ cadenceId, timeSignatureId, allowRests, config, random }) {
    const harmony = buildHarmonyPlan(cadenceId, random);
    const motif = generateMotif(config, random);
    const pool = rhythmPool(timeSignatureId, allowRests);
    const noRestPool = pool.filter((pattern) => !pattern.some((rhythm) => rhythm.endsWith("Rest")));
    const phraseA = Array.from({ length: 4 }, (_, index) => [...randomItem(index === 0 && noRestPool.length ? noRestPool : pool, random)]);
    const phraseAPrime = [
      [...phraseA[0]],
      [...phraseA[1]],
      [...randomItem(pool, random)],
      [...randomItem(pool, random)],
    ];
    const densePool = [...pool].sort((first, second) => second.length - first.length);
    const phraseB = Array.from({ length: 4 }, (_, index) => [...randomItem(index % 2 === 0 ? densePool.slice(0, Math.max(1, Math.ceil(densePool.length / 2))) : pool, random)]);
    const phraseRecap = [[...phraseA[0]], [...phraseA[1]], [...randomItem(pool, random)], finalPattern(timeSignatureId)];
    const patterns = [...phraseA, ...phraseAPrime, ...phraseB, ...phraseRecap];
    const contours = [0, 1, 2, 1, 0, 2, 3, 1, 2, 4, 6, 3, 0, 1, 1, 0];
    const cadenceByEndBar = { 3: "imperfect", 7: "perfect", 11: harmony.bCadenceId, 15: cadenceId };
    const cadenceDegreesByBar = {};
    Object.entries(cadenceByEndBar).forEach(([endBarText, phraseCadenceId]) => {
      const endBar = Number(endBarText);
      const template = cadenceTemplate(phraseCadenceId, random);
      cadenceDegreesByBar[endBar] = template;
    });
    const bars = [];
    let previousStep = 0;
    let previousInterval = 0;
    for (let barIndex = 0; barIndex < 16; barIndex += 1) {
      const sourceBar = barIndex === 4 || barIndex === 12 ? bars[0] : barIndex === 5 || barIndex === 13 ? bars[1] : null;
      const bar = generateBar({
        barIndex,
        chordSymbol: harmony.chords[barIndex],
        pattern: patterns[barIndex],
        previousStep,
        previousInterval,
        motif,
        contourTarget: contours[barIndex],
        cadenceDegrees: cadenceDegreesByBar[barIndex] || [],
        timeSignatureId,
        config,
        random,
        existingNotes: sourceBar?.notes,
      });
      if (barIndex === 0 && bar.notes.find((note) => !note.rest)) {
        const firstIndex = bar.notes.findIndex((note) => !note.rest);
        bar.notes[firstIndex].relativeStep = 0;
      }
      bars.push(bar);
      previousStep = bar.previousStep;
      previousInterval = bar.previousInterval;
    }
    const plan = {
      version: 1,
      level: "AH",
      timeSignatureId,
      cadenceId,
      bCadenceId: harmony.bCadenceId,
      motif,
      bars: bars.map(({ previousStep: ignoredStep, previousInterval: ignoredInterval, ...bar }) => bar),
    };
    plan.validation = scorePlan(plan, config);
    return plan;
  }

  function generateAdvancedHigherPlan({ seed = Date.now(), cadenceId = "perfect", timeSignatureId = "4/4", allowRests = true, questionTypes = [], overrides = {} } = {}) {
    const config = resolveConfig({ level: "AH", questionTypes, overrides });
    const random = createSeededRandom(seed);
    let best = null;
    for (let attempt = 0; attempt < config.validation.maxAttempts; attempt += 1) {
      const plan = generateAttempt({ cadenceId, timeSignatureId, allowRests, config, random });
      plan.seed = String(seed);
      plan.attempt = attempt + 1;
      if (!best || plan.validation.score > best.validation.score) best = plan;
      if (plan.validation.accepted) return plan;
    }
    return best;
  }

  function relativeStepToMidi(relativeStep, tonicMidi = 60, mode = "major") {
    const scale = mode === "minor" ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
    const octave = Math.floor(relativeStep / 7);
    const degreeIndex = ((relativeStep % 7) + 7) % 7;
    return tonicMidi + octave * 12 + scale[degreeIndex];
  }

  function summarisePlan(plan, { tonicMidi = 60, mode = "major" } = {}) {
    return plan.bars.map((bar) => ({
      bar: bar.barIndex + 1,
      phrase: bar.phrase,
      harmony: bar.chordSymbol,
      rhythm: [...bar.pattern],
      relativeSteps: bar.notes.filter((note) => !note.rest).map((note) => note.relativeStep),
      midi: bar.notes
        .filter((note) => !note.rest)
        .map((note) => relativeStepToMidi(note.relativeStep, tonicMidi, mode)),
    }));
  }

  function groupStartBeatsForTimeSignature(timeSignature) {
    if (timeSignature?.id === "5/4") {
      const beatGroups = timeSignature.beatGroups?.length ? timeSignature.beatGroups : [3, 2];
      return beatGroups.reduce((starts, beats) => [...starts, starts.at(-1) + beats], [0]).slice(0, -1);
    }
    if (timeSignature?.bottom === 8) {
      const numerator = Number(timeSignature?.top ?? String(timeSignature?.id ?? "6/8").split("/")[0] ?? 6);
      return Array.from({ length: Math.max(1, Math.round(numerator / 3)) }, (_, index) => index * 1.5);
    }
    return Array.from({ length: Math.max(1, Math.round(timeSignature?.beats ?? 4)) }, (_, index) => index);
  }
  function classifyMeter(timeSignature) {
    const numerator = Number(timeSignature?.top ?? String(timeSignature?.id ?? "4/4").split("/")[0] ?? 4);
    const denominator = Number(timeSignature?.bottom ?? String(timeSignature?.id ?? "4/4").split("/")[1] ?? 4);
    const compoundGroups = { 6: [3, 3], 9: [3, 3, 3], 12: [3, 3, 3, 3] };
    if (denominator === 8 && compoundGroups[numerator]) {
      return {
        numerator,
        denominator,
        meterFamily: `compound_${compoundGroups[numerator].length}`,
        beatsPerBar: numerator / 2,
        beatUnit: "dottedCrotchet",
        subdivisionUnit: "quaver",
        beatGroups: compoundGroups[numerator],
        groupStartBeats: groupStartBeatsForTimeSignature(timeSignature),
      };
    }
    const simpleGroups = timeSignature?.id === "5/4"
      ? (timeSignature.beatGroups?.length ? timeSignature.beatGroups : [3, 2])
      : numerator === 4 ? [2, 2] : [numerator];
    return {
      numerator,
      denominator,
      meterFamily: `simple_${numerator}`,
      beatsPerBar: timeSignature?.beats ?? numerator,
      beatUnit: denominator === 2 ? "minim" : "crotchet",
      subdivisionUnit: "quaver",
      beatGroups: simpleGroups,
      groupStartBeats: groupStartBeatsForTimeSignature(timeSignature),
    };
  }
  const durationToBeats = {
    bar: null,
    half: 2,
    quarter: 1,
    eighth: 0.5,
    sixteenth: 0.25,
    dottedQuarter: 1.5,
    dottedCrotchet: 1.5,
  };
  const ACCOMPANIMENT_VOLUME_SCALE = 0.9;
  const accompanimentVolume = (volume) => volume * ACCOMPANIMENT_VOLUME_SCALE;
  const accompanimentEvent = (time, duration, notes, velocity = 58, hand = "LH", volume = 0.018) => ({
    time,
    duration,
    notes: Array.isArray(notes) ? notes : [notes],
    velocity,
    hand,
    volume,
  });
  const FULL_METER_BEATS = {
    simple_2: 2,
    simple_3: 3,
    simple_4: 4,
    simple_5: 5,
    compound_2: 3,
    compound_3: 4.5,
    compound_4: 6,
  };
  const ACCOMPANIMENT_PATTERN_ALIASES = {
    bassChord: "block_chords",
    bassTwoChords: "pop_ballad",
    bassChordBassChord: "block_chords",
    offbeatChords: "contemporary_pop",
    lightPulse: "broken_chords",
  };
  const fullEventEnd = (event) => event.time + (durationToBeats[event.duration] ?? Number(event.duration) ?? 0);
  const finishPatternAtBarline = (events, barBeats, notes = "lowRoot", velocity = 32, hand = "LH", volume = 0.004) => {
    const end = Math.max(...events.map(fullEventEnd));
    return Math.abs(end - barBeats) < 0.001 ? events : [...events, accompanimentEvent(end, barBeats - end, notes, velocity, hand, volume)];
  };
  const fullArpeggioEvents = (tokens, barBeats, step = 0.5, velocity = 58, hand = "LH", volume = 0.017) => (
    Array.from({ length: Math.round(barBeats / step) }, (_, index) => {
      const time = index * step;
      const beatStart = Math.abs(time - Math.round(time)) < 0.001;
      return accompanimentEvent(time, step, tokens[index % tokens.length], beatStart ? velocity + 8 : velocity, hand, beatStart ? volume * 1.15 : volume);
    })
  );
  const fullCompoundGroupEvents = (groups, tokens, velocity = 60, hand = "LH", volume = 0.017) => (
    groups.flatMap((_, groupIndex) => {
      const start = groupIndex * 1.5;
      return tokens.map((token, index) => accompanimentEvent(start + index * 0.5, "eighth", token, index === 0 ? velocity + 8 : velocity, hand, index === 0 ? volume * 1.2 : volume));
    })
  );
  const fullChordPulseEvents = (beats, firstVelocity = 62, restVelocity = 56) => beats.map((beat, index) => (
    accompanimentEvent(beat, Math.min(1, Math.max(0.5, Math.ceil(beat + 1) - beat)), ["third", "fifth", "octaveRoot"], index === 0 ? firstVelocity : restVelocity, "RH", index === 0 ? 0.015 : 0.013)
  ));
  const fullBlockChordVariant = () => [
    accompanimentEvent(0, "bar", "lowRoot", 65, "LH", 0.028),
    accompanimentEvent(0, "bar", ["third", "fifth", "octaveRoot"], 58, "RH", 0.014),
  ];
  const fullBassChordBeats = (barBeats) => [
    accompanimentEvent(0, "quarter", "lowRoot", 70, "LH", 0.027),
    ...Array.from({ length: Math.max(1, Math.floor(barBeats) - 1) }, (_, index) => (
      accompanimentEvent(index + 1, Math.min(1, barBeats - index - 1), ["third", "fifth", "octaveRoot"], index === 0 ? 58 : 55, "RH", 0.013)
    )),
  ];
  const fullBassChordCompound = (groups) => groups.map((_, index) => (
    index % 2 === 0
      ? accompanimentEvent(index * 1.5, "dottedQuarter", index === 0 ? "lowRoot" : "lowFifth", 68, "LH", 0.026)
      : accompanimentEvent(index * 1.5, "dottedQuarter", ["third", "fifth", "octaveRoot"], 56, "RH", 0.013)
  ));
  const fullWaltzVariant = (barBeats) => [
    accompanimentEvent(0, "quarter", "lowRoot", 72, "LH", 0.028),
    ...Array.from({ length: Math.max(1, Math.floor(barBeats) - 1) }, (_, index) => (
      accompanimentEvent(index + 1, Math.min(1, barBeats - index - 1), ["third", "fifth", "octaveRoot"], index === 0 ? 58 : 55, "RH", 0.013)
    )),
  ];
  const fullOffbeatEvents = (barBeats) => finishPatternAtBarline([
    accompanimentEvent(0, "quarter", "lowRoot", 70, "LH", 0.027),
    ...Array.from({ length: Math.floor(barBeats) }, (_, index) => accompanimentEvent(index + 0.5, "eighth", index % 2 ? ["third", "fifth", "octaveRoot"] : ["third", "fifth"], index % 2 ? 60 : 56, "RH", 0.012)),
  ], barBeats);
  const fullOctaveHalfEvents = (barBeats, big = false) => (
    barBeats <= 2
      ? [accompanimentEvent(0, "bar", ["lowRoot", "root"], big ? 78 : 68, "LH", big ? 0.032 : 0.026), accompanimentEvent(0, "bar", ["third", "fifth", "octaveRoot"], big ? 65 : 55, "RH", big ? 0.018 : 0.014)]
      : [accompanimentEvent(0, "half", ["lowRoot", "root"], big ? 78 : 68, "LH", big ? 0.032 : 0.026), accompanimentEvent(2, barBeats - 2, ["lowFifth", "fifth"], big ? 72 : 62, "LH", big ? 0.029 : 0.023), accompanimentEvent(0, "half", ["third", "fifth", "octaveRoot"], big ? 65 : 55, "RH", big ? 0.018 : 0.014), accompanimentEvent(2, barBeats - 2, ["third", "fifth", "octaveRoot"], big ? 62 : 52, "RH", big ? 0.017 : 0.013)]
  );
  const fullPianoBalladEvents = (barBeats) => finishPatternAtBarline([
    accompanimentEvent(0, "quarter", "lowRoot", 70, "LH", 0.027),
    accompanimentEvent(Math.min(2, barBeats - 1), "quarter", "lowFifth", 64, "LH", 0.023),
    ...fullArpeggioEvents(["third", "fifth", "octaveRoot"], barBeats, 0.5, 54, "RH", 0.012),
  ], barBeats);
  const fullRockOctaveEvents = (barBeats) => fullArpeggioEvents(["lowRoot", "lowRoot", "lowFifth", "lowFifth"], barBeats, 0.5, 76, "LH", 0.026).map((event) => ({
    ...event,
    notes: event.notes.flatMap((note) => note === "lowRoot" ? ["lowRoot", "root"] : ["lowFifth", "fifth"]),
  }));
  const fullPowerChordEvents = (barBeats) => finishPatternAtBarline([
    ...Array.from({ length: Math.floor(barBeats) }, (_, index) => accompanimentEvent(index, "quarter", index < barBeats / 2 ? "lowRoot" : "lowFifth", index % 2 ? 72 : 82, "LH", 0.027)),
    accompanimentEvent(0, "quarter", "power", 76, "RH", 0.017),
    ...(barBeats > 2 ? [accompanimentEvent(2, "quarter", "power", 74, "RH", 0.016)] : []),
  ], barBeats);
  const fullStrideEvents = (barBeats) => (
    barBeats <= 2
      ? [accompanimentEvent(0, "quarter", ["lowRoot", "root"], 78, "LH", 0.028), accompanimentEvent(1, "quarter", "shell", 66, "RH", 0.016)]
      : finishPatternAtBarline([
        accompanimentEvent(0, "quarter", ["lowRoot", "root"], 78, "LH", 0.028),
        accompanimentEvent(1, "quarter", "shell", 66, "RH", 0.016),
        accompanimentEvent(2, "quarter", ["lowFifth", "fifth"], 74, "LH", 0.026),
        ...(barBeats >= 4 ? [accompanimentEvent(3, "quarter", "shell", 64, "RH", 0.015)] : []),
      ], barBeats)
  );
  const fullWalkingBassEvents = (barBeats) => finishPatternAtBarline([
    ...Array.from({ length: Math.floor(barBeats) }, (_, index) => accompanimentEvent(index, "quarter", ["lowRoot", "lowThird", "lowFifth", "lowFifth"][index % 4], index === 0 ? 72 : 62, "LH", 0.024)),
    ...(barBeats > 2 ? [accompanimentEvent(1, "eighth", "shell", 55, "RH", 0.012)] : []),
    ...(barBeats > 3 ? [accompanimentEvent(2.5, "eighth", "shell", 58, "RH", 0.012)] : []),
  ], barBeats);
  const fullSimpleVariants = (build) => ({
    simple_2: build(FULL_METER_BEATS.simple_2),
    simple_3: build(FULL_METER_BEATS.simple_3),
    simple_4: build(FULL_METER_BEATS.simple_4),
    simple_5: build(FULL_METER_BEATS.simple_5),
  });
  const fullCompoundVariants = (build) => ({
    compound_2: build([3, 3]),
    compound_3: build([3, 3, 3]),
    compound_4: build([3, 3, 3, 3]),
  });
  const fullAllMeters = (simpleBuilder, compoundBuilder = (groups) => fullCompoundGroupEvents(groups, ["root", "fifth", "third"])) => ({
    ...fullSimpleVariants(simpleBuilder),
    ...fullCompoundVariants(compoundBuilder),
  });
  const fullStyle = (styleId, name, variants) => ({ styleId, name, variants });
  const FULL_ACCOMPANIMENT_PATTERN_LIBRARY = {
    block_chords: fullStyle("block_chords", "Block Chords", fullAllMeters(fullBlockChordVariant, fullBassChordCompound)),
    broken_chords: fullStyle("broken_chords", "Broken Chords", fullAllMeters((beats) => fullArpeggioEvents(["root", "fifth", "octaveRoot", "fifth"], beats), (groups) => fullCompoundGroupEvents(groups, ["root", "fifth", "octaveRoot"]))),
    alberti_bass: fullStyle("alberti_bass", "Alberti Bass", fullAllMeters((beats) => fullArpeggioEvents(["root", "fifth", "third", "fifth"], beats), (groups) => fullCompoundGroupEvents(groups, ["root", "fifth", "third"]))),
    waltz: fullStyle("waltz", "Waltz", fullAllMeters(fullWaltzVariant, fullBassChordCompound)),
    romantic_octaves: fullStyle("romantic_octaves", "Romantic Octaves", fullAllMeters((beats) => fullOctaveHalfEvents(beats, true), (groups) => fullBassChordCompound(groups).map((event) => ({ ...event, velocity: event.velocity + 8, volume: event.volume * 1.15 })))),
    pop_ballad: fullStyle("pop_ballad", "Pop Ballad", fullAllMeters((beats) => fullOctaveHalfEvents(beats, false), fullBassChordCompound)),
    piano_ballad: fullStyle("piano_ballad", "Piano Ballad", fullAllMeters(fullPianoBalladEvents, (groups) => [...fullBassChordCompound(groups), ...fullCompoundGroupEvents(groups, ["third", "fifth", "octaveRoot"], 50, "RH", 0.01)])),
    contemporary_pop: fullStyle("contemporary_pop", "Contemporary Pop", fullAllMeters(fullOffbeatEvents, (groups) => fullCompoundGroupEvents(groups, ["lowRoot", ["third", "fifth"], ["third", "fifth", "octaveRoot"]], 56, "RH", 0.012))),
    pop_power_piano: fullStyle("pop_power_piano", "Pop Power Piano", fullAllMeters((beats) => [...fullOctaveHalfEvents(beats, true), ...fullChordPulseEvents(Array.from({ length: Math.floor(beats) }, (_, index) => index), 72, 66)], (groups) => [...fullBassChordCompound(groups).map((event) => ({ ...event, velocity: event.velocity + 8, volume: event.volume * 1.2 })), ...fullCompoundGroupEvents(groups, [["third", "fifth", "octaveRoot"], ["third", "fifth"], ["third", "fifth"]], 60, "RH", 0.013)])),
    rock_octaves: fullStyle("rock_octaves", "Rock Octaves", fullAllMeters(fullRockOctaveEvents, (groups) => fullCompoundGroupEvents(groups, [["lowRoot", "root"], ["lowRoot", "root"], ["lowFifth", "fifth"]], 74, "LH", 0.026))),
    power_chords: fullStyle("power_chords", "Power Chords", fullAllMeters(fullPowerChordEvents, (groups) => fullCompoundGroupEvents(groups, ["lowRoot", "lowRoot", "lowFifth"], 76, "LH", 0.026))),
    stride_piano: fullStyle("stride_piano", "Stride Piano", fullAllMeters(fullStrideEvents, fullBassChordCompound)),
    walking_bass: fullStyle("walking_bass", "Walking Bass", fullAllMeters(fullWalkingBassEvents, (groups) => fullCompoundGroupEvents(groups, ["lowRoot", "lowThird", "lowFifth"], 62, "LH", 0.022))),
  };
  const accompanimentStyleIds = Object.freeze(Object.keys(FULL_ACCOMPANIMENT_PATTERN_LIBRARY));
  const practiceAccompanimentStyleIds = Object.freeze([
    "block_chords", "broken_chords", "alberti_bass", "waltz", "piano_ballad",
    "contemporary_pop", "power_chords", "stride_piano", "walking_bass",
  ]);
  function getPatternVariant(styleId, meterInfo) {
    const resolvedStyleId = ACCOMPANIMENT_PATTERN_ALIASES[styleId] ?? styleId;
    const stylePattern = FULL_ACCOMPANIMENT_PATTERN_LIBRARY[resolvedStyleId] ?? FULL_ACCOMPANIMENT_PATTERN_LIBRARY.block_chords;
    if (meterInfo.meterFamily === "simple_5" && meterInfo.beatGroups?.join("+") === "3+2") {
      let groupOffset = 0;
      return meterInfo.beatGroups.flatMap((groupBeats) => {
        const groupPattern = stylePattern.variants?.[`simple_${groupBeats}`]
          ?? FULL_ACCOMPANIMENT_PATTERN_LIBRARY.block_chords.variants[`simple_${groupBeats}`]
          ?? [];
        const events = groupPattern.map((event) => ({
          ...event,
          time: event.time + groupOffset,
          duration: event.duration === "bar" ? groupBeats : event.duration,
        }));
        groupOffset += groupBeats;
        return events;
      });
    }
    return stylePattern.variants?.[meterInfo.meterFamily]
      ?? adaptPatternToMeter(stylePattern, meterInfo)
      ?? FULL_ACCOMPANIMENT_PATTERN_LIBRARY.block_chords.variants[meterInfo.meterFamily]
      ?? FULL_ACCOMPANIMENT_PATTERN_LIBRARY.block_chords.variants.simple_4;
  }


  function adaptPatternToMeter(stylePattern, meterInfo) {
    if (!stylePattern?.variants) return null;
    if (meterInfo.meterFamily === "simple_2") return stylePattern.variants.simple_4?.filter((event) => event.time < 2);
    if (meterInfo.meterFamily === "simple_3") return stylePattern.variants.simple_4?.filter((event) => event.time < 3);
    if (meterInfo.meterFamily === "compound_2") return stylePattern.variants.compound_3?.filter((event) => event.time < 3);
    if (meterInfo.meterFamily === "compound_3") return stylePattern.variants.compound_4?.filter((event) => event.time < 4.5);
    return null;
  }
  function accompanimentDurationBeats(duration, meterInfo) {
    if (duration === "bar") return meterInfo.beatsPerBar;
    return durationToBeats[duration] ?? Number(duration) ?? 0;
  }
  function validateAccompanimentPattern(pattern, meterInfo) {
    if (!Array.isArray(pattern) || !pattern.length) return false;
    const barBeats = meterInfo.beatsPerBar;
    const inBar = pattern.every((event) => {
      const duration = accompanimentDurationBeats(event.duration, meterInfo);
      return event.time >= 0 && duration > 0 && event.time + duration <= barBeats + 0.001;
    });
    if (!inBar) return false;
    const patternEnd = Math.max(...pattern.map((event) => event.time + accompanimentDurationBeats(event.duration, meterInfo)));
    if (Math.abs(patternEnd - barBeats) > 0.001) return false;
    if (meterInfo.meterFamily.startsWith("compound_")) {
      return meterInfo.beatGroups.every((_, index) => pattern.some((event) => Math.abs(event.time - index * 1.5) < 0.001));
    }
    return pattern.some((event) => Math.abs(event.time) < 0.001);
  }

  const ACCOMPANIMENT_MIN_MIDI = 45; // A2
  const ACCOMPANIMENT_MAX_MIDI = 72; // C5

  function lowerAccompanimentMidi(midi) {
    let adjusted = midi;
    while (adjusted > ACCOMPANIMENT_MAX_MIDI && adjusted - 12 >= ACCOMPANIMENT_MIN_MIDI) adjusted -= 12;
    while (adjusted < ACCOMPANIMENT_MIN_MIDI) adjusted += 12;
    return adjusted;
  }

  function lowerAccompanimentMidiBelow(midi, ceiling = ACCOMPANIMENT_MAX_MIDI) {
    const maxMidi = Math.min(ACCOMPANIMENT_MAX_MIDI, Number.isFinite(ceiling) ? ceiling : ACCOMPANIMENT_MAX_MIDI);
    let adjusted = lowerAccompanimentMidi(midi);
    while (adjusted >= maxMidi && adjusted - 12 >= ACCOMPANIMENT_MIN_MIDI) adjusted -= 12;
    while (adjusted < ACCOMPANIMENT_MIN_MIDI) adjusted += 12;
    return adjusted;
  }

  function accompanimentTokenMidi(token, midiMap) {
    if (!midiMap) return [];
    if (Array.isArray(token)) return token.flatMap((item) => accompanimentTokenMidi(item, midiMap));
    return midiMap[token] ?? midiMap.root ?? [];
  }

  function accompanimentMidiMap(chordMidi) {
    const rootMidi = chordMidi[0];
    const thirdMidi = chordMidi[1] ?? rootMidi;
    const fifthMidi = chordMidi[2] ?? rootMidi;
    const seventhMidi = chordMidi[3] ?? null;
    return {
      lowRoot: rootMidi - 12,
      lowThird: thirdMidi - 12,
      lowFifth: fifthMidi - 12,
      root: rootMidi,
      third: thirdMidi,
      fifth: fifthMidi,
      seventh: seventhMidi ?? fifthMidi,
      octaveRoot: rootMidi + 12,
      chord: chordMidi,
      shell: [rootMidi, thirdMidi, seventhMidi ?? fifthMidi],
      power: [rootMidi, fifthMidi],
    };
  }

  const BAR_PATTERNS = {
    "2/4": [
      ["crotchet", "crotchet"],
      ["minim"],
      ["dottedCrotchet", "quaver"],
      ["quaver", "quaver", "crotchet"],
      ["crotchet", "quaver", "quaver"],
    ],
    "3/4": [
      ["crotchet", "crotchet", "crotchet"],
      ["minim", "crotchet"],
      ["crotchet", "minim"],
      ["dottedMinim"],
      ["dottedCrotchet", "quaver", "crotchet"],
      ["crotchet", "dottedCrotchet", "quaver"],
      ["quaver", "quaver", "crotchet", "crotchet"],
      ["crotchet", "quaver", "quaver", "crotchet"],
    ],
    "4/4": [
      ["crotchet", "crotchet", "crotchet", "crotchet"],
      ["minim", "crotchet", "crotchet"],
      ["crotchet", "crotchet", "minim"],
      ["dottedMinim", "crotchet"],
      ["crotchet", "dottedMinim"],
      ["dottedCrotchet", "quaver", "minim"],
      ["minim", "dottedCrotchet", "quaver"],
      ["quaver", "quaver", "crotchet", "crotchet", "crotchet"],
      ["crotchet", "quaver", "quaver", "crotchet", "crotchet"],
      ["crotchet", "crotchet", "quaver", "quaver", "crotchet"],
      ["minim", "minim"],
    ],
    "5/4": [
      ["dottedMinim", "minim"],
      ["minim", "crotchet", "crotchet", "crotchet"],
      ["crotchet", "minim", "quaver", "quaver", "crotchet"],
      ["crotchet", "crotchet", "crotchet", "crotchet", "crotchet"],
      ["dottedCrotchet", "quaver", "crotchet", "dottedCrotchet", "quaver"],
      ["crotchet", "dottedCrotchet", "quaver", "quaver", "quaver", "crotchet"],
      ["quaver", "quaver", "crotchet", "crotchet", "quaver", "quaver", "crotchet"],
    ],
    "6/8": [
      ["dottedMinim"],
      ["dottedCrotchet", "dottedCrotchet"],
      ["quaver", "quaver", "quaver", "dottedCrotchet"],
      ["dottedCrotchet", "quaver", "quaver", "quaver"],
      ["quaver", "quaver", "quaver", "quaver", "quaver", "quaver"],
      ["dottedCrotchet", "quaver", "crotchet"],
      ["crotchet", "quaver", "crotchet", "quaver"],
    ],
    "9/8": [
      ["dottedCrotchet", "dottedCrotchet", "dottedCrotchet"],
      ["quaver", "quaver", "quaver", "dottedCrotchet", "dottedCrotchet"],
      ["dottedCrotchet", "quaver", "quaver", "quaver", "dottedCrotchet"],
      ["dottedCrotchet", "dottedCrotchet", "quaver", "quaver", "quaver"],
      ["crotchet", "quaver", "dottedCrotchet", "dottedCrotchet"],
      ["dottedCrotchet", "crotchet", "quaver", "dottedCrotchet"],
      ["dottedCrotchet", "dottedCrotchet", "crotchet", "quaver"],
    ],
    "12/8": [
      ["dottedCrotchet", "dottedCrotchet", "dottedCrotchet", "dottedCrotchet"],
      ["quaver", "quaver", "quaver", "dottedCrotchet", "dottedCrotchet", "dottedCrotchet"],
      ["dottedCrotchet", "quaver", "quaver", "quaver", "dottedCrotchet", "dottedCrotchet"],
      ["dottedCrotchet", "dottedCrotchet", "quaver", "quaver", "quaver", "dottedCrotchet"],
      ["dottedCrotchet", "dottedCrotchet", "dottedCrotchet", "quaver", "quaver", "quaver"],
      ["crotchet", "quaver", "dottedCrotchet", "dottedCrotchet", "dottedCrotchet"],
      ["dottedCrotchet", "crotchet", "quaver", "dottedCrotchet", "dottedCrotchet"],
      ["dottedCrotchet", "dottedCrotchet", "crotchet", "quaver", "dottedCrotchet"],
      ["dottedCrotchet", "dottedCrotchet", "dottedCrotchet", "crotchet", "quaver"],
    ],
  };
  const NATIONAL5_EXTRA_BAR_PATTERNS = {
    "2/4": [
      ["semiquaver", "dottedQuaver", "crotchet"],
      ["dottedQuaver", "semiquaver", "crotchet"],
      ["crotchet", "semiquaver", "dottedQuaver"],
      ["crotchet", "dottedQuaver", "semiquaver"],
    ],
    "3/4": [
      ["semiquaver", "dottedQuaver", "crotchet", "crotchet"],
      ["dottedQuaver", "semiquaver", "crotchet", "crotchet"],
      ["crotchet", "semiquaver", "dottedQuaver", "crotchet"],
      ["crotchet", "dottedQuaver", "semiquaver", "crotchet"],
    ],
    "4/4": [
      ["crotchet", "semiquaver", "dottedQuaver", "crotchet", "crotchet"],
      ["crotchet", "dottedQuaver", "semiquaver", "crotchet", "crotchet"],
      ["crotchet", "crotchet", "semiquaver", "dottedQuaver", "crotchet"],
      ["crotchet", "crotchet", "dottedQuaver", "semiquaver", "crotchet"],
    ],
  };

  function national5BarPatterns(timeSignature) {
    return [...(BAR_PATTERNS[timeSignature.id] ?? BAR_PATTERNS["4/4"]),
      ...(NATIONAL5_EXTRA_BAR_PATTERNS[timeSignature.id] ?? [])];
  }

  function national5PatternsForBar(timeSignature, barIndex, { rhythmInfo, isRestRhythm }) {
    const options = national5BarPatterns(timeSignature).filter((pattern) => {
      if (pattern.length < 2) return false;
      if (pattern.some(isRestRhythm)) return false;
      if (pattern.includes("semibreve") || pattern.includes("dottedMinim")) return false;
      return pattern.reduce((sum, rhythm) => sum + rhythmInfo(rhythm).beats, 0) === timeSignature.beats;
    });
    const preferred = options.filter((pattern) => {
      const quavers = pattern.filter((rhythm) => rhythm === "quaver").length;
      if (barIndex === 1 || barIndex === 5 || barIndex === 6) return quavers >= 2 || pattern.includes("dottedCrotchet");
      return quavers <= 2;
    });
    return preferred.length ? preferred : options;
  }
  function directionRunLength(notes) {
    let run = 0;
    let lastDirection = 0;
    for (let index = 1; index < notes.length; index += 1) {
      const direction = Math.sign(notes[index].step - notes[index - 1].step);
      if (!direction) continue;
      if (direction === lastDirection) run += 1;
      else {
        lastDirection = direction;
        run = 1;
      }
    }
    return { direction: lastDirection, run };
  }

  function currentRepeatedPitchRun(notes) {
    if (!notes.length) return 0;
    let run = 1;
    for (let index = notes.length - 1; index > 0; index -= 1) {
      if (notes[index].step !== notes[index - 1].step) break;
      run += 1;
    }
    return run;
  }

  function createNational5PhraseBuilder({
    notePool, noteBaseIndex, tonicStartNote, chordLettersFor, maximumLeap = () => 4,
    rhythmInfo, melodicAccidental, makeNote, random, keepStrongBeatsHarmonised = false,
  }) {
    function chooseNational5MelodyNote({ key, chordSymbol, previous, allNotes, beat, rhythm, barIndex, noteIndex, targetStep }) {
      if (barIndex === 0 && noteIndex === 0) return tonicStartNote(key);
      const chordLetters = chordLettersFor(key, chordSymbol);
      const previousIndex = noteBaseIndex(previous);
      const previousStep = previous?.step ?? tonicStartNote(key).step;
      const previousInterval = allNotes.length > 1 ? previousStep - allNotes.at(-2).step : 0;
      const recoveringLeap = Math.abs(previousInterval) >= 2;
      const run = directionRunLength(allNotes);
      const repeatedRun = currentRepeatedPitchRun(allNotes);
      const strongBeat = beat === 0 || beat === 2 || beat === 3;
      const rhythmBeats = rhythmInfo(rhythm).beats;
      const candidates = notePool.filter((candidate) => {
        const distance = candidate.step - previousStep;
        const absDistance = Math.abs(distance);
        if (previousIndex >= 0 && absDistance > maximumLeap()) return false;
        if (strongBeat && !chordLetters.includes(candidate.letter)) return false;
        if (repeatedRun >= 2 && distance === 0) return false;
        if (run.run >= 3 && Math.sign(distance) === run.direction) return false;
        if (recoveringLeap && distance !== 0 && Math.sign(distance) === Math.sign(previousInterval)) return false;
        if (recoveringLeap && absDistance > 1) return false;
        if (rhythm === "quaver" && absDistance > 2) return false;
        return true;
      });
      const weighted = candidates.map((candidate) => {
        const distance = Math.abs(candidate.step - previousStep);
        const contourDistance = Math.abs(candidate.step - targetStep);
        const chordTone = chordLetters.includes(candidate.letter);
        let weight = chordTone ? 7 : 2;
        if (strongBeat && chordTone) weight *= 3;
        if (rhythmBeats >= 2) weight *= chordTone ? 4 : 0.2;
        else if (rhythmBeats > 1) weight *= chordTone ? 2.4 : 0.45;
        else if (rhythmBeats === 1) weight *= chordTone ? 1.35 : 0.75;
        if (distance === 0) weight *= 0.3;
        if (distance === 1) weight *= 7;
        if (distance === 2) weight *= 3.2;
        if (distance === 3) weight *= 1.2;
        if (distance === 4) weight *= 0.7;
        weight *= 1 / (1 + contourDistance * 0.55);
        if (barIndex >= 5 && barIndex <= 6 && candidate.step >= targetStep - 1 && candidate.step <= targetStep + 1) weight *= 1.6;
        if (barIndex >= 5 && barIndex <= 6 && candidate.step > targetStep + 2) weight *= 0.35;
        if (melodicAccidental(key, candidate.letter) !== null) weight *= 0.85;
        return { candidate, weight };
      }).filter((item) => item.weight > 0);
      // Keep the chord audible on strong beats if strict contour rules exhaust the pool.
      if (keepStrongBeatsHarmonised && strongBeat && !weighted.length) {
        return notePool.filter((candidate) => chordLetters.includes(candidate.letter))
          .reduce((closest, candidate) => Math.abs(candidate.step - previousStep) < Math.abs(closest.step - previousStep) ? candidate : closest);
      }
      const pool = weighted.length ? weighted : [{ candidate: previous ?? tonicStartNote(key), weight: 1 }];
      let roll = random() * pool.reduce((sum, item) => sum + item.weight, 0);
      for (const item of pool) {
        roll -= item.weight;
        if (roll <= 0) return item.candidate;
      }
      return pool.at(-1).candidate;
    }

    function buildNational5PhraseBar({ key, chordSymbol, pattern, barIndex, previous, totalBars, timeSignature, targetStep, allNotes }) {
      let beat = 0;
      const notes = [];
      pattern.forEach((rhythm, noteIndex) => {
        const base = chooseNational5MelodyNote({
          key,
          chordSymbol,
          previous,
          allNotes,
          beat,
          rhythm,
          barIndex,
          noteIndex,
          targetStep,
        });
        const note = makeNote(base, rhythm, barIndex, noteIndex, beat, key, chordSymbol);
        notes.push(note);
        allNotes.push(note);
        previous = base;
        beat += rhythmInfo(rhythm).beats;
      });
      return {
        barIndex,
        chordSymbol,
        notes,
        totalBars,
        pattern,
        timeSignature,
      };
    }
    return buildNational5PhraseBar;
  }

  const NATIONAL5_CHORDS = ["I", "IV", "V", "VI"];
  function makeNational5Progression({ cadenceId = "perfect", barCount, randomItem, viPosition, reverse = false }) {
    if (barCount === 4 && viPosition !== undefined) {
      const tail = NATIONAL5_CHORDS.filter((symbol) => symbol !== "I" && symbol !== "VI");
      if (reverse) tail.reverse();
      tail.splice(viPosition - 1, 0, "VI");
      return ["I", ...tail];
    }
    const progression = Array.from({ length: barCount }, () => randomItem(NATIONAL5_CHORDS));
    const bar2 = randomItem(NATIONAL5_CHORDS);
    const bar3 = randomItem(NATIONAL5_CHORDS);
    const bar6 = randomItem(NATIONAL5_CHORDS);
    const ending = {
      perfect: ["V", "I"],
      imperfect: [randomItem(["I", "IV", "VI"]), "V"],
      plagal: ["IV", "I"],
      interrupted: ["V", "VI"],
    }[cadenceId] ?? ["V", "I"];
    progression[0] = "I";
    progression[1] = bar2;
    progression[2] = bar3;
    progression[3] = "V";
    if (barCount >= 6) {
      progression[4] = "I";
      progression[5] = bar6;
    }
    progression[barCount - 2] = ending[0];
    progression[barCount - 1] = ending[1];
    if (barCount >= 16) {
      if (progression[12] === progression[13]) {
        progression[12] = randomItem(NATIONAL5_CHORDS.filter((symbol) => symbol !== progression[13]));
      }
      if (progression[11] === progression[12]) {
        progression[11] = randomItem(NATIONAL5_CHORDS.filter((symbol) => symbol !== progression[12]));
      }
    }
    return progression;
  }

  return {
    national5: {
      barPatterns: national5BarPatterns,
      patternsForBar: national5PatternsForBar,
      createPhraseBuilder: createNational5PhraseBuilder,
      makeProgression: makeNational5Progression,
    },
    accompaniment: {
      styleIds: accompanimentStyleIds,
      practiceStyleIds: practiceAccompanimentStyleIds,
      classifyMeter,
      groupStartBeatsForTimeSignature,
      getPatternVariant,
      validateAccompanimentPattern,
      accompanimentDurationBeats,
      accompanimentVolume,
      accompanimentMidiMap,
      accompanimentTokenMidi,
      lowerAccompanimentMidiBelow,
      ACCOMPANIMENT_MAX_MIDI,
    },
    BAR_PATTERNS,
    currentRepeatedPitchRun,
    GLOBAL_DEFAULTS,
    LEVEL_DEFAULTS,
    QUESTION_DEFAULTS,
    CADENCE_TEMPLATES,
    CHORD_DEGREES,
    createSeededRandom,
    resolveConfig,
    generateAdvancedHigherPlan,
    relativeStepToMidi,
    scorePlan,
    summarisePlan,
  };
}));
