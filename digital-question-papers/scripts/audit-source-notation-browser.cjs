'use strict';
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const {server,root}=require('./audit-papers-browser.cjs');
const marking=require('../exam-marking');
const out=path.resolve(root,process.env.AUDIT_OUTPUT||'maintenance/generated/past-paper-source-render-review');fs.mkdirSync(out,{recursive:true});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({headless:true,executablePath:process.env.AUDIT_BROWSER});
  const prior=path.join(root,'digital-question-papers/audit/2026-11-05/source-notation-browser.json');
  const results=process.env.AUDIT_PAPER&&fs.existsSync(prior)?JSON.parse(fs.readFileSync(prior,'utf8')).papers:[];
  try {
    for(const year of [2014,2015,2016,2017,2018,2019,2022,2023,2024,2025,2026].filter(year=>!process.env.AUDIT_PAPER||process.env.AUDIT_PAPER.split(',').includes(`national5-${year}`))) {
      const id=`national5-${year}`,paper=require(`../papers/${id}.js`),source=require(`../tests/fixtures/${id}-q3-source-audit.json`);
      const q=paper.questions.find(q=>q.id==='q3'),part=q.subquestions.find(p=>p.notationTool==='note-entry');
      const context=await browser.newContext({viewport:{width:1440,height:1050},deviceScaleFactor:2,reducedMotion:'reduce'}),page=await context.newPage();
      const item={id,checks:[],errors:[]};const check=(passed,name)=>item.checks.push({passed:Boolean(passed),name});page.on('pageerror',e=>item.errors.push(e.message));
      await page.goto(`http://127.0.0.1:${server.address().port}/digital-question-papers/digitalquestionpapers.html?paper=${id}`);
      await page.locator('[data-exam-menu-trigger="questions"]').click();await page.locator('[data-go-question="q3"]').click();await page.evaluate(()=>document.fonts.ready);
      const svg=page.locator('[data-shared-notation] svg.q3-shared-score');
      await svg.screenshot({path:path.join(out,`${id}-blank-score.png`)});
      const pitches=source.editableNoteIndices.map(i=>source.bars[source.editableBar-1].notes[i][0]);
      const chroma=p=>Number(p.slice(-1))*7+'CDEFGAB'.indexOf(p[0]);
      for(let i=0;i<pitches.length;i++) {
        const target=page.locator('.q3-note-hit-area').first();await target.focus();
        let label=await target.getAttribute('aria-label'),match=label.match(/Note (\d+): ([A-G][#♯b♭]?\d)/);
        if(!match)throw Error(`Missing keyboard cursor description: ${label}`);
        for(let slot=Number(match[1])-1;slot<i;slot++)await target.press('ArrowRight');
        const delta=chroma(pitches[i])-chroma(match[2]);for(let n=0;n<Math.abs(delta);n++)await target.press(delta>0?'ArrowUp':'ArrowDown');
        await target.press('ArrowUp');await target.press('ArrowDown');
        check(await target.evaluate(n=>n===document.activeElement),'arrow-key preview retains keyboard focus');
        check(await page.locator('.q3-note-preview').count()>0,'arrow-key preview remains visible');
        await target.press('Enter');
      }
      const value=await page.evaluate(({id,part})=>window.ExamStorage.loadDraft(id).answers[part],{id,part:part.id});
      item.enteredNotes=value;
      check(value.replace(/Bb4|B♭4/g,'B4')===pitches.join(','),'every source-derived missing pitch entered through the keyboard');
      check(marking.markSubquestion(part,value).marks===part.marks,'complete official missing-note answer earns its mark');
      await page.locator('[data-exam-menu-trigger="questions"]').focus();
      await svg.screenshot({path:path.join(out,`${id}-completed-score.png`)});
      const clear=page.locator(`[data-subquestion="${part.id}"] .notation-clear-button`);await clear.click();
      check(!await page.evaluate(({id,part})=>window.ExamStorage.loadDraft(id).answers[part],{id,part:part.id}),'Clear empties the whole source-derived answer');
      check(await page.locator(`[data-subquestion="${part.id}"] .score-apply-hint`).count()===0,'direct entry has Clear only and no redundant instruction');
      for(let i=0;i<pitches.length;i++) {
        const target=page.locator('.q3-note-hit-area').first();await target.evaluate(node=>node.scrollIntoView({block:"center",behavior:"instant"}));const box=await target.boundingBox();
        const geometry=await target.evaluate(node=>{
          const r=node.getBoundingClientRect(),svg=node.ownerSVGElement;
          const ys=[...new Set([...svg.querySelectorAll('.q3-staff-line')].filter(n=>n.getBoundingClientRect().width>svg.getBoundingClientRect().width*.5).map(n=>n.getBoundingClientRect().top))].sort((a,b)=>a-b);
          const centre=r.y+r.height/2,middle=ys.reduce((best,y)=>Math.abs(y-centre)<Math.abs(best-centre)?y:best,ys[0]);
          const gap=Math.min(...ys.filter(y=>Math.abs(y-middle)>.5).map(y=>Math.abs(y-middle)));
          return {middle,gap};
        });
        const x=box.x+box.width*(i+.5)/pitches.length,y=geometry.middle-(chroma(pitches[i])-chroma('B4'))*geometry.gap/2;
        (item.pointerDiagnostics ||= []).push({slot:i,box,geometry,x,y,hit:await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.outerHTML?.slice(0,500),{x,y})});
        await page.mouse.move(x,y+geometry.gap/2);await page.mouse.down();await page.mouse.move(x,y,{steps:3});
        const grey=await page.locator('.q3-note-preview').count();check(grey>0,`slot ${i+1} has a drag preview`);
        await page.mouse.up();
      }
      const pointerValue=await page.evaluate(({id,part})=>window.ExamStorage.loadDraft(id).answers[part],{id,part:part.id});
      item.draggedNotes=pointerValue;
      check(pointerValue.replace(/Bb4|B♭4/g,'B4')===pitches.join(','),'every source-derived missing pitch entered through dragging');
      check(marking.markSubquestion(part,pointerValue).marks===part.marks,'dragged official answer earns its mark');
      await page.locator(`[data-subquestion="${part.id}"] .notation-clear-button`).click();
      const target=page.locator('.q3-note-hit-area').first();await target.focus();await target.press('Enter');
      check((await page.evaluate(({id,part})=>window.ExamStorage.loadDraft(id).answers[part].split(',')[0],{id,part:part.id})).replace(/Bb4|B♭4/g,'B4')==='B4','keyboard cursor resets after Clear');
      const previous=results.findIndex(p=>p.id===id);if(previous>=0)results.splice(previous,1);results.push(item);console.log(id,JSON.stringify(item));await context.close();
    }
  } finally {await browser.close();server.close();}
  fs.writeFileSync(path.join(out,'browser-source-checks.json'),JSON.stringify({papers:results},null,2));process.exitCode=results.some(p=>p.errors.length||p.checks.some(c=>!c.passed))?1:0;
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
