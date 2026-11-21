/* Player shell, loaded only when a game opens. */
(() => {
  const { useState, useEffect, useRef } = React, C = window.IGCore;
  const simpleGameControls=['connections','crosswords','wordsearch','conceptsort'].includes(document.body.dataset.gameApp);
  const template = id => C.TEMPLATES.find(t => t.id === id) || C.TEMPLATES[0];
  function ClockFace({text,characters=text.length,label}) {
    return <span className="ig-clock" role="timer" aria-label={label} aria-live="off" style={{'--ig-clock-characters':characters}}>{text}</span>;
  }
  function ActivityTimer({active, start, elapsed, limit, onExpire}) {
    const [clock, setClock] = useState(() => window.IGTimer.frame(0, limit));
    const expire = useRef(onExpire);
    expire.current = onExpire;
    useEffect(() => {
      if (!active) return;
      start.current = performance.now() - elapsed.current;
      let animation;
      let characters = window.IGTimer.frame(elapsed.current, limit).characters;
      function tick(now) {
        elapsed.current = now - start.current;
        const next = window.IGTimer.frame(elapsed.current, limit, characters);
        characters = next.characters;
        setClock(previous => previous.text === next.text && previous.characters === next.characters ? previous : next);
        if (next.expired) expire.current();
        else animation = requestAnimationFrame(tick);
      }
      animation = requestAnimationFrame(tick);
      return () => { cancelAnimationFrame(animation); elapsed.current = Math.max(elapsed.current, performance.now() - start.current); };
    }, [active, limit, start]);
    return <ClockFace text={clock.text} characters={clock.characters}/>;
  }
  function wordsearchGridSize(width, availableHeight) {
    // Reserve the board padding, column gap and a readable clue column area.
    return Math.max(1, Math.min(availableHeight - 24, width - 392));
  }
  function FittedGameStage({children, headerSpace = 72}) {
    const viewport = useRef(null), canvas = useRef(null);
    useEffect(() => {
      const host = viewport.current, board = canvas.current;
      if (!host || !board || typeof ResizeObserver === 'undefined') return;
      let frame;
      const fit = () => {
        const content = board.querySelector('.ig-submitted-game');
        const width = host.clientWidth, height = host.clientHeight;
        if (!width || !height || !content) return;
        // Always measure at the available width, including after a long page.
        board.style.width = `${width}px`;
        board.style.padding = '0 18px 140px';
        const wordsearch = content.querySelector?.('.ig-wordsearch');
        const crossword = content.querySelector?.('.ig-crossword-player');
        const topSpace = (wordsearch || crossword ? 0 : headerSpace) + (parseFloat(getComputedStyle(host).getPropertyValue('--ig-fullscreen-control-inset')) || 0);
        let availableHeight = Math.max(1, height - topSpace);
        const sort = content.querySelector?.('.ig-group-sort-layout');
        const order = content.querySelector?.('.ig-rank-list');
        const match = content.querySelector?.('.ig-match-bank');
        const trueFalse = content.querySelector?.('.ig-true-or-false');
        const bottomSpace = wordsearch || trueFalse ? 0 : crossword ? 24 : 140;
        board.style.paddingBottom = `${bottomSpace}px`;
        if (wordsearch || crossword) {
          const size = wordsearchGridSize(width, availableHeight);
          if (wordsearch) wordsearch.style.setProperty('--ig-wordsearch-size', `${size}px`);
          if (crossword) crossword.style.setProperty('--ig-crossword-size', `${size}px`);
          board.style.padding = '0 12px';
          board.style.height = `${availableHeight}px`;
          board.style.top = `${topSpace}px`;
          board.style.transform = 'translateX(-50%)';
          board.style.setProperty('--ig-action-counter-scale', '1');
          return;
        }
        if(sort?.classList.contains('ig-facts-sort-layout')){
          const count=Number(sort.dataset.itemCount||0),longest=Math.max(0,...Array.from(sort.querySelectorAll('.ig-sort-label')).map(node=>node.textContent.length));
          const assigned=Math.max(0,...Array.from(sort.querySelectorAll('.ig-sort-slots')).map(node=>node.querySelectorAll('.ig-sort-card').length));
          const rows=Math.max(Math.ceil(count/3),2*Math.ceil(Math.max(4,assigned)/2));
          const factHeight=Math.max(88,Math.ceil(longest/15)*21+16);
          const minimum=rows*(factHeight+6)+topSpace+158;
          host.style.minHeight=minimum+'px';
          availableHeight=Math.max(availableHeight,minimum-topSpace);
        }else host.style.removeProperty('min-height');
        if (sort) {
          const sections = Array.from(sort.querySelectorAll('.ig-sort-groups>section'));
          const facts=sort.classList.contains('ig-facts-sort-layout'),photoCards=!!sort.querySelector('.ig-sort-photo-card'),poolColumns=photoCards?2:3,groupColumns=facts||photoCards?2:4;
          const headingHeight=facts?Math.max(24,...sections.map(section=>{const range=document.createRange();range.selectNodeContents(section.querySelector('button'));return Math.ceil(range.getBoundingClientRect().height)+8;})):24;
          sort.style.setProperty('--ig-facts-heading-height',headingHeight+'px');
          const groupRows = Math.ceil(sections.length / 2);
          sort.style.setProperty('--ig-sort-group-rows',String(Math.max(1,groupRows)));
          sort.style.setProperty('--ig-sort-pool-rows',String(Math.max(1,Math.ceil(Number(sort.dataset.itemCount||0)/poolColumns))));
          const groupHeight=Math.max(1,Math.floor((availableHeight-106-Math.max(0,groupRows-1)*12)/Math.max(1,groupRows)));
          sort.style.setProperty('--ig-sort-group-height',`${groupHeight}px`);
          for(const section of sections){
            const slots=section.querySelector('.ig-sort-slots');
            const count=Math.max(1,Math.ceil(slots.querySelectorAll('.ig-sort-card').length/groupColumns));
            slots.style.setProperty('--ig-sort-slot-rows',String(count));
            slots.style.setProperty('--ig-sort-slot-height',`${Math.max(1,Math.floor((groupHeight-(facts?headingHeight+20:44)-(count-1)*6)/count))}px`);
          }
          let slotRows = 0;
          for (let index = 0; index < sections.length; index += 2) {
            slotRows += Math.max(...sections.slice(index, index + 2).map(section => Math.ceil(section.querySelector('.ig-sort-slots').children.length / groupColumns)));
          }
          const poolRows = Math.ceil(Number(sort.dataset.itemCount || 0) / poolColumns);
          const tracks = Math.max(1, poolRows, slotRows);
          const spacing = Math.max(16 + Math.max(0, poolRows - 1) * 6, groupRows * 32 + Math.max(0, groupRows - 1) * 18 + Math.max(0, slotRows - groupRows) * 6);
          const cardHeight = Math.max(48, Math.floor((availableHeight - 106 - spacing) / tracks));
          sort.style.setProperty('--ig-sort-card-height', `${cardHeight}px`);
        }
        if (trueFalse) {
          // Reserve the Next-button area throughout the question, not only after marking.
          trueFalse.style.setProperty('--ig-true-false-height', `${Math.max(1, availableHeight - 140)}px`);
        }
        if(sort){
          sort.style.setProperty('--ig-sort-board-height',`${Math.max(1,availableHeight-106)}px`);
          board.style.width=`${width}px`;
          board.style.height=`${availableHeight}px`;
          board.style.padding='0 12px 106px';
          board.style.top=`${topSpace}px`;
          board.style.transform='translateX(-50%)';
          board.style.setProperty('--ig-sort-button-bottom','24px');
          board.style.setProperty('--ig-match-submit-counter-scale','1');
          board.style.setProperty('--ig-action-counter-scale','1');
          return;
        }
        if(match){
          const game=match.closest('.ig-learning');
          game.style.setProperty('--ig-match-board-height',`${Math.max(1,availableHeight-120)}px`);
          game.style.setProperty('--ig-match-target-rows',String(Math.ceil(game.querySelectorAll('.ig-match-target').length/3)));
          game.style.setProperty('--ig-match-bank-rows',String(Math.max(1,match.children.length)));
          board.style.width=`${width}px`;
          board.style.height=`${availableHeight}px`;
          board.style.padding='0 12px 120px';
          board.style.top=`${topSpace}px`;
          board.style.transform='translateX(-50%)';
          board.style.setProperty('--ig-match-submit-counter-scale','1');
          board.style.setProperty('--ig-action-counter-scale','1');
          return;
        }
        const connection = content.querySelector('.ig-connection-player');
        if (connection && host.closest('.ig-resource-game') === document.fullscreenElement) {
          // Fill four stable row slots, retaining room for revealed group names
          // and the Submit control as the fullscreen area changes size.
          const rowHeight = Math.max(1, (availableHeight - 114) / 4);
          connection.style.setProperty('--ig-connection-row-height', `${rowHeight}px`);
          connection.style.setProperty('--ig-connection-card-height', `${Math.max(1, rowHeight - 28)}px`);
          board.style.height = `${availableHeight}px`;
          board.style.padding = '0 18px 106px';
          board.style.top = `${topSpace}px`;
          board.style.transform = 'translateX(-50%)';
          board.style.setProperty('--ig-action-counter-scale', '1');
          return;
        }
        if (connection) {
          connection.style.removeProperty('--ig-connection-row-height');
          connection.style.removeProperty('--ig-connection-card-height');
        }
        const naturalWidth = Math.max(width, content.scrollWidth + 36);
        board.style.width = `${naturalWidth}px`;
        let naturalHeight = Math.max(availableHeight, content.scrollHeight + bottomSpace);
        let scale = Math.min(1, width / naturalWidth, availableHeight / naturalHeight);
        if (sort || order) {
          // Submit stays full size after canvas fitting: reserve its physical
          // height, bottom inset and gap before scaling the sorting trays.
          const actionSpace = order ? 130 : 106;
          scale = Math.min(1, width / naturalWidth, Math.max(1, availableHeight - actionSpace) / Math.max(1, content.scrollHeight));
          naturalHeight = Math.max(availableHeight / scale, content.scrollHeight + actionSpace / scale);
          board.style.paddingBottom = `${actionSpace / scale}px`;
          board.style.setProperty('--ig-sort-button-bottom', `${24 / scale}px`);
          board.style.setProperty('--ig-order-button-bottom', `${24 / scale}px`);
        }
        board.style.setProperty('--ig-match-submit-counter-scale', String(1 / scale));
        board.style.setProperty('--ig-action-counter-scale', String(1 / scale));
        board.style.height = `${naturalHeight}px`;
        board.style.top = `${topSpace + availableHeight / 2}px`;
        board.style.transform = `translate(-50%,-50%) scale(${scale})`;
      };
      const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(fit); };
      const observer = new ResizeObserver(schedule);
      observer.observe(host);
      const content = board.querySelector('.ig-submitted-game');
      if (content) observer.observe(content);
      // Moving cards changes group density without changing the board dimensions.
      const cardChanges = new MutationObserver(schedule);
      if (content) cardChanges.observe(content, {childList:true,subtree:true,attributes:true,attributeFilter:['data-sort-capacity']});
      board.addEventListener('load', schedule, true);
      document.addEventListener('fullscreenchange', schedule);
      fit();
      window.MLHConnectionsRefresh?.ready();
      return () => { observer.disconnect(); cardChanges.disconnect(); cancelAnimationFrame(frame); board.removeEventListener('load', schedule, true); document.removeEventListener('fullscreenchange', schedule); };
    }, [headerSpace]);
    return <div className="ig-game-stage ig-fitted-stage" ref={viewport}><div className="ig-game-fit-canvas" ref={canvas}>{children}</div></div>;
  }
  function AttemptReview({ entries, onExit, anchoredResults = false, groupedAnswers = false }) {
    const [index, setIndex] = useState(0);
    const entry = entries[index];
    const promptBox=useRef(null),promptText=useRef(null);
    React.useLayoutEffect(()=>{
      const fit=()=>{
        if(!promptBox.current||!promptText.current)return;
        let size=28;
        promptText.current.style.fontSize=`${size}px`;
        while(size>1&&(promptText.current.scrollHeight>promptBox.current.clientHeight||promptText.current.scrollWidth>promptText.current.clientWidth))promptText.current.style.fontSize=`${--size}px`;
      };
      fit();
      const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(fit):null;
      if(promptBox.current)observer?.observe(promptBox.current);
      return ()=>observer?.disconnect();
    },[entry?.prompt]);
    if (!entry) return <div className="ig-learning ig-attempt-review"><p>No answers to review.</p><button type="button" onClick={onExit}>Results</button></div>;
    return <div className="ig-learning ig-attempt-review">
      <nav className="ig-review-navigation" aria-label="Review questions"><button type="button" aria-label="Previous question" disabled={index===0} onClick={()=>setIndex(i=>i-1)}>←</button><span aria-live="polite">{index+1} / {entries.length}</span><button type="button" aria-label="Next question" disabled={index===entries.length-1} onClick={()=>setIndex(i=>i+1)}>→</button></nav>
      <h2 ref={promptBox}><span ref={promptText}>{entry.prompt}</span></h2>
      {entry.media && window.IGMedia && <window.IGMedia media={entry.media}/>}
      <div className={entry.parts||groupedAnswers?'ig-review-grouped-answers':'ig-review-single-answer'}>{(entry.parts||[entry]).map((answer,part)=><dl key={part} aria-label={entry.parts?`Answer ${part+1}`:undefined}><div className={answer.correct?'ig-review-box-correct':'ig-review-box-incorrect'}><dt>Your Answer</dt><dd className={answer.correct?'ig-review-answer-correct':'ig-review-answer-incorrect'}>{answer.answer || '–'}<span className={`ig-review-feedback-icon ig-feedback-icon ${answer.correct?'ig-feedback-tick':'ig-feedback-cross'}`} role="img" aria-label={answer.correct?'Correct':'Incorrect'}/></dd></div><div className="ig-review-box-expected"><dt>Correct Answer</dt><dd>{answer.expected}</dd></div></dl>)}</div>
      {!anchoredResults && <button type="button" className="ig-learning-primary ig-review-results" onClick={onExit}>Results</button>}
    </div>;
  }
  window.IGAttemptReview = AttemptReview;
  function ResourceControls({sound,onAudio}) {
    const [fullscreen,setFullscreen]=useState(false);
    useEffect(()=>{const update=()=>setFullscreen(Boolean(document.fullscreenElement));document.addEventListener('fullscreenchange',update);return()=>document.removeEventListener('fullscreenchange',update);},[]);
    async function toggleFullscreen(event){try{if(document.fullscreenElement)await document.exitFullscreen();else await event.currentTarget.closest('.ig-resource-card').querySelector('.ig-resource-game').requestFullscreen();}catch{}}
    return <div className="hub-toolbar-right ig-resource-controls"><button type="button" className="ig-resource-audio" aria-label={sound?'Turn off game audio':'Turn on game audio'} aria-pressed={sound} title={sound?'Turn off game audio':'Turn on game audio'} onClick={onAudio}><img src="./ui-icons/audio-svgrepo-com.svg?v=20260722-smaller15" alt="" aria-hidden="true"/></button><button type="button" aria-label={fullscreen?'Exit Full Screen':'Full Screen'} aria-pressed={fullscreen} title="Toggle full screen" onClick={toggleFullscreen} disabled={typeof document === 'undefined' || !document.fullscreenEnabled}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d={fullscreen?'M9 3v6H3m18 0h-6V3M3 15h6v6m6 0v-6h6':'M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6'}/></svg></button></div>;
  }
  window.IGFeedbackBadge = function FeedbackBadge({correct}) {
    return <span className={`ig-game-feedback-mark ${correct ? 'is-correct' : 'is-incorrect'}`} role="status" aria-label={correct ? 'Correct' : 'Incorrect'}><span className={`ig-feedback-icon ${correct ? 'ig-feedback-tick' : 'ig-feedback-cross'}`} aria-hidden="true"/></span>;
  };
  function PlayerHeader({clock,current,total,mode,showTimer=true,menuOpen,menuAnchor,triggerProps,onMenuToggle,onPause,onRestart,paused,children}) {
    return <div className="ig-player-top">{showTimer&&<div className="ig-timer-menu-anchor" ref={menuAnchor}>{simpleGameControls?<span className="ig-clock-trigger ig-player-pill ig-clock-display">{clock}</span>:<button type="button" className="ig-clock-trigger ig-player-pill" aria-label="Game controls" aria-haspopup="menu" aria-expanded={menuOpen} {...(triggerProps||{onClick:onMenuToggle})}>{clock}</button>}{!simpleGameControls&&menuOpen&&<div className="ig-timer-menu" role="menu" aria-label="Game controls"><button type="button" role="menuitem" onClick={onPause}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={paused?'M8 5v14l11-7z':'M7 5h4v14H7zm8 0h4v14h-4z'}/></svg>{paused?'Resume':'Pause'}</button><button type="button" role="menuitem" onClick={onRestart}><img src="./ui-icons/restart.svg" alt="" aria-hidden="true"/>Restart</button></div>}</div>}{current&&total>1&&<span className="ig-player-progress ig-player-pill" aria-live="polite" aria-label={`Question ${current} of ${total}`}>{current}{['quiz','complete-the-sentence'].includes(mode)?' of ':' / '}{total}</span>}{children}</div>;
  }
  function GameSession({
    activity,
    mode,
    options,
    onExit,
    externalControls=false,
    active=true,
    onStart,
    onAudio,
    soundPreferenceResolved=false,
    onRestart,
    onNextQuestion,
    connectionScore,
    connectionConfetti=0,
    connectionMedalEligible=false,
    onConnectionComplete,
    openingScreen=null,
    openingActive=false
  }) {
    const sortCollection=mode==='group-sort'&&document.body.dataset.gameApp==='conceptsort'&&!['elements','all'].includes(activity.sortRecipe?.type);
    const nextResultAction=onNextQuestion||(sortCollection?onRestart:undefined);
    const [fullscreenStatsHost,setFullscreenStatsHost]=useState(null),[fullscreenSession,setFullscreenSession]=useState(false);
    useEffect(()=>{const update=()=>setFullscreenSession(Boolean(document.fullscreenElement?.contains(panel.current)));document.addEventListener('fullscreenchange',update);update();return()=>document.removeEventListener('fullscreenchange',update);},[]);
    const [result, setResult] = useState(null),
      [elapsedMs, setElapsedMs] = useState(0),
      [headerProgress,setHeaderProgress]=useState({correct:0,total:mode==='matching-pairs'?4:activity.items.length}),
      [answerReveal, setAnswerReveal] = useState(false),
      [connectionLives, setConnectionLives] = useState(4),
      [connectionNotice,setConnectionNotice] = useState(''),
      [timerStarted, setTimerStarted] = useState(mode !== 'matching-pairs'),
      [error, setError] = useState(''),
      [review, setReview] = useState(false),
      [resultsClosing, setResultsClosing] = useState(false),
      [nextQuestionClosing,setNextQuestionClosing] = useState(false),
      [launching, setLaunching] = useState(false),
      [muted, setMuted] = useState(()=>soundPreferenceResolved ? !options.sound : !C.readSoundPreference(options.sound)),
      [paused, setPaused] = useState(false),
      [matchPage, setMatchPage] = useState(0),
      [currentQuestion, setCurrentQuestion] = useState(1),
      [timerMenuOpen, setTimerMenuOpen] = useState(false);
    const submittedElapsed = useRef(null), controlPointer = useRef(null);
    const launchTimer = useRef(null);
    const timerMenuAnchor = useRef(null);
    useEffect(() => () => clearTimeout(launchTimer.current), []);
    useEffect(() => {
      if (!timerMenuOpen) return;
      const outside = event => { if (!timerMenuAnchor.current?.contains(event.target)) setTimerMenuOpen(false); };
      const escape = event => { if (event.key === 'Escape') setTimerMenuOpen(false); };
      document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
      return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
    }, [timerMenuOpen]);
    const resultsExitTimer = useRef(null), resultsExitAction = useRef(null);
    useEffect(() => () => clearTimeout(resultsExitTimer.current), []);
    function dismissResults(action,fadeGame=false) {
      if (resultsExitAction.current) return;
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { action(); return; }
      resultsExitAction.current = action;
      setNextQuestionClosing(fadeGame);
      setResultsClosing(true);
      resultsExitTimer.current = setTimeout(() => {
        resultsExitAction.current = null;
        resultsExitTimer.current = null;
        setResultsClosing(false);
        action();
      }, 240);
    }
    function begin() {
      if (launchTimer.current !== null || active) return;
      playGameCue('gameplay');
      if (false) { onStart?.(); return; }
      setLaunching(true);
      launchTimer.current = setTimeout(() => {
        launchTimer.current = null;
        setLaunching(false);
        onStart?.();
      }, 420);
    }
    const medalSoundTimer=useRef(null);
    const gameCue = useRef(null), answerCue = useRef(null), activeAnswerCues=useRef(new Set());
    function stopGameCue(channel = gameCue) {
      if (channel.current) { void window.MLH.fadeOutAudio(channel.current, {reset:true}); }
      channel.current = null;
    }
    function stopAllCues() {
      clearTimeout(medalSoundTimer.current);
      if(simpleGameControls)window.MLH.stopFeedbackSound?.();
      stopGameCue();
      for(const clip of activeAnswerCues.current){void window.MLH.fadeOutAudio(clip,{reset:true});}
      activeAnswerCues.current.clear();
      answerCue.current = null;
    }
    function playGameCue(name, channel = gameCue) {
      if(channel!==answerCue)stopGameCue(channel);
      if (muted) return Promise.resolve();
      return new Promise(resolve=>{
        try {
          const clip = new window.Audio(`./music-games/audio/${name}.mp3${name === 'gamewrong' ? '?v=20261016-upload' : ''}`);
          const complete=()=>{activeAnswerCues.current.delete(clip);if(channel.current===clip)channel.current=null;resolve();};
          if(channel===answerCue)activeAnswerCues.current.add(clip);
          clip.onended=complete;clip.onerror=complete;clip.onabort=complete;clip.onpause=complete;
          if (name === 'gamecorrect' || (name === 'gamewrong' && mode==='group-sort')) clip.playbackRate = 1.5;
          channel.current = clip;
          clip.play().catch(complete);
        } catch {resolve();}
      });
    }
    useEffect(() => { if (muted) stopAllCues(); }, [muted]);
    useEffect(() => stopAllCues, []);
    const soundContext = useRef(null);
    useEffect(()=>{setMuted(soundPreferenceResolved ? !options.sound : !C.readSoundPreference(options.sound));},[options.sound,soundPreferenceResolved]);
    useEffect(() => () => {
      Promise.resolve(globalThis.MLH?.closeAudioContext?.(soundContext.current) || soundContext.current?.close()).catch(() => {});
    }, []);
    function interactionSound(kind) {
      if (!active || muted) return;
      try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        const ctx = soundContext.current || (soundContext.current = new Audio());
        ctx.resume().catch(() => {});
        window.IGSounds.play(ctx, kind);
      } catch {}
    }
    const liftedItem = useRef(false);
    const nativeDrag = useRef(false);
    function liftSound(e) {
      if (e.button !== undefined && e.button !== 0) return;
      const item = e.target.closest('[draggable="true"]');
      const control = e.target.closest('button,input,textarea,select');
      if (!item || (control && control !== item) || item.disabled) return;
      if (!liftedItem.current) interactionSound('lift');
      liftedItem.current = true;
    }
    function releaseSound() {
      if (liftedItem.current) interactionSound('drop');
      liftedItem.current = false;
      nativeDrag.current = false;
    }
    function clickSound(e) {
      if (e.target.closest('.ig-pin-scene')) return;
      const button = e.target.closest('button,[role="button"]');
      if (button && button.getAttribute('draggable') !== 'true' && !button.disabled && button.getAttribute('aria-disabled') !== 'true') interactionSound('button');
    }
    function keySound(e) {
      if (!e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1 && /[a-z0-9]/i.test(e.key) && !e.target.closest('input,textarea,[contenteditable="true"]') && mode === 'hangman') interactionSound('type');
    }
    function report(r) {
      if (ended.current) return;
      const previous = progress.current.answers?.length || 0;
      const hasNewAnswer = (r.answers?.length || 0) > previous;
      progress.current = {...r, current:r.current || progress.current.current};
      if(simpleGameControls)setHeaderProgress({correct:r.correct||0,total:r.total||0});
      if (['type-the-answer','complete-the-sentence'].includes(mode) && r.current) setCurrentQuestion(r.current);
      if (!['rank-order','matching-pairs','group-sort','speed-sorting'].includes(mode) && active && !muted && options.feedback!=='end' && !r.unscored && typeof r.answers?.at(-1)?.correct === 'boolean' && r.answers.length > previous) {
        playGameCue(r.answers.at(-1).correct ? 'gamecorrect' : 'gamewrong', answerCue);
      }
    }
    const start = useRef(performance.now()),
      elapsed = useRef(0),
      ended = useRef(false),
      progress = useRef({
        correct: 0,
        total: mode==='match-up'?Math.min(activity.items.length,C.LIMITS.matchItems):activity.items.length,
        answers: [],
        unscored: template(mode).scored === false
      }),
      panel = useRef(null);
    const Game = window.IGLearning?.[mode] || window.IGArcade?.[mode];
    const matchPageCount = mode === 'match-up' ? Math.ceil(Math.min(activity.items.length,C.LIMITS.matchItems) / 12) : 1;
    const [playActivity] = useState(() => ({
      ...activity,
      items: (options.shuffle && mode !== 'rank-order' ? C.shuffle(activity.items) : activity.items).slice(0,mode==='match-up'?C.LIMITS.matchItems:activity.items.length)
    }));
    function freezeAnswerTime() {
      if (submittedElapsed.current !== null) return;
      submittedElapsed.current = Math.max(0, performance.now() - start.current);
      elapsed.current = submittedElapsed.current;
      setAnswerReveal(true);
    }
    function finish(r) {
      if (ended.current) return;
      ended.current = true;
      if (active) playGameCue('gameend');
      const completedElapsed = submittedElapsed.current ?? Math.max(0, performance.now() - start.current);
      setElapsedMs(options.timer > 0 ? Math.min(options.timer * 1000, completedElapsed) : completedElapsed);
      if (r.openReview && mode !== 'labelled-diagram' && mode !== 'rank-order') setReview(true);
      const medalResult={activity,template:mode,total:r.total,correct:r.correct,elapsedMs:completedElapsed,timedOut:r.timedOut};
      let medal=connectionScore?onConnectionComplete?.(r.correct===4&&r.total===4&&!r.timedOut):simpleGameControls?window.MLHGameMedals?.tierFor(medalResult):null;
      const qualifiedMedal=medal;
      if(medal&&connectionScore&&!muted)medalSoundTimer.current=window.setTimeout(()=>{window.MLH.playFeedbackSound?.(true,true,medal==='diamond'?'platinum':medal);},900);
      if(medal&&!connectionScore){
        try{
          if(mode==='group-sort')medal=window.MLHGameMedals.recordCollection(localStorage,activity,medalResult);
          else window.MLHGameMedals.record(localStorage,`${mode}:${activity.id}`,medalResult);
        }catch{}
      }
      if(medal&&!connectionScore){
        window.MLH?.achievements?.award(mode==='group-sort'?'conceptsort.html':mode==='matching-pairs'?'connections.html':mode==='crossword'?'crosswords.html':'wordsearch.html',activity.level,medal);
        if(!muted)medalSoundTimer.current=window.setTimeout(()=>{window.MLH.playFeedbackSound?.(true,true,medal==='diamond'?'platinum':medal);},900);
      }
      setResult({...r,medal,medalAlreadyEarned:mode==='group-sort'&&Boolean(qualifiedMedal&&!medal)});
      if(simpleGameControls)setHeaderProgress({correct:r.correct||0,total:r.total||0});
    }
    const legacyColours = { classic: 'blue', ocean: 'blue', garden: 'green', night: 'black', 'high-readability': 'black' };
    const gameColour = legacyColours[options.theme] || options.theme || 'blue';
    const running = active && !paused;
    function startConnectionTimer() {
      if (timerStarted || !running || result) return;
      start.current = performance.now();
      setTimerStarted(true);
    }
    function controlActivation(action) {
      return {
        onPointerDown:event=>{
          if(event.button===0&&!event.currentTarget.disabled)controlPointer.current={node:event.currentTarget,id:event.pointerId};
        },
        onPointerCancel:()=>{controlPointer.current=null;},
        onPointerUp:event=>{
          const pressed=controlPointer.current;
          controlPointer.current=null;
          if(event.button!==0||event.currentTarget.disabled||pressed?.node!==event.currentTarget||pressed?.id!==event.pointerId)return;
          event.preventDefault();
          event.stopPropagation();
          action();
        },
        onClick:event=>{if(event.detail===0)action();}
      };
    }
    const sequentialReview = ['quiz','gameshow-quiz','true-or-false','type-the-answer','complete-the-sentence'].includes(mode);
    const earnedMedal=result?.medal?window.MLH?.achievements?.medals[result.medal]:null;
    const headerStatsHost=simpleGameControls?(connectionScore&&fullscreenSession&&fullscreenStatsHost?fullscreenStatsHost:document.getElementById('ig-header-game-stats')):null;
    return <div className={`ig-game-launch${launching ? ' is-launching' : ''}${paused ? ' is-paused' : ''}${nextQuestionClosing?' is-changing-question':''}`} aria-busy={launching || undefined}>{connectionScore&&<div ref={setFullscreenStatsHost} className="ig-fullscreen-stats-slot"/>}{headerStatsHost&&ReactDOM.createPortal(connectionScore?<div className="ig-connection-stats"><window.MLH.ScoreStreakPanel scoreDisplay={window.MLHGamePractice.livesDisplay(connectionLives)} assets={{bronze:'./ui-icons/bronze.svg',silver:'./ui-icons/silver.svg',gold:'./ui-icons/gold.svg',diamond:'./ui-icons/diamond.svg'}} correct={connectionScore.correct} attempted={connectionScore.attempted} accuracy={connectionScore.attempted?Math.round(connectionScore.correct/connectionScore.attempted*100):0} streak={connectionScore.streak} bestStreak={connectionScore.bestStreak} resetScore={onRestart} confettiKey={connectionConfetti} achievementLevel={activity.level} achievementActivity="connections.html" medalThresholdValues={window.MLHGamePractice.streakThresholds} medalEligible={connectionMedalEligible}/></div>:<>{mode==='matching-pairs'?<window.MLH.ResetStat label="Connections" onReset={onRestart}><span className="ig-header-stat-value" aria-live="polite">{headerProgress.correct}<span className="ig-header-stat-total">/{headerProgress.total}</span></span></window.MLH.ResetStat>:<section className="ig-header-stat"><span className="ig-header-stat-label">{mode==='group-sort'?(activity.sortRecipe?'Cards':'Concepts'):'Words'}</span><span className="ig-header-stat-value" aria-live="polite">{headerProgress.correct}<span className="ig-header-stat-total">/{headerProgress.total}</span></span></section>}{window.MLHGameMedals?.eligible(mode,activity)?<window.MLH.TimedMedalStat medal={result?.medal} celebrationKey={result?.medal?Math.max(1,elapsedMs):0} thresholds={['bronze','silver','gold','diamond'].map(tier=>({tier,label:window.IGTimer.format(headerProgress.total*window.MLHGameMedals.limitsFor(mode)[tier]*1000,false)}))}><ActivityTimer active={running&&timerStarted&&!answerReveal&&!result} start={start} elapsed={elapsed} limit={options.timer*1000} onExpire={()=>finish({...progress.current,total:progress.current.total||activity.items.length,timedOut:true})}/></window.MLH.TimedMedalStat>:<section className="ig-header-stat"><span className="ig-header-stat-label">Time</span><ActivityTimer active={running&&timerStarted&&!answerReveal&&!result} start={start} elapsed={elapsed} limit={options.timer*1000} onExpire={()=>finish({...progress.current,total:progress.current.total||activity.items.length,timedOut:true})}/></section>}</>,headerStatsHost)}<section className={`ig-session ig-theme-classic ig-theme-${options.theme} ig-colour-${gameColour}${openingScreen?' ig-level-test-session':' ig-has-player-controls'}${active||openingActive?'':' ig-awaiting-play'}`} inert={active||openingActive ? undefined : ''} aria-hidden={active||openingActive ? undefined : true} ref={panel} onClickCapture={clickSound} onKeyDownCapture={keySound} onPointerDownCapture={liftSound} onPointerUpCapture={()=>{if(!nativeDrag.current)releaseSound();}} onPointerCancelCapture={()=>{if(!nativeDrag.current)releaseSound();}} onDragStartCapture={e=>{liftSound(e);nativeDrag.current=true;}} onDropCapture={releaseSound} onDragEndCapture={releaseSound}>
      {!result && !openingScreen && <PlayerHeader showTimer={!simpleGameControls} clock={<ActivityTimer active={running&&timerStarted&&!answerReveal} start={start} elapsed={elapsed} limit={options.timer * 1000} onExpire={()=>finish({...progress.current,total:progress.current.total || activity.items.length,timedOut:true})}/>} current={active&&['type-the-answer','quiz','gameshow-quiz','true-or-false','complete-the-sentence'].includes(mode)?currentQuestion:null} total={activity.items.length} mode={mode} menuOpen={timerMenuOpen} menuAnchor={timerMenuAnchor} triggerProps={controlActivation(()=>setTimerMenuOpen(value=>!value))} onPause={()=>{setPaused(value=>!value);setTimerMenuOpen(false);}} onRestart={()=>{setTimerMenuOpen(false);onRestart?.();}} paused={paused}>
        {connectionNotice&&<p className="ig-connection-notice ig-player-pill" role="status" aria-live="polite">{connectionNotice}</p>}
        {active && matchPageCount > 1 && <nav className="ig-match-pagination" aria-label="Match pages">
          <button type="button" aria-label="Previous page" disabled={matchPage === 0} {...controlActivation(()=>setMatchPage(page=>Math.max(0,page-1)))}>←</button>
          <span aria-live="polite">{matchPage + 1} / {matchPageCount}</span>
          <button type="button" aria-label="Next page" disabled={matchPage >= matchPageCount - 1} {...controlActivation(()=>setMatchPage(page=>Math.min(matchPageCount-1,page+1)))}>→</button>
        </nav>}
        {mode==='matching-pairs' && !connectionScore && <span className="ig-connection-lives" role="img" aria-label={`${connectionLives} ${connectionLives===1?'life':'lives'} remaining`}>
          {Array.from({length:4},(_,index)=><span key={index} className={`ig-connection-life-blob${index<connectionLives?' is-active':' is-spent'}`} aria-hidden="true" />)}
        </span>}
      </PlayerHeader>}
      {result && review && mode==='match-up' && matchPageCount>1 && <div className="ig-player-top"><nav className="ig-match-pagination" aria-label="Review match pages"><button type="button" aria-label="Previous page" disabled={matchPage===0} {...controlActivation(()=>setMatchPage(p=>Math.max(0,p-1)))}>←</button><span aria-live="polite">{matchPage+1} / {matchPageCount}</span><button type="button" aria-label="Next page" disabled={matchPage===matchPageCount-1} {...controlActivation(()=>setMatchPage(p=>Math.min(matchPageCount-1,p+1)))}>→</button></nav></div>}
      {error && <p role="alert" className="ig-error">{error}</p>}
      {openingScreen?<div className="ig-game-stage ig-level-test-stage">{openingScreen}</div>:<FittedGameStage headerSpace={72}>
        <div className="ig-submitted-game" inert={paused || (result && !review) ? '' : undefined}>
          <div hidden={Boolean(result && review && sequentialReview)} inert={result && mode!=='labelled-diagram' && !(review && ['group-sort','crossword','wordsearch'].includes(mode)) ? '' : undefined}>
          <Game onInteractionStart={mode==='matching-pairs'?startConnectionTimer:undefined} activity={playActivity} options={{...options,active:running&&!result,sound:running&&!muted&&!result,diagramReview:!!result,reviewing:!!(result&&review),diagramSubmission:result?.diagramState}} onQuestionChange={['type-the-answer','quiz','gameshow-quiz','true-or-false'].includes(mode) ? setCurrentQuestion : undefined} page={matchPage} onPageChange={setMatchPage} onComplete={finish} onSubmitAnswers={freezeAnswerTime} onInteractionSound={interactionSound} onFeedbackReveal={correct=>{if(options.feedback!=='end')playGameCue(correct?'gamecorrect':'gamewrong',answerCue);}} onProgress={result ? undefined : report} onLivesChange={setConnectionLives} onNoticeChange={mode==='matching-pairs'?setConnectionNotice:undefined} onReviewExit={result && review && mode === 'labelled-diagram' ? ()=>setReview(false) : undefined} />
          </div>
          {result && review && sequentialReview && <AttemptReview entries={C.reviewEntries(playActivity,mode,result)} groupedAnswers={mode==='type-the-answer'} anchoredResults onExit={()=>setReview(false)}/>}
        </div>
        {result && review && !sequentialReview && mode !== 'labelled-diagram' && <button type="button" className="ig-learning-primary ig-check-action ig-return-results" onClick={()=>setReview(false)}>Results</button>}
      </FittedGameStage>}
      {result && review && sequentialReview && <button type="button" className="ig-learning-primary ig-anchored-review-results" onClick={()=>setReview(false)}>Results</button>}
      {result && !review && <div className={`ig-results${resultsClosing ? ' is-closing' : ''}`} role="dialog" aria-modal="true" aria-labelledby="ig-results-title"><div className="ig-results-card"><h2 id="ig-results-title">Results</h2>{result.medalAlreadyEarned&&<p className="ig-muted">This medal has already been earned for this collection.</p>}{result.timedOut && <p className="ig-result-timeout">Time’s up</p>}{!result.unscored && <div className="ig-scoreline">{!['crossword','wordsearch'].includes(mode) && <div><small>Score</small><strong>{result.correct} <em>/ {result.total}</em></strong></div>}{connectionScore?<div><small>Streak</small><strong>{connectionScore.streak}</strong></div>:<div><small>Time</small><strong>{window.IGTimer.format(elapsedMs, false)}</strong></div>}{simpleGameControls&&!connectionScore&&!['group-sort','crossword','wordsearch'].includes(mode)&&window.MLHGameMedals?.eligible(mode,activity)&&<div className="ig-result-medal"><small>Medal</small><strong>{earnedMedal?<img className="ig-earned-medal-animation" src={earnedMedal.icon} alt={earnedMedal.label+' medal'}/>:<span>–</span>}</strong></div>}</div>}<div className="ig-inline ig-centred"><button className="ig-review-action" disabled={resultsClosing} onClick={()=>dismissResults(()=>setReview(true))}>Review</button>{!connectionScore&&!['group-sort','crossword','wordsearch'].includes(mode)&&<button className="ig-play-again-action" disabled={resultsClosing} onClick={()=>dismissResults(onExit)}><span className="hub-playback-glyph is-play" aria-hidden="true"></span>Play Again</button>}{nextResultAction&&<button type="button" className="ig-next-question-action" disabled={resultsClosing} onClick={()=>dismissResults(nextResultAction,true)}>{sortCollection?'Play Again':'Next Question'}</button>}</div></div></div>}</section>{paused && active && !result && <div className="ig-start-overlay ig-pause-overlay"><button type="button" className="ig-preview-play" aria-label="Resume activity" onClick={()=>{setPaused(false);setTimerMenuOpen(false);}}><span className="hub-playback-glyph is-play" aria-hidden="true"></span></button></div>}{!active && !openingActive && <div className="ig-start-overlay"><button type="button" className="ig-preview-play" aria-label="Play activity" disabled={launching} onClick={begin}><span className="hub-playback-glyph is-play" aria-hidden="true"></span></button></div>}{<div className="ig-in-game-controls" onClickCapture={clickSound}><ResourceControls sound={!muted} onAudio={onAudio ||(()=>{C.saveSoundPreference(muted);setMuted(!muted);})}/></div>}</div>;
  }
  // Level quizzes only select a question bank and collect opening settings.
  // Gameplay, fitting, audio, feedback, controls, results and review belong to
  // GameSession and the same learning components used by every regular game.
  function LevelTestSession({activity}) {
    const [entered,setEntered]=useState(false),[playActivity,setPlayActivity]=useState(null),[run,setRun]=useState(0);
    const [config,setConfig]=useState({amount:Math.min(20,activity.items.length),feedback:'each'}),[error,setError]=useState('');
    const levelName={N3:'National 3',N4:'National 4',N5:'National 5',H:'Higher',AH:'Advanced Higher'}[activity.level]||activity.level;
    function reset(){setPlayActivity(null);setEntered(false);setError('');setRun(value=>value+1);}
    function start(event){event.preventDefault();try{const settings=window.IGLevelTestCore.settings(config,activity.items.length);setPlayActivity({...activity,items:C.shuffle(activity.items).slice(0,settings.amount)});setError('');setRun(value=>value+1);}catch(error){setError(error.message);}}
    const setup=<section className="ig-level-test ig-level-test-setup" aria-label="Quiz options"><h2>{levelName} Quiz</h2><p>{activity.conceptCount} concepts</p><form onSubmit={start}><div className="ig-level-test-settings"><label>Questions (1–{activity.items.length})<input aria-label="Number of questions" type="number" min="1" max={activity.items.length} step="1" required value={config.amount} onChange={event=>setConfig({...config,amount:event.target.value})}/></label><label>Feedback<select value={config.feedback} onChange={event=>setConfig({...config,feedback:event.target.value})}><option value="each">After each answer</option><option value="end">At the end</option></select></label></div>{error&&<p role="alert">{error}</p>}<button type="submit" className="ig-learning-primary ig-level-quiz-start">Start</button></form></section>;
    return <GameSession key={run} activity={playActivity||activity} mode={activity.template} options={{...activity.options,shuffle:true,timer:0,feedback:config.feedback}} active={Boolean(playActivity)} openingScreen={playActivity?null:setup} openingActive={entered} onStart={()=>setEntered(true)} onRestart={reset} onExit={reset}/>;
  }
  window.IGLevelTestSession=LevelTestSession;

  window.IGGameSession = GameSession;
})();
