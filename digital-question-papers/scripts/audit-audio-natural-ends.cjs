'use strict';
// Seek near each track's end, then let the browser emit its own ended event.
// This checks real media transitions, not complete listening or real-time exams.
const fs = require('node:fs'), path = require('node:path');
const { chromium, webkit } = require('playwright');
const { server, root } = require('./audit-papers-browser.cjs');
const registry = require('../paper-registry');
const out = path.resolve(process.env.AUDIT_OUTPUT || 'maintenance/generated/past-paper-natural-audio-ends');
fs.mkdirSync(out, { recursive: true });

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const engine = process.env.AUDIT_ENGINE || 'chromium';
  const browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true,
    ...(engine !== 'webkit' && process.env.AUDIT_BROWSER ? { executablePath: process.env.AUDIT_BROWSER } : {}) });
  const result = { engine, browserVersion: browser.version(),
    scope: 'Actual trusted native ended events after programmatic seeks to the final 0.6 seconds, at normal playback rate. All recorded tracks start and advance/unlock in order. Not a complete listening or real-time timer test.', papers: [] };
  try {
    for (const entry of Object.values(registry).filter(e => !process.env.AUDIT_PAPER || process.env.AUDIT_PAPER.split(',').includes(e.id))) {
      const paper = require(path.join(root, 'digital-question-papers', entry.dataFile.split('?')[0]));
      const item = { id: paper.id, ends: [], checks: [], errors: [], failedRequests: [] };
      const check = (passed, name) => item.checks.push({ passed: Boolean(passed), name });
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
      const page = await context.newPage(); page.setDefaultTimeout(15000);
      page.on('pageerror', e => item.errors.push(e.message));
      page.on('response', r => { if (r.status() >= 400) item.failedRequests.push({ status: r.status(), url: r.url() }); });
      try {
        await page.goto(`http://127.0.0.1:${server.address().port}/digital-question-papers/digitalquestionpapers.html?paper=${entry.id}`, { waitUntil: 'load' });
        await page.locator('[data-exam-menu-trigger="customise"]').click();
        await page.locator('[data-mode-option="exam"]').click();
        await page.locator('[data-start-attempt]').click();
        for (let index = 0; index < paper.questions.length; index++) {
          await page.waitForFunction(n => {
            const a = document.querySelector('.exam-header-audio audio');
            return a && !a.paused && a.currentTime > 0 && Number.isFinite(a.duration) &&
              document.querySelector('.exam-header-audio [data-play-label]').textContent.trim() === `Question ${n}`;
          }, index + 1);
          const state = await page.evaluate(() => ({
            source: document.querySelector('.exam-header-audio audio').currentSrc,
            locks: [...document.querySelectorAll('[data-all-question]')].map(c => c.inert),
            markerCount: document.querySelectorAll('.exam-header-audio [data-marker-time]:enabled').length,
            submit: [...document.querySelectorAll('[data-submit-paper]')].some(n => n.offsetParent),
            timer: document.querySelector('[data-toolbar-duration]').textContent,
            playing: [...document.querySelectorAll('audio')].filter(a => !a.paused).length
          }));
          check(state.source.endsWith(encodeURI(paper.questions[index].audio.clips[0].file.replace('../', '/'))), `${index}: correct audio file`);
          check(state.locks.every((locked, qi) => locked === (qi > index)), `${index}: only available questions unlocked`);
          check(state.markerCount === 0 && state.submit === (index === paper.questions.length - 1), `${index}: exam seeking and submit restrictions`);
          check(state.playing === 1 && state.timer.length > 0, `${index}: one player and active timer`);
          const ended = await page.locator('.exam-header-audio audio').evaluate(audio => new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Native media end did not arrive')), 12000);
            audio.addEventListener('ended', event => { clearTimeout(timeout); resolve({ trusted: event.isTrusted,
              ended: audio.ended, time: audio.currentTime, duration: audio.duration, paused: audio.paused,
              error: audio.error?.message || null }); }, { once: true });
            audio.currentTime = Math.max(0, audio.duration - .6);
          }));
          item.ends.push({ question: paper.questions[index].id, state, ...ended });
          check(ended.trusted && ended.ended && ended.paused && !ended.error && Math.abs(ended.time - ended.duration) < .05, `${index}: trusted native end at full duration`);
        }
        check(await page.locator('[data-screen="exam"]').isVisible(), 'last track ends with paper available for submission');
      } catch (error) { item.errors.push(error.stack || error.message); }
      await context.close();
      result.papers.push(item);
      fs.writeFileSync(path.join(out, 'natural-ends.json'), JSON.stringify(result, null, 2) + '\n');
      console.log(entry.id, 'ends', item.ends.length, 'failures', item.checks.filter(c => !c.passed).length, 'errors', item.errors.length);
    }
  } finally { await browser.close(); server.close(); }
  process.exitCode = result.papers.some(p => p.errors.length || p.failedRequests.length || p.checks.some(c => !c.passed)) ? 1 : 0;
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
