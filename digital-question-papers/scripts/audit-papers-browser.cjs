"use strict";

// Run with Playwright on NODE_PATH and AUDIT_BROWSER set to a local Chromium.
// Uses isolated browser contexts; never touches the pupil's real browser data.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium, webkit } = require("playwright");
const registry = require("../paper-registry.js");
const root = path.resolve(__dirname, "../..");
const out = path.resolve(process.env.AUDIT_OUTPUT || path.join(root, "maintenance/generated/past-paper-audit"));
fs.mkdirSync(out, { recursive: true });
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".m4a": "audio/mp4", ".woff2": "font/woff2", ".ttf": "font/ttf", ".pdf": "application/pdf" };
const server = http.createServer((req, res) => {
  const file = path.resolve(root, "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404).end(); return; }
    // Range support makes actual browser audio seeking testable.
    const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    const start = range ? Number(range[1]) : 0;
    const end = range && range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1;
    res.writeHead(range ? 206 : 200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream", "Content-Length": end - start + 1, "Accept-Ranges": "bytes", ...(range ? { "Content-Range": `bytes ${start}-${end}/${stat.size}` } : {}) });
    fs.createReadStream(file, { start, end }).pipe(res);
  });
});

async function main() {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browserType = process.env.AUDIT_ENGINE === 'webkit' ? webkit : chromium;
  const browser = await browserType.launch({ headless: true, ...(process.env.AUDIT_ENGINE !== 'webkit' && process.env.AUDIT_BROWSER ? { executablePath: process.env.AUDIT_BROWSER } : {}) });
  const result = process.env.AUDIT_RESUME && fs.existsSync(path.join(out, 'browser-checks.json'))
    ? JSON.parse(fs.readFileSync(path.join(out, 'browser-checks.json')))
    : { generatedAt: new Date().toISOString(), origin, engine: process.env.AUDIT_ENGINE || 'chromium', browserVersion: browser.version(), papers: [] };
  const entries = Object.values(registry).filter(e => !process.env.AUDIT_PAPER || e.id === process.env.AUDIT_PAPER);
  try {
    for (const entry of entries) {
      if (process.env.AUDIT_RESUME && result.papers.some(p => p.id === entry.id && !p.errors.length && p.checks.every(c => c.passed))) continue;
      const paper = require(path.join(root, "digital-question-papers", entry.dataFile.split("?")[0]));
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
      const page = await context.newPage();
      page.setDefaultTimeout(5000);
      const item = { id: paper.id, errors: [], failedRequests: [], questions: [], checks: [], notationPending: [] };
      page.on("pageerror", e => item.errors.push(e.message));
      page.on("response", r => { if (r.status() >= 400) item.failedRequests.push({ status: r.status(), url: r.url() }); });
      page.on("console", msg => { if (msg.type() === "error") item.errors.push(msg.text()); });
      const check = (ok, name) => item.checks.push({ name, passed: Boolean(ok) });
      try {
        await page.goto(`${origin}/digital-question-papers/digitalquestionpapers.html?paper=${paper.id}`, { waitUntil: "load" });
        await page.locator("[data-question-heading]").waitFor();
        await page.evaluate(() => document.fonts.ready);
        check(await page.title() === `${paper.title} · Digital Question Papers`, "paper title");
        for (let qi = 0; qi < paper.questions.length; qi++) {
          const q = paper.questions[qi];
          if (qi) await page.locator("[data-next-question]").click();
          const qResult = { id: q.id, parts: [], layout: [], scoreInputs: [], noteTargets: [], audio: null };
          check((await page.locator("[data-question-heading]").textContent()).trim() === `Question ${q.number}`, `${q.id}: next navigation`);
          const card = page.locator("[data-single-question-area] .question-card");
          for (const part of q.subquestions) {
            const section = card.locator(`[data-subquestion="${part.id}"]`);
            const record = { id: part.id, type: part.type, inputsTested: 0, stored: false, pending: null };
            try {
              if (["radio", "checkbox"].includes(part.type)) {
                const inputs = section.locator("input");
                for (let i = 0; i < await inputs.count(); i++) {
                  const input = inputs.nth(i);
                  await input.locator("..").click();
                  record.inputsTested++;
                  // Verify keyboard removal then choose the option again.
                  await input.focus();
                  await input.press("Shift+Delete");
                  check(!(await input.isChecked()), `${part.id}: option ${i} keyboard removal`);
                }
                const targets = part.type === "checkbox" ? part.answers : [part.answer];
                for (const value of targets) await section.locator(`input[value=${JSON.stringify(value)}]`).locator("..").click();
              } else if (part.type === "notation-choice") {
                const buttons = section.locator("button");
                for (let i = 0; i < await buttons.count(); i++) { await buttons.nth(i).click(); record.inputsTested++; }
                record.pending = "Tool buttons exercised; exact score placement/dragging requires a separate notation pass";
                item.notationPending.push(part.id);
              } else {
                let fields = section.locator("input.text-answer, textarea.text-answer, textarea[data-heading]");
                if (part.answerInScore) fields = card.locator(`input[id=${JSON.stringify(part.id)}], textarea[id=${JSON.stringify(part.id)}]`);
                if (part.type === "comparison-grid") {
                  fields = section.locator('input[data-comparison-column]');
                  for (let i = 0; i < await fields.count(); i++) { await fields.nth(i).locator("..").click(); record.inputsTested++; }
                } else {
                  const answers = part.numberedLineAnswers?.map(a => a[0]) || part.acceptedAnswers || [part.answer || "Audit answer"];
                  for (let i = 0; i < await fields.count(); i++) {
                    const field = fields.nth(i);
                    if (!(await field.isVisible())) continue;
                    await field.fill(answers[Math.min(i, answers.length - 1)]);
                    record.inputsTested++;
                  }
                }
              }
              const saved = await page.evaluate(id => window.ExamStorage.loadDraft(id)?.answers, paper.id);
              record.stored = Object.hasOwn(saved || {}, part.id);
              if (!record.inputsTested) record.pending = "No independently editable control found; inspect score binding";
            } catch (err) { record.pending = err.message.split("\n")[0]; }
            qResult.parts.push(record);
          }
          // Score text fields live inside SVG foreignObjects, outside the part's
          // ordinary section. Detect their actual answer binding through storage.
          const scoreInputs = card.locator("input.higher-2015-score-input");
          for (let i = 0; i < await scoreInputs.count(); i++) {
            const input = scoreInputs.nth(i);
            const before = await page.evaluate(id => window.ExamStorage.loadDraft(id)?.answers, paper.id);
            const label = await input.getAttribute("aria-label");
            await input.fill(/chord/i.test(label) ? "V" : /key/i.test(label) ? "C" : `Audit ${i + 1}`);
            const after = await page.evaluate(id => window.ExamStorage.loadDraft(id)?.answers, paper.id);
            const changed = Object.keys(after).filter(key => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
            qResult.scoreInputs.push({ label, changed });
            for (const id of changed) {
              const record = qResult.parts.find(p => p.id === id);
              if (record) { record.inputsTested++; record.stored = true; record.pending = null; }
            }
            check(changed.length > 0, `${q.id}: score input ${label} stores its answer`);
          }
          const noteTargets = card.locator(".q3-note-hit-area");
          for (let i = 0; i < await noteTargets.count(); i++) {
            const target = noteTargets.nth(i);
            const label = await target.getAttribute("aria-label");
            await target.click();
            const element = await target.elementHandle();
            const before = await page.evaluate(id => window.ExamStorage.loadDraft(id)?.answers, paper.id);
            await element.focus();
            await element.press("ArrowUp");
            await element.press("ArrowUp");
            await element.press("Enter");
            let after = await page.evaluate(id => window.ExamStorage.loadDraft(id)?.answers, paper.id);
            let changed = Object.keys(after).filter(key => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
            // A pointer may have already entered exactly the keyboard's chosen
            // pitch. Move down once to distinguish entry from a no-op.
            if (!changed.length && /Missing|Transposed|Enharmonic/i.test(label)) {
              const fallback = await noteTargets.nth(i).elementHandle();
              await fallback.focus(); await fallback.press("ArrowDown"); await fallback.press("Enter");
              after = await page.evaluate(id => window.ExamStorage.loadDraft(id)?.answers, paper.id);
              changed = Object.keys(after).filter(key => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
            }
            qResult.noteTargets.push({ label, pointerTested: true, keyboardChanged: changed });
            if (/Missing|Transposed|Enharmonic/i.test(label)) check(changed.length > 0, `${q.id}: ${label} keyboard places a note`);
            for (const id of changed) {
              const record = qResult.parts.find(p => p.id === id);
              if (record) { record.inputsTested++; record.stored = true; record.pending = "Entry and keyboard tested; exact source pitch/rhythm and every slot still require notation audit"; }
            }
          }
          for (const part of q.subquestions.filter(p => p.notationTool === 'note-entry')) {
            const clear = card.locator(`[data-subquestion="${part.id}"] .notation-clear-button`);
            check(await clear.count() === 1, `${part.id}: missing-note entry offers one Clear control`);
            if (await clear.count()) {
              await clear.click();
              const value = await page.evaluate(({ id, part }) => window.ExamStorage.loadDraft(id)?.answers[part], { id: paper.id, part: part.id });
              check(!value, `${part.id}: Clear removes entered notes from the saved answer`);
            }
          }
          const media = page.locator(".exam-header-audio audio");
          if (await media.count()) {
            try {
              await page.locator('.exam-header-audio [data-audio-action="toggle"]').click();
              await page.waitForFunction(() => [...document.querySelectorAll(".exam-header-audio audio")].some(a => a.currentTime > 0 && !a.paused), { timeout: 5000 });
              qResult.audio = await media.evaluate(a => ({ duration: a.duration, currentTime: a.currentTime, playing: !a.paused, error: a.error?.message || null }));
              await page.locator('.exam-header-audio [data-audio-action="toggle"]').click();
              check(await media.evaluate(a => a.paused), `${q.id}: audio pauses`);
            } catch (err) { qResult.audio = { error: err.message.split("\n")[0] }; }
          }
          // Verify real layout at every requested width, without reflowing the canvas.
          for (const width of [1440, 1024, 390]) {
            await page.setViewportSize({ width, height: 1000 });
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
            const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, missingImages: [...document.images].filter(i => i.offsetWidth && i.complete && !i.naturalWidth).map(i => i.src), invalidSvg: [...document.querySelectorAll("svg")].filter(s => /(?:NaN|Infinity)/.test(s.outerHTML)).length }));
            qResult.layout.push({ viewport: width, ...layout });
          }
          await page.setViewportSize({ width: 1440, height: 1000 });
          await card.screenshot({ path: path.join(out, `${paper.id}-${q.id}.png`), animations: "disabled" });
          item.questions.push(qResult);
        }
        if (paper.id === "advanced-higher-2019") {
          await page.locator('[data-exam-menu-trigger="questions"]').click();
          await page.locator('[data-go-question="q1"]').click();
          const voices = page.locator('[data-subquestion="q1e"] [data-numbered-answer-line]');
          for (let i = 1; i < 4; i++) await voices.nth(i).fill("");
          await voices.first().fill("STBA");
          const wrong = await page.evaluate(id => {
            const part = window.InteractiveExamPapers[id].questions[0].subquestions.find(p => p.id === "q1e");
            const value = window.ExamStorage.loadDraft(id).answers.q1e;
            return { complete: window.ExamEngineCore.answerComplete(part, value), marks: window.ExamMarking.markSubquestion(part, value).marks };
          }, paper.id);
          check(wrong.complete && wrong.marks === 0, "incorrect compact voice order is complete without earning credit");
          await voices.first().fill("Soprano,Tenor,Alto,Bass");
          const inline = await page.evaluate(id => {
            const part = window.InteractiveExamPapers[id].questions[0].subquestions.find(p => p.id === "q1e");
            const value = window.ExamStorage.loadDraft(id).answers.q1e;
            return { complete: window.ExamEngineCore.answerComplete(part, value), marks: window.ExamMarking.markSubquestion(part, value).marks };
          }, paper.id);
          check(inline.complete && inline.marks === 1, "voice order accepts commas and a single-line entry");
          await voices.first().fill("STAB");
          await page.locator('[data-exam-menu-trigger="questions"]').click();
          await page.locator('[data-go-question="q6"]').click();
        }
        // Reload keeps the final question and all pupil-entered answers.
        const before = await page.evaluate(id => window.ExamStorage.loadDraft(id), paper.id);
        await page.reload({ waitUntil: "load" });
        const after = await page.evaluate(id => window.ExamStorage.loadDraft(id), paper.id);
        check(before.currentQuestion === after.currentQuestion, "refresh preserves current question");
        check(JSON.stringify(before.answers) === JSON.stringify(after.answers), "refresh preserves every entered answer");
        await page.locator("[data-previous-question]").click();
        check((await page.locator("[data-question-heading]").textContent()).trim() === `Question ${paper.questions.at(-2).number}`, "previous navigation");
        await page.locator("[data-next-question]").click();
        await page.locator("[data-submit-paper]:visible").first().click();
        await page.locator("[data-cancel-submit]").click();
        check(await page.locator("[data-screen=exam]").isVisible(), "cancel submission retains attempt");
        await page.locator("[data-submit-paper]:visible").first().click();
        await page.locator("[data-confirm-submit]").click();
        await page.locator("[data-screen=results]").waitFor();
        const submitted = await page.evaluate(id => window.ExamStorage.loadSubmitted(id), paper.id);
        check(submitted.status === "submitted" && submitted.result.questionBreakdown.length === paper.questions.length, "submission records every question");
        if (paper.id === "advanced-higher-2019") check(submitted.result.questionBreakdown[0].parts.find(p => p.id === "q1e").marks === 1, "official STAB abbreviation earns its mark after real submission");
        check((await page.locator("[data-current-question-label]").textContent()).trim() === "Question 1", "feedback opens question 1");
        await page.reload({ waitUntil: "load" });
        check(await page.locator("[data-screen=results]").isVisible(), "feedback persists on reload");
        await page.locator('[data-exam-menu-trigger="questions"]').click();
        await page.locator("[data-show-all-questions]").click();
        check(await page.locator("[data-results-paper] .question-card").count() === paper.questions.length, "all marked questions render");
        await page.locator("[data-results-new-attempt]").click();
        await page.locator("[data-cancel-reset]").click();
        check(await page.locator("[data-screen=results]").isVisible(), "cancel retry preserves feedback");
        await page.locator("[data-results-new-attempt]").click();
        await page.locator("[data-confirm-reset]").click();
        // Current flow returns to an unmarked practice attempt.
        check(!(await page.locator("[data-screen=results]").isVisible()), "try again leaves feedback");
      } catch (err) { item.errors.push(err.stack); }
      result.papers.push(item);
      fs.writeFileSync(path.join(out, "browser-checks.json"), JSON.stringify(result, null, 2));
      console.log(paper.id, JSON.stringify({ questions: item.questions.length, parts: item.questions.flatMap(q => q.parts).length, errors: item.errors.length, failedChecks: item.checks.filter(c => !c.passed).length, failedRequests: item.failedRequests.length, pending: item.questions.flatMap(q => q.parts).filter(p => p.pending).length }));
      await context.close();
    }
  } finally { await browser.close(); server.close(); }
  process.exitCode = result.papers.some(p => p.errors.length || p.failedRequests.length || p.checks.some(c => !c.passed)) ? 1 : 0;
}
if (require.main === module) main().catch(err => { console.error(err); server.close(); process.exitCode = 1; });
module.exports = { server, root };
