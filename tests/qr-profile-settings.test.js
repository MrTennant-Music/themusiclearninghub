"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const Babel = require("@babel/standalone");
const activities = require("./fixtures/qr-profile-activities.json");
const shell = fs.readFileSync("shared/hub-shell.js", "utf8");
const pageNames = fs.readFileSync("shared/hub-page-names.js", "utf8");
function runtime(href, { localStorage, sessionStorage, react } = {}) {
  const window = { location: new URL(href), atob, btoa, localStorage, sessionStorage, dispatchEvent() {} };
  const React = react || {
    useState: initial => [typeof initial === "function" ? initial() : initial, () => {}],
    useRef: current => ({ current }),
  };
  const context = { window, React, URL, URLSearchParams, Uint8Array, TextEncoder, TextDecoder, document: { currentScript: { src: new URL("shared/hub-shell.js", href).href }, addEventListener() {} } };
  vm.runInNewContext(pageNames, context);
  vm.runInNewContext(shell, context);
  return window.MLH;
}

test("Help choices persist per activity and shared links keep their own edits", () => {
  const makeStorage = () => {
    const entries = new Map();
    return { getItem: key => entries.get(key), setItem: (key, value) => entries.set(key, value) };
  };
  const localStorage = makeStorage();
  const sessionStorage = makeStorage();
  const solo = "https://example.test/chords.html?level=N5";

  function open(href, key, fallback) {
    let state;
    let ref;
    const react = {
      useState(initial) {
        state ??= [initial(), next => { state[0] = typeof next === "function" ? next(state[0]) : next; }];
        return state;
      },
      useRef: current => ref ??= { current },
    };
    const app = runtime(href, { localStorage, sessionStorage, react });
    const render = () => app.useProfileState(key, fallback);
    return { value: () => render()[0], toggle() { render()[1](value => !value); render(); } };
  }

  assert.equal(open(solo, "showNoteNames", false).value(), false);
  open(solo, "showNoteNames", false).toggle();
  assert.equal(open(solo, "showNoteNames", false).value(), true);
  assert.equal(open("https://example.test/accidentals.html?level=N5", "showNoteNames", false).value(), false);
  const shared = runtime(solo).profileShareUrl({ showNoteNames: false });
  assert.equal(open(shared, "showNoteNames", true).value(), false);
  open(shared, "showNoteNames", false).toggle();
  assert.equal(open(shared, "showNoteNames", false).value(), true);
  open(solo, "showNoteNames", true).toggle();
  assert.equal(open(solo, "showNoteNames", true).value(), false);
  assert.equal(open(shared, "showNoteNames", false).value(), true);
  open(solo, "enabledOptions", false).toggle();
  assert.equal(open(solo, "enabledOptions", false).value(), false);
});

test("Old Pitched bookmarks and QR codes redirect with their settings and fragment intact", () => {
  const oldPage = "https://example.test/hub/bandle.html#game";
  const oldLink = new URL(runtime(oldPage).profileShareUrl({ gameMode: "endurance" }));
  const redirect = fs.readFileSync("bandle.html", "utf8").match(/<script>([\s\S]*?)<\/script>/)[1];
  let destination;
  vm.runInNewContext(redirect, { location: { search: oldLink.search, hash: oldLink.hash, replace: url => { destination = new URL(url, oldLink); } } });
  assert.equal(destination.pathname, "/hub/pitched.html");
  assert.equal(destination.search, oldLink.search);
  assert.equal(destination.hash, "#game");
  const game = runtime(destination.href);
  assert.equal(game.useProfileState("gameMode", "default")[0], "endurance");
  const newLink = new URL(game.profileShareUrl({ gameMode: "endurance" }));
  assert.equal(newLink.pathname, "/hub/pitched.html");
  assert.equal(JSON.parse(Buffer.from(newLink.searchParams.get("settings"), "base64url")).activity, "pitched.html");
});

test("explicit settings restore before render without opening a menu or using recipient storage", () => {
  const setup = { activeLevel: "AH", showGuide: true, tempo: "slow", rhythms: ["minim", "quaver"], options: { rests: true, sound: false }, label: "Très doux 🎵" };
  const sender = runtime("https://example.test/intervals.html?level=N5&profile=old");
  const link = sender.profileShareUrl(setup);
  assert.equal(new URL(link).searchParams.get("level"), "AH");
  assert.equal(new URL(link).searchParams.has("profile"), false);
  const recipient = runtime(link);
  for (const [key, value] of Object.entries(setup)) {
    assert.deepEqual(JSON.parse(JSON.stringify(recipient.useProfileState(key, value)[0])), value);
  }
  assert.equal(recipient.useProfileState("showGuide", false)[0], true);
  assert.equal(recipient.useProfileState("tempo", () => "fast")[0], "slow");
  const changedLink = recipient.profileShareUrl({ ...setup, showGuide: false });
  assert.equal(runtime(changedLink).useProfileState("showGuide", true)[0], false);
});

