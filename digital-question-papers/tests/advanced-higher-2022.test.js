const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const paper = require('../papers/advanced-higher-2022.js');
const notation = require('../exam-notation.js');
const marking = require('../exam-marking.js');
const registry = require('../paper-registry.js');
const { answerComplete, createAttempt } = require('../exam-engine.js');

const parts = new Map(paper.questions.flatMap(question => question.subquestions).map(part => [part.id, part]));
const mark = (id, value) => marking.markSubquestion(parts.get(id), value).marks;
for (const reason of ['frequent key changes', '7th chords', 'added 6ths', 'time changes', 'syncopation', 'accents', 'wide leaping notes', 'angular melodic lines']) {
  assert.equal(mark('q6bii', { final: `Excerpt 1 is modern because it uses ${reason}.` }), 1, `Excerpt 1 should accept the source justification: ${reason}.`);
}
for (const reason of ['added chords', 'discords', 'time changes', 'riffs', 'ostinato', 'synthesizer', 'reggae']) {
  assert.equal(mark('q6bii', { final: `Excerpt 2 is modern because it uses ${reason}.` }), 1, `Excerpt 2 should accept the source justification: ${reason}.`);
}
assert.equal(registry[paper.id].levelCode, 'AH');
assert.equal(paper.estimatedMinutes, 75);
assert.deepEqual(paper.questions.map(question => question.marks), [5,5,7,5,8,10]);
assert.equal([...parts.values()].reduce((sum, part) => sum + part.marks, 0), 40);
assert.equal(fs.existsSync(path.resolve(__dirname, '..', paper.sourcePath)), true);
assert.equal(fs.existsSync(path.resolve(__dirname, '..', paper.markingInstructionsPath)), true);
assert.equal(parts.get('q1a').afterAnswerLinesBeforePrompt, 1);
assert.equal(parts.get('q1b').afterAnswerLinesBeforeAnswer, 3);

const answers = {
  q1a:'Antiphonal\nPedal\nSemitone\nTriplets',q1b:'Turn',
  q2ai:'G/B, Am',q2aii:'A3,C4,D4',q2bi:'Perfect 4th',q2bii:'flat@3',q2c:'Plagal cadence',
  q3a:'Passacaglia',q3b1:'Viola',q3b2:'Answer',q3b3:'Contrapuntal',q3b4:'Sequence',q3c:'Augmentation',q3d:'Tierce de Picardie',
  q4ai:'12/8',q4aii:'G7',q4bi:'B-flat major',q4bii:'bar-4-8va',q4biii:'F3,C3',
  q5ai:'Ab5',q5aii:'G4,A4,F4',q5b:'Recorder consort',q5c:'Acciaccatura\nClassical\nContrary motion\nDominant 7th',q5d:'Impressionist',
  q6a1:{final:'Added 6ths\nSequence\nHomophonic\nTimpani'},
  q6a2:{final:'Glissando\nPedal\nBacking vocals\nSyncopation'},
  q6bi:{final:'Both excerpts use added 6ths. Both excerpts are homophonic. Both excerpts use syncopation. Both excerpts feature brass. Excerpt 1 uses an organ whereas Excerpt 2 uses a piano. Excerpt 1 uses a snare drum whereas Excerpt 2 uses a drum kit.'},
  q6bii:{final:'Excerpt 1 is modern because it uses time changes and accents. Excerpt 2 is popular because it uses a rock band and backing vocals.'},
};
for (const [id,value] of Object.entries(answers)) assert.equal(mark(id,value),parts.get(id).marks,id);
assert.equal(marking.markPaper(paper,answers).score,40);

