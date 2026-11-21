'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const script=fs.readFileSync('desktop-layout.js','utf8');
function canvas(width){const styles={},events={};const window={innerWidth:width,addEventListener:(name,handler)=>events[name]=handler};const viewport={setAttribute:(name,value)=>{viewport[name]=value;}};const document={querySelector:()=>viewport,documentElement:{style:{setProperty:(name,value)=>styles[name]=value}}};vm.runInNewContext(script,{window,document});return{styles,events,window,viewport};}
test('narrow desktop windows fit the complete 1280px canvas without horizontal drift',()=>{
 for(const width of [390,768,900,1279]){const c=canvas(width);assert.equal(Number(c.styles['--mlh-desktop-layout-scale'])*1280,width);assert.equal(c.styles['--mlh-layout-root-min-width'],'0px');assert.equal(c.viewport.content,'width=1280');}
});
test('mobile fixed viewports do not receive a second scale and wider desktops stay at 100%',()=>{
 for(const width of [1280,1440,1920]){const c=canvas(width);assert.equal(c.styles['--mlh-desktop-layout-scale'],'1');assert.equal(c.styles['--mlh-layout-root-min-width'],'1280px');}
});
test('resizing restores full scale without changing the mobile viewport policy',()=>{
 const c=canvas(390);c.window.innerWidth=1440;c.events.resize();assert.equal(c.styles['--mlh-desktop-layout-scale'],'1');c.window.innerWidth=768;c.events.resize();assert.equal(c.styles['--mlh-desktop-layout-scale'],'0.6');assert.equal(c.viewport.content,'width=1280');
});

const viewportScript = fs.readFileSync('shared/hub-layout-viewport.js', 'utf8');
function trackedCanvas(width, storage = new Map()) {
 const styles = new Map();
 const attributes = new Set();
 const listeners = [];
 const window = {
  innerWidth: width, innerHeight: 800, outerWidth: width, outerHeight: 900, devicePixelRatio: 2,
  sessionStorage: {
   getItem: key => storage.get(key) ?? null,
   setItem: (key, value) => storage.set(key, value),
   removeItem: key => storage.delete(key),
  },
  addEventListener(name, handler) { if (name === 'resize') listeners.push(handler); },
 };
 const document = { querySelector: () => null, documentElement: {
  style: { setProperty: (key, value) => styles.set(key, value) },
  toggleAttribute: (key, present) => present ? attributes.add(key) : attributes.delete(key),
 } };
 function start(dimensions = {}) {
  Object.assign(window, dimensions);
  vm.runInNewContext(viewportScript + '\n' + script, { window, document });
 }
 function resize(dimensions) {
  Object.assign(window, dimensions);
  listeners.forEach(handler => handler());
 }
 return { window, styles, attributes, start, resize };
}

test('page zoom preserves the desktop fit, including after navigation and a real window resize', () => {
 const storage = new Map();
 const first = trackedCanvas(1120, storage);
 first.start();
 first.resize({ innerWidth: 896, innerHeight: 640, devicePixelRatio: 2.5 });
 assert.equal(first.window.MLHLayoutViewport.width, 1120);
 assert.equal(first.styles.get('--mlh-desktop-layout-scale'), '0.875');
 assert.ok(first.attributes.has('data-mlh-page-zoomed-in'));
 const next = trackedCanvas(1120, storage);
 next.start({ innerWidth: 896, innerHeight: 640, devicePixelRatio: 2.5 });
 assert.equal(next.styles.get('--mlh-desktop-layout-scale'), '0.875');
 next.resize({ innerWidth: 768, outerWidth: 960 });
 assert.equal(next.styles.get('--mlh-desktop-layout-scale'), '0.75');
 next.resize({ innerWidth: 960, innerHeight: 800, devicePixelRatio: 2 });
 assert.equal(next.window.MLHLayoutViewport.zoom, 1);
 assert.equal(next.styles.get('--mlh-desktop-layout-scale'), '0.75');
 assert.ok(!next.attributes.has('data-mlh-page-zoomed-in'));
});

test('Safari-style page zoom preserves the layout when device-pixel ratio stays constant', () => {
 const canvas = trackedCanvas(1440);
 canvas.start();
 canvas.resize({ innerWidth: 1152, innerHeight: 640 });
 assert.equal(canvas.window.MLHLayoutViewport.width, 1440);
 assert.equal(canvas.styles.get('--mlh-layout-canvas-min-width'), '1440px');
 assert.equal(canvas.styles.get('--mlh-desktop-layout-scale'), '1');
});

test('pinching the visual viewport, rotating the device and opening a sidebar keep normal fitting', () => {
 const canvas = trackedCanvas(1280);
 canvas.start({ outerWidth: 1024 });
 canvas.resize({ visualViewport: { width: 640, scale: 2 } });
 assert.equal(canvas.styles.get('--mlh-desktop-layout-scale'), '1');
 canvas.resize({ outerWidth: 768, outerHeight: 1200, innerHeight: 1500 });
 assert.equal(canvas.window.MLHLayoutViewport.zoom, 1);
 canvas.resize({ innerWidth: 950 });
 assert.equal(canvas.window.MLHLayoutViewport.zoom, 1);
 assert.equal(canvas.window.MLHLayoutViewport.width, 950);
});
