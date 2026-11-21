"""Resolve typography substring flags by their independently reviewed source role.

Keep raw browser flags intact. A valid bullet/table/caption/prompt occurrence is
checked against its own source font pattern, never against a different role.
Unanchored fragments remain explicitly outside the character-style comparison.
"""
import json
import os
from pathlib import Path

BASE = Path(__file__).resolve().parents[1] / 'audit/2026-11-05'
result = {'scope': 'Context review of the final source typography screen. Role selection follows actually viewed source crops and PDF font evidence. No certification of unmatched fragments, short labels or fine engraving/line breaks.', 'runs': []}
for name in os.environ.get('AUDIT_RUNS', 'fine-source-typography-browser,webkit-fine-source-typography-browser,fine-source-typography-feedback-reviewed,webkit-fine-source-typography-feedback-reviewed').split(','):
    data = json.loads((BASE / (name + '.json')).read_text())
    run = {'record': name + '.json', 'engine': data['engine'], 'phase': data['phase'], 'papers': []}
    for paper in data['papers']:
        item = {'id': paper['id'], 'questions': len(paper['questions']), 'fragments': 0, 'matched': 0, 'unanchored': [], 'roleChecks': [], 'unresolved': [], 'errors': paper['errors']}
        for question in paper['questions']:
            for row in question['fragments']:
                if os.environ.get('AUDIT_LENGTH_BUCKET') == 'long' and len(row['normal']) < 12:
                    continue
                item['fragments'] += 1
                item['matched'] += int(row['matched'])
                if not row['matched']:
                    item['unanchored'].append({k: row[k] for k in ['question', 'page', 'text', 'box']})
                    continue
                if not row['flagged'] and not row['ambiguousSourceStyle']:
                    continue
                text = row['text'].lower()
                reason, eligible = '', []
                if 'question paper' in text:
                    reason = 'Regular spoken-instruction phrase; the separately retained bold end-of-paper heading is a different source role.'
                    eligible = [m for m in row['matches'] if not any(c.startswith('P:[END OF QUESTION PAPER]') for c in m['containers'])]
                elif paper['id'] == 'advanced-higher-2025' and row['normal'] == 'pianoandstrings':
                    reason = 'Italic score caption; the same words inside the regular prose prompt have their own verified source style.'
                    eligible = [m for m in row['matches'] if all(c.startswith('text:') for c in m['containers'])]
                elif paper['id'] == 'advanced-higher-2018' and row['normal'] == 'augmentedtriad':
                    reason = 'Bold prose label; the longer regular score-box caption has separately reviewed source typography.'
                    eligible = [m for m in row['matches'] if all(not c.startswith('text:') for c in m['containers'])]
                elif paper['id'] == 'advanced-higher-2016' and row['normal'] == 'themusicwillbeplayedtwice':
                    reason = 'The complete regular Q2(d) sentence; the bold word in the longer Q2(a) instruction is a source-correct prefix match.'
                    eligible = [m for m in row['matches'] if row['normal'] + 'hereis' in m['context']]
                elif any(token in text for token in ['texture', 'harmony', 'structure/form', 'italian terms', 'solo instrument', 'instruments/voices', 'string instrument']):
                    bullet = row['text'].lstrip().startswith(('•', '·'))
                    reason = 'Compare the source bullet only with bullet text, or the source table/category heading only with its heading; these legitimately have different weights.'
                    eligible = [m for m in row['matches'] if all((c.startswith('LI:') or c.startswith('P:•')) == bullet for c in m['containers'])]
                passed = bool(eligible) and all(m['boldMatches'] and m['italicMatches'] and all('Trebuchet' in f for f in m['families']) for m in eligible)
                check = {'question': question['id'], 'page': row['page'], 'text': row['text'], 'box': row['box'], 'reason': reason, 'eligibleMatches': len(eligible), 'passed': passed, 'sourceWasAmbiguousByTextOnly': row['ambiguousSourceStyle']}
                item['roleChecks'].append(check)
                if not passed:
                    item['unresolved'].append(check)
        run['papers'].append(item)
    result['runs'].append(run)
(BASE / os.environ.get('AUDIT_OUTPUT', 'fine-source-context-review.json')).write_text(json.dumps(result, indent=2) + '\n')
for run in result['runs']:
    print(run['record'], len(run['papers']), 'papers;', sum(p['matched'] for p in run['papers']), 'matched fragments;', sum(len(p['roleChecks']) for p in run['papers']), 'role checks;', sum(len(p['unresolved']) for p in run['papers']), 'unresolved')
raise SystemExit(any(p['errors'] or p['unresolved'] for r in result['runs'] for p in r['papers']))
