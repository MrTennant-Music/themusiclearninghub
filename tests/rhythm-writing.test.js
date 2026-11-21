const test = require('node:test');
const assert = require('node:assert/strict');
const W = require('../rhythm-writing-core.js');
function seeded(seed) { return () => { seed = (Math.imul(seed,1664525) + 1013904223) >>> 0; return seed / 2 ** 32; }; }
for (const level of Object.keys(W.levels)) {
  test(`${level}: generated bars fit their metre and use only available tools`, () => {
    const random = seeded(1234);
    for (let n=0;n<200;n++) {
      const state = W.create(level, random);
      assert.equal(state.patterns.length, W.levels[level].bars);
      for (const pattern of state.patterns) {
        assert.equal(W.total(pattern), W.capacity(state.signature));
        assert.ok(pattern.every(id => W.toolsFor(level,state.signature).includes(id)));
        assert.ok(pattern.some(id => !id.endsWith('Rest')));
      }
      assert.ok(state.entered.every(pattern => pattern.length === 0));
      assert.equal(W.correct(state), false);
      let entered = state;
      for (const pattern of state.patterns) for (const id of pattern) entered = W.append(entered,id,level);
      assert.equal(W.complete(entered), true);
      assert.equal(W.correct(entered), true);
      const full = W.append(entered,'crotchet',level);
      assert.equal(full, entered, 'Cannot overfill a bar');
      const undone = W.undo(entered);
      assert.equal(W.complete(undone), false);
      assert.equal(W.correct(undone), false);
      assert.equal(W.total(entered.entered.at(-1)),W.capacity(state.signature),'Undo is immutable');
      assert.deepEqual(W.clear(entered).entered,state.entered);
    }
  });
}
test('level progression preserves the existing Hub curriculum', () => {
  assert.deepEqual(W.levels.N3.tools,['semibreve','dottedMinim','minim','crotchet']);
  assert.ok(W.levels.N4.tools.includes('quaver') && W.levels.N4.tools.includes('semiquaver'));
  assert.ok(!W.levels.N4.tools.includes('dottedCrotchet'));
  assert.ok(W.levels.N5.tools.includes('dottedQuaver'));
  assert.ok(!W.levels.N5.tools.some(id => id.endsWith('Rest')));
  assert.ok(W.levels.H.tools.includes('tripletQuavers'));
  assert.ok(W.levels.H.tools.includes('crotchetRest'));
  assert.ok(!W.toolsFor('H','6/8').includes('tripletQuavers'));
});
test('editing can switch bars, undo across a boundary and reject unavailable tools', () => {
  let state = {signature:'4/4',patterns:[['semibreve'],['minim','minim']],entered:[[],[]],activeBar:0};
  assert.equal(W.append(state,'quaver','N3'),state);
  state = W.append(state,'semibreve','N3');
  assert.equal(state.activeBar,1);
  state = W.undo(state);
  assert.equal(state.activeBar,0);
  assert.deepEqual(state.entered,[[],[]]);
  state = {...state,activeBar:1};
  state = W.append(state,'semibreve','N3');
  state = {...state,activeBar:0};
  state = W.append(state,'semibreve','N3');
  assert.equal(W.complete(state),true);
  assert.equal(W.correct(state),false,'Equal bar length alone does not earn a correct answer');
});
test('direct placement inserts into a chosen bar and removes only the chosen item', () => {
  const blank={signature:'4/4',patterns:[['minim','crotchet','crotchet'],['semibreve']],entered:[['minim','crotchet'],[]],activeBar:0};
  const inserted=W.insert(blank,0,1,'crotchet','N3');
  assert.deepEqual(inserted.entered[0],['minim','crotchet','crotchet']);
  assert.deepEqual(blank.entered[0],['minim','crotchet']);
  const removed=W.remove(inserted,0,1);
  assert.deepEqual(removed.entered[0],['minim','crotchet']);
  const other=W.insert(removed,1,0,'semibreve','N3');
  assert.deepEqual(other.entered,[['minim','crotchet'],['semibreve']]);
  assert.equal(W.insert(other,1,0,'crotchet','N3'),other,'Overfilled placements are rejected');
  assert.equal(W.insert(other,0,1,'quaver','N3'),other,'Level restrictions apply to direct placement');
  assert.equal(W.remove(other,1,4),other);
  assert.equal(W.remove(other,9,0),other);
});
