const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const paper = require('../papers/advanced-higher-2016.js');
const notation = require('../exam-notation.js');
const marking = require('../exam-marking.js');
const registry = require('../paper-registry.js');
const { createAttempt } = require('../exam-engine.js');
const parts = new Map(paper.questions.flatMap(q=>q.subquestions).map(p=>[p.id,p]));
const mark=(id,value)=>marking.markSubquestion(parts.get(id),value).marks;
assert.equal(registry[paper.id].levelCode,'AH');
assert.equal(paper.estimatedMinutes,75);
assert.deepEqual(paper.questions.map(q=>q.marks),[5,8,6,7,4,10]);
assert.equal([...parts.values()].reduce((n,p)=>n+p.marks,0),40);
assert.equal(fs.existsSync(path.resolve(__dirname,'..',paper.sourcePath)),true);
assert.equal(fs.existsSync(path.resolve(__dirname,'..',paper.markingInstructionsPath)),true);
const answers={q1a:'Madrigal\nSyllabic\nTime changes\nRenaissance',q1b:'Male alto',q2a:'Tremolando\nChromatic scale\nDiminished 7th\nAcciaccatura',q2b:'Gregorian chant',q2c:'Modal',q2d:'Diminution',q2e:'3',q3a1:'Drone',q3a2:'Horn',q3a3:'Grace note',q3a4:'Perfect',q3b:'Contemporary jazz',q3c:'5/8',q4a:'crotchet,quaver,quaver;minim;quaverRest,quaver,quaver,quaver',q4b:'Augmented',q4c:'B3,A#3,G3',q4di:'Whole tone',q4dii:'Bb4',q4ei:'F|1st inversion|Gm|1st inversion',q4eii:'D3',q5a:'Bb major',q5b:'dottedCrotchetRest',q5c:'2:2-3',q5d:'F5,E5',q6a1:{final:'Appoggiatura\nArpeggios\nAlberti bass\nStaccato'},q6a2:{final:'Bitonality\nCluster\nPiccolo\nPizzicato'},q6bi:{final:'Both excerpts use arpeggios in the piano part and orchestra. Both excerpts are homophonic with a melody and accompaniment. Both excerpts feature imitation between instruments in the orchestra. Both excerpts use modulation with a change of key. Both excerpts feature staccato with short detached playing in the music. Both excerpts use sequences which repeat ideas at different pitches.'},q6bii:{final:'Excerpt 1 is Classical because it uses a small orchestra and ornamentation. Excerpt 2 is Neo-classical because the large orchestra uses dissonant harmony and percussion.'}};
for(const [id,value] of Object.entries(answers))assert.equal(mark(id,value),parts.get(id).marks,id);
assert.equal(marking.markPaper(paper,answers).score,40);
assert.equal(mark('q1a',answers.q1a+'\nMordent'),3);
assert.equal(mark('q2b','Chant'),0);
assert.equal(mark('q2c','Minor'),0);
assert.equal(mark('q2c','Melodic minor'),1);
assert.equal(mark('q2d','Augmentation'),0);
assert.equal(mark('q3c','4/4'),0);
assert.equal(mark('q4a','crotchet,quaver,quaver;dottedCrotchet,quaverRest;quaverRest,quaver,quaver,quaver'),1);
assert.equal(mark('q4c','B3,A3,G3'),0);
assert.equal(mark('q4dii','A#4'),0);
assert.equal(mark('q4ei','F|root|Gm|1st inversion'),0);
assert.equal(mark('q4ei','F|1st inversion|G|1st inversion'),0);
assert.equal(mark('q4ei','Ib||IIb|'),1);
assert.equal(mark('q4eii','D2'),1);
assert.equal(mark('q4eii','D5'),1, 'The official any-octave D rule includes the highest keyboard-enterable D.');
assert.equal(mark('q4eii','C5'),0);
assert.equal(mark('q5a','Bb minor'),0);
assert.equal(mark('q5b','quaverRest,quaverRest,quaverRest'),1);
assert.equal(mark('q5b','quaverRest'),0);
assert.equal(mark('q5c','1:0-1'),0);
assert.equal(mark('q5d','F5,Eb5'),0);
assert.equal(mark('q6a1',{final:'Appoggiatura\nArpeggios'}),1);
assert.equal(mark('q6a1',{final:'Appoggiatura\nAlberti bass'}),0);
assert.equal(mark('q6a1',{final:'Chromatic scale\nMelodic minor'}),0);
assert.equal(mark('q6a1',{melody:'Appoggiatura\nArpeggios',texture:'Alberti bass\nStaccato',final:''}),0);
assert.equal(mark('q6a2',{final:'Major\nDrums'}),0);
assert.equal(mark('q6bi',{final:'Arpeggios\nHomophonic\nImitation\nModulation\nStaccato\nSequences'}),2);
assert.equal(mark('q6bi',{final:'Both excerpts are not homophonic and do not use staccato.'}),0);
assert.equal(mark('q6bi',{final:'Excerpt 1 is major whereas Excerpt 2 is minor.'}),1);
assert.equal(mark('q6bii',{final:'Excerpt 1 is Classical. Excerpt 2 is Modern.'}),1);
assert.equal(mark('q6bii',{final:'Excerpt 1 is Classical because of the small orchestra.'}),1);
assert.equal(mark('q6bii',{final:'Excerpt 1 is Baroque. Excerpt 2 is Romantic.'}),0);
assert.equal(mark('q6bii',{final:'Excerpt 1 is Classical or Romantic because of ornamentation. Excerpt 2 is Modern because of dissonance.'}),1);
// Exact, independently reviewed bar inventories are kept as readable pitch/rhythm rows.
const rows=id=>notation.getInventory(id).bars.map(b=>b.notes.map(n=>(n.rest?'rest':n.pitch)+':'+n.rhythm).join(' '));
assert.deepEqual(rows('ah-2016-q4d'),[
'rest:quaverRest D4:quaver E4:quaver D4:quaver',
'C4:quaver D4:quaver E4:quaver F#4:quaver',
'G#4:quaver A#4:quaver C5:quaver D5:quaver',
'E5:crotchet C5:quaver D5:quaver','E5:dottedCrotchet']);
assert.deepEqual(rows('ah-2016-q5'),[
'F5:dottedCrotchet F5:quaver F5:crotchet F5:quaver F5:quaver',
'F5:crotchet Eb5:quaver D5:quaver D5:crotchet rest:quaverRest Eb5:quaver',
'F5:crotchet F5:quaver Eb5:quaver Eb5:crotchet D5:quaver Bb4:quaver',
'Bb4:minim rest:crotchetRest rest:quaverRest Bb4:quaver',
'Eb5:quaver Eb5:crotchet D5:quaver D5:crotchet Bb4:quaver F4:quaver',
'F4:minim rest:crotchetRest F4:quaver Gb4:quaver',
'Gb4:crotchet Gb4:quaver Bb4:quaver Bb4:quaver F5:crotchet C5:quaver',
'C5:minim rest:crotchetRest Bb4:crotchet',
'D5:minim D5:quaver G5:crotchet A5:quaver',
'A5:minim A5:quaver Bb5:crotchet D5:quaver',
'D5:quaver rest:quaverRest rest:quaverRest D5:quaver C5:quaver Bb4:crotchet C5:quaver',
'C5:minim rest:crotchetRest G5:crotchet',
'F5:dottedMinim C5:quaver B4:quaver',
'B4:dottedMinim F5:crotchet','E5:dottedMinim Bb4:crotchet','A4:crotchet']);
const c=notation.getInventory('ah-2016-q4c');
assert.deepEqual(c.bass[5].missingIndices,[0,1,2]);
assert.deepEqual(c.bass[5].notes.map(n=>n.pitch),['B3','A#3','G3']);
assert.equal(c.bass[6].notes[0].pitch,'B3');
assert.deepEqual(notation.getInventory('ah-2016-q5').missingNoteSlots,[[14,1],[15,0]]);
for(const id of ['q4a','q4c','q4d','q4e','q5']){
 const inv=notation.getInventory('ah-2016-'+id);
 for(const stem of ['bars','treble','bass'])for(const b of inv[stem]||[]){
  if(!b.notes||b.partial)continue;
  assert.equal(b.notes.reduce((s,n)=>s+n.beats,0),id==='q5'?4:id==='q4e'?3:2,id+' '+stem);
 }
 assert.equal(inv.finalBarline,({q4a:'double',q4c:'none',q4d:'none',q4e:'single',q5:'none'})[id]);
}
const expectedMarkers=[
[6.88,215.32],[7.54,219.44,265.97,313.36,416.18],
[6.57,172.32,271.34,380.46,431.12],[7.02,117.89,172.7,272.9,405.12],
[7.24,143.48,206.84],[8.99,68.12,211.44,354.66,498.72,885.54,963.02,1106.53,1249.71,1393.9]];
const durations=[269.14,537.966,480.862,650.475,385.019,2144.679];
assert.equal(expectedMarkers.flat().length,30);
paper.questions.forEach((q,i)=>{
 const clip=q.audio.clips[0];assert.equal(fs.existsSync(path.resolve(__dirname,'..',clip.file)),true);
 assert.deepEqual(clip.markers.map(m=>m.time),expectedMarkers[i]);
 assert.deepEqual(clip.markers.map(m=>m.time),clip.markers.map(m=>m.time).sort((a,b)=>a-b));
 assert.ok(clip.markers.every(m=>m.time>=0&&m.time<durations[i]));
});

