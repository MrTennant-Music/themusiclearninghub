"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const Babel = require("@babel/standalone");
const React = require("react");
const core = require("../concept-recall-core.js");
const data = require("../concept-recall-data.js");
const page = fs.readFileSync("conceptrecall.html", "utf8");
const script = [...page.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]).find(text => text.includes("function App("));
const ast = Babel.packages.parser.parse(script, { plugins: ["jsx"] });
const functions = new Map();
let eligibility;
let standardCategoryEligibility;
Babel.packages.traverse.default(ast, {
  FunctionDeclaration(path) { functions.set(path.node.id.name, script.slice(path.node.start, path.node.end)); },
  VariableDeclarator(path) {
    if (path.node.id.name === "medalEligible") eligibility = script.slice(path.node.init.start, path.node.init.end);
    if (path.node.id.name === "standardGame") standardCategoryEligibility = script.slice(path.node.init.start, path.node.init.end);
  },
});
function load(names, context = {}) {
  vm.createContext(context);
  vm.runInContext(Babel.transform(names.map(name => functions.get(name)).join("\n"), { presets: ["react"] }).code, context);
  return context;
}

test("QR settings round-trip both hints states and categories, overriding recipient preferences", () => {
  const context = load(["conceptRecallShareUrl", "sharedCustomisePreferences", "savedCategoriesAtLevel"], {
    URL, URLSearchParams,
    customisableCategoriesAtLevel: () => ["Dynamics", "Instruments", "National 5 Styles"],
    standardCategoriesAtLevel: () => ["Dynamics", "Instruments"],
  });
  for (const showHints of [true, false]) {
    for (const origin of ["http://127.0.0.1:8765", "https://themusicliteracyhub.netlify.app", "https://themusiclearninghub.netlify.app"]) {
      const categories = ["Dynamics", "National 5 Styles"];
      const url = new URL(context.conceptRecallShareUrl("N5", showHints, categories, origin + "/conceptrecall.html?level=AH&myCollection=old"));
      assert.equal(url.origin, origin);
      assert.equal(url.searchParams.get("level"), "N5");
      assert.equal(url.searchParams.has("myCollection"), false);
      const preferences = { showHints: !showHints, categoriesByLevel: { N5: ["Instruments"], H: ["Harmony"] } };
      const restored = context.sharedCustomisePreferences(preferences, "N5", url.search);
      assert.equal(restored.showHints, showHints);
      assert.deepEqual(Array.from(context.savedCategoriesAtLevel(restored, "N5")), categories);
      assert.deepEqual(restored.categoriesByLevel.H, ["Harmony"]);
      assert.equal(preferences.showHints, !showHints, "Reading links does not mutate stored preferences");
    }
  }
  const saved = { showHints: true, categoriesByLevel: { N5: ["Instruments"] } };
  const invalid = context.sharedCustomisePreferences(saved, "N5", "?hints=oops&categories=not-json");
  assert.equal(invalid.showHints, true);
  assert.deepEqual(invalid.categoriesByLevel, saved.categoriesByLevel);
  const unknown = context.sharedCustomisePreferences(saved, "N5", "?categories=%5B%22unknown%22%5D");
  assert.deepEqual(Array.from(context.savedCategoriesAtLevel(unknown, "N5")), ["Dynamics", "Instruments"]);
});

test("latest correct groups precede other groups, including completed groups and Styles", () => {
  const context = load(["ConceptCategoryTables", "groupRowsByCategory"], {
    React, useMemo: fn => fn(), useState: value => [value, () => {}],
    useRef: value => ({ current: value }), useEffect() {}, useLayoutEffect() {},
    isStylesCategory: category => category === "Styles",
    titleCaseCategory: value => value, CategoryIcon: () => null,
  });
  const rows = [
    { id: "d1", category: "Dynamics", answer: "Forte", hint: "Loud" },
    { id: "d2", category: "Dynamics", answer: "Piano", hint: "Quiet", introducedAt: "N5" },
    { id: "i1", category: "Instruments", answer: "Flute", hint: "Woodwind", introducedAt: "N5" },
    { id: "s1", category: "Styles", answer: "Jazz", hint: "Style" },
  ];
  for (const recent of [["Dynamics"], ["Styles"], ["Instruments", "Dynamics"]]) {
    const tree = context.ConceptCategoryTables({ rows, answeredIds: new Set(["d1", "i1", "s1"]), complete: false, showHints: true, recentAnswerCategories: recent });
    assert.deepEqual(Array.from(tree.props.children.slice(0, recent.length), card => card.key), recent);
  }
});

test("answer recognition fronts matching groups while invalid and duplicate input leaves order alone", () => {
  let recent;
  const questions = [
    { id: "a", category: "Dynamics", answer: "Piano", hint: "Quiet", introducedAt: "N5" },
    { id: "b", category: "Instruments", answer: "Flute", hint: "Woodwind", introducedAt: "N5" },
  ];
  const context = load(["acceptTypedAnswer"], {
    CORE: core, classroomProgress: null, gameState: "playing", activeQuestions: questions, answeredRef: { current: new Set() },
    window: { clearTimeout() {}, MLH: {} }, shakeTimerRef: { current: null },
    setAnswerInput() {}, setAnsweredIds() {}, setAnswerShake() {},
    setRecentAnswerCategories: value => { recent = value; },
  });
  context.acceptTypedAnswer("Piano");
  assert.deepEqual(Array.from(recent), ["Dynamics"]);
  const previous = recent;
  context.acceptTypedAnswer("unknown");
  assert.equal(recent, previous);
  context.acceptTypedAnswer("Piano");
  assert.equal(recent, previous);
});

