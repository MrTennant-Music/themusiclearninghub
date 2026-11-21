'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), crypto = require('node:crypto');
const source = fs.readFileSync(require.resolve('../exam-ui'), 'utf8');
const styles = require('../source-style-overrides.json');
const registry = require('../paper-registry');
function renderer(id, question, bold = {}) {
  const c = { root: { InteractiveExamSourceBold: bold, InteractiveExamSourceStyles: styles }, paper: { id }, escapeHtml: s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'), escapeRegExp: s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') };
  vm.runInNewContext(source.slice(source.indexOf('  let paperTextQuestionId'), source.indexOf('  let engine;')) + `;paperTextQuestionId=${JSON.stringify(question)};this.render=paperTextMarkup;`, c);
  return c.render;
}
test('paper emphasis never leaks from another question and an explicit regular source rule wins', () => {
  const text = 'The music will be played twice.';
  const bold = { example: { q1: { [text.toLowerCase()]: ['twice'] }, q2: { [text.toLowerCase()]: [] } } };
  assert.match(renderer('example', 'q1', bold)(text), /<strong[^>]*>twice<\/strong>/);
  assert.equal(renderer('example', 'q2', bold)(text, ['twice']), text);
  assert.equal(renderer('example', 'q3', bold)(text), text);
  const regular = 'During the next three playings complete your answers (a) to (f).';
  assert.equal(renderer('higher-2015', 'q4')(regular, ['three']), regular);
  assert.match(renderer('higher-2017', 'q3')('The excerpt will be played twice.'), /<strong[^>]*>twice<\/strong>/);
  assert.equal(renderer('higher-2017', 'q5')('The excerpt will be played twice.'), 'The excerpt will be played twice.');
});
test('source occurrences distinguish chord-instruction or/and and preserve the printed italics and ordinals', () => {
  const p22 = require('../papers/advanced-higher-2022').questions.flatMap(q => q.subquestions).find(p => p.id === 'q2ai');
  const html22 = renderer('advanced-higher-2022', 'q2')(p22.prompt, p22.boldPhrases, p22);
  assert.match(html22, /bars 1 and 2/);
  assert.match(html22, /name <strong[^>]*>or<\/strong> number <strong[^>]*>and<\/strong>/);
  assert.match(html22, /1st or 2nd/);
  assert.equal((html22.match(/<strong/g) || []).length, 2);
  const p16 = require('../papers/advanced-higher-2016').questions.flatMap(q => q.subquestions).find(p => p.id === 'q4ei');
  const html16 = renderer('advanced-higher-2016', 'q4')(p16.prompt, [], p16);
  assert.match(html16, /name <em>or<\/em> number/);
  assert.match(html16, /1<sup>st<\/sup> or 2<sup>nd<\/sup>/);
  assert.equal((html16.match(/<em>/g) || []).length, 1);
  const dynamic = require('../papers/national5-2022').questions[2].subquestions.find(p => p.id === 'q3c');
  assert.match(renderer('national5-2022', 'q3')(dynamic.prompt), /\(<em>Italian term<\/em>\)/);
});
test('reviewed source style strings and literal occurrence ranges remain attached to current paper content', () => {
  const normal = value => value.replace(/^[•·]\s*/, '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/\s+([,.;:!?])/g, '$1').replace(/\s+/g, ' ').trim().toLowerCase();
  const strings = value => typeof value === 'string' ? [value] : Array.isArray(value) ? value.flatMap(strings) : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : [];
  let count = 0;
  for (const [id, questions] of Object.entries(styles)) {
    const paper = require(path.resolve(__dirname, '..', registry[id].dataFile.split('?')[0]));
    for (const [qid, rows] of Object.entries(questions)) for (const [key, style] of Object.entries(rows)) {
      const text = strings(paper.questions.find(q => q.id === qid)).find(s => normal(s) === key);
      assert.ok(text, id + '/' + qid + ': ' + key);
      for (const phrase of [...style.bold, ...style.italic]) {
        assert.ok(Number.isInteger(phrase.occurrence) && phrase.occurrence >= 0);
        let at = -1;
        for (let i = 0; i <= phrase.occurrence; i++) { at = text.indexOf(phrase.text, at + 1); assert.ok(at >= 0, id + '/' + qid + ': ' + phrase.text); }
      }
      assert.equal(renderer(id, qid)(text).replace(/<br \/>/g, '\n').replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'), text);
      count++;
    }
  }
  assert.equal(count, 148);
  const generated = { globalThis: {} };
  vm.runInNewContext(fs.readFileSync(require.resolve('../source-bold-map'), 'utf8'), generated);
  assert.deepEqual(JSON.parse(JSON.stringify(generated.globalThis.InteractiveExamSourceStyles)), styles);
  const root = path.resolve(__dirname, '../..');
  for (const p of require('./fixtures/source/fine-source-typography.json').papers) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, p.source))).digest('hex'), p.sha256, p.id + ': independent official source');
});

test('source-font lyric clearance changes only the four reviewed neighbouring word pairs', () => {
  const notation = require('../exam-notation');
  const h24 = notation.getInventory('higher-2024-q4');
  assert.deepEqual(h24.lyricOffsets[18], [0, -2, 2, 0]);
  assert.deepEqual(h24.lyricOffsets[19], [0, -5, 2, 0, 0, 4]);
  assert.deepEqual(h24.lyrics[18], [null, 'e-', 'nough', null]);
  assert.deepEqual(h24.lyrics[19], [null, "they'll", 'sing_', null, 'a', 'song____']);
  const h26 = notation.getInventory('higher-2026-q4');
  assert.deepEqual(h26.lyricOffsets[13], [0, 0, 0, -4, -7, 4, 16, 0, -4, 4]);
  assert.deepEqual(h26.lyricOffsets[18], [0, 0, 0, 0, 0, 0, -3, 4, 0, -3, 3]);
});

test('National 5 2025 retains the source mixed-weight Tonality heading', () => {
  const part = require('../papers/national5-2025').questions.find(q => q.id === 'q5').subquestions.find(p => p.id === 'q5b');
  assert.equal(part.sourceLabelWeight, 400);
  assert.match(renderer('national5-2025', 'q5')('Tonality'), /^T<strong[^>]*>onality<\/strong>$/);
});

test('AH 2017 preserves the printed 17pt L against its 11pt instruction', () => {
  const part = require('../papers/advanced-higher-2017').questions.find(q => q.id === 'q4').subquestions.find(p => p.id === 'q4d');
  assert.deepEqual(part.sourceSymbols, [{text:'L',occurrence:0,scale:17/11}]);
  const html = renderer('advanced-higher-2017','q4')(part.prompt, part.boldPhrases, part);
  assert.match(html, /paper-source-symbol/);
  assert.match(html, /font-size:1\.5454545454545454em;line-height:1/);
  assert.match(html, />L<\/strong>/);
  assert.equal(html.replace(/<[^>]*>/g, ''), part.prompt);
});
