(function enforceDesktopLayout() {
  const DESKTOP_WIDTH = 1280;
  const viewport = document.querySelector('meta[name="viewport"]');

  if (viewport && viewport.content !== `width=${DESKTOP_WIDTH}`) {
    /*
     * Supplying the fixed canvas width without forcing an initial scale lets
     * mobile browsers fit the complete desktop page into the visible width.
     * Safari recalculates that fitted scale when an iPad changes orientation.
     */
    viewport.setAttribute("content", `width=${DESKTOP_WIDTH}`);
  }

  // Mobile's fixed viewport already fits the canvas. Desktop browser windows
  // need an explicit whole-page scale when their layout viewport is narrower.
  function fitDesktopCanvas() {
    const width = Math.max(1, Number(window.MLHLayoutViewport?.width || window.innerWidth) || DESKTOP_WIDTH);
    const scale = Math.min(1, width / DESKTOP_WIDTH);
    const zoom = window.MLHLayoutViewport?.zoom || 1;
    const canvasWidth = zoom !== 1 ? Math.max(width, DESKTOP_WIDTH) : DESKTOP_WIDTH;
    const style = document.documentElement.style;
    style.setProperty("--mlh-desktop-layout-scale", String(scale));
    style.setProperty("--mlh-layout-canvas-min-width", `${canvasWidth}px`);
    style.setProperty("--mlh-layout-root-min-width", zoom > 1 ? `${width}px` : scale < 1 ? "0px" : `${DESKTOP_WIDTH}px`);
  }
  fitDesktopCanvas();
  window.addEventListener("resize", fitDesktopCanvas, { passive: true });

  /*
   * Older Hub pages still contain Tailwind breakpoint prefixes. Make every
   * breakpoint unconditional so those existing classes always resolve to
   * their desktop values, regardless of the physical screen width.
   */
  if (window.tailwind) {
    const current = window.tailwind.config || {};
    window.tailwind.config = {
      ...current,
      theme: {
        ...(current.theme || {}),
        screens: {
          sm: "0px",
          md: "0px",
          lg: "0px",
          xl: "0px",
          "2xl": "0px",
        },
      },
    };
  }
})();

(function returnBrowserBackToHubHome() {
  const navigation = window.navigation;
  const script = document.currentScript;
  if (window.top !== window || !navigation?.currentEntry || !script?.src) return;

  const root = new URL("./", script.src);
  const home = new URL("index.html", root);
  const internalBackKey = "mlh:internal-back";
  let internalDestination;

  function isHome(url) {
    return url.origin === home.origin && (url.pathname === home.pathname || url.pathname === root.pathname);
  }

  // Keep app Back controls that call the History API distinct from browser Back.
  const back = history.back.bind(history);
  const go = history.go.bind(history);
  function rememberInternalBack(steps) {
    if (steps >= 0) return;
    const target = navigation.entries()[navigation.currentEntry.index + steps];
    if (!target) return;
    internalDestination = { key: target.key, expires: Date.now() + 10000 };
    try {
      sessionStorage.setItem(internalBackKey, JSON.stringify(internalDestination));
    } catch {}
  }
  history.back = () => {
    rememberInternalBack(-1);
    return back();
  };
  history.go = steps => {
    rememberInternalBack(Math.trunc(steps));
    return go(steps);
  };

  function isInternalBack(key) {
    const now = Date.now();
    const samePage = internalDestination?.key === key && internalDestination.expires >= now;
    internalDestination = undefined;
    try {
      const pending = JSON.parse(sessionStorage.getItem(internalBackKey));
      if (pending?.key === key || pending?.expires < now) sessionStorage.removeItem(internalBackKey);
      return samePage || (pending?.key === key && pending.expires >= now);
    } catch {
      return samePage;
    }
  }

  function returnHomeFromBack(from) {
    const current = navigation.currentEntry;
    if (!from?.url || from.index <= current.index || isInternalBack(current.key)) return;
    const origin = new URL(from.url);
    if (origin.origin !== root.origin || !origin.pathname.startsWith(root.pathname) || isHome(origin)) return;

    setTimeout(() => {
      if (navigation.currentEntry.key !== current.key || isHome(new URL(current.url))) return;
      const previousHome = navigation.entries().slice(0, current.index)
        .findLast(entry => entry.url && isHome(new URL(entry.url)));
      if (!previousHome) {
        location.replace(home.href);
        return;
      }
      const traversal = navigation.traverseTo(previousHome.key);
      traversal.committed.catch(() => {});
      traversal.finished.catch(() => location.replace(home.href));
    }, 0);
  }

  navigation.addEventListener("currententrychange", event => {
    if (event.navigationType === "traverse" && event.from.sameDocument) returnHomeFromBack(event.from);
  });
  window.addEventListener("pageshow", () => {
    const activation = navigation.activation;
    if (activation?.navigationType === "traverse") returnHomeFromBack(activation.from);
  });
})();
