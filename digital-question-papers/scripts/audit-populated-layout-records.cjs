'use strict';
const fs=require('node:fs'),path=require('node:path'),registry=require('../paper-registry');
const root=path.resolve(__dirname,'../..'),records=[];
for(const engine of ['chromium','webkit']){
 const file=path.join(root,`maintenance/generated/past-paper-populated-layout-${engine}-${process.env.AUDIT_LAYOUT_SUFFIX||"final"}/checks.json`),raw=JSON.parse(fs.readFileSync(file)),checks=[],papers=[];
 const check=(passed,name,details)=>checks.push({passed:!!passed,name,...details&&{details}});
 check(raw.papers.length===90,'30 papers have all three scenarios');
 for(const entry of Object.values(registry)){
  const paper=require(path.join(root,'digital-question-papers',entry.dataFile.split('?')[0])),cases=raw.papers.filter(p=>p.id===entry.id),item={id:entry.id,questions:paper.questions.length,parts:paper.questions.reduce((n,q)=>n+q.subquestions.length,0),scenarioRecords:cases.length,entryViews:0,checkedViews:0,submittedQuestionViews:0,measuredFields:0,expandedFields:0,fieldBoundsChecks:0,feedbackStatusChecks:0,fieldPairChecks:0,scenarioScores:{}};check(cases.length===3,entry.id+': three distinct scenario records');
  for(const scenario of ['accepted','incorrect','mixed']){
   const r=cases.find(p=>p.scenario===scenario);if(!r)continue;
   check(!r.errors.length&&r.checks.every(c=>c.passed),entry.id+'/'+scenario+': runtime checks pass');check(r.questions.length===paper.questions.length&&r.allFeedback?.length===paper.questions.length,entry.id+'/'+scenario+': every question measured in all states');item.scenarioScores[scenario]=r.submittedScore;if(scenario==='accepted'){check(r.populatedParts===item.parts,entry.id+': every part populated in full-credit scenario');check(r.submittedScore===40,entry.id+': actual populated submission earns 40/40');}
   item.entryViews+=r.questions.length;item.checkedViews+=r.questions.length;item.submittedQuestionViews+=r.allFeedback?.length||0;
   for(const q of paper.questions)for(const [state,view]of [['checked',r.questions.find(v=>v.id===q.id)?.checked],['submitted',r.allFeedback?.find(v=>v.id===q.id)]]){
    if(!view){check(false,entry.id+'/'+scenario+'/'+q.id+': missing '+state);continue;}
    const partResults=r.expected.questionBreakdown.find(v=>v.id===q.id).parts;
    for(const f of view.feedback){const expected=partResults.find(p=>p.id===f.part),title={correct:'Correct',partial:'Partially correct',incorrect:'Incorrect',unanswered:'Not answered',review:'Review'}[expected?.status];check(!!title&&f.status.includes(title),entry.id+'/'+scenario+'/'+q.id+'/'+f.part+': '+state+' written status matches marks');item.feedbackStatusChecks++;}
    const fields=view.fields.filter(f=>!f.coveredByMarkedOverlay);item.measuredFields+=fields.length;item.expandedFields+=fields.filter(f=>f.classes.includes('paper-expanded-answer')).length;
    for(const f of fields){const b=f.bounds;const contained=b.x>=-2&&b.y>=-2&&b.x+b.width<=view.card.width+2&&b.y+b.height<=view.card.height+2;check(contained,entry.id+'/'+scenario+'/'+q.id+'/'+(f.id||f.part)+': '+state+' answer stays inside paper',contained?null:{field:f,paper:view.card});item.fieldBoundsChecks++;check(!f.value||(f.scrollWidth<=f.clientWidth+2&&f.scrollHeight<=f.clientHeight+2),entry.id+'/'+scenario+'/'+q.id+'/'+(f.id||f.part)+': '+state+' full text visible');}
    for(let i=0;i<fields.length;i++)for(let j=i+1;j<fields.length;j++){const a=fields[i].bounds,b=fields[j].bounds,overlap=Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>2&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>2;check(!overlap,entry.id+'/'+scenario+'/'+q.id+': '+state+' answer fields do not overlap',overlap?{first:fields[i],second:fields[j]}:null);item.fieldPairChecks++;}
    check(!view.textOutsidePaper.length&&!view.answerFeedbackCollisions.length,entry.id+'/'+scenario+'/'+q.id+': '+state+' text and feedback geometry');
   }
  }
  papers.push(item);
 }
 const result={engine,scope:'Finite all-paper populated matrix: full-credit declared-answer, incorrect longer text with canonical placement tools, and mixed correct/incorrect/blank/partial responses. Source-key correctness and infinite arbitrary inputs are not inferred. Native field/field, field/paper and written-feedback checks supplement the real browser run.',papers,checks};records.push(result);console.log(engine,papers.length,'papers',checks.length,'checks',checks.filter(c=>!c.passed).length,'failures');
}
const output=path.resolve(root,process.env.AUDIT_RESULTS_FILE||'digital-question-papers/audit/2026-11-05/populated-layout-geometry.json');fs.writeFileSync(output,JSON.stringify({runs:records},null,2)+'\n');process.exitCode=records.some(r=>r.checks.some(c=>!c.passed))?1:0;
