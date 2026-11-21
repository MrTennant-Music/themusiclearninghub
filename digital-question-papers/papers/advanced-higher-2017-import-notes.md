# Advanced Higher Music 2017 import notes

## Source inventory

- Question paper: `../../exampapers/adv higher/2017/Music AH 2017 Paper.pdf`
- Marking instructions: `../../exampapers/adv higher/2017/Music AH 2017 Answers.pdf`
- Official audio: tracks 02–07 in `../../exampapers/adv higher/2017/`
- Imported paper data: `advanced-higher-2017.js`
- Audited score inventories: `advanced-higher-2017-notation.js`
- Regression coverage: `../tests/advanced-higher-2017.test.js`

The paper and marking instructions were extracted independently, then compared question by question. The paper contains 40 marks distributed 7, 7, 6, 5, 5 and 10 across Questions 1–6.

## Audio calibration

Every official question track was transcribed locally with Whisper `small.en` using word timestamps. The spoken part/replay cue was located in the transcript and refined against the source waveform. Markers retain the established 0.16-second lead-in.

| Question | Calibrated source times (seconds) |
| --- | --- |
| 1 | 7.56, 206.62, 267.60, 364.60 |
| 2 | 6.78, 208.87, 302.62, 340.53 |
| 3 | 6.32, 306.94, 365.46 |
| 4 | 6.78, 198.86, 259.12, 319.58 |
| 5 | 9.18, 148.30, 211.04, 372.22 |
| 6 | 8.72, 66.68, 185.00, 290.38, 409.56, 759.24, 836.60, 956.42, 1061.26, 1180.44 |

The regression test protects all 29 marker values, their order and the measured duration bound for each track.

## Notation transcription audit

Official pages containing notation were rendered at 600 dpi. Each system was read separately using its own five staff-line centres. The treble- and bass-clef pitch maps were established before noteheads were read. Notehead centres—not stems, beams or nearby boxes—were used for pitch decisions.

- Question 2(b): all three four-bar alternatives were inventoried in A major and 3/4. Alternative ii is the accepted response.
- User-confirmed Question 2(b) prefix correction: the three A-major sharps retain their official horizontal positions and are lowered by 10px to align with the source staff. The 3/4 time signature retains its original height and sits immediately after the key signature and before the first note in all three alternatives. The complete four-bar alternative is fitted inside a widened SVG viewBox so the final note and staff end remain visible without horizontal scrolling. The shared Advanced Higher 2017 keyed-staff spacing uses the same corrected horizontal relationship for later D-major and flat-key signatures.
- Question 4: all 18 bars were inventoried. The user-confirmed 600 dpi audit records bars 1–3 as G–C–C5–A, G–C–G–F and E–E–F–G–C–D; bars 5–7 and 13–15 repeat those patterns. Bar 4 is E semibreve above a downward-stem second voice D–C-sharp–C-natural–B. Bar 8 is C dotted minim plus crotchet rest. Bars 9–11 are the G-sharp/B and F-sharp/A chord passage, with the stacked B crotchet in bar 9 forced stem-up; bar 12 contains five deliberately missing notes: A quaver, G quaver, G semiquaver, A dotted quaver and G crotchet. Bars 16–17 are E–F–G–C–D then E–F–G–C5–D5; in both bars the first sounded quaver is standalone and only the following two quavers are beamed. Bar 18 contains E–G–A–C then the same chord one octave higher; the dotted-minim chord uses one upward stem with its A notehead 12px right and its dot 7px right of the aligned dots, while the quaver chord uses one downward stem and tail with its G notehead 12px left. The quaver chord is shifted 29 score units right so its notehead aligns vertically with the final bass quaver, matching the source. Its bass line completes the audited E–A–D–G, C–A–D–G, C–A–G–E–C2–C2 sequence. The separately printed left-hand reference phrase is C crotchet, B-flat/D crotchet, B/D-sharp dotted quaver beamed to C/E semiquaver, then a crotchet rest; every note stem points up. The D-sharp accidental in that reference is shifted 4px left from the shared chord position to match the source spacing. It is identified at bar 8. The final barline is double.
- Question 5: all 15 printed bars were re-audited from the 600 dpi source in D major. The user-confirmed guide pitches are line 1 A | A | G-A-B tied to B tied to B; line 2 G-A-B tied to B tied to B-A-G | A tied to A-G-F-sharp; line 3 F-sharp | E-E-D | E | D; and line 4 D tied to D-E-C-sharp | D. Bar 8 contains an A minim followed by G-F-sharp quavers, and only its final boxed F-sharp belongs to the G-flat enharmonic prompt. The narrow box extends below the lower answer stave. The bar-13-to-14 tie is drawn above the notes and widened. The separately printed bass-guitar reference records an A3 dotted minim followed by an A2 dotted minim, one octave lower, with a barline immediately after the bass clef and another between the notes. The bar-14/15 bass-clef transcription is E4, C-sharp4 and D4 at the same sounding pitch; its key signature is raised 10px and shifted 10px left, and its opening barline aligns with bar 14 above. The bass-guitar phrase occupies bars 5–6 only; the final bass line is E dotted minim, B crotchet and C minim, with either octave accepted.

