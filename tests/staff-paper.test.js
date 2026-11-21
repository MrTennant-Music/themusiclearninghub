const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Babel = require("@babel/standalone");
const S = require("../staff-paper-core.js");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "staffpapergenerator.html"), "utf8");
const jsx = fs.readFileSync(path.join(root, "staff-paper.jsx"), "utf8");

test("Staff Paper uses local production dependencies and a current prebuilt runtime", () => {
  assert.doesNotMatch(html, /<script[^>]+src=["']https?:\/\//i);
  assert.doesNotMatch(html, /text\/babel|@babel\/standalone|cdn\.tailwindcss\.com/i);
  assert.match(html, /vendor\/tailwind\/site\.css/);
  assert.match(html, /vendor\/react\/react\.production\.min\.js/);
  assert.match(html, /staff-paper-runtime\.js/);
  const compiled = Babel.transform(jsx, { filename: "staff-paper.jsx", presets: ["react"], sourceMaps: false, comments: false, compact: true }).code;
  assert.equal(fs.readFileSync(path.join(root, "staff-paper-runtime.js"), "utf8").trim(), compiled.trim());
});

test("Customise exposes its menu state and preserves counts for each paper type", () => {
  assert.match(jsx, /expanded=\{open\}/);
  assert.match(jsx, /ariaControls="staff-paper-customise-menu"/);
  assert.match(jsx, /id="staff-paper-customise-menu"/);
  let counts = S.typeCounts({ type: "blank", count: 16 });
  let changed = S.switchType({ type: "blank", count: 16 }, "piano", counts);
  assert.equal(changed.config.count, 6);
  changed = S.switchType({ ...changed.config, count: 8 }, "blank", changed.counts);
  assert.equal(changed.config.count, 16);
  changed = S.switchType(changed.config, "blank", changed.counts);
  assert.equal(changed.config.count, 16);
});

test("all supported layouts stay inside the selected page and contain complete systems", () => {
  let checked = 0;
  for (const type of ["blank", "piano"]) for (const format of ["a4", "letter"]) for (const orientation of ["portrait", "landscape"]) {
    for (let count = 4; count <= (type === "piano" ? 8 : 16); count += 1) {
      const data = S.layout({ type, format, orientation, count });
      assert.equal(data.lines.length, count * (type === "piano" ? 11 : 5));
      assert.equal(data.glyphs.length, count * (type === "piano" ? 3 : 0));
      for (const line of data.lines) {
        assert.ok(line.every(Number.isFinite));
        assert.ok(line[0] >= 0 && line[2] <= data.width && line[1] >= 0 && line[3] <= data.height);
      }
      checked += 1;
    }
  }
  assert.equal(checked, 72);
});

test("normalisation clamps invalid settings without losing valid titles", () => {
  assert.deepEqual(S.normalise({ type: "piano", format: "letter", orientation: "landscape", count: 99, title: "Music" }), { type: "piano", format: "letter", orientation: "landscape", count: 8, title: "Music" });
  assert.equal(S.normalise({ type: "blank", count: -4 }).count, 4);
  assert.equal(S.normalise({ title: "x".repeat(100) }).title.length, 80);
});
