# Imported MIDI parts

Ordinary format 0/1 MIDI import keeps each track/channel as an independent part. Original track names take precedence over instrument names; unnamed parts use their General MIDI program name. The import retains pitches (MIDI 0–127), onset, duration, velocity, channel and program changes per note, including percussion pitches outside the Studio drum machine's ten rows.

Imported canvases use the MIDI Parts viewer instead of classifying the file into Melody, Piano and Drums. Sections retain all part identities. View All remains read-only; an individual section supports part naming, instrument selection, mute and note entry/removal. New sections in an imported composition start with the same empty part list. The score includes each imported part. MIDI export writes separate named tracks and original channels/programs; embedded Studio metadata restores all editor data. Notes split at an eight-bar section boundary are joined for full-composition playback/export.

The score quantises to the existing notation renderer's semiquaver grid; playback/export retain the original note timing. MIDI controllers, pitch bends, SysEx and external plug-ins/custom sound banks are not rendered. Playback uses General MIDI equivalents; alternative drum-kit programs currently use the standard kit. Original program values remain in exported MIDI.

## Sound data attribution

Imported playback and WAV rendering load FluidR3 GM sample data on demand. The first playback of a new instrument requires network access. Remote JavaScript is treated only as a data container and parsed; it is not executed.

- FluidR3 by Frank Wen, licensed CC BY 3.0: https://creativecommons.org/licenses/by/3.0/
- Melodic instrument MP3 data hosted by midi-js-soundfonts: https://github.com/gleitz/midi-js-soundfonts
- Percussion data hosted by WebAudioFont: https://github.com/surikov/webaudiofontdata

No external JavaScript player code is bundled. The imported editor displays a FluidR3 GM attribution link.

## Verification

`tests/composition-midi-parts.test.js` covers named tracks, multiple programs, program changes, polyphony, full MIDI pitch range, percussion beyond the drum-machine rows, cross-section held notes, raw MIDI export, saved metadata restoration, score labels, mute and soundfont data parsing.

The Keynata Commons CC0 Rock Standard 10004 test file (52 bars) imports as five parts across seven sections. All 1,546 note events match the original pitch, timing, duration, program and channel after arrangement compilation.
