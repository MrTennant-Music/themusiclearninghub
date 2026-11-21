/* Export the sourced bank as portable eight-bar MIDI lead sheets. */
const fs=require('node:fs'),path=require('node:path');
const C=require('../../chord-generator-core'),D=require('../../drum-machine-core'),T=require('../../composition-templates');
const window={MLH:{ChordGenerator:C,DrumMachine:D}};require('node:vm').runInNewContext(fs.readFileSync(path.resolve(__dirname,'../../chord-generator-audio.js'),'utf8'),{window});const A=window.MLH.ChordAudio;
const out=path.resolve(__dirname,'../../data/composition-templates');
fs.mkdirSync(out,{recursive:true});
for(const item of T.list){
  const project=T.create(item.id,()=>.35);
  fs.writeFileSync(path.join(out,item.id+'.mid'),C.songMidi(project,A.events(project)));
}
console.log(`Exported ${T.list.length} eight-bar MIDI templates.`);
