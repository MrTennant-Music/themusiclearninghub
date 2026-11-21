(function(){
 function PerformancePlan({items,playing=false,beat=-1,loading=false,onPlay,onClose,onChange}){
  const C=window.MLH.ChordGenerator;
  const [mode,setMode]=React.useState(()=>items.some(item=>item.project.lyricSheet?.some(line=>line?.text))?'view':'write'),[selected,setSelected]=React.useState(null);
  React.useEffect(()=>{const close=e=>{if(e.key==='Escape'){e.preventDefault();onClose();}};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close);},[onClose]);
  let offset=0,barOffset=0;
  const sections=items.map(item=>{const p=item.project,barBeats=Number(p.timeSignature.split('/')[0])*4/Number(p.timeSignature.split('/')[1]),section={...item,offset,barOffset,barBeats,chords:C.timeline(p)};offset+=C.totalBeats(p);barOffset+=p.progressionBars;return section;});
  const locked=playing||loading||!onChange;
  function editLine(item,bar,change){if(locked)return;const lines=Array.from({length:item.project.progressionBars},(_,i)=>({text:'',anchors:{},...item.project.lyricSheet?.[i]}));lines[bar]=change(lines[bar]);onChange(item.id,{lyricSheet:lines});}
  function wordsFor(line){return String(line?.text||'').trim().split(/\s+/).filter(Boolean);}
  function position(line,index,words){const word=line?.anchors?.[index];return Number.isInteger(word)&&word>=0&&word<words.length?word:null;}
  const title=items[0]?.project.title;
  return ReactDOM.createPortal(<div className="cg studio-performance-portal"><div className="sheet" onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div className="dialog performance-plan-dialog lyric-sheet-dialog" role="dialog" aria-modal="true" aria-label="View Performance Plan"><div className="performance-plan-toolbar"><button className="primary" onClick={onPlay}>{loading?'Cancel':<><span className={`hub-playback-glyph ${playing?'is-stop':'is-play'}`} aria-hidden="true"></span><span>{playing?'Stop':'Play'}</span></>}</button><h2>Lyrics &amp; Chords</h2><button className="dialog-close" aria-label="Close" onClick={onClose} autoFocus>×</button></div>
   <div className="lyric-sheet-controls"><div className="tabs" role="group" aria-label="Lyric sheet mode">{[['write','Write Lyrics'],['place','Place Chords'],['view','View Sheet']].map(([id,label])=><button key={id} aria-pressed={mode===id} disabled={id!=='view'&&locked} onClick={()=>{setMode(id);setSelected(null);}}>{label}</button>)}</div><p className="muted">{mode==='write'?'Type a line of lyrics for each bar. Your lyrics save automatically.':mode==='place'?'Select a chord, then click the word it should appear above.':'Your chords and lyrics, ready to follow while playing.'}</p></div>
   <div className="performance-plan-content lyric-sheet-content"><h3 className="performance-plan-title">{title&&!['Title','My progression'].includes(title)?title:'Untitled Composition'}</h3>{items[0]?.project.composer&&<p className="performance-composer">{items[0].project.composer}</p>}
    {sections.map(s=><section key={s.id} className="lyric-sheet-section"><div className="lyric-section-heading"><h3>Section {s.name}</h3><span>{C.notation(C.keyName(s.project.key,s.project.mode))} {s.project.mode} · {s.project.timeSignature} · {s.project.tempo} BPM</span></div>
     {Array.from({length:s.project.progressionBars},(_,bar)=>{
      const line=s.project.lyricSheet?.[bar]||{text:'',anchors:{}},words=wordsFor(line),start=bar*s.barBeats,chords=s.chords.filter(c=>c.beat>=start&&c.beat<start+s.barBeats&&c.symbol!=='-'),active=playing&&beat>=s.offset+start&&beat<s.offset+start+s.barBeats;
      const selectedHere=selected?.id===s.id&&selected.bar===bar&&selected.index<chords.length;
      const symbol=c=>C.notation(C.spellChord(c.symbol,s.project.key,s.project.mode));
      return <div key={bar} className={`lyric-sheet-line ${active?'is-playing':''}`}><div className="lyric-bar-number">Bar {s.barOffset+bar+1}{active?' · Now':''}</div><div className="lyric-line-body">
       {mode==='write'?<><div className="lyric-chord-summary">{chords.length?chords.map(symbol).join('   ·   '):'No chord'}</div><label className="lyric-input-label"><textarea aria-label={`Lyrics, section ${s.name}, bar ${s.barOffset+bar+1}`} rows="2" maxLength="1000" placeholder="Type lyrics…" value={line.text} disabled={locked} onChange={e=>{const text=e.target.value;editLine(s,bar,previous=>({...previous,text}));}}/></label></>:
        <>{mode==='place'&&<div className="lyric-chord-palette" role="group" aria-label={`Chords for bar ${s.barOffset+bar+1}`}>{chords.length?chords.map((c,index)=><button key={index} className="lyric-chord-chip" aria-pressed={selectedHere&&selected.index===index} disabled={locked} onClick={()=>setSelected(selectedHere&&selected.index===index?null:{id:s.id,bar,index})}>{symbol(c)}{position(line,index,words)!==null&&<span aria-label="Placed"> ✓</span>}</button>):<span className="muted">No chord in this bar</span>}{selectedHere&&position(line,selected.index,words)!==null&&<button className="lyric-unplace" disabled={locked} onClick={()=>{editLine(s,bar,p=>{const anchors={...p.anchors};delete anchors[selected.index];return {...p,anchors};});setSelected(null);}}>Unplace</button>}</div>}
         <div className="lyric-words" aria-label={`Lyrics and chords, bar ${s.barOffset+bar+1}`}>{words.length?words.map((word,index)=>{
          const above=chords.map((c,i)=>position(line,i,words)===index?symbol(c):null).filter(Boolean),content=<><span className="lyric-word-chords">{above.join(' · ')||'\u00a0'}</span><span>{word}</span></>;
          return mode==='place'?<button key={index} className={`lyric-word ${selectedHere?'is-target':''}`} disabled={locked} aria-label={`Place ${selectedHere?symbol(chords[selected.index]):'chord'} above ${word}, word ${index+1}, bar ${s.barOffset+bar+1}`} onClick={()=>{if(selectedHere){editLine(s,bar,p=>({...p,anchors:{...p.anchors,[selected.index]:index}}));setSelected(null);}else{const existing=chords.findIndex((c,i)=>position(line,i,words)===index);if(existing>=0)setSelected({id:s.id,bar,index:existing});}}}>{content}</button>:<span className="lyric-word" key={index}>{content}</span>;
         }):<div>{mode==='view'&&chords.length>0&&<div className="lyric-chord-summary">{chords.map(symbol).join(' · ')}</div>}<p className="lyric-empty">{mode==='place'?'Add lyrics in Write Lyrics first.':'Instrumental'}</p></div>}</div>
         {words.length>0&&chords.some((c,index)=>position(line,index,words)===null)&&<p className="lyric-unplaced">{words.length?'Unplaced chords: ':''}{chords.filter((c,index)=>position(line,index,words)===null).map(symbol).join(' · ')}</p>}
        </>}
      </div></div>;
     })}
    </section>)}
   </div></div></div></div>,document.fullscreenElement||document.body);
 }
 window.MLH.PerformancePlan=PerformancePlan;
})();
