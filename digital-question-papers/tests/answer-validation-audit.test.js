"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const marking = require("../exam-marking.js");

const part = (answer, extra = {}) => ({ type: "short-text", marks: 1, acceptedAnswers: [answer], ...extra });

test("reasonable spelling, punctuation, case and spacing retain credit", () => {
  for (const [answer, response] of [
    ["crescendo", "creshendo"], ["crescendo", "  CRESCENDO!  "],
    ["pizzicato", "pizzacato"], ["coloratura", "colouratura"],
    ["a cappella", "A   cappella"], ["leitmotiv", "leitmotif"],
    ["clarinet", "clarinets"], ["syncopation", "synocpation"],
    ["triplet", "triplets"], ["triplets", "triplet"],
    ["tone colour", "tone color"], ["metre", "meter"],
    ["synthesiser", "synthesizer"], ["programme music", "program music"],
    ["tone color", "tone colour"], ["meter", "metre"], ["synthesizer", "synthesiser"],
  ]) assert.equal(marking.markSubquestion(part(answer), response).marks, 1, `${response} → ${answer}`);
});

test("similar spellings must not substitute a different musical meaning", () => {
  for (const [answer, response] of [
    ["triplet", "triple"], ["triplets", "triple"], ["concerto", "concert"],
    ["major", "minor"], ["crescendo", "decrescendo"],
    ["accelerando", "ritardando"], ["perfect", "imperfect"],
    ["C major", "G major"], ["6/8", "9/8"], ["A4", "A5"],
    ["major third", "minor third"], ["sharp", "flat"],
    ["three", "threes"], ["seven", "sevens"], ["eleven", "elven"],
  ]) assert.equal(marking.markSubquestion(part(answer), response).marks, 0, `${response} must not mean ${answer}`);
  assert.equal(marking.markSubquestion(part("triplet", { acceptedAnswers: ["triplet", "triple"] }), "triple").marks, 1, "explicit question alternatives remain authoritative");
  const lines = { type: "concept-lines", marks: 1, conceptBank: [{ label: "Triplet", correct: true }] };
  assert.equal(marking.markSubquestion(lines, "triple").marks, 0);
  assert.equal(marking.markSubquestion(lines, "triplet").marks, 1);
});

test("duplicate ticks cannot manufacture extra marks", () => {
  const checkbox = { type: "checkbox", marks: 2, maxSelections: 2, answers: ["Octave leap", "A cappella"] };
  assert.equal(marking.markSubquestion(checkbox, ["Octave leap", "Octave leap"]).marks, 1);
  assert.equal(marking.markSubquestion(checkbox, ["Octave leap", "A cappella"]).marks, 2);
});

test("question-level strict matching disables fuzzy and shared aliases", () => {
  assert.equal(marking.markSubquestion(part("crescendo", { allowFuzzy: false, allowCommonSpellings: false }), "creshendo").marks, 0);
});

test("explicitly denying a concept does not earn credit for naming it", () => {
  const keyword = part("crescendo", { acceptedKeywords: ["crescendo"] });
  for (const response of ["no crescendo", "there is not a crescendo", "without any crescendo", "doesn't use crescendo"]) {
    assert.equal(marking.markSubquestion(keyword, response).marks, 0, response);
  }
  assert.equal(marking.markSubquestion(keyword, "There is a crescendo").marks, 1);
  assert.equal(marking.markSubquestion(keyword, "Not only crescendo but also a change of key").marks, 1);
  const review = { type: "structured-review", marks: 1, autoMark: true, finalAnswerField: true, headings: [{ id: "dynamics", concepts: [{ label: "Crescendo", answers: ["crescendo"] }] }] };
  assert.equal(marking.markSubquestion(review, { final: "No crescendo" }).marks, 0);
  assert.equal(marking.markSubquestion(review, { final: "No crescendo in the opening. Later there is a crescendo." }).marks, 1);
  assert.equal(marking.markSubquestion(review, { final: "No creshendo" }).marks, 0);
});

test("AH 2019 voice order accepts the official STAB abbreviation and consistent spelling tolerance", () => {
  const paper = require("../papers/advanced-higher-2019.js");
  const question = paper.questions[0].subquestions.find(part => part.id === "q1e");
  const { answerComplete } = require("../exam-engine.js");
  for (const answer of ["STAB\n\n\n", "s t a b", "Sopranno\nTenner\nAlto\nBass", "Soprano,Tenor,Alto,Bass", "Soprano Tenor Alto Bass\n\n\n"]) assert.equal(marking.markSubquestion(question, answer).marks, 1, answer);
  for (const answer of ["STBA\n\n\n", "Soprano\nAlto\nTenor\nBass"]) assert.equal(marking.markSubquestion(question, answer).marks, 0, answer);
  assert.equal(answerComplete(question, "STAB\n\n\n"), true);
  assert.equal(answerComplete(question, "STBA\n\n\n"), true, "completion must not reveal whether an entered order is correct");
  assert.equal(answerComplete(question, "STA\n\n\n"), false);
  assert.equal(answerComplete(question, "Soprano Alto Tenor Bass\n\n\n"), true, "completion of an inline order is also independent of correctness");
});

