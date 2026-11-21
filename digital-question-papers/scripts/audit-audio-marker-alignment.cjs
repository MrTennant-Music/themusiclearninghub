'use strict';
// Real rendered label/line alignment, hit areas and fixed time labels. No listening.
const fs = require('node:fs');
const path = require('node:path');
const {chromium, webkit} = require('playwright');
const {server, root} = require('./audit-papers-browser.cjs');
const registry = require('../paper-registry');
const output = path.resolve(process.env.AUDIT_OUTPUT || 'maintenance/generated/past-paper-marker-alignment');
const widths = (process.env.AUDIT_WIDTHS || '1333,768,390').split(',').map(Number);
const phases = (process.env.AUDIT_PHASES || 'practice,feedback').split(',');

(async () => {
  fs.mkdirSync(output, {recursive: true});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const engine = process.env.AUDIT_ENGINE || 'chromium';
  const browser = await (engine === 'webkit' ? webkit : chromium).launch({headless: true,
    ...(engine !== 'webkit' && process.env.AUDIT_BROWSER ? {executablePath: process.env.AUDIT_BROWSER} : {})});
  const result = {engine, browserVersion: browser.version(), scope: 'Actual label centres aligned with exact cue ticks; non-overlapping two-dimensional hit areas, click targets, fixed time labels and complete inventories. Practice and submitted feedback at fixed desktop/fitted mobile canvas widths. No listening or physical/native Safari/VoiceOver certification.', papers: []};
  try {
    for (const entry of Object.values(registry).filter(e => !process.env.AUDIT_PAPER_PREFIX || e.id.startsWith(process.env.AUDIT_PAPER_PREFIX))) {
      const paper = require(path.join(root, 'digital-question-papers', entry.dataFile.split('?')[0]));
      const item = {id: entry.id, views: [], errors: []};
      result.papers.push(item);
      for (const width of widths) {
        const context = await browser.newContext({viewport: {width, height: 1024}, isMobile: width < 1280, hasTouch: width < 1280, reducedMotion: 'reduce'});
        const page = await context.newPage();
        page.on('pageerror', error => item.errors.push(error.message));
        try {
          await page.goto(`http://127.0.0.1:${server.address().port}/digital-question-papers/digitalquestionpapers.html?paper=${entry.id}`);
          await page.evaluate(() => document.fonts.ready);
          for (const phase of phases) {
            if (phase === 'feedback') {
              await page.locator('[data-submit-paper]:visible').first().click();
              await page.locator('[data-confirm-submit]').click();
              await page.locator('[data-screen=results]').waitFor();
            }
            for (let qi = 0; qi < paper.questions.length; qi++) {
              if (qi) await page.locator('[data-next-question]').first().click();
              await page.waitForFunction(() => Number.isFinite(document.querySelector('.exam-header-audio audio')?.duration));
              const player = page.locator('.exam-header-audio [data-audio-player]');
              await page.mouse.move(0, 0);
              await page.evaluate(() => document.activeElement?.blur());
              const before = await player.locator('[data-elapsed],[data-duration]').evaluateAll(ns => ns.map(n => n.getBoundingClientRect().top));
              await player.locator('[data-audio-action=toggle]').focus();
              await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
              const view = await player.evaluate((n, before) => {
                const row = n.querySelector('.audio-markers'), bounds = row.getBoundingClientRect(), scale = bounds.width / row.clientWidth;
                const times = [...n.querySelectorAll('[data-elapsed],[data-duration]')].map(n => n.getBoundingClientRect());
                const header = n.closest('.exam-header').getBoundingClientRect();
                const paper = [...document.querySelectorAll('[data-single-question-area], [data-results-paper]')]
                  .find(element => element.getClientRects().length)?.getBoundingClientRect();
                const duration = n.querySelector('audio').duration;
                const checks = [], check = (passed, name) => checks.push({passed: Boolean(passed), name});
                const buttons = [...row.querySelectorAll('[data-marker-time]')].map(b => {
                  const r = b.getBoundingClientRect(), tick = r.left + r.width / 2 + parseFloat(getComputedStyle(b).getPropertyValue('--audio-marker-tick-offset') || '0') * scale;
                  const line = getComputedStyle(b, '::after');
                  const lineY = r.top + (parseFloat(line.top) + parseFloat(line.height) / 2) * scale;
                  const expected = bounds.left + Number(b.dataset.markerTime) / duration * bounds.width;
                  check(Math.abs((r.left + r.width / 2) - expected) < .7, `${b.textContent}: label centre aligned to source timestamp`);
                  check(Math.abs(tick - expected) < .7, `${b.textContent}: line aligned to source timestamp`);
                  check(r.width / scale >= 23.9, `${b.textContent}: minimum hit width preserved`);
                  check(r.left >= times[0].right - .05 * scale && r.right <= times[1].left + .05 * scale, `${b.textContent}: label clear of both time controls`);
                  check(b.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)), `${b.textContent}: visible label receives input`);
                  check(b.contains(document.elementFromPoint(tick, lineY)), `${b.textContent}: marker line receives its own input`);
                  return {label: b.textContent, time: Number(b.dataset.markerTime), x: r.left, right: r.right, top: r.top, bottom: r.bottom, centre: r.left + r.width / 2, expected, tick, row: Number(b.dataset.markerRow || 0)};
                });
                buttons.forEach((b, i) => buttons.slice(0, i).forEach((a, j) => {
                  check(b.x >= a.right + .5 || a.x >= b.right + .5 || b.top >= a.bottom + .5 || a.top >= b.bottom + .5, `markers ${j}/${i}: hit areas do not overlap`);
                }));
                check(times.every((r, i) => Math.abs(r.top - before[i]) < .1), 'opening markers keeps both time labels fixed');
                if (paper) check(paper.top >= header.bottom, 'expanded header stays clear of the paper');
                return {buttons, rowCount: Number(row.dataset.markerRows || 1), headerBottom: header.bottom, paperTop: paper?.top, checks};
              }, before);
              const expected = paper.questions[qi].audio.clips[0].markers;
              view.checks.push({passed: JSON.stringify(view.buttons.map(b => ({label: b.label, time: b.time}))) === JSON.stringify(expected), name: 'complete current marker inventory'});
              item.views.push({width, phase, questionId: paper.questions[qi].id, ...view});
              if (width === 1333 && phase === 'practice' && paper.questions[qi].id === 'q6' && entry.id.startsWith('advanced-higher')) {
                await player.screenshot({path: path.join(output, `${entry.id}-q6.png`)});
              }
            }
          }
        } catch (error) { item.errors.push(`${width}: ${error.stack}`); }
        finally { await context.close(); }
      }
      console.log(item.id, item.views.length, 'views', item.views.flatMap(v => v.checks).filter(c => !c.passed).length, 'failed', item.errors.length, 'errors');
    }
  } finally { await browser.close(); server.close(); }
  fs.writeFileSync(path.join(output, 'alignment.json'), JSON.stringify(result, null, 2) + '\n');
  process.exitCode = result.papers.some(p => p.errors.length || p.views.some(v => v.checks.some(c => !c.passed))) ? 1 : 0;
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
