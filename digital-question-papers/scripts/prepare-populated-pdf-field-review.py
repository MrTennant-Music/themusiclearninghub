"""Inspect actual PDF image pixels for populated response fields."""
import hashlib,json,math,os
from pathlib import Path
from PIL import Image,ImageDraw
from pypdf import PdfReader
from pypdf.generic import ContentStream
ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/os.environ.get('AUDIT_PDF_BASE','maintenance/generated/past-paper-populated-exports-chromium-final')
LAYOUT=ROOT/os.environ.get('AUDIT_LAYOUT_BASE','maintenance/generated/past-paper-populated-layout-chromium-final')
OUT=ROOT/os.environ.get('AUDIT_OUTPUT','maintenance/generated/past-paper-populated-pdf-field-review');OUT.mkdir(exist_ok=True,parents=True)
assert not (OUT/'review-ledger.json').exists()
exports=json.loads((BASE/'exports-accessibility.json').read_text())
direct=bool(os.environ.get('AUDIT_CAPTURE_FIELDS'))
layouts=None if direct else json.loads((LAYOUT/'checks.json').read_text())
records=[];images=[]
for paper in exports['papers']:
 if os.environ.get('AUDIT_PAPER') and paper['id'] not in os.environ['AUDIT_PAPER'].split(','):continue
 layout=None if direct else next(p for p in layouts['papers'] if p['id']==paper['id'] and p['scenario']==os.environ.get('AUDIT_SCENARIO','accepted'))
 reader=PdfReader(BASE/(paper['id']+'-feedback.pdf'));draws=[]
 for pi,page in enumerate(reader.pages):
  for operands,op in ContentStream(page.get_contents(),reader).operations:
   if op!=b'Do':continue
   obj=page['/Resources']['/XObject'][operands[0]].get_object()
   if obj.get('/Subtype')=='/Image':draws.append((pi+1,obj))
 cursor=0
 for index,capture in enumerate(paper['capture']):
  expected=capture.get('canvasPixels',{}).get('height',math.floor(math.ceil(capture.get('renderedLayout',capture['layout'])['height'])*2.5));tiles=[];total=0
  while total<expected:
   page,obj=draws[cursor];cursor+=1;tiles.append((page,obj));total+=int(obj['/Height'])
  assert total==expected
  if index==0:continue
  q={'id':capture['question']} if direct else layout['questions'][index-1]
  actual=None if direct else next(v for v in layout['allFeedback'] if v['id']==q['id'])
  fields=[]
  candidates=[dict(f,classes=f['class']) for f in capture['textFields']] if direct else actual['fields']
  for f in candidates:
   if not f['value'] or f.get('coveredByMarkedOverlay'):continue
   expanded='paper-expanded-answer' in f['classes'] or 'higher-concept-line-marked-answer' in f['classes'] and f['bounds']['height']>52
   if direct and f['tag']=='DIV' and not any(c in f['classes'] for c in ['paper-expanded-answer','higher-concept-line-marked-answer','q8-marked-final-answer']):expanded=True
   if not direct and f['tag']=='TEXTAREA':
    old=next((v for v in q['entry']['fields'] if v['id']==f['id'] and v['part']==f['part'] and v['value']==f['value']),None)
    expanded=bool(os.environ.get('AUDIT_ALL_TEXTAREAS')) or old is not None and f['bounds']['height']>old['bounds']['height']+2
   if os.environ.get('AUDIT_FINAL_ANSWERS'):
    expanded='q8-marked-final-answer' in f['classes']
   if expanded:fields.append(f)
  if not fields:continue
  native=Image.new('RGB',(int(tiles[0][1]['/Width']),expected),'white');top=0
  for page,obj in tiles:
   assert str(obj['/ColorSpace'])=='/DeviceRGB'
   tile=Image.frombytes('RGB',(int(obj['/Width']),int(obj['/Height'])),obj.get_data());native.paste(tile,(0,top));top+=tile.height
  for f in fields:
   b=dict(f['bounds'])
   # Inline question audio is intentionally omitted from PDF capture. Align
   # each field through its measured part, rather than reuse screen y blindly.
   if not direct:
    live=next(v for v in actual['panels'] if v['part']==f['part'])
    printed=next(v for v in capture['renderedLayout']['boxes'] if v['part']==f['part'] and 'subquestion' in v['class'].split())
    b['y']+=printed['top']-live['bounds']['y']
   box=(max(0,math.floor(b['x']*2.5)-24),max(0,math.floor(b['y']*2.5)-24),min(native.width,math.ceil((b['x']+b['width'])*2.5)+24),min(native.height,math.ceil((b['y']+b['height'])*2.5)+24));crop=native.crop(box);file=OUT/f"{paper['id']}-{q['id']}-{len(records):03}.png";crop.save(file)
   r={'paper':paper['id'],'question':q['id'],'part':f['part'],'fieldId':f['id'],'value':f['value'],'pdfPages':sorted(set(p for p,_ in tiles)),'image':str(file.relative_to(ROOT)),'nativeSha256':hashlib.sha256(crop.tobytes()).hexdigest(),'actuallyViewed':False};records.append(r)
   crop=crop.resize((round(crop.width/2.5),round(crop.height/2.5)),Image.Resampling.LANCZOS)
   for y in range(0,crop.height,820):images.append((r,crop.crop((0,max(0,y-24),crop.width,min(crop.height,y+844))),y))
sheets=[];batch=[];heights=[0,0]
def flush():
 if not batch:return
 im=Image.new('RGB',(1960,max(heights)),'#ddd');d=ImageDraw.Draw(im)
 for r,crop,top,col,y in batch:im.paste(crop,(col*980+8,y+30));d.text((col*980+8,y+8),f"{r['paper']} {r['question']} {r['part']} | PDF pixels | crop y {top}",fill='black')
 p=OUT/f'sheet-{len(sheets)+1:03}.png';im.save(p);sheets.append({'image':str(p.relative_to(ROOT)),'records':[{'image':r['image'],'top':top} for r,_,top,_,_ in batch],'actuallyViewed':False})
for r,crop,top in images:
 col=0 if heights[0]<=heights[1] else 1
 if heights[col]+crop.height+40>1250:flush();batch=[];heights=[0,0];col=0
 batch.append((r,crop,top,col,heights[col]));heights[col]+=crop.height+40
flush()
(OUT/'review-ledger.json').write_text(json.dumps({'scope':'Actual embedded PDF image pixels, reconstructed in render order with strict row accounting, for the selected populated fields. Direct mode uses capture-clone field bounds; otherwise browser bounds are aligned through each printed part. Reviewed at browser-reference scale; native 2.5x crops retained. This does not certify all complete PDF pages or official-source line breaks.','fields':records,'sheets':sheets},indent=2)+'\n');print(len(records),'actual PDF field crops;',len(sheets),'sheets')
