(function trackHubLayoutViewport(root) {
  "use strict";

  const storageKey = "mlh:layout-viewport";
  const page = document.documentElement;
  let previous;
  let zoom = 1;

  function measure() {
    return {
      width: root.innerWidth,
      height: root.innerHeight,
      outerWidth: root.outerWidth,
      outerHeight: root.outerHeight,
      pixelRatio: root.devicePixelRatio || 1,
    };
  }

  function sameWindow(before, after) {
    return before.outerWidth > 0 && before.outerHeight > 0 &&
      before.outerWidth === after.outerWidth && before.outerHeight === after.outerHeight;
  }

  // Carry the current zoom across Hub pages in the same browser tab.
  try {
    const saved = JSON.parse(root.sessionStorage.getItem(storageKey));
    const current = measure();
    if (saved && sameWindow(saved, current) && saved.pixelRatio === current.pixelRatio &&
        Math.abs(saved.width - current.width) <= 2 && saved.zoom > 0) {
      zoom = saved.zoom;
    }
  } catch {}

  function update() {
    const current = measure();
    if (!current.width || !current.height) return;
    if (previous && previous.width > 0 && current.width !== previous.width && sameWindow(previous, current)) {
      const widthRatio = previous.width / current.width;
      const heightRatio = previous.height / current.height;
      const pixelRatio = current.pixelRatio / previous.pixelRatio;
      if (pixelRatio !== 1 && Math.abs(widthRatio - pixelRatio) < 0.02) {
        zoom *= pixelRatio;
      } else if (Math.abs(widthRatio - 1) > 0.03 && Math.abs(widthRatio - heightRatio) < 0.02) {
        // Safari can keep its device-pixel ratio constant during page zoom.
        zoom *= widthRatio;
      }
    }
    if (Math.abs(zoom - 1) < 0.01) zoom = 1;
    previous = current;
    const width = Math.round(current.width * zoom);
    root.MLHLayoutViewport = { width, zoom };
    page.style.setProperty("--mlh-browser-layout-width", `${width}px`);
    page.toggleAttribute("data-mlh-page-zoomed", zoom !== 1);
    page.toggleAttribute("data-mlh-page-zoomed-in", zoom > 1);
    try {
      if (zoom === 1) root.sessionStorage.removeItem(storageKey);
      else root.sessionStorage.setItem(storageKey, JSON.stringify({ ...current, zoom }));
    } catch {}
  }

  update();
  root.addEventListener("resize", update, { passive: true });
})(window);
