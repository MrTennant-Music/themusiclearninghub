"""Prepare source-hashed 5ms waveform plots; review every candidate before editing markers."""
import json,subprocess,hashlib,math,argparse
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
parser=argparse.ArgumentParser(description='Render complete-track waveform onset candidates for explicit review; this does not listen or apply corrections.')
parser.add_argument('--base',default='maintenance/generated/past-paper-a176-audio');parser.add_argument('--selection',default='refine-selection.json');parser.add_argument('--review',default='refine-review.json');parser.add_argument('--output',default='waveform-review');parser.add_argument('--ffmpeg',required=True);args=parser.parse_args()
B=Path(args.base);m=json.loads((B/'manifest.json').read_text());tracks={(t['paperId'],t['questionId'],t['clipIndex']):t for t in m['tracks']};selected=json.loads((B/args.selection).read_text());rows=json.loads((B/args.review).read_text());key=lambda r:(r['paperId'],r['questionId'],r['clipIndex'],r['markerIndex']);orig={key(r):r for r in selected};out=B/args.output;assert not (out/'review.json').exists(), 'Use a new output directory to preserve the prior review ledger';out.mkdir(parents=True,exist_ok=True);ff=args.ffmpeg;records=[];pictures=[];decoded_source=None;decoded_samples=None
for r in rows:
 if r['cueStart'] is None:continue
 t=tracks[key(r)[:3]];cue=r['cueStart'];start=max(0,cue-1.4)
 if t['source']!=decoded_source:
  p=subprocess.run([ff,'-v','error','-i',t['source'],'-ac','1','-ar','16000','-f','f32le','-'],check=True,capture_output=True);decoded_samples=np.frombuffer(p.stdout,dtype='<f4');decoded_source=t['source']
 full=decoded_samples;a=full[round(start*16000):round((start+4.5)*16000)];rms=np.sqrt(np.mean(a[:len(a)//80*80].reshape(-1,80)**2,axis=1));db=20*np.log10(np.maximum(rms,1e-9));active=db>=-45;edges=np.diff(np.r_[True,active,True].astype(np.int8));beg=np.flatnonzero(edges==-1);end=np.flatnonzero(edges==1);bounds=[start+e*.005 for s,e in zip(beg,end) if (e-s)*.005>=.08 and -.5<=start+e*.005-cue<=2];bound=min(bounds,key=lambda v:abs(v-cue)) if bounds else None
 hard_onset=bound
 if bound is not None:
  soft_edges=np.diff(np.r_[True,db>=-60,True].astype(np.int8));soft_beg=np.flatnonzero(soft_edges==-1);soft_end=np.flatnonzero(soft_edges==1)
  attacks=[start+e*.005 for s,e in zip(soft_beg,soft_end) if (e-s)*.005>=.08 and bound-.35<=start+e*.005<=bound]
  if attacks:bound=min(attacks)
 old=orig[key(r)]['time'];recommended=round(max(0,bound if bound is not None else cue)-.15,2);rec={**r,'oldTime':old,'waveformOnset':bound,'mainMinus45DbOnset':hard_onset,'recommendedMarker':recommended,'waveformSourceSha256':hashlib.sha256(Path(t['source']).read_bytes()).hexdigest(),'decodedFullTrackUsed':True,'rmsWindowStart':start,'rmsDb5ms':[round(float(x),2) for x in db],'actuallyViewed':False};records.append(rec)
 im=Image.new('RGB',(960,235),'white');d=ImageDraw.Draw(im);d.text((8,6),f"{r['paperId']} {r['questionId']} m{r['markerIndex']} {r['label']} | old {old:.2f} | cue {cue:.3f} | onset {bound and round(bound,3)} | proposed {recommended}",fill='black');left,top,w,h=40,48,890,135
 for level in [-60,-45,-30,-15,0]:
  y=top+h*(0-level)/90;d.line((left,y,left+w,y),fill='#ddd');d.text((3,y-5),str(level),fill='#555')
 pts=[(left+i/(len(db)-1)*w,top+h*min(90,max(0,-float(v)))/90) for i,v in enumerate(db)];d.line(pts,fill='black',width=1)
 for label,stamp,col in [('ASR',cue,'blue'),('onset',bound,'green'),('old',old,'red'),('new',recommended,'purple')]:
  if stamp is not None and start<=stamp<=start+4.5:
   x=left+(stamp-start)/4.5*w;d.line((x,top,x,top+h),fill=col,width=2);d.text((x+3,top+5+15*['ASR','onset','old','new'].index(label)),label,fill=col)
 d.text((40,190),r['cueText'][:145],fill='black');d.text((40,212),f"{start:.3f}s to {start+4.5:.3f}s | 5ms RMS | -45dB onset + preceding -60dB soft attack | >=80ms quiet | source SHA recorded",fill='#555');pictures.append(im)
for i in range(0,len(pictures),8):
 batch=pictures[i:i+8];sheet=Image.new('RGB',(1920,math.ceil(len(batch)/2)*235),'#ddd')
 for j,im in enumerate(batch):sheet.paste(im,((j%2)*960,(j//2)*235))
 sheet.save(out/f'sheet-{i//8+1:02}.png')
(out/'review.json').write_text(json.dumps({'scope':'Fresh waveform windows around independently re-recognised cue candidates. Candidate onset selection requires explicit review, not automatic product edits.','records':records,'sheetCount':math.ceil(len(pictures)/8)},indent=2)+'\n');print(len(records),'waveforms',math.ceil(len(pictures)/8),'sheets')
