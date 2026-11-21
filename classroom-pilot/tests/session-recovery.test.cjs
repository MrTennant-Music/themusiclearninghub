const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../keyboardnoteidentificationclassroom.html'),'utf8');
test('host session survives refresh, stays scoped to its room and keeps token out of the URL',()=>{
 const storage=new Map(),location={href:'https://example.test/keyboardnoteidentificationclassroom.html?mode=host&setup=test'};
 Object.defineProperty(location,'search',{get:()=>new URL(location.href).search});
 const context={URL,URLSearchParams,location,history:{replaceState:(_a,_b,url)=>{location.href=String(url);}},sessionStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)}};
 vm.runInNewContext(html.slice(html.indexOf('function loadHostSession(){'),html.indexOf('function Classroom(){'))+';this.load=loadHostSession;this.save=saveHostSession;',context);
 const identity={pin:'123456',token:'a'.repeat(64)};context.save(identity);
 assert.equal(new URL(location.href).searchParams.get('room'),'123456');assert.ok(!location.href.includes(identity.token));assert.equal(context.load().token,identity.token);
 location.href='https://example.test/keyboardnoteidentificationclassroom.html?mode=host';assert.equal(context.load(),null);
 location.href+='&room=654321';assert.equal(context.load(),null);
 location.href='https://example.test/keyboardnoteidentificationclassroom.html?mode=host&room=123456';storage.set('mlh:classroom:host:123456','{"pin":"123456","token":"bad"}');assert.equal(context.load(),null);
});
function stateContext(){
 const state={};const context={state,URL,history:{replaceState:()=>{}},location:{href:'https://example.test/keyboardnoteidentificationclassroom.html'},sessionStorage:{removeItem:()=>{}},hosting:false,mounted:{current:true},session:{current:{pin:'123456'}},latestGame:{current:null},clockOffset:{current:0},failures:{current:0},Date};
 for(const key of ['Game','Selected','RestoringHost','Error','Connected','Now'])context['set'+key]=value=>{state[key]=value;};
 vm.runInNewContext(html.slice(html.indexOf(' function forgetSession(){'),html.indexOf(' async function act('))+';this.update=update;this.readFailure=readFailure;',context);
 return context;
}
test('server restores own Quiz selection and clears it on the next question',()=>{
 const context=stateContext();context.update({host:false,index:0,phase:'question',submitted:true,myAnswer:'F',serverTime:Date.now()});assert.equal(context.state.Selected,'F');
 context.update({host:false,index:0,phase:'review',submitted:true,myAnswer:'F',serverTime:Date.now()});assert.equal(context.state.Selected,'F');
 context.update({host:false,index:1,phase:'countdown',submitted:false,myAnswer:null,serverTime:Date.now()});assert.equal(context.state.Selected,null);
});
test('polling recovers after more than three failures and retries immediately on online',async()=>{
 const context=stateContext(),timers=new Map(),events=new Map();let id=0,attempts=0,cleanup;
 Object.assign(context,{useEffect:fn=>{cleanup=fn();},inFlight:{current:false},actionPending:{current:false},pendingRead:{current:null},window:{addEventListener:(key,fn)=>events.set(key,fn),removeEventListener:key=>events.delete(key)},setTimeout:(fn,delay)=>{timers.set(++id,{fn,delay});return id;},clearTimeout:key=>timers.delete(key),setInterval:()=>1,clearInterval:()=>{},Math,request:async()=>{if(++attempts<=4)throw Error('temporary outage');return {host:false,phase:'question',serverTime:Date.now()};}});
 const start=html.indexOf(' useEffect(()=>{let timeout;'),end=html.indexOf('\n },[]);',start)+8;vm.runInNewContext(html.slice(start,end),context);
 async function cycle(){const [key,timer]=timers.entries().next().value;timers.delete(key);await timer.fn();}
 for(let i=0;i<5;i++)await cycle();assert.equal(attempts,5);assert.equal(context.state.Connected,true);assert.equal(context.failures.current,0);
 const pending=events.get('online')();await pending;await new Promise(resolve=>setImmediate(resolve));assert.equal(attempts,6);
 cleanup();assert.equal(timers.size,0);assert.equal(events.size,0);
});
test('expired host room clears saved control and allows a new game',()=>{
 const context=stateContext();context.hosting=true;let removed;context.sessionStorage.removeItem=key=>{removed=key;};context.readFailure(Object.assign(Error('Game not found or expired.'),{terminal:true}));assert.equal(removed,'mlh:classroom:host:123456');assert.equal(context.session.current,null);assert.equal(context.state.RestoringHost,false);
});
