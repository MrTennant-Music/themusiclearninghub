'use strict';
// Propose exact occurrence-aware styles only where a complete rendered string
// has one unambiguous character-font pattern in the independent PDF inventory.
// Proposals require source visual review before becoming product overrides.
const fs = require('node:fs'), path = require('node:path');
const registry = require('../paper-registry');
const base = path.resolve(__dirname, '..'), audit = path.join(base, 'audit/2026-11-05');
const source = require('../tests/fixtures/source/fine-source-typography.json');
const before = require('../audit/2026-11-05/fine-source-typography-browser-initial.json');
const normal = s => s.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g, '');
const key = s => s.replace(/^[•·]\s*/, '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/\s+([,.;:!?])/g, '$1').replace(/\s+/g, ' ').trim().toLowerCase();
const keys = new Set(['intro','outro','openingInstructions','prompt','promptLines','leadLines','beforeAnswerLines','afterAnswerLines','instruction','instructionLines','scoreFollowingLines','finalAnswerIntro','roughWorkIntro','roughWorkBullets','playbackLines','answerPrompt','groupStart']);
function strings(value, at = 'question', parent = '', result = []) {
  if (typeof value === 'string') { if (keys.has(parent) || (parent === 'lines' && /\.guideIntro\./.test(at)) || /\.(?:promptParts|inlineAnswer)\.(?:before|after)$/.test(at)) result.push({ path: at, text: value }); }
  else if (Array.isArray(value)) value.forEach((v, i) => strings(v, `${at}[${i}]`, parent, result));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) {
    if (k === 'prompt' && value.promptLines) continue;
    strings(v, `${at}.${k}`, k, result);
  }
  return result;
}
function phrases(text, mask) {
  const chars = [];
  let index = 0;
  for (let offset = 0; offset < text.length; offset++) for (const c of normal(text[offset])) chars.push({ offset, bold: mask[index++] === '1' });
  const result = [];
  for (let start = 0; start < chars.length; start++) {
    if (!chars[start].bold) continue;
    let end = start;
    while (end + 1 < chars.length && chars[end + 1].bold) end++;
    const from = chars[start].offset, to = chars[end].offset + 1, phrase = text.slice(from, to);
    let occurrence = 0;
    for (let n = text.indexOf(phrase); n >= 0 && n < from; n = text.indexOf(phrase, n + 1)) occurrence++;
    result.push({ text: phrase, occurrence });
    start = end;
  }
  return result;
}
const output = { scope: 'Complete-string source-font candidates associated with the initial typography flags. Proposals only; visual confirmation and ambiguity review required.', candidates: [], unresolved: [] };
for (const record of source.papers) {
  const paper = require(path.resolve(base, registry[record.id].dataFile.split('?')[0]));
  const initial = before.papers.find(p => p.id === paper.id);
  for (const q of paper.questions) {
    const fragments = record.allFragments.filter(r => r.question === q.id), combined = fragments.map(r => r.normal).join('');
    const bold = fragments.map(r => r.bold).join(''), italic = fragments.map(r => r.italic).join('');
    const flags = initial.questions.find(r => r.id === q.id).fragments.filter(r => r.flagged);
    for (const row of [...new Map(strings(q).map(r => [r.text, r])).values()]) {
      const value = normal(row.text);
      if (value.length < 12 || !flags.some(f => { const n = normal(f.text.replace(/^\([a-ziv]+\)\s*/i, '')); return value.includes(n) || n.includes(value); })) continue;
      const matches = [];
      for (let n = combined.indexOf(value); n >= 0; n = combined.indexOf(value, n + 1)) matches.push({ index: n, bold: bold.slice(n, n + value.length), italic: italic.slice(n, n + value.length) });
      const exactLines = fragments.filter(r => key(r.text) === key(row.text));
      if (exactLines.length) matches.splice(0, matches.length, ...exactLines.map(r => ({ bold: r.bold, italic: r.italic })));
      const distinct = new Set(matches.map(m => m.bold + '/' + m.italic));
      if (distinct.size !== 1) { output.unresolved.push({ paper: paper.id, question: q.id, ...row, sourceMatches: matches.length, styles: distinct.size }); continue; }
      const match = matches[0];
      const style = { bold: phrases(row.text, match.bold), italic: phrases(row.text, match.italic) };
      output.candidates.push({ paper: paper.id, question: q.id, key: key(row.text), ...row, style, source: record.source, sourceSha256: record.sha256, actuallySourceReviewed: false });
    }
  }
}
fs.writeFileSync(path.join(audit, 'fine-source-style-candidates.json'), JSON.stringify(output, null, 2) + '\n');
console.log(output.candidates.length, 'complete-string style proposals;', output.unresolved.length, 'unmatched or ambiguous strings');
