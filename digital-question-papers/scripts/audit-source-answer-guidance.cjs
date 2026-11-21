'use strict';
const fs = require('node:fs'), path = require('node:path');
const { chromium, webkit } = require('playwright');
const { server, root } = require('./audit-papers-browser.cjs');
const { cases } = require('../tests/fixtures/source-answer-guidance-a175.json');
const axePath = require.resolve('axe-core/axe.min.js');
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const engine = process.env.AUDIT_ENGINE || 'chromium';
  const browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true, ...(engine === 'webkit' ? {} : { executablePath: process.env.AUDIT_BROWSER }) });
  const result = { engine, scope: 'Independently source-read cases entered through actual pupil fields, confirmed with the question controls, checked for written feedback, announced marks and WCAG violations. Isolated local drafts only; no physical-screen-reader claim.', cases: [], errors: [] };
  const out = path.resolve(process.env.AUDIT_RESULTS_FILE);
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
  const page = await context.newPage(); page.setDefaultTimeout(10000);
  await page.addInitScript(() => { localStorage.clear(); sessionStorage.clear(); });
  page.on('pageerror', error => result.errors.push(error.message));
  try {
    for (const item of cases) {
      const paper = require('../papers/' + item.paper), question = paper.questions.find(q => q.subquestions.some(part => part.id === item.part));
      const part = question.subquestions.find(part => part.id === item.part), record = { ...item, checks: [], errors: [] };
      const check = (passed, name) => record.checks.push({ passed: Boolean(passed), name });
      try {
        await page.goto(`http://127.0.0.1:${server.address().port}/digital-question-papers/digitalquestionpapers.html?paper=${paper.id}`);
        await page.locator('[data-exam-menu-trigger="questions"]').click();
        await page.locator(`[data-go-question="${question.id}"]`).click();
        const value = typeof item.value === 'object' ? item.value.final : item.value;
        const field = typeof item.value === 'object'
          ? page.locator(`[data-subquestion="${item.part}"] [data-final-answer-line]`).first()
          : item.paper === 'higher-2017' ? page.getByRole('textbox', { name: 'Answer for part (c), value in bar 5', exact: true })
          : item.paper === 'advanced-higher-2017' ? page.getByRole('textbox', { name: 'Chord', exact: true })
          : page.locator(`input[id="${item.part}"]`);
        if (item.paper === 'advanced-higher-2024' && item.part === 'q2b' || item.paper === 'advanced-higher-2026' && item.part === 'q2c') {
          const values = value.split(',').map(value => value.trim());
          for (let index = 0; index < values.length; index++) {
            const chord = item.paper === 'advanced-higher-2024'
              ? page.getByRole('textbox', { name: `Chord ${index + 1} in bar 11`, exact: true })
              : page.getByRole('textbox', { name: `Chord in bar ${index + 34}`, exact: true });
            await chord.fill(values[index]); await chord.press('Tab');
          }
        } else { await field.fill(value); await field.press('Tab'); }
        const stored = await page.evaluate(({ id, part }) => ExamStorage.loadDraft(id).answers[part], { id: paper.id, part: item.part });
        check(String(typeof stored === 'object' ? stored.final : stored).trim() === value.trim(), 'Actual field input persists without changing its meaning');
        await page.locator('[data-check-question]').click();
        await page.locator('[data-confirm-check-question]').click();
        await page.locator('.is-practice-checked').waitFor();
        const heading = page.locator('[data-single-question-area] [data-question-heading]');
        record.announcedResult = await heading.getAttribute('aria-label');
        check(record.announcedResult === `Question ${question.number} checked. ${item.marks} of ${question.marks} marks. Feedback follows each answer.`, 'Focused question summary announces the source-expected mark');
        const feedback = page.locator(`[data-feedback-for="${item.part}"]`);
        record.feedback = await feedback.getAttribute('aria-label');
        const status = item.marks === part.marks ? 'Correct' : item.marks > 0 ? 'Partially correct' : 'Incorrect';
        check(record.feedback.endsWith(': ' + status), 'Feedback provides the correct written status');
        await page.addScriptTag({ path: axePath });
        record.violations = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })));
        check(record.violations.length === 0, 'Changed answer feedback has no reported WCAG violations');
      } catch (error) { record.errors.push(error.stack || String(error)); }
      result.cases.push(record); fs.writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
      console.log(item.paper, item.part, record.checks.filter(c => !c.passed).length, 'failed checks;', record.errors.length, 'errors');
    }
  } finally { await context.close(); await browser.close(); server.close(); }
  process.exitCode = result.errors.length || result.cases.some(c => c.errors.length || c.checks.some(c => !c.passed)) ? 1 : 0;
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
