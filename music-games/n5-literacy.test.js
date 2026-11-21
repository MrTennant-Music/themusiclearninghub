const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {scores,combinations,values,auditScore}=require('../scripts/build-music-games-n5-literacy.cjs');
const root='music-games/activities/';
test('N5 original scores retain their exact pitch, rhythm, key and Scotch snap inventory',()=>{
 assert.deepEqual(scores.map(s=>s.notes.map(n=>n.slice(0,2))),[
  [['G4','dotted-crotchet'],['A4','quaver'],['B4','minim']],
  [['G4','dotted-quaver'],['A4','semiquaver'],['B4','crotchet']],
  [['F5','minim'],['D5','crotchet']],
  [['A4','dotted-minim'],['B4','crotchet']],
  [['G4','semiquaver'],['A4','dotted-quaver'],['B4','minim']]
 ]);
 assert.deepEqual(scores.map(s=>s.time),[4,2,3,4,3]);
 assert.deepEqual(scores.map(s=>s.key||null),[null,null,'G major','F major',null]);
 assert.deepEqual(scores.map(s=>s.end),['double','double','repeat','double','double']);
 assert.deepEqual(scores[4].scotchSnap,[0,1]);assert.ok(scores.every(s=>!s.tie));
 for(const score of scores){auditScore(score);const a=JSON.parse(fs.readFileSync(`${root}hub-n5-reading-music-label-${score.number}.json`));assert.ok(!a.items.some(i=>i.answer==='Sequence'));assert.ok(a.items.length<=12);for(const i of a.items)for(const id of i.acceptedTargetIds||[])assert.ok(a.items.some(t=>t.id===id));}
});
test('N5 rhythm combinations have distinct descending beat totals',()=>{
 assert.deepEqual(combinations.map(r=>r.length),Array(8).fill(4));
 assert.deepEqual(combinations.map(r=>r.reduce((n,v)=>n+values[v],0)),[7,6,4.5,4.25,4,3.75,3.5,2.5]);
});
test('N5 has fifteen valid activities across ten formats',()=>{
 const C=require('./core.js');
 const activities=fs.readdirSync(root).filter(f=>/^hub-n5-(music-literacy|reading-music-label)-.*\.json$/.test(f)).map(f=>JSON.parse(fs.readFileSync(root+f)));
 assert.equal(activities.length,14);assert.equal(new Set(activities.map(a=>a.template)).size,10);
 for(const a of activities){assert.deepEqual(C.validateActivity(a),[]);assert.equal(C.compatibility(a.template,a).ok,true);for(const i of a.items){for(const gap of i.clozeGaps||[])assert.equal(i.clozeText.slice(gap.start,gap.end),gap.text);assert.ok(!(i.distractors||[]).some(d=>d.toLowerCase()===i.answer.toLowerCase()));}}
 const sort=activities.find(a=>a.template==='group-sort');for(const group of new Set(sort.items.map(i=>i.group)))assert.ok(sort.items.filter(i=>i.group===group).length<=10);
});

test('N5 content follows the homepage Music Literacy concept grid',()=>{
 const {terms}=require('../scripts/build-music-games-n5-literacy.cjs');
 const {rows}=require('../shared/music-literacy-curriculum');
 const grid=rows.find(([level])=>level==='National 5')[1].join(' ');
 for(const concept of ['Scotch snap','Tones, semitones, accidentals','1st and 2nd time bars'])assert.ok(grid.includes(concept));
 const activities=fs.readdirSync(root).filter(f=>/^hub-n5-(music-literacy|reading-music-label)-.*\.json$/.test(f)).map(f=>JSON.parse(fs.readFileSync(root+f)));
 for(const a of activities){
  const content=JSON.stringify({description:a.description,items:a.items.map(i=>({prompt:i.prompt,answer:i.answer,distractors:i.distractors,group:i.group,clozeText:i.clozeText}))});
  assert.doesNotMatch(content,/\b(?:tie|ties|slur|octave|moderato)\b/i,a.id);
 }
 assert.equal(terms.length,20);
 for(const key of ['C major','G major','F major','A minor'])assert.ok(terms.some(t=>t[0]===key));
 const label=JSON.parse(fs.readFileSync(root+'hub-n5-reading-music-label-5.json'));
 assert.ok(label.items.some(i=>i.answer==='Scotch snap'));
});
