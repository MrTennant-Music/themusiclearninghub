# QR settings maintenance

Activity/tool profiles share explicit current settings. Receivers restore those values during initial state creation, before generating their first exercise, without needing to open Customise. The shared snapshot is tied to its activity. Old menu-based profile links remain supported. Changing settings after opening a shared profile produces a new snapshot of the current values.

Only the named configuration fields below are included. Answers, scores, elapsed/running attempts, pupil rosters and saved name lists are excluded. Timer labels, durations, modes and alarm choices are shared as stopped timer setups.

| Activity source | Shared configuration |
| --- | --- |
| `accidentals.html` | enabledAccidentals, enabledQuestionTypes, showNoteNames |
| `articulationmarkings.html` | enabledMarkings, enabledTypes, tempo, metronomeEnabled, followPlayback |
| `auralrecognition.html` | activeTopic, enabled, exerciseTempo, scalesTempo, chordsTempo, manualListeningTempo, metronome, ornamentPassage, scalesPassage, chordPassage |
| `barlines.html` | enabledRhythms, restsEnabled, showRhythmGuide |
| `cadences.html` | enabled, tempo, metronome, follow |
| `chords.html` | tempo, metronomeOn, showNoteNames, showScaleDegrees, n5Customise, ahCustomise, highlightPlayback |
| `rhythmicdictation.html` | followPlayback, tempo, metronomeOn, syncopationOn, enabledQuestionTypes |
| `dynamics.html` | enabledTypes, enabledDynamics, tempo, metronomeEnabled, followPlayback |
| `enharmonicequivalents.html` | options, showNoteNames |
| `intervals.html` | enabledModes, showHelp |
| `keyboardnoteidentification.html` | showC, options |
| `keysignatures.html` | modes |
| `melodicdictation.html` | tempo, metronomeOn, followPlayback |
| `noteidentification.html` | settings, showNoteNames |
| `readingrhythms.html` | enabledRhythms, enabledTimeSignatures, restsEnabled, tiesEnabled, tempo |
| `repeatsigns.html` | enabledQuestionTypes, tempo, metronomeEnabled, followPlayback |
| `rests.html` | enabledOptions, showRhythmGuide |
| `rhythmidentification.html` | enabledRhythms, enabledCardTypes |
| `rhythmsums.html` | settings, showRhythmGuide |
| `tempo.html` | enabled, metronome, follow |
| `timesignatures.html` | enabledRhythms, restsEnabled, showRhythmGuide |
| `scaledegrees.html` | questionTypeOptions, revealKey, showScaleDegrees |
| `transposing.html` | wholeBarMode, questionOptions, noteNamesVisible |
| `practicequestions.html` | tempo, metronomeOn, followPlayback, enabledQuestionTypes, limitPlays, timerEnabled |
| `followthescore.html` | tempo, metronomeOn, followPlayback, enabledQuestionTypes, showFollowNoteNames, limitPlays, timerEnabled |
| `metronome.html` | config |
| `chromatic-tuner.js` | instrument |
| `classroom-timer.jsx` | options, timerSetup (label, duration, mode, sound, alarm mode) |
| `namerandomiser.html` | soundEffects, randomiserMethod |
| `familyfortunes/familyfortunes.js` | options, selectedQuestionIds, customCategories, roundOverrides |
| `whowantstobemillionaire/millionaire.js` | settings |

## Recent standalone games

- **Crosswords, Word Search and Concept Sort:** QR links include the selected level, collection, exact puzzle concepts, sound setting and Include Levels Below. Lower-level inclusion and sound remain selected for the next generated puzzle. Explicit QR sound settings take priority over the receiving browser's saved preference.
- **Connections:** QR links retain the board, level, sound and selected Music Concepts or Music Literacy collection; the next generated board stays in that collection.
- **Pitched:** QR profiles include the currently selected Score Mode or Endurance Mode, restored before the game is created.
- **Millionaire:** the complete current settings object includes level, Music Literacy, Music Concepts, Audio Questions, Non-Audio Questions, timer and audio preferences. A shared profile starts a fresh game.

## Other QR routes

- **Concept Recall:** retains its dedicated level, hints and category snapshot; browser round-trip passed.
- **Music Dictionary:** its URL already carries level, search, Show All and frequency filters. Fixed restoration of the selected frequency-exam setting. Browser round-trip passed.
- **Digital Question Papers:** the QR shares the selected paper, which identifies level and year. The recipient chooses Practice or Exam Mode and starts a fresh attempt; answers and exam progress are not shared.
- **Triplets:** fixed Higher activity with no Customise settings; browser QR route check passed.
- **Homepage:** QR opens the Hub catalogue; it is not an activity setup.
- **Keyboard classroom:** join QR codes identify the live session, whose game settings remain with the host. No new live classroom sessions were created for this audit.
- **Worksheets:** activity-generated exercise QR URLs receive the same explicit current profile URL through the shared header. Worksheet/editor headers that deliberately disable QR sharing remain disabled.

Locally authored Millionaire question sets and pupil/team rosters are separate from the profile settings listed above; this audit does not claim that those local libraries or rosters transfer with a profile QR.


Use the profile settings tables above when adding or changing settings. Run the relevant QR destination, profile restoration and sharing tests after changes. Browser navigation does not verify physical QR scanning on classroom tablets.
