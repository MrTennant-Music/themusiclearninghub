# Advanced Higher Question 6 marking audit — 15 November 2026

Scope: every Advanced Higher paper currently offered: 2016, 2017, 2018, 2019,
2022, 2023, 2024, 2025 and 2026. No 2020 or 2021 paper is offered.

## Sources and common rubric

Reviewed Question 6 against each paper's official marking instructions, including
the additional guidance and acceptance/rejection notes. The extracted official
texts are under `tests/fixtures/source-text/advanced-higher-YEAR-marking.txt`;
the original PDFs are identified by `markingInstructionsPath` in each paper.
Existing source-audit and source-answer-guidance fixtures provide additional checks.

- (a): 2 marks per excerpt, one mark for two recognised concepts in each official
  category. A third or fourth synonym for the same listed point earns no extra
  credit. The response's own headings do not determine its category.
- (b)(i): 1 / 2–3 / 4–5 / 6 or more distinct valid comparisons earn 1 / 2 / 3 / 4
  marks. Any combination of similarities and differences is accepted. Paired
  differences need the relevant features of both excerpts. Excerpt-only points
  must express exclusivity or contrast, rather than simply naming a feature.
- A list remains capped at 2 marks. There is **no word quota** or minimum sentence
  length. Short complete descriptive statements are eligible for all four marks.
- Explicit denials and contradictory claims cannot leave the contradicted point
  credited. Unrelated incorrect periods cannot coexist with a credited period.
- (b)(ii): 2 marks for both correct periods justified; 1 for both periods identified
  or one identified and justified; otherwise 0. No half marks.
- Supporting evidence can come from the same excerpt's earlier **final** answers
  in (a) or its analysis in (b)(i). Rough work is never marked or used as support.

## Per-year checks and corrections

| Paper | Official conclusion periods | Audit notes |
|---|---|---|
| 2016 | Classical; Neo-classical / 20th century / Modern | Retained the fourteen similarities and ten differences. Accept f/ff as printed dynamic alternatives, excluding F-major/minor key names. Preserve grouped piano-and-orchestra credit, disallowed chromatic scale and melodic minor. |
| 2017 | Baroque; Jazz / 20th century / Modern, with stated alternatives | Retained eight similarities and ten differences. Added the official soprano-and-mezzo / soprano-and-countertenor alternatives to the voice comparison. Preserve the rejection of contemporary jazz and Neo-classical, while accepting an arrangement of a Baroque piece/fugue. |
| 2018 | Romantic; 20th century / Modern / Popular | Retained thirteen similarities and ten differences. Exclude chromatic scales from the chromatic similarity. Accept the listed mixed tenor/baritone small-group alternatives, but not an isolated singular voice. Soprano alone is not the source's wide-range/coloratura justification. Contemporary remains excluded. |
| 2019 | Baroque; 20th century / Modern | Retained twelve similarities, five paired differences and the two excerpt-only lists. Same text/Latin text is accepted. Require both homophonic and polyphonic for Excerpt 1 in the texture contrast; require strings + brass + timpani or the accepted small/chamber-orchestra alternative for the forces contrast. Preserve the source's major-modulating-to-minor allowance and rejection of 'stays in a major key'. |
| 2022 | 20th century / Modern; 20th century / Modern / Popular | Retained fourteen similarities and the paired/excerpt-only differences. Mixed choir is not generic 'male and female voices'. Require solo voice **and** backing vocals for its counterpart. Tempo comparison accepts the two named tempi in a described change, not only a single exact phrase. Justifications follow the listed musical evidence; merely naming an organ or male voice is insufficient. |
| 2023 | Classical; 20th / 21st century / Modern | Retained nine similarities and the paired/excerpt-only lists. Exclude chromatic scales, protect singular oboe-and-clarinet requirements and the distinction between modulation and change of key. The accelerando contrast rejects additional incorrect Italian tempi. Preserve chamber-group versus chamber-orchestra distinction. |
| 2024 | Baroque; Romantic | Retained six similarities, six paired differences and excerpt-only lists. Concertino **and** ripieno are one combined point. Protect strings versus full/symphony orchestra, both textures and trills plus acciaccaturas. String orchestra is recognised in the conclusion; bare brass/woodwind is not a substitute for the source's orchestral justification. |
| 2025 | Classical; Romantic / late Romantic | Retained eleven similarities, three paired differences and excerpt-only lists. Both excerpts must share the **same** pedal variant and the **same** cadence type. Preserve modulation-to-minor rejection. Small/chamber ensemble is an explicit accepted alternative; small/chamber orchestra alone is rejected and needs wind evidence. A single named cadence and generic change of key are not conclusion justifications. |
| 2026 | Baroque; 20th / 21st century / Modern / Contemporary | Retained eight similarities, six paired differences and excerpt-only lists. Both textures, specified solo voices and string-versus-symphony orchestra remain required. Modern orchestral justification requires the orchestra and accepted percussion combination. Angular melody must also mention the lack of clear phrase structure. |

## Regression coverage and limits

`tests/advanced-q6-official-marking.test.js` contains independently selected
examples from the official texts for every year: category credit, all analysis
bands, short prose, list cap, repetition, contradiction, conclusion bands,
cross-part support, rough-work exclusion and the documented year-specific cases.
All existing Advanced Higher paper and general Digital Past Paper tests are run.

The marker is deterministic accepted-language matching, not a human examiner.
It can recognise the encoded alternatives and compound requirements, but cannot
certify every possible paraphrase or exercise an examiner's discretionary
judgement about an extensive unrelated/contradictory list. The official newer
papers do not provide a numerical formula for those discretionary penalties;
this audit does not invent a count-based deduction. Retain teacher review for
such cases and for nuanced free-text responses. The list/prose distinction uses
written clause structure, never word count.
