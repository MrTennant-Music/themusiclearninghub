# Music Dictionary audio examples

Chosen audio is stored here, with per-concept assignments in `music-concepts-audio.json` and its browser copy `music-concepts-audio.js`. Saving through the editor writes all three immediately. No browser-storage export is needed.

Run the temporary save service with `node scripts/concept-audio-editor.cjs`, alongside the local site on port 8765. It listens only on 127.0.0.1:8766. On a concept page, **Add audio** opens the shared audio library with preview, search and upload. Selected clips are downloaded into this folder; uploads support MP3, WAV, M4A, AAC and OGG up to 50 MB. Library attribution remains with each clip.

Multiple examples appear in a horizontal row below **Listen for**. **Remove audio** removes that concept's assignment without deleting the file, so it remains recoverable. Selecting the same file twice does not create a duplicate card.

The add/remove controls appear only on the local site at port 8765. Published pages display only the saved examples. When authoring is finished, the temporary controls and service can be removed while retaining the manifest, saved files and audio-card renderer.
