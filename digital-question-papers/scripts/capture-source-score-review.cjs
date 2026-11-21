'use strict';
// Capture rendered source-score comparisons; this does not certify transcription.
const fs=require('node:fs'),path=require('node:path'),{chromium,webkit}=require('playwright'),registry=require('../paper-registry'),{server,root}=require('./audit-papers-browser.cjs');
const out=path.resolve(process.env.AUDIT_OUTPUT||'maintenance/generated/past-paper-source-score-captures');fs.mkdirSync(out,{recursive:true});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const engine=process.env.AUDIT_ENGINE||'chromium',browser=await (engine==='webkit'?webkit:chromium).launch({headless:true,...(engine==='webkit'?{}:{executablePath:process.env.AUDIT_BROWSER})}),papers=[];
try{for(const entry of Object.values(registry).filter(e=>!process.env.AUDIT_PAPER||process.env.AUDIT_PAPER.split(',').includes(e.id))){
 const context=await browser.newContext({viewport:{width:1440,height:1100},deviceScaleFactor:2,reducedMotion:'reduce'}),page=await context.newPage(),paper=require(path.join(root,'digital-question-papers',entry.dataFile.split('?')[0])),item={id:entry.id,questions:[],errors:[]};page.on('pageerror',e=>item.errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/digital-question-papers/digitalquestionpapers.html?paper=${entry.id}`);
 for(const q of paper.questions){if(process.env.AUDIT_QUESTION&&!process.env.AUDIT_QUESTION.split(',').includes(q.id))continue;
  await page.locator('[data-exam-menu-trigger="questions"]').click();await page.locator(`[data-go-question="${q.id}"]`).click();await page.evaluate(()=>document.fonts.ready);
  const svgs=page.locator('.question-card svg.q3-shared-score'),record={id:q.id,scores:[]};
  for(let i=0;i<await svgs.count();i++){
   const svg=svgs.nth(i),name=`${entry.id}-${q.id}-score-${i+1}`,style=await page.addStyleTag({content:'.exam-header{visibility:hidden!important}'});
   try{await svg.screenshot({path:path.join(out,name+'.png')});}finally{await style.evaluate(n=>n.remove());}
   const details=await svg.evaluate(svg=>{
    const text=[...svg.querySelectorAll('.q3-score-lyrics,.q3-lyric')].filter(n=>n.textContent.trim()).map(n=>{const r=n.getBoundingClientRect();const style=getComputedStyle(n);return{text:n.textContent.trim(),x:r.x,y:r.y,w:r.width,h:r.height,fontFamily:style.fontFamily,fontWeight:Number(style.fontWeight),fontStyle:style.fontStyle};}),collisions=[];
    for(let i=0;i<text.length;i++)for(let j=i+1;j<text.length;j++){const a=text[i],b=text[j],overlap=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x);if(Math.abs(a.y-b.y)<3&&overlap>1)collisions.push({a:a.text,b:b.text,overlap:Math.round(overlap*100)/100,scoreY:a.y});}
    const caption=[...svg.querySelectorAll('.q3-marking-box-label')].find(n=>n.textContent==='same pitch'),bar10=[...svg.querySelectorAll('.q3-bar-number')].find(n=>n.textContent==='10');
    let captionBar10=null;
    if(caption&&bar10){const a=caption.getBoundingClientRect(),b=bar10.getBoundingClientRect();captionBar10={caption:caption.textContent,overlaps:a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top,captionBounds:{x:a.x,y:a.y,width:a.width,height:a.height},barBounds:{x:b.x,y:b.y,width:b.width,height:b.height}};}
    const labels=[...svg.querySelectorAll('.q3-marking-box-label,.q3-box-label')].map(n=>{const b=n.getBBox(),x=Number(n.getAttribute('x')),y=Number(n.getAttribute('y'));const box=[...svg.querySelectorAll('rect.q3-marking-box')].map(r=>r.getBBox()).find(r=>(Math.abs(r.x+8-x)<1||Math.abs(r.x+4-x)<1)&&Math.abs(r.y+20-y)<1);return{text:n.textContent.replace(/\s+/g,' ').trim(),fontFamily:getComputedStyle(n).fontFamily,fontWeight:Number(getComputedStyle(n).fontWeight),fontStyle:getComputedStyle(n).fontStyle,captionAbove:n.dataset.captionPlacement==='above'?{passed:b.y+b.height<Number(n.dataset.captionBoxY),bottom:b.y+b.height,boxTop:Number(n.dataset.captionBoxY)}:null,boxOverflow:box?Math.max(0,b.x+b.width-box.x-box.width):0};});return{label:svg.getAttribute('aria-label'),host:svg.parentElement.dataset,lyrics:text,labels,lyricReviewFlags:collisions,captionBar10};
   });record.scores.push({capture:name+'.png',...details});
  }if(record.scores.length){
  record.sourceTypographyChecks=[];
  for(const [text,weight]of Object.entries(q.sourceNotationLabelWeights||{})){const labels=record.scores.flatMap(s=>s.labels.filter(l=>l.text===text));record.sourceTypographyChecks.push({name:'exact source weight: '+text,passed:labels.length>0&&labels.every(l=>l.fontWeight===weight)});}
  for(const [text,font]of Object.entries(q.sourceNotationLabelFonts||{})){const labels=record.scores.flatMap(s=>s.labels.filter(l=>l.text===text));record.sourceTypographyChecks.push({name:'exact source family: '+text,passed:labels.length>0&&labels.every(l=>l.fontFamily.includes(font))});}
  const lyrics=record.scores.flatMap(s=>s.lyrics);
  if(['higher-2019','higher-2023','higher-2024','higher-2025','higher-2026','national5-2026'].includes(entry.id)&&lyrics.length)record.sourceTypographyChecks.push({name:'source sans-serif lyric font',passed:lyrics.every(l=>l.fontFamily.includes('Trebuchet'))});
  if(entry.id==='higher-2015'&&lyrics.length)record.sourceTypographyChecks.push({name:'source bold serif lyrics',passed:lyrics.every(l=>l.fontWeight===700&&l.fontFamily.includes('Times New Roman'))});
  item.questions.push(record);
 }
 }papers.push(item);fs.writeFileSync(path.join(out,'captures.json'),JSON.stringify({engine,method:'Full-resolution browser score screenshots, exact source-caption font checks and geometric lyric-overlap triage; every visual flag requires review.',papers},null,2)+'\n');console.log(item.id,item.questions.reduce((n,q)=>n+q.scores.length,0),'scores',JSON.stringify(item.questions.flatMap(q=>q.scores.flatMap(s=>s.lyricReviewFlags))),item.errors);await context.close();
}}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
