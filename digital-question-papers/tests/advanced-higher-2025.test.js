const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const paper=require('../papers/advanced-higher-2025.js');
const notation=require('../exam-notation.js');
const marking=require('../exam-marking.js');
const registry=require('../paper-registry.js');
const {answerComplete,createAttempt}=require('../exam-engine.js');
const parts=new Map(paper.questions.flatMap(question=>question.subquestions).map(part=>[part.id,part]));
const mark=(id,value)=>marking.markSubquestion(parts.get(id),value).marks;
for (const reason of ['a small ensemble', 'a chamber ensemble', 'a small orchestra with some wind instruments', 'diatonic harmonies']) {
  assert.equal(mark('q6bii', { final: `Excerpt 1 is Classical because it uses ${reason}.` }), 1);
}
assert.equal(mark('q6bii', { final: 'Excerpt 1 is Classical because it uses a small orchestra.' }), 0, 'The source rejects small orchestra alone as justification.');
assert.equal(mark('q6bii', { final: 'Excerpt 2 is Romantic because it uses sfz.' }), 1);
assert.deepEqual(parts.get('q2ai').options.map(option=>option.value),['tripletQuaver','crotchet','quaver']);
assert.equal(mark('q2ai','crotchet,crotchet,crotchet'),0);
assert.equal(mark('q2ai','tripletQuaver,quaver,crotchet'),0);
assert.equal(registry[paper.id].levelCode,'AH');
assert.equal(paper.estimatedMinutes,75);
assert.deepEqual(paper.questions.map(question=>question.marks),[5,6,7,4,8,10]);
assert.equal([...parts.values()].reduce((sum,part)=>sum+part.marks,0),40);
assert.equal(fs.existsSync(path.resolve(__dirname,'..',paper.sourcePath)),true);
assert.equal(fs.existsSync(path.resolve(__dirname,'..',paper.markingInstructionsPath)),true);

