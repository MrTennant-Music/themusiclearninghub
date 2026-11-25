(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./accidentals-selection.js'));
  else root.MLH.AccidentalsQuestionCore=factory(root.ACCIDENTALS_SELECTION);
})(globalThis,function(selection){
  'use strict';
  function create(exerciseRandom = Math.random) {
    const BAR_COUNT = 4;
    const ACCIDENTALS = [
      { id: "sharp", name: "Sharp", value: 1 },
      { id: "flat", name: "Flat", value: -1 },
      { id: "natural", name: "Natural", value: 0 },
    ];
    const DEFAULT_ACCIDENTALS = ACCIDENTALS.map((accidental) => accidental.id);

    const QUESTION_TYPES = [
      { id: "multiple-choice", label: "Multiple Choice" },
      { id: "apply-score", label: "Apply to Score" },
      { id: "audio-two", label: "Audio" },
      { id: "audio-full", label: "Audio" },
    ];
    const DEFAULT_QUESTION_TYPES = QUESTION_TYPES.map((question) => question.id);

    const ACCOMPANIMENT_PATTERNS = [
      "block_chords",
      "broken_chords",
      "alberti_bass",
      "waltz",
      "piano_ballad",
      "contemporary_pop",
      "power_chords",
      "stride_piano",
      "walking_bass",
    ];

    const QUESTION_TYPE_OPTIONS = [
      { id: "multiple-choice", label: "Multiple Choice", typeIds: ["multiple-choice"], glyph: "numbers" },
      { id: "apply-score", label: "Apply to Score", typeIds: ["apply-score"], glyph: "hand" },
      { id: "audio-questions", label: "Audio", typeIds: ["audio-two", "audio-full"], glyph: "audio" },
    ];

    const KEYS = [
      { id: "C", name: "C major", tonic: "C", keyAcc: {} },
      { id: "F", name: "F major", tonic: "F", keyAcc: { B: -1 } },
      { id: "G", name: "G major", tonic: "G", keyAcc: { F: 1 } },
      { id: "Am", name: "A minor", tonic: "A", keyAcc: {}, forceGSharp: true },
    ];

    const TIMES = [
      { id: "2/4", top: "2", bottom: "4", beats: 2, compound: false },
      { id: "3/4", top: "3", bottom: "4", beats: 3, compound: false },
      { id: "4/4", top: "4", bottom: "4", beats: 4, compound: false },
      { id: "6/8", top: "6", bottom: "8", beats: 3, displayBeats: 6, compound: true },
    ];

    const NOTES = [
      ["C", 4, -2, 60], ["D", 4, -1, 62], ["E", 4, 0, 64], ["F", 4, 1, 65],
      ["G", 4, 2, 67], ["A", 4, 3, 69], ["B", 4, 4, 71], ["C", 5, 5, 72],
      ["D", 5, 6, 74], ["E", 5, 7, 76], ["F", 5, 8, 77], ["G", 5, 9, 79], ["A", 5, 10, 81],
    ].map(([letter, octave, step, midi], index) => ({ letter, octave, step, midi, index }));

    const RHYTHMS = {
      semibreve: { beats: 4, spacing: 3.4, open: true, stem: false, flag: false },
      dottedMinim: { beats: 3, spacing: 2.75, open: true, stem: true, flag: false, dotted: true },
      minim: { beats: 2, spacing: 2.15, open: true, stem: true, flag: false },
      dottedCrotchet: { beats: 1.5, spacing: 1.75, open: false, stem: true, flag: false, dotted: true },
      crotchet: { beats: 1, spacing: 1.35, open: false, stem: true, flag: false },
      quaver: { beats: 0.5, spacing: 0.95, open: false, stem: true, flag: true },
    };

    const PATTERNS = {
      "2/4": [["crotchet", "crotchet"], ["minim"], ["quaver", "quaver", "crotchet"], ["crotchet", "quaver", "quaver"]],
      "3/4": [["crotchet", "crotchet", "crotchet"], ["minim", "crotchet"], ["crotchet", "minim"], ["quaver", "quaver", "crotchet", "crotchet"]],
      "4/4": [["crotchet", "crotchet", "crotchet", "crotchet"], ["minim", "minim"], ["minim", "crotchet", "crotchet"], ["crotchet", "crotchet", "minim"]],
      "6/8": [["dottedCrotchet", "dottedCrotchet"], ["quaver", "quaver", "quaver", "dottedCrotchet"], ["dottedCrotchet", "quaver", "quaver", "quaver"], ["crotchet", "quaver", "crotchet", "quaver"]],
    };

    const FINAL_PATTERNS = {
      "2/4": ["minim"],
      "3/4": ["dottedMinim"],
      "4/4": ["semibreve"],
      "6/8": ["dottedMinim"],
    };

    const SCALES = {
      C: ["C", "D", "E", "F", "G", "A", "B"],
      F: ["F", "G", "A", "B", "C", "D", "E"],
      G: ["G", "A", "B", "C", "D", "E", "F"],
      Am: ["A", "B", "C", "D", "E", "F", "G"],
    };

    const CHORDS = {
      C: [["C", "E", "G"], ["F", "A", "C"], ["G", "B", "D"], ["C", "E", "G"]],
      F: [["F", "A", "C"], ["Bb", "D", "F"], ["C", "E", "G"], ["F", "A", "C"]],
      G: [["G", "B", "D"], ["C", "E", "G"], ["D", "F#", "A"], ["G", "B", "D"]],
      Am: [["A", "C", "E"], ["D", "F", "A"], ["E", "G#", "B"], ["A", "C", "E"]],
    };

    const VALID_NOTE_NAMES = ["Ab", "A", "A#", "Bb", "B", "C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#"];

    const accidentalSelection=selection.create(exerciseRandom);
    function randomItem(array) { return array[Math.floor(exerciseRandom() * array.length)]; }
    function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
    function rhythmInfo(id) { return RHYTHMS[id] ?? RHYTHMS.crotchet; }
    function accidentalId(value) { if (value === 1) return "sharp"; if (value === -1) return "flat"; return "natural"; }
    function accidentalValue(id) { if (id === "sharp") return 1; if (id === "flat") return -1; return 0; }
    function enabledAccidentalValues(enabledAccidentals) { return enabledAccidentals.map(accidentalValue); }
    function sameEnabledSet(current, defaults) {
      return current.length === defaults.length && defaults.every((item) => current.includes(item));
    }
    function taskMatchesLevel(enabledAccidentals, enabledQuestionTypes) {
      return sameEnabledSet(enabledAccidentals, DEFAULT_ACCIDENTALS) && sameEnabledSet(enabledQuestionTypes, DEFAULT_QUESTION_TYPES);
    }
    function keysForAccidentals(enabledAccidentals) {
      return KEYS.filter((key) => {
        if (key.id === "F") return enabledAccidentals.includes("flat") || enabledAccidentals.includes("natural");
        if (key.id === "G" || key.id === "Am") return enabledAccidentals.includes("sharp") || enabledAccidentals.includes("natural");
        return true;
      });
    }
    function forbidAccidental(letter, value) { return (letter === "B" && value === 1) || (letter === "E" && value === 1) || (letter === "C" && value === -1) || (letter === "F" && value === -1); }
    function hasEnharmonicConflict(bar, targetNote, value) {
      if (targetNote.letter === "A" && value === -1) return bar.notes.some((note) => note.letter === "G" && note.writtenAccidental === 1);
      if (targetNote.letter === "G" && value === 1) return bar.notes.some((note) => note.letter === "A" && note.writtenAccidental === -1);
      return false;
    }
    function nameOf(letter, accidental = 0) { return `${letter}${accidental === 1 ? "#" : accidental === -1 ? "b" : ""}`; }
    function midiFreq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
    function noteByLetter(letter, preferred = 6) {
      const matches = NOTES.filter((note) => note.letter === letter);
      return matches.reduce((best, note) => (Math.abs(note.index - preferred) < Math.abs(best.index - preferred) ? note : best), matches[0]);
    }
    function noteBaseIndex(note) {
      return NOTES.findIndex((item) => item.letter === note?.letter && item.octave === note?.octave);
    }
    function keyAccidentalForLetter(key, letter) {
      return key?.keyAcc?.[letter] ?? 0;
    }
    function chordAccidentalForLetter(chordLetters, letter, key) {
      const chordLetter = chordLetters.find((item) => item[0] === letter);
      if (!chordLetter) return null;
      if (chordLetter.includes("#")) return keyAccidentalForLetter(key, letter) === 1 ? null : 1;
      if (chordLetter.includes("b")) return keyAccidentalForLetter(key, letter) === -1 ? null : -1;
      return null;
    }
    function melodicAccidentalForLetter(key, letter) {
      return key?.forceGSharp && letter === "G" ? 1 : null;
    }
    function weighted(items) {
      const safeItems = items.length ? items : [{ value: 0, weight: 1 }];
      const total = safeItems.reduce((sum, item) => sum + item.weight, 0);
      let roll = exerciseRandom() * total;
      for (const item of safeItems) { roll -= item.weight; if (roll <= 0) return item.value; }
      return safeItems.at(-1).value;
    }
    function beatStarts(pattern) {
      let cursor = 0;
      return pattern.map((rhythm) => { const start = cursor; cursor += rhythmInfo(rhythm).beats; return start; });
    }
    function effectiveAccidental(question, barIndex, noteIndex) {
      const active = {};
      const bar = question.bars[barIndex];
      for (const note of bar.notes) {
        const pitchKey = `${note.letter}:${note.octave}`;
        if (!Object.prototype.hasOwnProperty.call(active, pitchKey)) active[pitchKey] = keyAccidentalForLetter(question.key, note.letter);
        if (note.writtenAccidental !== null && note.writtenAccidental !== undefined) active[pitchKey] = note.writtenAccidental;
        if (note.hiddenAccidental !== null && note.hiddenAccidental !== undefined) active[pitchKey] = note.hiddenAccidental;
        if (note.noteIndex === noteIndex) return active[pitchKey];
      }
      return 0;
    }
    function accidentalForNoteName(name) {
      if (name.includes("#")) return "sharp";
      if (name.includes("b")) return "flat";
      return "natural";
    }
    function noteNameChoices(answer, enabledAccidentals) {
      const letter = answer[0];
      const allowedNames = VALID_NOTE_NAMES.filter((name) => enabledAccidentals.includes(accidentalForNoteName(name)) || name === answer);
      const primary = [`${letter}b`, letter, `${letter}#`].filter((name) => allowedNames.includes(name));
      const extras = accidentalSelection.shuffle(allowedNames.filter((name) => !primary.includes(name))).slice(0, Math.max(0, 6 - primary.length));
      const wrong=accidentalSelection.shuffle([...primary,...extras].filter((name,index,array)=>name!==answer&&array.indexOf(name)===index));wrong.splice(accidentalSelection.pick("note-answer-position/"+(wrong.length+1),Array.from({length:wrong.length+1},(_,i)=>i)),0,answer);return wrong.map(text=>({id:text,text}));
    }
    function makeNote(base, rhythm, barIndex, noteIndex, beat, key, chordLetters) {
      const melodicAccidental = melodicAccidentalForLetter(key, base.letter);
      const chordAccidental = chordAccidentalForLetter(chordLetters, base.letter, key);
      return { id: `${barIndex}-${noteIndex}`, barIndex, noteIndex, beat, rhythm, letter: base.letter, octave: base.octave, step: base.step, midi: base.midi, writtenAccidental: melodicAccidental ?? chordAccidental, hiddenAccidental: null, highlight: false };
    }

    function chooseNextNote({ key, chordLetters, previous, currentIndex, strongBeat, rhythm }) {
      const previousIndex = noteBaseIndex(previous) >= 0 ? noteBaseIndex(previous) : currentIndex;
      const previousMidi = previous?.midi ?? NOTES[previousIndex]?.midi ?? 72;
      const maxLeap = 1;
      const candidates = [];

      NOTES.forEach((candidate, candidateIndex) => {
        const distance = candidateIndex - previousIndex;
        const absDistance = Math.abs(distance);
        const isChordTone = chordLetters.some((letter) => letter[0] === candidate.letter);
        const pitchDistance = Math.abs((candidate.midi + keyAccidentalForLetter(key, candidate.letter)) - previousMidi);

        if (pitchDistance > 12) return;
        if (absDistance > maxLeap) return;
        if (strongBeat && !isChordTone) return;

        let weight = isChordTone ? 8 : 2;
        if (strongBeat) weight *= 2.8;
        if (absDistance === 0) weight *= 0.6;
        if (absDistance === 1) weight *= 5;
        if (candidateIndex < 1 || candidateIndex > NOTES.length - 2) weight *= 0.35;
        if (key.id === "Am" && candidate.letter === "G") weight *= 0.8;
        candidates.push({ value: candidate, weight });
      });

      if (!candidates.length) {
        const fallback = NOTES
          .map((note, index) => ({ ...note, index }))
          .filter((note) => Math.abs(note.index - previousIndex) <= maxLeap);
        return randomItem(fallback.length ? fallback : [previous]);
      }
      return weighted(candidates);
    }

    function buildNotesFromPattern({ key, chordLetters, pattern, barIndex, previousIndex, timeSignature }) {
      let currentIndex = previousIndex;
      let previous = NOTES[currentIndex] ?? noteByLetter(key.tonic, 6);
      let beat = 0;
      const notes = [];

      pattern.forEach((rhythm, noteIndex) => {
        const strongBeat = beat === 0 || beat === 2 || (timeSignature.id === "6/8" && beat === 1.5);
        let base = chooseNextNote({ key, chordLetters, previous, currentIndex, strongBeat, rhythm });
        if (barIndex === 0 && noteIndex === 0) base = noteByLetter(key.tonic, 6);
        const note = makeNote(base, rhythm, barIndex, noteIndex, beat, key, chordLetters);
        notes.push(note);
        currentIndex = noteBaseIndex(base) >= 0 ? noteBaseIndex(base) : currentIndex;
        previous = base;
        beat += rhythmInfo(rhythm).beats;
      });

      return { notes, lastIndex: currentIndex };
    }

    function finalRhythmForSignature(timeSignature) {
      return FINAL_PATTERNS[timeSignature.id]?.[0] ?? "semibreve";
    }

    function buildFinalBar({ key, chordLetters, barIndex, timeSignature, previousIndex }) {
      const rhythm = finalRhythmForSignature(timeSignature);
      const previous = NOTES[previousIndex] ?? noteByLetter(key.tonic, 6);
      const tonicOptions = NOTES.filter((note) => note.letter === key.tonic);
      const base = tonicOptions.reduce((best, note) => Math.abs(note.midi - previous.midi) < Math.abs(best.midi - previous.midi) ? note : best, tonicOptions[0] ?? noteByLetter(key.tonic, previousIndex));
      return { barIndex, notes: [makeNote(base, rhythm, barIndex, 0, 0, key, chordLetters)] };
    }

    function melodyNotes(bars) {
      return bars.flatMap((bar) => bar.notes ?? []);
    }

    function longestRepeatedPitchRun(notes) {
      let longest = 1;
      let current = 1;
      for (let index = 1; index < notes.length; index += 1) {
        if (notes[index].step === notes[index - 1].step) {
          current += 1;
          longest = Math.max(longest, current);
        } else {
          current = 1;
        }
      }
      return longest;
    }

    function hasAwkwardBarlineLeap(bars) {
      return bars.some((bar, index) => {
        const nextBar = bars[index + 1];
        if (!bar?.notes?.length || !nextBar?.notes?.length) return false;
        return Math.abs(nextBar.notes[0].step - bar.notes.at(-1).step) > 3;
      });
    }

    function hasBalancedContour(notes) {
      let rises = 0;
      let falls = 0;
      for (let index = 1; index < notes.length; index += 1) {
        const interval = notes[index].step - notes[index - 1].step;
        if (interval > 0) rises += 1;
        if (interval < 0) falls += 1;
      }
      return rises > 0 && falls > 0;
    }

    function leapsRecoverByStep(notes) {
      for (let index = 1; index < notes.length - 1; index += 1) {
        const leap = notes[index].step - notes[index - 1].step;
        if (Math.abs(leap) < 2) continue;
        const recovery = notes[index + 1].step - notes[index].step;
        if (recovery === 0) continue;
        if (Math.sign(recovery) === Math.sign(leap) || Math.abs(recovery) > 1) return false;
      }
      return true;
    }

    function melodyPassesQualityRules(question) {
      const notes = melodyNotes(question.bars);
      if (notes.length < 2) return false;
      const intervals = notes.slice(1).map((note, index) => Math.abs(note.step - notes[index].step));
      const range = Math.max(...notes.map((note) => note.step)) - Math.min(...notes.map((note) => note.step));
      const first = notes[0];
      const last = notes.at(-1);

      if (first.letter !== question.key.tonic) return false;
      if (last.letter !== question.key.tonic) return false;
      if (range > 7) return false;
      if (Math.max(...intervals) > 3) return false;
      if (hasAwkwardBarlineLeap(question.bars)) return false;
      if (!hasBalancedContour(notes)) return false;
      if (!leapsRecoverByStep(notes)) return false;
      if (longestRepeatedPitchRun(notes) > 2) return false;
      return true;
    }

    function makeBars(timeSignature, key, attempt = 0) {
      const bars = [];
      let previousIndex = noteByLetter(key.tonic, 6).index;
      for (let barIndex = 0; barIndex < BAR_COUNT; barIndex += 1) {
        const chordLetters = (CHORDS[key.id] ?? CHORDS.C)[barIndex] ?? tonicChordForKey(key);
        if (barIndex === BAR_COUNT - 1) {
          const bar = buildFinalBar({ key, chordLetters, barIndex, timeSignature, previousIndex });
          previousIndex = noteBaseIndex(bar.notes[0]);
          bars.push(bar);
        } else {
          const pattern = randomItem(PATTERNS[timeSignature.id]);
          const built = buildNotesFromPattern({ key, chordLetters, pattern, barIndex, previousIndex, timeSignature });
          previousIndex = built.lastIndex;
          bars.push({ barIndex, notes: built.notes });
        }
      }

      if (key.forceGSharp && !bars.some((bar) => bar.notes.some((note) => note.letter === "G" && note.writtenAccidental === 1))) {
        const g = noteByLetter("G", 6);
        Object.assign(bars[1].notes[0], { letter: "G", octave: g.octave, step: g.step, midi: g.midi, writtenAccidental: 1 });
      }

      const question = { key, bars };
      if (!melodyPassesQualityRules(question) && attempt < 160) return makeBars(timeSignature, key, attempt + 1);
      return bars;
    }

    function baseQuestion(type, enabledAccidentals = ACCIDENTALS.map((accidental) => accidental.id),plan=null) {
      const key = plan?.key||accidentalSelection.pick(type+"/key/"+enabledAccidentals,keysForAccidentals(enabledAccidentals));
      const timeSignature = plan?.timeSignature||accidentalSelection.pick(type+"/metre",TIMES);
      return { id: exerciseRandom().toString(36).slice(2), questionType: type, oneBarMode: false, key, timeSignature, bars: makeBars(timeSignature, key), performedOrder: [0, 1, 2, 3], answerId: "sharp", required: [], choices: [], prompt: "", audioQuestionKind: null };
    }
    function qSharpFlat(base, enabledAccidentals,wanted=null) {
      const availableKinds = ["sharp", "flat"].filter((id) => enabledAccidentals.includes(id));
      if (!availableKinds.length) return qTone(base, enabledAccidentals);
      const kind = wanted||accidentalSelection.pick("sharp-flat-answer",availableKinds);
      const value = kind === "sharp" ? 1 : -1;
      const candidates = [];
      base.bars.forEach((bar) => {
        const active = {};
        bar.notes.forEach((note) => {
          const pitchKey = `${note.letter}:${note.octave}`;
          if (!Object.prototype.hasOwnProperty.call(active, pitchKey)) active[pitchKey] = keyAccidentalForLetter(base.key, note.letter);
          if (!forbidAccidental(note.letter, value) && active[pitchKey] !== value) candidates.push({ barIndex: bar.barIndex, noteIndex: note.noteIndex });
          if (note.writtenAccidental !== null && note.writtenAccidental !== undefined) active[pitchKey] = note.writtenAccidental;
        });
      });
      if (!candidates.length) return null;
      const target = randomItem(candidates);
      const note = base.bars[target.barIndex].notes[target.noteIndex];
      note.writtenAccidental = value;
      note.highlight = true;
      return { ...base, answerId: kind === "sharp" ? "raise" : "lower", prompt: kind === "sharp" ? "What does a <strong><span>sharp</span></strong> do to a <strong style=\"color: #2563eb;\">note</strong>?" : "What does a <strong><span>flat</span></strong> do to a <strong style=\"color: #2563eb;\">note</strong>?", choices: [{ id: "raise", text: "Raise by a semitone", arrow: "↑" }, { id: "lower", text: "Lower by a semitone", arrow: "↓" }] };
    }
    function qTone(base, enabledAccidentals,wanted=null) {
      const candidates = [];
      base.bars.forEach((bar) => {
        for (let i = 0; i < bar.notes.length - 1; i += 1) {
          const first = bar.notes[i];
          const second = bar.notes[i + 1];
          if (!first || !second) continue;
          const diff = Math.abs((second.midi + effectiveAccidental(base, bar.barIndex, i + 1)) - (first.midi + effectiveAccidental(base, bar.barIndex, i)));
          if (diff === 1 || diff === 2) candidates.push({ barIndex: bar.barIndex, noteIndex: i, answer: diff === 1 ? "Semitone" : "Tone" });
        }
      });
      const eligible=wanted?candidates.filter(item=>item.answer===wanted):candidates;
      if (!eligible.length) return null;
      const target = randomItem(eligible);
      base.bars[target.barIndex].notes[target.noteIndex].highlight = true;
      base.bars[target.barIndex].notes[target.noteIndex + 1].highlight = true;
      return { ...base, answerId: target.answer, prompt: "Look at the <strong style=\"color: #2563eb;\">notes</strong>. Are they a tone or a semitone apart?", choices: [{ id: "Tone", text: "Tone" }, { id: "Semitone", text: "Semitone" }] };
    }
    function qCarry(base, enabledAccidentals,wanted=null) {
      const candidates = [];
      base.bars.forEach((bar) => {
        const byLetter = {};
        bar.notes.forEach((note) => {
          const pitchKey = `${note.letter}:${note.octave}`;
          byLetter[pitchKey] = [...(byLetter[pitchKey] || []), note];
        });
        Object.values(byLetter).forEach((notes) => {
          if (notes.length < 2) return;
          const first = notes[0];
          const values = enabledAccidentalValues(enabledAccidentals).filter((value) => value !== 0 && (!wanted||accidentalId(value)===wanted) && !forbidAccidental(first.letter, value));
          if (values.length) candidates.push({ barIndex: bar.barIndex, notes, value: randomItem(values) });
        });
      });
      if (!candidates.length) return null;
      const target = accidentalSelection.least('carry-answer/'+wanted,candidates,item=>item.notes[1].letter);
      const first = target.notes[0];
      const second = target.notes[1] || first;
      const value = target.value;
      first.writtenAccidental = value;
      second.writtenAccidental=null;second.highlight = true;
      const answer = nameOf(second.letter, effectiveAccidental(base, target.barIndex, second.noteIndex));
      return { ...base, answerId: answer, prompt: `Identify the <strong style=\"color: #2563eb;\">note</strong> in <strong>bar ${target.barIndex + 1}</strong>.`, choices: noteNameChoices(answer, enabledAccidentals) };
    }
    function qKey(base, enabledAccidentals) {
      const availableKeys = keysForAccidentals(enabledAccidentals).filter((key) => {
        if (key.id === "F") return enabledAccidentals.includes("flat");
        if (key.id === "G" || key.id === "Am") return enabledAccidentals.includes("sharp");
        return false;
      });
      if (!availableKeys.length) return qTone(base, enabledAccidentals);
      const kind=accidentalSelection.pick('key-note-kind/'+enabledAccidentals,[...new Set(availableKeys.map(key=>key.id==='F'?'flat':'sharp'))]);
      const key=accidentalSelection.pick('key-note-answer/'+kind,availableKeys.filter(key=>(key.id==='F'?'flat':'sharp')===kind));
      if(key.id!==base.key.id){base.key=key;base.bars=makeBars(base.timeSignature,key);}
      const letter = base.key.id === "F" ? "B" : base.key.id === "G" ? "F" : "G";
      const value = base.key.id === "F" ? -1 : 1;
      let target = null;
      base.bars.forEach((bar) => bar.notes.forEach((note) => { if (!target && note.letter === letter) target = { barIndex: bar.barIndex, noteIndex: note.noteIndex }; }));
      if (!target) { target = { barIndex: 1, noteIndex: 0 }; const replacement = noteByLetter(letter, 6); Object.assign(base.bars[1].notes[0], replacement); }
      if (base.key.id === "Am") base.bars[target.barIndex].notes[target.noteIndex].writtenAccidental = 1;
      base.bars[target.barIndex].notes[target.noteIndex].highlight = true;
      const answer = nameOf(letter, value);
      return { ...base, answerId: answer, keySignatureReminder: true, prompt: `Identify the <strong style=\"color: #2563eb;\">note</strong> in <strong>bar ${target.barIndex + 1}</strong>.`, choices: noteNameChoices(answer, enabledAccidentals) };
    }
    function makeMultipleChoice(enabledAccidentals) {
      const builders = [qTone];
      if (enabledAccidentals.includes("sharp") || enabledAccidentals.includes("flat")) builders.push(qSharpFlat, qCarry, qKey);
      const builder=accidentalSelection.pick('choice-subtype/'+enabledAccidentals,builders.map(fn=>fn.name)),fn={qTone,qSharpFlat,qCarry,qKey}[builder];
      const wanted=builder==='qTone'?accidentalSelection.pick('tone-answer',['Tone','Semitone']):['qCarry','qSharpFlat'].includes(builder)?accidentalSelection.pick(builder+'/accidental',enabledAccidentals.filter(id=>id!=='natural')):null;
      const plan={key:accidentalSelection.pick('choice-key/'+builder+enabledAccidentals,keysForAccidentals(enabledAccidentals)),timeSignature:accidentalSelection.pick('choice-metre/'+builder,TIMES)};
      for(let attempt=0;attempt<200;attempt++){const q=fn(baseQuestion('multiple-choice',enabledAccidentals,plan),enabledAccidentals,wanted);if(q)return {...q,choiceKind:builder};}
      throw new Error('Could not generate the selected accidental question.');
    }

    function validDirection(question, barIndex, noteIndex, direction) {
      const note = question.bars[barIndex].notes[noteIndex];
      if (note.writtenAccidental != null) return null;
      const current = effectiveAccidental(question, barIndex, noteIndex);
      if (current !== keyAccidentalForLetter(question.key, note.letter)) return null;
      if (direction === "higher") { if (current === -1) return 0; if (current === 0 && !forbidAccidental(note.letter, 1)) return 1; }
      if (direction === "lower") { if (current === 1) return 0; if (current === 0 && !forbidAccidental(note.letter, -1)) return -1; }
      return null;
    }
    function makeApply(enabledAccidentals) {
      const wanted=accidentalSelection.pick("apply-answer/"+enabledAccidentals,enabledAccidentals);
      let base = null;
      let targets = [];
      for (let attempt = 0; attempt < 200 && !targets.length; attempt += 1) {
        base = baseQuestion("apply-score", enabledAccidentals);
        base.bars.forEach((bar) => bar.notes.forEach((note) => ["higher", "lower"].forEach((direction) => {
          const accidental = validDirection(base, bar.barIndex, note.noteIndex, direction);
          if (accidental !== null && accidentalId(accidental)===wanted && enabledAccidentals.includes(accidentalId(accidental)) && !hasEnharmonicConflict(bar, note, accidental)) targets.push({ barIndex: bar.barIndex, noteIndex: note.noteIndex, direction, accidental });
        })));
      }
      if (!targets.length) throw new Error("Could not create an accidental-placement question.");
      const target = randomItem(targets);
      const targetNote = base.bars[target.barIndex].notes[target.noteIndex];
      const showKeySignatureReminder = Boolean(base.key.keyAcc?.[targetNote.letter]) && target.accidental === 0;
      targetNote.highlight = true;
      const id = accidentalId(target.accidental);
      return { ...base, answerId: id, keySignatureReminder: showKeySignatureReminder, required: [{ symbolId: id, barIndex: target.barIndex, noteIndex: target.noteIndex, anchor: "before-note" }], prompt: `The <strong style=\"color: #2563eb;\">note</strong> in <strong>bar ${target.barIndex + 1}</strong> should be a <strong>semitone ${target.direction}</strong>. Apply this change to the score using a symbol from below.<br/><br/>` };
    }
    function makeAudioTwo(enabledAccidentals) {
      const safeSharps = ["C", "D", "F", "G", "A"];
      const safeFlats = ["D", "E", "G", "A", "B"];
      const wanted=accidentalSelection.pick('audio-two-answer/'+enabledAccidentals,enabledAccidentals),wantsNatural=wanted==='natural';
      let letter,start,value;
      if(wantsNatural){start=accidentalSelection.pick('natural-start',[-1,1]);letter=accidentalSelection.pick('natural-letter/'+start,start===1?safeSharps:safeFlats);value=0;}
      else{value=wanted==='sharp'?1:-1;letter=accidentalSelection.pick('audio-letter/'+wanted,value===1?safeSharps:safeFlats);start=null;}
      const base=accidentalSelection.pick('audio-pitch/'+letter,NOTES.filter(note=>note.letter===letter));
      const notes = [0, 1].map((index) => ({ id: `0-${index}`, barIndex: 0, noteIndex: index, rhythm: "crotchet", letter: base.letter, octave: base.octave, step: base.step, midi: base.midi, writtenAccidental: index === 0 ? start : null, hiddenAccidental: index === 1 ? value : null, highlight: false }));
      const id = accidentalId(value);
      return { id: exerciseRandom().toString(36).slice(2), questionType: "audio-two", oneBarMode: true, key: { id: "C", name: "No key signature", tonic: letter, keyAcc: {} }, timeSignature: { id: "2/4", top: "2", bottom: "4", beats: 2, compound: false }, bars: [{ barIndex: 0, notes }], performedOrder: [0], audioQuestionKind: "one-bar-hearing", answerId: id, required: [{ symbolId: id, barIndex: 0, noteIndex: 1, anchor: "before-note" }], choices: [], prompt: "Listen to both notes and apply the accidental to the <strong>second note</strong> based on what you hear." };
    }
    function longTargets(question) {
      const targets = [];
      question.bars.forEach((bar) => { if (bar.barIndex !== 2 && bar.barIndex !== 3) return; bar.notes.forEach((note) => { if (rhythmInfo(note.rhythm).beats >= 1) targets.push({ barIndex: bar.barIndex, noteIndex: note.noteIndex }); }); });
      return targets.length ? targets : [{ barIndex: 2, noteIndex: 1 }];
    }
    function cloneBarAsRepeat(sourceBar, targetBarIndex) {
      return { barIndex: targetBarIndex, notes: sourceBar.notes.map((note, noteIndex) => ({ ...note, id: `${targetBarIndex}-${noteIndex}`, barIndex: targetBarIndex, noteIndex, hiddenAccidental: null, highlight: false })) };
    }
    function tonicChordForKey(key) { if (key.id === "F") return ["F", "A", "C"]; if (key.id === "G") return ["G", "B", "D"]; if (key.id === "Am") return ["A", "C", "E"]; return ["C", "E", "G"]; }
    function dominantChordForKey(key) { if (key.id === "F") return ["C", "E", "G"]; if (key.id === "G") return ["D", "F#", "A"]; if (key.id === "Am") return ["E", "G#", "B"]; return ["G", "B", "D"]; }
    function chordForBar(question, barIndex) { return question.chordPlan?.[barIndex] ?? (CHORDS[question.key.id] ?? CHORDS.C)[barIndex] ?? tonicChordForKey(question.key); }
    function isStrongBeat(beat, timeSignature) { return beat === 0 || (timeSignature.id === "4/4" && beat === 2) || (timeSignature.id === "6/8" && beat === 1.5); }
    function noteFromChordTone(letter, preferred = 6) { const accidental = letter.includes("#") ? 1 : letter.includes("b") ? -1 : 0; const cleanLetter = letter[0]; const base = noteByLetter(cleanLetter, preferred); return { ...base, writtenAccidental: accidental !== 0 ? accidental : null }; }
    function accompanimentChordMidis(question, barIndex, alteration = null) {
      const chord = chordForBar(question, barIndex).map((letter) => {
        const tone = noteFromChordTone(letter, 5);
        const accidental = alteration?.letter === tone.letter ? alteration.value : (tone.writtenAccidental ?? 0);
        return tone.midi + accidental;
      });
      const [root, third, fifth] = chord;
      return { root: root - 12, third: third - 12, fifth: fifth - 12, octaveRoot: root, lowRoot: root - 24, lowThird: third - 24, lowFifth: fifth - 24, power: [root - 12, fifth - 12, root], shell: [third - 12, fifth - 12, root] };
    }

    function chordToneAccidental(letter) { return letter.includes("#") ? 1 : letter.includes("b") ? -1 : 0; }
    function accompanimentAlterationsForBar(question, barIndex) {
      const bar = question.bars[barIndex];
      const chord = chordForBar(question, barIndex);
      const starts = beatStarts(bar.notes.map((note) => note.rhythm));
      return bar.notes.flatMap((note, noteIndex) => {
        if (note.hiddenAccidental === null || note.hiddenAccidental === undefined) return [];
        const chordTone = chord.find((letter) => letter[0] === note.letter);
        if (!chordTone || chordToneAccidental(chordTone) === note.hiddenAccidental) return [];
        return [{ letter: note.letter, value: note.hiddenAccidental, start: starts[noteIndex], end: starts[noteIndex] + rhythmInfo(note.rhythm).beats }];
      });
    }

    function splitAccompanimentEventForAlterations(event, alterations) {
      const eventEnd = event.time + event.duration;
      const boundaries = [event.time, eventEnd];
      alterations.forEach((alteration) => {
        if (alteration.start > event.time && alteration.start < eventEnd) boundaries.push(alteration.start);
        if (alteration.end > event.time && alteration.end < eventEnd) boundaries.push(alteration.end);
      });
      const sorted = [...new Set(boundaries)].sort((a, b) => a - b);
      return sorted.slice(0, -1).map((start, index) => {
        const end = sorted[index + 1];
        const alteration = alterations.find((item) => start >= item.start && start < item.end) ?? null;
        return { ...event, time: start, duration: end - start, alteration };
      }).filter((segment) => segment.duration > 0.001);
    }

    // Mirrors the accompaniment style names and musical behaviour used by Practice Questions.
    function accompanimentEvents(styleId, barBeats) {
      const event = (time, duration, notes, volume = 0.014) => ({ time, duration, notes: Array.isArray(notes) ? notes : [notes], volume });
      const halfBeatPattern = (tokens) => Array.from({ length: Math.round(barBeats / 0.5) }, (_, index) => event(index * 0.5, 0.46, tokens[index % tokens.length], index % 2 === 0 ? 0.016 : 0.013));
      switch (styleId) {
        case "broken_chords": return halfBeatPattern(["root", "fifth", "octaveRoot", "fifth"]);
        case "alberti_bass": return halfBeatPattern(["root", "fifth", "third", "fifth"]);
        case "waltz": return [event(0, 0.9, "lowRoot", 0.025), ...Array.from({ length: Math.max(1, Math.floor(barBeats) - 1) }, (_, index) => event(index + 1, 0.86, ["third", "fifth", "octaveRoot"], 0.012))];
        case "piano_ballad": return [event(0, 0.9, "lowRoot", 0.024), event(Math.max(1, Math.min(2, barBeats - 1)), 0.9, "lowFifth", 0.021), ...halfBeatPattern(["third", "fifth", "octaveRoot"]).map((item) => ({ ...item, volume: item.volume * 0.72 }))];
        case "contemporary_pop": return [event(0, 0.9, "lowRoot", 0.024), ...Array.from({ length: Math.floor(barBeats) }, (_, index) => event(index + 0.5, 0.42, index % 2 ? ["third", "fifth", "octaveRoot"] : ["third", "fifth"], 0.011))];
        case "power_chords": return [...Array.from({ length: Math.floor(barBeats) }, (_, index) => event(index, 0.88, index < barBeats / 2 ? "lowRoot" : "lowFifth", 0.024)), event(0, 0.88, "power", 0.015), ...(barBeats > 2 ? [event(2, 0.88, "power", 0.014)] : [])];
        case "stride_piano": return Array.from({ length: Math.floor(barBeats) }, (_, index) => event(index, 0.88, index % 2 === 0 ? (index === 0 ? ["lowRoot", "root"] : ["lowFifth", "fifth"]) : "shell", index % 2 === 0 ? 0.024 : 0.014));
        case "walking_bass": return Array.from({ length: Math.floor(barBeats) }, (_, index) => event(index, 0.88, ["lowRoot", "lowThird", "lowFifth", "lowFifth"][index % 4], index === 0 ? 0.023 : 0.019));
        case "block_chords":
        default: return [event(0, barBeats * 0.92, "lowRoot", 0.024), event(0, barBeats * 0.92, ["third", "fifth", "octaveRoot"], 0.012)];
      }
    }
    function rebuildBarForChord(bar, chordLetters, key, timeSignature, preferredStart = 5) {
      const starts = beatStarts(bar.notes.map((note) => note.rhythm));
      let previousIndex = noteByLetter(key.tonic, preferredStart).index;
      return { ...bar, notes: bar.notes.map((note, noteIndex) => {
        const beat = starts[noteIndex];
        const strong = isStrongBeat(beat, timeSignature);
        const rhythm = note.rhythm;
        let chosen;
        if (strong) chosen = noteFromChordTone(randomItem(chordLetters), preferredStart + noteIndex);
        else if (rhythm === "quaver") { const stepDirection = exerciseRandom() < 0.5 ? -1 : 1; chosen = NOTES[clamp(previousIndex + stepDirection, 1, NOTES.length - 2)]; }
        else { const pool = exerciseRandom() < 0.65 ? chordLetters : (SCALES[key.id] ?? SCALES.C); chosen = noteFromChordTone(randomItem(pool), preferredStart + noteIndex); }
        if (!chosen) chosen = noteByLetter(key.tonic, preferredStart);
        previousIndex = chosen.index;
        return { ...note, letter: chosen.letter, octave: chosen.octave, step: chosen.step, midi: chosen.midi, writtenAccidental: chosen.writtenAccidental ?? null, hiddenAccidental: null, highlight: false };
      }) };
    }
    function makeAudioFull(enabledAccidentals) {
      const wanted = accidentalSelection.pick("audio-full-answer/" + enabledAccidentals, enabledAccidentals);
      const value = accidentalValue(wanted);
      for (let attempt = 0; attempt < 200; attempt += 1) {
        const base = baseQuestion("audio-full", enabledAccidentals);
        base.chordPlan = [dominantChordForKey(base.key), tonicChordForKey(base.key), dominantChordForKey(base.key), tonicChordForKey(base.key)];
        base.bars[0] = rebuildBarForChord(base.bars[0], base.chordPlan[0], base.key, base.timeSignature, 5);
        base.bars[1] = rebuildBarForChord(base.bars[1], base.chordPlan[1], base.key, base.timeSignature, 6);
        base.bars[2] = cloneBarAsRepeat(base.bars[0], 2);
        base.bars[3] = cloneBarAsRepeat(base.bars[1], 3);
        const candidates = longTargets(base).filter(({ barIndex, noteIndex }) => {
          const bar = base.bars[barIndex];
          const note = bar.notes[noteIndex];
          // Hiding the answer would also hide any sign written on this note.
          if (note.writtenAccidental != null) return false;
          const current = effectiveAccidental(base, barIndex, noteIndex);
          if (value === 0) return current === 1 || current === -1;
          return current === 0 && !forbidAccidental(note.letter, value) && !hasEnharmonicConflict(bar, note, value);
        });
        if (!candidates.length) continue;
        const { barIndex, noteIndex } = randomItem(candidates);
        base.bars[barIndex].notes[noteIndex].hiddenAccidental = value;
        return { ...base, audioQuestionKind: "full-score-missing", answerId: wanted, required: [{ symbolId: wanted, barIndex, noteIndex, anchor: "before-note" }], prompt: `Listen to the music and insert the missing accidental in <strong>bar ${barIndex + 1}</strong>.` };
      }
      throw new Error('Could not generate an audible accidental change.');
    }
    function makeQuestion(options = {}) {
      const enabledQuestionTypes=selection.cleanList(options.enabledQuestionTypes,DEFAULT_QUESTION_TYPES),enabledAccidentals=selection.cleanList(options.enabledAccidentals,DEFAULT_ACCIDENTALS);
      const groups=QUESTION_TYPE_OPTIONS.filter(group=>group.typeIds.some(type=>enabledQuestionTypes.includes(type))),group=accidentalSelection.pick('question-group/'+enabledQuestionTypes,groups);
      const type=accidentalSelection.pick('audio-format/'+enabledQuestionTypes,group.typeIds.filter(type=>enabledQuestionTypes.includes(type)));
      const question = type === "apply-score"
        ? makeApply(enabledAccidentals)
        : type === "audio-two"
          ? makeAudioTwo(enabledAccidentals)
          : type === "audio-full"
            ? makeAudioFull(enabledAccidentals)
            : makeMultipleChoice(enabledAccidentals);
      return { ...question,questionGroup:group.id, accompanimentPattern: accidentalSelection.pick("accompaniment",ACCOMPANIMENT_PATTERNS) };
    }

    function questionAudio(original){
     function note(midi,start,duration,volume){return {midi,start,duration,volume};}
     const beat=60/(original.questionType==='audio-two'?32:76),notes=[];
     let time=0;
     for(const barIndex of original.performedOrder){
      const bar=original.bars[barIndex];
      const barStart=time;
      const starts=beatStarts(bar.notes.map(item=>item.rhythm));
      for(const [i,item] of bar.notes.entries()){
       const duration=rhythmInfo(item.rhythm).beats*beat;
       notes.push(note(item.midi+effectiveAccidental(original,barIndex,i),barStart+starts[i]*beat,duration,original.audioQuestionKind === 'one-bar-hearing' ? .11 : .075));
      }
      const alterations=accompanimentAlterationsForBar(original,barIndex);
      for(const event of accompanimentEvents(original.accompanimentPattern,original.timeSignature.beats)){
       for(const part of splitAccompanimentEventForAlterations(event,alterations)){
        const chord=accompanimentChordMidis(original,barIndex,part.alteration);
        for(const pitch of part.notes.flatMap(token=>chord[token]??[]))notes.push(note(pitch,barStart+part.time*beat,part.duration*beat,part.volume));
       }
      }
      time+=bar.notes.reduce((sum,item)=>sum+rhythmInfo(item.rhythm).beats,0)*beat;
     }
     return {kind:'notes',notes,duration:time,mix:'accidentals'};
    }

    return { ACCIDENTALS, DEFAULT_ACCIDENTALS, DEFAULT_QUESTION_TYPES, QUESTION_TYPE_OPTIONS, makeQuestion, makeMultipleChoice, questionAudio, rhythmInfo, taskMatchesLevel, accidentalId, midiFreq, effectiveAccidental, beatStarts, accompanimentChordMidis, accompanimentAlterationsForBar, splitAccompanimentEventForAlterations, accompanimentEvents };
  }
  return {create};
});
