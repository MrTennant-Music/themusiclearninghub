const test = require('node:test');
const assert = require('node:assert/strict');
const trends = require('../music-dictionary/music-literacy-exam-trends.js');
const dictionary = require('../music-dictionary/music-literacy-dictionary.js');
const {papers} = require('../data/analysis/music-literacy-yearly.json');

test('each exact-skill reference points to a reviewed task and a live Digital Past Paper question', () => {
  for (const [exam,report] of Object.entries(trends.reports)) {
    assert.deepEqual(report.years,papers.filter(paper => paper.exam === exam).map(paper => paper.year));
  }
  for (const [id,exams] of Object.entries(trends.evidence)) {
    assert.ok(dictionary.entry(id),id);
    for (const exam of Object.keys(exams)) {
      const {count,years} = trends.entry(exam,id);
      assert.equal(count,years.length);
      assert.deepEqual(years,[...new Set(years)].sort());
      for (const year of years) {
        const {tasks} = papers.find(paper => paper.exam === exam && paper.year === year);
        const questions = trends.questionsFor(exam,year,id);
        assert.equal(new Set(questions.map(question => question.id)).size,questions.length);
        for (const question of questions) {
          const context = [id,exam,year,question.number].join(' ');
          assert.ok(tasks.some(task => task.question === question.number),context);
          const url = new URL(question.href,'https://hub.example/');
          assert.equal(url.pathname,'/digital-question-papers/digitalquestionpapers.html');
          const paperId = url.searchParams.get('paper');
          assert.equal(paperId,trends.reports[exam].slug+'-'+year);
          const paper = require('../digital-question-papers/papers/'+paperId+'.js');
          const parent = paper.questions.find(part => part.id === url.searchParams.get('question'));
          assert.ok(parent?.subquestions.some(part => part.id === question.id),context);
        }
      }
    }
  }
});

test('counts distinct papers and preserves separate parts from the same year', () => {
  assert.equal(trends.entry('H','treble-down-octave-bass').count,10);
  assert.equal(trends.entry('AH','enharmonic-equivalent').count,8);
  assert.equal(trends.entry('AH','triad-inversions').count,4);
  assert.deepEqual(trends.questionsFor('AH',2016,'triad-inversions').map(item => item.number),['4(e)(i)','4(e)(ii)']);
});

test('does not conflate similar skills or count a rhythm supplied in the question', () => {
  assert.deepEqual(trends.entry('AH','five-four').years,[2018,2026]);
  assert.deepEqual(trends.entry('AH','augmented-fourth').years,[2019,2026]);
  assert.deepEqual(trends.entry('AH','diminished-fifth').years,[2024]);
  assert.deepEqual(trends.questionsFor('AH',2026,'quaver'),[]);
  assert.deepEqual(trends.questionsFor('AH',2026,'bass-up-octave-treble'),[]);
  assert.deepEqual(trends.entry('H','slurs'),{count:0,years:[]});
});
