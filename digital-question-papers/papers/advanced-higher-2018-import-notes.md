# Advanced Higher Music 2018 import notes

## Current user-confirmed source decision — 6 November 2026

Q2(d), bars 10 and 12: the user explicitly confirmed the printed F-natural in both bars on 6 November 2026. Each bar is D4, F4, G4, F4, with a natural sign before the first F and its effect carried to the final F. This supersedes the earlier F-sharp teacher inventory for these two bars only. Other D-major F-sharps, rhythms, ties, targets and the augmented-triad answer are unchanged.

## Source inventory

- Question paper: `../../exampapers/adv higher/2018/Music AH 2018 Paper.pdf`
- Marking instructions: `../../exampapers/adv higher/2018/Music AH 2018 Answers.pdf`
- Official audio: tracks 02–07 in `../../exampapers/adv higher/2018/`
- Imported paper data: `advanced-higher-2018.js`
- Audited score inventories: `advanced-higher-2018-notation.js`
- Regression coverage: `../tests/advanced-higher-2018.test.js`

The question paper and finalised marking instructions were extracted separately and compared part by part. The 40 marks are distributed 6, 6, 6, 4, 8 and 10 across Questions 1–6.

## Audio calibration

All official question tracks were transcribed locally. Ambiguous starts in Questions 1 and 4 were re-transcribed with Whisper `small.en` and word timestamps. Markers use the same 0.16-second lead-in convention as the established papers.

| Question | Calibrated source times (seconds) |
| --- | --- |
| 1 | 7.28, 267.64, 315.08 |
| 2 | 6.43, 274.07, 429.86, 609.95 |
| 3 | 6.82, 403.80, 492.00 |
| 4 | 6.68, 211.20, 288.76 |
| 5 | 8.09, 241.93, 354.97, 441.01, 516.86 |
| 6 | 8.25, 56.62, 186.86, 305.06, 431.92, 788.21, 849.52, 980.67, 1097.17, 1225.69 |

The regression protects all 28 marker values, their chronological order and the measured duration bound for each official track.

## Notation transcription audit

Notation pages were rendered at 600 dpi. Staff systems were calibrated independently and pitches were read from notehead centres after confirming clef and key signature. A second note-by-note comparison was completed against separate crops of every staff system.

- Question 2: the 16-bar first score, five-bar two-stave bass-line extract, nine-bar 5/4 score and eight-bar augmented-triad passage are held as separate structured inventories and displayed in their original positions between the printed instructions. The two acciaccaturas, cross-bar ties, missing bar-12 sequence, bars 9–10 bracket, chord labels, bass-line pitches, 5/4 placement and octave transcription are explicit data. The augmented-triad target is the printed F-sharp in bar 16; bar 14 and bar 17 are both present.
- Question 4: all eleven 4/4 vocal bars plus the anacrusis were inventoried in E minor. Fermatas in bars 3, 6 and 9, the partial final bar, the bar-5 enharmonic target and the final double barline are explicit data.
- Question 5(b): each printed alternative contains the complete 24-note vocal phrase, including its pickup, exact rhythmic groupings and source pitch differences. The alternatives are no longer shortened or duplicated, and the second version is the accepted answer.

The source playback/read instructions were restored around Questions 1–5. Question 6 now shares the single rough-work table and final-answer layout used by the paper rather than repeating those structures for each marked subpart.

Every complete Question 2 and Question 4 bar is rhythm-totalled in the regression test. Exact inventory hashes, editable targets and final barline types are protected. Static and interactive score rendering is also checked for finite coordinates and keyboard-accessible targets.

## Marking safeguards

- `Lied`, `Lieder` and `Song cycle` are accepted for Question 1(b).
- Complete alternative rest patterns and all permitted octaves in Question 2 are tested.
- `Concerto grosso` is rejected where only `Concerto` or `Solo concerto` is accepted.
- `Chamber music` and a bare `Trio` are rejected where the official answer requires `Piano trio` or `Chamber group`.
- The Question 6 category caps, comparison scale, list cap and additional-wrong-style rule are regression-tested.

## Verification

