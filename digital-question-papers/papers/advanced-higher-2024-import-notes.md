# Advanced Higher Music 2024 import notes

## Source inventory

- Question paper: `exampapers/adv higher/2024/Music AH 2024 Paper.pdf`
- Marking instructions: `exampapers/adv higher/2024/Music AH 2024 Answers.pdf`
- Question audio: official tracks 02–07 in the same source folder.
- The paper contains 40 marks distributed as 6, 5, 7, 4, 8 and 10.
- The digital paper omits candidate-identification, barcode, official-use and blank print material while retaining the assessed wording, order, marks and answer structures.

## Audio calibration

- Every question track was transcribed locally with Whisper before markers were set. Question 4 was transcribed separately with the local `small.en` model because the earlier batch deliberately skipped literacy tracks.
- Markers use the established small lead-in convention and were checked against the spoken cue boundaries.
- The regression test protects 27 markers, chronological order and the measured bounds of all six tracks.
- Measured track durations, in Questions 1–6 order, are 441.015986, 573.764989, 458.593991, 362.996984, 576.713991 and 1941.49 seconds.

## Notation transcription audit

- Official pages 4, 6, 10, 11 and 14 were independently re-rendered at 600 dpi on 1 November 2026. Each printed system was examined separately and the notehead centres were read from close crops rather than the whole-page preview.
- Question 2(a) is in G major and 3/4, with a two-quaver anacrusis and twelve complete bars. The cadence box covers bars 4–5. Valid melisma labels are bars 1, 3, 4 and 11.
- Question 2(c) continues with bars 9–23. E minor begins at bar 13. The physical accidental in bar 17 is a sharp before D on the fourth line.
- Question 4(a) is in F major and 4/4. The enharmonic source is C-sharp and the required answer is D-flat. The two notes in bar 6 form a diminished fifth (tritone).
- Question 4(b) contains bars 24–36. The omitted bar-25 notes are C5, B-flat4 and A4 as a crotchet triplet. Bar 30 contains E-flat4 followed by tied B-flat3 notes; the bass-clef answer is E-flat3, B-flat2, B-flat2 with the tie retained.
- Question 5(e) contains three complete four-bar one-line percussion choices. The third choice is the official answer.
- The re-audit found that the earlier digital transcription had placed almost every Question 2 note a diatonic third too high, while leaving the assessed D in bar 17 at the correct height. It also found that Question 4(a) bars 6 and 7 were one diatonic step too low. Those pitches were corrected directly from the 600 dpi notehead centres.
- Every complete bar is protected by both a rhythmic-total assertion and an exact pitch-and-rhythm inventory assertion. The notation inventories also have fixed SHA-256 regression hashes.

## Marking decisions and edge cases

- Question 2(b) earns its single mark only when all three chords are correct and in order: G first inversion, C major and D major. The official Roman-numeral alternatives are accepted.
- Question 3(d) accepts Electronic Dance Music, EDM and electronic dance; the printed exclusions for “electric” wording remain rejected.
- Question 4(a)(ii) accepts diminished fifth or tritone, but not fifth alone or augmented fourth.
- Question 4 notation answers require the complete pitch sequence. Enharmonic spellings using Unicode accidentals are also accepted.
- Question 6 keeps the official concept-specific exclusions, including solo violin, fugue, generic orchestra descriptions for the first excerpt, generic instrument-family answers where individual instruments are required, and generic grace notes for acciaccatura.
- The comparison answer uses the standard Advanced Higher six-point scale and list cap. The conclusion requires Baroque for Excerpt 1 and Romantic for Excerpt 2, with evidence for full marks.

## Regression coverage

`digital-question-papers/tests/advanced-higher-2024.test.js` checks source availability, the 40-mark structure, correct and rejected marking cases, answer completion, timer setup, audio markers and durations, exact bar-by-bar notation pitches and rhythms, bar totals, Advanced Higher rough/final-answer layout metadata, interactive render targets and finite SVG geometry.

## 2026-11-02 final cross-paper sweep

- Exam Mode was normalised to the Hub-wide 45-minute attempt length and the timer is covered by the paper and cross-paper regressions.
- All six audio files decoded successfully; every calibrated marker remains chronological and within its measured source track.
- The complete official-answer fixture, rejection cases, notation inventories, All Questions rendering and marking-instruction link were rechecked with no browser errors.

## 2026-11-03 page-by-page PDF layout audit

- Official pages 2–21 were rendered at 300 dpi and compared directly with Questions 1–6 in the interactive paper.
- Question 2 now carries the printed lyrics beneath every system and reconstructs the boxed bar-11 chord task as a grand staff with the three treble chords, three bass notes and the given G-major chord in bar 12.
- Question 3 preserves the source tick glyph in part (a), and places the part (b) replay instructions before its answer line as printed.
- Question 4's two notation pages were checked against the already protected exact pitch-and-rhythm inventories, box boundaries, labels, answer staves and playback sequence.
- Question 5 now preserves the printed replay/answer-line order, tick glyphs and source typo in part (e). Part (d) reconstructs each instrument order as three bordered boxes joined by grey arrows instead of flattening the source diagram into a semicolon-separated sentence.
- Question 6 restores the printed `(a)` label, source capitalisation for `Rough work` and `Final answer`, the grouped replay cues and the complete rough-work/final-answer page sequence. Print-only end matter remains omitted from the digital paper.


## 4 November 2026 source-layout and notation pass

