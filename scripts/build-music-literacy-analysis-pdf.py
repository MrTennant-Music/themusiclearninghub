"""Render the source-linked yearly Literacy Analysis as numeric tables.

The complete yearly inventory is retained separately from this renderer.
Paper frequency deduplicates multiple tasks of the same type in one paper.
"""
import json
from urllib.parse import quote
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.colors import HexColor, black, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import simpleSplit

ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT/'data/analysis/music-literacy-analysis.json').read_text())
OUT = ROOT/'docs/Music Literacy Question Analysis.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
W, H = landscape(letter)
M = 36
CW = W-2*M
FONT, BOLD = 'Helvetica', 'Helvetica-Bold'
font_path = Path('/System/Library/Fonts/Supplemental/Arial.ttf')
if font_path.exists():
    pdfmetrics.registerFont(TTFont('Analysis', str(font_path)))
    pdfmetrics.registerFont(TTFont('AnalysisBold', str(font_path.with_name('Arial Bold.ttf'))))
    FONT, BOLD = 'Analysis', 'AnalysisBold'
BLUE = HexColor('#e3eaf2')
GREEN = HexColor('#166534')
SHADES = ['#ffffff', '#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac']
C = canvas.Canvas(str(OUT), pagesize=(W,H))
C.setTitle('Music Literacy Question Analysis')
C.setAuthor('The Music Learning Hub')
INDEX = []


def text(x, y, value, size=10, bold=False, centre=False, colour=black):
    C.setFont(BOLD if bold else FONT, size)
    C.setFillColor(colour)
    (C.drawCentredString if centre else C.drawString)(x, y, str(value))


def percent(n, denominator):
    return f'{100*n/denominator:.1f}'.rstrip('0').rstrip('.')+'%'


def shade(n, denominator):
    return HexColor(SHADES[0 if n == 0 else min(4, int(((100*n/denominator)-.0001)/25)+1)])


def para(x, y, value, width, size=9, leading=12):
    for line in simpleSplit(value, FONT, size, width):
        text(x,y,line,size)
        y-=leading
    return y


def table(x, y, widths, headings, rows, *, size=10, row_height=20, percent_column=None, numeric=(), links=None):
    """Draw cell fills first and all rules last for a continuous thin grid."""
    boundaries=[y]
    all_rows=[headings]+rows
    for ri,row in enumerate(all_rows):
        header = ri == 0
        font = BOLD if header else FONT
        lines=[simpleSplit(str(cell),font,size,width-12) or [''] for cell,width in zip(row,widths)]
        height=max(row_height, max(map(len,lines))*(size+2)+4)
        xx=x
        for ci,(cell,width) in enumerate(zip(lines,widths)):
            fill=BLUE if header else white
            if not header and percent_column==ci:
                fill=shade(float(str(row[ci]).rstrip('%')),100)
            C.setFillColor(fill)
            C.rect(xx,y-height,width,height,stroke=0,fill=1)
            yy=y-(height-len(cell)*(size+2))/2-size
            if not header and row[ci] == 'TICK':
                cx=xx+width/2
                cy=y-height/2
                C.setStrokeColor(black)
                C.setLineWidth(1)
                tick=C.beginPath()
                tick.moveTo(cx-3,cy)
                tick.lineTo(cx-.5,cy-2.5)
                tick.lineTo(cx+4,cy+3)
                C.drawPath(tick)
                if links and (ri-1,ci) in links:
                    C.linkURL(links[(ri-1,ci)],(xx,y-height,xx+width,y),relative=0,thickness=0)
            else:
                for line in cell:
                    text(xx+width/2 if ci in numeric else xx+6, yy, line, size, header,
                         centre=ci in numeric, colour=GREEN if not header and ci==percent_column and line!='0%' else black)
                    yy-=size+2
            xx+=width
        y-=height
        boundaries.append(y)
    C.setStrokeColor(black)
    C.setLineWidth(.5)
    for yy in boundaries:C.line(x,yy,x+sum(widths),yy)
    xx=x
    for width in widths+[0]:
        C.line(xx,boundaries[-1],xx,boundaries[0]);xx+=width
    assert y >= 38, f'Table extends into footer: {y}'
    return y


def heading(report, section):
    text(W/2,H-40,report['label']+' Music Literacy Analysis',22,True,True)
    text(W/2,H-61,report['period'],12,True,True)
    text(M,H-91,section,17,True)
    return H-108


