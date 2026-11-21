'use strict';
// Computed-paint follow-up for SVG nodes left unresolved by axe. Scores sit on
// the white paper canvas. This is contrast evidence, not screen-reader testing.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const registry=require('../paper-registry'),{server,root}=require('./audit-papers-browser.cjs');
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.AUDIT_BROWSER});const results=[];
 try{for(const entry of Object.values(registry)){
  const paper=require(path.join(root,'digital-question-papers',entry.dataFile.split('?')[0]));
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage();const item={id:entry.id,questions:[],errors:[]};page.on('pageerror',e=>item.errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/digital-question-papers/digitalquestionpapers.html?paper=${entry.id}`);
  for(let i=0;i<paper.questions.length;i++){
   if(i)await page.locator('[data-next-question]').click();
   const paint=await page.evaluate(()=>{
    function rgb(s){const a=s?.match(/[\d.]+/g)?.map(Number);return a?.length>=3?a:null;}
    const lum=c=>c.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
    const records=[];
    for(const node of document.querySelectorAll('.question-card svg text,.question-card svg line,.question-card svg path,.question-card svg polygon,.question-card svg circle')){
     const cs=getComputedStyle(node),rect=node.getBoundingClientRect();if(!rect.width||cs.visibility==='hidden'||cs.display==='none')continue;
     const isText=node.tagName.toLowerCase()==='text'&&!/bravura/i.test(cs.fontFamily),fontSize=parseFloat(cs.fontSize),bold=Number(cs.fontWeight)>=700;
     const threshold=isText&&!(fontSize>=24||(bold&&fontSize>=18.66))?4.5:3;
     const inks=[cs.fill,cs.stroke].filter(ink=>ink!=='none').map(ink=>({ink,col:rgb(ink)})).filter(x=>x.col);if(!inks.length)continue;const {ink,col}=inks.sort((a,b)=>lum(a.col)-lum(b.col))[0];
     let opacity=col[3]??1;for(let p=node;p&&p.tagName!=='BODY';p=p.parentElement)opacity*=Number(getComputedStyle(p).opacity);
     const blended=col.slice(0,3).map(x=>x*opacity+255*(1-opacity)),ratio=1.05/(lum(blended)+.05);
     const arrowInset=node.matches('.answer-option-flow-arrow-shape > polygon.is-inner')&&getComputedStyle(node.previousElementSibling).fill==='rgb(0, 0, 0)';
     const backgroundMask=arrowInset||node.matches('.higher-2018-q3-score circle[fill="white"][stroke="none"]');const exempt=backgroundMask||Boolean(node.closest('[aria-disabled="true"],.q3-note-preview,.is-disabled'));
     records.push({type:isText?'text':'notation',paint:ink,opacity,ratio:Math.round(ratio*100)/100,threshold,exempt,exemption:arrowInset?'Source grey background inset within the black arrow silhouette; the black perimeter provides its contrast':backgroundMask?'White drum-note mask under the black × notehead; background paint, not foreground content':null,sample:isText?node.textContent.trim().slice(0,100):node.getAttribute('class'),html:node.outerHTML.slice(0,400)});
    }
    const groups=new Map();for(const r of records){const key=JSON.stringify([r.type,r.paint,r.opacity,r.threshold,r.exempt]);const g=groups.get(key);if(g)g.nodes++;else groups.set(key,{...r,nodes:1});}
    return {nodes:records.length,paintGroups:[...groups.values()],belowThreshold:records.filter(r=>!r.exempt&&r.ratio+.01<r.threshold)};
   });item.questions.push({id:paper.questions[i].id,...paint});
  }
  results.push(item);console.log(entry.id,item.questions.reduce((n,q)=>n+q.nodes,0),'SVG nodes;',item.questions.reduce((n,q)=>n+q.belowThreshold.length,0),'review flags');await context.close();
 }}finally{await browser.close();server.close();}
 const out=path.join(root,'digital-question-papers/audit/2026-11-05/score-contrast.json');fs.writeFileSync(out,JSON.stringify({method:'Computed SVG fill/stroke and ancestor opacity composited on the white paper. Text uses 4.5:1, large text and notation 3:1. Disabled/preview nodes are excluded. Review every flag manually.',papers:results},null,2)+'\n');
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
