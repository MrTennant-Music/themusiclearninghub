'use strict';
// Every offered Higher/AH letter, bracket, octave/return sign and repeat target.
// Expected values are explicit interaction serialisations; musical acceptance is
// checked against the independently reviewed source answers and alternatives.
const fs=require('node:fs'),path=require('node:path'),{chromium,webkit}=require('playwright');
const {server,root}=require('./audit-papers-browser.cjs'),registry=require('../paper-registry'),marking=require('../exam-marking');
const plans={
 'advanced-higher-2017/q4d':{selector:'.q3-bar-label-hit-area',preview:'.q3-bar-label-preview',value:label=>'bar-'+label.match(/bar (\d+)/)[1]},
 'advanced-higher-2017/q5d':{selector:'[role="button"][aria-label^="Place bracket above bars"]',value:label=>'bars-'+label.match(/bars (\d+) and (\d+)/).slice(1).join('-')},
 'advanced-higher-2018/q2aii':{selector:'[role="button"][aria-label^="Place bracket above bars"]',value:label=>'bars-'+label.match(/bars (\d+) and (\d+)/).slice(1).join('-')},
 'advanced-higher-2018/q2d':{selector:'[role="button"][aria-label^="Place A above note"]',value:label=>Number(label.match(/note (\d+)/)[1])===3?'bar-16-fsharp':'bar-16-note-'+label.match(/note (\d+)/)[1]},
 'advanced-higher-2022/q4bii':{selector:'[role="button"][aria-label^="Place selected sign"]',value:(_,tool)=>'bar-4-'+tool},
 'advanced-higher-2023/q2bi':{selector:'.q3-repeat-hit-area',preview:'.q3-repeat-preview',repeat:true,pair:true,value:label=>label.match(/(start|end) repeat.*bar (\d+)/).slice(1).join('-bar-')},
 'advanced-higher-2023/q2bii':{selector:'.q3-bar-label-hit-area',preview:'.q3-bar-label-preview',value:label=>'bar-'+label.match(/bar (\d+)/)[1]+'-bracket'},
 'advanced-higher-2024/q2aii':{selector:'.q3-bar-label-hit-area',preview:'.q3-bar-label-preview',value:label=>'bar-'+label.match(/bar (\d+)/)[1]+'-M'},
 'advanced-higher-2026/q2aii':{selector:'.q3-repeat-hit-area',preview:'.q3-repeat-preview',repeat:true,value:label=>label.match(/(start|end) repeat.*bar (\d+)/).slice(1).join('-bar-')},
 'higher-2024/q4f':{selector:'.q3-bar-label-hit-area',preview:'.q3-bar-label-preview',value:label=>'bar-'+label.match(/bar (\d+)/)[1]}
};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const engine=process.env.AUDIT_ENGINE||'chromium',browser=await (engine==='webkit'?webkit:chromium).launch({headless:true,...(engine!=='webkit'&&process.env.AUDIT_BROWSER?{executablePath:process.env.AUDIT_BROWSER}:{})});
 const output=path.resolve(process.env.AUDIT_RESULTS_FILE||`digital-question-papers/audit/2026-11-05/${engine==='webkit'?'webkit-':''}symbol-placement-alternatives.json`),result={engine,touchWidth:process.env.AUDIT_ROUTE==='touch'?Number(process.env.AUDIT_TOUCH_WIDTH||390):undefined,browserVersion:browser.version(),scope:'Every offered target and tool choice for the ten listed Higher/AH bar-label/repeat parts. The route is recorded for every placement; touch uses native taps, WebKit fitted-viewport conversion and a real target hit check. Two-sign repeats retain the other source-correct sign. Not every other tool or physical device.',parts:[]};
 try{for(const [key,plan]of Object.entries(plans)){
  const [id,partId]=key.split('/');if(process.env.AUDIT_PAPER&&!process.env.AUDIT_PAPER.split(',').includes(id))continue;if(process.env.AUDIT_PART&&!process.env.AUDIT_PART.split(',').includes(partId))continue;
  const entry=registry[id],paper=require(path.join(root,'digital-question-papers',entry.dataFile.split('?')[0])),question=paper.questions.find(q=>q.subquestions.some(p=>p.id===partId)),part=question.subquestions.find(p=>p.id===partId),item={paper:id,part:partId,targets:[],checks:[],errors:[]},check=(passed,name)=>item.checks.push({passed:Boolean(passed),name});
  for(const route of (process.env.AUDIT_ROUTE||'keyboard,pointer').split(',')){
   const touch=route==='touch',context=await browser.newContext({viewport:touch?{width:Number(process.env.AUDIT_TOUCH_WIDTH||390),height:1024}:{width:1440,height:1100},hasTouch:touch,reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(1800);page.on('pageerror',e=>item.errors.push(e.message));
   try{
    await page.goto(`http://127.0.0.1:${server.address().port}/digital-question-papers/digitalquestionpapers.html?paper=${id}`);await page.evaluate(()=>document.fonts.ready);await page.locator('[data-exam-menu-trigger="questions"]').click();await page.locator(`[data-go-question="${question.id}"]`).click();
    const section=page.locator(`[data-subquestion="${partId}"]`),buttons=section.locator('.notation-tool-button'),choices=await buttons.evaluateAll(ns=>ns.map(n=>n.dataset.value)),value=()=>page.evaluate(({id,partId})=>ExamStorage.loadDraft(id).answers[partId],{id,partId}),tap=async locator=>{await locator.evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));if(engine!=='webkit')return locator.tap();const point=await locator.evaluate(n=>{const r=n.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,v=visualViewport;if(!n.contains(document.elementFromPoint(x,y)))throw new Error('Visible placement target obstructed: '+n.getAttribute('aria-label')+' by '+document.elementFromPoint(x,y)?.outerHTML.slice(0,200));return{x:(x-v.offsetLeft)*v.scale,y:(y-v.offsetTop)*v.scale};});return page.touchscreen.tap(point.x,point.y);},act=async locator=>{if(route==='keyboard'){await locator.focus();await locator.press('Enter');}else if(touch)await tap(locator);else await locator.click();};
    const targets=await page.locator('svg '+plan.selector).evaluateAll(ns=>ns.map(n=>({label:n.getAttribute('aria-label'),svg:[...document.querySelectorAll('svg')].indexOf(n.ownerSVGElement),selector:['class','x','y','width','height'].map(a=>`[${a}="${n.getAttribute(a)}"]`).join(''),match:[...n.ownerSVGElement.querySelectorAll('[role="button"]')].filter(t=>['class','x','y','width','height'].every(a=>t.getAttribute(a)===n.getAttribute(a))).indexOf(n)})));
    check(targets.length>0,route+': offers placement targets');
    for(const toolValue of choices)for(const [index,geometry]of targets.entries()){
     if(route==='keyboard')await page.mouse.move(0,0);
     const name=`${route} ${toolValue} target ${index+1}`; // Data values remain stable through redraws.
     const button=section.locator(`.notation-tool-button[data-value=${JSON.stringify(toolValue)}]`),target=page.locator('svg').nth(geometry.svg).locator(`[role="button"]${geometry.selector}`).nth(geometry.match),token=plan.value(geometry.label,toolValue);
     try{
      if(plan.pair){const other=token.startsWith('start')?'end-bar-25':'start-bar-10';await act(button);await act(page.locator(`[aria-label="Place ${other.split('-')[0]} repeat at bar ${other.split('-')[2]}"]`));}
      await act(button);await target.evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));
      if(route==='keyboard')await target.focus();else if(!touch)await target.hover();
      if(plan.preview&&!touch){const preview=page.locator(plan.preview);check(await preview.count()===1,name+': exactly one faint preview');if(await preview.count())check(await preview.first().evaluate(n=>Number(n.getAttribute('opacity')||getComputedStyle(n).opacity)>0&&Number(n.getAttribute('opacity')||getComputedStyle(n).opacity)<1),name+': subdued preview');
       if(route==='keyboard')await button.focus();else await page.locator('[data-question-heading]').hover();check(await preview.count()===0,name+': leaving target removes preview');if(route==='keyboard')await target.focus();else if(!touch)await target.hover();
      }
      await act(target);const entered=await value(),expected=plan.pair?[token,token.startsWith('start')?'end-bar-25':'start-bar-10'].sort((a,b)=>a.startsWith('start')?-1:b.startsWith('start')?1:0).join(','):token;
      check(entered===expected,name+': exact placement stored');
      const accepted=[part.answer,...(part.acceptedAnswers||[])].includes(expected),marks=marking.markSubquestion(part,entered).marks;
      check(marks===(accepted?part.marks:0),name+': source-reviewed correct/wrong position marked');
      check(await button.getAttribute('aria-pressed')==='false',name+': one-use tool disarms');
      item.targets.push({route,tool:toolValue,label:geometry.label,value:entered,expected,marks});
      if(touch){await tap(button);await tap(button);}else{await button.focus();await button.press('Shift+Delete');}check(!await value(),name+(touch?': double-tap removal clears answer':': rapid keyboard removal clears answer'));
     }catch(e){item.errors.push(name+': '+e.message);await button.focus();await button.press('Shift+Delete');}
    }
   }catch(e){item.errors.push(route+': '+e.stack);}finally{await context.close();}
  }
  result.parts.push(item);fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(id,partId,JSON.stringify({placements:item.targets.length,failed:item.checks.filter(c=>!c.passed),errors:item.errors}));
 }}finally{await browser.close();server.close();}
 process.exitCode=result.parts.some(p=>p.errors.length||p.checks.some(c=>!c.passed))?1:0;
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