`advanced-higher-2018.test.js` covers a complete 40-mark response, official alternatives and exclusions, the 45-minute shared Exam Mode timer, completion rules, notation inventories and hashes, rhythmic totals, all audio markers and bounds, source-order score placement, Question 6 layout and static/interactive score renders. The complete Digital Past Papers suite and desktop-layout regression are rerun after shared changes.

## 2026-11-02 final cross-paper sweep

- The paper was added to the permanent ten-paper consistency regression covering its 45-minute timer, 40-mark total, blank-response behaviour, registry entry and all six question-audio files.
- All six audio files decoded successfully; every calibrated marker remains chronological and within its measured source track.
- The official-answer fixture, exclusions, notation inventories, All Questions rendering and marking-instruction link were rechecked with no browser errors.

## 2026-11-03 user-confirmed Question 2 corrections

- In Question 2(a), the opening G minim in bar 2 carries a printed natural sign. The structured inventory and regression test explicitly preserve this courtesy accidental.
- In Question 2(a), `Fade` is centred above the printed E in bar 16 and anchored to that note's rendered position.
- Both reduced acciaccatura sharp symbols in bars 1 and 16 are optically shifted 7px left from the shared default position.
- The crotchet rest at the start of bar 12 remains deliberately missing for pupil entry. The replay instructions beneath part (a)(ii) retain the source hierarchy: timing paragraph, separate bold answer instruction, then the second- and third-play cues grouped together.
- The bracket answer control beneath part (a)(ii) is indented with the replay text above it.
- In part (b), the main instruction and all following paragraphs share one left edge, with the part label kept in its own column, the mark at the right, and the source wrapping and paragraph spacing preserved.
- The user supplied a close reference for the complete part (b) score. Its regression now preserves the source aspect ratio, five unequal source bar widths, vertically spaced braced treble/bass system, aligned system barlines, bars 3–5 bass-answer box, semibreve rhythm guides and offset two-row chord table with source-sized labels.
- The user confirmed that the piano semibreves sit near the start of each bar and that every right-hand chord is vertically stacked on one x-position rather than diagonally staggered.
- The user then confirmed that all piano and guide semibreves move together 7px to the right, and that the left system line connects the melody stave continuously to the piano staves.
- The user confirmed that the opening G in part (b), bar 2 has no natural sign; this does not change the separately confirmed natural sign in part (a), bar 2.
- The user confirmed the right-hand piano voicings in part (b): bar 2 is E–G, bar 3 D–G, bar 4 C–F, bar 5 B–F–G with G raised an octave and D omitted, and bar 6 E–G–C with C raised an octave.
- The upper G notehead in the part (b) bar 5 right-hand chord is offset 16px to the right for source-faithful adjacent-note engraving.
- The user supplied a close reference for part (c). Its regression preserves the three enlarged systems, source bar-number placement (2–9, omitting 1), unequal bar widths, bar-9 A4–A3–A3 inventory, two-stave octave box, lower bass-clef answer stave and repeat endings on both staves.
- The part (c) notation panel is centred in the paper, and all three D-major key signatures are lowered by 10px without moving their staves.
- Part (c)(i) offers seven Bravura time-signature choices in source-task order: 2/4, 3/4, 4/4, 6/8, 9/8, 12/8 and 5/4. The official accepted answer remains 5/4, with 2/4 + 3/4 retained as a marking alternative.
- The seven part (c)(i) time-signature buttons are narrowed to 96px so the complete set remains on one line.
- The complete part (c)(i) time-signature control row is lowered by 10px.
- Both part (c) repeat signs are lowered by 10px to align optically with their treble and bass staves.
- Both part (c) repeat signs are shifted 2px right from that aligned position.
- Inside the part (c)(ii) answer box, `One octave` and `lower` are bold while `(ii)` and `in bass clef` remain regular.
- A time signature placed by the pupil in part (c)(i) is shifted 18px right within the first staff system.
- In part (d), both visible D-major key signatures are lowered by 10px, matching the earlier optical correction in part (c).
- Both part (d) key signatures are also shifted 10px left, and both staff systems finish with a closing barline.
- The part (d) notation panel is centred using the same 42px optical correction as the preceding notation panels.
- The augmented-triad marking box and its label extend 10px higher while retaining the original lower boundary.
- The user confirmed the complete part (d) inventory for bars 10–17. Bar 10 is D–F-sharp–G–F-sharp; bar 11 is E minim tied to E dotted minim; bar 12 repeats D–F-sharp–G–F-sharp; bar 13 is E minim, E minim, E crotchet; bar 14 is F-sharp–A–B–A; bar 15 is G–B–D5–C-natural; bar 16 is B–D5–F-sharp5–E5; and bar 17 is a crotchet rest followed by F-sharp–E–F-sharp–E. All eight bars total five beats.
- The user confirmed the complete part (c) pitch sequence for bars 1–9 while retaining the printed 5/4 rhythms. The audited octave placements are: bar 1 A3–D4–E4; bar 2 F-sharp4–A4–F-sharp4–B4–A4; bar 3 E4–F-sharp4–G4–F-sharp4–E4–F-sharp4; bar 4 B3–C-sharp4–D4–C-sharp4–B3–E4; bar 5 A3–D4–E4; bar 6 F-sharp4–A4–F-sharp4–D5–C-sharp5; bar 7 B4–C-sharp5–D5–C-sharp5–B4–C-sharp5; bar 8 F-sharp4–G-sharp4–A4–G4–F-sharp4–B4, with no natural printed before the later G; and bar 9 A4–A3–A3.
- The part (d) `Write A above…` instruction begins on the same left edge as the source text immediately above it.
- The user confirmed the complete Question 2(a) bar inventory: corrected pitches and ties in bars 2–9, G crotchet followed by D dotted minim in bar 11, E–D–C/C–D–E in bar 13, F dotted minim–F quaver–E quaver in bar 14, and the bar-16 C minim followed by four reduced quaver noteheads with a D-sharp acciaccatura before E, then D-natural–C–D. The same corrected bars 2–6 are used in the later bass-line extract.
- Bar 15 is explicitly user-confirmed as crotchet D, quaver D, quaver E tied to crotchet E, then crotchet D. It is retained and tested as a regular four-beat bar.

