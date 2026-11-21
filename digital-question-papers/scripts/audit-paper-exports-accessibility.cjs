"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { chromium, webkit } = require("playwright");
const registry = require("../paper-registry.js");
const { server, root } = require("./audit-papers-browser.cjs");
const out = path.resolve(process.env.AUDIT_OUTPUT || "maintenance/generated/past-paper-exports-accessibility");
fs.mkdirSync(out, { recursive: true });
const axePath = process.env.AUDIT_AXE || require.resolve("axe-core/axe.min.js");

async function scan(page) {
  if (process.env.AUDIT_SKIP_AXE) return { skipped: true, violations: [], incomplete: [], passes: [] };
  if (!await page.evaluate(() => Boolean(window.axe))) await page.addScriptTag({ path: axePath });
  return page.evaluate(async () => {
    const result = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } });
    // Corner decorations cover the paper's bounding box with a transparent
    // pseudo-element, preventing axe from resolving its white background.
    // Check the same text colours with only these non-content corners omitted.
    let contrastReview = null;
    if (result.incomplete.some(v => v.id === 'color-contrast')) {
      const style = document.createElement('style');
      style.textContent = '.question-card::before,.question-card::after { content: none !important; }';
      document.head.append(style);
      try {
        const contrast = await window.axe.run(document, { runOnly: { type: 'rule', values: ['color-contrast'] } });
        contrastReview = { method: 'Decorative corners omitted; text and background colours unchanged', violations: contrast.violations, incomplete: contrast.incomplete };
      } finally { style.remove(); }
    }
    return { violations: [...result.violations, ...(contrastReview?.violations || [])].map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map(n => ({ target: n.target, html: n.html, summary: n.failureSummary })) })), incomplete: result.incomplete.map(v => ({ id: v.id, nodes: v.nodes.length })), contrastReview: contrastReview && { method: contrastReview.method, violations: contrastReview.violations.length, incomplete: contrastReview.incomplete.map(v => ({ id: v.id, nodes: v.nodes.length })) }, passes: result.passes.map(p => p.id) };
  });
}

