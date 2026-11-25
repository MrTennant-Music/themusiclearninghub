(function(){
'use strict';
const h=React.createElement,D=window.MUSIC_CONCEPTS,byId=new Map(D.concepts.map(c=>[c.id,c]));
const quizApp=!!window.MLH_CONCEPT_QUIZ_APP,quizPage='./conceptquiz.html';
const literacyQuizUrl=level=>quizPage+'?'+new URLSearchParams({level,literacyQuiz:'1'});
const keys=['N3','N4','N5','H','AH'];
const revisionGroups=window.MusicConceptRevisionGroups;
const params=new URLSearchParams(location.search);
const collectionsReturn=(()=>{
 const value=params.get('collectionsReturn');
 if(!value)return null;
 const target=new URL('./mycollections.html',document.baseURI);
 try{
  const url=new URL(value,document.baseURI);
  return url.origin===target.origin&&url.pathname===target.pathname?url.pathname+url.search:null;
 }catch{return null;}
})();
function returnToCollection(){
 const target=new URL(collectionsReturn,document.baseURI);
 const referrer=document.referrer&&new URL(document.referrer);
 if(referrer){
  const expected=new URLSearchParams(target.search),actual=new URLSearchParams(referrer.search);
  expected.sort();actual.sort();
  if(referrer.origin===target.origin&&referrer.pathname===target.pathname&&expected.toString()===actual.toString()){
   history.back();
   return;
  }
 }
 location.assign(target.href);
}
const escapeEmbed=!quizApp&&window.parent!==window&&params.get('embed')==='escape';
if(escapeEmbed){
 document.documentElement.classList.add('mc-escape-mode');
 document.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||event.defaultPrevented)return;
  window.parent.postMessage('escape-dictionary-close',location.origin);
 });
}
const sharedQuiz=window.MusicDictionaryQuizzes?.readShared(params);if(sharedQuiz)params.set('quiz',JSON.stringify(sharedQuiz));
const revisionLevel=revisionGroups.supportedLevels.includes(params.get('revision'))?params.get('revision'):params.get('level');
// Carry the collection preview through concept links and refreshes.
const initialQuizCollection=(()=>{try{const x=JSON.parse(params.get('collection')||new URL(JSON.parse(params.get('quiz')||'null')?.returnTo||location.href,document.baseURI).searchParams.get('collection'));if(!x||typeof x.label!=='string'||!Array.isArray(x.conceptIds)||![...keys,'ALL'].includes(x.level))return null;if(['world-music','texture-structure'].includes(x.id)&&x.level==='N3')return null;if(x.id==='renaissance-music'&&['N3','N4','N5','H'].includes(x.level))return null;if(x.id==='playing-techniques-ornaments'){x.id='playing-techniques';x.label='Playing Techniques';const ornamentIds=new Set(revisionGroups.groupsForLevel('AH').find(g=>g.id==='ornaments')?.conceptIds||[]);x.conceptIds=x.conceptIds.filter(id=>!ornamentIds.has(id));}if(x.id==='playing-techniques')x.conceptIds=x.conceptIds.filter(id=>!['MC-0053','MC-0060','MC-0091'].includes(id));if(x.id==='instruments-ensembles'&&x.label==='Orchestra')x.id='orchestra';if(x.id==='orchestra'){x.label='Orchestra';x.conceptIds=(revisionGroups.groupsForLevel('AH').find(g=>g.id==='orchestra')?.conceptIds||[]).filter(id=>id!=='MC-0132');}else if(x.id==='instruments-ensembles'){const collection=window.MusicDictionaryQuizCollections?.groupsForLevel(x.level).find(g=>g.id===x.id);x.conceptIds=collection?.conceptIds||[...x.conceptIds,...(revisionGroups.groupsForLevel('AH').find(g=>g.id==='orchestra')?.conceptIds||[])];}if(x.id==='voices-vocal-music')x.conceptIds=[...x.conceptIds,'MC-0034','MC-0035','MC-0038','MC-0041'].filter(id=>!['MC-0072','MC-0078','MC-0145','MC-0149','MC-0153','MC-0155'].includes(id));if(x.id==='world-music')x.conceptIds=x.conceptIds.filter(id=>!['MC-0014','MC-0017','MC-0089'].includes(id));if(x.id==='romantic')x.conceptIds=x.conceptIds.filter(id=>id!=='MC-0261');if(x.id==='scottish-music')x.conceptIds=x.conceptIds.filter(id=>!['MC-0016','MC-0040'].includes(id));if(x.id==='pitch-melody-scales'){x.label='Pitch and Melody';const scaleIds=new Set(revisionGroups.groupsForLevel('AH').find(g=>g.id==='scales')?.conceptIds||[]);x.conceptIds=x.conceptIds.filter(id=>!['MC-0036','MC-0014','MC-0093'].includes(id)&&!scaleIds.has(id));}if(x.id==='rhythm-metre')x.conceptIds=x.conceptIds.filter(id=>!['MC-0017','MC-0025','MC-0027','MC-0031','MC-0033','MC-0100','MC-0104'].includes(id));if(x.id==='articulation')x.conceptIds=[...x.conceptIds,'MC-0021'];const stylesLevel=({'n3-styles':'N3','n4-styles':'N4','national-5-styles':'N5','higher-styles':'H','advanced-higher-styles':'AH'})[x.id];if(stylesLevel)x.conceptIds=D.concepts.filter(c=>D.levels.indexOf(c.level)===keys.indexOf(stylesLevel)&&c.categories.includes('Styles')).map(c=>c.id);if(x.id==='key-tonality')x.id='tonality';if(x.id==='tonality'){x.label='Tonality';x.conceptIds=revisionGroups.groupsForLevel('AH').find(g=>g.id==='tonalities')?.conceptIds||[];}if(x.id==='cadences'){x.label='Cadences';x.conceptIds=revisionGroups.groupsForLevel('AH').find(g=>g.id==='cadences')?.conceptIds||[];}if(x.id==='harmony'&&x.level==='N3')x.id='chords';if(x.id==='chords'){x.label='Chords';x.conceptIds=[...(revisionGroups.groupsForLevel('AH').find(g=>g.id==='chords')?.conceptIds||[]),'MC-0011','MC-0013','MC-0080','MC-0159'];}if(x.id==='harmony'){x.label='Harmony';const collection=window.MusicDictionaryQuizCollections?.groupsForLevel(x.level).find(g=>g.id==='harmony');x.conceptIds=(collection?.conceptIds||x.conceptIds).filter(id=>id!=='MC-0035');}if(x.id==='texture-structure'){x.label='Structure and Form';x.conceptIds=[...x.conceptIds,'MC-0181','MC-0191','MC-0186'];const textureIds=new Set([...(revisionGroups.groupsForLevel('AH').find(g=>g.id==='textures')?.conceptIds||[]),'MC-0035','MC-0041']);x.conceptIds=x.conceptIds.filter(id=>!textureIds.has(id)&&!['MC-0016','MC-0018','MC-0034','MC-0036','MC-0039','MC-0040','MC-0160','MC-0161','MC-0162','MC-0237'].includes(id));}if(x.id!=='scottish-music'&&!x.id?.startsWith('saved-'))x.conceptIds=x.conceptIds.filter(id=>id!=='MC-0083');if(!x.id?.startsWith('saved-')){const current=window.MusicDictionaryQuizCollections?.groupsForLevel(x.level).find(g=>g.id===x.id);if(current){x.label=current.label;x.conceptIds=current.conceptIds;}}const ids=[...new Set(x.conceptIds)].filter(id=>byId.has(id)&&(x.level==='ALL'||D.levels.indexOf(byId.get(id).level)<=keys.indexOf(x.level)));return ids.length?{id:typeof x.id==='string'?x.id:'collection',label:x.id==='voices-vocal-music'?'Vocal Texture':x.id==='instruments-ensembles'?'Instruments and Ensembles':x.label.slice(0,160),level:x.level,tableLevel:keys.includes(x.tableLevel)?x.tableLevel:params.get('level'),conceptIds:ids,savedName:typeof x.savedName==='string'?x.savedName:typeof x.name==='string'?x.name:undefined,savedLevel:typeof x.savedLevel==='string'?x.savedLevel:x.level}:null;}catch{return null;}})();
const initialRevisionGroup=revisionGroups.groupsForLevel(revisionLevel).find(group=>group.id===params.get('group'));
const validLevel=initialRevisionGroup?D.levels[keys.indexOf(revisionLevel)]:D.levels[keys.indexOf(initialQuizCollection?.tableLevel||params.get('level'))]||D.levels.find(l=>l===params.get('level'))||'National 5';
function tableUrl(level,search='',showAll=false,frequency=false,exam='N5',bands=[],groupId='',collection=null,builder=null){const p=new URLSearchParams({level:keys[D.levels.indexOf(level)]});if(escapeEmbed)p.set('embed','escape');if(search)p.set('q',search);if(showAll)p.set('all','1');if(groupId)p.set('group',groupId);if(frequency){p.set('frequency','1');p.set('exam',exam);if(bands.length)p.set('bands',bands.join(','));}if(collection){p.set('collection',JSON.stringify(collection));if(keys.includes(collection.tableLevel))p.set('level',collection.tableLevel);}if(builder){p.set('create','1');p.set('selection',JSON.stringify(builder.ids));if(builder.name)p.set('name',builder.name);}return (quizApp||params.get('quizApp')==='1'||collection?quizPage:'./music-dictionary/musicdictionary.html')+'?'+p;}
function detailUrl(c,search='',showAll=false,frequency=false,exam='N5',bands=[],column=null,groupId='',groupLevel='',collection=null,quizReturn=null){const p=new URLSearchParams({concept:c.id,level:keys[D.levels.indexOf(c.level)]});if(escapeEmbed)p.set('embed','escape');if(search)p.set('q',search);if(showAll)p.set('all','1');if(groupId)p.set('group',groupId);if(frequency){p.set('frequency','1');p.set('exam',exam);if(bands.length)p.set('bands',bands.join(','));}if(groupId)p.set('revision',groupLevel);if(Number.isInteger(column)&&column>=0&&column<D.categories.length)p.set('column',column);if(collection)p.set('collection',JSON.stringify(collection));if(quizApp||params.get('quizApp')==='1')p.set('quizApp','1');if(quizReturn||params.get('quizReturn'))p.set('quizReturn',quizReturn||params.get('quizReturn'));if(collectionsReturn)p.set('collectionsReturn',collectionsReturn);return './music-dictionary/musicdictionaryconcept.html?'+p;}
function normal(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
const literacyTrendData=window.MLHMusicLiteracyExamTrends;
const literacyExamKeys=['N5','H','AH'];
const percentageBands=[{key:0,label:'0%',colour:'#ffffff'},...window.MusicConceptFrequency.bands];
function readBands(name){
 return [...new Set((params.get(name)||'').split(',').filter(Boolean).map(Number).filter(key=>percentageBands.some(band=>band.key===key)))];
}
function ExamFrequencyControls({exam,setExam,showAll,reports,description,selectedBands,setSelectedBands}){
 return h('section',{className:'mc-frequency-controls','aria-label':'Exam Trends'},
  showAll&&h('div',{className:'mc-frequency-picker',role:'group','aria-label':'Exam paper'},
   h('span',null,'Paper'),literacyExamKeys.map(key=>h('button',{key,type:'button','aria-pressed':exam===key,onClick:()=>setExam(key)},reports[key].label))),
  h('div',{className:'mc-frequency-summary'},
   h('p',null,description),
   h('div',{className:'mc-frequency-legend',role:'group','aria-label':'Filter by percentage'},
    percentageBands.map(({key,label,colour})=>h('button',{key,type:'button','aria-pressed':selectedBands.includes(key),title:'Filter concepts by '+label+'; select again to clear',
     onClick:()=>setSelectedBands(current=>current.includes(key)?current.filter(band=>band!==key):[...current,key].sort())},h('i',{'aria-hidden':true,style:{backgroundColor:colour}}),label)))));
}
function literacyTrendQuery(exam,bands=[]){
 return exam?'&literacyTrends=1&literacyExam='+exam+(bands.length?'&literacyBands='+bands.join(','):''):'';
}
function literacyDetailUrl(exam){
 const url=new URL(location.href);
 if(exam){
  url.searchParams.set('literacyTrends','1');
  url.searchParams.set('literacyExam',exam);
 }else{
  url.searchParams.delete('literacyTrends');
  url.searchParams.delete('literacyExam');
 }
 return url.href;
}
function literacyUrl(id,level,showAll,query,exam,bands){
 const href=window.MLHMusicLiteracyDictionary.href(id,level,{showAll,query,collectionsReturn});
 return escapeEmbed?href+'&embed=escape':href+literacyTrendQuery(exam,bands);
}
function LiteracyConceptList({level,showAll,query,progressStatus,exam,setExam,selectedBands,setSelectedBands}){
 const curriculum=window.MLHMusicLiteracyCurriculum;
 const report=exam&&literacyTrendData.reports[exam],F=window.MusicConceptFrequency;
 const search=normal(query.trim());
 const rows=curriculum.rows.filter(([rowLevel])=>showAll||rowLevel===level);
 const template=document.createElement('template');
 const columns=curriculum.headings.map((_,index)=>rows.flatMap(([rowLevel,cells])=>{
  const cell=cells[index];
  const entries=curriculum.entries(cell);
  if(!entries.length)return !showAll&&!search&&(!report||!selectedBands.length)&&cell?[{label:cell}]:[];
  return entries.flatMap(entry=>{
   template.innerHTML=entry;
   const link=template.content.firstElementChild;
   if(!normal(link.textContent).includes(search))return [];
   const code=keys[D.levels.indexOf(rowLevel)],markup=link.innerHTML;
   const definition=window.MLHMusicLiteracyDictionary.forCurriculum(code,markup);
   if(!definition)return [];
   const count=report?literacyTrendData.entry(exam,definition.id).count:0;
   const percent=report?100*count/report.years.length:0;
   const band=F.band(percent);
   if(report&&selectedBands.length&&!selectedBands.includes(band))return [];
   const description=report?count+' of '+report.years.length+' reviewed '+report.label+' papers ('+F.format(percent)+')':undefined;
   return [{id:definition.id,href:literacyUrl(definition.id,keys[D.levels.indexOf(level)],showAll,query,exam,selectedBands),markup,level:rowLevel,percent,band,description}];
  });
 }));
 const hasEntries=columns.some(entries=>entries.length);
 return h(React.Fragment,null,
  report&&h(ExamFrequencyControls,{exam,setExam,showAll,reports:literacyTrendData.reports,selectedBands,setSelectedBands,
   description:'Each percentage shows how often a skill was assessed in '+report.years.length+' reviewed '+report.label+' Music papers between '+report.years[0]+' and '+report.years.at(-1)+'.'}),
  !hasEntries&&h('p',{className:'mc-empty',role:'status'},report&&selectedBands.length?'No skills found. Try another percentage range or search.':'No concepts found. Try another search or choose a different level.'),
  hasEntries&&h('div',{className:'mc-table-wrap'},
  h('table',{id:'mc-literacy-list',className:'mc-table','aria-label':'Music Literacy'},
   h('thead',null,h('tr',null,curriculum.headings.map(heading=>h('th',{key:heading,scope:'col'},heading)))),
   h('tbody',null,h('tr',null,columns.map((entries,index)=>
    h('td',{key:curriculum.headings[index]},h('ul',null,entries.map(entry=>entry.href
     ?h('li',{key:JSON.stringify([entry.level,entry.href,entry.markup])},h('a',{href:entry.href,className:'mc-levelled-link'+(report?' mc-frequency-link mc-frequency-'+entry.band:''),title:entry.description},
       h('span',{className:'mc-concept-name'},h('span',{dangerouslySetInnerHTML:{__html:entry.markup}}),
        progressStatus&&h(ConceptProgressDot,{status:progressStatus(window.MusicConceptProgress.literacyKey(entry.id))})),
       (showAll||report)&&h('span',{className:'mc-link-badges'},
        showAll&&h('span',{className:'mc-level-badge',title:entry.level,'aria-label':entry.level},keys[D.levels.indexOf(entry.level)]),
        report&&h('span',{className:'mc-frequency-badge','aria-label':entry.description},F.format(entry.percent)))))
     :h('li',{key:entry.label},h('span',{className:'mc-levelled-text'},entry.label))
    )))
   ))))));
}
const viewGlyphs={progress:'ui-icons/concept-progress.svg?v=20261022-battery',definition:'ui-icons/definition.svg?v=20261102-plain-book',image:'ui-icons/image.svg',listen:'ui-icons/concept-companion-ear.svg',simple:'ui-icons/simply-put.svg',video:'ui-icons/youtube.svg',audio:'ui-icons/audio-svgrepo-com.svg?v=20260722-smaller15',trends:'ui-icons/exam-trends.svg',related:'ui-icons/related-concepts.svg',games:'ui-icons/concept-practice.svg?v=play',literacy:'ui-icons/trebleclef.svg'};
function viewGlyph(key){return h('img',{src:'./'+viewGlyphs[key],alt:'','aria-hidden':true,className:'mc-view-glyph'});}
function ConceptProgressDot({status}){
 const label=window.MusicConceptProgress.options.find(option=>option.key===status).label;
 return h('span',{className:'mc-progress-dot mc-progress-dot-'+status,role:'img','aria-label':label,title:label});
}
// Frame saved images without changing the credited original or clipping notation.
function ConceptPhotoImage({photo}){
 const f=photo.framing;
 if(!f)return h('img',{src:photo.src,alt:photo.alt,decoding:'async'});
 const ratio=f.width/f.height;
 return h('div',{className:'mc-concept-photo-frame',style:{aspectRatio:String(ratio),width:'min(100%, '+(280*ratio)+'px)'}},
  h('img',{src:photo.src,alt:photo.alt,decoding:'async',style:{width:(100*f.sourceWidth/f.width)+'%',height:(100*f.sourceHeight/f.height)+'%',left:(-100*f.x/f.width)+'%',top:(-100*f.y/f.height)+'%'}}));
}
function ConceptPhoto({photo}){
 const caption=photo.caption.trim().replace(/[.!?]+$/,'')+'.';
 const attribution=[photo.credit,photo.license,photo.changes].filter(Boolean).join(' · ');
 return h('figure',{className:'mc-concept-photo'},h(ConceptPhotoImage,{photo}),
  h('figcaption',null,photo.sourceUrl?h('a',{
   href:photo.sourceUrl,target:'_blank',rel:'noopener noreferrer',title:attribution,
   'aria-label':caption+' Image source (opens in a new tab).','aria-description':attribution
  },caption):caption));
}
const backGlyph=h('img',{src:'./ui-icons/next.svg',alt:'','aria-hidden':true,className:'h-[27.8px] w-[27.8px] rotate-180'});
function ConceptVideo({concept,lesson}){
 const entry=lesson||window.MUSIC_CONCEPT_VIDEOS?.concepts[concept.id];
 const videos=entry?(Array.isArray(entry)?entry:[entry]):[];
 if(!videos.length)return null;
 return h('section',{className:'mc-video-example','aria-labelledby':'mc-video-title'},
  h('h2',{id:'mc-video-title',className:'mc-section-heading'},viewGlyph('video'),lesson?'Video Explanation':videos.length>1?'Video Examples':'Video Example'),
  videos.map(video=>h(React.Fragment,{key:video.videoId||video.src},video.src?h('div',{className:'mc-video-player'},h('video',{src:video.src,poster:video.poster,controls:true,preload:'metadata',playsInline:true,'aria-label':concept.name+' example: '+video.title})):video.externalOnly?h('a',{className:'mc-video-player mc-video-external',href:video.sourceUrl,target:'_blank',rel:'noopener noreferrer','aria-label':'Watch '+video.title+' on YouTube (opens in a new tab)'},
   h('img',{className:'mc-video-thumbnail',src:'https://i.ytimg.com/vi/'+video.videoId+'/hqdefault.jpg',alt:'',loading:'lazy'}),
   h('span',{className:'mc-video-external-title'},video.title),
   h('span',{className:'mc-video-play','aria-hidden':true},h('svg',{viewBox:'0 0 68 48'},h('rect',{width:68,height:48,rx:12,fill:'#f03'}),h('path',{d:'M27 14 45 24 27 34Z',fill:'#fff'}))),
   h('span',{className:'mc-video-external-label'},'Watch on YouTube ↗')):h('div',{className:'mc-video-player'},h('iframe',{
   src:'https://www.youtube-nocookie.com/embed/'+video.videoId+'?rel=0'+(Number.isFinite(video.startSeconds)&&video.startSeconds>0?'&start='+Math.floor(video.startSeconds):'')+(Number.isFinite(video.endSeconds)&&video.endSeconds>(video.startSeconds||0)?'&end='+Math.floor(video.endSeconds):''),
   title:concept.name+(lesson?' explanation: ':' example: ')+video.title+(video.performer?' — '+video.performer:''),
   width:768,height:432,loading:'lazy',referrerPolicy:'strict-origin-when-cross-origin',
   allow:'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',allowFullScreen:true
  })),
  h('p',{className:'mc-video-caption'},h('a',{href:video.sourceUrl,target:'_blank',rel:'noopener noreferrer'},video.title+(video.performer?' — '+video.performer:''),' ↗')),video.contextNote&&h('p',{className:'mc-video-caption'},video.contextNote))));
}
function ConceptExamYear({year,appeared,questions,conceptName,open,onToggle,literacy}){
 const question=questions[0];
 const className='mc-exam-year'+(appeared?' mc-exam-year-hit':'')+(question?' mc-exam-year-link':'');
 if(literacy){
  const label=question?question.paperTitle:year+' has no matching task in the reviewed questions';
  return h('li',null,h(question?'a':'span',{className,'aria-label':label,title:label,...(question?{href:question.href}:{})},String(year)));
 }
 const multiple=questions.length>1;
 const label=multiple?'Choose a question from '+question.paperTitle+' for '+conceptName:question?'Open '+question.paperTitle+', Question '+question.number+' for '+conceptName:year+': '+(appeared?'accepted answer; digital paper unavailable':'not listed as an accepted answer');
 const contents=[appeared&&h('span',{key:'tick','aria-hidden':true,className:'mc-exam-year-tick'},'✓'),String(year)];
 if(!multiple)return h('li',null,h(question?'a':'span',{className,'aria-label':label,title:label,...(question?{href:question.href}:{})},...contents));
 return h('li',{className:'hub-menu-anchor mc-exam-year-dropdown'},
  h('button',{type:'button',className,'aria-label':label,title:label,'aria-expanded':open,'aria-haspopup':'menu','data-menu-trigger':true,'data-exam-year':year,onClick:onToggle},...contents,
   h('svg',{viewBox:'0 0 12 12',width:12,height:12,fill:'none','aria-hidden':true},h('path',{d:'m3 4.5 3 3 3-3',stroke:'currentColor',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round'}))),
  open&&h(window.MLH.MenuPanel,{title:year+' Questions',className:'mc-exam-question-menu',floating:true,dataMenuPanel:true},
   h('div',{role:'menu','aria-label':label,onKeyDown:event=>{
    const links=Array.from(event.currentTarget.querySelectorAll('a')),index=links.indexOf(document.activeElement);
    const target=event.key==='ArrowDown'?(index+1)%links.length:event.key==='ArrowUp'?(index-1+links.length)%links.length:event.key==='Home'?0:event.key==='End'?links.length-1:-1;
    if(target>=0){event.preventDefault();links[target]?.focus();}
   }},questions.map(item=>h('a',{key:item.id,href:item.href,role:'menuitem',className:'mc-exam-question-option','aria-label':item.paperTitle+', Question '+item.number+' for '+conceptName},'Question '+item.number)))));
}
function ConceptExamTrends({concept,literacyExam,setLiteracyExam}){
 const F=window.MusicConceptFrequency,data=window.MUSIC_CONCEPT_FREQUENCY;
 const firstExam=F.defaultExam(concept.level);
 const exams=literacyExam?literacyExamKeys:literacyExamKeys.slice(literacyExamKeys.indexOf(firstExam));
 const [selectedExam,setExam]=React.useState(firstExam);
 const exam=literacyExam||(exams.includes(selectedExam)?selectedExam:firstExam);
 const report=literacyExam?literacyTrendData.reports[exam]:data.reports[exam];
 const hit=literacyExam?literacyTrendData.entry(exam,concept.id):F.entry(data,exam,concept.id);
 const questionLinks=literacyExam?literacyTrendData:window.MusicConceptExamLinks;
 const [openYear,setOpenYear]=React.useState(null),yearList=React.useRef(null);
 React.useEffect(()=>{setOpenYear(null);setExam(F.defaultExam(concept.level));},[concept.id]);
 React.useEffect(()=>{
  if(openYear===null)return;
  document.querySelector('.mc-exam-question-menu a')?.focus();
  function closeOutside(event){if(!yearList.current?.contains(event.target)&&!event.target.closest?.('.mc-exam-question-menu'))setOpenYear(null);}
  function closeOnEscape(event){if(event.key==='Escape'){event.preventDefault();setOpenYear(null);yearList.current?.querySelector('[data-exam-year="'+openYear+'"]')?.focus();}}
  document.addEventListener('pointerdown',closeOutside);
  document.addEventListener('keydown',closeOnEscape);
  return()=>{document.removeEventListener('pointerdown',closeOutside);document.removeEventListener('keydown',closeOnEscape);};
 },[openYear]);
 return h('section',{className:'mc-concept-trends','aria-labelledby':'mc-concept-trends-title'},
  h('div',{className:'mc-concept-trends-heading'},
   h('h2',{id:'mc-concept-trends-title',className:'mc-section-heading'},viewGlyph('trends'),'Exam Trends'),
   h('div',{className:'mc-concept-trends-levels',role:'group','aria-label':'Exam Trends qualification'},exams.map(key=>
    h('button',{key,type:'button','aria-label':(literacyExam?literacyTrendData:data).reports[key].label,'aria-pressed':exam===key,onClick:()=>{setOpenYear(null);(setLiteracyExam||setExam)(key);}},key)))),
  h('p',{className:'mc-concept-trends-summary'},literacyExam
   ?'Tested in '+hit.count+' of '+report.years.length+' reviewed '+report.label+' Music papers.'
   :hit.count
   ?'Accepted answer in '+hit.count+' of '+report.years.length+' '+report.label+' papers ('+hit.label+').'
   :'Not listed as an accepted answer in the '+report.years.length+' reviewed '+report.label+' papers.'),
  h('ul',{ref:yearList,className:'mc-exam-years','aria-label':report.label+' papers reviewed'},report.years.map(year=>
   h(ConceptExamYear,{key:exam+':'+year,year,appeared:hit.years.includes(year),questions:hit.years.includes(year)?questionLinks.questionsFor(exam,year,concept.id):[],literacy:Boolean(literacyExam),conceptName:concept.name,open:openYear===year,onToggle:()=>setOpenYear(current=>current===year?null:year)}))));
}

function RelatedConcepts({concept,query,showAll,frequency,exam,selectedBands,groupId,groupLevel}){
 const ids=window.MUSIC_CONCEPT_RELATED.forConcept(concept.id);
 const related=ids.map(id=>byId.get(id)).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name,'en-GB',{sensitivity:'base',numeric:true}));
 if(!related.length)return null;
 return h('section',{className:'mc-related-concepts','aria-labelledby':'mc-related-concepts-title'},
  h('h2',{id:'mc-related-concepts-title',className:'mc-section-heading'},viewGlyph('related'),'Related Concepts'),
  h('div',{className:'mc-related-links'},related.map(item=>h('a',{key:item.id,className:'mc-related-link',href:detailUrl(item,query,showAll,frequency,exam,selectedBands,null,groupId,groupLevel,initialQuizCollection)},
   h('span',null,item.name),h('span',{className:'mc-level-badge',title:item.level,'aria-label':item.level},keys[D.levels.indexOf(item.level)])))));
}
function ConceptGames({concept,practice}){
 const links=practice||(window.MUSIC_CONCEPT_GAMES?.[concept.id]||[]).filter(game=>game.href&&!game.href.includes('music-games/'));
 const labelGames=practice?[]:(window.MusicDictionaryLabelData?.games||[]).filter(game=>game.conceptIds.includes(concept.id));
 if(!links.length&&!labelGames.length)return null;
 return h('section',{className:'mc-related-concepts mc-concept-games','aria-labelledby':'mc-concept-games-title'},
  h('h2',{id:'mc-concept-games-title',className:'mc-section-heading'},viewGlyph('games'),'Practice'),
  h('div',{className:'mc-related-links'},links.map(game=>h('a',{key:game.href,className:'mc-related-link',href:game.href},
   h('img',{className:'mc-practice-app-icon',src:game.icon||'./app-icons/concept-quiz-icon.svg',alt:'','aria-hidden':true,width:24,height:24}),h('span',null,game.title),game.level&&h('span',{className:'mc-level-badge','aria-label':'Level '+game.level},game.level)))),labelGames.length>0&&window.MusicDictionaryLabelGames&&h(window.MusicDictionaryLabelGames,{key:concept.id,conceptId:concept.id}));
}
function literacyTitle(entry){
 const template=document.createElement('template');
 template.innerHTML=entry.markup;
 return template.content.textContent;
}
function LiteracyDetail({entry,level,showAll,query,views,setViews,progressControl,progressError,exam,setExam,trends,setTrends}){
 const bank=window.MLHMusicLiteracyDictionary;
 const {LiteracyPicture,LiteracyScore}=window.MLHLiteracyNotation;
 const [customise,setCustomise]=React.useState(false);
 const menu=React.useRef(null);
 React.useEffect(()=>{
  if(!customise)return;
  const close=event=>{
   if(event.key==='Escape'){
    setCustomise(false);
    menu.current?.querySelector('[data-menu-trigger]')?.focus();
   }else if(event.type==='pointerdown'&&!menu.current?.contains(event.target)&&!event.target.closest?.('[data-menu-panel]')){
    setCustomise(false);
   }
  };
  document.addEventListener('keydown',close);
  document.addEventListener('pointerdown',close);
  return()=>{document.removeEventListener('keydown',close);document.removeEventListener('pointerdown',close);};
 },[customise]);
 const scope=params.has('level')?keys[D.levels.indexOf(level)]:entry.level;
 const bands=readBands('literacyBands');
 const href=item=>literacyUrl(item.id,scope,showAll,query,trends&&exam,bands);
 const badge=item=>h('span',{className:'mc-level-badge',title:bank.levelName(item.level),'aria-label':bank.levelName(item.level)},item.level);
 const name=literacyTitle(entry);
 const heading=window.MLHMusicLiteracyCurriculum.headings[entry.category];
 const categoryEntries=bank.entries.filter(item=>item.category===entry.category);
 const matchingEntries=categoryEntries.filter(item=>(showAll||item.level===scope)&&normal(literacyTitle(item)).includes(normal(query.trim())));
 const sequence=matchingEntries.includes(entry)?matchingEntries:categoryEntries.filter(item=>showAll||item.level===entry.level);
 const position=sequence.indexOf(entry);
 const adjacent=position<0?[]:[sequence[position-1],sequence[position+1]];
 const options=[['definition','Definition'],['image','Image'],['video','Video Explanation'],['related','Related Concepts'],['games','Practice']];
 const showPicture=views.image;
 const showMiniature=entry.picture==='gClef'&&!['pitch','treble-ledger'].includes(entry.topic);
 const returnUrl=tableUrl(D.levels[keys.indexOf(scope)],query,showAll)+'&list=literacy'+literacyTrendQuery(trends&&exam,bands);
 React.useEffect(()=>{
  if(escapeEmbed)return;
  const url=literacyDetailUrl(trends&&exam);
  if(url!==location.href)history.replaceState(history.state,'',url);
 },[trends,exam]);
 function backToList(){
  if(collectionsReturn){returnToCollection();return;}
  const target=new URL(returnUrl,document.baseURI);
  const previous=document.referrer&&new URL(document.referrer);
  if(previous?.origin===target.origin&&previous.pathname===target.pathname){
   history.back();
   return;
  }
  location.assign(target.href);
 }
 return h('div',{className:'mc-detail-layout'},
  h('div',{className:'mc-detail-toolbar'},
   h(window.MLH.ToolbarButton,{label:'Back',className:'gap-2',onClick:backToList,
    icon:backGlyph}),
   !escapeEmbed&&h('div',{className:'hub-menu-anchor relative',ref:menu},
    h(window.MLH.CustomiseButton,{icon:h('img',{src:'./ui-icons/customise.svg',alt:'',className:'h-[21px] w-[21px]'}),dataMenuTrigger:true,expanded:customise,onClick:()=>setCustomise(value=>!value)}),
    customise&&h(window.MLH.MenuPanel,{title:'Customise',position:'left-0',variant:'customise',dataMenuPanel:true},
     h('div',{className:'mc-category-options'},h(window.MLH.MenuSubheading,null,'Views'),
      options.map(([key,label])=>h(window.MLH.MenuToggleRow,{key,label,glyph:viewGlyph(key),profileKey:false,checked:views[key]!==false,onChange:()=>setViews(current=>({...current,[key]:current[key]===false}))})),
      h(window.MLH.MenuToggleRow,{label:'Exam Trends',glyph:viewGlyph('trends'),profileKey:false,checked:trends,onChange:()=>setTrends(!trends)})))),
   progressControl,
   adjacent.some(Boolean)&&h('nav',{className:'mc-concept-nav','aria-label':'Concepts in '+heading},
    adjacent.map((item,index)=>item&&h('a',{key:item.id,href:href(item),rel:index?'next':'prev',className:'mc-concept-nav-'+(index?'next':'previous'),
     title:literacyTitle(item),'aria-label':(index?'Next: ':'Previous: ')+literacyTitle(item)},
    !index&&h('span',{'aria-hidden':true},'←'),h('span',{className:'mc-concept-nav-label'},literacyTitle(item)),index===1&&h('span',{'aria-hidden':true},'→'))))),
  progressError&&h('p',{className:'mc-progress-error',role:'alert'},progressError),
  h('article',{className:'mc-article'},
   h('div',{className:'mc-title-row'},h('h1',{dangerouslySetInnerHTML:{__html:entry.markup}}),h('p',{className:'mc-meta'},bank.levelName(entry.level)+' · '+heading)),
   views.definition&&h('div',{className:'mc-definition-heading'},h('h2',{className:'mc-section-heading'},viewGlyph('definition'),'Definition')),
   (views.definition||showPicture)&&h('div',{className:'mc-definition-layout'+(showPicture?'':' mc-definition-without-photo')+(!views.definition?' mc-definition-image-only':'')},
    views.definition&&h('p',{className:'mc-definition'},entry.definition),
    showPicture&&h('figure',{className:'mc-concept-photo'},showMiniature
     ?h('div',{className:'mc-literacy-picture'},h(LiteracyScore,{notation:entry.scores[0]}))
     :h(LiteracyPicture,{picture:entry.picture}),h('figcaption',null,name))),
   views.video&&h(ConceptVideo,{concept:{name},lesson:bank.videoFor(entry)}),
   !escapeEmbed&&trends&&h(ConceptExamTrends,{concept:{id:entry.id,name,level},literacyExam:exam,setLiteracyExam:setExam}),
   views.related&&h('section',{className:'mc-related-concepts','aria-labelledby':'mc-related-concepts-title'},
    h('h2',{id:'mc-related-concepts-title',className:'mc-section-heading'},viewGlyph('related'),'Related Concepts'),
    h('div',{className:'mc-related-links'},bank.relatedFor(entry).map(item=>h('a',{key:item.id,href:href(item),className:'mc-related-link'},
     h('span',{dangerouslySetInnerHTML:{__html:item.markup}}),badge(item))))),
   views.games&&h(ConceptGames,{practice:[bank.practiceFor(entry)]})
  ));
}
function RevisionGroupsMenu({levels,groupId,selectedLevel,onSelect}){
 const list=React.useRef(null),[fades,setFades]=React.useState({top:false,bottom:false});
 function updateScrollFades(){const element=list.current;if(!element)return;const next={top:element.scrollTop>1,bottom:element.scrollTop+element.clientHeight<element.scrollHeight-1};setFades(previous=>previous.top===next.top&&previous.bottom===next.bottom?previous:next);}
 React.useEffect(()=>{updateScrollFades();const observer=new ResizeObserver(updateScrollFades);if(list.current)observer.observe(list.current);return()=>observer.disconnect();},[levels]);
 return h(window.MLH.MenuPanel,{title:'Filter by Categories',position:'left-0',className:'mc-revision-groups-menu',floating:true,dataMenuPanel:true},
  h('div',{ref:list,role:'menu','aria-label':'Filter by Categories',onScroll:updateScrollFades,className:`mc-revision-categories-list${fades.top?' is-faded-top':''}${fades.bottom?' is-faded-bottom':''}`},
  levels.map(level=>h('section',{key:level},levels.length>1&&h(window.MLH.MenuSubheading,null,D.levels[keys.indexOf(level)]),
   revisionGroups.groupsForLevel(level).map(group=>h('button',{key:group.id,type:'button',className:'mc-revision-option','aria-pressed':selectedLevel===level&&groupId===group.id,onClick:()=>onSelect(group)},
    h('span',null,group.label),h('span',{className:'mc-revision-count'},group.conceptIds.length)))))));
}
function App({initialRun=null,initialNavigation=null}){
 React.useLayoutEffect(()=>{const root=document.getElementById('root');root.removeAttribute('data-cq-refresh-preview');root.removeAttribute('aria-busy');root.inert=false;},[]);
 let builderIds=[];try{const ids=JSON.parse(params.get('selection'));if(Array.isArray(ids))builderIds=ids.filter(id=>byId.has(id));}catch{}
 const startingCollection=initialNavigation?initialNavigation.quizCollection:initialQuizCollection;
 if(D.conceptRedirects?.[params.get('concept')]){params.set('concept',D.conceptRedirects[params.get('concept')]);history.replaceState(null,'',location.pathname+'?'+params.toString());}
 const requestedConcept=byId.get(params.get('concept'));
 const [level,setLevel]=React.useState(initialNavigation?.level||validLevel),[query,setQuery]=React.useState(initialNavigation?.query??params.get('q')??''),[open,setOpen]=React.useState(false);
 const isDetail=location.pathname.endsWith('/music-dictionary/musicdictionaryconcept.html'),concept=byId.get(params.get('concept'));
 const literacyEntry=isDetail&&params.has('literacy')?window.MLHMusicLiteracyDictionary?.entry(params.get('literacy')):null;
 React.useEffect(()=>{if(isDetail&&params.get('concept')==='MC-0092')location.replace(tableUrl('National 4'));},[]);
 const showListSwitch=!quizApp&&!isDetail&&Boolean(window.MLHMusicLiteracyCurriculum&&window.MLHMusicLiteracyDictionary);
 const [conceptList,setConceptList]=React.useState(initialNavigation?.conceptList??(params.get('list')==='literacy'?'literacy':'concepts'));
 const literacyList=showListSwitch&&conceptList==='literacy';
 const [showAll,setShowAll]=React.useState(initialNavigation?.showAll??(!initialRevisionGroup&&(params.get('all')==='1'||initialRun?.level==='ALL')));
 const [quizSummary,setQuizSummary]=React.useState(null);
 const [runningQuiz,setRunningQuiz]=React.useState(initialRun?MusicDictionaryQuizzes.normaliseSettings(initialRun):null),[quizLeaving,setQuizLeaving]=React.useState(false),[quizReturning,setQuizReturning]=React.useState(false),[quizEntering,setQuizEntering]=React.useState(false);
 const quizTransition=React.useRef(null);
 React.useEffect(()=>()=>clearTimeout(quizTransition.current),[]);
 function animateQuizScreen(update){
  setQuizEntering(false);
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){update();return;}
  setQuizLeaving(true);
  quizTransition.current=setTimeout(()=>{update();setQuizEntering(true);},220);
 }
 function startInlineQuiz(selection){if(quizLeaving)return;setQuizReturning(false);const url=new URL(MusicDictionaryQuizzes.url(selection),document.baseURI),config=JSON.parse(url.searchParams.get('quiz'));config.returnTo=selection.returnTo;config.collectionId=quizCollection?.id;animateQuizScreen(()=>{try{sessionStorage.removeItem('mlh-dictionary-quiz-attempt-v1:'+JSON.stringify(config));}catch(_){}setRunningQuiz(config);setQuizLeaving(false);});}
 function leaveInlineQuiz(){clearTimeout(quizTransition.current);setRunningQuiz(null);setQuizLeaving(false);}
 function backFromInlineQuiz(){if(quizLeaving)return;animateQuizScreen(()=>{setQuizReturning(false);setQuizSelecting(false);setQuizCollection(null);setQuizIds([]);setQuizEditing(false);setQuizName('');setQuery('');leaveInlineQuiz();});}
 const [quizSelecting,setQuizSelecting]=React.useState(initialNavigation?.quizSelecting??(!!startingCollection||!!initialRun||quizApp&&params.get('create')==='1')),[quizIds,setQuizIds]=React.useState(initialNavigation?.quizIds||startingCollection?.conceptIds||initialRun?.concepts||builderIds),[quizCollection,setQuizCollection]=React.useState(startingCollection);
 const [quizEditing,setQuizEditing]=React.useState(initialNavigation?.quizEditing||false);
 React.useEffect(()=>{if(quizApp&&quizSelecting&&!runningQuiz){const frame=requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));return()=>cancelAnimationFrame(frame);}},[quizSelecting,quizCollection?.id,!!runningQuiz]);
 const [quizSettings,updateQuizSettings]=isDetail?[{},()=>{}]:MusicDictionaryQuizzes.useSettings(),[quizGroups,saveQuizGroups]=isDetail?[[],()=>{}]:MusicDictionaryQuizzes.useGroups(),[quizName,setQuizName]=React.useState(initialNavigation?.quizName??startingCollection?.label??initialRun?.name??params.get('name')??''),[quizSaveMessage,setQuizSaveMessage]=React.useState('');
 function changeQuizSettings(changes){updateQuizSettings(changes);if(runningQuiz){const next={...runningQuiz,...changes};try{sessionStorage.removeItem('mlh-dictionary-quiz-attempt-v1:'+JSON.stringify(next));}catch{}setQuizSummary(null);setRunningQuiz(next);}}
 const savedQuizCollection=quizCollection?.id?.startsWith('saved-')?quizGroups.find(g=>quizCollection.sharedId?g.sharedId===quizCollection.sharedId:g.name===(quizCollection.savedName||quizCollection.label)&&g.level===(quizCollection.savedLevel||quizCollection.level)):null;
 const [groupId,setGroupId]=React.useState(initialNavigation?.groupId??initialRevisionGroup?.id??''),[groupsOpen,setGroupsOpen]=React.useState(false);
 const groupLevel=keys[D.levels.indexOf(level)],levelGroups=revisionGroups.groupsForLevel(groupLevel);
 const activeGroup=levelGroups.find(group=>group.id===groupId),groupConceptIds=activeGroup?new Set(activeGroup.conceptIds):null;
 const trendsAvailable=showAll||D.levels.indexOf(level)>=2;
 const F=window.MusicConceptFrequency,frequencyData=window.MUSIC_CONCEPT_FREQUENCY;
 const [literacyTrends,setLiteracyTrends]=React.useState(initialNavigation?.literacyTrends??(params.get('literacyTrends')==='1'));
 const [selectedLiteracyExam,setLiteracyExam]=React.useState(initialNavigation?.literacyExam??params.get('literacyExam'));
 const literacyExam=(isDetail||showAll)&&literacyExamKeys.includes(selectedLiteracyExam)?selectedLiteracyExam:F.defaultExam(literacyEntry&&!params.has('level')?D.levels[keys.indexOf(literacyEntry.level)]:level);
 const [literacyBands,setLiteracyBands]=React.useState(()=>initialNavigation?.literacyBands??readBands('literacyBands'));
 const [trendsSelected,setFrequency]=React.useState(quizApp||escapeEmbed||literacyList?false:initialNavigation?.frequency??(params.get('frequency')==='1'&&(params.get('all')==='1'||D.levels.indexOf(validLevel)>=2)));
 const frequency=!literacyList&&trendsSelected;
 const [exam,setExam]=React.useState(initialNavigation?.exam||(['N5','H','AH'].includes(params.get('exam'))?params.get('exam'):F.defaultExam(validLevel)));
 const [selectedBands,setSelectedBands]=React.useState(()=>initialNavigation?.selectedBands||readBands('bands'));
 const P=window.MusicConceptProgress;
 const [progress,setProgress]=React.useState(()=>P.read(window.localStorage));
 const [progressError,setProgressError]=React.useState('');
 const [progressAnimating,setProgressAnimating]=React.useState(false);
 const statusFor=id=>P.statusFor(progress,id);
 const detailProgressKey=literacyEntry?P.literacyKey(literacyEntry.id):concept?.id;
 const detailProgressStatus=detailProgressKey&&statusFor(detailProgressKey);
 const toggleProgress=()=>{
  const wasConfident=detailProgressStatus==='known';
  setProgressAnimating(!wasConfident);
  const result=P.update(window.localStorage,detailProgressKey,wasConfident?'learning':'known',progress);
  setProgress(result.progress);
  setProgressError(result.saved?'':'Progress could not be saved in this browser.');
 };
 React.useEffect(()=>{const sync=event=>{if(event.key===P.key||event.key===null)setProgress(P.read(window.localStorage));};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[]);
 const [customiseOpen,setCustomiseOpen]=React.useState(false);
 const [extendedMeaning,setExtendedMeaning]=React.useState(false);
 const viewOptions=[['progress','My Progress'],['definition','Definition'],['image','Image'],['listen','Listen For'],['video','Video Examples'],['audio','Audio Examples'],['trends','Exam Trends'],['related','Related Concepts'],['games','Practice']];
 const [savedViews,setViews]=window.MLH.useProfileState("dictionaryViews",()=>{const saved=P.readViews(window.localStorage);return Object.fromEntries(viewOptions.map(([key])=>[key,key==='progress'&&frequency?false:typeof saved[key]==='boolean'?saved[key]:key!=='progress']));});
 const views=escapeEmbed?{definition:true,image:true,listen:true,video:true,audio:true}:savedViews;
 const progressControl=views.progress&&detailProgressKey&&h('button',{
  type:'button',className:window.MLH.ToolbarButtonClass+' mc-progress-button mc-progress-button-'+detailProgressStatus+(progressAnimating?' mc-progress-animating':''),
  'aria-pressed':detailProgressStatus==='known',onClick:toggleProgress,onAnimationEnd:event=>{if(event.animationName==='mc-progress-fill')setProgressAnimating(false);}
 },detailProgressStatus==='known'?h('svg',{viewBox:'0 0 25 25',fill:'none','aria-hidden':true,className:'mc-view-glyph mc-progress-tick'},h('path',{d:'M5.5 11.5L10.5 16.5L19.5 7.60001',stroke:'#121923',strokeWidth:1.2,pathLength:1})):viewGlyph('progress'),
 h('span',null,P.options.find(option=>option.key===detailProgressStatus).label));
 React.useEffect(()=>{if(!escapeEmbed)P.saveViews(window.localStorage,savedViews);},[savedViews]);
 React.useEffect(()=>{
  if(escapeEmbed)return;
  const sync=event=>{
   if(event.key!==P.viewsKey&&event.key!==null)return;
   const showProgress=P.readViews(window.localStorage).progress===true;
   if(showProgress)setFrequency(false);
   setViews(current=>current.progress===showProgress?current:{...current,progress:showProgress});
  };
  window.addEventListener('storage',sync);
  return()=>window.removeEventListener('storage',sync);
 },[]);
 const menu=React.useRef(null),customiseMenu=React.useRef(null),groupsMenu=React.useRef(null);
 React.useEffect(()=>{
  if(quizApp)return;
  const key=()=> 'mlh:music-dictionary-scroll:v1:'+location.pathname+location.search;
  const save=()=>{try{sessionStorage.setItem(key(),String(window.scrollY));}catch(_){}};
  let saveFrame=0;
  const onScroll=()=>{if(saveFrame)return;saveFrame=requestAnimationFrame(()=>{saveFrame=0;save();});};
  let saved=null;
  try{saved=Number(sessionStorage.getItem(key()));}catch(_){}
  if(Number.isFinite(saved)&&saved>0)requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo(0,saved)));
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('pagehide',save);
  return()=>{window.removeEventListener('scroll',onScroll);window.removeEventListener('pagehide',save);if(saveFrame)cancelAnimationFrame(saveFrame);};
 },[]);
 React.useEffect(()=>{const close=e=>{if(e.target.closest?.('[data-menu-panel]'))return;if(!menu.current?.contains(e.target))setOpen(false);if(!customiseMenu.current?.contains(e.target))setCustomiseOpen(false);if(!groupsMenu.current?.contains(e.target))setGroupsOpen(false);};const esc=e=>{if(e.key==='Escape'){setOpen(false);setCustomiseOpen(false);setGroupsOpen(false);}};document.addEventListener('pointerdown',close);document.addEventListener('keydown',esc);return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',esc);};},[]);
 // Keep the concept list, quiz preview and attempt as separate browser entries.
 const navigationReady=React.useRef(false);
 React.useEffect(()=>{
  if(isDetail)return;
  const restore=event=>{
   const next=event.state?.mlhDictionaryQuizNavigation;
   if(!event.state?.mlhMusicDictionaryMain){if(!quizApp)location.replace('./index.html');return;}
   if(!next)return;
   clearTimeout(quizTransition.current);setQuizLeaving(false);setQuizReturning(!next.runningQuiz);
   setLevel(next.level);setQuery(next.query);setConceptList(next.conceptList??'concepts');setShowAll(next.showAll);setFrequency(next.frequency&&!(showListSwitch&&next.conceptList==='literacy'));setExam(next.exam);setSelectedBands(next.selectedBands);setGroupId(next.groupId);
   setLiteracyTrends(next.literacyTrends??false);setLiteracyExam(next.literacyExam);setLiteracyBands(next.literacyBands??[]);
   setQuizSelecting(next.quizSelecting);setQuizCollection(next.quizCollection);setQuizIds(next.quizIds);setQuizName(next.quizName);setQuizEditing(next.quizEditing);setRunningQuiz(next.runningQuiz);
   setOpen(false);setCustomiseOpen(false);setGroupsOpen(false);setQuizSaveMessage('');
  };
  window.addEventListener('popstate',restore);
  return()=>window.removeEventListener('popstate',restore);
 },[isDetail,showListSwitch]);
 React.useEffect(()=>{
  if(isDetail||window.MLH.classroomExercise)return;
  const snapshot={version:1,level,query,conceptList,showAll,frequency,exam,literacyTrends,literacyExam,literacyBands,selectedBands,groupId,quizSelecting,quizCollection,quizIds,quizName,quizEditing,runningQuiz};
  const stage=value=>value.runningQuiz?'quiz':value.quizSelecting?'preview':'list';
  const url=value=>{
   const run=value.runningQuiz;
   if(run?.literacyQuiz)return literacyQuizUrl(run.level);
   if(run?.savedCollectionId)return window.HubCollections.launch('quizzes',{id:run.savedCollectionId},run.level);
   if(run)return MusicDictionaryQuizzes.url({concepts:run.concepts,level:run.level,name:run.name,settings:run,returnTo:run.returnTo});
   const href=tableUrl(value.level,value.query,value.showAll,value.frequency,value.exam,value.selectedBands,value.groupId,value.quizSelecting?value.quizCollection:null,value.quizSelecting&&!value.quizCollection?{ids:value.quizIds,name:value.quizName}:null);
   return showListSwitch&&value.conceptList==='literacy'?href+'&list=literacy'+literacyTrendQuery(value.literacyTrends&&value.literacyExam,value.literacyBands):href;
  };
  const write=(method,value)=>history[method]({...history.state,mlhMusicDictionaryMain:true,mlhDictionaryQuizNavigation:value},'',url(value));
  const previous=history.state?.mlhDictionaryQuizNavigation;
  if(quizApp){
   if(!previous){
    write('replaceState',snapshot);
    return;
   }
   if(JSON.stringify(previous)===JSON.stringify(snapshot))return;
   const from=stage(previous),to=stage(snapshot),parents=history.state?.mlhQuizParentStages||[];
   if((from==='list'&&to==='preview')||(from==='preview'&&to==='quiz')){
    history.pushState({...history.state,mlhQuizParentStages:[...parents,from],mlhDictionaryQuizNavigation:snapshot},'',url(snapshot));
    return;
   }
   const parent=from!==to&&previous.level===level&&previous.showAll===showAll?parents.lastIndexOf(to):-1;
   if(parent>=0){history.go(parent-parents.length);return;}
   write('replaceState',snapshot);
   return;
  }
  if(!navigationReady.current){
   navigationReady.current=true;
   if(!previous){
    // Seed missing parent screens when a quiz or collection is opened by a shared link.
    if(!history.state?.mlhMusicDictionaryMain)history.pushState({...history.state,mlhMusicDictionaryMain:true},'',location.href);
    const list={...snapshot,quizSelecting:false,quizCollection:null,quizIds:[],quizName:'',quizEditing:false,runningQuiz:null};
    write('replaceState',list);
    if(stage(snapshot)!=='list')write('pushState',{...snapshot,runningQuiz:null});
    if(stage(snapshot)==='quiz')write('pushState',snapshot);
    return;
   }
  }
  if(JSON.stringify(previous)===JSON.stringify(snapshot))return;
  const from=previous&&stage(previous),to=stage(snapshot);
  if((from==='quiz'&&to==='preview')||(from==='preview'&&to==='list'&&previous.level===level&&previous.showAll===showAll)){history.back();return;}
  write((from==='list'&&to==='preview')||(from==='preview'&&to==='quiz')?'pushState':'replaceState',snapshot);
 },[level,query,conceptList,showAll,frequency,exam,literacyTrends,literacyExam,literacyBands,selectedBands,groupId,quizSelecting,quizCollection,quizIds,quizName,quizEditing,runningQuiz,isDetail]);
 React.useEffect(()=>{document.title=isDetail?(literacyEntry?literacyTitle(literacyEntry)+' | Concept Dictionary':concept?concept.name+' | Concept Dictionary':'Concept not found | Concept Dictionary'):quizApp?'Concept Quizzes':'Concept Dictionary';},[]);
 const matches=c=>normal(c.name).includes(normal(query.trim()));
 const shownCategories=D.categories;
 const tableColumns=showAll||activeGroup||quizSelecting&&quizCollection?D.categories.map((_,i)=>[...new Set(D.levels.flatMap(l=>D.tables[l][i]))]):D.tables[level];
 const shownQuizConcepts=new Set();
 const cols=tableColumns.map((ids,column)=>ids.map(id=>byId.get(id)).filter(c=>!quizSelecting||!quizCollection||showAll||D.levels.indexOf(c.level)<=keys.indexOf(groupLevel)).filter(c=>!showAll||!frequency||D.levels.indexOf(c.level)<=keys.indexOf(exam)).filter(c=>!groupConceptIds||groupConceptIds.has(c.id)).filter(c=>!quizSelecting||!quizCollection||quizEditing||quizCollection.conceptIds.includes(c.id)).filter(matches).filter(c=>!frequency||!selectedBands.length||selectedBands.includes(F.entry(frequencyData,exam,c.id).band)).filter(c=>{if(!quizSelecting)return true;if(quizCollection?.id==='texture-structure'&&column!==3&&tableColumns[3].includes(c.id))return false;if(shownQuizConcepts.has(c.id))return false;shownQuizConcepts.add(c.id);return true;}));
 const count=new Set(cols.flat().map(c=>c.id)).size;
 const activeQuizSummary=runningQuiz&&quizSummary?.key===JSON.stringify(runningQuiz)?quizSummary:null;
 const collectionBuilder=quizSelecting&&!runningQuiz&&(!quizCollection||quizEditing);
 const collectionTitle=quizCollection?.label||runningQuiz?.name;
 const standardLevelQuiz=runningQuiz?.defaultLevelQuiz===true||runningQuiz?.cumulativeLevelQuiz===true;
 const clearableCollection=quizApp&&!collectionBuilder&&collectionTitle&&!standardLevelQuiz;
 const collectionGlyph=quizApp&&!collectionBuilder&&!standardLevelQuiz&&h('span',{className:'cq-title-glyph','aria-hidden':true},
  h(MusicDictionaryQuizzes.CollectionGlyph,{group:quizCollection||{id:'saved-custom'}}));
 const collectionLink=clearableCollection&&window.HubCollections.clearCollectionLink(
  collectionTitle,runningQuiz?.level||(showAll?'ALL':groupLevel));
 const toolbarTitle=collectionBuilder?'Create Collection':collectionTitle||'Create Collection';
 const selectedQuizIds=MusicDictionaryQuizCollections.scopeIds(quizIds,showAll?'ALL':groupLevel);
 let classroomQuizUrl;
 if(quizApp&&!isDetail){
  const quizLevel=runningQuiz?.level||(showAll?'ALL':groupLevel);
  const settings=runningQuiz||quizSettings;
  const selected=runningQuiz?.concepts||selectedQuizIds;
  if(runningQuiz?.literacyQuiz){
   classroomQuizUrl=new URL(literacyQuizUrl(quizLevel),document.baseURI);
  }else if(selected.length){
   classroomQuizUrl=new URL(MusicDictionaryQuizzes.shareUrl({
    concepts:selected,level:quizLevel,name:runningQuiz?.name||quizName.trim()||'Quiz',
    settings,collectionId:runningQuiz?.collectionId||quizCollection?.id,
   }),document.baseURI);
  }else if(!quizSelecting){
   const choices=MusicDictionaryQuizCollections.groupsForLevel(quizLevel);
   const defaultId=quizLevel==='ALL'?'all-concepts':'level-'+quizLevel.toLowerCase();
   const group=choices.find(item=>item.id===defaultId);
   if(group)classroomQuizUrl=new URL(MusicDictionaryQuizzes.shareUrl({
    concepts:group.conceptIds,level:quizLevel,name:group.label,collectionId:group.id,
    settings:{...settings,defaultLevelQuiz:true},
   }),document.baseURI);
  }
  if(classroomQuizUrl){
   if(Array.isArray(settings.formats))classroomQuizUrl.searchParams.set('formats',settings.formats.join(','));
   if(settings.audioQuestions===false)classroomQuizUrl.searchParams.set('audio','0');
   if(settings.nonAudioQuestions===false)classroomQuizUrl.searchParams.set('text','0');
  }
 }
 function saveCollection(){
  const saved={sharedId:savedQuizCollection?.sharedId,name:quizName.trim(),level:showAll?'ALL':groupLevel,concepts:selectedQuizIds};
  if(!saved.name||!saved.concepts.length)return;
  const next=[...quizGroups.filter(row=>row!==savedQuizCollection&&(window.HubCollections||row.name!==saved.name)),saved];
  try{
   const rows=saveQuizGroups(next);
   const index=rows.findIndex(row=>saved.sharedId?row.sharedId===saved.sharedId:row.name===saved.name&&!quizGroups.some(previous=>previous.sharedId&&previous.sharedId===row.sharedId));
   const stored=rows[index];
   setQuizCollection({...stored,id:'saved-'+index,label:stored.name,savedName:stored.name,savedLevel:stored.level,tableLevel:groupLevel,conceptIds:[...stored.concepts]});
   setQuizEditing(false);setQuery('');setQuizSaveMessage('');
  }catch(error){setQuizSaveMessage(error.message);}
 }

 function createQuiz(){setShowAll(true);setCustomiseOpen(false);setOpen(false);setSelectedBands([]);leaveInlineQuiz();setQuizEditing(false);setQuizSelecting(true);setQuizCollection(null);setQuizIds([]);setQuizName('');setQuizSaveMessage('');setGroupId('');setQuery('');setFrequency(false);}
 function previewCollection(g){if(g.id.startsWith('saved-'))setShowAll(true);leaveInlineQuiz();setQuizEditing(false);setQuizCollection({...g,savedName:g.name,savedLevel:g.level,tableLevel:groupLevel});setQuizSelecting(true);setQuizIds([...g.conceptIds]);setQuizName(g.label);setQuizSaveMessage('');setGroupId('');setQuery('');setSelectedBands([]);setFrequency(false);}
 let content;
 if(isDetail){
  if(literacyEntry)content=h(LiteracyDetail,{entry:literacyEntry,level,showAll,query,views,setViews,progressControl,progressError:views.progress&&progressError,exam:literacyExam,setExam:setLiteracyExam,trends:literacyTrends,setTrends:setLiteracyTrends});
  else if(!concept)content=h('section',{className:'mc-empty'},h('h1',null,'Concept not found'),h('a',{href:tableUrl(level,query,showAll)+(params.has('literacy')?'&list=literacy':'')},'Return to Concept Dictionary'));
  else{
   const features=concept.features;
   // Retain the selected table column for independent navigation.
   const requestedColumn=params.has('column')?Number(params.get('column')):-1;
   const column=Number.isInteger(requestedColumn)&&tableColumns[requestedColumn]?.includes(concept.id)
    ?requestedColumn:tableColumns.findIndex(ids=>ids.includes(concept.id));
   const sequence=cols[column]||[],position=sequence.findIndex(c=>c.id===concept.id);
   const previous=position>0?sequence[position-1]:null,next=position>=0?sequence[position+1]:null;
   const navigationLink=(item,direction)=>h('a',{
    href:detailUrl(item,query,showAll,frequency,exam,selectedBands,column,groupId,groupLevel,initialQuizCollection),
    className:'mc-concept-nav-'+direction,rel:direction==='previous'?'prev':'next',
    'aria-label':(direction==='previous'?'Previous: ':'Next: ')+item.name,
    title:item.name
   },direction==='previous'&&h('span',{'aria-hidden':true},'←'),h('span',{className:'mc-concept-nav-label'},item.name),direction==='next'&&h('span',{'aria-hidden':true},'→'));
   const conceptNavigation=(previous||next)&&h('nav',{className:'mc-concept-nav','aria-label':'Concepts in '+D.categories[column]},previous&&navigationLink(previous,'previous'),next&&navigationLink(next,'next'));
   const photos=window.MUSIC_CONCEPT_PHOTOS,photo=photos?.subjects[photos.concepts[concept.id]];
   const showPhoto=views.image&&photo;
   content=h('div',{className:'mc-detail-layout'},
    h('div',{className:'mc-detail-toolbar'},h(window.MLH.ToolbarButton,{label:'Back',className:'gap-2',onClick:()=>{if(collectionsReturn){returnToCollection();return;}const quizReturn=params.get('quizReturn');location.href=(quizReturn&&/^\.\/conceptquiz\.html\?/.test(quizReturn)?quizReturn:null)||tableUrl(level,query,showAll,frequency,exam,selectedBands,groupId,initialQuizCollection);},icon:backGlyph}),
     !escapeEmbed&&!(quizApp&&collectionBuilder)&&h('div',{className:'hub-menu-anchor relative',ref:customiseMenu},
      h(window.MLH.CustomiseButton,{icon:h('img',{src:'./ui-icons/customise.svg',alt:'',className:'h-[21px] w-[21px]'}),dataMenuTrigger:true,onClick:()=>{setCustomiseOpen(value=>!value);}}),
      customiseOpen&&h(window.MLH.MenuPanel,{title:'Customise',position:'left-0',variant:'customise',dataMenuPanel:true},h('div',{className:'mc-category-options'},h(window.MLH.MenuSubheading,null,'Views'),viewOptions.filter(([key])=>key!=='progress').map(([key,label])=>h(window.MLH.MenuToggleRow,{key,label,glyph:viewGlyph(key),profileKey:false,checked:views[key],onChange:()=>setViews(current=>({...current,[key]:!current[key]}))}))))),
     progressControl,conceptNavigation),
    views.progress&&progressError&&h('p',{className:'mc-progress-error',role:'alert'},progressError),
    h('article',{className:'mc-article'},
    h('div',{className:'mc-title-row'},h('h1',null,concept.name),h('p',{className:'mc-meta'},concept.level+' · '+concept.categories.join(' · '))),
    views.definition&&h('div',{className:'mc-definition-heading'},h('h2',{className:'mc-section-heading'},viewGlyph('definition'),'Definition',h('span',{className:'mc-definition-meaning-control'+(extendedMeaning?' is-extended':'')},h('button',{type:'button',className:'mc-definition-meaning-toggle','aria-label':extendedMeaning?'Show short definition':'Show extended meaning',title:extendedMeaning?'Show short definition':'Show extended meaning','aria-pressed':extendedMeaning,'aria-controls':'mc-definition-text',onClick:()=>setExtendedMeaning(value=>!value)},viewGlyph('simple'),h('span',{className:'mc-definition-extended-label','aria-hidden':true},'Extended'))))),
    (views.definition||showPhoto)&&h('div',{className:'mc-definition-layout'+(showPhoto?'':' mc-definition-without-photo')+(!views.definition?' mc-definition-image-only':'')},views.definition&&h('p',{id:'mc-definition-text',className:'mc-definition'},extendedMeaning?concept.definition:(window.MUSIC_CONCEPTS_SIMPLE[concept.id]||concept.definition)),showPhoto&&h(ConceptPhoto,{photo})),
    views.listen&&h('section',{className:'mc-features'},h('h2',null,h('img',{src:'./ui-icons/concept-companion-ear.svg',alt:'','aria-hidden':true,className:'mc-ear-icon'}),'Listen For'),h('ul',null,features.map((t,i)=>h('li',{key:i},t)))),
    views.video&&h(ConceptVideo,{concept}),views.audio&&h(window.MusicConceptAudio,{concept,showMoreExamples:!escapeEmbed}),!escapeEmbed&&views.trends&&h(ConceptExamTrends,{concept}),!escapeEmbed&&views.related&&h(RelatedConcepts,{concept,query,showAll,frequency,exam,selectedBands,groupId,groupLevel}),!escapeEmbed&&views.games&&h(ConceptGames,{concept})));

  }
 }else content=h(React.Fragment,null,
  h('div',{className:'mc-toolbar'+(quizApp?' has-quiz-title':'')+(showListSwitch?' mc-list-toolbar':'')},!quizApp&&runningQuiz&&h('button',{type:'button',className:window.MLH.ToolbarButtonClass+' gap-2',onClick:backFromInlineQuiz},h('img',{src:'./ui-icons/next.svg',alt:'','aria-hidden':true,className:'h-[27.8px] w-[27.8px] rotate-180'}),h('span',null,'Quizzes')),quizApp&&quizSelecting&&!runningQuiz&&h('button',{type:'button',className:window.MLH.ToolbarButtonClass+' gap-2',onClick:()=>{setQuizSelecting(false);setQuizIds([]);setQuizEditing(false);}},h('img',{src:'./ui-icons/next.svg',alt:'','aria-hidden':true,className:'h-[27.8px] w-[27.8px] rotate-180'}),h('span',null,'Quizzes')),(quizApp&&runningQuiz||!runningQuiz&&!(quizApp&&quizSelecting))&&h('div',{className:'hub-menu-anchor relative',ref:menu},
   h(window.MLH.LevelButton,{icon:h('img',{src:showAll?'./ui-icons/show-all.svg':'./ui-icons/levels.svg',alt:'',className:'h-[26px] w-[28px] object-contain scale-[1.06]'}),activeLabel:showAll?'All Levels':level,activeLevel:keys[D.levels.indexOf(level)],dataMenuTrigger:true,onClick:()=>{setGroupsOpen(false);setCustomiseOpen(false);setOpen(!open);}}),
   open&&h(window.MLH.MenuPanel,{title:'Level',position:'left-0',floating:true,dataMenuPanel:true},
    h(window.MLH.LevelMenu,{updateUrl:!quizApp&&!literacyList,activeLevel:showAll?'ALL':keys[D.levels.indexOf(level)],levels:{ALL:{label:'All Levels',icon:h('img',{src:'./ui-icons/show-all.svg',alt:'','aria-hidden':true,width:32,height:32,className:'h-8 w-8 object-contain'})},...Object.fromEntries(D.levels.map((label,i)=>[keys[i],{label}]))},onSelect:key=>{if(quizApp){setOpen(false);if(runningQuiz?.literacyQuiz){if(key!==runningQuiz.level)location.href=literacyQuizUrl(key);return;}if(key!==(runningQuiz?.level||(showAll?'ALL':groupLevel))||!runningQuiz)location.href=quizPage+'?'+new URLSearchParams({level:key});return;}if(!literacyList)setQuery('');leaveInlineQuiz();setQuizSelecting(false);setQuizCollection(null);setQuizIds([]);setGroupId('');if(key==='ALL'){setShowAll(true);setFrequency(false);}else{const nextLevel=D.levels[keys.indexOf(key)];setShowAll(false);setLevel(nextLevel);setExam(F.defaultExam(nextLevel));if(D.levels.indexOf(nextLevel)<2)setFrequency(false);}setOpen(false);menu.current?.querySelector('button')?.focus();}}))),
   !escapeEmbed&&!runningQuiz?.literacyQuiz&&h('div',{className:'hub-menu-anchor relative',ref:customiseMenu},
    h(window.MLH.CustomiseButton,{icon:h('img',{src:'./ui-icons/customise.svg',alt:'',className:'h-[21px] w-[21px]'}),dataMenuTrigger:true,onClick:()=>{setGroupsOpen(false);setOpen(false);setCustomiseOpen(!customiseOpen);}}),
    customiseOpen&&h(window.MLH.MenuPanel,{title:'Customise',position:'left-0',variant:'customise',className:'mc-main-customise',dataMenuPanel:true},
     h('div',{className:'mc-category-options'},!quizApp&&h(window.MLH.MenuSubheading,null,'Views'),!quizApp&&h('div',{className:'mc-view-setting'},h(window.MLH.MenuToggleRow,{label:'My Progress',glyph:viewGlyph('progress'),profileKey:false,checked:views.progress,onChange:()=>{if(!views.progress)setFrequency(false);setViews(current=>({...current,progress:!current.progress}));}}),h('p',{className:'mc-view-setting-description'},'Track which concepts you feel confident with.')),
      literacyList&&h('div',{className:'mc-view-setting'},
       h(window.MLH.MenuToggleRow,{label:'Exam Trends',glyph:viewGlyph('trends'),profileKey:false,checked:literacyTrends,onChange:()=>setLiteracyTrends(!literacyTrends)}),
       h('p',{className:'mc-view-setting-description'},'See which past papers assessed each skill.')),
      !literacyList&&(!quizApp||quizSelecting&&!runningQuiz)&&trendsAvailable&&h('div',{className:'mc-view-setting'},
       h(window.MLH.MenuToggleRow,{label:'Exam Trends',glyph:h('img',{src:'./ui-icons/exam-trends.svg',alt:'',className:'h-5 w-5 object-contain'}),profileKey:false,checked:frequency,onChange:()=>{if(!frequency){setViews(current=>({...current,progress:false}));if(!showAll)setExam(F.defaultExam(level));}setFrequency(value=>!value);}}),
       h('p',{className:'mc-view-setting-description'},'See how often concepts appear in past papers.')),
      quizApp&&standardLevelQuiz&&runningQuiz.level!=='ALL'&&h(MLH.SelectedLevelOnlyToggle,{level:runningQuiz.level,checked:runningQuiz.selectedLevelOnly===true,onChange:()=>changeQuizSettings({selectedLevelOnly:!runningQuiz.selectedLevelOnly})}),
      quizApp&&h(MusicDictionaryQuizzes.Options,{settings:runningQuiz||quizSettings,onChange:changeQuizSettings,onCreate:createQuiz})),quizApp&&window.HubCollections?.menu('quizzes',null,runningQuiz?.level||(showAll?'ALL':groupLevel)))),
   collectionLink,
   quizApp&&savedQuizCollection&&!quizEditing&&!runningQuiz&&h('div',{className:'cq-toolbar-collection-actions'},h('button',{type:'button',className:MLH.ToolbarButtonClass,onClick:()=>{setQuizEditing(true);setQuizSaveMessage('');}},'Edit'),h('button',{type:'button',className:MLH.ToolbarButtonClass+' mc-quiz-delete',onClick:()=>{saveQuizGroups(quizGroups.filter(g=>g!==savedQuizCollection));setQuizSelecting(false);setQuizCollection(null);setQuizIds([]);setQuizEditing(false);setQuizName('');}},'Delete')),
   !quizApp&&!literacyList&&activeGroup&&h('button',{type:'button',className:'mc-reset-categories',onClick:()=>setGroupId(''),'aria-label':'Reset category filter'},'Reset'),
   showListSwitch&&!runningQuiz&&h('div',{className:'mc-concept-list-switch',role:'group','aria-label':'Concept list type'},
    [['concepts','Music Concepts'],['literacy','Music Literacy']].map(([key,label])=>h('button',{
     key,type:'button','aria-pressed':conceptList===key,onClick:()=>{setConceptList(key);setCustomiseOpen(false);setOpen(false);}
    },label))),
   quizApp&&!quizSelecting&&!runningQuiz&&h('h2',{className:'cq-toolbar-title'},'Choose Quiz'),
   quizApp&&quizSelecting&&!standardLevelQuiz&&!collectionLink&&h('h1',{className:'cq-toolbar-title'+(!collectionBuilder?' has-collection-glyph':'')},collectionGlyph,h('span',null,toolbarTitle)),
   runningQuiz?h('div',{id:'cq-question-navigation-host',className:'cq-question-navigation-host'}):quizApp&&quizSelecting&&!collectionBuilder?h('div',{className:'mc-quiz-selection-actions cq-toolbar-launch-actions'},h(React.Fragment,null,h('button',{type:'button',className:window.MLH.ToolbarButtonClass+' mc-quiz-start',disabled:!quizIds.some(id=>cols.flat().some(c=>c.id===id)),onClick:()=>startInlineQuiz({concepts:quizIds.filter(id=>cols.flat().some(c=>c.id===id)),level:showAll?'ALL':groupLevel,name:quizName.trim()||'Quiz',settings:quizSettings,returnTo:tableUrl(level,query,showAll,frequency,exam,selectedBands,groupId,quizSelecting?quizCollection:null)})},'Start'))):quizApp&&collectionBuilder?h('div',{className:'cq-toolbar-launch-actions'},h('button',{type:'button',className:MLH.ToolbarButtonClass+' mc-quiz-save',disabled:!quizName.trim()||!selectedQuizIds.length,onClick:saveCollection},'Save')):h('label',{className:'mc-search'},h('img',{src:'./ui-icons/search.svg',alt:''}),h('input',{type:'search',autoFocus:escapeEmbed,'aria-label':showAll?'Search concepts across all levels':'Search concepts at this level',placeholder:'Search',value:query,onChange:e=>setQuery(e.target.value)}))),
  activeGroup&&!literacyList&&!runningQuiz&&h('div',{className:'mc-revision-selection'},h('h1',null,activeGroup.label)),
  runningQuiz?h(MusicDictionaryQuizPlayer,{key:JSON.stringify(runningQuiz),config:runningQuiz,embedded:true,exiting:quizLeaving,onSummary:setQuizSummary,onExit:backFromInlineQuiz}):quizApp&&!quizSelecting?h(MusicDictionaryQuizzes.Home,{level:showAll?'ALL':groupLevel,query,groups:quizGroups,onCreate:createQuiz,onLaunch:previewCollection}):literacyList?h(LiteracyConceptList,{level,showAll,query,progressStatus:views.progress&&statusFor,exam:literacyTrends&&!escapeEmbed&&literacyExam,setExam:setLiteracyExam,selectedBands:literacyBands,setSelectedBands:setLiteracyBands}):h('div',{className:'mc-quiz-preview-body'+(quizLeaving?' is-leaving':'')+(quizReturning?' is-returning':''),'aria-busy':quizLeaving},
  frequency&&trendsAvailable&&h(ExamFrequencyControls,{exam,setExam,showAll,reports:frequencyData.reports,selectedBands,setSelectedBands,
   description:'Each percentage shows how often a concept was an accepted answer in '+frequencyData.reports[exam].years.length+' '+D.levels[keys.indexOf(exam)]+' Music papers between '+frequencyData.reports[exam].years[0]+'-'+frequencyData.reports[exam].years.at(-1)+':'}),
  quizSelecting&&collectionBuilder&&h('div',{className:'mc-quiz-selection-footer is-above-grid'+(collectionBuilder?' is-collection-builder':' is-collection-preview')},
   collectionBuilder&&h('div',{className:'mc-quiz-bulk-actions'},h('button',{type:'button',className:MLH.ToolbarButtonClass,disabled:!cols.flat().length||cols.flat().every(c=>quizIds.includes(c.id)),onClick:()=>{setQuizIds(current=>[...new Set([...current,...cols.flat().map(c=>c.id)])]);setQuizSaveMessage('');}},'Select All'),h('button',{type:'button',className:MLH.ToolbarButtonClass,disabled:!quizIds.length,onClick:()=>{setQuizIds([]);setQuizSaveMessage('');}},'Remove All')),
   collectionBuilder&&h('div',{className:'mc-quiz-selection-summary'},h('p',{role:'status'},selectedQuizIds.length+' concept'+(selectedQuizIds.length===1?'':'s')+' selected')),
   h('div',{className:'mc-quiz-selection-actions'},collectionBuilder&&h('label',{className:'cq-collection-name'},h('span',{className:'sr-only'},'Collection name'),h('input',{'aria-label':'Name',maxLength:160,value:quizName,placeholder:'Name',onChange:e=>{setQuizName(e.target.value);setQuizSaveMessage('');}})),null)),
  h('div',{className:'mc-table-wrap'},h('table',{className:'mc-table'},h('caption',{className:'sr-only'},(showAll?'All levels':level)+' music concepts grouped by musical element'),h('thead',null,h('tr',null,shownCategories.map(cat=>h('th',{key:cat,scope:'col'},cat)))),h('tbody',null,h('tr',null,cols.map((list,i)=>h('td',{key:i},h('ul',null,list.map(c=>h('li',{key:c.id},h('div',{className:quizSelecting&&(!quizCollection||quizEditing)?'mc-quiz-select-row':undefined},quizSelecting&&(!quizCollection||quizEditing)&&h('input',{type:'checkbox',className:'mc-quiz-checkbox','aria-label':'Select '+c.name,checked:quizIds.includes(c.id),onChange:()=>setQuizIds(current=>current.includes(c.id)?current.filter(id=>id!==c.id):[...current,c.id])}),h('a',{
    href:detailUrl(c,query,showAll,frequency,exam,selectedBands,i,groupId,groupLevel,quizSelecting?quizCollection:null,quizApp&&quizSelecting?tableUrl(level,query,showAll,frequency,exam,selectedBands,groupId,quizCollection,!quizCollection?{ids:quizIds,name:quizName}:null):null),
    className:'mc-levelled-link'+(frequency?' mc-frequency-link mc-frequency-'+F.entry(frequencyData,exam,c.id).band:'')+(views.progress?' mc-progress-link mc-progress-'+statusFor(c.id):''),
    title:frequency?F.entry(frequencyData,exam,c.id).description:undefined
   },h('span',{className:'mc-concept-name'},c.name,!quizApp&&views.progress&&h(ConceptProgressDot,{status:statusFor(c.id)})),
   h('span',{className:'mc-link-badges'},(showAll||activeGroup||quizSelecting&&quizCollection)&&h('span',{className:'mc-level-badge',title:c.level,'aria-label':c.level},keys[D.levels.indexOf(c.level)]),
    frequency&&h('span',{className:'mc-frequency-badge','aria-label':F.entry(frequencyData,exam,c.id).description},F.entry(frequencyData,exam,c.id).label))))))))))))),

  count===0&&h('p',{className:'mc-empty',role:'status'},frequency&&selectedBands.length?'No concepts found. Try another percentage range or search.':'No concepts found. Try another search or choose a different level.')));
 if(escapeEmbed)return h('main',{className:'mc-main mc-escape-embed'},content);
 return h('div',{className:window.MLH.shell.pageShellClass},h(window.MLH.AppHeader,{icon:quizApp?'./app-icons/concept-quiz-icon.svg':'./app-icons/music-concepts-icon.svg?v=20261105-dictionary-icon',title:quizApp?'Concept Quizzes':'Concept Dictionary',classroomActivityUrl:classroomQuizUrl?.href,subtitle:quizApp?'Quick questions to strengthen your musical knowledge.':'Explore musical concepts, definitions and examples.',profileUsesSharedSettings:false,profileShowLabel:false,profileState:{dictionaryViews:views,dictionaryQuizSettings:quizSettings},profileShareUrl:runningQuiz?.literacyQuiz?new URL(literacyQuizUrl(runningQuiz.level),document.baseURI).toString():runningQuiz?new URL(MusicDictionaryQuizzes.shareUrl({concepts:runningQuiz.concepts,level:runningQuiz.level,name:runningQuiz.name,settings:runningQuiz,returnTo:runningQuiz.returnTo}),document.baseURI).toString():!isDetail&&quizSelecting&&quizIds.some(id=>cols.flat().some(c=>c.id===id))?new URL(MusicDictionaryQuizzes.shareUrl({concepts:quizIds.filter(id=>cols.flat().some(c=>c.id===id)),level:showAll?'ALL':groupLevel,name:quizName.trim()||'Quiz',settings:quizSettings,returnTo:tableUrl(level,query,showAll,frequency,exam,selectedBands,groupId,quizSelecting?quizCollection:null,quizSelecting&&!quizCollection?{ids:quizIds,name:quizName}:null)}),document.baseURI).toString():new URL(isDetail?(literacyEntry&&!escapeEmbed?literacyDetailUrl(literacyTrends&&literacyExam):location.href):tableUrl(level,query,showAll,frequency,exam,selectedBands,groupId,quizSelecting?quizCollection:null,quizSelecting&&!quizCollection?{ids:quizIds,name:quizName}:null)+(literacyList?'&list=literacy'+literacyTrendQuery(literacyTrends&&literacyExam,literacyBands):''),document.baseURI).toString(),worksheetConfig:literacyEntry||literacyList?undefined:runningQuiz?(runningQuiz.literacyQuiz?undefined:activeQuizSummary&&activeQuizSummary.questionCount>0&&!activeQuizSummary.hasAudio?()=>{activeQuizSummary.openWorksheet();return null;}:undefined):quizApp||showAll?undefined:()=>({version:1,activityId:'music-dictionary',settings:{level:keys[D.levels.indexOf(level)],views:{...views}}})},h(React.Fragment,null,runningQuiz&&h(window.MusicDictionaryQuizStats,{summary:activeQuizSummary}))),h('div',{className:window.MLH.shell.pageContentClass},h('main',{className:window.MLH.shell.mainShellClass+' mc-main'+(quizApp?' cq-screen-transition'+(quizLeaving?' is-quiz-leaving':'')+(quizEntering?' is-quiz-entering':''):'')},content,
  )),
  isDetail&&h('aside',{className:'mc-legal-attribution','aria-label':'Educational use and copyright'},
   h('p',null,'Independent, non-commercial educational resource for music teaching and study. Third-party music, recordings and images remain the property of their respective rights holders. Examples illustrate musical concepts; no affiliation or endorsement is implied.')));
}
function Entry(){
 if(!quizApp&&!location.pathname.endsWith('/music-dictionary/musicdictionaryconcept.html')&&(params.has('quiz')||params.has('collection')||params.get('view')==='quiz-review')){location.replace(quizPage+location.search);return null;}
 const sharedCollection=quizApp&&window.HubCollections?.selected();
 if(sharedCollection){
  const level=keys.includes(params.get('level'))?params.get('level'):'ALL';
  const settings=window.MLH.profileInitial('dictionaryQuizSettings',MusicDictionaryQuizzes.savedSettings());
  const returnTo=window.HubCollections.pageUrl('quizzes',level,sharedCollection);
  const concepts=sharedCollection.concepts.filter(id=>byId.has(id));
  const initialRun=MusicDictionaryQuizzes.config({concepts,level,name:sharedCollection.name,returnTo,settings});
  if(params.has('myCollection'))initialRun.savedCollectionId=sharedCollection.id;
  return h(App,{initialRun});
 }
 let config=null;try{const x=JSON.parse(params.get('quiz'));if(x?.v===1&&Array.isArray(x.concepts)){const {testing,...quiz}=x;config=quiz;}}catch{}
 const fallback=tableUrl(validLevel),safeReturn=value=>typeof value==='string'&&/^\.\/(?:conceptquiz\.html|mycollections\.html|music-dictionary\/musicdictionary\.html)\?/.test(value)?value:fallback;
 if(params.get('view')==='quiz-review')return h(MusicDictionaryQuizReview,{onExit:()=>{location.href=safeReturn(params.get('returnTo'));}});
 if(quizApp&&params.get('literacyQuiz')==='1'&&window.MLHMusicLiteracyQuiz){
  const level=keys.includes(params.get('level'))?params.get('level'):'ALL';
  return h(App,{initialRun:{v:1,start:true,literacyQuiz:true,level,name:'Music Literacy',
   concepts:window.MLHMusicLiteracyQuiz.bank.questions.filter(q=>level==='ALL'||q.levelCode===level).map(q=>q.conceptId)}});
 }
 const navigation=!location.pathname.endsWith('/music-dictionary/musicdictionaryconcept.html')&&history.state?.mlhDictionaryQuizNavigation;
 if(navigation?.version===1)return h(App,{initialRun:navigation.runningQuiz,initialNavigation:navigation});
 if(config)return h(App,{initialRun:config});
 if(quizApp&&!initialQuizCollection&&params.get('create')!=='1'){
  const level=params.get('all')==='1'||params.get('level')==='ALL'?'ALL':keys[D.levels.indexOf(validLevel)];
  const groups=MusicDictionaryQuizCollections.groupsForLevel(level);
  const defaultId=level==='ALL'?'all-concepts':'level-'+level.toLowerCase();
  const group=groups.find(item=>item.id===params.get('group'))||groups.find(item=>item.id===defaultId);
  const settings=window.MLH.profileInitial('dictionaryQuizSettings',MusicDictionaryQuizzes.savedSettings());
  return h(App,{initialRun:MusicDictionaryQuizzes.config({
   concepts:group.conceptIds,level,name:group.label,
   returnTo:window.HubCollections.pageUrl('quizzes',level,{id:group.id,builtIn:true}),
   settings:{...settings,collectionId:group.id,defaultLevelQuiz:!params.has('group')}
  })});
 }
 return h(App);
}
const mount=()=>ReactDOM.createRoot(document.getElementById('root')).render(h(Entry));
if(window.MusicDictionaryQuizReady)window.MusicDictionaryQuizReady.then(mount);else mount();
})();
