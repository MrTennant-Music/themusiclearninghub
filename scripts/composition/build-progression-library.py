#!/usr/bin/env python3
"""Build auditable, key-compatible bar progressions from McGill Billboard 2.0 (CC0).
Usage: python3 scripts/composition/build-progression-library.py /path/to/McGill-Billboard
Only complete, single-harmony bars are accepted; no chord changes are discarded.
"""
import collections
import hashlib
import json
from pathlib import Path
import re
import sys

SCALES = {'major': [0, 2, 4, 5, 7, 9, 11], 'minor': [0, 2, 3, 5, 7, 8, 10]}
QUALITIES = {'maj': ('', [0,4,7]), 'min': ('m', [0,3,7]), '7': ('7', [0,4,7,10]),
 'maj7': ('maj7', [0,4,7,11]), 'min7': ('m7', [0,3,7,10]), 'dim': ('dim', [0,3,6]),
 'hdim7': ('m7b5', [0,3,6,10]), 'sus4': ('sus4', [0,5,7]), 'sus2': ('sus2', [0,2,7]),
 'maj6': ('6', [0,4,7,9]), 'min6': ('m6', [0,3,7,9]), '5': ('5', [0,7])}
SOURCE = 'https://ddmal.ca/research/The_McGill_Billboard_Project_(Chord_Analysis_Dataset)/'

def pc(text):
 m = re.fullmatch(r'([A-G])([#b]*)', text)
 return (dict(C=0,D=2,E=4,F=5,G=7,A=9,B=11)[m[1]] + m[2].count('#') - m[2].count('b')) % 12 if m else None

def read_song(path):
 text = path.read_text(); meta = dict(re.findall(r'^# (title|artist):\s*(.+)', text, re.M))
 tonic = None; metre = None; previous = None; bars = []
 for number, line in enumerate(text.splitlines(), 1):
  if line.startswith('# tonic:'):
   tonic = pc(line.split(':',1)[1].strip()); bars.append(None); previous = None
  if line.startswith('# metre:'):
   metre = line.split(':',1)[1].strip(); bars.append(None)
  if '|' not in line:
   if line.strip() and not line.startswith('#'): bars.append(None)
   continue
  phrase = []
  for index, bar in enumerate(line.split('|')[1:-1]):
   tokens = bar.strip().split()
   # Do not silently flatten inversions, multiple harmonies, metre changes, rests or unknowns.
   harmony = {x for x in tokens if x != '.'}
   if not harmony and tokens and previous: harmony = {previous}
   if len(harmony) != 1 or tonic is None or metre not in ('3/4','4/4','6/8','12/8'):
    phrase.append(None); previous = None; continue
   token = next(iter(harmony)); match = re.fullmatch(r'([A-G][#b]*):([A-Za-z0-9]+)', token)
   if not match or match[2] not in QUALITIES:
    phrase.append(None); previous = None; continue
   quality, intervals = QUALITIES[match[2]]; offset = (pc(match[1])-tonic)%12
   phrase.append({'offset': offset, 'quality': quality, 'tones': {(offset+x)%12 for x in intervals},
     'line': number, 'bar': index+1, 'tonic': tonic, 'metre': metre})
   previous = token
  repeat = re.match(r'\s*x\s*(\d+)', line.rsplit('|',1)[1])
  bars.extend(phrase * (int(repeat[1]) if repeat else 1))
 return meta, bars, hashlib.sha256(path.read_bytes()).hexdigest()

# These degree patterns are independently specified pedagogical schemas, not copied scores.
# Minor counterparts use natural-minor harmony, not an asserted literal song transcription.
SCHEMAS = [
 ('Doo-wop', 'pop-rock', '1 6 4 5'), ('Doo-wop predominant substitution','pop-rock','1 6 2 5'),
 ('Singer-songwriter','pop-rock','1 5 6 4'), ('Singer-songwriter rotation','pop-rock','6 4 1 5'),
 ('Deceptive rotation','pop-rock','4 1 5 6'), ('Hopscotch','pop-rock','4 5 6 1'),
 ('Hopscotch rotation','pop-rock','6 1 4 5'), ('Doo-wop rotation','pop-rock','4 5 1 6'),
 ('Pachelbel descending thirds','sequence','1 5 6 3 4 1 4 5'),
 ('Descending fifths','sequence','1 4 7 3 6 2 5 1'),
 ('Turnaround','jazz','1 6 2 5'), ('Two-five-one','jazz','2 5 1 1'),
 ('Plagal return','plagal','1 4 1 1'), ('Plagal loop','plagal','1 4 1 4'),
]
REFERENCES = {
 'pop-rock':'https://viva.pressbooks.pub/openmusictheorycopy/chapter/4-chord-schemas/',
 'sequence':'https://viva.pressbooks.pub/openmusictheory/chapter/diatonic-sequences/',
 'jazz':'https://viva.pressbooks.pub/openmusictheory/chapter/substitutions/',
 'plagal':'https://openmusictheory.github.io/popRockHarmony.html'}

