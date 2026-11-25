(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./core'), require('./dominoes'),
      require('../music-dictionary/music-concepts-data'),
      require('../music-dictionary/music-concepts-simple'),
      require('../music-dictionary/music-literacy-dictionary').entries,
      require('../shared/music-games-literacy'), require('../shared/music-games-collections')
    );
  } else {
    root.MLHBingo = factory(root.IGCore, root.MLHDominoes, root.MUSIC_CONCEPTS, root.MUSIC_CONCEPTS_SIMPLE,
      root.MLHMusicLiteracyDictionary.entries, root.MLHGameLiteracy, root.MLHGameCollections);
  }
})(globalThis, function (games, audioClues, dictionary, simpleDefinitions, literacy, shortLiteracy, collections) {
  'use strict';

  const levels = Object.fromEntries(['N3', 'N4', 'N5', 'H', 'AH'].map((code, index) => [code, { label: dictionary.levels[index] }]));
  const codes = Object.keys(levels);
  const maxCalls = 50;
  const cardSize = 9;
  const defaultDefinitionIds = {
    N3: [
      'literacy-crescendo', 'literacy-diminuendo', 'MC-0034', 'MC-0021', 'MC-0022', 'MC-0023',
      'MC-0009', 'MC-0010', 'literacy-crotchet', 'literacy-dotted-minim', 'MC-0013', 'MC-0012',
      'MC-0025', 'MC-0026', 'literacy-forte', 'MC-0052', 'MC-0014', 'MC-0015',
      'MC-0053', 'literacy-minim', 'MC-0028', 'MC-0027', 'literacy-piano', 'MC-0030',
      'MC-0037', 'MC-0016', 'MC-0058', 'MC-0031', 'MC-0017', 'MC-0038',
      'MC-0059', 'literacy-semibreve', 'MC-0018', 'MC-0060', 'MC-0039', 'MC-0032',
      'MC-0019', 'MC-0040', 'MC-0064', 'MC-0041', 'MC-0033', 'MC-0068',
      'MC-0063', 'literacy-double-barlines', 'MC-0047', 'literacy-barlines', 'MC-0054', 'MC-0061',
      'MC-0056', 'MC-0035',
    ],
    N4: [
      'MC-0095', 'MC-0113', 'MC-0096', 'MC-0097', 'MC-0114', 'MC-0070',
      'MC-0115', 'MC-0118', 'MC-0080', 'MC-0106', 'MC-0107', 'MC-0081',
      'MC-0098', 'MC-0071', 'MC-0122', 'MC-0083', 'MC-0108', 'MC-0100',
      'MC-0084', 'MC-0085', 'MC-0109', 'literacy-mezzo-forte', 'literacy-mezzo-piano', 'MC-0087',
      'MC-0086', 'MC-0088', 'MC-0089', 'literacy-quaver', 'MC-0101', 'MC-0075',
      'MC-0077', 'MC-0091', 'literacy-semiquaver', 'MC-0102', 'MC-0103', 'MC-0134',
      'MC-0105', 'MC-0104', 'MC-0136', 'MC-0110', 'MC-0111', 'MC-0112',
      'MC-0093', 'MC-0142', 'literacy-repeat-signs', 'literacy-paired-quavers', 'MC-0129', 'literacy-grouped-semiquavers',
      'MC-0099', 'MC-0094',
    ],
    N5: [
      'MC-0192', 'MC-0181', 'MC-0156', 'MC-0193', 'MC-0194', 'MC-0182',
      'MC-0158', 'MC-0147', 'MC-0159', 'MC-0148', 'MC-0200', 'MC-0183',
      'MC-0184', 'MC-0160', 'MC-0161', 'MC-0162', 'MC-0177', 'literacy-dotted-quaver',
      'literacy-fortissimo', 'MC-0201', 'MC-0163', 'MC-0164', 'MC-0187', 'MC-0186',
      'MC-0165', 'MC-0166', 'MC-0204', 'MC-0167', 'MC-0178', 'MC-0168',
      'MC-0169', 'MC-0170', 'MC-0188', 'MC-0179', 'MC-0208', 'literacy-pianissimo',
      'MC-0209', 'MC-0189', 'MC-0180', 'literacy-sforzando', 'MC-0171', 'MC-0190',
      'MC-0172', 'MC-0173', 'MC-0174', 'MC-0191', 'MC-0213', 'MC-0175',
      'MC-0207', 'literacy-first-second-time-bars',
    ],
    H: [
      'MC-0242', 'MC-0226', 'MC-0227', 'MC-0248', 'MC-0243', 'MC-0214',
      'MC-0257', 'MC-0258', 'MC-0250', 'literacy-da-capo', 'MC-0249', 'MC-0228',
      'MC-0244', 'MC-0231', 'MC-0230', 'MC-0259', 'MC-0232', 'MC-0215',
      'MC-0245', 'MC-0235', 'MC-0234', 'MC-0236', 'MC-0237', 'MC-0252',
      'MC-0238', 'literacy-phrase-mark', 'MC-0239', 'MC-0260', 'MC-0240', 'MC-0253',
      'literacy-slurs', 'MC-0225', 'MC-0254', 'MC-0255', 'MC-0256', 'MC-0241',
      'MC-0261', 'MC-0246', 'MC-0247', 'MC-0233', 'MC-0251', 'MC-0229',
      'MC-0222', 'MC-0220', 'MC-0219', 'MC-0217', 'MC-0216', 'MC-0218',
      'MC-0221', 'MC-0223',
    ],
    AH: [
      'MC-0280', 'MC-0276', 'MC-0286', 'MC-0287', 'MC-0265', 'MC-0297',
      'MC-0289', 'MC-0298', 'literacy-dal-segno', 'literacy-fine', 'MC-0290', 'MC-0285',
      'MC-0291', 'MC-0292', 'MC-0299', 'MC-0293', 'MC-0294', 'MC-0300',
      'MC-0295', 'literacy-ties', 'MC-0281', 'MC-0296', 'literacy-time-changes', 'literacy-five-four',
      'MC-0282', 'MC-0284', 'MC-0283', 'MC-0275', 'MC-0274', 'MC-0273',
      'MC-0270', 'MC-0271', 'MC-0272', 'MC-0269', 'MC-0268', 'literacy-enharmonic-equivalent',
      'MC-0267', 'MC-0266', 'MC-0288', 'MC-0263', 'MC-0277', 'MC-0264',
      'MC-0262', 'literacy-ottava',
    ],
  };
  const definitionClue = collections.bingoClue;
  const plainText = value => value.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const concepts = dictionary.concepts.map(concept => ({
    ...concept, level: codes[dictionary.levels.indexOf(concept.level)], definition: simpleDefinitions[concept.id],
  }));
  // These literacy entries describe concepts already represented in the Music Dictionary.
  const overlappingLiteracy = new Set([
    'steps', 'sequences', 'leaps', 'scotch-snap', 'triplets', 'accents', 'staccato',
    'diminished-seventh', 'dominant-seventh', 'added-sixth', 'augmented-triad', 'tritone', 'syncopated-rhythms',
  ]);
  const literacyClues = new Map(shortLiteracy.map(concept => [games.canonical(concept.name), concept.definition]));
  const literacyOverrides = {
    'treble-lines': 'The notes on the treble stave lines are E, G, B, D and F. The spaces spell FACE.',
    'double-barlines': 'Two vertical lines marking a section boundary or the end of a piece.',
    'treble-stave': 'The stave where the clef places G on the second line from the bottom.',
    'middle-c-to-ledger-a': 'The treble-clef note range from middle C to the first ledger line above the stave.',
    'tones-semitones-accidentals': 'The smallest steps on the keyboard and the signs that raise, lower or reset a note.',
    'scales-key-signatures-n5': 'The scales and key signatures for C, G and F major and A minor.',
    'chords-n5': 'Groups of notes played together in C, G or F major or A minor.',
    'first-second-time-bars': 'Different endings to play on the first and second passes of a repeat.',
    'bass-clef-e-to-c': 'The bass-clef note range from E below the stave up to middle C.',
    'chords-i-iv-v-vi': 'Chords built on the first, fourth, fifth and sixth notes of a scale.',
    'tonic-subdominant-dominant': 'The first, fourth and fifth notes of a scale.',
    'naming-diatonic-intervals': 'Naming the distance between two notes by counting their scale positions.',
    'writing-diatonic-intervals': 'Adding a note a given number of scale positions above a written treble-clef note.',
    'compound-time': 'Note values used when each beat divides into three, as in 6/8, 9/8 or 12/8.',
    'rests': 'Symbols showing lengths of silence, from half a beat to a full bar.',
    'bass-clef-ledger-range': 'Bass-clef notes from two ledger lines below the stave to two ledger lines above.',
    'rewriting-at-same-pitch': 'Changing clef while keeping a written note at the same sounding pitch.',
    'treble-down-octave-bass': 'Rewriting treble-clef notes eight scale steps lower in the bass clef.',
    'bass-up-octave-treble': 'Rewriting bass-clef notes eight scale steps higher in the treble clef.',
    'scales-key-signatures-ah': 'The scales and key signatures for D and B flat major and E and D minor.',
    'triad-inversions': 'Triads with their third or fifth as the lowest note.',
    'chord-ii-first-inversion': 'The chord on the second note of a major scale with its third in the bass.',
    'chords-at-cadences': 'Working out the chords already implied by a phrase ending or melody.',
    'inserting-cadence-chords': 'Choosing and writing in suitable chords to complete a phrase ending.',
    'bass-line-from-chords': 'Making a part below the melody using notes from the given chords.',
    'ottava': 'Directions to perform the notes one octave higher or lower.',
  };
  const definitions = [...concepts, ...literacy.filter(entry => !overlappingLiteracy.has(entry.id)).map(entry => {
    const name = plainText(entry.markup);
    const term = games.canonical(name.split(' — ').at(-1).replace(/\s*\([^)]*\)$/, ''));
    const definition = literacyOverrides[entry.id] || literacyClues.get(term) || literacyClues.get(term.replace(/s$/, ''))
      || literacyClues.get(games.canonical(name.split(' — ')[0])) || entry.definition;
    return { ...entry, id: 'literacy-' + entry.id, name, definition };
  })];

  function recordings(entries) {
    const styles = audioClues.uniqueClueRecordings(
      concepts.filter(concept => concept.categories.includes('Styles')),
      entries.filter(entry => entry.category === 'Styles')
    );
    const instruments = audioClues.instrumentClueRecordings(concepts, entries);
    return { styles, instruments };
  }

  function candidates(level, clips = null) {
    const limit = codes.indexOf(level);
    const names = new Set(), clues = new Set(), paths = new Set();
    return (clips ? concepts : definitions).flatMap(concept => {
      if (!concept.level || (clips ? codes.indexOf(concept.level) > limit : concept.level !== level)) return [];
      const audio = clips?.get(concept.id);
      const name = games.canonical(concept.name.replace(/\s+\([^)]*\)$/, ''));
      const clue = clips ? '' : definitionClue(concept);
      if (!name || names.has(name)) return [];
      if (clips ? !audio || paths.has(audio) : !clue || clues.has(games.canonical(clue))) return [];
      names.add(name);
      clues.add(games.canonical(clue));
      paths.add(audio);
      return [{ ...concept, clue, audio }];
    });
  }

  function selectPool(eligible, ids) {
    if (!Array.isArray(ids) || ids.length < cardSize || ids.length > maxCalls || new Set(ids).size !== ids.length) return null;
    const byId = new Map(eligible.map(concept => [concept.id, concept]));
    const selected = ids.map(id => byId.get(id));
    return selected.every(Boolean) ? selected : null;
  }

  function pool(level, clips = null, ids) {
    const eligible = candidates(level, clips);
    return selectPool(eligible, ids)
      ?? (clips ? null : selectPool(eligible, defaultDefinitionIds[level]))
      ?? eligible.slice(0, maxCalls);
  }

  function encodePool(pool) {
    return pool.map(({ id }) => id.startsWith('MC-') ? Number(id.slice(3)).toString(36) : id.slice('literacy-'.length)).join('.');
  }

  function decodePool(value) {
    return value.split('.', maxCalls + 1).map(part => /^[a-z0-9]{1,3}$/.test(part)
      ? 'MC-' + parseInt(part, 36).toString().padStart(4, '0')
      : 'literacy-' + part);
  }

  function collectionPool(collection, clips = null) {
    const concepts = collections.bingoConcepts(collection);
    if (!clips) return concepts.slice(0, maxCalls);
    const paths = new Set();
    return concepts.flatMap(concept => {
      const audio = clips.get(concept.id);
      if (!audio || paths.has(audio)) return [];
      paths.add(audio);
      return [{ ...concept, clue: '', audio }];
    }).slice(0, maxCalls);
  }

  function deal(conceptPool, random = Math.random) {
    return games.shuffle(conceptPool, random).slice(0, cardSize);
  }

  return { levels, maxCalls, cardSize, recordings, candidates, selectPool, pool, encodePool, decodePool, collectionPool, definitionClue, deal };
});
