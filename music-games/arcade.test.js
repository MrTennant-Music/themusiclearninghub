const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),nodeTest=require('node:test');
// These modes were deliberately retired; preserve their historical checks without treating them as current Playnote failures.
const test=(name,fn)=>nodeTest(name,{skip:'Retired mode: not offered in Playnote'},fn);
const root=require('node:path').resolve(__dirname,'..');
const Babel=require(root+'/node_modules/@babel/standalone');
const source=fs.readFileSync(root+'/music-games/arcade.jsx','utf8');
const code=Babel.transform(source,{presets:['react']}).code;
const React=require(root+'/node_modules/react');
const Core=require('./core.js');
const activity={id:'arcade-test',revision:1,title:'Notes',items:[{id:'a',prompt:'First note',answer:'A',distractors:['B','C','D']},{id:'b',prompt:'Second note',answer:'B',distractors:['A','C','D']}]};
function make(name,{storage=new Map(),storageFailure=false,activityOverride=activity,options={}}={}){
 let slots=[],cursor=0,pending=[],intervals=new Map(),timeouts=new Map(),tid=0,finished=null,progress=null;
 const depsEqual=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
 const R={...React,useState(init){const n=cursor++;if(!(n in slots))slots[n]=typeof init==='function'?init():init;return[slots[n],value=>{slots[n]=typeof value==='function'?value(slots[n]):value;}];},useRef(init){const n=cursor++;return slots[n]||(slots[n]={current:init});},useMemo(fn,deps){const n=cursor++;if(!slots[n]||!depsEqual(slots[n].deps,deps))slots[n]={deps,value:fn()};return slots[n].value;},useEffect(fn,deps){const n=cursor++;if(!slots[n]||!depsEqual(slots[n].deps,deps)){const previous=slots[n];slots[n]={deps};pending.push(()=>{previous?.cleanup?.();slots[n].cleanup=fn();});}}};
 const win={localStorage:{getItem(key){return storage.get(key)||null;},setItem(key,value){if(storageFailure)throw Error('Quota exceeded');storage.set(key,value);}},IGCore:Core,IGMedia:()=>null};
 vm.runInNewContext(code,{window:win,React:R,console,setInterval(fn){intervals.set(++tid,fn);return tid;},clearInterval(id){intervals.delete(id);},setTimeout(fn){timeouts.set(++tid,fn);return tid;},clearTimeout(id){timeouts.delete(id);}});
 const props={activity:activityOverride,options,onComplete:r=>finished=r,onProgress:r=>progress=r};
 let tree;
 function resolve(node){if(node==null||typeof node!=='object')return node;if(Array.isArray(node))return node.map(resolve);if(typeof node.type==='function')return resolve(node.type(node.props));return{...node,props:{...node.props,children:resolve(node.props.children)}};}
 function render(){cursor=0;pending=[];tree=resolve(win.IGArcade[name](props));for(const fn of pending)fn();return tree;}
 function all(node=tree,result=[]){if(Array.isArray(node)){for(const n of node)all(n,result);}else if(node&&typeof node==='object'){result.push(node);if(node.props?.children!==undefined)all(node.props.children,result);}return result;}
 function txt(node){if(Array.isArray(node))return node.map(txt).join('');if(node&&typeof node==='object')return txt(node.props?.children);return node??'';}
 function click(label){render();const el=all().find(n=>n.type==='button'&&(txt(n)===label||(name==='flying-fruit'&&txt(n).endsWith(label))));assert(el,`${name}: missing ${label}`);assert(!el.props.disabled,`${name}: disabled ${label}`);el.props.onClick?.({});render();}
 function dispose(){for(const slot of slots)slot?.cleanup?.();assert.equal(intervals.size,0,name+' leaked interval');assert.equal(timeouts.size,0,name+' leaked timeout');}
 render();render();return {render,click,all,txt,dispose,intervals,timeouts,setActive(active){props.options={...props.options,active};render();},get finished(){return finished},get progress(){return progress}};
}
for(const name of ['balloon-pop','flying-fruit'])test(name+' scores correct and wrong choices',()=>{const h=make(name);h.click('A');assert.equal(h.progress.correct,1);h.click('Next');h.click('A');h.click('Finish');assert.equal(h.finished.correct,1);assert.equal(h.finished.total,2);h.dispose();});
test('Whack-a-mole exposes targets and stops its timer',()=>{
 const h=make('whack-a-mole');let target;
 for(let attempt=0;attempt<100&&!target;attempt++){h.render();target=h.all().find(n=>n.type==='button'&&n.props.className==='ig-mole is-up'&&h.txt(n).endsWith('A'));if(!target)for(const fn of [...h.intervals.values()])fn();}
 assert(target,'Correct mole must appear');target.props.onClick();h.render();assert.equal(h.progress.correct,1);h.dispose();
});
test('Memory game moves from study to recall',()=>{const h=make('watch-and-memorize');h.click('I’m ready');h.click('A');assert.equal(h.progress.correct,1);h.dispose();});
test('Plane collision scores the selected lane',()=>{
 const h=make('airplane');const lanes=h.all().filter(n=>n.props.className?.startsWith('ig-flight-lane'));
 const index=lanes.findIndex(n=>h.txt(n).includes('A'));
 assert(index>=0);h.click('Lane '+(index+1));h.click('Launch');for(let i=0;i<110;i++)for(const fn of [...h.intervals.values()])fn();h.render();assert.equal(h.progress.correct,1);h.dispose();
});
test('Maze player can reach correct destination',()=>{
 const h=make('maze-chase');const cells=h.all().filter(n=>n.props.className?.startsWith('ig-maze-cell'));
 const target=cells.findIndex(cell=>h.all(cell).some(n=>n.props['aria-label']==='A'));
 assert(target>=0);const blocked=new Set(cells.flatMap((cell,i)=>cell.props.className.includes('is-wall')?[i]:[]));blocked.add(39);
 const queue=[[44,[]]],seen=new Set([44]);let path;
 while(queue.length){const [cell,steps]=queue.shift();if(cell===target){path=steps;break;}const x=cell%13,y=Math.floor(cell/13);for(const [dx,dy,key] of [[-1,0,'ArrowLeft'],[1,0,'ArrowRight'],[0,-1,'ArrowUp'],[0,1,'ArrowDown']]){const a=x+dx,b=y+dy,next=b*13+a;if(a>=0&&a<13&&b>=0&&b<7&&!blocked.has(next)&&!seen.has(next)){seen.add(next);queue.push([next,[...steps,key]]);}}}
 assert(path,'Correct maze destination must be reachable');for(const direction of path){h.all().find(n=>n.props.className==='ig-maze-board').props.onKeyDown({key:direction,preventDefault(){}});h.render();}assert.equal(h.progress.correct,1);h.dispose();
});
test('Flashcards finish without claiming automatic correctness',()=>{const h=make('flash-cards');h.click('Flip card');h.click('Finish practice');assert.equal(h.finished.unscored,true);h.dispose();});
test('Speaking cards clean up discussion timer',()=>{const h=make('speaking-cards');h.click('Draw a card');h.click('Start timer');h.click('Finish discussion');assert.equal(h.finished.unscored,true);h.dispose();});
test('Seating plan allocates each person',()=>{const h=make('seating-plan');h.click('Randomise seats');h.click('Finish');assert.equal(h.finished.answers.length,2);h.dispose();});
test('Generated arithmetic reports every answer',()=>{const h=make('maths-generator');h.click('Generate questions');for(let i=0;i<10;i++){h.render();const question=h.all().find(n=>n.props.className==='ig-maths-question');const m=h.txt(question).match(/(\d+) \+ (\d+)/);const input=h.all().find(n=>n.type==='input');input.props.onChange({target:{value:String(+m[1]+ +m[2])}});h.render();h.all().find(n=>n.type==='form').props.onSubmit({preventDefault(){}});h.render();h.click(i===9?'Finish':'Next');}assert.equal(h.finished.correct,10);h.dispose();});
for(const name of ['open-the-box','flip-tiles','brainstorm','word-magnets'])test(name+' mounts and disposes',()=>{const h=make(name);h.dispose();});

