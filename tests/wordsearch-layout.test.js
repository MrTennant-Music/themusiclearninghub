const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),Babel=require('@babel/standalone');
const source=fs.readFileSync('music-games/session.jsx','utf8'),ast=Babel.packages.parser.parse(source,{plugins:['jsx']});let helper;
Babel.packages.traverse.default(ast,{FunctionDeclaration(path){if(path.node.id.name==='wordsearchGridSize')helper=source.slice(path.node.start,path.node.end);}});
const context={};vm.runInNewContext(helper+';this.size=wordsearchGridSize;',context);
test('Word Search uses the available height without sacrificing readable clue width',()=>{
 for(const [width,height]of [[1016,598],[1280,774],[1710,1000],[900,400]]){
 const size=context.size(width,height);assert(size>0);assert(size+24<=height);assert(width-size>=392);assert(size===height-24||size===width-392);
 }
 assert.equal(context.size(1016,598),574);assert.equal(context.size(1040,670),646);assert(context.size(1280,774)>context.size(1016,598));
});
