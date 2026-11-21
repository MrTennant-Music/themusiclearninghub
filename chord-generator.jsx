const {
  useState,
  useEffect,
  useRef,
  useMemo
} = React;
const CG = window.MLH.ChordGenerator,
  CA = window.MLH.ChordAudio;
const STORE = 'mlh-chord-generator-v1';
function savedStudioTab(){
  let saved='Chords';
  try{saved=localStorage.getItem(`${STORE}-tab`)||saved;}catch{}
  const tab=window.MLH.profileInitial('studioTab',saved);
  return ['Chords','Melody','Drums','Bass'].includes(tab)?tab:'Chords';
}
const fresh = () => ({
  version: 1,
  title: '',
  tempo: 120,
  key: 0,
  mode: 'major',
  timeSignature: '4/4',
  quantise: 8,
  instrument: 'piano',
  style: 'block',
  loop: true,
  countIn: false,
  swing: 0,
  octave: 4,
  voicing: 'close',
  pedal: false,
  metronome: false,
  volumes: {
    chords: 72,
    bass: 65,
    drums: 40.5,
    melody: 100
  },
  progressionBars:4,
  sections: [{
    name: 'Progression',
    repeats: 1,
    variation: 0,
    chords: Array.from({length:4},()=>'-').map(symbol => ({
      symbol,
      beats: 4,
      inversion: 0
    }))
  }],
  melody: [],
  drums: window.MLH.DrumMachine.create(4)
});
function compositionShareUrl(project, href = location.href) {
  const url = new URL(href);
  const json = JSON.stringify(project);
  const encoded = window.pako ? 'z.'+btoa(window.pako.deflate(json,{to:'string'})) : btoa(unescape(encodeURIComponent(json)));
  url.hash = new URLSearchParams({song:encoded}).toString();
  return url.href;
}
function load() {
  try {
    const encoded = new URLSearchParams(location.hash.slice(1)).get('song');
    if (encoded) {
      const p = {
        ...fresh(),
        ...CG.asProgression(JSON.parse(encoded.startsWith('z.')
          ? window.pako.inflate(Uint8Array.from(atob(encoded.slice(2)), c=>c.charCodeAt(0)),{to:'string'})
          : decodeURIComponent(escape(atob(encoded)))))
      };
      window.history.replaceState(null, '', location.pathname + location.search);
      return p;
    }
    const saved = localStorage.getItem(STORE);
    if (saved && !localStorage.getItem(`${STORE}-before-fixed-studio`)) localStorage.setItem(`${STORE}-before-fixed-studio`,saved);
    if (saved && JSON.parse(saved).progressionBars===16) localStorage.setItem(`${STORE}-16-bar-backup`,saved);
    if (saved) return {
      ...fresh(),
      ...CG.asProgression(JSON.parse(saved))
    };
  } catch (e) {}
  return fresh();
}
const names = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const Btn = ({
  children,
  primary = false,
  ...props
}) => <button className={primary ? 'primary' : ''} {...props}>{children}</button>;
function download(data, name, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], {
    type
  }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function Piano({notes=[],onNote,onPrepare,onRelease=()=>{},octave=4,octaves=1,isPitchAllowed=()=>true,readOnly=false,pitchLabels=names}) {
  const [active,setActive]=useState([]);
  const keyboard=useRef(null),held=useRef(new Map()),pointers=useRef(new Map()),keyboardClicks=useRef(new Set()),activation=useRef(0),callbacks=useRef(null),timers=useRef(new Set());
  callbacks.current={onNote,onPrepare,onRelease,isPitchAllowed};
  const count=readOnly?7:7*octaves+1,Key=readOnly?'span':'button';
  const white=Array.from({length:count},(_,i)=>12*(octave+1)+[0,2,4,5,7,9,11][i%7]+12*Math.floor(i/7));
  const black=white.flatMap((n,i)=>[0,2,5,7,9].includes(n%12)&&i<count-1?[{n:n+1,i}]:[]);
  const equivalents={1:['C♯','D♭'],3:['D♯','E♭'],6:['F♯','G♭'],8:['G♯','A♭'],10:['A♯','B♭']};
  const lit=n=>readOnly?notes.some(p=>p%12===n%12):notes.includes(n)||active.includes(n);
  function publish(){setActive([...new Set(held.current.values())]);}
  function press(id,midi){if(held.current.has(id)||!callbacks.current.isPitchAllowed(midi))return;const alreadyHeld=[...held.current.values()].includes(midi);held.current.set(id,midi);publish();if(!alreadyHeld)callbacks.current.onNote?.(midi);}
  function release(id){const midi=held.current.get(id);if(midi===undefined)return;held.current.delete(id);publish();if(![...held.current.values()].includes(midi))callbacks.current.onRelease(midi);}
  function stop(){const pitches=[...new Set(held.current.values())];held.current.clear();pointers.current.clear();keyboardClicks.current.clear();setActive([]);pitches.forEach(midi=>callbacks.current.onRelease(midi));}
  useEffect(()=>{stop();},[octave,octaves,readOnly]);
  useEffect(()=>{
    const visibility=()=>{if(document.hidden)stop();};
    window.addEventListener('blur',stop);window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',visibility);
    return()=>{window.removeEventListener('blur',stop);window.removeEventListener('pagehide',stop);document.removeEventListener('visibilitychange',visibility);for(const timer of timers.current)clearTimeout(timer);for(const midi of new Set(held.current.values()))callbacks.current.onRelease(midi);held.current.clear();};
  },[]);
  function warm(){callbacks.current.onPrepare?.();}
  function pointerDown(e){const key=e.target.closest('[data-midi]');if(!key||key.disabled||e.button!==0)return;e.preventDefault();keyboard.current.setPointerCapture(e.pointerId);const midi=Number(key.dataset.midi);pointers.current.set(e.pointerId,midi);press(`pointer:${e.pointerId}`,midi);}
  function pointerMove(e){if(!pointers.current.has(e.pointerId))return;const key=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-midi]');const midi=key&&!key.disabled&&keyboard.current.contains(key)?Number(key.dataset.midi):null;if(pointers.current.get(e.pointerId)===midi)return;release(`pointer:${e.pointerId}`);pointers.current.set(e.pointerId,midi);if(midi!==null)press(`pointer:${e.pointerId}`,midi);}
  function pointerUp(e){pointers.current.delete(e.pointerId);release(`pointer:${e.pointerId}`);}
  function later(callback,delay){const timer=setTimeout(()=>{timers.current.delete(timer);callback();},delay);timers.current.add(timer);}
  function keyProps(n,label){return readOnly?{'aria-hidden':true}:{'data-midi':n,type:'button',disabled:!isPitchAllowed(n),'aria-label':`Play ${label}${Math.floor(n/12)-1}`,'aria-pressed':lit(n),
    onKeyDown:e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();if(!e.repeat){keyboardClicks.current.add(n);press(`focus:${n}`,n);}}},
    onKeyUp:e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();release(`focus:${n}`);later(()=>keyboardClicks.current.delete(n),0);}},
    onClick:e=>{if(e.detail!==0||keyboardClicks.current.delete(n))return;const id=`activate:${n}:${++activation.current}`;press(id,n);later(()=>release(id),250);},
    onBlur:()=>{keyboardClicks.current.delete(n);release(`focus:${n}`);}};}
  return <div ref={keyboard} className={`piano ${readOnly?'chord-piano-display':''} ${!readOnly&&octaves===2?'two-octave-keyboard':''}`} data-octaves={octaves} role={readOnly?'img':'group'} aria-label={readOnly?`Chord notes: ${notes.map(n=>pitchLabels[n%12]).join(', ')||'Silence'}`:'Piano keyboard'} {...(!readOnly?{'data-mlh-pointer-surface':'',onPointerEnter:warm,onFocusCapture:warm,onPointerDown:pointerDown,onPointerMove:pointerMove,onPointerUp:pointerUp,onPointerCancel:pointerUp,onLostPointerCapture:pointerUp}:{})}>
    {white.map(n=>{const leftBlack=black.some(key=>key.n===n-1),rightBlack=black.some(key=>key.n===n+1),labelPosition=50+(Number(leftBlack)-Number(rightBlack))*15.675;return <Key key={n} className={`piano-key white ${lit(n)?'lit':''}`} style={{'--piano-label-position':`${labelPosition}%`}} {...keyProps(n,pitchLabels[n%12])}><span className="piano-note-label">{(readOnly||isPitchAllowed(n))?pitchLabels[n%12]:null}</span></Key>;})}
    {black.map(({n,i})=><Key key={n} className={`piano-key black ${lit(n)?'lit':''}`} style={{left:`${(i+1)/count*100-31.35/count}%`,width:`${62.7/count}%`}} {...keyProps(n,equivalents[n%12].join(' / '))}>{(readOnly||isPitchAllowed(n))&&<span className="piano-note-label">{pitchLabels[n%12]}</span>}</Key>)}
  </div>;
}
function drumOnlyProject(source) {
  const p = structuredClone(source),
    D = window.MLH.DrumMachine,
    bpb = Number(p.timeSignature.split('/')[0]) * 4 / Number(p.timeSignature.split('/')[1]);
  p.drums = p.drums || (p.drumPattern ? D.migrate(p.drumPattern, bpb) : D.preset(p.timeSignature==='3/4'?'waltz':p.timeSignature==='6/8'?'sixEight':'rock', bpb));
  const n = D.sequenceBeats(p.drums, bpb);
  p.sections = [{
    name: 'Drums',
    repeats: 1,
    variation: 0,
    chords: Array.from({
      length: Math.ceil(n / 32)
    }, (_, i) => ({
      symbol: '-',
      beats: Math.min(32, n - i * 32),
      inversion: 0
    }))
  }];
  p.volumes = {
    ...p.volumes,
    chords: 0,
    bass: 0,
    melody: 0
  };
  p.countIn = false;
  p.loop = true;
  return p;
}
function ChordEditorPart({chord,project,names,spellingNames,onChange,onError,title}){
  const parsed=CG.parse(chord.symbol),pitches=CG.notes(parsed,chord.inversion||0,chord.octave??project.octave??4).map(n=>n+(chord.transpose||0));
  const labels={'':'Major',m:'Minor','7':'Dominant 7th',maj7:'Major 7th',m7:'Minor 7th',dim:'Diminished',aug:'Augmented',sus2:'Suspended 2nd',sus4:'Suspended 4th'};
  return <div className="chord-editor-part">{title&&<h3>{title}</h3>}<div className="editor"><div><div className="editor-fields"><label><span className="label">Chord</span><select aria-label={title?`${title} chord root`:'Chord root'} value={parsed.rest?'':parsed.root} onChange={e=>{const root=Number(e.target.value);onChange({symbol:parsed.rest?spellingNames[root]:CG.spellChord(CG.transpose(chord.symbol,root-parsed.root),project.key,project.mode)});}}><option value="" disabled>Select</option>{names.map((name,index)=><option key={index} value={index}>{name}</option>)}</select></label><label><span className="label">Type</span><select aria-label={title?`${title} chord quality`:'Chord quality'} value={parsed.rest?'__select':parsed.quality} onChange={e=>onChange({symbol:spellingNames[parsed.rest?project.key:parsed.root]+e.target.value,inversion:0})}><option value="__select" disabled>Select</option>{Array.from(new Set(['','m','7','maj7','m7','dim','aug','sus2','sus4',parsed.quality])).map(quality=><option key={quality} value={quality}>{labels[quality]||quality}</option>)}</select></label></div><div className="row" style={{marginTop:14}}><button className="primary" disabled={!pitches.length} onClick={()=>CA.preview(pitches,project.instrument).catch(error=>onError(error.message))}><span className="hub-playback-glyph is-play" aria-hidden="true"></span> Preview</button></div></div><div><div className="chord-display-heading"><h2 className="chord-symbol-display">{CG.notation(CG.spellChord(chord.symbol,project.key,project.mode))}</h2></div><Piano notes={pitches} readOnly pitchLabels={names.map((name,pc)=>{const tone=CG.chordToneNames(CG.spellChord(chord.symbol,project.key,project.mode)).find(tone=>CG.pitchClass(tone)===pc);return tone?CG.notation(tone):name;})}/></div></div></div>;
}
function HorizontalTimeline({children,label,playing=false,playheadBeat=-1,follow=true}){
  const scroller=useRef(null);
  const [edges,setEdges]=useState({left:false,right:false});
  const sync=()=>{const el=scroller.current;if(el)setEdges({left:el.scrollLeft>1,right:el.scrollLeft+el.clientWidth<el.scrollWidth-1});};
  useEffect(()=>{sync();const observer=new ResizeObserver(sync);observer.observe(scroller.current);return()=>observer.disconnect();},[]);
  useEffect(()=>{
    if(!playing||!follow)return;
    const el=scroller.current,cell=el?.querySelector('.roll button');
    if(!el||!cell)return;
    // Keep the live position ahead of the sticky pitch labels, moving back to
    // the start during the count-in and whenever the four-bar phrase loops.
    const scale=el.getBoundingClientRect().width/el.offsetWidth||1;
    const stepWidth=cell.getBoundingClientRect().width/scale+1;
    const cells=Array.from(el.querySelectorAll('.roll button[data-cell-beat]'));
    const live=cells.find(c=>playheadBeat>=Number(c.dataset.cellBeat)&&playheadBeat<Number(c.dataset.cellBeat)+Number(c.dataset.cellDuration))||cell;
    const position=(live.getBoundingClientRect().left-el.getBoundingClientRect().left)/scale+el.scrollLeft+Math.max(0,Math.min(1,(playheadBeat-Number(live.dataset.cellBeat))/Number(live.dataset.cellDuration)))*stepWidth;
    const target=Math.max(0,Math.min(el.scrollWidth-el.clientWidth,position-48-(el.clientWidth-48)*.35));
    el.scrollLeft=target;
    sync();
  },[playing,playheadBeat,follow]);
  return <div className="melody-timeline-frame"><div ref={scroller} className="melody-timeline-scroll" role="region" aria-label={label} tabIndex="0" onScroll={sync}>{children}</div><span className={`timeline-edge timeline-edge-left ${edges.left?'is-visible':''}`} aria-hidden="true"/><span className={`timeline-edge timeline-edge-right ${edges.right?'is-visible':''}`} aria-hidden="true"/></div>;
}
function SymbolSelect({label,value,options,onChange}){
  const selected=options.find(option=>option.value===value)||options[0];
  return <details className={`symbol-select ${label==='Metre'?'symbol-select-up':''}`}><summary role="button" aria-label={`${label}: ${selected.label}`}>{selected.icon?<img src={selected.icon} alt="" aria-hidden="true"/>:<span>{selected.label}</span>}</summary><div className="symbol-select-menu" role="menu" aria-label={label}>{options.map(option=><button key={option.value} role="menuitemradio" aria-checked={value===option.value} aria-label={option.label} onClick={e=>{onChange(option.value);e.currentTarget.closest('details').open=false;}}>{option.icon?<img src={option.icon} alt="" aria-hidden="true"/>:<span>{option.label}</span>}</button>)}</div></details>;
}
function StudioHelp({host,tab,allView=false}){
  const [items,setItems]=useState([]);
  useEffect(()=>{
    const layout=()=>{
      const root=host.current;if(!root)return;
      const bounds=root.getBoundingClientRect(),scale=bounds.width/root.clientWidth||1,width=root.clientWidth;
      const boxWidth=280,columns=[24,(width-boxWidth)/2,width-boxWidth-24];
      const specs=[
        ['.studio-menu-buttons','File & Customise','Start or open a session and download MIDI in File. Set the key, tempo, metre, swing and 4 or 8 bars in Customise, or load a melody and chords with Template.',0,96],
        ['.composition-toolbar>.tabs','Choose a Part','Switch between Chords, Melody and Drums to build each part of your session.',1,96],
        ['.composition-playback','Playback & Tools','Play or stop the whole session. Undo and Redo restore edits; Fullscreen gives you more space.',2,96]
      ];
      if(tab==='Chords')specs.push(
        ['select[aria-label="Accompaniment"]','Accompaniment','Choose the rhythm used by the chords and bass. The dropdown explains each pattern.',0,240],
        ['.progression-grid','Chord Bars','Click a chord to hear and select it. Click it again to edit it or add a second chord for the second half of the bar.',1,240],
        [allView?'.all-chord-panel .composition-heading-actions':'.progression-panel .composition-heading-actions','Randomise & Clear','Randomise chooses a new progression in your key. Clear empties the chord bars.',2,240],
        ['.scale-chords','Chords in Your Key','Select a black chord bar first, then choose a chord here to replace it. Click away to deselect the bar.',1,410]
      );
      if(tab==='Melody')specs.push(
        ['.note-editor-panel .composition-instrument-toolbar','Melody Controls','Notes limits the available pitches. Octave moves the keyboard and your notes. Instrument changes the sound; Sustain holds released keys.',0,240],
        ['.melody-timeline-frame','Edit Your Melody','Click to add or remove a note. Drag a note to move its pitch or beat; drag its right edge to change its length. Scroll sideways to see later bars.',1,400],
        ['.note-editor-panel .composition-heading-actions','Record & Clear','Record gives a count-in, then records the piano, A–P keys or a MIDI keyboard. Hold a key for a longer note. Clear removes your melody.',2,240],
        ['main.cg>.piano','Play the Piano','Use the on-screen keys, A–P keys or a connected MIDI keyboard. Melody edits keep playback running.',1,'keyboard']
      );
      if(tab==='Drums')specs.push(
        ['.drum-grid','Build a Drum Pattern','Click a square to add or remove a hit. Drag across a row to paint hits. Shift-click or right-click to change a hit’s strength.',1,400],
        ['.drum-editor-panel .composition-heading-actions','Randomise & Clear','Choose All to edit the pattern throughout, or choose a bar to customise it. Randomise and Clear affect your selection. Reset to \'All\' Pattern removes a bar’s custom pattern.',2,240],
        ['.drum-track','Hear Each Drum','Click a drum name to preview its sound. The highlighted column shows the current playback position.',0,560]
      );
      if(allView){for(const spec of specs){if(spec[1]==='File & Customise')spec[2]='View the score or download MIDI and audio in File. All view is read-only; select a section to change its settings.';if(spec[1]==='Chord Bars')spec[2]='All sections appear in order with continuous bar numbers. Select an individual section to edit its chords.';if(spec[1]==='Melody Controls')spec[2]='View the combined melody. Select an individual section to change instruments or notes.';if(spec[1]==='Edit Your Melody')spec[2]='Scroll sideways to view later bars. Select an individual section to edit notes.';if(spec[1]==='Build a Drum Pattern')spec[2]='View the drum hits for each bar. Choose a bar with Pattern; select an individual section to edit its drums.';if(spec[1]==='Record & Clear'||spec[1]==='Randomise & Clear'){spec[1]='View Only';spec[2]='Select an individual section to change its music. All view keeps the complete composition together for viewing and playback.';}}}
      setItems(specs.flatMap(([selector,title,text,column,y])=>{
        const element=selector==='main.cg>.piano'?root.querySelector(':scope>.piano'):root.querySelector(selector);
        if(!element)return [];
        const rect=element.getBoundingClientRect();
        const targetX=(rect.left-bounds.left+rect.width/2)/scale,targetY=(rect.top-bounds.top+rect.height/2)/scale;
        return [{title,text,x:columns[column],y:y==='keyboard'?(rect.top-bounds.top)/scale+30:y,targetX,targetY,width:boxWidth}];
      }));
    };
    layout();const observer=new ResizeObserver(layout);observer.observe(host.current);window.addEventListener('resize',layout);
    return()=>{observer.disconnect();window.removeEventListener('resize',layout);};
  },[host,tab,allView]);
  return <div className="studio-help-overlay" role="region" aria-label="Composition Studio help"><p className="studio-help-dismiss">Click, tap, type or scroll to close help.</p><svg className="studio-help-lines" aria-hidden="true">{items.map(item=><g key={item.title}><line x1={item.x+item.width/2} y1={item.y+30} x2={item.targetX} y2={item.targetY}/><circle cx={item.targetX} cy={item.targetY} r="4"/></g>)}</svg>{items.map(item=><div key={item.title} className="studio-help-callout" style={{left:item.x,top:item.y,width:item.width}}><strong>{item.title}</strong><p>{item.text}</p></div>)}</div>;
}
function CompositionEditor({initialProject,onProjectChange,sectionName,sectionControls,onNewComposition,onOpenComposition,exportProject,customiseRequest}) {
  const studio = useRef(null);
  const [downloadName,setDownloadName] = useState('');
  const [downloadReturnModal,setDownloadReturnModal] = useState(null);
  const [openMenu,setOpenMenu] = useState(null);
  useEffect(()=>{if(customiseRequest)setOpenMenu('Customise');},[customiseRequest]);
  const menuAnchor = useRef(null);
  const [fullscreen,setFullscreen] = useState(false);
  const [helpVisible,setHelpVisible]=useState(false);
  const helpDismissedByButton=useRef(false);
  useEffect(()=>{
    if(!helpVisible)return;
    const dismiss=event=>{
      if(event.target instanceof Element&&event.target.closest('.studio-help-toggle')&&(event.type==='pointerdown'||event.key==='Enter'||event.key===' '))helpDismissedByButton.current=true;
      setHelpVisible(false);
    };
    document.addEventListener('pointerdown',dismiss,true);document.addEventListener('keydown',dismiss,true);document.addEventListener('wheel',dismiss,{capture:true,passive:true});document.addEventListener('touchmove',dismiss,{capture:true,passive:true});
    return()=>{document.removeEventListener('pointerdown',dismiss,true);document.removeEventListener('keydown',dismiss,true);document.removeEventListener('wheel',dismiss,true);document.removeEventListener('touchmove',dismiss,true);};
  },[helpVisible]);

  useEffect(()=>{
    const sync=()=>setFullscreen(document.fullscreenElement===studio.current);
    document.addEventListener('fullscreenchange',sync);
    return ()=>document.removeEventListener('fullscreenchange',sync);
  },[]);
  async function toggleFullscreen(){
    try {
      if(document.fullscreenElement===studio.current)await document.exitFullscreen();
      else await studio.current.requestFullscreen();
      setModal(null);
    }catch(e){setError(e.message);}
  }

  const [project, setProject] = useState(()=>({...CG.asStudio(initialProject||load()),instrument:'piano'})),
    [tempoDraft,setTempoDraft] = useState(()=>String(project.tempo)),
    [selected, setSelected] = useState([0, 0]),
    [chordSelectionVisible, setChordSelectionVisible] = useState(false),
    [tab, setTab] = useState(savedStudioTab),
    [modal, setModal] = useState(null),
    [notice, setNotice] = useState(''),
    [error, setError] = useState(''),
    [playing, setPlaying] = useState(false),
    [playMode, setPlayMode] = useState('composition'),
    [playingLength, setPlayingLength] = useState(0),
    [loading, setLoading] = useState(false),
    [beat, setBeat] = useState(-1),
    [recording, setRecording] = useState(false),
    [page, setPage] = useState(0),
    [editorBar,setEditorBar] = useState(0),
    [bassFilter,setBassFilter]=window.MLH.useProfileState("studioBassFilter",'scale'),
    [sustain,setSustain]=window.MLH.useProfileState("studioSustain",false),
    [pendingPattern,setPendingPattern]=useState(null),
    [pendingHarmony,setPendingHarmony]=useState(null),
    [draft, setDraft] = useState('C'),
    [editorChordRoot,setEditorChordRoot]=useState(''),
    [editorChordQuality,setEditorChordQuality]=useState(null),
    [shareUrl, setShareUrl] = useState(''),
    [historyState, setHistoryState] = useState(0),
    [melodyFilter, setMelodyFilter] = window.MLH.useProfileState("studioMelodyFilter",'scale'),
    [velocity, setVelocity] = window.MLH.useProfileState("studioVelocity",120);
  const ref = useRef(project),
    player = useRef(new CA.Player()),
    history = useRef([]),
    future = useRef([]),
    drag = useRef(null),
    openFile = useRef(null),
    midiFile = useRef(null),
    recordRef = useRef(false),
    midiAccess = useRef(null),
    midiCleanup = useRef(null),
    midiDisposed = useRef(false),
    savedTimer = useRef(null),
    lastTap = useRef([]),
    playAttempt = useRef(0),
    noteHandler = useRef(null),
    releaseHandler = useRef(null),
    heldNotes = useRef(new Map()),
    keyboardNotes = useRef(new Map()),
    sustainRef = useRef(sustain),
    resizeCleanup = useRef(null),
    suppressGridClick = useRef(false),
    progressionShuffle = useRef(null);
  if (!progressionShuffle.current) progressionShuffle.current = CG.createProgressionShuffler();
  const [activeMelody,setActiveMelody]=useState('main'),[melodyMore,setMelodyMore]=useState(false);
  const melodyLanes=CG.melodyLanes(project),melodyLane=melodyLanes.find(l=>l.id===activeMelody)||melodyLanes[0];
  const laneNotes=(p,id=melodyLane.id)=>p.melody.filter(n=>(n.layerId||'main')===id);
  const putLane=(p,notes,id=melodyLane.id)=>{p.melody=[...p.melody.filter(n=>(n.layerId||'main')!==id),...notes.map(n=>id==='main'?n:{...n,layerId:id})].sort((a,b)=>a.beat-b.beat);return p;};
  useEffect(()=>{if(!melodyMore)return;const close=e=>{if(e.type==='keydown'?e.key==='Escape':!e.target.closest('.melody-more-anchor,.melody-more-menu'))setMelodyMore(false);};document.addEventListener('pointerdown',close);document.addEventListener('keydown',close);return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',close);};},[melodyMore]);
  const editingBass=tab==='Bass',noteTrack=editingBass?'bass':'melody',editorOctave=editingBass?2:(project.melodyOctave??4),editorFilter=editingBass?bassFilter:melodyFilter;
  const editorOctaves=project.melodyDisplayOctaves===2?2:1;
  const bassNotes=useMemo(()=>Array.isArray(project.bass)?project.bass:CA.events({...project,bass:null}).filter(n=>n.track==='bass').map(({beat,duration,midi})=>({beat,duration,midi,velocity:102})),[project]);
  const editorNotes=editingBass?bassNotes:laneNotes(project),allEditorNotes=editingBass?bassNotes:project.melody;
  const spellingNames = CG.pitchNames(project.key,project.mode), names = spellingNames.map(CG.notation);
  const displayChord = symbol => CG.notation(CG.spellChord(symbol,project.key,project.mode));
  const noteDuration = 4 / project.quantise;
  const si = Math.min(selected[0], project.sections.length - 1),
    ci = Math.min(selected[1], project.sections[si].chords.length - 1);
  const section = project.sections[si] || project.sections[0],
    chord = section.chords[ci] || section.chords[0];
  const parsed = CG.parse(chord?.symbol || '-'),
    pitches = CG.notes(parsed, chord?.inversion || 0, chord.octave ?? project.octave ?? 4).map(n => n + (chord.transpose || 0)),
    timeline = useMemo(() => CG.timeline(project), [project]),
    total = timeline.reduce((n, e) => n + e.duration, 0),
    active = playing && playMode === 'composition' && beat >= 0 ? timeline.find(e => beat >= e.beat && beat < e.beat + e.duration) : null;
  const editorBarBeats=Number(project.timeSignature.split('/')[0])*4/Number(project.timeSignature.split('/')[1]);
  const editorBarCount=project.progressionBars||4;
  const pagedEditor=false;
  const visibleEditorBar=Math.min(editorBarCount-1,playing&&beat>=0?Math.floor(beat/editorBarBeats)%editorBarCount:editorBar);
  const pickupBeats=editingBass?0:(project.upbeatBeats||0);
  const editorStart=pagedEditor?visibleEditorBar*editorBarBeats:-pickupBeats;
  const editorBeats=pagedEditor?editorBarBeats:total;
  const editorCellBeats=Math.max(.5,4/project.quantise),editorCellsPerBar=Math.ceil(editorBarBeats/editorCellBeats);
  const pickupCells=Math.ceil(pickupBeats/editorCellBeats),editorCellCount=pickupCells+editorCellsPerBar*(pagedEditor?1:editorBarCount);
  const update = (change, undo = true) => {
    const prev = ref.current;
    let next;
    try {
      next = CG.asStudio(typeof change === 'function' ? change(structuredClone(prev)) : {
        ...prev,
        ...change
      });
      next.instrument = 'piano';
    } catch (e) {
      setError(e.message);
      return;
    }
    if (undo) {
      history.current.push(structuredClone(prev));
      if (history.current.length > 80) history.current.shift();
      future.current = [];
    }
    ref.current = next;
    setProject(next);
    if(player.current.playing&&playMode!=='drums'&&JSON.stringify(prev.melody)!==JSON.stringify(next.melody))player.current.refreshNotes?.('melody',next.melody);
    setHistoryState(x => x + 1);
    setError('');
  };
  function stop() {
    for(const midi of [...heldNotes.current.keys()])updateHeldNote(midi,true);
    playAttempt.current++;
    player.current.stop();
    setPlaying(false);
    setLoading(false);
    setBeat(-1);
    setRecording(false);
    recordRef.current = false;
  }
  function edit(change) {
    stop();
    update(change);
  }
  function editHarmony(change) {
    try {
      const previous = ref.current;
      const candidate = typeof change === 'function' ? change(structuredClone(previous)) : {...previous,...change};
      const plan = CG.planHarmonyChange(previous,candidate);
      stop();
      update(plan.changed?{...plan.project,accompaniment:null}:plan.project);
    } catch (error) {setError(error.message);}
  }
  function cancelHarmonyChange() {
    const returnModal = pendingHarmony?.returnModal || null;
    setPendingHarmony(null);setModal(returnModal);
  }
  useEffect(()=>{if(modal==='Edit chord'){setEditorChordRoot(parsed.rest?'':parsed.root);setEditorChordQuality(parsed.rest?null:parsed.quality);}},[modal,si,ci]);
  function chordEdit(changes) {
    if(!chordSelectionVisible&&modal!=='Edit chord')return;
    editHarmony(p => {
      Object.assign(p.sections[si].chords[ci], changes);
      return p;
    });
  }
  function changeMetre(signature) {
    try {
      const p = structuredClone(ref.current),
        old = Number(p.timeSignature.split('/')[0]) * 4 / Number(p.timeSignature.split('/')[1]),
        next = Number(signature.split('/')[0]) * 4 / Number(signature.split('/')[1]);
      p.timeSignature = signature;
      if (p.drums) {
        const division = Number.isInteger(next * p.drums.subdivision) ? p.drums.subdivision : 4;
        p.drums = window.MLH.DrumMachine.resizePattern(p.drums, 0, p.drums.patterns[0].bars, division, next, old);
      }
      const resized=CG.asProgression(p,p.progressionBars);
      editHarmony(()=>resized);
    } catch (e) {
      setError(e.message);
    }
  }
  function chooseTemplate(id){
    if(!id){update({templateId:null});return;}
    try{
      const next=window.MLH.CompositionTemplates.create(id);
      edit(()=>next);setSustain(false);sustainRef.current=false;setMelodyFilter('chromatic');
      setChordSelectionVisible(false);setSelected([0,0]);setEditorBar(0);setPage(0);
      setNotice('');
    }catch(error){setError(error.message);}
  }
  function choosePattern(style){if(style!==project.style||Array.isArray(project.accompaniment))edit({style,bass:null,accompaniment:null});}
  function setProgressionLength(bars){editHarmony(p=>CG.asProgression(p,bars));setSelected([0,Math.min(ci,bars-1)]);setPage(0);}
  function notify(message) {
    setNotice(message);
    clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setNotice(''), 4500);
  }
  function undo(redo = false) {
    stop();
    const from = redo ? future.current : history.current,
      to = redo ? history.current : future.current;
    if (!from.length) return;
    to.push(ref.current);
    const next = from.pop();
    ref.current = next;
    setProject(next);
    setSelected([0, 0]);
    setHistoryState(x => x + 1);
  }
  const [scoreStart,setScoreStart]=useState(null);
  async function play(record = false, drumsOnly = false, startBeat = null) {
    resizeCleanup.current?.();
    if (playing || loading) {
      const startRecording = record && !recordRef.current;
      stop();
      if (!startRecording) return;
    }
    setError('');
    const attempt = ++playAttempt.current;
    setLoading(true);
    try {
      const p = CG.validate({...ref.current,loop:true});
      if (drumsOnly) Object.assign(p, drumOnlyProject(p));
      if (record) {
        history.current.push(structuredClone(ref.current));
        future.current = [];
        setHistoryState(x => x + 1);
      }
      setPlayMode(drumsOnly ? 'drums' : 'composition');
      setPlayingLength(CG.totalBeats(p));
      recordRef.current = record;
      setRecording(record);
      await player.current.play(p, setBeat, () => {
        setPlaying(false);
        setRecording(false);
        recordRef.current = false;
        setBeat(-1);
      }, {recording:record,startBeat});
      if (attempt !== playAttempt.current) return;
      setPlaying(player.current.playing);
    } catch (e) {
      if (attempt !== playAttempt.current) return;
      stop();
      setError(e.message);
    } finally {
      if (attempt === playAttempt.current) setLoading(false);
    }
  }
  function previewChord() {
    CA.preview(pitches, project.instrument).catch(e => setError(e.message));
  }
  function absoluteRecordingBeat(){
    const p=player.current,elapsed=p.context.currentTime-p.startedAt;
    return Math.floor((elapsed-(p.minimumSeconds||0))/p.songSeconds)*(CG.totalBeats(ref.current)+(ref.current.upbeatBeats||0))+p.beat;
  }
  function updateHeldNote(midi,finish=false){
    const held=heldNotes.current.get(midi);if(!held)return;
    if(held.id&&player.current.playing){
      const span=CG.heldNoteSpan(held.start,absoluteRecordingBeat(),CG.totalBeats(ref.current),held.quantise,-(ref.current.upbeatBeats||0));
      const index=ref.current.melody.findIndex(n=>n.recordingId===held.id);
      if(index>=0&&ref.current.melody[index].duration!==span.duration)update(p=>{const notes=laneNotes(p,held.layerId),at=notes.findIndex(n=>n.recordingId===held.id);return putLane(p,CG.resizeNote(notes,at,span.duration,CG.totalBeats(p),held.quantise),held.layerId);},false);
    }
    if(finish){held.preview?.release();heldNotes.current.delete(midi);}
  }
  function releaseNote(midi){
    const held=heldNotes.current.get(midi);
    if(held&&sustainRef.current){held.keyReleased=true;return;}
    updateHeldNote(midi,true);
  }
  function toggleSustain(){
    const next=!sustainRef.current;sustainRef.current=next;setSustain(next);
    if(!next)for(const [midi,held] of heldNotes.current)if(held.keyReleased)updateHeldNote(midi,true);
  }
  function shiftMelodyOctave(delta){
    for(const midi of [...heldNotes.current.keys()])updateHeldNote(midi,true);
    update(p=>{const shifted=CG.shiftMelodyOctave({...p,melody:laneNotes(p)},delta);p.melodyOctave=shifted.melodyOctave;return putLane(p,shifted.melody);});
  }
  function note(n) {
    if(tab==='Drums'){window.dispatchEvent(new CustomEvent('mlh-drum-midi',{detail:{midi:n}}));return;}
    if(tab==='Melody'&&!allowedPitch(n))return;
    if(heldNotes.current.has(n)){if(!heldNotes.current.get(n).keyReleased)return;updateHeldNote(n,true);}
    const preview=CA.previewHeld([n],melodyLane.instrument);preview.ready.catch(e=>setError(e.message));
    const held={preview};heldNotes.current.set(n,held);
    if(recordRef.current&&player.current.playing&&player.current.context.currentTime>=(player.current.playbackAt??player.current.startedAt)){
      held.layerId=melodyLane.id;held.quantise=ref.current.quantise;held.start=absoluteRecordingBeat();held.id=`${Date.now()}-${n}-${Math.random()}`;
      const span=CG.heldNoteSpan(held.start,held.start,CG.totalBeats(ref.current),held.quantise,-(ref.current.upbeatBeats||0));
      update(p=>{p.melody.push({...span,midi:n,velocity,recordingId:held.id,...(held.layerId==='main'?{}:{layerId:held.layerId})});return p;},false);
    }
  }
  function startNoteResize(e,note){
    if(playing||player.current.playing)return;
    e.preventDefault();e.stopPropagation();resizeCleanup.current?.();
    history.current.push(structuredClone(ref.current));future.current=[];
    const cell=e.currentTarget.closest('button'),scroller=cell.closest('.melody-timeline-scroll');
    const width=cell.getBoundingClientRect().width+1,startX=e.clientX,startScroll=scroller.scrollLeft;
    suppressGridClick.current=true;
    const move=event=>{
      const rect=scroller.getBoundingClientRect();if(event.clientX>rect.right-24)scroller.scrollLeft+=12;else if(event.clientX<rect.left+72)scroller.scrollLeft-=12;
      const duration=note.duration+(event.clientX-startX+scroller.scrollLeft-startScroll)/width*Number(cell.dataset.cellDuration||.5);
      update(p=>{const index=laneNotes(p).findIndex(n=>n.midi===note.midi&&n.beat===note.beat);return putLane(p,CG.resizeNote(laneNotes(p),index,duration,CG.totalBeats(p),p.quantise));},false);
    };
    const end=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',end);resizeCleanup.current=null;setTimeout(()=>{suppressGridClick.current=false;},0);};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);resizeCleanup.current=end;
  }
  function startNoteMove(e,note){
    if(playing||player.current.playing)return;
    if(e.button!==0)return;
    e.preventDefault();resizeCleanup.current?.();
    e.stopPropagation();
    const cell=e.currentTarget.closest('button'),roll=cell.closest('.roll'),scroller=cell.closest('.melody-timeline-scroll');
    const width=cell.getBoundingClientRect().width+1,rowHeight=cell.getBoundingClientRect().height+1;
    const pitches=editorPitches;
    const row=pitches.indexOf(note.midi),startX=e.clientX,startY=e.clientY,startScroll=scroller.scrollLeft;
    let currentBeat=note.beat,currentMidi=note.midi,started=false;
    const move=event=>{
      if(!started&&Math.hypot(event.clientX-startX,event.clientY-startY)<5)return;
      if(!started){history.current.push(structuredClone(ref.current));future.current=[];suppressGridClick.current=true;started=true;}
      const rect=scroller.getBoundingClientRect();if(event.clientX>rect.right-24)scroller.scrollLeft+=12;else if(event.clientX<rect.left+72)scroller.scrollLeft-=12;
      const targetRow=Math.max(0,Math.min(pitches.length-1,row+Math.round((event.clientY-startY)/rowHeight)));
      const targetBeat=note.beat+(event.clientX-startX+scroller.scrollLeft-startScroll)/width*Number(cell.dataset.cellDuration||.5);
      update(p=>{const index=laneNotes(p).findIndex(n=>note.recordingId?n.recordingId===note.recordingId:n.midi===currentMidi&&n.beat===currentBeat);const moved=CG.moveNote(laneNotes(p),index,targetBeat,pitches[targetRow],CG.totalBeats(p),p.quantise,-(p.upbeatBeats||0));if(index>=0){currentBeat=moved[index].beat;currentMidi=moved[index].midi;}return putLane(p,moved);},false);
    };
    const end=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',end);resizeCleanup.current=null;if(started)setTimeout(()=>{suppressGridClick.current=false;},0);};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);resizeCleanup.current=end;
  }
  function activateChordCard(index){
    if(chordSelectionVisible&&ci===index){setModal('Edit chord');return;}
    const event=timeline.find(event=>event.sectionIndex===0&&event.chordIndex===index);
    if(event?.notes.length)CA.preview(event.notes,'piano').catch(error=>setError(error.message));
    setSelected([0,index]);setChordSelectionVisible(true);
  }
  function addChord(symbol=chord.symbol){chordEdit({symbol,inversion:0});}
  function removeChord(){chordEdit({symbol:'-',inversion:0});}
  function shiftChord(delta) {
    const to = ci + delta;
    if (to < 0 || to >= section.chords.length) return;
    editHarmony(p => {
      const a = p.sections[si].chords;
      [a[ci], a[to]] = [a[to], a[ci]];
      return p;
    });
    setSelected([si, to]);
  }
  function transpose(delta,mode=project.mode) {
    editHarmony(p => {
      p.key = (p.key + delta + 12) % 12;
      p.mode=mode;
      p.sections.forEach(s => s.chords.forEach(c => {c.symbol = CG.transpose(c.symbol, delta);if(c.secondChord)c.secondChord.symbol=CG.transpose(c.secondChord.symbol,delta);}));
      if(Array.isArray(p.bass))p.bass=p.bass.map(n=>({...n,midi:Math.max(21,Math.min(108,n.midi+delta))}));
      p.melody = p.melody.map(n => ({
        ...n,
        midi: Math.max(0, Math.min(127, n.midi + delta))
      }));
      return p;
    });
  }
  function generate(preset = 'random') {
    const symbols = preset === 'random'
      ? progressionShuffle.current(project.key, project.mode, project.progressionBars||4, project.sections[si].chords.map(chord=>chord.symbol))
      : CG.generate(project.key, project.mode, project.progressionBars||4, preset);
    editHarmony(p => {
      if (preset === 'minor') p.mode = 'minor';
      p.sections[si].chords = symbols.map(symbol => ({
        symbol,
        beats: Number(p.timeSignature.split('/')[0])*4/Number(p.timeSignature.split('/')[1]),
        inversion: 0
      }));
      return p;
    });
    setSelected([si, 0]);
    setTab('Chords');
  }
  function saveFile() {
    setDownloadName(project.title || '');
    setDownloadReturnModal(modal);
    setModal('Download MIDI');
  }
  async function importProject(file) {
    try {
      if (!file) return;
      if (file.size > 8000000) throw Error('This song file is too large.');
      const raw=/\.midi?$/i.test(file.name)?CG.importSongMidi(new Uint8Array(await file.arrayBuffer())):JSON.parse(await file.text());
      if(onOpenComposition&&(raw.items||raw.studioArrangement)){onOpenComposition(raw.studioArrangement||raw);return;}
      const p = {...fresh(),...CG.asProgression(raw),instrument:'piano'};
      if(onOpenComposition&&p.studioArrangement){onOpenComposition(p.studioArrangement);return;}
      edit(() => p);
      setSelected([0, 0]);
      setModal(null);
      notify('Song opened.');
    } catch (e) {
      setError(`Could not open project: ${e.message}`);
    } finally {
      if (openFile.current) openFile.current.value = '';
    }
  }
  async function share() {
    const url = new URL(compositionShareUrl(exportProject?exportProject(project):project));
    try {
      await navigator.clipboard.writeText(url.href);
      notify('Project link copied.');
    } catch (e) {
      setModal('Share');
      setShareUrl(url.href);
    }
  }
  async function exportAudio() {
    setModal(null);
    notify('Preparing audio…');
    try {
      const blob = await CA.wav(project);
      download(blob, `${project.title || 'Progression'}.wav`);
      notify('Audio exported.');
    } catch (e) {
      setError(e.message);
    }
  }
  const writingPitches = useMemo(()=>new Set(CG.writingPitchClasses(project,editorFilter)),[project,editorFilter]);
  function allowedPitch(n) {return writingPitches.has((n%12+12)%12);}
  const editorPitches=CG.pianoRollPitches(allEditorNotes,editorOctave,allowedPitch,editorOctaves);
  async function importMidi(file) {
    try {
      if (!file) return;
      if (file.size > 2000000) throw Error('MIDI file is too large.');
      const melody = CG.importMidi(new Uint8Array(await file.arrayBuffer()));
      if (!melody.length) throw Error('No pitched notes were found.');
      edit(p => {
        p.melody = melody;
        const end = Math.max(...melody.map(n => n.beat + n.duration));
        while (CG.totalBeats(p) < end && p.sections[0].chords.length < 128) p.sections[0].chords.push({
          symbol: '-',
          beats: 4,
          inversion: 0
        });
        return p;
      });
      setTab('Melody');
      setModal(null);
      notify('MIDI melody imported.');
    } catch (e) {
      setError(e.message);
    } finally {
      if (midiFile.current) midiFile.current.value = '';
    }
  }
  async function exportHtml() {
    try {
      const blob = await CA.wav(project),
        reader = new FileReader();
      reader.onload = () => {
        const title = safeName.replace(/[&<>"]/g, c => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;'
        })[c]);
        const chords = project.sections.map(s => '<section><h2>' + s.name.replace(/[&<>]/g, '') + '</h2><p>' + s.chords.map(c => c.symbol.replace(/[&<>]/g, '')).join(' · ') + '</p></section>').join('');
        const html = '<!doctype html><html lang="en"><meta charset="utf-8"><title>' + title + '</title><style>body{font:18px system-ui;max-width:900px;margin:60px auto;padding:24px;color:#111}section{border:1px solid #ddd;border-radius:16px;padding:20px;margin:20px 0}audio{width:100%}</style><h1>' + title + '</h1><p>Created with The Music Learning Hub</p><audio controls src="' + reader.result + '"></audio>' + chords + '</html>';
        download(html, safeName + '.html', 'text/html');
        notify('Playable HTML exported.');
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      setError(e.message);
    }
  }
  async function enableMidi(quiet = false) {
    try {
      if (!navigator.requestMIDIAccess) { if (quiet) return; throw Error('MIDI input is not supported in this browser.'); }
      const access = await navigator.requestMIDIAccess({sysex:false});
      if(midiDisposed.current)return;
      midiCleanup.current?.();
      midiAccess.current = access;
      midiCleanup.current=window.MLH.connectMidiKeyboards(access,n=>noteHandler.current?.(n),n=>releaseHandler.current?.(n));
      if (!quiet) notify(access.inputs.size ? 'MIDI keyboard connected.' : 'MIDI enabled. Connect a keyboard to play.');
    } catch (e) {
      if (!quiet) setError(e.message);
    }
  }
  useEffect(()=>{setTempoDraft(String(project.tempo));},[project.tempo]);
  function commitTempo(){
    const value=tempoDraft.trim()===''?project.tempo:Number(tempoDraft);
    const tempo=Number.isFinite(value)?Math.max(30,Math.min(300,value)):project.tempo;
    setTempoDraft(String(tempo));
    if(tempo!==project.tempo)edit({tempo});
  }
  function tap() {
    const now = performance.now();
    if (now - (lastTap.current.at(-1) || 0) > 2000) lastTap.current = [];
    lastTap.current.push(now);
    lastTap.current = lastTap.current.slice(-6);
    if (lastTap.current.length > 1) {
      const a = lastTap.current;
      edit({
        tempo: Math.max(30, Math.min(300, Math.round(60000 / ((a.at(-1) - a[0]) / (a.length - 1)))))
      });
    }
  }
  useEffect(()=>{try{localStorage.setItem(`${STORE}-tab`,tab);}catch{}},[tab]);
  useEffect(() => {
    ref.current = project;
    try {
      localStorage.setItem(STORE, JSON.stringify(project));
      onProjectChange?.(project);
    } catch (e) {
      setError('Your browser could not save this project. Use File → Download to keep a MIDI copy.');
    }
  }, [project]);
  useEffect(() => {
    setDraft(chord?.symbol || 'C');
  }, [chord?.symbol, si, ci]);
  useEffect(() => {
    const onKey = e => {
      if (modal === 'Edit chord' && !e.defaultPrevented && !e.target.closest('input,textarea,select,[contenteditable]')) {
        const k = 'awsedftgyhujkolp'.indexOf(e.key.toLowerCase());
        if (k >= 0 && !e.repeat && !e.metaKey && !e.ctrlKey && !e.altKey){keyboardNotes.current.set(e.code||e.key.toLowerCase(),60+k);note(60+k);}
        return;
      }
      if (tab === 'Drums' || modal || openMenu || e.defaultPrevented || e.target.closest('input,textarea,select,[contenteditable]')) return;
      if (e.code === 'Space' && !e.target.closest('button,[role=button]')) {
        e.preventDefault();
        play();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        undo(e.shiftKey);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveFile();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        addChord();
      } else if (tab === 'Chords' && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        removeChord();
      } else if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const k = 'awsedftgyhujkolp'.indexOf(e.key.toLowerCase());
        if (k >= 0 && !e.repeat){const midi=12*(editorOctave+1)+k;keyboardNotes.current.set(e.code||e.key.toLowerCase(),midi);note(midi);}
      }
    };
    const onUp=e=>{const key=e.code||e.key.toLowerCase(),midi=keyboardNotes.current.get(key);if(midi!==undefined){keyboardNotes.current.delete(key);releaseNote(midi);}};
    const blur=()=>{keyboardNotes.current.clear();for(const midi of [...heldNotes.current.keys()])updateHeldNote(midi,true);};
    window.addEventListener('keydown',onKey);window.addEventListener('keyup',onUp);window.addEventListener('blur',blur);
    return()=>{window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onUp);window.removeEventListener('blur',blur);};
  }, [project, selected, playing, loading, noteDuration, modal, openMenu, tab, velocity, melodyFilter, bassFilter, editorOctave]);
  useEffect(() => {
    midiDisposed.current=false;
    enableMidi(true);
    const exit = () => player.current.stop();
    window.addEventListener('pagehide', exit);
    return () => {
      exit();
      window.removeEventListener('pagehide', exit);
      midiDisposed.current=true;
      midiCleanup.current?.();
    };
  }, []);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement,
      dialog = document.querySelector('.cg .dialog');
    const items = () => [...dialog.querySelectorAll('button:not(:disabled),input:not([hidden]),select')];
    items()[0]?.focus();
    const key = e => {
      if (e.key === 'Escape') {if(modal==='Change Chords')cancelHarmonyChange();else setModal(null);}
      if (e.key === 'Tab') {
        const a = items(),
          first = a[0],
          last = a.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('keydown', key);
      previous?.focus();
    };
  }, [modal]);
  useEffect(() => {
    const closeMenus = e => {
      document.querySelectorAll('.cg details[open]').forEach(menu => {
        if (!menu.contains(e.target)) menu.open = false;
      });
    };
    document.addEventListener('pointerdown', closeMenus);
    return () => document.removeEventListener('pointerdown', closeMenus);
  }, []);
  useEffect(()=>{if(modal)setOpenMenu(null);},[modal]);
  useEffect(()=>{
    const clearChordSelection=e=>{if(!e.target.closest('.progression-grid .chord-card,.scale-chords'))setChordSelectionVisible(false);};
    document.addEventListener('pointerdown',clearChordSelection);
    document.addEventListener('focusin',clearChordSelection);
    return ()=>{document.removeEventListener('pointerdown',clearChordSelection);document.removeEventListener('focusin',clearChordSelection);};
  },[]);
  useEffect(()=>{
    if(!openMenu)return;
    const close=e=>{if(!menuAnchor.current?.contains(e.target)&&!e.target.closest('.studio-dropdown'))setOpenMenu(null);};
    const escape=e=>{if(e.key==='Escape'){e.preventDefault();menuAnchor.current?.querySelector('[aria-expanded="true"]')?.focus();setOpenMenu(null);}};
    document.addEventListener('pointerdown',close);
    document.addEventListener('keydown',escape);
    return ()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape);};
  },[openMenu]);
  noteHandler.current = note;
  releaseHandler.current=releaseNote;
  useEffect(()=>{if(!recording)return;const timer=setInterval(()=>{for(const midi of heldNotes.current.keys())updateHeldNote(midi);},50);return()=>clearInterval(timer);},[recording]);
  useEffect(()=>()=>{resizeCleanup.current?.();for(const held of heldNotes.current.values())held.preview?.release();heldNotes.current.clear();},[]);
  const safeName = project.title || 'Progression';
  return <div className={window.MLH.shell.pageShellClass}>
 <window.MLH.AppHeader icon="app-icons/composition-studio-icon.svg?v=shared-border-20261114" title="Composition Studio" subtitle="Create chords, melodies and drum patterns." profileUsesSharedSettings={false} profileShowLabel={false} profileShareUrl={compositionShareUrl(exportProject?exportProject(project):project)} profileState={{studioTab:tab,studioSustain:sustain,studioBassFilter:bassFilter,studioMelodyFilter:melodyFilter,studioVelocity:velocity}}>{sectionControls}</window.MLH.AppHeader>
 <div className={window.MLH.shell.pageContentClass}><main ref={studio} className={`${window.MLH.shell.mainShellClass} cg`}>
 <div className="toolbar composition-toolbar"><div className="row studio-menu-buttons" ref={menuAnchor}>
 <div className="hub-menu-anchor studio-menu-anchor"><button className="row" data-menu-trigger aria-expanded={openMenu==='File'} aria-controls="studio-file-menu" onClick={()=>setOpenMenu(openMenu==='File'?null:'File')}><img src="ui-icons/composition-file.svg?v=2" width="22" height="22" alt="" aria-hidden="true"/>File</button>{openMenu==='File'&&<window.MLH.MenuPanel title="File" variant="customise" dataMenuPanel className="studio-dropdown studio-file-dropdown"><window.MLH.StudioFileMenuContent onReset={()=>setModal('Reset')} onOpen={()=>{setOpenMenu(null);openFile.current.click();}} onScore={()=>{setOpenMenu(null);setModal('View Score');}} onPlan={()=>{setOpenMenu(null);setModal('View Performance Plan');}} onAudio={()=>{setOpenMenu(null);stop();setModal('Download Audio');}} onDownload={saveFile}/></window.MLH.MenuPanel>}</div>
 <div className="hub-menu-anchor studio-menu-anchor"><button className="row" data-menu-trigger aria-expanded={openMenu==='Customise'} aria-controls="studio-customise-menu" onClick={()=>setOpenMenu(openMenu==='Customise'?null:'Customise')}><img src="ui-icons/customise.svg" width="22" height="22" alt="" aria-hidden="true"/>Customise</button>{openMenu==='Customise'&&<window.MLH.MenuPanel title="Customise" variant="customise" dataMenuPanel className="studio-dropdown studio-customise-dropdown"><window.MLH.StudioCustomiseFields project={project} names={names} tempoDraft={tempoDraft} onTempoChange={setTempoDraft} onTempoCommit={commitTempo} onTap={tap} onKeyChange={(key,mode)=>transpose(key-project.key,mode)} onMetreChange={changeMetre} onBarsChange={bars=>{edit(p=>({...p,progressionBars:bars}));setSelected([0,0]);setEditorBar(0);}} onSwingChange={swing=>edit({swing})} onTemplateChange={chooseTemplate}/>
</window.MLH.MenuPanel>}</div>
 <button type="button" className="studio-help-toggle" aria-label="Quick Help" title="Quick Help" aria-pressed={helpVisible} onClick={()=>{if(helpDismissedByButton.current){helpDismissedByButton.current=false;return;}setOpenMenu(null);setModal(null);setHelpVisible(value=>!value);}}><img src="ui-icons/guide.svg" width="22" height="22" alt="" aria-hidden="true"/></button>
 </div><div className="tabs">{['Chords', 'Melody', 'Drums'].map(t => <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}><img src={{Chords:'ui-icons/composition-chords.svg',Bass:'ui-icons/composition-bass.svg?v=bravura',Drums:'ui-icons/drums/snare.svg',Melody:'ui-icons/composition-melody.svg'}[t]} width="22" height="22" alt="" aria-hidden="true"/>{t}</button>)}</div><div className="row composition-playback"><button className="fullscreen-toggle" aria-label={fullscreen?'Exit fullscreen':'Fullscreen'} title={fullscreen?'Exit fullscreen':'Fullscreen'} aria-pressed={fullscreen} onClick={toggleFullscreen}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d={fullscreen ? "M9 3v6H3m18 0h-6V3M3 15h6v6m6 0v-6h6" : "M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6"}/></svg></button><button title="Undo (⌘Z)" aria-label="Undo" disabled={!history.current.length} onClick={() => undo()}><img src="ui-icons/undo.svg" width="22" height="22" alt="" aria-hidden="true" /></button><button title="Redo (⇧⌘Z)" aria-label="Redo" disabled={!future.current.length} onClick={() => undo(true)}><img src="ui-icons/redo.svg" width="22" height="22" alt="" aria-hidden="true" /></button><button className="primary play" onClick={() => play()}>{loading ? 'Cancel' : <><span className={`hub-playback-glyph ${playing ? "is-stop" : "is-play"}`} aria-hidden="true"></span><span>{playing ? 'Stop' : 'Play'}</span></>}</button></div></div>


 {error && !modal && <div role="alert" className="toast error">{error}</div>}{notice && <div role="status" className="toast">{notice}</div>}
 {tab === 'Chords' && <>
 <div className="progression-panel">
 <window.MLH.CompositionOptions title="Chords" subtitle="Click a chord to select it; click it again to edit it." actions={<> <button className="row" onClick={()=>generate()}><img src="ui-icons/composition-dice.svg" width="22" height="22" alt="" aria-hidden="true"/>Randomise</button><button disabled={!section.chords.some(c=>!CG.parse(c.symbol).rest)} onClick={()=>editHarmony(p=>{p.sections[0].chords=p.sections[0].chords.map(c=>({...c,symbol:'-',inversion:0,secondChord:undefined}));return p;})}>Clear</button> </>}> <div className="row"><label className="row"><span className="muted">Accompaniment</span><span className="accompaniment-select"><span className="accompaniment-selected-name" aria-hidden="true">{Array.isArray(project.accompaniment)?'Custom':(CA.styles[project.style]||'Default').split(' - ')[0]}</span><select aria-label="Accompaniment" value={Array.isArray(project.accompaniment)?'custom':project.style} onChange={e => choosePattern(e.target.value)}>{Array.isArray(project.accompaniment)&&<option value="custom" disabled>Custom</option>}{Object.entries(CA.styles).filter(([id])=>id!=='ballad'&&CG.patternAllowed(id,project.timeSignature)).map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></span></label><button type="button" className="studio-accompaniment-edit" onClick={()=>{stop();setModal('Edit Accompaniment');}}>Edit</button></div> </window.MLH.CompositionOptions>
 <div className="chord-grid progression-grid">{section.chords.map((c,index)=><div key={index} role="button" tabIndex="0" draggable={!playing} aria-label={`Bar ${index+1}: ${displayChord(c.symbol)}, ${c.beats} beats`} aria-pressed={chordSelectionVisible&&ci===index} className={`chord-card ${c.secondChord?'has-second-chord':''} ${chordSelectionVisible&&ci===index?'selected':''} ${active?.chordIndex===index?'playing':''}`} onClick={()=>activateChordCard(index)} onKeyDown={e=>{if((e.key==='Enter'||e.key===' ')&&!e.repeat){e.preventDefault();activateChordCard(index);}}} onDragStart={()=>drag.current=index} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const from=drag.current;if(!Number.isInteger(from)||from===index)return;editHarmony(p=>{const list=p.sections[0].chords,item=list.splice(from,1)[0];list.splice(index,0,item);return p;});setSelected([0,index]);drag.current=null;}}><span className="number">Bar {index+1}</span>{chordSelectionVisible&&ci===index&&<span className="chord-edit-hint" aria-hidden="true">Edit</span>}<strong>{displayChord(c.symbol)}{c.secondChord&&<span className="second-chord-symbol">{displayChord(c.secondChord.symbol)}</span>}</strong>{c.label&&<small>{c.label}</small>}{c.inversion>0&&<span className="meta">Inversion {c.inversion}</span>}</div>)}</div>

 </div>
 <div className="row" style={{
            marginBottom: 12
          }}><span className="muted">Chords in {CG.notation(CG.keyName(chord.suggestionKey ?? project.key, chord.suggestionScale || project.mode))} {(chord.suggestionScale || project.mode).replace(/([A-Z])/g, ' \u00241').toLowerCase()}</span></div><div className="scale-chords">{CG.studioDiatonic(chord.suggestionKey ?? project.key, chord.suggestionScale || project.mode).map(c => <button key={c.degree} disabled={!chordSelectionVisible} onClick={() => addChord(c.symbol)}><small>{c.roman}</small>{CG.notation(c.symbol)}</button>)}</div>
 </>}
 {tab === 'Drums' && <window.MLH.DrumMachineView project={project} playing={playing} beat={beat} onPlay={() => play(false, true)} onStop={stop} onExport={async type => {
          try {
            const p = drumOnlyProject(ref.current);
            if (type === 'midi') download(CG.midiEvents(p, CA.events(p)), (p.title || 'Drums') + '-drums.mid', 'audio/midi');else {
              notify('Preparing drum audio…');
              download(await CA.wav(p), (p.title || 'Drums') + '-drums.wav');
              notify('Drum audio exported.');
            }
          } catch (e) {
            setError(e.message);
          }
        }} onChange={drums => {
          if(playing||player.current.playing)return;
          const D = window.MLH.DrumMachine,
            bpb = Number(project.timeSignature.split('/')[0]) * 4 / Number(project.timeSignature.split('/')[1]);
          if (project.drums && D.sequenceBeats(project.drums, bpb) !== D.sequenceBeats(drums, bpb)) stop();
          update(p => ({
            ...p,
            drums,
            drumPattern: null
          }));
          player.current.refreshDrums?.(drums);
        }} />}
 {['Melody','Bass'].includes(tab) && <><div className={`note-editor-panel ${editorOctaves===2?'two-octave-display':''}`} style={{'--melody-roll-height':`${Math.max(editorOctaves===2?640:325,45+editorPitches.length*35)}px`}}><window.MLH.CompositionOptions title={editingBass?'Bass':'Melody'} subtitle="Click a square to add a note; click it again to remove it." actions={<>  <button className="melody-record" onClick={() => play(true)}>{recording ? <><span className="hub-playback-glyph is-stop" aria-hidden="true"></span><span>Stop</span></> : '● Record'}</button><button disabled={playing||!editorNotes.length} onClick={() => {if(playing||player.current.playing)return;update(p=>editingBass?{...p,bass:[]}:putLane(p,[]));}}>Clear</button> </>}> <div className="row"><label className="option-field">Instrument<select aria-label="Melody instrument" value={melodyLane.instrument} onChange={e=>{const instrument=e.target.value;update(p=>melodyLane.id==='main'?{...p,melodyInstrument:instrument}:{...p,counterMelodies:p.counterMelodies.map(l=>l.id===melodyLane.id?{...l,instrument}:l)});const ready=player.current.playing?player.current.setMelodyInstrument?.(instrument,melodyLane.id):window.MLH.MelodySampler.preload(instrument);ready?.catch(error=>setError(error.message));}}>{Object.entries({piano:'Piano',electricpiano:'Electric Piano',guitar:'Guitar',organ:'Organ',strings:'Strings',flute:'Flute',marimba:'Marimba',brass:'Brass',synth:'Synth',pad:'Pad'}).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>Notes <select aria-label={editingBass?'Bass notes':'Melody scale filter'} value={editorFilter} onChange={e => editingBass?setBassFilter(e.target.value):setMelodyFilter(e.target.value)}>{['scale', 'chromatic', 'pentatonic', 'blues'].map(v => <option key={v} value={v}>{v[0].toUpperCase()+v.slice(1)}</option>)}</select></label><div className="melody-octave-controls" role="group" aria-label="Melody octave"><span className="muted" aria-live="polite">Octave • {editorOctave}</span><div className="row"><button type="button" aria-label="Octave down" disabled={editorOctave<=2||editorNotes.some(n=>n.midi-12<21)} onClick={()=>shiftMelodyOctave(-1)}>−</button><button type="button" aria-label="Octave up" disabled={editorOctave>=6||editorNotes.some(n=>n.midi+12>108)} onClick={()=>shiftMelodyOctave(1)}>+</button></div></div><div className="melody-range-controls"><span className="muted">Range</span><button type="button" aria-label="Octave range" aria-pressed={editorOctaves===2} title={`${editorOctaves} ${editorOctaves===1?'octave':'octaves'}`} onClick={()=>{resizeCleanup.current?.();update({melodyDisplayOctaves:editorOctaves===2?1:2});}}>{editorOctaves}</button></div><label className="option-field melody-shortest-rhythm"><span>Quantise</span><select aria-label="Quantise" value={project.quantise} onChange={e=>update({quantise:Number(e.target.value)})}>{[[2,'Minim (1/2)'],[4,'Crotchet (1/4)'],[8,'Quaver (1/8)'],[16,'Semiquaver (1/16)']].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><div className="melody-sustain-controls"><span className="muted">Sustain</span><button type="button" aria-label="Sustain" aria-pressed={sustain} onClick={toggleSustain}>{sustain?'On':'Off'}</button></div>{!editingBass&&<div className="hub-menu-anchor melody-more-anchor"><button type="button" className="melody-more-button" aria-label="More melody options" aria-haspopup="true" aria-expanded={melodyMore} onClick={()=>setMelodyMore(!melodyMore)}>⋯</button>{melodyMore&&<window.MLH.MenuPanel title="More" variant="customise" className="studio-dropdown melody-more-menu"><label className="hub-toggle-row"><span>Anacrusis</span><select aria-label="Anacrusis length" disabled={playing||loading} value={project.upbeatBeats||0} onChange={e=>{const upbeatBeats=Number(e.target.value);update({upbeatBeats});}}>{[0,.5,1,1.5,2,2.5,3,3.5].filter(n=>n===0||n<editorBarBeats).map(n=><option key={n} value={n} disabled={project.melody.some(note=>note.beat<-n)}>{n===0?'None':n}</option>)}</select></label><button className="hub-toggle-row" disabled={playing||loading||melodyLanes.length>=4} onClick={()=>{let number=1;while(project.counterMelodies?.some(l=>l.id==='counter-'+number))number++;const id='counter-'+number;update({counterMelodies:[...(project.counterMelodies||[]),{id,name:'Countermelody'+(number>1?' '+number:''),instrument:'piano'}]});setActiveMelody(id);setMelodyMore(false);}}>＋ Add Countermelody</button>{melodyLane.id!=='main'&&<><button className="hub-toggle-row studio-section-delete" disabled={playing} onClick={()=>{update(p=>({...p,counterMelodies:p.counterMelodies.filter(l=>l.id!==melodyLane.id),melody:p.melody.filter(n=>(n.layerId||'main')!==melodyLane.id)}));setActiveMelody('main');setMelodyMore(false);}}>Remove Countermelody</button></>}</window.MLH.MenuPanel>}</div>} </div>{pagedEditor&&editorBarCount>1&&<div className="row note-bar-switcher" role="group" aria-label={`${editingBass?'Bass':'Melody'} bar navigation`}><button aria-label="Previous note bar" disabled={visibleEditorBar===0||playing} onClick={()=>setEditorBar(visibleEditorBar-1)}>←</button><span className="muted" aria-live="polite">Bar {visibleEditorBar+1} / {editorBarCount}</span><button aria-label="Next note bar" disabled={visibleEditorBar>=editorBarCount-1||playing} onClick={()=>setEditorBar(visibleEditorBar+1)}>→</button></div>}
 </window.MLH.CompositionOptions>{!editingBass&&melodyLanes.length>1&&<div className="melody-layer-tabs" role="group" aria-label="Melodies">{melodyLanes.map(lane=><button key={lane.id} type="button" aria-pressed={lane.id===melodyLane.id} onClick={()=>{for(const midi of [...heldNotes.current.keys()])updateHeldNote(midi,true);setActiveMelody(lane.id);}}><span className="melody-layer-dot" style={{background:lane.color}}/>{lane.name}</button>)}</div>}<HorizontalTimeline label={editingBass?'Bass timeline':'Melody timeline'} playing={playing} playheadBeat={beat-editorStart} follow={!resizeCleanup.current}><div className="melody-timeline" style={{minWidth:50+editorCellCount*57}}><div className="melody-beat-ruler" aria-label="Bar positions" style={{gridTemplateColumns:`48px repeat(${editorCellCount},minmax(56px,1fr))`}}><span/>{pickupCells>0&&<span className="melody-upbeat-label" style={{gridColumn:`span ${pickupCells}`}}>Anacrusis</span>}{Array.from({length:editorBarCount},(_,index)=><span key={index} className={index>0||pickupCells>0?'bar-start':''} style={{gridColumn:`span ${editorCellsPerBar}`}}>Bar {index+1}</span>)}</div><div className={`roll ${playing?'is-playing':''}`} style={{
            gridTemplateColumns: `48px repeat(${editorCellCount},minmax(56px,1fr))`
          }}>{editorPitches.map(midi => {
              return <React.Fragment key={midi}><span className="pitch">{names[midi % 12]}</span>{Array.from({
                  length: editorCellCount
                }, (_, col) => {
                  const regularCol=col-pickupCells,localBeat=col<pickupCells?-pickupBeats+col*editorCellBeats:Math.floor(regularCol/editorCellsPerBar)*editorBarBeats+(regularCol%editorCellsPerBar)*editorCellBeats;
                  const b=localBeat,cellDuration=col<pickupCells?Math.min(editorCellBeats,-b):Math.min(editorCellBeats,editorBarBeats-(regularCol%editorCellsPerBar)*editorCellBeats),segments=CG.rollCellSegments(allEditorNotes,midi,b,cellDuration);
                  return <button key={col} data-cell-beat={localBeat-editorStart} data-cell-duration={cellDuration} title="Click to add or remove a note" disabled={playing||b>=total||(!allowedPitch(midi)&&!segments.length)} aria-label={`${names[midi%12]}${Math.floor(midi/12)-1}, ${b<0?'anacrusis '+(b+pickupBeats+1):'beat '+(b+1)}`} aria-pressed={segments.length>0} className={`${segments.length?'on':''} ${col>0&&b%editorBarBeats===0?'bar-start':''} ${playing&&beat>=b&&beat<b+cellDuration?'current':''}`} onClick={e=>{
                    if(playing||player.current.playing||suppressGridClick.current)return;
                    const block=e.target.closest('.melody-note-block');if(block?.dataset.layer&&block.dataset.layer!==melodyLane.id){setActiveMelody(block.dataset.layer);return;}const clicked=block?Number(block.dataset.noteBeat):null;
                    const rect=e.currentTarget.getBoundingClientRect(),offset=project.quantise===16&&e.detail!==0&&e.clientX>=rect.left+rect.width/2 ? .25 : 0;
                    const target=CG.quantiseBeat(b+offset,b<0?Math.max(8,project.quantise):project.quantise,-pickupBeats);
                    const found=clicked!==null?editorNotes.find(n=>n.midi===midi&&n.beat===clicked):editorNotes.find(n=>n.midi===midi&&target>=n.beat&&target<n.beat+n.duration);
                    update(p=>{
                      if(editingBass&&!Array.isArray(p.bass))p.bass=structuredClone(bassNotes);
                      const notes=found?editorNotes.filter(n=>!(n.midi===midi&&n.beat===found.beat)):CG.placeNote(editorNotes,b+offset,midi,total,b<0?Math.max(8,p.quantise):p.quantise,velocity,-pickupBeats);if(editingBass)p.bass=notes;else putLane(p,notes);
                      return p;
                    });
                    if(!found)CA.preview([midi],melodyLane.instrument,'melody').catch(e=>setError(e.message));
                  }}>{segments.map(({note,left,width,continuation,ends})=><span key={(note.layerId||'main')+':'+note.beat} data-layer={note.layerId||'main'} data-note-beat={note.beat} className={`melody-note-block ${continuation?'is-continuation':''} ${playing&&beat>=note.beat&&beat<note.beat+note.duration?'is-sounding':''}`} style={{left:`${left}%`,width:`${width}%`,background:melodyLanes.find(l=>l.id===(note.layerId||'main'))?.color||'#111',...(melodyLanes.length>1?{opacity:(note.layerId||'main')===melodyLane.id?1:.25,zIndex:(note.layerId||'main')===melodyLane.id?2:1,pointerEvents:(note.layerId||'main')===melodyLane.id?'auto':'none'}:{})}} title="Drag to move; drag the right edge to resize" onPointerDown={e=>{if((note.layerId||'main')!==melodyLane.id){e.stopPropagation();return;}startNoteMove(e,note);}}>{ends&&(note.layerId||'main')===melodyLane.id&&<span className="melody-note-resize" role="separator" aria-label={`Resize ${names[midi%12]} note`} title="Drag to change note length" onPointerDown={e=>startNoteResize(e,note)} onClick={e=>{e.preventDefault();e.stopPropagation();}}/>}</span>)}</button>;
                })}</React.Fragment>;
            })}</div></div></HorizontalTimeline></div><Piano notes={playing?editorNotes.filter(n=>beat>=n.beat&&beat<n.beat+n.duration).map(n=>n.midi):[]} onNote={note} onPrepare={()=>CA.prepareHeldPreview(Array.from({length:editorOctaves*12+1},(_,i)=>12*(editorOctave+1)+i),melodyLane.instrument).catch(error=>setError(error.message))} onRelease={releaseNote} pitchLabels={names} octave={editorOctave} octaves={editorOctaves} isPitchAllowed={allowedPitch} /><p className="key-hint">Play your {editingBass?'bass line':'melody'} by using the on-screen piano, A–P keys or a connected MIDI keyboard.</p></>}
 {tab === 'Result' && <><h2>Arrangement</h2><p className="muted">Chords, bass, drums and melody across the complete progression.</p><div style={{
            marginTop: 24,
            overflow: 'auto'
          }}><svg viewBox={`0 0 1000 320`} width="100%" role="img" aria-label="Arrangement piano roll">{Array.from({
                length: 9
              }, (_, i) => <g key={i}><line x1="45" x2="995" y1={i * 34 + 20} y2={i * 34 + 20} stroke="#e7e5e4" /><text x="0" y={i * 34 + 24} fontSize="10" fill="#78716c">{96 - i * 8}</text></g>)}{CA.events(project).map((e, i) => <rect key={i} x={45 + e.beat / total * 950} y={20 + (96 - e.midi) / 8 * 34} width={Math.max(2, e.duration / total * 950)} height="4" rx="2" fill={{
                chords: '#111',
                bass: '#78716c',
                melody: '#16a34a',
                drums: '#c7a36f',
                click: '#ddd'
              }[e.track]} />)}{playing && <line x1={45 + beat / total * 950} x2={45 + beat / total * 950} y1="0" y2="320" stroke="#16a34a" />}</svg></div><div className="row muted"><span>● Chords</span><span style={{
              color: '#78716c'
            }}>● Bass</span><span style={{
              color: '#c7a36f'
            }}>● Drums</span><span style={{
              color: '#16a34a'
            }}>● Melody</span></div></>}
 <input ref={midiFile} type="file" accept=".mid,.midi,audio/midi" hidden onChange={e => importMidi(e.target.files[0])} /><input ref={openFile} type="file" accept=".mid,.midi,audio/midi,.json,application/json" hidden onChange={e => importProject(e.target.files[0])} />
 {modal && modal!=='View Score' && modal!=='View Performance Plan' && modal!=='Download Audio' && (modalContent=>modal==='Edit Accompaniment'?ReactDOM.createPortal(<div className="cg accompaniment-editor-portal">{modalContent}</div>,document.fullscreenElement||document.body):modalContent)(<div className="sheet" onClick={e => {
          if (e.target === e.currentTarget) {if(modal==='Change Chords')cancelHarmonyChange();else setModal(null);}
        }}><div className={`dialog ${modal==='Edit chord'?'chord-editor-dialog':modal==='Edit Accompaniment'?'accompaniment-editor-dialog':modal==='Customise'?'customise-dialog':['File','Reset','Download MIDI'].includes(modal)?'file-dialog':''} ${['Change Chords','Change Accompaniment Style','Reset'].includes(modal)?'warning-dialog':''}`} role="dialog" aria-modal="true" aria-label={modal==='Reset'?'Reset':modal}><button className="dialog-close" aria-label="Close" title="Close" onClick={()=>modal==='Change Chords'?cancelHarmonyChange():setModal(null)}>×</button><h2>{modal==='Edit chord'?'Edit Chord':modal==='Reset'?'Reset':modal}</h2>{error && <p role="alert" className="toast error">{error}</p>}
 {modal==='Edit Accompaniment'&&<window.MLH.AccompanimentEditor project={project} onCancel={()=>setModal(null)} onApply={(accompaniment,settings)=>{edit({accompaniment,...settings});setModal(null);}}/>}
 {modal === 'Edit chord' && <><ChordEditorPart chord={chord} project={project} names={names} spellingNames={spellingNames} onError={setError} title={chord.secondChord?(project.timeSignature==='4/4'?'Beats 1–2':'First Half'):null} onChange={chordEdit}/>{chord.secondChord?<><ChordEditorPart chord={{...chord,...chord.secondChord,secondChord:undefined}} project={project} names={names} spellingNames={spellingNames} onError={setError} title={project.timeSignature==='4/4'?'Beats 3–4':'Second Half'} onChange={changes=>chordEdit({secondChord:{...chord.secondChord,...changes}})}/><button type="button" className="second-chord-button" onClick={()=>chordEdit({secondChord:undefined})}>Remove Second Chord</button></>:<button type="button" className="second-chord-button" onClick={()=>chordEdit({secondChord:{symbol:chord.symbol,inversion:chord.inversion||0,octave:chord.octave??project.octave}})}>Add Second Chord</button>}</>}
 {modal === 'Chord options' && <div className="editor-fields"><label><span className="label">All chord types</span><select aria-label="All chord types" value={parsed.quality} onChange={e => chordEdit({
                  symbol: CG.noteName(parsed.root || 0) + e.target.value,
                  inversion: 0
                })}>{Object.keys(CG.qualities).map(q => <option value={q} key={q}>{q || 'Major'}</option>)}</select></label><label><span className="label">Chord symbol</span><input type="text" id="chord-symbol" aria-label="Chord symbol" value={draft} onChange={e => setDraft(e.target.value)} onBlur={() => {
                  try {
                    const c = CG.parse(draft);
                    if (c.symbol !== chord.symbol) chordEdit({
                      symbol: c.symbol,
                      inversion: 0
                    });
                  } catch (e) {
                    setError(e.message);
                  }
                }} onKeyDown={e => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                }} /></label><label><span className="label">Inversion</span><select aria-label="Chord inversion" value={chord.inversion || 0} onChange={e => chordEdit({
                  inversion: Number(e.target.value)
                })}>{Array.from({
                    length: Math.max(1, parsed.intervals.length)
                  }, (_, i) => <option key={i} value={i}>{i === 0 ? 'Root position' : `${i}${i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'} inversion`}</option>)}</select></label><label><span className="label">Playback</span><select aria-label="Chord playback" value={chord.type || 'play'} onChange={e => chordEdit({
                  type: e.target.value
                })}>{[['play', 'Chord and bass'], ['bass', 'Bass only'], ['chords', 'Chord only'], ['silence', 'Silence (drums continue)'], ['break', 'Break']].map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></label><label><span className="label">Bass note</span><select aria-label="Bass note" value={parsed.bass ?? parsed.root ?? 0} onChange={e => {
                  const base = CG.noteName(parsed.root) + parsed.quality;
                  chordEdit({
                    symbol: base + '/' + CG.noteName(Number(e.target.value))
                  });
                }}>{names.map((n, i) => <option key={i} value={i}>{n}</option>)}</select></label><label><span className="label">Label</span><input type="text" aria-label="Chord label" value={chord.label || ''} maxLength={40} onChange={e => chordEdit({
                  label: e.target.value
                })} /></label><label><span className="label">Tempo change</span><input aria-label="Chord tempo change" type="number" placeholder="Unchanged" min="30" max="300" value={chord.tempo || ''} onChange={e => chordEdit({
                  tempo: e.target.value ? Math.max(30, Math.min(300, +e.target.value)) : null
                })} /></label><label><span className="label">Transpose chord</span><select aria-label="Chord transposition" value={chord.transpose || 0} onChange={e => chordEdit({
                  transpose: +e.target.value
                })}>{Array.from({
                    length: 25
                  }, (_, i) => i - 12).map(v => <option key={v} value={v}>{v > 0 ? '+' : ''}{v} semitones</option>)}</select></label><div className="row chord-actions"><button aria-label="Move chord left" disabled={ci === 0} onClick={() => shiftChord(-1)}>←</button><button aria-label="Move chord right" disabled={ci >= section.chords.length - 1} onClick={() => shiftChord(1)}>→</button><button onClick={() => addChord('-')}>Rest</button><button className="danger" onClick={removeChord}>Clear chord</button></div></div>}{modal==='Change Chords'&&<><p className="muted">Changing the chords will replace your manually edited bass line with a new bass line matching the chords and selected accompaniment style.</p><div className="actions"><button onClick={cancelHarmonyChange}>Cancel</button><button className="primary" onClick={()=>{const pending=pendingHarmony;edit(pending.project);setPendingHarmony(null);setModal(pending.returnModal||null);}}>Change Chords</button></div></>}
{modal==='Change Accompaniment Style'&&<><p className="muted">Changing the accompaniment style will reset your edited bass line.</p><div className="actions"><button onClick={()=>{setPendingPattern(null);setModal(null);}}>Cancel</button><button className="primary" onClick={()=>{edit(typeof pendingPattern==='object'?{...pendingPattern.project,bass:null}:{style:pendingPattern,bass:null});setPendingPattern(null);setModal(null);}}>Change Accompaniment Style</button></div></>}
{modal === 'Download MIDI' && <form className="audio-download-form" onSubmit={e=>{
  e.preventDefault();
  const title=downloadName.trim().replace(/\.midi?$/i,'').replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').trim();
  if(!title)return;
  const named={...project,title};
  download(CG.songMidi(exportProject?exportProject(named):named,CA.events(named)),`${title}.mid`,'audio/midi');
  edit({title});setModal(downloadReturnModal);notify('MIDI downloaded.');
}}><label className="muted file-name-label" htmlFor="midi-download-name">File Name</label><input id="midi-download-name" type="text" value={downloadName} onChange={e=>setDownloadName(e.target.value)} autoFocus required maxLength="100" style={{width:'100%',boxSizing:'border-box'}}/><div className="actions"><button type="button" onClick={()=>setModal(downloadReturnModal)}>Cancel</button><button type="submit" className="primary" disabled={!downloadName.trim()}>Download MIDI</button></div></form>}
 {modal === 'Reset' && <><p className="muted new-song-note">Download MIDI first if you want to keep your current session.</p><div className="actions"><button onClick={saveFile}>Download</button><button className="primary" onClick={() => {
                  if(onNewComposition){stop();onNewComposition();return;}
                  edit(() => fresh());
                  setSelected([0, 0]);
                  setChordSelectionVisible(false);
                  setTab('Chords');
                  setSustain(false);sustainRef.current=false;
                  setMelodyFilter('scale');setEditorBar(0);setPage(0);
                  setModal(null);
                }}>Reset</button></div></>}
 {modal === 'Share' && <><label className="label" htmlFor="share-url">Project link</label><input id="share-url" type="text" value={shareUrl} readOnly style={{
                width: '100%'
              }} onFocus={e => e.target.select()} /></>}
 </div></div>)}
 {modal==='Download Audio'&&<window.MLH.DownloadAudioDialog project={project} onClose={()=>setModal(null)}/>}
 {modal==='View Performance Plan'&&<window.MLH.PerformancePlan items={[{id:'current',name:sectionName||'A',project}]} onChange={(id,change)=>update(change)} playing={playing} beat={beat} onPlay={()=>playing?stop():play()} onClose={()=>setModal(null)}/>}
 {modal==='View Score'&&ReactDOM.createPortal(<div className="cg studio-score-portal"><div className="sheet" onClick={e=>{if(e.target===e.currentTarget)setModal(null);}}><div className="dialog studio-score-dialog" role="dialog" aria-modal="true" aria-label="View Score"><div className="studio-score-dialog-toolbar"><div className="row studio-score-actions"><button type="button" className="primary" onClick={()=>playing?stop():play(false,false,scoreStart??-(project.upbeatBeats||0))}><><span className={`hub-playback-glyph ${playing ? "is-stop" : "is-play"}`} aria-hidden="true"></span><span>{playing?'Stop':'Play'}</span></></button><button type="button" onClick={async e=>{const button=e.currentTarget;setError('');button.disabled=true;try{await window.MLH.downloadCompositionScore(document.querySelector('.studio-score-portal .studio-score'));}catch(error){setError(error.message||String(error));}finally{button.disabled=false;}}}><img src="ui-icons/download.svg" width="20" height="20" alt="" aria-hidden="true"/>Download PDF</button><window.MLH.CompositionScoreMenu project={project} onChange={change=>update(change)}/></div><h2>View Score</h2><button className="dialog-close" aria-label="Close" title="Close" autoFocus onClick={()=>setModal(null)}>×</button></div>{error&&<p role="alert" className="toast error">{error}</p>}<window.MLH.CompositionScore project={project} selectedBeat={scoreStart} onSelectBar={b=>{stop();setScoreStart(b);}} onChange={(change,metadata)=>{if(metadata===false)update(change);else if(typeof change==='function')editHarmony(change);else if(Object.hasOwn(change,'tempo'))edit(change);else update(change);}} playing={playing} beat={beat}/></div></div></div>,document.fullscreenElement||document.body)}
 {helpVisible&&<StudioHelp host={studio} tab={tab}/>}
 </main></div></div>;
}