async function main() {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browserType = process.env.AUDIT_ENGINE === 'webkit' ? webkit : chromium;
  const browser = await browserType.launch({ headless: true, ...(process.env.AUDIT_ENGINE !== 'webkit' && process.env.AUDIT_BROWSER ? { executablePath: process.env.AUDIT_BROWSER } : {}) });
  const result = process.env.AUDIT_RESUME && fs.existsSync(path.join(out, 'exports-accessibility.json'))
    ? JSON.parse(fs.readFileSync(path.join(out, 'exports-accessibility.json')))
    : { generatedAt: new Date().toISOString(), engine: process.env.AUDIT_ENGINE || 'chromium', browserVersion: browser.version(), axeVersion: JSON.parse(fs.readFileSync(path.join(path.dirname(axePath), "package.json"))).version, papers: [] };
  try {
    for (const entry of Object.values(registry).filter(e => !process.env.AUDIT_PAPER || process.env.AUDIT_PAPER.split(',').includes(e.id))) {
      if (process.env.AUDIT_RESUME && result.papers.some(p => p.id === entry.id && !p.errors.length && p.checks.every(c => c.passed))) continue;
      const paper = require(path.join(root, "digital-question-papers", entry.dataFile.split("?")[0]));
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
      const page = await context.newPage(); page.setDefaultTimeout(15000);
      const item = { id: paper.id, questions: [], checks: [], errors: [], capture: [] };
      const checkComparisonChoices = Boolean(process.env.AUDIT_COMPARISON_CHOICES || !process.env.AUDIT_LAYOUT_SCENARIO && process.env.AUDIT_POPULATED_EXPORT && paper.levelCode === 'H');
      const checkAdvancedComparison = Boolean(process.env.AUDIT_ADVANCED_COMPARISON_RESPONSE || !process.env.AUDIT_LAYOUT_SCENARIO && process.env.AUDIT_POPULATED_EXPORT && paper.levelCode === 'AH');
      page.on("pageerror", e => item.errors.push(e.message));
      const check = (passed, name) => item.checks.push({ name, passed: Boolean(passed) });
      try {
        if (process.env.AUDIT_PDF_DIAGNOSTICS) {
          await page.route('**/exam-ui.js*', route => {
            let source = fs.readFileSync(path.join(root, 'digital-question-papers/exam-ui.js'), 'utf8');
            source = source.replace('"use strict";', '"use strict"; globalThis.__auditPdfMeasurements=[]; globalThis.__auditPdfSlices=[];');
            source = source.replace('return measureFeedbackPdfBreakpoints(clone, canvas, fullPageCapacity, captureScale);', `const points=measureFeedbackPdfBreakpoints(clone,canvas,fullPageCapacity,captureScale);
              globalThis.__auditPdfMeasurements.push({id:element.dataset.resultQuestion||element.className,height:clone.getBoundingClientRect().height,scale:captureScale,capacity:fullPageCapacity,points,boxes:[...clone.querySelectorAll('.inline-answer-feedback,.q8-final-answer,.q8-marked-final-answer,.subquestion,th[rowspan],td[rowspan]')].map(n=>({part:n.closest('.subquestion')?.dataset.subquestion,class:n.className,rowspan:Number(n.getAttribute('rowspan'))||undefined,top:n.getBoundingClientRect().top-clone.getBoundingClientRect().top,height:n.getBoundingClientRect().height}))});return points;`);
            source = source.replace('const sliceHeight = Math.max(1, sourceEnd - sourceY);', `globalThis.__auditPdfSlices.push({id:page.dataset.resultQuestion||page.className,from:sourceY,to:sourceEnd,capacity:pixelCapacity,cursor:cursorY});const sliceHeight=Math.max(1,sourceEnd-sourceY);`);
            return route.fulfill({ contentType: 'application/javascript', body: source });
          });
        }
        if (process.env.AUDIT_LAYOUT_SCENARIO) {
          const { fixtures } = require('./populated-answer-fixtures.cjs');
          const attempt = require('../exam-engine').createAttempt(paper, 'practice');
          attempt.answers = fixtures(paper, process.env.AUDIT_LAYOUT_SCENARIO);
          if (process.env.AUDIT_ANSWER_OVERRIDES) Object.assign(attempt.answers, JSON.parse(process.env.AUDIT_ANSWER_OVERRIDES));
          if (process.env.AUDIT_LONG_CONCEPTS) for (const part of paper.questions.flatMap(q=>q.subquestions).filter(p=>p.type==='concept-lines')) attempt.answers[part.id] = Array(part.lines||part.marks).fill('A deliberately incorrect longer pupil answer. '.repeat(4).trim()).join('\n');
          item.populatedFixture = { scenario: process.env.AUDIT_LAYOUT_SCENARIO, answers: attempt.answers, expectedScore: require('../exam-marking').markPaper(paper, attempt.answers).score };
          await page.addInitScript(attempt => {
            if (sessionStorage.getItem('layout-export-seeded')) return;
            localStorage.setItem(`mlh-digital-question-papers-v1:${attempt.paperId}:draft`, JSON.stringify(attempt));
            sessionStorage.setItem('layout-export-seeded', '1');
          }, attempt);
        }
        console.log(item.id, "opening");
        await page.goto(`${origin}/digital-question-papers/digitalquestionpapers.html?paper=${paper.id}`, { waitUntil: "load" });
        if (!process.env.AUDIT_EXPORT_ONLY) {
          for (let i = 0; i < paper.questions.length; i++) {
            if (i) await page.locator("[data-next-question]").click();
            const choice = page.locator('.question-card input[type="radio"], .question-card input[type="checkbox"]').first();
            if (!process.env.AUDIT_LAYOUT_SCENARIO && await choice.count()) await choice.check();
            item.questions.push({ id: paper.questions[i].id, accessibility: await scan(page) });
            console.log(item.id, paper.questions[i].id, "accessibility scanned");
          }
        } else {
          await page.locator('[data-exam-menu-trigger="questions"]').click();
          await page.locator(`[data-go-question="${paper.questions.at(-1).id}"]`).click();
        }
        if (checkComparisonChoices) {
          const comparison = paper.questions.flatMap(q => q.subquestions).find(s => s.type === 'comparison-grid');
          if (!comparison) throw new Error('This choice check requires a Higher comparison grid');
          const question = paper.questions.find(q => q.subquestions.includes(comparison));
          await page.locator('[data-exam-menu-trigger="questions"]').click();
          await page.locator(`[data-go-question="${question.id}"]`).click();
          for (const column of ['a', 'b']) await page.locator(`[data-comparison-column="${column}"]`).first().check();
          for (const correct of [true, false]) {
            const concept = comparison.groups.flatMap(g => g.concepts).find(c => Boolean(c.correct) === correct);
            await page.getByLabel(`${concept.label}, Column C`, { exact: true }).check();
          }
          await page.locator('[data-exam-menu-trigger="questions"]').click();
          await page.locator(`[data-go-question="${paper.questions.at(-1).id}"]`).click();
        }
        if (checkAdvancedComparison) {
          const comparison = paper.questions.flatMap(q => q.subquestions).find(s => s.markingProfile === 'advanced-comparison');
          if (!comparison) throw new Error('This response check requires an AH comparison part');
          const response = comparison.similarities.slice(0, 3).map(c => `Both excerpts feature ${c.answers?.[0] || c.label} in the musical passages that are played.`).join(' ');
          const expected = require('../exam-marking').markSubquestion(comparison, { final: response });
          if (expected.status !== 'partial') throw new Error(`Comparison fixture did not produce partial credit: ${expected.marks}`);
          await page.locator(`[data-subquestion="${comparison.id}"] [data-final-answer-line]`).first().fill(response);
          item.comparison = { part: comparison.id, response, expectedMarks: expected.marks, sourceLabels: [...comparison.similarities, ...comparison.differences].map(c => c.label) };
        }
        if (process.env.AUDIT_ACCIDENTAL_RESPONSE) {
          const part = paper.questions.flatMap(q => q.subquestions).find(s => s.notationTool === 'accidental');
          if (!part) throw new Error('Accidental export requires a fixed-target accidental question');
          const question = paper.questions.find(q => q.subquestions.includes(part));
          await page.locator('[data-exam-menu-trigger="questions"]').click();
          await page.locator(`[data-go-question="${question.id}"]`).click();
          const choice = part.answer === 'flat' ? 'sharp' : 'flat';
          await page.locator(`[data-subquestion="${part.id}"] .notation-tool-button[data-value="${choice}"]`).click();
          await page.locator(`[data-fixed-accidental-target="${part.id}"]`).click();
          item.accidental = { part: part.id, question: question.id, choice };
          check(await page.locator(`[data-accidental-answer="${part.id}"]`).count() === 1, 'incorrect accidental enters a neutral visible score glyph');
          await page.locator('[data-exam-menu-trigger="questions"]').click();
          await page.locator(`[data-go-question="${paper.questions.at(-1).id}"]`).click();
        }
        if (process.env.AUDIT_NOTE_SELECTION_RESPONSE) {
          const part = paper.questions.flatMap(q => q.subquestions).find(s => s.notationTool === 'note-select');
          const question = paper.questions.find(q => q.subquestions.includes(part));
          await page.locator('[data-exam-menu-trigger="questions"]').click();
          await page.locator(`[data-go-question="${question.id}"]`).click();
          const target = page.locator(`[data-source-note-selection="${part.id}"]`).first();
          item.noteSelection = { part: part.id, question: question.id, label: await target.getAttribute('aria-label') };
          await target.click();
          check(await page.locator('.q3-note-selection-outline.q3-entered-answer').count() === 1, 'wrong source note receives a neutral pupil circle');
          await page.locator('[data-exam-menu-trigger="questions"]').click();
          await page.locator(`[data-go-question="${paper.questions.at(-1).id}"]`).click();
        }
        if (process.env.AUDIT_NOTE_ENTRY_PITCH || process.env.AUDIT_NOTE_ENTRY_SEQUENCE) {
          const part = paper.questions.flatMap(q => q.subquestions).find(s => s.notationTool === 'note-entry' && (!process.env.AUDIT_NOTE_ENTRY_PART || s.id === process.env.AUDIT_NOTE_ENTRY_PART));
          if (!part) throw new Error('Requested note-entry export part is unavailable');
          const question = paper.questions.find(q => q.subquestions.includes(part));
          const config = require('./audit-normal-note-removal.cjs').definitions().find(c => c.paper === paper.id && c.part === part.id);
          const pitches = (process.env.AUDIT_NOTE_ENTRY_SEQUENCE || process.env.AUDIT_NOTE_ENTRY_PITCH).split(',');
          await page.locator('[data-exam-menu-trigger="questions"]').click();
          await page.locator(`[data-go-question="${question.id}"]`).click();
          const svg = () => page.locator(config.host).first();
          const target = () => svg().locator(config.target).nth(config.index);
          const chroma = p => Number(p.match(/\d+$/)[0]) * 7 + 'CDEFGAB'.indexOf(p[0]);
          const cursor = async () => { const m = (await target().getAttribute('aria-label')).match(/Note (\d+): ([A-G][#♯b♭♮]?\d+)/); return { slot: Number(m[1]) - 1, pitch: m[2] }; };
          const beforeNoteCount = await svg().locator(':scope > text.q3-complete-note,:scope > text.q3-notehead').count();
          if (config.rest) { const rest = svg().getByRole('button', {name:'Place crotchet rest in bar 12',exact:true}); await rest.focus(); await rest.press('Enter'); }
          for (const [slot, pitch] of pitches.entries()) {
            if (config.accidentals) {
              const kind = /[#♯]/.test(pitch) ? 'sharp' : /[b♭]/.test(pitch) ? 'flat' : 'natural';
              await page.locator(`[data-subquestion="${part.id}"] .notation-tool-accidental[data-value="${kind}"]`).focus();
              await page.keyboard.press('Enter');
            }
            await target().focus();let current = await cursor();
            for (let n = 0; current.slot !== slot && n < 20; n++) { await target().press(current.slot < slot ? 'ArrowRight' : 'ArrowLeft'); current = await cursor(); }
            for (let n = 0; chroma(current.pitch) !== chroma(pitch) && n < 40; n++) { await target().press(chroma(current.pitch) < chroma(pitch) ? 'ArrowUp' : 'ArrowDown'); current = await cursor(); }
            check(current.slot === slot && chroma(current.pitch) === chroma(pitch), 'requested source/range pitch is offered through real keyboard input');
            await target().press('Enter');
          }
          const value = await page.evaluate(({paper,part}) => ExamStorage.loadDraft(paper).answers[part], {paper:paper.id,part:part.id});
          const expected = require('../exam-marking').markSubquestion(part,value);
          item.noteEntry = { part: part.id, question: question.id, pitches, value, status: expected.status, expectedMarks: expected.marks, host: config.host, noteColours: pitches.map((pitch,index) => require('./audit-normal-note-removal.cjs').canonical(pitch) === require('./audit-normal-note-removal.cjs').canonical(config.pitches[index]) ? 'correct' : 'incorrect') };
          const expectedTokens = Array(config.pitches.length).fill('_'); pitches.forEach((pitch,index) => expectedTokens[index] = pitch);
          check(value === [...(config.rest ? [config.rest] : []), ...expectedTokens].join(','), 'every requested score note stores exactly');
          check(await svg().locator(':scope > text.q3-complete-note,:scope > text.q3-notehead').count() > beforeNoteCount, 'entered notes render before submission');
          if (process.env.AUDIT_ENTRY_SCREENSHOTS) await svg().screenshot({path:path.join(out,paper.id+'-entry-before.png')});
          await page.locator('[data-exam-menu-trigger="questions"]').click();
          await page.locator(`[data-go-question="${paper.questions.at(-1).id}"]`).click();
        }
        await page.locator("[data-submit-paper]:visible").first().click();
        item.submitDialog = await scan(page);
        const initiallyFocused = await page.evaluate(() => Boolean(document.activeElement?.closest("[data-submit-overlay]")));
        for (let n = 0; n < 6; n++) await page.keyboard.press("Tab");
        const focusContained = await page.evaluate(() => Boolean(document.activeElement?.closest("[data-submit-overlay]")));
        check(initiallyFocused, "submit dialog moves focus inside");
        check(focusContained, "submit dialog contains tab navigation");
        await page.locator("[data-confirm-submit]").click();
        await page.locator("[data-screen=results]").waitFor();
        if (item.populatedFixture) {
          const saved = await page.evaluate(id => ExamStorage.loadSubmitted(id), paper.id);
          check(saved.result.score === item.populatedFixture.expectedScore, 'populated submission preserves the fixture score');
          check(JSON.stringify(saved.answers) === JSON.stringify(item.populatedFixture.answers), 'populated submission preserves every fixture answer');
        }
        console.log(item.id, "submitted");
        item.feedback = await scan(page);
        if (item.comparison) {
          await page.locator('[data-exam-menu-trigger="questions"]').click();
          await page.locator('[data-go-question="q6"]').click();
          const feedback = page.locator(`[data-subquestion="${item.comparison.part}"] .inline-answer-feedback`);
          check(await feedback.evaluate(n => n.classList.contains('is-partial')), 'real comparison response receives partial feedback');
          check(!(await feedback.textContent()).includes('at least 3 headings'), 'comparison omits the unrelated three-heading instruction');
          const shown = await feedback.locator('.q8-feedback-answer-bank li').allTextContents();
          check(item.comparison.sourceLabels.every(label => shown.includes(label)), 'comparison feedback lists every existing official similarity and difference');
          check(await feedback.locator('.is-awarded-concept').count() >= 3, 'comparison highlights the credited source concepts');
          item.comparison.accessibility = await scan(page);
        }
        if (item.noteEntry) {
          await page.locator('[data-exam-menu-trigger="questions"]').click();
          await page.locator(`[data-go-question="${item.noteEntry.question}"]`).click();
          const svg = page.locator(item.noteEntry.host).first();
          const colours = [...new Set(item.noteEntry.noteColours)];
          check((await Promise.all(colours.map(colour => svg.locator('.q3-answer-'+colour).count()))).every(n => n > 0), 'entered notes retain their individually expected marking colours');
          check(await svg.evaluate(svg => [...svg.querySelectorAll('[x],[y],[x1],[y1],[x2],[y2]')].every(n => ['x','y','x1','y1','x2','y2'].every(a => !n.hasAttribute(a) || Number.isFinite(Number(n.getAttribute(a)))))), 'marked score contains no invalid note or ledger coordinates');
          if (process.env.AUDIT_ENTRY_SCREENSHOTS) await svg.screenshot({path:path.join(out,paper.id+'-entry-feedback.png')});
          item.noteEntry.accessibility = await scan(page);
        }
        if (item.noteSelection) {
          await page.locator('[data-exam-menu-trigger="questions"]').click();
          await page.locator(`[data-go-question="${item.noteSelection.question}"]`).click();
          check(await page.locator('.q3-note-selection-outline.q3-answer-incorrect').count() === 1, 'wrong pupil circle remains red after submission');
          check(await page.locator('.q3-note-selection-outline.q3-answer-correction').count() === 1, 'official correct note is identified in the marked score');
          item.noteSelection.accessibility = await scan(page);
        }
        if (item.accidental) {
          await page.locator('[data-exam-menu-trigger="questions"]').click();
          await page.locator(`[data-go-question="${item.accidental.question}"]`).click();
          check(await page.locator(`[data-accidental-answer="${item.accidental.part}"].q3-answer-incorrect`).count() === 1, 'incorrect accidental remains red in submitted score');
          item.accidental.accessibility = await scan(page);
        }
        await page.locator('[data-exam-menu-trigger="questions"]').click();
        await page.locator('[data-go-question="q2"]').click();
        const before = await page.locator("[data-current-question-label]").textContent();
        await page.evaluate(map => { window.__auditSourceLineMap = map; }, require('../source-line-breaks')[paper.id]);
        await page.evaluate(colorDiagnostics => {
          window.__auditCaptures = [];
          window.__auditBlankStyles = [];
          const getStyle = window.getComputedStyle.bind(window);
          window.getComputedStyle = (element, pseudo) => {
            const style = getStyle(element, pseudo);
            if (!style.backgroundColor) window.__auditBlankStyles.push({ tag: element.tagName, html: element.outerHTML?.slice(0, 700), connected: element.isConnected, pseudo });
            return style;
          };
          const capture = window.html2canvas;
          window.html2canvas = (element, options) => capture(element, {
            ...options,
            onclone: (doc, reference) => {
              options.onclone?.(doc);
              const leftover = [...doc.querySelectorAll("text.q3-music-glyph, text.notation-glyph")].filter(n => /[\uE000-\uF8FF]/.test(n.textContent)).map(n => ({ text: n.textContent, class: n.getAttribute("class") }));
              const unsupportedColors = colorDiagnostics && reference ? [reference, ...reference.querySelectorAll('*')].flatMap(node => {
                const style = doc.defaultView.getComputedStyle(node);
                return [...style].filter(property => /color|fill|stroke|shadow|background/.test(property) && /oklab\(|oklch\(|color\(/.test(style.getPropertyValue(property))).map(property => ({ html: node.outerHTML.slice(0, 500), property, value: style.getPropertyValue(property) }));
              }) : undefined;
              const sourceParagraphs = [];
              if (reference && element.dataset.resultQuestion) {
                let text = ''; const positions = [];
                const walk = doc.createTreeWalker(reference, NodeFilter.SHOW_TEXT); let node;
                while ((node = walk.nextNode())) {
                  const parent = node.parentElement;
                  if (!parent.getClientRects().length || parent.closest('svg,button,input,textarea,script,style,.visually-hidden,.inline-answer-feedback,.paper-expanded-answer,.q8-marked-final-answer,.higher-concept-line-marked-answer,.paper-marks-heading,.subquestion-heading-marks,[data-question-total-mark]')) continue;
                  for (let i = 0; i < node.textContent.length; i++) {
                    const chars = node.textContent[i].normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g, ''); if (!chars) continue;
                    const range = doc.createRange(); range.setStart(node, i); range.setEnd(node, i + 1); const r = range.getBoundingClientRect();
                    for (const ch of chars) { text += ch; positions.push({x:r.x,y:r.y,right:r.right,bottom:r.bottom}); }
                  }
                }
                for (const [key, expected] of Object.entries(window.__auditSourceLineMap?.[element.dataset.resultQuestion] || {})) {
                  const start = text.indexOf(key), chars = positions.slice(start, start + key.length), frame = reference.getBoundingClientRect();
                  if (start < 0) { sourceParagraphs.push({key,expected,found:false}); continue; }
                  const actual = chars.flatMap((p,i)=>i>0 && p.x < chars[i-1].x-2 && Math.abs(p.y-chars[i-1].y)>3 ? [i] : []);
                  const x = Math.min(...chars.map(p=>p.x)), y = Math.min(...chars.map(p=>p.y));
                  sourceParagraphs.push({key,expected,actual,found:true,bounds:{x:x-frame.x,y:y-frame.y,width:Math.max(...chars.map(p=>p.right))-x,height:Math.max(...chars.map(p=>p.bottom))-y}});
                }
              }
              window.__auditCaptures.push({ element: element.className, leftover, unsupportedColors,
                question: element.dataset.resultQuestion, sourceParagraphs,
                notationAnswerGlyphs: reference ? [...reference.querySelectorAll('svg .q3-entered-answer')].map(node => { const b=node.getBoundingClientRect(),r=reference.getBoundingClientRect();return {text:node.textContent,bounds:{x:b.x-r.x,y:b.y-r.y,width:b.width,height:b.height}}; }) : [],
                textFields: reference ? [...reference.querySelectorAll('input[type="text"],textarea,[data-feedback-textarea],.paper-expanded-answer,.higher-concept-line-marked-answer,.q8-marked-final-answer')].filter(n=>n.getBoundingClientRect().height>0).map(n=>{const b=n.getBoundingClientRect(),r=reference.getBoundingClientRect(),style=getComputedStyle(n);return {id:n.id,part:n.closest('[data-subquestion]')?.dataset.subquestion,tag:n.tagName,class:n.className,value:n.value??n.textContent,fontWeight:style.fontWeight,fontFamily:style.fontFamily,bounds:{x:b.left-r.left,y:b.top-r.top,width:b.width,height:b.height},clientWidth:n.clientWidth,scrollWidth:n.scrollWidth,clientHeight:n.clientHeight,scrollHeight:n.scrollHeight};}) : [],
                name: doc.querySelector("[data-feedback-export-name]")?.textContent,
                renderedLayout: window.__auditPdfMeasurements && reference ? { height: reference.getBoundingClientRect().height, boxes: [...reference.querySelectorAll('.inline-answer-feedback,.q8-final-answer,.q8-marked-final-answer,.subquestion,th[rowspan],td[rowspan]')].map(n => ({ part: n.closest('.subquestion')?.dataset.subquestion, class: n.className, rowspan: Number(n.getAttribute('rowspan')) || undefined, top: n.getBoundingClientRect().top-reference.getBoundingClientRect().top, height: n.getBoundingClientRect().height })) } : undefined,
                layout: {height:element.getBoundingClientRect().height,blocks:[...element.querySelectorAll('.subquestion,.question-intro,.answer-fieldset')].map(n=>({class:n.className,id:n.dataset.subquestion,top:n.getBoundingClientRect().top-element.getBoundingClientRect().top,height:n.getBoundingClientRect().height}))},
                guideFeedback: [...element.querySelectorAll('.higher-guide-box .inline-answer-feedback')].map(n => {
                  const guide=n.closest('.higher-guide-box'), rect=n.getBoundingClientRect(), frame=guide.getBoundingClientRect(), style=getStyle(guide,'::before');
                  const width=parseFloat(style.width), left=parseFloat(style.left)||0;
                  return {part:n.closest('.subquestion').dataset.subquestion,left:rect.left,right:rect.right,frameLeft:frame.left+left,frameRight:frame.left+left+width};
                }),
                checkedChoices: doc.querySelectorAll('[data-feedback-choice="checked"] svg').length,
                openingInstructions: reference ? [...reference.querySelectorAll('.paper-opening-instructions p')].map(n => n.textContent) : [],
                guideArrows: reference ? [...reference.querySelectorAll('.music-guide-arrow')].map(n => ({
                  wrapper: n.tagName, vertical: n.classList.contains('is-vertical'),
                  svg: n.querySelector('svg')?.getAttribute('viewBox'),
                  path: n.querySelector('path')?.getAttribute('d'),
                  stroke: doc.defaultView.getComputedStyle(n.querySelector('path')).stroke,
                  fill: doc.defaultView.getComputedStyle(n.querySelector('path')).fill,
                })) : [],
                flowArrows: reference ? [...reference.querySelectorAll('.answer-option-flow-arrow')].map(n => ({
                  width: n.getBoundingClientRect().width, height: n.getBoundingClientRect().height,
                  clipPath: doc.defaultView.getComputedStyle(n).clipPath,
                  shapes: [...n.querySelectorAll('polygon')].map(p => ({ points: p.getAttribute('points'), fill: doc.defaultView.getComputedStyle(p).fill })),
                })) : [],
                comparisonChoices: [...doc.querySelectorAll('[data-feedback-comparison]')].map(n => ({ checked: n.dataset.feedbackChoice === 'checked', column: n.dataset.feedbackComparison, opacity: doc.defaultView.getComputedStyle(n).opacity, ticks: n.querySelectorAll('svg').length, stroke: n.querySelector('[stroke]')?.getAttribute('stroke'), leftoverMasks: n.closest('label').querySelectorAll('html2canvaspseudoelement').length })),
                featureUnderlines: [...doc.querySelectorAll('.higher-lyric-features u > strong')].map(n => doc.defaultView.getComputedStyle(n).textDecorationLine),
                visibleNotationTools: [...doc.querySelectorAll('[data-results-paper] .notation-controls-only')].filter(n => doc.defaultView.getComputedStyle(n).display !== 'none').length });
            },
          }).then(canvas => { window.__auditCaptures.at(-1).canvasPixels = {width:canvas.width,height:canvas.height}; return canvas; }).catch(error => { window.__auditCaptureError = { message: error.message, stack: error.stack, element: element.className }; throw error; });
          const create = URL.createObjectURL.bind(URL);
          URL.createObjectURL = blob => { if (blob.type === "application/pdf") window.__auditPdfBlob = blob; return create(blob); };
          const open = window.open.bind(window);
          window.open = (...args) => { window.__auditPdfWindow = open(...args); return window.__auditPdfWindow; };
        }, Boolean(process.env.AUDIT_COLOR_DIAGNOSTICS));
        await page.locator("[data-share-feedback]").click();
        item.shareDialog = await scan(page);
        check(await page.evaluate(() => Boolean(document.activeElement?.closest('[data-share-name-overlay]'))), 'Share dialog moves focus inside');
        if (process.env.AUDIT_ACCESSIBILITY_ONLY) {
          await page.keyboard.press('Escape');
          result.papers = result.papers.filter(p => p.id !== item.id);
          result.papers.push(item);
          fs.writeFileSync(path.join(out, 'exports-accessibility.json'), JSON.stringify(result, null, 2));
          await context.close();
          console.log(item.id, 'accessibility-only checks finished');
          continue;
        }
        await page.locator("[data-share-name-input]").fill("Audit pupil");
        const popupPromise = page.waitForEvent("popup");
        await page.locator('[data-share-name-form] button[type="submit"]').click();
        console.log(item.id, "capturing PDF");
        const popup = await popupPromise;
        await page.waitForFunction(() => (Boolean(window.__auditPdfBlob) && !document.body.hasAttribute("data-pdf-feedback")) || window.__auditPdfWindow?.document.title === "Feedback PDF unavailable", null, { timeout: 180000 });
        const exportError = await page.evaluate(() => !window.__auditPdfBlob ? window.__auditPdfWindow?.document.body.textContent : null);
        if (exportError) {
          item.captureError = await page.evaluate(() => ({ ...window.__auditCaptureError, blankStyles: window.__auditBlankStyles }));
          item.capture = await page.evaluate(() => window.__auditCaptures);
          throw new Error(exportError);
        }
        const pdf = await page.evaluate(async () => {
          const bytes = new Uint8Array(await window.__auditPdfBlob.arrayBuffer());
          let raw = ""; for (let i = 0; i < bytes.length; i += 32768) raw += String.fromCharCode(...bytes.subarray(i, i + 32768));
          return { data: btoa(raw), captures: window.__auditCaptures };
        });
        const bytes = Buffer.from(pdf.data, "base64");
        fs.writeFileSync(path.join(out, `${paper.id}-feedback.pdf`), bytes);
        item.pdfBytes = bytes.length; item.capture = pdf.captures;
        check(JSON.stringify(item.capture.flatMap(c => c.openingInstructions || [])) === JSON.stringify(paper.openingInstructions || []), 'Question 1 retains every printed opening instruction in the actual PDF capture');
        const guideArrows = item.capture.flatMap(c => c.guideArrows || []);
        if (paper.levelCode === 'N5') {
          check(guideArrows.length === 3, 'all three National 5 guide arrows reach the actual capture');
          check(guideArrows.every(a => a.wrapper === 'SPAN' && a.svg === '0 0 52 28' && a.path === 'M0 8 H35 V1 L51 14 L35 27 V20 H0 Z' && a.stroke === 'rgb(34, 34, 34)' && a.fill === 'rgb(255, 255, 255)'), 'guide arrows retain an untransformed inner SVG and the printed outline');
        }
        const guides = item.capture.flatMap(c=>c.guideFeedback||[]);
        if (guides.length) check(guides.every(b=>b.left>=b.frameLeft&&b.right<=b.frameRight-1), 'every guide feedback panel remains inside its printed frame');
        if (process.env.AUDIT_PDF_DIAGNOSTICS) item.diagnostics = await page.evaluate(() => ({ measurements: window.__auditPdfMeasurements, slices: window.__auditPdfSlices }));
        check(bytes.subarray(0, 5).toString() === "%PDF-", "actual Share output is a PDF");
        check(popup.url().startsWith("blob:"), "finished PDF opens in the new tab");
        check((await page.locator("[data-current-question-label]").textContent()) === before, "export restores the previously selected question");
        check(await page.locator("[data-feedback-export-name]").isHidden(), "optional name remains PDF-only");
        check(item.capture.every(c => c.name === "Name: Audit pupil"), "all captured pages carry the optional name context");
        check(item.capture.every(c => c.leftover.length === 0), "Bravura score characters are replaced by paths before capture");
        if (item.populatedFixture) {
          item.clippedTextFields = item.capture.flatMap(c => (c.textFields || []).filter(f => f.value && !f.class.includes('has-marked-concept-answer') && (f.scrollWidth > f.clientWidth + 2 || f.scrollHeight > f.clientHeight + 2)).map(f=>({element:c.element,...f})));
          check(item.clippedTextFields.length === 0, 'actual populated capture contains every visible answer without internal clipping');
        }
        check(item.capture.every(c => c.visibleNotationTools === 0), "PDF omits disabled notation tools");
        if (process.env.AUDIT_COLOR_DIAGNOSTICS) check(item.capture.every(c => !c.unsupportedColors.length), 'all captured colours use formats supported by the PDF renderer');
        if (['advanced-higher-2024', 'advanced-higher-2026'].includes(paper.id)) {
          const arrows = item.capture.flatMap(c => c.flowArrows || []), hollow = paper.id === 'advanced-higher-2024';
          check(arrows.length === 8 && arrows.every(a => a.clipPath === 'none' && a.shapes.length === (hollow ? 2 : 1) && a.shapes[0].points.includes('100,50') && a.shapes[0].fill === 'rgb(36, 33, 34)' && (!hollow || a.shapes[1].fill === 'rgb(214, 211, 209)')), 'all eight instrument-order arrows retain their vector heads and source fill in the actual capture');
        }
        if (checkComparisonChoices) {
          check(item.capture.every(c => c.comparisonChoices.filter(n => n.checked).length === 4), 'all four actual A/B/correct-C/incorrect-C selections reach the PDF clone');
          check(item.capture.every(c => c.comparisonChoices.every(n => n.opacity === '1' && !n.leftoverMasks && n.ticks === (n.checked ? 1 : 0))), 'comparison choices use visible SVG ticks with no masked rectangle');
          check(item.capture.every(c => c.featureUnderlines.length === 5 && c.featureUnderlines.every(v => v.includes('underline'))), 'every printed feature underline reaches the painted text');
        }
        await page.screenshot({ path: path.join(out, `${paper.id}-after-export.png`), fullPage: true });
        await popup.close();
      } catch (err) { item.errors.push(err.stack); }
      result.papers = result.papers.filter(p => p.id !== item.id);
      result.papers.push(item);
      fs.writeFileSync(path.join(out, "exports-accessibility.json"), JSON.stringify(result, null, 2));
      console.log(item.id, JSON.stringify({ questions: item.questions.length, violations: item.questions.reduce((n, q) => n + q.accessibility.violations.length, 0), failedChecks: item.checks.filter(c => !c.passed).map(c => c.name), errors: item.errors.map(s => s.split("\n")[0]), pdfBytes: item.pdfBytes }));
      await context.close();
    }
  } finally { await browser.close(); server.close(); }
  process.exitCode = result.papers.some(p => p.errors.length || p.checks.some(c => !c.passed) || p.questions.some(q => q.accessibility.violations.length) || [p.submitDialog,p.feedback,p.shareDialog].some(state => state?.violations?.length)) ? 1 : 0;
}
main().catch(err => { console.error(err); server.close(); process.exitCode = 1; });
