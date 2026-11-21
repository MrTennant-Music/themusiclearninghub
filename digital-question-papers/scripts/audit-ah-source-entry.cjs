'use strict';
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const {server,root}=require('./audit-papers-browser.cjs'),marking=require('../exam-marking');
const out=path.resolve(root,process.env.AUDIT_OUTPUT||'maintenance/generated/past-paper-ah-source-render');fs.mkdirSync(out,{recursive:true});
const configs=[
 {id:'advanced-higher-2016',q:'q4',score:'q4c',part:'q4c',clef:'bass',accidentals:true},
 {id:'advanced-higher-2016',q:'q4',score:'q4dii',part:'q4dii',clef:'treble',accidentals:true},
 {id:'advanced-higher-2016',q:'q4',score:'q4ei',part:'q4eii',clef:'bass'},
 {id:'advanced-higher-2016',q:'q5',part:'q5d',clef:'treble'},
 {id:'advanced-higher-2017',q:'q4',score:'q4e',part:'q4e',clef:'treble'},
 {id:'advanced-higher-2017',q:'q5',score:'q5e',part:'q5b',target:0,clef:'treble',accidentals:true},
 {id:'advanced-higher-2017',q:'q5',score:'q5e',part:'q5c',target:1,clef:'bass'},
 {id:'advanced-higher-2017',q:'q5',part:'q5e',clef:'bass'},
 {id:'advanced-higher-2018',q:'q2',score:'q2ai',part:'q2ai',clef:'treble',rest:'crotchetRest'},
 {id:'advanced-higher-2018',q:'q2',score:'q2b',part:'q2b',clef:'bass',highPitches:['B4','A4','G4']},
 {id:'advanced-higher-2018',q:'q2',score:'q2ci',part:'q2cii',clef:'bass'},
 {id:'advanced-higher-2018',q:'q4',part:'q4c',clef:'treble',accidentals:true},
 {id:'advanced-higher-2019',q:'q2',score:'q2ai',part:'q2aiii',clef:'bass'},
 {id:'advanced-higher-2019',q:'q4',part:'q4ai',clef:'treble'},
 {id:'advanced-higher-2019',q:'q4',score:'q4bi',part:'q4bii',clef:'bass',accidentals:true},
 {id:'advanced-higher-2022',q:'q2',score:'q2ai',part:'q2aii',clef:'bass'},
 {id:'advanced-higher-2022',q:'q4',score:'q4biii',part:'q4biii',clef:'bass',highPitches:['F5','C5']},
 {id:'advanced-higher-2022',q:'q5',score:'q5ai',part:'q5ai',clef:'treble',accidentals:true},
 {id:'advanced-higher-2022',q:'q5',score:'q5ai',part:'q5aii',target:1,clef:'treble'},
 {id:'advanced-higher-2023',q:'q4',part:'q4b',clef:'treble',accidentals:true},
 {id:'advanced-higher-2023',q:'q4',part:'q4d',target:1,clef:'treble'},
 {id:'advanced-higher-2023',q:'q5',score:'q5bi',part:'q5bi',clef:'treble'},
 {id:'advanced-higher-2023',q:'q5',score:'q5bi',part:'q5bii',target:1,clef:'bass'},
 {id:'advanced-higher-2024',q:'q4',score:'q4ai',part:'q4ai',clef:'treble',accidentals:true},
 {id:'advanced-higher-2024',q:'q4',score:'q4bi',part:'q4bi',clef:'treble'},
 {id:'advanced-higher-2024',q:'q4',score:'q4bi',part:'q4bii',target:1,clef:'bass',accidentals:true},
 {id:'advanced-higher-2025',q:'q2',score:'q2ai',part:'q2aii',clef:'treble',accidentals:true},
 {id:'advanced-higher-2025',q:'q2',score:'q2d',part:'q2d',clef:'bass',highPitches:['D5','E5','F5']},
 {id:'advanced-higher-2025',q:'q4',part:'q4a',clef:'treble'},
 {id:'advanced-higher-2025',q:'q4',part:'q4b',target:1,clef:'treble'},
 {id:'advanced-higher-2026',q:'q2',score:'q2aiv',part:'q2aiii',clef:'bass'},
 {id:'advanced-higher-2026',q:'q4',part:'q4d',clef:'treble'}
];
const chroma=p=>Number(p.slice(-1))*7+'CDEFGAB'.indexOf(p[0]);
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.env.AUDIT_BROWSER});const evidence=path.join(root,'digital-question-papers/audit/2026-11-05/ah-source-entry.json');
 const papers=fs.existsSync(evidence)?JSON.parse(fs.readFileSync(evidence)).papers:[];
 try{for(const c of configs.filter(c=>(!process.env.AUDIT_PAPER||process.env.AUDIT_PAPER.split(',').includes(c.id))&&(!process.env.AUDIT_PART||process.env.AUDIT_PART.split(',').includes(c.part)))){
  const context=await browser.newContext({viewport:{width:1440,height:1100},deviceScaleFactor:2,reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(12000);
  const item={id:c.id,part:c.part,checks:[],errors:[]},check=(passed,name)=>item.checks.push({passed:Boolean(passed),name});page.on('pageerror',e=>item.errors.push(e.message));
  const paper=require(`../papers/${c.id}.js`),source=require(`../tests/fixtures/${c.id}-source-audit.json`),pitches=source.editable[c.part],definition=paper.questions.find(q=>q.id===c.q).subquestions.find(p=>p.id===c.part);
  const svg=()=>page.locator(c.score?`[data-part-score="${c.score}"] svg.q3-shared-score`:'[data-shared-notation] svg.q3-shared-score').first(),target=()=>svg().locator('.q3-note-hit-area').nth(c.target||0);
  const value=()=>page.evaluate(({id,part})=>ExamStorage.loadDraft(id).answers[part],{id:c.id,part:c.part});
  const expected=()=>[...(c.rest?[c.rest]:[]),...pitches].join(',');
  const placeRest=async()=>{if(c.rest){const button=svg().getByRole('button',{name:'Place crotchet rest in bar 12',exact:true});await button.focus();await button.press('Enter');}};
  const clear=()=>page.locator(`[data-subquestion="${c.part}"] .notation-clear-button`).click();
  const accidental=async pitch=>{if(!c.accidentals)return;const type=/[#♯]/.test(pitch)?'sharp':/[b♭]/.test(pitch)?'flat':'natural',button=page.locator(`[data-subquestion="${c.part}"] .notation-tool-accidental[data-value="${type}"]`);await button.focus();await button.press('Enter');check(await button.getAttribute('aria-pressed')==='true',`${type} tool exposes its selected state`);};
  const capture=async suffix=>{const style=await page.addStyleTag({content:'.exam-header{visibility:hidden!important}'});try{await svg().screenshot({path:path.join(out,`${c.id}-${c.part}-${suffix}.png`)});}finally{await style.evaluate(n=>n.remove());}};
  try{
   await page.goto(`http://127.0.0.1:${server.address().port}/digital-question-papers/digitalquestionpapers.html?paper=${c.id}`);await page.locator('[data-exam-menu-trigger="questions"]').click();await page.locator(`[data-go-question="${c.q}"]`).click();await page.evaluate(()=>document.fonts.ready);await capture('blank');await placeRest();
   for(let i=0;i<pitches.length;i++){
    await accidental(pitches[i]);await target().focus();let m=(await target().getAttribute('aria-label')).match(/Note (\d+): ([A-G][#♯b♭]?\d)/);let cursor=Number(m[1])-1;
    while(cursor!==i){await target().press(cursor<i?'ArrowRight':'ArrowLeft');cursor+=cursor<i?1:-1;}
    m=(await target().getAttribute('aria-label')).match(/Note (\d+): ([A-G][#♯b♭]?\d)/);const delta=chroma(pitches[i])-chroma(m[2]);for(let n=0;n<Math.abs(delta);n++)await target().press(delta>0?'ArrowUp':'ArrowDown');await target().press('ArrowUp');await target().press('ArrowDown');
    check(await target().evaluate(n=>n===document.activeElement),`slot ${i+1}: keyboard preview retains focus`);check(await svg().locator('.q3-note-preview').count(),`slot ${i+1}: keyboard preview remains visible`);await target().press('Enter');
   }
   item.keyboard=await value();check(item.keyboard===expected(),'every official source pitch entered by keyboard');check(marking.markSubquestion(definition,item.keyboard).marks===definition.marks,'keyboard answer earns its mark');await clear();check(!await value(),'Clear resets every slot');await placeRest();
   for(let i=0;i<pitches.length;i++){
    await accidental(pitches[i]);await target().evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));await target().focus();let cursor=Number((await target().getAttribute('aria-label')).match(/Note (\d+):/)[1])-1;
    while(cursor!==i){await target().press(cursor<i?'ArrowRight':'ArrowLeft');cursor+=cursor<i?1:-1;}await target().press('ArrowUp');await target().press('ArrowDown');
    const cursorPitch=(await target().getAttribute('aria-label')).match(/Note \d+: ([A-G][#♯b♭]?\d)/)[1];
    const geometry=await svg().locator('.q3-note-preview text.q3-complete-note, .q3-note-preview text.q3-notehead').first().evaluate(n=>{const p=n.ownerSVGElement.createSVGPoint();p.x=Number(n.getAttribute('x'));p.y=Number(n.getAttribute('y'));const point=p.matrixTransform(n.getScreenCTM()),ys=[...new Set([...n.ownerSVGElement.querySelectorAll('.q3-staff-line')].map(n=>n.getBoundingClientRect().top))].sort((a,b)=>a-b),staves=[];for(let i=0;i+4<ys.length;i+=5)staves.push({middle:ys[i+2],gap:(ys[i+4]-ys[i])/4});return{...point.toJSON?.(),x:point.x,y:point.y,gap:staves.reduce((b,s)=>Math.abs(s.middle-point.y)<Math.abs(b.middle-point.y)?s:b,staves[0]).gap};});
    const y=geometry.y-(chroma(pitches[i])-chroma(cursorPitch))*geometry.gap/2;await page.mouse.move(geometry.x,y+geometry.gap/2);await page.mouse.down();await page.mouse.move(geometry.x,y,{steps:3});check(await svg().locator('.q3-note-preview.is-dragging').count(),`slot ${i+1}: grey drag preview`);await page.mouse.up();
   }
   item.dragged=await value();check(item.dragged===expected(),'every official source pitch entered by dragging');check(marking.markSubquestion(definition,item.dragged).marks===definition.marks,'dragged answer earns its mark');await page.locator('[data-exam-menu-trigger="questions"]').focus();await capture('completed');
   if(c.highPitches||c.rest){
    await clear();const wanted=c.highPitches||pitches;
    for(let i=0;i<wanted.length;i++){
     await target().focus();let m=(await target().getAttribute('aria-label')).match(/Note (\d+): ([A-G][#♯b♭]?\d)/),cursor=Number(m[1])-1;
     while(cursor!==i){await target().press(cursor<i?'ArrowRight':'ArrowLeft');cursor+=cursor<i?1:-1;}
     m=(await target().getAttribute('aria-label')).match(/Note (\d+): ([A-G][#♯b♭]?\d)/);const delta=chroma(wanted[i])-chroma(m[2]);for(let n=0;n<Math.abs(delta);n++)await target().press(delta>0?'ArrowUp':'ArrowDown');await target().press('Enter');
    }
    if(c.rest){item.notesBeforeRest=await value();await placeRest();item.notesThenRest=await value();check(item.notesThenRest===expected()&&marking.markSubquestion(definition,item.notesThenRest).marks===definition.marks,'enter notes before the rest without shifting or losing notes');}
    else{item.highOctave=await value();check(item.highOctave===wanted.join(',')&&marking.markSubquestion(definition,item.highOctave).marks===definition.marks,'official any-octave answer also earns credit in the high input range');}
   }
   if(c.part==='q4eii'){await clear();await target().focus();for(let i=0;i<chroma('D5')-chroma('B3');i++)await target().press('ArrowUp');await target().press('Enter');item.highOctave=await value();check(item.highOctave==='D5'&&marking.markSubquestion(definition,item.highOctave).marks===1,'official any-octave D includes entered D5');}
  }catch(e){item.errors.push(e.stack||String(e));}
  const old=papers.findIndex(p=>p.id===item.id&&p.part===item.part);if(old>=0)papers.splice(old,1);papers.push(item);fs.writeFileSync(evidence,JSON.stringify({papers},null,2)+'\n');console.log(JSON.stringify(item));await context.close();
 }}finally{await browser.close();server.close();}process.exitCode=papers.some(p=>p.errors.length||p.checks.some(c=>!c.passed))?1:0;
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