Reviewed the official question-bearing pages sequentially, with 300 dpi staff crops for notation. Updated wording, emphasis, paragraph/replay grouping, answer boxes, score layout and the separate bar-by-bar regression inventories. Browser captures of all six questions are saved under `maintenance/generated/ah-paper-layout-audit/2024-qN-verified.png`. Rough work remains unmarked and has no watermark; print-only end-of-paper text is omitted. Source/marking/audio/notation regression checks and the fixed desktop-canvas audit were run.


## User-confirmed notation correction — 5 November 2026

Question 4(b), bar 33: the quaver immediately after the rest is D4, not C4. The notation data and regression inventory have been updated.


## 2026-11-06 fresh source and browser audit

Fresh complete source comparison on pages 4–6, 10–11 and 14 plus MI page-4 diagrams. All current pitches agree with source; three percussion options were separately cropped/calibrated and reread. Corrected Q2(a) bar 3’s final beam downward. Reproduced Q4(b)(i) storing C5,B4,A4 for correctly positioned C/B-flat/A; supplying the F-major key fixes keyboard and drag storage/marking. All seven source note slots pass, including Eb3,Bb2,Bb2. A separate initial bass-drag audit failure used accidental rather than notehead coordinates; corrected audit coordinates pass without a second product fix. Final source render/PDF follow-up remains tracked separately.


## 6 November 2026: instrument-order PDF arrows

The printed Question 5(d) diagram on page 13 uses grey-filled arrows with a dark outline. The 300 dpi source diagram was reread during the all-paper audit. CSS clipping produced rectangles in the actual Share PDF; the renderer now uses one SVG viewport with vector polygons, retaining the established size and inset. The inset also uses an SVG transform so the capture library cannot displace its lower border. Source wording, instrument order and accepted answer are unchanged. Both browser engines receive actual-capture checks for all eight arrows.

### 6 November audit: neutral accidental entry

The fixed accidental question now offers natural, flat and sharp using the existing shared Bravura controls. Its target label describes the note position without naming the correct sign. Every choice commits its own neutral glyph; the source-reviewed accepted answer and strict note index are unchanged. Submitted wrong signs stay red on the score, with the correction in written feedback; blank slots show the source correction. All five AH fixed-target parts reuse the same preview, one-use arming and removal renderer. Exact choices, source marking, native input and Share evidence are recorded in the audit report.

### 6 November native-touch and feedback follow-up

Tie-anchor measurement now uses a detached group, preventing invisible helper beams from intercepting note entry. Bar 30 remains Eb3, Bb2, Bb2, rhythms quaver/quaver/crotchet, linked indices [1, 2]. The official question crop was reread and MI page 4 explicitly requires the tie. A pupil tie appears only once both linked notes exist; feedback colours it against those notes and includes the green corrective tie for blank or wrong linked notes. Correct entered notes keep their own green feedback even when another note loses the part mark. Source content and the all-notes marking rule are unchanged.

Final feedback/PDF checks cover complete, wrong-first, partial, blank and wrong-linked answers in both engines. In marked feedback, an unequal wrong-note pair uses the existing pitch-following tie option so its red curve is distinguishable from the green correction. Live entry remains unchanged. Each engine passes 91 export checks, 49 WCAG scans, 620 actual-PDF geometry checks and 195 boundary checks across these five 20-page scenarios; actual score/feedback pages 9–10 were viewed for every scenario. The all-paper report retains physical/accessibility/source-fidelity limits.

## Exact answer-guidance continuation — 7 November 2026

Q2(b) accepts the printed G Maj/B, G Maj 1st Inv and I 1st Inv alternatives. Q6(b)(ii) includes the source’s ornamentation, diatonic-harmony, tonic-and-dominant/cadence, percussion, dynamic-range and accent justifications. Exact acceptance/rejection cases are regression-tested. Printed pitches, rhythms and box geometry are unchanged.

## Audio cue-boundary continuation — A176, 7 November 2026

Fresh local speech-recognition windows and full-track waveform onsets confirm the following timing corrections. These values supersede earlier marker tables for the listed cues. Each retains approximately 0.15 seconds before the reviewed acoustic onset. The audio files themselves are unchanged. Full-track listening and physical-device audition remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q1 | 1 | (b) | 195.38 | 236.04 |
| q3 | 2 | (c) | 107.85 | 103.67 |

Exact marker regressions and fresh measured-duration bounds protect these values. Detailed evidence: `audit/2026-11-05/a176-cue-corrections.json`.

## Remaining cue-flag review — A177, 7 November 2026

The flagged cues below were checked against independent local recognition windows and complete-track waveform onsets. The exact corrected values supersede earlier timing tables for these marker identities. The audio files, question wording, notation and answer keys are unchanged. Full listening and physical-device checks remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q4 | 0 | (a) | 7.16 | 7.76 |

Detailed per-flag evidence: `audit/2026-11-05/a177-cue-flag-review.json`. The shared exact-marker regression uses the A177 source-duration and waveform fixture.


## 18 November 2026 conclusion justification audit

Q6(b)(ii) now uses excerpt-specific evidence families and equivalent wording reviewed against this year’s conclusion and additional guidance. The official 0/1/2 rubric is retained: both periods need valid justifications for full credit, and, by the teacher’s explicit override, the supporting evidence must be written in the Conclusion itself. Earlier final answers cannot supply justification, even though the official scheme allows such links. Feedback distinguishes period identification from justification and names credited evidence. Rough work is excluded. See [the complete audit, alternatives and exclusions](advanced-higher-conclusion-audit.md).
