/* Highest streak awards shared by activities and the homepage. */
(function () {
  const MLH = window.MLH = window.MLH || {};
  const storageKey = "mlh:achievements:v1";
  const exerciseStorageKey = "mlh:exercise-achievements:v1";
  const eventName = "mlh-achievements-change";
  const tiers = ["bronze", "silver", "gold", "diamond"];
  const levels = ["N3", "N4", "N5", "H", "AH"];
  const medals = Object.freeze({
    bronze: { label: "Bronze", icon: "ui-icons/bronze.svg", backgroundColor: "rgba(180, 83, 9, .2)", color: "#b45309" },
    silver: { label: "Silver", icon: "ui-icons/silver.svg", backgroundColor: "rgba(203, 213, 225, .3)", color: "#64748b" },
    gold: { label: "Gold", icon: "ui-icons/gold.svg", backgroundColor: "rgba(250, 204, 21, .25)", color: "#eab308" },
    diamond: { label: "Diamond", icon: "ui-icons/diamond.svg", backgroundColor: "rgba(34, 211, 238, .25)", color: "#06b6d4" },
  });
  let records = {};

  function keyFor(activity, level, scope = "") {
    if (!levels.includes(level) && level !== "ALL") return null;
    if (scope !== "" && (typeof scope !== "string" || !/^[a-z0-9-]+$/i.test(scope))) return null;
    try {
      const url = new URL(activity || window.location.href, window.location.href);
      const filename = (MLH.pageIdentity || (name => name))(url.pathname.split("/").pop());
      if (level === "ALL" && !/^conceptquiz-/i.test(filename) && filename !== "bandle.html") return null;
      return /^[a-z0-9-]+\.html$/i.test(filename) ? `${filename.toLowerCase()}|${level}${scope ? `|${scope}` : ""}` : null;
    } catch { return null; }
  }

  function mergeStoredRecords(sourceKey) {
    try {
      const stored = JSON.parse(window.localStorage.getItem(sourceKey));
      if (stored?.version !== 1 || !stored.records || typeof stored.records !== "object") return;
      Object.entries(stored.records).forEach(([key, value]) => {
        const [activity, level, scope] = key.split("|");
        if (Boolean(scope) !== (sourceKey === exerciseStorageKey)) return;
        if (keyFor(activity, level, scope) !== key || !value || !Number.isSafeInteger(value.bestStreak) || value.bestStreak < 0 || (value.tier !== null && !tiers.includes(value.tier))) return;
        const previous = records[key];
        const higher = !previous || tiers.indexOf(value.tier) > tiers.indexOf(previous.tier);
        records[key] = {
          tier: higher ? value.tier : previous.tier,
          bestStreak: Math.max(previous?.bestStreak || 0, value.bestStreak),
        };
      });
    } catch { /* Storage can be unavailable; activities still work. */ }
  }

  function mergeStored() {
    mergeStoredRecords(storageKey);
    mergeStoredRecords(exerciseStorageKey);
  }

  function saveRecords(scope) {
    const scoped = Boolean(scope);
    const saved = Object.fromEntries(Object.entries(records).filter(([key]) => Boolean(key.split("|")[2]) === scoped));
    try { window.localStorage.setItem(scoped ? exerciseStorageKey : storageKey, JSON.stringify({ version: 1, records: saved })); } catch { /* Retain progress in memory for this page. */ }
    window.dispatchEvent(new CustomEvent(eventName));
  }

  function get(activity, level, scope) {
    mergeStored();
    const record = records[keyFor(activity, level, scope)];
    return record ? { ...record } : null;
  }

  function record(activity, level, streak, thresholds = [10, 15, 20, 30], scope) {
    if (MLH.classroomExercise) return get(activity, level, scope);
    const key = keyFor(activity, level, scope);
    if (!key || !Number.isSafeInteger(streak) || streak < 1 || !Array.isArray(thresholds) || thresholds.length !== 4 || thresholds.some((value, index) => !Number.isFinite(value) || value < 1 || (index > 0 && value <= thresholds[index - 1]))) return;
    mergeStored();
    const previous = records[key] || { tier: null, bestStreak: 0 };
    const tier = tiers.filter((_, index) => streak >= thresholds[index]).pop() || null;
    const next = {
      tier: tiers.indexOf(tier) > tiers.indexOf(previous.tier) ? tier : previous.tier,
      bestStreak: Math.max(previous.bestStreak, streak),
    };
    if (next.tier === previous.tier && next.bestStreak === previous.bestStreak) return;
    records[key] = next;
    saveRecords(scope);
  }

  // Games with completion/time awards report their actual tier, not a fake streak.
  function award(activity, level, tier) {
    if (MLH.classroomExercise) return get(activity, level);
    const key = keyFor(activity, level);
    if (!key || !tiers.includes(tier)) return;
    mergeStored();
    const previous = records[key] || { tier: null, bestStreak: 0 };
    if (tiers.indexOf(tier) <= tiers.indexOf(previous.tier)) return;
    records[key] = { tier, bestStreak: previous.bestStreak };
    saveRecords();
  }

  function importExistingGameAwards() {
    try {
      const saved = JSON.parse(window.localStorage.getItem("mlh-concept-recall-v1"));
      if (saved?.version === 1) Object.entries(saved.records || {}).forEach(([level, result]) => {
        if (tiers.includes(result?.bestMedal)) award("conceptrecall.html", level, result.bestMedal);
      });
    } catch { /* Ignore unavailable or damaged legacy game data. */ }
    try {
      const saved = JSON.parse(window.localStorage.getItem("mlh-millionaire-performance-v1"));
      Object.entries(saved || {}).forEach(([level, result]) => {
        if (!result || typeof result !== "object") return;
        // Reaching a question alone is not proof it was answered correctly.
        const amount = Number.isFinite(result.bestAmount) ? result.bestAmount : 0;
        const tier = Number.isFinite(result.bestWinMs) && result.bestWinMs >= 0 ? "diamond"
          : tiers.filter((name, index) => amount >= [300, 1000, 32000, 1000000][index]).pop();
        if (tier) award("whowantstobeamillionaire.html", level, tier);
      });
    } catch { /* Do not infer awards from ambiguous question positions. */ }
  }

  window.addEventListener("storage", (event) => {
    if (["mlh-concept-recall-v1", "mlh-millionaire-performance-v1"].includes(event.key)) { importExistingGameAwards(); return; }
    if (event.key !== storageKey && event.key !== exerciseStorageKey && event.key !== null) return;
    records = {};
    mergeStored();
    window.dispatchEvent(new CustomEvent(eventName));
  });
  function medalsByLevel() {
    mergeStored();
    const groups = new Map();
    for (const [key, record] of Object.entries(records)) {
      if (record.tier === null) continue;
      const [activity, level, scope] = key.split("|");
      const groupKey = `${activity}|${level}`;
      if (!groups.has(groupKey)) groups.set(groupKey, { exercises: [], legacy: null });
      const group = groups.get(groupKey);
      if (scope) group.exercises.push(record.tier);
      else group.legacy = record.tier;
    }
    for (const group of groups.values()) {
      // An old level award has no exercise identity. Keep it until a scoped
      // result matches or surpasses it, so the same award is not counted twice.
      if (group.legacy && !group.exercises.some(tier => tiers.indexOf(tier) >= tiers.indexOf(group.legacy))) {
        group.exercises.push(group.legacy);
      }
    }
    return groups;
  }

  function levelSummary(activity, level) {
    const earned = medalsByLevel().get(keyFor(activity, level))?.exercises || [];
    return {
      tier: tiers.findLast(tier => earned.includes(tier)) || null,
      count: earned.length,
      counts: Object.fromEntries(tiers.map(tier => [tier, earned.filter(value => value === tier).length])),
    };
  }

  function totals() {
    const counts = Object.fromEntries(tiers.map(tier => [tier, 0]));
    for (const { exercises } of medalsByLevel().values()) {
      for (const tier of exercises) counts[tier]++;
    }
    return counts;
  }
  MLH.achievements = { storageKey, eventName, medals, get, record, award, levelSummary, totals };
  importExistingGameAwards();
})();
