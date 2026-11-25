const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../classroom-timer-core.js');

test('independent deadlines stay accurate after a delayed background update', () => {
  const first=T.action(T.create('a','Reading'),'start',1000);
  const second=T.action(T.action(T.create('b','Writing'),'duration',0,600000),'start',61000);
  assert.equal(T.valueAt(first,121000),180000);
  assert.equal(T.valueAt(second,121000),540000);
  assert.equal(T.advance(first,400000).status,'finished');
  assert.equal(T.advance(second,400000).status,'running');
  assert.equal(T.valueAt(T.advance(first,400000),400000),0);
});
test('pause, resume and reset preserve the correct remaining duration', () => {
  let timer=T.action(T.create('a','Timer'),'start',1000);
  timer=T.action(timer,'pause',11234);
  assert.equal(T.valueAt(timer,900000),289766);
  timer=T.action(timer,'start',900000);
  assert.equal(T.valueAt(timer,901000),288766);
  timer=T.action(timer,'reset',901000);
  assert.equal(timer.value,300000);assert.equal(timer.status,'idle');
});
test('extra time works while idle, running, paused and after expiry', () => {
  const idle=T.action(T.create('a','Timer'),'add',1000,180000);
  assert.equal(idle.duration,480000);assert.equal(idle.value,480000);
  const running=T.action(T.action(idle,'start',1000),'add',61000,180000);
  assert.equal(T.valueAt(running,121000),540000);
  const paused=T.action(T.action(running,'pause',121000),'add',900000,60000);
  assert.equal(paused.status,'paused');assert.equal(paused.value,600000);
  const expired=T.action(T.action(T.create('a','Timer'),'start',0),'add',400000,180000);
  assert.equal(expired.status,'running');assert.equal(T.valueAt(expired,401000),179000);
});
test('stopwatch accumulates time across pauses and resets to zero', () => {
  let timer=T.action(T.create('a','Stopwatch'),'mode',0,'stopwatch');
  timer=T.action(timer,'start',1000);timer=T.action(timer,'pause',31234);
  timer=T.action(timer,'start',50000);
  assert.equal(T.valueAt(timer,52000),32234);
  assert.equal(T.action(timer,'reset',52000).value,0);
  assert.equal(T.action(timer,'mode',52000,'timer').value,300000);
});
test('refresh restores running clocks and overdue timers without losing labels or sounds', () => {
  const raw=[{...T.action(T.create('a','Group A','bell'),'start',1000)},T.action(T.action(T.create('b','Group B'),'mode',0,'stopwatch'),'start',1000)];
  const restored=T.restore(JSON.parse(JSON.stringify(raw)),400000);
  assert.equal(restored[0].status,'finished');assert.equal(restored[0].sound,'bell');assert.equal(restored[0].label,'Group A');
  assert.equal(T.valueAt(restored[1],400000),399000);
  assert.equal(T.action(restored[0],'dismiss',400000).acknowledged,true);
  assert.equal(T.restore([null,{duration:-1,value:-1,sound:'invalid'}],0)[1].duration,0);
  assert.equal(T.restore([{...raw[0],id:'timer-7'}],0)[0].id,'timer-7');
  assert.equal(new Set(T.restore([{id:'timer-1'},{id:'timer-1'}],0).map(t=>t.id)).size,2);
  assert.equal(T.restore([{alarmMode:'alert'}],0)[0].alarmMode,'alert');
  assert.equal(T.restore([{alarmMode:'unknown'}],0)[0].alarmMode,'continuous');
});

