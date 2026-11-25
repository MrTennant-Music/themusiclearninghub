const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const bingo = require('../music-games/concept-bingo');
const gamesCollections = require('../shared/music-games-collections');
const hubCollections = require('../shared/hub-collections');
const simpleDefinitions = require('../music-dictionary/music-concepts-simple');
const catalogue = require('../music-dictionary/quiz-data/audio-library-selection.json');

const levels = Object.keys(bingo.levels);

test('each level has its curated definition pool drawn only from that level', () => {
  for (const level of levels) {
    const pool = bingo.pool(level);
    assert.equal(pool.length, level === 'AH' ? 44 : 50, level);
    assert.equal(new Set(pool.map(concept => concept.id)).size, pool.length, level);
    assert.equal(new Set(pool.map(concept => concept.clue)).size, pool.length, level);
    assert.ok(pool.some(concept => concept.id.startsWith('MC-')), level);
    assert.ok(pool.every(concept => concept.level === level && concept.clue), level);
    assert.ok(pool.every(concept => concept.clue.length <= 110), level);
    assert.deepEqual(bingo.pool(level), pool);
  }
  assert.equal(bingo.definitionClue({ name: 'Crotchet', definition: 'A crotchet is a one-beat note.' }), 'A one-beat note.');
  assert.equal(bingo.definitionClue({ name: 'Step / stepwise', definition: 'Stepwise movement goes to a neighbouring note.' }), '___ movement goes to a neighbouring note.');
  const national3Candidates = bingo.candidates('N3');
  assert.equal(national3Candidates.find(concept => concept.name === 'Allegro').clue, 'The Italian word for a fast tempo.');
  assert.equal(national3Candidates.find(concept => concept.id === 'MC-0055').definition, simpleDefinitions['MC-0055']);
});

test('collections need nine usable concepts and shared links reproduce the host pool', () => {
  const concepts = ['MC-0001','MC-0002','MC-0003','MC-0004','MC-0005','MC-0006','MC-0007','MC-0008','literacy-n3-crotchet'];
  const collection = { id: 'bingo-test', name: 'Styles and rhythm', concepts };
  const shortCollection = { ...collection, concepts: [...concepts.slice(0, 8), concepts[0], 'MC-9999'] };
  assert.ok(gamesCollections.sharedAvailability(shortCollection, 'bingo'));
  assert.equal(gamesCollections.sharedAvailability(collection, 'bingo'), '');
  const pool = bingo.collectionPool(collection);
  assert.deepEqual(pool.map(concept => concept.id), concepts);
  const recordings = bingo.recordings(catalogue.entries);
  assert.equal(bingo.collectionPool(collection, recordings.styles).length, 8);
  assert.equal(bingo.collectionPool(collection, recordings.instruments).length, 0);

  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  hubCollections.save(collection, storage);
  const launch = new URL(hubCollections.launch('bingo', collection, 'N3'), 'https://hub.test');
  const shared = new URL(hubCollections.shareUrl(launch.href, storage));
  assert.equal(shared.pathname, '/conceptbingo.html');
  assert.equal(shared.searchParams.has('myCollection'), false);
  const pupil = bingo.collectionPool(hubCollections.selected(shared.search, { getItem: () => null }));
  assert.deepEqual(pupil, pool);
});

test('audio rounds have fixed, cumulative and separate Styles and Instruments pools', () => {
  const recordings = bingo.recordings(catalogue.entries);
  const hashes = new Map(catalogue.entries.map(entry => [entry.path, entry.sha256]));
  for (const [topic, category, counts] of [
    ['styles', 'Styles', [8, 19, 31, 43, 50]],
    ['instruments', 'Timbre', [8, 30, 43, 43, 43]],
  ]) {
    for (const [index, level] of levels.entries()) {
      const pool = bingo.pool(level, recordings[topic]);
      assert.equal(pool.length, counts[index], level);
      const eligibleIds = new Set(bingo.candidates(level, recordings[topic]).map(concept => concept.id));
      if (index > 0) assert.ok(bingo.pool(levels[index - 1], recordings[topic]).every(concept => eligibleIds.has(concept.id)));
      const tracks = pool.map(concept => {
        assert.ok(levels.indexOf(concept.level) <= index, concept.name);
        assert.ok(concept.categories.includes(category), concept.name);
        assert.equal(concept.clue, '');
        const recording = decodeURIComponent(concept.audio).slice(2);
        assert.ok(fs.existsSync(path.join(__dirname, '..', recording)), recording);
        return hashes.get(recording) || recording;
      });
      assert.equal(new Set(tracks).size, pool.length, level);
    }
  }
  const styles = bingo.pool('N4', recordings.styles);
  const instruments = bingo.pool('N4', recordings.instruments);
  assert.ok(styles.every(style => instruments.every(instrument => style.id !== instrument.id)));
});

test('edited pool snapshots reproduce the same concepts and order for pupils', () => {
  const eligible = bingo.candidates('AH');
  const editedIds = eligible.slice(-12).reverse().map(concept => concept.id);
  const host = bingo.pool('AH', null, editedIds);
  assert.deepEqual(host.map(concept => concept.id), editedIds);
  assert.ok(host.some(concept => concept.id.startsWith('literacy-')));
  const pupil = bingo.selectPool(eligible, bingo.decodePool(bingo.encodePool(host)));
  assert.deepEqual(pupil, host);
  assert.ok(bingo.deal(pupil).every(concept => editedIds.includes(concept.id)));
  assert.equal(bingo.selectPool(bingo.candidates('N4'), editedIds), null);
  assert.equal(bingo.selectPool(eligible, editedIds.slice(0, 8)), null);
  assert.equal(bingo.selectPool(eligible, eligible.slice(0, 51).map(concept => concept.id)), null);
  assert.equal(bingo.selectPool(eligible, [...editedIds, editedIds[0]]), null);
});

test('a player gets nine distinct concepts from the round pool', () => {
  const pool = bingo.pool('N5');
  const card = bingo.deal(pool, () => 0.5);
  assert.equal(new Set(card).size, 9);
  assert.ok(card.every(concept => pool.includes(concept)));
});
