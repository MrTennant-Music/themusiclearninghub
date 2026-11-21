'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { EXAM_DATE, countdown } = require('../shared/home-exam-dates');
test('2027 Music exam countdown uses UK calendar dates across winter and summer', () => {
  assert.equal(EXAM_DATE, '2027-05-11');
  assert.equal(countdown(new Date('2026-11-18T21:56:00Z')).days, 174);
  assert.equal(countdown(new Date('2027-03-27T12:00:00Z')).days, 45);
  assert.equal(countdown(new Date('2027-03-28T12:00:00Z')).days, 44);
  assert.equal(countdown(new Date('2027-05-09T23:00:00Z')).full, '1 day');
  assert.equal(countdown(new Date('2027-05-10T22:59:59Z')).days, 1);
  assert.equal(countdown(new Date('2027-05-10T23:00:00Z')).full, 'Exam day today');
  assert.equal(countdown(new Date('2027-05-11T22:59:59Z')).compact, 'Today');
  assert.equal(countdown(new Date('2027-05-11T23:00:00Z')).full, 'Exams have taken place');
});
