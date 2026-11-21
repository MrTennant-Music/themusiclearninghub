# National 5 Music 2026 import notes

## Official sources

- Question paper: `exampapers/n5/2026/N5_Music_QP_2026.pdf`
- Marking instructions: `exampapers/n5/2026/mi_N5_Music_mi_2026.pdf`
- Official audio: tracks 01–09 in `exampapers/n5/2026/`
- Interactive paper: `digital-question-papers/papers/national5-2026.js`

The source paper and marking instructions were extracted as text and rendered at 300 dpi. Question 3 was checked from the full 300 dpi page and against the marking-instruction answer image. The paper contains eight questions worth `7, 4, 6, 7, 4, 3, 4, 5` marks, for 40 marks in total.

## Audio calibration

Every official question track was transcribed with the local Whisper workflow before cue placement. The 28 section markers are protected in `digital-question-papers/tests/national5-2026.test.js`; the test also checks chronological order and the measured duration of every official track.

Marker counts by question are `6, 3, 4, 5, 3, 2, 2, 3`. Track 01 remains the opening instructions and tracks 02–09 map to Questions 1–8.

## Question 3 notation audit

The score is in G major and 3/4, with a one-crotchet D4 anacrusis. Sixteen numbered bars follow. Bars 1–15 contain three crotchet beats each; the final printed bar contains a two-beat tied minim and is an explicit partial-bar exception.

The exact bar inventory, including every printed rhythm, rest, accidental, missing-note index, tie and final double barline, is asserted in `digital-question-papers/tests/national5-2026.test.js`. Bar 11 requires the three crotchets `B4, C5, B4`. The other official literacy answers are 3/4, an accepted quiet dynamic (`mp`, `p` or `mf` and their Italian names), a tone/major 2nd, three beats and an imperfect cadence.

A later live-browser audit found that the ASCII pitch names `C#4` and `F#4` did not have staff-step mappings, although the inventory itself was correct. The shared pitch map now preserves those pitch names while placing them at the C4 and F4 staff heights, and the regression test rejects any rendered `NaN` coordinate.

On 2 November 2026, the official Question 3 page was rendered again at 600 dpi and the lyric underlay was independently checked note by note. The confirmed text begins with `Ten` under the anacrusis, follows all 16 printed bars, leaves rests and the tied continuation without a new syllable, and begins the final `floor.____` extender under bar 15 so it continues beneath bar 16. The time-signature answer position was moved 7 px right while remaining blank before the pupil answers, and the two printed C-sharp accidentals were moved 3 px left. These user-confirmed corrections are protected by the National 5 2026 regression inventory and rendering checks.

The same user-confirmed symbol movement was repeated: the time-signature answer is now a further 7 px right and both printed C-sharp accidentals are a further 3 px left. The four score systems use 10 px more vertical separation per system gap, with a correspondingly taller score view box, and this paper's lyric underlay explicitly uses the locally supplied Trebuchet MS font.

## Marking decisions

- Question 1 accepts the official alternatives, including bass or baritone and the two required concepts in part (e).
- Question 2 accepts the official named or shortened forms for the four guide answers.
- Question 7 reason fields require two distinct pieces of evidence, matching the marking instructions.
- Question 8 awards no more than two concepts under one heading, requires three headings for full marks, shares the single repetition credit across headings and preserves the official acceptance and rejection distinctions such as `violins` versus `violin` and `drum kit` versus `drums`.

## Regression coverage

`digital-question-papers/tests/national5-2026.test.js` verifies the 40-mark structure, source and audio availability, all marker values and bounds, official alternatives and exclusions, the complete Question 3 pitch-and-rhythm inventory, editable-note indices, bar totals, final barline, finite score rendering and a complete 40/40 response set.

## 2026-11-02 final cross-paper sweep

- The 45-minute Exam Mode policy, 40-mark total, blank-paper zero score and all eight registered audio tracks are now also protected by the ten-paper cross-paper regression.
- All eight audio files decoded successfully; every calibrated marker remains chronological and within its measured source track.
- Practice Mode, Exam Mode, All Questions, blank submission, marked feedback, the marking-instruction link and QR generation were rechecked in the browser with no console or layout errors.


## 5 November 2026 independent marking review

Official marking instructions page 3 accept “any 2nd” for Q3(c). Preserve minor second/minor 2nd as well as the musically precise tone/major second; semitone by itself remains unaccepted.

### Source engraving and entry follow-up — 5 November 2026

The printed middle-line B4 crotchets point down; explicit directions preserve those stems while retaining existing lyrics, layout and source pitch corrections. The independent source fixture and real keyboard/drag/Clear checks are recorded in the audit evidence.


### 6 November audit: captured guide arrows

The shared Question 2 connector retains its original outline, dimensions and vertical/horizontal layout, with CSS positioning on an HTML wrapper and an untransformed inner SVG. This repairs arrows missing from html2canvas/Share captures while preserving the on-screen source layout. Both-layout regressions and fresh eleven-paper exports cover the change (A113).

## Fine source and engraving continuation — 6 November 2026

- Restore source-regular score captions: q3: (c) Interval, (d) Value, (e) Notes. Captions and pupil-entered answers remain separate.
- The two-row chord options use the source’s regular weight. National 5 2014 remains the explicit bold exception.
- Replace the floor.____ text approximation with floor. plus one continuous line from bar 15 to the tied bar-16 notehead. Pitches, rhythm, ties and syllables are unchanged; this supersedes the old underscore rendering representation.

Final browser and actual Share PDF evidence is tracked in docs/past-paper-maintenance.md. Listening and physical-device checks remain separate.

## Remaining cue-flag review — A177, 7 November 2026

The flagged cues below were checked against independent local recognition windows and complete-track waveform onsets. The exact corrected values supersede earlier timing tables for these marker identities. The audio files, question wording, notation and answer keys are unchanged. Full listening and physical-device checks remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q1 | 0 | (a) | 4.66 | 5.96 |
| q1 | 2 | (c) | 89.80 | 95.76 |
| q2 | 0 | 1st | 91.96 | 95.66 |
| q5 | 0 | 1st | 85.11 | 83.77 |
| q6 | 0 | 1st | 52.84 | 54.77 |
| q7 | 1 | (b) | 81.55 | 80.99 |
| q8 | 0 | 1st | 37.99 | 41.30 |

Detailed per-flag evidence: `audit/2026-11-05/a177-cue-flag-review.json`. The shared exact-marker regression uses the A177 source-duration and waveform fixture.
