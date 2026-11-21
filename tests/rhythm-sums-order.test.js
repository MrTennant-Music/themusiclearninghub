const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),React=require('react'),server=require('react-dom/server');
const harness=require('./helpers/rhythm-sums-harness.cjs');
test('Order Mode generates four different totals using only rhythms allowed at each qualification',()=>{
 const a=harness();assert.deepEqual(Object.keys(a.ORDER_LEVELS),['N3','N4','N5','H']);
 for(const level of Object.keys(a.ORDER_LEVELS)){
  const settings=a.settingsForLevel(level),allowed=new Set(a.itemPoolFromSettings(settings).map(item=>item.id));
  const fingerprints=new Set();
  for(let n=0;n<100;n++){
   const q=a.makeOrderQuestion(level);assert.equal(q.rows.length,4);assert.equal(new Set(q.rows.map(row=>row.beats)).size,4);
   assert(!q.rows.every((row,i)=>row.id===q.answer[i]));
   const sorted=q.rows.slice().sort((x,y)=>y.beats-x.beats);assert.deepEqual(Array.from(q.answer),Array.from(sorted,row=>row.id));
   for(const row of q.rows){assert.equal(row.items.length,level==='N3'?3:4);assert.equal(row.beats,row.items.reduce((sum,item)=>sum+item.beats,0));
    for(const item of row.items){assert(allowed.has(item.id));if(item.displayType==='rest')assert(settings.includeRests);const svg=server.renderToStaticMarkup(React.createElement(a.RhythmGlyph,{item}));assert(svg.includes('<svg'));assert(!svg.includes('NaN'));}
   }
   fingerprints.add(q.rows.map(row=>row.items.map(item=>item.id).join(',')).join('|'));
  }
  assert(fingerprints.size>90,level);
 }
});
test('Order Mode uses the same Games button and Playnote glyph as Note Identification',()=>{
 const html=fs.readFileSync('rhythmsums.html','utf8');assert.match(html,/>Games<\/window.MLH.MenuSubheading>/);assert.match(html,/ui-icons\/game-type.svg/);assert.match(html,/object-contain invert/);assert.match(html,/Order Mode/);assert.match(html,/Move rhythm.*up/);
 const index=require('../music-games/activities/index.json');assert(!index.some(a=>a.template==='rank-order'&&a.tags?.includes('Music Literacy')));
});
test('arrow moves animate both whole cards in opposite directions, with no drag controls',()=>{
 const vm=require('node:vm'),runtime=fs.readFileSync('generated-runtimes/rhythmsums-1.js','utf8'),entry=runtime.indexOf('ReactDOM.createRoot');
 const refs=[],effects=[],animations=[];let cursor=0,rows=['a','b','c','d'].map(id=>({id,items:[],beats:1}));
 const mock={createElement:(type,props,...children)=>({type,props:{...props,children:children.flat(Infinity)}}),useRef:initial=>refs[cursor++]||(refs[cursor-1]={current:initial}),useLayoutEffect:fn=>effects.push(fn)};
 const context={React:mock,window:{MLH:{useClickOutside(){},RhythmSumsGenerator:require('../shared/rhythm-sums-generator')},matchMedia:()=>({matches:false})},console};
 vm.runInNewContext(runtime.slice(0,entry)+'globalThis.Board=RhythmOrderBoard;',context);
 const nodes=node=>node&&typeof node==='object'?[node,...(node.props?.children||[]).flatMap(nodes)]:[];
 function render(){cursor=0;const tree=context.Board({question:{answer:[]},rows,setRows:fn=>{rows=fn(rows);},feedback:null,disabled:false});for(const node of nodes(tree).filter(n=>n.type==='li')){const id=node.props['data-rhythm-order-row'];node.props.ref({style:{},getBoundingClientRect:()=>({top:rows.findIndex(r=>r.id===id)*120}),getAnimations:()=>[],animate:(frames,options)=>{animations.push({id,frames,options});return {};}});}for(const effect of effects.splice(0))effect();return tree;}
 const tree=render();assert(!nodes(tree).some(n=>n.props?.onPointerDown));
 nodes(tree).find(n=>n.props?.['aria-label']==='Move rhythm 1 down').props.onClick();render();
 assert.deepEqual(rows.map(r=>r.id),['b','a','c','d']);assert.equal(animations.length,2);
 assert.deepEqual(animations.map(a=>a.frames[0].transform).sort(),['translateY(-120px)','translateY(120px)']);
 assert(animations.every(a=>a.options.duration===320));
});
test('independent musical durations and all 24 possible answers are correct at every level',()=>{
 const vm=require('node:vm'),Babel=require('@babel/standalone'),a=harness();
 const beats={semibreve:4,'dotted-minim':3,minim:2,'dotted-crotchet':1.5,crotchet:1,'dotted-quaver':.75,quaver:.5,semiquaver:.25,'two-quavers':1,'four-semiquavers':1,'quaver-two-semiquavers':1,'two-semiquavers-quaver':1,'dotted-quaver-semiquaver':1,'scotch-snap':1,'triplet-quavers':1,'triplet-crotchets':2};
 for(const item of [...a.BASE_RHYTHMS,...a.BEAMED_RHYTHMS]){assert.equal(item.beats,beats[item.id],item.id);if(item.rhythms){const raw=item.rhythms.reduce((s,id)=>s+beats[id],0);assert.equal(raw*(item.kind==='triplet'?2/3:1),beats[item.id]);}}
 const source=fs.readFileSync('rhythmsums.html','utf8').match(/<script type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/)[1];let confirm;
 function walk(n){if(!n||typeof n!=='object')return;if(n.type==='FunctionDeclaration'&&n.id.name==='confirmOrder')confirm=Babel.packages.generator.default(n).code;for(const v of Object.values(n))if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}
 walk(Babel.packages.parser.parse(source,{plugins:['jsx']}));assert(confirm);
 const permutations=xs=>xs.length?xs.flatMap((x,i)=>permutations(xs.filter((_,j)=>i!==j)).map(rest=>[x,...rest])):[[]];
 for(const level of Object.keys(a.ORDER_LEVELS)){
  const seen=new Set();for(let n=0;n<250;n++){
   const q=a.makeOrderQuestion(level);for(const row of q.rows){assert.equal(row.beats,row.items.reduce((s,item)=>s+beats[item.id],0));for(const item of row.items)seen.add(item.id);}
   const answer=Array.from(q.rows).sort((x,y)=>y.items.reduce((s,i)=>s+beats[i.id],0)-x.items.reduce((s,i)=>s+beats[i.id],0)).map(r=>r.id);
   for(const rows of permutations(Array.from(q.rows))){let result;const ctx={feedback:null,questionVisible:true,orderRows:rows,orderQuestion:q,scoreAnswer:ok=>result=ok};vm.runInNewContext(confirm+';confirmOrder()',ctx);assert.equal(result,rows.every((row,i)=>row.id===answer[i]));}
  }
  for(const item of a.itemPoolFromSettings(a.settingsForLevel(level)))assert(seen.has(item.id),level+'/'+item.id);
 }
 for(const blocked of [{feedback:{correct:false},questionVisible:true},{feedback:null,questionVisible:false}])vm.runInNewContext(confirm+';confirmOrder()',{...blocked,scoreAnswer:()=>assert.fail('Repeated/hidden submission'),orderRows:[],orderQuestion:{answer:[]}});
});
test('every adjacent arrow swaps only its two cards; feedback locks moves and reduced motion is respected',()=>{
 const vm=require('node:vm'),runtime=fs.readFileSync('generated-runtimes/rhythmsums-1.js','utf8'),entry=runtime.indexOf('ReactDOM.createRoot');
 for(const reduced of [false,true])for(const direction of [-1,1])for(let position=0;position<4;position++){
  const refs=[],effects=[],animations=[];let cursor=0,rows=['a','b','c','d'].map(id=>({id,items:[],beats:1})),locked=false;
  const mock={createElement:(type,props,...children)=>({type,props:{...props,children:children.flat(Infinity)}}),useRef:initial=>refs[cursor++]||(refs[cursor-1]={current:initial}),useLayoutEffect:fn=>effects.push(fn)};
  const context={React:mock,window:{MLH:{useClickOutside(){},RhythmSumsGenerator:require('../shared/rhythm-sums-generator')},matchMedia:()=>({matches:reduced})},console};vm.runInNewContext(runtime.slice(0,entry)+'globalThis.Board=RhythmOrderBoard;',context);
  const nodes=n=>n&&typeof n==='object'?[n,...(n.props?.children||[]).flatMap(nodes)]:[];
  function render(){cursor=0;const tree=context.Board({question:{answer:[]},rows,setRows:fn=>rows=fn(rows),feedback:null,disabled:locked});for(const n of nodes(tree).filter(n=>n.type==='li')){const id=n.props['data-rhythm-order-row'];n.props.ref({style:{},getBoundingClientRect:()=>({top:rows.findIndex(r=>r.id===id)*120}),getAnimations:()=>[],animate:(frames,options)=>{animations.push({id,frames,options});return {};}});}for(const fn of effects.splice(0))fn();return tree;}
  const label=`Move rhythm ${position+1} ${direction===1?'down':'up'}`,tree=render(),button=nodes(tree).find(n=>n.props?.['aria-label']===label),valid=position+direction>=0&&position+direction<4;assert.equal(Boolean(button.props.disabled),!valid);button.props.onClick();render();
  const expected=['a','b','c','d'];if(valid)[expected[position],expected[position+direction]]=[expected[position+direction],expected[position]];assert.deepEqual(rows.map(r=>r.id),expected);assert.equal(animations.length,valid&&!reduced?2:0);
  if(animations.length){assert.deepEqual(animations.map(a=>a.frames[0].transform).sort(),['translateY(-120px)','translateY(120px)']);assert(animations.every(a=>a.frames[1].transform==='translateY(0)'&&a.options.duration===320));}
  locked=true;const before=rows.slice(),lockedTree=render();for(const n of nodes(lockedTree).filter(n=>n.type==='button')){assert(n.props.disabled);n.props.onClick();}assert.deepEqual(rows,before);
 }
});
test('a second arrow click cancels the old animation and continues from the visible card positions',()=>{
 const vm=require('node:vm'),runtime=fs.readFileSync('generated-runtimes/rhythmsums-1.js','utf8'),entry=runtime.indexOf('ReactDOM.createRoot');let cursor=0,rows=['a','b','c','d'].map(id=>({id,items:[],beats:1})),cancelled=0;const refs=[],effects=[],elements=new Map(),created=[];
 const mock={createElement:(type,props,...children)=>({type,props:{...props,children:children.flat(Infinity)}}),useRef:initial=>refs[cursor++]||(refs[cursor-1]={current:initial}),useLayoutEffect:fn=>effects.push(fn)};
 const context={React:mock,window:{MLH:{useClickOutside(){},RhythmSumsGenerator:require('../shared/rhythm-sums-generator')},matchMedia:()=>({matches:false})},console};vm.runInNewContext(runtime.slice(0,entry)+'globalThis.Board=RhythmOrderBoard;',context);
 const nodes=n=>n&&typeof n==='object'?[n,...(n.props?.children||[]).flatMap(nodes)]:[];
 function render(){cursor=0;const tree=context.Board({question:{answer:[]},rows,setRows:fn=>rows=fn(rows),feedback:null,disabled:false});for(const n of nodes(tree).filter(n=>n.type==='li')){const id=n.props['data-rhythm-order-row'];if(!elements.has(id)){const element={style:{},offset:0,active:[],getBoundingClientRect(){return {top:rows.findIndex(r=>r.id===id)*120+this.offset};},getAnimations(){return this.active;},animate(frames,options){const animation={id,frames,options,cancel(){cancelled++;element.offset=0;element.active=[];this.oncancel?.();}};this.active=[animation];created.push(animation);return animation;}};elements.set(id,element);}n.props.ref(elements.get(id));}for(const fn of effects.splice(0))fn();return tree;}
 let tree=render();nodes(tree).find(n=>n.props?.['aria-label']==='Move rhythm 1 down').props.onClick();tree=render();elements.get('a').offset=-45;elements.get('b').offset=45;
 nodes(tree).find(n=>n.props?.['aria-label']==='Move rhythm 2 down').props.onClick();render();assert.equal(cancelled,2);assert.deepEqual(rows.map(r=>r.id),['b','c','a','d']);
 assert.deepEqual(created.slice(2).map(a=>[a.id,a.frames[0].transform]).sort(),[['a','translateY(-165px)'],['b','translateY(45px)'],['c','translateY(120px)']]);assert.equal(new Set(rows.map(r=>r.id)).size,4);
 for(const animation of created.slice(2))animation.onfinish();for(const el of elements.values())assert.equal(el.style.zIndex||'','');
});
