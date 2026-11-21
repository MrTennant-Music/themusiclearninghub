const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const paper = require('../papers/advanced-higher-2023.js');
const notation = require('../exam-notation.js');
const marking = require('../exam-marking.js');
const registry = require('../paper-registry.js');
const { answerComplete, createAttempt } = require('../exam-engine.js');

const parts = new Map(paper.questions.flatMap(question => question.subquestions).map(part => [part.id, part]));
const mark = (id, value) => marking.markSubquestion(parts.get(id), value).marks;
for (const reason of ['ornamentation', 'traditional harmony']) {
  assert.equal(mark('q6bii', { final: `Excerpt 1 is Classical because it uses ${reason}.` }), 1);
}
for (const reason of ['accents', 'complex chords', 'a wide range of dynamics']) {
  assert.equal(mark('q6bii', { final: `Excerpt 2 is modern because it uses ${reason}.` }), 1);
}
assert.equal(mark('q6a1', { final: 'Ornamentation and major and minor.' }), 0, 'Ornamentation is accepted as conclusion justification, but explicitly rejected in the Excerpt 1 concept list.');
assert.equal(registry[paper.id].levelCode, 'AH');
assert.equal(paper.estimatedMinutes, 75);
assert.deepEqual(paper.questions.map(question => question.marks), [6,5,6,4,9,10]);
assert.equal([...parts.values()].reduce((sum, part) => sum + part.marks, 0), 40);
assert.equal(fs.existsSync(path.resolve(__dirname, '..', paper.sourcePath)), true);
assert.equal(fs.existsSync(path.resolve(__dirname, '..', paper.markingInstructionsPath)), true);

const answers = {
  q1a:'Countertenor\nMotet\nPlagal cadence\nRenaissance',q1b:'Tenor, Alto, Soprano, Bass',q1c:'Fugue',
  q2a:'1',q2bi:'start-bar-10,end-bar-25',q2bii:'bar-20-bracket',q2ci:'Play one octave higher',q2cii:'D major',
  q3a:'Sprechgesang',q3b1:'Appoggiatura',q3b2:'Perfect cadence',q3b3:'Inverted pedal',q3b4:'Piano trio',q3c:'Contemporary Jazz',
  q4a:'Imperfect cadence',q4b:'A#4',q4c:'natural@0',q4d:'F5',
  q5a:'Glissando\nIrregular time signatures\nRetrograde\nTremolando',q5bi:'E4,D4,E4,C4',q5bii:'D4',q5c:'Modal',q5d:'3 against 2',q5e:'2',
  q6a1:{final:'Chromatic\nSequence\nHomophonic\nPiano'},
  q6a2:{final:'Added 6th\nTritone\nOstinato\nTimpani'},
  q6bi:{final:'Both excerpts use chromatic notes in their melodic writing. Both excerpts use dominant 7th chords in the harmony. Both excerpts use modulation during the music. Both excerpts use a pedal note in the accompaniment. Both excerpts feature melodic sequences during the extracts. Excerpt 1 uses a piano quintet whereas Excerpt 2 uses a full orchestra.'},
  q6bii:{final:'Excerpt 1 is Classical because it uses a piano quintet and conventional harmony. Excerpt 2 is 20th century because it uses dissonance and added 6th chords.'},
};
for (const [id,value] of Object.entries(answers)) assert.equal(mark(id,value),parts.get(id).marks,id);
assert.equal(marking.markPaper(paper,answers).score,40);

assert.equal(mark('q1a','Countertenor\nMotet\nPlagal cadence\nMadrigal'),3);
assert.equal(mark('q1b','TASB'),1); assert.equal(mark('q1b','Soprano Alto Tenor Bass'),0);
assert.equal(mark('q1c','Fugal'),1); assert.equal(mark('q2a','2'),0);
assert.equal(mark('q2bi','D.S.-bar-10,end-bar-25'),1); assert.equal(mark('q2bi','start-bar-9,end-bar-25'),0);
assert.equal(mark('q2bii','bar-20-bracket'),1); assert.equal(mark('q2bii','bar-19-bracket'),0);
assert.equal(mark('q2ci','Eight notes higher'),1); assert.equal(mark('q2cii','D'),1);
assert.equal(mark('q3b2','V-I'),1); assert.equal(mark('q3b4','Piano quartet'),0);
assert.equal(mark('q4a','I-V'),1); assert.equal(mark('q4b','Bb4'),0); assert.equal(mark('q4c','natural@0'),1); assert.equal(mark('q4c','sharp@0'),0); assert.equal(mark('q4d','F4'),1);
assert.equal(mark('q5bi','E4,D4,E4,C4'),1); assert.equal(mark('q5bi','E4,D4,E4,D4'),0); assert.equal(mark('q5bii','D4'),1);
assert.equal(mark('q5c','Mode'),1); assert.equal(mark('q5d','Three against two'),1); assert.equal(mark('q5e','3'),0);
assert.equal(mark('q6a1',{final:'Ornamentation\nChromatic scale\nQuestion and answer\nPiano'}),0);
assert.equal(mark('q6a2',{final:'Change of key\nChromatic scale\nIrregular time\nPercussion'}),0);
assert.equal(mark('q6bii',{final:'Excerpt 1 is Classical. Excerpt 2 is modern.'}),1);
assert.equal(mark('q6bii',{final:'Excerpt 1 is Baroque because it is homophonic. Excerpt 2 is modern because it uses a tritone.'}),1);