assert.equal(mark('q1a','Antiphonal\nPedal\nSemitone\nHemiola'),3);
assert.equal(mark('q1a','Antiphonal\nPedal\nSemitone\nTriplets\nTone row'),3);
assert.equal(mark('q1b','Trill'),0);
assert.equal(mark('q2ai','Vb and VIa'),1); assert.equal(mark('q2ai','G and Am'),0);
assert.equal(mark('q2aii','D4,G4,A4'),0); assert.equal(mark('q2bi','4'),1);
assert.equal(mark('q2bii','sharp@3'),0); assert.equal(mark('q2c','IV-I'),1); assert.equal(mark('q2c','F to C'),1);
assert.equal(mark('q3a','Passacaglia'),1); assert.equal(mark('q3a','Galliard'),0);
assert.equal(mark('q3b3','Polyphonic'),1); assert.equal(mark('q3b4','Descending sequence'),1); assert.equal(mark('q3b4','Contrary motion'),1);
assert.equal(mark('q3c','Diminution'),0); assert.equal(mark('q3d','Picardy third'),1);
assert.equal(mark('q4ai','12/8'),1); assert.equal(mark('q4ai','4/4'),0);
assert.equal(mark('q4aii','Dominant 7th'),1); assert.equal(mark('q4aii','V7'),1); assert.equal(mark('q4aii','G'),0);
assert.equal(mark('q4bi','Bb'),1); assert.equal(mark('q4bii','bar-4-8ve'),1); assert.equal(mark('q4bii','bar-3-8va'),0);
assert.deepEqual(parts.get('q4ai').options.map(option=>option.value),['2/4','3/4','4/4','5/4','6/8','9/8','12/8']);
assert.equal(mark('q4bii','bar-4-8vb'),0); assert.equal(mark('q4bii','bar-4-D.C.'),0); assert.equal(mark('q4bii','bar-4-D.S.'),0);
assert.deepEqual(parts.get('q4bii').options.map(option=>option.value),['8va','8vb','D.C.','D.S.']);
assert.equal(mark('q4biii','F2,C4'),1); assert.equal(mark('q4biii','F2,D4'),0);
assert.equal(mark('q5ai','A♭5'),1); assert.equal(mark('q5ai','G#5'),0); assert.equal(mark('q5aii','G4,A4,F4'),1);
assert.equal(mark('q5b','Whole consort'),1); assert.equal(mark('q5b','Recorders'),0);
assert.equal(mark('q5d','Impressionism'),1); assert.equal(mark('q5d','Sonata'),1);
assert.equal(mark('q6a1',{final:'Dominant 7th\nSequence\nChoir\nDrums'}),0);
assert.equal(mark('q6a2',{final:'Modulation\nPedal\nTuned percussion\nHomophonic'}),0);
assert.equal(mark('q6bii',{final:'Excerpt 1 is modern. Excerpt 2 is popular.'}),1);
assert.equal(mark('q6bii',{final:'Excerpt 1 is Baroque because it uses an organ. Excerpt 2 is popular because it uses a rock band.'}),1);

assert.equal(answerComplete(parts.get('q2aii'),'D4,G4,_'),false);
assert.equal(answerComplete(parts.get('q2aii'),answers.q2aii),true);
assert.equal(answerComplete(parts.get('q4biii'),'F3,'),false);
assert.equal(answerComplete(parts.get('q5aii'),answers.q5aii),true);
assert.equal(createAttempt(paper,'exam',true).timer.remainingSeconds,4500);

