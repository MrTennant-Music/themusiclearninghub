'use strict';
const scope=require('../music-dictionary/quiz-data/distractor-scope.json');
const escape=text=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const terms=Object.entries(scope.terms).map(([term,level])=>({term,level,pattern:new RegExp('(?<![a-z])'+escape(term)+'(?![a-z])','i')}));
function distractorScopeErrors(question){
 if(!question.options)return [];
 const ceiling=scope.levels.indexOf(question.levelCode);
 return question.options.filter(o=>!question.answer.correctOptionIds.includes(o.id)).flatMap(o=>terms.filter(t=>scope.levels.indexOf(t.level)>ceiling&&t.pattern.test(o.text)).map(t=>`${question.id} option ${o.id}: ${t.term} belongs to ${t.level}, above ${question.levelCode}`));
}
module.exports={distractorScopeErrors};
