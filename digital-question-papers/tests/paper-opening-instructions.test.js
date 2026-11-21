'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../exam-ui.js'),'utf8');
const start=source.indexOf('  function paperOpeningMarkup('),end=source.indexOf('\n  function ',start+1);
const context={paper:{openingInstructions:['Total marks — 40','Attempt ALL questions']},escapeHtml:s=>s};vm.runInNewContext(source.slice(start,end)+';this.opening=paperOpeningMarkup;',context);
test('source opening instructions occur only before Question 1',()=>{assert.match(context.opening({number:1}),/Total marks — 40<\/p><p>Attempt ALL questions/);assert.equal(context.opening({number:2}),'');});
test('marked feedback reuses the source opening renderer before the question heading',()=>{const result=source.slice(source.indexOf('  function renderResultsPaper()'),source.indexOf('  function updateResultNavigation()'));assert.match(result,/\$\{paperOpeningMarkup\(question\)\}\s*<header class="question-header">/);});

test('Higher 2015 retains the short printed dash on Question 1, rather than the cover dash',()=>{assert.deepEqual(require('../papers/higher-2015').openingInstructions,['Total marks - 40','Attempt ALL questions']);});

test('Advanced Higher 2025 retains the repeated printed word marks above Question 1',()=>{assert.deepEqual(require('../papers/advanced-higher-2025').openingInstructions,['Total marks — 40 marks','Attempt ALL questions']);});
