const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const crypto = require("node:crypto");

const shared = fs.readFileSync("shared/hub-audio.js", "utf8");
const timedExcerptPlayers = [
  "accidentals.html",
  "articulationmarkings.html",
  "auralrecognition.html",
  "cadences.html",
  "chords.html",
  "dynamics.html",
  "followthescore.html",
  "melodicdictation.html",
  "practicequestions.html",
  "readingrhythms.html",
  "repeatsigns.html",
  "rhythmicdictation.html",
  "tempo.html",
];

test("shared piano voices decay before their audio source is stopped", () => {
  assert.match(shared,/NATURAL_PIANO_RELEASE_SECONDS = 0\.45/);
  assert.match(shared,/NATURAL_PLAYBACK_TAIL_MS = 650/);
  assert.match(shared,/duration \+ NATURAL_PIANO_RELEASE_SECONDS/);
  assert.match(shared,/duration \+ NATURAL_PIANO_RELEASE_SECONDS \+ 0\.05/);
  assert.match(shared,/MLH\.naturalPlaybackTailMs = naturalPlaybackTailMs/);
});

test("timed Hub excerpt players retain the shared natural-release tail", () => {
  for (const file of timedExcerptPlayers) {
    const source = fs.readFileSync(file,"utf8");
    assert.match(source,/hub-audio\.js/,`${file} loads the shared audio engine`);
    assert.match(source,/naturalPlaybackTailMs\?\.\(\) \?\? 650/,`${file} uses the shared completion tail with a cache-safe fallback`);
  }
});

test("every Hub page requests the current natural-decay audio-engine content hash", () => {
  const expectedVersion = crypto.createHash("sha256").update(shared).digest("hex").slice(0, 12);
  const pages = fs.readdirSync(".").filter(file=>file.endsWith(".html"));
  pages.push("whowantstobemillionaire/whowantstobeamillionaire.html");
  for(const file of pages) {
    const source=fs.readFileSync(file,"utf8");
    if(!/hub-audio\.js/.test(source))continue;
    const versions = [...source.matchAll(/hub-audio\.js\?v=([^"\s]+)/g)].map((match) => match[1]);
    assert.ok(versions.length, `${file} versions the shared audio engine`);
    for (const version of versions) {
      assert.equal(version, expectedVersion, `${file} requests the exact current audio engine`);
    }
  }
});
