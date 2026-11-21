# Higher Music 2026 import notes

## Source inventory

- Official question paper: `exampapers/higher/2026/NH_Music_QP_2026.pdf` (20 pages).
- Official marking instructions: `exampapers/higher/2026/mi_NH_Music_mi_2026.pdf` (6 pages).
- Official audio: Track 01 is the opening announcement; Tracks 02–09 are Questions 1–8.
- Question marks: `5, 5, 4, 6, 4, 6, 5, 5` (40 total).
- The usable question content was compared with the Higher 2025 digital paper and the established National 5 2014 Digital Past Paper interface before implementation.

## Audio calibration

All eight question tracks were transcribed locally with Whisper word timestamps before markers were set. Each spoken question, part, playing and replay cue was identified from the transcript and checked against its local audio boundary. The established small lead-in convention is retained.

| Question | Calibrated marker times (seconds) | Duration (seconds) |
| --- | --- | --- |
| 1 | 43.44, 121.32, 230.77, 275.35, 295.45, 341.83 | 366.68 |
| 2 | 74.10, 188.19, 302.67 | 425.94 |
| 3 | 22.74, 47.17, 76.27, 146.34, 174.24, 206.57 | 259.20 |
| 4 | 12.53, 220.54, 310.08, 399.08 | 578.27 |
| 5 | 44.52, 108.04, 172.71 | 265.63 |
| 6 | 53.33, 140.94, 228.19 | 485.55 |
| 7 | 120.75, 187.22, 267.32, 327.29, 407.08, 466.33, 536.26 | 667.57 |
| 8 | 102.73, 227.53, 352.07 | 489.66 |

The dedicated regression test protects all 35 marker values, the total marker count, chronological order and track-duration bounds.

## Question 4 notation audit

The official score page was rendered at 400 and 600 dpi. A close score crop was then divided into the seven printed staff systems. Staff-line centres were read independently for each system before pitch transcription. Notehead centres—not stems, beams, lyrics or box edges—were used to determine pitch. The marking-instruction answer page was also rendered at high resolution and used only to confirm the deliberately missing items.

- Key: G major.
- Opening time signature: 4/4.
- Bar 20 time signature: 3/4.
- Score: 20 numbered bars across seven systems: `1–2`, `3–5`, `6–8`, `9–11`, `12–13`, `14–17`, `18–20`.
- Rhythmic totals: bars 1–19 each contain four crotchet beats; bar 20 contains three crotchet beats.
- Every pitch, duration, rest, dot, tie, beam group, accidental, barline, lyric syllable and editable index is stored in the structured score inventory.
- Cross-bar ties were checked individually, including bars 3–4, 7–8, 9–10, 11–12, 14–15, 15–16, 16–17, 17–18, 18–19 and 19–20.
- Bar 19 was rechecked in a separate 600 dpi close crop because of its dense semiquaver groups. Its beat total and both internal and cross-bar ties were verified against the printed source.
- Final barline: double barline.

### Interactive answers confirmed from the official marking instructions

- (a) bar 2 one octave lower in bass clef: B3 crotchet, A3 quaver tied to A3 quaver, G3 crotchet.
- (b) bars 6 and 7: a sixth; any type of sixth or `6` is accepted.
- (c) bars 10 and 11: D then G, V then I, or 5 then 1.
- (d) bar 13: G4, B4, G4 and E4 quavers.
- (e) bar 16: a quaver rest between the first two notes.
- (f) bar 20: 3/4.

The complete bar-by-bar pitch and rhythm signature, bar totals, answer indices, accidentals, ties, layout geometry and final barline are protected by `tests/higher-2026.test.js`. The shared Higher notation-rendering test also verifies the completed score, answer boxes, correction layers, time-signature glyph and final barline.

### Follow-up source-fidelity corrections

The completed paper was re-audited against the rendered official score on 1 November 2026.

- The part (a) transpose box was moved to the assessed notes in bar 2 and its bass stave was extended so all four pupil and correction notes remain inside the source box.
- The part (d) notes box was aligned with the blank opening of bar 13 so all four guide, pupil and correction notes remain enclosed.
- Small source-specific horizontal offsets were added to the final three lyric systems to separate `come and go`, `a-way`, `-dy knows` and `it's gon` without changing any note position.
- The part (b) interval box was narrowed to contain only the final note of bar 6 and the first note of bar 7, matching the official page; the adjacent notes now fall outside both vertical edges.
- Rendering regressions now require all four answer noteheads to remain inside both the part (a) and part (d) boxes and protect the audited lyric offsets.
- Live desktop and 390px fixed-canvas checks found no lyric collisions, no horizontal overflow and no browser warnings or errors.

