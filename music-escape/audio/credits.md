# Escape Room sound effects

Object effects use original recordings downloaded from Pixabay under the [Pixabay Content License](https://pixabay.com/service/license-summary/). New imports are edited only to select a short excerpt, fade its edges and adjust its level. No generated sounds, added tones or layered effects are used. Interaction and result cues are capped at one second with a short fade, except the user-selected Soft Piano Keys recording, which plays in full; the weather loop and question recordings keep their full length.

`pixabay-sources.json` records the selected source pages and original download filenames. `pixabay/manifest.json` records the room mappings, source IDs, source/output hashes and excerpt times. Rebuild with `scripts/build-music-escape-object-audio.py --source-dir /path/to/downloads`.

The Music Dictionary deliberately uses the same Book Opening recording in every room.

## Room objects

| Room | Object | Pixabay source |
| --- | --- | --- |
| Practice Room | Speaker | [guitaramp foley — matimassa](https://pixabay.com/sound-effects/film-special-effects-guitaramp-foley-529352/) |
| Practice Room | Filing Cabinet | [Filing Cabinet](https://pixabay.com/sound-effects/film-special-effects-filingcabinet-35018/) |
| Practice Room | Piano | [Piano](https://pixabay.com/sound-effects/musical-soft-piano-keys-306074/) |
| Practice Room | A4 Paper | [A4 Paper](https://pixabay.com/sound-effects/film-special-effects-picking-up-one-paper-45792/) |
| Practice Room | Dictionary | [Book Opening — Soumages](https://pixabay.com/sound-effects/film-special-effects-book-opening-345808/) |
| Practice Room | Door Handle | [Door Handle](https://pixabay.com/sound-effects/household-door-handle-1-401153/) |
| Music Classroom | PA Speaker | [amp ilo — freesound_community](https://pixabay.com/sound-effects/film-special-effects-amp-ilo-89678/) |
| Music Classroom | Project Folder | [paper — makigai_maimai](https://pixabay.com/sound-effects/film-special-effects-paper-245786/) |
| Music Classroom | Dictionary | [Book Opening — Soumages](https://pixabay.com/sound-effects/film-special-effects-book-opening-345808/) |
| Music Classroom | Door Handle | [door handle — freesound_community](https://pixabay.com/sound-effects/household-door-handle-89693/) |
| Music Classroom | Desk | [drawer open mid — freesound_community](https://pixabay.com/sound-effects/household-drawer-open-mid-84663/) |
| Music Classroom | Keyboard | [Keyboard](https://pixabay.com/sound-effects/musical-do-80236/) |
| School Corridor | Noticeboard | [paper flutter — freesound_community](https://pixabay.com/sound-effects/household-paper-flutter-5933/) |
| School Corridor | Intercom | [intercom in — freesound_community](https://pixabay.com/sound-effects/film-special-effects-intercom-in-83962/) |
| School Corridor | Wastepaper Bin | [crumping paper — liecio](https://pixabay.com/sound-effects/crumping-paper-109585/) |
| School Corridor | Dictionary | [Book Opening — Soumages](https://pixabay.com/sound-effects/film-special-effects-book-opening-345808/) |
| School Corridor | Door Handle | [door handle 2 — freesound_community](https://pixabay.com/sound-effects/household-door-handle-2-87109/) |
| School Corridor | Xylophone | [Xylophone](https://pixabay.com/sound-effects/musical-xylophone-c3-87468/) |
| School Corridor | Headphones | [Headphones](https://pixabay.com/sound-effects/film-special-effects-071829-putting-headphones-on-43125/) |
| Recording Room | Mixing Desk | [switch — soundreality](https://pixabay.com/sound-effects/film-special-effects-switch-150130/) |
| Recording Room | Studio Monitor | [turning a tube stereo preamplifier on and off — patolenin](https://pixabay.com/sound-effects/film-special-effects-turning-a-tube-stereo-preamplifier-on-and-off-532726/) |
| Recording Room | Clipboard | [foley paper handling amp page turning sfx — lenspulse](https://pixabay.com/sound-effects/film-special-effects-foley-paper-handling-amp-page-turning-sfx-584919/) |
| Recording Room | Dictionary | [Book Opening — Soumages](https://pixabay.com/sound-effects/film-special-effects-book-opening-345808/) |
| Recording Room | Door Handle | [locked metal door handle interior room — freesound_community](https://pixabay.com/sound-effects/film-special-effects-locked-metal-door-handle-interior-room-70286/) |
| Recording Room | Studio Drawers | [drawer opening and closing — emycutiepants](https://pixabay.com/sound-effects/film-special-effects-drawer-opening-and-closing-339167/) |
| Music Store | A4 Paper | [paper rustle — freesound_community](https://pixabay.com/sound-effects/film-special-effects-paper-rustle-81855/) |
| Music Store | Dictionary | [Book Opening — Soumages](https://pixabay.com/sound-effects/film-special-effects-book-opening-345808/) |
| Music Store | Door Handle | [door handle — u_c2s90p6i67](https://pixabay.com/sound-effects/film-special-effects-door-handle-522557/) |
| Music Store | Headphones | [headphones jack plugged in — freesound_community](https://pixabay.com/sound-effects/film-special-effects-headphones-jack-plugged-in-97328/) |
| Music Store | Storage Chest | [drawer open — freesound_community](https://pixabay.com/sound-effects/household-drawer-open-98801/) |
| Music Store | Metronome | [Metronome](https://pixabay.com/sound-effects/film-special-effects-metrenome-30412/) |
| Music Store | Cassette Recorder | [Cassette Recorder](https://pixabay.com/sound-effects/film-special-effects-tape-player-sounds-90780/) |
| Staff Room | Paper Trays | [paper sound — haunguyendesigner](https://pixabay.com/sound-effects/film-special-effects-paper-sound-262142/) |
| Staff Room | Portable Keyboard | [piano chords — 11325622](https://pixabay.com/sound-effects/musical-piano-chords-239967/) |
| Staff Room | CD Player | [cd player noise — freesound_community](https://pixabay.com/sound-effects/film-special-effects-cd-player-noise-99629/) |
| Staff Room | Staffroom Post | [paper turn — freesound_community](https://pixabay.com/sound-effects/household-paper-turn-40077/) |
| Staff Room | Dictionary | [Book Opening — Soumages](https://pixabay.com/sound-effects/film-special-effects-book-opening-345808/) |
| Staff Room | Door Handle | [doorknob jiggle — freesound_community](https://pixabay.com/sound-effects/household-doorknob-jiggle-43289/) |
| Staff Room | Headphones | [dropping headphones on the desk — strachszydlo](https://pixabay.com/sound-effects/dropping-headphones-on-the-desk-461163/) |
| Backstage | Cue Desk | [breaker switch — freesound_community](https://pixabay.com/sound-effects/film-special-effects-breaker-switch-45684/) |
| Backstage | Sound Desk | [foot switch — milanwulf](https://pixabay.com/sound-effects/film-special-effects-foot-switch-166326/) |
| Backstage | Stage Monitor | [plug in a microphone — freesound_community](https://pixabay.com/sound-effects/film-special-effects-plug-in-a-microphone-45069/) |
| Backstage | A4 Paper | [creasing paper — freesound_community](https://pixabay.com/sound-effects/film-special-effects-creasing-paper-92362/) |
| Backstage | Dictionary | [Book Opening — Soumages](https://pixabay.com/sound-effects/film-special-effects-book-opening-345808/) |
| Backstage | Door Handle | [door rattle — freesound_community](https://pixabay.com/sound-effects/household-door-rattle-86870/) |
| Backstage | Headphones | [jack plug in — freesound_community](https://pixabay.com/sound-effects/film-special-effects-jack-plug-in-38711/) |
| Rehearsal Room | Metronome | [metronome — freesound_community](https://pixabay.com/sound-effects/film-special-effects-metronome-85688/) |
| Rehearsal Room | Audio Recorder | [switch button — freesound_community](https://pixabay.com/sound-effects/film-special-effects-switch-button-106349/) |
| Rehearsal Room | A4 Paper | [paper crinkle — dallonprofe](https://pixabay.com/sound-effects/film-special-effects-paper-crinkle-291786/) |
| Rehearsal Room | Dictionary | [Book Opening — Soumages](https://pixabay.com/sound-effects/film-special-effects-book-opening-345808/) |
| Rehearsal Room | Door Handle | [door locked — freesound_community](https://pixabay.com/sound-effects/household-door-locked-82228/) |
| Rehearsal Room | Headphones | [plug in audio jack — freesound_community](https://pixabay.com/sound-effects/film-special-effects-plug-in-audio-jack-88461/) |
| Rehearsal Room | Music Cabinet | [open the drawer sound — jarasnat](https://pixabay.com/sound-effects/household-open-the-drawer-sound-227896/) |
| Assembly Hall | Upright Piano | [piano single keys close — freesound_community](https://pixabay.com/sound-effects/musical-piano-single-keys-close-79965/) |
| Assembly Hall | PA Column | [quarter inch jack inserting into amplifier clean single push — arunangshubanerjee](https://pixabay.com/sound-effects/film-special-effects-quarter-inch-jack-inserting-into-amplifier-clean-single-push-336618/) |
| Assembly Hall | Concert Programme | [turning page in a book — xpmonster](https://pixabay.com/sound-effects/film-special-effects-turning-page-in-a-book-419580/) |
| Assembly Hall | Dictionary | [Book Opening — Soumages](https://pixabay.com/sound-effects/film-special-effects-book-opening-345808/) |
| Assembly Hall | Door Handle | [trying to open a locked door — freesound_community](https://pixabay.com/sound-effects/household-trying-to-open-a-locked-door-104302/) |
| Assembly Hall | Headphones | [audio jack plug — freesound_community](https://pixabay.com/sound-effects/film-special-effects-audio-jack-plug-75805/) |
| Assembly Hall | Lectern | [Lectern](https://pixabay.com/sound-effects/film-special-effects-stiff-wooden-tap-42877/) |

## Door and result cues

| Use | Source |
| --- | --- |
| Door 1 | [Opening Door by SoundReality](https://pixabay.com/sound-effects/household-opening-door-411632/) |
| Door 2 | [Opening Door by DRAGON-STUDIO](https://pixabay.com/sound-effects/film-special-effects-opening-door-450444/) |
| Door 3 | [Door Opening by DRAGON-STUDIO](https://pixabay.com/sound-effects/door-opening-454242/) |
| Door 4 | [DoorOpened by lennyboy](https://pixabay.com/sound-effects/household-dooropened-103851/) |
| Door 5 | [Door Opening by Fletchpike](https://pixabay.com/sound-effects/household-door-opening-353874/) |
| Door 6 | [Open Door Stock SFX by DRAGON-STUDIO](https://pixabay.com/sound-effects/open-door-stock-sfx-454246/) |
| Code dial turn | [Combination Lock Sounds by jzielke011](https://pixabay.com/sound-effects/film-special-effects-combination-lock-sounds-22298/) |
| Incorrect code | [Wrong Buzzer by KevinVG207](https://pixabay.com/sound-effects/film-special-effects-wrong-buzzer-6268/) |
| Game Over | Wah Wah Sad Trombone by freesound_community, Pixabay recording 6347; user-supplied `freesound_community-wah-wah-sad-trombone-6347.mp3`, used as `game-over-trombone.mp3`. |
| Room cleared | [Level Complete by Universfield](https://pixabay.com/sound-effects/film-special-effects-level-complete-143022/) |
| Final escape | [Victory Fanfare by Universfield](https://pixabay.com/sound-effects/musical-victory-fanfare-152480/) |

## Weather ambience

`rain-thunder.mp3`: [Rain and Thunder #2](https://bigsoundbank.com/rain-and-storm-2-s0740.html), Joseph SARDIN / BigSoundBank, CC0. Continuous weather on its own sound channel.
