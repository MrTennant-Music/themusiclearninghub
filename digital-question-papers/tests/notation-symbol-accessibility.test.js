'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../exam-notation'),'utf8');
test('score input areas register touch handling without affecting native click selections',()=>{
 let protectedCount=0;const context={SVG_NS:'svg',root:{MLH:{preventTouchScrollWhileDragging(){protectedCount++;}}},document:{createElementNS(){return{setAttribute(){}};}}};
 vm.runInNewContext(source.slice(source.indexOf('  function svgElement('),source.indexOf('  const removalGestureStates'))+';this.make=svgElement;',context);
 context.make('rect',{class:'q3-note-hit-area'});assert.equal(protectedCount,1);
 context.make('rect',{class:'q3-note-hit-area','data-note-selection':'true'});assert.equal(protectedCount,1,'a click-only circle must not cancel touchstart');
});
test('an intervening score tap interrupts a tool double tap even when the score was built detached',()=>{
 let now=1000,removed=0;const card={},panel={},svg={};let attached=false;
 const make=label=>({events:{},getAttribute(){return label;},closest(s){if(s==='.is-practice-checked')return null;if(s==='.question-card')return attached?card:null;if(s==='.shared-notation-panel')return panel;return null;},ownerSVGElement:svg,addEventListener(k,fn){(this.events[k]||=[]).push(fn);}});
 const context={WeakMap,Date:{now:()=>now},pointerEventCoordinates:e=>e,Math};
 vm.runInNewContext(source.slice(source.indexOf('  const removalGestureStates'),source.indexOf('  function pointerEventCoordinates'))+';this.bind=bindRemovalGesture;',context);
 const tool=make('Repeat signs'),target=make('Place repeat');context.bind(tool,()=>removed++);context.bind(target,()=>removed++);attached=true;
 const tap=n=>{for(const fn of n.events.touchend)fn({clientX:5,clientY:5,preventDefault(){}});now+=60;};
 tap(tool);tap(target);tap(tool);assert.equal(removed,0,'tool-score-tool is three separate actions');
 tap(tool);assert.equal(removed,1,'two consecutive tool taps still remove the answer');
 for(const fn of target.events.keydown)fn({shiftKey:true,key:'Backspace',preventDefault(){}});
 assert.equal(removed,2,'a different answer can be removed immediately using the Mac Delete key');
});

test('duplicate touch removal still prevents native answer activation',()=>{
 for(const [file,start,end] of [['exam-ui.js','  function bindRemovalGesture','  function capitaliseInitialText'],['exam-notation.js','  const removalGestureStates','  function pointerEventCoordinates']]){
  const code=fs.readFileSync(require.resolve('../'+file),'utf8'),events={},target={getAttribute(){return 'tick';},closest(){return null;},addEventListener(k,fn){events[k]=fn;}};let removed=0,prevented=0;
  const context={WeakMap,Date:{now:()=>1000},Math,pointerEventCoordinates:e=>e};vm.runInNewContext(code.slice(code.indexOf(start),code.indexOf(end))+';this.bind=bindRemovalGesture;',context);context.bind(target,()=>removed++);
  const event={preventDefault(){prevented++;}};events.contextmenu(event);events.dblclick(event);assert.equal(removed,file==='exam-ui.js'?2:1,file);assert.ok(prevented>=2,file+' duplicate gesture must still cancel native click');
 }
});


test('repeated keyboard removals are distinct actions even within the touch duplicate window',()=>{
 const events={},card={},target={getAttribute(){return 'Repeat signs';},closest(s){return s==='.question-card'?card:null;},addEventListener(k,fn){events[k]=fn;}};let answer='end-bar-1',removed=0;
 const context={WeakMap,Date:{now:()=>1000},Math,pointerEventCoordinates:e=>e};
 vm.runInNewContext(source.slice(source.indexOf('  const removalGestureStates'),source.indexOf('  function pointerEventCoordinates'))+';this.bind=bindRemovalGesture;',context);
 context.bind(target,()=>{answer='';removed++;});
 const event={type:'keydown',shiftKey:true,key:'Backspace',preventDefault(){}};
 events.keydown(event);assert.equal(answer,'');answer='end-bar-2';events.keydown(event);
 assert.equal(answer,'');assert.equal(removed,2,'the newly placed answer must be removable immediately');
});

