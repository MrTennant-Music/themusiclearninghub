'use strict';
// The source audit establishes the anchor pitch. This pass independently checks
// staff-step spacing and every offered keyboard pitch/slot against real dragging.
const fs=require('node:fs'),path=require('node:path'),{chromium,webkit}=require('playwright');
const {server,root}=require('./audit-papers-browser.cjs'),{definitions,canonical,chroma}=require('./audit-normal-note-removal.cjs');
const auditDir=path.join(root,'digital-question-papers/audit/2026-11-05');
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const engine=process.env.AUDIT_ENGINE||'chromium',browser=await(engine==='webkit'?webkit:chromium).launch({headless:true,...(engine!=='webkit'?{executablePath:process.env.AUDIT_BROWSER}:{})});
 const result={engine,accidentalSweep:Boolean(process.env.AUDIT_ACCIDENTAL_SWEEP),browserVersion:browser.version(),scope:process.env.AUDIT_ACCIDENTAL_SWEEP?'All natural/flat/sharp palettes, offered pitches and slots in normal accidental-entry parts: keyboard commit, neighbour preservation, source-anchored geometry, replacement dragging and Clear. Desktop emulation; native-touch ranges and physical accessibility remain separate.':'Every offered keyboard pitch in every normal note-entry slot: source-anchored staff-step preview geometry, keyboard commit, real mouse drag from another pitch, dragging preview and exact storage. Desktop emulation; native touch/physical accessibility and all accidental-palette combinations remain separate.',parts:[]},out=process.env.AUDIT_RESULTS_FILE||path.join(auditDir,`${engine==='webkit'?'webkit-':''}note-pitch-ranges.json`);
 try{for(const c of definitions().filter(c=>(!process.env.AUDIT_PAPER||process.env.AUDIT_PAPER.split(',').includes(c.paper))&&(!process.env.AUDIT_PART||process.env.AUDIT_PART.split(',').includes(c.part))&&(!process.env.AUDIT_ACCIDENTAL_SWEEP||c.accidentals))){
  const item={paper:c.paper,part:c.part,slots:c.pitches.length,trials:[],checks:[],errors:[]},check=(passed,name)=>item.checks.push({passed:Boolean(passed),name});
  const context=await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(4000);page.on('pageerror',e=>item.errors.push(e.message));
  try{
   await page.goto(`http://127.0.0.1:${server.address().port}/digital-question-papers/digitalquestionpapers.html?paper=${c.paper}`);await page.evaluate(()=>document.fonts.ready);await page.locator('[data-exam-menu-trigger="questions"]').click();await page.locator(`[data-go-question="${c.question}"]`).click();
   const svg=()=>page.locator(c.host).first(),target=()=>svg().locator(c.target).nth(c.index),value=()=>page.evaluate(({paper,part})=>ExamStorage.loadDraft(paper).answers[part],c),cursor=async()=>{const m=(await target().getAttribute('aria-label')).match(/Note (\d+): ([A-G][#♯b♭♮]?\d+)/);return{slot:Number(m[1])-1,pitch:m[2]};};
   const geometry=()=>svg().locator('.q3-note-preview text.q3-complete-note,.q3-note-preview text.q3-notehead').first().evaluate(n=>{const p=n.ownerSVGElement.createSVGPoint();p.x=Number(n.getAttribute('x'));p.y=Number(n.getAttribute('y'));const screen=p.matrixTransform(n.getScreenCTM()),ys=[...new Set([...n.ownerSVGElement.querySelectorAll('.q3-staff-line')].map(n=>Number(n.getAttribute('y1'))))].sort((a,b)=>a-b),gaps=ys.slice(1).map((v,i)=>v-ys[i]).filter(v=>v>1&&v<30),gap=Math.min(...gaps);return{x:screen.x,y:screen.y,localX:p.x,localY:p.y,gap,scaleY:n.getScreenCTM().d};});
   const preview=async()=>{const before=await cursor();await target().press('ArrowUp');if((await cursor()).pitch!==before.pitch)await target().press('ArrowDown');};
   const focus=async()=>{await target().evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));await target().focus();};
   const moveTo=async(slot,pitch)=>{await focus();let v=await cursor();for(let i=0;v.slot!==slot&&i<20;i++){await target().press(v.slot<slot?'ArrowRight':'ArrowLeft');v=await cursor();}for(let i=0;chroma(v.pitch)!==chroma(pitch)&&i<40;i++){await target().press(chroma(v.pitch)<chroma(pitch)?'ArrowUp':'ArrowDown');v=await cursor();}if(chroma(v.pitch)!==chroma(pitch))throw new Error('Cannot reach source anchor '+pitch);await preview();};
   for(const accidental of process.env.AUDIT_ACCIDENTAL_SWEEP?['natural','flat','sharp']:[null]){
   if(accidental){const button=page.locator(`[data-subquestion="${c.part}"] .notation-tool-accidental[data-value="${accidental}"]`);await button.focus();await button.press('Enter');}
   if(c.rest){const rest=svg().getByRole('button',{name:'Place crotchet rest in bar 12',exact:true});await rest.focus();await rest.press('Enter');}
   await moveTo(0,c.pitches[0]);let previous='';for(let n=0;n<40;n++){const v=await cursor();if(v.pitch===previous)break;previous=v.pitch;await target().press('ArrowDown');}
   const offered=[];for(let n=0;n<40;n++){const v=await cursor();offered.push(v.pitch);await target().press('ArrowUp');if((await cursor()).pitch===v.pitch)break;}item.offeredPitches=offered;
   for(let slot=0;slot<c.pitches.length;slot++){
    await moveTo(slot,c.pitches[slot]);const anchor=await geometry();
    for(const pitch of offered.filter(p=>!process.env.AUDIT_PITCHES||process.env.AUDIT_PITCHES.split(',').includes(p))){
     await moveTo(slot,pitch);const selected=await cursor(),expectedPitch=accidental?selected.pitch.replace(/^([A-G])[#♯b♭♮]?/, '$1'+(accidental==='flat'?'b':accidental==='sharp'?'#':'')):selected.pitch,g=await geometry(),label=`slot ${slot+1} ${selected.pitch}`;check(Math.abs(g.localY-(anchor.localY-(chroma(selected.pitch)-chroma(c.pitches[slot]))*anchor.gap/2))<0.05,label+': preview follows independent staff-step spacing');
     const beforeKeyboard=canonical(await value()).split(',');await target().press('Enter');const afterKeyboard=canonical(await value()).split(',');if(accidental)check(beforeKeyboard.every((v,i)=>i===slot+(c.rest?1:0)||(v||'_')===(afterKeyboard[i]||'_')),label+': changing one accidental preserves every other entered note');let stored=canonical(await value()).split(',')[slot+(c.rest?1:0)];check(stored===canonical(expectedPitch),label+': keyboard commits the selected pitch');
     // Replace it with another pitch first, so a failed drag cannot pass by
     // leaving the preceding keyboard answer unchanged.
     const other=offered[Math.abs(offered.indexOf(pitch)-Math.floor(offered.length/2))>2?Math.floor(offered.length/2):0];
     await moveTo(slot,other);const otherGeometry=await geometry();await target().press('Enter');await focus();
     const mapped=await svg().evaluate((n,points)=>points.map(({localX,localY})=>{const p=n.createSVGPoint();p.x=localX;p.y=localY;const q=p.matrixTransform(n.getScreenCTM());return{x:q.x,y:q.y};}),[g,otherGeometry]);g.x=mapped[0].x;g.y=mapped[0].y;
     const rect=await target().boundingBox(),startY=mapped[1].y;
     const hits=await page.evaluate(({x,y,startY})=>({start:document.elementFromPoint(x,startY)?.outerHTML.slice(0,500),end:document.elementFromPoint(x,y)?.outerHTML.slice(0,500)}),{x:g.x,y:g.y,startY});await page.mouse.move(g.x,startY);await page.mouse.down();await page.mouse.move(g.x,g.y,{steps:3});check(await svg().locator('.q3-note-preview.is-dragging').count(),label+': grey dragging preview is visible');await page.mouse.up();stored=canonical(await value()).split(',')[slot+(c.rest?1:0)];check(stored===canonical(expectedPitch),label+': dragging replaces another pitch with the selected pitch');
     item.trials.push({slot,pitch:selected.pitch,expectedPitch,accidental,previewLocalY:g.localY,anchorLocalY:anchor.localY,gap:anchor.gap,stored,hits,startY,rect});
    }
   }
   await page.locator(`[data-subquestion="${c.part}"] .notation-clear-button`).click();check(!await value(),'Clear resets the swept pitch field');
   }
  }catch(e){item.errors.push(e.stack);}finally{await context.close();}
  result.parts.push(item);fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(c.paper,c.part,JSON.stringify({trials:item.trials.length,failed:item.checks.filter(c=>!c.passed),errors:item.errors}));
 }}finally{await browser.close();server.close();}process.exitCode=result.parts.some(p=>p.errors.length||p.checks.some(c=>!c.passed))?1:0;
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
