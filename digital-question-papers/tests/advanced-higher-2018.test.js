const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const paper = require('../papers/advanced-higher-2018.js');
const notation = require('../exam-notation.js');
const marking = require('../exam-marking.js');
const registry = require('../paper-registry.js');
const { answerComplete, createAttempt } = require('../exam-engine.js');

const parts = new Map(paper.questions.flatMap(question => question.subquestions).map(part => [part.id, part]));
const mark = (id, value) => marking.markSubquestion(parts.get(id), value).marks;
assert.equal(mark('q6a1', { final: 'Major; appoggiatura.' }), 1);
for (const answer of ['Major-minor-major; appoggiatura.', 'Major – Minor – Major; appoggiatura.']) {
  assert.equal(mark('q6a1', { final: answer }), 0, 'The source explicitly rejects major-minor-major as the tonality concept.');
}
for (const reason of ['jazz harmony', 'the voices sing straight', 'the voices are not operatic']) {
  assert.equal(mark('q6bii', { final: `Excerpt 2 is modern because it uses ${reason}.` }), 1, `The source accepts ${reason} as justification.`);
}
assert.equal(registry[paper.id].levelCode, 'AH');
assert.equal(paper.estimatedMinutes, 75);
assert.deepEqual(paper.questions.map(question => question.marks), [6,6,6,4,8,10]);
assert.equal([...parts.values()].reduce((sum, part) => sum + part.marks, 0), 40);
assert.equal(fs.existsSync(path.resolve(__dirname, '..', paper.sourcePath)), true);
assert.equal(fs.existsSync(path.resolve(__dirname, '..', paper.markingInstructionsPath)), true);
const styles = fs.readFileSync(path.resolve(__dirname, '..', 'styles.css'), 'utf8');
assert.match(styles, /\.paper-level-ah\.question-q6 \.subquestion-structured-review \{ margin-left: 25px; margin-right: 25px; \}/,
  'Advanced Higher Question 6 review sheets should remain centred at their source width.');
assert.match(styles, /\[data-subquestion="q6bi"\] \.subquestion-source-intro \.question-intro-compact-lines \{ margin: 28px 0 28px 94px; \}/,
  'Question 6 replay cues should align with the surrounding indented instructions.');

const answers = {
  q1a:'Suspension\nRenaissance\nAntiphonal\nAnthem',q1b:'Lied',q1c:'Contemporary jazz',
  q2ai:'crotchetRest,E4,D4,E4,G4',q2aii:'bars-9-10',q2b:'B3,A3,G3',q2ci:'5/4',q2cii:'A2',q2d:'bar-16-fsharp',
  q3a1:'Turn',q3a2:'Inverted pedal',q3a3:'Bassoon',q3a4:'Concerto',q3b:'Diminished 7th',q3c:'Piano trio',
  q4a:'E minor',q4b:'Imperfect cadence',q4c:'A#4',q4d:'Tierce de Picardie',
  q5a:'Modulation\nAugmentation\nInverted pedal\nCanon',q5b:'2',q5c:'Time changes',q5d:'3',q5e:'Plagal',
  q6a1:{final:'Appoggiatura\nArpeggios\nCadenza\nHarp'},q6a2:{final:'Added 6th\nSequence\nCanon\nTrumpet'},
  q6bi:{final:'Both excerpts use appoggiaturas. Both excerpts use arpeggios. Both excerpts are chromatic. Both excerpts use dominant seventh chords. Excerpt 1 is an aria while Excerpt 2 is from a musical. Excerpt 1 features soprano while Excerpt 2 features a male trio.'},
  q6bii:{final:'Excerpt 1 is Romantic because it uses a large orchestra. Excerpt 2 is modern because it uses added sixth chords.'},
};
for (const [id,value] of Object.entries(answers)) assert.equal(mark(id,value),parts.get(id).marks,id);
assert.equal(marking.markPaper(paper,answers).score,40);

assert.equal(mark('q1b','Lieder'),1); assert.equal(mark('q1b','Song cycle'),1);
assert.equal(mark('q1c','Jazz'),0);
assert.equal(mark('q2ai','quaverRest,quaverRest,E4,D4,E4,G4'),1);
assert.equal(mark('q2ai','crotchetRest,E4,D4,E4,F4'),0);
assert.equal(mark('q2aii','bars-8-9'),0);
assert.equal(mark('q2b','B2,A3,G2'),1);
assert.equal(mark('q2ci','2/4 + 3/4'),1);
assert.equal(mark('q2cii','A3'),0);
assert.equal(mark('q3a4','Solo concerto'),1); assert.equal(mark('q3a4','Concerto grosso'),0);
assert.equal(mark('q3c','Chamber group'),1); assert.equal(mark('q3c','Chamber music'),0); assert.equal(mark('q3c','Trio'),0);
assert.equal(mark('q4a','Em'),1); assert.equal(mark('q4a','E major'),0);
assert.equal(mark('q4c','Bb4'),0);
assert.equal(mark('q5c','Changing time signatures'),1); assert.equal(mark('q5c','Triplets'),0);
assert.equal(mark('q5e','IV to I'),1); assert.equal(mark('q5e','Amen'),0);
assert.deepEqual(parts.get('q5a').afterAnswerLines,[
  'The music will be played twice with a pause of 10 seconds between playings and a pause of 40 seconds before part (b).',
  'Here is the music for the first time.',
  'Here is the music for the second time.',
],'Question 5(a) should retain the source playback wording and cue order.');
assert.equal(paper.questions[4].layout,'ah2018-q5','Question 5 source spacing should remain scoped to the 2018 paper.');
assert.deepEqual(parts.get('q5b').promptLines,[
  'Listen to a vocal version of the same melody which begins with a short instrumental introduction.',
  'Tick one box to identify the correct version of the music.',
],'Question 5(b) should keep its two source instruction paragraphs separate.');
assert.deepEqual(parts.get('q5b').beforeAnswerLines,[
  'You now have 30 seconds to read through the possible answers.',
  'The excerpt is short and will be played three times.',
  'Here is the music for the first time.',
  'Here is the music for the second time.',
  'Here is the music for the third time.',
],'Question 5(b) should retain the source reading and playback sequence.');
assert.equal(parts.get('q5b').markAlign,'prompt-end','Question 5(b) mark should align with the Tick one box instruction.');
assert.deepEqual(parts.get('q5c').promptLines,[
  'Listen to a new excerpt.',
  'Identify the concept that describes the prominent feature of the rhythm.',
],'Question 5(c) should keep its two source instruction paragraphs separate.');
assert.deepEqual(parts.get('q5c').beforeAnswerLines,[
  'The music will be played twice.',
  'Here is the music for the first time.',
  'Here is the music for the second time.',
],'Question 5(c) should retain the source playback sequence above the answer line.');
assert.equal(parts.get('q5c').afterAnswerLines,undefined,'Question 5(c) should not repeat its playback sequence below the answer line.');
assert.equal(parts.get('q5c').markAlign,'prompt-end','Question 5(c) mark should align with its identification instruction.');
assert.deepEqual(parts.get('q5d').promptLines,[
  'Listen to a new excerpt.',
  'Tick one box to indicate the order in which the 4 different woodwind instruments play.',
],'Question 5(d) should keep its two source instruction paragraphs separate.');
assert.deepEqual(parts.get('q5d').beforeAnswerLines,[
  'You now have 20 seconds to read through the possible answers.',
  'The excerpt is very short and will be played twice.',
  'Here is the music for the first time.',
  'Here is the music for the second time.',
],'Question 5(d) should retain the source reading and playback sequence before the choices.');
assert.equal(parts.get('q5d').markAlign,'prompt-end','Question 5(d) mark should align with the Tick one box instruction.');
assert.deepEqual(parts.get('q5e').beforeAnswerLines,[
  'The music will be played once only.',
],'Question 5(e) playback sentence should appear before its answer line.');
assert.equal(parts.get('q5e').afterAnswerLines,undefined,'Question 5(e) should not repeat its playback sentence below the answer line.');
assert.equal(mark('q6a1',{final:'Chromatic scale\nArpeggios\nViolin\nHarp'}),0,'Official MI page 6 excludes chromatic scale and violin; one valid concept in each category earns no complete pair.');
assert.equal(mark('q6a2',{final:'Modulation\nSequence\nStrings\nTrumpet'}),0);
assert.equal(mark('q6bii',{final:'Excerpt 1 is Romantic. Excerpt 2 is modern.'}),1);
assert.equal(mark('q6bii',{final:'Excerpt 1 is Romantic because of the harp. Excerpt 2 is contemporary because of the drum kit.'}),1);