const q2 = notation.getInventory('ah-2022-q2');
const q2a = notation.getInventory('ah-2022-q2a');
const q2b = notation.getInventory('ah-2022-q2b');
const q4 = notation.getInventory('ah-2022-q4');
const q4aScore = notation.getInventory('ah-2022-q4a');
const q4bScore = notation.getInventory('ah-2022-q4b');
const q5 = notation.getInventory('ah-2022-q5');
assert.deepEqual([q2.chords,q2.bassClef,q2.interval,q2.accidental,q2.finalBarline],[
  {bars:[1,2],answers:['G first inversion','A minor']},{bar:3,source:['A3','C4','D4'],answer:['A3','C4','D4']},
  {bar:1,answer:'Perfect 4th'},{bar:3,note:3,answer:'flat'},'double',
]);
assert.deepEqual([q2a.chords,q2a.bassClef,q2b.interval,q2b.accidental],[
  {bars:[1,2],answers:['G first inversion','A minor']},{bar:3,source:['A3','C4','D4'],answer:['A3','C4','D4']},
  {bar:1,answer:'Perfect 4th'},{bar:3,note:3,answer:'flat'},
]);
assert.deepEqual([q4.a.timeSignature,q4.a.timeSignatureBar,q4.a.chord,q4.b.key,q4.b.octaveSign,q4.b.bass,q4.finalBarline],[
  '12/8',0,{bar:7,answer:'G7'},'Bb major',{bar:4,answer:'8va'},{bars:[13,14],answer:['F3','C3'],rhythm:'dottedCrotchet'},'single',
]);
assert.equal(q4aScore.a.bars.length,9);
assert.equal(q4bScore.b.bars.length,14);
assert.deepEqual(q4bScore.b,require("./fixtures/ah2022-q4b-inventory.json"));
assert.deepEqual(q4bScore.b.bars[12].lower.notes.slice(1).map(note => [note.pitch,note.rhythm]),[['G3','quaver'],['G3','minim']]);
assert.deepEqual(q4bScore.b.bars[13].lower.notes.slice(1).map(note => [note.pitch,note.rhythm]),[['F3','quaver'],['F3','minim']]);
assert.deepEqual(q5,require("./fixtures/ah2022-q5-inventory.json"));
assert.deepEqual([q5.enharmonic,q5.missing,q5.finalBarline],[
  {bar:5,source:'G#5',answer:'Ab5'},{bar:8,indices:[6,7,8],answer:['G4','A4','F4'],rhythm:'tripletQuaver'},'double',
]);
const signature = bar => bar.notes.map(item => item.rest ? `rest:${item.rhythm}` : `${item.pitch}:${item.rhythm}`).join('|');
assert.deepEqual(q2.bBars.map(signature),[
  'rest:dottedCrotchetRest|rest:quaverRest|C5:semiquaver|B4:semiquaver|C5:quaver|G4:dottedMinim',
  'rest:crotchetRest|rest:semiquaverRest|C4:semiquaver|E4:semiquaver|D4:semiquaver|C4:quaver|E4:quaver|C4:dottedMinim',
  'rest:crotchetRest|C4:semiquaver|C4:semiquaver|Eb4:quaver|D4:crotchet|D4:crotchet|D4:quaver|G4:crotchet|A4:quaver',
  'A4:quaver|G4:crotchet|G4:dottedCrotchet|rest:dottedCrotchetRest|rest:dottedCrotchetRest',
]);
assert.deepEqual(q2.bBars.map(item=>item.lyrics),['Sat - ur - day sun,','came ear - ly one mor - ning,','in a sky_____ so clear and','blue._____']);
q2b.bBars.forEach(item=>assert.equal(item.lyricSyllables.length,item.notes.length,'Syllables retain their exact note indices.'));
assert.deepEqual(q2b.bBars.map(item=>item.beamGroups),[[{start:2,end:4}],[{start:3,end:6}],[{start:1,end:2}],[]]);
assert.equal(q2b.bBars[1].finalBarline,'single','Question 2(b) closes bar 2 at the end of the first system.');
assert.deepEqual(q2.bBars[2].ties,[[4,5]]);
assert.deepEqual(q2.bBars[3].ties,[[1,2]]);
assert.equal(q4.a.bars.length,9);
assert.equal(q4.b.bars.length,14);
assert.deepEqual([0,1,4,7,8].map(index=>signature(q4.a.bars[index].upper)),[
  'C5:dottedMinim|C5:dottedMinim',
  'C5:dottedMinim|C5:dottedMinim',
  'C6:crotchet|rest:quaverRest|C6:crotchet|rest:quaverRest|C6:crotchet|rest:quaverRest|C6:crotchet|rest:quaverRest',
  'D#4:quaver|E4:quaver|G4:quaver|C4:crotchet|C4:quaver|C4:crotchet|C4:quaver|E4:quaver|G4:quaver|A4:quaver',
  'D#4:quaver|E4:quaver|G4:quaver|C4:crotchet|C4:quaver|C4:dottedMinim',
]);
assert.deepEqual([0,6,7,11,13].map(index=>signature(q4.b.bars[index].upper||q4.b.bars[index])),[
  'D4:quaver|Eb4:quaver|E4:quaver|F4:quaver|F4:quaver|G4:quaver|F4:crotchet',
  'Eb4:quaver|D4:quaver|Eb4:quaver|C4:quaver|C4:minim',
  'A3:quaver|Bb3:quaver|B3:quaver|C4:quaver|C4:crotchet|rest:crotchetRest',
  'C5:quaver|G4:quaver|Bb4:quaver|C#5:quaver|C#5:quaver|Bb4:quaver|C5:quaver|C#5:quaver',
  'Eb4:quaver|E4:quaver|G4:quaver|Db5:quaver|Db5:quaver|C5:quaver|A4:quaver|F4:quaver',
]);
assert.deepEqual(q4.b.bars[13].lower.notes.map(item=>[item.pitch,item.rhythm,item.missing||false]),[['C3','dottedCrotchet',true],['F3','quaver',false],['F3','minim',false]]);
assert.deepEqual(q5.bars.slice(0,4).map(signature),[
  'rest:crotchetRest|E5:dottedCrotchet|A5:quaver',
  'D5:crotchet|G#5:crotchet|B5:crotchet',
  'E5:crotchet|A5:crotchet|C6:crotchet',
  'C6:crotchet|B5:crotchet|A5:tripletQuaver|G#5:tripletQuaver|A5:tripletQuaver',
]);
assert.equal(q5.bars[2].notes[2].tieToNextBar,true);
assert.equal(q5.bars[3].notes[0].tiedFromPreviousBar,true);
const total = item => item.notes.reduce((sum,note)=>sum+(note.beats||0),0);
assert.deepEqual(q2a.aBars.map(item=>signature(item.upper)),[
 'E4:dottedCrotchet|G4:quaver|E4:crotchet|D4:crotchet|G3:dottedSemiquaver|G3:demisemiquaver|D4:quaver|E4:quaver|D4:quaver',
 'E4:dottedCrotchet|E4:crotchet|E4:quaver|C4:crotchet|G3:dottedSemiquaver|G3:demisemiquaver|E4:quaver|D4:quaver|C4:quaver',
 'Eb4:dottedCrotchet|C4:quaver|Eb4:quaver|C4:quaver|D4:crotchet|G3:dottedSemiquaver|G3:demisemiquaver|A3:quaver|C4:quaver|D4:quaver',
 'E4:quaver|G4:quaver|E4:quaver|C4:quaver|G3:quaver|G3:quaver|A3:quaver|B3:quaver|G3:quaver|rest:dottedCrotchetRest',
]);
assert.equal(signature(q2a.pickup.upper),'rest:quaverRest|rest:quaverRest|G3:dottedSemiquaver|G3:demisemiquaver|A3:quaver|C4:quaver|D4:quaver');
assert.equal(total(q2a.pickup.upper),3);assert.equal(total(q2a.pickup.lower),3);
assert.deepEqual(q2a.aBars.slice(0,2).map(item=>signature(item.lower)),[
 'C3:dottedCrotchet|C3:quaver|C3:crotchet|B2:dottedCrotchet|B2:dottedCrotchet',
 'A2:dottedCrotchet|A2:quaver|A2:crotchet|G2:dottedCrotchet|G2:dottedCrotchet',
]);
assert.deepEqual(q2a.aBars.slice(0,2).map(item=>signature(item.bassUpper)),['C4:dottedMinim|G3:dottedMinim','C4:dottedMinim|G3:dottedMinim']);
assert.deepEqual(q2a.aBars[1].bassUpper.notes.map(item=>item.chord),[['E3','C4'],['E3','G3']]);
q2a.aBars.slice(0,2).forEach(item=>{assert.equal(total(item.bassUpper),6);assert.deepEqual(item.lower.ties,[[0,1]]);});
assert.deepEqual(q2a.aBars[2].upper.boxedIndices,[7,8,9]);assert.equal(q2a.finalBarline,'double');
assert.equal(mark('q2aii','A3,C4,D4'),1);assert.equal(mark('q2aii','D4,G4,B4'),0);
q2.aBars.forEach((item,index)=>{assert.equal(total(item.upper),6,`Question 2(a) upper bar ${index+1}`);assert.equal(total(item.lower),6,`Question 2(a) lower bar ${index+1}`);});
q2.bBars.forEach((item,index)=>assert.equal(total(item),6,`Question 2(b) bar ${index+1}`));
assert.deepEqual(q4aScore.a,require('./fixtures/ah2022-q4a-inventory.json'));
assert.equal(total(q4.a.pickup.upper),2);assert.equal(total(q4.a.pickup.lower),2);
assert.deepEqual(q4.a.bars[6].chord.noteIndices,[0]);
assert.equal(q4.a.bars[8].finalBarline,'single');
q4.a.bars.slice(0,2).forEach(item=>assert.equal(total(item.innerVoice),6));
q4.a.bars.forEach((item,index)=>{assert.equal(total(item.upper),6,`Question 4(a) upper bar ${index+1}`);assert.equal(total(item.lower),6,`Question 4(a) lower bar ${index+1}`);});
q4.b.bars.forEach((item,index)=>{if(item.upper){assert.equal(total(item.upper),4,`Question 4(b) upper bar ${index+1}`);assert.equal(total(item.lower),4,`Question 4(b) lower bar ${index+1}`);}else assert.equal(total(item),4,`Question 4(b) bar ${index+1}`);});
q5.bars.forEach((item,index)=>assert.ok(Math.abs(total(item)-3)<1e-8,`Question 5 bar ${index+1}`));

