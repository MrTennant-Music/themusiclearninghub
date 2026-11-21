# Music Escape: The Lost Score

Refreshing or reopening the page starts a new attempt at the selected level. Switching levels within the same page keeps each level’s attempt in memory. Only preferences and earned Hub medals persist across page loads. Earlier notes below describe the former save-and-restore behaviour.

Medals are awarded when the exit unlocks: bronze after Room 3, silver after Room 4, gold after Room 5, and diamond after the final room. The Room card shows medal milestones. The Time card opens Reset; elapsed play time does not affect awards. This replaces the timed awards described below.

## Repository investigation and reuse plan

The checkout is a static multi-page website with local JavaScript, React 18 for shared UI, locally built Tailwind CSS and some generated JSX runtimes. `package.json` defines the build and Node test commands. Existing unrelated modifications were present before this work.

| Brief area | Owning source and integration decision |
| --- | --- |
| Architecture | Static HTML entry point with separate `music-escape/core.js`, `content.js`, UI and stylesheet; no server or database needed. |
| Navigation and levels | Homepage app catalogue in `index.html`; activities use `level=N3/N4/N5/H/AH`. Register the game there and preserve qualification codes. |
| Header/footer | `shared/hub-shell.js` provides React `MLH.AppHeader`; `footer.js` owns the common footer. Reuse them. |
| Landing conventions | Existing standalone game pages such as `connections.html` load local shared assets and render their app into `#root`. |
| Toolbar | `shared/hub-menu.js`, `styles/hub-ui.css` and existing activities establish compact rounded controls. Keep the game controls together outside the scene. |
| Customise/persistence | `shared/hub-shell.js` supports profile settings; browser local storage is the established approach. Adventure save state needs its own versioned record. |
| Qualification selector | Reuse the five code/label pairs; level is part of seeded adventure options, so changing it requires a new adventure. |
| Names/icons | `app-icons/`, homepage icon map and AppHeader title/subtitle own app identity. Music Escape uses its generated monochrome icon. |
| Statistics | Shared shell includes score/streak interfaces, but escape progress is completion-based. Show active elapsed time and room number. Time opens medal targets; Room opens Reset. No points are tracked or displayed. |
| Achievements | `shared/hub-achievements.js` exposes `MLH.achievements.award(activity,level,tier)` for genuine completion awards. Do not impersonate a streak. |
| Dictionary | `shared/music-games-concepts.js` supplies concise definitions and level tables; full definitions remain in `music-dictionary/music-concepts-data.js`. Preserve IDs and repeated-level identities. |
| Audio catalogue | Existing local recording metadata and user-finalised questions are in `music-dictionary/quiz-data/audio-question-bank.json`. Selected content is described in `music-escape-content.md`. |
| Notation | `shared/shared-notation-config.js` provides Bravura positioning and staff dimensions; existing literacy activities supply rendering precedents. New game material is authored data, not transcribed exam content. |
| Piano | `popup-piano-audio.js` exposes sampled playback with synthesised fallback; map: `audio/piano/salamander-browser-map.js`. Reuse rather than build another instrument engine. |
| Rhythm | `reading-rhythms-core.js` defines qualification rhythm vocabulary, time signatures and timing tolerances. Any simplified reconstruction must retain correct bar totals. |
| Validation/feedback | Existing quiz-bank answers remain authoritative for reused recordings. Escape state validates mechanism-specific responses and dependency gates independently of presentation. |
| Device layouts | `desktop-layout.js` and `styles/desktop-layout.css` enforce the project-wide 1280px fitted canvas. Only homepage is responsive. Touch-specific behaviour uses `styles/hub-touch.css`. |
| Sound management | `shared/hub-audio.js` and shared output/fade helpers coordinate musical audio. Pause/close/background must release recorded and generated sound. |
| PWA/offline | No root service worker or web app manifest was found in the inspected checkout. Local assets remove external runtime dependencies, but do not by themselves guarantee offline installation. Do not claim existing PWA support. |
| Testing/deployment | `pnpm test`, `pnpm test:desktop-layout`, `pnpm build:site`; static deployment in `.github/workflows/deploy-pages.yml`. `scripts/build-site.js` has an explicit public-directory allowlist, so the new directory must be added. |

## Adventure model

All five qualifications share rooms and story. Short visits Entrance Hall, Practice Room and Concert Hall. Standard adds Music Library, Recording Studio and Composition Room. Extended visits all nine rooms. Each room has an archive, mechanism, recording challenge and exit combination. The chain is local to its room and does not rely on a skipped room.

