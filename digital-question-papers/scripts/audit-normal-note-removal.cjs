'use strict';
// Use the existing source-audited fixtures/target inventories, independently of
// the answer keys being marked. Each standard entry slot gets exact removal and
// source-answer restoration checks in both engines.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {chromium,webkit}=require('playwright');
const {server,root}=require('./audit-papers-browser.cjs'),registry=require('../paper-registry'),marking=require('../exam-marking');
const auditDir=path.join(root,'digital-question-papers/audit/2026-11-05');
function literalConfig(file,start,end,name){const text=fs.readFileSync(path.join(__dirname,file),'utf8'),context={};vm.runInNewContext(text.slice(text.indexOf(start),text.indexOf(end))+`;this.items=${name};`,context);return JSON.parse(JSON.stringify(context.items));}
function definitions(){
 const cases=[];
 const n5=JSON.parse(fs.readFileSync(path.join(auditDir,'source-notation-browser.json'))).papers;
 for(const record of n5){const paper=require(`../papers/${record.id}`),q=paper.questions.find(q=>q.id==='q3'),part=q.subquestions.find(s=>s.notationTool==='note-entry'),expected=record.enteredNotes;cases.push({paper:record.id,question:q.id,part:part.id,pitches:expected.split(','),expected,host:'[data-shared-notation] svg.q3-shared-score',target:'.q3-note-hit-area:not([data-note-selection])',index:0,clef:'treble',source:`tests/fixtures/${record.id}-q3-source-audit.json`});}
 const higher=literalConfig('audit-higher-source-entry.cjs','const configurations=','\nasync function captureScore','configurations');
 for(const c of higher){const fixture=require('../tests/fixtures/'+c.fixture);for(const p of c.parts){const pitches=fixture.editable[p.field];cases.push({paper:c.id,question:c.question,part:p.id,pitches,expected:pitches.join(','),host:'[data-shared-notation] svg.q3-shared-score',target:`.q3-note-hit-area[aria-label^=${JSON.stringify(p.label)}]`,index:0,clef:p.clef,source:'tests/fixtures/'+c.fixture});}}
 const ah=literalConfig('audit-ah-source-entry.cjs','const configs=','\nconst chroma=','configs');
 for(const c of ah){const fixture=require(`../tests/fixtures/${c.id}-source-audit.json`),pitches=fixture.editable[c.part];cases.push({paper:c.id,question:c.q,part:c.part,pitches,expected:[...(c.rest?[c.rest]:[]),...pitches].join(','),rest:c.rest,accidentals:c.accidentals,host:c.score?`[data-part-score="${c.score}"] svg.q3-shared-score`:'[data-shared-notation] svg.q3-shared-score',target:'.q3-note-hit-area:not([data-note-selection])',index:c.target||0,clef:c.clef,source:`tests/fixtures/${c.id}-source-audit.json`});}
 const expectedParts=Object.values(registry).flatMap(e=>require(path.join(root,'digital-question-papers',e.dataFile.split('?')[0])).questions.flatMap(q=>q.subquestions.filter(p=>p.notationTool==='note-entry').map(p=>e.id+'/'+p.id))).sort();
 if(cases.map(c=>c.paper+'/'+c.part).sort().join('|')!==expectedParts.join('|'))throw new Error('Source entry target inventory does not match every note-entry part');
 if(cases.reduce((n,c)=>n+c.pitches.length,0)!==175)throw new Error('Source note slot count changed: '+JSON.stringify(['national5','higher','advanced-higher'].map(x=>[x,cases.filter(c=>c.paper.startsWith(x+'-')).reduce((n,c)=>n+c.pitches.length,0)])));return cases;
}
const canonical=value=>String(value||'').replace(/♯/g,'#').replace(/♭/g,'b').replace(/♮/g,'');
const chroma=p=>Number(p.match(/\d+$/)[0])*7+'CDEFGAB'.indexOf(p[0]);
module.exports={definitions,canonical,chroma};
if(require.main===module)(async()=>{
 const cases=definitions();await new Promise(r=>server.listen(0,'127.0.0.1',r));const engine=process.env.AUDIT_ENGINE||'chromium',mobile=Boolean(process.env.AUDIT_MOBILE),routes=(process.env.AUDIT_ROUTE||'keyboard,contextmenu,doubleclick,touch-phone,touch-ipad').split(','),launch=()=>(engine==='webkit'?webkit:chromium).launch({headless:true,...(engine!=='webkit'?{executablePath:process.env.AUDIT_BROWSER}:{})});let browser=await launch(),batchCount=0;
 const output=path.resolve(process.env.AUDIT_RESULTS_FILE||path.join(auditDir,`${engine==='webkit'?'webkit-':''}normal-note-removal.json`)),result=process.env.AUDIT_RESUME&&fs.existsSync(output)?JSON.parse(fs.readFileSync(output)):{engine,mobile,routes,browserVersion:browser.version(),scope:'Every normal note-entry part and all 175 source-derived pitch slots (plus one separate entered rest): reverse-order keyboard removal, exact chosen-note right-click/double-click removal and native phone/tablet double-tap removal, with source-answer restoration. Includes a first-tap stability check and preserves a separate entered rest. Does not cover every possible input pitch or physical device.',parts:[]};
 try{for(const c of cases){
  if(process.env.AUDIT_PAPER&&!process.env.AUDIT_PAPER.split(',').includes(c.paper))continue;if(process.env.AUDIT_PART&&!process.env.AUDIT_PART.split(',').includes(c.part))continue;
  const prior=result.parts.find(p=>p.paper===c.paper&&p.part===c.part);if(process.env.AUDIT_RESUME&&prior&&!prior.errors.length&&prior.checks.every(c=>c.passed)&&prior.trials.length===prior.slots*routes.length)continue;result.parts=result.parts.filter(p=>p.paper!==c.paper||p.part!==c.part);
  if(engine==='webkit'&&batchCount&&batchCount%4===0){await browser.close();browser=await launch();}batchCount++;
  const paper=require(path.join(root,'digital-question-papers',registry[c.paper].dataFile.split('?')[0])),part=paper.questions.find(q=>q.id===c.question).subquestions.find(s=>s.id===c.part),item={paper:c.paper,part:c.part,source:c.source,slots:c.pitches.length,trials:[],checks:[],errors:[]},check=(passed,name)=>item.checks.push({passed:Boolean(passed),name});
  for(const route of routes){
   const touch=route.startsWith('touch'),context=await browser.newContext({viewport:touch?{width:route.endsWith('ipad')?768:390,height:1024}:{width:1440,height:1100},hasTouch:touch,isMobile:touch&&mobile,deviceScaleFactor:touch&&mobile?2:1,reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(4000);page.setDefaultNavigationTimeout(15000);page.on('pageerror',e=>item.errors.push(e.message));
   console.log(c.paper,c.part,route,'starting');const routeTimeout=setTimeout(()=>{item.errors.push(route+': browser verification exceeded 45 seconds');console.error(c.paper,c.part,route,'verification timeout');context.close().catch(()=>{});},45000);
   try{
    await page.goto(`http://127.0.0.1:${server.address().port}/digital-question-papers/digitalquestionpapers.html?paper=${c.paper}`);await page.evaluate(()=>document.fonts.ready);await page.locator('[data-exam-menu-trigger="questions"]').click();await page.locator(`[data-go-question="${c.question}"]`).click();
    const svg=()=>page.locator(c.host).first(),target=()=>svg().locator(c.target).nth(c.index),value=()=>page.evaluate(({paper,part})=>ExamStorage.loadDraft(paper).answers[part],c);
    const setCursor=async(slot,pitch)=>{
     if(c.accidentals){const kind=/[#♯]/.test(pitch)?'sharp':/[b♭]/.test(pitch)?'flat':'natural',button=page.locator(`[data-subquestion="${c.part}"] .notation-tool-accidental[data-value="${kind}"]`);await button.focus();await button.press('Enter');}
     await target().focus();let match=(await target().getAttribute('aria-label')).match(/Note (\d+): ([A-G][#♯b♭♮]?\d+)/);if(!match)throw new Error('Missing keyboard note cursor');let cursor=Number(match[1])-1;
     while(cursor!==slot){await target().press(cursor<slot?'ArrowRight':'ArrowLeft');cursor+=cursor<slot?1:-1;}
     match=(await target().getAttribute('aria-label')).match(/Note (\d+): ([A-G][#♯b♭♮]?\d+)/);const delta=chroma(pitch)-chroma(match[2]);for(let n=0;n<Math.abs(delta);n++)await target().press(delta>0?'ArrowUp':'ArrowDown');
    };
    if(c.rest){const rest=svg().getByRole('button',{name:'Place crotchet rest in bar 12',exact:true});await rest.focus();await rest.press('Enter');}
    for(const[i,pitch]of c.pitches.entries()){await setCursor(i,pitch);await target().press('Enter');}
    check(canonical(await value())===canonical(c.expected),route+': complete independent source answer enters correctly');check(marking.markSubquestion(part,await value()).marks===part.marks,route+': source answer earns full credit');
    const expectedTokens=c.expected.split(',');
    const order=route==='keyboard'?[...c.pitches.keys()].reverse():[...c.pitches.keys()];
    for(const slot of order){
     const name=`${route} slot ${slot+1}`;
     if(route==='keyboard'){await target().focus();await target().press('Shift+Delete');}
     else{
      await page.mouse.move(0,0);await target().evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));await setCursor(slot,c.pitches[slot]);const beforePreview=await target().getAttribute('aria-label');await target().press('ArrowUp');if(await target().getAttribute('aria-label')!==beforePreview)await target().press('ArrowDown');
      const point=await svg().locator('.q3-note-preview text.q3-complete-note,.q3-note-preview text.q3-notehead').first().evaluate(n=>{const point=n.ownerSVGElement.createSVGPoint();point.x=Number(n.getAttribute('x'));point.y=Number(n.getAttribute('y'));const svg=n.ownerSVGElement,r=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal,p={x:r.left+(point.x-vb.x)*r.width/vb.width,y:r.top+(point.y-vb.y)*r.height/vb.height},v=visualViewport,hit=document.elementFromPoint(p.x,p.y);return{x:p.x,y:p.y,scale:v.scale,offsetX:v.offsetLeft,offsetY:v.offsetTop,hit:hit?.outerHTML.slice(0,400)};});
      item.trials.push({route,slot,point});
      if(route==='contextmenu')await page.mouse.click(point.x,point.y,{button:'right'});
      else if(route==='doubleclick')await page.mouse.dblclick(point.x,point.y,{delay:40});
      else{
       const x=engine==='webkit'?(point.x-point.offsetX)*point.scale:point.x,y=engine==='webkit'?(point.y-point.offsetY)*point.scale:point.y;
       await page.touchscreen.tap(Math.round(x),Math.round(y));const firstTapValue=await value();item.trials[item.trials.length-1].firstTapValue=firstTapValue;check(canonical(firstTapValue)===canonical(c.expected),name+': first tap keeps the source answer stable');await page.touchscreen.tap(Math.round(x),Math.round(y));
      }
     }
     expectedTokens[slot+(c.rest?1:0)]='_';const removed=await value();check(canonical(removed)===canonical(expectedTokens.join(',')),name+': only the intended note is removed');
     if(route==='keyboard')item.trials.push({route,slot,value:removed});
     else{await setCursor(slot,c.pitches[slot]);await target().press('Enter');expectedTokens[slot+(c.rest?1:0)]=c.pitches[slot];check(canonical(await value())===canonical(c.expected),name+': source answer can be restored');check(marking.markSubquestion(part,await value()).marks===part.marks,name+': restored answer earns full credit');}
    }
    const clear=page.locator(`[data-subquestion="${c.part}"] .notation-clear-button`);
    if(touch){await clear.evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));const p=await clear.evaluate(n=>{const r=n.getBoundingClientRect(),v=visualViewport;return{x:r.x+r.width/2,y:r.y+r.height/2,scale:v.scale,offsetX:v.offsetLeft,offsetY:v.offsetTop,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML.slice(0,500)};});item.clearTrace={route,...p};await page.touchscreen.tap(engine==='webkit'?Math.round((p.x-p.offsetX)*p.scale):p.x,engine==='webkit'?Math.round((p.y-p.offsetY)*p.scale):p.y);item.clearTrace.valueAfter=await value();}else await clear.click();check(!await value(),route+': Clear restores a genuinely blank field');
   }catch(e){item.errors.push(route+': '+e.stack);}finally{clearTimeout(routeTimeout);await context.close();}
  }
  result.parts.push(item);fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(c.paper,c.part,JSON.stringify({slots:item.slots,trials:item.trials.length,failed:item.checks.filter(c=>!c.passed),errors:item.errors}));
 }}finally{await browser.close();server.close();}
 process.exitCode=result.parts.some(p=>p.errors.length||p.checks.some(c=>!c.passed))?1:0;
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
