'use strict';
// Layout fixtures use declared answers, not a new independent answer-key verdict.
const marking=require('../exam-marking');
const longest=values=>[...(values||[])].map(String).sort((a,b)=>b.length-a.length)[0]||'';
const conceptText=c=>c.answers?.[0]||c.label;
function accepted(part){
 if(part.type==='comparison-grid')return {a:part.groups.flatMap(g=>g.concepts.map(c=>c.label)),b:part.groups.flatMap(g=>g.concepts.map(c=>c.label)),c:part.answers};
 if(part.type==='checkbox')return part.answers;
 if(part.type==='concept-lines')return part.conceptBank.filter(c=>c.correct).slice(0,part.requiredResponses||part.marks).map(c=>longest(c.answers||[c.label])).join('\n');
 if(part.type==='lyric-placement'){const result={};for(const c of part.concepts){const key=String(c.lines[0]);result[key]=[result[key],longest(c.answers||[c.label])].filter(Boolean).join('; ');}return result;}
 if(part.type==='structured-review'){
  let final;
  if(part.markingProfile==='advanced-conclusion')final=part.styles.map((s,i)=>`Excerpt ${i+1} is ${s.answers[0]} because of ${s.reasons[0] || s.reasonConcepts[0].allTermGroups?.map(group=>group[0]).join(' and ') || conceptText(s.reasonConcepts[0])}.`).join(' ');
  else if(part.markingProfile==='advanced-comparison')final=[...part.similarities.map(c=>`Both excerpts feature ${conceptText(c)} in the musical passages which are played.`),...part.differences.map(c=>c.answers?.[0]||c.label)].join(' ');
  else final=part.headings.map(h=>`${h.label}: ${(h.concepts||[]).map(conceptText).join('; ')}.`).join('\n');
  const value={final};for(const h of part.headings||[]){const text=`Rough work for ${h.label}: ${final}`;value[h.id]=text;if(part.roughWorkColumns)part.roughWorkColumns.forEach((_,i)=>value[`${h.id}-${i}`]=text);}
  return value;
 }
 if(part.numberedLineAnswers)return part.numberedLineAnswers.map(longest).join('\n');
 const keywordAnswers=[...(part.acceptedKeywords||[]),...(part.acceptedKeywordGroups||[]).map(g=>g.join(' ')),...(part.acceptedExactKeywordGroups||[]).map(g=>g.join(' '))];
 if(part.acceptedConcepts)keywordAnswers.push(part.acceptedConcepts.map(c=>longest(c.answers||[c.label])).join('; '));
 let answer=part.notationTool ? String(part.answer??part.acceptedAnswers?.[0]??'') : longest(part.acceptedAnswers||(part.answer===undefined?keywordAnswers:[part.answer]));
 if(part.notationTool==='accidental')answer=`${answer}@${(part.accidentalNoteIndices||[0])[0]}`;
 return answer;
}
function incorrect(part){
 if(part.type==='checkbox')return part.options.filter(o=>!part.answers.includes(o.value)).slice(0,part.maxSelections||part.marks).map(o=>o.value);
 if(part.type==='comparison-grid')return {a:part.answers,b:part.answers,c:part.groups.flatMap(g=>g.concepts).filter(c=>!part.answers.includes(c.label)).slice(0,part.requiredResponses||part.marks).map(c=>c.label)};
 if(part.type==='lyric-placement')return Object.fromEntries((part.lyrics||part.lyricLines).map((_,i)=>[String(i+1),'Unrelated answer for this lyric line']));
 if(part.type==='structured-review'){const good=accepted(part);return {...good,final:'The pupil response describes a different musical example. '.repeat(20).trim()};}
 if(part.type==='concept-lines')return Array(part.lines||part.marks).fill('Unrelated musical answer').join('\n');
 if(part.notationTool){
  if(part.notationTool==='note-entry')return String(accepted(part)).replace(/[A-G](?=[#b♭♯]?\d)/g,n=>n==='C'?'D':'C');
  if(['time-signature','dynamic','tempo','accidental'].includes(part.notationTool)){
   const option=part.options?.find(o=>marking.markSubquestion(part,o.value).marks===0);
   if(option)return part.notationTool==='accidental'?`${option.value}@${(part.accidentalNoteIndices||[0])[0]}`:option.value;
  }
  // Placement tools keep a canonical rendered answer in this long-text stress
  // scenario; their finite wrong placements have separate interaction audits.
  return accepted(part);
 }
 if(part.options)return part.options.find(o=>o.value!==part.answer)?.value||'wrong';
 const text='A deliberately incorrect longer pupil answer';
 return part.numberedLineAnswers?part.numberedLineAnswers.map(()=>text).join('\n'):part.answerStyle==='reason'?text+'. '+text+'. '+text+'.':text;
}
function fixtures(paper,scenario){const answers={};let index=0;for(const q of paper.questions)for(const part of q.subquestions){const mode=scenario==='mixed'?['accepted','incorrect','blank','partial'][index++%4]:scenario;if(mode==='blank')continue;let value=mode==='incorrect'?incorrect(part):accepted(part);if(mode==='partial'&&part.marks>1){if(Array.isArray(value))value=value.slice(0,1);else if(part.type==='concept-lines')value=String(value).split('\n')[0];else if(part.type==='comparison-grid')value={...value,c:value.c.slice(0,1)};else if(part.type==='lyric-placement')value=Object.fromEntries(Object.entries(value).slice(0,1));else if(part.type==='structured-review')value={...value,final:part.headings?.[0]?.concepts?.[0]?.answers?.[0]||'Unrelated answer'};}answers[part.id]=value;}
return answers;}
module.exports={accepted,incorrect,fixtures};
