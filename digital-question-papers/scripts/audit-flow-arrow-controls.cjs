'use strict';
const fs=require('node:fs'),path=require('node:path'),{chromium,webkit}=require('playwright');
const {server,root}=require('./audit-papers-browser.cjs');
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const papers=[];
 try{for(const engine of ['chromium','webkit']){
  const browser=await (engine==='webkit'?webkit:chromium).launch({headless:true,...(engine==='chromium'?{executablePath:process.env.AUDIT_BROWSER}:{})});
  try{for(const year of [2024,2026]){
   const id=`advanced-higher-${year}`,context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),item={id,engine,checks:[],errors:[]};
   const check=(passed,name)=>item.checks.push({passed:Boolean(passed),name});page.on('pageerror',e=>item.errors.push(e.message));
   try{
    await page.goto(`http://127.0.0.1:${server.address().port}/digital-question-papers/digitalquestionpapers.html?paper=${id}`);
    await page.locator('[data-exam-menu-trigger="questions"]').click();await page.locator('[data-go-question="q5"]').click();
    const labels=page.locator('[data-subquestion="q5d"] .answer-option');
    check(await labels.count()===4,'four source instrument-order choices');
    for(let i=0;i<4;i++){
     const label=labels.nth(i),input=label.locator('input');
     await label.locator('.answer-option-flow-arrow svg').first().click();check(await input.isChecked(),`choice ${i+1}: SVG arrow activates its existing label`);
     await input.focus();await page.keyboard.press('Shift+Backspace');check(!await input.isChecked(),`choice ${i+1}: keyboard removal remains available`);
     await label.locator('.answer-option-flow-box').first().click();check(await input.isChecked(),`choice ${i+1}: instrument text selects`);
     await label.locator('.answer-option-flow-box').first().dblclick();check(!await input.isChecked(),`choice ${i+1}: double-click removal remains available`);
    }
    const style=await page.addStyleTag({content:'.exam-header{visibility:hidden!important}'});
    try{await page.locator('[data-subquestion="q5d"]').screenshot({path:path.join(root,`maintenance/generated/flow-arrows-${id}-${engine}.png`)});}finally{await style.evaluate(n=>n.remove());}
   }catch(error){item.errors.push(error.stack||error.message);}finally{await context.close();}
   papers.push(item);console.log(id,engine,item.checks.filter(c=>!c.passed),item.errors);
  }}finally{await browser.close();}
 }}finally{server.close();}
 fs.writeFileSync(path.join(root,'digital-question-papers/audit/2026-11-05/flow-arrow-controls.json'),JSON.stringify({scope:'Both source instrument-order questions, all choices, real SVG/text selection and keyboard/double-click removal in Chromium and WebKit.',papers},null,2)+'\n');
 process.exitCode=papers.some(p=>p.errors.length||p.checks.some(c=>!c.passed))?1:0;
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
