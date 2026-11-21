'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const notation=require('../exam-notation'),source=require('./fixtures/advanced-higher-2026-source-audit.json');
test('AH 2026 preserves all freshly read notes, chords, editable indices and source endings',()=>{
 for(const [key,inventory]of Object.entries(source.inventories))assert.deepEqual(notation.getInventory('ah-2026-'+key),inventory,key);
 const q4=notation.getInventory('ah-2026-q4');assert.ok(q4.bars[1].notes.slice(2).every(n=>n.stemDown===true));
 assert.deepEqual(q4.missing.answer,source.editable.q4d);
 const beats=b=>b.notes.reduce((s,n)=>s+n.beats,0);
 assert.equal(beats(q4.pickup),2);q4.bars.forEach((b,i)=>assert.equal(beats(b),i===11?3:5));
 const q5=notation.getInventory('ah-2026-q5b');for(const bs of q5.options)assert.deepEqual(bs.map(beats),[1,4,4,4,2]);
 for(const f of source.sources)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../..',f.path))).digest('hex'),f.sha256);
});
