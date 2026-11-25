# Concept Dictionary maintenance

Canonical content lives in `music-dictionary/music-concepts-data.js`,
`music-concepts-audio.json` and `music-concepts-videos.js`. Consult these files
for current selections rather than historical review tables.

Listen For cues must be concise, original clues to audible identification,
not definitions, historical background or composer biographies. Describe
distinctive sounds and qualify features that are only typical. For Mass,
Latin is usual; Kyrie is Greek. Ayre commonly has solo voice and lute with a
reflective character, but mood is not a universal requirement.

Prefer richer recorded examples to piano demonstrations where feasible.
Retain approved examples and verified credits. Do not infer source duration,
vocal entry, identity or loudness from the current clip metadata. Those claims
require the original evidence or renewed verification.

The former `maintenance/audio-evidence/` records and original `class workbooks/`
DOCX containers remain absent. On 12 November 2026 all thirteen workbook texts
were independently reverified against authentic OneDrive teaching documents.
The compact `tests/fixtures/dictionary-workbook-source-text.json` preserves the
complete extracted paragraphs, actual DOCX hashes and relative source locations.
The audit pins this archive's hash and retains the historical DOCX hashes as
`previousSha256`; these are different document containers, not recovered originals.
Twelve workbooks retain every cited passage at its original paragraph index.
The revised AH Classical and Romantic workbook has six teaching passages
reanchored for twelve choice questions; question wording and answers are unchanged.
The appoggiatura audit now records the deliberate Dictionary-backed clarification.

Run `python3 scripts/verify-workbook-quiz-evidence.py` for all archived quotations.
Add `--source-root /path/to/OneDrive-GlowScotland` to independently verify every
archive paragraph and DOCX hash against the authentic files again. Do not replace
source text from application data or remove evidence assertions to pass tests.
The recovery fixture `tests/fixtures/dictionary-media-evidence.json` uses
original SoundCloud resolution and selection records from the 31 October 2026
review for tonality and arpeggios. The 1 November 2026 review supplies the
measured vocal and chorus entries for Loch Lomond, the source durations for
the six current traditional vocal selections and the two Tallis loudness
measurements. Plainchant uses the later Ave Maris Stella selection from the
same review. These are historical measurements.

The regular Dictionary tests verify the current manifests, excerpt lengths,
selection variety and video player output. The full Styles source checks,
media replacement audit and video expansion audit still need the original
reports. Their tests report missing files explicitly. To run those audits
against recovered files, set `MLH_DICTIONARY_EVIDENCE_DIR` to the directory
containing the original reports and run
`node --test tests/music-concepts-{audio,media-variety,videos}.test.js`.
An explicitly supplied evidence directory must contain the requested reports.

Quiz audio distractors pass `scripts/quiz-distractor-overlap.cjs` during both
audio generation and bank publication. It conservatively excludes equivalent
terms, parent/member pairs, related concepts named in Dictionary definitions,
and concepts in recording titles or tags for identical audio. Relationships
are bidirectional but not transitively expanded. Add explicit pairs when a
recording reveals another compatible answer; metadata checks do not establish
that every untagged musical feature is absent from a recording. Regenerate
with `scripts/build-quiz-audio-bank.cjs` then
`scripts/build-dictionary-quizzes.cjs`, and update the HTML script hashes.

The November 2026 overlap sweep changes 215 of 592 audio choice sets across
all five levels. The 19 text-choice questions flagged by exact concept-name
matching have specific contexts that distinguish their answers; the
appoggiatura question now explicitly specifies leap, substantial duration
and resolution by step to distinguish it from an acciaccatura.

New quizzes use `QuizCore.selectQuizQuestions`: distinct correct-answer
wording (including listed aliases across typed and choice formats) takes
priority, followed by less-used target concepts and fact groups. Repetition
fills the requested length only after unused answers are exhausted. Existing
saved attempts retain their question order.

Quiz wording should use short sentences and familiar words. Prefer “home key” to “tonal centre”, and direct descriptions of sounds
to long abstract phrases. Keep qualification-level musical terms when they are
being taught or assessed. Preserve qualifiers such as “may”, “usually”, “only”
and “must”: simplifying a sentence must not turn a typical feature into a rule.
For tick-two questions, keep each option short and independently readable,
with exactly two correct choices. Source quotations stay verbatim; update the
workbook audit's checked wording and hashes after a reviewed language edit.

Use **melody** and **melodies**, never **tune** or **tunes**, in authored quiz
wording. Preserve verbatim evidence quotations, original recording titles,
filenames and accepted-answer aliases.

Audio question prompts follow the Digital Question Papers style: “Listen to
this excerpt and tick one box to describe what you hear.” Written responses
use focused “name the…” or “identify the…” instructions. Use lowercase “one”
and “two”, with the shared formatter applying bold emphasis. The wording
helper in `scripts/quiz-audio-prompts.cjs` is also used during audio generation.
Do not imply a previous excerpt, a solo instrument, a location within the music
or a fixed number of playings without evidence that the question supports it.

Pupil-facing quiz questions and feedback must stand alone: do not refer to
“course examples”, “taught in this course”, workbooks or booklets. Retain
musical context and qualifiers such as “Baroque”, “typically” and “can”
where needed for accuracy. Verbatim source quotations remain unchanged.

Qualification vocabulary checks cover the complete pupil-facing question:
prompt, correct and incorrect options, feedback and canonical written answer.
`scripts/quiz-question-vocabulary.cjs` uses the qualification glossary, including
plural and hyphenated terms, while recognising whole permitted names such as
Rock 'n' roll. A lower-level question must not require naming a later concept
as its correct answer. Use a lower-level equivalent or a plain sound description
instead. Keep the higher-level terminology in its proper qualification.
Known bank wording revisions include a constrained browser-review reconciliation
record: unchanged fields receive the revised defaults, and teacher-edited fields
remain intact. Unrecognised source changes still require manual reconciliation.

Question-bank review workflow: Save stores a browser review; Export Edits
exports all saved reviews, including audio questions and explicit deletions.
Import using `node scripts/build-dictionary-quizzes.cjs --import-review FILE`.
The importer validates both banks before writing, updates the workbook and typed
answer audits, and rebuilds the published bank. Known imported reviews remain
readable without clearing the browser's saved edits. Delete removes a question
from the editor and practice pool after confirmation; its deletion is exported
and removes the authored record when imported. Retired IDs prevent audio
generation from silently recreating deliberately deleted questions.
