# Digital Past Paper maintenance

The paper registry, paper modules, import notes and regression fixtures are the
current source of implementation decisions. Historical successful audit runs do
not certify the current working tree.

All paths in the component map below are relative to `digital-question-papers/`.

## Repository discovery

The registry supplies the complete paper inventory. Paper modules hold wording, marks, answer rules and audio markers separately from shared behavior.

| Component | Responsibility |
| --- | --- |
| `paper-registry.js`, `papers/*.js` | Available qualifications/years and individual paper content |
| `exam-marking.js` | Normalisation, spelling, objective answers, concepts, caps, analysis and whole-paper marks |
| `exam-engine.js`, `exam-storage.js` | Completion, navigation, checking, timers, draft and submitted restoration |
| `exam-ui.js` | Source-paper layout, fields, menus, feedback, modes and export |
| `exam-notation.js`, `papers/*-notation.js` | Score inventories, glyph rendering and notation interactions |
| `exam-audio.js` | Playback, seeking, section markers, continuous examination audio and errors |
| `source-bold-map.js`, `source-bold-overrides.json`, `source-style-overrides.json` | PDF-derived emphasis, retained ambiguities and reviewed exact regular/bold/italic occurrences |

The 848 subparts comprise 412 short-text, 167 radio, 134 notation-choice, 57 structured-review, 38 concept-line, 20 checkbox, 10 comparison-grid and 10 lyric-placement components. Every paper's question/subpart mark sums were checked; each totals 40 marks.

### Source-confirmed answer resolution

**Advanced Higher 2019, Question 1(e):** official marking instructions, printed page 03, specify Soprano → Tenor → Alto → Bass and explicitly accept STAB abbreviations. The previous regression expected compact STAB to score zero; it now expects one mark. Correct STAB and incorrect STBA were entered through the real four-line interface. Real submission awarded STAB its mark. See the [official marking instructions](exampapers/adv%20higher/2019/Music%20AH%202019%20Answers.pdf) and the updated import notes.

The continuation independently read the text expected responses and additional guidance in all 30 official marking instructions. Further source-confirmed corrections are recorded below and in `source-review.json`. Printed answer diagrams, score inventories and open-ended semantic grading remain separate checks.

The initial pass changed only three voice-answer properties in AH 2019. The continuation has now corrected additional source-confirmed answer alternatives and concept groups. Printed pitches and rhythms are changed only after independent source confirmation; AH 2017 Q2(b) is the first fresh source-confirmed pitch correction in this continuation. Explicit teacher adaptations remain preserved or flagged. The N5 2016 source beam directions and layout, plus the N5 2017 box boundary, are now corrected. All five source/teacher decisions were resolved by explicit user replies on 6 November: use the official N5 2015 and Higher 2023 missing-note answers, Higher 2022 D5, the printed Higher 2023 slur, and AH 2018 F-naturals. The superseding records and regressions are now updated. Existing exact inventory regressions continued to pass. The AH 2025 fixture correction reflects an existing box coordinate, not a new engraving change.

### Spelling and alternative answers

Existing aliases already included `creshendo`. They were retained. Added explicit British/American alternatives for colour/color, metre/meter, synthesiser/synthesizer and programme/program music. Number words remain strict against fuzzy changes such as three → threes. Regression exclusions cover conflicting concepts, numbers, note names, intervals and keys. Question-level alternatives and strict-matching flags remain authoritative.

Negation handling is local; it does not certify human-level interpretation of arbitrary extended prose.

## Required verification and limits

Complete-track listening and independent cue-boundary audition remain pending.
The retained listening register is
`digital-question-papers/tests/fixtures/source/a178-pending-listening-register.json`.
Native Safari, VoiceOver and physical iPad/iPhone touch checks also remain
pending. Browser simulation and automated marking checks do not replace them.
Negation handling does not establish human-level interpretation of arbitrary
extended prose. PDF export checks do not certify tagged-PDF accessibility.

## Inputs and reproducible checks

Permanent source inventories are in
`digital-question-papers/tests/fixtures/source/` and extracted official wording
is in `digital-question-papers/tests/fixtures/source-text/`. Source documents
remain under `exampapers/`. Musical corrections belong in individual paper
import notes, inventories and regression fixtures.

Retained intermediate JSON reports are under ignored
`digital-question-papers/audit/`. Some manual auditing stages consume previous
reports; regenerate the prerequisite stage before a downstream check. Report
writers do not automatically replace the reviewed source fixtures.

The former `maintenance/reference/` crops and reviewed paragraph ledgers are
absent. Source-line generation still requires those authentic ledgers; recover
or reverify them before regenerating `source-line-breaks.js`. Do not infer a
visual review from generated output or current application data.

Run `node --test digital-question-papers/tests/*.test.js`,
`node digital-question-papers/scripts/audit-paper-data.cjs` and
`pnpm test:desktop-layout`. Browser helpers additionally require Playwright and
a suitable local browser. Consult `AGENTS.md` for layout and transcription rules.
