# Advanced Higher Music 2019 import notes

## 2026-11-04 Question 4 piano correction

Removed the remaining accumulated section gap after the replay cues: reduced the after-answer bottom margin from 52px to 8px, removed the 30px subquestion bottom margin, shortened its bottom padding, and reduced the following part-heading margin. Cue paragraphs in (a)/(b) now have explicit zero paragraph margins and an 8px container top margin, bringing part (b)'s instruction, “Here is the music” and score together.

User requested tighter text-to-score spacing throughout Question 4. Reduced outer panel margins and vertical score-wrapper padding, removed the trailing introductory paragraph gap, reduced the reading/score-cue margins for (a)/(b), and tightened the cue-to-excerpt and excerpt-to-answer gaps in (c). Internal engraving, box positions, the visible 8vb clearance and the 57px answer-line spacing remain unchanged.

Accidental tools now retain the owning subquestion: selecting Sharp in (b)(i) does not select the Sharp button in (b)(ii), and vice versa. Rerendering retains that ownership. The note-entry preview/commit and bar-12 sharp-placement target also honour the owning part, so the other part cannot consume its accidental selection.

User spacing correction: reduced bar 7 by 50px and assigned 25px each to bars 8 and 9. System-three bar boundaries are 120, 275, 450, 665, 870; both hands share these boundaries and onset positions. Bar 10 and the system width remain unchanged.

User optical correction: the bar-12 grace-note slur is lowered 7px in both the complete guide and part (b) extract; note and accidental positions are unchanged.

The user subsequently requested a tight enharmonic box around only G#2: its horizontal bounds are now note-centre minus 26px to plus 14px (40px wide). The label may extend beyond its right edge; the aligned answer stave and box height stay as before.

Follow-up user layout corrections: raised the interval answer line and box bottom 10px; lowered the printed 8vb label/dash 5px and shifted both left 5px; extended part (b)'s accidental box upward 25px; aligned the enharmonic tools with the sharp tool above; widened part (c)'s answer-line interval to 57px and extended its SVG height to keep the octave marking visible. Accidentals now reserve horizontal space in the shared onset grid and are painted after noteheads/ledger lines. Adjacent chord naturals use two columns, and the grace-note sharp and main-note courtesy natural remain separate. Pitches, rhythms and marking answers are unchanged.

The previous Question 4 inventory was inaccurate despite its earlier audit note. Re-read page 10 using the existing 600 dpi individual-system crops, then independently compared every notehead with the inventory below. Each system was calibrated from its own five lines: treble E4/G4/B4/D5/F5 and bass G2/B2/D3/F3/A3. Ledger-line notes were read against those references. Pages 12–13 confirm the extracts and their answer-box boundaries; marking-instructions page 4 confirms A4/G4/F4/D4 quavers, the tritone, the sharp before the second C, A-flat2 and the octave-lowering explanation.

`q` = quaver, `c` = crotchet, `m` = minim, `s` = semibreve, `.` = dotted; `r` = rest. Square brackets are simultaneous chord pitches. All 34 stave-bars total four crotchet beats. No anacrusis or incomplete bar occurs here.

