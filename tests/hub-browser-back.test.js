const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

const loader = fs.readFileSync(require.resolve("../desktop-layout.js"), "utf8");
const site = "https://example.test/hub/";

function browser(entries, currentIndex, storage = new Map()) {
  const listeners = new Map();
  const traversals = [];
  const scheduled = [];
  const navigation = {
    currentEntry: entries[currentIndex],
    entries: () => entries,
    addEventListener: (event, callback) => listeners.set(event, callback),
    traverseTo(key) {
      traversals.push(key);
      return { committed: Promise.resolve(), finished: Promise.resolve() };
    },
  };
  const window = { navigation, addEventListener: navigation.addEventListener };
  window.top = window;
  vm.runInNewContext(loader, {
    window,
    document: {
      querySelector: () => null,
      documentElement: { style: { setProperty() {} } },
      currentScript: { src: site + "desktop-layout.js" },
    },
    history: window.history = { back: () => traversals.push(-1), go: steps => traversals.push(steps) },
    location: { replace: url => traversals.push(url) },
    sessionStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key),
    },
    URL,
    setTimeout: callback => scheduled.push(callback),
  });
  return {
    history: window.history,
    traversals,
    activate(index, from) {
      navigation.currentEntry = entries[index];
      navigation.activation = { navigationType: "traverse", from: entries[from] };
      listeners.get("pageshow")();
      scheduled.splice(0).forEach(run => run());
    },
    changeEntry(index, from) {
      navigation.currentEntry = entries[index];
      listeners.get("currententrychange")({ navigationType: "traverse", from: { ...entries[from], sameDocument: true } });
      scheduled.splice(0).forEach(run => run());
    },
  };
}

const entry = (path, index) => ({ url: site + path, key: path, index });
const entries = [
  entry("?section=listening", 0),
  entry("music-dictionary/musicdictionary.html", 1),
  entry("music-dictionary/musicdictionaryconcept.html?literacy=crotchet", 2),
];

test("browser Back returns to the existing homepage from both kinds of Hub navigation", () => {
  const crossDocument = browser(entries, 1);
  crossDocument.activate(1, 2);
  assert.deepEqual(crossDocument.traversals, [entries[0].key]);

  const sameDocument = browser(entries, 2);
  sameDocument.changeEntry(1, 2);
  assert.deepEqual(sameDocument.traversals, [entries[0].key]);
});

test("an app Back call bypasses the homepage once, including across documents", () => {
  const storage = new Map();
  const detail = browser(entries, 2, storage);
  detail.history.back();
  assert.deepEqual(detail.traversals, [-1]);

  const list = browser(entries, 1, storage);
  list.activate(1, 2);
  assert.deepEqual(list.traversals, []);
  list.activate(1, 2);
  assert.deepEqual(list.traversals, [entries[0].key]);
});

test("browser Forward and Back from the homepage keep their normal destinations", () => {
  const forward = browser(entries, 1);
  forward.activate(2, 1);
  assert.deepEqual(forward.traversals, []);

  const homeAfterApp = [entry("mycollections.html", 0), entry("index.html?section=games", 1)];
  const leavingHome = browser(homeAfterApp, 0);
  leavingHome.activate(0, 1);
  assert.deepEqual(leavingHome.traversals, []);
});

test("Back within a directly opened app can fall back to the Hub index", () => {
  const directLink = [entry("mycollections.html", 0), entry("mycollections.html?hubCollection=tempo", 1)];
  const direct = browser(directLink, 1);
  direct.changeEntry(0, 1);
  assert.deepEqual(direct.traversals, [site + "index.html"]);
});
