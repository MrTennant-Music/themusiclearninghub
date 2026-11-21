(() => {
  const {useState,useEffect,useRef}=React;
  function App(){
    const [fullscreen,setFullscreen]=useState(false),[fullscreenError,setFullscreenError]=useState('');
    const [stats,setStats]=useState({score:0,best:0,round:0,phase:'intro',busy:false,confetti:0}),[resetSignal,setResetSignal]=useState(0);
    const gameWindow=useRef(null),gameMenu=useRef(null);
    const [gameMode,setGameMode]=window.MLH.useProfileState("gameMode",()=>{try{return localStorage.getItem('mlh-pitched-game-type')==='endurance'?'endurance':'default';}catch{return 'default';}}),[gameMenuOpen,setGameMenuOpen]=useState(false);
    useEffect(()=>{try{localStorage.setItem('mlh-pitched-game-type',gameMode);}catch{}},[gameMode]);
    window.MLH.useClickOutside([gameMenu],[()=>setGameMenuOpen(false)]);
    useEffect(()=>{
      const update=()=>setFullscreen(document.fullscreenElement===gameWindow.current);
      document.addEventListener('fullscreenchange',update);
      return()=>document.removeEventListener('fullscreenchange',update);
    },[]);
    async function toggleFullscreen(){
      setFullscreenError('');
      try {
        if(document.fullscreenElement)await document.exitFullscreen();
        else await gameWindow.current.requestFullscreen();
      } catch {
        setFullscreenError('Full screen could not open. Please try again.');
      }
    }
    function fullscreenButton(extraClass=''){
      return <button type="button" className={`bandle-fullscreen ${extraClass}`} aria-label={fullscreen?'Exit Full Screen':'Full Screen'} aria-pressed={fullscreen} title={fullscreen?'Exit Full Screen':'Full Screen'} onClick={toggleFullscreen} disabled={!document.fullscreenEnabled}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d={fullscreen?'M9 3v6H3m18 0h-6V3M3 15h6v6m6 0v-6h6':'M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6'}/></svg></button>;
    }
    function statsPanel(){const endurance=stats.mode==='endurance';return (<div className="bandle-stats"><window.MLH.ScoreStreakPanel key={stats.confetti?`medal-${stats.confetti}`:'default'}
          assets={{bronze:'./ui-icons/bronze.svg',silver:'./ui-icons/silver.svg',gold:'./ui-icons/gold.svg',diamond:'./ui-icons/diamond.svg'}}
          correct={stats.round} attempted={5} accuracy={0} streak={endurance?Math.max(stats.completed||0,stats.best):Math.max(stats.score,stats.best)} bestStreak={stats.best}
          scoreDisplay={{label:endurance?'Score':'Round',value:endurance?`${Math.round(stats.lastScore||0)}`:`${stats.round}/5`,subtitle:'\u00a0',fillPercent:0}}
          streakDisplay={{label:endurance?'Round':'Score',value:endurance?`${stats.round}`:`${Math.round(stats.score)}/50`,subtitle:endurance?`Best: ${stats.best}`:`Best score: ${Math.round(stats.best)}`}}
          resetScore={()=>setResetSignal(n=>n+1)} resetDisabled={stats.busy}
          confettiKey={stats.confetti} medalEligible={true} medalColourStreak={stats.best}
          medalThresholdValues={endurance?[3,5,7,10]:[30.01,35,40,49]} medalThresholdLabels={endurance?null:[30,35,40,49]}
        /></div>);}
    const shareUrl=new URL(location.href);
    shareUrl.searchParams.delete('mode');
    return <div className={window.MLH.shell.pageShellClass}>
      <window.MLH.AppHeader icon="./app-icons/pitched-icon.svg" title="Pitched" subtitle="Listen, remember and match the pitch." profileState={{gameMode}} profileShareUrl={shareUrl.href} profileUsesSharedSettings={false} profileShowLabel={false}>
        {!fullscreen&&statsPanel()}
      </window.MLH.AppHeader>
      <div className={window.MLH.shell.pageContentClass}>
        <main className={`${window.MLH.shell.mainShellClass} bandle-page`}>
          <div className="bandle-toolbar">{fullscreenButton()}</div>
          {fullscreenError&&<p className="bandle-fullscreen-error" role="alert">{fullscreenError}</p>}
          <div ref={gameWindow} className="bandle-game-window" aria-label="Pitched game">
            <div ref={gameMenu} className="bandle-game-type" onKeyDown={event=>{if(event.key==='Escape'){setGameMenuOpen(false);gameMenu.current.querySelector('button').focus();}}}>
              <window.MLH.ToolbarButton icon={<img src="./ui-icons/game-type.svg" alt="" className="h-[21px] w-[21px]"/>} label="Game Type" className="gap-2" dataMenuTrigger expanded={gameMenuOpen} ariaControls="pitched-game-type-menu" onClick={()=>setGameMenuOpen(open=>!open)}/>
              {gameMenuOpen&&<window.MLH.MenuPanel id="pitched-game-type-menu" title="Game Type" floating dataMenuPanel>
                <window.MLH.LevelMenu activeLevel={gameMode} updateUrl={false} onSelect={mode=>{setGameMode(mode);setGameMenuOpen(false);}} levels={{default:{label:'Score Mode',description:'Five rounds, scored out of 50.',icon:'5'},endurance:{label:'Endurance Mode',description:'Keep score above 8 to go as far as you can.',icon:'∞'}}}/>
              </window.MLH.MenuPanel>}
            </div>
            {fullscreen&&<div className="bandle-fullscreen-stats">{statsPanel()}</div>}
            <div className="bandle-native-game"><window.MLH.HubDialed key={gameMode} gameMode={gameMode} onStats={setStats} resetSignal={resetSignal}/></div>
            {fullscreenButton('bandle-fullscreen-exit')}
          </div>
        </main>
      </div>
    </div>;
  }
  ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
})();
