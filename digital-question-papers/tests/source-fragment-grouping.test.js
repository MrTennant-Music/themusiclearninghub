'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const source = require('./fixtures/source/fine-source-typography.json');

test('spoken future-question cues retain their printed question and the following score table', () => {
  const p17 = source.papers.find(p => p.id === 'advanced-higher-2017');
  const rows = p17.allFragments.filter(r => r.page === 14);
  assert.equal(rows.find(r => r.text === 'Question 5 (continued)').question, 'q5');
  assert.equal(rows.find(r => /before the start of Question 6/.test(r.text)).question, 'q5');
  assert.equal(rows.find(r => r.text === 'IVb').question, 'q5');
  const p16 = source.papers.find(p => p.id === 'advanced-higher-2016');
  assert.equal(p16.allFragments.find(r => r.page === 10 && /30 seconds before the start of Question 6/.test(r.text)).question, 'q5');
});

test('question headings preserve every source font character and inventory total after regrouping', () => {
  const before = require('./fixtures/source/a161-source-typography-before-heading-fix.json');
  const content = ({question, ...row}) => row;
  for (const p of source.papers) {
    const old = before.papers.find(b => b.id === p.id);
    assert.equal(p.sha256, old.sha256);
    assert.deepEqual(p.allFragments.map(content), old.allFragments.map(content));
    assert.equal(p.fragments.length, old.fragments.length);
  }
});