## 2026-11-03 user-confirmed Question 3 source layout

- Question 3(a) restores the source instruction sequence in full above the answer guide, including the 30-second reading pause, three playings, the 20-second gaps, the 30-second pause before part (b), and the distinction between the guided first two playings and the unguided third playing.
- The four concept prompts remain one bordered guide with the four mark numerals outside its right edge. Each response uses the source's long answer rule and preserved interactive text entry.

## 2026-11-03 user-confirmed literacy-question spacing

- The supplied reference matches the key, cadence, enharmonic-equivalent and harmonic-device content held as Question 4 in the digital paper. Its four part rows now use the source spacing and mark alignment.
- Part (c) retains the source's two separate instruction lines, with its mark aligned to the second line.
- Part (c)'s notation Clear control sits inside that two-line question row, aligned with the Clear controls for parts (a), (b) and (d).
- The replay text begins on the main paper margin beneath part (d): the timing paragraph, the separate bold guide instruction and the tightly grouped second- and third-play cues retain the source paragraph spacing and wording.

## 2026-11-03 user-confirmed Question 4 notation geometry

- Each E-minor system now prints its F-sharp on the top staff line. The opening 4/4 time signature is shifted 10px left from its previous rendered position.
- A barline is explicitly drawn between the pickup crotchet and the first crotchet of bar 1.
- The cadence box is shifted 15px left and extended 25px downwards; its label and answer field move left with the box while retaining their vertical positions.

## 2026-11-03 user-confirmed Question 4 pitch inventory

