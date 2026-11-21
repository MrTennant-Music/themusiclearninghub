'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),registry=require('../paper-registry');
test('inline sentences without a separate prompt retain a complete spoken field label',()=>{
 const source=fs.readFileSync(require.resolve('../exam-ui'),'utf8'),context={capitaliseInitialText:v=>v,escapeHtml:v=>String(v??''),paperTextMarkup:v=>String(v??'')};
 vm.runInNewContext(source.slice(source.indexOf('  function inputMarkup('),source.indexOf('  function questionIntroMarkup('))+';this.render=inputMarkup;',context);
 let missingPrompts=0;
 for(const entry of Object.values(registry))for(const q of require('../'+entry.dataFile.split('?')[0]).questions)for(const part of q.subquestions){
  if(part.type!=='short-text'||part.prompt)continue;
  missingPrompts++;const markup=context.render(part,''),label=markup.match(/<label class="visually-hidden"[^>]*>([^<]+)<\/label>/)?.[1];
  const expected=(part.promptLines||[]).join(' ')||[...(part.inlineAnswer?.beforeLines||[]),part.inlineAnswer?.before,part.inlineAnswer?.after].filter(Boolean).join(' ');
  assert.ok(expected.trim(),entry.id+' '+part.id);assert.equal(label,expected,entry.id+' '+part.id);
 }
 assert.equal(missingPrompts,36);
});