assert.equal(crypto.createHash('sha256').update(JSON.stringify(notation.getInventory('ah-2016-q2e'))).digest('hex'),'aaacf8e3a1129b9637d5f3f5ad5f49b3c5e5c2c529e6c35cf1b65f840b2d81b2','Audited q2e inventory');
assert.equal(crypto.createHash('sha256').update(JSON.stringify(notation.getInventory('ah-2016-q4a'))).digest('hex'),'90db4409c87210c91dfb359b50557ebfd9f41c5b3768995f75c9e79f7a98f808','Audited q4a inventory');
assert.equal(crypto.createHash('sha256').update(JSON.stringify(notation.getInventory('ah-2016-q4c'))).digest('hex'),'dec3d0e4252403cafa62c709cf1acd1e2a3116726fa17b62ac5767f5c5b132ba','Audited q4c inventory');
assert.equal(crypto.createHash('sha256').update(JSON.stringify(notation.getInventory('ah-2016-q4d'))).digest('hex'),'2dbd3da68e0c489b4327b228558e9ba17623cb81aa848cc2c3a20e5eb88d4f18','Audited q4d inventory');
assert.equal(crypto.createHash('sha256').update(JSON.stringify(notation.getInventory('ah-2016-q4e'))).digest('hex'),'38b02e2a6176624ea36fbb9b2846f8930167b3416d600b5f6328d5a57d328372','Audited q4e inventory');
assert.equal(crypto.createHash('sha256').update(JSON.stringify(notation.getInventory('ah-2016-q5'))).digest('hex'),'cc4bc859f6e2296977b74f93422bbc3c8ba22e396a1aeb61b544e41f6d016de7','Audited q5 inventory');
class SvgNode {
 constructor(name){this.name=name;this.attributes={};this.children=[];this.style={};this.dataset={};this.events={};this.textContent='';}
 setAttribute(name,value){this.attributes[name]=String(value);}
 getAttribute(name){return this.attributes[name]||'';}
 append(...nodes){this.children.push(...nodes);}
 addEventListener(name,callback){(this.events[name]||=[]).push(callback);}
 closest(){return null;}
 remove(){}
 get lastChild(){return this.children.at(-1);}
}
const descendants=node=>[node,...node.children.flatMap(descendants)];
const oldDoc=global.document,oldSymbols=global.BRAVURA_SYMBOLS;
global.document={createElementNS:(_,name)=>new SvgNode(name),createElement:name=>new SvgNode(name)};
global.BRAVURA_SYMBOLS=new Proxy({},{get:(_,key)=>String(key)});
for(const key of ['q2e','q4a','q4c','q4d','q4e','q5'])for(const interactive of [false,true]){
 const wrap=new SvgNode('div');
 notation.renderSharedScore({innerHTML:'',querySelector:()=>wrap},{score:{sharedNotation:'ah-2016-'+key,optionIndex:2}},answers,interactive?()=>{}:null,Object.fromEntries([...parts.keys()].map(id=>[id,'incorrect'])));
 const nodes=descendants(wrap);
 assert.ok(nodes.some(n=>n.name==='svg'));
 assert.ok(!nodes.some(n=>Object.values(n.attributes).some(v=>/NaN|undefined|Infinity/.test(v))),key+' must render finite coordinates');
 if(interactive&&['q4c','q4d','q4e','q5'].includes(key))assert.ok(nodes.some(n=>n.attributes.class==='q3-note-hit-area'&&n.events.keydown?.length),key+' keyboard note entry');
}
global.document=oldDoc;global.BRAVURA_SYMBOLS=oldSymbols;
assert.equal(mark('q6a1',{final:'Major, arpeggios, solo piano, orchestra, staccato'}),2);
assert.equal(mark('q6bii',{final:'Excerpt 1 is Classical or Modern because of the small orchestra. Excerpt 2 is Neo-classical because of dissonance.'}),1);
assert.equal(mark('q6bii',{final:'Excerpt 1 is Classical because of the small orchestra. Excerpt 2 is from the Neo-classical period because of dissonance.'}),2);
assert.equal(mark('q6bii',{final:'Excerpt 1 is Classical because of ornamentation. Excerpt 2 is Classical or Neo-classical because of dissonance.'}),1);
const {answerComplete}=require('../exam-engine.js');
assert.equal(answerComplete(parts.get('q4c'),'B3,_,_'),false);
assert.equal(answerComplete(parts.get('q4c'),'B3,A#3,G3'),true);
assert.equal(answerComplete(parts.get('q4a'),'crotchet;;'),false);
assert.equal(answerComplete(parts.get('q4a'),answers.q4a),true);
assert.equal(answerComplete(parts.get('q5b'),'quaverRest'),false);
assert.equal(answerComplete(parts.get('q5b'),'crotchetRest,quaverRest'),true);
assert.equal(answerComplete(parts.get('q6bi'),answers.q6bi),true);
assert.equal(createAttempt(paper,'exam',true).timer.remainingSeconds,4500);
const uiSource=fs.readFileSync(path.resolve(__dirname,'../exam-ui.js'),'utf8');
assert.match(uiSource,/conceptMarkAttribute = paper.levelCode === "AH"/,'AH concept parts must show their own available marks, not the whole-question total');
assert.match(uiSource,/!subquestion.sourceHeading/,'Visible source headings own the sole part-mark numeral');
assert.match(uiSource,/selectedStartMode = "exam";[\s\S]*data-start-overlay/,'Customise should open the dedicated Exam Mode information prompt');

