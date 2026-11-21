# Higher Music 2016 import notes

Read this file before importing Higher Music 2017 or any later Higher paper.

## Authority and completed checks

- The official source is `exampapers/higher/2016/NH_Music_QP_2016.pdf`; the official marking instructions are `exampapers/higher/2016/mi_NH_Music_mi_2016.pdf`.
- The paper contains eight questions worth `4, 5, 3, 6, 6, 6, 5, 5` marks, totalling 40.
- The question paper and marking instructions were rendered and audited at 300 dpi on 2 August 2026.
- The focused Higher 2016 test, complete 87-test project suite and desktop-layout audit passed on 2 August 2026.
- A local browser pass verified the complete Question 4 score and the 20-row Question 8 table.

## Question 8 lyric-text decision

- On 2 August 2026, the teacher supplied and requested the original 20 lyric lines for Higher 2016 Question 8. This paper is therefore a specific exception to the placeholder policy.
- Later lyric-placement papers continue to use numbered placeholder text unless the teacher explicitly requests otherwise.
- Preserve the exact number and numbering of source lyric rows so official line-position marking still works.
- Preserve the official feature list, underlined answer words, accepted rows, duplicate accepted positions, additional-answer rule and audio.
- The exact teacher-supplied row order is protected by a regression hash without duplicating the text in the test or these notes.
- Accepted placements are: ritardando on row 3 or 4; arpeggio on row 5; modulation on row 6 or 12; tremolando on row 6; glockenspiel on row 19.

## Official answer inventory

- **Question 1:** Ritornello; Perfect cadence; Basso continuo; Harmonics (singular `Harmonic` is also accepted).
- **Question 2:** Oboe; Syncopation or Ostinato; Arco; Pedal; Melodic minor. Do not accept repetition or riff for the second answer.
- **Question 3:** Musique concrète; Irregular time signature/metre, time changes or an indication of seven beats in the bar; Jazz funk. Do not accept `Jazz` or `Funk` alone.
- **Question 4:** F major or F; Mordent; A dotted crotchet followed by G quaver in bar 5; 5th; E4-F4-G4 quavers at the end of bar 14; G3-F3-D3-E3-F3 one octave lower, with the final F represented by the printed tied minim and quaver.
- **Question 5:** Lied; Interrupted cadence; Strophic; Diminished 7th; Coloratura; Modal.
- **Question 6:** Positive marking, capped at two concepts per category. Credit valid concepts regardless of the heading under which the pupil writes them. The complete accepted inventory is protected in `tests/higher-2016.test.js`.
- **Question 7:** Dominant 7th; Trill; Alberti bass; Simple time; Classical. Only Column C is marked and the official additional-answer deduction applies.
- **Question 8:** Use the placeholder policy and accepted rows recorded above.

## Question 4 notation audit

- The source is in F major and 4/4, with a three-quaver anacrusis followed by 16 numbered treble-clef bars.
- The complete bar-by-bar pitch and rhythm inventory is stored as `HIGHER_2016_Q4_BARS` in `digital-question-papers/exam-notation.js` and protected by `tests/higher-2016.test.js`. The user-confirmed numbered-bar pitches are recorded there exactly; shorthand `df` and `ef` are represented as D4 and E4 because the printed F-major score has no corresponding accidentals.
- User confirmation: bar 8 is F4-F4-C5-D5-E5.
- Bars 1-15 total four crotchet beats. The printed final bar has 2.5 beats: tied F minim and quaver, with no following rest. It complements the 1.5-beat pickup. The older inventory contained a hidden quaver rest; the 5 November independent source audit removed that unprinted item.
- Bar 5 retains the two deliberately incorrect printed crotchets. Pupils arm the shared dot or quaver-tail tools and place the corrections directly on the first two notes. The accepted result is A dotted crotchet followed by G quaver.
- Bar 14 keeps editable note indices `[4, 5, 6]`, with E4-F4-G4 quavers as the answer.
- The six printed noteheads used by the transposition task are G4-F4-D4-E4-F4 tied to F4: the final two noteheads are the tied minim and quaver at the start of bar 16. The transpose box surrounds this complete source group and both staves.
- The transposition answer uses six written noteheads: G3-F3-D3-E3-F3-F3. The final F quaver is a separate required entry; it must not appear automatically when the tied F minim is placed. Once both F slots are entered, they are tied in the bass clef.
- The first four entered transposition quavers share one beam and each lower note is aligned under its corresponding printed source note above.
- Key, ornament and interval answers are typed inside their printed score boxes. Rhythm and pitch answers use shared Bravura notation, grey hover previews, dragging, feedback colours and right-aligned Clear controls.
- The barline between bars 15 and 16 is drawn on both staves. Neither stave has a final barline after bar 16.

