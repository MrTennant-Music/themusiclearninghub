const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {scores,combinations,values,auditScore}=require('../scripts/build-music-games-n4-literacy.cjs');
const load=id=>JSON.parse(fs.readFileSync(`music-games/activities/hub-n4-${id}.json`,'utf8'));
test('N4 reading music preserves the complete pitch and rhythm inventory',()=>{
 assert.deepEqual(scores.map(s=>s.notes.map(n=>n.slice(0,2))),[
  [['G4','minim']],
  [['A4','crotchet'],['C5','minim']],
  [['E4','quaver'],['G4','quaver'],['B4','crotchet']],
  [['G4','semiquaver'],['A4','semiquaver'],['B4','semiquaver'],['A4','semiquaver'],['C5','crotchet']],
  [['D5','minim'],['E5','quaver'],['D5','quaver']]
 ]);
 assert.deepEqual(scores.map(s=>s.time),[2,3,2,2,3]);
 assert.deepEqual(scores.map(s=>s.end),['double','double','repeat','repeat','repeat']);
 assert.deepEqual(scores.map(s=>!!s.startRepeat),[false,false,false,false,true]);
 for(const s of scores){auditScore(s);const a=load(`reading-music-label-${s.number}`);assert.equal(a.items.some(i=>['Stave','Ascending','Descending','Step','Leap','Dot','Repetition'].includes(i.answer)),false);for(const i of a.items)for(const target of i.acceptedTargetIds||[])assert.ok(a.items.some(t=>t.id===target));}
});
test('N4 order has eight four-note combinations with distinct descending totals',()=>{
 assert.deepEqual(combinations.map(r=>r.length),Array(8).fill(4));
 assert.deepEqual(combinations.map(r=>r.reduce((n,v)=>n+values[v],0)),[5,4,3.75,3.5,3.25,3,2.75,2.5]);
});
test('N4 literacy covers all ten formats and retains correct sentence gaps',()=>{
 const activities=fs.readdirSync('music-games/activities').filter(f=>/^hub-n4-(music-literacy|reading-music-label)-.*\.json$/.test(f)).map(f=>JSON.parse(fs.readFileSync('music-games/activities/'+f)));
 assert.equal(activities.length,14);assert.equal(new Set(activities.map(a=>a.template)).size,10);
 const sort=load('music-literacy-sort-1');assert.equal(sort.items.length,24);assert.deepEqual([...new Set(sort.items.map(i=>i.group))].sort(),['Dynamics','Notation','Rhythms','Tempo','Time signatures']);
 const blank=load('music-literacy-blank-1');assert.ok(blank.items.some(i=>i.clozeGaps.length===2));for(const i of blank.items)for(const gap of i.clozeGaps)assert.equal(i.clozeText.slice(gap.start,gap.end),gap.text);
});
