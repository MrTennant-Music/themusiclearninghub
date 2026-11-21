const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../worksheet-generic.jsx'), 'utf8');
const helper = source.match(/  function nextPracticeWorksheetOffset\([\s\S]*?\n  }/)[0];
const context = vm.createContext({});
vm.runInContext(helper, context);
const next = context.nextPracticeWorksheetOffset;

test('Refresh changes a full worksheet bank without losing or duplicating papers', () => {
  const bank = Array.from({length:20}, (_,index) => index);
  let offset = 0;
  const firstPapers = new Set();
  for (let refresh = 0; refresh < 20; refresh++) {
    firstPapers.add(bank[offset]);
    const papers = bank.map((_,index) => bank[(offset+index)%bank.length]);
    assert.equal(new Set(papers).size, 20);
    const changed = next(offset,20,20);
    assert.notEqual(changed, offset);
    offset = changed;
  }
  assert.equal(firstPapers.size, 20);
});

test('Refresh advances partial selections and safely handles small banks', () => {
  assert.equal(next(0,5,20),5);
  assert.equal(next(18,5,20),3);
  assert.equal(next(0,1,1),0);
  assert.equal(next(0,1,0),0);
});
