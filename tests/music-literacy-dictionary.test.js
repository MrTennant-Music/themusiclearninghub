const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const bank = require('../music-dictionary/music-literacy-dictionary');
const curriculum = require('../shared/music-literacy-curriculum');

const levels = ['N3', 'N4', 'N5', 'H', 'AH'];
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('every curriculum list item has exactly one entry and keeps its original practice link', () => {
  const indexed = curriculum.rows.flatMap(([, columns], i) => columns.flatMap((column, category) =>
    curriculum.entries(column).map(link => {
      const entry = bank.forCurriculum(levels[i], curriculum.entryMarkup(link));
      assert.ok(entry, link);
      assert.equal(entry.category, category);
      assert.equal(bank.entry(entry.id), entry);
      const practice = bank.practiceFor(entry);
      assert.equal(practice.href, './' + link.match(/href="([^"]+)"/)[1]);
      for (const asset of [practice.href.split('?')[0], practice.icon]) {
        assert.ok(fs.existsSync(path.join(root, asset)), asset);
      }
      const lesson = bank.videoFor(entry);
      assert.notEqual(lesson.externalOnly, true, entry.id);
      const video = new URL(lesson.sourceUrl);
      assert.match(video.searchParams.get('v'), /^[\w-]{11}$/);
      assert.equal(video.hostname, 'www.youtube.com');
      assert.ok(entry.definition && entry.caption && entry.scores.length);
      assert.ok(bank.relatedFor(entry).every(related => related !== entry && bank.entry(related.id) === related));
      return entry.id;
    })));
  assert.equal(new Set(indexed).size, bank.entries.length);
  assert.equal(indexed.length, bank.entries.length);
});

test('the dynamics entries use the replacement lessons and discard the old chapter times', () => {
  for (const [id, videoId] of [
    ['forte', 'IZH8r4tUWxI'], ['crescendo', 'IZH8r4tUWxI'], ['fortissimo', 'IZH8r4tUWxI'],
    ['diminuendo', '9hLuQCoFFOc'], ['sforzando', 'ZqqrvJBtqbM'],
  ]) {
    const lesson = bank.videoFor(bank.entry(id));
    assert.equal(lesson.videoId, videoId, id);
    assert.equal(lesson.startSeconds, undefined, id);
  }
});

test('all original notation examples and pictures render without missing symbols', () => {
  const context = vm.createContext({ React });
  context.window = context;
  vm.runInContext(read('bravura-symbols.js'), context);
  vm.runInContext(read('bravura-worksheet-outlines.js'), context);
  vm.runInContext(read('music-dictionary/literacy-notation.js'), context);
  const { LiteracyPicture, LiteracyScore } = context.MLHLiteracyNotation;
  for (const entry of bank.entries) {
    const picture = renderToStaticMarkup(React.createElement(LiteracyPicture, { picture: entry.picture }));
    assert.doesNotMatch(picture, /<span[^>]*><\/span>/, entry.id);
    const symbols = typeof entry.picture === 'string' ? entry.picture : entry.picture.symbols;
    if (context.BRAVURA_SYMBOLS[symbols]) {
      assert.match(picture, /<svg class="mc-literacy-single-symbol"[^>]*><path d="[^"]+"/, entry.id);
    }
    if (entry.picture.src) {
      assert.ok(fs.existsSync(path.join(root, entry.picture.src)), entry.id);
      assert.ok(entry.picture.alt, entry.id);
      assert.match(picture, /^<img /);
    }
    if (['dotted-minim', 'dotted-rhythms', 'dotted-crotchet', 'dotted-quaver'].includes(entry.id)) {
      const [head, dot] = Array.from(picture.matchAll(/<text x="([\d.]+)" y="(\d+)"[^>]*>([^<]+)<\/text>/g))
        .filter(match => [context.BRAVURA_SYMBOLS.noteheadHalf, context.BRAVURA_SYMBOLS.noteheadBlack,
          context.BRAVURA_SYMBOLS.augmentationDot].includes(match[3]));
      assert.equal(dot[2], head[2], entry.id + ' dot aligns with the notehead');
      assert.ok(Number(dot[1]) > Number(head[1]), entry.id + ' dot follows the notehead');
    }
    if (['repetition', 'sequences'].includes(entry.id)) {
      const staffEnd = Number(picture.match(/<line x1="5" y1="52" x2="([^"]+)" y2="52"/)[1]);
      const thickBarline = Number(picture.match(/<line x1="([^"]+)" y1="52"[^>]*y2="92" stroke-width="3"/)[1]);
      assert.equal(thickBarline + 1.5, staffEnd, entry.id + ' staff ends at the final barline');
    }
    for (const notation of entry.scores) {
      const result = renderToStaticMarkup(React.createElement(LiteracyScore, { notation }));
      assert.match(result, /^<svg/);
      assert.doesNotMatch(result, /NaN|undefined|<text[^>]*><\/text>/, notation);
    }
  }
});
