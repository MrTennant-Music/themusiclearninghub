const fs=require('node:fs'),vm=require('node:vm'),React=require('react');
module.exports=function(){
 let seed=8217;
 const math=Object.create(Math);
 math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
 const window={MLH:{}},context=vm.createContext({window,React,Math:math,console});
 for(const file of ['shared/melodic-dictation-selection.js','melodic-dictation-generator.js','shared/melodic-dictation-questions.js','bravura-symbols.js','shared/shared-notation-config.js','melodic-dictation-notation.js']){
  vm.runInContext(fs.readFileSync(file,'utf8'),context);
 }
 const code=fs.readFileSync('generated-runtimes/melodicdictation-1.js','utf8');
 vm.runInContext(code.replace('window.MLH.HostedMelodicDictation=HostedDictation;', 'globalThis.audit={effectiveMidiForNote};'),context);
 const app={...window.MLH.MelodicDictationQuestions.create(math.random),...context.audit};
 return {app,generator:window.MLH.MelodicDictation};
};
