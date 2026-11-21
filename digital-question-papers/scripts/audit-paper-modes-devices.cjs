"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { chromium, webkit } = require("playwright");
const registry = require("../paper-registry.js");
const { server, root } = require("./audit-papers-browser.cjs");
const out = path.resolve(process.env.AUDIT_OUTPUT || "maintenance/generated/past-paper-devices");
fs.mkdirSync(out, { recursive: true });

async function main() {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browserType = process.env.AUDIT_ENGINE === 'webkit' ? webkit : chromium;
  const browser = await browserType.launch({ headless: true, ...(process.env.AUDIT_ENGINE !== 'webkit' && process.env.AUDIT_BROWSER ? { executablePath: process.env.AUDIT_BROWSER } : {}) });
  const results = { generatedAt: new Date().toISOString(), engine: process.env.AUDIT_ENGINE || 'chromium', browserVersion: browser.version(), note: "Browser emulation, not a physical iPad or native Safari session. Exam clip boundaries are advanced with synthetic ended events; this is not a full listening pass.", touchMethod: process.env.AUDIT_ENGINE === 'webkit' ? 'Native touchscreen taps converted from layout CSS coordinates to the fitted visual viewport. Target hit checked before input and next question checked afterwards. A minimal independent fixed-viewport page reproduces this WebKit automation coordinate issue.' : 'Playwright locator.tap', papers: [] };
  try {
    for (const entry of Object.values(registry).filter(e => !process.env.AUDIT_PAPER || e.id === process.env.AUDIT_PAPER)) {
      const paper = require(path.join(root, "digital-question-papers", entry.dataFile.split("?")[0]));
      const item = { id: entry.id, devices: [], exam: { checks: [], errors: [] } };
      const url = `${origin}/digital-question-papers/digitalquestionpapers.html?paper=${entry.id}`;
      for (const [name, width, height] of [["iPad portrait", 768, 1024], ["phone portrait", 390, 844]]) {
        const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: "reduce" });
        const page = await context.newPage(); page.setDefaultTimeout(7000);
        const device = { name, width, questions: [], errors: [] };
        page.on("pageerror", e => device.errors.push(e.message));
        try {
          await page.goto(url, { waitUntil: "load" });
          for (let i = 0; i < paper.questions.length; i++) {
            if (i) {
              const next = page.locator("[data-next-question]");
              if (process.env.AUDIT_ENGINE === 'webkit') {
                await next.scrollIntoViewIfNeeded();
                const point = await next.evaluate(n => {
                  const r=n.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,v=visualViewport;
                  if(!n.contains(document.elementFromPoint(x,y)))throw new Error('The visible Next button is genuinely obstructed');
                  return{x:(x-v.offsetLeft)*v.scale,y:(y-v.offsetTop)*v.scale};
                });
                await page.touchscreen.tap(point.x,point.y);
              } else await next.tap();
              await page.waitForFunction(number=>document.querySelector('[data-question-heading]').textContent.trim()===`Question ${number}`,paper.questions[i].number);
            }
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
            device.questions.push(await page.evaluate(() => ({ heading: document.querySelector("[data-question-heading]").textContent.trim(), viewport: innerWidth, scale: visualViewport.scale, canvasZoom: getComputedStyle(document.body).zoom, clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth })));
          }
          await page.screenshot({ path: path.join(out, `${entry.id}-${width}.png`) });
        } catch (err) { device.errors.push(err.message); }
        item.devices.push(device);
        await context.close();
      }
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
      const page = await context.newPage(); page.setDefaultTimeout(10000);
      const check = (condition, name) => item.exam.checks.push({ name, passed: Boolean(condition) });
      page.on("pageerror", e => item.exam.errors.push(e.message));
      try {
        await page.goto(url, { waitUntil: "load" });
        await page.locator('[data-exam-menu-trigger="customise"]').click();
        await page.locator('[data-mode-option="exam"]').click();
        check(await page.locator("[data-start-overlay]").isVisible(), "exam information opens");
        await page.locator("[data-cancel-start-button]").click();
        check(await page.locator("[data-screen=exam]").isVisible(), "cancel exam retains practice");
        await page.locator('[data-exam-menu-trigger="customise"]').click();
        await page.locator('[data-mode-option="exam"]').click();
        await page.locator("[data-start-attempt]").click();
        await page.waitForFunction(() => document.querySelector(".exam-header-audio audio")?.currentTime > 0);
        check(await page.locator("[data-toolbar-duration]").isVisible(), "exam timer visible");
        check((await page.locator("[data-toolbar-duration]").textContent()).startsWith(String(paper.estimatedMinutes - 1)) || (await page.locator("[data-toolbar-duration]").textContent()) === `${paper.estimatedMinutes}:00`, "paper-specific duration");
        const locks = await page.locator("[data-all-question]").evaluateAll(cards => cards.map(c => c.inert));
        check(locks[0] === false && locks.slice(1).every(Boolean), "future questions locked");
        check(await page.locator("[data-submit-paper]:visible").count() === 0, "submit hidden until last question");
        check(await page.locator(".exam-header-audio [data-marker-time]:enabled").count() === 0, "exam marker seeking unavailable");
        for (let i = 1; i < paper.questions.length; i++) {
          // Exercise the real audio-sequence callback without waiting hours.
          await page.locator(".exam-header-audio audio").evaluate(audio => audio.dispatchEvent(new Event("ended")));
          await page.waitForFunction(n => document.querySelector(".exam-header-audio [data-play-label]")?.textContent.trim() === `Question ${n}`, i + 1);
          await page.waitForFunction(() => { const audio = document.querySelector(".exam-header-audio audio"); return audio && !audio.paused && audio.currentTime > 0; });
          const unlocked = await page.locator(`[data-all-question="${paper.questions[i].id}"]`).evaluate(card => !card.inert);
          check(unlocked, `${paper.questions[i].id}: clip start unlocks question`);
        }
        check(await page.locator("[data-submit-paper]:visible").count() > 0, "submit appears for last question");
        await page.locator("[data-submit-paper]:visible").first().click();
        check((await page.locator("[data-submit-message]").textContent()).includes("not fully answered"), "blank submission warns");
        await page.locator("[data-confirm-submit]").click();
        await page.locator("[data-screen=results]").waitFor();
        check((await page.locator("[data-results-score] .result-score-earned").textContent()) === "0", "blank exam scores zero");
        for (const stat of ["best", "weakest"]) check((await page.locator(`[data-results-${stat}-question]`).textContent()).includes("–"), `zero-score ${stat} is a dash`);
        await page.locator("[data-share-feedback]").click();
        await page.locator("[data-share-name-input]").fill("Audit pupil");
        await page.locator("[data-cancel-share-name]").click();
        check(await page.locator("[data-screen=results]").isVisible(), "cancel share retains feedback");
        await page.reload({ waitUntil: "load" });
        check(await page.locator("[data-screen=results]").isVisible(), "submitted exam restores feedback");
      } catch (err) { item.exam.errors.push(err.message); }
      await context.close();
      results.papers.push(item);
      fs.writeFileSync(path.join(out, "devices-and-modes.json"), JSON.stringify(results, null, 2));
      console.log(entry.id, JSON.stringify({ mobileQuestions: item.devices.reduce((n, d) => n + d.questions.length, 0), deviceErrors: item.devices.flatMap(d => d.errors).length, examErrors: item.exam.errors.length, failedChecks: item.exam.checks.filter(c => !c.passed).length }));
    }
  } finally { await browser.close(); server.close(); }
  process.exitCode = results.papers.some(p => p.exam.errors.length || p.exam.checks.some(c => !c.passed) || p.devices.some(d => d.errors.length || d.questions.some(q => q.scrollWidth > q.clientWidth + 1))) ? 1 : 0;
}
main().catch(err => { console.error(err); server.close(); process.exitCode = 1; });
