const {useState,useRef,useEffect}=React;
const NAMES=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
const SHORTCUTS=['KeyA','KeyW','KeyS','KeyE','KeyD','KeyF','KeyT','KeyG','KeyY','KeyH','KeyU','KeyJ','KeyK','KeyO','KeyL','KeyP','Semicolon','Quote'];
const KEY_LABELS=['A','W','S','E','D','F','T','G','Y','H','U','J','K','O','L','P',';',"'"];
const shortcutOffset=()=>0;
const nameOf=midi=>`${NAMES[midi%12]}${Math.floor(midi/12)-1}`;
const PIANO_SETTINGS_KEY='mlh:interactive-piano:settings:v1';
function readPianoSettings(){
  try{
    const saved=JSON.parse(window.localStorage.getItem(PIANO_SETTINGS_KEY));
    if(saved?.version!==1)return {config:{},sustain:false,guide:false};
    const config={},source=saved.config;
    if(source&&typeof source==='object'&&!Array.isArray(source)){
      for(const key of ['octave','octaves'])if(typeof source[key]==='number'&&Number.isFinite(source[key]))config[key]=source[key];
      for(const key of ['labels','shortcuts'])if(typeof source[key]==='boolean')config[key]=source[key];
    }
    return {config,sustain:saved.sustain===true,guide:saved.guide===true};
  }catch{return {config:{},sustain:false,guide:false};}
}
function App(){
  const [savedSettings]=useState(readPianoSettings);
  const [config,setConfig]=useState(()=>{const initial=window.MLH.profileInitial('piano',{octave:3,octaves:2,labels:true,shortcuts:false,...savedSettings.config});return {octave:Math.min(5,Math.max(1,Math.round(Number(initial.octave)||3))),octaves:Math.min(2,Math.max(1,Math.round(Number(initial.octaves)||2))),labels:initial.labels!==false,shortcuts:initial.shortcuts===true};});
  const [open,setOpen]=useState(false),[sustain,setSustain]=window.MLH.useProfileState('sustain',savedSettings.sustain),[active,setActive]=useState([]),[error,setError]=useState(''),[guide,setGuide]=window.MLH.useProfileState('guide',savedSettings.guide);
  const menu=useRef(null),keyboard=useRef(null),sound=useRef(null),held=useRef(new Map()),pointers=useRef(new Map()),configRef=useRef(config),pedal=useRef(false),keyboardClicks=useRef(new Set()),activation=useRef(0);
  configRef.current=config;
  useEffect(()=>{try{window.localStorage.setItem(PIANO_SETTINGS_KEY,JSON.stringify({version:1,config,sustain,guide}));}catch{}},[config,sustain,guide]);
  if(!sound.current)sound.current=new window.PopupPianoAudio();
  window.MLH.useClickOutside([menu],[()=>setOpen(false)]);
  const publish=()=>setActive([...new Set(held.current.values())]);
  function press(id,midi){if(held.current.has(id))return;held.current.set(id,midi);publish();setError('');sound.current.press(id,midi).catch(e=>setError(e.message||'Piano audio could not start. Please try again.'));}
  function release(id){held.current.delete(id);sound.current.release(id);publish();}
  function stop(){held.current.clear();pointers.current.clear();sound.current.stop();publish();}
  function shift(delta){stop();setConfig(c=>({...c,octave:Math.min(5,Math.max(1,c.octave+delta))}));}
  function changeOctaves(value){stop();setConfig(c=>({...c,octaves:Math.min(2,Math.max(1,Number(value)||2))}));}
  useEffect(()=>{sound.current.setSustain(sustain||pedal.current);},[sustain]);
  useEffect(()=>{
    if(config.shortcuts)return;
    for(const id of [...held.current.keys()])if(id.startsWith('key:'))release(id);
    pedal.current=false;sound.current.setSustain(sustain);
  },[config.shortcuts]);
  useEffect(()=>{
    const keydown=e=>{
      if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,select,textarea,button,[contenteditable]'))return;
      if(!configRef.current.shortcuts)return;
      if(e.code==='Space'){e.preventDefault();pedal.current=true;sound.current.setSustain(true);return;}
      const index=SHORTCUTS.indexOf(e.code);
      if(index>=0){const current=configRef.current,base=12*(current.octave+1),midi=base+shortcutOffset(current.octaves)+index;if(midi>base+current.octaves*12)return;e.preventDefault();press(`key:${e.code}`,midi);}
    };
    const keyup=e=>{if(e.code==='Space'){pedal.current=false;sound.current.setSustain(sustain);}release(`key:${e.code}`);};
    const blur=()=>{pedal.current=false;stop();sound.current.setSustain(sustain);};
    const visibility=()=>{if(document.hidden)blur();};
    const escape=e=>{if(e.key==='Escape'){setOpen(false);blur();}};
    window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);window.addEventListener('pagehide',blur);window.addEventListener('keydown',escape);document.addEventListener('visibilitychange',visibility);
    return()=>{window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);window.removeEventListener('pagehide',blur);window.removeEventListener('keydown',escape);document.removeEventListener('visibilitychange',visibility);};
  },[sustain]);
  useEffect(()=>()=>sound.current.destroy(),[]);
  function pointerDown(e){const key=e.target.closest('[data-midi]');if(!key||e.button!==0)return;e.preventDefault();keyboard.current.setPointerCapture(e.pointerId);const midi=Number(key.dataset.midi);pointers.current.set(e.pointerId,midi);press(`pointer:${e.pointerId}`,midi);}
  function pointerMove(e){if(!pointers.current.has(e.pointerId))return;const key=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-midi]');const midi=key&&keyboard.current.contains(key)?Number(key.dataset.midi):null;if(pointers.current.get(e.pointerId)===midi)return;release(`pointer:${e.pointerId}`);pointers.current.set(e.pointerId,midi);if(midi!==null)press(`pointer:${e.pointerId}`,midi);}
  function pointerUp(e){pointers.current.delete(e.pointerId);release(`pointer:${e.pointerId}`);}
  const start=12*(config.octave+1),end=start+config.octaves*12,notes=Array.from({length:config.octaves*12+1},(_,i)=>start+i),whites=notes.filter(n=>!NAMES[n%12].includes('♯')),shortcutStart=start+shortcutOffset(config.octaves);
  function keyButton(midi,black){const shortcutIndex=midi-shortcutStart,index=whites.filter(n=>n<midi).length,blackWidth=62.7/whites.length,leftBlack=notes.includes(midi-1)&&NAMES[(midi-1)%12].includes('♯'),rightBlack=notes.includes(midi+1)&&NAMES[(midi+1)%12].includes('♯'),labelPosition=50+(Number(leftBlack)-Number(rightBlack))*15.675;return <button key={midi} data-midi={midi} type="button" className={`piano-key ${black?'black':'white'} ${active.includes(midi)?'is-playing':''}`} style={black?{left:`${index/whites.length*100-blackWidth/2}%`,width:`${blackWidth}%`}:{'--piano-label-position':`${labelPosition}%`}} aria-label={nameOf(midi)} aria-pressed={active.includes(midi)} onKeyDown={e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();if(!e.repeat){keyboardClicks.current.add(midi);press(`focus:${midi}`,midi);}}}} onKeyUp={e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();release(`focus:${midi}`);setTimeout(()=>keyboardClicks.current.delete(midi),0);}}} onClick={e=>{if(e.detail!==0)return;if(keyboardClicks.current.delete(midi))return;const id=`activate:${midi}:${++activation.current}`;press(id,midi);setTimeout(()=>release(id),250);}} onBlur={()=>{keyboardClicks.current.delete(midi);release(`focus:${midi}`);}}>
    <span>{config.labels?NAMES[midi%12]:'\u00a0'}</span>{config.shortcuts&&<kbd>{KEY_LABELS[shortcutIndex]||'\u00a0'}</kbd>}
  </button>;}
  return <div className={window.MLH.shell.pageShellClass}>
    <window.MLH.AppHeader icon="./app-icons/keyboard-icon.svg" title="Interactive Piano" subtitle="Play a piano keyboard with your mouse, touchscreen or computer keys." profileState={{piano:config,sustain,guide}} profileUsesSharedSettings={false} profileShowLabel={false}/>
    <div className={window.MLH.shell.pageContentClass}><main className={window.MLH.shell.mainShellClass}>
      <window.MLH.AppToolbar className="piano-toolbar" left={<div ref={menu} className="hub-menu-anchor relative">
        <window.MLH.CustomiseButton icon={<img src="./ui-icons/customise.svg" alt="" className="h-[26px] w-[26px]"/>} onClick={()=>setOpen(v=>!v)} dataMenuTrigger expanded={open} ariaControls="interactive-piano-customise-menu"/>
        {open&&<window.MLH.MenuPanel id="interactive-piano-customise-menu" title="Customise" variant="customise" dataMenuPanel>
          <label className="utility-setting">Octaves Displayed<select aria-label="Octaves displayed" value={config.octaves} onChange={e=>changeOctaves(e.target.value)}><option value="1">1 octave</option><option value="2">2 octaves</option></select></label>
          <window.MLH.MenuToggleRow profileKey="" showGlyph={false} label="Note Names" checked={config.labels} onChange={()=>setConfig(c=>({...c,labels:!c.labels}))}/>
          <window.MLH.MenuToggleRow profileKey="" showGlyph={false} label="Keyboard Shortcuts" checked={config.shortcuts} onChange={()=>setConfig(c=>({...c,shortcuts:!c.shortcuts}))}/>
        </window.MLH.MenuPanel>}
      </div>} feedback={<div className="piano-range"><button className="utility-button" aria-label="Lower octave" disabled={config.octave<=1} onClick={()=>shift(-1)}>←</button><span>{nameOf(start)} – {nameOf(end)}</span><button className="utility-button" aria-label="Higher octave" disabled={config.octave>=5} onClick={()=>shift(1)}>→</button></div>} right={<div className="utility-actions">{config.octaves===1&&<button className={`utility-button piano-guide-button ${guide?'primary':''}`} aria-label="Guide" title="Guide" aria-pressed={guide} onClick={()=>setGuide(v=>!v)}><img src="./ui-icons/guide.svg" alt="" aria-hidden="true"/></button>}<button className={`utility-button ${sustain?'primary':''}`} aria-pressed={sustain} onClick={()=>setSustain(v=>!v)}>Sustain</button></div>}/>
      <div className="piano-stage">
      <div ref={keyboard} className="piano-keyboard" data-mlh-pointer-surface="" data-octaves={config.octaves} role="group" aria-label="Piano keyboard" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onLostPointerCapture={pointerUp}>{whites.map(n=>keyButton(n,false))}{notes.filter(n=>NAMES[n%12].includes('♯')).map(n=>keyButton(n,true))}{config.octaves===1&&guide&&<img className="piano-hand-guide" src="./app-icons/piano-right-hand-guide.webp?v=d40c97d1350d" alt="Right hand fingering: thumb on C, index on D, middle on E, ring on F, pinky on G." draggable={false}/>}</div>
      <div className="piano-playing" role="status" aria-live="polite" aria-atomic="true" aria-label="Notes being played">{active.length?[...active].sort((a,b)=>a-b).map(nameOf).join(' · '):'\u00a0'}</div>
      {error&&<p role="alert" className="utility-error">{error}</p>}
      </div>
    </main></div>
  </div>;
}
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
