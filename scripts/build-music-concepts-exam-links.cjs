const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
const d=require(path.join(root,'music-dictionary/music-concepts-data.js')),registry=require(path.join(root,'digital-question-papers/paper-registry.js')),ev=require(path.join(root,'music-dictionary/music-concepts-exam-evidence.json'));
const normal=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9/]+/g,' ').trim();
// Structured marking entries name the concept being assessed. Their longer
// accepted phrases must not also credit incidental instruments or related terms.
function answerStrings(value, parts=[], key='', scoped=false) {
 if(typeof value==='string') {
  if(['answer','answers','acceptedAnswers','acceptedKeywords','acceptedKeywordGroups','acceptedExactKeywordGroups','reasons','first','second','allTermGroups','distinctTermGroups','fallbackAnswers'].includes(key))parts.push({text:value,scoped});
 } else if(Array.isArray(value)) {
  value.forEach(item=>answerStrings(item,parts,key,scoped));
 } else if(value&&typeof value==='object') {
  if(value.correct===false||value.notationTool==='dynamic'||value.id==='dynamics'||/dynamic/i.test(value.prompt||''))return parts;
  if(value.type==='radio'&&Array.isArray(value.options)){
   const selected=value.options.find(option=>String(option?.value)===String(value.answer));
   if(selected?.label)parts.push({text:selected.label,scoped:false});
  }
  if(value.answerStyle==='reason'&&typeof value.answerDisplay==='string')parts.push({text:value.answerDisplay,scoped:false});
  const markingConcept=!value.type&&Array.isArray(value.answers)&&typeof value.label==='string';
  if(markingConcept)parts.push({text:value.label,scoped:true});
  for(const [field,item] of Object.entries(value)) {
   if(field==='features'||field==='answerDisplay')continue;
   answerStrings(item,parts,field,scoped||markingConcept);
  }
 }
 return parts;
}
const aliases={
 // Episode remains an accepted printed-paper term within the merged Rondo entry.
 'MC-0189':['rondo','ABACA','episode','episodes'],
 'MC-0009':['ascending scale','ascending scales'], 'MC-0012':['descending scale','descending scales'],
 'MC-0015':['octave leap','octave jump','leap of an octave'],
 'MC-0081':['change of key to relative minor'], 'MC-0240':['modulation or modulation to relative minor','modulates to the relative minor'],
 'MC-0085':['major and minor'], 'MC-0137':['timpani rolls'],
 'MC-0020':['2 beats in the bar','3 beats in the bar','4 beats in the bar','2/4','3/4','4/4'],
 'MC-0014':['improvised','improvise'], 'MC-0028':['off beat','offbeat'], 'MC-0036':['octave','8ve','8th','octave leap','octave jump','leap of an octave'], 'MC-0086':['octave','8ve','8th','octave leap','octave jump','leap of an octave'],
 'MC-0056':['percussion','tuned percussion','untuned percussion'],
 'MC-0067':['voice','vocal','vocals','male','female','singer','singers','soprano','mezzo soprano','alto','tenor','baritone'],
 'MC-0098':['compound time','6/8','9/8','12/8','4/4 to 6/8'], 'MC-0176':['compound time','6/8','9/8','12/8','4/4 to 6/8'],
 'MC-0103':['simple time','2/4','3/4','4/4'],
 'MC-0087':['ornamentation','ornaments'],
 'MC-0113':['soprano and alto','sopranos and altos'],
 'MC-0133':['snare','side drum'],
 'MC-0147':['choir'], 'MC-0162':['descant'], 'MC-0177':['cross rhythm','cross rhythms'],
 'MC-0197':['bongo','bongos'], 'MC-0209':['roll','snare drum rolls','side drum rolls'],
 'MC-0200':['con sordino trumpet'], 'MC-0204':['solo mezzo soprano'],
 'MC-0245':['irregular time','irregular metre','time changes'],
 'MC-0039':['solo strings','solo violins'], 'MC-0047':['strings and brass','brass and strings'],
 'MC-0063':['strings and brass','brass and strings'],
 'MC-0141':['solo violin','solo violins'], 'MC-0298':['soprano and countertenor'],
 'MC-0203':['hi hat','hihat','hi hats','hihats'],
 'MC-0231':['harmonic minor'], 'MC-0234':['melodic minor']
};
function terms(c){return [...new Set([c.name,...c.aliases||[],...c.name.split(/\s+or\s+|\s*\/\s*/),...(aliases[c.id]||[])].map(normal))].filter(x=>x.length>2);}
function matches(c,entry){let str=normal(entry.text);
 if(c.id==='MC-0084')str=str.replace(/(?:relative major|major (?:scale|triad|chord|2nd|3rd|6th|7th|second|third|sixth|seventh))/g,'');
 if(c.id==='MC-0085')str=str.replace(/(?:relative minor|(?:(?:harmonic|melodic|natural) )?minor (?:scale|triad|chord|2nd|3rd|6th|7th|second|third|sixth|seventh))/g,'');
 if(c.id==='MC-0173')str=str.replace(/whole tone scale/g,'');
 if(c.id==='MC-0144')str=str.replace(/da capo aria/g,'');
 if(c.id==='MC-0071')str=str.replace(/concerto grosso/g,'');
 if(c.id==='MC-0057')str=str.replace(/piano trio/g,'');
 if(c.id==='MC-0154')str=str.replace(/symphony orchestra/g,'');
 if(c.id==='MC-0134')str=str.replace(/mezzo soprano/g,'');
 if(c.id==='MC-0147')str=str.replace(/verse and chorus/g,'');
 if(c.id==='MC-0067')str=str.replace(/backing vocals/g,'');
 if(c.id==='MC-0115')str=str.replace(/(?:double|walking|ground|alberti|inverted|electric|guitar) bass|bass (?:guitar|drum|clarinet|line|ostinato|part)/g,'');
 return terms(c).some(t=>{
  const variants=[t,t+'s'];
  if(t.endsWith('s')&&t.length>4)variants.push(t.slice(0,-1));
  if(variants.includes(str))return true;
  if(entry.scoped||['MC-0010','MC-0204'].includes(c.id))return false;
  const padded=' '+str+' ';
  return variants.some(variant=>padded.includes(' '+variant+' '));
 });
}
function semanticMatch(c,q){return q.subquestions.some(s=>{
 if(['MC-0082','MC-0157'].includes(c.id))return /chord/i.test(s.prompt||'')&&((s.acceptedAnswers||[]).length||s.answer)&&/\b(?:i|iv|v|vi)\b/.test(normal(JSON.stringify([s.answer,s.acceptedAnswers,s.answerReference])));
 if(c.id==='MC-0278')return (s.markingProfile==='chord-inversions'&&(s.acceptedAnswers||[]).some(a=>/\biib\b/.test(normal(a))))||(/chord/i.test(s.prompt||'')&&/\bII(?:b)?\b/i.test(JSON.stringify([s.answer,s.acceptedAnswers,s.answerDisplay,s.answerReference])));
 if(c.id==='MC-0279')return (s.markingProfile==='chord-inversions'&&(s.acceptedAnswers||[]).some(a=>/\bib\b/.test(normal(a))))||(/(?:chords?|chord information)/i.test(s.prompt||'')&&/(?:\bI\b|\bIV\b|\bV\b|\bVI\b|first inversion|second inversion)/i.test(JSON.stringify([s.answer,s.acceptedAnswers,s.answerDisplay,s.answerReference])));
 if(c.id==='MC-0277')return /augmented triad/i.test([s.prompt,s.inlineAnswer?.after,s.answerDisplay].join(' '))||(s.acceptedAnswers||[]).some(a=>normal(a)==='augmented');
 if(c.id==='MC-0233')return /interval|\b[2-8](?:nd|rd|th) (?:higher|lower)/i.test(s.prompt||'')||/(?:tritone|(?:perfect|major|minor|augmented|diminished )?[2-8](?:nd|rd|th))/i.test(JSON.stringify([s.answer,s.acceptedAnswers,s.answerDisplay]));
 if(c.id==='MC-0087')return /ornament/i.test(s.prompt||'');
 if(['MC-0036','MC-0086'].includes(c.id))return /octave/i.test(s.prompt||'');
 if(c.id==='MC-0247')return /triplet/i.test(String(s.answer||''));
 if(c.id==='MC-0230')return (s.acceptedAnswers||[]).some(a=>/\bv7\b/.test(a));
 if(c.id==='MC-0231')return /minor scale/.test(s.prompt||'')&&(s.acceptedAnswers||[]).includes('harmonic');
 return false;
});}
// A few reviewed Advanced Higher appearances are accepted only inside the
// official broad-analysis marking instructions, so they have no standalone
// answer string in the interactive paper data. Keep those audited links
// explicit rather than guessing from distractors or surrounding prose.
const reviewedQuestionOverrides={
 // H 2024 Q6 accepts two beats when paired with compound time.
 'higher-2024':{'MC-0020':['q6']},
 'advanced-higher-2019':{'MC-0248':['q6']},
 'advanced-higher-2022':{'MC-0076':['q6'],'MC-0169':['q6']},
 'advanced-higher-2023':{'MC-0003':['q6'],'MC-0056':['q6']},
};
// Only reviewed appearances in registered digital papers become links. Never use
// distractor options, rejected answers or explanatory definitions. The narrowly
// scoped notation rules above also recognise printed interval/chord tasks.
function build({write=true}={}){
const papers={};let count=0;
for(const meta of Object.values(registry)){
 const paper=require(path.join(root,'digital-question-papers',meta.dataFile.split('?')[0]));
 const evidence=ev.papers.find(e=>e.exam===meta.levelCode&&e.year===meta.year);
 if(!evidence)continue;
 const questions={};
 for(const id of Object.keys(evidence.answers)){
  const concept=d.concepts.find(c=>c.id===id);
  const overrideIds=reviewedQuestionOverrides[meta.id]?.[id]||[];
  const matchesQuestion=paper.questions.filter(q=>answerStrings(q.subquestions).some(s=>matches(concept,s))||semanticMatch(concept,q)||overrideIds.includes(q.id));
  if(!matchesQuestion.length)throw Error(`No verified question for ${meta.id} ${id} ${concept.name}`);
  questions[id]=matchesQuestion.map(q=>({id:q.id,number:String(q.number)}));count++;
 }
 papers[meta.id]={exam:meta.levelCode,year:meta.year,title:meta.title,questions};
}
const source=`/* Generated by scripts/build-music-concepts-exam-links.cjs. */
(function(root){
 'use strict';
 const papers=${JSON.stringify(papers)};
 function questionsFor(exam,year,conceptId){
  const prefix={N5:'national5',H:'higher',AH:'advanced-higher'}[exam];
  const paperId=prefix+'-'+year,paper=papers[paperId];
  return (paper?.questions[conceptId]||[]).map(question=>({...question,paperTitle:paper.title,href:'./digital-question-papers/digitalquestionpapers.html?paper='+paperId+'&question='+question.id}));
 }
 const api={papers,questionsFor};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MusicConceptExamLinks=api;
})(typeof window!=='undefined'?window:globalThis);
`;
if(write)fs.writeFileSync(path.join(root,'music-dictionary/music-concepts-exam-links.js'),source);
console.log(`Built question links for ${count} reviewed concept appearances across ${Object.keys(papers).length} digital papers.`);

 return {papers,count};
}
if(require.main===module)build();
module.exports={build,answerStrings,matches,semanticMatch};
