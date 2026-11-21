# Advanced Higher Music 2026 import notes

## Official sources

- Question paper: `exampapers/adv higher/2026/NAH_Music_QP_2026.pdf`
- Marking instructions: `exampapers/adv higher/2026/mi_NAH_Music_mi_2026.pdf`
- Official audio: tracks 01–07 in `exampapers/adv higher/2026/`
- Interactive paper: `digital-question-papers/papers/advanced-higher-2026.js`
- Structured notation: `digital-question-papers/papers/advanced-higher-2026-notation.js`

The official paper and marking instructions were extracted as text and rendered before implementation. Question 2(a) was independently checked from a 600 dpi render; Questions 2(b), 2(c), 4 and 5(b) were checked from 300 dpi full-page renders and close visual passes. The paper contains six questions worth `6, 6, 7, 4, 7, 10` marks, for 40 marks in total.

## Audio calibration

All official audio was transcribed locally with Whisper. The six question tracks have measured durations of `324.96`, `673.75`, `461.77`, `334.56`, `620.93` and `2100.236984` seconds. Twenty-five section markers are recorded in the paper data. Their exact values, chronological order and track-duration bounds are regression-tested.

Question 6 retains the source sequence of part (a), four Excerpt 1/Excerpt 2 playings, part (b), and four further playings. Cue starts were cross-checked against the continuous transcript and active-audio boundaries; the short lead-in convention used by the completed papers is retained.

## Question 2 notation audit

Question 2 is in D major and 3/4.

- Part (a) contains 24 complete three-beat bars. The end-repeat belongs at bar 8; a matching start-repeat at bar 1 is accepted only in addition. Bar 10 is rewritten at sounding pitch in bass clef as B3 crotchet, A3 dotted crotchet and G3 quaver. The rhythm correction is a tie from the last note of bar 19 to the first note of bar 20. The printed tie from bar 23 to bar 24 is retained separately.
- Part (b) contains bars 25–35. The boxed chord at bar 33 is a diminished 7th; `diminished` alone is rejected.
- Part (c) contains four dotted-minim grand-staff chords. Bars 34–36 are B minor/VI, E minor/II and D major first inversion/Ib. Bar 37 is the supplied G/IV chord.

The repeat sign is placed with the shared Bravura interaction and one-use armed-tool behaviour. The correction tie uses the established tie tool. The bass-clef answer uses the shared direct note-entry interaction. All bars and editable indices are stored as structured data, separate from the renderer.

## Question 4 notation audit

The twelve-bar jazz guide is in G major and 5/4. Every bar totals five crotchet beats. The time signature is placed after the key signature as a musical symbol. Bar 5 requires a sharp immediately before C. The boxed interval in bar 7 is an augmented 4th/tritone; `4th`, `augmented` and `diminished 5th` are rejected. Bar 9 requires four beamed quavers: G4, A4, G4 and F-sharp4.

The time signature, accidental, interval field and four-note entry reuse the established shared notation controls and feedback colours.

## Other official marking decisions

- Question 1 concepts are Ballett, Countertenor, Polyphonic and Suspension; the remaining listed concepts are not credited. Parts (b) and (c) are Motet and Coloratura.
- Question 3 accepts Piano trio or chamber group, but not chamber music. The remaining answers are Dominant 7th, Contemporary jazz, Augmented triad, Syllabic, Tremolando/arco/tremolo and Octave.
- Question 5 credits Appoggiatura, Modulation, Sonata and Subject; notation option 4; Harmonic minor; and instrument-order option 3. The four notation choices on page 13 were re-audited at 600 dpi. Each contains a one-beat C4 upbeat, three complete 4/4 bars and a two-beat ending. Options 1 and 4 use horn version A (ending C4–D4–E4), options 2 and 3 use version B (ending D4–E4–G4), options 1 and 3 end on D5, and options 2 and 4 end on F5. The exact pitches, rhythms, rests and beam groups are protected in the regression test.
- Question 6 preserves the official two-concepts-per-category rule, comparison scale, list cap, similarity/difference alternatives and Baroque/20th-century conclusion rules, including the listed justifications and exclusions.

## Regression coverage

`digital-question-papers/tests/advanced-higher-2026.test.js` verifies source and audio availability, the 40-mark structure, all official alternatives and exclusions, every marker value and bound, complete notation inventories, bar totals, editable targets, final barlines, inventory hashes, finite SVG geometry, live interaction targets and a complete 40/40 response set.

## 2026-11-01 extensive audit

