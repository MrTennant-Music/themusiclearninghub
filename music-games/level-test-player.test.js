const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),Babel=require('@babel/standalone');
const C=require('./core'),L=require('./level-test-core');
const source=Babel.transform(fs.readFileSync('music-games/session.jsx','utf8'),{presets:['react']}).code;
function harness(mode='quiz',level='AH'){
 let cursor=0,tree;const slots=[];
 const React={createElement(type,props,...children){return {type,props:{...props,children:children.flat(Infinity)}};},useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],update=>slots[i]=typeof update==='function'?update(slots[i]):update];},useRef(initial){const i=cursor++;return slots[i]||(slots[i]={current:initial});},useEffect(){cursor++;}};
 const activity=C.makeActivity({title:'All Concepts Quiz',specialMode:'level-test',level,template:mode,conceptCount:3,options:{theme:'blue'},items:['Alpha','Beta','Gamma'].map((answer,i)=>({id:String(i),prompt:'Definition '+i,answer}))});
 const sandbox={React,document:{body:{dataset:{}}},window:{IGCore:C,IGLevelTestCore:L}};vm.runInNewContext(source,sandbox);
 const render=()=>{cursor=0;return tree=sandbox.window.IGLevelTestSession({activity});};
 const nodes=n=>n&&typeof n==='object'?[n,...(n.props.children||[]).flatMap(nodes)]:[];
 const text=n=>n&&typeof n==='object'?(n.props.children||[]).map(text).join(''):n==null?'':String(n);
 function act(fn){fn();render();}
 render();return {activity,render,nodes:()=>nodes(tree.props.openingScreen),text:()=>text(tree.props.openingScreen),tree:()=>tree,regular:sandbox.window.IGGameSession,enter(){act(()=>tree.props.onStart());},configure(count,feedback){act(()=>nodes(tree.props.openingScreen).find(n=>n.type==='input').props.onChange({target:{value:count}}));act(()=>nodes(tree.props.openingScreen).find(n=>n.type==='select').props.onChange({target:{value:feedback}}));},start(){act(()=>nodes(tree.props.openingScreen).find(n=>n.type==='form').props.onSubmit({preventDefault(){}}));},reset(kind){act(()=>tree.props[kind]());}};
}
test('every level and quiz format mounts the actual regular GameSession',()=>{
 for(const level of C.qualificationLevels)for(const mode of L.modes){const h=harness(mode,level);assert.equal(h.tree().type,h.regular);assert.equal(h.tree().props.active,false);assert.ok(h.tree().props.openingScreen);h.enter();assert.equal(h.tree().props.openingActive,true);h.configure(2,'each');h.start();assert.equal(h.tree().type,h.regular);assert.equal(h.tree().props.active,true);assert.equal(h.tree().props.openingScreen,null);assert.equal(h.tree().props.mode,mode);assert.equal(h.tree().props.activity.items.length,2);assert.equal(h.tree().props.options.timer,0);assert.equal(h.tree().props.options.shuffle,true);assert.equal(h.tree().props.options.feedback,'each');}
});
test('the only quiz-specific screen collects count and feedback with a level heading',()=>{
 const h=harness();assert.match(h.text(),/Advanced Higher Quiz/);assert.equal(h.nodes().filter(n=>n.type==='input').length,1);assert.equal(h.nodes().filter(n=>n.type==='select').length,1);h.configure(3,'end');h.start();assert.equal(h.tree().props.options.feedback,'end');assert.equal(h.tree().props.activity.items.length,3);
});
test('regular Play Again and Restart return to the opening screen with settings retained',()=>{
 for(const action of ['onExit','onRestart']){const h=harness();h.enter();h.configure(1,'end');h.start();const key=h.tree().props.key;h.reset(action);assert.equal(h.tree().props.active,false);assert.equal(h.tree().props.openingActive,false);assert.ok(h.tree().props.openingScreen);assert.notEqual(h.tree().props.key,key);h.start();assert.equal(h.tree().props.activity.items.length,1);assert.equal(h.tree().props.options.feedback,'end');}
});
test('invalid quiz counts do not open a game',()=>{const h=harness();for(const count of [0,4,1.5]){h.configure(count,'each');h.start();assert.equal(h.tree().props.active,false);assert.match(h.text(),/Choose between/);}});
