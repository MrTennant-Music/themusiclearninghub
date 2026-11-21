const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const paper = require('../papers/advanced-higher-2024.js');
const notation = require('../exam-notation.js');
const marking = require('../exam-marking.js');
const registry = require('../paper-registry.js');
const { answerComplete, createAttempt } = require('../exam-engine.js');

const parts = new Map(paper.questions.flatMap(question => question.subquestions).map(part => [part.id, part]));
const mark = (id, value) => marking.markSubquestion(parts.get(id), value).marks;
for (const chord of ['G Maj/B', 'G Maj 1st Inv', 'I 1st Inv', '1 first inversion']) {
  assert.equal(mark('q2b', `${chord}, C, D`), 1, 'All printed first-inversion chord alternatives should be accepted.');
}
for (const reason of ['ornamentation', 'diatonic harmony', 'tonic and dominant', 'clear cadence points']) {
  assert.equal(mark('q6bii', { final: `Excerpt 1 is Baroque because it uses ${reason}.` }), 1);
}
for (const reason of ['a wide dynamic range', 'accents', 'sfz', 'tambourine']) {
  assert.equal(mark('q6bii', { final: `Excerpt 2 is Romantic because it uses ${reason}.` }), 1);
}
assert.equal(registry[paper.id].levelCode, 'AH');
assert.equal(paper.estimatedMinutes, 75);
assert.deepEqual(paper.questions.map(question => question.marks), [6,5,7,4,8,10]);
assert.equal([...parts.values()].reduce((sum, part) => sum + part.marks, 0), 40);
assert.equal(fs.existsSync(path.resolve(__dirname, '..', paper.sourcePath)), true);
assert.equal(fs.existsSync(path.resolve(__dirname, '..', paper.markingInstructionsPath)), true);
assert.equal(parts.get('q1a').afterAnswerLinesBeforePrompt,1);
assert.equal(parts.get('q1b').afterAnswerLinesBeforeAnswer,3);
assert.match(parts.get('q1c').prompt,/Tick \(✓\) one box/);
assert.match(parts.get('q3a').prompt,/tick \(✓\) one box/);
assert.equal(parts.get('q3b').afterAnswerLinesBeforeAnswer,3);
assert.equal(parts.get('q5a').afterAnswerLinesBeforePrompt,1);
assert.equal(parts.get('q5b').afterAnswerLinesBeforeAnswer,3);
assert.equal(parts.get('q5c').afterAnswerLinesBeforeAnswer,2);
assert.match(parts.get('q5d').prompt,/Tick \(✓\) one box/);
assert.deepEqual(parts.get('q5d').options[0].flowParts,['Piano|and|Double bass','Percussion|and|Saxophone','Horn']);
assert.match(parts.get('q5e').prompt,/tick \(✓\) one box/);
assert.match(parts.get('q5e').beforeAnswerLines[1],/read though the possible answers/);

const answers = {
  q1a:'Antiphonal\nCon sordino\nTriplets\nTritone',q1b:'Augmentation',q1c:'2',
  q2ai:'Imperfect cadence',q2aii:'bar-1-M',q2b:'G/B, C, D',q2ci:'E minor',q2cii:'sharp@1',
  q3a:'Polytonality',q3b:'Diminution',q3c1:'Acciaccatura',q3c2:'Chromatic scale',q3c3:'Interrupted cadence',q3c4:'Diminished triad',q3d:'EDM',
  q4ai:'Db4',q4aii:'Diminished 5th',q4bi:'C5,Bb4,A4',q4bii:'Eb3,Bb2,Bb2',
  q5a:'Appoggiatura\nClassical\nDominant 7th\nPerfect cadence',q5b:'Turn',q5c:'Irregular time signatures',q5d:'1',q5e:'3',
  q6a1:{final:'Dominant 7th\nSequence\nConcerto grosso\nHemiola'},
  q6a2:{final:'Chromatic scale\nWhole-tone scale\nSyncopation\nTriplets'},
  q6bi:{final:'Both excerpts use antiphonal writing. Both excerpts use octave leaps. Both excerpts end with a perfect cadence. Both excerpts contain sequences. Both excerpts use simple time. Excerpt 1 is a concerto grosso whereas Excerpt 2 is a symphony.'},
  q6bii:{final:'Excerpt 1 is Baroque because it is a concerto grosso with a concertino and ripieno. Excerpt 2 is Romantic because it uses a large orchestra and chromatic harmony.'},
};
for (const [id,value] of Object.entries(answers)) assert.equal(mark(id,value),parts.get(id).marks,id);
assert.equal(marking.markPaper(paper,answers).score,40);

