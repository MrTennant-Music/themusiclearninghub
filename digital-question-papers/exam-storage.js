(function (root) {
  "use strict";

  const PREFIX = "mlh-digital-question-papers-v1";
  // Retain drafts and results saved before the project folder was renamed.
  const LEGACY_PREFIX = "mlh-interactive-exams-v1";
  const legacyKey = storageKey => storageKey.replace(PREFIX, LEGACY_PREFIX);
  function remove(storageKey) {
    root.localStorage.removeItem(storageKey);
    root.localStorage.removeItem(legacyKey(storageKey));
  }
  const key = (paperId, suffix) => `${PREFIX}:${paperId}:${suffix}`;

  function read(storageKey, fallback) {
    try {
      let value = root.localStorage.getItem(storageKey);
      if (value === null) {
        value = root.localStorage.getItem(legacyKey(storageKey));
        if (value !== null) {
          // Keep the original if storage is full or unavailable during migration.
          try { root.localStorage.setItem(storageKey, value); root.localStorage.removeItem(legacyKey(storageKey)); } catch { /* Read the saved attempt anyway. */ }
        }
      }
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function write(storageKey, value) {
    try {
      root.localStorage.setItem(storageKey, JSON.stringify(value));
      root.localStorage.removeItem(legacyKey(storageKey));
      return true;
    } catch {
      return false;
    }
  }

  function hasAnswerContent(value) {
    if (value === null || value === undefined || value === false) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.some(hasAnswerContent);
    if (typeof value === "object") return Object.values(value).some(hasAnswerContent);
    return true;
  }

  const api = {
    loadDraft(paperId) { return read(key(paperId, "draft"), null); },
    saveDraft(paperId, attempt) { return write(key(paperId, "draft"), { ...attempt, savedAt: new Date().toISOString() }); },
    deleteDraft(paperId) { try { remove(key(paperId, "draft")); return true; } catch { return false; } },
    loadSubmitted(paperId) { return read(key(paperId, "submitted"), null); },
    saveSubmitted(paperId, attempt) { return write(key(paperId, "submitted"), { ...attempt, savedAt: new Date().toISOString() }); },
    deleteSubmitted(paperId) { try { remove(key(paperId, "submitted")); return true; } catch { return false; } },
    paperStatus(paperId) {
      const submitted = api.loadSubmitted(paperId);
      if (submitted?.status === "submitted") return "completed";
      const draft = api.loadDraft(paperId);
      if (draft?.status === "active" && Object.values(draft.answers || {}).some(hasAnswerContent)) return "in-progress";
      return null;
    },
    loadAttempts(paperId) { return read(key(paperId, "attempts"), []); },
    addAttempt(paperId, attempt) {
      const attempts = api.loadAttempts(paperId);
      attempts.unshift(attempt);
      write(key(paperId, "attempts"), attempts.slice(0, 20));
      return attempts[0];
    },
    bestScore(paperId) {
      const scores = api.loadAttempts(paperId).map(item => Number(item.score)).filter(Number.isFinite);
      return scores.length ? Math.max(...scores) : null;
    },
    clearAll(paperId) {
      try {
        remove(key(paperId, "draft"));
        remove(key(paperId, "submitted"));
        remove(key(paperId, "attempts"));
        return true;
      } catch { return false; }
    },
  };

  root.ExamStorage = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