Every complete bar is rhythm-totalled in the regression test, including the corrected three-beat total in Question 5 bar 8. Polyphonic/chord notes are excluded from the sequential beat total and separately represented. Exact inventory hashes, editable indices, accepted pitch sequences and final barline types are also protected.

## Marking safeguards

- `Electronic dance music` and `EDM` are accepted; `Electric dance music` is rejected.
- `C added 6th`, `C6` and the case-sensitive symbol `CM6` are accepted; `Cm6` is rejected.
- D major is accepted for Question 5(a); D minor is rejected.
- Question 5(c) protects the same-pitch E4, C-sharp4 and D4 sequence. The earlier octave-shifted E5, C5 and D5 encoding is explicitly rejected.
- Question 6 applies the official two-concepts-per-mark category rule, the maximum-two-marks list rule for comparison and the additional-wrong-style rule for the conclusion.
- Baroque is a correct style for 2017 Question 6 and therefore must not be rejected by the shared Advanced Higher conclusion marker.

## Source-layout corrections

- Exam Mode follows the Hub-wide 45-minute policy.
- Question 4 now presents the printed left-hand reference phrase before the full guide score, and the full score follows the question text and replay instructions as it does in the source. The final grand-staff system keeps a 100-unit treble-to-bass top-line separation; its brace is shortened by 5px at each end; the Italian-term and chord answer boxes share a row 10px closer to the bass staff in bars 16 and 18; and the 1100-unit viewBox leaves the low quavers and answer row fully visible.
- Question 4's L placement tool uses the shared bar-label interaction: an armed pointer hover or keyboard focus shows a faint L at the exact final placement position above the chosen bar.
- Question 5 now presents its bass-guitar reference, playback instructions, 15-bar guide and separate part (e) bass-line score in source order. In part (e), the given bass notes, three pupil-entry targets and entered notes reuse the corresponding treble-guide beat positions, keeping bar 1 beat 1, bar 2 beat 1, bar 3 beats 1 and 2, and bar 4 beat 1 vertically aligned across both staves.
- Question 5(e)'s guide melody is C-sharp-B-A | G | G-A-E | F-sharp in D major. C-sharp and F-sharp are supplied by the key signature without natural signs. The treble-clef key signature remains lowered 10px, while the bass-clef key signature is raised 10px from that shared position to match the source.
- Question 5(e)'s chord table keeps its overall width while the `G 1st Inv.` column is narrowed by 10px and the adjacent `A 1st Inv.` column receives the released space.
- Question 5(e)'s dotted-minim, crotchet and minim bass rhythms are printed as guide glyphs above their bass-entry positions. The minim guide and its pupil-entry position are both shifted 10px right in total, preserving their vertical alignment after two user-confirmed 5px moves. Direct note placement is limited to C2 through E4, preventing answers beyond the permitted two-ledger-line range.
- Question 5(d)'s placement control shows the same bracket sign as the source instruction rather than the word `Bracket`; its accessible name remains `Bracket`, and the existing one-use armed placement interaction is unchanged.
- Question 5's four-line opening block uses the same compact paragraph rhythm as Question 4. Part (a)'s Clear control shares the right edge used by the other literacy controls. Under part (d), the four replay/instruction statements are separated as paragraphs, while the two consecutive `Here is the music...` cues remain grouped.
- Question 5(e)'s three pre-score statements use separate 14px paragraph gaps after the opening sentence about the supplied bass notes.
- Question 5's main guide closes every printed system with a barline. The `(b) Enharmonic` label sits above its narrow bar-8 answer box, and the bars 14–15 bass-clef answer box and `(c)` label extend 45px farther upward in total while retaining the same lower boundary. Its bass answer stave includes an opening barline at bar 14, an internal barline aligned between bars 14 and 15, and a closing barline aligned with the end of bar 15.
- Question 6 uses the source category `Texture/structure/form/timbre` without the previously added `/dynamics` label. Its single shared rough-work table and shared final-answer headings are rendered once rather than being duplicated for every response field.
- Question 6 now follows the source page sequence and spacing used by the official 2017 paper: the `(a)` instruction is aligned as a labelled part, the two category bullets and paired replay cues retain their printed grouping, and the rough-work page repeats the source instruction and categories above the three-column table. The excerpt final-answer sections contain nine ruled lines each; part (b) contains 18 rough-work lines, 16 analysis lines and 10 conclusion lines. Printed page references are adapted to the continuous digital paper, and the rough-work watermark is intentionally omitted.
- The complete source-paper typography was audited from the PDF's embedded Trebuchet font runs. Bold emphasis is retained for the source's response counts, replay counts, selected question terms, timed-reading phrases, full guide-writing instructions, Question 6 category prompts and analysis/conclusion keywords; interface labels and ordinary paper wording remain unchanged.
- The shared Question 6(b) rough-work, analysis and conclusion sheets retain their source-sized widths but are centred within the paper content column. The third- and last-play excerpt cues align with the surrounding indented instruction text.