| Bar | Right hand | Left hand |
| --- | --- | --- |
| 1 | [D4 F4] s | D3 c, A3 q, D3 q, G#3 q, A3 q, rc |
| 2 | [D4 F4] s | D3 c, A3 q, D3 q, Ab3 q, G3 q, F3 c |
| 3 | [D4 F4] s | D3 c, F3 q, D3 q, G3 q, G#3 q, rc |
| 4 | A4 q, G4 q, F4 q, D4 q (all missing), rm | A3 q, G3 q, F3 q, D3 q, rm |
| 5 | rc, [D4 F4] c, rc, [D4 F4] c | D3 c, A3 q, D3 q, G#3 q, A3 q, rc |
| 6 | rc, [D4 F4] c, rc, [D4 F4] c | D3 c, A3 q, D3 q, Ab3 q, G3 q, F3 c |
| 7 | rc, [D4 F4] c, rc, [D4 F4] c | D3 c, F3 q, D3 q, G3 q, G#3 q, rc |
| 8 | A4 q, B-natural4 q, C#5 q, D5 q, rm | G3 q, F3 q, E3 q, D3 q, rm |
| 9 | rq, D5 q, F5 q, G5 q, Ab5 q, G5 q, F5 q, D5 q | [G3 B-natural3] s |
| 10 | D5 m., rc | D3 c, F3 q, D3 q, G3 q, G#3 q, A3 q, [G-natural3 B-natural3] q |
| 11 | rq, D5 q, F5 q, G5 q, Ab5 q, F5 q, Ab5 q, F5 q | [G3 B3] s |
| 12 | rq, G#5 acciaccatura into A5 c, F5 q, G-natural5 q, C5 q, C5 q (missing sharp), D5 q | A2 m, rm |
| 13 | D5 s | D2 c, F2 q, D2 q, G2 q, G#2 q, A2 q, D2 q |
| 14 | D5 s | rc, F2 q, D2 q, G2 q, F2 q, E2 c |
| 15 | D5 s | D2 c, F2 q, D2 q, G2 q, G#2 q, rc |
| 16 | A5 q, B-natural5 q, C#6 q, D6 q, rm | G2 q, F2 q, E2 q, D2 q, rc, D2 c |
| 17 | rs | D2 m, rm |

Ties: both opening chord pitches 1→2→3; RH final D5 in 9→10 and 12→13→14→15; both LH chord pitches 10→11; LH last D2 in 16→17. The 8vb applies only to those last two tied D2s. Source beam groups, staccatos, accents, the slashed grace note and courtesy accidentals are explicit in the structured data. The part (b) extract additionally prints a courtesy natural before A5 in bar 12. The deliberately missing C-sharp remains hidden in both guides until entered in part (b).

The renderer now aligns both hands by rhythmic onset, uses stemless extra chord heads, reproduces five grand-staff systems with braces and connecting barlines, carries ties across line breaks and prints the final heavy double barline. The bar-4 box covers only the four missing quavers; the interval box covers D3/G#3 in bar 5. Part (b)'s enharmonic box encloses G#2 and the aligned answer stave. Its shared flat/natural/sharp tools make A-flat entry possible; the note target is limited to two ledger lines above/below the bass stave. Regression checks protect every pitch/rhythm event, all tie indices, beam groups and articulations through the inventory hash, editable indices, final barline, aligned hand positions and box geometry.

Verified the main guide and extracts in the browser, including keyboard placement of A-flat2 with the Flat tool; cleared the temporary answer afterwards. The 2019 regression and fitted desktop-layout audit pass. The wider AH run passes 2017–2026; the existing 2016 test fails because its CSS assertion rejects any `.paper-level-ah.question-q4` selector anywhere in the shared stylesheet, including pre-existing 2019 rules. No 2016 code was changed in this correction.

## 2026-11-04 Question 2 correction

Recalibrated all three treble systems from the 600 dpi page-5 crop using E4/G4/B4/D5/F5 line references. Corrected bar 2's final quavers to A4/B4/G4; bar 3 to A4/B4/B4, dotted-crotchet B4, B4/D5/D4; bar 4 to dotted-minim E4, crotchet rest, D4, E4/G4/C4; bar 5 to dotted-minim D4, crotchet rest, D4, E4/G4/C4; and bar 6 to dotted-minim D4, crotchet rest, D4, E4/G4, A4 with fermata. All quaver beam groups are explicit. The 12/8 and 9/8 totals, partial final bar, missing-rest slots, cross-bar ties and final double barline remain protected by regression checks. Restored the F-sharp key signature, source bar proportions and boxes around the correct notes; the bass rewrite box now encloses only the first note of bar 6 and its answer stave.

