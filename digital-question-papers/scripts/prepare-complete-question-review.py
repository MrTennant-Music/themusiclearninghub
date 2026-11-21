"""Retain every screenshot pixel in legible, overlapping native-size strips."""
import hashlib,json,os
from pathlib import Path
from PIL import Image,ImageDraw
R=Path(__file__).resolve().parents[2];B=R/os.environ.get('AUDIT_BASE','maintenance/generated/past-paper-source-line-layout-chromium-complete');O=R/os.environ.get('AUDIT_OUTPUT','maintenance/generated/past-paper-complete-question-review');O.mkdir(parents=True,exist_ok=True);assert not (O/'review-ledger.json').exists()
raw=json.loads((B/'checks.json').read_text());records=[];unique={};pieces=[]
for p in raw['papers']:
 for q in p['questions']:
  image=Image.open(B/q['capture']).convert('RGB');parts=[]
  for y in range(0,image.height,1060):
   box=[0,max(0,y-24),image.width,min(image.height,y+1084)];crop=image.crop(box);h=hashlib.sha256(crop.tobytes()).hexdigest();r={'paper':p['id'],'question':q['id'],'box':box,'pixelSha256':h,'actuallyViewed':False}
   if h in unique:r['exactDuplicateOf']=unique[h]
   else:
    target=O/f'crop-{len(pieces)+1:04}.png';crop.save(target);r['image']=str(target.relative_to(R));unique[h]=r['image'];pieces.append((r,crop))
   parts.append(r)
  records.append({'paper':p['id'],'question':q['id'],'screenshot':str((B/q['capture']).relative_to(R)),'sha256':hashlib.sha256((B/q['capture']).read_bytes()).hexdigest(),'size':[image.width,image.height],'strips':parts})
sheets=[]
for i in range(0,len(pieces),2):
 batch=pieces[i:i+2];im=Image.new('RGB',(1960,max(c.height for r,c in batch)+32),'#ddd');d=ImageDraw.Draw(im)
 for col,(r,crop) in enumerate(batch):im.paste(crop,(col*980,32));d.text((col*980+8,8),f"{r['paper']} {r['question']} | native screenshot y {r['box'][1]}-{r['box'][3]}",fill='black')
 target=O/f'sheet-{len(sheets)+1:03}.png';im.save(target);sheets.append({'image':str(target.relative_to(R)),'strips':[r['image'] for r,c in batch],'actuallyViewed':False})
(O/'review-ledger.json').write_text(json.dumps({'scope':'Complete current Chromium question screenshots at native pixel scale, with 24px strip overlaps and no omitted pixels. Exact repeated strips transfer only from an actually viewed matching strip. Source transcriptions and 300dpi source text crops are separate evidence. No review claims set by preparation.','questions':records,'sheets':sheets},indent=2)+'\n');print(len(records),'complete questions;',len(pieces),'unique native strips;',len(sheets),'review sheets;',sum(len(q['strips']) for q in records)-len(pieces),'exact duplicates')
