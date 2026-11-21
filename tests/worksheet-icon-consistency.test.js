'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('worksheet controls consistently use the shared worksheet SVG', () => {
  const questionPapers = fs.readFileSync('digital-question-papers/digitalquestionpapers.html', 'utf8');
  const hubShell = fs.readFileSync('shared/hub-shell.js', 'utf8');
  const generic = fs.readFileSync('worksheet-generic.jsx', 'utf8');
  const runtime = fs.readFileSync('generated-runtimes/worksheetgenerator-2.js', 'utf8');
  const generator = fs.readFileSync('worksheetgenerator.html', 'utf8');
  const assessment = fs.readFileSync('assessment-recorder/assessment-recorder.js', 'utf8');

  assert.doesNotMatch(questionPapers, /class="exam-worksheet-button"/, "unsupported papers must not show a worksheet placeholder");
  assert.match(hubShell, /WorksheetButton[\s\S]*?src: "ui-icons\/worksheet\.svg\?v=20261103-worksheet-svg-2"/);
  assert.match(generic, /outputPdf\("print"\)[\s\S]*?<img src="ui-icons\/worksheet\.svg\?v=20261103-worksheet-svg-2"/);
  assert.match(runtime, /outputPdf\("print"\)[\s\S]*?ui-icons\/worksheet\.svg\?v=20261103-worksheet-svg-2/);
  assert.doesNotMatch(generator, /button img \{ display: none; \}/);
  assert.match(assessment, /data-print-blank-template><img src="\.\/ui-icons\/worksheet\.svg\?v=20261103-worksheet-svg-2"/);
});

test('shared headers show short action tooltips and retain the worksheet return control', () => {
  const React = require('react');
  const {renderToStaticMarkup} = require('react-dom/server');
  const vm = require('node:vm');
  const window = {location:{href:'https://hub.test/intervals.html',pathname:'/intervals.html',search:''},MLH:{}};
  const document = {currentScript:{src:'https://hub.test/shared/hub-shell.js'},addEventListener(){}};
  vm.runInNewContext(fs.readFileSync('shared/hub-shell.js','utf8'),{window,document,React,URL,URLSearchParams,TextEncoder,TextDecoder});
  const render = props => renderToStaticMarkup(React.createElement(window.MLH.AppHeader,{title:'Intervals',icon:'icon.svg',profileUsesSharedSettings:false,profileShowLabel:false,...props}));
  assert.doesNotMatch(render({}), /Create worksheet from current settings|ui-icons\/worksheet\.svg/);
  const available=render({worksheetConfig:()=>({activityId:'intervals'}),classroomPilotUrl:'keyboardnoteidentificationclassroom.html'});
  assert.match(available,/aria-label="Create worksheet from current settings"/);
  assert.match(available,/title="Generate Worksheet"/);
  assert.match(available,/title="Share"/);
  assert.match(available,/title="Host"/);
  assert.match(available,/ui-icons\/worksheet\.svg/);
  assert.match(render({worksheetMode:true}),/aria-label="Return to Intervals activity"/);
  assert.doesNotMatch(render({worksheetConfig:null}),/Create worksheet from current settings/);
});
