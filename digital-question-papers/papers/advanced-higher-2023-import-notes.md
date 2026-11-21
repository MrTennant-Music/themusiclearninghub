# Advanced Higher Music 2023 import notes

## Official sources

- Question paper: `exampapers/adv higher/2023/Music AH 2023 Paper.pdf`
- Marking instructions: `exampapers/adv higher/2023/Music AH 2023 Answers.pdf`
- Official audio: Tracks 02–07 in the same source folder
- Paper total: 40 marks; question totals are 6, 5, 6, 4, 9 and 10.

The printed paper and marking instructions were text-extracted independently. Every literacy page and every marking diagram was rendered at 300 dpi for the original import. On 1 November 2026, Questions 2(a), 2(b), 2(c), 4 and 5 were independently re-rendered at 600 dpi and audited again system by system. Staff lines were calibrated separately for each system; every notehead centre, rhythm, rest, dot, tie, triplet, accidental, key change, editable box and final barline was checked against the official paper. Every bar was then checked against its printed time signature.

## Audio calibration

All six question tracks were transcribed locally with Whisper. Cues were then checked against the waveform and given the same small lead-in used by the established Digital Past Papers.

- Q1: 7.69, 197.76, 302.79
- Q2: 5.36, 108.40, 471.40
- Q3: 8.25, 50.91, 369.21
- Q4: 7.46
- Q5: 6.79, 205.87, 382.04, 416.28, 461.18
- Q6: 9.31, 70.32, 201.61, 322.56, 456.63, 820.79, 890.43, 1035.56, 1156.84, 1290.76

Measured durations are 392.114989, 697.364898, 421.766984, 400.357982, 560.018866 and 2015.677823 seconds. The regression test protects all 25 cues, order and duration bounds.

## Literacy inventories and interactions

### Question 2

- Part (a) contains three complete two-bar 4/4 guitar-riff options; option 1 is correct.
- Part (b) contains all 25 printed 4/4 bars. The repeat answer is a start repeat at bar 10 and end repeat at bar 25. `D.S. al Coda`/`D.S.` at bar 25 with the sign at bar 10 is retained as an official alternative.
- The 600 dpi re-audit removed three invalid tie metadata flags from bars 4, 7 and 16. Those marks in the scan do not join equal-pitch notes: bar 4 runs into a rest, bar 7 begins on C after A, and bar 16 moves from C to B. The pitch and rhythm inventories themselves were already correct.
- The first brass-rhythm bracket belongs above bar 20.
- The one-bar brass rhythm printed beneath part (b)(ii) is encoded as notation and protected by its own exact inventory and hash; it is not a raster crop of the paper.
- Part (c) contains all 11 bars. The printed 8va covers bars 2–4 and means that the notes sound one octave higher. D major begins at bar 9.

### Question 4

- F major, 4/4, 14 bars, final double barline.
- Bars 3–4 form an imperfect cadence; I–V and 1–5 are accepted.
- The boxed B-flat in bar 5 is rewritten as A-sharp. The marking instructions accept any note value and stem direction.
- The first B in bar 10 needs a natural sign.
- The missing note above “her” in bar 12 is F, a fourth above the printed C. The marking instructions accept any note value despite the question asking for a crotchet.
- The 2026-11-03 page audit restored the complete printed lyric underlay across all 14 bars. The lyric text is structured with the bar inventory and rendered beneath the relevant notes, including the line break between the first and second systems.

### Question 5

- C major, 2/4, 13 bars, final double barline.
- The missing continuation is E4–D4 quavers at the end of bar 9 followed by E4–C4 crotchets in bar 10. Pitch and rhythm must both be correct.
- Bar 13’s treble-clef D4 is rewritten as the same sounding D4 in bass clef and retains its minim rhythm.
- The 2026-11-03 page audit restored the printed order of the replay instructions, the shared `(b)` heading and `(i)/(ii)` labels, the exact notation-box labels, and the placement of the part (e) playback cues after its four choices.

Every bar now has an explicit pitch-and-rhythm signature in `tests/advanced-higher-2023.test.js`, in addition to its rhythmic-total check and full-inventory hash. This protects the exact inventories rather than only detecting that an unspecified change occurred.

## Source layout and spoken instructions