test('alarms use distinct voices, repeat independently and stop on dismissal', async () => {
  const fs=require('node:fs'),vm=require('node:vm');
  const source=fs.readFileSync(require.resolve('../classroom-timer.jsx'),'utf8');
  const alarmClass=source.slice(source.indexOf('class TimerAlarms'),source.indexOf('\nfunction TimerCard'));
  const intervals=new Map(),timeouts=new Map(),notes=[];let serial=0;
  class Audio {
    constructor(){this.state='suspended';this.currentTime=0;this.destination={};}
    async resume(){this.state='running';}
    async close(){this.state='closed';}
    createGain(){return {disconnected:false,connect(){},disconnect(){this.disconnected=true;},gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}};}
    createOscillator(){const note={type:'sine',frequency:{value:0},connect(){},disconnect(){},start(){notes.push(this);},stop(){}};return note;}
  }
  const sandbox={window:{AudioContext:Audio,MLH:{releaseAudioGain:gain=>gain?.disconnect()}},setTimeout(fn,delay){timeouts.set(++serial,{fn,delay});return serial;},clearTimeout(id){timeouts.delete(id);},setInterval(fn){intervals.set(++serial,fn);return serial;},clearInterval(id){intervals.delete(id);}};
  vm.runInNewContext(`${alarmClass}; this.Alarms=TimerAlarms;`,sandbox);
  const errors=[],alarms=new sandbox.Alarms(message=>errors.push(message));
  alarms.ctx=new Audio();alarms.ctx.resume=async()=>{throw Error('Browser is waiting for a gesture');};
  assert.equal(await alarms.unlock(true),false);assert.deepEqual(errors,[]);
  const restored={...T.create('restored','Restored alarm'),status:'finished'};
  alarms.sync([restored],70);assert.equal(alarms.active.get('restored').bus,null);
  alarms.ctx.resume=Audio.prototype.resume;
  assert.equal(await alarms.unlock(),true);assert.ok(alarms.active.get('restored').bus);
  alarms.sync([],70);
  const signatures=[];
  for(const sound of ['chime','bell','digital','marimba']){
    notes.length=0;alarms.play(sound,70);signatures.push(notes.map(n=>`${n.type}:${n.frequency.value}`).join(','));
  }
  assert.equal(new Set(signatures).size,4);
  notes.length=0;alarms.play('silent',70);alarms.play('chime',0);assert.equal(notes.length,0);
  const first={...T.create('a','A'),status:'finished'},second={...T.create('b','B','bell'),status:'finished'};
  alarms.sync([first,second],70);assert.equal(intervals.size,2);
  const firstBus=alarms.active.get('a').bus;
  alarms.sync([{...first,acknowledged:true},second],70);
  assert.equal(firstBus.disconnected,true);assert.equal(intervals.size,1);assert.equal(alarms.active.has('b'),true);
  const completed=[];alarms.onAlertEnd=id=>completed.push(id);
  const short={...T.create('c','Short alert'),status:'finished',alarmMode:'alert'};
  alarms.sync([second,short],70);assert.equal(intervals.size,2);
  const shortActive=alarms.active.get('c');
  const end= timeouts.get(shortActive.timeout);
  assert.equal(end.delay,5000);end.fn();
  assert.equal(shortActive.bus.disconnected,true);assert.deepEqual(completed,['c']);
  assert.equal(intervals.size,1);assert.equal(alarms.active.has('b'),true);
  alarms.sync([second,{...short,acknowledged:true}],70);assert.equal(intervals.size,1);
  alarms.sync([second,short],70);
  const cancelled=alarms.active.get('c').timeout;alarms.stop('c');
  assert.equal(timeouts.has(cancelled),false);
  const repeating={...T.create('d','Repeating'),status:'running',alarmMode:'alert',alarmCycle:1,alertUntil:6000};
  alarms.sync([second,repeating],70,1000);
  const repeatTimeout=alarms.active.get('d').timeout;
  assert.equal(timeouts.get(repeatTimeout).delay,5000);
  alarms.sync([second,repeating],70,1500);assert.equal(alarms.active.get('d').timeout,repeatTimeout);
  alarms.sync([second,{...repeating,alarmCycle:2,alertUntil:8000}],70,3000);
  assert.equal(timeouts.has(repeatTimeout),false);
  timeouts.get(alarms.active.get('d').timeout).fn();
  assert.equal(alarms.active.has('d'),false);assert.equal(alarms.active.has('b'),true);
  alarms.close();assert.equal(intervals.size,0);assert.deepEqual(errors,['']);
});

test('automatic restart keeps successive countdowns on their original deadlines', () => {
  const original=T.action(T.action(T.create('a','Repeat'),'duration',0,10000),'start',1000);
  const second=T.advance(original,11000,true);
  assert.equal(second.status,'running');assert.equal(second.value,10000);assert.equal(second.anchor,11000);
  assert.equal(second.alarmMode,'alert');assert.equal(second.alertUntil,16000);assert.equal(second.alarmCycle,1);
  assert.equal(T.valueAt(second,12000),9000);
  const fourth=T.advance(second,33000,true);
  assert.equal(fourth.anchor,31000);assert.equal(fourth.alarmCycle,3);assert.equal(T.valueAt(fourth,33000),8000);
  assert.equal(T.advance(fourth,41000,false).status,'finished');
});

test('automatic timers can be paused, resumed and reset without replaying old alerts', () => {
  const original=T.action(T.action(T.create('a','Repeat'),'duration',0,10000),'start',1000);
  const paused=T.action(original,'pause',12000,undefined,true);
  assert.equal(paused.value,9000);assert.equal(paused.status,'paused');assert.equal(paused.alertUntil,0);
  assert.equal(T.advance(paused,100000,true),paused);
  const resumed=T.action(paused,'start',100000,undefined,true);
  assert.equal(T.advance(resumed,109000,true).value,10000);
  const reset=T.action(resumed,'reset',101000,undefined,true);
  assert.equal(reset.value,10000);assert.equal(reset.status,'idle');assert.equal(reset.alertUntil,0);
  const stopwatch=T.action(original,'mode',12000,'stopwatch',true);
  assert.equal(T.advance(T.action(stopwatch,'start',20000),100000,true).mode,'stopwatch');
  const zero={...original,duration:0,value:0};assert.equal(T.advance(zero,12000,true).status,'finished');
});

test('restoring automatic timers keeps their cycle position and forces Alert mode', () => {
  const original=T.action(T.action(T.create('timer-1','Repeat'),'duration',0,10000),'start',1000);
  const restored=T.restore([original],34000,true)[0];
  assert.equal(restored.status,'running');assert.equal(restored.alarmMode,'alert');
  assert.equal(T.valueAt(restored,34000),7000);assert.equal(restored.alertUntil,36000);
  assert.equal(T.restore([],0,true)[0].alarmMode,'alert');
});

