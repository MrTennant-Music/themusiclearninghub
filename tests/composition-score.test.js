const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),Babel=require('@babel/standalone');
const C=require('../chord-generator-core'),D=require('../drum-machine-core'),T=require('../composition-templates'),M=require('../composition-score');
const browser={MLH:{ChordGenerator:C,DrumMachine:D}};vm.runInNewContext(fs.readFileSync(require.resolve('../chord-generator-audio'),'utf8'),{window:browser});const A=browser.MLH.ChordAudio;
const score=p=>M.build(p,A.events({...p,swing:0,volumes:{chords:100,bass:100,melody:100,drums:100}}));
function checkTotals(s){for(const staff of s.staff)for(const voice of staff.voices){assert.equal(voice.length,s.barCount);for(const tokens of voice){assert.equal(tokens.reduce((n,t)=>n+t.ticks,0),s.barTicks,staff.id);let at=0;for(const token of tokens){assert.equal(token.tick,at,staff.id);at+=token.ticks;assert.ok(token.ticks>0);}}}}
test('every accompaniment and supported metre produces balanced 4/8-bar parts with realised notes',()=>{
 for(const signature of ['4/4','3/4','6/8'])for(const bars of [4,8])for(const style of Object.keys(A.styles).filter(x=>C.patternAllowed(x,signature))){
  const p=C.asStudio({...T.create('ode-to-joy',()=>.2),style,timeSignature:signature,progressionBars:bars,melody:[],drums:null});const s=score(p);checkTotals(s);assert.deepEqual(s.staff.map(x=>x.id),['melody','piano-upper','piano-lower','drums']);
  const events=A.events({...p,swing:0});
  for(const track of ['chords']){const written=s.staff.filter(x=>track==='chords'?x.id.startsWith('piano'):x.id==='bass').flatMap(x=>x.voices.flat(2)).filter(t=>!t.rest&&!t.tieFrom);const expected=events.filter(e=>e.track===track);assert.equal(written.reduce((n,t)=>n+t.pitches.length,0),expected.length,`${style} ${signature} ${bars} ${track}`);}
 }
});
test('held, overlapping and cross-bar melody notes retain all pitches and ties',()=>{
 const p=T.create('ode-to-joy',()=>0);p.melody=[{midi:60,beat:3.5,duration:2,velocity:120},{midi:64,beat:4,duration:1,velocity:120},{midi:67,beat:4,duration:2,velocity:120}];const s=score(p),staff=s.staff[0];checkTotals(s);assert.equal(staff.voices.length,3);const tokens=staff.voices.flat(2).filter(t=>!t.rest);assert.equal(tokens.reduce((n,t)=>n+t.ticks*t.pitches.length,0),20);assert.ok(tokens.some(t=>t.tieTo));assert.ok(tokens.some(t=>t.tieFrom));
});
test('minor dominant thirds use raised sevenths and naturals cancel accidentals within a bar',()=>{
 const p=T.create('ode-to-joy',()=>0);p.key=9;p.mode='minor';p.sections[0].chords[0].symbol='E';p.melody=[{midi:68,beat:0,duration:1},{midi:67,beat:1,duration:1},{midi:68,beat:4,duration:1}];const s=score(p),notes=s.staff[0].voices[0].flat().filter(t=>!t.rest).map(t=>t.pitches[0]);assert.deepEqual(notes.map(p=>[p.letter,p.alter,p.accidental]),[['G',1,1],['G',0,0],['G',1,1]]);assert.equal(s.signature.fifths,0);
 const piano=s.staff[1].voices.flat(2).flatMap(t=>t.pitches);assert.ok(piano.some(p=>p.letter==='G'&&p.alter===1));
});
test('every kit row maps to untuned positions and cymbal X heads with separate feet voice',()=>{
 const p=T.create('ode-to-joy',()=>0);p.drums=D.clearLinkedDrums(p.drums,4);for(const track of D.tracks)p.drums=D.editLinkedStep(p.drums,track.id,0,100,4);const s=score(p),drums=s.staff.at(-1);checkTotals(s);const pitches=drums.voices.flat(2).flatMap(t=>t.pitches);for(const track of D.tracks)assert.ok(pitches.some(p=>p.trackId===track.id));assert.ok(pitches.filter(p=>['hat','ride','crash','pedalHat'].includes(p.trackId)).every(p=>p.head==='x'));assert.ok(pitches.some(p=>p.trackId==='openHat'&&p.head==='x'&&p.open));assert.equal(drums.clef,'percussion');assert.equal(drums.voices.length,2);assert.equal(M.kit.hat.step,9);assert.equal(M.kit.openHat.step,9);assert.deepEqual(Object.fromEntries(Object.entries(M.kit).map(([id,p])=>[id,p.step])),{kick:1,snare:5,hat:9,openHat:9,pedalHat:-1,ride:8,crash:10,tomHigh:7,tomMid:6,tomLow:3});
});
test('independent later drum bars and second chords reach the score',()=>{
 const p=T.create('ode-to-joy',()=>0);p.drums=D.clearLinkedDrums(p.drums,4);delete p.drums.patternMode;p.drums=D.editLinkedStep(p.drums,'snare',7*16,100,4);const s=score(p);assert.ok(s.staff.at(-1).voices[0][7].some(t=>t.pitches.some(p=>p.trackId==='snare')));assert.ok(s.staff.at(-1).voices[0][0].every(t=>t.rest));assert.equal(s.bars[7].chords[1].symbol,'C');
});
test('score renderer uses shared Bravura, a true brace, four staves per system, beams and percussion heads',()=>{
 const context={React,window:{MLH:{CompositionScoreModel:M}},document:{}};vm.createContext(context);for(const file of ['bravura-symbols.js','shared/shared-notation-config.js','bravura-worksheet-outlines.js'])vm.runInContext(fs.readFileSync(require.resolve('../'+file),'utf8'),context);
 // The renderer calls the model with the playback event source, as in the browser.
 context.window.MLH.CompositionScoreModel={...M,build:score};vm.runInContext(Babel.transform(fs.readFileSync(require.resolve('../composition-score.jsx'),'utf8'),{presets:['react']}).code,context);
 const html=renderToStaticMarkup(React.createElement(context.window.MLH.CompositionScore,{project:T.create('honey-honey',()=>0)}));
 for(const name of ['piano-upper','piano-lower','melody','drums'])assert.equal((html.match(new RegExp(`data-staff="${name}"`,'g'))||[]).length,2);
 assert.ok(!html.includes('data-staff="bass"'));assert.ok(html.includes('studio-score-chord-box'));assert.ok(html.includes('Score title'));assert.ok(html.includes('Composer'));assert.ok(html.includes('viewBox="2 0 80 997"'));assert.ok(html.includes('\uE069'));assert.ok(html.includes('\uE0A9'));assert.ok(html.includes('data-score-tie'));assert.ok(html.includes('data-score-beam'));assert.ok(html.includes('\uE1FD'));assert.ok(html.includes('stroke-width="4"'));assert.ok(html.includes('data-note-symbol="quarterNoteStemUp"')||html.includes('data-note-symbol="quarterNoteStemDown"'));assert.ok(html.includes('\uE1D5')||html.includes('\uE1D6'));assert.ok(html.includes('Score bars 1 to 4:'));assert.ok(html.includes('Score bars 5 to 8:'));assert.ok(!html.includes('NaN'));assert.equal((html.match(/data-system-start="true"/g)||[]).length,2);assert.ok(!html.includes('Drum kit: normal noteheads'));
 const selectedBar=renderToStaticMarkup(React.createElement(context.window.MLH.CompositionScore,{project:T.create('honey-honey',()=>0),selectedBeat:8,onSelectBar:()=>{}}));
 assert.equal((selectedBar.match(/class="studio-score-playing-bar"/g)||[]).length,1);assert.ok(selectedBar.includes('aria-label="Select bar 3 for playback" aria-pressed="true"'));assert.equal((selectedBar.match(/studio-score-bar-target/g)||[]).length,8);
 const intermediate=renderToStaticMarkup(React.createElement(context.window.MLH.CompositionScore,{project:T.create('honey-honey',()=>0),finalBarline:false}));
 assert.ok(!intermediate.includes('data-piano-final-barline'));assert.ok(!intermediate.includes('stroke-width="4"'));assert.ok(html.includes('data-piano-final-barline'));
 const continuation=renderToStaticMarkup(React.createElement(context.window.MLH.CompositionScore,{project:T.create('honey-honey',()=>0),barNumberOffset:8,showHeading:false}));
 assert.ok(continuation.includes('Score bars 9 to 12:'));assert.ok(continuation.includes('Score bars 13 to 16:'));assert.ok(continuation.includes('studio-score-bar-number">9</text>'));assert.ok(continuation.includes('studio-score-bar-number">16</text>'));assert.ok(!continuation.includes('studio-score-heading'));assert.ok(!continuation.includes('Score title'));assert.ok(!continuation.includes('aria-label="Composer"'));
 const openKit=T.create('ode-to-joy',()=>0);openKit.drums=D.clearLinkedDrums(openKit.drums,4);openKit.drums=D.editLinkedStep(openKit.drums,'openHat',0,100,4);
 const openHtml=renderToStaticMarkup(React.createElement(context.window.MLH.CompositionScore,{project:openKit}));
 assert.ok(openHtml.includes('data-score-open-hi-hat="true"'));assert.ok(openHtml.includes('data-note-symbol="noteheadXBlack"'));assert.ok(!openHtml.includes('noteheadCircleX'));
 const silent=T.create('honey-honey',()=>0);silent.drums=D.clearLinkedDrums(silent.drums,4);
 const empty=renderToStaticMarkup(React.createElement(context.window.MLH.CompositionScore,{project:silent}));
 assert.equal((empty.match(/data-score-rest="drums"/g)||[]).length,8,'one drum rest per empty bar');
 const noChords=structuredClone(silent);noChords.sections.forEach(s=>s.chords.forEach(c=>{c.symbol='-';delete c.secondChord;}));
 const blankChords=renderToStaticMarkup(React.createElement(context.window.MLH.CompositionScore,{project:noChords}));assert.ok(!blankChords.includes('N.C.'));assert.ok(!blankChords.includes('studio-score-chord-box'));
 const live=renderToStaticMarkup(React.createElement(context.window.MLH.CompositionScore,{project:silent,playing:true,beat:17}));
 assert.equal((live.match(/class="studio-score-playing-bar"/g)||[]).length,1);assert.ok(live.includes('class="studio-score-active-note"'));assert.ok(live.includes('text-anchor="middle" dominant-baseline="central"'));
 const hidden={...silent,scoreDisplay:{piano:false,drums:false,chords:false,tempo:false,title:false,composer:false}};
 const melodyOnly=renderToStaticMarkup(React.createElement(context.window.MLH.CompositionScore,{project:hidden}));
 assert.ok(melodyOnly.includes('data-staff="melody"'));for(const marker of ['data-staff="piano-upper"','data-staff="piano-lower"','data-staff="drums"','studio-score-chord-box','studio-score-tempo','Score title','Composer'])assert.ok(!melodyOnly.includes(marker),marker);
 const none=renderToStaticMarkup(React.createElement(context.window.MLH.CompositionScore,{project:{...hidden,scoreDisplay:{...hidden.scoreDisplay,melody:false}}}));assert.ok(none.includes('Choose a part'));assert.ok(!none.includes('NaN'));
 const pianoOnly=renderToStaticMarkup(React.createElement(context.window.MLH.CompositionScore,{project:{...hidden,scoreDisplay:{...hidden.scoreDisplay,melody:false,piano:true}}}));assert.ok(pianoOnly.includes('viewBox="2 0 80 997"'));assert.ok(!pianoOnly.includes('data-staff="melody"'));
 const shortChords=C.asStudio({...silent,style:'bossa'});
 const flagged=renderToStaticMarkup(React.createElement(context.window.MLH.CompositionScore,{project:shortChords}));
 assert.ok(/data-pitch-count="[234]" data-integrated-note="false"/.test(flagged));
 assert.ok(!/data-pitch-count="[234]" data-integrated-note="true"/.test(flagged));
 assert.ok(flagged.includes('data-score-flag="true"'));


});

