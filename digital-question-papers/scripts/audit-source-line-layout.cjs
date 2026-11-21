'use strict';
// Source-line and indentation comparison. Flags need visual review; never infer
// a source correction from normalized text or a matching screenshot alone.
const fs = require('node:fs'), path = require('node:path');
const {chromium, webkit} = require('playwright');
const {server, root} = require('./audit-papers-browser.cjs');
const registry = require('../paper-registry');
const inventory = require('../tests/fixtures/source/fine-source-typography.json');
const boundaries = require('../source-line-breaks');
const out = path.resolve(process.env.AUDIT_OUTPUT || 'maintenance/generated/past-paper-source-line-layout');
fs.mkdirSync(out, {recursive:true});
function collect() {
 const card = [...document.querySelectorAll('.question-card')].find(n=>n.getClientRects().length);
 const blocks = [], positions = [], characters = []; let text = '', rawText = '';
 const walker=document.createTreeWalker(card, NodeFilter.SHOW_TEXT); let node;
 while ((node=walker.nextNode())) {
  const parent=node.parentElement;
  if (!parent.getClientRects().length || parent.closest('svg,.visually-hidden,script,style,button,input,textarea,.exam-paper-toolbar,.question-actions,.inline-answer-feedback,[data-question-total-mark],.subquestion-heading-marks,.paper-marks-heading')) continue;
  const style=getComputedStyle(parent); if(style.visibility==='hidden')continue;
  const block=parent.closest('p,.subquestion-heading-question,.answer-option-copy,th,td,.source-paragraph,.source-replay-cue,.subquestion-heading-label,.question-intro-line,h2,h3')||parent;
  let index=blocks.findIndex(b=>b.element===block);
  if(index<0){index=blocks.length;const r=block.getBoundingClientRect();blocks.push({element:block,text:block.textContent,tag:block.tagName,class:block.className,part:block.closest('[data-subquestion]')?.dataset.subquestion,html:block.outerHTML,bounds:{x:r.x,y:r.y,width:r.width,height:r.height},normalStart:text.length});}
  for(let i=0;i<node.textContent.length;i++){
   const character=node.textContent[i],normalized=character.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g,'');
   const range=document.createRange();range.setStart(node,i);range.setEnd(node,i+1);const r=range.getBoundingClientRect();
   const rawIndex=characters.length;rawText+=character;characters.push({x:r.x,y:r.y,height:r.height});
   for(const ch of normalized){text+=ch;positions.push({x:r.x,y:r.y,height:r.height,block:index,rawIndex});}
  }
 }
 return {cardBounds:{x:card.getBoundingClientRect().x,y:card.getBoundingClientRect().y},text,positions,characters,rawText,blocks:blocks.map(({element,...b})=>b)};
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const engine=process.env.AUDIT_ENGINE||'chromium';
 const browser=await(engine==='webkit'?webkit:chromium).launch({headless:true,...(engine==='webkit'?{}:{executablePath:process.env.AUDIT_BROWSER})});
 const result={engine,scope:'Every official question body, matching independent source fragments to real HTML character positions. Line/indent flags require source/browser visual review; print-only material and engraving remain separately recorded.',papers:[]};
 try{for(const entry of Object.values(registry).filter(p=>!process.env.AUDIT_PAPER||process.env.AUDIT_PAPER.split(',').includes(p.id))){
  const context=await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(15000);
  const source=inventory.papers.find(p=>p.id===entry.id),paper=require(path.join(root,'digital-question-papers',entry.dataFile.split('?')[0]));const r={id:entry.id,source:source.source,sourceSha256:source.sha256,questions:[],errors:[]};page.on('pageerror',e=>r.errors.push(e.message));
  try{await page.goto(`http://127.0.0.1:${server.address().port}/digital-question-papers/digitalquestionpapers.html?paper=${entry.id}`);
   for(const q of paper.questions){
    await page.locator('[data-exam-menu-trigger="questions"]').click();await page.locator(`[data-go-question="${q.id}"]`).click();await page.evaluate(()=>document.fonts.ready);
    const actual=await page.evaluate(collect),fragments=[],flags=[];
    for(const [sourceIndex,f]of source.allFragments.entries()){
     if(f.question!==q.id||f.normal.length<12)continue;let start=-1;const matches=[];
     while((start=actual.text.indexOf(f.normal,start+1))>=0){const chars=actual.positions.slice(start,start+f.normal.length),ys=chars.filter((p,i)=>i===0||p.x<chars[i-1].x-2&&Math.abs(p.y-chars[i-1].y)>3);matches.push({start,end:start+f.normal.length,blocks:[...new Set(chars.map(p=>p.block))],lines:ys.length,first:chars[0],last:chars.at(-1)});}
     fragments.push({sourceIndex,page:f.page,text:f.text,box:f.box,matches});
     for(const m of matches)if(m.lines>1&&m.blocks.length===1)flags.push({kind:'source line wraps within digital block',sourceIndex,page:f.page,text:f.text,box:f.box,...m});
    }
    for(let i=0;i<fragments.length-1;i++){
     const a=fragments[i],b=fragments[i+1];if(a.page!==b.page||Math.abs(a.box[1]-b.box[1])<3||a.matches.length!==1||b.matches.length!==1)continue;
     const x=a.matches[0],y=b.matches[0];if(x.end===y.start&&x.last.block===y.first.block&&Math.abs(x.last.y-y.first.y)<2)flags.push({kind:'printed line break merged digitally',sourceIndex:a.sourceIndex,page:a.page,text:a.text,nextText:b.text,box:[Math.min(a.box[0],b.box[0]),a.box[1],Math.max(a.box[2],b.box[2]),b.box[3]],block:x.last.block,first:x.first,last:y.last});
    }
    const exactLines=[];
    for(const [key,expected]of Object.entries(boundaries[entry.id]?.[q.id]||{})){let start=-1,matches=0;while((start=actual.text.indexOf(key,start+1))>=0){const chars=actual.positions.slice(start,start+key.length);const lines=[0,...chars.flatMap((p,i)=>i>0&&p.x<chars[i-1].x-2&&Math.abs(p.y-chars[i-1].y)>3?[i]:[])];const found=lines.slice(1);const punctuation=expected.flatMap(offset=>{const next=chars[offset],opening=actual.rawText.slice(0,next.rawIndex).match(/(?:^|\s)([([{“‘"]+\s*)$/);if(!opening)return[];const first=actual.characters[next.rawIndex-opening[1].length];return[{offset,text:opening[1],passed:Math.abs(first.y-next.y)<3}];});exactLines.push({key,occurrence:++matches,expected,actual:found,punctuation,passed:JSON.stringify(found)===JSON.stringify(expected)&&punctuation.every(p=>p.passed)});}if(!matches)exactLines.push({key,expected,passed:false,reason:'complete reviewed paragraph not found'});}
    const name=`${entry.id}-${q.id}.png`,style=await page.addStyleTag({content:'.exam-header{visibility:hidden!important}'});
    try{await page.locator('[data-single-question-area] .question-card').screenshot({path:path.join(out,name)});}finally{await style.evaluate(n=>n.remove());}
    r.questions.push({id:q.id,capture:name,cardBounds:actual.cardBounds,blocks:actual.blocks,fragments,flags,exactLines});
   }
  }catch(e){r.errors.push(e.stack||String(e));}finally{await context.close();}
  result.papers.push(r);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify(result,null,2)+'\n');console.log(entry.id,r.questions.length,'questions',r.questions.flatMap(q=>q.flags).length,'line flags',r.errors);
 }}finally{await browser.close();server.close();}
 process.exitCode=result.papers.some(p=>p.errors.length||p.questions.some(q=>q.exactLines.some(c=>!c.passed)))?1:0;
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