assert.equal(answerComplete(parts.get('q5bi'),'E4,D4,E4'),false);
assert.equal(answerComplete(parts.get('q5bi'),answers.q5bi),true);
assert.equal(answerComplete(parts.get('q4b'),'A#4'),true);
assert.equal(createAttempt(paper,'exam',true).timer.remainingSeconds,4500);

const q2a = notation.getInventory('ah-2023-q2a');
const q2bRhythm = notation.getInventory('ah-2023-q2bRhythm');
const q2 = notation.getInventory('ah-2023-q2');
const q4 = notation.getInventory('ah-2023-q4');
const q5 = notation.getInventory('ah-2023-q5');
assert.deepEqual([q2.b.repeatSigns,q2.b.brassBracket,q2.c.octaveSign,q2.c.keyChange,q2.finalBarline],[
  {startBar:10,endBar:25,answer:'start-bar-10,end-bar-25'},
  {bar:20,answer:'bar-20-bracket'},
  {bars:[2,4],answer:'one octave higher'},
  {bar:9,key:'D major'},'single',
]);
assert.deepEqual([q4.cadence,q4.enharmonic,q4.accidental,q4.interval,q4.finalBarline],[
  {bars:[3,4],answer:'Imperfect'},
  {bar:5,note:0,source:'Bb4',answer:'A#4'},
  {bar:10,note:0,answer:'natural'},
  {bar:12,sourceNote:0,targetNote:1,source:'C5',answer:'F5',guideRhythm:'crotchet'},'double',
]);
assert.deepEqual([q5.missing,q5.bassClef,q5.finalBarline],[
  {bars:[9,10],indices:[[2,3],[0,1]],answer:['E4','D4','E4','C4'],rhythms:['quaver','quaver','crotchet','crotchet']},
  {bar:13,source:'D4',answer:'D4',rhythm:'minim'},'double',
]);
const total = item => item.notes.reduce((sum,note)=>sum+(note.beats||0),0);
const inventorySignature = item => item.notes.map(entry => `${entry.rest?'rest':entry.pitch}:${entry.rhythm}`).join('|');
q2a.options.flat().forEach((item,index)=>assert.ok(Math.abs(total(item)-4)<1e-8,`Question 2(a) option bar ${index+1}`));
q2bRhythm.bars.forEach((item,index)=>assert.ok(Math.abs(total(item)-4)<1e-8,`Question 2(b)(ii) printed rhythm bar ${index+1}`));
q2.b.bars.forEach((item,index)=>assert.ok(Math.abs(total(item)-4)<1e-8,`Question 2(b) bar ${index+1}`));
q2.c.bars.forEach((item,index)=>assert.ok(Math.abs(total(item)-4)<1e-8,`Question 2(c) bar ${index+1}`));
q4.bars.forEach((item,index)=>assert.ok(Math.abs(total(item)-4)<1e-8,`Question 4 bar ${index+1}`));
q5.bars.forEach((item,index)=>assert.ok(Math.abs(total(item)-2)<1e-8,`Question 5 bar ${index+1}`));
for (const [key,inventory] of Object.entries({q2a,q2bRhythm,q2,q4,q5})) {
  assert.deepEqual(inventory,require(`./fixtures/ah2023-${key}-inventory.json`),`${key}: exact audited pitch, rhythm, lyric, beam and editable-area inventory`);
}
assert.equal(parts.get('q6a1').roughWorkSheet,true);
assert.equal(parts.get('q6a1').roughWorkIntro,'For each excerpt identify at least two prominent concepts in each of the following categories:');
assert.deepEqual(parts.get('q6a1').roughWorkBullets,['Melody/harmony','Rhythm/tempo/texture/timbre']);
assert.equal(parts.get('q6a2').hideRoughWork,true);
assert.equal(parts.get('q6bi').finalAnswerIntro.length,2);
assert.equal(parts.get('q6bi').leadIntro.intro[6],'Write your final answers in the final answer section.');
assert.equal(parts.get('q6bii').hideRoughWork,true);
assert.equal(paper.questions[5].introPartLabels[1],'(a)');
assert.deepEqual(paper.questions[5].introBulletRange,[2,3]);
assert.equal(paper.questions[1].score,undefined);
assert.equal(parts.get('q2bi').inlineScore.sharedNotation,'ah-2023-q2b');
assert.equal(parts.get('q2bii').inlineScore.sharedNotation,'ah-2023-q2bRhythm');
assert.deepEqual(parts.get('q2bii').promptParts,{before:'Draw this sign',symbol:'bracket',after:'over the bar in which you first hear the brass play the following:'});
assert.equal(parts.get('q2ci').inlineScore.sharedNotation,'ah-2023-q2c');
// The score contains a separate Key input before q2ci's written answer.
// Binding the first arbitrary input would save that key under the wrong part.
const uiSource = fs.readFileSync(path.join(__dirname,'../exam-ui.js'),'utf8');
assert.match(uiSource, /subquestion\.type === "short-text"[\s\S]*?card\.querySelector\("input\.text-answer, textarea\.text-answer"\)/);
assert.equal(parts.get('q5bi').inlineScore.sharedNotation,'ah-2023-q5');