test("N5 2022 Q7 accepts official non-real lyric descriptions without weakening negation rules", () => {
  const paper = require('../papers/national5-2022.js');
  const question = paper.questions.flatMap(q => q.subquestions).find(p => p.id === 'q7a2');
  for (const answer of ['words that are not real', 'not real words', 'lyrics that do not make sense', 'lyrics that don’t make sense']) {
    assert.equal(marking.markSubquestion(question, answer).marks, 1, answer);
  }
  for (const answer of ['real words', 'lyrics that make sense', 'no jazz', 'not improvised', 'not nonsense']) {
    assert.equal(marking.markSubquestion(question, answer).marks, 0, answer);
  }
});

test("N5 2026 Q3(c) preserves official acceptance of any second", () => {
  const question = require('../papers/national5-2026.js').questions.flatMap(q => q.subquestions).find(p => p.id === 'q3c');
  for (const answer of ['tone', 'major second', 'minor second', 'minor 2nd']) assert.equal(marking.markSubquestion(question, answer).marks, 1, answer);
  for (const answer of ['third', 'semitone']) assert.equal(marking.markSubquestion(question, answer).marks, 0, answer);
});

test("Higher 2016 ornament fallback and lyric abbreviation follow the official guidance", () => {
  const parts = require('../papers/higher-2016.js').questions.flatMap(q => q.subquestions);
  const analysis = parts.find(p => p.id === 'q6a');
  for (const [answer, marks] of [['ornaments', 1], ['mordent and ornaments', 1], ['turn and ornaments', 1], ['acciaccatura and mordent', 2], ['acciaccatura and ornaments', 1]]) {
    assert.equal(marking.markSubquestion(analysis, { final: answer }).marks, marks, answer);
  }
  assert.equal(marking.markSubquestion(parts.find(p => p.id === 'q8a'), { 5: 'dominant 7th' }).marks, 1, 'Official MI page 6 names dominant 7th at line 5');
});

test("Higher 2017 official alternative instruments share a single marking point", () => {
  const analysis = require('../papers/higher-2017.js').questions.flatMap(q => q.subquestions).find(p => p.id === 'q7a');
  for (const [answer, marks] of [['trumpet, banjo', 1], ['violin, mandolin', 1], ['banjo, mandolin', 2], ['trumpet, violin', 2]]) {
    assert.equal(marking.markSubquestion(analysis, { final: answer }).marks, marks, answer);
  }
});

test('Higher 2019 excludes concerto grosso and nested relative-minor credit', () => {
  const q = require('../papers/higher-2019').questions.flatMap(q => q.subquestions).find(p => p.id === 'q7a');
  for (const [answer, marks] of [['concerto grosso', 0], ['concerto', 1], ['relative minor', 1], ['relative minor and minor tonality', 2], ['mordent ornament', 0], ['trill', 1]]) {
    assert.equal(marking.markSubquestion(q, { final: answer }).marks, marks, answer);
  }
});

test('Higher 2022 preserves each official group and instrument alternative', () => {
  const q = require('../papers/higher-2022').questions.flatMap(q => q.subquestions).find(p => p.id === 'q7a');
  for (const [answer, marks] of [['time changes, rubato', 1], ['rallentando, pauses', 1], ['violin', 1], ['female vocals', 1], ['strings', 0], ['time changes, syncopation', 2]]) {
    assert.equal(marking.markSubquestion(q, { final: answer }).marks, marks, answer);
  }
});

test('Higher 2023 does not infer an extra tonality mark from the named minor scale', () => {
  const q = require('../papers/higher-2023').questions.flatMap(q => q.subquestions).find(p => p.id === 'q6a');
  for (const [answer, marks] of [['melodic minor scale', 1], ['minor scale', 1], ['minor tonality and melodic minor scale', 2], ['harmonic minor scale', 0]]) {
    assert.equal(marking.markSubquestion(q, { final: answer }).marks, marks, answer);
  }
});

test('Higher 2024 compound-time guidance excludes bare beat counts and permits any fifth', () => {
  const parts = require('../papers/higher-2024').questions.flatMap(q => q.subquestions);
  const q = parts.find(p => p.id === 'q6a');
  for (const [answer, marks] of [['2 beats in the bar', 0], ['compound time and 2 beats in the bar', 1], ['6/8', 1], ['4 beats in the bar', 0]]) {
    assert.equal(marking.markSubquestion(q, { final: answer }).marks, marks, answer);
  }
  for (const answer of ['augmented fifth', 'diminished 5th']) assert.equal(marking.markSubquestion(parts.find(p => p.id === 'q4a'), answer).marks, 1, answer);
});

