const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../chord-generator-core.js');
const project = () => ({version:1,title:'Test',tempo:100,key:0,mode:'major',timeSignature:'4/4',sections:[{name:'Verse',repeats:2,chords:[{symbol:'C',beats:4},{symbol:'G/B',beats:2},{symbol:'-',beats:2}]}],melody:[{beat:0,duration:1,midi:72,velocity:90}]});
test('chord parser identifies common, extended, altered and slash harmonies',()=>{
  assert.deepEqual(C.parse('F♯m7').intervals,[0,3,7,10]);
  assert.equal(C.parse('Bbmaj9/D').bass,2);
  assert.deepEqual(C.notes('C'),[60,64,67]);
  assert.deepEqual(C.notes('C',1),[64,67,72]);
  assert.deepEqual(C.notes('C',-1),[55,60,64]);
  assert.deepEqual(C.notes('Cdim7'),[60,63,66,69]);
  assert.deepEqual(C.notes('C6/9'),[60,64,67,69,74]);
  assert.deepEqual(C.notes('-'),[]);
  assert.throws(()=>C.parse('Cat'));
  assert.throws(()=>C.parse('<script>'));
  for(const quality of Object.keys(C.qualities)) assert.equal(C.parse('C'+quality).quality,quality);
});
test('transposition retains chord quality and slash bass',()=>{
  assert.equal(C.transpose('G/B',2),'A/C#');
  assert.equal(C.transpose('Bbm7/Db',-2),'Abm7/B');
  assert.equal(C.transpose('-',7),'-');
  for(let root=0;root<12;root++) for(let step=-12;step<=12;step++) {
    const result=C.parse(C.transpose(C.noteName(root)+'maj7',step));
    assert.equal(result.root,(root+step+24)%12);
    assert.equal(result.quality,'maj7');
  }
});
test('diatonic triads reflect each mode rather than major-only approximations',()=>{
  assert.deepEqual(C.diatonic(0).map(c=>c.symbol),['C','Dm','Em','F','G','Am','Bdim']);
  assert.deepEqual(C.diatonic('A','minor').map(c=>c.quality),['m','dim','','m','m','','']);
  assert.equal(C.diatonic('A','harmonicMinor')[4].symbol,'E');
  assert.deepEqual(C.diatonic('D','minor').map(c=>c.symbol),['Dm','Edim','F','Gm','Am','Bb','C']);
  assert.equal(C.diatonic('F#','major')[6].symbol,'E#dim');
  for(const mode of Object.keys(C.modes)) for(let key=0;key<12;key++) {
    const scale=C.modes[mode].map(n=>(n+key)%12);
    C.diatonic(key,mode).forEach(chord=>C.notes(chord).forEach(note=>assert.ok(scale.includes(note%12))));
  }
});
test('generation produces valid requested progressions',()=>{
  assert.deepEqual(C.generate(0,'major',4,'pop'),['C','G','Am','F']);
  assert.equal(C.generate(0,'major',12,'blues').length,12);
  for(const preset of Object.keys(C.presets)) for(const mode of Object.keys(C.modes)) C.generate(2,mode,8,preset).forEach(C.parse);
});
test('timeline respects section repeats, rests and chord duration',()=>{
  const timeline=C.timeline(project());
  assert.equal(timeline.length,6);
  assert.deepEqual(timeline.map(c=>c.beat),[0,4,6,8,12,14]);
  assert.equal(timeline[1].bass,47);
  assert.equal(timeline[2].bass,null);
  assert.equal(timeline[3].repeatIndex,1);
  assert.equal(C.totalBeats(project()),16);
});
test('imports reject unsafe or malformed musical values and do not mutate the source',()=>{
  const input=project(), result=C.validate(input);
  assert.equal(input.sections[0].chords[0].inversion,undefined);
  assert.equal(result.sections[0].chords[0].inversion,0);
  for(const bad of [null,{}, {...input,tempo:0}, {...input,mode:'unknown'}, {...input,sections:[]}]) assert.throws(()=>C.validate(bad));
  input.sections[0].chords[0].beats=-4;
  assert.throws(()=>C.validate(input));
});
test('MIDI is a valid track with tempo, metre, repeated chords, slash bass and melody',()=>{
  const bytes=C.midi(project());
  assert.equal(Buffer.from(bytes.subarray(0,4)).toString(),'MThd');
  assert.equal(Buffer.from(bytes.subarray(14,18)).toString(),'MTrk');
  assert.equal(new DataView(bytes.buffer).getUint32(18),bytes.length-22);
  let pos=22,tick=0;const ons=[],offs=[];let tempo=null;
  const variable=()=>{let n=0,b;do{b=bytes[pos++];n=(n<<7)|(b&127);}while(b&128);return n;};
  while(pos<bytes.length){tick+=variable();const status=bytes[pos++];if(status===0xff){const type=bytes[pos++],n=variable();if(type===0x51)tempo=(bytes[pos]<<16)|(bytes[pos+1]<<8)|bytes[pos+2];pos+=n;}else if((status&0xf0)===0xc0){pos++;}else{const pitch=bytes[pos++],velocity=bytes[pos++];((status&0xf0)===0x90?ons:offs).push({tick,pitch,velocity,channel:status&15});}}
  assert.equal(tempo,600000);
  assert.equal(ons.length,17);
  assert.equal(offs.length,ons.length);
  assert.ok(ons.some(n=>n.channel===1&&n.pitch===47&&n.tick===1920));
  assert.ok(ons.some(n=>n.channel===2&&n.pitch===72));
  assert.equal(Math.max(...offs.map(n=>n.tick)),14*480);
});
test('MusicXML balances measures, ties across barlines and preserves overlapping melody voices',()=>{
  const p=project();
  p.title='A & B <test>';
  p.sections=[{chords:[{symbol:'C',beats:6},{symbol:'G/B',beats:2}]}];
  p.melody=[{midi:72,beat:0,duration:2},{midi:74,beat:1,duration:4}];
  const xml=C.musicXML(p);
  assert.match(xml,/A &amp; B &lt;test&gt;/);
  assert.match(xml,/<tie type="start"\/>/);
  assert.match(xml,/<tie type="stop"\/>/);
  assert.match(xml,/<part-name>Melody<\/part-name>/);
  assert.equal([...xml.matchAll(/<measure /g)].length,6);
  for(const [,measure] of xml.matchAll(/<measure[^>]*>(.*?)<\/measure>/g)) {
    let cursor=0;
    for(const [,kind,content] of measure.matchAll(/<(note|forward|backup)>(.*?)<\/\1>/g)) {
      const duration=Number(/<duration>(\d+)<\/duration>/.exec(content)?.[1]);
      if(kind==='backup') cursor-=duration;
      else if(kind==='forward'||!content.includes('<chord/>')) cursor+=duration;
    }
    assert.equal(cursor,1920);
  }
});
test('altered extensions can be combined without losing the base seventh quality',()=>{
  assert.deepEqual(C.parse('C7(b9,#5)').intervals,[0,4,8,10,13]);
  assert.deepEqual(C.parse('Dm9#11').intervals,[0,3,7,10,14,18]);
  assert.deepEqual(C.parse('Fmaj13b13').intervals,[0,4,7,11,14,17,20]);
  assert.equal(C.transpose('C7b5b9/E',2),'D7b5b9/F#');
  assert.throws(()=>C.parse('C7b9#9'));
  assert.deepEqual(C.generate(0,'major',4,'classic'),['C','Am','F','G']);
  assert.deepEqual(C.generate(9,'major',4,'minor'),['Am','F','C','G']);
});
test('arrangement MIDI reflects notes, mix velocities and channels and imports pitched events',()=>{
  const events=[{beat:0,duration:1,midi:60,track:'chords',velocity:.5},{beat:.5,duration:.25,midi:62,track:'melody',velocity:1},{beat:0,duration:1,midi:36,track:'bass',velocity:.7},{beat:0,duration:.1,midi:42,track:'drums',velocity:1},{beat:0,duration:.1,midi:84,track:'click',velocity:1},{beat:2,duration:1,midi:65,track:'chords',velocity:0}];
  const imported=C.importMidi(C.midiEvents(project(),events));
  assert.equal(imported.length,3);
  assert.deepEqual(imported.find(n=>n.midi===62),{beat:.5,duration:.25,midi:62,velocity:127});
  assert.equal(imported.find(n=>n.midi===60).velocity,64);
});
test('MIDI imports combine format-one tracks and handle running status',()=>{
  // Track one: two overlapping C notes followed by velocity-zero note-offs, using running status.
  const t1=[0,0x90,60,80,120,60,100,120,60,0,120,60,0,0,0xff,0x2f,0];
  const t2=[0,0x92,72,90,0x83,0x60,0x82,72,0,0,0xff,0x2f,0];
  const chunk=t=>[77,84,114,107,0,0,0,t.length,...t];
  const bytes=new Uint8Array([77,84,104,100,0,0,0,6,0,1,0,2,1,224,...chunk(t1),...chunk(t2)]);
  const result=C.importMidi(bytes);
  assert.deepEqual(result.map(n=>[n.midi,n.beat,n.duration]),[[60,0,.5],[72,0,1],[60,.25,.5]]);
  const smpte=bytes.slice();smpte[12]=0xe7;
  assert.throws(()=>C.importMidi(smpte),/SMPTE/);
  assert.throws(()=>C.importMidi(bytes.slice(0,-2)),/incomplete/);
  assert.throws(()=>C.importMidi(new Uint8Array([1,2,3])));
});
test('per-chord tempo carries forward and seconds/beat conversion integrates every change',()=>{
  const p=project();p.tempo=120;
  p.sections=[{repeats:2,chords:[{symbol:'C',beats:4,tempo:120,transpose:2,label:'Opening'},{symbol:'G/B',beats:4,tempo:60},{symbol:'Am',beats:4}]}];
  const list=C.timeline(p);
  assert.deepEqual(list.map(e=>e.tempo),[120,60,60,120,60,60]);
  assert.deepEqual(list[0].notes,[62,66,69]);assert.equal(list[0].bass,38);
  assert.equal(list[0].symbol,'D');assert.equal(list[0].originalSymbol,'C');assert.equal(list[0].label,'Opening');
  assert.equal(C.secondsAtBeat(p,4),2);assert.equal(C.secondsAtBeat(p,8),6);assert.equal(C.secondsAtBeat(p,12),10);
  assert.equal(C.secondsAtBeat(p,24),20);
  for(let beat=-2;beat<=30;beat+=.25)assert.ok(Math.abs(C.beatAtSeconds(p,C.secondsAtBeat(p,beat))-beat)<1e-8);
  const xml=C.musicXML(p);
  assert.equal([...xml.matchAll(/<sound tempo=/g)].length,4);
  assert.match(xml,/Opening/);
  assert.throws(()=>C.validate({...p,sections:[{chords:[{symbol:'C',beats:4,tempo:400}]}]}));
});
test('MIDI records each changed tempo at its actual beat and extended inversions are valid',()=>{
  const p=project();p.sections=[{chords:[{symbol:'C13',beats:4,inversion:6,tempo:120},{symbol:'G',beats:4,tempo:60}]}];
  assert.equal(C.validate(p).sections[0].chords[0].inversion,6);
  const bytes=C.midiEvents(p,[]);let pos=22,tick=0;const tempos=[];
  const variable=()=>{let n=0,b;do{b=bytes[pos++];n=(n<<7)|(b&127);}while(b&128);return n;};
  while(pos<bytes.length){tick+=variable();const status=bytes[pos++];if(status===0xff){const type=bytes[pos++],n=variable();if(type===0x51)tempos.push([tick,(bytes[pos]<<16)|(bytes[pos+1]<<8)|bytes[pos+2]]);pos+=n;}else pos+=(status&0xf0)===0xc0?1:2;}
  assert.deepEqual(tempos,[[0,500000],[1920,1000000]]);
});

