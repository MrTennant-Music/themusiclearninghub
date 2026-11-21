/* Keep the last quiz shell visible while a refresh prepares its new question. */
(function(){
 'use strict';
 const root=document.getElementById('root'),key='mlh:concept-quiz-refresh-shell:v1';
 const params=new URLSearchParams(location.search);
 if(!root||(!params.has('quiz')&&params.get('sharedQuiz')!=='1'))return;
 const url=location.pathname+location.search;
 function safeContent(html){
  const template=document.createElement('template');template.innerHTML=html;
  template.content.querySelectorAll('script,iframe,object,embed,style,link').forEach(el=>el.remove());
  template.content.querySelectorAll('*').forEach(el=>{for(const attribute of [...el.attributes])if(/^on/i.test(attribute.name)||/^(?:javascript|data):/i.test(attribute.value.trim()))el.removeAttribute(attribute.name);});
  return template.content;
 }
 const previewStyle=document.createElement('style');
 previewStyle.textContent='#root[data-cq-refresh-preview]{pointer-events:none}#root[data-cq-refresh-preview] *{animation:none!important;transition:none!important}';
 document.head.appendChild(previewStyle);
 try{
  const navigation=performance.getEntriesByType('navigation')[0];
  const saved=JSON.parse(sessionStorage.getItem(key)||'null');
  if(navigation?.type==='reload'&&saved?.url===url&&typeof saved.html==='string'&&Date.now()-saved.time<3600000){
   root.setAttribute('data-cq-refresh-preview','');root.setAttribute('aria-busy','true');root.inert=true;
   root.replaceChildren(safeContent(saved.html));
   if(typeof saved.footer==='string'){
    const content=safeContent(saved.footer),preview=content.querySelector('footer');
    if(preview){
     preview.id='cq-refresh-footer';preview.inert=true;preview.setAttribute('aria-hidden','true');root.after(content);
     const observer=new MutationObserver(()=>{if(document.querySelector('footer#resources')){preview.remove();observer.disconnect();}});
     observer.observe(document.body,{childList:true});
    }
   }
  }
 }catch{/* A normal first render remains available if storage is unavailable. */}
 function save(){
  if(root.hasAttribute('data-cq-refresh-preview')||!root.querySelector('.cq-practice'))return;
  try{
   const clone=root.cloneNode(true),stage=root.querySelector('.cq-practice-stage'),copy=clone.querySelector('.cq-practice-stage');
   if(stage&&copy){copy.style.height=getComputedStyle(stage).height;copy.style.opacity='1';}
   clone.querySelectorAll('.cq-practice-measurements,.cq-worksheet-dialog,[aria-modal="true"],[data-menu-panel],audio').forEach(el=>el.remove());
   clone.querySelectorAll('.cq-toolbar-feedback').forEach(el=>el.replaceChildren());
   const footer=document.querySelector('footer#resources')?.cloneNode(true);
   if(footer){
    // These shared-footer adjustments normally arrive with footer.js.
    const grid=footer.querySelector('.footer-grid'),brand=footer.querySelector('.footer-brand'),logo=footer.querySelector('.footer-wordmark');
    if(grid)grid.style.gridTemplateColumns='repeat(4,minmax(0,1fr))';
    if(brand)brand.style.justifyContent='center';
    if(logo){logo.style.width='187px';logo.style.transform='translateX(-12px)';}
   }
   const html=clone.innerHTML;if(html.length<200000)sessionStorage.setItem(key,JSON.stringify({url:location.pathname+location.search,time:Date.now(),html,footer:footer?.outerHTML}));
  }catch{/* Refresh still works without a cached shell. */}
 }
 window.addEventListener('pagehide',save);
})();
