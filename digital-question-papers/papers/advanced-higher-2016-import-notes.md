# Advanced Higher Music 2016 import notes

## Authority and implementation

This is the earliest Advanced Higher year present in the local official source collection. The source question paper and finalised marking instructions are `exampapers/adv higher/2016/Music AH 2016 Paper.pdf` and `Music AH 2016 Answers.pdf`. They govern content and accepted answers. The completed National 5 2014 and Higher 2015 implementations govern interface behaviour; Practice Questions and the shared notation configuration govern notation drawing and entry.

There are six questions, worth 5, 8, 6, 7, 4 and 10 marks (40 total). The source cover specifies 2:30–3:45, so this paper has a 75-minute Exam Mode timer. The existing papers retain their own timings. All questions use the shared navigation, modes, audio player, storage, submission, feedback and marked-PDF export.

Printed page references that are impossible on a continuous digital question have been changed to “below”. Candidate boxes, official-use columns, blank pages and page-turn instructions are omitted. The original listening and answer wording is otherwise retained. Question 6 keeps separate unmarked rough work, two excerpt final answers, the extended analysis and the conclusion. Its initial rough-work table has the source's category rows and two excerpt columns.

## Transcription audit, completed before rendering

The original pages 4, 7, 8, 9 and 11 were rendered at 300 dpi. Close notation crops were inspected separately, rather than reading pitches from whole-page thumbnails. The independent second pass checked the notehead centres against the calibrated lines, then checked every note and duration against the inventory below. The source marking instructions confirm the deliberately absent material; they were not used to infer the printed melody.

300 dpi staff-line centres, from top line down (pixels in the source-page render):

- Q4(c) treble: 999, 1025.5, 1052, 1078.5, 1104.5.
- Q4(c) bass: 1250, 1276.5, 1303, 1329.5, 1357.
- Q4(d) treble: 2316.5, 2338.5, 2361, 2383.5, 2405.5.
- Q4(e) melody system 1: 736.5, 761.5, 787.5, 812.5, 838.5.
- Q4(e) melody system 2: 1116.5, 1142.5, 1168, 1193.5, 1219.
- Q4(e) chord treble: 1427.5, 1453, 1478.5, 1504, 1529.5.
- Q4(e) chord bass: 1706.5, 1731.5, 1757.5, 1782.5, 1808.5.
- Q5 system 1: 753.5, 775.5, 797.5, 818.5, 840.5.
- Q5 system 2: 1158.5, 1179.5, 1201.5, 1223.5, 1244.5.
- Q5 system 3: 1566.5, 1587.5, 1609, 1631, 1651.5.
- Q5 system 4: 1936, 1957, 1978.5, 2000.5, 2021.5.

Treble lines are F5/D5/B4/G4/E4 from top to bottom; spaces and ledger lines were checked by half-line steps. Bass lines are A3/F3/D3/B2/G2. Q5 uses the source octave-down treble clef and B-flat/E-flat signature. Its inventory records written pitches, consistently with the existing note-entry renderer; the small 8 is retained beneath every clef. Q4(e) uses F major. Q4(c/d) show no time signature in these excerpts: their complete bars total two crotchet beats; the last incomplete excerpt bars are explicit exceptions. Q2(e) has a one-line percussion stave and 6/8; Q4(a) has a one-line percussion stave and 2/4.

### Deliberately absent material and source exceptions

