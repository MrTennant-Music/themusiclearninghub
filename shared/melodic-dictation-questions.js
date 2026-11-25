// Question selection shared by individual practice and hosted Melodic Dictation.
(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("../melodic-dictation-generator.js"), require("./melodic-dictation-selection.js"));
  } else {
    root.MLH.MelodicDictationQuestions = factory(root.MLH.MelodicDictation, root.MELODIC_DICTATION_SELECTION);
  }
})(typeof window === "object" ? window : globalThis, function(generator, selection) {
  "use strict";
  const MIN_DISPLAY_STEP = -4;
  const MAX_DISPLAY_STEP = 12;
  const clefStepOffset = clef => clef === "bass" ? 12 : 0;
  const displayStep = (note, clef) => (note?.step ?? 0) + clefStepOffset(clef);

  function create(exerciseRandom = Math.random) {
    const {
      NOTE_POOL, KEYS, LEVEL_KEY_IDS, clamp, randomItem, noteBaseIndex, melodicAccidentalForLetter,
      makeCompletionQuestion, makeEightBarRepetitionQuestion, timeSignaturesForLevel,
    } = generator.create(exerciseRandom);

    function noteInClefRange(note, clef) {
      const step = displayStep(note, clef);
      return step >= MIN_DISPLAY_STEP && step <= MAX_DISPLAY_STEP;
    }

    function fitNoteToClefRange(note, clef, key) {
      if (!note || note.rest || noteInClefRange(note, clef)) return note;
      let index = noteBaseIndex(note);
      if (index < 0) return note;
      let fitted = NOTE_POOL[index];
      let guard = 0;
      while (displayStep(fitted, clef) > MAX_DISPLAY_STEP && NOTE_POOL[index - 7] && guard < 4) {
        index -= 7;
        fitted = NOTE_POOL[index];
        guard += 1;
      }
      while (displayStep(fitted, clef) < MIN_DISPLAY_STEP && NOTE_POOL[index + 7] && guard < 8) {
        index += 7;
        fitted = NOTE_POOL[index];
        guard += 1;
      }
      if (!noteInClefRange(fitted, clef)) {
        const sameLetter = NOTE_POOL
          .filter((candidate) => candidate.letter === note.letter && noteInClefRange(candidate, clef))
          .sort((a, b) => Math.abs(displayStep(a, clef) - displayStep(note, clef)) - Math.abs(displayStep(b, clef) - displayStep(note, clef)));
        fitted = sameLetter[0] ?? fitted;
      }
      return { ...note, ...fitted, writtenAccidental: melodicAccidentalForLetter(key, fitted.letter) };
    }

    function fitBarsToClefRange(bars, clef, key) {
      bars.forEach((bar) => {
        bar.notes = bar.notes.map((note) => fitNoteToClefRange(note, clef, key));
      });
      return bars;
    }

    function shuffleItems(items) {
      const next = [...items];
      for (let index = next.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(exerciseRandom() * (index + 1));
        [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      }
      return next;
    }

    function cloneBarsForOption(bars, optionId) {
      const totalBars = bars.length;
      return bars.map((bar, barIndex) => ({
        ...bar,
        barIndex,
        totalBars,
        notes: bar.notes.map((note, noteIndex) => ({
          ...note,
          id: `${optionId}-${barIndex}-${noteIndex}`,
          barIndex,
          noteIndex,
        })),
      }));
    }

    function mutateNotePitch(note, key, direction = 0) {
      if (note?.rest) return note;
      const currentIndex = noteBaseIndex(note);
      const offsets = direction ? [direction] : shuffleItems([-1, 1]);
      for (const offset of offsets) {
        const base = NOTE_POOL[currentIndex + offset];
        if (!base) continue;
        return {
          ...note,
          ...base,
          writtenAccidental: melodicAccidentalForLetter(key, base.letter),
        };
      }
      return note;
    }

    function canUseForMelodyVariant(bars, bar, note, noteIndex) {
      if (!note) return false;
      const isFirstNote = bar.barIndex === 0 && noteIndex === 0;
      const isFinalNote = bar.barIndex === bars.length - 1 && noteIndex === bar.notes.length - 1;
      return !note.rest && !note.tieToNext && !note.tiedFromPrevious && !isFirstNote && !isFinalNote;
    }

    function makeMelodyVariantCell(bars, candidates) {
      const cells = [];
      candidates.forEach(({ bar, noteIndex }) => {
        const cell = [{ bar, noteIndex }];
        let nextIndex = noteIndex + 1;
        while (cell.length < 3 && canUseForMelodyVariant(bars, bar, bar.notes[nextIndex], nextIndex)) {
          cell.push({ bar, noteIndex: nextIndex });
          nextIndex += 1;
        }
        if (cell.length >= 2) cells.push(cell);
      });
      return randomItem(cells) ?? null;
    }

    function reshapeMelodyVariantCell(cell, key) {
      if (!cell || cell.length < 2) return false;
      const first = cell[0].bar.notes[cell[0].noteIndex];
      const firstIndex = noteBaseIndex(first);
      if (firstIndex < 0) return false;
      const second = cell[1].bar.notes[cell[1].noteIndex];
      const originalDirection = Math.sign(noteBaseIndex(second) - firstIndex);
      const possibleDirections = [-1, 1].filter((direction) => {
        const endIndex = firstIndex + direction * (cell.length - 1);
        return endIndex >= 0 && endIndex < NOTE_POOL.length;
      });
      const oppositeDirection = originalDirection ? -originalDirection : 0;
      const direction = oppositeDirection && possibleDirections.includes(oppositeDirection) && exerciseRandom() < 0.72
        ? oppositeDirection
        : randomItem(possibleDirections.length ? possibleDirections : [-1, 1]);
      let previousIndex = firstIndex;
      let changed = false;

      cell.slice(1).forEach(({ bar, noteIndex }, index) => {
        const current = bar.notes[noteIndex];
        const currentIndex = noteBaseIndex(current);
        const stepSize = index === 0 && exerciseRandom() < 0.68 ? 2 : 1;
        const targetIndex = clamp(previousIndex + direction * stepSize, 0, NOTE_POOL.length - 1);
        const base = NOTE_POOL[targetIndex];
        if (!base) return;
        if (targetIndex !== currentIndex) changed = true;
        bar.notes[noteIndex] = {
          ...current,
          ...base,
          writtenAccidental: melodicAccidentalForLetter(key, base.letter),
        };
        previousIndex = targetIndex;
      });

      return changed;
    }

    function transposeMelodyVariantCell(cell, key) {
      if (!cell || cell.length < 2) return false;
      const intervals = [-2, -2, -2, 2, 2, -3, 3, -4, 4];
      const interval = randomItem(intervals);
      const replacements = [];

      for (const { bar, noteIndex } of cell) {
        const current = bar.notes[noteIndex];
        const currentIndex = noteBaseIndex(current);
        const targetIndex = currentIndex + interval;
        if (currentIndex < 0 || targetIndex < 0 || targetIndex >= NOTE_POOL.length) return false;
        replacements.push({ bar, noteIndex, current, base: NOTE_POOL[targetIndex] });
      }

      replacements.forEach(({ bar, noteIndex, current, base }) => {
        bar.notes[noteIndex] = {
          ...current,
          ...base,
          writtenAccidental: melodicAccidentalForLetter(key, base.letter),
        };
      });

      return true;
    }

    function makeMelodyVariantBars(correctBars, key, variantId) {
      const bars = cloneBarsForOption(correctBars, variantId);
      const candidates = [];
      bars.forEach((bar) => {
        bar.notes.forEach((note, noteIndex) => {
          if (canUseForMelodyVariant(bars, bar, note, noteIndex)) candidates.push({ bar, noteIndex });
        });
      });

      const used = new Set();
      const variantCell = exerciseRandom() < 0.9 ? makeMelodyVariantCell(bars, candidates) : null;
      if (variantCell) {
        const transposed = exerciseRandom() < 0.62 && transposeMelodyVariantCell(variantCell, key);
        const reshaped = !transposed && exerciseRandom() < 0.82 && reshapeMelodyVariantCell(variantCell, key);
        if (!transposed && !reshaped) {
          const direction = randomItem([-1, 1]);
          variantCell.forEach(({ bar, noteIndex }) => {
            bar.notes[noteIndex] = mutateNotePitch(bar.notes[noteIndex], key, direction);
          });
        }
        variantCell.forEach(({ bar, noteIndex }) => used.add(`${bar.barIndex}:${noteIndex}`));
      }

      const targetChanges = Math.min(candidates.length, exerciseRandom() < 0.5 ? 3 : 4);
      shuffleItems(candidates)
        .filter(({ bar, noteIndex }) => !used.has(`${bar.barIndex}:${noteIndex}`))
        .slice(0, Math.max(0, targetChanges - used.size))
        .forEach(({ bar, noteIndex }, index) => {
          const direction = index % 2 === 0 ? randomItem([-1, 1]) : 0;
          bar.notes[noteIndex] = mutateNotePitch(bar.notes[noteIndex], key, direction);
        });

      return bars;
    }

    function canTieAcrossBeat(first, second, timeSignature) {
      if (first?.rhythm !== "quaver") return false;
      if (!["crotchet", "minim", "dottedCrotchet"].includes(second?.rhythm)) return false;
      const beatUnit = timeSignature?.id === "6/8" ? 1.5 : 1;
      const tiePoint = first.beat + first.beats;
      const startsNextExactly = Math.abs(second.beat - tiePoint) < 0.001;
      const crossesBeatGroup = Math.abs(tiePoint / beatUnit - Math.round(tiePoint / beatUnit)) < 0.001;
      return startsNextExactly && crossesBeatGroup;
    }

    function addTieToAhBars(bars, key, timeSignature) {
      const candidates = [];
      bars.forEach((bar) => {
        bar.notes.forEach((note, noteIndex) => {
          const next = bar.notes[noteIndex + 1];
          if (note?.rest || next?.rest || !next) return;
          if (!canTieAcrossBeat(note, next, timeSignature)) return;
          candidates.push({ bar, noteIndex });
        });
      });
      if (!candidates.length) return bars;
      const { bar, noteIndex } = randomItem(candidates);
      const first = bar.notes[noteIndex];
      const second = bar.notes[noteIndex + 1];
      bar.notes[noteIndex] = { ...first, tieToNext: true };
      bar.notes[noteIndex + 1] = {
        ...second,
        ...NOTE_POOL[noteBaseIndex(first)],
        writtenAccidental: melodicAccidentalForLetter(key, first.letter),
        tiedFromPrevious: true,
      };
      return bars;
    }

    function barsSignature(bars) {
      return bars.map((bar) => bar.notes.map((note) => `${note.rest ? "R" : note.step}:${note.rhythm}:${note.tieToNext ? "tie" : ""}`).join(",")).join("|");
    }

    function makeIdentifyMelodyQuestion(level = "AH", plan = null) {
      const useShortExtract = exerciseRandom() < 0.28;
      const base = makeCompletionQuestion(level, 0, useShortExtract, null, plan);
      const clef = level === "AH" ? melodicChoice("AH-clef", ["bass","treble"]) : base.clef ?? "treble";
      const sourceBars = useShortExtract ? base.bars.slice(0, 2) : base.bars;
      const correctBars = cloneBarsForOption(sourceBars, "correct");
      if (level === "AH" && exerciseRandom() < 0.28) addTieToAhBars(correctBars, base.key, base.timeSignature);
      if (clef === "bass") {
        correctBars.forEach((bar) => {
          bar.notes = bar.notes.map((note) => {
            if (note.rest) return note;
            const lower = NOTE_POOL[clamp(noteBaseIndex(note) - 7, 0, NOTE_POOL.length - 1)];
            return { ...note, ...lower, writtenAccidental: melodicAccidentalForLetter(base.key, lower.letter) };
          });
        });
      }
      fitBarsToClefRange(correctBars, clef, base.key);
      const options = [{ id: "correct", bars: correctBars, correct: true }];
      const seen = new Set([barsSignature(correctBars)]);

      let attempts = 0;
      while (options.length < 3 && attempts < 40) {
        attempts += 1;
        const variantBars = makeMelodyVariantBars(correctBars, base.key, `variant-${options.length}-${attempts}`);
        fitBarsToClefRange(variantBars, clef, base.key);
        const signature = barsSignature(variantBars);
        if (seen.has(signature)) continue;
        seen.add(signature);
        options.push({ id: `variant-${options.length}`, bars: variantBars, correct: false });
      }

      // Guarantee that every printed distractor differs after range fitting.
      for (let attempt=0;options.length<3&&attempt<120;attempt++) {
        const bars=makeMelodyVariantBars(correctBars,base.key,`fallback-${attempt}`);fitBarsToClefRange(bars,clef,base.key);
        const signature=barsSignature(bars);if(seen.has(signature))continue;seen.add(signature);options.push({id:`variant-${options.length}`,bars,correct:false});
      }
      if(options.length<3)throw new Error("Could not create three distinct melody choices.");
      const shuffledOptions=shuffleItems(options.filter(option=>!option.correct));
      shuffledOptions.splice(melodicChoice("AH-answer",[0,1,2]),0,options.find(option=>option.correct));
      return {
        ...base,
        questionType: "identifyMelody",
        clef,
        targetBar: null,
        bars: correctBars,
        options: shuffledOptions,
        selectedOptionIndex: null,
        answerIndex: shuffledOptions.findIndex((option) => option.correct),
        prompt: "Listen to the music and select the melody that matches what you hear.",
      };
    }

    const melodicChoice=selection.createPicker(exerciseRandom);
    const recentMelodies=[];
    function makeQuestion(level="N5", identifyOnly = false) {
      const mode=level==="N3"?"repetition":level==="N4"?"sequence":level==="N5"?melodicChoice("N5-mode",["repetition","sequence"]):melodicChoice(level+"-mode",["repetition","sequence","repetition","sequence","free"]);
      const eightBars=["N3","N5"].includes(level)&&mode==="repetition"&&melodicChoice(level+"-length",[false,true]);
      const keyIds=LEVEL_KEY_IDS[level]||["C"];
      const keyId=melodicChoice(level+"-key",keyIds);
      const key=KEYS.find(key=>key.id===keyId);
      const plan={mode,key,timeSignature:melodicChoice(level+"-metre",timeSignaturesForLevel(level)),targetBar:melodicChoice(level+(eightBars?"-eight-target":"-target"),eightBars?[4,5]:level==="N3"?[0,1,2,3]:[1,2])};
      let question;
      for(let attempt=0;attempt<16;attempt++){
        question=level==="AH"||identifyOnly?makeIdentifyMelodyQuestion(level,plan):eightBars?makeEightBarRepetitionQuestion(level,0,key,plan):makeCompletionQuestion(level,0,false,key,plan);
        const signature=JSON.stringify([level,question.key.id,question.timeSignature.id,question.clef,question.targetBar,barsSignature(question.bars)]);
        if(!recentMelodies.includes(signature)){recentMelodies.push(signature);if(recentMelodies.length>24)recentMelodies.shift();break;}
      }
      return question;
    }

    return { makeQuestion, makeIdentifyMelodyQuestion, barsSignature };
  }

  return { create, MIN_DISPLAY_STEP, MAX_DISPLAY_STEP, clefStepOffset, displayStep };
});
