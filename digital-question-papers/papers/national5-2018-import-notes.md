# National 5 Music 2018 import notes

Use these notes before importing National 5 Music 2019 or any later Digital Past Paper.

## Official source set

- Question paper: `exampapers/n5/2018/N5_Music_QP_2018.pdf`
- Marking instructions: `exampapers/n5/2018/mi_N5_Music_mi_2018.pdf`
- Audio: official Tracks 1–9 in `exampapers/n5/2018/`
- Interactive data: `digital-question-papers/papers/national5-2018.js`
- Regression tests: `digital-question-papers/tests/national5-2018.test.js`

The official question paper and marking instructions were rendered and checked page by page. Print-only candidate fields, barcode material, official-use margins, turn-over text and additional answer pages were not reproduced.

## Mark inventory

| Question | Marks | Main interaction |
| --- | ---: | --- |
| 1 | 8 | Single choices, two multi-select items and short text |
| 2 | 4 | Four-part vertical listening guide |
| 3 | 6 | Shared 16-bar notation score with direct score entry |
| 4 | 6 | Vocal concepts, short text and chord-sequence grid |
| 5 | 4 | Four category groups |
| 6 | 3 | Sentence completion |
| 7 | 4 | Two style-and-reason groups |
| 8 | 5 | Rough work plus concept-marked final answer |

Both the question totals and individual-part totals must remain exactly 40.

## Whisper audio-marker workflow

Every official track was transcribed locally with Whisper `small.en`, English language selection and word timestamps. Cue starts were checked against the word-level transcription. Track 5 was re-transcribed over the difficult vocal section with the official prompt text so the spoken Question 4(e) and 4(f) boundaries were not guessed from the music.

Calibrated markers:

- Question 1: `6.52`, `55.80`, `115.80`, `160.80`, `321.87`, `398.68`
- Question 2: `114.30`, `220.78`, `326.64`
- Question 3: `7.44`, `127.96`, `221.98`, `316.08`
- Question 4: `5.74`, `92.32`, `137.32`, `194.01`, `298.56`, `356.20`
- Question 5: `100.44`, `144.68`, `184.78`
- Question 6: `65.33`, `147.16`
- Question 7: `6.28`, `94.48`
- Question 8: `44.30`, `113.64`, `182.82`

The 29-marker regression test protects the exact values, chronological order and official audio-duration bounds.

## Question 3 notation decisions

- The score is stored as a separate 16-bar pitch-and-rhythm inventory named `N5_2018_Q3_BARS`.
- The printed `Two bar introduction.` box remains part of the score panel.
- The time signature is placed directly after the clef at the start of the score.
- Bar 2 uses the established direct rhythm-addition interaction: the pupil applies a dot to the third note and a quaver tail to the fourth note. The printed notes stay visible until the additions are physically placed.
- The cadence area spans bars 7–8.
- The pupil places `D` above a score bar using the one-use armed bar-label tool. Both bar 8 and bar 9 receive the mark, following the official additional guidance.
- Bar 11 uses direct draggable missing-note entry. The correct answer is D5 then C5, both crotchets.
- Missing notes preview in grey and remain removable with the established notation gestures and Clear control.
- The source paper’s final double barline belongs to this 2018 score; do not inherit the 2017 single-barline correction.

The source-verified pitch and rhythm inventory is:

1. crotchet rest, E4 crotchet, G4 minim
2. E4 minim, C4 crotchet, D4 crotchet (the pupil adds the dotted-crotchet and quaver-tail corrections)
3. E4, G4, D5, C5 crotchets
4. A4 semibreve
5. A4 minim, D5 crotchet, B4 and A4 quavers
6. G4 minim, C4 minim
7. F4 crotchet, G4 crotchet, A4 dotted crotchet, F4 quaver
8. D4 dotted minim, crotchet rest
9. crotchet rest, E4 crotchet, G4 dotted crotchet, A4 quaver
10. G4 semibreve
11. E4, G4, D5 and C5 crotchets, with D5 and C5 omitted for pupil entry
12. A4 and G4 quavers, A4 dotted minim
13. A4 minim, D4 crotchet, E4 and F4 quavers
14. A4 crotchet, G4 minim, A4 and C5 quavers
15. F5 and E5 crotchets, D5, C5, A4 and C5 quavers
16. C5 semibreve, followed by the source paper's final double barline

The `Two bar introduction.` text is enlarged and centred inside its original box without changing the box dimensions. The rhythm box spans the complete width of bar 2, and the cadence box sits above bars 7–8.

Before changing any pitch or rhythm, compare the source PDF, the structured inventory and the 2018 regression test together.

