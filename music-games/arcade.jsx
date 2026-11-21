/* Interactive Games: distinct arcade and teacher-led players. */
(function () {
  const {useState, useEffect, useRef, useMemo} = React;
  const shuffled = values => window.IGCore?.shuffle ? window.IGCore.shuffle([...values]) : [...values].sort(() => Math.random() - .5);
  const normal = value => String(value ?? '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
  const textOf = value => typeof value === 'string' ? value : String(value?.text ?? value?.label ?? value?.answer ?? '');
  function answersFor(item, items) {
    const raw = window.IGCore?.choices ? window.IGCore.choices(item, items) : shuffled([item.answer, ...(item.distractors || []), ...items.filter(other => other.id !== item.id).map(other => other.answer)]);
    const unique = [...new Set(raw.map(textOf).filter(Boolean))];
    if (!unique.some(value => normal(value) === normal(item.answer))) unique.unshift(String(item.answer));
    return shuffled([String(item.answer), ...unique.filter(value => normal(value) !== normal(item.answer)).slice(0, 3)]);
  }
  function Media({media, className = ''}) { return media ? <div className={'ig-arc-media ' + className} onClick={event => event.stopPropagation()}><window.IGMedia media={media}/></div> : null; }
  function Empty() { return <p className="ig-arc-empty">Add at least one item to play this activity.</p>; }
  function useBoardStorage(name, activity, initial, validate = Array.isArray) {
    const key = 'mlh-interactive-board:' + activity.id + ':' + (activity.revision || 1) + ':' + name;
    const [error, setError] = useState('');
    const [value, setValue] = useState(() => {
      try { const saved = window.localStorage?.getItem(key); if (saved) { const parsed = JSON.parse(saved); if (validate(parsed)) return parsed; } } catch (_) {}
      return typeof initial === 'function' ? initial() : initial;
    });
    useEffect(() => { if (activity.__preview) return; try { window.localStorage?.setItem(key, JSON.stringify(value)); setError(''); } catch (_) { setError('This board could not be saved in this browser. Keep this page open to retain your changes.'); } }, [key, value]);
    return [value, setValue, error];
  }
  function StorageNotice({message}) { return message ? <p className="ig-arc-storage-error" role="alert">{message}</p> : null; }

  function Prompt({item}) { return <div className="ig-arc-prompt"><h3>{item.prompt}</h3><Media media={item.media}/></div>; }
  function useQuiz({activity, options = {}, onComplete, onProgress}) {
    const [items] = useState(() => options.shuffle ? shuffled(activity.items || []) : [...(activity.items || [])]);
    const [index, setIndex] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [picked, setPicked] = useState(null);
    const done = useRef(false);
    const pickedRef = useRef(false);
    const item = items[index];
    const choices = useMemo(() => item ? answersFor(item, items) : [], [item, items]);
    const result = list => ({correct: list.filter(answer => answer.correct).length, total: items.length, answers: list});
    function pick(value) {
      if (pickedRef.current || done.current || !item) return;
      pickedRef.current = true;
      const entry = {prompt: item.prompt, expected: String(item.answer), answer: String(value), correct: normal(value) === normal(item.answer)};
      const next = [...answers, entry];
      setAnswers(next); setPicked(entry); onProgress?.(result(next));
    }
    function next() {
      if (!pickedRef.current) return;
      if (index === items.length - 1) { if (!done.current) { done.current = true; onComplete(result(answers)); } return; }
      pickedRef.current = false; setPicked(null); setIndex(index + 1);
    }
    return {items, item, index, choices, picked, pick, next};
  }
  function Feedback({quiz}) {
    if (!quiz.picked) return null;
    return <div className={'ig-arc-feedback ' + (quiz.picked.correct ? 'is-correct' : 'is-incorrect')}><button type="button" onClick={quiz.next}>Next</button></div>;
  }
  function Count({quiz}) { return <p className="ig-arc-count">{quiz.index + 1} of {quiz.items.length}</p>; }
  function ChoiceButtons({quiz}) { return <div className="ig-arc-choices">{quiz.choices.map((choice, index) => <button type="button" key={index} disabled={!!quiz.picked} onClick={() => quiz.pick(choice)}>{choice}</button>)}</div>; }
  function WatchAndMemorize(props) {
    const quiz = useQuiz(props);
    const [phase, setPhase] = useState('watch');
    const [seconds, setSeconds] = useState(Math.max(props.options?.difficulty === 'hard' ? 8 : 15, (props.activity.items?.length || 0) * (props.options?.difficulty === 'hard' ? 2 : 4)));
    useEffect(() => { if (props.options?.active === false || phase !== 'watch') return; const interval = setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000); return () => clearInterval(interval); }, [phase, props.options?.active]);
    useEffect(() => { if (seconds === 0) setPhase('recall'); }, [seconds]);
    if (!quiz.item) return <Empty/>;
    if (phase === 'watch') return <section className="ig-arc"><h3>Watch and memorise</h3><p role="timer">{seconds} seconds</p><div className="ig-memory-study">{quiz.items.map((item, index) => <article key={item.id || index}><Media media={item.media}/><strong>{item.prompt}</strong><span>{item.answer}</span></article>)}</div><button type="button" onClick={() => setPhase('recall')}>I’m ready</button></section>;
    return <section className="ig-arc"><Count quiz={quiz}/><p>What did you remember?</p><Prompt item={quiz.item}/><ChoiceButtons quiz={quiz}/><Feedback quiz={quiz}/></section>;
  }
  const MAZE_COLUMNS = 13, MAZE_ROWS = 7;
  const MAZE_WALLS = new Set([15,16,18,20,22,23,28,31,33,36,54,57,59,62,67,68,70,72,74,75]);
  const MAZE_TARGETS = [0,12,78,90];
  function MazeChase(props) {
    const quiz = useQuiz(props);
    const [position, setPosition] = useState(44);
    const [steps, setSteps] = useState(0);
    const [enemy, setEnemy] = useState(39), [lives, setLives] = useState(3), [started, setStarted] = useState(false);
    const safeUntil = useRef(0);
    const board = useRef(null);
    useEffect(() => { setPosition(44); setSteps(0); setEnemy(39); setLives(3); setStarted(false); safeUntil.current = 0; }, [quiz.index]);
    useEffect(() => { if(props.options?.active !== false) board.current?.focus(); }, [props.options?.active]);
    useEffect(() => { if (props.options?.active === false || !started || quiz.picked) return; let step = 0; const patrol = [39,40,41,42,43,44,45,46,47,48,49,50,51,50,49,48,47,46,45,44,43,42,41,40]; const interval = setInterval(() => { step = (step + 1) % patrol.length; setEnemy(patrol[step]); }, props.options?.difficulty === 'hard' ? 400 : props.options?.difficulty === 'easy' ? 1100 : 700); return () => clearInterval(interval); }, [started, quiz.index, !!quiz.picked, props.options?.active]);
    useEffect(() => { if (!started || quiz.picked || position !== enemy || Date.now() < safeUntil.current) return; safeUntil.current = Date.now() + 1600; setPosition(44); setLives(value => value - 1); if (lives <= 1) quiz.pick('Caught by the chaser'); }, [position, enemy, started]);
    function move(dx, dy) {
      if (quiz.picked || props.options?.active === false) return;
      const x = position % MAZE_COLUMNS + dx, y = Math.floor(position / MAZE_COLUMNS) + dy;
      const target = y * MAZE_COLUMNS + x;
      if (x < 0 || x >= MAZE_COLUMNS || y < 0 || y >= MAZE_ROWS || MAZE_WALLS.has(target)) return;
      setStarted(true); setPosition(target); setSteps(value => value + 1);
      const answer = MAZE_TARGETS.indexOf(target); if (quiz.choices[answer] !== undefined) quiz.pick(quiz.choices[answer]);
    }
    function key(event) { const directions = {ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}; if(directions[event.key]) { event.preventDefault(); move(...directions[event.key]); } }
    if (!quiz.item) return <Empty/>;
    return <section className="ig-arc ig-maze"><Count quiz={quiz}/><Prompt item={quiz.item}/><p>Reach the correct answer using the arrow keys or direction buttons. Avoid the chaser. Lives: {lives}</p><div className="ig-maze-legend">{quiz.choices.map((choice,i)=><span key={i}><b>{'ABCD'[i]}</b>{choice}</span>)}</div><div ref={board} className="ig-maze-board" tabIndex="0" onKeyDown={key} role="group" aria-label={'Maze. ' + steps + ' steps. Arrow keys move.'}>{Array.from({length:91}, (_, i) => { const answer = MAZE_TARGETS.indexOf(i); return <div key={i} className={'ig-maze-cell' + (MAZE_WALLS.has(i) ? ' is-wall' : '') + (answer >= 0 && quiz.choices[answer] ? ' is-target' : '')}>{answer >= 0 && quiz.choices[answer] && <span aria-label={quiz.choices[answer]}>{'ABCD'[answer]}</span>}{enemy === i && <span className="ig-maze-chaser" aria-label="Chaser">◆</span>}{position === i && <span className="ig-maze-player" aria-label="You">●</span>}</div>; })}</div><div className="ig-move-controls"><button type="button" onClick={() => move(-1,0)} aria-label="Move left">←</button><button type="button" onClick={() => move(0,-1)} aria-label="Move up">↑</button><button type="button" onClick={() => move(0,1)} aria-label="Move down">↓</button><button type="button" onClick={() => move(1,0)} aria-label="Move right">→</button></div><Feedback quiz={quiz}/></section>;
  }
  function Airplane(props) {
    const quiz = useQuiz(props);
    const [lane, setLane] = useState(0);
    const [distance, setDistance] = useState(100);
    const [flying, setFlying] = useState(false);
    const laneRef = useRef(lane), pickRef = useRef(quiz.pick);
    laneRef.current = lane; pickRef.current = quiz.pick;
    useEffect(() => { setDistance(100); setFlying(false); }, [quiz.index]);
    useEffect(() => {
      if (!flying || quiz.picked || props.options?.active === false) return;
      const step = props.options?.difficulty === 'hard' ? 2 : props.options?.difficulty === 'easy' ? .7 : 1.1;
      const interval = setInterval(() => setDistance(value => { const remaining = Math.max(0, value - step); if (remaining === 0) { setFlying(false); pickRef.current(quiz.choices[laneRef.current]); } return remaining; }), 100);
      return () => clearInterval(interval);
    }, [flying, quiz.index, !!quiz.picked, props.options?.active]);
    if (!quiz.item) return <Empty/>;
    const steer = change => setLane(value => Math.max(0, Math.min(quiz.choices.length - 1, value + change)));
    return <section className="ig-arc"><Count quiz={quiz}/><Prompt item={quiz.item}/><p>Steer into the lane with the correct answer before the gates reach your plane.</p><div className="ig-flight-board" tabIndex="0" role="group" aria-label="Flight lanes. Use up and down arrows." onKeyDown={event => { if(event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); steer(event.key === 'ArrowUp' ? -1 : 1); } }}>{quiz.choices.map((choice, i) => <div className={'ig-flight-lane' + (lane === i ? ' is-selected' : '')} key={i}><button type="button" className="ig-flight-steer" onClick={() => setLane(i)} aria-label={'Steer to lane ' + (i + 1)}>Lane {i + 1}</button><span className="ig-flight-gate" style={{left: (18 + distance * .64) + '%'}}>{choice}</span>{lane === i && <span className="ig-flight-plane" role="img" aria-label="Your plane"><img src="./ui-icons/airplane.svg" alt="" style={{display:"block",width:48,height:48}}/></span>}</div>)}</div><div className="ig-arc-actions"><button type="button" onClick={() => steer(-1)} disabled={lane === 0} aria-label="Steer up">↑</button><button type="button" onClick={() => steer(1)} disabled={lane === quiz.choices.length - 1} aria-label="Steer down">↓</button><button type="button" onClick={() => setFlying(true)} disabled={flying || !!quiz.picked}>{flying ? 'Flying…' : 'Launch'}</button></div><Feedback quiz={quiz}/></section>;
  }
  function BalloonPop(props) {
    const quiz = useQuiz(props);
    if (!quiz.item) return <Empty/>;
    return <section className="ig-arc"><Count quiz={quiz}/><Prompt item={quiz.item}/><p>Pop the balloon carrying the correct answer.</p><div className="ig-balloon-sky">{quiz.choices.map((choice,i) => <button type="button" disabled={!!quiz.picked} key={quiz.index + '-' + i} className={'ig-balloon ig-balloon-' + i} style={{'--ig-delay': (-i * .8) + 's'}} onClick={() => quiz.pick(choice)}><span>{choice}</span><span className="ig-balloon-string" aria-hidden="true"/></button>)}</div><Feedback quiz={quiz}/></section>;
  }
  function WhackAMole(props) {
    const quiz = useQuiz(props);
    const [active, setActive] = useState([0,1]);
    useEffect(() => { if (props.options?.active === false || quiz.picked || !quiz.choices.length) return; setActive([0,1]); const timer = setInterval(() => setActive(shuffled(quiz.choices.map((_, i) => i)).slice(0, Math.min(2, quiz.choices.length))), props.options?.difficulty === 'hard' ? 1100 : 2100); return () => clearInterval(timer); }, [quiz.index, !!quiz.picked, props.options?.active]);
    if (!quiz.item) return <Empty/>;
    return <section className="ig-arc"><Count quiz={quiz}/><Prompt item={quiz.item}/><p>Tap the mole showing the correct answer when it appears.</p><div className="ig-mole-field">{quiz.choices.map((choice,i) => <div className="ig-mole-hole" key={i}><button type="button" disabled={!!quiz.picked || !active.includes(i)} className={'ig-mole' + (active.includes(i) ? ' is-up' : '')} onClick={() => quiz.pick(choice)} aria-label={active.includes(i) ? choice : 'Waiting for a mole'}><span aria-hidden="true">● ●</span><strong>{active.includes(i) ? choice : ''}</strong></button></div>)}</div><Feedback quiz={quiz}/></section>;
  }
  function FlyingFruit(props) {
    const quiz = useQuiz(props);
    const [paused, setPaused] = useState(false);
    if (!quiz.item) return <Empty/>;
    return <section className="ig-arc"><Count quiz={quiz}/><Prompt item={quiz.item}/><p>Catch the fruit with the correct answer.</p><div className={'ig-fruit-field' + (paused ? ' is-paused' : '')}>{quiz.choices.map((choice,i) => <button type="button" disabled={!!quiz.picked} className={'ig-fruit ig-fruit-' + i} key={quiz.index + '-' + i} style={{'--ig-delay': (-i * 1.1) + 's','--ig-duration': (props.options?.difficulty === 'hard' ? 3.6 : 6) + 's'}} onClick={() => quiz.pick(choice)}><span aria-hidden="true"><img src={`./ui-icons/fruit-${['apple','orange','pear','lemon'][i]}.svg`} alt="" style={{display:'block',width:70,height:70,margin:'0 auto',objectFit:'contain'}}/></span><strong>{choice}</strong></button>)}</div><button type="button" className="ig-arc-subtle" onClick={() => setPaused(value => !value)}>{paused ? 'Resume movement' : 'Pause movement'}</button><Feedback quiz={quiz}/></section>;
  }
  function teacherResult(items, records = []) { return {correct:0, total:items.length, answers:records, unscored:true}; }
  function FlashCards({activity,options = {},onComplete,onProgress}) {
    const [deck, setDeck] = useState(() => options.shuffle ? shuffled(activity.items || []) : [...(activity.items || [])]);
    const [index, setIndex] = useState(0), [flipped,setFlipped] = useState(false), [seen,setSeen] = useState([]);
    const item = deck[index];
    function flip() { setFlipped(value => !value); if (!seen.includes(item.id)) { const next = [...seen,item.id]; setSeen(next); onProgress?.(teacherResult(deck,next.map(id => ({prompt:deck.find(card => card.id === id)?.prompt,answer:'Viewed',expected:'',correct:null})))); } }
    if (!item) return <Empty/>;
    return <section className="ig-arc"><p className="ig-arc-count">{index + 1} of {deck.length}</p><div className="ig-flash-card" role="button" tabIndex="0" aria-label={flipped ? 'Answer. Flip to question' : 'Question. Flip to answer'} onClick={flip} onKeyDown={e => {if(e.key === 'Enter'||e.key === ' ') {e.preventDefault();flip();}}}><span className="ig-card-face-label">{flipped ? 'Answer' : 'Question'}</span><h3>{flipped ? item.answer : item.prompt}</h3><Media media={flipped ? item.answerMedia : item.media}/></div><div className="ig-arc-actions"><button type="button" disabled={index === 0} onClick={() => {setIndex(index - 1);setFlipped(false);}}>Previous</button><button type="button" onClick={flip}>Flip card</button><button type="button" disabled={index === deck.length - 1} onClick={() => {setIndex(index + 1);setFlipped(false);}}>Next</button></div><button type="button" className="ig-arc-subtle" onClick={() => {setDeck(shuffled(deck));setIndex(0);setFlipped(false);}}>Shuffle cards</button><button type="button" className="ig-arc-finish" onClick={() => onComplete(teacherResult(deck,seen.map(id => ({prompt:deck.find(card => card.id === id)?.prompt,answer:'Viewed',expected:'',correct:null}))))}>Finish practice</button></section>;
  }
  function SpeakingCards({activity,options = {},onComplete,onProgress}) {
    const [remaining,setRemaining] = useState(() => options.shuffle === false ? [...(activity.items || [])] : shuffled(activity.items || [])), [card,setCard] = useState(null), [drawn,setDrawn] = useState([]), [revealed,setRevealed] = useState(false);
    const [seconds,setSeconds] = useState(0), [running,setRunning] = useState(false);
    useEffect(() => {if(!running || options.active === false)return;const timer=setInterval(()=>setSeconds(value=>value+1),1000);return()=>clearInterval(timer);},[running,options.active]);
    function draw() { const next=remaining[0]; if(!next)return;setCard(next);setRemaining(remaining.slice(1));setRevealed(false);setSeconds(0);setRunning(false);const record=[...drawn,{prompt:next.prompt,expected:next.answer,answer:'Discussed',correct:null}];setDrawn(record);onProgress?.(teacherResult(activity.items,record)); }
    if (!activity.items?.length) return <Empty/>;
    return <section className="ig-arc"><p>{remaining.length} cards remaining</p><div className={'ig-speaking-card' + (card ? ' is-dealt' : '')}>{card ? <><Prompt item={card}/>{revealed && <div className="ig-card-answer">{card.answer}<Media media={card.answerMedia}/></div>}</> : <h3>Draw a card to start a discussion.</h3>}</div>{card && <div className="ig-arc-actions"><span className="ig-discussion-timer" role="timer">{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</span><button type="button" onClick={()=>setRunning(value=>!value)}>{running?'Pause timer':'Start timer'}</button><button type="button" onClick={()=>setRevealed(value=>!value)}>{revealed?'Hide answer':'Reveal answer'}</button></div>}<div className="ig-arc-actions"><button type="button" disabled={!remaining.length} onClick={draw}>Draw {card?'another':'a'} card</button><button type="button" onClick={()=>onComplete(teacherResult(activity.items,drawn))}>Finish discussion</button></div></section>;
  }
  function OpenTheBox({activity,onComplete,onProgress}) {
    const items=activity.items||[];const [opened,setOpened]=useState([]),[selected,setSelected]=useState(null),[answer,setAnswer]=useState(false);
    function open(index){setSelected(index);setAnswer(false);if(!opened.includes(index)){const next=[...opened,index];setOpened(next);onProgress?.(teacherResult(items,next.map(i=>({prompt:items[i].prompt,expected:items[i].answer,answer:'Opened',correct:null}))));}}
    if(!items.length)return <Empty/>;
    return <section className="ig-arc"><p>Choose a box to reveal its contents.</p><div className="ig-box-grid">{items.map((item,i)=><button type="button" key={item.id||i} className={'ig-box'+(opened.includes(i)?' is-open':'')} aria-label={'Open box '+(i+1)} onClick={()=>open(i)}><span aria-hidden="true">{opened.includes(i)?'▱':'▣'}</span><strong>{i+1}</strong></button>)}</div>{selected!==null&&<div className="ig-box-reveal"><button type="button" className="ig-box-close" onClick={()=>setSelected(null)} aria-label="Close box contents">×</button><Prompt item={items[selected]}/>{answer&&<div className="ig-card-answer">{items[selected].answer}<Media media={items[selected].answerMedia}/></div>}<button type="button" onClick={()=>setAnswer(value=>!value)}>{answer?'Hide answer':'Reveal answer'}</button></div>}<button type="button" className="ig-arc-finish" onClick={()=>onComplete(teacherResult(items,opened.map(i=>({prompt:items[i].prompt,expected:items[i].answer,answer:'Opened',correct:null}))))}>Finish</button></section>;
  }
  function FlipTiles({activity,onComplete,onProgress}) {
    const [tiles,setTiles]=useState(()=>[...(activity.items||[])]),[flipped,setFlipped]=useState([]);
    function toggle(id){const next=flipped.includes(id)?flipped.filter(value=>value!==id):[...flipped,id];setFlipped(next);onProgress?.(teacherResult(tiles,tiles.filter(item=>next.includes(item.id)).map(item=>({prompt:item.prompt,expected:item.answer,answer:'Revealed',correct:null}))));}
    if(!tiles.length)return <Empty/>;
    return <section className="ig-arc"><p>Flip a tile to reveal its other side.</p><div className="ig-flip-grid">{tiles.map((item,i)=><article className={'ig-flip-tile'+(flipped.includes(item.id)?' is-flipped':'')} key={item.id||i}><button type="button" onClick={()=>toggle(item.id)} aria-pressed={flipped.includes(item.id)}>{flipped.includes(item.id)?item.answer:item.prompt}</button><Media media={flipped.includes(item.id)?item.answerMedia:item.media}/></article>)}</div><div className="ig-arc-actions"><button type="button" onClick={()=>setFlipped(tiles.map(item=>item.id))}>Reveal all</button><button type="button" onClick={()=>setFlipped([])}>Hide all</button><button type="button" onClick={()=>setTiles(shuffled(tiles))}>Shuffle tiles</button><button type="button" onClick={()=>onComplete(teacherResult(tiles,tiles.filter(item=>flipped.includes(item.id)).map(item=>({prompt:item.prompt,expected:item.answer,answer:'Revealed',correct:null}))))}>Finish</button></div></section>;
  }
  function Brainstorm({activity,onComplete,onProgress}) {
    const [notes,setNotes,storageError]=useBoardStorage('brainstorm',activity,[],value=>Array.isArray(value)&&value.every(note=>note&&typeof note.id==='string'&&typeof note.text==='string'&&Number.isInteger(note.topic))),[draft,setDraft]=useState(''),[topic,setTopic]=useState(0);
    const items=activity.items||[];
    function result(next){return teacherResult(items,next.map(note=>({prompt:items[note.topic]?.prompt||activity.title,expected:'',answer:note.text,correct:null})));}
    function update(next){setNotes(next);onProgress?.(result(next));}
    function move(id,delta){const next=[...notes],from=next.findIndex(note=>note.id===id),to=Math.max(0,Math.min(next.length-1,from+delta));[next[from],next[to]]=[next[to],next[from]];update(next);}
    return <section className="ig-arc"><h3>Brainstorm</h3><StorageNotice message={storageError}/>{items.length>0&&<label className="ig-arc-label">Topic<select value={topic} onChange={event=>setTopic(Number(event.target.value))}>{items.map((item,i)=><option key={item.id||i} value={i}>{item.prompt}</option>)}</select></label>}<form className="ig-brainstorm-input" onSubmit={event=>{event.preventDefault();if(!draft.trim())return;update([...notes,{id:Date.now()+'-'+Math.random(),text:draft.trim(),topic}]);setDraft('');}}><label htmlFor="ig-brainstorm-draft">Your idea</label><input id="ig-brainstorm-draft" value={draft} maxLength={400} onChange={event=>setDraft(event.target.value)} placeholder="Add an idea…"/><button type="submit" disabled={!draft.trim()}>Add note</button></form><div className="ig-brainstorm-board">{notes.map((note,i)=><article className="ig-sticky-note" key={note.id} draggable onDragStart={event=>event.dataTransfer.setData('text/plain',note.id)} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();const id=event.dataTransfer.getData('text/plain');const from=notes.findIndex(value=>value.id===id);if(from>=0)move(id,i-from);}}><span>{items[note.topic]?.prompt}</span><textarea aria-label={'Edit idea '+(i+1)} value={note.text} maxLength={400} onChange={event=>update(notes.map(value=>value.id===note.id?{...value,text:event.target.value}:value))}/><div><button type="button" disabled={i===0} onClick={()=>move(note.id,-1)} aria-label="Move idea earlier">←</button><button type="button" disabled={i===notes.length-1} onClick={()=>move(note.id,1)} aria-label="Move idea later">→</button><button type="button" onClick={()=>update(notes.filter(value=>value.id!==note.id))} aria-label="Delete idea">×</button></div></article>)}</div><button type="button" className="ig-arc-finish" onClick={()=>onComplete(result(notes))}>Finish brainstorming</button></section>;
  }
  function SeatingPlan({activity,onComplete,onProgress}) {
    const people=activity.items||[];const columns=6,seatCount=Math.max(18,Math.ceil(people.length/columns)*columns);
    const [seats,setSeats,storageError]=useBoardStorage('seating-plan',activity,()=>Array(seatCount).fill(null),value=>Array.isArray(value)&&value.length===seatCount&&value.every(id=>id===null||people.some(person=>person.id===id))),[selected,setSelected]=useState(null);
    function result(next){return teacherResult(people,next.flatMap((id,index)=>id===null?[]:[{prompt:people.find(person=>person.id===id)?.prompt||'',expected:'',answer:'Row '+(Math.floor(index/columns)+1)+', seat '+(index%columns+1),correct:null}]));}
    function update(next){setSeats(next);onProgress?.(result(next));}
    function place(index,id=selected){if(id===null)return;const next=[...seats],old=next.indexOf(id),occupant=next[index];next[index]=id;if(old>=0&&old!==index)next[old]=occupant;update(next);setSelected(null);}
    return <section className="ig-arc"><h3>Seating plan</h3><StorageNotice message={storageError}/><p>Select a name, then select a seat. You can also drag names onto seats.</p><div className="ig-seat-front">Front of room</div><div className="ig-seat-grid">{seats.map((id,i)=><button type="button" key={i} className={'ig-seat'+(id!==null?' is-occupied':'')+(selected!==null&&selected===id?' is-selected':'')} onClick={()=>selected!==null?place(i):id!==null&&setSelected(id)} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();const raw=event.dataTransfer.getData('text/plain');const person=people.find(value=>String(value.id)===raw);if(person)place(i,person.id);}} draggable={id!==null} onDragStart={event=>event.dataTransfer.setData('text/plain',String(id))} aria-label={'Row '+(Math.floor(i/columns)+1)+', seat '+(i%columns+1)+(id!==null?': '+people.find(person=>person.id===id)?.prompt:': empty')}><small>{Math.floor(i/columns)+1} · {i%columns+1}</small><strong>{people.find(person=>person.id===id)?.prompt||'Empty'}</strong></button>)}</div><div className="ig-seat-bank">{people.filter(person=>!seats.includes(person.id)).map(person=><button type="button" key={person.id} draggable aria-pressed={selected===person.id} onDragStart={event=>event.dataTransfer.setData('text/plain',String(person.id))} onClick={()=>setSelected(person.id)}>{person.prompt}</button>)}</div><div className="ig-arc-actions"><button type="button" onClick={()=>update([...shuffled(people.map(person=>person.id)),...Array(seatCount-people.length).fill(null)])}>Randomise seats</button><button type="button" disabled={selected===null} onClick={()=>{update(seats.map(id=>id===selected?null:id));setSelected(null);}}>Unseat selected</button><button type="button" onClick={()=>{update(Array(seatCount).fill(null));setSelected(null);}}>Clear seats</button><button type="button" onClick={()=>onComplete(result(seats))}>Finish</button></div></section>;
  }
  function MathsGenerator({activity,onComplete,onProgress}) {
    const [operation,setOperation]=useState('+'),[range,setRange]=useState(20),[count,setCount]=useState(10),[questions,setQuestions]=useState([]),[index,setIndex]=useState(0),[answer,setAnswer]=useState(''),[records,setRecords]=useState([]),[checked,setChecked]=useState(null);
    function generate(){const random=()=>1+Math.floor(Math.random()*range);onProgress?.({correct:0,total:count,answers:[]});setQuestions(Array.from({length:count},()=>{let a=random(),b=random();if(operation==='−'&&a<b)[a,b]=[b,a];if(operation==='÷')a=a*b;const expected=operation==='+'?a+b:operation==='−'?a-b:operation==='×'?a*b:a/b;return{prompt:a+' '+operation+' '+b,expected};}));setIndex(0);setRecords([]);setChecked(null);setAnswer('');}
    function result(list){return{correct:list.filter(record=>record.correct).length,total:questions.length,answers:list};}
    if(!questions.length)return <section className="ig-arc"><h3>Maths generator</h3><div className="ig-maths-settings"><label>Operation<select value={operation} onChange={event=>setOperation(event.target.value)}>{['+','−','×','÷'].map(value=><option key={value}>{value}</option>)}</select></label><label>Number range<select value={range} onChange={event=>setRange(Number(event.target.value))}>{[10,20,50,100].map(value=><option key={value} value={value}>1–{value}</option>)}</select></label><label>Questions<select value={count} onChange={event=>setCount(Number(event.target.value))}>{[5,10,20].map(value=><option key={value}>{value}</option>)}</select></label></div><p>Division uses whole-number answers. The range controls the factors.</p><button type="button" onClick={generate}>Generate questions</button></section>;
    const question=questions[index];return <section className="ig-arc"><p className="ig-arc-count">{index+1} of {questions.length}</p><h3 className="ig-maths-question">{question.prompt} = ?</h3><form className="ig-maths-answer" onSubmit={event=>{event.preventDefault();if(checked||!answer.trim()||!Number.isFinite(Number(answer)))return;const record={prompt:question.prompt,expected:String(question.expected),answer,correct:Number(answer)===question.expected};const next=[...records,record];setRecords(next);setChecked(record);onProgress?.(result(next));}}><label htmlFor="ig-maths-answer">Your answer</label><input id="ig-maths-answer" autoComplete="off" inputMode="decimal" value={answer} disabled={!!checked} onChange={event=>setAnswer(event.target.value)}/><button className="ig-check-action" type="submit" disabled={!!checked||!answer.trim()}>Submit</button></form>{checked&&<div className={'ig-arc-feedback '+(checked.correct?'is-correct':'is-incorrect')} role="status"><button type="button" onClick={()=>{if(index===questions.length-1){onComplete(result(records));return;}setIndex(index+1);setAnswer('');setChecked(null);}}>{index===questions.length-1?'Finish':'Next'}</button></div>}</section>;
  }
  function WordMagnets({activity,onComplete,onProgress}) {
    const items=activity.items||[];const [topic,setTopic,topicError]=useBoardStorage('word-magnets-topic',activity,0,value=>Number.isInteger(value)&&value>=0&&value<Math.max(1,items.length)),[sentence,setSentence,sentenceError]=useBoardStorage('word-magnets-sentence',activity,[],value=>Array.isArray(value)&&value.every(Number.isInteger)),[records,setRecords,recordsError]=useBoardStorage('word-magnets-records',activity,[],value=>Array.isArray(value)&&value.every(record=>record&&typeof record.prompt==='string'&&typeof record.answer==='string'));
    const tokens=useMemo(()=>shuffled(String(items[topic]?.prompt||'Create your own sentence with these words').split(/\s+/).filter(Boolean).map((word,i)=>({id:i,word}))),[topic,items]);
    function result(next){return teacherResult(items,next);}
    function compose(next){setSentence(next);const line=next.map(id=>tokens.find(token=>token.id===id)?.word).join(' ');const record={prompt:items[topic]?.prompt||'',expected:'',answer:line,correct:null};const saved=[...records.filter(value=>value.prompt!==record.prompt),record];setRecords(saved);onProgress?.(result(saved));}
    function move(id,delta){const next=[...sentence],from=next.indexOf(id),to=Math.max(0,Math.min(next.length-1,from+delta));[next[from],next[to]]=[next[to],next[from]];compose(next);}
    return <section className="ig-arc"><h3>Word magnets</h3><StorageNotice message={topicError||sentenceError||recordsError}/><p>Build a sentence. Drag words or select them to add them to the board.</p>{items.length>1&&<label className="ig-arc-label">Word set<select value={topic} onChange={event=>{setTopic(Number(event.target.value));setSentence([]);}}>{items.map((item,i)=><option value={i} key={item.id||i}>Set {i+1}</option>)}</select></label>}<div className="ig-magnet-board" aria-label="Sentence board" onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();const id=Number(event.dataTransfer.getData('text/plain'));if(tokens.some(token=>token.id===id)&&!sentence.includes(id))compose([...sentence,id]);}}>{sentence.length?sentence.map((id,i)=><div className="ig-magnet" key={id} draggable onDragStart={event=>event.dataTransfer.setData('text/plain',String(id))} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();event.stopPropagation();const moved=Number(event.dataTransfer.getData('text/plain')),from=sentence.indexOf(moved);if(from>=0)move(moved,i-from);else if(tokens.some(token=>token.id===moved)){const next=[...sentence];next.splice(i,0,moved);compose(next);}}}><strong>{tokens.find(token=>token.id===id)?.word}</strong><div><button type="button" disabled={i===0} onClick={()=>move(id,-1)} aria-label="Move word left">←</button><button type="button" disabled={i===sentence.length-1} onClick={()=>move(id,1)} aria-label="Move word right">→</button><button type="button" onClick={()=>compose(sentence.filter(value=>value!==id))} aria-label="Return word to bank">×</button></div></div>):<span className="ig-magnet-placeholder">Your sentence goes here</span>}</div><div className="ig-magnet-bank">{tokens.filter(token=>!sentence.includes(token.id)).map(token=><button type="button" draggable key={token.id} onDragStart={event=>event.dataTransfer.setData('text/plain',String(token.id))} onClick={()=>compose([...sentence,token.id])}>{token.word}</button>)}</div><div className="ig-arc-actions"><button type="button" onClick={()=>compose([])}>Clear board</button><button type="button" onClick={()=>onComplete(result(records))}>Finish</button></div></section>;
  }
  window.IGArcade = {};
})();
