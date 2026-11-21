const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('../chord-generator-core'),D=require('../drum-machine-core'),T=require('../composition-templates'),data=require('../composition-template-data');
const window={MLH:{ChordGenerator:C,DrumMachine:D}};require('node:vm').runInNewContext(fs.readFileSync(require.resolve('../chord-generator-audio'),'utf8'),{window});const A=window.MLH.ChordAudio;
test('each sourced template is an eight-bar lead sheet that fits the keyboard and survives MIDI',()=>{
 assert.equal(T.list.length,10);assert.ok(T.list.some(t=>t.group==='Pop'));assert.ok(T.list.some(t=>t.group==='Traditional'));assert.ok(T.list.some(t=>t.group==='Classical'));
 for(const item of data){
  const p=T.create(item.id,()=>.1),[top,bottom]=p.timeSignature.split('/').map(Number),barBeats=top*4/bottom,total=barBeats*8;
  assert.equal(p.progressionBars,8);assert.equal(p.melodyBars,8);assert.equal(p.sections[0].chords.length,8);assert.equal(C.timeline(p).reduce((n,e)=>n+e.duration,0),total);
  assert.ok(p.melody.length>0);assert.ok(p.melody.every(n=>n.beat>=0&&n.beat+n.duration<=total&&n.midi>=60&&n.midi<=84));
  assert.match(item.source.url,/^https:\/\//);assert.match(item.source.sha256,/^[a-f\d]{64}$/);assert.ok(item.adaptations);
  const restored=C.importSongMidi(C.songMidi(p,A.events(p)));
  assert.deepEqual(restored.melody,p.melody);assert.equal(restored.sections[0].chords.length,8);assert.equal(restored.templateId,item.id);
  const portable=C.importSongMidi(new Uint8Array(fs.readFileSync(`data/composition-templates/${item.id}.mid`)));
  assert.deepEqual(portable.melody,p.melody);assert.equal(portable.progressionBars,8);
 }
});
test('templates get a new metre-matched random groove, repeated across eight linked bars',()=>{
 for(const item of T.list){
  const first=T.create(item.id,()=>0),other=T.create(item.id,()=>.8);
  assert.notDeepEqual(first.drums.patterns[0].tracks,other.drums.patterns[0].tracks,item.id);
  const [top,bottom]=first.timeSignature.split('/').map(Number),beats=top*4/bottom,steps=beats*4;
  for(const p of [first,other]){
   assert.equal(p.drums.patterns[0].bars,8);assert.ok(p.drums.linkedBars.every(Boolean));
   assert.ok(D.events(p.drums,beats*8,beats).length>0);
   for(const track of p.drums.patterns[0].tracks)for(let bar=1;bar<8;bar++)assert.deepEqual(track.steps.slice(bar*steps,(bar+1)*steps),track.steps.slice(0,steps));
  }
 }
});
test('loading a template does not mutate the bank or any other session',()=>{
 const snapshot=JSON.stringify(data),p=T.create('love-me-do',()=>0);p.melody[0].midi=90;p.sections[0].chords[0].symbol='B7';
 assert.equal(JSON.stringify(data),snapshot);assert.equal(T.create('love-me-do',()=>0).melody[0].midi,62);assert.throws(()=>T.create('missing'),/available template/);
});
test('source rhythms, rests, ties and half-bar chord changes are retained',()=>{
 const pop=T.create('love-me-do',()=>0);assert.deepEqual(pop.melody.slice(0,4).map(({midi,beat,duration})=>[midi,beat,duration]),[[62,0,2],[62,2,1],[65,3,.5],[67,3.5,1]]);
 const frere=T.create('frere-jacques',()=>0);assert.deepEqual(frere.melody.slice(-6).map(n=>n.midi),[72,67,72,72,67,72]);
 const ode=T.create('ode-to-joy',()=>0);assert.equal(ode.sections[0].chords[7].secondChord.symbol,'C');assert.equal(ode.melody.at(-1).beat+ode.melody.at(-1).duration,32);
});


test('new source inventories independently match every printed ABC note, rest and tie',()=>{
 const {spawnSync}=require('node:child_process'),path=require('node:path');
 const result=spawnSync('python3',[path.resolve(__dirname,'../scripts/composition/audit-template-additions.py')],{encoding:'utf8'});
 assert.equal(result.status,0,result.stdout+result.stderr);assert.equal(result.stdout.trim().split('\n').length,5);
 const {createHash}=require('node:crypto');
 for(const item of data.slice(5)){
  const raw=fs.readFileSync(path.resolve(__dirname,`../data/composition-templates/sources/${item.id}.abc`));
  assert.equal(createHash('sha256').update(raw).digest('hex'),item.source.sha256);
 }
 const sailor=T.create('drunken-sailor',()=>0);assert.equal(sailor.mode,'dorian');assert.equal(sailor.melody.find(n=>n.beat===21).midi,71);
 const skye=T.create('skye-boat-song',()=>0);assert.equal(skye.timeSignature,'3/4');assert.deepEqual(skye.melody.at(-1),{midi:62,beat:18,duration:6,velocity:120});
 const minuet=T.create('minuet-in-g',()=>0);assert.equal(minuet.melody.find(n=>n.beat===8.5).midi,78);
 const jingle=T.create('jingle-bells',()=>0);assert.equal(jingle.sections[0].chords[6].symbol,'D7');assert.equal(jingle.sections[0].chords[7].symbol,'G7');
 const clair=T.create('au-clair-de-la-lune',()=>0);assert.equal(clair.melody.at(-1).beat+clair.melody.at(-1).duration,30,'the final two beats are a source rest');
});
