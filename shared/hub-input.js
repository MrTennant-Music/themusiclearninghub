(function () {
  const MLH = window.MLH || {};
  const scrollableStaffSurfaces = new WeakSet();
  // All user-driven audio stops share this short release instead of a hard cut.
  const AUDIO_FADE_MS = 160;
  const audioOutputs = new WeakMap(), closingAudio = new WeakMap(), fadingMedia = new WeakMap();
  MLH.audioOutput = function audioOutput(context) {
    if (!audioOutputs.has(context)) {
      const output = context.createGain();
      output.gain.value = 1;
      output.connect(context.destination);
      audioOutputs.set(context, output);
    }
    return audioOutputs.get(context);
  };
  MLH.releaseAudioGain = function releaseAudioGain(node) {
    if (!node) return;
    const now=node.context.currentTime, gain=node.gain;
    if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(now);
    else { const value=gain.value; gain.cancelScheduledValues(now); gain.setValueAtTime(value,now); }
    gain.linearRampToValueAtTime(0,now+AUDIO_FADE_MS/1000);
    setTimeout(()=>{try{node.disconnect();}catch{}},AUDIO_FADE_MS+10);
  };
  MLH.closeAudioContext = function closeAudioContext(context) {
    if (!context || context.state === 'closed') return Promise.resolve();
    if (closingAudio.has(context)) return closingAudio.get(context);
    const output = audioOutputs.get(context);
    if (!output || context.state !== 'running') return context.close();
    const now = context.currentTime, gain = output.gain;
    if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(now);
    else { const value = gain.value; gain.cancelScheduledValues(now); gain.setValueAtTime(value, now); }
    gain.linearRampToValueAtTime(0, now + AUDIO_FADE_MS / 1000);
    const closed = new Promise(resolve => setTimeout(resolve, AUDIO_FADE_MS + 10)).then(() => context.state !== 'closed' ? context.close() : undefined);
    closingAudio.set(context, closed);
    return closed;
  };
  MLH.fadeOutAudio = function fadeOutAudio(audio, { reset = false } = {}) {
    if (!audio) return Promise.resolve();
    if (fadingMedia.has(audio)) return fadingMedia.get(audio);
    if (audio.paused || audio.ended || audio.volume === 0 || !Number.isFinite(audio.volume)) {
      audio.pause(); if (reset) audio.currentTime = 0; return Promise.resolve();
    }
    const volume = audio.volume, started = Date.now();
    const faded = new Promise(resolve => {
      const timer = setInterval(() => {
        const progress = Math.min(1, (Date.now() - started) / AUDIO_FADE_MS);
        audio.volume = volume * (1 - progress);
        if (progress < 1 && !audio.paused) return;
        clearInterval(timer); audio.pause(); audio.volume = volume;
        if (reset) audio.currentTime = 0;
        fadingMedia.delete(audio); resolve();
      }, 10);
    });
    fadingMedia.set(audio, faded);
    return faded;
  };
  MLH.fadeOutWidgetAudio = function fadeOutWidgetAudio(widget) {
    if (!widget) return;
    if (!widget.getVolume || !widget.setVolume) { widget.pause(); return; }
    widget.getVolume(volume => {
      const started = Date.now();
      const timer = setInterval(() => {
        const progress = Math.min(1, (Date.now() - started) / AUDIO_FADE_MS);
        widget.setVolume(volume * (1 - progress));
        if (progress < 1) return;
        clearInterval(timer); widget.pause(); widget.setVolume(volume);
      }, 10);
    });
  };
  MLH.waitForAudioFade = function waitForAudioFade(audio) {
    // Wait for an in-flight release before replaying a reusable media element.
    return fadingMedia.get(audio) || Promise.resolve();
  };


  MLH.isTouchDevice = function isTouchDevice() {
    return window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
      window.matchMedia("(pointer: coarse)").matches ||
      navigator.maxTouchPoints > 0 ||
      "ontouchstart" in window;
  };

  MLH.useKeyboardReset = function useKeyboardReset() {
    const scrollY = React.useRef(0);
    const bodyTop = React.useRef("");
    const locked = React.useRef(false);

    return {
      onFocus(event) {
        if (!MLH.isTouchDevice() || MLH.touchKeyboard?.isEnabledFor(event.currentTarget)) return;
        locked.current = true;
        scrollY.current = window.scrollY;
        bodyTop.current = document.body.style.top || "";
        document.body.style.position = "fixed";
        document.body.style.width = "100%";
        document.body.style.top = `-${scrollY.current}px`;
        event?.currentTarget?.focus?.({ preventScroll: true });
      },
      onBlur() {
        if (!locked.current) return;
        locked.current = false;
        const nextY = scrollY.current;
        document.body.style.position = "";
        document.body.style.width = "";
        document.body.style.top = bodyTop.current;
        window.scrollTo({ top: nextY, behavior: "auto" });
      },
    };
  };

  MLH.getTouchPoint = function getTouchPoint(event) {
    const point = event.touches?.[0] || event.changedTouches?.[0] || event;
    return { clientX: point.clientX, clientY: point.clientY };
  };

  MLH.getTouchPreviewPosition = function getTouchPreviewPosition(event, { yOffset = 44 } = {}) {
    const point = MLH.getTouchPoint(event);
    return {
      x: point.clientX,
      y: point.clientY - yOffset,
      sourceX: point.clientX,
      sourceY: point.clientY,
    };
  };

  // Only dedicated note-entry targets reserve the gesture. Notes respond
  // immediately; the surrounding score remains available for native scrolling.
  MLH.allowStaffTouchScroll = function allowStaffTouchScroll(element) {
    if (!element || scrollableStaffSurfaces.has(element)) return;
    element.setAttribute("data-mlh-staff-input", "");
    element.style.touchAction = "none";
    let editing = false;
    const clear = () => { editing = false; };
    element.addEventListener("touchstart", event => {
      editing = event.touches.length === 1;
      if (editing && event.cancelable) event.preventDefault();
    }, { passive: false, capture: true });
    element.addEventListener("touchmove", event => {
      if (event.touches.length !== 1) { clear(); return; }
      if (editing && event.cancelable) event.preventDefault();
    }, { passive: false, capture: true });
    element.addEventListener("touchend", clear, { passive: true, capture: true });
    element.addEventListener("touchcancel", clear, { passive: true, capture: true });
    element.addEventListener("pointercancel", clear, { passive: true, capture: true });
    scrollableStaffSurfaces.add(element);
  };

  MLH.preventTouchScrollWhileDragging = MLH.allowStaffTouchScroll;

  window.MLH = MLH;
})();