// User-confirmed source correction: bars 9 and 10, including all ties.
const correctedQ5 = notation.getInventory('ah-2016-q5');
assert.deepEqual(correctedQ5.bars.slice(8,10).map(b => b.notes.map(n => [n.pitch,n.rhythm,n.beats])), [
  [['D5','minim',2],['D5','quaver',0.5],['G5','crotchet',1],['A5','quaver',0.5]],
  [['A5','minim',2],['A5','quaver',0.5],['Bb5','crotchet',1],['D5','quaver',0.5]]
]);
assert.deepEqual(correctedQ5.bars.slice(8,10).map(b => [b.ties,b.tiesToNext]), [[[[0,1]],[3]],[[[0,1]],[3]]]);

assert.equal(notation.getInventory('ah-2016-q5').pickup.finalBarline, 'single', 'The D-Eb pickup ends with a barline before bar 1');

assert.deepEqual(notation.getInventory('ah-2016-q4a').bars[6].beamGroups, [{start:2,end:3}], 'Bar 7 has a separate quaver before its beamed pair');
assert.match(fs.readFileSync(path.join(__dirname,'../exam-notation.js'),'utf8'), /beamGroups:item\.missingIndices\?undefined:item\.beamGroups/, 'Printed rhythm bars use their audited beam groups');

