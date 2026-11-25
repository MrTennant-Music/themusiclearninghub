/* Printable Concept Dictionary booklets. Uses the same saved content as the Dictionary. */
(function(root){
'use strict';
const keys=['N3','N4','N5','H','AH'];
function selection(data,selected){
 const ids=new Set();return data.levels.flatMap((level,i)=>selected.includes(keys[i])?data.categories.flatMap((category,cat)=>data.tables[level][cat].filter(id=>!ids.has(id)&&ids.add(id)).map(id=>({concept:data.concepts.find(c=>c.id===id),level,category}))).filter(item=>item.concept):[]);
}
function levelTitle(data,selected){const labels=keys.filter(key=>selected.includes(key)).map(key=>data.levels[keys.indexOf(key)]);return labels.length===5?'All Levels':labels.join(' & ');}
function currentLevels(settings){return [keys.includes(settings.level)?settings.level:'N5'];}
const viewOptions=[['definition','Definition'],['image','Image'],['listen','Listen For'],['trends','Exam Trends']];
function resolveViews(settings={},saved={}){const source=settings.views||saved;return Object.fromEntries(viewOptions.map(([key])=>[key,typeof source?.[key]==='boolean'?source[key]:true]));}
const plainLiteracyText=value=>value.replace(/<\/?i>/g,'').replaceAll('&lt;','<').replaceAll('&gt;','>')
 .replaceAll('♯',' sharp').replaceAll('♭',' flat').replaceAll('⁷','7').replaceAll('⁶','6');
async function build({data,photos,levels,includeContents=false,frequencyData=root.MUSIC_CONCEPT_FREQUENCY,simpleDefinitions=root.MUSIC_CONCEPTS_SIMPLE,literacyEntries=root.MLHMusicLiteracyDictionary?.entries??[],literacyTrends=root.MLHMusicLiteracyExamTrends,views={},loadImage,loadLiteracyImage=loadImage,loadNotation,onProgress=()=>{}}){
 if(levels.length!==1||!keys.includes(levels[0]))throw Error('Choose one qualification level for each booklet.');
 views=resolveViews({views});
 const conceptReport=views.trends?frequencyData?.reports[levels[0]]:null;
 const literacyReport=views.trends?literacyTrends?.reports[levels[0]]:null;
 if(views.trends&&['N5','H','AH'].includes(levels[0])&&!conceptReport)throw Error('Exam Trends data could not be loaded.');
 const {PDFDocument,rgb,PDFString,StandardFonts}=root.PDFLib,doc=await PDFDocument.create();
 const regular=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
 const ink=rgb(.08,.08,.08),grey=rgb(.38,.38,.38),line=rgb(.85,.85,.85),pale=rgb(.97,.97,.96),W=595.28,H=841.89,M=42,CW=W-2*M;
 const selected=selection(data,levels),title=levelTitle(data,levels),cache=new Map();
 const literacy=literacyEntries.filter(entry=>entry.level===levels[0]);
 const items=[...selected,...literacy.map(entry=>({
  concept:{id:entry.id,name:plainLiteracyText(entry.markup),definition:plainLiteracyText(entry.definition),features:[]},
  level:title,category:'Music Literacy',literacyEntry:entry,
 }))];
 const conceptCount=items.length;
 const wrap=(text,font,size,width)=>{const lines=[];for(const paragraph of String(text).split('\n')){let row='';for(const word of paragraph.split(/\s+/)){const next=row?row+' '+word:word;if(row&&font.widthOfTextAtSize(next,size)>width){lines.push(row);row=word;}else row=next;}lines.push(row);}return lines;};
 const text=(page,lines,x,y,font=regular,size=11,leading=15,color=ink)=>{for(const row of lines){page.drawText(row,{x,y,font,size,color});y-=leading;}return y;};
 const link=(page,rect,uri)=>{if(!uri)return;const annotation=doc.context.register(doc.context.obj({Type:'Annot',Subtype:'Link',Rect:rect,Border:[0,0,0],A:{S:'URI',URI:PDFString.of(uri)}}));page.node.addAnnot(annotation);};
 const image=async (src,isLiteracy=false)=>{
  const key=isLiteracy?'literacy:'+src:src;
  if(!cache.has(key))cache.set(key,(async()=>doc.embedJpg(await (isLiteracy?loadLiteracyImage:loadImage)(src)))());
  return cache.get(key);
 };
 let page=null,y=0,lastGroup='';
 const sectionPages=new Map();
 function newPage(group,section){
  page=doc.addPage([W,H]);
  if(section&&!sectionPages.has(section))sectionPages.set(section,doc.getPageCount());
  text(page,wrap(group,bold,16,CW),M,H-71,bold,16,21);
  page.drawLine({start:{x:M,y:H-88},end:{x:W-M,y:H-88},thickness:.7,color:line});
  y=H-110;
 }
 if(includeContents)newPage(title+' · Contents');
 const contentsPage=page;
 for(let index=0;index<items.length;index++){
  const {concept,level,category,literacyEntry}=items[index],group=level+' · '+category;
  onProgress(index,conceptCount);
  const picture=literacyEntry?.picture;
  const photo=views.image&&!literacyEntry?photos?.subjects[photos.concepts[concept.id]]:null;
  let img=null;
  if(photo)img=await image(photo.src);
  else if(views.image&&picture){
   img=picture.src?await image(picture.src,true):await doc.embedJpg(await loadNotation(picture));
  }
  const printBorder=5,printBottom=8;
  const isSymbol=typeof picture==='string'||Boolean(picture?.symbols);
  const isAccidentalsExample=literacyEntry?.id==='tones-semitones-accidentals';
  const [imageWidthLimit,imageHeightLimit]=isAccidentalsExample?[72,46]:isSymbol?[100,64]:[132,99];
  const imageSize=img?img.scaleToFit(imageWidthLimit,imageHeightLimit):null;
  const bodyWidth=img?CW-162:CW;
  const nameLines=wrap(concept.name,bold,16,CW);
  const definition=views.definition?wrap(simpleDefinitions?.[concept.id]||concept.definition,regular,11,bodyWidth):[];
  const definitionHeight=definition.length?definition.length*15+13:0;
  const bulletIndent=12;
  const cues=(views.listen?concept.features:[]).map(cue=>wrap(cue,regular,11,bodyWidth-bulletIndent));
  const listeningGap=definition.length&&cues.length?8:0;
  const listeningHeight=cues.length?listeningGap+cues.reduce((height,rows)=>height+rows.length*15,13):0;
  const imageHeight=img?imageSize.height+printBorder+printBottom+4:0;
  const bodyHeight=Math.max(definitionHeight+listeningHeight,imageHeight);
  const trendsGap=cues.length?10:0;
  const report=literacyEntry?literacyReport:conceptReport;
  const hit=report&&(literacyEntry?literacyTrends.entry(levels[0],concept.id):report.concepts[concept.id]);
  const trendsHeight=report?64+trendsGap:0;
  const height=nameLines.length*21+8+bodyHeight+trendsHeight+22;
  if(group!==lastGroup||y-height<55){newPage(group,category);lastGroup=group;}
  y=text(page,nameLines,M,y,bold,16,21)-8;
  const top=y;
  if(definition.length){text(page,['Definition'],M,top,bold,10);text(page,definition,M,top-17,regular,11,15);}
  if(img){
   const frameWidth=imageSize.width+2*printBorder,frameHeight=imageSize.height+printBorder+printBottom;
   const left=W-M-142+(literacyEntry?(142-frameWidth)/2:0);
   const bottom=top+8-frameHeight;
   page.drawRectangle({x:left+1.5,y:bottom-1.5,width:frameWidth,height:frameHeight,color:ink,opacity:.12});
   page.drawRectangle({x:left,y:bottom,width:frameWidth,height:frameHeight,color:rgb(1,1,1),borderColor:line,borderWidth:.5});
   const x=left+printBorder,imageY=bottom+printBottom;
   page.drawImage(img,{x,y:imageY,width:imageSize.width,height:imageSize.height});
   link(page,[x,imageY,x+imageSize.width,imageY+imageSize.height],photo?.sourceUrl);
  }
  if(cues.length){
   const listeningTop=top-definitionHeight-listeningGap;
   text(page,['Listen For'],M,listeningTop,bold,10);
   let cueY=listeningTop-17;
   for(const rows of cues){
    text(page,['•'],M,cueY);
    cueY=text(page,rows,M+bulletIndent,cueY);
   }
  }
  y=top-bodyHeight;
  if(report){
   y-=8+trendsGap;text(page,['Exam Trends'],M,y,bold,10);y-=16;
   const count=hit?.count||0;
   const percent=Number((hit?.percent??100*count/report.years.length).toFixed(1));
   const verb=literacyEntry?'Tested':'Accepted answer';
   text(page,[verb+' in '+count+' of '+report.years.length+' '+report.label+' papers ('+percent+'%).'],M,y,regular,9,12,grey);y-=24;
   const yearGap=6,yearWidth=Math.min(42,(CW-yearGap*(report.years.length-1))/report.years.length);
   let yearX=M;for(const year of report.years){const found=hit?.years.includes(year),fill=found?rgb(.86,.98,.90):pale,yearFont=found?bold:regular;
    page.drawRectangle({x:yearX,y:y-3,width:yearWidth,height:19,color:fill,borderColor:found?rgb(.52,.86,.64):line,borderWidth:.5});
    text(page,[String(year)],yearX+(yearWidth-yearFont.widthOfTextAtSize(String(year),9))/2,y+3,yearFont,9,12,found?rgb(.08,.32,.16):grey);yearX+=yearWidth+yearGap;
   }y-=16;
  }
  y-=22;
 }
 if(contentsPage){
  let contentsY=H-118;
  for(const [section,startPage] of sectionPages){
   const number=String(startPage);
   text(contentsPage,[section],M,contentsY,regular,13);
   text(contentsPage,[number],W-M-regular.widthOfTextAtSize(number,13),contentsY,regular,13);
   contentsY-=32;
  }
 }
 const pages=doc.getPages();
 pages.forEach((page,index)=>{
  text(page,['The Music Learning Hub'],M,27,regular,8,10,grey);
  const label=String(index+1);
  text(page,[label],(W-regular.widthOfTextAtSize(label,8))/2,27,regular,8,10,grey);
 });
 doc.setTitle(title+' Concept Dictionary');doc.setAuthor('The Music Learning Hub');doc.setSubject('Music concept definitions, photos, listening cues'+(conceptReport||literacyReport?' and Exam Trends':''));
 return {bytes:await doc.save(),pageCount:pages.length,conceptCount,title};
}
root.MusicConceptBooklet={selection,levelTitle,currentLevels,resolveViews,build};
if(typeof module!=='undefined'&&module.exports)module.exports=root.MusicConceptBooklet;
if(typeof document==='undefined')return;
let config;try{config=JSON.parse(sessionStorage.getItem('worksheetSourceConfig')||'null');}catch{return;}
if(config?.activityId!=='music-dictionary')return;
const h=React.createElement,D=root.MUSIC_CONCEPTS;
function trimNotationMargins(canvas){
 const {width,height}=canvas;
 const {data}=canvas.getContext('2d').getImageData(0,0,width,height);
 let left=width,top=height,right=-1,bottom=-1;
 for(let y=0;y<height;y++){
  for(let x=0;x<width;x++){
   const offset=(y*width+x)*4;
   if(data[offset+3]<32||Math.min(data[offset],data[offset+1],data[offset+2])>=215)continue;
   left=Math.min(left,x);right=Math.max(right,x);
   top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
 }
 if(right<left)return canvas;
 const padding=Math.max(4,Math.ceil(Math.min(right-left+1,bottom-top+1)*.06));
 const trimmed=document.createElement('canvas');
 const inkWidth=right-left+1,inkHeight=bottom-top+1;
 trimmed.width=inkWidth+2*padding;
 trimmed.height=inkHeight+2*padding;
 const context=trimmed.getContext('2d');
 context.fillStyle='white';
 context.fillRect(0,0,trimmed.width,trimmed.height);
 context.drawImage(canvas,left,top,inkWidth,inkHeight,padding,padding,inkWidth,inkHeight);
 return trimmed;
}
async function raster(src,trim=false){
 const img=new Image();
 const url=new URL(src,document.baseURI);
 if(url.origin!==location.origin)img.crossOrigin='anonymous';
 img.src=url.href;
 await img.decode();
 const scale=Math.min(1,700/Math.max(img.naturalWidth,img.naturalHeight)),canvas=document.createElement('canvas');
 canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
 canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
 const context=canvas.getContext('2d');
 context.fillStyle='white';context.fillRect(0,0,canvas.width,canvas.height);
 context.drawImage(img,0,0,canvas.width,canvas.height);
 const output=trim?trimNotationMargins(canvas):canvas;
 const blob=await new Promise(resolve=>output.toBlob(resolve,'image/jpeg',.88));
 if(!blob)throw Error('A booklet image could not be prepared. Please try again.');
 return new Uint8Array(await blob.arrayBuffer());
}
let readerPromise;
function PreviewPage({reader,number}){
 const holder=React.useRef(null),canvas=React.useRef(null),[visible,setVisible]=React.useState(number===1);
 React.useEffect(()=>{const observer=new IntersectionObserver(entries=>setVisible(entries[0].isIntersecting),{root:holder.current.closest('.worksheet-preview-panel'),rootMargin:'400px'});observer.observe(holder.current);return()=>observer.disconnect();},[]);
 React.useEffect(()=>{if(!visible){canvas.current.width=1;canvas.current.height=1;return;}let cancelled=false,render;reader.getPage(number).then(page=>{if(cancelled)return;const viewport=page.getViewport({scale:1.6}),target=canvas.current;target.width=viewport.width;target.height=viewport.height;render=page.render({canvasContext:target.getContext('2d'),viewport});return render.promise;}).catch(error=>{if(!cancelled&&error.name!=='RenderingCancelledException')console.error('The booklet preview page could not be drawn.',error);});return()=>{cancelled=true;render?.cancel();};},[reader,number,visible]);
 return h('div',{ref:holder,className:'mc-booklet-preview-page'},h('canvas',{ref:canvas,'aria-label':'Booklet preview, page '+number,role:'img'}));
}
function BookletPreview({result}){
 const [reader,setReader]=React.useState(null),[error,setError]=React.useState('');
 React.useEffect(()=>{let cancelled=false,loadingTask;setReader(null);setError('');if(!readerPromise)readerPromise=import('../vendor/pdfjs/pdf.mjs').then(module=>{module.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdfjs/pdf.worker.mjs',location.href).href;return module;});readerPromise.then(module=>{if(cancelled)return;loadingTask=module.getDocument({data:result.bytes.slice(),isEvalSupported:false});return loadingTask.promise;}).then(pdf=>{if(!cancelled&&pdf)setReader(pdf);}).catch(()=>{if(!cancelled)setError('Download the PDF to view your booklet.');});return()=>{cancelled=true;loadingTask?.destroy().catch(()=>{});};},[result]);
 return h(React.Fragment,null,error&&h('p',{role:'status'},error),reader&&Array.from({length:result.pageCount},(_,index)=>h(PreviewPage,{key:index,reader,number:index+1})));
}
const rasterCache=new Map();
function cachedRaster(src,load=raster){if(!rasterCache.has(src))rasterCache.set(src,load(src).catch(error=>{rasterCache.delete(src);throw error;}));return rasterCache.get(src);}
let notationStyles;
async function rasterNotation(picture){
 if(!notationStyles){
  notationStyles=new Promise((resolve,reject)=>{
   const style=document.createElement('link');
   style.rel='stylesheet';
   style.href='./music-dictionary/music-concepts.css?v=e39d09253aa4';
   style.onload=resolve;
   style.onerror=()=>reject(Error('Music Literacy notation styles could not be loaded.'));
   document.head.append(style);
  });
 }
 await notationStyles;
 await document.fonts.load('42px Bravura');
 const host=document.createElement('div');
 host.style.cssText='position:absolute;left:-10000px;top:0;width:420px;background:#fff;';
 document.body.append(host);
 const notationRoot=ReactDOM.createRoot(host);
 try{
  ReactDOM.flushSync(()=>notationRoot.render(h(root.MLHLiteracyNotation.LiteracyPicture,{picture,fitInk:true,vectorSymbols:true})));
  host.querySelectorAll('svg .mc-notation-label').forEach(label=>{
   const style=getComputedStyle(label);
   label.style.fontSize=style.fontSize;
   label.style.fontWeight=style.fontWeight;
  });
  const canvas=await html2canvas(host,{scale:2,backgroundColor:'#fff',logging:false});
  const output=trimNotationMargins(canvas);
  const blob=await new Promise(resolve=>output.toBlob(resolve,'image/jpeg',.95));
  if(!blob)throw Error('A Music Literacy example could not be prepared.');
  return new Uint8Array(await blob.arrayBuffer());
 }finally{
  notationRoot.unmount();
  host.remove();
 }
}
function App(){
 const [includeContents,setIncludeContents]=React.useState(false);
 const levels=React.useMemo(()=>currentLevels(config.settings),[]);
 const views=React.useMemo(()=>{let saved={};try{saved=JSON.parse(localStorage.getItem('mlh:music-dictionary-views:v1'))||{};}catch(_){}return resolveViews(config.settings,saved);},[]);
 const [busy,setBusy]=React.useState(true),[progress,setProgress]=React.useState(''),[error,setError]=React.useState(''),[result,setResult]=React.useState(null);
 const generation=React.useRef(0),count=selection(D,levels).length,valid=count>0;
 async function generate(){const token=++generation.current;if(!valid){setBusy(false);setResult(null);return;}setBusy(true);setError('');setProgress('Preparing booklet…');try{const output=await build({data:D,photos:root.MUSIC_CONCEPT_PHOTOS,levels,views,includeContents,loadImage:cachedRaster,loadLiteracyImage:src=>cachedRaster(src,url=>raster(url,true)),loadNotation:picture=>cachedRaster(picture,rasterNotation),onProgress:(index,total)=>{if(token!==generation.current)throw Error('Superseded');setProgress('Preparing concept '+(index+1)+' of '+total+'…');}});if(token===generation.current)setResult(output);}catch(err){if(token===generation.current){setResult(null);setError('The booklet could not be generated. '+err.message);}}finally{if(token===generation.current){setBusy(false);setProgress('');}}}
 React.useEffect(()=>{setBusy(true);const timer=setTimeout(generate,300);return()=>{clearTimeout(timer);generation.current++;};},[levels,views,includeContents]);
 function outputPdf(mode){if(!result||busy||!valid)return;try{const blob=new Blob([result.bytes],{type:'application/pdf'});if(mode==='print'){const printWindow=MLH.createPdfPrintWindow();MLH.openPdfBlobForPrint(blob,printWindow);}else{const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=result.title+' Concept Dictionary.pdf';link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}}catch(err){setError(err.message);}}
 const heading=(icon,label)=>h('h2',{className:'flex items-center gap-2 text-xl font-bold'},h('img',{src:icon,alt:'','aria-hidden':true,className:'h-6 w-6 object-contain'}),label);
 const actionClass='flex h-11 items-center justify-center gap-2 rounded-xl px-2.5 text-sm font-semibold disabled:opacity-60';
 const actionIcon=(src,className)=>h('img',{src,className,alt:''});
 const actions=h('div',{className:'mt-6 grid grid-cols-2 gap-2 border-t border-stone-200 pt-4'},
  h('button',{type:'button',className:actionClass+' border border-black bg-black text-white',disabled:busy||!result||!valid,onClick:()=>outputPdf('print')},actionIcon('ui-icons/worksheet.svg?v=20261103-worksheet-svg-2','h-4 w-4 invert'),'Print'),
  h('button',{type:'button',className:actionClass+' border border-black bg-black text-white',disabled:busy||!result||!valid,onClick:()=>outputPdf('download')},actionIcon('ui-icons/download.svg','h-5 w-5 invert'),'Download'));
 const settingsPanel=h('div',{className:'no-print mc-booklet-settings'},
  h('div',{className:'mb-6 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3'},heading('./app-icons/music-concepts-icon.svg?v=20261105-dictionary-icon','Concept Dictionary · '+levelTitle(D,levels)),h('p',{className:'mt-1 text-sm text-stone-600'},'Create a printable concept booklet.')),
  h('div',{className:'rounded-xl border border-stone-200 bg-stone-50 p-4'},heading('ui-icons/customise.svg','Customise'),h('p',{className:'mt-1 text-sm text-stone-600'},'Uses your Concept Dictionary view settings.'),
   h('label',{className:'mc-booklet-option mt-4'},
    h('input',{type:'checkbox',className:'worksheet-checkbox',checked:includeContents,onChange:event=>{
     setBusy(true);
     setIncludeContents(event.target.checked);
    }}),'Contents'),
   actions,
   h('p',{role:'status','aria-live':'polite',className:'mc-booklet-status'},progress),error&&h('p',{role:'alert',className:'mc-booklet-error'},error)));
 const placeholder=h('div',{className:'mc-booklet-placeholder'},h('img',{src:'./app-icons/the-music-learning-hub-logo.svg',alt:'The Music Learning Hub'}),h('h2',null,levels.length?levelTitle(D,levels):'Choose your levels'),h('p',null,'Concept Dictionary Reference Booklet'),h('p',null,'Preparing your booklet…'));
 const previewPanel=h('section',{className:'print-area worksheet-preview-panel','aria-label':'Booklet preview','aria-busy':busy},
  h('div',{className:'no-print mb-4'},heading('ui-icons/worksheet.svg?v=20261103-worksheet-svg-2','Preview'),h('p',{className:'mt-1 text-sm text-stone-600'},'Updates automatically as you change the options.'),result&&h('p',{className:'mc-booklet-count'},result.conceptCount+' concepts · '+result.pageCount+' pages')),
  h('div',{className:'transition-opacity duration-300',style:{opacity:busy ? .45 : 1}},result&&valid?h(BookletPreview,{result}):placeholder));
 return h('div',{className:MLH.shell.pageShellClass},
  h(MLH.AppHeader,{icon:'./app-icons/music-concepts-icon.svg?v=20261105-dictionary-icon',title:'Concept Dictionary',subtitle:config.subtitle||'Explore musical concepts, definitions and examples.',profileShareDisabled:true}),
  h('div',{className:MLH.shell.pageContentClass+' worksheet-page-content'},h('main',{className:MLH.shell.mainShellClass+' worksheet-builder h-auto min-h-0 p-6'},settingsPanel,previewPanel)));

}
root.MLH.worksheetHeaderMode={title:'Concept Dictionary',subtitle:config.subtitle||'Explore musical concepts, definitions and examples.',icon:'./app-icons/music-concepts-icon.svg?v=20261105-dictionary-icon',onExit:()=>{location.href=sessionStorage.getItem('worksheetReturnUrl')||'./music-dictionary/musicdictionary.html';}};
document.title=(config.pageTitle||'Concept Dictionary').replace('Music Dictionary','Concept Dictionary');ReactDOM.createRoot(document.getElementById('root')).render(h(App));
})(typeof window!=='undefined'?window:globalThis);
