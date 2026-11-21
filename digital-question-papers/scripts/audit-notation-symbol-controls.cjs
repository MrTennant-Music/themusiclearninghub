'use strict';
// Real input and marking checks for every non-note-entry notation control.
const fs=require('node:fs'),path=require('node:path'),{chromium,webkit}=require('playwright');
const {server,root}=require('./audit-papers-browser.cjs'),registry=require('../paper-registry'),marking=require('../exam-marking');
const special={
 'advanced-higher-2016/q4a':[['crotchet','Add selected rhythm to bar 3'],['quaver','Add selected rhythm to bar 3'],['quaver','Add selected rhythm to bar 3'],['minim','Add selected rhythm to bar 4'],['quaverRest','Add selected rhythm to bar 5'],['quaver','Add selected rhythm to bar 5'],['quaver','Add selected rhythm to bar 5'],['quaver','Add selected rhythm to bar 5']],
 'advanced-higher-2016/q5b':[['crotchetRest','Place selected rest in bar 4'],['quaverRest','Place selected rest in bar 4']],
 'advanced-higher-2016/q5c':[[null,'Tie notes 3 and 4 in bar 2']],
 'advanced-higher-2017/q4d':[['L','Place L above bar 8']],
 'advanced-higher-2017/q5d':[['Bracket','Place bracket above bars 5 and 6']],
 'advanced-higher-2018/q2aii':[['Bracket','Place bracket above bars 9 and 10']],
 'advanced-higher-2018/q2d':[['A','Place A above note 3 in bar 16']],
 'advanced-higher-2019/q2ai':[['crotchetRest','Place rests for the first beat of bar 1'],['dottedCrotchetRest','Place rests for the second beat of bar 1']],
 'advanced-higher-2019/q4bi':[['sharp','Place the selected accidental before the second C in bar 12']],
 'advanced-higher-2022/q2bii':[['flat','Place the selected accidental before E in bar 3']],
 'advanced-higher-2022/q4bii':[['8va','Place selected sign above the first note in bar 4']],
 'advanced-higher-2023/q2bi':[['repeat-signs','Place start repeat at bar 10'],['repeat-signs','Place end repeat at bar 25']],
 'advanced-higher-2023/q2bii':[['bracket','Place bracket above bar 20']],
 'advanced-higher-2023/q4c':[['natural','Place the selected accidental before the first note in bar 10']],
 'advanced-higher-2024/q2aii':[['M','Place M above bar 1']],
 'advanced-higher-2024/q2cii':[['sharp','Place the selected accidental before D in bar 17']],
 'advanced-higher-2025/q2ai':[1,2,3].map(i=>['tripletQuaver',`Enter rhythm for note ${i} in bar 1`]),
 'advanced-higher-2025/q4c':[[false,'Circle note 2 in bar 12 for the subdominant answer']],
 'advanced-higher-2025/q4d':[[false,'Place barline after bar 9'],[false,'Place barline after bar 10']],
 'advanced-higher-2026/q2aii':[['end-repeat','Place end repeat at bar 8']],
 'advanced-higher-2026/q2aiv':[[null,'Tie the final note of bar 19 to the first note of bar 20']],
 'advanced-higher-2026/q4b':[['sharp','Place the selected accidental before C in bar 5']],
 'higher-2015/q4c':[['flat','Place the selected accidental before note 1']],
 'higher-2015/q4e':[4,11,16].map(i=>[false,`Place bar line between notes ${i} and ${i+1} in line 5`]),
 'higher-2016/q4c':[['dottedCrotchet','Rhythm correction for note 1 in bar 5'],['quaver','Rhythm correction for note 2 in bar 5']],
 'higher-2018/q3a':[5,11].map(i=>[false,`Place bar line in line 2 gap ${i}`]),
 'higher-2018/q3e':[['tripletCrotchet','Apply a rhythm to note 1 in the line 8 box']],
 'higher-2019/q3e':[['quaverRest','Place the missing rest in bar 21']],
 'higher-2022/q4d':[[false,'Select note 3 in bar 8 as the tonic']],
 'higher-2023/q4d':[['quaver','Rhythm correction for note 1 in bar 9'],['dottedCrotchet','Rhythm correction for note 2 in bar 9']],
 'higher-2023/q4e':[['crotchetRest','Rest placement 1 for part (e) in bar 12'],['quaverRest','Rest placement 2 for part (e) in bar 12']],
 'higher-2024/q4b':[['quaver','Rhythm correction for crotchet note 2 in bar 6']],
 'higher-2024/q4c':[[false,'Circle note 3 in bar 10 for the dominant answer']],
 'higher-2024/q4f':[['D.C.','Place D.C. above bar 24']],
 'higher-2025/q4a':[[false,'Select note 2 in bar 3 for the subdominant answer']],
 'higher-2025/q4e':[[false,'Place the missing bar line after note 5 in the answer box']],
 'higher-2026/q4e':[['quaverRest','Place the missing rest in bar 16']],
 'national5-2014/q3d':[['end-repeat','Place end repeat at the end of bar 8']],
 'national5-2016/q3c':[['V','Place V above bar 9']],
 'national5-2017/q3d':[['dottedCrotchet','Rhythm correction for note 3 in bar 2'],['quaver','Rhythm correction for note 4 in bar 2']],
 'national5-2018/q3c':[['dottedCrotchet','Rhythm correction for note 3 in bar 2'],['quaver','Rhythm correction for note 4 in bar 2']],
 'national5-2018/q3e':[['D','Place D above bar 9']],
 'national5-2019/q3e':[1,2,3,4].map(i=>['semiquaver',`Rhythm correction for note ${i} in bar 7`]),
 'national5-2023/q3f':[['end-repeat','Place end repeat at the end of bar 8']],
 'national5-2025/q3e':[['end-repeat','Place end repeat at the end of bar 8']]
};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const engine=process.env.AUDIT_ENGINE||'chromium',browser=await (engine==='webkit'?webkit:chromium).launch({headless:true,...(engine!=='webkit'&&process.env.AUDIT_BROWSER?{executablePath:process.env.AUDIT_BROWSER}:{})});
 const out=path.resolve(process.env.AUDIT_RESULTS_FILE||'digital-question-papers/audit/2026-11-05/symbol-controls.json'),papers=[];
 try{for(const entry of Object.values(registry).filter(e=>!process.env.AUDIT_PAPER||process.env.AUDIT_PAPER.split(',').includes(e.id))){
  const paper=require(path.join(root,'digital-question-papers',entry.dataFile.split('?')[0]));
  for(const q of paper.questions)for(const part of q.subquestions.filter(s=>s.notationTool&&s.notationTool!=='note-entry'&&(!process.env.AUDIT_PART||process.env.AUDIT_PART.split(',').includes(s.id)))){
   const item={id:entry.id,part:part.id,tool:part.notationTool,checks:[],errors:[]},check=(passed,name)=>item.checks.push({passed:Boolean(passed),name});
   for(const route of (process.env.AUDIT_ROUTE||'keyboard,touch,doubletap').split(',')){
    const context=await browser.newContext({viewport:route!=='keyboard'?{width:390,height:844}:{width:1440,height:1100},hasTouch:route!=='keyboard',reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(5000);page.on('pageerror',e=>item.errors.push(e.message));
    const value=()=>page.evaluate(({id,part})=>ExamStorage.loadDraft(id).answers[part],{id:entry.id,part:part.id});
    try{
     await page.goto(`http://127.0.0.1:${server.address().port}/digital-question-papers/digitalquestionpapers.html?paper=${entry.id}`);await page.evaluate(()=>document.fonts.ready);await page.locator('[data-exam-menu-trigger="questions"]').click();await page.locator(`[data-go-question="${q.id}"]`).click();
     const tap=async loc=>{
      await loc.evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      if(engine!=='webkit')return loc.tap();
      const point=await loc.evaluate(n=>{const r=n.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,v=visualViewport;if(!n.contains(document.elementFromPoint(x,y)))throw new Error('Visible symbol target is obstructed: '+n.getAttribute('aria-label')+' by '+document.elementFromPoint(x,y)?.outerHTML.slice(0,250));return{x:(x-v.offsetLeft)*v.scale,y:(y-v.offsetTop)*v.scale};});
      return page.touchscreen.tap(point.x,point.y);
     };
     const section=page.locator(`[data-subquestion="${part.id}"]`),plans=special[entry.id+'/'+part.id]||[[part.answer,null]],activate=async loc=>{if(route!=='keyboard'){await tap(loc);}else{await loc.focus();check(await loc.evaluate(n=>n===document.activeElement),`${route}: control receives focus`);await loc.press('Enter');}};
     let lastTarget=null,lastButton=null;
     for(const [tool,label]of plans){
      if(tool!==false){const button=tool===null?section.locator('.notation-tool-button').first():section.locator(`.notation-tool-button[data-value="${tool}"]`);await activate(button);lastButton=button;}
      if(label){
       const selected=page.locator(`svg [role="button"][aria-label="${label}"]`).first();
       // Arming raises label targets above note inputs; a redraw restores DOM
       // order and changes the placed label. Retain score geometry, not an index.
       const geometry=await selected.evaluate(n=>({svg:[...document.querySelectorAll('svg')].indexOf(n.ownerSVGElement),selector:['x','y','width','height'].map(a=>`[${a}="${n.getAttribute(a)}"]`).join('')}));
       lastTarget=page.locator('svg').nth(geometry.svg).locator(`[role="button"]${geometry.selector}`).first();
       await activate(lastTarget);
      }
     }
     const answer=await value();item[route]=answer;check(marking.markSubquestion(part,answer).marks===part.marks,`${route}: complete source answer earns full credit`);
     if(['time-signature','tempo','dynamic'].includes(part.notationTool))check(await lastButton.getAttribute('aria-pressed')==='true',`${route}: selected answer is announced`);
     if(part.notationTool==='repeat-sign')check(await page.locator('.q3-repeat-hit-area[tabindex="0"]').count()===0,`${route}: inactive repeat targets leave the tab order`);
     const removal=part.notationTool==='repeat-sign'?lastButton:lastTarget||lastButton;
     if(part.notationTool==='tie-entry'&&route!=='doubletap')await activate(lastButton);
     if(route==='keyboard'){await removal.focus();await removal.press('Shift+Delete');check(JSON.stringify(await value())!==JSON.stringify(answer),'keyboard: Shift+Delete removes the answer');}
     else if(route==='touch'){await removal.click({button:'right'});check(JSON.stringify(await value())!==JSON.stringify(answer),'pointer: right-click removes the answer');}
     else{await page.waitForTimeout(400);await tap(removal);await tap(removal);check(JSON.stringify(await value())!==JSON.stringify(answer),'touch: double-tap removes the answer');}
    }catch(e){item.errors.push(route+': '+(e.stack||e.message));}finally{await context.close();}
   }
   papers.push(item);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({engine,browserVersion:browser.version(),papers},null,2)+'\n');console.log(item.id,item.part,JSON.stringify({failed:item.checks.filter(c=>!c.passed),errors:item.errors}));
  }
 }}finally{await browser.close();server.close();}
 process.exitCode=papers.some(p=>p.errors.length||p.checks.some(c=>!c.passed))?1:0;
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
