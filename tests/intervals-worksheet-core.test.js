const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(require.resolve('../intervals-worksheet-core.js'), 'utf8'), context);
const core = context.window.MLHIntervalsWorksheet;

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

test('National 3 balances step and leap questions with valid ascending and descending notation', () => {
  const random = seededRandom(240326);
  const counts = { Step: 0, Leap: 0 };
  const directions = new Set();
  const leapSizes = new Set();
  for (let index = 0; index < 2000; index += 1) {
    const question = core.generateQuestion({ level: 'N3', random });
    const start = core.notes[question.startIndex];
    const end = core.notes[question.endIndex];
    const distance = Math.abs(end.step - start.step);
    assert.equal(question.level, 'N3');
    assert.equal(question.type, 'identify');
    assert.equal(question.typedMode, false);
    assert.ok(distance >= 1 && distance <= 7);
    assert.ok(start.step >= -2 && start.step <= 10);
    assert.ok(end.step >= -2 && end.step <= 10);
    assert.equal(question.answer, distance === 1 ? 'Step' : 'Leap');
    assert.equal(question.intervalSize, question.answer);
    assert.equal(question.answerText, question.answer);
    assert.equal(question.answerData.interval, question.answer);
    assert.equal(question.prompt, 'Is the movement a step or a leap?');
    assert.equal(question.marks, 1);
    assert.ok(!question.chromatic && !question.targetAccidental);
    assert.equal(question.direction, end.step > start.step ? 'higher' : 'lower');
    counts[question.answer] += 1;
    directions.add(`${question.answer}-${question.direction}`);
    if (distance > 1) leapSizes.add(distance + 1);
  }
  assert.ok(counts.Step > 900 && counts.Step < 1100);
  assert.equal(directions.size, 4);
  assert.deepEqual([...leapSizes].sort(), [3, 4, 5, 6, 7, 8]);
});

test('National 3 remains identification only even with a restored create setting', () => {
  const random = seededRandom(44);
  for (let index = 0; index < 100; index += 1) {
    const question = core.generateQuestion({ level: 'N3', mode: 'create', enabledModes: { identify: false, create: true }, random });
    assert.equal(question.type, 'identify');
    assert.ok(['Step', 'Leap'].includes(question.answer));
  }
});

test('Existing interval levels retain their identification and creation modes', () => {
  const random = seededRandom(500);
  for (const level of ['N5', 'H', 'AH']) {
    for (let index = 0; index < 100; index += 1) {
      const question = core.generateQuestion({ level, mode: 'create', random });
      assert.equal(question.level, level);
      assert.equal(question.type, level === 'N5' ? 'identify' : 'create');
      assert.ok(Number.isInteger(question.startIndex));
      assert.ok(Number.isInteger(question.targetIndex ?? question.endIndex));
      assert.ok(!['Step', 'Leap'].includes(question.answer));
      if (level === 'N5') assert.ok([2, 8].includes(question.intervalSize));
    }
  }
});
