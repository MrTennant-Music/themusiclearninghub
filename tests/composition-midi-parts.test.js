const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../chord-generator-core'),R=require('../composition-arrangement');
const browser={MLH:{ChordGenerator:C,DrumMachine:require('../drum-machine-core')}};
vm.runInNewContext(fs.readFileSync(require.resolve('../chord-generator-audio'),'utf8'),{window:browser});const A=browser.MLH.ChordAudio;
const vl=n=>{const b=[n&127];while((n>>>=7)>0)b.unshift((n&127)|128);return b;},int=(n,c)=>Array.from({length:c},(_,i)=>n>>>((c-i-1)*8)&255);
function fixture(){
 const track=(name,channel,program,notes)=>{const text=[...Buffer.from(name)],events=[{at:0,order:0,data:[255,3,...vl(text.length),...text]},{at:0,order:0,data:[192|channel,program]}];for(const n of notes){if(n.program!==undefined)events.push({at:n.beat*480,order:0,data:[192|channel,n.program]});events.push({at:n.beat*480,order:2,data:[144|channel,n.midi,n.velocity||101]},{at:(n.beat+n.duration)*480,order:1,data:[128|channel,n.midi,0]});}events.sort((a,b)=>a.at-b.at||a.order-b.order);let tick=0,bytes=[];for(const e of events){bytes.push(...vl(e.at-tick),...e.data);tick=e.at;}bytes.push(0,255,47,0);return [...Buffer.from('MTrk'),...int(bytes.length,4),...bytes];};
 const tracks=[track('Lead – flute',4,73,[{midi:79,beat:.125,duration:.375},{midi:81,beat:31.5,duration:1.25,program:72}]),track('Strings & pads',6,48,[{midi:60,beat:0,duration:4},{midi:64,beat:0,duration:4},{midi:67,beat:0,duration:4},{midi:127,beat:34,duration:.25}]),track('Low bass',1,33,[{midi:0,beat:0,duration:1}]),track('Percussion',9,0,[{midi:35,beat:.25,duration:.125},{midi:37,beat:.75,duration:.125},{midi:57,beat:35.75,duration:.125}])];
 return Uint8Array.from([...Buffer.from('MThd'),0,0,0,6,0,1,...int(tracks.length,2),1,224,...tracks.flat()]);
}
const importedData=()=>{const p=C.importSongMidi(fixture());return R.validate(p.studioArrangement||R.create(p));};
const data=()=>{
 const song=importedData(),raw=C.importMidi(fixture(),true),parts=new Map();
 for(const note of [...raw.notes,...raw.drumNotes]){
  const id='midi-'+note.track+'-'+note.channel;
  if(!parts.has(id))parts.set(id,{id,name:raw.trackNames[note.track],channel:note.channel,program:note.program,percussion:note.channel===9,notes:[]});
  parts.get(id).notes.push(note);
 }
 let start=0;
 for(const item of song.items){const span=C.totalBeats(item.project);item.project.importedParts=[...parts.values()].map(part=>({...part,notes:part.notes.filter(n=>n.beat<start+span&&n.beat+n.duration>start).map(n=>({...n,tieFrom:n.beat<start,tieTo:n.beat+n.duration>start+span,beat:Math.max(0,n.beat-start),duration:Math.min(n.beat+n.duration,start+span)-Math.max(n.beat,start)}))}));start+=span;}
 return R.validate(song);
};
test('ordinary MIDI imports into melody, piano accompaniment and drum sections',()=>{
 const song=importedData();assert.equal(song.items.length,2);
 for(const item of song.items){assert.equal(item.project.importedParts,undefined);assert.ok(item.project.drums);}
 const first=song.items[0].project;
 assert.equal(first.melody[0].midi,79);
 assert.deepEqual(first.accompaniment.map(n=>n.midi),[60,64,67]);
 assert.deepEqual(require('../composition-score').build(first,A.events(first)).staff.map(s=>s.id),['melody','piano-upper','piano-lower','drums']);
});
test('MIDI import preserves every named part, channel and original program, including changes and all drum pitches',()=>{
 const raw=C.importMidi(fixture(),true),song=data(),parts=song.items[0].project.importedParts;
 assert.equal(parts.length,4);assert.deepEqual(parts.map(p=>p.name).sort(),['Lead – flute','Low bass','Percussion','Strings & pads'].sort());
 const all=R.compile(song,A);assert.equal(all.events.length,10);
 for(const n of [...raw.notes,...raw.drumNotes]){const e=all.events.find(e=>e.sourceNoteId===n.sourceNoteId);assert.ok(e);for(const key of ['midi','channel','program','beat','duration'])assert.equal(e[key],n[key],key);assert.equal(e.velocity,n.velocity/127);}
 assert.ok(all.events.every(e=>e.track==='imported'));assert.equal(all.events.find(e=>e.midi===81).duration,1.25,'section boundary must not retrigger or shorten a held note');
 assert.deepEqual(all.events.filter(e=>e.percussion).map(e=>e.midi),[35,37,57]);
});
test('export retains named MIDI tracks and program assignments and saved import restores all parts',()=>{
 const compiled=R.compile(data(),A),bytes=C.midi(compiled.project,compiled.events),raw=C.importMidi(bytes,true),original=C.importMidi(fixture(),true);
 assert.deepEqual(Object.values(raw.trackNames).sort(),Object.values(original.trackNames).sort());
 const inventory=p=>[...p.notes,...p.drumNotes].map(n=>[n.channel,n.program,n.midi,n.beat,n.duration,n.velocity]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
 assert.deepEqual(inventory(raw),inventory(original));
 assert.deepEqual(R.validate(C.importSongMidi(C.songMidi(compiled.project,compiled.events)).studioArrangement),data());
});
test('score creates an independent labelled staff for each imported part',()=>{
 const M=require('../composition-score'),p=data().items[0].project,score=M.build(p,A.events(p));
 assert.deepEqual(score.staff.map(s=>s.label).sort(),p.importedParts.map(p=>p.name).sort());assert.equal(score.staff.find(s=>s.label==='Percussion').clef,'percussion');
});
test('muting an imported part does not substitute generated chords, bass or drums',()=>{
 const p=data().items[0].project;p.importedParts.forEach(part=>part.muted=true);assert.equal(A.events(p).length,0);
});
test('General MIDI sampler parses data without executing downloaded scripts and schedules the assigned instrument',async()=>{
 const fetched=[],played=[],b={MLH:{ChordGenerator:C}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../composition-general-midi'),'utf8'),{window:b,atob:s=>Buffer.from(s,'base64').toString('binary'),fetch:async url=>{fetched.push(url);return {ok:true,text:async()=>url.includes('/128')?"var unused={file:'AAAA'};":'if(typeof MIDI === "undefined") var MIDI={}; MIDI.Soundfont.flute = {"C4":"data:audio/mp3;base64,AAAA",};'};}});
 const ctx={decodeAudioData:async()=>({duration:2}),createBufferSource:()=>({playbackRate:{value:1},connect(){},start(t){played.push(t);},stop(){}}),createGain:()=>({connect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}})};
 const events=[{midi:60,program:73,velocity:.7,duration:1},{midi:37,percussion:true,program:0,velocity:.5,duration:.1}];await b.MLH.GeneralMidiSampler.prepare(ctx,events);events.forEach(e=>b.MLH.GeneralMidiSampler.play(ctx,{},e,2,.5));
 assert.ok(fetched.some(u=>u.endsWith('flute-mp3.js')));assert.ok(fetched.some(u=>u.includes('12837_0_FluidR3')));assert.deepEqual(played,[2,2]);
});
test('imported score renders uncommon percussion and every original part without a missing kit lookup',()=>{
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),Babel=require('@babel/standalone'),M=require('../composition-score');
 const context={React,window:{MLH:{CompositionScoreModel:{...M,build:p=>M.build(p,A.events(p))}}},document:{}};vm.createContext(context);
 for(const file of ['bravura-symbols.js','shared/shared-notation-config.js','bravura-worksheet-outlines.js'])vm.runInContext(fs.readFileSync(require.resolve('../'+file),'utf8'),context);
 vm.runInContext(Babel.transform(fs.readFileSync(require.resolve('../composition-score.jsx'),'utf8'),{presets:['react']}).code,context);
 const html=renderToStaticMarkup(React.createElement(context.window.MLH.CompositionScore,{project:data().items[0].project}));
 for(const label of ['Lead – flute','Low bass','Percussion','Strings &amp; pads'])assert.ok(html.includes(label),label);assert.ok(!html.includes('NaN'));
});
test('program assignments on a separate MIDI setup track apply to their channel notes',()=>{
 const track=bytes=>[...Buffer.from('MTrk'),...int(bytes.length,4),...bytes],setup=track([0,0xc4,73,0,255,47,0]),notes=track([0,255,3,4,76,101,97,100,0,0x94,79,100,...vl(480),0x84,79,0,0,255,47,0]);
 const bytes=Uint8Array.from([...Buffer.from('MThd'),0,0,0,6,0,1,0,2,1,224,...setup,...notes]),p=C.importSongMidi(bytes);
 assert.equal(p.importedParts,undefined);assert.equal(p.melodyInstrument,'flute');assert.equal(p.melody[0].midi,79);
});
test('MIDI key signature metadata imports every major and minor signature without shadowing the note identifier',()=>{
 for(let fifths=-7;fifths<=7;fifths++)for(const minor of [0,1]){
  const events=[0,255,89,2,fifths&255,minor,0,0xc4,73,0,0x94,79,100,...vl(480),0x84,79,0,0,255,47,0];
  const bytes=Uint8Array.from([...Buffer.from('MThd'),0,0,0,6,0,0,0,1,1,224,...Buffer.from('MTrk'),...int(events.length,4),...events]);
  const p=C.importSongMidi(bytes);assert.equal(p.key,((fifths*7+(minor?9:0))%12+12)%12);assert.equal(p.mode,minor?'minor':'major');assert.equal(p.melody[0].midi,79);assert.equal(p.melodyInstrument,'flute');
 }
});

test('standard MIDI kit alternatives reach the existing drum rows',()=>{
 const song=importedData(),first=song.items[0].project.drums.patterns[0],second=song.items[1].project.drums.patterns[0];
 assert.equal(first.tracks.find(t=>t.id==='kick').steps[1],101);
 assert.equal(first.tracks.find(t=>t.id==='snare').steps[3],101);
 assert.equal(second.tracks.find(t=>t.id==='crash').steps[15],101);
});
