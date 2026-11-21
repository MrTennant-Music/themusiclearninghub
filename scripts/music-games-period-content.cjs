/* Identifying descriptions for four-by-four period-topic Connections sets.
   Concepts are associated with these periods, not exclusive to them. */
const D=require('../music-dictionary/music-concepts-data'),facts={};
for(const cats of Object.values(require('./music-games-column-groups.cjs')))for(const group of Object.values(cats))for(const [id,rows]of Object.entries(group))facts[id]=rows;
const styles=require('./music-games-styles-data.cjs').facts;
for(const c of D.concepts)if(styles[c.name])facts[c.id]=styles[c.name];
facts['MC-0057']=require('./build-music-games-scottish-music.cjs').facts['MC-0057'];
facts['MC-0261']=require('./build-music-games-playing-techniques.cjs').definitions.tremolando.facts;
Object.assign(facts,{
 'MC-0184':['Independent melodies together','Tunes with independent rhythms','Independent tunes combine','Parts keep distinct tune shapes'],
 'MC-0192':['Singing without instruments','No instrumental vocal backing','No instruments with the singers','Voice-only vocal performance'],
 'MC-0055':['Keys send air into organ pipes','Pipe ranks controlled by keys','Sustained keyboard pipe tones','Air-filled pipes played by keys'],
 'MC-0128':['Keys pluck internal strings','A keyboard with plucked strings','Key action plucks, not hammers','Plucked-string Baroque keyboard'],
 'MC-0131':['End-blown finger-hole woodwind','A fipple channels the blown air','Whistle mouthpiece, finger holes','End-blown tube, no reed required'],
 'MC-0174':['Rapid main-upper alternation','Ornament repeats main-upper pair','Main-upper pair alternates fast','Repeated upper-neighbour figure'],
 'MC-0186':['Unchanged bass melody repeats','Recurring multi-note bass line','Fixed bass under changing parts','Bass ostinato beneath variations'],
 'MC-0250':['Aria with A-B-A return plan','Da capo tells aria to restart','Baroque aria returns after B','Solo aria: opening music returns'],
 'MC-0296':['Original main theme of a fugue','First fugue-theme statement','Fugue opens with this main theme','Initial thematic idea in a fugue'],
 'MC-0286':['Fugue theme restated at dominant','Later voice: transposed theme','Fugal entry a fifth above tonic','Subject restated in dominant key'],
 'MC-0289':['Recurring secondary fugue melody','Companion line to fugal entries','Secondary line by subject entry','Repeated counter-line in a fugue'],
 'MC-0295':['Fugue entries overlap in time','New theme starts before old ends','Close overlapping theme entries','Theme re-enters before prior end'],
 'MC-0111':['Theme returns in altered forms','Main tune followed by variations','One tune developed in variations','A melody returns with changes'],
 'MC-0181':['Bass goes low-high-middle-high','Four-note broken-chord bass','Lowest-highest-middle-highest','Classical low-high-mid-high bass'],
 'MC-0254':['Whole three-part sonata plan','Whole sonata-form movement plan','Themes develop, then recap','Whole three-section sonata plan'],
 'MC-0251':['Opening section presents themes','Introduces first-second subjects','Opening thematic sonata section','First tonic, second related key'],
 'MC-0225':['Two violins, viola and cello','Four solo bowed-string players','Violin pair with viola and cello','Four strings; two violin parts'],
 'MC-0288':['Links first and second subjects','Sonata transition between themes','Connecting sonata-form passage','Link between sonata theme groups'],
 'MC-0127':['Orchestral plucked-string frame','Pedals adjust harp-string pitch','Strings in a triangular frame','String frame without a keyboard'],
 'MC-0158':['Pitch movement through semitones','Semitone moves outside the key','Semitone steps in a melody','Pitch steps using semitones'],
 'MC-0168':['A new key becomes established','Music changes its tonal centre','A move from C major to G major','Music establishes another key'],
 'MC-0292':['Motif linked to a dramatic idea','Theme for a dramatic character','Recurring motif for a character','Motif for an object or place'],
 'MC-0156':['No established tonal centre','No governing major or minor key','Music without a stable home key','No functional tonic framework'],
 'MC-0159':['Adjacent pitches sound together','Dense neighbouring-note chord','Close notes sound together','Tightly bunched chord pitches'],
 'MC-0175':['Six-note scale of whole tones','Scale built only from tone steps','Scale with no semitone steps','C D E F sharp G sharp A sharp'],
 'MC-0105':['Accents displace strong beats','Weak beats get rhythmic stress','Strong-beat stress is displaced','Ties displace strong-beat stress'],
 'MC-0245':['Metre such as 5/4 or 7/8','Unequal grouping, such as 2+3','A 7/8 bar grouped 2+2+3','Five or seven units form the bar'],
 'MC-0282':['Twelve pitch classes in order','All twelve pitch classes ordered','Fixed order of twelve pitches','Twelve-note source series'],
 'MC-0291':['Melodic interval directions flip','Upward intervals become downward','Melody is turned upside down','Pitch intervals flip direction']
});
const sets={
 renaissance:{N5:['MC-0184','MC-0192','MC-0167','MC-0172'],H:['MC-0218','MC-0192','MC-0167','MC-0172'],AH:['MC-0262','MC-0263','MC-0264','MC-0270']},
 baroque:{N4:['MC-0128','MC-0131','MC-0055','MC-0073'],N5:['MC-0144','MC-0174','MC-0186','MC-0128'],H:['MC-0248','MC-0249','MC-0252','MC-0250'],AH:['MC-0296','MC-0286','MC-0289','MC-0295']},
 classical:{N4:['MC-0057','MC-0120','MC-0110','MC-0111'],N5:['MC-0181','MC-0189','MC-0169','MC-0165'],H:['MC-0254','MC-0251','MC-0169','MC-0165'],AH:['MC-0299','MC-0225','MC-0288','MC-0181']},
 romantic:{N4:['MC-0057','MC-0127','MC-0073','MC-0111'],N5:['MC-0158','MC-0180','MC-0190','MC-0168'],H:['MC-0217','MC-0256','MC-0261','MC-0228'],AH:['MC-0294','MC-0271','MC-0292','MC-0299']},
 modern:{N5:['MC-0156','MC-0159','MC-0175','MC-0105'],H:['MC-0215','MC-0216','MC-0219','MC-0245'],AH:['MC-0282','MC-0291','MC-0293','MC-0300']}
};
module.exports={facts,sets};
