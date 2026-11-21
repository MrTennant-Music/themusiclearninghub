const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),Babel=require('@babel/standalone');
function pianoHarness(){
 const source=fs.readFileSync('chord-generator.jsx','utf8');const refs=[],states=[],effects=[],played=[],released=[],listeners={};let ri=0,si=0,point=null;
 const React={createElement:(type,props,...children)=>({type,props:props||{},children})};
 const context={React,names:['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'],useState(initial){const i=si++;if(!(i in states))states[i]=initial;return[states[i],v=>states[i]=v];},useRef(initial){const i=ri++;return refs[i]||(refs[i]={current:initial});},useEffect:fn=>effects.push(fn),window:{addEventListener:(type,fn)=>listeners[type]=fn,removeEventListener(){}},document:{hidden:false,addEventListener:(type,fn)=>listeners[type]=fn,removeEventListener(){},elementFromPoint:()=>point},setTimeout,clearTimeout};
 vm.runInNewContext(Babel.transform(source.slice(source.indexOf('function Piano('),source.indexOf('function drumOnlyProject(')),{presets:['react']}).code,context);
 const props={onNote:n=>played.push(n),onRelease:n=>released.push(n)};
 const render=()=>{ri=si=0;return context.Piano(props);};
 let tree=render();const host={setPointerCapture(){},contains:key=>key.inside!==false};tree.props.ref.current=host;
 const key=(n,disabled=false)=>({dataset:{midi:String(n)},disabled,closest(){return this;}});
 const event=(id,n)=>({pointerId:id,button:0,target:key(n),preventDefault(){},clientX:0,clientY:0});
 return{render,tree,played,released,listeners,effects,down:(id,n)=>tree.props.onPointerDown(event(id,n)),move(id,n,disabled=false){point=n===null?null:key(n,disabled);tree.props.onPointerMove(event(id,n));},up:id=>tree.props.onPointerUp({pointerId:id})};
}
test('Studio piano supports simultaneous touches and sliding without stuck or prematurely released notes',()=>{
 const h=pianoHarness();h.down(1,60);h.down(2,64);h.down(3,60);
 assert.deepEqual(h.played,[60,64]);h.up(1);assert.deepEqual(h.released,[]);
 h.move(2,65);assert.deepEqual(h.released,[64]);assert.deepEqual(h.played,[60,64,65]);
 h.move(2,null);assert.deepEqual(h.released,[64,65]);h.up(2);h.up(3);h.up(3);
 assert.deepEqual(h.released,[64,65,60]);
});
test('Studio piano releases on cancellation and ignores disabled slide targets',()=>{
 const h=pianoHarness();h.down(1,60);h.move(1,61,true);assert.deepEqual(h.released,[60]);
 h.move(1,62);h.tree.props.onPointerCancel({pointerId:1});h.tree.props.onLostPointerCapture({pointerId:1});
 assert.deepEqual(h.played,[60,62]);assert.deepEqual(h.released,[60,62]);
});
test('Studio piano shows immediate held-key feedback and clears it on losing focus',()=>{
 const h=pianoHarness();h.effects[1]();h.down(1,60);
 let key=h.render().children[0].find(k=>k.props['data-midi']===60);assert.equal(key.props['aria-pressed'],true);
 h.listeners.blur();assert.deepEqual(h.released,[60]);
 key=h.render().children[0].find(k=>k.props['data-midi']===60);assert.equal(key.props['aria-pressed'],false);
});
test('Studio piano opts into the shared touch protection and plays repeated and held notes', () => {
 const piano = pianoHarness();
 assert.equal(piano.tree.props['data-mlh-pointer-surface'], '');
 piano.down(1, 60);
 piano.up(1);
 piano.down(2, 60);
 assert.deepEqual(piano.played, [60, 60]);
 assert.deepEqual(piano.released, [60]);
 piano.up(2);
 assert.deepEqual(piano.released, [60, 60]);
});
