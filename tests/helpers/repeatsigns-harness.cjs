const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),React=require('react');
const root=path.resolve(__dirname,'../..');
module.exports=function loadRepeatSigns(runtime=fs.readFileSync(path.join(root,'generated-runtimes/repeatsigns-1.js'),'utf8')){
 let state=8217;
 const math=Object.create(Math);math.random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const window={MLH:{useClickOutside(){}}};
 for(const file of ['bravura-symbols.js','shared/shared-notation-config.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),{window});
 const context=vm.createContext({window,React,Math:math,console});
 const entry=runtime.indexOf('const root=document.getElementById("root");');
 if(entry<0)throw Error('Repeat Signs entry point not found');
 vm.runInContext(runtime.slice(0,entry)+'globalThis.audit={makeQuestion,placementsMatch,wrongPlacements,missingRequired,answerSymbolsForQuestion,Score,RepeatAnswers,rhythm,LEVELS,snap,placementForBar};',context);
 return context.audit;
};
