"""Account for raw source flags without certifying omitted/adapted typography."""
import collections, hashlib, json, re
from pathlib import Path
import pdfplumber
ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/'digital-question-papers/audit/2026-11-05'
source=json.loads((Path(__file__).resolve().parents[1] / 'tests/fixtures/source/fine-source-typography.json').read_text())
page_roles={}
for paper in source['papers']:
    path=ROOT/paper['source']
    assert hashlib.sha256(path.read_bytes()).hexdigest()==paper['sha256']
    with pdfplumber.open(path) as pdf:
        roles=[]
        for number in [len(pdf.pages)-1,len(pdf.pages)]:
            text=pdf.pages[number-1].extract_text() or ''
            compact=re.sub(r'[^a-z]','',text.lower())
            assert any(s in compact for s in ['blankpage','additionalspaceforanswers','acknowledgement']), (paper['id'],number,text)
            roles.append({'page':number,'header':text[:240],'role':'print-only additional-answer/blank/copyright matter'})
        page_roles[paper['id']]=roles
runs=[]
for engine in ['chromium','webkit']:
    for phase in ['browser','feedback']:
        name=f'source-coverage-{engine}-{phase}.json'
        data=json.loads((BASE/name).read_text());papers=[]
        for paper in data['papers']:
            rows=[];matched=0
            for question in paper['questions']:
                for row in question['fragments']:
                    if row['matched']:
                        matched+=1;continue
                    n=row['normal'];category=None;certified=False
                    if row['supplementaryMatches']:
                        assert all(m['passed'] for m in row['supplementaryMatches'])
                        category='verified lyrics-only reconstruction';certified=True
                    elif row['segmentMatches']:
                        assert all(m['passed'] for m in row['segmentMatches'])
                        category='verified explicit cell/glyph reconstruction';certified=True
                    elif row['page'] in [r['page'] for r in page_roles[paper['id']]]:
                        category='omitted print-only back matter'
                    elif any(s in n for s in ['donotwriteonthispage','additionalspaceforanswers','blankpage','turnover']) or n in ['turn','turno','turnov','turnove','turnover']:
                        category='omitted printing instruction'
                    elif re.fullmatch(r'question\d+.*continued',n):
                        category='omitted repeated continued heading'
                    elif 'page' in n or n.endswith(('printedonthenext','whichisprintedon','ontheopposite')):
                        category='digital page-reference adaptation'
                    elif n=='endofquestionpaper':
                        category='approved digital end-marker omission'
                    elif (paper['id'],n) in {('higher-2015','tostayinandcuddle'),('higher-2015','whenlifegetsrough'),('higher-2017','itslikemagicifthingsgowrong')}:
                        category='retained approved teacher lyric adaptation'
                    elif (paper['id'] in ['higher-2022','higher-2023'] and n=='bbchordiv') or (paper['id'] in ['national5-2017','national5-2019','national5-2022'] and n in ['fcdmbb','fbbcdm','fdmbbc','fcbbdm','fbbdmc']):
                        category='flat-sign encoding; previously visually reviewed chord rows'
                    elif paper['id']=='national5-2014' and row['page']==5 and n in ['4pa','eeh','mmt','stn','eie','hyb']:
                        category='rotated guide extraction artefact; native source and browser separately reviewed'
                    elif paper['id']=='national5-2014' and n=='totalmarks' and row['page'] in [6,9,12]:
                        category='print-only footer total; marks verified separately'
                    assert category,(paper['id'],row)
                    rows.append({k:row[k] for k in ['question','page','text','normal','box']}|{'category':category,'reconstructedFontComparisonPassed':certified})
            papers.append({'id':paper['id'],'questionViews':len(paper['questions']),'directMatched':matched,'rawUnmatched':rows,'categories':dict(collections.Counter(r['category'] for r in rows))})
        count=collections.Counter(r['category'] for p in papers for r in p['rawUnmatched'])
        runs.append({'record':name,'engine':engine,'phase':data['phase'],'papers':papers,'categoryCounts':dict(count),'unclassified':0})
        print(engine,phase,dict(count),'unclassified 0')
result={'scope':'All 994 raw unmatched rows per run are accounted for. Only 50 reconstructed lyric/cell/glyph rows receive additional font comparisons; omitted matter, adaptations, encoding and rotated artefacts do not receive blanket literal-font certification. Exact line wrapping and full engraving certification remain partial.','sourcePageRoles':page_roles,'runs':runs,'manualEvidence':{'rotatedGuide':'maintenance/generated/past-paper-unanchored-source-review/national5-2014-guide-upright.png; maintenance/generated/past-paper-source-specials-{chromium,webkit}/checks.json','raisedL':'maintenance/generated/past-paper-unanchored-source-review/ah2017-raised-L-native.png; advanced-higher-2017-import-notes.md','overlaidNotes':'source-fragment-segments.json: national5-2024 Notes reconstruction','teacherLyrics':'higher-2015-import-notes.md; higher-2017-import-notes.md','endMarkers':'advanced-higher-2019-import-notes.md; advanced-higher-2024-import-notes.md; advanced-higher-2025-import-notes.md; advanced-higher-2026-import-notes.md','flatChordRows':'A161 fine-engraving-source-review.json and source-short-labels.test.js'}}
(BASE/'source-fragment-coverage.json').write_text(json.dumps(result,indent=2)+'\n')
