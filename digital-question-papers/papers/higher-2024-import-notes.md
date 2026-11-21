# Higher Music 2024 import notes

## Source inventory

- Official question paper: `exampapers/higher/2024/Music H 2024 Paper.pdf` (20 pages).
- Official marking instructions: `exampapers/higher/2024/Music H 2024 Answers.pdf` (6 pages).
- Official audio: Track 01 is the opening announcement; Tracks 02–09 are Questions 1–8.
- Question marks: `4, 5, 3, 6, 6, 6, 5, 5` (40 total).
- Question 8 is a copyrighted lyric-placement question. The interactive data stores 17 numbered placeholders only; no source lyric is stored.

## Audio calibration

All eight question tracks were transcribed with the local `small.en` Whisper model. Ambiguous cue windows in Questions 1, 3 and 5 were re-transcribed separately with word timestamps and source-specific prompt text.

| Question | Calibrated marker times (seconds) | Duration (seconds) |
| --- | --- | --- |
| 1 | 41.66, 107.28, 215.68, 242.48 | 281.97 |
| 2 | 70.00, 145.00, 221.00 | 308.80 |
| 3 | 15.88, 47.60, 83.42, 133.12 | 179.96 |
| 4 | 11.20, 215.00, 302.00, 391.15 | 570.44 |
| 5 | 45.32, 132.44, 218.19, 347.28, 370.40, 408.40, 435.85 | 476.45 |
| 6 | 45.32, 98.43, 148.83 | 371.10 |
| 7 | 118.99, 210.81, 266.88, 379.25, 457.21, 544.95, 613.04 | 748.20 |
| 8 | 104.04, 207.76, 310.76 | 426.43 |

The regression test protects all 35 marker values, chronological order and duration bounds.

## Question 4 notation audit

The official page 7 and the corresponding marking-instruction pages were rendered at 600 dpi. The six staff systems were cropped and inspected independently against the F-major treble-clef pitch map.

- Key: F major.
- Time signature: 4/4.
- Score: 24 complete bars across six systems: `1–4`, `5–8`, `9–12`, `13–16`, `17–21`, `22–24`.
- Bar totals: every encoded bar contains four crotchet beats.
- The complete lyric underlay requested by the teacher is stored alongside the notes so each syllable remains aligned with its printed note.
- Source-confirmed corrections include F4 rather than E4 in the repeated opening figures, B♭4 rather than B4 in bars 4 and 8, D5 at the end of bars 10 and 14, and the higher-register melody in bars 18–24.
- On 4 August 2026 the teacher confirmed the complete pitch sequence: `b` means B♭ in F major; the teacher-supplied line 3 pattern also applies to line 4. The remaining corrections are protected in the bar inventory regression test.
- The teacher later confirmed that the first two A4 notes in bar 4 are tied.
- The two D5 notes in bar 19 are tied.
- Bar 21 is C5 crotchet tied from the final C5 quaver of bar 20, followed by D5 quaver and A4 quaver tied to A4 minim.
- Bar 17 contains a minim rest, crotchet rest, quaver rest and G4 quaver; it is not a full-bar rest.
- Bars 23 and 24 are tied G5 semibreves, with the bar-22 G5 quaver tied into bar 23. The earlier F5 description was a prose error; the encoded pitches were already G5.
- (a) bar 3: a fifth.
- (b) bar 6: two corrected quavers; tails may appear on either side.
- (c) bars 9–10: either or both C5 notes in bar 10 may be circled as the dominant of F major.
- (d) bar 14 one octave lower in bass clef: A3 crotchet, C4 quaver tied to C4 crotchet.
- (e) bars 19 and 21: B♭ then F, IV then I, or 4 then 1.
- (f) D.C., DC or Da capo at, below or after bar 24.
- Final barline: single barline.

The score is stored as structured bar data in `exam-notation.js`. The regression inventory protects every pitch and rhythm in all 24 bars, all within-bar and cross-bar ties, the 73 printed lyric items, editable indices, transposed pitches and rhythms, chord bars, Da capo target, source-measured system/bar geometry and final barline type.

## Official marking decisions preserved

