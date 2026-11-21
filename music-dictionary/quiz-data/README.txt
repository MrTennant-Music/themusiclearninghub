Music Dictionary question bank

Canonical source: music-dictionary/quiz-data/question-bank.json.
Build and validate: node scripts/build-dictionary-quizzes.cjs
Import saved question edits: node scripts/build-dictionary-quizzes.cjs --import-review /absolute/path/review.json

All valid questions are available for quizzes. There are no approval states or
testing modes. Question bank opens the editor for wording, answers, feedback and
notes. Saved browser edits apply to newly started quizzes immediately.

Stable question IDs, evidence and content checksums are retained. The legacy
browser storage key and file envelope are accepted to preserve previous edits;
old approval metadata is ignored and removed on loading or saving.
