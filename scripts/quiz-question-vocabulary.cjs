/* Check every pupil-facing field, not just distractors, against the level glossary. */
'use strict';
const scope=require('../music-dictionary/quiz-data/distractor-scope.json');
const {exceptions:teacherExceptions}=require('../music-dictionary/quiz-data/teacher-vocabulary-exceptions.json');
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const normalize=s=>String(s).toLowerCase().replace(/[’‘]/g,"'").replace(/[-–—]/g,' ').replace(/\s+/g,' ');
const terms=Object.entries(scope.terms).map(([term,level])=>({term,level,text:normalize(term)})).sort((a,b)=>b.text.length-a.text.length);
function unfamiliarTerms(value,level){
 const ceiling=scope.levels.indexOf(level);if(ceiling<0)throw new Error('Unknown question level: '+level);
 let text=normalize(value);
 text=text.replace(/\brock (?:'n'|and) roll\b/g,m=>' '.repeat(m.length));

 // A permitted whole name wins over a later term inside it: rock 'n' roll is N3.
 for(const t of terms.filter(t=>scope.levels.indexOf(t.level)<=ceiling))text=text.replace(new RegExp('(?<![a-z])'+escape(t.text)+'(?![a-z])','g'),m=>' '.repeat(m.length));
 return terms.filter(t=>scope.levels.indexOf(t.level)>ceiling).filter(t=>{
  if(t.term==='turn')return /\b(?:a|the|an) turn\b|^turn$/.test(text); // Ordinary "take turns" is not the ornament.
  const ending=t.text.endsWith('s')?'':'s?';
  return new RegExp('(?<![a-z])'+escape(t.text)+ending+'(?![a-z])').test(text);
 }).map(t=>t.term);
}
function questionVocabularyErrors(q){
 const fields=[['prompt',q.prompt],['feedback',q.feedback],...(q.options||[]).map(o=>['option '+o.id,o.text])];
 if(!q.options)fields.push(['canonical answer',q.answer.canonical]);
 return fields.flatMap(([field,text])=>unfamiliarTerms(text,q.levelCode).filter(term=>!teacherExceptions.some(e=>e.questionId===q.id&&e.field===field&&e.text===text&&e.terms.includes(term))).map(term=>`${q.id} ${field}: ${term} belongs to ${scope.terms[term]}, above ${q.levelCode}`));
}
module.exports={unfamiliarTerms,questionVocabularyErrors};