## Verification

`advanced-higher-2017.test.js` checks the complete 40-mark answer set, official alternatives and rejection cases, the 45-minute Exam Mode timer, source-order score placement, the shared Question 6 page structures, completion rules, exact notation inventories and hashes, rhythm totals, all marker values and track bounds, and static/interactive SVG renders for finite coordinates and keyboard note-entry targets. The Advanced Higher 2016 regression is rerun after shared marking or notation changes.

## 2026-11-02 final cross-paper sweep

- The paper was added to the permanent ten-paper consistency regression covering its 45-minute timer, 40-mark total, blank-response behaviour, registry entry and all six question-audio files.
- All six audio files decoded successfully; every calibrated marker remains chronological and within its measured source track.
- The official-answer fixture, exclusions, notation inventories, All Questions rendering and marking-instruction link were rechecked with no browser errors.

## 6 November 2026 fresh source audit

The three Q2(b) melody options were independently reread from calibrated 300 dpi staff crops and checked against the original PDF notehead bounds. Their existing pitches were incorrect. All three are replaced by the complete independent inventory in `advanced-higher-2017-source-audit.json`; correct option ii is unchanged. Their printed final single barlines are restored. Q4/Q5 and reference-staff readings also have fresh complete inventories, preserving explicitly approved optical offsets and the above bar-13/14 tie. Browser and PDF verification continues.


## 2026-11-06 source-render follow-up