assert.equal(mark('q1a','Antiphonal\nCon sordino\nTriplets\nSerial'),3);
assert.equal(mark('q1b','Diminution'),0); assert.equal(mark('q1c','1'),0);
for (const bar of [1,3,4,11]) assert.equal(mark('q2aii',`bar-${bar}-M`),1);
assert.equal(mark('q2aii','bar-2-M'),0); assert.equal(mark('q2b','Ib / IV / V'),1); assert.equal(mark('q2b','G / C / D'),0);
assert.equal(mark('q2ci','Em'),1); assert.equal(mark('q2cii','sharp@1'),1); assert.equal(mark('q2cii','natural@1'),0);
assert.equal(mark('q3c3','V-vi'),1); assert.equal(mark('q3c4','Dim7'),1); assert.equal(mark('q3d','Electric Dance Music'),0);
assert.equal(mark('q4ai','D♭4'),1); assert.equal(mark('q4ai','C#4'),0); assert.equal(mark('q4aii','Tritone'),1); assert.equal(mark('q4aii','Augmented 4th'),0);
assert.equal(mark('q4bi','C5,Bb4,A4'),1); assert.equal(mark('q4bi','C5,B4,A4'),0); assert.equal(mark('q4bii','Eb3,Bb2,Bb2'),1); assert.equal(mark('q4bii','Eb3,Bb2,C3'),0);
assert.equal(mark('q5c','5/4'),1); assert.equal(mark('q5d','2'),0); assert.equal(mark('q5e','3'),1);
assert.equal(mark('q6a1',{final:'Solo violin\nOrchestra\nFugue\nString quartet'}),0);
assert.equal(mark('q6a2',{final:'Grace notes\nWoodwind\nBrass\nPercussion'}),0);
assert.equal(mark('q6bii',{final:'Excerpt 1 is Baroque. Excerpt 2 is Romantic.'}),1);
assert.equal(mark('q6bii',{final:'Excerpt 1 is Classical because it uses sequence. Excerpt 2 is Romantic because it uses a large orchestra.'}),1);

assert.equal(answerComplete(parts.get('q4bi'),'C5,Bb4'),false);
assert.equal(answerComplete(parts.get('q4bi'),answers.q4bi),true);
assert.equal(answerComplete(parts.get('q4bii'),answers.q4bii),true);
assert.equal(createAttempt(paper,'exam',true).timer.remainingSeconds,4500);

const q2 = notation.getInventory('ah-2024-q2');
const q4 = notation.getInventory('ah-2024-q4');
const q5e = notation.getInventory('ah-2024-q5e');
assert.deepEqual(q2,require('./fixtures/ah2024-q2-inventory.json'));
assert.deepEqual(q4,require('./fixtures/ah2024-q4-inventory.json'));
assert.deepEqual(q5e,require('./fixtures/ah2024-q5e-inventory.json'));
assert.equal(q5e.answer,3);
const total = item => item.notes.reduce((sum,note)=>sum+(note.beats||0),0);
const inventorySignature = item => item.notes.map(entry => `${entry.rest?'rest':entry.pitch}:${entry.rhythm}`).join('|');
assert.ok(Math.abs(total(q2.a.pickup)-1)<1e-8);
q2.a.bars.forEach((item,index)=>assert.ok(Math.abs(total(item)-(item.partial?2:3))<1e-8,`Question 2(a) bar ${index+1}`));
q2.c.bars.forEach((item,index)=>assert.ok(Math.abs(total(item)-(item.partial?2:3))<1e-8,`Question 2(c) bar ${index+9}`));
assert.ok(Math.abs(total(q4.a.pickup)-3)<1e-8);
q4.a.bars.forEach((item,index)=>assert.ok(Math.abs(total(item)-4)<1e-8,`Question 4(a) bar ${index+1}`));
q4.b.bars.forEach((item,index)=>assert.ok(Math.abs(total(item)-4)<1e-8,`Question 4(b) bar ${index+24}`));
q5e.options.flat().forEach((item,index)=>assert.ok(Math.abs(total(item)-4)<1e-8,`Question 5(e) option bar ${index+1}`));
assert.equal(parts.get('q6a1').roughWorkSheet,true);
assert.equal(paper.questions.find(question=>question.id==='q6').introPartLabels[1],'(a)');
assert.equal(parts.get('q6a1').roughWorkHeading,'Rough work');
assert.equal(parts.get('q6a1').finalAnswerHeading,'Final answer');
assert.equal(parts.get('q6a2').hideRoughWork,true);
assert.equal(parts.get('q6bi').finalAnswerIntro.length,2);
assert.deepEqual(parts.get('q6bi').leadIntro.introPartLabels,{0:'(i)',5:'(ii)'});
assert.equal(parts.get('q6bii').hideRoughWork,true);
assert.equal(parts.get('q6bii').endOfPaper,false);

