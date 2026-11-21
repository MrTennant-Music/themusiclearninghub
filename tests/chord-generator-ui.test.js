const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),Babel=require('@babel/standalone');
const core=require('../chord-generator-core');
function render(saved,tab='Chords',arrangement=null){const window={MLH:{ChordGenerator:core,DrumMachine:require('../drum-machine-core'),shell:{pageShellClass:'page',pageContentClass:'content',mainShellClass:'main'},AppHeader:({children})=>React.createElement('header',null,'Composition Studio',children)}};const context={window,React,ReactDOM:{createRoot:()=>({render:()=>{}})},document:{getElementById:()=>null},URLSearchParams,localStorage:{setItem(){},getItem:key=>key==='mlh-chord-generator-v1-sections'?(arrangement?JSON.stringify(arrangement):null):key==='mlh-chord-generator-v1-tab'?tab:saved?JSON.stringify(saved):null},location:{hash:''}};vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../chord-generator-audio.js'),'utf8'),context);vm.runInContext(Babel.transform(fs.readFileSync(require.resolve('../composition-options.jsx'),'utf8'),{presets:['react']}).code,context);const source=fs.readFileSync(require.resolve('../chord-generator.jsx'),'utf8')+'\nwindow.renderedApp=App;';vm.runInContext(fs.readFileSync(require.resolve('../composition-arrangement.js'),'utf8'),context);vm.runInContext(Babel.transform(source.replace('window.renderedApp=App;',''),{presets:['react']}).code,context);vm.runInContext(Babel.transform(fs.readFileSync(require.resolve('../composition-imported-midi.jsx'),'utf8'),{presets:['react']}).code,context);vm.runInContext(Babel.transform(fs.readFileSync(require.resolve('../composition-sections.jsx'),'utf8')+'\nwindow.renderedApp=App;',{presets:['react']}).code,context);return renderToStaticMarkup(React.createElement(window.renderedApp));}
test('fresh editor renders empty chord bars, Default accompaniment and the three composition tabs',()=>{const html=render();for(const text of ['Composition Studio','Melody','Drums','Bar 1: -, 4 beats'])assert.ok(html.includes(text),text);});
test('corrupt saved project recovers to a valid new composition',()=>{const html=render({sections:[]});assert.ok(html.includes('Bar 1: -, 4 beats'));assert.ok(html.includes('Bar 4: -, 4 beats'));});

test('advanced chord controls stay out of the initial pupil screen',()=>{const html=render();for(const label of ['Chord tempo change','Chord transposition','Bass note','Chord inversion','MIDI output'])assert.ok(!html.includes('aria-label=\"'+label+'\"'),label);assert.ok(!html.includes('Change suggestions'));});

test('the pupil screen starts with section A and simple header section controls',()=>{const html=render();for(const text of ['Add chord','Section 1 name','Drag to change duration'])assert.ok(!html.includes(text),text);assert.ok(!html.includes('Progression length'));assert.ok(!html.includes('>Bass<'));assert.equal((html.match(/class="chord-card /g)||[]).length,4);assert.ok(html.includes('aria-label="Add section"'));assert.ok(html.includes('aria-haspopup="true"'));assert.ok(!html.includes('studio-section-options'));});

test('16-bar progressions are not offered',()=>{assert.ok(!render().includes('16 bars'));});


test('keyboard key-up releases the original pitch after an octave or dialog change',()=>{
 const source=fs.readFileSync(require.resolve('../chord-generator.jsx'),'utf8');
 const handler=source.match(/const onUp=(e=>[^\n]+);/)[1];
 const keyboardNotes={current:new Map([['KeyA',60]])},released=[];
 const onUp=vm.runInNewContext('('+handler+')',{keyboardNotes,editorOctave:2,releaseNote:midi=>released.push(midi)});
 onUp({code:'KeyA',key:'a'});assert.deepEqual(released,[60]);assert.equal(keyboardNotes.current.size,0);
 onUp({code:'KeyA',key:'a'});assert.deepEqual(released,[60]);
 keyboardNotes.current.set('KeyW',37);onUp({code:'KeyW',key:'W'});assert.deepEqual(released,[60,37]);
});

test('saved Studio tab restores Chords, Melody or Drums and safely rejects unavailable values',()=>{
 const source=fs.readFileSync(require.resolve('../chord-generator.jsx'),'utf8');
 const helper=source.match(/function savedStudioTab\(\)\{[\s\S]*?\n\}/)[0];
 for(const saved of ['Chords','Melody','Drums','Bass','bad',null]){
  const read=vm.runInNewContext(`(${helper})`,{STORE:'mlh-chord-generator-v1',localStorage:{getItem:key=>{assert.equal(key,'mlh-chord-generator-v1-tab');return saved;}}});
  assert.equal(read(),['Chords','Melody','Drums'].includes(saved)?saved:'Chords');
 }
 const blocked=vm.runInNewContext(`(${helper})`,{STORE:'mlh-chord-generator-v1',localStorage:{getItem(){throw Error('Storage unavailable');}}});
 assert.equal(blocked(),'Chords');
});

test('Range expands both the chromatic roll and the playable keyboard without changing notes',()=>{
 for(const octaves of [1,2]){
  const saved={version:1,title:'Octave display',tempo:120,key:0,mode:'major',timeSignature:'4/4',melodyOctave:4,melodyDisplayOctaves:octaves,sections:[{chords:[{symbol:'C',beats:4}]}],melody:[{midi:84,beat:0,duration:1,velocity:120}]};
  const html=render(saved,'Melody');
  assert.ok(html.includes('aria-label="Octave range" aria-pressed="'+(octaves===2)+'"'));
  assert.equal((html.match(/class="piano-key white/g)||[]).length,octaves*7+1);
  assert.equal((html.match(/class="piano-key black/g)||[]).length,octaves*5);
  assert.ok(html.includes('data-note-beat="0"'),'C6 remains visible even with a one-octave display');
  assert.equal(html.includes('two-octave-keyboard'),octaves===2);
  const p=core.asStudio(saved);assert.equal(p.melodyDisplayOctaves,octaves);assert.equal(p.melody[0].midi,84);
 }
});

test('used pitches outside the range and scale remain visible as piano-roll note blocks',()=>{
 for(const octaves of [1,2]){
  const melody=[36,61,84,97].map((midi,beat)=>({midi,beat,duration:.25,velocity:120}));
  const saved={version:1,title:'Imported range',tempo:120,key:0,mode:'major',timeSignature:'4/4',melodyOctave:4,melodyDisplayOctaves:octaves,sections:[{chords:[{symbol:'C',beats:4}]}],melody};
  const html=render(saved,'Melody');
  for(const n of melody)assert.ok(html.includes(`data-note-beat="${n.beat}"`),`Missing MIDI pitch ${n.midi}`);
  assert.equal((html.match(/data-note-beat=/g)||[]).length,melody.length);
  assert.ok(html.includes('C2, beat 1'));assert.ok(html.includes('C6, beat 1'));
  assert.deepEqual(core.asStudio(saved).melody,melody);
 }
});

test('new-session data is a silent blank slate with Default accompaniment',()=>{
 const D=require('../drum-machine-core'),source=fs.readFileSync(require.resolve('../chord-generator.jsx'),'utf8');
 const expression=source.slice(source.indexOf('const fresh = ')+14,source.indexOf('\nfunction load()')).trim().replace(/;$/,'');
 const fresh=vm.runInNewContext('('+expression+')',{window:{MLH:{DrumMachine:D}}});
 const p=core.asStudio(fresh());assert.equal(p.style,'block');assert.equal(p.title,'');assert.equal(p.composer,'');
 assert.equal(p.melody.length,0);assert.ok(p.sections[0].chords.every(c=>c.symbol==='-'));assert.ok(p.drums.patterns[0].tracks.every(t=>t.steps.every(hit=>hit===0)));
 const window={MLH:{ChordGenerator:core,DrumMachine:D}};vm.runInNewContext(fs.readFileSync(require.resolve('../chord-generator-audio'),'utf8'),{window});
 assert.equal(window.MLH.ChordAudio.events(p).length,0);
});

test('All opens the merged Chords, Melody and Drums workspace with the score kept behind File',()=>{
 const R=require('../composition-arrangement'),T=require('../composition-templates');
 let data=R.create(core.asStudio(T.create('ode-to-joy',()=>.5)));data=R.duplicate(data,data.active);data.active='all';
 const chords=render(null,'Chords',data);assert.equal((chords.match(/class="chord-card /g)||[]).length,16);assert.ok(chords.includes('Section A</h3>'));assert.ok(chords.includes('Section B</h3>'));assert.ok(!chords.includes('role="document"'));assert.ok(chords.includes('aria-label="Accompaniment"'));assert.ok(chords.includes('View only'));
 const melody=render(null,'Melody',data);assert.ok(melody.includes('all-section-heading-row'));assert.ok(melody.includes('Section A</span>'));assert.ok(melody.includes('Section B</span>'));assert.ok(!melody.includes('A · Bar'));assert.ok(!melody.includes('B · Bar'));assert.ok(melody.includes('aria-label="Melody timeline"'));assert.ok(melody.includes('C4, B, bar 9, beat 1'));assert.ok(!melody.includes('aria-label="Piano keyboard"'));assert.ok(melody.includes('aria-label="Octave range" disabled=""'));assert.ok(!melody.includes('role="document"'));
 const drums=render(null,'Drums',data);assert.ok(drums.includes('aria-label="Drum pattern bars"'));assert.ok(drums.includes('Bar 16'));assert.ok(drums.includes('Bass Drum, bar 1, step 16'));assert.ok(drums.includes('class="drum-grid"'));assert.ok(!drums.includes('Main Pattern'));assert.ok(!drums.includes('Mixed Patterns'));assert.ok(!chords.includes('A · Bar'));assert.equal((chords.match(/class="all-chord-section"/g)||[]).length,2);assert.ok(!drums.includes('role="document"'));
});
test('section menu uses real icons and compact reorder arrows without changing the active canvas',()=>{
 const R=require('../composition-arrangement'),T=require('../composition-templates'),D=require('../drum-machine-core');let saved=R.create(core.asStudio(T.create('ode-to-joy',()=>.5)));saved=R.duplicate(saved,saved.active);saved=R.duplicate(saved,saved.active);saved.active='section-2';
 const hooks=[],timers=[];let cursor=0;
 const fakeReact={...React,useState(initial){const index=cursor++;if(!(index in hooks))hooks[index]=typeof initial==='function'?initial():initial;return [hooks[index],value=>{hooks[index]=typeof value==='function'?value(hooks[index]):value;}];},useRef(initial){const index=cursor++;if(!(index in hooks))hooks[index]={current:initial};return hooks[index];},useEffect(){},useMemo:fn=>fn()};
 const browser={MLH:{ChordGenerator:core,DrumMachine:D,CompositionArrangement:R,MenuPanel:()=>null}},context={window:browser,React:fakeReact,ReactDOM:{createRoot:()=>({render(){}})},document:{getElementById:()=>null},localStorage:{getItem:key=>key==='mlh-chord-generator-v1-sections'?JSON.stringify(saved):null,setItem(){}},location:{hash:''},URLSearchParams,structuredClone,setTimeout:fn=>timers.push(fn)};vm.createContext(context);
 vm.runInContext(fs.readFileSync(require.resolve('../chord-generator-audio'),'utf8'),context);
 for(const file of ['chord-generator.jsx','composition-sections.jsx'])vm.runInContext(Babel.transform(fs.readFileSync(require.resolve('../'+file),'utf8'),{presets:['react']}).code,context);
 vm.runInContext('window.testApp=App;',context);
 function draw(){cursor=0;const root=browser.testApp(),nav=root.props.children[0].props.sectionControls;nav.ref.current={querySelector:()=>({scrollLeft:0,getBoundingClientRect:()=>({left:80,right:280})}),querySelectorAll:()=>hooks[0].items.map((item,i)=>({dataset:{sectionId:item.id},getBoundingClientRect:()=>({left:100+i*50,width:40})}))};return nav;}
 function letters(nav){return nav.props.children[1].props.children[1].map(anchor=>anchor.props.children[0]);}
 const before=JSON.stringify(saved.items[0].project);letters(draw())[0].props.onClick();assert.equal(hooks[0].active,'section-1');assert.ok(letters(draw()).every(button=>!button.props['aria-expanded']));letters(draw())[0].props.onClick();
 function menuActions(){const nav=draw(),anchor=nav.props.children[1].props.children[1].find(anchor=>anchor.props.children[1]);return anchor.props.children[1].props.children.props.children;}
 let actions=menuActions();assert.equal(actions[0].props.children[1].props.children,'Rename');assert.equal(actions[0].props.children[0].type,'img');assert.equal(actions[0].props.children[0].props.src,'ui-icons/rename.svg');
 const reorder=actions.find(a=>a?.props?.['aria-label']==='Reorder section');const arrows=reorder.props.children[1].props.children;assert.equal(arrows[0].props.disabled,true);arrows[1].props.onClick();
 assert.equal(hooks[0].items.map(s=>s.name).join(','),'B,A,C');assert.equal(hooks[0].active,'section-1');assert.equal(JSON.stringify(hooks[0].items[1].project),before);
 actions=menuActions();actions.find(a=>a?.props?.['aria-label']==='Reorder section').props.children[1].props.children[0].props.onClick();assert.equal(hooks[0].items.map(s=>s.name).join(','),'A,B,C');assert.equal(actions[5].type,'hr');assert.equal(actions[3].props.children[1].props.children,'Delete');
});

test('All and individual Studio use the same File and Customise fields with matching glyphs',()=>{
 const window={MLH:{ChordGenerator:core},BRAVURA_SYMBOLS:{gClef:'clef'}};
 vm.runInNewContext(Babel.transform(fs.readFileSync(require.resolve('../composition-options.jsx'),'utf8'),{presets:['react']}).code,{window,React});
 const file=renderToStaticMarkup(React.createElement(window.MLH.StudioFileMenuContent));
 for(const label of ['Reset','Import','View Score','Download MIDI','Your session is saved automatically'])assert.ok(file.includes(label),label);
 for(const icon of ['restart.svg','folder.svg','download.svg','studio-score-menu-icon'])assert.ok(file.includes(icon),icon);
 assert.ok(!file.includes('Download Project'));
 const fields=renderToStaticMarkup(React.createElement(window.MLH.StudioCustomiseFields,{project:core.asStudio({sections:[{chords:[{symbol:'-',beats:4}]}]}),names:core.names||['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'],tempoDraft:'',mixed:{key:true,metre:true,bars:true,tempo:true}}));
 for(const label of ['Key','Tempo','Metre','Bars','Template'])assert.ok(fields.includes(`aria-label="${label}"`),label);
 for(const icon of ['sharp.svg','flat.svg','metronome.svg','composition-time-4-4.svg','four-squares.svg','worksheet.svg'])assert.ok(fields.includes(icon),icon);
 assert.ok(fields.includes('placeholder="Mixed"'));assert.ok(fields.includes('value="mixed"'));
 for(const source of ['chord-generator.jsx','composition-sections.jsx']){const text=fs.readFileSync(require.resolve('../'+source),'utf8');assert.ok(text.includes('<window.MLH.StudioFileMenuContent'));assert.ok(text.includes('<window.MLH.StudioCustomiseFields'));}
});

test('All view disables editing and rejects music changes while retaining viewing controls',async()=>{
 const R=require('../composition-arrangement'),D=require('../drum-machine-core');let data=R.create(core.asStudio(require('../composition-templates').create('ode-to-joy',()=>.5)));data=R.duplicate(data,data.active);data.active='all';
 const hooks=[];let cursor=0,changes=0;
 const fakeReact={...React,useState(initial){const i=cursor++;if(!(i in hooks))hooks[i]=typeof initial==='function'?initial():initial;return [hooks[i],v=>{hooks[i]=typeof v==='function'?v(hooks[i]):v;}];},useRef(initial){const i=cursor++;if(!(i in hooks))hooks[i]={current:initial};return hooks[i];},useEffect(){},useMemo:fn=>fn()};
 const window={MLH:{ChordGenerator:core,DrumMachine:D,CompositionArrangement:R,shell:{},AppHeader:()=>null,MenuPanel:()=>null}},context={window,React:fakeReact,ReactDOM:{createRoot:()=>({render(){}}),createPortal:node=>node},document:{getElementById:()=>null,body:{}},localStorage:{getItem:()=>null},URLSearchParams,structuredClone,location:{hash:''}};vm.createContext(context);
 vm.runInContext(fs.readFileSync(require.resolve('../chord-generator-audio'),'utf8'),context);
 for(const file of ['composition-options.jsx','chord-generator.jsx','composition-sections.jsx'])vm.runInContext(Babel.transform(fs.readFileSync(require.resolve('../'+file),'utf8'),{presets:['react']}).code,context);
 vm.runInContext('window.testAll=AllSections;',context);
 function draw(){cursor=0;return window.testAll({data,onChange:next=>{data=next;changes++;}});}
 function nodes(node){if(!node||typeof node!=='object')return [];if(Array.isArray(node))return node.flatMap(nodes);return [node,...Object.values(node.props||{}).flatMap(v=>typeof v==='object'?nodes(v):[])];}
 function button(tree,label){return nodes(tree).find(n=>n.type==='button'&&(n.props.children===label||Array.isArray(n.props.children)&&n.props.children.includes(label)));}
 const original=JSON.stringify(data);assert.equal(button(draw(),'Randomise').props.disabled,true);button(draw(),'Randomise').props.onClick();assert.equal(changes,0);assert.equal(JSON.stringify(data),original);
 let tree=draw();assert.ok(nodes(tree).some(n=>n.type==='p'&&JSON.stringify(n.props.children).includes('whole composition')));button(tree,'Cancel').props.onClick();assert.equal(changes,0);
 for(const kind of ['key','metre']){
  tree=draw();button(tree,'Customise').props.onClick();tree=draw();const fields=nodes(tree).find(n=>n.props?.onKeyChange);
  if(kind==='key')fields.props.onKeyChange(7,'major');else fields.props.onMetreChange('3/4');
  assert.ok(nodes(tree).some(n=>n.type==='fieldset'&&n.props.disabled));assert.equal(changes,0);button(draw(),'Continue').props.onClick();
  assert.equal(JSON.stringify(data),original);
 }
 assert.equal(changes,0);
 // Seeking while stopped sets the next Play position; seeking during playback resumes.
 const starts=[];
 window.MLH.ChordAudio.Player.prototype.stop=function(){this.playing=false;};
 window.MLH.ChordAudio.Player.prototype.play=async function(project,onPosition,onEnd,options){this.playing=true;starts.push(options.startBeat);onPosition(options.startBeat);};
 const slider=()=>nodes(draw()).find(n=>n.type==='input'&&n.props['aria-label']==='Song position');
 slider().props.onChange({target:{value:'4'}});slider().props.onKeyUp();
 assert.ok(Math.abs(slider().props.value-4)<1e-8);assert.equal(starts.length,0);
 nodes(draw()).find(n=>n.props.className==='primary play').props.onClick();await Promise.resolve();
 assert.equal(starts[0],core.beatAtSeconds(R.compile(data,window.MLH.ChordAudio).project,4));
 slider().props.onKeyDown({key:'ArrowRight'});slider().props.onChange({target:{value:'6'}});slider().props.onKeyUp();await Promise.resolve();
 assert.equal(starts.length,2);assert.ok(Math.abs(slider().props.value-6)<1e-8);
 const compiled=R.compile(data,window.MLH.ChordAudio),boundary=core.secondsAtBeat(compiled.project,compiled.map[1].pickupStart);
 nodes(draw()).find(n=>n.type==='button'&&n.props['aria-label']===`Seek to Section B at 0:${String(Math.floor(boundary)).padStart(2,'0')}`).props.onClick();await Promise.resolve();
 assert.equal(starts.at(-1),compiled.map[1].pickupStart);assert.equal(changes,0);assert.equal(JSON.stringify(data),original);
});

test('section strip fades show only the sides with hidden sections',()=>{
 const hooks=[];let cursor=0;const R={...React,useRef(value){const i=cursor++;if(!(i in hooks))hooks[i]={current:value};return hooks[i];},useState(value){const i=cursor++;if(!(i in hooks))hooks[i]=value;return [hooks[i],v=>hooks[i]=typeof v==='function'?v(hooks[i]):v];},useEffect(){}};
 const context={React:R,useRef:R.useRef,useState:R.useState,useEffect:R.useEffect,window:{MLH:{CompositionArrangement:{}}},STORE:'test',document:{getElementById:()=>null},ReactDOM:{createRoot:()=>({render(){}})}};vm.createContext(context);vm.runInContext(Babel.transform(fs.readFileSync(require.resolve('../composition-imported-midi.jsx'),'utf8'),{presets:['react']}).code,context);vm.runInContext(Babel.transform(fs.readFileSync(require.resolve('../composition-sections.jsx'),'utf8')+'\nwindow.strip=SectionStrip;',{presets:['react']}).code,context);
 function draw(){cursor=0;return context.window.strip({children:'Sections'});}
 const tree=draw(),pane=tree.props.children[0];pane.ref.current={scrollLeft:0,clientWidth:410,scrollWidth:800};pane.props.onScroll();let result=draw();assert.ok(!result.props.children[1].props.className.includes('is-visible'));assert.ok(result.props.children[2].props.className.includes('is-visible'));
 pane.ref.current.scrollLeft=200;pane.props.onScroll();result=draw();assert.ok(result.props.children[1].props.className.includes('is-visible'));assert.ok(result.props.children[2].props.className.includes('is-visible'));
 pane.ref.current.scrollLeft=390;pane.props.onScroll();result=draw();assert.ok(!result.props.children[2].props.className.includes('is-visible'));
 pane.ref.current={scrollLeft:0,clientWidth:410,scrollWidth:410};pane.props.onScroll();result=draw();assert.ok(result.props.children.slice(1).every(n=>!n.props.className.includes('is-visible')));
});

 test('imported parts have their own named roll and instrument rather than fixed Melody and Drums tabs',()=>{const p=core.asStudio({version:1,tempo:120,key:0,mode:'major',timeSignature:'4/4',sections:[{chords:[{symbol:'-',beats:4}]}],importedParts:[{id:'midi-1-4',name:'Solo flute',channel:4,program:73,notes:[{midi:79,beat:0,duration:1,velocity:100,program:73}]}]});const html=render(p);assert.ok(html.includes('MIDI Parts'));assert.ok(html.includes('Solo flute · Channel 5'));assert.ok(html.includes('aria-label="MIDI instrument"'));assert.ok(!html.includes('class="composition-tabs"'));});

 test('melody options show coloured counter-melodies and an upbeat before full bars',()=>{const p=core.asStudio({version:1,tempo:120,key:0,mode:'major',timeSignature:'4/4',upbeatBeats:1,counterMelodies:[{id:'counter-1',name:'Answer',instrument:'flute'}],sections:[{chords:[{symbol:'-',beats:4}]}],melody:[{midi:60,beat:-1,duration:.5,velocity:120},{midi:67,beat:0,duration:1,velocity:120,layerId:'counter-1'}]});const html=render(p,'Melody');assert.ok(html.includes('More melody options'));assert.ok(html.includes('>Anacrusis</span>'));assert.ok(html.includes('>Answer</button>'));assert.ok(html.includes('data-note-beat="-1"'));assert.ok(html.includes('background:#2563eb'));assert.ok(html.includes('background:#d97706'));assert.ok(html.includes('C4, anacrusis 1'));});

test('melody timeline following uses the same scroll position on fitted and full-size canvases',()=>{
 const source=fs.readFileSync(require.resolve('../chord-generator.jsx'),'utf8');
 const component=source.slice(source.indexOf('function HorizontalTimeline('),source.indexOf('function SymbolSelect('));
 const scrollAt=scale=>{
  const effects=[],cell={dataset:{cellBeat:'8',cellDuration:'.5'},getBoundingClientRect:()=>({left:1100*scale,width:48*scale})};
  const pane={scrollLeft:0,clientWidth:500,offsetWidth:500,scrollWidth:3000,getBoundingClientRect:()=>({left:100*scale,width:500*scale}),querySelector:()=>cell,querySelectorAll:()=>[cell]};
  const context={React,useRef:()=>({current:pane}),useState:()=>[{},()=>{}],useEffect:fn=>effects.push(fn),window:{}};vm.createContext(context);
  vm.runInContext(Babel.transform(component+'\nwindow.Timeline=HorizontalTimeline;',{presets:['react']}).code,context);
  context.window.Timeline({playing:true,playheadBeat:8.25});effects[1]();return pane.scrollLeft;
 };
 assert.equal(scrollAt(1),scrollAt(.3));assert.ok(scrollAt(1)>0);
});
