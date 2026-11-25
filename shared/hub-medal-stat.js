/* Timed completion awards use the Hub's shared medal choreography and assets. */
(function(){
 const MLH=window.MLH=window.MLH||{},h=React.createElement;
 function TimedMedalStat({children,thresholds,medal=null,celebrationKey=0,bestTime=null}){
  const [open,setOpen]=React.useState(false),[automatic,setAutomatic]=React.useState(false),anchor=React.useRef(null);
  const details=medal?MLH.achievements?.medals[medal]:null;
  React.useEffect(()=>{
   const close=event=>{if(!anchor.current?.contains(event.target)){setOpen(false);setAutomatic(false);}};
   const escape=event=>{if(event.key==='Escape'){setOpen(false);setAutomatic(false);}};
   document.addEventListener('pointerdown',close,true);document.addEventListener('keydown',escape);
   return()=>{document.removeEventListener('pointerdown',close,true);document.removeEventListener('keydown',escape);};
  },[]);
  React.useEffect(()=>{
   if(!medal||!celebrationKey)return;
   setOpen(true);setAutomatic(true);
   const timer=window.setTimeout(()=>{setOpen(false);setAutomatic(false);},2600);
   return()=>window.clearTimeout(timer);
  },[medal,celebrationKey]);
  function toggle(){setAutomatic(false);setOpen(value=>!value);}
  return h('section',{ref:anchor,role:'button',tabIndex:0,'aria-label':'Time. Show medal times','aria-expanded':open,'aria-controls':'ig-medal-times',onPointerDown:event=>event.stopPropagation(),onClick:toggle,onKeyDown:event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle();}},className:`ig-header-stat hub-timed-medal-stat ${MLH.shell.scoreTileClass} ${open?MLH.shell.scoreTileActiveClass:''}`,style:{backgroundColor:details?.backgroundColor||'#fafaf9'}},
   details&&celebrationKey>0&&h('div',{key:celebrationKey,className:'hub-medal-confetti','aria-hidden':true},Array.from({length:18},(_,index)=>h('span',{key:index,style:{left:`${8+((index*19)%84)}%`,top:'-8px',backgroundColor:['#facc15','#38bdf8','#fb7185','#4ade80','#a78bfa'][index%5],animation:`confettiDrop ${.85+(index%5)*.12}s ease-out forwards`,animationDelay:`${(index%6)*.035}s`}}))),
   h('div',{className:'hub-timed-medal-content',style:details?{color:details.color}:undefined},h('span',{className:'ig-header-stat-label'},'Time'),children,bestTime&&h('span',{className:'hub-medal-best'},'Best: '+bestTime)),
   open&&h('div',{id:'ig-medal-times',role:'region','aria-label':'Medal times',className:'fixed-popover-button hub-medal-times',style:{animation:automatic?'medalPopupIn .28s cubic-bezier(.22,1.25,.32,1), medalPopupOut .24s ease-in 2.36s forwards':'medalPopupIn .28s cubic-bezier(.22,1.25,.32,1)'}},thresholds.map(item=>{
    const award=MLH.achievements.medals[item.tier];
    return h('div',{key:item.tier,className:medal===item.tier?'medal-threshold-active':''},h('img',{src:award.icon,alt:award.label}),h('span',{style:{color:award.color}},item.label));
   })));
 }
 function ResetStat({label,ariaLabel=label,fillPercent,children,onReset}){
  const [open,setOpen]=React.useState(false),anchor=React.useRef(null);
  React.useEffect(()=>{
   const close=event=>{if(!anchor.current?.contains(event.target))setOpen(false);};
   const escape=event=>{if(event.key==='Escape')setOpen(false);};
   document.addEventListener('pointerdown',close,true);document.addEventListener('keydown',escape);
   return()=>{document.removeEventListener('pointerdown',close,true);document.removeEventListener('keydown',escape);};
  },[]);
  return h('section',{ref:anchor,className:`ig-header-stat hub-reset-stat ${open?MLH.shell.scoreTileActiveClass:''}`},
   fillPercent!=null&&h(MLH.ScoreTileFill,{percent:fillPercent}),
   h('button',{type:'button',className:'hub-stat-trigger relative','aria-label':ariaLabel+'. Show reset','aria-expanded':open,'aria-controls':'ig-stat-reset',onClick:()=>setOpen(value=>!value)},h('span',{className:'ig-header-stat-label'},label),children),
   open&&h('button',{id:'ig-stat-reset',type:'button',className:'fixed-popover-button score-reset-button hub-stat-reset-action',onClick:()=>{setOpen(false);onReset?.();}},'Reset'));
 }
 MLH.ResetStat=ResetStat;
 MLH.TimedMedalStat=TimedMedalStat;
})();
