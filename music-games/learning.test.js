const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const babel = require('@babel/standalone');
const source = ['music-games/media.jsx', 'music-games/diagram.jsx', 'music-games/learning.jsx'].map(path => babel.transform(fs.readFileSync(path, 'utf8'), { presets: ['react'] }).code).join('\n');
const context = { React, window: { IGCore: require('./core.js'), IGDiagramModel: require('./diagram-core.js') }, setTimeout(fn) { fn(); return 0; }, clearTimeout() {}, matchMedia() { return { matches: true }; } };
vm.runInNewContext(source, context);
const items = ['PIANO', 'VIOLIN', 'FLUTE', 'TRUMPET', 'TROMBONE', 'CLARINET'].map((answer, i) => ({ id: String(i), prompt: `Instrument ${i + 1}`, answer, distractors: ['Drum'], group: i % 2 ? 'Strings' : 'Wind' }));
test('all twelve learning modes render with shared content', () => {
  assert.equal(Object.keys(context.window.IGLearning).length, 12);
  for (const [id, Component] of Object.entries(context.window.IGLearning)) {
    const html = renderToStaticMarkup(React.createElement(Component, { activity: { items: id === 'matching-pairs' ? require('./core.js').SEEDS.find(seed=>seed.template===id).items : id === 'complete-the-sentence' ? items.map(item=>({...item,prompt:item.prompt+' ___'})) : items, diagram: { type: 'image', src: '/example.svg', name: 'Diagram' } }, onComplete() {} }));
    assert.ok(html.length > 100, id);
    assert.ok(!html.includes('undefined'), id);
  }
});
test('wordsearch places every supported unique answer along valid contiguous paths', () => {
  const puzzle = context.window.IGLearningPuzzles.makeWordsearch(items);
  assert.equal(puzzle.placed.length, items.length);
  for (const entry of puzzle.placed) {
    assert.equal(entry.cells.map(c => puzzle.grid[c.row][c.col]).join(''), entry.word);
    for (let i = 1; i < entry.cells.length; i++) {
      assert.ok(Math.abs(entry.cells[i].row - entry.cells[i - 1].row) <= 1);
      assert.ok(Math.abs(entry.cells[i].col - entry.cells[i - 1].col) <= 1);
    }
  }
});
test('crossword preserves every answer and safely shares intersecting cells', () => {
  const puzzle = context.window.IGLearningPuzzles.makeCrossword(items);
  assert.equal(puzzle.placed.length, items.length);
  for (const entry of puzzle.placed) {
    assert.equal(entry.positions.map(c => puzzle.cells.get(`${c.row},${c.col}`).letter).join(''), entry.word);
    assert.ok(entry.number > 0);
  }
  assert.ok([...puzzle.cells.values()].some(cell => cell.directions.length === 2), 'Should produce actual intersections');
});
test('puzzles filter duplicates and unsupported answers without corrupting the grid', () => {
  const source = [...items, { prompt: 'Duplicate', answer: 'piano' }, { prompt: 'Empty', answer: '' }, { prompt: 'Too long', answer: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' }];
  for (const make of [context.window.IGLearningPuzzles.makeWordsearch, context.window.IGLearningPuzzles.makeCrossword]) {
    const puzzle = make(source);
    assert.equal(puzzle.placed.length, items.length);
  }
});
function playerHarness(mode, activity, deferredTimers = false, controlled, testOptions={}) {
  const timers = new Map(), documentListeners = new Map(); let nextTimer=0, now=0;
  const effects = []; const slots = []; let cursor = 0, tree, completed = [], progress = [];
  const sameDeps = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const hooks = {
    createElement(type, props, ...children) { return { type, props: { ...(props || {}), children: children.flat(Infinity) } }; },
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], update => { slots[i] = typeof update === 'function' ? update(slots[i]) : update; }]; },
    useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
    useMemo(fn, deps) { const i = cursor++; if (!(i in slots) || !sameDeps(slots[i].deps, deps)) slots[i] = { value: fn(), deps }; return slots[i].value; },
    useEffect(fn, deps) { const i=cursor++; if (!(i in slots) || !sameDeps(slots[i],deps)) { slots[i]=deps; effects.push(fn); } },
    useLayoutEffect() { cursor++; }
  };
  const context = { React: hooks, window: { IGCore: require('./core.js'), IGDiagramModel: require('./diagram-core.js') }, setTimeout(fn,delay=0) { const id=++nextTimer; if (deferredTimers) timers.set(id,{fn,at:now+delay}); else fn(); return id; }, clearTimeout(id) { timers.delete(id); }, matchMedia() { return { matches: true }; } };
  vm.runInNewContext(source, context);
  function expand(node) { if (node == null || typeof node !== 'object') return node; if (typeof node.type === 'function') return expand(node.type(node.props)); return { ...node, props: { ...node.props, children: (node.props.children || []).map(expand) } }; }
  function render() { cursor = 0; tree = expand(hooks.createElement(context.window.IGLearning[mode], { activity, controlled, options: { shuffle: false, ...testOptions }, onComplete: value => completed.push(value), onProgress: value => progress.push(value), onSubmitAnswers:testOptions.onSubmitAnswers })); }
  function nodes(node = tree) { if (!node || typeof node !== 'object') return []; return [node, ...node.props.children.flatMap(child => child == null ? [] : nodes(child))]; }
  function text(node) { return typeof node === 'object' && node ? node.props.children.map(text).join('') : node == null || typeof node === 'boolean' ? '' : String(node); }
  function click(label) { const button = nodes().find(n => n.type === 'button' && text(n) === label); assert.ok(button, `Missing ${label}`); button.props.onClick({detail:0}); render(); }
  render(); return { flushEffects(){while(effects.length)effects.shift()();}, click, nodes, text, render, completed, progress, enableDocument(hitTest) { context.document = { elementFromPoint:hitTest, addEventListener(type, handler) { documentListeners.set(type, handler); }, removeEventListener(type, handler) { if (documentListeners.get(type) === handler) documentListeners.delete(type); } }; }, dispatchDocument(type, event) { documentListeners.get(type)?.(event); }, advanceBy(ms) { const end=now+ms; let entry; while((entry=[...timers].sort((a,b)=>a[1].at-b[1].at)[0])&&entry[1].at<=end){timers.delete(entry[0]);now=entry[1].at;entry[1].fn();render();}now=end;render(); }, advance() { assert.ok(timers.size); const [id,timer]=[...timers].sort((a,b)=>a[1].at-b[1].at)[0]; timers.delete(id); now=timer.at; timer.fn(); render(); } };
}
test('quiz commits accurate scores, reveals feedback and finishes only once', () => {
  const activity = { items: [{ prompt: 'First?', answer: 'One', distractors: ['Wrong'] }, { prompt: 'Second?', answer: 'Two', distractors: ['Wrong'] }] };
  const game = playerHarness('quiz', activity);
  game.click('Wrong'); game.click('Next'); game.click('Two');
  const finish = game.nodes().find(n => n.type === 'button' && game.text(n) === 'Finish');
  finish.props.onClick(); finish.props.onClick();
  assert.equal(game.completed.length, 1);
  assert.equal(game.completed[0].correct, 1);
  assert.equal(game.completed[0].total, 2);
  assert.equal(game.progress.length, 2);
});



