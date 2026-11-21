(function(){
 const {useState,useRef,useEffect,useMemo}=React,C=window.MLH.ChordGenerator,A=window.MLH.ChordAudio;
 function AccompanimentEditor({project,onApply,onCancel}){
  const initial=()=>A.accompanimentNotes(project),[notes,setNotes]=useState(initial),[quantise,setQuantise]=useState(project.accompanimentQuantise||project.quantise||8),[selected,setSelected]=useState(null);
  const [style,setStyle]=useState(project.style);
  const presetNotes=useMemo(()=>A.accompanimentNotes({...project,style,accompaniment:null,bass:null}),[project,style]);
  const custom=JSON.stringify(notes)!==JSON.stringify(presetNotes);
  const [instrument,setInstrument]=useState(project.accompanimentInstrument||'piano'),[sustain,setSustain]=useState(project.accompanimentSustain===true);
  const cleanup=useRef(null),suppress=useRef(false),scroller=useRef(null),player=useRef(null),attempt=useRef(0);
  if(!player.current)player.current=new A.Player();
  const [playing,setPlaying]=useState(false),[loading,setLoading]=useState(false),[playbackBeat,setPlaybackBeat]=useState(-1),[playError,setPlayError]=useState('');
  const locked=playing||loading;
  useEffect(()=>()=>{cleanup.current?.();attempt.current++;player.current.stop();},[]);
  const [top,bottom]=project.timeSignature.split('/').map(Number),beats=top*4/bottom,total=C.totalBeats(project),bars=project.progressionBars||4,step=4/quantise,cells=Math.round(total/step),cellsPerBar=Math.round(beats/step);
  const pitches=[...new Set([...Array.from({length:48},(_,i)=>83-i),...notes.map(n=>n.midi)])].sort((a,b)=>b-a),labels=C.pitchNames(project.key,project.mode),chosen=notes[selected];
  const name=midi=>C.notation(labels[midi%12])+String(Math.floor(midi/12)-1);
  useEffect(()=>{
   const pane=scroller.current;if(!pane||!playing)return;
   const area=pane.querySelector('.accompaniment-roll');
   const position=44+(area.clientWidth-44)*Math.max(0,playbackBeat)/total;
   pane.scrollLeft=Math.max(0,Math.min(pane.scrollWidth-pane.clientWidth,position-44-(pane.clientWidth-44)*.35));
  },[playing,playbackBeat,total]);
  function stopPreview(){attempt.current++;player.current.stop();setPlaying(false);setLoading(false);setPlaybackBeat(-1);}
  async function playPreview(){
   if(locked){stopPreview();return;}
   cleanup.current?.();setPlayError('');setLoading(true);const ticket=++attempt.current;
   try{
    const draft=C.validate({...project,style,accompaniment:notes,accompanimentInstrument:instrument,accompanimentSustain:sustain,melody:[],loop:true,volumes:{...project.volumes,melody:0,drums:0}});
    await player.current.play(draft,beat=>{if(ticket!==attempt.current)return;setPlaybackBeat(beat);},()=>{if(ticket===attempt.current)stopPreview();});
    if(ticket===attempt.current){setPlaying(player.current.playing);setLoading(false);}
   }catch(error){if(ticket===attempt.current){stopPreview();setPlayError(error.message||'Unable to play the accompaniment.');}}
  }
  function preview(midi){if(!locked)A.preview([midi],instrument,'chords').catch(()=>{});}
  function drag(e,note,resize){
   if(locked||e.button!==0)return;e.preventDefault();e.stopPropagation();cleanup.current?.();
   const index=notes.indexOf(note);if(index<0)return;
   const cell=e.currentTarget.closest('button'),rect=cell.getBoundingClientRect(),row=pitches.indexOf(note.midi),x=e.clientX,y=e.clientY,startScroll=scroller.current.scrollLeft;
   let moved=false,currentBeat=note.beat,currentMidi=note.midi;
   const move=event=>{
    if(!moved&&Math.hypot(event.clientX-x,event.clientY-y)<4)return;
    moved=true;suppress.current=true;setSelected(index);
    const pane=scroller.current,bounds=pane.getBoundingClientRect();
    if(event.clientX>bounds.right-24)pane.scrollLeft+=12;else if(event.clientX<bounds.left+68)pane.scrollLeft-=12;
    const offset=event.clientX-x+pane.scrollLeft-startScroll;
    setNotes(previous=>{
     if(resize)return C.resizeNote(previous,index,note.duration+offset/rect.width*step,total,quantise);
     const pitch=pitches[Math.max(0,Math.min(pitches.length-1,row+Math.round((event.clientY-y)/rect.height)))];
     const result=C.moveNote(previous,index,note.beat+offset/rect.width*step,pitch,total,quantise);
     if(result[index]){currentBeat=result[index].beat;currentMidi=result[index].midi;}return result;
    });
   };
   const end=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',end);cleanup.current=null;if(moved)preview(currentMidi);setTimeout(()=>{suppress.current=false;},0);};
   window.addEventListener('pointermove',move);window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);cleanup.current=end;
  }
  function chooseStyle(value){cleanup.current?.();setStyle(value);setNotes(A.accompanimentNotes({...project,style:value,accompaniment:null,bass:null}));setSelected(null);}
  function shift(delta){cleanup.current?.();setNotes(previous=>previous.map(note=>({...note,midi:note.midi+delta*12})));}
  function nudgePitch(delta){const midi=chosen.midi+delta;setNotes(previous=>C.moveNote(previous,selected,chosen.beat,midi,total,quantise));preview(midi);}
  function nudgePosition(delta){setNotes(previous=>C.moveNote(previous,selected,chosen.beat+delta*step,chosen.midi,total,quantise));}
  function nudgeLength(delta){setNotes(previous=>C.resizeNote(previous,selected,chosen.duration+delta*step,total,quantise));}
  function remove(){setNotes(previous=>previous.filter((_,i)=>i!==selected));setSelected(null);}
  return <div className="accompaniment-editor">
   <button type="button" className="primary accompaniment-preview-play" aria-label={locked?'Stop accompaniment':'Play accompaniment'} onClick={playPreview}>{loading?'Cancel':<><span className={`hub-playback-glyph ${playing?'is-stop':'is-play'}`} aria-hidden="true"></span><span>{playing?'Stop':'Play'}</span></>}</button>
   {playError&&<p className="toast error" role="alert">{playError}</p>}
   <window.MLH.CompositionOptions title="Accompaniment" actions={<button type="button" disabled={locked||!notes.length} onClick={()=>{setNotes([]);setSelected(null);}}>Clear</button>}>
    <label className="option-field accompaniment-style"><span>Accompaniment</span><span className="accompaniment-select"><span className="accompaniment-selected-name" aria-hidden="true">{custom?'Custom':(A.styles[style]||'Default').split(' - ')[0]}</span><select aria-label="Accompaniment style" disabled={locked} value={custom?'custom':style} onChange={e=>chooseStyle(e.target.value)}>{custom&&<option value="custom" disabled>Custom</option>}{Object.entries(A.styles).filter(([id])=>id!=='ballad'&&C.patternAllowed(id,project.timeSignature)).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></span></label>
    <label className="option-field accompaniment-instrument"><span>Instrument</span><select aria-label="Accompaniment instrument" disabled={locked} value={instrument} onChange={e=>setInstrument(e.target.value)}>{Object.entries({piano:'Piano',electricpiano:'Electric Piano',guitar:'Guitar',organ:'Organ',strings:'Strings',flute:'Flute',marimba:'Marimba',brass:'Brass',synth:'Synth',pad:'Pad'}).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    <div className="melody-octave-controls" role="group" aria-label="Accompaniment octave"><span className="muted">Octave</span><div className="row"><button type="button" aria-label="Accompaniment octave down" disabled={locked||!notes.length||notes.some(n=>n.midi-12<21)} onClick={()=>shift(-1)}>−</button><button type="button" aria-label="Accompaniment octave up" disabled={locked||!notes.length||notes.some(n=>n.midi+12>108)} onClick={()=>shift(1)}>+</button></div></div>
    <label className="option-field accompaniment-quantise"><span>Quantise</span><select aria-label="Accompaniment quantise" disabled={locked} value={quantise} onChange={e=>setQuantise(Number(e.target.value))}>{[[2,'Minim (1/2)'],[4,'Crotchet (1/4)'],[8,'Quaver (1/8)'],[16,'Semiquaver (1/16)']].map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>
    <div className="melody-sustain-controls"><span className="muted">Sustain</span><button type="button" aria-label="Accompaniment sustain" disabled={locked} aria-pressed={sustain} onClick={()=>setSustain(!sustain)}>{sustain?'On':'Off'}</button></div>
   </window.MLH.CompositionOptions>
   <div ref={scroller} className="accompaniment-roll-scroll" role="region" aria-label="Accompaniment piano roll" tabIndex="0">
    <div className="accompaniment-timeline" style={{width:bars===8?'calc(200% - 44px)':'100%'}}>
    <div className="accompaniment-beat-ruler" style={{gridTemplateColumns:`44px repeat(${cells},minmax(0,1fr))`}}><span/>{Array.from({length:bars},(_,i)=><span className="accompaniment-bar-heading" key={i} style={{gridColumn:`span ${cellsPerBar}`}}>Bar {i+1}</span>)}<span className="accompaniment-ruler-corner"/>{Array.from({length:cells},(_,i)=><span className={i%cellsPerBar===0?'bar-start':''} key={i}>{i*step%1===0?String(Number((i*step%beats+1).toFixed(2))):''}</span>)}</div>
    <div className="roll accompaniment-roll" style={{gridTemplateColumns:`44px repeat(${cells},minmax(0,1fr))`,gridTemplateRows:`repeat(${pitches.length},minmax(0,1fr))`}}>{pitches.map(midi=><React.Fragment key={midi}><span className={`pitch ${[1,3,6,8,10].includes(midi%12)?'is-black':''}`} data-accompaniment-pitch={midi} title={name(midi)}><span>{midi%12===0||midi===pitches[0]||midi===pitches.at(-1)?name(midi):''}</span></span>{Array.from({length:cells},(_,i)=>{
     const beat=i*step,bar=Math.floor(i/cellsPerBar),segments=C.rollCellSegments(notes,midi,beat,step);
     return <button type="button" key={i} aria-label={`${name(midi)}, bar ${bar+1}, beat ${Number((i*step%beats+1).toFixed(2))}`} aria-pressed={segments.length>0} disabled={locked} title={`${name(midi)}, bar ${bar+1}, beat ${Number((i*step%beats+1).toFixed(2))}`} className={`${i%cellsPerBar===0?'bar-start':''} ${[1,3,6,8,10].includes(midi%12)?'is-black':''} ${segments.length?'on':''} ${playing&&playbackBeat>=beat&&playbackBeat<beat+step?'current':''}`} onClick={()=>{
      if(locked||suppress.current)return;
      if(segments.length){const index=notes.indexOf(segments[0].note);if(index===selected)remove();else setSelected(index);return;}
      setNotes(previous=>C.placeNote(previous,beat,midi,total,quantise,100));setSelected(notes.length);preview(midi);
     }}>{segments.map(({note,left,width,continuation,ends},index)=><span key={index} className={`melody-note-block ${continuation?'is-continuation':''} ${notes.indexOf(note)===selected?'is-selected':''}`} style={{left:`${left}%`,width:`${width}%`}} onPointerDown={e=>drag(e,note,false)}>{ends&&<span className="melody-note-resize" role="separator" aria-label={`Resize accompaniment ${name(midi)}`} onPointerDown={e=>drag(e,note,true)}/>}</span>)}</button>;
    })}</React.Fragment>)}</div>
    </div>
   </div>
   <div className="accompaniment-editor-footer">
   {chosen&&<div className="accompaniment-note-controls">
    <div className="accompaniment-note-stepper" role="group" aria-label="Pitch"><span>Pitch</span><button type="button" aria-label="Lower note pitch" disabled={locked||chosen.midi<=21} onClick={()=>nudgePitch(-1)}>↓</button><button type="button" aria-label="Raise note pitch" disabled={locked||chosen.midi>=108} onClick={()=>nudgePitch(1)}>↑</button></div>
    <div className="accompaniment-note-stepper" role="group" aria-label="Position"><span>Position</span><button type="button" aria-label="Move note earlier" disabled={locked||chosen.beat<step} onClick={()=>nudgePosition(-1)}>←</button><button type="button" aria-label="Move note later" disabled={locked||chosen.beat+step>=total} onClick={()=>nudgePosition(1)}>→</button></div>
    <div className="accompaniment-note-stepper" role="group" aria-label="Length"><span>Length</span><button type="button" aria-label="Shorten note" disabled={locked||chosen.duration<=step} onClick={()=>nudgeLength(-1)}>←</button><button type="button" aria-label="Lengthen note" disabled={locked||chosen.duration>=Math.min(32,total-chosen.beat)} onClick={()=>nudgeLength(1)}>→</button></div>
   </div>}
   <div className="actions"><button type="button" onClick={onCancel}>Cancel</button><button type="button" className="primary" onClick={()=>onApply(custom?notes:null,{style,accompanimentInstrument:instrument,accompanimentQuantise:quantise,accompanimentSustain:sustain})}>Apply</button></div>
   </div>
  </div>;
 }
 window.MLH.AccompanimentEditor=AccompanimentEditor;
})();
