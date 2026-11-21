"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const source = fs.readFileSync("index.html", "utf8");

test("Ear Training and Family Fortunes are playable at every level", () => {
  assert.match(source, /href: "auralrecognition\.html", title: "Ear Training", desc: "Piano-led ear training for melody, harmony, rhythm and more\.", keywords: "ear training aural recognition listening chords scales tonality harmonic devices", audio: true, disabled: \[\]/);
  assert.match(source, /title: "Family Fortunes", desc: "Name the most popular musical answers in this game-show challenge\.", keywords: "family fortunes national 3 national 4 national 5 higher advanced higher game show quiz popular answers teams music concepts", audio: true, disabled: \[\]/);
  assert.match(source, /"Ear Training": "app-icons\/aural-recognition-icon\.svg\?v=20261102-ear"/);
  assert.match(source, /"Family Fortunes": "app-icons\/familyfortunes-icon\.svg"/);
  assert.match(source, /app\.comingSoon \? 'disabled aria-disabled="true"'/);
  assert.match(source, /Coming soon/);
  assert.equal(fs.existsSync("auralrecognition.html"), true);
  assert.equal(fs.existsSync("familyfortunes/familyfortunes.html"), true);
  assert.doesNotMatch(source, /auralRecognitionExercises|exercise-choice|data-exercise=/);
  assert.match(source, /window\.location\.href = `\$\{card\.dataset\.href\}\?level=\$\{encodeURIComponent\(levelChoice\.dataset\.level\)\}`/);
});

test("the Ear Training icon uses the shared app-icon frame", () => {
  const icon = fs.readFileSync("app-icons\/aural-recognition-icon.svg", "utf8");
  assert.match(icon, /viewBox="0 0 128 128"/);
  assert.match(icon, /stroke="#e5e7eb"/);
  assert.match(icon, /fill="#020617"/);
  assert.match(icon, /translate\(20 23\) scale\(2\.6\)/);
});

test("activity cards do not shrink or bounce when pressed", () => {
  assert.match(source, /button\.card-main:not\(\[aria-disabled="true"\]\):active \{\s*transform: none;\s*filter: none;\s*\}/);
  assert.match(source, /\.card-main \{\s*display: contents;/);
  assert.match(source, /\.arrow \{[\s\S]*?transform: translateY\(-50%\) rotate\(0deg\);[\s\S]*?transition: transform \.18s ease, color \.18s ease;/);
  assert.match(source, /\.card\.open \.arrow \{ transform: translateY\(-50%\) rotate\(90deg\); \}/);
});

test("Digital Question Papers offers every available Advanced Higher paper", () => {
  const registry = require("../digital-question-papers/paper-registry.js");
  assert.deepEqual(Object.values(registry).filter(paper => paper.levelCode === "AH").map(paper => paper.year), [2016, 2017, 2018, 2019, 2022, 2023, 2024, 2025, 2026]);
  assert.match(source, /title: "Digital Question Papers"[\s\S]*?disabled: \["N3", "N4"\]/);
  assert.match(source, /href: "digital-question-papers\/digitalquestionpapers\.html"/);
  assert.match(source, /window\.location\.href = `\$\{card\.dataset\.href\}\?level=\$\{encodeURIComponent\(levelChoice\.dataset\.level\)\}`/);
  assert.doesNotMatch(source, /digitalPaperYears|year-coming-soon/, "Year selection belongs to the paper chooser rather than a retired homepage picker");
});
