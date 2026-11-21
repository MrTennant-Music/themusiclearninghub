// Rebuild statistics from the manually reviewed, page-referenced evidence.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const dictionary=require('../music-dictionary/music-concepts-data.js');
const evidence=JSON.parse(fs.readFileSync(path.join(root,'music-dictionary/music-concepts-exam-evidence.json'),'utf8'));
const listed=new Set(Object.values(dictionary.tables).flat(2));
const concepts=dictionary.concepts.filter(c=>listed.has(c.id));
const expected={N5:[2014,2015,2016,2017,2018,2019,2022,2023,2024,2025,2026],H:[2015,2016,2017,2018,2019,2022,2023,2024,2025,2026],AH:[2016,2017,2018,2019,2022,2023,2024,2025,2026]};
const labels={N5:'National 5',H:'Higher',AH:'Advanced Higher'};
const sources=fs.readdirSync(path.join(root,'exampapers'),{recursive:true}).filter(name=>name.endsWith('.pdf')&&(/(^|\/)mi_/.test(name)||name.endsWith('Answers.pdf')));
if(sources.length!==evidence.papers.length)throw Error('Marking-instruction inventory changed. Review new source files before rebuilding.');
for(const paper of evidence.papers){
 const bytes=fs.readFileSync(path.join(root,paper.source));
 if(crypto.createHash('sha256').update(bytes).digest('hex')!==paper.sha256)throw Error('Source changed; re-review '+paper.source);
 if(paper.question_source&&crypto.createHash('sha256').update(fs.readFileSync(path.join(root,paper.question_source))).digest('hex')!==paper.question_sha256)throw Error('Question paper changed; re-review '+paper.question_source);
 for(const [id,answer] of Object.entries(paper.answers)){
  if(!listed.has(id)||!answer.pages.length||answer.pages.some(page=>page<3||page>paper.page_count))throw Error('Invalid evidence: '+paper.source+' '+id);
 }
}
const data={reviewedOn:evidence.reviewed_on,pdf:'./docs/music-concepts-exam-frequency.pdf',conceptCount:concepts.length,paperCount:evidence.papers.length,method:evidence.method,reports:{}};
for(const [key,years] of Object.entries(expected)){
 const papers=evidence.papers.filter(p=>p.exam===key).sort((a,b)=>a.year-b.year);
 if(JSON.stringify(papers.map(p=>p.year))!==JSON.stringify(years))throw Error('Unexpected year coverage for '+key);
 const report={label:labels[key],years,concepts:{}};
 for(const concept of concepts){
  const hits=papers.filter(p=>Object.hasOwn(p.answers,concept.id));
  report.concepts[concept.id]={count:hits.length,percent:Number((100*hits.length/papers.length).toFixed(6)),years:hits.map(p=>p.year)};
 }
 data.reports[key]=report;
}
fs.writeFileSync(path.join(root,'music-dictionary/music-concepts-frequency.json'),JSON.stringify(data,null,2)+'\n');
fs.writeFileSync(path.join(root,'music-dictionary/music-concepts-frequency.js'),'/* Generated from reviewed music-concepts-exam-evidence.json. */\n(function(root){const data='+JSON.stringify(data)+';if(typeof module!=="undefined"&&module.exports)module.exports=data;else root.MUSIC_CONCEPT_FREQUENCY=data;})(typeof window!=="undefined"?window:globalThis);\n');
console.log('Built frequency data for '+concepts.length+' dictionary concepts and '+evidence.papers.length+' reviewed papers.');