def diatonic_quality(scale, degree, seventh=False):
 intervals = tuple((scale[(degree+x)%7]-scale[degree])%12 for x in ([0,2,4,6] if seventh else [0,2,4]))
 return next(q for q, ints in QUALITIES.values() if tuple(ints)==intervals)

def build(root):
 candidates = collections.defaultdict(dict)
 for path in sorted(root.rglob('salami_chords.txt')):
  meta, bars, digest = read_song(path)
  for mode, scale in SCALES.items():
   for length in (4,8,16):
    for start in range(len(bars)-length+1):
     phrase = bars[start:start+length]
     if any(b is None for b in phrase): continue
     if len({b['tonic'] for b in phrase}) != 1 or len({b['metre'] for b in phrase}) != 1: continue
     if len({b['offset'] for b in phrase}) < 3: continue
     # Relative-key reinterpretation preserves every source pitch and chord quality.
     # Require the destination tonic in the phrase; never change major chords to minor to inflate the pool.
     for relative_shift in ([0,3] if mode=='major' else [0,9]):
      normalized = [((b['offset']-relative_shift)%12,b) for b in phrase]
      if not any(offset==0 for offset,b in normalized): continue
      if any(not {(tone-relative_shift)%12 for tone in b['tones']} <= set(scale) for offset,b in normalized): continue
      chords = tuple((scale.index(offset), b['quality']) for offset,b in normalized)
      item = candidates[mode,length].setdefault(chords, {'songs':set(), 'sources':[]})
      song = (meta.get('title','').strip(),meta.get('artist','').strip())
      if song not in item['songs']:
       item['songs'].add(song)
       item['sources'].append({'datasetId':path.parent.name, 'title':song[0], 'artist':song[1],
        'tonic':phrase[0]['tonic'], 'relativeShift':relative_shift,
        'line':phrase[0]['line'], 'bar':phrase[0]['bar'], 'sha256':digest})
 output = []
 for mode, scale in SCALES.items():
  for length in (4,8,16):
   selected = {}; artists = collections.Counter()
   for name, family, degrees in SCHEMAS:
    seq = [int(x)-1 for x in degrees.split()]
    # Do not truncate long schemas into falsely named short ones.
    if len(seq)>length: continue
    for seventh in ([False,True] if family=='jazz' else [False]):
     chords = tuple((seq[i%len(seq)],diatonic_quality(scale,seq[i%len(seq)],seventh)) for i in range(length))
     selected.setdefault(chords, {'name':name+(' sevenths' if seventh else ''), 'family':family,
       'source':{'url':REFERENCES[family], 'adaptation':'Whole-bar schema; repeated to selected length; diatonic to selected mode.'}})
   # Common sequences first. A per-artist ceiling prevents a few songs dominating the collection.
   ranked = sorted(candidates[mode,length].items(),key=lambda pair:(-len(pair[1]['songs']),pair[0]))
   for cap in (3,6,200):
    for chords, item in ranked:
     if len(selected)>=200: break
     if chords in selected: continue
     source = min(item['sources'],key=lambda s:(artists[s['artist']],s['artist'],s['datasetId']))
     if artists[source['artist']]>=cap: continue
     artists[source['artist']]+=1
     selected[chords]={'name':f"{source['title']} — {source['artist']}", 'family':'billboard',
       'source':source, 'songCount':len(item['songs'])}
   if len(selected)!=200: raise ValueError(f'Insufficient distinct {mode} {length}-bar sequences: {len(selected)}')
   for index,(chords,item) in enumerate(selected.items(),1):
    output.append({'id':f'{mode}-{length}-{index:03}', 'mode':mode,'bars':length,'chords':chords,**item})
 return output

if __name__=='__main__':
 entries = build(Path(sys.argv[1]))
 data = {'version':1,'license':'CC0-1.0 (Billboard annotations); independently encoded educational schemas',
  'source':SOURCE,'citation':'Burgoyne, Wild and Fujinaga (2011), An Expert Ground Truth Set for Audio Chord Recognition and Music Analysis, ISMIR, pp. 633-638.','references':REFERENCES,'entries':entries}
 wrapper = "// Generated by scripts/composition/build-progression-library.py; see docs/composition-progressions.md.\n(function(root,factory){const data=factory();if(typeof module==='object'&&module.exports)module.exports=data;if(root){root.MLH=root.MLH||{};root.MLH.CompositionProgressions=data;}})(typeof window!=='undefined'?window:null,function(){return "
 target=Path(__file__).resolve().parents[2]/'composition-progressions.js'
 target.write_text(wrapper+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';});\n')
 print(f'{len(entries)} entries; 200 distinct choices per mode and length; {target.stat().st_size} bytes')
