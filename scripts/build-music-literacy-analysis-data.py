"""Aggregate the reviewed, source-linked yearly literacy task inventory."""
import json
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
DATA=json.loads((ROOT/'data/analysis/music-literacy-yearly.json').read_text())
reports=[]
for exam,label in [('N5','National 5'),('H','Higher'),('AH','Advanced Higher')]:
 papers=[p for p in DATA['papers'] if p['exam']==exam]
 tasks=[t for p in papers for t in p['tasks']]
 counts=Counter(t['category'] for t in tasks)
 paper_counts=Counter(c for p in papers for c in {t['category'] for t in p['tasks']})
 r=dict(key=exam,label=label,period=f'{papers[0]["year"]}-{papers[-1]["year"]}',years=[p['year'] for p in papers],papers=len(papers),questions=len(tasks),audio=sum(t['audio_required'] for t in tasks),no_audio=sum(not t['audio_required'] for t in tasks),frequency=sorted(paper_counts.items(),key=lambda v:(-v[1],v[0])),yearly=papers,answers=[],details=[])
 def answer_table(title,basis,values):
  counts=Counter(values)
  r['answers'].append(dict(title=title,basis=basis,denominator=len(values),rows=sorted(counts.items(),key=lambda v:(-v[1],v[0]))))
 if exam in ['N5','H']:
  answer_table('Underlying key','Papers',[p['underlying_key'] for p in papers])
  answer_table('Time signature of the extract','Papers',[p['metre'] for p in papers])
 if exam=='N5':
  answer_table('Cadence answers','Answers',['Perfect' if 'perfect' in t['answer'].lower() and 'imperfect' not in t['answer'].lower() else 'Imperfect' for t in tasks if t['category']=='Cadence identification'])
  answer_table('Interval answers','Answers',['Semitone / 2nd' if 'semitone' in t['answer'].lower() else 'Octave' if 'octave' in t['answer'].lower() else 'Tone / 2nd' for t in tasks if t['category']=='Interval identification'])
  answer_table('Named-pitch answers','Answers',['B-flat','F-sharp','B','D','E'])
  answer_table('Chord-name answers','Answers',['F major','A minor'])
  r['details']=[['Tempo marking',f'{counts["Tempo marking"]} tasks','2015, 2016, 2017, 2022, 2023, 2024 and 2025. Andante / Moderato are common accepted answers; Adagio is accepted in 2015 and 2017.'],['Dynamics',f'{counts["Dynamics"]} tasks','2014: p (quiet is given). 2022: f / mf. 2024: mp / p. 2026: mp; p or mf also accepted.'],['End-repeat sign',f'{counts["Repeat signs"]} tasks','2014, 2023 and 2025.'],['Note-value identification',f'{counts["Note-value identification"]} tasks','2023: 1.5 beats. 2026: 3 beats.']]
 elif exam=='H':
  answer_table('Identified intervals','Answers',[next(v for v in ['4th','5th','6th'] if v in t['answer']) for t in tasks if t['category']=='Interval identification'])
  answer_table('Constructed intervals','Answers',['5th','4th'])
  answer_table('Chord answers','Answers',[v for pair in [('V','VI'),('V','I'),('IV','V'),('V','VI'),('V','VI'),('IV','V'),('IV','I'),('V','VI'),('V','I')] for v in ['Chord '+c for c in pair]])
  r['details']=[['Intervals: identify or construct',f'{sum(any(t["category"] in ["Interval identification","Interval construction"] for t in p["tasks"]) for p in papers)}/{len(papers)} papers','At least one interval operation occurs in every supplied paper.'],['Barline insertion',f'{counts["Barline insertion"]} tasks','2015, 2018 and 2025.'],['Rhythm correction',f'{counts["Rhythm correction"]} tasks','2016, 2018, 2023 and 2024.'],['Rest insertion',f'{counts["Rest insertion"]} tasks','2019, 2023 and 2026.'],['Da capo notation',f'{counts["Da capo notation"]} task','2024.'],['Transposition',f'{paper_counts["Transposition"]}/{len(papers)} papers','One octave lower into bass clef in every supplied paper.']]
 else:
  answer_table('Named-key answers','Answers',[t['answer'] for t in tasks if t['category']=='Key identification'])
  r['skills']=[[name,counts[category]] for name,category in [('Rhythm completion','Rhythm completion'),('Notes and rests','Notes and rests'),('Rest insertion','Rest insertion'),('Time-signature writing','Time signature'),('Tie insertion','Tie insertion'),('Barline insertion','Barline insertion'),('Repeat-sign insertion','Repeat signs')]]
  r['details']=[['Enharmonic rewriting',f'{counts["Enharmonic rewriting"]} tasks / {paper_counts["Enharmonic rewriting"]} papers','Present in each supplied paper from 2016 to 2025; absent in 2026.'],['Accidental insertion',f'{counts["Accidental insertion"]} tasks','2019, 2022, 2023, 2024 and 2026.'],['Clef / octave rewriting',f'{counts["Clef rewriting"]+counts["Octave rewriting"]+counts["Transposition"]} tasks','Same-pitch clef rewriting, octave rewriting and explicit transposition are separate rows in the frequency matrix.'],['Bass-line construction',f'{counts["Bass-line construction"]} tasks','2016, 2017, 2018, 2022 and 2025.'],['Chord identification',f'{counts["Chord identification"]} tasks / {paper_counts["Chord identification"]} papers','2022 and 2026 each contain two separately marked chord tasks; each paper receives one tick in that row.'],['Missing pitch notation',f'{sum(any(t["category"] in ["Missing notes","Notes and rests"] for t in p["tasks"]) for p in papers)}/{len(papers)} papers','Includes the combined notes-and-rests task in 2018.'],['Time-signature writing',f'{counts["Time signature"]} tasks','2018, 2022 and 2026. The 2026 answer is 5/4.'],['Interval identification',f'{counts["Interval identification"]} tasks','2019, 2022, 2024, 2025 and 2026. In 2026 the answer is augmented 4th / tritone.'],['Task scope',f'{len(tasks)} marked tasks','Score-based reading, writing and annotations across several questions. Standalone aural concept and excerpt-version choices are excluded.']]
 reports.append(r)
output=dict(provenance={'source':'data/analysis/music-literacy-yearly.json','scope':DATA['scope'],'annual_matrix_available':True,'year_note':'Only supplied official papers are counted. No 2020 or 2021 papers are present in this collection.'},reports=reports)
(ROOT/'data/analysis/music-literacy-analysis.json').write_text(json.dumps(output,indent=2)+'\n')
for r in reports:print(r['key'],r['papers'],'papers,',r['questions'],'tasks,',r['audio'],'audio-dependent')