- The complete vocal guide is pickup E4; bar 1 E4-E4-D-sharp4-B3; bar 2 E4-F-sharp4-G4-G4; bar 3 A4-G4-F-sharp4-F-sharp4; bar 4 G4-A4-B4-A4-G4; bar 5 C5-C5-B4-B-flat4-A4; bar 6 A4-G4-G4; bar 7 F-sharp4-E4-D4-B3-C4; bar 8 D4-D4-E4-D4; bar 9 C4-B3-B3; bar 10 A4-G4-F-sharp4-F-sharp4; and bar 11 E4.
- The source rhythms are retained exactly. Bar 3 is four crotchets; bars 4, 5 and 7 end with paired quavers; bar 6 begins with a minim; bar 9 begins with a minim; bar 10 uses crotchet, two quavers and minim; and the partial final bar is a dotted minim.
- Fermatas remain on the final crotchet of bars 3, 6 and 9. The bar-5 B-flat remains the enharmonic target whose accepted answer is A-sharp.
- F-sharps belonging to the E-minor key signature do not receive redundant printed accidentals; the D-sharp in bar 1 remains the only printed sharp within the melody.
- The key-signature F-sharp on all three systems is shifted 20px left and 10px down. The opening 4/4 time signature is shifted a further 15px left from its preceding corrected position.
- Final optical refinement: the 4/4 moves 5px back to the right and each key-signature F-sharp moves another 5px left, while retaining the 10px downward offset.
- The bar-3 fermata is anchored above its third crotchet. In bars 6 and 9, each fermata is anchored above the first crotchet following the opening minim.
- The cadence box is constrained to beats 2 and 3 of bar 3 only. The first and second staff systems end with single barlines; the third retains its final double barline.
- The enharmonic-note box is narrowed and centred on the B-flat in bar 5 only. Its answer stave is moved to the same centre and shortened to 110px.
- The cadence answer line is lowered 10px, while the cadence box alone extends 5px farther on each side. The harmonic-device box, its label and answer line move together 10px right and 15px up.
- The enharmonic answer stave extends 15px to the left while retaining its right edge and answer-note anchor; its surrounding box moves 15px down.
- The cadence answer line is lowered a further 20px without moving the cadence box or label.
- The cadence answer line then moves another 10px down, and the bottom of its box extends by the same 10px.
- The `(a) Key:` label is lowered within its box so its baseline aligns with the answer line.
- All three Question 4 fermatas are shifted 20px upward while retaining their confirmed note anchors.
- The bar-9 fermata is shifted a further 35px upward independently of the bar-3 and bar-6 fermatas.
- The cadence answer line is widened by reducing its side inset from 10px to 5px, adding 10px overall while keeping it centred.

## 2026-11-03 user-confirmed Question 5 playback instructions

- Question 5(a) retains the source comma after `twice` in its playback paragraph.
- The timing paragraph is separated from the tightly grouped first- and second-time playback cues by the source-sized paragraph spacing.
- Question 5(b) keeps its opening description and `Tick one box` instruction on separate source rows, with the mark aligned to the second row.
- Its 30-second reading instruction and three-play statement remain separate paragraphs, followed by a tightly grouped set of first-, second- and third-time playback cues before the notation choices.
- Question 5(c) keeps `Listen to a new excerpt` and its identification instruction on separate rows, with the mark on the second row. Its twice-played paragraph and grouped two playback cues now sit above the answer line.
- Question 5(d) likewise keeps `Listen to a new excerpt` and `Tick one box` on separate rows, followed by its 20-second reading instruction, twice-played paragraph, tightly grouped playback cues and then the four choices.
- In Question 5(e), the once-only playback instruction sits between the cadence prompt and the pupil's answer line, matching the source order.
- Each Question 5(b) notation option is structured as an anacrusis plus four complete 2/4 bars. All four internal divisions and the closing single barline are printed, with source-proportioned bar widths retained across all three alternatives.
- The Question 5(b) score viewport is cropped to the engraved music rather than the generic full-page score width, and every stave is vertically centred beside its tick box. This keeps its clef, key/time signature and notes at the same useful scale as the other literacy questions.
- In each Question 5(b) alternative, the Voice label and all melody notes are shifted 10px left from the shared spacing positions; the first semiquaver is shifted a further 5px left, for a total 15px source-matching adjustment.
- Question 6 follows the source document structure: the part (a) label and bold category bullets are explicit, replay cues are paired, the rough-work table repeats its prompt and categories, and part (b) retains separate analysis and conclusion instructions. Page-number references are adapted to the digital rough-work and final-answer sections. The analysis sheet has 18 rough-work lines without a watermark, 16 final-answer lines, and 10 conclusion lines.
- The end-of-question-paper label is shown only after the final conclusion response, never between the excerpt, analysis or conclusion sections.
- The Question 6(b) rough-work, analysis and conclusion sheets retain their source-sized widths but are centred within the paper content column. The third- and last-play excerpt cues align with the surrounding indented instruction text.

## 6 November 2026 fresh source audit

