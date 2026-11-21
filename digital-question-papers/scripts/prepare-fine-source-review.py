"""Prepare legible source crops for typography flags; never mark them reviewed."""
import hashlib
import json
import math
import os
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'digital-question-papers/audit/2026-11-05'
OUT = ROOT / os.environ.get('AUDIT_OUTPUT', 'maintenance/generated/past-paper-fine-source-review')
assert not (OUT / 'review-ledger.json').exists(), 'Use a fresh output directory; preserve completed human review.'
OUT.mkdir(parents=True, exist_ok=True)
POP = Path.home() / '.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/poppler/bin/pdftoppm'
sources = {p['id']: p for p in json.loads((Path(__file__).resolve().parents[1] / 'tests/fixtures/source/fine-source-typography.json').read_text())['papers']}
browser = json.loads((ROOT / os.environ.get('AUDIT_INPUT', str(BASE / 'fine-source-typography-browser.json'))).read_text())
rows = []
for paper in browser['papers']:
    for question in paper['questions']:
        for fragment in question['fragments']:
            if fragment['flagged']:
                rows.append({'paper': paper['id'], 'question': question['id'], **fragment})

def crop(args):
    index, row = args
    x0, top, x1, bottom = row['box']
    left, upper = max(0, x0 - 4), max(0, top - 4)
    scale = 300 / 72
    prefix = OUT / f'fragment-{index + 1:03}'
    target = prefix.with_suffix('.png')
    if not target.exists():
        subprocess.run([str(POP), '-f', str(row['page']), '-l', str(row['page']), '-r', '300', '-x', str(math.floor(left * scale)), '-y', str(math.floor(upper * scale)), '-W', str(math.ceil((x1 - left + 4) * scale)), '-H', str(math.ceil((bottom - upper + 4) * scale)), '-singlefile', '-png', str(ROOT / sources[row['paper']]['source']), str(prefix)], check=True, stderr=subprocess.PIPE)
    return {'index': index + 1, 'paper': row['paper'], 'question': row['question'], 'page': row['page'], 'text': row['text'], 'box': row['box'], 'image': str(target.relative_to(ROOT)), 'sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'actuallyViewed': False}

with ThreadPoolExecutor(max_workers=4) as pool:
    items = list(pool.map(crop, enumerate(rows)))
sheets = []
for start in range(0, len(items), 8):
    batch = items[start:start + 8]
    sheet = Image.new('RGB', (1300, len(batch) * 125), '#ddd')
    draw = ImageDraw.Draw(sheet)
    for i, item in enumerate(batch):
        y = i * 125
        draw.text((12, y + 8), f"{item['index']:03} | {item['paper']} {item['question']} | source page {item['page']}", fill='black')
        with Image.open(ROOT / item['image']) as image:
            image.thumbnail((1276, 94))
            sheet.paste(image, (12, y + 27))
    target = OUT / f'sheet-{start // 8 + 1:02}.png'
    sheet.save(target)
    sheets.append({'image': str(target.relative_to(ROOT)), 'indices': [r['index'] for r in batch], 'actuallyViewed': False})
(OUT / 'review-ledger.json').write_text(json.dumps({'scope': 'Actual source crops at 300 dpi, fitted without distortion into legible review sheets. No review claim until images are actually viewed.', 'fragments': items, 'sheets': sheets}, indent=2) + '\n')
print(len(items), 'source crops;', len(sheets), 'review sheets')
