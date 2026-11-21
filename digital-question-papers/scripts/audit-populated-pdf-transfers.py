"""Transfer reviewed question pixels only when all encoded image data match."""
import hashlib,json,math
from pathlib import Path
from pypdf import PdfReader
from pypdf.generic import ContentStream
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'digital-question-papers/audit/2026-11-05/populated-pdf-body-transfers.json'
def signature(obj):
 h=hashlib.sha256();h.update(obj._data)
 for key in ['/Width','/Height','/ColorSpace','/BitsPerComponent','/Filter','/DecodeParms']:h.update((key+str(obj.get(key))).encode())
 if obj.get('/SMask'):h.update(signature(obj['/SMask'].get_object()).encode())
 return h.hexdigest()
def captures(base,record):
 reader=PdfReader(base/(record['id']+'-feedback.pdf'));images=[]
 for page in reader.pages:
  for args,op in ContentStream(page.get_contents(),reader).operations:
   if op==b'Do':
    image=page['/Resources']['/XObject'][args[0]].get_object()
    if image.get('/Subtype')=='/Image':images.append(image)
 result=[];cursor=0
 for c in record['capture']:
  size=c.get('canvasPixels',{}).get('height',math.floor(math.ceil(c.get('renderedLayout',c['layout'])['height'])*2.5));height=0;parts=[]
  while height<size:
   image=images[cursor];cursor+=1;height+=int(image['/Height']);parts.append(signature(image))
  assert height==size;result.append(parts)
 return result
runs=[]
for engine in ['chromium','webkit']:
 old=ROOT/f'maintenance/generated/past-paper-populated-exports-{engine}-verified';new=ROOT/f'maintenance/generated/past-paper-populated-exports-{engine}-current'
 prior=json.loads((old/'exports-accessibility.json').read_text());current=json.loads((new/'exports-accessibility.json').read_text());review=json.loads((ROOT/f'maintenance/generated/past-paper-populated-pdf-textarea-review-{engine}-before-colour/review-ledger.json').read_text());papers=[]
 for p in current['papers']:
  if p['id'].startswith('advanced-higher'):continue
  before=next(r for r in prior['papers'] if r['id']==p['id']);a=captures(old,before);b=captures(new,p);exact=a[1:]==b[1:]
  fields=[f for f in review['fields'] if f['paper']==p['id']];assert all(f['actuallyViewed'] for f in fields)
  papers.append({'id':p['id'],'questionCaptures':len(b)-1,'exactQuestionPixelTransfer':exact,'priorCaptureSignatures':a[1:],'currentCaptureSignatures':b[1:],'reviewedFieldsTransferred':len(fields) if exact else 0,'currentPdfSha256':hashlib.sha256((new/(p['id']+'-feedback.pdf')).read_bytes()).hexdigest(),'sourceReview':f'maintenance/generated/past-paper-populated-pdf-textarea-review-{engine}-before-colour/review-ledger.json'})
 runs.append({'engine':engine,'papers':papers});print(engine,len(papers),'papers;',sum(p['exactQuestionPixelTransfer'] for p in papers),'exact question-pixel transfers;',sum(p['reviewedFieldsTransferred'] for p in papers),'reviewed fields;',[(p['id']) for p in papers if not p['exactQuestionPixelTransfer']],flush=True)
OUT.write_text(json.dumps({'scope':'Only already-viewed non-AH response fields transfer from the pre-colour-change PDF when every question image stream, codec metadata and alpha image match exactly in render order. Summary colour/date differences are excluded and separately checked. AH pixels are superseded by the bold-font retests.','runs':runs},indent=2)+'\n')