const hashes = {};
for (const id of ['ah-2022-q2','ah-2022-q4','ah-2022-q5']) hashes[id]=crypto.createHash('sha256').update(JSON.stringify(notation.getInventory(id))).digest('hex');
assert.deepEqual(hashes, {
  'ah-2022-q2':'7dc5fb887a64928f50ff629b84ece7717eb8e56fe540e216a27053a00308f7f0',
  'ah-2022-q4':'0607425fc29500d8e464967ba14b637079d104035ecbe92bf924bd5da9a0e9c9',
  'ah-2022-q5':'69355a32e048dcb715690fd731368881e301f33c7a7c794e04e9dc6e1cad34fb',
});

assert.equal(Array.isArray(paper.questions[5].intro),true);
assert.match(paper.questions[5].intro.join(' '),/at least two prominent concepts/);
assert.deepEqual(parts.get('q6a1').roughWorkColumns,['Excerpt 1','Excerpt 2']);
assert.equal(parts.get('q6a2').hideRoughWork,true);
assert.equal(parts.get('q6a1').endOfPaper,false);
assert.equal(parts.get('q6a2').endOfPaper,false);
assert.equal(parts.get('q6bi').endOfPaper,false);
assert.equal(parts.get('q6bi').roughWorkLines,18);
assert.equal(parts.get('q6bii').hideRoughWork,true);
assert.equal(parts.get('q6bii').endOfPaper,false);
assert.match(parts.get('q6bi').finalAnswerIntro.join(' '),/written description/);
assert.match(parts.get('q3c').prompt,/third entry of the subject has been altered/);
assert.match(parts.get('q3a').prompt,/tick \(✓\) one box/);
assert.equal(paper.questions[2].guideBoxStartIndex,1);
assert.equal(paper.questions[2].guideBoxSubquestions,4);
assert.equal(paper.questions[2].guideIntro.lines.length,6);
assert.equal(parts.get('q3c').afterAnswerLinesBeforeAnswer,3);
assert.equal(parts.get('q2aii').prompt.replace(/\s+/g,' '),'Re-write the three boxed notes in bar 3 at the same pitch. Write your answer on the stave below bar 3.');
assert.equal(parts.get('q2aii').afterAnswerLines.length,4);
assert.match(parts.get('q2bii').afterAnswerLines[0],/^You will now hear the music two more times/);
assert.equal(parts.get('q2c').afterAnswerLinesBeforeAnswer,3);
assert.match(parts.get('q4biii').prompt,/chord information printed below the stave/);
assert.deepEqual(parts.get('q4aii').beforeAnswerLines,['The music is in the key of C major.']);
assert.match(parts.get('q4aii').afterAnswerLines[0],/^You will now hear the music two more times/);
assert.match(parts.get('q4aii').afterAnswerLines[1],/above/);
assert.match(parts.get('q4bi').groupStart.prompt,/printed below/);
assert.equal(parts.get('q4biii').afterAnswerLinesBeforeAnswer,4);
assert.match(parts.get('q4biii').afterAnswerLines[1],/below/);
assert.match(parts.get('q5aii').afterAnswerLines[0],/^You will now hear the music two more times/);
assert.match(parts.get('q5ai').groupStart.prompt,/follow the guide/);
assert.equal(parts.get('q5ai').inlineScore.sharedNotation,'ah-2022-q5');
assert.equal(parts.get('q5ai').scoreBeforePrompt,true);
assert.equal(parts.get('q5c').afterAnswerLinesBeforePrompt,1);
assert.match(parts.get('q5c').afterAnswerLines[0],/^The music will be played twice with 10 seconds/);
assert.deepEqual(parts.get('q5d').promptLines,['Listen to a new excerpt.','Identify the style of the music.']);
assert.equal(paper.questions[5].introPartLabels[1],'(a)');
assert.match(parts.get('q6a1').roughWorkIntro,/two prominent concepts/);
assert.deepEqual(parts.get('q6a1').roughWorkBullets,['Melody/harmony','Rhythm/texture/structure/form/timbre']);
assert.equal(parts.get('q2ai').inlineScore.sharedNotation,'ah-2022-q2a');
assert.equal(parts.get('q2bi').inlineScore.sharedNotation,'ah-2022-q2b');
assert.equal(parts.get('q4ai').inlineScore.sharedNotation,'ah-2022-q4a');
assert.equal(parts.get('q4ai').scoreBeforePrompt,true);
assert.equal(parts.get('q4biii').inlineScore.sharedNotation,'ah-2022-q4b');

