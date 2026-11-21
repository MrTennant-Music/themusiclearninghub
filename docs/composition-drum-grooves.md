# Composition Studio drum randomiser

The library contains 126 distinct starting grooves: 78 in 4/4, 24 in 3/4 and
24 in 6/8. These are independently authored educational drum-kit adaptations,
not downloaded commercial MIDI loops or exact transcriptions of recordings.
The expanded bank adds rock, punk, metal, indie, pop, country, soul, Motown,
R&B, funk, disco, house, techno, hip-hop, trap, drum-and-bass, jungle, garage,
reggae, ska and Latin/Caribbean/Afrobeat-inspired kit patterns. Triple and
compound metres have their own banks rather than truncated 4/4 patterns.

Research references (29 October 2026):
- Rich Redmond / Drumeo, Must-Know Drum Grooves: the broad groove vocabulary
  includes Motown, Latin, Calypso/Soca, punk and other core band styles.
  https://www.drumeo.com/must-know-grooves
- Aaron Edgar / Drumeo, 10 Fun Intermediate Drum Beats: displaced kicks,
  upbeat ideas, sixteenths, bossa nova and linear figures.
  https://www.drumeo.com/beat/intermediate-drum-beats/
- LANDR, Drum Programming: 17 Essential Electronic Drum Patterns:
  house variants, offbeat hats and broken electronic rhythms.
  https://blog.landr.com/drum-programming/

All patterns use only the ten visible kit parts. Latin and other percussion-led
styles are explicitly kit adaptations; unavailable congas, claves, claps, rim
and ride-bell sounds have not been added. The acoustic samples remain the same.

Hit positions are quarter-note beats. 3/4 and 6/8 both span three quarter-note
beats, but 6/8 patterns emphasise dotted-quarter pulses at 0 and 1.5. Positions
snap to the pupil's selected subdivision; finer details merge on coarse grids.
Fourteen patterns alternate related bars when at least two bars are selected.
Existing phrase-opening crashes, small dynamic changes and optional phrase-end
fills remain in use.

Each metre has a shuffle bag in the drum view. Every groove is used once before
a new shuffled cycle, with no immediate repeat at the cycle boundary. Groove
selection does not change the selected kit, bar count, subdivision or track mix.

Regression checks protect counts, unique hit patterns, available kit parts,
metre bounds, shuffle coverage and alternating bars.
