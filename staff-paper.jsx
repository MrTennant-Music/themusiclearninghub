const {useState,useRef,useEffect}=React;
const S=window.StaffPaperCore;
function App(){
  const [config,setConfig]=useState(()=>S.normalise(window.MLH.profileInitial('paper',S.defaults))),[open,setOpen]=useState(false),[error,setError]=useState('');
  const menu=useRef(null),countsByType=useRef(S.typeCounts(config));
  window.MLH.useClickOutside([menu],[()=>setOpen(false)]);
  useEffect(()=>{const escape=e=>{if(e.key==='Escape')setOpen(false);};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape);},[]);
  const change=patch=>setConfig(current=>{const next=S.normalise({...current,...patch});countsByType.current[next.type]=next.count;return next;});
  const changeType=type=>setConfig(current=>{const next=S.switchType(current,type,countsByType.current);countsByType.current=next.counts;return next.config;});
  const data=S.layout(config),symbols=BRAVURA_WORKSHEET_OUTLINES.symbols;
  function download(){try{S.createPDF(window.jspdf.jsPDF,config,symbols).save('music-learning-hub-stave-paper.pdf');setError('');}catch{setError('The PDF could not be created. Please try again.');}}
  return <div className={window.MLH.shell.pageShellClass}>
    <window.MLH.AppHeader icon="./app-icons/staff-paper-icon.svg?v=20261023-stave" title="Stave Paper Generator" subtitle="Create and download blank or piano stave paper." profileState={{paper:config}} profileUsesSharedSettings={false} profileShowLabel={false}/>
    <div className={window.MLH.shell.pageContentClass}><main className={window.MLH.shell.mainShellClass}>
      <window.MLH.AppToolbar className="staff-toolbar" left={<div className="staff-controls"><div ref={menu} className="hub-menu-anchor relative">
        <window.MLH.CustomiseButton icon={<img src="./ui-icons/customise.svg" alt="" className="h-[26px] w-[26px]"/>} onClick={()=>setOpen(v=>!v)} dataMenuTrigger expanded={open} ariaControls="staff-paper-customise-menu"/>
        {open&&<window.MLH.MenuPanel id="staff-paper-customise-menu" title="Customise" variant="customise" dataMenuPanel>
          <div className="staff-types" role="group" aria-label="Staff paper type">{['blank','piano'].map(type=><button type="button" key={type} className="utility-button" aria-pressed={data.config.type===type} onClick={()=>changeType(type)}>{type==='blank'?'Blank':'Piano'}</button>)}</div>
          <label className="utility-setting">Paper size<select value={data.config.format} onChange={e=>change({format:e.target.value})}><option value="a4">A4</option><option value="letter">Letter</option></select></label>
          <label className="utility-setting">Orientation<select value={data.config.orientation} onChange={e=>change({orientation:e.target.value})}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label>
          <label className="utility-setting">{data.config.type==='piano'?'Systems':'Staves'}<select value={data.config.count} onChange={e=>change({count:e.target.value})}>{Array.from({length:data.config.type==='piano'?5:13},(_,i)=><option key={i} value={i+4}>{i+4}</option>)}</select></label>
        </window.MLH.MenuPanel>}
      </div></div>} feedback={<label className="staff-title">Title<input value={config.title} onChange={e=>change({title:e.target.value})} maxLength="80" placeholder="Optional"/></label>} right={<button className="utility-button primary" onClick={download}><img src="./ui-icons/download.svg" alt="" aria-hidden="true" className="h-5 w-5 object-contain invert"/>Download</button>}/>
      {error&&<p role="alert" className="utility-error">{error}</p>}
      <div className="staff-preview"><svg viewBox={`0 0 ${data.width} ${data.height}`} role="img" aria-label={`${data.config.count} ${data.config.type==='piano'?'piano systems':'blank staves'} on ${data.config.format.toUpperCase()} paper`}>
        <rect width={data.width} height={data.height} fill="white"/>
        {data.config.title&&<text x={data.width/2} y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="5.65" textLength={config.title.length>50?data.width-36:undefined} lengthAdjust="spacingAndGlyphs">{data.config.title}</text>}
        <g stroke="#000" strokeWidth=".16">{data.lines.map((line,i)=><line key={i} x1={line[0]} y1={line[1]} x2={line[2]} y2={line[3]}/>)}</g>
        {data.glyphs.map((g,i)=><path key={i} d={symbols[g.name].path} fill="#000" transform={`translate(${g.x} ${g.y}) scale(${g.scale} ${-g.scale})`}/>)}
      </svg></div>
    </main></div>
  </div>;
}
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