test('score metadata survives validation and lower accompaniment is on piano',()=>{
 const p=C.asStudio({...T.create('ode-to-joy',()=>0),title:'My composition',composer:'Pupil name'}),events=A.events(p),s=score(p);
 assert.equal(C.validate(p).composer,'Pupil name');assert.equal(s.title,'My composition');assert.equal(s.composer,'Pupil name');
 assert.ok(!events.some(e=>e.track==='bass'));assert.ok(events.some(e=>e.track==='chords'&&e.pianoHand==='left'));
 assert.ok(s.staff.find(s=>s.id==='piano-lower').voices.flat(2).some(t=>!t.rest));
 const midi=Array.from(C.songMidi(p,events));assert.ok(!midi.some((v,i)=>v===0xc1&&midi[i+1]===32));
});

test('score spacing matches Practice Questions duration weights, dotted pairs and accidentals',()=>{
 assert.equal(M.rhythmSpacing(.25),.62);assert.equal(M.rhythmSpacing(.5),.95);assert.equal(M.rhythmSpacing(1),1.35);assert.equal(M.rhythmSpacing(2),2.15);
 assert.equal(M.rhythmSpacing(.5,true),.82);assert.equal(M.rhythmSpacing(2,true),1.75);
 const note=(tick,ticks,accidental=null)=>({tick,ticks,rest:false,pitches:[{accidental}]});
 const staff=[{voices:[[[note(0,3),note(3,1,1),note(4,4,-1)]]]}];
 const slots=M.spacingSlots(staff,0,8);assert.equal(slots[0].weight,.95);assert.equal(slots[1].weight,.95);assert.equal(slots[1].pre,.72);assert.equal(slots[2].pre,.58);
});

