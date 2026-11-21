'use strict';
// Real input for every offered National 5 repeat/bar-label position. Musical
// acceptance comes from the separately source-reviewed paper data and fixtures.
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const { server, root } = require('./audit-papers-browser.cjs');
const registry = require('../paper-registry');
const marking = require('../exam-marking');
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const engine = process.env.AUDIT_ENGINE || 'chromium';
  const browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true, ...(engine !== 'webkit' && process.env.AUDIT_BROWSER ? { executablePath: process.env.AUDIT_BROWSER } : {}) });
  const result = { engine, browserVersion: browser.version(), touchWidth: process.env.AUDIT_ROUTE === 'touch' ? Number(process.env.AUDIT_TOUCH_WIDTH || 390) : undefined, scope: 'Every offered National 5 repeat-sign/bar-label bar target: recorded keyboard/pointer/native-touch routes, entry, source-reviewed marking, one-use disarming and removal. Hover previews are checked on keyboard/pointer routes. This does not cover every notation tool or physical devices.', parts: [] };
  const output = path.resolve(process.env.AUDIT_RESULTS_FILE || `digital-question-papers/audit/2026-11-05/${engine === 'webkit' ? 'webkit-' : ''}n5-placement-alternatives.json`);
  try {
    for (const entry of Object.values(registry).filter(e => e.id.startsWith('national5-'))) {
      const paper = require(path.join(root, 'digital-question-papers', entry.dataFile.split('?')[0]));
      for (const question of paper.questions) for (const part of question.subquestions.filter(s => ['repeat-sign', 'bar-label'].includes(s.notationTool))) {
        const item = { paper: entry.id, part: part.id, positions: [], checks: [], errors: [] };
        const check = (passed, name) => item.checks.push({ passed: Boolean(passed), name });
        for (const route of (process.env.AUDIT_ROUTE || 'keyboard,pointer').split(',')) {
          const touch = route === 'touch';
          const context = await browser.newContext({ viewport: touch ? { width: Number(process.env.AUDIT_TOUCH_WIDTH || 390), height: 1024 } : { width: 1440, height: 1100 }, hasTouch: touch, reducedMotion: 'reduce' });
          const page = await context.newPage(); page.setDefaultTimeout(5000);
          page.on('pageerror', error => item.errors.push(error.message));
          try {
            await page.goto(`http://127.0.0.1:${server.address().port}/digital-question-papers/digitalquestionpapers.html?paper=${entry.id}`);
            await page.evaluate(() => document.fonts.ready);
            await page.locator('[data-exam-menu-trigger="questions"]').click();
            await page.locator(`[data-go-question="${question.id}"]`).click();
            const repeat = part.notationTool === 'repeat-sign';
            const targets = page.locator(repeat ? '.q3-repeat-hit-area' : '.q3-bar-label-hit-area');
            const preview = page.locator(repeat ? '.q3-repeat-preview' : '.q3-bar-label-preview');
            const tool = page.locator(`[data-subquestion="${part.id}"] .notation-tool-button`).first();
            const count = await targets.count(); check(count > 0, `${route}: has offered bar targets`);
            const value = () => page.evaluate(({ id, part }) => ExamStorage.loadDraft(id).answers[part], { id: entry.id, part: part.id });
            const tap = async locator => {
              await locator.evaluate(n => n.scrollIntoView({ block: 'center', behavior: 'instant' }));
              await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
              if (engine !== 'webkit') return locator.tap();
              const point = await locator.evaluate(n => { const r = n.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2, v = visualViewport; if (!n.contains(document.elementFromPoint(x,y))) throw new Error('Visible N5 placement target is obstructed'); return { x: (x-v.offsetLeft)*v.scale, y: (y-v.offsetTop)*v.scale }; });
              return page.touchscreen.tap(point.x,point.y);
            };
            for (let index = 0; index < count; index++) {
              const target = targets.nth(index), label = await target.getAttribute('aria-label');
              if (route === 'keyboard') { await tool.focus(); await tool.press('Enter'); }
              else if (touch) await tap(tool); else await tool.click();
              await target.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
              if (!touch) {
                if (route === 'keyboard') await target.focus(); else await target.hover();
                check(await preview.count() > 0, `${route} bar ${index + 1}: faint preview appears`);
                if (await preview.count()) check(await preview.first().evaluate(node => { const opacity = Number(node.getAttribute('opacity') || getComputedStyle(node).opacity); return opacity > 0 && opacity < 1; }), `${route} bar ${index + 1}: preview is subdued`);
              }
              if (route === 'keyboard') await target.press('Enter'); else if (touch) await tap(target); else await target.click();
              const entered = await value(), expected = `${repeat ? 'end-' : ''}bar-${index + 1}`;
              item.positions.push({ route, label, value: entered, marks: marking.markSubquestion(part, entered).marks });
              check(entered === expected, `${route} bar ${index + 1}: stores exactly the chosen bar`);
              const accepted = [part.answer, ...(part.acceptedAnswers || [])].includes(expected);
              check(marking.markSubquestion(part, entered).marks === (accepted ? part.marks : 0), `${route} bar ${index + 1}: source-reviewed position marking`);
              check(await tool.getAttribute('aria-pressed') === 'false', `${route} bar ${index + 1}: placement disarms the tool`);
              const removal = repeat ? tool : targets.nth(index);
              if (touch) { await tap(tool); await tap(tool); } else { await removal.focus(); await removal.press('Shift+Delete'); }
              check(!await value(), `${route} bar ${index + 1}: ${touch ? "double-tap" : "keyboard"} removal empties the answer`);
            }
          } catch (error) { item.errors.push(`${route}: ${error.stack || error}`); }
          finally { await context.close(); }
        }
        result.parts.push(item); fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
        console.log(item.paper, item.part, JSON.stringify({ positions: item.positions.length, failed: item.checks.filter(c => !c.passed), errors: item.errors }));
      }
    }
  } finally { await browser.close(); server.close(); }
  process.exitCode = result.parts.some(r => r.errors.length || r.checks.some(c => !c.passed)) ? 1 : 0;
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
