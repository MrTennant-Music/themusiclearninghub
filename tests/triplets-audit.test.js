'use strict';const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),React=require('react'),server=require('react-dom/server'),Babel=require('@babel/standalone');const load=require('./helpers/triplets-harness.cjs');
test('all generated triplets fill their metre, have three adjacent notes, and cover every target position',()=>{
 const a=load(),types={},metres={},bars=Array(8).fill(0),beats={};
 for(let i=0;i<6000;i++){
  const q=a.createQuestion(),layouts=a.buildLayouts(q),group=a.findNoteGroup(layouts,q.targetNoteIds);types[q.tripletType.id]=(types[q.tripletType.id]||0)+1;metres[q.timeSignature.id]=(metres[q.timeSignature.id]||0)+1;bars[q.targetBarIndex]++;
  assert.equal(q.targetNoteIds.length,3);assert.equal(a.tripletTypeFromGroup(group).id,q.tripletType.id);assert.ok(group.indexes.every((n,i)=>i===0||n===group.indexes[i-1]+1));
  for(const bar of q.bars)assert.ok(Math.abs(bar.notes.reduce((s,n)=>s+a.rhythmInfo(n.rhythm).beats,0)-q.timeSignature.beats)<1e-8);
  const before=q.bars[q.targetBarIndex].notes.slice(0,group.indexes[0]).reduce((s,n)=>s+a.rhythmInfo(n.rhythm).beats,0);beats[`${q.timeSignature.id}/${q.tripletType.id}/${before}`]=true;
  if(q.tripletType.id==='quaver-triplet'){const beam=a.getBeamGroups(q.bars[q.targetBarIndex].notes).find(g=>g.start===group.indexes[0]);assert.equal(beam.end,group.indexes.at(-1));}
 }
 for(const n of Object.values(types))assert.ok(n>2800&&n<3200);for(const n of Object.values(metres))assert.ok(n>1800&&n<2200);for(const n of bars)assert.ok(n>600&&n<900);
 assert.ok(beats['3/4/quaver-triplet/1']);assert.ok(beats['4/4/quaver-triplet/1']);assert.ok(beats['4/4/quaver-triplet/2']);assert.ok(beats['4/4/crotchet-triplet/1']);
});
test('A minor leading-note accidentals are repeated for a new octave only',()=>{
 const a=load(),key=a.KEYS.find(k=>k.id==='Am'),notes=[{letter:'G',step:2},{letter:'G',step:9},{letter:'G',step:2},{letter:'G',step:9}];
 assert.deepEqual(Array.from(a.applyWrittenAccidentals(notes,key),n=>n.writtenAccidental),[1,1,null,null]);
});
test('actual marking accepts either selection order and rejects wrong groups and duplicate notes',()=>{
 const a=load();
 for(let i=0;i<50;i++){
  const question=a.createQuestion();
  assert.equal(a.checkSelection(question,[...question.targetNoteIds].reverse()),true);
  const wrongBar=question.bars.find((_,bar)=>bar!==question.targetBarIndex);
  assert.equal(a.checkSelection(question,wrongBar.notes.slice(0,3).map(note=>note.id)),false);
  assert.equal(a.checkSelection(question,[question.targetNoteIds[0],question.targetNoteIds[0],question.targetNoteIds[1]]),false);
  assert.equal(a.checkSelection(question,[]),false);
 }
});
test('score notes have keyboard targets and become inactive after marking',()=>{
 const a=load(),q=a.createQuestion();for(const feedback of [null,'incorrect']){
  const html=server.renderToStaticMarkup(React.createElement(a.ScoreArea,{question:q,selectedNoteIds:[],feedback,onToggleNote(){}})),labels=[...html.matchAll(/aria-label="(Select note [^"]+)"/g)].map(m=>m[1]);
  assert.equal(labels.length,q.bars.flatMap(b=>b.notes).length);assert.equal(labels.length,new Set(labels).size);assert.match(html,feedback?/tabindex="-1"/:/tabindex="0"/);assert.doesNotMatch(html,/NaN|Infinity/);
 }
});
test('worksheets vary keys, metres, group counts and triplet kinds independently and draw crotchet brackets',()=>{
 const a=require('./helpers/worksheet-generator-harness.cjs')({version:1,activityId:'triplets',sourceUrl:'http://localhost:8765/rhythmicdictation.html?level=H&exercise=identifyTriplet',settings:{level:'H'}}),keys={},metres={},kinds={},combinations=new Set();
 for(let i=0;i<6000;i++){
  const q=a.makeQuestion(i%20),expected=Number(q.timeSignature[0]);keys[q.key.id]=(keys[q.key.id]||0)+1;metres[q.timeSignature]=(metres[q.timeSignature]||0)+1;
  assert.ok(q.tripletGroups.length>=1&&q.tripletGroups.length<=3);combinations.add(`${q.timeSignature}/${q.tripletGroups.length}`);
  for(const bar of q.bars){
   const total=bar.reduce((s,n)=>s+(n.tripletRhythm==='triplet-quaver'?1/3:n.tripletRhythm==='triplet-crotchet'?2/3:({semibreve:4,'dotted-minim':3,minim:2,crotchet:1,quaver:.5}[n.rhythm])),0);assert.ok(Math.abs(total-expected)<1e-8);
   const shown=new Set();for(const note of bar)if(q.key.id==='a-minor'&&[2,9].includes(note.step)){assert.equal(note.writtenAccidental,shown.has(note.step)?null:'sharp');shown.add(note.step);}
  }
  for(const group of q.tripletGroups){kinds[group.type]=(kinds[group.type]||0)+1;combinations.add(`${q.key.id}/${group.type}`);const members=q.barlineItems.filter(n=>n.tripletGroupId===group.id);assert.equal(members.length,3);assert.ok(members.every(n=>n.beamGroupId===(group.type==='quaver'?group.id:null)),'crotchet triplets must remain unbeamed');}
  if(i<100){
   const marked=server.renderToStaticMarkup(React.createElement(a.Staff,{question:q,completed:true})),blank=server.renderToStaticMarkup(React.createElement(a.Staff,{question:q,completed:false}));
   assert.equal((marked.match(/data-triplet-bracket=/g)||[]).length,q.tripletGroups.filter(g=>g.type==='crotchet').length);assert.equal((marked.match(/data-triplet-number=/g)||[]).length,q.tripletGroups.filter(g=>g.type==='quaver').length);assert.doesNotMatch(blank,/data-triplet-bracket=|data-triplet-number=/);assert.doesNotMatch(marked,/NaN|Infinity/);
  }
 }
 for(const n of Object.values(keys))assert.equal(n,1500);for(const n of Object.values(metres))assert.equal(n,2000);assert.ok(Math.abs(kinds.quaver-kinds.crotchet)<=1);
 for(const metre of ['2/4','3/4','4/4'])for(const count of [1,2,3])assert.ok(combinations.has(`${metre}/${count}`));for(const key of Object.keys(keys))for(const kind of ['quaver','crotchet'])assert.ok(combinations.has(`${key}/${kind}`));
});
test('Triplets and worksheet runtimes match the current sources',()=>{
 const options={presets:['react'],sourceMaps:false,comments:false,compact:true},page=fs.readFileSync('rhythmicdictation.html','utf8'),source=page.match(/data-runtime="rhythmicdictation-triplets-1\.js">([\s\S]*?)<\/script>/)[1];
 assert.equal(fs.readFileSync('generated-runtimes/rhythmicdictation-triplets-1.js','utf8'),Babel.transform(source,options).code+'\n');assert.equal(fs.readFileSync('generated-runtimes/worksheetgenerator-2.js','utf8'),Babel.transform(fs.readFileSync('worksheet-generic.jsx','utf8'),options).code+'\n');
});

