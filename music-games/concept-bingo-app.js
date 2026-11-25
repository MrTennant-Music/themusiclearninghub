(function () {
  'use strict';

  const h = React.createElement;
  const { useEffect, useLayoutEffect, useMemo, useRef, useState } = React;
  const B = window.MLHBingo, H = window.MLH;
  const params = new URLSearchParams(location.search);
  const title = 'Concept Bingo';
  const subtitle = 'Match definitions or recordings to musical concepts on your bingo card.';
  const appIcon = './app-icons/concept-bingo-icon.png';
  const poolsKey = 'mlh:bingo-pools:v1';
  const winnerMessage = 'We have a winner!';
  const victoryTrack = './audio/Bingo%20Victory.m4a';
  const victoryFadeSeconds = 4;
  const icon = (name, className) => h('img', { src: './ui-icons/' + name + '.svg', alt: '', className });
  const clueModes = {
    definitions: { label: 'Definitions', icon: icon('definition', 'bingo-control-icon') },
    styles: {
      label: 'Styles', category: 'style',
      icon: h('img', { src: './app-icons/charades-collection-styles.svg', alt: '', className: 'bingo-control-icon' }),
    },
    instruments: { label: 'Instruments', category: 'instrument', icon: icon('keyboard', 'bingo-control-icon') },
  };
  const clueMenuOptions = Object.fromEntries(Object.entries(clueModes).map(([key, { label, category, icon }]) => [
    key,
    {
      icon,
      label: category ? h('span', null, label, ' ',
        h('span', { className: 'bingo-audio-tag' },
          h('img', { src: './ui-icons/audio-svgrepo-com.svg?v=20260722-smaller15', alt: 'Audio' }))) : label,
    },
  ]));
  const button = (label, props = {}, variant = '') => h('button', {
    type: 'button', ...props, className: 'bingo-button' + (variant ? ' is-' + variant : ''),
  }, label);

  function readPools() {
    try {
      const saved = JSON.parse(localStorage.getItem(poolsKey));
      return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    } catch {
      return {};
    }
  }

  function useRecordings(needed) {
    const [clips, setClips] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const [retry, setRetry] = useState(0);
    useEffect(() => {
      if (!needed || clips) return undefined;
      const controller = new AbortController();
      setLoadError(false);
      fetch('./music-dictionary/quiz-data/audio-library-selection.json', { signal: controller.signal })
        .then(response => {
          if (!response.ok) throw Error('Audio catalogue unavailable');
          return response.json();
        })
        .then(({ entries }) => { if (!controller.signal.aborted) setClips(B.recordings(entries)); })
        .catch(() => { if (!controller.signal.aborted) setLoadError(true); });
      return () => controller.abort();
    }, [needed, clips, retry]);
    return { clips, loadError, retryAudio: () => setRetry(value => value + 1) };
  }

  function Player({ pool }) {
    const [card] = useState(() => B.deal(pool));
    const [marked, setMarked] = useState(() => new Set());
    const complete = marked.size === B.cardSize;

    function toggle(id) {
      setMarked(previous => {
        const next = new Set(previous);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }

    return h('section', { className: 'bingo-player', 'aria-label': 'Your bingo card' },
      h('div', { role: 'status' },
        complete && h('div', { className: 'bingo-win-banner' },
          h('strong', null, 'Bingo!'), ' Shout “Bingo!” and show your card to the host.')),
      h('div', { className: 'bingo-grid' }, card.map(concept => h('button', {
        type: 'button', key: concept.id, className: 'bingo-square', 'aria-pressed': marked.has(concept.id),
        onClick: () => toggle(concept.id),
      }, h('span', null, concept.name)))),
      h('p', { className: 'bingo-caption' }, 'Tap a concept when you recognise its clue. Tap again to unmark it.'));
  }

  function ClueDisplay({ total, number, clue, category, winner, playbackControl, children }) {
    const ready = !winner && number === 0;
    return h('section', {
      className: 'bingo-display' + (winner ? ' is-winner' : ''),
      'aria-label': 'Pupil display',
    },
      winner && h(H.FinalConfetti),
      h('div', { className: 'bingo-display-copy', 'aria-live': 'polite', 'aria-atomic': true },
        !winner && number > 0 && h('p', { className: 'bingo-display-number' }, 'Clue ' + number + ' / ' + total),
        h('h2', null, winner ? winnerMessage : ready ? title : category ? 'Which ' + category + ' can you hear?' : clue),
        playbackControl,
        ready && h('span', { className: 'bingo-card-glyph bingo-intro-glyph', 'aria-hidden': true })),
      children);
  }

  function HostPanel({ title, children }) {
    const heading = useRef(null);
    const headingId = React.useId();
    useLayoutEffect(() => {
      heading.current.focus();
    }, []);
    return h('section', { className: 'bingo-host-panel', 'aria-labelledby': headingId },
      h('h2', { ref: heading, id: headingId, tabIndex: -1 }, title),
      children);
  }

  function scrollCalledAnswers(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const list = event.currentTarget;
    const offsets = {
      ArrowDown: 40,
      ArrowUp: -40,
      PageDown: list.clientHeight,
      PageUp: -list.clientHeight,
      Home: -list.scrollTop,
      End: list.scrollHeight,
      ' ': event.shiftKey ? -list.clientHeight : list.clientHeight,
    };
    if (!Object.hasOwn(offsets, event.key)) return;
    event.preventDefault();
    list.scrollTop += offsets[event.key];
  }

  function CheckAnswers({ called, close, canDeclareWinner, onDeclareWinner }) {
    const [search, setSearch] = useState('');
    const list = useRef(null);
    const searchable = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('en-GB');
    const query = searchable(search.trim());
    const matches = called
      .map((concept, index) => ({ concept, number: index + 1 }))
      .filter(({ concept }) => searchable(concept.name).includes(query));

    return h(HostPanel, { title: 'Check Answers' },
      h('input', {
        type: 'search', className: 'bingo-answer-search', value: search,
        placeholder: 'Search', 'aria-label': 'Search called answers',
        onChange: event => {
          if (list.current) list.current.scrollTop = 0;
          setSearch(event.target.value);
        },
      }),
      matches.length
        ? h('ol', { ref: list, className: 'bingo-called-answers', 'aria-label': 'Called answers', tabIndex: 0, onKeyDown: scrollCalledAnswers },
          matches.map(({ concept, number }) => h('li', { key: concept.id, value: number }, concept.name)))
        : h('p', { role: 'status' }, called.length ? 'No matching answers.' : 'No answers have been called yet.'),
      h('div', { className: 'bingo-actions' },
        h(H.ToolbarButton, {
          label: 'Back', icon: icon('next', 'h-[27.8px] w-[27.8px] rotate-180'), className: 'gap-2', onClick: close,
        }),
        button('Declare Winner', { disabled: !canDeclareWinner, onClick: onDeclareWinner }, 'black')));
  }

  function Host({ pool, mode, renderToolbar, onQuit }) {
    const { category } = clueModes[mode];
    const audio = Boolean(category);
    const [deck] = useState(() => audio ? window.IGCore.shuffle(pool) : pool);
    const [number, setNumber] = useState(0);
    const [drawnCount, setDrawnCount] = useState(0);
    const [played, setPlayed] = useState(() => new Set());
    const [playing, setPlaying] = useState(false);
    const [winner, setWinner] = useState(false);
    const [checkingAnswers, setCheckingAnswers] = useState(false);
    const [audioMessage, setAudioMessage] = useState('');
    const playback = useRef(null);
    const victoryContext = useRef(null);
    const returnFocus = useRef(null);
    const current = deck[number - 1];
    const latest = deck[drawnCount - 1];
    const called = deck.slice(0, drawnCount).filter(concept => !audio || played.has(concept.id));
    const canDrawNext = !winner && drawnCount < deck.length && (!audio || !latest || played.has(latest.id));
    useLayoutEffect(() => {
      if (checkingAnswers || !returnFocus.current) return;
      returnFocus.current.focus();
      returnFocus.current = null;
    }, [checkingAnswers]);

    useEffect(() => {
      const onPageHide = () => playback.current?.pause();
      window.addEventListener('pagehide', onPageHide);
      return () => {
        window.removeEventListener('pagehide', onPageHide);
        releaseClip(playback.current);
        playback.current = null;
      };
    }, []);

    function releaseClip(clip, immediate = false) {
      const context = victoryContext.current;
      victoryContext.current = null;
      if (immediate) clip?.pause();
      const released = immediate ? Promise.resolve() : H.fadeOutAudio(clip);
      if (context) released.then(() => context.close()).catch(() => {});
    }

    function fadeAtEnd(clip) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      let gain;
      if (AudioContext) {
        try {
          const context = new AudioContext();
          victoryContext.current = context;
          const output = H.audioOutput(context);
          context.createMediaElementSource(clip).connect(output);
          gain = output.gain;
          context.resume().catch(() => {});
        } catch {
          gain = undefined;
          victoryContext.current?.close().catch(() => {});
          victoryContext.current = null;
        }
      }
      clip.addEventListener('timeupdate', () => {
        if (playback.current !== clip) return;
        const remaining = clip.duration - clip.currentTime;
        if (!Number.isFinite(remaining) || remaining > victoryFadeSeconds) return;
        const volume = Math.max(0, remaining / victoryFadeSeconds);
        if (gain) {
          const now = victoryContext.current?.currentTime;
          if (now === undefined) return;
          gain.cancelScheduledValues(now);
          gain.setValueAtTime(volume, now);
          gain.linearRampToValueAtTime(0, now + Math.max(0, remaining));
        } else {
          clip.volume = volume;
        }
      });
    }

    function stop(immediate = false) {
      const clip = playback.current;
      playback.current = null;
      releaseClip(clip, immediate);
      setPlaying(false);
    }

    function play(src, concept) {
      stop();
      setAudioMessage('');
      const clip = new Audio(src);
      playback.current = clip;
      if (src === victoryTrack) fadeAtEnd(clip);
      setPlaying(true);
      const failed = () => {
        if (playback.current !== clip) return;
        stop(true);
        setAudioMessage(concept ? 'The recording could not play. Try playing the clue again.' : 'The victory music could not play.');
      };
      clip.addEventListener('ended', () => { if (playback.current === clip) stop(); }, { once: true });
      clip.addEventListener('error', failed, { once: true });
      clip.play().then(() => {
        if (playback.current !== clip || !concept) return;
        setPlayed(previous => new Set([...previous, concept.id]));
      }).catch(failed);
    }

    function revisitClue(clueNumber) {
      if (audio) stop();
      setAudioMessage('');
      setNumber(clueNumber);
    }

    function drawNextClue() {
      if (!canDrawNext) return;
      revisitClue(drawnCount + 1);
      setDrawnCount(drawnCount + 1);
    }

    function announceWinner() {
      setWinner(true);
      setCheckingAnswers(false);
      play(victoryTrack);
    }

    function openCheckAnswers(event) {
      returnFocus.current = event.currentTarget;
      if (audio && !winner) stop();
      setCheckingAnswers(true);
    }

    const playbackControl = audio && current && !winner && h('button', {
      type: 'button', className: H.PlayButtonClass,
      onClick: () => playing ? stop() : play(current.audio, current),
    },
      h('span', { className: 'hub-playback-glyph ' + (playing ? 'is-stop' : 'is-play'), 'aria-hidden': true }),
      playing ? 'Stop' : 'Play');

    const actions = h('div', { className: 'bingo-host-actions', hidden: checkingAnswers },
      button('Check Answers', { disabled: called.length === 0, onClick: openCheckAnswers }),
      button('Quit', { onClick: onQuit }, 'black'));

    return h(React.Fragment, null,
      renderToolbar(actions),
      h('section', { className: 'bingo-host', 'aria-label': 'Host controls' },
        h('div', { className: 'bingo-host-stage', hidden: checkingAnswers },
          h(ClueDisplay, { total: deck.length, number, clue: current?.clue, category, winner, playbackControl },
            !winner && h('div', { className: 'bingo-actions bingo-clue-action' },
              number > 0 && button(icon('next', 'h-[27.8px] w-[27.8px] rotate-180'), {
                'aria-label': 'Previous clue', title: 'Previous clue', disabled: number === 1,
                onClick: () => revisitClue(number - 1),
              }, 'clue-arrow'),
              button(!number ? 'Start' : 'Next', { disabled: !canDrawNext, onClick: drawNextClue }, 'primary'),
              number > 0 && button(icon('next', 'h-[27.8px] w-[27.8px]'), {
                'aria-label': 'Next drawn clue', title: 'Next drawn clue', disabled: number >= drawnCount,
                onClick: () => revisitClue(number + 1),
              }, 'clue-arrow')),
            h('p', { className: 'bingo-host-status', role: 'status' },
              audioMessage || (!winner && called.length === deck.length ? 'All clues have been called.' : '')))),
        checkingAnswers && h(CheckAnswers, {
          called, close: () => setCheckingAnswers(false),
          canDeclareWinner: !winner && called.length >= B.cardSize,
          onDeclareWinner: announceWinner,
        })));
  }

  function PoolEditor() {
    const [savedPools, setSavedPools] = useState(readPools);
    const [drafts, setDrafts] = useState({});
    const [poolKey, setPoolKey] = useState(Object.hasOwn(B.levels, params.get('level')) ? params.get('level') : 'N3');
    const [search, setSearch] = useState('');
    const [selectedOnly, setSelectedOnly] = useState(false);
    const [message, setMessage] = useState('');
    const [level, mode = 'definitions'] = poolKey.split('-');
    const audio = mode !== 'definitions';
    const { clips, loadError, retryAudio } = useRecordings(audio);
    const eligible = useMemo(() => audio && !clips ? [] : B.candidates(level, clips?.[mode]), [audio, level, mode, clips]);
    const defaults = audio && !clips ? [] : B.pool(level, clips?.[mode]).map(concept => concept.id);
    const saved = B.selectPool(eligible, savedPools[poolKey]);
    const chosen = drafts[poolKey] ?? saved?.map(concept => concept.id) ?? defaults;
    const selected = new Set(chosen);
    const searchTerm = search.trim().toLocaleLowerCase('en-GB');
    const visible = eligible.filter(concept => (!selectedOnly || selected.has(concept.id))
      && concept.name.toLocaleLowerCase('en-GB').includes(searchTerm))
      .sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));
    const hasChanges = drafts[poolKey] !== undefined;
    const chosenPool = B.selectPool(eligible, chosen);
    const canSave = hasChanges && Boolean(chosenPool);
    const isDefault = defaults.length === chosen.length && defaults.every((id, index) => id === chosen[index]);
    const gameUrl = chosenPool && './conceptbingo.html?' + new URLSearchParams({
      level, clues: mode, bingoPool: B.encodePool(chosenPool),
    });

    function changeSelection(ids) {
      setDrafts(previous => ({ ...previous, [poolKey]: ids }));
      setMessage('');
    }

    function clearDraft() {
      setDrafts(previous => {
        const next = { ...previous };
        delete next[poolKey];
        return next;
      });
    }

    function save() {
      if (!canSave) return;
      const next = { ...readPools(), [poolKey]: chosen };
      if (isDefault) delete next[poolKey];
      try {
        localStorage.setItem(poolsKey, JSON.stringify(next));
        setSavedPools(next);
        clearDraft();
        setMessage('Saved in this browser.');
      } catch {
        setMessage('Could not save in this browser. Open Bingo to use this selection now.');
      }
    }

    return h('div', { className: H.shell.pageShellClass },
      h(H.AppHeader, { icon: appIcon, title: 'Concept Bingo Pool Editor', profileShowQr: false }),
      h('div', { className: H.shell.pageContentClass },
        h('main', { className: 'bingo-pool-editor ' + H.shell.mainShellClass },
          h('p', null, 'Choose 9 to 50 concepts per pool. Share the game’s QR code so pupils use the same pool.'),
          h('div', { className: 'bingo-editor-controls' },
            h('label', null, 'Pool', h('select', {
              value: poolKey,
              onChange: event => {
                setPoolKey(event.target.value);
                setSearch('');
                setSelectedOnly(false);
                setMessage('');
              },
            },
              Object.entries(B.levels).map(([code, { label }]) =>
                h('optgroup', { key: code, label },
                  h('option', { value: code }, label + ' Definitions'),
                  code !== 'N3' && h('option', { value: code + '-styles' }, label + ' Styles'),
                  code !== 'N3' && h('option', { value: code + '-instruments' }, label + ' Instruments'))))),
            h('label', null, 'Search concepts', h('input', {
              type: 'search', value: search, onChange: event => setSearch(event.target.value),
            })),
            h('label', { className: 'bingo-editor-filter' }, h('input', {
              type: 'checkbox', checked: selectedOnly, onChange: event => setSelectedOnly(event.target.checked),
            }), ' Show selected')),
          audio && !clips
            ? h('div', { role: 'status' }, loadError ? 'The audio catalogue couldn’t load. ' : 'Loading audio concepts…',
              loadError && button('Retry Audio', { onClick: retryAudio }))
            : h('div', { className: 'bingo-editor-list', role: 'group', 'aria-label': 'Concepts' },
              visible.length ? visible.map(concept => h('label', { key: concept.id, className: 'bingo-editor-concept' },
                h('input', {
                  type: 'checkbox', checked: selected.has(concept.id),
                  disabled: chosen.length >= B.maxCalls && !selected.has(concept.id),
                  onChange: event => changeSelection(event.target.checked
                    ? [...chosen, concept.id] : chosen.filter(id => id !== concept.id)),
                }),
                h('span', null, concept.name))) : h('p', null, 'No matching concepts.')),
          h('div', { className: 'bingo-editor-footer' },
            h('span', { 'aria-live': 'polite' }, chosen.length + ' / ' + B.maxCalls + ' selected'),
            h('span', { role: 'status' }, message || (hasChanges ? 'Unsaved changes' : '')),
            button('Clear Selection', { disabled: chosen.length === 0, onClick: () => changeSelection([]) }),
            button('Use Defaults', { disabled: isDefault, onClick: () => changeSelection(defaults) }),
            button('Discard Changes', { disabled: !hasChanges, onClick: () => { clearDraft(); setMessage(''); } }),
            button('Save Pool', { disabled: !canSave, onClick: save }, 'black'),
            gameUrl ? h('a', { className: 'bingo-button', href: gameUrl }, 'Open Bingo') : button('Open Bingo', { disabled: true })))));
  }

  function App() {
    const [collection] = useState(() => window.HubCollections.selected());
    const [level, setLevel] = useState(() => Object.hasOwn(B.levels, params.get('level')) ? params.get('level') : 'N3');
    const allowsAudio = Boolean(collection) || level !== 'N3';
    const [mode, setMode] = useState(() => {
      if (!allowsAudio) return 'definitions';
      const requested = params.get('clues');
      if (requested === 'audio') return 'styles';
      return Object.hasOwn(clueModes, requested) ? requested : 'definitions';
    });
    const [role, setRole] = useState(params.get('role') === 'play' ? 'play' : '');
    const [menu, setMenu] = useState('');
    const [savedPools] = useState(readPools);
    const [sharedPoolIds, setSharedPoolIds] = useState(() => params.has('bingoPool') ? B.decodePool(params.get('bingoPool')) : null);
    const { label, category } = clueModes[mode];
    const audio = Boolean(category);
    const { clips, loadError, retryAudio } = useRecordings(allowsAudio && (audio || menu === 'customise'));
    const pools = useMemo(() => {
      return Object.fromEntries(Object.keys(clueModes).map(key => {
        if (key !== 'definitions' && !clips) return [key, null];
        const recordings = clips?.[key];
        const pinned = key === mode ? sharedPoolIds : null;
        if (!collection && !pinned) {
          return [key, B.pool(level, recordings, savedPools[key === 'definitions' ? level : level + '-' + key])];
        }
        const eligible = collection ? B.collectionPool(collection, recordings) : B.candidates(level, recordings);
        return [key, pinned ? B.selectPool(eligible, pinned) ?? [] : eligible];
      }));
    }, [collection, level, clips, savedPools, sharedPoolIds, mode]);
    const pool = pools[mode] ?? [];
    const canStart = pool.length >= B.cardSize;
    const active = Boolean(role && canStart);
    const hosting = active && role === 'host';
    const scope = collection?.name || B.levels[level].label;
    const shareUrl = new URL(location.pathname, location.href);
    shareUrl.search = new URLSearchParams({ level, clues: mode, role: 'play' });
    if (canStart) shareUrl.searchParams.set('bingoPool', B.encodePool(pool));
    for (const key of ['myCollection', 'builtInCollection', 'collectionCatalogueLevel']) {
      if (params.has(key)) shareUrl.searchParams.set(key, params.get(key));
    }

    useEffect(() => {
      function outside(event) {
        if (!event.target.closest?.('[data-menu-trigger], [data-menu-panel]')) setMenu('');
      }
      function escape(event) { if (event.key === 'Escape') setMenu(''); }
      document.addEventListener('click', outside);
      document.addEventListener('keydown', escape);
      return () => {
        document.removeEventListener('click', outside);
        document.removeEventListener('keydown', escape);
      };
    }, []);

    function toggleMenu(name) { setMenu(previous => previous === name ? '' : name); }
    function selectRole(nextRole) { setMenu(''); setRole(nextRole); }
    function updateGameSettings(nextLevel, nextMode) {
      setMenu('');
      if (nextLevel === level && nextMode === mode) return;
      const url = new URL(location.href);
      if (sharedPoolIds) {
        setSharedPoolIds(null);
        setRole('');
        url.searchParams.delete('bingoPool');
        url.searchParams.delete('role');
      }
      if (nextMode === 'definitions') url.searchParams.delete('clues');
      else url.searchParams.set('clues', nextMode);
      history.replaceState(history.state, '', url);
      setLevel(nextLevel);
      setMode(nextMode);
    }
    function quitGame() {
      selectRole('');
      const url = new URL(location.href);
      if (url.searchParams.has('role')) {
        url.searchParams.delete('role');
        history.replaceState(history.state, '', url);
      }
    }

    function renderToolbar(right) {
      const availableClueOptions = allowsAudio ? clueMenuOptions : { definitions: clueMenuOptions.definitions };
      const clueOptions = Object.fromEntries(Object.entries(availableClueOptions).map(([key, option]) => {
        const count = pools[key]?.length;
        const description = count === undefined
          ? loadError ? 'Count unavailable' : 'Loading concept count…'
          : count + (count === 1 ? ' concept' : ' concepts');
        return [key, { ...option, description }];
      }));
      return h(H.AppToolbar, {
        left: h(React.Fragment, null,
          h('div', { className: 'bingo-menu-anchor' },
            h(H.LevelButton, {
              icon: icon('levels', 'bingo-level-icon'), activeLevel: level, activeLabel: B.levels[level].label,
              dataMenuTrigger: true, disabled: active, expanded: menu === 'level', onClick: () => toggleMenu('level'),
            }),
            menu === 'level' && h(H.MenuPanel, { title: 'Level', dataMenuPanel: true, floating: true },
              h(H.LevelMenu, {
                levels: B.levels, activeLevel: level, updateUrl: !collection,
                onSelect: next => {
                  if (collection) {
                    location.href = window.HubCollections.standardLevelUrl(next);
                    return;
                  }
                  updateGameSettings(next, next === 'N3' ? 'definitions' : mode);
                },
              }))),
          h('div', { className: 'bingo-menu-anchor' },
            h(H.CustomiseButton, {
              icon: icon('customise', 'bingo-control-icon'), dataMenuTrigger: true, disabled: active,
              expanded: menu === 'customise', onClick: () => toggleMenu('customise'),
            }),
            menu === 'customise' && h(H.MenuPanel, {
              title: 'Customise', className: 'bingo-customise-panel', dataMenuPanel: true, floating: true,
            },
              h('div', { className: 'bingo-customise' },
                h('div', { role: 'group', 'aria-label': 'Game Type' },
                  h(H.MenuSubheading, null, 'Game Type'),
                  h(H.LevelMenu, {
                    levels: clueOptions, activeLevel: mode, updateUrl: false,
                    onSelect: next => updateGameSettings(level, next),
                  })),
                allowsAudio && h('p', { className: 'hub-level-scope-description' }, 'Host and participants need to choose the same clue type before the game starts.')),
              window.HubCollections.menu('bingo', null, level))),
          collection && !hosting && (active
            ? h('span', { className: 'hub-collection-toolbar-title' }, collection.name)
            : window.HubCollections.clearCollectionLink(collection.name, level))),
        feedback: hosting && collection && h('span', {
          className: 'hub-collection-toolbar-title bingo-host-collection', title: collection.name,
        }, collection.name),
        right,
      });
    }

    return h('div', { className: H.shell.pageShellClass },
      h(H.AppHeader, {
        icon: appIcon, title, subtitle, profileShareUrl: shareUrl.href, profileUsesSharedSettings: false,
        profileLabel: scope + ' · ' + label, profileShareDisabled: !canStart,
      }),
      h('div', { className: H.shell.pageContentClass },
        h('main', { className: 'bingo-main ' + H.shell.mainShellClass },
          !hosting && renderToolbar(active && button('Quit', { onClick: quitGame }, 'black')),
          !active && h('section', { className: 'bingo-setup', 'aria-label': 'Game setup' },
            !canStart && h('p', { className: 'bingo-setup-settings', role: 'status' },
              audio && !clips ? loadError ? 'The audio catalogue couldn’t load.' : 'Loading audio clues…'
                : sharedPoolIds ? 'This shared pool is unavailable. Ask the host for a new link.'
                : audio ? scope + ' has ' + pool.length + ' recorded ' + category + 's. Choose Definitions or a collection with at least nine.'
                : 'Choose a collection with at least nine distinct concepts.'),
            loadError && audio && !clips && button('Retry Audio', { onClick: retryAudio }),
            h('div', { className: 'bingo-role-grid' },
              h('button', { type: 'button', disabled: !canStart, onClick: () => selectRole('host') },
                icon('lobby-host', 'bingo-role-icon'), h('strong', null, 'Host')),
              h('button', { type: 'button', disabled: !canStart, onClick: () => selectRole('play') },
                h('span', { className: 'bingo-role-icon bingo-card-glyph', 'aria-hidden': true }),
                h('strong', null, 'Play')))),
          active && (hosting ? h(Host, { pool, mode, renderToolbar, onQuit: quitGame })
            : h(Player, { pool })))));
  }

  const editing = params.get('editor') === '1';
  if (editing) document.title = 'Concept Bingo Pool Editor';
  ReactDOM.createRoot(document.getElementById('root')).render(h(editing ? PoolEditor : App));
})();
