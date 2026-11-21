const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const css=fs.readFileSync('styles/hub-touch.css','utf8');
test('text selection blocking applies only to a coarse primary pointer',()=>{
 const rules=css.replace(/\/\*[\s\S]*?\*\//g,'').trim();
 assert.ok(rules.startsWith('@media (pointer:coarse) {'));
 assert.match(rules,/html body,html body \*\s*\{[^}]*-webkit-user-select:none!important;[^}]*user-select:none!important;[^}]*-webkit-touch-callout:none!important;/);
 assert.equal((rules.match(/@media/g)||[]).length,1);
});
test('touch users retain native editing and selection inside text fields',()=>{
 assert.match(css,/html body input,html body textarea/);
 assert.match(css,/\[contenteditable\]:not\(\[contenteditable="false"\]\)/);
 assert.match(css,/-webkit-user-select:text!important;\s*user-select:text!important;\s*-webkit-touch-callout:default!important/);
 assert.doesNotMatch(fs.readFileSync('styles/chord-generator.css','utf8'),/body,body \*\{-webkit-user-select:none/);
});
test('touch styles disable text inflation without disabling browser zoom', () => {
 assert.match(css, /html\s*\{\s*-webkit-text-size-adjust:\s*100%;\s*text-size-adjust:\s*100%;/);
});
test('the homepage and every fitted Hub page load the shared touch stylesheet',()=>{
 let checked=0;
 function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  if(e.name.startsWith('.')||['node_modules','vendor','dist','tests','fixtures','audit','maintenance'].includes(e.name))continue;
  const file=path.join(dir,e.name);if(e.isDirectory()){walk(file);continue;}if(!file.endsWith('.html'))continue;
  const html=fs.readFileSync(file,'utf8');if(file!=='index.html'&&!html.includes('desktop-layout.css'))continue;
  const href=html.match(/<link[^>]*href="([^"]*styles\/hub-touch\.css[^\"]*)"/)?.[1];
  assert.ok(href,file);
  const url=new URL(file,'https://example.test/'),base=new URL(html.match(/<base[^>]*href="([^"]+)"/)?.[1]||'./',url);
  assert.equal(new URL(href,base).pathname,'/styles/hub-touch.css',file);checked++;
 }}walk('.');assert.ok(checked>=56);
});
