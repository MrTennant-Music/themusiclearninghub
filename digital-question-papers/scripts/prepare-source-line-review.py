"""Render complete exact-match paragraph source crops; no review claims."""
import hashlib,json,math,subprocess,os
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from PIL import Image,ImageDraw
R=Path(__file__).resolve().parents[2];A=R/'digital-question-papers/audit/2026-11-05';O=R/os.environ.get('AUDIT_OUTPUT','maintenance/reference/past-paper-source-line-review');O.mkdir(parents=True,exist_ok=True);assert not (O/'review-ledger.json').exists()
rows=json.loads(((A/os.environ['AUDIT_INPUT'] if 'AUDIT_INPUT' in os.environ else R/'digital-question-papers/tests/fixtures/source/source-line-break-candidates.json')).read_text())['rows'];pop=Path.home()/'.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/poppler/bin/pdftoppm'
def render(args):
 i,r=args;pages=sorted(set(f['page'] for f in r['sourceRows']));assert len(pages)==1,'Review cross-page paragraphs separately'
 b=[min(f['box'][0] for f in r['sourceRows']),min(f['box'][1] for f in r['sourceRows']),max(f['box'][2] for f in r['sourceRows']),max(f['box'][3] for f in r['sourceRows'])];k=300/72;x,y=max(0,b[0]-3),max(0,b[1]-3);p=O/f'paragraph-{i+1:03}'
 subprocess.run([str(pop),'-f',str(pages[0]),'-l',str(pages[0]),'-r','300','-x',str(math.floor(x*k)),'-y',str(math.floor(y*k)),'-W',str(math.ceil((b[2]-x+3)*k)),'-H',str(math.ceil((b[3]-y+3)*k)),'-singlefile','-png',str(R/r['source']),str(p)],check=True,stderr=subprocess.PIPE)
 return {'index':i+1,'paper':r['paper'],'question':r['question'],'text':r['text'],'sourcePage':pages[0],'image':str(p.with_suffix('.png').relative_to(R)),'sha256':hashlib.sha256(p.with_suffix('.png').read_bytes()).hexdigest(),'actuallyViewed':False}
with ThreadPoolExecutor(max_workers=4) as pool:records=list(pool.map(render,enumerate(rows)))
sheets=[];items=[];heights=[0,0]
def flush():
 if not items:return
 im=Image.new('RGB',(1960,max(heights)),'#ddd');d=ImageDraw.Draw(im)
 for r,crop,c,y in items:im.paste(crop,(c*980+8,y+30));d.text((c*980+8,y+8),f"{r['index']:03} {r['paper']} {r['question']} | official p{r['sourcePage']}",fill='black')
 p=O/f'sheet-{len(sheets)+1:03}.png';im.save(p);sheets.append({'image':str(p.relative_to(R)),'indices':[r['index'] for r,_,_,_ in items],'actuallyViewed':False})
for r in records:
 im=Image.open(R/r['image']).convert('RGB');im.thumbnail((956,500));c=0 if heights[0]<=heights[1] else 1
 if heights[c]+im.height+40>1300:flush();items=[];heights=[0,0];c=0
 items.append((r,im.copy(),c,heights[c]));heights[c]+=im.height+40
flush();(O/'review-ledger.json').write_text(json.dumps({'scope':'Complete official paragraph crops at 300 dpi for exact-match line-break candidates. Each source occurrence retains its boundary evidence. Rendering is not review.','paragraphs':records,'sheets':sheets},indent=2)+'\n');print(len(records),'paragraphs;',len(sheets),'review sheets')
