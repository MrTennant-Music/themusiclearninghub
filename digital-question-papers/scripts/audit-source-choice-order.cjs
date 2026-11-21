'use strict';
// Independent official-question text ordering check. Repeated/missing words and
// graphical choices stay explicit source-review flags, never inferred answers.
const fs=require('node:fs'),path=require('node:path'),registry=require('../paper-registry');
const root=path.resolve(__dirname,'../..'),base=path.join(root,'digital-question-papers/audit/2026-11-05');
const normal=s=>String(s).replace(/<[^>]+>/g,'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/gi,'').toLowerCase();
const papers=[];
for(const entry of Object.values(registry)){
 const paper=require(path.join(root,'digital-question-papers',entry.dataFile.split('?')[0])),source=fs.readFileSync(path.join(root,'digital-question-papers/tests/fixtures/source-text',entry.id+'-question.txt'),'utf8'),headings=[...source.matchAll(/^[ \t\f]*Question\s+(\d+)([^\n]*)/gm)],groups=[];
 for(const q of paper.questions){
  const heading=headings.find(h=>Number(h[1])===Number(q.number));if(!heading)throw new Error(entry.id+' '+q.id+' missing source heading');const end=headings.find(h=>h.index>heading.index&&Number(h[1])>Number(q.number))?.index??source.length,section=normal(source.slice(heading.index,end));
  for(const part of q.subquestions.filter(p=>['radio','checkbox'].includes(p.type))){
   let sourcePart=source.slice(heading.index,end),sourceScope='complete question';
   const letter=String(part.label||'').match(/^\(([a-z])\)$/i)?.[1];
   if(letter){const label=new RegExp('^[ \\t]*\\('+letter+'\\)','m'),match=label.exec(sourcePart);if(match){const tail=sourcePart.slice(match.index+match[0].length),next=/^[ \t]*\([a-z]\)/m.exec(tail);sourcePart=sourcePart.slice(match.index,next?match.index+match[0].length+next.index:undefined);sourceScope='printed part ('+letter+')';}}
   const exactLines=sourcePart.split('\n').map(normal);
   const choices=part.options.map(o=>{const text=normal(o.label),occurrences=[];let i=section.indexOf(text);while(i>=0&&text){occurrences.push(i);i=section.indexOf(text,i+1);}return{label:o.label,exactLinePositions:exactLines.map((line,i)=>line===text?i:-1).filter(i=>i>=0),graphical:Boolean(o.notationScore||o.flowParts||o.stackedFraction||o.secondaryLabel||o.columns),occurrences};});
   const lineUnique=choices.every(c=>!c.graphical&&c.exactLinePositions.length===1),lineOrdered=lineUnique&&choices.every((c,i)=>!i||c.exactLinePositions[0]>choices[i-1].exactLinePositions[0]);
   const unique=choices.every(c=>!c.graphical&&c.occurrences.length===1),ordered=lineOrdered||unique&&choices.every((c,i)=>!i||c.occurrences[0]>choices[i-1].occurrences[0]);
   groups.push({question:q.id,part:part.id,sourceScope,choices,status:ordered?'unique-source-order-pass':'needs-source-review',reason:ordered?lineOrdered?'Every choice is a unique whole printed line in the aligned source scope, in implemented order.':'Each exact normalised choice occurs once in this official question, in implemented order.':choices.some(c=>c.graphical)?'Graphical/column choice requires visual source comparison.':choices.some(c=>!c.occurrences.length)?'Choice text not found as one source sequence.':unique?'Unique source positions differ from implementation.':'Repeated source occurrences require part-level visual alignment.'});
  }
 }
 papers.push({id:entry.id,groups});console.log(entry.id,groups.length,'groups',groups.filter(g=>g.status!=='unique-source-order-pass').length,'review flags');
}
fs.writeFileSync(path.join(base,'source-choice-order-triage.json'),JSON.stringify({scope:'All ordinary choice lists compared independently with official question text, preserving order. Only unique exact phrase occurrences pass directly; all ambiguous/missing/graphical lists require a separate visual review. This is not source-layout certification.',papers},null,2)+'\n');
