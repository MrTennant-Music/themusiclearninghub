/* Timed sight-reading attempt rules, independent of rendering and clocks. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.MLH = root.MLH || {};
    root.MLH.SightReadingCore = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const NoteCore = typeof module === 'object' && module.exports ? require('./shared/note-identification-core.js') : window.NOTE_IDENTIFICATION_CORE;
  const pickers = new WeakMap();
  const MIN_DURATION_MS = 100;
  const SPEED_STEP_MS = 100;
  const CORRECT_PER_STEP = 3;
  const DURATION_MS = 3600;
  const FEEDBACK_MS = 500;

  // Accidentals may change the answer, but repeated written positions are
  // avoided when another pitch/clef is available in the supplied setup.
  const position = question => JSON.stringify([question.pitch, question.clef || '']);
  const identity = question => JSON.stringify([question.pitch, question.clef || '', question.answer, question.accidental || '']);

  function createAttempt(pool, random = Math.random) {
    if (!Array.isArray(pool) || !pool.length) throw new Error('Enable at least one available note before starting Sight Reading.');
    if (pool.some(question => !question || typeof question !== 'object' || typeof question.pitch !== 'string' || !question.pitch || typeof question.answer !== 'string' || !question.answer)) {
      throw new Error('Every Sight Reading question needs a pitch and a note-name answer.');
    }
    if (typeof random !== 'function') throw new Error('Provide a random-number function.');
    const unique = [...new Map(pool.map(question => [identity(question), question])).values()];
    pickers.set(unique, NoteCore.createFromPool(unique,random));
    const question = pickQuestion(unique, null, random);
    const upcoming = [];
    for (let i = 0; i < 8; i++) upcoming.push(pickQuestion(unique, upcoming[i - 1] || question, random));
    return {pool: unique, question, upcoming, index: 0, score: 0, selected: null, phase: 'ready', durationMs: DURATION_MS, remainingMs: DURATION_MS, records: []};
  }

  function pickQuestion(pool, previous, random) {
    if(!pickers.has(pool))pickers.set(pool,NoteCore.createFromPool(pool,random));
    const selected=pickers.get(pool).next(previous,random);
    return {...pool.find(question=>identity(question)===identity(selected))};
  }

  function durationForScore(score) {
    return Math.max(MIN_DURATION_MS, DURATION_MS - Math.floor(score / CORRECT_PER_STEP) * SPEED_STEP_MS);
  }

  function noteSpacing(score) {
    return Math.max(90 / 570, durationForScore(score) / DURATION_MS);
  }

  function start(state) {
    return state?.phase === 'ready' ? {...state, phase: 'playing'} : state;
  }

  function selectAnswer(state, answer) {
    if (state?.phase !== 'playing' || (answer !== null && typeof answer !== 'string')) return state;
    return {...state, selected: answer};
  }

  function settle(state) {
    if (state?.phase !== 'playing') return state;
    const question = state.question;
    const correct = state.selected === question.answer;
    const record = {question, answer: state.selected, expected: question.answer, correct};
    return {...state, phase: correct ? 'feedback' : 'finished', remainingMs: 0, score: state.score + Number(correct), records: [record]};
  }

  function next(state, random = Math.random) {
    if (state?.phase !== 'feedback') return state;
    const durationMs = durationForScore(state.score);
    return {...state, question: state.upcoming[0], upcoming: [...state.upcoming.slice(1), pickQuestion(state.pool, state.upcoming[state.upcoming.length - 1], random)], phase: 'playing', index: state.index + 1, selected: null, durationMs, remainingMs: durationMs};
  }

  function pause(state, remainingMs) {
    if (state?.phase !== 'playing') return state;
    const remaining = Number.isFinite(remainingMs) ? remainingMs : state.remainingMs;
    return {...state, phase: 'paused', remainingMs: Math.max(0, Math.min(state.durationMs, remaining))};
  }

  function resume(state) {
    return state?.phase === 'paused' ? {...state, phase: 'playing'} : state;
  }

  function frequencyForQuestion(question) {
    if (!question || typeof question.pitch !== 'string') return null;
    const match = /^([A-G])([#b♯♭]?)(-?\d+)$/i.exec(question.pitch);
    if (!match) return null;
    const natural = {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11};
    const embedded = match[2] === '#' || match[2] === '♯' ? 1 : match[2] ? -1 : 0;
    let accidental = embedded;
    if (question.accidental != null) {
      if (!['sharp', 'flat', 'natural'].includes(question.accidental)) return null;
      accidental = question.accidental === 'sharp' ? 1 : question.accidental === 'flat' ? -1 : 0;
    }
    const midi = (Number(match[3]) + 1) * 12 + natural[match[1].toUpperCase()] + accidental;
    if (!Number.isInteger(midi) || midi < 0 || midi > 127) return null;
    return 440 * 2 ** ((midi - 69) / 12);
  }

  return Object.freeze({DURATION_MS, MIN_DURATION_MS, SPEED_STEP_MS, CORRECT_PER_STEP, FEEDBACK_MS, durationForScore, noteSpacing, createAttempt, start, selectAnswer, settle, next, pause, resume, frequencyForQuestion});
});
