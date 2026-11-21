const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const paper = require('../papers/advanced-higher-2017.js');
const notationData = require('../papers/advanced-higher-2017-notation.js');
const notation = require('../exam-notation.js');
const marking = require('../exam-marking.js');
const registry = require('../paper-registry.js');
const { answerComplete, createAttempt } = require('../exam-engine.js');
const styles = fs.readFileSync(path.resolve(__dirname, '../styles.css'), 'utf8');
const examNotationSource = fs.readFileSync(path.resolve(__dirname, '../exam-notation.js'), 'utf8');
const examUiSource = fs.readFileSync(path.resolve(__dirname, '../exam-ui.js'), 'utf8');

const parts = new Map(paper.questions.flatMap(question => question.subquestions).map(part => [part.id, part]));
const mark = (id, value) => marking.markSubquestion(parts.get(id), value).marks;

assert.equal(registry[paper.id].levelCode, 'AH');
assert.equal(paper.estimatedMinutes, 75);
assert.deepEqual(paper.questions.find(question => question.id === 'q3').introPartLabels, { 1: '(a)' }, 'Question 3 retains the printed part (a) beside its guide instruction');
assert.deepEqual(paper.questions.map(question => question.marks), [7, 7, 6, 5, 5, 10]);
assert.equal([...parts.values()].reduce((sum, part) => sum + part.marks, 0), 40);
assert.equal(fs.existsSync(path.resolve(__dirname, '..', paper.sourcePath)), true);
assert.equal(fs.existsSync(path.resolve(__dirname, '..', paper.markingInstructionsPath)), true);
assert.match(styles, /\.paper-level-ah\.question-q6 \.subquestion-structured-review \{ margin-left: 25px; margin-right: 25px; \}/,
  'Advanced Higher Question 6 review sheets should remain centred at their source width.');
assert.match(styles, /\[data-subquestion="q6bi"\] \.subquestion-source-intro \.question-intro-compact-lines \{ margin: 28px 0 28px 94px; \}/,
  'Question 6 replay cues should align with the surrounding indented instructions.');
