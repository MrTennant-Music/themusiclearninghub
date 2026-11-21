"""Read the actual Max mark column, independently of the application marks.

The retained PDF word boxes support source inspection of every discrepancy.
Repeated rows are kept; comparison output is triage until source-viewed.
"""
import json, re, os, hashlib, subprocess, shutil
from pathlib import Path
import pdfplumber
ROOT = Path(__file__).resolve().parents[2]
if os.environ.get('AUDIT_MODEL'):
    model = json.loads(Path(os.environ['AUDIT_MODEL']).read_text())
else:
    # Read current application metadata each run. The independent PDF extraction
    # below remains the authority for the source mark allocations.
    node = os.environ.get('AUDIT_NODE') or shutil.which('node') or str(Path.home()/'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node')
    script = """const path=require('node:path'),registry=require('./digital-question-papers/paper-registry');process.stdout.write(JSON.stringify(Object.values(registry).map(e=>{const p=require(path.resolve('digital-question-papers',e.dataFile.split('?')[0]));return{id:p.id,mi:path.resolve('digital-question-papers',p.markingInstructionsPath),questions:p.questions.map(q=>({id:q.id,parts:q.subquestions.map(s=>({id:s.id,marks:s.marks}))}))};})));"""
    model = json.loads(subprocess.check_output([node, '-e', script], cwd=ROOT, text=True))
    (ROOT/'digital-question-papers/audit/2026-11-05/source-mark-model.json').write_text(json.dumps(model, indent=2)+'\n')
review=json.loads((ROOT/'digital-question-papers/audit/2026-11-05/source-mark-extraction-review.json').read_text())
results=[]
for paper in model:
    rows=[]; flags=[]; q=part=roman=''
    with pdfplumber.open(paper['mi']) as pdf:
        for page_no,page in enumerate(pdf.pages,1):
            words=page.extract_words()
            headers=[w for w in words if w['text'].lower()=='max' and w['top']<160]
            if not headers: continue
            header=headers[0]
            mark_headers=[w for w in words if w['text'].lower()=='mark' and 0<=w['top']-header['top']<22 and abs(w['x0']-header['x0'])<15]
            header_right=max([header['x1']]+[w['x1'] for w in mark_headers]);header_left=min([header['x0']]+[w['x0'] for w in mark_headers]);cx=(header_left+header_right)/2
            bottom=max([header['bottom']]+[w['bottom'] for w in mark_headers])
            body=sorted([w for w in words if w['top']>bottom and w['bottom']<page.height-30],key=lambda w:(round(w['top']/2)*2,w['x0']))
            lines=[]
            for w in body:
                line=next((line for line in lines[-3:] if abs(line['top']-w['top'])<2),None)
                if line is None:line={'top':w['top'],'words':[]};lines.append(line)
                line['words'].append(w)
            for line in lines:
                ws=sorted(line['words'],key=lambda w:w['x0'])
                for w in ws:
                    if w['x0']>=130:continue
                    text=w['text'];major=re.fullmatch(r'(\d+)\.?',text)
                    if major and w['x0']<75:q=major[1];part=roman=''
                    label=re.fullmatch(r'\(([a-z]+)\)',text)
                    if label:
                        label=label[1]
                        if label in ['i','ii','iii','iv','v','vi']:roman=label
                        elif len(label)==1:part=label;roman=''
                marks=[w for w in ws if re.fullmatch(r'\d{1,2}',w['text']) and header_left-3<(w['x0']+w['x1'])/2<header_right+3]
                for w in marks:
                    if not q:flags.append({'page':page_no,'reason':'mark without question context','word':w});continue
                    rows.append({'id':'q'+q+part+roman,'marks':int(w['text']),'page':page_no,'sourceLine':' '.join(w['text'] for w in ws),'maxColumnCentre':cx,'markBox':{k:w[k] for k in ['x0','x1','top','bottom']}})
    excluded=[]
    for exception in review['exclusions']:
        if exception['paper']!=paper['id']:continue
        matching=[row for row in rows if row['id']==exception['id'] and row['page']==exception['page'] and row['marks']==exception['marks'] and exception['contains'] in row['sourceLine']]
        assert len(matching)==1, 'Reviewed source exclusion changed'
        rows.remove(matching[0]);excluded.append({**matching[0],'review':exception['reason']})
    for exception in review['supplements']:
        if exception['paper']==paper['id']:
            rows.append({**exception,'method':'Independent visually confirmed rubric / question-paper mark'})
    grouped={}
    for row in rows:grouped[row['id']]=grouped.get(row['id'],0)+row['marks']
    comparisons=[]
    parts=[p for q in paper['questions'] for p in q['parts']]
    for key,marks in grouped.items():
        numeric=re.sub(r'(iii|ii|i)$',lambda m:{'i':'1','ii':'2','iii':'3'}[m[0]],key)
        matched=[p for p in parts if p['id']==key] or [p for p in parts if p['id']==numeric] or [p for p in parts if p['id'].startswith(key) and (not key[-1].isdigit() or not p['id'][len(key):len(key)+1].isdigit())]
        if paper['id']=='higher-2018' and key in ['q2a','q2b']:
            matched=[p for p in parts if p['id'] in (['q2a','q2b','q2c','q2d','q2e'] if key=='q2a' else ['q2f'])]
        implemented=sum(p['marks'] for p in matched)
        comparisons.append({'sourceId':key,'sourceMarks':marks,'implementedMarks':implemented,'partIds':[p['id'] for p in matched],'passed':bool(matched) and marks==implemented})
    result={'id':paper['id'],'source':str(Path(paper['mi']).relative_to(ROOT)),'sourceSha256':hashlib.sha256(Path(paper['mi']).read_bytes()).hexdigest(),'rows':rows,'sourceTotal':sum(r['marks'] for r in rows),'comparisons':comparisons,'extractionFlags':flags,'excludedContentNumerals':excluded,'unmappedParts':[p['id'] for p in parts if p['id'] not in [id for c in comparisons for id in c['partIds']]],'duplicatePartMappings':[id for id in {id for c in comparisons for id in c['partIds']} if sum(id in c['partIds'] for c in comparisons)>1]}
    results.append(result);print(paper['id'],len(rows),'rows',result['sourceTotal'],'marks',sum(not c['passed'] for c in comparisons),'comparison flags',flush=True)
    Path(os.environ.get('AUDIT_RESULTS_FILE',str(ROOT/'digital-question-papers/audit/2026-11-05/source-mark-allocations.json'))).write_text(json.dumps({'scope':'Independent official PDF Max-mark column extraction and row-group comparison. Exact source words/boxes retained. All mismatches or incomplete totals require source visual review; not certification by matching data alone.','papers':results},indent=2)+'\n')
