/* Quiz creation, collections and sharing belong to Music Dictionary. */
(function(){
'use strict';const h=React.createElement,D=MUSIC_CONCEPTS;
const collectionGlyphs={"baroque":"baroque-candles","bass-lines":"bass-clef","orchestra-brass":"horn","chords":"chord","classical":"classical-piano","concerto-grosso":"concerto-grosso-ensemble","ensemble-types":"ensemble-cropped","fugue":"notes","jazz-popular-music":"jazz-saxophone","modern-20th-century":"modern-twentieth-century","orchestra":"orchestra-conductor","orchestral-families":"families","ornaments":"ear-training-trill","orchestra-percussion":"percussion-drum","playing-techniques":"playing-techniques-violinist","renaissance-music":"renaissance-lute","romantic":"romantic-portrait","scales":"ascending-scale","scottish-music":"scotland","serial-music":"serial-waveform","orchestra-strings":"violin","tempo":"metronome","tempo-changes":"tempo-change","textures":"textures-wave","tonalities":"treble-clef","voice-types":"voice","orchestra-woodwind":"flute","word-setting":"words","world-music":"world-music-globe","n3-styles":"styles-speaker","n4-styles":"styles-speaker","national-5-styles":"styles-speaker","higher-styles":"styles-speaker","advanced-higher-styles":"styles-speaker"};
const originalCollectionGlyph=g=>g.id==='voice-types'?'./ui-icons/group-button.svg?v=20261106-even-lines':(g.id==='tempo'||g.id==='tempo-changes')?'./ui-icons/ear-training/tempo-icon.svg':g.id==='scales'?'./ui-icons/ear-training/scale-degrees-icon.svg':g.id==='cadences'?'./ui-icons/ear-training/cadences-icon.svg?v=20261105-supplied-cadence-glyph':g.id.startsWith('saved-')?'./ui-icons/concept-quiz.svg':'./music-dictionary/quiz-icons/'+collectionGlyphs[g.id]+(g.id==='baroque'||g.id==='classical'||g.id==='concerto-grosso'||g.id==='jazz-popular-music'||g.id==='modern-20th-century'||g.id==='orchestra'||g.id==='orchestra-percussion'||g.id==='playing-techniques'||g.id==='renaissance-music'||g.id==='romantic'||g.id==='serial-music'||g.id==='textures'||g.id==='world-music'||g.id.endsWith('-styles')?'.png':'.svg');
// Display-only crops and optical sizing; original glyph assets remain unchanged.
const collectionGlyphLayouts={"baroque":{"width":24.285,"height":32.379,"left":5.864,"top":1.526},"orchestra-brass":{"width":32.199,"height":32.199,"left":2.138,"top":2.307},"chords":{"width":31.42,"height":31.42,"left":2.339,"top":2.264},"classical":{"width":32.681,"height":32.681,"left":1.892,"top":2.098},"ensemble-types":{"width":34.956,"height":24.851,"left":0.894,"top":5.283},"jazz-popular-music":{"width":24.847,"height":33.129,"left":5.441,"top":0.81},"modern-20th-century":{"width":48.658,"height":48.658,"left":-6.276,"top":-6.374},"n3-styles":{"width":27.739,"height":31.987,"left":4.196,"top":1.319},"orchestra":{"width":35.949,"height":35.949,"left":0.434,"top":-0.767},"orchestral-families":{"width":30.332,"height":30.332,"left":2.84,"top":2.84},"orchestra-percussion":{"width":33.712,"height":28.774,"left":1.155,"top":2.704},"playing-techniques":{"width":47.238,"height":35.429,"left":-4.675,"top":0.023},"romantic":{"width":30.0,"height":30.0,"left":2.975,"top":2.521},"scottish-music":{"width":30.0,"height":19.98,"left":3.006,"top":8.016},"orchestra-strings":{"width":31.0,"height":31.0,"left":2.989,"top":2.042},"tempo":{"width":48.473,"height":48.473,"left":-6.145,"top":-6.641},"orchestra-woodwind":{"width":31.671,"height":31.671,"left":2.049,"top":2.279},"world-music":{"width":29.172,"height":29.344,"left":3.263,"top":3.515},"bass-lines":{"width":28.117,"height":31.228,"left":4.492,"top":3.207},"n4-styles":{"width":27.739,"height":31.987,"left":4.196,"top":1.319},"ornaments":{"width":32.793,"height":25.62,"left":1.888,"top":5.012},"renaissance-music":{"width":25.201,"height":33.0,"left":5.283,"top":1.116},"scales":{"width":49.22,"height":49.22,"left":-5.363,"top":-7.345},"tempo-changes":{"width":48.473,"height":48.473,"left":-6.145,"top":-6.641},"tonalities":{"width":22.454,"height":36.267,"left":7.181,"top":-0.225},"voice-types":{"width":33.301,"height":33.301,"left":1.357,"top":1.325},"cadences":{"width":36,"height":18.55,"left":0,"top":8.725},"national-5-styles":{"width":27.739,"height":31.987,"left":4.196,"top":1.319},"textures":{"width":36.0,"height":36.0,"left":0.0,"top":0.525},"word-setting":{"width":37.442,"height":37.442,"left":-0.342,"top":-0.588},"concerto-grosso":{"width":36.0,"height":20.18,"left":0.0,"top":7.761},"higher-styles":{"width":27.739,"height":31.987,"left":4.196,"top":1.319},"advanced-higher-styles":{"width":27.739,"height":31.987,"left":4.196,"top":1.319},"fugue":{"width":31.0,"height":31.0,"left":2.251,"top":2.222},"serial-music":{"width":42.47,"height":23.889,"left":-3.235,"top":6.07},"saved":{"width":31.0,"height":31.0,"left":2.114,"top":2.9}};
const collectionGlyphAliases={'instruments-ensembles':'orchestra','playing-techniques-ornaments':'playing-techniques','harmony':'chords','pitch-melody-scales':'scales','key-tonality':'tonalities','tonality':'tonalities','rhythm-metre':'orchestra-percussion','texture':'textures','texture-structure':'word-setting','voices-vocal-music':'voice-types'};
const glyphGroup=g=>({...g,id:collectionGlyphAliases[g.id]||g.id});
const focusedGlyphIds=new Set(['sonata-form','musical-development','vocal-techniques','sacred-vocal','songs-stage']);
const orchestralFamilyGlyphs=Object.fromEntries(['brass','woodwind','strings','percussion'].map(family=>['orchestra-'+family,'./music-dictionary/quiz-icons/orchestral-'+family+'-generated.png']));
const collectionGlyph=g=>g.qualification?null:g.glyph||orchestralFamilyGlyphs[g.id]|| (g.id==='sacred-vocal'?'./music-dictionary/quiz-icons/sacred-vocal-church-generated.png':g.id==='texture-structure'?'./music-dictionary/quiz-icons/structure-form-aba-generated.png':g.id==='vocal-techniques'?'./music-dictionary/quiz-icons/vocal-techniques-generated.png':g.id==='voice-types'?'./music-dictionary/quiz-icons/voice-types-generated.png':g.id==='musical-development'?'./music-dictionary/quiz-icons/beamed-notes.svg':g.id==='sonata-form'?'./music-dictionary/quiz-icons/sonata-form-generated.png':g.id==='songs-stage'?'./music-dictionary/quiz-icons/songs-stage-generated.png':focusedGlyphIds.has(g.id)?'./music-dictionary/quiz-icons/'+g.id+'.svg':g.id==='pitch-melody-scales'?'./music-dictionary/quiz-icons/beamed-notes.svg':g.id==='articulation'?'./music-dictionary/quiz-icons/articulation.svg':(g.id==='instruments-ensembles'||g.id==='orchestra')?'./music-dictionary/quiz-icons/instruments-ensembles-orchestra.png':g.id==='voices-vocal-music'?'./music-dictionary/quiz-icons/vocal-music-singer-soft.png':originalCollectionGlyph(glyphGroup(g)));
const collectionGlyphStyle=g=>{if(g.glyph||orchestralFamilyGlyphs[g.id])return {width:36,height:36,left:0,top:0};if(g.qualification)return {width:32,height:32,left:2,top:2};if(g.id==='texture-structure')return {width:36,height:36,left:0,top:0};if(g.id==='voice-types')return {width:34,height:34,left:1,top:1};if(focusedGlyphIds.has(g.id))return {width:34,height:34,left:1,top:1};if(g.id==='pitch-melody-scales')return {width:34,height:34,left:1,top:1};if(g.id==='articulation')return {width:11.52,height:36,left:12.24,top:0};if(g.id==='instruments-ensembles'||g.id==='orchestra')return {width:36,height:22.62,left:0,top:6.69};if(g.id==='voices-vocal-music')return {width:38,height:38,left:-1,top:-1};const id=glyphGroup(g).id,layout=collectionGlyphLayouts[id.startsWith('saved-')?'saved':id];return id.endsWith('-styles')?{...layout,filter:'contrast(1.25)'}:layout;};
const questionTypes=[
 ['multiple-choice','Multiple Choice','multiple-choice',['multiple-choice','audio-select-2','audio-select-3','audio-select-4']],
 ['short-answer','Short Answer','short-answer',['short-answer']],
 ['musical-features','Musical Features','musical-features',['musical-features']],
 ['multi-select','Selection','selection',['multi-select']],
 ['order','Order','order',['order']]
];
function selectedQuestionTypes(formats){
 const selected=Array.isArray(formats)?questionTypes.filter(([, , ,group])=>group.some(format=>formats.includes(format))):[];
 return selected.length?selected:questionTypes;
}
const formatsForTypes=types=>types.flatMap(([, , ,formats])=>formats);
function allQuestionTypesEnabled(settings){
 if(settings.audioQuestions===false||settings.nonAudioQuestions===false)return false;
 if(!Array.isArray(settings.formats))return true;
 return questionTypes.every(([, , ,formats])=>formats.every(format=>settings.formats.includes(format)));
}
function normaliseSettings(settings){
 const audioQuestions=settings?.audioQuestions!==false,nonAudioQuestions=settings?.nonAudioQuestions!==false;
 const formats=Array.isArray(settings?.formats)?formatsForTypes(selectedQuestionTypes(settings.formats)):null;
 return {...settings,...(formats?{formats}:{}),audioQuestions:audioQuestions||!nonAudioQuestions,nonAudioQuestions:nonAudioQuestions||!audioQuestions};
}
const settingsKey='mlh-dictionary-quiz-settings-v1',groupsKey='mlh-dictionary-quiz-groups-v1';
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback;}catch{return fallback;}}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
function CollectionGlyph({group:g}){const qualification=g.qualification||(g.id?.startsWith('level-')?g.id.slice(6).toUpperCase():null);return qualification?h('span',{'aria-hidden':true,className:'mc-quiz-collection-glyph-frame mc-quiz-level-glyph-frame'},h('span',{className:'absolute left-[4px] top-[4px] flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-white text-[1.22rem] font-black leading-none tracking-tight text-stone-800 shadow-sm scale-[1.08]'},qualification==='ALL'?'All':qualification)):h('span',{className:'mc-quiz-collection-glyph-frame','aria-hidden':true},h('img',{src:collectionGlyph(g),className:'mc-quiz-collection-glyph',style:collectionGlyphStyle(g),alt:''}));}
const api=window.MusicDictionaryQuizzes={
 CollectionGlyph,collectionGlyph,collectionGlyphStyle,normaliseSettings,allQuestionTypesEnabled,
 savedSettings(){const {testing,count,...saved}=read(settingsKey,{});return normaliseSettings(saved);},
 useSettings(){const [settings,set]=window.MLH.useProfileState("dictionaryQuizSettings",api.savedSettings);const update=patch=>set(old=>{const next=normaliseSettings({...old,...patch});delete next.testing;save(settingsKey,next);return next;});return [settings,update];},
 useGroups(){
  const store=window.HubCollections;
  const fromStore=()=>store.list().map(row=>({...row,sharedId:row.id,level:'ALL'}));
  const [groups,set]=React.useState(()=>{
   if(store){try{store.importQuizzes();}catch{}return fromStore();}
   const saved=read(groupsKey,null),legacy=read('mlh-concept-quiz-groups-v1',[]);
   return Array.isArray(saved)?saved:Array.isArray(legacy)?legacy:[];
  });
  React.useEffect(()=>{
   if(!store)return;
   const refresh=event=>{if(event.key===store.key||event.key===null)set(fromStore());};
   window.addEventListener('storage',refresh);
   return()=>window.removeEventListener('storage',refresh);
  },[store]);
  const update=next=>{
   if(!store){save(groupsKey,next);set(next);return next;}
   store.updateQuizRows(groups,next);
   const rows=fromStore();
   set(rows);
   return rows;
  };
  return [groups,update];
 },
 config({concepts,level,name,returnTo,settings={}}){const {testing,count,...options}=settings;return {v:1,start:true,...normaliseSettings(options),level,name:name||'Quiz',concepts:[...new Set(concepts)],returnTo};},
 url(options){const config=api.config(options);return './conceptquiz.html?'+new URLSearchParams({level:config.level,quiz:JSON.stringify(config)});},
 shareUrl(options){
  const config=api.config(options),params=new URLSearchParams({level:config.level,sharedQuiz:'1'});
  let id=options.collectionId||options.settings?.collectionId;
  if(!id)try{id=JSON.parse(new URL(config.returnTo,'https://hub.local/').searchParams.get('collection')).id;}catch{}
  const group=MusicDictionaryQuizCollections.groupsForLevel(config.level).find(g=>g.id===id);
  if(group&&group.conceptIds.length===config.concepts.length&&config.concepts.every(id=>group.conceptIds.includes(id)))params.set('group',group.id);
  else{
   const numbers=config.concepts.map(id=>/^MC-\d{4}$/.test(id)?Number(id.slice(3)):NaN).sort((a,b)=>a-b);
   if(numbers.some(n=>!Number.isInteger(n)))return api.url(options);
   const ranges=[];for(let i=0;i<numbers.length;i++){const start=numbers[i];let end=start;while(numbers[i+1]===end+1)end=numbers[++i];ranges.push(start===end?String(start):start+'-'+end);}
   params.set('ids',ranges.join(','));
  }
  if(!group||config.name!==group.label)params.set('name',config.name);
  if(Array.isArray(config.formats))params.set('formats',config.formats.join(','));
  if(config.defaultLevelQuiz===true||config.cumulativeLevelQuiz===true){
   params.set('cumulative','1');
   if(config.selectedLevelOnly===true&&config.level!=='ALL')params.set('selectedLevelOnly','1');
  }
  if(config.audioQuestions===false)params.set('audio','0');
  if(config.nonAudioQuestions===false)params.set('text','0');
  return './conceptquiz.html?'+params;
 },
 readShared(params){
  if(params.get('sharedQuiz')!=='1')return null;
  const level=params.get('level');if(!['N3','N4','N5','H','AH','ALL'].includes(level))return null;
  const group=MusicDictionaryQuizCollections.groupsForLevel(level).find(g=>g.id===params.get('group'));
  let concepts=group?.conceptIds;
  if(!concepts){
   const raw=params.get('ids')||'';if(!raw||raw.length>10000)return null;
   concepts=[];for(const part of raw.split(',')){
    const match=/^(\d{1,4})(?:-(\d{1,4}))?$/.exec(part);if(!match)return null;
    const start=Number(match[1]),end=Number(match[2]||match[1]);if(start<1||end<start||end>9999)return null;
    for(let n=start;n<=end;n++)concepts.push('MC-'+String(n).padStart(4,'0'));
   }
   concepts=MusicDictionaryQuizCollections.scopeIds(concepts,level);if(!concepts.length)return null;
  }
  const name=(params.get('name')||group?.label||'Quiz').slice(0,160);
  const returnParams=new URLSearchParams({level:level==='ALL'?'N5':level});if(level==='ALL')returnParams.set('all','1');
  if(group)returnParams.set('collection',JSON.stringify(group));
  return {...api.config({level,concepts,name,returnTo:'./conceptquiz.html?'+returnParams,settings:{...(params.get('selectedLevelOnly')==='1'?{selectedLevelOnly:true}:{}),audioQuestions:params.get('audio')!=='0',nonAudioQuestions:params.get('text')!=='0',...(params.has('formats')?{formats:params.get('formats').split(',').filter(f=>MusicDictionaryQuizCore.formats.includes(f))}:{})}}),...(group?{collectionId:group.id}:{}),...(group&&params.get('cumulative')==='1'?{cumulativeLevelQuiz:true}:{})};
 },
 launch(options){location.href=api.url(options);},
 Options({settings,onChange,onCreate}){const selected=selectedQuestionTypes(settings.formats);return h('div',{className:'mc-quiz-options'},h(MLH.MenuSubheading,null,'Quizzes'),h(MLH.MenuToggleRow,{label:'Audio Questions',glyph:h('img',{src:'./ui-icons/concept-companion-ear.svg',alt:'','aria-hidden':true,width:21,height:21}),profileKey:false,checked:settings.audioQuestions,onChange:()=>{if(!settings.audioQuestions||settings.nonAudioQuestions)onChange({audioQuestions:!settings.audioQuestions});}}),h(MLH.MenuToggleRow,{label:'Non-Audio Questions',glyph:h('img',{src:'./ui-icons/definition.svg',alt:'','aria-hidden':true,width:21,height:21}),profileKey:false,checked:settings.nonAudioQuestions,onChange:()=>{if(!settings.nonAudioQuestions||settings.audioQuestions)onChange({nonAudioQuestions:!settings.nonAudioQuestions});}}),h(MLH.MenuSubheading,null,'Question Types'),questionTypes.map(type=>{const [format,label,icon]=type,checked=selected.includes(type);return h(MLH.MenuToggleRow,{key:format,label,glyph:h('img',{src:'./music-dictionary/quiz-icons/question-types/'+icon+'-menu.png',alt:'','aria-hidden':true,width:26,height:26,style:{width:26,height:26,objectFit:'contain'}}),profileKey:false,checked,onChange:()=>{
   if(checked&&selected.length===1)return;
   const next=checked?selected.filter(entry=>entry!==type):[...selected,type];
   onChange({formats:formatsForTypes(next)});
  }});}));},
 CollectionRows({level,items,onLaunch}){return h('div',{className:'cq-collection-grid'},items.map(g=>h('button',{key:g.id,type:'button','data-collection-id':g.id,className:'cq-collection-row'+(g.qualification?' is-all-concepts':g.curriculumLevel||g.fullWidth?' is-full-width':''),onClick:()=>onLaunch(g)},h(CollectionGlyph,{group:g}),h('span',{className:'mc-quiz-collection-copy'},h('strong',null,g.label),h('span',null,(g.conceptCount??g.conceptIds.length)+' concept'+((g.conceptCount??g.conceptIds.length)===1?'':'s'))),!g.id.startsWith('saved-')&&(()=>{const award=MLH.achievements?.get('conceptquiz-'+level.toLowerCase()+'-'+g.id+'.html',level);return award?.tier?h('img',{className:'cq-collection-medal',src:'./ui-icons/'+award.tier+'.svg',alt:MLH.achievements.medals[award.tier].label+' medal',title:MLH.achievements.medals[award.tier].label+' medal'}):null;})(),h('svg',{'aria-hidden':true,className:'cq-collection-chevron',viewBox:'0 0 24 24',width:24,height:24},h('path',{d:'M9 5l7 7-7 7',fill:'none',stroke:'currentColor',strokeWidth:2.4,strokeLinecap:'round',strokeLinejoin:'round'})))));},
 Home({level,query='',onCreate,onLaunch,groups=[]}){
  const matches=g=>!query.trim()||[g.label,...g.conceptIds.map(id=>D.concepts.find(c=>c.id===id)?.name||'')].join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  const collections=MusicDictionaryQuizCollections.listedGroupsForLevel(level).filter(matches);
  const saved=groups.map((g,i)=>({...g,id:'saved-'+i,label:g.name,conceptIds:MusicDictionaryQuizCollections.scopeIds(g.concepts,'ALL')})).filter(g=>g.conceptIds.length&&matches(g));
  return h('section',{className:'cq-collections-home','aria-label':'Quiz collections'},h('h1',null,'Collections'),h('p',{className:'cq-collections-intro'},'Choose a collection to see its concepts and start a quiz.'),api.CollectionRows({level,items:collections,onLaunch}),!collections.length&&!saved.length&&h('p',{role:'status'},'No collections match your search.'),h(React.Fragment,null,h('h2',null,'My Collections'),h('p',{className:'cq-collections-intro'},'Collections you have created.'),h('button',{type:'button',className:'cq-button primary cq-create-my-collection',onClick:onCreate},'Create'),api.CollectionRows({level,items:saved,onLaunch})));
 },
 Menu({level,onCreate,onLaunch,groups=[]}){const collections=MusicDictionaryQuizCollections.listedGroupsForLevel(level),saved=groups.map((g,i)=>({...g,id:'saved-'+i,label:g.name,conceptIds:MusicDictionaryQuizCollections.scopeIds(g.concepts,'ALL')})).filter(g=>g.conceptIds.length);const rows=items=>items.map(g=>h('button',{key:g.id,type:'button',className:'mc-revision-option mc-quiz-collection',onClick:()=>onLaunch(g)},h(CollectionGlyph,{group:g}),h('span',{className:'mc-quiz-collection-copy'},h('strong',null,g.label),h('span',null,g.conceptIds.length+' concept'+(g.conceptIds.length===1?'':'s')))));return h(MLH.MenuPanel,{title:'Quizzes',position:'left-0',className:'mc-revision-groups-menu mc-quiz-menu',floating:true,dataMenuPanel:true},h('button',{type:'button',className:'mt-1 flex min-h-[44px] w-full items-center gap-3 rounded-xl border border-black bg-black px-3 py-2 text-left text-white transition hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-600 mc-quiz-create',onClick:onCreate},h('span',{className:'hub-toggle-label leading-none',style:{color:'inherit'}},'Collections')),h('div',{className:'mc-quiz-collections'},h(MLH.MenuSubheading,null,'Collections'),rows(collections),saved.length>0&&h(MLH.MenuSubheading,null,'My Collections'),rows(saved)));}
};
})();
