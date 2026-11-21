# Composition Studio progression library

## What Randomise selects

The Studio is fixed at four bars. Randomise draws from the complete 200-entry four-bar source pool for the selected major/minor mode, including suspended and extended chords.

Loops are rotated to start on a tonic-root chord where available. If a loop has no tonic chord, its first chord is replaced with the tonic. Identical resulting loops are deduplicated. Minor-key dominant triads and sevenths use harmonic V and V7.

Randomise transposes the pool into the selected key, shuffles without repetition, and avoids repeating the displayed progression at a bag boundary. Undo/Redo still applies. Accompaniment controls rhythm independently.

## Research and attribution

- [McGill Billboard Project 2.0](https://ddmal.ca/research/The_McGill_Billboard_Project_(Chord_Analysis_Dataset)/), published by DDMAL, McGill University. The annotations are CC0. Citation: John Ashley Burgoyne, Jonathan Wild and Ichiro Fujinaga, “An Expert Ground Truth Set for Audio Chord Recognition and Music Analysis”, ISMIR 2011, pp. 633–638. Its published corpus covers 740 distinct chart songs; only an audited subset supplies this bank.
- [Four-Chord Schemas, Open Music Theory](https://viva.pressbooks.pub/openmusictheorycopy/chapter/4-chord-schemas/), Megan Lavengood and Bryn Hughes: doo-wop, singer-songwriter, hopscotch, rotations and predominant substitution.
- [Diatonic Sequences in Middles, Open Music Theory](https://viva.pressbooks.pub/openmusictheory/chapter/diatonic-sequences/), John Peterson: descending fifths and descending thirds.
- [Substitutions, Open Music Theory](https://viva.pressbooks.pub/openmusictheory/chapter/substitutions/): jazz turnarounds and fifth-related harmony. This bank uses only the key-compatible diatonic versions, not chromatic substitute dominants.
- [Harmony in pop/rock music, Open Music Theory](https://openmusictheory.github.io/popRockHarmony.html): recurring schemas and plagal movement.
- [Circle of Fifths, Music Theory for the 21st-Century Classroom](https://musictheory.pugetsound.edu/mt21c/CircleOfFifths.html), Robert Hutchinson: cross-style use of fifth-related sequences.

Chord degree patterns for the educational entries were independently encoded. No scores, lyrics or recordings are included. References identify the harmonic family; the generated whole-bar versions are teaching adaptations, not claims to reproduce a particular recording.

## Source audit and musical boundaries

`composition-progressions.js` contains each entry's source ID, title, artist, original tonic, starting source line/bar and source SHA-256. It also records any relative-key reinterpretation. For educational schemas it records the reference URL and adaptation.

The reproducible importer is `scripts/composition/build-progression-library.py`. It:

1. Reads the original annotated tonic, metre, complete bars, held chords and explicit phrase repetition.
2. Accepts only bars with exactly one supported harmony. Multi-chord bars, inversions, unknown chords, silence, metre-change bars and incomplete annotations break a candidate run. They are never flattened by choosing the first chord.
3. Extracts contiguous 4-, 8- and 16-bar windows. It rejects runs crossing a tonic or metre change, requires at least three distinct roots, and requires the destination tonic to occur.
4. Checks **every chord tone** against the major or natural-minor collection. The original chord qualities are preserved. Where a relative-major/minor reinterpretation is used, the entire source phrase is recentered without changing any of its pitches or chord qualities; this is explicitly recorded, not presented as the original analyst's key designation.
5. Deduplicates by the complete degree-and-quality sequence. A transposition, alternate song title or duplicate chart appearance cannot create an extra choice. Common sequences found in more distinct songs are prioritised, with per-artist limits to broaden coverage.
6. Includes independently specified common schemas, then fills each pool to precisely 200 from the corpus.

Because the Studio previously required key-compatible randomisation, borrowed chords, blues dominant-tonic sevenths and raised-leading-note minor dominants are deliberately excluded when their notes fall outside the chosen scale. Thus a minor teaching adaptation may use v rather than the V of a literal Andalusian cadence. Accompaniment style controls rhythm separately; selecting a progression does not claim to recreate the rhythm or voicing of its source song.

For legacy saved sessions using other modes, major-bank degree patterns are adapted to that mode, with incompatible chord qualities replaced by the appropriate diatonic triad/seventh. Such modal adaptations are not counted as additional researched progressions.

## Rebuild and verify

Download `billboard-2.0-salami_chords.tar.xz` through the dataset page, extract it outside the repository, and run:

```
python3 scripts/composition/build-progression-library.py /path/to/McGill-Billboard
node --test tests/composition-progressions.test.js
```

Tests check all 1,200 entries, independent per-length uniqueness, source records, artist breadth, every chord in all 24 major/minor keys, shuffle exhaustion, boundary repeats and independent selection contexts. Existing composition tests protect playback, bass, MIDI, Undo-related state and UI rendering. The fixed desktop-layout audit also remains required when the HTML loader changes.
