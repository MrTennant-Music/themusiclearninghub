const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const S = require('../sight-reading-core.js');
const pool = [
  {pitch: 'C4', answer: 'C', clef: 'treble', step: -2},
  {pitch: 'G4', answer: 'G', clef: 'treble', step: 2},
  {pitch: 'G3', answer: 'G', clef: 'bass', step: 7}
];

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

test('continuous attempts draw independent notes without repeating positions', () => {
  const original = JSON.stringify(pool);
  let state = S.start(S.createAttempt(pool, () => 0));
  for (let i = 0; i < 1000; i++) {
    const previous = state.question;
    const preview = state.upcoming[0];
    state = S.next(S.settle(S.selectAnswer(state, previous.answer)), () => 0);
    assert.equal(state.question, preview);
    assert.equal(state.upcoming.length, 8);
    assert.notEqual(state.question.pitch + state.question.clef, previous.pitch + previous.clef);
    assert.equal(state.index, i + 1);
    assert.equal(state.score, i + 1);
    assert.equal(state.phase, 'playing');
    assert.equal(state.records.length, 1, 'History stays bounded during unlimited play');
  }
  assert.equal(JSON.stringify(pool), original);
});

test('pool validation, deduplication and a one-note setup remain supported', () => {
  let state = S.start(S.createAttempt([pool[0], {...pool[0]}], () => 0));
  assert.equal(state.pool.length, 1);
  const first = state.question;
  state = S.next(S.settle(S.selectAnswer(state, state.question.answer)));
  assert.deepEqual(state.question, first);
  assert.notEqual(state.question, first);
  for (const invalid of [[], null, undefined, 'notes']) assert.throws(() => S.createAttempt(invalid), /available note/);
  for (const invalid of [[null], [{}], [{pitch: 'C4', answer: ''}]]) assert.throws(() => S.createAttempt(invalid), /pitch and a note-name answer/);
  for (const random of [() => 1, () => -1, () => NaN, () => Infinity]) assert.ok(S.createAttempt(pool, random).question);
});

test('selection remains editable and only the answer at the deadline is marked', () => {
  const ready = freeze(S.createAttempt([pool[0]], () => 0));
  assert.equal(S.selectAnswer(ready, 'C'), ready);
  assert.equal(S.settle(ready), ready);
  const playing = freeze(S.start(ready));
  const wrong = freeze(S.selectAnswer(playing, 'D'));
  assert.equal(wrong.score, 0);
  assert.equal(wrong.records.length, 0);
  const corrected = freeze(S.selectAnswer(wrong, 'C'));
  const settled = freeze(S.settle(corrected));
  assert.equal(settled.phase, 'feedback');
  assert.equal(settled.score, 1);
  assert.equal(settled.remainingMs, 0);
  assert.deepEqual(settled.records, [{question: corrected.question, answer: 'C', expected: 'C', correct: true}]);
  assert.equal(playing.selected, null);
  assert.equal(wrong.selected, 'D');
  assert.equal(S.settle(settled), settled);
  assert.equal(S.selectAnswer(settled, 'D'), settled);
  const next = S.next(settled);
  assert.equal(next.index, 1);
  assert.equal(next.phase, 'playing');
  assert.equal(next.selected, null);
  assert.equal(next.remainingMs, 3600);
});

test('every three correct answers speed up subsequent notes by 100ms', () => {
  let state = S.start(S.createAttempt([pool[0]], () => 0));
  for (let i = 1; i <= 9; i++) {
    state = S.next(S.settle(S.selectAnswer(state, 'C')));
    assert.equal(state.durationMs, 3600 - Math.floor(i / 3) * 100);
  }
  assert.equal(S.durationForScore(10000), 100);
});

test('wrong and unanswered notes end the game without advancing or awarding points', () => {
  for (const answer of ['D', null]) {
    let state = S.start(S.createAttempt([pool[0]]));
    state = S.next(S.settle(S.selectAnswer(state, 'C')));
    state = S.settle(S.selectAnswer(state, answer));
    assert.equal(state.phase, 'finished');
    assert.equal(state.score, 1);
    assert.equal(state.index, 1);
    for (const action of [S.next, S.start, S.settle, S.resume]) assert.equal(action(state), state);
    assert.equal(S.selectAnswer(state, 'C'), state);
  }
});

