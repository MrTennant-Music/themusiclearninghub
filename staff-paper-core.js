(function(root){
  const defaults={type:'blank',format:'a4',orientation:'portrait',count:12,title:''};
  function normalise(input={}){
    const type=input.type==='piano'?'piano':'blank';
    return {type,format:input.format==='letter'?'letter':'a4',orientation:input.orientation==='landscape'?'landscape':'portrait',count:Math.min(type==='piano'?8:16,Math.max(4,Math.round(Number(input.count)|| (type==='piano'?6:12)))),title:String(input.title||'').slice(0,80)};
  }
  function typeCounts(input={}){
    const config=normalise(input);
    return {blank:config.type==='blank'?config.count:12,piano:config.type==='piano'?config.count:6};
  }
  function switchType(input,nextType,rememberedCounts={}){
    const current=normalise(input),counts={
      blank:normalise({type:'blank',count:rememberedCounts.blank}).count,
      piano:normalise({type:'piano',count:rememberedCounts.piano}).count
    };
    counts[current.type]=current.count;
    const type=nextType==='piano'?'piano':'blank';
    return {config:normalise({...current,type,count:counts[type]}),counts};
  }
  function layout(input){
    const config=normalise(input), size=config.format==='letter'?[215.9,279.4]:[210,297];
    const [width,height]=config.orientation==='landscape'?size.slice().reverse():size;
    const left=18,right=width-18,top=config.title?36:22,bottom=height-20;
    // Reduce spacing only when the chosen number of systems needs it.
    const systemHeight=config.type==='piano'?Math.min(27,(bottom-top)/config.count*.72):8;
    const gap=config.type==='piano'?Math.min(2,(systemHeight-7)/8):2;
    const systemStep=(bottom-top-systemHeight)/(config.count-1);
    const lines=[],glyphs=[];
    for(let i=0;i<config.count;i++){
      const y=top+i*systemStep;
      const staff=(base)=>{for(let j=0;j<5;j++)lines.push([left,base+j*gap,right,base+j*gap]);};
      staff(y);
      if(config.type==='piano'){
        const bass=y+systemHeight-4*gap;
        staff(bass);lines.push([left,y,left,bass+4*gap]);
        glyphs.push({name:'gClef',x:left+2,y:y+3*gap,scale:gap/250},{name:'fClef',x:left+2,y:bass+gap,scale:gap/250},{name:'brace',x:left-3,y:bass+4*gap,scale:(bass+4*gap-y)/1000});
      }
    }
    return {config,width,height,lines,glyphs};
  }
  function pdfPath(path,x,y,scale){
    const tokens=path.match(/[MLCZ]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi)||[],ops=[];
    let i=0;
    while(i<tokens.length){
      const op=tokens[i++].toUpperCase(),n=op==='C'?6:op==='Z'?0:2;
      if(!['M','L','C','Z'].includes(op))throw Error('Unsupported notation path');
      const c=tokens.slice(i,i+n).map(Number);i+=n;
      ops.push({op:{M:'m',L:'l',C:'c',Z:'h'}[op],c:c.map((v,j)=>j%2?y-v*scale:x+v*scale)});
    }
    return ops;
  }
  function createPDF(JsPDF,input,symbols){
    const data=layout(input),doc=new JsPDF({orientation:data.config.orientation,unit:'mm',format:data.config.format});
    doc.setProperties({title:data.config.title||'Stave Paper',creator:'The Music Learning Hub'});
    doc.setDrawColor(0);doc.setLineWidth(.16);
    data.lines.forEach(line=>doc.line(...line));
    data.glyphs.forEach(g=>{doc.path(pdfPath(symbols[g.name].path,g.x,g.y,g.scale));doc.fill();});
    if(data.config.title){doc.setFont('helvetica','normal');doc.setFontSize(16);const available=data.width-36;const measured=doc.getTextWidth(data.config.title);if(measured>available)doc.setFontSize(16*available/measured);doc.text(data.config.title,data.width/2,20,{align:'center'});}
    return doc;
  }
  const api={defaults,normalise,typeCounts,switchType,layout,pdfPath,createPDF};
  if(typeof module==='object')module.exports=api;
  else root.StaffPaperCore=api;
})(typeof window==='object'?window:globalThis);
