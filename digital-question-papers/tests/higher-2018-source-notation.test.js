'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const notation=require('../exam-notation.js'),source=require('./fixtures/higher-2018-q3-source-audit.json');
const beats={crotchet:1,quaver:.5,semiquaver:.25,dottedQuaver:.75,dottedCrotchet:1.5,minim:2,semibreve:4,crotchetRest:1};
const written=notes=>notes.map(n=>[n.pitch?.replace(/[#♯b♭]/g,'')||'rest',n.rhythm]);
test('Higher 2018 preserves all nine independently read exercise lines and source exceptions',()=>{
 const actual=notation.getInventory('higher-2018-q3');
 for(const key of ['key','clef','timeSignature','finalBarline'])assert.equal(actual[key],source[key]);
 for(const [name,bars]of Object.entries(source.lines)){
  assert.equal(actual.lines[name].length,bars.length,name);
  bars.forEach((bar,i)=>{
   assert.deepEqual(written(actual.lines[name][i].notes),bar.notes,`${name} bar ${i+1}`);
   assert.equal(actual.lines[name][i].notes.reduce((sum,n)=>sum+beats[n.rhythm],0),bar.beats,`${name} bar ${i+1}: metre`);
  });
 }
 assert.deepEqual(written(actual.lines.line1),source.line1.notes);
 assert.ok(actual.lines.line1.every(n=>n.stemDown),'source percussion stems point down');
 assert.ok(actual.lines.line1.every(n=>n.notehead==='cross'),'percussion uses actual cross noteheads rather than masking ordinary heads');
 assert.deepEqual(written(actual.lines.line2),source.line2.notes);
 assert.ok(actual.lines.line2.filter(n=>!n.rest).every(n=>n.stemDown),'line 2 source beams point down');
 assert.deepEqual(actual.line2BeamGroups,source.line2.beamGroups);
 assert.deepEqual(actual.lines.line2.flatMap((n,i)=>n.tieToNext?[i]:[]),source.line2.tiesFrom);
 assert.deepEqual(actual.lines.line2.flatMap((n,i)=>n.accidental?[[i,n.accidental]]:[]),source.line2.accidentals);
 assert.deepEqual(actual.lines.line2.flatMap((n,i)=>n.articulation?[i]:[]),source.line2.marcatoIndices);
 assert.deepEqual(actual.line2Acciaccaturas,source.line2.graceNotes);
 let start=0;for(const end of source.line2.barlineAfterIndices){assert.equal(actual.lines.line2.slice(start,end+1).reduce((sum,n)=>sum+beats[n.rhythm],0),4);start=end+1;}
 for(const [name,pairs]of Object.entries(source.crossBarTies))for(const [from,to,index]of pairs){assert.equal(actual.lines[name][from].notes[index].tieToNextBar,true);assert.equal(actual.lines[name][to].notes[0].tiedFromPreviousBar,true);}
 for(const [name,bars]of Object.entries(source.sourceDownStems))for(const [bar,indices]of Object.entries(bars))for(const index of indices)assert.equal(actual.lines[name][bar].notes[index].stemDown,true);
 assert.deepEqual(actual.lines.transpose.map(n=>n.pitch),source.editable.transposition);
 assert.deepEqual(actual.missingNoteIndices,source.editable.missingIndices);assert.deepEqual(actual.intervalNoteIndices,source.editable.intervalIndices);assert.deepEqual(actual.rhythmCorrectionIndices,source.editable.rhythmIndices);
 assert.equal(actual.line2FinalBarline,source.line2.finalBarline);assert.equal(actual.line9FinalBarline,'none');
 for(const file of source.sources)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../..',file.path))).digest('hex'),file.sha256);
});
