'use strict';
// Inspect measured, actual Share slices, not just the PDF page dimensions.
// Oversized feedback requires paragraph-level/manual review and is recorded.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const base=path.resolve(root,process.env.AUDIT_PDF_BASE||'maintenance/generated/past-paper-final-contained-exports');
const records=JSON.parse(fs.readFileSync(path.join(base,'exports-accessibility.json'))).papers;
const papers=records.map(record=>{
  const checks=[],oversized=[];
  const check=(passed,name,details)=>checks.push({passed:Boolean(passed),name,...details&&{details}});
  check(Boolean(record.diagnostics?.measurements?.length),'actual capture measurements are present');
  for(const measurement of record.diagnostics?.measurements||[]){
    const capture=record.capture.find(c=>c.element.includes(`question-${measurement.id} `));
    if(capture?.renderedLayout) check(Math.abs(capture.renderedLayout.height-measurement.height)*measurement.scale<=.25,`${measurement.id}: measured and rendered clone heights agree within a quarter capture pixel`);
    const slices=record.diagnostics.slices.filter(s=>s.id===measurement.id);
    for(const box of (capture?.renderedLayout?.boxes||measurement.boxes).filter(b=>b.rowspan)){
      // Collapsed table borders share their fractional edge with the preceding
      // row. Its final border pixel stays on that page; protect the cell body.
      const start=Math.ceil(box.top*measurement.scale),end=Math.floor((box.top+box.height)*measurement.scale);
      if(end-start>measurement.capacity-2)continue;
      const cuts=slices.slice(0,-1).filter(s=>s.to>start&&s.to<end);
      check(!cuts.length,`${measurement.id}: complete comparison category spanning ${box.rowspan} rows avoids every page boundary`,cuts.length?{start,end,cuts}:null);
    }
    for(const box of (capture?.renderedLayout?.boxes||measurement.boxes).filter(b=>b.class.includes('inline-answer-feedback'))){
      const start=box.top*measurement.scale,end=(box.top+box.height)*measurement.scale;
      if(box.height*measurement.scale>measurement.capacity-2){oversized.push({question:measurement.id,part:box.part,height:box.height,capacity:measurement.capacity/measurement.scale});continue;}
      const cuts=slices.slice(0,-1).filter(s=>s.to>Math.floor(start)&&s.to<Math.ceil(end));
      check(!cuts.length,`${measurement.id}/${box.part}: complete feedback box avoids every page boundary`,cuts.length?{start,end,cuts}:null);
    }
    if (capture?.element.includes('question-layout-music-guide')) {
      for (const box of (capture.renderedLayout?.boxes || measurement.boxes).filter(b => b.class.split(' ').includes('subquestion'))) {
        const start=box.top*measurement.scale,end=(box.top+box.height)*measurement.scale;
        if (end-start>measurement.capacity-2) continue;
        const cuts=slices.slice(0,-1).filter(s=>s.to>Math.floor(start)&&s.to<Math.ceil(end));
        check(!cuts.length,`${measurement.id}/${box.part}: complete guide card border avoids every page boundary`,cuts.length?{start,end,cuts}:null);
      }
    }
    for(const box of capture?.guideFeedback||[]){
      check(box.left>=box.frameLeft&&box.right<=box.frameRight-1,`${measurement.id}/${box.part}: feedback stays inside its guide frame`,box);
    }
  }
  return{id:record.id,checks,oversizedFeedback:oversized};
});
const result={scope:'Actual exported slice endpoints against complete feedback boxes and rendered guide borders. Oversized banks remain explicit manual-review work; this is not source fidelity or PDF accessibility certification.',papers};
const output=path.resolve(root,process.env.AUDIT_RESULTS_FILE||'digital-question-papers/audit/2026-11-05/pdf-boundaries.json');
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
for(const p of papers)console.log(p.id,p.checks.length,'checks',p.checks.filter(c=>!c.passed).length,'failures',p.oversizedFeedback.length,'oversized banks');
process.exitCode=papers.some(p=>p.checks.some(c=>!c.passed))?1:0;