const shortActivity = { items: [
  { id: 'a', prompt: 'A pet that purrs', answer: 'CAT', group: 'Feline', distractors: ['COW'], x: 25, y: 50 },
  { id: 'b', prompt: 'A pet that barks', answer: 'DOG', group: 'Canine', distractors: ['PIG'], x: 75, y: 50 }
], diagram: { type: 'image', src: '/example.svg', name: 'Animals' } };
function clickNode(game, node) { assert.ok(node, 'Expected an interactive element'); assert.ok(!node.props.disabled, 'Element should be enabled'); node.props.onClick({detail:0}); game.render(); }
function clickByAriaLabel(game, label) { const node = game.nodes().find(n => n.type === 'button' && n.props['aria-label'] === label); clickNode(game, node); }
function byClass(game, className) { return game.nodes().find(n => (n.props.className || '').split(' ').includes(className)); }
function finishAndCheck(game, correct = 2, total = 2) { game.click(game.nodes().some(node=>node.type==='button'&&game.text(node)==='Finish')?'Finish':'Next'); assert.equal(game.completed.length, 1); assert.equal(game.completed[0].correct, correct); assert.equal(game.completed[0].total, total); assert.ok(game.progress.every(p => p.total === total), 'Progress must retain the full activity denominator'); }
test('multiple choice, game show, wager and true-false complete through real answer actions', () => {
  for (const mode of ['quiz', 'true-or-false']) {
    const game = playerHarness(mode, shortActivity);
    for (let i = 0; i < 2; i++) {
      if (mode === 'true-or-false') { const shown = game.text(byClass(game, 'ig-statement')); game.click(shown === shortActivity.items[i].answer ? 'True' : 'False'); }
      else game.click(shortActivity.items[i].answer);
      if (i === 0) { assert.equal(game.progress.at(-1).total, 2); assert.equal(game.progress.at(-1).correct, 1); game.click('Next'); }
    }
    finishAndCheck(game);
  }
});
test('game show early elimination still counts unanswered questions', {skip:'Retired mode: not offered in Playnote'}, () => {
  const activity = { items: Array.from({ length: 5 }, (_, i) => ({ prompt: `Question ${i}`, answer: `Answer ${i}`, distractors: ['Wrong'] })) };
  const game = playerHarness('gameshow-quiz', activity);
  for (let i = 0; i < 3; i++) { game.click('Wrong'); if (i < 2) game.click('Next'); }
  finishAndCheck(game, 0, 5);
});
test('Match places, moves and submits answers like Sort before revealing accuracy', () => {
  const game = playerHarness('match-up', shortActivity, true);
  const catColour = game.nodes().find(node => node.type === 'button' && game.text(node) === 'CAT').props.style['--ig-answer-colour'];
  game.click('CAT'); clickByAriaLabel(game, 'Answer for A pet that barks');
  assert.equal(game.nodes().find(node => node.type === 'button' && node.props['aria-label'] === 'Answer for A pet that barks').props.style['--ig-answer-colour'], catColour);
  clickByAriaLabel(game, 'Answer for A pet that barks');
  game.click('CAT'); clickByAriaLabel(game, 'Answer for A pet that purrs');
  game.click('DOG'); clickByAriaLabel(game, 'Answer for A pet that barks');
  assert.ok(game.nodes().find(node => node.type === 'button' && game.text(node) === 'Submit').props.disabled === false);
  game.click('Submit');
  assert.equal(game.completed.length, 0);
  game.advance(); game.advance(); game.advance();
  assert.equal(game.completed[0].correct, 2);
  assert.equal(game.completed[0].total, 2);
});
test('Match drops by card overlap and returns a placed answer to the bank', () => {
  const game = playerHarness('match-up', { items: [{ prompt: 'Smooth and connected', answer: 'Legato' }] });
  game.enableDocument();
  const bounds = (left, top) => ({ left, top, right: left + 80, bottom: top + 40, width: 80, height: 40 });
  const bank = { getBoundingClientRect: () => bounds(0, 0) };
  let target = { dataset: { matchTarget: '0' }, getBoundingClientRect: () => bounds(100, 100) };
  const root = { querySelector: () => bank, querySelectorAll: () => [target] };
  const cardNode = (left, top, dataset = {}) => {
    const style = {};
    return { style, dataset, offsetWidth: 80, offsetHeight: 40, closest: () => root, setAttribute() {}, removeAttribute() {}, setPointerCapture() {},
      getBoundingClientRect: () => bounds(left + (parseFloat(style.left) || 0), top + (parseFloat(style.top) || 0)) };
  };
  const poolCard = game.nodes().find(node => node.type === 'button' && game.text(node) === 'Legato');
  const node = cardNode(0, 0);
  poolCard.props.onPointerDown({ currentTarget: node, pointerId: 1, button: 0, clientX: 70, clientY: 30 });
  game.dispatchDocument('pointermove', { pointerId: 1, clientX: 95, clientY: 95, preventDefault() {} });
  game.dispatchDocument('pointerup', { pointerId: 1, clientX: 95, clientY: 95, preventDefault() {} });
  game.render();
  const placed = game.nodes().find(node => node.props['data-match-target'] === 0);
  assert.equal(game.text(placed), 'Legato', 'Overlap places a card even with the cursor outside the slot');
  assert.ok(placed.props.className.includes('is-nesting'));
  const placedNode = cardNode(100, 100, { matchTarget: '0' });
  target = placedNode;
  placed.props.onPointerDown({ currentTarget: placedNode, pointerId: 2, button: 0, clientX: 110, clientY: 110 });
  game.dispatchDocument('pointermove', { pointerId: 2, clientX: 10, clientY: 10, preventDefault() {} });
  game.render();
  assert.ok(game.nodes().some(node => (node.props.className || '').includes('is-pickup')), 'Picking up a placed card preserves the empty slot');
  game.dispatchDocument('pointerup', { pointerId: 2, clientX: 10, clientY: 10, preventDefault() {} });
  game.render();
  assert.equal(game.text(game.nodes().find(node => node.props['data-match-target'] === 0)), '');
  assert.equal(game.text(byClass(game, 'ig-match-bank')), 'Legato', 'The bank accepts a card dragged from a target');
});
test('Match returns an invalid mouse drop with the same bounce as Sort', async () => {
  const game = playerHarness('match-up', { items: [{ prompt: 'Smooth and connected', answer: 'Legato' }] });
  game.enableDocument();
  const style = {}, animations = [];
  const root = { querySelectorAll: () => [], querySelector: () => ({ getBoundingClientRect: () => ({ left: 0, top: 0, right: 80, bottom: 40 }) }) };
  const node = { style, dataset: {}, closest: () => root, setAttribute() {}, removeAttribute() {},
    getBoundingClientRect() { const left = parseFloat(style.left) || 0, top = parseFloat(style.top) || 0; return { left, top, right: left + 80, bottom: top + 40, width: 80, height: 40 }; },
    animate(frames, options) { animations.push({ frames, options }); return { finished: Promise.resolve() }; } };
  game.nodes().find(node => node.type === 'button' && game.text(node) === 'Legato').props.onMouseDown({ type: 'mousedown', currentTarget: node, button: 0, clientX: 20, clientY: 20 });
  game.dispatchDocument('mousemove', { clientX: 300, clientY: 300, preventDefault() {} });
  game.dispatchDocument('mouseup', { clientX: 300, clientY: 300, preventDefault() {} });
  assert.equal(animations.length, 1);
  assert.equal(animations[0].options.duration, 380);
  assert.ok(parseFloat(animations[0].frames[1].left) < 0);
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  assert.equal(style.left, '');
  assert.equal(style.position, '');
});
test('Match displays twelve pairs per page', () => {
  const activity = { items: Array.from({ length: 24 }, (_, index) => ({ prompt: `Prompt ${index + 1}`, answer: `Answer ${index + 1}` })) };
  const html = renderToStaticMarkup(React.createElement(context.window.IGLearning['match-up'], { activity, page: 1, onComplete() {} }));
  assert.ok(html.includes('Prompt 13') && html.includes('Prompt 24'));
  assert.ok(!html.includes('Prompt 1</span>'));
  assert.ok(html.includes('Answer 13') && html.includes('Answer 24'));
  assert.ok(!html.includes('Answer 1</button>'));
});
test('Connection shows 16 face-up cards, hides categories and reveals solved groups', () => {
  const seed = require('./core.js').SEEDS.find(seed => seed.template === 'matching-pairs');
  const activity={...seed,items:seed.items.map(item=>({...item,prompt:item.prompt.charAt(0).toLocaleUpperCase('en-GB')+item.prompt.slice(1)}))};
  const game = playerHarness('matching-pairs', activity, true);
  const cards=()=>game.nodes().filter(node=>node.type==='button'&&node.props['aria-pressed']!==undefined);
  assert.equal(cards().length,16);
  assert.ok(!game.text(game.nodes()[0]).includes('Woodwind'));
  assert.ok(game.nodes().find(node=>node.type==='button'&&game.text(node)==='Submit').props.disabled);
  const groups=[...new Set(activity.items.map(item=>item.group))];
  // A near miss does not remove cards or reveal categories.
  for(const item of [...activity.items.filter(item=>item.group===groups[0]).slice(0,3),activity.items.find(item=>item.group!==groups[0])])game.click(item.prompt);
  assert.equal(cards().filter(node=>node.props['aria-pressed']).length,4);
  game.click('Submit');assert.equal(cards().length,16);
  assert.ok(game.text(game.nodes()[0]).includes('One away...'));
  assert.equal(cards().filter(node=>(node.props.className||'').includes('is-incorrect')).length,4);
  game.advance();
  for(const card of cards().filter(node=>node.props['aria-pressed']))game.click(game.text(card));
  assert.equal(cards().length,16);
  for(const group of groups){
    for(const item of activity.items.filter(item=>item.group===group))game.click(item.prompt);
    game.click('Submit');
    for(let step=0;step<5;step++)game.advance();
    assert.ok(game.nodes().some(node=>node.type==='h3'&&game.text(node).toLowerCase()===group.toLowerCase()));
    assert.equal(cards().length,16-4*(groups.indexOf(group)+1));
  }
  assert.equal(game.completed.length,0);game.advance();
  assert.equal(game.completed.length,1);assert.equal(game.completed[0].correct,4);assert.equal(game.completed[0].total,4);assert.equal(game.completed[0].attempts,5);
});
test('pair-or-no-pair evaluates the visible pair instead of always accepting one answer', {skip:'Retired mode: not offered in Playnote'}, () => {
  const game = playerHarness('pair-or-no-pair', shortActivity);
  for (let i = 0; i < 2; i++) {
    const pair = byClass(game, 'ig-pair-display');
    const prompt = game.text(pair.props.children[0]), candidate = game.text(pair.props.children[1]);
    game.click(shortActivity.items.find(item => item.prompt === prompt).answer === candidate ? 'Pair' : 'No pair');
    if (i === 0) game.click('Next');
  }
  finishAndCheck(game);
});
test('Sort accepts drops anywhere in a group and grades only on Submit', () => {
 const game=playerHarness('group-sort',shortActivity);
 for(const item of shortActivity.items){
  const tile=byClass(game,'ig-sort-pool').props.children.find(n=>n&&game.text(n)===item.prompt);
  const section=game.nodes().find(n=>n.props['data-sort-group-target']===item.group);
  section.props.onDrop({preventDefault(){},stopPropagation(){},dataTransfer:{getData:()=>String(tile.props.key)}});game.render();
 }
 assert.equal(game.completed.length,0);game.click('Submit');
 assert.equal(game.completed[0].correct,shortActivity.items.length);
 assert.equal(game.completed[0].total,shortActivity.items.length);
});
test('Sort overlays answer marks without changing the concept text', () => {
  const activity = { items: [{ prompt: 'Violin', group: 'Strings' }, { prompt: 'Trumpet', group: 'Brass' }, { prompt: 'Flute', group: 'Brass' }] };
  const game = playerHarness('group-sort', activity);
  game.click('Violin'); game.click('Brass');
  game.click('Trumpet'); game.click('Brass');
  game.click('Flute'); game.click('Strings');
  game.click('Submit');
  const cards = game.nodes().filter(node => node.type === 'p' && (node.props.className || '').includes('ig-sort-card'));
  assert.deepEqual(cards.map(game.text), ['Flute', 'Violin', 'Trumpet']);
  for (const [index, card] of cards.entries()) {
    const spans = card.props.children.filter(child => child?.type === 'span');
    assert.equal(spans.length, 2);
    assert.ok(spans[1].props.className.includes(index === 2 ? 'is-correct' : 'is-incorrect'));
  }
});
test('Sort dropping onto an existing card finds a free place without displacing it',()=>{
 const game=playerHarness('group-sort',{items:['Alpha','Bravo','Charlie'].map(prompt=>({prompt,group:'Group'}))});
 game.click('Alpha');game.click('Group');
 const tile=byClass(game,'ig-sort-pool').props.children.find(n=>n&&game.text(n)==='Charlie');
 const alpha=game.nodes().find(n=>n.type==='p'&&game.text(n)==='Alpha');
 alpha.props.onDrop({preventDefault(){},dataTransfer:{getData:()=>String(tile.props.key)}});game.render();
 assert.deepEqual(game.nodes().filter(n=>n.type==='p'&&(n.props.className||'').includes('ig-sort-card')).map(game.text),['Alpha','Charlie']);
});
test('Sort moves cards between groups while retaining both cards',()=>{
 const game=playerHarness('group-sort',{items:[{prompt:'Alpha',group:'First'},{prompt:'Bravo',group:'Second'}]});
 game.click('Alpha');game.click('First');game.click('Bravo');game.click('Second');
 const card=game.nodes().find(n=>n.type==='p'&&game.text(n)==='Bravo');
 const group=game.nodes().find(n=>n.props['data-sort-group-target']==='First');
 group.props.onDrop({preventDefault(){},dataTransfer:{getData:()=>String(card.props['data-sort-index'])}});game.render();
 const moved=game.nodes().find(n=>n.props['data-sort-group-target']==='First');
 assert.ok(game.text(moved).includes('Alpha'));assert.ok(game.text(moved).includes('Bravo'));
});
test('Sort keeps one empty group box and retains it after cards are added',()=>{
 const game=playerHarness('group-sort',{items:['Alpha','Bravo'].map(prompt=>({prompt,group:'Group'}))});
 assert.equal(game.nodes().filter(n=>(n.props.className||'').includes('ig-sort-group-placeholder')).length,1);
 game.click('Alpha');game.click('Group');
 assert.ok(byClass(game,'ig-sort-slots').props.className.includes('has-concepts'));
 assert.equal(game.nodes().filter(n=>(n.props.className||'').includes('ig-sort-group-placeholder')).length,0);
});
test('Sort moves the original card and drops by card overlap even when the pointer is outside the slot', () => {
  const activity = { items: [{ prompt: 'Alpha', group: 'Group A' }, { prompt: 'Bravo', group: 'Group B' }] };
  const game = playerHarness('group-sort', activity);
  game.enableDocument();
  const alpha = byClass(game, 'ig-sort-pool').props.children.find(node => node && game.text(node) === 'Alpha');
  const alphaIndex = Number(alpha.props.key);
  let left = 0, top = 0;
  const style = {};
  let capturedPointer = null;
  const draggedNode = {
    style, setAttribute() {}, removeAttribute() {}, setPointerCapture(id) { capturedPointer = id; },
    getBoundingClientRect() {
      // Model the shared button CSS: its !important transform wins over any inline transform.
      left = parseFloat(style.left) || 0; top = parseFloat(style.top) || 0;
      return { left, top, right: left + 80, bottom: top + 40, width: 80, height: 40 };
    }
  };
  alpha.props.onPointerDown({ currentTarget: draggedNode, pointerId: 1, pointerType: 'mouse', button: 0, clientX: 70, clientY: 30 });
  assert.equal(capturedPointer, 1, 'The card captures the active pointer for the full drag');
  const candidates = game.nodes().filter(node => node.props['data-sort-group-target']).map(node => ({
    dataset: { sortGroupTarget:node.props['data-sort-group-target'], sortTarget: node.props['data-sort-target'], sortType: node.props['data-sort-type'], sortGroup: node.props['data-sort-group'], sortSlot: node.props['data-sort-slot'], sortIndex: node.props['data-sort-index'] },
    getBoundingClientRect: () => node.props['data-sort-group-target'] === 'Group A' ? { left: 100, top: 100, right: 200, bottom: 150 } : { left: 300, top: 100, right: 400, bottom: 150 }
  }));
  const root = { classList: { contains: value => value === 'ig-group-sort-layout' }, closest() { return this; }, querySelectorAll: () => candidates };
  byClass(game, 'ig-sort-groups').props.ref.current = root;
  game.dispatchDocument('pointermove', { currentTarget: {}, pointerId: 1, clientX: 95, clientY: 95, preventDefault() {} });
  assert.equal(style.left, '25px', 'The original card moves despite the shared !important transform');
  assert.equal(style.top, '65px');
  game.render();
  game.dispatchDocument('pointerup', { currentTarget: {}, pointerId: 1, clientX: 95, clientY: 95, preventDefault() {} });
  game.render();
  const placed = game.nodes().find(node => node.type === 'p' && (node.props.className || '').includes('ig-sort-card') && game.text(node) === 'Alpha');
  assert.ok(placed, 'The card is placed into the overlapped slot');
  assert.equal(style.left, '', 'A successfully placed card resumes its normal layout position');
  assert.ok(alphaIndex >= 0);
});
test('Sort supports mouse dragging when pointer events are unavailable', () => {
  const game = playerHarness('group-sort', { items: [{ prompt: 'Alpha', group: 'Group A' }] });
  game.enableDocument();
  const alpha = byClass(game, 'ig-sort-pool').props.children.find(node => node && game.text(node) === 'Alpha');
  const style = {};
  const draggedNode = {
    style, setAttribute() {}, removeAttribute() {},
    getBoundingClientRect() {
      const left = parseFloat(style.left) || 0, top = parseFloat(style.top) || 0;
      return { left, top, right: left + 80, bottom: top + 40, width: 80, height: 40 };
    }
  };
  alpha.props.onMouseDown({ type: 'mousedown', currentTarget: draggedNode, button: 0, clientX: 70, clientY: 30 });
  const slotNode = game.nodes().find(node => node.props['data-sort-group-target']);
  const candidate = {
    dataset: { sortGroupTarget:slotNode.props['data-sort-group-target'], sortTarget: slotNode.props['data-sort-target'], sortType: slotNode.props['data-sort-type'], sortGroup: slotNode.props['data-sort-group'], sortSlot: slotNode.props['data-sort-slot'] },
    getBoundingClientRect: () => ({ left: 100, top: 100, right: 200, bottom: 150 })
  };
  const root = { classList: { contains: value => value === 'ig-group-sort-layout' }, closest() { return this; }, querySelectorAll: () => [candidate] };
  game.dispatchDocument('mousemove', { type: 'mousemove', currentTarget: root, clientX: 95, clientY: 95, preventDefault() {} });
  assert.equal(style.left, '25px');
  assert.equal(style.top, '65px');
  game.dispatchDocument('mouseup', { type: 'mouseup', currentTarget: root, clientX: 95, clientY: 95, preventDefault() {} });
  game.render();
  assert.ok(game.nodes().some(node => node.type === 'p' && (node.props.className || '').includes('ig-sort-card') && game.text(node) === 'Alpha'));
});
test('Sort bounces the original card back when released without a slot', async () => {
  const game = playerHarness('group-sort', { items: [{ prompt: 'Alpha', group: 'Group A' }] });
  game.enableDocument();
  const alpha = byClass(game, 'ig-sort-pool').props.children.find(node => node && game.text(node) === 'Alpha');
  const style = {}, animations = [];
  const draggedNode = {
    style, setAttribute() {}, removeAttribute() {},
    getBoundingClientRect() {
      const left = parseFloat(style.left) || 0, top = parseFloat(style.top) || 0;
      return { left, top, right: left + 80, bottom: top + 40, width: 80, height: 40 };
    },
    animate(frames, options) { animations.push({ frames, options }); return { finished: Promise.resolve() }; }
  };
  alpha.props.onPointerDown({ currentTarget: draggedNode, pointerId: 2, pointerType: 'mouse', button: 0, clientX: 20, clientY: 20 });
  const root = { classList: { contains: value => value === 'ig-group-sort-layout' }, closest() { return this; }, querySelectorAll: () => [] };
  game.dispatchDocument('pointermove', { currentTarget: root, pointerId: 2, clientX: 90, clientY: 90, preventDefault() {} });
  game.dispatchDocument('pointerup', { currentTarget: root, pointerId: 2, clientX: 90, clientY: 90, preventDefault() {} });
  assert.equal(animations.length, 1, 'An invalid release starts the return animation');
  assert.equal(animations[0].frames[0].left, '70px');
  assert.equal(animations[0].frames[0].top, '70px');
  assert.ok(parseFloat(animations[0].frames[1].left) < 0, 'The return overshoots its origin for a small bounce');
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(style.left, '', 'The original card returns to its exact starting position');
  assert.equal(style.position, '', 'Temporary drag styles are removed afterward');
});
test('Sort returns individually selected cards to the bank',()=>{
 const game=playerHarness('group-sort',{items:[{prompt:'Alpha',group:'Group'}]});
 game.click('Alpha');game.click('Group');
 const card=game.nodes().find(n=>n.type==='p'&&game.text(n)==='Alpha');
 byClass(game,'ig-sort-pool').props.onDrop({preventDefault(){},dataTransfer:{getData:()=>String(card.props['data-sort-index'])}});game.render();
 assert.ok(byClass(game,'ig-sort-pool').props.children.some(n=>n&&game.text(n)==='Alpha'));
});
test('Sort provides full-row capacity without exceeding ten concepts per group',()=>{
 const game=playerHarness('group-sort',{items:Array.from({length:9},(_,i)=>({prompt:'Concept '+i,group:i<6?'First':'Second'}))});
 const slots=game.nodes().filter(n=>n.props['data-sort-capacity']);
 assert.ok(slots.every(n=>n.props['data-sort-capacity']===8));
});
test('large Sort activities expose a denser layout and retain every card and slot', () => {
  const activity = { items: Array.from({ length: 30 }, (_, index) => ({ prompt: `Concept ${index + 1}`, group: ['Nouns', 'Verbs', 'Adjectives'][index % 3] })) };
  const game = playerHarness('group-sort', activity);
  const layout = byClass(game, 'ig-group-sort-layout');
  assert.ok(layout.props.className.includes('ig-group-sort-large'));
  assert.equal(layout.props['data-item-count'], 30);
  assert.equal(byClass(game, 'ig-sort-pool').props.children.filter(node => node && node.type === 'button').length, 30);
  const sections = game.nodes().filter(node => node.type === 'section');
  const slotCounts = sections.map(section => Number(section.props.children[1].props['data-sort-capacity']));
  const answerCounts = ['Nouns', 'Verbs', 'Adjectives'].map(group => activity.items.filter(item => item.group === group).length);
  assert.ok(slotCounts.every(count => count === Math.max(...answerCounts)), 'The denser large-game layout gives every heading exactly the largest answer count');
});
test('rank order can be reordered with arrows and checks the current order', () => {
  const game = playerHarness('rank-order', shortActivity);
  const first = byClass(game, 'ig-rank-list').props.children[0];
  assert.equal(typeof first.props.onPointerDown, 'function');
  const rows = () => byClass(game, 'ig-rank-list').props.children;
  assert.ok(game.nodes().some(node => node.type === 'button' && /^Move item \d+ up$/.test(node.props['aria-label'] || '')));
  const originalFirst = game.text(rows()[0]);
  game.nodes().find(node => node.props['aria-label'] === 'Move item 2 up').props.onClick();
  game.render();
  assert.notEqual(game.text(rows()[0]), originalFirst);
  const correct = byClass(game, 'ig-rank-list').props.children.filter((row, position) => game.text(row).includes(shortActivity.items[position].prompt)).length;
  game.click('Submit');
  assert.equal(game.completed.length, 1);
  assert.equal(game.completed[0].correct, correct);
  assert.equal(game.completed[0].total, shortActivity.items.length);
});
test('letter arrangement, word arrangement, gap choice and written answers all score independently', () => {
  for (const mode of ['type-the-answer']) {
    const activity = mode === 'unjumble' ? { items: shortActivity.items.map(i => ({ ...i, answer: `A ${i.answer}` })) } : mode === 'complete-the-sentence' ? {items:shortActivity.items.map(item=>({...item,prompt:item.prompt+' ___'}))} : shortActivity;
    const game = playerHarness(mode, activity);
    for (let i = 0; i < 2; i++) {
      if (mode === 'type-the-answer' || mode === 'spell-the-word') { game.nodes().find(n => n.type === 'input').props.onChange({ target: { value: activity.items[i].answer } }); game.render(); }
      else if (mode === 'complete-the-sentence') game.click(activity.items[i].answer);
      else for (const token of mode === 'unjumble' ? activity.items[i].answer.split(' ') : [...activity.items[i].answer]) {
        const pool = byClass(game, 'ig-token-pool');
        clickNode(game, pool.props.children.find(n => n.type === 'button' && !n.props.disabled && game.text(n) === token));
      }
      game.click('Submit'); if (i === 0) game.click('Next');
    }
    finishAndCheck(game);
  }
});
test('hangman wins with guessed letters and finishes each item once', {skip:'Retired mode: not offered in Playnote'}, () => {
  const game = playerHarness('hangman', shortActivity);
  for (let i = 0; i < 2; i++) { for (const letter of shortActivity.items[i].answer) game.click(letter); if (i === 0) game.click('Next'); }
  finishAndCheck(game);
});
test('wordsearch can be solved using only letters visible in the rendered grid', () => {
  const game = playerHarness('wordsearch', shortActivity);
  const grid = byClass(game, 'ig-wordsearch-grid'), buttons = grid.props.children, size = Math.sqrt(buttons.length), chars = buttons.map(game.text);
  for (const item of shortActivity.items) {
    let path;
    for (let r = 0; r < size && !path; r++) for (let c = 0; c < size && !path; c++) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]]) {
      const cells = [...item.answer].map((_, i) => [r + dr * i, c + dc * i]);
      if (cells.every(([y, x], i) => y >= 0 && x >= 0 && y < size && x < size && chars[y * size + x] === item.answer[i])) path = cells;
    }
    assert.ok(path, `Find ${item.answer}`);
    for (const [r, c] of path) clickNode(game, byClass(game, 'ig-wordsearch-grid').props.children[r * size + c]);
  }
  game.flushEffects();
  assert.equal(game.completed.length,1);assert.equal(game.completed[0].correct,2);
  assert.ok(!game.nodes().some(n=>n.type==='button'&&game.text(n)==='Finish'));
});
test('wordsearch requires every letter and keeps the selected path highlighted', () => {
  const game = playerHarness('wordsearch', { items: [{ prompt: 'A pet', answer: 'CAT' }] });
  const buttons = byClass(game, 'ig-wordsearch-grid').props.children, size = Math.sqrt(buttons.length), chars = buttons.map(game.text);
  let path;
  for (let r = 0; r < size && !path; r++) for (let c = 0; c < size && !path; c++) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]]) {
    const cells = [...'CAT'].map((_, i) => [r + dr * i, c + dc * i]);
    if (cells.every(([y, x], i) => y >= 0 && x >= 0 && y < size && x < size && chars[y * size + x] === 'CAT'[i])) path = cells;
  }
  assert.ok(path);
  const pick = ([r, c]) => clickNode(game, byClass(game, 'ig-wordsearch-grid').props.children[r * size + c]);
  const selected = () => byClass(game, 'ig-wordsearch-grid').props.children.filter(node => node.props['aria-pressed']);
  pick(path[0]); pick(path[2]);
  assert.equal(game.progress.length, 0, 'Clicking only the endpoints does not find the word');
  assert.equal(selected().length, 1, 'Skipping letters starts a new selection');
  pick(path[2]);
  assert.equal(selected().length, 0, 'Clicking a selected letter removes it');
  pick(path[2]); pick(path[1]);
  assert.equal(selected().length, 2, 'Every clicked letter stays highlighted');
  pick(path[0]);
  assert.equal(game.progress.length, 1, 'A word can be completed letter by letter in reverse');
  assert.equal(selected().length, 0);
  assert.ok(byClass(game, 'ig-word-clues').props.children[0].props.className.includes('ig-word-found'));
  assert.ok(!game.nodes().some(node => node.props.role === 'status'));
});
test('crossword accepts answers only through the selected prompt', () => {
  const game = playerHarness('crossword', shortActivity), puzzle = context.window.IGLearningPuzzles.makeCrossword(shortActivity.items);
  const input = game.nodes().find(node => node.type === 'input');
  assert.ok(game.nodes().filter(node => node.type === 'input').every(node => node.props.readOnly && node.props.tabIndex === -1));
  assert.ok(game.nodes().filter(node => node.type === 'input').every(node => node.props.inputMode === 'none'), 'Touch input uses the game keyboard instead of the device keyboard');
  input.props.onChange({ target: { value: 'Z' } }); game.render();
  assert.ok(game.nodes().filter(node => node.type === 'input').every(node => !node.props.value), 'Board input is ignored before selecting a prompt');
  for (const word of puzzle.placed) {
    const clue = game.nodes().find(node => node.type === 'button' && (node.props.className || '').includes('ig-crossword-clue') && game.text(node).includes(word.item.prompt));
    if (clue.props.className.includes('ig-correct')) continue;
    clue.props.onClick(); game.render();
    for (const cell of word.positions) {
      const label = `Row ${cell.row - puzzle.minR + 1}, column ${cell.col - puzzle.minC + 1}`;
      const target = game.nodes().find(node => node.type === 'input' && node.props['aria-label'].startsWith(label));
      if (!target.props.readOnly) { target.props.onChange({ target: { value: cell.letter } }); game.render(); }
    }
    assert.ok(game.nodes().filter(node => node.type === 'input').every(node => node.props.readOnly), 'Completing a word requires another prompt selection');
  }
  assert.equal(game.completed.length, 1);
  assert.equal(game.completed[0].correct, puzzle.placed.length);
  assert.equal(game.completed[0].total, puzzle.placed.length);
});
test('crossword alphabetical keyboard edits the active word and marks it once', () => {
  const game = playerHarness('crossword', shortActivity, true), puzzle = context.window.IGLearningPuzzles.makeCrossword(shortActivity.items);
  const keyboard = byClass(game, 'ig-crossword-keyboard');
  assert.equal(keyboard.props.children.slice(0, 26).map(game.text).join(''), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  assert.ok(!game.nodes().some(node => node.type === 'button' && game.text(node) === 'Submit'));
  const first = puzzle.placed[0], firstKey = `Row ${first.row - puzzle.minR + 1}, column ${first.col - puzzle.minC + 1}`;
  const firstInput = () => game.nodes().find(node => node.type === 'input' && node.props['aria-label'].startsWith(firstKey));
  assert.ok(!game.nodes().some(node => node.props.className === 'ig-crossword-word-outline'));
  game.click('Z');
  assert.equal(firstInput().props.value, '', 'The on-screen keyboard also requires a prompt selection');
  const clue = game.nodes().find(node => node.type === 'button' && (node.props.className || '').includes('ig-crossword-clue') && game.text(node).includes(first.item.prompt));
  clue.props.onClick(); game.render();
  assert.ok(game.nodes().some(node => node.props.className === 'ig-crossword-word-outline'), 'Selecting a prompt outlines its word on the board');
  game.click('Z');
  assert.equal(game.progress.length, 0, 'An incomplete or incorrect answer is not submitted');
  game.nodes().find(node => node.props['aria-label'] === 'Backspace').props.onClick(); game.render();
  assert.equal(firstInput().props.value, '');
  for (const letter of first.word) game.click(letter);
  assert.equal(game.progress.length, 1);
  assert.ok(!game.nodes().some(node => node.props.className === 'ig-crossword-word-outline'), 'The outline clears with the completed selection');
  assert.equal(game.progress[0].correct, 1);
  assert.equal(firstInput().props.readOnly, true, 'Accepted letters remain fixed for crossing words');
  firstInput().props.onChange({ target: { value: 'Z' } }); game.render();
  assert.equal(game.progress.length, 1, 'An accepted answer cannot be scored twice');
  assert.equal(firstInput().props.value, first.word[0]);
});
test('labelled diagram keeps placements editable and marks only on submission', () => {
  const game = playerHarness('labelled-diagram', shortActivity);
  const key = label => { const node = game.nodes().find(n => n.props['aria-label'] === label); assert.ok(node, label); node.props.onKeyDown({ key: 'Enter', preventDefault() {} }); game.render(); };
  key('CAT'); key('Target 2');
  assert.equal(game.completed.length, 0);
  assert.equal(game.progress.length, 0, 'No correctness is exposed during placement');
  key('CAT'); key('Target 1');
  key('DOG'); key('Target 2');
  game.nodes().find(n => n.props['aria-label'] === 'Submit').props.onClick(); game.render();
  assert.equal(game.completed.length, 1);
  assert.equal(game.completed[0].correct, 2);
  assert.equal(game.completed[0].total, 2);
});
test('wordsearch limits a larger activity to fifteen playable words', () => {
  const many = Array.from({ length: 40 }, (_, i) => ({ prompt: `Clue ${i + 1}`, answer: 'ABCDEFGHIJKLMNOP' + String.fromCharCode(65 + Math.floor(i / 26)) + String.fromCharCode(65 + i % 26) }));
  const puzzle = context.window.IGLearningPuzzles.makeWordsearch(many);
  assert.equal(puzzle.placed.length, 15);
  const game = playerHarness('wordsearch', { items: many });
  assert.equal(byClass(game, 'ig-word-clues').props.children.length, 15);
  assert.ok(puzzle.grid.every(row => row.length === puzzle.size));
});

test('multi-correct quiz accepts any marked answer when one answer is required', () => {
  const game = playerHarness('quiz', {items:[{prompt:'Select a string instrument',answer:'Violin',correctAnswers:['Violin','Cello'],answerOptions:['Violin','Cello','Flute'],distractors:['Flute'],requireAll:false}]});
  game.click('Cello'); game.click('Finish');
  assert.equal(game.completed[0].correct,1);
});
test('multi-correct quiz waits for submission and requires the complete correct set', () => {
  const row = {prompt:'Select the strings',answer:'Violin',correctAnswers:['Violin','Cello'],answerOptions:['Violin','Cello','Flute'],distractors:['Flute'],requireAll:true};
  const correct = playerHarness('quiz',{items:[row]});
  correct.click('Violin'); assert.equal(correct.progress.length,0);
  correct.click('Cello'); correct.click('Submit'); correct.click('Finish');
  assert.equal(correct.completed[0].correct,1);
  const incomplete = playerHarness('quiz',{items:[row]});
  incomplete.click('Violin'); incomplete.click('Submit'); incomplete.click('Finish');
  assert.equal(incomplete.completed[0].correct,0);
  const extra = playerHarness('quiz',{items:[row]});
  extra.click('Violin'); extra.click('Cello'); extra.click('Flute'); extra.click('Submit'); extra.click('Finish');
  assert.equal(extra.completed[0].correct,0);
});

test('sentence completion places and scores multiple missing words independently', () => {
  const item={prompt:'Music can be ___ or ___.',answer:'loud',clozeText:'Music can be loud or quiet.',clozeGaps:[{start:13,end:17,text:'loud'},{start:21,end:26,text:'quiet'}],distractors:['tempo']};
  const game=playerHarness('complete-the-sentence',{items:[item]});
  game.click('loud'); game.click('quiet'); game.click('Submit');
  assert.equal(game.nodes().filter(node => (node.props.className || '').includes('ig-cloze-feedback-badge')).length,2);
  game.click('Finish');
  assert.equal(game.completed[0].total,2); assert.equal(game.completed[0].correct,2);
  assert.deepEqual(Array.from(game.completed[0].answers,a=>a.expected),['loud','quiet']);
  const partial=playerHarness('complete-the-sentence',{items:[item]});
  partial.click('tempo'); partial.click('quiet'); partial.click('Submit'); partial.click('Finish');
  assert.equal(partial.completed[0].total,2); assert.equal(partial.completed[0].correct,1);
});
test('sentence completion supports drag placement and repeated identical words', () => {
  const item={prompt:'Play ___, then ___.',answer:'loud',clozeText:'Play loud, then loud.',clozeGaps:[{start:5,end:9,text:'loud'},{start:16,end:20,text:'loud'}],distractors:[]};
  const game=playerHarness('complete-the-sentence',{items:[item]});
  const tokens=byClass(game,'ig-cloze-bank').props.children.map(n=>n.props.children[0]);
  assert.equal(typeof tokens[0].props.onPointerDown,'function');
  let dragged;tokens[1].props.onDragStart({dataTransfer:{setData(type,value){dragged=value;}}});
  const blank=game.nodes().find(n=>n.props['aria-label']==='Blank 2');
  blank.props.onDrop({preventDefault(){},dataTransfer:{getData(){return dragged;}}});game.render();
  const available=byClass(game,'ig-cloze-bank').props.children.map(n=>n.props.children[0]).find(n=>!n.props.disabled);clickNode(game,available);
  game.click('Submit');game.click('Finish');assert.equal(game.completed[0].correct,2);
});

test('rank cards retain pointer dragging and provide move controls', () => {
  const game=playerHarness('rank-order',shortActivity);
  const first=byClass(game,'ig-rank-list').props.children[0];
  assert.equal(typeof first.props.onPointerDown,'function');
  assert.ok(game.nodes().some(node => node.type === 'button' && /^Move .* (up|down)$/.test(node.props['aria-label'] || '')));
});

test('diagram reveals each mark and running score before completing', () => {
  const game = playerHarness('labelled-diagram', shortActivity, true);
  const key = label => { game.nodes().find(n => n.props['aria-label'] === label).props.onKeyDown({ key: 'Enter', preventDefault() {} }); game.render(); };
  key('CAT'); key('Target 1');
  game.nodes().find(n => n.props['aria-label'] === 'Submit').props.onClick(); game.render();
  const marks = () => game.nodes().filter(n => n.type === 'g' && n.props.className === 'ig-pin-feedback' && ['Correct', 'Incorrect'].includes(n.props['aria-label']));
  assert.equal(marks().length, 0);
  game.advance();
  assert.equal(marks().length, 1);
  assert.equal(game.progress.at(-1).answers.length, 1);
  assert.equal(game.completed.length, 0);
  game.advance();
  assert.equal(marks().length, 2);
  assert.equal(game.progress.at(-1).correct, 1);
  assert.equal(game.progress.at(-1).answers.length, 2);
  assert.equal(game.completed.length, 0);
  assert.ok(marks().some(n => n.props['aria-label'] === 'Correct'));
  assert.ok(marks().some(n => n.props['aria-label'] === 'Incorrect'));
  game.advance();
  assert.equal(game.completed.length, 1);
  assert.equal(game.completed[0].correct, 1);
  assert.equal(game.completed[0].total, 2);
});

test('diagram review restores submitted placements and keeps incorrect answers marked', () => {
  const html = renderToStaticMarkup(React.createElement(context.window.IGLearning['labelled-diagram'], {
    activity: shortActivity,
    options: { diagramReview: true, diagramSubmission: { placements: { a: 'b', b: 'a' }, order: ['b', 'a'] } }
  }));
  assert.equal((html.match(/aria-label="Incorrect"/g) || []).length, 2);
  assert.equal((html.match(/aria-label="Correct"/g) || []).length, 0);
  assert.ok(!html.includes('Submit'));
});

test('selected diagram label overwrites an occupied pin by pointer or keyboard', () => {
  for (const input of ['pointer', 'keyboard']) {
    const game = playerHarness('labelled-diagram', shortActivity);
    const key = label => { game.nodes().find(n => n.props['aria-label'] === label).props.onKeyDown({key:'Enter',preventDefault(){}}); game.render(); };
    key('CAT'); key('Target 2'); key('DOG');
    if (input === 'pointer') {
      game.nodes().find(n => n.props['aria-label'] === 'Move pin: CAT').props.onPointerDown({button:0,preventDefault(){},stopPropagation(){}});
      game.render();
    } else key('Move pin: CAT');
    game.nodes().find(n => n.props['aria-label'] === 'Submit').props.onClick(); game.render();
    assert.equal(game.completed[0].diagramState.placements.b, 'b');
    assert.equal(game.completed[0].diagramState.placements.a, undefined);
    assert.equal(game.completed[0].correct, 1);
  }
});

test('Sort keeps Submit present and disabled throughout the answer reveal', () => {
  const game=playerHarness('group-sort',{items:[{prompt:'Violin',group:'Strings'}]},true);
  const submit=()=>game.nodes().find(node=>node.type==='button'&&game.text(node)==='Submit');
  assert.equal(submit().props.disabled,true);
  game.click('Violin');game.click('Strings');assert.equal(submit().props.disabled,false);
  game.click('Submit');assert.equal(submit().props.disabled,true);
  game.advance();assert.equal(submit().props.disabled,true);
});
test('Blanks moves and swaps placed words without losing or duplicating a token',()=>{
  const item={clozeText:'loud quiet',clozeGaps:[{start:0,end:4,text:'loud'},{start:5,end:10,text:'quiet'}]};
  const game=playerHarness('complete-the-sentence',{items:[item]});
  const gaps=()=>game.nodes().filter(node=>node.type==='button'&&(node.props.className||'').includes('ig-cloze-blank'));
  game.click('loud');game.click('quiet');
  const transfer={};gaps()[0].props.onDragStart({dataTransfer:{setData:(type,id)=>transfer.id=id}});
  gaps()[1].props.onDrop({preventDefault(){},dataTransfer:{getData:()=>transfer.id}});game.render();
  assert.deepEqual(gaps().map(game.text),['quiet','loud']);
  game.click('Submit');game.click('Finish');assert.equal(game.completed[0].correct,0);
});
test('diagram answer text keeps its font size and position when feedback appears',()=>{
  const game=playerHarness('labelled-diagram',shortActivity,true);
  const labels=()=>game.nodes().filter(node=>node.type==='text').map(node=>({x:node.props.x,y:node.props.y,fontSize:node.props.fontSize}));
  const before=labels();
  const submit=()=>game.nodes().find(node=>node.type==='button'&&node.props['aria-label']==='Submit');
  assert.equal(submit().props.disabled,true);
  for(const label of ['CAT','Target 1']){game.nodes().find(node=>node.props['aria-label']===label).props.onKeyDown({key:'Enter',preventDefault(){}});game.render();}
  assert.equal(submit().props.disabled,false);submit().props.onClick();game.render();game.advance();
  assert.deepEqual(labels(),before);assert.equal(submit().props.disabled,true);
  assert.ok(game.nodes().some(node=>node.props.className==='ig-pin-feedback'&&node.props['aria-label']==='Correct'));
});

test('game reveal timers preserve remaining time while paused and cancel on disposal', () => {
  let cursor=0,slots=[],effects=[],now=0,nextId=0;
  const timers=new Map();
  const R={...React,useRef(value){const i=cursor++;return slots[i]||(slots[i]={current:value});},useEffect(fn,deps){const i=cursor++;if(!slots[i]||deps.some((v,n)=>!Object.is(v,slots[i].deps[n]))){const previous=slots[i];slots[i]={deps,cleanup:previous?.cleanup};effects.push(()=>{slots[i].cleanup?.();slots[i].cleanup=fn();});}}};
  const ctx={React:R,window:{IGCore:require('./core.js')},Date:{now:()=>now},setTimeout(fn,delay){const id=++nextId;timers.set(id,{fn,at:now+delay});return id;},clearTimeout(id){timers.delete(id);}};
  const code=babel.transform(fs.readFileSync('music-games/learning.jsx','utf8').replace('window.IGLearning = modes;', 'window.TestGameTimeouts=useGameTimeouts; window.IGLearning = modes;'),{presets:['react']}).code;
  vm.runInNewContext(code,ctx);
  function render(active){cursor=0;effects=[];const clock=ctx.window.TestGameTimeouts(active);effects.forEach(fn=>fn());return clock;}
  function advance(ms){const until=now+ms;while(true){const entry=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!entry||entry[1].at>until)break;now=entry[1].at;timers.delete(entry[0]);entry[1].fn();}now=until;}
  let calls=0,clock=render(true);clock.schedule(()=>calls++,100);advance(40);clock=render(false);advance(1000);assert.equal(calls,0);assert.equal(timers.size,0);
  clock=render(true);advance(59);assert.equal(calls,0);advance(1);assert.equal(calls,1);
  clock=render(false);clock.schedule(()=>calls++,50);advance(100);assert.equal(calls,1);clock=render(true);advance(50);assert.equal(calls,2);
  const cancelled=clock.schedule(()=>calls++,10);clock.cancel(cancelled);advance(10);assert.equal(calls,2);
  clock.schedule(()=>calls++,50);for(const slot of slots)slot?.cleanup?.();advance(100);assert.equal(calls,2);assert.equal(timers.size,0);
});