const expectedMarkers=[[6.29,236.04,306.11],[6.78,197.83,357.45],[7.19,54.01,103.67,399.63],[7.76,162.38],[6.97,209.63,270.23,331.75,448.45],[8.65,61.73,176.9,302.18,415.71,783.07,858.09,972.66,1097.94,1212.97]];
const durations=[441.015986,573.764989,458.593991,362.996984,576.713991,1941.49];
assert.equal(expectedMarkers.flat().length,27);
paper.questions.forEach((question,index)=>{const clip=question.audio.clips[0];assert.equal(fs.existsSync(path.resolve(__dirname,'..',clip.file)),true);assert.deepEqual(clip.markers.map(marker=>marker.time),expectedMarkers[index]);assert.deepEqual(clip.markers.map(marker=>marker.time),[...clip.markers].map(marker=>marker.time).sort((a,b)=>a-b));assert.ok(clip.markers.every(marker=>marker.time>=0&&marker.time<durations[index]));});

class SvgNode { constructor(name){this.name=name;this.attributes={};this.children=[];this.style={};this.dataset={};this.events={};this.textContent='';this.classList={contains:()=>false,toggle:()=>{}};} setAttribute(name,value){this.attributes[name]=String(value);} getAttribute(name){return this.attributes[name]||'';} append(...nodes){this.children.push(...nodes);} addEventListener(name,callback){(this.events[name]||=[]).push(callback);} closest(){return null;} querySelectorAll(){return [];} contains(){return false;} remove(){} get lastChild(){return this.children.at(-1);} }
const descendants=node=>[node,...node.children.flatMap(descendants)];
const oldDocument=global.document,oldSymbols=global.BRAVURA_SYMBOLS;
global.document={createElementNS:(_,name)=>new SvgNode(name),createElement:name=>new SvgNode(name),activeElement:null,querySelectorAll:()=>[]};global.BRAVURA_SYMBOLS=new Proxy({},{get:(_,key)=>String(key)});
for (const [key,optionIndex] of [['q2',0],['q2a',0],['q2b',0],['q2c',0],['q4',0],['q4a',0],['q4b',0],['q5e',2]]) for (const interactive of [false,true]) { const wrap=new SvgNode('div'); notation.renderSharedScore({innerHTML:'',querySelector:()=>wrap},{score:{sharedNotation:`ah-2024-${key}`,optionIndex}},answers,interactive?()=>{}:null,Object.fromEntries([...parts.keys()].map(id=>[id,'incorrect']))); const nodes=descendants(wrap); assert.ok(nodes.some(node=>node.name==='svg')); assert.ok(!nodes.some(node=>Object.values(node.attributes).some(value=>/NaN|undefined|Infinity/.test(value))),`${key} finite render`); if(interactive&&['q2','q4'].includes(key))assert.ok(nodes.some(node=>['q3-note-hit-area','q3-bar-label-hit-area','q3-accidental-hit-area'].includes(node.attributes.class)),`${key} interactive target`); }
const chordWrap=new SvgNode('div');
let chordAnswer='';
notation.renderSharedScore({innerHTML:'',querySelector:()=>chordWrap},{score:{sharedNotation:'ah-2024-q2b'}},{},(id,value)=>{if(id==='q2b') chordAnswer=value;},{});
const chordInputs=descendants(chordWrap).filter(node=>node.name==='input' && /^Chord [123] in bar 11$/.test(node.attributes['aria-label']||''));
assert.equal(chordInputs.length,3);
['G/B','C','D'].forEach((value,index)=>{chordInputs[index].value=value;chordInputs[index].events.input[0]();});
assert.equal(chordAnswer,'G/B, C, D','Entering a chord must retain the other chord answers.');
assert.equal(mark('q2b',chordAnswer),1,'The three entered chords should earn the mark.');
global.document=oldDocument;global.BRAVURA_SYMBOLS=oldSymbols;
assert.match(fs.readFileSync(path.join(__dirname,'../digitalquestionpapers.html'),'utf8'),/advanced-higher-2024-notation\.js/);
console.log('Advanced Higher 2024 source, marking, audio and notation tests passed.');
