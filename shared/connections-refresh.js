/* Keep the Connections viewport steady during a native browser reload. */
(function(){
 const previousMode=history.scrollRestoration;
 const saved=history.state?.connectionsViewport;
 const reloading=performance.getEntriesByType('navigation')[0]?.type==='reload';
 const valid=reloading&&saved&&Number.isFinite(saved.y)&&saved.y>=0&&Number.isFinite(saved.height)&&saved.height>0;
 let pending=valid?saved:null,settling=false;
 const originalMinHeight=document.documentElement.style.minHeight;
 function restore(){if(pending)window.scrollTo(0,pending.y);}
 if(pending){
  history.scrollRestoration='manual';
  document.documentElement.style.minHeight=pending.height+'px';
  restore();
  document.addEventListener('DOMContentLoaded',restore,{once:true});
 }
 window.addEventListener('pagehide',()=>{
  const card=document.querySelector('.ig-resource-card');
  history.replaceState({...history.state,connectionsViewport:{y:window.scrollY,height:document.documentElement.scrollHeight,cardHeight:card?.offsetHeight||0}},'');
 });
 window.MLHConnectionsRefresh={
  placeholderHeight:pending?.cardHeight||0,
  ready(){
   if(!pending||settling)return;
   settling=true;
   window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>{
    restore();
    document.documentElement.style.minHeight=originalMinHeight;
    restore();pending=null;
    history.scrollRestoration=previousMode;
   }));
  }
 };
})();