test('import validation rejects suggestion settings that would crash the chord palette',()=>{
  const p={version:1,sections:[{chords:[{symbol:'C',beats:4,inversion:0,suggestionScale:'not-a-mode'}]}]};
  assert.throws(()=>C.validate(p),/suggestion scale/);
  p.sections[0].chords[0].suggestionScale='major';p.sections[0].chords[0].suggestionKey=99;
  assert.throws(()=>C.validate(p),/suggestion key/);
});

test('accompaniment patterns are restricted to the metres their rhythms support',()=>{
 assert.equal(C.patternAllowed('waltz','3/4'),true);
 for(const metre of ['4/4','6/8'])assert.equal(C.patternAllowed('waltz',metre),false);
 for(const pattern of ['pop','rock','swing','reggae','bossa','dance']){assert.equal(C.patternAllowed(pattern,'4/4'),true);assert.equal(C.patternAllowed(pattern,'3/4'),false);assert.equal(C.patternAllowed(pattern,'6/8'),false);}
 for(const metre of ['3/4','4/4','6/8'])for(const pattern of ['block','arpeggio','ballad'])assert.equal(C.patternAllowed(pattern,metre),true);
 const p=project();p.style='waltz';p.timeSignature='4/4';assert.equal(C.validate(p).style,'block');p.timeSignature='3/4';assert.equal(C.validate(p).style,'waltz');p.timeSignature='6/8';assert.equal(C.validate(p).style,'block');
});

