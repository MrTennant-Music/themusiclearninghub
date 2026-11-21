'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),React=require('react'),server=require('react-dom/server');
const a=require('./helpers/repeatsigns-harness.cjs')();
const plain=x=>JSON.parse(JSON.stringify(x));
const range=(from,to)=>Array.from({length:to-from+1},(_,i)=>from+i);
function route(q){
 const find=id=>q.required.find(p=>p.symbolId===id)?.barIndex;
 if(q.type==='straight-repeat')return [...range(0,find('end-repeat')),...range(find('start-repeat'),7)];
 if(q.type==='first-second')return [...range(0,6),...range(find('start-repeat'),5),7];
 if(q.type==='dc')return [...range(0,find('dc')),...range(0,7)];
 return [...range(0,7),...range(find('segno'),find('fine'))];
}
const correct=(q,placements)=>a.placementsMatch(q,placements)&&!a.wrongPlacements(q,placements).length&&!a.missingRequired(q,placements).length;
test('all levels and question types play the route described by their accepted symbols',()=>{
 for(const [level,settings]of Object.entries(a.LEVELS))for(const type of settings.types)for(let i=0;i<100;i++){
  const q=a.makeQuestion(level,[type]);assert.equal(q.type,type);assert.equal(q.bars.length,8);
  assert.deepEqual(plain(q.performedOrder),route(q));assert.equal(correct(q,q.required),true);
  assert.equal(new Set(q.required.map(p=>`${p.symbolId}:${p.barIndex}:${p.anchor}`)).size,q.required.length);
  for(const bar of q.bars){assert.equal(bar.notes.reduce((sum,n)=>sum+a.rhythm(n.rhythm).beats,0),q.timeSignature.beats);assert.ok(bar.notes.every(n=>Number.isFinite(n.freq)&&n.freq>0));}
  for(const required of q.required.filter(p=>!p.optional)){
   assert.equal(correct(q,q.required.filter(p=>p!==required)),false,'missing '+required.symbolId);
   assert.equal(correct(q,q.required.map(p=>p===required?{...p,barIndex:(p.barIndex+1)%8}:p)),false,'misplaced '+required.symbolId);
  }
 }
});
test('symbol buttons have accessible names and armed state, and scores render finite geometry',()=>{
 for(const type of a.LEVELS.AH.types){const q=a.makeQuestion('AH',[type]);
  const buttons=server.renderToStaticMarkup(React.createElement(a.RepeatAnswers,{question:q,selectedSymbolId:null,setSelectedSymbolId(){},feedback:null}));
  for(const symbol of a.answerSymbolsForQuestion(q))assert.ok(buttons.includes(`aria-label="${symbol.label}"`));
  const score=server.renderToStaticMarkup(React.createElement(a.Score,{question:q,selectedSymbolId:'end-repeat',placements:[],wrong:[],missing:[],feedback:null}));
  assert.doesNotMatch(score,/NaN|Infinity/);assert.match(score,/tabindex="0"/);
 }
});
test('each end position is available and balanced in straight-repeat questions',()=>{
 const counts=Array(8).fill(0),starts=new Set();
 for(let i=0;i<2800;i++){const q=a.makeQuestion('N4');const end=q.required.find(p=>p.symbolId==='end-repeat').barIndex;counts[end]++;starts.add(q.required[0].barIndex);}
 assert.equal(counts[0],0);for(const count of counts.slice(1))assert.ok(count>310&&count<490,JSON.stringify(counts));assert.equal(starts.size,7);
});
test('shipped Repeat Signs runtime matches its source',()=>{
 const Babel=require('@babel/standalone');const page=fs.readFileSync('repeatsigns.html','utf8');const source=page.match(/<script type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/)[1];
 assert.equal(fs.readFileSync('generated-runtimes/repeatsigns-1.js','utf8'),Babel.transform(source,{presets:['react'],sourceMaps:false,comments:false,compact:true}).code+'\n');
});

test('printed accidentals agree with playback separately in each octave',()=>{
 const generator=require('./helpers/repeatsigns-harness.cjs')();
 let crossOctaveSharps=0;
 for(let i=0;i<10000;i++){
  const q=generator.makeQuestion('AH');
  for(const bar of q.bars){const memory={},seenAlterations={};
   for(const n of bar.notes){
    const pitch=n.letter+n.octave;
    if(n.writtenAccidental!==null){
     if(seenAlterations[n.letter]!==undefined&&seenAlterations[n.letter]!==n.octave)crossOctaveSharps++;
     seenAlterations[n.letter]=n.octave;
     memory[pitch]=n.writtenAccidental;
    }
    const accidental=memory[pitch]??q.key.keyAccidentals[n.letter]??0;
    const natural=12*(n.octave+1)+{C:0,D:2,E:4,F:5,G:7,A:9,B:11}[n.letter];
    assert.equal(natural+accidental,n.midi,`${q.key.id}, bar ${bar.barIndex+1}, ${pitch}`);
   }
  }
 }
 assert.ok(crossOctaveSharps>0,'sample exercises a sharp repeated in another octave');
});