test("standard games earn and retain medals with hints on or off at every playable level", () => {
  for (const level of ["N5", "H", "AH"]) {
    for (const showHints of [true, false]) {
      const medalEligible = vm.runInNewContext(eligibility, { standardGame: true, showHints, classroomRound: false });
      assert.equal(medalEligible, true);
      const questions = core.questionsForLevel(data.QUESTIONS, level);
      const result = core.createResult({ level, questions, answeredIds: new Set(questions.map(question => question.id)), elapsedMs: 1000, durationMs: 0, standardGame: true, medalEligible });
      assert.equal(result.medal, "diamond");
      const saved = core.updatePersistence(core.emptyPersistence(), result);
      assert.equal(saved.records[level].bestMedal, "diamond");
    }
  }
  assert.equal(vm.runInNewContext(eligibility, { standardGame: false, showHints: true, classroomRound: false }), false);
  assert.equal(vm.runInNewContext(eligibility, { standardGame: true, showHints: true, classroomRound: true }), false);
});


test("adding optional categories retains medals and records, while removing defaults disables them", () => {
  const defaultOff = {
    N5: ["National 5 Styles"],
    H: ["Higher Styles", "Orchestral families"],
    AH: ["Advanced Higher Styles", "Bass lines", "Concerto grosso", "Orchestral families"],
  };
  const context = load(["allCategoriesAtLevel", "standardCategoriesAtLevel", "questionsForSelectedCategories"], {
    CORE: core, DATA: data, DEFAULT_OFF_CATEGORIES: defaultOff,
  });
  for (const level of ["N5", "H", "AH"]) {
    const standardCategories = context.standardCategoriesAtLevel(level);
    for (const extras of [...defaultOff[level].map(category => [category]), defaultOff[level]]) {
      const selectedCategories = [...standardCategories, ...extras];
      const standardGame = vm.runInNewContext(standardCategoryEligibility, { standardCategories, selectedCategories });
      assert.equal(standardGame, true);
      const questions = context.questionsForSelectedCategories(level, selectedCategories);
      assert(questions.length > context.questionsForSelectedCategories(level, standardCategories).length);
      const medalEligible = vm.runInNewContext(eligibility, { standardGame, classroomRound: false });
      const result = core.createResult({ level, questions, answeredIds: new Set(questions.map(q => q.id)), elapsedMs: 1000, standardGame, medalEligible });
      assert.equal(result.medal, "diamond");
      assert.equal(core.updatePersistence(core.emptyPersistence(), result).records[level].bestMedal, "diamond");
      assert.equal(vm.runInNewContext(standardCategoryEligibility, { standardCategories, selectedCategories: selectedCategories.filter(category => category !== standardCategories[0]) }), false);
    }
  }
});

test('real category switches and hints survive QR sharing at all Concept Recall levels', () => {
  const defaults={N5:['National 5 Styles'],H:['Higher Styles','Orchestral families'],AH:['Advanced Higher Styles','Bass lines','Concerto grosso','Orchestral families']};
  const styles={N5:'National 5 Styles',H:'Higher Styles',AH:'Advanced Higher Styles'};
  const context=load(['allCategoriesAtLevel','standardCategoriesAtLevel','customisableCategoriesAtLevel','questionsForSelectedCategories','isStylesCategory','conceptRecallShareUrl','sharedCustomisePreferences','savedCategoriesAtLevel'], {CORE:core,DATA:data,DEFAULT_OFF_CATEGORIES:defaults,STYLE_CATEGORY_BY_LEVEL:styles,STYLE_CATEGORIES:new Set(Object.values(styles)),URL,URLSearchParams});
  for(const level of ['N5','H','AH']) {
    const standard=Array.from(context.standardCategoriesAtLevel(level));
    const allCategories=Array.from(context.customisableCategoriesAtLevel(level));
    assert.deepEqual(Array.from(context.questionsForSelectedCategories(level,allCategories),q=>q.id),core.questionsForLevel(data.QUESTIONS,level).map(q=>q.id));
    for(const categories of [[...standard,...defaults[level]],standard.slice(1)]) {
      for(const showHints of [false,true]) {
        const url=new URL(context.conceptRecallShareUrl(level,showHints,categories,'https://example.test/conceptrecall.html?level=N5&hints=1&categories=old&selectedLevelOnly=1'));
        assert.equal(url.searchParams.has('selectedLevelOnly'),false);
        const recipient=context.sharedCustomisePreferences({showHints:!showHints,categoriesByLevel:{[level]:[standard[0]]}},level,url.search);
        assert.equal(recipient.showHints,showHints);
        const restored=Array.from(context.savedCategoriesAtLevel(recipient,level));
        assert.deepEqual(restored,categories);
        assert.deepEqual(Array.from(context.questionsForSelectedCategories(level,restored),q=>q.id),Array.from(context.questionsForSelectedCategories(level,categories),q=>q.id));
      }
    }
  }
});
