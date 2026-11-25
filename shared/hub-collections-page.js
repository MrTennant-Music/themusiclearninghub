(function () {
  'use strict';
  const store = HubCollections, data = MLHGameConcepts;
  const get = id => document.getElementById(id);
  const dictionary = window.MUSIC_CONCEPTS;
  const progressStore = window.MusicConceptProgress;
  let progress = progressStore.read(window.localStorage);
  let showProgress = progressStore.readViews(window.localStorage).progress === true;
  const byId = new Map(dictionary.concepts.map(concept => [concept.id, concept]));
  const selectionColumns = data.categories.map((_, index) =>
    [...new Set(data.levels.flatMap(level => dictionary.tables[level][index]))].filter(id => byId.has(id)));
  const literacyConcepts = window.MLHGameCollections.literacyConcepts('ALL');
  const literacyById = new Map(literacyConcepts.map(concept => [concept.id, concept]));
  const literacyColumns = ['melody', 'rhythm', 'texture', 'dynamics']
    .map(category => literacyConcepts.filter(concept => concept.category === category));
  const literacyCurriculum = window.MLHMusicLiteracyCurriculum;
  const literacyDictionary = window.MLHMusicLiteracyDictionary;
  const musicIds = [...new Set(selectionColumns.flat())], literacyIds = new Set();
  const literacyChoices = new Map();
  const definitionsByTerm = new Map();
  for (const [level, columns] of literacyCurriculum.rows) {
    const code = data.codes[data.levels.indexOf(level)];
    const choices = new Map();
    for (const entry of columns.flatMap(literacyEntries)) {
      const label = literacyText(entry, true).textContent;
      const terms = literacyCurriculum.termsForEntry(label, code, literacyConcepts);
      const definition = literacyDictionary.forCurriculum(code, literacyCurriculum.entryMarkup(entry));
      choices.set(label, terms);
      for (const term of terms) {
        literacyIds.add(term.id);
        if (!definition) continue;
        // A playable term can appear in several curriculum entries. Prefer its own level and title.
        const rank = 2 * Number(code === term.level) + Number(label.toLowerCase() === term.name.toLowerCase());
        if (!definitionsByTerm.has(term.id) || rank > definitionsByTerm.get(term.id).rank) {
          definitionsByTerm.set(term.id, { definition, rank });
        }
      }
    }
    literacyChoices.set(level, choices);
  }
  const selectableIds = new Set([...musicIds, ...literacyIds]);
  const bulkSelections = [
    { ids: musicIds, prefix: 'MC-', select: get('select-all-concepts'), remove: get('remove-all-concepts') },
    { ids: [...literacyIds], prefix: 'literacy-', select: get('select-all-literacy'), remove: get('remove-all-literacy') },
  ];
  const params = new URLSearchParams(location.search);
  const searchText = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const preferred = params.get('app');
  const compoundTimeLabels = {
    'MC-0098': 'Recognising compound time',
    'MC-0176': 'Compound time signatures (6/8, 9/8 and 12/8)',
  };
  const draftKey = 'mlh:collection-editor-draft:v1';
  const millionaireSources = document.currentScript.dataset.millionaireScripts.trim().split(/\s+/);
  const catalog = ReactDOM.createRoot(get('catalog-collections'));
  const catalogSearch = get('catalog-search');
  const levelPicker = ReactDOM.createRoot(get('catalog-level'));
  const customise = ReactDOM.createRoot(get('collections-customise'));
  const shareOverlay = get('collection-share-overlay');
  const shareRoot = ReactDOM.createRoot(shareOverlay);
  const shareButton = get('share-collection');
  const h = React.createElement;
  const levelIcon = (file, className) => h('img', { src: './ui-icons/' + file + '.svg', alt: '', className });
  const catalogLevels = {
    ALL: { label: 'All Levels', icon: levelIcon('show-all', 'h-8 w-8 object-contain') },
    ...Object.fromEntries(data.codes.map((code, index) => [code, { label: data.levels[index] }])),
  };
  let catalogLevel = Object.hasOwn(catalogLevels, params.get('level')) ? params.get('level') : 'ALL';
  let currentId = null, builtIn = null, shared = null, editing = null;
  let millionaireBank;

  function readDraft() {
    try {
      const draft = JSON.parse(sessionStorage.getItem(draftKey));
      if (typeof draft?.name === 'string' && Array.isArray(draft.concepts)) return draft;
    } catch {}
    return null;
  }
  function persistDraft() {
    try {
      if (!editing) {
        sessionStorage.removeItem(draftKey);
        return;
      }
      sessionStorage.setItem(draftKey, JSON.stringify({
        id: editing.id,
        name: get('collection-name').value,
        concepts: [...editing.concepts],
        selectedOnly: get('concept-selected').checked,
      }));
    } catch {}
  }

  function node(tag, text) {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    return element;
  }
  function status(message) { get('collections-status').textContent = message; }
  function collectionUrl() {
    const url = new URL(location.href);
    url.searchParams.delete('hubCollection');
    url.searchParams.delete('savedCollection');
    url.searchParams.delete('builtInCollection');
    url.searchParams.delete('collectionUnavailable');
    if (builtIn) url.searchParams.set('hubCollection', builtIn.id);
    else if (shared) url.searchParams.set('builtInCollection', shared.snapshot);
    else if (currentId) {
      url.searchParams.set('savedCollection', currentId);
      const portable = new URL(store.shareUrl(url.href));
      const snapshot = portable.searchParams.get('builtInCollection');
      if (snapshot) url.searchParams.set('builtInCollection', snapshot);
    }
    return url;
  }
  function updateCollectionUrl(openingDetail = false) {
    if (openingDetail) history.pushState({ ...history.state, mlhCollectionOpenedFromList: true }, '', collectionUrl());
    else history.replaceState(history.state, '', collectionUrl());
    get('collection-unavailable').hidden = true;
  }
  function catalogCollection(group) {
    return {
      id: group.id, name: group.label, concepts: group.conceptIds, level: group.curriculumLevel || catalogLevel, builtIn: true,
      literacy: group.literacy, literacyLevel: group.literacyLevel,
      literacyRows: group.literacyRows, conceptCount: group.conceptCount,
    };
  }
  function literacyEntries(content) {
    return literacyCurriculum.entries(content);
  }
  function literacyGroup(level, exact) {
    const literacy = window.MLHGameCollections.literacyConcepts(level, !exact);
    const levels = new Set(literacy.map(concept => catalogLevels[concept.level].label));
    const literacyRows = literacyCurriculum.rows.filter(([label]) => levels.has(label));
    return {
      id: exact ? 'music-literacy-' + level.toLowerCase() : 'music-literacy',
      label: window.MLHGameCollections.literacyCollectionName(level, exact),
      glyph: './ui-icons/trebleclef.svg',
      conceptIds: literacy.map(concept => concept.id), literacy, literacyRows, conceptCount: literacy.length,
      literacyLevel: exact ? level : null,
      fullWidth: true,
    };
  }
  function catalogGroups(level) {
    const groups = MusicDictionaryQuizCollections.listedGroupsForLevel(level);
    const exactLevels = level === 'ALL' ? data.codes : [level];
    groups.push(literacyGroup(level, false), ...exactLevels.map(code => literacyGroup(code, true)));
    const pinned = group => group.curriculumLevel || group.fullWidth;
    const rank = group => data.codes.indexOf(group.curriculumLevel || group.literacyLevel);
    return groups.sort((a, b) => Number(Boolean(pinned(b))) - Number(Boolean(pinned(a)))
      || rank(a) - rank(b)
      || (a.curriculumColumn ?? data.categories.length) - (b.curriculumColumn ?? data.categories.length)
      || a.label.localeCompare(b.label, 'en-GB'));
  }
  function tableHeading(label) {
    const heading = node('th', label);
    heading.scope = 'col';
    return heading;
  }
  function conceptLevelBadge(code, label) {
    const badge = node('span', code);
    badge.className = 'mc-level-badge';
    badge.title = label;
    badge.setAttribute('aria-label', label);
    return badge;
  }
  function literacyHeadings(target) {
    const headers = literacyCurriculum.headings.map(tableHeading);
    headers[0].className = 'collections-literacy-melody';
    target.replaceChildren(...headers);
  }
  function literacyText(label, fromCurriculum = false, href, newTab = false) {
    const text = node(href ? 'a' : 'span'), name = node('span', label);
    text.className = href ? 'mc-levelled-link' : 'mc-levelled-text';
    if (href) {
      text.href = href;
      if (newTab) {
        text.target = '_blank';
        text.rel = 'noopener';
      }
    }
    name.className = 'mc-concept-name';
    if (fromCurriculum) name.innerHTML = literacyCurriculum.entryMarkup(label);
    text.append(name);
    return text;
  }
  function addLiteracyLevelBadge(text, code) {
    const badges = node('span');
    badges.className = 'mc-link-badges';
    badges.append(conceptLevelBadge(code, catalogLevels[code].label));
    text.append(badges);
  }
  function literacyRow(selectedRows, renderEntry, { selectedOnly = false, collectionsReturn, newTab } = {}) {
    const row = node('tr');
    row.append(...literacyCurriculum.headings.map((_, column) => {
      const cell = node('td'), list = node('ul');
      for (const [level, columns] of selectedRows) {
        const code = data.codes[data.levels.indexOf(level)];
        for (const entry of literacyEntries(columns[column])) {
          const item = node('li');
          const definition = literacyDictionary.forCurriculum(code, literacyCurriculum.entryMarkup(entry));
          const href = definition && literacyDictionary.href(definition.id, code, { collectionsReturn });
          if (renderEntry(item, literacyText(entry, true, href, newTab), level, definition)) list.append(item);
        }
      }
      if (list.childElementCount) cell.append(list);
      else if (!selectedOnly) cell.textContent = selectedRows.length === 1 ? selectedRows[0][1][column] : 'Not applicable';
      return cell;
    }));
    return row;
  }
  function renderLiteracyTable(selectedRows) {
    const url = collectionUrl();
    literacyHeadings(get('preview-headings'));
    get('preview-literacy').replaceChildren(literacyRow(selectedRows, (item, text, level) => {
      if (selectedRows.length > 1) {
        addLiteracyLevelBadge(text, data.codes[data.levels.indexOf(level)]);
      }
      item.append(text);
      return true;
    }, { collectionsReturn: url.pathname + url.search }));
  }
  function icon(src, className) {
    const image = node('img');
    image.src = src;
    image.alt = '';
    image.className = className;
    return image;
  }
  function loadMillionaireBank() {
    if (!millionaireBank) {
      // Load the full question bank only when someone opens a saved collection.
      millionaireBank = (async () => {
        for (const source of millionaireSources) {
          await new Promise((resolve, reject) => {
            const script = node('script');
            script.src = source;
            script.onload = resolve;
            script.onerror = reject;
            document.head.append(script);
          });
        }
        if (!window.MILLIONAIRE_CORE?.canComposeCollectionGame || !window.MILLIONAIRE_CONCEPT_QUESTIONS) {
          throw Error('Millionaire question bank unavailable.');
        }
        return window.MILLIONAIRE_QUESTION_BANK;
      })().catch(error => {
        millionaireBank = null;
        throw error;
      });
    }
    return millionaireBank;
  }
  function appCard(app, collection, level, unavailable) {
    const [name, , source] = store.applications[app];
    const card = node(unavailable ? 'span' : 'a');
    if (unavailable) card.setAttribute('aria-disabled', 'true');
    else {
      card.target = '_blank';
      card.rel = 'noopener';
      const launch = new URL(store.launch(app, collection, level, { includeSnapshot: Boolean(currentId) }), document.baseURI);
      if (shared) {
        launch.searchParams.delete('myCollection');
        launch.searchParams.set('builtInCollection', shared.snapshot);
      }
      card.href = launch.href;
      if (app === preferred) card.className = 'is-preferred';
    }
    const label = node('span', name);
    if (unavailable) label.append(node('small', unavailable));
    card.append(icon(source, 'collections-app-icon'), label);
    if (!unavailable) card.append(icon('./ui-icons/external-link.svg', 'collections-app-link-icon'));
    return card;
  }
  function renderList(rows) {
    get('saved-collections-intro').textContent = rows.length
      ? 'Open one of your saved collections or create a new one.'
      : 'Create a collection to use across Hub activities.';
    get('saved-collections').replaceChildren(...rows.map(row => {
      const button = node('button');
      button.type = 'button';
      button.className = 'collections-row';
      button.dataset.collectionId = row.id;
      const copy = node('span');
      copy.append(node('strong', row.name), node('small', row.concepts.length + (row.concepts.length === 1 ? ' concept' : ' concepts')));
      button.append(
        icon('./app-icons/my-collections-icon.svg', 'collections-row-icon'),
        copy
      );
      button.insertAdjacentHTML('beforeend', '<svg class="collections-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>');
      button.onclick = () => {
        currentId = row.id;
        updateCollectionUrl(true);
        status('');
        render();
        get('details-heading').focus();
      };
      return button;
    }));
  }
  function CatalogLevelPicker() {
    const { LevelButton, MenuPanel, LevelMenu, useClickOutside } = window.MLH;
    const [open, setOpen] = React.useState(false);
    const anchor = React.useRef(null);
    const close = () => {
      setOpen(false);
      anchor.current?.querySelector('button')?.focus();
    };
    useClickOutside([anchor], [() => setOpen(false)]);
    React.useEffect(() => {
      if (!open) return;
      const onEscape = event => { if (event.key === 'Escape') close(); };
      document.addEventListener('keydown', onEscape);
      return () => document.removeEventListener('keydown', onEscape);
    }, [open]);
    return h('div', { className: 'hub-menu-anchor', ref: anchor },
      h(LevelButton, {
        icon: levelIcon(catalogLevel === 'ALL' ? 'show-all' : 'levels', 'h-[26px] w-[28px] object-contain scale-[1.06]'),
        activeLabel: catalogLevels[catalogLevel].label,
        activeLevel: catalogLevel,
        dataMenuTrigger: true,
        expanded: open,
        onClick: () => setOpen(value => !value),
      }),
      open && h(MenuPanel, { title: 'Level', floating: true },
        h(LevelMenu, { activeLevel: catalogLevel, levels: catalogLevels, updateUrl: false, onSelect(level) {
          catalogLevel = level;
          const url = new URL(location.href);
          url.searchParams.set('level', level);
          history.replaceState(history.state, '', url);
          renderCatalog();
          close();
        } })),
    );
  }
  function EditorCustomise({ enabled }) {
    const { CustomiseButton, MenuPanel, MenuSubheading, MenuToggleRow, useClickOutside } = window.MLH;
    const [open, setOpen] = React.useState(false);
    const anchor = React.useRef(null);
    useClickOutside([anchor], [() => setOpen(false)]);
    React.useEffect(() => {
      if (!open) return;
      const closeOnEscape = event => {
        if (event.key !== 'Escape') return;
        setOpen(false);
        anchor.current?.querySelector('button')?.focus();
      };
      document.addEventListener('keydown', closeOnEscape);
      return () => document.removeEventListener('keydown', closeOnEscape);
    }, [open]);
    return h('div', { className: 'hub-menu-anchor', ref: anchor },
      h(CustomiseButton, {
        icon: levelIcon('customise', 'h-[21px] w-[21px] object-contain'),
        dataMenuTrigger: true,
        expanded: open,
        onClick: () => setOpen(value => !value),
      }),
      open && h(MenuPanel, { title: 'Customise', variant: 'customise', className: 'mc-main-customise' },
        h(MenuSubheading, null, 'Views'),
        h('div', { className: 'mc-view-setting' },
          h(MenuToggleRow, {
            label: 'My Progress',
            glyph: levelIcon('concept-progress', 'mc-view-glyph'),
            profileKey: false,
            checked: enabled,
            onChange() {
              showProgress = !showProgress;
              progressStore.saveViews(window.localStorage, { progress: showProgress });
              refreshProgressMarkers();
              renderEditorCustomise();
            },
          }),
          h('p', { className: 'mc-view-setting-description' }, 'Track which concepts you feel confident with.'),
        ),
      ),
    );
  }
  function renderEditorCustomise() {
    get('collections-customise').hidden = !editing;
    customise.render(editing ? h(EditorCustomise, { enabled: showProgress }) : null);
  }
  function renderCatalog() {
    const level = catalogLevel;
    const query = searchText(catalogSearch.value.trim());
    const groups = catalogGroups(level).filter(group => level === 'ALL' ? !group.literacyLevel : group.id !== 'music-literacy');
    const items = query ? groups.map(group => {
      const title = searchText(group.label);
      let matches = 0, exact = false;
      for (const id of new Set(group.conceptIds)) {
        const concept = byId.get(id) || literacyById.get(id);
        if (!concept) continue;
        const names = [concept.name, ...(concept.aliases || [])].map(searchText);
        if (names.some(name => name.includes(query))) matches++;
        if (names.includes(query)) exact = true;
      }
      const rank = title === query ? 4 : exact ? 3 : title.includes(query) ? 2 : matches ? 1 : 0;
      return { group, rank, coverage: matches / Math.max(1, group.conceptIds.length) };
    }).filter(match => match.rank).sort((a, b) => b.rank - a.rank || b.coverage - a.coverage)
      .map(match => match.group) : groups;
    catalog.render(items.length ? React.createElement(MusicDictionaryQuizzes.CollectionRows, {
      level, items, onLaunch(group) {
        builtIn = catalogCollection(group);
        updateCollectionUrl(true);
        status('');
        render();
        get('details-heading').focus();
      },
    }) : React.createElement('p', { role: 'status' }, 'No collections match your search.'));
  }
  function render() {
    const rows = store.list(), current = builtIn || rows.find(row => row.id === currentId) || shared?.row;
    const showWorkspace = Boolean(current || editing);
    const showDetail = Boolean(current && !editing);
    get('collections-overview').hidden = showWorkspace;
    get('collections-workspace').hidden = !showDetail;
    get('collections-back').hidden = !showWorkspace;
    get('collections-toolbar').hidden = !showWorkspace;
    get('collections-toolbar-title').hidden = !showDetail;
    get('collection-detail-actions').hidden = !showDetail;
    get('edit-collection').hidden = !currentId;
    get('delete-collection').hidden = !currentId;
    get('collections-toolbar-actions').hidden = !editing;
    renderEditorCustomise();
    if (!showWorkspace) renderList(rows);
    get('collection-detail').hidden = !showDetail;
    get('collection-editor').hidden = !editing;
    if (!showDetail) return;
    get('details-heading').textContent = current.name;
    get('preview-concepts').parentElement.hidden = Boolean(current.literacy);
    get('preview-literacy').hidden = !current.literacy;
    get('collection-literacy-preview').hidden = true;
    get('collection-concepts-table').hidden = false;
    get('preview-caption').textContent = current.literacy
      ? 'Music Literacy concepts grouped by level and musical element'
      : 'Collection concepts grouped by musical element';
    if (current.literacy) {
      const level = current.literacyLevel || (current.level === 'ALL' ? data.codes.at(-1) : current.level);
      const count = current.conceptCount;
      get('collection-size').textContent = count + (count === 1 ? ' concept' : ' concepts');
      renderLiteracyTable(current.literacyRows);
      get('collection-apps').replaceChildren(
        appCard('bingo', current, level, window.MLHGameCollections.sharedAvailability(current, 'bingo')),
        ...['crossword', 'wordsearch'].map(app => appCard(app, current, level))
      );
      return;
    }
    get('preview-headings').replaceChildren(...data.categories.map(tableHeading));
    const savedIds = new Set(current.concepts);
    const selected = current.concepts.map(id => byId.get(id)).filter(Boolean);
    const selectedLiteracy = literacyConcepts.filter(concept => savedIds.has(concept.id));
    const level = data.codes.includes(current.level) ? current.level : data.codes[Math.max(0,
      ...selected.map(concept => data.levels.indexOf(concept.level)),
      ...selectedLiteracy.map(concept => data.codes.indexOf(concept.level)))];
    const count = selected.length + selectedLiteracy.length;
    get('collection-size').textContent = count + (count === 1 ? ' concept' : ' concepts');
    if (selectedLiteracy.length) {
      const url = collectionUrl();
      const collectionsReturn = url.pathname + url.search;
      get('collection-concepts-table').hidden = !selected.length;
      get('collection-literacy-preview').hidden = false;
      get('collection-literacy-heading').hidden = !selected.length;
      get('preview-saved-literacy-results').replaceChildren(...literacyColumns.map(concepts => {
        const cell = node('td'), list = node('ul');
        for (const concept of concepts.filter(concept => savedIds.has(concept.id))) {
          const definition = definitionsByTerm.get(concept.id)?.definition;
          // Older collections can contain tempo terms from the Music Concepts bank.
          const legacy = !definition && dictionary.concepts.find(entry =>
            entry.name === concept.name && entry.level === catalogLevels[concept.level].label);
          const href = definition ? literacyDictionary.href(definition.id, definition.level, { collectionsReturn })
            : legacy ? './music-dictionary/musicdictionaryconcept.html?' + new URLSearchParams({
              concept: legacy.id, level: concept.level, collectionsReturn,
            }) : undefined;
          const item = node('li'), text = literacyText(concept.name, false, href);
          addLiteracyLevelBadge(text, concept.level);
          item.append(text);
          list.append(item);
        }
        cell.append(list);
        return cell;
      }));
    }
    const labels = ['rhythm-metre', 'scottish-music'].includes(current.id) ? compoundTimeLabels : {};
    renderConceptTable('preview-concepts', concept => savedIds.has(concept.id), undefined, labels);
    const apps = Object.keys(store.applications)
      .sort((a, b) => store.applications[a][0].localeCompare(store.applications[b][0], 'en-GB'));
    get('collection-apps').replaceChildren(...apps.map(app => {
      if (app === 'millionaire') {
        if (!selected.length) return appCard(app, current, level, 'Needs 15 different questions');
        const pending = appCard(app, current, level, 'Checking question availability…');
        loadMillionaireBank().then(bank => {
          if (!pending.isConnected) return;
          const unavailable = window.MILLIONAIRE_CORE.canComposeCollectionGame(bank, current.concepts)
            ? '' : 'Needs 15 different questions';
          pending.replaceWith(appCard(app, current, level, unavailable));
        }, () => {
          pending.replaceWith(appCard(app, current, level, 'Question availability could not be checked'));
        });
        return pending;
      }
      return appCard(app, current, level, window.MLHGameCollections.sharedAvailability(current, app));
    }));
  }
  function showList(focusId, message = '') {
    const catalogId = builtIn?.id;
    builtIn = null;
    shared = null;
    currentId = null;
    editing = null;
    persistDraft();
    const focusOverview = () => {
      status(message);
      if (catalogId) {
        (get('catalog-collections').querySelector(`[data-collection-id="${CSS.escape(catalogId)}"]`) || get('catalog-level').querySelector('button'))?.focus();
        return;
      }
      const row = focusId && get('saved-collections').querySelector(`[data-collection-id="${CSS.escape(focusId)}"]`);
      (row || get(message ? 'new-collection' : 'saved-heading')).focus();
    };
    if (history.state?.mlhCollectionOpenedFromList) {
      window.addEventListener('popstate', focusOverview, { once: true });
      history.back();
    } else {
      updateCollectionUrl();
      render();
      focusOverview();
    }
  }
  function updateSelection() {
    const selected = [...editing.concepts];
    const total = selected.length, outsideGrid = selected.filter(id => !selectableIds.has(id)).length;
    const count = total + (total === 1 ? ' concept' : ' concepts') + ' selected';
    get('selected-count').textContent = outsideGrid ? count + ' (' + outsideGrid + ' outside the grid)' : count;
    get('save-collection').disabled = !total || !get('collection-name').value.trim();
    for (const { ids, prefix, select, remove } of bulkSelections) {
      select.disabled = ids.every(id => editing.concepts.has(id));
      remove.disabled = !selected.some(id => id.startsWith(prefix));
    }
    persistDraft();
  }
  function updateProgressMarker(marker) {
    const progressStatus = progressStore.statusFor(progress, marker.dataset.progressConcept);
    const label = progressStore.options.find(option => option.key === progressStatus).label;
    marker.className = 'mc-progress-dot mc-progress-dot-' + progressStatus;
    marker.hidden = !showProgress;
    marker.setAttribute('aria-label', label);
    marker.title = label;
  }
  function refreshProgressMarkers() {
    get('collection-editor').querySelectorAll('[data-progress-concept]').forEach(updateProgressMarker);
  }
  function appendProgressMarker(name, id) {
    const marker = node('span');
    marker.dataset.progressConcept = id;
    marker.setAttribute('role', 'img');
    updateProgressMarker(marker);
    name.append(marker);
  }
  function renderConceptTable(target, includes, renderControl, labels = {}) {
    const seen = new Set();
    const previewUrl = renderControl ? null : collectionUrl();
    get(target).replaceChildren(...selectionColumns.map((ids, column) => {
      const cell = node('td'), list = node('ul');
      for (const id of ids) {
        const concept = byId.get(id);
        if (seen.has(id) || !includes(concept)) continue;
        seen.add(id);
        const item = node('li'), link = node('a');
        const level = data.codes[data.levels.indexOf(concept.level)];
        const badge = conceptLevelBadge(level, concept.level);
        const name = node('span', labels[id] || concept.name);
        name.className = 'mc-concept-name';
        const badges = node('span');
        badges.className = 'mc-link-badges';
        badges.append(badge);
        link.className = 'mc-levelled-link';
        const query = new URLSearchParams({ concept: id, level, column });
        if (previewUrl) query.set('collectionsReturn', previewUrl.pathname + previewUrl.search);
        link.href = './music-dictionary/musicdictionaryconcept.html?' + query;
        link.append(name, badges);
        if (renderControl) {
          const row = node('div');
          row.className = 'mc-quiz-select-row';
          link.target = '_blank';
          link.rel = 'noopener';
          appendProgressMarker(name, id);
          row.append(renderControl(concept, item), link);
          item.append(row);
        } else {
          item.append(link);
        }
        list.append(item);
      }
      cell.append(list);
      return cell;
    }));
  }
  function renderLiteracyEditor(selectedOnly) {
    const row = literacyRow(literacyCurriculum.rows, (item, text, level, definition) => {
      const name = text.textContent;
      const terms = literacyChoices.get(level).get(name);
      const ids = terms.map(term => term.id);
      if (selectedOnly && !ids.some(id => editing.concepts.has(id))) return false;
      if (definition) appendProgressMarker(text.querySelector('.mc-concept-name'), progressStore.literacyKey(definition.id));
      addLiteracyLevelBadge(text, data.codes[data.levels.indexOf(level)]);
      if (ids.length) {
        const choice = node('div');
        choice.className = 'mc-quiz-select-row collections-literacy-choice';
        const input = conceptCheckbox({ name }, item, ids, refreshLiteracySelection);
        input.dataset.literacyChoice = level + ': ' + name;
        if (terms.length > 1 || terms[0].name !== name) {
          choice.title = 'Playable terms: ' + terms.map(term => term.name).join(', ');
        }
        choice.append(input, text);
        item.append(choice);
      } else item.append(text);
      return true;
    }, { selectedOnly, newTab: true });
    get('literacy-results').replaceChildren(row);
  }
  function refreshLiteracySelection(input) {
    const table = get('literacy-results');
    const previous = [...table.querySelectorAll('input')];
    const index = previous.indexOf(input);
    renderLiteracyEditor(get('concept-selected').checked);
    const current = [...table.querySelectorAll('input')];
    const same = current.find(control => control.dataset.literacyChoice === input.dataset.literacyChoice);
    (same || current[Math.min(index, current.length - 1)] || get('concept-selected')).focus();
    updateEmptySelection();
  }
  function conceptCheckbox(concept, item, ids = [concept.id], refresh) {
    const input = node('input');
    const selected = ids.filter(id => editing.concepts.has(id)).length;
    input.className = 'mc-quiz-checkbox';
    input.type = 'checkbox';
    input.value = ids[0];
    input.checked = selected === ids.length;
    input.indeterminate = selected > 0 && selected < ids.length;
    input.setAttribute('aria-label', 'Select ' + concept.name);
    input.onchange = () => {
      for (const id of ids) {
        if (input.checked) editing.concepts.add(id);
        else editing.concepts.delete(id);
      }
      if (refresh) refresh(input);
      else if (get('concept-selected').checked && !input.checked) {
        const next = item.nextElementSibling || item.previousElementSibling;
        item.remove();
        (next?.querySelector('input') || get('concept-selected')).focus();
        updateEmptySelection();
      }
      updateSelection();
    };
    return input;
  }
  function updateEmptySelection() {
    get('concept-empty').hidden = Boolean(get('collection-editor').querySelector('.mc-quiz-checkbox'));
  }
  function renderChoices() {
    if (!editing) return;
    const selectedOnly = get('concept-selected').checked;
    const includes = concept => !selectedOnly || editing.concepts.has(concept.id);
    renderConceptTable('concept-results', includes, conceptCheckbox);
    renderLiteracyEditor(selectedOnly);
    updateEmptySelection();
    updateSelection();
  }
  function edit(row, draft) {
    const concepts = (row?.concepts ?? []).filter(id => typeof id === 'string');
    editing = { id: row?.id, concepts: new Set(concepts) };
    get('collection-name').value = row?.name || '';
    get('concept-selected').checked = draft?.selectedOnly === true;
    status('');
    render();
    renderChoices();
    if (!draft) get('collection-name').focus();
  }

  levelPicker.render(h(CatalogLevelPicker));
  catalogSearch.value = params.get('q') || '';
  function updateCatalogSearch() {
    const url = new URL(location.href), query = catalogSearch.value.trim();
    if (query) url.searchParams.set('q', query);
    else url.searchParams.delete('q');
    history.replaceState(history.state, '', url);
    renderCatalog();
  }
  catalogSearch.oninput = updateCatalogSearch;
  catalogSearch.onkeydown = event => {
    if (event.key !== 'Escape' || !catalogSearch.value) return;
    event.preventDefault();
    catalogSearch.value = '';
    updateCatalogSearch();
  };
  renderCatalog();
  get('concept-headings').replaceChildren(...data.categories.map(tableHeading));
  literacyHeadings(get('literacy-headings'));
  literacyHeadings(get('preview-saved-literacy-headings'));
  get('new-collection').onclick = () => edit();
  get('collections-back').onclick = () => {
    if (!editing?.id || !store.list().some(row => row.id === editing.id)) {
      showList(currentId);
      return;
    }
    currentId = editing.id;
    editing = null;
    persistDraft();
    status('');
    render();
    get('edit-collection').focus();
  };
  get('edit-collection').onclick = () => edit(store.list().find(row => row.id === currentId));
  shareButton.onclick = () => {
    const href = store.shareUrl(collectionUrl().href);
    let qrImageSrc = null;
    try {
      const qr = window.qrcode(0, 'L');
      qr.addData(href);
      qr.make();
      // The white share panel supplies the quiet zone around the QR image.
      qrImageSrc = 'data:image/svg+xml,' + encodeURIComponent(qr.createSvgTag({ margin: 0, scalable: true }));
    } catch {}
    const background = [...document.body.children].filter(element =>
      element.matches('header, main, footer, .footer') && !element.inert);
    function close() {
      window.removeEventListener('keydown', closeOnEscape);
      ReactDOM.flushSync(() => shareRoot.render(null));
      for (const element of background) element.inert = false;
      shareButton.focus();
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') close();
    }
    ReactDOM.flushSync(() => shareRoot.render(h(window.MLH.ProfileQrOverlay, {
      title: document.title, subtitle: get('details-heading').textContent,
      shareUrl: href, qrImageSrc, onClose: close,
    })));
    shareOverlay.querySelector('button').focus();
    for (const element of background) element.inert = true;
    window.addEventListener('keydown', closeOnEscape);
  };
  get('collection-name').oninput = updateSelection;
  for (const { ids, prefix, select, remove } of bulkSelections) {
    select.onclick = () => {
      for (const id of ids) editing.concepts.add(id);
      renderChoices();
    };
    remove.onclick = () => {
      for (const id of editing.concepts) {
        if (id.startsWith(prefix)) editing.concepts.delete(id);
      }
      renderChoices();
    };
  }
  get('concept-selected').onchange = renderChoices;
  get('collection-editor').onsubmit = event => {
    event.preventDefault();
    try {
      const isNew = !editing.id;
      currentId = store.save({ id: editing.id, name: get('collection-name').value, concepts: [...editing.concepts] }).id;
      editing = null;
      updateCollectionUrl(isNew);
      persistDraft();
      render();
      status('Collection saved.');
      get('details-heading').focus();
    } catch (error) { status(error.message); }
  };
  const confirmation = get('delete-confirm');
  get('delete-collection').onclick = () => { confirmation.returnValue = ''; confirmation.showModal(); };
  confirmation.addEventListener('close', () => {
    if (confirmation.returnValue !== 'delete') return;
    try {
      store.remove(currentId);
      showList(currentId, 'Collection deleted.');
    } catch (error) { status(error.message); }
  });
  window.addEventListener('storage', event => {
    if (event.key === progressStore.key || event.key === null) {
      progress = progressStore.read(window.localStorage);
      refreshProgressMarkers();
    }
    if (event.key === progressStore.viewsKey || event.key === null) {
      showProgress = progressStore.readViews(window.localStorage).progress === true;
      refreshProgressMarkers();
      renderEditorCustomise();
    }
    if ((event.key === store.key || event.key === null) && !editing) restoreCollectionFromUrl();
  });

  function restoreCollectionFromUrl() {
    const query = new URLSearchParams(location.search);
    catalogSearch.value = query.get('q') || '';
    catalogLevel = Object.hasOwn(catalogLevels, query.get('level')) ? query.get('level') : 'ALL';
    const groupId = query.get('hubCollection');
    const group = groupId && (catalogGroups(catalogLevel).find(group => group.id === groupId)
      || MusicDictionaryQuizCollections.groupsForLevel(catalogLevel).find(group => group.id === groupId));
    builtIn = group ? catalogCollection(group) : null;
    const savedId = query.get('savedCollection');
    currentId = !builtIn && store.list().find(row => row.id === savedId)?.id || null;
    const snapshot = query.get('builtInCollection');
    const row = !builtIn && !currentId && snapshot && store.selected(location.search);
    shared = row ? { row, snapshot } : null;
    if (currentId) history.replaceState(history.state, '', collectionUrl());
    const unavailable = ((savedId || snapshot) && !currentId && !shared)
      || (groupId && !builtIn) || query.has('collectionUnavailable');
    get('collection-unavailable').hidden = !unavailable;
    renderCatalog();
    render();
  }
  window.addEventListener('popstate', () => {
    editing = null;
    persistDraft();
    status('');
    restoreCollectionFromUrl();
  });
  try { store.importQuizzes(); } catch {}
  const draft = readDraft();
  if (draft) {
    currentId = store.list().find(row => row.id === draft.id)?.id || null;
    edit({ ...draft, id: currentId || undefined }, draft);
  } else restoreCollectionFromUrl();
  IGCore.listActivities().then(activities => {
    store.importActivities(activities);
    render();
  }).catch(() => {});
})();
