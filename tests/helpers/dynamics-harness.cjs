const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),React=require('react');
const root=path.resolve(__dirname,'../..');
module.exports=function loadDynamics(runtime=fs.readFileSync(path.join(root,'generated-runtimes/dynamics-1.js'),'utf8')){
 let state=8217;const math=Object.create(Math);math.random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const window={MLH:{useClickOutside(){}}};for(const f of ['bravura-symbols.js','shared/shared-notation-config.js'])vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),{window});
 const c=vm.createContext({window,React,Math:math,console});const entry=runtime.indexOf('const root=document.getElementById("root");');if(entry<0)throw Error('Dynamics entry point missing');
 vm.runInContext(runtime.slice(0,entry)+'globalThis.audit={makeDynamicsOrderQuestion,DynamicsOrderBoard,ORDER_LEVELS,DynamicGlyph,makeQuestion,makeChoices,makeAudioQuestion,makeApplyQuestion,placementsMatch,missingRequired,wrongPlacements,placementKey,placementPos,buildLayouts,snap,Score,DynamicAnswers,ChoiceAnswers,LEVELS,DYNAMICS,QUESTION_TYPES,rhythm,availableQuestionTypes,cleanText,dyn,accompanimentVolumes,dynamicsPlacementForBar,extendDynamicsPlacement'+(runtime.includes('function dynamicsGainForNote(')?',dynamicsGainForNote':'')+'};',c);
 return c.audit;
};
