(() => {
  'use strict';
  const {useState,useReducer,useEffect,useRef}=React;
  const C=window.HubDialedCore;
  const bestKey=mode=>`mlh-dialed-best-${mode}`;
  const readBest=mode=>{try{const value=Number(localStorage.getItem(bestKey(mode)));return Number.isFinite(value)&&value>=0&&(mode==='endurance'?Number.isSafeInteger(value):value<=50)?value:0;}catch{return 0;}};
  const hz=value=>`${value.toFixed(1)} Hz`;
  function Dial({value,interactive,onChange,comparisonValue}) {
    const drag=useRef(null);
    const {x,y}=C.dialPoint(value),comparing=Number.isFinite(comparisonValue),targetPoint=comparing?C.dialPoint(comparisonValue,99):null;
    const gapStart=comparing?C.dialPoint(Math.min(value,comparisonValue),106):null,gapEnd=comparing?C.dialPoint(Math.max(value,comparisonValue),106):null;
    const pickMarker=C.dialPoint(value,106),targetMarker=comparing?C.dialPoint(comparisonValue,106):null;
    return <div className={`hd-dial ${interactive?'hd-dial-active':''}`} role={comparing?'img':undefined} aria-label={comparing?`Your pitch ${hz(C.frequency(value))}. Target ${hz(C.frequency(comparisonValue))}.`:undefined} onPointerDown={event=>{
      if(!interactive||event.target.closest('input,button'))return;
      drag.current={y:event.clientY,value};event.currentTarget.setPointerCapture(event.pointerId);
    }} onPointerMove={event=>{
      if(!interactive||!drag.current)return;
      onChange(Math.max(0,Math.min(1,drag.current.value+(drag.current.y-event.clientY)/260)));
    }} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}>
      <svg viewBox="0 0 320 284" aria-hidden="true" className="hd-dial-svg">
        <circle cx="160" cy="148" r="106" fill="none" stroke="#e7e5e4" strokeWidth="8" strokeDasharray="499.5 166.5" transform="rotate(135 160 148)" strokeLinecap="round"/>
        {Array.from({length:13},(_,i)=>{const a=(-135+i*22.5)*Math.PI/180;return <line key={i} x1={160+Math.sin(a)*121} y1={148-Math.cos(a)*121} x2={160+Math.sin(a)*129} y2={148-Math.cos(a)*129} stroke="#a8a29e" strokeWidth="2"/>;})}
        <circle cx="160" cy="148" r="86" fill="#fafaf9" stroke="#e7e5e4"/>
        {comparing&&<><path className="hd-dial-gap" d={`M ${gapStart.x} ${gapStart.y} A 106 106 0 ${Math.abs(value-comparisonValue)>2/3?1:0} 1 ${gapEnd.x} ${gapEnd.y}`} fill="none" stroke="#93c5fd" strokeWidth="8"/>
          <line className="hd-dial-target" x1="160" y1="148" x2={targetPoint.x} y2={targetPoint.y} stroke="#16a34a" strokeWidth="4" strokeDasharray="6 5" strokeLinecap="round"/>
          <circle cx={targetMarker.x} cy={targetMarker.y} r="7" fill="#fff" stroke="#16a34a" strokeWidth="3"/>
          <circle cx={pickMarker.x} cy={pickMarker.y} r="4" fill="#2563eb"/>
        </>}
        <line className="hd-dial-needle" x1="160" y1="148" x2={x} y2={y} stroke="#2563eb" strokeWidth="5" strokeLinecap="round"/>
        <circle cx="160" cy="148" r="11" fill="#2563eb"/>
        <text x="64" y="268" textAnchor="middle">Lower</text><text x="256" y="268" textAnchor="middle">Higher</text>
      </svg>
      {interactive&&<input className="hd-pitch-range" type="range" min="0" max="1000" step="1" value={Math.round(value*1000)} aria-label="Match" aria-valuetext={`${Math.round(value*100)} percent of pitch range`} onChange={event=>onChange(Number(event.target.value)/1000)}/>}
    </div>;
  }
  function HubDialed({onReady,onStats,resetSignal=0,gameMode='default'}) {
    const [state,dispatch]=useReducer(C.reducer,undefined,()=>C.initialState(gameMode));
    const [confetti,setConfetti]=useState(0),[distracting,setDistracting]=useState(false),[distractorSubtitle,setDistractorSubtitle]=useState('');
    const subtitlePicker=useRef(null);if(!subtitlePicker.current)subtitlePicker.current=C.createDistractorSubtitlePicker();
    const [pick,setPick]=useState(.5),[count,setCount]=useState(3),[audioError,setAudioError]=useState(''),[busy,setBusy]=useState(false),[playing,setPlaying]=useState(false),[confirmRestart,setConfirmRestart]=useState(false),[best,setBest]=useState(()=>readBest(gameMode));
    const audio=useRef(null),mounted=useRef(true),pickRef=useRef(.5),previewTimer=useRef(null),phaseRef=useRef(state.phase),roundChime=useRef(null);
    phaseRef.current=state.phase;
    if(!audio.current)audio.current=new C.ToneAudio();
    const target=state.targets[state.round-1];
    const toneStop=()=>{roundChime.current?.pause();clearTimeout(previewTimer.current);audio.current.stop();setPlaying(false);};
    useEffect(()=>{
      onReady?.();
      return()=>{mounted.current=false;clearTimeout(previewTimer.current);audio.current.dispose();};
    },[]);
    useEffect(()=>{setBest(readBest(state.mode));},[state.mode]);
    useEffect(()=>{onStats?.({score:state.total,best,round:state.round,phase:state.phase,busy,confetti,mode:state.mode,completed:C.completedRounds(state),lastScore:state.roundScores.at(-1)??0});},[state.total,best,state.round,state.phase,busy,confetti,onStats]);
    useEffect(()=>{const tier=state.mode==='endurance'?C.enduranceMedal(best):C.medalForScore(best);if(tier)window.MLH.achievements?.award('bandle.html','ALL',tier);},[best,state.mode]);
    useEffect(()=>{
      if(state.mode==='endurance'?state.phase!=='feedback':state.phase!=='results')return;
      const previous=Math.max(readBest(state.mode),best),value=state.mode==='endurance'?C.completedRounds(state):state.total,next=Math.max(previous,value);
      setBest(next);try{localStorage.setItem(bestKey(state.mode),String(next));}catch{}
      const tier=state.mode==='endurance'?C.enduranceMedal(value):C.medalForScore(state.total);
      if(tier&&tier!==(state.mode==='endurance'?C.enduranceMedal(previous):C.medalForScore(previous))&&next>previous){
        window.MLH.achievements?.award('bandle.html','ALL',tier);setConfetti(n=>n+1);
        try{window.MLH.playFeedbackSound(true,true,tier==='diamond'?'platinum':tier)?.catch?.(()=>{});}catch{}
      }
    },[state.phase,state.mode,state.total]);
    useEffect(()=>{
      let timer,interval,cancelListening,completionChime;clearTimeout(previewTimer.current);audio.current.stop();setPlaying(false);
      setDistracting(false);
      if(state.phase==='countdown'){
        setCount(3);interval=setInterval(()=>setCount(value=>Math.max(1,value-1)),400);timer=setTimeout(()=>{dispatch({type:'LISTEN'});},1200);
      } else if(state.phase==='listen'){
        setPlaying(true);
        if(state.round>=4)timer=setTimeout(()=>{setDistractorSubtitle(subtitlePicker.current());setDistracting(true);},C.MODES[state.mode].listenMs);
        cancelListening=C.playListeningSequence(audio.current,C.listeningSequence(target,state.round,state.mode),{
          onComplete:()=>dispatch({type:'TUNE'}),
          onError:()=>{dispatch({type:'RESET'});setAudioError('Audio could not start. Check your sound settings and select Start to try again.');}
        });
      } else if(state.phase==='tune'){
        const distance=.3;
        let next=.5;for(let i=0;i<100;i++){next=.05+Math.random()*.9;if(Math.abs(next-target)>=distance)break;}
        pickRef.current=next;setPick(next);
        try{audio.current.start(C.frequency(next,state.mode));setPlaying(true);}catch{dispatch({type:'RESET'});setAudioError('Audio could not start. Check your sound settings and select Start to try again.');}
      } else if(state.phase==='feedback'){
        try{completionChime=new Audio('./audio/chime.mp3');roundChime.current=completionChime;completionChime.play()?.catch?.(()=>{});}catch{}
      }
      return()=>{clearTimeout(timer);clearInterval(interval);cancelListening?.();completionChime?.pause();audio.current.stop();};
    },[state.phase,state.round,state.mode,target]);
    async function start(){
      if(busy)return;setBusy(true);setAudioError('');
      try{await audio.current.unlock();if(!mounted.current)return;setConfirmRestart(false);setConfetti(0);dispatch({type:'START',mode:state.mode,kind:'solo',targets:C.generateTargets(Math.random)});}
      catch{if(mounted.current)setAudioError('Your Browser Could Not Start Audio. Check Your Sound Settings, Then Try Again.');}
      finally{if(mounted.current)setBusy(false);}
    }
    function requestRestart(){setConfirmRestart(true);}
    function cancelRestart(){setConfirmRestart(false);}
    function updatePick(next){
      if(phaseRef.current!=='tune'||confirmRestart)return;pickRef.current=next;setPick(next);if(playing)audio.current.setFrequency(C.frequency(next,state.mode));
    }
    async function preview(normalised){
      try{await audio.current.unlock();if(!mounted.current||document.hidden||!['feedback','results'].includes(phaseRef.current))return;toneStop();audio.current.start(C.frequency(normalised,state.mode));previewTimer.current=setTimeout(()=>{if(mounted.current){audio.current.stop();setPlaying(false);}},1100);setAudioError('');}
      catch{if(mounted.current)setAudioError('Audio Could Not Start. Check Your Sound Settings and Try Again.');}
    }
    function reset(){toneStop();setConfetti(0);setConfirmRestart(false);dispatch({type:'RESET'});}
    useEffect(()=>{if(resetSignal>0)reset();},[resetSignal]);
    function submit(){if(phaseRef.current!=='tune'||confirmRestart)return;toneStop();dispatch({type:'SUBMIT',pick:pickRef.current});}
    const active=state.phase!=='intro';
    const score=state.roundScores[state.round-1]??0;
    const targetHz=Number.isFinite(target)?C.frequency(target,state.mode):0;
    const pickedHz=Number.isFinite(state.picks[state.round-1])?C.frequency(state.picks[state.round-1],state.mode):0;
    return <section className={`hub-dialed${active?' hd-active':''}`} aria-label="Pitched Pitch Memory Game">
      <div className="hd-round-toolbar" aria-hidden="true"/>
      <div className="hd-content">
      {confirmRestart&&<div className="hd-restart-confirm" role="alertdialog" aria-label="Reset Pitched"><p>Clear This Run and Return to the Start?</p><button type="button" className="hd-button" autoFocus onClick={cancelRestart}>Cancel</button><button type="button" className="hd-button hd-primary" onClick={reset}>Reset</button></div>}
      {audioError&&<p className="hd-error" role="alert">{audioError}</p>}
      {state.phase==='intro'&&<div className="hd-intro"><h2 className="hd-mode-heading">{state.mode==='endurance'?'Endurance Mode':'Score Mode'}</h2><p className="hd-mode-guidance">{state.mode==='endurance'?'Score at least 8/10 each round to keep going. The higher the round, the harder it will be!':'Five rounds, scored out of 50.'}</p><div className="hd-intro-dial"><Dial value={.58} interactive={false}/></div></div>}
      {!confirmRestart&&state.phase==='countdown'&&<div className="hd-stage hd-countdown" role="status"><strong key={count}>{count}</strong></div>}
      {!confirmRestart&&state.phase==='listen'&&<div className={`hd-stage hd-listen${distracting?' is-distracting':''}`}>{distracting&&<h3 className="hd-distractor-heading">Don’t get distracted!</h3>}<div className="hd-listen-symbol" aria-hidden="true"><svg viewBox="0 -5 240 110"><path d="M10 50h20l10-30 15 60 16-80 18 100 16-70 15 40 15-40 16 70 18-100 16 80 15-60 10 30h20"/></svg></div><div className="hd-listen-progress" role="status" aria-label={distracting?'Distractor tones':'Listening to the Target Tone'}><span key={`${state.round}-${distracting}`} className={distracting?'hd-distractor-fill':undefined} style={distracting?{animationDuration:'1000ms',animationDelay:'1000ms',animationIterationCount:C.distractorCount(state.round)}:{animationDuration:`${C.MODES[state.mode].listenMs}ms`}}/></div></div>}
      {!confirmRestart&&state.phase==='tune'&&<div className="hd-stage hd-tune" aria-label="Match"><Dial value={pick} interactive onChange={updatePick}/></div>}
      {!confirmRestart&&state.phase==='feedback'&&<div className={`hd-stage hd-feedback hd-score-${state.mode==='endurance'?(score>=8?'green':'red'):score>=7.5?'green':score>=4?'orange':'red'}`}>{score>9&&<div className="hd-confetti" key={state.round} aria-hidden="true">{Array.from({length:48},(_,i)=><i key={i} style={{'--x':`${(i*37)%100}%`,'--drift':`${((i*53)%180)-90}px`,'--delay':`${(i%8)*.06}s`,'--spin':`${180+i*31}deg`,background:['#16a34a','#2563eb','#f59e0b','#e11d48','#9333ea'][i%5]}}/>)}</div>}<h3 role="status">{state.mode==='endurance'&&score<8?'Game Over':score>=9?'Excellent match!':score>=6?'Close match!':'Keep listening!'}</h3><p className="hd-round-score"><strong>{score.toFixed(2)}</strong><span>/ 10</span></p><div className="hd-comparison"><div><span className="hd-pitch-key hd-pitch-key-yours">Your Pitch</span><strong>{hz(pickedHz)}</strong><button type="button" className="hd-button hd-replay" aria-label="Play Yours" onClick={()=>preview(state.picks[state.round-1])}><span className="hub-playback-glyph is-play" aria-hidden="true"></span>Play</button></div><Dial value={state.picks[state.round-1]} comparisonValue={target} interactive={false}/><div><span className="hd-pitch-key hd-pitch-key-target">Target</span><strong>{hz(targetHz)}</strong><button type="button" className="hd-button hd-replay" aria-label="Play Target" onClick={()=>preview(target)}><span className="hub-playback-glyph is-play" aria-hidden="true"></span>Play</button></div></div></div>}
      {!confirmRestart&&state.phase==='results'&&<div className="hd-results"><h3 role="status">{state.mode==='endurance'?'Rounds completed':'Final score'}</h3><p className="hd-round-score"><strong>{state.mode==='endurance'?C.completedRounds(state):state.total.toFixed(2)}</strong>{state.mode!=='endurance'&&<span>/ 50</span>}</p><div className="hd-results-table"><table><caption className="hd-sr-only">Pitched Round Results</caption><thead><tr><th scope="col">Round</th><th scope="col">Your Pitch</th><th scope="col">Target</th><th scope="col">Score</th></tr></thead><tbody>{state.picks.map((_,index)=><tr key={index}><th scope="row">{index+1}</th><td>{hz(C.frequency(state.picks[index],state.mode))}</td><td>{hz(C.frequency(state.targets[index],state.mode))}</td><td>{state.roundScores[index].toFixed(2)} / 10</td></tr>)}</tbody></table></div></div>}
      </div>
      <div className="hd-fixed-score">{active&&['listen','tune'].includes(state.phase)&&<p className="hd-phase-label" role="status">{state.phase==='listen'?(distracting?distractorSubtitle:'Listen…'):'Match!'}</p>}</div>
      <div className="hd-main-action">
        {state.phase==='intro'&&<p className="hd-start-subtitle">Listen, remember and match the pitch.</p>}
        {state.phase==='intro'&&<button type="button" className="hd-button hd-primary hd-start" disabled={busy} onClick={start}>{busy?'Starting…':'Start'}</button>}
        {['countdown','listen','tune'].includes(state.phase)&&<button type="button" className="hd-button hd-primary hd-start" disabled={state.phase!=='tune'||confirmRestart} onClick={submit}>Submit</button>}
        {!confirmRestart&&state.phase==='feedback'&&<button type="button" className="hd-button hd-primary hd-start" onClick={()=>{toneStop();dispatch({type:'NEXT'});}}>{(state.mode==='endurance'?score<8:state.round===C.ROUNDS)?'Finish':'Continue'}</button>}
        {!confirmRestart&&state.phase==='results'&&<button type="button" className="hd-button hd-primary hd-start" disabled={busy} onClick={start}>{busy?'Starting…':'Play Again'}</button>}
      </div>
    </section>;
  }
  window.MLH=window.MLH||{};window.MLH.HubDialed=HubDialed;
})();