test('PDF outlines cover every music glyph in the template and accompaniment scores',()=>{
 const context={React,window:{MLH:{CompositionScoreModel:{...M,build:score}}},document:{}};vm.createContext(context);
 for(const file of ['bravura-symbols.js','shared/shared-notation-config.js','bravura-worksheet-outlines.js','composition-score-outlines.js'])vm.runInContext(fs.readFileSync(require.resolve('../'+file),'utf8'),context);
 vm.runInContext(Babel.transform(fs.readFileSync(require.resolve('../composition-score.jsx'),'utf8'),{presets:['react']}).code,context);
 const outlines={...context.window.BRAVURA_WORKSHEET_OUTLINES.symbols,...context.window.MLH.compositionScoreOutlines};
 const keys=new Map(Object.entries(context.window.BRAVURA_SYMBOLS).map(([key,glyph])=>[glyph,key]));
 const projects=T.list.map(template=>T.create(template.id,()=>0));
 for(const style of Object.keys(A.styles))projects.push(C.asStudio({...T.create('honey-honey',()=>0),style}));
 const seen=new Set();
 for(const project of projects){
  const html=renderToStaticMarkup(React.createElement(context.window.MLH.CompositionScore,{project}));
  for(const match of html.matchAll(/<text[^>]*class="studio-score-glyph"[^>]*>([^<]*)<\/text>/g)){
   const key=keys.get(match[1]);assert.ok(outlines[key]?.path,`PDF outline missing for ${key}`);seen.add(key);
  }
 }
 for(const key of ['gClef','fClef','noteheadXBlack','quarterNoteStemUp','tie'])assert.ok(seen.has(key),key);
});