assert.equal(answerComplete(parts.get('q2ai'),'crotchetRest,E4,D4,E4,_'),false);
assert.equal(answerComplete(parts.get('q2ai'),answers.q2ai),true);
assert.equal(answerComplete(parts.get('q2b'),'B3,A3,_'),false);
assert.equal(createAttempt(paper,'exam',true).timer.remainingSeconds,4500);

const q2 = notation.getInventory('ah-2018-q2');
const q4 = notation.getInventory('ah-2018-q4');
const q5b = notation.getInventory('ah-2018-q5b');
assert.deepEqual([q2.missingBar,q2.missingAnswer,q2.bassPhraseBars,q2.bassLine.answer,q2.second.octaveAnswer,q2.third.augmentedBar,q2.third.augmentedIndex], [12,['crotchetRest','E4','D4','E4','G4'],[9,10],['B3','A3','G3'],'A2',16,2]);
const expectedQ2Bars = [
  [['D5','crotchet'],['E5','crotchet'],['F5','crotchet'],['A5','crotchet']],
  [['G5','minim'],['E4','quaver'],['F4','quaver'],['E4','quaver'],['D4','quaver']],
  [['D4','quaver'],['G4','dottedCrotchet'],['G4','minim']],
  [['minimRest','minimRest'],['F4','quaver'],['E4','quaver'],['F4','quaver'],['E4','quaver']],
  [['E4','crotchet'],['D4','quaver'],['D4','quaver'],['D4','minim']],
  [['minimRest','minimRest'],['E4','quaver'],['F4','quaver'],['E4','quaver'],['D4','quaver']],
  [['D4','dottedCrotchet'],['G4','quaver'],['G4','minim']],
  [['minimRest','minimRest'],['F4','quaver'],['E4','quaver'],['F4','quaver'],['E4','quaver']],
  [['E4','crotchet'],['D4','quaver'],['D4','quaver'],['D4','minim']],
  [['minimRest','minimRest'],['A4','crotchet'],['A4','quaver'],['A4','quaver']],
  [['G4','crotchet'],['D4','dottedMinim']],
  [['crotchetRest','crotchetRest'],['E4','quaver'],['D4','quaver'],['E4','crotchet'],['G4','crotchet']],
  [['E4','semiquaver'],['D4','semiquaver'],['C4','quaver'],['C4','minim'],['D4','quaver'],['E4','quaver']],
  [['F4','dottedMinim'],['F4','quaver'],['E4','quaver']],
  [['D4','crotchet'],['D4','quaver'],['E4','quaver'],['E4','crotchet'],['D4','crotchet']],
  [['C4','minim'],['E5','quaver'],['D5','quaver'],['C5','quaver'],['D5','quaver']],
];
assert.deepEqual(q2.bars.map(bar=>bar.notes.map(item=>[item.pitch||item.rhythm,item.rhythm])),expectedQ2Bars);
assert.deepEqual(q2.bars[0].notes[3].grace,['G#5']);
assert.equal(q2.bars[1].notes[0].courtesyAccidental,'natural');
assert.equal(q2.bars[1].notes[4].tieToNextBar,true);
assert.deepEqual(q2.bars[15].notes[1].grace,['D#5']);
assert.equal(q2.bars[15].notes[2].courtesyAccidental,'natural');
assert.deepEqual(q2.bars[10].notes.map(item=>[item.pitch,item.rhythm]),[['G4','crotchet'],['D4','dottedMinim']],'Question 2(a) bar 11 should be G crotchet followed by D dotted minim.');
assert.deepEqual(q2.bars[13].notes.map(item=>[item.pitch,item.rhythm]),[['F4','dottedMinim'],['F4','quaver'],['E4','quaver']],'Question 2(a) bar 14 should end with a quaver E, not a quaver rest.');
assert.deepEqual(q2.bars[14].notes.map(item=>[item.pitch,item.rhythm]),[['D4','crotchet'],['D4','quaver'],['E4','quaver'],['E4','crotchet'],['D4','crotchet']],'Question 2(a) bar 15 should use a tied E crotchet, not a minim.');
assert.deepEqual(q2.bars.map(bar=>bar.ties||[]),[[],[],[[1,2]],[],[[2,3]],[],[[1,2]],[],[[2,3]],[],[],[],[[2,3]],[],[[2,3]],[]]);
assert.deepEqual(q2.bars.map(bar=>bar.notes.flatMap((note,index)=>note.tieToNextBar?[index]:[])),[[],[4],[],[4],[],[4],[],[4],[],[],[],[],[],[],[],[]]);
assert.deepEqual(q2.bassLine.melody.map(item => item.notes.map(note => note.pitch || note.rhythm)), [
  ['G5','E4','F4','E4','D4'],['D4','G4','G4'],['minimRest','F4','E4','F4','E4'],['E4','D4','D4','D4'],['minimRest','E4','F4','E4','D4'],
]);
assert.equal(q2.bassLine.melody[0].notes[0].courtesyAccidental,undefined,'Question 2(b) bar 2 G should not show a natural sign.');
assert.deepEqual(q2.bassLine.chords,['C','G 1st Inv.','F 1st Inv.','G7','C']);
assert.deepEqual(q2.bassPhrase.map(item=>item.notes.map(note=>[note.pitch,note.rhythm])),[[['G2','dottedMinim'],['G2','quaver'],['Gb2','quaver']],[['F2','semibreve']]]);
assert.deepEqual(q2.bassLine.romanNumerals,['I','Vb','IVb','V7','I']);
assert.deepEqual(q2.bassLine.chordPitches,[['E4','G4'],['D4','G4'],['C4','F4'],['B3','F4','G4'],['E4','G4','C5']],'Question 2(b) right-hand voicings should match the user-confirmed bars 2–6.');
assert.deepEqual(q2.bassLine.chordXOffsets,[[0,0],[0,0],[0,0],[0,0,16],[0,0,0]],'Question 2(b) bar 5 upper G should sit 16px to the right.');
assert.deepEqual(q2.second.bars[8].notes.map(item=>[item.pitch,item.rhythm]),[['A4','minim'],['A3','minim'],['A3','crotchet']],'Question 2(c) bar 9 should match the supplied source image.');
assert.equal(q2.second.finalBarline,'repeatRight','Question 2(c) should end with a repeat barline.');
assert.equal(q2.second.layout.keySignatureYOffset,10,'Question 2(c) key signatures should sit 10px lower.');
assert.deepEqual(q2.second.bars.map(item=>item.notes.map(note=>[note.pitch||note.rhythm,note.rhythm])),[
  [['A3','minim'],['D4','minim'],['E4','crotchet']],
  [['F#4','crotchet'],['A4','quaver'],['F#4','quaver'],['B4','minim'],['A4','crotchet']],
  [['E4','crotchet'],['F#4','quaver'],['G4','quaver'],['F#4','crotchet'],['E4','crotchet'],['F#4','crotchet']],
  [['B3','crotchet'],['C#4','quaver'],['D4','quaver'],['C#4','crotchet'],['B3','crotchet'],['E4','crotchet']],
  [['A3','minim'],['D4','minim'],['E4','crotchet']],
  [['F#4','crotchet'],['A4','quaver'],['F#4','quaver'],['D5','minim'],['C#5','crotchet']],
  [['B4','crotchet'],['C#5','quaver'],['D5','quaver'],['C#5','crotchet'],['B4','crotchet'],['C#5','crotchet']],
  [['F#4','crotchet'],['G#4','quaver'],['A4','quaver'],['G4','crotchet'],['F#4','crotchet'],['B4','crotchet']],
  [['A4','minim'],['A3','minim'],['A3','crotchet']],
],'Question 2(c) bars 1–9 should retain the user-confirmed pitch-and-rhythm inventory.');
assert.equal(q2.second.bars[7].notes[3].courtesyAccidental,undefined,'Question 2(c) bar 8 should not print a natural sign before the later G.');
assert.equal(q2.third.bars.length,8);
assert.deepEqual(q2.third.bars.map(item=>item.notes.map(note=>[note.pitch||note.rhythm,note.rhythm])),[
  [['D4','crotchet'],['F4','crotchet'],['G4','minim'],['F4','crotchet']],
  [['E4','minim'],['E4','dottedMinim']],
  [['D4','crotchet'],['F4','crotchet'],['G4','minim'],['F4','crotchet']],
  [['E4','minim'],['E4','minim'],['E4','crotchet']],
  [['F#4','crotchet'],['A4','crotchet'],['B4','minim'],['A4','crotchet']],
  [['G4','crotchet'],['B4','crotchet'],['D5','minim'],['C5','crotchet']],
  [['B4','crotchet'],['D5','crotchet'],['F#5','minim'],['E5','crotchet']],
  [['crotchetRest','crotchetRest'],['F#4','crotchet'],['E4','crotchet'],['F#4','crotchet'],['E4','crotchet']],
],'Question 2(d) bars 10–17 retain the source inventory, including the F-naturals confirmed on 6 November 2026.');
assert.deepEqual(q2.third.bars[1].ties,[[0,1]],'Question 2(d) bar 11 should tie its two E notes.');
assert.equal(q2.third.bars[5].notes[3].courtesyAccidental,'natural','Question 2(d) bar 15 should print the confirmed C-natural.');
assert.deepEqual([q4.enharmonic,q4.finalBarline],[{bar:5,note:3,answer:'A#4'},'double']);
assert.deepEqual(q4.layout,{enharmonicCaption:{placement:"above",lines:["(c) Enharmonic","note"]},height:780,keySignatureXOffset:-25,keySignatureYOffset:10,timeSignatureXOffset:12,fermataYOffset:-20,pickupBarlineX:168,systemEndBarlines:[0,1],keyBox:{x:48,y:12,width:220,height:58,labelY:55,input:{x:122,y:31,width:130,height:27}},cadenceBox:{bar:3,startBeat:2,endBeat:3,y:58,height:165,outerPaddingX:5,inputY:173,inputHeight:28,inset:5},enharmonicBox:{bar:5,note:3,paddingX:25,y:288,height:215,staffTop:445,staffWidth:110,staffLeftExtension:15},harmonicBox:{x:642,y:483,width:238,height:238,input:{x:660,y:662,width:200,height:28}}},'Question 4 should retain the user-confirmed signature, prefix and marking-box geometry.');
assert.deepEqual(q4.pickup.notes.map(item=>[item.pitch,item.rhythm]),[['E4','crotchet']]);
assert.deepEqual(q4.bars.map(item=>item.notes.map(note=>[note.pitch,note.rhythm])),[
  [['E4','crotchet'],['E4','crotchet'],['D#4','crotchet'],['B3','crotchet']],
  [['E4','crotchet'],['F#4','crotchet'],['G4','crotchet'],['G4','crotchet']],
  [['A4','crotchet'],['G4','crotchet'],['F#4','crotchet'],['F#4','crotchet']],
  [['G4','crotchet'],['A4','crotchet'],['B4','crotchet'],['A4','quaver'],['G4','quaver']],
  [['C5','crotchet'],['C5','crotchet'],['B4','crotchet'],['Bb4','quaver'],['A4','quaver']],
  [['A4','minim'],['G4','crotchet'],['G4','crotchet']],
  [['F#4','crotchet'],['E4','crotchet'],['D4','crotchet'],['B3','quaver'],['C4','quaver']],
  [['D4','crotchet'],['D4','crotchet'],['E4','crotchet'],['D4','crotchet']],
  [['C4','minim'],['B3','crotchet'],['B3','crotchet']],
  [['A4','crotchet'],['G4','quaver'],['F#4','quaver'],['F#4','minim']],
  [['E4','dottedMinim']],
],'Question 4 should retain the complete user-confirmed pickup and bars 1-11 inventory.');
assert.deepEqual(q4.bars.map(item=>item.notes.flatMap((note,index)=>note.fermata?[index]:[])),[[],[],[2],[],[],[1],[],[],[1],[],[]],'Question 4 fermatas should anchor to bar 3 beat 3 and the first crotchet in bars 6 and 9.');
assert.equal(q4.bars[8].notes[1].fermataYOffset,-35,'Question 4 bar 9 should retain its additional 35px upward fermata offset.');
assert.equal(q4.bars[10].partial,true);
assert.equal(q5b.answerOption,1);
assert.ok(q5b.options.every(option=>option.length===5&&option.flatMap(item=>item.notes).length===24));
assert.deepEqual(q5b.options[0].map(item=>item.notes.reduce((sum,note)=>sum+note.beats,0)),[.5,2,2,2,2],'Question 5(b) should retain its anacrusis and four complete 2/4 bars.');
assert.deepEqual(q5b.options[0].map(item=>item.width),[.5,2.05,1.85,1.55,1.65],'Question 5(b) bar widths should preserve the source engraving proportions.');
assert.equal(q5b.finalBarline,'single','Question 5(b) should close every option with a single barline.');
assert.deepEqual(q5b.layout,{barWidths:[.5,2.05,1.85,1.55,1.65],viewBox:{x:30,y:0,width:790,height:150},staffTop:53,staffLeft:55,staffRight:800,scoreStart:170,noteXOffset:-10,firstNoteExtraXOffset:-5,voiceX:195},'Question 5(b) should retain its enlarged viewport, centred stave and confirmed horizontal source adjustments.');
assert.notDeepEqual(q5b.options[0],q5b.options[1]);
assert.notDeepEqual(q5b.options[1],q5b.options[2]);
for (const [index,item] of q2.bars.entries()) assert.equal(item.notes.reduce((sum,n)=>sum+(n.beats||0),0),4,`Question 2(a) bar ${index+1} total`);
assert.equal(q2.bars[14].printedBeatException,undefined,'Question 2(a) bar 15 should be a regular four-beat bar.');
for (const item of q2.second.bars) assert.equal(item.notes.reduce((sum,n)=>sum+(n.beats||0),0),5,'Question 2(c) bar total');
for (const item of q2.third.bars) assert.equal(item.notes.reduce((sum,n)=>sum+(n.beats||0),0),5,'Question 2(d) bar total');
for (const item of q4.bars) assert.equal(item.notes.reduce((sum,n)=>sum+(n.beats||0),0),item.partial?3:4,'Question 4 bar total');

