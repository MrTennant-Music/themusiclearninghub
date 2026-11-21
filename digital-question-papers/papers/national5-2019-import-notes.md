# National 5 Music 2019 import notes

Use these notes before importing National 5 Music 2020 or any later Digital Past Paper.

## Official source set

- Question paper: `exampapers/n5/2019/N5_Music_QP_2019.pdf`
- Marking instructions: `exampapers/n5/2019/mi_N5_Music_mi_2019.pdf`
- Audio: official Tracks 1–9 in `exampapers/n5/2019/`
- Interactive data: `digital-question-papers/papers/national5-2019.js`
- Regression tests: `digital-question-papers/tests/national5-2019.test.js`

The official question paper and marking instructions were rendered and checked page by page. Print-only candidate fields, barcode material, official-use margins, turn-over text and additional answer pages were not reproduced.

## Mark inventory

| Question | Marks | Main interaction |
| --- | ---: | --- |
| 1 | 7 | Listening choices, multi-select and chord-sequence grid |
| 2 | 4 | Four-part vertical listening guide |
| 3 | 6 | Shared eight-bar notation score with direct score entry and rhythm correction |
| 4 | 7 | Seven short listening answers |
| 5 | 4 | Four category groups |
| 6 | 3 | Sentence completion |
| 7 | 4 | Two style-and-reason groups |
| 8 | 5 | Rough work plus concept-marked final answer |

The question totals and individual-part totals must remain exactly 40.

## Whisper audio-marker workflow

Every official question track was transcribed locally with Whisper `small.en`, English language selection and word timestamps. Each marker was taken from the beginning of the relevant spoken question, part or replay cue, then checked against the surrounding waveform boundary and the small lead-in convention used by the completed 2014 paper.

Calibrated markers:

- Question 1: `6.44`, `67.36`, `114.49`, `205.70`, `324.86`, `365.78`
- Question 2: `98.08`, `187.26`, `278.70`
- Question 3: `12.10`, `121.28`, `178.68`, `234.70`
- Question 4: `6.92`, `48.68`, `88.79`, `173.70`, `253.28`, `331.82`, `377.30`
- Question 5: `87.76`, `138.78`, `189.80`
- Question 6: `54.88`, `117.70`
- Question 7: `6.14`, `95.10`
- Question 8: `45.44`, `119.68`, `194.38`

Official audio durations used for bounds checking are `418.22`, `369.89`, `382.80`, `424.65`, `250.44`, `182.91`, `187.48` and `387.53` seconds for Questions 1–8 respectively. The regression test protects all 30 exact marker values, their chronological order and their track-duration bounds.

## Question 3 notation decisions

- The score is stored as a separate eight-bar pitch-and-rhythm inventory named `N5_2019_Q3_BARS`.
- The time-signature target is immediately after the key signature at the start of the score.
- Bar 4 uses direct draggable missing-note entry. The correct notes are D5 dotted quaver, B4 semiquaver and G4 crotchet.
- Bar 7 prints four downward-stem crotchets which the pupil must physically correct to semiquavers. The pupil has the established quaver-tail and dotted-crotchet modifier controls plus a semiquaver control; all four semiquavers must be applied for the mark.
- The source accidentals are explicit where required: C sharp in bar 3, then D sharp followed by D natural in bar 7.
- The final bar uses the source paper's double barline.
- Missing notes preview in grey and remain removable with the established notation gestures and Clear control.

The source-verified pitch and rhythm inventory is:

1. B4 minim; D5, C5, B4 and C5 semiquavers
2. D5 dotted quaver, B4 semiquaver, G4 crotchet, crotchet rest
3. G5 dotted crotchet; A5, G5, F-sharp5, E5, D5 and C-sharp5 semiquavers
4. D5 dotted quaver, B4 semiquaver, G4 crotchet, crotchet rest, with the first three notes omitted for pupil entry
5. C5 dotted quaver, A4 semiquaver, F-sharp4 quaver, then A4, B4 and C5 quavers
6. D5 dotted quaver, B4 semiquaver, G5 crotchet, crotchet rest
7. A5, G5, F-sharp5, G5, F-sharp5, E5, D-sharp5 and E5 semiquavers; then printed D5, C5, B4 and C5 downward-stem crotchets corrected by the pupil to semiquavers
8. B4 quaver, C5 and B4 semiquavers, A4 quaver, quaver rest, crotchet rest, followed by a double barline

Every bar totals three crotchet beats once the bar 7 correction is complete. Before changing any note, compare the source PDF, this inventory and the 2019 regression test together.

## Marking edge cases retained

