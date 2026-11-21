/* One appearance for existing overlay dismissal glyphs; never adds close buttons. */
(function () {
  'use strict';
  const MLH = window.MLH = window.MLH || {};
  if (MLH.closeControls) return;
  const selector = 'button,[role="button"]';
  function isCloseControl(button) {
    const label = button.getAttribute('aria-label') || '';
    const hint = [label, button.getAttribute('title') || '', (button.getAttribute('class') || '').replace(/\bmlh-close-control\b/g, ''), button.hasAttribute('data-close') ? 'close' : ''].join(' ');
    const known = button.matches('.close-btn,.ig-modal-close,.exam-modal-close,.modal-close,.dialog-close');
    const glyph = /^[×✕✖⨯x]$/i.test(button.textContent.trim());
    const icon = !button.textContent.trim() && button.querySelector('svg,img');
    return Boolean((known || /\b(close|dismiss)\b/i.test(hint)) && (glyph || icon));
  }
  function update(button) {
    const close = isCloseControl(button);
    if (button.classList.contains('mlh-close-control') !== close) button.classList.toggle('mlh-close-control', close);
    if (close && !button.getAttribute('aria-label')) button.setAttribute('aria-label', button.getAttribute('title') || 'Close');
  }
  function scan(node) {
    const element = node.nodeType === 1 ? node : node.parentElement;
    if (!element) return;
    const parent = element.closest(selector);
    if (parent) update(parent);
    element.querySelectorAll(selector).forEach(update);
  }
  MLH.closeControls = { isCloseControl, scan };
  const style = document.createElement('style');
  style.id = 'mlh-close-controls-style';
  style.textContent = `
    :root body .mlh-close-control {
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
      box-sizing:border-box!important;flex-shrink:0!important;width:40px!important;height:40px!important;
      min-width:40px!important;min-height:40px!important;padding:0!important;border:0!important;
      border-radius:9999px!important;background:#f1f5f9!important;color:#000!important;
      font-size:0!important;line-height:1!important;cursor:pointer!important;
      box-shadow:none!important;transform:none;filter:none;
      transition:transform .08s ease,filter .08s ease,background-color .12s ease,box-shadow .12s ease!important;
    }
    :root body .mlh-close-control>*{display:none!important}
    :root body .mlh-close-control::before{content:'×';display:block;color:#000;font:500 24px/1 Arial,sans-serif}
    :root body .mlh-close-control:focus-visible{outline:2px solid #000!important;outline-offset:2px!important}
    @media(hover:hover) and (pointer:fine){
      :root body .mlh-close-control:not(:disabled):hover{background:#e2e8f0!important;transform:translateY(-1px) scale(1.01)!important;filter:brightness(1.08)!important;box-shadow:0 6px 18px rgba(0,0,0,.08)!important}
    }
    :root body .mlh-close-control:not(:disabled):active{transform:scale(.96)!important;filter:brightness(.92)!important;box-shadow:none!important}
    @media(prefers-reduced-motion:reduce){:root body .mlh-close-control{transition:none!important}}
  `;
  document.head.appendChild(style);
  function start() {
    scan(document.body);
    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'childList') {
          record.addedNodes.forEach(scan);
          if (record.target.matches?.(selector)) update(record.target);
        } else scan(record.target);
      }
    });
    observer.observe(document.body, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['aria-label','title'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
