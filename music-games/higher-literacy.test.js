const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {scores,combinations,values,auditScore,pitchStep}=require('../scripts/build-music-games-higher-literacy.cjs');
const root='music-games/activities/';
test('Higher scores preserve the complete pitch, rhythm, articulation and rest inventory',()=>{
 assert.deepEqual(scores.map(s=>s.time),[[4,4],[9,8],[3,4],[4,4],[4,4]]);
 assert.deepEqual(scores.map(s=>s.notes.map(n=>[n.pitch||'rest',n.rhythm])),[
  [['G2','dotted-minim'],['D3','crotchet']],
  [['G4','dotted-minim'],['B4','dotted-crotchet']],
  [['E4','quaver'],['G4','quaver'],['A4','quaver'],['B4','minim']],
  [['E4','crotchet'],['G4','crotchet'],['C5','minim']],
  [['rest','crotchet-rest'],['G4','minim'],['rest','quaver-rest'],['A4','quaver']]
 ]);
 assert.deepEqual(scores.map(s=>s.clef),['bass','treble','treble','treble','treble']);
 assert.equal(scores[1].key,'G major');assert.deepEqual(scores[3].slur,[0,1]);
 assert.equal(scores[0].notes[1].articulation,undefined);assert.equal(scores[0].notes[1].targetNotehead,true);assert.equal(scores[3].notes[2].articulation,undefined);
 assert.deepEqual(scores[2].notes.filter(n=>n.triplet).map(n=>n.beam),['a','a','a']);
 assert.equal(pitchStep('G2','bass'),0);assert.equal(pitchStep('F3','bass'),6);assert.equal(pitchStep('E4','treble'),0);
 for(const score of scores){auditScore(score);assert.equal(score.end,'double');const a=JSON.parse(fs.readFileSync(root+`hub-h-reading-music-label-${score.number}.json`));assert.ok(a.items.length<=12);for(const i of a.items)for(const id of i.acceptedTargetIds||[])assert.ok(a.items.some(t=>t.id===id));}
});
test('Higher ordering includes rests and distinct descending beat totals',()=>{
 assert.deepEqual(combinations.map(row=>row.reduce((n,v)=>n+values[v],0)),[7.5,6.5,5,4.75,4.5,4,3.5,2.75]);
 assert.ok(combinations.every(row=>row.some(r=>r.endsWith('-rest'))));
});
test('Higher catalogue follows the literacy grid across all ten formats',()=>{
 const C=require('./core.js');
 const activities=fs.readdirSync(root).filter(f=>/^hub-h-(music-literacy|reading-music-label)-.*\.json$/.test(f)).map(f=>JSON.parse(fs.readFileSync(root+f)));
 assert.equal(activities.length,14);assert.equal(new Set(activities.map(a=>a.template)).size,10);
 for(const a of activities){assert.deepEqual(C.validateActivity(a),[]);assert.equal(C.compatibility(a.template,a).ok,true);for(const item of a.items){for(const gap of item.clozeGaps||[])assert.equal(item.clozeText.slice(gap.start,gap.end),gap.text);assert.ok(!item.distractors.some(d=>d.toLowerCase()===item.answer.toLowerCase()));}}
 const sort=activities.find(a=>a.template==='group-sort'),groups=[...new Set(sort.items.map(i=>i.group))];assert.equal(groups.length,8);for(const group of groups)assert.ok(sort.items.filter(i=>i.group===group).length<=10);
 for(const name of ['Chords','Scale degrees','Rests','Time signatures','Articulation and phrasing'])assert.ok(groups.includes(name));
 const grid=fs.readFileSync('index.html','utf8').split('["Higher", [')[1].split('["Advanced Higher", [')[0];
 for(const concept of ['Bass clef','Triplet quavers','Phrase mark','Slurs','Staccato','Da capo'])assert.ok(grid.includes(concept));
});

test('Higher Reading Music places D on its notehead without a Staccato task',()=>{
 const a=JSON.parse(fs.readFileSync(root+'hub-h-reading-music-label-1.json'));
 assert.ok(!a.items.some(i=>i.answer==='Staccato'));
 const d=a.items.find(i=>i.answer==='D');assert.equal(d.x,80);assert.equal(d.y,50.5);
});
