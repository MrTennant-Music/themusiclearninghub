/* One audited question per distinct concept family introduced at this level.
   Polyphonic/Contrapuntal share a question while retaining both source IDs. */
const C=require('../music-games/core'),D=require('../music-dictionary/music-concepts-data'),columns=require('./build-music-games-columns.cjs');
const styles=[...require('./build-music-games-n3-styles.cjs').makeActivities(),...require('./build-music-games-styles.cjs').makeActivities()];
const levels=columns.levels;
// Keep these refinements local to the level tests; other collections own their wording.
const promptOverrides={
 'MC-0050':'An amplified guitar, normally with a solid or semi-hollow body, whose pickups convert string vibrations into an electrical signal. Name the guitar type rather than the low-pitched bass instrument.',
 'MC-0062':'A performer hits the skin, bar or body of an instrument with a hand, stick, mallet or beater, rather than pulling a string or sweeping across strings. Name the playing action.',
 'MC-0104':'A Scottish dance in simple quadruple time, usually at a moderate tempo, characteristically featuring dotted rhythms and Scotch snaps.',
 'MC-0219':'Music assembled by recording, editing and combining sounds, such as environmental noises, voices or instruments. Give the French name for this recorded-sound compositional approach.',
 'MC-0223':'Name the type of work, normally in several contrasting movements, written for a solo instrument such as piano, or for an instrument such as violin with piano. Give the work type rather than the form of one movement.',
 'MC-0226':'Give the Italian name for the very short crushed grace-note ornament, normally written as a small note with a slash through its stem. Its exact placement around the beat depends on performance practice.',
 'MC-0280':'Name the general technique of using two or more keys or tonal centres simultaneously. Either the general term or its two-key form is accepted.'
};
const additionalAliases={
 'MC-0013':['Dissonance','Dissonant chord'],
 'MC-0202':['Horn'],
 'MC-0227':['Added sixth chord','Added 6th chord'],
 'MC-0228':['Diminished seventh chord','Diminished 7th chord'],
 'MC-0230':['Dominant seventh chord','Dominant 7th chord'],
 'MC-0241':['Picardy third','Picardy 3rd']
};
function entries(code){const [,label]=levels.find(([id])=>id===code);return D.concepts.filter(c=>c.level===label&&c.id!=='MC-0188'&&!require('./music-games-excluded-concepts.cjs').ids.has(c.id)).map(c=>{let entry,distractors;
 if(c.categories.includes('Styles')){const index=D.concepts.filter(v=>v.level===label&&v.categories.includes('Styles')).findIndex(v=>v.id===c.id),row=template=>styles.find(a=>a.level===code&&a.template===template).items[index];entry={conceptId:c.id,ids:[c.id],answer:c.name,prompt:row('quiz').prompt,correctAnswers:require('./build-music-games-styles.cjs').aliases(c)};distractors=row('quiz').distractors;}
 else{const pool=columns.entriesFor(code,c.categories[0]);entry=pool.find(e=>e.ids.includes(c.id));if(!entry)throw Error('Missing concept '+c.id);const offset=(pool.indexOf(entry)+1)%pool.length;distractors=columns.alternatives(entry,[...pool.slice(offset),...pool.slice(0,offset)]);}
 if(c.id==='MC-0285')distractors=['Suspension','Retrograde','Polytonality or bitonality'];
 return {...entry,prompt:promptOverrides[c.id]||entry.prompt,correctAnswers:[...entry.correctAnswers,...(additionalAliases[c.id]||[])],distractors};});}
// These Concept Games quiz formats have been retired.
function makeActivities(){return [];}
function build(){const all=makeActivities();require('./music-games-write-activities.cjs').writeActivities(all);console.log('Created '+all.length+' level tests.');return all;}
if(require.main===module)build();module.exports={levels,entries,makeActivities,build};
