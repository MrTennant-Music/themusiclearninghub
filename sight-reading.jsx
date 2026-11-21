/* Hub-native timed note reading; source observations are recorded in tests/fixtures/sight-reading-reference.json. */
(function () {
  const {useState, useEffect, useRef} = React;
  const Core = window.MLH.SightReadingCore;
  function SightReadingPractice({pool, settings, levelLabel, renderScore, onClose, reducedMotion = false}) {
    const highScoreKey = `mlh:note-identification:speed-mode:highest:${levelLabel}`;
    const [highest, setHighest] = useState(() => {
      try { const saved = Number(window.localStorage?.getItem(highScoreKey)); return Number.isSafeInteger(saved) && saved > 0 ? saved : 0; }
      catch (_) { return 0; }
    });
    const [attempt, setAttempt] = useState(() => Core.createAttempt(pool));
    const [remaining, setRemaining] = useState(Core.DURATION_MS);
    const startProgress = useRef(1), remainingRef = useRef(remaining);
    remainingRef.current = remaining;
    const current = useRef(attempt), deadline = useRef(0), audio = useRef(null);
    current.current = attempt;
    const question = attempt.question;
    const playing = attempt.phase === 'playing';
    const last = attempt.records[attempt.records.length - 1];
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    function commit(next) { current.current = next; setAttempt(next); }
    function choose(answer) {
      if (current.current.phase !== 'playing' || performance.now() >= deadline.current) return;
      commit(Core.settle(Core.selectAnswer(current.current, answer)));
    }
    function prepareSound() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        if (!audio.current || audio.current.state === 'closed') audio.current = new AudioContext();
        audio.current.resume().catch(() => {});
        window.MLH.prepareAudioPlayback?.(audio.current, {piano: attempt.pool.map(Core.frequencyForQuestion).filter(Boolean)})?.catch(() => {});
      } catch (_) { /* Sound is optional; the visual test remains usable. */ }
    }
    function start() {
      prepareSound();
      setRemaining(Core.DURATION_MS);
      commit(Core.start(current.current));
    }
    function restart() {
      startProgress.current = 1;
      audio.current?.suspend().catch(() => {});
      setRemaining(Core.DURATION_MS);
      commit(Core.createAttempt(pool));
    }
    useEffect(() => {
      if (attempt.score <= highest) return;
      setHighest(attempt.score);
      try { window.localStorage?.setItem(highScoreKey, String(attempt.score)); } catch (_) { /* Play remains available without storage. */ }
    }, [attempt.score, highest, highScoreKey]);
    useEffect(() => {
      if (attempt.phase !== 'playing') return;
      deadline.current = performance.now() + attempt.remainingMs;
      setRemaining(attempt.remainingMs);
      let frame;
      const tick = () => {
        if (current.current.phase !== 'playing') return;
        const time = Math.max(0, deadline.current - performance.now());
        setRemaining(time);
        if (time <= 0) commit(Core.settle(current.current));
        else frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frame);
    }, [attempt.phase, attempt.index]);
    useEffect(() => {
      if (!['feedback', 'finished'].includes(attempt.phase)) return;
      const context = audio.current;
      const frequency = Core.frequencyForQuestion(question);
      if (last.correct && context?.state === 'running' && frequency) {
        window.MLH.playPianoFrequency?.(context, (globalThis.MLH?.audioOutput?.(context) || context.destination), frequency, context.currentTime, .22, .045);
      } else if (!last.correct) window.MLH.playFeedbackSound?.(false);
      if (attempt.phase === 'finished') return;
      const timer = setTimeout(() => {
        let next = Core.next(current.current);
        startProgress.current = Math.min(1, startProgress.current * remainingRef.current / current.current.durationMs + Core.noteSpacing(next.score));
        setRemaining(next.remainingMs);
        commit(next);
      }, Core.FEEDBACK_MS);
      return () => clearTimeout(timer);
    }, [attempt.phase, attempt.index]);
    useEffect(() => {
      const keydown = event => {
        if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.target?.closest?.('input, textarea, select, [contenteditable]')) return;
        const answer = event.key.toUpperCase();
        if (/^[A-G]$/.test(answer) && current.current.phase === 'playing') { event.preventDefault(); choose(answer); }
      };
      window.addEventListener('keydown', keydown);
      return () => {
        window.removeEventListener('keydown', keydown);
        Promise.resolve(globalThis.MLH?.closeAudioContext?.(audio.current) || audio.current?.close()).catch(() => {});
      };
    }, []);
    const feedback = attempt.phase === 'feedback';
    const colour = attempt.phase === 'finished' ? '#dc2626' : feedback ? '#16a34a' : '#000000';
    const progress = startProgress.current * remaining / attempt.durationMs;
    let followingProgress = progress;
    const upcoming = [];
    if (attempt.score >= Core.CORRECT_PER_STEP && attempt.phase !== 'finished') {
      for (let i = 0; i < attempt.upcoming.length; i++) {
        const next = attempt.upcoming[i];
        // A different clef starts a fresh staff, so never preview its notes under the current clef.
        if (next.clef !== question.clef) break;
        followingProgress += Core.noteSpacing(attempt.score + i + (feedback ? 0 : 1));
        if (followingProgress > 1) break;
        upcoming.push({question: next, progress: followingProgress, id: attempt.index + i + 1});
      }
    }
    const choices = settings.accidentals
      ? [['Ab','Bb',null,'Db','Eb',null,'Gb'], letters, ['A#',null,'C#','D#',null,'F#','G#']]
      : [letters];
    return <main className="sight-reading" aria-label="Speed Mode">
      <div className="sight-reading-toolbar">
        <button type="button" className={`${window.MLH.ToolbarButtonClass} gap-2 sight-reading-back`} onClick={onClose}>
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>Back</span>
        </button>
        <h2>Speed Mode</h2>
        <button type="button" className={`${window.MLH.ToolbarButtonClass} gap-1.5 sight-reading-reset`} disabled={attempt.phase === 'ready'} onClick={restart}>
          <img src="./ui-icons/restart.svg" alt="" className="h-[20px] w-[20px]" />
          <span className="relative -left-[1.5px]">Reset</span>
        </button>
      </div>
      {attempt.phase === 'finished' ? <div className="sight-reading-game-over" role="status">
        <h3>Game Over</h3>
        <p>Score {attempt.score}</p>
      </div> : null}
      <div className="sight-reading-stats" style={attempt.phase === 'finished' ? {visibility: 'hidden'} : undefined}>
        {attempt.phase === 'ready' ? <span>{levelLabel} • Highest score: <strong>{highest}</strong></span> : <span>Score <strong>{attempt.score}</strong></span>}
      </div>
        <div className={`sight-reading-score${feedback && last.correct ? " has-correct-note" : ""}`}>{renderScore(question, colour, progress, false, upcoming, attempt.phase !== 'ready')}</div>
        <div className="sight-reading-status" role="status" aria-live="polite">
          {attempt.phase === 'ready' && <div className="sight-reading-start-guidance"><p>Choose the note name before it reaches the line, with notes getting faster as your score increases.</p></div>}
        </div>
        {attempt.phase === 'ready' ? <div className="sight-reading-start"><button type="button" className="sight-reading-primary" onClick={start}>Start</button></div> : <div className={`sight-reading-controls${attempt.phase === 'finished' ? ' is-finished' : ''}`}>
          <div className="sight-reading-answers" role="group" aria-label="Note names" aria-hidden={attempt.phase === 'finished' || undefined}>
          {choices.map((row, r) => <div className="sight-reading-answer-row" key={r}>{row.map((answer, i) => answer ? <button type="button" key={answer} disabled={!playing} aria-pressed={attempt.selected === answer} className={`${attempt.selected === answer ? 'is-selected' : ''} ${feedback && answer === last.expected ? 'is-correct' : feedback && answer === last.answer ? 'is-incorrect' : ''}`} onClick={() => choose(answer)}>{answer.replace('#','♯').replace('b','♭')}</button> : <span key={i} />)}</div>)}
          </div>
          {attempt.phase === 'finished' && <div className="sight-reading-start sight-reading-retry"><button type="button" className="sight-reading-primary" onClick={restart}>Try Again</button></div>}
        </div>}
    </main>;
  }
  window.MLH.SightReadingPractice = SightReadingPractice;
})();
