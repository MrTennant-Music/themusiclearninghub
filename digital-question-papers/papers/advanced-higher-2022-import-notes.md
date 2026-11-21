# Advanced Higher Music 2022 import notes

## Source inventory

- Question paper: `../../exampapers/adv higher/2022/Music AH 2022 Paper.pdf`
- Marking instructions: `../../exampapers/adv higher/2022/Music AH 2022 Answers.pdf`
- Official audio: tracks 02–07 in `../../exampapers/adv higher/2022/`
- Imported paper data: `advanced-higher-2022.js`
- Audited score inventories: `advanced-higher-2022-notation.js`
- Regression coverage: `../tests/advanced-higher-2022.test.js`

The source paper and finalised marking instructions were extracted independently and checked question by question. The 40 marks are distributed 5, 5, 7, 5, 8 and 10 across Questions 1–6.

## Audio calibration

All six official question tracks were transcribed locally. Track 05 was transcribed in full with Whisper `small.en`. Focused re-transcriptions were used for Question 2(c), Question 3(b), and the three Question 6 Excerpt 2 cues that run directly into music and were omitted or merged in the broad transcripts. The established 0.16-second lead-in is retained.

| Question | Calibrated source times (seconds) |
| --- | --- |
| 1 | 5.24, 190.2 |
| 2 | 4.04, 214.72, 422.62 |
| 3 | 5.10, 62.88, 330.55, 396.2 |
| 4 | 5.06, 225.12 |
| 5 | 6.41, 227.65, 276.93, 518.16 |
| 6 | 6.55, 51.47, 187.03, 303.59, 436.38, 792.78, 857.05, 989.56, 1108.96, 1242.06 |

The regression protects all 25 markers, their order and the measured source-track bounds.

## Notation transcription audit

Official notation pages 4, 5, 8, 11 and 12 and the corresponding marking-instruction pages were rendered at 300 dpi. Each printed system was cropped separately. Clefs, key signatures and time signatures were established before pitches were read from notehead centres.

- Question 2(a): the grand-staff bars 1–2 and single-treble-staff bars 3–4 are inventoried. The two chord answers belong to complete bars 1 and 2, and the three treble notes in bar 3 remain D4, G4 and B4 when rewritten at the same sounding pitch in bass clef.
- Question 2(b): all four 12/8 bars are inventoried. The boxed C5–G4 interval is a perfect 4th and the physical accidental target is the E in bar 3, which requires a flat.
- Question 4(a): both staves of all nine 12/8 bars are inventoried. The missing signature applies at bar 1 and the boxed bar-7 sonority is G7.
- Question 4(b): all fourteen 4/4 bars are inventoried across the four printed systems. The `8va` belongs above the first note of bar 4. The missing bass notes are F and C in bars 13 and 14; the enlarged finalised answer image confirms that both use dotted-crotchet rhythm and may be placed in any octave.
- User correction, 5 November 2026: in Question 4(b), bar 14, the printed tied quaver and minim in the bass are F3; align them horizontally with the tied treble notes.
- User correction, 5 November 2026: in Question 4(b), bar 13, the printed tied quaver and minim in the bass are G3; align them horizontally with the tied treble notes.
- Question 5(a): all nine 3/4 bars are inventoried. Bar 5 changes A-sharp to B-flat on the first ledger line above the stave. Bar 8 contains three complete quaver triplets; the final triplet is G, A, F and retains the triplet sign.

Every complete score voice is rhythm-totalled in the regression. Exact hashes protect the three inventories, answer locations and final barlines. Static and interactive SVG renders are checked for finite coordinates and keyboard-accessible note entry.

## Marking safeguards

- Question 2(a)(i) requires both official chords; all published chord-name, Roman-numeral and inversion alternatives are accepted.
- Question 4(a)(i) accepts the stacked `12/8` signature but not a substitute time signature. Question 4(a)(ii) requires the seventh and rejects bare G, V or Dominant.
- Question 4(b)(iii) accepts F followed by C in any octave, but preserves the supplied dotted-crotchet rhythm.
- Question 5(b) accepts consort, recorder consort or whole consort and rejects `recorders` alone.
- Question 6 retains the official inclusions and exclusions, including `7th chords` rather than `dominant 7ths` for Excerpt 1, `change of key` rather than `modulation` for Excerpt 2, and the specific choir, instrument-family and tuned-percussion rules.
- Both Question 6 excerpts may be identified as 20th-century/Modern; Excerpt 2 may additionally be identified as Popular. An extra incorrect period invalidates that excerpt's identification.

