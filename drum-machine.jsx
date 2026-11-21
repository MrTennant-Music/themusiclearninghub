(function () {
  const {
    useState,
    useRef,
    useEffect
  } = React;
  const D = window.MLH.DrumMachine;
  function DrumMachineView({
    project,
    onChange,
    playing,
    beat,
    onPlay,
    onStop,
    onExport
  }) {
    const barBeats = Number(project.timeSignature.split('/')[0]) * 4 / Number(project.timeSignature.split('/')[1]);
    const linkedDrums = D.studioDrums(project.drums ? D.validateDrums(project.drums, barBeats) : project.drumPattern ? D.migrate(project.drumPattern, barBeats) : D.preset(project.timeSignature==='3/4'?'waltz':project.timeSignature==='6/8'?'sixEight':'rock', barBeats),barBeats,project.progressionBars||4);
    const drums=linkedDrums;
    const [patternIndex, setPatternIndex] = useState(0),
      [barScope,setBarScope]=useState('all'),
      [view, setView] = useState('Compose'),
      [record, setRecord] = useState(false),
      [velocity, setVelocity] = useState(100),
      [lit, setLit] = useState(null);
    const randomGroove = useRef(D.createGrooveShuffler());
    const painting = useRef(null),
      latest = useRef(null),
      timer = useRef(null);
    const pi = Math.min(patternIndex, drums.patterns.length - 1),
      pattern = drums.patterns[pi],
      stepsPerBar = Math.round(barBeats * drums.subdivision),
      playbackBar=playing&&beat>=0?Math.floor(beat/barBeats)%pattern.bars:null,
      scope=playbackBar??(barScope==='all'?'all':Math.min(barScope,pattern.bars-1)),
      visibleBar = scope==='all'?0:scope,
      stepOffset = visibleBar * stepsPerBar;
    useEffect(() => {
      if (!project.drums) onChange(drums);
    }, []);
    const change = fn => {
      const next = structuredClone(drums);
      fn(next);
      onChange(D.validateDrums(next, barBeats));
    };
    function pad(track) {
      window.MLH.DrumAudio.preview({
        midi: track.midi,
        kit: drums.kit,
        velocity: velocity / 127 * (pattern.tracks.find(t => t.id === track.id)?.volume ?? 100) / 100 * (project.volumes?.drums ?? 75) / 100,
        pitch: drums.pitch,
        pan: pattern.tracks.find(t => t.id === track.id)?.pan || 0
      });
      setLit(track.id);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setLit(null), 100);
      if (record && playing && beat >= 0) {
        const grid = (project.quantise || 8) / 4;
        const gcd = (a,b) => b ? gcd(b,a%b) : a;
        const division = drums.subdivision * grid / gcd(drums.subdivision,grid);
        const next = division === drums.subdivision ? structuredClone(drums) : D.resizePattern(drums,pi,pattern.bars,division,barBeats);
        const snapped = window.MLH.ChordGenerator.quantiseBeat(beat % D.patternBeats(pattern,barBeats),project.quantise || 8);
        onChange(D.editStudioStep(next,scope,track.id,Math.round(snapped * division) % (barBeats * division),velocity,barBeats));
      }
    }
    latest.current = {
      pad,
      playing,
      onPlay,
      onStop
    };
    useEffect(() => {
      const end = () => painting.current = null;
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
      const key = e => {
        if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.target.closest('input,select,textarea,[contenteditable],dialog,.dialog')) return;
        const track = D.tracks.find(t => t.key === e.key.toLowerCase());
        if (track) {
          e.preventDefault();
          latest.current.pad(track);
        }
        if (e.code === 'Space' && !e.target.closest('button,summary')) {
          e.preventDefault();
          latest.current.playing ? latest.current.onStop() : latest.current.onPlay();
        }
      };
      const midi = e => {
        const track = D.tracks.find(t => t.midi === e.detail.midi);
        if (track) latest.current.pad(track);
      };
      window.addEventListener('mlh-drum-midi', midi);
      window.addEventListener('keydown', key);
      return () => {
        window.removeEventListener('mlh-drum-midi', midi);
        window.removeEventListener('keydown', key);
        window.removeEventListener('pointerup', end);
        window.removeEventListener('pointercancel', end);
        clearTimeout(timer.current);
      };
    }, []);
    function step(track, index, mode) {
      if(playing)return;
      onChange(D.editStudioStep(drums,scope,track.id,index%stepsPerBar,mode,barBeats));
    }
    function resize(bars, division) {
      onChange(D.resizePattern(drums, pi, bars, division, barBeats));
    }
    const sequenceLength = D.sequenceBeats(drums, barBeats),
      relative = beat < 0 ? -1 : beat % sequenceLength;
    let at = 0,
      activePattern = -1,
      activeStep = -1;
    for (const part of drums.sequence) {
      const p = drums.patterns[part.pattern],
        length = D.patternBeats(p, barBeats) * part.repeats;
      if (relative >= at && relative < at + length) {
        activePattern = part.pattern;
        activeStep = Math.floor((relative - at) % D.patternBeats(p, barBeats) * drums.subdivision);
        break;
      }
      at += length;
    }
    useEffect(() => {
      if (playing && activePattern >= 0) {
        setPatternIndex(activePattern);
      }
    }, [playing, activePattern, Math.floor(activeStep / stepsPerBar), stepsPerBar]);
    return <section className="drum-machine" aria-label="Drum machine">
 <div className="drum-editor-panel">
 <window.MLH.CompositionOptions title="Drums" subtitle="Click a square to add a drum hit; click it again to remove it." actions={<> {!playing&&scope!=='all'&&drums.studioCustomBars[scope]&&<button type="button" className="studio-drum-reset" onClick={()=>onChange(D.restoreStudioBar(drums,scope,barBeats))}>Reset to 'All' Pattern</button>}<button className="row" disabled={playing} onClick={() => {if(!playing)onChange(D.randomiseStudioPattern(drums,scope,project.timeSignature,Math.random,randomGroove.current));}}><img src="ui-icons/composition-dice.svg" width="22" height="22" alt="" aria-hidden="true"/>Randomise</button><button disabled={playing||!(scope==='all'&&drums.studioCustomBars.some(Boolean))&&!pattern.tracks.some(track=>(scope==='all'?drums.studioMain[track.id]:track.steps.slice(stepOffset,stepOffset+stepsPerBar)).some(hit=>hit>0))} onClick={() => {if(!playing)onChange(D.clearStudioPattern(drums,scope,barBeats));}}>Clear</button> </>}><div className="row studio-drum-scope"><label className="option-field studio-drum-pattern-field"><span>Bars</span><select aria-label="Drum pattern bars" disabled={playbackBar!==null} value={scope} onChange={e=>setBarScope(e.target.value==='all'?'all':Number(e.target.value))}><option value="all">All</option>{Array.from({length:pattern.bars},(_,i)=><option key={i} value={i}>Bar {i+1}{drums.studioCustomBars[i]?' •':''}</option>)}</select></label>{scope!=='all'&&<span className="muted">{drums.studioCustomBars[scope]?'Uses Custom Pattern':"Uses 'All' Pattern"}</span>}</div></window.MLH.CompositionOptions>
 {view === 'Compose' && <>
 <div className="drum-grid" style={{
          '--drum-steps': stepsPerBar,
          '--drum-columns': Array.from({length:stepsPerBar},(_,i)=>(i>0&&i%drums.subdivision===0?'12px ':'')+'minmax(0,1fr)').join(' ')
        }}><div className="drum-track-heading" aria-hidden="true"/><div className="drum-step-labels">{Array.from({length:Math.ceil(stepsPerBar/drums.subdivision)},(_,i)=><React.Fragment key={i}>{i>0&&<span aria-hidden="true"/>}<span style={{gridColumn:`span ${drums.subdivision}`}}>Beat {i+1}</span></React.Fragment>)}</div>
 {pattern.tracks.map(track => {
            const info = D.tracks.find(t => t.id === track.id);
            return <React.Fragment key={track.id}><div className="drum-track"><button className="drum-sound" onClick={()=>pad(info)} title={`Play ${info.name} (${info.key.toUpperCase()})`}><img src={`ui-icons/drums/${info.id}.svg`} width="22" height="22" alt="" aria-hidden="true"/>{info.name}</button></div><div className={`drum-steps ${track.mute ? 'muted-track' : ''}`}>{Array.from({
                  length: stepsPerBar
                }, (_, i) => {
                  const index = stepOffset + i,
                    value = (scope==='all'?drums.studioMain[track.id][i]:track.steps[index]) || 0;
                  return <React.Fragment key={index}>{i>0&&i%drums.subdivision===0&&<span className="drum-beat-divider" aria-hidden="true"/>}<button disabled={playing} className={`drum-step ${i % drums.subdivision === 0 ? 'beat-start' : ''} ${value ? 'hit' : ''} ${playing && activePattern === pi && activeStep % stepsPerBar === i && (scope==='all'||Math.floor(activeStep/stepsPerBar)===scope) ? 'playhead' : ''}`} style={value ? {
                    '--hit-opacity': .35 + value / 127 * .65
                  } : null} aria-label={`${info.name}, ${scope==='all'?'main pattern':'bar '+(visibleBar+1)}, step ${i + 1}${value ? `, strength ${value}` : ''}`} aria-pressed={!!value} onClick={e => {
                    if (e.detail === 0 || e.currentTarget.__mlhTouchTap) step(track, index, value ? 0 : velocity);
                  }} onPointerDown={e => {
                    e.currentTarget.__mlhTouchTap = e.pointerType === 'touch';
                    if (playing||e.currentTarget.__mlhTouchTap||e.button !== 0) return;
                    e.preventDefault();
                    const next = e.shiftKey ? value < 70 ? 90 : value < 110 ? 127 : 45 : value ? 0 : velocity;
                    painting.current = {
                      track: track.id,
                      value: next
                    };
                    step(track, index, next);
                    if (next) window.MLH.DrumAudio.preview({
                      midi: info.midi,
                      kit: drums.kit,
                      velocity: next / 127,
                      pitch: drums.pitch,
                      pan: track.pan
                    });
                  }} onPointerEnter={() => {
                    if (painting.current?.track === track.id) step(track, index, painting.current.value);
                  }} onContextMenu={e => {
                    e.preventDefault();
                    if(playing)return;
                    step(track, index, value < 70 ? 90 : value < 110 ? 127 : 45);
                  }} /></React.Fragment>;
                })}</div></React.Fragment>;
          })}</div></>}
 </div>
 {view === 'Pads' && <><div className="row" style={{
          marginBottom: 18
        }}><button aria-pressed={record} onClick={() => setRecord(v => !v)} className={record ? 'recording' : ''}>● Record pads</button><span className="muted">{record ? 'Press Play, then play the pads to record into the selected pattern.' : 'Play with your mouse, touchscreen or the keyboard keys shown.'}</span></div><div className="drum-pads">{D.tracks.map(track => <button key={track.id} className={lit === track.id ? 'pad-active' : ''} onClick={()=>pad(track)}><small>{track.key.toUpperCase()}</small>{track.name}</button>)}</div></>}
 {view === 'Patterns' && <><h2>Starting beats</h2><div className="presets">{Object.entries(D.presetsForSignature(project.timeSignature)).map(([id, label]) => <button className="preset" key={id} onClick={() => {
            onChange(D.preset(id, barBeats));
            setPatternIndex(0);
                  setView('Compose');
          }}><strong>{typeof label === 'string' ? label : id}</strong><span>Load a {id} beat</span></button>)}</div></>}
 
 </section>;
  }
  window.MLH.DrumMachineView = DrumMachineView;
})();
