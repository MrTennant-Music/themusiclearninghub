'use strict';
// Every offered time signature, dynamic and tempo option, including wrong
// alternatives. Musical acceptance uses the independently reviewed paper data.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium,webkit}=require('playwright');
const {server,root}=require('./audit-papers-browser.cjs');
const registry=require('../paper-registry'),marking=require('../exam-marking');
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const engine=process.env.AUDIT_ENGINE||'chromium';
 const browser=await(engine==='webkit'?webkit:chromium).launch({headless:true,...(engine!=='webkit'?{executablePath:process.env.AUDIT_BROWSER}:{})});
 const output=path.resolve(process.env.AUDIT_RESULTS_FILE||`digital-question-papers/audit/2026-11-05/${engine==='webkit'?'webkit-':''}notation-direct-options.json`);
 const result={engine,browserVersion:browser.version(),scope:'Every offered time-signature/dynamic/tempo choice: real entry, exact storage, source-reviewed correct/wrong marking, neutral score change, selected semantics and keyboard/right-click/native double-tap removal. Touch is emulated, not a physical-device certification.',parts:[]};
 try{
  for(const entry of Object.values(registry)){
   if(process.env.AUDIT_PAPER&&!process.env.AUDIT_PAPER.split(',').includes(entry.id))continue;
   const paper=require(path.join(root,'digital-question-papers',entry.dataFile.split('?')[0]));
   for(const question of paper.questions)for(const part of question.subquestions.filter(s=>['time-signature','dynamic','tempo'].includes(s.notationTool))){
    const item={paper:entry.id,part:part.id,tool:part.notationTool,entries:[],checks:[],errors:[]};
    const check=(passed,name)=>item.checks.push({passed:Boolean(passed),name});
    for(const route of(process.env.AUDIT_ROUTE||'keyboard,pointer,touch-phone,touch-ipad').split(',')){
     const touch=route.startsWith('touch'),context=await browser.newContext({viewport:touch?{width:route.endsWith('ipad')?768:390,height:1024}:{width:1440,height:1100},hasTouch:touch,reducedMotion:'reduce'});
     const page=await context.newPage();page.setDefaultTimeout(3000);page.on('pageerror',e=>item.errors.push(e.message));
     try{
      await page.goto(`http://127.0.0.1:${server.address().port}/digital-question-papers/digitalquestionpapers.html?paper=${entry.id}`);
      await page.evaluate(()=>document.fonts.ready);
      await page.locator('[data-exam-menu-trigger="questions"]').click();await page.locator(`[data-go-question="${question.id}"]`).click();
      const section=page.locator(`[data-subquestion="${part.id}"]`);
      const saved=()=>page.evaluate(({id,part})=>ExamStorage.loadDraft(id).answers[part],{id:entry.id,part:part.id});
      const signature=async()=>crypto.createHash('sha256').update(await page.locator('.question-card').evaluate(n=>[...n.querySelectorAll('.shared-notation-panel svg')].map(s=>s.outerHTML).join('\n'))).digest('hex');
      const tap=async locator=>{
       await locator.evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
       if(engine!=='webkit')return locator.tap();
       const point=await locator.evaluate(n=>{const r=n.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,v=visualViewport;if(!n.contains(document.elementFromPoint(x,y)))throw new Error('Actual notation option is obstructed');return{x:(x-v.offsetLeft)*v.scale,y:(y-v.offsetTop)*v.scale};});
       return page.touchscreen.tap(point.x,point.y);
      };
      for(const option of part.options){
       const name=`${route} ${option.value}`,button=section.locator(`.notation-tool-button[data-value=${JSON.stringify(option.value)}]`),blank=await signature();
       if(route==='keyboard'){await button.focus();await button.press('Enter');}else if(touch)await tap(button);else await button.click();
       const value=await saved(),ink=await signature(),accepted=[part.answer,...(part.acceptedAnswers||[])].includes(option.value);
       item.entries.push({route,option:option.value,value,blankSignature:blank,enteredSignature:ink});
       check(value===option.value,name+': exact selected value stored');
       check(marking.markSubquestion(part,value).marks===(accepted?part.marks:0),name+': source-reviewed correct/wrong choice marking');
       check(ink!==blank,name+': score changes when the answer is entered');
       check(await button.getAttribute('aria-pressed')==='true',name+': selected option is announced');
       check(await page.locator('.question-card .q3-answer-correct,.question-card .q3-answer-incorrect').count()===0,name+': no pre-submission correctness colours');
       if(route==='keyboard'){await button.focus();await button.press('Shift+Delete');}else if(touch){await page.waitForTimeout(360);await tap(button);await tap(button);}else await button.click({button:'right'});
       check(!await saved(),name+': answer can be removed');
       check(await button.getAttribute('aria-pressed')==='false',name+': removal clears selected semantics');
      }
     }catch(e){item.errors.push(route+': '+(e.stack||e.message));}finally{await context.close();}
    }
    result.parts.push(item);fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
    console.log(item.paper,item.part,JSON.stringify({entries:item.entries.length,failed:item.checks.filter(c=>!c.passed),errors:item.errors}));
   }
  }
 }finally{await browser.close();server.close();}
 process.exitCode=result.parts.some(p=>p.errors.length||p.checks.some(c=>!c.passed))?1:0;
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