test('armed bar-label targets take pointer priority over broad note-entry targets',()=>{
 const order=['label','notes'],attributes={},target={dataset:{},parentNode:{appendChild(){order.splice(order.indexOf('label'),1);order.push('label');}},setAttribute(k,v){attributes[k]=v;}};
 const scope={querySelectorAll(selector){return selector==='.q3-bar-label-hit-area'?[target]:[];}},context={document:scope,q3BarLabelArmed:false};
 const start=source.indexOf('  function q3SetBarLabelToolArmed('),end=source.indexOf('  function q3SetRhythmToolArmed(',start);
 vm.runInNewContext(source.slice(start,end)+';this.arm=q3SetBarLabelToolArmed;',context);
 context.arm(true);assert.deepEqual(order,['notes','label']);assert.equal(attributes['aria-disabled'],'false');
 context.arm(false);assert.equal(attributes['aria-disabled'],'true');assert.equal(attributes.tabindex,'-1');
});


test('adjacent Advanced Higher start/end repeat targets occupy opposite sides of the shared barline',()=>{
 const start=source.indexOf('  function q3RepeatTargetBox('),end=source.indexOf('  function q3SetRepeatToolArmed(',start),context={};
 vm.runInNewContext(source.slice(start,end)+';this.box=q3RepeatTargetBox;',context);
 const left=context.box(320,90,'end'),right=context.box(320,90,'start');
 assert.equal(left.x+left.width,right.x,'neighbouring repeat targets must not intercept one another');
 for(const box of [left,right]){assert.equal(box.width,24);assert.equal(box.height,72);assert.equal(box.y,77);}
});

test('AH 2023 bracket drawing returns the preview node so leaving a target can remove it',()=>{
 const start=source.indexOf('      const drawBracket=(barNumber'),end=source.indexOf('\n      if(bracketAnswer)',start),children=new Set();
 const context={bLocations:[{start:100,end:200,top:90}],svg:{append(node){children.add(node);}},svgElement(tag,attributes){return{tag,attributes,remove(){children.delete(this);}};}};
 vm.runInNewContext(source.slice(start,end)+';this.draw=drawBracket;',context);
 const preview=context.draw(1,'q3-bar-label-preview',.35);assert.ok(preview,'append() does not return the added node');assert.equal(preview.attributes.opacity,.35);assert.equal(children.size,1);
 preview.remove();assert.equal(children.size,0,'the transient bracket must not remain behind');
});


test('click-only score targets preserve native touch clicks while preventing mouse text selection',()=>{
 const context={},start=source.indexOf('  function q3PreventMouseSelection('),end=source.indexOf('  const removalGestureStates',start);
 vm.runInNewContext(source.slice(start,end)+';this.prevent=q3PreventMouseSelection;',context);
 let prevented=0;for(const pointerType of ['touch','pen'])context.prevent({pointerType,preventDefault(){prevented++;}});
 assert.equal(prevented,0,'touch and pen must retain their compatibility click');
 context.prevent({pointerType:'mouse',preventDefault(){prevented++;}});assert.equal(prevented,1);
});

test('a new score placement allows another touch removal inside the duplicate-event window',()=>{
 const card={},make=label=>({events:{},getAttribute(){return label;},closest(s){return s==='.question-card'?card:null;},addEventListener(k,fn){this.events[k]=fn;}}),tool=make('Repeat signs'),score=make('Place repeat');let answer='first',removed=0;
 const context={WeakMap,Date:{now:()=>1000},Math,pointerEventCoordinates:e=>e};
 vm.runInNewContext(source.slice(source.indexOf('  const removalGestureStates'),source.indexOf('  function pointerEventCoordinates'))+';this.bind=bindRemovalGesture;',context);
 context.bind(tool,()=>{answer='';removed++;});context.bind(score,()=>{});
 const down={type:'pointerdown',pointerId:1,pointerType:'touch',clientX:5,clientY:5},tap={type:'touchend',clientX:5,clientY:5,preventDefault(){}};
 tool.events.touchend(tap);tool.events.touchend(tap);assert.equal(answer,'');
 score.events.pointerdown(down);score.events.touchend(tap);answer='second';
 tool.events.pointerdown(down);tool.events.touchend(tap);tool.events.pointerdown(down);tool.events.touchend(tap);
 assert.equal(answer,'');assert.equal(removed,2,'an intervening placement must release the old duplicate filter');
 tool.events.contextmenu({type:'contextmenu',preventDefault(){}});assert.equal(removed,2,'a duplicate compatibility event must still be suppressed');
});


