const test=require('node:test'),assert=require('node:assert/strict');
const {play}=require('./sounds.js');
function context(){
 const notes=[];
 const ctx={currentTime:3,destination:{},createOscillator(){const note={};notes.push(note);return{set type(v){note.wave=v;},frequency:{setValueAtTime(v){note.from=v;},exponentialRampToValueAtTime(v){note.to=v;}},connect(){},disconnect(){},start(t){note.start=t;},stop(t){note.stop=t;}};},createGain(){return{gain:{setValueAtTime(){},linearRampToValueAtTime(v){assert(v>0&&v<=.06);},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}};
 return{ctx,notes};
}
test('interaction sounds are distinct short clicks with quiet envelopes',()=>{
 const signatures=[];
 for(const kind of ['drop','type','button','lift']){
  const {ctx,notes}=context();play(ctx,kind);
  assert(notes.length>0);
  for(const note of notes){assert(note.stop>note.start&&note.stop-note.start<.1);assert(note.to<note.from);}
  signatures.push(JSON.stringify(notes));
 }
 assert.equal(new Set(signatures).size,4);
});

test('pickup click is higher pitched than release click',()=>{
 const lift=context(),drop=context();play(lift.ctx,'lift');play(drop.ctx,'drop');
 assert(lift.notes[0].to>drop.notes[0].from);
});
