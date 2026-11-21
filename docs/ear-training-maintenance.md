# Advanced Higher Ear Training maintenance notes

Implemented 5 November 2026. These describe the intended behaviour; verify against current code before making further changes.


- All four melodic-device answers now use eight bars in context. Literal repetition, sequence, inversion and retrograde are protected by tests.
- Modulation correction includes the source, preparation and destination with melody. Suspension correction follows the actual selected preparation and resolution.
- Isolated AH chords schedule four metronome clicks when enabled, with one completion callback.
- Pedal/vamp melodies use phrase-wide register planning, preserving pitch classes and keeping inverted pedals above the updated melody. Interval targets and octave resolutions remain locked during register planning. The post-fix pedal/vamp sample had a maximum successive interval of eight semitones.
- AH chords have four lead-in progressions; ornaments reuse the varied cadence lead-in writer in their native key and metre.
- Suspension examples vary between prepared 4–3, 7–6 and 9–8 types and varied first-example positions, followed by a clear final dominant suspension. The 7–6 type resolves above a genuine dominant bass, with upper voices placed above that bass. Negative questions resolve immediately.
- AH time changes cover fourteen routes including compound and irregular metres. Each bar has its own pulse grouping, cumulative start and duration; the crotchet clock remains constant.
- Polytonality uses eleven major-key pairs with matched metre and safe registers. AH modal questions include Dorian and Mixolydian, each with characteristic pitches and mode-consistent harmony.

Validation: all 134 tests passed, including seven new regression tests covering these changes. A fresh 4,500-question sample had zero checked timing, pitch-range, bar-total, accompaniment-floor or answer-choice failures. Desktop-layout audit passed. The local browser loaded the new build; isolated chord playback with Metronome enabled completed without console warnings/errors, score stayed at 5/5, original context/metronome settings were restored and the AH chooser was left open. This remains a data and playback audit rather than a human aural assessment.