### 2 November 2026 independent score re-audit

After a user identified the incorrect C notes in bar 7, the question-paper score was rendered again at 600 dpi and divided into all seven printed systems. Every notehead centre, rhythm, rest, dot, accidental, tie and beam group was reread from the source, then checked independently a second time. The marking-instruction images were used to confirm only the deliberately missing bar 13 notes, bar 16 rest and bar 20 time signature.

- Bar 7 notes 2 and 4 were corrected from C5 to D5, giving `E5, D5, E5, D5, E5, E5, D5`.
- Bars 2 and 6 now preserve the two separately flagged tied A quavers instead of automatically beaming them.
- The printed internal A4-to-A4 tie in bar 14 was restored.
- User-confirmed source correction: the part (f) box now begins at the opening barline of bar 20 and encloses only that final bar. The 3/4 glyph is offset to compensate for the shared Bravura optical adjustment, keeping the visible time signature immediately inside bar 20 rather than before its barline.
- User-confirmed part (f) geometry refinement: the time-signature box was widened twice, each pass extending it 4px farther left and 7px farther right, while retaining its audited vertical position and height.
- User-confirmed part (b) geometry refinement: the interval box is inset by 5px on both sides, extends 5px farther upward with its bottom edge unchanged, and its answer line is raised by 5px. The box continues to contain only the final note of bar 6 and first note of bar 7.
- User-confirmed part (c) geometry refinement: the given C/IV box is centred above the opening dotted-quaver rest in bar 9 and raised by a further 15px. The main Chords box extends 10px farther upward with its bottom edge unchanged, both individual chord-answer boxes are raised by 10px, and the bar-11 answer box is centred over its opening crotchet rest.
- User-confirmed pitch correction, independently checked against the 600 dpi source crop: after its opening dotted-quaver rest, bar 9 is `G4, E5, D5, E5, D5, E5, D5`. The final D5 is tied into the opening D5 crotchet of bar 10. After its opening crotchet rest, bar 11 is `D5, D5, D5, C5, B4`; the final B4 remains tied into bar 12.
- User-requested 600 dpi re-audit of bars 12 and 13 confirmed bar 12's rests and two beam groups. Its corrected pitches are `B4, rest, B4, A4, A4 tied to A4, G4`, and its opening tied B4 retains the continuation underline printed at the system break. Bar 13's final three-note group was corrected from `A4 quaver, G4 semiquaver, G4 semiquaver` to the source rhythm `A4 semiquaver, G4 quaver, G4 semiquaver`; its A4-to-G4 slur remains in place.
- User-confirmed re-transcription of bars 12-20 corrected the later-system pitch map: bar 12 is `B4, rest, B4, A4, A4 tied to A4, G4`; bar 13 retains the four marking-instruction notes followed by `A4, B4, A4, G4, G4`; bar 14 is `A4, B4, A4, G4, A4, B4, A4 tied to A4, G4, D5`; bars 15-18 are `D5`, then `D5, rest, E5, B4, D5`, then `D5, rest, B4, B4, A4`, then `A4, rest, B4, D5, B4, A4`; bar 19 is `A4, G4, E4, rest, E4, B4, B4, B4 tied to B4, E4, G4`; and bar 20 is `G4` followed by its printed rests. Every cross-bar tie now joins matching pitches.
- User-confirmed bar 19 rhythm is semiquaver-semiquaver-quaver, dotted-quaver rest, single semiquaver, semiquaver-semiquaver-quaver tied into semiquaver-semiquaver-quaver. The phrase slur entering bar 19 was subsequently removed; the A4 cross-bar tie remains.
- User-confirmed bar 19 lyric placement begins `the way it's gon-na be` on the fourth sounding note: `the` follows the dotted-quaver rest, and the tied B4 carries no repeated syllable.
- User-confirmed bar 20 ends with a single barline, not a double barline.
- Following these corrections, the completed bar 13 answer remains `G4, B4, G4, E4` as shown in the official marking instructions.
- Regression coverage now protects the exact pitch-and-rhythm signature of all 20 bars, both un-beamed tied-quaver pairs, all five internal ties, all ten cross-bar ties and the absence of the removed bar 18-to-19 phrase slur.