## Verification

- Question 1 was compared against official pages 2–3 at 300 dpi. Part (a) now keeps the source order of concept bank, playback timing, four-answer prompt, ruled answers and replay cues. Part (b) keeps its playback paragraph and two cues before the response line, matching the continuation page.

`advanced-higher-2022.test.js` checks a complete 40-mark response, official alternatives and exclusions, answer completion, exact notation inventories and hashes, rhythm totals for all score voices, audio markers and duration bounds, and static/interactive SVG output. Earlier Advanced Higher regressions and the fitted desktop-layout audit are run alongside it before hand-off.

## 2026-11-02 final cross-paper sweep

- Exam Mode was normalised to the Hub-wide 45-minute attempt length and the timer is covered by the paper and cross-paper regressions.
- All six audio files decoded successfully; every calibrated marker remains chronological and within its measured source track.
- The complete official-answer fixture, rejection cases, notation inventories, All Questions rendering and marking-instruction link were rechecked with no browser errors.

## 2026-11-01 source-fidelity re-audit

The official question paper was extracted again and notation pages 4, 5, 8, 11 and 12 were re-rendered at 600 dpi. The finalised marking instructions were independently re-extracted and compared with every accepted and rejected answer.

- Restored the omitted spoken/source instruction blocks around Questions 1–5, including the full chord and missing-bass wording.
- Split Question 2 into its original part (a) and part (b) score panels, retaining the same chord, bass-clef, interval and accidental interactions. The second score now appears only after the part (b) introduction instead of both excerpts appearing before part (a).
- Split Question 4 into its source-order part (a) and part (b) score panels. The part (a) guide now precedes its two answer prompts, while the part (b) guide follows all three printed prompts as it does in the official paper.
- Rebuilt Question 6 around one shared rough-work table for Excerpts 1 and 2, one shared rough-work page for part (b), and the source-order final Analysis and Conclusion sections. This removes the duplicate rough-work and final-answer areas that the older data shape produced.
- Corrected the first four bars of Question 5 from the 600 dpi source: bar 1 is rest–D–A, bar 2 is C–F-sharp–A, and bars 3–4 contain D–A–C tied into C–B followed by the A–G-sharp–A triplet. The exact bar signatures, cross-bar tie metadata, rhythm totals and inventory hash are regression-tested.
- Rebuilt the Question 4 inventory from the 600 dpi systems. Question 4(a) now includes the omitted first- and second-ending bars 8–9 and corrects the clearly displaced opening and repeated-note pitches. Question 4(b) replaces the repeated placeholder melody with the printed D–E-flat–E–F figure and its source variations, including the tied bars 7–8 and the chromatic bar 12. The regression now protects the nine-bar and fourteen-bar counts, representative exact bar signatures, every voice's rhythmic total and the new complete inventory hash.
- Rechecked the 25 calibrated audio markers against the source-track bounds and retained their existing values.

## 2026-11-03 page-by-page layout audit

### Superseding Question 2(a) transcription audit, 2026-11-04

The earlier Question 2(a) inventory and D4–G4–B4 rewrite claim below were incorrect and are superseded here. Rechecked the existing 600-dpi official page-4 render and independent system crops against marking-instructions page 3 before encoding. Treble references: bottom E4, then G4/B4/D5/F5 lines; C4 first ledger below, A3 second space below, G3 second ledger. Bass references: G2/B2/D3/F3/A3 lines, C4 first ledger above. Each system was calibrated independently. Every head was checked twice against these references.