- Q4(a): all of bars 3–5 are absent. Bar 3 is crotchet + two quavers; bar 4 is minim, also accepting dotted crotchet + quaver rest; bar 5 is quaver rest + three quavers. Each totals two crotchet beats. Beam grouping is not assessed.
- Q4(c): bar 6's blank bass box takes B3 crotchet, A-sharp3 quaver and G3 quaver. The next B3 crotchet in bar 7 is already printed. The marking-instructions description includes that following B, so the renderer preserves it and asks for the three actually absent notes. The excerpt ends after that printed crotchet, without a final barline.
- Q4(d): the box isolates A-sharp4 (the second quaver in bar 3); its required enharmonic spelling is B-flat4 on the third line. The large box spans the whole-tone passage, not a missing barline. The final bar is a deliberately partial dotted crotchet. Any note value is accepted for the enharmonic answer; direct entry supplies the source quaver value.
- Q4(e): bar 7 is F first inversion (F/A, Fmaj/A, Ib or 1b); bar 8 is G minor first inversion (Gm/Bb, IIb or 2b). Both chord and inversion answers are required. G without minor is rejected. Bar 9 needs D as a dotted minim, in any octave; the source Gm/IIc label and given rhythm are preserved.
- Q5: the anacrusis has two quavers (one beat); it is not counted as a complete bar. Bar 4 is deliberately missing rests totalling three quavers after the B-flat minim. A crotchet plus quaver rest, either order, three quaver rests or a dotted crotchet rest are accepted.
- Q5: the only absent tie joins note indices 2 and 3 in bar 2 (D quaver to D crotchet). All printed ties remain. The source's single added tie is assessed separately, and moving it replaces that one answer.
- Q5: missing notes are bar 14 index 1, F5 crotchet, and bar 15 index 0, E5 dotted minim. The natural B in bar 13 is tied into bar 14; it is retained. Bar 16 is a deliberately incomplete final crotchet with no closing barline.

## Complete audited written inventories

`r` denotes a rest. The structured data additionally records beam groups, printed ties, accidentals and editable indices. Tests protect exact inventories, those indices, metrical totals and final barline types. Partial endings and the pickup are explicitly excluded from complete-bar totals.

### q2e

- Option 1: B4:dottedCrotchet B4:dottedCrotchet | B4:quaver B4:quaver r:quaverRest r:dottedCrotchetRest
- Option 2: r:quaverRest B4:quaver B4:quaver B4:dottedCrotchet | B4:crotchet r:quaverRest r:dottedCrotchetRest
- Option 3: r:quaverRest B4:crotchet B4:crotchet B4:quaver | B4:crotchet r:quaverRest r:dottedCrotchetRest

### q4a

- bars 1: B4:crotchet B4:quaver B4:quaver
- bars 2: B4:dottedCrotchet B4:quaver
- bars 3: B4:crotchet B4:quaver B4:quaver
- bars 4: B4:minim
- bars 5: r:quaverRest B4:quaver B4:quaver B4:quaver
- bars 6: B4:crotchet B4:crotchet
- bars 7: r:quaverRest B4:quaver B4:quaver B4:quaver
- bars 8: B4:minim

### q4c

- treble 1: B4:minim
- treble 2: B4:minim
- treble 3: B4:crotchet A#4:quaver G4:quaver
- treble 4: B4:crotchet A#4:quaver G4:quaver
- treble 5: B4:minim
- treble 6: B4:crotchet A#4:quaver G4:quaver
- treble 7: B4:crotchet [partial excerpt ending]
- bass 1: r:crotchetRest E4:quaver D4:quaver
- bass 2: C#4:quaver E4:quaver D4:quaver C#4:quaver
- bass 3: B3:minim
- bass 4: B3:crotchet r:crotchetRest
- bass 5: r:crotchetRest A#3:quaver G3:quaver
- bass 6: B3:crotchet A#3:quaver G3:quaver
- bass 7: B3:crotchet [partial excerpt ending]

### q4d

- bars 1: r:quaverRest D4:quaver E4:quaver D4:quaver
- bars 2: C4:quaver D4:quaver E4:quaver F#4:quaver
- bars 3: G#4:quaver A#4:quaver C5:quaver D5:quaver
- bars 4: E5:crotchet C5:quaver D5:quaver
- bars 5: E5:dottedCrotchet [partial excerpt ending]

### q4e

- bars 1: r:quaverRest C4:quaver D4:quaver E4:quaver F4:quaver G4:quaver
- bars 2: A4:quaver D5:quaver C5:crotchet A4:quaver C5:quaver
- bars 3: G#4:dottedMinim
- bars 4: A4:quaver D5:quaver C5:crotchet A4:quaver C5:quaver
- bars 5: G#4:dottedMinim
- bars 6: A4:quaver C5:quaver G5:dottedCrotchet F5:quaver
- bars 7: E5:quaver D5:quaver C5:dottedCrotchet F4:quaver
- bars 8: F#4:minim G4:crotchet
- bars 9: r:quaverRest D4:quaver E4:quaver F#4:quaver G4:quaver A4:quaver
- bars 10: B4:quaver E5:quaver D5:minim
- Chord stave bar 6: F4/A4/C5 dotted minim; bass F3 dotted minim.
- Chord stave bar 7: F4/C5 dotted minim; bass A2 dotted minim.
- Chord stave bar 8: G4/D5 dotted minim; bass Bb2 dotted minim.
- Chord stave bar 9: D4/G4/Bb4 dotted minim; bass D3 dotted minim.
- Chord stave bar 10: D4/G4/Bb4 dotted minim; bass G2 dotted minim.

