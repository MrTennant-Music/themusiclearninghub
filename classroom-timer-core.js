(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ClassroomTimerCore = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const MAX_DURATION = 359999000;
  const sounds = { chime: 'Chime', bell: 'Bell', digital: 'Digital', marimba: 'Marimba', silent: 'Silent' };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
  function create(id, label, sound = 'chime') {
    return { id, label, sound, alarmMode: 'continuous', mode: 'timer', duration: 300000, value: 300000, status: 'idle', anchor: null, acknowledged: false, alarmCycle: 0, alertUntil: 0 };
  }
  function valueAt(timer, now) {
    if (timer.status !== 'running') return timer.value;
    const elapsed = Math.max(0, now - timer.anchor);
    return timer.mode === 'stopwatch' ? timer.value + elapsed : Math.max(0, timer.value - elapsed);
  }
  function advance(timer, now, autoRestart = false) {
    if (timer.status !== 'running' || timer.mode !== 'timer' || valueAt(timer, now) > 0) return timer;
    if (autoRestart && timer.duration > 0) {
      const endedAt = timer.anchor + timer.value;
      const cycles = Math.floor(Math.max(0, now - endedAt) / timer.duration) + 1;
      const anchor = endedAt + (cycles - 1) * timer.duration;
      return { ...timer, value: timer.duration, anchor, alarmMode: 'alert', acknowledged: false,
        alarmCycle: (timer.alarmCycle || 0) + cycles, alertUntil: anchor + 5000 };
    }
    return { ...timer, value: 0, anchor: null, status: 'finished', acknowledged: false, alertUntil: 0 };
  }
  function action(timer, type, now, amount, autoRestart = false) {
    const current = { ...advance(timer, now, autoRestart), alertUntil: 0 };
    if (type === 'start') {
      const value = current.status === 'finished' ? current.duration : current.value;
      if (current.mode === 'timer' && value <= 0) return current;
      return { ...current, value, anchor: now, status: 'running', acknowledged: false };
    }
    if (type === 'pause') return { ...current, value: valueAt(current, now), anchor: null, status: current.status === 'finished' ? 'finished' : 'paused' };
    if (type === 'reset') return { ...current, value: current.mode === 'timer' ? current.duration : 0, anchor: null, status: 'idle', acknowledged: false };
    if (type === 'dismiss') return { ...current, acknowledged: true };
    if (type === 'mode') return { ...current, mode: amount, value: amount === 'timer' ? current.duration : 0, anchor: null, status: 'idle', acknowledged: false };
    if (type === 'duration') {
      const duration = Math.floor(clamp(amount, 0, MAX_DURATION) / 1000) * 1000;
      return { ...current, duration, value: duration, anchor: null, status: 'idle', acknowledged: false };
    }
    if (type === 'add' && current.mode === 'timer') {
      const extra = clamp(amount, 0, MAX_DURATION);
      const value = Math.min(MAX_DURATION, valueAt(current, now) + extra);
      const duration = current.status === 'idle' ? value : Math.min(MAX_DURATION, Math.max(current.duration + extra, value));
      return { ...current, duration, value, anchor: current.status === 'running' || current.status === 'finished' ? now : null,
        status: current.status === 'finished' ? 'running' : current.status, acknowledged: false };
    }
    return current;
  }
  function format(value, milliseconds, countdown = false) {
    const ms = Math.max(0, Math.floor(value));
    const seconds = countdown && !milliseconds ? Math.ceil(ms / 1000) : Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}${milliseconds ? '.' + Math.floor(ms % 1000 / 100) : ''}`;
  }
  function restore(data, now, autoRestart = false) {
    if (!Array.isArray(data) || !data.length) return [{ ...create('timer-1', 'Timer 1'), alarmMode: autoRestart ? 'alert' : 'continuous' }];
    const ids = new Set();
    return data.slice(0, 24).map((raw, index) => {
      let id = /^timer-\d+$/.test(raw?.id) && !ids.has(raw.id) ? raw.id : `timer-${index + 1}`;
      let next = index + 1;
      while (ids.has(id)) id = `timer-${++next}`;
      ids.add(id);
      const base = create(id, String(raw?.label || `Timer ${index + 1}`).slice(0, 60));
      const mode = raw?.mode === 'stopwatch' ? 'stopwatch' : 'timer';
      const status = ['idle', 'paused', 'running', 'finished'].includes(raw?.status) ? raw.status : 'idle';
      const duration = clamp(raw?.duration ?? base.duration, 0, MAX_DURATION);
      const value = clamp(raw?.value ?? (mode === 'timer' ? duration : 0), 0, Number.MAX_SAFE_INTEGER);
      const anchor = Number.isFinite(raw?.anchor) ? raw.anchor : now;
      return advance({ ...base, mode, status, duration, value, anchor: status === 'running' ? anchor : null,
        sound: Object.hasOwn(sounds, raw?.sound) ? raw.sound : 'chime', alarmMode: autoRestart || raw?.alarmMode === 'alert' ? 'alert' : 'continuous', acknowledged: Boolean(raw?.acknowledged),
        alarmCycle: Math.floor(clamp(raw?.alarmCycle, 0, Number.MAX_SAFE_INTEGER)), alertUntil: clamp(raw?.alertUntil, 0, now + 5000) }, now, autoRestart);
    });
  }
  return { MAX_DURATION, sounds, create, valueAt, advance, action, format, restore };
});
