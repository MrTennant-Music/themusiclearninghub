const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(require('node:path').resolve(__dirname, '..'), name), 'utf8');
const thresholds = [10, 15, 20, 30];
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
test('all 24 streak activities use the same medal and celebration thresholds', () => {
  assert.equal(pages.length, 24);
  for (const page of pages) {
    const source = read(page);
    assert.doesNotMatch(source, /\[2,\s*4,\s*6,\s*10\]/, page);
    assert.doesNotMatch(source, /streak\s*(?:>=|===)\s*(?:2|4|6)\b/, page);
    const overrides = [...source.matchAll(/(?:MEDAL_THRESHOLDS\s*=\s*|medalThresholdValues=\{)(\[[\d,\s]+\])/g)];
    for (const match of overrides) assert.deepEqual(JSON.parse(match[1]), thresholds, page);
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
test('each local medal sound selector matches the common milestones', () => {
  const selectors = {
    'auralrecognition.html': 'medalSoundForStreak', 'cadences.html': 'medalSoundForStreak',
    'chords.html': 'medalSoundForStreak', 'repeatsigns.html': 'medalSoundForStreak',
    'rhythmicdictation.html': 'streakMedal', 'melodicdictation.html': 'missingNotesMedalSoundForStreak',
    'followthescore.html': 'followScoreMedalSoundForStreak', 'accidentals.html': 'medalNameForStreak',
    'rhythmsums.html': 'medalNameForStreak', 'tempo.html': 'medalSoundForStreak',
  };
  for (const [page, name] of Object.entries(selectors)) {
    const get = vm.runInNewContext(declaration(read(page), name) + `;${name};`);
    thresholds.forEach((streak, index) => {
      const result = get(streak);
      assert.equal(typeof result === 'object' ? result?.sound : result, sounds[index], `${page}: ${streak}`);
    });
    for (const streak of [2, 4, 6, 9]) assert.equal(get(streak), null, `${page}: premature medal`);
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

test('medal totals count unique activity, level and tier, surviving score resets and reloads', () => {
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
  assert.equal(api.totals().bronze,2);
  assert.equal(api.totals().silver,1);
  assert.equal(api.totals().gold,1);
  storage.set('mlh:activity-progress:v1:example', JSON.stringify({fields:{score:0}}));
  api = load();
  api.record('accidentals.html','N3',20);
  assert.equal(api.totals().bronze,2);
  assert.equal(api.totals().gold,1);
  assert.equal(api.totals().diamond,0);
  api.record('cadences.html','N3',30);
  assert.equal(api.totals().bronze,3);
  assert.equal(api.totals().diamond,1);
});
