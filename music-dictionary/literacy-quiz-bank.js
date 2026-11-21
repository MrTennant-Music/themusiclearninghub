/* One original multiple-choice question per Music Literacy Dictionary entry. */
(function (root) {
  'use strict';

  const questionsByConcept = {
    'treble-lines': ['Which notes are in the spaces of the treble stave, from bottom to top?', 'F, A, C, E', 'E, G, B, D', 'A, C, E, G', 'G, B, D, F'],
    steps: ['Which pair of notes moves by step?', 'C to D', 'C to E', 'C to F', 'C to G'],
    repetition: ['A melody plays G–A–G and immediately plays G–A–G again. What is this?', 'Repetition', 'Sequence', 'Inversion', 'Retrograde'],
    crotchet: ['How many beats does the note shown last when a crotchet is one beat?', 'One beat', 'Half a beat', 'Two beats', 'Four beats', 'A filled notehead with a stem and no flag.'],
    minim: ['How many beats does the note shown last when a crotchet is one beat?', 'Two beats', 'One beat', 'Three beats', 'Four beats', 'An open notehead with a stem.'],
    'dotted-minim': ['How many crotchet beats does the note shown last?', 'Three beats', 'Two beats', 'Two and a half beats', 'Four beats', 'An open notehead with a stem and a dot to its right.'],
    semibreve: ['How many crotchet beats does the note shown last?', 'Four beats', 'Two beats', 'Three beats', 'Six beats', 'An open oval notehead with no stem.'],
    barlines: ['What does a single barline do in a score?', 'Separates one bar from the next', 'Raises the next note by a semitone', 'Shows the end of a tied note', 'Gives the next note an accent'],
    'double-barlines': ['What does this thin-and-thick barline usually show?', 'The end of the piece', 'The start of a repeat', 'A change to a higher pitch', 'A pause on the last note', 'Two adjacent vertical lines, thin on the left and thick on the right.'],
    forte: ['How should you play a passage marked f?', 'Loudly', 'Quietly', 'Gradually louder', 'With a sudden accent on each note'],
    piano: ['How should you play a passage marked p?', 'Quietly', 'Loudly', 'Gradually quieter', 'With the notes separated'],
    crescendo: ['What does cresc. tell a performer to do?', 'Gradually play louder', 'Gradually play quieter', 'Immediately play loudly', 'Gradually play faster'],
    diminuendo: ['What does dim. tell a performer to do?', 'Gradually play quieter', 'Gradually play louder', 'Immediately play quietly', 'Gradually play slower'],
    'treble-stave': ['How many lines are on a standard treble stave?', 'Five', 'Four', 'Six', 'Seven'],
    'middle-c-to-ledger-a': ['Which note sits on the first ledger line above the treble stave?', 'A', 'G', 'B', 'C'],
    sequences: ['Which three notes continue C–D–E as the same pattern starting a step higher?', 'D–E–F', 'D–F–E', 'D–C–B', 'C–D–E'],
    quaver: ['What fraction of a crotchet beat does the note shown last?', 'One half', 'One quarter', 'Three quarters', 'One whole', 'A filled notehead with a stem and one flag.'],
    semiquaver: ['What fraction of a crotchet beat does the note shown last?', 'One quarter', 'One half', 'Three quarters', 'One whole', 'A filled notehead with a stem and two flags.'],
    'grouped-semiquavers': ['How many crotchet beats do these four notes fill altogether?', 'One beat', 'Half a beat', 'Two beats', 'Four beats', 'Four filled noteheads whose stems share two beams.'],
    'paired-quavers': ['How many crotchet beats do these two notes fill altogether?', 'One beat', 'Half a beat', 'One and a half beats', 'Two beats', 'Two filled noteheads whose stems share a single beam.'],
    'repeat-signs': ['When you reach an end repeat sign for the first time, where do you go if an opening repeat sign is present?', 'Back to the opening repeat sign', 'Back to the beginning of the entire piece', 'Straight to the next bar', 'Straight to the ending'],
    'mezzo-forte': ['What does mf mean?', 'Moderately loud', 'Moderately quiet', 'Very loud', 'Gradually louder'],
    'mezzo-piano': ['What does mp mean?', 'Moderately quiet', 'Moderately loud', 'Very quiet', 'Gradually quieter'],
    'tones-semitones-accidentals': ['Which sign cancels a preceding F sharp and restores F natural in the same bar?', 'A natural', 'A flat', 'A sharp', 'A double flat'],
    'scales-key-signatures-n5': ['Which accidental is in the key signature of G major?', 'F sharp', 'C sharp', 'B flat', 'E flat'],
    'chords-n5': ['Which three notes make up the A minor triad?', 'A, C, E', 'A, C sharp, E', 'A, C, F', 'A, D, E'],
    leaps: ['Which pair of notes moves by leap?', 'C to G', 'C to D', 'E to F', 'A to B'],
    'dotted-rhythms': ['What does a dot immediately to the right of a notehead do to its duration?', 'Adds half of its original value', 'Adds a whole beat in every case', 'Doubles its original value', 'Halves its original value'],
    'dotted-crotchet': ['How many crotchet beats does the note shown last?', 'One and a half beats', 'One beat', 'Three quarters of a beat', 'Two beats', 'A filled notehead with a stem, no flag and a dot to its right.'],
    'dotted-quaver': ['How much of a crotchet beat does the note shown last?', 'Three quarters of a beat', 'One quarter of a beat', 'Half a beat', 'One and a half beats', 'A filled notehead with a stem, one flag and a dot to its right.'],
    'scotch-snap': ['Which two note values make a Scotch snap?', 'A semiquaver followed by a dotted quaver', 'A dotted quaver followed by a semiquaver', 'Two quavers', 'A quaver followed by a dotted quaver'],
    'first-second-time-bars': ['After taking the first-time ending and repeating the passage, which ending do you take on the second pass?', 'The second-time ending', 'The first-time ending again', 'Both endings in order', 'Neither ending'],
    fortissimo: ['What does ff mean?', 'Very loud', 'Moderately loud', 'Very quiet', 'Gradually louder'],
    pianissimo: ['What does pp mean?', 'Very quiet', 'Moderately quiet', 'Very loud', 'Gradually quieter'],
    sforzando: ['What does sfz tell a performer to do?', 'Give a sudden strong accent', 'Gradually increase the volume', 'Play the entire passage very loudly', 'Play the notes short and detached'],
    'bass-clef-e-to-c': ['Which note sits on the first ledger line below the bass stave?', 'E', 'F', 'C', 'G'],
    'treble-down-octave-bass': ['Middle C is written in treble clef. What pitch should be written in bass clef to transpose it down one octave?', 'The C below middle C', 'Middle C', 'The C above middle C', 'The G below middle C'],
    'chords-i-iv-v-vi': ['Which Roman numeral names the chord F–A–C in C major?', 'IV', 'I', 'V', 'vi'],
    'tonic-subdominant-dominant': ['Which note is the dominant of F major?', 'C', 'F', 'B flat', 'E'],
    'naming-diatonic-intervals': ['What is the interval from C up to A in the same octave?', 'A sixth', 'A fifth', 'A seventh', 'An octave'],
    'writing-diatonic-intervals': ['Which note should you write a diatonic third above D in C major?', 'F', 'E', 'G', 'A'],
    'compound-time': ['Which note value normally receives one main beat in 9/8 time?', 'Dotted crotchet', 'Crotchet', 'Quaver', 'Dotted minim'],
    triplets: ['How many crotchet beats do three triplet quavers fill?', 'One beat', 'Half a beat', 'One and a half beats', 'Two beats'],
    rests: ['How long does a whole-bar rest last in 3/4 time?', 'Three crotchet beats', 'One crotchet beat', 'Two crotchet beats', 'Four crotchet beats'],
    'da-capo': ['What does D.C. tell a performer to do?', 'Return to the beginning', 'Return to the segno', 'Jump to the coda', 'Stop immediately'],
    'phrase-mark': ['What does a phrase mark show?', 'Which notes belong to one musical phrase', 'Which pitches must be joined into one longer note', 'Where the key signature changes', 'Where the bar must be repeated'],
    accents: ['What does an accent sign (>) on a single note tell you to do?', 'Give that note extra emphasis', 'Get quieter over the next few bars', 'Play that note an octave higher', 'Join it to the next note without rearticulating'],
    slurs: ['How should you play a group of different pitches under a slur?', 'Smoothly connected', 'Short and separated', 'As one sustained pitch', 'With a strong accent on every note'],
    staccato: ['What does a staccato dot above or below a note tell you to do?', 'Play the note short and detached', 'Add half to the note’s value', 'Give the note extra emphasis', 'Hold the note longer than written'],
    'bass-clef-ledger-range': ['Which note is on the second ledger line above the bass stave?', 'E', 'C', 'D', 'F'],
    'bass-up-octave-treble': ['Middle C is written in bass clef. What pitch should be written in treble clef to transpose it up an octave?', 'The C above middle C', 'Middle C', 'The C below middle C', 'The G above middle C'],
    'rewriting-at-same-pitch': ['Where do you write the same middle C when changing from treble to bass clef?', 'On the first ledger line above the bass stave', 'On the first ledger line below the bass stave', 'On the top line of the bass stave', 'In the top space of the bass stave'],
    'enharmonic-equivalent': ['Which note sounds the same as F sharp on a piano?', 'G flat', 'G sharp', 'F natural', 'E flat'],
    'scales-key-signatures-ah': ['Which notes are sharpened in the key signature of D major?', 'F and C', 'F and G', 'C and G', 'B and E'],
    'triad-inversions': ['Which note is in the bass when an A minor triad is in second inversion?', 'E', 'A', 'C', 'G'],
    'chord-ii-first-inversion': ['Which note is in the bass of chord II in first inversion in C major?', 'F', 'D', 'A', 'C'],
    'chords-at-cadences': ['A phrase in C major ends with a G major chord followed by C major. Which chords are being used?', 'V–I', 'IV–I', 'I–V', 'V–vi'],
    'inserting-cadence-chords': ['A phrase in C major ends on C, and the final two melody notes are B–C. Which chords fit those notes and create a perfect cadence?', 'G major then C major', 'F major then C major', 'C major then G major', 'G major then A minor'],
    'bass-line-from-chords': ['Which bass notes give the roots of the progression C major, F major, G major, C major?', 'C–F–G–C', 'E–A–B–E', 'G–C–D–G', 'C–G–F–C'],
    'diminished-seventh': ['Which intervals do you stack to build a fully diminished seventh chord?', 'Three minor thirds', 'Three major thirds', 'A major third, a minor third and a minor third', 'A minor third, a major third and a minor third'],
    'dominant-seventh': ['Which notes form G7, the dominant seventh of C major?', 'G, B, D, F', 'G, B, D, F sharp', 'G, B flat, D, F', 'G, B, D sharp, F'],
    'added-sixth': ['Which note do you add to C–E–G to form C added sixth?', 'A', 'B', 'B flat', 'D'],
    'augmented-triad': ['Which three notes form a C augmented triad?', 'C, E, G sharp', 'C, E, G', 'C, E flat, G flat', 'C, E flat, G'],
    tritone: ['How many semitones make up a tritone?', 'Six', 'Five', 'Seven', 'Eight'],
    'augmented-fourth': ['What is the interval from C up to F sharp?', 'Augmented fourth', 'Diminished fifth', 'Perfect fourth', 'Perfect fifth'],
    'diminished-fifth': ['What is the interval from B up to F natural?', 'Diminished fifth', 'Augmented fourth', 'Perfect fourth', 'Perfect fifth'],
    ottava: ['What does 8vb tell the performer to do?', 'Sound the written notes one octave lower', 'Sound the written notes one octave higher', 'Sound the written notes two octaves lower', 'Play the written notes at their normal pitch'],
    ties: ['How do you play two crotchets on the same pitch joined by a tie?', 'Sound the pitch once for two beats', 'Sound the pitch twice for one beat each', 'Sound the pitch once for one beat', 'Sound the pitch once for three beats'],
    'syncopated-rhythms': ['Which example best illustrates syncopation in 4/4?', 'Accenting the offbeats between the main beats', 'Accenting beat one in every bar', 'Playing four even, unaccented crotchets', 'Omitting the last bar of a phrase'],
    'five-four': ['How many crotchet beats are in a complete bar of 5/4?', 'Five', 'Four', 'Three', 'Ten', 'A time signature with 5 above 4.'],
    'time-changes': ['The time signature changes from 3/4 to 2/4. How many crotchet beats are in the first complete bar after the change?', 'Two', 'Three', 'Four', 'Five'],
    'dal-segno': ['What does D.S. tell the performer to do?', 'Return to the segno', 'Return to the beginning', 'Jump straight to the coda', 'Stop immediately'],
    fine: ['After following D.C. al Fine, where should you stop?', 'At the marking Fine', 'At the first repeat sign', 'At the end of the first bar', 'At the printed end of the piece']
  };

  // Keep the original wording above to migrate saved reviews when a default is revised.
  const pictureQuestions = {
    'treble-lines': 'Which four notes are shown in the spaces of the treble stave, from lowest to highest?',
    steps: ['How does the melody move from the first note to the second?', 'Up by step', 'Down by step', 'Up by leap', 'The note repeats'],
    repetition: 'What musical device links the two bars shown?',
    barlines: 'What does the vertical line between the two groups of notes do?',
    forte: 'How should you play when you see this dynamic marking?',
    piano: 'How should you play when you see this dynamic marking?',
    crescendo: 'What does the opening hairpin tell the performer to do?',
    diminuendo: 'What does the closing hairpin tell the performer to do?',
    'treble-stave': 'How many lines are on the stave shown?',
    'middle-c-to-ledger-a': 'What is the name of the note shown above the treble stave?',
    sequences: 'Which three notes continue the pattern shown as a sequence starting one step higher?',
    'repeat-signs': 'When you reach the sign at the right for the first time, where do you go?',
    'mezzo-forte': 'What does the dynamic marking shown mean?',
    'mezzo-piano': 'What does the dynamic marking shown mean?',
    'tones-semitones-accidentals': 'What is the name of the sign before the second note, which cancels the first note’s sharp?',
    'scales-key-signatures-n5': 'Which accidental is shown in this key signature?',
    'chords-n5': 'Which three notes are stacked in the chord shown?',
    leaps: ['How does the melody move from the first note to the second?', 'Up by leap', 'Down by leap', 'Up by step', 'The note repeats'],
    'dotted-rhythms': 'What does the dot to the right of the notehead do to the note’s duration?',
    'scotch-snap': 'Which two note values are shown in this Scotch snap, from left to right?',
    'first-second-time-bars': 'After playing the first ending shown and repeating the passage, which ending do you take?',
    fortissimo: 'What does the dynamic marking shown mean?',
    pianissimo: 'What does the dynamic marking shown mean?',
    sforzando: 'What does the dynamic marking shown tell the performer to do?',
    'bass-clef-e-to-c': 'What is the name of the note shown below the bass stave?',
    'treble-down-octave-bass': 'Which pitch should you write in bass clef to move the note shown down an octave?',
    'chords-i-iv-v-vi': 'Which Roman numeral names the chord shown, if the music is in C major?',
    'tonic-subdominant-dominant': 'The picture shows the first five notes of F major. Which of these is the dominant?',
    'naming-diatonic-intervals': 'What is the interval between the two notes shown?',
    'writing-diatonic-intervals': 'Which note is a diatonic third above the note shown, in C major?',
    'compound-time': 'Which note value gets one main beat in the time signature shown?',
    triplets: 'How many crotchet beats do the three notes shown fill altogether?',
    rests: 'How many crotchet beats of silence does the rest shown indicate in this bar?',
    'da-capo': 'What does the D.C. instruction at the end of the excerpt tell you to do?',
    'phrase-mark': 'What does the long curved line above the notes show?',
    accents: 'What does the marking shown tell you to do when it appears on a note?',
    slurs: 'How should you play the notes under the curved line in the picture?',
    staccato: 'How should you play the note with the dot below it?',
    'bass-clef-ledger-range': 'What is the name of the note shown above the bass stave?',
    'bass-up-octave-treble': 'Which pitch should you write in treble clef to move the note shown up an octave?',
    'rewriting-at-same-pitch': 'Where would you write the note shown in bass clef to keep the same sounding pitch?',
    'enharmonic-equivalent': 'Which note sounds the same on a piano as the note shown?',
    'scales-key-signatures-ah': 'Which two pitches are sharpened in the key signature shown?',
    'triad-inversions': 'Which note is lowest in the last chord shown, the second inversion of A minor?',
    'chord-ii-first-inversion': 'Which note is in the bass of the second chord shown, the first inversion of chord II in C major?',
    'chords-at-cadences': 'Which Roman numerals label the two chords shown at this cadence in C major?',
    'inserting-cadence-chords': 'Which chords fit the two melody notes shown and give a perfect cadence in C major?',
    'bass-line-from-chords': 'Which bass notes would give the roots of the four chords shown, in order?',
    'diminished-seventh': 'What pattern of intervals is stacked from the bottom to the top of the chord shown?',
    'dominant-seventh': 'Which set of notes completes the triad shown to make G7?',
    'added-sixth': 'Which note do you add to the triad shown to make C added sixth?',
    'augmented-triad': 'Which three notes make up the augmented triad shown?',
    tritone: 'How many semitones are between the two notes shown?',
    'augmented-fourth': 'What is the interval between the two notes shown?',
    'diminished-fifth': 'What is the interval between the two notes shown?',
    ottava: 'How should the notes under the 8vb bracket shown sound?',
    ties: 'How should you play the two notes joined by the curved line?',
    'syncopated-rhythms': 'Which feature makes the rhythm in the picture syncopated?',
    'five-four': 'How many crotchet beats are in a complete bar of the time signature shown?',
    'time-changes': 'How many crotchet beats are in a complete bar after the change shown?',
    'dal-segno': 'Where does the D.S. instruction above the final note send you?',
    fine: 'Where should you stop after following the D.C. al Fine instruction shown?'
  };

  const score = notation => ({scores:[notation],closeup:true});
  // Use the Dictionary illustration unless the question needs a different example.
  const illustrations = {
    'treble-lines': ['Four notes sit in consecutive spaces of a treble stave, starting in the bottom space.', score('treble F4 A4 C5 E5')],
    steps: ['Two treble notes: the first sits on the ledger line below the stave and the second sits just below the bottom line.', {...score('treble C4 D4'),ledgerShift:0}],
    repetition: ['Two bars of three notes. Both bars contain G, A, G.'],
    barlines: ['A single vertical line separates two groups of notes on the stave.', score('treble @2/4 G4 A4 | B4 A4')],
    forte: ['A lower-case f.'],
    piano: ['A lower-case p.'],
    crescendo: ['A hairpin opens from left to right beneath four notes.', score('treble E4 F4 G4 A4 <0-3')],
    diminuendo: ['A hairpin narrows from left to right beneath four notes.', score('treble A4 G4 F4 E4 >0-3')],
    'treble-stave': ['A treble clef appears at the left end of a stave.', {...score('treble G4'),noteShift:7}],
    'middle-c-to-ledger-a': ['A single note is centred on the first ledger line above the treble stave.', {...score('treble A5'),noteShift:7,ledgerShift:0}],
    sequences: ['The three rising notes C, D and E are written on the treble stave.', {...score('treble C4 D4 E4'),ledgerShift:0}],
    'repeat-signs': ['A bar of music is framed by repeat signs, with the dots facing inwards.', {...score('treble @2/4 |: G4 A4 :|'),noteShift:[0,8]}],
    'mezzo-forte': ['The dynamic marking mf.'],
    'mezzo-piano': ['The dynamic marking mp.'],
    'tones-semitones-accidentals': ['Two notes sit in the same treble stave position. The first has a sharp and the second has a two-stroke sign with offset corners.', score('treble F#4 Fn4')],
    'scales-key-signatures-n5': ['The G major key signature. A sharp sits on the top line of the treble stave.', score('treble K:F#5 G4')],
    'chords-n5': ['Three noteheads are stacked in thirds on a treble stave with the lowest note in the second space.', {...score('treble A4+C5+E5/w'),noteShift:7}],
    leaps: ['Two treble notes: the first sits on the ledger line below the stave and the second sits on the second line.', {...score('treble C4 G4'),ledgerShift:0}],
    'dotted-rhythms': ['A filled notehead with a stem and a dot immediately to its right.'],
    'scotch-snap': ['Two notes share a beam. The first has an extra beam stub, and the second has a dot.'],
    'first-second-time-bars': ['Two endings are marked 1 and 2. The first has two crotchets and an end-repeat sign, and the second has a minim on the second line.',
      score('treble @2/4 G4 A4 :| G4/h v1:0-1 v2:2-2')],
    fortissimo: ['The dynamic marking ff.'],
    pianissimo: ['The dynamic marking pp.'],
    sforzando: ['The dynamic marking sfz.'],
    'bass-clef-e-to-c': ['One note is centred on the first ledger line below the bass stave.', {...score('bass E2'),ledgerShift:0}],
    'treble-down-octave-bass': ['The starting note sits on the first ledger line below the treble stave.', {...score('treble C4'),ledgerShift:0}],
    'chords-i-iv-v-vi': ['A three-note chord stacks F, A and C on a treble stave with no sharps or flats.', {...score('treble F4+A4+C5/w'),noteShift:7}],
    'tonic-subdominant-dominant': ['A one-flat key signature and the first five notes of the F major scale.', score('treble K:Bb4 F4 G4 A4 B4 C5')],
    'naming-diatonic-intervals': ['Two treble notes rise from middle C to the second space.', {...score('treble C4 A4'),ledgerShift:0}],
    'writing-diatonic-intervals': ['Only the starting note, D just below the bottom line, is written.', {...score('treble D4'),noteShift:8}],
    'compound-time': ['A time signature with 9 above 8.', {signatures:['9/8']}],
    triplets: ['Three notes share one beam with a 3 above them.', {...score('rhythm [B4/e,B4/e,B4/e]3'),beamOverhang:0.5}],
    rests: ['A single hanging rest fills the only bar after the 3/4 time signature.', score('treble @3/4 r/bar |')],
    'da-capo': ['D.C. is written over the last note of the excerpt.', score('treble @2/4 G4 A4 | B4 G4 ||> t3:D.C.')],
    'phrase-mark': ['A long curved line spans a group of notes.'],
    accents: ['A sideways wedge points right.'],
    slurs: ['A curved line joins three notes of different pitches.'],
    staccato: ['A dot is placed below the note, in line with its notehead.'],
    'bass-clef-ledger-range': ['One note is centred on the second ledger line above the bass stave.', {...score('bass E4'),noteShift:2,ledgerShift:0}],
    'bass-up-octave-treble': ['The starting note sits on the first ledger line above the bass stave.', {...score('bass C4'),noteShift:2,ledgerShift:0}],
    'rewriting-at-same-pitch': ['The starting note sits on the first ledger line below the treble stave.', {...score('treble C4'),noteShift:2,ledgerShift:0}],
    'enharmonic-equivalent': ['A sharp is placed before the note in the first space of the treble stave.', score('treble F#4')],
    'scales-key-signatures-ah': ['The D major key signature. Sharps sit on the top line and in the third space of the treble stave.', score('treble K:F#5,C#5 D4')],
    'triad-inversions': ['The A minor chord is shown first in root position, then with the other two notes each taking a turn in the bass.', score('treble A4+C5+E5/w C5+E5+A5/w E4+A4+C5/w')],
    'chord-ii-first-inversion': ['A D minor triad is shown in root position, then with its third moved into the bass.', score('treble D4+F4+A4/w F4+A4+D5/w')],
    'chords-at-cadences': ['Two chords on a grand stave. The bass moves from G to C and the highest note rises from B to C.',
      {scores:[['treble D4+G4+B4/h E4+G4+C5/h','bass G2/h C3/h']],brace:false}],
    'inserting-cadence-chords': ['Two melody notes, B and C, on a treble stave with no harmony underneath.', score('treble B4/h C5/h')],
    'bass-line-from-chords': ['Four treble chords are shown with their notes stacked in thirds.',
      score('treble C4+E4+G4/w | F4+A4+C5/w | G4+B4+D5/w | C4+E4+G4/w')],
    'diminished-seventh': ['Four notes are stacked in thirds: C sharp, E, G and B flat.'],
    'dominant-seventh': ['Three notes, G, B and D, are stacked on a treble stave before the seventh is added.', {...score('treble G4+B4+D5/w'),noteShift:7}],
    'added-sixth': ['The C major triad appears before the sixth is added.', {...score('treble C4+E4+G4/w'),noteShift:7}],
    'augmented-triad': ['Three notes are stacked in thirds above middle C. A sharp is attached to the highest note.', score('treble C4+E4+G#4/w')],
    tritone: ['Two notes span from middle C to the sharpened note in the first space.', {...score('treble C4 F#4'),ledgerShift:0}],
    'augmented-fourth': ['Two notes rise from middle C to the sharpened note in the first space.', {...score('treble C4 F#4'),ledgerShift:0}],
    'diminished-fifth': ['Two notes rise from the middle line of the treble stave to the top line.', score('treble B4 F5')],
    ottava: ['A dashed bracket labelled 8vb is placed below the notes.', score('treble E5 F5 G5 o-0-2')],
    ties: ['Two crotchets at the same height are joined by a curved line.', score('treble A4 A4 b0-1')],
    'syncopated-rhythms': ['Four pairs of quavers in 4/4. Each pair has an accent on its second note.',
      {scores:['rhythm @4/4 [B4/e,B4/e!accentAbove] [B4/e,B4/e!accentAbove] [B4/e,B4/e!accentAbove] [B4/e,B4/e!accentAbove] ||'],staff:'single',closeup:true,beamOverhang:0.2}],
    'time-changes': ['A 3/4 time signature is followed by a 2/4 time signature.'],
    'dal-segno': ['The D.S. instruction appears above the last note. A segno sign appears earlier in the excerpt.',
      score('treble @2/4 G4 A4 | B4 G4 | A4 G4 ||> s2:segno t5:D.S.')],
    fine: ['The word Fine appears before the D.C. al Fine instruction.',
      score('treble @2/4 G4 A4 | B4 G4 ||> t1:Fine t3:D.C._al_Fine')]
  };

  function create(dictionary, core) {
    const concepts = dictionary.entries.map(entry => ({
      id:entry.id,
      name:entry.markup.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
      level:dictionary.levelName(entry.level),
      categories:[['Melody / Harmony', 'Rhythm / Tempo', 'Texture / Structure / Form', 'Dynamics / Timbre'][entry.category]]
    }));
    const questions = dictionary.entries.map((entry, index) => {
      const [prompt, correct, wrong1, wrong2, wrong3, pictureDescription] = questionsByConcept[entry.id];
      return {
        id:'literacy-' + entry.id,
        conceptId:entry.id,
        levelCode:entry.level,
        objectiveId:'music-literacy-' + entry.id,
        objective:concepts[index].name,
        factGroupId:'literacy-' + entry.id,
        format:'multiple-choice',
        modality:'text',
        prompt,
        options:[correct, wrong1, wrong2, wrong3].map((text, index) => ({id:String(index + 1),text})),
        answer:{correctOptionIds:['1']},
        feedback:entry.definition,
        evidence:[{kind:'repository', path:'music-dictionary/music-literacy-dictionary.js', locator:entry.id}],
        ...(pictureDescription ? {picture:entry.picture,pictureDescription} : {})
      };
    });
    // Keep illustrations outside the saved question checksum so earlier edits still load.
    const pictures = new Map(questions.map(question => {
      const [description, illustration] = illustrations[question.conceptId] || [question.pictureDescription, question.picture];
      const picture = illustration || dictionary.entry(question.conceptId).picture;
      if (['dotted-minim', 'dotted-rhythms', 'dotted-crotchet', 'dotted-quaver'].includes(question.conceptId)) {
        return [question.id,{description,picture:{...picture,stemShift:0.25}}];
      }
      if (question.conceptId === 'grouped-semiquavers') {
        return [question.id,{description,picture:{...picture,stemShift:0.25,beamOverhang:0.25}}];
      }
      if (question.conceptId === 'scotch-snap') {
        return [question.id,{description,picture:{...picture,stemShift:0.25,beamOverhang:0.5}}];
      }
      if (question.conceptId === 'paired-quavers') {
        return [question.id,{description,picture:{...picture,beamOverhang:0.5}}];
      }
      return [question.id,{description,picture}];
    }));
    const bank = {
      bankId:'mlh-music-literacy-quiz-1',
      concepts,
      questions,
      reviewMigrations:[],
      coverage:questions.map(question => ({conceptId:question.conceptId,questionIds:[question.id]}))
    };
    const correctPositions = [1,3,0,2, 3,2,1,0, 2,0,3,1, 0,2,1,3];
    const ready = Promise.all(questions.map(async (question, index) => {
      const revision = pictureQuestions[question.conceptId];
      const position = correctPositions[index % correctPositions.length];
      const migrations = [];
      if (revision) {
        const previous = {prompt:question.prompt,options:question.options};
        migrations.push({from:await core.fingerprint(question),previous});
        if (Array.isArray(revision)) {
          const [prompt,...answers] = revision;
          question.prompt = prompt;
          question.options = previous.options.map((option,index) => ({...option,text:answers[index]}));
        } else {
          question.prompt = revision;
        }
      }
      if (position) {
        migrations.push({from:await core.fingerprint(question),previous:{}});
        const [correct,...distractors] = question.options;
        distractors.splice(position,0,correct);
        question.options = distractors;
      }
      const errors = core.validateQuestion(question);
      const illustration = pictures.get(question.id);
      if (!illustration.picture || !illustration.description) errors.push('A question illustration and description are required.');
      if (errors.length) throw new Error(question.id + ': ' + errors.join(' '));
      question.contentSha256 = await core.fingerprint(question);
      for (const migration of migrations) {
        bank.reviewMigrations.push({...migration,id:question.id,to:question.contentSha256,
          teacherAuthorizedCorrection:true,reorderOptions:Boolean(position)});
      }
    }));
    return {bank,ready,pictureFor:question=>pictures.get(question.id),storageKey:'mlh-literacy-quiz-reviews-v1'};
  }

  if (typeof module === 'object' && module.exports) module.exports = create;
  else root.MLHMusicLiteracyQuiz = create(root.MLHMusicLiteracyDictionary, root.MusicDictionaryQuizCore);
})(globalThis);