test('a native touch dblclick cannot remove an answer after tool-score-tool taps',()=>{
 const card={},events={},target={getAttribute(){return 'Repeat signs';},closest(s){return s==='.question-card'?card:null;},addEventListener(k,fn){events[k]=fn;}};let removed=0,prevented=0;
 const context={WeakMap,Date:{now:()=>1000},Math,pointerEventCoordinates:e=>e};vm.runInNewContext(source.slice(source.indexOf('  const removalGestureStates'),source.indexOf('  function pointerEventCoordinates'))+';this.bind=bindRemovalGesture;',context);context.bind(target,()=>removed++);
 events.pointerdown({pointerType:'touch',pointerId:1});events.dblclick({type:'dblclick',preventDefault(){prevented++;}});assert.equal(removed,0);assert.equal(prevented,1);
 events.pointerdown({pointerType:'mouse',pointerId:2});events.dblclick({type:'dblclick',preventDefault(){}});assert.equal(removed,1,'ordinary mouse double-click removal must remain available');
});


test('armed repeat targets take input priority over overlapping missing-note entry areas',()=>{
 const order=['repeat','notes'],attributes={},target={parentNode:{appendChild(){order.splice(order.indexOf('repeat'),1);order.push('repeat');}},setAttribute(k,v){attributes[k]=v;},blur(){}};
 const scope={querySelectorAll(selector){return selector==='.q3-repeat-hit-area'?[target]:[];}},context={document:scope,q3RepeatArmed:false};
 const start=source.indexOf('  function q3SetRepeatToolArmed('),end=source.indexOf('  function q3AddRepeatTargets(',start);
 vm.runInNewContext(source.slice(start,end)+';this.arm=q3SetRepeatToolArmed;',context);
 context.arm(true);assert.deepEqual(order,['notes','repeat']);assert.equal(attributes['aria-disabled'],'false');
 context.arm(false);assert.equal(attributes['aria-disabled'],'true');assert.equal(attributes.tabindex,'-1');
});


test('a fresh pointer gesture may remove a new answer on the same control inside 250ms',()=>{
 const events={},target={getAttribute(){return 'notation option';},closest(){return null;},addEventListener(k,fn){events[k]=fn;}};let removed=0;
 const context={WeakMap,Date:{now:()=>1000},Math,pointerEventCoordinates:e=>e};vm.runInNewContext(source.slice(source.indexOf('  const removalGestureStates'),source.indexOf('  function pointerEventCoordinates'))+';this.bind=bindRemovalGesture;',context);context.bind(target,()=>removed++);
 const event={type:'contextmenu',preventDefault(){}};events.contextmenu(event);assert.equal(removed,1);
 events.pointerdown({pointerType:'mouse',pointerId:1});events.contextmenu(event);assert.equal(removed,2,'a new selection/removal gesture must not inherit the previous answer filter');
 events.dblclick({type:'dblclick',preventDefault(){}});assert.equal(removed,2,'compatibility duplicates without a new gesture remain suppressed');
});


test('crowded circle-note targets meet at midpoints and preserve each printed note centre',()=>{
 const context={},start=source.indexOf('  function q3NoteSelectionHitBox('),end=source.indexOf('  function q3RepeatTargetBox(',start);
 vm.runInNewContext(source.slice(start,end)+';this.box=q3NoteSelectionHitBox;',context);
 const xs=[670.0505795574288,686.4488935721812,706],boxes=xs.map(x=>context.box(x,554,xs,20));
 for(let i=0;i<boxes.length;i++){const box=boxes[i];assert.ok(box.x<xs[i]&&box.x+box.width>xs[i]);assert.equal(box.y,534);assert.equal(box.height,40);if(i)assert.ok(boxes[i-1].x+boxes[i-1].width<=box.x+.000001);}
});


test('note removal survives SVG replacement and runs before the second tap can reinsert the note',()=>{
 let now=1000,removed=0,commits=0;const card={},context={WeakMap,Date:{now:()=>now},Math,pointerEventCoordinates:e=>e};
 vm.runInNewContext(source.slice(source.indexOf('  const removalGestureStates'),source.indexOf('  function pointerEventCoordinates'))+';this.bind=bindRemovalGesture;',context);
 const make=()=>{const target={attached:true,events:{},ownerSVGElement:{},getAttribute(k){return k==='class'?'q3-note-hit-area':k==='aria-label'?'Missing notes':null;},closest(s){return this.attached&&s==='.question-card'?card:null;},addEventListener(k,fn,options){this.events[k]={fn,options};}};context.bind(target,()=>{assert.equal(target.attached,true,'remove while score geometry still exists');removed++;target.attached=false;});return target;};
 const tap=target=>{const down={type:'pointerdown',pointerId:1,pointerType:'touch',clientX:50,clientY:60};target.events.pointerdown.fn(down);let stopped=false;const up={...down,type:'pointerup',preventDefault(){},stopImmediatePropagation(){stopped=true;}};assert.equal(target.events.pointerup.options.capture,true);target.events.pointerup.fn(up);if(!stopped){commits++;target.attached=false;}target.events.touchend.fn({type:'touchend',clientX:50,clientY:60,preventDefault(){}});now+=50;};
 tap(make());tap(make());assert.equal(removed,1,'double-tap removes exactly once across two SVG instances');assert.equal(commits,1,'second tap cannot reinsert the removed note');
 tap(make());assert.equal(commits,2,'a fresh third tap can place a note again');assert.equal(removed,1);
});

