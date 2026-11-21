# Chromatic Tuner: REA reconstruction and verification

## Reference investigation — 15 October 2026

Reference: https://www.onlinemictest.com/tuners/chromatic-tuner/

Framework: https://github.com/morluto/rea, using `rea-agents@6.5.0` and its Reverse Engineer Anything skill through the CLI. REA was actually run for static application analysis, focused semantic traces, two controlled process captures and a capture comparison. No permanent REA installation or global agent configuration is required by the Hub.

The reference was inspected in Safari. Its public pitch-detector script and source map were downloaded into `/tmp/rea-tuner-reference`, outside this project. The map contains the original TypeScript. Its AGPL-3.0 notice remains with those temporary files. No reference script, artwork, CSS or Aubio binary is distributed with this implementation.

### Recovered behaviour

- The reference rotates a wheel containing two chromatic octaves beneath a fixed pointer. There are 24 note positions, 15 degrees apart.
- Its nearest-note calculation uses twelve-tone equal temperament, A4 = 440 Hz and MIDI note 69. Cents are floored, and frequency is displayed to one decimal place.
- Absolute wheel angle is `(MIDI note + cents / 100) × 15`, applied as a negative CSS rotation.
- Its transition duration is `(truncate(abs(angle change)) + 25) × 15` milliseconds, with CSS `ease` timing.
- Microphone input passes through Aubio's pitch detector before reaching the display handler. The investigation did not validate Aubio's internal algorithm.

### REA evidence ledger

| Operation | Evidence ID | Scope |
| --- | --- | --- |
| Initial script analysis | `ev_e649f2ad263a5f1b92bc428f735caf85f3a362805993141a81f14dc8fcc5e815` | Minified script only |
| Expanded application analysis | `ev_cc9937be041a90f9c4be1862ce61b214b81f4de998bf115aa02b43321f9a4020` | Script, source map and recovered TypeScript; 1,174 semantic nodes |
| Dial transform trace | `ev_0b6706376a3a662514d7c88a97e433ef9bd10e86052c6706c28e34a12f4b0d44` | Located transform write; bounded one-node result |
| Pitch reference trace | `ev_be10a0b075d44794e516809036389cabffb1f09d3680e242f6c50ce8e4be68c1` | Six nodes; ambiguous result with unresolved relationships |
| Microphone trace | `ev_f8aae7e44e5dc77c29c852fd8b1923ec41bbabc3394fd341656f92f5c3840dc9` | Located capture call; bounded result with one unknown |
| Reference process capture | `ev_b2a8757c7c8dfc55297f42d7bb17e22a13f2dc86698b4299c035c7686c837e79` | Actual reference display handler, controlled inputs |
| Reconstruction process capture | `ev_cd141dee0467917ab2096207cfdfac534e79a24d788c746c3f1c713a9097f6a5` | Reconstructed display calculations, same inputs |
| Process comparison | `ev_a084549d40fd054626ba8b0957dca0fdc2efd820f6ef52e658c0b85779f8dc20` | Capture-level status changed; not an equivalence verdict |

Initial script SHA-256: `33e57b1cdb7d2334aac9dcac18cb3ab48e11749963079327b72e3823ad82ba16`.

The controlled probe runs the reference's actual start and audio callback handlers in an isolated JavaScript context. Browser audio, DOM and Aubio interfaces are stubbed; supplied frequencies reach the original display handler. This is a display-contract test, not a real browser microphone recording. Both REA captures exited successfully. Concatenating their terminal frames and parsing the emitted JSON gives **18 identical observations** covering note, octave, cents, rotation, transition duration and frequency formatting. Cases include C4–C5, detuned A4 and octave jumps. The observed numeric facts are retained in `tests/fixtures/chromatic-tuner-reference.json`.

The whole-capture comparison reports changed terminal/exit dimensions: capture timing and output framing differ even though both exit records have code 0 and the parsed observations match. Filesystem and process equivalence remain unknown. Static traces locate relevant operations; they do not prove complete interprocedural behaviour. Temporary full artifacts are `/tmp/rea-tuner-expanded-analysis.json`, `/tmp/rea-trace-expanded-*.json`, `/tmp/rea-process-{reference,reconstruction}.json` and `/tmp/rea-tuner-process-comparison.json`.