test('Seating arrangement persists by activity revision',()=>{
 const storage=new Map();const first=make('seating-plan',{storage});first.click('Randomise seats');first.dispose();
 const restored=make('seating-plan',{storage});restored.click('Finish');assert.equal(restored.finished.answers.length,2);restored.dispose();
});
test('Board save failures show an actionable notice',()=>{
 const h=make('brainstorm',{storageFailure:true});h.render();assert(h.all().some(node=>node.props.role==='alert'&&h.txt(node).includes('could not be saved')));h.dispose();
});
test('Maths generator reports denominator as soon as questions are generated',()=>{
 const h=make('maths-generator');h.click('Generate questions');assert.equal(h.progress.total,10);assert.equal(h.progress.correct,0);h.dispose();
});

for(const mode of ['watch-and-memorize','whack-a-mole'])test(mode+' waits for Play before advancing',()=>{
 const h=make(mode,{options:{active:false}});
 assert.equal(h.intervals.size,0,'Preview must not run a game timer');
 h.setActive(true);
 assert.equal(h.intervals.size,1,'Play starts the game timer');
 h.setActive(false);
 assert.equal(h.intervals.size,0,'An inactive game stops its timer');
 h.dispose();
});

test('library board previews never write saved board state',()=>{
 for(const name of ['brainstorm','seating-plan','word-magnets']){
  const storage=new Map();
  const h=make(name,{storage,activityOverride:{...activity,__preview:true},options:{active:false,sound:false}});
  assert.equal(storage.size,0,name+' must not create board records from a thumbnail');
  assert.equal(h.intervals.size,0,name+' must stay paused');
  h.dispose();
 }
});
test('arcade thumbnails do not run clocks or animation timers',()=>{
 for(const name of ['balloon-pop','flying-fruit','airplane','maze-chase','whack-a-mole','open-the-box','flip-tiles','brainstorm','seating-plan','word-magnets']){
  const h=make(name,{options:{active:false,sound:false},activityOverride:{...activity,__preview:true}});
  assert.equal(h.intervals.size,0,name+' preview interval');
  assert.equal(h.timeouts.size,0,name+' preview timeout');
  h.dispose();
 }
});

nodeTest("retired arcade modes are not registered as playable games",()=>{const sandbox={window:{},React};vm.runInNewContext(code,sandbox);assert.deepEqual(Object.keys(sandbox.window.IGArcade),[]);});
