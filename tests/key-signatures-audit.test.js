const test=require('node:test'),assert=require('node:assert/strict'),S=require('../shared/key-signatures-selection'),harness=require('./helpers/key-signatures-harness.cjs'),{run}=require('../scripts/audit-key-signatures.cjs');
test('the supported levels and selected keys balance their answers and produce valid notation',()=>{assert.deepEqual(run(300).failures,[]);});
test('typed marking accepts common B-flat major spellings and rejects B major',()=>{const h=harness();for(const answer of ['Bb','Bb major','Bbmaj','B flat major','B♭ major'])assert(h.answerMatches(answer,'B flat major'),answer);for(const answer of ['B','B major','Bb minor'])assert(!h.answerMatches(answer,'B flat major'),answer);});
test('bar 5 shows the new signature without cancellation naturals', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const { KEYS, Score } = harness();
  const renderChange = (startKey, key) => renderToStaticMarkup(React.createElement(Score, {
    question: { type: 'identify-key-change', startKey, key, bars: Array.from({ length: 8 }, () => []) },
  }));
  const toD = renderChange(KEYS['d-minor'], KEYS['d-major']);
  assert.doesNotMatch(toD, /\uE261/);
  assert.equal((toD.match(/\uE262/g) || []).length, 2);
  const toC = renderChange(KEYS['d-major'], KEYS['c-major']);
  assert.doesNotMatch(toC, /\uE261/);
  assert.equal((toC.match(/\uE262/g) || []).length, 2);
});
test('AH retains its key-change weighting and gives every target key equal coverage',()=>{const h=harness(),types={},keys={};for(let i=0;i<1000;i++){const q=h.makeQuestion({level:'AH'});types[q.type]=(types[q.type]||0)+1;if(q.type==='identify-key-change')keys[q.key.id]=(keys[q.key.id]||0)+1;}assert.deepEqual(types,{'identify-key':720,'identify-key-change':280});assert.equal(Object.keys(keys).length,8);assert(Object.values(keys).every(count=>count===35));});
test('minor-key evidence never replaces the opening tonic or loses its raised leading note',()=>{const h=harness(),tonic={'a-minor':'A4','d-minor':'D4','e-minor':'E4'},leading={'a-minor':'G#','d-minor':'C#','e-minor':'D#'};for(let i=0;i<700;i++){const q=h.makeQuestion({level:'AH'});if(q.type==='identify-key-change')continue;if(tonic[q.key.id]){assert.equal(q.bars[0][0].pitch,tonic[q.key.id]);assert(q.bars.flat().some(note=>note.pitch.startsWith(leading[q.key.id])));}}});
test('Higher score renders keyboard-accessible note targets',()=>{const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),h=harness('scaledegrees'),q=h.makeQuestion();const html=renderToStaticMarkup(React.createElement(h.ScoreArea,{question:q,onSelect(){},onHover(){},onLeave(){}}));assert(html.includes('role="button"'));assert(html.includes('tabindex="0"'));});
test('both Higher Key Signatures routes use the current blue note highlight', () => {
  const { readFileSync } = require('node:fs');
  const { createHash } = require('node:crypto');
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const runtime = readFileSync('generated-runtimes/scaledegrees-1.js');
  const version = createHash('sha256').update(runtime).digest('hex').slice(0, 12);
  for (const page of ['keysignatures.html', 'scaledegrees.html']) {
    assert.ok(readFileSync(page, 'utf8').includes(`generated-runtimes/scaledegrees-1.js?v=${version}`), page);
  }
  const { makeQuestion, ScoreArea } = harness('scaledegrees');
  const question = makeQuestion();
  const [selected, hovered] = question.bars[0];
  const markup = renderToStaticMarkup(React.createElement(ScoreArea, {
    question, selectedId: selected.id, hoveredId: hovered.id,
  }));
  const highlightedNotes = markup.split('<g role="button"').slice(1, 3);
  assert.equal(highlightedNotes.length, 2);
  for (const note of highlightedNotes) {
    assert.match(note, /fill="#2563eb"/);
    assert.doesNotMatch(note, /filter=/);
  }
});
test('legacy profiles and empty or invalid key lists use the level defaults', () => {
  const keys = ['c-major', 'f-major'];
  for (const saved of [undefined, { identify: false, build: true }, [], ['d-major']]) {
    assert.deepEqual(S.normaliseKeys(keys, saved), keys);
  }
  assert.deepEqual(S.normaliseKeys(keys, ['f-major', 'f-major', 'd-major']), ['f-major']);
});

test('AH falls back to identifying one key when selected keys share a signature', () => {
  const { makeQuestion } = harness();
  for (let index = 0; index < 25; index++) {
    const question = makeQuestion({ level: 'AH', enabledKeys: ['c-major', 'a-minor'] });
    assert.equal(question.type, 'identify-key');
    assert.ok(['c-major', 'a-minor'].includes(question.key.id));
  }
});
