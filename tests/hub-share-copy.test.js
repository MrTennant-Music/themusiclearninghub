const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),Babel=require('@babel/standalone');
const source=fs.readFileSync('shared/hub-shell.js','utf8'),ast=Babel.packages.parser.parse(source);let copy;
Babel.packages.traverse.default(ast,{FunctionDeclaration(path){if(path.node.id.name==='copyLink')copy=source.slice(path.node.start,path.node.end);}});
for(const kind of ['native','fallback','manual','timeout'])test('share copy supports '+kind,async()=>{
 let copied,failed,removed=false,restored=false;
 const field={style:{},setAttribute(){},select(){},remove(){removed=true;}};
 const context={shareUrl:'https://hub.test/connections.html#playnote=example',navigator:{clipboard:{writeText:async()=>{if(kind==='timeout')return new Promise(()=>{});if(kind!=='native')throw Error('Clipboard unavailable');}}},document:{activeElement:{focus(){restored=true;}},createElement:()=>field,body:{appendChild(){}},execCommand:()=>kind==='fallback'||kind==='timeout'},setCopied:value=>copied=value,setCopyFailed:value=>failed=value,window:{setTimeout(fn,ms){if(ms===500)return setTimeout(fn,1);},clearTimeout}};
 await vm.runInNewContext(copy+';copyLink()',context);
 assert.equal(copied,kind!=='manual');assert.equal(failed,kind==='manual');
 if(kind!=='native'){assert.equal(removed,true);assert.equal(restored,true);assert.equal(field.value,context.shareUrl);}
});
test('both header stat cards support Enter and Space without handling child button events',()=>{
 const handlers=[];
 Babel.packages.traverse.default(ast,{ObjectProperty(path){if(path.node.key.name==='onKeyDown'){const code=source.slice(path.node.value.start,path.node.value.end);if(code.includes('event.currentTarget.click()'))handlers.push(code);}}});
 assert.equal(handlers.length,2);
 for(const handler of handlers)for(const [key,child,expected]of [['Enter',false,1],[' ',false,1],['Escape',false,0],['Enter',true,0]]){
  let clicked=0,prevented=0;const currentTarget={click(){clicked++;}};
  vm.runInNewContext('('+handler+')(event)',{event:{key,currentTarget,target:child?{}:currentTarget,preventDefault(){prevented++;}}});
  assert.equal(clicked,expected);assert.equal(prevented,expected);
 }
});