test('AH 2018 bracket targets use the shared armed state and leave blank score space available',()=>{
 const start=source.indexOf('        if(onChange)for(let index=0;index<15;index++){const first=locations[index],last=locations[index+1]');
 const code=source.slice(start,source.indexOf('        return svg;',start));
 for(const [armed,answer] of [[false,''],[true,''],[false,'bars-12-13']]){
  const targets=[];const context={svg:{},locations:Array.from({length:16},(_,i)=>({start:i*100,end:(i+1)*100,top:100})),answers:{q2aii:answer},q3BarLabelArmed:armed,onChange(){},q3SetBarLabelToolArmed(){},bindRemovalGesture(){},ah2016Target(){const t={dataset:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;}};targets.push(t);return t;}};
  vm.runInNewContext(code,context);assert.equal(targets.length,15);
  targets.forEach((t,i)=>{const enabled=armed||answer===`bars-${i+1}-${i+2}`;assert.equal(t.attrs.class,'q3-bar-label-hit-area');assert.equal(t.attrs['aria-disabled'],String(!enabled));assert.equal(t.attrs.tabindex,enabled?'0':'-1');});
  if(answer)assert.equal(targets[11].dataset.barLabelPlaced,'true');
 }
});

test('fitted note drags and neighbouring notes never become a removal double tap',()=>{
 let now=1000,removed=0,stopped=0;const card={},cell={x:100,y:100},events={};
 const target={ownerSVGElement:{querySelector(){return{getAttribute:k=>String(cell[k])};}},getAttribute:k=>k==='class'?'q3-note-hit-area':k==='data-note-selection'?null:'Missing notes',closest:s=>s==='.question-card'?card:null,addEventListener(k,f){events[k]=f;}};
 const context={WeakMap,Math,Date:{now:()=>now},pointerEventCoordinates:e=>e};vm.runInNewContext(source.slice(source.indexOf('  const removalGestureStates'),source.indexOf('  function pointerEventCoordinates'))+';this.bind=bindRemovalGesture;',context);context.bind(target,()=>removed++);
 const event=(type,y=10)=>({type,pointerType:'touch',pointerId:1,clientX:10,clientY:y,preventDefault(){},stopImmediatePropagation(){stopped++;}});
 const down=()=>events.pointerdown(event('pointerdown'));const up=(y=10)=>{events.pointerup(event('pointerup',y));events.touchend(event('touchend',y));now+=50;};
 down();up();down();cell.y-=5.5;up(8);assert.equal(removed,0,'a two-pixel fitted drag changes pitch and is not a double tap');
 down();up();assert.equal(removed,0,'a new tap after dragging starts a fresh pair');
 down();up();assert.equal(removed,1,'two taps on the same note cell still remove it once');assert.equal(stopped,1);
 down();up();cell.x+=20;down();up();assert.equal(removed,1,'neighbouring score slots can be closer than the CSS double-tap radius');
 events.keydown({key:'ArrowUp'});down();up();assert.equal(removed,1,'keyboard entry interrupts an old touch pair');
});

test('AH 2024 tie measurement never appends invisible beam targets to the interactive score',()=>{
 const start=source.indexOf('      const lowerEntered = String(answers.q4bii');
 const code=source.slice(start,source.indexOf('      return svg;',start));const svg={},groups=[],ties=[];
 const context={svg,review:{},answers:{q4bii:'E3,D3,D3'},data:{b:{octaveLower:{rhythms:['crotchet','quaver','quaver'],tie:[1,2]}}},bassTop:1295,octaveSlots:[{x:150},{x:180},{x:210}],answerClass:()=>'',ah2016Notes:notes=>notes,svgElement(tag){const g={tag};groups.push(g);return g;},higher2015DrawNotes(parent,notes,xs){assert.notEqual(parent,svg,'hidden helpers stay detached');return xs.map(x=>({x,y:1300,down:false}));},q3DrawTie(parent,a,b){ties.push({parent,a,b});}};
 vm.runInNewContext(code,context);assert.equal(groups[0].tag,'g');assert.equal(ties.length,1);assert.equal(ties[0].parent,svg);assert.equal(ties[0].a.x,180);assert.equal(ties[0].b.x,210);
});