- Questions 1 and 5 use the Higher additional-answer deduction rule.
- Question 2 accepts cross rhythms or triplets for 3 against 2, accepts A7 for dominant 7th and rejects dominant on its own.
- Question 4 accepts all official interval, dominant-note, chord and Da capo alternatives.
- Question 6 credits no more than two concepts per heading, accepts concepts under another heading, rejects major scale and minor on their own, and accepts only the listed Italian tempo terms.
- Question 7 marks Column C only and deducts additional incorrect selections.
- Question 8 accepts glissando on line 1, male on line 6 or 7, harmony on line 10, interrupted on line 16 and perfect on line 17.

## Question 8 lyric-text decision

On 2 August 2026, the teacher supplied and requested the original 17 lyric lines for Higher 2024 Question 8. This paper is therefore a specific exception to the placeholder policy. The exact row order is protected by a regression hash without duplicating the text in this note.

## Verification completed

- The dedicated Higher 2024 paper and Higher literacy rendering regressions pass.
- The permanent desktop-layout audit passes.
- Regression checks cover every Question 4 pitch, rhythm, tie, lyric item, editable index, answer-box position, chord field and final-system boundary.

## 5 November 2026 continuing independent audit

Fresh seven-staff 300 dpi calibration and second independent 24-bar comparison protect the complete inventory. Corrected source B-flat/mixed-beam directions and explicit below ties in bars 4/8. All three transposed notes passed keyboard/drag/marking/Clear. A final rerender follows the last tie/beam corrections.

### 6 November audit — marked score text

Blank interval/value/key/ornament corrections that use the shared Higher text-answer helper now occupy its established answer baseline. A wrong entered value remains red there; its accepted answer appears in the written feedback. This avoids printed-caption collisions without changing Practice input positions, source notation or marking rules. Actual affected-paper exports pass in Chromium and WebKit; see audit finding A110.

### 6 November fine source typography and lyric clearance

The printed score lyrics use Trebuchet, confirmed by actual source font names and fresh 300 dpi lyric-line crops. The shared score now uses the supplied local paper font for this paper. Bar 19 uses lyric offsets [0,-2,2,0] and bar 20 uses [0,-5,2,0,0,4]. These are small optical lyric adjustments needed to keep neighbouring words separate in the correct font; all source pitches, rhythms, lyric syllables and marking remain unchanged. Full-score browser captures after the adjustment have no recorded lyric overlaps. Source typography, Practice/feedback comparisons and actual PDF follow-up are tracked in docs/past-paper-maintenance.md separately from listening and physical-device checks.

## Fine source and engraving continuation — 6 November 2026

- Restore source-regular score captions: q4: (a) Interval, (b) Rhythm, (d) Transpose, (e) Chords, C, V. Captions and pupil-entered answers remain separate.
- The comparison footer “5 marks” retains its printed bold weight; Higher 2015 remains regular.

Final browser and actual Share PDF evidence is tracked in docs/past-paper-maintenance.md. Listening and physical-device checks remain separate.

## Audio cue-boundary continuation — A176, 7 November 2026

Fresh local speech-recognition windows and full-track waveform onsets confirm the following timing corrections. These values supersede earlier marker tables for the listed cues. Each retains approximately 0.15 seconds before the reviewed acoustic onset. The audio files themselves are unchanged. Full-track listening and physical-device audition remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q7 | 2 | E1 2nd | 266.88 | 292.48 |

Exact marker regressions and fresh measured-duration bounds protect these values. Detailed evidence: `audit/2026-11-05/a176-cue-corrections.json`.

## Remaining cue-flag review — A177, 7 November 2026

The flagged cues below were checked against independent local recognition windows and complete-track waveform onsets. The exact corrected values supersede earlier timing tables for these marker identities. The audio files, question wording, notation and answer keys are unchanged. Full listening and physical-device checks remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q5 | 0 | (a) 1st | 45.32 | 45.21 |
| q5 | 3 | (b) 1st | 347.28 | 346.93 |
| q5 | 4 | (b) 2nd | 370.40 | 370.01 |
| q5 | 5 | (c) 1st | 408.40 | 408.81 |
| q6 | 0 | 1st | 45.32 | 48.35 |

Detailed per-flag evidence: `audit/2026-11-05/a177-cue-flag-review.json`. The shared exact-marker regression uses the A177 source-duration and waveform fixture.
