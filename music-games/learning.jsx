/* Independent classroom game players. Content and scoring stay outside presentation. */
(function () {
  'use strict';
  const { useState, useMemo, useRef, useEffect, useLayoutEffect } = React;
  function FeedbackBadge({className='',...props}) {
    const correct=className.includes('ig-feedback-tick');
    return <span {...props} className={`${className} ig-feedback-svg`}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{display:'block',width:'100%',height:'100%',margin:0,padding:0,transform:'none'}}><path d={correct?'M4 12 9 17 20 6':'M6 6 18 18 M18 6 6 18'} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>;
  }
  const sortGroupColours = ['#2563eb', '#7e22ce', '#a16207', '#0f766e', '#be185d', '#4338ca'];
  const cardColours = ['#dc2626', '#c2410c', '#a16207', '#15803d', '#0369a1', '#4338ca', '#7e22ce', '#be185d'];
  const norm = value => String(value || '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
  const mix = values => window.IGCore && window.IGCore.shuffle ? window.IGCore.shuffle(values.slice()) : values.slice().sort(() => Math.random() - .5);
  const Media = ({ media }) => window.IGMedia ? <window.IGMedia media={media} /> : media && media.type === 'image' ? <img src={media.src} alt={media.name || ''} /> : null;
  const words = value => String(value || '').trim().split(/\s+/).filter(Boolean);
  const letters = value => String(value || '').normalize('NFKC').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const matchMeasureContext = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
  function matchAnswerFontSize(text) {
    if (!matchMeasureContext) return '22px';
    matchMeasureContext.font = '600 22px ui-sans-serif, system-ui, sans-serif';
    const width = matchMeasureContext.measureText(String(text || '')).width;
    return `${Math.max(16, Math.min(22, 22 * Math.min(1, 210 / Math.max(1, width))))}px`;
  }
  function captureCardPositions(nodes) {
    return new Map(Object.entries(nodes).map(([index, node]) => [Number(index), node?.getBoundingClientRect()]).filter(([, rect]) => !!rect));
  }
  function animateCardPositions(previous, nodes, duration) {
    if (!previous || false) return;
    previous.forEach((rect, index) => {
      const node = nodes[index];
      if (!node?.animate) return;
      const next = node.getBoundingClientRect(), scaleX = node.offsetWidth ? next.width / node.offsetWidth : 1, scaleY = node.offsetHeight ? next.height / node.offsetHeight : 1;
      const x = (rect.left - next.left) / (scaleX || 1), y = (rect.top - next.top) / (scaleY || 1);
      if (Math.abs(x) < 1 && Math.abs(y) < 1) return;
      node.animate([{ translate: `${x}px ${y}px` }, { translate: '0px 0px' }], { duration, easing: 'cubic-bezier(.2,.75,.25,1)' });
    });
  }
  function returnDraggedCard(node, restore) {
    const left = node.style.left || '0px', top = node.style.top || '0px';
    if (!false && node.animate && (left !== '0px' || top !== '0px')) {
      node.animate([{ left, top }, { left: `${-parseFloat(left) * .04}px`, top: `${-parseFloat(top) * .04}px`, offset: .8 }, { left: '0px', top: '0px' }], { duration: 380, easing: 'cubic-bezier(.2,.75,.25,1)' }).finished.catch(() => {}).finally(restore);
    } else restore();
  }
  function createSortDragPreview(node) {
    const host = document.fullscreenElement || document.documentElement;
    const preview = node.cloneNode(true), originals = [node, ...node.querySelectorAll('*')], copies = [preview, ...preview.querySelectorAll('*')];
    originals.forEach((original, index) => {
      const style = getComputedStyle(original), copy = copies[index];
      for (const property of style) copy.style.setProperty(property, style.getPropertyValue(property));
      copy.removeAttribute('id');
      copy.style.setProperty('animation', 'none', 'important');
      copy.style.setProperty('transition', 'none', 'important');
    });
    const rect = node.getBoundingClientRect();
    preview.setAttribute('data-sort-drag-preview', 'true');
    preview.setAttribute('aria-hidden', 'true');
    preview.setAttribute('inert', '');
    preview.removeAttribute('data-pointer-dragging');
    Object.assign(preview.style, {position:'fixed',left:`${rect.left}px`,top:`${rect.top}px`,width:`${node.offsetWidth}px`,height:`${node.offsetHeight}px`,minWidth:'0',maxWidth:'none',minHeight:'0',maxHeight:'none',margin:'0',zIndex:'2147483646',pointerEvents:'none',transformOrigin:'0 0',opacity:'1',visibility:'visible'});
    preview.style.setProperty('transform', `scale(${rect.width / (node.offsetWidth || rect.width)}, ${rect.height / (node.offsetHeight || rect.height)})`, 'important');
    host.appendChild(preview);
    return preview;
  }
  const clozeMeasureContext = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
  function clozeGapWidth(text) {
    if (!clozeMeasureContext) return Math.max(100, String(text || '').length * 20 + 28);
    clozeMeasureContext.font = '600 32px ui-sans-serif, system-ui, sans-serif';
    return Math.max(100, Math.ceil(clozeMeasureContext.measureText(String(text || '')).width + 28));
  }
  function useCardPointerDrag({ disabled = false, targetSelector, onDrop, onTarget, ignoreSelector }) {
    const activeDrag = useRef(null), callbacks = useRef({});
    callbacks.current = { disabled, targetSelector, onDrop, onTarget, ignoreSelector };
    useEffect(() => () => {
      const drag = activeDrag.current;
      if (!drag) return;
      document.removeEventListener('pointermove', drag.move);
      document.removeEventListener('pointerup', drag.end);
      document.removeEventListener('pointercancel', drag.cancel);
      Object.assign(drag.node.style, drag.originalStyle);
      drag.node.removeAttribute('data-pointer-dragging');
    }, []);
    function begin(event, payload) {
      const config = callbacks.current;
      if (config.disabled || activeDrag.current || typeof document === 'undefined' || event.button !== 0 || event.target?.closest?.('audio,video,a') || (config.ignoreSelector && event.target?.closest?.(config.ignoreSelector))) return;
      const node = event.currentTarget, rect = node.getBoundingClientRect(), scaleX = node.offsetWidth ? rect.width / node.offsetWidth : 1, scaleY = node.offsetHeight ? rect.height / node.offsetHeight : 1;
      const drag = { node, payload, startX:event.clientX, startY:event.clientY, scaleX, scaleY, active:false, originalStyle:{position:node.style.position,zIndex:node.style.zIndex,pointerEvents:node.style.pointerEvents,transition:node.style.transition,left:node.style.left,top:node.style.top,cursor:node.style.cursor} };
      function targetAt(x, y) { return document.elementFromPoint(x,y)?.closest?.(callbacks.current.targetSelector) || null; }
      function restore() { Object.assign(node.style, drag.originalStyle); node.removeAttribute('data-pointer-dragging'); }
      function cleanup() {
        document.removeEventListener('pointermove', drag.move);
        document.removeEventListener('pointerup', drag.end);
        document.removeEventListener('pointercancel', drag.cancel);
        if (activeDrag.current === drag) activeDrag.current = null;
      }
      drag.move = moveEvent => {
        if (moveEvent.pointerId !== event.pointerId) return;
        const dx=moveEvent.clientX-drag.startX, dy=moveEvent.clientY-drag.startY;
        if (!drag.active && Math.hypot(dx,dy)<5) return;
        drag.active=true; moveEvent.preventDefault();
        node.setAttribute('data-pointer-dragging','true');
        Object.assign(node.style,{position:'relative',zIndex:'20',pointerEvents:'none',transition:'none',left:`${dx/scaleX}px`,top:`${dy/scaleY}px`,cursor:'grabbing'});
        callbacks.current.onTarget?.(targetAt(moveEvent.clientX,moveEvent.clientY));
      };
      drag.end = endEvent => {
        if (endEvent.pointerId !== event.pointerId) return;
        if (!drag.active) { cleanup(); return; }
        endEvent.preventDefault();
        const target=targetAt(endEvent.clientX,endEvent.clientY);
        cleanup(); restore(); callbacks.current.onTarget?.(null); callbacks.current.onDrop?.(payload,target);
      };
      drag.cancel = cancelEvent => {
        if (cancelEvent.pointerId !== event.pointerId) return;
        cleanup(); restore(); callbacks.current.onTarget?.(null);
      };
      activeDrag.current=drag;
      document.addEventListener('pointermove',drag.move,{passive:false});
      document.addEventListener('pointerup',drag.end);
      document.addEventListener('pointercancel',drag.cancel);
    }
    return begin;
  }
  function useGameTimeouts(active = true) {
    const state = useRef({ active, jobs: new Set() });
    function arm(job) {
      if (!state.current.active) return;
      job.started = Date.now();
      job.native = setTimeout(() => { state.current.jobs.delete(job); job.callback(); }, job.remaining);
    }
    function cancel(job) { if (!job) return; clearTimeout(job.native); state.current.jobs.delete(job); }
    useEffect(() => {
      const clock = state.current;
      if (clock.active === active) return;
      clock.active = active;
      for (const job of clock.jobs) {
        if (active) arm(job);
        else { clearTimeout(job.native); job.remaining = Math.max(0, job.remaining - (Date.now() - job.started)); }
      }
    }, [active]);
    useEffect(() => () => { for (const job of state.current.jobs) clearTimeout(job.native); state.current.jobs.clear(); }, []);
    return { schedule(callback, delay) { const job = { callback, remaining: delay, started: Date.now(), native: null }; state.current.jobs.add(job); arm(job); return job; }, cancel };
  }
  function useSession(onComplete, onProgress, total) {
    const records = useRef([]), ended = useRef(false);
    const [done, setDone] = useState(false);
    const summary = () => ({ correct: records.current.filter(r => r.correct).length, total: Math.max(total || 0, records.current.length), answers: records.current.slice() });
    useEffect(() => { if (onProgress) onProgress(summary()); }, []);
    function add(item, answer, correct) {
      if (ended.current) return;
      records.current.push({ ...(item.id ? { itemId: item.id } : {}), prompt: item.prompt, expected: item.answer, answer: String(answer), correct: !!correct });
      if (onProgress) onProgress(summary());
    }
    function finish(options = {}) { if (!ended.current) { ended.current = true; setDone(true); onComplete({ ...summary(), ...(options?.openReview ? { openReview: true } : {}) }); } }
    return { add, finish, done, records };
  }
  function Prompt({ item, mediaAfterText = false }) { return <div className="ig-learning-prompt">{!mediaAfterText && <Media media={item.media} />}<h2>{item.prompt}</h2>{mediaAfterText && <Media media={item.media} />}</div>; }
  function Feedback({ correct, reveal = true, onNext, last = false, label = last ? 'Finish' : 'Next' }) { return <div className={`ig-learning-feedback${reveal ? correct ? ' ig-correct' : ' ig-incorrect' : ''}`}><button type="button" className="ig-learning-primary ig-check-action" onClick={onNext}>{label}</button></div>; }
  function Empty() { return <p className="ig-learning-empty">Add some questions and answers to play this activity.</p>; }
  function answerChoices(item, items) {
    if (window.IGCore?.choices) return window.IGCore.choices(item, items);
    const candidates = [item.answer, ...(item.distractors || []), ...mix(items.filter(i => norm(i.answer) !== norm(item.answer)).map(i => i.answer))];
    const distinct = [...new Map(candidates.filter(Boolean).map(a => [norm(a), a])).values()];
    return mix(distinct.slice(0, 4));
  }
  function Quiz({ activity, options = {}, onComplete, onProgress, onQuestionChange, mode = 'quiz' }) {
    const items = useMemo(() => options.shuffle === false ? activity.items : mix(activity.items), [activity]);
    const [index, setIndex] = useState(0), [picked, setPicked] = useState(null), [lives, setLives] = useState(3), [bank, setBank] = useState(0), [selectedAnswers, setSelectedAnswers] = useState([]);
    const session = useSession(onComplete, onProgress, activity.items.length), item = items[index];
    const choices = useMemo(() => item ? answerChoices(item, items) : [], [item]);
    useEffect(() => { if (onProgress) onProgress({ correct: session.records.current.filter(r => r.correct).length, total: items.length, answers: session.records.current.slice(), current: index + 1 }); onQuestionChange?.(index + 1); }, [index]);
    const statement = useMemo(() => item ? (Math.random() < .5 ? item.answer : choices.find(c => !window.IGCore.isCorrectAnswer(item,c)) || item.answer) : '', [item]);
    if (!item) return <Empty />;
    const last = index === items.length - 1 || (mode === 'gameshow-quiz' && lives === 0);
    const reveal=options.feedback!=='end';
    const answers = mode === 'true-or-false' ? ['True', 'False'] : choices;
    const correctAnswers = item.correctAnswers?.length ? item.correctAnswers : [item.answer];
    const requireAll = mode !== 'true-or-false' && item.requireAll && correctAnswers.length > 1;
    const expected = mode === 'true-or-false' ? item.answer : correctAnswers.join(', ');
    const hasVisualPrompt = item.media && ['image', 'video'].includes(item.media.type);
    const sideLayout = hasVisualPrompt && answers.length <= 3 && mode !== 'true-or-false';
    const longestAnswer = Math.max(0, ...answers.map(answer => String(answer).length));
    const columns = sideLayout || longestAnswer > 90 ? 1 : answers.length === 3 ? (longestAnswer < 26 ? 3 : 1) : Math.min(2, answers.length);
    const promptSize = item.prompt.length > 180 ? 25 : item.prompt.length > 100 ? 29 : item.prompt.length > 50 ? 34 : sideLayout ? 56 : 42;
    const answerSize = longestAnswer > 90 ? 20 : longestAnswer > 45 ? 24 : longestAnswer > 16 ? 29 : 34;
    function record(value, correct) {
      setPicked({ value, correct });
      session.add({...item,prompt:mode === 'true-or-false' ? `${item.prompt}\n${statement}` : item.prompt,answer:mode === 'true-or-false' ? (window.IGCore.isCorrectAnswer(item,statement) ? 'True' : 'False') : expected},value,correct);
      if (mode === 'gameshow-quiz' && !correct) setLives(v => v - 1);
      setBank(n => n + (correct ? 100 : 0));
    }
    function choose(value) {
      if (picked !== null) return;
      if (requireAll) { setSelectedAnswers(values=>values.includes(value)?values.filter(v=>v!==value):[...values,value]); return; }
      const correct = mode === 'true-or-false' ? value === (window.IGCore.isCorrectAnswer(item,statement) ? 'True' : 'False') : correctAnswers.some(answer=>norm(value)===norm(answer));
      record(value,correct);
    }
    function checkAll() {
      if (picked || !selectedAnswers.length) return;
      const correct = selectedAnswers.length===correctAnswers.length && correctAnswers.every(answer=>selectedAnswers.some(value=>norm(value)===norm(answer)));
      record(selectedAnswers.join(', '),correct);
    }
    function next() { if (last) session.finish(); else { setIndex(i => i + 1); setPicked(null); setSelectedAnswers([]); } }
    if(mode==='quiz'&&!requireAll&&correctAnswers.length===1&&!hasVisualPrompt&&!item.answerOptionMedia?.some(Boolean)&&!items.some(row=>row.answerMedia)&&answers.length<=4){
      return <div className="ig-learning ig-cloze-player ig-definition-player ig-multiple-choice-player"><DefinitionQuestion text={item.prompt}/><div className="ig-cloze-bank ig-definition-choices">{answers.map((choice,n)=><button type="button" key={n} style={{'--ig-answer-colour':cardColours[n%cardColours.length]}} aria-pressed={picked?.value===choice} disabled={picked!==null} className={reveal&&picked?.value===choice?(picked.correct?'ig-correct':'ig-incorrect'):''} onClick={()=>choose(choice)}>{choice}{picked&&reveal&&picked.value===choice&&<FeedbackBadge className={`ig-choice-feedback-badge ig-feedback-icon ${picked.correct?'ig-feedback-tick':'ig-feedback-cross'}`} role="img" aria-label={picked.correct?'Correct':'Incorrect'}/>}</button>)}</div>{picked&&<Feedback reveal={reveal} correct={picked.correct} label={last?'Finish':'Next'} onNext={next}/>}</div>;
    }
    return <div className={`ig-learning ig-${mode} ig-quiz-player ${sideLayout ? 'ig-layout-side' : 'ig-layout-stacked'} ig-quiz-answers-${answers.length}`} style={{ '--ig-quiz-columns': columns, '--ig-quiz-prompt-size': `${promptSize}px`, '--ig-quiz-answer-size': `${answerSize}px` }} data-question-index={index + 1} data-question-total={items.length}>
      {mode === 'gameshow-quiz' && <div className="ig-game-bank">{mode === 'gameshow-quiz' && <span aria-label={`${lives} lives remaining`}>{Array.from({length:3},(_,i)=><svg key={i} aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" style={{display:'inline-block',verticalAlign:'middle',marginRight:3}}><path d="M12 21 3 12C-3 5 6-2 12 5c6-7 15 0 9 7Z" fill={i<lives?'currentColor':'none'} stroke="currentColor" strokeWidth="1.5"/></svg>)}</span>}<strong>{bank} points</strong></div>}
      <div className="ig-quiz-content">
        <div className="ig-quiz-question"><Prompt item={item} mediaAfterText />{mode === 'true-or-false' && <p className="ig-statement">{statement}</p>}</div>
        {mode==='true-or-false'&&picked&&reveal&&<FeedbackBadge className={`ig-truth-feedback-badge ig-feedback-icon ${picked.correct?'ig-feedback-tick':'ig-feedback-cross'}`} role="img" aria-label={picked.correct?'Correct':'Incorrect'}/>}
        <div className="ig-answer-grid">{answers.map((choice, n) => {
          const authoredIndex = item.answerOptions?.findIndex(answer=>norm(answer)===norm(choice));
          const answerMedia = mode === 'true-or-false' ? null : authoredIndex >= 0 ? item.answerOptionMedia?.[authoredIndex] : items.find(row => norm(row.answer) === norm(choice))?.answerMedia;
          const answerButton = <button type="button" key={n} disabled={picked !== null} aria-pressed={requireAll ? selectedAnswers.includes(choice) : undefined} className={mode==='true-or-false'?'':requireAll && selectedAnswers.includes(choice) ? picked && reveal ? picked.correct ? 'ig-correct' : 'ig-incorrect' : 'ig-answer-selected' : reveal && picked?.value === choice ? picked.correct ? 'ig-correct' : 'ig-incorrect' : ''} onClick={() => choose(choice)}>{answerMedia?.type === 'image' ? <Media media={answerMedia} /> : null}{sideLayout && <span className="ig-quiz-answer-letter" aria-hidden="true">{String.fromCharCode(65+n)}</span>}<span className="ig-quiz-answer-text">{choice}</span>{mode!=='true-or-false' && picked && reveal && (requireAll ? selectedAnswers.includes(choice) : picked.value === choice) && <span className={`ig-quiz-feedback-icon ${requireAll ? correctAnswers.some(answer=>norm(answer)===norm(choice)) ? 'is-correct' : 'is-incorrect' : picked.correct ? 'is-correct' : 'is-incorrect'}`} aria-hidden="true"/>}</button>;
          return answerMedia && ['audio','video'].includes(answerMedia.type) ? <div key={n} className={`ig-quiz-answer-with-media ${answerButton.props.className}`}><div className="ig-quiz-answer-media" onClick={event=>event.stopPropagation()} onPointerDown={event=>event.stopPropagation()}><Media media={answerMedia}/></div>{answerButton}</div> : answerButton;
        })}</div>
      </div>
      {requireAll && !picked && <div className="ig-quiz-check"><span>Select all correct answers</span><button className="ig-check-action" onClick={checkAll} disabled={!selectedAnswers.length}>Submit</button></div>}
      {picked && <Feedback reveal={reveal} correct={picked.correct} expected={expected} last={last} onNext={next} />}
    </div>;
  }
  function MatchAnswerText({text,maxLines,baseSize=20}) {
    const content=useRef(null);
    useLayoutEffect(()=>{
      const tile=content.current?.parentElement;
      if(!tile)return;
      const fit=()=>{
        if(!content.current)return;
        const style=getComputedStyle(tile);
        const height=tile.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);
        let size=baseSize;
        content.current.style.fontSize=`${size}px`;
        while(size>1&&(content.current.scrollHeight>Math.min(height,maxLines?size*1.15*maxLines+1:height)||content.current.scrollWidth>content.current.clientWidth))content.current.style.fontSize=`${--size}px`;
      };
      fit();
      const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(fit):null;
      observer?.observe(tile);
      return ()=>observer?.disconnect();
    },[text,maxLines,baseSize]);
    return <span ref={content} className="ig-match-answer-text" style={maxLines?{whiteSpace:maxLines===1?'nowrap':'normal',overflowWrap:'normal',wordBreak:'normal',width:'100%'}:undefined}>{text}</span>;
  }
  function MatchPrompt({text}) {
    const box=useRef(null),content=useRef(null);
    useLayoutEffect(()=>{
      const fit=()=>{
        if(!box.current||!content.current)return;
        let size=16;
        content.current.style.fontSize=`${size}px`;
        while(size>1&&(content.current.scrollHeight>box.current.clientHeight||content.current.scrollWidth>content.current.clientWidth))content.current.style.fontSize=`${--size}px`;
      };
      fit();
      const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(fit):null;
      if(box.current)observer?.observe(box.current);
      return ()=>observer?.disconnect();
    },[text]);
    return <span ref={box} className="ig-match-prompt"><span ref={content}>{text}</span></span>;
  }
  function Match({ activity, options = {}, onComplete, onProgress, onPageChange, onSubmitAnswers, mode = 'match-up', page = 0 }) {
    const clock = useGameTimeouts(options.active !== false);
    const items = activity.items, right = useMemo(() => mix(items.map((item, index) => ({ item, index }))), [activity]);
    const answerColours = useMemo(() => Object.fromEntries(right.map(({ index }, position) => [index, cardColours[position % cardColours.length]])), [right]);
    const answerFontSizes = useMemo(() => Object.fromEntries(right.map(({ item, index }) => [index, matchAnswerFontSize(item.answer)])), [right]);
    const pageStart = mode === 'match-up' && items.length > 12 ? page * 12 : 0;
    const visibleIndices = mode === 'match-up' && items.length > 12 ? items.map((_, index) => index).slice(pageStart, pageStart + 12) : items.map((_, index) => index);
    useEffect(() => { setLeft(null); setDropTarget(null); }, [page]);
    const [left, setLeft] = useState(null), [placed, setPlaced] = useState({}), [submitted, setSubmitted] = useState(false), [revealedCount, setRevealedCount] = useState(0), [dropTarget, setDropTarget] = useState(null), [matchedFind, setMatchedFind] = useState([]), [attemptedFind, setAttemptedFind] = useState([]);
    const session = useSession(onComplete, onProgress, activity.items.length);
    const revealTimer = useRef(null), drag = useRef(null), suppressClick = useRef(0), poolNodes = useRef({}), placedNodes = useRef({}), previousPool = useRef(null), previousPlaced = useRef(null);
    const [nestingAnswer, setNestingAnswer] = useState(null), [pickupTarget, setPickupTarget] = useState(null);
    useLayoutEffect(() => {
      animateCardPositions(previousPool.current, poolNodes.current, 300);
      animateCardPositions(previousPlaced.current, placedNodes.current, 380);
      previousPool.current = previousPlaced.current = null;
    }, [placed]);
    function capturePositions() {
      previousPool.current = captureCardPositions(poolNodes.current);
      previousPlaced.current = captureCardPositions(placedNodes.current);
    }
    function nestAnswer(answer) {
      setNestingAnswer(answer);
    }
    const marks = useMemo(() => items.map((item, index) => { const answerIndex = placed[index]; const correct = answerIndex !== undefined && (item.answer || items[answerIndex].answer ? norm(item.answer) === norm(items[answerIndex].answer) : !!item.answerMedia && item.answerMedia.src === items[answerIndex].answerMedia?.src); return { answerIndex, correct }; }), [items, placed]);
    const current = items.findIndex((_, index) => !matchedFind.includes(index));
    useEffect(() => () => { clock.cancel(revealTimer.current); const active = drag.current; active?.cleanup?.(); active?.restore?.(); }, []);
    function matchTargetAtRect(rect) {
      const root = drag.current?.node.closest('.ig-learning');
      let best = null, bestArea = 0;
      for (const target of root?.querySelectorAll('[data-match-target]') || []) {
        if (target === drag.current?.node) continue;
        const bounds = target.getBoundingClientRect();
        const area = Math.max(0, Math.min(rect.right, bounds.right) - Math.max(rect.left, bounds.left)) * Math.max(0, Math.min(rect.bottom, bounds.bottom) - Math.max(rect.top, bounds.top));
        if (area > bestArea) { bestArea = area; best = Number(target.dataset.matchTarget); }
      }
      return best;
    }
    function matchRectOverlaps(rect, node) {
      if (!node) return false;
      const bounds = node.getBoundingClientRect();
      return Math.min(rect.right, bounds.right) > Math.max(rect.left, bounds.left) && Math.min(rect.bottom, bounds.bottom) > Math.max(rect.top, bounds.top);
    }
    function setAssignment(target, answer) {
      if (submitted || target < 0 || target >= items.length || answer < 0 || answer >= items.length) return;
      capturePositions(); nestAnswer(answer);
      setPlaced(previous => { const next = { ...previous }; const existingTarget = Object.keys(next).find(key => next[key] === answer); if (existingTarget !== undefined) delete next[existingTarget]; if (next[target] !== undefined && next[target] !== answer) { const displaced = next[target]; if (existingTarget !== undefined) next[existingTarget] = displaced; } next[target] = answer; return next; });
      setLeft(null); setDropTarget(null);
    }
    function removeAssignment(target) { if (!submitted) { capturePositions(); setPlaced(previous => { const next = { ...previous }; delete next[target]; return next; }); setLeft(null); } }
    function beginDrag(event, answer) {
      if (submitted || drag.current || event.target?.closest?.('audio,video,a')) return;
      const inputType = event.type === 'mousedown' ? 'mouse' : event.type === 'touchstart' ? 'touch' : 'pointer';
      const touch = inputType === 'touch' ? Array.from(event.changedTouches || event.touches || [])[0] : null;
      const pointerId = inputType === 'touch' ? touch?.identifier : event.pointerId;
      if ((inputType !== 'touch' && event.button !== 0) || (inputType === 'touch' && !touch)) return;
      const node = event.currentTarget, root = node.closest('.ig-learning'), rect = node.getBoundingClientRect();
      const startX = touch ? touch.clientX : event.clientX, startY = touch ? touch.clientY : event.clientY;
      const original = { position: node.style.position, zIndex: node.style.zIndex, pointerEvents: node.style.pointerEvents, transition: node.style.transition, left: node.style.left, top: node.style.top };
      const point = e => inputType === 'touch' ? Array.from(e.changedTouches || e.touches || []).find(value => value.identifier === pointerId) : e;
      const matches = e => inputType !== 'pointer' || e.pointerId === pointerId || (event.pointerType === 'mouse' && (e.type === 'mousemove' || e.type === 'mouseup'));
      let active = false;
      const restore = () => { Object.assign(node.style, Object.fromEntries(Object.entries(original).map(([property, value]) => [property, value || '']))); node.removeAttribute('data-pointer-dragging'); setPickupTarget(null); };
      const moveType = inputType === 'touch' ? 'touchmove' : inputType === 'mouse' ? 'mousemove' : 'pointermove';
      const endType = inputType === 'touch' ? 'touchend' : inputType === 'mouse' ? 'mouseup' : 'pointerup';
      const cancelType = inputType === 'touch' ? 'touchcancel' : 'pointercancel';
      const cleanup = () => {
        document.removeEventListener(moveType, move); document.removeEventListener(endType, end); document.removeEventListener(cancelType, cancel);
        if (inputType === 'pointer' && event.pointerType === 'mouse') { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', end); }
        if (drag.current?.cleanup === cleanup) drag.current = null;
      };
      const move = e => {
        if (!matches(e)) return;
        const current = point(e); if (!current) return;
        const dx = current.clientX - startX, dy = current.clientY - startY;
        if (!active && Math.hypot(dx, dy) < 5) return;
        if (!active) { active = true; if (node.dataset.matchTarget !== undefined) setPickupTarget(Number(node.dataset.matchTarget)); }
        e.preventDefault(); node.setAttribute('data-pointer-dragging', 'true');
        Object.assign(node.style, { position: 'relative', zIndex: '20', pointerEvents: 'none', transition: 'none', left: `${dx / (node.offsetWidth ? rect.width / node.offsetWidth : 1)}px`, top: `${dy / (node.offsetHeight ? rect.height / node.offsetHeight : 1)}px` });
        const moved = node.getBoundingClientRect(), target = matchTargetAtRect(moved), bank = matchRectOverlaps(moved, root.querySelector('.ig-match-bank'));
        setDropTarget(target !== null ? target : bank ? 'bank' : null);
      };
      const end = e => {
        if (!matches(e)) return;
        if (!active) { cleanup(); return; }
        e.preventDefault(); move(e); suppressClick.current = Date.now() + 200;
        const moved = node.getBoundingClientRect(), target = matchTargetAtRect(moved), bank = matchRectOverlaps(moved, root.querySelector('.ig-match-bank'));
        cleanup(); setDropTarget(null);
        if (target !== null) { restore(); setAssignment(target, answer); }
        else if (bank) {
          restore(); const existingTarget = Object.keys(placed).find(key => placed[key] === answer);
          if (existingTarget !== undefined) removeAssignment(Number(existingTarget));
        } else returnDraggedCard(node, restore);
      };
      const cancel = () => { cleanup(); setDropTarget(null); returnDraggedCard(node, restore); };
      drag.current = { cleanup, restore, node };
      try { if (inputType === 'pointer') node.setPointerCapture?.(pointerId); } catch (_) { /* Document listeners retain the drag stream. */ }
      document.addEventListener(moveType, move, { passive: false }); document.addEventListener(endType, end); document.addEventListener(cancelType, cancel);
      if (inputType === 'pointer' && event.pointerType === 'mouse') { document.addEventListener('mousemove', move, { passive: false }); document.addEventListener('mouseup', end); }
    }
    function submit() { if (submitted || Object.keys(placed).length !== items.length) return; onSubmitAnswers?.(); setSubmitted(true); setLeft(null); if(mode==='match-up')onPageChange?.(0); function revealNext(index) { revealTimer.current = clock.schedule(() => { if(mode==='match-up')onPageChange?.(Math.floor(index/12)); const answerIndex = placed[index], correct = marks[index].correct; session.add(items[index], items[answerIndex].answer, correct); setRevealedCount(index + 1); if (index + 1 < items.length) revealNext(index + 1); else revealTimer.current = clock.schedule(() => session.finish(), 900); }, 600); } revealNext(0); }
    function findAnswer(answerIndex) { if (current < 0 || matchedFind.includes(current)) return; const correct = marksFor(current, answerIndex); if (!attemptedFind.includes(current)) { session.add(items[current], items[answerIndex].answer, correct); setAttemptedFind(values => [...values, current]); } if (correct) setMatchedFind(values => [...values, current]); }
    function marksFor(target, answer) { return items[target].answer || items[answer].answer ? norm(items[target].answer) === norm(items[answer].answer) : !!items[target].answerMedia && items[target].answerMedia.src === items[answer].answerMedia?.src; }
    const allPlaced = Object.keys(placed).length === items.length;
    if (!items.length) return <Empty />;
    return <div className="ig-learning">
      {mode === 'find-the-match' ? current >= 0 && <><Prompt item={items[current]} /><div className="ig-find-match"><div>{right.map(({ item, index }) => <button type="button" key={index} disabled={matchedFind.includes(index)} onClick={() => findAnswer(index)}><Media media={item.answerMedia} />{item.answer}{matchedFind.includes(index) ? <span className="ig-feedback-icon ig-feedback-tick" role="img" aria-label="Correct"/> : null}</button>)}</div></div></> : <><div className={`ig-match-bank ig-sort-pool${dropTarget === 'bank' ? ' is-drop-target' : ''}`} aria-label="Answers">{right.filter(({ index }) => visibleIndices.includes(index)).map(({ item, index }) => !Object.values(placed).includes(index) && <button type="button" key={index} ref={node => { if (node) poolNodes.current[index] = node; else delete poolNodes.current[index]; }} style={{ '--ig-answer-colour': answerColours[index], '--ig-match-font-size': answerFontSizes[index] }} aria-pressed={left === index} draggable={false} onPointerDown={e => beginDrag(e, index)} onMouseDown={e => beginDrag(e, index)} onTouchStart={e => beginDrag(e, index)} onDragStart={e => e.preventDefault()} onClick={() => { if (Date.now() < suppressClick.current) return; setLeft(index); }}><Media media={item.answerMedia} /><MatchAnswerText text={item.answer}/></button>)}</div><div className="ig-match-targets">{visibleIndices.map(index => { const item = items[index], answerIndex = placed[index], revealed = submitted && index < revealedCount, correct = marks[index].correct; return <div className={`ig-match-target${dropTarget === index ? ' is-drop-target' : ''}${pickupTarget === index ? ' is-pickup' : ''}`} key={index}><MatchPrompt text={item.prompt}/><button type="button" onAnimationEnd={() => setNestingAnswer(null)} ref={node => { if (answerIndex !== undefined) { if (node) placedNodes.current[answerIndex] = node; else delete placedNodes.current[answerIndex]; } }} data-match-target={index} style={answerIndex !== undefined ? { '--ig-answer-colour': answerColours[answerIndex], '--ig-match-font-size': answerFontSizes[answerIndex] } : undefined} aria-label={`Answer for ${item.prompt}`} aria-pressed={left !== null} disabled={submitted} onPointerDown={answerIndex !== undefined ? e => beginDrag(e, answerIndex) : undefined} onMouseDown={answerIndex !== undefined ? e => beginDrag(e, answerIndex) : undefined} onTouchStart={answerIndex !== undefined ? e => beginDrag(e, answerIndex) : undefined} onDragStart={e => e.preventDefault()} onClick={() => { if (Date.now() < suppressClick.current) return; if (left !== null) setAssignment(index, left); else if (answerIndex !== undefined) removeAssignment(index); }} className={`${answerIndex !== undefined ? revealed ? correct ? 'ig-correct' : 'ig-incorrect' : 'ig-match-filled' : ''}${left !== null ? ' is-available-target' : ''}${nestingAnswer === answerIndex && !submitted ? ' is-nesting' : ''}`}>{answerIndex !== undefined ? <><Media media={items[answerIndex].answerMedia} /><MatchAnswerText text={items[answerIndex].answer}/>{revealed && <span className={`ig-sort-feedback-marker ${correct ? 'is-correct' : 'is-incorrect'}`} aria-hidden="true"/>}</> : null}</button></div>; })}</div><button type="button" className="ig-learning-primary ig-check-action" disabled={submitted || !allPlaced} onClick={submit}>Submit</button></>}
      {mode === 'find-the-match' && matchedFind.length === items.length && <button type="button" className="ig-learning-primary" onClick={session.finish}>Finish</button>}
    </div>;
  }
  function Connection({ activity, options = {}, onComplete, onProgress, onFeedbackReveal, onLivesChange, onInteractionStart, onSubmitAnswers, onNoticeChange }) {
    const clock = useGameTimeouts(options.active !== false);
    const items = activity.items;
    // Sentence case keeps musical note names and proper names intact.
    const tileText = value => { const text = String(value || ''); return text.charAt(0).toLocaleUpperCase('en-GB') + text.slice(1); };
    const groupKey = item => norm(item.group);
    const groups = useMemo(() => [...new Set(items.map(groupKey))], [activity]);
    const [order, setOrder] = useState(() => mix(items.map((_, index) => index)));
    const [selected, setSelected] = useState([]), [playedSolved, setSolved] = useState([]), [revealing, setRevealing] = useState(null), [mistake, setMistake] = useState([]), [notice, setNotice] = useState('');
    const [reviewSolved,setReviewSolved]=useState([]);
    useEffect(()=>{onNoticeChange?.(notice);},[notice,onNoticeChange]);
    const reviewing=!!options.reviewing;
    const solved=reviewing?reviewSolved:playedSolved;
    useEffect(()=>{
      if(!reviewing)return;
      setReviewSolved([]);
      setSelected([]);
      setMistake([]);
      setNotice('');
      setRevealing(null);
      let count=0,handle;
      const revealRow=()=>{
        setReviewSolved(groups.slice(0,++count));
        if(count<groups.length)handle=setTimeout(revealRow,1100);
      };
      handle=setTimeout(revealRow,250);
      return ()=>clearTimeout(handle);
    },[reviewing,groups]);
    const attempts = useRef(0), lives = useRef(4), timer = useRef(null), noticeTimer = useRef(null), finishing = useRef(false);
    const session = useSession(result => onComplete({...result, attempts:attempts.current}), onProgress, 4);
    useEffect(() => () => { clock.cancel(timer.current); clock.cancel(noticeTimer.current); }, []);
    const valid = items.length === 16 && groups.length === 4 && groups.every(group => group && items.filter(item => groupKey(item) === group).length === 4);
    if (!valid) return <p className="ig-learning-empty">Connection needs four groups of four cards. Edit this activity to set up its groups.</p>;
    function select(index) {
      if (reviewing || finishing.current || mistake.length || solved.includes(groupKey(items[index]))) return;
      onInteractionStart?.();
      setSelected(values => values.includes(index) ? values.filter(value => value !== index) : values.length < 4 ? [...values,index] : values);
      setNotice('');
    }
    function check() {
      if (selected.length !== 4 || finishing.current || mistake.length) return;
      finishing.current = true;
      attempts.current++;
      const group = groupKey(items[selected[0]]), correct = selected.every(index => groupKey(items[index]) === group);
      if (!correct) {
        const counts = groups.map(group => selected.filter(index=>groupKey(items[index])===group).length);
        const oneAway = counts.includes(3);
        const failedCards = selected.slice();
        const remainingLives = Math.max(0, lives.current - 1);
        lives.current = remainingLives;
        if(remainingLives===0)onSubmitAnswers?.();
        onLivesChange?.(remainingLives);
        setMistake(failedCards);
        setNotice(oneAway ? 'One away...' : '');
        clock.cancel(noticeTimer.current);
        if (oneAway) noticeTimer.current = clock.schedule(() => setNotice(''),2000);
        clock.cancel(timer.current);
        timer.current = clock.schedule(() => {
          setMistake([]);
          if (remainingLives === 0) { session.finish(); }
          else finishing.current = false;
        }, 1200);
        onFeedbackReveal?.(false);
        return;
      }
      if(solved.length===3)onSubmitAnswers?.();
      clock.cancel(noticeTimer.current);
      const revealOrder = selected.slice().sort((a,b) => order.indexOf(a) - order.indexOf(b));
      finishing.current = true;
      setRevealing({ group, indices: revealOrder, count: 0 }); setSelected([]); setNotice('');
      onFeedbackReveal?.(true);
      session.add({prompt:items[selected[0]].group,answer:items.filter(item=>groupKey(item)===group).map(item=>item.prompt || item.media?.name || 'Media').join(', ')},selected.map(index=>items[index].prompt || items[index].media?.name || 'Media').join(', '),true);
      let revealed = 0;
      const revealNextCard = () => {
        revealed++;
        if (revealed < revealOrder.length) {
          setRevealing({ group, indices: revealOrder, count: revealed });
          timer.current = clock.schedule(revealNextCard, 260);
          return;
        }
        setRevealing({ group, indices: revealOrder, count: revealOrder.length });
        timer.current = clock.schedule(() => {
          setSolved(current => [...current, group]);
          setRevealing(null);
          if (solved.length === 3) timer.current = clock.schedule(() => session.finish(), 900);
          else finishing.current = false;
        }, 760);
      };
      timer.current = clock.schedule(revealNextCard, 120);
    }
    return <div className="ig-learning ig-connection-player">
      {notice && !onNoticeChange && <p className="ig-connection-notice ig-player-pill" role="status" aria-live="polite">{notice}</p>}
      <div className="ig-connection-board">
      {[...solved, ...(revealing && !solved.includes(revealing.group) ? [revealing.group] : [])].map(group=>{
        const groupItems=items.map((item,index)=>({item,index})).filter(entry=>groupKey(entry.item)===group);
        const isRevealing=revealing?.group===group, count=isRevealing?revealing.count:4, visibleIndices=new Set(isRevealing?revealing.indices.slice(0,count):groupItems.map(entry=>entry.index)), arrivingIndex=isRevealing?revealing.indices[count-1]:-1;
        return <section className={`ig-connection-solved${isRevealing?' is-revealing':''}`} key={group}><h3 className={isRevealing&&count===4?'is-word-revealing':''} aria-live={isRevealing&&count===4?'polite':undefined}>{tileText(items.find(item=>groupKey(item)===group).group)}</h3><div>{groupItems.map(({item,index})=>visibleIndices.has(index)?<span key={index} className={isRevealing&&index===arrivingIndex?'is-card-arriving':''}><Media media={item.media}/>{tileText(item.prompt)}</span>:<span key={index} className="is-card-pending" aria-hidden="true"/>)}</div></section>;
      })}
      <div className="ig-connection-grid">{order.filter(index=>!solved.includes(groupKey(items[index])) && revealing?.group!==groupKey(items[index])).map(index=><button type="button" key={index} className={mistake.includes(index)?'is-incorrect':''} aria-pressed={selected.includes(index)} disabled={reviewing || finishing.current || mistake.length>0 || (selected.length===4&&!selected.includes(index))} onClick={event=>{if(!event?.target?.closest?.('audio,video,a'))select(index);}}><Media media={items[index].media}/><span>{tileText(items[index].prompt)}</span>{mistake.includes(index)&&<FeedbackBadge className="ig-connection-feedback-badge ig-feedback-icon ig-feedback-cross" role="img" aria-label="Incorrect"/>}</button>)}</div>
      </div>
      {!reviewing && <button type="button" className="ig-learning-primary ig-check-action" disabled={selected.length!==4 || mistake.length>0 || finishing.current} onClick={check}>Submit</button>}
    </div>;
  }
  function PairOrNot({ activity, onComplete, onProgress }) {
    const rounds = useMemo(() => mix(activity.items.map((item, i) => ({ item, other: Math.random() < .5 ? item : activity.items[(i + 1) % activity.items.length] }))), [activity]);
    const [index, setIndex] = useState(0), [result, setResult] = useState(null); const session = useSession(onComplete, onProgress, activity.items.length), round = rounds[index];
    if (!round) return <Empty />;
    function answer(pair) { const ok = pair === (norm(round.item.answer) === norm(round.other.answer)); session.add(round.item, `${round.other.answer}: ${pair ? 'Pair' : 'No pair'}`, ok); setResult(ok); }
    return <div className="ig-learning"><div className="ig-pair-display"><div><Media media={round.item.media} />{round.item.prompt}</div><div><Media media={round.other.answerMedia} />{round.other.answer}</div></div><div className="ig-answer-grid">{[true, false].map(v => <button type="button" key={String(v)} disabled={result !== null} onClick={() => answer(v)}>{v ? 'Pair' : 'No pair'}</button>)}</div>{result !== null && <Feedback correct={result} expected={round.item.answer} last={index === rounds.length - 1} onNext={() => { if (index === rounds.length - 1) session.finish(); else { setIndex(n => n + 1); setResult(null); } }} />}</div>;
  }
  function SortLabel({children, compact}) {
    const label = useRef(null);
    useLayoutEffect(() => {
      const node = label.current;
      if (!node) return;
      const fit = () => {
        const card = node.parentElement;
        if (card.closest('.ig-facts-sort-layout')) { node.style.fontSize='16px'; return; }
        if (card.classList.contains('ig-sort-photo-card')) { node.style.removeProperty('font-size'); return; }
        const style = getComputedStyle(card);
        const innerHeight = card.clientHeight - parseFloat(style.paddingTop || 0) - parseFloat(style.paddingBottom || 0);
        const hasPhoto = !!card.querySelector('.ig-media-image');
        const height = Math.max(1, hasPhoto && !card.classList.contains('ig-sort-photo-card') ? (innerHeight - 6) / 2 : innerHeight);
        const available = node.clientWidth;
        if (!available) return;
        let size = compact ? 18 : 22;
        node.style.fontSize = `${size}px`;
        // Wrap whole words first, then fit both the longest word and total lines.
        while (size > 1 && (node.scrollWidth > available + 1 || node.scrollHeight > height + 1)) {
          size -= .5;
          node.style.fontSize = `${size}px`;
        }
      };
      fit();
      const observer = new ResizeObserver(fit);
      observer.observe(node);
      observer.observe(node.parentElement);
      return () => observer.disconnect();
    }, [children, compact]);
    return <span className="ig-sort-label" ref={label}>{String(children || '').split(/\s+/).map((word,index)=><React.Fragment key={index}>{index>0?' ':''}<span className="ig-sort-word">{word}</span></React.Fragment>)}</span>;
  }
  function Sort({ activity, options = {}, onComplete, onProgress, onFeedbackReveal, onSubmitAnswers, mode = 'group-sort' }) {
    const clock = useGameTimeouts(options.active !== false);
    const items = useMemo(() => mix(activity.items), [activity]), groups = activity.sortRecipe?.groups || [...new Set(activity.items.map(i => i.group || i.answer))];
    const styleSort = activity.sortRecipe?.type === 'styles';
    const excerptPlayer = useRef(null);
    const [playingExcerpt, setPlayingExcerpt] = useState(null), [excerptError, setExcerptError] = useState('');
    const [selected, setSelected] = useState(null), [placed, setPlaced] = useState({}), [placementSlots, setPlacementSlots] = useState({}), [submitted, setSubmitted] = useState(false), [revealedCount, setRevealedCount] = useState(0), [dropTarget, setDropTarget] = useState(null), [nestingIndex, setNestingIndex] = useState(null), [pickupPlaceholder, setPickupPlaceholder] = useState(null);
    const groupLimits = useMemo(() => {
      const largestGroup = Math.max(0, ...groups.map(group => activity.items.filter(item => (item.group || item.answer) === group).length));
      const capacity=Math.min(activity.sortRecipe?.type==='facts'?activity.items.length:window.IGCore.LIMITS.sortGroupItems,Math.max(4,Math.ceil(largestGroup/4)*4,...groups.map(group=>Object.values(placed).filter(g=>g===group).length+1)));
      return Object.fromEntries(groups.map(group => [group, capacity]));
    }, [activity,placed]);
    const session = useSession(onComplete, onProgress, activity.items.length), revealTimer = useRef(null), nestingTimer = useRef(null), cardNodes = useRef({}), poolCardNodes = useRef({}), pendingPoolRects = useRef(null), pendingSwapRects = useRef(null), groupContainer = useRef(null), poolContainer = useRef(null), dragGeometry = useRef(null), draggedIndex = useRef(null), pointerDrag = useRef(null), suppressClickUntil = useRef(0);
    const revealCancelled=useRef(false);
    const marks = useMemo(() => window.IGCore.gradeSort(items, placed), [items, placed]);
    useEffect(() => {
      const player = excerptPlayer.current;
      return () => player?.pause();
    }, []);
    useEffect(() => {
      if (options.active === false && !options.reviewing) excerptPlayer.current?.pause();
    }, [options.active, options.reviewing]);
    useEffect(() => () => {
      revealCancelled.current=true;
      clock.cancel(revealTimer.current); clock.cancel(nestingTimer.current);
      const drag = pointerDrag.current;
      drag?.detach?.();
      restorePointerCard(drag);
    }, []);
    useLayoutEffect(() => {
      animateCardPositions(pendingPoolRects.current, poolCardNodes.current, 300);
      animateCardPositions(pendingSwapRects.current, cardNodes.current, 380);
      pendingPoolRects.current = pendingSwapRects.current = null;
    }, [placed, placementSlots]);
    function restorePointerCard(drag) {
      if (!drag?.node) return;
      drag.preview?.remove();
      Object.assign(drag.node.style, Object.fromEntries(Object.entries(drag.originalStyle).map(([property, value]) => [property, value || ''])));
      drag.node.removeAttribute('data-pointer-dragging');
    }
    function capturePoolPositions() {
      pendingPoolRects.current = new Map(Object.entries(poolCardNodes.current).map(([index, node]) => [Number(index), node?.getBoundingClientRect()]).filter(([, rect]) => !!rect));
    }
    function beginPointerDrag(event, index) {
      if (submitted || pointerDrag.current || typeof document === 'undefined' || event.target?.closest?.('audio,video,a')) return;
      const inputType = event.type === 'mousedown' ? 'mouse' : event.type === 'touchstart' ? 'touch' : 'pointer';
      const startTouch = inputType === 'touch' ? Array.from(event.changedTouches || event.touches || [])[0] : null;
      const pointerId = inputType === 'pointer' ? event.pointerId : inputType === 'touch' ? startTouch?.identifier : 'mouse';
      if ((inputType === 'mouse' && event.button !== 0) || (inputType === 'pointer' && event.pointerType === 'mouse' && event.button !== 0) || (inputType === 'touch' && !startTouch)) return;
      // Capturing the pointer keeps the original card's drag stream alive after
      // the pointer leaves its bounds or passes over another card.
      const node = event.currentTarget, rect = node.getBoundingClientRect();
      const drag = {
        node, index, inputType, pointerId, pointerType: event.pointerType,
        startX: inputType === 'touch' ? startTouch.clientX : event.clientX,
        startY: inputType === 'touch' ? startTouch.clientY : event.clientY,
        rect, active: false, scaleX: node.offsetWidth ? rect.width / node.offsetWidth : 1, scaleY: node.offsetHeight ? rect.height / node.offsetHeight : 1, originalStyle: {
          position: node.style.position, zIndex: node.style.zIndex, pointerEvents: node.style.pointerEvents, opacity: node.style.opacity,
          transition: node.style.transition, left: node.style.left, top: node.style.top, cursor: node.style.cursor,
        }, handlers: null,
      };
      function pointFor(inputEvent) {
        if (inputType === 'touch') {
          const touch = Array.from(inputEvent.changedTouches || inputEvent.touches || []).find(candidate => candidate.identifier === pointerId);
          return touch ? { x: touch.clientX, y: touch.clientY } : null;
        }
        return Number.isFinite(inputEvent.clientX) && Number.isFinite(inputEvent.clientY) ? { x: inputEvent.clientX, y: inputEvent.clientY } : null;
      }
      function matchesInput(inputEvent) {
        if (inputType === 'pointer') return inputEvent.pointerId === pointerId || (drag.pointerType === 'mouse' && (inputEvent.type === 'mousemove' || inputEvent.type === 'mouseup'));
        if (inputType === 'mouse') return inputEvent.type === 'mousemove' || inputEvent.type === 'mouseup';
        return !!pointFor(inputEvent) || inputEvent.type === 'touchcancel';
      }
      function detach() {
        const [moveType, endType, cancelType] = inputType === 'pointer' ? ['pointermove', 'pointerup', 'pointercancel'] : inputType === 'mouse' ? ['mousemove', 'mouseup', null] : ['touchmove', 'touchend', 'touchcancel'];
        document.removeEventListener(moveType, drag.handlers.move);
        document.removeEventListener(endType, drag.handlers.end);
        if (cancelType) document.removeEventListener(cancelType, drag.handlers.cancel);
        if (inputType === 'pointer' && drag.pointerType === 'mouse') {
          document.removeEventListener('mousemove', drag.handlers.move);
          document.removeEventListener('mouseup', drag.handlers.end);
        }
        if (pointerDrag.current === drag) pointerDrag.current = null;
      }
      function move(moveEvent) {
        if (!matchesInput(moveEvent)) return;
        const point = pointFor(moveEvent);
        if (!point) return;
        const dx = point.x - drag.startX, dy = point.y - drag.startY;
        if (!drag.active && Math.hypot(dx, dy) < 5) return;
        if (!drag.active) {
          drag.active = true;
          draggedIndex.current = index;
          drag.node.setAttribute('data-pointer-dragging', 'true');
          drag.preview = createSortDragPreview(drag.node);
          if (drag.node.dataset?.sortType === 'card') {
            const slots = drag.node.closest('.ig-sort-slots'), bounds = slots?.getBoundingClientRect(), scaleX = slots?.offsetWidth ? bounds.width / slots.offsetWidth : 1, scaleY = slots?.offsetHeight ? bounds.height / slots.offsetHeight : 1;
            if (bounds) setPickupPlaceholder({ group: drag.node.dataset.sortGroup, left: (drag.rect.left - bounds.left) / (scaleX || 1), top: (drag.rect.top - bounds.top) / (scaleY || 1), width: drag.rect.width / (scaleX || 1), height: drag.rect.height / (scaleY || 1) });
          }
        }
        moveEvent.preventDefault();
        // Shared button transforms use !important for hover/press effects.
        // Relative offsets move the real card independently of those transforms,
        // while retaining its original grid cell and accounting for canvas scale.
        Object.assign(drag.node.style, { position: 'relative', zIndex: '20', pointerEvents: 'none', opacity:'0', transition: 'none', left: `${dx / drag.scaleX}px`, top: `${dy / drag.scaleY}px`, cursor: 'grabbing' });
        const visualRect = drag.node.getBoundingClientRect();
        Object.assign(drag.preview.style, {left:`${visualRect.left}px`,top:`${visualRect.top}px`});
        const overlap = overlapDropTarget(moveEvent);
        setDropTarget(overlap?.highlight || (rectanglesOverlap(drag.node.getBoundingClientRect(), poolContainer.current?.getBoundingClientRect()) ? 'pool' : null));
      }
      function finish(endEvent, cancelled = false) {
        if (!matchesInput(endEvent)) return;
        if (!drag.active) { detach(); return; }
        endEvent.preventDefault?.();
        if (!cancelled) move(endEvent);
        suppressClickUntil.current = Date.now() + 200;
        const currentRect = drag.node.getBoundingClientRect();
        const overlap = cancelled ? null : overlapDropTarget(endEvent);
        const overPool = !cancelled && rectanglesOverlap(currentRect, poolContainer.current?.getBoundingClientRect());
        detach();
        draggedIndex.current = null;
        dragGeometry.current = null;
        setDropTarget(null);
        if (overlap) {
          setPickupPlaceholder(null);
          restorePointerCard(drag);
          commitDrop(index, overlap.target, overlap.insertion);
        } else if (overPool && placed[index] !== undefined) {
          setPickupPlaceholder(null);
          restorePointerCard(drag);
          commitDrop(index, 'pool');
        } else {
          bounceBack(drag, () => setPickupPlaceholder(null));
        }
      }
      drag.handlers = { move, end: event => finish(event), cancel: event => finish(event, true) };
      drag.detach = detach;
      pointerDrag.current = drag;
      if (inputType === 'pointer' && Number.isFinite(pointerId)) {
        try { node.setPointerCapture?.(pointerId); } catch (_) { /* document listeners remain as a fallback */ }
      }
      const [moveType, endType, cancelType] = inputType === 'pointer' ? ['pointermove', 'pointerup', 'pointercancel'] : inputType === 'mouse' ? ['mousemove', 'mouseup', null] : ['touchmove', 'touchend', 'touchcancel'];
      document.addEventListener(moveType, drag.handlers.move, { passive: false });
      document.addEventListener(endType, drag.handlers.end);
      if (cancelType) document.addEventListener(cancelType, drag.handlers.cancel);
      if (inputType === 'pointer' && drag.pointerType === 'mouse') {
        document.addEventListener('mousemove', drag.handlers.move, { passive: false });
        document.addEventListener('mouseup', drag.handlers.end);
      }
    }
    function rectanglesOverlap(first, second) {
      return !!first && !!second && Math.min(first.right, second.right) > Math.max(first.left, second.left) && Math.min(first.bottom, second.bottom) > Math.max(first.top, second.top);
    }
    function bounceBack(drag, onComplete) {
      setDropTarget(null);
      if (drag.preview?.animate && !window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
        drag.preview.animate([{left:drag.preview.style.left,top:drag.preview.style.top},{left:`${drag.rect.left}px`,top:`${drag.rect.top}px`}],{duration:300,easing:'cubic-bezier(.2,.75,.25,1)'}).finished.catch(()=>{}).finally(()=>{restorePointerCard(drag);onComplete?.();});
      } else { restorePointerCard(drag); onComplete?.(); }
    }
    function place(group, explicitIndex, insertion = {}) {
      if (submitted) return;
      const index = explicitIndex ?? selected;
      if (index === null || index < 0 || index >= items.length) return;
      if (insertion.beforeIndex === index && placed[index] === group) return;
      const nextPlaced = { ...placed, [index]: group };
      const nextSlots = { ...placementSlots };
      const capacity = groupLimits[group] || 0;
      if (Object.keys(nextPlaced).filter(value => nextPlaced[value] === group).length > capacity) return;
      let targetSlot = insertion.slot;
      if (targetSlot === undefined && insertion.beforeIndex !== undefined) targetSlot = placementSlots[insertion.beforeIndex];
      if (targetSlot === undefined) {
        const occupied = new Set(Object.keys(nextPlaced).filter(value => nextPlaced[value] === group && Number(value) !== index).map(value => nextSlots[value]));
        targetSlot = 0;
        while (occupied.has(targetSlot)) targetSlot++;
      }
      if (targetSlot >= capacity) return;
      if (insertion.beforeIndex !== undefined && insertion.slot === undefined) {
        if (Object.keys(nextPlaced).map(Number).some(value => value !== index && nextPlaced[value] === group && nextSlots[value] >= capacity - 1)) return;
        Object.keys(nextPlaced).map(Number).filter(value => value !== index && nextPlaced[value] === group && nextSlots[value] >= targetSlot).sort((a, b) => nextSlots[b] - nextSlots[a]).forEach(value => { nextSlots[value]++; });
      }
      nextSlots[index] = targetSlot;
      if (placed[index] === undefined || placed[index] !== group) capturePoolPositions();
      setPlaced(nextPlaced);
      setPlacementSlots(nextSlots);
      setSelected(null);
    }
    function swapCards(first, second) {
      if (first === second || placed[first] === undefined || placed[second] === undefined) return false;
      pendingSwapRects.current = new Map([first, second].map(index => [index, cardNodes.current[index]?.getBoundingClientRect()]));
      if ([...pendingSwapRects.current.values()].some(rect => !rect)) pendingSwapRects.current = null;
      setPlaced({ ...placed, [first]: placed[second], [second]: placed[first] });
      setPlacementSlots({ ...placementSlots, [first]: placementSlots[second], [second]: placementSlots[first] });
      setSelected(null);
      return true;
    }
    function allowDrop(event, target) {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      setDropTarget(current => current === target ? current : target);
    }
    function leaveDropTarget(event, target) {
      if (!event.currentTarget.contains(event.relatedTarget)) setDropTarget(current => current === target ? null : current);
    }
    function overlapDropTarget(event) {
      const container = groupContainer.current || event.currentTarget?.closest?.('.ig-group-sort-layout, .ig-sort-groups') || (event.currentTarget?.classList?.contains('ig-group-sort-layout') || event.currentTarget?.classList?.contains('ig-sort-groups') ? event.currentTarget : null);
      if (!container?.querySelectorAll) return null;
      const geometry = dragGeometry.current || { width: 1, height: 1, offsetX: 0, offsetY: 0 };
      const draggedRect = pointerDrag.current?.active ? pointerDrag.current.node.getBoundingClientRect() : null;
      if (!draggedRect && (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY))) return null;
      const left = draggedRect?.left ?? event.clientX - geometry.offsetX, top = draggedRect?.top ?? event.clientY - geometry.offsetY;
      const rect = draggedRect || { left, top, right: left + geometry.width, bottom: top + geometry.height };
      let best = null;
      for (const node of container.querySelectorAll('[data-sort-group-target]')) {
        const group=node.dataset.sortGroupTarget;
        const moving=draggedIndex.current;
        const count=Object.keys(placed).filter(index=>Number(index)!==moving&&placed[index]===group).length;
        if(count>=(groupLimits[group]||0))continue;
        const targetRect=node.getBoundingClientRect();
        const width = Math.max(0, Math.min(rect.right, targetRect.right) - Math.max(rect.left, targetRect.left));
        const height = Math.max(0, Math.min(rect.bottom, targetRect.bottom) - Math.max(rect.top, targetRect.top));
        const area = width * height;
        if (!area || (best && area <= best.area)) continue;
        best = { area, target:`group:${group}`,highlight:`group:${group}`,insertion:{} };
      }
      return best;
    }
    function handleGroupsDragOver(event) {
      const overlap = overlapDropTarget(event);
      if (!overlap) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      setDropTarget(current => current === overlap.highlight ? current : overlap.highlight);
    }
    function handleGroupsDrop(event) {
      const overlap = overlapDropTarget(event);
      if (overlap) dropOn(event, overlap.target, overlap.insertion);
    }
    function clickSortRow(group,slot,itemIndex){
      if(submitted||Date.now()<suppressClickUntil.current)return;
      if(itemIndex===undefined){if(selected!==null)commitDrop(selected,`group:${group}`,{slot});}
      else if(selected===null)setSelected(itemIndex);
      else if(selected===itemIndex)setSelected(null);
      else commitDrop(selected,`group:${group}`,{swapIndex:itemIndex});
    }
    function toggleExcerpt(index) {
      if (Date.now() < suppressClickUntil.current || submitted && !options.reviewing) return;
      if (!submitted) setSelected(index);
      const player = excerptPlayer.current, source = items[index].media.src;
      if (player.getAttribute('src') === source && !player.paused) {
        player.pause();
        return;
      }
      if (player.getAttribute('src') !== source || player.error) player.src = source;
      setExcerptError('');
      setPlayingExcerpt(index);
      player.play().catch(error => {
        if (error.name === 'AbortError' || player.getAttribute('src') !== source) return;
        setPlayingExcerpt(null);
        setExcerptError('This excerpt could not be played. Select it to try again.');
      });
    }
    const excerptLabel = index => `${playingExcerpt === index ? 'Pause' : 'Play'} excerpt ${index + 1}`;
    const excerptGlyph = index => {
      const playing = playingExcerpt === index;
      return <span className="ig-style-sort-play" aria-hidden="true"><span className={`hub-playback-glyph ${playing ? 'is-pause' : 'is-play'}`}/>{playing ? 'Pause' : 'Play'}</span>;
    };
    function sortRowKey(event,group,slot,itemIndex){
      if((event.key==='Delete'||event.key==='Backspace')&&!submitted){event.preventDefault();commitDrop(itemIndex,'pool');setSelected(null);return;}
      if(event.key==='Enter'||event.key===' '){event.preventDefault();if(styleSort)toggleExcerpt(itemIndex);else clickSortRow(group,slot,itemIndex);}
      if(event.key==='Escape')setSelected(null);
    }
    function commitDrop(index, target, insertion = {}) {
      if (target === 'pool') {
        capturePoolPositions();
        setPlaced(previous => { const next = { ...previous }; delete next[index]; return next; });
        setPlacementSlots(previous => { const next = { ...previous }; delete next[index]; return next; });
        return;
      }
      const occupiedIndex = insertion.swapIndex;
      if (occupiedIndex !== undefined && placed[index] === undefined && placed[occupiedIndex] !== undefined) {
        const displacedGroup = placed[occupiedIndex];
        const targetSlot = placementSlots[occupiedIndex];
        capturePoolPositions();
        setPlaced(previous => {
          const next = { ...previous, [index]: displacedGroup };
          delete next[occupiedIndex];
          return next;
        });
        setPlacementSlots(previous => {
          const next = { ...previous, [index]: targetSlot };
          delete next[occupiedIndex];
          return next;
        });
        setSelected(null);
        setNestingIndex(index);
        clock.cancel(nestingTimer.current);
        nestingTimer.current = clock.schedule(() => setNestingIndex(current => current === index ? null : current), 420);
        return;
      }
      if (insertion.swapIndex !== undefined && swapCards(index, insertion.swapIndex)) return;
      setNestingIndex(index);
      clock.cancel(nestingTimer.current);
      nestingTimer.current = clock.schedule(() => setNestingIndex(current => current === index ? null : current), 420);
      place(target.slice(6), index, insertion);
    }
    function dropOn(event, target, insertion = {}) {
      event.preventDefault();
      event.stopPropagation?.();
      setDropTarget(null);
      const raw = event.dataTransfer.getData('text/plain'), index = Number(raw);
      if (!raw || !Number.isInteger(index)) return;
      if (target !== 'pool') {
        const overlap = overlapDropTarget(event);
        if (overlap) { target = overlap.target; insertion = overlap.insertion; }
      }
      commitDrop(index, target, target==='pool'?insertion:{});
    }
    function submit() {
      if (submitted || Object.keys(placed).length !== items.length) return;
      excerptPlayer.current?.pause();
      onSubmitAnswers?.();
      setSubmitted(true); setSelected(null);
      function revealNext(index) {
        revealTimer.current = clock.schedule(() => {
          const item = items[index], { expected, answer, correct } = marks[index];
          setRevealedCount(index + 1);
          session.add({ ...item, answer: expected }, answer, correct);
          const continueReveal=()=>{
            if(revealCancelled.current)return;
            if (index + 1 < items.length) revealNext(index + 1);
            else revealTimer.current = clock.schedule(() => session.finish(), 500);
          };
          onFeedbackReveal?.(correct);
          continueReveal();
        }, 350);
      }
      revealNext(0);
    }
    const remaining = items.length - Object.keys(placed).length;
    const assignedFraction = Math.max(0, Math.min(1, 1 - remaining / Math.max(1, items.length)));
    const space = {
      '--ig-sort-group-rows': Math.max(1, Math.ceil(groups.length / 2)),
      '--ig-sort-tank-share': styleSort ? '44%' : items.some(item=>item.media?.type==='image'&&item.prompt) ? '40%' : `${50 - 36 * assignedFraction}%`,
      '--ig-sort-pool-columns': styleSort ? 4 : remaining <= 3 ? 1 : remaining <= 6 ? 2 : 3,
      '--ig-sort-expanded-card-height': `${54 + 18 * assignedFraction}px`
    };
    const density = activity.items.length >= 36 ? ' ig-group-sort-extra-large' : activity.items.length >= 18 || groups.length >= 5 ? ' ig-group-sort-large' : '';
    return <><div className={`ig-learning ig-group-sort-layout${styleSort?' ig-style-sort-layout':''}${activity.sortRecipe?.type==='facts'?' ig-facts-sort-layout':''}${density}`} data-item-count={activity.items.length} data-remaining-count={remaining} style={space} onDragOver={handleGroupsDragOver} onDrop={handleGroupsDrop} onDragLeave={event => { if (!event.currentTarget.contains?.(event.relatedTarget)) setDropTarget(null); }}>
      <div ref={poolContainer} aria-hidden={remaining === 0 ? true : undefined} inert={remaining === 0 ? '' : undefined} role="group" aria-label={styleSort ? "Unassigned excerpts" : "Unassigned concepts"} className={`ig-sort-pool${dropTarget === 'pool' ? ' is-drop-target' : ''}`} onDragOver={event => allowDrop(event, 'pool')} onDragLeave={event => leaveDropTarget(event, 'pool')} onDrop={event => dropOn(event, 'pool')}>
        {items.map((item, index) => placed[index] === undefined && (mode !== 'speed-sorting' || index === items.findIndex((_, i) => placed[i] === undefined)) && <button type="button" key={index} className={item.media?.type==='image'?(item.prompt?'ig-sort-photo-card':'ig-sort-image-card'):undefined} ref={node => { if (node) poolCardNodes.current[index] = node; else delete poolCardNodes.current[index]; }} style={{ '--ig-answer-colour': cardColours[index % cardColours.length] }} aria-label={styleSort ? excerptLabel(index) : undefined} aria-pressed={selected === index} draggable={false} onPointerDown={event => beginPointerDrag(event, index)} onMouseDown={event => beginPointerDrag(event, index)} onTouchStart={event => beginPointerDrag(event, index)} onDragStart={event => event.preventDefault()} onClick={() => { if (Date.now() < suppressClickUntil.current) return; if(styleSort)toggleExcerpt(index);else setSelected(current=>current===index?null:index); }}>{styleSort ? excerptGlyph(index) : <><Media media={item.media} /><SortLabel compact={!!density}>{item.prompt}</SortLabel></>}</button>)}
      </div>
      <div className="ig-sort-groups" ref={groupContainer}>{groups.map((group, groupIndex) => {
        const assigned = Object.keys(placed).map(Number).filter(index => placed[index] === group).sort((a, b) => placementSlots[a] - placementSlots[b]);
        const capacity = groupLimits[group] || 0;
        const maxSlot = assigned.reduce((max, index) => Math.max(max, placementSlots[index] ?? -1), -1);
        const target = `group:${group}`;
        return <section key={group} style={{'--ig-sort-group-colour':sortGroupColours[groupIndex % sortGroupColours.length]}} data-sort-group-target={group} onClick={event=>{if(event.target.closest?.('.ig-sort-card,button')||Date.now()<suppressClickUntil.current)return;place(group);}} className={`${capacity <= 2 ? 'ig-sort-group-small' : ''}${dropTarget===target?' is-drop-target':''}${!submitted&&selected!==null&&(assigned.length<capacity||placed[selected]===group)?' is-ready-target':''}`} onDragOver={event=>allowDrop(event,target)} onDragLeave={event=>leaveDropTarget(event,target)} onDrop={event=>dropOn(event,target)}>
          <button type="button" onClick={() => place(group)} disabled={submitted}>{group}</button>
          <div className={`ig-sort-slots${assigned.length?' has-concepts':' is-empty'}`} data-sort-capacity={capacity}>{!assigned.length&&<div className="ig-sort-group-placeholder" aria-hidden="true"/>}{Array.from({ length: Math.max(capacity, maxSlot + 1) }, (_, slot) => {
            const itemIndex = assigned.find(index => placementSlots[index] === slot);
            if (itemIndex === undefined) return null;
            const checked = submitted && itemIndex < revealedCount;
            const correct = marks[itemIndex].correct;
            const cardTarget = `card:${itemIndex}`;
            return <p ref={node => { cardNodes.current[itemIndex] = node; }} key={slot} data-sort-target={cardTarget} data-sort-type="card" data-sort-group={group} data-sort-index={itemIndex} role="button" tabIndex={submitted&&!(styleSort&&options.reviewing)?-1:0} aria-pressed={selected===itemIndex} onClick={()=>styleSort?toggleExcerpt(itemIndex):clickSortRow(group,slot,itemIndex)} onKeyDown={event=>sortRowKey(event,group,slot,itemIndex)} draggable={false} onPointerDown={event => beginPointerDrag(event, itemIndex)} onMouseDown={event => beginPointerDrag(event, itemIndex)} onTouchStart={event => beginPointerDrag(event, itemIndex)} onDragStart={event => event.preventDefault()} onDragOver={event => allowDrop(event, cardTarget)} onDragLeave={event => leaveDropTarget(event, cardTarget)} onDrop={event => dropOn(event, target, { beforeIndex: itemIndex, swapIndex: itemIndex })} style={{ '--ig-answer-colour': sortGroupColours[groupIndex % sortGroupColours.length] }} aria-label={styleSort ? excerptLabel(itemIndex) + (checked ? (correct ? ' — Correct' : ' — Incorrect') : '') : checked ? `${items[itemIndex].prompt || items[itemIndex].media?.name || 'Media item'} — ${correct ? 'Correct' : 'Incorrect'}` : items[itemIndex].prompt || items[itemIndex].media?.name || 'Media item'} className={`ig-sort-card${items[itemIndex].media?.type==='image'?(items[itemIndex].prompt?' ig-sort-photo-card':' ig-sort-image-card'):''}${selected===itemIndex?' is-selected':''}${dropTarget === cardTarget ? ' is-drop-target' : ''}${nestingIndex === itemIndex ? ' is-nesting' : ''}${checked ? correct ? ' ig-correct' : ' ig-incorrect' : ''}`}>{styleSort ? excerptGlyph(itemIndex) : <><Media media={items[itemIndex].media} /><SortLabel compact={!!density}>{items[itemIndex].prompt}</SortLabel></>}{checked ? <span className={`ig-sort-feedback-marker ${correct ? 'is-correct' : 'is-incorrect'}`} aria-hidden="true"/> : null}</p>;
          })}{pickupPlaceholder?.group === group && <div className="ig-sort-pickup-placeholder" aria-hidden="true" style={{ left: `${pickupPlaceholder.left}px`, top: `${pickupPlaceholder.top}px`, width: `${pickupPlaceholder.width}px`, height: `${pickupPlaceholder.height}px` }} />}</div>
        </section>;
      })}</div>
      <button type="button" className="ig-learning-primary ig-check-action" disabled={submitted || Object.keys(placed).length !== items.length} onClick={submit}>Submit</button>
    </div>{styleSort && <audio ref={excerptPlayer} hidden preload="none" onPause={event=>{if(event.currentTarget.paused)setPlayingExcerpt(null);}} onEnded={()=>setPlayingExcerpt(null)} />}{excerptError && <p role="status" className="ig-error">{excerptError}</p>}</>;
  }
  function Rank({ activity, options = {}, onComplete, onProgress, onFeedbackReveal, onSubmitAnswers }) {
    const clock = useGameTimeouts(options.active !== false);
    const [order, setOrder] = useState(() => mix(activity.items.map((_, i) => i))), [checked, setChecked] = useState(false), [revealedCount, setRevealedCount] = useState(0), [dropTarget,setDropTarget] = useState(null); const list = useRef(null), previousPositions = useRef(null), revealTimer = useRef(null), suppressClick = useRef(0), session = useSession(onComplete, onProgress, activity.items.length);
    function move(from, to) {
      if (checked || from < 0 || to < 0 || from >= order.length || to >= order.length || from === to) return;
      previousPositions.current = new Map([...(list.current?.querySelectorAll('[data-rank-item]') || [])].map(row => [row.dataset.rankItem, row.getBoundingClientRect().top]));
      setOrder(current => { const next = [...current], [item] = next.splice(from, 1); next.splice(to, 0, item); return next; });
    }
    const beginCardDrag = useCardPointerDrag({disabled:checked,targetSelector:'[data-rank-item]',ignoreSelector:'button',onTarget:node=>setDropTarget(node?.dataset.rankItem ?? null),onDrop:(itemIndex,node)=>{suppressClick.current=Date.now()+250;const from=order.indexOf(itemIndex),to=Number(node?.dataset.rankItem);if(Number.isInteger(to))move(from,order.indexOf(to));}});
    useEffect(() => () => clock.cancel(revealTimer.current), []);
    useLayoutEffect(() => {
      if (!previousPositions.current || false) { previousPositions.current = null; return; }
      list.current?.querySelectorAll('[data-rank-item]').forEach(row => {
        const before = previousPositions.current.get(row.dataset.rankItem);
        if (!before) return;
        const delta = before - row.getBoundingClientRect().top;
        if (Math.abs(delta) < 1) return;
        row.animate([{ transform: `translateY(${delta}px) scale(1.025)` }, { transform: 'translateY(0) scale(1)' }], { duration: 340, easing: 'cubic-bezier(.2,.75,.25,1)' });
      });
      previousPositions.current = null;
    }, [order]);
    function check() {
      if (checked) return;
      onSubmitAnswers?.();
      order.forEach((itemIndex, position) => session.add({ prompt: `Position ${position + 1}`, answer: activity.items[position].prompt || activity.items[position].answer || activity.items[position].media?.name }, activity.items[itemIndex].prompt || activity.items[itemIndex].answer || activity.items[itemIndex].media?.name, itemIndex === position));
      setChecked(true);
      function revealNext(position) {
        revealTimer.current = clock.schedule(() => {
          const count = position + 1;
          onFeedbackReveal?.(order[position] === position);
          setRevealedCount(count);
          if (count < order.length) revealNext(count);
          else revealTimer.current = clock.schedule(() => session.finish({ openReview: true }), 900);
        }, 600);
      }
      revealNext(0);
    }
    return <div className={`ig-learning${activity.items.some(item => item.media?.name?.endsWith(' notation')) ? ' ig-rhythm-order' : ''}${activity.tags?.includes('Rhythm combinations')?' ig-rhythm-combinations':''}`}><ol className="ig-rank-list" ref={list}>{order.map((itemIndex, position) => <li key={itemIndex} data-rank-item={itemIndex} draggable={false} onPointerDown={event=>beginCardDrag(event,itemIndex)} className={`${checked && position < revealedCount ? itemIndex === position ? 'ig-correct' : 'ig-incorrect' : ''}${String(dropTarget)===String(itemIndex)?' is-drop-target':''}`}><span className="ig-rank-number">{position + 1}</span><div>{<Media media={activity.items[itemIndex].media} />}{activity.items[itemIndex].prompt}</div><span className="ig-rank-reorder" aria-hidden={checked ? true : undefined} inert={checked ? '' : undefined} style={checked ? { visibility: 'hidden', pointerEvents: 'none' } : undefined}><button type="button" aria-label={`Move item ${position + 1} up`} title="Move up" disabled={checked || position === 0} onPointerDown={event=>event.stopPropagation()} onClick={()=>move(position,position-1)}><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 15 6-6 6 6" /></svg></button><button type="button" aria-label={`Move item ${position + 1} down`} title="Move down" disabled={checked || position === order.length - 1} onPointerDown={event=>event.stopPropagation()} onClick={()=>move(position,position+1)}><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg></button></span>{checked&&position<revealedCount&&<FeedbackBadge className={`ig-rank-feedback-badge ig-feedback-icon ${itemIndex===position?'ig-feedback-tick':'ig-feedback-cross'}`} role="img" aria-label={itemIndex===position?'Correct':'Incorrect'}/>}</li>)}</ol><button type="button" className="ig-learning-primary ig-check-action" disabled={checked} aria-hidden={checked ? true : undefined} style={checked ? { visibility: 'hidden', pointerEvents: 'none' } : undefined} onClick={check}>Submit</button></div>;
  }
  function Construct({ activity, options = {}, onComplete, onProgress, onQuestionChange, mode = 'anagram' }) {
    const [index, setIndex] = useState(0), [chosen, setChosen] = useState([]), [typed, setTyped] = useState(''), [result, setResult] = useState(null), [dropTarget,setDropTarget] = useState(null); const suppressClick=useRef(0), session = useSession(onComplete, onProgress, activity.items.length), item = activity.items[index];
    const tokens = useMemo(() => item ? mix([...String(item.answer).replace(/\s/g, '')].map((text, id) => ({ text, id }))) : [], [item, mode]);
    const reveal=options.feedback!=='end';
    const typing = mode === 'type-the-answer' || mode === 'spell-the-word', gap = mode === 'complete-the-sentence';
    useEffect(() => { if (mode === 'type-the-answer') onQuestionChange?.(index + 1); }, [index, mode]);
    const choices = useMemo(() => item ? answerChoices(item, activity.items) : [], [item]);
    const beginTokenDrag=useCardPointerDrag({disabled:result!==null||typing||gap,targetSelector:'[data-token-target]',onTarget:node=>setDropTarget(node?.dataset.tokenTarget||null),onDrop:(id,node)=>{suppressClick.current=Date.now()+250;if(!node)return;const target=node.dataset.tokenTarget;if(target==='pool'){setChosen(values=>values.filter(value=>value!==id));return;}setChosen(values=>{const remaining=values.filter(value=>value!==id);if(target==='answer-end')return [...remaining,id];if(target.startsWith('answer:')){const targetId=Number(target.slice(7)),at=remaining.indexOf(targetId);if(at<0)return [...remaining,id];remaining.splice(at,0,id);return remaining;}return values;});}});
    if (!item) return <Empty />;
    const answer = typing || gap ? typed : chosen.map(id => tokens.find(t => t.id === id).text).join('');
    function check() { if (!answer.trim() || result !== null) return; const expected = mode === 'anagram' ? item.answer.replace(/\s/g, '') : item.answer; const ok = typing ? window.IGCore.isCorrectAnswer(item,answer) : norm(answer) === norm(expected); session.add(item, answer, ok); setResult(ok); }
    function next() { if (index === activity.items.length - 1) session.finish(); else { setIndex(i => i + 1); setChosen([]); setTyped(''); setResult(null); } }
    return <div className={`ig-learning${typing?' ig-type-player':''}`}>{typing&&!item.media?<DefinitionQuestion text={item.prompt}/>:<Prompt item={item} />}{gap ? <div className="ig-answer-grid">{choices.map((c, i) => <button type="button" key={i} aria-pressed={typed === c} disabled={result !== null} onClick={() => setTyped(c)}>{c}</button>)}</div> : typing ? <form className="ig-typed-answer-form" onSubmit={e => { e.preventDefault(); check(); }}><div className="ig-typed-answer-box">{result===false&&reveal&&<p className="ig-typed-correct-answer" role="status" aria-label={`Correct answer: ${item.answer}`}>{item.answer}</p>}<input className={`ig-answer-label${result === null || !reveal ? '' : result ? ' ig-correct' : ' ig-incorrect'}`} aria-label="Your answer" aria-invalid={result === null || !reveal ? undefined : !result} placeholder="Type your answer" autoComplete="off" autoCapitalize="off" spellCheck={false} value={typed} disabled={result !== null} onChange={e => setTyped(e.target.value)} />{result!==null&&reveal&&<FeedbackBadge className={`ig-typed-feedback-badge ig-feedback-icon ${result?'ig-feedback-tick':'ig-feedback-cross'}`} role="img" aria-label={result?'Correct':'Incorrect'}/>}</div>{mode === 'spell-the-word' && <p>{letters(item.answer).length} letters</p>}</form> : <><div className={`ig-token-answer${dropTarget?.startsWith('answer')?' is-drop-target':''}`} aria-label="Your answer" data-token-target="answer-end">{chosen.map((id, n) => <button type="button" key={id} data-token-target={`answer:${id}`} onPointerDown={event=>beginTokenDrag(event,id)} className={dropTarget===`answer:${id}`?'is-drop-target':''} disabled={result !== null} aria-label={`Remove ${tokens.find(t => t.id === id).text} from position ${n + 1}`} onClick={() => {if(Date.now()<suppressClick.current)return;setChosen(v => v.filter(x => x !== id));}}>{tokens.find(t => t.id === id).text}</button>)}{!chosen.length && <span>Select tiles below</span>}</div><div className={`ig-token-pool${dropTarget==='pool'?' is-drop-target':''}`} data-token-target="pool">{tokens.map(t => <button type="button" key={t.id} disabled={chosen.includes(t.id) || result !== null} onPointerDown={event=>beginTokenDrag(event,t.id)} onClick={() => {if(Date.now()<suppressClick.current)return;setChosen(v => [...v, t.id]);}}>{t.text}</button>)}</div><button type="button" className="ig-learning-secondary" disabled={result !== null} onClick={() => setChosen([])}>Clear</button></>}{result === null ? <button type="button" className="ig-learning-primary ig-check-action" disabled={!answer.trim()} onClick={check}>Submit</button> : <Feedback reveal={reveal} correct={result} expected={item.answer} last={index === activity.items.length - 1} onNext={next} />}</div>;
  }
  function clozePage(item) {
    if (typeof item.clozeText === 'string' && item.clozeGaps?.length) return {text:item.clozeText,gaps:item.clozeGaps.slice().sort((a,b)=>a.start-b.start)};
    const segments = String(item.prompt || '').split(/_{2,}/), gaps=[];
    let text=segments[0];
    for(let i=1;i<segments.length;i++){const start=text.length;text+=item.answer;gaps.push({start,end:text.length,text:item.answer});text+=segments[i];}
    return {text,gaps};
  }
  function DefinitionQuestion({text}) {
    const box=useRef(null),content=useRef(null);
    useLayoutEffect(()=>{
      const fit=()=>{
        if(!box.current||!content.current)return;
        const style=getComputedStyle(box.current);
        const height=box.current.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);
        let size=32;
        content.current.style.fontSize=`${size}px`;
        while(size>1&&(content.current.scrollHeight>height||content.current.scrollWidth>content.current.clientWidth)){
          content.current.style.fontSize=`${--size}px`;
        }
      };
      fit();
      const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(fit):null;
      if(box.current)observer?.observe(box.current);
      return ()=>observer?.disconnect();
    },[text]);
    return <p ref={box} className="ig-cloze-sentence ig-definition-question"><span ref={content}>{text}</span></p>;
  }
  function Cloze({activity,options={},onComplete,onProgress,controlled}) {
    const [index,setIndex]=useState(0),[placed,setPlaced]=useState({}),[activeGap,setActiveGap]=useState(0),[localResult,setResult]=useState(null),[dropTarget,setDropTarget]=useState(null);
    const reveal=options.feedback!=='end';
    const result=controlled?(controlled.reveal?controlled.marks:null):localResult;
    const locked=Boolean(controlled?.submitted)||result!==null;
    const pages=useMemo(()=>activity.items.map(clozePage),[activity]);
    const item=activity.items[index],page=pages[index];
    const report=r=>onProgress?.({...r,current:index+1,pageTotal:activity.items.length});
    const session=useSession(onComplete,report,pages.reduce((n,p)=>n+p.gaps.length,0));
    const bank=useMemo(()=>controlled?.bank|| (page?mix([...page.gaps.map((gap,i)=>({id:`correct-${i}`,text:gap.text})),...(item.distractors||[]).filter(text=>!page.gaps.some(gap=>norm(gap.text)===norm(text))).map((text,i)=>({id:`wrong-${i}`,text}))]):[]),[item,controlled?.bank]);
    const clozeColours=Object.fromEntries(bank.map((token,i)=>[token.id,cardColours[i%cardColours.length]]));
    const suppressClick=useRef(0);
    const beginClozeDrag=useCardPointerDrag({disabled:locked,targetSelector:'[data-cloze-target]',onTarget:node=>setDropTarget(node?.dataset.clozeTarget==='bank'?'bank':node?.dataset.clozeGap!==undefined?`gap:${node.dataset.clozeGap}`:null),onDrop:(id,node)=>{suppressClick.current=Date.now()+250;if(!node)return;if(node.dataset.clozeGap!==undefined)place(Number(node.dataset.clozeGap),id);else if(node.dataset.clozeTarget==='bank'){const source=Object.keys(placed).find(key=>placed[key]===id);if(source!==undefined){const next={...placed};delete next[source];setPlaced(next);controlled?.onChange(page.gaps.map((_,i)=>bank.find(token=>token.id===next[i])?.text||''));}}}});
    useEffect(()=>{report({correct:session.records.current.filter(r=>r.correct).length,total:pages.reduce((n,p)=>n+p.gaps.length,0),answers:session.records.current.slice()});},[index]);
    if(!item || !page.gaps.length)return <Empty/>;
    function place(gap,id){if(locked||!page.gaps[gap]||!bank.some(token=>token.id===id))return;const values={...placed};const previous=Object.keys(values).find(key=>values[key]===id);if(previous!==undefined){if(values[gap])values[previous]=values[gap];else delete values[previous];}values[gap]=id;setPlaced(values);controlled?.onChange(page.gaps.map((_,i)=>bank.find(token=>token.id===values[i])?.text||''));const next=page.gaps.findIndex((_,i)=>!values[i]);setActiveGap(next>=0?next:gap);}
    function blank(i){if(locked)return;setActiveGap(i);if(placed[i]){const next={...placed};delete next[i];setPlaced(next);controlled?.onChange(page.gaps.map((_,index)=>bank.find(token=>token.id===next[index])?.text||''));}}
    function check(selection=placed){if(locked||page.gaps.some((_,i)=>!selection[i]))return;const values=page.gaps.map((_,i)=>bank.find(token=>token.id===selection[i])?.text||'');const graded=window.IGCore.gradeCloze(page.gaps,values);const marks=page.gaps.map((gap,i)=>{const answer=values[i];const correct=graded[i];session.add({...item,prompt:`${page.text} (blank ${i+1})`,answer:gap.text},answer,correct);return correct;});setResult(marks);}
    function next(){if(index===activity.items.length-1)session.finish();else{setIndex(i=>i+1);setPlaced({});setActiveGap(0);setResult(null);}}
    const sentence=[];let offset=0;
    page.gaps.forEach((gap,i)=>{const token=bank.find(value=>value.id===placed[i]);sentence.push(page.text.slice(offset,gap.start));sentence.push(<button type="button" key={i} data-cloze-gap={i} data-cloze-target="gap" className={`ig-cloze-blank ${token?'is-filled':''} ${activeGap===i?'is-active':''} ${dropTarget===`gap:${i}`?'is-drop-target':''} ${result&&reveal?result[i]?'ig-correct':'ig-incorrect':''}`} style={{width:'max-content',minWidth:token?`${clozeGapWidth(token.text)}px`:'140px',maxWidth:'100%',boxSizing:'border-box',whiteSpace:'normal',overflowWrap:'anywhere',...(token?{'--ig-answer-colour':clozeColours[token.id]}:{})}} aria-label={`Blank ${i+1}`} disabled={locked} draggable={!locked&&!!placed[i]} onPointerDown={placed[i]?event=>beginClozeDrag(event,placed[i]):undefined} onDragStart={event=>event.dataTransfer.setData('text/plain',placed[i])} onClick={()=>{if(Date.now()<suppressClick.current)return;blank(i);}} onDragOver={e=>{if(!locked){e.preventDefault();e.dataTransfer.dropEffect='move';}}} onDrop={e=>{e.preventDefault();place(i,e.dataTransfer.getData('text/plain'));}}>{token?.text||''}{result!==null&&reveal&&<FeedbackBadge className={`ig-cloze-feedback-badge ig-feedback-icon ${result[i]?'ig-feedback-tick':'ig-feedback-cross'}`} role="img" aria-label={result[i]?'Correct':'Incorrect'}/>}</button>);offset=gap.end;});sentence.push(page.text.slice(offset));
    return <div className="ig-learning ig-cloze-player"><Media media={item.media}/><p className="ig-cloze-sentence">{sentence}</p><div className={`ig-cloze-bank ig-cloze-scattered-bank${dropTarget==='bank'?' is-drop-target':''}`} data-cloze-target="bank">{bank.map(token=><span className="ig-cloze-scattered-tile" key={token.id}><button type="button" style={{'--ig-answer-colour':clozeColours[token.id]}} disabled={locked||Object.values(placed).includes(token.id)} draggable={!locked&&!Object.values(placed).includes(token.id)} onPointerDown={event=>beginClozeDrag(event,token.id)} onDragStart={e=>e.dataTransfer.setData('text/plain',token.id)} onClick={()=>{if(Date.now()<suppressClick.current)return;place(activeGap,token.id);}}><MatchAnswerText text={token.text} baseSize={24} maxLines={/\s/.test(token.text.trim())?2:1}/></button></span>)}</div>{!controlled&&(result===null?<button type="button" className="ig-learning-primary ig-check-action" disabled={page.gaps.some((_,i)=>!placed[i])} onClick={()=>check()}>Submit</button>:<Feedback reveal={reveal} correct={result.every(Boolean)} expected={page.gaps.map(gap=>gap.text).join(', ')} label={index===activity.items.length-1?'Finish':'Next'} onNext={next}/>)}</div>;
  }
  function Hangman({ activity, options = {}, onComplete, onProgress }) {
    const [index, setIndex] = useState(0), [guessed, setGuessed] = useState([]), [result, setResult] = useState(null); const session = useSession(onComplete, onProgress, activity.items.length), item = activity.items[index], target = String(item?.answer || '').normalize('NFKC').toUpperCase();
    const wrong = guessed.filter(c => !target.includes(c));
    function guess(c) { if (result !== null || guessed.includes(c) || !/[A-Z0-9]/.test(c)) return; const next = [...guessed, c], misses = next.filter(x => !target.includes(x)).length, won = [...target].every(x => !/[A-Z0-9]/.test(x) || next.includes(x)); setGuessed(next); if (won || misses >= 6) { setResult(won); session.add(item, won ? item.answer : next.join(', '), won); } }
    useEffect(() => { if (options.active === false) return; const handler = e => { if (/^[a-z0-9]$/i.test(e.key) && !/INPUT|TEXTAREA/.test(e.target.tagName)) guess(e.key.toUpperCase()); }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); }, [guessed, result, index, options.active]);
    if (!item) return <Empty />;
    return <div className="ig-learning"><Prompt item={item} /><div className="ig-hangman-lives" aria-label={`${6 - wrong.length} chances left`}>{Array.from({ length: 6 }, (_, i) => <span key={i} className={i < wrong.length ? 'ig-life-lost' : ''}>●</span>)}</div><div className="ig-hangman-word">{[...target].map((c, i) => <span key={i}>{!/[A-Z0-9]/.test(c) || guessed.includes(c) || result !== null ? c : '_'}</span>)}</div><div className="ig-alphabet">{[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'].map(c => <button type="button" key={c} disabled={guessed.includes(c) || result !== null} className={guessed.includes(c) ? target.includes(c) ? 'ig-correct' : 'ig-incorrect' : ''} onClick={() => guess(c)}>{c}</button>)}</div>{result !== null && <Feedback correct={result} expected={item.answer} last={index === activity.items.length - 1} onNext={() => { if (index === activity.items.length - 1) session.finish(); else { setIndex(n => n + 1); setGuessed([]); setResult(null); } }} />}</div>;
  }
  function makeWordsearch(items) {
    const entries = [...new Map(items.map(item => [letters(item.answer), item])).entries()].filter(([word]) => word.length && word.length <= 24).slice(0, window.IGCore.LIMITS.wordsearchItems);
    const size = Math.max(10, Math.min(24, Math.max(0, ...entries.map(([w]) => w.length)) + 2)), grid = Array.from({ length: size }, () => Array(size).fill('')), placed = [];
    entries.sort((a, b) => b[0].length - a[0].length).forEach(([word, item]) => {
      let added = false;
      const starts = mix(Array.from({ length: size * size }, (_, i) => [Math.floor(i / size), i % size]));
      // Choose a direction before searching positions so long words are not
      // biased towards horizontal/vertical placements near the grid edges.
      const diagonals = mix([[1, 1], [-1, 1], [-1, -1], [1, -1]]);
      const straight = mix([[0, 1], [1, 0], [0, -1], [-1, 0]]);
      const directions = placed.length === 0 ? [...diagonals, ...straight] : mix([...diagonals, ...straight]);
      outer: for (const [dr, dc] of directions) for (const [row, col] of starts) {
        const cells = [...word].map((c, i) => ({ row: row + dr * i, col: col + dc * i, c }));
        if (cells.every(p => p.row >= 0 && p.row < size && p.col >= 0 && p.col < size && (!grid[p.row][p.col] || grid[p.row][p.col] === p.c))) { cells.forEach(p => { grid[p.row][p.col] = p.c; }); placed.push({ word, item, cells }); added = true; break outer; }
      }
      if (!added) { const row = grid.length; grid.push(Array(size).fill('')); const cells = [...word].map((c, col) => ({ row, col, c })); cells.forEach(p => { grid[p.row][p.col] = p.c; }); placed.push({ word, item, cells }); }
    });
    grid.forEach(row => row.forEach((c, i) => { if (!c) row[i] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; }));
    return { grid, placed, size };
  }
  function wordsearchHighlights(placed, found, foundPaths = {}) {
    const rainbow = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#6366f1', '#a855f7'];
    const words = {}, sharedCells = {};
    found.forEach((word, order) => {
      const colour = rainbow[order % rainbow.length];
      words[word] = colour;
      const entry = placed.find(entry => entry.word === word);
      for (const cell of foundPaths[word] || entry?.cells || entry?.positions || []) {
        const key = `${cell.row},${cell.col}`;
        const colours = sharedCells[key] || (sharedCells[key] = []);
        if (!colours.includes(colour)) colours.push(colour);
      }
    });
    const cells = Object.fromEntries(Object.entries(sharedCells).map(([key, colours]) => [key, colours.length === 1 ? colours[0] : `linear-gradient(135deg, ${colours.map((colour, index) => `${colour} ${index * 100 / colours.length}% ${(index + 1) * 100 / colours.length}%`).join(', ')})`]));
    return { words, cells };
  }
  function Wordsearch({ activity, options = {}, onComplete, onProgress }) {
    const puzzle = useMemo(() => makeWordsearch(activity.items), [activity]), [selected, setSelected] = useState([]), [found, setFound] = useState([]), [foundPaths, setFoundPaths] = useState({});
    const session = useSession(onComplete, onProgress, puzzle.placed.length);
    const highlights = useMemo(() => wordsearchHighlights(puzzle.placed, found, foundPaths), [puzzle, found, foundPaths]);
    useEffect(() => {
      if (puzzle.placed.length && found.length === puzzle.placed.length) session.finish();
    }, [found.length, puzzle.placed.length]);
    const wordDrag = useRef(null), suppressWordClick = useRef(0);
    function finishWordPath(path) {
      if (options.active === false) return false;
      const candidate = path.map(cell => puzzle.grid[cell.row][cell.col]).join('');
      const entry = puzzle.placed.find(value => !found.includes(value.word) && (value.word === candidate || value.word === [...candidate].reverse().join('')));
      if (!entry) return false;
      setFound(values => values.includes(entry.word) ? values : [...values, entry.word]);
      setFoundPaths(values => ({ ...values, [entry.word]: path }));
      setSelected([]);
      session.add(entry.item, entry.item.answer, true);
      return true;
    }
    function wordCellAt(event) {
      const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-wordsearch-row]');
      if (!cell || !event.currentTarget.contains(cell)) return null;
      return { row: Number(cell.dataset.wordsearchRow), col: Number(cell.dataset.wordsearchCol) };
    }
    function moveWordDrag(event) {
      const drag = wordDrag.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const cell = wordCellAt(event);
      if (!cell) return;
      const dr = cell.row - drag.start.row, dc = cell.col - drag.start.col;
      if (dr && dc && Math.abs(dr) !== Math.abs(dc)) return;
      drag.path = Array.from({ length: Math.max(Math.abs(dr), Math.abs(dc)) + 1 }, (_, i) => ({ row: drag.start.row + Math.sign(dr) * i, col: drag.start.col + Math.sign(dc) * i }));
      setSelected(drag.path);
    }
    function startWordDrag(event) {
      if (options.active === false || event.button !== 0 || wordDrag.current) return;
      const cell = wordCellAt(event);
      if (!cell) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      wordDrag.current = { pointerId: event.pointerId, start: cell, path: [cell], previous: selected };
      setSelected([cell]);
    }
    function endWordDrag(event, cancelled = false) {
      if (!wordDrag.current || wordDrag.current.pointerId !== event.pointerId) return;
      if (!cancelled) moveWordDrag(event);
      const { path, previous } = wordDrag.current;
      wordDrag.current = null;
      suppressWordClick.current = Date.now() + 500;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      if (cancelled) setSelected([]);
      else if (path.length > 1) finishWordPath(path);
      else pick(path[0].row, path[0].col, previous);
    }
    function pick(row, col, selection = selected) {
      if (options.active === false) return;
      const previousIndex = selection.findIndex(cell => cell.row === row && cell.col === col);
      if (previousIndex >= 0) { setSelected(selection.slice(0, previousIndex)); return; }
      const last = selection.at(-1), deltaR = last ? row - last.row : 0, deltaC = last ? col - last.col : 0;
      const adjacent = last && Math.max(Math.abs(deltaR), Math.abs(deltaC)) === 1;
      const sameDirection = selection.length < 2 || (deltaR === selection[1].row - selection[0].row && deltaC === selection[1].col - selection[0].col);
      const path = adjacent && sameDirection ? [...selection, { row, col }] : [{ row, col }];
      if (!finishWordPath(path)) setSelected(path);
    }
    return <div className="ig-learning ig-wordsearch">{puzzle.placed.length < Math.min(10, activity.items.length) && <p>Only distinct answers of up to 24 letters are included in this puzzle.</p>}<div className="ig-word-puzzle"><div className="ig-wordsearch-grid" onPointerDown={startWordDrag} onPointerMove={moveWordDrag} onPointerUp={event=>endWordDrag(event)} onPointerCancel={event=>endWordDrag(event,true)} style={{ gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))` }}>{puzzle.grid.map((row, r) => row.map((c, col) => <button type="button" key={`${r}-${col}`} data-wordsearch-row={r} data-wordsearch-col={col} aria-label={`Row ${r + 1}, column ${col + 1}, ${c}`} aria-pressed={selected.some(cell => cell.row === r && cell.col === col)} className={highlights.cells[`${r},${col}`] ? 'ig-correct' : ''} style={highlights.cells[`${r},${col}`] ? {'--ig-wordsearch-found-background':highlights.cells[`${r},${col}`]} : undefined} onClick={event => { if(event.detail===0 || Date.now()>suppressWordClick.current) pick(r, col); }}>{c}</button>))}</div><div className="ig-word-clue-panel" data-scroll-fade-panel=""><ul className="ig-word-clues" tabIndex={0} aria-label="Clues">{puzzle.placed.map((p, index) => <li key={p.word} className={found.includes(p.word) ? 'ig-word-found' : ''} style={highlights.words[p.word] ? {'--ig-wordsearch-found-colour':highlights.words[p.word]} : undefined}><span className="ig-word-clue-number">{index + 1}</span><span className="ig-word-clue-text">{activity.editorMode === 'without-clues' ? p.item.answer : p.item.prompt}</span></li>)}</ul></div></div></div>;
  }
  function makeCrossword(items, options = {}) {
    const entries = [...new Map(items.map(item => [letters(item.answer), item])).entries()].filter(([word]) => word.length && word.length <= 24).slice(0, window.IGCore.LIMITS.crosswordItems).sort((a, b) => b[0].length - a[0].length), cells = new Map(), placed = [];
    const key = (r, c) => `${r},${c}`;
    function canPlace(word, row, col, dir, needCross) {
      const dr = dir === 'down' ? 1 : 0, dc = dir === 'across' ? 1 : 0;
      if (cells.has(key(row - dr, col - dc)) || cells.has(key(row + dr * word.length, col + dc * word.length))) return false;
      let crosses = 0;
      for (let i = 0; i < word.length; i++) { const r = row + dr * i, c = col + dc * i, existing = cells.get(key(r, c)); if (existing) { if (existing.letter !== word[i] || existing.directions.includes(dir)) return false; crosses++; } else if (cells.has(key(r + dc, c + dr)) || cells.has(key(r - dc, c - dr))) return false; }
      return !needCross || crosses > 0;
    }
    function add(word, item, row, col, dir) { const positions = [...word].map((letter, i) => ({ row: row + (dir === 'down' ? i : 0), col: col + (dir === 'across' ? i : 0), letter })); positions.forEach(p => { const old = cells.get(key(p.row, p.col)); cells.set(key(p.row, p.col), { ...p, directions: [...(old?.directions || []), dir] }); }); placed.push({ word, item, row, col, dir, positions }); }
    function placeCrossing([word,item]) {
      for (const cell of cells.values()) for (let i=0;i<word.length;i++) if(cell.letter===word[i]) for(const dir of ['across','down']) {
        const row=cell.row-(dir==='down'?i:0),col=cell.col-(dir==='across'?i:0);
        if(canPlace(word,row,col,dir,true)){add(word,item,row,col,dir);return true;}
      }
      return false;
    }
    // A word that cannot cross yet may fit after another word has been added.
    // Try alternative starting words before considering a separate component.
    let best=[];
    for(let seed=0;seed<entries.length;seed++) {
      cells.clear();placed.length=0;
      const seedIndex=(seed+(Number.isInteger(options.seedOffset)?Math.abs(options.seedOffset):0))%entries.length;
      const [word,item]=entries[seedIndex];add(word,item,0,0,'across');
      let pending=entries.filter((_,index)=>index!==seedIndex),changed=true;
      while(pending.length&&changed){changed=false;pending=pending.filter(entry=>{if(!placeCrossing(entry))return true;changed=true;return false;});}
      if(placed.length>best.length)best=placed.slice();
      if(!pending.length)break;
    }
    if(best.length!==entries.length){
      cells.clear();placed.length=0;
      best.forEach(p=>add(p.word,p.item,p.row,p.col,p.dir));
      const used=new Set(placed.map(p=>p.word));
      const pending=entries.filter(([word])=>!used.has(word));
      // Preserve every answer even for custom selections with no shared letters.
      pending.forEach(([word,item])=>{if(!placeCrossing([word,item])){const row=Math.max(...[...cells.values()].map(c=>c.row))+2;add(word,item,row,0,'across');}});
    }
    const minR = Math.min(0, ...[...cells.values()].map(c => c.row)), minC = Math.min(0, ...[...cells.values()].map(c => c.col)); const width = Math.max(0, ...[...cells.values()].map(c => c.col)) - minC + 1, height = Math.max(0, ...[...cells.values()].map(c => c.row)) - minR + 1;
    const starts = [...new Set(placed.map(p => key(p.row, p.col)))].sort((a, b) => { const [ar, ac] = a.split(',').map(Number), [br, bc] = b.split(',').map(Number); return ar - br || ac - bc; }); placed.forEach(p => { p.number = starts.indexOf(key(p.row, p.col)) + 1; }); return { cells, placed, minR, minC, width, height };
  }
  function Crossword({ activity, options = {}, onComplete, onProgress }) {
    const clock = useGameTimeouts(options.active !== false);
    const puzzle = useMemo(() => makeCrossword(activity.items), [activity]);
    const [values, setValues] = useState({}), [solved, setSolved] = useState([]), [active, setActive] = useState(null), [activeCell, setActiveCell] = useState(null);
    const session = useSession(onComplete, onProgress, puzzle.placed.length), inputs = useRef({}), currentValues = useRef({}), solvedWords = useRef(new Set()), finishTimer = useRef(null);
    const highlights = useMemo(() => wordsearchHighlights(puzzle.placed, solved.map(index => puzzle.placed[index].word)), [puzzle, solved]);
    const keyFor = cell => `${cell.row},${cell.col}`;
    const solvedCells = new Set(puzzle.placed.filter((_, index) => solved.includes(index)).flatMap(word => word.positions.map(keyFor)));
    useEffect(() => () => clock.cancel(finishTimer.current), []);
    function focusCell(key) { setActiveCell(key); inputs.current[key]?.focus(); }
    function selectWord(index) {
      if (options.active === false || solvedWords.current.has(index)) return;
      setActive(index);
      const word = puzzle.placed[index], cell = word?.positions.find(cell => !currentValues.current[keyFor(cell)] && !solvedCells.has(keyFor(cell))) || word?.positions.find(cell => !solvedCells.has(keyFor(cell)));
      if (cell) focusCell(keyFor(cell));
    }
    function change(key, value) {
      if (options.active === false || !key || active === null || key !== activeCell || solvedCells.has(key) || solvedWords.current.size === puzzle.placed.length) return;
      const letter = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1), next = { ...currentValues.current, [key]: letter };
      currentValues.current = next; setValues(next);
      let newlySolved = false;
      puzzle.placed.forEach((word, index) => {
        if (solvedWords.current.has(index) || word.positions.map(cell => next[keyFor(cell)] || ' ').join('') !== word.word) return;
        solvedWords.current.add(index); newlySolved = true;
        session.add(word.item, word.item.answer, true);
      });
      if (newlySolved) setSolved([...solvedWords.current]);
      if (solvedWords.current.has(active)) { setActive(null); setActiveCell(null); inputs.current[key]?.blur(); }
      if (solvedWords.current.size === puzzle.placed.length) {
        finishTimer.current = clock.schedule(() => session.finish(), 900);
        return;
      }
      if (solvedWords.current.has(active)) return;
      const word = puzzle.placed[active], position = word?.positions.findIndex(cell => keyFor(cell) === key);
      if (letter && position >= 0) {
        const locked = new Set(puzzle.placed.filter((_, index) => solvedWords.current.has(index)).flatMap(word => word.positions.map(keyFor)));
        const cell = word.positions.slice(position + 1).find(cell => !locked.has(keyFor(cell)));
        if (cell) focusCell(keyFor(cell));
      }
    }
    function erase() {
      if (options.active === false || !activeCell) return;
      if (currentValues.current[activeCell] && !solvedCells.has(activeCell)) { change(activeCell, ''); return; }
      const word = puzzle.placed[active], position = word?.positions.findIndex(cell => keyFor(cell) === activeCell);
      const previous = word?.positions.slice(0, Math.max(0, position)).reverse().find(cell => !solvedCells.has(keyFor(cell)));
      if (previous) { const key = keyFor(previous), next = { ...currentValues.current, [key]: '' }; currentValues.current = next; setValues(next); focusCell(key); }
    }
    const complete = puzzle.placed.length > 0 && solved.length === puzzle.placed.length;
    const selectedWord = puzzle.placed[active];
    const selectionStyle = selectedWord ? { gridColumn: `${selectedWord.col - puzzle.minC + 1} / span ${selectedWord.dir === 'across' ? selectedWord.word.length : 1}`, gridRow: `${selectedWord.row - puzzle.minR + 1} / span ${selectedWord.dir === 'down' ? selectedWord.word.length : 1}` } : null;
    return <div className="ig-learning ig-crossword-player">
      {puzzle.placed.length < activity.items.length && <p>Only distinct answers of up to 24 letters are included.</p>}
      <div className="ig-word-puzzle ig-crossword-puzzle"><div className="ig-crossword-grid" onPointerDown={event => event.preventDefault()} onMouseDown={event => event.preventDefault()} onClick={event => event.preventDefault()} style={{ gridTemplateColumns: `repeat(${puzzle.width}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${puzzle.height}, minmax(0, 1fr))`, aspectRatio: `${puzzle.width} / ${puzzle.height}`, '--ig-crossword-columns': puzzle.width, '--ig-crossword-span': Math.max(puzzle.width, puzzle.height) }}>{Array.from({ length: puzzle.height * puzzle.width }, (_, i) => {
        const r = Math.floor(i / puzzle.width) + puzzle.minR, c = i % puzzle.width + puzzle.minC, key = `${r},${c}`, cell = puzzle.cells.get(key), start = puzzle.placed.find(word => word.row === r && word.col === c);
        return cell ? <label key={key} style={highlights.cells[key] ? { '--ig-crossword-found-background': highlights.cells[key] } : undefined} className={`${puzzle.placed[active]?.positions.some(cell => keyFor(cell) === key) ? 'ig-crossword-active' : ''}${solvedCells.has(key) ? ' ig-correct' : ''}`}>
          {start && <small>{start.number}</small>}<input ref={el => { inputs.current[key] = el; }} aria-label={`Row ${r - puzzle.minR + 1}, column ${c - puzzle.minC + 1}${start ? `, clue ${start.number}` : ''}`} maxLength={2} inputMode="none" autoComplete="off" autoCapitalize="off" spellCheck={false} value={values[key] || ''} tabIndex={-1} readOnly={options.active === false || key !== activeCell || solvedCells.has(key)} onChange={event => change(key, event.target.value)} onKeyDown={event => { if (event.key === 'Backspace') { event.preventDefault(); erase(); } }} />
        </label> : <div className="ig-crossword-blank" key={key} />;
      })}{selectionStyle && <div className="ig-crossword-word-outline" style={selectionStyle} aria-hidden="true"/>}</div><div className="ig-crossword-clues" data-scroll-fade-panel="">{['across', 'down'].map(dir => <section key={dir}><h3>{dir === 'across' ? 'Across' : 'Down'}</h3>{puzzle.placed.map((word, index) => ({ word, index })).filter(({ word }) => word.dir === dir).sort((a, b) => a.word.number - b.word.number).map(({ word, index }) => <button type="button" key={index} aria-pressed={active === index} style={highlights.words[word.word] ? { '--ig-crossword-found-colour': highlights.words[word.word] } : undefined} className={`ig-crossword-clue${solved.includes(index) ? ' ig-correct' : ''}`} onClick={() => selectWord(index)}><span className="ig-word-clue-number">{word.number}</span><span className="ig-word-clue-text">{word.item.prompt} ({word.word.length})</span></button>)}</section>)}</div></div>
      <div className="ig-crossword-keyboard" role="group" aria-label="Alphabetical keyboard">{[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(letter => <button type="button" key={letter} disabled={options.active === false || complete || activeCell === null} onMouseDown={event => event.preventDefault()} onClick={() => change(activeCell, letter)}>{letter}</button>)}<button type="button" aria-label="Backspace" disabled={options.active === false || complete || activeCell === null} onMouseDown={event => event.preventDefault()} onClick={erase}>⌫</button></div>
    </div>;
  }
  function Diagram(props) { const clock = useGameTimeouts(props.options?.active !== false); return <window.IGLabelledDiagram {...props} clock={clock} />; }

  const modes = {};
  ['quiz', 'gameshow-quiz', 'true-or-false'].forEach(mode => { modes[mode] = props => <Quiz {...props} mode={mode} />; });
  ['match-up'].forEach(mode => { modes[mode] = props => <Match {...props} mode={mode} />; });
  ['group-sort'].forEach(mode => { modes[mode] = props => <Sort {...props} mode={mode} />; });
  ['type-the-answer'].forEach(mode => { modes[mode] = props => <Construct {...props} mode={mode} />; });
  Object.assign(modes, { 'complete-the-sentence': Cloze, 'matching-pairs': Connection, 'rank-order': Rank, wordsearch: Wordsearch, crossword: Crossword, 'labelled-diagram': Diagram });
  window.IGLearning = modes;
  window.IGClozeQuestion = Cloze;
  window.IGLearningPuzzles = { makeWordsearch, makeCrossword };
})();
