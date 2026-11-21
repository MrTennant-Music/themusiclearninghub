const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),React=require('react'),Babel=require('@babel/standalone');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'worksheet-generic.jsx'),'utf8').replace('ReactDOM.createRoot(document.getElementById("root")).render(<GenericApp />);','globalThis.worksheetAudit={makeQuestion,Staff,articulationWorksheetNotePositions,WorksheetRhythmSumItem};');
const code=Babel.transform(source,{presets:['react'],compact:true}).code;
module.exports=function(config){
 let state=8217;const math=Object.create(Math);math.random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const window={location:{href:'http://localhost:8765/worksheetgenerator.html'},MLH:{worksheetExerciseUrl:()=>config.sourceUrl}};
 for(const file of ['shared/accidentals-selection.js','shared/chords-selection.js','shared/key-signatures-selection.js','keyboard-notes.js','shared/melodic-dictation-selection.js','shared/note-identification-core.js','shared/transposing-core.js','shared/barlines-core.js','shared/rests-question-core.js','shared/rhythm-sums-generator.js','bravura-symbols.js','shared/shared-notation-config.js','bravura-worksheet-outlines.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),{window});
 const c=vm.createContext({React,window,URL,Math:math,console,sessionStorage:{getItem:()=>JSON.stringify(config)},document:{querySelector:()=>({href:''}),body:{classList:{toggle(){}}}},setTimeout,clearTimeout});
 vm.runInContext(code,c);return c.worksheetAudit;
};
