const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const Babel=require('@babel/standalone');
const M=require('../metronome-core.js');
test('Metronome uses local prebuilt dependencies and its runtime matches the JSX source',()=>{
 const html=fs.readFileSync('metronome.html','utf8');
 assert.doesNotMatch(html,/<script[^>]+src=["']https?:\/\//i);
 assert.doesNotMatch(html,/text\/babel|@babel\/standalone|cdn\.tailwindcss\.com/i);
 assert.match(html,/vendor\/tailwind\/site\.css/);
 assert.match(html,/vendor\/react\/react\.production\.min\.js/);
 assert.match(html,/metronome-runtime\.js/);
 const source=html.match(/<script type="text\/x-metronome-source" id="metronome-jsx-source">([\s\S]*?)<\/script>/)[1];
 const compiled=Babel.transform(source,{filename:'metronome.html',presets:['react'],sourceMaps:false,comments:false,compact:true}).code;
 assert.equal(fs.readFileSync('metronome-runtime.js','utf8').trim(),compiled.trim());
});
test('Metronome restores every saved setting and exposes accurate control states',()=>{
 const source=fs.readFileSync('metronome.html','utf8');
 assert.match(source,/M\.settings\(JSON\.parse\(localStorage\.getItem\('mlh:metronome:v1'\)\)\|\|M\.defaults\)/);
 assert.doesNotMatch(source,/bpm:120,accent:true/);
 assert.match(source,/expanded=\{customiseOpen\} ariaControls="metronome-customise-menu"/);
 assert.match(source,/id="metronome-customise-menu"/);
 assert.match(source,/disabled=\{config\.bpm<=30\}/);
 assert.match(source,/disabled=\{config\.bpm>=240\}/);
});
test('subdivision notation keeps widened beams and a compact triplet numeral',()=>{
 const source=fs.readFileSync('metronome.html','utf8');
 assert.match(source,/transform=\{id==='triplets'\?undefined:'translate\(0 -5\)'\}/);
 assert.match(source,/x1=\{positions\[0\]\+10\} x2=\{positions\.at\(-1\)\+11\}/);
 assert.match(source,/id==='triplets'.*x="54" y="7".*fontSize="20"/);
});
test('tap tempo averages recent intervals and rejects interrupted tapping',()=>{
 assert.equal(M.tapTempo([0,500,1000,1500]),120);
 assert.equal(M.tapTempo([0,1000,2000]),60);
 assert.equal(M.tapTempo([0]),null);
 assert.equal(M.tapTempo([0,3000]),null);
});
test('settings clamp tempo and beats safely',()=>{
 assert.equal(M.settings({bpm:500}).bpm,240);
 assert.equal(M.settings({bpm:0,beats:0}).bpm,30);
 assert.equal(M.settings({bpm:0,beats:0}).beats,1);
 assert.equal(M.settings({subdivision:'bad'}).subdivision,'beat');
});
test('audio schedule keeps beats evenly spaced and accents only bar starts',()=>{
 const transport=new M.Transport(0,()=>({...M.defaults,bpm:120,beats:3}));
 const events=transport.take(0,3);
 assert.deepEqual(events.map(e=>e.time),[0,.5,1,1.5,2,2.5]);
 assert.deepEqual(events.map(e=>e.beat),[0,1,2,0,1,2]);
 assert.deepEqual(events.map(e=>e.accent),[true,false,false,true,false,false]);
});
test('triplets and asymmetric subdivisions retain the beat duration',()=>{
 for(const id of ['triplets','dotted','snap','semiquavers']){
  const transport=new M.Transport(0,()=>({...M.defaults,bpm:60,subdivision:id}));
  const events=transport.take(0,1.01);
  assert.deepEqual(events.slice(0,-1).map(e=>e.time),M.subdivisions[id].offsets);
  assert.equal(events.at(-1).time,1);
  assert.ok(events.slice(1,-1).every(e=>!e.accent));
 }
});
test('live tempo changes apply on next beat and delayed callbacks skip missed clicks',()=>{
 let bpm=120;
 const transport=new M.Transport(0,()=>({...M.defaults,bpm}));
 assert.equal(transport.take(0,.01)[0].time,0);
 bpm=60;
 assert.equal(transport.take(.5,.01)[0].time,.5);
 assert.equal(transport.take(1.5,.01)[0].time,1.5);
 const afterDelay=transport.take(10,.1);
 assert.equal(afterDelay.length,1);
 assert.equal(afterDelay[0].time,10.03);
});

function tempoEditor(initial=120) {
 const vm=require('node:vm'),React=require('react');let draft=null,bpm=initial;const commits=[];
 const html=fs.readFileSync('metronome.html','utf8'),source=html.slice(html.indexOf('function TempoInput('),html.indexOf('function App(){'));
 const context={React,M,useState:()=>[draft,value=>{draft=value;}]};
 vm.runInNewContext(Babel.transform(source,{presets:['react']}).code,context);
 const render=()=>context.TempoInput({bpm,onCommit:value=>{bpm=value;commits.push(value);}});
 return {render,commits,type(value){render().props.onChange({target:{value}});},blur(){const field=render();field.props.onBlur({currentTarget:{value:String(field.props.value)}});},get bpm(){return bpm;}};
}
test('tempo accepts deleting and typing 30 without applying limits between keystrokes',()=>{
 const h=tempoEditor();
 for(const text of ['', '3', '30']){h.type(text);assert.equal(h.render().props.value,text);assert.equal(h.bpm,120);}
 assert.equal(h.commits.length,0);h.blur();assert.equal(h.bpm,30);assert.equal(h.render().props.value,30);
});
test('tempo limits and rounding apply only when leaving the text field',()=>{
 for(const [text,expected] of [['1',30],['999',240],['-50',30],['72.6',73],['240',240],['',120],['not a tempo',120]]){
  const h=tempoEditor();h.type(text);assert.equal(h.render().props.value,text);assert.equal(h.bpm,120);
  h.blur();assert.equal(h.bpm,expected,text);assert.equal(h.render().props.value,expected);
 }
});
test('Enter commits a tempo and Escape restores the current tempo',()=>{
 const h=tempoEditor();h.type('30');let prevented=false;
 h.render().props.onKeyDown({key:'Enter',preventDefault(){prevented=true;},currentTarget:{blur:()=>h.blur()}});
 assert.equal(prevented,true);assert.equal(h.bpm,30);
 h.type('999');h.render().props.onKeyDown({key:'Escape',preventDefault(){}});
 assert.equal(h.render().props.value,30);h.blur();assert.equal(h.bpm,30);
});
