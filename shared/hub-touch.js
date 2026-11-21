/* Let native scrolling win over taps, without intercepting deliberate drags. */
(function () {
  if (window.__mlhTouchGestures) return;
  window.__mlhTouchGestures = true;
  // Inherited by text fields and editable regions, including those added later.
  // Keep native autocorrection independent from inline text predictions.
  document.documentElement.setAttribute('writingsuggestions', 'false');
  let gesture = null;
  let lastTap = null;
  const pointers = new Set();
  const tapSlop = 10;
  const doubleTapDelay = 350;
  const pointerSurface = node => node?.closest?.('[data-mlh-pointer-surface]');
  const control = node => node?.closest?.('button,a,label,input,select,textarea,summary,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="tab"]');
  const nativeControl = node => control(node) || node?.closest?.('audio,video,[role="slider"],[tabindex]');

  document.addEventListener('touchstart', event => {
    const previousTap = lastTap;
    lastTap = null;
    if (pointerSurface(event.target)) {
      event.preventDefault();
      return;
    }
    const touch = event.touches[0];
    if (event.touches.length === 1 && !nativeControl(event.target) && previousTap &&
        Date.now() - previousTap.time <= doubleTapDelay &&
        Math.hypot(touch.clientX - previousTap.x, touch.clientY - previousTap.y) <= tapSlop) {
      event.preventDefault();
    }
  }, { capture: true, passive: false });
  document.addEventListener('touchend', event => {
    if (pointerSurface(event.target)) {
      event.preventDefault();
      return;
    }
    if (event.touches.length || !gesture || gesture.swiped || nativeControl(event.target) ||
        Date.now() - gesture.startedAt > doubleTapDelay) return;
    const touch = event.changedTouches[0];
    if (touch) lastTap = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, { capture: true, passive: false });
  document.addEventListener('contextmenu', event => {
    if (pointerSurface(event.target)) event.preventDefault();
  }, true);
  function move(event) {
    if (!gesture || !pointers.has(event.pointerId)) return;
    if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > tapSlop) gesture.swiped = true;
  }
  document.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch') { gesture = null; return; }
    pointers.add(event.pointerId);
    if (pointers.size > 1) { if (gesture) gesture.swiped = true; return; }
    gesture = { target: event.target, x: event.clientX, y: event.clientY, startedAt: Date.now(), swiped: false, until: Infinity };
  }, { capture: true, passive: true });
  document.addEventListener('pointermove', move, { capture: true, passive: true });
  function end(event) {
    move(event);
    pointers.delete(event.pointerId);
    if (!gesture) return;
    if (event.type === 'pointercancel') gesture.swiped = true;
    if (!pointers.size) gesture.until = Date.now() + 700;
  }
  document.addEventListener('pointerup', end, { capture: true, passive: true });
  document.addEventListener('pointercancel', end, { capture: true, passive: true });
  document.addEventListener('scroll', () => {
    if (gesture && pointers.size) gesture.swiped = true;
  }, { capture: true, passive: true });
  document.addEventListener('click', event => {
    // Keyboard and assistive activation remain independent of touch gestures.
    if (event.detail === 0 && event.pointerType !== 'touch') return;
    if (!gesture?.swiped || Date.now() > gesture.until) return;
    const target = event.target;
    if (target === gesture.target || target?.contains?.(gesture.target) || gesture.target?.contains?.(target) ||
        (control(target) && control(target) === control(gesture.target))) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  window.addEventListener('blur', () => { gesture = null; lastTap = null; pointers.clear(); });
})();
