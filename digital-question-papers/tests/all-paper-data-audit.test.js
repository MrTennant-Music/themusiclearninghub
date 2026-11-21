"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { audit } = require("../scripts/audit-paper-data.cjs");
const results = audit();
for (const paper of results.papers) test(`${paper.id}: every subpart passes declared-answer, blank and nonsense checks`, () => {
  assert.deepEqual(paper.issues, []);
});
