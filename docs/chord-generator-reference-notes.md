# Chord Generator reference audit

Audited 28 October 2026. This is a functional reference ledger, not a claim of full feature parity. The Hub implementation uses original code and its own visual design. No reference JavaScript, sample library or artwork belongs in the shipped Hub.

## Evidence and limits

- Musicca: <https://www.musicca.com/chord-player>. Public instructions and the live initial interface were inspected by the parent task.
- OneMotion: <https://www.onemotion.com/chord-player/>. Live initial interface, Project menu, Tools menu, advanced panel, chord editor/More, Melody, Result, Style and Instrument dialogs inspected in a temporary browser tab.
- REA static analysis, parent Evidence `ev_b9720ca55b04877dc9fc2fbeaace64c73fc20ab5e1775a7fbc566fde2127377f`; summary Evidence `ev_4cac5325f015795ad4a75abebb6a37650cd0fbab1a7acf0e27a6235b806cf72e`. Artifact digest `29eda5768e9bfd41c8d3d3ffc84049337e074d2bd5de6a1c28a9ba5c5fe2c18b`. Two downloaded application scripts parsed. Static semantic coverage was partial; Musicca exhausted the worker heap and OneMotion has unresolved dynamic relationships. This is not runtime equivalence evidence.
- Live controls establish that a feature is offered, not that every output path was tested. No account, community publishing, MIDI device connection, reference file export or import was exercised. Backend/community behavior and complete preset algorithms remain unverified.

## Functional checklist

| Area | Musicca observed/documented | OneMotion observed |
| --- | --- | --- |
| Chord progression | Typed symbols, advanced editor, drag reorder, durations, add/delete | Palette, drag into progression, record chords, edit one/all, durations, undo/redo, zoom |
| Harmony | Major/minor/dim/aug/sus, sixth/seventh/extended chords, slash bass | Extensive altered/added/extended qualities, suspended/power chords, slash bass, chord voicing |
| Form | Named sections, repeats, variation per section | Section labels (intro/verse/pre-chorus/chorus/interlude/bridge/solo/outro/custom); event-specific changes |
| Key | Transpose in Settings | Transpose versus change displayed key, seven modes in advanced panel, per-event scale/key |
| Arrangement | Piano, guitar, bass, drums; style/tempo | Instrument selection/combination, style family, bass/chord-only events, silence and break events, bass pedal point |
| Timing | Tempo, count-in, time signature | Tempo, per-event tempo, swing ratios, subdivisions, metronome |
| Melody | Not established in this audit | Onscreen keyboard, chromatic/scale/pentatonic/blues/current-chord filters, velocity, paired interval, sustain, record and edit |
| Results | Playback | Piano-roll canvas |
| Project files | Save/share/download behind login | New, open/save project, share link, import MIDI melody, export MIDI/WAV/HTML |
| Integration | Not established | MIDI input, MIDI output, fullscreen |
| Community | Account saves | Explore with Inspiration/Members/Own/Liked, search and licensing filter (HTML observed; not operated) |

### OneMotion controls requiring an explicit implementation or gap decision

- Event type: Play, Play only bass, Play only chord, Silence, Break.
- Chord qualities: ordinary triads; fifths; sixths; dominant, minor and major sevenths; half/diminished sevenths; added tones; ninths/elevenths/thirteenths; altered fifths/ninths/elevenths; minor-major variants; sus2/sus4 variants.
- Per-event labels, tempo, transposition and scale.
- Style dialog displayed 57 presets, including basic/pop/dance/rock/swing/waltz/reggae/Latin/folk/funk/melodic categories and custom/general/chord/bass tabs. Exact grooves were not reproduced or compared.
- Instrument dialog displayed acoustic/electric keyboards, organs, strings/winds/brass, guitars/basses, pads, harp, MIDI out and combinations. Reverb choices: Studio, Chamber, Gated, Plate, Hall, Church; amount and Echo toggle. Exact timbre/effect equivalence unverified.
- Melody interval pairing: off, octave, third, fourth, fifth, sixth, tenth. Result is a canvas piano roll.

## Hub implementation guidance

Preserve the Hub header, typography, white cards, rounded controls and fixed 1280px canvas. Keep the main flow simple: choose key/style, add or generate chords, press Play. Put voicing, bass, durations and advanced editing in a selected-chord panel; arrangement controls and exports in appropriate menus. Keep local saves and file import/export independent of the reference sites' accounts. Label presets as original Hub arrangements unless their audible behavior has actually been matched. Maintain a separate tested implementation checklist; do not mark this reference checklist as implemented automatically.

## Implemented Hub version

- New Tools tile and fixed desktop-canvas page, using the shared Hub header/footer.
- Original chord parser and theory model: modal diatonic palettes, extended/altered qualities, slash bass, inversions, transposition and rests.
- Named/reordered/duplicated sections, repeats and arrangement variations; drag chord reordering, duration handles, keyboard editing, undo/redo.
- Per-chord playback type, label, tempo change and transposition. Tempo changes are integrated into playback time and MIDI export.
- Ten original accompaniment styles; piano samples already supplied by the Hub, plus synthesized instrument choices; separate track levels, count-in, metronome, swing, reverb, echo and a custom drum sequencer.
- Melody grid, on-screen/computer/MIDI keyboard recording, pitch filters, velocity, paired intervals and fixed sustain; arrangement piano-roll view.
- Browser autosave, validated JSON open/save, URL sharing, MIDI melody import, arrangement MIDI, WAV, MusicXML, standalone playable HTML, printable chord chart. Hardware MIDI output is implemented but requires a compatible browser/device and was not hardware-tested.
- Reference sound/preset catalogs and accounts/community services are not duplicated. The sounds and grooves here are original Hub implementations, not verified acoustic replicas of the reference players. Per-chord scale suggestions and chord-tone melody generation use original Hub rules. The fixed-duration melody recording uses half-beat quantisation rather than capturing held-key note-off timing.

## Verification

20 focused tests cover theory, voicing, sections, tempo integration, project validation, MIDI round trips, MusicXML measures/ties, arrangement tracks/styles and initial rendering. Desktop canvas audit passed (51 fixed-canvas pages). Live local browser checks exercised playback/stop, chord editing, melody entry, Customise and MIDI/WAV downloads. Exported WAV decoded successfully (stereo, 22,050 Hz), with non-zero waveform and no clipping in the checked default arrangement. No reference-site account or publishing action was used. MusicXML import in Sibelius and physical MIDI devices remain untested.