test('playing Quiz answer audio does not select or submit the answer',()=>{
 const game=playerHarness('quiz',{items:[{id:'sound',prompt:'Which instrument?',answer:'Piano',correctAnswers:['Piano'],answerOptions:['Piano','Flute'],answerOptionMedia:[{type:'audio',src:'https://example.test/piano.mp3'},null]}]});
 assert.ok(game.nodes().some(node=>node.type==='audio'));
 let stopped=false;game.nodes().find(node=>node.props.className==='ig-quiz-answer-media').props.onClick({stopPropagation(){stopped=true;}});
 assert.equal(stopped,true);assert.equal(game.progress.length,0);assert.equal(game.completed.length,0);
 game.click('Piano');assert.equal(game.progress.length,1);assert.equal(game.progress[0].correct,1);
});

test('ordinary multiple choice uses the fixed question and 2x2 click-to-mark format',()=>{
 const game=playerHarness('quiz',{items:[{prompt:'Pitch moves upwards.',answer:'Ascending',distractors:['Descending','Chord','Harmony']}]});
 assert.ok(game.nodes().some(node=>node.props?.className?.includes('ig-definition-choices')));
 assert.ok(!game.nodes().some(node=>node.type==='button'&&game.text(node)==='Submit'));
 game.click('Ascending');game.click('Finish');assert.equal(game.completed[0].correct,1);
});
test('all rebuilt Blank tasks contain exact sentence gaps and varied word banks',()=>{
 const core=require('./core.js');
 const {buildBlankItems}=require('../scripts/music-games-blank-passages.cjs');
 for(const code of ['N3','N4','N5','H','AH']){
  const rows=buildBlankItems(code,'test-'+code);
  assert.ok(rows.some(row=>row.clozeGaps.length===2),code+' has two-gap tasks');
  assert.ok(rows.some(row=>row.clozeGaps[0].start===0),code+' has opening gaps');
  assert.ok(rows.some(row=>row.clozeGaps[0].start>0),code+' has later gaps');
  const activity=core.normalize({id:'blank-'+code,title:'Mixed Sentences',template:'complete-the-sentence',items:rows});
  assert.deepEqual(core.validateActivity(activity),[]);
  for(const row of activity.items){
   assert.ok(!/^___:/.test(row.prompt));
   for(const gap of row.clozeGaps)assert.equal(row.clozeText.slice(gap.start,gap.end),gap.text);
  }
 }
});


