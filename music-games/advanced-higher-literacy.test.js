const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {scores,combinations,values,auditScore,pitchStep,triads}=require('../scripts/build-music-games-advanced-higher-literacy.cjs');
const root='music-games/activities/';
test('Advanced Higher scores preserve ledger-line notes, keys, ties and syncopation',()=>{
 assert.deepEqual(scores.map(s=>s.time),[[5,4],[4,4],[3,4],[4,4],[5,4]]);
 assert.deepEqual(scores.map(s=>s.notes.map(n=>[n.pitch,n.rhythm])),[
  [['C2','minim'],['D3','minim'],['E4','crotchet']],
  [['F4','dotted-minim'],['G4','crotchet']],
  [['D3','minim'],['F3','crotchet']],
  [['G4','dotted-crotchet'],['G4','quaver'],['A4','minim']],
  [['G4','quaver'],['A4','crotchet'],['B4','crotchet'],['C5','crotchet'],['D5','crotchet'],['E5','quaver']]
 ]);
 assert.deepEqual(scores.map(s=>s.clef),['bass','treble','bass','treble','treble']);
 assert.equal(pitchStep('C2','bass'),-4);assert.equal(pitchStep('E4','bass'),12);
 assert.deepEqual(scores.map(s=>s.key||null),[null,'D major','B flat major',null,null]);
 assert.deepEqual(scores[3].tie,[0,1]);assert.equal(scores[3].notes[0].pitch,scores[3].notes[1].pitch);
 assert.equal(scores[4].syncopation,undefined);
 const fifth=JSON.parse(fs.readFileSync(root+'hub-ah-reading-music-label-5.json'));assert.ok(!fifth.items.some(i=>['Syncopation','Crotchet','Quaver'].includes(i.answer)));
 for(const spec of scores){auditScore(spec);assert.equal(spec.end,'double');const a=JSON.parse(fs.readFileSync(root+`hub-ah-reading-music-label-${spec.number}.json`));assert.ok(a.items.length<=12);if(spec.key)assert.equal(a.items.find(i=>i.answer==='Time signature').x,315/8);}
 const svg=fs.readFileSync('music-games/assets/music-literacy/ah/reading-music-1.svg','utf8');assert.ok(!svg.includes('NaN'));assert.ok(svg.includes('y1="572"'));assert.ok(svg.includes('y1="236"'));
});
test('Advanced Higher inversion cards spell all eight keys correctly',()=>{
 const natural={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
 const midi=p=>Number(p.slice(-1))*12+natural[p[0]]+(p.includes('#')?1:p.includes('b')?-1:0);
 const roots={'C major':0,'G major':7,'F major':5,'A minor':9,'D major':2,'B flat major':10,'E minor':4,'D minor':2};
 for(const [position,cards]of Object.entries(triads)){
  assert.equal(cards.length,8);
  for(const [name,notes]of cards){const third=name.includes('minor')?3:4,root=roots[name],pcs=notes.map(n=>(midi(n)-root+120)%12);
   assert.deepEqual([...pcs].sort((a,b)=>a-b),[0,third,7],name+' '+position);
   assert.equal(pcs[0],position==='Root position'?0:position==='First inversion'?third:7);
   assert.ok(notes.every((n,i)=>i===0||midi(n)>midi(notes[i-1])));
  }
 }
});
test('Advanced Higher ordering retains eight distinct totals including tied combinations',()=>{
 assert.deepEqual(combinations.map(row=>row.reduce((n,v)=>n+values[v],0)),[7.75,7,6.25,4.75,4.25,3.75,3.5,3]);
 const a=JSON.parse(fs.readFileSync(root+'hub-ah-music-literacy-order-1.json'));assert.ok(a.items[2].answer.includes('tied'));assert.ok(a.items[3].answer.includes('tied'));
});
test('Advanced Higher activities follow the concept grid and game limits',()=>{
 const C=require('./core.js'),activities=fs.readdirSync(root).filter(f=>/^hub-ah-(music-literacy|reading-music-label)-.*\.json$/.test(f)).map(f=>JSON.parse(fs.readFileSync(root+f)));
 assert.equal(activities.length,14);assert.equal(new Set(activities.map(a=>a.template)).size,10);
 for(const a of activities){assert.deepEqual(C.validateActivity(a),[]);assert.equal(C.compatibility(a.template,a).ok,true);for(const i of a.items){for(const gap of i.clozeGaps||[])assert.equal(i.clozeText.slice(gap.start,gap.end),gap.text);assert.ok(!i.distractors.some(d=>d.toLowerCase()===i.answer.toLowerCase()));}}
 const sort=activities.find(a=>a.template==='group-sort'),groups=[...new Set(sort.items.map(i=>i.group))];assert.equal(groups.length,3);assert.ok(!groups.includes('Key signatures'));assert.ok(!groups.includes('Repeat directions'));assert.ok(!groups.includes('Time signatures'));assert.ok(!groups.includes('Chromatic intervals'));assert.ok(!sort.items.some(i=>['Augmented fourth','Diminished fifth','Tritone'].includes(i.answer)));assert.ok(!groups.includes('Extended and altered chords'));assert.ok(!sort.items.some(i=>['Dominant seventh','Diminished seventh','Added sixth','Augmented triad'].includes(i.answer)));for(const group of groups)assert.ok(sort.items.filter(i=>i.group===group).length<=10);
 const grid=fs.readFileSync('index.html','utf8').split('["Advanced Higher", [')[1].split('const appData = [')[0];for(const name of ['Enharmonic equivalent','Tritone','Ties','Syncopated rhythms','5/4','Dal segno','Fine'])assert.ok(grid.includes(name));
});
