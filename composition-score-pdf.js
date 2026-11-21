/* Capture the displayed score only. Keep complete systems together and outline
   Bravura glyphs before capture so PDFs never depend on a music font. */
(function(root){
 'use strict';
 const ns='http://www.w3.org/2000/svg';
 function outlineGlyphs(score){
  const set=root.BRAVURA_WORKSHEET_OUTLINES;
  const symbols={...set.symbols,...root.MLH.compositionScoreOutlines};
  const keys=new Map(Object.entries(root.BRAVURA_SYMBOLS).map(([key,char])=>[char,key]));
  score.querySelectorAll('text.studio-score-glyph').forEach(text=>{
   const key=keys.get(text.textContent),outline=symbols[key];
   if(!outline)throw Error('Cannot export score symbol: '+(key||text.textContent));
   const x=Number(text.getAttribute('x')),y=Number(text.getAttribute('y'));
   const size=Number(text.getAttribute('font-size'))||parseFloat(getComputedStyle(text).fontSize);
   const anchor=text.getAttribute('text-anchor'),offset=anchor==='middle'?outline.advance/2:anchor==='end'?outline.advance:0;
   const group=document.createElementNS(ns,'g'),path=document.createElementNS(ns,'path');
   group.setAttribute('transform',text.getAttribute('transform')||'');
   path.setAttribute('transform',`translate(${x} ${y}) scale(${size/set.unitsPerEm} ${-size/set.unitsPerEm}) translate(${-offset} 0)`);
   path.setAttribute('d',outline.path);path.setAttribute('fill','#111');
   group.append(path);text.replaceWith(group);
  });
 }
 async function createCompositionScorePdf(source){
  if(!source||!root.html2canvas||!root.jspdf?.jsPDF)throw Error('The PDF tools could not be loaded. Reload the page and try again.');
  if(source.contains(document.activeElement))document.activeElement.blur();
  await new Promise(resolve=>requestAnimationFrame(resolve));
  await document.fonts.ready;
  const host=document.createElement('div');host.className='cg';
  // Use layout pixels rather than the fitted canvas's on-screen scale.
  host.style.cssText=`position:fixed;left:-20000px;top:0;width:${source.clientWidth}px;padding:0!important;background:white;pointer-events:none;`;
  host.setAttribute('aria-hidden','true');
  const score=source.cloneNode(true);host.append(score);document.body.append(host);
  try{
   if(score.matches('[data-arrangement-score]'))score.querySelectorAll('.studio-score').forEach(paper=>paper.replaceWith(...paper.childNodes));
   score.querySelectorAll('.studio-score-edit-overlay,.studio-score-bar-target').forEach(node=>node.remove());
   source.querySelectorAll('.studio-score-heading input').forEach(input=>{
    const clone=score.querySelector('.studio-score-heading input'),label=document.createElement(input.classList.contains('studio-score-tempo-number')?'span':'div');
    label.className=clone.className;
    // Inputs are replaced with text so their current value is captured in full.
    const style=getComputedStyle(input);
    for(const property of ['font-family','font-size','font-weight','line-height','text-align','padding','margin-top','margin-left','margin-right','width','max-width','box-sizing','color','display','vertical-align','white-space'])label.style.setProperty(property,style.getPropertyValue(property));
    label.textContent=input.value||input.placeholder;label.style.border='1px solid transparent';
    clone.replaceWith(label);
   });
   score.querySelectorAll('.studio-score-playing-bar').forEach(node=>node.remove());
   score.querySelectorAll('.studio-score-active-note').forEach(node=>node.classList.remove('studio-score-active-note'));
   outlineGlyphs(score);
   const pdf=new root.jspdf.jsPDF({unit:'mm',format:'a4',orientation:'portrait',compress:true});
   const margin=12,pageWidth=pdf.internal.pageSize.getWidth(),pageHeight=pdf.internal.pageSize.getHeight(),width=pageWidth-margin*2;
   const title=source.querySelector('.studio-score-title')?.value||'Title';
   pdf.setProperties({title,author:source.querySelector('.studio-score-composer')?.value||'',creator:'',subject:''});
   const blocks=Array.from(score.children);let y=margin;
   const contentWidth=blocks[0]?.getBoundingClientRect().width||score.clientWidth;
   // Reserve enough room for the title and first system together.
   const sizes=blocks.map(block=>({height:block.getBoundingClientRect().height,gap:parseFloat(getComputedStyle(block).marginBottom)||0}));
   const firstPair=sizes.slice(0,blocks[0]?.tagName==='HEADER'?2:1).reduce((sum,size)=>sum+size.height+size.gap,0);
   const fit=Math.min(1,(pageHeight-margin*2)/(firstPair*width/contentWidth));
   const drawWidth=width*fit,mmPerPixel=drawWidth/contentWidth,x=(pageWidth-drawWidth)/2;
   for(let index=0;index<blocks.length;index++){
    const block=blocks[index],height=sizes[index].height*mmPerPixel;
    if(y+height>pageHeight-margin+.01&&y>margin){pdf.addPage();y=margin;}
    // html2canvas requires an HTML capture root, rather than an SVG root.
    const capture=document.createElement('div');capture.style.cssText='display:flow-root;background:white;';
    block.replaceWith(capture);capture.append(block);block.style.margin='0';
    const canvas=await root.html2canvas(capture,{scale:3,backgroundColor:'#ffffff',logging:false,scrollX:0,scrollY:0});
    pdf.addImage(canvas.toDataURL('image/png'),'PNG',x,y,drawWidth,height,undefined,'FAST');
    y+=height+sizes[index].gap*mmPerPixel;
   }
   const filename=(title.trim()||'Title').replace(/[<>:"/\\|?*\x00-\x1f]/g,'-');
   return {pdf,filename:filename+'.pdf'};
  }finally{host.remove();}
 }
 root.MLH.createCompositionScorePdf=createCompositionScorePdf;
 root.MLH.downloadCompositionScore=async source=>{const {pdf,filename}=await createCompositionScorePdf(source);pdf.save(filename);};
})(window);