All printed notation now has a fresh calibrated 300 dpi inventory and second comparison in `advanced-higher-2018-source-audit.json`, including the three complete Q5(b) choices. Q2(a)(i) now preserves its four notes when they are entered before the rest or the rest is removed/replaced. Q2(b) accepts all 64 combinations of the four keyboard-enterable octaves under the official any-octave rule. Order and accidental errors remain uncredited. The printed F-natural signs in Q2(d) bars 10/12 conflict with the explicit teacher F-sharp inventory; preserve that inventory pending the user’s decision. Browser/render verification continues.


## 2026-11-06 source-render follow-up

Enabled the existing accidental-entry palette for Q4(c); without it the required A-sharp could not be entered. Correct keyboard and drag A#4 now earn credit, and the Sharp tool exposes its selected state. All four note-entry parts pass the final browser checks; all nine printed score renders have been compared with the freshly read source. The recorded F-natural/F-sharp teacher conflict remains pending.

### 6 November audit: rapid native-touch gestures

Every offered bracket/letter/sign target now participates in the shared removal gesture state before an answer is placed. Distinct intervening score gestures release the old removal filter; native touch double-clicks defer to the explicit touchend double-tap handler. This keeps rapid tool–score–tool placement and repeated removal independent. Exact printed notation and source answers remain covered by the existing transcription fixtures. Browser rerun records are linked in `docs/past-paper-maintenance.md`.

## Fine source and engraving continuation — 6 November 2026

- Restore source-regular score captions: q4: (a) Key:, (b) Cadence:, (c) Enharmonic note; q5: Voice. Captions and pupil-entered answers remain separate.
- User confirms retaining the previously narrowed enharmonic answer box and placing its caption above. The box dimensions and answer-note positions stay as previously reviewed.

Final browser and actual Share PDF evidence is tracked in docs/past-paper-maintenance.md. Listening and physical-device checks remain separate.

## Exact answer-guidance continuation — 7 November 2026

Q6(a)(i) excludes the explicitly rejected Major–Minor–Major sequence from the Major concept. Q6(b)(ii) accepts the printed jazz-harmony, straight-singing and non-operatic-voice justifications. Exact acceptance/rejection cases are regression-tested. Printed pitches, rhythms and box geometry are unchanged.

## Audio cue-boundary continuation — A176, 7 November 2026

Fresh local speech-recognition windows and full-track waveform onsets confirm the following timing corrections. These values supersede earlier marker tables for the listed cues. Each retains approximately 0.15 seconds before the reviewed acoustic onset. The audio files themselves are unchanged. Full-track listening and physical-device audition remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q3 | 1 | (b) | 403.80 | 433.75 |
| q5 | 1 | (b) | 241.93 | 239.16 |
| q5 | 2 | (c) | 354.97 | 365.77 |
| q6 | 1 | 1 | 56.62 | 58.62 |
| q6 | 3 | 1 | 305.06 | 303.38 |
| q6 | 6 | 1 | 849.52 | 852.24 |

Exact marker regressions and fresh measured-duration bounds protect these values. Detailed evidence: `audit/2026-11-05/a176-cue-corrections.json`.

## Remaining cue-flag review — A177, 7 November 2026

The flagged cues below were checked against independent local recognition windows and complete-track waveform onsets. The exact corrected values supersede earlier timing tables for these marker identities. The audio files, question wording, notation and answer keys are unchanged. Full listening and physical-device checks remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q5 | 4 | (e) | 516.86 | 515.35 |

Detailed per-flag evidence: `audit/2026-11-05/a177-cue-flag-review.json`. The shared exact-marker regression uses the A177 source-duration and waveform fixture.


## 18 November 2026 conclusion justification audit

Q6(b)(ii) now uses excerpt-specific evidence families and equivalent wording reviewed against this year’s conclusion and additional guidance. The official 0/1/2 rubric is retained: both periods need valid justifications for full credit, and, by the teacher’s explicit override, the supporting evidence must be written in the Conclusion itself. Earlier final answers cannot supply justification, even though the official scheme allows such links. Feedback distinguishes period identification from justification and names credited evidence. Rough work is excluded. See [the complete audit, alternatives and exclusions](advanced-higher-conclusion-audit.md).
