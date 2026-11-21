'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),Babel=require('@babel/standalone'),React=require('react');
const page=fs.readFileSync('practicequestions.html','utf8');
const source=page.slice(page.indexOf('    function PitchEntryTarget('),page.indexOf('    function ScoreBarNumber('));
// Exercise the production component's event callbacks. This is a component
// test, not a substitute for browser focus and screen-reader verification.
function harness(enabled=true){
 let state;const placed=[],removed=[],previews=[],selected=[];
 const c={React,MIN_DISPLAY_STEP:-4,MAX_DISPLAY_STEP:12,clamp:(n,lo,hi)=>Math.max(lo,Math.min(hi,n)),noteBaseForDisplayStep:()=>({letter:'B',octave:4}),useState:initial=>{if(!state)state=initial;return[state,next=>state=next];}};
 vm.createContext(c);vm.runInContext(Babel.transform(source,{presets:['react']}).code,c);
 const rect={x:20,y:30,width:48,height:150,style:{touchAction:'none'},onPointerDown:()=>{}};
 const ref={current:null};
 const props={...rect,label:'Missing notes in bar 5',indices:[1,3],minStep:2,maxStep:6,enabled,noteAtStep:(step,index)=>({step,noteIndex:index}),onPlace:n=>placed.push(n),onRemove:i=>removed.push(i),onPreview:n=>previews.push(n),onSelect:()=>selected.push(true),targetRef:ref};
 const render=()=>c.PitchEntryTarget(props);
 const key=key=>{let prevented=false,stopped=false;render().props.onKeyDown({key,preventDefault(){prevented=true;},stopPropagation(){stopped=true;}});return{prevented,stopped};};
 return{render,key,placed,removed,previews,selected,rect,ref,props};
}
test('keyboard pitch and note navigation places and deletes the selected editable index',()=>{
 const h=harness();h.render().props.onFocus();assert.equal(h.selected.length,1);
 assert.deepEqual(h.key('ArrowUp'),{prevented:true,stopped:true});h.key('Enter');
 assert.equal(h.placed[0].step,5);assert.equal(h.placed[0].noteIndex,1);
 h.key('ArrowRight');h.key('ArrowUp');h.key(' ');
 assert.equal(h.placed[1].step,6);assert.equal(h.placed[1].noteIndex,3);
 h.key('Delete');h.key('ArrowLeft');h.key('Backspace');assert.deepEqual(h.removed,[3,1]);
});
test('keyboard cursor stays inside the permitted pitch range and editable indices',()=>{
 const h=harness();for(let i=0;i<20;i++){h.key('ArrowUp');h.key('ArrowRight');}h.key('Enter');assert.equal(h.placed[0].step,6);assert.equal(h.placed[0].noteIndex,3);
 for(let i=0;i<20;i++){h.key('ArrowDown');h.key('ArrowLeft');}h.key('Enter');assert.equal(h.placed[1].step,2);assert.equal(h.placed[1].noteIndex,1);
});
test('focus, Escape and blur preserve geometry and do not commit previews',()=>{
 const h=harness();h.key('ArrowUp');h.key('Escape');assert.equal(h.previews.at(-1),null);assert.equal(h.placed.length,0);
 h.render().props.onBlur();assert.equal(h.previews.at(-1),null);
 const p=h.render().props;for(const k of Object.keys(h.rect))assert.equal(p[k],h.rect[k]);assert.equal(h.render().ref,h.ref);assert.equal(p.tabIndex,0);assert.match(p['aria-label'],/Arrow keys.*Enter.*Delete/);
 assert.equal(h.key('Tab').prevented,false);
});
test('marked or unarmed pitch targets cannot take keyboard focus or change answers',()=>{
 const h=harness(false);assert.equal(h.render().props.tabIndex,-1);h.render().props.onFocus();for(const k of ['ArrowUp','Enter','Delete'])assert.equal(h.key(k).prevented,false);
 assert.equal(h.placed.length,0);assert.equal(h.removed.length,0);assert.equal(h.selected.length,0);
 const armed=harness();armed.props.noteAtStep=()=>null;armed.key('Enter');assert.equal(armed.placed.length,0);
});


test('symbol-placement keyboard targets only activate armed tools and preserve normal Tab navigation',()=>{
 const source=page.slice(page.indexOf('    function scoreSelectionKeyboardProps('),page.indexOf('    function Score(props)'));
 const c={};vm.createContext(c);vm.runInContext(source,c);let focus=0,placed=0;
 for(const enabled of [false,true]){
  const p=c.scoreSelectionKeyboardProps({label:'Apply rhythm at note 2 in bar 5',enabled,onSelect:()=>focus++,onActivate:()=>placed++});
  assert.equal(p.tabIndex,enabled?0:-1);p.onFocus();
  for(const key of ['Enter',' ','Tab']){let prevented=false;p.onKeyDown({key,preventDefault:()=>prevented=true,stopPropagation:()=>{}});assert.equal(prevented,enabled&&key!=='Tab');}
 }
 assert.equal(focus,1);assert.equal(placed,2);
});