## Official marking decisions preserved

- Questions 1(a), 5, 7 and 8 use the Higher additional-answer deduction rule.
- Question 1(c) accepts `modal` or `mode`.
- Question 2 accepts `French horn` or `horn`; `pizzicato` or `pizz.`; and `inverted pedal` or `harmonic(s)` where specified by the official instructions.
- Question 3(b) accepts an irregular time signature, time changes, 7/4 or a clear statement of seven beats in the bar.
- Question 4 accepts every official interval and chord-naming alternative listed above.
- Question 6 awards no more than two concepts per heading and accepts valid concepts written under another heading.
- Question 7 marks Column C only and deducts additional incorrect selections.
- Question 8 accepts Perfect on row 3; Tenor on row 5; SATB on row 7 or 8; Modulation on row 8 or 9; and Interrupted on row 13.

## Question 8 lyric grid

The user supplied all 15 lyric lines after the initial import. They are stored in the supplied order alongside the source-paper feature list, numbered placement rows, pupil answer fields and official accepted row positions. The regression test protects the exact text, punctuation and row order.

## Verification checklist

- Run `digital-question-papers/tests/higher-2026.test.js`.
- Run `digital-question-papers/tests/higher-literacy-rendering.test.js`.
- Run the complete Digital Question Papers suite and permanent desktop-layout audit.
- Browser-check all eight questions, the six Question 4 interactions, score feedback and all 15 Question 8 lyric rows.
- Confirm Question 6 does not show an end-of-paper marker; Question 8 remains the paper ending.
- Rebuild and test Music Dictionary Exam Trends whenever the reviewed paper registry changes.

## 2026-11-02 final cross-paper sweep

- Exam Mode was normalised to the Hub-wide 45-minute attempt length and is now protected by both the paper regression and the ten-paper cross-paper regression.
- All eight audio files were decoded again; every marker remains chronological and within the measured track duration.
- Practice Mode, Exam Mode, All Questions, blank submission, marked feedback, the marking-instruction link and the QR link were rechecked in the browser with no console or layout errors.

### 6 November audit — marked score text

Blank interval/value/key/ornament corrections that use the shared Higher text-answer helper now occupy its established answer baseline. A wrong entered value remains red there; its accepted answer appears in the written feedback. This avoids printed-caption collisions without changing Practice input positions, source notation or marking rules. Actual affected-paper exports pass in Chromium and WebKit; see audit finding A110.

### 6 November fine source typography and lyric clearance

The printed score lyrics use Trebuchet, confirmed by actual source font names and fresh 300 dpi lyric-line crops. The shared score now uses the supplied local paper font for this paper. Bar 14 uses [0,0,0,-4,-7,4,16,0,-4,4], and bar 19 uses [0,0,0,0,0,0,-3,4,0,-3,3]. These are small optical lyric adjustments needed to keep neighbouring words separate in the correct font; all source pitches, rhythms, lyric syllables and marking remain unchanged. Full-score browser captures after the adjustment have no recorded lyric overlaps. Source typography, Practice/feedback comparisons and actual PDF follow-up are tracked in docs/past-paper-maintenance.md separately from listening and physical-device checks.

## Fine source and engraving continuation — 6 November 2026

- Restore source-regular score captions: q4: C, IV. Captions and pupil-entered answers remain separate.
- The comparison footer “5 marks” retains its printed bold weight; Higher 2015 remains regular.
- Bar 2’s with has a note-anchored lyric extender under the tied second note; notes and words are unchanged.

Final browser and actual Share PDF evidence is tracked in docs/past-paper-maintenance.md. Listening and physical-device checks remain separate.

## Audio cue-boundary continuation — A176, 7 November 2026

Fresh local speech-recognition windows and full-track waveform onsets confirm the following timing corrections. These values supersede earlier marker tables for the listed cues. Each retains approximately 0.15 seconds before the reviewed acoustic onset. The audio files themselves are unchanged. Full-track listening and physical-device audition remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q1 | 2 | (b) | 230.77 | 229.98 |
| q1 | 3 | (c) | 275.35 | 285.40 |
| q1 | 5 | (c) 2nd | 341.83 | 328.41 |
| q7 | 1 | E2 1st | 187.22 | 184.87 |

Exact marker regressions and fresh measured-duration bounds protect these values. Detailed evidence: `audit/2026-11-05/a176-cue-corrections.json`.