- Question 1(b) accepts tenor or baritone.
- Question 1(c) awards one mark each for chorus and major key.
- Question 2(1) accepts 2, 4, their number words, 2/4 and 4/4.
- Question 2(2) accepts accordion, flute or whistle.
- Question 3(c) accepts B or minim.
- Question 3(f) accepts imperfect cadence or I–V.
- Question 4(c) accepts minimalist, minimalism or minimal.
- Question 6(c) accepts electric, rhythm or lead guitar.
- Question 7(a)(ii) accepts sitar and/or tabla.
- Question 7(b)(ii) must identify at least two distinct official concepts. Relevant concepts include male voice; solo or unaccompanied singing/song/story; strophic form; Scottish, Doric, accent or dialect; and farming or work. A phrase such as `He is singing about his life` earns the mark because it contains the separate male and singing concepts.

## Question 8 rules

- Award at most two concepts per heading and five marks overall.
- Full marks require concepts from at least three headings.
- `Repetition` or `ostinato` can gain only one mark across Melody/harmony and Rhythm/tempo.
- Only concepts which actually earn marks are highlighted in green.
- Accept the official instrument alternatives and spellings, including keyboard or synthesizer alongside saxophones.
- Do not accept `bass` or `double bass` for bass guitar.
- Do not accept `drums` for drum kit, cymbals or hi-hat.
- Do not accept `guitar` or acoustic guitar for electric or lead guitar.
- Accept `mf`, `mezzo forte`, `f` or `forte`; do not accept English dynamic equivalents.

## Required regression checks

Run:

- `digital-question-papers/tests/national5-2019.test.js`
- `digital-question-papers/tests/exam-engine.test.js`
- the earlier 2015, 2016, 2017 and 2018 paper tests
- `pnpm test:desktop-layout`

The 2019 test includes official alternatives and explicit rejections, the two-concept Bothy ballad reason rule, marker count/order/duration checks, notation structure and bar-duration checks, Question 8 caps and de-duplication, score-render smoke testing and a complete automatic `40/40` attempt.

## Checklist for the next import

1. Render both official PDFs and create a complete mark inventory before encoding questions.
2. Write an explicit pitch-and-rhythm inventory for every notation bar; confirm accidentals, beaming, rests, bar totals, editable items and the final barline against a high-resolution source image.
3. Separate printed notation from pupil-applied corrections so every requested notation answer must be physically placed.
4. Transcribe every track with word timestamps before setting any audio marker, then verify each cue against its waveform boundary.
5. Encode all official accepted alternatives and explicit exclusions before testing sample answers.
6. Add exact regression checks for notation content, marker values, duration bounds, marking caps, de-duplication and a full-mark attempt.

### Source engraving and entry follow-up — 5 November 2026

The source downward beam groups are explicit where the general mixed-height rule disagreed, and the initial B4 minim points down. The independent source fixture and real keyboard/drag/Clear checks are recorded in the audit evidence.


### 6 November audit: captured guide arrows

The shared Question 2 connector retains its original outline, dimensions and vertical/horizontal layout, with CSS positioning on an HTML wrapper and an untransformed inner SVG. This repairs arrows missing from html2canvas/Share captures while preserving the on-screen source layout. Both-layout regressions and fresh eleven-paper exports cover the change (A113).

## Fine source and engraving continuation — 6 November 2026

- Restore source-regular score captions: q3: Rhythm, Notes. Captions and pupil-entered answers remain separate.
- The two-row chord options use the source’s regular weight. National 5 2014 remains the explicit bold exception.

Final browser and actual Share PDF evidence is tracked in docs/past-paper-maintenance.md. Listening and physical-device checks remain separate.

## Audio cue-boundary continuation — A176, 7 November 2026

Fresh local speech-recognition windows and full-track waveform onsets confirm the following timing corrections. These values supersede earlier marker tables for the listed cues. Each retains approximately 0.15 seconds before the reviewed acoustic onset. The audio files themselves are unchanged. Full-track listening and physical-device audition remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q3 | 2 | 2nd | 178.68 | 177.81 |
| q4 | 6 | (g) | 377.30 | 375.78 |

Exact marker regressions and fresh measured-duration bounds protect these values. Detailed evidence: `audit/2026-11-05/a176-cue-corrections.json`.

## Remaining cue-flag review — A177, 7 November 2026

The flagged cues below were checked against independent local recognition windows and complete-track waveform onsets. The exact corrected values supersede earlier timing tables for these marker identities. The audio files, question wording, notation and answer keys are unchanged. Full listening and physical-device checks remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q1 | 0 | (a) | 6.44 | 5.96 |
| q2 | 2 | 3rd | 278.70 | 278.09 |
| q3 | 3 | 3rd | 234.70 | 234.10 |
| q4 | 0 | (a) | 6.92 | 6.54 |

Detailed per-flag evidence: `audit/2026-11-05/a177-cue-flag-review.json`. The shared exact-marker regression uses the A177 source-duration and waveform fixture.
