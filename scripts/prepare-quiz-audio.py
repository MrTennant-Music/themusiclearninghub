import json,hashlib,os,shutil,re,collections
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import argparse
parser=argparse.ArgumentParser(description='Copy three distinct existing library recordings per concept into the Hub.');parser.add_argument('--source',required=True,type=Path);args=parser.parse_args()
repo=Path(__file__).resolve().parents[1];source=args.source;library=json.loads((repo/'audio-concept-library-data.json').read_text())['concepts'];import subprocess
D=json.loads(subprocess.check_output(['node','-e',"process.stdout.write(JSON.stringify(require('./music-dictionary/music-concepts-data.js')))"],cwd=repo));out=repo/'audio/concept-library';entries=[];gaps=[];hashes={}
norm=lambda s:re.sub('[^a-z0-9]','',s.lower())
def prepare(c):
 matches=[l for l in library if l['level']==c['level'] and norm(l['concept'])==norm(c['name'])]
 candidates=[]
 for l in matches:
  for f in l['files']:
   candidates.append((l,f))
 candidates.sort(key=lambda v:bool(re.search(r'Example|Unnamed',v[1],re.I)))
 chosen=[];seen=set();artists=set()
 # Prefer different named performers before filling any remaining places.
 for diverse in [True,False]:
  for l,f in candidates:
   rel=l['path']+'/'+f;p=source/rel
   artist=re.sub(r'^\d+\.\s*','',f).split(' - ')[0]
   if diverse and artist in artists:continue
   if rel not in hashes:
    try:hashes[rel]=hashlib.sha256(p.read_bytes()).hexdigest()
    except OSError:continue
   digest=hashes[rel]
   if digest in seen:continue
   target=out/rel;target.parent.mkdir(parents=True,exist_ok=True)
   if not target.exists() or hashlib.sha256(target.read_bytes()).hexdigest()!=digest:shutil.copyfile(p,target)
   if hashlib.sha256(target.read_bytes()).hexdigest()!=digest:raise Exception('Copy mismatch '+rel)
   meta=l.get('fileMeta',{}).get(f,{})
   chosen.append({'conceptId':c['id'],'concept':c['name'],'level':c['level'],'category':l['category'],'libraryPath':rel,'path':'audio/concept-library/'+rel,'sha256':digest,'bytes':target.stat().st_size,'duration':meta.get('duration'),'recording':re.sub(r'^\d+\.\s*','',f).rsplit('.',1)[0],'taggedConcepts':meta.get('concepts',[])})
   seen.add(digest);artists.add(artist)
   if len(chosen)==3:break
  if len(chosen)==3:break
 if len(chosen)<3:gaps.append({'conceptId':c['id'],'concept':c['name'],'available':len(chosen),'needed':3,'reason':'Fewer than three distinct recordings in the current synced concept folders.'})
 return chosen
with ThreadPoolExecutor(max_workers=8) as pool:
 for selected in pool.map(prepare,D['concepts']):entries.extend(selected)
manifest={'schemaVersion':1,'source':'Concept Audio Library synced OneDrive files','destination':'audio/concept-library','selectionPolicy':'Three byte-distinct recordings per concept; prefer named recordings and different performers. Existing catalogue concept assignments retained; no claim of full listening re-verification.','entries':entries,'shortfalls':gaps}
p=repo/'music-dictionary/quiz-data/audio-library-selection.json';p.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'concepts':len(D['concepts']),'clips':len(entries),'uniquePaths':len(set(e['path'] for e in entries)),'bytes':sum((repo/p).stat().st_size for p in set(e['path'] for e in entries)),'shortfalls':gaps}))
