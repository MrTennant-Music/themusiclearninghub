const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),Babel=require('@babel/standalone');
test('Hub interface sources do not render system emoji',()=>{
 const files=fs.readdirSync('.').filter(name=>/\.(html|jsx|js)$/.test(name)&&!/(?:-runtime|\.compiled)\.js$/.test(name));
 files.push(...fs.readdirSync('shared').filter(name=>name.endsWith('.js')).map(name=>'shared/'+name),'music-games/app.jsx','music-games/arcade.jsx','music-games/learning.jsx');
 for(const file of files)assert.doesNotMatch(fs.readFileSync(file,'utf8'),/[\p{Emoji_Presentation}\u2708\u2665]/u,file);
});
test('replacement interface graphics are local vector assets',()=>{
 for(const name of ['speech-bubble','horse','fruit-apple','fruit-orange','fruit-pear','fruit-lemon','airplane']){
  const svg=fs.readFileSync('ui-icons/'+name+'.svg','utf8');assert.match(svg,/<svg[^>]+viewBox=/);assert.doesNotMatch(svg,/<image|<text|https?:\/\/(?!www.w3.org)/);
 }
});
test('affected inline page runtimes match their authored source',()=>{
 for(const page of ['dynamics.html','articulationmarkings.html','rests.html','rhythmicdictation.html','rhythmidentification.html','keyboardnoteidentificationclassroom.html']){
  const html=fs.readFileSync(page,'utf8');
  for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
   if(!match[1].includes('text/x-mlh-jsx-source'))continue;
   const runtime=match[1].match(/data-runtime="([^"]+)"/)[1];
   const code=Babel.transform(match[2],{filename:page,presets:['react'],comments:false,compact:true}).code+'\n';
   assert.equal(fs.readFileSync('generated-runtimes/'+runtime,'utf8'),code,page);
  }
 }
});