## Audio markers

The eight official tracks contain 32 calibrated markers:

- Question 1: `45`, `120.5`, `227.12`.
- Question 2: `72.98`, `178.02`, `283.96`.
- Question 3: `6.78`, `55.3`, `102.68`.
- Question 4: `14.86`, `259.14`, `381.04`, `503.46`.
- Question 5: `47.8`, `127.4`, `206.7`, `314.83`, `379.22`, `419.62`.
- Question 6: `53.92`, `138.32`, `223.76`.
- Question 7: `121.82`, `191.56`, `292.12`, `356.54`, `455.22`, `521.56`, `611.56`.
- Question 8: `108.84`, `230.54`, `352.56`.

The regression test checks the exact values, count, chronological order and measured track-duration bounds.

## 5 November 2026 independent marking review

MI page 5: unspecified ornament receives credit only in the absence of the named ornaments; do not gain a second mark from “mordent and ornaments”. MI page 6 uses “dominant 7th” at lyric line 5. The 6 November 2026 direct source-crop audit corrected the earlier transcription note: question-paper pages 14 and 15 underline **dominant 7th**, while **arpeggio** is bold without an underline. The visible feature now matches that source. Preserve the existing accepted “arpeggio” and full-phrase alternatives at that line alongside “dominant 7th”.


## 5 November 2026 fresh notation audit

All five treble systems plus the bass staff were separately calibrated at 300 dpi. Source-down beams/stems are explicit in bars 1, 5, 7, 10, 14 and 15. The final bar contains only the tied F4 minim and quaver (2.5 beats), with no rest and no final barline. Its old invisible rest was removed from the inventory. `tests/fixtures/higher-2016-q4-source-audit.json` protects every pitch, rhythm, tie, beam and editable index. All nine missing/transposition slots passed keyboard, dragging, preview, marking and Clear checks.

### 6 November audit — marked score text

Blank interval/value/key/ornament corrections that use the shared Higher text-answer helper now occupy its established answer baseline. A wrong entered value remains red there; its accepted answer appears in the written feedback. This avoids printed-caption collisions without changing Practice input positions, source notation or marking rules. Actual affected-paper exports pass in Chromium and WebKit; see audit finding A110.

## Fine source and engraving continuation — 6 November 2026

- The comparison footer “5 marks” retains its printed bold weight; Higher 2015 remains regular.
- Raster source notation captions retain their printed Times-style serif family; these are visual family comparisons, not extracted raster font names.

Final browser and actual Share PDF evidence is tracked in docs/past-paper-maintenance.md. Listening and physical-device checks remain separate.

## Audio cue-boundary continuation — A176, 7 November 2026

Fresh local speech-recognition windows and full-track waveform onsets confirm the following timing corrections. These values supersede earlier marker tables for the listed cues. Each retains approximately 0.15 seconds before the reviewed acoustic onset. The audio files themselves are unchanged. Full-track listening and physical-device audition remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q7 | 1 | E2 1st | 191.56 | 190.06 |
| q7 | 5 | E2 3rd | 521.56 | 520.27 |

Exact marker regressions and fresh measured-duration bounds protect these values. Detailed evidence: `audit/2026-11-05/a176-cue-corrections.json`.

## Remaining cue-flag review — A177, 7 November 2026

The flagged cues below were checked against independent local recognition windows and complete-track waveform onsets. The exact corrected values supersede earlier timing tables for these marker identities. The audio files, question wording, notation and answer keys are unchanged. Full listening and physical-device checks remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q3 | 0 | (a) | 6.78 | 7.10 |
| q4 | 0 | Guide | 14.86 | 14.42 |
| q5 | 1 | (a) 2nd | 127.40 | 126.96 |
| q5 | 2 | (a) 3rd | 206.70 | 206.24 |
| q5 | 5 | (c) 2nd | 419.62 | 419.24 |
| q6 | 0 | 1st | 53.92 | 52.31 |
| q7 | 0 | E1 1st | 121.82 | 121.36 |
| q7 | 4 | E1 3rd | 455.22 | 455.61 |

Detailed per-flag evidence: `audit/2026-11-05/a177-cue-flag-review.json`. The shared exact-marker regression uses the A177 source-duration and waveform fixture.
