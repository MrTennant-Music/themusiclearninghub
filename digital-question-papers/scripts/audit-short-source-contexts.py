"""Resolve reviewed short-string collisions by source role, retaining raw flags.

The source crops, complete source pages and PDF character fonts were inspected
independently. Matching an unrelated occurrence never certifies a source row.
Unanchored text remains outside this typography check.
"""
import json
import os
from pathlib import Path

BASE = Path(__file__).resolve().parents[1] / 'audit/2026-11-05'
CREDIT_PAGES = {'advanced-higher-2025': 24, 'advanced-higher-2026': 24,
                'higher-2022': 20, 'higher-2024': 20, 'national5-2014': 20,
                'national5-2018': 16, 'national5-2019': 16, 'national5-2022': 16,
                'national5-2023': 16, 'national5-2025': 16, 'national5-2026': 16}
CATEGORIES = {'rhythmtempo', 'rhythm', 'dynamics', 'melody', 'instruments',
              'instrument', 'style', 'tempo', 'timbre', 'harmony', 'tonality'}
RUNS = [f'fine-engraving-short-{engine}-{phase}.json'
        for engine in ['chromium', 'webkit'] for phase in ['browser', 'feedback']]
result = {'scope': 'Reviewed short source roles only; no font certification of unanchored rows, print-only credits, raster fonts or complete page geometry.', 'runs': []}

for name in os.environ.get('AUDIT_RUNS', ','.join(RUNS)).split(','):
    raw = json.loads((BASE / name).read_text())
    run = {'record': name, 'engine': raw['engine'], 'phase': raw['phase'], 'papers': []}
    for paper in raw['papers']:
        item = {'id': paper['id'], 'questionViews': len(paper['questions']), 'fragments': 0,
                'matched': 0, 'unanchored': [], 'roleChecks': [], 'unresolved': [],
                'tickHeadingChecks': [], 'errors': paper['errors']}
        for question in paper['questions']:
            if question.get('tickHeading'):
                item['tickHeadingChecks'].append({'question': question['id'], **question['tickHeading']})
            for row in question['fragments']:
                if os.environ.get('AUDIT_LENGTH_BUCKET') == 'short' and len(row['normal']) >= 12:
                    continue
                item['fragments'] += 1
                item['matched'] += int(row['matched'])
                if not row['matched']:
                    item['unanchored'].append({k: row[k] for k in ['question', 'page', 'text', 'box']})
                    continue
                if not row['flagged'] and not row['ambiguousSourceStyle']:
                    continue
                n, bold = row['normal'], row['bold']
                wanted, reason, excluded = set(), '', False
                if n.startswith('question') and any(c.isdigit() for c in n):
                    if bold == '0' * len(n) and row['page'] == CREDIT_PAGES.get(paper['id']):
                        excluded, reason = True, 'Print-only copyright/acknowledgement reference on the final source page; this is not the paper question heading.'
                    else:
                        wanted, reason = {'section-heading'}, 'Printed question heading.'
                elif n == 'question' or n == 'excerpt':
                    wanted, reason = {'prose'}, 'Regular spoken-instruction word, not a heading substring.'
                elif n in {'roughwork', 'finalanswer'}:
                    wanted = {'section-heading'} if '1' in bold or n == 'roughwork' else {'prose'}
                    reason = 'Source section heading or the separately printed regular prose occurrence.'
                elif n in {'categories', 'excerpt1', 'excerpt2'}:
                    wanted = {'table-heading'} if '1' in bold else {'prose'}
                    reason = 'Table heading and surrounding instructions retain separate source roles.'
                elif n == 'samepitch':
                    wanted = {'other'} if '1' in bold else {'score-caption'}
                    reason = 'Bold question instruction versus regular notation caption.'
                elif n == 'answer':
                    wanted, reason = {'prose'}, 'Regular analysis instruction; the Final answer heading is separate.'
                elif n == 'tick':
                    reason = 'Printed bold Tick column heading is a CSS pseudo-element, measured independently.'
                elif n == 'tickone':
                    wanted, reason = {'category-instruction'}, 'Regular instructions beside the four categories; the opening instruction has different source emphasis.'
                elif n in {'concepts', 'both', 'commo', 'commonto', 'commont'}:
                    wanted, reason = {'table-heading'}, 'Printed comparison-table heading, not a substring in its instructions.'
                elif n in {'echords', 'ftranspose', 'enotes', 'atranspose', 'interval', 'cadence', 'notes'}:
                    wanted, reason = {'score-caption'}, 'Printed notation caption; adjacent control/prompt text is a separate role.'
                elif paper['id'].startswith('advanced-higher-') and n in {'formtimbre', 'dynamics', 'timbre'}:
                    wanted, reason = {'table-heading'}, 'Regular rough-work category heading, distinct from the bold bullet list.'
                elif n in CATEGORIES:
                    if row['text'].lstrip().startswith(('•', '·')):
                        wanted = {'bullet'}
                    elif paper['id'].startswith('higher-'):
                        wanted = {'table-heading'}
                    elif question['id'] == 'q5':
                        wanted = {'category-heading'}
                    else:
                        wanted = {'other'}
                    reason = 'Source bullet, category heading or final-answer heading, selected by its independently reviewed location.'
                eligible = [m for m in row['matches'] if m.get('roles') and set(m['roles']) <= wanted]
                if n == 'rhythm' and paper['id'].startswith('higher-'):
                    eligible = [m for m in eligible if m['containers'] == ['TH:Rhythm']]
                if n == 'answer' and question['id'] == 'q2':
                    eligible = [m for m in row['matches'] if 'pauseof20secondstocompleteyouranswer' in m['context']]
                if n == 'tick':
                    passed = bool(question.get('tickHeading', {}).get('passed'))
                else:
                    passed = excluded or bool(eligible) and all(m['boldMatches'] and m['italicMatches'] and all('Trebuchet' in f for f in m['families']) for m in eligible)
                check = {k: row[k] for k in ['question', 'page', 'text', 'box']}
                check.update(reason=reason, eligibleMatches=len(eligible), excludedPrintOnly=excluded, passed=passed)
                item['roleChecks'].append(check)
                if not passed:
                    item['unresolved'].append(check)
        run['papers'].append(item)
    result['runs'].append(run)
(BASE / os.environ.get('AUDIT_OUTPUT', 'fine-engraving-short-context-review.json')).write_text(json.dumps(result, indent=2) + '\n')
for run in result['runs']:
    print(run['record'], 'matched', sum(p['matched'] for p in run['papers']), 'role checks', sum(len(p['roleChecks']) for p in run['papers']), 'unresolved', sum(len(p['unresolved']) for p in run['papers']))
    for paper in run['papers']:
        for row in paper['unresolved']:
            print(paper['id'], row['question'], row['page'], row['text'], row['reason'])
raise SystemExit(any(p['unresolved'] or p['errors'] or any(not c['passed'] for c in p['tickHeadingChecks']) for r in result['runs'] for p in r['papers']))
