const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const paper = require('../papers/advanced-higher-2019.js');
const notation = require('../exam-notation.js');
const marking = require('../exam-marking.js');
const registry = require('../paper-registry.js');
const { answerComplete, createAttempt } = require('../exam-engine.js');

const parts = new Map(paper.questions.flatMap(question => question.subquestions).map(part => [part.id, part]));
const mark = (id, value) => marking.markSubquestion(parts.get(id), value).marks;
assert.equal(mark('q6a1', { final: 'Monophonic and anacrusis.' }), 1, 'The source accepts monophonic as the unison/octave alternative in Excerpt 1.');
assert.equal(mark('q6a1', { final: 'Monophonic and unison.' }), 0, 'Alternative terms for one concept must not earn two concept credits.');
for (const answer of ['wide range of dynamics', 'wide dynamic range']) {
  assert.equal(mark('q6bii', { final: `Excerpt 2 is modern because it has a ${answer}.` }), 1, 'The source explicitly accepts the wide range of dynamics as justification.');
}
assert.equal(registry[paper.id].levelCode, 'AH');
assert.equal(paper.estimatedMinutes, 75);
assert.deepEqual(paper.questions.map(question => question.marks), [9,4,6,5,6,10]);
assert.equal([...parts.values()].reduce((sum, part) => sum + part.marks, 0), 40);
assert.equal(fs.existsSync(path.resolve(__dirname, '..', paper.sourcePath)), true);
assert.equal(fs.existsSync(path.resolve(__dirname, '..', paper.markingInstructionsPath)), true);
const styles = fs.readFileSync(path.resolve(__dirname, '..', 'styles.css'), 'utf8');
const sourceBoldMap = fs.readFileSync(path.resolve(__dirname, '..', 'source-bold-map.js'), 'utf8');
const examUi = fs.readFileSync(path.resolve(__dirname, '..', 'exam-ui.js'), 'utf8');
assert.equal(paper.questions[0].layout, 'ah2019-q1');
assert.equal(parts.get('q1a').leadLines[0], 'Listen to this excerpt and identify four concepts in the music from those\nlisted below.');
assert.equal(parts.get('q1a').afterAnswerLines[0], 'The music will be played twice with a pause of 10 seconds between\nplayings and a pause of 40 seconds before part (b).');
assert.equal(parts.get('q1c').prompt, 'Listen to a continuation of the previous excerpt and identify the concept\nthat describes the solo instrumental part.');
assert.equal(parts.get('q1d').prompt, 'Listen to a further excerpt from the same work and tick (✓) one box to\nidentify the correct version of the vocal part.');
assert.equal(parts.get('q1e').numberedAnswerLines, 4);
assert.match(styles, /question-layout-ah2019-q1 \[data-subquestion="q1a"\] > \.higher-concept-bank \{[\s\S]*?width: 570px;[\s\S]*?padding: 36px 30px;[\s\S]*?gap: 25px 42px;/,
  'Question 1 concept box should retain the source proportions.');
assert.match(styles, /question-layout-ah2019-q1 :is\(\[data-subquestion="q1b"\], \[data-subquestion="q1c"\]\) > \.short-answer-line \{[\s\S]*?width: calc\(100% - 88px\);[\s\S]*?margin-top: 30px;/,
  'Question 1(b) and (c) should retain the source answer-line width and offset.');
assert.match(styles, /\[data-subquestion="q1d"\] > \.subquestion-before-answer-lines \{[\s\S]*?margin-top: 42px;[\s\S]*?line-height: 24px;/,
  'Question 1(d) playback instructions should retain the source paragraph spacing.');
assert.match(styles, /question-layout-ah2019-q1 \[data-subquestion="q1d"\] \.answer-options \{ max-width: none; \}/,
  'Question 1(d) notation choices should use the full printed answer width.');
assert.match(styles, /question-layout-ah2019-q1 \[data-subquestion="q1e"\] > \.subquestion-before-answer-lines > span:nth-child\(2\) \{\s*margin-top: 12px;/,
  'Question 1(e) should separate the play-count sentence from the three replay cues.');
assert.match(sourceBoldMap, /"advanced-higher-2019": \{[\s\S]*?"q1": \{[\s\S]*?"listen to this excerpt and identify four concepts[\s\S]*?"four"[\s\S]*?"the music will be played twice[\s\S]*?"twice",[\s\S]*?"40 seconds"/,
  'Question 1 should retain the source emphasis rather than inheriting Question 5 emphasis.');
assert.match(sourceBoldMap, /"you now have 15 seconds to read through the list of features\.": \[\s*"15 seconds"\s*\]/,
  'Question 1(a) should bold only “15 seconds”.');
assert.match(sourceBoldMap, /"you now have 30 seconds to read through the possible answers\.": \[\s*"30 seconds"\s*\][\s\S]*?"the excerpt will be played three times\.": \[\s*"three"\s*\]/,
  'Question 1(d) should bold only “30 seconds” and “three”.');
assert.deepEqual(['q2ai','q2aii','q2aiii'].map(id=>parts.get(id).label), ['(i)','(ii)','(iii)'],
  'Question 2(a) should retain the source Roman-numeral labels beneath the shared (a) heading.');
assert.equal(parts.get('q2b').prompt, 'Listen to part of a different musical and identify the concept that\ndescribes the overall tonality.');
assert.deepEqual(parts.get('q2b').beforeAnswerLines, ['You will hear the music twice.','Here is the music for the first time.','Here is the music for the second time.']);
assert.match(styles, /question-q2\.question-layout-ah2019-literacy \[data-subquestion="q2b"\] > \.short-answer-line \{[\s\S]*?width: calc\(100% - 88px\);[\s\S]*?margin: 36px 0 0 44px;/,
  'Question 2(b) should retain its source-width answer line below the replay cues.');
assert.match(sourceBoldMap, /"q2": \{[\s\S]*?"you now have one minute[\s\S]*?"one minute"[\s\S]*?"you will now hear the music two more times[\s\S]*?"two",[\s\S]*?"20 seconds",[\s\S]*?"one minute"/,
  'Question 2 should limit emphasis to the source timing phrases.');
assert.deepEqual(paper.questions[2].guideIntro, {
  label:'(a)',
  prompt:'In this excerpt you are required to complete the guide below by inserting appropriate music concepts.',
  lines:['There will now be a pause of 30 seconds to allow you to read through the question.','The music will be played three times with a pause of 20 seconds between playings and a pause of 30 seconds before part (b).','In the first two playings a voice will help guide you through the music. There is no voice in the third playing.','Here is the music for the first time.','Here is the music for the second time.','Here is the music for the third time.']
}, 'Question 3(a) source instructions should remain outside the bordered four-row guide.');
assert.equal(parts.get('q3a1').groupStart, undefined);
assert.equal(parts.get('q3a1').leadLines, undefined);
assert.equal(parts.get('q3b').prompt, 'Listen to a different excerpt and tick (✓) one box to identify the form.');
assert.match(examUi, /question\.guideIntro[\s\S]*?ah-guide-source-intro[\s\S]*?higher-guide-box/,
  'The shared guide renderer should place source instructions before the bordered guide.');
assert.match(sourceBoldMap, /"q3": \{[\s\S]*?"there will now be a pause[\s\S]*?"30 seconds"[\s\S]*?"the music will be played three times[\s\S]*?"three times",[\s\S]*?"20 seconds",[\s\S]*?"30 seconds"/,
  'Question 3 should bold only the printed timing phrases.');
assert.match(styles, /question-layout-ah-boxed-guide \.ah-guide-source-intro \{[\s\S]*?margin: 0 0 36px 52px;/,
  'Question 3 source instructions should retain their printed inset above the guide.');
assert.match(styles, /\[data-subquestion="q3b"\] \.answer-option input \{[\s\S]*?width: 38px;[\s\S]*?height: 38px;/,
  'Question 3(b) should retain the larger printed choice boxes.');
assert.deepEqual(['q4ai','q4aii','q4bi','q4bii'].map(id=>parts.get(id).label), ['(a) (i)','  (ii)','(i)','(ii)'],
  'Question 4 should retain the printed shared part letters and Roman-numeral labels.');
assert.match(sourceBoldMap, /"q4": \{[\s\S]*?"you now have 20 seconds to read through part \(a\)\.": \[\s*"20 seconds"[\s\S]*?"during the next two playings[\s\S]*?"two"[\s\S]*?"two more times",[\s\S]*?"20 seconds",[\s\S]*?"40 seconds"/,
  'Question 4 should limit emphasis to the printed timing phrases.');
assert.match(styles, /question-q4\.question-layout-ah2019-literacy \[data-subquestion="q4c"\] > \.short-answer-line \{[\s\S]*?height: 86px;[\s\S]*?0 28px[\s\S]*?0 85px/,
  'Question 4(c) should retain the two printed answer lines.');
assert.equal(paper.questions[4].layout, 'ah2019-q5');
assert.equal(parts.get('q5a').leadLines[0], 'Listen to this excerpt and identify four concepts in the music from those\nlisted below.');
assert.match(sourceBoldMap, /"q5": \{[\s\S]*?"listen to this excerpt and identify four concepts[\s\S]*?"four"[\s\S]*?"you now have 15 seconds[\s\S]*?"15 seconds"[\s\S]*?"insert your four answers[\s\S]*?"four"[\s\S]*?"twice",[\s\S]*?"10 seconds",[\s\S]*?"40 seconds"/,
  'Question 5 should limit emphasis to the source concept count and timing phrases.');
assert.match(styles, /question-q5\.question-layout-ah2019-q5 \[data-subquestion="q5a"\] > \.subquestion-after-answer-lines \{[\s\S]*?margin-top: 34px;/,
  'Question 5(a) should retain the printed gap before its replay paragraph.');
assert.equal(paper.questions[5].introPartLabels[1], '(a)');
assert.equal(parts.get('q6a1').roughWorkHeading, 'ROUGH WORK');
assert.equal(parts.get('q6a1').finalAnswerHeading, 'FINAL ANSWER');
assert.equal(parts.get('q6bi').finalAnswerHeading, 'FINAL ANSWER');
assert.equal(parts.get('q6bi').roughWorkLines, 18);
assert.equal(parts.get('q6bi').finalAnswerLines, 16);
assert.equal(parts.get('q6bii').finalAnswerLines, 10);
assert.equal(parts.get('q6bii').endOfPaper, false);
assert.deepEqual(parts.get('q6a1').roughWorkBullets, ['Melody/harmony','Rhythm/texture/structure/form/timbre']);
assert.match(sourceBoldMap, /"q6": \{[\s\S]*?"in this question you are asked[\s\S]*?"two"[\s\S]*?"two prominent"[\s\S]*?"twice",[\s\S]*?"15 seconds",[\s\S]*?"4 minutes"[\s\S]*?"4 minutes",[\s\S]*?"four"[\s\S]*?"30 seconds"/,
  'Question 6 page 15 should preserve the source emphasis on counts and timings only.');
assert.ok(parts.get('q6bi').leadIntro.intro.includes('You should write your final answers in the final answer section.'));
assert.deepEqual(parts.get('q6bi').leadIntro.introCompactRanges, [[9,10],[11,12]]);
assert.match(sourceBoldMap, /"q6": \{[\s\S]*?"in your extended answer[\s\S]*?"six similarities\/differences"[\s\S]*?"you will hear each excerpt two more times[\s\S]*?"two",[\s\S]*?"15 seconds",[\s\S]*?"10 minutes"[\s\S]*?"you now have 10 minutes[\s\S]*?"10 minutes"[\s\S]*?"30 seconds"/,
  'Question 6 page 18 should retain only the source emphasis within the analysis instructions.');
assert.match(sourceBoldMap, /"comment on six similarities\/differences you hear in the excerpts\.": \[\s*"six similarities\/differences"\s*\]/,
  'Question 6 page 20 should bold only the comparison count phrase.');

const answers = {
  q1a:'Antiphonal\nHemiola\nSequence\nTrill',q1b:'Recitative',q1c:'Obbligato',q1d:'3',q1e:'Soprano\nTenor\nAlto\nBass',q1f:'Oratorio',
  q2ai:'crotchetRest|dottedCrotchetRest',q2aii:'C major',q2aiii:'D4',q2b:'Polytonality',
  q3a1:'Pedal',q3a2:'Homophonic',q3a3:'Imperfect cadence',q3a4:'String quartet',q3b:'Fugue',q3c:'Tierce de Picardie',
  q4ai:'A4,G4,F4,D4',q4aii:'Tritone',q4bi:'sharp@1',q4bii:'Ab2',q4c:'Play one octave lower',
  q5a:'Neo-classical\nFrench horn\nTurn\nAlberti bass',q5b:'Irregular time signature',q5c:'Soul music',
  q6a1:{final:'Arpeggio\nSequence\nA cappella\nImitation'},
  q6a2:{final:'Change of key\nDissonance\nPizzicato\nSyncopation'},
  q6bi:{final:'Both excerpts are settings of the Mass. Both excerpts use sequences. Both excerpts use imitation. Both excerpts feature timpani. Excerpt 1 is melismatic whereas Excerpt 2 is syllabic. Excerpt 1 uses only timpani whereas Excerpt 2 has a wide variety of percussion.'},
  q6bii:{final:'Excerpt 1 is Baroque because it uses polyphonic texture. Excerpt 2 is modern because it uses irregular time signatures.'},
};
for (const [id,value] of Object.entries(answers)) assert.equal(mark(id,value),parts.get(id).marks,id);
assert.equal(marking.markPaper(paper,answers).score,40);

assert.equal(mark('q1b','Recit'),1); assert.equal(mark('q1b','Oratorio'),1);
assert.equal(mark('q1c','Obligato'),1); assert.equal(mark('q1d','2'),0); assert.equal(mark('q1e','STAB'),1,'Official page 03 explicitly accepts the STAB abbreviation');
assert.equal(mark('q1e','Soprano\nTenor\nAlto\nBass'),1);
assert.equal(mark('q1e','S\nT\nA\nB'),1);
assert.equal(mark('q1e','Soprano\nT\nAlto\nB'),1);
assert.equal(mark('q1e','Soprano\n\nAlto\nBass'),0);
assert.equal(mark('q1e','Soprano Tenor Alto Bass\n\n\n'),1,'All four voices are in the official required order regardless of line breaks');
assert.equal(mark('q1e','Soprano\nAlto\nTenor\nBass'),0);
assert.equal(mark('q2ai','quaverRest,quaverRest|quaverRest,crotchetRest'),1);
assert.equal(mark('q2ai','dottedCrotchetRest|dottedCrotchetRest'),0);
assert.equal(mark('q2ai','crotchetRest|crotchetRest'),0);
assert.equal(mark('q2aii','C'),1); assert.equal(mark('q2aii','IV'),1); assert.equal(mark('q2aii','Cm'),0);
assert.equal(mark('q2aiii','D3'),0); assert.equal(mark('q2b','Bitonality'),1);
assert.equal(mark('q3a1','Pedal point'),1); assert.equal(mark('q3a1','Inverted pedal'),0);
assert.equal(mark('q4ai','A4,G4,F4,C4'),0); assert.equal(mark('q4aii','Augmented 4th'),1); assert.equal(mark('q4aii','Diminished 5th'),0);
assert.equal(mark('q4bii','A♭2'),1); assert.equal(mark('q4bii','G#2'),0); assert.equal(mark('q4c','The notes sound eight notes lower than printed.'),1);
for(const answer of ['One octave lower','One octave down','An octave below','\nOne octave lower']) assert.equal(mark('q4c',answer),1,answer);
for(const answer of ['Do not play one octave lower','One octave higher','Two octaves lower','One octave lower or higher','No change']) assert.equal(mark('q4c',answer),0,answer);
assert.equal(parts.get('q4c').answerLines,2,'Both printed answer lines must accept input.');
for(const [id,wrong] of [['q4ai','A4,G4,F4'],['q4aii','Tritone or diminished fifth'],['q4bi','sharp@0'],['q4bii','Ab3']]) assert.equal(mark(id,wrong),0,`${id} rejects incomplete or incorrect answers`);
assert.equal(mark('q5b','Time changes'),1); assert.equal(mark('q5b','There are 7 beats in the bar'),1); assert.equal(mark('q5c','Soul'),1);
assert.equal(mark('q6a1',{final:'Chromatic scale\nArpeggio\nHomophonic\nImitation'}),1);
assert.equal(mark('q6a2',{final:'Major\nSequence\nChoir\nBass'}),0);
assert.equal(mark('q6bii',{final:'Excerpt 1 is Baroque. Excerpt 2 is modern.'}),1);
assert.equal(mark('q6bii',{final:'Excerpt 1 is Baroque because of imitation. Excerpt 2 is contemporary jazz because of percussion.'}),1);

assert.equal(answerComplete(parts.get('q2ai'),'crotchetRest|'),false);
assert.equal(answerComplete(parts.get('q2ai'),'quaverRest|quaverRest'),false);
assert.equal(answerComplete(parts.get('q2ai'),'crotchetRest|crotchetRest'),false);
assert.equal(answerComplete(parts.get('q2ai'),'quaverRest,quaverRest|quaverRest,crotchetRest'),true);
assert.equal(answerComplete(parts.get('q2ai'),'crotchetRest|quaverRest,quaverRest,quaverRest'),true);
assert.equal(answerComplete(parts.get('q2ai'),answers.q2ai),true);
assert.equal(answerComplete(parts.get('q4ai'),'A4,G4,F4,_'),false);
assert.equal(createAttempt(paper,'exam',true).timer.remainingSeconds,4500);

assert.match(paper.questions[0].subquestions[0].afterAnswerLines.join(' '),/pause of 40 seconds before part \(b\)/);
assert.equal(paper.questions[1].score,undefined);
assert.equal(parts.get('q2ai').inlineScore.sharedNotation,'ah-2019-q2');
assert.equal(parts.get('q4bi').inlineScore.sharedNotation,'ah-2019-q4b');
assert.equal(parts.get('q4c').inlineScore.sharedNotation,'ah-2019-q4c');
assert.equal(parts.get('q6a1').roughWorkSheet,true);
assert.equal(parts.get('q6a2').hideRoughWork,true);
assert.equal(parts.get('q6bi').endOfPaper,false);
assert.equal(parts.get('q6bii').endOfPaper,false);

const q1d = notation.getInventory('ah-2019-q1d');
const q2 = notation.getInventory('ah-2019-q2');
const q4 = notation.getInventory('ah-2019-q4');
assert.deepEqual([q1d.answerOption,q1d.timeSignature,q1d.key],[2,'3/4','A major']);
assert.equal(q1d.displayTimeSignature,false);
const q1dInventory = item=>item.notes.map(({pitch,rhythm,rest})=>({pitch,rhythm,rest:Boolean(rest)}));
assert.deepEqual(q1dInventory(q1d.pickup),[{pitch:'C4',rhythm:'crotchet',rest:false}]);
assert.deepEqual(q1d.options.map(option=>option.map(q1dInventory)),[
  [
    [{pitch:'D4',rhythm:'crotchet',rest:false},{pitch:'A3',rhythm:'crotchet',rest:false},{pitch:'D4',rhythm:'crotchet',rest:false}],
    [{pitch:'C4',rhythm:'quaver',rest:false},{pitch:'B3',rhythm:'quaver',rest:false},{pitch:'A3',rhythm:'quaver',rest:false},{pitch:'C4',rhythm:'quaver',rest:false},{pitch:'B3',rhythm:'quaver',rest:false},{pitch:'A3',rhythm:'quaver',rest:false}],
    [{pitch:'B3',rhythm:'dottedCrotchet',rest:false},{pitch:'C4',rhythm:'quaver',rest:false},{pitch:'B3',rhythm:'quaver',rest:false},{pitch:'C4',rhythm:'quaver',rest:false}],
    [{pitch:'A3',rhythm:'crotchet',rest:false},{pitch:undefined,rhythm:'crotchetRest',rest:true}],
  ],
  [
    [{pitch:'D4',rhythm:'crotchet',rest:false},{pitch:'D3',rhythm:'crotchet',rest:false},{pitch:'D4',rhythm:'crotchet',rest:false}],
    [{pitch:'C4',rhythm:'quaver',rest:false},{pitch:'B3',rhythm:'quaver',rest:false},{pitch:'A3',rhythm:'quaver',rest:false},{pitch:'C4',rhythm:'quaver',rest:false},{pitch:'D4',rhythm:'quaver',rest:false},{pitch:'E4',rhythm:'quaver',rest:false}],
    [{pitch:'D4',rhythm:'dottedCrotchet',rest:false},{pitch:'C4',rhythm:'quaver',rest:false},{pitch:'D4',rhythm:'quaver',rest:false},{pitch:'E4',rhythm:'quaver',rest:false}],
    [{pitch:'C4',rhythm:'crotchet',rest:false},{pitch:undefined,rhythm:'crotchetRest',rest:true}],
  ],
  [
    [{pitch:'D4',rhythm:'crotchet',rest:false},{pitch:'D3',rhythm:'crotchet',rest:false},{pitch:'D4',rhythm:'crotchet',rest:false}],
    [{pitch:'C4',rhythm:'quaver',rest:false},{pitch:'B3',rhythm:'quaver',rest:false},{pitch:'A3',rhythm:'quaver',rest:false},{pitch:'C4',rhythm:'quaver',rest:false},{pitch:'B3',rhythm:'quaver',rest:false},{pitch:'A3',rhythm:'quaver',rest:false}],
    [{pitch:'D4',rhythm:'dottedCrotchet',rest:false},{pitch:'E4',rhythm:'quaver',rest:false},{pitch:'D4',rhythm:'quaver',rest:false},{pitch:'E4',rhythm:'quaver',rest:false}],
    [{pitch:'C4',rhythm:'crotchet',rest:false},{pitch:undefined,rhythm:'crotchetRest',rest:true}],
  ],
]);
assert.deepEqual([q2.restBar,q2.restSlots,q2.chord,q2.bassClef,q2.finalBarline],[1,[1,2],{bar:4,answer:'C major',also:['IV','4']},{bar:6,answer:'D4'},'double']);
assert.deepEqual(q2.bars.map(item=>item.notes.map(n=>`${n.rest?"rest":n.pitch}:${n.rhythm}`)),[
  ["G4:quaver","rest:crotchetRest","rest:dottedCrotchetRest","rest:dottedCrotchetRest","C4:quaver","D4:quaver","G4:quaver"],
  ["G4:dottedCrotchet","rest:dottedCrotchetRest","rest:dottedCrotchetRest","A4:quaver","B4:quaver","G4:quaver"],
  ["A4:quaver","B4:quaver","B4:quaver","B4:dottedCrotchet","B4:quaver","D5:quaver","D4:quaver"],
  ["E4:dottedMinim","rest:crotchetRest","D4:quaver","E4:quaver","G4:quaver","C4:quaver"],
  ["D4:dottedMinim","rest:crotchetRest","D4:quaver","E4:quaver","G4:quaver","C4:quaver"],
  ["D4:dottedMinim","rest:crotchetRest","D4:quaver","E4:quaver","G4:quaver","A4:quaver"],
  ["G4:dottedSemibreve"],
  ["G4:dottedMinim","G4:dottedCrotchet"],
]);
assert.deepEqual([q4.missing,q4.interval,q4.accidental,q4.enharmonic,q4.octaveSign,q4.finalBarline],[
  {bar:4,indices:[0,1,2,3],answer:['A4','G4','F4','D4']},
  {bar:5,answer:'Tritone',also:['Augmented 4th']},{bar:12,note:5,answer:'sharp'},
  {bar:15,source:'G#2',answer:'Ab2'},{bars:[16,17],answer:'one octave lower'},'double',
]);
// Independently read from the calibrated 600 dpi piano systems. Chords count
// as one rhythmic event; C#5 in bar 12 is the deliberately missing accidental.
const pianoInventory = hand => q4.bars.map(item => item[hand].notes.map(entry => `${entry.rest?'rest':(entry.chord||[entry.pitch]).join('+')}:${entry.rhythm}`).join(' '));
assert.deepEqual(pianoInventory('upper'),[
  'D4+F4:semibreve','D4+F4:semibreve','D4+F4:semibreve',
  'A4:quaver G4:quaver F4:quaver D4:quaver rest:minimRest',
  'rest:crotchetRest D4+F4:crotchet rest:crotchetRest D4+F4:crotchet',
  'rest:crotchetRest D4+F4:crotchet rest:crotchetRest D4+F4:crotchet',
  'rest:crotchetRest D4+F4:crotchet rest:crotchetRest D4+F4:crotchet',
  'A4:quaver B4:quaver C#5:quaver D5:quaver rest:minimRest',
  'rest:quaverRest D5:quaver F5:quaver G5:quaver Ab5:quaver G5:quaver F5:quaver D5:quaver',
  'D5:dottedMinim rest:crotchetRest',
  'rest:quaverRest D5:quaver F5:quaver G5:quaver Ab5:quaver F5:quaver Ab5:quaver F5:quaver',
  'rest:quaverRest A5:crotchet F5:quaver G5:quaver C5:quaver C#5:quaver D5:quaver',
  'D5:semibreve','D5:semibreve','D5:semibreve',
  'A5:quaver B5:quaver C#6:quaver D6:quaver rest:minimRest','rest:semibreveRest',
]);
assert.deepEqual(pianoInventory('lower'),[
  'D3:crotchet A3:quaver D3:quaver G#3:quaver A3:quaver rest:crotchetRest',
  'D3:crotchet A3:quaver D3:quaver Ab3:quaver G3:quaver F3:crotchet',
  'D3:crotchet F3:quaver D3:quaver G3:quaver G#3:quaver rest:crotchetRest',
  'A3:quaver G3:quaver F3:quaver D3:quaver rest:minimRest',
  'D3:crotchet A3:quaver D3:quaver G#3:quaver A3:quaver rest:crotchetRest',
  'D3:crotchet A3:quaver D3:quaver Ab3:quaver G3:quaver F3:crotchet',
  'D3:crotchet F3:quaver D3:quaver G3:quaver G#3:quaver rest:crotchetRest',
  'G3:quaver F3:quaver E3:quaver D3:quaver rest:minimRest','G3+B3:semibreve',
  'D3:crotchet F3:quaver D3:quaver G3:quaver G#3:quaver A3:quaver G3+B3:quaver',
  'G3+B3:semibreve','A2:minim rest:minimRest',
  'D2:crotchet F2:quaver D2:quaver G2:quaver G#2:quaver A2:quaver D2:quaver',
  'rest:crotchetRest F2:quaver D2:quaver G2:quaver F2:quaver E2:crotchet',
  'D2:crotchet F2:quaver D2:quaver G2:quaver G#2:quaver rest:crotchetRest',
  'G2:quaver F2:quaver E2:quaver D2:quaver rest:crotchetRest D2:crotchet',
  'D2:minim rest:minimRest',
]);
assert.deepEqual(q4.bars.map(item=>item.tiesUpperToNext||[]),[[0],[0],[],[],[],[],[],[],[7],[],[],[6],[0],[0],[],[],[]]);
assert.deepEqual(q4.bars.map(item=>item.tiesLowerToNext||[]),[[],[],[],[],[],[],[],[],[],[6],[],[],[],[],[],[5],[]]);
assert.deepEqual(q4.bars[4].interval,{indices:[2,3],lower:'D3',upper:'G#3',answer:'Tritone'});
assert.deepEqual(q4.bars[11].upper.notes[1].grace,['G#5']);
assert.equal(q4.bars[11].upper.notes[5].suppressAccidental,true);
assert.equal(q4.bars[15].octaveNoteIndex,5);
assert.deepEqual(q4.bars[3].upper.missingIndices,[0,1,2,3]);
assert.equal(q4.bars[16].finalBarline,'double');
assert.equal(q1d.pickup.notes.reduce((sum,n)=>sum+(n.beats||0),0),1,'Question 1(d) upbeat total');
for (const option of q1d.options) option.forEach((item,index)=>assert.equal(item.notes.reduce((sum,n)=>sum+(n.beats||0),0),index===3?2:3,`Question 1(d) bar ${index+1} total`));
q2.bars.forEach((item,index)=>assert.equal(item.notes.reduce((sum,n)=>sum+(n.beats||0),0),[2,7].includes(index)?4.5:6,`Question 2 bar ${index+1} total`));
q4.bars.forEach((item,index)=>{assert.equal(item.upper.notes.reduce((sum,n)=>sum+(n.beats||0),0),4,`Question 4 upper bar ${index+1}`);assert.equal(item.lower.notes.reduce((sum,n)=>sum+(n.beats||0),0),4,`Question 4 lower bar ${index+1}`);});

const hashes = {};
for (const id of ['ah-2019-q1d','ah-2019-q2','ah-2019-q4']) hashes[id]=crypto.createHash('sha256').update(JSON.stringify(notation.getInventory(id))).digest('hex');
assert.deepEqual(hashes, {
  'ah-2019-q1d':'0b5f9bd85d68187887ca5e29a4717e2a449687469ca2b1ebb22fe4e794b0399d',
  'ah-2019-q2':'f348e78a137ff259a06542e7636c5ef755440089aa94071881ccd51b0486cfe1',
  'ah-2019-q4':'3af032466c3ab415bef62f2e087dbdf9a39d74699200e70fb49efd83ea86c075',
});

const expectedMarkers=[[7.05,249.47,296.88,357.45,455,562.55],[7.22,375.88],[6.07,381.14,455.19],[6.46,187.4,346.42],[6.8,233.7,287.64],[8.36,57.32,185.62,308.83,438.03,803.16,867.29,996.36,1119.26,1247.51]];
const durations=[620.019,482.046,499.763,403.725,349.832,1976.645];
assert.equal(expectedMarkers.flat().length,27);
paper.questions.forEach((question,index)=>{const clip=question.audio.clips[0];assert.equal(fs.existsSync(path.resolve(__dirname,'..',clip.file)),true);assert.deepEqual(clip.markers.map(marker=>marker.time),expectedMarkers[index]);assert.deepEqual(clip.markers.map(marker=>marker.time),[...clip.markers].map(marker=>marker.time).sort((a,b)=>a-b));assert.ok(clip.markers.every(marker=>marker.time>=0&&marker.time<durations[index]));});

class SvgNode { constructor(name){this.name=name;this.attributes={};this.children=[];this.style={};this.dataset={};this.events={};this.textContent='';} setAttribute(name,value){this.attributes[name]=String(value);} getAttribute(name){return this.attributes[name]||'';} append(...nodes){this.children.push(...nodes);} insertBefore(node,reference){ this.children.splice(this.children.indexOf(reference),0,node); return node; }
  addEventListener(name,callback){(this.events[name]||=[]).push(callback);} closest(){return null;} contains(){return false;} remove(){} get lastChild(){return this.children.at(-1);} }
const descendants=node=>[node,...node.children.flatMap(descendants)];
const oldDocument=global.document,oldSymbols=global.BRAVURA_SYMBOLS;
global.document={createElementNS:(_,name)=>new SvgNode(name),createElement:name=>new SvgNode(name),activeElement:null};global.BRAVURA_SYMBOLS=new Proxy({},{get:(_,key)=>String(key)});
for (const key of ['q1d','q2','q4']) for (const interactive of [false,true]) { const wrap=new SvgNode('div'); const score={sharedNotation:`ah-2019-${key}`,...(key==='q1d'?{optionIndex:2}:{})}; notation.renderSharedScore({innerHTML:'',querySelector:()=>wrap},{score},answers,interactive?()=>{}:null,Object.fromEntries([...parts.keys()].map(id=>[id,'incorrect']))); const nodes=descendants(wrap); assert.ok(nodes.some(node=>node.name==='svg')); assert.ok(!nodes.some(node=>Object.values(node.attributes).some(value=>/NaN|undefined|Infinity/.test(value))),`${key} finite render`); if(interactive&&['q2','q4'].includes(key))assert.ok(nodes.some(node=>node.attributes.class==='q3-note-hit-area'&&node.events.keydown?.length),`${key} keyboard note entry`); }
const q1dWrap=new SvgNode('div');notation.renderSharedScore({innerHTML:'',querySelector:()=>q1dWrap},{score:{sharedNotation:'ah-2019-q1d',optionIndex:2}},answers,null,{});const q1dNodes=descendants(q1dWrap);assert.equal(q1dNodes.filter(node=>node.attributes.class==='q3-barline').length,5,'Question 1(d) should show the upbeat barline, three internal barlines and the final barline.');assert.equal(q1dNodes.find(node=>node.name==='svg')?.attributes.viewBox,'30 0 860 150');
const q2Wrap=new SvgNode('div');notation.renderSharedScore({innerHTML:'',querySelector:()=>q2Wrap},{score:{sharedNotation:'ah-2019-q2'}},answers,()=>{},{});const q2Nodes=descendants(q2Wrap);assert.ok(q2Nodes.some(node=>node.textContent==='(i) Rests'),'Question 2 should retain the missing-rest box label.');assert.ok(q2Nodes.some(node=>node.textContent==='(ii) Chord:'),'Question 2 should retain the source chord-box label.');assert.ok(q2Nodes.some(node=>node.children.map(function printedText(child){return child.textContent+child.children.map(printedText).join('');}).join(' ')==='(iii) Same pitch in bass clef'),'Question 2 should retain the source bass-clef-box label.');assert.equal(q2Nodes.filter(node=>node.attributes.class==='q3-barline').length,8,'Question 2 should show the upbeat, internal and first two system-end barlines.');assert.ok(q2Nodes.some(node=>String(node.attributes.class||'').includes('q3-final-barline')),'Question 2 should end with the printed final barline.');
const restPlacementTargets=q2Nodes.filter(node=>String(node.attributes['aria-label']||'').startsWith('Place rests for'));
assert.equal(restPlacementTargets.length,2);
assert.ok(Number(restPlacementTargets[0].attributes.x)+Number(restPlacementTargets[0].attributes.width)<Number(restPlacementTargets[1].attributes.x),'Rest placement areas must not overlap.');
assert.ok(restPlacementTargets.every(node=>Number(node.attributes.width)>20),'Both rest placement areas must remain clickable.');
const q4Wrap=new SvgNode('div');notation.renderSharedScore({innerHTML:'',querySelector:()=>q4Wrap},{score:{sharedNotation:'ah-2019-q4'}},answers,()=>{},{});const q4Nodes=descendants(q4Wrap);for(const label of ['(i) Notes','(ii) Interval:'])assert.ok(q4Nodes.some(node=>node.textContent===label),`Question 4 should retain the source score label ${label}`);
const q4bWrap=new SvgNode('div');notation.renderSharedScore({innerHTML:'',querySelector:()=>q4bWrap},{score:{sharedNotation:'ah-2019-q4b'}},answers,()=>{},{});const q4bNodes=descendants(q4bWrap);for(const label of ['(i) Accidental','(ii) Enharmonic'])assert.ok(q4bNodes.some(node=>node.textContent===label),`Question 4(b) should retain the source score label ${label}`);
assert.equal(q4Nodes.filter(node=>node.textContent==='brace').length,5,'Five piano systems need five braces.');
assert.equal(q4Nodes.filter(node=>node.attributes.class==='q3-barline').length,23,'Five system starts, seventeen bar ends and the final thin line.');
assert.ok(q4Nodes.some(node=>node.attributes.style==='stroke-width:4'),'The final barline must have a heavy right stroke.');
assert.ok(q4Nodes.some(node=>node.attributes.class==='q3-answer-line'&&node.attributes['stroke-dasharray']==='5 5'),'The printed 8vb continuation line must be visible.');
const pianoHeads=q4Nodes.filter(node=>node.textContent==='noteheadBlack');
// RH bar 5's first chord must be vertically aligned with LH's second note.
const rhChord=pianoHeads.find(node=>Number(node.attributes.y)===q4.layout.systemTops[1]+38.5&&Number(node.attributes.x)>400&&Number(node.attributes.x)<500);
const lhQuaver=pianoHeads.find(node=>Number(node.attributes.y)===q4.layout.systemTops[1]+108&&Number(node.attributes.x)>400&&Number(node.attributes.x)<500);
assert.ok(rhChord&&lhQuaver,'Both offbeat chord and bass quaver must be rendered.');
assert.equal(rhChord.attributes.x,lhQuaver.attributes.x,'Both hands must align at the same rhythmic onset.');
const missingBox=q4Nodes.filter(node=>node.attributes.class==='q3-marking-box')[0];
assert.ok(Number(missingBox.attributes.width)<150,'The notes box must stop before the printed minim rest.');
assert.equal(q4Nodes.filter(node=>node.attributes.class==='q3-marking-box')[1].attributes.height,'156','Interval box bottom is raised 10px.');
assert.equal(q4Nodes.find(node=>node.textContent==='8vb').attributes.y,'1288','The 8vb marking is lowered 5px.');
const chordNaturals=q4Nodes.filter(node=>node.textContent==='natural'&&[672.5,683.5].includes(Number(node.attributes.y))&&Number(node.attributes.x)>750);
assert.equal(chordNaturals.length,2,'The bass chord retains both printed naturals.');
assert.equal(Math.abs(Number(chordNaturals[0].attributes.x)-Number(chordNaturals[1].attributes.x)),14,'Adjacent chord naturals use separate columns.');
const accidentalBox=q4bNodes.find(node=>node.attributes.class==='q3-marking-box');
assert.deepEqual([accidentalBox.attributes.y,accidentalBox.attributes.height],['16','135'],'Accidental box extends upward by 25px.');
assert.equal(q4bNodes.filter(node=>node.attributes.class==='q3-marking-box')[1].attributes.width,'40','Enharmonic box tightly encloses only G-sharp, with its label allowed to extend outside.');
assert.equal(parts.get('q4bii').noteEntryAccidentals,true);
assert.deepEqual(parts.get('q4bii').options.map(option=>option.value),['flat','natural','sharp']);
for (const key of ['q4b','q4c']) { const wrap=new SvgNode('div'); notation.renderSharedScore({innerHTML:'',querySelector:()=>wrap},{score:{sharedNotation:`ah-2019-${key}`}},answers,()=>{},{}); const nodes=descendants(wrap); assert.ok(nodes.some(node=>node.name==='svg')); assert.ok(!nodes.some(node=>Object.values(node.attributes).some(value=>/NaN|undefined|Infinity/.test(value))),`${key} finite render`); }

const emptyRestsWrap=new SvgNode('div'),emptyRestChanges=[];
notation.renderSharedScore({innerHTML:'',querySelector:()=>emptyRestsWrap},{score:{sharedNotation:'ah-2019-q2'}},{},(id,value)=>emptyRestChanges.push([id,value]));
const emptyRestTargets=descendants(emptyRestsWrap).filter(node=>/^Place rests for the /.test(node.attributes['aria-label']||''));
assert.equal(emptyRestTargets.length,2);
for(const target of emptyRestTargets){assert.ok(target.events.touchend?.length,'an empty rest target must interrupt a tool double-tap');for(const callback of target.events.keydown||[])callback({key:'Delete',shiftKey:true,type:'keydown',preventDefault(){}});}
assert.equal(emptyRestChanges.length,0,'removing an empty rest position must not alter another slot');
global.document=oldDocument;global.BRAVURA_SYMBOLS=oldSymbols;
// Rerender after every key, just as the browser does after an entered note.
const keyboardSandbox={module:{exports:{}},document:{createElementNS:(_,name)=>new SvgNode(name),createElement:name=>new SvgNode(name),querySelectorAll:()=>[],activeElement:null},BRAVURA_SYMBOLS:new Proxy({},{get:(_,key)=>String(key)})};
const keyboardSource=fs.readFileSync(path.join(__dirname,'../exam-notation.js'),'utf8').replace('const api = { render,','const api = { ah2016AnswerNotes, q3SetAccidentalToolArmed, render,');
require('node:vm').runInNewContext(keyboardSource,keyboardSandbox);
const keyboardApi=keyboardSandbox.module.exports, keyboardAnswers={};
let keyboardTarget;
function renderKeyboard(id='q4ai',bass=false,accidentals=false) {
 const svg=new SvgNode('svg');
 keyboardApi.ah2016AnswerNotes(svg,id,(bass?[100]:[100,140,180,220]).map(x=>({x,rhythm:'quaver'})),100,keyboardAnswers,(part,value)=>{keyboardAnswers[part]=value;renderKeyboard(id,bass,accidentals);},{},bass,accidentals);
 keyboardTarget=svg.lastChild;
}
function pressKeyboard(key,shiftKey=false){for(const handler of keyboardTarget.events.keydown||[])handler({key,shiftKey,preventDefault(){}});}
renderKeyboard();
for(const key of ['ArrowDown','Enter','ArrowRight','ArrowDown','Enter','ArrowRight','ArrowDown','Enter','ArrowRight','ArrowDown','ArrowDown','Enter'])pressKeyboard(key);
assert.equal(keyboardAnswers.q4ai,'A4,G4,F4,D4','Keyboard pitch and slot survive each score rerender.');
keyboardAnswers.q4ai='';renderKeyboard();pressKeyboard('Enter');
assert.equal(keyboardAnswers.q4ai,'B4,_,_,_','Clearing starts keyboard entry from the initial slot and pitch.');
pressKeyboard('Delete',true);
assert.equal(keyboardAnswers.q4ai,'_,_,_,_','Shift+Delete removes an entered note.');
pressKeyboard('Enter');pressKeyboard('Backspace',true);
assert.equal(keyboardAnswers.q4ai,'_,_,_,_','The macOS Delete/Backspace key also removes the note.');
renderKeyboard('q4bii',true,true);
for(const key of [...Array(8).fill('ArrowDown'),'Enter'])pressKeyboard(key);
assert.equal(keyboardAnswers.q4bii,'A2');
keyboardApi.q3SetAccidentalToolArmed('flat');pressKeyboard('Enter');
assert.equal(keyboardAnswers.q4bii,'Ab2','Selecting Flat changes an existing note at the same pitch.');
keyboardApi.q3SetAccidentalToolArmed('natural');pressKeyboard('Enter');
assert.equal(keyboardAnswers.q4bii,'A2','Selecting Natural removes the accidental at the same pitch.');
// Exercise the shared tool-state handler with two real subquestion identities.
// Expose its private entry points only inside this isolated test context.
const accidentalSandbox={module:{exports:{}},document:{activeElement:null}};
const accidentalSource=fs.readFileSync(path.join(__dirname,'../exam-notation.js'),'utf8').replace('const api = { render,','const api = { q3SetAccidentalToolArmed, q3AccidentalForPart, render,');
require('node:vm').runInNewContext(accidentalSource,accidentalSandbox);
const accidentalApi=accidentalSandbox.module.exports;
const accidentalButtons=[];
const accidentalCard={querySelectorAll:selector=>selector==='.notation-tool-accidental'?accidentalButtons:[]};
const accidentalContext=id=>({closest:selector=>selector==='[data-subquestion]'?{dataset:{subquestion:id}}:accidentalCard});
for(const [id,value] of [['q4bi','sharp'],['q4bii','flat'],['q4bii','natural'],['q4bii','sharp']]) {
  const button={...accidentalContext(id),dataset:{value},attributes:{},setAttribute(name,value){this.attributes[name]=value;}};
  button.classList={toggle:(_,selected)=>{button.selected=selected;}};
  accidentalButtons.push(button);
}
accidentalApi.q3SetAccidentalToolArmed('sharp',accidentalButtons[0]);
assert.deepEqual(accidentalButtons.map(button=>button.selected),[true,false,false,false]);
assert.equal(accidentalApi.q3AccidentalForPart('q4bii'),'','Part (ii) must not consume part (i) selection.');
accidentalApi.q3SetAccidentalToolArmed('sharp',accidentalContext('q4bii'),true);
assert.deepEqual(accidentalButtons.map(button=>button.selected),[true,false,false,false],'Rerender must preserve the owner.');
accidentalApi.q3SetAccidentalToolArmed('sharp',accidentalButtons[3]);
assert.deepEqual(accidentalButtons.map(button=>button.selected),[false,false,false,true]);
assert.equal(accidentalApi.q3AccidentalForPart('q4bi'),'','Part (i) must not consume part (ii) selection.');
accidentalApi.q3SetAccidentalToolArmed('',accidentalContext('q4bii'));
assert.ok(accidentalButtons.every(button=>!button.selected));
assert.match(fs.readFileSync(path.join(__dirname,'../digitalquestionpapers.html'),'utf8'),/advanced-higher-2019-notation\.js/);
const uiSource=fs.readFileSync(path.join(__dirname,'../exam-ui.js'),'utf8');
const styleSource=fs.readFileSync(path.join(__dirname,'../styles.css'),'utf8');
assert.match(uiSource,/questionCard\.dataset\.paperId = paper\.id/,'Single-question papers should expose their paper id for source-specific layout rules.');
assert.match(styleSource,/data-paper-id="advanced-higher-2019"[^}]*question-intro/,'Advanced Higher 2019 should retain its compact source-paragraph spacing.');
console.log('Advanced Higher 2019 source, marking, audio and notation tests passed.');
