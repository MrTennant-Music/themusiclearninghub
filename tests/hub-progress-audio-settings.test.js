const test = require('node:test');
const assert = require('node:assert/strict');
const {harness,values,legacyKey}=require('./helpers/hub-progress-harness.cjs');
const earned={correct:12,attempted:14,streak:7,best:10};
test('tempo and metronome preserve streak within the page; refresh resets only the current streak',()=>{
  for(const page of ['auralrecognition.html','cadences.html','chords.html','rhythmicdictation.html','melodicdictation.html','articulationmarkings.html','dynamics.html','repeatsigns.html','readingrhythms.html','followthescore.html','tempo.html']) {
    const h=harness(page);
    const initial={level:'N3',scope:'exercise',settings:{questions:['tone','tempo'],options:{tempo:{id:'adagio',bpm:60},metronome:false,metronomeOn:false,metronomeEnabled:false,followPlayback:false}}};
    let result=h.render(initial);for(const [field,value] of Object.entries(earned))result[field][1](value);h.render(initial);
    for(const tempo of [100,'allegro',{id:'andante',bpm:80}]) {
      const options={...initial,settings:{...initial.settings,options:{...initial.settings.options,tempo,bpm:140,playbackTempo:{bpm:90},metronome:true,metronomeOn:true,metronomeEnabled:true}}};
      assert.deepEqual(values(h.render(options)),earned,page);
      assert.deepEqual(values(harness(page,h.storage).render(options)),{...earned,streak:0},page+' refresh');
    }
    assert.deepEqual(values(h.render(initial)),earned,page+' return');
    assert.equal(h.storage.size,1,page+' uses one saved score');
    const otherQuestions={...initial,settings:{...initial.settings,questions:['other']}};
    assert.deepEqual(values(h.render(otherQuestions)),{correct:0,attempted:0,streak:0,best:0});
    assert.deepEqual(values(h.render({...initial,level:'N4'})),{correct:0,attempted:0,streak:0,best:0});
    assert.deepEqual(values(h.render({...initial,scope:'other'})),{correct:0,attempted:0,streak:0,best:0});
    assert.deepEqual(values(h.render(initial)),earned);
  }
});
test('migration prefers the current saved audio setup without merging attempts',()=>{
  const page='chords.html';
  const current={level:'H',settings:{questions:['major','minor'],options:{tempo:'slow',metronomeOn:true,followPlayback:false}}};
  const other={...current,settings:{...current.settings,options:{...current.settings.options,tempo:'fast',metronomeOn:false}}};
  const storage=new Map([[legacyKey(page,other),JSON.stringify({version:1,fields:{correct:99,attempted:100,streak:1,best:99}})],[legacyKey(page,current),JSON.stringify({version:1,fields:earned})]]);
  const h=harness(page,storage);
  assert.deepEqual(values(h.render(current)),{...earned,streak:0});
  assert.deepEqual(values(h.render(other)),{...earned,streak:0});
  assert.deepEqual(values(harness(page,storage).render(other)),{...earned,streak:0});
  assert.equal(storage.size,3,'old score snapshots remain recoverable');
});
test('score normalization preserves question content and exercise options',()=>{
  const h=harness('auralrecognition.html');
  const options={level:'N3',settings:{questions:{tempo:['adagio','allegro']},options:{tempo:60,metronome:false,wholeBarMode:true}}};
  const r=h.render(options);for(const [field,value] of Object.entries(earned))r[field][1](value);h.render(options);
  assert.deepEqual(values(h.render({...options,settings:{...options.settings,questions:{tempo:['adagio']}}})),{correct:0,attempted:0,streak:0,best:0});
  assert.deepEqual(values(h.render({...options,settings:{...options.settings,options:{...options.settings.options,wholeBarMode:false}}})),{correct:0,attempted:0,streak:0,best:0});
});

test('help switches share one live score, accuracy count, streak and best', () => {
  const activities = {
    'keyboardnoteidentification.html': ['showC'],
    'accidentals.html': ['showNoteNames'],
    'intervals.html': ['showHelp'],
    'transposing.html': ['noteNamesVisible'],
    'chords.html': ['showNoteNames', 'showScaleDegrees', 'highlightPlayback'],
    'rhythmsums.html': ['showRhythmGuide'],
    'followthescore.html': ['showFollowNoteNames', 'followPlayback'],
    'cadences.html': ['follow'],
  };
  for (const [page, aids] of Object.entries(activities)) {
    const h = harness(page);
    const initial = { level: 'N5', settings: { questions: ['example'] } };
    const fields = h.render(initial);
    for (const [field, value] of Object.entries(earned)) fields[field][1](value);
    h.render(initial);
    for (const name of aids) {
      const enabled = { ...initial, settings: { ...initial.settings, options: { [name]: true } } };
      const disabled = { ...enabled, settings: { ...enabled.settings, options: { [name]: false } } };
      assert.deepEqual(values(h.render(enabled)), earned, page + ' enabled ' + name);
      assert.deepEqual(values(h.render(disabled)), earned, page + ' disabled ' + name);
    }
    assert.equal(h.storage.size, 1, page);
  }
});

test('a pre-existing keyboard score without a Guide Note setting survives migration', () => {
  const page = 'keyboardnoteidentification.html';
  const old = { level: 'N3', settings: { questions: { questionTypes: { name: true, find: false } } } };
  const storage = new Map([[legacyKey(page, old), JSON.stringify({ version: 1, fields: earned })]]);
  const withGuide = { ...old, settings: { ...old.settings, options: { showC: true } } };
  const h = harness(page, storage);
  assert.deepEqual(values(h.render(withGuide)), { ...earned, streak: 0 });
  assert.deepEqual(values(h.render(old)), { ...earned, streak: 0 });
  assert.ok(storage.has(legacyKey(page, old)));
});

test('combined dictation score objects and explicit resets survive audio changes',()=>{
  const initial={score:{correct:0,attempted:0,streak:0,best:0}};
  const h=harness('melodicdictation.html',new Map(),initial);
  const options={level:'H',settings:{questions:null,options:{tempo:'medium',metronomeOn:false,followPlayback:false}}};
  let r=h.render(options);r.score[1](earned);h.render(options);
  const changed={...options,settings:{...options.settings,options:{...options.settings.options,tempo:'slow',metronomeOn:true}}};
  assert.deepEqual(values(h.render(changed)),{score:earned});
  r=h.render(changed);r.score[1](value=>({...value,correct:value.correct+1,attempted:value.attempted+1,streak:value.streak+1}));
  const advanced={correct:13,attempted:15,streak:8,best:10};
  assert.deepEqual(values(h.render(options)),{score:advanced});
  assert.deepEqual(values(harness('melodicdictation.html',h.storage,initial).render(changed)),{score:{...advanced,streak:0}});
  r=h.render(options);r.score[1](initial.score);h.render(options);
  assert.deepEqual(values(h.render(changed)),initial);
});
