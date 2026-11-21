import re,json,urllib.request,hashlib
from pathlib import Path
REV='0958afa6fc50f24639f10ec90b55f2dd8eb7ddf4'
BASE=f'https://raw.githubusercontent.com/Computational-Cognitive-Musicology-Lab/CoCoPops/{REV}/'
PC={'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}
def dur(token):
 m=re.search(r'(\d+)(\.*)',token)
 if not m:return None
 return 4/int(m[1])*sum(.5**i for i in range(len(m[2])+1))
def pitch(token):
 m=re.search(r'([A-Ga-g]+)([#n-]*)',token);assert m,token
 ns,acc=m.groups();octave=3-(len(ns)-1) if ns.isupper() else 4+(len(ns)-1)
 return 12*(octave+1)+PC[ns[0].upper()]+acc.count('#')-acc.count('-')
def symbol(h):
 root,kind=h.replace('-','b').split(':');kind=kind.split('/')[0]
 qual={'maj':'','min':'m','7':'7','min7':'m7','maj7':'maj7','1':'','5':'5','sus4(b7)':'7sus4','sus4':'sus4','sus2':'sus2','dim':'dim','aug':'aug'}
 assert kind in qual,(root,kind)
 return root+qual[kind]
def extract(filename,start,key,mode):
 url=BASE+'Billboard/Data/'+filename;s=urllib.request.urlopen(url).read().decode()
 bar=0;mb=hb=0;notes=[];harm=[];current='-';src=[]
 for line in s.splitlines():
  cs=line.split('\t')
  if line.startswith('='):
   bar=int(re.search(r'\d+',cs[0])[0]);mb=hb=0
   if bar>=start+8:break
   if start<=bar<start+8: harm.append(((bar-start)*4,current))
  elif line.startswith(('*','!')) or not line:continue
  else:
   if len(cs)<3:continue
   if cs[1] not in ('.','N'):current=symbol(cs[1])
   if start<=bar<start+8:
    if cs[1] not in ('.','N'):harm.append(((bar-start)*4+hb,current))
    if cs[2]!='.' and 'r' not in cs[2] and ';' not in cs[2]:
     d=dur(cs[2]);assert d is not None,cs[2]
     n={'beat':(bar-start)*4+mb,'duration':d,'midi':pitch(cs[2]),'velocity':120}
     if (']' in cs[2] or '_' in cs[2]) and notes and notes[-1]['midi']==n['midi'] and abs(notes[-1]['beat']+notes[-1]['duration']-n['beat'])<.001:notes[-1]['duration']+=d
     else:notes.append(n)
   if cs[2]!='.' and (d:=dur(cs[2])) is not None:mb+=d
   if cs[0]!='.' and (d:=dur(cs[0])) is not None:hb+=d
 # Chord changes at the middle of bars are supported by the second-chord editor.
 chords=[]
 for b in range(8):
  def at(t):return [x[1] for x in harm if x[0]<=t+1e-6][-1]
  a,z=at(b*4),at(b*4+2)
  changes=[t for t,c in harm if b*4<t<(b+1)*4 and c!=a]
  assert all(abs(t-(b*4+2))<.001 for t in changes),(filename,b,changes)
  item={'symbol':a,'beats':4,'inversion':0}
  if a!=z:item['secondChord']={'symbol':z,'inversion':0,'octave':4}
  chords.append(item)
 return notes,chords,{'url':url,'revision':REV,'sha256':hashlib.sha256(s.encode()).hexdigest(),'bars':[start,start+7],'licence':'CC BY-NC 4.0','credit':'CoCoPops: Claire Arthur and Nathaniel Condit-Schultz; Billboard melodic/harmonic transcriptions'}

"""Rebuild the sourced eight-bar classroom template bank (standard library only)."""
import re,json,urllib.request,hashlib
from pathlib import Path
OUT=Path(__file__).resolve().parents[2]
items=[]
def add(id,title,artist,group,tempo,key,notes,chords,source,changes,mode='major',timeSignature='4/4',melodyOctave=4):
 top,bottom=map(int,timeSignature.split('/'));length=8*top*4/bottom
 assert len(chords)==8 and notes and all(0<=n['beat']<length and n['beat']+n['duration']<=length+.001 for n in notes)
 assert all(60<=n['midi']<=84 for n in notes),(id,min(n['midi'] for n in notes),max(n['midi'] for n in notes))
 items.append(dict(id=id,title=title,artist=artist,group=group,tempo=tempo,key=key,mode=mode,timeSignature=timeSignature,melodyOctave=melodyOctave,melody=notes,chords=chords,source=source,adaptations=changes))
for id,title,artist,filename,start,tempo,key in [('love-me-do','Love Me Do','The Beatles','TheBeatles_LoveMeDo_1964.hum',9,146,7),('honey-honey','Honey, Honey','ABBA','ABBA_HoneyHoney_1974.hum',5,140,5)]:
 n,c,s=extract(filename,start,key,'major');add(id,title,artist,'Pop',tempo,key,n,c,s,'Eight complete verse bars extracted; ties merged; original pitches, rests and durations retained. Tempo rounded from source bar timestamps. No lyrics imported.')
def chords(symbols):
 return [dict(symbol=x[0] if isinstance(x,list) else x,beats=4,inversion=0,**({'secondChord':dict(symbol=x[1],inversion=0,octave=4)} if isinstance(x,list) else {})) for x in symbols]
def abc_notes(bars,transpose=0):
 # Explicit quarter-note ABC tokens, already normalised to the classroom octave.
 out=[]
 for b,bar in enumerate(bars):
  t=0
  for midi,duration in bar:
   out.append(dict(midi=midi+transpose,beat=b*4+t,duration=duration,velocity=120));t+=duration
  assert t==4,(b,t)
 return out
def source(url,credit):
 raw=urllib.request.urlopen(url).read();return dict(url=url,sha256=hashlib.sha256(raw).hexdigest(),bars=[1,8],licence='Public-domain melody; new classroom harmonisation',credit=credit)
add('ode-to-joy','Ode to Joy','Ludwig van Beethoven','Classical',100,0,abc_notes([
[(64,1),(64,1),(65,1),(67,1)],[(67,1),(65,1),(64,1),(62,1)],[(60,1),(60,1),(62,1),(64,1)],[(64,1.5),(62,.5),(62,2)],
[(64,1),(64,1),(65,1),(67,1)],[(67,1),(65,1),(64,1),(62,1)],[(60,1),(60,1),(62,1),(64,1)],[(62,1.5),(60,.5),(60,2)]]),chords(['C','G7','C','G7','C','G7',['C','G7'],['G7','C']]),source('https://trillian.mit.edu/~jc/music/abc/song/Ode_To_Joy.abc','John Chambers ABC collection; melody by Ludwig van Beethoven'),'First eight bars transposed from G to C. Simple chord accompaniment added by The Music Learning Hub.')
add('frere-jacques','Frère Jacques','Traditional French','Traditional',110,0,abc_notes([
[(60,1),(62,1),(64,1),(60,1)],[(60,1),(62,1),(64,1),(60,1)],[(64,1),(65,1),(67,2)],[(64,1),(65,1),(67,2)],
[(67,.5),(69,.5),(67,.5),(65,.5),(64,1),(60,1)],[(67,.5),(69,.5),(67,.5),(65,.5),(64,1),(60,1)],[(60,1),(55,1),(60,2)],[(60,1),(55,1),(60,2)]],transpose=12),chords(['C','C','C','C','C','C',['G7','C'],['G7','C']]),source('https://trillian.mit.edu/~jc/music/abc/mirror/back.numachi.com/Frere_Jacques.abc','Digital Tradition ABC collection; mirrored by John Chambers'),'Original source pitches and rhythms retained, including the downward fifth to G4 in bars 7–8, within the two-octave keyboard. Simple chord accompaniment added by The Music Learning Hub.')
add('twinkle','Twinkle, Twinkle, Little Star','Traditional French','Traditional',120,0,abc_notes([
[(60,1),(60,1),(67,1),(67,1)],[(69,1),(69,1),(67,2)],[(65,1),(65,1),(64,1),(64,1)],[(62,1),(62,1),(60,2)],
[(67,1),(67,1),(65,1),(65,1)],[(64,1),(64,1),(62,2)],[(67,1),(67,1),(65,1),(65,1)],[(64,1),(64,1),(62,2)]]),chords(['C',['F','C'],['F','C'],['G7','C'],['C','G7'],['C','G7'],['C','G7'],['C','G7']]),source('https://trillian.mit.edu/~jc/music/abc/mirror/musicaviva.com/france/ah-vous-c/ah-vous-c-1.abc','Frank Nordberg / Musica Viva; mirrored by John Chambers'),'First eight written bars of Ah! vous dirai-je, maman, without expanding repeats. Simple chord accompaniment added by The Music Learning Hub.')
# Audited additions: each bar is explicit pitch/duration data, independent of the renderer.
for item in json.loads((OUT/'scripts/composition/template-additions.json').read_text()):
 top,bottom=map(int,item['timeSignature'].split('/'));barBeats=top*4/bottom
 notes=[];tie=False
 for index,bar in enumerate(item['bars']):
  at=0
  for token in bar.split():
   name,length=token.split(':');nextTie=length.endswith('~');length=float(length.rstrip('~'))
   if name!='-':
    match=re.fullmatch(r'([A-G])([#b]?)([0-9])',name);assert match,name
    letter,acc,octave=match.groups();midi=12*(int(octave)+1)+PC[letter]+(1 if acc=='#' else -1 if acc=='b' else 0)
    if tie:
     assert notes[-1]['midi']==midi and abs(notes[-1]['beat']+notes[-1]['duration']-(index*barBeats+at))<.001
     notes[-1]['duration']+=length
    else:notes.append(dict(midi=midi,beat=index*barBeats+at,duration=length,velocity=120))
   else:assert not tie
   tie=nextTie;at+=length
  assert at==barBeats,(item['id'],index+1,at)
 assert not tie
 harmony=[]
 for symbols in item['chords']:
  entry=dict(symbol=symbols[0] if isinstance(symbols,list) else symbols,beats=barBeats,inversion=0)
  if isinstance(symbols,list):entry['secondChord']=dict(symbol=symbols[1],inversion=0,octave=4)
  harmony.append(entry)
 raw=(OUT/'data/composition-templates/sources'/f"{item['id']}.abc").read_bytes()
 provenance=dict(url=item['url'],sha256=hashlib.sha256(raw).hexdigest(),bars=item['sourceBars'],licence='Public-domain melody; credited source transcription',credit=item['credit'])
 add(item['id'],item['title'],item['artist'],item['group'],item['tempo'],item['key'],notes,harmony,provenance,item['adaptations'],mode=item['mode'],timeSignature=item['timeSignature'])
text='/* Generated by scripts/composition/build-templates.py. Source credits accompany every entry. */\n(function(root){const data='+json.dumps(items,ensure_ascii=False,separators=(',',':'))+';if(typeof module!=="undefined"&&module.exports)module.exports=data;else{root.MLH=root.MLH||{};root.MLH.CompositionTemplateData=data;}})(typeof window!=="undefined"?window:globalThis);\n'
(OUT/'composition-template-data.js').write_text(text)
print('Built',len(items),'templates;',sum(len(x['melody']) for x in items),'notes')
