const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),React=require('react');const root=path.resolve(__dirname,'../..');
module.exports=function(runtime=fs.readFileSync(path.join(root,'generated-runtimes/timesignatures-1.js'),'utf8')){
 let state=8217;const math=Object.create(Math);math.random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const window={MLH:{useClickOutside(){}}};for(const f of ['bravura-symbols.js','shared/shared-notation-config.js'])vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),{window});
 const c=vm.createContext({window,React,Math:math,console});const entry=runtime.indexOf('const rootElement=document.getElementById("root");');if(entry<0)throw Error('Time Signatures entry point missing');
 vm.runInContext(runtime.slice(0,entry)+'globalThis.audit={makeQuestion,makeBarRhythms,availableTimeSignatures,levelEnabledMap,LEVELS,TIME_SIGNATURES,rhythmInfo,normaliseAminorAccidentals,getBarNotePositions,Score,TimeSignatureButton};',c);return c.audit;
};