test('single progressions have exactly 4 or 8 correctly timed bars in each metre',()=>{
 for(const signature of ['3/4','4/4','6/8'])for(const bars of [4,8]){const source=project();source.timeSignature=signature;const result=C.asProgression(source,bars),beats=signature==='4/4'?4:3;assert.equal(result.sections.length,1);assert.equal(result.sections[0].repeats,1);assert.equal(result.sections[0].chords.length,bars);assert.ok(result.sections[0].chords.every(chord=>chord.beats===beats));assert.equal(C.totalBeats(result),bars*beats);assert.equal(result.progressionBars,bars);assert.deepEqual(result.melody,source.melody);assert.deepEqual(C.validate(JSON.parse(JSON.stringify(result))),result);const xml=C.musicXML(result);assert.equal((xml.match(/<measure number=/g)||[]).length,bars*3);}
 assert.throws(()=>C.asProgression(project(),6),/4 or 8/);
});
test('legacy sections flatten in musical order and resizing keeps existing chord edits',()=>{
 const input=project(),original=JSON.stringify(input);const eight=C.asProgression(input,8);assert.equal(JSON.stringify(input),original);assert.deepEqual(eight.sections[0].chords.slice(0,6).map(chord=>chord.symbol),['C','G/B','-','C','G/B','-']);eight.sections[0].chords[2].symbol='Dm7';const four=C.asProgression(eight,4);assert.equal(four.sections[0].chords[2].symbol,'Dm7');assert.equal(C.totalBeats(four),16);
});

test('shortest rhythm supports minim through semiquaver and preserves existing notes',()=>{
  for(const [grid,expected] of [[2,[0,0,0,2,2]],[4,[0,0,1,1,2]],[8,[0,.5,.5,1,2]],[16,[0,.25,.75,1.25,2]]]){
    assert.deepEqual([.1,.3,.7,1.2,1.99].map(beat=>C.quantiseBeat(beat,grid)),expected);
    const p=project();p.quantise=grid;
    assert.equal(C.validate(JSON.parse(JSON.stringify(p))).quantise,grid);
    assert.deepEqual(C.validate(p).melody,p.melody);
  }
  assert.equal(C.validate(project()).quantise,8);
  assert.throws(()=>C.validate({...project(),quantise:3}),/shortest rhythm/);
  assert.throws(()=>C.quantiseBeat(NaN,8),/quantise/);
  assert.equal(C.quantiseBeat(-.2,8),0);
});

