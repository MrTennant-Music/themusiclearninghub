const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict'),
  C = require('../music-games/core'),
  G = require('../music-dictionary/quiz-collections'),
  S = require('./music-games-dictionary-content.cjs');
function run() {
  const index = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../music-games/activities/index.json'))),
    report = {
      levels: 5,
      collections: 0,
      collectionActivities: 0,
      items: 0,
          gameLimits: [],
      failures: []
    },
    dir = path.resolve(__dirname, '../music-games/activities');
  const activities = index.filter(a => a.collectionId).map(entry => JSON.parse(fs.readFileSync(path.join(dir, entry.id + '.json'))));
  report.collectionActivities = activities.length;
  report.items = activities.reduce((n, a) => n + a.items.length, 0);
  for (const entry of index) try {
    assert.notEqual(entry.template, 'type-the-answer');
    assert(C.isHubLibraryTemplate(entry.template));
    const a = JSON.parse(fs.readFileSync(path.join(dir, entry.id + '.json')));
    assert.deepEqual(C.validateActivity(a), [], a.id);
    assert(C.compatibility(a.template, a).ok, a.id);
    assert.equal(a.items.length, entry.itemCount);
      if(a.collectionId&&a.specialMode==='level-test')assert.equal(a.conceptCount,a.items.length);
    if (a.collectionId) for (const row of a.items) {
      const concept = S.byId.get(row.sourceConceptId);
      assert(concept, row.id);
      assert.equal(row.prompt, S.definition(concept));
      assert(a.sourceConceptIds.includes(concept.id));
      assert.equal(row.answer, ['wordsearch', 'crossword'].includes(a.template) ? S.word(concept) : concept.name);
      for(const answer of row.distractors)for(const other of S.concepts.filter(c=>c.name===answer))assert(!require('./quiz-distractor-overlap.cjs').overlaps(concept.id,other.id),row.id+': overlapping choice '+answer);
      assert(!row.distractors.some(answer => S.alternatives(concept).some(value => S.key(answer) === S.key(value))), row.id);
    }
  } catch (error) {
    report.failures.push({
      id: entry.id,
      error: error.message
    });
  }
  for (const level of S.codes) for (const group of G.groupsForLevel(level)) {
    report.collections++;
    for (const template of ['quiz', 'true-or-false', 'match-up', 'wordsearch', 'crossword']) {
      const puzzle = ['wordsearch', 'crossword'].includes(template),
        requested = group.conceptIds.filter(id => S.byId.has(id)),
        eligible = requested.filter(id => !puzzle || S.word(S.byId.get(id))),
        packs = activities.filter(a => a.level === level && a.collectionId === group.id && a.template === template),
        actual = packs.flatMap(a => a.sourceConceptIds);
      try {
        if (eligible.length < 2 && ['match-up', 'true-or-false'].includes(template)) {
          assert.equal(actual.length, 0);
          report.gameLimits.push({
            level,
            collection: group.id,
            template,
            reason: 'This game requires at least two concepts.'
          });
        } else {
          assert.deepEqual(actual.slice().sort(), eligible.slice().sort());
          assert.equal(new Set(actual).size, actual.length);
        }
        if (eligible.length < requested.length) report.gameLimits.push({
          level,
          collection: group.id,
          template,
          omitted: requested.filter(id => !eligible.includes(id)),
          reason: 'Word puzzles require a unique alphabetical answer of at most 24 letters.'
        });
      } catch (error) {
        report.failures.push({
          level,
          collection: group.id,
          template,
          error: error.message
        });
      }
    }
  }
  return report;
}
module.exports = {
  run
};
if (require.main === module) {
  const report = run();
  fs.mkdirSync('maintenance/generated/music-games-parity', {
    recursive: true
  });
  fs.writeFileSync('maintenance/generated/music-games-parity/report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    ...report,
    gameLimits: report.gameLimits.length,
    failures: report.failures.slice(0, 5)
  }, null, 2));
  if (report.failures.length) process.exitCode = 1;
}
