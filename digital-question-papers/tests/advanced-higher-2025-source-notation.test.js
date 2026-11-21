'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const notation=require('../exam-notation'),source=require('./fixtures/advanced-higher-2025-source-audit.json');
test('AH 2025 retains the complete freshly source-read score inventory and printed beam directions',()=>{
 for(const [key,inventory]of Object.entries(source.inventories))assert.deepEqual(notation.getInventory('ah-2025-'+key),inventory,key);
 const q2=notation.getInventory('ah-2025-q2');
 assert.ok(q2.b.options[2][2].notes.slice(1).every(n=>n.stemDown===false));
 assert.ok(q2.c.bars[0].notes.slice(1).every(n=>n.stemDown===true));
 assert.deepEqual(q2.a.bars[1].notes.map(n=>n.pitch),['B5','C#6','D6']);
 assert.deepEqual(q2.d.bass.answer,source.editable.q2d);
 const paper=require('../papers/advanced-higher-2025'),marking=require('../exam-marking'),part=paper.questions[1].subquestions.find(p=>p.id==='q2d');
 for(const d of [2,3,4,5])for(const e of [2,3,4,5])for(const f of [2,3,4,5])assert.equal(marking.markSubquestion(part,`D${d},E${e},F${f}`).marks,1);
 assert.equal(marking.markSubquestion(part,'D5,F5,E5').marks,0);
 for(const f of source.sources)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../..',f.path))).digest('hex'),f.sha256);
});