test('generated melodies stay visible in the chosen octave, including empty progressions',()=>{
 for(const octave of [2,4,6])for(const symbol of ['C','F#m7','-'])for(const quantise of [4,8,16]){
  const p=project();p.quantise=quantise;p.sections=[{chords:[{symbol,beats:4}]}];
  const melody=C.generateMelody(p,octave,()=>.9),base=(octave+1)*12;
  assert.equal(melody.length,4);assert.ok(melody.every(n=>n.midi>=base&&n.midi<=base+12));
  assert.ok(melody.every(n=>n.beat>=0&&n.beat+n.duration<=4));
  assert.ok(melody.every(n=>Number.isInteger(n.beat*quantise/4)&&Number.isInteger(n.duration*quantise/4)));
  assert.ok(C.validate({...p,melody}).melody.length);
 }
});

test('random progressions keep every chord tone in the selected key and mode',()=>{
 for(let key=0;key<12;key++)for(const mode of Object.keys(C.modes))for(const count of [4,8,16])for(const seed of [0,.2,.4,.6,.8,.999]){
  const scale=C.modes[mode].map(interval=>(key+interval)%12);
  const chords=C.generate(key,mode,count,'random',()=>seed);
  assert.equal(chords.length,count);
  for(const symbol of chords)assert.ok(C.notes(symbol).every(note=>scale.includes(note%12)),`${key} ${mode}: ${symbol}`);
 }
});

test('Studio MIDI round trip preserves complete editing data, including silent songs',()=>{
 const D=require('../drum-machine-core');
 for(const silent of [false,true]){
  const p=C.asProgression(project(),8);p.title='Pupil song ♫';p.instrument='piano';p.quantise=8;p.drums=D.preset('funk');
  p.sections[0].chords[0].inversion=1;p.sections[0].chords[0].label='Opening';
  if(silent){p.sections[0].chords.forEach(c=>{c.symbol='-';c.inversion=0;});p.melody=[];p.drums.patterns.forEach(p=>p.tracks.forEach(t=>t.steps.fill(0)));}
  const original=C.validate(p),bytes=C.songMidi(p,[]),restored=C.importSongMidi(bytes);
  assert.equal(String.fromCharCode(...bytes.slice(0,4)),'MThd');
  assert.deepEqual(restored,original);
 }
});

test('ordinary MIDI opens as editable melody with tempo and metre',()=>{
 const p=C.asProgression({...project(),tempo:132,timeSignature:'3/4'},4);
 const imported=C.importSongMidi(C.midiEvents(p,[{track:'melody',beat:0,duration:.5,midi:72,velocity:.8}]));
 assert.equal(imported.tempo,132);assert.equal(imported.timeSignature,'3/4');assert.equal(imported.melody[0].midi,72);
 assert.equal(imported.progressionBars,4);assert.ok(imported.sections[0].chords.every(c=>c.symbol==='-'));
 assert.throws(()=>C.importSongMidi(new Uint8Array([0,1,2])),/incomplete|MIDI/);
});

test('opening chord octave sets the register and survives MIDI editing',()=>{
  const p=project();p.octave=3;p.sections[0].chords[0].octave=5;
  const events=C.timeline(p);
  assert.deepEqual(events[0].notes,[72,76,79]);
  assert.deepEqual(events[1].notes,[71,74,79]);
  const restored=C.importSongMidi(C.songMidi(p,[]));
  assert.equal(restored.sections[0].chords[0].octave,5);
  p.sections[0].chords[0].octave=7;
  assert.throws(()=>C.validate(p),/Chord octave/);
});

test('piano roll retains played notes outside the chosen octave and note filter',()=>{
 const allowed=n=>[0,2,4,5,7,9,11].includes(n%12);
 const pitches=C.pianoRollPitches([{midi:84},{midi:61},{midi:36}],4,allowed);
 for(const midi of [84,61,36])assert.ok(pitches.includes(midi));
 assert.ok(!pitches.includes(63));assert.ok(pitches.includes(60));
});