### q5

- Pickup: D5:quaver Eb5:quaver
- bars 1: F5:dottedCrotchet F5:quaver F5:crotchet F5:quaver F5:quaver
- bars 2: F5:crotchet Eb5:quaver D5:quaver D5:crotchet r:quaverRest Eb5:quaver
- bars 3: F5:crotchet F5:quaver Eb5:quaver Eb5:crotchet D5:quaver Bb4:quaver
- bars 4: Bb4:minim r:crotchetRest r:quaverRest Bb4:quaver
- bars 5: Eb5:quaver Eb5:crotchet D5:quaver D5:crotchet Bb4:quaver F4:quaver
- bars 6: F4:minim r:crotchetRest F4:quaver Gb4:quaver
- bars 7: Gb4:crotchet Gb4:quaver Bb4:quaver Bb4:quaver F5:crotchet C5:quaver
- bars 8: C5:minim r:crotchetRest Bb4:crotchet
- bars 9: D5:minim D5:quaver G5:crotchet A5:quaver
- bars 10: A5:minim A5:quaver Bb5:crotchet D5:quaver
- bars 11: D5:quaver r:quaverRest r:quaverRest D5:quaver C5:quaver Bb4:crotchet C5:quaver
- bars 12: C5:minim r:crotchetRest G5:crotchet
- bars 13: F5:dottedMinim C5:quaver B4:quaver
- bars 14: B4:dottedMinim F5:crotchet
- bars 15: E5:dottedMinim Bb4:crotchet
- bars 16: A4:crotchet [partial excerpt ending]

## Audio calibration

Every official track (01–07) was transcribed locally with Whisper `small.en` and word timestamps. Track 01 is the title announcement, rather than Question 1, so the six question players correctly use tracks 02–07. Local full transcripts and the independently re-transcribed cue windows are in `maintenance/generated/advanced-higher-2016-whisper/`. They contain false words from music, sustained tones and silence; those are not markers.

The missed third-play cue in Q3, Q2(d/e) second-play cues and final Q6 excerpt cue were re-transcribed from short decoded PCM windows with previous-text conditioning disabled. This resolved genuine spoken cue times and excluded hallucinated repeated instructions. Every accepted cue was compared with its nearby 10 ms waveform RMS onset and given the reference paper's short 160 ms lead-in. There are 39 calibrated markers, all chronological and within measured track bounds. Exact values, counts and bounds are regression-tested.

| Question | Official track | Duration (seconds) | Calibrated marker times (seconds) |
| --- | --- | --- | --- |
| 1 | 02 | 269.14 | 49.61, 117.5, 215.32 |
| 2 | 03 | 537.966 | 49.7, 119.83, 219.44, 265.97, 313.36, 370.5, 416.18, 458.98, 497.3 |
| 3 | 04 | 480.862 | 73.58, 172.32, 271.34, 380.46, 431.12 |
| 4 | 05 | 650.475 | 39.95, 66.94, 117.89, 151.7, 172.7, 213.76, 272.9, 349.58, 405.12, 508.32 |
| 5 | 06 | 385.019 | 12.69, 143.48, 206.84 |
| 6 | 07 | 2144.679 | 68.12, 211.44, 354.66, 498.72, 885.54, 962.88, 1106.53, 1249.71, 1393.9 |

## Marking and interaction decisions