Question 1(d) user-confirmed pitch correction: the top option is C4 | D4 A3 D4 | C4 B3 A3 C4 B3 A3 | B3 C4 B3 C4 | A3; the middle is C4 | D4 D3 D4 | C4 B3 A3 C4 D4 E4 | D4 C4 D4 E4 | C4; the bottom is C4 | D4 D3 D4 | C4 B3 A3 C4 B3 A3 | D4 E4 D4 E4 | C4. The printed rhythms and closing rests are unchanged.

## Source inventory

- Question paper: `../../exampapers/adv higher/2019/Music AH 2019 Paper.pdf`
- Marking instructions: `../../exampapers/adv higher/2019/Music AH 2019 Answers.pdf`
- Official audio: tracks 02–07 in `../../exampapers/adv higher/2019/`
- Imported paper data: `advanced-higher-2019.js`
- Audited score inventories: `advanced-higher-2019-notation.js`
- Regression coverage: `../tests/advanced-higher-2019.test.js`

The source paper and finalised marking instructions were extracted independently and cross-checked question by question. The 40 marks are distributed 9, 4, 6, 5, 6 and 10 across Questions 1–6.

## Audio calibration

All six official question tracks were transcribed locally. Questions 4 and 5 were re-transcribed in full with Whisper `small.en`; the first Question 6 Excerpt 2 cue was separately re-transcribed from a focused audio window because the earlier broad transcript treated its opening as music. The established 0.16-second lead-in is retained.

| Question | Calibrated source times (seconds) |
| --- | --- |
| 1 | 7.05, 249.47, 296.88, 357.45, 455.66, 562.55 |
| 2 | 6.59, 375.88 |
| 3 | 5.72, 381.14, 455.19 |
| 4 | 6.46, 187.40, 346.42 |
| 5 | 6.80, 233.70, 287.64 |
| 6 | 8.36, 54.26, 185.62, 308.83, 438.03, 803.38, 866.46, 996.85, 1119.26, 1247.51 |

The regression protects all 27 markers, their order and the measured source-track bounds.

## Notation transcription audit

Official notation pages 3, 5 and 10–13 were first rendered at 300 dpi, then Questions 1(d), 2(a) and 4 were independently re-rendered and audited at 600 dpi. Systems were separated, clefs and key signatures were established first, and notehead centres—not stems, beams or nearby answer boxes—were used for pitch reading.

- Question 1(d): all three printed bass-clef alternatives are separately inventoried. The earlier approximation was discarded: the page prints no time signature, options 1 and 2 differ in both pitch and contour, and option 3 is the accepted answer.
- Question 2(a): all eight printed bars were re-read. The 12/8, 9/8 and returning 12/8 regions are explicit; bar 7 is a dotted semibreve tied into bar 8; and bar 8 is an intentional 9/8-length final bar under the continuing 12/8. The first two compound beats in bar 1 are independent rest-entry slots, all eight official combinations are accepted, and the chord and bass-clef answer locations remain attached to bars 4 and 6.
- Question 4: superseded by the corrected 17-bar piano inventory and audit above. The interval is D3–G#3, and the final tied bass notes are written D2 under `8vb`.

Both staves of every complete piano bar are rhythm-totalled. The deliberately incomplete Question 2 final bar is explicitly regression-tested as 4.5 crotchet beats. Exact hashes protect the three notation inventories, their answer locations and final barlines. Static and interactive renders are checked for finite coordinates and keyboard-accessible notation targets.

The source-order layout is also protected: Question 2's score sits after “Here is the music” and before its three prompts; Question 4 shows the complete guide first, then a bars 10–15 extract for part (b), and finally a bars 16–17 extract for part (c). Question 6 uses one shared rough-work table and one final-answer area per listening task rather than repeating them for each marked row.

## Marking safeguards

