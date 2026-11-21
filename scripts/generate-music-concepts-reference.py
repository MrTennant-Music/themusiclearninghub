import json,re,unicodedata,pdfplumber
from pathlib import Path
root=Path(__file__).resolve().parent.parent
bank=json.loads((root/'data/questions/music-concepts/Music_Concept_Knowledge_Bank_Ultimate_Codex_Edition.json').read_text())
def norm(s):return re.sub('[^a-z0-9]','',unicodedata.normalize('NFKD',s).lower())
records=[];tables={};unmatched=[]
dictionary_excluded={'MC-0036','MC-0065','MC-0066','MC-0185'}
with pdfplumber.open(root/'conceptlist.pdf') as pdf:
 for level,page in zip(reversed(bank['levels']),pdf.pages):
  tables[level]=[]
  headers=[w for w in page.extract_words() if 70<w['top']<80]
  starts=[next(w['x0'] for w in headers if w['text'].startswith(t))-3 for t in ['Styles','Melody','Rhythm','Texture','Timbre']]
  for i,cat in enumerate(bank['categories']):
   txt=norm(page.crop((starts[i],85,starts[i+1] if i<4 else 790,560)).extract_text())
   concepts=[c for c in bank['concepts'] if c['concept_id'] not in dictionary_excluded and c['level']==level and cat in c['categories']]
   def position(c):
    labels=[c['concept']]+c['listed_as']+c.get('aliases',[])
    if c['concept'].startswith('Compound time ('):labels+=['Compound time']
    if c['concept'].startswith('Simple time ('):labels+=['Simple time']
    if c['concept'] in ['Tuned percussion','Untuned percussion']:return txt.find('percussion')+(0.1 if c['concept']=='Tuned percussion' else 0.2)
    if c['concept']=='Ayre / air':labels+=['Ayre or air']
    if c['concept']=='Mode or modal':labels+=['Mode / modal']
    if c['concept']=='Polytonality / bitonality':labels+=['Polytonality or bitonality']
    if c['concept']=='Tone row / note row':labels+=['Tone row or note row']
    direct=norm(c['concept'])
    if direct in txt:return txt.rfind(direct) if c['concept'] in ['Tone','Chord'] else txt.find(direct)
    matches=[txt.find(norm(t)) for t in labels if norm(t) and norm(t) in txt]
    if not matches:unmatched.append((level,cat,c['concept']));return 99999
    return min(matches)
   tables[level].append([c['concept_id'] for c in sorted(concepts,key=position)])
# Disambiguate short terms that also occur inside other concept names.
for lvl,cat,name,after in [('National 3','Melody/harmony','Chord','Improvisation'),('National 4','Timbre','Bass','Tenor'),('National 5','Melody/harmony','Tone','Pitch bend')]:
 col=tables[lvl][bank['categories'].index(cat)]
 lookup={c['concept']:c['concept_id'] for c in bank['concepts'] if c['level']==lvl and cat in c['categories']}
 col.remove(lookup[name]);col.insert(col.index(lookup[after])+1,lookup[name])
for c in bank['concepts']:
 if c['concept_id'] in dictionary_excluded:continue
 refs=c['source_audit'].get('source_references',[])
 mus=next((r.get('page_title') for r in refs if 'Musipedia' in r.get('source','')),c['concept'])
 records.append(dict(id=c['concept_id'],name=c['concept'],level=c['level'],categories=c['categories'],definition=c['definition'],features=c.get('aural_profile',{}).get('audible_features',[]),aliases=c['aliases'],reference=mus))
# Preserve the established dictionary display label while the canonical source
# entry remains named Percussion.
next(record for record in records if record['id']=='MC-0056')['name']='Percussion (tuned and untuned)'
next(record for record in records if record['id']=='MC-0282')['name']='Tone row or note row'
next(record for record in records if record['id']=='MC-0263')['name']='Ayre or air'
next(record for record in records if record['id']=='MC-0280')['name']='Polytonality or bitonality'
# Dictionary-only listening additions preserve the original source bank for other activities.
listening_additions=json.loads((root/'music-dictionary/music-concepts-listening-additions.json').read_text())['concepts']
assert (set(listening_additions)-dictionary_excluded).issubset({record['id'] for record in records})
for record in records:
 if record['id'] in listening_additions:
  addition=listening_additions[record['id']]['addition']
  record['definition']+=' '+addition
# Retain explicit Dictionary wording changes when rebuilding from the historical source.
overrides=json.loads((root/'music-dictionary/music-concepts-definition-overrides.json').read_text())['concepts']
for record in records:
 if record['id'] in overrides: record['definition']=overrides[record['id']]

# Each Listen for section has its own concise, manually reviewed wording.
listening_cues=json.loads((root/'music-dictionary/music-concepts-listening-cues.json').read_text())['concepts']
assert set(listening_cues)=={record['id'] for record in records}
for record in records:
 record['features']=list(listening_cues[record['id']]['cues'])

legacy=[dict(id='MC-0036',name='Octave',level='National 3',categories=['Texture/structure/form'],definition='The distance between two notes with the same letter name, eight notes apart.',features=[],aliases=[])]
out=dict(levels=bank['levels'],categories=bank['categories'],concepts=records,tables=tables,legacyConcepts=legacy,conceptRedirects={"MC-0185":"MC-0189"})
(root/'music-dictionary/music-concepts-data.js').write_text('/* Reference content derived from the local Music Concept Knowledge Bank. Table ordering follows conceptlist.pdf. */\n(function(root){const data='+json.dumps(out,ensure_ascii=False,indent=2)+';if(typeof module!=="undefined"&&module.exports)module.exports=data;else root.MUSIC_CONCEPTS=data;})(typeof window!=="undefined"?window:globalThis);\n')
print('Unmatched ordering:',unmatched)
