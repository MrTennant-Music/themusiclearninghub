const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const playbackSources = [
  "accidentals.html",
  "articulationmarkings.html",
  "auralrecognition.html",
  "cadences.html",
  "classroom-timer.jsx",
  "chord-generator.jsx",
  "chords.html",
  "composition-accompaniment.jsx",
  "composition-imported-midi.jsx",
  "composition-performance-plan.jsx",
  "composition-sections.jsx",
  "digital-question-papers/exam-audio.js",
  "dynamics.html",
  "followthescore.html",
  "hub-dialed.jsx",
  "melodicdictation.html",
  "music-games/session.jsx",
  "music-games/runtime/session.js",
  "practicequestions.html",
  "readingrhythms.html",
  "repeatsigns.html",
  "rhythmicdictation.html",
  "tempo.html",
  "whowantstobemillionaire/millionaire.js",
  "whowantstobemillionaire/millionaire-creator.js",
  "whowantstobemillionaire/millionaire.compiled.js",
];

test("playback controls use local SVG masks instead of platform font glyphs", () => {
  const forbidden = /[▶■Ⅱ⏵►]|\\u25b6|&#(?:9654|x25b6);/i;
  for (const file of playbackSources) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    assert.doesNotMatch(source, forbidden, `${file} contains a font-rendered playback glyph`);
  }
});

test("shared playback icon classes provide play, pause and stop artwork", () => {
  const css = fs.readFileSync(path.join(root, "styles/hub-ui.css"), "utf8");
  assert.match(css, /--hub-playback-size, 22px/);
  for (const state of ["play", "pause", "stop"]) {
    assert.match(css, new RegExp(`\\.hub-playback-glyph\\.is-${state}`));
    assert.ok(fs.existsSync(path.join(root, `ui-icons/${state}.svg`)));
  }
});

test("play controls do not bypass the shared icon treatment", () => {
  for (const file of playbackSources.filter(file => !file.endsWith(".compiled.js") && !file.includes("runtime"))) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    assert.doesNotMatch(source, /<img[^>]+(?:play|pause|stop)\.svg/i, `${file} bypasses the shared playback class`);
  }
});

test("Digital Question Papers switches the SVG-mask state when audio pauses", () => {
  const source = fs.readFileSync(path.join(root, "digital-question-papers/exam-audio.js"), "utf8");
  assert.match(source, /classList\.toggle\("is-play", !isPlaying\)/);
  assert.match(source, /classList\.toggle\("is-pause", isPlaying\)/);
});