test('enharmonic names agree with key signatures and spell each chord interval correctly',()=>{
 assert.equal(C.spellChord('G#',0,'minor'),'Ab');
 assert.equal(C.spellChord('Dbm',9,'major'),'C#m');
 assert.deepEqual(C.chordToneNames('Ab'),['Ab','C','Eb']);
 assert.deepEqual(C.chordToneNames('F#'),['F#','A#','C#']);
 assert.deepEqual(C.chordToneNames('Cdim7'),['C','Eb','Gb','Bbb']);
 assert.deepEqual(C.chordToneNames('G#aug'),['G#','B#','D##']);
 assert.equal(C.pitchNames(6,'major')[5],'E#');
 assert.equal(C.keyName(1,'major'),'Db');assert.equal(C.keyName(1,'minor'),'C#');
 for(const mode of ['major','minor'])for(let key=0;key<12;key++){
  const names=C.pitchNames(key,mode);
  names.forEach((name,pc)=>assert.equal(C.pitchClass(name),pc));
  for(const chord of C.diatonic(key,mode))assert.equal(C.spellChord(chord.symbol,key,mode),chord.symbol);
  for(let root=0;root<12;root++)for(const quality of [...Object.keys(C.qualities),'7b9#11','7b13','7#13','7b11']){
   const symbol=C.spellChord(C.noteName(root)+quality,key,mode),parsed=C.parse(symbol);
   C.chordToneNames(symbol).forEach((name,i)=>assert.equal(C.pitchClass(name),(parsed.root+parsed.intervals[i])%12,symbol+' '+name));
  }
 }
});

test('borrowed chord tones become writable for bass and melody without opening unrelated pitches',()=>{
 const p=project();p.sections[0].chords=[{symbol:'C',beats:4},{symbol:'Ab',beats:4}];
 assert.deepEqual(C.writingPitchClasses(p),[0,2,3,4,5,7,8,9,11]);
 assert.deepEqual(C.writingPitchClasses(p,'chromatic'),Array.from({length:12},(_,i)=>i));
 const rows=C.pianoRollPitches([],4,n=>C.writingPitchClasses(p).includes(n%12));
 assert.ok(rows.includes(63)&&rows.includes(68));assert.ok(!rows.includes(61)&&!rows.includes(66));
 p.sections[0].chords[1].symbol='D';assert.ok(C.writingPitchClasses(p).includes(6));
 p.sections[0].chords[1]={symbol:'C/Db',beats:4};assert.ok(C.writingPitchClasses(p).includes(1));
 p.sections[0].chords[1]={symbol:'C',transpose:1,beats:4};assert.ok([1,5,8].every(pc=>C.writingPitchClasses(p).includes(pc)));
 p.sections[0].chords[1]={symbol:'-',beats:4};assert.deepEqual(C.writingPitchClasses(p),C.modes.major);
 p.mode='minor';p.sections[0].chords=[{symbol:'G',beats:4}];assert.ok(C.writingPitchClasses(p).includes(11));
});

test('voice leading retains common tones and chooses neighbouring octaves',()=>{
 assert.deepEqual(C.voiceLead([60,64,67],C.notes('F')),[60,65,69]);
 assert.deepEqual(C.voiceLead([60,64,67],C.notes('G')),[59,62,67]);
 assert.deepEqual(C.voiceLead([60,64,67],C.notes('C',0,6)),[60,64,67]);
 for(const from of ['C','Fm','G7','Abmaj9','Bdim7'])for(const to of ['D','F#m7','Bbmaj9','G7','C']){
  const before=C.notes(from),after=C.voiceLead(before,C.notes(to));
  assert.deepEqual(after.map(n=>n%12).sort((a,b)=>a-b),C.notes(to).map(n=>n%12).sort((a,b)=>a-b));
  assert.ok(after.every(n=>before.some(p=>Math.abs(p-n)<=6)));
 }
});
test('silent bars preserve the preceding sounding voicing',()=>{
 const p=project();p.sections=[{name:'Progression',repeats:1,chords:[{symbol:'C',beats:4},{symbol:'-',beats:4},{symbol:'G',beats:4}]}];
 assert.deepEqual(C.timeline(p)[2].notes,[59,62,67]);
});

test('random bass lines follow chord harmony, slash bass, metre and quantise',()=>{
 for(const timeSignature of ['4/4','3/4','6/8'])for(const quantise of [4,8,16])for(const octave of [1,2,3,4]){
  const beats=timeSignature==='4/4'?4:3;
  const p={...project(),timeSignature,quantise,sections:[{name:'Progression',repeats:1,chords:[{symbol:'Cm',beats},{symbol:'Abmaj7/Eb',beats},{symbol:'F#dim',beats,transpose:2},{symbol:'-',beats}]}]};
  for(const seed of [.05,.3,.6,.95]){
   const line=C.generateBass(p,octave,()=>seed),timeline=C.timeline(p);
   assert.ok(line.length>0);
   for(const [i,n] of line.entries()){
    const chord=timeline.find(c=>n.beat>=c.beat&&n.beat<c.beat+c.duration);assert.ok(chord&&chord.bass!==null);
    assert.ok([...chord.notes,chord.bass].some(pitch=>(pitch%12)===n.midi%12));
    assert.ok(Math.abs(n.beat/(4/quantise)-Math.round(n.beat/(4/quantise)))<1e-8);
    assert.ok(n.duration>0&&n.beat+n.duration<=chord.beat+chord.duration);
    assert.ok(n.midi>=24&&n.midi<=83);if(i)assert.ok(line[i-1].beat+line[i-1].duration<=n.beat);
   }
   assert.equal(line.find(n=>n.beat===beats).midi%12,3);
   assert.deepEqual(C.validate({...p,bass:line}).bass,line);
  }
 }
});
test('bass randomiser offers varied rhythms and leaves silent chords empty',()=>{
 const p=project();p.sections=[{name:'Progression',repeats:1,chords:[{symbol:'C',beats:4}]}];p.quantise=8;
 const patterns=new Set();for(let i=0;i<16;i++){const line=C.generateBass(p,2,()=>i/16+.001);patterns.add(line.map(n=>n.beat).join(','));}
 assert.ok(patterns.size>=10);p.sections[0].chords[0].symbol='-';assert.deepEqual(C.generateBass(p),[]);
 assert.throws(()=>C.generateBass(p,0),/octave/);
});

