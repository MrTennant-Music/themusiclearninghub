const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const Babel = require("../vendor/babel/babel.min.js");

const projectRoot = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

function loadRoundBanks() {
  const window = {};
  const context = vm.createContext({ window, console });
  [
    "concept-recall-core.js",
    "concept-recall-data.js",
    "familyfortunes/familyfortunes-data.js",
    "familyfortunes/familyfortunes-national-data.js",
    "familyfortunes/familyfortunes-answer-aliases.js",
  ].forEach((file) => vm.runInContext(read(file), context, { filename: file }));
  return window;
}

test("all Family Fortunes round banks remain structurally valid and unambiguous", () => {
  const window = loadRoundBanks();
  const banks = window.FAMILY_FORTUNES_ROUNDS_BY_LEVEL;
  assert.deepEqual(Object.keys(banks).sort(), ["AH", "H", "N3", "N4", "N5"]);
  Object.entries(banks).forEach(([level, rounds]) => {
    assert.ok(rounds.length >= 3, `${level} needs at least three rounds`);
    const ids = new Set();
    rounds.forEach((round) => {
      assert.ok(round.id && round.label && round.prompt, `${level} has an incomplete round`);
      assert.ok(round.answers.length >= 2 && round.answers.length <= 10, `${round.id} has an invalid answer count`);
      assert.equal(ids.has(round.id), false, `${round.id} is duplicated`);
      ids.add(round.id);
      const variants = new Map();
      round.answers.forEach((answer, answerIndex) => {
        window.FAMILY_FORTUNES_ANSWERS.variantsFor(round, answer).forEach((variant) => {
          const normalized = window.FAMILY_FORTUNES_ANSWERS.normalize(variant);
          if (variants.has(normalized)) assert.equal(variants.get(normalized), answerIndex, `${round.id} has an ambiguous alias: ${variant}`);
          variants.set(normalized, answerIndex);
        });
      });
    });
  });
});

test("playable and newly created rounds enforce four to ten answers", () => {
  const source = read("familyfortunes/familyfortunes.js");
  assert.match(source, /const MIN_ANSWERS_PER_QUESTION = 4/);
  assert.match(source, /answers\.slice\(0, MAX_ANSWERS_PER_QUESTION\)/);
  assert.match(source, /answers\.length >= MIN_ANSWERS_PER_QUESTION/);
  assert.match(source, /Array\(MIN_ANSWERS_PER_QUESTION\)\.fill\(""\)/);
  assert.match(source, /questions\.findIndex[\s\S]*question\.answers\.length < MIN_ANSWERS_PER_QUESTION/);
  assert.match(source, /question\.answers\.length > MIN_ANSWERS_PER_QUESTION/);
});

test("round randomisation defaults on while preserving an explicit choice", () => {
  const source = read("familyfortunes/familyfortunes.js");
  assert.match(source, /typeof stored\?\.randomiseRounds === "boolean" \? stored\.randomiseRounds : true/);
  assert.match(source, /randomiseRounds: true, roundsToPlay: DEFAULT_ROUNDS_TO_PLAY/);
});

test("the round editor omits the Minimum 3 shortcut", () => {
  assert.doesNotMatch(read("familyfortunes/familyfortunes.js"), />Minimum 3</);
});

test("the deployed runtime is rebuilt from the current JSX source", () => {
  const source = read("familyfortunes/familyfortunes.js");
  const expected = `${Babel.transform(source, { comments: false, compact: false, presets: ["react"], sourceMaps: false }).code}\n`;
  assert.equal(read("familyfortunes/familyfortunes.runtime.js"), expected);
  const html = read("familyfortunes/familyfortunes.html");
  assert.match(html, /familyfortunes\.runtime\.js/);
  assert.doesNotMatch(html, /babel\.min\.js|text\/babel/);
});

test("reset invalidates and cancels pending answer feedback", () => {
  const source = read("familyfortunes/familyfortunes.js");
  const resetBody = source.slice(source.indexOf("const resetGame ="), source.indexOf("const moveRound ="));
  assert.match(resetBody, /answerSequenceGenerationRef\.current \+= 1/);
  assert.match(resetBody, /answerSequenceCancelRef\.current\?\.\(\)/);
  assert.match(resetBody, /releaseAudio\(answerSequenceAudioRef\.current\)/);
  assert.match(source, /if \(!sequenceIsCurrent\(\)\) return;/);
});

test("modal and status accessibility contracts remain present", () => {
  const source = read("familyfortunes/familyfortunes.js");
  assert.match(source, /document\.body\.style\.overflow = "hidden"/);
  assert.match(source, /event\.key !== "Tab"/);
  assert.match(source, /sibling\.inert = true/);
  assert.match(source, /role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(source, /aria-label="Sound"[\s\S]*aria-pressed=\{soundEnabled\}/);
  assert.doesNotMatch(source, /ff-stage[^\n]+aria-live=/);
});
