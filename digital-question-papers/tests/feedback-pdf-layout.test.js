'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ui=fs.readFileSync(require.resolve('../exam-ui.js'),'utf8');
const fn=ui.slice(ui.indexOf('  function measureFeedbackPdfBreakpoints('),ui.indexOf('  async function buildFeedbackPdf()'));
const context={};vm.runInNewContext(fn+';this.breakpoints=measureFeedbackPdfBreakpoints',context);
function node(top,bottom,tag='p',classes=[],leaves=[]){return{tagName:tag,closest:()=>null,classList:{contains:name=>classes.includes(name)},getBoundingClientRect:()=>({top,bottom,height:bottom-top}),querySelectorAll:selector=>selector==='.q3-staff-line'?[]:leaves};}
function paper(nodes,height,last=[]){return{getBoundingClientRect:()=>({top:0,bottom:height,height}),querySelectorAll:selector=>selector.includes('.end-of-paper')?last:nodes};}
test('PDF breaks preserve a complete staff score and its notation when it fits a page',()=>{
 const svg=node(250,850,'svg'),insideText=node(500,520),part=node(220,1000,'div',['subquestion']);
 const points=context.breakpoints(paper([svg,insideText,part],1100),{height:2200},1500);
 assert.ok(points.some(p=>p<=500));assert.ok(points.some(p=>p>=1700));
 assert.ok(points.every(p=>p<=501||p>=1699),'no page boundary may bisect the score, including boundaries offered by nested text');
});
test('PDF breaks keep a final feedback block with bottom decorations',()=>{
 const feedback=node(850,920),points=context.breakpoints(paper([feedback],1000,[feedback]),{height:2000},1500);
 assert.ok(points.includes(2000));assert.ok(!points.includes(1840),'feedback end cannot leave an isolated padding/corner page');
});
test('oversized PDF scores break between drawn systems instead of through a glyph',()=>{
 const leaves=[node(100,400,'path'),node(500,800,'path'),node(900,1200,'path')];
 const points=context.breakpoints(paper([node(50,1250,'svg',[],leaves)],1300),{height:1300},700);
 assert.ok(points.some(p=>p>=402&&p<=498));
 assert.ok(points.every(p=>!leaves.some(l=>{const r=l.getBoundingClientRect();return p>r.top&&p<r.bottom;})));
});

test('a final tall score cannot leave its bottom padding and corners on a new page',()=>{
 const svg=node(100,950,'svg'),points=context.breakpoints(paper([svg],1000,[svg]),{height:2000},1500);
 assert.ok(!points.includes(1900));assert.ok(points.includes(2000));
});

test('the last lyric table row stays with final marking feedback',()=>{
 const row=node(750,780,'tr'),feedback=node(850,940);
 const element=paper([row,feedback],1000,[feedback]);
 element.querySelectorAll=selector=>selector==='tr, svg'?[row]:selector.includes('.end-of-paper')?[feedback]:[row,feedback];
 const points=context.breakpoints(element,{height:2000},1500);
 assert.ok(points.includes(1500));
 assert.ok(!points.some(p=>p>1501&&p<1999),'last row, paper end and feedback cannot be separated');
});

test('shared one-pixel category borders do not make all rows unbreakable',()=>{
 const rows=[node(200,400,'section',['subquestion']),node(399,599,'section',['subquestion']),node(598,798,'section',['subquestion'])];
 rows.forEach(row=>{row.matches=selector=>selector==='.question-layout-category-groups .subquestion';});
 const points=context.breakpoints(paper(rows,900),{height:2250},1500);
 assert.ok(points.some(p=>p>=997&&p<=1001),'a page may break at the first shared border');
 assert.ok(points.some(p=>p>=1494&&p<=1499),'a page may break at the second shared border');
});
test('comparison category headings spanning several rows stay whole at PDF page boundaries',()=>{
 const category=node(600,800,'th'),rows=[node(600,650,'tr'),node(650,700,'tr'),node(700,750,'tr'),node(750,800,'tr')];
 const element=paper([],1000);
 element.querySelectorAll=selector=>selector.includes('th[rowspan]')?[...rows,category]:[];
 const points=context.breakpoints(element,{height:2500},2000,2.5);
 assert.ok(points.includes(1500));assert.ok(points.includes(2000));
 assert.ok(!points.some(p=>p>1500&&p<2000),'row boundaries must not split the centred category label or its spanning cell');
});
test('National 5 2015 guide cards retain every closing-border pixel on the same page',()=>{
 const card=node(1057,1302,'section',['subquestion']),inside=node(1301,1301.2);
 const element=paper([card,inside],1688);
 element.querySelectorAll=selector=>selector==='.higher-guide-box'||selector==='.q8-final-answer'||selector.includes('.end-of-paper')?[]:[card,inside];
 const points=context.breakpoints(element,{height:4220},3548,2.5);
 assert.ok(points.includes(3255));
 assert.ok(!points.includes(3253),'the old break left two capture rows of the guide border on the following page');
 assert.ok(!points.some(p=>p>2642&&p<3255));
});

test('a long final response keeps its heading and feedback together when all fit one page',()=>{
 const answer=node(200,800,'section'),feedback=node(800,1100),part=node(200,1100,'section',['subquestion']);
 answer.closest=()=>({querySelector:()=>feedback});
 const element=paper([],1400);
 element.querySelectorAll=selector=>selector==='.q8-final-answer'?[answer]:selector.includes('.end-of-paper')?[]:[answer,feedback,part];
 const points=context.breakpoints(element,{height:1400},1200);
 assert.ok(points.includes(200));assert.ok(points.includes(1100));
 assert.ok(!points.includes(800),'the feedback may not start a page apart from its written response');
});