test('drum rests appear once and only during silence across the whole kit',()=>{
 const hit=(tick,ticks)=>({tick,ticks,rest:false,pitches:[{midi:36}]});
 const rest=(tick,ticks)=>({tick,ticks,rest:true,pitches:[]});
 const voices=[[[hit(0,4),rest(4,4),hit(8,4),rest(12,4)]],[[rest(0,4),hit(4,4),rest(8,4),hit(12,4)]]];
 assert.deepEqual(M.kitSilences(voices,0,16,false),[],'alternating voices keep the kit sounding throughout');
 voices[1][0]=[rest(0,16)];
 assert.deepEqual(M.kitSilences(voices,0,16,false).map(t=>[t.tick,t.ticks]),[[4,4],[12,4]],'show only the two silent beats');
 voices[0][0]=[rest(0,16)];
 const silent=M.kitSilences(voices,0,16,false);assert.equal(silent.length,1);assert.equal(silent[0].measureRest,true);
});

test('score chord edits update the addressed harmony, including second chords and transposition',()=>{
 const p=C.asStudio(T.create('honey-honey',()=>0));p.sections[0].chords[0].secondChord={symbol:'G',inversion:0};
 const edited=M.editChord(p,0,8,'Dm7');
 assert.equal(edited.sections[0].chords[0].symbol,p.sections[0].chords[0].symbol);
 assert.equal(edited.sections[0].chords[0].secondChord.symbol,'Dm7');
 assert.equal(C.timeline(edited).find(event=>event.beat===2).symbol,'Dm7');
 assert.notDeepEqual(C.timeline(edited).find(event=>event.beat===2).notes,C.timeline(p).find(event=>event.beat===2).notes);
 assert.equal(p.sections[0].chords[0].secondChord.symbol,'G','editing leaves the original project intact');
 assert.throws(()=>M.editChord(p,0,8,'Not a chord'));
 assert.throws(()=>M.editChord(p,0,1,'C'));
 p.sections[0].chords[1].transpose=2;
 const transposed=M.editChord(p,1,0,'E♭maj7');
 assert.equal(C.parse(C.timeline(transposed).find(event=>event.beat===4).symbol).root,3);
 const silent=M.editChord(p,0,0,'N.C.');assert.equal(silent.sections[0].chords[0].symbol,'-');
});

