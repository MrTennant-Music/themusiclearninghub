"""Prepare per-system staff calibration for raster notation in official PDFs.
Detected candidates require visual confirmation; no pitch is inferred here.
"""
from pathlib import Path
import json
import pdfplumber
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[2]
manifest_path=root/'maintenance/reference/past-paper-source-audit/source-notation-manifest.json'
x=json.loads(manifest_path.read_text());scale=300/72
for paper in x['papers']:
 with pdfplumber.open((root/'digital-question-papers'/paper['source']).resolve()) as pdf:
  for record in paper['pages']:
   if not record['rasterCandidate']:continue
   page=pdf.pages[record['page']-1];image=Image.open(root/record['render']);found=[]
   for image_number, region in enumerate(page.images):
    if region['width']<50 or region['height']<30:continue
    box=tuple(round(v*scale) for v in [region['x0'],region['top'],region['x1'],region['bottom']])
    crop=image.crop(box);a=np.array(crop.convert('L'));counts=(a<130).mean(axis=1)
    rows=np.flatnonzero(counts>.58).tolist();bands=[]
    for y in rows:
     if not bands or y>bands[-1][-1]+1:bands.append([y])
     else:bands[-1].append(y)
    centres=[sum(b)/len(b) for b in bands if len(b)<9];used=set()
    for y in centres:
     if y in used:continue
     for second in [v for v in centres if 8<v-y<48]:
      gap=second-y;lines=[y]
      for n in range(1,5):
       near=min(centres,key=lambda v:abs(v-y-n*gap))
       if abs(near-y-n*gap)>2:break
       lines.append(near)
      if len(lines)!=5:continue
      used.update(lines);points=[round((v+box[1])/scale,3) for v in lines]
      target=root/'maintenance/reference/past-paper-source-audit'/paper['id']/f"page-{record['page']:02d}-raster-{len(found)+1:02d}-300dpi.png"
      image.crop((box[0],max(0,round(lines[0]+box[1]-130)),box[2],min(image.height,round(lines[-1]+box[1]+160)))).save(target)
      found.append({'lineCentresPt':points,'lineCentresPx':[v+box[1] for v in lines],'gapPx':gap,'image':image_number,'crop':str(target.relative_to(root))});break
   record['rasterSystems']=found
   print(paper['id'],record['page'],len(found),'raster staff candidates',flush=True)
manifest_path.write_text(json.dumps(x,indent=2)+'\n')
