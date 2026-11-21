"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

test("Interactive Piano uses only local prebuilt browser dependencies", () => {
  const html = fs.readFileSync("interactivepiano.html", "utf8");
  assert.doesNotMatch(html, /<script[^>]+src=["']https?:\/\//i);
  assert.doesNotMatch(html, /text\/babel|@babel\/standalone|cdn\.tailwindcss\.com/i);
  assert.match(html, /vendor\/tailwind\/site\.css/);
  assert.match(html, /vendor\/react\/react\.production\.min\.js/);
  assert.match(html, /vendor\/react\/react-dom\.production\.min\.js/);
  assert.match(html, /popup-piano-runtime\.js/);
});

test("Interactive Piano settings and controls retain their intended behaviour", () => {
  const source = fs.readFileSync("popup-piano.jsx", "utf8");
  const styles = fs.readFileSync("styles/hub-tools.css", "utf8");
  assert.match(source, /labels:initial\.labels!==false/);
  assert.match(source, /shortcuts:initial\.shortcuts===true/);
  assert.match(source, /octaves:Math\.min\(2,Math\.max\(1/);
  assert.match(source, /octaves:2,labels:true,shortcuts:false/);
  assert.doesNotMatch(source, /<option value="3">3 octaves<\/option>/);
  assert.match(source, /aria-label="Octaves displayed" value=\{config\.octaves\}/);
  assert.match(source, /length:config\.octaves\*12\+1/);
  assert.match(source, /nameOf\(end\)/);
  assert.match(source, /if\(!configRef\.current\.shortcuts\)return/);
  assert.match(source, /if\(id\.startsWith\('key:'\)\)release\(id\)/);
  assert.match(source, /config\.labels\?NAMES\[midi%12\]/);
  assert.doesNotMatch(source, /config\.labels\?nameOf\(midi\)/);
  assert.match(source, /expanded=\{open\} ariaControls="interactive-piano-customise-menu"/);
  assert.match(source, /id="interactive-piano-customise-menu"/);
  assert.match(source, /onClick=\{e=>\{if\(e\.detail!==0\)return/);
  assert.match(source, /role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(source, /\[\.\.\.active\]\.sort/);
  assert.doesNotMatch(source, /active\.sort/);
  assert.match(styles, /\.piano-key>span\{font-size:17px/);
});

test("the full 88-key sample map points to valid local Ogg files", () => {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync("audio/piano/salamander-browser-map.js", "utf8"), context);
  const notes = context.window.MLH_PIANO_SAMPLE_MAP.notes;
  assert.deepEqual(Object.keys(notes).map(Number), Array.from({ length: 88 }, (_, index) => index + 21));
  const samples = new Set(Object.values(notes).flat().map(layer => layer.sample));
  assert.equal(samples.size, 90);
  for (const sample of samples) {
    const path = `audio/piano/${sample}`;
    assert.equal(fs.readFileSync(path, { encoding: "utf8", flag: "r" }).slice(0, 4), "OggS", path);
  }
});

test("a quick first tap still starts and releases its note after loading", async () => {
  let resolveFetch;
  let starts = 0;
  let stops = 0;
  const gainParam = () => ({
    value: 0,
    setValueAtTime() {},
    exponentialRampToValueAtTime() {},
    cancelScheduledValues() {},
    setTargetAtTime() {},
  });
  class FakeAudioContext {
    constructor() { this.currentTime = 0; this.destination = {}; }
    resume() { return Promise.resolve(); }
    createGain() { return { gain: gainParam(), connect() {}, disconnect() {} }; }
    createBufferSource() { return { playbackRate: { value: 1 }, connect() {}, start() { starts += 1; }, stop() { stops += 1; } }; }
    decodeAudioData() { return Promise.resolve({ decoded: true }); }
    close() { return Promise.resolve(); }
  }
  const context = {
    window: {
      AudioContext: FakeAudioContext,
      MLH_PIANO_SAMPLE_MAP: { notes: { 60: [{ sample: "C4v12.ogg", loVel: 89, hiVel: 96, rate: 1 }] } },
    },
    fetch() {
      return new Promise(resolve => {
        resolveFetch = () => resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) });
      });
    },
    setTimeout(callback) { callback(); return 1; },
    clearTimeout() {},
  };
  vm.runInNewContext(fs.readFileSync("popup-piano-audio.js", "utf8"), context);
  const piano = new context.window.PopupPianoAudio();
  const pressing = piano.press("quick-tap", 60);
  piano.release("quick-tap");
  while (!resolveFetch) await Promise.resolve();
  resolveFetch();
  await pressing;
  assert.equal(starts, 1);
  assert.equal(stops, 1);
  assert.equal(piano.voices.size, 0);
});

test("a failed sample request can be retried", async () => {
  let fetches = 0;
  class FakeAudioContext {
    constructor() { this.destination = {}; }
    resume() { return Promise.resolve(); }
    createGain() { return { gain: { value: 0 }, connect() {} }; }
    decodeAudioData() { return Promise.resolve({}); }
  }
  const context = {
    window: {
      AudioContext: FakeAudioContext,
      MLH_PIANO_SAMPLE_MAP: { notes: { 60: [{ sample: "C4v12.ogg", loVel: 89, hiVel: 96 }] } },
    },
    fetch() { fetches += 1; return Promise.reject(new Error("offline")); },
    setTimeout,
    clearTimeout,
  };
  vm.runInNewContext(fs.readFileSync("popup-piano-audio.js", "utf8"), context);
  const piano = new context.window.PopupPianoAudio();
  await piano.unlock();
  assert.equal(await piano.load(60), null);
  assert.equal(await piano.load(60), null);
  assert.equal(fetches, 2);
});

function storedPianoSettings(raw, unavailable=false) {
  const source=fs.readFileSync("popup-piano.jsx","utf8");
  const context={window:{localStorage:{getItem(){if(unavailable)throw new Error("unavailable");return raw;}}}};
  vm.runInNewContext(source.slice(source.indexOf("const PIANO_SETTINGS_KEY="),source.indexOf("function App(){")),context);
  return JSON.parse(JSON.stringify(context.readPianoSettings()));
}
test("piano restores saved controls, including false toggles",()=>{
  const saved={version:1,config:{octave:4,octaves:1,labels:false,shortcuts:true},sustain:true,guide:true};
  assert.deepEqual(storedPianoSettings(JSON.stringify(saved)),{config:saved.config,sustain:true,guide:true});
});
test("invalid or unavailable piano storage falls back safely",()=>{
  const fallback={config:{},sustain:false,guide:false};
  for(const raw of [null,"bad json","null",'{"version":2}'])assert.deepEqual(storedPianoSettings(raw),fallback);
  assert.deepEqual(storedPianoSettings(null,true),fallback);
  assert.deepEqual(storedPianoSettings(JSON.stringify({version:1,config:{octave:"4",octaves:null,labels:"false",shortcuts:false,extra:1},sustain:"true",guide:true})),{config:{shortcuts:false},sustain:false,guide:true});
});
