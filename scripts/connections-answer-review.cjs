/* Teacher-facing names keep the reviewed near-miss answers readable.
 * These are plausible substitutions, not extra accepted answers. A board must
 * not put one beside a quartet whose heading would reasonably include it.
 * Empty lists mean the exact category/family checks already cover that label.
 * The publisher requires every group label to have an explicit review here.
 */
const reviews=new Map();
function review(labels,names=[],reason='Other visible concepts could reasonably replace a member of this connection.'){
 for(const label of labels.split('|')){if(reviews.has(label))throw Error('Repeated answer review: '+label);reviews.set(label,{names,reason});}
}
review('Styles|Playing techniques|Playing techniques and articulation|Instruments|Orchestral families|Ensembles|Instruments with strings|Acoustic instruments|String instruments|Woodwind instruments|Brass instruments|Voice types|Ornaments|Intervals');
review('Pitch movement',['Glissando','Octave','Chromatic','Semitone','Tone','Contrary motion']);
review('Pitch and tempo directions',['Accelerando','Rallentando','Ritardando']);
review('Accompaniment and articulation',['Solo','Unison / octave','Harmony / chord','Homophonic','Polyphonic','A cappella']);
review('Melody and harmony|Pitch and melody',['Ascending','Descending','Leap / leaping','Step / stepwise','Chord','Discord','Improvisation','Sequence','Ornament','Broken chord / arpeggio','Octave','Change of key','Modulation','Chromatic','Grace note','Trill']);
review('Musical patterns|Repeated musical ideas|Recurring musical ideas',['Question and answer','Repetition','Sequence','Ostinato / riff','Round','Canon','Imitation','Ground bass','Ritornello','Subject','Answer','Leitmotif','Passacaglia']);
review('Tempo',['Adagio','Allegro','Faster','Slower','Andante','A tempo','Accelerando','Rallentando','Moderato','Ritardando','Rubato']);
review('Rhythm and metre|Rhythm|Rhythm features|Time and beat|Rhythmic contrast',['Accent / accented','Beat / pulse','Drum fill','Pause','Off the beat','On the beat','2, 3 or 4 beats in the bar','March','Reel','Waltz','Jig','Strathspey','Scotch snap','Anacrusis','Dotted rhythms','Syncopation','Simple time (2/4, 3/4 and 4/4)','Compound time','Compound time (6/8, 9/8 and 12/8)','Cross rhythms','Triplets','Hemiola','3 against 2','Irregular time signatures','Time changes']);
review('Texture|Texture and structure',['Accompanied','Unaccompanied','Solo','Unison / octave','Harmony / chord','Round','Homophonic','Polyphonic','Contrapuntal','Canon','Imitation','A cappella','Antiphonal']);
review('Vocal music',['Choir','Voice','Solo','Unaccompanied','Round','Unison / octave','Musical','Backing vocals','Opera','Mouth music','Scots ballad','Soprano','Alto','Tenor','Bass']);
review('Scottish dance music|Scottish music|In a Scottish dance band|Dance music|Scottish folk music|Scottish dances|Scottish dance rhythms',['Scottish','Reel','Waltz','Scottish dance band','Accordion','Fiddle','Bagpipes','Drum kit','Acoustic guitar','Folk group','Jig','Strathspey','Scotch snap','Clarsach','Bodhran','Celtic rock','Bothy ballad','Waulking song','Mouth music','Scots ballad']);
review('Folk music',['Folk group','Acoustic guitar','Accordion','Fiddle','Scottish','Bagpipes','Voice','Bodhran','Clarsach']);
review('Guitars',['Acoustic guitar','Electric guitar','Bass guitar','Plucking','Strumming','Distortion','Pitch bend']);
review('Bowed or plucked strings|Plucked strings|Bowed strings|String techniques|String harmonics',['Strings','Bowing','Plucking','Strumming','Fiddle','Acoustic guitar','Electric guitar','Bass guitar','Violin','Viola','Cello','Double bass','Harp','Harpsichord','Clarsach','Sitar','Arco','Pizzicato','Harmonics','Tremolando']);
review('Wind instruments|Wind playing|Flutes and pan pipes',['Brass','Woodwind','Bagpipes','Blowing','Flute','Pan pipes','Recorder','Clarinet','Saxophone','Oboe','Bassoon','Piccolo','Trumpet','Trombone','French horn','Tuba','Flutter-tonguing']);
review('Rock music|Rock band sounds|Rock \'n\' roll',['Rock','Rock \'n\' roll','Electric guitar','Bass guitar','Drum kit','Piano','Ostinato / riff','Distortion','Voice','Backing vocals']);
review('Celtic rock',['Rock','Celtic rock','Electric guitar','Bass guitar','Drum kit','Fiddle','Bagpipes','Accordion','Scottish']);
review('Jazz music|Jazz funk|Contemporary jazz',['Jazz','Contemporary jazz','Jazz funk','Swing','Improvisation','Piano','Drum kit','Saxophone','Trumpet','Trombone','Clarinet','Bass guitar','Double bass','Acoustic guitar','Electric guitar','Brass','Woodwind','Voice','Syncopation','Scat singing','Walking bass','Blues']);
review('Choral music|Vocal accompaniment|Gospel music|A cappella singing',['Choir','Voice','Chorus','Unison / octave','Round','Canon','Imitation','Harmony / chord','Soprano','Alto','Tenor','Bass','Backing vocals','Accompanied','Unaccompanied','A cappella','Gospel','Question and answer','Descant (voice)','Homophonic','Polyphonic']);
review('Orchestral music|Orchestral expression',['Orchestra','Strings','Brass','Woodwind','Percussion (tuned and untuned)','Symphony','Concerto','Violin','Viola','Cello','Double bass','Flute','Clarinet','Oboe','Bassoon','Piccolo','Trumpet','Trombone','French horn','Tuba','Timpani','Tremolando','Romantic','Legato']);
review('Latin American music|Latin American percussion',['Latin American','Percussion (tuned and untuned)','Accent / accented','Off the beat','Syncopation','Guiro','Cymbals','Tambourine','Bongo drums','Castanets','Drum kit']);
review('Percussion sounds|Percussion instruments|Untuned percussion|Drum kit',['Percussion (tuned and untuned)','Drum kit','Steel band','Striking / hitting','Glockenspiel','Xylophone','Timpani','Triangle','Bass drum','Snare drum','Cymbals','Tambourine','Guiro','Bodhran','Bongo drums','Castanets','Hi-hat cymbals','Rolls','Drum fill','Tabla']);
review('Classical music|Classical instrumental music',['Classical','Baroque','Romantic','Opera','Concerto','Symphony','Sonata','Chamber music','String quartet','Piano','Orchestra','Alberti bass','Sonata form']);
review('Rhythmic styles',['Ragtime','Reggae','Swing','Rapping','Jazz','Blues','Rock \'n\' roll','Pop','Rock','Latin American','African music','Jazz funk']);
review('Scottish singing|Scottish songs|Gaelic singing',['Scottish','Mouth music','Scots ballad','Voice','Bothy ballad','Gaelic psalm','Waulking song','Question and answer','Solo','Unaccompanied','A cappella','Choir']);
review('Brass music|Brass performance|Brass band|Muted brass',['Brass','Brass band','Trumpet','Trombone','French horn','Tuba','Bass drum','Muted','Con sordino','Blowing']);
review('Keyboard instruments',['Piano','Organ','Accordion','Harpsichord']);
review('Low-pitched instruments',['Bass guitar','Cello','Double bass','Bass drum','Bassoon','Tuba']);
review('Orchestral strings',['Strings','Violin','Viola','Cello','Double bass','Arco','Bowing','Pizzicato','Tremolando','Harmonics']);
review('Wind band',['Wind band','Flute','Clarinet','Trumpet','Trombone','Saxophone','Piccolo','Oboe','Bassoon','French horn','Tuba','Percussion (tuned and untuned)','Bass drum','Snare drum','Cymbals']);
review('Ragtime',['Ragtime','Piano','Syncopation','Vamp','Off the beat','Walking bass']);
review('African music',['African music','Question and answer','Ostinato / riff','Percussion (tuned and untuned)','Drum kit','Voice','Syncopation','Cross rhythms','Bongo drums']);
review('Reggae',['Reggae','Off the beat','Bass guitar','Drum kit','Electric guitar','Voice','Syncopation','Ostinato / riff']);
review('Concerto',['Concerto','Solo','Orchestra','Cadenza','Violin','Piano']);
review('Opera|Solo singing|Operatic storytelling',['Opera','Aria','Chorus','Orchestra','Voice','Solo','Soprano','Tenor','Mezzo-soprano','Baritone','Bass','Recitative','Coloratura','Leitmotif','Romantic']);
review('Scales and tonality|Tonality|Keys and tonality|Related keys|Minor scales|Scales and drones',['Scale','Major tonality','Minor tonality','Pentatonic scale','Mode or modal','Harmonic minor scale','Melodic minor scale','Chromatic','Whole-tone scale','Atonal','Modulation','Change of key','Relative major','Relative minor','Polytonality or bitonality','Drone']);
review('Accompaniment patterns|Bass patterns|Held or repeating notes|Repeating bass patterns',['Drone','Pedal','Inverted pedal','Vamp','Ostinato / riff','Ground bass','Alberti bass','Walking bass','Passacaglia','Basso continuo']);
review('Related melodic parts|Melodic parts|Imitative writing|Layered melodies|Independent melodic lines|Imitative entries|Overlapping fugue entries|Fugue',['Canon','Imitation','Round','Contrary motion','Countermelody','Descant (voice)','Unison / octave','Obbligato','Polyphonic','Contrapuntal','Fugue','Subject','Answer','Countersubject','Stretto']);
review('Musical forms|Song structure|Returning sections',['Middle 8','Ternary / ABA','Theme and variation','Verse and chorus','Binary / AB','Rondo/ABACA — episode','Strophic','Through-composed','Lied','Voice','Ritornello','Repetition','Sonata form','Da capo aria']);
review('Pop songs',['Pop','Verse and chorus','Middle 8','Backing vocals','Voice','Electric guitar','Bass guitar','Drum kit','Piano','Repetition']);
review('Romantic music',['Romantic','Orchestra','Cello','Legato','Violin','Piano','Symphony','Lied','Rubato','Tremolando']);
review('Baroque music|Baroque accompaniment',['Baroque','Harpsichord','Ornament','Pedal','Basso continuo','Cello','Ground bass','Concerto grosso','Concertino','Ripieno','Ritornello','Organ','Sequence','Contrapuntal','Trill']);
review('Rapping',['Rapping','Voice','Beat / pulse','Syncopation','Sprechgesang','Question and answer','Ostinato / riff']);
review('Indian music',['Indian','Sitar','Tabla','Drone','Improvisation','Ostinato / riff']);
review('Minimalist music',['Minimalist','Repetition','Ostinato / riff','Sequence','Pedal','Inverted pedal','Drone','Ground bass']);
review('Pibroch',['Pibroch','Bagpipes','Grace note','Theme and variation','Scottish','Ornament']);
review('Scottish instruments',['Clarsach','Fiddle','Accordion','Bagpipes','Bodhran','Acoustic guitar','Drum kit']);
review('Sound effects|Recorded sound',['Reverb','Distortion','Pitch bend','Glissando','Musique concrète','Ostinato / riff','Electronic dance music (EDM)']);
review('Singing words|Vocal delivery|Speech and song',['Syllabic','Melismatic','Voice','Aria','Sprechgesang','Recitative','Rapping','Coloratura','Scat singing','Mouth music']);
review('Scales and intervals',['Chromatic','Semitone','Tone','Whole-tone scale','Octave','Tritone','Scale','Pentatonic scale']);
review('Melodic decoration',['Grace note','Trill','Ornament','Glissando','Acciaccatura','Mordent','Appoggiatura','Turn','Coloratura','Melismatic']);
review('Musical endings|Cadences',['Perfect cadence','Imperfect cadence','Interrupted cadence','Plagal cadence','Chord','Coda','Tierce de Picardie']);
review('Atonal music|Serial music|Modern tonal languages|Dissonance|Unsettled chords',['Cluster','Discord','Atonal','Chromatic','Serial','Tone row or note row','Polytonality or bitonality','Impressionist','Appoggiatura','Suspension','Augmented triad','Diminished triad','Diminished 7th','Tritone']);
review('Chamber music|String quartet|Piano trio',['Chamber music','String quartet','Piano trio','Violin','Viola','Cello','Piano','Sonata']);
review('Impressionist colour',['Impressionist','Whole-tone scale','Tone','Glissando','Pentatonic scale','Discord','Harp']);
review('Lied|Song cycle',['Lied','Song cycle','Voice','Piano','Romantic','Through-composed','Strophic','Solo','Accompanied']);
review('Sacred music|Sacred choral music|Sacred vocal music|Unaccompanied sacred singing',['Mass','Oratorio','Plainchant','Gospel','Motet','Anthem','Chorale','Choir','Chorus','Voice','A cappella','Unaccompanied','Plagal cadence','Renaissance','Unison / octave']);
review('Oratorio',['Oratorio','Aria','Chorus','Orchestra','Choir','Voice','Recitative','Mass','Soprano','Tenor']);
review('Plainchant',['Plainchant','A cappella','Unison / octave','Voice','Unaccompanied','Choir','Solo','Mode or modal']);
review('Recitative',['Recitative','Opera','Voice','Syllabic','Oratorio','Sprechgesang','Aria']);
review('Sonatas',['Sonata','Piano','Violin','Solo','Cello','Accompanied','Sonata form']);
review('Soul music',['Soul music','Gospel','Backing vocals','Voice','Choir','Question and answer','Solo']);
review('Chord types',['Chord','Added 6th','Diminished 7th','Diminished triad','Dominant 7th','Augmented triad','Harmony / chord','Discord','Cluster']);
review('Tierce de Picardie',['Tierce de Picardie','Minor tonality','Major tonality','Chord','Perfect cadence','Coda']);
review('Groups of two and three|Beats divided into three',['3 against 2','Cross rhythms','Triplets','Compound time (6/8, 9/8 and 12/8)','Compound time','Hemiola','Jig','Beat / pulse']);
review('Changing melodic patterns|Developing motifs|Melodic transformations',['Augmentation','Diminution','Repetition','Imitation','Sequence','Canon','Inversion','Retrograde','Subject','Answer']);
review('Time signatures',['Irregular time signatures','Time changes','Simple time (2/4, 3/4 and 4/4)','Compound time','Compound time (6/8, 9/8 and 12/8)','2, 3 or 4 beats in the bar','Jig','March','Waltz']);
review('Concerto grosso',['Concerto grosso','Concertino','Ripieno','Ritornello','Baroque','Basso continuo','Harpsichord','Orchestra','Solo']);
review('Da capo aria',['Da capo aria','Aria','Ternary / ABA','Ornament','Opera','Voice','Coloratura','Melismatic']);
review('Sonata form|Neoclassical music',['Sonata form','Exposition','Subject','Bridge','Classical','Neoclassical','Symphony','Sonata','Concerto']);
review('Coloratura|Decorative singing',['Coloratura','Soprano','Aria','Opera','Melismatic','Trill','Ornament','Voice','Mezzo-soprano']);
review('Renaissance vocal music|Renaissance songs',['Renaissance','Madrigal','Motet','Ballett','Voice','Choir','A cappella','Polyphonic','Anthem','Ayre or air']);
review('Renaissance dances|Renaissance instrumental music|Consort',['Galliard','Pavan','Renaissance','Consort','Recorder','Chamber music','Violin']);
review('Madrigal',['Choir','Chorus','Unaccompanied','Contrapuntal','Imitation','Renaissance','Ballett','Motet','Soprano','Alto','Tenor','Bass','Mezzo-soprano','Baritone','Countertenor']);
review('Anthem',['Anthem','Choir','Chorus','Voice','Motet','Mass','Oratorio','Gospel','Soprano','Alto','Tenor','Bass']);
review('Chorale',['Chorale','Homophonic','Plagal cadence','Choir','Voice','Chorus','Harmony / chord','Syllabic','A cappella','Unaccompanied']);
review('Ayre or air',['Ayre or air','Voice','Accompanied','Solo','Lied','Piano']);
review('Nationalist music',['Nationalist','Scottish','Folk group','Strathspey','Reel','Jig','Waltz','Fiddle','Bagpipes','Accordion','Scottish dance band']);
review('Electronic dance music|Electronic dance rhythms',['Electronic dance music (EDM)','Ostinato / riff','Beat / pulse','Reverb','Syncopation','Repetition','Distortion','Drum kit']);
review('Antiphonal music',['Antiphonal','Question and answer','Choir','Brass','Voice','Chorus','Orchestra']);
module.exports={reviews};
