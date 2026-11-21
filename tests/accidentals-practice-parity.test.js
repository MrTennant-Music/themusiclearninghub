const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "..", "accidentals.html"), "utf8");
const practiceSource = fs.readFileSync(path.join(__dirname, "..", "practicequestions.html"), "utf8");

function accidentalDisplayHelper(pageSource, endMarker) {
  const start = pageSource.indexOf("function accidentalDisplayValuesForBar");
  const end = pageSource.indexOf(endMarker, start);
  assert.notEqual(start, -1, "accidental display helper is present");
  assert.notEqual(end, -1, "accidental display helper has a stable extraction boundary");
  return new Function(`${pageSource.slice(start, end)}; return accidentalDisplayValuesForBar;`)();
}

function exerciseAccidentalRules(displayValues) {
  const note = (letter, octave, writtenAccidental, extra = {}) => ({ letter, octave, writtenAccidental, hiddenAccidental: null, ...extra });
  assert.deepEqual(displayValues([
    note("G", 4, 1),
    note("G", 4, 1),
  ]), [1, null], "a repeated G-sharp in the same bar inherits the first sharp");
  assert.deepEqual(displayValues([
    note("F", 4, 1),
    note("F", 4, 0),
    note("F", 4, 1),
  ]), [1, 0, 1], "each genuine accidental change remains visible");
  assert.deepEqual(displayValues([
    note("F", 4, 1),
    note("F", 5, 1),
  ]), [1, 1], "an accidental does not carry into another octave");
  assert.deepEqual(displayValues([note("F", 4, 1)], { F: 1 }), [null], "the key signature supplies the bar-start accidental");
  assert.deepEqual(displayValues([note("F", 4, 0)], { F: 1 }), [0], "a natural cancelling the key signature is shown");
  assert.deepEqual(displayValues([note("G", 4, null, { hiddenAccidental: 1 }), note("G", 4, 1)]), [null, null], "a missing accidental still governs the following same-pitch note");
  assert.deepEqual(displayValues([note("G", 4, 1)]), [1], "calling the helper for the next bar resets accidental state");
}

test("Accidentals and Practice Questions follow the same per-pitch, per-bar accidental rules", () => {
  exerciseAccidentalRules(accidentalDisplayHelper(source, "function accidentalPreSpacingForValue"));
  exerciseAccidentalRules(accidentalDisplayHelper(practiceSource, "function accidentalPreSpacingForValue"));
});

