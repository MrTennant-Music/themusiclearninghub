'use strict';
// Match source fragments to real visible paper text, checking regular as well
// as emphasised characters. Repeats with conflicting source styles stay triage.
const fs = require('node:fs'), path = require('node:path');
const { chromium, webkit } = require('playwright');
const { server, root } = require('./audit-papers-browser.cjs');
const source = require('../tests/fixtures/source/fine-source-typography.json');
const registry = require('../paper-registry');
const sourceSegments = require('../tests/fixtures/source/source-fragment-segments.json').rows;
const out = path.resolve(process.env.AUDIT_RESULTS_FILE || 'digital-question-papers/audit/2026-11-05/fine-source-typography-browser.json');

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const engine = process.env.AUDIT_ENGINE || 'chromium';
  const browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true, ...(engine === 'webkit' ? {} : { executablePath: process.env.AUDIT_BROWSER }) });
  const result = { engine, phase: process.env.AUDIT_FEEDBACK ? 'submitted feedback' : 'Practice', scope: 'Independent source-character bold/regular/italic versus actual visible browser text. Unique source-style fragments compare every matching DOM occurrence; conflicting repeated source styles remain explicitly ambiguous. Unmatched/adapted/short text and fine layout require separate review.', papers: [] };
  try {
    for (const record of source.papers.filter(p => !process.env.AUDIT_PAPER || process.env.AUDIT_PAPER.split(',').includes(p.id))) {
      const paper = require(path.resolve(root, 'digital-question-papers', registry[record.id].dataFile.split('?')[0]));
      const item = { id: record.id, questions: [], errors: [] };
      const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      page.on('pageerror', e => item.errors.push(e.message));
      try {
        await page.goto(`http://127.0.0.1:${server.address().port}/digital-question-papers/digitalquestionpapers.html?paper=${record.id}`);
        if (process.env.AUDIT_FEEDBACK) {
          await page.locator('[data-exam-menu-trigger="questions"]').click();
          await page.locator(`[data-go-question="${paper.questions.at(-1).id}"]`).click();
          await page.locator('[data-submit-paper]:visible').first().click();
          await page.locator('[data-confirm-submit]').click();
          await page.locator('[data-screen="results"]').waitFor();
        }
        for (const question of paper.questions) {
          await page.locator('[data-exam-menu-trigger="questions"]').click();
          await page.locator(`[data-go-question="${question.id}"]`).click();
          await page.evaluate(() => document.fonts.ready);
          const evidence = await page.evaluate(rows => {
            const normal = s => s.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g, '');
            let text = '';
            const bold = [], italic = [], families = [], containers = [], roles = [], lyricGroups = new Map();
            const card = [...document.querySelectorAll('.question-card')].find(n => n.getClientRects().length && getComputedStyle(n).visibility !== 'hidden');
            if (!card) throw new Error('No visible paper card');
            const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
            let node;
            while ((node = walker.nextNode())) {
              const parent = node.parentElement;
              if (!parent.getClientRects().length || getComputedStyle(parent).visibility === 'hidden' || parent.closest('.visually-hidden,script,style,button,input,textarea,.exam-paper-toolbar,.question-actions,.inline-answer-feedback')) continue;
              const value = normal(node.textContent), style = getComputedStyle(parent);
              if (parent.closest('.q3-score-lyrics,.q3-lyric')) {
                const svg = parent.closest('svg');
                if (!lyricGroups.has(svg)) lyricGroups.set(svg, { text: '', bold: '', italic: '', families: new Set(), label: svg.getAttribute('aria-label') });
                const group = lyricGroups.get(svg);
                group.text += value;
                group.bold += (Number(style.fontWeight) >= 600 ? '1' : '0').repeat(value.length);
                group.italic += (/italic|oblique/.test(style.fontStyle) ? '1' : '0').repeat(value.length);
                group.families.add(style.fontFamily);
              }
              for (const char of value) {
                text += char;
                bold.push(Number(style.fontWeight) >= 600 ? '1' : '0');
                italic.push(style.fontStyle === 'italic' || style.fontStyle === 'oblique' ? '1' : '0');
                families.push(style.fontFamily);
                roles.push(parent.closest('.subquestion-heading-label') ? 'category-heading' : parent.closest('text') ? 'score-caption' : parent.closest('h2,h3') ? 'section-heading' : parent.closest('th') ? 'table-heading' : parent.closest('li') ? 'bullet' : parent.closest('.subquestion-instruction') ? 'category-instruction' : parent.closest('p') ? 'prose' : 'other');
                const container = parent.closest("li,th,p,text");
                containers.push(container ? container.tagName + ":" + container.textContent : parent.tagName);
              }
            }
            const cells = [...card.querySelectorAll('.higher-comparison-grid th, .higher-comparison-grid td, svg .q3-marking-box-label, svg .q3-box-label')].map(cell => {
              const group = { role: cell.closest('svg') ? 'score-label' : 'table-cell', text: '', bold: '', italic: '', families: [] };
              const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
              let node;
              while ((node = walker.nextNode())) {
                const parent = node.parentElement;
                if (parent.closest('.visually-hidden,button,input,textarea,.inline-answer-feedback')) continue;
                const value = normal(node.textContent), style = getComputedStyle(parent);
                group.text += value;
                group.bold += (Number(style.fontWeight) >= 600 ? '1' : '0').repeat(value.length);
                group.italic += (/italic|oblique/.test(style.fontStyle) ? '1' : '0').repeat(value.length);
                group.families.push(...Array(value.length).fill(style.fontFamily));
              }
              return group;
            });
            cells.push({ role: 'paper-line', text, bold: bold.join(''), italic: italic.join(''), families });
            return rows.map(row => {
              const sourceStyles = new Set(rows.filter(r => r.normal === row.normal).map(r => r.bold + '/' + r.italic));
              const matches = [];
              for (let index = text.indexOf(row.normal); index >= 0; index = text.indexOf(row.normal, index + 1)) {
                const actualBold = bold.slice(index, index + row.normal.length).join('');
                const actualItalic = italic.slice(index, index + row.normal.length).join('');
                matches.push({ index, bold: actualBold, italic: actualItalic, families: [...new Set(families.slice(index, index + row.normal.length))], containers: [...new Set(containers.slice(index, index + row.normal.length))], roles: [...new Set(roles.slice(index, index + row.normal.length))], context: text.slice(Math.max(0, index - 30), index + row.normal.length + 30), boldMatches: actualBold === row.bold, italicMatches: actualItalic === row.italic });
              }
              const supplementaryMatches = [];
              if (!matches.length) for (const group of lyricGroups.values()) {
                for (let i = group.text.indexOf(row.normal); i >= 0; i = group.text.indexOf(row.normal, i + 1)) {
                  const actualBold = group.bold.slice(i, i + row.normal.length), actualItalic = group.italic.slice(i, i + row.normal.length);
                  supplementaryMatches.push({ method: 'Source lyric text only, within one rendered score; bar numbers and answer captions excluded', score: group.label, bold: actualBold, italic: actualItalic, families: [...group.families], passed: actualBold === row.bold && actualItalic === row.italic && [...group.families].every(f => /Trebuchet/.test(f)) });
                }
              }
              let offset = 0;
              const segmentMatches = row.segmentPlan?.segments.map(segment => {
                const sourceBold = row.segmentPlan.visualReading?.bold || row.bold, sourceItalic = row.segmentPlan.visualReading?.italic || row.italic;
                const text = normal(segment), expectedBold = sourceBold.slice(offset, offset + text.length), expectedItalic = sourceItalic.slice(offset, offset + text.length);
                offset += text.length;
                const candidates = cells.filter(c => c.role === row.segmentPlan.role && (row.segmentPlan.exactCell ? c.text === text : c.text.includes(text)));
                const actual = candidates.flatMap(c => {
                  const matches = [];
                  for (let i = c.text.indexOf(text); i >= 0; i = c.text.indexOf(text, i + 1)) {
                    const bold = c.bold.slice(i, i + text.length), italic = c.italic.slice(i, i + text.length), families = [...new Set(c.families.slice(i, i + text.length))];
                    matches.push({ bold, italic, families, passed: bold === expectedBold && italic === expectedItalic && families.every(f => /Trebuchet/.test(f)) });
                  }
                  return matches;
                });
                return { segment, expectedBold, expectedItalic, actual, passed: actual.length > 0 && actual.every(m => m.passed) };
              }) || [];
              return { ...row, ambiguousSourceStyle: sourceStyles.size > 1, matches, supplementaryMatches, segmentMatches, matched: matches.length > 0, flagged: sourceStyles.size === 1 && matches.some(m => !m.boldMatches || !m.italicMatches || m.families.some(f => !/Trebuchet/.test(f))) };
            });
          }, (process.env.AUDIT_ALL_TEXT ? record.allFragments.filter(r => r.normal.length >= 3) : process.env.AUDIT_SHORT_TEXT
            ? record.allFragments.filter(r => r.normal.length >= 3 && r.normal.length < 12)
            : record.fragments).filter(r => r.question === question.id).map(r => ({ ...r, ...(sourceSegments[`${record.id}/${r.page}/${r.normal}`] ? { segmentPlan: sourceSegments[`${record.id}/${r.page}/${r.normal}`] } : {}) })));
          if (!process.env.AUDIT_SHORT_TEXT && !process.env.AUDIT_ALL_TEXT && evidence.length && !evidence.some(r => r.matched)) throw new Error(question.id + ': no source text matched the visible paper');
          const tickHeading = question.layout === 'category-groups' ? await page.locator('.question-layout-category-groups .answer-fieldset').first().evaluate(node => {const s=getComputedStyle(node,'::before');return{content:s.content,fontFamily:s.fontFamily,fontWeight:Number(s.fontWeight),passed:/Tick/.test(s.content)&&Number(s.fontWeight)===700&&/Trebuchet/.test(s.fontFamily)};}) : null;
          item.questions.push({ id: question.id, fragments: evidence, tickHeading });
        }
      } catch (error) { item.errors.push(error.stack || String(error)); }
      finally { await context.close(); }
      result.papers.push(item);
      fs.writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
      const rows = item.questions.flatMap(q => q.fragments);
      console.log(item.id, JSON.stringify({ questions: item.questions.length, fragments: rows.length, matched: rows.filter(r => r.matched).length, flags: rows.filter(r => r.flagged).length, errors: item.errors }));
    }
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
