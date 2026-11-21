const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'data/analysis', name), 'utf8'));
const analysis = read('music-literacy-analysis.json');
const yearly = read('music-literacy-yearly.json');

test('annual matrix covers every supplied paper once, without invented missing years', () => {
  const expected = {N5:[2014,2015,2016,2017,2018,2019,2022,2023,2024,2025,2026],H:[2015,2016,2017,2018,2019,2022,2023,2024,2025,2026],AH:[2016,2017,2018,2019,2022,2023,2024,2025,2026]};
  assert.equal(yearly.papers.length,30);
  for (const report of analysis.reports) {
    assert.deepEqual(report.years,expected[report.key]);
    assert.equal(report.papers,expected[report.key].length);
    assert.deepEqual(report.yearly.map(p => p.year),expected[report.key]);
  }
});

test('every tick has a source-backed, separately identified question', () => {
  for (const paper of yearly.papers) {
    assert.equal(new Set(paper.tasks.map(t => t.question)).size,paper.tasks.length,`${paper.exam} ${paper.year}`);
    for (const [source, hash] of Object.entries(paper.source_sha256)) {
      assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, source))).digest('hex'),hash);
    }
    for (const task of paper.tasks) {
      assert.match(task.question,/^\d+\([a-z]\)/);
      assert.ok(Number.isInteger(task.source_page) && task.source_page>0);
      assert.equal(typeof task.audio_required,'boolean');
      assert.ok(task.answer.length);
    }
  }
});

test('frequency counts papers, while summary totals count every marked task', () => {
  const expected = {N5:[11,66],H:[10,60],AH:[9,89]};
  for (const report of analysis.reports) {
    assert.deepEqual([report.papers,report.questions],expected[report.key]);
    assert.equal(report.questions,report.yearly.reduce((n,p) => n+p.tasks.length,0));
    assert.equal(report.audio+report.no_audio,report.questions);
    for (const [type,count] of report.frequency) assert.equal(count,report.yearly.filter(p => p.tasks.some(t => t.category===type)).length);
  }
  const ah=analysis.reports.find(r=>r.key==='AH');
  assert.equal(ah.yearly.find(p=>p.year===2026).tasks.filter(t=>t.category==='Chord identification').length,2);
  assert.equal(ah.frequency.find(([type])=>type==='Chord identification')[1],7);
  assert.equal(ah.frequency.find(([type])=>type==='Enharmonic rewriting')[1],8);
});

test('answer distributions reflect actual source years and use category totals', () => {
  for (const report of analysis.reports) for (const t of report.answers) assert.equal(t.rows.reduce((n,row)=>n+row[1],0),t.denominator);
  const higher=analysis.reports.find(r=>r.key==='H');
  assert.equal(higher.answers.find(t=>t.title==='Chord answers').denominator,18);
  assert.deepEqual(higher.answers.find(t=>t.title==='Constructed intervals').rows,[['4th',1],['5th',1]]);
  assert.equal(higher.answers.find(t=>t.title==='Underlying key').rows.find(([name])=>name==='C major')[1],1);
  const n5=analysis.reports.find(r=>r.key==='N5');
  assert.equal(n5.answers.find(t=>t.title==='Named-pitch answers').denominator,5);
});