test("Accidentals uses the Practice Questions engraving grid and rhythmic spacing", () => {
  assert.match(source, /left: 78,[\s\S]*right: 842,[\s\S]*top: 82,[\s\S]*gap: 11/);
  assert.match(source, /semibreve: \{ beats: 4, spacing: 3\.4/);
  assert.match(source, /dottedMinim: \{ beats: 3, spacing: 2\.75/);
  assert.match(source, /minim: \{ beats: 2, spacing: 2\.15/);
  assert.match(source, /crotchet: \{ beats: 1, spacing: 1\.35/);
  assert.match(source, /quaver: \{ beats: 0\.5, spacing: 0\.95/);
  assert.match(source, /accidentalDisplayValuesForBar/);
  assert.match(source, /accidentalPreSpacingForValue/);
  assert.doesNotMatch(source, /translate\(-410 -120\) scale\(2\)/);
  assert.doesNotMatch(source, /oneBarStaffFade/);
});

test("Every score retains key and time signatures and an explicit final barline", () => {
  assert.doesNotMatch(source, /function KeySignature\([^\n]+oneBarMode/);
  assert.match(source, /\{index === 0 && <TimeSignatureGlyph/);
  assert.match(source, /const finalBarIndex = question\.bars\.length - 1/);
  assert.match(source, /layout\.barIndex === finalBarIndex/);
  assert.match(source, /strokeWidth="4"/);
});

test("Upward quaver stems and beams receive the half-pixel optical nudge", () => {
  assert.match(source, /const UPWARD_QUAVER_NUDGE_X = 0\.5/);
  assert.match(source, /const xOffset = STAFF\.gap \* Number\(settings\.xOffsetScale \|\| 0\) \+ \(down \? 0 : UPWARD_QUAVER_NUDGE_X\)/);
  assert.match(source, /const noteX = layout\.positions\[index\]/);
  assert.match(source, /stemData\(visualNote\(note\), noteX \+ beam\.xOffset/);
  assert.match(source, /forcedStemXOffset=\{beam \? beam\.xOffset : 0\}/);
  assert.doesNotMatch(source, /const noteX = beam \? layout\.positions\[index\] \+ beam\.xOffset/);
  assert.match(practiceSource, /const UPWARD_QUAVER_NUDGE_X = 0\.5/);
  assert.match(practiceSource, /const xOffset = STAFF\.gap \* Number\(settings\.xOffsetScale \|\| 0\) \+ \(down \? 0 : UPWARD_QUAVER_NUDGE_X \* visualScale\)/);
  assert.match(practiceSource, /getStem\(positions\[index\] \+ beam\.xOffset/);
  assert.match(practiceSource, /forcedStemXOffset=\{beam\?\.xOffset \?\? 0\}/);
});

test("Accidental controls share accessible labels and fixed desktop sizing", () => {
  assert.match(source, /aria-label=\{accidental\.name\}/);
  assert.match(source, /answer-choice-button flex h-\[74px\] w-\[120px\]/);
  assert.match(source, /<svg viewBox="0 0 90 70"[^>]+aria-hidden="true">/);
  assert.doesNotMatch(source, /\b(?:sm|md):/);
});

test("Multiple-choice answers remain in one row sized to their answer count", () => {
  assert.match(source, /\.accidentals-choice-grid\s*\{[\s\S]*?display:\s*grid;[\s\S]*?gap:\s*0\.5rem/);
  assert.match(source, /className="accidentals-choice-grid mt-5"/);
  assert.match(source, /gridTemplateColumns:\s*`repeat\(\$\{question\.choices\.length\}, minmax\(0, 1fr\)\)`/);
  assert.match(source, /className=\{`min-h-\[56px\] min-w-0 flex items-center justify-center/);
});

test("Audio uses the Practice Questions accompaniment styles and toggles to Stop", () => {
  for (const style of ["block_chords", "broken_chords", "alberti_bass", "waltz", "piano_ballad", "contemporary_pop", "power_chords", "stride_piano", "walking_bass"]) {
    assert.match(source, new RegExp(`\\"${style}\\"`));
  }
  assert.match(source, /if \(playing \|\| audioContext\.current\) \{ stopAudio\(\); return; \}/);
  assert.match(source, /playing \? "Stop audio" : "Play audio"/);
  assert.match(source, /playing \? "is-stop" : "is-play"/);
  assert.match(source, /playing \? "Stop" : "Play"/);
  assert.doesNotMatch(source, /disabled=\{playing\}/);
});

test("A chord-tone accidental changes harmony only while that melody note sounds", () => {
  const start = source.indexOf("function accompanimentChordMidis");
  const end = source.indexOf("// Mirrors the accompaniment style names", start);
  const harmonyHelpers = source.slice(start, end);
  const midi = { C: 60, D: 62, E: 64, F: 65, G: 67, A: 69, B: 71 };
  const makeHelpers = new Function("chordForBar", "noteFromChordTone", "beatStarts", "rhythmInfo", `${harmonyHelpers}; return { accompanimentChordMidis, accompanimentAlterationsForBar, splitAccompanimentEventForAlterations };`);
  const helpers = makeHelpers(
    (question, barIndex) => question.chordPlan[barIndex],
    (letter) => ({ letter: letter[0], midi: midi[letter[0]], writtenAccidental: letter.includes("#") ? 1 : letter.includes("b") ? -1 : null }),
    (rhythms) => { let beat = 0; return rhythms.map((rhythm) => { const startBeat = beat; beat += rhythm === "minim" ? 2 : 1; return startBeat; }); },
    (rhythm) => ({ beats: rhythm === "minim" ? 2 : 1 }),
  );
  const question = {
    chordPlan: [["G", "B", "D"]],
    bars: [{ notes: [
      { letter: "G", rhythm: "crotchet", hiddenAccidental: null },
      { letter: "B", rhythm: "crotchet", hiddenAccidental: -1 },
      { letter: "D", rhythm: "minim", hiddenAccidental: null },
    ] }],
  };
  const alterations = helpers.accompanimentAlterationsForBar(question, 0);
  assert.deepEqual(alterations, [{ letter: "B", value: -1, start: 1, end: 2 }]);
  const normal = helpers.accompanimentChordMidis(question, 0);
  const altered = helpers.accompanimentChordMidis(question, 0, alterations[0]);
  assert.equal(altered.third, normal.third - 1, "G major changes to G minor at the B-flat");
  const segments = helpers.splitAccompanimentEventForAlterations({ time: 0, duration: 4, notes: ["third"], volume: 0.01 }, alterations);
  assert.deepEqual(segments.map((segment) => [segment.time, segment.duration, segment.alteration?.value ?? null]), [[0, 1, null], [1, 1, -1], [2, 2, null]]);
  for (const event of [
    { time: 0, duration: 0.9, notes: ["third"] },
    { time: 0.5, duration: 0.9, notes: ["third"] },
    { time: 1, duration: 0.9, notes: ["third"] },
  ]) {
    const timed = helpers.splitAccompanimentEventForAlterations(event, alterations);
    assert.ok(timed.filter((segment) => segment.alteration).every((segment) => segment.time >= alterations[0].start), "altered harmony never starts before the melody accidental");
  }
  const nonChordQuestion = { ...question, bars: [{ notes: [{ letter: "E", rhythm: "crotchet", hiddenAccidental: -1 }] }] };
  assert.deepEqual(helpers.accompanimentAlterationsForBar(nonChordQuestion, 0), []);
  assert.match(source, /const barStartTime = time;[\s\S]*const melodyStarts = beatStarts/);
  assert.match(source, /playPianoFrequency\?\.\(context, master,[\s\S]*barStartTime \+ melodyStarts\[noteIndex\] \* beat/);
  assert.match(source, /playChord\(context, master, notes, barStartTime \+ segment\.time \* beat/);
  assert.doesNotMatch(source, /item\.start - 0\.001/);
});