- The complete printed listening sequence has been restored for Questions 1–5: reading times, number of playings, gaps between playings, completion times, guide-score introductions and replay cues.
- Question 2 now follows the printed order: part (a) and its three riff options, the part (b) guide score and questions, then the part (c) guide score and questions. Question 5 likewise shows part (a) before the part (b) guide score.
- Question 3(b) now uses the source group heading and its guided first/second playings followed by the unguided third playing.
- Question 6(a) now presents one shared rough-work table followed by the two final-answer fields, matching pages 18–19 of the source rather than duplicating rough work for each excerpt.
- Question 6(b) now presents one shared rough-work area, the full analysis instructions and cues, the extended written-analysis field, and the separate conclusion field in the source order from pages 20–23.
- The 2026-11-03 page-by-page audit restored the printed `(a)` label, the instruction and category bullets above the rough-work table, and the original page references (`page 18`, `page 19`, and `pages 22 and 23`) instead of digital paraphrases.

## Marking edge cases

- Q1(b) must be Tenor, Alto, Soprano, Bass, in that order. Q1(c) accepts fugue or fugal.
- Q3 accepts only the listed answers: Appoggiatura, Perfect/V–I, Inverted pedal, Piano trio and Contemporary Jazz.
- Q6 follows the official four-concept and comparison thresholds. Generic `ornamentation`, `chromatic scale`, `change of key`, `question and answer`, `irregular time`, generic `percussion` and the specified plural-instrument shortcuts are excluded where the marking instructions exclude them.
- Q6 conclusion is Classical for Excerpt 1 and 20th-century/Modern for Excerpt 2; 21st century is accepted for Excerpt 2, while Neo-Classical is not accepted as the period.

## Verification

Run:

```sh
node digital-question-papers/tests/advanced-higher-2023.test.js
```

The test covers source paths, 40-mark total, accepted and rejected official answers, answer completion, the Hub-wide 45-minute timer, every bar’s rhythmic total, exact pitch-and-rhythm inventories, exact inventory hashes, the shared Question 6 rough/final-answer structure, calibrated audio markers, finite SVG rendering and interactive target availability.

## 2026-11-02 final cross-paper sweep

- Exam Mode was normalised to the Hub-wide 45-minute attempt length and the timer is covered by the paper and cross-paper regressions.
- All six audio files decoded successfully; every calibrated marker remains chronological and within its measured source track.
- The complete official-answer fixture, rejection cases, notation inventories, All Questions rendering and marking-instruction link were rechecked with no browser errors.


## 4 November 2026 page-by-page fidelity pass

Reviewed source pages 2–23 individually (blank page5/11 omitted). Restored source paragraph groups, long completion lines, prompt wrapping, instrument-order columns, nine-line excerpt responses and sixteen-line analysis response. Audited notation at300dpi with calibrated staff crops; separate q2a/q2b/q2c/q4/q5 inventory files record readings. Corrected printed pitches/rhythms, pickup, cue voice, chords, lyrics, octave span and note-only box boundaries. Exact JSON fixtures now protect the full audited score objects. AH2023 test passes including everybar beat totals, marking and finite interactive/read-only SVG rendering. Background browser renders saved in maintenance/generated/ah-paper-layout-audit. No publication.

User correction: Question 2(c), bars 7–8 chord stems connect both noteheads; the first three quavers in bar 8 have downward stems and beam.
The end of bar 8 has a double barline before the key change.
In bar 7, the chord tie is raised by 6 pixels and a second, downward tie joins the B notes.
In bar 8, the second and third C-sharps and the second F-sharp retain their pitches without repeating the printed accidental.


## User-confirmed Question 4 correction — 5 November 2026

Bar 9’s final C carries “a -”; bar 10’s first note carries “gainst”. Box (d) includes the printed crotchet guide. The structured inventory and regression fixture record these details.


User-confirmed Question 4 correction (5 November 2026): the small “Lean - ing her breast” cue notes in bars 7–8 use downward stems. The notation inventory and regression fixture have been updated.


User-confirmed Question 4 cue layout (5 November 2026): bar 7 cue crotchet rest is beneath the minim at full rest size; the minim rest is on the fourth staff line; the bar 8 crotchet rest sits above the stave. The two cue quaver stems shift 1 px right. Cue lyrics align Lean with the A crotchet, ing with the second A quaver, her with G and breast with F; throat sits lower.

User adjustment (5 November 2026): move the Question 4 bar 8 crotchet rest 15 px down.


Question 5(b) source comparison (5 November 2026): bar 7 has two separate quaver beams, D5–C5 stems down and B4–A4 stems up. The regression inventory records both groups and directions.