test('progressions offer only 4 or 8 bars and legacy 16-bar songs open at 8',()=>{
 assert.throws(()=>C.asProgression(project(),16),/4 or 8/);
 assert.throws(()=>C.createProgressionShuffler()(0,'major',16),/4 or 8/);
 const legacy={...C.asProgression(project(),8),progressionBars:16};
 legacy.sections[0].chords=[...legacy.sections[0].chords,...legacy.sections[0].chords];
 const original=JSON.stringify(legacy),converted=C.asProgression(legacy);
 assert.equal(converted.progressionBars,8);assert.equal(converted.sections[0].chords.length,8);assert.equal(JSON.stringify(legacy),original);
});

test('shortening a progression caps every drum pattern without changing the source',()=>{
 const D=require('../drum-machine-core');let drums=D.preset('rock');drums=D.resizePattern(drums,0,8,4,4);
 const source={...C.asProgression(project(),8),drums},before=JSON.stringify(source);
 const shortened=C.asProgression(source,4);assert.equal(shortened.drums.patterns[0].bars,4);assert.equal(shortened.drums.patterns[0].tracks[0].steps.length,64);assert.equal(JSON.stringify(source),before);
});

test('sixteenth-note settings survive validation and Studio reload without erasing music',()=>{const p=project();p.quantise=16;const restored=C.asStudio(p);assert.equal(restored.quantise,16);assert.deepEqual(restored.melody,p.melody.map(n=>({...n,velocity:120})));assert.equal(C.quantiseBeat(.3,16),.25);});

test('fixed studio keeps four melody bars, one drum pattern and automatic bass without mutating the song',()=>{
 const D=require('../drum-machine-core');
 const p=project();p.progressionBars=4;p.bass=[{beat:0,duration:1,midi:36}];p.melody.push({beat:5,duration:1,midi:74});
 p.drums=D.resizePattern(D.create(4),0,4,4,4);
 const before=structuredClone(p),result=C.asStudio(p);
 assert.deepEqual(p,before);assert.equal(result.progressionBars,4);assert.equal(result.sections[0].chords.length,4);
 assert.equal(result.bass,null);assert.equal(result.volumes.bass,58.5);assert.equal(result.melodyBars,4);assert.equal(result.quantise,8);
 assert.ok(result.melody.every(n=>n.beat+n.duration<=16));assert.equal(result.drums.patterns.length,1);assert.equal(result.drums.patterns[0].bars,4);assert.deepEqual(result.drums.sequence,[{pattern:0,repeats:1}]);
});

test('two-octave melody grid matches the keyboard from C4 to C6',()=>{
 const chromatic=C.pianoRollPitches([],4,()=>true,2);assert.equal(chromatic.length,25);assert.equal(chromatic[0],84);assert.equal(chromatic.at(-1),60);
 const scale=C.pianoRollPitches([],4,n=>[0,2,4,5,7,9,11].includes(n%12),2);assert.equal(scale.length,15);assert.ok(scale.includes(72));
});

test('legacy one-bar melody expands across four bars without snapping',()=>{const p=project();p.melodyBars=1;p.melody=[{beat:.137,duration:.5,midi:60}];const result=C.asStudio(p);assert.equal(result.melody.length,4);assert.ok(Math.abs(result.melody[3].beat-12.137)<1e-9);assert.deepEqual(C.asStudio(result).melody,result.melody);});

test('held note recording snaps starts and lengths to quavers and stops at the song boundary',()=>{
 assert.deepEqual(C.heldNoteSpan(.31,1.87,16),{beat:.5,duration:1.5});
 assert.deepEqual(C.heldNoteSpan(.1,.15,16),{beat:0,duration:.5});
 assert.deepEqual(C.heldNoteSpan(15.8,17.5,16),{beat:15.5,duration:.5});
 assert.deepEqual(C.heldNoteSpan(16.31,17.87,16),{beat:.5,duration:1.5});
});
test('drag resizing snaps to cells, preserves other pitches and cannot cross the next same-pitch note',()=>{
 const notes=[{beat:1,duration:.5,midi:60},{beat:4,duration:.5,midi:60},{beat:2,duration:.5,midi:64}],before=structuredClone(notes);
 assert.equal(C.resizeNote(notes,0,2.2,16)[0].duration,2);
 assert.equal(C.resizeNote(notes,0,8,16)[0].duration,3);
 assert.equal(C.resizeNote(notes,0,-1,16)[0].duration,.5);
 assert.deepEqual(notes,before);
 assert.deepEqual(C.resizeNote(notes,0,2,16).slice(1),notes.slice(1));
});

