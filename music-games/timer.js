(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.IGTimer = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function format(milliseconds, showTenths = true) {
    const ms = Math.max(0, Math.floor(milliseconds));
    return `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}${showTenths ? '.' + Math.floor(ms % 1000 / 100) : ''}`;
  }
  function frame(elapsed, limit = 0, previousCharacters = 0) {
    const elapsedMs = Math.max(0, elapsed);
    const text = format(limit > 0 ? Math.max(0, limit - elapsedMs) : elapsedMs, false);
    return { text, characters: Math.max(previousCharacters, text.length), expired: limit > 0 && elapsedMs >= limit };
  }
  return Object.freeze({ format, frame });
});
