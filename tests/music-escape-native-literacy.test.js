'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const core = require('../music-escape/core');
const content = require('../music-escape/content');
const loadDictation = require('./helpers/rhythmic-dictation-harness.cjs');
const loadFollowScore = require('./helpers/follow-score-harness.cjs');

function loadTimeSignatures() {
  const context = vm.createContext({ window: { MLH: {}, React }, React });
  for (const file of ['bravura-symbols.js', 'shared/shared-notation-config.js', 'shared/escape-literacy-activity.js']) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context);
  }
  const runtime = fs.readFileSync('generated-runtimes/timesignatures-1.js', 'utf8');
  const entry = runtime.indexOf('const rootElement=document.getElementById("root")');
  assert.ok(entry > 0);
  vm.runInContext(runtime.slice(0, entry) + 'globalThis.activity={LEVELS,makeQuestion,levelEnabledMap,barsPerSystemForQuestion,EscapeTimeSignatureChoices,Score,rhythmInfo};', context);
  return context.activity;
}

test('Escape Room uses native time-signature pools and four correctly filled bars', () => {
  const activity = loadTimeSignatures();
  for (const level of core.levels) {
    const profile = activity.LEVELS[level];
    const meters = new Set();
    let timeChanges = 0;
    for (let seed = 1; seed <= 180; seed++) {
      const question = activity.makeQuestion(level, activity.levelEnabledMap(level), profile.rhythmIds.includes('rests'), 4);
      assert.equal(question.bars.length, 4);
      meters.add(question.timeSignature.id);
      const change = question.questionType === 'time-change';
      if (change) {
        timeChanges++;
        assert.equal(activity.barsPerSystemForQuestion(question), 2);
        assert.notEqual(question.givenTimeSignature.id, question.timeSignature.id);
      }
      question.bars.forEach((bar, index) => {
        const meter = change && index < 2 ? question.givenTimeSignature : question.timeSignature;
        const beats = bar.notes.reduce((sum, note) => sum + activity.rhythmInfo(note.rhythm).beats, 0);
        assert.equal(beats, meter.beatsPerBar);
      });
      const room = core.generate(seed, { level }, content).find(room => room.literacy.kind === 'time');
      if (!room) continue;
      const digit = room.literacy.digit;
      const choices = renderToStaticMarkup(React.createElement(activity.EscapeTimeSignatureChoices, {
        activity: { level, clue: { digit } }, correctAnswer: question.timeSignature.id
      }));
      assert.equal((choices.match(/<button/g) || []).length, profile.timeSignatureIds.length);
      assert.ok(choices.includes(`<strong>${digit}</strong><span class="sr-only">${question.timeSignature.id}</span>`));
    }
    assert.deepEqual([...meters].sort(), [...profile.timeSignatureIds].sort());
    assert.equal(timeChanges > 0, level === 'AH');
  }
});

test('native dictation options retain the exact playback score at each code position', () => {
  const activity = loadDictation();
  for (const level of core.levels) {
    for (let run = 0; run < 60; run++) {
      const digit = run % 3 + 1;
      const question = activity.makeEscapeDictationQuestion(level, digit);
      assert.equal(question.answerIndex, digit - 1);
      assert.equal(question.options.length, 3);
      assert.equal(question.options[digit - 1].correct, true);
      assert.equal(question.bars, question.options[digit - 1].bars);
      for (const option of question.options) {
        assert.ok(option.bars.length <= 4);
        for (const bar of option.bars) {
          const beats = bar.notes.reduce((sum, note) => sum + activity.rhythmInfo(activity.getAudioRhythm(note)).beats, 0);
          assert.ok(Math.abs(beats - activity.Writing.capacity(question.timeSignature.id)) < 1e-7);
        }
      }
    }
  }
});

test('native Follow the Score keeps eight bars, accompaniment and the correct stopping bar', () => {
  const activity = loadFollowScore();
  for (const level of core.levels) {
    for (let digit = 2; digit <= 8; digit++) {
      const question = activity.makeEscapeFollowScoreQuestion({ level, clue: { barIndex: digit - 1 } });
      assert.equal(question.bars.length, 8);
      assert.ok(question.accompanimentPattern);
      assert.equal(question.target.barIndex, digit - 1);
      assert.ok(question.target.id);
      const barsBeforeStop = question.bars.slice(0, digit - 1);
      const elapsedBeats = barsBeforeStop.reduce((sum, bar) => sum + activity.timeSignatureForBar(question, bar).beats, 0);
      const stopBeats = activity.followScoreStopAfterSeconds(question) * question.tempoBpm / 60;
      assert.ok(stopBeats > elapsedBeats);
      assert.ok(stopBeats <= elapsedBeats + activity.timeSignatureForBar(question, question.bars[digit - 1]).beats + 1e-7);
    }
  }
});

test('Escape Room can use every Ear Training exercise at its level with one correct digit', () => {
  const window = { MLH: {} };
  const context = vm.createContext({window, React, URLSearchParams});
  window.PracticeMelodyGenerator = require('../practice-melody-generator.js');
  for (const file of [
    'aural-accompaniment.js', 'melodic-dictation-generator.js',
    'aural-tonalities.js', 'time-signatures-listening.js', 'tempo-changes-listening.js',
    'ear-training-exercises.js', 'ear-training-piano-concepts.js',
  ]) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context);
  }
  const runtime = fs.readFileSync('generated-runtimes/auralrecognition-1.js', 'utf8');
  const launch = runtime.lastIndexOf('const root=document.getElementById("root")');
  assert.ok(launch > 0);
  vm.runInContext(runtime.slice(0, launch) + `
    globalThis.activity = {topicsForLevel, MERGED_SUBTOPICS, makeEscapeEarTrainingClue, isCorrectChoice};
  `, context);
  const activity = context.activity;
  for (const level of core.levels) {
    const topics = activity.topicsForLevel(level).filter(topic => !activity.MERGED_SUBTOPICS.has(topic));
    for (const topic of topics) {
      for (let run = 0; run < 12; run++) {
        const clue = {seed:100 + run, slot:0, digit:9};
        const { question, choices } = structuredClone(activity.makeEscapeEarTrainingClue({level, clue}, (items, seed) =>
          seed === clue.seed ? [topic, ...items.filter(item => item !== topic)] : core.shuffle(items, core.random(seed))
        ));
        assert.equal(question.level, level);
        assert.ok(question.playbackTempo.bpm > 0);
        assert.ok(choices.length >= 2, `${level} ${topic}`);
        assert.equal(new Set(choices.map(choice => choice.digit)).size, choices.length);
        assert.deepEqual(choices.filter(choice => activity.isCorrectChoice(choice.id, question)).map(choice => choice.digit), [9]);
      }
    }
  }
});