## Marking edge cases retained

- Question 1(e) accepts `ritardando`, `rit`, `rallentando`, `rall` and `ritenuto`.
- Question 2(1) accepts `arco` and the officially permitted `vibrato`.
- Question 2(2) accepts 2, 4, number words, 2/4 and 4/4.
- Question 2(4) accepts perfect cadence, V–I and 5–1.
- Question 3(d) accepts imperfect cadence or an unambiguous statement that the cadence ends on V/5.
- Question 4(c) accepts `Musical` and `Musical theatre`.
- Question 4(e) accepts `Mezzo soprano` and `Mezzo`, but not `Soprano` alone.
- Question 6 accepts Adagio, Andante or Moderato for tempo.
- Question 7(a) accepts orchestra/orchestral reasons but rejects answers which claim a featured solo instrument.
- Question 7(b) accepts religious/Christian/Jesus/praise wording.

## Question 8 rules

- Award at most two concepts per heading and five marks overall.
- Full marks require concepts from at least three headings.
- `Repetition` can gain only one mark across Melody/harmony and Rhythm.
- Only concepts which actually earn marks are highlighted in green.
- Accept modal under grace notes/ornaments and triplets under Rhythm.
- Do not accept `drum(s)` for bodhran or `bass` on its own.
- Accept fiddle(s)/violin(s), keyboard/piano, double bass/bass guitar, `mf`/`f` and `sfz` or their full Italian terms.
- Do not accept English dynamic equivalents.

## Required regression checks

Run:

- `digital-question-papers/tests/national5-2018.test.js`
- `digital-question-papers/tests/exam-engine.test.js`
- the earlier 2015, 2016 and 2017 paper tests
- `pnpm test:desktop-layout`

The 2018 test includes official alternatives, explicit rejections, marker count/order/duration checks, notation structure checks, Question 8 caps and de-duplication, score-render smoke testing and a complete automatic `40/40` attempt.

### Source engraving and entry follow-up — 5 November 2026

The source bar-14 A4–C5 beam points down and is now explicit. Bar numbers 2, 7 and 8 sit clear of the Rhythm/Cadence guide boxes. The independent source fixture and real keyboard/drag/Clear checks are recorded in the audit evidence.


### 6 November audit: captured guide arrows

The shared Question 2 connector retains its original outline, dimensions and vertical/horizontal layout, with CSS positioning on an HTML wrapper and an untransformed inner SVG. This repairs arrows missing from html2canvas/Share captures while preserving the on-screen source layout. Both-layout regressions and fresh eleven-paper exports cover the change (A113).

### Audit interaction follow-up — 6 November 2026

When the D tool is armed, its bar targets take pointer priority over broad missing-note entry areas. This restores the centre of the bar-11 target without changing source notation or its geometry. All sixteen offered D positions pass keyboard and pointer placement, faint preview, marking and removal in Chromium and WebKit. The official alternatives remain bar 8 or bar 9. Direct note entry is separately retested after disarming.

## Fine source and engraving continuation — 6 November 2026

- Restore source-regular score captions: q3: Rhythm, Cadence:, Notes. Captions and pupil-entered answers remain separate.
- The two-row chord options use the source’s regular weight. National 5 2014 remains the explicit bold exception.
- Rhythm, Cadence: and Notes use regular Times New Roman, confirmed from source character fonts.

Final browser and actual Share PDF evidence is tracked in docs/past-paper-maintenance.md. Listening and physical-device checks remain separate.

## Exact answer-guidance continuation — 7 November 2026

Question 8's official marking instructions (Rhythm, printed page 06) explicitly accept `>` for Accents. The concept now accepts that symbol as well as the written term, credits the pair only once, and continues to reject `<`. This changes accepted pupil input only; printed notation and feedback labels are unchanged.

## Remaining cue-flag review — A177, 7 November 2026

The flagged cues below were checked against independent local recognition windows and complete-track waveform onsets. The exact corrected values supersede earlier timing tables for these marker identities. The audio files, question wording, notation and answer keys are unchanged. Full listening and physical-device checks remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q2 | 1 | 2nd | 220.78 | 220.46 |
| q4 | 0 | (a) | 5.74 | 5.14 |
| q5 | 0 | 1st | 100.44 | 99.98 |
| q8 | 1 | 2nd | 113.64 | 113.32 |
| q8 | 2 | 3rd | 182.82 | 182.50 |

Detailed per-flag evidence: `audit/2026-11-05/a177-cue-flag-review.json`. The shared exact-marker regression uses the A177 source-duration and waveform fixture.
