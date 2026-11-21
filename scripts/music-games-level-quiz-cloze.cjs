/* Authored two-gap facts. Each row has four deliberately false alternatives,
   so every concept has six distinct tiles and one unambiguous completion. */
const rows=`
0001|A common chord cycle lasts [[twelve bars]], and expressive flattened pitches are called [[blue notes]].|three bars; five bars; natural notes; silent notes
0002|Players often [[make up]] solos through [[improvisation]].|copy exactly; remain silent; tuning; notation copying
0003|This broad style comes from [[Latin America]] and often features prominent [[percussion]].|Scandinavia; East Asia; plainchant; solo organ
0004|A stage story combines [[spoken dialogue]] with songs, acting and often [[dancing]].|complete silence; instrumental cadenzas; tuning; conducting only
0005|Songs commonly have memorable [[tunes]] and repeated [[words]].|unpitched noise; silence; clefs; barlines
0006|Amplified [[electric guitars]] often play riffs over a strong [[driving beat]].|recorders; harpsichords; unmeasured pulse; silent beat
0007|This American dance style became popular in the [[1950s]] and combines rhythm and blues with [[country]].|1450s; 1750s; plainchant; Renaissance madrigals
0008|Traditional music from [[Scotland]] is often played by a [[Scottish dance band]].|Japan; Brazil; steel band; organ
0009|Pitch moves [[upwards]], with later notes becoming [[higher]].|downwards; sideways; lower; unchanged
0010|A chord combines [[different pitches]] at the [[same time]].|one pitch only; identical pitches only; different times; wrong clef
0011|The harmony moves from [[one chord]] to [[another chord]].|one instrument; one clef; another clef; another tempo
0012|Pitch moves [[downwards]], with later notes becoming [[lower]].|upwards; sideways; higher; unchanged
0013|Notes [[clash]], producing a sense of harmonic [[tension]].|blend without tension; disappear; silence; resolution
0014|A performer [[makes up]] music while [[performing]].|copies exactly; erases; remaining silent; only listening
0015|A melody moves to a [[non-neighbouring]] note, rather than moving by [[step]].|neighbouring; repeated; unison; silence
0016|An [[opening phrase]] is followed by a [[responding phrase]].|final barline; key signature; tuning note; clef change
0017|A musical idea is heard [[again]] without being [[changed]].|only once; never; preserved; repeated exactly
0018|A phrase repeated above its original level starts [[higher]]; repeated below it starts [[lower]].|louder; softer; faster; slower
0019|A melody moves between [[neighbouring]] notes with [[no notes skipped]].|widely separated; identical; large gaps; several notes skipped
0020|The regular [[pulse]] is grouped into bars containing two, three or four main [[beats]].|pitch; tone colour; clefs; instruments
0021|A note receives extra [[emphasis]], making it [[stand out]].|silence; softness; disappear; blend unnoticed
0022|The tempo is [[slow]], and the Italian word can suggest [[at ease]].|fast; accelerating; very lively; getting faster
0023|The tempo is [[fast]], and the Italian word can suggest [[cheerful]].|slow; slowing down; at ease; very solemn
0024|A regular musical [[pulse]] can be followed by tapping or [[clapping]].|key signature; chord; changing clefs; reading lyrics silently
0025|A short rhythmic decoration is played on the [[drum kit]], often near the end of a [[phrase]].|solo flute; harp; key signature; stave
0026|The music becomes [[quicker]], so the tempo [[increases]].|slower; quieter; decreases; stays unchanged
0027|A strong [[walking pulse]] is usually grouped into [[two or four]] beats per bar.|free pulse; silent pulse; three only; five or seven only
0028|Notes fall [[between]] the main beats or on their [[weaker]] parts.|exactly on; outside time; strongest; first only
0029|Notes coincide [[exactly]] with the [[main beat]].|never; approximately between beats; written clef; key signature
0030|A performer [[holds]] a note or rest for [[longer]] than written.|cuts short; skips; less time; no time
0031|A [[lively]] Scottish dance usually has [[two or four]] beats per bar.|slow and solemn; silent; three only; five or seven only
0032|The music becomes [[less quick]], so the tempo [[decreases]].|quicker; louder; increases; stays unchanged
0033|This [[dance]] has [[three]] beats in each bar.|march; unpitched noise; two; four
0034|The main part has [[support]] from other voices or [[instruments]].|no backing; complete isolation; clefs; barlines
0035|This element concerns [[simultaneous]] pitches, including [[chords]].|silent; isolated successive; tempo markings; bar numbers
0036|Two notes have the [[same letter name]] and are [[eight scale degrees]] apart.|different letter names; no pitch; two scale degrees; three scale degrees
0037|A short musical [[pattern]] is repeated [[persistently]].|silence marking; final barline; only once; at random pitches each time
0038|The parts perform the [[same melody]] but begin at [[different times]].|unrelated melodies; no melody; exactly the same instant; the final barline only
0039|There is [[one featured]] performer, who may play with or without [[accompaniment]].|no featured; several equally featured; a key signature; a time signature
0040|The performers have [[no]] supporting [[accompaniment]].|continuous; orchestral; clef; key signature
0041|The performers share the [[same melody]] at the [[same pitch]].|unrelated melodies; different rhythms only; octave below only; fifth above only
0042|A [[free reed]] vibrates as air is moved by [[bellows]].|double reed; bowed string; a bow; mallets
0043|A [[hollow body]] naturally amplifies vibrating [[strings]].|drum membrane; solid metal tube; reeds; lips
0044|Air is supplied from a [[bag]], while a melody sounds over [[steady background notes]].|drum skin; hollow guitar body; changing chords; silent rests
0045|The performer directs [[air]] into or across a wind [[instrument]].|a bow; a mallet; drum membrane; string only
0046|The [[bow]] is drawn across [[strings]].|plectrum; drumstick; reeds; metal bars
0047|The player's [[lips]] vibrate against a [[mouthpiece]].|fingers alone; reed; drum skin; keyboard
0048|An organised group of [[singers]] performs [[together]].|drummers only; violinists only; in complete silence; without voices
0049|One performer plays [[several drums]], usually using [[sticks]] and foot pedals.|a solo violin; a harp; a bow; wind mouthpieces
0050|Vibrating strings are detected by [[pickups]], and the signal is sent to an [[amplifier]].|timpani pedals; reeds; acoustic horn; bow
0051|This [[bowed]] string instrument is associated with [[traditional music]].|blown; struck with sticks; electronic dance music only; spoken dialogue only
0052|This ensemble performs [[folk traditions]], often using [[acoustic]] instruments and singers.|serial rows only; orchestral symphonies only; exclusively electronic; silent
0053|Notes join [[smoothly]], with [[no gaps]] between them.|abruptly; separately; clear gaps; rests between all notes
0054|Its four main families include strings, woodwind, brass and [[percussion]], led by a [[conductor]].|electronics only; voices only; lone drummer; solo vocalist
0055|In a pipe instrument, [[air]] passes through [[pipes]] to make the sound.|a bow; a mallet; strings; drum skins
0056|Members of this family may be [[struck]], shaken or [[scraped]].|bowed; blown; sung; plucked only
0057|Pressing a [[key]] causes a hammer to strike a [[string]].|valve; pedal reed; pipe; drum skin
0058|A string is [[pulled]] and then [[released]].|blown; bowed continuously; muted permanently; struck with a mallet
0059|The bellows instrument is the [[accordion]], and the bowed melody instrument is the [[fiddle]].|piccolo; bassoon; oboe; French horn
0060|Notes are cut [[short]], leaving [[gaps]] between them.|long; connected; slurs; sustained ties
0061|The ensemble uses [[steel pans]], traditionally associated with [[Trinidad and Tobago]].|bagpipes; tablas; Scotland; India
0062|The performer [[hits]] an instrument using a hand, stick, mallet or [[beater]].|bows; blows into; mouthpiece; plectrum for strumming
0063|Sound comes from [[vibrating strings]], usually played with a [[bow]] in an orchestra.|reeds; drum skins; mouthpiece; drumstick
0064|A finger or plectrum sweeps across [[several strings]], usually sounding a [[chord]].|a reed; one drum skin; single sustained pipe; breath noise
0067|Sound is produced by the human [[vocal folds]] when [[singing]] or speaking.|piano strings; drum skins; bowing; blowing a flute
0068|Players [[blow]] into or across the instrument; a column of [[air]] vibrates.|pluck; strike; string; drum skin
0069|Some traditions feature layered [[percussion]] and [[call and response]] singing.|solo harpsichord only; silent movement; twelve-tone rows only; equal-tempered tuning only
0070|This historical period is approximately [[1600–1750]] and is associated with [[Bach and Handel]].|1400–1500; 1850–1950; Haydn and Mozart; Debussy and Ravel
0071|An instrumental [[soloist]] is featured with an [[orchestra]].|conductor only; actor only; unaccompanied choir; silent audience
0072|This Scottish Gaelic vocal style is also called [[puirt-a-beul]] and uses rhythmic [[syllables]].|ceol mor; pibroch; bow strokes; drum rolls
0073|A staged [[dramatic story]] is told mostly through [[singing]].|scale exercise; drum pattern; instrumental improvisation only; silent mime only
0074|A [[syncopated melody]] is played over a steady left-hand bass-and-[[chord]] accompaniment.|plainchant melody; silent melody; reed; bow
0075|Rhythmic [[speech]] is often delivered over a [[hip-hop beat]].|bowing; flute playing; solo organ drone only; silent pulse
0076|This style originated in [[Jamaica]], with short chords often emphasising [[off-beats]].|Germany; India; first beats only; silent beats
0077|This [[19th-century]] period is associated with composers such as [[Chopin and Liszt]].|15th-century; 17th-century; Bach and Handel; Haydn and Mozart
0078|A [[narrative song]] is sung in [[Scots]].|wordless instrumental; drum solo; Latin; Italian
0079|A big band includes trumpets, trombones and [[saxophones]], with a [[rhythm section]].|bassoons only; recorders only; plainchant choir; string quartet only
0080|The notes of a [[chord]] are played [[one after another]].|drum roll; key signature; all at once; silently
0081|The tonal centre moves from one [[key]] to [[another]].|tempo; instrument; the same key; silence only
0082|In a major key, I is the [[tonic]] and V is the [[dominant]].|subdominant; submediant; supertonic; mediant
0083|A sustained or repeated note or fifth supports a [[melody]] without a sequence of changing [[chords]].|barline; clef; instruments; tempos
0084|The music has a [[tonal centre]] and uses a [[major]] scale.|no tonal centre; unpitched notes only; minor; random note order
0085|The music has a [[tonal centre]] and uses a [[minor]] scale.|no tonal centre; unpitched notes only; major; random note order
0086|Two notes share a [[letter name]] and are separated by [[eight scale degrees]].|clef only; rhythm only; three scale degrees; five scale degrees
0087|A decorative note or group is added to a [[melody]] as an [[embellishment]].|barline; time signature; instrument family; ensemble size
0088|A note is held in the [[bass]] while the [[chords]] above it change.|highest voice only; melody only; tempo markings; bar numbers
0089|This scale contains [[five]] different pitches within an [[octave]].|six; seven; barline; semiquaver
0090|Upward scale movement is [[ascending]]; downward scale movement is [[descending]].|louder; softer; faster; slower
0091|Jazz singers improvise using [[nonsense syllables]] instead of [[words]].|bow strokes; drum strokes; pitches; rhythms
0093|An accompaniment may alternate a [[bass note]] on the beat with a [[chord]] off the beat.|clef; time signature; rest only; tuning instruction
0094|The performer returns to the [[previous tempo]] after a temporary [[change]].|previous pitch only; loudest dynamic; clef; instrument
0095|The tempo becomes [[gradually]] [[faster]].|suddenly; never; slower; quieter
0096|Notes before the first [[full bar]] lead into the first strong [[beat]].|final barline; key signature; instrument; accidental
0097|The Italian instruction means at a [[walking]] [[pace]].|running; crawling; pitch; dynamic
0098|Each main [[beat]] divides into [[three equal parts]].|key; chord; two equal parts; four equal parts
0099|An augmentation dot adds [[half]] the note's original value, often producing [[unequal]] rhythmic pairs.|double; none of; equal; silent
0100|This [[lively]] Scottish dance has main beats dividing into [[three equal parts]].|slow and solemn; silent; two equal parts; five equal parts
0101|The tempo becomes [[gradually]] [[slower]].|suddenly; never; faster; louder
0102|A [[short accented]] note is followed by a [[longer]] note.|long unaccented; equally long; shorter; silent
0103|Each main beat divides into [[two equal parts]]; 2/4, 3/4 and 4/4 are [[simple]] metres.|three equal parts; five equal parts; compound; free
0104|This Scottish dance commonly has [[four]] beats per bar and features [[Scotch snaps]].|three; five; tone rows; glissandi only
0105|Rhythmic emphasis falls on [[weak beats]] or [[off-beats]].|strong beats only; first beats only; clefs; barlines
0106|A featured [[soloist]] displays technical skill in a section of a [[concerto]].|conductor; audience; plainchant; choral hymn
0107|A following part copies the [[complete melody]] at a fixed [[delay]].|key signature only; last chord only; dynamic; instrument change
0108|One part [[copies]] an idea previously heard in [[another part]].|erases; contradicts; complete silence; the key signature
0109|A [[contrasting]] popular-song passage is traditionally [[eight bars]] long.|identical; unchanging; two bars; twelve beats
0110|The three sections are A, [[B]] and a return of [[A]].|C; D; E; F
0111|A main [[theme]] returns in [[altered]] forms.|barline; clef; identical only; silent
0112|Verses change the [[words]], while a chorus repeats similar words and [[music]].|clefs; instruments only; conductor; key signature only
0113|In SATB, this part lies [[below soprano]] and [[above tenor]].|above soprano; below bass; below tenor; above all voices
0114|These singers [[support]] the [[lead vocalist]].|replace every note of; conduct; drummer only; audience only
0115|This is the [[lowest]] standard adult male [[voice]].|highest; middle; woodwind; brass instrument
0116|A large untuned [[drum]] produces a [[low]] sound.|string; reed; high metallic; whistle-like
0117|This electric instrument usually has [[four strings]] and plays [[low pitches]].|six reeds; eight drum skins; high flute pitches; spoken words
0118|Wind players buzz their lips in the [[brass]] section; drums belong to [[percussion]].|woodwind; strings; an unaccompanied choir; solo piano
0119|The strings are normally [[bowed]], and the instrument commonly reads [[bass clef]].|blown; struck by piano hammers; percussion clef; treble clef only
0120|The instrument uses a [[single reed]] and has a mainly [[cylindrical]] bore.|double reed; bow; conical only; rectangular
0121|Round [[metal]] plates can be struck together or with [[sticks]].|wooden; plastic reed; bows; plectrums only
0122|The electronic effect changes the [[waveform]], creating a [[fuzzy]] sound.|time signature; key signature; clear; uncoloured
0123|It is larger than the [[cello]] and plays the [[lowest]] standard orchestral string part.|violin; viola; highest; middle
0124|This woodwind is played by blowing [[across an opening]], without a [[reed]].|through a double reed; through a single reed; mouth opening; finger hole
0125|Tuned [[metal bars]] produce a bright, [[bell-like]] sound.|wooden bars; drum skins; breathy; bowed
0126|A stick is [[scraped]] along [[ridges]] to create a rasping sound.|bowed; blown; strings; keys
0127|The strings are [[plucked]] and stretched across a [[frame]].|bowed only; blown; drum skin; mouthpiece
0128|Pressing a key causes a string to be [[plucked]], rather than [[struck by a hammer]].|blown; bowed; struck by a mallet; excited by a reed
0129|A device changes an instrument's [[tone colour]], often also reducing its [[volume]].|written clef; key signature; number of beats; number of bars
0130|Tubes of different [[lengths]] produce different [[pitches]].|colours only; weights only; clefs; rhythms only
0131|This end-blown instrument uses [[finger holes]] and a [[whistle-like]] mouthpiece.|valves; piano keys; cup-shaped brass; double-reed
0132|A [[single reed]] is attached to a mouthpiece on a mainly [[metal]] instrument.|double reed; bowed string; wooden percussion; membrane
0133|Wires under the lower [[skin]] produce a crisp [[rattling]] sound.|reed; string; whistle-like; smooth bowed
0134|This is the [[highest]] standard female [[voice]].|lowest; middle; instrument family; percussion instrument
0135|A frame with metal [[jingles]] may also have a [[drum skin]].|strings; reeds; keyboard; mouthpiece
0136|In SATB this male part lies [[above bass]] and [[below alto]].|below bass; above soprano; above alto; below every part
0137|These are [[tuned]] drums with [[bowl-shaped]] bodies.|untuned; unpitched; string-shaped; pipe-shaped
0138|A suspended [[metal bar]] is bent into an open [[triangle]].|wooden reed; drum skin; circle; square
0139|A brass instrument changes pitch using a [[slide]], in place of the usual [[valves]].|bow; reed; strings; finger holes
0140|This is the [[highest]] common orchestral [[brass]] instrument.|lowest; middle; string; woodwind
0141|This [[bowed]] string instrument plays a [[high]] orchestral part.|blown; struck with sticks; low bass; drum
0142|This ensemble includes [[woodwind]] and brass alongside [[percussion]].|orchestral strings only; solo voices only; an unaccompanied choir; solo piano
0143|Tuned [[wooden bars]] are struck with [[beaters]].|metal bars; strings; bows; breath
0144|A [[solo song]] in an [[opera]] lets one singer present an extended melody.|drum pattern; spoken monologue; instrumental concerto; string symphony
0145|A traditional song from [[North-East Scotland]] was sung by [[farm workers]].|southern Italy; northern India; Roman priests; Renaissance courtiers
0146|Traditional [[Celtic folk music]] is fused with [[rock]].|plainchant; serialism; opera; Baroque fugue
0147|In a large vocal work, the term describes a group of [[singers]] or the [[music]] written for them.|drummers; violinists; scenery; costumes
0148|This period follows the [[Baroque]] period and precedes the [[Romantic]] period.|Renaissance; Medieval; modern electronic; prehistoric
0149|A sacred text is sung in [[Scottish Gaelic]], traditionally in churches of the [[Western Isles]].|Latin; German; Caribbean; Indian subcontinent
0150|This religious vocal music has roots in [[African American]] [[church traditions]].|Renaissance Italian; German Lutheran only; court dances; military marches
0151|The plucked string instrument is the [[sitar]]; the pair of hand drums is the [[tabla]].|accordion; fiddle; clarsach; bodhran
0152|Short patterns [[repeat]] and undergo [[gradual change]].|vanish after one use; never recur; no change ever; random replacement only
0153|This extended Highland bagpipe music is also called [[ceol mor]] and uses a theme with [[variations]].|puirt-a-beul; scat; spoken dialogue; orchestral movements
0154|A large-scale work for [[orchestra]] usually has several [[movements]].|solo singer only; drum kit only; verses of lyrics; spoken scenes
0155|Women sang while [[beating cloth]] to [[soften and shrink]] it.|ploughing fields; rowing boats; tune and amplify; stretch and harden
0156|There is [[no established]] tonal centre or functional major/minor [[key]].|one fixed; a clearly defined; tempo; instrument
0157|In a major key, IV is the [[subdominant]] and VI is the [[submediant]].|tonic; dominant; supertonic; leading note
0158|Pitch movement uses [[semitones]], including notes [[outside]] the main key.|whole tones only; octaves only; exclusively inside; identical to the tonic only
0159|A dense [[chord]] uses [[adjacent]] or very closely spaced pitches.|rest; rhythm; widely separated only; identical only
0160|Two melodic lines move in [[opposite]] [[directions]].|identical; parallel; dynamics; tempos
0161|A distinct [[secondary melody]] is heard [[alongside]] the main tune.|bass drum stroke; chord symbol; instead of every note of; only before
0162|An independent [[high vocal]] melody decorates a tune from [[above]].|low percussion; low bass; below; unison only
0163|A performer sweeps across [[consecutive]] notes between two [[pitches]].|one repeated; silent; clefs; time signatures
0164|A very short [[ornamental note]] appears immediately before a [[main note]].|barline; time signature; clef; rest of a whole bar
0165|A cadence ends on chord [[V]], giving an [[unfinished]] sound.|I; VI; conclusive tonic; final tonic
0166|A held or repeated note is in an [[upper part]], while the harmony [[beneath]] it changes.|bass part only; drum part; above; nowhere around
0167|[[Several notes]] are sung to [[one syllable]].|one note; no notes; several syllables each; no syllables
0168|The music changes from [[one key]] to [[another key]].|one tempo; one instrument; another tempo only; another instrument only
0169|Chord [[V]] resolves to chord [[I]].|II; III; IV; VI
0170|An electric guitarist bends a [[string]], changing its [[pitch]] continuously.|reed; drum skin; tempo; volume only
0171|This interval is [[half]] a tone, such as C to [[C sharp]].|double; three times; D; E
0172|Each syllable receives [[one]] [[note]].|several; no; clef; key signature
0173|The interval equals [[two semitones]], such as C to [[D]].|one semitone; three semitones; C sharp; E
0174|A note rapidly alternates with the note immediately [[above]] it in the [[scale]].|below only; identical to; time signature; dynamic
0175|The scale has [[six]] notes, separated entirely by [[whole tones]].|five; seven; semitones only; minor thirds only
0176|In 6/8 there are [[two]] main beats, each normally worth a [[dotted crotchet]].|three; six; crotchet; minim
0177|Different [[rhythmic patterns]] sound at the same time, producing competing [[accents]].|key signatures; clefs; instrument families; tempo names
0178|The Italian word means [[moderately]], between [[fast and slow]].|very quickly; extremely slowly; loud and soft; high and low
0179|The tempo becomes [[gradually]] [[slower]].|suddenly; never; faster; louder
0180|A performer slightly speeds up and [[slows down]] for musical [[expression]].|holds one speed; stops permanently; tuning; transposition
0181|A [[broken-chord]] accompaniment repeats the lowest-highest-[[middle]]-highest pattern.|block-chord; walking-bass; lowest; highest
0182|The form has [[two]] main sections, labelled [[A and B]].|three; four; A-B-A; A-B-A-C-A
0183|An added [[closing passage]] comes after the main [[structure]].|opening introduction; middle episode; instrument family; key signature
0184|[[Two or more]] independent [[melodic lines]] sound together.|One; No; drum strokes; dynamic markings
0185|In rondo form, a [[contrasting passage]] separates returns of the [[main A section]].|final barline; repeated tonic chord only; orchestra tuning; time signature
0186|An unchanged [[bass melody]] repeats while the [[upper parts]] develop.|high descant; tempo marking; barlines; instrument names
0187|A main melody has [[chordal support]], or parts move in [[similar rhythms]].|no accompaniment at all; unrelated solo entries only; unrelated tempi only; complete silence
0189|The main [[A section]] returns between contrasting [[episodes]].|final barline; time signature; clefs; dynamics
0190|Each verse has the [[same music]] but [[different words]].|new music throughout; no music; identical words only; no text
0191|The bass commonly moves on [[each beat]], connecting changing [[chords]].|every eighth bar only; a silent beat; clefs; instruments
0192|Voices sing [[without]] instrumental [[accompaniment]].|with continuous; above loud; clef; tempo
0193|A string player uses the [[bow]] rather than [[plucking]].|plectrum; mallet; bowing; drawing the bow
0194|The male voice lies [[below tenor]] and [[above bass]].|above soprano; below bass; above tenor; below all voices
0195|This low woodwind uses a [[double reed]] and a long [[folded tube]].|single reed; string; straight short flute tube; drum shell
0196|An Irish [[frame drum]] is commonly struck with a [[double-ended beater]].|steel pan; bowed string; bow; flute mouthpiece
0197|Two small [[hand drums]] of [[different sizes]] are joined together.|cymbals; reed pipes; identical pitch only; no size difference
0198|Pairs of small [[clappers]] are traditionally made of [[wood]].|strings; reed pipes; stretched skin; horsehair
0199|This small Scottish [[harp]] has strings that are [[plucked]].|drum; pipe; blown; struck by hammers
0200|The Italian instruction means [[with a mute]], which changes the [[tone colour]].|without a mute; at the previous tempo; time signature; key signature
0201|While [[blowing]], a performer rolls the [[tongue or uvula]].|bowing; plucking; fingers only; lips alone without airflow
0202|A brass instrument has a long [[coil of tubing]], a flared bell and [[valves]].|bowed string; drum shell; finger holes; keys with reeds
0203|Two [[cymbals]] on a stand can be opened or closed using a foot [[pedal]].|drum skins; reed pipes; bow; plectrum
0204|This female voice lies [[below soprano]] and [[above alto]].|above soprano; below bass; below alto; above all voices
0205|A [[double reed]] produces sound in this high [[woodwind]] instrument.|single reed; drum skin; brass; string
0206|This small flute sounds [[an octave higher]] than written and is the highest standard orchestral [[woodwind]].|an octave lower; a fifth lower; brass; string
0207|A string player [[plucks]] rather than using a [[bow]].|blows; strikes with a hammer; mute; pedal
0208|Sound [[reflects]] around a space and continues after the source [[stops]].|loses all reflections; becomes instantly silent; starts; changes clef
0209|Rapid repeated [[strokes]] merge into a [[sustained]] percussion sound.|breaths; bow changes; silent; isolated single
0210|A North Indian [[plucked lute]] has [[sympathetic strings]].|frame drum; double-reed pipe; drum skins; piano hammers
0211|The North Indian instrument is a pair of [[hand drums]] with different sizes and [[pitches]].|reed pipes; bowed strings; clefs; time signatures
0212|It is generally lower than the [[French horn]] and belongs to the [[brass]] family.|piccolo; violin; woodwind; string
0213|A bowed string instrument lies [[lower]] than the violin and is slightly [[larger]].|higher; identical in pitch; smaller; identical in size
0214|Small instrumental ensembles usually have [[one player]] per [[part]].|ten players; no players; syllable; drum stroke
0215|Atmospheric tone colour and [[whole-tone]] or modal writing are associated with [[Debussy]].|major-only; diatonic-only; Bach; Haydn
0216|Jazz harmony and [[improvisation]] combine with [[funk rhythms]].|strict score copying only; silence; plainchant rhythm; Renaissance dance rhythm only
0217|A German Romantic [[art song]] is written for solo voice and [[piano]].|drum solo; orchestral symphony; unaccompanied bagpipes; brass band only
0218|This sets the fixed texts of the [[Roman Catholic]] [[liturgy]].|Scottish secular; German folk; court dance; work song
0219|Composers edit [[recorded sounds]], including noises and voices, to assemble a [[composition]].|only live unrecorded playing; printed notes only; clef; key signature
0220|A sacred story is performed by soloists, choir and orchestra in [[concert]], without theatrical [[acting]].|a staged drama; costume changes; singing; orchestral playing
0221|Only [[one melodic line]] is sung, usually without instrumental [[accompaniment]].|several independent lines; block chords; conductor only; key signature
0222|Solo singing is [[speech-like]], following the natural rhythm of the [[words]].|wordless; strictly dance-like; conductor's gestures only; drum pattern only
0223|A work normally has [[several movements]], for a solo instrument or an instrument with [[piano]].|one repeated chord only; no movements; choir only; full orchestra only
0224|Church singing contributes [[gospel]] roots, alongside the secular popular tradition called [[rhythm and blues]].|plainchant; madrigals; serialism; Renaissance court dance
0225|The ensemble has two [[violins]], one viola and one [[cello]].|flutes; clarinets; double bass; tuba
0226|A [[crushed grace note]] is normally shown with a [[slash]] through its stem.|long sustained chord; full-bar rest; key signature; repeat sign
0227|A [[major sixth]] is added above the root of a major or minor [[triad]].|minor sixth; perfect fifth; single note; time signature
0228|The chord has [[four notes]] built from stacked [[minor thirds]].|three notes; five notes; major thirds; perfect fourths
0229|A root and minor third are joined by a [[diminished fifth]], making a [[three-note]] chord.|perfect fifth; augmented fifth; four-note; six-note
0230|Chord [[V]] has a [[minor seventh]] added above its root.|I; IV; major seventh; perfect octave
0231|The [[seventh degree]] is raised in both ascending and [[descending]] forms.|second degree; fourth degree; ascending only; unchanged natural minor only
0232|Chord V moves to [[VI]], rather than resolving to [[I]].|II; III; IV; V again
0233|The distance in [[pitch]] is measured between [[two notes]].|tempo; volume; two instruments only; two barlines
0234|The sixth and seventh degrees rise [[ascending]]; natural-minor notes return [[descending]].|throughout both directions; only at the final chord; ascending only; in neither direction
0235|Using piano white notes, a mode based on D is [[Dorian]]; one based on G is [[Mixolydian]].|Ionian; Aeolian; Lydian; Phrygian
0236|An ornament moves to an [[adjacent note]] and then [[returns]].|distant octave; silent rest; changes instrument; stops permanently
0237|An important decorative [[instrumental line]] accompanies a main [[melody]].|drum skin; clef; key signature; time signature
0238|Chord [[IV]] resolves to chord [[I]].|II; III; V; VI
0239|A major key shares its [[key signature]] with a related [[minor key]].|tempo; time signature; percussion family; major chord only
0240|A minor key shares its [[key signature]] with a related [[major key]].|tempo; time signature; percussion family; minor chord only
0241|A piece in a [[minor key]] ends with a [[major tonic chord]].|major key; whole-tone scale; minor tonic chord; dominant seventh only
0242|In the same span, the faster part plays [[three]] evenly spaced notes and the slower part plays [[two]].|one; four; five; six
0243|The same melody returns with note values [[lengthened]] in the same [[proportion]].|shortened; unchanged; key; clef
0244|The same melody returns with note values [[shortened]] in the same [[proportion]].|lengthened; unchanged; key; clef
0245|Two examples are 5/4 (five [[crotchet]] beats) and 7/8 (seven [[quaver]] beats).|minim; semibreve; dotted crotchet; dotted minim
0246|The [[time signature]] changes, altering the number or grouping of [[beats]].|key signature; clef; strings; instruments
0247|[[Three]] equal notes occupy the time normally given to [[two]] notes of the same value.|One; Four; five; six
0248|A [[bass instrument]] plays the bass line while a [[chordal instrument]] fills in the harmony.|solo singer only; conductor only; solo drum only; unaccompanied flute only
0249|The small solo group is the [[concertino]], contrasted with the larger [[ripieno]].|exposition; coda; bridge; recapitulation
0250|An aria is in [[ABA]] form, with a return to the [[opening section]].|AB; ABACA; coda only; development only
0251|In sonata form, the first and [[second subjects]] are presented, normally in contrasting [[keys]].|final barlines; drum solos; tempos only; dynamics only
0252|A variation form commonly uses a repeating [[bass line]] and [[harmonic pattern]].|high descant only; percussion roll; time signature symbol; instrument name
0253|A recurring [[orchestral passage]] alternates with contrasting [[solo episodes]].|silent bar; final chord only; key signatures; tempo names
0254|After the exposition comes [[development]], followed by [[recapitulation]].|concertino; ripieno; cadenza; anacrusis
0255|A subject is a main [[musical idea]] which can be developed within a [[piece]].|barline; clef; drum skin; instrument case
0256|A song uses [[new music]] for successive verses rather than repeating the [[same music]].|identical music only; no music; same words only; same instruments only
0257|Agile vocal writing contains rapid [[scales]] and other [[ornaments]].|barlines; time signatures; clefs; instrument changes
0258|The [[small group]] of featured [[soloists]] plays in a concerto grosso.|full orchestra; large audience; conductors; stage actors
0259|Lightly touching a string at a [[nodal point]] allows an upper [[partial]] to sound.|random fret only; tuning peg; fundamental only; drum roll
0260|The [[larger ensemble]] contrasts with the [[concertino]] in a concerto grosso.|small solo group; solo singer; exposition; cadenza
0261|Rapid repeated [[bow strokes]] create a [[trembling]] string sound.|breaths; tongue clicks; silent; sustained without rearticulation
0262|An English [[sacred choral]] work sets a [[religious]] text.|secular instrumental; spoken dramatic; dance-only; wordless
0263|A late-Renaissance English [[solo song]] may be accompanied by a [[lute]].|full symphony; drum solo; modern drum kit only; electronic synthesizer only
0264|A light English madrigal is [[dance-like]] and often has a [[fa-la-la refrain]].|free recitative-like; slow plainchant-like; tone row; drum fill
0265|A [[German Lutheran]] hymn tune normally has a clear, [[regular rhythm]].|Scottish Gaelic; African American; unmeasured recitative rhythm; random rhythm only
0266|Modern jazz often uses extended [[harmony]] and [[improvisation]].|clefs only; silence; exact copying only; no performer invention
0267|Dance music is produced mainly with [[electronic instruments]] and [[computers]].|unaccompanied voices only; acoustic fiddles only; organs only; handwritten scores only
0268|A lively Renaissance dance uses [[triple metre]] and may follow a slower [[pavan]].|duple metre; free time; reel; jig
0269|A Renaissance [[secular vocal]] work is usually sung by several [[unaccompanied voices]].|sacred instrumental; solo percussion; amplified guitars; full orchestra
0270|A Renaissance sacred choral work is commonly in [[Latin]], using a text outside the fixed [[Mass movements]].|Scots; German only; symphony movements; concerto movements
0271|Art music deliberately draws on a nation's [[folk culture]] or [[identity]].|complete silence; twelve-tone order only; tuning system only; instrument size only
0272|This 20th-century approach revives [[earlier forms]], combining Classical balance with [[modern harmony]].|club beats only; Gregorian text only; medieval tuning only; harmony without any modern features
0273|A [[slow]] Renaissance court dance usually has [[duple metre]].|fast; very lively; triple metre; compound triple metre
0274|The European historical period is approximately [[1400–1600]], before the [[Baroque]].|1600–1750; 1800–1900; Classical; Romantic
0275|Composition uses an ordered [[series]], often of [[twelve pitch classes]].|random selection only; drum skin; five pitch classes only; seven pitch classes only
0276|An accented [[non-chord note]] takes time from a main note before resolving by [[step]].|chord root; silent rest; octave leap only; repeated pitch only
0277|A major triad's fifth is [[raised]] by a [[semitone]].|lowered; unchanged; whole tone; perfect fourth
0278|In C major, chord II is [[D-F-A]], and its first inversion is [[F-A-D]].|C-E-G; E-G-C; G-B-D; B-D-G
0279|In a major key VI is the [[submediant]], and in a minor key V is the [[dominant]].|tonic; supertonic; subdominant; mediant
0280|[[Polytonality]] uses multiple tonal centres; [[bitonality]] specifically uses two.|atonality; monophony; homophony; unison
0281|A [[prepared note]] is held into a new chord, becomes dissonant, then resolves [[down by step]].|new unprepared leap; percussion stroke; up an octave; without changing pitch
0282|An ordered row normally contains all [[twelve]] chromatic [[pitch classes]].|five; seven; beats; instruments
0283|The interval spans [[three whole tones]], equivalent to an [[augmented fourth]].|two whole tones; four whole tones; perfect fourth; perfect fifth
0284|The standard pattern starts on the [[upper neighbour]], then main note, [[lower neighbour]] and main note.|octave above; octave below; fifth above; fifth below
0285|Two groups of [[three]] are regrouped into three groups of [[two]], or vice versa.|four; five; six; seven
0286|The next fugue voice restates the [[subject]], commonly starting a [[fifth above]].|coda; bridge; second above; seventh above
0287|[[Separated groups]] of performers [[answer each other]] across the space.|one soloist only; one unison group only; remain silent; always play unrelated music
0288|In sonata form, a transition links the [[first]] and [[second]] subjects.|third; fourth; fifth; sixth
0289|A recurring [[secondary melody]] accompanies entries of a fugue's [[subject or answer]].|percussion stroke; final barline; coda only; key signature
0290|Independent voices introduce a [[subject]] in turn in a [[contrapuntal]] work.|coda; drum fill; monophonic; single-voice
0291|Melodic intervals reverse [[direction]], so an upward interval becomes [[downward]].|duration; volume; upward again; silent
0292|A recurring [[musical idea]] is linked to a dramatic [[character]] or other association.|bar number; time signature; tuning pitch only; clef only
0293|A melody's notes appear in [[reverse order]], starting with the original [[last note]].|original order; random order; first note; middle note only
0294|A [[connected group]] of songs is intended as one [[complete work]].|random selection; single instrumental movement; drum fill; fugue episode
0295|A new subject entry starts [[before]] the previous one ends, causing [[overlap]].|after; long after; silence; a complete break
0296|In a fugue, this is the [[main theme]], introduced by different [[voices]].|final barline; tempo marking; clefs; key signatures
0297|A Renaissance ensemble may be a [[whole consort]] when its instruments belong to [[one family]].|broken consort; mixed consort; several different families; no instrument family
0298|A high adult [[male]] voice often uses [[falsetto]].|female; child's; a reed; a bow
0299|The standard ensemble is [[piano]], violin and [[cello]].|organ; flute; viola; double bass
0300|The German term means [[speech-song]], between [[speaking and singing]].|dance-song; work-song; bowing and plucking; blowing and striking
`;
// These coordinated facts remain true with either answer order. Other pairs
// (for example above/below and 6/8/compound time) retain their fixed slots.
const interchangeable=new Set(['MC-0105','MC-0252','MC-0266','MC-0267','MC-0271','MC-0288']);
const data={};
for(const line of rows.trim().split('\n')){const [number,marked,wrong]=line.split('|');const id='MC-'+number;if(data[id])throw Error('Duplicate cloze '+id);let text='',cursor=0,gaps=[];for(const match of marked.matchAll(/\[\[(.*?)\]\]/g)){text+=marked.slice(cursor,match.index);const start=text.length;text+=match[1];gaps.push({start,end:text.length,text:match[1]});cursor=match.index+match[0].length;}text+=marked.slice(cursor);const distractors=wrong.split('; ').map(v=>v.trim());const keys=[...gaps.map(g=>g.text),...distractors].map(v=>v.toLowerCase());if(gaps.length<2||distractors.length<4||new Set(keys).size!==keys.length)throw Error('Invalid six-tile cloze '+id);data[id]={text,gaps,distractors};}
function make(entry){const row=data[entry.conceptId];if(!row)throw Error('Missing cloze '+entry.conceptId);const prefix=entry.answer+' — ';return {clozeText:prefix+row.text,clozeGaps:row.gaps.map(g=>({...g,start:g.start+prefix.length,end:g.end+prefix.length,...(interchangeable.has(entry.conceptId)?{exchangeGroup:'fact-list'}:{})})),answer:row.gaps[0].text,distractors:row.distractors};}
module.exports={data,make};
