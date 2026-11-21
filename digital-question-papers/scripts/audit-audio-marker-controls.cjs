'use strict';
// Actual marker inputs and decoded media seeks. This does not listen to cues.
const fs=require('node:fs'),path=require('node:path'),{chromium,webkit}=require('playwright');
const {server,root}=require('./audit-papers-browser.cjs'),registry=require('../paper-registry');
const touch=process.env.AUDIT_TOUCH==='1',touchWidth=Number(process.env.AUDIT_WIDTH||390);
const selectedMarkers=process.env.AUDIT_MARKER_SELECTION?new Set(JSON.parse(fs.readFileSync(process.env.AUDIT_MARKER_SELECTION,'utf8')).map(r=>[r.paperId,r.questionId,r.markerIndex].join('/'))):null;
const phases=(process.env.AUDIT_PHASES||'practice,feedback').split(',');
const selectionPlayback=Boolean(selectedMarkers&&process.env.AUDIT_SELECTION_PLAYBACK!=='0');
const out=path.resolve(process.env.AUDIT_OUTPUT||'maintenance/generated/past-paper-audio-marker-controls');fs.mkdirSync(out,{recursive:true});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const engine=process.env.AUDIT_ENGINE||'chromium';
 const browser=await(engine==='webkit'?webkit:chromium).launch({headless:true,...engine!=='webkit'&&process.env.AUDIT_BROWSER?{executablePath:process.env.AUDIT_BROWSER}:{}});
 const result={engine,touch,touchWidth:touch?touchWidth:undefined,browserVersion:browser.version(),touchMethod:touch?(engine==='webkit'?'Native touchscreen tap with fitted-viewport coordinate conversion and target hit check; open using real Play/Pause, close through the question menu. Non-interactive text taps trigger incorrect WebKit click retargeting on an independent minimal page.':'Playwright locator.tap; open using real Play/Pause and close through question menu'):undefined,scope:'Every printed section-marker button in Practice and submitted single-question feedback: pointer click and keyboard Enter, decoded currentTime/progress agreement, paused-state preservation and focus visibility. Slider Home/ArrowRight are real keyboard inputs. No full-track listening or cue accuracy claim.',papers:[]};
 try{for(const entry of Object.values(registry).filter(e=>!process.env.AUDIT_PAPER||process.env.AUDIT_PAPER.split(',').includes(e.id))){
  const paper=require(path.join(root,'digital-question-papers',entry.dataFile.split('?')[0])),context=await browser.newContext({viewport:{width:touch?touchWidth:1440,height:touch?1024:1000},isMobile:touch,hasTouch:touch,deviceScaleFactor:touch?2:1,reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(6000);
  const activate=async locator=>{if(!touch)return locator.click();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));if(await locator.evaluate(n=>Boolean(n.closest('.exam-header')))){await page.evaluate(()=>window.scrollTo(0,0));}else{await page.evaluate(()=>window.scrollTo(0,0));await locator.scrollIntoViewIfNeeded();}await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));if(engine!=='webkit')return locator.tap();const point=await locator.evaluate(n=>{const r=n.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,v=visualViewport;if(!n.contains(document.elementFromPoint(x,y)))throw new Error('Visible touch target is obstructed: '+n.outerHTML.slice(0,280)+' by '+document.elementFromPoint(x,y)?.outerHTML.slice(0,280)+' at '+JSON.stringify({x,y,width:r.width,height:r.height,scale:v.scale}));return{x:(x-v.offsetLeft)*v.scale,y:(y-v.offsetTop)*v.scale};});return page.touchscreen.tap(point.x,point.y);};
  if(touch&&engine==='webkit')await page.route('**/exam-audio.js*',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(root,'digital-question-papers/exam-audio.js'),'utf8').replace('function reportPlaybackError(error) {', 'function reportPlaybackError(error) { globalThis.__auditPlayErrors ??= []; globalThis.__auditPlayErrors.push({name:error?.name,message:error?.message,code:error?.code});')}));
  const item={id:entry.id,questions:[],checks:[],errors:[],failedRequests:[]},check=(passed,name)=>item.checks.push({passed:Boolean(passed),name});
  page.on('pageerror',e=>item.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)item.failedRequests.push({status:r.status(),url:r.url()});});
  try{
   await page.goto(`http://127.0.0.1:${server.address().port}/digital-question-papers/digitalquestionpapers.html?paper=${entry.id}`,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
   for(const phase of phases){
    if(phase==='feedback'){await activate(page.locator('[data-submit-paper]:visible').first());await activate(page.locator('[data-confirm-submit]'));await page.locator('[data-screen=results]').waitFor();}
    for(let qi=0;qi<paper.questions.length;qi++){
     if(qi)await activate(page.locator('[data-next-question]'));
     const q=paper.questions[qi],record={phase,id:q.id,markers:[]};item.questions.push(record);
     const player=page.locator('.exam-header-audio [data-audio-player]'),media=player.locator('audio');
     await page.waitForFunction(()=>{const a=document.querySelector('.exam-header-audio audio');return a&&Number.isFinite(a.duration)&&a.duration>0;});
     check(await media.evaluate(a=>a.paused),`${phase}/${q.id}: fresh player is paused`);
     const clips=q.audio.clips;check(clips.length===1,`${phase}/${q.id}: single active-question clip inventory`);
     const markers=clips[0].markers||[],buttons=player.locator('[data-marker-time]');check(await buttons.count()===markers.length,`${phase}/${q.id}: every source marker is present`);
     if(touch){const toggle=player.locator('[data-audio-action=toggle]');await activate(toggle);await page.waitForFunction(()=>{const a=document.querySelector('.exam-header-audio audio');return !a.paused&&a.readyState>=3&&a.currentTime>.02;});await activate(toggle);await page.waitForFunction(()=>document.querySelector('.exam-header-audio audio').paused);}else await player.locator('[data-audio-action=toggle]').focus();
     check(!markers.length||await buttons.first().evaluate(n=>getComputedStyle(n.parentElement).visibility==='visible'),`${phase}/${q.id}: keyboard focus reveals markers`);
     for(let mi=0;mi<markers.length;mi++){
      if(selectedMarkers&&!selectedMarkers.has([entry.id,q.id,mi].join('/')))continue;
      const expected=markers[mi],button=buttons.nth(mi);record.markers.push({label:expected.label,time:expected.time});
      check(await button.getAttribute('aria-label')===`Go to part ${expected.label}`,`${phase}/${q.id}/${expected.label}: accessible marker name`);
      check(Math.abs(Number(await button.getAttribute('data-marker-time'))-expected.time)<.001,`${phase}/${q.id}/${expected.label}: source marker time`);
      for(const route of (touch?['touch']:['pointer','keyboard'])){
       const progress=player.locator('[data-progress]');if(!touch){await progress.focus();await progress.press('Home');}
       if(route!=='keyboard')await activate(button);else{await button.focus();await button.press('Enter');}
       await page.waitForTimeout(180);
       const state=await player.evaluate(n=>{const a=n.querySelector('audio');return{time:a.currentTime,duration:a.duration,paused:a.paused,progress:Number(n.querySelector('[data-progress]').value),error:a.error?.message};});
       check(!state.error&&Math.abs(state.time-expected.time)<.4&&state.paused&&Math.abs(state.progress-Math.round(expected.time/state.duration*1000))<=1,`${phase}/${q.id}/${expected.label}: ${route} seeks to cue and updates progress while paused`);
       record.markers.at(-1)[route]=state;
      }
      if(selectionPlayback){
       const toggle=player.locator('[data-audio-action=toggle]');await activate(toggle);
       await page.waitForFunction(time=>{const a=document.querySelector('.exam-header-audio audio');return a&&!a.paused&&a.readyState>=3&&a.currentTime>time+.03;},expected.time);
       await activate(toggle);const actual=await media.evaluate(a=>({paused:a.paused,time:a.currentTime,error:a.error?.message}));
       check(actual.paused&&!actual.error&&actual.time>=expected.time&&actual.time<expected.time+3,`${phase}/${q.id}/${expected.label}: corrected cue starts decoded playback and pauses`);
      }
     }
     if(touch){await activate(page.locator('[data-exam-menu-trigger=questions]'));await activate(page.locator('[data-exam-menu-trigger=questions]'));check(await player.evaluate(n=>!n.classList.contains('is-markers-expanded')&&getComputedStyle(n.querySelector('.audio-markers')).visibility==='hidden'),`${phase}/${q.id}: tapping outside closes markers`);}
     else {const progress=player.locator('[data-progress]');await progress.focus();await progress.press('Home');await progress.press('ArrowRight');
     check(await player.evaluate(n=>{const a=n.querySelector('audio'),v=Number(n.querySelector('[data-progress]').value);return v>0&&Math.abs(a.currentTime-a.duration*v/1000)<.4&&a.paused;}),`${phase}/${q.id}: progress slider supports keyboard seeking`);}
     console.log(entry.id,phase,q.id,markers.length,'markers');
    }
   }
  }catch(e){item.errors.push(e.stack||e.message);item.playbackErrors=await page.evaluate(()=>globalThis.__auditPlayErrors||[]);}finally{await context.close();}
  if(selectedMarkers)result.selectionScope=`Registered question players and marker inventories opened in ${phases.join('/')}; only selected markers receive fresh ${touch?'touch':'pointer and keyboard'} seeking trials${selectionPlayback?' and Play/Pause trials':''}. Not listening or cue accuracy certification.`;
  result.papers.push(item);fs.writeFileSync(path.join(out,'audio-marker-controls.json'),JSON.stringify(result,null,2)+'\n');console.log(entry.id,JSON.stringify({failed:item.checks.filter(c=>!c.passed),errors:item.errors}));
 }}finally{await browser.close();server.close();}
 process.exitCode=result.papers.some(p=>p.errors.length||p.failedRequests.length||p.checks.some(c=>!c.passed))?1:0;
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
