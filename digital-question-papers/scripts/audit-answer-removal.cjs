'use strict';
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright'),registry=require('../paper-registry'),{server,root}=require('./audit-papers-browser.cjs');
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.env.AUDIT_BROWSER}),papers=[];
 try{for(const entry of Object.values(registry).filter(e=>!process.env.AUDIT_PAPER||process.env.AUDIT_PAPER.split(',').includes(e.id))){
  const touch=process.env.AUDIT_REMOVAL_ROUTE==='doubletap',context=await browser.newContext({viewport:{width:touch?768:1440,height:1100},hasTouch:touch,reducedMotion:'reduce'}),page=await context.newPage(),paper=require(path.join(root,'digital-question-papers',entry.dataFile.split('?')[0])),item={id:entry.id,route:touch?'doubletap':'keyboard',questions:[],errors:[]};page.setDefaultTimeout(5000);page.on('pageerror',e=>item.errors.push(e.message));
  const remove=async field=>{if(touch){await field.evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));await field.tap();await field.tap();}else{await field.focus();await field.press('Shift+Backspace');}};
  try{await page.goto(`http://127.0.0.1:${server.address().port}/digital-question-papers/digitalquestionpapers.html?paper=${entry.id}`);
   for(const q of paper.questions.filter(q=>!process.env.AUDIT_QUESTION||process.env.AUDIT_QUESTION.split(',').includes(q.id))){await page.locator('[data-exam-menu-trigger="questions"]').click();await page.locator(`[data-go-question="${q.id}"]`).click();await page.evaluate(()=>document.fonts.ready);const record={id:q.id,checks:[]},check=(passed,name)=>record.checks.push({passed:Boolean(passed),name});
    const fields=page.locator('.question-card input[type="text"],.question-card textarea,.question-card [contenteditable="true"]');
    for(let i=0;i<await fields.count();i++){const field=fields.nth(i);if(!await field.isVisible()||!await field.isEditable())continue;await field.fill('Audit answer stays');await remove(field);const value=await field.evaluate(n=>'value'in n?n.value:n.textContent);check(!value.trim(),`text field ${i+1}: ${touch?'double-tap':'Mac Shift+Delete'} clears the complete answer`);}
    for(const part of q.subquestions.filter(s=>['radio','checkbox'].includes(s.type))){const input=page.locator(`[data-subquestion="${part.id}"] input`).first();await input.check();await remove(touch?input.locator('xpath=ancestor::label'):input);check(!await input.isChecked(),`${part.id}: ${touch?'double-tap':'Mac Shift+Delete'} removes a selected tick`);}
    const comparison=page.locator('.question-card input[data-comparison-column]');for(let i=0;i<await comparison.count();i++){const input=comparison.nth(i);await input.check();await remove(touch?input.locator('xpath=ancestor::label'):input);check(!await input.isChecked(),`comparison cell ${i+1}: ${touch?'double-tap':'Mac Shift+Delete'} removes the selected tick`);}
    item.questions.push(record);
   }
  }catch(e){item.errors.push(e.stack||e.message);}finally{await context.close();}
  papers.push(item);const out=path.resolve(process.env.AUDIT_RESULTS_FILE||path.join(root,'digital-question-papers/audit/2026-11-05/answer-removal.json'));fs.writeFileSync(out,JSON.stringify({papers},null,2)+'\n');console.log(item.id,JSON.stringify({checks:item.questions.reduce((n,q)=>n+q.checks.length,0),failed:item.questions.flatMap(q=>q.checks.filter(c=>!c.passed)),errors:item.errors}));
 }}finally{await browser.close();server.close();}process.exitCode=papers.some(p=>p.errors.length||p.questions.some(q=>q.checks.some(c=>!c.passed)))?1:0;
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
