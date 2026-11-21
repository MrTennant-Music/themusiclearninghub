const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),Babel=require('@babel/standalone');
const source=fs.readFileSync('music-games/learning.jsx','utf8'),ast=Babel.packages.parser.parse(source,{plugins:['jsx']});let helper;
Babel.packages.traverse.default(ast,{FunctionDeclaration(path){if(path.node.id.name==='wordsearchHighlights')helper=source.slice(path.node.start,path.node.end);}});
const context={};vm.runInNewContext(helper+';this.highlights=wordsearchHighlights;',context);
test('rainbow colours follow discovery order rather than the printed clue order and repeat after violet',()=>{
 const placed=Array.from({length:8},(_,i)=>({word:'WORD'+i,cells:[{row:i,col:0}]})),found=placed.map(p=>p.word).reverse(),h=context.highlights(placed,found);
 const rainbow=['#ef4444','#f97316','#facc15','#22c55e','#3b82f6','#6366f1','#a855f7','#ef4444'];
 found.forEach((word,i)=>{assert.equal(h.words[word],rainbow[i]);const row=placed.find(p=>p.word===word).cells[0].row;assert.equal(h.cells[row+',0'],h.words[word]);});
});
test('crossing words retain both discovery colours and use the actual selected path',()=>{
 const placed=[{word:'ONE',cells:[{row:0,col:0},{row:0,col:1}]},{word:'TWO',cells:[{row:0,col:1},{row:1,col:1}]}];
 const h=context.highlights(placed,['ONE','TWO']);assert.equal(h.cells['0,0'],'#ef4444');assert.equal(h.cells['1,1'],'#f97316');assert(h.cells['0,1'].includes('#ef4444'));assert(h.cells['0,1'].includes('#f97316'));assert(h.cells['0,1'].startsWith('linear-gradient('));
 const alternate=context.highlights(placed,['ONE'],{ONE:[{row:3,col:3}]});assert.equal(alternate.cells['3,3'],'#ef4444');assert.equal(alternate.cells['0,0'],undefined);
});

test('crossword positions use completion order and preserve rainbow colours at crossings',()=>{
 const placed=[{word:'PIANO',positions:[{row:0,col:0},{row:0,col:1}]},{word:'CHORD',positions:[{row:0,col:1},{row:1,col:1}]}];
 const h=context.highlights(placed,['CHORD','PIANO']);
 assert.equal(h.words.CHORD,'#ef4444');assert.equal(h.words.PIANO,'#f97316');
 assert.equal(h.cells['1,1'],'#ef4444');assert.equal(h.cells['0,0'],'#f97316');
 assert(h.cells['0,1'].includes('#ef4444'));assert(h.cells['0,1'].includes('#f97316'));
 assert.equal(context.highlights(placed,[]).cells['0,0'],undefined);
});
