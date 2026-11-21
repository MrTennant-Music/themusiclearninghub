import argparse,base64,concurrent.futures,hashlib,json,re,subprocess,urllib.request
from pathlib import Path
parser=argparse.ArgumentParser(description='Rebuild compressed FluidR3 melody samples from a pinned upstream revision.')
parser.add_argument('--cache',type=Path,required=True)
parser.add_argument('--ffmpeg',required=True)
parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[2]/'audio/composition-melody')
args=parser.parse_args()
base=args.cache.resolve();base.mkdir(parents=True,exist_ok=True)
revision='044fab8e1456bfafc5776e86dfd6bb8697149aef'
programs={'electricpiano':'electric_piano_1','guitar':'acoustic_guitar_nylon','organ':'church_organ','strings':'string_ensemble_1','flute':'flute','marimba':'marimba','brass':'brass_section','synth':'lead_1_square','pad':'pad_1_new_age'}
output=args.output.resolve();output.mkdir(parents=True,exist_ok=True)
def build(pair):
 instrument,upstream=pair
 url=f'https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/{revision}/FluidR3_GM/{upstream}-mp3.js'
 path=base/(upstream+'-mp3.js')
 if not path.exists():path.write_bytes(urllib.request.urlopen(url,timeout=90).read())
 source=path.read_text();samples=dict(re.findall(r'"([A-G](?:b|#)?\d+)"\s*:\s*"data:audio/[^;]+;base64,([^\"]+)"',source))
 def midi(note):
  match=re.fullmatch(r'([A-G])([b#]?)(\d+)',note);letter,acc,octave=match.groups()
  return (int(octave)+1)*12+{'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}[letter]+{'':0,'#':1,'b':-1}[acc]
 folder=output/instrument;folder.mkdir(exist_ok=True);entries=[]
 # Every third semitone through the supported octave controls, with a small
 # margin for imported/previously recorded notes. At most one semitone shift.
 for note,data in samples.items():
  pitch=midi(note)
  if not (36<=pitch<=96 and pitch%3==0):continue
  raw=base/f'{instrument}-{pitch}.mp3';raw.write_bytes(base64.b64decode(data))
  dest=folder/f'{pitch}.m4a'
  if not dest.exists():subprocess.run([args.ffmpeg,'-nostdin','-y','-i',str(raw),'-ac','1','-ar','32000','-c:a','aac','-b:a','64k',str(dest)],check=True,capture_output=True)
  entries.append({'midi':pitch,'file':f'{instrument}/{pitch}.m4a','bytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest()})
 assert len(entries)==21,(instrument,len(entries))
 print(instrument,len(entries),sum(e['bytes'] for e in entries),flush=True)
 return instrument,{'source':url,'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'samples':sorted(entries,key=lambda e:e['midi'])}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:bank=dict(executor.map(build,programs.items()))
(output/'manifest.json').write_text(json.dumps({'revision':revision,'license':'CC-BY-3.0','instruments':bank},indent=2)+'\n')
print('TOTAL',sum(p.stat().st_size for p in output.rglob('*.m4a')),flush=True)
