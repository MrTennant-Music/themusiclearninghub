'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../exam-ui.js'), 'utf8');
const start = source.indexOf('  function musicGuideArrowMarkup(');
const end = source.indexOf('\n  function ', start + 1);
const context = {};
vm.runInNewContext(source.slice(start, end) + ';this.arrow=musicGuideArrowMarkup;', context);
for (const vertical of [false, true]) test(`National 5 ${vertical ? 'vertical' : 'horizontal'} guide arrow keeps positioning outside its SVG capture`, () => {
  const markup = context.arrow(vertical);
  assert.match(markup, /^<span class="music-guide-arrow /);
  assert.equal(markup.includes('is-vertical'), vertical);
  assert.match(markup, /<svg width="52" height="28" viewBox="0 0 52 28" aria-hidden="true" focusable="false">/);
  assert.match(markup, /<path d="M0 8 H35 V1 L51 14 L35 27 V20 H0 Z" \/>/);
  assert.match(markup, /<\/svg><\/span>$/);
});
