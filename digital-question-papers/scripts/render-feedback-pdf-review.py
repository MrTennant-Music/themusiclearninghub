"""Render every actual Share PDF for page-by-page visual review.

Contact sheets are triage, not source/notation fidelity certification. Keep the
full page images for detailed examination of any suspected clipping.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json,subprocess,math,os
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/os.environ.get('AUDIT_OUTPUT','maintenance/generated/past-paper-pdf-page-review');OUT.mkdir(parents=True,exist_ok=True)
POPPLER=Path('/Users/bobbytennant/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/poppler/bin')
BASE=ROOT/os.environ.get('AUDIT_PDF_BASE','maintenance/generated/past-paper-continuation-final')
FRESH=ROOT/os.environ['AUDIT_PDF_FRESH'] if os.environ.get('AUDIT_PDF_FRESH') else BASE
ids=[p.stem.replace('-feedback','') for p in BASE.glob('*-feedback.pdf') if not os.environ.get('AUDIT_PAPER') or p.stem.replace('-feedback','') in os.environ['AUDIT_PAPER'].split(',')]
def render(id):
 src=FRESH/f'{id}-feedback.pdf'
 if not src.exists():src=BASE/f'{id}-feedback.pdf'
 folder=OUT/id;folder.mkdir(parents=True,exist_ok=True)
 if not list(folder.glob('page-*.png')):subprocess.run([str(POPPLER/'pdftoppm'),'-r','90','-png',str(src),str(folder/'page')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
 pages=sorted(folder.glob('page-*.png'));w,h=340,500
 sheet=Image.new('RGB',(4*w,math.ceil(len(pages)/4)*h+36),'#ddd');draw=ImageDraw.Draw(sheet);draw.text((10,8),f'{id} | {len(pages)} actual Share PDF pages',fill='black')
 for i,p in enumerate(pages):
  im=Image.open(p).convert('RGB');im.thumbnail((w-12,h-25));x=(i%4)*w+6;y=(i//4)*h+36;sheet.paste(im,(x,y));draw.text((x,y+im.height+3),f'Page {i+1}',fill='black')
 sheet.save(OUT/f'{id}-overview.jpg',quality=88)
 print(id,len(pages),flush=True)
 return {'id':id,'source':str(src.relative_to(ROOT)),'pages':len(pages),'overview':str((OUT/f'{id}-overview.jpg').relative_to(ROOT)),'visuallyReviewed':False}
with ThreadPoolExecutor(max_workers=4) as pool:result=list(pool.map(render,sorted(ids)))
(OUT/'page-review.json').write_text(json.dumps({'papers':result},indent=2)+'\n')