test('score instrument labels persist through studio validation and do not change playback',()=>{
 const original=C.asStudio(T.create('honey-honey',()=>0));
 const renamed=C.asStudio({...original,scoreInstrumentNames:{melody:'Solo flute','piano-upper':'Electric Piano',drums:'Percussion'}});
 assert.deepEqual(renamed.scoreInstrumentNames,{melody:'Solo flute','piano-upper':'Electric Piano',drums:'Percussion'});
 assert.deepEqual(score(renamed).staff.map(row=>row.label),['Solo flute','Electric Piano','','Percussion']);
 assert.deepEqual(A.events(renamed),A.events(original));
 assert.equal(C.validate({...renamed,scoreInstrumentNames:{melody:'x'.repeat(100)}}).scoreInstrumentNames.melody.length,40);
});

test('drum notation retains exact hit onsets with semiquaver–quaver–semiquaver and dotted-quaver groups',()=>{
 const p=T.create('ode-to-joy',()=>0);
 const notes=steps=>M.build(p,steps.map(t=>({track:'drums',trackId:'kick',midi:36,beat:t/4,duration:.14}))).staff.at(-1).voices[1][0];
 const group=notes([0,1,3]);
 assert.deepEqual(group.filter(t=>!t.rest).map(t=>[t.tick,t.ticks,t.base,t.dots]),[[0,1,.25,0],[1,2,.5,0],[3,1,.25,0]]);
 assert.deepEqual(notes([0,3]).filter(t=>!t.rest).map(t=>[t.tick,t.ticks,t.base,t.dots]),[[0,3,.5,1],[3,1,.25,0]]);
 assert.deepEqual(notes([3]).slice(0,3).map(t=>[t.tick,t.ticks,t.rest]),[[0,2,true],[2,1,true],[3,1,false]]);
 for(let mask=1;mask<16;mask++)for(let beat=0;beat<4;beat++){
  const hits=Array.from({length:4},(_,i)=>i).filter(i=>mask&(1<<i)).map(i=>beat*4+i),tokens=notes(hits);
  assert.deepEqual(tokens.filter(t=>!t.rest).map(t=>t.tick),hits);
  assert.ok(tokens.every(t=>!t.tieTo&&!t.tieFrom));assert.equal(tokens.reduce((sum,t)=>sum+t.ticks,0),16);
 }
});