Added the printed B-natural before the B2/D-sharp3 reference chord after B-flat; its accidental column remains separate from the upper sharp. Restored the complete bar-4 Scale box and bar-18 first-chord box from the source. Compared both final rendered reference and full guide against the calibrated source; exact inventory regressions pass.
# Source-completeness audit, 6 November 2026

The official Question 3 page 8 places `(a)` beside “In this excerpt you are required to complete the guide below…”. A fresh 300 dpi crop confirmed that this label was absent from the digital introduction. Restored it with `introPartLabels` at paragraph index 1; wording, answer numbering, notation and marking are unchanged. The paper regression protects this source label.


### 6 November audit: rapid native-touch gestures

Every offered bracket/letter/sign target now participates in the shared removal gesture state before an answer is placed. Distinct intervening score gestures release the old removal filter; native touch double-clicks defer to the explicit touchend double-tap handler. This keeps rapid tool–score–tool placement and repeated removal independent. Exact printed notation and source answers remain covered by the existing transcription fixtures. Browser rerun records are linked in `docs/past-paper-maintenance.md`.

## Fine source and engraving continuation — 6 November 2026

- Restore source-regular score captions: q4: (a) Scale:, (b) Chord:; q5: (a) Key:, (b) Enharmonic. Captions and pupil-entered answers remain separate.

Final browser and actual Share PDF evidence is tracked in docs/past-paper-maintenance.md. Listening and physical-device checks remain separate.

## Raised source marker — audit continuation, 6 November 2026

The Q4(d) instruction prints its bold L at 17pt beside 11pt prose. Preserve the 17:11 size ratio using sourceSymbols metadata; the letter’s meaning, placement interaction and answer remain unchanged. The font extractor now recognises actual bold question headings rather than spoken references to a later question. Page 14’s cue and chord table belong to Question 5.

## Exact answer-guidance continuation — 7 November 2026

Q4(b) accepts the printed triangle-major chord alternative (300 dpi source crop independently viewed), while CM6 remains accepted and Cm6 rejected. Q6(b)(ii) also accepts the source’s close-miking/recording-technique justification. Exact acceptance/rejection cases are regression-tested. Printed pitches, rhythms and box geometry are unchanged.

## Audio cue-boundary continuation — A176, 7 November 2026

Fresh local speech-recognition windows and full-track waveform onsets confirm the following timing corrections. These values supersede earlier marker tables for the listed cues. Each retains approximately 0.15 seconds before the reviewed acoustic onset. The audio files themselves are unchanged. Full-track listening and physical-device audition remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q1 | 2 | (c) | 267.60 | 262.55 |
| q5 | 1 | 1st | 148.30 | 152.10 |

Exact marker regressions and fresh measured-duration bounds protect these values. Detailed evidence: `audit/2026-11-05/a176-cue-corrections.json`.

## Remaining cue-flag review — A177, 7 November 2026

The flagged cues below were checked against independent local recognition windows and complete-track waveform onsets. The exact corrected values supersede earlier timing tables for these marker identities. The audio files, question wording, notation and answer keys are unchanged. Full listening and physical-device checks remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q3 | 1 | (b) | 306.94 | 308.13 |
| q6 | 5 | (b) | 759.24 | 760.46 |
| q6 | 7 | 2 | 956.42 | 956.15 |

Detailed per-flag evidence: `audit/2026-11-05/a177-cue-flag-review.json`. The shared exact-marker regression uses the A177 source-duration and waveform fixture.


## 18 November 2026 conclusion justification audit

Q6(b)(ii) now uses excerpt-specific evidence families and equivalent wording reviewed against this year’s conclusion and additional guidance. The official 0/1/2 rubric is retained: both periods need valid justifications for full credit, and, by the teacher’s explicit override, the supporting evidence must be written in the Conclusion itself. Earlier final answers cannot supply justification, even though the official scheme allows such links. Feedback distinguishes period identification from justification and names credited evidence. Rough work is excluded. See [the complete audit, alternatives and exclusions](advanced-higher-conclusion-audit.md).