const answers={
 q1a:'Diminution\nElectronic dance music\nReverb\nRitardando',q1b:'String quartet',
 q2ai:'tripletQuaver,tripletQuaver,tripletQuaver',q2aii:'F5',q2b:'3',q2ci:'4',q2cii:'Perfect cadence',q2d:'D3,E3,F3',
 q3a1:'Octave',q3a2:'Suspension',q3a3:'Homophonic',q3a4:'Relative minor',q3b:'Tritone',q3c:'Harmonics',q3d:'Polytonality',
 q4a:'F4,E4,D4,C4',q4b:'A4,G4,F4,D4',q4c:'bar-12-bb',q4d:'after-bar-9,after-bar-10',
 q5a:'Consort\nGalliard\nHemiola\nSequence',q5b:'Madrigal',q5c:'Anthem',q5di:'Diminished 7th',q5dii:'Major 6th',
 q6a1:{final:'Chromatic scale\nDominant 7th\nAlberti bass\nPizzicato'},
 q6a2:{final:'Tritone\nOctave\nStretto\nTremolando'},
 q6bi:{final:'Both excerpts use appoggiaturas. Both excerpts use broken chords. Both excerpts use chromatic notes. Both excerpts use dominant 7th chords. Both excerpts are homophonic. Excerpt 1 uses a small chamber orchestra whereas Excerpt 2 uses a large symphony orchestra.'},
 q6bii:{final:'Excerpt 1 is Classical because it uses Alberti bass and diatonic harmony. Excerpt 2 is Romantic because it uses a large orchestra and chromaticism.'},
};
for(const [id,value] of Object.entries(answers))assert.equal(mark(id,value),parts.get(id).marks,id);
assert.equal(marking.markPaper(paper,answers).score,40);
assert.equal(mark('q1a','Diminution\nElectronic dance music\nReverb\nLeitmotif'),3);assert.equal(mark('q1b','String orchestra'),0);
assert.equal(mark('q2ai','tripletQuaver,tripletQuaver,tripletQuaver'),1);assert.equal(mark('q2ai','quaver,quaver,quaver'),0);assert.equal(mark('q2aii','F♮5'),1);assert.equal(mark('q2aii','E#5'),0);assert.equal(mark('q2b','2'),0);assert.equal(mark('q2ci','Four beats'),1);assert.equal(mark('q2cii','V7-I'),1);assert.equal(mark('q2d','D2,E4,F3'),1);
assert.equal(mark('q3a1','8ve'),1);assert.equal(mark('q3a4','Minor'),0);assert.equal(mark('q3d','Bitonality'),1);
assert.equal(mark('q4a','F4,E4,D4,C4'),1);assert.equal(mark('q4a','F4,E4,D4,B3'),0);assert.equal(mark('q4b','A4,G4,F4,D4'),1);assert.equal(mark('q4c','bar-12-bb'),1);assert.equal(mark('q4c','bar-12-a'),0);assert.equal(mark('q4d','after-bar-9,after-bar-10'),1);assert.equal(mark('q4d','after-bar-9'),0);
// The score stores multiple barline tokens in lexical order.
assert.equal(mark('q4d','after-bar-10,after-bar-9'),1);
assert.equal(mark('q4d','after-bar-10'),0);
assert.equal(mark('q5c','Oratorio'),1);assert.equal(mark('q5di','Dim7'),1);assert.equal(mark('q5di','Diminished triad'),0);assert.equal(mark('q5dii','6'),1);assert.equal(mark('q5dii','Minor 6th'),0);
assert.equal(mark('q6a1',{final:'Change of key\nViolin\nBassoons\nFrench horns'}),0);assert.equal(mark('q6a2',{final:'Modulation\nMajor\nMinor\nPercussion'}),0);assert.equal(mark('q6bii',{final:'Excerpt 1 is Classical. Excerpt 2 is Romantic.'}),1);
assert.equal(mark('q6bi',{final:'Excerpt 1 uses modulation to a minor key.'}),0);
assert.equal(mark('q6bi',{final:'Excerpt 2 only uses accents. Excerpt 2 only uses sforzando.'}),1);
assert.equal(parts.get('q6a1').roughWorkSheet,true);assert.equal(parts.get('q6a2').hideRoughWork,true);assert.equal(parts.get('q6a2').hideFinalHeading,true);
assert.equal(parts.get('q6bi').roughWorkLines,16);assert.equal(parts.get('q6bi').finalAnswerLines,20);assert.equal(parts.get('q6bii').hideRoughWork,true);assert.equal(parts.get('q6bii').hideFinalHeading,true);
const q6=paper.questions.find(question=>question.id==='q6');
assert.deepEqual(q6.introPartLabels,{1:'(a)'});assert.deepEqual(q6.introBulletRange,[2,3]);assert.deepEqual(q6.introCompactRanges,[[7,8],[9,10]]);assert.equal(q6.intro[2],'melody/harmony');assert.equal(q6.intro[3],'texture/structure/form/timbre.');
assert.match(parts.get('q2b').prompt,/tick \(✓\) one box/);assert.match(parts.get('q2ci').prompt,/box provided/);assert.match(parts.get('q3b').prompt,/tick \(✓\) one box/);assert.match(parts.get('q5di').prompt,/line below/);assert.match(parts.get('q5dii').prompt,/line below/);
assert.equal(answerComplete(parts.get('q2ai'),'tripletQuaver,tripletQuaver'),false);assert.equal(answerComplete(parts.get('q2ai'),answers.q2ai),true);assert.equal(answerComplete(parts.get('q4b'),answers.q4b),true);assert.equal(createAttempt(paper,'exam',true).timer.remainingSeconds,4500);