test('compound drum beats never add a tied notehead between actual hits',()=>{
 const p={...T.create('ode-to-joy',()=>0),timeSignature:'6/8',drums:null};
 for(let mask=1;mask<64;mask++){
  const hits=Array.from({length:6},(_,i)=>i).filter(i=>mask&(1<<i));
  const s=M.build(p,hits.map(t=>({track:'drums',trackId:'kick',midi:36,beat:t/4,duration:.14})));checkTotals(s);
  const tokens=s.staff.at(-1).voices[1][0];
  assert.deepEqual(tokens.filter(t=>!t.rest).map(t=>t.tick),hits);assert.ok(tokens.every(t=>!t.tieTo&&!t.tieFrom));
 }
});

test('2/4 has two-beat bars, a varied duple drum bank and matching score and MIDI lengths',()=>{
 const grooves=D.groovesForSignature('2/4');assert.equal(grooves.length,8);
 for(const groove of grooves){
  for(const hits of Object.values(groove.hits))assert.ok(hits.every(t=>t>=0&&t<2));
  for(const bars of [4,8]){
   let drums=D.studioDrums(D.create(2),2,bars);
   drums=D.randomiseStudioPattern(drums,'all','2/4',()=>.5,choices=>choices.find(g=>g.name===groove.name));
   const p=C.asStudio({version:1,title:'Duple',tempo:120,key:0,mode:'major',timeSignature:'2/4',progressionBars:bars,style:'pop',drums,sections:[{chords:[{symbol:'C',beats:2}]}],melody:[]});
   assert.equal(C.totalBeats(p),bars*2);assert.ok(C.patternAllowed('pop','2/4'));
   const s=score(p);checkTotals(s);assert.equal(s.barTicks,8);assert.equal(s.barCount,bars);
   assert.equal(D.sequenceBeats(p.drums,2),bars*2);assert.ok(A.events(p).every(e=>e.beat<bars*2));
   const restored=C.importSongMidi(C.songMidi(p,A.events(p)));assert.equal(restored.timeSignature,'2/4');assert.equal(C.totalBeats(restored),bars*2);
  }
 }
});

test('default held accompaniment keeps bass notes for the full chord with no redundant rest voices',()=>{
 const p=C.asStudio({...T.create('ode-to-joy',()=>0),style:'block',melody:[],drums:null});
 const events=A.events(p),s=score(p);checkTotals(s);
 for(const chord of C.timeline(p)){
  const left=events.filter(e=>e.track==='chords'&&e.pianoHand==='left'&&e.beat===chord.beat);
  assert.ok(left.length);assert.ok(left.every(e=>e.duration===chord.duration));
 }
 const lower=s.staff.find(row=>row.id==='piano-lower');
 assert.equal(lower.voices.length,1);
 assert.ok(lower.voices[0].every(bar=>bar.every(token=>!token.rest)));
 const captured=A.accompanimentNotes(p);
 for(const event of events.filter(e=>e.track==='chords'))assert.equal(captured.find(n=>n.midi===event.midi&&n.beat===event.beat).duration,event.duration);
});