## Hub implementation and deliberate differences

The display now reconstructs the reference's 24-note rotating wheel with a fixed pointer, rather than the earlier generic moving needle. The SVG and styles are independently authored. The first valid reading snaps into place; subsequent rotations take the shortest equivalent path, avoiding the reference's long first-reading rotation. Transition timing otherwise follows the recovered rule. `referenceDialState` preserves the original absolute-angle contract for regression comparison; `wheelMotion` applies these deliberate UI improvements.

`chromatic-tuner-core.js` uses an independent cumulative-normalized difference pitch estimator with RMS gating, parabolic interpolation and a 40–2000 Hz range. It does not claim identical detection performance to Aubio. A short median filter stabilises readings. The Hub adds cents feedback and a ±5-cent in-tune band. The pupil-facing tuner uses standard A4 = 440 Hz and sharp note names.

Microphone access starts only after Start Tuning. Audio stays in memory; no recording or upload is implemented. Stop, page departure, backgrounding, disconnection and component cleanup release tracks and audio contexts. Late permission results after cancellation are also released. Microphone permission and HTTPS or localhost are required.

The homepage links directly under Other, alphabetised before Follow the Score. Title, subtitle and icon match the activity header, favicon and touch icon. The shared Hub header/footer and fixed 1280px canvas are retained.

## Verification

- `node --test tests/chromatic-tuner.test.js`: 10 tests passed, including the 18 reference observations, rotation continuity, chromatic pitches E1–B6 at 44.1/48 kHz, harmonic-rich input, detuning, noise/silence rejection, calibration, denied/cancelled permission, generated input reaching the controller and disconnection cleanup.
- `pnpm test:desktop-layout`: homepage and 40 fixed-layout pages passed.
- The rebuilt local page was opened and visually checked for the wheel, fixed pointer, controls, shared identity and footer.
- A physical microphone/instrument test remains outstanding. Generated samples and controlled display captures cannot establish real-device behaviour.
- The build regenerates the local preview, but the existing site-size release guard still rejects the repository's total output above 1 GB. This is separate from tuner correctness; no publishing was performed.

## REA browser-led visual reconstruction — 15 October 2026

After installing the Codex MCP integration, ran `capture_browser_scenario` through the connected REA tools using the installed Microsoft Edge executable and an isolated temporary browser profile. A successful reference capture is `ev_e9c130e1add3412d38060c892cd29ae4fc2555ab3361b7ee5ef17d7f1a4a84c2`. It records the reference URL, a cookie-dialog dismissal, screenshot and accessibility tree. The earlier DOM capture returned partial observations with a cleanup timeout; a subsequent process check found no remaining headless Edge process. Its DOM remains useful as partial evidence, not a clean successful capture.

Observed visual details now reconstructed: blue condensed chromatic labels, 24 positions around a wheel, finer blue minor ticks and heavier major ticks, fading sides, a broad blue triangular pointer, orange circular Play control, detected note/octave and frequency replacing that large control during listening, and a small Pause control. Pointer and note use orange during listening. The shared Hub header and icon remain project-specific integration choices. The reference's advertising, branding, trackers, social controls and explanatory articles are outside the tuner component.

The bundled condensed Open Sans font is obtained from Google Fonts and includes its SIL Open Font License in `fonts/open-sans/OFL.txt`. The wheel and button SVG geometry is newly authored; no reference SVG or JavaScript was copied. The independent pitch detector and microphone cleanup described above remain in use. This is a reconstruction of the tuner component, not an assertion that its underlying detector is Aubio or that it reproduces the whole third-party website.

## Hub styling — 15 October 2026

At the user's request, the visual reconstruction now uses the Hub's inherited interface font, black note labels and pointer, neutral grey ticks and a rounded black Play/Pause button. Detected notes and the pointer become green inside the existing in-tune band. The rotating wheel geometry and microphone behaviour are unchanged. The condensed reference font is no longer loaded. All ten tuner tests and the fixed-canvas layout audit passed after this styling change; the rebuilt local page was visually checked.

## Instrument tuning — 15 October 2026