## 2026-11-06 fresh source and browser audit

Freshly reread every option, vocal/cue voice, printed brass chord rhythm, lyric, beam, tie, tuplet and source box on pages 4, 6–8, 12 and 15; MI diagrams on pages 4–5 confirm every missing note. Current pitches agree with source. Local lyric offsets remove overlap and near-joined words without altering teacher cue placement. Final captures report zero overlaps; all seven source-derived note slots pass keyboard/drag/marking/Clear. Complete independent fixture and regressions pass.

### 6 November audit: repeat placement and bracket preview

Every offered start/end repeat target is being exercised through real pointer and keyboard input. The end of a bar and start of its neighbour shared the same invisible hit area; the targets now occupy their own sides of that boundary using the shared `q3RepeatTargetBox` helper. Source glyph placement and the official start-bar-10/end-bar-25 answer remain protected by the source inventory.

The bracket renderer now returns its path node, allowing hover/focus exit to remove the faint preview. A regression protects the node lifetime; the complete placement rerun is recorded in the audit report.

### 6 November audit: neutral accidental entry

The fixed accidental question now offers natural, flat and sharp using the existing shared Bravura controls. Its target label describes the note position without naming the correct sign. Every choice commits its own neutral glyph; the source-reviewed accepted answer and strict note index are unchanged. Submitted wrong signs stay red on the score, with the correction in written feedback; blank slots show the source correction. All five AH fixed-target parts reuse the same preview, one-use arming and removal renderer. Exact choices, source marking, native input and Share evidence are recorded in the audit report.

## Fine source and engraving continuation — 6 November 2026

- Restore source-regular score captions: q2: Intro, 2 bar intro, (ii) Key:, To coda. Captions and pupil-entered answers remain separate.
- The complete native 300 dpi source comparison restores the bar-13 way? extender, the next-system side, continuation, italic parenthetical echoes in bars 14/15/17, regular raster score captions and italic “To coda” casing. Separate source-detail regressions protect these without changing notes or rhythms.

Final browser and actual Share PDF evidence is tracked in docs/past-paper-maintenance.md. Listening and physical-device checks remain separate.

The italic My/girl echo in bar 17 uses offsets -4/+4, retaining the source words with a visible gap after italics are restored.

## Exact answer-guidance continuation — 7 November 2026

Q6(b)(ii) accepts the printed ornamentation/traditional-harmony justification for Excerpt 1, and accents, complex/extended harmony and wide-range-of-dynamics wording for Excerpt 2. Ornamentation remains rejected in Q6(a)(i), where the source requires a named ornament. Exact acceptance/rejection cases are regression-tested. Printed pitches, rhythms and box geometry are unchanged.

## Audio cue-boundary continuation — A176, 7 November 2026

Fresh local speech-recognition windows and full-track waveform onsets confirm the following timing corrections. These values supersede earlier marker tables for the listed cues. Each retains approximately 0.15 seconds before the reviewed acoustic onset. The audio files themselves are unchanged. Full-track listening and physical-device audition remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q1 | 1 | (b) | 197.76 | 196.38 |
| q6 | 1 | 1 | 70.32 | 68.27 |
| q6 | 6 | 1 | 890.43 | 901.94 |

Exact marker regressions and fresh measured-duration bounds protect these values. Detailed evidence: `audit/2026-11-05/a176-cue-corrections.json`.

## Remaining cue-flag review — A177, 7 November 2026

The flagged cues below were checked against independent local recognition windows and complete-track waveform onsets. The exact corrected values supersede earlier timing tables for these marker identities. The audio files, question wording, notation and answer keys are unchanged. Full listening and physical-device checks remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q1 | 2 | (c) | 302.79 | 303.82 |

Detailed per-flag evidence: `audit/2026-11-05/a177-cue-flag-review.json`. The shared exact-marker regression uses the A177 source-duration and waveform fixture.


## 18 November 2026 conclusion justification audit

Q6(b)(ii) now uses excerpt-specific evidence families and equivalent wording reviewed against this year’s conclusion and additional guidance. The official 0/1/2 rubric is retained: both periods need valid justifications for full credit, and, by the teacher’s explicit override, the supporting evidence must be written in the Conclusion itself. Earlier final answers cannot supply justification, even though the official scheme allows such links. Feedback distinguishes period identification from justification and names credited evidence. Rough work is excluded. See [the complete audit, alternatives and exclusions](advanced-higher-conclusion-audit.md).