assert.equal(parts.get('q6a1').roughWorkSheet,true);
assert.equal(parts.get('q6a2').hideRoughWork,true);
assert.deepEqual([paper.questions[5].introPartLabels,paper.questions[5].introBulletRange,paper.questions[5].introCompactRanges],[{1:'(a)'},[2,3],[[7,8],[9,10]]]);
assert.deepEqual(parts.get('q6a1').roughWorkBullets,['Melody/harmony','Texture/structure/form/timbre']);
assert.deepEqual([parts.get('q6a1').roughWorkHeading,parts.get('q6a1').finalAnswerHeading,parts.get('q6a1').finalAnswerLines],['Rough Work','FINAL ANSWER',9]);
assert.deepEqual([parts.get('q6bi').roughWorkHeading,parts.get('q6bi').roughWorkLines,parts.get('q6bi').finalAnswerHeading,parts.get('q6bi').finalAnswerLines],['ROUGH WORK',18,'FINAL ANSWER',16]);
assert.deepEqual(['q6a1','q6a2','q6bi','q6bii'].map(id=>parts.get(id).endOfPaper),[false,false,false,true]);
assert.equal(parts.get('q6bii').hideFinalHeading,true);
assert.match(paper.questions[5].intro.join(' '),/final answer must be written in the final answer section/);
assert.match(parts.get('q6bi').leadIntro.intro.join(' '),/six similarities\/differences/);
assert.match(parts.get('q6bi').leadIntro.intro.join(' '),/write your final answers in the final answer section/);
assert.equal(paper.questions[1].score,undefined);
assert.deepEqual([parts.get('q2ai').groupStart,parts.get('q2ai').label],[{label:'(a)',prompt:'Listen and follow the guide to the music below.'},'(i)']);
assert.deepEqual([parts.get('q2ci').groupStart,parts.get('q2ci').label],[{label:'(c)',prompt:'Listen to a new excerpt and follow the guide to the music below.'},'(i)']);
assert.deepEqual(parts.get('q2aii').promptParts,{before:'Draw this sign',symbol:'bracket',after:'above the two bars where the bass plays:'});
assert.deepEqual(parts.get('q2aii').options,[{value:'Bracket',label:'Bracket',symbol:'bracket'}]);
assert.deepEqual(parts.get('q2aii').afterAnswerLines,[
  'The music will be played two more times, with 20 seconds between playings and 40 seconds before part (b).',
  'You should write all your answers on the guide to the music above.',
  'Here is the music for the second time.',
  'Here is the music for the third time.',
]);
assert.equal(parts.get('q2ai').inlineScore.sharedNotation,'ah-2018-q2a');
assert.equal(parts.get('q2aii').inlineScore.sharedNotation,'ah-2018-q2bassphrase');
assert.equal(parts.get('q2b').inlineScore.sharedNotation,'ah-2018-q2b');
assert.equal(parts.get('q2ci').inlineScore.sharedNotation,'ah-2018-q2c');
assert.deepEqual(parts.get('q2ci').options.map(item=>item.value),['2/4','3/4','4/4','6/8','9/8','12/8','5/4'],'Question 2(c)(i) should offer all seven requested time signatures.');
assert.equal(parts.get('q2d').inlineScore.sharedNotation,'ah-2018-q2d');
assert.equal(paper.questions[2].layout,'ah2018-boxed-guide','Question 3 should use its source-specific boxed-guide layout.');
assert.deepEqual(paper.questions[2].intro,[
  'This question features instrumental music.',
  'In this excerpt you are required to complete the guide below by inserting appropriate music concepts.',
  'There will now be a pause of 30 seconds to allow you to read through the question.',
  'The music will be played three times with a pause of 20 seconds between playings and a pause of 30 seconds before part (b).',
  'In the first two playings a voice will help guide you through the music. There is no voice in the third playing.',
  'Here is the music for the first time.',
  'Here is the music for the second time.',
  'Here is the music for the third time.',
],'Question 3(a) should retain the complete source-paper playback instructions.');
assert.deepEqual([paper.questions[2].introPartLabel,paper.questions[2].introPartLabelIndex,paper.questions[2].introBoldPhrases,paper.questions[2].introCompactRange],['(a)',1,['three'],[5,7]],'Question 3(a) should preserve its part label, emphasis and grouped playback cues.');
assert.equal(parts.get('q3a1').groupStart,undefined,'Question 3(a) instructions should sit above, not inside, the bordered guide.');
assert.deepEqual(parts.get('q4c').promptLines,['Write the enharmonic equivalent of the boxed note in bar 5.','Write your answer on the stave below bar 5.'],'Question 4(c) should retain the source two-line instruction.');
assert.equal(parts.get('q4c').markAlign,'prompt-end','Question 4(c) mark should align with the second source line.');
assert.equal(parts.get('q4c').inlineNotationControls,true,'Question 4(c) Clear should remain inside the aligned question row.');
assert.deepEqual(parts.get('q4d').afterAnswerLines,[
  'You will now hear the music two more times, with 20 seconds between playings and a pause of 1 minute before the next question begins.',
  'You should write all your answers on the guide to the music above.',
  'Here is the music for the second time.',
  'Here is the music for the third time.',
],'Question 4 replay text should retain the supplied source wording and grouping.');

