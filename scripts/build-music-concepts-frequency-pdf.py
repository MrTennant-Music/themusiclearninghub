"""Render reviewed concept matrices in the companion Literacy Analysis PDF style."""
import json
from pathlib import Path
from urllib.parse import quote
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.colors import HexColor, black, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import simpleSplit

ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT/'music-dictionary/music-concepts-frequency.json').read_text())
EVIDENCE = json.loads((ROOT/'music-dictionary/music-concepts-exam-evidence.json').read_text())
source = (ROOT/'music-dictionary/music-concepts-data.js').read_text()
DICTIONARY = json.loads(source.split('const data=', 1)[1].rsplit(';if(typeof module', 1)[0])
LISTED = {cid for cols in DICTIONARY['tables'].values() for col in cols for cid in col}
CONCEPTS = sorted((c for c in DICTIONARY['concepts'] if c['id'] in LISTED), key=lambda c: (c['name'].casefold(), DICTIONARY['levels'].index(c['level'])))
INTRO = dict(zip(DICTIONARY['levels'], ['N3', 'N4', 'N5', 'H', 'AH']))
PAPERS = {(p['exam'], p['year']): p for p in EVIDENCE['papers']}
OUT = ROOT/'docs/music-concepts-exam-frequency.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)

# Match the reference report's Arial; use its standard PDF equivalent elsewhere.
ARIAL = Path('/System/Library/Fonts/Supplemental/Arial.ttf')
ARIAL_BOLD = ARIAL.with_name('Arial Bold.ttf')
FONT, BOLD = 'Helvetica', 'Helvetica-Bold'
if ARIAL.exists() and ARIAL_BOLD.exists():
    pdfmetrics.registerFont(TTFont('Analysis', str(ARIAL)))
    pdfmetrics.registerFont(TTFont('AnalysisBold', str(ARIAL_BOLD)))
    FONT, BOLD = 'Analysis', 'AnalysisBold'
GREEN = HexColor('#166534')
HEADER = HexColor('#e3eaf2')
SHADES = ['#ffffff', '#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac']
M = 54
W, H = letter
CONTENT = W - 2*M
C = canvas.Canvas(str(OUT), pagesize=(W, H))
C.setTitle('Music Concepts Question Analysis')
C.setAuthor('The Music Learning Hub')
PAGE_INDEX = []


def clean(value):
    return str(value).replace('\u2011', '-').replace('\u2013', '-').replace('\u2014', '-')


def text(x, y, value, size=10, bold=False):
    C.setFont(BOLD if bold else FONT, size)
    C.setFillColor(black)
    C.drawString(x, y, clean(value))


def centred(y, value, size=22.1, bold=True):
    C.setFont(BOLD if bold else FONT, size)
    C.setFillColor(black)
    C.drawCentredString(W/2, y, clean(value))


def paragraph(value, x, y, width, size=12, leading=17):
    for line in simpleSplit(clean(value), FONT, size, width):
        text(x, y, line, size)
        y -= leading
    return y


def grid_row(values, widths, top, size=12, header=False, centres=()):
    lines = [simpleSplit(clean(value), BOLD if header else FONT, size, width-12) for value, width in zip(values, widths)]
    height = max(len(cell) for cell in lines)*(size+3)+8
    x = M
    for i, (cell, width) in enumerate(zip(lines, widths)):
        C.setFillColor(HEADER if header else white)
        C.setStrokeColor(black)
        C.setLineWidth(.5)
        C.rect(x, top-height, width, height, stroke=1, fill=1)
        y = top-(height-len(cell)*(size+3))/2-size
        for line in cell:
            C.setFont(BOLD if header else FONT, size)
            C.setFillColor(black)
            if i in centres:
                C.drawCentredString(x+width/2, y, line)
            else:
                C.drawString(x+6, y, line)
            y -= size+3
        x += width
    return top-height


def new_page(kind, key=None, ids=None):
    PAGE_INDEX.append({'page': C.getPageNumber(), 'kind': kind, 'exam': key, 'concept_ids': ids or []})
    text(M, 22, 'The Music Learning Hub | Reviewed '+DATA['reviewedOn'], 8)
    C.setFont(FONT, 8)
    C.drawRightString(W-M, 22, str(C.getPageNumber()))
    C.showPage()


def page_size(size, margin):
    global W, H, M, CONTENT
    W, H = size
    M = margin
    CONTENT = W-2*M
    C.setPageSize(size)


