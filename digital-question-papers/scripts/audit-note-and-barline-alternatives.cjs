'use strict';
const fs=require('node:fs'),path=require('node:path'),{chromium,webkit}=require('playwright');
const {server,root}=require('./audit-papers-browser.cjs'),registry=require('../paper-registry'),marking=require('../exam-marking');
const number=(label,pattern)=>Number(label.match(pattern)[1]);
const plans={
 'advanced-higher-2025/q4c':{selector:'[data-source-note-selection="q4c"]',value:label=>label.includes('source bass')?'source-bass-note-'+number(label,/bass note (\d+)/):(()=>{const n=number(label,/note (\d+)/),bar=number(label,/bar (\d+)/);return bar===12&&n===2?'bar-12-bb':`bar-${bar}-note-${n}`;})()},
 'advanced-higher-2025/q4d':{selector:'.q3-barline-hit-area',multiple:true,value:label=>'after-bar-'+number(label,/bar (\d+)/)},
 'higher-2015/q4e':{selector:'[aria-label^="Place bar line between notes"]',multiple:true,value:label=>{const n=number(label,/notes (\d+)/);return n===16?'line5-15':'line5-gap-'+n;}},
 'higher-2018/q3a':{selector:'[aria-label^="Place bar line in line 2 gap"]',multiple:true,value:label=>'line2-gap-'+number(label,/gap (\d+)/)},
 'higher-2022/q4d':{selector:'[aria-label^="Select note"][aria-label$="as the tonic"]',value:label=>{const n=number(label,/note (\d+)/);return n===3?'F5':'bar-8-note-'+(n-1);}},
 'higher-2024/q4c':{selector:'[aria-label^="Circle note"][aria-label$="for the dominant answer"]',value:label=>{const n=number(label,/note (\d+)/),bar=number(label,/bar (\d+)/);return bar===10&&n===3?'bar-10-c':bar===10&&n===4?'bar-10-c-second':`bar-${bar}-note-${n-1}`;}},
 'higher-2025/q4a':{selector:'[aria-label^="Select note"][aria-label$="for the subdominant answer"]',value:label=>{const n=number(label,/note (\d+)/);return n===2?'bar-3-c':'bar-3-note-'+n;}},
 'higher-2025/q4e':{selector:'[aria-label^="Place the missing bar line after note"]',value:label=>{const n=number(label,/note (\d+)/);return n===5?'after-bar-21':'higher-2025-line6-gap-'+n;}}
};
const tokens=value=>String(value||'').split(',').filter(Boolean).sort();
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const engine=process.env.AUDIT_ENGINE||'chromium',browser=await(engine==='webkit'?webkit:chromium).launch({headless:true,...(engine!=='webkit'?{executablePath:process.env.AUDIT_BROWSER}:{})});
 const output=path.resolve(process.env.AUDIT_RESULTS_FILE||`digital-question-papers/audit/2026-11-05/${engine==='webkit'?'webkit-':''}note-and-barline-alternatives.json`),result={engine,browserVersion:browser.version(),scope:'Every offered circle-note and barline position in all eight parts. Correct source barlines are placed first; an extra wrong line must invalidate the answer. Routes record keyboard/pointer/native phone/tablet entry and removal; not physical-device certification.',parts:[]};
 try{for(const[key,plan]of Object.entries(plans)){
  const[id,partId]=key.split('/');if(process.env.AUDIT_PAPER&&!process.env.AUDIT_PAPER.split(',').includes(id))continue;if(process.env.AUDIT_PART&&!process.env.AUDIT_PART.split(',').includes(partId))continue;
  const paper=require(path.join(root,'digital-question-papers',registry[id].dataFile.split('?')[0])),q=paper.questions.find(q=>q.subquestions.some(s=>s.id===partId)),part=q.subquestions.find(s=>s.id===partId),item={paper:id,part:partId,positions:[],checks:[],errors:[]},check=(passed,name)=>item.checks.push({passed:Boolean(passed),name});
  for(const route of(process.env.AUDIT_ROUTE||'keyboard,pointer,touch-phone,touch-ipad').split(',')){
   const touch=route.startsWith('touch'),context=await browser.newContext({viewport:touch?{width:route.endsWith('ipad')?768:390,height:1024}:{width:1440,height:1100},hasTouch:touch,reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(2500);page.on('pageerror',e=>item.errors.push(e.message));
   try{
    await page.goto(`http://127.0.0.1:${server.address().port}/digital-question-papers/digitalquestionpapers.html?paper=${id}`);await page.evaluate(()=>document.fonts.ready);await page.locator('[data-exam-menu-trigger="questions"]').click();await page.locator(`[data-go-question="${q.id}"]`).click();
    const value=()=>page.evaluate(({id,partId})=>ExamStorage.loadDraft(id).answers[partId],{id,partId});
    const descriptors=await page.locator('svg '+plan.selector).evaluateAll(ns=>ns.map(n=>({label:n.getAttribute('aria-label'),svg:[...document.querySelectorAll('svg')].indexOf(n.ownerSVGElement),selector:['class','x','y','width','height'].map(a=>`[${a}="${n.getAttribute(a)}"]`).join('')})));
    const target=d=>page.locator('svg').nth(d.svg).locator(`[role="button"]${d.selector}`).first();
    const tap=async loc=>{await loc.evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));if(engine!=='webkit')return loc.tap();const pt=await loc.evaluate(n=>{const r=n.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,v=visualViewport;if(!n.contains(document.elementFromPoint(x,y)))throw new Error('Actual note/barline target is obstructed: '+n.getAttribute('aria-label')+' by '+document.elementFromPoint(x,y)?.outerHTML.slice(0,220));return{x:(x-v.offsetLeft)*v.scale,y:(y-v.offsetTop)*v.scale};});return page.touchscreen.tap(pt.x,pt.y);};
    const act=async loc=>{if(route==='keyboard'){await loc.focus();return loc.press('Enter');}if(touch)return tap(loc);return loc.click();};
    const clear=async()=>{for(const d of descriptors){if(tokens(await value()).includes(plan.value(d.label))){await target(d).focus();await target(d).press('Shift+Delete');}}};
    check(descriptors.length>0,route+': offers source-position choices');
    if(id==='advanced-higher-2025'&&partId==='q4c')check(descriptors.length===75,route+': every printed melody/source-bass note is available, excluding missing notes');
    for(const d of descriptors){
     const token=plan.value(d.label),name=route+' '+d.label;
     try{
      await clear();const baseline=plan.multiple?tokens(part.answer).filter(t=>t!==token):[];
      for(const t of baseline){const source=descriptors.find(d=>plan.value(d.label)===t);if(!source)throw new Error('Missing reviewed source target '+t);await act(target(source));}
      await act(target(d));const entered=await value(),expected=plan.multiple?[...baseline,token].sort():[token];
      check(JSON.stringify(tokens(entered))===JSON.stringify(expected),name+': exact chosen position stored');
      const accepted=plan.multiple?JSON.stringify(expected)===JSON.stringify(tokens(part.answer)):[part.answer,...(part.acceptedAnswers||[])].includes(token);
      check(marking.markSubquestion(part,entered).marks===(accepted?part.marks:0),name+': source-reviewed correct/wrong position marking');
      item.positions.push({route,label:d.label,value:entered,expected,marks:marking.markSubquestion(part,entered).marks});
      const chosen=target(d);
      if(route==='keyboard'){await chosen.focus();await chosen.press('Shift+Delete');}else if(touch){await page.waitForTimeout(360);await tap(chosen);await tap(chosen);}else await chosen.click({button:'right'});
      check(JSON.stringify(tokens(await value()))===JSON.stringify(baseline),name+': removal preserves other entered source lines');
     }catch(e){item.errors.push(name+': '+e.message);await clear();}
    }
   }catch(e){item.errors.push(route+': '+e.stack);}finally{await context.close();}
  }
  result.parts.push(item);fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(id,partId,JSON.stringify({positions:item.positions.length,failed:item.checks.filter(c=>!c.passed),errors:item.errors}));
 }}finally{await browser.close();server.close();}
 process.exitCode=result.parts.some(p=>p.errors.length||p.checks.some(c=>!c.passed))?1:0;
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
