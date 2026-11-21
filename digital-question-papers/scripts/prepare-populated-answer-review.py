"""Native-scale crops of every expanded marked field, retaining exact duplicates."""
import hashlib,json,math,os
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/os.environ.get('AUDIT_BASE','maintenance/generated/past-paper-populated-layout-chromium-final')
OUT=ROOT/os.environ.get('AUDIT_OUTPUT','maintenance/generated/past-paper-populated-field-review');OUT.mkdir(exist_ok=True,parents=True)
assert not (OUT/'review-ledger.json').exists(),'Never overwrite a visual-review ledger'
raw=json.loads((BASE/'checks.json').read_text());crops=[];seen={}
if os.environ.get('AUDIT_PAPER_PREFIX'):raw['papers']=[p for p in raw['papers'] if p['id'].startswith(os.environ['AUDIT_PAPER_PREFIX'])]
for paper in raw['papers']:
 for question in paper['questions']:
  if not question['captures']:continue
  screenshot=Image.open(BASE/question['captures'][0]).convert('RGB')
  entry=question['entry']['fields'];fields=question['checked']['fields']
  for index,field in enumerate(fields):
   if not field['value'] or field.get('coveredByMarkedOverlay'):continue
   b=field['bounds'];expanded='paper-expanded-answer' in field['classes']
   if field['tag']=='TEXTAREA':
    original=next((f for f in entry if f['id']==field['id'] and f['part']==field['part'] and f['value']==field['value']),None)
    expanded=original is not None and b['height']>original['bounds']['height']+2
   if 'higher-concept-line-marked-answer' in field['classes']:
    expanded=b['height']>52
   if not expanded:continue
   box=(max(0,math.floor(b['x'])-10),max(0,math.floor(b['y'])-10),min(screenshot.width,math.ceil(b['x']+b['width'])+10),min(screenshot.height,math.ceil(b['y']+b['height'])+10))
   image=screenshot.crop(box);digest=hashlib.sha256(image.tobytes()).hexdigest()
   record={'paper':paper['id'],'scenario':paper['scenario'],'question':question['id'],'part':field['part'],'fieldId':field['id'],'value':field['value'],'box':box,'source':str((BASE/question['captures'][0]).relative_to(ROOT)),'pixelSha256':digest,'actuallyViewed':False}
   if digest in seen:record['exactDuplicateOf']=seen[digest]
   else:
    target=OUT/f'crop-{len(crops)+1:04}.png';image.save(target);record['image']=str(target.relative_to(ROOT));seen[digest]=record['image']
   crops.append(record)
# Keep native pixels; split tall fields with overlapping context rather than shrink.
items=[]
for crop in crops:
 if 'image' not in crop:continue
 im=Image.open(ROOT/crop['image']).convert('RGB')
 for top in range(0,im.height,820):
  piece=im.crop((0,max(0,top-24),im.width,min(im.height,top+844)))
  items.append((crop,piece,top))
sheets=[];batch=[];heights=[0,0]
def flush():
 if not batch:return
 sheet=Image.new('RGB',(1960,max(heights)),'#ddd');draw=ImageDraw.Draw(sheet)
 records=[]
 for crop,im,top,column,y in batch:
  sheet.paste(im,(column*980+8,y+30));draw.text((column*980+8,y+8),f"{crop['paper']} {crop['scenario']} {crop['part'] or crop['question']} | field {crop['fieldId']} | crop y {top}",fill='black');records.append({'image':crop['image'],'top':top})
 target=OUT/f'sheet-{len(sheets)+1:03}.png';sheet.save(target);sheets.append({'image':str(target.relative_to(ROOT)),'crops':records,'actuallyViewed':False})
for crop,im,top in items:
 column=0 if heights[0]<=heights[1] else 1
 if heights[column]+im.height+40>1250:
  flush();batch=[];heights=[0,0];column=0
 batch.append((crop,im,top,column,heights[column]));heights[column]+=im.height+40
flush()
result={'scope':'Every expanded marked text field in the completed Chromium scenarios. Crops retain native pixels and all tall-field strips with overlap. Exact duplicate pixels are linked separately. This does not certify every complete populated question screenshot, PDF page or source line break.','paperScenarioRecords':len(raw['papers']),'fields':crops,'sheets':sheets}
(OUT/'review-ledger.json').write_text(json.dumps(result,indent=2)+'\n');print(len(crops),'expanded field instances;',len(seen),'unique crops;',len(sheets),'native-scale review sheets')
