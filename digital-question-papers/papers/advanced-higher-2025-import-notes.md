# Advanced Higher Music 2025 import notes

## Source inventory

- Question paper: `exampapers/adv higher/2025/Music AH 2025 Paper.pdf`
- Marking instructions: `exampapers/adv higher/2025/Music AH 2025 Answers.pdf`
- Question audio: official tracks 02–07 in the same folder.
- The 40 marks are distributed as 5, 6, 7, 4, 8 and 10.
- The digital adaptation retains the assessed question order, wording, answer structures and mark placement while excluding candidate-identification, barcode, official-use and blank print material.

## Audio calibration

- All question tracks were transcribed locally before cue placement. Question 4, which the earlier batch treated as a literacy track, received a separate full-track `small.en` transcription.
- A second `small.en` pass resolved the Question 3(b) boundary that was unclear in the base transcript.
- Markers use the established short lead-in and were checked against the spoken question/part starts.
- The regression test protects 25 calibrated markers, chronological order and duration bounds.
- Measured durations for Questions 1–6 are 327.632993, 575.807982, 523.168798, 396.294966, 504.684989 and 2143.55 seconds.

## Notation audit

- Official question-paper pages 3–6, 11 and 13 and marking-instruction pages 3–4 were rendered at 300 dpi. Ambiguous and densely printed notation was re-rendered at 600 dpi and checked against vector extractions from the official PDFs.
- Question 2(a) is an eight-bar D-major, 4/4 guide. A second independent notehead-centre pass found and corrected the earlier approximate melody. The three provided bar-1 noteheads take quaver-triplet rhythm. The bar-8 E-sharp is rewritten enharmonically as F on the top treble-staff line.
- Question 2(b) stores all three complete four-bar versions. The options now preserve their distinct triplet and continuation pitches; the third is correct.
- Question 2(c) is in F major and 3/4. The tied F notes across bars 2–3 have a combined value of four crotchet beats. Bars 7–8 form a perfect cadence.
- Question 2(d) is in D minor and 3/4. Bars 9–12 were re-read independently rather than inferred from the previous melody. The source's solo line and complete piano grand staff are retained, including every upper-piano semiquaver sonority and the B-flat key signature. The bar-11 bass line is D–E–F in crotchets; the official octave flexibility is retained.
- Question 4 is in F major and 4/4. The introduction transposes from F3–E3–D3–C3 to F4–E4–D4–C4. Bar 4 requires A4 crotchet, G4/F4 quavers and D4 crotchet. The only accepted subdominant circle is B-flat in bar 12. Both missing barlines after bars 9 and 10 are required.
- Question 5(d) stores the printed anacrusis and eleven-bar, 3/4 vocal grand-staff guide. All four voices were checked independently. The assessed sonority is A-sharp–C-sharp–E–G in bar 6, and the assessed interval is the major 6th A–F-sharp between alto and soprano in bar 10. The renderer must draw every stored chord member rather than only the first note of each voice.
- Complete bars are protected by beat-total assertions. Exact pitch-and-rhythm arrays protect Questions 2(a)–(d), and every notation inventory has a fixed SHA-256 regression hash.

## Marking decisions

- Question 3(a)(4) requires relative minor; minor alone remains rejected.
- Question 5(d)(i) requires diminished 7th, including the printed A-sharp alternative. Diminished or diminished triad alone is rejected.
- Question 5(d)(ii) accepts 6th or major 6th, but rejects minor and augmented 6ths.
- Question 6 preserves the official distinction between modulation in Excerpt 1 and change of key in Excerpt 2, along with the singular/plural instrument restrictions and the major-and-minor requirement.
- Question 6 uses one shared two-column rough-work table and one continuous final-answer area for part (a), followed by one rough-work area and one continuous analysis/conclusion final-answer area for part (b). It does not duplicate these print structures for each digital subpart.
- Accents and sforzando are one alternative marking point, not two. Suspension includes suspended chords; flute includes the plural; leitmotif includes leitmotiv; and through-composed accepts the hyphenated and unhyphenated forms. Modulation to a minor key is explicitly excluded from the Excerpt 1 modulation point.
- The comparison answer uses the established Advanced Higher six-point scale and list cap. The conclusion requires Classical for Excerpt 1 and Romantic or late Romantic for Excerpt 2, with appropriate period evidence for full marks.

## Regression coverage

`digital-question-papers/tests/advanced-higher-2025.test.js` checks the 40-mark structure, official alternatives and exclusions, source/audio availability, all calibrated cues, exact notation pitch/rhythm inventories, bar totals and hashes, Question 6 source structure, answer completion, timer setup, finite SVG geometry and live interaction targets.

## 2026-11-02 final cross-paper sweep

- Exam Mode was normalised to the Hub-wide 45-minute attempt length and the timer is covered by the paper and cross-paper regressions.
- All six audio files decoded successfully; every calibrated marker remains chronological and within its measured source track.
- The complete official-answer fixture, rejection cases, notation inventories, All Questions rendering and marking-instruction link were rechecked with no browser errors.