- Reuse concept-line marking and its additional-answer penalty for Q1(a) and Q2(a). Preserve all accepted official alternatives; reject “chant” alone, “minor” alone in Q2(c), and a wrong enharmonic spelling.
- Q6(a) awards one mark for any two valid concepts in each category, not one mark per concept. The instrument alternatives form single credit groups. Piano and orchestra must both be named, including when they appear separately in a list. Only final answer fields are assessed.
- Q6(b)(i) uses the official 1/2/3/4-mark thresholds for 1/2–3/4–5/6 valid similarities/differences. A list is capped at two marks. Differences must be tied to the appropriate excerpts, including “only in” distinctions. Unspecified chromatic scales do not receive the chromatic similarity credit. The source's Classical and Neo-classical style labels are not credited as analysis concepts.
- Q6(b)(ii) awards two marks only for both correctly identified and justified styles; one mark for both correct styles without both justifications, or one correct justified style. A competing incorrect style cancels the relevant style credit. “Neo-classical period” remains valid; the word Classical within Neo-classical must not be treated as an additional answer.
- Extended prose marking uses explicit source-derived concept and comparison rules, rather than an external model. As with the other digital papers, the shared automatic-marking disclaimer remains visible: nuanced paraphrases still warrant teacher review. A correct response can use excerpt labels, first/second-excerpt wording or two ordered answer paragraphs.
- Note entry uses the existing direct-placement/dragging helper, calibrated Bravura glyphs, note spacing, beams, ties, accidental glyphs and grey hover previews. Sharp/flat/natural selection is available for the bass and enharmonic tasks. Rhythm and rest entry use the established answer-button styling and physical bar targets; double-click/right-click removes an entry, and Clear is right-aligned.
- Q2(e) choices are drawn notation, not text substitutes or PDF crops. The unpitched clef is registered in the common Bravura symbols and vector-outline set so marked-PDF capture can outline it too.
- Music Dictionary exam links include all 70 reviewed AH 2016 concept appearances. The link generator reads the structured justifications and grouped piano/orchestra credit, and recognises the source's augmented-triad and first-inversion answers.

## Validation record

The paper tests cover a complete official 40/40 answer, accepted and rejected alternatives, additional answers, partial category marks, prose/list thresholds, conclusion justification, complete readable pitch/rhythm inventories plus full inventory fingerprints, editable indices, all source files, every marker and measured duration, and read-only/interactive SVG rendering with finite coordinates. The existing National 5 and Higher tests remain in the same suite.

### Completed local checks

- 36 focused checks passed: every existing National 5 and Higher paper, shared rendering/engine behaviour, the new Advanced Higher source/marking/inventory checks, homepage availability and Dictionary question links.
- Desktop layout audit passed: the responsive homepage and 49 fitted fixed-canvas pages.
- Browser: Q4(a–e) completed through rhythm buttons, note entry, accidental selection and chord/inversion fields; all seven marks awarded. Q5 completed through the key field, physical rest/tie targets and keyboard note entry; all four marks awarded.
- Browser: a typed score answer survived refresh; submitted 11/40 test feedback restored correctly after refresh. The header audio sought to 405.12 seconds at the Q4(e) spoken cue. Track metadata loaded from the official local audio.
- Browser: Restart cleared the test answers. A subsequent fresh load showed neither mode selected and no Start button; selecting Exam Mode displayed the source-specific 75-minute guidance.
- The full Hub test run has unrelated failures in the tuner, older icon expectations, game authoring and Dictionary/worksheet fixtures. They are outside this import; the focused Digital Question Paper and link suites pass.

### Final accidental and staff-position verification

The Q4(d) upper close crop was independently rechecked against all five calibrated lines. After A-sharp4, the noteheads are C5 in the third space, D5 on the fourth line and E5 in the fourth space; the next two quavers are C5/D5 and the final dotted crotchet is E5. These are explicit source readings, not pitches inferred from the expected scale. The bass C-sharp in Q4(c) bar 2 is printed once; its later occurrence in the same bar retains the pitch without another accidental. In Q5 the tied B natural carries into bar 14, while the given final crotchet of bar 15 returns to B flat under the key signature. The inventory, printed-accidental overrides and regression fingerprints protect these distinctions.

- User-requested shared mode-picker update: fresh papers and Restart now select and expand Practice Mode by default, showing Start Practice Mode without starting the attempt.

- Question 3 source-layout refinement: part (a) listening instructions sit above one rectangular guide containing answers 1–4. Each prompt has its answer line beneath it, with punctuation or the cadence continuation alongside; mark numerals remain outside the box. Playback cues stay together after separate instruction paragraphs, with “three” bold as printed.

- Question 4(a–b) source-layout refinement: split the rhythm instruction across its printed lines, space the listening paragraphs and keep replay cues together, align part (b) with its instruction and mark, and place the triad sentence beneath it with the answer inline on its second line. Existing notation inventories and entry interactions are retained.

