"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const Babel = require("@babel/standalone");
const React = require("react");

// Execute the real page handlers, without a browser's synthetic mouse hover.
function functionsFromPage(file, names, context) {
  const source = fs.readFileSync(file, "utf8");
  const script = [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
    .map(match => match[1]).find(text => text.includes("function App("));
  const ast = Babel.packages.parser.parse(script, { sourceType: "script", plugins: ["jsx"] });
  const declarations = new Map();
  Babel.packages.traverse.default(ast, {
    FunctionDeclaration(path) {
      if (names.includes(path.node.id?.name)) declarations.set(path.node.id.name, script.slice(path.node.start, path.node.end));
    },
  });
  assert.equal(declarations.size, names.length, `Find handlers in ${file}`);
  const code = names.map(name => declarations.get(name)).join("\n");
  vm.createContext(context);
  vm.runInContext(Babel.transform(code, { presets: ["react"] }).code, context);
  return context;
}

function pointer(pointerType, scale = 1) {
  return {
    pointerType, clientX: 20 + 300 * scale, clientY: 30 + 100 * scale,
    currentTarget: { getBoundingClientRect: () => ({ left: 20, top: 30, width: 900 * scale, height: 300 * scale }) },
    preventDefault() { this.prevented = true; },
  };
}

for (const pointerType of ["touch", "pen", "mouse"]) {
  for (const scale of [1, 0.3]) {
    for (const file of ["accidentals.html", "rhythmicdictation.html", "dynamics.html"]) {
      test(`${file}: ${pointerType} places at the current position without hover at scale ${scale}`, () => {
        let placed;
        const target = { barIndex: 2, noteIndex: 1, symbolId: "p" };
        const event = pointer(pointerType, scale);
        const snap = point => {
          assert.ok(Math.abs(point.x - 300) < 1e-8);
          assert.ok(Math.abs(point.y - 100) < 1e-8);
          return target;
        };
        const context = {
          selectedSymbol: "sharp", selectedSymbolId: "p", selectedToolId: "quaver",
          feedback: null, isPlacement: true, isMobileScore: false, pendingSpanStart: null,
          // A stale preview must never move the answer away from the tap.
          hoverPlacement: { barIndex: 7 }, hoverTarget: { barIndex: 7 },
          question: {}, W: 900, H: 300, VIEWBOX_WIDTH: 900, VIEWBOX_HEIGHT: 300,
          snap, snapPlacement: snap, findHoverTarget: snap,
          setPlacements: value => { placed = value[0]; },
          setQuestion: update => { placed = update({}); },
          applyPlacement: (question, actualTarget) => actualTarget,
          setHoverPlacement() {}, setHoverTarget() {}, setWarning() {}, setPrompt() {},
          setPendingSpanStart() {}, setSelectedSymbolId() {}, setPromptMessage() {},
        };
        const names = file === "accidentals.html" ? ["pointerInSvg", "handleLock"]
          : file === "rhythmicdictation.html" ? ["pointerToSvg", "handleLockPlacement"]
            : ["pointerToSvg", "placementFromPointer", "handleLockPlacement"];
        functionsFromPage(file, names, context);
        context[names.at(-1)](event);
        assert.equal(placed.barIndex, 2);
        assert.equal(event.prevented, true);
        placed = null;
        context.hoverPlacement = null;
        context.hoverTarget = null;
        context[names.at(-1)](event);
        assert.equal(placed.barIndex, 2, "First tap works without any preview");
        placed = null;
        context.feedback = { correct: false };
        context[names.at(-1)](event);
        assert.equal(placed, null, "Submitted answers remain locked");
        context.feedback = null;
        context.snap = context.snapPlacement = context.findHoverTarget = () => null;
        context[names.at(-1)](event);
        assert.equal(placed, null, "A tap outside a valid target does not reuse a preview");
      });
    }
  }
}

test("Dynamics: two separate taps start and finish a wedge without hover", () => {
  let placed;
  let snappedBar = 1;
  const context = {
    selectedSymbolId: "crescendo", feedback: null, isPlacement: true, isMobileScore: false,
    pendingSpanStart: null, question: { type: "apply-score" }, W: 900, H: 300,
    snap: () => ({ barIndex: snappedBar, symbolId: "crescendo" }),
    clamp: (value, min, max) => Math.min(max, Math.max(min, value)),
    barGeoForViewport: barIndex => ({ systemIndex: Math.floor(barIndex / 4) }),
    setPendingSpanStart: value => { context.pendingSpanStart = value; },
    setPlacements: value => { placed = value[0]; },
    setSelectedSymbolId() {}, setHoverPlacement() {}, setPromptMessage() {},
  };
  functionsFromPage("dynamics.html", ["pointerToSvg", "placementFromPointer", "handleLockPlacement"], context);
  context.handleLockPlacement(pointer("touch"));
  assert.equal(placed, undefined);
  assert.equal(context.pendingSpanStart.barIndex, 1);
  snappedBar = 2;
  context.handleLockPlacement(pointer("touch"));
  assert.equal(placed.barIndex, 1);
  assert.equal(placed.endBarIndex, 2);
  assert.equal(context.pendingSpanStart, null);
  for (const startBar of [1, 3, 5, 7]) {
    context.pendingSpanStart = { barIndex: startBar, systemIndex: Math.floor(startBar / 4) };
    snappedBar = 7;
    context.handleLockPlacement(pointer("touch"));
    assert.equal(placed.endBarIndex, Math.min(startBar + 1, startBar < 4 ? 3 : 7));
  }
});

test("Barlines: showing a preview preserves the hit element and the marker cannot intercept taps", () => {
  let hovered = null;
  let selected;
  const context = {
    React, LINE_GAP: 10, VIEWBOX_WIDTH: 900, STAFF_LEFT: 30, STAFF_RIGHT: 850,
    COLOUR: { black: "black", green: "green", red: "red" },
    useMemo: fn => fn(),
    calculateLayout: () => ({ itemPositions: {}, boundaryPositions: [{ id: "boundary-1", x: 300, systemIndex: 0 }] }),
    getBeamGroups: () => [],
  };
  for (const name of ["StaffLines", "TrebleClef", "KeySignature", "TimeSignatureGlyph", "FinalBarline", "BoundaryMarker"]) context[name] = () => null;
  functionsFromPage("barlines.html", ["barlineBoundaryFromPointer", "Score"], context);
  const props = {
    question: { systemTops: [70], items: [], correctBoundaries: [1], changeBarIndex: null },
    placedBoundaries: {}, selectedBarlineType: "single", feedback: null,
    setHoverBoundaryId: value => { hovered = value; }, toggleBoundary: id => { selected = id; },
  };
  const score = () => context.Score({ ...props, hoverBoundaryId: hovered });
  const boundary = () => score().props.children.at(-1)[0];
  const before = boundary();
  const hitBefore = before.type === "rect" ? before : before.props.children[0];
  const event={pointerType:'mouse',clientX:300,clientY:90,currentTarget:{getBoundingClientRect:()=>({left:0,top:0,width:900,height:148})}};
  score().props.onPointerMove(event);
  const after = boundary();
  assert.equal(before.type, after.type, "Hover must not replace the hit target's parent");
  assert.equal(before.key, after.key);
  assert.equal(after.props.children[0].type, hitBefore.type);
  assert.equal(after.props.children[1].props.pointerEvents, "none");
  score().props.onClick(event);
  assert.equal(selected, "boundary-1");
  selected=null;
  after.props.children[0].props.onKeyDown({key:'Enter',preventDefault(){},stopPropagation(){}});
  assert.equal(selected,'boundary-1','Keyboard placement remains available');
  selected=null;
  context.Score({...props,feedback:{correct:true}}).props.onClick(event);
  assert.equal(selected,null,'Submitted scores cannot be changed');
});

for(const pointerType of ['touch','pen','mouse']) for(const scale of [1,.3,.72]) {
  test(`Barlines: ${pointerType} snaps to the nearest position on the tapped stave at scale ${scale}`,()=>{
    const context={VIEWBOX_WIDTH:900,STAFF_LEFT:30,STAFF_RIGHT:850,LINE_GAP:10};
    functionsFromPage('barlines.html',['barlineBoundaryFromPointer'],context);
    const question={systemTops:[70,210]};
    const boundaries=[
      {id:'upper-left',x:300,systemIndex:0},
      {id:'upper-fixed',x:450,systemIndex:0,fixed:true},
      {id:'upper-right',x:600,systemIndex:0},
      {id:'lower-left',x:320,systemIndex:1},
      {id:'lower-right',x:620,systemIndex:1},
      {id:'boundary-final',x:850,systemIndex:1}
    ];
    const at=(x,y)=>({pointerType,clientX:20+x*scale,clientY:30+y*scale,currentTarget:{getBoundingClientRect:()=>({left:20,top:30,width:900*scale,height:288*scale})}});
    const snap=(x,y)=>context.barlineBoundaryFromPointer(at(x,y),question,boundaries,288)?.id||null;
    assert.equal(snap(420,90),'upper-left','A click outside the old narrow hit box still places a barline');
    assert.equal(snap(510,90),'upper-right','Fixed barlines cannot be selected');
    assert.equal(snap(530,230),'lower-right','Placement stays on the tapped stave');
    assert.equal(snap(845,230),'boundary-final','The final double-barline position remains selectable');
    assert.equal(snap(400,160),null,'Space between staves does not place a barline');
    assert.equal(snap(5,90),null,'Space before the stave does not place a barline');
    assert.equal(context.barlineBoundaryFromPointer(at(500,90),question,boundaries.filter(b=>b.systemIndex===1),288),null,'A fixed-only stave does not place a barline on another stave');
  });
}

test('Barlines: stale hover never overrides the current tap location',()=>{
  let selected;
  const context={React,LINE_GAP:10,VIEWBOX_WIDTH:900,STAFF_LEFT:30,STAFF_RIGHT:850,
    COLOUR:{black:'black',green:'green',red:'red'},useMemo:fn=>fn(),
    calculateLayout:()=>({itemPositions:{},boundaryPositions:[{id:'left',x:300,systemIndex:0},{id:'right',x:600,systemIndex:0}]}),getBeamGroups:()=>[]};
  for(const name of ['StaffLines','TrebleClef','KeySignature','TimeSignatureGlyph','FinalBarline','BoundaryMarker'])context[name]=()=>null;
  functionsFromPage('barlines.html',['barlineBoundaryFromPointer','Score'],context);
  const score=context.Score({question:{systemTops:[70],items:[],correctBoundaries:[],changeBarIndex:null},placedBoundaries:{},selectedBarlineType:'single',hoverBoundaryId:'left',setHoverBoundaryId(){},toggleBoundary:id=>{selected=id;},feedback:null});
  score.props.onClick({clientX:550,clientY:90,currentTarget:{getBoundingClientRect:()=>({left:0,top:0,width:900,height:148})}});
  assert.equal(selected,'right');
});

function staffGestureHarness(){
 let now=0;const window={},listeners={},attrs={};
 vm.runInNewContext(fs.readFileSync('shared/hub-input.js','utf8'),{window,WeakSet,Math,Date:{now:()=>now}});
 const node={style:{},setAttribute:(name,value)=>attrs[name]=value,addEventListener:(type,fn,options)=>{assert.equal(listeners[type],undefined,'registration stays idempotent');listeners[type]={fn,options};}};
 window.MLH.allowStaffTouchScroll(node);window.MLH.preventTouchScrollWhileDragging(node);
 const fire=(type,y=0,extra={})=>{const event={touches:[{identifier:1,clientX:0,clientY:y}],cancelable:true,preventDefault(){this.prevented=true;},...extra};listeners[type].fn(event);return event;};
 return{node,attrs,listeners,fire,time:value=>now=value};
}

test('note-entry targets own the drag immediately, without waiting for a hold',()=>{
 const h=staffGestureHarness();assert.equal(h.node.style.touchAction,'none');assert.ok('data-mlh-staff-input' in h.attrs);
 assert.equal(h.fire('touchstart').prevented,true);assert.equal(h.fire('touchmove',-30).prevented,true);
 assert.equal(h.fire('touchmove',70).prevented,true);assert.equal(h.listeners.touchstart.options.passive,false);
 h.fire('touchend');assert.equal(h.fire('touchmove',90).prevented,undefined);
});

test('note drags release on cancellation and do not trap additional fingers',()=>{
 for(const type of ['pointercancel','touchcancel']){const h=staffGestureHarness();h.fire('touchstart');h.fire(type);assert.equal(h.fire('touchmove',50).prevented,undefined);}
 const h=staffGestureHarness();h.fire('touchstart');assert.equal(h.fire('touchmove',30,{touches:[{},{}]}).prevented,undefined);
});

test('Enharmonic note dragging is restricted to the answer column so the rest of the stave can scroll',()=>{
 const score=fs.readFileSync('enharmonicequivalents.html','utf8').split('function ScoreArea(')[1].split('function AccidentalButton(')[0];
 assert.match(score,/x=\{answerX - 50\}[\s\S]*?width="120"/);
 assert.doesNotMatch(score,/width=\{STAFF.right - STAFF.left \+ 48\}/);
});

test('scrolling cancels an Intervals touch preview without committing an answer, while a tap commits',()=>{
 let preview=null,selected=null;
 const context={feedback:null,mode:'create',touchPreview:null,getPointerIndex:()=>({pointer:{x:50,y:50},step:3,index:4}),
  setHoverIndex(){},setPrompt(){},setSelectedIndex:n=>selected=n,setTouchPreview:value=>{preview=value;context.touchPreview=value;}};
 functionsFromPage('intervals.html',['handlePointerDown','handlePointerUp','handlePointerCancel'],context);
 const event={pointerType:'touch',pointerId:1,preventDefault(){},currentTarget:{setPointerCapture(){},releasePointerCapture(){}}};
 context.handlePointerDown(event);assert.ok(preview?.active);assert.equal(selected,null);
 context.handlePointerCancel();assert.equal(preview,null);assert.equal(selected,null);
 context.handlePointerDown(event);context.handlePointerUp(event);assert.equal(selected,4);
});

test('tap-only notation canvases commit on click rather than on initial touch',()=>{
 for(const [file,handler] of [['shared/accidentals-notation.jsx','onLock'],['dynamics.html','onLockPlacement'],['repeatsigns.html','onLockPlacement'],['rhythmicdictation.html','onLockPlacement'],['tempo.html','onPointerDown']]){
  const html=fs.readFileSync(file,'utf8');assert.ok(html.includes(`onClick={${handler}}`),file);
  assert.ok(!html.includes(`onPointerDown={${handler}}`),file);
 }
});

test('notation canvases allow scrolling while dedicated Playnote pins and piano keys retain drag rules',()=>{
 const css=fs.readFileSync('styles/hub-touch.css','utf8');
 assert.match(css,/svg\.touch-manipulation/);assert.match(css,/svg \[data-mlh-staff-input\]/);assert.match(css,/touch-action:manipulation!important/);
 for(const file of ['practicequestions.html','melodicdictation.html','followthescore.html']){
  const source=fs.readFileSync(file,'utf8');assert.doesNotMatch(source,/addEventListener\("touch(?:start|move)", blockScroll/);assert.match(source,/allowStaffTouchScroll/);
 }
 assert.match(fs.readFileSync('music-games/diagram.css','utf8'),/ig-pin-handle[^}]*\{touch-action:none\}/);
 assert.match(fs.readFileSync('styles/hub-tools.css','utf8'),/\.piano-keyboard\{[^}]*touch-action:none/);
 assert.doesNotMatch(fs.readFileSync('digital-question-papers/styles.css','utf8'),/\.q3-note-hit-area[^}]*touch-action: none/);
});

