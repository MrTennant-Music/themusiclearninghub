const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const C = require('./core.js');
const {styles, facts, sets, timeline, makeActivities} = require('../scripts/build-music-games-n3-styles.cjs');
const activities = makeActivities();
test('N3 Styles covers the Dictionary concepts across every game except Label', () => {
  assert.deepEqual(styles.map(c => c.name), ['Blues', 'Jazz', 'Latin American', 'Musical', 'Pop', 'Rock', "Rock 'n' roll", 'Scottish']);
  assert.deepEqual([...new Set(activities.map(a => a.template))].sort(), C.TEMPLATES.map(t => t.id).filter(id => id !== 'labelled-diagram').sort());
  const index = JSON.parse(fs.readFileSync('music-games/activities/index.json', 'utf8'));
  for (const a of activities) {
    assert.deepEqual(C.validateActivity(a), [], a.id);
    assert.deepEqual(JSON.parse(fs.readFileSync(`music-games/activities/${a.id}.json`, 'utf8')), a);
    const entry = index.find(row => row.id === a.id);
    assert.ok(entry, `${a.id} is available in the chooser`);
    assert.equal(entry.level, 'N3');
  }
  for (const template of ['quiz', 'match-up',  'true-or-false', 'crossword', 'wordsearch']) {
    assert.deepEqual(activities.find(a => a.template === template).items.map(i => i.answer), styles.map(c => c.name));
  }
});
test('Styles Sort uses style groups and facts, and Connections has four unique facts per style', () => {
  for (const template of ['group-sort', 'matching-pairs']) {
    const games = activities.filter(a => a.template === template);
    assert.equal(games.length, 2);
    assert.deepEqual(games.flatMap(a => [...new Set(a.items.map(i => i.group))]), sets.flat());
    games.forEach((a, index) => {
      assert.equal(a.items.length, 16);
      assert.equal(new Set(a.items.map(i => i.prompt)).size, 16);
      assert.ok(a.items.every(i => i.prompt.length <= 32), 'Fact cards stay short enough for the fixed game canvas');
      for (const group of sets[index]) {
        assert.deepEqual(a.items.filter(i => i.group === group).map(i => i.answer), facts[group]);
        assert.ok(a.items.filter(i => i.group === group).every(i => i.answer !== group));
      }
      if (template === 'group-sort') {
        const placement = Object.fromEntries(a.items.map((i, index) => [index, i.group]));
        assert.ok(C.gradeSort(a.items, placement).every(mark => mark.correct));
        placement[0] = sets[index][1];
        assert.equal(C.gradeSort(a.items, placement).filter(mark => mark.correct).length, 15);
      }
    });
  }
});
test('Styles puzzles place every style, including multiword and apostrophe answers', () => {
  const vm = require('node:vm');
  const React = require('react');
  const Babel = require('@babel/standalone');
  const context = {window: {IGCore: C}, React, setTimeout, clearTimeout};
  vm.runInNewContext(Babel.transform(fs.readFileSync('music-games/learning.jsx', 'utf8'), {presets: ['react']}).code, context);
  for (const [template, make] of [['wordsearch', 'makeWordsearch'], ['crossword', 'makeCrossword']]) {
    const a = activities.find(a => a.template === template);
    const puzzle = context.window.IGLearningPuzzles[make](a.items);
    assert.equal(puzzle.placed.length, 8, template);
    assert.deepEqual(Array.from(puzzle.placed, p => p.item.answer).sort(), styles.map(c => c.name).sort());
  }
});
test('Styles timeline preserves the approved historical subset and its source records', () => {
  assert.deepEqual(timeline.map(row => row.style), ['Blues', 'Jazz', "Rock 'n' roll", 'Rock']);
  assert.deepEqual(timeline.map(row => row.period), ['Late 1800s', 'Early 1900s spread', '1950s', '1960s expansion']);
  assert.ok(timeline.every(row => /^https:\/\/(www\.loc\.gov|music\.si\.edu|www\.nps\.gov)\//.test(row.source)));
  const order = activities.find(a => a.template === 'rank-order');
  assert.deepEqual(order.items.map(i => i.prompt), timeline.map(row => row.style + ' — ' + row.period));
  assert.match(order.instructions, /earliest first/);
  assert.match(order.instructions, /overlap/);
  assert.match(order.instructions, /not exact beginnings/);
});


