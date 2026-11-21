const test=require('node:test'),assert=require('node:assert/strict');
const {score,build}=require('../scripts/build-music-games-literacy-label.cjs');
const C=require('./core.js');
test('the approved opening bar contains E crotchet and G minim in treble 3/4',()=>{
 assert.equal(score.clef,'treble');assert.deepEqual(score.timeSignature,[3,4]);
 assert.deepEqual(score.bars[0].notes.map(n=>[n.pitch,n.rhythm,n.beats,n.diatonicStepsAboveE4]),[['E4','crotchet',1,0],['G4','minim',2,2]]);
 assert.equal(score.bars[0].notes.reduce((n,v)=>n+v.beats,0),3);
 assert.equal(score.bars[0].barline,'single');
 const {svg,targets}=build();
 assert.equal(targets.length,7);assert.deepEqual(targets.map(t=>t[0]),['Treble clef','Time signature','Bar line','E','G','Crotchet','Minim']);
 for(const glyph of ['gClef','timeSig3','timeSig4','noteheadBlack','noteheadHalf'])assert.ok(svg.includes(`data-symbol="${glyph}"`));
 const e=targets.find(t=>t[0]==='E'),g=targets.find(t=>t[0]==='G');
 assert.equal(e[2]-g[2],42,'E and G occupy consecutive staff lines');
 assert.ok(targets.find(t=>t[0]==='Crotchet')[2]<e[2]);assert.ok(targets.find(t=>t[0]==='Minim')[2]<g[2]);
});
test('the label activity preserves all seven targets and portable notation image',()=>{
 const activity=require('./activities/hub-n3-reading-music-label-1.json');
 assert.deepEqual(C.validateActivity(activity),[]);assert.equal(activity.items.length,7);
 assert.ok(activity.diagram.src.startsWith('data:image/png;base64,'));
 for(const [i,target]of build().targets.entries()){
  assert.equal(activity.items[i].answer,target[0]);
  assert.equal(activity.items[i].x,target[1]/score.width*100);
  assert.equal(activity.items[i].y,target[2]/score.height*100);
 }
});


test('each note name and its rhythm are interchangeable only within the same note',()=>{
 const activity=C.normalize(require('./activities/hub-n3-reading-music-label-1.json'));
 const M=require('./diagram-core.js');
 const byName=Object.fromEntries(activity.items.map(i=>[i.answer,i]));
 const placements=Object.fromEntries(activity.items.map(i=>[i.id,i.id]));
 for(const [a,b]of [['E','Crotchet'],['G','Minim']]){
  placements[byName[a].id]=byName[b].id;placements[byName[b].id]=byName[a].id;
  assert.equal(M.isCorrectTarget(activity.items,byName[a].id,byName[b].id),true);
  assert.equal(M.isCorrectTarget(activity.items,byName[b].id,byName[a].id),true);
 }
 assert.equal(M.score(activity.items,placements).correct,7);
 assert.equal(M.isCorrectTarget(activity.items,byName.E.id,byName.G.id),false);
 assert.equal(M.isCorrectTarget(activity.items,byName.Minim.id,byName.Crotchet.id),false);
 assert.equal(M.isCorrectTarget(activity.items,byName['Treble clef'].id,byName['Time signature'].id),false);
 assert.equal(M.isCorrectTarget(activity.items,byName.E.id,null),false);
});

test('Reading Music 2–5 preserve every approved pitch, rhythm and bar total',()=>{
 const {sets,build,audit}=require('../scripts/build-music-games-literacy-label-sets.cjs');
 const expected={2:[[['C5','semibreve',4]]],3:[[['A4','dottedMinim',3],['F4','crotchet',1]]],4:[[['B4','minim',2]],[['B4','minim',2]]],5:[[['D5','minim',2],['E5','crotchet',1]]]};
 const M=require('./diagram-core.js');
 for(const spec of sets){
  assert.deepEqual(spec.bars.map(b=>b.notes.map(n=>[n.pitch,n.rhythm,n.beats])),expected[spec.number]);
  assert.doesNotThrow(()=>audit(spec));assert.equal(spec.bars.at(-1).barline,'double');
  const {svg,targets,notes}=build(spec);
  const activity=C.normalize(require(`./activities/hub-n3-reading-music-label-${spec.number}.json`));
  if(spec.number===2){
   assert.ok(activity.items.some(i=>i.answer==='Slow'));assert.ok(activity.items.some(i=>i.answer==='Quiet'));
   assert.ok(!activity.items.some(i=>['Adagio','Piano'].includes(i.answer)));
   assert.ok(svg.includes('Adagio'));assert.ok(svg.includes('data-symbol="piano"'));
  }
  assert.deepEqual(C.validateActivity(activity),[]);
  if(spec.number===3){
   assert.deepEqual(activity.items.map(i=>i.answer),['A','F','Dotted minim','Crotchet','Loud','Fast','Double bar line']);
   assert.ok(!svg.includes('marker-end='));
   assert.ok(svg.includes('Allegro'));assert.ok(svg.includes('data-symbol="forte"'));
   assert.ok(svg.includes('data-symbol="augmentationDot"'));
  }
  assert.equal(activity.items.length,targets.length);
  const placements=Object.fromEntries(activity.items.map(i=>[i.id,i.id]));
  for(const [a,b]of spec.equivalentPairs){
   const first=activity.items.find(i=>i.answer===a),second=activity.items.find(i=>i.answer===b);
   placements[first.id]=second.id;placements[second.id]=first.id;
  }
  assert.equal(M.score(activity.items,placements).correct,activity.items.length);
  for(const note of notes){
   const steps={E4:0,F4:1,G4:2,A4:3,B4:4,C5:5,D5:6,E5:7};
   assert.equal(note.y,488-steps[note.pitch]*21);
   assert.ok(note.y>=320&&note.y<=488,'N3 noteheads stay inside the stave');
  }
  assert.ok(svg.includes('data-symbol="gClef"'));
 }
 const fourth=build(sets.find(s=>s.number===4)).svg;
 assert.ok(fourth.includes('data-hairpin="crescendo"'));assert.ok(fourth.includes('data-hairpin="diminuendo"'));
});