The Instrument menu defaults to no selection (guitar glyph and “Instrument” label); “Chromatic” clears a selection. Selected instruments use individual SVG glyphs, standard-string note buttons and matching highlighted pitch classes on the wheel. Bottom-right SVG headstocks provide keyboard-accessible reference-note peg buttons. Each reference uses equal-temperament A4=440 Hz, a 2.3-second synthesized tone and a quiet octave harmonic. New playback closes the previous playback context. Instrument changes, stopping and backgrounding stop playback; contexts and timers are cleaned up on unmount.

Standard open-string MIDI pitches, listed by string order rather than necessarily ascending pitch:

| Instrument | Standard strings |
| --- | --- |
| Guitar | E2 A2 D3 G3 B3 E4 |
| Bass, four strings | E1 A1 D2 G2 |
| Ukulele, high-G | G4 C4 E4 A4 |
| Violin | G3 D4 A4 E5 |

References: [Fender guitar](https://www.fender.com/articles/setup/standard-tuning-how-eadgbe-came-to-be), [Fender bass](https://www.fender.com/online-guitar-tuner/bass-guitar-tuning/), [Fender ukulele](https://www.fender.com/articles/setup/how-to-tune-a-ukulele), [Yamaha violin](https://www.yamaha.com/en/musical_instrument_guide/violin/mechanism/mechanism002.html). Octave-specific frequencies are calculated from the standard open-string registers at A4=440.

An instrument string must remain within ±5 cents of its exact note and octave for 400 ms before showing the green tick, green peg and string button and scheduling a two-tone chime. Repeated readings do not repeatedly chime; the same string re-arms after leaving tolerance for 700 ms. Microphone analysis is suppressed for 3 seconds during reference playback and 850 ms during a success chime so the app's own sound does not trigger success. Switching instruments clears the match tracker. No microphone permission is needed for peg playback.

Verification: 13 tuner tests and the desktop layout audit pass. Generated microphone input through the actual controller confirms the correct string state and schedules the chime once. All standard string frequencies, octave rejection, settling and re-arming are regression-tested. Browser checks covered instrument selection, all four heads, note labels and peg playback feedback with no captured page errors. A shared hover transform conflict was fixed by positioning pegs with CSS translate independently of the Hub's hover/press transform. Real instrument/microphone performance remains a manual check. The pre-existing site-size build guard still blocks release output above 1 GB.

## Guided string workflow — 15 October 2026

The instrument head now appears above the dial with no Standard Tuning heading. Instrument mode requires explicitly selecting a peg before starting microphone capture. Clicking a peg selects the exact string and centres its note on the dial; Play Note separately plays its reference pitch. Only that selected string can complete, using the existing ±5-cent/400-ms check. Completed pegs stay green. Success advances to the next untuned string in standard string order, wrapping when necessary; all-complete leaves no next selection. Selecting a completed string permits retuning it. Reset stops capture/playback, clears all completion marks and requires a new selection. Stop/pause keeps completion progress but resets settling time. Chromatic mode remains unrestricted.

Fifteen tests pass, including a complete six-string cycle, octave rejection for the two guitar E strings, out-of-order selection, reset and preservation of progress across detection resets. Browser checks verify Start is unavailable before selecting a string and enabled after selection, with the head above the dial. Success detection and chime scheduling were tested using generated input; real instrument validation remains manual.

### Current placement and playback update

The instrument head is centred below the dial/readout and above Start/Stop. Reference-note playback and its Play Note control have been removed at the user's request. Pegs select strings only; success chimes still play when the selected physical string reaches the target. Completed pegs, automatic progression and Reset are retained. The older reference-playback descriptions above record superseded behaviour.

## Reliability and guided-workflow repair — 2 November 2026

Shared/QR instrument profiles now initialise the same guided controller as a direct menu selection. Instrument listening exposes Stop (or Cancel while permission is pending), Reset clears the guided run, and a successful string advances to the next unfinished string. The final success leaves no string selected. Guided completion again uses the documented ±5-cent reading held for 400 ms.

The page now uses the Hub's local Tailwind, React and ReactDOM assets and a precompiled `chromatic-tuner.runtime.js`, rebuilt with `pnpm run build:tuner`; it no longer depends on CDN availability or browser-side Babel compilation. Reduced-motion preferences disable the completion and dial transitions. Regression coverage protects shared-profile initialisation, automatic guided progression, exact tolerance/hold time, calibrated guided tuning and source/runtime parity.