test('a diagonal Word Search swipe fills skipped cells and completes automatically',()=>{
 const game=playerHarness('wordsearch',{items:[{prompt:'Pet',answer:'CAT'}]});
 const grid=byClass(game,'ig-wordsearch-grid'),cells=grid.props.children,size=Math.sqrt(cells.length);
 let path;
 for(let r=0;r<size&&!path;r++)for(let c=0;c<size&&!path;c++)for(const [dr,dc] of [[1,1],[1,-1],[-1,1],[-1,-1]]){
  const next=Array.from('CAT',(_,i)=>({r:r+dr*i,c:c+dc*i}));
  if(next.every((p,i)=>p.r>=0&&p.c>=0&&p.r<size&&p.c<size&&game.text(cells[p.r*size+p.c])==='CAT'[i]))path=next;
 }
 assert.ok(path,'A newly generated puzzle includes a diagonal word');
 game.enableDocument((x,y)=>({dataset:{wordsearchRow:y,wordsearchCol:x},closest(){return this;}}));
 const node={contains:()=>true,setPointerCapture(){},hasPointerCapture:()=>false};
 const event=p=>({pointerId:1,button:0,currentTarget:node,clientX:p.c,clientY:p.r,preventDefault(){}});
 grid.props.onPointerDown(event(path[0]));game.render();
 byClass(game,'ig-wordsearch-grid').props.onPointerMove(event(path[2]));game.render();
 assert.equal(byClass(game,'ig-wordsearch-grid').props.children.filter(n=>n.props['aria-pressed']).length,3);
 byClass(game,'ig-wordsearch-grid').props.onPointerUp(event(path[2]));game.render();game.flushEffects();
 assert.equal(game.completed.length,1);assert.equal(game.completed[0].correct,1);
 assert.equal(game.nodes().filter(n=>n.type==='button'&&game.text(n)==='Finish').length,0);
});