test('display defaults hide milliseconds and ignore the retired animation setting', () => {
  const fs=require('node:fs'),vm=require('node:vm');
  const source=fs.readFileSync(require.resolve('../classroom-timer.jsx'),'utf8');
  const loader=source.slice(source.indexOf('function loadTimers()'),source.indexOf('\nfunction SmallGlyph'));
  const sandbox={CT:T,window:{MLH:{profileInitial:(key,initial)=>initial}},localStorage:{getItem(){return JSON.stringify({options:{animation:false}});}}};
  const defaults=source.slice(source.indexOf('const STORAGE'),source.indexOf('const ALARM_VOLUME'));
  vm.runInNewContext(`${defaults}${loader};this.loaded=loadTimers();`,sandbox);
  assert.equal(sandbox.loaded.options.milliseconds,false);assert.equal(sandbox.loaded.options.autoRestart,false);
  assert.equal('animation' in sandbox.loaded.options,false);
});
test('countdown rounding avoids early zero and longer durations use total minutes', () => {
  assert.equal(T.format(1,false,true),'00:01');
  assert.equal(T.format(0,false,true),'00:00');
  assert.equal(T.format(61234,true),'01:01.2');
  assert.equal(T.format(3661234,true),'61:01.2');
  assert.equal(T.format(3599999,false,true),'60:00');
  assert.equal(T.format(T.MAX_DURATION,false),'5999:59');
  assert.equal(T.format(61999,true),'01:01.9');
  assert.equal(T.format(0,true),'00:00.0');
  assert.equal(T.action(T.create('a','Timer'),'duration',0,Infinity).duration,T.MAX_DURATION);
});

test('page uses local precompiled dependencies and cache-busted timer assets', () => {
  const fs=require('node:fs');
  const page=fs.readFileSync(require.resolve('../classroomtimer.html'),'utf8');
  assert.doesNotMatch(page,/https?:\/\//);
  assert.doesNotMatch(page,/text\/babel|@babel\/standalone/);
  assert.match(page,/vendor\/react\/react\.production\.min\.js\?v=18\.2\.0/);
  assert.doesNotMatch(page,/tailwind[^"']*\.js/);
  assert.match(page,/vendor\/tailwind\/site\.css\?v=[^\x22]+/);
  assert.ok(page.includes("classroom-timer-runtime.js?v="+require("node:crypto").createHash("sha256").update(fs.readFileSync("classroom-timer-runtime.js")).digest("hex").slice(0,12)));
  for(const asset of ['classroom-timer-core.js','styles/classroom-timer.css']){
    const version=require('node:crypto').createHash('sha256').update(fs.readFileSync(asset)).digest('hex').slice(0,12);
    assert.ok(page.includes(asset+'?v='+version));
  }
});

test('the supplied PNG is used inside the standard Hub app-icon tile', () => {
  const fs=require('node:fs');
  const page=fs.readFileSync(require.resolve('../classroomtimer.html'),'utf8');
  const source=fs.readFileSync(require.resolve('../classroom-timer.jsx'),'utf8');
  const home=fs.readFileSync(require.resolve('../index.html'),'utf8');
  const icon=fs.readFileSync(require.resolve('../app-icons/classroom-timer-icon.png'));
  const tile=fs.readFileSync(require.resolve('../app-icons/classroom-timer-icon.svg'),'utf8');
  assert.deepEqual([...icon.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  assert.match(tile,/<rect x="6" y="6" width="116" height="116" rx="28" fill="#fff" stroke="#e5e7eb" stroke-width="1\.5"\/>/);
  assert.match(tile,/<image x="25" y="25" width="78" height="78"[^>]+data:image\/png;base64,/);
  assert.match(page,/type="image\/svg\+xml"[^>]+classroom-timer-icon\.svg\?v=20261102-app-tile/);
  assert.match(source,/icon="\.\/app-icons\/classroom-timer-icon\.svg\?v=20261102-app-tile"/);
  assert.match(home,/"Classroom Timer": "app-icons\/classroom-timer-icon\.svg\?v=20261102-app-tile"/);
});

test('rendered controls expose completion and menu accessibility state', () => {
  const fs=require('node:fs');
  const source=fs.readFileSync(require.resolve('../classroom-timer.jsx'),'utf8');
  assert.match(source,/role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(source,/finished and restarted/);
  assert.match(source,/aria-controls=\{alarmMenuId\}/);
  assert.match(source,/expanded=\{customise\} ariaControls="classroom-timer-customise-menu"/);
});

test('foreground animation and throttled-frame fallback do not both update running timers', () => {
  const fs=require('node:fs');
  const source=fs.readFileSync(require.resolve('../classroom-timer.jsx'),'utf8');
  assert.match(source,/Date\.now\(\)-lastAnimationRef\.current>250/);
  assert.match(source,/lastAnimationRef\.current=Date\.now\(\);tick\(\)/);
  assert.match(source,/requestAnimationFrame\(draw\)/);
});