test('a boxed guide keeps its closing border with the final answer row',()=>{
 const firstPart=node(220,400,'section',['subquestion']),lastPart=node(650,940,'section',['subquestion']),borderPoint=node(940,960),guide=node(200,970,'div');
 guide.matches=selector=>selector==='.higher-guide-box';guide.querySelectorAll=()=>[firstPart,lastPart];
 const element=paper([],1100);element.querySelectorAll=selector=>selector==='.higher-guide-box'?[guide]:selector==='.q8-final-answer'||selector.includes('.end-of-paper')?[]:[lastPart,borderPoint];
 const points=context.breakpoints(element,{height:1100},800);
 assert.ok(points.includes(650));assert.ok(points.includes(970));assert.ok(!points.includes(940));assert.ok(!points.includes(960));
});

test('a score introduction stays with its first printed staff rather than orphaning the heading',()=>{
 const lead=node(200,230,'div',['subquestion-group-heading']),part=node(230,1200,'section',['subquestion']),svg=node(400,900,'svg');
 part.previousElementSibling=lead;part.querySelector=()=>svg;svg.closest=()=>part;
 const element=paper([lead,part,svg],1300);element.querySelectorAll=selector=>selector==='.higher-guide-box'||selector==='.q8-final-answer'||selector.includes('.end-of-paper')?[]:[lead,part,svg];
 const points=context.breakpoints(element,{height:1300},800);
 assert.ok(points.includes(200));assert.ok(points.includes(900));assert.ok(!points.includes(230));assert.ok(!points.includes(400));
});

test('fractional feedback bounds cannot leave the first border pixel on the preceding PDF page',()=>{
 const feedback=node(200.25,600.75),inside=node(201,220);
 const element=paper([feedback,inside],1000);element.querySelectorAll=selector=>selector==='.higher-guide-box'||selector==='.q8-final-answer'||selector.includes('.end-of-paper')?[]:[feedback,inside];
 const points=context.breakpoints(element,{height:1000},800);
 assert.ok(points.includes(200));assert.ok(points.includes(601));assert.ok(!points.includes(201));
});

test('a rounded canvas height does not change the actual capture scale of long-paper breakpoints',()=>{
 const feedback=node(800,840),element=paper([feedback],999.25);
 element.querySelectorAll=selector=>selector==='.higher-guide-box'||selector==='.q8-final-answer'||selector.includes('.end-of-paper')?[]:[feedback];
 const points=context.breakpoints(element,{height:2500},2200,2.5);
 assert.ok(points.includes(2000));assert.ok(points.includes(2100));assert.ok(!points.includes(2002));assert.ok(!points.includes(2102));
});

test('a boxed guide cannot leave its opening border behind when the first answer moves to a new page',()=>{
 const first=node(220,500,'section',['subquestion']),last=node(900,1150,'section',['subquestion']),guide=node(200,1170,'div'),border=node(201,202);
 guide.matches=selector=>selector==='.higher-guide-box';guide.querySelectorAll=()=>[first,last];
 const element=paper([],1300);element.querySelectorAll=selector=>selector==='.higher-guide-box'?[guide]:selector==='.q8-final-answer'||selector.includes('.end-of-paper')?[]:[first,last,border];
 const points=context.breakpoints(element,{height:1300},800,1);
 assert.ok(points.includes(200));assert.ok(!points.includes(201));assert.ok(!points.includes(220));assert.ok(points.includes(500));
});

test('adjacent fractional answer boundaries remain available instead of joining two page-sized blocks',()=>{
 const first=node(1906.375,2798.578125,'section'),second=node(2798.578125,3678.21875,'section');
 const firstFeedback=node(2450.96875,2798.578125),secondFeedback=node(3309.578125,3678.21875);
 first.closest=()=>({querySelector:()=>firstFeedback});second.closest=()=>({querySelector:()=>secondFeedback});
 const element=paper([],4000);
 element.querySelectorAll=selector=>selector==='.q8-final-answer'?[first,second]:selector==='.higher-guide-box'||selector.includes('.end-of-paper')?[]:[first,second,firstFeedback,secondFeedback];
 const points=context.breakpoints(element,{height:10000},3548,2.5);
 assert.ok(points.includes(6997),'the common boundary remains available after the preceding border pixel');
 assert.ok(!points.includes(6996),'the preceding feedback border cannot become a fragment on the next page');
 assert.ok(!points.some(p=>p>8273&&p<9195),'the following feedback box stays indivisible');
});

test('a short written prompt after a long score stays with its answer and feedback',()=>{
 const part=node(100,1100,'section',['subquestion']),heading=node(900,940,'div'),feedback=node(1000,1080),answer=node(960,980);
 feedback.closest=()=>({querySelector:()=>heading});
 const element=paper([],1200);
 element.querySelectorAll=selector=>selector==='.inline-answer-feedback'?[feedback]:selector==='.higher-guide-box'||selector==='.q8-final-answer'||selector.includes('.end-of-paper')?[]:[part,heading,answer,feedback];
 const points=context.breakpoints(element,{height:1200},800,1);
 assert.ok(points.includes(900));assert.ok(points.includes(1080));assert.ok(!points.some(p=>p>900&&p<1080));
});
