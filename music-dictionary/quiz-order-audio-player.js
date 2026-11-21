/* Compact ordering-tile players; share the Hub piano samples and stop on navigation. */
(function(){
'use strict';const h=React.createElement,STOP='mlh-stop-order-audio';
window.MusicDictionaryQuizOrderAudio=function({media,label}){
 const [playing,setPlaying]=React.useState(false),[loading,setLoading]=React.useState(false),[error,setError]=React.useState(''),[position,setPosition]=React.useState(0),[duration,setDuration]=React.useState(media.duration||0);
 const audio=React.useRef(null),context=React.useRef(null),tick=React.useRef(null),ended=React.useRef(null),version=React.useRef(0),origin=React.useRef(0);
 function stop(){version.current++;clearInterval(tick.current);clearTimeout(ended.current);if(audio.current){audio.current.pause();try{audio.current.currentTime=0;}catch{}}const ctx=context.current;context.current=null;if(ctx&&ctx.state!=='closed')void (window.MLH.closeAudioContext?.(ctx)||ctx.close()).catch(()=>{});setPlaying(false);setLoading(false);setPosition(0);}
 React.useEffect(()=>{setError('');setDuration(media.duration||0);setPosition(0);window.addEventListener(STOP,stop);return()=>{window.removeEventListener(STOP,stop);stop();};},[JSON.stringify(media)]);
 async function play(){
  if(playing||loading){stop();return;}
  window.dispatchEvent(new Event(STOP));document.querySelectorAll('audio').forEach(el=>el.pause());const token=++version.current;setError('');setLoading(true);
  try{
   if(media.kind==='audio'){const element=audio.current;if(element.error)element.load();await element.play();if(token!==version.current)return;setDuration(Number.isFinite(element.duration)?element.duration:media.duration||0);setPlaying(true);setLoading(false);}
   else{const Class=window.AudioContext||window.webkitAudioContext;if(!Class)throw Error('Piano playback is not supported.');const ctx=new Class();context.current=ctx;const events=media.events,frequency=MusicDictionaryQuizAudioOrder.frequency;
    if(!await window.MLH.prepareAudioPlayback(ctx,{piano:events.map(e=>({frequency:frequency(e.midi),velocity:e.velocity||96}))}))throw Error('Piano samples could not start.');if(token!==version.current||ctx.state==='closed')return;
    const start=ctx.currentTime+.05;origin.current=start;for(const e of events)window.MLH.playPianoFrequency(ctx,window.MLH.audioOutput?.(ctx)||ctx.destination,frequency(e.midi),start+e.start,e.duration,.12,e.velocity||96);
    const length=Math.max(...events.map(e=>e.start+e.duration))+.65;setDuration(length);setPlaying(true);setLoading(false);tick.current=setInterval(()=>setPosition(Math.min(length,Math.max(0,ctx.currentTime-start))),50);ended.current=setTimeout(stop,(length+.05)*1000);
   }
  }catch(err){if(token!==version.current)return;stop();setError('Could not play this example. Please try again.');}
 }
 const time=n=>Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0');
 return h('div',{className:'cq-order-audio',role:'group','aria-label':label+' audio'},media.kind==='audio'&&h('audio',{ref:audio,src:media.src,preload:'none',onTimeUpdate:e=>setPosition(e.currentTarget.currentTime),onLoadedMetadata:e=>{if(Number.isFinite(e.currentTarget.duration))setDuration(e.currentTarget.duration);},onEnded:stop,onPause:()=>{setPlaying(false);},onError:()=>{setLoading(false);setPlaying(false);setError('Could not load this example. Please try again.');}}),h('button',{type:'button',className:'cq-order-play','aria-label':(playing||loading?'Stop ':'Play ')+label,onClick:play},h('span',{className:'hub-playback-glyph '+(playing?'is-stop':'is-play'),'aria-hidden':true}),loading?'Loading…':playing?'Stop':'Play'),media.kind==='audio'?h('input',{type:'range',min:0,max:duration||1,step:.1,value:Math.min(position,duration||1),'aria-label':label+' playback position',onChange:e=>{try{audio.current.currentTime=Number(e.target.value);setPosition(Number(e.target.value));}catch{};}}):h('progress',{max:duration||1,value:position,'aria-label':label+' playback progress'}),media.kind==='audio'&&h('span',{className:'cq-order-audio-time','aria-hidden':true},time(position)+' / '+time(duration)),error&&h('p',{role:'alert',className:'cq-order-audio-error'},error));
};
})();
