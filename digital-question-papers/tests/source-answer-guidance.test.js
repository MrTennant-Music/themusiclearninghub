'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const marking = require('../exam-marking');
const { cases } = require('./fixtures/source-answer-guidance-a175.json');
test('source-confirmed numerical, symbol, alternative and combined-evidence answers retain their exact marks', () => {
  for (const item of cases) {
    const paper = require('../papers/' + item.paper);
    const part = paper.questions.flatMap(question => question.subquestions).find(part => part.id === item.part);
    assert.equal(marking.markSubquestion(part, item.value).marks, item.marks, item.paper + '/' + item.part + ': ' + JSON.stringify(item.value));
  }
});
