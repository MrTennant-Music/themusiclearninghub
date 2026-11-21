'use strict';
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const registry=require('../paper-registry'),{server,root}=require('./audit-papers-browser.cjs');
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.env.AUDIT_BROWSER});const papers=[];
 try{for(const entry of Object.values(registry).filter(e=>!process.env.AUDIT_PAPER||process.env.AUDIT_PAPER.split(',').includes(e.id))){
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(8000);const item={id:entry.id,checks:[],dialogs:[],errors:[]};const check=(passed,name)=>item.checks.push({passed:Boolean(passed),name});page.on('pageerror',e=>item.errors.push(e.message));
  try{
   await page.goto(`http://127.0.0.1:${server.address().port}/digital-question-papers/digitalquestionpapers.html?paper=${entry.id}`);await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
   const menu=async name=>{const trigger=page.locator(`[data-exam-menu-trigger="${name}"]`);await trigger.focus();await trigger.press('Enter');};
   for(const name of ['questions','customise']){
    await menu(name);await page.keyboard.press('Tab');check(await page.evaluate(name=>Boolean(document.activeElement?.closest(`[data-exam-menu="${name}"]`)),name),`${name} menu options are reached by Tab`);
    await page.keyboard.press('Escape');check(await page.locator(`[data-exam-menu="${name}"]`).isHidden(),`${name} menu closes with Escape`);
    check(await page.evaluate(name=>document.activeElement?.dataset.examMenuTrigger===name,name),`${name} menu Escape restores trigger focus`);
   }
   const dialog=async(selector,name,returnSelector=null)=>{
    await page.locator(selector+'.is-open').waitFor();await page.waitForFunction(s=>Boolean(document.activeElement?.closest(s)),selector);
    check(await page.evaluate(s=>Boolean(document.activeElement?.closest(s)),selector),`${name} initial focus is inside`);
    for(let n=0;n<12;n++)await page.keyboard.press('Tab');for(let n=0;n<4;n++)await page.keyboard.press('Shift+Tab');
    check(await page.evaluate(s=>Boolean(document.activeElement?.closest(s)),selector),`${name} Tab and Shift+Tab remain inside`);
    check(await page.evaluate(()=>document.querySelector('main').inert),`${name} background is inert`);
    item.dialogs.push({name,...await page.locator(selector).evaluate(async node=>{const r=await axe.run(node,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return{violations:r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,html:n.html}))})),incomplete:r.incomplete.map(v=>v.id)};})});
    await page.keyboard.press('Escape');await page.waitForFunction(s=>!document.querySelector(s).classList.contains('is-open'),selector);
    if(returnSelector)check(await page.locator(returnSelector+'.is-open').isVisible(),`${name} Cancel returns to the prior dialog`);
    else check(await page.evaluate(()=>!document.querySelector('main').inert),`${name} restores background access`);
   };
   const qr=page.locator('[data-open-qr]');await qr.focus();await qr.press('Enter');await dialog('[data-qr-overlay]','QR');check(await qr.evaluate(node=>node===document.activeElement),'QR restores opener focus');
   await menu('customise');await page.locator('[data-mode-option="exam"]').focus();await page.keyboard.press('Enter');await dialog('[data-start-overlay]','Exam information');
   const text=page.locator('.question-card input[type="text"]:visible').first(),choice=page.locator('.question-card input[type="radio"],.question-card input[type="checkbox"]').first();
   if(await text.count())await text.fill('Audit answer');else await choice.check();
   const before=await page.evaluate(id=>JSON.stringify(ExamStorage.loadDraft(id).answers),entry.id);
   const checkAnswers=page.locator('[data-check-question]');await checkAnswers.focus();await checkAnswers.press('Enter');await dialog('[data-check-question-overlay]','Check Answers');
   await menu('customise');await page.locator('[data-mode-option="exam"]').focus();await page.keyboard.press('Enter');await page.locator('[data-start-attempt]').click();await dialog('[data-mode-warning-overlay]','Mode change','[data-start-overlay]');await dialog('[data-start-overlay]','Returned Exam information');
   await menu('customise');await page.locator('[data-reset-paper]').focus();await page.keyboard.press('Enter');await dialog('[data-reset-overlay]','Restart');
   check(before===await page.evaluate(id=>JSON.stringify(ExamStorage.loadDraft(id).answers),entry.id),'all cancelled dialogs preserve pupil answers');
  }catch(e){item.errors.push(e.stack||String(e));}
  papers.push(item);console.log(entry.id,JSON.stringify({checks:item.checks.length,failed:item.checks.filter(c=>!c.passed),violations:item.dialogs.reduce((n,d)=>n+d.violations.length,0),errors:item.errors}));await context.close();
 }}finally{await browser.close();server.close();}
 const out=path.resolve(process.env.AUDIT_RESULTS_FILE||'digital-question-papers/audit/2026-11-05/keyboard-dialogs.json');fs.writeFileSync(out,JSON.stringify({papers},null,2)+'\n');process.exitCode=papers.some(p=>p.errors.length||p.checks.some(c=>!c.passed)||p.dialogs.some(d=>d.violations.length))?1:0;
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
