'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),Babel=require('@babel/standalone'),React=require('react');
const page=fs.readFileSync('practicequestions.html','utf8'),source=page.match(/<script type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/)[1],runtime=fs.readFileSync('generated-runtimes/practicequestions-1.js','utf8');
test('the actual browser asset is the current transpilation and its cache hash matches',()=>{
 const expected=Babel.transform(source,{filename:'practicequestions.html',presets:['react'],sourceMaps:false,comments:false,compact:true}).code+'\n';
 assert.equal(runtime,expected,'rebuild the browser asset after changing JSX');
 const hash=crypto.createHash('sha256').update(runtime).digest('hex').slice(0,12);assert.ok(page.includes(`practicequestions-1.js?v=${hash}`));
});
test('the shipped browser runtime generates complete papers at every level',()=>{
 const launch='ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App,null));';assert.ok(runtime.includes(launch));
 const window={PracticeMelodyGenerator:require('../practice-melody-generator.js')};for(const file of ['bravura-symbols.js','shared/shared-notation-config.js'])vm.runInNewContext(fs.readFileSync(file,'utf8'),{window});
 let seed=1;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const c={window,React,console,performance,Math:math,Date:class extends Date{static now(){return 1794355200000;}},setTimeout,clearTimeout};vm.createContext(c);
 vm.runInContext(runtime.replace(launch,'globalThis.shipped={makeQuestion,makeEscapePracticeQuestion,practiceQuestionTypesForLevel,defaultPracticeQuestionTypesForLevel,timeSignatureForBar};'),c);
 const core=require('../music-escape/core'),data=require('../music-escape/content');
 const formats=new Set();
 for(const level of ['N3','N4','N5','H','AH'])for(let i=1;i<=20;i++){
  const rooms=core.generate(i,{level},data);
  const kinds=rooms.map(room=>room.literacy.kind);
  assert.equal(new Set(kinds).size,rooms.length);
  if(['H','AH'].includes(level)){
   assert(kinds.slice(0,3).includes('rhythmDictation'));
  }
  for(const room of rooms){
   const clue=room.literacy;
   formats.add(clue.kind);
   assert.equal(Number(room.code[room.codeOrder.indexOf(1)]),clue.digit);
   if(clue.kind==='keyboardSingle'){
    assert(['H','AH'].includes(level));
    const single=c.shipped.makeEscapePracticeQuestion(level,room.literacySeed);
    assert.equal(single.bars.length,4);
    assert.equal(single.subquestions.length,1);
    for(const bar of single.bars){
     assert.ok(Math.abs(bar.notes.reduce((beats,note)=>beats+note.beats,0)-bar.timeSignature.beats)<1e-7);
    }
    const notes=single.bars[clue.barIndex].notes;
    assert(notes.every(note=>[60,62,64,65,67,69,71].includes(note.midi)));
    assert.equal(clue.barIndex,3);
    assert.equal(notes.length,1);
    assert.equal(notes[0].rhythm,'semibreve');
   }

  }
  seed=i;const q=c.shipped.makeQuestion(level,0,c.shipped.defaultPracticeQuestionTypesForLevel(level));assert.equal(q.subquestions.length,level==='AH'?8:6);assert.equal(q.bars.length,['H','AH'].includes(level)?16:8);
  q.bars.forEach((bar,index)=>{const s=c.shipped.timeSignatureForBar(q,index);assert.ok(Math.abs(bar.notes.reduce((n,note)=>n+note.beats,0)-s.top*4/s.bottom)<1e-7);});
 }
 assert.deepEqual([...formats].sort(),['accidentals','articulation','barlines','cadences','chord','chordBassLine','chordInversion','dynamics','enharmonic','follow','interval','key','keyboardNote','keyboardSingle','melodicDictation','noteNames','noteValue','repeats','rest','rhythmDictation','rhythmSum','scaleDegrees','tempo','time','transpose','triplets']);
});