test('N3 rhythm combinations order eight image-only sums without revealing totals',()=>{
 const activity=require('./activities/hub-n3-rhythm-lengths-order-1.json');
 const {rows,beats}=require('../scripts/build-music-games-rhythm-combinations.cjs');
 assert.equal(activity.items.length,8);assert.ok(activity.items.every(i=>i.prompt===''&&i.media?.type==='image'));
 assert.deepEqual(rows.map(r=>r.rhythms.reduce((sum,n)=>sum+beats[n],0)),[10,9,8,7,6,5,4,3]);
 assert.ok(rows.every(r=>r.rhythms.length===3));
 const game=playerHarness('rank-order',activity);
 const ranked=()=>byClass(game,'ig-rank-list').props.children;
 for(let target=0;target<8;target++){
  let current=ranked().findIndex(row=>game.nodes(row).some(n=>n.type==='img'&&n.props.alt===activity.items[target].media.name));
  assert.ok(current>=0);
  while(current>target){game.nodes().find(n=>n.props['aria-label']===`Move item ${current+1} up`).props.onClick();game.render();current--;}
 }
 game.click('Submit');assert.equal(game.completed[0].correct,8);assert.equal(game.completed[0].total,8);
 assert.deepEqual(Array.from(game.completed[0].answers,a=>a.expected),activity.items.map(i=>i.answer));
});



