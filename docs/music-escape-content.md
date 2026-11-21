# Music Escape content provenance

Run `node scripts/build-music-escape-content.cjs` to regenerate `music-escape/content.js`. The builder reads existing Hub sources and does not modify questions or review metadata.

Dictionary definitions and qualification membership come from `shared/music-games-concepts.js`. They are the existing concise collection definitions. A repeated upper-level concept ID needed by a reviewed audio choice is retained from `music-dictionary/music-concepts-data.js`; this preserves the Hub's treatment of concepts at multiple levels. The bundle contains 290 concepts.

Twenty recordings are selected from the existing `music-dictionary/quiz-data/audio-question-bank.json`: four target concepts at each qualification. Every selected question has `review.finalisedAt`. Its exact prompt, choices, correct option IDs, recording, source SHA-256 and finalisation timestamp are preserved. The source bank and recordings remain unchanged.

| Qualification | Target concepts |
| --- | --- |
| N3 | Accordion, Bagpipes, Organ, Piano |
| N4 | Cello, Clarinet, Flute, Harpsichord |
| N5 | Bassoon, Oboe, Piccolo, Tuba |
| Higher | Diminished 7th, Dominant 7th, Harmonic minor scale, Mordent |
| Advanced Higher | Augmented triad, Tritone, Turn, Piano trio |

The selection uses existing reviewed examples rather than generating novel recording-to-concept associations. Higher/AH material includes harmony and ornaments rather than simply adding more instruments. Replay variation is deliberately bounded to four reviewed recordings per exact qualification. Credits retain the existing library recording description; they are not a new licensing assertion.

Verification on 16 November 2026: all 20 local paths exist; SHA-256 hashes match the selected reviewed question; all 20 containers were inspected using macOS `afinfo`, with readable audio tracks and durations within 0.1 seconds of the recorded metadata. The automated test checks choices, answers, qualification eligibility and exact source preservation. No new independent human listening assessment was performed. Existing source evidence and the user's finalisation are the basis for musical associations. Browser playback and physical-device audio output must be assessed separately.

Integration: use `audio.prompt` and `audio.options` for the listening interaction, and `audio.correctOptionIds` to interpret the response. Do not replace its distractors with random concepts. Credit strings may reveal the target and should be displayed after solving, rather than as a pre-answer cue. Only the active recording should be loaded; do not preload the full library.