const q2=notation.getInventory('ah-2025-q2'),q2b=notation.getInventory('ah-2025-q2b'),q4=notation.getInventory('ah-2025-q4'),q5=notation.getInventory('ah-2025-q5');
for(const [key,inventory] of Object.entries({q2,q2b,q4,q5}))assert.deepEqual(inventory,require(`./fixtures/ah2025-${key}-inventory.json`));
assert.deepEqual(q2.d.bars[2].pianoUpper.notes[8].chord,['D4','F4']);
assert.equal(q2.d.bars[0].upper.notes[1].graceRhythm,'semiquaver');
assert.equal(q2.layout.dPianoOffset,128);assert.equal(q2.layout.dBassOffset,270);
assert.ok(q2.d.bars.every(bar=>bar.pianoUpper.notes.every(note=>note.stemDown===false)));
assert.deepEqual(q4.bars[6].notes.map(n=>[n.pitch||'rest',n.rhythm]),[['rest','crotchetRest'],['F4','crotchet'],['A4','dottedQuaver'],['A4','semiquaver'],['A4','quaver'],['G4','quaver']]);
assert.equal(q4.bars[7].notes[0].pitch,'G4');assert.deepEqual(q4.missing.indices,[1,2,3,4]);assert.equal(q4.finalBarline,'double');
assert.equal(q4.layout.noteXs.length,17);q4.bars.forEach((bar,index)=>assert.equal(q4.layout.noteXs[index].length,bar.notes.length));
assert.equal(q5.bars[6].lower.notes[0].stemDown,true);assert.equal(q5.bars[9].lower.notes[0].stemDown,true);
assert.equal(q5.bars[7].lower.notes[0].dualStem,true);assert.equal(q5.bars[10].lower.notes[0].dualStem,true);
assert.equal(q5.layout.noteXs.length,11);q5.bars.forEach((bar,index)=>{assert.equal(q5.layout.noteXs[index].upper.length,bar.upper.notes.length);assert.equal(q5.layout.noteXs[index].lower.length,bar.lower.notes.length);});
assert.ok(q5.layout.chordBox.right<q5.layout.noteXs[5].upper[1]);assert.ok(q5.layout.intervalBox.right<q5.layout.noteXs[9].upper[1]);assert.equal(q5.finalBarline,'double');
const total=item=>item.notes.reduce((sum,note)=>sum+(note.beats||0),0);
q2.a.bars.forEach((item,index)=>assert.ok(Math.abs(total(item)-4)<1e-8,`Question 2(a) bar ${index+1}`));q2b.options.flat().forEach((item,index)=>assert.ok(Math.abs(total(item)-4)<1e-8,`Question 2(b) option bar ${index+1}`));q2.c.bars.forEach((item,index)=>assert.ok(Math.abs(total(item)-3)<1e-8,`Question 2(c) bar ${index+1}`));q2.d.bars.forEach((item,index)=>{assert.ok(Math.abs(total(item.upper)-3)<1e-8,`Question 2(d) upper ${index+9}`);assert.ok(Math.abs(total(item.pianoUpper)-3)<1e-8,`Question 2(d) piano upper ${index+9}`);assert.ok(Math.abs(total(item.lower)-3)<1e-8,`Question 2(d) lower ${index+9}`);});q4.bars.forEach((item,index)=>assert.ok(Math.abs(total(item)-4)<1e-8,`Question 4 bar ${index+1}`));q5.bars.forEach((item,index)=>{assert.ok(Math.abs(total(item.upper)-3)<1e-8,`Question 5 upper ${index+1}`);assert.ok(Math.abs(total(item.lower)-3)<1e-8,`Question 5 lower ${index+1}`);});
const expectedMarkers=[[5.94,268.25],[7.12,229.98,307.55,450.36],[7.38,368.8,421.64,462.58],[6.52],[6.61,241.15,287.93,341.97],[8.85,63.74,209.07,354,499.99,889.28,960.01,1104.72,1248.92,1393.21]];const durations=[327.632993,575.807982,523.168798,396.294966,504.684989,2143.55];assert.equal(expectedMarkers.flat().length,25);paper.questions.forEach((question,index)=>{const clip=question.audio.clips[0];assert.equal(fs.existsSync(path.resolve(__dirname,'..',clip.file)),true);assert.deepEqual(clip.markers.map(marker=>marker.time),expectedMarkers[index]);assert.deepEqual(clip.markers.map(marker=>marker.time),[...clip.markers].map(marker=>marker.time).sort((a,b)=>a-b));assert.ok(clip.markers.every(marker=>marker.time>=0&&marker.time<durations[index]));});
class SvgNode{constructor(name){this.name=name;this.attributes={};this.children=[];this.style={};this.dataset={};this.events={};this.textContent='';this.classList={contains:()=>false,toggle:()=>{}};}setAttribute(name,value){this.attributes[name]=String(value);}getAttribute(name){return this.attributes[name]||'';}append(...nodes){this.children.push(...nodes);}addEventListener(name,callback){(this.events[name]||=[]).push(callback);}closest(){return null;}querySelectorAll(){return [];}contains(){return false;}remove(){}get lastChild(){return this.children.at(-1);}}
const descendants=node=>[node,...node.children.flatMap(descendants)];const oldDocument=global.document,oldSymbols=global.BRAVURA_SYMBOLS;global.document={createElementNS:(_,name)=>new SvgNode(name),createElement:name=>new SvgNode(name),activeElement:null,querySelectorAll:()=>[]};global.BRAVURA_SYMBOLS=new Proxy({},{get:(_,key)=>String(key)});for(const [key,optionIndex]of[['q2',0],['q2a',0],['q2c',0],['q2d',0],['q2b',2],['q4',0],['q5',0]])for(const interactive of[false,true]){const wrap=new SvgNode('div');notation.renderSharedScore({innerHTML:'',querySelector:()=>wrap},{score:{sharedNotation:`ah-2025-${key}`,optionIndex}},answers,interactive?()=>{}:null,Object.fromEntries([...parts.keys()].map(id=>[id,'incorrect'])));const nodes=descendants(wrap);assert.ok(nodes.some(node=>node.name==='svg'));assert.ok(!nodes.some(node=>Object.values(node.attributes).some(value=>/NaN|undefined|Infinity/.test(value))),`${key} finite render`);if(interactive&&['q2','q4'].includes(key))assert.ok(nodes.some(node=>['q3-note-hit-area','q3-rhythm-hit-area','q3-barline-hit-area'].includes(node.attributes.class)),`${key} interactive target`);}
// Every actually printed note can be circled; missing-note slots stay editable.
const selectionWrap=new SvgNode('div'),selected=[];
notation.renderSharedScore({innerHTML:'',querySelector:()=>selectionWrap},{score:{sharedNotation:'ah-2025-q4'}},{},(id,value)=>selected.push([id,value]));
const circleTargets=descendants(selectionWrap).filter(node=>node.attributes['data-source-note-selection']==='q4c');
assert.equal(circleTargets.length,75,'71 printed melody notes plus four given bass notes');
assert.equal(new Set(circleTargets.map(node=>node.attributes['aria-label'])).size,75);
assert.ok(!circleTargets.some(node=>/Circle note [2-5] in bar 4 /.test(node.attributes['aria-label'])),'missing notes must retain their entry areas');
for(const target of circleTargets){target.events.click[0]();const value=selected.at(-1)[1];const correct=target.attributes['aria-label']==='Circle note 2 in bar 12 for the subdominant answer';assert.equal(mark('q4c',value),correct?1:0,target.attributes['aria-label']);}
assert.equal(selected.filter(([,value])=>value==='bar-12-bb').length,1,'official MI identifies the only B-flat');
global.document=oldDocument;global.BRAVURA_SYMBOLS=oldSymbols;assert.match(fs.readFileSync(path.join(__dirname,'../digitalquestionpapers.html'),'utf8'),/advanced-higher-2025-notation\.js/);console.log('Advanced Higher 2025 source, marking, audio and notation tests passed.');