- Opening partial bar (3 crotchet beats): two quaver rests; G3 dotted semiquaver–G3 demisemiquaver (beamed pair); A3–C4–D4 quavers (beam of three). Bass: two dotted crotchet rests. This is the printed partial-bar exception to 12/8, not a numbered full bar.
- Bar 1 treble: E4 dotted crotchet, G4 quaver, E4 crotchet, D4 crotchet, G3 dotted semiquaver–G3 demisemiquaver, D4–E4–D4 quavers. Bass lower voice: C3 dotted crotchet tied to C3 quaver, C3 crotchet, B2 dotted crotchet, B2 dotted crotchet. Bass upper voice: C4 dotted minim, G3 dotted minim.
- Bar 2 treble: E4 dotted crotchet, E4 crotchet, E4 quaver, C4 crotchet, G3 dotted semiquaver–G3 demisemiquaver, E4–D4–C4 quavers. Bass lower voice: A2 dotted crotchet tied to A2 quaver, A2 crotchet, G2 dotted crotchet, G2 dotted crotchet. Bass upper voice: E3/C4 dotted-minim chord, E3/G3 dotted-minim chord. User-confirmed correction on 2026-11-04: first chord's lower A becomes E3; both E3 noteheads connect to their upper note through a shared upward stem.
- Bar 3: E-flat4 dotted crotchet, C4–E4–C4 quavers, D4 crotchet, G3 dotted semiquaver–G3 demisemiquaver, A3–C4–D4 quavers. Only the final three quavers are boxed. Answer stave is bass clef at the same horizontal note positions; marking instructions confirm A3–C4–D4, accepting any values/stem grouping.
- Bar 4: E-natural4–G4–E4 quavers; C4–G3–G3 quavers; A3–B3–G3 quavers; dotted crotchet rest. Final thin/thick barline. No bass staff under bars 3–4 except the separate answer stave.
- All numbered bars and both simultaneous bass voices total six crotchet beats. Beams: each short dotted pair separately; final triplets of ordinary quavers as groups of three. These are ordinary compound-time quavers, not tuplets.
- Chord box spans numbered bars 1–2, includes the bass notes and four separate chord cells: supplied C/I, empty bar-1 answer, empty bar-2 answer, supplied C second inversion/Ic. Correct responses remain G first inversion and A minor.
- The second E in bar 3 inherits the printed E-flat; the E at the start of bar 4 carries the printed natural. The renderer reuses the shared noteheads, stems, ledger lines and beam polygons, with a third hook for the demisemiquaver.
- Rebuilt the two-system layout, opening brace, separate chord cells, compact rewrite box and bass answer staff, and final thin/thick barline. Both chord cells edit the existing single marked response independently. Matched the source's Roman-numeral labels, paragraph breaks and selective emphasis; notation Clear controls remain available.
- Browser verification: separate G/B and Am chord entries and the A3–C4–D4 rewrite each earned their one mark. The complete upper/lower inventories, partial-bar exception, additional bass voice, chord pitches, ties, editable indices and final barline are regression-protected. AH 2019 and 2022–2026 regression suites and the 55-page fitted desktop-layout audit passed.

### Superseding Question 2(b) transcription audit, 2026-11-04

Rechecked the 600-dpi page-5 notation with separate crops. In the first crop the five staff-line centres are approximately y59/100/141/183/224; in the second y101/143/184/225/267. Both use treble clef: bottom E4, then G4/B4/D5/F5; C4 is the ledger below. A second note-by-note pass confirmed the inventory below. Each bar totals six crotchet beats in 12/8; there is no upbeat.

- Bar 1: dotted crotchet rest, quaver rest, C5 semiquaver, B4 semiquaver, C5 quaver, G4 dotted minim. The C5/B4/C5 group shares a primary beam; only the first two have a secondary beam. Interval box encloses only the final C5 and G4; its answer line is above the staff. Marking instructions confirm perfect fourth.
- Bar 2: crotchet rest, semiquaver rest, C4 semiquaver, E4 semiquaver, D4 semiquaver, C4 quaver, E4 quaver, C4 dotted minim. The first C4 has a separate flag; the E4/D4/C4/E4 group shares a beam, with a secondary beam on E4/D4 only.
- Bar 3: crotchet rest, C4 semiquaver, C4 semiquaver, E4 quaver, D4 crotchet tied to D4 crotchet, D4 quaver, G4 crotchet, A4 quaver. Only the two semiquavers are beamed. The accidental box encloses the opening rest through the second tied D4, excluding “so clear and”. The pupil adds a flat before note index 3 (E4), confirmed by the marking instructions.
- Bar 4: A4 quaver, G4 crotchet tied to G4 dotted crotchet, dotted crotchet rest, dotted crotchet rest. Final thin/thick barline. The tie is drawn only once.
- Syllables are attached to individual note indices rather than centred as a whole sentence under each bar. Separate lyric extension lines follow “sky” and “blue.” The italic Fade in, box labels, bar numbers and the printed subpart/replay paragraphs follow the source positions.
- The completed blank browser score was compared at the same staff scale with both source systems. Perfect-fourth entry and physical flat placement each earned their one mark in an isolated browser attempt. Complete pitch/rhythm sequences, beams, ties, lyric indices, box geometry, extension lines and the final barline are regression-tested; AH 2019 and 2022–2026 suites and the fitted desktop-layout audit passed.

