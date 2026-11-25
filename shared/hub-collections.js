/* Concept lists shared by the Hub's activities within the current browser. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.HubCollections = api;
    api.recoverMissingLaunch();
  }
})(globalThis, function () {
  'use strict';

  const key = 'mlh:my-collections:v1';
  const applications = {
    bingo: ['Concept Bingo', 'conceptbingo.html', 'app-icons/concept-bingo-icon.png'],
    charades: ['Concept Charades', 'conceptcharades.html', 'app-icons/concept-charades-icon.svg'],
    escape: ['Escape Room', 'musicescape.html', 'app-icons/music-escape.svg'],
    crossword: ['Crosswords', 'crosswords.html', 'app-icons/crosswords-grid-icon.svg'],
    dominoes: ['Dominoes', 'dominoes.html', 'app-icons/dominoes-icon.svg'],
    wordsearch: ['Word Search', 'wordsearch.html', 'app-icons/wordsearch-icon.svg'],
    millionaire: ['Who Wants to Be a Millionaire?', 'whowantstobemillionaire/whowantstobeamillionaire.html', 'app-icons/millionaire-icon.svg'],
    quizzes: ['Concept Quizzes', 'conceptquiz.html', 'app-icons/concept-quiz-icon.svg'],
  };
  const validId = value => typeof value === 'string' && /^[a-z0-9-]{1,110}$/i.test(value);
  const isWordPuzzle = app => app === 'crossword' || app === 'wordsearch';
  const literacyId = /^literacy-(n3|n4|n5|h|ah)-[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const compactMusicId = /^[a-z0-9]{1,3}$/;
  const conceptIds = values => [...new Set(Array.isArray(values)
    ? values.filter(id => typeof id === 'string' && (/^MC-\d{4}$/.test(id) || literacyId.test(id))) : [])];
  const unpackMusicId = value => 'MC-' + parseInt(value, 36).toString().padStart(4, '0');
  function normalize(row) {
    const name = typeof row?.name === 'string' ? row.name.trim().slice(0, 160) : '';
    const concepts = conceptIds(row?.concepts);
    return validId(row?.id) && name && concepts.length ? { id: row.id, name, concepts } : null;
  }
  function read(storage) {
    try {
      const value = JSON.parse(storage.getItem(key));
      if (value?.version === 1 && Array.isArray(value.rows)) {
        return { version: 1, rows: value.rows.map(normalize).filter(Boolean), imported: Array.isArray(value.imported) ? value.imported.filter(validId) : [] };
      }
    } catch {}
    return { version: 1, rows: [], imported: [] };
  }
  function write(storage, value) { storage.setItem(key, JSON.stringify(value)); }
  function list(storage = window.localStorage) { return read(storage).rows; }
  function save({ id = globalThis.crypto.randomUUID(), name, concepts }, storage = window.localStorage) {
    const row = normalize({ id, name, concepts });
    if (!row) throw Error('Give the collection a name and choose at least one concept.');
    const value = read(storage);
    const index = value.rows.findIndex(item => item.id === id);
    if (index < 0) value.rows.push(row);
    else value.rows[index] = row;
    write(storage, value);
    return row;
  }
  function remove(id, storage = window.localStorage) {
    const value = read(storage);
    value.rows = value.rows.filter(row => row.id !== id);
    write(storage, value);
  }
  function updateQuizRows(previous, next, storage = window.localStorage) {
    const value = read(storage);
    const before = new Map(previous.map(row => [row.sharedId, normalize({ ...row, id: row.sharedId })]));
    const retained = new Set(next.map(row => row.sharedId).filter(Boolean));
    value.rows = value.rows.filter(row => !before.has(row.id) || retained.has(row.id));
    for (const item of next) {
      const row = normalize({ ...item, id: item.sharedId || globalThis.crypto.randomUUID() });
      if (!row) throw Error('Give the collection a name and choose at least one concept.');
      if (JSON.stringify(before.get(row.id)) === JSON.stringify(row)) continue;
      const index = value.rows.findIndex(entry => entry.id === row.id);
      if (index === -1) value.rows.push(row);
      else {
        const literacy = value.rows[index].concepts.filter(id => literacyId.test(id));
        value.rows[index] = { ...row, concepts: conceptIds([...row.concepts, ...literacy]) };
      }
    }
    write(storage, value);
  }
  function importRows(rows, storage) {
    const value = read(storage), imported = new Set(value.imported);
    const existing = new Set(value.rows.map(row => row.id));
    let changed = false;
    for (const entry of rows) {
      const row = normalize(entry);
      if (!row || imported.has(row.id)) continue;
      if (!existing.has(row.id)) value.rows.push(row);
      imported.add(row.id);
      changed = true;
    }
    if (changed) write(storage, { ...value, imported: [...imported] });
  }
  function importQuizzes(storage = window.localStorage) {
    let legacy;
    try {
      legacy = JSON.parse(storage.getItem('mlh-dictionary-quiz-groups-v1') ?? storage.getItem('mlh-concept-quiz-groups-v1'));
    } catch {}
    if (Array.isArray(legacy)) importRows(legacy.map((row, index) => ({ ...row, id: 'quiz-' + index })), storage);
  }
  function importActivities(activities, storage = window.localStorage) {
    importRows(activities.filter(row => ['group-sort', 'wordsearch', 'crossword'].includes(row.template) && row.tags?.includes('user-collection'))
      .map(row => ({ id: 'game-' + row.id, name: row.title, concepts: row.sourceConceptIds })), storage);
  }
  function selected(search = window.location.search, storage = window.localStorage) {
    const params = new URLSearchParams(search);
    const id = params.get('myCollection');
    if (id) {
      const saved = list(storage).find(row => row.id === id);
      if (saved) return saved;
    }
    try {
      const row = JSON.parse(params.get('builtInCollection'));
      if (typeof row?.mixedIds === 'string') {
        row.concepts = row.mixedIds.split('.').map(value =>
          compactMusicId.test(value) ? unpackMusicId(value) : 'literacy-' + value);
      } else if (typeof row?.ids === 'string' && /^[a-z0-9]{1,3}(?:-[a-z0-9]{1,3})*$/.test(row.ids)) {
        row.concepts = row.ids.split('-').map(unpackMusicId);
      }
      return normalize(row);
    }
    catch { return null; }
  }
  function snapshot(row) {
    const { id, name, concepts } = normalize(row);
    const ids = concepts.map(value => value.startsWith('MC-')
      ? Number(value.slice(3)).toString(36) : value.slice('literacy-'.length));
    return JSON.stringify(concepts.some(value => literacyId.test(value))
      ? { id, name, mixedIds: ids.join('.') } : { id, name, ids: ids.join('-') });
  }
  function shareUrl(href, storage = window.localStorage) {
    const url = new URL(href);
    const id = url.searchParams.get('myCollection') || url.searchParams.get('savedCollection');
    if (!id) return url.toString();
    const row = list(storage).find(item => item.id === id);
    if (row) {
      url.searchParams.delete('myCollection');
      url.searchParams.delete('savedCollection');
      url.searchParams.set('builtInCollection', snapshot(row));
    }
    return url.toString();
  }
  function standardLevelUrl(level) {
    const url = new URL(window.location.pathname, window.location.href);
    url.searchParams.set('level', level);
    return url.href;
  }
  function clearCollectionLink(name, level) {
    const label = 'Clear ' + name + ' and return to the selected level';
    return React.createElement('a', {
      className: 'hub-clear-collection-link', href: standardLevelUrl(level),
      'aria-label': label, title: label,
    },
    React.createElement('img', { className: 'hub-clear-collection-glyph', src: './ui-icons/concept-collections.svg', alt: '', width: 26, height: 26 }),
    React.createElement('span', { className: 'hub-clear-collection-name' }, name),
    React.createElement('img', { className: 'hub-clear-collection-cross', src: './ui-icons/cross.svg', alt: '', width: 18, height: 18 }));
  }
  function launchLevel(app, row, fallbackLevel) {
    if (row.builtIn && row.level && (row.level !== 'ALL' || app === 'quizzes')) return row.level;
    return fallbackLevel;
  }
  function launch(app, row, fallbackLevel, { includeSnapshot = false } = {}) {
    if (!Object.hasOwn(applications, app)) throw Error('Choose an activity.');
    const params = new URLSearchParams({ level: launchLevel(app, row, fallbackLevel) });
    if (isWordPuzzle(app) && row.literacy) params.set('literacy', row.literacyLevel ? 'level' : 'cumulative');
    else if (row.builtIn && app === 'quizzes') params.set('group', row.id);
    else if (row.builtIn) {
      params.set('builtInCollection', snapshot(row));
      if (row.level) params.set('collectionCatalogueLevel', row.level);
    }
    else {
      params.set('myCollection', row.id);
      if (includeSnapshot) params.set('builtInCollection', snapshot(row));
    }
    return './' + applications[app][1] + '?' + params;
  }
  function pageUrl(app, level, detail) {
    const params = new URLSearchParams({ app });
    if (level) params.set('level', level);
    if (detail) params.set(detail.builtIn ? 'hubCollection' : 'savedCollection', detail.id);
    return './mycollections.html?' + params;
  }
  function recoverMissingLaunch() {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('myCollection') && !url.searchParams.has('builtInCollection')) return;
    const app = Object.keys(applications).find(key =>
      new URL(applications[key][1], document.baseURI).pathname === url.pathname);
    if (!app) return;
    const row = selected();
    if (row && supportsSelectedConcepts(app, row) &&
      (app !== 'millionaire' || !window.MILLIONAIRE_CORE ||
        window.MILLIONAIRE_CORE.canComposeCollectionGame(window.MILLIONAIRE_QUESTION_BANK, row.concepts))) return;
    const catalogue = new URL(pageUrl(app, url.searchParams.get('level')), document.baseURI);
    catalogue.searchParams.set('collectionUnavailable', '1');
    window.location.replace(catalogue.href);
  }
  function supportsSelectedConcepts(app, row) {
    if (window.MLHGameCollections) return !window.MLHGameCollections.sharedAvailability(row, app);
    const music = (window.MUSIC_CONCEPTS || window.MLHGameConcepts || window.EscapeContent)?.concepts;
    const literacy = app === 'charades' ? window.MLHGameLiteracy : null;
    return (!music && !literacy) || Boolean(music?.some(concept => row.concepts.includes(concept.id))
      || literacy?.some(concept => row.concepts.includes(concept.id)));
  }
  let catalogueRequest;
  const catalogueReady = () => Boolean(window.MusicDictionaryQuizCollections && window.MusicDictionaryQuizzes);
  function loadCatalogue() {
    if (catalogueReady()) return Promise.resolve();
    if (!catalogueRequest) {
      const dependencies = [
        ['MUSIC_CONCEPTS', 'music-dictionary/music-concepts-data.js'],
        ['CONCEPT_RECALL_DATA', 'concept-recall-data.js'],
        ['CONCEPT_RECALL_CORE', 'concept-recall-core.js'],
        ['MusicConceptRevisionGroups', 'music-dictionary/music-concepts-revision-groups.js?v=0ddb26cbd12b'],
        ['MusicDictionaryQuizCollections', 'music-dictionary/quiz-collections.js?v=594ffa371c10'],
        ['MusicDictionaryQuizzes', 'music-dictionary/music-concepts-quizzes.js?v=82f9c49bea72'],
      ];
      catalogueRequest = (async () => {
        for (const [global, source] of dependencies) {
          if (window[global]) continue;
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = new URL(source, document.baseURI).href;
            script.onload = resolve;
            script.onerror = reject;
            document.head.append(script);
          });
          if (!window[global]) throw Error('Collection data unavailable');
        }
      })().catch(error => { catalogueRequest = null; throw error; });
    }
    return catalogueRequest;
  }
  const levelCodes = ['N3', 'N4', 'N5', 'H', 'AH'];
  const validLevel = level => level === 'ALL' || levelCodes.includes(level);
  function menuSelection(app, search, level, storage = window.localStorage) {
    const query = new URLSearchParams(search);
    const activeRow = selected(search, storage);
    const catalogueLevel = activeRow && query.get('collectionCatalogueLevel');
    const requested = [catalogueLevel, level, query.get('level')].find(validLevel) || 'ALL';
    if (activeRow) return { scope: requested, id: activeRow.id, builtIn: !query.has('myCollection') };
    if (isWordPuzzle(app) && query.get('literacy') === 'level') {
      return { scope: requested, id: 'music-literacy-' + requested.toLowerCase(), builtIn: true };
    }
    if (isWordPuzzle(app) && query.get('literacy') === 'cumulative' && requested === 'AH') {
      return { scope: 'ALL', id: 'music-literacy', builtIn: true };
    }
    if (app === 'quizzes') {
      let quiz;
      try { quiz = JSON.parse(query.get('quiz')); } catch {}
      return { scope: requested, id: quiz?.collectionId || query.get('group'), builtIn: true };
    }
    return { scope: requested, id: null, builtIn: false };
  }
  function menuRows(app, level, catalogue, dictionary, compatible, saved, games) {
    const rankById = new Map(dictionary.concepts.map(concept => [concept.id, dictionary.levels.indexOf(concept.level)]));
    const conceptRank = id => rankById.get(id) ?? levelCodes.indexOf(literacyId.exec(id)?.[1].toUpperCase());
    const highestLevel = row => levelCodes[Math.max(0, ...row.concepts.map(conceptRank))];
    const hub = catalogue.listedGroupsForLevel(level).map(group => ({
      id: group.id, name: group.label, concepts: group.conceptIds, qualification: group.qualification,
      glyph: group.glyph, builtIn: true, level: group.curriculumLevel || level,
    })).filter(compatible).map(row => ({ ...row, launchLevel: launchLevel(app, row, highestLevel(row)) }));
    if ((isWordPuzzle(app) || app === 'bingo') && games) {
      const exact = level !== 'ALL';
      const row = {
        id: exact ? 'music-literacy-' + level.toLowerCase() : 'music-literacy',
        name: games.literacyCollectionName(level, exact),
        concepts: games.literacyConcepts(level, !exact).map(concept => concept.id),
        glyph: './ui-icons/trebleclef.svg', builtIn: true, literacy: true,
        literacyLevel: exact ? level : null, launchLevel: exact ? level : levelCodes.at(-1),
      };
      if (app !== 'bingo' || compatible(row)) hub.unshift(row);
    }
    const personal = saved.filter(compatible).map(row => ({ ...row, launchLevel: highestLevel(row) }));
    return { hub, personal };
  }
  function SharedCollectionsMenu({ app, content, level }) {
    const e = React.createElement;
    const activeSelection = menuSelection(app, location.search, level);
    const { scope } = activeSelection;
    const [state, setState] = React.useState(() => catalogueReady() ? 'ready' : 'loading');
    const [saved, setSaved] = React.useState(() => list());
    const [hubExpanded, setHubExpanded] = React.useState(false);
    const hubListId = React.useId();
    React.useEffect(() => {
      let active = true;
      try { importQuizzes(); } catch {}
      setSaved(list());
      const refresh = event => { if (event.key === key || event.key === null) setSaved(list()); };
      window.addEventListener('storage', refresh);
      loadCatalogue().then(() => { if (active) setState('ready'); }, () => { if (active) setState('error'); });
      return () => { active = false; window.removeEventListener('storage', refresh); };
    }, []);
    const compatible = row => {
      if (app === 'millionaire') return window.MILLIONAIRE_CORE?.canComposeCollectionGame(window.MILLIONAIRE_QUESTION_BANK, row.concepts);
      return supportsSelectedConcepts(app, row);
    };
    const rows = React.useMemo(() => state === 'ready'
      ? menuRows(app, scope, window.MusicDictionaryQuizCollections, window.MUSIC_CONCEPTS, compatible, saved, window.MLHGameCollections)
      : null, [app, scope, state, saved]);
    function collectionCards(items) {
      return items.length ? items.map(row => {
        const current = row.id === activeSelection.id && Boolean(row.builtIn) === activeSelection.builtIn;
        const count = row.concepts.length;
        const countLabel = count + (count === 1 ? ' concept' : ' concepts');
        const glyphs = window.MusicDictionaryQuizzes;
        const glyph = row.qualification
          ? e('span', { className: 'hub-collection-menu-level' }, row.qualification === 'ALL' ? 'All' : row.qualification)
          : e('span', { className: 'hub-collection-menu-icon' }, e('img', {
            src: row.builtIn ? glyphs.collectionGlyph(row) : './app-icons/my-collections-icon.svg',
            style: row.builtIn ? glyphs.collectionGlyphStyle(row) : undefined,
            alt: '',
          }));
        return e('a', {
          key: (row.builtIn ? 'hub-' : 'saved-') + row.id, className: 'hub-collection-menu-row',
          href: launch(app, row, row.launchLevel), 'aria-current': current ? 'page' : undefined,
        },
        e('span', { className: 'hub-collection-menu-glyph', 'aria-hidden': true }, glyph),
        e('span', { className: 'hub-collection-menu-copy' },
          e('strong', null, row.name), e('small', null, countLabel)),
        current && e('img', { className: 'hub-collection-menu-tick', src: './ui-icons/tick.svg', alt: '' }));
      }) : e('p', { className: 'hub-collection-menu-status' }, 'No compatible collections.');
    }
    return e('div', { className: 'hub-shared-collections-menu' },
      content,
      rows ? e('div', { className: 'hub-collection-menu-section hub-collection-menu-dropdown' },
        e('button', {
          type: 'button', className: 'hub-collection-menu-disclosure',
          'aria-expanded': hubExpanded, 'aria-controls': hubListId,
          onClick: event => {
            event.stopPropagation();
            setHubExpanded(expanded => !expanded);
          },
        }, 'Collections', e('span', { className: 'hub-collection-menu-chevron', 'aria-hidden': true })),
        e('div', {
          id: hubListId, className: 'hub-collection-menu-reveal',
          inert: hubExpanded ? undefined : '',
        }, e('div', { className: 'hub-collection-menu-cards' },
          collectionCards([...rows.hub, ...rows.personal]))))
        : e('p', { className: 'hub-collection-menu-status', role: 'status' },
          state === 'error' ? 'Collections could not load.' : 'Loading collections…'));
  }
  function menu(app, content, level) {
    return React.createElement(SharedCollectionsMenu, { app, content, level });
  }
  return { key, applications, list, save, remove, updateQuizRows, importQuizzes, importActivities, selected, launch, shareUrl, standardLevelUrl, clearCollectionLink, pageUrl, menu, menuSelection, menuRows, recoverMissingLaunch };
});
