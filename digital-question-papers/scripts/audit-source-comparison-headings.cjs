'use strict';
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const {server,root}=require('./audit-papers-browser.cjs');
const fixture=require('../tests/fixtures/higher-source-comparison-headings.json');
const axePath=require.resolve('axe-core/axe.min.js');
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.env.AUDIT_BROWSER}),papers=[];
 try{for(const expected of fixture){
  const paper=require(path.join(root,'digital-question-papers/papers',expected.id+'.js')),question=paper.questions.find(q=>q.subquestions.some(s=>s.type==='comparison-grid'));
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),item={id:expected.id,checks:[],errors:[]};page.on('pageerror',e=>item.errors.push(e.message));
  const check=(passed,name)=>item.checks.push({passed:Boolean(passed),name});
  try{
   await page.goto(`http://127.0.0.1:${server.address().port}/digital-question-papers/digitalquestionpapers.html?paper=${expected.id}`);
   for(const mode of ['practice','feedback']){
    await page.locator('[data-exam-menu-trigger="questions"]').click();await page.locator(`[data-go-question="${question.id}"]`).click();
    const table=page.locator('.higher-comparison-grid:visible');
    const actual=await table.evaluate(t=>({columnC:t.tHead.rows[0].cells[4].textContent.replace('Column C','').trim(),weights:[...t.tHead.rows[0].cells].slice(2).map(n=>Number(getComputedStyle(n).fontWeight)),subweights:[...t.tHead.querySelectorAll('span')].map(n=>Number(getComputedStyle(n).fontWeight)),backgrounds:[...t.querySelectorAll('.comparison-column-a,.comparison-column-b,thead th:nth-last-child(2),thead th:nth-last-child(3)')].map(n=>getComputedStyle(n).backgroundColor)}));
    item[mode]=actual;
    check(actual.columnC===expected.columnC,mode+': exact source Column C subtitle');
    check(actual.weights.slice(0,2).every(w=>w===expected.columnABWeight),mode+': source A/B header weight');
    check(actual.subweights.every(w=>w===expected.columnABWeight),mode+': source excerpt subtitle weight');
    check(actual.weights[2]===expected.columnCWeight,mode+': source Column C weight');
    check(actual.backgrounds.every(c=>expected.roughWorkShaded?c==='rgb(236, 235, 234)':c==='rgb(255, 255, 255)'),mode+': source shaded/white rough-work cells');
    if(!await page.evaluate(()=>Boolean(window.axe)))await page.addScriptTag({path:axePath});
    const accessibility=await page.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return{violations:r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),incomplete:r.incomplete.map(v=>({id:v.id,nodes:v.nodes.length}))};});
    item[mode].accessibility=accessibility;check(!accessibility.violations.length,mode+': source comparison page has no reported WCAG violations');
    if(mode==='practice'){
     await page.locator('[data-exam-menu-trigger="questions"]').click();await page.locator(`[data-go-question="${paper.questions.at(-1).id}"]`).click();
     await page.locator('[data-submit-paper]:visible').first().click();await page.locator('[data-confirm-submit]').click();await page.locator('[data-screen="results"]').waitFor();
    }
   }
  }catch(error){item.errors.push(error.stack||error.message);}finally{await context.close();}
  papers.push(item);console.log(item.id,item.checks.filter(c=>!c.passed),item.errors);
 }}finally{await browser.close();server.close();}
 fs.writeFileSync(path.join(root,'digital-question-papers/audit/2026-11-05/source-comparison-headings.json'),JSON.stringify({scope:'All ten official comparison header crops read at 300 dpi. Actual Practice and feedback wording, font weight and rough-work shading checked; intentional shared 5 marks footer retained.',papers},null,2)+'\n');
 process.exitCode=papers.some(p=>p.errors.length||p.checks.some(c=>!c.passed))?1:0;
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