A deterministic seed produces concepts, recordings and lock digits. An archive solution releases a mechanism cylinder; solving that mechanism releases a recording; its solution supplies the last exit digit. The exit awards a score fragment. Inventory and journal record only discoveries already made. The final exit completes the adventure.

`core.js` owns the serialisable state, generation, dependency checks, answer validation, room-entry snapshot, replay protection and medal calculation. The browser UI owns input, audio, pause/visibility and rendering. `content.js` is generated from existing curriculum resources; its builder checks files and hashes before writing.

## Automated QA scope

`tests/music-escape.test.js` executes 6,000 complete adventures: five qualifications × three lengths × four balances × 100 seeds. Each essential solution is followed by save/restore, and repeated submissions must not award points. Other cases cover wrong answers, dependency gates, discovery idempotence, hints, inventory consumption, room restart, damaged saves, final completion, local audio provenance and publication registration.

This engine matrix does not establish browser rendering, real-device touch behaviour, audio audibility, pupil pacing or independent musical listening accuracy. Those require separate checks. Target adventure durations are design goals, not measured classroom outcomes.

## Implemented experience and final verification — 16 November 2026

The game is registered under Games in the homepage and published by the existing static build. It contains all nine environments, with 12/24/36 essential mechanisms in Short/Standard/Extended. A room contains three archive matches, a practical mechanism, a satellite challenge and a combined exit lock. Piano/notation, music-box ordering, rhythm reconstruction/tapping, dynamics mixing, reviewed listening, definition matching and exit dials all have functioning controls. Listening is retained in the first room under every balance; later satellite puzzles follow the chosen emphasis. Balanced rotates listening, knowledge and rhythm.

The generated monochrome icon and nine-room environmental atlas are local, compressed assets (approximately 706 KB combined). The scene overlays are independently interactive SVG objects. The shared header, footer, fitted canvas, touch handlers, piano samples, Bravura configuration, rhythm timing matcher and achievement store are reused.

Save data includes drafts, seed, discoveries, room-entry snapshot, elapsed active time and hints. Reload restores a paused adventure; backgrounding closes the close-up and pauses play. Settings that change generated content apply only to a new adventure. Restart Current Room restores its entry snapshot without restoring elapsed time. Three progressive hint stages do not affect medals. Awards depend only on active completion time: Bronze/Silver/Gold/Diamond limits are 30/25/20/15 minutes for Short, 60/45/35/25 for Standard, and 120/90/70/50 for Extended. Slower completions receive no medal; there is no timeout. Legacy saved points are discarded while progress is preserved. Accuracy counts successful mechanism submissions divided by all submitted attempts, including exit locks. Level and Customise use shared Hub dropdowns; Reset is accessed from the Room header card.

The game-specific service worker is scoped to `musicescape.html`, not the rest of the Hub. `Customise → Prepare for offline play` caches the selected adventure's recordings and relevant piano samples, while shell assets are cached during installation. Shell fetches use the network when available and cached responses when offline. Audio range requests are supported. Failed recordings expose a written sleeve clue so progress is not blocked. This is an offline-capable page, not a claim that the whole Hub is an installed PWA.

Verification performed:

- 15 focused tests pass, including 6,000 full seeded adventures across all five qualifications, all lengths and balances; every solution is saved and restored.
- Exact note-spelling regression checks cover minor-chord flats and augmented-chord B-sharp, as well as MIDI/notation agreement and bar totals.
- Twenty reviewed local recording files pass source-hash and metadata-duration checks. Their original prompts, choices and correct answers are preserved.
- The nine-room Advanced Higher Balanced route was completed through browser controls, using progressive hints to exercise every mechanism. The ending, medal, accuracy, hint count and all nine fragments were observed (before the later time-based medal change).
- A separate N3 archive → piano → local recording → exit sequence was played. Recording playback reached readyState 4 and played successfully. This confirms playback, not a fresh independent listening assessment.
- Refresh/Continue restored mid-adventure progress and a completed result. New-adventure confirmation, journal, hints, inventory consumption and pause were exercised.
- Offline preparation reported ready for the selected Short adventure. A physically disconnected network was not simulated.
- Desktop and 768px/390px browser-width checks retained the single fitted canvas without horizontal page overflow. These are browser-size checks, not physical iPad or native Safari tests.
- The certificate name field and print command were exercised; the system print preview could not be inspected with the available browser tooling, so final PDF pagination remains unverified.
- `pnpm test:desktop-layout` passes: responsive homepage plus 131 fitted pages.
- The production build succeeds. The complete existing site output is approximately 1,580.30 MB. The configured GitHub Pages workflow sets a 1,000 MB limit, so deployment is blocked by the current whole-site size as well as the wider test failures. Music Escape's generated artwork contributes less than 1 MB.
- Latest full repository suite: 2,175 tests, 2,015 passed, 136 failed, 24 skipped. The game-specific tests pass. Failures include missing retired game fixtures, absent maintenance evidence, existing touch/notation assertions and `conceptgames.html` lacking shared touch assets. These unrelated areas were not redesigned or reconstructed for this task.