## 2026-11-04 page-by-page fidelity audit

- Every assessed source page from Question 1 through the Question 6 conclusion was rendered from the official PDF at 300 dpi and compared individually with the interactive paper. Print-only candidate, barcode, margin and page-turn material remains intentionally omitted.
- Source tick symbols were restored in Questions 2(b) and 3(b). The printed answer-location wording was restored for Questions 2(c)(i), 5(d)(i) and 5(d)(ii), and the timing paragraphs for Questions 1(a) and 5(a) now appear before their answer prompts and ruled lines as in the paper.
- Question 6 now uses the shared source-layout metadata for the `(a)` label, true bullet rows, paired replay cues and selective bold emphasis. Its rough-work table, final-answer areas, analysis and conclusion remain continuous digital equivalents of pages 16–21, including the source's final `[END OF QUESTION PAPER]` label.
- The Question 2, Question 4 and Question 5 printed scores were rechecked bar by bar against their high-resolution crops. The existing structured pitch, rhythm, accidental, tie, box-boundary and barline inventories matched the source, so their protected notation hashes did not change.


## 4 November 2026 source-layout and notation pass

Reviewed the official question-bearing pages sequentially, with 300 dpi staff crops for notation. Updated wording, emphasis, paragraph/replay grouping, answer boxes, score layout and the separate bar-by-bar regression inventories. Browser captures of all six questions are saved under `maintenance/generated/ah-paper-layout-audit/2025-qN-verified.png`. Rough work remains unmarked and has no watermark; print-only end-of-paper text is omitted. Source/marking/audio/notation regression checks and the fixed desktop-canvas audit were run.


## 4 November 2026 Question 2(a) source layout

Compared official page 3 rendered at 300 dpi with the current score. Preserved the verified eight-bar pitch/rhythm inventory and marking answers. Replaced equal bar spacing with source-calibrated boundaries and notehead positions, reduced the system gaps, boxed the two-bar introduction, aligned opening bar numbers with the clefs, resized the rhythm and enharmonic boxes and positioned the answer stave above bar 8. Both the answer stave and bar 8 retain the printed thin/thick final barline. The score crop now ends after the complete answer box instead of leaving excess blank space. The replay cues are separated from the preceding timing paragraph. Layout coordinates are in structured notation data and the exact regression fixture.

User-confirmed correction, 4 November 2026: Q2(a) bar 2 changed to B5 minim, C#6 crotchet and D6 crotchet. Rhythm and answer targets unchanged; exact regression inventory updated.

Question 2(b), 4 November 2026: compared page 4 at 300 dpi and matched the three full-width choices, square tick boxes, note spacing, beam directions/slopes, below-beam triplet numbers, visible printed C-sharp accidentals, final thin/thick barlines and replay spacing. Existing pitches, rhythms, ties and correct option 3 remain unchanged. Structured bar and note coordinates plus beam/accidental metadata are covered by the exact inventories.

5 November 2026, user-confirmed Q2(c) geometry: key signatures moved 15 units left; the bar 1 slur sits below the noteheads; ties 2–3 and 5–6 span the full note separation; slurs in bars 6 and 7 follow the pitch direction diagonally. Pitches, rhythms, slur endpoints and marking answers remain unchanged.

### 5 November 2026 — Question 2(d) source layout recheck

Compared the existing bar inventory independently with the 600 dpi crops in `maintenance/reference/pdfs/ah-2025/q2d-bars9-10.png` and `q2d-bars11-12.png`. First-system melody staff centres are approximately 183/225/267/309/351 px; second-system melody 296/338/380/422/464 px. Treble lines are F5/D5/B4/G4/E4 from top to bottom; bass lines A3/F3/D3/B2/G2. Read chord notehead centres independently of the beams. The first chord in bar 11's final semiquaver group is D4/F4, restored in the data and exact regression inventory. All four melody, piano and bass rhythm totals remain three crotchet beats; bar 11 deliberately omits the three bass answers. Official accepted D/E/F in any octave is unchanged.

Separated the three staves, kept the piano's shared up stems connected to both chord heads, put paired piano slurs below the lowest heads, and suppressed repeated C sharps within each piano bar. The three introductory grace notes in bar 9 use a shared semiquaver beam; bar 11 retains a single grace quaver. Restored the bass rhythm guide above the blank stave, full bar-11 surround, bordered two-row chord grid and final thin/thick barlines. Source wording, bar/key emphasis, replay paragraph spacing and end-of-prompt mark alignment match the supplied reference.

### 5 November 2026 — Question 4 score layout

Rechecked all 17 bars against five calibrated crops of official page 11 at 300 dpi; detailed staff centres and the corrected bar 7/8 inventory are recorded in `advanced-higher-2025-q4-inventory.md`. Replaced approximate bar widths with source-calibrated structured positions, made the transposition/missing-note box labels multiline, restored lyric extension lines and the final thin/thick barline. The bass introduction, missing-note indices and marking answers remain intact.

### 5 November 2026 — Question 5(d) layout

