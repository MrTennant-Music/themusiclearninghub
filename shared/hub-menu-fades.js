(function installMenuScrollFades() {
  if (window.MLHMenuScrollFades) return;
  window.MLHMenuScrollFades = true;

  // Use the shared 18px fade and one-pixel tolerance throughout the Hub.
  const menuSelector = '.hub-menu-panel, [data-menu-panel], [data-exam-menu], [role="menu"], .nav-dropdown-menu, .filter-menu, [data-scroll-fade-panel]';
  const tracked = new Set();
  let frame = 0;

  const style = document.createElement('style');
  style.id = 'hub-menu-scroll-fade-styles';
  style.textContent = `
    /* Menu options stay inside their scroll area on hover, focus and press.
       Keep glyph and toggle-thumb transforms on their child elements intact. */
    :is(${menuSelector}) :is(button, a, [role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]) {
      transform: none !important;
      translate: none !important;
      scale: none !important;
      filter: none !important;
      box-shadow: none !important;
      transition-property: background-color, border-color, color, opacity !important;
    }
    .hub-menu-panel .hub-toggle-row:not(:disabled):hover {
      background-color: #f5f5f4;
    }
    [data-hub-menu-scroll] {
      --hub-menu-edge-mask: none;
      -webkit-mask-image: var(--hub-menu-edge-mask, none) !important;
      mask-image: var(--hub-menu-edge-mask, none) !important;
    }
    [data-hub-menu-scroll][data-hub-fade-top="true"] {
      --hub-menu-edge-mask: linear-gradient(to bottom, transparent, #000 18px);
    }
    [data-hub-menu-scroll][data-hub-fade-bottom="true"] {
      --hub-menu-edge-mask: linear-gradient(to bottom, #000 calc(100% - 18px), transparent);
    }
    [data-hub-menu-scroll][data-hub-fade-top="true"][data-hub-fade-bottom="true"] {
      --hub-menu-edge-mask: linear-gradient(to bottom, transparent, #000 18px, #000 calc(100% - 18px), transparent);
    }
  `;
  document.head.appendChild(style);

  function setFlag(element, name, value) {
    const next = String(value);
    if (element.getAttribute(name) !== next) element.setAttribute(name, next);
  }

  function updateEdges(element) {
    setFlag(element, 'data-hub-fade-top', element.scrollTop > 1);
    setFlag(element, 'data-hub-fade-bottom', element.scrollTop + element.clientHeight < element.scrollHeight - 1);
  }

  const resizeObserver = new ResizeObserver(schedule);

  function refresh() {
    frame = 0;
    const candidates = new Set();
    for (const menu of document.querySelectorAll(menuSelector)) {
      if (!menu.clientHeight || !menu.getClientRects().length) continue;
      for (const element of [menu, ...menu.querySelectorAll('*')]) {
        if (!element.clientHeight) continue;
        if (/^(auto|scroll)$/.test(getComputedStyle(element).overflowY)) candidates.add(element);
      }
    }
    for (const element of tracked) {
      if (candidates.has(element)) continue;
      resizeObserver.unobserve(element);
      element.removeAttribute('data-hub-menu-scroll');
      element.removeAttribute('data-hub-fade-top');
      element.removeAttribute('data-hub-fade-bottom');
      tracked.delete(element);
    }
    for (const element of candidates) {
      if (!tracked.has(element)) {
        tracked.add(element);
        element.setAttribute('data-hub-menu-scroll', '');
        resizeObserver.observe(element);
      }
      updateEdges(element);
    }
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(refresh);
  }

  function start() {
    const mutations = new MutationObserver(schedule);
    // Our data attributes are deliberately excluded so updating a fade does
    // not trigger another discovery pass. Content, visibility and size changes do.
    mutations.observe(document.body, {
      subtree: true, childList: true, characterData: true, attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'open', 'aria-expanded'],
    });
    document.addEventListener('scroll', event => {
      if (tracked.has(event.target)) updateEdges(event.target);
    }, true);
    window.addEventListener('resize', schedule);
    document.fonts?.ready.then(schedule);
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
