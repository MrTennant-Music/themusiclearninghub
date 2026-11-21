const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../chord-generator-core'),library=require('../composition-progressions');

test('every major/minor length has 200 distinct source-backed musical progressions',()=>{
 assert.equal(library.entries.length,1200);
 assert.equal(new Set(library.entries.map(e=>e.id)).size,1200);
 for(const mode of ['major','minor'])for(const bars of [4,8,16]){
  const pool=library.entries.filter(e=>e.mode===mode&&e.bars===bars);
  assert.equal(pool.length,200);
  assert.equal(new Set(pool.map(e=>JSON.stringify(e.chords))).size,200);
  assert.ok(new Set(pool.filter(e=>e.family==='billboard').map(e=>e.source.artist)).size>=25);
  if(bars>4) assert.ok(pool.filter(e=>e.chords.some((chord,i)=>JSON.stringify(chord)!==JSON.stringify(e.chords[i%4]))).length>100,'Longer choices must include real harmonic development');
  for(const entry of pool){
   assert.equal(entry.chords.length,bars);
   assert.ok(entry.source.url||/^\d+$/.test(entry.source.datasetId));
   if(entry.family==='billboard')assert.match(entry.source.sha256,/^[a-f0-9]{64}$/);
   for(const [degree,quality] of entry.chords){
    assert.ok(Number.isInteger(degree)&&degree>=0&&degree<7);
    assert.ok(C.qualities[quality]);
    assert.ok(C.qualities[quality].every(interval=>C.modes[mode].includes((C.modes[mode][degree]+interval)%12)),entry.id);
   }
  }
 }
});

test('every library choice transposes correctly into all 24 keys without changing harmony or length',()=>{
 for(const mode of ['major','minor'])for(const bars of [4,8,16]){
  const base=C.progressionChoices(0,mode,bars);
  assert.equal(base.length,200);
  for(let key=0;key<12;key++){
   const choices=C.progressionChoices(key,mode,bars);
   assert.equal(new Set(choices.map(e=>e.symbols.join('|'))).size,200);
   choices.forEach((choice,index)=>{
    assert.equal(choice.symbols.length,bars);
    choice.symbols.forEach((symbol,i)=>{
     const actual=C.parse(symbol),original=C.parse(base[index].symbols[i]);
     assert.equal(actual.root,(original.root+key)%12);
     assert.equal(actual.quality,original.quality);
     assert.ok(C.notes(symbol).every(n=>C.modes[mode].includes((n-key+120)%12)));
    });
   });
  }
 }
});

function rng(seed=12345){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
test('shuffle visits the full phrase pool before repeating and never repeats across a bag boundary',()=>{
 for(const mode of ['major','minor'])for(const bars of [4,8]){
  const next=C.createProgressionShuffler(rng()),seen=new Set(),size=C.randomProgressionChoices(5,mode,bars).length;let current=[];
  for(let i=0;i<400;i++){
   const result=next(5,mode,bars,current),signature=result.join('|');
   assert.notEqual(signature,current.join('|'));
   if(i<size){assert.ok(!seen.has(signature));seen.add(signature);}
   current=result;
  }
  assert.equal(seen.size,size);
 }
});
test('shuffle keeps independent bags when switching keys, modes and lengths; it avoids the displayed song',()=>{
 const next=C.createProgressionShuffler(rng());
 const current=C.progressionChoices(0,'major',4)[0].symbols;
 assert.notDeepEqual(next(0,'major',4,current),current);
 const first=next(0,'minor',8),second=next(2,'major',8);
 assert.equal(first.length,8);assert.equal(second.length,8);
 const a=next(0,'major',4);assert.notDeepEqual(a,current);
});

test('eight-bar randomisation has phrase cadences in every major and minor key',()=>{
 for(const mode of ['major','minor'])for(let key=0;key<12;key++){
  const tonic=C.diatonic(key,mode)[0], dominantRoot=(key+7)%12;
  const choices=C.randomProgressionChoices(key,mode,8);
  assert.ok(choices.length>30,'Keep a varied pool of phrases');
  for(const {symbols} of choices){
   assert.equal(C.parse(symbols[0]).root,tonic.root);
   assert.equal(C.parse(symbols[6]).root,dominantRoot);
   assert.equal(C.parse(symbols[6]).quality,'');
   assert.equal(symbols[7],tonic.symbol);
   if(symbols[3]===tonic.symbol)assert.equal(C.parse(symbols[2]).root,dominantRoot);
   else assert.equal(C.parse(symbols[3]).root,dominantRoot);
  }
 }
});

test('four-bar Randomise restores the full library with tonic openings and extended chords',()=>{
 for(const mode of ['major','minor'])for(let key=0;key<12;key++){
  const choices=C.randomProgressionChoices(key,mode,4);
  assert.ok(choices.length>40);
  assert.equal(new Set(choices.map(c=>c.symbols.join('|'))).size,choices.length);
  assert.ok(choices.every(c=>c.symbols.length===4&&C.parse(c.symbols[0]).root===key));
  assert.ok(choices.some(c=>c.symbols.some(s=>C.parse(s).quality.includes('sus'))));
  assert.ok(choices.some(c=>c.symbols.some(s=>C.parse(s).quality.includes('7'))));
  // Every original sequence survives, either rotated to tonic or with its
  // first chord replaced; identical resulting loops share one shuffle entry.
  const signatures=new Set(choices.map(c=>c.symbols.join('|')));
  for(const source of C.progressionChoices(key,mode,4)){
   const symbols=source.symbols.map(symbol=>{
    const chord=C.parse(symbol);
    return mode==='minor'&&chord.root===(key+7)%12&&['m','m7'].includes(chord.quality)?symbol.replace(/m(7)?$/,(_,seven)=>seven?'7':''):symbol;
   });
   const first=symbols.findIndex(s=>C.parse(s).root===key);
   if(first>0)symbols.push(...symbols.splice(0,first));
   else if(first<0)symbols[0]=C.diatonic(key,mode)[0].symbol;
   assert.ok(signatures.has(symbols.join('|')),source.id);
  }
 }
});

test('minor studio progressions and chord palette use harmonic V and V7 in all keys',()=>{
 for(let key=0;key<12;key++){
  const dominant=(key+7)%12,choices=C.randomProgressionChoices(key,'minor',4);
  for(const {symbols} of choices)for(const symbol of symbols){const chord=C.parse(symbol);if(chord.root===dominant)assert.ok(!['m','m7'].includes(chord.quality));}
  const v=C.studioDiatonic(key,'minor')[4];assert.equal(v.root,dominant);assert.equal(v.quality,'');assert.equal(v.roman,'V');
  assert.equal((v.root+4)%12,(key+11)%12);
 }
});
