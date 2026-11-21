/* Printable Music Dictionary booklets. Uses the same saved content as the Dictionary. */
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
async function build({data,photos,levels,include={},frequencyData=root.MUSIC_CONCEPT_FREQUENCY,views={},loadImage,loadFont,onProgress=()=>{}}){
 if(levels.length!==1||!keys.includes(levels[0]))throw Error('Choose one qualification level for each booklet.');
 const frontPage=include.frontPage!==false,hasName=include.name!==false,hasClass=include.classField===true;
 views=resolveViews({views});
 const report=views.trends&&['N5','H','AH'].includes(levels[0])?frequencyData?.reports[levels[0]]:null;
 if(views.trends&&['N5','H','AH'].includes(levels[0])&&!report)throw Error('Exam Trends data could not be loaded.');
 const {PDFDocument,rgb,PDFString,StandardFonts}=root.PDFLib,doc=await PDFDocument.create();
 doc.registerFontkit(root.fontkit);
 const regular=await doc.embedFont(await loadFont('fonts/Trebuchet MS.ttf'),{subset:true}),bold=await doc.embedFont(await loadFont('fonts/Trebuchet MS Bold.ttf'),{subset:true});
 const ink=rgb(.08,.08,.08),grey=rgb(.38,.38,.38),line=rgb(.85,.85,.85),pale=rgb(.97,.97,.96),W=595.28,H=841.89,M=42,CW=W-2*M;
 const selected=selection(data,levels),title=levelTitle(data,levels),cache=new Map();
 const wrap=(text,font,size,width)=>{const lines=[];for(const paragraph of String(text).split('\n')){let row='';for(const word of paragraph.split(/\s+/)){const next=row?row+' '+word:word;if(row&&font.widthOfTextAtSize(next,size)>width){lines.push(row);row=word;}else row=next;}lines.push(row);}return lines;};
 const text=(page,lines,x,y,font=regular,size=11,leading=15,color=ink)=>{for(const row of lines){page.drawText(row,{x,y,font,size,color});y-=leading;}return y;};
 const link=(page,rect,uri)=>{if(!uri)return;const annotation=doc.context.register(doc.context.obj({Type:'Annot',Subtype:'Link',Rect:rect,Border:[0,0,0],A:{S:'URI',URI:PDFString.of(uri)}}));page.node.addAnnot(annotation);};
 const image=async src=>{if(!cache.has(src))cache.set(src,(async()=>doc.embedJpg(await loadImage(src)))());return cache.get(src);};
 if(frontPage){
 const cover=doc.addPage([W,H]);
 // Match the 560px-wide loading preview's logo, typography and spacing.
 const scale=W/560,coverRegular=await doc.embedFont(StandardFonts.Helvetica),coverBold=await doc.embedFont(StandardFonts.HelveticaBold);
 const logo=await image('./app-icons/the-music-learning-hub-logo.svg'),logoScale=logo.scaleToFit(220*scale,120*scale);
 const titleSize=23*scale,subtitleSize=16*scale,titleHeight=34.5*scale,subtitleHeight=24*scale;
 const groupHeight=logoScale.height+40*scale+titleHeight+18*scale+subtitleHeight+59.5*scale;
 let top=(H-groupHeight)/2;
 cover.drawImage(logo,{x:(W-logoScale.width)/2,y:H-top-logoScale.height,width:logoScale.width,height:logoScale.height});
 top+=logoScale.height+40*scale;
 const centredLine=(value,font,size,lineHeight)=>{
  const height=font.heightAtSize(size,{descender:false});
  cover.drawText(value,{x:(W-font.widthOfTextAtSize(value,size))/2,y:H-top-(lineHeight-height)/2-height,font,size,color:ink});
  top+=lineHeight;
 };
 centredLine(title,coverBold,titleSize,titleHeight);
 top+=18*scale;
 centredLine('Music Concepts Reference Booklet',coverRegular,subtitleSize,subtitleHeight);
 let fieldY=118;if(hasName){text(cover,['Name: __________________________________________'],M,fieldY,regular,12);fieldY-=30;}if(hasClass)text(cover,['Class: ___________________________________________'],M,fieldY,regular,12);
 }
 let page=null,y=0,lastGroup='';
 function newPage(group){page=doc.addPage([W,H]);text(page,wrap(group,bold,16,CW),M,H-71,bold,16,21);page.drawLine({start:{x:M,y:H-88},end:{x:W-M,y:H-88},thickness:.7,color:line});y=H-110;if(!frontPage&&doc.getPageCount()===1){if(hasName||hasClass){const fields=[hasName?'Name: ______________________________':'',hasClass?'Class: __________________':''].filter(Boolean);text(page,[fields.join('     ')],M,y,regular,10);y-=34;}}}
 for(let index=0;index<selected.length;index++){
  const {concept,level,category}=selected[index],group=level+' · '+category;
  onProgress(index,selected.length);
  const photo=views.image?photos?.subjects[photos.concepts[concept.id]]:null,img=photo?await image(photo.src):null;
  const imageSize=img?img.scaleToFit(142,112):null,bodyWidth=img?CW-162:CW;
  const nameLines=wrap(concept.name,bold,16,CW),definition=views.definition?wrap(concept.definition,regular,11,bodyWidth):[];
  const caption=photo?wrap(photo.caption,regular,8,142):[];
  const bodyHeight=Math.max(definition.length?definition.length*15+23:0,img?imageSize.height+caption.length*10+12:0);
  const cues=(views.listen?concept.features:[]).map(cue=>wrap(cue,regular,11,CW-28));
  const listeningHeight=cues.length?30+cues.reduce((n,rows)=>n+rows.length*15+5,0)+12:0;
  const hit=report?.concepts[concept.id],trendsHeight=report?64:0;
  const height=nameLines.length*21+14+bodyHeight+listeningHeight+trendsHeight+22;
  if(!page||group!==lastGroup||y-height<55){newPage(group);lastGroup=group;}
  y=text(page,nameLines,M,y,bold,16,21)-8;
  const top=y;
  if(definition.length){text(page,['Definition'],M,top,bold,10);text(page,definition,M,top-20,regular,11,15);}
  if(img){const ix=W-M-142;page.drawImage(img,{x:ix,y:top-imageSize.height+8,width:imageSize.width,height:imageSize.height});link(page,[ix,top-imageSize.height+8,ix+imageSize.width,top+8],photo.sourceUrl);text(page,caption,ix,top-imageSize.height-6,regular,8,10,grey);}
  y=top-bodyHeight;
  if(cues.length){page.drawRectangle({x:M,y:y-listeningHeight+12,width:CW,height:listeningHeight-2,color:pale,borderColor:line,borderWidth:.5});let ly=y-9;ly=text(page,['Listen For'],M+12,ly,bold,11,15)-8;for(const rows of cues){text(page,['•'],M+12,ly,regular,11);ly=text(page,rows,M+25,ly,regular,11,15)-5;}y-=listeningHeight;}
  if(report){
   if(y-80<55)newPage(group);
   y-=8;text(page,['Exam Trends'],M,y,bold,10);y-=16;
   const percent=hit?Number(hit.percent.toFixed(1)):0;
   text(page,['Accepted answer in '+(hit?.count||0)+' of '+report.years.length+' '+report.label+' papers ('+percent+'%).'],M,y,regular,9,12,grey);y-=24;
   const yearGap=6,yearWidth=Math.min(42,(CW-yearGap*(report.years.length-1))/report.years.length);
   let yearX=M;for(const year of report.years){const found=hit?.years.includes(year),fill=found?rgb(.86,.98,.90):pale,yearFont=found?bold:regular;
    page.drawRectangle({x:yearX,y:y-3,width:yearWidth,height:19,color:fill,borderColor:found?rgb(.52,.86,.64):line,borderWidth:.5});
    text(page,[String(year)],yearX+(yearWidth-yearFont.widthOfTextAtSize(String(year),9))/2,y+3,yearFont,9,12,found?rgb(.08,.32,.16):grey);yearX+=yearWidth+yearGap;
   }y-=16;
  }
  y-=22;
 }
 const pages=doc.getPages();pages.forEach((p,i)=>{if(frontPage&&!i)return;text(p,['The Music Learning Hub'],M,27,regular,8,10,grey);const offset=frontPage?1:0,label=(i+1-offset)+' / '+(pages.length-offset);text(p,[label],W-M-regular.widthOfTextAtSize(label,8),27,regular,8,10,grey);});
 doc.setTitle(title+' Music Concepts');doc.setAuthor('The Music Learning Hub');doc.setSubject('Music concept definitions, photos, listening cues'+(report?' and Exam Trends':''));
 return {bytes:await doc.save(),pageCount:pages.length,conceptCount:selected.length,title};
}
root.MusicConceptBooklet={selection,levelTitle,currentLevels,resolveViews,build};
if(typeof module!=='undefined'&&module.exports)module.exports=root.MusicConceptBooklet;
if(typeof document==='undefined')return;
let config;try{config=JSON.parse(sessionStorage.getItem('worksheetSourceConfig')||'null');}catch{return;}
if(config?.activityId!=='music-dictionary')return;
const h=React.createElement,D=root.MUSIC_CONCEPTS;
async function raster(src){
 const img=new Image();
 // Request CORS permission before loading remote Commons photos so the canvas stays exportable.
 img.crossOrigin='anonymous';
 img.src=new URL(src,location.href).href;
 await img.decode();
 const scale=Math.min(1,700/Math.max(img.naturalWidth,img.naturalHeight)),canvas=document.createElement('canvas');
 canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
 canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
 const context=canvas.getContext('2d');
 context.fillStyle='white';context.fillRect(0,0,canvas.width,canvas.height);
 context.drawImage(img,0,0,canvas.width,canvas.height);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.88));
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
const rasterCache=new Map(),fontCache=new Map();
function cachedRaster(src){if(!rasterCache.has(src))rasterCache.set(src,raster(src).catch(error=>{rasterCache.delete(src);throw error;}));return rasterCache.get(src);}
function loadFont(name){if(!fontCache.has(name))fontCache.set(name,fetch('./'+name).then(response=>{if(!response.ok)throw Error('The booklet font could not be loaded.');return response.arrayBuffer();}).then(bytes=>new Uint8Array(bytes)).catch(error=>{fontCache.delete(name);throw error;}));return fontCache.get(name);}
function App(){
 const levels=React.useMemo(()=>currentLevels(config.settings),[]);
 const views=React.useMemo(()=>{let saved={};try{saved=JSON.parse(localStorage.getItem('mlh:music-dictionary-views:v1'))||{};}catch(_){}return resolveViews(config.settings,saved);},[]);
 const [include,setInclude]=React.useState({frontPage:true,name:true,classField:true}),[busy,setBusy]=React.useState(true),[progress,setProgress]=React.useState(''),[error,setError]=React.useState(''),[result,setResult]=React.useState(null);
 const generation=React.useRef(0),count=selection(D,levels).length,valid=count>0;
 async function generate(){const token=++generation.current;if(!valid){setBusy(false);setResult(null);return;}setBusy(true);setError('');setProgress('Preparing booklet…');try{const output=await build({data:D,photos:root.MUSIC_CONCEPT_PHOTOS,levels,include,views,loadImage:cachedRaster,loadFont,onProgress:(index,total)=>{if(token!==generation.current)throw Error('Superseded');setProgress('Preparing concept '+(index+1)+' of '+total+'…');}});if(token===generation.current)setResult(output);}catch(err){if(token===generation.current)setError('The booklet could not be generated. '+err.message);}finally{if(token===generation.current){setBusy(false);setProgress('');}}}
 React.useEffect(()=>{setBusy(true);const timer=setTimeout(generate,300);return()=>{clearTimeout(timer);generation.current++;};},[levels,include]);
 function outputPdf(mode){if(!result||busy||!valid)return;try{const blob=new Blob([result.bytes],{type:'application/pdf'});if(mode==='print'){const printWindow=MLH.createPdfPrintWindow();MLH.openPdfBlobForPrint(blob,printWindow);}else{const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=result.title+' Music Concepts.pdf';link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}}catch(err){setError(err.message);}}
 const row=(label,checked,onChange)=>h('label',{className:'mc-booklet-option'},h('input',{type:'checkbox',className:'worksheet-checkbox',checked,onChange}),h('span',null,label));
 const heading=(icon,label)=>h('h2',{className:'flex items-center gap-2 text-xl font-bold'},h('img',{src:icon,alt:'','aria-hidden':true,className:'h-6 w-6 object-contain'}),label);
 const actionClass='flex h-11 items-center justify-center rounded-xl px-2.5 text-sm font-semibold disabled:opacity-60';
 const includeField=h('div',{className:'flex flex-wrap gap-x-7 gap-y-2'},
  [['frontPage','Front Page'],['name','Name'],['classField','Class']].map(([key,label])=>h(React.Fragment,{key},row(label,include[key],()=>setInclude({...include,[key]:!include[key]})))));
 const actions=h('div',{className:'mt-6 grid grid-cols-3 gap-2 border-t border-stone-200 pt-4'},
  h('button',{type:'button',className:actionClass+' border border-stone-300 bg-white text-stone-800',disabled:busy||!valid,onClick:generate},'Refresh'),
  h('button',{type:'button',className:actionClass+' border border-black bg-black font-bold text-white',disabled:busy||!result||!valid,onClick:()=>outputPdf('download')},'Download'),
  h('button',{type:'button',className:actionClass+' border border-black bg-black font-bold text-white',disabled:busy||!result||!valid,onClick:()=>outputPdf('print')},'Print'));
 const settingsPanel=h('div',{className:'no-print mc-booklet-settings'},
  h('div',{className:'mb-6 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3'},heading('./app-icons/music-concepts-icon.svg?v=20261105-dictionary-icon','Music Dictionary · '+levelTitle(D,levels)),h('p',{className:'mt-1 text-sm text-stone-600'},'Create a printable concept booklet.')),
  h('div',{className:'rounded-xl border border-stone-200 bg-white p-4'},heading('ui-icons/customise.svg','Customise'),h('p',{className:'mt-1 text-sm text-stone-600'},'Uses your Music Dictionary view settings.'),
   h('div',{className:'mt-4 space-y-4'},includeField),actions,
   h('p',{role:'status','aria-live':'polite',className:'mc-booklet-status'},progress),error&&h('p',{role:'alert',className:'mc-booklet-error'},error)));
 const placeholder=h('div',{className:'mc-booklet-placeholder'},h('img',{src:'./app-icons/the-music-learning-hub-logo.svg',alt:'The Music Learning Hub'}),h('h2',null,levels.length?levelTitle(D,levels):'Choose your levels'),h('p',null,'Music Concepts Reference Booklet'),h('p',null,'Preparing your booklet…'));
 const previewPanel=h('section',{className:'print-area worksheet-preview-panel','aria-label':'Booklet preview','aria-busy':busy},
  h('div',{className:'no-print mb-4'},heading('ui-icons/worksheet.svg?v=20261103-worksheet-svg-2','Preview'),h('p',{className:'mt-1 text-sm text-stone-600'},'Updates automatically as you change the options.'),result&&h('p',{className:'mc-booklet-count'},result.conceptCount+' concepts · '+result.pageCount+' pages')),
  h('div',{className:'transition-opacity duration-300',style:{opacity:busy ? .45 : 1}},result&&valid?h(BookletPreview,{result}):placeholder));
 return h('div',{className:MLH.shell.pageShellClass},
  h(MLH.AppHeader,{icon:'./app-icons/music-concepts-icon.svg?v=20261105-dictionary-icon',title:'Music Dictionary',subtitle:config.subtitle||'Explore musical concepts, definitions and examples.',profileShareDisabled:true}),
  h('div',{className:MLH.shell.pageContentClass+' worksheet-page-content'},h('main',{className:MLH.shell.mainShellClass+' worksheet-builder h-auto min-h-0 p-6'},settingsPanel,previewPanel)));

}
root.MLH.worksheetHeaderMode={title:'Music Dictionary',subtitle:config.subtitle||'Explore musical concepts, definitions and examples.',icon:'./app-icons/music-concepts-icon.svg?v=20261105-dictionary-icon',onExit:()=>{location.href=sessionStorage.getItem('worksheetReturnUrl')||'./music-dictionary/musicdictionary.html';}};
document.title=config.pageTitle||'Music Dictionary';ReactDOM.createRoot(document.getElementById('root')).render(h(App));
})(typeof window!=='undefined'?window:globalThis);