for(const pointerType of ['touch','mouse'])test(`Intervals: a placed note can be picked up, dragged and cancelled using ${pointerType}`,()=>{
 let nextIndex=4;
 const context={feedback:null,mode:'create',selectedIndex:4,touchPreview:null,getPointerIndex:()=>({pointer:{x:536,y:100},step:nextIndex,index:nextIndex,yOffset:0}),setHoverIndex(){},setPrompt(){},setSelectedIndex:n=>context.selectedIndex=n,setTouchPreview:value=>context.touchPreview=typeof value==='function'?value(context.touchPreview):value};
 functionsFromPage('intervals.html',['handlePointerDown','handlePointerMove','handlePointerUp','handlePointerCancel'],context);
 const event={pointerType,pointerId:1,preventDefault(){},currentTarget:{setPointerCapture(){},releasePointerCapture(){}}};
 context.handlePointerDown(event);nextIndex=8;context.handlePointerMove(event);
 assert.equal(context.touchPreview.index,8);assert.equal(context.selectedIndex,4,'dragging remains a preview until release');
 context.handlePointerCancel();assert.equal(context.selectedIndex,4);assert.equal(context.touchPreview,null);
 context.handlePointerDown(event);nextIndex=10;context.handlePointerMove(event);context.handlePointerUp(event);
 assert.equal(context.selectedIndex,10);assert.equal(context.touchPreview,null);
 context.feedback={correct:true};nextIndex=12;context.handlePointerDown(event);assert.equal(context.selectedIndex,10);assert.equal(context.touchPreview,null);
});

