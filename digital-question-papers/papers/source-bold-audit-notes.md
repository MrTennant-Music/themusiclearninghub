# Source-PDF bold-text audit

Date: 2 November 2026

## Scope

The official question-paper PDFs for all 30 registered Digital Question Papers were extracted with Poppler and compared against the text rendered by the digital paper data:

- National 5: 2014–2019 and 2022–2026
- Higher: 2015–2019 and 2022–2026
- Advanced Higher: 2016–2019 and 2022–2026

## Implementation

`source-bold-map.js` is the checked-in source snapshot. It maps a complete, normalised paper sentence to the exact substring or substrings that are bold in the official PDF. The shared renderer merges this source emphasis with the existing paper-specific `boldPhrases` metadata.

This preserves the source distinction between:

- individual bold command words, counts, timings, bar references and musical terms;
- complete bold instruction lines in papers that use that convention;
- structurally bold table headings, category headings, lyric-placement words, question headings and mark numerals already rendered by semantic bold elements or established paper CSS.

Ambiguous repeated phrases were checked against their surrounding PDF line. Manual disambiguation is recorded in `scripts/generate-source-bold-map.js`, including the Advanced Higher chord wording, “And cast away”, “4th higher”, repeated “one” instructions, Higher 2018 replay wording, National 5 “Tick” headings and National 5 2024 “con sordino”.

## Regression protection

`tests/source-bold-fidelity.test.js` checks that:

- every registered paper has a source-emphasis snapshot;
- every mapped sentence still exists in the matching paper/question data;
- each bold phrase still occurs inside that sentence;
- the shared map loads before the renderer;
- instructions and source-bold part labels pass through the shared paper-text renderer.

Regenerate the snapshot with:

```sh
node digital-question-papers/scripts/generate-source-bold-map.js
```

Set `PDFTOHTML` if Poppler is installed somewhere other than the project runtime used for this audit.
