/* Level-specific concept-list columns. Styles remain owned by their existing builder.
   Use explicit answer families and context where general and specific terms overlap. */
const C=require('../music-games/core'),D=require('../music-dictionary/music-concepts-data'),groups=require('./music-games-column-groups.cjs');
const levels=[['N3','National 3','national3'],['N4','National 4','national4'],['N5','National 5','national5'],['H','Higher','higher'],['AH','Advanced Higher','advanced-higher']];
const columns=[['melody-harmony','Melody/harmony'],['rhythm-tempo','Rhythm/tempo'],['texture-structure-form','Texture/structure/form'],['timbre','Timbre']];
const wordNames={
 'MC-0035':'Harmony - chord','MC-0041':'Unison - octave',
 'MC-0015':'Leap','MC-0019':'Step','MC-0020':'Beats in the bar','MC-0021':'Accent','MC-0024':'Beat','MC-0037':'Ostinato','MC-0056':'Percussion','MC-0062':'Striking',
 'MC-0080':'Arpeggio','MC-0082':'Chord progressions','MC-0103':'Simple time','MC-0109':'Middle eight','MC-0110':'Ternary','MC-0157':'Chord progressions','MC-0162':'Descant',
 'MC-0176':'Compound time','MC-0182':'Binary','MC-0184':'Polyphonic','MC-0189':'Rondo','MC-0227':'Added sixth','MC-0228':'Diminished seventh','MC-0230':'Dominant seventh','MC-0235':'Modal',
 'MC-0242':'Three against two','MC-0278':'Chord two','MC-0279':'Chord progressions','MC-0280':'Polytonality','MC-0282':'Tone row'
};
const prompts={
 'MC-0052':'Name the general ensemble category for a group performing folk traditions, often with acoustic instruments and singers.',
 'MC-0059':'Name the specific Scottish social-dance ensemble commonly featuring accordion, fiddle, piano, bass and drum kit.',
 'MC-0109':'A contrasting passage in a popular song, traditionally eight bars long, often occurs after repeated verses or choruses. Name this song section.',

 'MC-0186':'An unchanged bass melody with fixed pitches and rhythm repeats throughout while upper parts develop. Name this repeating-bass device.',
 'MC-0191':'A bass line associated with jazz moves on each beat, commonly using steps and passing notes to connect the changing chords.',
 'MC-0017':'Name the general musical device of restating a phrase or section unchanged.',
 'MC-0300':'Give the German term literally meaning speech-song for a vocal delivery between speaking and singing.',
 'MC-0299':'Name the chamber ensemble whose standard classical combination is piano, violin and cello.',
 'MC-0289':'In a fugue, name the recurring secondary melody regularly heard alongside entries of the subject or answer.',
 'MC-0276':'An accented non-chord note takes a substantial part of a main note’s written duration before resolving to it by step. Name this ornament.',
 'MC-0207':'Give the Italian instruction for string players to pluck the strings instead of using the bow.',
 'MC-0193':'Give the Italian instruction for string players to use the bow.',
 'MC-0192':'Give the Italian term for voices singing without instrumental accompaniment.',
 'MC-0136':'Name the high adult male part in a standard SATB choir, above the bass part.',
 'MC-0120':'A single-reed woodwind with a mainly cylindrical bore, usually made from black wood or plastic.',
 'MC-0087':'Name the general term for a decorative note or group added to a melody, rather than one particular type of decoration.',
 'MC-0055':'A keyboard instrument whose traditional form sends air through ranks of pipes; electronic versions imitate its sustained tones.',
 'MC-0284':'In its standard form, this ornament plays the upper neighbour, main note, lower neighbour and main note. Name the ornament.',
 'MC-0242':'Two independent parts divide the same span evenly into three notes and two notes respectively. Name the cross-rhythm ratio, rather than a single-line tuplet.',
 'MC-0238':'Name the cadence moving from chord IV to chord I, often associated with the word Amen in a hymn.',
 'MC-0235':'Name the general term for music using pitch patterns such as Dorian or Mixolydian, rather than naming one particular pattern.',
 'MC-0234':'In its standard classical form, this minor scale raises the sixth and seventh degrees ascending and uses the natural minor notes descending.',
 'MC-0227':'A major or minor triad has a major sixth above its root added, as in C-E-G-A. Name the added-note chord type.',
 'MC-0225':'Name the ensemble or chamber work for exactly two violins, one viola and one cello.',
 'MC-0211':'A North Indian pair of hand drums of different sizes and pitches, traditionally called dayan and bayan, produces contrasting finger and palm strokes.',
 'MC-0203':'A pair of cymbals mounted on a foot-operated stand can be played open or closed with sticks, or closed together using the pedal.',
 'MC-0179':'Give either Italian instruction meaning gradually becoming slower.',
 'MC-0178':'Which Italian tempo word literally means moderately, indicating a speed between fast and slow?',
 'MC-0176':'Name the type of metre represented by 6/8, 9/8 and 12/8, with two, three or four dotted-crotchet beats per bar. Give the metre type, not one example signature.',
 'MC-0158':'Name the general pitch adjective for movement by semitones, including notes outside the main key, rather than the name of a particular densely packed chord.',
 'MC-0103':'Name the type of metre represented by 2/4, 3/4 and 4/4, where each main beat divides into two equal parts. Give the metre type, not one example signature.',
 'MC-0101':'Give either Italian instruction meaning gradually becoming slower.',
 'MC-0098':'Name the type of metre in which each main beat divides into three equal parts, rather than a particular time signature.',
 'MC-0061':'An ensemble of different-sized steel pans, traditionally associated with Trinidad and Tobago, plays melody, harmony and bass parts.',
 'MC-0056':'Name the whole instrument family whose members are mainly struck, shaken or scraped, and which includes both tuned and untuned instruments.',
 'MC-0037':'Name the general term for a short musical pattern repeated persistently, also called a riff in popular music.',
 'MC-0032':'Give the English comparative tempo direction meaning less quickly.',
 'MC-0026':'Give the English comparative tempo direction meaning more quickly.',
 'MC-0023':'Give the National 3 Italian tempo marking meaning fast and cheerful or lively.',
 'MC-0022':'Give the National 3 Italian tempo marking meaning slowly or at ease.',
 'MC-0010':'Name the general term for a single group of two or more different notes sounded together, such as C, E and G played at once.',
 'MC-0020':'The regular pulse is grouped into recurring bars of two, three or four main beats. Which concept-list phrase describes this grouping?',
 'MC-0035':'Name the general musical element concerned with combining different pitches simultaneously, including chords and the way they move.',
 'MC-0039':'One featured voice or instrument performs the main part, either alone or with accompaniment. What is the term for the featured performer or part?',
 'MC-0040':'A soloist or group performs without any supporting accompaniment. What term describes the absence of accompaniment?',
 'MC-0058':'A string is pulled and released with a finger or plectrum to make a note, rather than being bowed or struck.',
 'MC-0063':'Name the orchestral family containing violin, viola, cello and double bass.',
 'MC-0084':'The music has a tonal centre and uses the scale pattern tone-tone-semitone-tone-tone-tone-semitone. Name the tonality.',
 'MC-0085':'The music has a tonal centre whose tonic triad has a minor third. Its scales may be natural, harmonic or melodic. Name the tonality.',
 'MC-0083':'An accompaniment holds or repeats one note or a fifth beneath a melody, without a sequence of changing chords. Name the accompaniment.',
 'MC-0088':'A bass note is held or repeated while the chords above it change, sometimes clashing with the held note.',
 'MC-0090':'Name the general term for a set of notes arranged in ascending or descending stepwise order, rather than a particular five-note type.',
 'MC-0099':'Name the general rhythmic feature created by adding half of a note’s written value with a dot, often producing unequal long-short or short-long pairs.',
 'MC-0107':'Name the strict imitative form in which a following part copies the complete melody at a fixed delay.',
 'MC-0108':'Name the general device in which one part copies an idea heard shortly before in another part; the whole melody need not be copied exactly.',
 'MC-0161':'Name the general term for a distinct secondary melody heard alongside the main tune, rather than the specific high vocal part.',
 'MC-0162':'Name the specific high vocal part that decorates a main tune by singing an independent melody above it.',
 'MC-0163':'A pianist or harpist sweeps rapidly across consecutive notes between two pitches. Name this sliding run across the intervening notes.',
 'MC-0164':'Name the general term for a very short ornamental note immediately before a main note, rather than a repeated alternation of two notes.',
 'MC-0170':'An electric guitarist bends a sounding string, changing its pitch continuously without playing a run of separate notes. Name the pitch effect.',
 'MC-0184':'Two or more independent melodic lines sound together, each retaining its own melodic shape and rhythmic identity. Give either equivalent texture term.',
 'MC-0200':'Give the Italian instruction meaning with a mute: a device is fitted to change the instrument’s normal tone.',
 'MC-0251':'In sonata form, name the opening large section which presents the first and second subjects, normally in contrasting keys.',
 'MC-0259':'A string player lightly touches a nodal point so an upper partial sounds clearly instead of the normal fundamental.',
 'MC-0261':'A string player rapidly repeats a note with short bow strokes to create a trembling sound; the technique can also alternate separated pitches.',
 'MC-0278':'In C major, D-F-A is built on the second scale degree and F-A-D is its first inversion. Give the Roman-numeral chord name, with or without mentioning the inversion.',
 'MC-0279':'Give the Roman-numeral chord progression topic covering the tonic, subdominant, dominant and submediant in both major and minor keys.',
 'MC-0297':'Name the historical ensemble term, especially associated with Renaissance instruments, which may describe a whole group from one instrument family.'
};
const extraAliases={
 'MC-0020':['Two three or four beats in the bar','2, 3 or 4 beats per bar','2 3 or 4 beats in the bar'],
 'MC-0037':['Ostinato','Riff'], 'MC-0082':['Chord progressions','Chords I IV and V','I IV V','I, IV and V','I-IV-V','I, IV, V','Chords I, IV and V'], 'MC-0103':['Simple time'],
 'MC-0109':['Middle eight','Bridge'], 'MC-0111':['Theme and variations'], 'MC-0157':['Chord progressions','Chords I IV V and VI','I IV V VI','I, IV, V and VI','I-IV-V-VI','I, IV, V, VI','Chords I, IV, V and VI'],
 'MC-0176':['Compound time'], 'MC-0184':['Polyphonic','Contrapuntal','Polyphony','Counterpoint','Polyphonic / Contrapuntal'],
 'MC-0201':['Flutter tonguing','Fluttertonguing'], 'MC-0227':['Added sixth'], 'MC-0228':['Diminished seventh'], 'MC-0230':['Dominant seventh'],
 'MC-0235':['Mode','Modal'], 'MC-0242':['Three against two'], 'MC-0278':['Chord II','Chord two','Chord II and first inversion','Chord II and its first inversion','II','IIb','ii6'],
 'MC-0279':['Chord progressions','Chords I IV V and VI','I IV V VI','I, IV, V and VI','I-IV-V-VI','I, IV, V, VI','Chords I, IV, V and VI'], 'MC-0280':['Polytonality','Bitonality'], 'MC-0282':['Tone row','Note row']
};
// Do not offer a parent term as a false answer to its own example (or vice versa).
const related=[['MC-0052','MC-0059'],['MC-0181','MC-0186'],['MC-0181','MC-0191'],['MC-0186','MC-0191'],['MC-0158','MC-0159'],['MC-0242','MC-0247'],['MC-0010','MC-0035'],['MC-0037','MC-0017'],['MC-0089','MC-0090'],['MC-0107','MC-0108'],['MC-0099','MC-0102'],['MC-0109','MC-0112'],['MC-0161','MC-0162'],['MC-0164','MC-0174'],['MC-0163','MC-0170'],['MC-0250','MC-0254'],['MC-0249','MC-0253']];
const gradingAliases={
 'MC-0048':['Chorus','Choral group'], 'MC-0052':['Folk band','Folk ensemble'],
 'MC-0064':['Strum'], 'MC-0098':['Compound metre','Compound meter'],
 'MC-0242':['3:2','3 over 2','Three over two','2 against 3','Two against three','2:3'],
 'MC-0288':['Transition','Transition passage'],

 'MC-0016':['Question and answer','Call and response'],
 'MC-0020':['Beats in the bar','Two, three or four beats in the bar','Two three or four beats in the bar','2, 3 or 4 beats per bar','2 3 or 4 beats in the bar'],
 'MC-0015':['Leap','Leaping'], 'MC-0019':['Step','Stepwise'],
 'MC-0028':['Off beat','Off-beat','Offbeat'], 'MC-0029':['On beat','On-beat'], 'MC-0030':['Fermata'],
 'MC-0034':['With accompaniment'], 'MC-0040':['Without accompaniment'], 'MC-0041':['In unison'],
 'MC-0049':['Drumkit','Drum set'], 'MC-0051':['Violin'],
 'MC-0056':['Percussion','Tuned and untuned percussion'], 'MC-0062':['Striking','Hitting'],
 'MC-0080':['Broken chord','Arpeggio','Broken chords','Arpeggios'], 'MC-0081':['Modulation'],
 'MC-0088':['Pedal point','Pedal note'], 'MC-0091':['Scat'], 'MC-0095':['Accel.','Accel'],
 'MC-0096':['Pickup','Pick-up','Upbeat'], 'MC-0099':['Dotted rhythm'],
 'MC-0101':['Ritardando','Rall.','Rall','Rit.','Rit'],
 'MC-0103':['Simple time','Simple metre','Simple meter'],
 'MC-0105':['Syncopated'], 'MC-0110':['Ternary','ABA','Ternary form'],
 'MC-0112':['Verse-chorus','Verse chorus','Verse and chorus form'],
 'MC-0087':['Embellishment'], 'MC-0113':['Contralto'], 'MC-0167':['Melisma'], 'MC-0257':['Coloratura singing'],
 'MC-0114':['Backing singers','Backing voices'], 'MC-0117':['Electric bass'],
 'MC-0119':['Violoncello'], 'MC-0121':['Cymbal'], 'MC-0126':['Güiro'],
 'MC-0130':['Panpipes','Pan-pipes'], 'MC-0137':['Kettledrums','Kettle drums'],
 'MC-0161':['Counter melody','Counter-melody'], 'MC-0162':['Descant'],
 'MC-0166':['Inverted pedal point','Inverted pedal note'], 'MC-0168':['Change of key'],
 'MC-0171':['Half step','Half-step'], 'MC-0173':['Whole tone','Whole step','Whole-step'],
 'MC-0175':['Whole tone scale'], 'MC-0176':['Compound time','Compound metre','Compound meter'],
 'MC-0177':['Cross rhythm','Cross-rhythm','Cross-rhythms'],
 'MC-0179':['Rallentando','Rit.','Rit','Rall.','Rall'],
 'MC-0186':['Bass ostinato','Basso ostinato'], 'MC-0182':['Binary','AB','Binary form'], 'MC-0187':['Homophony'],
 'MC-0189':['Rondo','ABACA','Rondo form'], 'MC-0190':['Strophic form'],
 'MC-0196':['Bodhrán'], 'MC-0197':['Bongos'], 'MC-0199':['Clàrsach'],
 'MC-0203':['Hi-hat','Hi hat','Hi hat cymbals','Hihat'], 'MC-0208':['Reverberation'],
 'MC-0209':['Roll','Drum roll','Percussion roll'], 'MC-0231':['Harmonic minor'],
 'MC-0234':['Melodic minor'], 'MC-0237':['Obligato'], 'MC-0245':['Irregular time signature','Irregular metre','Irregular meter'],
 'MC-0246':['Time change','Changes of time signature'], 'MC-0247':['Triplet'],
 'MC-0248':['Continuo'], 'MC-0254':['Sonata allegro form','Sonata-allegro form'],
 'MC-0255':['Theme'], 'MC-0256':['Through composed'], 'MC-0259':['Harmonic'],
 'MC-0261':['Tremolo'], 'MC-0283':['Augmented fourth','Diminished fifth'],
 'MC-0289':['Counter subject','Counter-subject'], 'MC-0296':['Fugue subject','Theme']
};
function aliases(c){
 const searchAliases=['MC-0016','MC-0176'].includes(c.id)?[]:(c.aliases||[]);
 const values=[c.name,...searchAliases,...(extraAliases[c.id]||[]),...(gradingAliases[c.id]||[])];
 const seen=new Set();return values.filter(value=>{const key=C.canonical(value);if(seen.has(key))return false;seen.add(key);return true;}).slice(0,8);
}
const wordPrompts={
 'MC-0109':'Give the British song-section name for a contrasting passage, traditionally eight bars. Write the number in words.',
 'MC-0288':'Give the linking word used as an alternative to transition for the passage between the first and second sonata-form subjects.',

 'MC-0037':'Give the Italian term for a short repeating musical pattern, also called a riff.',
 'MC-0080':'Give the Italian term for playing the notes of a chord one after another.',
 'MC-0082':'Give the general term for a sequence of chords, such as I-IV-V in a major key.',
 'MC-0101':'Give the Italian gradual slow-down instruction beginning rall-.',
 'MC-0157':'Give the general term for a sequence of chords, such as I-IV-V-VI in a major key.',
 'MC-0179':'Give the Italian gradual slow-down instruction beginning rit-.',
 'MC-0278':"Which chord is built on the second degree of a major scale? Write 'chord' followed by the number in words.",
 'MC-0279':'Give the general term for sequences of chords such as I, IV, V and VI in major and minor keys.'
};
function entriesFor(code,category){const [,label,file]=levels.find(([id])=>id===code)||[];if(!label)throw Error('Unknown level '+code);const bank=require(`../data/questions/music-concepts/${file}.json`);
 return D.concepts.filter(c=>c.level===label&&c.categories.includes(category)&&c.id!=='MC-0188'&&!require('./music-games-excluded-concepts.cjs').ids.has(c.id)).map(c=>{const q=bank.questions.find(q=>q.conceptId===c.id&&q.answerMode==='concept');if(!q&&!prompts[c.id])throw Error('Missing clue '+c.id);const answer=c.id==='MC-0184'?'Polyphonic / Contrapuntal':c.name;return {ids:c.id==='MC-0184'?['MC-0184','MC-0188']:[c.id],conceptId:c.id,answer,correctAnswers:aliases(c),prompt:prompts[c.id]||q.question.replace(/\s*(?:What is this|Which concept is this)\?\s*$/i,''),word:wordNames[c.id]||c.name.normalize('NFD').replace(/[\u0300-\u036f]/g,''),wordPrompt:wordPrompts[c.id]||(c.id==='MC-0184'?'Two or more independent melodic lines sound together. Give the texture term ending in -phonic.':c.id==='MC-0020'?'Complete the concept-list phrase: 2, 3 or 4 _____.':c.id==='MC-0278'?'In a major key, what numbered chord is built on the second scale degree? Write the number as a word.':null)};});
}
function alternatives(entry,entries){return entries.filter(other=>other!==entry&&!related.some(pair=>pair.includes(entry.conceptId)&&pair.includes(other.conceptId))).map(other=>other.answer).slice(0,3);}
function partitions(entries,size){const count=Math.ceil(entries.length/size),result=[];for(let i=0,offset=0;i<count;i++){const length=Math.ceil((entries.length-offset)/(count-i));result.push(entries.slice(offset,offset+length));offset+=length;}return result;}
function makeActivities(){const result=[];
 for(const [code,label]of levels)for(const [slug,category]of columns){if(code==='AH'&&slug==='rhythm-tempo')continue;const entries=entriesFor(code,category);
  for(const [key,template]of [['wordsearch','wordsearch'],['crossword','crossword']]){
   const wordGame=['wordsearch','crossword'].includes(template),chunks=partitions(entries,wordGame?(['N3','N4'].includes(code)?12:15):template==='match-up'?24:200);
   chunks.forEach((chunk,index)=>{const id=`hub-${code.toLowerCase()}-${slug}-${key}-${index+1}`,activity=C.makeActivity({id,title:category+(chunks.length>1?' '+(index+1):''),level:code,template,folder:'Music Dictionary',tags:[category,label],description:`Practise the ${label} ${category} concepts${chunks.length>1?' — collection '+(index+1)+' of '+chunks.length:''}.`,options:{shuffle:true,timer:0,sound:true,theme:'blue'},revision:3,updatedAt:'2026-10-31T21:00:00.000Z',items:chunk.map((entry,i)=>({id:`${id}-${i+1}`,prompt:wordGame?(entry.wordPrompt||entry.prompt):entry.prompt,answer:wordGame?entry.word:entry.answer,...(template==='type-the-answer'?{correctAnswers:entry.correctAnswers}:{}),...(['quiz','true-or-false'].includes(template)?{distractors:alternatives(entry,entries),answerOptions:[entry.answer,...alternatives(entry,entries)]}:{})})),...(template==='wordsearch'?{editorMode:'with-clues'}:{})});const errors=C.validateActivity(activity);if(errors.length)throw Error(id+': '+errors.join('; '));result.push(activity);});
  }
  const set=groups[code]?.[slug];if(!set||Object.keys(set).length!==4)throw Error('Missing four-group set '+code+' '+slug);
  const groupRows=Object.entries(set).flatMap(([conceptId,facts])=>{const entry=entries.find(e=>e.conceptId===conceptId);if(!entry||facts.length!==4||facts.some(f=>f.length>32))throw Error('Invalid group '+conceptId+': '+facts.filter(f=>f.length>32).join(' / '));return facts.map(fact=>({prompt:fact,answer:fact,group:entry.answer}));});
  for(const [key,template]of [['sort','group-sort'],['connections','matching-pairs']]){const id=`hub-${code.toLowerCase()}-${slug}-${key}-1`;const activity=C.makeActivity({id,title:category,level:code,template,folder:'Music Dictionary',tags:[category,label],description:`Revise four contrasting ${label} ${category} concepts.`,instructions:template==='group-sort'?'Place each description under its named concept.':'Find four descriptions of each concept. Find all four groups.',options:{shuffle:true,timer:0,sound:true,theme:'blue'},revision:3,updatedAt:'2026-10-31T21:00:00.000Z',items:groupRows.map((row,i)=>({id:`${id}-${i+1}`,...row}))});const errors=C.validateActivity(activity);if(errors.length)throw Error(id+': '+errors.join('; '));result.push(activity);}
 }
 return result;
}
function build(){const activities=makeActivities();require('./music-games-write-activities.cjs').writeActivities(activities);console.log(`Created ${activities.length} activities for 19 level-specific columns; existing Styles retained.`);return activities;}
if(require.main===module)build();module.exports={levels,columns,entriesFor,aliases,alternatives,partitions,makeActivities,build,related};