- Compared Question 2 against official pages 4–5 rendered at 600 dpi, with separate close crops for both score systems and every answer box.
- Restored the source replay blocks after parts (a)(ii) and (b)(ii), moved part (c)'s playback cues before its response line, and matched the source's selective bold emphasis.
- Corrected the complete Question 2(b) song inventory, including both compound-time rests, the C5–G4 perfect fourth, the flat target before E4 in bar 3, both ties, lyric underlay and final double barline. Every bar now totals exactly 12/8.
- Corrected the bass-clef rewrite to D4, G4 and B4 at the same sounding pitch and protected the source and answer pitches in the regression.
- Recreated the fixed C/I and C second-inversion/Ic chord cells, removed the spurious lower staff from bars 3–4, and retained only the source's separate bass-clef response stave.
- Compared Question 3 against official pages 6–7. Restored the printed tick symbol in part (a), moved part (b)'s six playback/read-through paragraphs outside the bordered four-item guide, narrowed and indented that guide to the source proportions, and placed part (c)'s playback cues before its response line.
- 2026-11-04 user-reference refinement: Question 3(a) retains the established square choices with closer source row spacing; part (b) aligns with the choice text and preserves the supplied line breaks and compact replay cues. The four-row guide has full-length ruled inputs, baseline-aligned punctuation and marks outside the border beside each answer line. Changes are scoped to AH 2022 Question 3. Browser preview, AH 2022 regression and the fitted desktop-layout audit passed.
- Compared Question 4 against official pages 8–11. Restored the C-major instruction and the complete replay/write-on-guide blocks after part (a), including the source's selective emphasis. Corrected part (b)'s page-reference wording and placed its replay/read-through block before the printed score, matching the original page order while retaining the independently audited nine-bar and fourteen-bar inventories.
- Compared Question 5 against official pages 12–13. Restored the complete replay/write-on-guide block after part (a), placed part (c)'s playback timing after the concept bank but before the answer prompt, and restored its two replay cues after the ruled responses. Part (d)'s two printed prompt lines now remain separate.
- Compared Question 6 against official pages 15–21. Restored the omitted `(a)` label on the opening instruction and the full source introduction and two bold category bullets above the shared rough-work table. The shared table, paired final-answer sections, part (b) instructions, lined rough work, Analysis and Conclusion pages retain their source order and digital page-reference substitutions.

- 2026-11-04 user-reference refinement: Question 3(c) and (d) retain separate listening and identification paragraphs, with marks beside the identification rows. Part (c) preserves the source wrap after “been”, bold “rhythmic” and “twice”, a paragraph gap before the compact replay pair, and spaced underline responses. Verified in the browser; AH 2022 regression and fitted desktop-layout audit passed.

## Question 4(a) page-8 re-audit, 4 November 2026

The earlier Question 4(a) transcription claim is superseded by `advanced-higher-2022-q4a-inventory.md` and the exact regression fixture `tests/fixtures/ah2022-q4a-inventory.json`. The official page was rendered at 300 dpi, divided into four close crops, calibrated separately and checked twice note by note. Restored the two-beat D-sharp/E/G/A pickup, separate sustained C5 and lower treble voices in bars 1–2, all chord pitches and durations, accidental cancellations, bass slurs, tenutos, arpeggio/accent, crescendo and forte, first/second endings and repeat barlines. The time signature belongs before the pickup (bar index 0); the chord box encloses only the opening crotchet of bar 7 across both staves. Every full-bar voice totals six crotchet beats; the independent upper voice and pickup totals are tested separately. Source-proportioned system spacing, aligned note positions and local Question 4 text spacing replace the prior compressed layout.

Validation: browser comparison of all four corrected systems and input of 12/8 plus G7 completed in an isolated attempt; AH 2019 and 2022–2026 regression suites and the 55-page fitted desktop-layout audit passed. Edits remain local.

- User refinement: thickened the horizontal articulation marks to 2.5 SVG units, shifted the opening repeat 5 units left on both staves, and angled the bass slurs between their actual first and last notehead heights (upper chord heads for above-staff slurs). Browser preview, AH 2022 regression and desktop-layout audit passed. Pitch/rhythm inventory unchanged.
# User correction: Question 2(b) has a single barline at the end of bar 2, closing the first system.
# User correction: Question 5(a), the tied note from bar 3 into bar 4 is C6 on both sides of the tie, correcting the earlier C5 instruction.
# User correction: Question 5(a), the second crotchet in bar 4 is B5.
# User instruction: remove all tenuto marks from Question 4, superseding the earlier placement adjustments.
# User correction: Question 4(a), the final six notes in bar 6 move up three staff positions to C5, E-flat5, D5, C5, E-flat5, E5.
# User correction: Question 4 bass-clef chord stems extend through the lower notes.


