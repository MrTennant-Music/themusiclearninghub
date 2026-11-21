'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const path = require('node:path');
const registry = require('../paper-registry');
const source = require('./fixtures/source/fine-source-typography.json');
const captions = require('./fixtures/source-short-caption-weights.json');
const paper = id => require(path.resolve(__dirname, '..', registry[id].dataFile.split('?')[0]));

test('exact source-caption styles preserve regular labels and the exceptional serif score fonts', () => {
  let count = 0;
  for (const [id, questions] of Object.entries(captions.papers)) for (const [qid, expected] of Object.entries(questions)) {
    assert.deepEqual(paper(id).questions.find(q => q.id === qid).sourceNotationLabelWeights, expected, id + '/' + qid);
    count += Object.keys(expected).length;
  }
  assert.equal(count, 59);
  const n18 = paper('national5-2018').questions.find(q => q.id === 'q3');
  assert.deepEqual(n18.sourceNotationLabelFonts, { Rhythm: 'Times New Roman', 'Cadence:': 'Times New Roman', Notes: 'Times New Roman' });
  for (const id of ['higher-2015', 'higher-2016']) assert.ok(Object.values(paper(id).questions.find(q => q.id === 'q4').sourceNotationLabelFonts).every(font => font === 'Times New Roman'));
});

test('all eleven chord grids retain their independently extracted source weight, including bold National 5 2014', () => {
  const normal = text => text.toLowerCase().replace(/[^a-z0-9]/g, '');
  let rows = 0;
  for (const item of source.papers) {
    const data = paper(item.id);
    for (const q of data.questions) for (const part of q.subquestions) {
      if (!part.options?.some(option => option.secondaryLabel)) continue;
      const bold = item.id === 'national5-2014';
      assert.equal(part.sourceChordWeight, bold ? undefined : 400);
      for (const option of part.options) for (const text of [option.label, option.secondaryLabel]) {
        const alternatives = [normal(text), normal(text.replace(/♭/g, 'b'))];
        const matches = item.allFragments.filter(row => row.question === q.id && alternatives.includes(row.normal));
        assert.ok(matches.length, item.id + ': source row ' + text);
        assert.ok(matches.every(row => row.bold === (bold ? '1' : '0').repeat(row.normal.length)), item.id + ': printed row weight ' + text);
        rows++;
      }
    }
  }
  assert.equal(rows, 66);
});

test('Higher comparison totals preserve the regular 2015 exception and the nine printed bold totals', () => {
  let count = 0;
  for (const item of source.papers.filter(p => p.id.startsWith('higher-'))) {
    const part = paper(item.id).questions.flatMap(q => q.subquestions).find(p => p.type === 'comparison-grid');
    const bold = item.id !== 'higher-2015';
    assert.equal(Boolean(part.comparisonFooterBold), bold);
    const row = item.allFragments.find(r => /^5mar/.test(r.normal));
    assert.ok(row);
    assert.equal(row.bold, (bold ? '1' : '0').repeat(row.normal.length));
    count++;
  }
  assert.equal(count, 10);
});

test('Higher 2019 lyric clearance retains both source syllables and only their reviewed offsets', () => {
  const score = require('../exam-notation').getInventory('higher-2019-q3');
  assert.deepEqual(score.lyrics[22], ['some-', 'things___']);
  assert.deepEqual(score.lyricOffsets, { 22: [-4, 4] });
});

test('user-confirmed narrow enharmonic boxes retain their widths with captions above', () => {
  const n = require('../exam-notation');
  const a = n.getInventory('ah-2018-q4'), b = n.getInventory('ah-2019-q4');
  assert.equal(a.layout.enharmonicBox.paddingX, 25);
  assert.deepEqual(a.layout.enharmonicCaption, { placement: 'above', lines: ['(c) Enharmonic', 'note'] });
  assert.deepEqual(b.layout.enharmonicCaption, { placement: 'above', lines: ['(ii) Enharmonic'] });
  assert.deepEqual(n.getInventory('ah-2022-q4').layout.bassCaption, { inset: 4, fontSize: 17 });
  assert.deepEqual(n.getInventory('higher-2017-q4').lyricOffsets[18], [0, -8, 10, 0, -2, 4]);
  assert.deepEqual(n.getInventory('higher-2015-q4').lyricOffsets[2], {1:-4,2:10});
  assert.deepEqual(n.getInventory('higher-2015-q4').lyricOffsets[15], {0:10,5:-4,6:3,7:10});
});
