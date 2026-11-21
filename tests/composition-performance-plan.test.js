const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),Babel=require('@babel/standalone');
const C=require('../chord-generator-core'),T=require('../composition-templates');
function setup(R=React){const window={MLH:{ChordGenerator:C}},context={window,React:R,ReactDOM:{createPortal:node=>node},document:{body:{}}};vm.createContext(context);vm.runInContext(Babel.transform(fs.readFileSync(require.resolve('../composition-performance-plan.jsx'),'utf8'),{presets:['react']}).code,context);return window.MLH.PerformancePlan;}
function project(){const p=C.asStudio({...T.create('ode-to-joy',()=>0),progressionBars:4,title:'My Song'});p.sections[0].chords[0]={symbol:'Cmaj7/G',beats:4,secondChord:{symbol:'Am'}};return p;}
test('lyric sheet places each chord above its assigned word, preserving section order and musical data',()=>{
 const a=project();a.lyricSheet=[{text:'Sing a little song',anchors:{0:0,1:3}}];const b=C.asStudio({...project(),key:7,timeSignature:'3/4',drums:null,lyricSheet:[{text:'<hello>',anchors:{0:0}}]});
 const before=JSON.stringify(a),html=renderToStaticMarkup(React.createElement(setup(),{items:[{id:'a',name:'A',project:a},{id:'b',name:'Verse',project:b}]}));
 for(const text of ['Lyrics &amp; Chords','Section Verse','Bar 8','Cmaj7/G','Sing','Am','song','&lt;hello&gt;','View Sheet','Instrumental'])assert.ok(html.includes(text),text);
 assert.ok(html.indexOf('Cmaj7/G')<html.indexOf('Sing'));assert.ok(!html.includes('Bravura'));assert.equal(JSON.stringify(a),before);
 const restored=C.importSongMidi(C.songMidi(a));assert.deepEqual(restored.lyricSheet,a.lyricSheet);
});
test('lyrics and chord placement edit only the selected bar and can be unplaced',()=>{
 const hooks=[];let cursor=0,items=[{id:'a',name:'A',project:project()}];const R={...React,useState(initial){const i=cursor++;if(!(i in hooks))hooks[i]=typeof initial==='function'?initial():initial;return [hooks[i],v=>hooks[i]=v];},useEffect(){}};
 const Plan=setup(R),changes=[];function draw(){cursor=0;return Plan({items,onChange:(id,change)=>{changes.push({id,change});items=items.map(item=>({...item,project:{...item.project,...change}}));}});}
 function nodes(node){if(!node||typeof node!=='object')return [];if(Array.isArray(node))return node.flatMap(nodes);return [node,...Object.values(node.props||{}).flatMap(v=>typeof v==='object'?nodes(v):[])];}
 function button(tree,text){return nodes(tree).find(n=>n.type==='button'&&n.props.children===text);}
 const music=JSON.stringify(items[0].project.sections);let tree=draw();const input=nodes(tree).find(n=>n.type==='textarea');input.props.onChange({target:{value:'Hello bright world'}});assert.equal(changes[0].id,'a');assert.equal(items[0].project.lyricSheet[0].text,'Hello bright world');
 button(draw(),'Place Chords').props.onClick();tree=draw();nodes(tree).find(n=>n.props.className==='lyric-chord-chip').props.onClick();tree=draw();nodes(tree).find(n=>n.type==='button'&&n.props['aria-label']?.includes('above bright,')).props.onClick();assert.equal(items[0].project.lyricSheet[0].anchors[0],1);
 tree=draw();nodes(tree).find(n=>n.props.className==='lyric-chord-chip').props.onClick();button(draw(),'Unplace').props.onClick();assert.equal(items[0].project.lyricSheet[0].anchors[0],undefined);assert.equal(JSON.stringify(items[0].project.sections),music);
});
