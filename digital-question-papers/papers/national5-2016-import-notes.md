# National 5 Music 2016 import notes

Completed: 31 July 2026

## Official sources

- Question paper: `exampapers/n5/2016/N5_Music_QP_2016.pdf`
- Marking instructions: `exampapers/n5/2016/mi_N5_Music_mi_2016.pdf`
- Introduction and Question 1–8 audio: official Tracks 1–9 in `exampapers/n5/2016/`
- Reference implementation: completed National 5 Music 2014 Digital Past Paper
- Previous review checklist: `digital-question-papers/papers/national5-2015-review-notes.md`

## Paper inventory

The paper contains eight questions worth 40 marks in total:

| Question | Marks | Main interaction |
| --- | ---: | --- |
| 1 | 6 | Choices and short answers |
| 2 | 4 | Four-part vertical music guide |
| 3 | 6 | Shared interactive notation score |
| 4 | 8 | Vocal-music choices, text and chord grid |
| 5 | 4 | Four-section category grid |
| 6 | 3 | Sentence completion with one combined mark |
| 7 | 4 | Style plus supporting reason |
| 8 | 5 | Rough work and concept-marked final answer |

The question totals and all individual parts both total 40. This is enforced by `digital-question-papers/tests/national5-2016.test.js`.

## Audio transcription and calibrated markers

Every official question track was decoded locally and transcribed with the local Whisper tiny English model using word timestamps. Cue starts were checked against the surrounding silence and waveform onset, including the less reliable music-adjacent transcription regions in Questions 2 and 5.

| Question | Measured duration | Calibrated markers |
| --- | ---: | --- |
| 1 | 278.965 s | (a) 6.86, (b) 52.02, (c) 98.16, (d) 142.54, (e) 188.44, (f) 234.64 |
| 2 | 307.572 s | 1st 100.12, 2nd 169.02, 3rd 238.72 |
| 3 | 414.523 s | Preview 15.28, 1st 127.98, 2nd 192.68, 3rd 257.60 |
| 4 | 364.925 s | (a) 8.18, (b) 47.63, (c) 104.86, (d) 146.30, (e) 197.22, (f) 245.34, (g) 326.32 |
| 5 | 279.337 s | 1st 84.80, 2nd 148.68, 3rd 212.03 |
| 6 | 191.426 s | 1st 57.12, 2nd 124.12 |
| 7 | 173.732 s | (a) 6.70, (b) 90.40 |
| 8 | 348.671 s | 1st 47.00, 2nd 107.28, 3rd 167.00 |

The paper has 30 markers. The regression test locks every value, the marker count, chronological order, audio-file existence and track-duration bounds.

## Question 3 notation inventory

The shared score uses F major, 3/4 time and four systems of four bars. Lyrics are attached to individual note positions rather than placed as whole phrases.

| Bar | Pitch and rhythm inventory |
| ---: | --- |
| 1 | C dotted minim |
| 2 | G crotchet, F minim |
| 3 | E dotted crotchet, D quaver, C quaver, B flat quaver |
| 4 | C minim, F crotchet |
| 5 | E dotted crotchet, D quaver, C quaver, B flat quaver |
| 6 | C minim, F crotchet |
| 7 | G dotted minim tied into bar 8 |
| 8 | G minim tied from bar 7, A crotchet |
| 9 | F dotted minim |
| 10 | C crotchet, A dotted crotchet, G quaver |
| 11 | F dotted minim |
| 12 | C crotchet, A dotted crotchet, G quaver |
| 13 | F crotchet, A crotchet, C crotchet |
| 14 | F crotchet, E dotted crotchet, D quaver |
| 15 | Missing E crotchet, D dotted crotchet, C quaver |
| 16 | D dotted minim and final double barline |

Question 3 interactions reuse the shared Bravura renderer and established notation behaviour:

- 3/4 is applied after the key signature at the beginning.
- Moderato or Andante is placed above bar 1.
- V is an armed one-use placement tool with faint previews above each bar; bar 9 is correct.
- The bracket in bar 5 spans the final C to B-flat quaver pair.
- Bar 13 displays F–A–C, forming F major.
- Bar 15 uses direct hover/drag note entry with a grey preview, a right-aligned Clear control and the printed crotchet–dotted-crotchet–quaver rhythm guide.
- Marked feedback colours pupil notation and places the correct notation beside an incorrect insertion.

## Marking decisions and edge cases

- Question 2 accepts syncopation, dotted rhythm or swing/swung.
- Question 2 accepts simple, 2/4, 4/4 or common time, but deliberately rejects “2 beats” and “4 beats”.
- Question 2 accepts glissando or gliss and rejects English substitutes.
- Question 3(b) accepts Moderato or Andante only; Adagio is rejected.
- Question 3(d) accepts tone, whole tone, 2nd, second or 2.
- Question 4(b) awards one mark per correct selection and retains an earned mark when the other choice is wrong.
- Question 7(a)(ii) accepts compound time, 6/8, 12/8 or an explanation that the beat divides into three. Triplets is rejected.
- Question 7(b)(ii) accepts syncopation, off beat, cross rhythms, percussion, samba, salsa or dance rhythms. Individual instruments are rejected.
- Question 8 uses a maximum of two marks per heading and five overall, with full marks requiring at least three headings.
- Question 8's combined 5-mark numeral sits at the right of the third-playback sentence and is not repeated beside the final-answer lines.
- Question 8 rejects “fills”, “pipes”, “drums”, acoustic guitar, bass guitar and guitar alone as required by the official guidance.
- Question 8 accepts electro-acoustic guitar.
- “Mezzo forte” is protected from accidentally earning both the `mf` point and the separate `f/ff` point.
- Only the five concepts which actually receive marks are highlighted in green.

