/* Shared, current Dictionary content for the Music Games definition collections. */
const D = require('../music-dictionary/music-concepts-data'),
  simple = require('../music-dictionary/music-concepts-simple'),
  policy = require('./music-games-excluded-concepts.cjs');
const key = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const codes = ['N3', 'N4', 'N5', 'H', 'AH'];
const concepts = D.concepts.filter(c => !policy.ids.has(c.id)),
  byId = new Map(concepts.map(c => [c.id, c]));
const alternatives = c => [...new Set([c.name, ...(c.aliases || []), ...c.name.split(/\s*\/\s*|\s+or\s+/)].filter(Boolean))];
const overlaps = (a, b) => a.id === b.id || alternatives(a).some(name => alternatives(b).some(other => key(name) === key(other))) || ['MC-0184', 'MC-0188'].includes(a.id) && ['MC-0184', 'MC-0188'].includes(b.id);
function definition(c) {
  return simple[c.id] || c.definition;
}
function word(c) {
  const short = {
    'MC-0020': 'Beats in the bar',
    'MC-0109': 'Middle eight',
    'MC-0227': 'Added sixth',
    'MC-0228': 'Diminished seventh',
    'MC-0230': 'Dominant seventh',
    'MC-0242': 'Three against two'
  };
  if (short[c.id]) return short[c.id];
  const variants = alternatives(c).map(name => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s*\([^)]*\)/g, '').split(/\s*\/\s*|\s+or\s+/)[0].trim());
  return variants.find(name => /^[A-Za-z '\u2019-]+$/.test(name) && name.replace(/[^A-Za-z]/g, '').length <= 24) || null;
}
// Prefer the existing Concept Quiz distractor families when a small collection needs extra choices.
function distractorCandidates(concept,level){const questions=require('../music-dictionary/quiz-data/audio-question-bank.json').questions;return questions.filter(q=>q.conceptId===concept.id&&q.options).flatMap(q=>q.options.filter(o=>!q.answer.correctOptionIds.includes(o.id))).map(o=>concepts.find(c=>alternatives(c).some(name=>key(name)===key(o.text)))).filter(c=>c&&codes.indexOf(level)>=D.levels.indexOf(c.level));}
function legacyDefinitionPack(a) {
  return !a.collectionId && a.specialMode !== 'level-test' && ['quiz', 'true-or-false', 'match-up', 'wordsearch', 'crossword'].includes(a.template) && a.folder === 'Music Dictionary' && !/literacy|reading music|rhythm lengths/i.test(a.title + ' ' + (a.tags || []).join(' '));
}
module.exports = {
  D,
  codes,
  concepts,
  byId,
  key,
  alternatives,
  overlaps,
  definition,
  word,
  distractorCandidates,
  legacyDefinitionPack
};
