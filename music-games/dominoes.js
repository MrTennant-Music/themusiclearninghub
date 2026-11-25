/* Shared Dominoes rules for practice, worksheets and classroom preparation. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./core'), require('../shared/music-games-collections'));
  } else {
    root.MLHDominoes = factory(root.IGCore, root.MLHGameCollections);
  }
})(globalThis, function (games, collections) {
  'use strict';

  const { dominoMinCards, dominoMaxCards } = collections;
  const fullSetMedalTimes = { bronze: 210000, silver: 150000, gold: 120000, diamond: 90000 };

  function medalTimesFor(conceptCount) {
    const proportion = conceptCount / (dominoMaxCards - 1);
    return Object.fromEntries(Object.entries(fullSetMedalTimes).map(([tier, milliseconds]) => [
      tier, Math.round(milliseconds * proportion / 1000) * 1000,
    ]));
  }

  function medalFor(matches, elapsed) {
    if (!matches.length || !matches.every(Boolean) || !Number.isFinite(elapsed) || elapsed < 0) return null;
    const medalTimes = medalTimesFor(matches.length);
    return Object.keys(medalTimes).findLast(tier => elapsed <= medalTimes[tier]) ?? null;
  }

  function cardLimit(level, collection) {
    return Math.min(dominoMaxCards, collections.dominoConcepts(level, collection).length + 1);
  }

  function newSet(level, collection, random = Math.random, cardCount = cardLimit(level, collection), previousIds = []) {
    const concepts = collections.dominoConcepts(level, collection);
    if (concepts.length < dominoMinCards - 1) throw Error('Choose a level or collection with at least 9 distinct concepts.');
    if (!Number.isInteger(cardCount) || cardCount < dominoMinCards || cardCount > Math.min(dominoMaxCards, concepts.length + 1)) {
      throw Error('Choose an available number of cards.');
    }
    const shuffled = games.shuffle(concepts, random);
    const selection = shuffled.slice(0, cardCount - 1);
    if (selection.length !== previousIds.length) return selection;
    const spare = shuffled[selection.length];
    if (spare && selection.every(concept => previousIds.includes(concept.id))) {
      selection[selection.length - 1] = spare;
    } else if (!spare && selection.every((concept, index) => concept.id === previousIds[index])) {
      selection.push(selection.shift());
    }
    return selection;
  }

  function chain(concepts) {
    return Array.from({ length: concepts.length + 1 }, (_, index) => ({
      id: concepts[index - 1]?.id ?? 'start',
      term: concepts[index - 1]?.name ?? 'Start',
      clue: concepts[index]?.definition ?? 'End',
      next: concepts[index]?.id ?? null,
    }));
  }

  function deal(concepts, random = Math.random) {
    const solution = chain(concepts);
    const shuffled = games.shuffle(solution.slice(1, -1), random);
    if (shuffled.length > 1 && shuffled.every((card, index) => card === solution[index + 1])) {
      shuffled.push(shuffled.shift());
    }
    const cards = solution.length > 1 ? [solution[0], ...shuffled, solution.at(-1)] : solution;
    return { solution, cards };
  }

  function grade(cards) {
    return cards.slice(1).map((card, index) => cards[index]?.next === card?.id);
  }

  function uniqueClueRecordings(concepts, entries) {
    const candidates = new Map(concepts.map(({ id }) => [id, []]));
    for (const entry of entries) {
      if (entry.sha256 && entry.path?.startsWith('audio/concept-library/')) {
        candidates.get(entry.conceptId)?.push(entry);
      }
    }

    const byHash = new Map();
    function assign(conceptId, visited) {
      for (const entry of candidates.get(conceptId)) {
        const hash = entry.sha256;
        if (visited.has(hash)) continue;
        visited.add(hash);
        const previous = byHash.get(hash);
        // Move the previous concept to another clip when it can free this one.
        if (!previous || assign(previous.conceptId, visited)) {
          byHash.set(hash, entry);
          return true;
        }
      }
      return false;
    }

    for (const { id } of concepts) assign(id, new Set());
    return new Map(Array.from(byHash.values(), ({ conceptId, path }) => [
      conceptId, './' + path.split('/').map(encodeURIComponent).join('/'),
    ]));
  }

  // Individual National 3–5 instruments from the Dictionary's Timbre category.
  const instrumentIds = new Set([
    'MC-0042', 'MC-0043', 'MC-0044', 'MC-0049', 'MC-0050', 'MC-0051', 'MC-0055', 'MC-0057',
    'MC-0116', 'MC-0117', 'MC-0119', 'MC-0120', 'MC-0121', 'MC-0123', 'MC-0124', 'MC-0125',
    'MC-0126', 'MC-0127', 'MC-0128', 'MC-0130', 'MC-0131', 'MC-0132', 'MC-0133', 'MC-0135',
    'MC-0137', 'MC-0138', 'MC-0139', 'MC-0140', 'MC-0141', 'MC-0143',
    'MC-0195', 'MC-0196', 'MC-0197', 'MC-0198', 'MC-0199', 'MC-0202', 'MC-0203', 'MC-0205',
    'MC-0206', 'MC-0210', 'MC-0211', 'MC-0212', 'MC-0213',
  ]);

  function instrumentClueRecordings(concepts, entries) {
    // Use a solo tabla recording so the clue cannot also be heard as sitar.
    const tablaSolo = {
      conceptId: 'MC-0211',
      path: 'audio/concept-library/03. National 5/05. Timbre/Tabla/03. Tabla Demonstration - Solo At Berklee - Tabla.m4a',
      sha256: '3564c1e4e72a5b994d90ce7cee2b799dcd06ccba18438457fde5c3f69a290bae',
    };
    const preferredRecordings = {
      'MC-0123': 'Domenico Dragonetti - Waltz No. 1 - Double Bass',
      'MC-0199': 'Clarsach Demonstration - Baz Valan - Clarsach',
    };
    const instrumentEntries = entries.filter(entry => {
      if (entry.category !== 'Timbre' || entry.conceptId === tablaSolo.conceptId) return false;
      const preferred = preferredRecordings[entry.conceptId];
      return !preferred || entry.recording === preferred;
    });
    return uniqueClueRecordings(concepts.filter(concept => instrumentIds.has(concept.id)), [...instrumentEntries, tablaSolo]);
  }

  function hostedSet(activityUrl, random = Math.random) {
    const params = new URL(activityUrl, 'https://classroom.invalid').searchParams;
    const level = params.get('level');
    if (!collections.data.codes.includes(level)) throw Error('Choose a level before hosting Dominoes.');
    const ids = params.get('dominoSet')?.split('.') || [];
    if (!ids.length) return newSet(level, null, random);
    const concepts = collections.dominoConcepts(level, { concepts: ids });
    if (ids.length < dominoMinCards - 1 || ids.length > dominoMaxCards - 1 || concepts.length !== ids.length) {
      throw Error('Choose a complete Dominoes set before hosting.');
    }
    return concepts;
  }

  return { cardLimit, newSet, chain, deal, grade, uniqueClueRecordings, instrumentClueRecordings, hostedSet, medalTimesFor, medalFor, shuffle: games.shuffle };
});
