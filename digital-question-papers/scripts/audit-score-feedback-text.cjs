'use strict';
// Geometric triage only: every flag needs actual visual/source inspection.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright'),registry=require('../paper-registry');
const {server,root}=require('./audit-papers-browser.cjs');
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.env.AUDIT_BROWSER}),papers=[];
try{for(const entry of Object.values(registry)){
 const paper=require(path.join(root,'digital-question-papers',entry.dataFile.split('?')[0])),context=await browser.newContext({viewport:{width:1440,height:1100}}),page=await context.newPage(),item={id:paper.id,flags:[],errors:[]};page.on('pageerror',e=>item.errors.push(e.message));
 try{
  await page.goto(`http://127.0.0.1:${server.address().port}/digital-question-papers/digitalquestionpapers.html?paper=${paper.id}`);
  await page.locator('[data-exam-menu-trigger="questions"]').click();await page.locator(`[data-go-question="${paper.questions.at(-1).id}"]`).click();
  await page.locator('[data-submit-paper]:visible').first().click();await page.locator('[data-confirm-submit]').click();await page.locator('[data-screen="results"]').waitFor();
  await page.locator('[data-exam-menu-trigger="questions"]').click();await page.locator('[data-show-all-questions]').click();await page.evaluate(()=>document.fonts.ready);
  Object.assign(item,await page.evaluate(()=>{
   const scores=[...document.querySelectorAll('[data-results-paper] svg.q3-shared-score')],flags=[];let labels=0,answers=0;
   for(const [index,svg]of scores.entries()){
    const printed=[...svg.querySelectorAll('text.q3-marking-box-label,text.q3-bar-number')],responses=[...svg.querySelectorAll('text.q3-entered-answer,text.q3-tempo-answer')];labels+=printed.length;answers+=responses.length;
    for(const label of printed)for(const response of responses){const a=label.getBoundingClientRect(),b=response.getBoundingClientRect(),w=Math.min(a.right,b.right)-Math.max(a.left,b.left),h=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);if(w>1&&h>1)flags.push({question:svg.closest('[data-result-question]').dataset.resultQuestion,score:index,printed:label.textContent,answer:response.textContent,overlap:{width:w,height:h},classes:response.getAttribute('class')});}
   }return{scores:scores.length,labels,answers,flags};
  }));
  for(const q of new Set(item.flags.map(f=>f.question))){const style=await page.addStyleTag({content:'.exam-header{visibility:hidden!important}'});try{await page.locator(`[data-result-question="${q}"] svg.q3-shared-score`).first().screenshot({path:path.join(root,`maintenance/generated/score-feedback-text-${paper.id}-${q}.png`)});}finally{await style.evaluate(n=>n.remove());}}
 }catch(error){item.errors.push(error.stack||error.message);}finally{await context.close();}
 papers.push(item);console.log(item.id,item.scores,item.flags.length,item.errors);fs.writeFileSync(path.join(root,'digital-question-papers/audit/2026-11-05/score-feedback-text.json'),JSON.stringify({scope:'Actual blank marked-score text against printed score captions and bar numbers in all thirty papers. This is collision triage, not every symbol or source-fidelity certification.',papers},null,2)+'\n');
}}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