test('valid alternative crotchet groupings are accepted without accepting an underfilled normal bar',()=>{
 const a=load(),q=a.createQuestion();q.timeSignature=a.TIME_SIGNATURES.find(t=>t.id==='3/4');q.tripletType=a.TRIPLET_TYPES.find(t=>t.id==='crotchet-triplet');q.targetBarIndex=0;q.targetGroupId='target-0';q.targetNoteIds=['0-0','0-1','0-2'];
 q.bars=Array.from({length:8},(_,bar)=>({notes:Array.from({length:bar===0?4:3},(_,i)=>({id:`${bar}-${i}`,rhythm:bar===0&&i<3?'triplet-crotchet':'crotchet',letter:'C',step:5,targetGroupId:bar===0&&i<3?'target-0':null}))}));
 assert.equal(a.tripletSelectionIsValid(q,['0-0','0-1','0-2']),true);assert.equal(a.tripletSelectionIsValid(q,['0-1','0-2','0-3']),true);assert.equal(a.tripletSelectionIsValid(q,['1-0','1-1','1-2']),false);assert.equal(a.tripletSelectionIsValid(q,['0-0','0-2','0-3']),false);
});

test('feedback does not advance when a toolbar control or menu is pressed',()=>{
 const page=fs.readFileSync('rhythmicdictation.html','utf8');
 const source=page.match(/data-runtime="rhythmicdictation-1\.js">([\s\S]*?)<\/script>/)[1];
 const ast=Babel.packages.parser.parse(source,{plugins:['jsx']});
 const app=ast.program.body.find(node=>node.type==='FunctionDeclaration'&&node.id.name==='App');
 const handler=app.body.body.find(node=>node.type==='FunctionDeclaration'&&node.id.name==='handleFeedbackAdvance');
 let advances=0;
 const fn=vm.runInNewContext('('+Babel.packages.generator.default(handler).code+')',{feedback:{correct:false},fadeToNextQuestion:()=>advances++});
 fn({target:{closest:()=>({tagName:'BUTTON'})}});assert.equal(advances,0);
 fn({target:{closest:()=>null}});assert.equal(advances,1);
});