test('saved polyphonic piano bass shows one rest stream only during complete staff silence',()=>{
 const p=C.asStudio({...T.create('ode-to-joy',()=>0),style:'block',melody:[],drums:null,accompaniment:[
  {midi:60,beat:0,duration:4},{midi:48,beat:0,duration:4},{midi:36,beat:0,duration:1},
  {midi:40,beat:4,duration:1},{midi:43,beat:4.5,duration:1}
 ]});
 const s=score(p),lower=s.staff.find(row=>row.id==='piano-lower');
 assert.ok(lower.voices.length>1);assert.equal(M.staffSilences(lower.voices,0,s.barTicks,s.compound).length,0);
 const gaps=M.staffSilences(lower.voices,1,s.barTicks,s.compound);
 assert.ok(gaps.length);assert.ok(gaps.every(token=>token.tick>=6));
 const context={React,window:{MLH:{CompositionScoreModel:{...M,build:score}}},document:{}};vm.createContext(context);
 for(const file of ['bravura-symbols.js','shared/shared-notation-config.js','bravura-worksheet-outlines.js'])vm.runInContext(fs.readFileSync(require.resolve('../'+file),'utf8'),context);
 vm.runInContext(Babel.transform(fs.readFileSync(require.resolve('../composition-score.jsx'),'utf8'),{presets:['react']}).code,context);
 const html=renderToStaticMarkup(React.createElement(context.window.MLH.CompositionScore,{project:p}));
 const expected=Array.from({length:s.barCount},(_,i)=>M.staffSilences(lower.voices,i,s.barTicks,s.compound).length).reduce((a,b)=>a+b,0);
 assert.equal((html.match(/data-score-rest="piano-lower"/g)||[]).length,expected);
});

test('melody clefs follow each part register with octave 3 in bass and octave 4 in treble',()=>{
 const p=C.asStudio({...T.create('ode-to-joy',()=>0),upbeatBeats:1,counterMelodies:[{id:'counter-1',name:'Countermelody',instrument:'piano'},{id:'counter-2',name:'Countermelody 2',instrument:'piano'}],melody:[
  {midi:60,beat:0,duration:1},
  {midi:48,beat:-1,duration:1,layerId:'counter-1'},
  {midi:59,beat:0,duration:1,layerId:'counter-1'},
  {midi:36,beat:0,duration:1,layerId:'counter-2'}]});
 assert.deepEqual(score(p).staff.slice(0,3).map(s=>s.clef),['treble','bass','bass']);
 assert.deepEqual(M.build(p,A.events(p),{pickup:true}).staff.map(s=>s.clef),['treble','bass','bass']);
 const empty={...p,melody:[],melodyOctave:3};
 assert.deepEqual(score(empty).staff.slice(0,3).map(s=>s.clef),['bass','bass','bass']);
});

test('Scotch snaps retain a semiquaver and dotted quaver without tied duplicate heads',()=>{
 for(const signature of ['2/4','3/4','4/4']){
  const p=C.asStudio({...T.create('ode-to-joy',()=>0),timeSignature:signature,progressionBars:4,melody:[
   {midi:60,beat:0,duration:.25},{midi:62,beat:.25,duration:.75},
   {midi:64,beat:1,duration:.75},{midi:65,beat:1.75,duration:.25}],drums:null});
  const s=score(p),notes=s.staff[0].voices[0][0].filter(n=>!n.rest);checkTotals(s);
  assert.deepEqual(notes.map(n=>[n.tick,n.ticks,n.base,n.dots]),[[0,1,.25,0],[1,3,.5,1],[4,3,.5,1],[7,1,.25,0]]);
  assert.ok(notes.every(n=>!n.tieFrom&&!n.tieTo));
  const context={React,window:{MLH:{CompositionScoreModel:{...M,build:score}}},document:{}};vm.createContext(context);
  for(const file of ['bravura-symbols.js','shared/shared-notation-config.js','bravura-worksheet-outlines.js'])vm.runInContext(fs.readFileSync(require.resolve('../'+file),'utf8'),context);
  vm.runInContext(Babel.transform(fs.readFileSync(require.resolve('../composition-score.jsx'),'utf8'),{presets:['react']}).code,context);
  const html=renderToStaticMarkup(React.createElement(context.window.MLH.CompositionScore,{project:p}));
  assert.ok(html.includes('data-score-beam="true"'));assert.ok(!html.includes('data-score-tie'));assert.ok(!html.includes('NaN'));
 }
});
