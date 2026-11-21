(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./concept-level-priority'));
  else root.MLHCharades = factory(root.MLHConceptLevelPriority);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (prioritise) {
  'use strict';
  const codes = ['N3', 'N4', 'N5', 'H', 'AH'];
  const roundSeconds = 60;
  const durations = [45, 60, 90];
  const collections = [
    { id: 'all', label: 'All Concepts', icon: './app-icons/charades-collection-all.svg' },
    { id: 'styles', label: 'Styles', category: 0, icon: './app-icons/charades-collection-styles.svg' },
    { id: 'melody-harmony', label: 'Melody / Harmony', category: 1, icon: './app-icons/charades-collection-melody-harmony.svg' },
    { id: 'rhythm-tempo', label: 'Rhythm / Tempo', category: 2, icon: './app-icons/charades-collection-rhythm-tempo.svg' },
    { id: 'texture-structure-form', label: 'Texture / Structure / Form', category: 3, icon: './app-icons/charades-collection-texture-structure-form.svg' },
    { id: 'timbre', label: 'Timbre', category: 4, icon: './app-icons/charades-collection-timbre.svg' },
    { id: 'music-literacy', label: 'Music Literacy', icon: './app-icons/charades-collection-music-literacy.svg' },
  ];
  function pool(data, literacy, options) {
    const levelIndex = codes.indexOf(options.level);
    const collection = collections.find(item => item.id === (options.collection ?? 'all'));
    if (levelIndex < 0 || !collection) return [];
    const scope = options.earlier ? data.levels.slice(0, levelIndex + 1) : [data.levels[levelIndex]];
    const ids = collection.category === undefined ? null : new Set(scope.flatMap(level => data.tables[level][collection.category]));
    const candidates = collection.id === 'music-literacy' ? literacy
      : collection.id === 'all' ? [...data.concepts, ...literacy]
      : data.concepts.filter(concept => ids.has(concept.id));
    const seen = new Set();
    return candidates.filter(concept => {
      const code = codes.includes(concept.level) ? concept.level : data.codes[data.levels.indexOf(concept.level)];
      const index = codes.indexOf(code);
      const name = concept.name.toLocaleLowerCase().trim();
      if (index < 0 || (options.earlier ? index > levelIndex : index !== levelIndex) || seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  }
  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function standardDeck(data, literacy, level, random) {
    const candidates = shuffle(pool(data, literacy, { level, earlier: true }), random);
    return prioritise(candidates, concept => concept.level === level || concept.level === data.levels[codes.indexOf(level)]);
  }
  // A round has one deadline and a non-repeating deck. Inputs at the deadline
  // cannot earn points, even if a browser delayed its timer callback.
  function createRound(deck, now, seconds = roundSeconds) {
    if (!deck.length) throw new Error('Choose a level with available concepts.');
    return { deck: [...deck], deadline: now + (durations.includes(seconds) ? seconds : roundSeconds) * 1000, index: 0, history: [], ended: false };
  }
  function finish(round, outcome = 'time') {
    if (round.ended) return round;
    const current = round.deck[round.index];
    return { ...round, ended: true, history: current ? [...round.history, { ...current, outcome }] : round.history };
  }
  function answer(round, outcome, now) {
    if (round.ended || !['correct', 'skip'].includes(outcome)) return round;
    if (now >= round.deadline) return finish(round);
    const history = [...round.history, { ...round.deck[round.index], outcome }];
    const index = round.index + 1;
    return { ...round, index, history, ended: index === round.deck.length };
  }
  function summary(round) {
    return {
      correct: round.history.filter(item => item.outcome === 'correct').length,
      skipped: round.history.filter(item => item.outcome === 'skip').length,
      seen: round.history.length,
    };
  }
  return { codes, roundSeconds, durations, collections, pool, shuffle, standardDeck, createRound, answer, finish, summary };
});