test('moving melody notes snaps time, changes pitch and preserves duration without overwriting notes',()=>{
 const notes=[{beat:1,duration:1.5,midi:60,velocity:92},{beat:5,duration:1,midi:64}],before=structuredClone(notes);
 const moved=C.moveNote(notes,0,2.3,67,16);assert.equal(moved[0].beat,2.5);assert.equal(moved[0].midi,67);assert.equal(moved[0].duration,1.5);assert.equal(moved[0].velocity,92);
 assert.deepEqual(C.moveNote(notes,0,5,64,16),notes);assert.equal(C.moveNote(notes,0,20,67,16)[0].beat,14.5);
 assert.equal(C.moveNote(notes,0,-2,67,16)[0].beat,0);assert.deepEqual(notes,before);assert.deepEqual(moved[1],notes[1]);
});

test('studio melody octave defaults to four and stays within keyboard limits',()=>{assert.equal(C.asStudio(project()).melodyOctave,4);assert.equal(C.asStudio({...project(),melodyOctave:5}).melodyOctave,5);assert.equal(C.asStudio({...project(),melodyOctave:9}).melodyOctave,6);assert.equal(C.asStudio({...project(),melodyOctave:0}).melodyOctave,2);});

test('octave controls transpose the whole melody and retain timing, length and velocity',()=>{
 const p={...project(),melodyOctave:4,melody:[{midi:60,beat:0,duration:2,velocity:120},{midi:72,beat:3.5,duration:.5,velocity:127}]},before=structuredClone(p);
 const up=C.shiftMelodyOctave(p,1);assert.equal(up.melodyOctave,5);assert.deepEqual(up.melody,p.melody.map(n=>({...n,midi:n.midi+12})));assert.deepEqual(C.shiftMelodyOctave(up,-1),p);assert.deepEqual(p,before);
 assert.deepEqual(C.shiftMelodyOctave({...p,melodyOctave:6},1),{...p,melodyOctave:6});
 assert.deepEqual(C.shiftMelodyOctave({...p,melody:[{midi:108,beat:0,duration:1}]},1).melody,[{midi:108,beat:0,duration:1}]);
});


test('minor melody Scale uses the harmonic seventh rather than the natural-minor seventh',()=>{
 for(let key=0;key<12;key++){
  const p={key,mode:'minor',sections:[{chords:[]}]};
  const pitches=C.writingPitchClasses(p);
  assert.ok(!pitches.includes((key+10)%12));
  assert.ok(pitches.includes((key+11)%12));
  assert.equal(pitches.length,7);
  assert.equal(C.writingPitchClasses(p,'chromatic').length,12);
 }
});


test('second chords split a bar equally while preserving four bars, voice leading and saved harmony',()=>{
 const p=C.asStudio(project());p.sections[0].chords[0]={symbol:'C',beats:4,secondChord:{symbol:'G',octave:4,inversion:0}};
 const saved=C.asStudio(JSON.parse(JSON.stringify(p))),events=C.timeline(saved);
 assert.equal(saved.sections[0].chords.length,4);assert.equal(C.totalBeats(saved),16);
 assert.deepEqual(events.slice(0,2).map(e=>[e.symbol,e.beat,e.duration,e.chordIndex]),[['C',0,2,0],['G',2,2,0]]);
 assert.deepEqual(events[1].notes,C.voiceLead(events[0].notes,C.notes('G',0,4)));
 assert.equal(C.importSongMidi(C.songMidi(saved)).sections[0].chords[0].secondChord.symbol,'G');
 const bad=structuredClone(saved);bad.sections[0].chords[0].secondChord.symbol='invalid';assert.throws(()=>C.validate(bad));
 delete saved.sections[0].chords[0].secondChord;
 assert.equal(C.timeline(saved).length,4);assert.equal(C.timeline(saved)[0].duration,4);
 for(const timeSignature of ['3/4','6/8']){const different=C.asStudio({...p,timeSignature,drums:undefined});assert.equal(C.timeline(different)[0].duration,1.5);assert.equal(C.totalBeats(different),12);}
});


test('Bars setting gives chords, melody and linked drums matching four- or eight-bar lengths',()=>{
 const D=require('../drum-machine-core');
 for(const signature of ['4/4','3/4','6/8']){
  const bpb=signature==='4/4'?4:3;
  const initial=C.asStudio({...project(),timeSignature:signature,progressionBars:4,drums:D.create(bpb)});
  initial.sections[0].chords[0].secondChord={symbol:'G',inversion:0,octave:4};
  let eight=C.asStudio({...initial,progressionBars:8});
  assert.equal(eight.sections[0].chords.length,8);assert.equal(C.totalBeats(eight),bpb*8);assert.equal(eight.melodyBars,8);
  assert.equal(eight.sections[0].chords[4].secondChord.symbol,'G');assert.equal(eight.drums.patterns[0].bars,8);assert.equal(eight.drums.linkedBars.length,8);
  eight.melody=[{beat:bpb*7,duration:1,midi:72,velocity:120}];
  eight.drums=D.editLinkedStep(eight.drums,'kick',bpb*4*7,110,bpb);
  eight=C.asStudio(eight);
  assert.equal(eight.melody[0].beat,bpb*7);assert.equal(eight.drums.linkedBars[7],true);
  const roundtrip=C.asStudio(C.importSongMidi(C.songMidi(eight)));
  assert.equal(roundtrip.progressionBars,8);assert.equal(roundtrip.melody[0].beat,bpb*7);assert.equal(roundtrip.drums.linkedBars[7],true);
  const four=C.asStudio({...eight,progressionBars:4});
  assert.equal(four.sections[0].chords.length,4);assert.equal(four.melody.length,0);assert.equal(four.drums.patterns[0].bars,4);assert.equal(four.drums.linkedBars.length,4);
 }
});


