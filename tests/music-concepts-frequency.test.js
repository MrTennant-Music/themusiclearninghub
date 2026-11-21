const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const data=require('../music-dictionary/music-concepts-frequency.js'),dictionary=require('../music-dictionary/music-concepts-data.js'),core=require('../music-dictionary/music-concepts-frequency-core.js');
const evidence=JSON.parse(fs.readFileSync('music-dictionary/music-concepts-exam-evidence.json','utf8'));
const listed=new Set(Object.values(dictionary.tables).flat(2));
test('Every supplied marking-instruction PDF is represented once and its reviewed bytes are unchanged',()=>{
 const files=fs.readdirSync('exampapers',{recursive:true}).filter(name=>name.endsWith('.pdf')&&(/(^|\/)mi_/.test(name)||name.endsWith('Answers.pdf'))).map(name=>'exampapers/'+name).sort();
 assert.deepEqual(evidence.papers.map(p=>p.source).sort(),files);assert.equal(new Set(evidence.papers.map(p=>p.exam+'-'+p.year)).size,30);
 for(const paper of evidence.papers){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(paper.source)).digest('hex'),paper.sha256);for(const [id,answer] of Object.entries(paper.answers)){assert.ok(listed.has(id));assert.ok(answer.pages.length);assert.ok(answer.pages.every(p=>p>=3&&p<=paper.page_count));}}
});
test('All 295 current Music Concepts, including zero-frequency entries, use qualification-specific paper denominators',()=>{
 assert.equal(listed.size,295);assert.ok(!listed.has('MC-0092'));assert.equal(data.paperCount,30);
 for(const [exam,report] of Object.entries(data.reports)){
  const papers=evidence.papers.filter(p=>p.exam===exam);assert.equal(papers.length,{N5:11,H:10,AH:9}[exam]);assert.deepEqual(Object.keys(report.concepts).sort(),[...listed].sort());
  assert.equal(report.years.at(-1),2026);
  for(const [id,hit] of Object.entries(report.concepts)){
   const expected=papers.filter(p=>Object.hasOwn(p.answers,id)).map(p=>p.year);assert.deepEqual(hit.years,expected);assert.equal(hit.count,expected.length);assert.ok(Math.abs(hit.percent-100*hit.count/papers.length)<.000001);
  }
  assert.ok(Object.values(report.concepts).some(c=>c.count===0));
 }
 assert.deepEqual(data,JSON.parse(fs.readFileSync('music-dictionary/music-concepts-frequency.json','utf8')));
});
test('2026 graphical answers, accepted alternatives and explicitly rejected concepts are preserved',()=>{
 const reviewed=exam=>evidence.papers.find(p=>p.exam===exam&&p.year===2026);
 for(const exam of ['N5','H','AH']){
  const paper=reviewed(exam);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(paper.question_source)).digest('hex'),paper.question_sha256);
  for(const excluded of paper.excluded_candidates)assert.ok(!paper.answers[excluded.concept_id],exam+': '+excluded.reason);
 }
 const n5=reviewed('N5').answers,higher=reviewed('H').answers,ah=reviewed('AH').answers;
 for(const id of ['MC-0194','MC-0157','MC-0203','MC-0158','MC-0173','MC-0178'])assert.ok(n5[id],id);
 assert.ok(!n5['MC-0084']);assert.ok(!n5['MC-0175']);
 for(const id of ['MC-0082','MC-0086','MC-0233','MC-0234','MC-0245','MC-0246','MC-0259'])assert.ok(higher[id],id);
 for(const id of ['MC-0278','MC-0279','MC-0299','MC-0261','MC-0193','MC-0283','MC-0195','MC-0205','MC-0141','MC-0124','MC-0204'])assert.ok(ah[id],id);
 assert.ok(!ah['MC-0214']);assert.ok(!ah['MC-0057']);assert.ok(!ah['MC-0049']);assert.ok(!ah['MC-0020']);
 assert.equal(data.reports.N5.concepts['MC-0084'].percent,Number((100*10/11).toFixed(6)));
 for(const [exam,id] of [['N5','MC-0145'],['H','MC-0217'],['AH','MC-0264']])assert.ok(data.reports[exam].concepts[id].years.includes(2026));
});
test('Reviewed alternatives, graphical answers and rejection edge cases stay correctly classified',()=>{
 const paper=(exam,year)=>evidence.papers.find(p=>p.exam===exam&&p.year===year).answers;
 assert.ok(paper('N5',2014)['MC-0193']);assert.ok(paper('N5',2014)['MC-0205']);assert.ok(!paper('N5',2014)['MC-0046']); // Arco; not bowing.
 assert.ok(paper('N5',2017)['MC-0236']);assert.ok(paper('N5',2017)['MC-0284']); // Accepted above-level alternatives.
 assert.ok(paper('N5',2019)['MC-0175']);assert.ok(!paper('N5',2019)['MC-0173']); // Whole-tone scale is not Tone.
 assert.ok(paper('N5',2022)['MC-0097']);assert.ok(!paper('N5',2022)['MC-0204']); // Andante; mezzo forte is not a voice.
 assert.ok(!paper('H',2017)['MC-0067']); // A lyric contains 'voice'.
 assert.ok(paper('H',2023)['MC-0103']);assert.ok(!paper('H',2023)['MC-0020']); // Simple time accepted; 2/4 beats wording rejected.
 assert.ok(paper('AH',2018)['MC-0277']);assert.ok(!paper('AH',2018)['MC-0057']); // Augmented-triad score task; piano trio is not Piano.
 assert.ok(paper('AH',2022)['MC-0286']);assert.ok(!paper('AH',2022)['MC-0131']); // Fugal answer; recorder alone rejected.
 assert.ok(paper('AH',2024)['MC-0057']);assert.ok(paper('AH',2024)['MC-0123']);assert.ok(paper('AH',2024)['MC-0132']); // Correct instrument-order option.
 assert.ok(!paper('AH',2025)['MC-0154']);assert.ok(!paper('AH',2025)['MC-0103']); // Symphony orchestra; simple harmony.
});
test('Four green bands have exact, stable boundaries and textual percentages',()=>{
 for(const [percent,expected] of [[0,0],[.01,1],[25,1],[25.001,2],[50,2],[50.001,3],[75,3],[75.001,4],[100,4]])assert.equal(core.band(percent),expected);
 assert.equal(core.bands.length,4);assert.equal(core.format(100/9),'11.1%');assert.equal(core.defaultExam('National 3'),'N5');assert.equal(core.defaultExam('Higher'),'H');
 const entry=core.entry(data,'N5','MC-0193');assert.match(entry.description,/of 11 National 5 papers/);assert.equal(entry.label,core.format(entry.percent));
});
test('PDF contains each concept exactly once per qualification matrix, including all zeros',()=>{
 const pages=JSON.parse(fs.readFileSync('data/analysis/music-concepts-exam-frequency.index.json','utf8'));
 for(const exam of ['N5','H','AH']){const ids=pages.filter(p=>p.kind==='matrix'&&p.exam===exam).flatMap(p=>p.concept_ids);assert.equal(ids.length,295);assert.deepEqual(ids.sort(),[...listed].sort());}
 assert.ok(fs.statSync(data.pdf).size>30000);
});
test('Frequency data and the homepage point to the same published report',()=>{
 const reportPath='docs/music-concepts-exam-frequency.pdf';
 assert.equal(data.pdf,'./'+reportPath);
 assert.ok(fs.readFileSync('index.html','utf8').includes(`data-analysis-src="${reportPath}?`));
});
