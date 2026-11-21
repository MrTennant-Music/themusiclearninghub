"""Prepare actual exported paragraph pixels with strict capture-row accounting."""
import hashlib, json, math, os
from pathlib import Path
from PIL import Image, ImageDraw
from pypdf import PdfReader
from pypdf.generic import ContentStream

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / os.environ['AUDIT_PDF_BASE']
OUT = ROOT / os.environ['AUDIT_OUTPUT']
OUT.mkdir(parents=True, exist_ok=True)
assert not (OUT / 'review-ledger.json').exists()
raw = json.loads((BASE / 'exports-accessibility.json').read_text())
records, pictures = [], []
for paper in raw['papers']:
    reader = PdfReader(BASE / (paper['id'] + '-feedback.pdf'))
    draws = []
    for page_number, page in enumerate(reader.pages, 1):
        for operands, operation in ContentStream(page.get_contents(), reader).operations:
            if operation != b'Do':
                continue
            obj = page['/Resources']['/XObject'][operands[0]].get_object()
            if obj.get('/Subtype') == '/Image':
                draws.append((page_number, obj))
    cursor = 0
    for capture in paper['capture']:
        height = capture['canvasPixels']['height']
        tiles, consumed = [], 0
        while consumed < height:
            page_number, obj = draws[cursor]
            cursor += 1
            tiles.append((page_number, obj))
            consumed += int(obj['/Height'])
        assert consumed == height
        if not capture['sourceParagraphs']:
            continue
        native = Image.new('RGB', (capture['canvasPixels']['width'], height), 'white')
        y = 0
        for page_number, obj in tiles:
            assert str(obj['/ColorSpace']) == '/DeviceRGB'
            tile = Image.frombytes('RGB', (int(obj['/Width']), int(obj['/Height'])), obj.get_data())
            native.paste(tile, (0, y))
            y += tile.height
        for paragraph in capture['sourceParagraphs']:
            assert paragraph['found'] and paragraph['actual'] == paragraph['expected'], (paper['id'], capture['question'], paragraph)
            b = paragraph['bounds']
            box = (max(0, math.floor(b['x'] * 2.5) - 24), max(0, math.floor(b['y'] * 2.5) - 24),
                   min(native.width, math.ceil((b['x'] + b['width']) * 2.5) + 24), min(native.height, math.ceil((b['y'] + b['height']) * 2.5) + 24))
            crop = native.crop(box)
            file = OUT / f'paragraph-{len(records)+1:03}.png'
            crop.save(file)
            record = {'paper': paper['id'], 'question': capture['question'], 'key': paragraph['key'],
                      'lineBreaks': paragraph['actual'], 'image': str(file.relative_to(ROOT)), 'size': list(crop.size),
                      'pixelSha256': hashlib.sha256(crop.tobytes()).hexdigest(), 'actuallyViewed': False}
            records.append(record)
            pictures.append((record, crop.resize((round(crop.width / 2.5), round(crop.height / 2.5)), Image.Resampling.LANCZOS)))
    assert cursor == len(draws)
sheets, batch, heights = [], [], [0, 0]

def flush():
    if not batch:
        return
    image = Image.new('RGB', (1960, max(heights)), '#ddd')
    draw = ImageDraw.Draw(image)
    for record, crop, column, top in batch:
        image.paste(crop, (column * 980 + 8, top + 30))
        draw.text((column * 980 + 8, top + 8), f"{record['paper']} {record['question']} | actual PDF paragraph", fill='black')
    file = OUT / f'sheet-{len(sheets)+1:03}.png'
    image.save(file)
    sheets.append({'image': str(file.relative_to(ROOT)), 'records': [r['image'] for r, _, _, _ in batch], 'actuallyViewed': False})

for record, crop in pictures:
    column = 0 if heights[0] <= heights[1] else 1
    if heights[column] + crop.height + 40 > 1250:
        flush()
        batch, heights, column = [], [0, 0], 0
    batch.append((record, crop, column, heights[column]))
    heights[column] += crop.height + 40
flush()
(OUT / 'review-ledger.json').write_text(json.dumps({'scope': 'Actual PDF embedded pixels at browser-reference scale with native 2.5x crops retained; every image row accounted for. Only the reviewed paragraph inventory, not a whole-page source or tagged-PDF certificate.', 'paragraphs': records, 'sheets': sheets}, indent=2) + '\n')
print(len(records), 'paragraphs;', len(sheets), 'sheets')