## 2026-11-06 fresh source and browser audit

Freshly reread every source system on pages 4, 5, 8, 11 and 12 and official marking diagrams on pages 3–4. Current pitches agree with source; explicit teacher tenuto omissions remain. Corrected the bar-11 Q4(b) tie below the notes, confirmed in final render. All nine source note slots and the allowed F5/C5 bass alternative pass keyboard/drag/marking/Clear. The complete independent source fixture protects all voices and rhythm totals.

## 6 November 2026 source-completeness review

Fresh 300 dpi source pages 4–5 confirm that Q2(a)(ii) and Q2(b)(ii) say “You should write your answers on the guide to the music above.” Removed the unprinted word “all” from these two instructions. Their original above-direction already matches the digital score position; they are not page-reference adaptations. Q4 keeps its separately printed “all”. Exact regressions protect both Q2 instructions.

### 6 November audit: rapid native-touch gestures

Every offered bracket/letter/sign target now participates in the shared removal gesture state before an answer is placed. Distinct intervening score gestures release the old removal filter; native touch double-clicks defer to the explicit touchend double-tap handler. This keeps rapid tool–score–tool placement and repeated removal independent. Exact printed notation and source answers remain covered by the existing transcription fixtures. Browser rerun records are linked in `docs/past-paper-maintenance.md`.

### 6 November audit: neutral accidental entry

The fixed accidental question now offers natural, flat and sharp using the existing shared Bravura controls. Its target label describes the note position without naming the correct sign. Every choice commits its own neutral glyph; the source-reviewed accepted answer and strict note index are unchanged. Submitted wrong signs stay red on the score, with the correction in written feedback; blank slots show the source correction. All five AH fixed-target parts reuse the same preview, one-use arming and removal renderer. Exact choices, source marking, native input and Share evidence are recorded in the audit report.

## Fine source and engraving continuation — 6 November 2026

- Both Bass note captions use a 4-unit inset and 17-unit type to keep the complete text inside the unchanged narrow boxes.

Final browser and actual Share PDF evidence is tracked in docs/past-paper-maintenance.md. Listening and physical-device checks remain separate.

## Exact answer-guidance continuation — 7 November 2026

Q6(b)(ii) now recognises the explicitly printed harmonic, rhythmic and melodic justifications for Excerpt 1, and added chords, discords, time changes, riffs/ostinato, synthesizer and reggae cues for Excerpt 2. Exact acceptance/rejection cases are regression-tested. Printed pitches, rhythms and box geometry are unchanged.

## Audio cue-boundary continuation — A176, 7 November 2026

Fresh local speech-recognition windows and full-track waveform onsets confirm the following timing corrections. These values supersede earlier marker tables for the listed cues. Each retains approximately 0.15 seconds before the reviewed acoustic onset. The audio files themselves are unchanged. Full-track listening and physical-device audition remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q6 | 1 | 1 | 51.47 | 53.87 |

Exact marker regressions and fresh measured-duration bounds protect these values. Detailed evidence: `audit/2026-11-05/a176-cue-corrections.json`.

## Remaining cue-flag review — A177, 7 November 2026

The flagged cues below were checked against independent local recognition windows and complete-track waveform onsets. The exact corrected values supersede earlier timing tables for these marker identities. The audio files, question wording, notation and answer keys are unchanged. Full listening and physical-device checks remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q5 | 3 | (d) | 518.16 | 518.32 |

Detailed per-flag evidence: `audit/2026-11-05/a177-cue-flag-review.json`. The shared exact-marker regression uses the A177 source-duration and waveform fixture.


## 18 November 2026 conclusion justification audit

Q6(b)(ii) now uses excerpt-specific evidence families and equivalent wording reviewed against this year’s conclusion and additional guidance. The official 0/1/2 rubric is retained: both periods need valid justifications for full credit, and, by the teacher’s explicit override, the supporting evidence must be written in the Conclusion itself. Earlier final answers cannot supply justification, even though the official scheme allows such links. Feedback distinguishes period identification from justification and names credited evidence. Rough work is excluded. See [the complete audit, alternatives and exclusions](advanced-higher-conclusion-audit.md).
