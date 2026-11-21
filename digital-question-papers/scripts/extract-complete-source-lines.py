"""Retain complete source text rows without the old per-page MARKS cutoff."""
import json,re,os
from pathlib import Path
import pdfplumber
R=Path(__file__).resolve().parents[2];A=R/'digital-question-papers/audit/2026-11-05';old=json.loads((Path(__file__).resolve().parents[1] / 'tests/fixtures/source/fine-source-typography.json').read_text());result={'scope':'Full-width original Trebuchet character rows. Source question boundaries reuse the independently reviewed A163 heading inventory; last two print-only pages excluded. This is extraction evidence, not visual certification.','papers':[]}
for p in old['papers']:
 headings=[f for f in p['allFragments'] if re.fullmatch(r'Question\s+\d+(?:\s*\([a-z0-9]+\))*',f['text'],re.I)];rows=[]
 with pdfplumber.open(R/p['source']) as pdf:
  for pi,page in enumerate(pdf.pages[:p['sourcePages']-2],1):
   cs=[c for c in page.chars if 'trebuchet' in c['fontname'].lower() and 38<c['x0']<535 and 45<c['top']<page.height-45];groups=[]
   for c in sorted(cs,key=lambda c:(round(c['top']),c['x0'])):
    line=next((g for g in groups[-4:] if abs(g[0]['top']-c['top'])<2),None)
    if line is None:groups.append([c])
    else:line.append(c)
   for g in groups:
    g.sort(key=lambda c:c['x0']);top=min(c['top'] for c in g);valid=[h for h in headings if h['page']<pi or h['page']==pi and h['box'][1]<=top+2]
    if not valid:continue
    h=max(valid,key=lambda h:(h['page'],h['box'][1]));text=''.join(c['text'] for c in g).strip();normal=re.sub('[^a-z0-9]','',text.lower())
    if normal:rows.append({'question':h['question'],'page':pi,'text':text,'normal':normal,'box':[min(c['x0'] for c in g),top,max(c['x1'] for c in g),max(c['bottom'] for c in g)]})
 result['papers'].append({'id':p['id'],'source':p['source'],'sourceSha256':p['sha256'],'rows':rows});print(p['id'],len(rows),'complete rows',flush=True)
(A/'complete-source-lines.json').write_text(json.dumps(result,indent=2)+'\n')