test('Studio initialises its drum groove before visiting Drums and retains it on later updates',()=>{
 const D=require('../drum-machine-core');
 const first=C.asStudio(project());
 assert.ok(first.drums);assert.equal(first.drums.patterns[0].bars,4);
 const before=D.events(first.drums,16);
 assert.deepEqual(D.events(C.asStudio(first).drums,16),before);
 const legacy=Array.from({length:3},()=>Array(16).fill(false));legacy[0][1]=true;
 const migrated=C.asStudio({...project(),drumPattern:legacy});
 assert.equal(migrated.drumPattern,null);assert.ok(D.events(migrated.drums,16).some(e=>e.midi===36&&e.beat===.5));
});


test('each shortest rhythm controls held notes, placement, relocation and resizing',()=>{
 for(const division of [2,4,8,16]){
  const step=4/division,p=C.asStudio({...project(),quantise:division});assert.equal(p.quantise,division);
  const note=C.placeNote([],step,60,16,division)[0];assert.equal(note.duration,step);assert.equal(note.beat,step);
  assert.deepEqual(C.heldNoteSpan(0,.01,16,division),{beat:0,duration:step});
  assert.equal(C.heldNoteSpan(0,step*3,16,division).duration,step*3);
  assert.equal(C.resizeNote([note],0,step*2,16,division)[0].duration,step*2);
  assert.equal(C.moveNote([note],0,step*3.1,62,16,division)[0].beat,step*3);
 }
});
test('two semiquavers occupy separate half blocks inside one unchanged quaver cell',()=>{
 const notes=[{midi:60,beat:0,duration:.25},{midi:60,beat:.25,duration:.25},{midi:62,beat:.25,duration:1}];
 assert.deepEqual(C.rollCellSegments(notes,60,0).map(({left,width,ends})=>({left,width,ends})),[{left:0,width:50,ends:true},{left:50,width:50,ends:true}]);
 assert.deepEqual(C.rollCellSegments(notes,62,0).map(({left,width,ends,continuation})=>({left,width,ends,continuation})),[{left:50,width:50,ends:false,continuation:false}]);
 assert.deepEqual(C.rollCellSegments(notes,62,.5).map(({left,width,ends,continuation})=>({left,width,ends,continuation})),[{left:0,width:100,ends:false,continuation:true}]);
 assert.equal(C.rollCellSegments(notes,62,1)[0].width,50);
});
test('coarse rhythm entry and resizing never overwrite existing notes or exceed the arrangement',()=>{
 const notes=[{midi:60,beat:1,duration:.5}];assert.deepEqual(C.placeNote(notes,0,60,16,2),notes);
 assert.deepEqual(C.resizeNote([{midi:60,beat:0,duration:.25},...notes],0,4,16,2),[{midi:60,beat:0,duration:.25},...notes]);
 for(const division of [2,4,8,16]){const note=C.placeNote([],15.9,60,16,division)[0];assert.equal(note.beat+note.duration,16);}
});

test('ordinary long MIDI splits into independent eight-bar canvases without dropping boundary notes or drums',()=>{
 const p=C.validate({...project(),sections:[{name:'Long piece',repeats:1,chords:Array.from({length:20},()=>({symbol:'C',beats:4}))}]});
 const notes=[{track:'melody',midi:72,beat:0,duration:1,velocity:.8},{track:'melody',midi:76,beat:31,duration:2,velocity:.9},{track:'melody',midi:79,beat:79,duration:1,velocity:.8},{track:'chords',midi:48,beat:0,duration:4,velocity:.7},{track:'chords',midi:52,beat:0,duration:4,velocity:.7},{track:'chords',midi:55,beat:0,duration:4,velocity:.7},{track:'drums',midi:36,beat:64,duration:.1,velocity:.8}];
 const imported=C.importSongMidi(C.midiEvents(p,notes)),items=imported.studioArrangement.items;
 assert.deepEqual(items.map(i=>i.project.progressionBars),[8,8,4]);assert.deepEqual(items.map(i=>i.name),['A','B','C']);assert.equal(imported.studioArrangement.active,'all');
 assert.ok(items[0].project.melody.some(n=>n.midi===76&&n.beat===31&&n.duration===1));assert.ok(items[1].project.melody.some(n=>n.midi===76&&n.beat===0&&n.duration===1));assert.ok(items[2].project.melody.some(n=>n.midi===79&&n.beat===15));assert.equal(items[0].project.accompaniment.length,3);assert.ok(items[2].project.drums.patterns[0].tracks.find(t=>t.id==='kick').steps[0]>0);
 const R=require('../composition-arrangement');assert.equal(R.validate(imported.studioArrangement).items.length,3);
});
