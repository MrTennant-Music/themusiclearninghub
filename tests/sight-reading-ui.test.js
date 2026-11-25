const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const React = require('react');
const Babel = require('@babel/standalone');
const Core = require('../sight-reading-core.js');
const compiled = Babel.transform(fs.readFileSync('sight-reading.jsx', 'utf8'), {presets: ['react']}).code;
const pool = [
  {pitch: 'C4', answer: 'C', clef: 'treble', step: -2},
  {pitch: 'G4', answer: 'G', clef: 'treble', step: 2}
];

// A deterministic React-hook clock harness. Timers, animation frames and
// listener disposal follow their actual effects rather than invoking callbacks
// directly, so answer edits cannot silently reset a round's deadline.
function mount(storage = new Map()) {
  let cursor = 0, now = 0, nextId = 0, dirty = true, mounted = true, tree, closes = 0;
  const slots = [], effects = [], tasks = new Map(), windowListeners = new Map(), documentListeners = new Map();
  const piano = [], feedback = [], contexts = [], scoreFrames = [];
  function listeners(map, type) {
    if (!map.has(type)) map.set(type, new Set());
    return map.get(type);
  }
  const hooks = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = {value: typeof initial === 'function' ? initial() : initial};
      return [slots[index].value, update => {
        assert.equal(mounted, true, 'No delayed state writes after unmount');
        const next = typeof update === 'function' ? update(slots[index].value) : update;
        if (!Object.is(next, slots[index].value)) { slots[index].value = next; dirty = true; }
      }];
    },
    useRef(value) {
      const index = cursor++;
      return slots[index] || (slots[index] = {current: value});
    },
    useEffect(fn, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || !deps || deps.length !== previous.deps.length || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
        slots[index] = {deps, cleanup: previous?.cleanup};
        effects.push(() => { slots[index].cleanup?.(); slots[index].cleanup = fn(); });
      }
    }
  };
  class AudioContext {
    constructor() { this.state = 'suspended'; this.destination = {}; this.resumes = 0; this.suspends = 0; this.closed = 0; contexts.push(this); }
    get currentTime() { return now / 1000; }
    resume() { this.resumes++; this.state = 'running'; return Promise.resolve(); }
    suspend() { this.suspends++; this.state = 'suspended'; return Promise.resolve(); }
    close() { this.closed++; this.state = 'closed'; return Promise.resolve(); }
  }
  const schedule = (callback, delay, kind) => { const id = ++nextId; tasks.set(id, {callback, at: now + delay, kind}); return id; };
  const context = {
    React: hooks,
    performance: {now: () => now},
    requestAnimationFrame: callback => schedule(callback, 16, 'frame'),
    cancelAnimationFrame: id => tasks.delete(id),
    setTimeout: (callback, delay = 0) => schedule(callback, delay, 'timer'),
    clearTimeout: id => tasks.delete(id),
    window: {
      AudioContext,
      localStorage: {getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value)},
      MLH: {
        SightReadingCore: {...Core, createAttempt: values => Core.createAttempt(values, () => 0), next: state => Core.next(state, () => 0)},
        prepareAudioPlayback: () => Promise.resolve(),
        playPianoFrequency: (...args) => piano.push(args),
        playFeedbackSound: (...args) => feedback.push(args)
      },
      addEventListener: (type, fn) => listeners(windowListeners, type).add(fn),
      removeEventListener: (type, fn) => listeners(windowListeners, type).delete(fn)
    },
    document: {
      hidden: false,
      addEventListener: (type, fn) => listeners(documentListeners, type).add(fn),
      removeEventListener: (type, fn) => listeners(documentListeners, type).delete(fn)
    }
  };
  vm.runInNewContext(compiled, context);
  const props = {pool, settings: {accidentals: false}, levelLabel: 'National 3', renderScore: (question, colour, progress, reducedMotion, upcoming, showNote) => { scoreFrames.push({question, colour, progress, upcoming, showNote}); return React.createElement('div', null, showNote ? question.pitch : null, colour); }, onClose: () => closes++};
  function render() {
    let passes = 0;
    while (dirty || effects.length) {
      assert.ok(++passes < 100, 'Hook updates converge');
      if (dirty) { dirty = false; cursor = 0; tree = context.window.MLH.SightReadingPractice(props); }
      while (effects.length) effects.shift()();
    }
  }
  function nodes(node, predicate) {
    if (Array.isArray(node)) return node.flatMap(child => nodes(child, predicate));
    if (!node || typeof node !== 'object') return [];
    return [...(predicate(node) ? [node] : []), ...nodes(node.props?.children, predicate)];
  }
  function text(node = tree) {
    if (Array.isArray(node)) return node.map(text).join('');
    if (node == null || typeof node === 'boolean') return '';
    if (typeof node !== 'object') return String(node);
    return node.props?.children === undefined ? '' : text(node.props.children);
  }
  function click(label) {
    const buttons = nodes(tree, node => node.type === 'button' && text(node) === label);
    assert.equal(buttons.length, 1, `One ${label} button`);
    assert.ok(!buttons[0].props.disabled, `${label} is enabled`);
    buttons[0].props.onClick();
    render();
  }
  function advance(ms) {
    const end = now + ms;
    let count = 0;
    for (;;) {
      const pending = [...tasks].filter(([, task]) => task.at <= end).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
      if (!pending) break;
      assert.ok(++count < 10000, 'Scheduled work stays bounded');
      const [id, task] = pending;
      tasks.delete(id); now = task.at; task.callback(now); render();
    }
    now = end;
  }
  function dispatch(type, event = {}, map = windowListeners) {
    for (const fn of listeners(map, type)) fn(event);
    render();
  }
  function key(key, target = {closest: () => null}, extras = {}) {
    let prevented = false;
    dispatch('keydown', {key, target, preventDefault() { prevented = true; }, ...extras});
    return prevented;
  }
  function unmount() {
    for (const slot of slots) slot?.cleanup?.();
    mounted = false;
  }
  render();
  return {click, advance, key, unmount, text, piano, feedback, contexts, tasks,
    get state() { return slots[1].value; },
    get scoreFrame() { return scoreFrames[scoreFrames.length - 1]; },
    speedGlyph: () => nodes(tree, node => node.props?.['aria-label'] === 'Speed increased').length,
    get closes() { return closes; },
    buttons: label => nodes(tree, node => node.type === 'button' && text(node) === label),
    blur: () => dispatch('blur'),
    visibility(hidden) { context.document.hidden = hidden; dispatch('visibilitychange', {}, documentListeners); },
    listenerCount: () => [...windowListeners.values(), ...documentListeners.values()].reduce((sum, set) => sum + set.size, 0)
  };
}

