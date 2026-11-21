#!/usr/bin/env python3
"""Verify audited quotes against authenticated text; optionally recheck original DOCX files."""
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET
from zipfile import ZipFile

import argparse
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
parser.add_argument('--source-root', type=Path, help='OneDrive root containing the authentic sourceLocation DOCX files')
args = parser.parse_args()
ROOT = args.root
DATA = ROOT / 'music-dictionary/quiz-data'
bank = json.loads((DATA / 'question-bank.json').read_text())
audit = json.loads((DATA / 'workbook-choice-audit.json').read_text())
questions = {q['id']: q for q in bank['questions'] if q.get('options')}
assert questions, "Active choice bank must not be empty"
assert len(audit['questions']) == len(questions)
assert {r['questionId'] for r in audit['questions']} == questions.keys()
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
archive_path = ROOT / audit['sourceTextArchive']['path']
assert hashlib.sha256(archive_path.read_bytes()).hexdigest() == audit['sourceTextArchive']['sha256'], 'Source text archive changed'
archive = json.loads(archive_path.read_text())
saved_sources = {s['path']: s for s in archive['sources']}
assert len(saved_sources) == len(audit['sources']) == 13
paragraphs = {}
for source in audit['sources']:
    saved = saved_sources[source['path']]
    assert saved['sha256'] == source['sha256'], source['path']
    paragraphs[source['path']] = saved['paragraphs']
    assert len(saved['paragraphs']) == source['paragraphs'], source['path']
    if args.source_root:
        path = args.source_root / saved['sourceLocation']
        assert hashlib.sha256(path.read_bytes()).hexdigest() == source['sha256'], f'Workbook changed: {path}'
        with ZipFile(path) as document:
            xml = ET.fromstring(document.read('word/document.xml'))
        text = [''.join(t.text or '' for t in p.findall('.//w:t', ns)) for p in xml.findall('.//w:p', ns)]
        assert [p for p in text if p.strip()] == saved['paragraphs'], f'Workbook extraction differs: {path}'
for row in audit['questions']:
    q = questions[row['questionId']]
    assert row['questionContentSha256'] == q['contentSha256'], f'Question changed since audit: {q["id"]}'
    assert row['checkedPrompt'] == q['prompt'], q['id']
    assert row['checkedFeedback'] == q['feedback'], q['id']
    assert row['checkedCorrectOptions'] == [o['text'] for o in q['options'] if o['id'] in q['answer']['correctOptionIds']], q['id']
    assert row['checkedDistractors'] == [o['text'] for o in q['options'] if o['id'] not in q['answer']['correctOptionIds']], q['id']
    for evidence in row['classroomSources']:
        expected = '\n'.join(paragraphs[evidence['path']][i] for i in evidence['paragraphIndices'])
        assert evidence['supportingText'] == expected, f'Workbook quote mismatch: {q["id"]}'
        assert evidence in q['evidence'], q['id']
print(f'Verified {len(audit["sources"])} workbooks and all {len(questions)} choice-question audit records.')
