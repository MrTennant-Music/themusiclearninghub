/* National 3 Styles: authored content shared by the existing Music Games players.
   Rebuild with node scripts/build-music-games-n3-styles.cjs, then build-music-games.js. */
const fs = require('node:fs');
const path = require('node:path');
const C = require('../music-games/core.js');
const dictionary = require('../music-dictionary/music-concepts-data.js');
const bank = require('../data/questions/music-concepts/national3.json');
const ROOT = path.resolve(__dirname, '..');
const styles = dictionary.concepts.filter(c => c.level === 'National 3' && c.categories.includes('Styles'));
// Facts are characteristic clues, not claims that a feature belongs exclusively
// to one genre. Separate sets keep overlapping blues/jazz/rock features apart.
const facts = {
  'Blues': [
    'Repeating 12-bar chord pattern',
    'Flattened or bent blue notes',
    'Work-song and field-holler roots',
    'Blue-note riffs and responses'
  ],
  'Jazz': [
    'Small combos or big bands',
    'Jazz combos: swing and improv',
    'Jazz solos with extended chords',
    'Early New Orleans improvisation'
  ],
  'Latin American': [
    'Bongos, claves and güiro',
    'Latin off-beat dance rhythms',
    'Latin percussion-led dancing',
    'Latin American dance traditions'
  ],
  'Musical': [
    'Songs, acting and dance',
    'Spoken dialogue between songs',
    'Songs develop the story',
    'Storytelling through stage songs'
  ],
  'Pop': [
    'Catchy chart-pop choruses',
    'General mass-market song label',
    'Broad chart-song category',
    'Memorable chart-song hooks'
  ],
  'Rock': [
    'Distorted electric-guitar riffs',
    'Post-1960s heavy guitar drums',
    '1960s amplified guitar groups',
    'Heavy post-1960s guitar sound'
  ],
  "Rock 'n' roll": [
    '1950s American dance craze',
    '1950s rhythm-and-blues fusion',
    '1950s walking-bass dance style',
    '1950s backbeat and dance riffs'
  ],
  'Scottish': [
    'Fiddle, accordion and bagpipes',
    'Songs in Scots or Gaelic',
    'Reels, jigs and strathspeys',
    'Traditional fiddle dance bands'
  ]
};
const sets = [['Blues', 'Latin American', 'Musical', 'Scottish'], ['Jazz', 'Pop', 'Rock', "Rock 'n' roll"]];
const sentences = [
  ['The standard twelve-bar blues chord cycle lasts [[12]] bars.', ['4', '8', '16']],
  ['In blues, flattened scale notes are called [[blue notes]].', ['natural notes', 'high notes', 'pedal notes']],
  ['In jazz, making up music while performing is called [[improvisation]].', ['repetition', 'syncopation', 'amplification']],
  ['Jazz ensembles range from small combos to [[big bands]].', ['Scottish dance bands', 'choirs', 'brass bands']],
  ['[[Latin American]] dance music often has prominent [[percussion]].', ['Scottish', 'strings']],
  ['Latin American music often uses [[percussion]] to create a strong [[rhythm]].', ['strings only', 'silence', 'written clef', 'key signature']],
  ['A [[musical]] combines songs, acting and usually dance in a [[stage show]].', ['jazz solo', 'recording studio']],
  ['In a musical, songs often alternate with [[spoken dialogue]].', ['improvised solos', 'a walking bass', 'a drum fill']],
  ['[[Pop]] songs often have catchy choruses and memorable [[hooks]].', ['Jazz', 'drones']],
  ['Pop songs often have [[memorable]] tunes performed by a [[singer]].', ['unpitched', 'silent', 'drum skin', 'bow']],
  ['[[Rock]] often features distorted [[electric guitar]] riffs.', ['Scottish', 'accordion']],
  ['A heavy, [[driving]] drum beat is a common feature of rock.', ['gentle', 'unaccompanied', 'silent']],
  ["The [[1950s]] American dance style mixing rhythm and blues with country is [[Rock 'n' roll]].", ['Jazz', '1920s']],
  ["Rock 'n' roll is often [[lively]] music made for [[dancing]].", ['silent', 'slow and solemn', 'sleeping', 'tuning only']],
  ['Traditional music from Scotland is [[Scottish]]; one familiar instrument is the [[bagpipes]].', ['Latin American', 'bongos']],
  ['A Scottish dance band commonly features a [[fiddle]] and an [[accordion]].', ['organ', 'electric guitar', 'voice', 'steel pans']]
];
// Broad development/popularity milestones, not exact invention dates. The
// Library of Congress exhibition documents 1950s rock 'n' roll before the
// British rock groups of the 1960s; no dates are inferred for older traditions.
const timeline = [
  {style: 'Blues', period: 'Late 1800s', source: 'https://www.loc.gov/collections/songs-of-america/articles-and-essays/musical-styles/ethnic/african-american-song/'},
  {style: 'Jazz', period: 'Early 1900s spread', source: 'https://www.nps.gov/jazz/learn/historyculture/history_early.htm'},
  {style: "Rock 'n' roll", period: '1950s', source: 'https://music.si.edu/story/rb-trivia-rhythm-and-blues-or-rock-and-roll'},
  {style: 'Rock', period: '1960s expansion', source: 'https://www.loc.gov/exhibits/british/brit-7.html'}
];
function cloze([marked, distractors]) {
  let clozeText = '', last = 0;
  const clozeGaps = [];
  for (const match of marked.matchAll(/\[\[(.*?)\]\]/g)) {
    clozeText += marked.slice(last, match.index);
    const start = clozeText.length;
    clozeText += match[1];
    clozeGaps.push({start, end: clozeText.length, text: match[1]});
    last = match.index + match[0].length;
  }
  clozeText += marked.slice(last);
  return {prompt: clozeText, clozeText, clozeGaps, answer: clozeGaps[0].text, distractors};
}
function aliases(concept) {
  const variants = {
    'Musical': ['Musical theatre', 'Musical theater', 'A musical'],
    'Pop': ['Popular music'],
    'Latin American': ['Latin-American', 'Latin American music', 'Latin-American music'],
    "Rock 'n' roll": ['Rock and roll', 'Rock n roll', 'Rock ’n’ roll', "Rock'n'roll", 'Rock & roll', 'Rock ’n’ roll music']
  };
  const names = [concept.name, ...concept.aliases, ...(variants[concept.name] || []), ...(concept.name !== 'Musical' ? [concept.name + ' music'] : [])];
  return [...new Set(names)].slice(0, 8);
}
function makeActivities() {
  const activities = [];
  function add(key, template, items, extra = {}) {
    if(!C.isHubLibraryTemplate(template))return;
    const id = `hub-n3-styles-${key}`;
    const a = C.makeActivity({id, title: 'Styles', level: 'N3', template,
      folder: 'Music Dictionary', tags: ['Styles', 'National 3'],
      description: 'Practise the eight National 3 Styles concepts from the Music Dictionary.',
      options: {shuffle: true, timer: 0, sound: true, theme: 'blue'},
      revision: 4, updatedAt: '2026-10-31T20:00:00.000Z',
      items: items.map((item, i) => ({id: `${id}-${i + 1}`, ...item})), ...extra});
    const errors = C.validateActivity(a);
    if (errors.length) throw Error(`${id}: ${errors.join('; ')}`);
    activities.push(a);
  }
  const definitions = styles.map(concept => {
    const source = bank.questions.find(q => q.conceptId === concept.id && q.answerMode === 'concept');
    if (!source) throw Error(`Missing Styles clue: ${concept.id}`);
    // Strengthen the broad source-bank Rock clue with the Dictionary's
    // distinctive guitar feature, consistently in all six definition games.
    const contextualClues={Blues:'An African American musical tradition commonly using a twelve-bar chord cycle, blue notes, call and response and improvisation.',Jazz:'An early-20th-century style associated with New Orleans, improvisation and syncopation, performed by small combos or big bands.',"Rock 'n' roll":'The 1950s American dance style combining rhythm and blues with country, often with a strong backbeat.'};
    const prompt = contextualClues[concept.name] || (concept.name === 'Rock'
      ? 'A popular style with a heavy driving beat and prominent amplified electric-guitar riffs, often using distortion.'
      : source.question.replace(/\s*What is this\?$/, ''));
    return {prompt, answer: concept.name,
      distractors: source.answers.filter(a => !a.correct).map(a => a.text)};
  });
  for (const [key, template] of [['wordsearch', 'wordsearch'], ['crossword', 'crossword']]) {
    add(`${key}-1`, template, definitions.map((row, i) => ({...row,
      distractors: ['quiz', 'true-or-false'].includes(template) ? row.distractors : [],
      ...(['quiz', 'true-or-false'].includes(template) ? {answerOptions: [row.answer, ...row.distractors]} : {}),
      ...(template === 'type-the-answer' ? {correctAnswers: aliases(styles[i])} : {})})),
      template === 'wordsearch' ? {editorMode: 'with-clues'} : {});
  }
  add('blank-1', 'complete-the-sentence', sentences.map(cloze));
  sets.forEach((set, i) => {
    const items = set.flatMap(group => facts[group].map(fact => ({prompt: fact, answer: fact, group})));
    const title = `Styles ${i + 1}`;
    add(`sort-${i + 1}`, 'group-sort', items, {title, description: `Sort facts about ${set.join(', ')}.`, instructions: 'Place each fact under the style it best describes, then select Submit. Some musical features are shared between styles.'});
    add(`connections-${i + 1}`, 'matching-pairs', items, {title, description: `Find facts about ${set.join(', ')}.`, instructions: 'Find four facts that best describe each style. Some musical features are shared between styles. Find all four groups.'});
  });
  add('order-1', 'rank-order', timeline.map(row => ({prompt: row.style + ' — ' + row.period, answer: row.style})), {
    description: 'Broad development and popularity milestones: Blues (late 1800s), Jazz (early 1900s spread), Rock ’n’ roll (1950s), Rock (1960s expansion). These are not exact beginnings; the styles overlap and continue today.',
    instructions: 'Order these broad development and popularity milestones, earliest first. These are not exact beginnings; the styles overlap. For Rock, use its 1960s expansion.'
  });
  return activities;
}
function build() {
  const activities = makeActivities();
  for (const activity of activities) fs.writeFileSync(path.join(ROOT, 'music-games/activities', activity.id + '.json'), JSON.stringify(activity, null, 2) + '\n');
  console.log(`Created ${activities.length} N3 Styles activities across ${new Set(activities.map(a => a.template)).size} games.`);
  return activities;
}
if (require.main === module) build();
module.exports = {styles, facts, sets, sentences, timeline, makeActivities, build};