Remaining validation: real iPad/Windows/Safari use, subjective listening quality, classroom pacing and usability, system print/PDF output and fully disconnected offline play. The 15–25/30–45/60–90-minute targets remain estimates; the automated assisted play-through is not a pupil timing study. No deployment or commit was made.

## School setting — 17 November 2026

The pupil wakes up in a practice room after the janitor has locked the school. The Standard route runs through Practice Room, Recording Room, Music Classroom, School Corridor, Staff Room and Assembly Hall. The other environments are Music Store, Backstage and Rehearsal Room. Room photos are AI-generated Scottish secondary school interiors in `school-rooms.jpg`, with a cropped practice-room photo for the opening screen. Equipment uses school labels such as Teacher’s piano and Teacher’s radio. The ending celebrates escaping the school; the former lost-score premise is retired. Existing save seeds and progress remain compatible.

## Room-specific photographic objects — 17 November 2026

The reusable emoji objects are replaced with 36 generated photographic cutouts in `music-escape/room-objects/`: four distinct assets for each of the nine environments. The archive/term-matching interaction attaches to a suitable cabinet, desk, noticeboard, chest, trays or lectern. Musical mechanisms use room-appropriate pianos, keyboards, xylophone, mixing desks or metronomes. Audio objects include a speaker, intercom, studio monitor, cassette recorder, CD player and stage monitor. Every room retains its exit door interaction but uses a different local door image. Generated sheet provenance and image hashes are stored alongside the assets.


## Shared question banks (17 November 2026)

Every room now uses a text multiple-choice question for object 1, a single music-literacy task for object 2, and a listening multiple-choice question for object 3. Knowledge and listening questions are drawn without duplicate question IDs within an adventure from the matching level of the published Concept Quizzes bank. The build script retains bank wording, choices, answer IDs, recording excerpts and credits; it validates local recording hashes. Re-run `node scripts/build-music-escape-content.cjs` after bank changes.

Literacy opens `practicequestions.html?embed=escape` inside the game overlay. This is the original Practice Questions score, Bravura assets, answer panel, playback and marking code, with a seeded single-question generation plan and no separate Practice Questions header, timer, menus or footer. The normal page is unchanged. Original qualification-specific question types remain available, including placement and written-answer tasks. The parent checks the frame origin, source and current task token before accepting a result. Wrong answers remain editable; only a correct result reveals the second digit. Question and answer snapshots persist when closing the overlay, refreshing or switching levels. Closing stops playback and removes the frame.

Earlier notes describing definition matching, bespoke keyboard/mixer/rhythm satellite puzzles and the offline-preparation menu are historical. That menu is no longer exposed; disconnected playback of the embedded Practice Questions page is not guaranteed.

### Three-mistake rule
Incorrect submitted answers and door codes share a persistent adventure-wide count. The first two errors show the remaining allowance; the third immediately creates a fresh Room 1 adventure at the same level, clears progress and the timer, and displays a Game reset prompt. The prompt pauses the new timer until dismissed. A start prompt explains the rule, and the game status shows the count. Closing overlays, refreshing, switching levels and restarting a room do not clear the saved mistake count. Existing saves begin at zero when this rule is introduced.

### Door-code clues
Each attempt shuffles the order of the written, literacy and listening digits for the whole run. Each room's order clue lists its own objects in that order.

The literacy clue changes from room to room. Key signatures, chords, keyboard notes, note-letter sequences, rests, note values and time signatures use numbered options. Rhythmic dictation plays one bar to match with a numbered pattern. Intervals and rhythm sums give the number directly; Follow the Score shows eight bars and the last bar played gives the digit. Other score clues use four bars.

Higher and Advanced Higher include an unlabelled three-note piano exercise and a rhythm tapping exercise in Rooms 4–6. Transposition uses the shared score controls and checks the written pitches and rhythms. Correct performance and transposition reveal the digit; a failed submission says “Nothing happens.” and can be retried. Only incorrect door codes cost lives.
