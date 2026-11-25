'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const dominoes = require('../music-games/dominoes');
const collections = require('../shared/music-games-collections');
const activities = require('../shared/classroom-activities');
const hubCollections = require('../shared/hub-collections');
const dictionary = require('../scripts/music-games-dictionary-content.cjs');

test('audio clues reassign shared recordings and exclude unavoidable duplicates', () => {
  const concepts = [{ id: 'first' }, { id: 'second' }, { id: 'third' }];
  const entries = [
    { conceptId: 'first', path: 'audio/concept-library/shared.m4a', sha256: 'same' },
    { conceptId: 'first', path: 'audio/concept-library/second choice.m4a', sha256: 'other' },
    { conceptId: 'second', path: 'audio/concept-library/copy.m4a', sha256: 'same' },
    { conceptId: 'third', path: 'audio/concept-library/copy.m4a', sha256: 'same' },
  ];
  const clips = dominoes.uniqueClueRecordings(concepts, entries);
  assert.equal(clips.get('first'), './audio/concept-library/second%20choice.m4a');
  assert.equal(clips.get('second'), './audio/concept-library/copy.m4a');
  assert.equal(clips.has('third'), false);
});

test('each qualification yields a single 20-card chain using Dictionary wording', () => {
  for (const [index, level] of collections.data.codes.entries()) {
    const concepts = dominoes.newSet(level, null, activities.random(528));
    assert.equal(concepts.length, 19);
    for (const concept of concepts) {
      const entry = dictionary.byId.get(concept.id);
      assert.equal(concept.level, collections.data.levels[index]);
      assert.equal(concept.name, entry.name);
      assert.equal(concept.definition, dictionary.definition(entry));
    }
    const { solution, cards } = dominoes.deal(concepts, activities.random(35));
    assert.equal(solution.length, 20);
    assert.deepEqual(solution[0], { id: 'start', term: 'Start', clue: concepts[0].definition, next: concepts[0].id });
    assert.equal(solution.at(-1).clue, 'End');
    assert.deepEqual(new Set(cards), new Set(solution));
    assert(cards[0] === solution[0] && cards[1] !== solution[1]);
    assert(dominoes.grade(solution).every(Boolean));
    assert(!dominoes.grade([solution[0], solution[2], solution[1], ...solution.slice(3)])[0]);
  }
});

test('collections need nine usable concepts and hosted play preserves the selected set', () => {
  const terms = dominoes.newSet('H', null, activities.random(19));
  const ids = terms.map(concept => concept.id);
  const small = { id: 'short', name: 'Short', concepts: [...ids.slice(0,8), ids[0], 'MC-9999'] };
  const full = { id: 'full', name: 'Full', concepts: ids };
  assert.match(collections.sharedAvailability(small, 'dominoes'), /at least 9/);
  assert.equal(collections.sharedAvailability(full, 'dominoes'), '');
  const { personal } = hubCollections.menuRows('dominoes', 'H', { listedGroupsForLevel: () => [] }, dictionary.D,
    row => !collections.sharedAvailability(row, 'dominoes'), [small, full], collections);
  assert.deepEqual(personal.map(row => row.id), ['full']);
  const url = '/dominoes.html?level=N5&dominoSet=' + ids.join('.');
  assert.equal(activities.settings(url).gameType, 'dominoes');
  assert.deepEqual(dominoes.hostedSet(url), terms);
  assert.throws(() => dominoes.hostedSet(url + '.' + ids[0]), /complete Dominoes set/);
  const subset = ids.slice(0,9);
  assert.equal(dominoes.hostedSet('/dominoes.html?level=H&dominoSet=' + subset.join('.')).length, 9);
  assert.throws(() => dominoes.hostedSet('/dominoes.html?level=H&dominoSet=' + subset.slice(1).join('.')), /complete Dominoes set/);
});

test('card counts include Start and collection defaults use all available concepts up to the cap', () => {
  const pool = collections.dominoConcepts('N5');
  const full = { concepts: pool.map(concept => concept.id) };
  const small = { concepts: full.concepts.slice(0,13) };
  const rng = activities.random(6);
  assert.equal(dominoes.cardLimit('N5', small), 14);
  assert.equal(dominoes.chain(dominoes.newSet('N5', small, rng)).length, 14);
  assert.throws(() => dominoes.newSet('N5', small, rng, 15), /available number/);
  assert.equal(dominoes.cardLimit('N5', full), 20);
  assert.notDeepEqual(
    dominoes.newSet('N5', full, activities.random(6)).map(concept => concept.id).sort(),
    dominoes.newSet('N5', full, activities.random(7)).map(concept => concept.id).sort()
  );
  for (let count=10;count<=20;count++) {
    assert.equal(dominoes.chain(dominoes.newSet('N5', full, rng, count)).length, count);
  }
});

test('a fresh draw avoids repeating the previous set even when the shuffle repeats', () => {
  const draw = (collection, previousIds) => dominoes.newSet('AH', collection, () => 0.5, 10, previousIds)
    .map(concept => concept.id);
  const first = draw(null);
  assert.notDeepEqual(draw(null, first).sort(), [...first].sort());

  const collection = { concepts: first };
  const previousOrder = draw(collection);
  const nextOrder = draw(collection, previousOrder);
  assert.notDeepEqual(nextOrder, previousOrder);
  assert.deepEqual(nextOrder.sort(), [...previousOrder].sort());
});

test('timed medals require every match and use inclusive thresholds', () => {
  const correct = dominoes.grade(dominoes.chain(dominoes.newSet('N5', null)));
  for (const [time, tier] of [[90000, 'diamond'], [90001, 'gold'], [120000, 'gold'],
    [120001, 'silver'], [150000, 'silver'], [150001, 'bronze'], [210000, 'bronze'], [210001, null]]) {
    assert.equal(dominoes.medalFor(correct, time), tier);
  }
  assert.equal(dominoes.medalFor([...correct, false], 1000), null);
  assert.equal(dominoes.medalFor([], 1000), null);
  assert.equal(dominoes.medalFor(correct, null), null);
});

test('shorter rounds scale all medal times by the number of concepts', () => {
  assert.deepEqual(dominoes.medalTimesFor(8), { bronze: 88000, silver: 63000, gold: 51000, diamond: 38000 });
  assert.deepEqual(dominoes.medalTimesFor(9), { bronze: 99000, silver: 71000, gold: 57000, diamond: 43000 });
  const eightStyles = dominoes.grade(dominoes.chain(dominoes.newSet('N5', null).slice(0, 8)));
  assert.equal(dominoes.medalFor(eightStyles, 38000), 'diamond');
  assert.equal(dominoes.medalFor(eightStyles, 38001), 'gold');
  assert.equal(dominoes.medalFor(eightStyles, 88001), null);
});

test('a deal starts with a filled, unsolved board and keeps Start and End in place', () => {
  for (let count = 10; count <= 20; count++) {
    const concepts = dominoes.newSet('N5', null, activities.random(19), count);
    const { cards, solution } = dominoes.deal(concepts, () => 0.999);
    assert.equal(cards[0], solution[0]);
    assert.equal(cards.at(-1), solution.at(-1));
    assert.deepEqual(new Set(cards), new Set(solution));
    assert.equal(cards.length, count);
    assert(!dominoes.grade(cards).every(Boolean));
  }
});