// Q4 rebuild: source geometry, editable regions and user-approved presentation.
const rebuiltQ4 = paper.questions.find(q=>q.id==='q4');
assert.equal(rebuiltQ4.layout,'ah2016-literacy');
assert.deepEqual(rebuiltQ4.subquestions.map(p=>p.id),['q4a','q4b','q4c','q4di','q4dii','q4ei','q4eii']);
for (const id of ['q4a','q4c','q4dii']) assert.equal(parts.get(id).controlsAfterScore,true,id+' tools remain below its score');
assert.equal(parts.get('q4di').inlineScore,undefined);
assert.equal(parts.get('q4dii').inlineScore.sharedNotation,'ah-2016-q4d');
assert.deepEqual(parts.get('q4dii').boldPhrases,['same pitch']);
assert.deepEqual(parts.get('q4eii').promptLines,[
 'The chord used in bar 9 is Gm 2nd inversion/Chord IIc.',
 'Using the rhythm provided write the appropriate bass note to make the chord a 2nd inversion.'
]);
const rebuiltRhythm=notation.getInventory('ah-2016-q4a');
assert.deepEqual(rebuiltRhythm.layout.printedBarNumbers,[null,2,3,4,5,6,7,8]);
assert.deepEqual(rebuiltRhythm.bars.flatMap((b,i)=>b.missingIndices?[i+1]:[]),[3,4,5]);
const rebuiltBass=notation.getInventory('ah-2016-q4c');
assert.equal(rebuiltBass.layout.answerBar,6);
assert.deepEqual(rebuiltBass.bass[5].missingIndices,[0,1,2]);
assert.equal(rebuiltBass.bass[6].notes[0].pitch,'B3');
const rebuiltScale=notation.getInventory('ah-2016-q4d');
assert.deepEqual(rebuiltScale.layout.printedBarNumbers,[null,null,3,null,null]);
assert.deepEqual([rebuiltScale.layout.scaleBoxStartBar,rebuiltScale.layout.scaleBoxEndBar,rebuiltScale.layout.scaleBoxEndNote],[2,4,0]);
assert.deepEqual([rebuiltScale.layout.enharmonicBar,rebuiltScale.layout.enharmonicNote],[3,1]);
const rebuiltChords=notation.getInventory('ah-2016-q4e');
assert.deepEqual(rebuiltChords.layout.identifyBars,[7,8]);
assert.equal(rebuiltChords.layout.bassAnswerBar,9);
assert.deepEqual(rebuiltChords.layout.printedBarNumbers,[null,2,3,4,5,null,null,null,null,null]);
assert.ok(!fs.readFileSync(path.join(__dirname,'../styles.css'),'utf8').includes('.paper-level-ah.question-q4[data-paper-id="advanced-higher-2016"]'),'2016 Q4 has one rebuilt layout rather than accumulated per-question overrides; other papers may have their own layouts');

