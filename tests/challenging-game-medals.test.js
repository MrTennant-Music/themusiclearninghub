const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),Babel=require('@babel/standalone');
for(const [page,name]of [['chords.html','medalSoundForStreak'],['melodicdictation.html','missingNotesMedalSoundForStreak'],['rhythmicdictation.html','streakMedal']])test(page+' uses 2/4/6/10 for medal display and celebrations',()=>{
 const html=fs.readFileSync(page,'utf8'),source=[...html.matchAll(/<script\b[^>]*type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/g)].map(match=>match[1]).join('\n');
 const ast=Babel.packages.parser.parse(source,{plugins:['jsx']});let fn;
 Babel.packages.traverse.default(ast,{FunctionDeclaration(path){if(path.node.id.name===name)fn=source.slice(path.node.start,path.node.end);}});
 assert.ok(fn);const context={};vm.runInNewContext(fn+';this.medal='+name,context);
 for(const [streak,tier]of [[2,'bronze'],[4,'silver'],[6,'gold'],[10,'platinum']]){const result=context.medal(streak);assert.equal(typeof result==='object'?result?.sound:result,tier);}
 assert.equal(context.medal(0),null);assert.equal(context.medal(1),null);
 assert.ok(source.includes('[2, 4, 6, 10]'));assert.ok(!source.includes('[10, 15, 20, 30]'));
 assert.match(source,/medalThresholdValues=\{(?:MEDAL_THRESHOLDS|\[2, 4, 6, 10\])\}/);
});