const expectedMarkers=[[5.24,190.2],[4.04,214.72,422.62],[5.1,62.88,330.55,396.2],[5.06,225.12],[6.41,227.65,276.93,518.32],[6.55,53.87,187.03,303.59,436.38,792.78,857.05,989.56,1108.96,1242.06]];
const durations=[262.316,525.351,444.987,559.926,574.438,1960.298];
assert.equal(expectedMarkers.flat().length,25);
paper.questions.forEach((question,index)=>{const clip=question.audio.clips[0];assert.equal(fs.existsSync(path.resolve(__dirname,'..',clip.file)),true);assert.deepEqual(clip.markers.map(marker=>marker.time),expectedMarkers[index]);assert.deepEqual(clip.markers.map(marker=>marker.time),[...clip.markers].map(marker=>marker.time).sort((a,b)=>a-b));assert.ok(clip.markers.every(marker=>marker.time>=0&&marker.time<durations[index]));});

class SvgNode { constructor(name){this.name=name;this.attributes={};this.children=[];this.style={};this.dataset={};this.events={};this.textContent='';} setAttribute(name,value){this.attributes[name]=String(value);} getAttribute(name){return this.attributes[name]||'';} append(...nodes){this.children.push(...nodes);} addEventListener(name,callback){(this.events[name]||=[]).push(callback);} closest(){return null;} contains(){return false;} remove(){} get lastChild(){return this.children.at(-1);} }
const descendants=node=>[node,...node.children.flatMap(descendants)];
const oldDocument=global.document,oldSymbols=global.BRAVURA_SYMBOLS;
global.document={createElementNS:(_,name)=>new SvgNode(name),createElement:name=>new SvgNode(name),activeElement:null};global.BRAVURA_SYMBOLS=new Proxy({},{get:(_,key)=>String(key)});
for (const key of ['q2','q2a','q2b','q4','q4a','q4b','q5']) for (const interactive of [false,true]) { const wrap=new SvgNode('div'); notation.renderSharedScore({innerHTML:'',querySelector:()=>wrap},{score:{sharedNotation:`ah-2022-${key}`}},answers,interactive?()=>{}:null,Object.fromEntries([...parts.keys()].map(id=>[id,'incorrect']))); const nodes=descendants(wrap); assert.ok(nodes.some(node=>node.name==='svg')); assert.ok(!nodes.some(node=>Object.values(node.attributes).some(value=>/NaN|undefined|Infinity/.test(value))),`${key} finite render`); if(interactive&&['q2','q2a','q4','q4b','q5'].includes(key))assert.ok(nodes.some(node=>node.attributes.class==='q3-note-hit-area'&&node.events.keydown?.length),`${key} keyboard note entry`); }
for (const [sign,hasLine] of [['8va',true],['8vb',true],['D.C.',false],['D.S.',false]]) {
  const wrap=new SvgNode('div');
  notation.renderSharedScore({innerHTML:'',querySelector:()=>wrap},{score:{sharedNotation:'ah-2022-q4b'}},{q4bii:`bar-4-${sign}`},null,{});
  assert.equal(descendants(wrap).some(node=>node.attributes.class==='q3-entered-answer-stroke'&&node.attributes['stroke-dasharray']==='5 5'),hasLine,`${sign} continuation line`);
}
const chordStemWrap=new SvgNode('div');
notation.renderSharedScore({innerHTML:'',querySelector:()=>chordStemWrap},{score:{sharedNotation:'ah-2022-q2a'}},answers,null,{});
const chordStems=descendants(chordStemWrap).filter(node=>node.attributes.class==='q3-stem-calibrated q3-chord-stem');
assert.equal(chordStems.length,2,'Both dotted-minim bass chords have a connected stem.');
assert.deepEqual(chordStems.map(node=>[Number(node.attributes.y1),Number(node.attributes.y2)]),[[246,218.5],[246,235]],'Both E3 heads connect upward to C4 and G3.');
const songWrap=new SvgNode('div');
notation.renderSharedScore({innerHTML:'',querySelector:()=>songWrap},{score:{sharedNotation:'ah-2022-q2b'}},{},null,{});
const songNodes=descendants(songWrap),songBoxes=songNodes.filter(node=>node.attributes.class==='q3-marking-box');
assert.deepEqual(songBoxes.map(node=>['x','y','width','height'].map(key=>Number(node.attributes[key]))),[[292,31,128,175],[99,293,237,175]],'The interval and accidental boxes enclose only their printed notes.');
assert.equal(songNodes.filter(node=>node.attributes.class==='q3-answer-line q3-lyric-extension').length,2);
assert.equal(songNodes.filter(node=>String(node.attributes.class||'').includes('q3-final-barline')).length,1);
assert.equal(songNodes.find(node=>node.textContent==='Fade in').attributes['font-style'],'italic');
assert.equal(q2b.finalBarline,'double');
global.document=oldDocument;global.BRAVURA_SYMBOLS=oldSymbols;
assert.match(fs.readFileSync(path.join(__dirname,'../digitalquestionpapers.html'),'utf8'),/advanced-higher-2022-notation\.js/);
console.log('Advanced Higher 2022 source, marking, audio and notation tests passed.');

for (const id of ["q2aii", "q2bii"]) {
  const part = paper.questions.flatMap(q => q.subquestions).find(s => s.id === id);
  assert.ok(part.afterAnswerLines.includes("You should write your answers on the guide to the music above."), "AH 2022 Q2 retains the exact printed guide-writing instruction");
}
