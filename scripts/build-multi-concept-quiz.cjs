/* Import tagged Multiple Concepts recordings from a local copy of the Audio Concept Library. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const dictionary = require('../music-dictionary/music-concepts-data.js');
const catalogue = require('../audio-concept-library-data.json');
const collections = require('../music-dictionary/quiz-collections.js');
const {overlaps} = require('./quiz-distractor-overlap.cjs');
const reviewedSpellings = require('../music-dictionary/quiz-data/typed-answer-alternatives.json').questions;
const additionalSpellings = require('./musical-features-spellings.cjs');

const root = path.resolve(__dirname, '..');
const levels = ['N3', 'N4', 'N5', 'H', 'AH'];
const folder = 'audio/concept-library/multi-concept-quiz';
const recordingId = bytes => createHash('sha256').update(bytes).digest('hex').slice(0, 20);
const indexFile = 'music-dictionary/quiz-multi-concept-data.js';
const normal = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const concepts = dictionary.concepts;
const byId = new Map(concepts.map(concept => [concept.id, concept]));
const rank = concept => dictionary.levels.indexOf(concept.level);

// Library tags identify teaching points. These features can also be heard in passing,
// so use them only when the question explicitly includes them as correct answers.
const incidentalDistractors = new Set([
  'MC-0009', 'MC-0012', 'MC-0015', 'MC-0019', // Ascending, descending, leaps and steps
  'MC-0016', 'MC-0017', 'MC-0018', 'MC-0037', 'MC-0108', // Question and answer, repetition, sequence, ostinato/riff and imitation
  'MC-0010', 'MC-0011', 'MC-0035', 'MC-0080', 'MC-0086', 'MC-0090', 'MC-0171', 'MC-0173', 'MC-0233', // Common chord, scale and interval features
  'MC-0084', 'MC-0085', 'MC-0187', // Major/minor tonality and homophonic texture
  'MC-0020', 'MC-0021', 'MC-0024', 'MC-0028', 'MC-0029', 'MC-0099', 'MC-0103', 'MC-0105', // Common metre, beat and rhythm features
  'MC-0034', 'MC-0039', 'MC-0041', 'MC-0067', 'MC-0172', // Accompanied, solo, unison/octave, voice and syllabic writing
  'MC-0053', 'MC-0060', // Legato and staccato
  'MC-0082', 'MC-0157', 'MC-0278', 'MC-0279', // Chord progressions and chord II
  'MC-0081', 'MC-0168', 'MC-0165', 'MC-0169', 'MC-0281', // Changes of key, cadences and suspension
  'MC-0087', 'MC-0167', // Ornament and melismatic
  'MC-0094', 'MC-0098', 'MC-0176', // A tempo and both compound time entries
  'MC-0251', 'MC-0254', 'MC-0255', 'MC-0288', 'MC-0289', 'MC-0296' // Form, both subjects and countersubject
]);

function resolveTag(tag, tags, levelRank) {
  const key = normal(tag);
  // Fugue and sonata form have separate Dictionary entries for Subject.
  if (key === 'subject' && tags.some(value => normal(value) === 'fugue')) return byId.get('MC-0296');
  const exact = concepts.filter(concept => normal(concept.name) === key);
  const matches = exact.length ? exact : concepts.filter(concept => concept.aliases.some(alias => normal(alias) === key));
  const eligible = matches.filter(concept => levelRank === undefined || rank(concept) <= levelRank);
  return eligible.length === 1 ? eligible[0] : undefined;
}

const relatedGroups = collections.groupsForLevel('ALL').filter(group => !group.qualification);
const groupIds = new Map(relatedGroups.map(group => [group.id, new Set(group.conceptIds)]));
const focused = new Set(['instruments-ensembles', 'orchestra-brass', 'orchestra-woodwind', 'orchestra-strings',
  'orchestra-percussion', 'playing-techniques', 'articulation', 'ornaments', 'chords', 'cadences',
  'tonality', 'scales', 'rhythm-metre', 'tempo', 'texture', 'texture-structure', 'voices-vocal-music',
  'voice-types', 'vocal-techniques', 'bass-lines', 'musical-development']);
const vocalChoices = new Set(['MC-0034', 'MC-0038', 'MC-0039', 'MC-0040', 'MC-0041', 'MC-0048', 'MC-0067']);

// National 3 has few texture terms once incidental features are removed. Use
// the contrasting styles, dance types and sounds taught alongside them.
const national3TextureAnswers = new Set(['MC-0034', 'MC-0035', 'MC-0040', 'MC-0041']);
const national3TextureAlternatives = new Set(['MC-0001', 'MC-0003', 'MC-0007', 'MC-0027', 'MC-0033', 'MC-0047',
  'MC-0059', 'MC-0061', 'MC-0068']);
const national3PitchAlternatives = new Set(['MC-0001', 'MC-0022', 'MC-0027', 'MC-0033', 'MC-0038']);

function similarity(answer, candidate) {
  if (vocalChoices.has(answer.id) && vocalChoices.has(candidate.id)) return 5;
  let score = answer.categories.some(category => candidate.categories.includes(category)) ? 1 : 0;
  for (const group of relatedGroups) {
    const ids = groupIds.get(group.id);
    if (ids.has(answer.id) && ids.has(candidate.id)) score = Math.max(score, (group.id.startsWith('orchestra-') ? 6 : focused.has(group.id) ? 4 : 2));
  }
  return score;
}

const recordingKey = metadata => metadata?.title && metadata.title !== 'Example' && metadata.artist
  ? normal(metadata.artist) + ':' + normal(metadata.title) : '';
const additionalTags = new Map();
for (const entry of catalogue.concepts) {
  for (const file of entry.files) {
    const metadata = entry.fileMeta[file], key = recordingKey(metadata);
    if (!key) continue;
    const tags = metadata.concepts || [];
    const known = additionalTags.get(key) || new Set();
    for (const tag of tags) {
      const concept = resolveTag(tag, tags);
      if (concept) known.add(concept.id);
    }
    additionalTags.set(key, known);
  }
}

function musicalFeature(concept) {
  const variants = [...new Set([
    concept.name, ...concept.aliases,
    ...reviewedSpellings.filter(row => row.conceptId === concept.id)
      .flatMap(row => [...row.previousAcceptedVariants, ...row.addedVariants]),
    ...(additionalSpellings[concept.id] || [])
  ])];
  if (variants.length < 2) throw new Error('Add an accepted spelling for ' + concept.name);
  return {id: concept.id, name: concept.name, variants};
}

function build(source) {
  const rows = [];
  const multipleConcepts = catalogue.concepts.filter(entry => entry.category === 'Multiple Concepts');
  for (const entry of multipleConcepts) {
    const levelRank = dictionary.levels.indexOf(entry.level);
    for (const file of entry.files) {
      const metadata = entry.fileMeta[file];
      const tags = metadata?.concepts || [];
      if (tags.length < 2) continue;
      const isMusicalFeatures = tags.length > 10;
      const variableSelection = tags.length >= 5 && !isMusicalFeatures;
      const answers = [], ambiguous = [];
      for (const tag of tags) {
        const answer = resolveTag(tag, tags, levelRank);
        if (answer && rank(answer) <= levelRank) answers.push(answer);
        else if (variableSelection && normal(tag) === 'subject') ambiguous.push('MC-0255', 'MC-0296');
        else throw new Error('Review the concept tag "' + tag + '" for ' + file);
      }
      if (new Set(answers).size !== answers.length || (variableSelection && answers.length < 4)) {
        throw new Error('Review the concept tags for ' + file);
      }
      const knownIds = [...answers.map(answer => answer.id), ...ambiguous, ...(additionalTags.get(recordingKey(metadata)) || [])];
      const input = path.join(source, entry.path, file);
      const bytes = fs.readFileSync(input);
      if (!bytes.length) throw new Error('Empty recording: ' + input);
      const id = recordingId(bytes);
      const relativeFile = folder + '/' + id + path.extname(file).toLowerCase();
      rows.push({
        bytes, id, relativeFile, level: levels[levelRank], knownIds,
        recording: [metadata.title === 'Example' ? null : metadata.title, metadata.artist].filter(Boolean).join(' — ') || 'Audio Concept Library example',
        ...(isMusicalFeatures
          ? {features: answers.map(musicalFeature)}
          : {answerIds: answers.map(answer => answer.id), ...(variableSelection ? {tagCount:tags.length} : {})})
      });
    }
  }

  // Keep the known tags across duplicate audio so none can be offered as distractors.
  const tagsByRecording = new Map();
  for (const row of rows) {
    const tags = tagsByRecording.get(row.id) || {known:new Set(), answers:new Set(), count:0};
    for (const id of row.knownIds) tags.known.add(id);
    const sourceIds = row.answerIds || row.features.map(feature => feature.id);
    if (sourceIds.length > 2) {
      for (const id of sourceIds) tags.answers.add(id);
      tags.count = Math.max(tags.count, row.tagCount || sourceIds.length);
    }
    tagsByRecording.set(row.id, tags);
  }
  const imported = new Set(), output = [];
  fs.mkdirSync(path.join(root, folder), {recursive: true});
  for (const row of rows) {
    const pair = row.answerIds?.length === 2;
    const key = row.level + ':' + row.id + (pair ? ':pair:' + [...row.answerIds].sort().join(',') : row.features ? ':features' : ':selection');
    const tags = tagsByRecording.get(row.id);
    if (row.tagCount && tags.count > 10) continue;
    if (row.answerIds && !row.tagCount && !pair && (row.answerIds.length !== tags.answers.size || row.answerIds.length !== tags.count)) continue;
    if (imported.has(key)) continue;
    imported.add(key);
    const {bytes, knownIds, ...excerpt} = row;
    if (row.answerIds) {
      const answers = row.answerIds.map(id => byId.get(id));
      const levelRank = levels.indexOf(row.level);
      const national3Pair = pair && row.level === 'N3';
      const hasVocalTexture = national3Pair && answers.some(answer => national3TextureAnswers.has(answer.id));
      excerpt.candidateIds = concepts.flatMap(candidate => {
        if (incidentalDistractors.has(candidate.id) || rank(candidate) > levelRank ||
            (hasVocalTexture && candidate.id === 'MC-0048') || [...tags.known].some(id => overlaps(id, candidate.id))) return [];
        const scores = answers.map(answer => {
          const score = similarity(answer, candidate);
          if (score || !national3Pair) return score;
          if (national3TextureAnswers.has(answer.id) && national3TextureAlternatives.has(candidate.id)) return 1;
          return (answer.id === 'MC-0013' || answer.id === 'MC-0018') && national3PitchAlternatives.has(candidate.id) ? 1 : 0;
        });
        return scores.some(Boolean) ? [[candidate.id, ...scores]] : [];
      });
    }
    const target = path.join(root, row.relativeFile);
    if (!fs.existsSync(target) || !fs.readFileSync(target).equals(bytes)) fs.writeFileSync(target, bytes);
    output.push(excerpt);
  }
  const fileContent = '/* Generated by scripts/build-multi-concept-quiz.cjs. */\n' +
    '(function(excerpts){if(typeof module==="object"&&module.exports)module.exports=excerpts;else window.MusicDictionaryMultiConceptExcerpts=excerpts;})([\n' +
    output.map(excerpt => '  ' + JSON.stringify(excerpt)).join(',\n') + '\n]);\n';
  fs.writeFileSync(path.join(root, indexFile), fileContent);
  console.log('Imported ' + output.length + ' distinct level recordings.');
}

if (!process.argv[2]) throw new Error('Provide the local Audio Concept Library folder.');
build(path.resolve(process.argv[2]));