- Question 6 opening-layout refinement: align part (a) with its instruction, reproduce the two bold category bullets and printed emphasis, indent the listening paragraphs consistently, and group the first and second playback cues into separate pairs. Digital rough-work references continue to use “below”.

- Question 6(a) rough-work sheet now follows the supplied source: centred Rough Work heading, instruction and bold category bullets, 23.5% category column with equal excerpt columns, two large writing rows, centred labels, bold headers and a faint diagonal Rough work watermark. The four writing areas remain editable and unmarked.

- User refinement: removed the repeated category instructions above the rough-work table and removed its watermark; retained the heading, large writing boxes and column proportions.

- User-confirmed bars 9–10 correction, checked independently against a 300 dpi crop of page 11: staff-line centres in the crop are y=87,108,130,151,173 (F5,D5,B4,G4,E4). Bar 9 is D5 minim tied to D5 quaver, G5 crotchet, A5 quaver tied across to bar 10 A5 minim, then tied to A5 quaver, Bb5 crotchet and D5 quaver. The final D5 remains tied into bar 11. Each bar totals four crotchet beats. Key-signature B flats are preserved; ties, editable-note indices and final barline remain unchanged.

- User-confirmed Question 5 pickup correction: a single full-staff barline follows the D5–Eb5 quaver anacrusis before bar 1, as printed on source page 11. Stored explicitly as pickup.finalBarline and protected by the inventory regression.

- User-confirmed Question 4(a), bar 7: quaver rest, separate flagged quaver, then a beamed pair of quavers. The audited inventory already held beam group indices 2–3; the renderer now honours those groups for printed bars instead of automatically beaming all consecutive quavers. Editable bars retain automatic grouping.

## Question 4 rebuilt from the official PDF

Question 4 was rebuilt from fresh 300 dpi renders of official pages 7–9. See `advanced-higher-2016-q4-rebuild-audit.md` for the complete independent transcription audit, calibration, rhythm exceptions, box boundaries and preserved user decisions. The renderer now consumes geometry alongside the structured notation inventory. Its one `ah2016-literacy` layout replaces all accumulated `.paper-level-ah.question-q4` overrides.

The source-specific bar numbering, bar widths, grand-staff spacing, whole-tone/enharmonic boxes and chord/bass-answer grids were rebuilt. Bar 10 has no extra answer grid. Existing response IDs, accepted answers, note-entry behaviours, audio files and calibrated cue markers are retained. Controls remain below scores, Clear controls align right and bottom, the separate quaver in 4(a) bar 7 remains flagged, dotted-note button spacing is retained, and (d)/(e) are regular-weight and consistently indented.

Validation: all 21 Digital Past Paper test files passed, including exact notation-inventory hashes, source-layout assertions, editable indices, rhythmic totals, barline types, automatic marking, keyboard note-entry targets and finite SVG geometry. The fitted desktop-layout audit passed for the homepage and 49 fixed-canvas pages.

- User refinement after Q4 rebuild: narrow the 4(d)(ii) enharmonic box to 56 score units, starting 28 units before the A-sharp notehead, so the following C is outside. Keep the lower answer stave and legible Enharmonic label.

- User requested removing the five second-playing markers from Question 4. Its player now shows only (a)–(e) at 39.95, 117.89, 172.7, 272.9 and 405.12 seconds. The full paper now has 34 visible markers; audio and printed playback wording are retained.

- User requested only question-part markers for Question 2. Its first cue is labelled (a), and all replay cues are removed; (a)–(e) retain their calibrated times 49.7, 219.44, 265.97, 313.36 and 416.18. The complete paper now has 30 visible markers.

- Question 1 now shows only (a) and (b), at 49.61 and 215.32 seconds, following the user request to remove its replay marker. The full paper has 29 visible markers.

## Spoken part-start marker correction

The user requested that question-part markers begin at the spoken instructions, rather than “Here is the music”. Existing full local Whisper transcripts were revisited and first-part cues checked against 10 ms RMS waveform windows. Q1(a) now starts at 6.88 s, Q2(a) at 7.54 s, Q3(a) at 6.74 s, Q4(a) at 6.72 s and Q6(a) at 8.99 s. Each retains a short lead-in before the letter or earliest section instruction. Q4 does not announce a standalone (a); the marker includes the instruction to read part (a).

