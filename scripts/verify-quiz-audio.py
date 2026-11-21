import json,subprocess,tempfile,os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
r=Path(__file__).resolve().parents[1];m=json.loads((r/'music-dictionary/quiz-data/audio-library-selection.json').read_text())
def check(e):
 fd,out=tempfile.mkstemp(suffix='.wav');os.close(fd);os.unlink(out)
 try:
  p=subprocess.run(['/usr/bin/afconvert','-f','WAVE','-d','LEI16',str(r/e['path']),out],capture_output=True,text=True,timeout=30)
  return {'path':e['path'],'decoded':p.returncode==0,'error':p.stderr.strip() if p.returncode else None}
 except Exception as x:return {'path':e['path'],'decoded':False,'error':str(x)}
 finally:
  if os.path.exists(out):os.unlink(out)
with ThreadPoolExecutor(max_workers=8) as pool:checks=list(pool.map(check,m['entries']))
result={'files':len(checks),'passed':sum(c['decoded'] for c in checks),'failed':[c for c in checks if not c['decoded']]};(r/'music-dictionary/quiz-data/audio-file-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