test('controlled Blank reuses placement, removal and locked neutral feedback for level quizzes',()=>{
 const item={clozeText:'Notes join smoothly, with no gaps.',clozeGaps:[{start:11,end:19,text:'smoothly'},{start:26,end:33,text:'no gaps'}],distractors:['abruptly','separately','clear gaps','rests']};
 let answer;const controlled={bank:['smoothly','no gaps',...item.distractors].map((text,i)=>({id:'c'+i,text})),submitted:false,reveal:false,marks:[true,false],onChange:value=>answer=Array.from(value)};
 const game=playerHarness('complete-the-sentence',{items:[item]},false,controlled);game.click('smoothly');game.click('no gaps');assert.deepEqual(answer,['smoothly','no gaps']);
 clickByAriaLabel(game,'Blank 1');assert.deepEqual(answer,['','no gaps']);game.click('abruptly');assert.deepEqual(answer,['abruptly','no gaps']);
 controlled.submitted=true;game.render();assert.ok(game.nodes().filter(n=>n.type==='button').every(n=>n.props.disabled));assert.ok(!game.nodes().some(n=>(n.props.className||'').includes('ig-cloze-feedback-badge')));assert.equal(game.completed.length,0);
 controlled.reveal=true;game.render();assert.equal(game.nodes().filter(n=>(n.props.className||'').includes('ig-cloze-feedback-badge')).length,2);
});
test('Blank tiles retain authored musical capitals for note sequences, keys and form letters',()=>{
 const names=['D-F-A','F-A-D','C-E-G','G-B-D','B-D-G','E-G-C','B♭','F♯','C major','A minor','ABA','I-IV-V'];
 for(const name of names){const item={prompt:'___',answer:name,clozeText:name,clozeGaps:[{start:0,end:name.length,text:name}]};const game=playerHarness('complete-the-sentence',{items:[item]});const tile=byClass(game,'ig-cloze-bank').props.children[0];assert.equal(game.text(tile),name);game.click(name);assert.equal(game.text(game.nodes().find(n=>n.props['aria-label']==='Blank 1')),name);game.click('Submit');game.click('Finish');assert.equal(game.completed[0].correct,1);}
});

