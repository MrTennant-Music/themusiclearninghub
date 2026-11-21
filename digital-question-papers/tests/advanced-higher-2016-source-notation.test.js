'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const notation=require('../exam-notation.js'),source=require('./fixtures/advanced-higher-2016-source-audit.json');
const pairs=notes=>notes.map(n=>[n.rest?'r':n.pitch,n.rhythm]);
test('AH 2016 matches the fresh independently read printed notes, answers, ties and excerpt endings',()=>{
 for(const key of ['q2e','q4a','q4c','q4d','q4e','q5']){
  const actual=notation.getInventory('ah-2016-'+key),rows=source.sections[key];
  assert.equal(actual.finalBarline,source.finalBarlines[key]);
  if(key==='q2e')actual.options.forEach((bars,i)=>assert.deepEqual(bars.map(pairs),rows['Option '+(i+1)]));
  else if(key==='q4c')for(const staff of ['treble','bass'])actual[staff].forEach((bar,i)=>assert.deepEqual(pairs(bar.notes),rows[staff+' '+(i+1)]));
  else actual.bars.forEach((bar,i)=>assert.deepEqual(pairs(bar.notes),rows['bars '+(i+1)]));
  if(key==='q5'){
   assert.deepEqual(pairs(actual.pickup.notes),rows.Pickup);
   for(const[b,ties]of Object.entries(source.q5Ties))assert.deepEqual(actual.bars[b-1].ties,ties);
   for(const[b,ties]of Object.entries(source.q5CrossBarTies))assert.deepEqual(actual.bars[b-1].tiesToNext,ties);
   assert.deepEqual(actual.missingNoteSlots,source.editable.q5Slots);assert.deepEqual(actual.tieAnswer,source.editable.q5Tie);
  }
  if(key==='q4e'){assert.deepEqual(actual.chords,source.q4eChords);assert.deepEqual(actual.bass.map(n=>n.pitch),source.q4eBass);}
 }
 for(const f of source.sources)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../..',f.path))).digest('hex'),f.sha256);
});
test('AH 2016 low-note ties follow their actual upward stems below the staff',()=>{
 class Node{constructor(name){this.name=name;this.attributes={};this.children=[];this.style={};this.dataset={};this.textContent='';}setAttribute(k,v){this.attributes[k]=String(v);}getAttribute(k){return this.attributes[k];}append(...n){this.children.push(...n);}addEventListener(){}closest(){return null;}}
 const oldDoc=global.document,oldSymbols=global.BRAVURA_SYMBOLS;
 try{
  global.document={createElementNS:(_,name)=>new Node(name),createElement:name=>new Node(name)};global.BRAVURA_SYMBOLS=new Proxy({},{get:(_,key)=>String(key)});
  const wrap=new Node('div');notation.renderSharedScore({innerHTML:'',querySelector:()=>wrap},{score:{sharedNotation:'ah-2016-q5'}},{},null,{});
  const all=n=>[n,...n.children.flatMap(all)],ties=all(wrap).filter(n=>n.textContent==='tie');
  // The two low-note connections are the only printed ties below system 2.
  const below=ties.filter(n=>!n.attributes.transform.includes('rotate(180)')&&/translate\([^ ]+ (37[0-9]|36[0-9])\./.test(n.attributes.transform));
  assert.equal(below.length,2,'F4 into bar 6 and G-flat4 into bar 7 retain the printed below ties');
 }finally{global.document=oldDoc;global.BRAVURA_SYMBOLS=oldSymbols;}
});
