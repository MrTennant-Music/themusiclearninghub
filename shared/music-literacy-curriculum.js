/* Curriculum rows and activity links shared by the homepage and Concept Collections. */
(function (root) {
  const headings = ["Melody / Harmony", "Rhythm / Tempo", "Texture / Structure / Form", "Dynamics / Timbre"];
  const rows = [
  ["National 3", ["<a class=\"concept-link\" href=\"noteidentification.html?level=N3\">Lines and spaces of the treble clef</a><br><br><a class=\"concept-link\" href=\"melodicdictation.html?level=N3\">Steps</a><br><br><a class=\"concept-link\" href=\"melodicdictation.html?level=N3\">Repetition</a>", "<a class=\"concept-link\" href=\"rhythmidentification.html?level=N3\">Crotchet</a><br><br><a class=\"concept-link\" href=\"rhythmidentification.html?level=N3\">Minim</a><br><br><a class=\"concept-link\" href=\"rhythmidentification.html?level=N3\">Dotted minim</a><br><br><a class=\"concept-link\" href=\"rhythmidentification.html?level=N3\">Semibreve</a><br><br><a class=\"concept-link\" href=\"barlines.html?level=N3\">Barlines</a><br><br><a class=\"concept-link\" href=\"barlines.html?level=N3\">Double barlines</a>", "Not applicable", "<a class=\"concept-link\" href=\"dynamics.html?level=N3\"><i>f</i> — forte</a><br><br><a class=\"concept-link\" href=\"dynamics.html?level=N3\"><i>p</i> — piano</a><br><br><a class=\"concept-link\" href=\"dynamics.html?level=N3\"><i>&lt; cresc.</i> — crescendo</a><br><br><a class=\"concept-link\" href=\"dynamics.html?level=N3\"><i>&gt; dim.</i> — diminuendo</a>"]],
  ["National 4", ["<a class=\"concept-link\" href=\"noteidentification.html?level=N4\">Treble clef stave</a><br><br><a class=\"concept-link\" href=\"noteidentification.html?level=N4\">C–A’ — range of notes from middle C to first ledger line A</a><br><br><a class=\"concept-link\" href=\"melodicdictation.html?level=N4\">Sequences</a>", "<a class=\"concept-link\" href=\"rhythmidentification.html?level=N4\">Quaver</a><br><br><a class=\"concept-link\" href=\"rhythmidentification.html?level=N4\">Semiquaver</a><br><br><a class=\"concept-link\" href=\"timesignatures.html?level=N4\">Grouped semiquavers</a><br><br><a class=\"concept-link\" href=\"timesignatures.html?level=N4\">Paired quavers</a><br><br><a class=\"concept-link\" href=\"repeatsigns.html?level=N4\">Repeat signs</a>", "Not applicable", "<a class=\"concept-link\" href=\"dynamics.html?level=N4\"><i>mf</i> — mezzo forte</a><br><br><a class=\"concept-link\" href=\"dynamics.html?level=N4\"><i>mp</i> — mezzo piano</a>"]],
  ["National 5", ["<a class=\"concept-link\" href=\"accidentals.html?level=N5\">Tones, semitones, accidentals — flats, sharps and naturals</a><br><br><a class=\"concept-link\" href=\"keysignatures.html?level=N5\">Scales and key signatures — C major, G major, F major, A minor</a><br><br><a class=\"concept-link\" href=\"chords.html?level=N5\">Chords — C major, G major, F major and A minor</a><br><br><a class=\"concept-link\" href=\"intervals.html?level=N5\">Leaps</a>", "<a class=\"concept-link\" href=\"rhythmicdictation.html?level=N5\">Dotted rhythms</a><br><br><a class=\"concept-link\" href=\"rhythmicdictation.html?level=N5\">Dotted crotchet</a><br><br><a class=\"concept-link\" href=\"rhythmicdictation.html?level=N5\">Dotted quaver</a><br><br><a class=\"concept-link\" href=\"rhythmicdictation.html?level=N5\">Scotch snap</a><br><br><a class=\"concept-link\" href=\"repeatsigns.html?level=N5\">1st and 2nd time bars</a>", "Not applicable", "<a class=\"concept-link\" href=\"dynamics.html?level=N5\"><i>ff</i> — fortissimo</a><br><br><a class=\"concept-link\" href=\"dynamics.html?level=N5\"><i>pp</i> — pianissimo</a><br><br><a class=\"concept-link\" href=\"dynamics.html?level=N5\"><i>sfz</i> — sforzando</a>"]],
  ["Higher", ["<a class=\"concept-link\" href=\"noteidentification.html?level=H\">Bass clef — E–C — range of notes from E below the stave to middle C</a><br><br><a class=\"concept-link\" href=\"transposing.html?level=H\">Transposing from treble clef down one octave into bass clef</a><br><br><a class=\"concept-link\" href=\"chords.html?level=H\">Identifying chords I, IV, V and VI in major and minor keys in treble and bass clefs</a><br><br><a class=\"concept-link\" href=\"keysignatures.html?level=H\">Identifying tonic, subdominant and dominant notes in the keys of C, G and F major and A minor</a><br><br><a class=\"concept-link\" href=\"intervals.html?level=H\">Naming diatonic intervals: 2nd, 3rd, 4th, 5th, 6th, 7th, octave</a><br><br><a class=\"concept-link\" href=\"intervals.html?level=H\">Writing diatonic intervals above a given note in treble clef</a>", "<a class=\"concept-link\" href=\"timesignatures.html?level=H\">Quavers, crotchets, dotted crotchets and dotted minims within 6/8, 9/8 and 12/8 time</a><br><br><a class=\"concept-link\" href=\"triplets.html?level=H\">Triplet quavers, triplet crotchets</a><br><br><a class=\"concept-link\" href=\"rests.html?level=H\">Rests — quaver, crotchet, dotted crotchet, minim, semibreve, whole bar</a><br><br><a class=\"concept-link\" href=\"repeatsigns.html?level=H\">Da capo (D.C.)</a>", "<a class=\"concept-link\" href=\"articulationmarkings.html?level=H\">Phrase mark</a>", "<a class=\"concept-link\" href=\"articulationmarkings.html?level=H\">Accents ( &gt; )</a><br><br><a class=\"concept-link\" href=\"articulationmarkings.html?level=H\">Slurs</a><br><br><a class=\"concept-link\" href=\"articulationmarkings.html?level=H\">Staccato ( . )</a>"]],
  ["Advanced Higher", ["<a class=\"concept-link\" href=\"noteidentification.html?level=AH\">Bass clef C–E two ledger lines below stave to two ledger lines above</a><br><br><a class=\"concept-link\" href=\"transposing.html?level=AH\">Transposing from bass clef one octave higher into treble clef</a><br><br><a class=\"concept-link\" href=\"transposing.html?level=AH\">Rewriting (in either treble or bass clef) a note at the same pitch using up to two ledger lines below or above the stave</a><br><br><a class=\"concept-link\" href=\"accidentals.html?level=AH\">Enharmonic equivalent — rewriting a note at the same pitch</a><br><br><a class=\"concept-link\" href=\"keysignatures.html?level=AH\">Scales and key signatures — D major, B flat major, E minor and D minor</a><br><br><a class=\"concept-link\" href=\"chords.html?level=AH\">1st and 2nd inversions of major and minor triads in the keys of C, G, F, D and B flat major and A, E and D minor</a><br><br><a class=\"concept-link\" href=\"chords.html?level=AH\">Chord II and its 1st inversion (major keys as listed above)</a><br><br><a class=\"concept-link\" href=\"chords.html?level=AH\">Identifying chords at cadence points and under melodies</a><br><br><a class=\"concept-link\" href=\"chords.html?level=AH\">Inserting chords at cadence points</a><br><br><a class=\"concept-link\" href=\"chords.html?level=AH\">Creating a bass line using chord information provided</a><br><br><a class=\"concept-link\" href=\"chords.html?level=AH\">Diminished 7th</a><br><br><a class=\"concept-link\" href=\"chords.html?level=AH\">Dominant 7th</a><br><br><a class=\"concept-link\" href=\"chords.html?level=AH\">Added 6th</a><br><br><a class=\"concept-link\" href=\"chords.html?level=AH\">Augmented triad</a><br><br><a class=\"concept-link\" href=\"intervals.html?level=AH\">Tritone</a><br><br><a class=\"concept-link\" href=\"intervals.html?level=AH\">Augmented 4th</a><br><br><a class=\"concept-link\" href=\"intervals.html?level=AH\">Diminished 5th</a><br><br><a class=\"concept-link\" href=\"transposing.html?level=AH\">8va (octave higher); 8vb (octave lower)</a>", "<a class=\"concept-link\" href=\"rhythmicdictation.html?level=AH\">Ties</a><br><br><a class=\"concept-link\" href=\"rhythmicdictation.html?level=AH\">Syncopated rhythms</a><br><br><a class=\"concept-link\" href=\"timesignatures.html?level=AH\">Time signature: 5/4</a><br><br><a class=\"concept-link\" href=\"timesignatures.html?level=AH\">Time changes</a><br><br><a class=\"concept-link\" href=\"repeatsigns.html?level=AH\">Dal segno (D.S.)</a><br><br><a class=\"concept-link\" href=\"repeatsigns.html?level=AH\">Fine</a>", "No additional texture / structure / form concepts are introduced at Advanced Higher.", "No additional dynamics / timbre concepts are introduced at Advanced Higher."]]
];
  const diatonicIntervals = ["Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Octave"];
  const clefAndOctaveTerms = ["Treble clef", "Bass clef", "Octave"];
  const cadenceTerms = ["Chord", "Tonic", "Subdominant", "Dominant"];
  // Match curriculum entries to playable terms at their own level where possible.
  const groupedTerms = {
    "Lines and spaces of the treble clef": ["Treble clef", "Stave"],
    "Steps": ["Step"],
    "Barlines": ["Barline"],
    "Double barlines": ["Double barline"],
    "f — forte": ["Forte"],
    "p — piano": ["Piano"],
    "< cresc. — crescendo": ["Crescendo"],
    "> dim. — diminuendo": ["Diminuendo"],
    "C–A’ — range of notes from middle C to first ledger line A": ["Ledger line"],
    "Sequences": ["Sequence"],
    "Repeat signs": ["Repeat sign"],
    "mf — mezzo forte": ["Mezzo forte"],
    "mp — mezzo piano": ["Mezzo piano"],
    "Tones, semitones, accidentals — flats, sharps and naturals": ["Tone", "Semitone", "Flat", "Sharp", "Natural"],
    "Scales and key signatures — C major, G major, F major, A minor": ["C major", "G major", "F major", "A minor"],
    "Chords — C major, G major, F major and A minor": ["Chord"],
    "Leaps": ["Leap"],
    "Dotted rhythms": ["Dotted crotchet", "Dotted quaver"],
    "1st and 2nd time bars": ["First time bar", "Second time bar"],
    "ff — fortissimo": ["Fortissimo"],
    "pp — pianissimo": ["Pianissimo"],
    "sfz — sforzando": ["Sforzando"],
    "Bass clef — E–C — range of notes from E below the stave to middle C": ["Bass clef"],
    "Identifying tonic, subdominant and dominant notes in the keys of C, G and F major and A minor": ["Tonic", "Subdominant", "Dominant"],
    "Naming diatonic intervals: 2nd, 3rd, 4th, 5th, 6th, 7th, octave": diatonicIntervals,
    "Writing diatonic intervals above a given note in treble clef": diatonicIntervals,
    "Quavers, crotchets, dotted crotchets and dotted minims within 6/8, 9/8 and 12/8 time": ["Compound time"],
    "Triplet quavers, triplet crotchets": ["Triplet"],
    "Rests — quaver, crotchet, dotted crotchet, minim, semibreve, whole bar": ["Quaver rest", "Crotchet rest", "Dotted crotchet rest", "Minim rest", "Semibreve rest", "Whole bar rest"],
    "Da capo (D.C.)": ["Da capo"],
    "Accents ( > )": ["Accent"],
    "Slurs": ["Slur"],
    "Staccato ( . )": ["Staccato"],
    "Enharmonic equivalent — rewriting a note at the same pitch": ["Enharmonic equivalent"],
    "Scales and key signatures — D major, B flat major, E minor and D minor": ["D major", "B flat major", "E minor", "D minor"],
    "1st and 2nd inversions of major and minor triads in the keys of C, G, F, D and B flat major and A, E and D minor": ["First inversion", "Second inversion"],
    "Diminished 7th": ["Diminished seventh"],
    "Dominant 7th": ["Dominant seventh"],
    "Added 6th": ["Added sixth"],
    "Augmented 4th": ["Augmented fourth"],
    "Diminished 5th": ["Diminished fifth"],
    "Ties": ["Tie"],
    "Syncopated rhythms": ["Syncopation"],
    "Dal segno (D.S.)": ["Dal segno"],
  };
  // These topics share existing vocabulary across levels.
  const relatedTerms = {
    "Treble clef stave": ["Treble clef", "Stave"],
    "Transposing from treble clef down one octave into bass clef": clefAndOctaveTerms,
    "Identifying chords I, IV, V and VI in major and minor keys in treble and bass clefs": ["Chord", "Root position"],
    "Bass clef C–E two ledger lines below stave to two ledger lines above": ["Bass clef", "Ledger line"],
    "Transposing from bass clef one octave higher into treble clef": clefAndOctaveTerms,
    "Rewriting (in either treble or bass clef) a note at the same pitch using up to two ledger lines below or above the stave": ["Treble clef", "Bass clef", "Ledger line"],
    "Chord II and its 1st inversion (major keys as listed above)": ["Chord", "First inversion"],
    "Identifying chords at cadence points and under melodies": cadenceTerms,
    "Inserting chords at cadence points": cadenceTerms,
    "Creating a bass line using chord information provided": ["Chord", "Root position", "First inversion", "Second inversion"],
    "8va (octave higher); 8vb (octave lower)": ["Octave"],
    "Time signature: 5/4": ["Time signature"],
  };
  function termsForEntry(label, level, concepts) {
    const usesOtherLevels = Object.hasOwn(relatedTerms, label);
    const terms = usesOtherLevels ? relatedTerms[label] : Object.hasOwn(groupedTerms, label) ? groupedTerms[label] : [label];
    const names = new Set(terms.map(name => name.toLowerCase()));
    return concepts.filter(concept => (usesOtherLevels || concept.level === level) && names.has(concept.name.toLowerCase()));
  }
  const entries = content => content.startsWith("<a ") ? content.split("<br><br>") : [];
  const entryMarkup = entry => entry.replace(/^<a\b[^>]*>|<\/a>$/g, "");
  const curriculum = { headings, rows, termsForEntry, entries, entryMarkup };
  if (typeof module === "object" && module.exports) module.exports = curriculum;
  else root.MLHMusicLiteracyCurriculum = curriculum;
})(globalThis);
