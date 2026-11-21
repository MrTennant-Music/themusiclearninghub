const test=require('node:test'),assert=require('node:assert/strict'),C=require('./core');
const policy=require('../scripts/music-games-excluded-concepts.cjs');
test('excluded concepts are absent from every published activity and choice bank',()=>{
 for(const activity of C.SEEDS){
  assert.deepEqual(C.validateActivity(activity),[],activity.id);
  for(const item of activity.items){assert.equal(policy.excludedItem(item),false,activity.id+': '+item.prompt);for(const value of [...item.distractors,...(item.answerOptions||[])])assert.equal(policy.excludedName(value),false,activity.id+': '+value);}
 }
});
test('all quiz levels omit the requested source IDs and have accurate counts',()=>{
 const builder=require('../scripts/build-music-games-level-tests.cjs'),D=require('../music-dictionary/music-concepts-data');
 for(const [code,label]of builder.levels){assert.ok(builder.entries(code).every(entry=>!policy.ids.has(entry.conceptId)));for(const a of C.SEEDS.filter(a=>a.specialMode==='level-test'&&a.level===code))assert.equal(a.conceptCount,a.collectionId?a.items.length:D.concepts.filter(c=>c.level===label&&!policy.ids.has(c.id)).length);}
});
test('exclusions preserve named intervals and unrelated chord concepts',()=>{
 for(const answer of ['Chord','Broken chord / arpeggio','Tritone','Semitone','Tone','Octave','Perfect cadence','Augmented triad'])assert.equal(policy.excludedItem({answer}),false,answer);
});
