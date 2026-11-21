/* Dictionary Practice uses the original Label renderer and authored targets. */
(function(){
 'use strict';
 const h=React.createElement,requests=new Map();let engine;
 function script(url){
  if(requests.has(url))return requests.get(url);
  const pending=new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=url;el.onload=resolve;el.onerror=()=>{requests.delete(url);el.remove();reject(Error('The Label game could not load. Please try again.'));};document.head.appendChild(el);});
  requests.set(url,pending);return pending;
 }
 function load(){
  if(engine)return engine;
  const files=window.MusicDictionaryLabelData.files;
  engine=(async()=>{
   if(!document.querySelector('[data-dictionary-label-style]')){const el=document.createElement('link');el.rel='stylesheet';el.href=files['music-games/diagram.css'];el.dataset.dictionaryLabelStyle='';document.head.appendChild(el);}
   if(!window.IGRuntime?.activity){await script(files['music-games/runtime/index.js']);await script(files['music-games/core.js']);await script(files['music-games/loader.js']);}
   await script(files['music-games/diagram-core.js']);
   await script(files['music-games/runtime/diagram.js']);
  })().catch(error=>{engine=null;throw error;});
  return engine;
 }
 function LabelGames({conceptId}){
  const games=window.MusicDictionaryLabelData.games.filter(g=>g.conceptIds.includes(conceptId));
  const requested=new URLSearchParams(location.search).get('label');
  const initial=games.some(g=>g.id===requested)?requested:games[0]?.id||'';
  const [selected,setSelected]=React.useState(initial),[activity,setActivity]=React.useState(null),[loading,setLoading]=React.useState(Boolean(initial)),[error,setError]=React.useState(''),[run,setRun]=React.useState(0),[result,setResult]=React.useState(null);
  const request=React.useRef(0);
  React.useEffect(()=>{if(initial)void play(initial);return()=>{request.current++;};},[]);
  if(!games.length)return null;
  async function play(id=selected){const token=++request.current;setLoading(true);setError('');setResult(null);setActivity(null);try{await load();const a=await window.IGRuntime.activity(id);if(token!==request.current)return;setActivity(a);setRun(n=>n+1);}catch(error){if(token===request.current)setError(error.message);}finally{if(token===request.current)setLoading(false);}}
  function choose(id){setSelected(id);void play(id);}
  return h('div',{className:'mc-label-games','aria-label':'Label game'},
   h('div',{className:'mc-label-toolbar'},h('h3',null,'Label'),activity&&h('button',{type:'button',className:window.MLH.ToolbarButtonClass+' gap-2',onClick:()=>play()},h('img',{src:'./ui-icons/restart.svg',alt:'','aria-hidden':true,width:20,height:20}),'Restart')),
   games.length>1?h('div',{className:'mc-label-choices',role:'group','aria-label':'Label activities'},games.map(g=>h('button',{key:g.id,type:'button','aria-pressed':g.id===selected,className:window.MLH.ToolbarButtonClass,onClick:()=>choose(g.id)},g.title))):h('p',{className:'mc-label-title'},games[0].title),
   error&&h('p',{role:'alert',className:'mc-label-error'},error),
   loading?h('p',{role:'status'},'Loading Label game…'):activity?h(React.Fragment,null,
    h(window.IGLabelledDiagram,{key:activity.id+':'+run,activity,options:{active:true},onComplete:setResult}),
    result&&h('div',{className:'mc-label-result',role:'status'},h('strong',null,'Results'),h('span',null,result.correct+' of '+result.total+' correct'),h('button',{type:'button',className:window.MLH.ToolbarButtonClass,onClick:()=>play()},'Try Again'))
   ):error&&h('button',{type:'button',className:window.MLH.ToolbarButtonClass+' mc-label-play',onClick:()=>play()},'Try Again'),
   activity&&h('p',{className:'mc-label-instructions'},'Drag each pin to its target, or select a label and then a target. Select Submit when ready.')
  );
 }
 window.MusicDictionaryLabelGames=LabelGames;
})();
