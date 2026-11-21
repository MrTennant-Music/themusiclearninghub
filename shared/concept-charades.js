(function () {
  'use strict';
  const e = React.createElement;
  const { useState, useRef, useEffect } = React;
  const C = window.MLHCharades, H = window.MLH, data = window.MLHGameConcepts;
  const levels = Object.fromEntries(data.codes.map((code, index) => [code, { label: data.levels[index] }]));
  const icon = (name, className = '') => e('img', { src: './ui-icons/' + name + '.svg', alt: '', 'aria-hidden': true, className });
  const appIcon = './app-icons/concept-charades-icon.svg?v=speech-bubble-questions';

  function App() {
    const sharedCollection = window.HubCollections.selected();
    const requestedLevel = new URLSearchParams(location.search).get('level');
    const initial = H.profileInitial('options', { level: 'N3', seconds: C.roundSeconds });
    const [options, setOptions] = useState(() => ({
      level: [requestedLevel, initial.level].find(level => C.codes.includes(level)) || 'N3',
      selectedLevelOnly: initial.selectedLevelOnly === true,
      seconds: C.durations.includes(initial.seconds) ? initial.seconds : C.roundSeconds,
    }));
    const [phase, setPhase] = useState('ready');
    const [round, setRound] = useState(null);
    const [countdown, setCountdown] = useState(3);
    const [remaining, setRemaining] = useState(options.seconds);
    const [revealed, setRevealed] = useState(0);
    const [answerFeedback, setAnswerFeedback] = useState(null);
    const [menu, setMenu] = useState(null);
    const [muted, setMuted] = useState(() => { try { return localStorage.getItem('mlh-charades-muted') === 'true'; } catch { return false; } });
    const [fullscreen, setFullscreen] = useState(false);
    const [message, setMessage] = useState('');
    const roundRef = useRef(null), phaseRef = useRef('ready'), audioRef = useRef(null);
    const feedbackRef = useRef(null), feedbackTimer = useRef(null);
    const resultsListRef = useRef(null), followResultsRef = useRef(true);
    const mutedRef = useRef(muted), inputAt = useRef(0), mainRef = useRef(null), gameRef = useRef(null), startRef = useRef(null), resultRef = useRef(null);
    const literacy = window.MLHGameLiteracy;
    const deck = sharedCollection
      ? [...new Map([...data.concepts, ...literacy]
        .filter(concept => sharedCollection.concepts.includes(concept.id))
        .map(concept => [concept.name.toLocaleLowerCase().trim(), concept])).values()]
      : C.pool(data, literacy, { level: options.level, earlier: !options.selectedLevelOnly });
    const locked = phase === 'countdown' || phase === 'playing';

    function changePhase(next) { phaseRef.current = next; setPhase(next); }
    function audioContext() {
      try {
        if (!audioRef.current || audioRef.current.state === 'closed') {
          const Audio = window.AudioContext || window.webkitAudioContext;
          if (!Audio) return null;
          audioRef.current = new Audio();
          H.audioOutput(audioRef.current);
        }
        audioRef.current.resume().catch(() => {});
        return audioRef.current;
      } catch { return null; }
    }
    function sound(kind) {
      if (mutedRef.current) return;
      const ctx = audioContext();
      if (!ctx) return;
      const notes = { correct: [523, 659, 784], skip: [330, 262], end: [784, 659, 523, 392], reveal: [880], revealOrange: [392, 330], count: [660], countFinal: [880] }[kind];
      const isCountdown = kind === 'count' || kind === 'countFinal';
      const duration = isCountdown ? .22 : .15;
      notes.forEach((frequency, i) => {
        const at = ctx.currentTime + .015 + i * .085;
        const oscillator = ctx.createOscillator(), gain = ctx.createGain();
        oscillator.type = isCountdown ? 'triangle' : 'sine';
        oscillator.frequency.setValueAtTime(frequency, at);
        gain.gain.setValueAtTime(.0001, at);
        gain.gain.exponentialRampToValueAtTime(isCountdown ? .13 : kind.startsWith('reveal') ? .035 : .075, at + .012);
        gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
        oscillator.connect(gain); gain.connect(H.audioOutput(ctx));
        oscillator.start(at); oscillator.stop(at + duration + .02);
      });
    }
    function silence() {
      if (audioRef.current) { H.closeAudioContext(audioRef.current).catch(() => {}); audioRef.current = null; }
    }
    function updateOptions(patch) {
      if (locked) return;
      setOptions(previous => ({ ...previous, ...patch }));
      changePhase('ready');
      setMessage('');
    }
    function endRound(next) {
      if (phaseRef.current !== 'playing') return;
      clearTimeout(feedbackTimer.current); feedbackRef.current = null; setAnswerFeedback(null);
      roundRef.current = next; setRound(next);
      setRemaining(0); setRevealed(0); followResultsRef.current = true; changePhase('results'); sound('end');
    }
    function respond(outcome) {
      if (phaseRef.current !== 'playing' || feedbackRef.current) return;
      const now = performance.now();
      if (now - inputAt.current < 250) return;
      inputAt.current = now;
      const current = roundRef.current;
      if (now >= current.deadline) { endRound(C.finish(current)); return; }
      const next = C.answer(current, outcome, now);
      const feedback = { name: current.deck[current.index].name, index: current.index, outcome };
      feedbackRef.current = feedback; setAnswerFeedback(feedback);
      roundRef.current = next; setRound(next); sound(outcome);
      feedbackTimer.current = setTimeout(() => {
        feedbackRef.current = null; setAnswerFeedback(null);
        if (phaseRef.current !== 'playing') return;
        if (next.ended || performance.now() >= next.deadline) endRound({ ...next, ended: true });
      }, 360);
    }
    function start() {
      if (phaseRef.current === 'countdown' || phaseRef.current === 'playing' || !deck.length) return;
      silence(); audioContext(); setMenu(null); setMessage('');
      setCountdown(3); setRemaining(options.seconds); setRound(null); setRevealed(0);
      changePhase('countdown'); sound('count');
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    function mainMenu() {
      silence(); clearTimeout(feedbackTimer.current);
      feedbackRef.current = null; setAnswerFeedback(null);
      roundRef.current = null; setRound(null);
      setRemaining(options.seconds); setRevealed(0); setMenu(null); setMessage('');
      setOptions(previous => ({ ...previous, collection: '' }));
      changePhase('ready');
    }
    function stop() {
      if (phaseRef.current === 'playing') endRound(feedbackRef.current ? { ...roundRef.current, ended: true } : C.finish(roundRef.current, 'ended'));
      else { silence(); changePhase('ready'); }
    }
    function toggleSound() {
      const next = !muted; mutedRef.current = next; setMuted(next);
      try { localStorage.setItem('mlh-charades-muted', String(next)); } catch { /* Storage is optional. */ }
      if (next) silence(); else audioContext();
    }
    async function toggleFullscreen() {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (gameRef.current?.requestFullscreen) { setMenu(null); await gameRef.current.requestFullscreen(); }
        else setMessage('Full screen is unavailable in this browser. The edge controls are ready to use here.');
      } catch { setMessage('Full screen could not open. You can still play here.'); }
    }

    useEffect(() => {
      if (phase !== 'countdown') return undefined;
      const deadline = performance.now() + 3000;
      let previous = 3;
      const timer = setInterval(() => {
        const left = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
        if (!left) {
          clearInterval(timer);
          const ordered = sharedCollection || options.selectedLevelOnly ? C.shuffle(deck) : C.standardDeck(data, literacy, options.level);
          const next = C.createRound(ordered, performance.now(), options.seconds);
          roundRef.current = next; setRound(next); inputAt.current = performance.now();
          changePhase('playing');
        } else if (left !== previous) { previous = left; setCountdown(left); sound(left === 1 ? 'countFinal' : 'count'); }
      }, 40);
      return () => clearInterval(timer);
    }, [phase]);

    useEffect(() => {
      if (phase !== 'playing') return undefined;
      let previous = options.seconds;
      const tick = () => {
        if (phaseRef.current !== 'playing') return;
        const left = Math.max(0, Math.ceil((roundRef.current.deadline - performance.now()) / 1000));
        if (left !== previous && left >= 1 && left <= 3) sound(left === 1 ? 'countFinal' : 'count');
        previous = left;
        setRemaining(left);
        if (!left) endRound(feedbackRef.current ? { ...roundRef.current, ended: true } : C.finish(roundRef.current));
      };
      const timer = setInterval(tick, 40);
      document.addEventListener('visibilitychange', tick);
      return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
    }, [phase]);

    useEffect(() => {
      if (phase !== 'results' || revealed >= round.history.length) return undefined;
      const timer = setTimeout(() => { setRevealed(n => n + 1); sound(round.history[revealed].outcome === 'correct' ? 'reveal' : 'revealOrange'); }, 550);
      return () => clearTimeout(timer);
    }, [phase, revealed, round]);

    useEffect(() => {
      const list = resultsListRef.current;
      if (phase === 'results' && list && followResultsRef.current) list.scrollTop = list.scrollHeight;
    }, [phase, revealed]);

    useEffect(() => {
      if (phase === 'results') resultRef.current?.focus();
      if (phase === 'ready') startRef.current?.focus();
    }, [phase]);

    useEffect(() => {
      function keydown(event) {
        if (event.repeat || event.target.closest('input,select,textarea,[data-menu-panel]')) return;
        if (phaseRef.current === 'playing' && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
          event.preventDefault(); respond(event.key === 'ArrowRight' ? 'correct' : 'skip');
        }
        if (event.key === 'Escape') setMenu(null);
      }
      function outside(event) { if (!event.target.closest('.charades-anchor,[data-menu-panel]')) setMenu(null); }
      function fullscreenChange() { setFullscreen(document.fullscreenElement === gameRef.current); }
      function leaving() { silence(); }
      document.addEventListener('keydown', keydown);
      document.addEventListener('pointerdown', outside);
      document.addEventListener('fullscreenchange', fullscreenChange);
      window.addEventListener('pagehide', leaving);
      return () => {
        document.removeEventListener('keydown', keydown); document.removeEventListener('pointerdown', outside);
        document.removeEventListener('fullscreenchange', fullscreenChange); window.removeEventListener('pagehide', leaving); clearTimeout(feedbackTimer.current); silence();
      };
    }, []);

    const revealedScore = round ? round.history.slice(0, revealed).filter(item => item.outcome === 'correct').length : 0;
    const showPreview = phase === 'ready';
    const collectionTitle = sharedCollection
      ? window.HubCollections.clearCollectionLink(sharedCollection.name, options.level)
      : null;
    const skipGlyph = e('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
      e('path', { d: 'M6 12h12m-6-6 6 6-6 6' }));
    const mediaControls = e('div', { className: 'charades-tools' },
      e('button', { type: 'button', className: 'charades-icon-control charades-audio-control', onClick: toggleSound, 'aria-label': muted ? 'Turn on game audio' : 'Turn off game audio', 'aria-pressed': !muted, title: muted ? 'Turn on game audio' : 'Turn off game audio' }, icon('audio-svgrepo-com')),
            e('button', { type: 'button', className: 'charades-icon-control', onClick: toggleFullscreen, 'aria-label': fullscreen ? 'Exit Full Screen' : 'Full Screen', 'aria-pressed': fullscreen, title: 'Toggle full screen' }, e('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, 'aria-hidden': true }, e('path', { d: fullscreen ? 'M9 3v6H3m18 0h-6V3M3 15h6v6m6 0v-6h6' : 'M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6' }))));
    const centre = phase === 'playing'
      ? e(React.Fragment, null,
          e('div', { key: answerFeedback ? answerFeedback.index : round.index, className: 'charades-concept' + (answerFeedback ? ' is-' + answerFeedback.outcome : ''), 'aria-live': 'polite', 'aria-atomic': true }, answerFeedback ? answerFeedback.name : round.deck[round.index].name),
          e('div', { className: 'charades-time' + (remaining <= 10 ? ' is-urgent' : ''), role: 'timer', 'aria-label': remaining + ' seconds remaining' }, remaining))
      : phase === 'countdown'
        ? e('div', { key: countdown, className: 'charades-concept charades-countdown', role: 'status' }, { 3: 'Ready', 2: 'Set', 1: 'Go!' }[countdown])
        : e('button', { type: 'button', className: 'charades-primary', ref: startRef, onClick: start, disabled: !deck.length }, 'Start');

    return e('div', { className: 'charades-page ' + H.shell.pageShellClass },
      e(H.AppHeader, { icon: appIcon, title: 'Concept Charades', subtitle: 'In pairs or teams, guess as many concepts as you can before the time runs out.', profileState: { options }, profileUsesSharedSettings: false, profileShareDisabled: locked }),
      e('div', { className: 'charades-content ' + H.shell.pageContentClass },
      e('main', { className: 'charades-main ' + H.shell.mainShellClass + (locked ? ' is-active' : ''), ref: mainRef },
        e('div', { className: 'charades-toolbar' }, e(H.AppToolbar, {
          className: sharedCollection ? 'charades-toolbar-with-collection' : '',
          left: e('div', { className: 'charades-tools' },
            e('div', { className: 'charades-anchor' },
              e(H.LevelButton, { icon: icon('levels', 'h-[26px] w-[28px] object-contain scale-[1.06]'), activeLevel: options.level, activeLabel: levels[options.level].label, disabled: locked, dataMenuTrigger: true, expanded: menu === 'level', onClick: () => setMenu(menu === 'level' ? null : 'level') }),
              menu === 'level' && e(H.MenuPanel, { title: 'Level', dataMenuPanel: true }, e(H.LevelMenu, { activeLevel: options.level, levels, updateUrl: !sharedCollection, onSelect: level => {
                if (sharedCollection) location.href = window.HubCollections.standardLevelUrl(level);
                else { updateOptions({ level }); setMenu(null); }
              } }))),
            e('div', { className: 'charades-anchor' },
              e(H.CustomiseButton, { icon: icon('customise', 'h-[21px] w-[21px]'), onClick: () => setMenu(menu === 'customise' ? null : 'customise'), disabled: locked, dataMenuTrigger: true, expanded: menu === 'customise' }),
              menu === 'customise' && e(H.MenuPanel, { title: 'Customise', variant: 'customise', dataMenuPanel: true },
                e('div', { className: 'charades-menu-content' },
                  e('div', { className: 'hub-toggle-row charades-timer-row' },
                    e('label', { className: 'hub-toggle-label', htmlFor: 'charades-timer' }, icon('timer'), 'Timer'),
                    e('select', { id: 'charades-timer', value: options.seconds, onChange: event => updateOptions({ seconds: Number(event.target.value) }) }, C.durations.map(seconds => e('option', { key: seconds, value: seconds }, seconds + ' seconds')))),
                  !sharedCollection && e(H.SelectedLevelOnlyToggle, { level: options.level, checked: options.selectedLevelOnly, onChange: () => updateOptions({ selectedLevelOnly: !options.selectedLevelOnly }) }),
                  window.HubCollections.menu('charades', null, options.level)))),
            sharedCollection && collectionTitle),
          right: e('div', { className: 'charades-tools' },
            phase === 'playing' && e('button', { type: 'button', className: 'charades-end', onClick: stop }, 'End'),
            !fullscreen && mediaControls),
        })),
        message && e('p', { className: 'charades-message', role: 'status' }, message),
        e('div', { className: 'charades-game-container' + (phase === 'results' ? ' is-results' : phase === 'ready' ? ' is-ready' : ''), ref: gameRef },
          fullscreen && e('div', { className: 'charades-fullscreen-bar' + (sharedCollection ? ' has-collection-title' : '') },
            sharedCollection && e('h2', { className: 'hub-collection-toolbar-title' }, collectionTitle),
            e('div', { className: 'charades-tools' }, phase === 'playing' && e('button', { type: 'button', className: 'charades-end', onClick: stop }, 'End'), mediaControls)),
        phase === 'results' ? e('section', { className: 'charades-results', 'aria-labelledby': 'charades-results-title' },
          e('h2', { id: 'charades-results-title', ref: resultRef, tabIndex: -1 }, 'Results'),
          e('div', { className: 'charades-total', 'aria-live': 'polite', 'aria-atomic': true, 'aria-label': revealedScore + ' correct' }, revealedScore),
          e('ol', { ref: resultsListRef, 'data-scroll-fade-panel': true, tabIndex: 0, 'aria-label': 'Concepts from your round', 'aria-live': 'off', onScroll: event => { const list = event.currentTarget; followResultsRef.current = list.scrollHeight - list.scrollTop - list.clientHeight < 24; } }, round.history.slice(0, revealed).map(item =>
            e('li', { key: item.id, className: 'charades-result' + (item.outcome === 'correct' ? ' is-correct' : ' is-skip') }, e('strong', null, item.name), e('span', { className: 'sr-only' }, { correct: 'Correct', skip: 'Skipped', time: 'Time ran out', ended: 'Round ended' }[item.outcome])))),
          e('button', { type: 'button', className: 'charades-primary', onClick: mainMenu }, 'Main Menu'))
          : e('section', { className: 'charades-stage' + (locked ? ' is-playing' : ' is-ready') + (showPreview ? ' has-preview' : ''), 'aria-label': 'Concept Charades round' },
            (showPreview || locked) && e('button', { type: 'button', className: 'charades-edge charades-skip', disabled: phase !== 'playing' || Boolean(answerFeedback), onClick: () => respond('skip'), 'aria-label': 'Skip concept', 'aria-hidden': showPreview || undefined }, skipGlyph, e('span', null, 'Skip')),
            e('div', { className: 'charades-centre' }, centre),
            (showPreview || locked) && e('button', { type: 'button', className: 'charades-edge charades-correct', disabled: phase !== 'playing' || Boolean(answerFeedback), onClick: () => respond('correct'), 'aria-label': 'Correct concept', 'aria-hidden': showPreview || undefined }, icon('prtick'), e('span', null, 'Correct')))))));
  }
  ReactDOM.createRoot(document.getElementById('root')).render(e(App));
})();