- The complete notation inventory was independently compared again with the official paper. Question 2(a) and all four Question 5(b) choices were re-rendered at 600 dpi; Questions 2(b), 2(c) and 4 were checked at 300 dpi. No pitch, rhythm, rest, tie, accidental, beam, box-boundary or final-barline correction was required.
- All seven local audio files were re-measured. Tracks 02–07 still match the stored durations and all 25 markers remain chronological and within their source track.
- Question 6 now follows the established Advanced Higher digital layout: one shared part (a) rough-work table, one combined Final Answer area, one part (b) ruled rough-work area, the full official analysis/conclusion instructions, and one continuous Analysis/Conclusion final answer. Duplicate rough-work and Final answer sections were removed.
- The Question 6 comparison marking now explicitly accepts `fugal`, `subject`, `answer` and `countersubject` for the official Excerpt 1-only fugue point.
- Inactive repeat-sign targets are no longer pointer- or keyboard-active after placement. The one-use tool disarms completely, and reselecting the answer button re-enables placement so the sign can be moved.
- The focused source, marking, audio, structured-notation and live-render regression test was extended to protect the corrected Question 6 structure and inactive placed-repeat target state.

## 2026-11-02 final cross-paper sweep

- Exam Mode was normalised to the Hub-wide 45-minute attempt length and the timer is covered by the paper and cross-paper regressions.
- All six question audio files decoded successfully; every calibrated marker remains chronological and within its measured source track.
- The complete official-answer fixture, rejection cases, notation inventories, All Questions rendering and marking-instruction link were rechecked with no browser errors.

## 2026-11-04 complete page-layout audit

Every one of the official paper's 24 pages was rendered at 300 dpi and compared in order with the interactive paper. Pages 2, 4–21 contain the usable question content: Question 1; the Question 2 instructions, three notation sections and chord grid; all of Questions 3–5; and the complete Question 6 rough-work and final-answer sequence. The cover, blank turnover page, two additional-space pages and final copyright page are print-only and remain intentionally excluded from the digital paper.

The audit restored the source order of the timing paragraphs before the Question 1(a) and Question 5(a) answer prompts; restored the missing answer-box and answer-line sentences in Questions 2(b) and 4(c); matched the Question 2(c) chord instruction exactly; and restored the printed tick glyph in Questions 3(c), 5(b) and 5(d). Question 6 now uses the source `(a)` label, genuine bullet formatting, compact paired playback cues and source emphasis. Its part (b) introduction also includes the digital equivalent of the printed final-answer-page instruction before the rough-work warning.

The 300 dpi notation crops for Questions 2, 4 and 5(b) were compared again with the structured inventories after the page audit. No pitch, rhythm, rest, dot, tie, beam, accidental, editable index, box boundary or final-barline change was required; the existing inventory hashes remain authoritative. The regression test now protects all of the restored wording, ordering, bullet/label metadata and the final end-of-paper state in addition to the exact notation inventories.



## 4 November 2026 source-layout and notation pass

Reviewed the official question-bearing pages sequentially, with 300 dpi staff crops for notation. Updated wording, emphasis, paragraph/replay grouping, answer boxes, score layout and the separate bar-by-bar regression inventories. Browser captures of all six questions are saved under `maintenance/generated/ah-paper-layout-audit/2026-qN-verified.png`. Rough work remains unmarked and has no watermark; print-only end-of-paper text is omitted. Source/marking/audio/notation regression checks and the fixed desktop-canvas audit were run.


User-confirmed correction, 4 November 2026: Q2(b) bar 25 ends on D5 (quaver); bar 26 is D5 crotchet, E5 dotted crotchet, D5 quaver. Rhythms unchanged; exact regression inventory updated.

User-confirmed correction, 4 November 2026: Q2(b) bar 28 is D5 crotchet, E5 dotted crotchet, D5 quaver. Exact regression inventory updated.

## 4 November 2026 interactive bug test

Completed an isolated browser attempt through all six questions without changing the pupil's saved attempt. Correct responses earned 40/40 on final submission. Checked question navigation and completion labels, individual checking, notation entry, Clear, repeat/accidental/tie tool placement, separate chord fields, unmarked rough work, final feedback and All Questions review. Feedback audio played and paused successfully; all six review audio elements were present, no horizontal overflow or non-finite SVG geometry was found, and the browser reported no console errors. This was not a full-duration Exam Mode or physical-touch-device test.

Two interaction defects were corrected and regression-tested:

- Q2(a)(iv): the tie target now resolves its containing question card when used. Previously it captured a null card while the detached score was being built, so the armed tool could not place a tie.
- Q2(a)(iii) and Q4(d): direct note entry now inherits the printed key signature when no accidental tool is offered. C-sharp in D major and F-sharp in G major are stored and marked correctly without displaying redundant accidentals. Other notation interactions retain their existing defaults.

The 2026 source/marking/notation tests, exam-engine tests, 2017–2025 Advanced Higher regressions and fixed desktop-layout audit passed. A wider run also exposed an unrelated 2016 test assertion rejecting existing Question 4 CSS overrides; that styling was left unchanged.

### 6 November independent source and interaction audit

