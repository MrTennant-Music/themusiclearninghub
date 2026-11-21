/* Additional accepted-looking quartets discovered during manual play.
 * Each pattern is independent of the intended groups on a generated board.
 * Slots expand the same musical link to appropriate earlier/later-level terms.
 * These are exclusions, not additional answers for the pupil to memorise.
 */
module.exports=[
 {label:'Drumming',slots:[['Drum kit'],['Drum fill','Rolls'],['Beat / pulse'],['Accent / accented','Syncopation']]},
 {label:'Acoustic instruments',slots:[['Acoustic guitar'],['Piano'],['Fiddle','Violin'],['Bagpipes']]},
 {label:'Instruments',slots:[['Drum kit'],['Acoustic guitar'],['Electric guitar','Bass guitar'],['Fiddle','Violin']]},
 {label:'Guitar playing',slots:[['Acoustic guitar'],['Electric guitar','Bass guitar'],['Strumming','Plucking'],['Chord','Harmony / chord','Broken chord / arpeggio']]},
 {label:'Solo jazz performance',slots:[['Jazz','Contemporary jazz','Jazz funk'],['Improvisation'],['Piano','Saxophone','Trumpet','Double bass','Bass guitar'],['Solo']]},
 {label:'Fiddle and string playing',slots:[['Fiddle','Violin','Viola','Cello','Double bass'],['Bowing','Arco'],['Legato'],['Staccato']]},
 {label:'Dance music',slots:[['Scottish'],['Reel','Jig','Strathspey'],['Waltz'],['Latin American']]},
 // Retiring a repetitive answer must not erase its still-valid musical link.
 {label:'Scottish folk music',slots:[['Scottish'],['Fiddle'],['Acoustic guitar'],['Folk group']]},
 {label:'Instruments',slots:[['Accordion'],['Acoustic guitar'],['Bagpipes'],['Fiddle']]},
 {label:'Instruments',slots:[['Drum kit'],['Electric guitar'],['Organ'],['Piano']]},
 {label:'Acoustic instruments',slots:[['Acoustic guitar'],['Piano'],['Accordion'],['Fiddle']]},
 {label:'Dance music',slots:[['Scottish'],['Reel'],['Waltz'],['Scottish dance band']]}
];