- `Recit` and `Oratorio` are accepted with `Recitative` for Question 1(b); Question 1(e) accepts the official `STAB` abbreviation.
- A dotted-crotchet rest is rejected in the first compound beat of Question 2(a)(i), while all official first-beat and second-beat combinations are accepted.
- C, C major and IV are accepted for the chord; C minor is explicitly rejected.
- `Inverted pedal` is rejected in Question 3(a)(1), and `Diminished 5th` is rejected for the Question 4 tritone.
- The A-flat enharmonic placement, octave-lowering explanation, Question 6 category rules, comparison scale, list cap and additional-wrong-style rule are regression-tested.

## Shared engine changes

Question 2(a)(i) required a two-region rhythm response. The shared marker now has an opt-in `preserveRhythmSequence` flag, and the completion checker accepts an opt-in delimiter. Existing single-region rhythm questions retain their previous behaviour. All earlier AH regressions were rerun after these changes.

## Verification

- Question 1(a) follows the user-supplied source crop: the opening instruction breaks after `those`, the concept list uses the narrower and taller printed-box proportions, and the source emphasis is limited to `four`, the timed reading sentence, `twice` and `40 seconds` rather than bolding the complete replay paragraph.
- Parts (b) and (c) use the longer source answer-line offset and extend those lines to the same right edge as the four lines above. Part (c) retains its printed line break after `concept`. Part (d) restores `tick (✓) one box`, including the bold `one`, the printed line break before `identify`, and the separate reading, three-play and tightly grouped replay-cue paragraphs.
- Question 1(d) notation was re-audited from a 600 dpi page-3 crop after the user reported that the HTML score was substantially wrong. All three choices use bass clef, A major and an undisplayed 3/4 time signature. They begin with a C4 crotchet upbeat, continue with three complete bars and a two-beat closing bar, and end with a single barline. The exact option inventories and beam groups are protected in `advanced-higher-2019.test.js`.
- The source emphasis is limited to `15 seconds` in part (a), then `30 seconds` and `three` in part (d). The part (b) and (c) answer lines were raised by one printed line interval, and one blank-line interval was removed between each of the three part (d) instruction groups.
- Part (e) keeps a paragraph gap below `You will hear the music three times.` while its three replay cues remain tightly grouped.
- Question 2 was then compared page by page with official pages 5–6. The score now restores the printed missing-rest box and its `(i) Rests` label, uses the source-only `(ii)` and `(iii)` labels, separates each time-signature region from its notes, adds the barline after the upbeat and the printed system-end/final barlines, and keeps the audited bar inventory unchanged. The prose uses the source emphasis on only `one minute`, `two more times`, `20 seconds`, `one minute` and `twice`. Part (b) restores its two-line prompt, replay instructions and source-length answer line.
- Question 3 was compared page by page with official pages 7–8. The part (a) reading and playback instructions now sit outside the bordered answer guide, with only `30 seconds`, `three times`, `20 seconds` and the later `30 seconds` emphasised. The four printed answer rows remain together inside one bordered guide with their marks outside it. Part (b) restores the printed `tick (✓) one box` wording, larger square choices and source paragraph spacing; part (c) retains the long source-width answer line.
- Question 4's earlier layout pass retained an incorrect musical inventory; the later piano correction above replaces it. The prose beneath each score keeps the shared part letter, aligned subparts and source timing emphasis. Part (c) retains both printed answer lines beneath the bars 16–17 extract.
- Question 5 was compared against official page 14 at 300 dpi. The opening instruction keeps its printed line break, emphasis is limited to `four`, `15 seconds`, `twice`, `10 seconds` and `40 seconds`, and the four-answer, replay and two short-answer sections retain the source paragraph gaps and answer-line offsets.
- Question 6 page 15 was compared at 300 dpi. The `(a)` label is restored beside the listening instruction, the category introduction ends with its printed colon, and emphasis is limited to the source counts, category names and timings. The page-reference wording remains deliberately adapted to the continuous digital table and final-answer sections.
- Question 6 page 16 restores the uppercase `ROUGH WORK` heading, repeated two-category instruction and source category bullets above the three-column table. The table retains the printed column proportions and tall writing cells; the print-only diagonal rough-work watermark remains intentionally omitted as requested.
- Question 6 page 17 restores the uppercase `FINAL ANSWER` heading and retains the source `(i) Excerpt 1` and `(ii) Excerpt 2` mark rows with nine ruled response lines for each excerpt in the continuous digital sheet.
- Question 6 page 18 restores the source analysis/conclusion instruction sequence, exact selective emphasis and compact replay-cue groups. The print page reference is adapted to the continuous digital `final answer section` without changing the instruction's meaning.
- Question 6 pages 19–21 retain the source 18-line rough-work sheet, 16-line Analysis answer and 10-line Conclusion answer. The rough-work watermark and bracketed end-of-paper label remain omitted in the interactive version, following the user's requested digital treatment.

