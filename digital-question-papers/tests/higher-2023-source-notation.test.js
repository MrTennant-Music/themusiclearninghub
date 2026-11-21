'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const notation=require('../exam-notation.js'),source=require('./fixtures/higher-2023-q4-source-audit.json');
test('Higher 2023 protects the user-confirmed official note order and restored printed slur',()=>{
 const actual=notation.getInventory('higher-2023-q4');
 for(const key of ['key','clef','timeSignature','finalBarline'])assert.equal(actual[key],source[key]);
 assert.equal(actual.bars.length,16);
 actual.bars.forEach((bar,i)=>{
  const retained=source.retainedTeacherRhythm.bars.find(item=>item.bar===i+1);
  const expected=(retained||source.bars[i]).notes.map(pair=>[...pair]);
  for(const d of source.teacherDiscrepancies)if(d.bar===i+1&&d.note!==undefined)expected[d.note][0]=d.teacherRuntime;
  assert.deepEqual(bar.notes.map(n=>[n.pitch?.replace(/[#♯b♭]/g,'')||'rest',n.rhythm]),expected,`bar ${i+1}: printed notes except documented teacher order`);
  assert.deepEqual(bar.beamGroups||[],(retained||source.bars[i]).beamGroups,`bar ${i+1}: beams`);
  assert.deepEqual(bar.notes.flatMap((n,j)=>n.tieToNext?[j]:[]),(retained||source.bars[i]).tiesFrom,`bar ${i+1}: ties`);
  assert.equal(bar.notes.reduce((sum,n)=>sum+n.beats,0),4,`bar ${i+1}: metre`);
 });
 for(const [bar,indices]of Object.entries(source.sourceDownStems))for(const i of indices)assert.equal(actual.bars[bar-1].notes[i].stemDown,true);
 for(const [from,to]of [...source.crossBarTies,...source.retainedTeacherRhythm.crossBarTies]){assert.equal(actual.bars[from-1].notes.at(-1).tieToNextBar,true);assert.equal(actual.bars[to-1].notes[0].tiedFromPreviousBar,true);}
 assert.equal(source.bars[13].beats,3.5,'Keep the printed short bar separate from the chosen runtime adaptation.');
 assert.equal(source.bars[15].beats,4.5,'Keep the printed long bar separate from the chosen runtime adaptation.');
 for(const [bar,lyrics] of Object.entries(source.lyricUnderlay))assert.deepEqual(actual.lyrics[Number(bar)-1],lyrics,'User-confirmed printed underlay in bar '+bar);
 assert.deepEqual(actual.crossBarSlurs,source.crossBarSlurs);
 assert.deepEqual(actual.bars[12].slurs,source.bars[12].slurs);
 assert.deepEqual(actual.transpose.map(n=>n.pitch),source.editable.transposition);
 assert.deepEqual(actual.bars[6].missingIndices,source.editable.missingIndices);
 assert.deepEqual(actual.bars[8].rhythmCorrectionIndices,source.editable.rhythmIndices);
 assert.equal(actual.bars[11].missingIndices[0],source.editable.restIndex);
 for(const file of source.sources)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../..',file.path))).digest('hex'),file.sha256);
});