Rechecked the existing four-part inventory against the three grand-staff systems on official page 13 at 300 dpi. Pitches, rhythms, overlays and accepted answers are unchanged. The structured layout records source-calibrated bounds and voice positions; adjacent seconds, independent stems, chord/interval boxes, lyric size, final barline and written answer layout now follow the supplied screenshot. Staff calibrations are recorded in `advanced-higher-2025-q5-inventory.md`.

User-confirmed correction, 5 November 2026: Question 5(d), the bass A-sharp minim in bar 7 and A minim in bar 10 have down stems. The independently moving tenor crotchets retain their up stems. Exact inventory and regression assertions updated.

User-confirmed correction, 5 November 2026: Q5(d), the bass B3 crotchet in bar 8 and D4 dotted minim in bar 11 each represent a unison with both up and down stems. Added explicit dual-stem data, preserving the existing up stems and durations; exact regression inventory updated.

### 5 November live QA

Question 4(d) accepts both serialisation orders of the two correct barline tokens. The live score sorts tokens lexically, placing bar 10 before bar 9; this must still earn the one mark. Either barline alone remains incorrect. Regression cases cover both orders and both incomplete answers.

Full browser attempt scored 40/40 after the barline fix. Submission now persists the initial Question 1 review position, so an immediate refresh stays on the question actually displayed rather than the final attempted question.

### 6 November independent source and interaction audit

Fresh calibrated 300 dpi staff readings and a second comparison cover all printed voices/options. Preserved teacher bar-2 B5/C#6/D6 and Q5 stem decisions. Restored option 3 bar-3 up beams and Q2(c) bar-1 down beams. Extended Q2(d) any-octave acceptance through the full entered octave-5 range (64 independent combinations). All twelve normal note-entry slots and the high-octave edge case pass keyboard/drag/mark/Clear. Q4(d) double-tap removal now clears a placed barline without adding it back. Complete source fixture and regression added; PDF/accessibility evidence is tracked in the audit report.

### Audit source wording — 6 November 2026

Official question page 2 prints `Total marks — 40 marks` above Question 1. Preserve the second `marks` as printed; the cover uses the shorter line. The shared opening data now uses the question-page wording in Practice, Exam and marked feedback/PDF. Protected by the opening-instructions regression.

### 6 November audit: Q4(c) note-selection alternatives

The 300 dpi source page 11 and MI page 4 were reread. In F major, the note on the B line at bar 12 note 2 is B-flat through the key signature; the MI explicitly calls it the only subdominant example and rejects all other answers. The bar-12 G4/B-flat4/A4/G4/F4 inventory and the `bar-12-bb` accepted answer are preserved.

Previously only that correct note was clickable. Every printed melody note and the four given source bass notes now supports the same circle/removal interaction: 75 targets, with the four deliberately missing notes excluded. Wrong circles are stored neutrally and marked normally. Horizontal midpoint boundaries keep neighbouring note targets distinct without changing score geometry. The exact target count, source answer and wrong alternatives are regression-tested.

## Exact answer-guidance continuation — 7 November 2026

Q6(b)(ii) accepts small/chamber ensemble, the printed small/chamber orchestra with wind wording, diatonic harmonies and sfz. Small/chamber orchestra alone remains rejected. Exact acceptance/rejection cases are regression-tested. Printed pitches, rhythms and box geometry are unchanged.

## Audio cue-boundary continuation — A176, 7 November 2026

Fresh local speech-recognition windows and full-track waveform onsets confirm the following timing corrections. These values supersede earlier marker tables for the listed cues. Each retains approximately 0.15 seconds before the reviewed acoustic onset. The audio files themselves are unchanged. Full-track listening and physical-device audition remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q2 | 1 | (b) | 230.90 | 229.98 |
| q6 | 8 | 1 | 1249.87 | 1248.92 |

Exact marker regressions and fresh measured-duration bounds protect these values. Detailed evidence: `audit/2026-11-05/a176-cue-corrections.json`.

## Remaining cue-flag review — A177, 7 November 2026

The flagged cues below were checked against independent local recognition windows and complete-track waveform onsets. The exact corrected values supersede earlier timing tables for these marker identities. The audio files, question wording, notation and answer keys are unchanged. Full listening and physical-device checks remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q3 | 0 | (a) | 7.60 | 7.38 |

Detailed per-flag evidence: `audit/2026-11-05/a177-cue-flag-review.json`. The shared exact-marker regression uses the A177 source-duration and waveform fixture.


## 18 November 2026 conclusion justification audit

Q6(b)(ii) now uses excerpt-specific evidence families and equivalent wording reviewed against this year’s conclusion and additional guidance. The official 0/1/2 rubric is retained: both periods need valid justifications for full credit, and, by the teacher’s explicit override, the supporting evidence must be written in the Conclusion itself. Earlier final answers cannot supply justification, even though the official scheme allows such links. Feedback distinguishes period identification from justification and names credited evidence. Rough work is excluded. See [the complete audit, alternatives and exclusions](advanced-higher-conclusion-audit.md).
