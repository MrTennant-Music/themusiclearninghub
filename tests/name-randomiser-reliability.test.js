const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),Babel=require('@babel/standalone'),CORE=require('../name-randomiser-core.js');
const html=fs.readFileSync(require('node:path').join(require('node:path').resolve(__dirname, '..'),'namerandomiser.html'),'utf8');
test('page uses local prebuilt dependencies and its runtime matches the JSX source',()=>{
 assert.doesNotMatch(html,/<script[^>]+src=["']https?:\/\//i);assert.doesNotMatch(html,/text\/babel|@babel\/standalone|cdn\.tailwindcss\.com/i);
 assert.match(html,/vendor\/tailwind\/site\.css/);assert.match(html,/vendor\/react\/react\.production\.min\.js/);assert.match(html,/name-randomiser-runtime\.js/);
 const source=html.match(/<script type="text\/x-name-randomiser-source" id="name-randomiser-jsx-source">([\s\S]*?)<\/script>/)[1];
 const compiled=Babel.transform(source,{filename:'namerandomiser.html',presets:['react'],sourceMaps:false,comments:false,compact:true}).code;
 assert.equal(fs.readFileSync('name-randomiser-runtime.js','utf8').trim(),compiled.trim());
});
test('page keeps modal, menu, grammar and idle-update safeguards',()=>{
 assert.match(html,/aria-label=\{count \? `Vinyl containing \$\{count\} \$\{count === 1 \? "name" : "names"\}`/);
 assert.match(html,/aria-label=\{count \? `Cassette containing \$\{count\} \$\{count === 1 \? "name" : "names"\}`/);
 assert.match(html,/aria-controls="name-randomiser-method-menu"/);assert.match(html,/aria-controls="name-randomiser-saved-menu"/);
 assert.match(html,/if \(!segments\.length \|\| spinning/);assert.match(html,/if \(document\.hidden\) return/);assert.match(html,/\}, 100\);/);
 assert.match(html,/useModalFocus\(Boolean\(winner\)/);assert.match(html,/aria-modal="true"/);assert.match(html,/disabled=\{wheelOverlayOpen\}/);
});
function memoryStorage(){const values=new Map();return {get length(){return values.size;},key:i=>[...values.keys()][i],getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};}
const list=(id,name)=>({id,title:name,segments:[{id:'segment-'+id,names:[name]}]});
test('separate tabs retain independent classes and migrate legacy classes only once',()=>{
 const storage=memoryStorage(),a=CORE.createClassStorage(storage,'names'),b=CORE.createClassStorage(storage,'names');
 const legacy=list('old','Legacy');a.read([legacy]);b.read([legacy]);a.save(list('a','Ada'));b.save(list('b','Ben'));
 assert.deepEqual(a.read().map(x=>x.id).sort(),['a','b','old']);b.remove(legacy);assert.ok(!a.read([legacy]).some(x=>x.id==='old'));
});
test('conflicting edits and deletes preserve the latest saved class',()=>{
 const storage=memoryStorage(),a=CORE.createClassStorage(storage,'names'),b=CORE.createClassStorage(storage,'names');a.read();const original=list('a','Ada');a.save(original);const updated={...original,title:'Updated class'};b.save(updated,original);
 assert.throws(()=>a.save({...original,title:'Stale edit'},original),/another tab/);assert.throws(()=>a.remove(original),/another tab/);assert.equal(a.read()[0].title,'Updated class');
});
test('failed class writes do not announce success or close the save dialog',()=>{
 const code=html.slice(html.indexOf('  function confirmSave()'),html.indexOf('  function loadList('));const calls=[];
 const context={CORE,dialog:{value:'Class A'},segments:list('a','Ada').segments,uid:()=> 'new',storeClass:()=>false,setActiveSavedId:()=>calls.push('active'),setDialog:()=>calls.push('closed'),setStatus:()=>calls.push('saved')};vm.runInNewContext(code+';confirmSave();',context);assert.deepEqual(calls,[]);
 const storage=memoryStorage();storage.setItem=()=>{throw Error('Quota exceeded');};assert.throws(()=>CORE.createClassStorage(storage,'names').save(list('a','Ada')),/Quota/);
 const errors=[],context2={CORE,STORAGE_KEY:'names',initial:{savedLists:[]},window:{localStorage:storage},setStorageError:value=>errors.push(value),setSavedLists:()=>{throw Error('Should not update saved state');}};
 vm.runInNewContext(html.slice(html.indexOf('  function storeClass('),html.indexOf('  function deleteStoredClass('))+';this.save=storeClass;',context2);assert.equal(context2.save(list('a','Ada')),false);assert.match(errors[0],/could not be saved/);
});
function spin(reducedMotion,method='Wheel'){
 const timers=[],state={rotation:0},segments=[list('a','Ada').segments[0],list('b','Ben').segments[0],list('c','Cleo').segments[0]];let frames=0;
 const context={CORE:{...CORE,chooseIndex:()=>0},spinning:false,draftName:'',segments,segmentColour:'multi',rotation:0,slotPosition:0,randomiserMethod:method,soundEffects:false,soundEffectsRef:{current:false},spinDuration:6000,uid:()=>'',performance:{now:()=>0},Math,window:{matchMedia:()=>({matches:reducedMotion}),clearTimeout:()=>{},setTimeout:(fn,delay)=>{timers.push({fn,delay});return timers.length;},cancelAnimationFrame:()=>{},requestAnimationFrame:()=>{frames++;return 1;},MLH:{}}};
 for(const key of ['vinylAudioRef','spinAudioRef','dropAudioRef','vinylFrameRef','slotFrameRef','spinStartTimerRef','spinTimerRef'])context[key]={current:null};
 for(const key of ['Segments','DraftName','DuplicateErrorKey','Winner','Dialog','SpinDuration','Spinning','Status','ConfettiKey','Rotation','SlotPosition'])context['set'+key]=value=>{state[key.toLowerCase()]=typeof value==='function'?value(state[key.toLowerCase()] ?? 0):value;};
 vm.runInNewContext(html.slice(html.indexOf('const DEFAULT_CASSETTE_SPIN_DURATION_MS'),html.indexOf('const ASSET ='))+html.slice(html.indexOf('  function animateSlots('),html.indexOf('  function addName()'))+html.slice(html.indexOf('  function performSpin()'),html.indexOf('  function removeSelectedName()'))+';performSpin();',context);
 timers.sort((a,b)=>a.delay-b.delay).forEach(timer=>timer.fn());return {state,frames,timers};
}
test('winner and pointer agree even when no animation frame runs',()=>{
 const {state}=spin(false);const rotation=((state.rotation%360)+360)%360;const pointedAngle=((180-rotation)%360+360)%360;assert.ok(pointedAngle>=0&&pointedAngle<120);assert.equal(state.winner.names[0],'Ada');
});
test('device reduced motion cannot disable spins or celebrations',()=>{
 for(const method of ['Wheel','Rows']){const {state,frames,timers}=spin(true,method);assert.ok(frames>0);assert.ok(timers.some(timer=>timer.delay>1000));assert.equal(state.winner.names[0],'Ada');assert.equal(state.confettikey,1);}
 assert.ok(!html.includes('prefers-reduced-motion'));
 assert.ok(!html.includes('animationsEnabled'));
});
