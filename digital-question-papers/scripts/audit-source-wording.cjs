'use strict';
// Literal source comparison is triage: PDF column order and deliberate digital
// adaptations require reading the flagged passages, never automatic rewriting.
const fs=require('node:fs'),path=require('node:path'),registry=require('../paper-registry');
const base=path.resolve(__dirname,'..'),out=path.join(base,'audit/2026-11-05');
const strict=process.env.AUDIT_SOURCE_PUNCTUATION==='1';
const normal=s=>strict
 ? String(s).replace(/\[answer\]/g,'').normalize('NFKC').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[–—]/g,'-').replace(/\s+/g,'')
 : String(s).replace(/\[answer\]/g,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
function strings(value){if(typeof value==='string')return[value];if(Array.isArray(value))return value.flatMap(strings);if(value&&typeof value==='object')return ['before','text','word','after','label'].flatMap(k=>strings(value[k]));return[];}
const papers=[];
for(const entry of Object.values(registry)){
 const paper=require(path.join(base,entry.dataFile.split('?')[0])),source=fs.readFileSync(path.join(base,'tests/fixtures/source-text',`${paper.id}-question.txt`),'utf8').replace(/^(?![ \t]*Question\b)(.*?)[ \t]{3,}\d{1,2}[ \t]*$/gm,'$1').replace(/tick\s*\(3\)/gi,'tick'),all=normal(source),headings=[...source.matchAll(/^[ \t\f]*Question\s+(\d+)/gm)];
 const record={id:paper.id,scope:'Literal content comparison; typography, printed notation and deliberate adaptations need independent review',checked:0,matched:0,flagged:[]};
 for(const q of paper.questions){
  const start=headings.find(h=>h[1]===String(q.number))?.index??0,end=headings.find(h=>h.index>start&&Number(h[1])>Number(q.number))?.index??source.length,partSource=normal(source.slice(start,end));
  const inspect=(tag,value)=>{for(const text of strings(value)){if(normal(text).length<4)continue;record.checked++;if(partSource.includes(normal(text))){record.matched++;continue;}record.flagged.push({question:q.id,field:tag,text,foundElsewhere:all.includes(normal(text))});}};
  for(const key of ['intro','outro','guideIntro','contentHeading'])inspect(key,q[key]);
  for(const s of q.subquestions){
   if(!s.hidePrompt)inspect(`${s.id}.prompt`,s.promptLines||s.promptParts||s.prompt);
   for(const key of ['beforeAnswerLines','afterAnswerLines','instruction','instructionLines','leadIntro','leadLines','playbackLines','sourceHeading','finalAnswerIntro','roughWorkIntro','roughWorkBullets','roughWorkColumns','answerPrompt'])inspect(`${s.id}.${key}`,s[key]);
   if(s.type!=='notation-choice')for(const o of s.options||[])if(!o.notationScore)inspect(`${s.id}.option`,o.label);
   for(const c of s.conceptBank||[])inspect(`${s.id}.concept`,c.label);
   for(const g of s.groups||[]){inspect(`${s.id}.group`,g.label);for(const c of g.concepts||[])inspect(`${s.id}.concept`,c.label);}
   inspect(`${s.id}.lyricLines`,s.lyricLines);inspect(`${s.id}.features`,s.features);
  }
 }
 papers.push(record);
}
fs.writeFileSync(path.join(out,strict?'source-punctuation-screen.json':'source-wording-screen.json'),JSON.stringify({papers},null,2));
console.log(JSON.stringify({checked:papers.reduce((n,p)=>n+p.checked,0),matched:papers.reduce((n,p)=>n+p.matched,0),flagged:papers.reduce((n,p)=>n+p.flagged.length,0)}));
for(const p of papers)console.log(p.id,p.flagged.length);
