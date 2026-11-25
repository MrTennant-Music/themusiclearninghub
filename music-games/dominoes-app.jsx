(() => {
  const { useEffect, useLayoutEffect, useRef, useState } = React;
  const hub = window.MLH;
  const dominoes = window.MLHDominoes;
  const collections = window.HubCollections;
  const catalogue = window.MLHGameCollections;
  const levels = Object.fromEntries(catalogue.data.codes.map((code, index) => [code, { label: catalogue.data.levels[index] }]));
  const subtitle = 'Match musical definitions to build a domino chain.';
  const icon = './app-icons/dominoes-icon.svg';
  const source = new URL(location.href);
  const classroomGame = Boolean(hub.classroomExercise);
  const retryRace = hub.classroomActivities.isRetryRace();
  const classroomAudioTopic = classroomGame ? source.searchParams.get('dominoAudio') : null;
  source.searchParams.delete('dominoSet');
  const selectedLevel = Object.hasOwn(levels, source.searchParams.get('level')) ? source.searchParams.get('level') : 'N5';
  const offersInstruments = ['N3', 'N4', 'N5'].includes(selectedLevel);
  const selectedCollection = collections.selected();
  const collection = selectedCollection && !catalogue.sharedAvailability(selectedCollection, 'dominoes') ? selectedCollection : null;
  const minCards = catalogue.dominoMinCards;
  const textConcepts = catalogue.dominoConcepts(selectedLevel, collection);
  const textMaxCards = dominoes.cardLimit(selectedLevel, collection);
  const requestedCards = Number(source.searchParams.get('cards'));
  const initialCards = Number.isInteger(requestedCards) && requestedCards >= minCards && requestedCards <= textMaxCards ? requestedCards : textMaxCards;
  const lastSetKey = 'mlh:dominoes:last-set';
  const formatTime = milliseconds => window.IGTimer.format(milliseconds, false);

  function HeaderStats({ startedAt, finishedTime, score, total, medal, onReset }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
      if (startedAt === null || finishedTime !== null) return;
      const update = () => setElapsed(performance.now() - startedAt);
      update();
      const interval = setInterval(update, 200);
      return () => clearInterval(interval);
    }, [startedAt, finishedTime]);

    const time = finishedTime ?? (startedAt === null ? 0 : elapsed);
    const thresholds = Object.entries(dominoes.medalTimesFor(total))
      .map(([tier, milliseconds]) => ({ tier, label: formatTime(milliseconds) }));
    return <div className="ig-header-game-stats">
      <hub.ResetStat label="Matches" ariaLabel={`Matches: ${score} out of ${total}`} fillPercent={100 * score / total} onReset={onReset}>
        <span className="ig-header-stat-value">{score}/{total}</span>
      </hub.ResetStat>
      <hub.TimedMedalStat thresholds={thresholds} medal={medal} celebrationKey={medal ? 1 : 0}>
        <span className="ig-clock" role="timer" aria-label="Elapsed time">{formatTime(time)}</span>
      </hub.TimedMedalStat>
    </div>;
  }

  function DominoCard({ card, hasAudio, incomingMatch, outgoingMatch }) {
    const term = useRef(null);
    useLayoutEffect(() => {
      const label = term.current;
      const size = parseFloat(getComputedStyle(label.parentElement).fontSize);
      let lastWidth;
      function fit() {
        const width = label.getBoundingClientRect().width;
        if (!width || width === lastWidth) return;
        lastWidth = width;
        label.style.fontSize = '';
        const widestWord = Math.max(...Array.from(label.children, word => word.getBoundingClientRect().width));
        if (widestWord > width) label.style.fontSize = `${Math.floor(size * width / widestWord * 10) / 10}px`;
      }
      fit();
      const observer = new ResizeObserver(fit);
      observer.observe(label);
      function onFontsLoaded() {
        lastWidth = undefined;
        fit();
      }
      document.fonts?.addEventListener('loadingdone', onFontsLoaded);
      return () => {
        observer.disconnect();
        document.fonts?.removeEventListener('loadingdone', onFontsLoaded);
      };
    }, [card.term]);

    return <span className="domino-card">
      <strong data-match={incomingMatch}><span ref={term} className="domino-term-label">{card.term.split(/\s+/).map((word, index) =>
        <React.Fragment key={index}>{index > 0 ? ' ' : ''}<span className="domino-term-word">{word}</span></React.Fragment>
      )}</span></strong>
      <span data-match={outgoingMatch}>{hasAudio ? null : card.clue}</span>
    </span>;
  }

  // Match Concept Sort's fixed, scale-aware copy of the picked-up card.
  const cardMotionEasing = 'cubic-bezier(.2,.75,.25,1)';
  const dragThreshold = 5;
  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  function createDragPreview(node, rect) {
    const preview = node.cloneNode(true);
    const originals = [node, ...node.querySelectorAll('*')];
    const copies = [preview, ...preview.querySelectorAll('*')];
    originals.forEach((original, index) => {
      const style = getComputedStyle(original);
      const copy = copies[index];
      for (const property of style) copy.style.setProperty(property, style.getPropertyValue(property));
      copy.removeAttribute('id');
      copy.style.setProperty('animation', 'none', 'important');
      copy.style.setProperty('transition', 'none', 'important');
      copy.style.setProperty('pointer-events', 'none', 'important');
    });
    preview.setAttribute('aria-hidden', 'true');
    preview.setAttribute('inert', '');
    Object.assign(preview.style, {
      position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`,
      width: `${node.offsetWidth}px`, height: `${node.offsetHeight}px`,
      minWidth: '0', maxWidth: 'none', minHeight: '0', maxHeight: 'none',
      margin: '0', zIndex: '2147483646', pointerEvents: 'none',
      transformOrigin: '0 0', opacity: '1', visibility: 'visible',
    });
    preview.style.setProperty('transform', `scale(${rect.width / (node.offsetWidth || rect.width)}, ${rect.height / (node.offsetHeight || rect.height)})`, 'important');
    (document.fullscreenElement || document.documentElement).appendChild(preview);
    return preview;
  }

  function Chain({ cards, picked, onPick, onSwap, results, revealedCount = 0, recordings, playingClue, onPlayClue }) {
    const board = useRef(null);
    const gesture = useRef(null);
    const preview = useRef(null);
    const returning = useRef(null);
    const previousPositions = useRef(null);
    const suppressClick = useRef(false);
    const [drag, setDrag] = useState(null);

    function removePreview() {
      returning.current?.cancel();
      returning.current = null;
      preview.current?.remove();
      preview.current = null;
    }

    useLayoutEffect(() => () => {
      gesture.current?.listeners.abort();
      gesture.current = null;
      removePreview();
    }, []);

    function cardNode(index) {
      return board.current?.querySelector(`[data-domino-index="${index}"]`);
    }

    useLayoutEffect(() => {
      const moves = previousPositions.current;
      previousPositions.current = null;
      gesture.current?.listeners.abort();
      gesture.current = null;
      removePreview();
      setDrag(null);
      if (!moves || reducedMotion()) return;
      for (const { index, before } of moves) {
        const node = cardNode(index);
        if (!node?.animate || !before) continue;
        const after = node.getBoundingClientRect();
        const x = (before.left - after.left) / (after.width / node.offsetWidth || 1);
        const y = (before.top - after.top) / (after.height / node.offsetHeight || 1);
        if (Math.abs(x) < 1 && Math.abs(y) < 1) continue;
        node.animate([{ translate: `${x}px ${y}px` }, { translate: '0px 0px' }], { duration: 380, easing: cardMotionEasing });
      }
    }, [cards]);

    function animateSwap(first, second) {
      previousPositions.current = [
        { index: second, before: cardNode(first)?.getBoundingClientRect() },
        { index: first, before: cardNode(second)?.getBoundingClientRect() },
      ];
      onSwap(first, second);
    }

    function beginDrag(event, index) {
      if (results || gesture.current || !event.isPrimary || event.button !== 0) return;
      removePreview();
      setDrag(null);
      suppressClick.current = false;
      const node = cardNode(index);
      const listeners = new AbortController();
      gesture.current = { node, rect: node.getBoundingClientRect(), index, pointerId: event.pointerId, x: event.clientX, y: event.clientY, listeners };
      const options = { capture: true, signal: listeners.signal };
      window.addEventListener('pointermove', moveDrag, options);
      window.addEventListener('pointerup', endDrag, options);
      window.addEventListener('pointercancel', endDrag, options);
      // Cancel when the window loses focus, rather than when another card does.
      window.addEventListener('blur', endDrag, { signal: listeners.signal });
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }

    function dropTarget(pending, dx, dy) {
      const dragged = pending.rect;
      const slots = board.current.children;
      let target = null;
      let largestOverlap = -1;
      // Use the slots' layout bounds so swap animations cannot move a drop target.
      for (let index = 1; index < slots.length - 1; index++) {
        if (index === pending.index) continue;
        const slot = slots[index];
        const { left, right, top, bottom } = slot.getBoundingClientRect();
        const frame = slot.querySelector('.domino-card-frame');
        const cardTop = top + frame.offsetTop * (bottom - top) / slot.offsetHeight;
        const width = Math.min(dragged.right + dx, right) - Math.max(dragged.left + dx, left);
        const height = Math.min(dragged.bottom + dy, bottom) - Math.max(dragged.top + dy, cardTop);
        if (width >= 0 && height >= 0 && width * height > largestOverlap) {
          target = index;
          largestOverlap = width * height;
        }
      }
      return target;
    }

    function moveDrag(event) {
      const pending = gesture.current;
      if (!pending || event.pointerId !== pending.pointerId) return;
      const dx = event.clientX - pending.x;
      const dy = event.clientY - pending.y;
      if (!preview.current && Math.hypot(dx, dy) < dragThreshold) return;
      const target = dropTarget(pending, dx, dy);
      if (!preview.current) preview.current = createDragPreview(pending.node, pending.rect);
      Object.assign(preview.current.style, { left: `${pending.rect.left + dx}px`, top: `${pending.rect.top + dy}px` });
      setDrag(previous => previous?.target === target && previous.index === pending.index ? previous : { index: pending.index, target });
    }

    function endDrag(event) {
      const pending = gesture.current;
      if (!pending || (event.type !== 'blur' && event.pointerId !== pending.pointerId)) return;
      pending.listeners.abort();
      gesture.current = null;
      const card = preview.current;
      const released = event.type === 'pointerup';
      const dx = released ? event.clientX - pending.x : 0;
      const dy = released ? event.clientY - pending.y : 0;
      if (!card && (!released || Math.hypot(dx, dy) < dragThreshold)) return;
      suppressClick.current = true;
      const target = released ? dropTarget(pending, dx, dy) : null;
      if (target !== null) {
        removePreview();
        setDrag(null);
        animateSwap(pending.index, target);
        return;
      }
      if (!card) return;
      setDrag({ index: pending.index, target: null });
      if (card.animate && !reducedMotion()) {
        const origin = pending.node.getBoundingClientRect();
        returning.current = card.animate([
          { left: card.style.left, top: card.style.top },
          { left: `${origin.left}px`, top: `${origin.top}px` },
        ], { duration: 300, easing: cardMotionEasing });
        returning.current.finished.catch(() => {}).finally(() => {
          if (preview.current !== card) return;
          removePreview();
          setDrag(null);
        });
      } else {
        removePreview();
        setDrag(null);
      }
    }

    function matchFeedback(index) {
      if (results && index < revealedCount) return results[index] ? 'correct' : 'incorrect';
    }

    function renderLink(index, startsRow = false) {
      const feedback = matchFeedback(index);
      const source = index === 0 ? 'Start' : `card ${index}`;
      const destination = index + 1 === cards.length - 1 ? 'the fixed End card' : `card ${index + 1}`;
      return <span className={`domino-arrow${startsRow ? ' domino-arrow-row-start' : ''}`} data-match={feedback}>
        <span aria-hidden="true">→</span>
        {feedback && <>
          <span className="domino-feedback-marker" aria-hidden="true"/>
          <span className="sr-only">{feedback === 'correct' ? 'Correct' : 'Incorrect'} match from {source} to {destination}</span>
        </>}
      </span>;
    }

    return <ol ref={board} className="domino-chain" aria-label={onPick ? 'Your domino chain' : 'Correct domino chain'}>
      {cards.map((card, index) => {
        const clip = recordings?.get(card.next);
        const playing = clip && playingClue === card.next;
        const fixed = index === 0 || index === cards.length - 1;
        const startsRow = index > 0 && index % 4 === 0;
        const continuesInRow = index < cards.length - 1 && (index + 1) % 4 !== 0;
        return <li key={index} className="domino-slot">
          {startsRow && renderLink(index - 1, true)}
          {fixed ? <span className="domino-position domino-position-fixed">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="4" y="10" width="16" height="11" rx="2"/>
              <path d="M8 10V7a4 4 0 0 1 8 0v3"/>
            </svg>
            Fixed
          </span> : <span className="domino-position" aria-hidden="true">{index}</span>}
          {drag?.index === index && <span className="domino-pickup-placeholder" aria-hidden="true"/>}
          <div className="domino-card-frame" data-domino-index={onPick && !fixed && !results ? index : undefined}
            data-dragging={drag?.index === index || undefined}>
            {onPick && !fixed ? <button type="button" className="domino-slot-button"
              disabled={Boolean(results)} aria-pressed={picked === index}
              data-drop-target={drag?.target === index && drag.index !== index || undefined}
              aria-label={`Card ${index}. ${card.term}. ${clip ? 'Audio clue' : card.clue}`}
              onPointerDown={event => beginDrag(event, index)}
              onClick={event => {
                if (suppressClick.current && event.detail !== 0) return;
                if (picked !== null && picked !== index) animateSwap(picked, index);
                else onPick(index);
              }}>
              <DominoCard card={card} hasAudio={Boolean(clip)} incomingMatch={matchFeedback(index - 1)} outgoingMatch={matchFeedback(index)}/>
            </button> : <DominoCard card={card} hasAudio={Boolean(clip)}
              incomingMatch={index === cards.length - 1 ? matchFeedback(index - 1) : undefined}
              outgoingMatch={index === 0 ? matchFeedback(0) : undefined}/>}
            {clip && <button type="button" className="domino-audio-button"
              aria-label={`${playing ? 'Stop' : 'Play'} audio clue for ${fixed ? 'Start' : `card ${index}`}`}
              onClick={() => onPlayClue(card.next, clip)}>
              <img src={`./ui-icons/${playing ? 'stop' : 'play'}.svg`} alt="" width="18" height="18"/>
            </button>}
          </div>
          {continuesInRow && renderLink(index)}
        </li>;
      })}
    </ol>;
  }

  function App() {
    const drawSet = (count, previousIds) => dominoes.newSet(selectedLevel, collection, Math.random, count, previousIds);
    const [concepts, setConcepts] = useState(() => {
      if (classroomGame) return dominoes.hostedSet(location.href, hub.classroomActivities.random(hub.classroomActivities.seed(location.search)));
      let previousIds;
      try { previousIds = sessionStorage.getItem(lastSetKey)?.split('.'); } catch {}
      return drawSet(initialCards, previousIds);
    });
    const [round, setRound] = useState(() => dominoes.deal(concepts, classroomGame ? hub.classroomActivities.random(hub.classroomActivities.seed(location.search)) : Math.random));
    const [placed, setPlaced] = useState(round.cards);
    const [picked, setPicked] = useState(null);
    const [results, setResults] = useState(null);
    const [revealedCount, setRevealedCount] = useState(0);
    const [feedbackComplete, setFeedbackComplete] = useState(false);
    const [startedAt, setStartedAt] = useState(() => retryRace ? performance.now() : null);
    const [finishedTime, setFinishedTime] = useState(null);
    const [earnedMedal, setEarnedMedal] = useState(null);
    const [showSolution, setShowSolution] = useState(false);
    const [menu, setMenu] = useState(null);
    const [audioClues, setAudioClues] = useState(classroomAudioTopic === 'Styles' || classroomAudioTopic === 'Instruments');
    const [audioTopic, setAudioTopic] = useState(classroomAudioTopic === 'Instruments' ? 'Instruments' : 'Styles');
    const [writtenConcepts, setWrittenConcepts] = useState(null);
    const [recordingsByTopic, setRecordingsByTopic] = useState(null);
    const [audioLoadFailed, setAudioLoadFailed] = useState(false);
    const [audioPlaybackFailed, setAudioPlaybackFailed] = useState(false);
    const [playingClue, setPlayingClue] = useState(null);
    const currentClip = useRef(null);
    const recordings = recordingsByTopic?.[audioTopic];
    const audioConcepts = textConcepts.filter(concept => recordings?.has(concept.id));
    const canUseInstruments = (recordingsByTopic?.Instruments?.size ?? 0) >= 8;
    const availableConceptCount = audioClues ? audioConcepts.length : textConcepts.length;
    const maxAudioCards = Math.min(catalogue.dominoMaxCards, audioConcepts.length + 1);
    const maxCards = audioClues ? maxAudioCards : textMaxCards;
    const minimumCards = audioClues ? Math.min(minCards, maxAudioCards) : minCards;
    const canUseAudio = maxAudioCards >= 9;
    useEffect(() => {
      if (audioClues || classroomGame) return;
      try { sessionStorage.setItem(lastSetKey, concepts.map(concept => concept.id).join('.')); } catch {}
    }, [audioClues, concepts]);
    useEffect(() => {
      const onOutsideClick = event => {
        if (!event.target.closest?.('[data-menu-panel], [data-menu-trigger]')) setMenu(null);
      };
      const onEscape = event => {
        if (event.key === 'Escape') { setMenu(null); setPicked(null); }
      };
      document.addEventListener('click', onOutsideClick);
      document.addEventListener('keydown', onEscape);
      return () => {
        document.removeEventListener('click', onOutsideClick);
        document.removeEventListener('keydown', onEscape);
      };
    }, []);

    useEffect(() => {
      if (collection || (menu !== 'customise' && !classroomAudioTopic) || recordingsByTopic) return;
      const controller = new AbortController();
      setAudioLoadFailed(false);
      fetch('./music-dictionary/quiz-data/audio-library-selection.json', { signal: controller.signal })
        .then(response => {
          if (!response.ok) throw Error('Audio catalogue unavailable');
          return response.json();
        })
        .then(({ entries }) => {
          if (controller.signal.aborted) return;
          const styles = entries.filter(entry => entry.category === 'Styles');
          setRecordingsByTopic({
            Styles: dominoes.uniqueClueRecordings(textConcepts, styles),
            Instruments: offersInstruments ? dominoes.instrumentClueRecordings(textConcepts, entries) : null,
          });
        })
        .catch(() => { if (!controller.signal.aborted) setAudioLoadFailed(true); });
      return () => controller.abort();
    }, [menu, recordingsByTopic]);

    useEffect(() => {
      const pause = () => currentClip.current?.pause();
      window.addEventListener('pagehide', pause);
      return () => {
        window.removeEventListener('pagehide', pause);
        pause();
      };
    }, []);

    function stopClue() {
      const clip = currentClip.current;
      currentClip.current = null;
      clip?.pause();
      setPlayingClue(null);
    }

    function playClue(id, url) {
      stopClue();
      if (playingClue === id) return;
      setAudioPlaybackFailed(false);
      const clip = new window.Audio(url);
      currentClip.current = clip;
      setPlayingClue(id);
      const ended = () => { if (currentClip.current === clip) stopClue(); };
      const failed = () => {
        if (currentClip.current !== clip) return;
        stopClue();
        setAudioPlaybackFailed(true);
      };
      clip.onended = ended;
      clip.onerror = failed;
      clip.play().catch(failed);
    }

    function resetBoard(cards = round.cards) {
      stopClue();
      setAudioPlaybackFailed(false);
      setPlaced(cards);
      setPicked(null);
      setStartedAt(retryRace ? performance.now() : null);
      setResults(null);
      setRevealedCount(0);
      setFeedbackComplete(false);
      setFinishedTime(null);
      setEarnedMedal(null);
      setShowSolution(false);
    }

    function restart(nextConcepts = concepts) {
      const next = dominoes.deal(nextConcepts);
      setConcepts(nextConcepts);
      setRound(next);
      resetBoard(next.cards);
    }

    function pick(index) {
      setPicked(picked === index ? null : index);
    }

    function swap(first, second) {
      if (startedAt === null) setStartedAt(performance.now());
      setPlaced(slots => slots.map((slot, position) => {
        if (position === first) return slots[second];
        if (position === second) return slots[first];
        return slot;
      }));
      setPicked(null);
    }
    const medal = feedbackComplete ? earnedMedal : null;
    const award = medal ? hub.achievements.medals[medal] : null;
    const revealedScore = results?.slice(0, revealedCount).filter(Boolean).length ?? 0;
    useEffect(() => {
      if (!results) return;
      const clips = new Set();
      let timer;

      function reveal(index) {
        timer = window.setTimeout(() => {
          setRevealedCount(index + 1);
          if (!document.hidden && window.IGCore.readSoundPreference()) {
            const clip = new window.Audio(results[index] ? './music-games/audio/gamecorrect.mp3' : './music-games/audio/gamewrong.mp3?v=20261016-upload');
            clip.playbackRate = 1.5;
            clips.add(clip);
            const done = () => clips.delete(clip);
            clip.onended = clip.onerror = clip.onabort = clip.onpause = done;
            clip.play().catch(done);
          }
          if (index + 1 < results.length) reveal(index + 1);
          else timer = window.setTimeout(() => setFeedbackComplete(true), 500);
        }, 350);
      }

      reveal(0);
      return () => {
        window.clearTimeout(timer);
        clips.forEach(clip => hub.fadeOutAudio(clip, { reset: true }));
      };
    }, [results]);
    useEffect(() => {
      if (!medal || !window.IGCore.readSoundPreference()) return;
      const timer = window.setTimeout(() => {
        if (!document.hidden && window.IGCore.readSoundPreference()) {
          hub.playFeedbackSound(true, true, medal === 'diamond' ? 'platinum' : medal);
        }
      }, 900);
      function stop() {
        window.clearTimeout(timer);
        hub.stopFeedbackSound();
      }
      window.addEventListener('pagehide', stop);
      return () => {
        window.removeEventListener('pagehide', stop);
        stop();
      };
    }, [medal]);
    const cardCount = concepts.length + 1;
    const matchCount = concepts.length;
    const hostUrl = new URL(collections.shareUrl(source.href));
    hostUrl.searchParams.set('level', selectedLevel);
    hostUrl.searchParams.set('dominoSet', concepts.map(concept => concept.id).join('.'));
    if (audioClues) hostUrl.searchParams.set('dominoAudio', audioTopic);
    const glyph = name => <img src={`./ui-icons/${name}.svg`} alt="" width="22" height="22"/>;
    const toggleMenu = name => setMenu(current => current === name ? null : name);
    const clueControls = audioClues ? { recordings, playingClue, onPlayClue: playClue } : {};

    function toggleAudioClues() {
      if (audioClues) {
        setAudioClues(false);
        restart(writtenConcepts);
        setWrittenConcepts(null);
      } else if (canUseAudio) {
        setWrittenConcepts(concepts);
        setAudioClues(true);
        restart(pickAudioSet(Math.min(cardCount, maxAudioCards)));
      }
    }

    function pickAudioSet(count) {
      return dominoes.shuffle(audioConcepts).slice(0, count - 1);
    }

    function changeAudioTopic(topic) {
      const options = textConcepts.filter(concept => recordingsByTopic[topic].has(concept.id));
      const count = Math.min(Math.max(minCards, cardCount), options.length + 1);
      setAudioTopic(topic);
      restart(dominoes.shuffle(options).slice(0, count - 1));
    }

    function drawActiveSet(count) {
      return audioClues ? pickAudioSet(count) : drawSet(count);
    }

    function changeCardCount(count) {
      if (!audioClues) {
        source.searchParams.set('cards', count);
        history.replaceState(history.state, '', source.href);
      }
      restart(drawActiveSet(count));
    }

    function submit() {
      if (startedAt === null || results) return;
      stopClue();
      const time = performance.now() - startedAt;
      const matches = dominoes.grade(placed);
      const medal = dominoes.medalFor(matches, time);
      setFinishedTime(time);
      setResults(matches);
      setPicked(null);
      if (retryRace) {
        hub.classroomActivities.submitRetryRaceAttempt(matches.filter(Boolean).length, matches.length, time);
      } else if (classroomGame && window.parent !== window && matches.every(Boolean)) {
        window.parent.postMessage({ type: 'mlh:classroom-finished', solved: true }, location.origin);
      }
      if (medal && !retryRace) {
        const previous = hub.achievements.get('dominoes.html', selectedLevel)?.tier;
        hub.achievements.award('dominoes.html', selectedLevel, medal);
        const current = hub.achievements.get('dominoes.html', selectedLevel)?.tier;
        if (current !== previous) setEarnedMedal(current);
      }
    }

    function worksheetConfig() {
      const solution = dominoes.chain(writtenConcepts ?? concepts);
      return {
        version: 1, activityId: 'dominoes', sourceUrl: 'dominoes.html',
        settings: {
          level: selectedLevel, collectionTitle: collection?.name,
          sets: [{ solution, cards: dominoes.shuffle(solution) }],
        },
      };
    }

    return <div className={hub.shell.pageShellClass}>
      <hub.AppHeader title="Dominoes" icon={icon} subtitle={subtitle} worksheetConfig={worksheetConfig} profileUsesSharedSettings={false}
        profileShowLabel={false} classroomActivityUrl={hostUrl.href}>
        <HeaderStats {...{startedAt, finishedTime, medal, score:revealedScore, total:matchCount}} onReset={retryRace ? undefined : resetBoard}/>
      </hub.AppHeader>
      <div className={hub.shell.pageContentClass}>
        <main className={hub.shell.mainShellClass}>
          <div data-timed-race-toolbar={retryRace ? '' : undefined}>
            <hub.AppToolbar className="domino-toolbar" left={!retryRace && <>
              <div className="hub-menu-anchor relative">
                <hub.LevelButton activeLevel={selectedLevel} activeLabel={levels[selectedLevel].label} icon={glyph('levels')}
                  dataMenuTrigger expanded={menu === 'level'} ariaControls="domino-level-menu" onClick={() => toggleMenu('level')}/>
                {menu === 'level' && <hub.MenuPanel title="Level" id="domino-level-menu" position="left-0" dataMenuPanel>
                  <hub.LevelMenu activeLevel={selectedLevel} levels={levels} updateUrl={false}
                    onSelect={level => { location.href = collections.standardLevelUrl(level); }}/>
                </hub.MenuPanel>}
              </div>
              <div className="hub-menu-anchor relative">
                <hub.CustomiseButton icon={glyph('customise')} dataMenuTrigger expanded={menu === 'customise'}
                  ariaControls="domino-customise-menu" onClick={() => toggleMenu('customise')}/>
                {menu === 'customise' && <hub.MenuPanel title="Customise" id="domino-customise-menu" position="left-0" variant="customise" dataMenuPanel>
                  {collections.menu('dominoes', <>
                    <label className="domino-setting-field">Number of Cards
                      <select value={cardCount} onChange={event => changeCardCount(Number(event.target.value))}>
                        {Array.from({ length: maxCards - minimumCards + 1 }, (_, index) => minimumCards + index).map(count =>
                          <option key={count} value={count}>{count}</option>)}
                      </select>
                    </label>
                    {!collection && <>
                      <hub.MenuToggleRow glyph={glyph('audio')} label="Audio Mode" profileKey="" checked={audioClues}
                        disabled={!canUseAudio} onChange={toggleAudioClues} describedBy={canUseAudio ? undefined : 'domino-audio-availability'}/>
                      {audioClues && offersInstruments && <label className="domino-setting-field">Audio Topic
                        <select value={audioTopic} onChange={event => changeAudioTopic(event.target.value)}>
                          <option>Styles</option>
                          <option disabled={!canUseInstruments}>Instruments</option>
                        </select>
                      </label>}
                      {!canUseAudio && <p id="domino-audio-availability" className="px-2 text-left text-xs text-stone-600">
                        {audioLoadFailed ? 'Audio clues could not be loaded.' : recordings
                          ? 'Audio Mode needs at least 8 concepts with distinct recordings.' : 'Loading audio clues…'}
                      </p>}
                    </>}
                    {availableConceptCount >= cardCount && <>
                      <hub.ToolbarButton label="Generate New Set" className="hub-confirm-button" onClick={() => {
                        restart(drawActiveSet(cardCount));
                        setMenu(null);
                      }}/>
                      <p className="px-2 text-left text-xs text-stone-600">
                        {collection
                          ? `New sets draw at random from ${availableConceptCount} concepts in this collection.`
                          : `New sets draw at random from ${availableConceptCount} ${levels[selectedLevel].label} ${audioClues ? audioTopic.toLowerCase() : 'concepts'}.`}
                      </p>
                    </>}
                  </>, selectedLevel)}
                </hub.MenuPanel>}
              </div>
              {collection && collections.clearCollectionLink(collection.name, selectedLevel)}
            </>} feedback={results ? <div className="domino-actions">
                {!classroomGame && <hub.ToolbarButton label={showSolution ? 'Feedback' : 'Solution'} disabled={!feedbackComplete} onClick={() => { stopClue(); setShowSolution(value => !value); }}/>}
                <hub.ToolbarButton label="Try Again" className="hub-confirm-button" onClick={() => restart()}/>
            </div> : null} right={<>
              {!retryRace && <hub.ToolbarButton label="Shuffle" className="domino-shuffle" disabled={startedAt !== null}
                onClick={() => restart(dominoes.shuffle(concepts))}/>}
              {!results && <button type="button" className={`${hub.ConfirmButtonClass} domino-submit`} disabled={startedAt === null} onClick={submit}>Submit</button>}
            </>}/>
          </div>
          {audioPlaybackFailed && <p className="domino-status" role="alert">This audio clue couldn’t play. Try playing it again.</p>}
          {classroomAudioTopic && !recordings ? <p className="domino-status" role="status">{audioLoadFailed ? 'Audio clues could not be loaded. Refresh to try again.' : 'Loading audio clues…'}</p>
            : showSolution ? <Chain cards={round.solution} {...clueControls}/> : <Chain cards={placed} picked={picked} results={results} revealedCount={revealedCount} onPick={pick} onSwap={swap} {...clueControls}/>}
          {!results && <p className="domino-instructions">
            {audioClues ? `Match each recording to the next ${audioTopic === 'Instruments' ? 'instrument' : 'style'}` : 'Match each definition to the next concept'}, reading each row left to right.
            {' '}Drag one domino onto another or select two to swap them.
          </p>}
          {results && <p className="sr-only" role="status">{feedbackComplete ? <>{revealedScore} of {matchCount} matches correct{award && ` · ${award.label} medal`}</> : 'Checking matches…'}</p>}
        </main>
      </div>
    </div>;
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
})();
