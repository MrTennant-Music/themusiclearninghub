const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function harness(scale=1){
 const handlers={},windowHandlers={},attributes={};let now=0;
 vm.runInNewContext(fs.readFileSync('shared/hub-touch.js','utf8'),{Math,Set,Date:{now:()=>now},window:{visualViewport:{scale},addEventListener:(n,f)=>windowHandlers[n]=f},document:{documentElement:{setAttribute:(key,value)=>attributes[key]=value},addEventListener:(n,f,options)=>handlers[n]={f,options}}});
 const button={closest(){return this;}},child={closest:()=>button};
 function fire(type,extra={}){const e={type,pointerType:'touch',pointerId:1,clientX:0,clientY:0,target:button,detail:1,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...extra};handlers[type].f(e);return e;}
 return {fire,button,child,handlers,attributes,blur:()=>windowHandlers.blur(),time:n=>now=n};
}
test('a tap activates normally and touch listeners never prevent native scrolling',()=>{
 const h=harness();assert.equal(h.fire('pointerdown').prevented,undefined);h.fire('pointerup');assert.equal(h.fire('click').stopped,undefined);
 for(const name of ['pointerdown','pointermove','pointerup','pointercancel','scroll'])assert.equal(h.handlers[name].options.passive,true);
});
test('a swipe suppresses the following activation, including a child icon in the same button',()=>{
 const h=harness();h.fire('pointerdown',{target:h.child});h.fire('pointermove',{clientY:30});h.fire('pointerup',{clientY:30});
 const click=h.fire('click');assert.equal(click.prevented,true);assert.equal(click.stopped,true);
});
test('cancelled gestures and real scrolling do not activate a control',()=>{
 for(const signal of ['pointercancel','scroll']){const h=harness();h.fire('pointerdown');h.fire(signal);h.fire('pointerup');assert.equal(h.fire('click').stopped,true);}
});
test('small finger movement is tolerated before a gesture counts as a swipe',()=>{
 const h=harness();h.fire('pointerdown');h.fire('pointerup',{clientY:6});assert.equal(h.fire('click').stopped,undefined);
 h.fire('pointerdown');h.fire('pointerup',{clientY:25});assert.equal(h.fire('click').stopped,true);
});
test('keyboard, mouse, unrelated controls and the next deliberate tap still work after a swipe',()=>{
 const h=harness();h.fire('pointerdown');h.fire('pointerup',{clientY:30});
 assert.equal(h.fire('click',{detail:0,pointerType:''}).stopped,undefined);
 assert.equal(h.fire('click',{target:{closest:()=>null}}).stopped,undefined);
 h.fire('pointerdown');h.fire('pointerup');assert.equal(h.fire('click').stopped,undefined);
 h.fire('pointerdown',{pointerType:'mouse'});assert.equal(h.fire('click',{pointerType:'mouse'}).stopped,undefined);
});
test('multi-touch gestures are not mistaken for a tap and suppression expires',()=>{
 const h=harness();h.fire('pointerdown');h.fire('pointerdown',{pointerId:2});h.fire('pointerup',{pointerId:2});h.fire('pointerup');assert.equal(h.fire('click').stopped,true);
 h.time(701);assert.equal(h.fire('click').stopped,undefined);h.blur();assert.equal(h.fire('click').stopped,undefined);
});
test('every Hub page loads the shared gesture handler with its current cache token',()=>{
 let checked=0;const hash=require('node:crypto').createHash('sha256').update(fs.readFileSync('shared/hub-touch.js')).digest('hex').slice(0,12);
 function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  if(e.name.startsWith('.')||['node_modules','vendor','dist','tests','fixtures','audit','maintenance'].includes(e.name))continue;
  const file=path.join(dir,e.name);if(e.isDirectory()){walk(file);continue;}if(!file.endsWith('.html'))continue;
  const html=fs.readFileSync(file,'utf8');if(file!=='index.html'&&!html.includes('desktop-layout.css'))continue;
  const src=html.match(/<script[^>]*src="([^"]*shared\/hub-touch.js[^\"]*)"/)?.[1];
  assert.ok(src,file);
  const url=new URL(file,'https://example.test/'),base=new URL(html.match(/<base[^>]*href="([^"]+)"/)?.[1]||'./',url);
  assert.equal(new URL(src,base).pathname,'/shared/hub-touch.js',file);assert.ok(src.endsWith('?v='+hash));checked++;
 }}walk('.');assert.ok(checked>=56);
});

test('inline predictions are disabled page-wide without changing autocorrection',()=>{
 const h=harness();assert.deepEqual(h.attributes,{writingsuggestions:'false'});
});

test('native double-tap on page content is suppressed without changing taps on controls or editing fields', () => {
 const point = { clientX: 40, clientY: 60 };
 const staticContent = { closest: () => null };
 for (const [control, blocked] of [[staticContent, true], [{ closest: selector => selector.includes('input') ? {} : null }, false]]) {
  const h = harness();
  const start = { target: control, touches: [point], ...point };
  h.fire('pointerdown', start);
  assert.equal(h.fire('touchstart', start).prevented, undefined);
  h.time(40);
  h.fire('pointerup', start);
  assert.equal(h.fire('touchend', { ...start, touches: [], changedTouches: [point] }).prevented, undefined);
  h.time(120);
  assert.equal(Boolean(h.fire('touchstart', start).prevented), blocked);
 }
});

test('playable surfaces cancel native touch defaults while an ordinary two-finger gesture remains free', () => {
 const h = harness();
 const playable = { closest: selector => selector.includes('data-mlh-pointer-surface') ? {} : null };
 for (const type of ['touchstart', 'touchend', 'contextmenu']) {
  assert.equal(h.fire(type, { target: playable }).prevented, true);
 }
 for (const type of ['touchstart', 'touchend']) assert.equal(h.handlers[type].options.passive, false);
 const staticContent = { closest: () => null };
 const points = [{ clientX: 0, clientY: 0 }, { clientX: 30, clientY: 0 }];
 assert.equal(h.fire('touchstart', { target: staticContent, touches: points }).prevented, undefined);
});
