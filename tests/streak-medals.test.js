const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(require('node:path').resolve(__dirname, '..'), name), 'utf8');
const thresholds = [10, 15, 20, 30];
const shortThresholds = [2, 4, 6, 10];
const shortThresholdPages = new Set(['chords.html', 'followthescore.html', 'melodicdictation.html', 'repeatsigns.html', 'rhythmicdictation.html']);
const sounds = ['bronze', 'silver', 'gold', 'platinum'];
const tiers = ['bronze', 'silver', 'gold', 'diamond'];
function declaration(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, name);
  let depth = 0;
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw Error(`Unclosed function ${name}`);
}
const pages = fs.readdirSync(require('node:path').resolve(__dirname, '..')).filter(name => name.endsWith('.html') && read(name).includes('ScoreStreakPanel'));
test('streak activities use the common thresholds or the configured Follow the Score thresholds', () => {
  assert.equal(pages.length, 24);
  for (const page of pages) {
    const source = read(page);
    if (page === 'followthescore.html') {
      const values = source.match(/const FOLLOW_SCORE_MEDAL_THRESHOLDS = (\[[\d,\s]+\])/);
      assert.ok(values);
      assert.deepEqual(JSON.parse(values[1]), shortThresholds);
      assert.match(source, /medalThresholdValues=\{FOLLOW_SCORE_MEDAL_THRESHOLDS\}/);
      assert.match(source, /const medalSound = followScoreMedalSoundForStreak\(nextStreak\);\s*if \(medalSound\)/);
      continue;
    }
    const expected = shortThresholdPages.has(page) ? shortThresholds : thresholds;
    const overrides = [...source.matchAll(/(?:MEDAL_THRESHOLDS\s*=\s*|medalThresholdValues=\{)(\[[\d,\s]+\])/g)];
    for (const match of overrides) assert.deepEqual(JSON.parse(match[1]), expected, page);
    if (shortThresholdPages.has(page)) {
      assert.ok(overrides.length, page);
      continue;
    }
    assert.doesNotMatch(source, /\[2,\s*4,\s*6,\s*10\]/, page);
    assert.doesNotMatch(source, /streak\s*(?:>=|===)\s*(?:2|4|6)\b/, page);
    assert.ok(source.includes('[10, 15, 20, 30]') || source.includes('[10,15,20,30]') || source.includes('medalNameForStreak(nextStreak)') || source.includes('medalBefore.sound !== medalAfter.sound') || source.includes('medalBefore.sound!==medalAfter.sound'), `${page}: celebration milestones`);
  }
  assert.match(read('shared/hub-shell.js'), /:\s*\[10, 15, 20, 30\]/);
});
test('shared medal icons and sounds agree at and between every boundary', () => {
  const get = vm.runInNewContext(declaration(read('shared/hub-audio.js'), 'getStreakMedal') + ';getStreakMedal;');
  for (let streak = 0; streak <= 35; streak++) {
    const index = thresholds.filter(value => streak >= value).length - 1;
    const medal = get(streak);
    assert.equal(medal?.tier ?? null, tiers[index] ?? null, `streak ${streak}`);
    assert.equal(medal?.sound ?? null, sounds[index] ?? null);
  }
});
test('each local medal sound selector matches its configured milestones', () => {
  const selectors = {
    'auralrecognition.html': 'medalSoundForStreak', 'cadences.html': 'medalSoundForStreak',
    'chords.html': 'medalSoundForStreak', 'repeatsigns.html': 'medalSoundForStreak',
    'rhythmicdictation.html': 'streakMedal', 'melodicdictation.html': 'missingNotesMedalSoundForStreak',
    'followthescore.html': 'followScoreMedalSoundForStreak', 'accidentals.html': 'medalNameForStreak',
    'rhythmsums.html': 'medalNameForStreak', 'tempo.html': 'medalSoundForStreak',
  };
  for (const [page, name] of Object.entries(selectors)) {
    const values = shortThresholdPages.has(page) ? shortThresholds : thresholds;
    const get = vm.runInNewContext(declaration(read(page), name) + `;${name};`, {
      FOLLOW_SCORE_MEDAL_THRESHOLDS: shortThresholds,
      MEDAL_THRESHOLDS: values,
    });
    values.forEach((streak, index) => {
      const result = get(streak);
      assert.equal(typeof result === 'object' ? result?.sound : result, sounds[index], `${page}: ${streak}`);
    });
    const exactMilestones = page === 'followthescore.html' || page === 'repeatsigns.html';
    const otherStreaks = exactMilestones ? [1, 3, 5, 7, 11, 15, 20, 30] : values === shortThresholds ? [0, 1] : [2, 4, 6, 9];
    for (const streak of otherStreaks) assert.equal(get(streak), null, `${page}: unexpected medal at ${streak}`);
  }
});
test('new saved achievements use the common streak thresholds', () => {
  const storage = new Map();
  const context = {window: {location:{href:'https://example.test/auralrecognition.html'}, localStorage:{getItem:key=>storage.get(key) ?? null,setItem:(key,value)=>storage.set(key,value)},addEventListener(){},dispatchEvent(){}},URL,CustomEvent:class{}};
  vm.runInNewContext(read('shared/hub-achievements.js'), context);
  const api = context.window.MLH.achievements;
  for (let streak = 1; streak <= 30; streak++) {
    api.record('auralrecognition.html','H',streak);
    const index = thresholds.filter(value => streak >= value).length - 1;
    assert.equal(api.get('auralrecognition.html','H').tier,tiers[index] ?? null);
    assert.equal(api.get('auralrecognition.html','H').bestStreak,streak);
  }
});

test('medal totals count the highest tier per activity and level across resets and reloads', () => {
  const storage = new Map();
  function load() {
    const context = {window: {location:{href:'https://example.test/index.html'}, localStorage:{getItem:key=>storage.get(key) ?? null,setItem:(key,value)=>storage.set(key,value)},addEventListener(){},dispatchEvent(){}},URL,CustomEvent:class{}};
    vm.runInNewContext(read('shared/hub-achievements.js'), context);
    return context.window.MLH.achievements;
  }
  let api = load();
  api.record('accidentals.html','N3',10);
  api.record('accidentals.html','N4',10);
  assert.equal(api.totals().bronze,2);
  api.record('accidentals.html','N3',0);
  api.record('accidentals.html','N3',10);
  assert.equal(api.totals().bronze,2);
  api.record('accidentals.html','N3',20);
  assert.deepEqual({...api.totals()},{bronze:1,silver:0,gold:1,diamond:0});
  storage.set('mlh:activity-progress:v1:example', JSON.stringify({fields:{score:0}}));
  api = load();
  api.record('accidentals.html','N3',20);
  assert.deepEqual({...api.totals()},{bronze:1,silver:0,gold:1,diamond:0});
  api.record('cadences.html','N3',30);
  assert.deepEqual({...api.totals()},{bronze:1,silver:0,gold:1,diamond:1});
  api.record('accidentals.html','N3',30);
  assert.deepEqual({...api.totals()},{bronze:1,silver:0,gold:0,diamond:2});
});

test('Ear Training earns one medal per exercise and level, including after reload', () => {
  const storage = new Map();
  function load() {
    const context = {window: {location:{href:'https://example.test/index.html'}, localStorage:{getItem:key=>storage.get(key) ?? null,setItem:(key,value)=>storage.set(key,value)},addEventListener(){},dispatchEvent(){}},URL,CustomEvent:class{}};
    vm.runInNewContext(read('shared/hub-page-names.js'), context);
    vm.runInNewContext(read('shared/hub-achievements.js'), context);
    return context.window.MLH.achievements;
  }
  const activity = 'auralrecognition.html';
  let api = load();
  api.record(activity, 'AH', 30);
  assert.equal(api.levelSummary(activity, 'AH').count, 1);
  api.record(activity, 'AH', 15, thresholds, 'chord');
  assert.equal(api.levelSummary(activity, 'AH').tier, 'diamond');
  assert.equal(api.totals().diamond, 1);
  api.record(activity, 'AH', 30, thresholds, 'chord');
  api.record(activity, 'AH', 30, thresholds, 'interval');
  api.record(activity, 'AH', 20, thresholds, 'interval');
  api.record(activity, 'H', 10, thresholds, 'interval');
  assert.deepEqual(Object.keys(JSON.parse(storage.get(api.storageKey)).records), ['aural-recognition.html|AH']);
  api = load();
  assert.equal(api.get(activity, 'AH', 'interval').bestStreak, 30);
  assert.equal(api.get(activity, 'AH', 'chord').tier, 'diamond');
  assert.equal(api.levelSummary(activity, 'AH').tier, 'diamond');
  assert.equal(api.levelSummary(activity, 'AH').count, 2);
  assert.deepEqual({...api.totals()}, {bronze:1,silver:0,gold:0,diamond:2});
  assert.match(read(activity), /achievementLevel=\{activeLevel\} achievementScope=\{activeTopic\}/);
});
