const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../shared/concept-charades-core.js');
const data = require('../shared/music-games-concepts.js');
const literacy = require('../shared/music-games-literacy.js');
const deck = [{ id: 'a', name: 'Blues' }, { id: 'b', name: 'Jazz' }, { id: 'c', name: 'Rock' }];

test('all seven collections are available at every qualification level', () => {
  assert.equal(C.collections.length, 7);
  for (const level of C.codes) for (const collection of C.collections) {
    assert.ok(C.pool(data, literacy, { level, collection: collection.id, earlier: false }).length, level + ': ' + collection.label);
    assert.ok(require('node:fs').existsSync(require('node:path').resolve(__dirname, '..', collection.icon)), collection.icon);
  }
});

test('category collections follow the curriculum tables and the earlier-level toggle', () => {
  for (const [rank, level] of C.codes.entries()) for (const collection of C.collections.filter(item => item.category !== undefined)) {
    for (const earlier of [false, true]) {
      const scope = earlier ? data.levels.slice(0, rank + 1) : [data.levels[rank]];
      const ids = new Set(scope.flatMap(label => data.tables[label][collection.category]));
      const expected = new Set(data.concepts.filter(item => ids.has(item.id) && scope.includes(item.level)).map(item => item.name.toLowerCase().trim()));
      const actual = C.pool(data, literacy, { level, earlier, collection: collection.id });
      assert.deepEqual(new Set(actual.map(item => item.name.toLowerCase().trim())), expected, level + ': ' + collection.label);
      assert.ok(actual.every(item => !item.id.startsWith('literacy-')));
    }
  }
});

test('music-literacy collections contain only literacy from the selected level scope', () => {
  for (const [rank, level] of C.codes.entries()) for (const earlier of [false, true]) {
    const actual = C.pool(data, literacy, { level, earlier, collection: 'music-literacy' });
    const expected = new Set(literacy.filter(item => earlier ? C.codes.indexOf(item.level) <= rank : item.level === level).map(item => item.name.toLowerCase().trim()));
    assert.deepEqual(new Set(actual.map(item => item.name.toLowerCase().trim())), expected);
    assert.ok(actual.every(item => item.id.startsWith('literacy-')));
  }
});

test('an unselected or unknown collection cannot start a round', () => {
  for (const collection of ['', 'unknown']) {
    const pool = C.pool(data, literacy, { level: 'N3', collection });
    assert.deepEqual(pool, []);
    assert.throws(() => C.createRound(pool, 0));
  }
});

test('every curriculum concept is available at its own level', () => {
  const available = new Set(C.codes.flatMap(level => C.pool(data, literacy, { level, earlier: false })).map(item => item.id));
  for (const concept of data.concepts) assert.ok(available.has(concept.id), concept.name);
});
test('levels have exact scope and optional cumulative scope', () => {
  for (const [index, level] of C.codes.entries()) {
    const own = C.pool(data, [], { level, earlier: false });
    assert.ok(own.length);
    assert.ok(own.every(item => item.level === data.levels[index]));
    const cumulative = C.pool(data, [], { level, earlier: true });
    assert.ok(cumulative.every(item => data.levels.indexOf(item.level) <= index));
    assert.equal(cumulative.length, new Set(data.concepts.filter(item => data.levels.indexOf(item.level) <= index).map(item => item.name.toLowerCase().trim())).size);
  }
});
test('literacy is included and duplicate names are shown only once', () => {
  const pool = C.pool(data, literacy, { level: 'AH', earlier: true });
  assert.ok(pool.some(item => item.id.startsWith('literacy-')));
  assert.equal(pool.length, new Set(pool.map(item => item.name.toLowerCase().trim())).size);
  assert.deepEqual(C.pool(data, literacy, { level: 'invalid' }), []);
});
test('shuffle preserves a deck without mutating or repeating concepts', () => {
  const result = C.shuffle(deck, () => 0);
  assert.notDeepEqual(result, deck);
  assert.deepEqual(result.map(item => item.id).sort(), deck.map(item => item.id).sort());
  assert.equal(deck[0].id, 'a');
});
test('rounds default to 60 seconds and support the three timer options', () => {
  assert.equal(C.roundSeconds, 60);
  assert.equal(C.createRound(deck, 100).deadline, 60100);
  for (const seconds of [45, 60, 90]) {
    const round = C.createRound(deck, 100, seconds);
    assert.equal(round.deadline, 100 + seconds * 1000);
    assert.equal(C.summary(C.answer(round, 'correct', round.deadline)).correct, 0);
  }
  assert.equal(C.createRound(deck, 100, 30).deadline, 60100);
  assert.throws(() => C.createRound([], 0));
});
test('correct and skip record chronological outcomes, then expiry records the final visible concept', () => {
  let round = C.createRound(deck, 0);
  round = C.answer(round, 'correct', 100);
  round = C.answer(round, 'skip', 200);
  round = C.finish(round);
  assert.deepEqual(round.history.map(item => [item.name, item.outcome]), [['Blues', 'correct'], ['Jazz', 'skip'], ['Rock', 'time']]);
  assert.deepEqual(C.summary(round), { correct: 1, skipped: 1, seen: 3 });
  assert.equal(C.finish(round), round);
  assert.equal(C.answer(round, 'correct', 300), round);
});
test('an answer at or after the deadline never earns points', () => {
  for (const now of [60000, 80000]) {
    const round = C.answer(C.createRound(deck, 0), 'correct', now);
    assert.equal(round.ended, true);
    assert.equal(C.summary(round).correct, 0);
    assert.equal(round.history[0].outcome, 'time');
  }
});
test('exhausting the deck ends the round without repeating or inventing a concept', () => {
  let round = C.createRound(deck, 0);
  for (let i = 0; i < deck.length; i++) round = C.answer(round, 'correct', i * 500);
  assert.equal(round.ended, true);
  assert.deepEqual(C.summary(round), { correct: 3, skipped: 0, seen: 3 });
  assert.equal(C.finish(round), round);
});
test('ending early distinguishes the unfinished concept from a skipped answer', () => {
  const round = C.finish(C.createRound(deck, 0), 'ended');
  assert.equal(round.history[0].outcome, 'ended');
  assert.deepEqual(C.summary(round), { correct: 0, skipped: 0, seen: 1 });
});

test('the standard deck gives the selected level priority and includes all earlier levels', () => {
  const data = require('../shared/music-games-concepts');
  const literacy = require('../shared/music-games-literacy');
  const deck = C.standardDeck(data, literacy, 'N5', () => 0.42);
  const ranks = deck.map(concept => Math.max(C.codes.indexOf(concept.level), data.levels.indexOf(concept.level)));
  assert.deepEqual([...new Set(ranks)].sort(), [0, 1, 2]);
  assert.deepEqual(ranks.slice(0, 6).map(rank => rank === 2), [true, true, false, true, true, false]);
});
