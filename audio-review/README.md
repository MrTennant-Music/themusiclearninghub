# Audio Review

Double-click **Open Audio Review.command** in the project root. The local tool opens at http://127.0.0.1:8901/. The launcher starts the local service in the background. It is a local authoring tool, not a pupil page or a hosted editing service.

- The **All files** section lists every recording in a sortable table: filename, size, level, heading, concept, decision, use and last review date. Search names/notes/concepts, set minimum/maximum size, filter formats or REVIEW files, and use the shared level/concept filters. Click a filename to open it in the player. Browsing, filtering and sorting do not alter audio.
- Filter by level, heading, concept, decision or intended use. REVIEW files appear first by default. Search filenames and concepts. Work towards five approved examples per concept.
- Space plays/pauses; P plays the selection; I and O set its start/end. Left/right seek two seconds. N/B move between recordings. Keys 1–5 record the labelled decisions.
- Drag a waveform region to select it. Drag its blue handles to refine it, or enter start/end seconds. Zoom and the position slider help with longer recordings.
- **Keep** saves the decision and removes a leading REVIEW prefix. A collision is reported instead of overwriting another file. **Reset decision** restores the REVIEW prefix if this tool removed it. Other flags do not move or delete audio.
- Notes and intended use save on navigation, after a short idle period, or with **Save notes & use**. Decisions persist in `maintenance/audio-review/reviews.sqlite3`. Export produces a complete JSON review list.
- **Save trimmed concept clip** writes a 96 kbps, stereo, 44.1 kHz AAC/M4A into the existing concept folder. The first source is preserved under `maintenance/audio-review/originals/` and every replaced version is retained under `versions/`. Switch Version to **Preserved longer source** to re-trim from it. Saved trims are awaiting review until you press Keep.
- **Save source to exam bank** makes a separate copy of the preserved source, or the current recording when no preserved source exists, under `exam-excerpt-bank/Level/Heading/Concept/`. Use the Other concepts and Notes fields to record audible features and possible questions. Selecting Both records your intention; press the exam-bank button to create the separate exam copy.
- The move control offers all existing concept folders, including empty ones. It moves only the selected file, updates its final concept suffix and resets its decision for review. Collisions never overwrite.
- Rejections are flags only. Nothing is automatically deleted. Audio is never sent to a remote service.

The converter is discovered from `AUDIO_REVIEW_FFMPEG`, your PATH, the bundled local review-tools copy, an existing temporary imageio-ffmpeg installation or MediaHuman. If unavailable, set `AUDIO_REVIEW_FFMPEG` to an installed ffmpeg executable before starting the tool. Playback and review decisions work without the converter; saving trims requires it.

Run backend regression checks with `python3 -m unittest discover -s audio-review -p 'test_*.py'`. Tests use disposable libraries and never edit the real example audio.

Filename groups are Piano demonstrations, unnamed Examples, named recordings, then Multiple Concepts, numbered independently per concept folder. EXAM and EXAM OLDER prefixes have been removed. Complete recorded concept labels remain in the review database and audit manifest; filenames exceeding the macOS limit show a +N More count. The All files view filters single/multiple concepts, and expandable Concepts cells reveal complete labels. These labels are inherited from recorded provenance and review annotations, not a fresh AI listening analysis.

Exact duplicate highlighting uses SHA-256 of the entire file, cached against size and modification/change times. The Copies column shows total copies including the selected file and the number of other duplicates. Expand it or the player duplicate panel to open other copies by folder. Exact duplicates only filters duplicate-group members; counts always cover the whole library, even when viewing one concept. Refresh recomputes groups, and saving a trim automatically refreshes them. Same music encoded differently or with different embedded metadata is not classified as an exact file duplicate. No duplicates are removed automatically.

Multi-concept excerpts live in `example audio/Level/Multiple Concepts/`. Placement uses the highest qualification level among recognised labels in the current Hub dictionary; unmatched legacy labels are retained in the migration audit rather than assigned a guessed level. All copies are preserved. Concept filters search the stored label list as well as ordinary concept folders.