const hashes = {};
for (const id of ['ah-2018-q2','ah-2018-q4','ah-2018-q5b']) hashes[id]=crypto.createHash('sha256').update(JSON.stringify(notation.getInventory(id))).digest('hex');
assert.deepEqual(hashes, {
  'ah-2018-q2':'36eedb48b9510df12eca2e3542d391f84cd7307c20a367d2e9f107606f9abf45',
  'ah-2018-q4':'e025a3599a7fc983d4abfdb3a1e820aba3a943944413c34806bfd2bb4b24b54f',
  'ah-2018-q5b':'a100d3c9a85b76948680c4705b206140fe9c7ff8c1b666cb97c021aad93cd5a5',
});

const expectedMarkers=[[7.28,267.64,315.08],[6.43,274.07,429.86,609.95],[6.82,433.75,492],[6.68,211.2,288.76],[8.09,239.16,365.77,441.01,515.35],[8.25,58.62,186.86,303.38,431.92,788.21,852.24,980.67,1097.17,1225.69]];
const durations=[368.17,709.825,549.251,408.76,573.205,1943.353];
assert.equal(expectedMarkers.flat().length,28);
paper.questions.forEach((question,index)=>{const clip=question.audio.clips[0];assert.equal(fs.existsSync(path.resolve(__dirname,'..',clip.file)),true);assert.deepEqual(clip.markers.map(marker=>marker.time),expectedMarkers[index]);assert.deepEqual(clip.markers.map(marker=>marker.time),[...clip.markers].map(marker=>marker.time).sort((a,b)=>a-b));assert.ok(clip.markers.every(marker=>marker.time>=0&&marker.time<durations[index]));});

