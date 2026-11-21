const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),React=require('react');
const root=path.resolve(__dirname,'../..');
module.exports=function loadFollowScore(runtime=fs.readFileSync(path.join(root,'generated-runtimes/followthescore-1.js'),'utf8')){
 let state=8217;
 const math=Object.create(Math);math.random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const window={PracticeMelodyGenerator:require(path.join(root,'practice-melody-generator.js'))};
 for(const file of ['bravura-symbols.js','shared/shared-notation-config.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),{window});
 const context=vm.createContext({window,React,Math:math,console,Date:class extends Date {static now(){return 1794441600000;}},performance,setTimeout,clearTimeout});
 const launch=runtime.match(/ReactDOM\.createRoot\(document\.getElementById\("root"\)\)\.render\(React\.createElement\(App[^;]*;/)?.[0];
 if(!launch)throw Error('Follow the Score entry point not found');
 vm.runInContext(runtime.replace(launch,'globalThis.audit={makeEscapeFollowScoreQuestion,makeFollowScoreQuestion,makeFollowScoreRepeat,followScoreNoteSounds,followScoreStopAfterSeconds,repeatPlaybackBars,timeSignatureForBar,rhythmInfo,Score,makeFinalBarNotes,TIME_SIGNATURES,KEYS,noteByLetter,followScoreQuestionFingerprint,buildNational5PhraseBar};'),context);
 const result=context.audit;
 const generate=result.makeFollowScoreQuestion;
 result.makeFollowScoreQuestion=(level)=>{
  context.followAuditLevel=level;
  context.followAuditGenerate=generate;
  return vm.runInContext('followAuditGenerate(followAuditLevel)',context,{timeout:5000});
 };
 return result;
};
