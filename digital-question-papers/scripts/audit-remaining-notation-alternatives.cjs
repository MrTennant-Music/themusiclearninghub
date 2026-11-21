'use strict';
// Remaining finite notation tool/target choices. Models describe interaction
// serialisation; accepted complete patterns were independently source-reviewed.
const fs=require('node:fs'),path=require('node:path'),{chromium,webkit}=require('playwright');
const {server,root}=require('./audit-papers-browser.cjs'),registry=require('../paper-registry'),marking=require('../exam-marking');
const num=(s,r)=>Number(s.match(r)[1]);
const slots=(size,index,value)=>{const a=Array(size).fill('_');a[0]='';a[index]=value;return a.join(',');};
const cases={
 'advanced-higher-2016/q4a':{selector:'[aria-label^="Add selected rhythm to bar"]',value:(l,v)=>{const a=['','',''];a[num(l,/bar (\d+)/)-3]=v;return a.join(';');},patterns:true},
 'advanced-higher-2016/q5b':{selector:'[aria-label="Place selected rest in bar 4"]',value:(l,v)=>v,patterns:true},
 'advanced-higher-2016/q5c':{selector:'[data-ah-tie-target]',value:l=>{const m=l.match(/notes (\d+) and (\d+) in bar (\d+)/);return `${m[3]}:${Number(m[1])-1}-${Number(m[2])-1}`;}},
 'advanced-higher-2019/q2ai':{selector:'[aria-label^="Place rests for the"]',value:(l,v)=>l.includes('first')?(v==='dottedCrotchetRest'?'':v+'|'):'|'+v,patterns:true},
 'advanced-higher-2025/q2ai':{selector:'[aria-label^="Enter rhythm for note"]',value:(l,v)=>slots(3,num(l,/note (\d+)/)-1,v)},
 'advanced-higher-2026/q2aiv':{selector:'[data-ah-tie-target]',value:()=> '19:2-20:0'},
 'higher-2015/q4c':{selector:'.q3-accidental-hit-area',value:(l,v)=>v+'@'+(num(l,/note (\d+)/)===1?0:2),correct:v=>['flat@0','flat@2'].includes(v)},
 'higher-2016/q4c':{selector:'[aria-label^="Rhythm correction for note"][aria-label$="bar 5"]',value:(l,v)=>slots(2,num(l,/note (\d+)/)-1,v)},
 'higher-2018/q3e':{selector:'[aria-label^="Apply a rhythm to note"]',value:(l,v)=>v.startsWith('triplet')?Array(3).fill(v).join(','):slots(3,num(l,/note (\d+)/)-1,v)},
 'higher-2019/q3e':{selector:'[aria-label="Place the missing rest in bar 21"]',value:(l,v)=>v},
 'higher-2023/q4d':{selector:'[aria-label^="Rhythm correction for note"][aria-label$="bar 9"]',value:(l,v)=>slots(2,num(l,/note (\d+)/)-1,v)},
 'higher-2023/q4e':{selector:'[aria-label^="Rest placement"][aria-label$="bar 12"]',value:(l,v)=>v,patterns:true},
 'higher-2024/q4b':{selector:'[aria-label^="Rhythm correction for crotchet note"]',value:(l,v)=>num(l,/note (\d+)/)===2?v+',quaver':',_|'+(num(l,/note (\d+)/)-1)+':'+v},
 'higher-2026/q4e':{selector:'[aria-label="Place the missing rest in bar 16"]',value:(l,v)=>v},
 'national5-2017/q3d':{selector:'[aria-label^="Rhythm correction for note"][aria-label$="bar 2"]',value:(l,v)=>slots(2,num(l,/note (\d+)/)-3,v)},
 'national5-2018/q3c':{selector:'[aria-label^="Rhythm correction for note"][aria-label$="bar 2"]',value:(l,v)=>slots(2,num(l,/note (\d+)/)-3,v)},
 'national5-2019/q3e':{selector:'[aria-label^="Rhythm correction for note"][aria-label$="bar 7"]',value:(l,v)=>slots(4,num(l,/note (\d+)/)-1,v)}
};
const empty=value=>!String(value||'').replace(/[_,;|]/g,'');
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const engine=process.env.AUDIT_ENGINE||'chromium',browser=await(engine==='webkit'?webkit:chromium).launch({headless:true,...(engine!=='webkit'?{executablePath:process.env.AUDIT_BROWSER}:{})});
 const output=path.resolve(process.env.AUDIT_RESULTS_FILE||`digital-question-papers/audit/2026-11-05/${engine==='webkit'?'webkit-':''}remaining-notation-alternatives.json`),result={engine,browserVersion:browser.version(),scope:'All offered rhythm/rest/tie target/tool choices and Higher 2015 accidental positions. First-entry serialisation, source-reviewed marks, explicit beat-capacity rejection, removal and complete source-accepted rest patterns. Native touch uses emulation, not a physical-device claim.',parts:[]};
 try{for(const[key,plan]of Object.entries(cases)){
  const[id,partId]=key.split('/');if(process.env.AUDIT_PAPER&&!process.env.AUDIT_PAPER.split(',').includes(id))continue;if(process.env.AUDIT_PART&&!process.env.AUDIT_PART.split(',').includes(partId))continue;
  const paper=require(path.join(root,'digital-question-papers',registry[id].dataFile.split('?')[0])),q=paper.questions.find(q=>q.subquestions.some(s=>s.id===partId)),part=q.subquestions.find(s=>s.id===partId),item={paper:id,part:partId,positions:[],patterns:[],checks:[],errors:[]},check=(passed,name)=>item.checks.push({passed:Boolean(passed),name});
  for(const route of(process.env.AUDIT_ROUTE||'keyboard,pointer,touch-phone,touch-ipad').split(',')){
   const touch=route.startsWith('touch'),context=await browser.newContext({viewport:touch?{width:route.endsWith('ipad')?768:390,height:1024}:{width:1440,height:1100},hasTouch:touch,reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(2500);page.on('pageerror',e=>item.errors.push(e.message));
   try{
    await page.goto(`http://127.0.0.1:${server.address().port}/digital-question-papers/digitalquestionpapers.html?paper=${id}`);await page.evaluate(()=>document.fonts.ready);await page.locator('[data-exam-menu-trigger="questions"]').click();await page.locator(`[data-go-question="${q.id}"]`).click();
    const section=page.locator(`[data-subquestion="${partId}"]`),buttons=section.locator('.notation-tool-button'),choices=await buttons.evaluateAll(ns=>ns.map(n=>n.dataset.value||null)),value=()=>page.evaluate(({id,partId})=>ExamStorage.loadDraft(id).answers[partId],{id,partId});
    const descriptors=await page.locator('svg '+plan.selector).evaluateAll(ns=>ns.map(n=>({label:n.getAttribute('aria-label'),svg:[...document.querySelectorAll('svg')].indexOf(n.ownerSVGElement),selector:['class','x','y','width','height'].map(a=>`[${a}="${n.getAttribute(a)}"]`).join('')})));
    const target=d=>page.locator('svg').nth(d.svg).locator(`[role="button"]${d.selector}`).first(),button=v=>v===null?buttons.first():section.locator(`.notation-tool-button[data-value=${JSON.stringify(v)}]`);
    const tap=async loc=>{await loc.evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));if(engine!=='webkit')return loc.tap();const pt=await loc.evaluate(n=>{const r=n.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,v=visualViewport;if(!n.contains(document.elementFromPoint(x,y)))throw new Error('Actual notation target obstructed: '+n.getAttribute('aria-label')+' by '+document.elementFromPoint(x,y)?.outerHTML.slice(0,180));return{x:(x-v.offsetLeft)*v.scale,y:(y-v.offsetTop)*v.scale};});return page.touchscreen.tap(pt.x,pt.y);};
    const act=async loc=>{if(route==='keyboard'){await loc.focus();return loc.press('Enter');}if(touch)return tap(loc);return loc.click();},clear=async b=>{await b.focus();await b.press('Shift+Delete');};
    check(descriptors.length>0,route+': offers source-region targets');check(choices.length>0,route+': offers tools');
    for(const choice of choices)for(const d of descriptors){
     const name=route+' '+choice+' '+d.label,b=button(choice);
     try{
      await clear(b);await act(b);await act(target(d));const entered=await value(),expected=plan.value(d.label,choice);
      item.positions.push({route,tool:choice,label:d.label,value:entered,expected});
      check((entered||'')===expected,name+': exact first entry or documented beat-capacity rejection');
      const accepted=plan.correct?plan.correct(expected):[part.answer,...(part.acceptedAnswers||[])].includes(expected);
      check(marking.markSubquestion(part,entered).marks===(accepted?part.marks:0),name+': source-reviewed correct/wrong marking');
      if(route==='keyboard')await clear(b);else if(touch){await tap(b);await tap(b);}else await b.click({button:'right'});
      check(empty(await value()),name+': complete answer removal');
      if(['rhythm-entry','accidental','tie-entry'].includes(part.notationTool))check(await b.getAttribute('aria-pressed')==='false',name+': removal disarms the tool');
     }catch(e){item.errors.push(name+': '+e.message);await clear(b);}
    }
    if(plan.patterns){
     for(const pattern of [...new Set([part.answer,...(part.acceptedAnswers||[])])]){
      const b=buttons.first();await clear(b);
      const groups=pattern.split('|');
      if(id==='advanced-higher-2016'&&partId==='q4a'){
       for(const [bar,sequence] of pattern.split(';').entries())for(const token of sequence.split(',')){await act(button(token));await act(target(descriptors[bar]));}
      }else if(id==='advanced-higher-2019'){
       for(let slot=0;slot<groups.length;slot++)for(const token of groups[slot].split(',')){await act(button(token));await act(target(descriptors[slot]));}
      }else{
       const seq=pattern.split(',');for(let i=0;i<seq.length;i++){await act(button(seq[i]));await act(target(descriptors[Math.min(i,descriptors.length-1)]));}
      }
      const entered=await value();item.patterns.push({route,pattern,value:entered});check(entered===pattern,route+' '+pattern+': complete source-accepted rest pattern stored');check(marking.markSubquestion(part,entered).marks===part.marks,route+' '+pattern+': complete source-accepted rest pattern marked');await clear(b);
     }
    }
   }catch(e){item.errors.push(route+': '+e.stack);}finally{await context.close();}
  }
  result.parts.push(item);fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(id,partId,JSON.stringify({positions:item.positions.length,patterns:item.patterns.length,failed:item.checks.filter(c=>!c.passed),errors:item.errors}));
 }}finally{await browser.close();server.close();}
 process.exitCode=result.parts.some(p=>p.errors.length||p.checks.some(c=>!c.passed))?1:0;
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
