/* Compile the two small React views with the repository's existing Babel dependency. */
const fs=require('node:fs');
const path=require('node:path');
const babel=require('@babel/standalone');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
for(const name of ['hub-dialed','pitched']){
  const input=fs.readFileSync(path.join(root,name+'.jsx'),'utf8');
  const result=babel.transform(input,{presets:['react'],compact:true,comments:false,filename:name+'.jsx'});
  fs.writeFileSync(path.join(root,(name==='pitched'?'pitched-app':name)+'.js'),result.code+'\n');
}
let html=fs.readFileSync(path.join(root,'pitched.html'),'utf8');
for(const asset of ['hub-dialed-core.js','hub-dialed.js','pitched-app.js','styles/pitched.css','styles/hub-dialed.css']){
  const digest=createHash('sha256').update(fs.readFileSync(path.join(root,asset))).digest('hex').slice(0,12);
  html=html.replace(new RegExp('(\\./'+asset.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\?v=)[^"\\s]+','g'),'$1'+digest);
}
fs.writeFileSync(path.join(root,'pitched.html'),html);
