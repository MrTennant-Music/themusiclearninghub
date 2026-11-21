/* Authored sentence completions. [[...]] marks exact gaps, never a definition prefix. */
const passages = {
 N3: [
  ['A [[chord]] is formed when two or more different notes are played together.', ['melody','solo','beat']],
  ['Pitch moves upwards in an [[ascending]] melody.', ['descending','repeated','unison']],
  ['A main voice supported by other instruments is [[accompanied]].', ['unaccompanied','solo','unison']],
  ['[[Blues]] often uses a 12-bar chord pattern, while [[Jazz]] often features improvisation.', ['Rock','Musical','Pop']],
  ['Opening and closing bellows produces the sound of an [[accordion]].', ['acoustic guitar','piano','drum kit']],
  ['A note that receives extra emphasis has an [[accent]].', ['echo','ostinato','accompaniment']],
  ['An acoustic guitar has [[six]] strings and a [[hollow]] body that helps amplify its sound.', ['four','solid','two','metal']],
  ['When different notes sound together, they create [[harmony]].', ['unison','silence','rhythm']],
  ['Music may have two, three or four [[beats]] in each [[bar]].', ['notes','phrases','chord','rest']],
  ['Small groups and big bands can both perform [[Jazz]].', ['Bothy ballad','Musical','Scottish dance band']]
 ],
 N4: [
  ['[[Accelerando]] tells the performer to become gradually faster.', ['A tempo','Rallentando','Adagio']],
  ['After a temporary change of speed, [[A tempo]] means return to the previous tempo.', ['Accelerando','Crescendo','Staccato']],
  ['The notes of a [[broken chord]] are played one after another rather than together.', ['cluster','scale','drone']],
  ['Moving from one key to another is called a [[change of key]].', ['change of tempo','sequence','pedal']],
  ['In a [[canon]], another part enters later with the [[same]] melody.', ['concerto','different','chord','faster']],
  ['The lowest standard female voice is [[alto]], below [[soprano]].', ['bass','tenor','baritone']],
  ['A concerto may include a solo display section called a [[cadenza]].', ['chorus','canon','bridge']],
  ['[[Backing vocals]] support the lead singer, often by adding harmony.', ['Solo','Instrumental','Unison']],
  ['Harpsichord and basso continuo are common features of [[Baroque]] music.', ['Romantic','Jazz','Minimalist']],
  ['Music from a range of African traditions is described as [[African music]].', ['Baroque','Reggae','Ragtime']]
 ],
 N5: [
  ['[[Arco]] tells string players to use the bow.', ['Pizzicato','A cappella','A tempo']],
  ['Voices singing without instrumental accompaniment perform [[a cappella]].', ['arco','pizzicato','con sordino']],
  ['An [[aria]] is a solo song in an opera or oratorio.', ['overture','interlude','concerto']],
  ['A [[Bothy ballad]] is a strophic folk song associated with farm workers in North-East Scotland.', ['madrigal','chorale','aria']],
  ['Music with no established tonal centre is [[atonal]].', ['major','minor','pentatonic']],
  ['[[Binary]] form has an A section followed by a contrasting [[B]] section.', ['Ternary','A','C','Rondo']],
  ['An [[Alberti bass]] uses the broken-chord pattern lowest, highest, middle, highest.', ['ostinato','walking bass','pedal']],
  ['Different rhythmic patterns sounding together can create [[cross rhythms]].', ['unison','augmentation','sequence']],
  ['In compound time, each dotted-crotchet beat divides into [[three]] quavers.', ['two','four','six']],
  ['A [[pentatonic]] scale contains [[five]] different notes.', ['chromatic','six','whole-tone','seven']]
 ],
 H: [
  ['[[Chamber music]] includes string quartets and piano trios with independent instrumental parts.', ['Concerto grosso','Oratorio','Opera']],
  ['Whole-tone scales and delicate orchestration can suggest an [[Impressionist]] style.', ['Baroque','Classical','Ragtime']],
  ['A short, crushed grace note before the main note is an [[acciaccatura]].', ['appoggiatura','trill','turn']],
  ['An [[added sixth]] chord combines a triad with the note six scale steps above its root.', ['augmented','diminished seventh','dominant seventh']],
  ['In [[3 against 2]], three equal notes occur in the same time as two equal notes.', ['simple time','compound time','syncopation']],
  ['Lengthening every note value of a theme in the same proportion is [[augmentation]].', ['diminution','inversion','retrograde']],
  ['In [[basso continuo]], a bass instrument plays the bass line and a chordal instrument supplies harmony.', ['Alberti bass','walking bass','pedal']],
  ['A concerto grosso contrasts the [[concertino]] with the larger [[ripieno]].', ['cadenza','solo','chorus','consort']],
  ['Rapid scales, leaps and vocal ornaments are features of [[coloratura]].', ['recitative','syllabic','plainchant']],
  ['[[Concerto grosso]] is a Baroque concerto featuring a small group of soloists.', ['Solo concerto','Symphony','Sonata']]
 ],
 AH: [
  ['An [[anthem]] is an English sacred choral work with a religious text.', ['ayre','madrigal','motet']],
  ['A simple song or melody may be called an [[ayre]] or air.', ['anthem','fugue','concerto']],
  ['An [[appoggiatura]] takes a significant part of the following main note’s value.', ['acciaccatura','trill','mordent']],
  ['Raising the fifth of a major triad by a semitone creates an [[augmented triad]].', ['minor triad','diminished triad','major triad']],
  ['In [[hemiola]], two groups of three can be regrouped as [[three]] groups of two.', ['syncopation','two','four','augmentation']],
  ['In a fugue, the next voice restates the subject as the [[answer]].', ['episode','countersubject','stretto']],
  ['[[Antiphonal]] music has separated groups that answer each other.', ['Monophonic','Homophonic','Unison']],
  ['An ensemble of instruments, especially in Renaissance music, is a [[consort]].', ['concertino','ripieno','cadenza']],
  ['A high adult male voice using mainly [[falsetto]] is a [[countertenor]].', ['bass','baritone','vibrato','tenor']]
 ]
};
function buildBlankItems(code,id) {
 return passages[code].map(([marked,distractors],index)=>{
  let text='',cursor=0;const gaps=[];
  for(const match of marked.matchAll(/\[\[([^\]]+)\]\]/g)){
   text+=marked.slice(cursor,match.index);
   const start=text.length;text+=match[1];gaps.push({start,end:text.length,text:match[1]});cursor=match.index+match[0].length;
  }
  text+=marked.slice(cursor);
  return {id:`${id}-sentence-${index+1}`,prompt:'',answer:gaps[0].text,clozeText:text,clozeGaps:gaps,distractors,group:'Mixed concepts'};
 });
}
module.exports={buildBlankItems};
