const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "..", "accidentals.html"), "utf8");
const notationSource = fs.readFileSync(path.join(__dirname, "..", "shared", "accidentals-notation.jsx"), "utf8");
const coreSource = fs.readFileSync(path.join(__dirname, "..", "shared", "accidentals-question-core.js"), "utf8");
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
  exerciseAccidentalRules(accidentalDisplayHelper(notationSource, "function accidentalPreSpacingForValue"));
  exerciseAccidentalRules(accidentalDisplayHelper(practiceSource, "function accidentalPreSpacingForValue"));
});

test("Accidentals uses the Practice Questions engraving grid and rhythmic spacing", () => {
  assert.match(notationSource, /left: 78,[\s\S]*right: 842,[\s\S]*top: 82,[\s\S]*gap: 11/);
  assert.match(coreSource, /semibreve: \{ beats: 4, spacing: 3\.4/);
  assert.match(coreSource, /dottedMinim: \{ beats: 3, spacing: 2\.75/);
  assert.match(coreSource, /minim: \{ beats: 2, spacing: 2\.15/);
  assert.match(coreSource, /crotchet: \{ beats: 1, spacing: 1\.35/);
  assert.match(coreSource, /quaver: \{ beats: 0\.5, spacing: 0\.95/);
  assert.match(notationSource, /accidentalDisplayValuesForBar/);
  assert.match(notationSource, /accidentalPreSpacingForValue/);
  assert.doesNotMatch(notationSource, /translate\(-410 -120\) scale\(2\)/);
  assert.doesNotMatch(notationSource, /oneBarStaffFade/);
});

test("Full scores retain key and time signatures and an explicit final barline", () => {
  assert.doesNotMatch(notationSource, /function KeySignature\([^\n]+oneBarMode/);
  assert.match(notationSource, /\{!compact && <>\s*<KeySignature[^>]*\/>\s*<TimeSignatureGlyph/);
  assert.match(notationSource, /const finalBarIndex = question\.bars\.length - 1/);
  assert.match(notationSource, /layout\.barIndex === finalBarIndex/);
  assert.match(notationSource, /strokeWidth="4"/);
});

test("Upward quaver stems and beams receive the half-pixel optical nudge", () => {
  assert.match(notationSource, /const UPWARD_QUAVER_NUDGE_X = 0\.5/);
  assert.match(notationSource, /const xOffset = STAFF\.gap \* Number\(settings\.xOffsetScale \|\| 0\) \+ \(down \? 0 : UPWARD_QUAVER_NUDGE_X\)/);
  assert.match(notationSource, /const noteX = layout\.positions\[index\]/);
  assert.match(notationSource, /stemData\(visualNote\(note\), noteX \+ beam\.xOffset/);
  assert.match(notationSource, /forcedStemXOffset=\{beam \? beam\.xOffset : 0\}/);
  assert.doesNotMatch(notationSource, /const noteX = beam \? layout\.positions\[index\] \+ beam\.xOffset/);
  assert.match(practiceSource, /const UPWARD_QUAVER_NUDGE_X = 0\.5/);
  assert.match(practiceSource, /const xOffset = STAFF\.gap \* Number\(settings\.xOffsetScale \|\| 0\) \+ \(down \? 0 : UPWARD_QUAVER_NUDGE_X \* visualScale\)/);
  assert.match(practiceSource, /getStem\(positions\[index\] \+ beam\.xOffset/);
  assert.match(practiceSource, /forcedStemXOffset=\{beam\?\.xOffset \?\? 0\}/);
});

test("Accidental controls share accessible labels and fixed desktop sizing", () => {
  assert.match(notationSource, /aria-label=\{accidental\.name\}/);
  assert.match(notationSource, /answer-choice-button flex h-\[74px\] w-\[120px\]/);
  assert.match(notationSource, /<svg viewBox="0 0 90 70"[^>]+aria-hidden="true">/);
  assert.doesNotMatch(source, /\b(?:sm|md):/);
});

test("Multiple-choice answers remain in one row sized to their answer count", () => {
  assert.match(notationSource, /className="mt-5 grid gap-2"/);
  assert.match(notationSource, /gridTemplateColumns:\s*`repeat\(\$\{question\.choices\.length\}, minmax\(0, 1fr\)\)`/);
  assert.match(notationSource, /className=\{`min-h-\[56px\] min-w-0 flex items-center justify-center/);
  const hosted=fs.readFileSync(path.join(__dirname,"..","host.html"),"utf8");
  for(const page of [source,hosted]){
    assert.match(page, /<QuestionScore\b/);
    assert.match(page, /<QuestionPanel\b/);
  }
  assert.match(notationSource, /item\.arrow[\s\S]*?item\.id === "raise" \? "-rotate-90" : "rotate-90"/);
});

test("Audio uses the Practice Questions accompaniment styles and toggles to Stop", () => {
  for (const style of ["block_chords", "broken_chords", "alberti_bass", "waltz", "piano_ballad", "contemporary_pop", "power_chords", "stride_piano", "walking_bass"]) {
    assert.match(coreSource, new RegExp(`\\"${style}\\"`));
  }
  assert.match(source, /if \(playing \|\| audioContext\.current\) \{ stopAudio\(\); return; \}/);
  assert.match(notationSource, /playing \? "Stop audio" : "Play audio"/);
  assert.match(notationSource, /playing \? "is-stop" : "is-play"/);
  assert.match(notationSource, /playing \? "Stop" : "Play"/);
  assert.doesNotMatch(source, /disabled=\{playing\}/);
});

test("A chord-tone accidental changes harmony only while that melody note sounds", () => {
  const helpers = require("../shared/accidentals-question-core.js").create();
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
  const audioQuestion=helpers.makeQuestion({enabledQuestionTypes:['audio-two'],enabledAccidentals:['sharp']});
  const audio=helpers.questionAudio(audioQuestion);
  assert.deepEqual(audio.notes.slice(0,2).map(note=>note.start),[0,60/32]);
  assert.match(source, /const audio = questionAudio\(question\)/);
  assert.match(source, /startTime \+ note\.start, note\.duration, note\.volume/);
});