## Checks completed

- Official wording and source mark positions checked against all usable question-paper pages.
- Every accepted answer and every visible choice tested.
- Important official exclusions tested.
- Fully correct automatic-marking result tested at 40/40.
- All 30 audio markers tested.
- Question 3 pitch, rhythm, lyric and interaction inventory tested.
- Full project test suite passed.
- Fixed 1280px desktop-layout audit passed.

## Checklist for the next paper

1. Read this file and `national5-2015-review-notes.md` before creating paper data.
2. Extract and render both official PDFs before implementation.
3. Build and test the complete mark inventory before styling.
4. Transcribe all official audio locally with Whisper before writing any marker values.
5. Verify speech cues against waveform boundaries where music confuses the transcript.
6. Find the closest Practice Questions notation interaction and record a bar-by-bar musical inventory.
7. Encode every accepted alternative and every explicit rejection from additional guidance.
8. Test partial marks, concept caps, mark positions, feedback highlighting and a complete full-mark attempt.
9. Run the complete test suite and the fixed-desktop layout audit.

## Independent continuation audit — 5 November 2026

The official page-6 score was freshly read at 300 dpi, with all four raster staff systems calibrated independently. The complete sixteen-bar fixture records every printed pitch/rhythm, both cross-bar tie endpoints, beam groups, editable bar 15 and the final thin/thick barline. Bars 3 and 5 require downward stems on the C5–B-flat4 quaver pair. Those explicit stems are now encoded. The final system alone receives 30 additional score units of clearance so the bar-15 rhythm guide cannot overlap bar-11 lyrics; other papers' shared four-bar grids retain their spacing. All three missing notes were entered through the keyboard, marked, cleared and re-entered in a real browser.


### 6 November audit: captured guide arrows

The shared Question 2 connector retains its original outline, dimensions and vertical/horizontal layout, with CSS positioning on an HTML wrapper and an untransformed inner SVG. This repairs arrows missing from html2canvas/Share captures while preserving the on-screen source layout. Both-layout regressions and fresh eleven-paper exports cover the change (A113).

## Fine source and engraving continuation — 6 November 2026

- The two-row chord options use the source’s regular weight. National 5 2014 remains the explicit bold exception.

Final browser and actual Share PDF evidence is tracked in docs/past-paper-maintenance.md. Listening and physical-device checks remain separate.

## Audio cue-boundary continuation — A176, 7 November 2026

Fresh local speech-recognition windows and full-track waveform onsets confirm the following timing corrections. These values supersede earlier marker tables for the listed cues. Each retains approximately 0.15 seconds before the reviewed acoustic onset. The audio files themselves are unchanged. Full-track listening and physical-device audition remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q1 | 4 | (e) | 188.44 | 188.03 |
| q1 | 5 | (f) | 234.64 | 233.89 |
| q4 | 6 | (g) | 326.32 | 324.62 |

Exact marker regressions and fresh measured-duration bounds protect these values. Detailed evidence: `audit/2026-11-05/a176-cue-corrections.json`.

## Remaining cue-flag review — A177, 7 November 2026

The flagged cues below were checked against independent local recognition windows and complete-track waveform onsets. The exact corrected values supersede earlier timing tables for these marker identities. The audio files, question wording, notation and answer keys are unchanged. Full listening and physical-device checks remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q1 | 0 | (a) | 6.86 | 6.25 |
| q1 | 1 | (b) | 52.02 | 51.36 |
| q1 | 2 | (c) | 98.16 | 97.54 |
| q1 | 3 | (d) | 142.54 | 142.10 |
| q2 | 1 | 2nd | 169.02 | 168.84 |
| q2 | 2 | 3rd | 238.72 | 238.18 |
| q3 | 2 | 2nd | 192.68 | 192.25 |
| q3 | 3 | 3rd | 257.60 | 257.22 |
| q4 | 0 | (a) | 8.18 | 7.56 |
| q4 | 2 | (c) | 104.86 | 104.21 |
| q4 | 3 | (d) | 146.30 | 145.86 |
| q4 | 4 | (e) | 197.22 | 196.85 |
| q4 | 5 | (f) | 245.34 | 244.78 |
| q5 | 0 | 1st | 84.80 | 84.29 |
| q5 | 1 | 2nd | 148.68 | 148.54 |
| q6 | 1 | 2nd | 124.12 | 123.79 |
| q7 | 0 | (a) | 6.70 | 5.88 |
| q7 | 1 | (b) | 90.40 | 89.95 |
| q8 | 1 | 2nd | 107.28 | 106.84 |

Detailed per-flag evidence: `audit/2026-11-05/a177-cue-flag-review.json`. The shared exact-marker regression uses the A177 source-duration and waveform fixture.
