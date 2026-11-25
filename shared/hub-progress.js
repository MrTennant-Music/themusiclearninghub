/* Scores and personal bests persist; current streaks belong to one page load.
   Playback controls and help preferences share the same score record. */
(function () {
  const MLH = window.MLH = window.MLH || {};
  const prefix = "mlh:activity-progress:v1:";
  const fallback = new Map();
  const streakSession = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  const activeStreakFields = new Set(["streak", "followStreak", "currentStreak"]);
  const scoreNeutralOptions = new Set([
    "tempo", "bpm", "playbackTempo", "metronome", "metronomeOn", "metronomeEnabled",
    "follow", "followPlayback", "highlightPlayback",
    "showC", "showHelp", "showHints", "showNoteNames", "showFollowNoteNames",
    "noteNamesVisible", "showRhythmGuide", "showScaleDegrees", "revealKey",
  ]);

  function resetActiveStreaks(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return value;
    return Object.fromEntries(Object.entries(value).map(([field, stored]) => [field,
      activeStreakFields.has(field) ? 0 : resetActiveStreaks(stored)
    ]));
  }

  function restoredFields(record) {
    return record.streakSession === streakSession ? record.fields : resetActiveStreaks(record.fields);
  }

  function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
    if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]));
    return value;
  }

  function scoreSettings(settings) {
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) return settings;
    const { options } = settings;
    if (!Object.hasOwn(settings, "options") && Object.hasOwn(settings, "questions")) return { ...settings, options: {} };
    if (!options || typeof options !== "object" || Array.isArray(options)) return settings;
    return { ...settings, options: Object.fromEntries(Object.entries(options).filter(([name]) => !scoreNeutralOptions.has(name))) };
  }

  function stateKey({ level, scope = "", settings = null }, includePreferences = false) {
    return prefix + JSON.stringify([(MLH.pageIdentity || (name => name))(window.location.pathname.split("/").pop()), level, scope, stableValue(includePreferences ? settings : scoreSettings(settings))]);
  }

  function validValue(value, initial) {
    if (typeof initial === "number") return Number.isSafeInteger(value) && value >= 0;
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    return Object.keys(initial).every(key => Number.isSafeInteger(value[key]) && value[key] >= 0)
      && value.correct <= value.attempted
      && (value.streak == null || value.streak <= value.correct)
      && (value.best == null || value.best >= value.streak);
  }

  function read(key, legacyKey) {
    try {
      const stored = JSON.parse(window.localStorage.getItem(key));
      if (stored?.version === 1 && stored.fields && typeof stored.fields === "object" && !Array.isArray(stored.fields)) return restoredFields(stored);
      const [currentActivity, currentLevel, currentScope, currentSettings] = JSON.parse(key.slice(prefix.length));
      // Start with the pupil's existing score for their current preferences.
      // Old entries remain intact; do not add together separate attempts.
      if (legacyKey && legacyKey !== key) {
        const previous = JSON.parse(window.localStorage.getItem(legacyKey));
        if (previous?.version === 1 && previous.fields && typeof previous.fields === "object" && !Array.isArray(previous.fields)) return restoredFields(previous);
      }
      let olderFields = null;
      let hasExpandedSetup = false;
      // Retain scores saved before option lists were made independent of order.
      for (let index = 0; index < window.localStorage.length; index++) {
        const previousKey = window.localStorage.key(index);
        if (!previousKey?.startsWith(prefix)) continue;
        try {
          const [activity, level, scope, settings] = JSON.parse(previousKey.slice(prefix.length));
          const previous = JSON.parse(window.localStorage.getItem(previousKey));
          if (previous?.version !== 1 || !previous.fields || typeof previous.fields !== "object" || Array.isArray(previous.fields)) continue;
          if (prefix + JSON.stringify([activity, level, scope, stableValue(scoreSettings(settings))]) === key) return restoredFields(previous);
          if (activity !== currentActivity || level !== currentLevel || scope !== currentScope || !currentSettings?.options) continue;
          if (JSON.stringify(stableValue(settings?.questions)) === JSON.stringify(currentSettings.questions) && settings?.options) hasExpandedSetup = true;
          if (JSON.stringify(stableValue(settings)) === JSON.stringify(currentSettings.questions)) olderFields = restoredFields(previous);
        } catch { /* Ignore invalid older entries. */ }
      }
      // Migrate a previous question-only score into the first complete setup used.
      // Once that setup exists, new combinations must start at zero.
      if (olderFields && !hasExpandedSetup) return olderFields;
    } catch { /* Use the current page's fallback when storage is unavailable. */ }
    return fallback.get(key) || {};
  }

  function load(key, field, initial, legacyKey) {
    const value = read(key, legacyKey)[field];
    return validValue(value, initial) ? (typeof value === "object" ? { ...value } : value) : initial;
  }

  MLH.usePersistentScoreState = function (initial, field, options) {
    const key = stateKey(options);
    const legacyKey = stateKey(options, true);
    const classroom = MLH.classroomExercise ? MLH.classroomActivities?.progressStorage?.() : null;
    const classroomKey = key + ":" + field;
    const freshScore = () => {
      if (!MLH.classroomExercise) return load(key, field, initial, legacyKey);
      const value = classroom?.read(classroomKey, initial);
      return validValue(value, initial) ? value : initial;
    };
    const [state, setState] = window.React.useState(() => ({ key, value: freshScore() }));
    // Restore the matching score before committing a different level or exercise.
    if (state.key !== key) setState({ key, value: freshScore() });
    const setValue = window.React.useCallback(update => {
      setState(current => ({ ...current, value: typeof update === "function" ? update(current.value) : update }));
    }, []);
    setValue.persistentScoreState = true;

    window.React.useLayoutEffect(() => {
      if (state.key !== key || !validValue(state.value, initial) || MLH.worksheetHeaderMode) return;
      if (MLH.classroomExercise) {
        classroom?.write(classroomKey, state.value);
        return;
      }
      const fields = { ...read(key, legacyKey), [field]: state.value };
      fallback.set(key, fields);
      try { window.localStorage.setItem(key, JSON.stringify({ version: 1, fields, streakSession })); } catch { /* Scoring remains available without browser storage. */ }
      // Keep refresh on the level that owns these scores.
      if (["N3", "N4", "N5", "H", "AH"].includes(options.level)) {
        const url = new URL(window.location.href);
        if (url.searchParams.get("level") !== options.level) {
          url.searchParams.set("level", options.level);
          window.history.replaceState(window.history.state, "", url.href);
        }
      }
    }, [key, state, field]);

    return [state.value, setValue];
  };
})();
