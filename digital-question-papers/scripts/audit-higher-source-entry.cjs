'use strict';
// Exercise independently transcribed answers, rather than reading accepted
// answers back from the implementation under test.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const {server,root}=require('./audit-papers-browser.cjs');
const marking=require('../exam-marking');
const out=path.resolve(root,process.env.AUDIT_OUTPUT||'maintenance/generated/past-paper-higher-source-render');fs.mkdirSync(out,{recursive:true});
const configurations=[{id:'higher-2015',question:'q4',fixture:'higher-2015-q4-source-audit.json',parts:[
  {id:'q4a',label:'Transposed notes in the bass clef',field:'transposition',clef:'bass'},
  {id:'q4d',label:'Missing notes in bar 14',field:'missingPitches',clef:'treble'}
]},{id:'higher-2016',question:'q4',fixture:'higher-2016-q4-source-audit.json',parts:[
  {id:'q4e',label:'Missing notes in bar 14',field:'missingPitches',clef:'treble'},
  {id:'q4f',label:'Transposed notes in the bass clef',field:'transposition',clef:'bass'}
]},{id:'higher-2017',question:'q4',fixture:'higher-2017-q4-source-audit.json',parts:[
  {id:'q4d',label:'Missing notes in bar 11',field:'missingPitches',clef:'treble'},
  {id:'q4f',label:'Transposed notes in the bass clef',field:'transposition',clef:'bass'}
]},{id:'higher-2018',question:'q3',fixture:'higher-2018-q3-source-audit.json',parts:[
  {id:'q3b',label:'Transposed notes in the bass clef',field:'transposition',clef:'bass'},
  {id:'q3c',label:'Missing notes in line 4',field:'missingPitches',clef:'treble'}
]},{id:'higher-2019',question:'q3',fixture:'higher-2019-q3-source-audit.json',parts:[
  {id:'q3d',label:'Missing notes in bars 14 and 15',field:'missingPitches',clef:'treble'},
  {id:'q3f',label:'Transposed notes in the bass clef',field:'transposition',clef:'bass'}
]},{id:'higher-2022',question:'q4',fixture:'higher-2022-q4-source-audit.json',parts:[
  {id:'q4b',label:'Missing interval note at the start of bar 4',field:'intervalPitches',clef:'treble'},
  {id:'q4e',label:'Missing notes in bar 11',field:'missingPitches',clef:'treble'},
  {id:'q4f',label:'Transposed notes in bars 12 and 13',field:'transposition',clef:'bass'}
]},{id:'higher-2023',question:'q4',fixture:'higher-2023-q4-source-audit.json',parts:[
  {id:'q4a',label:'Missing interval note at the start of bar 2',field:'intervalPitches',clef:'treble'},
  {id:'q4b',label:'Transposed notes in bar 4',field:'transposition',clef:'bass'},
  {id:'q4c',label:'Missing notes in bar 7',field:'officialMissingPitches',clef:'treble'}
]},{id:'higher-2024',question:'q4',fixture:'higher-2024-q4-source-audit.json',parts:[
  {id:'q4d',label:'Transposed notes in bar 14',field:'transposition',clef:'bass'}
]},{id:'higher-2025',question:'q4',fixture:'higher-2025-q4-source-audit.json',parts:[
  {id:'q4c',label:'Transposed notes in bar 11',field:'transposition',clef:'bass'},
  {id:'q4d',label:'Missing notes in bar 17',field:'missingPitches',clef:'treble'}
]},{id:'higher-2026',question:'q4',fixture:'higher-2026-q4-source-audit.json',parts:[
  {id:'q4a',label:'Transposed notes in bar 2',field:'transposition',clef:'bass'},
  {id:'q4d',label:'Missing notes in bar 13',field:'missingPitches',clef:'treble'}
]}];
async function captureScore(page,svg,file){
 const style=await page.addStyleTag({content:'.exam-header{visibility:hidden!important}'});
 try{await svg.screenshot({path:file});}finally{await style.evaluate(n=>n.remove());}
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.AUDIT_BROWSER});
 const evidence=path.join(root,'digital-question-papers/audit/2026-11-05/higher-source-entry.json');
 const results=process.env.AUDIT_PAPER&&fs.existsSync(evidence)?JSON.parse(fs.readFileSync(evidence,'utf8')).papers:[];
 try{for(const config of configurations.filter(c=>!process.env.AUDIT_PAPER||process.env.AUDIT_PAPER.split(',').includes(c.id))){
  const {id,question}=config,source=require(`../tests/fixtures/${config.fixture}`),paper=require(`../papers/${id}.js`);
  const context=await browser.newContext({viewport:{width:1440,height:1050},deviceScaleFactor:2,reducedMotion:'reduce'}),page=await context.newPage();
  const item={id,checks:[],errors:[],parts:[]};const check=(passed,name)=>item.checks.push({passed:Boolean(passed),name});page.on('pageerror',e=>item.errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/digital-question-papers/digitalquestionpapers.html?paper=${id}`);
  await page.locator('[data-exam-menu-trigger="questions"]').click();await page.locator(`[data-go-question="${question}"]`).click();await page.evaluate(()=>document.fonts.ready);
  const svg=page.locator('[data-shared-notation] svg.q3-shared-score');await captureScore(page,svg,path.join(out,`${id}-blank.png`));
  const chroma=p=>Number(p.slice(-1))*7+'CDEFGAB'.indexOf(p[0]);
  for(const part of config.parts){
   const pitches=source.editable[part.field],definition=paper.questions.find(q=>q.id===question).subquestions.find(p=>p.id===part.id);
   const target=()=>page.locator(`.q3-note-hit-area[aria-label^="${part.label}"]`);
   for(let i=0;i<pitches.length;i++){
    await target().focus();const label=await target().getAttribute('aria-label'),m=label.match(/Note (\d+): ([A-G][#♯b♭]?\d)/);if(!m)throw Error(label);
    for(let slot=Number(m[1])-1;slot<i;slot++)await target().press('ArrowRight');
    const delta=chroma(pitches[i])-chroma(m[2]);for(let n=0;n<Math.abs(delta);n++)await target().press(delta>0?'ArrowUp':'ArrowDown');await target().press('Enter');
   }
   const value=()=>page.evaluate(({id,part})=>window.ExamStorage.loadDraft(id).answers[part],{id,part:part.id});
   const entered=await value();check(entered===pitches.join(','),`${part.id}: every source pitch entered by keyboard`);check(marking.markSubquestion(definition,entered).marks===definition.marks,`${part.id}: keyboard answer earns its mark`);
   const clear=page.locator(`[data-subquestion="${part.id}"] .notation-clear-button`);await clear.click();check(!await value(),`${part.id}: Clear resets the complete answer`);
   for(let i=0;i<pitches.length;i++){
    await target().evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));const box=await target().boundingBox();
    const geometry=await target().evaluate(n=>{
      const r=n.getBoundingClientRect(),ys=[...new Set([...n.ownerSVGElement.querySelectorAll('.q3-staff-line')].map(n=>n.getBoundingClientRect().top))].sort((a,b)=>a-b),centre=r.y+r.height/2,staves=[];
      for(let i=0;i+4<ys.length;i+=5)staves.push({middle:ys[i+2],gap:(ys[i+4]-ys[i])/4});
      return staves.reduce((best,s)=>Math.abs(s.middle-centre)<Math.abs(best.middle-centre)?s:best,staves[0]);
    });
    await target().focus();let cursor=Number((await target().getAttribute('aria-label')).match(/Note (\d+):/)[1])-1;
    while(cursor!==i){await target().press(cursor<i?'ArrowRight':'ArrowLeft');cursor+=cursor<i?1:-1;}
    await target().press('ArrowUp');await target().press('ArrowDown');
    const x=await page.locator('.q3-note-preview text').first().evaluate(n=>{const p=n.ownerSVGElement.createSVGPoint();p.x=Number(n.getAttribute('x'));p.y=Number(n.getAttribute('y'));return p.matrixTransform(n.getScreenCTM()).x;});
    const y=geometry.middle-(chroma(pitches[i])-chroma(part.clef==='bass'?'D3':'B4'))*geometry.gap/2;
    await page.mouse.move(x,y+geometry.gap/2);await page.mouse.down();await page.mouse.move(x,y,{steps:3});check(await page.locator('.q3-note-preview.is-dragging').count(),`${part.id}: slot ${i+1} has a drag preview`);await page.mouse.up();
   }
   const dragged=await value();check(dragged===pitches.join(','),`${part.id}: every source pitch entered by drag`);check(marking.markSubquestion(definition,dragged).marks===definition.marks,`${part.id}: dragged answer earns its mark`);item.parts.push({id:part.id,entered,dragged});
  }
  await page.locator('[data-exam-menu-trigger="questions"]').focus();await captureScore(page,svg,path.join(out,`${id}-completed.png`));
  fs.writeFileSync(path.join(out,`${id}-completed.svg`),await svg.evaluate(n=>n.outerHTML));
  const previous=results.findIndex(p=>p.id===id);if(previous>=0)results.splice(previous,1);results.push(item);fs.writeFileSync(evidence,JSON.stringify({papers:results},null,2)+'\n');console.log(id,JSON.stringify(item));await context.close();
 }}finally{await browser.close();server.close();}
 fs.writeFileSync(evidence,JSON.stringify({papers:results},null,2)+'\n');process.exitCode=results.some(p=>p.errors.length||p.checks.some(c=>!c.passed))?1:0;
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