`advanced-higher-2019.test.js` checks a complete 40-mark response, official alternatives and exclusions, answer completion, exact notation inventories and hashes, rhythm totals for all score voices, audio markers and duration bounds, and static/interactive SVG output. The Advanced Higher 2016–2018 tests and the fitted desktop-layout audit pass alongside it.

## 2026-11-02 final cross-paper sweep

- Exam Mode was normalised to the Hub-wide 45-minute attempt length and the timer is covered by the paper and cross-paper regressions.
- All six audio files decoded successfully; every calibrated marker remains chronological and within its measured source track.
- The complete official-answer fixture, rejection cases, notation inventories, All Questions rendering and marking-instruction link were rechecked with no browser errors.

## 2026-11-04 Question 4 interaction audit

- Corrected same-pitch accidental edits: choosing Flat or Natural now changes an already placed note without requiring a pitch change. Only the edited note is changed.
- Keyboard note entry retains its pitch and slot through score rerenders; Clear resets the entry position. The Mac Shift–Backspace removal shortcut is supported alongside Shift–Delete.
- Part (c) now has two independently editable answer lines. Either line contributes to the same one-mark answer. Accepted wording includes “one octave lower/down/below”; negated and contradictory responses are rejected.
- Isolated browser testing preserved the user's saved attempt. Verified all five correct parts receive 5/5, incorrect/blank feedback, all four notation Clear controls, natural-to-flat replacement, independent accidental palettes, keyboard entry, pointer dragging and right-click/Mac-keyboard removal. Regression tests protect the keyboard rerender sequence, accidental replacement and marking cases. The exact printed pitch/rhythm inventory remains unchanged.
- Advanced Higher 2017, 2018, 2019 and 2022–2026 regression suites passed, along with the fitted desktop-layout audit.


## 2026-11-05 answer-validation audit

- Official marking instructions, page 03, Question 1(e), explicitly accept the `STAB` abbreviation for Soprano, Tenor, Alto, Bass. The four-line entry now accepts that compact abbreviation as well as one voice or initial per line, or the four voices/initials entered together in order. Incorrect orders remain uncredited.
- A four-initial response counts as completed regardless of its correctness, so the question menu and Check Answers availability do not reveal the answer.
- Numbered voice answers use the shared spelling rules, preserving this question’s disabled generic fuzzy matching and its explicit S/T/A/B alternatives.
- No printed notation, pitch, rhythm or score inventory changed.


## 2026-11-06 fresh independent source audit

Recalibrated all source systems at 300 dpi, including the vector-detector-missed middle Q1(d) option using pixel-row density. Read every note/rhythm/rest/chord/accidental/tie/beam/articulation and source box twice across pages 3, 5, 10, 12 and 13. Pitches and official answer key agree with the current implementation. Corrected Q4 bar 8’s upward beam to the printed downward direction. Preserved all explicit teacher optical offsets. Complete independent fixture and regression pass; all six normal note slots pass keyboard/drag/marking/Clear. Corrected final render and PDF follow-up remain tracked separately.