const expectedMarkers=[[7.69,196.38,303.82],[5.36,108.4,471.4],[8.25,50.91,369.21],[7.46],[6.79,205.87,382.04,416.28,461.18],[9.31,68.27,201.61,322.56,456.63,820.79,901.94,1035.56,1156.84,1290.76]];
const durations=[392.114989,697.364898,421.766984,400.357982,560.018866,2015.677823];
assert.equal(expectedMarkers.flat().length,25);
paper.questions.forEach((question,index)=>{const clip=question.audio.clips[0];assert.equal(fs.existsSync(path.resolve(__dirname,'..',clip.file)),true);assert.deepEqual(clip.markers.map(marker=>marker.time),expectedMarkers[index]);assert.deepEqual(clip.markers.map(marker=>marker.time),[...clip.markers].map(marker=>marker.time).sort((a,b)=>a-b));assert.ok(clip.markers.every(marker=>marker.time>=0&&marker.time<durations[index]));});

class SvgNode { constructor(name){this.name=name;this.attributes={};this.children=[];this.style={};this.dataset={};this.events={};this.textContent='';this.classList={contains:()=>false,toggle:()=>{}};} setAttribute(name,value){this.attributes[name]=String(value);} getAttribute(name){return this.attributes[name]||'';} append(...nodes){this.children.push(...nodes);} addEventListener(name,callback){(this.events[name]||=[]).push(callback);} closest(){return null;} querySelectorAll(){return [];} contains(){return false;} remove(){} get lastChild(){return this.children.at(-1);} }
const descendants=node=>[node,...node.children.flatMap(descendants)];
const oldDocument=global.document,oldSymbols=global.BRAVURA_SYMBOLS;
global.document={createElementNS:(_,name)=>new SvgNode(name),createElement:name=>new SvgNode(name),activeElement:null,querySelectorAll:()=>[]};global.BRAVURA_SYMBOLS=new Proxy({},{get:(_,key)=>String(key)});
for (const [key,optionIndex] of [['q2a',0],['q2bRhythm',0],['q2',0],['q2b',0],['q2c',0],['q4',0],['q5',0]]) for (const interactive of [false,true]) { const wrap=new SvgNode('div'); notation.renderSharedScore({innerHTML:'',querySelector:()=>wrap},{score:{sharedNotation:`ah-2023-${key}`,optionIndex}},answers,interactive?()=>{}:null,Object.fromEntries([...parts.keys()].map(id=>[id,'incorrect']))); const nodes=descendants(wrap); assert.ok(nodes.some(node=>node.name==='svg')); assert.ok(!nodes.some(node=>Object.values(node.attributes).some(value=>/NaN|undefined|Infinity/.test(value))),`${key} finite render`); if(interactive&&['q2','q2b','q4','q5'].includes(key))assert.ok(nodes.some(node=>['q3-note-hit-area','q3-repeat-hit-area','q3-bar-label-hit-area','q3-accidental-hit-area'].includes(node.attributes.class)),`${key} interactive target`); }
global.document=oldDocument;global.BRAVURA_SYMBOLS=oldSymbols;
assert.match(fs.readFileSync(path.join(__dirname,'../digitalquestionpapers.html'),'utf8'),/advanced-higher-2023-notation\.js/);
console.log('Advanced Higher 2023 source, marking, audio and notation tests passed.');