def matrix_rules(boundaries, columns):
    # Draw the full grid after cell fills so adjacent rows cannot cover the rules.
    C.setStrokeColor(black)
    C.setLineWidth(.5)
    for y in boundaries:
        C.line(M, y, W-M, y)
    for x in columns:
        C.line(x, boundaries[-1], x, boundaries[0])


def percent(p):
    return f'{p:.1f}'.rstrip('0').rstrip('.')+'%'


# Preserve the full year matrices in landscape so names and years remain legible.
page_size(landscape(letter), 36)
for key, report in DATA['reports'].items():
    level_concepts = CONCEPTS
    years = report['years']
    N = len(years)
    widths = [260, 32]+[27]*N+[53, CONTENT-260-32-27*N-53]
    assert min(widths) >= 27
    xs = [M]
    for width in widths:
        xs.append(xs[-1]+width)

    def heading(first):
        if first:
            C.bookmarkPage(key)
            C.addOutlineEntry(report['label'], key, 0)
        centred(H-43, report['label']+' Music Concepts Analysis')
        centred(H-69, f'{min(years)}-{max(years)}', 14.4)
        text(M, H-98, 'Concept Frequency', 18.5, True)
        text(M, H-116, f'{N} papers analysed | {len(level_concepts)} concepts | Tick = at least one credited appearance', 10)
        return grid_row(['Concept', 'Level']+list(map(str, years))+['Papers', 'Frequency'], widths, H-128, 9, True, tuple(range(1, len(widths))))

    y = heading(True)
    boundaries = [y]
    ids = []
    for concept in level_concepts:
        lines = simpleSplit(clean(concept['name']), FONT, 10, widths[0]-12)
        height = max(19, len(lines)*12+6)
        if y-height < 42:
            matrix_rules(boundaries, xs)
            new_page('matrix', key, ids)
            ids = []
            y = heading(False)
            boundaries = [y]
        hit = report['concepts'][concept['id']]
        C.setFillColor(white)
        C.rect(M, y-height, CONTENT, height, stroke=0, fill=1)
        frequency_band = 0 if hit['percent'] <= 0 else min(4, int((hit['percent'] - .0001) / 25) + 1)
        C.setFillColor(HexColor(SHADES[frequency_band]))
        C.rect(xs[-2], y-height, widths[-1], height, stroke=0, fill=1)
        for idx, line in enumerate(lines):
            text(M+6, y-(height-len(lines)*12)/2-9-12*idx, line, 10)
        C.setFont(FONT, 9)
        C.setFillColor(black)
        C.drawCentredString((xs[1]+xs[2])/2, y-height/2-3, INTRO[concept['level']])
        for idx, year in enumerate(years):
            if year not in hit['years']:
                continue
            cx = (xs[idx+2]+xs[idx+3])/2
            cy = y-height/2
            C.setStrokeColor(black)
            C.setLineWidth(1)
            path = C.beginPath()
            path.moveTo(cx-3, cy)
            path.lineTo(cx-0.5, cy-2.5)
            path.lineTo(cx+4, cy+3)
            C.drawPath(path)
            paper = PAPERS[(key, year)]
            page = paper['answers'][concept['id']]['pages'][0]
            C.linkURL('../'+quote(paper['source'], safe='/')+'#page='+str(page), (cx-13, y-height, cx+13, y), relative=0, thickness=0)
        C.setFont(FONT, 10)
        C.setFillColor(black)
        C.drawCentredString((xs[-3]+xs[-2])/2, y-height/2-3.5, f'{hit["count"]}/{N}')
        C.setFillColor(GREEN if hit['count'] else black)
        C.drawCentredString((xs[-2]+xs[-1])/2, y-height/2-3.5, percent(hit['percent']))
        C.setStrokeColor(black)
        C.setLineWidth(.5)
        C.line(M, y-height, W-M, y-height)
        for x in xs:
            C.line(x, y-height, x, y)
        y -= height
        boundaries.append(y)
        ids.append(concept['id'])
    matrix_rules(boundaries, xs)
    new_page('matrix', key, ids)

C.save()
(ROOT/'data/analysis/music-concepts-exam-frequency.index.json').write_text(json.dumps(PAGE_INDEX, indent=2)+'\n')
print(f'Created {OUT.relative_to(ROOT)} ({len(PAGE_INDEX)} pages)')
