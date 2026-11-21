/* Direct PDF drawing keeps table text, vertical headings and marks aligned. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AssessmentPdf = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const bands = [ ['excellent','(9-10) Excellent'], ['secure','(7-8) Secure'], ['mainly','(5-6) Mainly accurate'], ['inconsistent','(3-4) Inconsistent'], ['poor','(0-2) Poor'] ];
  const criteria = ['Melodic accuracy / intonation','Rhythmic accuracy','Tempo and flow','Mood and character','Tone','Dynamics'];
  const levels = ['National 5','Higher','Advanced Higher'];
  const entered = piece => piece.score !== '' && piece.score != null && Number.isFinite(Number(piece.score));
  function marks(instrument) {
    const scores = (instrument?.pieces || []).filter(entered).map(piece => Number(piece.score));
    return scores.length ? {raw:scores.reduce((a,b)=>a+b,0),scaled:scores.reduce((a,b)=>a+b,0)/scores.length*3} : {raw:'',scaled:''};
  }
  function create(jsPDF, fonts) {
    const pdf = new jsPDF({unit:'mm',format:'a4',orientation:'portrait',compress:true});
    pdf.addFileToVFS('Assessment-Regular.ttf', fonts.regular);
    pdf.addFont('Assessment-Regular.ttf','Assessment','normal');
    pdf.addFileToVFS('Assessment-Bold.ttf', fonts.bold);
    pdf.addFont('Assessment-Bold.ttf','Assessment','bold');
    pdf.setFont('Assessment','normal');
    pdf._assessmentPages = 0;
    return pdf;
  }
  function page(pdf) {
    if (pdf._assessmentPages++) pdf.addPage();
    pdf.setDrawColor(0); pdf.setTextColor(0); pdf.setLineWidth(.22);
  }
  function font(pdf,size,bold=false) { pdf.setFont('Assessment',bold?'bold':'normal'); pdf.setFontSize(size); }
  function text(pdf,value,x,y,width,height,{size=11,bold=false,align='left',onOverflow,overflowLabel='See additional comments.'}={}) {
    const string = String(value ?? '');
    if (!string) return;
    let lines;
    do {
      font(pdf,size,bold);
      lines=pdf.splitTextToSize(string,width);
      if (lines.length*size*.3528*1.15<=height || size<=6) break;
      size-=.5;
    } while(true);
    const lineHeight=size*.3528*1.15;
    if (lines.length*lineHeight>height) {
      const available=Math.max(1,Math.floor(height/lineHeight));
      if (onOverflow) {
        onOverflow(string);
        lines=lines.slice(0,available-1).concat(overflowLabel);
      } else {
        lines=lines.slice(0,available);
        let last=lines[available-1].trimEnd();
        while (pdf.getTextWidth(last+'…')>width && last) last=last.slice(0,-1);
        lines[available-1]=last+'…';
      }
    }
    const baseline=y+(height-lines.length*lineHeight)/2+size*.3528*.82;
    pdf.text(lines, align==='center'?x+width/2:align==='right'?x+width:x, baseline, {align,lineHeightFactor:1.15});
  }
  function detailOverflow(pdf,heading) {
    return {
      overflowLabel:'See additional details.',
      onOverflow:value=>{
        pdf._assessmentOverflow ||= [];
        pdf._assessmentOverflow.push({heading,comment:value,detail:true});
      }
    };
  }
  function box(pdf,x,y,w,h,fill) {
    if (fill) {pdf.setFillColor(fill);pdf.rect(x,y,w,h,'FD');} else pdf.rect(x,y,w,h);
  }
  function tick(pdf,x,y,size=3) {
    pdf.setLineWidth(.5);pdf.line(x,y+size*.55,x+size*.35,y+size);pdf.line(x+size*.35,y+size,x+size,y);pdf.setLineWidth(.22);
  }
  function cover(pdf,{pupilName='',level='',title='Music: Performing Assessment',instruments=[],blank=false,options={},graphic}) {
    page(pdf);
    const show = key => options[key] !== false;
    if (show('scores')) {
      const values=instruments.map(instrument=>marks(instrument).scaled);
      const total=values.filter(value=>value!=='').reduce((a,b)=>a+Math.round(b),0);
      ['Instrument 1','Instrument 2','Total'].forEach((label,i)=>{
        const x=15+i*69.5;
        text(pdf,label,x,15,40,8,{size:14,bold:true});
        box(pdf,x,25,40,17);
        const value=blank?'':i<2?(values[i]===''||values[i]==null?'':Math.round(values[i])):values.some(v=>v!==''&&v!=null)?Math.round(total):'';
        text(pdf,`${value} /${i===2?60:30}`,x+3,26,34,15,{size:22,align:'right'});
      });
    }
    text(pdf,title,15,52,180,20,{size:24,align:'center',...detailOverflow(pdf,'Assessment title')});
    if (show('quavers') && graphic) pdf.addImage(graphic,'PNG',56.5,100,97,97);
    let y=282-(show('name')?22:0)-(show('level')?22:0)-(show('name')&&show('level')?8:0);
    if (show('level')) {
      box(pdf,15,y,180,22);pdf.line(53,y,53,y+22);
      text(pdf,'Level',19,y,30,22,{size:20,bold:true});
      const positions=[57,103,138];
      levels.forEach((label,i)=>{
        box(pdf,positions[i],y+8,6,6);
        if(!blank&&level===label)tick(pdf,positions[i]+1,y+9,4);
        text(pdf,label,positions[i]+8,y, i===2?46:35,22,{size:11.5});
      });
      y+=30;
    }
    if(show('name')) {
      box(pdf,15,y,180,22);pdf.line(53,y,53,y+22);
      text(pdf,'Name',19,y,30,22,{size:20,bold:true});
      text(pdf,blank?'':pupilName,58,y,132,22,{size:21,...detailOverflow(pdf,'Pupil name')});
    }
  }
  function instrument(pdf,{instrument={},instrumentIndex=0,continuation=false,extended=false,pupilName='',level='',title='',blank=false}) {
    page(pdf);
    if (!blank) text(pdf,[pupilName,level,title].filter(Boolean).join(' · '),7,3,196,6,{size:9,align:'center'});
    const widths=[66.64,12.74,12.74,12.74,12.74,12.74,15.68,49.98];
    const xs=[7];widths.forEach(w=>xs.push(xs[xs.length-1]+w));
    let y=12;const header=38;
    widths.forEach((w,i)=>box(pdf,xs[i],y,w,header,(i===2||i===4)?'#d2d2d2':null));
    text(pdf,`Instrument ${instrumentIndex+1} / voice:`,xs[0]+6,y+3,widths[0]-12,17,{size:17,bold:true});
    text(pdf,blank?'':instrument.name,xs[0]+6,y+21,widths[0]-12,10,
      {size:13,...detailOverflow(pdf,`Instrument ${instrumentIndex+1} name`)});
    if(!continuation){
      pdf.line(xs[0]+6,y+33,xs[1]-6,y+33);
    }
    font(pdf,10.5,true);
    [...bands.map(b=>b[1]),'Mark /10'].forEach((label,i)=>{
      const col=i+1;
      const length=pdf.getTextWidth(label);
      pdf.text(label,xs[col]+widths[col]/2+1.25,y+header/2+length/2,{angle:90});
    });
    text(pdf,'Comments',xs[7]+2,y,widths[7]-4,header,{size:17,bold:true});
    y+=header;
    const offset=continuation?4:0;
    for(let local=0;local<4;local++) {
      const piece=instrument.pieces?.[offset+local]||{};
      const titleHeight=9, rowHeight=6.5, block=titleHeight+6*rowHeight;
      box(pdf,xs[0],y,xs[6]-xs[0],titleHeight);
      text(pdf,`Piece ${offset+local+1} —`,xs[0]+2,y,22,titleHeight,{size:12,bold:true});
      text(pdf,blank?'':piece.title,xs[0]+25,y,xs[6]-xs[0]-28,titleHeight,
        {size:11,...detailOverflow(pdf,`Instrument ${instrumentIndex+1} · Piece ${offset+local+1} title`)});
      pdf.line(xs[0]+25,y+titleHeight-1,xs[6]-3,y+titleHeight-1);
      box(pdf,xs[6],y,widths[6],block);box(pdf,xs[7],y,widths[7],block);
      text(pdf,blank?'':piece.score,xs[6]+1,y+1,widths[6]-2,block-2,{size:19,align:'center'});
      text(pdf,blank?'':piece.comment,xs[7]+2,y+2,widths[7]-4,block-4,{size:11,onOverflow:comment=>{
        pdf._assessmentOverflow ||= [];
        pdf._assessmentOverflow.push({heading:`Instrument ${instrumentIndex+1} · Piece ${offset+local+1}`,comment});
      }});
      criteria.forEach((criterion,r)=>{
        const rowY=y+titleHeight+r*rowHeight;
        box(pdf,xs[0],rowY,widths[0],rowHeight);
        text(pdf,criterion,xs[0]+2,rowY,widths[0]-4,rowHeight,{size:11.5});
        bands.forEach((band,b)=>{
          const c=b+1;box(pdf,xs[c],rowY,widths[c],rowHeight,(b===1||b===3)?'#d2d2d2':null);
          if(!blank&&piece.ratings?.[r]===band[0])tick(pdf,xs[c]+widths[c]/2-1.5,rowY+1.7,3);
        });
      });
      y+=block;box(pdf,xs[0],y,196,5,'#d2d2d2');y+=5;
    }
    if(continuation||!extended){
      const result=marks(instrument);
      [['TOTAL MARK',blank?'':result.raw],['FINAL SCALED MARK',`${blank||result.scaled===''?'':Math.round(result.scaled)} /30`]].forEach(([label,value])=>{
        box(pdf,xs[0],y,xs[7]-xs[0],10);box(pdf,xs[7],y,widths[7],10);
        text(pdf,`${label} – instrument ${instrumentIndex+1} or voice`,xs[0]+2,y,xs[7]-xs[0]-4,10,{size:12,bold:true});
        text(pdf,value,xs[7]+2,y,widths[7]-4,10,{size:16,align:'right'});y+=10;
      });
    }
  }
  function additionalComments(pdf,{pupilName='',level='',title=''}={}) {
    const entries=pdf._assessmentOverflow || [];
    if (!entries.length) return;
    pdf._assessmentOverflow=[];
    let y;
    const startPage=()=>{
      page(pdf);
      text(pdf,[pupilName,level,title].filter(Boolean).join(' · '),15,5,180,8,{size:9,align:'center'});
      text(pdf,entries.some(entry=>entry.detail)?'Additional assessment details':'Additional comments',15,17,180,12,{size:18,bold:true});
      y=35;
    };
    startPage();
    entries.forEach(({heading,comment})=>{
      if(y>262) startPage();
      text(pdf,heading,15,y,180,8,{size:12,bold:true});y+=10;
      font(pdf,11);
      const lines=pdf.splitTextToSize(comment,180);
      while(lines.length){
        const capacity=Math.floor((282-y)/4.5);
        if(capacity<1){startPage();continue;}
        const chunk=lines.splice(0,capacity);
        font(pdf,11);pdf.text(chunk,15,y+3.2,{lineHeightFactor:4.5/(11*.3528)});
        y+=chunk.length*4.5;
        if(lines.length) {startPage();text(pdf,`${heading} (continued)`,15,y,180,8,{size:12,bold:true});y+=10;}
      }
      y+=8;
    });
  }
  return {create,cover,instrument,marks,additionalComments};
});