test("damaged, wrong-activity and wrong-type settings fall back safely", () => {
  const sender = runtime("https://example.test/intervals.html");
  const link = sender.profileShareUrl({ showGuide: "wrong type", options: { rests: "wrong" } });
  assert.equal(runtime(link).useProfileState("showGuide", false)[0], false);
  assert.deepEqual(runtime(link).useProfileState("options", { rests: true })[0], { rests: true });
  const other = new URL(link); other.pathname = "/chords.html";
  assert.equal(runtime(other.href).useProfileState("showGuide", false)[0], false);
  assert.equal(runtime("https://example.test/chords.html?settings=broken").useProfileState("showGuide", false)[0], false);
});

for (const { file, states, sources = [] } of activities) {
  test(`${file}: every declared shareable setting restores and is included in the QR snapshot`, () => {
    const source = [file, ...sources].map(name => fs.readFileSync(name, "utf8")).join("\n");
    const script = file.endsWith(".html")
      ? [...source.matchAll(/<script type="(?:text\/babel|text\/x-mlh-jsx-source|text\/x-metronome-source|text\/x-name-randomiser-source)"(?![^>]*\b(?:src|data-src)=)[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]).join("\n")
      : source;
    const ast = Babel.packages.parser.parse(script, { plugins: ["jsx"] });
    const hooks = new Set();
    const snapshot = new Set();
    Babel.packages.traverse.default(ast, {
      CallExpression(path) {
        if (["useProfileState", "profileInitial"].includes(path.node.callee.property?.name)) hooks.add(path.node.arguments[0]?.value);
        if (path.node.arguments[0]?.property?.name === "AppHeader") {
          const profile = path.node.arguments[1]?.properties?.find(property => property.key.name === "profileState");
          if (profile) for (const property of profile.value.properties) snapshot.add(property.key.name);
        }
      },
      JSXAttribute(path) {
        if (path.node.name.name !== "profileState") return;
        for (const property of path.node.value.expression.properties) snapshot.add(property.key.name);
        path.traverse({ ReferencedIdentifier(reference) { assert.ok(reference.scope.hasBinding(reference.node.name) || reference.node.name === "window", `Unbound shared state: ${reference.node.name}`); } });
      },
    });
    for (const key of hooks) assert.ok(snapshot.has(key), `Restored setting missing from QR: ${key}`);
    for (const key of states) {
      assert.ok(hooks.has(key), `Missing early restoration: ${key}`);
      assert.ok(snapshot.has(key), `Missing QR setting: ${key}`);
    }
  });
}

test("game and classroom QR profiles exclude pupil rosters and attempt progress", () => {
  for (const file of ["namerandomiser.html", "familyfortunes/familyfortunes.js", "classroom-timer.jsx", "whowantstobemillionaire/millionaire.js"]) {
    const source = fs.readFileSync(file, "utf8");
    const profile = source.match(/profileState=\{\{([^\n]+?)\}\}/)[1];
    assert.doesNotMatch(profile, /teamNames|teamMembers|segments|savedLists|winner|scores|answers|startedAt|anchor/);
  }
  const timer = fs.readFileSync("classroom-timer.jsx", "utf8");
  assert.match(timer, /timerSetup: timers\.map\(\(\{ label, mode, duration, sound, alarmMode \}\)/);
  assert.match(timer, /CT\.create\(`timer-\$\{index \+ 1\}`/);
});

test("timer QR restores labels, durations and alarms as a fresh stopped setup", () => {
  const source = fs.readFileSync("classroom-timer.jsx", "utf8");
  const loader = source.slice(source.indexOf("function loadTimers()"), source.indexOf("\nfunction SmallGlyph"));
  const setup = [{ label: "Rehearsal", mode: "timer", duration: 90000, sound: "bell", alarmMode: "alert" }, { label: "Performance", mode: "stopwatch", duration: 300000, sound: "silent", alarmMode: "continuous" }];
  const context = { CT: require("../classroom-timer-core.js"), DEFAULT_OPTIONS: { milliseconds: false, autoRestart: false }, window: { MLH: { profileInitial: () => setup } } };
  vm.runInNewContext(loader + ";this.result=loadTimers();", context);
  assert.equal(context.result.timers[0].label, "Rehearsal");
  assert.equal(context.result.timers[0].value, 90000);
  assert.equal(context.result.timers[0].sound, "bell");
  assert.equal(context.result.timers[0].alarmMode, "alert");
  assert.equal(context.result.timers[1].mode, "stopwatch");
  assert.equal(context.result.timers[1].value, 0);
  assert.ok(context.result.timers.every(timer => timer.status === "idle" && timer.anchor === null));
});

function loadFunction(file, name, context) {
  const raw = fs.readFileSync(file, 'utf8');
  const source = file.endsWith('.html') ? [...raw.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n') : raw;
  const ast = Babel.packages.parser.parse(source, { plugins: ['jsx'] });
  let code;
  Babel.packages.traverse.default(ast, { FunctionDeclaration(path) { if (path.node.id.name === name) code = source.slice(path.node.start, path.node.end); } });
  assert.ok(code, name);
  vm.runInNewContext(code + `; this.call = ${name};`, context);
  return context.call;
}

test('Ear Training shares current exercise and All Levels without stale address-bar settings', () => {
  const share = loadFunction('auralrecognition.html', 'earTrainingShareUrl', { URL });
  const previous = 'https://example.test/auralrecognition.html?level=N5&exercise=cadence';
  const exercise = new URL(share('AH', 'scales', false, 'ALL', previous));
  assert.equal(exercise.searchParams.get('level'), 'AH');
  assert.equal(exercise.searchParams.get('exercise'), 'scales');
  const chooser = new URL(share('AH', 'scales', true, 'ALL', previous));
  assert.equal(chooser.searchParams.get('level'), 'ALL');
  assert.equal(chooser.searchParams.has('exercise'), false);
  const setup = { level: 'ALL', chooserLevel: 'ALL', activityListOpen: true, activeTopic: 'scales', metronome: false, expandedPassages: { scales: false }, playbackTempo: { id: 'adagio', label: 'Adagio', bpm: 60 }, isolatedPlaybackTempo: { id: 'allegro', label: 'Allegro', bpm: 100 } };
  const link = runtime(chooser.href).profileShareUrl(setup);
  assert.equal(new URL(link).searchParams.get('level'), 'ALL');
  const recipient = runtime(link);
  assert.equal(recipient.profileInitial('metronome', true), false);
  assert.equal(recipient.profileInitial('activityListOpen', false), true);
  assert.equal(recipient.profileInitial('playbackTempo', { id: '', label: '', bpm: 80 }).bpm, 60);
  assert.equal(recipient.profileInitial('isolatedPlaybackTempo', { id: '', label: '', bpm: 80 }).bpm, 100);
});

test('Composition Studio QR links encode the current complete project and sections', () => {
  const share = loadFunction('chord-generator.jsx', 'compositionShareUrl', { URL, URLSearchParams, btoa, unescape, encodeURIComponent, window: {} });
  const project = { title: 'Chanson 🎵', tempo: 86, key: 5, mode: 'minor', metronome: false, loop: false, studioArrangement: { active: 'b', items: [{ id: 'a', project: { tempo: 120 } }, { id: 'b', project: { tempo: 86 } }] } };
  const url = new URL(share(project, 'https://example.test/chordgenerator.html#song=old'));
  assert.deepEqual(JSON.parse(Buffer.from(new URLSearchParams(url.hash.slice(1)).get('song'), 'base64').toString('utf8')), project);
  for (const file of ['chord-generator.jsx', 'composition-sections.jsx', 'composition-imported-midi.jsx']) assert.match(fs.readFileSync(file, 'utf8'), /profileShareUrl=\{compositionShareUrl\(/);
});

test('homepage QR captures the current section and search when opened', () => {
  const image = {};
  const context = { URL, window: { location: new URL('https://example.test/?section=literacy&medals=0') }, activeHomeSection: 'listening', document: { getElementById: () => ({ value: '  rhythm  ' }), querySelector: () => image } };
  loadFunction('index.html', 'refreshHomeShareUrl', context)();
  const url = new URL(new URL(image.src).searchParams.get('data'));
  assert.equal(url.searchParams.get('section'), 'listening');
  assert.equal(url.searchParams.get('q'), 'rhythm');
  assert.equal(url.searchParams.has('medals'), false);
  const source = fs.readFileSync('index.html', 'utf8');
  assert.match(source, /if \(id === "qrOverlay"\) refreshHomeShareUrl\(\)/);
  assert.match(source, /get\("q"\) \|\| ""/);
});

test('compressed composition QR links restore Unicode, all sections and false settings over saved work', () => {
  const pako = require('../vendor/pako/pako.min.js');
  const project = { title: 'Étude 🎵', tempo: 86, key: 5, mode: 'minor', loop: false, metronome: false, studioArrangement: { active: 'b', items: ['a','b'].map(id => ({ id, project: { tempo: 86, notes: Array.from({length:120}, (_,i) => ({midi:60+i%12,beat:i/2,duration:.5})) } })) } };
  const share = loadFunction('chord-generator.jsx', 'compositionShareUrl', { URL, URLSearchParams, btoa, unescape, encodeURIComponent, window: {pako} });
  const link = share(project, 'https://example.test/chordgenerator.html');
  assert(link.length < 2800, 'Repeated notation must compress to a usable QR payload');
  assert(new URLSearchParams(new URL(link).hash.slice(1)).get('song').startsWith('z.'));
  const context = { URLSearchParams, atob, Uint8Array, decodeURIComponent, escape, location: new URL(link), window: { pako, history: { replaceState() {} } }, CG: {asProgression:value=>value}, fresh:()=>({}), STORE:'test', localStorage:{getItem:()=>JSON.stringify({tempo:200,loop:true})} };
  assert.deepEqual(JSON.parse(JSON.stringify(loadFunction('chord-generator.jsx', 'load', context)())), project);
});