test('octave and clef survive in questions while scoring uses the displayed note-name answer', () => {
  const question = {pitch: 'G3', answer: 'Gb', accidental: 'flat', clef: 'bass', step: 7};
  const state = S.settle(S.selectAnswer(S.start(S.createAttempt([question])), 'Gb'));
  assert.equal(state.score, 1);
  assert.deepEqual(state.records[0].question, question);
  assert.equal(S.settle(S.selectAnswer(S.start(S.createAttempt([question])), 'G')).score, 0);
});

test('pause preserves selection and finite remaining time without marking or advancing', () => {
  const playing = freeze(S.selectAnswer(S.start(S.createAttempt(pool, () => 0)), 'C'));
  const paused = freeze(S.pause(playing, 1234));
  assert.equal(paused.phase, 'paused');
  assert.equal(paused.remainingMs, 1234);
  assert.equal(paused.selected, 'C');
  assert.equal(paused.index, 0);
  assert.equal(paused.records.length, 0);
  for (const action of [S.start, S.settle, S.next]) assert.equal(action(paused), paused);
  assert.equal(S.selectAnswer(paused, 'D'), paused);
  assert.equal(S.pause(paused, 500), paused);
  const resumed = S.resume(paused);
  assert.equal(resumed.phase, 'playing');
  assert.equal(resumed.remainingMs, 1234);
  assert.equal(resumed.selected, 'C');
  assert.equal(S.resume(resumed), resumed);
  assert.equal(S.pause(playing, -2).remainingMs, 0);
  assert.equal(S.pause(playing, 4000).remainingMs, 3600);
  for (const value of [NaN, Infinity, undefined, '200']) assert.equal(S.pause(playing, value).remainingMs, 3600);
  assert.equal(S.settle(S.resume(S.pause(playing, 0))).score, 1);
});

test('audio pitch respects octave and notation accidentals, including enharmonic equivalents', () => {
  assert.equal(S.frequencyForQuestion({pitch: 'A4'}), 440);
  assert.ok(Math.abs(S.frequencyForQuestion({pitch: 'C4'}) - 261.625565) < 0.000001);
  assert.equal(S.frequencyForQuestion({pitch: 'A5'}), 880);
  assert.equal(S.frequencyForQuestion({pitch: 'A3'}), 220);
  const sharp = S.frequencyForQuestion({pitch: 'F4', accidental: 'sharp'});
  const flat = S.frequencyForQuestion({pitch: 'G4', accidental: 'flat'});
  assert.equal(sharp, flat);
  assert.equal(S.frequencyForQuestion({pitch: 'F#4'}), sharp);
  assert.equal(S.frequencyForQuestion({pitch: 'Gb4'}), sharp);
  assert.equal(S.frequencyForQuestion({pitch: 'F♯4'}), sharp);
  assert.equal(S.frequencyForQuestion({pitch: 'G♭4'}), sharp);
  assert.equal(S.frequencyForQuestion({pitch: 'F#4', accidental: 'sharp'}), sharp, 'An explicit accidental does not double an embedded accidental');
  assert.equal(S.frequencyForQuestion({pitch: 'Cb4'}), S.frequencyForQuestion({pitch: 'B3'}));
  assert.equal(S.frequencyForQuestion({pitch: 'B3', accidental: 'sharp'}), S.frequencyForQuestion({pitch: 'C4'}));
  assert.equal(S.frequencyForQuestion({pitch: 'G4', accidental: 'natural'}), S.frequencyForQuestion({pitch: 'G4'}));
  for (const question of [null, {}, {pitch: 60}, {pitch: 'H4'}, {pitch: 'A100'}, {pitch: 'G4', accidental: 'double-sharp'}]) assert.equal(S.frequencyForQuestion(question), null);
});
