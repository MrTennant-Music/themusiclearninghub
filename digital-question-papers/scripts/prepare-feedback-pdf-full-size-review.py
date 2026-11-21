"""Keep every rendered PDF page legible in native-size two-column review sheets.

Never sets a review flag: that requires actually looking at the saved images.
Use a fresh AUDIT_OUTPUT whenever the source PDFs change.
"""
import hashlib, json, math, os
from pathlib import Path
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / os.environ.get('AUDIT_PDF_REVIEW', 'maintenance/generated/past-paper-final-revised-pdf-review')
OUT = ROOT / os.environ.get('AUDIT_OUTPUT', 'maintenance/generated/past-paper-final-revised-full-size-review')
OUT.mkdir(exist_ok=True, parents=True)
assert not (OUT / 'review-ledger.json').exists(), 'Use a fresh output directory; do not overwrite review evidence.'
rows = []
for paper in json.loads((BASE / 'page-review.json').read_text())['papers']:
    pages = sorted((BASE / paper['id']).glob('page-*.png'))
    for start in range(0, len(pages), 4):
        batch = pages[start:start + 4]
        sizes = [Image.open(p).size for p in batch]
        width, height = max(s[0] for s in sizes), max(s[1] for s in sizes)
        sheet = Image.new('RGB', (width * 2, (height + 24) * math.ceil(len(batch) / 2)), '#ddd')
        draw = ImageDraw.Draw(sheet)
        for index, page in enumerate(batch):
            x, y = index % 2 * width, index // 2 * (height + 24)
            with Image.open(page) as image: sheet.paste(image, (x, y + 24))
            draw.text((x + 12, y + 6), f"{paper['id']} | Page {start + index + 1}", fill='black')
        target = OUT / f"{paper['id']}-{start + 1:02}.png"
        sheet.save(target)
        rows.append({'id': paper['id'], 'pdf': paper['source'], 'pages': list(range(start + 1, start + len(batch) + 1)), 'image': str(target.relative_to(ROOT)), 'pageHashes': {str(start + i + 1): hashlib.sha256(p.read_bytes()).hexdigest() for i, p in enumerate(batch)}, 'reviewed': False})
(OUT / 'review-ledger.json').write_text(json.dumps({'scope': 'All rendered pages at native 90 dpi in two-column sheets. Human review flags apply only after actual inspection and do not replace official notation/source inventories.', 'sheets': rows}, indent=2) + '\n')
print(len(rows), 'sheets;', sum(len(r['pages']) for r in rows), 'pages')