test('regular choice and typing players keep delayed feedback neutral while recording answers',()=>{
 for(const mode of ['quiz','true-or-false']){const game=playerHarness(mode,{items:shortActivity.items.map(item=>({...item,distractors:['Wrong']}))},false,undefined,{feedback:'end'});if(mode==='type-the-answer'){game.nodes().find(n=>n.type==='input').props.onChange({target:{value:'Wrong'}});game.render();game.click('Submit');}else game.click(mode==='true-or-false'?'False':'Wrong');assert.equal(game.progress.at(-1).answers.length,1);assert.ok(game.nodes().every(n=>!/(?:^| )ig-(?:correct|incorrect)(?: |$)/.test(n.props.className||'')));assert.ok(!game.nodes().some(n=>n.props.role==='img'&&['Correct','Incorrect'].includes(n.props['aria-label'])));assert.ok(game.nodes().some(n=>n.type==='button'&&game.text(n)==='Next'));}
});

test('regular Blank records every gap without revealing delayed correctness',()=>{const item={id:'gaps',answer:'Alpha',clozeText:'Alpha Beta',clozeGaps:[{start:0,end:5,text:'Alpha'},{start:6,end:10,text:'Beta'}],distractors:['Gamma','Delta','Epsilon','Zeta']};const game=playerHarness('complete-the-sentence',{items:[item]},false,undefined,{feedback:'end'});game.click('Alpha');game.click('Beta');game.click('Submit');assert.equal(game.progress.at(-1).answers.length,2);assert.ok(game.nodes().every(n=>!/(?:^| )ig-(?:correct|incorrect)(?: |$)/.test(n.props.className||'')));assert.ok(!game.nodes().some(n=>n.props.role==='img'&&['Correct','Incorrect'].includes(n.props['aria-label'])));game.click('Finish');assert.equal(game.completed[0].correct,2);});

