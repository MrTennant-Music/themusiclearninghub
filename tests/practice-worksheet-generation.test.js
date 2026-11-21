"use strict";
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('practicequestions.html', 'utf8');
const helper = source.slice(source.indexOf('    function makePracticeWorksheetQuestion('), source.indexOf('    async function buildPracticeWorksheetConfig('));
function run(makeQuestion, level = 'N3') {
  // This unit isolates bounded candidate retries; the full-source audit tests
  // exercise level-aware written-pool normalisation with the real generator.
  const context = { makeQuestion, practiceWorksheetQuestionTypes: types => types, level, result: null };
  vm.runInNewContext(helper + '\nresult = makePracticeWorksheetQuestion(level, {});', context);
  return context.result;
}
test('worksheet generation retries an incomplete candidate without weakening its required structure', () => {
  let calls = 0;
  const result = run(() => ({bars: Array(8).fill({}), subquestions: Array(++calls < 3 ? 5 : 6).fill({})}));
  assert.equal(calls, 3);
  assert.equal(result.subquestions.length, 6);
});
test('every level retains its bar and part counts, including AH chord exclusions', () => {
  for (const level of ['N3', 'N4', 'N5', 'H', 'AH']) {
    const bars = ['H', 'AH'].includes(level) ? 16 : 8;
    const parts = level === 'AH' ? 8 : 6;
    let calls = 0;
    const result = run(() => ({ bars: Array(bars).fill({}), subquestions: Array(parts).fill({sourceId: ++calls === 1 && level === 'AH' ? 'ahChordTypes' : 'interval'}) }), level);
    assert.equal(result.bars.length, bars);
    assert.equal(result.subquestions.length, parts);
    assert.ok(result.subquestions.every(part => part.sourceId !== 'ahChordTypes'));
  }
});
test('worksheet retries are bounded when no valid candidate can be produced', () => {
  let calls = 0;
  assert.throws(() => run(() => { calls++; return {bars: [], subquestions: []}; }), /required structure/);
  assert.equal(calls, 40);
});
