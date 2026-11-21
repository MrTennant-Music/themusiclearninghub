const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {parser, generator} = require('@babel/standalone').packages;

function load(name) {
  const html = fs.readFileSync(path.join(__dirname, '..', name + '.html'), 'utf8');
  const source = [...html.matchAll(/<script\b[^>]*type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]).join('\n');
  const ast = parser.parse(source, {sourceType:'script', plugins:['jsx']});
  const nodes = [];
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type) nodes.push(node);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === 'object') walk(value);
    }
  }
  walk(ast);
  return nodes;
}
const code = node => generator.default(node).code;
const pages = ['auralrecognition','tempo','cadences','chords','dynamics','articulationmarkings','repeatsigns','melodicdictation','rhythmicdictation','accidentals'];
for (const page of pages) test(`${page}: incorrect feedback keeps every listening Play control enabled`, () => {
  const nodes = load(page);
  const buttons = nodes.filter(node => node.type === 'JSXOpeningElement' && node.name.name === 'button').filter(node => {
    const click = node.attributes.find(attr => attr.name?.name === 'onClick');
    return click && /\bplay(?:QuestionAudio|Question|Excerpt|Aural)?\b/.test(code(click.value.expression));
  });
  assert.ok(buttons.length, 'the activity has an audio control');
  for (const button of buttons) {
    const disabled = button.attributes.find(attr => attr.name?.name === 'disabled');
    if (!disabled) continue;
    for (const feedback of [null, {correct:false}]) {
      assert.equal(Boolean(vm.runInNewContext(code(disabled.value.expression), {feedback, playing:false, questionVisible:true, supportsFeedbackReplay:false})), false);
    }
  }
});

for (const page of ['dynamics','articulationmarkings','repeatsigns','accidentals','rhythmicdictation']) test(`${page}: pressing Play does not trigger tap-to-continue`, () => {
  const nodes = load(page);
  const main = nodes.find(node => node.type === 'JSXOpeningElement' && node.name.name === 'main');
  const handler = main.attributes.find(attr => ['onPointerDown','onPointerDownCapture'].includes(attr.name?.name));
  let expression = handler.value.expression;
  if (expression.type === 'Identifier') expression = nodes.find(node => node.type === 'FunctionDeclaration' && node.id.name === expression.name);
  let advances = 0;
  const scope = {feedback:{correct:false},feedbackFading:false, fadeToNext:()=>advances++, fadeToNextQuestion:()=>advances++, window:{MLH:{advanceFeedbackPointerDown:()=>advances++}}};
  const fn = vm.runInNewContext('('+code(expression)+')',scope);
  fn({target:{closest:()=>({tagName:'BUTTON'})}});
  assert.equal(advances,0,'replay remains on the same question');
  fn({target:{closest:()=>null}});
  assert.equal(advances,1,'tapping outside controls still continues');
});

for (const page of ['practicequestions','followthescore']) test(`${page}: incorrect answers bypass an exhausted audio allowance without spending another play`, async () => {
  const nodes = load(page);
  const available = nodes.find(node => node.type === 'VariableDeclarator' && node.id.name === 'playsAvailable');
  assert.equal(vm.runInNewContext(code(available.init),{feedback:{correct:false},limitPlays:true,playsRemaining:0,isPlaying:false}),true);
  const handler = nodes.find(node => node.type === 'FunctionDeclaration' && node.id.name === 'handlePlayClick');
  let plays=0,spent=0;
  const fn=vm.runInNewContext('('+code(handler)+')',{
    feedback:{correct:false},isPlaying:false,audioRef:{current:null},limitPlays:true,practiceReviewMode:false,playsRemaining:0,FOLLOW_SCORE_APP:false,
    hasScrollablePracticeScore:false,setPlaysRemaining:()=>spent++,setPrompt:()=>assert.fail('feedback replay must not be blocked'),playQuestionAudio:()=>{plays++;return true;}
  });
  await fn();await fn();
  assert.equal(plays,2);assert.equal(spent,0);
});

for (const page of ['practicequestions','followthescore']) test(`${page}: restarting audio preserves the pending marking feedback`, () => {
  const nodes=load(page);
  const functions=['clearTimers','stopAudio','clearFeedbackTimers'].map(name=>nodes.find(node=>node.type==='FunctionDeclaration'&&node.id.name===name));
  const cancelled=[];
  const scope={timersRef:{current:['audio']},markingTimersRef:{current:['marking']},nextTimer:{current:null},fadeTimer:{current:null},questionLoaderTimer:{current:null},audioRef:{current:null},audioMasterRef:{current:null},markingQuestionRef:{current:null},window:{clearTimeout:id=>cancelled.push(id)},setIsPlaying(){},setActiveNoteId(){}};
  vm.createContext(scope);vm.runInContext(functions.map(code).join('\n'),scope);
  vm.runInContext('stopAudio()',scope);
  assert.ok(cancelled.includes('audio'));
  assert.ok(!cancelled.includes('marking'),'replaying must not interrupt score revelation');
  vm.runInContext('clearFeedbackTimers()',scope);
  assert.ok(cancelled.includes('marking'),'leaving feedback still cancels the old marking');
});
