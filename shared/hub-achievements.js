/* Highest streak awards shared by activities and the homepage. */
(function () {
  const MLH = window.MLH = window.MLH || {};
  const storageKey = "mlh:achievements:v1";
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

  function keyFor(activity, level) {
    if (!levels.includes(level) && level !== "ALL") return null;
    try {
      const url = new URL(activity || window.location.href, window.location.href);
      const filename = (MLH.pageIdentity || (name => name))(url.pathname.split("/").pop());
      if (level === "ALL" && !/^conceptquiz-/i.test(filename) && filename !== "bandle.html") return null;
      return /^[a-z0-9-]+\.html$/i.test(filename) ? `${filename.toLowerCase()}|${level}` : null;
    } catch { return null; }
  }

  function mergeStored() {
    try {
      const stored = JSON.parse(window.localStorage.getItem(storageKey));
      if (stored?.version !== 1 || !stored.records || typeof stored.records !== "object") return;
      Object.entries(stored.records).forEach(([key, value]) => {
        const [activity, level] = key.split("|");
        if (keyFor(activity, level) !== key || !value || !Number.isSafeInteger(value.bestStreak) || value.bestStreak < 0 || (value.tier !== null && !tiers.includes(value.tier))) return;
        const previous = records[key];
        const higher = !previous || tiers.indexOf(value.tier) > tiers.indexOf(previous.tier);
        records[key] = {
          tier: higher ? value.tier : previous.tier,
          bestStreak: Math.max(previous?.bestStreak || 0, value.bestStreak),
        };
      });
    } catch { /* Storage can be unavailable; activities still work. */ }
  }

  function get(activity, level) {
    mergeStored();
    const record = records[keyFor(activity, level)];
    return record ? { ...record } : null;
  }

  function record(activity, level, streak, thresholds = [10, 15, 20, 30]) {
    const key = keyFor(activity, level);
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
    try { window.localStorage.setItem(storageKey, JSON.stringify({ version: 1, records })); } catch { /* Retain progress in memory for this page. */ }
    window.dispatchEvent(new CustomEvent(eventName));
  }

  // Games with completion/time awards report their actual tier, not a fake streak.
  function award(activity, level, tier) {
    const key = keyFor(activity, level);
    if (!key || !tiers.includes(tier)) return;
    mergeStored();
    const previous = records[key] || { tier: null, bestStreak: 0 };
    if (tiers.indexOf(tier) <= tiers.indexOf(previous.tier)) return;
    records[key] = { tier, bestStreak: previous.bestStreak };
    try { window.localStorage.setItem(storageKey, JSON.stringify({ version: 1, records })); } catch { /* Keep the award in memory. */ }
    window.dispatchEvent(new CustomEvent(eventName));
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
    if (event.key !== storageKey && event.key !== null) return;
    records = {};
    mergeStored();
    window.dispatchEvent(new CustomEvent(eventName));
  });
  // Each activity/level owns one of each medal, regardless of score resets.
  function totals() {
    mergeStored();
    const counts = Object.fromEntries(tiers.map(tier => [tier, 0]));
    Object.values(records).forEach(record => {
      const highest = tiers.indexOf(record.tier);
      tiers.forEach((tier, index) => { if (index <= highest) counts[tier]++; });
    });
    return counts;
  }
  MLH.achievements = { storageKey, eventName, medals, get, record, award, totals };
  importExistingGameAwards();
})();