test('click confirms immediately, scores once and saves the highest score across reset and reopening', () => {
  const storage = new Map();
  const h = mount(storage);
  assert.match(h.text(), /National 3 • Highest score: 0/);
  assert.doesNotMatch(h.text(), /C4/);
  assert.equal(h.scoreFrame.showNote, false);
  assert.equal(h.buttons('Start').length, 1);
  assert.equal(h.buttons('C').length, 0);
  assert.equal(h.tasks.size, 0, 'Opening staff is stationary until Start');
  h.click('Start');
  assert.equal(h.scoreFrame.showNote, true);
  h.advance(160);
  h.click('C');
  assert.equal(h.state.phase, 'feedback');
  assert.equal(h.state.score, 1);
  assert.equal(h.state.records[0].answer, 'C');
  assert.equal(h.piano.length, 1);
  assert.doesNotMatch(h.text(), /Highest score/);
  assert.match(h.text(), /Score 1/);
  h.key('G');
  assert.equal(h.state.score, 1);
  assert.ok(h.buttons('C')[0].props.disabled);
  h.advance(Core.FEEDBACK_MS);
  assert.equal(h.state.phase, 'playing');
  h.click('C'); // G is the next note: wrong answers also confirm immediately.
  assert.equal(h.state.phase, 'finished');
  assert.equal(h.state.score, 1);
  assert.match(h.text(), /Game Over.*Score 1/);
  assert.match(h.text(), /G4#dc2626/);
  assert.equal(h.buttons('Try Again').length, 1);
  assert.equal(h.buttons('C')[0].props.disabled, true);
  assert.equal(h.tasks.size, 0);
  h.click('Reset');
  assert.equal(h.state.score, 0);
  assert.match(h.text(), /Highest score: 1/);
  h.unmount();
  const reopened = mount(storage);
  assert.match(reopened.text(), /National 3 • Highest score: 1/);
  reopened.unmount();
});

test('Escape, blur and hiding the page never pause the game', () => {
  const h = mount();
  h.click('Start');
  h.advance(1200);
  h.key('Escape');
  h.blur();
  h.visibility(true);
  assert.equal(h.state.phase, 'playing');
  h.advance(2400);
  assert.equal(h.state.phase, 'finished');
  h.advance(Core.FEEDBACK_MS + 10000);
  assert.equal(h.state.phase, 'finished');
  assert.equal(h.state.index, 0);
  assert.match(h.text(), /Game Over.*Score 0/);
  assert.match(h.text(), /C4#dc2626/);
  assert.equal(h.buttons('Try Again').length, 1);
  assert.equal(h.buttons('C')[0].props.disabled, true);
  assert.equal(h.tasks.size, 0);
  assert.doesNotMatch(h.text(), /Paused|Resume/);
  h.unmount();
});

test('unmount cancels active animation and feedback timers, closes audio and removes listeners', () => {
  for (const feedbackPhase of [false, true]) {
    const h = mount();
    h.click('Start');
    if (feedbackPhase) h.click('C');
    assert.ok(h.tasks.size > 0);
    assert.ok(h.listenerCount() > 0);
    h.click('Back');
    assert.equal(h.closes, 1);
    h.unmount();
    assert.equal(h.tasks.size, 0);
    assert.equal(h.listenerCount(), 0);
    assert.equal(h.contexts[0].closed, 1);
    const notes = h.piano.length, sounds = h.feedback.length;
    h.advance(10000);
    assert.equal(h.piano.length, notes);
    assert.equal(h.feedback.length, sounds);
  }
});

test('keyboard input ignores text fields, editable content, repeats and modified shortcuts', () => {
  const h = mount();
  h.click('Start');
  for (const tag of ['input', 'textarea', 'select']) {
    const target = {closest: selector => selector.includes(tag) ? {} : null};
    assert.equal(h.key('c', target), false);
    assert.equal(h.state.selected, null);
  }
  for (const value of ['', 'true', 'plaintext-only']) {
    const target = {closest: selector => selector.includes('[contenteditable]') || value === 'true' && selector.includes('[contenteditable="true"]') ? {} : null};
    assert.equal(h.key('c', target), false);
    assert.equal(h.state.selected, null);
  }
  for (const extras of [{repeat: true}, {ctrlKey: true}, {metaKey: true}, {altKey: true}]) {
    assert.equal(h.key('c', undefined, extras), false);
    assert.equal(h.state.selected, null);
  }
  assert.equal(h.key('c'), true);
  assert.equal(h.state.selected, 'C');
  assert.equal(h.state.phase, 'feedback');
  h.advance(Core.FEEDBACK_MS);
  h.key('Escape');
  assert.equal(h.state.phase, 'playing');
  assert.equal(h.key('g'), true);
  assert.equal(h.state.phase, 'feedback');
  h.unmount();
});

test('continuous play passes twelve notes, accelerates and resets to the simple opening', () => {
  const h = mount();
  assert.doesNotMatch(h.text(), /Stage|Find the right note|12 stages|Your current clefs/);
  h.click('Start');
  for (let index = 0; index < 40; index++) {
    h.click(h.state.question.answer);

    assert.equal(h.state.phase, 'feedback');
    h.advance(Core.FEEDBACK_MS);
    assert.equal(h.state.phase, 'playing');
  }
  assert.equal(h.state.score, 40);
  assert.equal(h.state.index, 40);
  assert.equal(h.state.durationMs, 2300);
  assert.doesNotMatch(h.text(), /Results|Stage|\/ 12/);
  h.click('Reset');
  assert.equal(h.state.phase, 'ready');
  assert.equal(h.state.index, 0);
  assert.equal(h.state.score, 0);
  assert.equal(h.state.remainingMs, 3600);
  assert.equal(h.tasks.size, 0);
  h.unmount();
});

test('opening guidance disappears during play and no speed glyph appears', () => {
  const h = mount();
  assert.match(h.text(), /Choose the note name before it reaches the line/);
  assert.match(h.text(), /notes getting faster as your score increases/);
  assert.equal(h.speedGlyph(), 0);
  h.click('Start');
  assert.doesNotMatch(h.text(), /Choose the note|The higher your score|Correct|Incorrect/);
  for (let i = 0; i < 3; i++) {
    h.click(h.state.question.answer);
    assert.doesNotMatch(h.text(), /Choose the note|Correct|Incorrect/);
    h.advance(Core.FEEDBACK_MS);
  }
  assert.equal(h.speedGlyph(), 0);
  h.advance(900);
  assert.equal(h.speedGlyph(), 0);
  h.click('Reset');
  assert.equal(h.speedGlyph(), 0);
  h.unmount();
});

test('faster play shows a bounded sequence and the preview becomes the next leading note in place', () => {
  const h = mount();
  h.click('Start');
  assert.equal(h.scoreFrame.upcoming.length, 0);
  for (let i = 0; i < 90; i++) {
    h.click(h.state.question.answer);
    h.advance(Core.FEEDBACK_MS);
  }
  h.advance(480);
  assert.ok(h.scoreFrame.upcoming.length >= 3);
  const displayed = h.scoreFrame;
  assert.equal(displayed.upcoming[0].question, h.state.upcoming[0]);
  for (let i = 0; i < displayed.upcoming.length; i++) {
    assert.ok(displayed.upcoming[i].progress <= 1);
    assert.ok(displayed.upcoming[i].progress > (i ? displayed.upcoming[i - 1].progress : displayed.progress));
  }
  h.click(h.state.question.answer);
  const nextPreview = h.scoreFrame.upcoming[0];
  h.advance(Core.FEEDBACK_MS);
  assert.equal(h.state.question, nextPreview.question);
  assert.ok(Math.abs(h.scoreFrame.progress - nextPreview.progress) < .00001);
  h.click(h.state.question.answer === 'C' ? 'G' : 'C');
  assert.equal(h.state.phase, 'finished');
  assert.equal(h.scoreFrame.upcoming.length, 0);
  h.unmount();
});

test('integrated sight-reading notation renders all five staff lines with a usable gradient for both clefs', () => {
  const {renderToStaticMarkup} = require('react-dom/server');
  const html = fs.readFileSync('noteidentification.html', 'utf8');
  const inline = html.match(/<script type="(?:text\/babel|text\/x-mlh-jsx-source)"(?![^>]*\b(?:src|data-src)=)[^>]*>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(inline, 'The activity retains its inline React source');
  const captured = inline.replace(/^\s*ReactDOM\.render\(.*document\.getElementById\("root"\)\);$/m, 'window.TestSightReadingScore = SightReadingScore;');
  assert.notEqual(captured, inline, 'Capture only the existing notation component without mounting the app');
  const window = {MLH: {}};
  const context = vm.createContext({window, React, MLH:window.MLH, location:{pathname:'/noteidentification.html',search:''}, URLSearchParams});
  for (const file of ['shared/classroom-activities.js','shared/note-identification-core.js','bravura-symbols.js', 'shared/shared-notation-config.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), context);
  vm.runInContext(Babel.transform(captured, {presets: ['react']}).code, context);
  for (const question of [{pitch: 'G4', answer: 'G', clef: 'treble', step: 2}, {pitch: 'D3', answer: 'D', clef: 'bass', step: 4}]) {
    const markup = renderToStaticMarkup(React.createElement(window.TestSightReadingScore, {question, colour: '#000000', progress: 0.5, reducedMotion: false}));
    const staffLines = [...markup.matchAll(/<line\b[^>]*x1="100"[^>]*x2="840"[^>]*stroke="url\(#staffLineFade\)"[^>]*>/g)];
    assert.equal(staffLines.length, 5, `${question.clef} clef staff has five horizontal lines`);
    assert.match(markup, /<linearGradient\b[^>]*gradientUnits="userSpaceOnUse"/);
    const heights = staffLines.map(([line]) => Number(line.match(/y1="([^"]+)"/)[1]));
    for (let index = 1; index < heights.length; index++) assert.ok(Math.abs(heights[index] - heights[index - 1] - 18.9) < 0.00001);
    assert.ok(markup.includes(window.BRAVURA_SYMBOLS[question.clef === 'treble' ? 'gClef' : 'fClef']));
    assert.ok(markup.includes(window.BRAVURA_SYMBOLS[question.step > 4 ? 'quarterNoteStemDown' : 'quarterNoteStemUp']));
  }
});