Q5 does not read out individual (a)–(d) instructions: they share one guide. Its Guide marker now starts at 7.24 s, before “Listen and follow the guide”, rather than the first music announcement. Separate excerpt and replay cues are retained where the user has not requested removal. Existing (b) and later part cues already start before their spoken instructions and retain their calibrated values. There are 30 visible markers, checked for exact times, chronological order and duration bounds.

- User requested the first Question 3 marker label “(a) 1st”; its spoken-instruction start remains 6.74 seconds.

- User requested removing E from Question 6 excerpt markers: E1/E2 now display as 1/2, with all calibrated cue times retained.

## Final paper sweep — 24 October 2026

- Fixed stale single-question and results answer fields remaining in hidden views, which duplicated input IDs. View transitions now remove inactive answer markup while keeping the reusable single-question shell.
- All Questions now preserves Practice Mode checked-question feedback, answer colours and disabled controls, including read-only notation rendering.
- Submission moves the paper toolbar back into the main shell before hiding the exam workspace, keeping results navigation available immediately without a refresh.
- Browser checks used a separate localhost-origin disposable attempt, preserving the pupil's 127.0.0.1 answers. Checked correct-answer marking, All Questions locking, rhythm keyboard entry and Clear, tie arming/placement/disarming and Clear, incomplete-submission warning, zero-score results, restart confirmation, and saved-results restoration after refresh.
- All six rendered questions had no horizontal score/input overflow or broken images; all answer fields had accessible labels. Every notation Clear control shared the right edge and aligned with its tool-button bottoms. Existing notation inventories and calibrated audio marker values remained unchanged.
- All 21 Digital Past Paper test files passed, plus the desktop-layout audit for the homepage and 49 fitted pages. Added regression assertions for checked All Questions rendering and the results toolbar/answer cleanup. This sweep did not replay the complete 75-minute exam or generate a new feedback PDF.

## 6 November 2026 fresh source audit

All source notation was read again in individually calibrated 300 dpi crops and compared a second time. The complete independent fixture is `advanced-higher-2016-source-audit.json`. Cross-bar ties from Q5 bars 5–6 and 6–7 now follow their actual upward stems below the staff. Q4(e)(ii) now accepts keyboard-enterable D5 under the official any-octave rule. All seven normal source-derived slots plus the high D5 answer passed keyboard, drag preview/entry, marking and Clear. Detailed rendered comparison continues.

## Fine source and engraving continuation — 6 November 2026

- Restore source-regular score captions: q4: Notes, (ii), Enharmonic, F / I, Root, Gm / IIc, 2nd Inv., Chords, Bass note; q5: (a) Key:, (b) Rest(s), (c) Tie, (d) Notes. Captions and pupil-entered answers remain separate.

Final browser and actual Share PDF evidence is tracked in docs/past-paper-maintenance.md. Listening and physical-device checks remain separate.

## Remaining cue-flag review — A177, 7 November 2026

The flagged cues below were checked against independent local recognition windows and complete-track waveform onsets. The exact corrected values supersede earlier timing tables for these marker identities. The audio files, question wording, notation and answer keys are unchanged. Full listening and physical-device checks remain unperformed.

| Question | Marker index (zero based) | Cue | Previous seconds | Corrected seconds |
| --- | ---: | --- | ---: | ---: |
| q3 | 0 | (a) 1st | 6.74 | 6.57 |
| q4 | 0 | (a) | 6.72 | 7.02 |
| q6 | 6 | 1 | 962.88 | 963.02 |

Detailed per-flag evidence: `audit/2026-11-05/a177-cue-flag-review.json`. The shared exact-marker regression uses the A177 source-duration and waveform fixture.


## 18 November 2026 conclusion justification audit

Q6(b)(ii) now uses excerpt-specific evidence families and equivalent wording reviewed against this year’s conclusion and additional guidance. The official 0/1/2 rubric is retained: both periods need valid justifications for full credit, and, by the teacher’s explicit override, the supporting evidence must be written in the Conclusion itself. Earlier final answers cannot supply justification, even though the official scheme allows such links. Feedback distinguishes period identification from justification and names credited evidence. Rough work is excluded. See [the complete audit, alternatives and exclusions](advanced-higher-conclusion-audit.md).