Fresh calibrated 300 dpi first and second readings cover all Q2/Q4 bars/chords and all four Q5 alternatives, with full-width recrops protecting the endings. Preserved teacher bar25/26/28 notes; source now independently agrees. Restored Q4 bar-2 down beams. The two-beat Q4 pickup/three-beat ending, one-beat Q2(b) excerpt ending and Q5 one-beat pickup/two-beat ending are explicit rhythmic exceptions. All seven normal note slots pass keyboard/drag/mark/Clear. Placed ties remain focusable and removable after disarming. Complete source fixture and regression added; PDF/accessibility evidence remains separately tracked.

## 6 November 2026 score-caption source audit

A fresh 300 dpi close crop of Question 2 page 5 confirms the bar-10 caption is `(iii) Re-write at` / `same pitch`. Restored both printed lines in structured `bassClef.labelLines` data; the renderer previously shortened it to `(iii) Same pitch`. The already-audited pitches, rhythms, box boundaries, editable indices and barlines are unchanged. The exact caption is added to the source fixture and regression.

Caption alignment: the source places “same pitch” after the `(iii)` prefix, leaving bar number 10 below the prefix in its own horizontal space. Preserve that 28-unit second-line indent. The source bounding-box positions were checked before encoding it; a rendered rectangle check guards against overlap with bar 10.


## 6 November 2026: instrument-order PDF arrows

The printed Question 5(d) diagram on page 14 uses solid dark arrows. The 300 dpi source diagram was reread during the all-paper audit. CSS clipping produced rectangles in the actual Share PDF; the renderer now uses one SVG viewport with vector polygons, retaining the established size and inset. The inset also uses an SVG transform so the capture library cannot displace its lower border. Source wording, instrument order and accepted answer are unchanged. Both browser engines receive actual-capture checks for all eight arrows.

### 6 November audit: adjacent repeat targets

The shared invisible repeat-target helper now gives an end-repeat the area to the left of its boundary and a start-repeat the area to the right. This prevents the next bar's start target from intercepting an end-repeat click. The official end-repeat at bar 8 and the rendered source notation are unchanged. The audit report records all offered targets and real input reruns.

### 6 November audit: neutral accidental entry

The fixed accidental question now offers natural, flat and sharp using the existing shared Bravura controls. Its target label describes the note position without naming the correct sign. Every choice commits its own neutral glyph; the source-reviewed accepted answer and strict note index are unchanged. Submitted wrong signs stay red on the score, with the correction in written feedback; blank slots show the source correction. All five AH fixed-target parts reuse the same preview, one-use arming and removal renderer. Exact choices, source marking, native input and Share evidence are recorded in the audit report.

## Exact answer-guidance continuation — 7 November 2026

Q2(c) accepts root-position a suffixes and D Maj 1st Inv. Q6(b)(ii) keeps the source’s orchestra AND prominent/identified-percussion evidence together; either component alone is insufficient for that justification. Exact acceptance/rejection cases are regression-tested. Printed pitches, rhythms and box geometry are unchanged.

## Audio cue-boundary continuation — A176, 7 November 2026

Fresh local speech-recognition windows and full-track waveform onsets confirm the following timing corrections. These values supersede earlier marker tables for the listed cues. Each retains approximately 0.15 seconds before the reviewed acoustic onset. The audio files themselves are unchanged. Full-track listening and physical-device audition remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q1 | 1 | (b) | 185.43 | 225.93 |
| q5 | 1 | (b) | 205.26 | 245.99 |
| q6 | 1 | 1 | 57.22 | 63.91 |
| q6 | 3 | 1 | 329.55 | 346.86 |

Exact marker regressions and fresh measured-duration bounds protect these values. Detailed evidence: `audit/2026-11-05/a176-cue-corrections.json`.

## Remaining cue-flag review — A177, 7 November 2026

The flagged cues below were checked against independent local recognition windows and complete-track waveform onsets. The exact corrected values supersede earlier timing tables for these marker identities. The audio files, question wording, notation and answer keys are unchanged. Full listening and physical-device checks remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q1 | 0 | (a) | 0.15 | 7.57 |
| q2 | 0 | (a) | 0.25 | 7.51 |
| q3 | 0 | (a) | 8.02 | 10.01 |
| q5 | 0 | (a) | 0.15 | 7.63 |
| q6 | 6 | 1 | 930.06 | 934.11 |

Detailed per-flag evidence: `audit/2026-11-05/a177-cue-flag-review.json`. The shared exact-marker regression uses the A177 source-duration and waveform fixture.


## 18 November 2026 conclusion justification audit

Q6(b)(ii) now uses excerpt-specific evidence families and equivalent wording reviewed against this year’s conclusion and additional guidance. The official 0/1/2 rubric is retained: both periods need valid justifications for full credit, and, by the teacher’s explicit override, the supporting evidence must be written in the Conclusion itself. Earlier final answers cannot supply justification, even though the official scheme allows such links. Feedback distinguishes period identification from justification and names credited evidence. Rough work is excluded. See [the complete audit, alternatives and exclusions](advanced-higher-conclusion-audit.md).
