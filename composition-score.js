/* Musical score model for Composition Studio. Uses the same realised events as playback.
   Engraving geometry is shared with Practice Questions via shared/shared-notation-config.js. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./chord-generator-core'));
 else{root.MLH=root.MLH||{};root.MLH.CompositionScoreModel=factory(root.MLH.ChordGenerator,root.MLH.ChordAudio);}
})(typeof window!=='undefined'?window:globalThis,function(C,A){
 'use strict';
 const letters=['C','D','E','F','G','A','B'],natural={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
 const kit={kick:{step:1,head:'normal',voice:1,name:'Bass Drum'},snare:{step:5,head:'normal',voice:0,name:'Snare'},hat:{step:9,head:'x',voice:0,name:'Hi-Hat'},openHat:{step:9,head:'x',open:true,voice:0,name:'Open Hi-Hat'},pedalHat:{step:-1,head:'x',voice:1,name:'Pedal Hi-Hat'},ride:{step:8,head:'x',voice:0,name:'Ride'},crash:{step:10,head:'x',voice:0,name:'Crash'},tomHigh:{step:7,head:'normal',voice:0,name:'High Tom'},tomMid:{step:6,head:'normal',voice:0,name:'Mid Tom'},tomLow:{step:3,head:'normal',voice:0,name:'Floor Tom'}};
 const midiKit={36:'kick',38:'snare',42:'hat',46:'openHat',44:'pedalHat',51:'ride',49:'crash',50:'tomHigh',47:'tomMid',45:'tomLow'};
 const round=value=>Math.round(value*4)/4;
 function keySignature(key,mode){
  const tonic=C.keyName(key,mode),start=letters.indexOf(tonic[0]),scale=C.modes[mode==='harmonicMinor'||mode==='melodicMinor'?'minor':mode]||C.modes.major,alterations={C:0,D:0,E:0,F:0,G:0,A:0,B:0};
  scale.forEach((offset,i)=>{const letter=letters[(start+i)%7];alterations[letter]=(key+offset-natural[letter]+18)%12-6;});
  const fifths=Object.values(alterations).reduce((a,b)=>a+b,0);
  return {fifths,alterations};
 }
 function spelling(midi,project,harmony){
  let name;
  if(harmony&&harmony!=='-')name=C.chordToneNames(C.spellChord(harmony,project.key,project.mode)).find(n=>C.pitchClass(n)===midi%12);
  if(!name)name=C.pitchNames(project.key,project.mode==='minor'&&midi%12===(project.key+11)%12?'harmonicMinor':project.mode)[midi%12];
  const letter=name[0],alter=(name.match(/#/g)||[]).length-(name.match(/b/g)||[]).length;
  const octave=(midi-natural[letter]-alter)/12-1;
  return {midi,letter,alter,octave,diatonic:octave*7+letters.indexOf(letter),head:'normal'};
 }
 function step(pitch,clef){return pitch.step??pitch.diatonic-(clef==='bass'?2*7+4:4*7+2);}
 function rhythm(ticks){
  const map={16:{base:4,dots:0},12:{base:2,dots:1},8:{base:2,dots:0},6:{base:1,dots:1},4:{base:1,dots:0},3:{base:.5,dots:1},2:{base:.5,dots:0},1:{base:.25,dots:0}};
  return map[ticks];
 }
 function splitSpan(start,end,barTicks,compound,rest=false){
  const out=[];let tick=start;
  if(rest&&start===0&&end===barTicks)return [{tick:0,ticks:barTicks,base:4,dots:0,measureRest:true}];
  while(tick<end){
   const pos=tick%barTicks,remain=end-tick;
   const values=rest?[16,8,4,2,1]:[16,12,8,6,4,3,2,1];
   const length=values.find(n=>{
    if(n>remain||n>barTicks-pos)return false;
    if(n===1)return true;
    if(compound){const group=6,offset=pos%group;return offset===0?(n<=group||pos===0&&n===barTicks):n<=group-offset&&pos%(n===3?3:Math.min(n,2))===0;}
    if(n>=4){if(pos%4)return false;if(n>4&&pos%8&&!(pos===0&&n===barTicks))return false;return true;}
    // As in Rhythmic Dictation, a semiquaver followed by a dotted quaver
    // occupies one beat. Keep the dotted quaver whole rather than tying two notes.
    return pos%4+n<=4&&(n===3?(pos%2===0||pos%4===1):pos%n===0);
   })||1;
   out.push({tick,ticks:length,...rhythm(length)});tick+=length;
  }
  return out;
 }
 function groupEvents(events,project,track){
  const map=new Map();
  for(const event of events){
   if(event.track!==track)continue;
   const start=round(event.beat),duration=event.notatedDuration??event.duration,end=round(event.beat+duration);
   if(end<=start)continue;
   const key=`${start}:${end}`;
   if(!map.has(key))map.set(key,{start,end,pitches:[],sourceIds:[],tieFrom:!!event.pickupTieFrom,tieTo:!!event.pickupTieTo,staccato:project.style==='reggae'&&track==='chords'});
   const group=map.get(key);if(!group.pitches.some(p=>p.midi===event.midi))group.pitches.push(spelling(event.midi,project,event.harmony));
   group.sourceIds.push(event.id);
  }
  return [...map.values()].sort((a,b)=>a.start-b.start||b.end-a.end);
 }
 function allocate(events){
  const voices=[],merged=new Map();
  for(const event of events){
   const key=`${event.start}:${event.end}`;
   if(!merged.has(key))merged.set(key,{...event,pitches:[],sourceIds:[]});
   const group=merged.get(key);
   for(const pitch of event.pitches)if(!group.pitches.some(p=>p.midi===pitch.midi))group.pitches.push(pitch);
   group.sourceIds.push(...(event.sourceIds||[]));
  }
  for(const event of [...merged.values()].sort((a,b)=>a.start-b.start||b.end-a.end)){let index=voices.findIndex(v=>v.at(-1).end<=event.start+.001);if(index<0){index=voices.length;voices.push([]);}voices[index].push(event);}
  return voices.length?voices:[[]];
 }
 function voiceBars(events,barCount,barTicks,compound,percussion=false){
  const bars=Array.from({length:barCount},()=>[]);
  events.forEach((event,eventIndex)=>{
   const start=Math.max(0,Math.round(event.start*4)),end=Math.min(barCount*barTicks,Math.round(event.end*4));
   for(let bar=Math.floor(start/barTicks);bar<Math.ceil(end/barTicks);bar++){
    const localStart=Math.max(start,bar*barTicks)-bar*barTicks,localEnd=Math.min(end,(bar+1)*barTicks)-bar*barTicks;
    // Each drum notehead represents a real hit. Within its beat, an offbeat
    // quaver or dotted quaver can run to the next hit without a tied duplicate.
    // If a compound-beat gap has no single note value, leave its tail as rest.
    const length=percussion?[16,12,8,6,4,3,2,1].find(n=>n<=localEnd-localStart):null;
    const chunks=percussion?[{tick:localStart,ticks:length,...rhythm(length)}]:splitSpan(localStart,localEnd,barTicks,compound);
    chunks.forEach((chunk,index)=>bars[bar].push({...chunk,pitches:event.pitches,eventId:eventIndex,tieFrom:!percussion&&(start<bar*barTicks||index>0||event.tieFrom&&bar===0&&index===0),tieTo:!percussion&&(end>(bar+1)*barTicks||index<chunks.length-1||event.tieTo&&bar===barCount-1&&index===chunks.length-1),rest:false,staccato:event.staccato}));
   }
  });
  return bars.map(tokens=>{
   tokens.sort((a,b)=>a.tick-b.tick);const filled=[];let cursor=0;
   for(const token of tokens){if(token.tick>cursor)filled.push(...splitSpan(cursor,token.tick,barTicks,compound,true).map(n=>({...n,rest:true,pitches:[]})));filled.push(token);cursor=token.tick+token.ticks;}
   if(cursor<barTicks)filled.push(...splitSpan(cursor,barTicks,barTicks,compound,true).map(n=>({...n,rest:true,pitches:[]})));
   return filled;
  });
 }
 function drumVoices(events,barCount,barTicks,compound){
  return [0,1].map(voice=>{
   const grouped=new Map();
   for(const event of events){const name=event.trackId||midiKit[event.midi],info=kit[name];if(event.track!=='drums'||!info||info.voice!==voice)continue;const t=round(event.beat);if(!grouped.has(t))grouped.set(t,[]);if(!grouped.get(t).some(p=>p.trackId===name))grouped.get(t).push({...info,midi:event.midi,trackId:name});}
   const times=[...grouped.keys()].sort((a,b)=>a-b),pulse=compound?1.5:1;
   const notes=times.map((time,index)=>({start:time,end:Math.min(times[index+1]??Infinity,(Math.floor(time/pulse+1e-5)+1)*pulse,barCount*barTicks/4),pitches:grouped.get(time)}));
   return voiceBars(notes,barCount,barTicks,compound,true);
  });
 }
 // One rest stream for a whole staff; individual voice rests retain timing in the model.
 function staffSilences(voices,bar,barTicks,compound){
  const hits=voices.flatMap(voice=>voice[bar].filter(token=>!token.rest)).sort((a,b)=>a.tick-b.tick);
  const rests=[];let end=0;
  for(const hit of hits){
   if(hit.tick>end)rests.push(...splitSpan(end,hit.tick,barTicks,compound,true));
   end=Math.max(end,hit.tick+hit.ticks);
  }
  if(end<barTicks)rests.push(...splitSpan(end,barTicks,barTicks,compound,true));
  return rests.map(token=>({...token,rest:true,pitches:[]}));
 }
 function annotateAccidentals(staff,signature,barCount){
  if(staff.clef==='percussion')return;
  for(let bar=0;bar<barCount;bar++){
   const state=new Map(),tokens=staff.voices.flatMap((voice,vi)=>voice[bar].map(token=>({token,vi}))).sort((a,b)=>a.token.tick-b.token.tick||a.vi-b.vi);
   for(const {token} of tokens){token.pitches=token.pitches.map(p=>{
    const key=`${p.letter}${p.octave}`,previous=state.has(key)?state.get(key):signature.alterations[p.letter];
    const accidental=token.tieFrom?null:previous===p.alter?null:p.alter;
    state.set(key,p.alter);return {...p,accidental};
   });}
  }
 }
 // Practice Questions rhythmInfo, positionSpacingForNote and accidentalPreSpacingForNote.
 function rhythmSpacing(beats,rest=false,measureRest=false){
  if(measureRest)return 2.2;
  const table=rest?{'.25':.62,'.5':.82,'.75':.95,'1':1.15,'1.5':1.35,'2':1.75,'3':2.75,'4':2.2}:{'.25':.62,'.5':.95,'.75':1.12,'1':1.35,'1.5':1.75,'2':2.15,'3':2.75,'4':3.4};
  return table[String(beats).replace(/^0\./,'.')]??Math.sqrt(beats)*1.35;
 }
 function spacingSlots(staff,bar,barTicks){
  const voices=staff.flatMap(s=>s.voices.map(v=>v[bar])),tokens=voices.flat(),ticks=[...new Set([0,...tokens.map(n=>n.tick)])].sort((a,b)=>a-b);
  return ticks.map((tick,index)=>{
   const at=tokens.filter(t=>t.tick===tick),interval=((ticks[index+1]??barTicks)-tick)/4;
   const rest=at.every(t=>t.rest),measureRest=rest&&at.every(t=>t.measureRest);
   let weight=rhythmSpacing(interval,rest,measureRest);
   // Dotted-quaver/semiquaver pairs have equal quaver spacing, as in Practice Questions.
   const dottedPair=voices.some(notes=>{const i=notes.findIndex(n=>n.tick===tick),n=notes[i];if(!n||n.rest)return false;return n.ticks===3&&(notes[i-1]?.ticks===1||notes[i+1]?.ticks===1)||n.ticks===1&&(notes[i-1]?.ticks===3||notes[i+1]?.ticks===3);});
   if(dottedPair&&(interval===.25||interval===.75))weight=.95;
   const pre=Math.max(0,...at.map(t=>t.pitches.reduce((sum,p)=>sum+(p.accidental===null||p.accidental===undefined?0:p.accidental>0?.72:.58),0)));
   return {tick,weight,pre,min:(weight+pre)*32};
  });
 }
 function editChord(project,barIndex,tick,value){
  const p=C.validate(project),beats=Number(p.timeSignature.split('/')[0])*4/Number(p.timeSignature.split('/')[1]);
  const beat=barIndex*beats+tick/4,entry=C.timeline(p).find(item=>Math.abs(item.beat-beat)<.001);
  if(!entry)throw Error('This chord could not be found.');
  const symbol=C.parse(value).symbol,item=p.sections[entry.sectionIndex].chords[entry.chordIndex];
  const target=tick>0&&item.secondChord?item.secondChord:item;
  target.symbol=entry.transpose?C.transpose(symbol,-entry.transpose):symbol;target.inversion=0;
  return C.validate(p);
 }
 function build(project,realizedEvents,options={}){
  const p=C.validate(project),[top,bottom]=p.timeSignature.split('/').map(Number),barBeats=options.pickup?p.upbeatBeats:top*4/bottom,barTicks=Math.round(barBeats*4),barCount=options.pickup?1:p.progressionBars===8?8:4,compound=bottom===8&&top%3===0;
  const harmony=C.timeline(p),plain={...p,swing:0,volumes:{chords:100,bass:100,melody:100,drums:100}};
  const source=realizedEvents||A.events(plain),selectedSource=options.pickup?source.filter(e=>e.track==='melody'&&e.beat<0).map(e=>({...e,beat:e.beat+p.upbeatBeats,duration:Math.min(e.duration,-e.beat),pickupTieTo:e.beat+e.duration>0})):source.filter(e=>e.beat+e.duration>0).map(e=>e.beat<0?{...e,beat:0,duration:e.beat+e.duration,pickupTieFrom:true}:e),events=selectedSource.filter(e=>['chords','bass','melody','drums','imported'].includes(e.track)&&e.beat<barCount*barBeats).map((event,id)=>{
   let duration=event.notatedDuration??event.duration;
   if(event.notatedDuration===undefined&&(event.track==='chords'||event.track==='bass')){
    if(p.style==='reggae'&&event.track==='chords'&&event.pianoHand!=='left')duration=.5;
    else if(p.style!=='block')duration=Math.max(.25,round(duration/.85));
   }
   const chord=harmony.find(c=>event.beat>=c.beat-.001&&event.beat<c.beat+c.duration-.001);
   return {...event,id,notatedDuration:Math.min(duration,barCount*barBeats-event.beat),harmony:event.track==='melody'?null:chord?.symbol};
  });
  const piano=groupEvents(events,p,'chords'),bass=groupEvents(events,p,'bass');
  const make=(id,label,clef,groups)=>({id,label,clef,voices:allocate(groups).map(voice=>voiceBars(voice,barCount,barTicks,compound))});
  // Choose each melody's clef from its own register across the complete part,
  // so an anacrusis and the following bars retain the same clef.
  const melodyClef=lane=>{
   const notes=p.melody.filter(note=>(note.layerId||'main')===lane.id);
   const duration=notes.reduce((total,note)=>total+note.duration,0);
   const register=duration?notes.reduce((total,note)=>total+note.midi*note.duration,0)/duration:12*((p.melodyOctave??4)+1);
   return register<60?'bass':'treble';
  };
  let staff=[...C.melodyLanes(p).map((lane,i)=>make(i===0?'melody':'melody-'+lane.id,lane.name,melodyClef(lane),groupEvents(events.filter(e=>e.track!=='melody'||(e.layerId||'main')===lane.id),p,'melody'))),
    make('piano-upper','Piano','treble',piano.map(e=>({...e,pitches:e.pitches.filter(n=>n.midi>=60)})).filter(e=>e.pitches.length)),
    make('piano-lower','','bass',[...piano.map(e=>({...e,pitches:e.pitches.filter(n=>n.midi<60)})).filter(e=>e.pitches.length),...bass]),
    {id:'drums',label:'Drums',clef:'percussion',voices:drumVoices(events,barCount,barTicks,compound)}];
  if(Array.isArray(p.importedParts))staff=p.importedParts.map(part=>{
    const groups=groupEvents(events.filter(e=>e.partId===part.id).map(e=>({...e,track:'melody'})),p,'melody');
    if(part.percussion)groups.forEach(g=>{g.pitches=g.pitches.map(pitch=>({...pitch,...(kit[midiKit[pitch.midi]]||{step:4,head:'x'}),trackId:midiKit[pitch.midi]||'midi-'+pitch.midi}));});
    const average=part.notes.length?part.notes.reduce((n,e)=>n+e.midi,0)/part.notes.length:60;
    return make(part.id,part.name,part.percussion?'percussion':average<55?'bass':'treble',groups);
  });
  staff.forEach(row=>{if(Object.hasOwn(p.scoreInstrumentNames,row.id))row.label=p.scoreInstrumentNames[row.id];});
  if(options.pickup)staff.forEach(row=>row.voices=row.voices.map(voice=>voice.map(tokens=>tokens.flatMap(token=>token.measureRest?splitSpan(0,barTicks,barTicks+1,compound,true).map(chunk=>({...token,...chunk,measureRest:false})):token))));
  const signature=keySignature(p.key,p.mode);staff.forEach(s=>annotateAccidentals(s,signature,barCount));
  const bars=Array.from({length:barCount},(_,bar)=>{
   const slots=spacingSlots(staff,bar,barTicks);
   return {index:bar,slots,minWidth:slots.reduce((n,s)=>n+s.min,0)+48,chords:harmony.filter(c=>c.beat>=bar*barBeats&&c.beat<(bar+1)*barBeats).map(c=>({tick:Math.round((c.beat-bar*barBeats)*4),symbol:C.notation(C.spellChord(c.symbol,p.key,p.mode))}))};
  });
  if(options.pickup){if(!options.allStaves)staff=staff.filter(row=>row.id.startsWith('melody'));bars.forEach(bar=>bar.chords=[]);}
  return {isPickup:!!options.pickup,showInitialTimeSignature:!!options.pickup||!p.upbeatBeats,title:p.title||'My arrangement',composer:p.composer||'',tempo:p.tempo,timeSignature:p.timeSignature,key:C.notation(C.keyName(p.key,p.mode))+' '+p.mode,barCount,barTicks,barBeats,compound,signature,staff,bars,swing:p.swing>0,style:p.style};
 }
 return {build,editChord,keySignature,spelling,step,splitSpan,staffSilences,kitSilences:staffSilences,kit,rhythmSpacing,spacingSlots};
});
