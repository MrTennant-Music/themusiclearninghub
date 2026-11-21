const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('Hub animations remain enabled regardless of device motion preference',()=>{
 const directories=['shared','styles','playnote','music-dictionary','digital-question-papers','familyfortunes','whowantstobemillionaire'];
 const scan=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
  if(e.name.startsWith('.')||['vendor','node_modules','tests','fixtures','audit','dist'].includes(e.name))return[];
  const p=path.join(dir,e.name);return e.isDirectory()?scan(p):/\.(html|css|js|jsx)$/.test(p)&&!p.endsWith('.test.js')?[p]:[];
 });
 const files=fs.readdirSync('.').filter(f=>/\.(html|js|jsx)$/.test(f));files.push(...directories.flatMap(scan));
 for(const file of files)assert.doesNotMatch(fs.readFileSync(file,'utf8'),/prefers-reduced-motion/,file);
});
