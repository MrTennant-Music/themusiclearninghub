const overrides=require('../music-dictionary/music-concepts-definition-overrides.json').concepts;
const test=require('node:test'),assert=require('node:assert/strict');
const d=require('../music-dictionary/music-concepts-data.js'),source=require('../data/questions/music-concepts/Music_Concept_Knowledge_Bank_Ultimate_Codex_Edition.json'),additions=require('../music-dictionary/music-concepts-listening-additions.json').concepts,cues=require('../music-dictionary/music-concepts-listening-cues.json').concepts;
test('All 295 dictionary concepts preserve source definitions plus reviewed listening additions and PDF category coverage',()=>{
 const removed=new Set(['MC-0065','MC-0066']);assert.equal(d.concepts.length,295);assert.equal(new Set(d.concepts.map(c=>c.id)).size,295);assert.ok(!d.concepts.some(c=>removed.has(c.id)||c.id==='MC-0092'));assert.equal(d.concepts.find(c=>c.id==='MC-0056').name,'Percussion (tuned and untuned)');
 assert.deepEqual(d.categories,['Styles','Melody/harmony','Rhythm/tempo','Texture/structure/form','Timbre']);
 for(const c of source.concepts){if(removed.has(c.concept_id)||c.concept_id==='MC-0092')continue;const entry=d.concepts.find(x=>x.id===c.concept_id);assert.ok(entry);const addition=additions[c.concept_id]?.addition;assert.equal(entry.definition,overrides[c.concept_id]||c.definition+(addition?' '+addition:''));assert.ok(entry.features.length>0,entry.name+' needs listening cues');assert.deepEqual(entry.features,cues[c.concept_id].cues);assert.equal(entry.level,c.level);for(const category of c.categories)assert.equal(d.tables[c.level][d.categories.indexOf(category)].includes(c.concept_id),!removed.has(c.concept_id));}
 for(const level of d.levels)for(const col of d.tables[level]){assert.equal(col.length,new Set(col).size);for(const id of col)assert.equal(d.concepts.find(c=>c.id===id).level,level);}
});
test('PDF order keeps compound names and short-term collisions in their correct positions',()=>{
 const names=(level,column)=>d.tables[level][column].map(id=>d.concepts.find(c=>c.id===id).name);
 assert.deepEqual(names('National 5',4).slice(0,6),['Piccolo','Oboe','Bassoon','French horn','Tuba','Viola']);
 assert.deepEqual(names('National 5',1).slice(-3),['Pitch bend','Tone','Semitone']);
 assert.deepEqual(names('National 3',1).slice(-3),['Chord','Discord','Chord change']);
 assert.deepEqual(names('National 4',4).slice(-5),['Soprano','Alto','Tenor','Bass','Backing vocals']);
});

test('National 4 lists Major tonality and Minor tonality without standalone Tonality',()=>{const names=d.tables['National 4'][1].map(id=>d.concepts.find(c=>c.id===id).name);assert.ok(names.includes('Major tonality'));assert.ok(names.includes('Minor tonality'));assert.ok(!names.includes('Tonality'));assert.ok(!names.includes('Major'));assert.ok(!names.includes('Minor'));});

test('Definition additions retain their evidence in the saved notes',()=>{
 for(const [id,review] of Object.entries(additions)){
  const original=source.concepts.find(c=>c.concept_id===id),entry=d.concepts.find(c=>c.id===id);
  assert.ok(original,id+' must be a source concept');
  assert.ok(original.source_audit.source_extracts.some(s=>s.cleaned_definition.includes(review.supporting_excerpt)),id+' needs matching source evidence');
  assert.ok(overrides[id] ? entry.definition===overrides[id] : entry.definition.endsWith(review.addition),id+' needs its preserved definition or listening addition');
 }
});

test('Every Listen for section is concise, complete and independently worded',()=>{
 const normal=text=>text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
 assert.deepEqual(Object.keys(cues).sort(),d.concepts.map(c=>c.id).sort());
 for(const entry of d.concepts){
  assert.ok(entry.features.length>=1&&entry.features.length<=3,entry.name+' needs 1-3 vital cues');
  assert.equal(new Set(entry.features).size,entry.features.length,entry.name+' has duplicate cues');
  for(const cue of entry.features){
   const words=cue.trim().split(/\s+/);assert.ok(words.length<=22,entry.name+' cue is too long: '+cue);
   assert.ok(!/\b(?:1[4-9]\d{2}|20\d{2})\b/.test(cue),entry.name+' has a date in a listening cue');
   const sentences=entry.definition.split(/(?<=[.!?])\s+/);
   assert.ok(!sentences.some(sentence=>normal(sentence)===normal(cue)),entry.name+' copies a definition sentence');
   if(words.length>=4)assert.ok(!normal(entry.definition).includes(normal(cue)),entry.name+' copies a passage from its definition');
  }
 }
});