### 6 November audit: neutral accidental entry

The fixed accidental question now offers natural, flat and sharp using the existing shared Bravura controls. Its target label describes the note position without naming the correct sign. Every choice commits its own neutral glyph; the source-reviewed accepted answer and strict note index are unchanged. Submitted wrong signs stay red on the score, with the correction in written feedback; blank slots show the source correction. All five AH fixed-target parts reuse the same preview, one-use arming and removal renderer. Exact choices, source marking, native input and Share evidence are recorded in the audit report.

### 6 November audit: complete rest-pattern alternatives

All eight source-accepted first-beat/second-beat rest patterns are entered through real controls in both browser engines. Empty rest targets now register the intervening pointer/touch gesture before any rest is present. This prevents rapid tool–rest–tool input from being mistaken for removal, which previously lost repeated quavers in otherwise correct patterns. Beat capacities, accepted orders and source inventories are unchanged. The component regression protects both empty target bindings and their harmless empty-removal behavior.

## Fine source and engraving continuation — 6 November 2026

- Restore source-regular score captions: q2: (i) Rests, (ii) Chord:. Captions and pupil-entered answers remain separate.
- User confirms retaining the previously narrowed enharmonic answer box and placing its caption above. The box dimensions and answer-note positions stay as previously reviewed.

Final browser and actual Share PDF evidence is tracked in docs/past-paper-maintenance.md. Listening and physical-device checks remain separate.

## Exact answer-guidance continuation — 7 November 2026

Q6(a)(i) accepts monophonic as the printed alternative to unison/octaves, crediting it only once. Q6(b)(ii) accepts the source’s wide-range-of-dynamics wording. Exact acceptance/rejection cases are regression-tested. Printed pitches, rhythms and box geometry are unchanged.

## Audio cue-boundary continuation — A176, 7 November 2026

Fresh local speech-recognition windows and full-track waveform onsets confirm the following timing corrections. These values supersede earlier marker tables for the listed cues. Each retains approximately 0.15 seconds before the reviewed acoustic onset. The audio files themselves are unchanged. Full-track listening and physical-device audition remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q6 | 1 | 1 | 54.26 | 57.32 |

Exact marker regressions and fresh measured-duration bounds protect these values. Detailed evidence: `audit/2026-11-05/a176-cue-corrections.json`.

## Remaining cue-flag review — A177, 7 November 2026

The flagged cues below were checked against independent local recognition windows and complete-track waveform onsets. The exact corrected values supersede earlier timing tables for these marker identities. The audio files, question wording, notation and answer keys are unchanged. Full listening and physical-device checks remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q1 | 4 | (e) | 455.66 | 455.00 |
| q2 | 0 | (a) | 6.59 | 7.22 |
| q3 | 0 | (a) | 5.72 | 6.07 |
| q6 | 5 | (b) | 803.38 | 803.16 |
| q6 | 6 | 1 | 866.46 | 867.29 |
| q6 | 7 | 2 | 996.85 | 996.36 |

Detailed per-flag evidence: `audit/2026-11-05/a177-cue-flag-review.json`. The shared exact-marker regression uses the A177 source-duration and waveform fixture.


## 18 November 2026 conclusion justification audit

Q6(b)(ii) now uses excerpt-specific evidence families and equivalent wording reviewed against this year’s conclusion and additional guidance. The official 0/1/2 rubric is retained: both periods need valid justifications for full credit, and, by the teacher’s explicit override, the supporting evidence must be written in the Conclusion itself. Earlier final answers cannot supply justification, even though the official scheme allows such links. Feedback distinguishes period identification from justification and names credited evidence. Rough work is excluded. See [the complete audit, alternatives and exclusions](advanced-higher-conclusion-audit.md).
