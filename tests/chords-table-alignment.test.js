'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),React=require('react'),Babel=require('@babel/standalone');
const source=fs.readFileSync('chords.html','utf8');
function table(props){
 const code=source.slice(source.indexOf('function AHCompletedTable('),source.indexOf('function AHBassLineScore('));
 const context={React,ahSymbolOrChordLabel:(key,symbol,chord)=>`${symbol} or ${chord}`,inversionLabel:i=>i?`${i} inv.`:'Root'};
 vm.createContext(context);vm.runInContext(Babel.transform(code,{presets:['react']}).code,context);return context.AHCompletedTable(props);
}
test('bass-line chord information uses the same SVG scale and column centres as the notes',()=>{
 const question={key:'D minor',chords:Array.from({length:4},(_,index)=>({index,symbol:['VI','V','IV','I'][index],chord:['Bb','A','Gm','Dm'][index],inversion:index%3}))};
 const tree=table({question,x:300,y:292,columnWidth:118,tableWidth:472});
 assert.equal(tree.type,'g');assert.equal(tree.props.transform,'translate(300 292) scale(1)');
 const rows=tree.props.children.at(-1);assert.equal(rows.length,2);
 for(const row of rows){assert.equal(row.props.children.length,4);row.props.children.forEach((cell,index)=>{
  assert.equal(cell.type,'text');assert.equal(cell.props.x,59+index*118);assert.equal(cell.props.textAnchor,'middle');assert.equal(cell.props.fontSize,13.5);
 });}
 const bassScore=source.slice(source.indexOf('function AHBassLineScore('),source.indexOf('function MenuSvgGlyph('));
 assert.doesNotMatch(bassScore,/foreignObject/);
 assert.match(bassScore,/<AHCompletedTable[^>]*x=\{tableX\} y=\{bassTop\+72\}/);
});
test('SVG table retains both rows of printed chord and inversion information',()=>{
 const question={key:'D minor',chords:[{index:0,symbol:'VI',chord:'Bb',inversion:2},{index:1,symbol:'I',chord:'Dm',inversion:0}]};
 const rows=table({question}).props.children.at(-1);
 assert.deepEqual(rows[0].props.children.map(c=>c.props.children),['VI or Bb','I or Dm']);
 assert.deepEqual(rows[1].props.children.map(c=>c.props.children),['2 inv.','Root']);
});
