'use strict';
// Reverse comparison: find official source lines missing from the actual
// question text. Flags require source review; print-only matter is retained.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const {server,root}=require('./audit-papers-browser.cjs'),registry=require('../paper-registry');
const normalize=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[^a-z0-9]/gi,'').toLowerCase();
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.env.AUDIT_BROWSER});
 const output=path.resolve(process.env.AUDIT_RESULTS_FILE||'digital-question-papers/audit/2026-11-05/source-completeness.json'),papers=[];
 try{for(const entry of Object.values(registry).filter(e=>!process.env.AUDIT_PAPER||process.env.AUDIT_PAPER.split(',').includes(e.id))){
  const paper=require(path.join(root,'digital-question-papers',entry.dataFile.split('?')[0]));const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
  const item={id:paper.id,questions:[],errors:[]};page.on('pageerror',e=>item.errors.push(e.message));
  try{
   await page.goto(`http://127.0.0.1:${server.address().port}/digital-question-papers/digitalquestionpapers.html?paper=${paper.id}`);
   const source=fs.readFileSync(path.join(root,'digital-question-papers/tests/fixtures/source-text',`${paper.id}-question.txt`),'utf8');
   const headings=[...source.matchAll(/^[ \t\f]*Question\s+(\d+)([^\n]*)/gm)];
   for(let index=0;index<paper.questions.length;index++){
    const q=paper.questions[index];if(index)await page.locator('[data-next-question]').click();
    const text=await page.locator('[data-single-question-area] .question-card').evaluate(n=>{
      const values=[],walker=document.createTreeWalker(n,NodeFilter.SHOW_TEXT);let text;
      while(text=walker.nextNode()){
        const parent=text.parentElement;
        if(parent.closest('.visually-hidden,.sr-only,[hidden],script,style')||!parent.getClientRects().length||getComputedStyle(parent).visibility==='hidden')continue;
        values.push(text.textContent);
      }
      return values.join(' ');
    }),rendered=normalize(text);
    const heading=headings.find(h=>Number(h[1])===Number(q.number));
    if(!heading)throw new Error(`No official source heading for ${q.id}`);
    const start=heading.index,end=headings.find(h=>h.index>start&&Number(h[1])>Number(q.number))?.index??source.length;
    const lines=source.slice(start,end).split('\n').map(l=>l.trim()).filter(Boolean).map(line=>line.replace(/\s{3,}\d{1,2}\s*$/,''));
    const checked=lines.filter(l=>normalize(l).length>=8),missing=checked.filter(line=>!rendered.includes(normalize(line)));
    const scoreLyrics=await page.locator('[data-single-question-area] .question-card svg .q3-score-lyrics').allTextContents();
    item.questions.push({id:q.id,renderedText:text,scoreLyrics,sourceLines:checked.length,missingLines:missing});
   }
  }catch(error){item.errors.push(error.stack||error.message);}finally{await context.close();}
  papers.push(item);fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify({scope:'Reverse source-line occurrence triage against actual rendered questions. All missing lines need explicit review; source line wraps, notation, print-only material and intentional digital adaptations are not automatically defects.',papers},null,2)+'\n');console.log(item.id,item.questions.length,'questions',item.questions.reduce((n,q)=>n+q.missingLines.length,0),'flags',item.errors.length,'errors');
 }}finally{await browser.close();server.close();}
 process.exitCode=papers.some(p=>p.errors.length)?1:0;
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
