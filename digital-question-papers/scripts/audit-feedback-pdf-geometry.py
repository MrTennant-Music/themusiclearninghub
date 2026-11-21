"""Verify every actual PDF slice against its browser capture dimensions.

This is a loss/geometry check, not a claim of source fidelity or tagged-PDF
accessibility. Every image draw is counted in page content order.
"""
import json, math, os
from pathlib import Path
from pypdf import PdfReader
from pypdf.generic import ContentStream
ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / os.environ.get('AUDIT_PDF_BASE', 'maintenance/generated/past-paper-final-wording-exports')
OUT = ROOT / os.environ.get('AUDIT_RESULTS_FILE', 'digital-question-papers/audit/2026-11-05/pdf-geometry.json')
records = json.loads((BASE / 'exports-accessibility.json').read_text())['papers']
results = []
for record in records:
    item = {'id': record['id'], 'pages': [], 'checks': [], 'errors': []}
    def check(passed, name): item['checks'].append({'passed': bool(passed), 'name': name})
    try:
        reader = PdfReader(BASE / (record['id'] + '-feedback.pdf'))
        draws = []
        for index, page in enumerate(reader.pages):
            width, height = float(page.mediabox.width), float(page.mediabox.height)
            check(abs(width - 595.28) < .1 and abs(height - 841.89) < .1, f'page {index+1}: A4 media box')
            page_draws, matrix = [], None
            for operands, operation in ContentStream(page.get_contents(), reader).operations:
                if operation == b'cm': matrix = list(map(float, operands))
                if operation != b'Do': continue
                image = page['/Resources']['/XObject'][operands[0]].get_object()
                if image.get('/Subtype') != '/Image': continue
                iw, ih = int(image['/Width']), int(image['/Height'])
                assert matrix is not None, 'missing image transform'
                a, b, c, d, x, y = matrix
                check(abs(b) < .001 and abs(c) < .001 and a > 0 and d > 0, f'page {index+1}: image has no rotation or inversion')
                check(x >= 0 and y >= 0 and x + a <= width + .1 and y + d <= height + .1, f'page {index+1}: entire image lies inside the page')
                check(abs((a / d) / (iw / ih) - 1) < .00001, f'page {index+1}: image retains its native aspect ratio')
                for previous in page_draws:
                    check(y + d <= previous['y'] + .1 or previous['y'] + previous['height'] <= y + .1, f'page {index+1}: image blocks do not overlap')
                draw = {'pixels': [iw, ih], 'y': y, 'height': d}
                draws.append(draw); page_draws.append(draw)
            check(bool(page_draws), f'page {index+1}: has captured content')
            item['pages'].append({'number': index+1, 'images': page_draws})
        cursor = 0
        for capture in record['capture']:
            # html2canvas measures its rendered clone, whose outlined glyphs can
            # shift a fractional edge across an integer-height boundary.
            # Prefer recorded canvas pixels; older runs retain the clone height.
            rendered = capture.get('renderedLayout', capture['layout'])
            expected = capture.get('canvasPixels', {}).get('height', math.floor(math.ceil(rendered['height']) * 2.5))
            if capture.get('canvasPixels'):
                check(expected == math.floor(math.ceil(rendered['height']) * 2.5), f"{capture['element']}: recorded canvas pixels match its actual rendered clone")
            actual, widths = 0, set()
            while cursor < len(draws) and actual < expected:
                iw, ih = draws[cursor]['pixels']; actual += ih; widths.add(iw); cursor += 1
            check(actual == expected, f"{capture['element']}: every captured pixel row appears exactly once")
            check(len(widths) == 1, f"{capture['element']}: all slices retain their canvas width")
        check(cursor == len(draws), 'no additional or repeated image slices')
        check(len(record['capture']) == len(record['questions']) + 1 if record['questions'] else len(record['capture']) > 1, 'summary and every question were captured')
        item['tagged'] = bool(reader.trailer['/Root'].get('/StructTreeRoot'))
    except Exception as error:
        item['errors'].append(str(error))
    results.append(item)
    print(item['id'], len(item['pages']), 'pages', sum(not c['passed'] for c in item['checks']), 'failed checks', item['errors'], flush=True)
OUT.write_text(json.dumps({'scope': 'Actual PDF image geometry and complete browser-capture row accounting; not source fidelity or screen-reader certification', 'papers': results}, indent=2) + '\n')
raise SystemExit(any(p['errors'] or any(not c['passed'] for c in p['checks']) for p in results))
