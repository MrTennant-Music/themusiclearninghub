"""Review current PDF pixels against previously reviewed, hash-verified pages.

Unchanged pages transfer only by exact PNG hash. Otherwise retain every changed
pixel in a padded crop against the nearest previous page. Crops are not marked
reviewed until actually viewed. Whole-page geometry checks remain separate.
"""
import hashlib
import os
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
AUDIT = ROOT / 'digital-question-papers/audit/2026-11-05'
BASE = ROOT / os.environ.get('AUDIT_RENDERED', 'maintenance/generated/past-paper-fine-typography-pdf-review-chromium')
OUT = ROOT / os.environ.get('AUDIT_OUTPUT', 'maintenance/generated/past-paper-fine-typography-pdf-differences')
assert not (OUT / 'review-ledger.json').exists(), 'Use a fresh output directory; never overwrite a human review ledger.'
OUT.mkdir(parents=True, exist_ok=True)
prior_visual = AUDIT / os.environ.get('AUDIT_PRIOR_VISUAL', 'fine-typography-prior-pdf-visual-review.json')
prior_full = AUDIT / os.environ.get('AUDIT_PRIOR_FULL', 'fine-typography-prior-pdf-full-size-review.json')
old = json.loads((prior_visual if prior_visual.exists() else AUDIT / 'pdf-visual-review.json').read_text())['papers']
hashes = {}
for sheet in json.loads((prior_full if prior_full.exists() else AUDIT / 'pdf-full-size-review.json').read_text())['sheets']:
    if sheet.get('reviewed'):
        hashes.setdefault(sheet['id'], set()).update(sheet['pageHashes'].values())
records = []
for paper in json.loads((BASE / 'page-review.json').read_text())['papers']:
    prior = next(p for p in old if p['id'] == paper['id'])
    folder = ROOT / Path(prior['overview']).parent / paper['id']
    candidates = []
    for file in sorted(folder.glob('page-*.png')):
        digest = hashlib.sha256(file.read_bytes()).hexdigest()
        if digest not in hashes.get(paper['id'], set()):
            continue
        image = Image.open(file).convert('RGB')
        candidates.append((file, digest, image, np.asarray(image.resize((48, 64))).astype(np.float32)))
    assert candidates, paper['id'] + ': no verified prior page images'
    for file in sorted((BASE / paper['id']).glob('page-*.png')):
        digest = hashlib.sha256(file.read_bytes()).hexdigest()
        row = {'paper': paper['id'], 'page': int(file.stem.split('-')[-1]), 'image': str(file.relative_to(ROOT)), 'sha256': digest}
        exact = next((c for c in candidates if c[1] == digest), None)
        if exact:
            row.update(method='exact reviewed page hash', prior=str(exact[0].relative_to(ROOT)), actuallyViewed=False)
        else:
            image = Image.open(file).convert('RGB')
            thumb = np.asarray(image.resize((48, 64))).astype(np.float32)
            best = min(candidates, key=lambda c: float(np.abs(c[3] - thumb).mean()))
            if image.size == best[2].size:
                box = ImageChops.difference(image, best[2]).getbbox()
                assert box, 'Distinct hashes but no changed pixels'
                box = [max(0, box[0] - 24), max(0, box[1] - 24), min(image.width, box[2] + 24), min(image.height, box[3] + 24)]
            else:
                box = [0, 0, image.width, image.height]
            target = OUT / f"{paper['id']}-{row['page']:02}.png"
            image.crop(box).save(target)
            row.update(method='all changed pixels plus 24px context', crop=str(target.relative_to(ROOT)), box=box, prior=str(best[0].relative_to(ROOT)), priorSha256=best[1], actuallyViewed=False)
        records.append(row)

sheets, batch, heights = [], [], [0, 0]
def flush():
    if not batch:
        return
    sheet = Image.new('RGB', (1540, max(heights)), '#ddd')
    draw = ImageDraw.Draw(sheet)
    for row, column, top in batch:
        with Image.open(ROOT / row['crop']) as image:
            sheet.paste(image, (column * 770 + 10, top + 24))
        draw.text((column * 770 + 10, top + 6), f"{row['paper']} | PDF page {row['page']}", fill='black')
    target = OUT / f'sheet-{len(sheets) + 1:02}.png'
    sheet.save(target)
    sheets.append({'image': str(target.relative_to(ROOT)), 'pages': [{'paper': row['paper'], 'page': row['page']} for row, _, _ in batch], 'actuallyViewed': False})

for row in (r for r in records if r.get('crop')):
    with Image.open(ROOT / row['crop']) as image:
        height = image.height + 32
    column = 0 if heights[0] <= heights[1] else 1
    if heights[column] + height > 1300:
        flush()
        batch, heights, column = [], [0, 0], 0
    batch.append((row, column, heights[column]))
    heights[column] += height
flush()
(OUT / 'review-ledger.json').write_text(json.dumps({'scope': 'Exact reviewed-page transfers and complete changed-pixel crops, using only hash-verified prior Chromium page images. No automatic human-review flags. Independent official source fidelity remains separate.', 'pages': records, 'sheets': sheets}, indent=2) + '\n')
print(len(records), 'current pages;', sum(r['method'].startswith('exact') for r in records), 'exact transfers;', len(sheets), 'changed-region review sheets')
