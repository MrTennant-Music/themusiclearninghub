# Concept Companion photographs

The photo manifest covers all 300 concept pages. A null assignment leaves the
photo area absent for manual population. Related concepts can
share a photograph. For abstract concepts, the caption describes its illustrative
connection rather than claiming that a still image demonstrates the sound.

See `../music-concepts-photos.json` for every photo's author, licence, original
Wikimedia Commons file page, caption and concept assignments. The app displays
those credits alongside the photographs. Rebuild its browser manifest with:

    node scripts/build-concept-photos.cjs

Photos are selected locally; viewing a concept does not run an image search.

## Temporary local photo editor

On localhost, concept pages offer Add photo or Change photo using the shared
Interactive Games image bank. Selecting a result saves a local image, updates
this manifest and rebuilds the browser manifest. Existing shared photos are kept.

The loopback save service is started with:

    node scripts/concept-photo-editor.cjs

It listens on 127.0.0.1:8766 and accepts the local Hub on port 8765. Editing
controls are enabled by `photoEditingEnabled` in `music-concepts.js`; turn that
flag off when authoring is complete. Saved photos remain normal site content.
