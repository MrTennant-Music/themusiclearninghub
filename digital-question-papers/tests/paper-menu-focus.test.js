'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../exam-ui.js'),'utf8'),code=source.slice(source.indexOf('  function closePaperMenus('),source.indexOf('  function bindPaperMenus('));
for(const inside of [true,false])test(`closing a paper menu ${inside?'restores its keyboard opener':'preserves focus on an outside control'}`,()=>{
 const menu={dataset:{examMenu:'questions'},hidden:false},trigger={expanded:'true',focused:false,setAttribute(k,v){this.expanded=v;},focus(){this.focused=true;}};
 const document={activeElement:{closest:()=>inside?menu:null},querySelector:selector=>selector==='[data-exam-menu-trigger="questions"]'?trigger:null,querySelectorAll:selector=>selector==='[data-exam-menu]'?[menu]:[trigger]};
 vm.runInNewContext(code+';closePaperMenus()',{document});assert.equal(menu.hidden,true);assert.equal(trigger.expanded,'false');assert.equal(trigger.focused,inside);
});
