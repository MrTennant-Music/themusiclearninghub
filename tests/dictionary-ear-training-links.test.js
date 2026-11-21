const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

global.window = { MLH: { useClickOutside() {} } };
window.PracticeMelodyGenerator = require('../practice-melody-generator.js');
for (const moduleName of ['aural-accompaniment', 'melodic-dictation-generator', 'ear-training-exercises', 'ear-training-piano-concepts', 'time-signatures-listening', 'tempo-changes-listening', 'aural-tonalities']) require(`../${moduleName}.js`);
let source = fs.readFileSync('generated-runtimes/auralrecognition-1.js', 'utf8');
source = source.slice(0, source.lastIndexOf('const root=document.getElementById')) + ';this.api={TOPICS,activitiesForLevel,assessmentConceptIdsForLevel};';
const context = vm.createContext({ window, React: { createElement() {}, Fragment: {} }, URLSearchParams, location: { search: '', href: 'http://localhost/auralrecognition.html' } });
vm.runInContext(source, context);
const { api } = context;
const dictionary = { window: {} };
vm.runInNewContext(fs.readFileSync('music-dictionary/music-concepts-games.js', 'utf8'), dictionary);
const links = dictionary.window.MUSIC_CONCEPT_GAMES;

test('every dictionary Ear Training link opens a current exercise at a supported level', () => {
  let count = 0;
  for (const [id, games] of Object.entries(links)) for (const game of games.filter(g => g.href?.startsWith('./auralrecognition.html'))) {
    count++;
    const url = new URL(game.href, 'http://localhost/');
    const level = url.searchParams.get('level'), topic = url.searchParams.get('exercise');
    assert.equal(game.level, level, id);
    assert.ok(api.activitiesForLevel(level).includes(topic), `${id}: ${level} ${topic} is not a current activity`);
    assert.equal(game.title, api.TOPICS[topic].label, id);
  }
  assert.ok(count > 50);
});

test('updated and newly linked concepts lead to exercises that include them', () => {
  const examples = {
    'MC-0037':'pattern-ostinato', 'MC-0158':'scale-chromatic', 'MC-0081':'change-key-yes', 'MC-0093':'vamp-yes', 'MC-0168':'modulation-yes',
    'MC-0246':'metre-change', 'MC-0245':'metre-irregular', 'MC-0086':'interval-octave',
    'MC-0171':'interval-semitone', 'MC-0173':'interval-tone', 'MC-0283':'interval-tritone',
    'MC-0241':'tierce-yes', 'MC-0281':'suspension-yes', 'MC-0291':'transform-inversion',
    'MC-0293':'transform-retrograde', 'MC-0243':'rhythm-augmentation', 'MC-0244':'rhythm-diminution',
    'MC-0179':'rallentando', 'MC-0229':'dim', 'MC-0277':'aug'
  };
  for (const [id, answer] of Object.entries(examples)) {
    const game = links[id].find(g => g.href?.startsWith('./auralrecognition.html'));
    assert.ok(game, `${id} has no Ear Training link`);
    const url = new URL(game.href, 'http://localhost/');
    assert.ok(api.assessmentConceptIdsForLevel(url.searchParams.get('level'), url.searchParams.get('exercise')).includes(answer), `${id} does not include ${answer}`);
  }
});