test('Contemporary jazz accepts either Blank order in gameplay, score and review',()=>{
 const C=require('./core.js');
 const activity=require('./activities/hub-ah-level-test-blank.json');
 const item=activity.items.find(item=>item.clozeText.startsWith('Contemporary jazz —'));
 for(const values of [['harmony','improvisation'],['improvisation','harmony']]){
  const game=playerHarness('complete-the-sentence',{...activity,items:[item]});
  values.forEach(value=>game.click(value));game.click('Submit');
  assert.equal(game.nodes().filter(n=>n.props.role==='img'&&n.props['aria-label']==='Correct').length,2);
  game.click('Finish');assert.equal(game.completed[0].correct,2);
  const review=C.reviewEntries({...activity,items:[item]},'complete-the-sentence',game.completed[0]);
  assert.ok(review.every(row=>row.correct&&row.expected===row.answer));
 }
});

test('Connections adds a half-second submission buffer and ignores duplicate taps',()=>{
 const activity=require('./core.js').SEEDS.find(seed=>seed.template==='matching-pairs');
 const game=playerHarness('matching-pairs',activity,true),group=activity.items[0].group;
 for(const item of [...activity.items.filter(item=>item.group===group).slice(0,3),activity.items.find(item=>item.group!==group)])game.click(item.prompt);
 const submit=()=>game.nodes().find(n=>n.type==='button'&&game.text(n)==='Submit');
 for(let attempt=0;attempt<4;attempt++){
  const button=submit();button.props.onClick();button.props.onClick();game.render();
  assert.equal(submit().props.disabled,true);
  game.advanceBy(1199);assert.equal(submit().props.disabled,true);
  game.advanceBy(1);if(attempt<3)assert.equal(submit().props.disabled,false);
 }
 assert.equal(game.completed.length,1);assert.equal(game.completed[0].attempts,4);
});

test('a scaled pin drag preserves the grab offset and follows the pointer',()=>{
 const game=playerHarness('labelled-diagram',shortActivity),scene=()=>game.nodes().find(n=>n.type==='svg'&&n.props.className==='ig-pin-scene'),handle=()=>game.nodes().find(n=>n.props['aria-label']==='Move pin: CAT');
 const circle=()=>handle().props.children.filter(n=>n.type==='circle').at(-1).props;
 const start={x:circle().cx,y:circle().cy};
 scene().props.ref.current={viewBox:{baseVal:{x:0,y:0,width:960,height:600}},getBoundingClientRect:()=>({left:100,top:40,width:480,height:300}),setPointerCapture(){},hasPointerCapture:()=>true,releasePointerCapture(){}};
 const event=(id,x,y)=>({pointerId:id,button:0,clientX:100+x*.5,clientY:40+y*.5,preventDefault(){},stopPropagation(){}});
 handle().props.onPointerDown(event(7,start.x+5,start.y+3));game.render();
 scene().props.onPointerMove(event(7,start.x+25,start.y+33));game.render();
 assert.equal(circle().cx,start.x+20);assert.equal(circle().cy,start.y+30);
 scene().props.onPointerMove(event(8,800,500));game.render();assert.equal(circle().cx,start.x+20);
 scene().props.onPointerCancel(event(7,0,0));game.render();assert.equal(circle().cx,start.x);assert.equal(circle().cy,start.y);
});

test('Label ticks and crosses share the circle SVG coordinate system',()=>{
 for(const placements of [{a:'a',b:'b'},{a:'b',b:'a'}]){
  const game=playerHarness('labelled-diagram',shortActivity,false,undefined,{diagramReview:true,diagramSubmission:{placements,order:['a','b']}});
  const badges=game.nodes().filter(n=>n.props.className==='ig-pin-feedback');assert.equal(badges.length,2);
  assert.equal(game.nodes().filter(n=>n.type==='foreignObject').length,0);
  for(const badge of badges){
   assert.match(badge.props.transform,/^translate\(/);
   const circle=badge.props.children.find(n=>n.type==='circle'),mark=badge.props.children.find(n=>n.type==='path');
   assert.equal(circle.props.cx,'0');assert.equal(circle.props.cy,'0');assert.equal(circle.props.r,'13');
   assert.equal(mark.props.stroke,'#fff');assert.equal(mark.props.strokeWidth,'3');
   assert.equal(mark.props.d,placements.a==='a'?'M-7 0 -2 5 7 -5':'M-5 -5 5 5 M5 -5 -5 5');
  }
 }
});


test('Label stave and target taps wait for click so a swipe can scroll first',()=>{
 const game=playerHarness('labelled-diagram',shortActivity);
 const scene=game.nodes().find(n=>n.props.className==='ig-pin-scene');
 const target=game.nodes().find(n=>n.props['aria-label']==='Target 1');
 assert.equal(scene.props.onPointerDown,undefined);
 assert.equal(target.props.onPointerDown,undefined);
 assert.equal(typeof scene.props.onClick,'function');
 assert.equal(typeof target.props.onClick,'function');
 const css=fs.readFileSync('music-games/diagram.css','utf8');
 assert.match(css,/\.ig-pin-scene\{[^}]*touch-action:manipulation/);
 assert.match(css,/\.ig-pin-scene :is\([^}]*ig-pin-handle[^}]*\{touch-action:none\}/);
});

test('Connections freezes time at the final submission before reveal animations',()=>{
 const activity=require('./core.js').SEEDS.find(seed=>seed.template==='matching-pairs');let frozen=0;
 const game=playerHarness('matching-pairs',activity,true,undefined,{onSubmitAnswers:()=>frozen++});
 const groups=[...new Set(activity.items.map(item=>item.group))];
 for(const [index,group]of groups.entries()){
  for(const item of activity.items.filter(item=>item.group===group))game.click(item.prompt);
  game.click('Submit');assert.equal(frozen,index===3?1:0);
  if(index<3)game.advanceBy(2000);
 }
 assert.equal(game.completed.length,0);game.advanceBy(3000);assert.equal(game.completed.length,1);assert.equal(frozen,1);
});
test('Connections freezes time immediately when its final life is lost',()=>{
 const activity=require('./core.js').SEEDS.find(seed=>seed.template==='matching-pairs');let frozen=0;
 const game=playerHarness('matching-pairs',activity,true,undefined,{onSubmitAnswers:()=>frozen++}),group=activity.items[0].group;
 for(const item of [...activity.items.filter(item=>item.group===group).slice(0,3),activity.items.find(item=>item.group!==group)])game.click(item.prompt);
 for(let attempt=0;attempt<4;attempt++){game.click('Submit');assert.equal(frozen,attempt===3?1:0);if(attempt<3)game.advanceBy(1200);}
 assert.equal(game.completed.length,0);game.advanceBy(1200);assert.equal(game.completed.length,1);
});

test('wordsearch review cannot change selections or score another answer',()=>{
 const game=playerHarness('wordsearch',shortActivity,false,undefined,{active:false});
 const cell=byClass(game,'ig-wordsearch-grid').props.children[0];clickNode(game,cell);
 assert.equal(game.progress.length,0);assert.equal(byClass(game,'ig-wordsearch-grid').props.children.filter(n=>n.props['aria-pressed']).length,0);
});
test('crossword review keeps inputs read-only and its keyboard stopped',()=>{
 const game=playerHarness('crossword',shortActivity,false,undefined,{active:false});
 const clue=game.nodes().find(n=>n.type==='button'&&(n.props.className||'').includes('ig-crossword-clue'));
 clue.props.onClick();game.render();
 assert(game.nodes().filter(n=>n.type==='input').every(n=>n.props.readOnly));
 assert(byClass(game,'ig-crossword-keyboard').props.children.every(n=>n.props.disabled));assert.equal(game.progress.length,0);
});
