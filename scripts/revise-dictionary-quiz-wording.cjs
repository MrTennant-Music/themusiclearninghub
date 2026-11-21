/* Review unedited questions using the teacher's classroom wording preferences.
   Produces an importable review; never edits a teacher-reviewed question. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const C=require('../music-dictionary/quiz-core.js'),D=require('../music-dictionary/music-concepts-data.js');
const {allowedDistractor,recordingConcepts}=require('./quiz-distractor-overlap.cjs');
const {distractorScopeErrors}=require('./quiz-distractor-scope.cjs');
const ROOT=path.resolve(__dirname,'..'),DATA=path.join(ROOT,'music-dictionary/quiz-data');
const read=name=>JSON.parse(fs.readFileSync(path.join(DATA,name+'.json')));
const concepts=new Map(D.concepts.map(c=>[c.id,c]));
const prompts={
 'CQ-N3-MC0002-L01':'A jazz melody stresses notes between the main beats. How are these notes described?',
 'CQ-N3-MC0005-L01':'Which section usually repeats the same words in a pop song?',
 'CQ-N3-MC0009-01':'A melody moves from low notes to high notes. What is its direction?',
 'CQ-N3-MC0011-01':'What happens in a chord change?',
 'CQ-N3-MC0012-01':'A melody moves from high notes to low notes. What is its direction?',
 'CQ-N3-MC0016-01':'What follows the opening phrase in question and answer?',
 'CQ-N3-MC0018-01':'A phrase repeats higher, keeping the same melodic shape. What is this called?',
 'CQ-N3-MC0020-Q01':'The main beats are grouped in twos, threes or fours. Name the concept that describes the number of beats in the bar.',
 'CQ-N3-MC0025-01':'A short drum kit pattern leads into a new section. What is it called?',
 'CQ-N3-MC0026-Q02':'The music changes to a quicker speed. Give the English term.',
 'CQ-N3-MC0028-Q02':'Notes fall between the main beats. Give the phrase that describes this.',
 'CQ-N3-MC0029-01':'The notes fall exactly on the main pulse. Where are they played?',
 'CQ-N3-MC0029-Q02':'Notes fall exactly on the main pulse. Give the phrase that describes this.',
 'CQ-N3-MC0030-01':'A note or rest is held longer than expected before the music continues. What is this called?',
 'CQ-N3-MC0032-01':'The beat becomes slower. What happens to the tempo?',
 'CQ-N3-MC0032-Q02':'The music changes to a slower speed. Give the English term.',
 'CQ-N3-MC0039-Q02':'One performer plays the main line while the band accompanies them. What is this passage called?',
 'CQ-N3-MC0045-Q02':'A player sends air into an instrument to make a sound. Name this playing action.',
 'CQ-N3-MC0046-Q02':'A player moves a bow across the strings to make a sound. Name this playing action in English.',
 'CQ-N3-MC0056-01':'What is the difference between tuned and untuned percussion?',
 'CQ-N3-MC0058-Q02':'A player pulls and releases a string with a finger or pick. Name this playing action in English.',
 'CQ-N3-MC0062-Q02':'A player hits an instrument with a hand, stick or beater. Name this playing action.',
 'CQ-N3-MC0064-01':'A guitarist brushes a pick across several strings to play a chord. What is this action called?',
 'CQ-N3-MC0067-Q02':'Which sound source can sing words?',
 'CQ-N4-MC0081-01':'What changes when music moves to a new key?',
 'CQ-N4-MC0081-Q02':'The music moves to a different home key. Name this musical change.',
 'CQ-N4-MC0082-01':'Which chord change gives a settled ending in a major key?',
 'CQ-N4-MC0083-01':'One note keeps sounding beneath a changing melody. What is this accompaniment called?',
 'CQ-N4-MC0084-Q02':'The music has a clear home note and a major home chord. Name the tonality.',
 'CQ-N4-MC0085-Q02':'The music has a clear home note and a minor home chord. Name the tonality.',
 'CQ-N4-MC0088-01':'What happens in a pedal?',
 'CQ-N4-MC0091-01':'What does a scat singer use instead of words?',
 'CQ-N4-MC0102-01':'Which note-length pattern is a Scotch snap?',
 'CQ-N4-MC0105-01':'Which beats are stressed in syncopation?',
 'CQ-N4-MC0107-01':'What happens to the melody in a strict canon?',
 'CQ-N4-MC0109-01':'Which statement describes a middle 8?',
 'CQ-N4-MC0111-01':'How are variations linked to the original theme?',
 'CQ-N4-MC0112-01':'How do the words usually change between verses and choruses?',
 'CQ-N4-MC0122-01':'How does distortion change an electric guitar sound?',
 'CQ-N4-MC0129-Q02':'A device softens or changes an instrument’s tone. Give the English term for this sound.',
 'CQ-N5-MC0156-01':'What does atonal music lack?',
 'CQ-N5-MC0167-F02':"A singer sings six notes on the word ‘love’. What type of word setting is this?",
 'CQ-N5-MC0171-01':'Which pair of notes is a semitone apart?',
 'CQ-N5-MC0176-F03':'There are four main beats in each bar. Each beat divides into three. Which time signature fits?',
 'CQ-N5-MC0177-01':'What happens in cross rhythms?',
 'CQ-N5-MC0180-01':'How does the speed change in rubato?',
 'CQ-N5-MC0182-F03':'An A section is followed by a contrasting B section. A does not return. What form is this?',
 'CQ-N5-MC0187-F02':'A choir sings different notes while the parts move in the same rhythm. What texture is this?',
 'CQ-N5-MC0193-F02':'The strings change from plucking to bowing. What is the Italian term for the new playing technique?',
 'CQ-N5-MC0194-01':'Where does a baritone voice lie?',
 'CQ-N5-MC0200-01':'A brass sound becomes softer, thinner or more nasal. Which instruction could explain this?',
 'CQ-N5-MC0203-01':'How does the sound change when a hi-hat opens?',
 'CQ-N5-MC0205-F02':'Which sound helps you recognise an oboe?',
 'CQ-N5-MC0207-01':'The strings change from bowing to plucking. What is the Italian term for the new playing technique?',
 'CQ-N5-MC0208-F02':'What effect can reverb create?',
 'CQ-N5-MC0209-F02':'How does a drum roll sound different from a single hit?',
 'CQ-N5-MC0210-F02':'Which sound helps you recognise a sitar?',
 'CQ-H-MC0214-01':'What size of group plays chamber music?',
 'CQ-H-MC0216-01':'Jazz improvisation combines with a strong, syncopated funk rhythm. Name the style.',
 'CQ-H-MC0226-01':'How is an acciaccatura played?',
 'CQ-H-MC0232-F02':'Why does an interrupted cadence sound unexpected?',
 'CQ-H-MC0233-01':'What does an interval describe?',
 'CQ-H-MC0234-01':'Which notes are raised in an ascending melodic minor scale?',
 'CQ-H-MC0235-01':'What gives each mode its particular sound?',
 'CQ-H-MC0239-F02':'A major key shares its key signature with a minor key. Name the relationship from the minor key to the major key.',
 'CQ-H-MC0240-F03':'A minor key shares its key signature with a major key. Name the relationship from the major key to the minor key.',
 'CQ-H-MC0242-01':'One part plays three equal notes while another plays two in the same time. Name this rhythmic relationship.',
 'CQ-H-MC0245-F02':'How can the uneven beat groups in an irregular time signature sound?',
 'CQ-H-MC0255-F02':'A sonata movement introduces two contrasting main themes. What are these themes called?',
 'CQ-H-MC0261-F02':'What does tremolando sound like?',
 'CQ-AH-000013':'All twelve semitones are arranged in a fixed order before the pattern repeats. Name the style.',
 'CQ-AH-000017':'A melody leaps to a stressed, clashing note. This takes time from the main note, then resolves to it by step. Which ornament is this?',
 'CQ-AH-000021':'Two different keys sound at the same time. Give the term for exactly two keys.',
 'CQ-AH-MC0284-F02':'Which note pattern describes an ordinary turn?',
 'CQ-AH-MC0288-F02':'What often happens to the key in the bridge of a sonata exposition?',
 'CQ-AH-MC0289-F02':'A voice finishes the subject as another voice enters. What may the first voice play next?',
 'CQ-AH-MC0294-01':'What can link the songs in a song cycle?',
 'CQ-AH-MC0295-F02':'What effect can overlapping subject entries have in a fugue?'
};
// Exact phrases avoid changing the meaning of an unrelated musical statement.
const phrases=new Map([
 ['a repeating pattern of repeated sections','repeated sections'],
 ['What is it most likely to be?','What is it called?'],
 ['Which description would be a useful listening clue to','Which description matches'],
 ['Which combination would be a useful listening clue to','Which sounds help you recognise'],
 ['Which sound would be a useful clue to','Which sound helps you recognise'],
 ['Which sound would be the clearest clue to','Which sound helps you recognise'],
 ['Which is the most useful clue to','Which feature helps you recognise'],
 ['Which sounds could help you recognise','Which sounds help you recognise'],
 ['Which sound would help you recognise','Which sound helps you recognise'],
 ['Which tone would help you recognise','Which tone helps you recognise'],
 ['Which rhythm would help you recognise','Which rhythm helps you recognise'],
 ['What role often suits a tuba in a band?','What does a tuba usually play in a band?'],
 ['featured alongside an orchestra','accompanied by an orchestra'],
 ['a simultaneous chord','a chord played at once'],
 ['sound simultaneously','sound at the same time'],
 ['A broken chord presents chord notes in succession instead of all at once.','A broken chord plays the notes of a chord one after another instead of together.'],
 ['conventional lyrics','words'],
 ['It means only the volume changes','Only the volume changes'],
 ['It means only a change of instrument','Only the instrument changes'],
 ['It is only a change in loudness','Only the volume changes'],
 ['It is a change in loudness with no pitch content','Only the volume changes'],
 ['It is a change in volume only','Only the volume changes'],
 ['It is only a change in key','Only the key changes'],
 ['It is only a change in the speed of the beat','Only the tempo changes'],
 ['It is a change in tempo without any harmony change','Only the tempo changes'],
 ['It means the tempo becomes slower','The tempo becomes slower'],
 ['It requires every beat to have a different pitch','Each beat has a different pitch'],
 ['The notes can be heard together or one after another','The notes can sound together or one after another'],
 ['while retaining its shape','while keeping its melodic shape'],
 ['A compulsory faster tempo','A faster tempo'],
 ['A compulsory change of instrument','A change of instrument'],
 ['Its tempo in every case','Its tempo'],
 ['Its number of performers in every case','The number of performers'],
 ['Its dynamic level in every case','Its volume'],
 ['It is a rule forbidding accompaniment','It is played without accompaniment'],
 ['A rule forbidding accompaniment','No accompaniment'],
 ['A new unrelated instrument every beat','A melody played without chords'],
 ['It is defined by a silent vocal part','The singer speaks without changing pitch'],
 ['It is a single drum-kit solo only','One percussion player performs alone'],
 ['Every part must be doubled by a large section','Several players perform each part'],
 ['It means a new key is required after every note','The key changes after every phrase'],
 ['It guarantees a fully settled sound','The notes blend without a clash'],
 ['It means the melody stops for good','The melody stops when the chord changes'],
 ['Its melodic shape is kept','The melodic shape stays the same'],
 ['The pace is calm and unhurried','The tempo is slow'],
 ['The pulse moves quickly','The beat is fast'],
 ['The pulse moves slowly','The beat is slow'],
 ['It is a command to stop the sound completely','The sound stops completely'],
 ['It means every backing note changes to a new pattern','The accompaniment changes on every beat'],
 ['Its four notes are built from successive minor thirds.','Its four notes are built from minor thirds stacked above one another.'],
 ['Fugal entries introduce the main idea successively in independent voices.','The parts enter one after another with the subject or answer.'],
 ['Overlapping entries can build contrapuntal density and intensity.','The overlapping subject entries make the texture denser and more intense.'],
 ['The subject is the principal theme on which the fugue is built.','The subject is the main melodic idea in a fugue.'],
 ['A usual ordinary turn begins above and moves around the main note.','An ordinary turn moves above, to, below and back to the main note.'],
 ['The tuba commonly anchors the bass line.','The tuba usually plays the low bass line.'],
 ['The sitar\'s strings and construction give a distinctive buzzing resonance.','The sitar has a bright, buzzing string sound.'],
 ['The oboe has a focused, often nasal double-reed timbre.','The oboe has a clear, piercing tone with a nasal edge.'],
 ['A cappella refers to voices without instrumental accompaniment.','A cappella means singing without instruments.'],
 ['Electronic reverb can suggest a larger acoustic space.','Reverb makes a sound linger, as if it is in a large hall.'],
 ['The repeated attacks support a continuing sound.','Rapid repeated drum strokes make the sound continue.']
]);
// Each entry replaces the four incorrect statements, retaining the two marked answers.
const wrongStatements={
 'MC-0009':['The notes move downwards','The notes stay at one pitch','The music gets louder without changing pitch','The tempo gets faster without changing pitch'],
 'MC-0010':['The notes are played one after another','One note is played on its own','Only the rhythm changes','All notes have the same pitch'],
 'MC-0011':['Only the volume changes','The same chord is repeated throughout','Only the tempo changes','Only the instrument changes'],
 'MC-0012':['The notes move upwards','The notes stay at one pitch','The music gets quieter without changing pitch','The tempo gets slower without changing pitch'],
 'MC-0013':['The notes blend without a clash','Every note is played on its own','All the notes have the same pitch','Only the tempo changes'],
 'MC-0014':['The performer repeats a written melody exactly','The solo is always identical in every performance','The player follows only fixed written notes','No musical ideas are made up during the performance'],
 'MC-0015':['The melody moves only to neighbouring notes','The notes stay at the same pitch','Only the volume changes','Only the rhythm changes'],
 'MC-0016':['All parts play the same phrase together','The opening phrase has no reply','Only the volume changes','Only the instruments change'],
 'MC-0017':['The phrase starts higher each time','The notes are played in reverse order','The melody changes after every phrase','The same rhythm never returns'],
 'MC-0018':['The phrase repeats at exactly the same pitch','Only the rhythm changes','Only the volume changes','The melodic shape changes completely'],
 'MC-0019':['The melody jumps over nearby notes','The notes stay at one pitch','Only the volume changes','All notes sound together as a chord'],
 'MC-0020':['Every bar has five main beats','The first beat is always the weakest','The number of beats describes the volume','Bars have no steady beat'],
 'MC-0021':['Every note has equal emphasis','The marked note is played more weakly','The whole phrase gradually gets louder','The tempo gradually gets faster'],
 'MC-0022':['The tempo is fast','The music gradually gets faster','The music gradually gets slower','The instruction describes volume'],
 'MC-0023':['The tempo is slow','The music gradually gets slower','The instruction describes volume','The instruction means a pause'],
 'MC-0024':['It is the rhythm of the melody only','It is the highest note','It describes the volume','It names the instrument playing'],
 'MC-0025':['The normal drum pattern continues unchanged','One drum note is held throughout','The drums stop for the whole section','Only the melody changes pitch'],
 'MC-0026':['The beat becomes slower','Only the volume increases','Only the pitch rises','The beat stays at the same speed'],
 'MC-0028':['Notes fall exactly on the main beats','Every note is played on the first beat','Only the tempo changes','The rhythm follows every main beat evenly'],
 'MC-0029':['Notes fall between the main beats','Every note avoids the main pulse','Only the volume changes','The rhythm has no steady pulse'],
 'MC-0030':['The music gradually speeds up','The note is cut shorter than written','The phrase repeats at a higher pitch','The music changes key'],
 'MC-0032':['The beat becomes faster','Only the volume decreases','Only the pitch falls','The beat stays at the same speed'],
 'MC-0035':['Everyone sings the same note','Only one note sounds at a time','Only the rhythm changes','Only the volume changes'],
 'MC-0036':['The two notes have exactly the same pitch','The notes are next to each other','Three notes sound together as a chord','Only the volume changes'],
 'MC-0038':['All parts begin the melody together','Each part uses a completely different melody','The melody is heard only once','The parts never overlap'],
 'MC-0039':['A whole group shares the featured line','All performers play the same melody together','No performer has a featured part','Only the accompaniment is heard'],
 'MC-0040':['Chords support the melody','A band plays beneath the singer','Another instrument provides a backing part','A group accompanies the soloist'],
 'MC-0041':['The parts play different pitches together','The parts begin the melody at different times','Each part plays a different melody','The parts play contrasting rhythms'],
 'MC-0080':['All chord notes sound together','One note is repeated at the same pitch','Only the tempo changes','The melody uses notes unrelated to a chord'],
 'MC-0081':['The music stays in the same key','Only the tempo changes','Only the volume changes','Only the instruments change'],
 'MC-0084':['The home chord is minor','There is no clear home note','The tempo alone determines the key','The volume alone determines the key'],
 'MC-0085':['The home chord is major','There is no clear home note','Every piece must be slow','Every piece must be quiet'],
 'MC-0086':['The notes have exactly the same pitch','The notes are next to each other in the scale','The interval contains three scale steps','Only the volume changes'],
 'MC-0087':['The main melody has no extra notes','Only the tempo changes','Only the volume changes','The melody is replaced by repeated chords'],
 'MC-0088':['The bass note changes with every chord','Only a high melody note is held','The chords above stay the same throughout','The bass copies every note of the melody'],
 'MC-0089':['The scale has seven different notes in each octave','The scale uses all twelve different pitches','The scale uses only one repeated pitch','The scale has only four different notes'],
 'MC-0090':['All the notes sound together as a chord','Only one pitch repeats','Notes are played in a random order','Only the volume changes'],
 'MC-0093':['The accompaniment changes pattern on every beat','Only one high note is held','The melody is played without accompaniment','Every chord is followed by silence instead of a bass note'],
 'MC-0094':['The music keeps getting slower','The music keeps getting faster','The opening key returns','Only the volume changes'],
 'MC-0095':['The music gradually gets slower','Only the volume increases','The original tempo returns','The tempo remains unchanged'],
 'MC-0096':['The melody starts with a complete bar','The first note falls on the first strong beat','The opening notes come after the first complete bar','The term describes the final chord'],
 'MC-0097':['The tempo is very fast','The music gradually gets slower','The music gradually gets faster','The instruction describes volume'],
 'MC-0098':['Each main beat divides into two','6/8 has six main dotted-crotchet beats','There is no regular pulse','The time signature describes the key'],
 'MC-0099':['The two notes have equal lengths','The dot makes a note half as long','Every note is short and detached','Only the key changes'],
 'MC-0100':['The dance has three slow main beats like a waltz','Each main beat divides into two','The music has no regular pulse','The dance is played slowly with no skipping feel'],
 'MC-0101':['The music gradually gets faster','The original tempo returns','Only the volume decreases','The tempo stays unchanged'],
 'MC-0102':['A long note is followed by a short note','Two equal notes are played','Three equal notes fit into one beat','The longer note is heard first'],
 'MC-0103':['Each main beat divides into three','There is no steady pulse','The time signature describes the key','Every bar has five main beats'],
 'MC-0105':['Only the strong beats are stressed','Every note falls on a strong beat','Only the volume changes','The tempo gradually gets faster'],
 'MC-0226':['Two neighbouring notes alternate repeatedly','The pitch slides continuously between notes','A leaning note takes a large share of the main note’s time','The note lengths are doubled'],
 'MC-0233':['It measures the number of bars','It measures the difference in volume','It names the number of performers','It measures the length of a note'],
 'MC-0242':['The two parts play the same rhythm','The three-note group takes longer than the two-note group','There are five equal beats in every bar','Only the tempo changes'],
 'MC-0243':['The note lengths are halved','Only the pitch changes','Only the volume changes','Only the instrument changes'],
 'MC-0244':['The note lengths are doubled','Only the pitch changes','Only the volume changes','Only the instrument changes'],
 'MC-0245':['Every bar has four equal beats','There is no steady pulse','Only the tempo changes','All beat groups have equal lengths'],
 'MC-0246':['The time signature stays the same throughout','Only the tempo changes','Only the volume changes','Only the instruments change'],
 'MC-0248':['Only a high melody is played','The bass line is omitted','One unaccompanied voice sings the melody','Only percussion keeps the beat'],
 'MC-0271':['Folk melodies are avoided','National dance rhythms are avoided','The music is always based on a twelve-note row','Only the volume changes'],
 'MC-0276':['A very short crushed note is played before the main note','Two neighbouring notes alternate repeatedly','The pitch slides continuously between notes','The note lengths are doubled'],
 'MC-0285':['Only the key changes','The tempo gradually gets slower','Two neighbouring pitches alternate rapidly','Every bar has five equal beats'],
 'MC-0287':['All groups play the same phrase together','Only one performer is involved','The groups never answer one another','Only the tempo changes'],
 'MC-0291':['The note order is reversed','The note lengths are doubled','The intervals keep their original direction','Only the tempo changes'],
 'MC-0293':['The note lengths are doubled','The direction of each interval is reversed','The notes stay in the original order at a higher pitch','Only the volume changes']
};
const feedback={
 'MC-0013':'Discord means notes clash, creating tension. Moving to a chord with less clash can release that tension.',
 'MC-0022':'Adagio means a slow tempo.',
 'MC-0023':'Allegro means a fast, lively tempo.',
 'MC-0026':'Faster means the beat becomes quicker. The pitch and volume can stay the same.',
 'MC-0028':'Off the beat means notes fall between the main beats.',
 'MC-0029':'On the beat means notes fall exactly on the main pulse.',
 'MC-0032':'Slower means the beat becomes less quick. The pitch and volume can stay the same.',
 'MC-0081':'A change of key moves the music to a new home key.',
 'MC-0084':'Major tonality has a major home chord. Speed and volume alone do not tell you the tonality.',
 'MC-0085':'Minor tonality has a minor home chord. Minor music does not have to be slow or quiet.',
 'MC-0094':'A tempo means return to the earlier speed after a change of tempo.',
 'MC-0095':'Accelerando means gradually getting faster.',
 'MC-0097':'Andante means at a walking pace.',
 'MC-0101':'Rallentando means gradually getting slower.',
 'MC-0105':'Syncopation stresses weak beats or notes between the main beats.',
 'MC-0178':'Moderato means a moderate or medium tempo.',
 'MC-0179':'Ritardando means gradually getting slower.',
 'MC-0193':'Arco means playing a string instrument with the bow.',
 'MC-0200':'Con sordino means with a mute. The mute changes or softens the instrument’s tone.',
 'MC-0207':'Pizzicato means plucking the strings instead of using the bow.',
 'MC-0226':'An acciaccatura is a very short crushed note played quickly before the main note.',
 'MC-0238':'A plagal cadence moves from chord IV to chord I, as in the final “Amen” of many hymns.',
 'MC-0243':'Augmentation makes a melody’s notes longer, often twice as long, while the beat stays the same.',
 'MC-0244':'Diminution makes a melody’s notes shorter, often half as long, while the beat stays the same.',
 'MC-0284':'A turn decorates the main note by moving to the notes above and below it before returning.',
 'MC-0291':'Melodic inversion reverses the direction of the intervals: an upward third becomes a downward third.',
 'MC-0293':'Retrograde reverses the order of a melody’s notes. The last note becomes the first.'
};
const questionFeedback={
 'CQ-N3-MC0030-01':'A pause holds a note or rest longer than its written value before the music continues.',
 'CQ-N4-MC0082-01':'Chord V moving to chord I gives a settled ending in a major key.',
 'CQ-N4-MC0096-01':'An anacrusis is an incomplete opening bar leading into the first strong beat.',
 'CQ-N5-MC0171-01':'C to C-sharp is one semitone, the smallest gap between neighbouring notes in this question.',
 'CQ-N5-MC0176-F03':'12/8 has four main beats in each bar. Each main beat divides into three.',
 'CQ-N5-MC0182-F03':'Binary form has two main sections, A and B. A does not return as a third section.',
 'CQ-H-MC0239-01':'C major is the relative major of A minor. They share a key signature.',
 'CQ-H-MC0240-01':'A minor is the relative minor of C major. They share a key signature.',
 'CQ-H-MC0246-01':'The time signature changes from three beats in the bar to four beats in the bar.',
 'CQ-H-MC0247-01':'A triplet fits three equal notes into the time normally taken by two.',
 'CQ-H-MC0250-F02':'A da capo aria follows an A–B–A plan. The opening music returns after a contrasting middle section.',
 'CQ-AH-MC0278-02':'In first inversion, the third of the chord is the lowest note.'
};
// Use musically related alternatives, still excluding aliases, parent concepts,
// compatible answers and every concept actually tagged in the recording.
const listeningGroups=[
 ['MC-0070','MC-0077','MC-0148','MC-0215','MC-0274','MC-0272','MC-0271'],
 ['MC-0001','MC-0002','MC-0005','MC-0006','MC-0007','MC-0074','MC-0075','MC-0076','MC-0079','MC-0146','MC-0216','MC-0224','MC-0266','MC-0267'],
 ['MC-0072','MC-0078','MC-0145','MC-0149','MC-0153','MC-0155'],
 ['MC-0004','MC-0073','MC-0144','MC-0147','MC-0217','MC-0218','MC-0220','MC-0221','MC-0222','MC-0250','MC-0256','MC-0262','MC-0263','MC-0264','MC-0265','MC-0269','MC-0270','MC-0294','MC-0300'],
 ['MC-0071','MC-0154','MC-0214','MC-0223','MC-0225','MC-0249','MC-0297','MC-0299']
];
const closeListeningGroups=[
 ['MC-0217','MC-0263','MC-0294','MC-0144','MC-0222','MC-0300'],
 ['MC-0218','MC-0220','MC-0221','MC-0262','MC-0265','MC-0270'],
 ['MC-0264','MC-0269','MC-0147'],
 ['MC-0072','MC-0078','MC-0145','MC-0149','MC-0155'],
 ['MC-0225','MC-0297','MC-0299','MC-0214'],
 ['MC-0071','MC-0154','MC-0223','MC-0249'],
 ['MC-0001','MC-0002','MC-0074','MC-0079','MC-0216','MC-0266'],
 ['MC-0005','MC-0006','MC-0007','MC-0146','MC-0224','MC-0267']
];
function simplify(value){let text=value;for(const [from,to] of phrases)text=text.split(from).join(to);return text.replace(/\bTick ONE\b/g,'Tick one').replace(/\bTick TWO\b/g,'Tick two').replace(/\btunes\b/g,'melodies').replace(/\btune\b/g,'melody');}
function revise(q,protectedIds,selection){
 if(protectedIds.has(q.id)||q.review?.updatedAt||q.review?.finalisedAt)return C.copy(q);
 const next=C.copy(q),concept=concepts.get(q.conceptId);
 next.prompt=simplify(next.prompt);next.feedback=simplify(next.feedback);
 if(prompts[q.id])next.prompt=prompts[q.id]+(q.options?' Tick one box.':'');
 for(const o of next.options||[])o.text=simplify(o.text);
 if(next.modality==='text'&&next.format==='multi-select'&&wrongStatements[q.conceptId]){
  const wrong=next.options.filter(o=>!next.answer.correctOptionIds.includes(o.id));
  wrong.forEach((o,i)=>o.text=wrongStatements[q.conceptId][i]);
 }
 if(feedback[q.conceptId])next.feedback=feedback[q.conceptId];
 if(questionFeedback[q.id])next.feedback=questionFeedback[q.id];
 // Technical vocabulary is useful when it has already been taught.
 if(next.levelCode==='N4'&&q.conceptId==='MC-0074'){
  next.prompt=next.prompt.replace('a melody that falls between the beats','a syncopated melody');
  next.feedback=next.feedback.replace('bass-and-chord accompaniment','vamp accompaniment');
  for(const o of next.options||[])o.text=o.text.replace('bass-and-chord accompaniment','vamp accompaniment').replace('bass-and-chord backing','vamp accompaniment');
 }
 if(next.modality==='audio'){
  if(next.format==='short-answer'&&['MC-0070','MC-0077','MC-0148','MC-0274'].includes(q.conceptId))next.prompt='Listen to this excerpt and name the period the music is from.';
  const group=listeningGroups.find(ids=>ids.includes(q.conceptId));
  if(group&&next.options){
   const entry=selection.entries.find(e=>e.sha256===q.media.sha256&&e.conceptId===q.conceptId),known=recordingConcepts(entry,selection.entries);
   const nearby=closeListeningGroups.find(ids=>ids.includes(q.conceptId))||[];
   const rank=id=>(nearby.includes(id)?20:0)+D.levels.indexOf(concepts.get(id).level);
   const candidates=group.filter(id=>id!==q.conceptId&&D.levels.indexOf(concepts.get(id).level)<=D.levels.indexOf(concept.level)&&allowedDistractor(q.conceptId,id,known)&&!distractorScopeErrors({id:q.id,levelCode:q.levelCode,answer:{correctOptionIds:[]},options:[{id:'candidate',text:concepts.get(id).name}]}).length).sort((a,b)=>rank(b)-rank(a)||require('node:crypto').createHash('sha256').update(q.id+a).digest('hex').localeCompare(require('node:crypto').createHash('sha256').update(q.id+b).digest('hex')));
   // Keep existing close alternatives first, changing only distant distractors.
   const used=new Set(next.options.filter(o=>next.answer.correctOptionIds.includes(o.id)||candidates.includes(o.conceptId)).map(o=>o.conceptId));
   for(const o of next.options.filter(o=>!next.answer.correctOptionIds.includes(o.id)&&!candidates.includes(o.conceptId))){
    const id=candidates.find(id=>!used.has(id));if(!id)continue;used.add(id);o.conceptId=id;o.text=concepts.get(id).name;o.editorialRationale='Related musical category at this level or earlier; recording tags and compatible concepts excluded.';
   }
   next.relatedConceptIds=next.options.filter(o=>!next.answer.correctOptionIds.includes(o.id)).map(o=>o.conceptId);
  }
 }
 return next;
}
async function prepare(protectedExport){
 const text=read('question-bank'),audio=read('audio-question-bank'),selection=read('audio-library-selection');
 const protectedIds=new Set(protectedExport.records.map(r=>r.id));
 for(const q of [...text.questions,...audio.questions])if(q.review?.updatedAt||q.review?.finalisedAt)protectedIds.add(q.id);
 const records=[],changes=[];
 for(const q of [...text.questions,...audio.questions]){
  const next=revise(q,protectedIds,selection);if(C.stable(C.content(q))===C.stable(C.content(next)))continue;
  next.contentSha256=await C.fingerprint(next);next.editorialCheck={...next.editorialCheck,classroomWording:'2026-11-12'};
  records.push({id:q.id,baseContentSha256:q.contentSha256,question:next});
  changes.push({id:q.id,concept:concepts.get(q.conceptId).name,level:q.levelCode,modality:q.modality,fields:['prompt','feedback','options','relatedConceptIds'].filter(f=>C.stable(q[f])!==C.stable(next[f])).map(field=>({field,before:q[field],after:next[field]}))});
 }
 return {review:{schemaVersion:'1.0-concept-quiz-reviews',bankId:text.bankId,records},audit:{date:'2026-11-12',reviewedQuestions:text.questions.length+audio.questions.length,protectedQuestions:[...protectedIds],changes}};
}
module.exports={revise,prepare};
if(require.main===module)(async()=>{const protectedExport=JSON.parse(fs.readFileSync(process.argv[2]));const {review,audit}=await prepare(protectedExport);fs.writeFileSync('/private/tmp/classroom-wording-review.json',JSON.stringify(review,null,2)+'\n');fs.writeFileSync(path.join(DATA,'classroom-wording-audit.json'),JSON.stringify(audit,null,2)+'\n');console.log('Prepared '+review.records.length+' revisions; '+audit.protectedQuestions.length+' teacher records protected.');})().catch(e=>{console.error(e);process.exitCode=1;});