class SvgNode { constructor(name){this.name=name;this.attributes={};this.children=[];this.style={};this.dataset={};this.events={};this.textContent='';} setAttribute(name,value){this.attributes[name]=String(value);} getAttribute(name){return this.attributes[name]||'';} append(...nodes){this.children.push(...nodes);} addEventListener(name,callback){(this.events[name]||=[]).push(callback);} closest(){return null;} contains(){return false;} remove(){} get lastChild(){return this.children.at(-1);} }
const descendants=node=>[node,...node.children.flatMap(descendants)];
const oldDocument=global.document,oldSymbols=global.BRAVURA_SYMBOLS;
global.document={createElementNS:(_,name)=>new SvgNode(name),createElement:name=>new SvgNode(name),activeElement:null};global.BRAVURA_SYMBOLS=new Proxy({},{get:(_,key)=>String(key)});
for (const key of ['q2a','q2bassphrase','q2b','q2c','q2d','q4','q5b']) for (const interactive of [false,true]) { const wrap=new SvgNode('div'); notation.renderSharedScore({innerHTML:'',querySelector:()=>wrap},{score:{sharedNotation:`ah-2018-${key}`,optionIndex:1}},answers,interactive?()=>{}:null,Object.fromEntries([...parts.keys()].map(id=>[id,'incorrect']))); const nodes=descendants(wrap); assert.ok(nodes.some(node=>node.name==='svg')); assert.ok(!nodes.some(node=>Object.values(node.attributes).some(value=>/NaN|undefined|Infinity/.test(value))),`${key} finite render`); if(interactive&&['q2a','q2b','q2c','q4'].includes(key))assert.ok(nodes.some(node=>node.attributes.class==='q3-note-hit-area'&&node.events.keydown?.length),`${key} keyboard note entry`); }
const q5bWrap=new SvgNode('div');notation.renderSharedScore({innerHTML:'',querySelector:()=>q5bWrap},{score:{sharedNotation:'ah-2018-q5b',optionIndex:1}},answers,()=>{},{});const q5bNodes=descendants(q5bWrap),q5bSvg=q5bNodes.find(node=>node.name==='svg'),q5bVoice=q5bNodes.find(node=>node.textContent==='Voice'),q5bNoteheads=q5bNodes.filter(node=>String(node.attributes.class||'').includes('q3-notehead'));assert.equal(q5bSvg?.attributes.viewBox,'30 0 790 150','Question 5(b) should crop the generic score viewport so the notation renders at the established literacy-question scale.');assert.equal(q5bNodes.filter(node=>node.attributes.class==='q3-barline').length,5,'Question 5(b) should show four internal barlines and one closing barline in every option.');assert.equal(q5bNodes.filter(node=>node.attributes.class==='q3-barline'&&node.attributes.x1==='800').length,1,'Question 5(b) should close the stave at its right edge.');assert.deepEqual(q5bNodes.filter(node=>node.attributes.class==='q3-staff-line'&&Number(node.attributes.y1)>=53&&Number(node.attributes.y1)<=97).map(node=>Number(node.attributes.y1)),[53,64,75,86,97],'Question 5(b) stave should be vertically centred with its tick box.');assert.equal(q5bVoice?.attributes.x,'195','Question 5(b) Voice text should move 10px left.');assert.ok(Math.abs(Number(q5bNoteheads[0]?.attributes.x)-176.8790322580645)<.001&&Math.abs(Number(q5bNoteheads[1]?.attributes.x)-193.1027164685908)<.001,'Question 5(b) notes should move 10px left, with the first semiquaver moved 15px left.');
const q2bWrap=new SvgNode('div');notation.renderSharedScore({innerHTML:'',querySelector:()=>q2bWrap},{score:{sharedNotation:'ah-2018-q2b'}},answers,()=>{},{});const q2bNodes=descendants(q2bWrap),q2bSvg=q2bNodes.find(node=>node.name==='svg'),q2bBox=q2bNodes.find(node=>node.attributes.class==='q3-marking-box');assert.equal(q2bSvg?.attributes.viewBox,'0 0 920 535','Question 2(b) score should retain the source aspect ratio.');assert.ok(q2bBox,'Question 2(b) should retain the boxed bass-answer area.');assert.deepEqual([q2bBox.attributes.x,q2bBox.attributes.y,q2bBox.attributes.width,q2bBox.attributes.height],['264','276','471','100'],'Question 2(b) bass-answer box should match the source bars 3–5.');assert.ok(q2bNodes.some(node=>node.textContent==='Vb')&&q2bNodes.some(node=>node.textContent==='IVb')&&q2bNodes.some(node=>node.textContent==='V7'),'Question 2(b) should retain the printed Roman-numeral row.');assert.equal(q2bNodes.filter(node=>node.attributes.class==='q3-marking-box-label ah-2018-q2b-table-label').length,10,'Question 2(b) chord table should use source-sized labels in both rows.');assert.deepEqual([...new Set(q2bNodes.filter(node=>node.attributes.class==='q3-barline'&&node.attributes.y1==='65').map(node=>node.attributes.x1))],['50','270','442','598','735','870'],'Question 2(b) melody barlines should match the source bar widths.');assert.ok(q2bNodes.some(node=>node.attributes.x1==='50'&&node.attributes.y1==='65'&&node.attributes.y2==='344'),'Question 2(b) should connect the melody and piano systems at the left edge.');assert.ok(q2bNodes.some(node=>node.attributes.x1==='116'&&node.attributes.y1==='414'&&node.attributes.y2==='522'),'Question 2(b) chord table should begin beneath the first chord column.');const q2bRightHandSemibreves=q2bNodes.filter(node=>node.textContent==='wholeNote'&&Number(node.attributes.y)>=150&&Number(node.attributes.y)<276);assert.deepEqual(q2bRightHandSemibreves.reduce((counts,node)=>(counts[node.attributes.x]=(counts[node.attributes.x]||0)+1,counts),{}),{'170':2,'295':2,'467':2,'623':2,'639':1,'760':3},'Question 2(b) should keep the right-hand chords aligned except for the bar-5 G shifted 16px right.');const q2bPianoSemibreveXs=[...new Set(q2bNodes.filter(node=>node.textContent==='wholeNote'&&Number(node.attributes.y)>=276&&Number(node.attributes.y)<376).map(node=>node.attributes.x))];assert.deepEqual(q2bPianoSemibreveXs,['170','760','295','467','623'],'Question 2(b) bass semibreves should sit near the start of bars 2–6.');const q2bGuideSemibreveXs=q2bNodes.filter(node=>node.textContent==='wholeNote'&&Number(node.attributes.y)>=376).map(node=>node.attributes.x);assert.deepEqual(q2bGuideSemibreveXs,['295','467','623'],'Question 2(b) rhythm-guide semibreves should align with the piano entries after the 7px right shift.');
const q2cWrap=new SvgNode('div');notation.renderSharedScore({innerHTML:'',querySelector:()=>q2cWrap},{score:{sharedNotation:'ah-2018-q2c'}},answers,()=>{},{});const q2cNodes=descendants(q2cWrap),q2cSvg=q2cNodes.find(node=>node.name==='svg'),q2cBox=q2cNodes.find(node=>node.attributes.class==='q3-marking-box');assert.equal(q2cSvg?.attributes.viewBox,'0 0 920 625','Question 2(c) should retain the supplied source proportions.');assert.deepEqual([q2cBox?.attributes.x,q2cBox?.attributes.y,q2cBox?.attributes.width,q2cBox?.attributes.height],['680','325','128','250'],'Question 2(c) octave box should span the treble and bass staves.');assert.equal(q2cNodes.filter(node=>node.textContent==='repeatRight').length,2,'Question 2(c) should show repeat endings on both staves.');assert.equal(q2cNodes.some(node=>node.textContent==='1'&&node.attributes.class==='q3-bar-number'),false,'Question 2(c) should not print a bar number 1.');assert.ok(q2cNodes.some(node=>node.textContent==='2'&&node.attributes.x==='400')&&q2cNodes.some(node=>node.textContent==='9'&&node.attributes.x==='640'),'Question 2(c) bar numbers should match the supplied source positions.');const octaveEmphasis=q2cNodes.filter(node=>node.attributes.class==='q3-marking-box-label ah-2018-octave-emphasis');assert.deepEqual(octaveEmphasis.map(node=>[node.textContent,node.attributes['font-weight']]),[['One octave','700'],['lower','700']],'Question 2(c) should bold only One octave and lower inside the octave box.');
const q2aWrap=new SvgNode('div');notation.renderSharedScore({innerHTML:'',querySelector:()=>q2aWrap},{score:{sharedNotation:'ah-2018-q2a'}},answers,()=>{},{});const q2aNodes=descendants(q2aWrap),fadeIn=q2aNodes.find(node=>node.textContent==='Fade in'),bar16Fade=q2aNodes.find(node=>node.textContent==='Fade'),notesBox=q2aNodes.find(node=>node.attributes.class==='q3-marking-box'),notesBoxLabel=q2aNodes.find(node=>node.textContent==='(i) Notes and rest(s)');assert.equal(fadeIn?.attributes['font-family'],'Trebuchet MS Local, Trebuchet MS, sans-serif','Question 2(a) should retain the source Fade in marking in Trebuchet MS.');assert.equal(fadeIn?.attributes.x,'70','Question 2(a) Fade in marking should sit above the first treble clef.');assert.equal(fadeIn?.attributes['text-anchor'],'middle','Question 2(a) Fade in marking should be centred over the first treble clef.');assert.equal(bar16Fade?.attributes.class,'ah-2018-source-text ah-2018-bar16-fade','Question 2(a) should retain the Fade marking above the E in bar 16.');assert.equal(bar16Fade?.attributes['text-anchor'],'middle','Question 2(a) bar 16 Fade marking should remain centred above its E note.');assert.equal(notesBox?.attributes.y,'444','Question 2(a) notes-and-rests box should sit 5px higher.');assert.equal(notesBoxLabel?.attributes.y,'464','Question 2(a) notes-and-rests label should move up with its box.');assert.equal(q2aNodes.filter(node=>node.attributes.class==='q3-barline'&&node.attributes.x1==='870').length,5,'Question 2(a) should close every staff system with a barline.');assert.equal(q2aNodes.filter(node=>node.attributes.transform?.includes('scale(0.75 0.75)')).length,8,'Question 2(a) should render all four bar-1 crotchets and four bar-16 quaver noteheads at 75% size.');const acciaccaturas=q2aNodes.filter(node=>node.attributes.class==='q3-music-glyph ah-2018-acciaccatura'),acciaccaturaSharps=q2aNodes.filter(node=>node.attributes.class==='q3-music-glyph ah-2018-acciaccatura-accidental');assert.equal(acciaccaturas.length,2,'Question 2(a) bars 1 and 16 should use stem-up slashed acciaccaturas.');assert.equal(acciaccaturaSharps.filter(node=>node.attributes.transform?.includes('scale(0.55 0.55)')).length,2,'Question 2(a) acciaccatura sharps should be reduced.');acciaccaturaSharps.forEach((sharp,index)=>assert.ok(Math.abs((Number(sharp.attributes.x)-Number(acciaccaturas[index].attributes.x))+17.45)<.001,'Question 2(a) acciaccatura sharps should sit a total of 7px farther left.'));
const q2dWrap=new SvgNode('div');notation.renderSharedScore({innerHTML:'',querySelector:()=>q2dWrap},{score:{sharedNotation:'ah-2018-q2d'}},answers,()=>{},{});const q2dNodes=descendants(q2dWrap),q2dBox=q2dNodes.find(node=>node.attributes.class==='q3-marking-box');assert.ok(q2dNodes.some(node=>node.textContent==='(d) Augmented triad [A]'),'Question 2(d) should retain the source marking box and label around bars 15-16.');assert.deepEqual([q2dBox?.attributes.y,q2dBox?.attributes.height],['147','118'],'Question 2(d) augmented-triad box and label should extend 10px higher.');assert.equal(q2dNodes.filter(node=>node.attributes.class==='q3-barline'&&node.attributes.x1==='870').length,2,'Question 2(d) should close both staff systems with a barline.');
const q4Wrap=new SvgNode('div');
notation.renderSharedScore({innerHTML:'',querySelector:()=>q4Wrap},{score:{sharedNotation:'ah-2018-q4'}},answers,()=>{},{});
const q4Nodes=descendants(q4Wrap);
const q4CadenceBox=q4Nodes.find(node=>node.name==='rect'&&node.attributes.y==='58');
const q4CadenceInput=q4Nodes.find(node=>node.name==='foreignObject'&&node.attributes.y==='173');
const q4EnharmonicBox=q4Nodes.find(node=>node.name==='rect'&&node.attributes.y==='288');
const q4AnswerStaffLines=q4Nodes.filter(node=>node.attributes.class==='q3-staff-line'&&Number(node.attributes.y1)>=445&&Number(node.attributes.y1)<=489&&Math.abs(Number(node.attributes.x2)-Number(node.attributes.x1)-125)<.001);
const q4HarmonicBox=q4Nodes.find(node=>node.name==='rect'&&node.attributes.x==='642'&&node.attributes.y==='483');
const q4HarmonicInput=q4Nodes.find(node=>node.name==='foreignObject'&&node.attributes.x==='660'&&node.attributes.y==='662');
const q4KeyLabel=q4Nodes.find(node=>node.textContent==='(a) Key:');
const q4KeySharps=q4Nodes.filter(node=>node.textContent==='sharp'&&node.attributes.class==='q3-music-glyph q3-key-signature');
const q4Fermatas=q4Nodes.filter(node=>node.textContent==='fermataAbove');
assert.equal(q4KeySharps.length,3,'Question 4 should print the E-minor F-sharp on all three systems.');
assert.ok(q4KeySharps.every(node=>node.attributes.x==='87'),'Question 4 key-signature sharps should retain their final left offset.');
assert.deepEqual(q4KeySharps.map(node=>node.attributes.y),['119','334','549'],'Question 4 key-signature sharps should sit 10px down after Bravura optical calibration.');
assert.equal(q4Nodes.filter(node=>node.textContent==='sharp'&&node.attributes.class!=='q3-music-glyph q3-key-signature'&&Number(node.attributes.y)<300).length,1,'Question 4 melody should print only the chromatic D-sharp outside the key signature.');
assert.equal(q4Nodes.filter(node=>node.textContent==='timeSig4'&&node.attributes.x==='145').length,2,'Question 4 opening time signature should retain its final right adjustment.');
assert.equal(q4KeyLabel?.attributes.y,'55','Question 4 Key label should align with its answer line.');
assert.deepEqual(q4Fermatas.map(node=>Number(Number(node.attributes.y).toFixed(1))),[108.8,318.3,525.8],'Question 4 should retain the 20px global fermata shift and move bar 9 a further 35px upward.');
assert.ok(q4Nodes.some(node=>node.attributes.class==='q3-barline'&&node.attributes.x1==='168'&&node.attributes.y1==='120'),'Question 4 should separate the pickup from bar 1 with a barline.');
assert.deepEqual([q4CadenceBox?.attributes.x,q4CadenceBox?.attributes.width,q4CadenceBox?.attributes.height],['557.875','97.75','165'],'Question 4 cadence box should extend 5px on either side of beats 2 and 3 and another 10px down.');
assert.deepEqual([q4CadenceInput?.attributes.x,q4CadenceInput?.attributes.y,q4CadenceInput?.attributes.width],['567.875','173','77.75'],'Question 4 cadence answer line should sit at its confirmed height and use the wider 5px side inset.');
assert.ok(['120','335'].every(y=>q4Nodes.some(node=>node.attributes.class==='q3-barline'&&node.attributes.x1==='870'&&node.attributes.y1===y)),'Question 4 systems 1 and 2 should finish with single barlines.');
assert.equal(q4EnharmonicBox?.attributes.width,'50','Question 4 enharmonic box should surround only the B-flat.');
assert.equal(q4AnswerStaffLines.length,5,'Question 4 should render a complete five-line answer stave.');
assert.ok(q4AnswerStaffLines.every(node=>Math.abs(Number(node.attributes.x2)-Number(node.attributes.x1)-125)<.001),'Question 4 enharmonic answer stave should extend 15px to the left.');
assert.ok(Math.abs(Number(q4EnharmonicBox.attributes.x)+25+55-Number(q4AnswerStaffLines[0].attributes.x2))<.001,'Question 4 enharmonic answer stave should retain its right edge and answer-note anchor.');
assert.deepEqual([q4HarmonicBox?.attributes.width,q4HarmonicBox?.attributes.height],['238','238'],'Question 4 harmonic-device box should retain its size after moving 10px right and 15px up.');
assert.ok(q4HarmonicInput,'Question 4 harmonic-device answer line should move with its box.');
global.document=oldDocument;global.BRAVURA_SYMBOLS=oldSymbols;
assert.match(fs.readFileSync(path.join(__dirname,'../digitalquestionpapers.html'),'utf8'),/advanced-higher-2018-notation\.js/);
const stylesSource=fs.readFileSync(path.join(__dirname,'../styles.css'),'utf8');
assert.match(stylesSource,/\[data-subquestion="q2aii"\] > \.subquestion-after-answer-lines > :is\(span:nth-child\(2\), span:nth-child\(3\)\)\s*\{[^}]*margin-top:\s*24px;/s,'Question 2(a)(ii) replay text should retain the source-paper paragraph spacing.');
assert.match(stylesSource,/\[data-subquestion="q2aii"\] > \[data-notation-container\]\s*\{[^}]*margin-left:\s*44px;/s,'Question 2(a)(ii) bracket control should align with the replay text above it.');
assert.match(stylesSource,/\[data-subquestion="q2b"\]\s*\{[^}]*padding-left:\s*44px;/s,'Question 2(b) text should share the source-paper body indent.');
assert.match(stylesSource,/\[data-subquestion="q2b"\] > \.subquestion-heading\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto;/s,'Question 2(b) prompt and mark should use the aligned two-column source layout.');
assert.match(stylesSource,/\[data-subquestion="q2b"\] > \.subquestion-heading > \.subquestion-heading-question\s*\{[^}]*max-width:\s*46rem;/s,'Question 2(b) must leave room for the reviewed printed line; exact source breaks are protected by source-line-breaks.test.js.');
assert.match(stylesSource,/\[data-subquestion="q2b"\] > \.subquestion-before-answer-lines\s*\{[^}]*max-width:\s*46rem;[^}]*margin-top:\s*24px;/s,'Question 2(b) follow-up text must fit its reviewed source line without changing paragraph spacing.');
assert.match(stylesSource,/\.ah-2018-q2b-table-label\s*\{[^}]*font-size:\s*20px;[^}]*font-weight:\s*700;/s,'Question 2(b) chord table should retain the source-sized bold labels.');
assert.match(stylesSource,/\[data-subquestion="q2ci"\] > \.shared-notation-panel\s*\{[^}]*position:\s*relative;[^}]*left:\s*-42px;/s,'Question 2(c) notation should be centred in the paper.');
assert.match(stylesSource,/\[data-subquestion="q2ci"\] \.notation-tool-button\s*\{[^}]*width:\s*96px;/s,'Question 2(c)(i) time-signature buttons should fit all seven choices on one line.');
assert.match(stylesSource,/\[data-subquestion="q2ci"\] \.notation-controls-only\s*\{[^}]*margin-top:\s*10px;/s,'Question 2(c)(i) time-signature controls should sit 10px lower.');
assert.match(stylesSource,/\[data-subquestion="q2d"\] > \.shared-notation-panel\s*\{[^}]*position:\s*relative;[^}]*left:\s*-42px;/s,'Question 2(d) notation should be centred in the paper.');
assert.match(stylesSource,/\[data-subquestion="q2d"\] > \.subquestion-heading\s*\{[^}]*width:\s*calc\(100% - 10px\);[^}]*margin-left:\s*10px;[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto;/s,'Question 2(d) instruction should align with the preceding source text.');
assert.match(stylesSource,/\.question-layout-ah2018-boxed-guide \.higher-guide-box \.sentence-answer\s*\{[^}]*grid-template-columns:\s*580px auto;/s,'Question 3(a) should use the source-length answer rules.');
assert.match(stylesSource,/\.question-layout-ah2018-literacy\.question-q4 \[data-subquestion="q4d"\] > \.subquestion-after-answer-lines\s*\{[^}]*margin-top:\s*26px;[^}]*margin-left:\s*-50px;/s,'Question 4 replay text should return to the source paper margin.');
assert.match(stylesSource,/\.question-layout-ah2018-literacy\.question-q4 \[data-subquestion="q4d"\] > \.subquestion-after-answer-lines > :is\(span:nth-child\(2\), span:nth-child\(3\)\)\s*\{[^}]*margin-top:\s*28px;/s,'Question 4 replay paragraphs should retain the supplied source spacing.');
assert.match(stylesSource,/\.question-layout-ah2018-literacy\.question-q4 \[data-subquestion="q4c"\] \.subquestion-heading-question\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) max-content;/s,'Question 4(c) Clear should align with the other question-row Clear controls.');
assert.match(stylesSource,/\.question-layout-ah2018-q5 \[data-subquestion="q5b"\] \.answer-option\s*\{[^}]*width:\s*100%;[^}]*grid-template-columns:\s*48px minmax\(0, 1fr\);[^}]*align-items:\s*center;/s,'Question 5(b) staves should use the available row width and remain centred beside the tick boxes.');
const notationSource=fs.readFileSync(path.join(__dirname,'../exam-notation.js'),'utf8');
assert.match(notationSource,/requestedKey==="q2d"[\s\S]*?keySignatureXOffset:-10,keySignatureYOffset:10[\s\S]*?offset:9,endBarline:true/s,'Question 2(d) key signatures should sit 10px left and lower, with both systems closed by barlines.');
assert.match(notationSource,/repeatRight",repeatX,q3YForStep\(4,layout\.systemTops\[2\]\)\+10[\s\S]*?repeatRight",repeatX,q3YForStep\(4,bass\.top\)\+10/s,'Question 2(c) repeat signs should align vertically with both staves.');
assert.match(notationSource,/box=layout\.answerBox,repeatX=864;/,'Question 2(c) repeat signs should sit 2px farther right.');
assert.match(notationSource,/answers\.q2ci\)q3DrawTimeSignature\([\s\S]*?,0,130\);/s,'Question 2(c) placed time signature should sit 18px farther right.');
console.log('Advanced Higher 2018 source, marking, audio and notation tests passed.');
