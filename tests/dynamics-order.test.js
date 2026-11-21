const test=require('node:test'),assert=require('node:assert/strict'),React=require('react'),server=require('react-dom/server'),fs=require('fs'),Babel=require('@babel/standalone'),vm=require('vm');
const load=require('./helpers/dynamics-harness.cjs');
test('Order Mode uses all four N4 and all six N5 fixed dynamics, with correct loudness ranking',()=>{
 const a=load();assert.deepEqual(Object.keys(a.ORDER_LEVELS),['N4','N5']);
 for(const [level,answer] of [['N4',['f','mf','mp','p']],['N5',['ff','f','mf','mp','p','pp']]]){
  const permutations=new Set();for(let n=0;n<1000;n++){const q=a.makeDynamicsOrderQuestion(level);assert.deepEqual(Array.from(q.answer),answer);assert.deepEqual(Array.from(q.rows,r=>r.id).sort(),answer.slice().sort());assert(!q.rows.every((r,i)=>r.id===answer[i]));assert(q.rows.every(r=>!['crescendo','diminuendo','sfz'].includes(r.id)));permutations.add(q.rows.map(r=>r.id).join(','));}
  assert(permutations.size>=(level==='N4'?23:400));
  for(const id of answer){const glyph=server.renderToStaticMarkup(React.createElement('svg',null,React.createElement(a.DynamicGlyph,{id})));assert(glyph.includes('music-symbol'));assert(!glyph.includes('NaN'));}
 }
 assert.throws(()=>a.makeDynamicsOrderQuestion('N3'),/National 4 and National 5/);
});
test('marking accepts only the correct full sequence for both levels and blocks repeat submission',()=>{
 const html=fs.readFileSync('dynamics.html','utf8'),source=html.match(/<script type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/)[1];let fn;
 function walk(n){if(!n||typeof n!=='object')return;if(n.type==='FunctionDeclaration'&&n.id.name==='confirmOrder')fn=Babel.packages.generator.default(n).code;for(const v of Object.values(n))if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}walk(Babel.packages.parser.parse(source,{plugins:['jsx']}));
 const permutations=xs=>xs.length?xs.flatMap((x,i)=>permutations(xs.filter((_,j)=>i!==j)).map(rest=>[x,...rest])):[[]];const a=load();
 for(const level of ['N4','N5']){const q=a.makeDynamicsOrderQuestion(level);for(const ids of permutations(Array.from(q.answer))){let marked;vm.runInNewContext(fn+';confirmOrder()',{feedback:null,questionVisible:true,question:q,orderRows:ids.map(id=>({id})),score:ok=>marked=ok});assert.equal(marked,ids.every((id,i)=>id===q.answer[i]));}}
 for(const blocked of [{feedback:{correct:false},questionVisible:true},{feedback:null,questionVisible:false}])vm.runInNewContext(fn+';confirmOrder()',{...blocked,score:()=>assert.fail('Repeated or hidden answer')});
 const generated=Babel.transform(source,{presets:['react'],sourceMaps:false,comments:false,compact:true}).code+'\n';assert.equal(fs.readFileSync('generated-runtimes/dynamics-1.js','utf8'),generated);
});
test('four- and six-tile arrow controls animate adjacent swaps and respect disabled boundaries',()=>{
 const runtime=fs.readFileSync('generated-runtimes/dynamics-1.js','utf8'),entry=runtime.indexOf('const root=document.getElementById("root");');
 for(const count of [4,6])for(const direction of [-1,1])for(let index=0;index<count;index++){
  let rows=Array.from({length:count},(_,id)=>({id:String(id)})),cursor=0,locked=false;const refs=[],effects=[],animations=[];
  const mock={createElement:(type,props,...children)=>({type,props:{...props,children:children.flat(Infinity)}}),useRef:initial=>refs[cursor++]||(refs[cursor-1]={current:initial}),useLayoutEffect:fn=>effects.push(fn)};
  const ctx={React:mock,window:{MLH:{useClickOutside(){}},matchMedia:()=>({matches:false})},console};vm.runInNewContext(runtime.slice(0,entry)+'globalThis.Board=DynamicsOrderBoard;',ctx);
  const nodes=n=>n&&typeof n==='object'?[n,...(n.props?.children||[]).flatMap(nodes)]:[];
  function render(){cursor=0;const tree=ctx.Board({question:{answer:[]},rows,setRows:fn=>rows=fn(rows),feedback:null,disabled:locked});for(const n of nodes(tree).filter(n=>n.type==='li')){const id=n.props['data-dynamic-order-row'];n.props.ref({style:{},getBoundingClientRect:()=>({top:rows.findIndex(r=>r.id===id)*120}),getAnimations:()=>[],animate:frames=>{animations.push(frames);return {};}});}for(const fn of effects.splice(0))fn();return tree;}
  const tree=render(),button=nodes(tree).find(n=>n.props?.['aria-label']===`Move dynamic ${index+1} ${direction<0?'up':'down'}`),valid=index+direction>=0&&index+direction<count;assert.equal(Boolean(button.props.disabled),!valid);button.props.onClick();render();const expected=Array.from({length:count},(_,i)=>String(i));if(valid)[expected[index],expected[index+direction]]=[expected[index+direction],expected[index]];assert.deepEqual(rows.map(r=>r.id),expected);assert.equal(animations.length,valid?2:0);if(valid)assert.deepEqual(animations.map(a=>a[0].transform).sort(),['translateY(-120px)','translateY(120px)']);
  locked=true;const before=rows.slice();for(const b of nodes(render()).filter(n=>n.type==='button')){assert(b.props.disabled);b.props.onClick();}assert.deepEqual(rows,before);
 }
});
