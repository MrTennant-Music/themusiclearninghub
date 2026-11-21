/* The room view is deliberately separate from the deterministic rules. */
(()=>{'use strict';
const C=EscapeCore,D=EscapeContent,$=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sharedCollection=window.HubCollections.selected();
const PREF='mlh:music-escape:preferences:v1';let state=null,adventure=[],active=false,paused=false,returnToPause=false,modalKey=null,returnFocus=null,last=performance.now(),audioFailed=false;
const MAX_LIVES=3;
let awaitingPlay=false;
let medalCelebrationKey=0,medalCelebrationUntil=0,medalSoundTimer=null;
let prefs={level:'N3',length:'Standard',balance:'Balanced',music:0,ambience:10,effects:30,puzzle:75};
const levelAttempts=new Map();
const attemptKey=level=>level+':'+(prefs.selectedLevelOnly===true);
try{Object.assign(prefs,JSON.parse(localStorage.getItem(PREF)||'{}'));}catch{}
Object.assign(prefs,C.settings(prefs));prefs.length='Standard';prefs.balance='Balanced';for(const k of ['music','ambience','effects','puzzle'])prefs[k]=Number.isFinite(Number(prefs[k]))?Math.max(0,Math.min(100,Number(prefs[k]))):0;
const queryLevel=new URLSearchParams(location.search).get('level');if(C.levels.includes(queryLevel))prefs.level=queryLevel;
const piano=new PopupPianoAudio();let soundTimers=[],ambient=null;
const effectAudio=new Audio();
// Weather has its own audio channel so puzzle stops cannot interrupt it.
const weatherAudio=new Audio('music-escape/audio/rain-thunder.mp3');
weatherAudio.loop=true;weatherAudio.preload='auto';
let weatherEntered=false,weatherFade=null,weatherNeedsGesture=false;
function syncWeather(){
 weatherAudio.muted=!!prefs.muted;
 const wanted=weatherEntered&&state&&!state.finished&&state.mistakes<MAX_LIVES&&!prefs.muted&&!document.hidden&&prefs.ambience>0;
 if(!wanted){
  if(!weatherFade&&!weatherAudio.paused){
   weatherFade=MLH.fadeOutAudio(weatherAudio).then(()=>{weatherFade=null;syncWeather();});
  }
  return;
 }
 if(weatherFade)return;
 weatherAudio.volume=Math.min(1,prefs.ambience/100*1.5);
 if(weatherAudio.paused)weatherAudio.play().then(()=>{weatherNeedsGesture=false;}).catch(error=>{weatherNeedsGesture=error?.name==='NotAllowedError';});
}
function enterWeather(){weatherEntered=true;syncWeather();}
function retryWeather(){if(weatherNeedsGesture)syncWeather();}
document.addEventListener('pointerdown',retryWeather);
document.addEventListener('keydown',retryWeather);
// End of independent weather channel.
const effectUrl=name=>(name==='piano'?'music-escape/audio/piano-keys.m4a':name==='game-over'?'music-escape/audio/game-over-trombone.mp3':`music-escape/audio/${name}.mp3`)+(name==='piano'?'?v=full-piano':name==='pixabay/room-5-mechanism-239967'?'?v=full-length':'?v=one-second');
const doorEffects=['door-1','door-2','door-3','door-4','door-5','door-6'];
const propEffects=EscapeObjectEffects;
function stopEffect(){
 effectAudio.onended=null;
 effectAudio.onerror=null;
 effectAudio.pause();
}
function toggleEffects(){
 prefs.muted=!prefs.muted;savePrefs();
 if(prefs.muted)stopEffect();
 syncWeather();
}
function playEffect(name){
 stopEffect();
 if(prefs.muted||!prefs.effects)return;
 effectAudio.volume=prefs.effects/100*(name==='wrong'?.25:1);
 effectAudio.src=effectUrl(name);
 effectAudio.play().catch(()=>{});
}
function stopSound(keepEffect=false){if(!keepEffect)stopEffect();document.querySelector('.escape-literacy-frame')?.contentWindow?.postMessage({type:"escape-practice-stop"},location.origin);soundTimers.forEach(clearTimeout);soundTimers=[];piano.stop();document.querySelectorAll('audio').forEach(a=>window.MLH?.fadeOutAudio?MLH.fadeOutAudio(a):a.pause());if(ambient){MLH.closeAudioContext(ambient);ambient=null;}}
function tone(midi,ms=350,volume='puzzle'){if((volume!=='puzzle'&&prefs.muted)||!(prefs[volume]>0))return;const id='escape-'+Math.random();piano.press(id,midi).then(()=>{if(piano.master)piano.master.gain.value=.22*prefs[volume]/100;}).catch(()=>status('Sound could not start. You can still use the labelled controls.'));soundTimers.push(setTimeout(()=>piano.release(id,true),ms));}
function sequence(notes,volume='puzzle'){stopSound();notes.forEach((n,i)=>soundTimers.push(setTimeout(()=>tone(n,330,volume),i*450)));}
function savePrefs(){try{localStorage.setItem(PREF,JSON.stringify(prefs));}catch{}}
function status(text){const el=$('#status');if(el)el.textContent=text;}
function time(s){return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;}
// Temporary control for vetting questions on the local preview.
const literacyReviewEnabled=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
function testRoomFromUrl(){
 if(!literacyReviewEnabled)return null;
 const number=Number(new URLSearchParams(location.search).get('testRoom'));
 return Number.isInteger(number)&&number>=1&&number<=C.routes.Standard.length?number-1:null;
}
const roomPreviewIndex=testRoomFromUrl();
function room(){
 const original=adventure[state.room];
 const review=state.literacyReview?.[state.room];
 if(!review)return original;
 const digits=[...original.digits];
 digits[1]=review.clue.digit;
 return {...original,digits,literacy:review.clue,literacySeed:review.seed,code:original.codeOrder.map(index=>digits[index]).join('')};
}
function solved(key){return key==='exit'&&state.solved.includes(C.id(state,key));}
let recordingPlayer=null;
function HeaderStats(){
 const e=React.createElement,[popup,setPopup]=React.useState(null),[medalDismissKey,dismissMedals]=React.useState(0),ref=React.useRef(null);
 React.useEffect(()=>{const outside=ev=>{if(!ref.current?.contains(ev.target))setPopup(null);};const key=ev=>{if(ev.key==='Escape')setPopup(null);};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key);};},[]);
 const resetEnabled=active||state.finished;
 const lives=MLHGamePractice.livesDisplay(awaitingPlay?MAX_LIVES:MAX_LIVES-state.mistakes,MAX_LIVES);
 const tileClass=MLH.shell.scoreTileClass+' escape-stat';
 const trigger=(name,label)=>({type:'button',className:tileClass,'aria-label':label,'aria-expanded':popup===name,onClick:()=>{if(popup!==name)dismissMedals(value=>value+1);setPopup(popup===name?null:name);}});
 return e('div',{className:'escape-stats',ref},
 e('div',{className:'escape-stat-anchor'},
  e(resetEnabled?'button':'section',resetEnabled?{...trigger('Lives','Lives — Show reset'),'aria-describedby':'escape-lives-status'}:{className:tileClass},
   !awaitingPlay&&e('div',{className:'absolute inset-0 overflow-hidden rounded-xl','aria-hidden':true},e('div',{className:'absolute bottom-0 -left-[2px] right-0 rounded-b-xl transition-all duration-700',style:{height:lives.fillPercent+'%',background:lives.fillColor}})),
   e('small',{className:'relative z-10'},lives.label),
   e('strong',{className:'relative z-10','aria-hidden':true},lives.value)),
  e('span',{id:'escape-lives-status',className:'sr-only',role:'status'},`${lives.value} of ${MAX_LIVES} lives remaining`),
  resetEnabled&&popup==='Lives'&&e('button',{type:'button',className:'fixed-popover-button score-reset-button absolute left-1/2 top-full z-[120] mt-2 flex min-w-[112px] -translate-x-1/2 items-center justify-center rounded-xl border border-[#dc2626] bg-[#dc2626] px-3 py-2 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(0,0,0,0.28)]',style:{animation:'medalPopupIn .28s cubic-bezier(.22,1.25,.32,1)'},onClick:()=>{setPopup(null);actions['reset-adventure']();}},'Reset')),
 e('div',{className:'escape-room-medals',onClickCapture:()=>setPopup(null)},e(MLH.ScoreStreakPanel,{
  dismissPopoverKey:medalDismissKey,
  assets:Object.fromEntries(Object.entries(MLH.achievements.medals).map(([tier,award])=>[tier,award.icon])),
  correct:state.fragments.length,attempted:state.fragments.length,accuracy:0,
  streak:awaitingPlay?0:roomPreviewIndex!==null?state.room+(solved('exit')?1:0):state.fragments.length,bestStreak:state.fragments.length,
  resetScore:()=>{},showScore:false,medalEligible:!sharedCollection,
  medalThresholdValues:C.medalTargets(adventure.length).map(target=>target.room),
  medalThresholdLabels:C.medalTargets(adventure.length).map(target=>String(target.room)),
  confettiKey:awaitingPlay?0:medalCelebrationKey,
  streakDisplay:{label:awaitingPlay?'Rooms':'Room',value:awaitingPlay?String(adventure.length):`${state.room+1}/${adventure.length}`,subtitle:'',ariaLabel:`${awaitingPlay?'Rooms':'Room'} — Show medals`}
 })));

}
function header(){ReactDOM.render(React.createElement(MLH.AppHeader,{icon:'app-icons/music-escape.svg?v=9f4da809e8a5',title:'Escape Room',subtitle:'Solve the clues to find your way out.',profileUsesSharedSettings:false,profileShowLabel:false},(document.fullscreenElement===$('#escape')?null:React.createElement(HeaderStats))),$('#escape-header'));}
function fragments(){return `<div class="fragment-strip" aria-label="${state.fragments.length} of ${adventure.length} score fragments">${adventure.map((_,i)=>`<span class="fragment ${state.fragments.includes(i)?'found':''}" style="--i:${i}">${state.fragments.includes(i)?'♪':'·'}</span>`).join('')}</div>`;}
function toolbar(){return '<nav id="escape-toolbar" class="toolbar" aria-label="Game controls"></nav>';}
let openCustomise=null;
const levelLabels={N3:'National 3',N4:'National 4',N5:'National 5',H:'Higher',AH:'Advanced Higher'};
function EscapeToolbar(){
 const e=React.createElement,[menu,setMenu]=React.useState(null),[revision,refresh]=React.useState(0),ref=React.useRef(null);
 React.useEffect(()=>{openCustomise=()=>setMenu('customise');const outside=ev=>{if(!ref.current?.contains(ev.target)&&!ev.target.closest('[data-menu-panel]'))setMenu(null);};const key=ev=>{if(ev.key==='Escape'){setMenu(null);ref.current?.querySelector('[aria-expanded="true"]')?.focus();}};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key);return()=>{openCustomise=null;document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key);};},[]);
 const icon=src=>e('img',{src,alt:'','aria-hidden':true,style:{width:src==='ui-icons/levels.svg'?28:21,height:src==='ui-icons/levels.svg'?26:21,transform:src==='ui-icons/levels.svg'?'scale(1.06)':undefined,objectFit:'contain'}});
 const update=(key,value)=>{prefs[key]=value;savePrefs();refresh(revision+1);if(!state)header();};
 const choice=(key,label,values)=>e('label',{className:'escape-option-row',key},e('span',null,label),e('select',{'aria-label':label,value:prefs[key],onChange:ev=>update(key,ev.target.value)},...values.map(v=>e('option',{key:v,value:v},v))));
 const levelPicker=e('div',{className:'escape-toolbar-controls'},
 e('div',{className:'hub-menu-anchor relative'},e(MLH.LevelButton,{icon:icon('ui-icons/levels.svg'),activeLevel:state?.options.level||prefs.level,activeLabel:levelLabels[state?.options.level||prefs.level],dataMenuTrigger:true,expanded:menu==='level',onClick:()=>setMenu(menu==='level'?null:'level')}),menu==='level'&&e(MLH.MenuPanel,{title:'Level',position:'left-0',dataMenuPanel:true},e(MLH.LevelMenu,{activeLevel:prefs.level,updateUrl:false,onSelect:level=>{setMenu(null);switchLevel(level);},levels:Object.fromEntries(C.levels.map(code=>[code,{label:levelLabels[code]}]))}))));
 const customise=e('div',{className:'hub-menu-anchor relative'},
  e(MLH.CustomiseButton,{icon:icon('ui-icons/customise.svg'),dataMenuTrigger:true,expanded:menu==='customise',onClick:()=>setMenu(menu==='customise'?null:'customise')}),
  menu==='customise'&&e(MLH.MenuPanel,{title:'Customise',variant:'customise',dataMenuPanel:true},
   !sharedCollection&&e(MLH.SelectedLevelOnlyToggle,{level:state?.options.level||prefs.level,checked:prefs.selectedLevelOnly===true,onChange:()=>{
    setMenu(null);
    if(state&&(state.attempts||state.discovered.length)&&!state.finished){
     confirmAction('Change Question Scope','Changing the question scope will start a new adventure.','change-question-scope');
    }else toggleQuestionScope();
   }}),window.HubCollections.menu('escape', null, prefs.level)));
 const collectionLink=sharedCollection&&window.HubCollections.clearCollectionLink(sharedCollection.name,state?.options.level||prefs.level);
 const left=e('div',{className:'escape-toolbar-controls',ref},levelPicker,customise,collectionLink);
 const fullscreen=document.fullscreenElement===$('#escape');
 const round=(label,pressed,onClick,child,extra='')=>e('button',{type:'button',className:'escape-round-control '+extra,'aria-label':label,title:label,'aria-pressed':pressed,onClick},child);
 const right=e('div',{className:'escape-toolbar-actions'},fullscreen&&e(HeaderStats),
 round(prefs.muted?'Turn on sound effects and ambience':'Turn off sound effects and ambience',!prefs.muted,()=>{toggleEffects();refresh(revision+1);},e('img',{src:'ui-icons/audio-svgrepo-com.svg',alt:'','aria-hidden':true}),'escape-sound-control'),
 round(fullscreen?'Exit Full Screen':'Full Screen',fullscreen,async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#escape').requestFullscreen();}catch{status('Full screen is unavailable in this browser.');}},e('svg',{width:22,height:22,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,'aria-hidden':true},e('path',{d:fullscreen?'M9 3v6H3m18 0h-6V3M3 15h6v6m6 0v-6h6':'M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6'}))));
 return e(MLH.AppToolbar,{left,right});
}
function renderToolbar(){ReactDOM.render(React.createElement(EscapeToolbar),$('#escape-toolbar'));}
function draw(){
 const dialog=$('#closeup'),wasOpen=dialog.open,opening=dialog.classList.contains('pause-dialog');
 if($('#escape').contains(dialog)){dialog.close();document.body.append(dialog);}
 const previous=$('#escape-toolbar');if(previous)ReactDOM.unmountComponentAtNode(previous);
 drawContent();renderToolbar();
 if(wasOpen)mountGameDialog(dialog,opening);
}
const codeOrderObjects={
 0:{label:'A4 Paper',asset:'loose-sheet'},
 1:{label:'Project Folder',asset:'project-folder'},
 2:{label:'Bin',asset:'wastepaper-bin',version:'134fdb10d85a'},
 3:{label:'Clipboard',asset:'clipboard',version:'37744ad75f95'},
 5:{label:'Staffroom Post',asset:'staffroom-post'},
 8:{label:'Concert Programme',asset:'concert-programme'}
};
const codeClueTypes=C.clueObjects;
function roomClueLabel(key,r){return key==='ear-training'?(r.index===5?'Mug':r.index===8?'Chair':'Headphones'):r.labels[codeClueTypes.indexOf(key)];}
function roomObjectImage(type,r,orderObject){
 if(type==='ear-training')return r.index===5?'music-escape/objects/mug.png':r.index===8?'music-escape/objects/chair.png':'music-escape/objects/headphones.png';
 if(type==='help')return 'music-escape/objects/music-dictionary.png';
 return type==='order'?'music-escape/objects/order-clues/'+orderObject.asset+'.png'+(orderObject.version?'?v='+orderObject.version:''):'music-escape/room-objects/room-'+r.index+'/'+type+'.png'+(r.index===2&&type==='archive'?'?v=ce48e65a5799':r.index===8&&type==='exit'?'?v=5669c52c1532':'');
}
function illustration(type,r,orderObject){
 return `<picture class="room-object-hitbox"><img class="room-object-image" src="${roomObjectImage(type,r,orderObject)}" alt="" aria-hidden="true" draggable="false" /></picture>`;
}
function padlockGlyph(className,unlocked=false){return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="${unlocked?'M8 10V6a4 4 0 0 1 8 0':'M8 10V7a4 4 0 0 1 8 0v3'}"/><path d="M12 14v3"/></svg>`;}
function roomObjects(r){
 const orderObject=codeOrderObjects[r.index]||codeOrderObjects[0];
 return [...r.sceneOrder,'exit','help'].map(key=>{
  const label=key==='help'?'Help':key==='exit'?'Exit':key==='order'?orderObject.label:roomClueLabel(key,r);
  const unlocked=solved(key);
  const locked=key==='exit'&&!unlocked;
  const exitState=locked
   ? `<span class="object-state exit-locked" id="exit-lock-state">${padlockGlyph('exit-lock-icon')}Locked</span>`
   : unlocked?'<span class="object-state">Unlocked</span>':'';
  const isClue=codeClueTypes.includes(key);
  const chosen=isClue?selectedClueDigit(key):null;
  const description=locked?'exit-lock-state':isClue?`escape-digit-${key}`:null;
  const badge=isClue?`<span class="object-state object-digit" id="${description}"${chosen===null?' hidden':''}>${clueDigitLabel(chosen)}</span>`:'';
  return `<button type="button" class="hotspot object-${key}${unlocked?' solved':''}" data-object="${key}" aria-label="${esc(label)}${unlocked?', unlocked':''}"${description?` aria-describedby="${description}"`:''}>${illustration(key,r,orderObject)}<span>${esc(label)}</span>${badge}${exitState}</button>`;
 }).join('');
}

// Transparent image padding is part of the DOM box, so test the artwork's alpha.
const objectAlpha=new Map();
let hoveredObject=null;
function setHoveredObject(object){
 if(object===hoveredObject)return;
 hoveredObject?.classList.remove('object-hovered');
 hoveredObject=object;
 hoveredObject?.classList.add('object-hovered');
}
function hitsObject(image,event){
 if(!image?.complete||!image.naturalWidth)return false;
 const {naturalWidth:width,naturalHeight:height}=image;
 const box=image.parentElement.getBoundingClientRect();
 const scale=Math.min(box.width/width,box.height/height);
 if(!scale)return false;
 const x=Math.floor((event.clientX-box.left-(box.width-width*scale)/2)/scale);
 const y=Math.floor((event.clientY-box.top-(box.height-height*scale)/2)/scale);
 if(x<0||x>=width||y<0||y>=height)return false;
 const src=image.currentSrc;
 if(!objectAlpha.has(src)){
  const canvas=document.createElement('canvas');
  canvas.width=width;canvas.height=height;
  const context=canvas.getContext('2d');
  if(!context)return false;
  context.drawImage(image,0,0);
  const rgba=context.getImageData(0,0,width,height).data;
  const alpha=new Uint8Array(width*height);
  for(let i=0;i<alpha.length;i++)alpha[i]=rgba[4*i+3];
  objectAlpha.set(src,alpha);
 }
 return objectAlpha.get(src)[y*width+x]>=32;
}
$('#escape').addEventListener('pointermove',event=>{
 const object=event.pointerType==='touch'?null:event.target.closest('.hotspot:not(:disabled)');
 setHoveredObject(hitsObject(object?.querySelector('.room-object-image'),event)?object:null);
});
$('#escape').addEventListener('pointerleave',()=>setHoveredObject(null));
function drawContent(){setHoveredObject(null);syncWeather();header();const host=$('#escape');
if(state.finished){host.innerHTML=toolbar()+`<section class="ending escape-school-ending"><div class="escape-ending-card"><h2>You did it!</h2><p>You step outside into the fresh air, just as the janitor returns to check the building.</p><div class="results"><div><strong>${time(state.elapsed)}</strong><small>Time</small></div></div><div class="actions"><button class="primary play-again" data-action="new">Play Again</button></div></div></section><p id="status" role="status" class="status"></p>`;return;}
const r=room();host.innerHTML=toolbar()+`<section class="room-shell" aria-labelledby="escape-room-title"><div class="scene${r.digits.length===4?' scene-four-digit':''}" style="--scene-x:${(r.index%3)*50}%;--scene-y:${Math.floor(r.index/3)*50}%">
 <div class="scene-heading"><h2 id="escape-room-title">${esc(r.name)}</h2><p>${esc(r.story)}</p></div>
 ${roomObjects(r)}</div></section><p id="status" class="status" role="status"></p>`;}
function mountGameDialog(dialog,opening=false){
 const panel=$('#escape .room-shell');
 if(!panel){
  if(document.fullscreenElement===$('#escape')&&!$('#escape').contains(dialog))$('#escape').append(dialog);
  if(!dialog.open)dialog.showModal();
  return;
 }
 let layer=dialog.closest('.escape-dialog-layer');
 if(!layer){
  if(dialog.open)dialog.close();
  layer=document.createElement('div');layer.className='escape-dialog-layer';
  panel.append(layer);layer.append(dialog);
  for(const child of panel.children)if(child!==layer)child.inert=true;
 }
 layer.classList.toggle('escape-pause-overlay',opening);
 layer.classList.toggle('escape-opening-overlay',opening&&dialog.getAttribute('aria-label')==='Ready to play');
 if(!dialog.open)dialog.show();
}
function detachGameDialog(dialog){
 const layer=dialog.closest('.escape-dialog-layer');
 if(!layer)return;
 const panel=layer.parentElement;
 document.body.append(dialog);
 for(const child of panel.children)if(child!==layer)child.inert=false;
 layer.remove();
}
function show(title,body,actions=''){stopSound();recordingPlayer?.destroy();recordingPlayer=null;returnFocus=document.activeElement;const d=$('#closeup'),literacy=body.includes('escape-literacy-frame');
 const titleHeading=title==='Unlocked'?`<h2 id="dialog-title" class="escape-unlocked-title">${padlockGlyph('escape-unlocked-icon',true)}<span>Unlocked</span></h2>`:`<h2 id="dialog-title">${esc(title)}</h2>`;
 const heading=literacy?`<div class="escape-clue-heading">${titleHeading}<span id="escape-clue-playback"></span></div>`:titleHeading;
 const gameOver=title==='Game Over';
 d.classList.toggle('game-over-dialog',gameOver);
 d.classList.toggle('music-literacy-dialog',literacy&&modalKey==='mechanism');
 d.classList.remove('shake');d.classList.toggle('literacy-dialog',literacy);d.classList.toggle('padlock-dialog',title==='Code');d.classList.toggle('pause-dialog',title==='Paused');if(title==='Paused'){d.removeAttribute('aria-labelledby');d.setAttribute('aria-label','Paused');}else{d.setAttribute('aria-labelledby','dialog-title');d.removeAttribute('aria-label');}d.classList.toggle('confirmation-dialog',body.includes('class="confirmation-message"'));d.innerHTML=`${title==='Paused'||title==='Reset'||gameOver?'':'<button class="dialog-close" data-action="close" aria-label="Close">×</button>'}${heading}${body}<div class="puzzle-feedback" id="feedback" role="status"></div>${actions?`<div class="dialog-actions">${actions}</div>`:''}`;if(title==='Paused')d.innerHTML='<button type="button" class="ig-preview-play escape-resume-play" data-action="resume" aria-label="Resume activity"><span class="hub-playback-glyph is-play" aria-hidden="true"></span></button>';mountGameDialog(d,title==='Paused');d.querySelectorAll('audio').forEach(audio=>audio.muted=false);d.querySelector('.dialog-close, [data-action="resume"], [data-action="start-again"], .dialog-actions [data-action="close"]').focus();}
function close(keepEffect=false){stopSound(keepEffect);recordingPlayer?.destroy();recordingPlayer=null;const d=$('#closeup'),focus=returnFocus;d.classList.remove('shake');d.close();detachGameDialog(d);d.querySelector('.escape-literacy-frame, .escape-dictionary-frame')?.remove();d.querySelector('#escape-clue-playback')?.remove();modalKey=null;audioFailed=false;if(returnToPause){returnToPause=false;show('Paused','');returnFocus=focus;return;}if(paused){paused=false;last=performance.now();header();}focus?.focus();}
function feedback(text){$('#feedback').textContent=text;}
function confirmAction(title,message,action){const dialog=$('#closeup'),focus=document.activeElement;if(dialog.closest('.escape-pause-overlay')){returnToPause=true;dialog.close();detachGameDialog(dialog);}modalKey=null;show(title,`<p class="confirmation-message">${esc(message)}</p>`,`<button data-action="close">Cancel</button><button class="primary" data-action="${action}">Confirm</button>`);returnFocus=focus;}
function toggleQuestionScope(){
 prefs.selectedLevelOnly=prefs.selectedLevelOnly!==true;
 savePrefs();
 newGame();
}
function switchLevel(level){
 if(sharedCollection){location.href=window.HubCollections.standardLevelUrl(level);return;}
 if(level===prefs.level)return;levelAttempts.set(attemptKey(prefs.level),state);stopSound();close();active=false;modalKey=null;tapping=null;prefs.level=level;savePrefs();const url=new URL(location.href);url.searchParams.set('level',level);history.replaceState(null,'',url);state=levelAttempts.get(attemptKey(level))||null;adventure=state?C.generate(state.seed,state.options,D,sharedCollection?.concepts,state.version):[];if(state){active=!state.finished;last=performance.now();draw();if(!state.finished){if(state.mistakes>=MAX_LIVES)showGameOver();else showOpeningPlay();}}else newGame();}
function showOpeningPlay(wakingUp=false){
 awaitingPlay=true;
 weatherEntered=false;syncWeather();
 active=false;paused=true;header();renderToolbar();modalKey=null;show('Paused','');
 $('#closeup').setAttribute('aria-label','Ready to play');
 $('#closeup').closest('.escape-dialog-layer').classList.add('escape-opening-overlay');
 const play=$('#closeup [data-action="resume"]');
 play.setAttribute('aria-label','Play activity');
 if(wakingUp)play.dataset.action='wake-up';
}
function resumeGame(){awaitingPlay=false;close();active=true;last=performance.now();draw();}
function wakeUp(){
 $('#escape .scene').classList.add('escape-waking');
}
function newGame(waitForPlay=true){weatherEntered=false;syncWeather();clearTimeout(medalSoundTimer);medalCelebrationKey=0;medalCelebrationUntil=0;returnToPause=false;stopSound();state=C.create(crypto.getRandomValues(new Uint32Array(1))[0],{...prefs,length:'Standard',balance:'Balanced'});if(roomPreviewIndex!==null)state.room=roomPreviewIndex;C.enter(state);adventure=C.generate(state.seed,state.options,D,sharedCollection?.concepts,state.version);resumeGame();if(waitForPlay&&roomPreviewIndex===null)showOpeningPlay(true);else{wakeUp();if(!waitForPlay)enterWeather();}}
const names=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];function note(m){return names[m%12]+(Math.floor(m/12)-1);}
function writtenNote(m,r=room()){const i=r.sequence.indexOf(m);return i<0?note(m):r.spellings[i];}
function draft(key,initial){const k=C.id(state,key);if(!Object.hasOwn(state.drafts,k))state.drafts[k]=initial;return state.drafts[k];}
function persistDraft(value){state.drafts[C.id(state,modalKey)]=value;}
function restoreCodeFeedback(){
 const rejected=state.lastRejectedCode;
 if(!rejected||rejected.room!==state.room)return;
 $('#closeup').querySelectorAll('[data-dial]').forEach(dial=>{
  const index=Number(dial.dataset.dial);
  if(rejected.cleared?.includes(index)||dial.value!==rejected.code[index])return;
  const correct=dial.value===room().code[index];
  dial.dataset.result=correct?'correct':'incorrect';
  dial.setAttribute('aria-description',correct?'Correct digit':'Incorrect digit');
  if(correct)dial.removeAttribute('aria-invalid');
  else dial.setAttribute('aria-invalid','true');
 });
}
function canUnlock(code,digitCount){
 if(code.length!==digitCount||!/^[1-9]+$/.test(code))return false;
 const rejected=state.lastRejectedCode;
 return rejected?.room!==state.room||rejected.code!==code;
}
const escapeLiteracyActivities={
 rhythmDictation:'rhythmicdictation.html?embed=escape&amp;v=1165e31683e6',
 time:'timesignatures.html?embed=escape&amp;v=1997f2f374ca',
 key:'keysignatures.html?embed=escape&amp;v=100f905ab9e3',
 follow:'followthescore.html?embed=escape&amp;v=6a1fcd70811a',
 transpose:'transposing.html?embed=escape&amp;v=c64a1885d38d',
 rhythmSum:'rhythmsums.html?embed=escape&amp;v=1f75a1c17c22',
 interval:'intervals.html?embed=escape&amp;v=aa32d9c2da9b',
 rest:'rests.html?embed=escape&amp;v=120865d0bb26',
 noteValue:'rhythmidentification.html?embed=escape&amp;v=df9f993f330b',
 chord:'chords.html?embed=escape&amp;v=77afabfe3c02',
 noteNames:'noteidentification.html?embed=escape&amp;v=40aebbdbf12a',
 keyboardSingle:'practicequestions.html?embed=escape&amp;v=132f004b42ed',
 keyboardNote:'keyboardnoteidentification.html?embed=escape&amp;v=aee95d306349',
 melodicDictation:'melodicdictation.html?embed=escape&amp;v=cf9618a4952f',
 enharmonic:'enharmonicequivalents.html?embed=escape&amp;v=66bf81fe9dbd',
 chordInversion:'chords.html?embed=escape&amp;v=77afabfe3c02',
 chordBassLine:'chords.html?embed=escape&amp;v=77afabfe3c02',
 accidentals:'accidentals.html?embed=escape&amp;v=d497cf5da0d8',
 scaleDegrees:'scaledegrees.html?embed=escape&amp;v=16383c68733e',
 cadences:'cadences.html?embed=escape&amp;v=26ba1603681d',
 tempo:'tempo.html?embed=escape&amp;v=acf3ea7bb75c',
 dynamics:'dynamics.html?embed=escape&amp;v=e00165efd5bc',
 articulation:'articulationmarkings.html?embed=escape&amp;v=9ccff265a65b',
 repeats:'repeatsigns.html?embed=escape&amp;v=3179d92bf081',
 triplets:'triplets.html?embed=escape&amp;v=dea7edcd174b',
 barlines:'barlines.html?embed=escape&amp;v=0cf4de5a3bb8',
 earTraining:'auralrecognition.html?embed=escape&amp;v=24a58186c6a7'
};
function inspect(key){const r=room();modalKey=key;audioFailed=false;if(solved(key)){if(key==='exit'&&state.room===adventure.length-1){show('You did it!','<p>You step outside into the fresh air, just as the janitor returns to check the building.</p>','<button class="primary" data-action="advance">Leave</button>');return;}show(key==='exit'?'Unlocked':'Mechanism unlocked',`<p>${key==='exit'?'The door is unlocked. Continue when you are ready.':'This mechanism has already released its discovery. Your collected clues appear above the room.'}</p>`,key==='exit'?`<button class="primary" data-action="advance">Leave</button>`:'');return;}

if(key==='help'){
 show('Music Dictionary',`<iframe class="escape-dictionary-frame" title="Music Dictionary" src="music-dictionary/musicdictionary.html?embed=escape&amp;all=1&amp;level=${state.options.level}"></iframe>`);
 return;
}
if(key==='order'){
 show('Order',`<ol class="escape-code-order" role="list">${r.codeOrder.map(clueIndex=>`<li><img src="${roomObjectImage(codeClueTypes[clueIndex],r)}" alt="${esc(roomClueLabel(codeClueTypes[clueIndex],r))}" draggable="false" /><span class="escape-order-digit"${selectedClueDigit(codeClueTypes[clueIndex])===null?' hidden':''}>${clueDigitLabel(selectedClueDigit(codeClueTypes[clueIndex]))}</span></li>`).join('')}</ol>`);
 return;
}
if(key==='archive')C.discover(state,r);
if(r.collectionQuestions?.[key]){
 showBankQuestion(r.collectionQuestions[key],key);
 return;
}
if(key==='archive')showBankQuestion(r.knowledge,key);
if(key==='mechanism'||key==='ear-training'){
 const token=literacyToken(key);
 const clue=key==='mechanism'?r.literacy:r.earTraining;
 if(!clue)return;
 const activity=escapeLiteracyActivities[clue.kind];
 const title=key==='mechanism'?'Music literacy question':'Ear Training question';
 show(roomClueLabel(key,r),`<iframe class="escape-literacy-frame" title="${title}" src="${activity}&amp;level=${state.options.level}&amp;seed=${r.literacySeed}&amp;token=${encodeURIComponent(token)}"></iframe>`);
}
if(key==='recording')showBankQuestion(r.listening,key);
if(key==='exit'){
 const values=draft(key,r.digits.map(()=>'0'));
 const disabled=canUnlock(values.join(''),r.digits.length)?'':' disabled';
 show('Code','<div class="dials'+(r.digits.length===4?' four-digit-dials':'')+'">'+r.digits.map((_,i)=>`<span class="code-dial"><select data-dial="${i}" aria-label="${['First','Second','Third','Fourth'][i]} digit">${Array.from({length:10},(_,n)=>`<option ${String(values[i]??0)===String(n)?'selected':''}>${n}</option>`).join('')}</select></span>`).join('')+'</div>',
  `<button class="primary" data-action="check"${disabled}>Unlock</button>`);
 restoreCodeFeedback();
}}
function regenerateLiteracy(){
 if(!literacyReviewEnabled||modalKey!=='mechanism'||!$('#closeup').open||!room().literacy)return;
 const original=adventure[state.room];
 state.literacyReview??={};
 const revision=(state.literacyReview[state.room]?.revision??0)+1;
 const order=C.literacyReviewOrder(original.literacySeed,state.options.level,original.literacy.kind);
 const seed=(original.literacySeed+Math.imul(revision,0x9e3779b9))>>>0;
 const clue=C.literacyClue(seed,state.options.level,order[(revision-1)%order.length]);
 state.literacyReview[state.room]={revision,seed,clue};
 delete state.drafts[C.id(state,'mechanism')];
 if(state.practiceDrafts?.[state.room])delete state.practiceDrafts[state.room].activityQuestion;
 updateClueDigitBadge('mechanism',null);
 const focus=returnFocus;
 inspect('mechanism');
 returnFocus=focus;
 $('#closeup [data-action="regenerate-literacy"]').focus();
}
function selectedClueDigit(key){
 const digit=state.drafts[C.id(state,key)]?.[0];
 return validClueDigit(digit)?digit:null;
}
function validClueDigit(digit){return Number.isInteger(digit)&&digit>=0&&digit<=9;}
function clueDigitLabel(digit){
 return digit===null?'':`<span class="sr-only">Selected digit </span>${digit}`;
}
function saveClueDigit(key,digit){
 if(!validClueDigit(digit))return;
 state.drafts[C.id(state,key)]=[digit];
 updateClueDigitBadge(key,digit);
}
function updateClueDigitBadge(key,digit){
 const badge=document.getElementById(`escape-digit-${key}`);
 if(badge){
  badge.innerHTML=clueDigitLabel(digit);
  badge.hidden=digit===null;
 }
}
function showBankQuestion(q,key){
 const r=room(),clueIndex=codeClueTypes.indexOf(key);
 const digit=r.digits[clueIndex],rng=C.random(state.seed+r.index+315+clueIndex*156);
 const numbers=C.shuffle([1,2,3,4,5,6,7,8,9].filter(n=>n!==digit),rng);
 const choices=C.shuffle(q.options.map(o=>({...o,digit:q.correctOptionIds.includes(o.id)?digit:numbers.pop()})),rng);
 const prompt=q.prompt.replace(/\s+Tick one box\.$/i,'').replace(/ and tick one box to /i,' and ');
 const promptMarkup=!q.src||r.collectionQuestions?`<p class="escape-bank-prompt">${esc(prompt)}</p>`:'';
 const audioMarkup=q.src?`<div id="recording-player" class="escape-audio-player" role="group" aria-label="Audio example"></div>`:'';
 show(roomClueLabel(key,r),`${promptMarkup}${audioMarkup}<div class="escape-bank-options">${choices.map(o=>`<button type="button" class="numbered-clue" data-clue-digit="${o.digit}" aria-pressed="${o.digit===selectedClueDigit(key)}"><strong>${o.digit}</strong><span>${esc(o.text)}</span></button>`).join('')}</div>`);
 const host=$('#recording-player');if(!host)return;
 recordingPlayer=ExamAudio.createPlayer(host,{clips:[{file:q.src,label:'Audio example'}],onPlaybackError:()=>feedback('The recording could not load. Close and reopen this object to retry.')});
 const a=host.querySelector('audio');a.muted=false;
 a.volume=prefs.puzzle/100;
 a.addEventListener('loadedmetadata',()=>{a.currentTime=q.start||0;});
 a.addEventListener('timeupdate',()=>{if(q.end&&a.currentTime>=q.end){a.pause();a.currentTime=q.start||0;}});
 a.addEventListener('play',()=>{stopEffect();if(q.end&&a.currentTime>=q.end)a.currentTime=q.start||0;});
 a.addEventListener('error',()=>feedback('The recording could not load. Close and reopen this object to retry.'),true);
}
const activeClue=()=>modalKey==='mechanism'?room().literacy:modalKey==='ear-training'?room().earTraining:null;
function literacyToken(key){
 const token=C.id(state,key)+':'+state.seed;
 const revision=key==='mechanism'?state.literacyReview?.[state.room]?.revision:null;
 return revision?token+':'+revision:token;
}
const validLiteracyToken=token=>Boolean(activeClue())&&token===literacyToken(modalKey);
const questionCacheKey=()=>modalKey==='ear-training'?'earTrainingQuestion':'activityQuestion';
window.EscapePracticeBridge={
 // This bridge reports question-audio availability, independent of sound effects.
 muted:()=>false,
 clue:token=>validLiteracyToken(token)?activeClue():null,
 playbackSlot:token=>validLiteracyToken(token)?$('#escape-clue-playback'):null,
 readDigit:token=>validLiteracyToken(token)?selectedClueDigit(modalKey):null,
 saveDigit:(token,digit)=>{
  if(validLiteracyToken(token)&&$('#closeup').open)saveClueDigit(modalKey,digit);
 },
 readActivity:token=>validLiteracyToken(token)?state.practiceDrafts?.[state.room]?.[questionCacheKey()]:null,
 saveActivity:(token,question)=>{
  if(!validLiteracyToken(token))return;
  state.practiceDrafts??={};
  state.practiceDrafts[state.room]={...state.practiceDrafts[state.room],[questionCacheKey()]:structuredClone(question)};
 }
};
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||!$('#closeup').open)return;
 if(event.data==='escape-dictionary-close'&&event.source===$('.escape-dictionary-frame')?.contentWindow){
  close();
  return;
 }
 const frame=$('.escape-literacy-frame');
 if(event.source!==frame?.contentWindow||event.data?.type!=='escape-practice'||!validLiteracyToken(event.data.token))return;
 if(event.data.event==='height'&&Number.isInteger(event.data.height)&&event.data.height>0&&event.data.height<=1280)frame.style.height=event.data.height+'px';
});
const dynamics={20:'pp',30:'p',40:'—',50:'mp',60:'mf',70:'f',80:'ff'},dynamicWords={20:'very quiet',30:'quiet',50:'moderately quiet',60:'moderately loud',70:'loud',80:'very loud'};
function audioFallback(){if(audioFailed)return;audioFailed=true;feedback('This recording could not load. Retry playback, or use the written sleeve clue below.');const p=document.createElement('p');p.className='instruction';const current=room(),recording=current.collectionQuestions?.recording||current.listening;p.textContent=D.concepts.find(concept=>concept.id===recording.conceptId)?.definition||recording.feedback||'';$('#feedback').after(p);}
function showGameOver(){
 syncWeather();
 active=false;
 paused=true;
 modalKey=null;
 if(document.fullscreenElement===$('#escape'))renderToolbar();
 else header();
 show('Game Over','<p>After entering three incorrect codes, you wake up back in the practice room and realise you have been dreaming this whole time.</p>',
  '<button class="primary" data-action="start-again">Start Again</button>');
}
function check(){
 if(modalKey!=='exit'||solved('exit'))return;
 const r=room(),code=draft('exit',[]).join('');
 if(!canUnlock(code,r.digits.length))return;
 const previousMedal=C.medal(state);
 if(C.solve(state,r,'exit',code)){
  const finalRoom=state.room===adventure.length-1;
  const tier=finalRoom?'diamond':C.medal(state),award=!sharedCollection&&tier!==previousMedal&&MLH.achievements.medals[tier];
  if(award){
   if(roomPreviewIndex===null)MLH.achievements.award('musicescape.html',state.options.level,tier);
   medalCelebrationKey++;medalCelebrationUntil=Date.now()+2600;
  }
  if(finalRoom){
   clearTimeout(medalSoundTimer);MLH.stopFeedbackSound?.();
   close();C.advance(state,adventure.length);draw();if(award)playMedalCelebration(tier);return;
  }
  stopSound();draw();
  const next='<button class="primary" data-action="advance">Leave</button>';
  show(finalRoom?'You did it!':'Unlocked',finalRoom?'<p>You step outside into the fresh air, just as the janitor returns to check the building.</p>':'<p>The door unlocks. You are one step closer to escaping the school.</p>',next);
  if(award)playMedalCelebration(tier);
  playEffect(finalRoom?'final-victory':doorEffects[state.room]);
 }else{
  if(state.mistakes>=MAX_LIVES){showGameOver();playEffect('game-over');return;}
  playEffect('wrong');
  state.lastRejectedCode={room:state.room,code};
  $('#closeup [data-action="check"]').disabled=true;
  if(document.fullscreenElement===$('#escape'))renderToolbar();
  else header();
  const dialog=$('#closeup.padlock-dialog');
  restoreCodeFeedback();
  dialog.classList.remove('shake');void dialog.offsetWidth;dialog.classList.add('shake');
 }
}
function playMedalCelebration(tier){
 clearTimeout(medalSoundTimer);
 medalSoundTimer=setTimeout(()=>{if(!document.hidden)MLH.playFeedbackSound(true,true,tier==='diamond'?'platinum':tier);},180);
}
function advanceRoom(){
 if(!C.advance(state,adventure.length))return;
 close(true);
 draw();
 if(!state.finished){wakeUp();return;}

}
function openRoomObject(key){
 const effect=propEffects[key];
 const clip=typeof effect==='string'?effect:effect?.[room().index];
 inspect(key);
 if(clip&&(key!=='exit'||!solved('exit')))playEffect(clip);
}
function settingsView(){modalKey=null;openCustomise?.();}
let tapping=null;
let offlineRegistration=null;
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('music-escape-sw.js',{scope:'./musicescape.html'}).then(r=>{offlineRegistration=r;}).catch(()=>{});
async function prepareOffline(){if(!offlineRegistration)return feedback('Offline saving is unavailable here. Use a secure hosted version or localhost.');feedback('Saving this adventure’s recordings and sound effects…');try{const reg=await navigator.serviceWorker.ready;const effects=Object.values(propEffects).flatMap(effect=>typeof effect==='string'?[effect]:Object.values(effect));const urls=[...new Set([...adventure.flatMap(r=>r.collectionQuestions?Object.values(r.collectionQuestions):[r.listening]).map(q=>q.src).filter(Boolean),...[...effects,...doorEffects,'wrong','game-over','final-victory','dial-turn','rain-thunder'].map(effectUrl)])];const midi=[...new Set(adventure.flatMap(r=>r.sequence||[]))];midi.forEach(m=>{const layers=MLH_PIANO_SAMPLE_MAP.notes[String(m)]||[];const layer=layers.find(l=>96>=l.loVel&&96<=l.hiVel)||layers.at(-1);if(layer)urls.push('./audio/piano/'+encodeURIComponent(layer.sample));});const channel=new MessageChannel();channel.port1.onmessage=e=>feedback(e.data.ok?'Ready for offline play on this browser. Keep the saved adventure until you finish.':'Offline preparation was incomplete. '+e.data.message);reg.active.postMessage({type:'prepare',urls},[channel.port2]);}catch{feedback('Could not prepare offline play. Check your connection and try again.');}}
const actions={'change-question-scope':toggleQuestionScope,'start-again':()=>newGame(false),'regenerate-literacy':regenerateLiteracy,'check-bank':()=>{const answer=$('input[name=bank-answer]:checked')?.value;if(!answer)return feedback('Choose an answer first.');check(answer);},'restart-adventure':()=>confirmAction('Restart','This will clear your current adventure and start again.','replace'),'reset-adventure':()=>{stopSound();state=null;adventure=[];active=false;levelAttempts.delete(attemptKey(prefs.level));newGame();},offline:prepareOffline,close,settings:settingsView,start:newGame,continue:()=>{active=true;last=performance.now();draw();},new:()=>state&&!state.finished?confirmAction('New Adventure','This will replace your current adventure and its saved progress.','replace'):newGame(),replace:newGame,resume:()=>{resumeGame();enterWeather();},'wake-up':()=>{resumeGame();enterWeather();wakeUp();},restart:()=>confirmAction('Restart Current Room','Reset this room’s discoveries, points and attempts to its entry state? Earlier rooms and elapsed time are preserved.','restart-confirm'),'restart-confirm':()=>{C.restart(state);close();draw();},check:()=>check(),reset:()=>{persistDraft([]);tapping=null;inspect(modalKey);},hear:()=>sequence(room().sequence),audition:()=>{stopSound();const values=draft(modalKey,[50,50,50]);room().sequence.slice(0,3).forEach((m,i)=>{const id='mix-'+i;piano.press(id,m).then(()=>{const v=piano.voices.get(id);if(v?.gain)v.gain.gain.setTargetAtTime(values[i]/100*.6,piano.context.currentTime,.01);}).catch(()=>feedback('Audio unavailable. The faders remain usable.'));soundTimers.push(setTimeout(()=>piano.release(id,true),1200));});},advance:advanceRoom,'hear-rhythm':()=>{stopSound();let t=0;room().durations.forEach(v=>{soundTimers.push(setTimeout(()=>tone(67,140),t*750));t+=v;});},'tap-start':()=>{stopSound();tapping=[];feedback('Tap the rhythm. Your first tap starts the clock.');},tap:()=>{if(!tapping)return feedback('Select Start tapping first.');tapping.push(performance.now()/1000);tone(67,100);if(tapping.length===room().durations.length){let b=0;const expected=room().durations.map(v=>{const o={time:b*.75};b+=v;return o;}),result=READING_RHYTHMS_CORE.matchPerformance(expected,tapping.map(t=>t-tapping[0]),80);tapping=null;if(result.percentage>=80){persistDraft([...room().durations]);inspect(modalKey);feedback('The pulse mechanism accepts your rhythm. Activate it when ready.');}else feedback('The pulse drifted. Try again, or use the untimed duration gears.');}}};
// Dismiss only when the gesture both starts and ends outside a closable dialog.
let outsideDialogPress=null;
document.addEventListener('pointerdown',event=>{
 const dialog=$('#closeup');
 outsideDialogPress=dialog.open&&!dialog.contains(event.target)?dialog:null;
});
document.addEventListener('pointercancel',()=>{outsideDialogPress=null;});
document.addEventListener('click',event=>{
 const dialog=$('#closeup'),outside=outsideDialogPress===dialog&&!dialog.contains(event.target);
 outsideDialogPress=null;
 if(!outside||!dialog.open||!dialog.querySelector('.dialog-close'))return;
 event.preventDefault();event.stopImmediatePropagation();close();
},true);
document.addEventListener('click',e=>{const b=e.target.closest('button,a');if(!b)return;if(b.matches('#closeup .escape-clue-play'))stopEffect();if(b.matches('#closeup [data-clue-digit]')&&(['archive','recording'].includes(modalKey)||room().collectionQuestions?.[modalKey])){
 saveClueDigit(modalKey,Number(b.dataset.clueDigit));
 $('#closeup').querySelectorAll('[data-clue-digit]').forEach(choice=>choice.setAttribute('aria-pressed',String(choice===b)));
 return;
}if(b.dataset.exit!==undefined){stopSound();}if(b.dataset.action){actions[b.dataset.action]?.();return;}if(b.dataset.object){openRoomObject(b.dataset.object);return;}if(b.dataset.item){inspect(b.dataset.item.startsWith('Cylinder')?'mechanism':'recording');return;}if(b.dataset.note||b.dataset.pin){const n=Number(b.dataset.note||b.dataset.pin),a=draft(modalKey,[]);if(a.length<room().sequence.length){a.push(n);persistDraft(a);$('.note-output').textContent=a.map(m=>writtenNote(m)).join(' · ');}tone(n);return;}if(b.dataset.duration){const a=draft(modalKey,[]);if(a.length<12){a.push(Number(b.dataset.duration));persistDraft(a);$('.note-output').textContent=a.join(' + ')+' beats';}return;}if(b.dataset.answer){const option=room().audio.options.find(o=>o.id===b.dataset.answer);check(room().audio.correctOptionIds.includes(option.id)?room().audioConcept.id:'wrong');}});
document.addEventListener('change',e=>{
 const target=e.target;
 if(target.name==='bank-answer')persistDraft([target.value]);
 if(target.dataset.match!==undefined){const a=draft(modalKey,['','','']);a[Number(target.dataset.match)]=target.value;persistDraft(a);}
 if(target.dataset.dial!==undefined){
  const {digits}=room();
  const values=draft('exit',digits.map(()=>'0'));
  const index=Number(target.dataset.dial);
  if(values[index]===target.value)return;
  values[index]=target.value;
  playEffect('dial-turn');
  persistDraft(values);
  $('#closeup [data-action="check"]').disabled=!canUnlock(values.join(''),digits.length);
  const rejected=state.lastRejectedCode;
  if(rejected?.room===state.room){rejected.cleared??=[];if(!rejected.cleared.includes(index))rejected.cleared.push(index);}
  delete target.dataset.result;
  target.removeAttribute('aria-description');
  target.removeAttribute('aria-invalid');
 }
});
document.addEventListener('input',e=>{if(e.target.dataset.mix!==undefined){const a=draft(modalKey,[50,50,50]);a[Number(e.target.dataset.mix)]=Number(e.target.value);persistDraft(a);e.target.nextElementSibling.textContent=(dynamics[e.target.value]||e.target.value);}});
$('#closeup').addEventListener('cancel',e=>{e.preventDefault();if(active||!paused)close();});
document.addEventListener('keydown',event=>{const dialog=$('#closeup');if(event.key==='Escape'&&dialog.open&&dialog.closest('.escape-dialog-layer:not(.escape-pause-overlay)')){event.preventDefault();if(!dialog.classList.contains('game-over-dialog'))close();}});
document.addEventListener('fullscreenchange',()=>{draw();last=performance.now();});
document.addEventListener('visibilitychange',()=>{last=performance.now();syncWeather();if(document.hidden){stopSound();}});window.addEventListener('pagehide',()=>{weatherEntered=false;syncWeather();stopSound();});
setInterval(()=>{const now=performance.now();if(state&&active&&!paused&&!state.finished&&state.fragments.length<adventure.length&&!document.hidden){state.elapsed+=Math.min(2,(now-last)/1000);}last=now;},1000);
newGame();
})();