test('Intervals displays the current drag preview instead of freezing on the previously placed note',()=>{
 const Note=()=>null,context={React,window:{MLH:{}},SVG:{width:900,height:400},STAFF:{trebleTop:100,left:100,right:800},COLOUR:{preview:'grey'},noteByIndex:index=>({step:index}),indexFromStep:step=>step,yForStep:(top,step)=>top+40-step*5,Staff:()=>null,KeySignature:()=>null,Note,IntervalHelpNumbers:()=>null};
 functionsFromPage('intervals.html',['ScoreArea'],context);
 const tree=context.ScoreArea({question:{startIndex:1,targetIndex:8},mode:'create',selectedIndex:4,hoverIndex:8,touchPreview:{active:true,index:8,step:8,x:536},feedback:null});
 const all=[];function walk(node){React.Children.forEach(node,n=>{if(React.isValidElement(n)){all.push(n);walk(n.props.children);}});}walk(tree);
 const notes=all.filter(n=>n.type===Note&&n.props.x===536);
 assert.equal(notes.length,1,'the lifted preview replaces the fixed note while dragging');
 assert.equal(notes[0].props.note.step,8);assert.equal(notes[0].props.preview,true);assert.equal(notes[0].props.scale,1.65);
 const guide=all.find(n=>n.type==='line'&&n.props.strokeDasharray==='5 5');
 assert.ok(guide,'a dashed pitch guide is visible even without mobile zoom');
 assert.equal(guide.props.y1,100);assert.equal(guide.props.y2,100);
});

test('Intervals keeps the grab offset when lifting an existing note rather than jumping above the finger',()=>{
 const context={selectedIndex:4,touchPreview:null,STAFF:{trebleTop:100},activeLevel:'N4',noteByIndex:index=>({step:index}),yForStep:(top,step)=>top+40-step*5,pointerToSvg:event=>event.point,stepFromSvgYForLevel:(y,top)=>Math.round((top+40-y)/5),indexFromStep:step=>step};
 functionsFromPage('intervals.html',['getPointerIndex'],context);
 const start=context.getPointerIndex({pointerType:'touch',point:{x:536,y:123}},true);
 assert.equal(start.index,4);assert.equal(start.yOffset,3);
 context.touchPreview={active:true,yOffset:start.yOffset};
 const moved=context.getPointerIndex({pointerType:'touch',point:{x:536,y:143}});
 assert.equal(moved.index,0);assert.equal(moved.yOffset,3);
});