assert.equal(notation.getInventory('ah-2016-q4d').layout.enharmonicBoxWidth,56,'User requested a tight A-sharp box');

assert.deepEqual(paper.questions[1].audio.clips[0].markers.map(m=>m.label),['(a)','(b)','(c)','(d)','(e)']);

assert.deepEqual(paper.questions[0].audio.clips[0].markers.map(m=>m.label),['(a)','(b)']);

for (const i of [0,1,2,3,5]) { assert.equal(paper.questions[i].audio.clips[0].markers[0].label,i===2?'(a) 1st':'(a)'); assert.ok(paper.questions[i].audio.clips[0].markers[0].time < 10, 'First part begins at its spoken instruction, not the music cue'); }

assert.deepEqual(paper.questions[5].audio.clips[0].markers.map(m=>m.label),['(a)','1','2','1','2','(b)','1','2','1','2']);

// Checked work remains marked and locked when switching to All Questions.
const allQuestionsSource = uiSource.slice(uiSource.indexOf('  function renderAllQuestions()'),uiSource.indexOf('  function renderPrintPaper()'));
assert.match(allQuestionsSource,/singleArea\.querySelectorAll\([\s\S]*?container\.innerHTML = ""/,'Inactive single-question fields are removed before All Questions');
assert.match(allQuestionsSource,/card\.classList\.toggle\("is-practice-checked", checked\)/);
assert.match(allQuestionsSource,/if \(checked\) applyPracticeQuestionMarking\(card, question, questionResult\)/);
const resultsSource = uiSource.slice(uiSource.indexOf('  function renderResults()'),uiSource.indexOf('  function onEngineChange('));
assert.match(resultsSource,/if \(paperToolbar\) \$\("\.exam-primary-shell"\)\.prepend\(paperToolbar\)/,'Submission keeps navigation outside the hidden exam workspace');
assert.match(resultsSource,/\[data-all-questions-area\]"\)\.innerHTML = ""/,'Submission removes inactive answer fields');
console.log('Advanced Higher 2016 source, marking and notation tests passed.');