assert.deepEqual(
  notationData.q5.bassLine.melody.map(item => item.notes.map(({ pitch, rhythm, courtesyAccidental }) => ({ pitch, rhythm, courtesyAccidental: courtesyAccidental || "" }))),
  [
    [
      { pitch: "C#5", rhythm: "minim", courtesyAccidental: "" },
      { pitch: "B4", rhythm: "quaver", courtesyAccidental: "" },
      { pitch: "A4", rhythm: "quaver", courtesyAccidental: "" },
    ],
    [{ pitch: "G4", rhythm: "dottedMinim", courtesyAccidental: "" }],
    [
      { pitch: "G4", rhythm: "crotchet", courtesyAccidental: "" },
      { pitch: "A4", rhythm: "crotchet", courtesyAccidental: "" },
      { pitch: "E4", rhythm: "crotchet", courtesyAccidental: "" },
    ],
    [{ pitch: "F#4", rhythm: "dottedMinim", courtesyAccidental: "" }],
  ],
  'Question 5(e) guide melody must retain the user-confirmed C-B-A | G | G-A-E | F pitch and rhythm inventory.',
);
assert.match(styles, /\.paper-level-ah\.question-layout-ah2017-literacy\.question-q4 \[data-subquestion="q4e"\] > \.subquestion-before-answer-lines > :is\(span:nth-child\(2\), span:nth-child\(3\)\)\s*\{[^}]*margin-top:\s*14px;/s, 'Question 4(e) must keep a separate gap after each of its first two instruction lines without changing other Advanced Higher papers.');
assert.match(styles, /\.paper-level-ah\.question-layout-ah2017-literacy\.question-q5 \.question-intro > p\s*\{[^}]*margin-bottom:\s*10px;/s, 'Question 5 opening instructions must use the compact Question 4 spacing.');
assert.match(styles, /\.paper-level-ah\.question-layout-ah2017-literacy\.question-q5 \[data-subquestion="q5a"\] \.subquestion-heading-question\s*\{[^}]*grid-column:\s*2;[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto;/s, 'Question 5(a) must keep its prompt and Clear control in the middle column so the mark remains at the far right of the question row.');
assert.match(styles, /\.paper-level-ah\.question-layout-ah2017-literacy\.question-q5 \[data-subquestion="q5d"\] > \.subquestion-after-answer-lines > span:nth-child\(n\+2\):nth-child\(-n\+5\)\s*\{[^}]*margin-top:\s*14px;/s, 'Question 5(d) replay instructions must be spaced as paragraphs while the two final playback lines remain grouped.');
assert.match(styles, /\.paper-level-ah\.question-layout-ah2017-literacy\.question-q5 \[data-subquestion="q5e"\] > \.subquestion-before-answer-lines > span \+ span\s*\{[^}]*margin-top:\s*14px;/s, 'Question 5(e) must separate its three pre-score statements with source-style paragraph gaps.');
assert.match(styles, /\.paper-level-ah\.question-layout-ah2017-literacy\.question-q4 \[data-subquestion="q4d"\] \[data-ah2017-q4e-clear\]\s*\{[^}]*margin-left:\s*8px;/s, 'Question 4(e) Clear must sit immediately beside the Question 4(d) L control.');
assert.match(styles, /\.exam-mode-menu-options\s*\{[^}]*margin:\s*0;/s, 'The shared Mode menu must not leave a gap between Exam Mode and Restart.');
assert.match(examNotationSource, /q3Text\(svg, q3Glyph\("brace"\), \{ x: 27, y: bassTop \+ 39, "font-size": bassTop - grandTop \+ 44 \}/, 'Question 4 grand-staff brace must be shortened by 5px at both ends.');
assert.match(examNotationSource, /ah2016Box\(svg, 52, 1005, 320, 58, "\(c\) Italian term:", \{ regular: true \}\);[\s\S]*ah2016Text\(svg, "q4c", \{ x: 188, y: 1024,[\s\S]*ah2016Box\(svg, 610, 1005, 260, 58, "\(b\) Chord:"\);[\s\S]*ah2016Text\(svg, "q4b", \{ x: 710, y: 1024,/, 'Question 4 Italian-term and chord answer boxes must share the user-confirmed raised row below the bass staff in bars 16 and 18.');

const answers = {
  q1a: 'Arco\nString quartet\nTremolando\nTrill', q1b: 'Piano trio', q1c: 'Harmonics', q1d: 'EDM',
  q2a: 'Basso continuo\nConcerto grosso\nConcertino\nHemiola', q2b: '2', q2c: 'Appoggiatura', q2d: '3',
  q3a1: 'Major', q3a2: 'Suspension', q3a3: 'Syllabic', q3a4: 'Ballett', q3b: 'Ayre', q3c: 'Tritone',
  q4a: 'Chromatic', q4b: 'C added 6th', q4c: 'Staccato', q4d: 'bar-8', q4e: 'A4,G4,G4,A4,G4',
  q5a: 'D major', q5b: 'Gb4', q5c: 'E4,C#4,D4', q5d: 'bars-5-6', q5e: 'E3,B2,C3',
  q6a1: { final: 'Appoggiatura\nSequence\nBasso continuo\nPolyphonic' },
  q6a2: { final: 'Octave\nScat singing\nFugue\nWalking bass' },
  q6bi: { final: 'Both excerpts use a minor key. Both excerpts use modulation. Both excerpts use a perfect cadence. Both excerpts use suspension. Excerpt 1 features strings while Excerpt 2 features a-cappella vocal texture. Excerpt 1 uses melismatic word setting while Excerpt 2 uses syllabic word setting.' },
  q6bii: { final: 'Excerpt 1 is Baroque because it uses basso continuo. Excerpt 2 is modern because it uses scat singing.' },
};
for (const [id, value] of Object.entries(answers)) assert.equal(mark(id, value), parts.get(id).marks, id);
assert.equal(marking.markPaper(paper, answers).score, 40);

// Official-answer edge cases and explicit rejections.
assert.equal(mark('q1d', 'Electronic dance music'), 1);
assert.equal(mark('q1d', 'Electric dance music'), 0);
assert.equal(mark('q2a', answers.q2a + '\nTrill'), 3);
assert.equal(mark('q3a2', 'Perfect cadence'), 1);
assert.equal(mark('q3a4', 'Madrigal'), 1);
assert.equal(mark('q3b', 'Lute song'), 1);
assert.equal(mark('q4b', 'Cm6'), 0);
assert.equal(mark('q4b', 'CM6'), 1);
assert.equal(mark('q6bii', { final: 'Excerpt 2 is modern because it uses close miking of the individual performers.' }), 1, 'The extended official guidance accepts the modern recording technique as justification.');
for (const answer of ['C△6', 'CΔ6', 'C∆6', 'C △ 6']) {
  assert.equal(mark('q4b', answer), 1, 'The source explicitly accepts a triangle-major chord symbol.');
}
assert.equal(mark('q5a', 'D minor'), 0);
assert.equal(mark('q5b', 'F#4'), 0);
assert.equal(mark('q5c', 'E5,C5,D5'), 0);
assert.equal(mark('q5d', 'bars-4-5'), 0);
assert.equal(mark('q5e', 'E2,B3,C4'), 1);
assert.equal(mark('q6a1', { final: 'Appoggiatura\nSequence\nBasso continuo\nCanon' }), 1);
assert.equal(mark('q6a2', { final: 'Octave\nScat singing\nFugue\nDrums' }), 1);
assert.equal(mark('q6bi', { final: 'Minor\nModulation\nPerfect cadence\nSuspension\nBasso continuo\nA-cappella' }), 2, 'A list is capped at two marks');
assert.equal(mark('q6bii', { final: 'Excerpt 1 is Baroque. Excerpt 2 is modern.' }), 1);
assert.equal(mark('q6bii', { final: 'Excerpt 1 is Baroque because of basso continuo. Excerpt 2 is neo-classical because of scat singing.' }), 1);
assert.equal(mark('q6bii', { final: 'Excerpt 1 is Classical because of basso continuo. Excerpt 2 is Jazz because of scat singing.' }), 1);

assert.equal(answerComplete(parts.get('q4e'), 'A4,G4,G4,A4,_'), false);
assert.equal(answerComplete(parts.get('q4e'), answers.q4e), true);
assert.equal(answerComplete(parts.get('q5c'), 'E5,C5,_'), false);
assert.equal(answerComplete(parts.get('q5c'), answers.q5c), true);
assert.equal(createAttempt(paper, 'exam', true).timer.remainingSeconds, 4500);

// The digital flow follows the printed score order and does not duplicate the
// shared Question 6 rough-work/final-answer structures.
const q4 = paper.questions.find(question => question.id === 'q4');
const q5Question = paper.questions.find(question => question.id === 'q5');
assert.equal(q4.score, undefined);
assert.equal(parts.get('q4d').inlineScore.sharedNotation, 'ah-2017-q4d');
assert.equal(notationData.q4.leftHandReference.notes[2].chordAccidentalXOffset, -4, 'Question 4(d) D-sharp accidental must sit 4px farther left than the shared chord position.');
assert.equal(parts.get('q4e').inlineScore.sharedNotation, 'ah-2017-q4');
assert.equal(q5Question.score.sharedNotation, 'ah-2017-q5e');
assert.equal(q5Question.scorePosition, 'after');
assert.equal(parts.get('q5d').inlineScore.sharedNotation, 'ah-2017-q5d');
assert.equal(parts.get('q5e').inlineScore.sharedNotation, 'ah-2017-q5main');
assert.deepEqual(parts.get('q1a').boldPhrases, ['four', 'twice']);
assert.deepEqual(parts.get('q1b').boldPhrases, ['group']);
assert.deepEqual(parts.get('q1c').boldPhrases, ['twice']);
assert.deepEqual(parts.get('q2a').boldPhrases, ['four', 'twice']);
assert.deepEqual(parts.get('q2b').boldPhrases, ['one', 'three']);
assert.deepEqual(parts.get('q2d').boldPhrases, ['one', 'twice']);
assert.deepEqual(paper.questions.find(question => question.id === 'q3').introBoldPhrases, ['three']);
assert.deepEqual(q4.introBoldPhrases, ['2 minutes']);
assert.deepEqual(parts.get('q4d').boldPhrases, ['L']);
assert.deepEqual(parts.get('q4e').boldPhrases, ['three', 'You should write all your answers on the guide to the music below.']);
assert.deepEqual(q5Question.introBoldPhrases, ['1 minute']);
assert.deepEqual(parts.get('q5c').boldPhrases, ['same']);
assert.deepEqual(parts.get('q5d').promptBoldPhrases, ['bars']);
assert.deepEqual(parts.get('q5d').afterAnswerBoldPhrases, ['two', 'You should write all your answers on the guide to the music below.']);
assert.deepEqual(parts.get('q5d').options, [{ value: 'Bracket', label: 'Bracket', symbol: 'bracket' }], 'Question 5(d) must use the printed bracket sign while retaining an accessible text label.');
assert.match(examNotationSource, /item\.symbol === "bracket"[\s\S]*source-bracket-symbol notation-bracket-option-glyph[\s\S]*visually-hidden/, 'The bracket placement control must render the source symbol instead of visible label text.');
const q6Question = paper.questions.find(question => question.id === 'q6');
assert.deepEqual(q6Question.introPartLabels, { 1: '(a)' });
assert.deepEqual(q6Question.introBulletRange, [2, 3]);
assert.deepEqual(q6Question.introCompactRanges, [[7, 8], [9, 10]]);
assert.deepEqual(q6Question.introBoldPhrases, ['two prominent', 'Melody/harmony', 'Texture/structure/form/timbre', 'twice', 'four']);
assert.ok(q6Question.intro.includes('You may use the table below for rough working, but your final answer must be written in the final answer section.'));
assert.deepEqual(parts.get('q6bi').boldPhrases, ['six similarities/differences']);
assert.deepEqual(parts.get('q6bii').boldPhrases, ['style/period', 'justify']);
assert.match(examUiSource, /promptBoldPhrases = subquestion\.promptBoldPhrases \?\? subquestion\.boldPhrases/, 'Source-specific prompt emphasis must not leak into adjacent playback instructions.');
assert.match(examUiSource, /afterAnswerBoldPhrases \?\? subquestion\.boldPhrases/, 'Source-specific playback emphasis must remain independently configurable.');
assert.deepEqual(parts.get('q6a1').roughWorkColumns, ['Excerpt 1', 'Excerpt 2']);
assert.equal(parts.get('q6a1').roughWorkSheet, true);
assert.equal(parts.get('q6a1').roughWorkHeading, 'Rough Work');
assert.equal(parts.get('q6a1').roughWorkIntro, 'For each excerpt identify at least two prominent concepts in each of the following categories:');
assert.deepEqual(parts.get('q6a1').roughWorkBullets, ['Melody/harmony', 'Texture/structure/form/timbre']);
assert.equal(parts.get('q6a1').finalAnswerHeading, 'FINAL ANSWER');
assert.equal(parts.get('q6a1').finalAnswerLines, 9);
assert.equal(parts.get('q6a2').finalAnswerLines, 9);
assert.equal(parts.get('q6a2').hideRoughWork, true);
assert.equal(parts.get('q6bi').roughWorkHeading, 'ROUGH WORK');
assert.equal(parts.get('q6bi').roughWorkLines, 18);
assert.equal(parts.get('q6bi').finalAnswerHeading, 'FINAL ANSWER');
assert.equal(parts.get('q6bi').finalAnswerLines, 16);
assert.equal(parts.get('q6bii').finalAnswerLines, 10);
assert.ok(parts.get('q6bi').leadIntro.intro.includes('You should write your final answers in the final answer section.'));
assert.equal(parts.get('q6bii').hideRoughWork, true);
assert.deepEqual(['q6a1', 'q6a2', 'q6bi', 'q6bii'].map(id => parts.get(id).endOfPaper), [false, false, false, true]);
for (const id of ['q6a1', 'q6a2']) assert.equal(parts.get(id).headings[1].label, 'Texture/structure/form/timbre');

const rows = id => notation.getInventory(id).bars.map(bar => bar.notes.map(item => `${item.rest ? 'rest' : item.pitch}:${item.rhythm}${item.chord?.length ? `[${item.chord.join('+')}]` : ''}${item.chordWithPrevious ? '@chord' : ''}`).join(' '));
assert.deepEqual(rows('ah-2017-q4'), [
  'G4:crotchet C4:crotchet rest:quaverRest C5:crotchet A4:quaver',
  'G4:crotchet C4:crotchet rest:quaverRest G4:crotchet F4:quaver',
  'E4:quaver E4:quaver F4:quaver G4:quaver C4:crotchet D4:crotchet',
  'E4:semibreve',
  'G4:crotchet C4:crotchet rest:quaverRest C5:crotchet A4:quaver',
  'G4:crotchet C4:crotchet rest:quaverRest G4:crotchet F4:quaver',
  'E4:quaver E4:quaver F4:quaver G4:quaver C4:crotchet D4:crotchet',
  'C4:dottedMinim rest:crotchetRest',
  'G#4:crotchet B4:crotchet@chord E4:crotchet rest:quaverRest C5:crotchet B4:quaver',
  'B4:quaver A4:quaver A4:semiquaver B4:dottedQuaver A4:crotchet rest:crotchetRest',
  'F#4:crotchet A4:crotchet@chord D4:crotchet rest:quaverRest B4:crotchet A4:quaver',
  'A4:quaver G4:quaver G4:semiquaver A4:dottedQuaver G4:crotchet rest:crotchetRest',
  'G4:crotchet C4:crotchet rest:quaverRest C5:crotchet A4:quaver',
  'G4:crotchet C4:crotchet rest:quaverRest G4:crotchet F4:quaver',
  'E4:quaver E4:quaver F4:quaver G4:quaver C4:crotchet D4:crotchet',
  'rest:quaverRest E4:quaver F4:quaver G4:quaver C4:crotchet D4:crotchet',
  'rest:quaverRest E4:quaver F4:quaver G4:quaver C5:crotchet D5:crotchet',
  'E4:dottedMinim[E4+G4+A4+C5] E5:quaver[E5+G5+A5+C6] rest:quaverRest',
]);
assert.deepEqual(rows('ah-2017-q5'), [
  'A4:dottedMinim', 'A4:dottedMinim', 'G4:semiquaver A4:semiquaver B4:quaver B4:minim',
  'B4:dottedMinim', 'G4:semiquaver A4:semiquaver B4:quaver B4:minim', 'B4:minim A4:quaver G4:quaver',
  'A4:dottedMinim', 'A4:minim G4:quaver F#4:quaver', 'F#4:dottedMinim',
  'E4:minim E4:quaver D4:quaver', 'E4:dottedMinim', 'D4:dottedMinim',
  'D4:dottedMinim', 'D4:crotchet E4:crotchet C#4:crotchet', 'D4:dottedMinim',
]);
const q4Notation = notation.getInventory('ah-2017-q4');
const q5 = notation.getInventory('ah-2017-q5');
assert.equal(q4Notation.layout.bassTop - q4Notation.layout.grandTop, 100, 'Question 4 final grand staff must retain the user-confirmed large gap between treble and bass staves.');
assert.ok(q4Notation.layout.height >= q4Notation.layout.bassTop + 110, 'Question 4 viewBox must contain the lowest bass-clef quavers without clipping.');
assert.ok(q4Notation.layout.height >= 1093, 'Question 4 viewBox must contain the answer boxes below the bass staff with a bottom margin.');
assert.deepEqual([q4Notation.missingBar, q4Notation.missingIndices, q4Notation.missingAnswer, q4Notation.leftHandAnswerBar, q4Notation.finalBarline], [12, [0,1,2,3,4], ['A4','G4','G4','A4','G4'], 8, 'double']);
assert.deepEqual(q4Notation.bars[3].lowerVoice.map(item => [item.pitch, item.rhythm, item.courtesyAccidental || '', item.stemDown]), [
  ['D4','crotchet','',true], ['C#4','crotchet','',true], ['C4','crotchet','natural',true], ['B3','crotchet','',true],
]);
assert.equal(q4Notation.bars[8].notes[1].stemDown, false, 'Question 4 bar 9 stacked B crotchet must keep its user-confirmed upward stem.');
assert.deepEqual(q4Notation.bars.slice(15, 17).map(bar => bar.beamGroups), [
  [{ start: 2, end: 3 }], [{ start: 2, end: 3 }],
], 'Bars 16 and 17 must keep their first sounded quaver standalone and beam only the following pair.');
assert.deepEqual(
  [q4Notation.bars[17].notes[0].chordOffsets, q4Notation.bars[17].notes[0].chordDotOffsets, q4Notation.bars[17].notes[0].chordDots, q4Notation.bars[17].notes[0].dotXOffset, q4Notation.bars[17].notes[0].chordStemExtension],
  [[0, 0, 12, 0], [0, 0, 7, 0], true, 10, 36],
  'Bar 18 dotted-minim chord must offset the adjacent A notehead and draw one dot for every chord tone.',
);
assert.deepEqual(
  [q4Notation.bars[17].notes[1].chordOffsets, q4Notation.bars[17].notes[1].chordStemToHighest, q4Notation.bars[17].notes[1].stemDown, q4Notation.bars[17].notes[1].xOffset],
  [[0, -12, 0, 0], true, true, 29],
  'Bar 18 quaver chord must offset the adjacent G notehead left and retain one downward stem and tail.',
);
assert.deepEqual(q4Notation.bars.slice(15).map(bar => (bar.bass || []).map(item => [item.pitch || 'rest', item.rhythm])), [
  [['E3','crotchet'],['A2','crotchet'],['D3','crotchet'],['G2','crotchet']],
  [['C3','crotchet'],['A2','crotchet'],['D3','crotchet'],['G2','crotchet']],
  [['C3','quaver'],['A2','quaver'],['G2','quaver'],['E2','quaver'],['C2','crotchet'],['C2','quaver'],['rest','quaverRest']],
]);
assert.deepEqual(q4Notation.leftHandReference.notes.map(item => [item.pitch || 'rest', item.rhythm, item.chord || null, item.stemDown ?? null]), [
  ['C3', 'crotchet', null, false], ['Bb2', 'crotchet', ['Bb2', 'D3'], false], ['B2', 'dottedQuaver', ['B2', 'D#3'], false], ['C3', 'semiquaver', ['C3', 'E3'], false], ['rest', 'crotchetRest', null, null],
]);
assert.deepEqual(q4Notation.leftHandReference.beamGroups, [{ start: 2, end: 3 }]);
assert.equal(q4Notation.leftHandReference.notes.reduce((sum, item) => sum + item.beats, 0), 4);
assert.deepEqual([q5.enharmonic, q5.transpose, q5.bassGuitarBars, q5.finalBarline], [
  { bar: 8, note: 2, answer: 'Gb4' },
  { bars: [14,15], answer: ['E4','C#4','D4'], rhythms: ['crotchet','crotchet','dottedMinim'] },
  [5,6], 'single',
]);
assert.deepEqual(q5.bars.map(item => item.notes.map(note => [note.pitch, note.rhythm])), [
  [['A4','dottedMinim']],
  [['A4','dottedMinim']],
  [['G4','semiquaver'],['A4','semiquaver'],['B4','quaver'],['B4','minim']],
  [['B4','dottedMinim']],
  [['G4','semiquaver'],['A4','semiquaver'],['B4','quaver'],['B4','minim']],
  [['B4','minim'],['A4','quaver'],['G4','quaver']],
  [['A4','dottedMinim']],
  [['A4','minim'],['G4','quaver'],['F#4','quaver']],
  [['F#4','dottedMinim']],
  [['E4','minim'],['E4','quaver'],['D4','quaver']],
  [['E4','dottedMinim']],
  [['D4','dottedMinim']],
  [['D4','dottedMinim']],
  [['D4','crotchet'],['E4','crotchet'],['C#4','crotchet']],
  [['D4','dottedMinim']],
], 'Question 5 guide must retain the user-confirmed four-system pitch and rhythm inventory.');
assert.deepEqual(q5.bars.map(item => ({ ties: item.ties || [], tiesToNext: item.tiesToNext || [], slurs: item.slurs || [] })), [
  { ties: [], tiesToNext: [], slurs: [] },
  { ties: [], tiesToNext: [], slurs: [] },
  { ties: [[2,3]], tiesToNext: [3], slurs: [] },
  { ties: [], tiesToNext: [], slurs: [] },
  { ties: [[2,3]], tiesToNext: [3], slurs: [] },
  { ties: [], tiesToNext: [], slurs: [] },
  { ties: [], tiesToNext: [0], slurs: [] },
  { ties: [], tiesToNext: [], slurs: [] },
  { ties: [], tiesToNext: [], slurs: [] },
  { ties: [[0,1]], tiesToNext: [], slurs: [] },
  { ties: [], tiesToNext: [], slurs: [] },
  { ties: [], tiesToNext: [], slurs: [] },
  { ties: [], tiesToNext: [0], slurs: [] },
  { ties: [], tiesToNext: [], slurs: [] },
  { ties: [], tiesToNext: [], slurs: [] },
], 'Question 5 guide must retain the printed internal ties, cross-bar ties and bar-10 slur.');
assert.deepEqual(q5.bassGuitarReference.map(bar => bar.notes.map(item => [item.pitch, item.rhythm])), [[['A3', 'dottedMinim']], [['A2', 'dottedMinim']]], 'Question 5(d) reference must show the user-confirmed A-to-A octave.');
for (const bar of q4Notation.bars) {
  const upper = bar.notes.reduce((sum, item) => sum + (item.chordWithPrevious ? 0 : item.beats), 0);
  assert.equal(upper, 4, 'Every 2017 Question 4 upper-voice bar totals four beats');
  if (bar.lowerVoice) assert.equal(bar.lowerVoice.reduce((sum, item) => sum + item.beats, 0), 4);
  if (bar.bass) assert.equal(bar.bass.reduce((sum, item) => sum + item.beats, 0), 4);
}
q5.bars.forEach((bar, index) => assert.equal(bar.notes.reduce((sum, item) => sum + item.beats, 0), 3, `Question 5 bar ${index + 1} totals three beats.`));

const hashes = {
  'ah-2017-q2b': 'd3bedb0918ec5d2ed09afa9bc0572efdd42c9eb6a94727394ff24653c69ac5f1',
  'ah-2017-q4': 'c1ed51df73c7bf0357e857d0adff94258c3ff79d75548bd0e9ee2e4a5b163ef7',
  'ah-2017-q5': '6db4017086aafef48545beaa73a6dd50400186b2a8e8c88e3fa2c4c8de0c6b28',
};
for (const [id, expected] of Object.entries(hashes)) assert.equal(crypto.createHash('sha256').update(JSON.stringify(notation.getInventory(id))).digest('hex'), expected, `${id} audited inventory`);

const expectedMarkers = [
  [7.56,206.62,262.55,364.6], [6.78,208.87,302.62,340.53], [6.32,308.13,365.46],
  [6.78,198.86,259.12,319.58], [9.18,152.1,211.04,372.22],
  [8.72,66.68,185,290.38,409.56,760.46,836.6,956.15,1061.26,1180.44],
];
const durations = [416.29,464.64,453.72,420.44,526.39,1895.55];
assert.equal(expectedMarkers.flat().length, 29);
paper.questions.forEach((question, index) => {
  const clip = question.audio.clips[0];
  assert.equal(fs.existsSync(path.resolve(__dirname, '..', clip.file)), true);
  assert.deepEqual(clip.markers.map(marker => marker.time), expectedMarkers[index]);
  assert.deepEqual(clip.markers.map(marker => marker.time), [...clip.markers].map(marker => marker.time).sort((a,b) => a-b));
  assert.ok(clip.markers.every(marker => marker.time >= 0 && marker.time < durations[index]));
});

class SvgNode {
  constructor(name) { this.name = name; this.attributes = {}; this.children = []; this.style = {}; this.dataset = {}; this.events = {}; this.textContent = ''; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] || ''; }
  append(...nodes) { this.children.push(...nodes); }
  addEventListener(name, callback) { (this.events[name] ||= []).push(callback); }
  closest() { return null; }
  contains() { return false; }
  remove() {}
  get lastChild() { return this.children.at(-1); }
}
const descendants = node => [node, ...node.children.flatMap(descendants)];
const oldDocument = global.document;
const oldSymbols = global.BRAVURA_SYMBOLS;
const oldSharedNotationConfig = global.SHARED_NOTATION_CONFIG;
global.document = { createElementNS: (_, name) => new SvgNode(name), createElement: name => new SvgNode(name), activeElement: null };
global.BRAVURA_SYMBOLS = new Proxy({}, { get: (_, key) => String(key) });
global.SHARED_NOTATION_CONFIG = {
  symbols: {
    timeSig34: { fontSizeScale: 3.5, xOffsetScale: -2.7, yOffsetScale: 0.15, widthScale: 1, heightScale: 1, opticalXOffset: 0, opticalYOffset: 0 },
  },
  drawing: {},
};
for (const key of ['q2b','q4d','q4','q5d','q5main','q5e']) for (const interactive of [false,true]) {
  const wrap = new SvgNode('div');
  notation.renderSharedScore({ innerHTML: '', querySelector: () => wrap }, { score: { sharedNotation: `ah-2017-${key}`, optionIndex: 1 } }, answers, interactive ? () => {} : null, Object.fromEntries([...parts.keys()].map(id => [id, 'incorrect'])));
  const nodes = descendants(wrap);
  assert.ok(nodes.some(node => node.name === 'svg'));
  assert.ok(!nodes.some(node => Object.values(node.attributes).some(value => /NaN|undefined|Infinity/.test(value))), `${key} must render finite coordinates`);
  if (key === 'q2b' && !interactive) {
    const scoreSvg = nodes.find(node => node.name === 'svg');
    const sharpNodes = nodes.filter(node => String(node.attributes.class || '').includes('q3-key-signature'));
    const sharps = sharpNodes.map(node => Number(node.attributes.x));
    const timeSignatureNodes = nodes.filter(node => node.name === 'text' && node.attributes.class === 'q3-music-glyph' && Number(node.attributes.x) > sharps.at(-1) && Number(node.attributes.x) < 190);
    const timeDigits = timeSignatureNodes.map(node => Number(node.attributes.x));
    const firstNote = nodes.find(node => String(node.attributes.class || '').includes('q3-notehead'));
    assert.deepEqual(sharps, [117, 131, 145], 'Question 2(b) must retain the source-audited A-major key-signature positions.');
    assert.deepEqual(sharpNodes.map(node => Number(node.attributes.y)), [54, 70.5, 48.5], 'Question 2(b) must keep the user-confirmed 10px downward key-signature adjustment.');
    assert.equal(scoreSvg.attributes.viewBox, '25 0 880 145', 'Question 2(b) must fit the complete four-bar score and its right-hand ending inside the non-scrolling answer width.');
    assert.deepEqual(timeDigits, [175.3, 175.3], 'Question 2(b) must place 3/4 immediately after the A-major key signature.');
    assert.deepEqual(timeSignatureNodes.map(node => Number(node.attributes.y)), [66.11, 88.055], 'Question 2(b) must retain the original time-signature height.');
    assert.ok(timeDigits[0] > sharps.at(-1) && timeDigits[0] < Number(firstNote.attributes.x), 'Question 2(b) must keep the time signature between the final sharp and first note.');
  }
  if (key === 'q4d' && !interactive) {
    const glyphNames = nodes.filter(node => String(node.attributes.class || '').includes('q3-music-glyph')).map(node => node.textContent);
    assert.ok(!glyphNames.some(name => /Down/.test(name)), 'Question 4(d) reference phrase must keep every note stem pointing up.');
    assert.ok(nodes.some(node => node.name === 'polygon' && String(node.attributes.class || '').includes('q3-beam-shape')), 'Question 4(d) dotted quaver and semiquaver must be beamed together.');
  }
  if (key === 'q5d' && !interactive) {
    const barlines = nodes.filter(node => node.name === 'line' && node.attributes.class === 'q3-barline');
    assert.deepEqual(barlines.map(node => Number(node.attributes.x1)), [150, 510], 'Question 5(d) must draw an opening barline after the bass clef and a dividing barline between the A-octave notes.');
  }
  if (key === 'q5main' && !interactive) {
    const keySignatureSharps = nodes.filter(node => String(node.attributes.class || '').includes('q3-key-signature'));
    assert.deepEqual(
      keySignatureSharps.map(node => Number(node.attributes.y)),
      [119, 135.5, 314, 330.5, 509, 525.5, 704, 720.5, 398, 414.5, 846, 862.5],
      'Question 5 treble key signatures must stay 10px down while the bass answer key signature returns 10px upward.',
    );
    assert.deepEqual(
      keySignatureSharps.map(node => Number(node.attributes.x)),
      [102, 116, 102, 116, 102, 116, 102, 116, 738, 752, 420.66666666666663, 434.66666666666663],
      'Every Question 5 main-score key signature must retain the user-confirmed 10px leftward adjustment.',
    );
    const bassOpeningBarline = nodes.find(node => node.name === 'line' && node.attributes.class === 'q3-barline' && Number(node.attributes.y1) === 835 && Number(node.attributes.y2) === 879);
    assert.equal(Number(bassOpeningBarline?.attributes.x1), 368.66666666666663, 'The bass answer stave must open with a barline vertically aligned with bar 14 above.');
    const bassDividingBarline = nodes.find(node => node.name === 'line' && node.attributes.class === 'q3-barline' && Number(node.attributes.x1) === 619.3333333333333 && Number(node.attributes.y1) === 835 && Number(node.attributes.y2) === 879);
    assert.ok(bassDividingBarline, 'The bass answer stave must include the barline aligned between bars 14 and 15 above.');
    const bassClosingBarline = nodes.find(node => node.name === 'line' && node.attributes.class === 'q3-barline' && Number(node.attributes.x1) === 870 && Number(node.attributes.y1) === 835 && Number(node.attributes.y2) === 879);
    assert.ok(bassClosingBarline, 'The bass answer stave must close with a barline aligned with the end of bar 15 above.');
    const enharmonicBox = nodes.find(node => node.name === 'rect' && node.attributes.class === 'q3-marking-box' && Number(node.attributes.y) === 271);
    assert.deepEqual([Number(enharmonicBox?.attributes.width), Number(enharmonicBox?.attributes.height)], [56, 186], 'The bar-8 enharmonic box must surround only the final note and extend beneath the lower treble stave.');
    const enharmonicLabel = nodes.find(node => node.textContent === '(b) Enharmonic');
    assert.equal(Number(enharmonicLabel?.attributes.y), 261, 'The enharmonic label must sit above the bar-8 marking box.');
    const systemEndBarlines = nodes.filter(node => node.name === 'line' && node.attributes.class === 'q3-barline' && Number(node.attributes.x1) === 870 && Number(node.attributes.y1) < 800);
    assert.deepEqual(systemEndBarlines.map(node => Number(node.attributes.y1)), [120, 315, 510, 705], 'Each of the four main-score systems must finish with a closing barline.');
    const transposeBox = nodes.find(node => node.name === 'rect' && node.attributes.class === 'q3-marking-box' && Number(node.attributes.y) === 645);
    assert.equal(Number(transposeBox?.attributes.height), 250, 'The bars 14–15 answer box must retain all three 15px upward extensions without moving its lower edge.');
    const transposeLabel = nodes.find(node => node.textContent === '(c) Notes at same pitch in bass clef');
    assert.equal(Number(transposeLabel?.attributes.y), 665, 'The bars 14–15 answer label must move upward with its box.');
    const widenedFlippedTie = nodes.find(node => node.textContent === 'tie' && /scale\(9\.72 1\) rotate\(180\)/.test(node.attributes.transform || ''));
    assert.ok(widenedFlippedTie, 'The bar-13-to-14 tie must be widened and flipped above the notes.');
  }
  if (key === 'q5e' && !interactive) {
    const scoreSvg = nodes.find(node => node.name === 'svg');
    assert.equal(scoreSvg.attributes.viewBox, '0 0 920 380', 'Question 5(e) must retain enough height for the enlarged grand-staff gap and chord table.');
    const keySignatureSharps = nodes.filter(node => String(node.attributes.class || '').includes('q3-key-signature'));
    assert.deepEqual(keySignatureSharps.map(node => Number(node.attributes.y)), [69, 85.5, 226, 242.5], 'Question 5(e) must keep the treble D-major signature lowered while raising the bass-clef signature by 10px.');
    const fullWidthStaffLines = nodes.filter(node => node.name === 'line' && node.attributes.class === 'q3-staff-line' && Number(node.attributes.x1) === 50 && Number(node.attributes.x2) === 870);
    assert.deepEqual(
      [...new Set(fullWidthStaffLines.map(node => Number(node.attributes.y1)))],
      [70, 81, 92, 103, 114, 215, 226, 237, 248, 259],
      'Question 5(e) must keep a 145px separation between the treble and bass staff tops for the guide-rhythm working area.',
    );
    const chordLabels = nodes.filter(node => String(node.attributes.class || '').includes('ah-2017-q5-chord-label') && ['A','V','Em','II','G 1st Inv.','IVb','A 1st Inv.','Vb','D','I'].includes(node.textContent));
    assert.deepEqual(chordLabels.map(node => Number(node.attributes['font-size'])), [18,18,18,18,15,18,15,18,18,18], 'Question 5(e) chord names and Roman numerals must use the enlarged source-facing text sizes.');
    const narrowedChordDivider = nodes.find(node => node.name === 'line' && node.attributes.class === 'q3-staff-line' && Number(node.attributes.x1) === 600 && Number(node.attributes.x2) === 600 && Number(node.attributes.y1) === 281 && Number(node.attributes.y2) === 347);
    assert.ok(narrowedChordDivider, 'Question 5(e) must narrow the G 1st Inv. column by moving its right divider 10px left.');
    const rhythmGuides = nodes.filter(node => /Note|Stem/.test(node.textContent) && String(node.attributes.class || '').includes('q3-rhythm-guide'));
    assert.equal(rhythmGuides.length, 3, 'Question 5(e) must show dotted-minim, crotchet and minim guide rhythms above the three bass-entry positions.');
    const pitchedGlyphs = nodes.filter(node => node.name === 'text' && /Note|Stem/.test(node.textContent) && !String(node.attributes.class || '').includes('q3-rhythm-guide'));
    const trebleXs = new Set(pitchedGlyphs.filter(node => Number(node.attributes.y) < 170).map(node => Number(node.attributes.x)));
    const bassXs = pitchedGlyphs.filter(node => Number(node.attributes.y) > 170).map(node => Number(node.attributes.x));
    assert.equal(bassXs.length, 5, 'Question 5(e) must render the two given bass notes and three pupil bass notes.');
    const shiftedBassXs = bassXs.filter(x => !trebleXs.has(x));
    assert.equal(shiftedBassXs.length, 1, 'Only the Question 5(e) minim entry may use the user-confirmed optical horizontal shift.');
    assert.ok(trebleXs.has(shiftedBassXs[0] - 10), 'Question 5(e) minim entry must sit 10px right of its original treble-guide beat position.');
    assert.equal(Number(rhythmGuides[2].attributes.x), shiftedBassXs[0], 'Question 5(e) minim rhythm guide and pupil-entry position must remain vertically aligned after both 5px moves.');
  }
  if (key === 'q5e' && interactive) {
    const noteTarget = nodes.find(node => node.attributes.class === 'q3-note-hit-area');
    assert.ok(noteTarget, 'Question 5(e) must expose the shared direct-note placement target.');
    assert.equal(Number(noteTarget.attributes.y), 165.5, 'Question 5(e) note placement must stop at E4, two ledger lines above the bass stave.');
    assert.equal(Number(noteTarget.attributes.height), 132, 'Question 5(e) note placement must stop at C2 below the bass stave and E4 above it.');
  }
  if (key === 'q4' && !interactive) {
    const halfChordHeads = nodes.filter(node => node.textContent === 'noteheadHalf');
    assert.equal(halfChordHeads.length, 3, 'Bar 18 dotted-minim chord must add three head-only pitches to its single stem.');
    assert.ok(halfChordHeads.every(node => String(node.attributes.class || '').includes('q3-notehead')), 'Bar 18 dotted-minim chord additions must not draw duplicate stems or dots.');
    const halfHeadXs = [...new Set(halfChordHeads.map(node => Number(node.attributes.x)))].sort((a,b) => a-b);
    assert.deepEqual(halfHeadXs.map(value => value - halfHeadXs[0]), [0, 12], 'Bar 18 dotted-minim chord must displace its adjacent A notehead 12px to the right.');
    const dotGroups = Object.values(nodes
      .filter(node => node.textContent === 'augmentationDot')
      .reduce((groups, node) => {
        (groups[node.attributes.x] ||= []).push(node);
        return groups;
      }, {}));
    assert.ok(dotGroups.some(group => group.length === 3), 'Bar 18 dotted-minim chord must keep three augmentation dots aligned.');
    const dottedChordDotXs = [...new Set(nodes.filter(node => node.textContent === 'augmentationDot').map(node => Number(node.attributes.x)))].sort((a,b) => a-b);
    assert.ok(dottedChordDotXs.some((value,index) => dottedChordDotXs[index + 1] - value === 7), 'Bar 18 A augmentation dot must sit 7px right of the other chord dots.');
    const upChordStems = nodes.filter(node => String(node.attributes.class || '').includes('q3-chord-stem-up'));
    const downChordStems = nodes.filter(node => String(node.attributes.class || '').includes('q3-chord-stem-down'));
    assert.equal(upChordStems.length, 1, 'Bar 18 dotted-minim chord must use one extended upward stem.');
    assert.ok(Number(upChordStems[0].attributes.y1) - Number(upChordStems[0].attributes.y2) > 55, 'Bar 18 dotted-minim chord stem must extend above its highest notehead.');
    assert.equal(downChordStems.length, 1, 'Bar 18 final quaver chord must extend its single downward stem through the complete chord.');
    const finalChordHeads = nodes.filter(node => node.textContent === 'noteheadBlack' && String(node.attributes.class || '').includes('q3-chord-notehead'));
    assert.equal(finalChordHeads.length, 3, 'Bar 18 octave-up quaver chord must add three head-only pitches to its single stem.');
    const finalChordHeadXs = [...new Set(finalChordHeads.map(node => Number(node.attributes.x)))].sort((a,b) => a-b);
    assert.deepEqual(finalChordHeadXs.map(value => value - finalChordHeadXs.at(-1)), [-12, 0], 'Bar 18 quaver chord must displace its adjacent G notehead 12px to the left.');
    const finalChordX = finalChordHeadXs.at(-1);
    const finalChordQuavers = nodes.filter(node => node.textContent === 'eighthNoteStemDown' && Math.abs(Number(node.attributes.x) - finalChordX) < 4);
    assert.equal(finalChordQuavers.length, 1, 'Bar 18 final quaver chord must contain exactly one complete quaver stem and tail.');
    const finalBassQuaver = nodes.find(node => node.textContent === 'eighthNoteStemUp' && Number(node.attributes.x) > 800 && Number(node.attributes.y) > 930);
    assert.ok(finalBassQuaver, 'Bar 18 final bass quaver must render.');
    const chordAlignmentDelta = Math.abs(Number(finalChordQuavers[0].attributes.x) - Number(finalBassQuaver.attributes.x));
    assert.ok(chordAlignmentDelta < 5, `Bar 18 upper quaver chord must align vertically with the final bass quaver within the test renderer's fallback glyph calibration (delta ${chordAlignmentDelta}).`);
  }
  if (key === 'q4' && interactive) {
    const lTargets = nodes.filter(node => node.name === 'rect' && node.attributes.class === 'q3-bar-label-hit-area');
    assert.equal(lTargets.length, 15, 'Question 4(d) must offer an L placement target above each eligible bar.');
    assert.ok(lTargets.every(node => node.events.pointerenter?.length && node.events.pointerleave?.length && node.events.focus?.length && node.events.blur?.length), 'Every Question 4(d) L target must show and hide its hover/focus preview.');
  }
  if (interactive && ['q4','q5main','q5e'].includes(key)) assert.ok(nodes.some(node => node.attributes.class === 'q3-note-hit-area' && node.events.keydown?.length), `${key} keyboard note entry`);
}
global.document = oldDocument;
global.BRAVURA_SYMBOLS = oldSymbols;
global.SHARED_NOTATION_CONFIG = oldSharedNotationConfig;

assert.match(fs.readFileSync(path.join(__dirname, '../digitalquestionpapers.html'), 'utf8'), /advanced-higher-2017-notation\.js/);
console.log('Advanced Higher 2017 source, marking, audio and notation tests passed.');
