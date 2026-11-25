'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/standalone');
const source = fs.readFileSync('practicequestions.html', 'utf8');
const script = source.match(/<script type="(?:text\/babel|text\/x-mlh-jsx-source)"[^>]*>([\s\S]*?)<\/script>/)[1];
const bootstrap = 'ReactDOM.createRoot(document.getElementById("root")).render(<App />);';
assert.ok(script.includes(bootstrap));
const window = {
  location: {href:'http://127.0.0.1:8765/practicequestions.html'},
  PracticeMelodyGenerator: require('../practice-melody-generator.js'),
};
for(const file of ['bravura-symbols.js','shared/shared-notation-config.js'])vm.runInNewContext(fs.readFileSync(file,'utf8'),{window});
const context = {React:require('react'),window,console,performance,URLSearchParams,setTimeout,clearTimeout};
vm.createContext(context);
// Exercise actual generation and serialization; browser checks cover score rendering.
const exposed = script.replace(bootstrap, `
  globalThis.worksheetTestApi={buildPracticeWorksheetConfig,DEFAULT_PRACTICE_QUESTION_TYPES,makeQuestion,makePracticeWorksheetQuestion,defaultPracticeQuestionTypesForLevel,practiceWorksheetQuestionTypes};
  renderPracticeWorksheetScore=async()=>({markup:'<svg></svg>',scoreWidth:100,scoreHeight:100});
`);
vm.runInContext(babel.transform(exposed,{presets:['react'],compact:true}).code,context);
for (const level of ['N3','N4','N5','H','AH']) {
  test(`${level} prepares twenty complete worksheets with the actual melody dependency`, {timeout:30000}, async () => {
    assert.equal(typeof window.PracticeMelodyGenerator.generateAdvancedHigherPlan,'function');
    const config=await context.worksheetTestApi.buildPracticeWorksheetConfig(level,context.worksheetTestApi.DEFAULT_PRACTICE_QUESTION_TYPES);
    assert.equal(config.settings.practicePapers.length,20);
    for(const paper of config.settings.practicePapers){
      assert.equal(paper.barCount,['H','AH'].includes(level)?16:8);
      assert.equal(paper.parts.length,level==='AH'?8:6);
      assert.ok(paper.parts.every(part=>part.sourceId!=='ahChordTypes'));
      assert.ok(paper.parts.every(part=>!['missing','rhythmicDictation','tempoQuestion','cadence','repeatSigns','chord','accidentals'].includes(part.sourceId)));
    }
  });
}


test('AH interactive and worksheet generation accepts every AH key through the real caller', () => {
  vm.runInContext(`
    globalThis.originalKeyPicker = randomPracticeKeyWith;
    globalThis.keyPickerLevels = [];
    randomPracticeKeyWith = (random, level) => {
      keyPickerLevels.push(level);
      return KEYS.find(key => key.id === forcedKeyId);
    };
  `, context);
  const keyAnswers = {C:'C major',F:'F major',G:'G major',Am:'A minor',D:'D major',Bb:'B flat major',Em:'E minor',Dm:'D minor'};
  try {
    for (const mode of ['interactive','worksheet']) {
      for (const [keyId, expectedAnswer] of Object.entries(keyAnswers)) {
        context.forcedKeyId = keyId;
        const question = vm.runInContext(`
          (() => {
            const settings = {...worksheetTestApi.defaultPracticeQuestionTypesForLevel('AH'),ahBassLine:false};
            return auditMode === 'worksheet'
              ? worksheetTestApi.makePracticeWorksheetQuestion('AH', worksheetTestApi.practiceWorksheetQuestionTypes(settings))
              : worksheetTestApi.makeQuestion('AH', 0, settings);
          })()
        `.replaceAll('auditMode', JSON.stringify(mode)), context, {timeout:10000});
        assert.equal(question.key.id, keyId, `${mode}: ${keyId}`);
        assert.equal(question.subquestions.find(part=>part.sourceId==='key')?.answer, expectedAnswer);
        assert.equal(question.bars.length,16);
        assert.equal(question.subquestions.length,8);
      }
    }
    assert.ok(context.keyPickerLevels.length >= 16);
    assert.ok(context.keyPickerLevels.every(level=>level==='AH'), 'AH must reach the AH key picker, not the Higher pool');
  } finally {
    vm.runInContext('randomPracticeKeyWith = originalKeyPicker;',context);
  }
});

test('audio worksheets carry listening tasks and completed answer scores at every level',{timeout:30000},async()=>{
 for(const level of ['N3','N4','N5','H','AH']){
  const config=await context.worksheetTestApi.buildPracticeWorksheetConfig(level,undefined,true);
  assert.equal(config.settings.excludeAudio,false);
  assert.equal(config.settings.practicePapers.length,20);
  for(const paper of config.settings.practicePapers){
   assert.equal(paper.parts.length,level==='AH'?8:6);
   assert.ok(paper.answerMarkup,level);
   assert.ok(paper.parts.some(part=>part.audio),level);
   for(const part of paper.parts.filter(part=>part.audio)){
    assert.ok(part.answer,level);
    assert.equal(part.playbackCue,undefined);
   }
  }
 }
});