def end_page(report, kind):
    text(M,21,'The Music Learning Hub | Official question papers and marking instructions',8)
    text(W-M-12,21,C.getPageNumber(),8)
    INDEX.append({'page':C.getPageNumber(),'exam':report['key'],'kind':kind})
    C.showPage()


def answer_table(x,y,width,t):
    text(x,y,t['title'],12,True)
    y-=12
    rows=[[label,str(n),percent(n,t['denominator'])] for label,n in sorted(t['rows'],key=lambda row:-row[1])]
    y=table(x,y,[width*.60,width*.20,width*.20],['Answer',t['basis'],'Share'],rows,size=9,row_height=18,percent_column=2,numeric=(1,2))
    return y-12


for report in DATA['reports']:
    C.bookmarkPage(report['key'])
    C.addOutlineEntry(report['label'],report['key'],0)
    frequencies=sorted(report['frequency'],key=lambda row:(-row[1],row[0]))
    for start in range(0,len(frequencies),20):
        y=heading(report,'Question Frequency' if start==0 else 'Question Frequency (continued)')
        y=table(M,y,[CW/4]*4,['Papers analysed','Marked tasks','Audio required','Audio not required'],[[report['papers'],report['questions'],f'{report["audio"]} ({percent(report["audio"],report["questions"])})',f'{report["no_audio"]} ({percent(report["no_audio"],report["questions"])})']],size=10,row_height=23,numeric=(0,1,2,3))
        y-=20
        text(M,y,'Tick = at least one task of that type in the paper. Blank = no task of that type.',9)
        text(M,y-12,'Frequency counts each paper once per type. Click a tick to open its source paper.',9)
        y-=29
        rows=[]
        links={}
        for ri,(label,n) in enumerate(frequencies[start:start+20]):
            cells=[label]
            for ci,paper in enumerate(report['yearly'],1):
                matching=[t for t in paper['tasks'] if t['category']==label]
                cells.append('TICK' if matching else '')
                if matching:links[(ri,ci)]='../'+quote(paper['sources'][0],safe='/')+'#page='+str(matching[0]['source_page'])
            rows.append(cells+[f'{n}/{report["papers"]}',percent(n,report['papers'])])
        widths=[300]+[26]*len(report['years'])+[60,CW-360-26*len(report['years'])]
        height=min(23,(y-58)/(len(rows)+1))
        y=table(M,y,widths,['Question type']+list(map(str,report['years']))+['Papers','Frequency'],rows,size=9,row_height=height,percent_column=len(widths)-1,numeric=tuple(range(1,len(widths))),links=links)
        end_page(report,'question-frequency')

    y=heading(report,'Answer Frequency and Notation Details')
    if report['key']!='AH':
        text(M,y,'Papers = extracts using that key or metre. Answers = individual responses within the named category.',9)
        text(M,y-13,'Share uses the total within each table; answer shares are not percentages of all papers.',9)
        y-=38
        width=(CW-36)/3
        for start in range(0,len(report['answers']),3):
            bottoms=[answer_table(M+column*(width+18),y,width,t) for column,t in enumerate(report['answers'][start:start+3])]
            y=min(bottoms)-4
        y+=7
        text(M,y,'Other recorded answers and task details',12,True)
        y-=12
        rows=report['details']
        table(M,y,[130,85,CW-215],['Area','Count','Recorded detail'],rows,size=8.5,row_height=21)
    else:
        para(M,y,'Counts come from the yearly task inventory. One question type may have several separately marked tasks in a paper.',CW,9,12)
        y-=35
        left_width=235
        text(M,y,'Rhythmic and structural notation',12,True)
        table(M,y-12,[left_width-45,45],['Skill','Count'],[[a,n] for a,n in report['skills']],size=9,row_height=23,numeric=(1,))
        answer_table(M,y-225,left_width,report['answers'][0])
        x=M+left_width+22
        right_width=CW-left_width-22
        text(x,y,'Recorded answer examples and scope',12,True)
        table(x,y-12,[105,79,right_width-184],['Area','Count / scope','Recorded detail'],report['details'],size=8.5,row_height=24)
    end_page(report,'answer-frequency')

C.save()
(ROOT/'data/analysis/music-literacy-analysis.index.json').write_text(json.dumps(INDEX,indent=2)+'\n')
print(f'Created {len(INDEX)} pages: {OUT.relative_to(ROOT)}')