test('Higher 2025 accepts any fourth and any named saxophone type', () => {
  const parts = require('../papers/higher-2025').questions.flatMap(q => q.subquestions);
  for (const answer of ['augmented fourth', 'diminished 4th']) assert.equal(marking.markSubquestion(parts.find(p => p.id === 'q4f'), answer).marks, 1, answer);
  assert.equal(marking.markSubquestion(parts.find(p => p.id === 'q2d'), 'bass saxophone').marks, 1);
});

const ahPart = (year, id) => require(`../papers/advanced-higher-${year}`).questions.flatMap(q => q.subquestions).find(p => p.id === id);
test('AH 2022 requires different instruments and accepts brass as the official alternative', () => {
  for (const [answer, marks] of [['trumpet, allegro', 0], ['brass, allegro', 1], ['trumpet, trombone, allegro', 1], ['trumpet, trumpet, allegro', 0]]) assert.equal(marking.markSubquestion(ahPart(2022, 'q6a1'), { final: answer }).marks, marks, answer);
  for (const [answer, marks] of [['piano, distortion', 0], ['piano, piano, distortion', 0], ['bass guitar, piano, distortion', 1]]) assert.equal(marking.markSubquestion(ahPart(2022, 'q6a2'), { final: answer }).marks, marks, answer);
});
test('AH 2023 and 2025 any-two wind instruments form one concept', () => {
  for (const year of [2023, 2025]) {
    for (const [answer, marks] of [['bassoon, clarinet', 0], ['bassoon, clarinet, homophonic', 1], ['bassoons, clarinets, homophonic', 0]]) assert.equal(marking.markSubquestion(ahPart(year, 'q6a1'), { final: answer }).marks, marks, `${year}: ${answer}`);
  }
  assert.equal(marking.markSubquestion(ahPart(2025, 'q6a2'), { final: 'bassoons, clarinets' }).marks, 0);
  assert.equal(marking.markSubquestion(ahPart(2025, 'q6a2'), { final: 'bassoons, clarinets, staccato' }).marks, 1);
});
test('AH 2023 alternatives do not create extra concepts within their official group', () => {
  for (const answer of ['guiro, piano', 'accelerando, moderato', 'oboe, clarinet']) assert.equal(marking.markSubquestion(ahPart(2023, 'q6a2'), { final: answer }).marks, 0, answer);
});
test('AH source exclusions, alternatives and accent symbol remain authoritative', () => {
  assert.equal(marking.markSubquestion(ahPart(2018, 'q6a1'), { final: 'chromatic scale, arpeggio' }).marks, 0);
  assert.equal(marking.markSubquestion(ahPart(2018, 'q6a1'), { final: 'mezzo soprano, harp' }).marks, 0);
  assert.equal(marking.markSubquestion(ahPart(2017, 'q6a1'), { final: 'modulation, melismatic' }).marks, 1);
  assert.equal(marking.markSubquestion(ahPart(2019, 'q6a2'), { final: '> and Allegro' }).marks, 1);
  assert.equal(marking.markSubquestion(ahPart(2024, 'q6a2'), { final: 'change of key, sequence' }).marks, 1);
});
test('AH comparison alternatives share their printed marking point and preserve scope', () => {
  for (const [year, answer] of [[2019, 'Only Excerpt 1 has modal plainchant.'], [2022, 'Only Excerpt 1 has fugue, fugal and polyphonic texture.'], [2023, 'Only Excerpt 1 has appoggiaturas, trills and turns.'], [2024, 'Only Excerpt 2 has dissonance and discord.'], [2026, 'Only Excerpt 2 has cymbals, harp and xylophone.']]) {
    assert.equal(marking.markSubquestion(ahPart(year, 'q6bi'), { final: answer }).marks, 1, `${year}: ${answer}`);
  }
  assert.equal(marking.markSubquestion(ahPart(2024, 'q6bi'), { final: 'Only Excerpt 1 has concertino.' }).marks, 0);
  assert.equal(marking.markSubquestion(ahPart(2024, 'q6bi'), { final: 'Only Excerpt 1 has concertino and ripieno.' }).marks, 1);
  assert.equal(marking.markSubquestion(ahPart(2022, 'q6bi'), { final: 'Excerpt 1 is homophonic.' }).marks, 0);
  assert.equal(marking.markSubquestion(ahPart(2022, 'q6bi'), { final: 'Excerpt 1 is homophonic. Excerpt 2 is homophonic.' }).marks, 1);
});
